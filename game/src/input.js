import { FIELD } from './config.js';

const MOVEMENT = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
export function createInput(canvas) {
  const keys = new Set();
  const clicks = [];
  let mouse = { x: FIELD.width / 2, y: 100 };
  let confirm = false, pause = false, mute = false;
  const point = event => {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    return {
      x: (event.clientX - rect.left - (rect.width - FIELD.width * scale) / 2) / scale,
      y: (event.clientY - rect.top - (rect.height - FIELD.height * scale) / 2) / scale
    };
  };
  window.addEventListener('keydown', e => {
    if (MOVEMENT.has(e.code) || ['Space','Enter','KeyP','Escape','KeyM','KeyR','Digit1','Digit2','Digit3'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR') confirm = true;
    if (e.code === 'KeyP' || e.code === 'Escape') pause = true;
    if (e.code === 'KeyM') mute = true;
    if (/^Digit[123]$/.test(e.code)) clicks.push({ choice: Number(e.code.slice(-1)) - 1 });
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  canvas.addEventListener('pointermove', e => { mouse = point(e); });
  canvas.addEventListener('pointerdown', e => { mouse = point(e); clicks.push(mouse); confirm = true; });
  return {
    get move() { return { x: Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')), y: Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) }; },
    get aim() { return mouse; },
    take() { const value = { confirm, pause, mute, clicks: clicks.splice(0) }; confirm = pause = mute = false; return value; }
  };
}
