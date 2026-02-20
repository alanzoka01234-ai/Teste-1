import { Sprite, Texture } from 'pixi.js';
import { len } from '../../utils/math';
import { BURST_BULLET_SPEED, BURST_COOLDOWN_MS, BURST_DMG, BURST_SPEED, BURST_TELEGRAPH_MS, DRONE_SPEED } from '../config';

export type EnemyKind = 'drone' | 'burst';

export class Enemy {
  kind: EnemyKind;
  sprite: Sprite;

  x = 0; y = 0; vx = 0; vy = 0;
  hp = 10;
  radius = 12;
  alive = true;

  private seed = Math.random() * 1000;

  // Burst
  private shootCdMs = 900 + Math.random() * 900;
  private telegraphMs = 0;
  private pendingBurst = false;
  private strafeDir = 1;
  private strafeMs = 0;
  private aimX = 1;
  private aimY = 0;

  constructor(tex: Texture, kind: EnemyKind) {
    this.kind = kind;
    this.sprite = new Sprite(tex);
    this.sprite.anchor.set(0.5);
    this.sprite.visible = false;
  }

  spawn(x: number, y: number, hp: number) {
    this.alive = true;
    this.hp = hp;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.sprite.position.set(x, y);
    this.sprite.visible = true;
    this.sprite.alpha = 1;

    if (this.kind === 'drone') {
      this.radius = 11;
    } else {
      this.radius = 12;
      this.shootCdMs = 900 + Math.random() * 900;
      this.telegraphMs = 0;
      this.pendingBurst = false;
      this.strafeMs = 0;
      this.strafeDir = Math.random() < 0.5 ? -1 : 1;
    }
  }

  damage(dmg: number) {
    this.hp -= dmg;
    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.sprite.visible = false;
    this.sprite.alpha = 0;
  }

  update(
    dtMs: number,
    timeMs: number,
    playerX: number,
    playerY: number,
    neighbors: Array<{ x: number; y: number }>,
    spawnEnemyBullet: (x:number,y:number, tx:number,ty:number, dmg:number, speed:number)=>void
  ) {
    if (!this.alive) return;

    if (this.kind === 'drone') {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.hypot(dx, dy) || 1;

      let sx = dx / dist;
      let sy = dy / dist;

      const t = (timeMs * 0.001) + this.seed;
      const orbit = Math.sin(t * 1.4) * 0.28;
      sx += -sy * orbit;
      sy += sx * 0; // (no-op, keeps simple)

      let sepX = 0, sepY = 0;
      const sepR = 54;
      for (const n of neighbors) {
        const ndx = this.x - n.x;
        const ndy = this.y - n.y;
        const d = Math.hypot(ndx, ndy);
        if (d > 1 && d < sepR) {
          const f = (sepR - d) / sepR;
          sepX += (ndx / d) * f;
          sepY += (ndy / d) * f;
        }
      }

      const ax = sx + sepX * 0.9;
      const ay = sy + sepY * 0.9;
      const al = Math.hypot(ax, ay) || 1;

      const speed = DRONE_SPEED;
      this.vx = (ax / al) * speed;
      this.vy = (ay / al) * speed;

      this.x += this.vx * (dtMs / 1000);
      this.y += this.vy * (dtMs / 1000);

      this.sprite.position.set(this.x, this.y);
      this.sprite.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2;
      this.sprite.alpha = 1;
      return;
    }

    // Burst hunter
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d;
    const ny = dy / d;

    this.shootCdMs = Math.max(0, this.shootCdMs - dtMs);

    if (this.telegraphMs > 0) {
      this.telegraphMs = Math.max(0, this.telegraphMs - dtMs);
      this.aimX = nx; this.aimY = ny;
      this.sprite.alpha = (Math.sin(timeMs * 0.02) > 0) ? 1 : 0.5;

      if (this.telegraphMs <= 0 && this.pendingBurst) {
        const baseAng = Math.atan2(this.aimY, this.aimX);
        const spread = 0.18;

        for (const off of [-spread, 0, spread]) {
          const ang = baseAng + off;
          const tx = this.x + Math.cos(ang) * 1000;
          const ty = this.y + Math.sin(ang) * 1000;
          spawnEnemyBullet(this.x, this.y, tx, ty, BURST_DMG, BURST_BULLET_SPEED);
        }

        this.pendingBurst = false;
        this.shootCdMs = BURST_COOLDOWN_MS;
        this.sprite.alpha = 1;
      }
      return;
    } else {
      this.sprite.alpha = 1;
    }

    this.strafeMs = Math.max(0, this.strafeMs - dtMs);
    if (this.strafeMs <= 0) {
      this.strafeDir = Math.random() < 0.5 ? -1 : 1;
      this.strafeMs = 700 + Math.random() * 900;
    }

    const minD = 230, maxD = 380;
    const speed = BURST_SPEED;

    if (d < minD) {
      this.vx = -nx * speed * 1.05;
      this.vy = -ny * speed * 1.05;
    } else if (d > maxD) {
      this.vx = nx * speed * 0.75;
      this.vy = ny * speed * 0.75;
    } else {
      const px = -ny * this.strafeDir;
      const py = nx * this.strafeDir;
      this.vx = px * speed * 0.40;
      this.vy = py * speed * 0.40;
    }

    this.x += this.vx * (dtMs / 1000);
    this.y += this.vy * (dtMs / 1000);

    this.sprite.position.set(this.x, this.y);
    this.sprite.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2;

    if (this.shootCdMs <= 0) {
      this.telegraphMs = BURST_TELEGRAPH_MS;
      this.pendingBurst = true;
    }
  }
}
