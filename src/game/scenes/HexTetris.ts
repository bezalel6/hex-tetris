import {Scene} from 'phaser'
import {EventBus} from '@/game/EventBus'
import {defaultSettings, HexSettings} from '@/hex-data/settings'
import HexBoard from '@/components/HexBoard'
import Shape, {Shapes} from '@/hex-data/shape'
import {getRandomElement} from '@/utils/utils'

const numShapes = 3

export class HexTetris extends Scene {
    board: HexBoard
    shapes = new Array<Shape>()
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

    createShape(x: number, y: number) {
        const shapeData = this.getRndShape()
        const newShape = new Shape(this, shapeData, true, {x: x, y: y})
        newShape.onDestroy = () => {
            console.log('Shape destroyed. Creating a new one.')
            this.shapes = this.shapes.filter(s => s !== newShape)
            this.createShape(x, y)
        }
        this.shapes.push(newShape)
        return newShape
    }

    create() {
        const {width, height} = this.sys.game.canvas
        const piecesX = width - 200


        // Create the board
        this.board = new HexBoard(this)
        this.board.onGameTick = () => {
            if (this.board.checkGameOver(this.shapes)) {
                alert('Game over')
            }
        }
        // Calculate vertical spacing for shapes
        const spacingY = height / (numShapes + 1)

        // Distribute shapes evenly on the vertical axis
        for (let i = 1; i <= numShapes; i++) {
            const posY = spacingY * i
            this.createShape(piecesX, posY)
        }

        // Emit scene ready event
        EventBus.emit('current-scene-ready', this)
    }
}
