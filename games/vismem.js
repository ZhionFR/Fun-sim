export const icon = '🧩';
export const title = 'Visual Memory';
export const description = 'Squares flash on a grid — remember which ones lit up and click them all.';

const COLS = 5;
const ROWS = 4;
const TOTAL = COLS * ROWS;
const FLASH_MS = 1200;

let el = null;
let level = 3;       // number of squares to remember
let litCells = [];   // cell indices that were lit
let clicked = [];    // cell indices clicked so far
let phase = 'idle';  // idle | showing | playing | fail

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── render ───────────────────────────────────────────────────────────────────

function renderIdle() {
  el.innerHTML = `
    <p class="vismem-hint">Squares will briefly flash on the grid.<br>Click every square that was lit — order doesn't matter.</p>
    <button class="btn" id="vismem-start">Start — Level ${level}</button>
  `;
  el.querySelector('#vismem-start').addEventListener('click', startLevel);
}

function renderFail() {
  el.innerHTML = `
    <p class="chimp-result chimp-result--fail">Wrong!</p>
    <p class="chimp-hint" style="margin-bottom:24px">You reached level <strong>${level}</strong>.</p>
    <button class="btn" id="vismem-retry">Try Again</button>
  `;
  el.querySelector('#vismem-retry').addEventListener('click', () => {
    level = 3;
    phase = 'idle';
    renderIdle();
  });
}

function renderGrid(opts = {}) {
  const cells = Array(TOTAL).fill(null).map((_, i) => {
    const isLit = litCells.includes(i);
    const isClicked = clicked.includes(i);

    let cls = 'vismem-cell';
    if (phase === 'showing' && isLit) cls += ' is-lit';
    if (phase === 'playing' && isClicked && isLit) cls += ' is-clicked';
    if (phase === 'playing' && isClicked && !isLit) cls += ' is-wrong';
    if (opts.revealAll && isLit && !isClicked) cls += ' is-lit';

    return `<div class="${cls}" data-i="${i}"></div>`;
  }).join('');

  const correct = clicked.filter(i => litCells.includes(i)).length;
  const remaining = litCells.length - correct;
  const statusText = phase === 'showing'
    ? 'Memorise the squares…'
    : phase === 'playing'
      ? `${remaining} square${remaining !== 1 ? 's' : ''} remaining`
      : '';

  el.innerHTML = `
    <div class="chimp-meta">Level ${level} &mdash; ${level} squares</div>
    <div class="vismem-grid">${cells}</div>
    <div class="chimp-status">${statusText}</div>
  `;

  if (phase === 'playing') {
    el.querySelectorAll('.vismem-cell').forEach(c => c.addEventListener('click', onCellClick));
  }
}

// ── game logic ────────────────────────────────────────────────────────────────

function startLevel() {
  litCells = shuffle([...Array(TOTAL).keys()]).slice(0, level);
  clicked = [];
  phase = 'showing';
  renderGrid();

  setTimeout(() => {
    phase = 'playing';
    renderGrid();
  }, FLASH_MS);
}

function onCellClick(e) {
  if (phase !== 'playing') return;
  const i = parseInt(e.currentTarget.dataset.i);
  if (clicked.includes(i)) return;

  clicked.push(i);

  if (!litCells.includes(i)) {
    triggerFail();
    return;
  }

  if (clicked.filter(c => litCells.includes(c)).length === litCells.length) {
    phase = 'idle';
    level++;
    el.querySelectorAll('.vismem-cell').forEach(c => c.classList.add('is-win'));
    setTimeout(() => renderIdle(), 700);
    return;
  }

  renderGrid();
}

function triggerFail() {
  phase = 'fail';
  renderGrid({ revealAll: true });
  setTimeout(renderFail, 1000);
}

// ── lifecycle ─────────────────────────────────────────────────────────────────

export function mount(mountEl) {
  el = mountEl;
  level = 3;
  phase = 'idle';
  renderIdle();
}

export function unmount() {
  el = null;
}
