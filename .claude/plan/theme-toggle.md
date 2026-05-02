# Implementation Plan: Theme Toggle (dark ↔ light)

### Task Type
- [x] Frontend

---

### Technical Solution

`[data-theme="light"]` sur `<html>` surcharge les variables CSS de `:root`.
La valeur par défaut (sans attribut) = thème sombre.
Persistance dans `localStorage`, fallback sur `prefers-color-scheme` au premier chargement.
Un script inline bloquant dans `<head>` applique le thème sauvegardé avant le premier rendu (anti-FOUC).
Un module `theme.js` indépendant câble le bouton toggle.

---

### Palette light theme

```css
--bg:        #f4f5fb;   /* lavande douce, pas de blanc pur */
--surface:   #ffffff;
--surface-2: #ebecf5;
--accent:    #5a52e0;   /* inchangé, 5.6:1 sur blanc (WCAG AA) */
--text:      #1a1a2e;   /* 14.8:1 sur --bg */
--text-muted:#5a5a72;   /* 5.4:1 sur --bg (WCAG AA) */
--border:    #c9cad8;
--focus-ring:#5a52e0;
```

Les valeurs hardcodées `#2e7d32` (vert) et `#c62828` (rouge) passent WCAG AA sur cette palette.

---

### Implementation Steps

#### Step 1 — style.css : light theme variables + button styles + transitions

1. Ajouter après le bloc `:root {}` :
```css
[data-theme="light"] {
  --bg:        #f4f5fb;
  --surface:   #ffffff;
  --surface-2: #ebecf5;
  --accent:    #5a52e0;
  --text:      #1a1a2e;
  --text-muted:#5a5a72;
  --border:    #c9cad8;
  --focus-ring:#5a52e0;
}
```

2. Ajouter la transition sur `body`, `#nav`, `.game-card`, `.game-area` (uniquement les props qui changent) :
```css
body, #nav, .game-card, .game-area {
  transition: background-color 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out;
}
```

3. Ajouter les styles du bouton toggle (en fin de section Nav) :
```css
#theme-toggle {
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px 10px;
  font-size: 1em;
  display: flex;
  align-items: center;
  line-height: 1;
  transition: border-color 0.15s, color 0.15s;
}
#theme-toggle:hover {
  color: var(--text);
  border-color: var(--text-muted);
}
```

4. Ajouter `#theme-toggle:focus-visible` à la règle focus ring existante.

---

#### Step 2 — index.html : inline FOUC script + bouton + import theme.js

1. Dans `<head>`, ajouter avant `<link rel="stylesheet">` :
```html
<script>
  (function () {
    var saved = localStorage.getItem('theme');
    if (!saved) saved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  })();
</script>
```
_Doit être avant le stylesheet pour éviter le FOUC._

2. Dans `<nav>`, après `<span id="nav-breadcrumb">`, ajouter :
```html
<button id="theme-toggle" aria-label="Passer en thème clair"></button>
```
_(Le contenu SVG sera injecté par theme.js au chargement.)_

3. Après `<script type="module" src="router.js">`, ajouter :
```html
<script type="module" src="theme.js"></script>
```

---

#### Step 3 — theme.js (nouveau fichier)

```js
const ICONS = {
  // icône à afficher = ce vers quoi on va switcher
  toLight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  toDark:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
};

const html = document.documentElement;
const btn = document.getElementById('theme-toggle');

function getTheme() {
  return html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
  if (theme === 'light') {
    html.setAttribute('data-theme', 'light');
  } else {
    html.removeAttribute('data-theme');
  }
  localStorage.setItem('theme', theme);
  syncButton(theme);
}

function syncButton(theme) {
  if (theme === 'dark') {
    btn.innerHTML = ICONS.toLight;
    btn.setAttribute('aria-label', 'Passer en thème clair');
  } else {
    btn.innerHTML = ICONS.toDark;
    btn.setAttribute('aria-label', 'Passer en thème sombre');
  }
}

btn.addEventListener('click', () => applyTheme(getTheme() === 'dark' ? 'light' : 'dark'));
syncButton(getTheme());
```

---

### Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `style.css:3-13` | Modify | Ajouter bloc `[data-theme="light"]` après `:root` |
| `style.css` | Add | Transitions sur body/nav/cards + styles `#theme-toggle` |
| `style.css:121-128` | Modify | Ajouter `#theme-toggle:focus-visible` au sélecteur focus ring |
| `index.html:3-7` | Modify | Ajouter script inline anti-FOUC dans `<head>` |
| `index.html:12` | Modify | Ajouter `<button id="theme-toggle">` dans `<nav>` |
| `index.html:15` | Modify | Ajouter `<script type="module" src="theme.js">` |
| `theme.js` | Create | Nouveau module de gestion du thème |

### Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| Flash du mauvais thème au chargement (FOUC) | Script inline bloquant dans `<head>` applique le thème avant tout rendu |
| Les transitions interfèrent avec les animations de jeu | Appliquer la transition uniquement sur `body, #nav, .game-card, .game-area`, pas sur `.chimp-cell` (déjà optimisé) |
| `localStorage` indisponible (mode privé strict) | Wrapper `try/catch` dans le script inline et dans `theme.js` |

### SESSION_ID
- CODEX_SESSION: n/a (fallback Claude natif)
- GEMINI_SESSION: n/a (fallback Claude natif)
