import * as exampleGame from './games/example.js';
import * as chimpGame from './games/chimp.js';
import * as ospanGame from './games/ospan.js';
import * as vismemGame from './games/vismem.js';
import * as seqmemGame from './games/seqmem.js';
import * as ordseqGame from './games/ordseq.js';
import * as lightsoutGame from './games/lightsout.js';

const GAMES = {
  'chimp-test': chimpGame,
  'ospan': ospanGame,
  'visual-memory': vismemGame,
  'sequence-memory': seqmemGame,
  'ordered-sequence': ordseqGame,
  'lights-out': lightsoutGame,
  'example-game': exampleGame,
};

const content = document.getElementById('content');
const breadcrumb = document.getElementById('nav-breadcrumb');

let currentGame = null;

function renderHome() {
  if (currentGame) {
    currentGame.unmount();
    currentGame = null;
  }
  breadcrumb.textContent = '';
  document.title = 'Mental Gym';

  const cards = Object.entries(GAMES).map(([id, game]) => `
    <a class="game-card" href="#${id}">
      <div class="game-card-icon">${game.icon}</div>
      <div class="game-card-title">${game.title}</div>
      <div class="game-card-desc">${game.description}</div>
    </a>
  `).join('');

  content.innerHTML = `
    <div class="home-title">Mental Gym</div>
    <div class="home-subtitle">Train your brain.</div>
    <div class="card-grid">${cards}</div>
  `;
}

function renderGame(id) {
  const game = GAMES[id];
  if (!game) { renderHome(); return; }

  if (currentGame && currentGame !== game) {
    currentGame.unmount();
  }
  currentGame = game;
  document.title = `${game.title} — Mental Gym`;
  breadcrumb.textContent = `› ${game.title}`;

  content.innerHTML = `
    <div class="game-view">
      <h1>${game.title}</h1>
      <p class="game-desc">${game.description}</p>
      <div class="game-area" id="game-mount"></div>
      <a class="back-link" href="#home">← Back to games</a>
    </div>
  `;

  game.mount(document.getElementById('game-mount'));
}

function route() {
  const hash = location.hash.slice(1) || 'home';
  if (hash === 'home') {
    renderHome();
  } else {
    renderGame(hash);
  }
}

window.addEventListener('hashchange', route);
route();
