import { getHS, trySetHS } from './highscore.js';
export const icon = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;
export const title = 'Lights Out';
export const description = 'Turn off all the lights. Clicking a cell toggles it and its direct neighbours.';

let el = null;
let level = 1;
let grid = [];
let size = 0;
let moves = 0;

function levelSize(lvl) {
  return 3 + lvl; // level 1 → 4×4, level 2 → 5×5, …
}

function applyToggle(g, s, r, c) {
  const flip = (row, col) => {
    if (row >= 0 && row < s && col >= 0 && col < s) g[row * s + col] ^= 1;
  };
  flip(r, c);
  flip(r - 1, c);
  flip(r + 1, c);
  flip(r, c - 1);
  flip(r, c + 1);
}

function generatePuzzle(s) {
  // Start from solved state, apply 20 random moves — guaranteed solvable
  const g = new Array(s * s).fill(0);
  for (let i = 0; i < 20; i++) {
    applyToggle(g, s, Math.floor(Math.random() * s), Math.floor(Math.random() * s));
  }
  // Edge case: moves cancelled out — force one light on
  if (g.every(v => v === 0)) applyToggle(g, s, 0, 0);
  return g;
}

// ── render ────────────────────────────────────────────────────────────────────

function renderIdle() {
  const hs = getHS('lights-out');
  el.innerHTML = `
    <p class="vismem-hint">Turn off all the lights by clicking cells.<br>Each click toggles that cell and its direct neighbours.</p>
    ${hs ? `<p class="hs-line">Best: level ${hs}</p>` : ''}
    <button class="btn" id="lo-start">Start</button>
  `;
  el.querySelector('#lo-start').addEventListener('click', startLevel);
}

function renderGrid() {
  const cells = grid.map((v, i) => {
    const r = Math.floor(i / size);
    const c = i % size;
    return `<div class="lo-cell${v ? ' is-on' : ''}" data-r="${r}" data-c="${c}"></div>`;
  }).join('');

  el.innerHTML = `
    <div class="chimp-meta">Level ${level} &mdash; ${size}&times;${size} &mdash; Moves: <span id="lo-moves">${moves}</span></div>
    <div class="lo-grid" style="grid-template-columns: repeat(${size}, 1fr)">${cells}</div>
    <p class="lo-hint">Turn off all the lights.</p>
  `;

  el.querySelectorAll('.lo-cell').forEach(c => c.addEventListener('click', onCellClick));
}

function renderWin() {
  const isRecord = trySetHS('lights-out', level);
  el.innerHTML = `
    <p class="chimp-result chimp-result--win">Solved!</p>
    <p class="chimp-hint" style="margin-bottom:24px">Level ${level} cleared in <strong>${moves}</strong> move${moves !== 1 ? 's' : ''}.${isRecord ? ' <strong>New record!</strong>' : ''}</p>
    <button class="btn" id="lo-next">Next Level &rarr;</button>
  `;
  el.querySelector('#lo-next').addEventListener('click', () => {
    level++;
    startLevel();
  });
}

// ── game logic ────────────────────────────────────────────────────────────────

function startLevel() {
  size = levelSize(level);
  grid = generatePuzzle(size);
  moves = 0;
  renderGrid();
}

function onCellClick(e) {
  const r = parseInt(e.currentTarget.dataset.r);
  const c = parseInt(e.currentTarget.dataset.c);
  applyToggle(grid, size, r, c);
  moves++;

  if (grid.every(v => v === 0)) {
    renderWin();
  } else {
    renderGrid();
  }
}

// ── lifecycle ─────────────────────────────────────────────────────────────────

export function mount(mountEl) {
  el = mountEl;
  level = 1;
  renderIdle();
}

export function unmount() {
  el = null;
}
