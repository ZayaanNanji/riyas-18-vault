async function loadLevels() {
  const [a, b, c, d] = await Promise.all([
    fetch('data/levels/neon-blocks.json').then((res) => res.json()),
    fetch('data/levels/escape-grid.json').then((res) => res.json()),
    fetch('data/levels/memory-tiles.json').then((res) => res.json()),
    fetch('data/levels/laser-mirrors.json').then((res) => res.json())
  ]);

  return {
    A: a,
    B: b,
    C: c,
    D: d
  };
}

export { loadLevels };
