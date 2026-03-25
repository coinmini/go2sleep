/* ========================================
   早睡雪峰 — 治愈系语录浏览 + 打卡记录
   ======================================== */

// ========== 配置 ==========
const CONFIG = Object.freeze({
  API_BASE: '', // 同域，留空即可
  QUOTES_PATH: './data/quotes.json',
  DEFAULT_VOLUME: 0.3,
  FADE_DURATION: 600,
  STAR_COUNT: 80,
  STAR_SPEED: 0.3,
});

// ========== i18n 文案 ==========
const I18N = Object.freeze({
  zh: {
    title: '早睡雪峰',
    subtitle: '66天治愈计划 · 养成早睡好习惯',
    memorial: '纪念张雪峰老师（1984 — 2026.03.24）',
    tab_quotes: '语录浏览',
    tab_checkins: '打卡记录',
    random_btn: '✦ 随机',
    checkin_label: '次提醒打卡',
    checkin_no_streak: '暂无连续打卡',
    checkin_streak: (n) => `连续打卡 ${n} 天`,
    checkin_empty: '还没有打卡记录，等待 Agent 的第一次提醒...',
    checkin_back: '查看全部',
    checkin_user_title: (name) => `${name} 的早睡之旅`,
    day_format: (day, total) => `第 ${day} / ${total} 天`,
    progress_format: (day, total, pct) => `${day} / ${total}（${pct}%）`,
    author: '—— 张雪峰',
    load_fail: '语录加载失败，请刷新页面重试。',
    lang_btn: 'EN',
  },
  en: {
    title: 'Sleep Well, XueFeng',
    subtitle: '66-Day Healing Plan · Build a Better Sleep Habit',
    memorial: 'In memory of Zhang Xuefeng (1984 — 2026.03.24)',
    tab_quotes: 'Quotes',
    tab_checkins: 'Check-ins',
    random_btn: '✦ Random',
    checkin_label: 'reminders sent',
    checkin_no_streak: 'No streak yet',
    checkin_streak: (n) => `${n}-day streak`,
    checkin_empty: 'No check-ins yet. Waiting for the first agent reminder...',
    checkin_back: 'View all',
    checkin_user_title: (name) => `${name}'s Sleep Journey`,
    day_format: (day, total) => `Day ${day} / ${total}`,
    progress_format: (day, total, pct) => `${day} / ${total} (${pct}%)`,
    author: '— Zhang Xuefeng',
    load_fail: 'Failed to load quotes. Please refresh.',
    lang_btn: '中',
  },
});

const t = (key, ...args) => {
  const lang = state.get().lang;
  const val = I18N[lang][key];
  return typeof val === 'function' ? val(...args) : val;
};

// ========== 状态管理（不可变模式） ==========
const createState = (initial) => {
  let current = Object.freeze({ ...initial });
  const listeners = [];

  return Object.freeze({
    get: () => current,
    set: (updater) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      current = Object.freeze({ ...current, ...next });
      listeners.forEach((fn) => fn(current));
    },
    subscribe: (fn) => {
      listeners.push(fn);
      return () => {
        const idx = listeners.indexOf(fn);
        if (idx > -1) listeners.splice(idx, 1);
      };
    },
  });
};

const state = createState({
  quotes: [],
  currentIndex: 0,
  activeTab: 'quotes',
  checkins: [],
  checkinSummary: { total: 0, streak: 0 },
  isPlaying: false,
  loaded: false,
  lang: 'zh',
});

// ========== 数据加载 ==========
const loadQuotes = async () => {
  try {
    const response = await fetch(CONFIG.QUOTES_PATH);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Object.freeze(data);
  } catch (err) {
    console.error('加载语录失败:', err);
    return null;
  }
};

const loadCheckins = async (user) => {
  try {
    const url = user
      ? `${CONFIG.API_BASE}/api/checkins?user=${encodeURIComponent(user)}`
      : `${CONFIG.API_BASE}/api/checkins`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Object.freeze(data);
  } catch (err) {
    console.error('加载打卡记录失败:', err);
    return { total: 0, streak: 0, records: [] };
  }
};

