import { Application, Graphics, Texture } from 'pixi.js';

export type GameTextures = {
  floorTile: Texture;
  player: Texture;
  drone: Texture;
  burst: Texture;
  bullet: Texture;
  enemyBullet: Texture;
};

export function createTextures(app: Application): GameTextures {
  // Floor tile 64×64
  const floorG = new Graphics();
  floorG.beginFill(0x070a10, 1);
  floorG.drawRect(0, 0, 64, 64);
  floorG.endFill();
  floorG.lineStyle(1, 0x0f172a, 1);
  for (let x = 0; x <= 64; x += 16) { floorG.moveTo(x, 0); floorG.lineTo(x, 64); }
  for (let y = 0; y <= 64; y += 16) { floorG.moveTo(0, y); floorG.lineTo(64, y); }
  floorG.beginFill(0x2dd4bf, 0.10); floorG.drawCircle(10, 14, 2); floorG.endFill();
  floorG.beginFill(0x60a5fa, 0.10); floorG.drawCircle(44, 40, 2); floorG.endFill();
  floorG.beginFill(0xf472b6, 0.08); floorG.drawCircle(30, 22, 2); floorG.endFill();
  const floorTile = app.renderer.generateTexture(floorG, { resolution: 1 });

  // Player
  const p = new Graphics();
  p.beginFill(0x00f5ff, 1); p.drawCircle(16, 16, 9); p.endFill();
  p.lineStyle(2, 0xeaffff, 1); p.drawCircle(16, 16, 10);
  p.beginFill(0x0b1220, 1); p.drawCircle(16, 16, 3); p.endFill();
  const player = app.renderer.generateTexture(p, { resolution: 1 });

  // Drone
  const d = new Graphics();
  d.beginFill(0x7dd3fc, 0.95); d.drawPolygon([16, 2, 30, 18, 16, 34]); d.endFill();
  d.beginFill(0x2dd4bf, 0.85); d.drawPolygon([16, 2, 2, 18, 16, 34]); d.endFill();
  d.lineStyle(2, 0xeaffff, 1); d.drawCircle(16, 18, 12);
  d.beginFill(0x0b1220, 1); d.drawCircle(16, 18, 3); d.endFill();
  const drone = app.renderer.generateTexture(d, { resolution: 1 });

  // Burst hunter
  const b = new Graphics();
  b.beginFill(0xff4d7d, 0.95); b.drawCircle(16, 16, 9); b.endFill();
  b.lineStyle(2, 0xeaffff, 0.9); b.drawCircle(16, 16, 11);
  b.beginFill(0x0b1220, 1); b.drawCircle(16, 16, 3); b.endFill();
  const burst = app.renderer.generateTexture(b, { resolution: 1 });

  // Bullets
  const bl = new Graphics();
  bl.beginFill(0xeaffff, 1); bl.drawRoundedRect(0, 0, 10, 3, 2); bl.endFill();
  const bullet = app.renderer.generateTexture(bl, { resolution: 1 });

  const ebl = new Graphics();
  ebl.beginFill(0xff4d7d, 1); ebl.drawRoundedRect(0, 0, 10, 3, 2); ebl.endFill();
  const enemyBullet = app.renderer.generateTexture(ebl, { resolution: 1 });

  return { floorTile, player, drone, burst, bullet, enemyBullet };
}
