# Neon Survivor — PixiJS Port (v2.0.0)

Port do seu jogo (base v1.7.1) para **PixiJS** com **Vite + TypeScript**.

## Pronto nesta versão
- Mundo fixo 8000×8000 (world coords)
- Câmera seguindo o player (somente render por offset)
- Chão tile (TilingSprite, leve)
- Player: movimento (WASD/setas) + joystick mobile (touch)
- Inimigos:
  - Drone Enxame (kamikaze): spawn + perseguição com “curvinha” + separação leve
  - Caça Atirador (Burst 3x): mantém distância, telegráfa e atira 3 tiros em cone
- Arma do player (Canhão Gauss base):
  - dano 3
  - 4 tiros/s
  - projétil rápido
  - perfuração 0 (no início)

## Rodar
```bash
npm install
npm run dev
```

## Controles
- PC: WASD / setas
- Mobile: toque e arraste no lado esquerdo (joystick)
- ESC: volta pro menu
