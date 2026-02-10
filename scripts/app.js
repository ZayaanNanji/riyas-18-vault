import { onRouteChange } from './router.js';
import {
  loadState,
  saveState,
  resetState,
  markCompleted,
  isCompleted,
  unlockVideos,
  isUnlocked,
  getUnlockedCount
} from './storage.js';
import { loadLevels } from './levels-loader.js';
import { showToast, setOfflineIndicator, openModal, closeModal, bindModal, confettiBurst } from './ui.js';
import { NeonBlocks } from './games/neon-blocks.js';
import { EscapeGrid } from './games/escape-grid.js';
import { NeonTapRush } from './games/memory-tiles.js';
import { NeonSequence } from './games/laser-mirrors.js';

const gameMeta = {
  A: { name: 'Neon Blocks', levels: 1, subtitle: 'Place neon pieces to clear lines.' },
  B: { name: 'Escape Grid', levels: 1, subtitle: 'Slide the target block to the exit.' },
  C: { name: 'Neon Tap Rush', levels: 1, subtitle: 'Tap the glowing R to build a streak.' },
  D: { name: 'Neon Sequence', levels: 1, subtitle: 'Repeat the neon beat sequence.' }
};

const state = {
  data: null,
  storage: loadState(),
  engines: {},
  currentGame: 'A',
  currentLevelIndex: 0,
  timer: null,
  elapsed: 0
};

const dom = {
  views: {
    home: document.getElementById('view-home'),
    game: document.getElementById('view-game'),
    vault: document.getElementById('view-vault'),
    about: document.getElementById('view-about')
  },
  navLinks: document.querySelectorAll('.nav__link'),
  gameTitle: document.getElementById('game-title'),
  gameSubtitle: document.getElementById('game-subtitle'),
  levelList: document.getElementById('level-list'),
  gameArea: document.getElementById('game-area'),
  statMoves: document.getElementById('stat-moves'),
  statTime: document.getElementById('stat-time'),
  levelGoal: document.getElementById('level-goal'),
  continueBtn: document.getElementById('continue-btn'),
  resetBtn: document.getElementById('reset-btn'),
  resetBtnAbout: document.getElementById('reset-btn-about'),
  restartBtn: document.getElementById('restart-btn'),
  progressSummary: document.getElementById('progress-summary'),
  vaultSummary: document.getElementById('vault-summary'),
  vaultGrid: document.getElementById('vault-grid')
};

function startTimer(timeLimitSeconds = null) {
  stopTimer();
  state.elapsed = 0;
  dom.statTime.textContent = '0:00';
  state.timer = setInterval(() => {
    state.elapsed += 1;
    const minutes = Math.floor(state.elapsed / 60);
    const seconds = String(state.elapsed % 60).padStart(2, '0');
    dom.statTime.textContent = `${minutes}:${seconds}`;
    if (timeLimitSeconds && state.elapsed >= timeLimitSeconds) {
      stopTimer();
      showToast('Time up! Restart to try again.');
    }
  }, 1000);
}

function stopTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

function setMoves(value) {
  dom.statMoves.textContent = value;
}

function updateProgressUI() {
  const totalLevels = Object.values(gameMeta).reduce((sum, meta) => sum + meta.levels, 0);
  const completed = Object.values(state.storage.completed).reduce((sum, game) => sum + Object.keys(game).length, 0);
  dom.progressSummary.textContent = `${completed} / ${totalLevels} levels`;
  dom.vaultSummary.textContent = `${getUnlockedCount(state.storage)} videos`;
  ['A', 'B', 'C', 'D'].forEach((gameId) => {
    const chip = document.getElementById(`progress-${gameId}`);
    const count = Object.keys(state.storage.completed[gameId]).length;
    chip.textContent = `${count} / ${gameMeta[gameId].levels}`;
  });
}

function updateNav(view) {
  dom.navLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.route === view);
  });
}

function showView(view) {
  Object.entries(dom.views).forEach(([key, section]) => {
    section.hidden = key !== view;
  });
  updateNav(view);
}

