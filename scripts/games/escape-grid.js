import { showToast } from '../ui.js';

const gridSize = 6;

function EscapeGrid() {
  let root = null;
  let currentLevel = null;
  let blocks = [];
  let onComplete = () => {};
  let onStatChange = () => {};
  let moves = 0;

  function render() {
    root.innerHTML = '';
    const board = document.createElement('div');
    board.className = 'board';
    board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    board.style.position = 'relative';
    board.style.width = '100%';
    board.style.maxWidth = '420px';
    board.style.aspectRatio = '1 / 1';

    for (let i = 0; i < gridSize * gridSize; i += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      board.appendChild(cell);
    }

    blocks.forEach((block) => {
      const el = document.createElement('div');
      el.className = 'cell filled';
      el.style.position = 'absolute';
      el.style.left = `${(block.x / gridSize) * 100}%`;
      el.style.top = `${(block.y / gridSize) * 100}%`;
      el.style.width = `${(block.w / gridSize) * 100}%`;
      el.style.height = `${(block.h / gridSize) * 100}%`;
      el.style.background = block.id === 'X' ? 'linear-gradient(135deg, #f357ff, #49f2ff)' : 'rgba(73,242,255,0.6)';
      el.style.borderRadius = '8px';
      el.style.cursor = 'grab';
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Block ${block.id}`);
      attachDrag(el, block, board);
      board.appendChild(el);
    });

    const hint = document.createElement('p');
    hint.style.marginTop = '12px';
    hint.style.color = 'var(--muted)';
    hint.textContent = 'Drag blocks to clear the path. Target block is hot pink.';

    root.appendChild(board);
    root.appendChild(hint);
  }

  function attachDrag(el, block, board) {
    let start = null;
    const axis = block.w > block.h ? 'x' : 'y';

    function onPointerDown(event) {
      event.preventDefault();
      start = { x: event.clientX, y: event.clientY, bx: block.x, by: block.y };
      el.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
      if (!start) return;
      const rect = board.getBoundingClientRect();
      const cellSize = rect.width / gridSize;
      const deltaX = Math.round((event.clientX - start.x) / cellSize);
      const deltaY = Math.round((event.clientY - start.y) / cellSize);
      let nextX = start.bx;
      let nextY = start.by;
      if (axis === 'x') {
        nextX = clamp(start.bx + deltaX, 0, gridSize - block.w);
        if (collides(block.id, nextX, block.y)) return;
      } else {
        nextY = clamp(start.by + deltaY, 0, gridSize - block.h);
        if (collides(block.id, block.x, nextY)) return;
      }
      block.x = nextX;
      block.y = nextY;
      updateBlockPosition(el, block);
    }

    function onPointerUp(event) {
      if (!start) return;
      el.releasePointerCapture(event.pointerId);
      start = null;
      moves += 1;
      onStatChange({ moves });
      if (checkWin()) {
        onComplete({ moves, time: null });
      }
    }

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
  }

  function updateBlockPosition(el, block) {
    el.style.left = `${(block.x / gridSize) * 100}%`;
    el.style.top = `${(block.y / gridSize) * 100}%`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function collides(id, nextX, nextY) {
    const current = blocks.find((b) => b.id === id);
    if (!current) return false;
    return blocks.some((b) => {
      if (b.id === id) return false;
      return nextX < b.x + b.w && nextX + current.w > b.x &&
        nextY < b.y + b.h && nextY + current.h > b.y;
    });
  }

  function checkWin() {
    const target = blocks.find((b) => b.id === 'X');
    if (!target) return false;
    if (target.x + target.w === gridSize) {
      showToast('Exit reached!');
      return true;
    }
    return false;
  }

  function startLevel(level) {
    currentLevel = level;
    moves = 0;
    blocks = level.blocks.map((b) => ({ ...b }));
    onStatChange({ moves });
    render();
  }

  function mount({ rootElement, onComplete: onDone, onStatChange: onStats }) {
    root = rootElement;
    onComplete = onDone;
    onStatChange = onStats;
  }

  return { mount, startLevel };
}

export { EscapeGrid };
