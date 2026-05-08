import { getHS, trySetHS } from './highscore.js';
export const icon = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><rect x="8" y="6" width="8" height="3" rx="1"/><circle cx="8" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="17" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="1" fill="currentColor" stroke="none"/></svg>`;
export const title = 'Operation Span';
export const description = 'Solve equations, memorise letters, recall them in order.';

// Standard OSPAN consonant pool (12 letters)
const POOL = ['F', 'H', 'J', 'K', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'Y'];
const LETTER_MS = 1000;
const EQUATION_MS = 2000;
const BUTTON_MS = 3000;

let el = null;
let equationTimer = null;
let span = 2;
let round = 0;
let letters = [];
let equations = [];
let recalled = [];
let totalScore = 0;
let maxPossible = 0;
let phase = 'idle';

// ── helpers ──────────────────────────────────────────────────────────────────

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

function makeEquation() {
  const a = randInt(2, 9), b = randInt(2, 9), c = randInt(1, 9);
  const op = Math.random() < 0.5 ? '+' : '−';
  const correct = op === '+' ? a * b + c : a * b - c;
  const isTrue = Math.random() < 0.5;
  const shown = isTrue ? correct : correct + (Math.random() < 0.5 ? 1 : -1) * randInt(1, 3);
  return { text: `(${a} × ${b}) ${op} ${c} = ${shown}`, answer: isTrue };
}

// ── render helpers ────────────────────────────────────────────────────────────

function renderIdle() {
  phase = 'idle';
  const hs = getHS('ospan');
  el.innerHTML = `
    <p class="ospan-hint">
      Each turn: solve an equation (TRUE / FALSE), then memorise a letter.<br>
      When the round ends, recall all the letters <strong>in order</strong>.
    </p>
    ${hs ? `<p class="hs-line">Best: span ${hs}</p>` : ''}
    ${totalScore > 0 ? `<p class="ospan-score">Score so far: ${totalScore} / ${maxPossible}</p>` : ''}
    <button class="btn" id="ospan-start">Start — Span ${span}</button>
  `;
  el.querySelector('#ospan-start').addEventListener('click', startSpan);
}

function renderEquation() {
  phase = 'equation';
  const eq = equations[round];
  el.innerHTML = `
    <div class="ospan-meta">Item ${round + 1} of ${span}</div>
    <div class="ospan-eq" id="ospan-eq-text">${eq.text}</div>
    <p class="ospan-eq-label" id="ospan-eq-label">Is this correct?</p>
    <div class="ospan-tf-row">
      <button class="btn ospan-tf ospan-tf--true"  id="ospan-true">TRUE</button>
      <button class="btn ospan-tf ospan-tf--false" id="ospan-false">FALSE</button>
    </div>
    <div class="ospan-timer-bar">
      <div class="ospan-timer-fill" id="ospan-timer-fill-1"></div>
    </div>
    <div class="ospan-timer-bar" id="ospan-timer-bar-2" style="visibility:hidden;margin-top:6px">
      <div class="ospan-timer-fill" id="ospan-timer-fill-2" style="width:100%"></div>
    </div>
  `;
  el.querySelector('#ospan-true').addEventListener('click',  () => answerEq(true));
  el.querySelector('#ospan-false').addEventListener('click', () => answerEq(false));

  const fill1 = el.querySelector('#ospan-timer-fill-1');
  const start = performance.now();
  equationTimer = setInterval(() => {
    if (!el) { clearInterval(equationTimer); return; }
    const elapsed = performance.now() - start;
    const ratio = Math.max(0, 1 - elapsed / EQUATION_MS);
    if (fill1) fill1.style.width = `${ratio * 100}%`;
    if (elapsed >= EQUATION_MS) {
      clearInterval(equationTimer);
      equationTimer = null;
      transitionToButtonPhase();
    }
  }, 50);
}

function transitionToButtonPhase() {
  const eqText = el.querySelector('#ospan-eq-text');
  const eqLabel = el.querySelector('#ospan-eq-label');
  if (eqText) eqText.style.visibility = 'hidden';
  if (eqLabel) eqLabel.style.visibility = 'hidden';

  const bar2 = el.querySelector('#ospan-timer-bar-2');
  if (bar2) bar2.style.visibility = 'visible';

  const fill2 = el.querySelector('#ospan-timer-fill-2');
  const start = performance.now();
  equationTimer = setInterval(() => {
    if (!el) { clearInterval(equationTimer); return; }
    const elapsed = performance.now() - start;
    const ratio = Math.max(0, 1 - elapsed / BUTTON_MS);
    if (fill2) fill2.style.width = `${ratio * 100}%`;
    if (elapsed >= BUTTON_MS) {
      clearInterval(equationTimer);
      equationTimer = null;
      renderFail();
    }
  }, 50);
}

function renderLetter() {
  phase = 'letter';
  el.innerHTML = `
    <div class="ospan-meta">Memorise:</div>
    <div class="ospan-big-letter">${letters[round]}</div>
  `;
  setTimeout(() => {
    if (phase !== 'letter') return;
    round++;
    round < span ? renderEquation() : renderRecall();
  }, LETTER_MS);
}

function renderRecall() {
  phase = 'recall';
  recalled = [];

  const btnHtml = POOL.map(l =>
    `<button class="ospan-lbtn" data-l="${l}">${l}</button>`
  ).join('');

  el.innerHTML = `
    <div class="ospan-meta">Recall the ${span} letters in order:</div>
    <div class="ospan-slots" id="ospan-slots">${slots()}</div>
    <div class="ospan-lgrid">${btnHtml}</div>
    <div class="ospan-recall-actions">
      <button class="ospan-clear" id="ospan-clear">Clear</button>
      <button class="btn" id="ospan-submit" disabled>Submit</button>
    </div>
  `;

  el.querySelectorAll('.ospan-lbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (recalled.length >= span) return;
      recalled.push(btn.dataset.l);
      btn.classList.add('is-used');
      btn.disabled = true;
      el.querySelector('#ospan-slots').innerHTML = slots();
      if (recalled.length === span) el.querySelector('#ospan-submit').disabled = false;
    });
  });

  el.querySelector('#ospan-clear').addEventListener('click', () => {
    recalled = [];
    el.querySelectorAll('.ospan-lbtn').forEach(b => { b.classList.remove('is-used'); b.disabled = false; });
    el.querySelector('#ospan-slots').innerHTML = slots();
    el.querySelector('#ospan-submit').disabled = true;
  });

  el.querySelector('#ospan-submit').addEventListener('click', submitRecall);
}

function slots() {
  return letters.map((_, i) =>
    `<span class="ospan-slot${recalled[i] ? ' is-filled' : ''}">${recalled[i] ?? '?'}</span>`
  ).join('');
}

function renderFeedback() {
  phase = 'feedback';
  const letterCorrect = letters.filter((l, i) => recalled[i] === l).length;
  const eqCorrect = equations.filter(eq => eq.userAnswer === eq.answer).length;
  totalScore += letterCorrect;
  maxPossible += span;

  const allRight = letterCorrect === span;

  const seqHtml = letters.map((l, i) => {
    const hit = recalled[i] === l;
    return `<span class="ospan-seq ${hit ? 'is-hit' : 'is-miss'}" title="you typed: ${recalled[i] ?? '—'}">${l}</span>`;
  }).join('');

  el.innerHTML = `
    <div class="ospan-meta">Span ${span} results</div>
    <div class="ospan-fb-row">
      <span>Letters <strong>${letterCorrect}/${span}</strong></span>
      <span>Equations <strong>${eqCorrect}/${span}</strong></span>
    </div>
    <div class="ospan-seq-row">${seqHtml}</div>
    ${allRight
      ? `<p class="ospan-advance">Level up → Span ${span + 1}</p>`
      : `<p class="ospan-hint" style="margin-bottom:16px">Total score: ${totalScore} / ${maxPossible}</p>`
    }
    <button class="btn" id="ospan-next">${allRight ? 'Continue' : 'Try Again'}</button>
  `;

  if (allRight) span++;

  el.querySelector('#ospan-next').addEventListener('click', () => {
    if (!allRight) { span = 2; totalScore = 0; maxPossible = 0; }
    renderIdle();
  });
}

// ── game flow ─────────────────────────────────────────────────────────────────

function startSpan() {
  letters = shuffle(POOL).slice(0, span);
  equations = Array.from({ length: span }, makeEquation);
  round = 0;
  recalled = [];
  renderEquation();
}

function answerEq(answer) {
  if (phase !== 'equation') return;
  if (equationTimer) { clearInterval(equationTimer); equationTimer = null; }
  equations[round].userAnswer = answer;
  if (answer !== equations[round].answer) {
    renderFail();
    return;
  }
  renderLetter();
}

function renderFail() {
  phase = 'fail';
  const isRecord = trySetHS('ospan', span);
  el.innerHTML = `
    <p class="chimp-result chimp-result--fail">Wrong!</p>
    <p class="chimp-hint" style="margin-bottom:24px">You reached span <strong>${span}</strong>.${isRecord ? ' <strong>New record!</strong>' : ''}</p>
    <button class="btn" id="ospan-retry">Try Again</button>
  `;
  el.querySelector('#ospan-retry').addEventListener('click', () => {
    span = 2;
    totalScore = 0;
    maxPossible = 0;
    renderIdle();
  });
}

function submitRecall() {
  renderFeedback();
}

// ── lifecycle ─────────────────────────────────────────────────────────────────

export function mount(mountEl) {
  el = mountEl;
  span = 2;
  totalScore = 0;
  maxPossible = 0;
  phase = 'idle';
  renderIdle();
}

export function unmount() {
  if (equationTimer) { clearInterval(equationTimer); equationTimer = null; }
  el = null;
}
