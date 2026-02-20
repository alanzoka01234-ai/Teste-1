import Phaser from 'phaser';
import { DroneSwarm } from '../entities/enemies/DroneSwarm';

type EnemySystemConfig = {
  spawnIntervalMs: number;
  maxAlive: number;
};

export class EnemySystem {
  scene: Phaser.Scene;
  group: Phaser.Physics.Arcade.Group;

  private player: Phaser.Physics.Arcade.Image;
  private cfg: EnemySystemConfig;

  private nextSpawnAt = 0;

  // Drone stats (do seu design)
  private droneHp = 16;
  private droneSpeed = 220 * 1.35; // "1.35x" rápido

  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Image, cfg?: Partial<EnemySystemConfig>) {
    this.scene = scene;
    this.player = player;
    this.cfg = {
      spawnIntervalMs: 360,
      maxAlive: 95,
      ...cfg,
    };

    this.ensureTextures();

    this.group = scene.physics.add.group({
      classType: DroneSwarm,
      runChildUpdate: false,
      maxSize: 260,
    });
  }

  private ensureTextures() {
    if (!this.scene.textures.exists('enemyDrone')) {
      const g = this.scene.add.graphics();
      g.clear();

      // simple neon drone (diamond + ring)
      g.fillStyle(0x7dd3fc, 0.95);
      g.fillTriangle(16, 2, 30, 18, 16, 34);
      g.fillStyle(0x2dd4bf, 0.85);
      g.fillTriangle(16, 2, 2, 18, 16, 34);

      g.lineStyle(2, 0xeaffff, 1);
      g.strokeCircle(16, 18, 12);
      g.fillStyle(0x0b1220, 1);
      g.fillCircle(16, 18, 3);

      g.generateTexture('enemyDrone', 32, 36);
      g.destroy();
    }
  }

  update(time: number) {
    // spawn
    if (time >= this.nextSpawnAt) {
      this.nextSpawnAt = time + this.cfg.spawnIntervalMs;
      if (this.group.countActive(true) < this.cfg.maxAlive) {
        this.spawnDroneRing(1 + (Math.random() < 0.35 ? 1 : 0));
      }
    }

    // AI update (cheap): update all drones steering
    const kids = this.group.getChildren() as DroneSwarm[];

    // Build a light neighbor list: sample subset for separation (performance friendly)
    const positions = kids.filter(k => k.active).map(k => ({ x: k.x, y: k.y }));

    for (let i = 0; i < kids.length; i++) {
      const e = kids[i];
      if (!e.active) continue;

      // pick a few neighbor points around index
      const neigh: Array<{ x: number; y: number }> = [];
      const step = 6; // sampling stride
      for (let j = i - step; j <= i + step; j += 3) {
        if (j === i) continue;
        const idx = (j + positions.length) % Math.max(1, positions.length);
        const p = positions[idx];
        if (p) neigh.push(p);
        if (neigh.length >= 6) break;
      }

      e.updateSteer(time, this.player.x, this.player.y, neigh);
    }
  }

  private spawnDroneRing(count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 720 + Math.random() * 220;

      const x = this.player.x + Math.cos(angle) * radius;
      const y = this.player.y + Math.sin(angle) * radius;

      const e = this.group.get(x, y, 'enemyDrone') as DroneSwarm | null;
      if (!e) continue;

      e.setPosition(x, y);
      e.setAlpha(1);
      e.init({ hp: this.droneHp, speed: this.droneSpeed });
    }
  }
}
