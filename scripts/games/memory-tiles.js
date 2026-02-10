import { showToast } from '../ui.js';

function NeonTapRush() {
  let root = null;
  let level = null;
  let activeIndex = 0;
  let hits = 0;
  let misses = 0;
  let timer = null;
  let onComplete = () => {};
  let onStatChange = () => {};

  function clearTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function pickNext() {
    let next = Math.floor(Math.random() * (level.rows * level.cols));
    if (next === activeIndex) {
      next = (next + 1) % (level.rows * level.cols);
    }
    activeIndex = next;
  }

  function render() {
    root.innerHTML = '';
    const info = document.createElement('div');
    info.className = 'chip';
    info.textContent = `Hits ${hits}/${level.targetHits} | Misses ${misses}`;

    const grid = document.createElement('div');
    grid.className = 'board';
    grid.style.gridTemplateColumns = `repeat(${level.cols}, 1fr)`;

    for (let i = 0; i < level.rows * level.cols; i += 1) {
      const btn = document.createElement('button');
      btn.className = `cell ${i === activeIndex ? 'filled' : ''}`;
      btn.textContent = i === activeIndex ? 'R' : '';
      btn.style.fontSize = '16px';
      btn.style.color = 'var(--text)';
      btn.addEventListener('click', () => handleTap(i));
      btn.setAttribute('aria-label', `Target ${i + 1}`);
      grid.appendChild(btn);
    }

    const hint = document.createElement('p');
    hint.style.marginTop = '12px';
    hint.style.color = 'var(--muted)';
    hint.textContent = 'Tap the glowing R as fast as you can.';

    root.appendChild(info);
    root.appendChild(grid);
    root.appendChild(hint);
  }

  function handleTap(index) {
    if (index === activeIndex) {
      hits += 1;
      onStatChange({ moves: hits });
      if (hits >= level.targetHits) {
        clearTimer();
        showToast('Target streak complete.');
        onComplete({ moves: hits, time: null });
        return;
      }
      pickNext();
    } else {
      misses += 1;
    }
    render();
  }

  function startLevel(nextLevel) {
    clearTimer();
    level = nextLevel;
    hits = 0;
    misses = 0;
    activeIndex = 0;
    pickNext();
    onStatChange({ moves: hits });
    render();
    timer = setInterval(() => {
      pickNext();
      render();
    }, 700);
  }

  function mount({ rootElement, onComplete: onDone, onStatChange: onStats }) {
    root = rootElement;
    onComplete = onDone;
    onStatChange = onStats;
  }

  return { mount, startLevel };
}

export { NeonTapRush };
