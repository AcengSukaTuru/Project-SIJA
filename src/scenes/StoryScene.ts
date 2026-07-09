import Phaser from 'phaser'

// ponytail: slide content inline. Move to src/data/story.ts when multiple lessons need stories.

type Slide = {
  speaker: string
  speakerColor: string
  text: string
  bgColor: number       // background tint for the illustration area
  bgLabel: string       // placeholder label for illustration
}

const STORIES: Record<string, Slide[]> = {
  fiber: [
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Selamat datang di lab Fiber Optik! Kamu teknisi\nyang bertugas menyambung kabel fiber optik.',
      bgColor: 0x0a1a2a, bgLabel: '🏢  Lab Fiber Optik',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Fiber optik menggunakan cahaya untuk mengirim data\ncepat sekali — hingga 100 Gbps!',
      bgColor: 0x0a1520, bgLabel: '💡  Fiber Optik',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Kabel fiber terdiri dari: inti (core), selubung (cladding),\ndan jaket pelindung (coating).',
      bgColor: 0x0a1a1a, bgLabel: '🔬  Struktur Kabel',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Untuk menyambung kabel, kamu harus:\n1. Bersihkan jaket luar\n2. Potong (cleave) dengan presisi\n3. Sambung di mesin splicer',
      bgColor: 0x0a1a0a, bgLabel: '📋  Proses Splicing',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: '⚠️ Kualitas pembersihan dan pemotongan\nmenentukan apakah splice berhasil atau gagal!',
      bgColor: 0x1a0a0a, bgLabel: '⚠️  Kualitas Penting!',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Tutorial:\n  •  Gosok kiri-kanan untuk bersihkan kabel\n  •  Klik di garis target untuk potong\n  •  Klik tombol Splice untuk sambung',
      bgColor: 0x0a0a1a, bgLabel: '🎮  Kontrol',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Kamu siap! Masuk ke lab dan splicing kabel fiber\ndengan presisi. Semangat, teknisi! 💪',
      bgColor: 0x0a1a2a, bgLabel: '🚀  Siap!',
    },
  ],
  programming: [
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Selamat di Lab Programming! Kamu programmer\nyang harus menulis script untuk monitoring server.',
      bgColor: 0x0a1a2a, bgLabel: '💻  Lab Programming',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Script adalah rangkaian instruksi yang dijalankan\nkomputer secara berurutan dari atas ke bawah.',
      bgColor: 0x0a1520, bgLabel: '📜  Apa itu Script?',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Tipe data dasar:\n  •  String: teks "hello"\n  •  Number: angka 42\n  •  Boolean: true / false\n  •  Array: [1, 2, 3]',
      bgColor: 0x0a1a1a, bgLabel: '📦  Tipe Data',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Kontrol alur program:\n  •  for loop → ulangi sesuatu\n  •  if/else → buat keputusan\n  •  function → blok kode yang bisa dipanggil',
      bgColor: 0x0a1a0a, bgLabel: '🔀  Kontrol Alur',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Kamu akan menulis script "Server Health Checker"\nyang memeriksa status setiap server di datacenter.',
      bgColor: 0x1a0a0a, bgLabel: '🏥  Server Health Checker',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Tutorial:\n  •  Drag blok kode dari kiri ke slot kanan\n  •  Urutan blok HARUS benar\n  •  Klik "Run" untuk mengeksekusi script',
      bgColor: 0x0a0a1a, bgLabel: '🎮  Kontrol',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Kamu siap! Susun blok kode dengan benar\ndan jalankan server health checker! 💪',
      bgColor: 0x0a1a2a, bgLabel: '🚀  Siap!',
    },
  ],
  jaringan: [
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Selamat datang di lab Jaringan! Kamu teknisi yang\nbaru ditugaskan untuk membangun koneksi jaringan.',
      bgColor: 0x0a1a2a, bgLabel: '🏢  Lab Jaringan',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Jaringan komputer menghubungkan banyak perangkat\nsupaya bisa saling berkomunikasi dan berbagi data.',
      bgColor: 0x0a1520, bgLabel: '🌐  Jaringan Komputer',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Kabel UTP (Unshielded Twisted Pair) adalah kabel\npaling umum untuk jaringan lokal (LAN).',
      bgColor: 0x0a1a1a, bgLabel: '🔌  Kabel UTP',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Konektor RJ45 dipasang di ujung kabel UTP.\nUrutan warna kabel HARUS sesuai standar!',
      bgColor: 0x0a1a0a, bgLabel: '🔧  Konektor RJ45',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Standar T-568B (paling umum di Indonesia):\nPin 1-8: Putih-Orange, Orange, Putih-Hijau,\nBiru, Putih-Biru, Hijau, Putih-Coklat, Coklat.',
      bgColor: 0x1a1a0a, bgLabel: '📋  T-568B Standard',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Tutorial:\n  •  WASD / Arrow Keys → Bergerak\n  •  E → Interaksi dengan objek\n  •  Tarik kabel ke port yang benar',
      bgColor: 0x0a0a1a, bgLabel: '🎮  Kontrol',
    },
    {
      speaker: 'Narrator', speakerColor: '#4af0ff',
      text: 'Kamu siap! Masuk ke lab dan sambungkan kabel\nRJ45 sesuai standar T-568B. Semangat, teknisi! 💪',
      bgColor: 0x0a1a2a, bgLabel: '🚀  Siap!',
    },
  ],
}

export class StoryScene extends Phaser.Scene {
  private slides: Slide[] = []
  private lessonId = ''
  private currentSlide = 0

  // typewriter state
  private typewriterEvent?: Phaser.Time.TimerEvent
  private fullText = ''
  private displayedChars = 0
  private isTyping = false

