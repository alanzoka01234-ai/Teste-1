import './style.css';
import { Application } from 'pixi.js';
import { MenuView } from './views/MenuView';
import { GameView } from './views/GameView';

const root = document.getElementById('app')!;
const app = new Application();

(async () => {
  await app.init({
    resizeTo: window,
    antialias: true,
    background: '#070a10',
    resolution: Math.min(window.devicePixelRatio || 1, 1.5),
    autoDensity: true,
    powerPreference: 'high-performance',
  });

  root.appendChild(app.canvas);

  let current: MenuView | GameView;

  const goMenu = () => {
    if (current) current.destroy();
    current = new MenuView(app, { onPlay: goGame });
    app.stage.addChild(current.container);
  };

  const goGame = () => {
    if (current) current.destroy();
    current = new GameView(app, { onExit: goMenu });
    app.stage.addChild(current.container);
  };

  goMenu();

  window.addEventListener('resize', () => {
    if (current) current.onResize();
  });
})();
