import {Scene} from 'phaser'
import {EventBus} from '@/game/EventBus'
import {defaultSettings, HexSettings} from '@/hex-data/settings'
import HexBoard from '@/components/HexBoard'
import Shape, {Shapes} from '@/hex-data/shape'
import {getRandomElement} from '@/utils/utils'

const numShapes = 3

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

    getRndShape() {
        return getRandomElement(Shapes)
    }

    create() {
        const pos = {x: 100, y: 100}
        const {width, height} = this.sys.scene.game.canvas

        this.board = new HexBoard(this)

        const piecesX = width - 200

        new Shape(this, this.getRndShape(), true, {x: piecesX, y: 500})
        
        EventBus.emit('current-scene-ready', this)

    }
}