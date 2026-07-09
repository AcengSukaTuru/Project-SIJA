import Phaser from 'phaser'

// ponytail: map is hardcoded; add Tiled JSON loader when you need bigger levels
const MAP_X = 80, MAP_Y = 60, MAP_W = 640, MAP_H = 480

const OBSTACLES = [
  { x: 200, y: 150, w: 80, h: 20 },
  { x: 400, y: 250, w: 20, h: 100 },
  { x: 150, y: 350, w: 60, h: 20 },
  { x: 500, y: 150, w: 20, h: 80 },
]

type ITObject = {
  name: string
  x: number; y: number; w: number; h: number
  color: number
  rect: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  hint: Phaser.GameObjects.Text
  done: boolean
}

// T-568B RJ45 wiring standard (pin 1-8)
const RJ45_COLORS: { name: string; hex: number }[] = [
  { name: 'Putih-Orange', hex: 0xffcc66 },
  { name: 'Orange',       hex: 0xff8800 },
  { name: 'Putih-Hijau',  hex: 0x88ff88 },
  { name: 'Biru',         hex: 0x2266ff },
  { name: 'Putih-Biru',   hex: 0x6699ff },
  { name: 'Hijau',        hex: 0x00bb00 },
  { name: 'Putih-Coklat', hex: 0xaa8855 },
  { name: 'Coklat',       hex: 0x663300 },
]

// ponytail: shuffle inline; move to utils if reused elsewhere
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Lesson object definitions
const LESSON_OBJECTS: Record<string, { name: string; x: number; y: number; w: number; h: number; color: number }[]> = {
  fiber: [
    { name: 'Kabel FO', x: 300, y: 200, w: 50, h: 16, color: 0xff6600 },
    { name: 'OTDR',     x: 450, y: 350, w: 36, h: 36, color: 0x226688 },
    { name: 'ODP',      x: 180, y: 280, w: 30, h: 40, color: 0x448844 },
  ],
  jaringan: [
    { name: 'Patch Panel', x: 300, y: 200, w: 40, h: 60, color: 0x444466 },
    { name: 'Switch',      x: 450, y: 350, w: 32, h: 32, color: 0x008888 },
    { name: 'Router',      x: 180, y: 280, w: 28, h: 28, color: 0xff8800 },
  ],
  programming: [
    { name: 'Terminal',     x: 300, y: 200, w: 44, h: 32, color: 0x222244 },
    { name: 'Code Editor',  x: 450, y: 350, w: 36, h: 36, color: 0x2d8aaa },
    { name: 'Debugger',     x: 180, y: 280, w: 30, h: 30, color: 0xaa4422 },
  ],
}

const LESSON_TASKS: Record<string, string[]> = {
  fiber:       ['Kabel FO - Splicing', 'OTDR - (locked)', 'ODP - (locked)'],
  jaringan:    ['Patch Panel - Sambung Kabel RJ45', 'Switch - (locked)', 'Router - (locked)'],
  programming: ['Terminal - Run Script', 'Code Editor - (locked)', 'Debugger - (locked)'],
}

