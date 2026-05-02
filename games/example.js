export const icon = '🎯';
export const title = 'Example Game';
export const description = 'A placeholder. Click the button!';

let clicks = 0;
let mounted = false;

export function mount(el) {
  clicks = 0;
  mounted = true;

  function render() {
    el.innerHTML = `
      <p style="margin-bottom:24px;color:var(--text-muted)">Clicks: <strong style="color:var(--text)">${clicks}</strong></p>
      <button class="btn" id="example-btn">Click me!</button>
    `;
    el.querySelector('#example-btn').addEventListener('click', () => {
      if (!mounted) return;
      clicks++;
      render();
    });
  }

  render();
}

export function unmount() {
  mounted = false;
}
