import { Container, Graphics } from 'pixi.js';
import { clamp, norm } from '../utils/math';

export type JoyVec = { x: number; y: number };

export class VirtualJoystick {
  container = new Container();

  private active = false;
  private pointerId: number | null = null;

  private base = new Graphics();
  private knob = new Graphics();

  private startX = 0;
  private startY = 0;

  private radius = 52;
  private knobRadius = 22;

  private vec: JoyVec = { x: 0, y: 0 };

  constructor(private getViewSize: () => { w: number; h: number }) {
    this.container.sortableChildren = true;
    this.base.zIndex = 1000;
    this.knob.zIndex = 1001;
    this.container.addChild(this.base, this.knob);

    this.base.visible = false;
    this.knob.visible = false;
    this.redraw();

    window.addEventListener('pointerdown', this.onDown, { passive: false });
    window.addEventListener('pointermove', this.onMove, { passive: false });
    window.addEventListener('pointerup', this.onUp, { passive: false });
    window.addEventListener('pointercancel', this.onUp, { passive: false });
  }

  destroy() {
    window.removeEventListener('pointerdown', this.onDown as any);
    window.removeEventListener('pointermove', this.onMove as any);
    window.removeEventListener('pointerup', this.onUp as any);
    window.removeEventListener('pointercancel', this.onUp as any);
    this.container.destroy({ children: true });
  }

  getVector() { return this.vec; }

  private redraw() {
    this.base.clear();
    this.base.beginFill(0x0b1220, 0.55);
    this.base.lineStyle(2, 0x1f2a44, 0.9);
    this.base.drawCircle(0, 0, this.radius);
    this.base.endFill();

    this.knob.clear();
    this.knob.beginFill(0xeaffff, 0.25);
    this.knob.lineStyle(2, 0x7dd3fc, 0.95);
    this.knob.drawCircle(0, 0, this.knobRadius);
    this.knob.endFill();
  }

  private shouldStart(e: PointerEvent) {
    const { w, h } = this.getViewSize();
    const isTouch = e.pointerType === 'touch';
    const leftZone = e.clientX < w * 0.55;
    const safeY = e.clientY > 70;
    return safeY && (isTouch || leftZone);
  }

  private onDown = (e: PointerEvent) => {
    if (this.active) return;
    if (!this.shouldStart(e)) return;
    if (e.pointerType === 'touch') e.preventDefault();

    this.active = true;
    this.pointerId = e.pointerId;
    this.startX = e.clientX;
    this.startY = e.clientY;

    this.base.visible = true;
    this.knob.visible = true;
    this.base.position.set(this.startX, this.startY);
    this.knob.position.set(this.startX, this.startY);

    this.vec.x = 0;
    this.vec.y = 0;
  };

  private onMove = (e: PointerEvent) => {
    if (!this.active) return;
    if (this.pointerId !== e.pointerId) return;
    if (e.pointerType === 'touch') e.preventDefault();

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    const d = Math.hypot(dx, dy);
    const max = this.radius;

    const k = d > max ? max / d : 1;
    this.knob.position.set(this.startX + dx * k, this.startY + dy * k);

    const nx = clamp(dx / max, -1, 1);
    const ny = clamp(dy / max, -1, 1);
    const n = norm(nx, ny);
    const l = Math.max(1, n.d);
    this.vec.x = nx / l;
    this.vec.y = ny / l;
  };

  private onUp = (e: PointerEvent) => {
    if (!this.active) return;
    if (this.pointerId !== e.pointerId) return;
    this.active = false;
    this.pointerId = null;
    this.base.visible = false;
    this.knob.visible = false;
    this.vec.x = 0;
    this.vec.y = 0;
  };
}
