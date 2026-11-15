import { FIELD, UPGRADES } from './config.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const distance2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export function createWorld(random) {
  const state = { player: null, enemies: [], bullets: [], particles: [], stars: [], score: 0, best: 0, wave: 1, combo: 0, kills: 0, remaining: 0, spawned: 0, waveTimer: 0, time: 0, upgradeChoices: [], phase: 'title', shake: 0, flash: 0, events: [] };
  for (let i = 0; i < 92; i++) state.stars.push({ x: random() * FIELD.width, y: random() * FIELD.height, r: .4 + random() * 1.5, phase: random() * 7 });
  function reset() {
    Object.assign(state, { enemies: [], bullets: [], particles: [], score: 0, wave: 1, combo: 0, kills: 0, remaining: 0, spawned: 0, waveTimer: 0, time: 0, upgradeChoices: [], phase: 'title', shake: 0, flash: 0, events: [] });
    state.player = { x: 640, y: 540, r: 17, hull: 4, maxHull: 4, shield: 1, speed: 310, fireInterval: .19, damage: 1, multi: 1, fireTimer: 0, invincible: 0, angle: -Math.PI / 2 };
  }
  function start() { reset(); state.phase = 'play'; beginWave(); }
  function beginWave() {
    state.remaining = 6 + state.wave * 3;
    state.spawned = 0;
    state.waveTimer = .25;
    state.phase = 'play';
    state.events.push('wave');
  }
  function burst(x, y, color, count, speed = 150) {
    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2, v = speed * (.2 + random() * .8);
      state.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .35 + random() * .5, max: .85, color, r: 1 + random() * 2.7 });
    }
  }
  function spawnEnemy() {
    const kind = random() < .24 ? 2 : random() < .46 ? 1 : 0;
    const x = 80 + random() * 1120, y = -35;
    const hp = (kind === 2 ? 3 : kind === 1 ? 2 : 1) + Math.floor((state.wave - 1) / 3);
    state.enemies.push({ x, y, vx: (random() - .5) * 70, vy: 68 + state.wave * 11 + random() * 30, r: kind === 2 ? 24 : kind === 1 ? 20 : 16, hp, maxHp: hp, kind, age: 0, spin: random() * 7, phase: random() * 7 });
    state.spawned++;
  }
  function fire(aim) {
    const p = state.player;
    const angle = Math.atan2(aim.y - p.y, aim.x - p.x);
    p.angle = angle;
    for (let i = 0; i < p.multi; i++) {
      const a = angle + (i - (p.multi - 1) / 2) * .16;
      state.bullets.push({ x: p.x + Math.cos(a) * 21, y: p.y + Math.sin(a) * 21, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, r: 4, life: 1.35, damage: p.damage });
    }
    state.events.push('shoot');
  }
  function hurt() {
    const p = state.player;
    if (p.invincible > 0) return;
    p.invincible = 1.1;
    state.shake = 14; state.flash = .35; state.combo = 0;
    if (p.shield > 0) { p.shield--; state.events.push('shield'); }
    else { p.hull--; state.events.push('hurt'); }
    burst(p.x, p.y, '#ff6c76', 20, 210);
    if (p.hull <= 0) { state.phase = 'over'; state.events.push('over'); }
  }
  function kill(enemy) {
    state.kills++; state.combo++;
    state.score += (enemy.kind + 1) * 100 * Math.min(5, 1 + Math.floor(state.combo / 5));
    state.remaining--;
    state.events.push('explode');
    burst(enemy.x, enemy.y, ['#52f5e7','#ff6c76','#ffd36b'][enemy.kind], 18 + enemy.kind * 5, 240);
    state.shake = Math.max(state.shake, 3 + enemy.kind * 2);
  }
  function pickUpgrades() {
    const pool = [...UPGRADES];
    state.upgradeChoices = [];
    for (let i = 0; i < 3; i++) state.upgradeChoices.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    state.phase = 'upgrade'; state.events.push('clear');
  }
  function choose(index) {
    if (state.phase !== 'upgrade' || !state.upgradeChoices[index]) return false;
    const p = state.player, id = state.upgradeChoices[index].id;
    if (id === 'rate') p.fireInterval = Math.max(.07, p.fireInterval * .78);
    if (id === 'damage') p.damage++;
    if (id === 'speed') p.speed *= 1.18;
    if (id === 'hull') { p.maxHull++; p.hull = Math.min(p.maxHull, p.hull + 1); }
    if (id === 'multi') p.multi = Math.min(5, p.multi + 2);
    if (id === 'shield') p.shield++;
    state.wave++; state.enemies.length = 0; state.bullets.length = 0;
    state.events.push('upgrade'); beginWave(); return true;
  }
  function step(dt, control) {
    const s = state, p = s.player;
    s.time += dt; s.events.length = 0;
    s.shake = Math.max(0, s.shake - 45 * dt); s.flash = Math.max(0, s.flash - dt);
    for (const star of s.stars) { star.y += (10 + star.r * 13) * dt; if (star.y > FIELD.height) star.y = 0; }
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const q = s.particles[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .97; q.vy *= .97; q.life -= dt;
      if (q.life <= 0) s.particles.splice(i, 1);
    }
    if (s.phase !== 'play') return s.events;
    const move = control.move || { x: 0, y: 0 }, mag = Math.hypot(move.x, move.y) || 1;
    p.x = clamp(p.x + move.x / mag * p.speed * dt, 38, FIELD.width - 38);
    p.y = clamp(p.y + move.y / mag * p.speed * dt, 110, FIELD.height - 38);
    p.invincible = Math.max(0, p.invincible - dt);
    const aim = control.aim || { x: p.x, y: p.y - 100 };
    p.angle = Math.atan2(aim.y - p.y, aim.x - p.x);
    p.fireTimer -= dt;
    if (control.fire !== false && p.fireTimer <= 0) { fire(aim); p.fireTimer += p.fireInterval; }
    s.waveTimer -= dt;
    if (s.spawned < 6 + s.wave * 3 && s.waveTimer <= 0) { spawnEnemy(); s.waveTimer = Math.max(.21, .73 - s.wave * .035); }
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < -20 || b.x > FIELD.width + 20 || b.y < -20 || b.y > FIELD.height + 20) { s.bullets.splice(i, 1); continue; }
      for (let j = s.enemies.length - 1; j >= 0; j--) {
        const e = s.enemies[j];
        if (distance2(b, e) < (b.r + e.r) ** 2) {
          e.hp -= b.damage; s.bullets.splice(i, 1); s.events.push('hit'); burst(b.x, b.y, '#e9f9fa', 4, 90);
          if (e.hp <= 0) { kill(e); s.enemies.splice(j, 1); }
          break;
        }
      }
    }
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i]; e.age += dt;
      e.x += (e.vx + Math.sin(e.age * (2.1 + e.kind) + e.phase) * (28 + e.kind * 13)) * dt;
      e.y += e.vy * dt; e.spin += dt * (1.4 + e.kind * .4);
      if (e.x < e.r || e.x > FIELD.width - e.r) e.vx *= -1;
      if (distance2(e, p) < (e.r + p.r - 3) ** 2) { s.enemies.splice(i, 1); s.remaining--; hurt(); continue; }
      if (e.y > FIELD.height + 35) { s.enemies.splice(i, 1); s.remaining--; hurt(); }
    }
    if (s.phase === 'play' && s.remaining <= 0 && s.spawned >= 6 + s.wave * 3) pickUpgrades();
    return s.events;
  }
  reset();
  return { state, reset, start, step, choose };
}
