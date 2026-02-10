import { showToast } from '../ui.js';

const boardSize = 8;
const shapes = [
  [[0, 0]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0], [0, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [1, 1], [2, 1]]
];

function createBoard() {
  return Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
}

function randomPiece() {
  return shapes[Math.floor(Math.random() * shapes.length)];
}

function renderBoard(container, board, onCellClick) {
  container.innerHTML = '';
  const boardEl = document.createElement('div');
  boardEl.className = 'board';
  boardEl.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      const btn = document.createElement('button');
      btn.className = `cell ${cell ? 'filled' : ''}`;
      btn.setAttribute('aria-label', `Cell ${x + 1}-${y + 1}`);
      btn.addEventListener('click', () => onCellClick(x, y));
      boardEl.appendChild(btn);
    });
  });
  container.appendChild(boardEl);
  return boardEl;
}

function renderPieces(container, pieces, selectedIndex, onSelect) {
  container.innerHTML = '';
  pieces.forEach((piece, index) => {
    const pieceEl = document.createElement('button');
    pieceEl.className = 'piece';
    pieceEl.setAttribute('aria-label', `Piece ${index + 1}`);
    const width = Math.max(...piece.map((p) => p[0])) + 1;
    const height = Math.max(...piece.map((p) => p[1])) + 1;
    pieceEl.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    pieceEl.style.gridTemplateRows = `repeat(${height}, 1fr)`;
    piece.forEach(([px, py]) => {
      const cell = document.createElement('div');
      cell.className = 'piece-cell';
      cell.style.gridColumn = px + 1;
      cell.style.gridRow = py + 1;
      pieceEl.appendChild(cell);
    });
    if (index === selectedIndex) pieceEl.style.outline = '2px solid var(--neon)';
    pieceEl.addEventListener('click', () => onSelect(index));
    container.appendChild(pieceEl);
  });
}

function NeonBlocks() {
  let currentLevel = null;
  let board = createBoard();
  let score = 0;
  let linesCleared = 0;
  let piecesUsed = 0;
  let selectedIndex = 0;
  let pieces = [];
  let root = null;
  let onComplete = () => {};
  let onStatChange = () => {};

  function updateStats() {
    onStatChange({ moves: piecesUsed, score, lines: linesCleared });
  }

  function canPlace(piece, x, y) {
    return piece.every(([px, py]) => {
      const nx = x + px;
      const ny = y + py;
      return nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[ny][nx] === 0;
    });
  }

  function placePiece(piece, x, y) {
    piece.forEach(([px, py]) => {
      board[y + py][x + px] = 1;
    });
  }

  function clearLines() {
    let cleared = 0;
    for (let y = boardSize - 1; y >= 0; y -= 1) {
      if (board[y].every((cell) => cell === 1)) {
        board.splice(y, 1);
        board.unshift(Array(boardSize).fill(0));
        cleared += 1;
        y += 1;
      }
    }
    for (let x = boardSize - 1; x >= 0; x -= 1) {
      if (board.every((row) => row[x] === 1)) {
        board.forEach((row) => row.splice(x, 1));
        board.forEach((row) => row.splice(x, 0, 0));
        cleared += 1;
        x += 1;
      }
    }
    if (cleared) {
      linesCleared += cleared;
      score += cleared * 10;
      showToast(`Lines cleared: ${cleared}`);
    }
  }

  function checkWin() {
    if (!currentLevel) return false;
    const goalScore = currentLevel.goal.score || 0;
    const goalLines = currentLevel.goal.lines || 0;
    return score >= goalScore && linesCleared >= goalLines;
  }

  function handleCellClick(x, y) {
    const piece = pieces[selectedIndex];
    if (!piece) return;
    if (!canPlace(piece, x, y)) {
      showToast('Cannot place there.');
      return;
    }
    placePiece(piece, x, y);
    pieces.splice(selectedIndex, 1);
    pieces.push(randomPiece());
    piecesUsed += 1;
    score += piece.length;
    clearLines();
    updateStats();
    render();
    if (checkWin()) {
      onComplete({ moves: piecesUsed, time: null });
    } else if (piecesUsed >= currentLevel.maxPieces) {
      showToast('Out of pieces. Restart to try again.');
    }
  }

  function render() {
    root.innerHTML = '';
    const info = document.createElement('div');
    info.className = 'chip';
    info.textContent = `Score ${score} | Lines ${linesCleared} | Pieces ${piecesUsed}/${currentLevel.maxPieces}`;
    const boardWrap = document.createElement('div');
    renderBoard(boardWrap, board, handleCellClick);
    const piecesWrap = document.createElement('div');
    piecesWrap.className = 'pieces';
    renderPieces(piecesWrap, pieces, selectedIndex, (index) => {
      selectedIndex = index;
      render();
    });
    root.appendChild(info);
    root.appendChild(boardWrap);
    root.appendChild(piecesWrap);
  }

  function startLevel(level) {
    currentLevel = level;
    board = createBoard();
    score = 0;
    linesCleared = 0;
    piecesUsed = 0;
    selectedIndex = 0;
    pieces = [randomPiece(), randomPiece(), randomPiece()];
    updateStats();
    render();
  }

  function mount({ rootElement, onComplete: onDone, onStatChange: onStats }) {
    root = rootElement;
    onComplete = onDone;
    onStatChange = onStats;
  }

  return { mount, startLevel };
}

export { NeonBlocks };
