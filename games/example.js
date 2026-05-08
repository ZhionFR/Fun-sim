export const icon = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
export const title = 'Example Game';
export const description = 'A placeholder. Click the button!';

let teardown = () => {};

export function mount(el) {
  let clicks = 0;
  let active = true;

  function render() {
    el.innerHTML = `
      <p style="margin-bottom:24px;color:var(--text-muted)">Clicks: <strong style="color:var(--text)">${clicks}</strong></p>
      <button class="btn" id="example-btn">Click me!</button>
    `;
    el.querySelector('#example-btn').addEventListener('click', () => {
      if (!active) return;
      clicks++;
      render();
    });
  }

  teardown();
  teardown = () => { active = false; };
  render();
}

export function unmount() {
  teardown();
  teardown = () => {};
}
