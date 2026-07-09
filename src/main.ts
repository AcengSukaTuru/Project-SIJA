import Phaser from 'phaser'
import { MenuScene } from './scenes/MenuScene'
import { LessonSelectScene } from './scenes/LessonSelectScene'
import { StoryScene } from './scenes/StoryScene'
import { GameScene } from './scenes/GameScene'

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  parent: 'game',
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  scene: [MenuScene, LessonSelectScene, StoryScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
})