function levelId(levelIndex) {
  return `L${String(levelIndex + 1).padStart(2, '0')}`;
}

function videoFilename(gameId, levelIndex, clipIndex) {
  return `assets/videos/${gameId}_L${String(levelIndex + 1).padStart(2, '0')}_${clipIndex}.mp4`;
}

function setupEngines() {
  state.engines = {
    A: NeonBlocks(),
    B: EscapeGrid(),
    C: NeonTapRush(),
    D: NeonSequence()
  };
  Object.values(state.engines).forEach((engine) => {
    engine.mount({
      rootElement: dom.gameArea,
      onComplete: handleLevelComplete,
      onStatChange: ({ moves }) => setMoves(moves)
    });
  });
}

function handleLevelComplete(stats) {
  const gameId = state.currentGame;
  const levelIndex = state.currentLevelIndex;
  const levelKey = levelId(levelIndex);
  if (!isCompleted(state.storage, gameId, levelKey)) {
    markCompleted(state.storage, gameId, levelKey, { ...stats, time: state.elapsed });
    unlockVideos(state.storage, gameId, levelKey, 3);
    saveState(state.storage);
    updateProgressUI();
    renderVault();
    const container = dom.gameArea.closest('.game-stage');
    confettiBurst(container);
    showToast('Level cleared. Vault unlocked.');
    openRewardModal(gameId, levelIndex);
  }
}

function renderLevelList(gameId) {
  dom.levelList.innerHTML = '';
  const levels = state.data[gameId].levels;
  levels.forEach((level, index) => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    const id = levelId(index);
    btn.textContent = `Level ${id}`;
    const completed = isCompleted(state.storage, gameId, id);
    if (completed) {
      const badge = document.createElement('span');
      badge.textContent = 'OK';
      btn.appendChild(badge);
    }
    btn.addEventListener('click', () => {
      window.location.hash = `#/game/${gameId}/${index + 1}`;
      startLevel(gameId, index);
    });
    dom.levelList.appendChild(btn);
  });
}

function setActiveLevel(index) {
  const buttons = dom.levelList.querySelectorAll('.level-btn');
  buttons.forEach((btn, idx) => btn.classList.toggle('active', idx === index));
}

function startLevel(gameId, levelIndex) {
  state.currentGame = gameId;
  state.currentLevelIndex = levelIndex;
  const level = state.data[gameId].levels[levelIndex];
  const engine = state.engines[gameId];
  const meta = gameMeta[gameId];
  dom.gameTitle.textContent = `${meta.name} | Level ${levelId(levelIndex)}`;
  dom.gameSubtitle.textContent = meta.subtitle;
  dom.levelGoal.textContent = level.goalText || 'Goal';
  setActiveLevel(levelIndex);
  setMoves(0);
  const timeLimit = gameId === 'A' ? level.timeLimit || 60 : null;
  startTimer(timeLimit);
  engine.startLevel(level);
}

function renderVault() {
  dom.vaultGrid.innerHTML = '';
  Object.keys(gameMeta).forEach((gameId) => {
    const group = document.createElement('div');
    group.className = 'vault-group';
    const title = document.createElement('h3');
    title.textContent = `${gameMeta[gameId].name} Vault`;
    const tilesWrap = document.createElement('div');
    tilesWrap.className = 'vault-tiles';
    state.data[gameId].levels.forEach((level, index) => {
      const unlocked = isUnlocked(state.storage, gameId, levelId(index));
      for (let clip = 1; clip <= 3; clip += 1) {
        const tile = document.createElement('div');
        tile.className = `vault-tile ${unlocked ? '' : 'locked'}`;
        const img = document.createElement('img');
        img.src = 'assets/images/video-placeholder.svg';
        img.alt = 'Video placeholder';
        const label = document.createElement('span');
        label.textContent = unlocked
          ? `${gameId} ${levelId(index)} - Clip ${clip}`
          : `Beat ${levelId(index)} to unlock`;
        tile.appendChild(img);
        tile.appendChild(label);
        if (unlocked) {
          tile.addEventListener('click', () => openVideo(gameId, index, clip));
        }
        tilesWrap.appendChild(tile);
      }
    });
    group.appendChild(title);
    group.appendChild(tilesWrap);
    dom.vaultGrid.appendChild(group);
  });
}

