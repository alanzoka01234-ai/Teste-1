import { Sprite, Texture } from 'pixi.js';
import { norm } from '../../utils/math';

export class Bullet {
  sprite: Sprite;

  x = 0;
  y = 0;
  vx = 0;
  vy = 0;

  damage = 1;
  radius = 6;

  pierce = 0;
  alive = true;

  private lifeMs = 2200;

  constructor(tex: Texture) {
    this.sprite = new Sprite(tex);
    this.sprite.anchor.set(0.2, 0.5);
    this.sprite.visible = false;
  }

  spawn(x: number, y: number, tx: number, ty: number, speed: number, damage: number, pierce: number) {
    this.alive = true;
    this.lifeMs = 2200;
    this.x = x;
    this.y = y;

    const d = norm(tx - x, ty - y);
    this.vx = d.x * speed;
    this.vy = d.y * speed;

    this.damage = damage;
    this.pierce = pierce;

    this.sprite.visible = true;
    this.sprite.position.set(x, y);
    this.sprite.rotation = Math.atan2(this.vy, this.vx);
    this.sprite.alpha = 1;
  }

  update(dtMs: number) {
    if (!this.alive) return;
    this.lifeMs -= dtMs;
    if (this.lifeMs <= 0) { this.kill(); return; }

    this.x += this.vx * (dtMs / 1000);
    this.y += this.vy * (dtMs / 1000);
    this.sprite.position.set(this.x, this.y);
  }

  kill() {
    this.alive = false;
    this.sprite.visible = false;
  }
}
