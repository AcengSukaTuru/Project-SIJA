import Phaser from 'phaser'
import { UI } from '../ui/UI'

// ponytail: no asset loading; all visuals procedural. Add preload() + atlas when art is ready.
export class MenuScene extends Phaser.Scene {
  private modal?: Phaser.GameObjects.Container

  constructor() { super('MenuScene') }

  preload() {
    UI.preload(this)
  }

  create() {
    this.modal = undefined
    const W = 800, H = 600

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d0d1f)
    this.add.rectangle(W / 2, H * 0.25, W, H * 0.5, 0x1a1040, 0.6)

    // Decorative grid
    const g = this.add.graphics()
    g.lineStyle(1, 0x223366, 0.3)
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H)
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y)

    // Glow
    g.fillStyle(0x3344aa, 0.15)
    g.fillCircle(W / 2, 180, 160)

    // Title
    this.add.text(W / 2, 120, '💻 IT QUEST', {
      fontSize: '52px', color: '#4af0ff', fontStyle: 'bold',
      stroke: '#0033aa', strokeThickness: 6,
    }).setOrigin(0.5)

    this.add.text(W / 2, 180, 'Simulasi Belajar Jaringan & Sistem', {
      fontSize: '15px', color: '#8899cc',
    }).setOrigin(0.5)

    // Divider
    g.lineStyle(2, 0x334488, 1)
    g.lineBetween(200, 215, 600, 215)

    // Buttons — Kenney UI
    const startBtn = UI.makeBtn(this, W / 2, 290, 300, 52, '▶  MULAI BELAJAR', 'ui_btn_blue', { fontSize: '16px' })
    startBtn.on('pointerdown', () => this.scene.start('LessonSelectScene'))

    const howBtn = UI.makeBtn(this, W / 2, 370, 300, 52, '📖  CARA BERMAIN', 'ui_btn_green', { fontSize: '16px' })
    howBtn.on('pointerdown', () => { if (!this.modal) this.showHowToPlay() })

    // Version
    this.add.text(W - 10, H - 10, 'Phase 1 v0.1', {
      fontSize: '11px', color: '#334466',
    }).setOrigin(1, 1)
  }

  private showHowToPlay() {
    const W = 800, H = 600

    this.modal = this.add.container(0, 0).setDepth(10)

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75)
      .setInteractive()
    this.modal.add(overlay)

    // Panel — Kenney UI
    const panel = UI.makePanel(this, W / 2, H / 2, 520, 380)
    this.modal.add(panel)

    const lines = [
      'CARA BERMAIN',
      '',
      'WASD / Arrow Keys   →  Gerakkan karakter',
      'E                   →  Interaksi dengan objek',
      '',
      'Setiap pelajaran punya tugas berbeda.',
      'Dekati objek (Server, Router, dll),',
      'tekan E, lalu jawab pertanyaan yang muncul.',
      '',
      'Jawab benar → task selesai',
      'Jawab salah → bisa coba lagi',
      '',
      'Selesaikan semua task untuk lulus!',
    ]

    lines.forEach((line, i) => {
      const t = this.add.text(W / 2, H / 2 - 150 + i * 22, line, {
        fontSize: i === 0 ? '18px' : '13px',
        color: i === 0 ? '#4af0ff' : '#cccccc',
        fontStyle: i === 0 ? 'bold' : 'normal',
        align: 'center',
      }).setOrigin(0.5)
      this.modal!.add(t)
    })

    // Close button — Kenney UI
    const closeBtn = UI.makeBtn(this, W / 2, H / 2 + 165, 200, 46, 'Tutup', 'ui_btn_red', { fontSize: '14px' })
    this.modal.add(closeBtn)

    closeBtn.on('pointerdown', () => {
      this.modal?.destroy()
      this.modal = undefined
    })

    overlay.on('pointerdown', () => {
      this.modal?.destroy()
      this.modal = undefined
    })
  }
}
