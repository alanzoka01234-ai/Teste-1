import Phaser from 'phaser';

export type JoystickVector = { x: number; y: number };

export class VirtualJoystick {
  private scene: Phaser.Scene;

  private active = false;
  private pointerId: number | null = null;

  private base!: Phaser.GameObjects.Arc;
  private knob!: Phaser.GameObjects.Arc;

  private startX = 0;
  private startY = 0;

  private radius = 52;
  private knobRadius = 22;

  private vec: JoystickVector = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.base = scene.add.circle(-9999, -9999, this.radius, 0x0b1220, 0.55)
      .setStrokeStyle(2, 0x1f2a44, 0.9)
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);

    this.knob = scene.add.circle(-9999, -9999, this.knobRadius, 0xeaffff, 0.25)
      .setStrokeStyle(2, 0x7dd3fc, 0.95)
      .setScrollFactor(0)
      .setDepth(1001)
      .setVisible(false);

    // Pointer events (single joystick at a time)
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    scene.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onUp(p));
    scene.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.onUp(p));

    // Mobile-safe: allow more pointers
    scene.input.addPointer(2);
  }

  getVector(): JoystickVector {
    return this.vec;
  }

  isActive() {
    return this.active;
  }

  private shouldStart(pointer: Phaser.Input.Pointer) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    // Start joystick on left side or any touch pointer (mobile)
    const isTouch = pointer.pointerType === 'touch';
    const leftZone = pointer.x < w * 0.55;

    // Avoid top UI area
    const safeY = pointer.y > 70;

    return safeY && (isTouch || leftZone);
  }

  private onDown(pointer: Phaser.Input.Pointer) {
    if (this.active) return;
    if (!this.shouldStart(pointer)) return;

    this.active = true;
    this.pointerId = pointer.id;

    this.startX = pointer.x;
    this.startY = pointer.y;

    this.base.setPosition(this.startX, this.startY).setVisible(true);
    this.knob.setPosition(this.startX, this.startY).setVisible(true);

    this.vec.x = 0;
    this.vec.y = 0;
  }

  private onMove(pointer: Phaser.Input.Pointer) {
    if (!this.active) return;
    if (this.pointerId !== pointer.id) return;

    const dx = pointer.x - this.startX;
    const dy = pointer.y - this.startY;

    const dist = Math.hypot(dx, dy);
    const max = this.radius;

    const clamped = dist > max ? max / dist : 1;
    const cx = this.startX + dx * clamped;
    const cy = this.startY + dy * clamped;

    this.knob.setPosition(cx, cy);

    const nx = Phaser.Math.Clamp(dx / max, -1, 1);
    const ny = Phaser.Math.Clamp(dy / max, -1, 1);

    // Normalize slight diagonal exaggeration
    const len = Math.hypot(nx, ny);
    if (len > 1e-6) {
      this.vec.x = nx / Math.max(1, len);
      this.vec.y = ny / Math.max(1, len);
    } else {
      this.vec.x = 0;
      this.vec.y = 0;
    }
  }

  private onUp(pointer: Phaser.Input.Pointer) {
    if (!this.active) return;
    if (this.pointerId !== pointer.id) return;

    this.active = false;
    this.pointerId = null;

    this.base.setVisible(false).setPosition(-9999, -9999);
    this.knob.setVisible(false).setPosition(-9999, -9999);

    this.vec.x = 0;
    this.vec.y = 0;
  }

  destroy() {
    this.scene.input.off('pointerdown', this.onDown);
    this.scene.input.off('pointermove', this.onMove);
    this.scene.input.off('pointerup', this.onUp);
    this.scene.input.off('pointerupoutside', this.onUp);
    this.base.destroy();
    this.knob.destroy();
  }
}
