import { getHS, trySetHS } from './highscore.js';
export const icon = '🧠';
export const title = 'Mental Calculus';
export const description = 'Multiply two numbers in your head and pick the right answer before time runs out.';

const TIMER_MS = 5000;
const CHOICES = 5;

let el = null;
let score = 0;
let timerInterval = null;
let phase = 'idle';
let currentQuestion = null;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQuestion() {
  const x = randInt(10, 99);
  const y = randInt(10, 99);
  const correct = x * y;
  const step = Math.max(10, Math.round(correct * 0.04));

  const choices = new Set([correct]);
  for (const off of shuffle([-4, -3, -2, -1, 1, 2, 3, 4])) {
    if (choices.size >= CHOICES) break;
    const candidate = correct + off * step;
    if (candidate > 0) choices.add(candidate);
  }

  return { x, y, correct, choices: shuffle([...choices]) };
}

// ── render ────────────────────────────────────────────────────────────────────

function renderIdle() {
  phase = 'idle';
  const hs = getHS('mental-calculus');
  el.innerHTML = `
    <p class="vismem-hint">Multiply the two numbers and pick the correct answer<br>before the 5-second timer runs out.</p>
    ${hs ? `<p class="hs-line">Best: ${hs} correct</p>` : ''}
    ${score > 0 ? `<p class="ospan-score">Score: ${score}</p>` : ''}
    <button class="btn" id="mc-start">Start</button>
  `;
  el.querySelector('#mc-start').addEventListener('click', nextQuestion);
}

function renderQuestion() {
  phase = 'playing';
  const q = currentQuestion;

  const btnHtml = q.choices.map(c =>
    `<button class="mc-choice-btn" data-val="${c}">${c}</button>`
  ).join('');

  el.innerHTML = `
    <div class="chimp-meta">Score: ${score}</div>
    <div class="mc-problem">${q.x} &times; ${q.y}</div>
    <div class="mc-choices">${btnHtml}</div>
    <div class="ospan-timer-bar">
      <div class="ospan-timer-fill" id="mc-timer-fill"></div>
    </div>
  `;

  el.querySelectorAll('.mc-choice-btn').forEach(btn =>
    btn.addEventListener('click', () => onChoice(parseInt(btn.dataset.val), btn))
  );

  startTimer();
}

function renderFail(wrongBtn) {
  phase = 'fail';
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

  el.querySelectorAll('.mc-choice-btn').forEach(btn => {
    btn.disabled = true;
    if (parseInt(btn.dataset.val) === currentQuestion.correct) btn.classList.add('mc-correct');
    else if (btn === wrongBtn) btn.classList.add('mc-wrong');
  });

  const bar = el.querySelector('.ospan-timer-bar');
  if (bar) bar.style.visibility = 'hidden';

  const isRecord = trySetHS('mental-calculus', score);
  setTimeout(() => {
    if (!el) return;
    el.innerHTML = `
      <p class="chimp-result chimp-result--fail">${wrongBtn ? 'Wrong!' : 'Time up!'}</p>
      <p class="chimp-hint" style="margin-bottom:24px">You scored <strong>${score}</strong>.${isRecord ? ' <strong>New record!</strong>' : ''}</p>
      <button class="btn" id="mc-retry">Try Again</button>
    `;
    el.querySelector('#mc-retry').addEventListener('click', () => {
      score = 0;
      renderIdle();
    });
  }, 800);
}

// ── game logic ────────────────────────────────────────────────────────────────

function nextQuestion() {
  currentQuestion = makeQuestion();
  renderQuestion();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  const fill = el.querySelector('#mc-timer-fill');
  const start = performance.now();
  timerInterval = setInterval(() => {
    if (!el) { clearInterval(timerInterval); return; }
    const elapsed = performance.now() - start;
    const ratio = Math.max(0, 1 - elapsed / TIMER_MS);
    if (fill) fill.style.width = `${ratio * 100}%`;
    if (elapsed >= TIMER_MS) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (phase === 'playing') renderFail(null);
    }
  }, 50);
}

function onChoice(val, btn) {
  if (phase !== 'playing') return;
  clearInterval(timerInterval);
  timerInterval = null;

  if (val === currentQuestion.correct) {
    btn.classList.add('mc-correct');
    score++;
    setTimeout(nextQuestion, 400);
  } else {
    renderFail(btn);
  }
}

// ── lifecycle ─────────────────────────────────────────────────────────────────

export function mount(mountEl) {
  el = mountEl;
  score = 0;
  phase = 'idle';
  renderIdle();
}

export function unmount() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  el = null;
}
