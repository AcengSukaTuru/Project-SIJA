import Phaser from 'phaser'

// ponytail: lesson data is inline here. Move to src/data/lessons.ts when list grows past ~6.
type Lesson = {
  id: string
  icon: string
  title: string
  desc: string
  locked: boolean
}

const LESSONS: Lesson[] = [
  { id: 'fiber',      icon: '🔌',  title: 'Fiber Optik',    desc: 'Pelajari jenis kabel fiber, splicing, dan troubleshooting koneksi fiber.', locked: false },
  { id: 'jaringan',   icon: '🌐',  title: 'Jaringan',       desc: 'Sambung kabel RJ45, konfigurasi jaringan, dan diagnose koneksi.',          locked: false },
  { id: 'programming',icon: '💻',  title: 'Programming',    desc: 'Dasar pemrograman, debugging, dan struktur data untuk IT.',                locked: false },
  { id: 'devops',     icon: '🚀',  title: 'DevOps',         desc: 'CI/CD pipeline, container, monitoring, dan deployment otomatis.',          locked: true  },
]

export class LessonSelectScene extends Phaser.Scene {
  constructor() { super('LessonSelectScene') }

  create() {
    const W = 800, H = 600

    // BG
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d0d1f)
    const g = this.add.graphics()
    g.lineStyle(1, 0x223366, 0.2)
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H)
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y)

    // Header bar
    this.add.rectangle(W / 2, 40, W, 80, 0x111133, 1)
    this.add.text(W / 2, 28, '📚  Pilih Pelajaran', {
      fontSize: '24px', color: '#4af0ff', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.add.text(W / 2, 56, 'Selesaikan pelajaran secara berurutan', {
      fontSize: '12px', color: '#556688',
    }).setOrigin(0.5)

    // Back button
    this.makeBackBtn()

    // Lesson cards — 2 columns, 3 rows
    const cols = 2, cardW = 330, cardH = 120, gapX = 30, gapY = 16
    const startX = W / 2 - (cols * cardW + (cols - 1) * gapX) / 2 + cardW / 2
    const startY = 110

    LESSONS.forEach((lesson, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const cx = startX + col * (cardW + gapX)
      const cy = startY + row * (cardH + gapY)
      this.makeCard(cx, cy, cardW, cardH, lesson)
    })
  }

  private makeCard(cx: number, cy: number, w: number, h: number, lesson: Lesson) {
    const locked = lesson.locked
    const borderColor = locked ? 0x333355 : 0x2255aa
    const fillColor   = locked ? 0x0e0e1e : 0x111a33

    const card = this.add.rectangle(cx, cy, w, h, fillColor, 1)
      .setStrokeStyle(2, borderColor)

    this.add.text(cx - w / 2 + 18, cy - 28, lesson.icon + '  ' + lesson.title, {
      fontSize: '15px',
      color: locked ? '#445566' : '#aaddff',
      fontStyle: 'bold',
    })

    this.add.text(cx - w / 2 + 18, cy - 4, lesson.desc, {
      fontSize: '11px', color: locked ? '#334455' : '#8899bb',
      wordWrap: { width: w - 36 },
    })

    if (locked) {
      this.add.text(cx + w / 2 - 12, cy - h / 2 + 12, '🔒', {
        fontSize: '14px',
      }).setOrigin(1, 0)

      this.add.text(cx - w / 2 + 18, cy + 34, 'Terkunci — selesaikan pelajaran sebelumnya', {
        fontSize: '10px', color: '#334455', fontStyle: 'italic',
      })
    } else {
      const startBtn = this.add.text(cx + w / 2 - 16, cy + h / 2 - 16, '▶ Mulai', {
        fontSize: '12px', color: '#4af0ff', backgroundColor: '#1133aa',
        padding: { x: 10, y: 5 },
      }).setOrigin(1, 1).setInteractive({ useHandCursor: true })

      startBtn.on('pointerover', () => startBtn.setStyle({ backgroundColor: '#2255cc' }))
      startBtn.on('pointerout',  () => startBtn.setStyle({ backgroundColor: '#1133aa' }))
      startBtn.on('pointerdown', () => {
        this.scene.start('StoryScene', { lessonId: lesson.id })
      })

      // hover glow on whole card
      card.setInteractive({ useHandCursor: true })
      card.on('pointerover', () => card.setStrokeStyle(2, 0x4488ff))
      card.on('pointerout',  () => card.setStrokeStyle(2, borderColor))
      card.on('pointerdown', () => {
        this.scene.start('StoryScene', { lessonId: lesson.id })
      })

      // progress badge placeholder
      this.add.text(cx - w / 2 + 18, cy + 34, '[ ] Belum dimulai', {
        fontSize: '10px', color: '#445566',
      })
    }
  }

  private makeBackBtn() {
    const btn = this.add.text(16, 8, '← Kembali', {
      fontSize: '13px', color: '#778899', backgroundColor: '#111122',
      padding: { x: 10, y: 6 },
    }).setInteractive({ useHandCursor: true })

    btn.on('pointerover', () => btn.setStyle({ color: '#aabbcc' }))
    btn.on('pointerout',  () => btn.setStyle({ color: '#778899' }))
    btn.on('pointerdown', () => this.scene.start('MenuScene'))
  }
}