function openVideo(gameId, levelIndex, clipIndex) {
  const wrapper = document.createElement('div');
  const video = document.createElement('video');
  video.controls = true;
  video.src = videoFilename(gameId, levelIndex, clipIndex);
  const message = document.createElement('p');
  message.style.marginTop = '12px';
  message.style.color = 'var(--muted)';
  message.textContent = 'Replace the placeholder video with your real clip.';
  video.addEventListener('error', () => {
    message.textContent = 'Video file missing. Drop an mp4 at the path shown in README.';
  });
  wrapper.appendChild(video);
  wrapper.appendChild(message);
  openModal(wrapper);
}

function openRewardModal(gameId, levelIndex) {
  const wrapper = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = 'Vault Reward Unlocked';
  title.style.marginBottom = '12px';
  const grid = document.createElement('div');
  grid.className = 'vault-tiles';
  for (let clip = 1; clip <= 3; clip += 1) {
    const tile = document.createElement('div');
    tile.className = 'vault-tile';
    const img = document.createElement('img');
    img.src = 'assets/images/video-placeholder.svg';
    img.alt = 'Video placeholder';
    const label = document.createElement('span');
    label.textContent = `${gameId} ${levelId(levelIndex)} - Clip ${clip}`;
    tile.appendChild(img);
    tile.appendChild(label);
    tile.addEventListener('click', () => openVideo(gameId, levelIndex, clip));
    grid.appendChild(tile);
  }
  wrapper.appendChild(title);
  wrapper.appendChild(grid);
  openModal(wrapper);
}

function bindActions() {
  dom.continueBtn.addEventListener('click', () => {
    const next = findNextIncomplete();
    window.location.hash = `#/game/${next.gameId}/${next.levelIndex + 1}`;
    startLevel(next.gameId, next.levelIndex);
  });
  dom.resetBtn.addEventListener('click', handleReset);
  dom.resetBtnAbout.addEventListener('click', handleReset);
  dom.restartBtn.addEventListener('click', () => startLevel(state.currentGame, state.currentLevelIndex));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
}

function handleReset() {
  const ok = window.confirm('Reset all progress? This cannot be undone.');
  if (!ok) return;
  resetState();
  state.storage = loadState();
  updateProgressUI();
  renderVault();
  showToast('Progress reset.');
}

function findNextIncomplete() {
  for (const gameId of Object.keys(gameMeta)) {
    const levels = state.data[gameId].levels.length;
    for (let index = 0; index < levels; index += 1) {
      if (!isCompleted(state.storage, gameId, levelId(index))) {
        return { gameId, levelIndex: index };
      }
    }
  }
  return { gameId: 'A', levelIndex: 0 };
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
}

function bindOfflineIndicator() {
  setOfflineIndicator(navigator.onLine);
  window.addEventListener('online', () => setOfflineIndicator(true));
  window.addEventListener('offline', () => setOfflineIndicator(false));
}

function handleRoute(route) {
  showView(route.view);
  if (route.view === 'game') {
    const gameId = route.params[0] || 'A';
    renderLevelList(gameId);
    const levelParam = Number(route.params[1] || '1');
    const maxIndex = state.data[gameId].levels.length - 1;
    const levelIndex = Number.isNaN(levelParam) ? 0 : Math.max(0, Math.min(levelParam - 1, maxIndex));
    startLevel(gameId, levelIndex);
  }
  if (route.view === 'vault') {
    renderVault();
  }
}

async function init() {
  bindModal();
  closeModal();
  bindActions();
  bindOfflineIndicator();
  registerServiceWorker();
  state.data = await loadLevels();
  setupEngines();
  updateProgressUI();
  renderVault();
  onRouteChange(handleRoute);
}

init();
