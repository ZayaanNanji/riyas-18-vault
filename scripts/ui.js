function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function setOfflineIndicator(online) {
  const chip = document.getElementById('offline-indicator');
  chip.textContent = online ? 'Online' : 'Offline';
  chip.classList.toggle('offline', !online);
}

function openModal(content) {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');
  body.innerHTML = '';
  body.appendChild(content);
  modal.hidden = false;
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.hidden = true;
  const body = document.getElementById('modal-body');
  body.innerHTML = '';
}

function bindModal() {
  const modal = document.getElementById('modal');
  const closeBtn = modal.querySelector('[data-close="modal"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal());
  }
  modal.addEventListener('click', (event) => {
    const target = event.target;
    if (target.dataset.close === 'modal') {
      closeModal();
    }
  });
}

function confettiBurst(container) {
  const confetti = document.createElement('div');
  confetti.className = 'confetti';
  const colors = ['#49f2ff', '#8b5bff', '#f357ff', '#4cffb7'];
  for (let i = 0; i < 24; i += 1) {
    const piece = document.createElement('span');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    confetti.appendChild(piece);
  }
  container.appendChild(confetti);
  setTimeout(() => confetti.remove(), 1300);
}

export { showToast, setOfflineIndicator, openModal, closeModal, bindModal, confettiBurst };
