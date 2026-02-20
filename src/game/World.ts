import { Application, Container, Sprite, Text, TilingSprite } from 'pixi.js';
import { Keyboard } from '../controls/Keyboard';
import { VirtualJoystick } from '../controls/VirtualJoystick';
import { clamp, len } from '../utils/math';
import { createTextures, type GameTextures } from './Assets';
import { WORLD_W, WORLD_H, GAUSS_BULLET_SPEED, GAUSS_DMG, GAUSS_FIRE_RATE, GAUSS_PIERCE, DRONE_CONTACT_DPS, DRONE_HP, BURST_HP } from './config';
import { Bullet } from './objects/Bullet';
import { Enemy, type EnemyKind } from './objects/Enemy';

export class World {
  container = new Container();

  private textures: GameTextures;
  private keyboard = new Keyboard();
  private joystick: VirtualJoystick;

  private bg: TilingSprite;
  private world = new Container();
  private ui = new Container();

  private player: Sprite;
  private playerX = WORLD_W / 2;
  private playerY = WORLD_H / 2;
  private playerSpeed = 320;

  private camX = 0;
  private camY = 0;

  private hud: Text;
  private hp = 100;
  private kills = 0;

  private enemies: Enemy[] = [];
  private enemyPool: Enemy[] = [];
  private nextSpawnAt = 0;

  private bullets: Bullet[] = [];
  private bulletPool: Bullet[] = [];

  private enemyBullets: Bullet[] = [];
  private enemyBulletPool: Bullet[] = [];

  private fireAccMs = 0;

