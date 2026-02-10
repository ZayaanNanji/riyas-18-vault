const STORAGE_KEY = 'riyas18-vault';

const defaultState = {
  completed: {
    A: {},
    B: {},
    C: {},
    D: {}
  },
  best: {
    A: {},
    B: {},
    C: {},
    D: {}
  },
  unlocked: {}
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed };
  } catch (err) {
    console.warn('Storage reset due to error', err);
    return structuredClone(defaultState);
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}

function markCompleted(state, gameId, levelId, stats) {
  state.completed[gameId][levelId] = true;
  state.best[gameId][levelId] = stats;
}

function isCompleted(state, gameId, levelId) {
  return Boolean(state.completed[gameId][levelId]);
}

function unlockVideos(state, gameId, levelId, count = 3) {
  const key = `${gameId}_${levelId}`;
  state.unlocked[key] = Array.from({ length: count }, (_, i) => i + 1);
}

function isUnlocked(state, gameId, levelId) {
  const key = `${gameId}_${levelId}`;
  return Array.isArray(state.unlocked[key]);
}

function getUnlockedCount(state) {
  return Object.values(state.unlocked).reduce((sum, list) => sum + list.length, 0);
}

export {
  loadState,
  saveState,
  resetState,
  markCompleted,
  isCompleted,
  unlockVideos,
  isUnlocked,
  getUnlockedCount
};
