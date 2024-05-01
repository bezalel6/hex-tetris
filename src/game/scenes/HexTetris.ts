import {Scene} from 'phaser'
import {EventBus} from '@/game/EventBus'
import {defaultSettings, HexSettings} from '@/hex-data/settings'
import HexBoard from '@/components/HexBoard'
import Shape, {Shapes} from '@/hex-data/shape'


export class HexTetris extends Scene {
    board: HexBoard
    private settings: HexSettings = defaultSettings()

    constructor() {
        super('HexTetris')
    }

    getSettings() {return this.settings}

    setSettings(settings: HexSettings) {
        this.settings = settings
        this.scene.restart()
    }

    create() {
        const pos = {x: 100, y: 100}
        const {width, height} = this.sys.scene.game.canvas

        this.board = new HexBoard(this)


        Shapes.forEach(shape => {
            new Shape(this, shape as any, pos)
            pos.x += 150
            if (pos.x >= width - 300) {
                pos.x = 100
                pos.y += 150
            }
        })
        EventBus.emit('current-scene-ready', this)

    }
}