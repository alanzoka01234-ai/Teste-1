import Phaser from 'phaser';
import { VirtualJoystick } from '../controls/VirtualJoystick';
import { EnemySystem } from '../systems/EnemySystem';

const WORLD_W = 8000;
const WORLD_H = 8000;

export class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  private player!: Phaser.Physics.Arcade.Image;
  private floor!: Phaser.GameObjects.TileSprite;

  private hudText!: Phaser.GameObjects.Text;

  private joystick!: VirtualJoystick;

  private enemies!: EnemySystem;

  private hp = 100;

  constructor() {
    super('game');
  }

  create() {
    // World bounds
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // Camera bounds
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // Generate floor tile texture (64x64) once
    if (!this.textures.exists('floorTile')) {
      const g = this.add.graphics();
      g.clear();
      g.fillStyle(0x070a10, 1);
      g.fillRect(0, 0, 64, 64);
      g.lineStyle(1, 0x0f172a, 1);
      for (let x = 0; x <= 64; x += 16) g.lineBetween(x, 0, x, 64);
      for (let y = 0; y <= 64; y += 16) g.lineBetween(0, y, 64, y);

      // neon specks
      g.fillStyle(0x2dd4bf, 0.10);
      g.fillCircle(10, 14, 2);
      g.fillStyle(0x60a5fa, 0.10);
      g.fillCircle(44, 40, 2);
      g.fillStyle(0xf472b6, 0.08);
      g.fillCircle(30, 22, 1.5);

      g.generateTexture('floorTile', 64, 64);
      g.destroy();
    }

    // Floor as big tilesprite covering the world (cheap)
    this.floor = this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'floorTile').setOrigin(0, 0);
    this.floor.setScrollFactor(1);

    // Generate player texture
    if (!this.textures.exists('playerShip')) {
      const g = this.add.graphics();
      g.clear();
      g.fillStyle(0x00f5ff, 1);
      g.fillCircle(16, 16, 9);
      g.lineStyle(2, 0xeaffff, 1);
      g.strokeCircle(16, 16, 10);
      g.fillStyle(0x0b1220, 1);
      g.fillCircle(16, 16, 3);
      g.generateTexture('playerShip', 32, 32);
      g.destroy();
    }

    // Player (world coords)
    this.player = this.physics.add.image(WORLD_W / 2, WORLD_H / 2, 'playerShip');
    this.player.setDamping(true);
    this.player.setDrag(0.0008);
    this.player.setMaxVelocity(520, 520);
    this.player.setCollideWorldBounds(true);

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // Input (desktop)
    this.cursors = this.input.keyboard!.createCursorKeys();
    const kb = this.input.keyboard!;
    this.keys = { W: kb.addKey('W'), A: kb.addKey('A'), S: kb.addKey('S'), D: kb.addKey('D') };

    // Mobile joystick
    this.joystick = new VirtualJoystick(this);

    // Enemies system (Drone Enxame)
    this.enemies = new EnemySystem(this, this.player);

    // HUD (fixed to camera)
    this.hudText = this.add.text(12, 10, '', {
      fontSize: '12px',
      color: '#dbeafe',
      fontFamily: 'ui-sans-serif, system-ui',
    }).setScrollFactor(0).setDepth(10);

    // Back to menu (ESC)
    kb.on('keydown-ESC', () => this.scene.start('menu'));
  }

  update(time: number, delta: number) {
    const dt = delta / 1000;

    // Movement (Arcade physics velocity)
    const speed = 320;

    // Keyboard vector
    let vx = 0;
    let vy = 0;

    const left = this.cursors.left?.isDown || this.keys.A.isDown;
    const right = this.cursors.right?.isDown || this.keys.D.isDown;
    const up = this.cursors.up?.isDown || this.keys.W.isDown;
    const down = this.cursors.down?.isDown || this.keys.S.isDown;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    // Joystick vector (mobile)
    const j = this.joystick.getVector();
    const useJoy = (j.x !== 0 || j.y !== 0) && !(vx !== 0 || vy !== 0);
    if (useJoy) {
      vx = j.x;
      vy = j.y;
    }

    // normalize diagonal (keyboard)
    if (vx !== 0 && vy !== 0) {
      const inv = 1 / Math.sqrt(2);
      vx *= inv;
      vy *= inv;
    }

    this.player.setVelocity(vx * speed, vy * speed);

    // Visual rotation toward movement direction
    if (vx !== 0 || vy !== 0) {
      this.player.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
    }

    // Enemies: spawn + AI pursuit
    this.enemies.update(time);

    // Contact damage (Drone Enxame): 6 por segundo por inimigo encostando
    this.physics.overlap(this.player, this.enemies.group, () => {
      this.hp = Math.max(0, this.hp - 6 * dt);
    });

    // Floor tile scroll matches camera (optional feel)
    const cam = this.cameras.main;
    this.floor.tilePositionX = cam.scrollX;
    this.floor.tilePositionY = cam.scrollY;

    // HUD
    const fps = Math.round(this.game.loop.actualFps);
    const enemiesAlive = this.enemies.group.countActive(true);
    this.hudText.setText([
      `HP: ${this.hp.toFixed(0)}`,
      `POS: ${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)}`,
      `ENEMIES: ${enemiesAlive}`,
      `FPS: ${fps}`,
      `ESC: Menu`,
    ]);
  }
}
