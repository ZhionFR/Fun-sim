export const icon = '🐍';
export const title = 'Snake Couple';
export const description = 'Two snakes, side by side. Left: WASD / ZQSD — Right: IJKL / Arrow keys.';

const CELL = 15;
const COLS = 20;
const ROWS = 20;
const TICK_MS = 120;

let el = null;
let animFrame = null;
let countdownTimer = null;
let lastTick = 0;
let snakes = [];

function randFood(cells) {
  const occupied = new Set(cells.map(c => `${c.x},${c.y}`));
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (occupied.has(`${pos.x},${pos.y}`));
  return pos;
}

function makeSnake(canvas, color) {
  const ctx = canvas.getContext('2d');
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  const cells = [{ x: startX, y: startY }];
  return { cells, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, score: 0, alive: true, ctx, canvas, food: randFood(cells), color };
}

function draw(snake) {
  const { ctx, canvas, cells, food, score, alive, color } = snake;
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
  }

  ctx.fillStyle = '#ff4d6d';
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 1, 0, Math.PI * 2);
  ctx.fill();

  cells.forEach((c, i) => {
    ctx.fillStyle = i === 0 ? color.head : color.body;
    ctx.fillRect(c.x * CELL + 1, c.y * CELL + 1, CELL - 2, CELL - 2);
  });

  if (!alive) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff4d6d';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2 - 10);
    ctx.fillStyle = '#e0e0f0';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 14);
  }
}

function drawCountdown(n) {
  snakes.forEach(({ ctx, canvas }) => {
    const W = canvas.width;
    const H = canvas.height;
    draw(snakes.find(s => s.canvas === canvas));
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e0e0f0';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n, W / 2, H / 2);
    ctx.textBaseline = 'alphabetic';
  });
}

function updateScore() {
  const el2 = el && el.querySelector('#snk-score');
  if (el2) el2.textContent = `(${snakes[0].score};${snakes[1].score})`;
}

function tickSnake(snake) {
  if (!snake.alive) return;

  snake.dir = snake.nextDir;
  const head = snake.cells[0];
  const next = { x: head.x + snake.dir.x, y: head.y + snake.dir.y };

  if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
    snake.alive = false;
    return;
  }
  if (snake.cells.some(c => c.x === next.x && c.y === next.y)) {
    snake.alive = false;
    return;
  }

  snake.cells.unshift(next);
  if (next.x === snake.food.x && next.y === snake.food.y) {
    snake.score++;
    snake.food = randFood(snake.cells);
  } else {
    snake.cells.pop();
  }
}

function showRestartBtn() {
  const btn = el && el.querySelector('#snk-start');
  if (!btn) return;
  btn.textContent = 'Restart (Space)';
  btn.style.display = '';
}

function loop(ts) {
  if (ts - lastTick >= TICK_MS) {
    lastTick = ts;
    snakes.forEach(tickSnake);
    if (snakes.some(s => !s.alive)) snakes.forEach(s => { s.alive = false; });
  }
  snakes.forEach(draw);
  updateScore();

  if (snakes.some(s => s.alive)) {
    animFrame = requestAnimationFrame(loop);
  } else {
    showRestartBtn();
  }
}

function setDir(snake, dx, dy) {
  if (snake.dir.x === -dx && snake.dir.y === -dy) return;
  snake.nextDir = { x: dx, y: dy };
}

function isGameOver() {
  return snakes.length > 0 && snakes.every(s => !s.alive);
}

