// src/levels/difficulty.js
// Модификаторы сложности: walk / norm / hard.
// Применяет множитель ходов и очков к конфигу уровня.
// walk — больше ходов, очки без штрафа (1.0); norm — базово; hard — меньше ходов, бонус очков.

export const DIFF_NAMES = { walk: 'прогулка', norm: 'норма', hard: 'вызов' };

export function applyDifficulty(cfg, diff) {
  const base = cfg.moves;
  let moves = base, mul = 1;
  if (diff === 'walk') { moves = Math.ceil(base * 1.3); mul = 1.0; }
  else if (diff === 'hard') { moves = Math.max(8, Math.round(base * 0.8)); mul = 1.5; }
  else { moves = base; mul = 1; }
  return { ...cfg, moves, diffMul: mul, diff };
}

export default { applyDifficulty, DIFF_NAMES };
