export const icon = '🎯';
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
