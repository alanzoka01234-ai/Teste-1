import { Application, Container } from 'pixi.js';
import { World } from '../game/World';

export class GameView {
  container = new Container();
  private world: World;

  constructor(private app: Application, private opts: { onExit: () => void }) {
    this.world = new World(app, this.opts.onExit);
    this.container.addChild(this.world.container);
    this.app.ticker.add(this.update);
  }

  destroy() {
    this.app.ticker.remove(this.update);
    this.world.destroy();
    this.container.destroy({ children: true });
  }

  onResize() {
    this.world.onResize();
  }

  private update = (ticker: { deltaMS: number; lastTime: number }) => {
    this.world.update(ticker.deltaMS, ticker.lastTime);
  };
}
