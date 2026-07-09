import Phaser from 'phaser'

// ponytail: no asset loading; all visuals procedural. Add preload() + atlas when art is ready.
export class MenuScene extends Phaser.Scene {
  private modal?: Phaser.GameObjects.Container

  constructor() { super('MenuScene') }

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

    // Buttons
    this.makeBtn(W / 2, 290, '▶  MULAI BELAJAR', 0x1155dd, 0x3377ff, () => {
      this.scene.start('LessonSelectScene')
    })
    this.makeBtn(W / 2, 370, '📖  CARA BERMAIN', 0x115533, 0x33aa66, () => {
      if (!this.modal) this.showHowToPlay()
    })

    // Version
    this.add.text(W - 10, H - 10, 'Phase 1 v0.1', {
      fontSize: '11px', color: '#334466',
    }).setOrigin(1, 1)
  }

  private makeBtn(x: number, y: number, label: string, colorNormal: number, colorHover: number, cb: () => void) {
    const bg = this.add.rectangle(x, y, 300, 52, colorNormal, 1)
      .setStrokeStyle(2, colorHover)
      .setInteractive({ useHandCursor: true })

    const txt = this.add.text(x, y, label, {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5)

    bg.on('pointerover', () => { bg.setFillStyle(colorHover); this.tweens.add({ targets: bg, scaleX: 1.04, scaleY: 1.04, duration: 80 }) })
    bg.on('pointerout',  () => { bg.setFillStyle(colorNormal); this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 80 }) })
    bg.on('pointerdown', cb)

    return { bg, txt }
  }

  private showHowToPlay() {
    const W = 800, H = 600

    // Container holds everything — destroy once to clean up all at once
    this.modal = this.add.container(0, 0).setDepth(10)

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75)
      .setInteractive()
    this.modal.add(overlay)

    const panel = this.add.rectangle(W / 2, H / 2, 520, 380, 0x111133, 1)
      .setStrokeStyle(2, 0x3355aa)
    this.modal.add(panel)

    const lines = [
      '🎮  CARA BERMAIN',
      '',
      'WASD / Arrow Keys   →  Gerakkan karakter',
      'E                   →  Interaksi dengan objek',
      '',
      '📋  Setiap pelajaran punya tugas berbeda.',
      'Dekati objek (Server, Router, dll),',
      'tekan E, lalu jawab pertanyaan yang muncul.',
      '',
      '✓  Jawab benar → task selesai',
      '✗  Jawab salah → bisa coba lagi',
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

    const closeBg = this.add.rectangle(W / 2, H / 2 + 165, 300, 52, 0x442222, 1)
      .setStrokeStyle(2, 0xaa3333)
      .setInteractive({ useHandCursor: true })
    this.modal.add(closeBg)

    const closeTxt = this.add.text(W / 2, H / 2 + 165, '✕  Tutup', {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.modal.add(closeTxt)

    closeBg.on('pointerover', () => closeBg.setFillStyle(0xaa3333))
    closeBg.on('pointerout',  () => closeBg.setFillStyle(0x442222))
    closeBg.on('pointerdown', () => {
      this.modal?.destroy()
      this.modal = undefined
    })

    // Click overlay to close too
    overlay.on('pointerdown', () => {
      this.modal?.destroy()
      this.modal = undefined
    })
  }
}
