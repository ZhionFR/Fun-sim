export const icon = '🔢';
export const title = 'Ordered Sequence Memory';
export const description = 'Each level extends the previous sequence by one square — remember it all from the start.';

const BASE_COLS = 4;
const BASE_ROWS = 4;
const FLASH_MS = 500;
const GAP_MS = 150;

let el = null;
let level = 1;
let sequence = [];   // grows cumulatively across levels
let clickIndex = 0;
let phase = 'idle';  // idle | showing | playing | fail

function gridSize(lvl) {
  const extra = Math.floor((lvl - 1) / 5);
  const cols = BASE_COLS + extra;
  const rows = BASE_ROWS + extra;
  return { cols, rows, total: cols * rows };
}

// ── render ───────────────────────────────────────────────────────────────────

function renderIdle() {
  el.innerHTML = `
    <p class="vismem-hint">Each round replays the full sequence with one new square added.<br>Repeat the entire order by clicking.</p>
    <button class="btn" id="ordseq-start">Start</button>
  `;
  el.querySelector('#ordseq-start').addEventListener('click', startLevel);
}

function renderFail() {
  el.innerHTML = `
    <p class="chimp-result chimp-result--fail">Wrong!</p>
    <p class="chimp-hint" style="margin-bottom:24px">You reached level <strong>${level}</strong>.</p>
    <button class="btn" id="ordseq-retry">Try Again</button>
  `;
  el.querySelector('#ordseq-retry').addEventListener('click', () => {
    level = 1;
    sequence = [];
    phase = 'idle';
    renderIdle();
  });
}

function renderGrid() {
  const { cols, total } = gridSize(level);

  const cells = Array(total).fill(null).map((_, i) =>
    `<div class="vismem-cell" data-i="${i}"></div>`
  ).join('');

  const statusText = phase === 'playing'
    ? `Step ${clickIndex + 1} of ${level}`
    : phase === 'showing' ? 'Watch the sequence…' : '';

  el.innerHTML = `
    <div class="chimp-meta">Level ${level} &mdash; ${level} step${level !== 1 ? 's' : ''}</div>
    <div class="vismem-grid" style="grid-template-columns: repeat(${cols}, 1fr)">${cells}</div>
    <div class="chimp-status">${statusText}</div>
  `;

  if (phase === 'playing') {
    el.querySelectorAll('.vismem-cell').forEach(c => c.addEventListener('click', onCellClick));
  }
}

// ── game logic ────────────────────────────────────────────────────────────────

function startLevel() {
  const { total } = gridSize(level);
  const last = sequence.length > 0 ? sequence[sequence.length - 1] : -1;
  const available = [...Array(total).keys()].filter(i => i !== last);
  sequence.push(available[Math.floor(Math.random() * available.length)]);
  clickIndex = 0;
  phase = 'showing';
  renderGrid();
  playSequence();
}

function playSequence() {
  let step = 0;

  function tick() {
    if (!el) return;

    if (step > 0) {
      const prev = el.querySelector(`.vismem-cell[data-i="${sequence[step - 1]}"]`);
      if (prev) prev.classList.remove('is-lit');
    }

    if (step >= sequence.length) {
      phase = 'playing';
      renderGrid();
      return;
    }

    const cell = el.querySelector(`.vismem-cell[data-i="${sequence[step]}"]`);
    if (cell) cell.classList.add('is-lit');
    step++;
    setTimeout(tick, FLASH_MS + GAP_MS);
  }

  setTimeout(tick, 400);
}

function onCellClick(e) {
  if (phase !== 'playing') return;
  const i = parseInt(e.currentTarget.dataset.i);
  const cellEl = e.currentTarget;

  if (i !== sequence[clickIndex]) {
    cellEl.classList.add('is-wrong');
    triggerFail();
    return;
  }

  cellEl.classList.add('is-clicked');
  setTimeout(() => cellEl.classList.remove('is-clicked'), 300);
  cellEl.removeEventListener('click', onCellClick);
  clickIndex++;

  if (clickIndex === level) {
    phase = 'idle';
    level++;
    el.querySelectorAll('.vismem-cell').forEach(c => c.classList.add('is-win'));
    setTimeout(() => startLevel(), 500);
  } else {
    el.querySelector('.chimp-status').textContent = `Step ${clickIndex + 1} of ${level}`;
  }
}

function triggerFail() {
  phase = 'fail';
  sequence.forEach(idx => {
    const c = el.querySelector(`.vismem-cell[data-i="${idx}"]`);
    if (c && !c.classList.contains('is-clicked') && !c.classList.contains('is-wrong')) {
      c.classList.add('is-lit');
    }
  });
  setTimeout(renderFail, 1000);
}

// ── lifecycle ─────────────────────────────────────────────────────────────────

export function mount(mountEl) {
  el = mountEl;
  level = 1;
  sequence = [];
  phase = 'idle';
  renderIdle();
}

export function unmount() {
  el = null;
}