  // UI elements (destroy on cleanup)
  private container!: Phaser.GameObjects.Container
  private bodyText!: Phaser.GameObjects.Text
  private speakerText!: Phaser.GameObjects.Text
  private progressText!: Phaser.GameObjects.Text
  private bgRect!: Phaser.GameObjects.Rectangle
  private bgLabel!: Phaser.GameObjects.Text
  private nextBtn!: Phaser.GameObjects.Text
  private skipHint!: Phaser.GameObjects.Text

  constructor() { super('StoryScene') }

  init(data: { lessonId?: string }) {
    this.lessonId = data?.lessonId ?? 'fiber'
    this.slides = STORIES[this.lessonId] ?? STORIES['fiber']
    this.currentSlide = 0
    this.typewriterEvent = undefined
    this.isTyping = false
    this.displayedChars = 0
  }

  create() {
    const W = 800, H = 600

    // Full container for easy cleanup
    this.container = this.add.container(0, 0)

    // Background
    this.container.add(this.add.rectangle(W / 2, H / 2, W, H, 0x0d0d1f))

    // Illustration area (top 60%)
    this.bgRect = this.add.rectangle(W / 2, H * 0.3, W, H * 0.6, 0x0a1a2a)
    this.container.add(this.bgRect)

    this.bgLabel = this.add.text(W / 2, H * 0.3, '', {
      fontSize: '32px', color: '#ffffff',
    }).setOrigin(0.5)
    this.container.add(this.bgLabel)

    // Progress indicator
    this.progressText = this.add.text(W - 16, 16, '', {
      fontSize: '12px', color: '#556688',
    }).setOrigin(1, 0)
    this.container.add(this.progressText)

    // Dialog box panel (bottom 40%)
    const dialogY = H * 0.72
    const dialogH = 180
    this.container.add(this.add.rectangle(W / 2, dialogY, W - 40, dialogH, 0x111122, 0.95)
      .setStrokeStyle(2, 0x3355aa))

    // Speaker name
    this.speakerText = this.add.text(50, dialogY - dialogH / 2 + 12, '', {
      fontSize: '14px', color: '#4af0ff', fontStyle: 'bold',
      backgroundColor: '#112244', padding: { x: 10, y: 4 },
    })
    this.container.add(this.speakerText)

    // Body text
    this.bodyText = this.add.text(50, dialogY - dialogH / 2 + 42, '', {
      fontSize: '15px', color: '#cccccc', lineSpacing: 6,
      wordWrap: { width: W - 120 },
    })
    this.container.add(this.bodyText)

    // Next button
    this.nextBtn = this.add.text(W - 70, dialogY + dialogH / 2 - 40, 'Lanjut ▶', {
      fontSize: '14px', color: '#4af0ff', backgroundColor: '#1133aa',
      padding: { x: 14, y: 6 },
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true })
    this.nextBtn.on('pointerover', () => this.nextBtn.setStyle({ backgroundColor: '#2255cc' }))
    this.nextBtn.on('pointerout',  () => this.nextBtn.setStyle({ backgroundColor: '#1133aa' }))
    this.nextBtn.on('pointerdown', () => this.advance())
    this.container.add(this.nextBtn)

    // Skip hint
    this.skipHint = this.add.text(W / 2, H - 12, 'Klik di mana saja atau tekan Spasi untuk lanjut', {
      fontSize: '10px', color: '#334455',
    }).setOrigin(0.5, 1)
    this.container.add(this.skipHint)

    // Input: Spasi
    this.input.keyboard!.on('keydown-SPACE', () => this.advance())

    // Input: Click pada area background (bukan tombol)
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, objs: Phaser.GameObjects.GameObject[]) => {
      // Only advance if click was NOT on the next button
      if (!objs.includes(this.nextBtn)) this.advance()
    })

    // Show first slide
    this.showSlide(0)
  }

  private showSlide(index: number) {
    this.currentSlide = index
    const slide = this.slides[index]

    // Update bg
    this.bgRect.setFillStyle(slide.bgColor)
    this.bgLabel.setText(slide.bgLabel)

    // Update speaker
    this.speakerText.setText(slide.speaker)
    this.speakerText.setStyle({ color: slide.speakerColor })

    // Update progress
    this.progressText.setText(`${index + 1}/${this.slides.length}`)

    // Update next button text
    if (index >= this.slides.length - 1) {
      this.nextBtn.setText('Mulai ▶▶')
    } else {
      this.nextBtn.setText('Lanjut ▶')
    }

    // Start typewriter
    this.startTypewriter(slide.text)
  }

  private startTypewriter(text: string) {
    // Cancel previous
    if (this.typewriterEvent) {
      this.typewriterEvent.destroy()
      this.typewriterEvent = undefined
    }

    this.fullText = text
    this.displayedChars = 0
    this.isTyping = true
    this.bodyText.setText('')

    this.typewriterEvent = this.time.addEvent({
      delay: 28,
      repeat: text.length - 1,
      callback: () => {
        this.displayedChars++
        this.bodyText.setText(this.fullText.substring(0, this.displayedChars))
        if (this.displayedChars >= this.fullText.length) {
          this.isTyping = false
        }
      },
    })
  }

  private advance() {
    if (this.isTyping) {
      // Skip typewriter → show full text
      if (this.typewriterEvent) {
        this.typewriterEvent.destroy()
        this.typewriterEvent = undefined
      }
      this.bodyText.setText(this.fullText)
      this.displayedChars = this.fullText.length
      this.isTyping = false
      return
    }

    // Next slide or finish
    if (this.currentSlide < this.slides.length - 1) {
      this.showSlide(this.currentSlide + 1)
    } else {
      // Done → go to GameScene
      this.scene.start('GameScene', { lessonId: this.lessonId })
    }
  }
}
