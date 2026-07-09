# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

IT Quest — edukasi IT top-down game. Phaser 3 + Vite + TypeScript. Single-player, no backend.

## Commands

```bash
npm install              # install deps
npm run dev              # dev server (localhost only)
npm run dev -- --host    # dev server, exposed to LAN (teman bisa akses pakai IP kamu)
npm run build            # typecheck + build for production
npm run preview          # preview production build
```

Typecheck only: `npx tsc --noEmit`

Windows Firewall: kalau `--host` masih connection refused dari device lain, jalankan di PowerShell Admin:
```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

## Architecture

- **Vite** bundler, **Phaser 3** game engine, all procedural graphics (no external assets yet).
- Four scenes registered in `src/main.ts`: `MenuScene` → `LessonSelectScene` → `StoryScene` → `GameScene`.
- Each scene is a class extending `Phaser.Scene` in its own file under `src/scenes/`.
- Physics: arcade, no gravity. Map/obstacles defined as inline constants in `GameScene.ts`.
- `GameScene` is lesson-aware: reads `lessonId` from `init(data)`, loads per-lesson objects, tasks, and mini-games.
- UI: `setScrollFactor(0)` Phaser text objects for HUD; dialogs use `dialogElements[]` array destroyed/recreated on open/close.
- Modal pattern (e.g. "Cara Bermain"): `Phaser.GameObjects.Container` — `.destroy()` cleans up all children at once.
- Visual novel pattern (StoryScene): typewriter effect via `this.time.addEvent`, click/space to advance.

## Mini-games in GameScene

Three lesson-specific mini-games, all dispatched from `openDialog()` by object name:

| Lesson | Object | Mini-game | Mechanic |
|---|---|---|---|
| fiber | Kabel FO | Splicing | 3-step: scrub (drag L↔R) → cut (click target) → splice (evaluate quality) |
| jaringan | Patch Panel | Wiring | Drag cable from left to right port (T-568B RJ45, 8 wires) |
| programming | Terminal | Block coding | Drag 12 shuffled code blocks into correct order (Server Health Checker script) |

Mini-game state is reset in `init()` and `closeDialog()`. Each has its own `reset*State()` method.

## Conventions

- Deliberate simplifications marked with `ponytail:` comments naming the ceiling and upgrade path.
- Placeholder rectangles for all visuals. Swap to sprites/spritesheets when art is ready (use `this.textures.exists()` guard to avoid duplicate-key errors on scene restart).
- Scene restarts must reset all mutable state in `init()` to avoid leaks.
- No ECS, no plugin system, no state manager, no factory pattern.
- Game object depth: 0=map bg, 1=obstacles/objects, 2=player, 3=labels/hints, 10=HUD, 15=dialog panel, 16=dialog content, 17=interactive zones/drag, 18=drag lines, 19=overlay bg, 20=overlay text/win.
- Map coordinate offset: `MAP_X=80, MAP_Y=60` — interactive objects add this to their logical position.
- Lesson data inline in `LessonSelectScene` and `StoryScene` (ponytail: move to `src/data/` when >6 lessons).
- Block/wiring palette data inline in GameScene (ponytail: extract to data files if reused across lessons).

## tsconfig notes

- `verbatimModuleSyntax: true` — bare `import { X }` only (no `import type` needed for values that are re-exported as types).
- `erasableSyntaxOnly: true` — no enums or namespace runtime constructs.
