import { showToast } from '../ui.js';

function NeonSequence() {
  let root = null;
  let level = null;
  let sequence = [];
  let userIndex = 0;
  let accepting = false;
  let onComplete = () => {};
  let onStatChange = () => {};

  function render() {
    root.innerHTML = '';
    const info = document.createElement('div');
    info.className = 'chip';
    info.textContent = `Step ${userIndex}/${level.sequenceLength}`;

    const grid = document.createElement('div');
    grid.className = 'board';
    grid.style.gridTemplateColumns = `repeat(${level.cols}, 1fr)`;

    for (let i = 0; i < level.rows * level.cols; i += 1) {
      const btn = document.createElement('button');
      btn.className = 'cell';
      btn.setAttribute('data-index', String(i));
      btn.addEventListener('click', () => handleTap(i));
      btn.setAttribute('aria-label', `Pad ${i + 1}`);
      grid.appendChild(btn);
    }

    const hint = document.createElement('p');
    hint.style.marginTop = '12px';
    hint.style.color = 'var(--muted)';
    hint.textContent = 'Watch the neon pattern, then repeat it.';

    root.appendChild(info);
    root.appendChild(grid);
    root.appendChild(hint);
  }

  function flash(index) {
    const cell = root.querySelector(`[data-index="${index}"]`);
    if (!cell) return;
    cell.classList.add('filled');
    setTimeout(() => cell.classList.remove('filled'), level.speedMs);
  }

  async function playSequence() {
    accepting = false;
    userIndex = 0;
    onStatChange({ moves: userIndex });
    for (let i = 0; i < sequence.length; i += 1) {
      flash(sequence[i]);
      await wait(level.speedMs + 120);
    }
    accepting = true;
  }

  function handleTap(index) {
    if (!accepting) return;
    flash(index);
    if (index !== sequence[userIndex]) {
      showToast('Missed beat. Restart to try again.');
      accepting = false;
      return;
    }
    userIndex += 1;
    onStatChange({ moves: userIndex });
    if (userIndex >= sequence.length) {
      accepting = false;
      showToast('Sequence cleared.');
      onComplete({ moves: userIndex, time: null });
    }
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function startLevel(nextLevel) {
    level = nextLevel;
    sequence = Array.from({ length: level.sequenceLength }, () => Math.floor(Math.random() * (level.rows * level.cols)));
    userIndex = 0;
    render();
    playSequence();
  }

  function mount({ rootElement, onComplete: onDone, onStatChange: onStats }) {
    root = rootElement;
    onComplete = onDone;
    onStatChange = onStats;
  }

  return { mount, startLevel };
}

export { NeonSequence };
