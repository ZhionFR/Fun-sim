import { getHS, trySetHS } from './highscore.js';
export const icon = '🔥';
export const title = 'Mental Calculus (Hard)';
export const description = 'Type the product of two numbers. 30 seconds on the clock — answer as many as you can.';

const TIMER_MS = 30000;

let el = null;
let score = 0;
let timerInterval = null;
let timerStart = null;
let phase = 'idle';
let currentQuestion = null;
let input = '';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion() {
  const x = randInt(10, 99);
  const y = randInt(10, 99);
  return { x, y, correct: x * y };
}

// ── render ────────────────────────────────────────────────────────────────────

function renderIdle() {
  phase = 'idle';
  const hs = getHS('mental-calculus-hard');
  el.innerHTML = `
    <p class="vismem-hint">Type the product of two numbers.<br>You have <strong>30 seconds</strong> — answer as many as you can!</p>
    ${hs ? `<p class="hs-line">Best: ${hs} correct</p>` : ''}
    ${score > 0 ? `<p class="ospan-score">Score: ${score}</p>` : ''}
    <button class="btn" id="mch-start">Start</button>
  `;
  el.querySelector('#mch-start').addEventListener('click', startGame);
}

function renderQuestion() {
  const elapsed = performance.now() - timerStart;
  const ratio = Math.max(0, 1 - elapsed / TIMER_MS);
  const q = currentQuestion;

  el.innerHTML = `
    <div class="ospan-timer-bar" style="margin-bottom:12px">
      <div class="ospan-timer-fill" id="mch-timer-fill" style="width:${ratio * 100}%"></div>
    </div>
    <div class="chimp-meta">Score: ${score}</div>
    <div class="mc-problem">${q.x} &times; ${q.y}</div>
    <div class="mch-display" id="mch-display">${input || '<span class="mch-placeholder">?</span>'}</div>
    <div class="mch-numpad">
      ${[7, 8, 9, 4, 5, 6, 1, 2, 3].map(n =>
        `<button class="mch-key" data-digit="${n}">${n}</button>`
      ).join('')}
      <button class="mch-key mch-key--back" id="mch-back">&#9003;</button>
      <button class="mch-key" data-digit="0">0</button>
      <button class="mch-key mch-key--submit" id="mch-submit">&#10003;</button>
    </div>
  `;

  el.querySelectorAll('.mch-key[data-digit]').forEach(btn =>
    btn.addEventListener('click', () => appendDigit(btn.dataset.digit))
  );
  el.querySelector('#mch-back').addEventListener('click', backspace);
  el.querySelector('#mch-submit').addEventListener('click', submitAnswer);
}

function renderFail(timeout) {
  phase = 'fail';
  document.removeEventListener('keydown', onKeyDown);
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

  if (!timeout) {
    const display = el.querySelector('#mch-display');
    if (display) {
      display.textContent = currentQuestion.correct;
      display.classList.add('mch-display--wrong');
    }
  }

  const isRecord = trySetHS('mental-calculus-hard', score);
  setTimeout(() => {
    if (!el) return;
    el.innerHTML = `
      <p class="chimp-result chimp-result--fail">${timeout ? 'Time up!' : 'Wrong!'}</p>
      ${!timeout ? `<p class="chimp-hint">Answer was <strong>${currentQuestion.correct}</strong></p>` : ''}
      <p class="chimp-hint" style="margin-bottom:24px">You scored <strong>${score}</strong>.${isRecord ? ' <strong>New record!</strong>' : ''}</p>
      <button class="btn" id="mch-retry">Try Again</button>
    `;
    el.querySelector('#mch-retry').addEventListener('click', () => {
      score = 0;
      renderIdle();
    });
  }, timeout ? 0 : 1000);
}

// ── game logic ────────────────────────────────────────────────────────────────

function startGame() {
  score = 0;
  timerStart = performance.now();
  document.addEventListener('keydown', onKeyDown);
  startTimer();
  nextQuestion();
}

function nextQuestion() {
  input = '';
  currentQuestion = makeQuestion();
  phase = 'playing';
  renderQuestion();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!el) { clearInterval(timerInterval); return; }
    const elapsed = performance.now() - timerStart;
    const ratio = Math.max(0, 1 - elapsed / TIMER_MS);
    const fill = el.querySelector('#mch-timer-fill');
    if (fill) fill.style.width = `${ratio * 100}%`;
    if (elapsed >= TIMER_MS) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (phase === 'playing') renderFail(true);
    }
  }, 50);
}

function appendDigit(d) {
  if (input.length >= 5 || phase !== 'playing') return;
  input += d;
  updateDisplay();
}

function backspace() {
  if (phase !== 'playing') return;
  input = input.slice(0, -1);
  updateDisplay();
}

function updateDisplay() {
  const display = el.querySelector('#mch-display');
  if (!display) return;
  display.innerHTML = input || '<span class="mch-placeholder">?</span>';
}

function submitAnswer() {
  if (!input || phase !== 'playing') return;
  const answer = parseInt(input, 10);
  if (answer === currentQuestion.correct) {
    score++;
    nextQuestion();
  } else {
    renderFail(false);
  }
}

function onKeyDown(e) {
  if (phase !== 'playing') return;
  if (e.key >= '0' && e.key <= '9') appendDigit(e.key);
  else if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
  else if (e.key === 'Enter') submitAnswer();
}

// ── lifecycle ─────────────────────────────────────────────────────────────────

export function mount(mountEl) {
  el = mountEl;
  score = 0;
  phase = 'idle';
  renderIdle();
}

export function unmount() {
  document.removeEventListener('keydown', onKeyDown);
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  el = null;
}