// ========== 语录导航 ==========
const getQuote = (quotes, index) => {
  const safeIndex = Math.max(0, Math.min(index, quotes.length - 1));
  return Object.freeze({ ...quotes[safeIndex], _index: safeIndex });
};

const getRandomIndex = (total, currentIndex) => {
  if (total <= 1) return 0;
  let next;
  do {
    next = Math.floor(Math.random() * total);
  } while (next === currentIndex);
  return next;
};

// ========== 星光粒子动画 ==========
const initStarfield = () => {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const stars = Array.from({ length: CONFIG.STAR_COUNT }, () =>
    Object.freeze({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
      speed: Math.random() * CONFIG.STAR_SPEED + 0.1,
      phase: Math.random() * Math.PI * 2,
    })
  );

  const render = (time) => {
    ctx.clearRect(0, 0, width, height);

    stars.forEach((star) => {
      const twinkle = Math.sin(time * 0.001 * star.speed + star.phase) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 230, 200, ${star.alpha * twinkle})`;
      ctx.fill();
    });

    requestAnimationFrame(render);
  };

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  requestAnimationFrame(render);
};

// ========== DOM 渲染 ==========
const renderQuote = (quote, total) => {
  const card = document.querySelector('.quote-card');
  if (!card) return;

  card.classList.add('fade-out');
  card.classList.remove('fade-in');

  setTimeout(() => {
    const lang = state.get().lang;
    const dayEl = card.querySelector('.quote-day');
    const textEl = card.querySelector('.quote-text');
    const authorEl = card.querySelector('.quote-author');
    const reflectionEl = card.querySelector('.quote-reflection');

    if (dayEl) dayEl.textContent = t('day_format', quote.id, total);
    if (textEl) textEl.textContent = lang === 'en' ? (quote.text_en || quote.text) : quote.text;
    if (authorEl) authorEl.textContent = t('author');
    if (reflectionEl) reflectionEl.textContent = lang === 'en' ? (quote.health_reflection_en || quote.health_reflection) : quote.health_reflection;

    // 更新进度条
    const progressFill = document.querySelector('.progress-bar-fill');
    const progressText = document.querySelector('.progress-text');
    if (progressFill) {
      const pct = Math.round((quote.id / total) * 100);
      progressFill.style.width = `${pct}%`;
      if (progressText) progressText.textContent = t('progress_format', quote.id, total, pct);
    }

    card.classList.remove('fade-out');
    card.classList.add('fade-in');
  }, CONFIG.FADE_DURATION);
};

const renderCheckins = (data) => {
  const countEl = document.querySelector('.checkin-count');
  const streakEl = document.querySelector('.checkin-streak');
  const listEl = document.querySelector('.checkin-list');

  if (countEl) countEl.textContent = data.total || 0;
  if (streakEl) {
    streakEl.textContent = data.streak
      ? t('checkin_streak', data.streak)
      : t('checkin_no_streak');
  }

  if (!listEl) return;

  if (!data.records || data.records.length === 0) {
    listEl.innerHTML = `<li class="checkin-empty">${t('checkin_empty')}</li>`;
    return;
  }

  const sortedRecords = [...data.records].sort(
    (a, b) => new Date(b.reminded_at) - new Date(a.reminded_at)
  );

  listEl.innerHTML = sortedRecords
    .map((record) => {
      const date = new Date(record.reminded_at);
      const timeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      const nickname = record.nickname || 'anonymous';
      const nicknameHtml = `<span class="checkin-item-nickname" data-user="${nickname}">${nickname}</span>`;
      return `
        <li class="checkin-item">
          <div class="checkin-item-header">
            <span>${nicknameHtml} · <span class="checkin-item-day">第 ${record.day}/66 天</span></span>
            <span class="checkin-item-time">${timeStr}</span>
          </div>
          <div class="checkin-item-quote">「${record.quote_text}」</div>
        </li>
      `;
    })
    .join('');

  // 昵称点击事件 → 跳转个人页
  listEl.querySelectorAll('.checkin-item-nickname').forEach((el) => {
    el.addEventListener('click', () => {
      const user = el.dataset.user;
      navigateToUser(user);
    });
  });
};

// ========== Tab 切换 ==========
const switchTab = (tab) => {
  state.set({ activeTab: tab });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  const quoteSection = document.querySelector('.quote-section');
  const checkinSection = document.querySelector('.checkin-section');

  if (quoteSection) {
    quoteSection.classList.toggle('hidden', tab !== 'quotes');
  }
  if (checkinSection) {
    checkinSection.classList.toggle('visible', tab === 'checkins');
  }

  // 用户点击 Tab 即为交互，尝试自动播放音乐
  tryAutoPlay();
};

// ========== 首次交互自动播放音乐 ==========
let hasAutoPlayed = false;

const tryAutoPlay = () => {
  if (hasAutoPlayed) return;
  const audio = document.getElementById('bgm');
  const btn = document.querySelector('.music-btn');
  if (!audio || !btn || !audio.src) return;

  audio.play().then(() => {
    hasAutoPlayed = true;
    btn.classList.add('playing');
    btn.textContent = '♫';
    state.set({ isPlaying: true });
  }).catch(() => {
    // 浏览器仍然阻止，等下次交互再试
  });
};

// ========== 音乐播放器（三首随机切换） ==========
const TRACKS = Object.freeze([
  { src: 'assets/evening-embers.mp3', name: 'Evening Embers' },
  { src: 'assets/healing-field.mp3', name: 'Healing Field in G' },
  { src: 'assets/moonlit-remembrance.mp3', name: 'Moonlit Remembrance' },
]);

const pickRandomTrack = (currentIndex) => {
  if (TRACKS.length <= 1) return 0;
  let next;
  do {
    next = Math.floor(Math.random() * TRACKS.length);
  } while (next === currentIndex);
  return next;
};

const initMusicPlayer = () => {
  const audio = document.getElementById('bgm');
  const btn = document.querySelector('.music-btn');
  const skipBtn = document.querySelector('.music-skip-btn');
  const slider = document.querySelector('.volume-slider');
  const titleEl = document.querySelector('.music-title');

  if (!audio || !btn) return;

  let currentTrackIndex = Math.floor(Math.random() * TRACKS.length);

  const loadTrack = (index) => {
    currentTrackIndex = index;
    const track = TRACKS[index];
    audio.src = track.src;
    audio.load();
    if (titleEl) {
      titleEl.textContent = `♪ ${track.name}`;
      titleEl.classList.add('visible');
      setTimeout(() => titleEl.classList.remove('visible'), 3000);
    }
  };

  audio.volume = CONFIG.DEFAULT_VOLUME;
  loadTrack(currentTrackIndex);

  // 曲目播放结束后自动切换下一首
  audio.addEventListener('ended', () => {
    const nextIndex = pickRandomTrack(currentTrackIndex);
    loadTrack(nextIndex);
    audio.play().catch(() => {});
  });

  if (slider) {
    slider.value = CONFIG.DEFAULT_VOLUME * 100;
    slider.addEventListener('input', (e) => {
      audio.volume = e.target.value / 100;
    });
  }

  // 播放/暂停
  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => {
        btn.classList.add('playing');
        btn.textContent = '♫';
        state.set({ isPlaying: true });
      }).catch((err) => {
        console.warn('音频播放失败:', err);
      });
    } else {
      audio.pause();
      btn.classList.remove('playing');
      btn.textContent = '♪';
      state.set({ isPlaying: false });
    }
  });

  // 切换曲目
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      const wasPlaying = !audio.paused;
      const nextIndex = pickRandomTrack(currentTrackIndex);
      loadTrack(nextIndex);
      if (wasPlaying) {
        audio.play().catch(() => {});
      }
    });
  }
};

// ========== 事件绑定 ==========
const bindEvents = (quotes) => {
  // Tab 切换
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // 上一条
  const prevBtn = document.querySelector('.prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const { currentIndex } = state.get();
      const newIndex = currentIndex > 0 ? currentIndex - 1 : quotes.length - 1;
      state.set({ currentIndex: newIndex });
      renderQuote(getQuote(quotes, newIndex), quotes.length);
    });
  }

  // 下一条
  const nextBtn = document.querySelector('.next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const { currentIndex } = state.get();
      const newIndex = currentIndex < quotes.length - 1 ? currentIndex + 1 : 0;
      state.set({ currentIndex: newIndex });
      renderQuote(getQuote(quotes, newIndex), quotes.length);
    });
  }

  // 随机
  const randomBtn = document.querySelector('.random-btn');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      const { currentIndex } = state.get();
      const newIndex = getRandomIndex(quotes.length, currentIndex);
      state.set({ currentIndex: newIndex });
      renderQuote(getQuote(quotes, newIndex), quotes.length);
    });
  }

  // 键盘导航
  document.addEventListener('keydown', (e) => {
    if (state.get().activeTab !== 'quotes') return;
    const { currentIndex } = state.get();

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = currentIndex > 0 ? currentIndex - 1 : quotes.length - 1;
      state.set({ currentIndex: newIndex });
      renderQuote(getQuote(quotes, newIndex), quotes.length);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = currentIndex < quotes.length - 1 ? currentIndex + 1 : 0;
      state.set({ currentIndex: newIndex });
      renderQuote(getQuote(quotes, newIndex), quotes.length);
    } else if (e.key === 'r' || e.key === 'R') {
      const newIndex = getRandomIndex(quotes.length, currentIndex);
      state.set({ currentIndex: newIndex });
      renderQuote(getQuote(quotes, newIndex), quotes.length);
    }
  });
};

// ========== 初始化 ==========
const init = async () => {
  initStarfield();
  initMusicPlayer();

  // 加载语录
  const data = await loadQuotes();
  if (!data || !data.quotes || data.quotes.length === 0) {
    const card = document.querySelector('.quote-card');
    if (card) {
      card.innerHTML = '<p class="quote-text" style="color: var(--text-dim);">语录加载失败，请刷新页面重试。</p>';
    }
    return;
  }

  const quotes = data.quotes;
  state.set({ quotes, loaded: true });

  // 根据日期决定默认显示哪条（模拟进度）
  const startDate = new Date('2026-03-25');
  const today = new Date();
  const dayDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const defaultIndex = Math.max(0, Math.min(dayDiff, quotes.length - 1));

  state.set({ currentIndex: defaultIndex });
  renderQuote(getQuote(quotes, defaultIndex), quotes.length);
  bindEvents(quotes);

  // 异步加载送花数量和打卡记录
  initFlowers();

  // 检查 URL 参数是否指定了用户
  const urlParams = new URLSearchParams(window.location.search);
  const userParam = urlParams.get('user');

  if (userParam) {
    // 显示个人视图头部
    const headerEl = document.getElementById('checkin-user-header');
    const titleEl = document.getElementById('checkin-user-title');
    if (headerEl && titleEl) {
      titleEl.textContent = t('checkin_user_title', userParam);
      headerEl.style.display = 'block';
    }
    switchTab('checkins');
  }

  // 绑定"查看全部"按钮
  const backBtn = document.getElementById('checkin-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateToUser(null));
  }

  const checkinData = await loadCheckins(userParam || undefined);
  state.set({
    checkins: checkinData.records || [],
    checkinSummary: { total: checkinData.total || 0, streak: checkinData.streak || 0 },
  });
  renderCheckins(checkinData);
};

// ========== 用户视图导航 ==========
const navigateToUser = async (user) => {
  // 更新 URL 参数（不刷新页面）
  const url = new URL(window.location);
  if (user) {
    url.searchParams.set('user', user);
  } else {
    url.searchParams.delete('user');
  }
  window.history.pushState({}, '', url);

  // 显示/隐藏个人视图头部
  const headerEl = document.getElementById('checkin-user-header');
  const titleEl = document.getElementById('checkin-user-title');

  if (user && headerEl && titleEl) {
    titleEl.textContent = t('checkin_user_title', user);
    headerEl.style.display = 'block';
  } else if (headerEl) {
    headerEl.style.display = 'none';
  }

  // 切换到打卡 Tab
  switchTab('checkins');

  // 重新加载该用户的打卡记录
  const checkinData = await loadCheckins(user || undefined);
  state.set({
    checkins: checkinData.records || [],
    checkinSummary: { total: checkinData.total || 0, streak: checkinData.streak || 0 },
  });
  renderCheckins(checkinData);
};

// ========== 送花功能 ==========
const FLOWER_EMOJIS = ['🌸', '🌺', '🌷', '🌹', '💐', '🪷', '🌻'];

const loadFlowers = async () => {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/flowers`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count || 0;
  } catch {
    return 0;
  }
};

const postFlower = async () => {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/flowers`, { method: 'POST' });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

const spawnFloatingFlower = (container) => {
  const el = document.createElement('span');
  el.className = 'flower-float';
  el.textContent = FLOWER_EMOJIS[Math.floor(Math.random() * FLOWER_EMOJIS.length)];
  // 随机水平位置（按钮附近）
  const offsetX = (Math.random() - 0.5) * 80;
  el.style.left = `calc(50% + ${offsetX}px)`;
  el.style.bottom = '0';
  container.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
};

const markAsSent = (btn) => {
  btn.classList.add('sent');
  localStorage.setItem('flower_sent', '1');
};

const initFlowers = async () => {
  const countEl = document.getElementById('flower-count');
  const btn = document.getElementById('flower-btn');
  const container = document.getElementById('flower-container');

  if (!btn || !countEl) return;

  // 加载初始数量
  const initialCount = await loadFlowers();
  let localCount = initialCount;
  countEl.textContent = localCount;

  // 检查是否已送过
  const alreadySent = localStorage.getItem('flower_sent') === '1';
  if (alreadySent) {
    markAsSent(btn);
  }

  btn.addEventListener('click', () => {
    // 已送过则忽略
    if (btn.classList.contains('sent')) return;

    // 乐观更新
    localCount += 1;
    countEl.textContent = localCount;
    markAsSent(btn);

    // 飘花动画
    if (container) spawnFloatingFlower(container);

    // 异步发送到后端
    postFlower().then((data) => {
      if (data && typeof data.count === 'number') {
        localCount = data.count;
        countEl.textContent = localCount;
      }
    });
  });
};

// ========== 语言切换 ==========
const updateI18nTexts = () => {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text) el.textContent = text;
  });
};

const switchLang = () => {
  const current = state.get().lang;
  const next = current === 'zh' ? 'en' : 'zh';
  state.set({ lang: next });

  // 更新切换按钮文字
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = t('lang_btn');

  // 更新所有 data-i18n 元素
  updateI18nTexts();

  // 重新渲染当前语录
  const { quotes, currentIndex } = state.get();
  if (quotes.length > 0) {
    renderQuote(getQuote(quotes, currentIndex), quotes.length);
  }

  // 重新渲染打卡记录
  const { checkins, checkinSummary } = state.get();
  renderCheckins({ total: checkinSummary.total, streak: checkinSummary.streak, records: checkins });
};

// 绑定语言切换按钮
document.addEventListener('DOMContentLoaded', () => {
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.addEventListener('click', switchLang);
});

// 首次点击页面任意位置时自动播放音乐
document.addEventListener('click', () => tryAutoPlay(), { once: true });

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