  constructor(private app: Application, private onExit: () => void) {
    this.textures = createTextures(app);

    const { w, h } = this.getViewSize();
    this.bg = new TilingSprite({ texture: this.textures.floorTile, width: w, height: h });

    this.world.sortableChildren = true;
    this.ui.sortableChildren = true;

    this.player = new Sprite(this.textures.player);
    this.player.anchor.set(0.5);
    this.player.zIndex = 10;
    this.player.position.set(this.playerX, this.playerY);
    this.world.addChild(this.player);

    this.hud = new Text({ text: '', style: { fill: 0xdbeafe, fontSize: 12, fontFamily: 'ui-sans-serif, system-ui' } });
    this.hud.position.set(12, 10);
    this.hud.zIndex = 2000;
    this.ui.addChild(this.hud);

    this.joystick = new VirtualJoystick(() => this.getViewSize());
    this.ui.addChild(this.joystick.container);

    this.container.addChild(this.bg, this.world, this.ui);

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') this.onExit();
    });

    this.onResize();
  }

  destroy() {
    this.joystick.destroy();
    this.container.destroy({ children: true });
  }

  onResize() {
    const { w, h } = this.getViewSize();
    this.bg.width = w;
    this.bg.height = h;
  }

  private getViewSize() {
    const res = this.app.renderer.resolution || 1;
    return { w: this.app.renderer.width / res, h: this.app.renderer.height / res };
  }

  update(dtMs: number, timeMs: number) {
    const { w, h } = this.getViewSize();

    // Movement
    const k = this.keyboard.getAxis();
    const j = this.joystick.getVector();
    let vx = k.x, vy = k.y;
    if (vx === 0 && vy === 0 && (j.x !== 0 || j.y !== 0)) { vx = j.x; vy = j.y; }

    this.playerX = clamp(this.playerX + vx * this.playerSpeed * (dtMs / 1000), 0, WORLD_W);
    this.playerY = clamp(this.playerY + vy * this.playerSpeed * (dtMs / 1000), 0, WORLD_H);
    this.player.position.set(this.playerX, this.playerY);
    if (vx !== 0 || vy !== 0) this.player.rotation = Math.atan2(vy, vx) + Math.PI / 2;

    // Camera follow (center + clamp to world)
    this.camX = clamp(this.playerX - w / 2, 0, Math.max(0, WORLD_W - w));
    this.camY = clamp(this.playerY - h / 2, 0, Math.max(0, WORLD_H - h));
    this.world.position.set(-this.camX, -this.camY);
    this.bg.tilePosition.set(this.camX, this.camY);

    // Spawn
    if (timeMs >= this.nextSpawnAt) {
      this.nextSpawnAt = timeMs + 360;
      if (this.enemies.length < 90) {
        const spawnCount = (Math.random() < 0.35) ? 2 : 1;
        for (let i = 0; i < spawnCount; i++) this.spawnEnemy(timeMs);
      }
    }

    // Auto shoot (Gauss) only visible targets
    this.fireAccMs += dtMs;
    const fireEvery = 1000 / GAUSS_FIRE_RATE;
    while (this.fireAccMs >= fireEvery) {
      this.fireAccMs -= fireEvery;
      this.autoShoot();
    }

    // Update bullets
    for (const b of this.bullets) b.update(dtMs);
    for (const b of this.enemyBullets) b.update(dtMs);

    // Cull bullets using camera window
    const pad = 420;
    const camL = this.camX - pad, camR = this.camX + w + pad;
    const camT = this.camY - pad, camB = this.camY + h + pad;

    this.bullets = this.bullets.filter(b => {
      if (!b.alive) return false;
      const ok = b.x >= camL && b.x <= camR && b.y >= camT && b.y <= camB;
      if (!ok) { b.kill(); this.bulletPool.push(b); }
      return ok;
    });

    this.enemyBullets = this.enemyBullets.filter(b => {
      if (!b.alive) return false;
      const ok = b.x >= camL && b.x <= camR && b.y >= camT && b.y <= camB;
      if (!ok) { b.kill(); this.enemyBulletPool.push(b); }
      return ok;
    });

    // Update enemies AI
    const positions = this.enemies.filter(e => e.alive).map(e => ({ x: e.x, y: e.y }));

    const spawnEnemyBullet = (x:number,y:number, tx:number,ty:number, dmg:number, speed:number) => {
      // only shoot if on-screen
      const sx = x - this.camX;
      const sy = y - this.camY;
      if (sx < -100 || sx > w + 100 || sy < -100 || sy > h + 100) return;

      const b = this.getEnemyBullet();
      b.spawn(x, y, tx, ty, speed, dmg, 0);
      this.enemyBullets.push(b);
      if (!b.sprite.parent) this.world.addChild(b.sprite);
    };

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.alive) continue;

      const neigh: Array<{ x: number; y: number }> = [];
      const step = 6;
      for (let j = i - step; j <= i + step; j += 3) {
        if (j === i) continue;
        const idx = (j + positions.length) % Math.max(1, positions.length);
        const p = positions[idx];
        if (p) neigh.push(p);
        if (neigh.length >= 6) break;
      }

      e.update(dtMs, timeMs, this.playerX, this.playerY, neigh, spawnEnemyBullet);
    }

    // Collisions: player bullets vs enemies
    for (const b of this.bullets) {
      if (!b.alive) continue;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = len(b.x - e.x, b.y - e.y);
        if (d < (b.radius + e.radius)) {
          e.damage(b.damage);

          if (!e.alive) {
            this.kills += 1;
            this.enemyPool.push(e);
          }

          if (b.pierce > 0) b.pierce -= 1;
          else { b.kill(); this.bulletPool.push(b); break; }
        }
      }
    }

    // Collisions: enemy bullets vs player
    for (const b of this.enemyBullets) {
      if (!b.alive) continue;
      const d = len(b.x - this.playerX, b.y - this.playerY);
      if (d < (b.radius + 10)) {
        this.hp = Math.max(0, this.hp - b.damage);
        b.kill(); this.enemyBulletPool.push(b);
      }
    }

    // Contact damage (drones)
    let contacts = 0;
    for (const e of this.enemies) {
      if (!e.alive || e.kind !== 'drone') continue;
      const d = len(e.x - this.playerX, e.y - this.playerY);
      if (d < (e.radius + 10)) contacts += 1;
    }
    if (contacts > 0) {
      this.hp = Math.max(0, this.hp - DRONE_CONTACT_DPS * contacts * (dtMs / 1000));
    }

    // Cleanup enemies array (remove dead)
    this.enemies = this.enemies.filter(e => e.alive);

    // HUD
    const fps = Math.round(this.app.ticker.FPS);
    this.hud.text = `HP: ${this.hp.toFixed(0)}\nPOS: ${this.playerX.toFixed(0)}, ${this.playerY.toFixed(0)}\nENEMIES: ${this.enemies.length}\nKILLS: ${this.kills}\nFPS: ${fps}\nESC: Menu`;
  }

  private spawnEnemy(timeMs: number) {
    const { w, h } = this.getViewSize();
    const margin = 40;
    const side = (Math.random() * 4) | 0;
    let x = this.playerX, y = this.playerY;

    if (side === 0) { x = this.playerX - (w / 2 + margin); y = this.playerY + (Math.random() - 0.5) * (h + margin * 2); }
    else if (side === 1) { x = this.playerX + (w / 2 + margin); y = this.playerY + (Math.random() - 0.5) * (h + margin * 2); }
    else if (side === 2) { x = this.playerX + (Math.random() - 0.5) * (w + margin * 2); y = this.playerY - (h / 2 + margin); }
    else { x = this.playerX + (Math.random() - 0.5) * (w + margin * 2); y = this.playerY + (h / 2 + margin); }

    x = clamp(x, 0, WORLD_W);
    y = clamp(y, 0, WORLD_H);

    const burstCap = 4;
    const burstChance = Math.min(0.22, 0.10 + (timeMs / 60000) * 0.02);
    const burstAlive = this.enemies.filter(e => e.kind === 'burst').length;

    if (burstAlive < burstCap && Math.random() < burstChance) {
      const e = this.getEnemy('burst'); e.spawn(x, y, BURST_HP);
      this.enemies.push(e); if (!e.sprite.parent) this.world.addChild(e.sprite);
    } else {
      const e = this.getEnemy('drone'); e.spawn(x, y, DRONE_HP);
      this.enemies.push(e); if (!e.sprite.parent) this.world.addChild(e.sprite);
    }
  }

  private getEnemy(kind: EnemyKind) {
    for (let i = 0; i < this.enemyPool.length; i++) {
      const e = this.enemyPool[i];
      if (e.kind === kind) { this.enemyPool.splice(i, 1); return e; }
    }
    const tex = kind === 'drone' ? this.textures.drone : this.textures.burst;
    return new Enemy(tex, kind);
  }

  private getBullet() {
    const b = this.bulletPool.pop() || new Bullet(this.textures.bullet);
    b.sprite.visible = true;
    if (!b.sprite.parent) this.world.addChild(b.sprite);
    return b;
  }

  private getEnemyBullet() {
    const b = this.enemyBulletPool.pop() || new Bullet(this.textures.enemyBullet);
    b.sprite.visible = true;
    if (!b.sprite.parent) this.world.addChild(b.sprite);
    return b;
  }

  private autoShoot() {
    const { w, h } = this.getViewSize();
    const margin = 80;

    let closest: Enemy | null = null;
    let minD = Infinity;

    for (const e of this.enemies) {
      if (!e.alive) continue;
      const sx = e.x - this.camX;
      const sy = e.y - this.camY;
      if (sx < -margin || sx > w + margin || sy < -margin || sy > h + margin) continue;
      const d = len(e.x - this.playerX, e.y - this.playerY);
      if (d < minD) { minD = d; closest = e; }
    }
    if (!closest) return;

    const b = this.getBullet();
    b.spawn(this.playerX, this.playerY, closest.x, closest.y, GAUSS_BULLET_SPEED, GAUSS_DMG, GAUSS_PIERCE);
    this.bullets.push(b);
  }
}
