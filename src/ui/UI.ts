import Phaser from 'phaser'

// ponytail: Kenney UI pack paths hardcoded. Abstract to config if asset pack changes.
const BASE = 'assets/kenney_ui-pack/PNG'

export class UI {
  /** Load all Kenney UI assets. Call from scene.preload(). */
  static preload(scene: Phaser.Scene) {
    const ld = (key: string, path: string) => scene.load.image(key, path)
    // Buttons (depth gradient)
    ld('ui_btn_blue',   `${BASE}/Blue/Default/button_rectangle_depth_gradient.png`)
    ld('ui_btn_green',  `${BASE}/Green/Default/button_rectangle_depth_gradient.png`)
    ld('ui_btn_red',    `${BASE}/Red/Default/button_rectangle_depth_gradient.png`)
    ld('ui_btn_grey',   `${BASE}/Grey/Default/button_rectangle_depth_gradient.png`)
    ld('ui_btn_yellow', `${BASE}/Yellow/Default/button_rectangle_depth_gradient.png`)
    // Panels (depth flat — used as9-slice backgrounds)
    ld('ui_panel_grey',  `${BASE}/Grey/Default/button_rectangle_depth_flat.png`)
    ld('ui_panel_blue',  `${BASE}/Blue/Default/button_rectangle_depth_flat.png`)
    ld('ui_panel_green', `${BASE}/Green/Default/button_rectangle_depth_flat.png`)
    // Icons
    ld('ui_icon_check',  `${BASE}/Green/Default/icon_checkmark.png`)
    ld('ui_icon_cross',  `${BASE}/Red/Default/icon_cross.png`)
    // Checkboxes
    ld('ui_check_done',  `${BASE}/Green/Default/check_round_color.png`)
    ld('ui_check_empty', `${BASE}/Grey/Default/check_round_grey.png`)
    // Slider / progress bar
    ld('ui_slider_bg',   `${BASE}/Grey/Default/slide_horizontal_grey.png`)
    ld('ui_slider_fill', `${BASE}/Green/Default/slide_horizontal_color.png`)
    // Extra
    ld('ui_divider',     `${BASE}/Extra/Default/divider.png`)
    ld('ui_icon_play',   `${BASE}/Extra/Default/icon_play_light.png`)
    ld('ui_icon_repeat', `${BASE}/Extra/Default/icon_repeat_light.png`)
  }

  /**
   * 9-slice panel. Returns a NineSlice you can position freely.
   * @param textureKey defaults to 'ui_panel_grey'
   */
  static makePanel(
    scene: Phaser.Scene,
    x: number, y: number,
    w: number, h: number,
    textureKey = 'ui_panel_grey',
  ): Phaser.GameObjects.NineSlice {
    const panel = scene.add.nineslice(x, y, textureKey, undefined, w, h, 32, 32, 32, 32)
    return panel
  }

  /**
   * Button with9-slice background + centered text.
   * Returns a Container (depth managed by caller).
   */
  static makeBtn(
    scene: Phaser.Scene,
    x: number, y: number,
    w: number, h: number,
    label: string,
    textureKey = 'ui_btn_blue',
    opts?: { fontSize?: string; color?: string },
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y)

    const bg = scene.add.nineslice(0, 0, textureKey, undefined, w, h, 32, 32, 32, 32)
    container.add(bg)

    const txt = scene.add.text(0, 0, label, {
      fontSize: opts?.fontSize ?? '15px',
      color: opts?.color ?? '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    container.add(txt)

    bg.setInteractive({ useHandCursor: true })
    bg.on('pointerover', () => bg.setTint(0xdddddd))
    bg.on('pointerout',  () => bg.clearTint())
    // Forward pointerdown from bg to container so .on('pointerdown') on container works
    bg.on('pointerdown', (...args: unknown[]) => container.emit('pointerdown', ...args))

    return container
  }

  /** Checkbox image — returns the Image so caller can manage position/depth. */
  static makeCheckbox(
    scene: Phaser.Scene,
    x: number, y: number,
    checked: boolean,
  ): Phaser.GameObjects.Image {
    const key = checked ? 'ui_check_done' : 'ui_check_empty'
    return scene.add.image(x, y, key).setDisplaySize(16, 16)
  }

  /**
   * Progress bar (slider bg + fill).
   * Call `.setPct(0..1)` to update fill width.
   */
  static makeProgressBar(
    scene: Phaser.Scene,
    x: number, y: number,
    w: number,
  ): { bg: Phaser.GameObjects.Image; fill: Phaser.GameObjects.Image; setPct: (pct: number) => void; destroy: () => void } {
    const bg   = scene.add.image(x, y, 'ui_slider_bg').setDisplaySize(w, 20).setOrigin(0, 0.5)
    const fill = scene.add.image(x, y, 'ui_slider_fill').setDisplaySize(0, 20).setOrigin(0, 0.5)
    return {
      bg, fill,
      setPct: (pct: number) => fill.setDisplaySize(Math.max(0, w * Math.min(pct, 1)), 20),
      destroy: () => { bg.destroy(); fill.destroy() },
    }
  }
}
