import Phaser from 'phaser';
import { APP_UPDATE_NOTES, APP_VERSION } from '../version';

export class MenuScene extends Phaser.Scene {
  private notesOpen = false;

  constructor() {
    super('menu');
  }

  create() {
    const { width, height } = this.scale;

    // Background subtle grid
    const g = this.add.graphics();
    g.fillStyle(0x070a10, 1);
    g.fillRect(0, 0, width, height);
    g.lineStyle(1, 0x101828, 1);
    const step = 32;
    for (let x = 0; x < width + step; x += step) g.lineBetween(x, 0, x, height);
    for (let y = 0; y < height + step; y += step) g.lineBetween(0, y, width, y);

    const title = this.add.text(width / 2, height * 0.34, 'NEON SURVIVOR', {
      fontSize: '34px',
      color: '#eaffff',
      fontStyle: '900',
      letterSpacing: '2px',
    }).setOrigin(0.5);

    const sub = this.add.text(width / 2, title.y + 44, 'Port Phaser • Etapa 2', {
      fontSize: '14px',
      color: '#7dd3fc',
      letterSpacing: '1px',
    }).setOrigin(0.5);

    const btn = this.add.rectangle(width / 2, height * 0.58, 220, 56, 0x0b1220, 0.9)
      .setStrokeStyle(2, 0x1f2a44, 1)
      .setInteractive({ useHandCursor: true });

    const btnTxt = this.add.text(btn.x, btn.y, 'JOGAR', {
      fontSize: '18px',
      color: '#eaffff',
      fontStyle: '800',
      letterSpacing: '2px',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      this.scene.start('game');
    });

    // Version bottom-right (click to open notes)
    const version = this.add.text(width - 10, height - 10, APP_VERSION, {
      fontSize: '12px',
      color: '#9aa4b2',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

    const notesBox = this.add.rectangle(width / 2, height * 0.82, Math.min(760, width - 24), 110, 0x05070c, 0.92)
      .setStrokeStyle(1, 0x1f2a44, 1)
      .setVisible(false);

    const notesText = this.add.text(
      notesBox.x - notesBox.width / 2 + 14,
      notesBox.y - notesBox.height / 2 + 12,
      APP_UPDATE_NOTES.join('\n'),
      { fontSize: '12px', color: '#c7d2fe', wordWrap: { width: notesBox.width - 28 } }
    ).setVisible(false);

    version.on('pointerdown', () => {
      this.notesOpen = !this.notesOpen;
      notesBox.setVisible(this.notesOpen);
      notesText.setVisible(this.notesOpen);
    });

    // Handle resize
    this.scale.on('resize', (s: Phaser.Structs.Size) => {
      const w = s.width;
      const h = s.height;

      g.clear();
      g.fillStyle(0x070a10, 1);
      g.fillRect(0, 0, w, h);
      g.lineStyle(1, 0x101828, 1);
      for (let x = 0; x < w + step; x += step) g.lineBetween(x, 0, x, h);
      for (let y = 0; y < h + step; y += step) g.lineBetween(0, y, w, y);

      title.setPosition(w / 2, h * 0.34);
      sub.setPosition(w / 2, title.y + 44);
      btn.setPosition(w / 2, h * 0.58);
      btnTxt.setPosition(btn.x, btn.y);
      version.setPosition(w - 10, h - 10);

      notesBox.setPosition(w / 2, h * 0.82);
      notesBox.setSize(Math.min(760, w - 24), 110);
      notesText.setPosition(notesBox.x - notesBox.width / 2 + 14, notesBox.y - notesBox.height / 2 + 12);
      (notesText.style as any).wordWrapWidth = notesBox.width - 28;
    });
  }
}