const DEFAULT_TASKS = ['Task 1', 'Task 2', 'Task 3']

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key }
  private keyE!: Phaser.Input.Keyboard.Key
  private keyEsc!: Phaser.Input.Keyboard.Key

  private lessonId = 'fiber'
  private itObjects: ITObject[] = []
  private dialogOpen = false
  private dialogTimer?: Phaser.Time.TimerEvent
  private dialogElements: Phaser.GameObjects.GameObject[] = []

  // Wiring mini-game state (Jaringan)
  private wiringActive = false
  private wiringDragging = false
  private wiringDragFrom = -1
  private wiringConnections: number[] = []
  private wiringRightColors: { name: string; hex: number }[] = []
  private wiringLeftBars:  Phaser.GameObjects.Rectangle[] = []
  private wiringRightBars: Phaser.GameObjects.Rectangle[] = []
  private wiringGraphics!: Phaser.GameObjects.Graphics
  private wiringDragLine!: Phaser.GameObjects.Graphics
  private wiringObj!: ITObject
  private wiringCounterText!: Phaser.GameObjects.Text

  // Splicing mini-game state (Fiber)
  private splicingActive = false
  private splicingStep: 'clean' | 'cut' | 'splice' | 'done' = 'clean'
  private splicingObj!: ITObject
  private splicingCleanOk = false
  private splicingCutOk: 'perfect' | 'ok' | 'fail' = 'fail'
  // Clean sub-state
  private cleanCount = 0
  private cleanDir = 0           // -1 = kiri, 1 = kanan
  private cleanPrevX = 0
  private cleanProgressBar!: Phaser.GameObjects.Rectangle
  private cleanProgressBg!: Phaser.GameObjects.Rectangle
  private cleanStatusText!: Phaser.GameObjects.Text
  // Cut sub-state
  private cutTargetX = 0
  private cutClicked = false
  private cutGuide!: Phaser.GameObjects.Graphics

  // Block mini-game state (Programming)
  private blockActive = false
  private blockObj!: ITObject
  private blockOrder: number[] = []          // blockOrder[slotIdx] = blockIdx in palette (-1 = empty)
  private blockPaletteBars: Phaser.GameObjects.Rectangle[] = []
  private blockSlotBars: Phaser.GameObjects.Rectangle[] = []
  private blockDragFrom = -1
  private blockDragging = false
  private blockDragLine!: Phaser.GameObjects.Graphics
  private blockSlotTexts: Phaser.GameObjects.Text[] = []
  private blockPaletteTexts: Phaser.GameObjects.Text[] = []

  // UI
  private taskTexts: Phaser.GameObjects.Text[] = []
  private winText!: Phaser.GameObjects.Text
  private winShown = false

  constructor() { super('GameScene') }

  init(data?: { lessonId?: string }) {
    this.lessonId = data?.lessonId ?? 'fiber'
    this.itObjects = []
    this.dialogOpen = false
    this.dialogTimer = undefined
    this.dialogElements = []
    this.taskTexts = []
    this.winShown = false
    this.resetWiringState()
    this.resetSplicingState()
    this.resetBlockState()
  }

  private resetWiringState() {
    this.wiringActive = false
    this.wiringDragging = false
    this.wiringDragFrom = -1
    this.wiringConnections = []
    this.wiringRightColors = []
    this.wiringLeftBars = []
    this.wiringRightBars = []
    this.wiringObj = undefined!
  }

  private resetSplicingState() {
    this.splicingActive = false
    this.splicingStep = 'clean'
    this.splicingObj = undefined!
    this.splicingCleanOk = false
    this.splicingCutOk = 'fail'
    this.cleanCount = 0
    this.cleanDir = 0
    this.cleanPrevX = 0
    this.cutTargetX = 0
    this.cutClicked = false
  }

  private resetBlockState() {
    this.blockActive = false
    this.blockObj = undefined!
    this.blockOrder = []
    this.blockPaletteBars = []
    this.blockSlotBars = []
    this.blockDragFrom = -1
    this.blockDragging = false
    this.blockSlotTexts = []
    this.blockPaletteTexts = []
  }

  create() {
    // --- Map ---
    const bg = this.add.rectangle(MAP_X + MAP_W / 2, MAP_Y + MAP_H / 2, MAP_W, MAP_H, 0x0d0d1a)
    bg.setDepth(0)
    const border = this.add.graphics()
    border.lineStyle(3, 0x00ff88, 1)
    border.strokeRect(MAP_X, MAP_Y, MAP_W, MAP_H)
    border.setDepth(0)

    // --- Obstacles ---
    const walls = this.physics.add.staticGroup()
    for (const o of OBSTACLES) {
      const r = this.add.rectangle(MAP_X + o.x, MAP_Y + o.y, o.w, o.h, 0x666688)
      r.setDepth(1)
      this.physics.add.existing(r, true)
      walls.add(r)
    }

    // --- Player ---
    if (!this.textures.exists('player')) {
      const pg = this.make.graphics({ x: 0, y: 0 })
      pg.fillStyle(0x4488ff, 1)
      pg.fillRect(0, 0, 24, 24)
      pg.lineStyle(2, 0x88bbff, 1)
      pg.strokeRect(1, 1, 22, 22)
      pg.generateTexture('player', 24, 24)
      pg.destroy()
    }

    this.player = this.physics.add.image(MAP_X + MAP_W / 2, MAP_Y + MAP_H / 2, 'player')
    this.player.setDepth(2)
    this.player.setCollideWorldBounds(true)
    this.physics.world.setBounds(MAP_X, MAP_Y, MAP_W, MAP_H)
    this.physics.add.collider(this.player, walls)

    // --- IT Objects (per lesson) ---
    const defs = LESSON_OBJECTS[this.lessonId] ?? LESSON_OBJECTS['fiber']

    for (const d of defs) {
      const rect = this.add.rectangle(MAP_X + d.x, MAP_Y + d.y, d.w, d.h, d.color).setDepth(1)
      const label = this.add.text(MAP_X + d.x, MAP_Y + d.y - d.h / 2 - 14, d.name, {
        fontSize: '11px', color: '#cccccc', backgroundColor: '#00000088', padding: { x: 3, y: 2 }
      }).setOrigin(0.5, 1).setDepth(3)
      const hint = this.add.text(MAP_X + d.x, MAP_Y + d.y - d.h / 2 - 28, 'Press E', {
        fontSize: '10px', color: '#ffff00', backgroundColor: '#00000099', padding: { x: 3, y: 2 }
      }).setOrigin(0.5, 1).setDepth(3).setVisible(false)
      this.itObjects.push({
        name: d.name, x: MAP_X + d.x, y: MAP_Y + d.y, w: d.w, h: d.h, color: d.color,
        rect, label, hint, done: false,
      })
    }

    // --- Input ---
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.keyE   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.keyEsc = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)

    // --- Camera ---
    this.cameras.main.setBounds(MAP_X, MAP_Y, MAP_W, MAP_H)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

    // --- HUD ---
    this.add.text(10, 10, '📋 Tasks:', { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' })
      .setScrollFactor(0).setDepth(10)

    const taskDefs = LESSON_TASKS[this.lessonId] ?? DEFAULT_TASKS
    taskDefs.forEach((t, i) => {
      this.taskTexts[i] = this.add.text(10, 30 + i * 18, `[ ] ${t}`, {
        fontSize: '12px', color: '#aaaaaa'
      }).setScrollFactor(0).setDepth(10)
    })

    this.add.text(400, 590, 'WASD/Arrow: bergerak  |  E: interaksi', {
      fontSize: '11px', color: '#888888'
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(10)

    const backBtn = this.add.text(790, 10, '← Menu', {
      fontSize: '12px', color: '#667788', backgroundColor: '#0a0a1a',
      padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10)
      .setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setStyle({ color: '#aabbcc' }))
    backBtn.on('pointerout',  () => backBtn.setStyle({ color: '#667788' }))
    backBtn.on('pointerdown', () => this.scene.start('LessonSelectScene'))

    this.winText = this.add.text(400, 300, '🎉 Pelajaran Selesai!', {
      fontSize: '36px', color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setVisible(false)
  }

  update() {
    if (this.dialogOpen && Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.closeDialog()
      return
    }
    if (this.dialogOpen) { this.player.setVelocity(0, 0); return }

    const speed = 150
    let vx = 0, vy = 0
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -speed
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  speed
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -speed
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy =  speed
    this.player.setVelocity(vx, vy)

    let nearest: ITObject | null = null
    let nearestDist = Infinity
    for (const obj of this.itObjects) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y)
      obj.hint.setVisible(dist < 60)
      if (dist < 60 && dist < nearestDist) { nearest = obj; nearestDist = dist }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyE) && nearest) this.openDialog(nearest)
  }

  // ─── DIALOG DISPATCH ───────────────────────────────────────

  private openDialog(obj: ITObject) {
    if (this.dialogOpen) return
    this.dialogOpen = true

    // Fiber lesson
    if (obj.name === 'Kabel FO' && !obj.done) {
      this.openSplicingTask(obj)
    } else if (obj.name === 'Kabel FO' && obj.done) {
      this.showSimpleDialog('✓ Kabel fiber sudah di-splicing!', '#00ff88')

    // Jaringan lesson
    } else if (obj.name === 'Patch Panel' && !obj.done) {
      this.openWiringTask(obj)
    } else if (obj.name === 'Patch Panel' && obj.done) {
      this.showSimpleDialog('✓ Kabel RJ45 sudah tersambung!', '#00ff88')

    // Programming lesson
    } else if (obj.name === 'Terminal' && !obj.done) {
      this.openBlockTask(obj)
    } else if (obj.name === 'Terminal' && obj.done) {
      this.showSimpleDialog('✓ Script berhasil dijalankan!', '#00ff88')

    // Everything else
    } else {
      this.showSimpleDialog(`🔒 ${obj.name} — Coming Soon`, '#aaaaaa')
    }
  }

  private showSimpleDialog(msg: string, color: string) {
    const cx = 400, cy = 300, D = this.dialogElements
    D.push(this.add.rectangle(cx, cy, 620, 320, 0x111122, 0.95)
      .setScrollFactor(0).setDepth(15).setStrokeStyle(2, 0x4488ff))
    this.addDialogText(D, cx, cy - 20, msg, '16px', color, 'bold')
    this.addCloseBtn(D, cx, cy + 80)
  }

  // ═══════════════════════════════════════════════════════════
  // SPLICING MINI-GAME (Fiber Optik)
  // ═══════════════════════════════════════════════════════════

  private openSplicingTask(obj: ITObject) {
    this.splicingObj = obj
    this.splicingActive = true
    this.splicingStep = 'clean'
    this.splicingCleanOk = false
    this.splicingCutOk = 'fail'
    this.cleanCount = 0
    this.cleanDir = 0
    this.cleanPrevX = 0
    this.cutClicked = false

    const cx = 400, cy = 300, D = this.dialogElements
    const panelW = 700, panelH = 450

    // Panel bg
    D.push(this.add.rectangle(cx, cy, panelW, panelH, 0x111122, 0.97)
      .setScrollFactor(0).setDepth(15).setStrokeStyle(2, 0xff6600))

    // Header
    this.addDialogText(D, cx, cy - panelH / 2 + 28, '🔌  Splicing Fiber Optik', '16px', '#ff8844', 'bold')

    // Start with clean step
    this.showCleanStep()
  }

  private showCleanStep() {
    const cx = 400, cy = 300, D = this.dialogElements
    const panelH = 450

    // Subheader
    this.addDialogText(D, cx, cy - panelH / 2 + 56, 'Step 1: Bersihkan kabel — Gosok kiri ↔ kanan', '12px', '#ccaa66')

    // Fiber cable visual (horizontal bar)
    const cableX = cx - 150, cableY = cy - 20, cableW = 300, cableH = 18
    // Dirty layer (brown-ish coating)
    const dirtyLayer = this.add.rectangle(cableX + cableW / 2, cableY, cableW, cableH, 0x664422)
      .setScrollFactor(0).setDepth(16)
    D.push(dirtyLayer)
    // Actual fiber (orange, visible as cleaning progresses)
    const fiberLayer = this.add.rectangle(cableX + cableW / 2, cableY, cableW, cableH, 0xff6600)
      .setScrollFactor(0).setDepth(16)
    D.push(fiberLayer)

    // Labels
    this.addDialogText(D, cableX - 10, cableY, '→', '14px', '#666666')
    this.addDialogText(D, cableX + cableW + 10, cableY, '←', '14px', '#666666')
    this.addDialogText(D, cx, cableY - 30, 'Area pembersihan', '10px', '#666666')

    // Progress bar bg
    const pbW = 300, pbH = 14, pbY = cableY + 50
    this.cleanProgressBg = this.add.rectangle(cx, pbY, pbW, pbH, 0x222233)
      .setScrollFactor(0).setDepth(16)
    D.push(this.cleanProgressBg)

    // Progress bar fill
    this.cleanProgressBar = this.add.rectangle(cx - pbW / 2, pbY, 0, pbH, 0x44aa44)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(16)
    D.push(this.cleanProgressBar)

    // Status text
    this.cleanStatusText = this.add.text(cx, pbY + 20, 'Gosok kiri ↔ kanan di area kabel...', {
      fontSize: '11px', color: '#888888',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(16)
    D.push(this.cleanStatusText)

    // Clean area (invisible interactive zone for detecting scrubs)
    const cleanZone = this.add.rectangle(cx, cableY, cableW + 40, cableH + 40, 0x000000, 0.001)
      .setScrollFactor(0).setDepth(17)
      .setInteractive()
    D.push(cleanZone)

    // Scrub handler
    const scrubHandler = (pointer: Phaser.Input.Pointer) => {
      if (!this.splicingActive || this.splicingStep !== 'clean') return
      const x = pointer.x
      const dir = x < this.cleanPrevX ? -1 : x > this.cleanPrevX ? 1 : 0

      if (dir !== 0 && dir !== this.cleanDir && Math.abs(x - this.cleanPrevX) > 15) {
        this.cleanDir = dir
        this.cleanCount++
        const pct = Math.min(this.cleanCount / 10, 1)
        this.cleanProgressBar.setSize(300 * pct, 14)
        if (pct >= 0.6) {
          this.cleanProgressBar.setFillStyle(0x00ff88)
        }
        this.cleanStatusText.setText(`Gosokan: ${Math.min(this.cleanCount, 10)}/10`)
      }
      this.cleanPrevX = x

      // Done cleaning
      if (this.cleanCount >= 10) {
        this.input.off('pointermove', scrubHandler)
        this.splicingCleanOk = this.cleanCount >= 6
        this.cleanStatusText.setText(this.splicingCleanOk ? '✓ Bersih!' : '✗ Kurang bersih...')
        this.cleanStatusText.setStyle({ color: this.splicingCleanOk ? '#00ff88' : '#ff4444' })

        this.time.delayedCall(800, () => {
          // Clean up clean step elements
          this.dialogElements.forEach(el => el.destroy())
          this.dialogElements.length = 0
          // Re-add panel
          const D2 = this.dialogElements
          D2.push(this.add.rectangle(400, 300, 700, 450, 0x111122, 0.97)
            .setScrollFactor(0).setDepth(15).setStrokeStyle(2, 0xff6600))
          this.addDialogText(D2, 400, 300 - 225 + 28, '🔌  Splicing Fiber Optik', '16px', '#ff8844', 'bold')
          this.splicingStep = 'cut'
          this.showCutStep()
        })
      }
    }

    this.input.on('pointermove', scrubHandler)
    // Store handler reference for cleanup
    const cleanupScrub = () => { this.input.off('pointermove', scrubHandler) }
    this.events.once('shutdown', cleanupScrub)
  }

  private showCutStep() {
    const cx = 400, cy = 300, D = this.dialogElements
    const panelH = 450

    this.addDialogText(D, cx, cy - panelH / 2 + 56, 'Step 2: Potong kabel — Klik di garis target', '12px', '#ccaa66')

    // Cable visual
    const cableX = cx - 160, cableY = cy - 20, cableW = 320, cableH = 16
    this.add.rectangle(cableX + cableW / 2, cableY, cableW, cableH, 0xff6600)
      .setScrollFactor(0).setDepth(16)

    // Target line (random in middle zone)
    this.cutTargetX = cableX + 100 + Math.random() * 120
    this.cutGuide = this.add.graphics().setScrollFactor(0).setDepth(17)
    this.cutGuide.lineStyle(2, 0xffffff, 0.7)
    for (let y = cableY - 30; y < cableY + 30; y += 6) {
      this.cutGuide.lineBetween(this.cutTargetX, y, this.cutTargetX, y + 3)
    }
    D.push(this.cutGuide)

    this.addDialogText(D, cx, cableY - 50, 'Klik tepat di garis putus-putus', '11px', '#888888')
    this.addDialogText(D, this.cutTargetX, cableY + 35, '↓ target', '10px', '#ffffff')

    // Click zone (covers cable area)
    const clickZone = this.add.rectangle(cx, cableY, cableW + 40, 120, 0x000000, 0.001)
      .setScrollFactor(0).setDepth(17)
      .setInteractive()
    D.push(clickZone)

    // Result text (will be set on click)
    const resultText = this.add.text(cx, cableY + 70, '', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(16).setVisible(false)
    D.push(resultText)

    // Cut handler
    const cutHandler = (pointer: Phaser.Input.Pointer) => {
      if (!this.splicingActive || this.splicingStep !== 'cut' || this.cutClicked) return
      this.cutClicked = true
      clickZone.disableInteractive()

      const dist = Math.abs(pointer.x - this.cutTargetX)
      let quality: 'perfect' | 'ok' | 'fail'
      let msg: string
      let color: string

      if (dist <= 8) {
        quality = 'perfect'; msg = '✓ Perfect Cut!'; color = '#00ff88'
      } else if (dist <= 20) {
        quality = 'ok'; msg = '~ Oke, cukup rapi'; color = '#ffcc00'
      } else {
        quality = 'fail'; msg = '✗ Meleset! Kabel rusak.'; color = '#ff4444'
      }

      this.splicingCutOk = quality
      resultText.setText(msg).setStyle({ color }).setVisible(true)

      // Draw cut mark
      this.cutGuide.lineStyle(3, quality === 'fail' ? 0xff2222 : 0x00ff88, 1)
      this.cutGuide.lineBetween(pointer.x, cableY - 12, pointer.x, cableY + 12)

      this.time.delayedCall(1000, () => {
        this.input.off('pointerdown', cutHandler)
        // Clean up cut step
        this.dialogElements.forEach(el => el.destroy())
        this.dialogElements.length = 0
        // Re-add panel
        const D2 = this.dialogElements
        D2.push(this.add.rectangle(400, 300, 700, 450, 0x111122, 0.97)
          .setScrollFactor(0).setDepth(15).setStrokeStyle(2, 0xff6600))
        this.addDialogText(D2, 400, 300 - 225 + 28, '🔌  Splicing Fiber Optik', '16px', '#ff8844', 'bold')
        this.splicingStep = 'splice'
        this.showSpliceStep()
      })
    }

    this.input.on('pointerdown', cutHandler)
  }

  private showSpliceStep() {
    const cx = 400, cy = 300, D = this.dialogElements
    const panelH = 450

    this.addDialogText(D, cx, cy - panelH / 2 + 56, 'Step 3: Sambung di mesin splicer', '12px', '#ccaa66')

    // Splicer machine visual
    this.add.rectangle(cx, cy - 20, 200, 80, 0x333344)
      .setScrollFactor(0).setDepth(16).setStrokeStyle(2, 0x556677)
    this.addDialogText(D, cx, cy - 20, '⚙️  SPlicer', '14px', '#aabbcc', 'bold')

    // Two fiber ends going into splicer
    const g = this.add.graphics().setScrollFactor(0).setDepth(16)
    g.lineStyle(4, 0xff6600, 1)
    g.lineBetween(cx - 180, cy - 20, cx - 100, cy - 20) // left cable
    g.lineBetween(cx + 100, cy - 20, cx + 180, cy - 20) // right cable
    D.push(g)

    // Quality summary
    const cleanLabel = this.splicingCleanOk ? '✓ Bersih' : '✗ Kurang bersih'
    const cleanColor = this.splicingCleanOk ? '#00ff88' : '#ff4444'
    const cutLabel = this.splicingCutOk === 'perfect' ? '✓ Perfect' : this.splicingCutOk === 'ok' ? '~ Oke' : '✗ Gagal'
    const cutColor = this.splicingCutOk === 'perfect' ? '#00ff88' : this.splicingCutOk === 'ok' ? '#ffcc00' : '#ff4444'

    this.addDialogText(D, cx - 100, cy + 50, `Pembersihan: ${cleanLabel}`, '11px', cleanColor)
    this.addDialogText(D, cx + 100, cy + 50, `Pemotongan: ${cutLabel}`, '11px', cutColor)

    // Splice button
    const btn = this.add.text(cx, cy + 100, '⚡  SPLICE', {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold', backgroundColor: '#aa4400',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(16)
      .setInteractive({ useHandCursor: true })
    D.push(btn)

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#cc6600' }))
    btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#aa4400' }))
    btn.on('pointerdown', () => this.evaluateSplice())
  }

  private evaluateSplice() {
    const success = this.splicingCleanOk && this.splicingCutOk !== 'fail'

    // Clean up splice step, show result
    this.dialogElements.forEach(el => el.destroy())
    this.dialogElements.length = 0

    const cx = 400, cy = 300, D = this.dialogElements
    D.push(this.add.rectangle(cx, cy, 700, 450, 0x111122, 0.97)
      .setScrollFactor(0).setDepth(15).setStrokeStyle(2, success ? 0x00ff88 : 0xff4444))

    this.addDialogText(D, cx, cy - 225 + 28, '🔌  Hasil Splicing', '16px', success ? '#00ff88' : '#ff4444', 'bold')

    if (success) {
      const quality = this.splicingCutOk === 'perfect' ? 'Sempurna' : 'Berhasil'
      const qualityColor = this.splicingCutOk === 'perfect' ? '#00ff88' : '#ffcc00'

      this.addDialogText(D, cx, cy - 40, `✓ Splice ${quality}!`, '22px', qualityColor, 'bold')
      this.addDialogText(D, cx, cy + 10, 'Kabel fiber optik tersambung\ndengan baik.', '13px', '#aaffaa')

      this.splicingObj.done = true
      this.taskTexts[0].setText('[✓] Kabel FO - Spliced!').setStyle({ color: '#00ff88' })
      this.splicingStep = 'done'
      this.splicingActive = false

      this.dialogTimer = this.time.delayedCall(2500, () => {
        this.closeDialog()
        if (!this.winShown) { this.winShown = true; this.winText.setVisible(true) }
      })
    } else {
      const reasons: string[] = []
      if (!this.splicingCleanOk) reasons.push('• Kabel kurang bersih')
      if (this.splicingCutOk === 'fail') reasons.push('• Potongan tidak presisi')

      this.addDialogText(D, cx, cy - 40, '✗ Splice Gagal!', '22px', '#ff4444', 'bold')
      this.addDialogText(D, cx, cy + 5, 'Penyebab:', '13px', '#ff8888')
      this.addDialogText(D, cx, cy + 30, reasons.join('\n'), '12px', '#cc6666')
      this.addDialogText(D, cx, cy + 75, 'Kualitas pembersihan dan pemotongan\nharus lebih baik untuk splice berhasil.', '11px', '#888888')

      // Retry button
      const retryBtn = this.add.text(cx, cy + 130, '🔄  Ulangi', {
        fontSize: '16px', color: '#ffffff', fontStyle: 'bold', backgroundColor: '#444466',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(16)
        .setInteractive({ useHandCursor: true })
      D.push(retryBtn)
      retryBtn.on('pointerover', () => retryBtn.setStyle({ backgroundColor: '#556688' }))
      retryBtn.on('pointerout',  () => retryBtn.setStyle({ backgroundColor: '#444466' }))
      retryBtn.on('pointerdown', () => {
        this.dialogElements.forEach(el => el.destroy())
        this.dialogElements.length = 0
        this.resetSplicingState()
        this.splicingActive = true
        this.splicingStep = 'clean'
        this.splicingObj = this.itObjects.find(o => o.name === 'Kabel FO')!
        const D2 = this.dialogElements
        D2.push(this.add.rectangle(400, 300, 700, 450, 0x111122, 0.97)
          .setScrollFactor(0).setDepth(15).setStrokeStyle(2, 0xff6600))
        this.addDialogText(D2, 400, 300 - 225 + 28, '🔌  Splicing Fiber Optik', '16px', '#ff8844', 'bold')
        this.showCleanStep()
      })

      // Close button too
      this.addCloseBtn(D, cx, cy + 175)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // WIRING MINI-GAME (Jaringan)
  // ═══════════════════════════════════════════════════════════

  private openWiringTask(obj: ITObject) {
    this.wiringObj = obj
    this.wiringActive = true
    this.wiringDragging = false
    this.wiringDragFrom = -1
    this.wiringConnections = RJ45_COLORS.map(() => -1)
    this.wiringRightColors = shuffle(RJ45_COLORS)
    this.wiringLeftBars = []
    this.wiringRightBars = []

    const cx = 400, cy = 300, D = this.dialogElements
    const panelW = 700, panelH = 450

    D.push(this.add.rectangle(cx, cy, panelW, panelH, 0x111122, 0.97)
      .setScrollFactor(0).setDepth(15).setStrokeStyle(2, 0x4488ff))

    this.addDialogText(D, cx, cy - panelH / 2 + 28, '🔧  Sambungkan Kabel RJ45', '16px', '#4af0ff', 'bold')
    this.addDialogText(D, cx, cy - panelH / 2 + 52, 'Tarik kabel dari KIRI ke port tujuan di KANAN', '11px', '#8899bb')

    this.wiringCounterText = this.add.text(cx + panelW / 2 - 20, cy - panelH / 2 + 16, '0/8', {
      fontSize: '12px', color: '#556688',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(16)
    D.push(this.wiringCounterText)

    const leftX = cx - 180, rightX = cx + 120
    const barStartY = cy - panelH / 2 + 85
    const barH = 36, barGap = 6

    this.addDialogText(D, leftX, barStartY - 20, 'Kabel (Benar)', '12px', '#aaddff', 'bold')
    this.addDialogText(D, rightX, barStartY - 20, 'Port (Acak)', '12px', '#ffcc66', 'bold')

    this.wiringGraphics = this.add.graphics().setScrollFactor(0).setDepth(17)
    D.push(this.wiringGraphics)
    this.wiringDragLine = this.add.graphics().setScrollFactor(0).setDepth(18)
    D.push(this.wiringDragLine)

    for (let i = 0; i < 8; i++) {
      const y = barStartY + i * (barH + barGap)
      const c = RJ45_COLORS[i]

      const pinLabel = this.add.text(leftX - 50, y + barH / 2, `Pin ${i + 1}`, {
        fontSize: '10px', color: '#667788',
      }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(16)
      D.push(pinLabel)

      const bar = this.add.rectangle(leftX, y, 120, barH, c.hex)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(16)
        .setStrokeStyle(2, 0x333344)
        .setInteractive({ useHandCursor: true })
      D.push(bar)
      this.wiringLeftBars.push(bar)

      const textColor = c.hex === 0x2266ff || c.hex === 0x663300 ? '#ffffff' : '#000000'
      const barLabel = this.add.text(leftX + 60, y + barH / 2, c.name, {
        fontSize: '10px', color: textColor,
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(16)
      D.push(barLabel)

      bar.on('pointerdown', () => {
        if (!this.wiringActive || this.wiringConnections[i] >= 0) return
        this.wiringDragging = true
        this.wiringDragFrom = i
        this.wiringLeftBars[i].setStrokeStyle(3, 0xffff00)
      })
    }

    for (let j = 0; j < 8; j++) {
      const y = barStartY + j * (barH + barGap)
      const c = this.wiringRightColors[j]

      const bar = this.add.rectangle(rightX + 120, y, 120, barH, c.hex)
        .setOrigin(1, 0).setScrollFactor(0).setDepth(16)
        .setStrokeStyle(2, 0x333344)
      D.push(bar)
      this.wiringRightBars.push(bar)

      const portLabel = this.add.text(rightX + 130, y + barH / 2, `Port ${j + 1}`, {
        fontSize: '10px', color: '#667788',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(16)
      D.push(portLabel)

      const textColor = c.hex === 0x2266ff || c.hex === 0x663300 ? '#ffffff' : '#000000'
      const barLabel = this.add.text(rightX + 60, y + barH / 2, c.name, {
        fontSize: '10px', color: textColor,
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(16)
      D.push(barLabel)
    }

    this.input.on('pointermove', this.onWiringDragMove, this)
    this.input.on('pointerup', this.onWiringDragEnd, this)
  }

  private onWiringDragMove(pointer: Phaser.Input.Pointer) {
    if (!this.wiringDragging || this.wiringDragFrom < 0) return
    const leftBar = this.wiringLeftBars[this.wiringDragFrom]
    const g = this.wiringDragLine
    g.clear()

    const startX = leftBar.x + leftBar.width
    const startY = leftBar.y + leftBar.height / 2
    const endX = pointer.x
    const endY = pointer.y

    for (let j = 0; j < this.wiringRightBars.length; j++) {
      const rb = this.wiringRightBars[j]
      if (this.wiringConnections.includes(j)) continue
      rb.setStrokeStyle(rb.getBounds().contains(pointer.x, pointer.y) ? 3 : 2,
        rb.getBounds().contains(pointer.x, pointer.y) ? 0x8888ff : 0x333344)
    }

    g.lineStyle(3, 0xffcc00, 0.8)
    const midX = (startX + endX) / 2
    g.lineBetween(startX, startY, midX, startY)
    g.lineBetween(midX, startY, midX, endY)
    g.lineBetween(midX, endY, endX, endY)
  }

  private onWiringDragEnd(pointer: Phaser.Input.Pointer) {
    if (!this.wiringDragging || this.wiringDragFrom < 0) {
      this.wiringDragging = false
      this.wiringDragFrom = -1
      return
    }

    const leftIdx = this.wiringDragFrom
    this.wiringDragLine.clear()
    this.wiringDragging = false
    this.wiringDragFrom = -1

    let hitIdx = -1
    for (let j = 0; j < this.wiringRightBars.length; j++) {
      if (this.wiringConnections.includes(j)) continue
      if (this.wiringRightBars[j].getBounds().contains(pointer.x, pointer.y)) {
        hitIdx = j; break
      }
    }

    for (let j = 0; j < this.wiringRightBars.length; j++) {
      if (!this.wiringConnections.includes(j)) {
        this.wiringRightBars[j].setStrokeStyle(2, 0x333344)
      }
    }

    if (hitIdx < 0) {
      this.wiringLeftBars[leftIdx].setStrokeStyle(2, 0x333344)
      return
    }

    if (RJ45_COLORS[leftIdx].hex === this.wiringRightColors[hitIdx].hex) {
      this.wiringConnections[leftIdx] = hitIdx
      this.wiringLeftBars[leftIdx].setStrokeStyle(2, 0x00ff88)
      this.wiringRightBars[hitIdx].setStrokeStyle(2, 0x00ff88)
      this.wiringLeftBars[leftIdx].disableInteractive()
      this.redrawWiringLines()
      this.wiringCounterText.setText(`${this.wiringConnections.filter(c => c >= 0).length}/8`)
      if (this.wiringConnections.every(c => c >= 0)) this.onWiringComplete()
    } else {
      this.wiringLeftBars[leftIdx].setStrokeStyle(2, 0x333344)
      this.wiringRightBars[hitIdx].setStrokeStyle(3, 0xff2222)
      this.time.delayedCall(400, () => {
        if (this.wiringRightBars[hitIdx]) {
          this.wiringRightBars[hitIdx].setStrokeStyle(2, 0x333344)
        }
      })
    }
  }

  private redrawWiringLines() {
    const g = this.wiringGraphics
    g.clear()
    for (let i = 0; i < 8; i++) {
      const ri = this.wiringConnections[i]
      if (ri < 0) continue
      const lb = this.wiringLeftBars[i]
      const rb = this.wiringRightBars[ri]
      g.lineStyle(3, 0x00ff88, 0.8)
      g.lineBetween(lb.x + lb.width, lb.y + lb.height / 2, rb.x - rb.width, rb.y + rb.height / 2)
    }
  }

  private onWiringComplete() {
    this.wiringActive = false
    this.wiringObj.done = true
    this.taskTexts[0].setText('[✓] Patch Panel - Terpasang!').setStyle({ color: '#00ff88' })

    const cx = 400, cy = 300, D = this.dialogElements
    D.push(this.add.rectangle(cx, cy, 400, 100, 0x0a2a0a, 0.95)
      .setScrollFactor(0).setDepth(18).setStrokeStyle(2, 0x00ff88))
    D.push(this.add.text(cx, cy - 10, '✓ Semua kabel tersambung dengan benar!', {
      fontSize: '16px', color: '#00ff88', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(19))
    D.push(this.add.text(cx, cy + 18, 'RJ45 T-568B Standard ✓', {
      fontSize: '12px', color: '#88ccaa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(19))

    this.dialogTimer = this.time.delayedCall(2500, () => {
      this.closeDialog()
      if (!this.winShown) { this.winShown = true; this.winText.setVisible(true) }
    })
  }

  // ═══════════════════════════════════════════════════════════
  // BLOCK CODING MINI-GAME (Programming)
  // ═══════════════════════════════════════════════════════════

  // ponytail: blocks are inline arrays. Move to src/data/blocks.ts when adding more lessons.

  private readonly SCRIPT_BLOCKS = [
    { code: 'servers = getServerList("datacenter-1")',     color: 0x4444aa },
    { code: 'upCount = 0',                                color: 0x4444aa },
    { code: 'downCount = 0',                              color: 0x4444aa },
    { code: 'for server in servers:',                     color: 0x8844aa },
    { code: '    status = checkStatus(server)',            color: 0x226688 },
    { code: '    if status == "down":',                    color: 0xaa4444 },
    { code: '        log(f"[ALERT] {server} is DOWN!")',   color: 0xaa4444 },
    { code: '        restartService(server)',              color: 0x886644 },
    { code: '        downCount += 1',                     color: 0xaa4444 },
    { code: '    else:',                                  color: 0x44aa44 },
    { code: '        log(f"[OK] {server} is healthy")',   color: 0x44aa44 },
    { code: '        upCount += 1',                       color: 0x44aa44 },
  ]

  private readonly CORRECT_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  private openBlockTask(obj: ITObject) {
    this.blockObj = obj
    this.blockActive = true
    this.blockOrder = this.SCRIPT_BLOCKS.map(() => -1)
    this.blockPaletteBars = []
    this.blockSlotBars = []
    this.blockSlotTexts = []
    this.blockPaletteTexts = []
    this.blockDragFrom = -1
    this.blockDragging = false

    const cx = 400, cy = 300, D = this.dialogElements
    const panelW = 720, panelH = 500

    D.push(this.add.rectangle(cx, cy, panelW, panelH, 0x111122, 0.97)
      .setScrollFactor(0).setDepth(15).setStrokeStyle(2, 0x2d8aaa))

    this.addDialogText(D, cx, cy - panelH / 2 + 24, '💻  Susun Script: Server Health Checker', '15px', '#44ccff', 'bold')
    this.addDialogText(D, cx, cy - panelH / 2 + 46, 'Tarik blok kode ke slot yang tepat — urutan dari atas ke bawah', '10px', '#6688aa')

    const paletteX = cx - 230, slotX = cx + 60
    const startY = cy - panelH / 2 + 72
    const barH = 24, barW = 260, gap = 4

    // Headers
    this.addDialogText(D, paletteX + barW / 2, startY - 14, 'Blok Kode', '10px', '#aaddff')
    this.addDialogText(D, slotX + barW / 2, startY - 14, 'Slot Script (urut!)', '10px', '#ffcc66')

    // Drag line graphics
    this.blockDragLine = this.add.graphics().setScrollFactor(0).setDepth(18)
    D.push(this.blockDragLine)

    // Slot column (drop targets, empty)
    for (let s = 0; s < 12; s++) {
      const y = startY + s * (barH + gap)
      const slotLabel = this.add.text(slotX - 18, y + barH / 2, `${s + 1}.`, {
        fontSize: '9px', color: '#556677',
      }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(16)
      D.push(slotLabel)

      const slotBg = this.add.rectangle(slotX + barW / 2, y + barH / 2, barW, barH, 0x1a1a33)
        .setScrollFactor(0).setDepth(16).setStrokeStyle(1, 0x223344)
      D.push(slotBg)
      this.blockSlotBars.push(slotBg)

      const slotText = this.add.text(slotX + barW / 2, y + barH / 2, '...', {
        fontSize: '9px', color: '#334455', fontStyle: 'italic',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(16)
      D.push(slotText)
      this.blockSlotTexts.push(slotText)
    }

    // Palette column (shuffled blocks, draggable)
    const shuffled = shuffle(this.SCRIPT_BLOCKS.map((b, i) => ({ ...b, origIdx: i })))
    this.blockPaletteBars = []
    this.blockPaletteTexts = []

    for (let p = 0; p < shuffled.length; p++) {
      const y = startY + p * (barH + gap)
      const block = shuffled[p]

      const bar = this.add.rectangle(paletteX + barW / 2, y + barH / 2, barW, barH, block.color)
        .setScrollFactor(0).setDepth(16).setStrokeStyle(1, 0x333344)
        .setInteractive({ useHandCursor: true })
      D.push(bar)
      this.blockPaletteBars.push(bar)

      const codeText = this.add.text(paletteX + 8, y + barH / 2, block.code, {
        fontSize: '9px', color: '#dddddd', fontFamily: 'monospace',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(16)
      D.push(codeText)
      this.blockPaletteTexts.push(codeText)

      // Store original index on bar for drag tracking
      bar.setData('origIdx', block.origIdx)
      bar.setData('paletteIdx', p)

      bar.on('pointerdown', () => {
        if (!this.blockActive) return
        // Check if already placed
        if (this.blockOrder.includes(block.origIdx)) return
        this.blockDragging = true
        this.blockDragFrom = block.origIdx
        bar.setStrokeStyle(2, 0xffff00)
      })
    }

    // Global drag handlers for block game
    this.input.on('pointermove', this.onBlockDragMove, this)
    this.input.on('pointerup', this.onBlockDragEnd, this)
  }

  private onBlockDragMove(pointer: Phaser.Input.Pointer) {
    if (!this.blockDragging || this.blockDragFrom < 0) return

    const g = this.blockDragLine
    g.clear()

    // Find palette bar for this block
    const pIdx = this.blockPaletteBars.findIndex(b => b.getData('origIdx') === this.blockDragFrom)
    if (pIdx < 0) return
    const srcBar = this.blockPaletteBars[pIdx]

    g.lineStyle(2, 0xffcc00, 0.8)
    g.lineBetween(srcBar.x + srcBar.width / 2, srcBar.y, pointer.x, pointer.y)

    // Hover highlight on slots
    for (let s = 0; s < this.blockSlotBars.length; s++) {
      const slot = this.blockSlotBars[s]
      const inBounds = slot.getBounds().contains(pointer.x, pointer.y)
      slot.setStrokeStyle(inBounds ? 2 : 1, inBounds ? 0x8888ff : 0x223344)
    }
  }

  private onBlockDragEnd(pointer: Phaser.Input.Pointer) {
    if (!this.blockDragging || this.blockDragFrom < 0) {
      this.blockDragging = false
      this.blockDragFrom = -1
      return
    }

    this.blockDragLine.clear()
    const blockIdx = this.blockDragFrom
    this.blockDragging = false
    this.blockDragFrom = -1

    // Reset palette bar highlight
    const pIdx = this.blockPaletteBars.findIndex(b => b.getData('origIdx') === blockIdx)
    if (pIdx >= 0) this.blockPaletteBars[pIdx].setStrokeStyle(1, 0x333344)

    // Find which slot was hit
    let hitSlot = -1
    for (let s = 0; s < this.blockSlotBars.length; s++) {
      if (this.blockSlotBars[s].getBounds().contains(pointer.x, pointer.y)) {
        hitSlot = s; break
      }
    }

    // Reset all slot highlights
    for (const slot of this.blockSlotBars) slot.setStrokeStyle(1, 0x223344)

    if (hitSlot < 0) return

    // If slot already occupied, swap out the old one
    if (this.blockOrder[hitSlot] >= 0) {
      const oldIdx = this.blockOrder[hitSlot]
      this.blockOrder[hitSlot] = -1
      // Restore old palette bar
      const oldPIdx = this.blockPaletteBars.findIndex(b => b.getData('origIdx') === oldIdx)
      if (oldPIdx >= 0) {
        this.blockPaletteBars[oldPIdx].setStrokeStyle(1, 0x333344)
        this.blockPaletteBars[oldPIdx].setAlpha(1)
      }
    }

    // Remove this block from any other slot it was in
    for (let s = 0; s < this.blockOrder.length; s++) {
      if (this.blockOrder[s] === blockIdx) {
        this.blockOrder[s] = -1
        this.blockSlotTexts[s].setText('...').setStyle({ color: '#334455', fontStyle: 'italic' })
        this.blockSlotBars[s].setFillStyle(0x1a1a33)
      }
    }

    // Place block
    this.blockOrder[hitSlot] = blockIdx
    const block = this.SCRIPT_BLOCKS[blockIdx]
    this.blockSlotTexts[hitSlot].setText(block.code).setStyle({ color: '#dddddd', fontStyle: 'normal' })
    this.blockSlotBars[hitSlot].setFillStyle(block.color)

    // Dim palette bar
    if (pIdx >= 0) this.blockPaletteBars[pIdx].setAlpha(0.3)

    // Check if all slots filled
    if (this.blockOrder.every(o => o >= 0)) {
      this.evaluateBlocks()
    }
  }

  private evaluateBlocks() {
    this.blockActive = false
    const correct = this.blockOrder.every((b, i) => b === this.CORRECT_ORDER[i])

    if (correct) {
      this.blockSlotBars.forEach(s => s.setStrokeStyle(2, 0x00ff88))
      this.blockSlotTexts.forEach(t => t.setStyle({ color: '#00ff88' }))

      this.blockObj.done = true
      this.taskTexts[0].setText('[✓] Terminal - Script OK!').setStyle({ color: '#00ff88' })

      // Success overlay
      const cx = 400, cy = 300, D = this.dialogElements
      D.push(this.add.rectangle(cx, cy, 400, 100, 0x0a2a0a, 0.95)
        .setScrollFactor(0).setDepth(19).setStrokeStyle(2, 0x00ff88))
      D.push(this.add.text(cx, cy - 15, '✓ Script berjalan!', {
        fontSize: '18px', color: '#00ff88', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20))
      D.push(this.add.text(cx, cy + 15, 'Server Health Checker: 4 up, 2 down', {
        fontSize: '12px', color: '#88ccaa',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20))

      this.dialogTimer = this.time.delayedCall(2500, () => {
        this.closeDialog()
        if (!this.winShown) { this.winShown = true; this.winText.setVisible(true) }
      })
    } else {
      // Mark wrong slots red
      for (let i = 0; i < 12; i++) {
        if (this.blockOrder[i] !== this.CORRECT_ORDER[i]) {
          this.blockSlotBars[i].setStrokeStyle(2, 0xff2222)
        } else {
          this.blockSlotBars[i].setStrokeStyle(2, 0x00ff88)
        }
      }

      const cx = 400, cy = 300, D = this.dialogElements
      D.push(this.add.rectangle(cx, cy, 500, 120, 0x2a0a0a, 0.95)
        .setScrollFactor(0).setDepth(19).setStrokeStyle(2, 0xff4444))
      D.push(this.add.text(cx, cy - 30, '✗ Script error!', {
        fontSize: '18px', color: '#ff4444', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20))
      D.push(this.add.text(cx, cy, 'Urutan blok belum benar. Coba lagi!', {
        fontSize: '12px', color: '#ff8888',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20))

      const retryBtn = this.add.text(cx, cy + 35, '🔄  Ulangi', {
        fontSize: '14px', color: '#ffffff', backgroundColor: '#444466',
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20)
        .setInteractive({ useHandCursor: true })
      D.push(retryBtn)
      retryBtn.on('pointerover', () => retryBtn.setStyle({ backgroundColor: '#556688' }))
      retryBtn.on('pointerout',  () => retryBtn.setStyle({ backgroundColor: '#444466' }))
      retryBtn.on('pointerdown', () => {
        this.dialogElements.forEach(el => el.destroy())
        this.dialogElements.length = 0
        this.resetBlockState()
        this.input.off('pointermove', this.onBlockDragMove, this)
        this.input.off('pointerup', this.onBlockDragEnd, this)
        this.openBlockTask(this.blockObj)
      })
    }
  }

  // ─── DIALOG HELPERS ────────────────────────────────────────

  private closeDialog() {
    if (this.dialogTimer) { this.dialogTimer.destroy(); this.dialogTimer = undefined }
    if (this.wiringGraphics) { this.wiringGraphics.clear() }
    if (this.wiringDragLine) { this.wiringDragLine.clear() }
    this.input.off('pointermove', this.onWiringDragMove, this)
    this.input.off('pointerup', this.onWiringDragEnd, this)
    this.input.off('pointermove', this.onBlockDragMove, this)
    this.input.off('pointerup', this.onBlockDragEnd, this)
    this.dialogElements.forEach(el => el.destroy())
    this.dialogElements.length = 0
    this.dialogOpen = false
    this.resetWiringState()
    this.resetSplicingState()
    this.resetBlockState()
  }

  private addDialogText(D: Phaser.GameObjects.GameObject[], x: number, y: number, text: string, size: string, color: string, style?: string) {
    const t = this.add.text(x, y, text, {
      fontSize: size, color, fontStyle: style ?? 'normal', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(16)
    D.push(t)
    return t
  }

  private addCloseBtn(D: Phaser.GameObjects.GameObject[], x: number, y: number) {
    const btn = this.add.text(x, y, '[ Tutup ]', {
      fontSize: '13px', color: '#aaaaaa', backgroundColor: '#222233',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(16)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setStyle({ color: '#ffffff' }))
      .on('pointerout',  () => btn.setStyle({ color: '#aaaaaa' }))
      .on('pointerdown', () => this.closeDialog())
    D.push(btn)
  }
}
