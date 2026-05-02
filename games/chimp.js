export const icon = '🐒';
export const title = 'Chimp Test';
export const description = 'Numbers flash on a grid — click them in order. After you click 1, the rest disappear!';

const COLS = 5;
const ROWS = 4;
const TOTAL = COLS * ROWS;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildSequence(n) {
  const picks = shuffle([...Array(TOTAL).keys()]).slice(0, n);
  return picks.map((cellIndex, i) => ({ num: i + 1, cellIndex }));
}

let teardown = () => {};

export function mount(mountEl) {
  const el = mountEl;
  let level = 4;
  let sequence = [];
  let nextExpected = 1;
  let phase = 'idle';
  let cancelled = false;

  // ── render ────────────────────────────────────────────────────────────────

  function renderIdle() {
    el.innerHTML = `
      <p class="chimp-hint">Numbers will appear on the grid.<br>Click them in ascending order starting from <strong>1</strong>.</p>
      <button class="btn" id="chimp-start">Start — Level ${level}</button>
    `;
    el.querySelector('#chimp-start').addEventListener('click', startLevel);
  }

  function renderFail() {
    el.innerHTML = `
      <p class="chimp-result chimp-result--fail">Wrong!</p>
      <p class="chimp-hint" style="margin-bottom:24px">You reached level <strong>${level}</strong>.</p>
      <button class="btn" id="chimp-retry">Try Again</button>
    `;
    el.querySelector('#chimp-retry').addEventListener('click', () => {
      level = 4;
      phase = 'idle';
      renderIdle();
    });
  }

  function renderGrid() {
    const cells = Array(TOTAL).fill(null);
    sequence.forEach(({ num, cellIndex }) => { cells[cellIndex] = num; });

    const gridHtml = cells.map((num, i) => {
      const visible = phase === 'showing' && num !== null;
      return `<button type="button" class="chimp-cell${visible ? ' is-lit' : ''}" data-i="${i}" data-num="${num ?? ''}">${visible ? num : ''}</button>`;
    }).join('');

    el.innerHTML = `
      <div class="chimp-meta">Level ${level} &mdash; ${level} numbers</div>
      <div class="chimp-grid">${gridHtml}</div>
      <div class="chimp-status">${phase === 'showing' ? 'Memorise the positions, then click 1 first.' : ''}</div>
    `;

    el.querySelectorAll('.chimp-cell').forEach(c => c.addEventListener('click', onCellClick));
  }

  // ── game logic ────────────────────────────────────────────────────────────

  function startLevel() {
    sequence = buildSequence(level);
    nextExpected = 1;
    phase = 'showing';
    renderGrid();
  }

  function onCellClick(e) {
    if (phase !== 'showing' && phase !== 'playing') return;
    const cellEl = e.currentTarget;
    const num = parseInt(cellEl.dataset.num) || 0;

    if (num !== nextExpected) {
      triggerFail(cellEl);
      return;
    }

    cellEl.classList.add('is-clicked');
    cellEl.textContent = num;

    if (nextExpected === 1 && phase === 'showing') {
      phase = 'playing';
      el.querySelectorAll('.chimp-cell.is-lit').forEach(c => {
        if (c !== cellEl) { c.classList.remove('is-lit'); c.textContent = ''; }
      });
      el.querySelector('.chimp-status').textContent = '';
    }

    nextExpected++;

    if (nextExpected > level) {
      phase = 'idle';
      level++;
      el.querySelectorAll('.chimp-cell').forEach(c => c.classList.add('is-win'));
      setTimeout(() => { if (!cancelled) renderIdle(); }, 700);
    }
  }

  function triggerFail(wrongEl) {
    phase = 'fail';
    wrongEl?.classList.add('is-wrong');

    sequence.forEach(({ num, cellIndex }) => {
      const c = el.querySelector(`.chimp-cell[data-i="${cellIndex}"]`);
      if (c && !c.classList.contains('is-clicked')) {
        c.textContent = num;
        c.classList.add('is-lit');
      }
    });

    setTimeout(() => { if (!cancelled) renderFail(); }, 1000);
  }

  teardown();
  teardown = () => { cancelled = true; };
  renderIdle();
}

export function unmount() {
  teardown();
  teardown = () => {};
}
