import Phaser from 'phaser';

export type DroneSwarmConfig = {
  hp: number;
  speed: number;
};

export class DroneSwarm extends Phaser.Physics.Arcade.Image {
  hp: number;
  private baseSpeed: number;

  // small per-enemy variation for "curvinha"
  private seed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.setCircle(10); // hitbox circular
    this.setDamping(true);
    this.setDrag(0.0012);
    this.setMaxVelocity(620, 620);

    this.hp = 16;
    this.baseSpeed = 220;
    this.seed = Math.random() * 1000;
  }

  init(cfg: DroneSwarmConfig) {
    this.hp = cfg.hp;
    this.baseSpeed = cfg.speed;
    this.setActive(true);
    this.setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).enable = true;
    return this;
  }

  damage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    // mini "explosão" só visual: um flash rápido
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 90,
      yoyo: false,
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
        (this.body as Phaser.Physics.Arcade.Body).enable = false;
        this.alpha = 1;
      },
    });
  }

  // Steering: seek player + slight orbit + soft separation from nearby enemies
  updateSteer(
    timeMs: number,
    playerX: number,
    playerY: number,
    neighbors: Array<{ x: number; y: number }>,
  ) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    // Seek player
    let sx = dx / dist;
    let sy = dy / dist;

    // Curvinha/orbit feel
    const t = (timeMs * 0.001) + this.seed;
    const orbit = Math.sin(t * 1.4) * 0.25;
    const ox = -sy * orbit;
    const oy = sx * orbit;

    sx += ox;
    sy += oy;

    // Separation (cheap): push away from nearby points
    let sepX = 0;
    let sepY = 0;
    const sepRadius = 54;
    for (const n of neighbors) {
      const ndx = this.x - n.x;
      const ndy = this.y - n.y;
      const d = Math.hypot(ndx, ndy);
      if (d > 1 && d < sepRadius) {
        const f = (sepRadius - d) / sepRadius;
        sepX += (ndx / d) * f;
        sepY += (ndy / d) * f;
      }
    }

    // Blend
    const ax = sx + sepX * 0.9;
    const ay = sy + sepY * 0.9;
    const al = Math.hypot(ax, ay) || 1;

    const vx = (ax / al) * this.baseSpeed;
    const vy = (ay / al) * this.baseSpeed;

    body.setVelocity(vx, vy);

    // Rotate to direction (optional feel)
    this.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
  }
}
