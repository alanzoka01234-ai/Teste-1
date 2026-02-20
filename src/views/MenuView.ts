import { Application, Container, Graphics, Text } from 'pixi.js';
import { APP_UPDATE_NOTES, APP_VERSION } from '../version';

export class MenuView {
  container = new Container();

  private bg = new Graphics();
  private title = new Text({ text: 'NEON SURVIVOR', style: { fill: 0xeaffff, fontSize: 34, fontWeight: '900', letterSpacing: 2 } });
  private sub = new Text({ text: 'Port PixiJS • v2.0.0', style: { fill: 0x7dd3fc, fontSize: 14, letterSpacing: 1 } });

  private btn = new Graphics();
  private btnTxt = new Text({ text: 'JOGAR', style: { fill: 0xeaffff, fontSize: 18, fontWeight: '800', letterSpacing: 2 } });

  private version = new Text({ text: APP_VERSION, style: { fill: 0x9aa4b2, fontSize: 12 } });

  private notesOpen = false;
  private notesBox = new Graphics();
  private notesText = new Text({ text: APP_UPDATE_NOTES.join('\n'), style: { fill: 0xc7d2fe, fontSize: 12, wordWrap: true, wordWrapWidth: 720 } });

  constructor(private app: Application, private opts: { onPlay: () => void }) {
    this.container.addChild(this.bg, this.title, this.sub, this.btn, this.btnTxt, this.version, this.notesBox, this.notesText);

    this.btn.eventMode = 'static';
    this.btn.cursor = 'pointer';
    this.btn.on('pointerdown', () => this.opts.onPlay());

    this.version.eventMode = 'static';
    this.version.cursor = 'pointer';
    this.version.on('pointerdown', () => {
      this.notesOpen = !this.notesOpen;
      this.notesBox.visible = this.notesOpen;
      this.notesText.visible = this.notesOpen;
    });

    this.notesBox.visible = false;
    this.notesText.visible = false;

    this.onResize();
  }

  destroy() {
    this.container.destroy({ children: true });
  }

  onResize() {
    const res = this.app.renderer.resolution || 1;
    const w = this.app.renderer.width / res;
    const h = this.app.renderer.height / res;

    this.bg.clear();
    this.bg.beginFill(0x070a10, 1);
    this.bg.drawRect(0, 0, w, h);
    this.bg.endFill();

    this.bg.lineStyle(1, 0x101828, 1);
    const step = 32;
    for (let x = 0; x < w + step; x += step) { this.bg.moveTo(x, 0); this.bg.lineTo(x, h); }
    for (let y = 0; y < h + step; y += step) { this.bg.moveTo(0, y); this.bg.lineTo(w, y); }

    this.title.anchor.set(0.5);
    this.sub.anchor.set(0.5);
    this.title.position.set(w / 2, h * 0.34);
    this.sub.position.set(w / 2, this.title.y + 44);

    const bw = 220, bh = 56;
    const bx = w / 2, by = h * 0.58;
    this.btn.clear();
    this.btn.beginFill(0x0b1220, 0.9);
    this.btn.drawRoundedRect(bx - bw / 2, by - bh / 2, bw, bh, 18);
    this.btn.endFill();
    this.btn.lineStyle(2, 0x1f2a44, 1);
    this.btn.drawRoundedRect(bx - bw / 2, by - bh / 2, bw, bh, 18);

    this.btnTxt.anchor.set(0.5);
    this.btnTxt.position.set(bx, by);

    this.version.anchor.set(1, 1);
    this.version.position.set(w - 10, h - 10);

    const nw = Math.min(760, w - 24);
    const nh = 120;
    const nx = w / 2;
    const ny = h * 0.82;

    this.notesBox.clear();
    this.notesBox.beginFill(0x05070c, 0.92);
    this.notesBox.drawRoundedRect(nx - nw / 2, ny - nh / 2, nw, nh, 16);
    this.notesBox.endFill();
    this.notesBox.lineStyle(1, 0x1f2a44, 1);
    this.notesBox.drawRoundedRect(nx - nw / 2, ny - nh / 2, nw, nh, 16);

    this.notesText.position.set(nx - nw / 2 + 14, ny - nh / 2 + 12);
    this.notesText.style.wordWrapWidth = nw - 28;
  }
}
