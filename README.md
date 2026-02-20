# Neon Survivor (Phaser Port) — Etapa 1

Este projeto é a **Etapa 1** do port do seu jogo para **Phaser 3 (2D)** usando **Arcade Physics** e **mundo fixo 8000×8000**.

## O que já tem nesta etapa
- Vite + TypeScript + Phaser
- `MenuScene` com botão **Jogar**
- `GameScene` com:
  - mundo fixo **8000×8000**
  - Arcade Physics habilitado
  - jogador com movimento (WASD / setas)
  - câmera seguindo o jogador
  - chão com textura **tile** (gerada em runtime, sem precisar de imagem)

## Rodar local
1. Instale dependências:
   ```bash
   npm install
   ```
2. Rode:
   ```bash
   npm run dev
   ```

## Build
```bash
npm run build
npm run preview
```

## Próximas etapas (resumo)
- Etapa 2: inimigos + spawn + perseguição
- Etapa 3: balas + colisão + dano
- Etapa 4: level up + upgrades (Gauss 1–8)
