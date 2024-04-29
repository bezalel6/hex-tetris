import {GameObjects, Geom, Scene} from 'phaser'
import {EventBus} from '@/game/EventBus'
import {defaultSettings, HexSettings} from '@/hex-data/settings'


export class HexTetris extends Scene {
    private settings: HexSettings = defaultSettings()

    constructor() {
        super('HexTetris')
    }

    getSettings() {return this.settings}

    setSettings(settings: HexSettings) {
        console.log('setting spacing', settings)
        this.settings = settings
        this.scene.restart()
    }

    create() {
        console.log('creating hex with settings', this.settings)
        // Define the size for the hexagons
        // Define the size for the hexagons and the spacing between them

        // Coordinates for creating the custom shape
        const shapePattern = [
            {x: 0, y: 0},
            {x: 0, y: -2},
            {x: Math.sqrt(3), y: -1},
            {x: -Math.sqrt(3), y: -1},
        ]

        const centerX = 400
        const centerY = 300

        shapePattern.forEach(pos => {
            this.createHexagon(
                centerX + pos.x * (this.settings.size * this.settings.xSpacingT + this.settings.spacing),
                centerY + pos.y * (this.settings.size * this.settings.ySpacingT + this.settings.spacing),
                this.settings.size,
                this.settings.spacing
            )
        })
        EventBus.emit('current-scene-ready', this)

    }

    createHexagon(x: number, y: number, size: number, spacing: number): GameObjects.Graphics {
        const hexagon = this.add.graphics({x, y, lineStyle: {width: 2, color: 0xffffff}, fillStyle: {color: 0x0000ff}})

        const points = []
        for (let i = 0; i < 6; i++) {
            let angle = Math.PI / 3 * i - Math.PI / 6
            let pointX = Math.cos(angle) * (size + spacing / 2) // Add half of the spacing to the size for the outline
            let pointY = Math.sin(angle) * (size + spacing / 2) // Add half of the spacing to the size for the outline
            points.push(new Geom.Point(pointX, pointY))
        }

        const polygon = new Geom.Polygon(points)
        hexagon.fillPoints(polygon.points, true)
        hexagon.strokePoints(polygon.points, true, true)

        // Make hexagon interactive
        hexagon.setInteractive(polygon, Geom.Polygon.Contains)

        // Variable to keep track of current hexagon being hovered
        let currentHexagon: GameObjects.Graphics | null = null

        // Pointer events
        hexagon.on('pointerover', () => {
            currentHexagon = hexagon
        })

        hexagon.on('pointerout', () => {
            currentHexagon = null
        })
// Make hexagon interactive and draggable
        this.input.setDraggable(hexagon)

        // Update the position of the hexagon on drag
        hexagon.on('drag', (pointer, dragX, dragY) => {
            hexagon.x = dragX
            hexagon.y = dragY
        })
        // Mouse wheel event
        this.input.on('wheel', (pointer, over, deltaX, deltaY, deltaZ) => {
            if (currentHexagon) {
                currentHexagon.angle += deltaY > 0 ? -5 : 5
            }
        })

        return hexagon
    }

    changeScene() {
        this.scene.start('Game')
    }
}