function onKey(e) {
  if (e.key === ' ') {
    if (isGameOver()) { e.preventDefault(); startGame(); }
    return;
  }
  if (!snakes.length) return;
  const [L, R] = snakes;

  switch (e.key) {
    case 'w': case 'W': case 'z': case 'Z': setDir(L, 0, -1); break;
    case 's': case 'S':                      setDir(L, 0,  1); break;
    case 'a': case 'A': case 'q': case 'Q': setDir(L, -1, 0); break;
    case 'd': case 'D':                      setDir(L,  1, 0); break;

    case 'i': case 'I': setDir(R, 0, -1); break;
    case 'k': case 'K': setDir(R, 0,  1); break;
    case 'j': case 'J': setDir(R, -1, 0); break;
    case 'l': case 'L': setDir(R,  1, 0); break;

    case 'ArrowUp':    e.preventDefault(); setDir(R, 0, -1); break;
    case 'ArrowDown':  e.preventDefault(); setDir(R, 0,  1); break;
    case 'ArrowLeft':  e.preventDefault(); setDir(R, -1, 0); break;
    case 'ArrowRight': e.preventDefault(); setDir(R,  1, 0); break;
  }
}

function startGame() {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  if (countdownTimer) { clearTimeout(countdownTimer); countdownTimer = null; }

  const canvases = el.querySelectorAll('.snk-canvas');
  snakes = [
    makeSnake(canvases[0], { head: '#5a52e0', body: '#7a72f0' }),
    makeSnake(canvases[1], { head: '#e05252', body: '#f07a7a' }),
  ];
  updateScore();

  const btn = el && el.querySelector('#snk-start');
  if (btn) btn.style.display = 'none';

  let count = 3;
  drawCountdown(count);

  function step() {
    count--;
    if (count <= 0) {
      countdownTimer = null;
      animFrame = requestAnimationFrame(ts => { lastTick = ts; loop(ts); });
    } else {
      drawCountdown(count);
      countdownTimer = setTimeout(step, 500);
    }
  }
  countdownTimer = setTimeout(step, 500);
}

function dpad(side) {
  return `
    <div class="snk-dpad" data-side="${side}">
      <button class="snk-dp snk-dp--up"   data-dx="0"  data-dy="-1">&#8593;</button>
      <button class="snk-dp snk-dp--left"  data-dx="-1" data-dy="0">&#8592;</button>
      <button class="snk-dp snk-dp--down"  data-dx="0"  data-dy="1">&#8595;</button>
      <button class="snk-dp snk-dp--right" data-dx="1"  data-dy="0">&#8594;</button>
    </div>
  `;
}

function bindDpad() {
  el.querySelectorAll('.snk-dp').forEach(btn => {
    const handler = e => {
      e.preventDefault();
      if (!snakes.length) return;
      const side = btn.closest('.snk-dpad').dataset.side;
      const snake = side === '0' ? snakes[0] : snakes[1];
      setDir(snake, +btn.dataset.dx, +btn.dataset.dy);
    };
    btn.addEventListener('touchstart', handler, { passive: false });
    btn.addEventListener('mousedown', handler);
  });
}

export function mount(container) {
  el = container;
  const W = COLS * CELL;
  const H = ROWS * CELL;

  el.innerHTML = `
    <div class="snk-wrap">
      <div class="snk-panel">
        <div class="snk-label">Snake 1 &mdash; WASD / ZQSD</div>
        <canvas class="snk-canvas" width="${W}" height="${H}"></canvas>
        ${dpad(0)}
      </div>
      <div class="snk-panel">
        <div class="snk-label">Snake 2 &mdash; IJKL / &#8593;&#8595;&#8592;&#8594;</div>
        <canvas class="snk-canvas" width="${W}" height="${H}"></canvas>
        ${dpad(1)}
      </div>
    </div>
    <div class="snk-score-wrap">Score <span id="snk-score" class="snk-score">(0;0)</span></div>
    <button class="btn snk-btn" id="snk-start">Start</button>
  `;

  el.querySelector('#snk-start').addEventListener('click', () => {
    startGame();
    el.querySelector('#snk-start').textContent = 'Restart';
  });

  bindDpad();
  document.addEventListener('keydown', onKey);
}

export function unmount() {
  document.removeEventListener('keydown', onKey);
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  if (countdownTimer) { clearTimeout(countdownTimer); countdownTimer = null; }
  snakes = [];
  el = null;
}
