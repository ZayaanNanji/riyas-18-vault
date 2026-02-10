const routes = ['home', 'game', 'vault', 'about'];

function parseRoute() {
  const hash = window.location.hash.replace('#/', '');
  if (!hash) return { view: 'home', params: [] };
  const parts = hash.split('/');
  const view = routes.includes(parts[0]) ? parts[0] : 'home';
  return { view, params: parts.slice(1) };
}

function onRouteChange(handler) {
  window.addEventListener('hashchange', () => handler(parseRoute()));
  handler(parseRoute());
}

export { parseRoute, onRouteChange };
