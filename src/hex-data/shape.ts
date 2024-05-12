import {Hex} from '@/hex-data/hex'
import {defaultSettings, HexSettings} from '@/hex-data/settings'
import {BoardHex} from '@/components/HexBoard'
import Color = Phaser.Display.Color

export type ShapeSettings = {}
export type ShapeData = { hexes: Array<Hex>, settings?: Partial<HexSettings> }
type GlobalShapeHexSettings = Partial<Omit<Hex, 'col' | 'row'> & { x: number, y: number }>
export type Intersection = { intersectingShapeHex: Hex, boardShapeHex: BoardHex, area: number }
const PrimitiveShapes: { [K: string]: ShapeData } = {
    Shape1: {
        hexes: [
            {col: 0, row: 0},
            {col: 1, row: 0},
            {col: 1.5, row: 1},
            {col: 2, row: 0}
        ],
    },
    Shape2: {
        hexes: [
            {col: 0, row: 0},
            {col: 1, row: 0},
            {col: .5, row: 1},
            {col: 1.5, row: 1},
        ],
    }, Shape3: {
        hexes: [
            {col: 0.5, row: -1},
            {col: 1, row: 0},
            {col: .5, row: 1},
            {col: 1.5, row: 1},
        ],
    }, Shape4: {
        hexes: [
            {col: 0, row: 0, angle: 'flat'},
            {col: .5, row: 1, angle: 'flat'},
            {col: 1, row: 2, angle: 'flat'},
            {col: 1.5, row: 3, angle: 'flat'},
        ],
    }, Shape5: {
        hexes: [
            {col: 0, row: 0},
            {col: 1, row: 0},
            {col: 2, row: 0},
            {col: 3, row: 0},
        ],
    }, Single: {
        hexes: [
            {col: 0, row: 0}
        ]
    },
    Shape6: {
        hexes: [
            {col: 0, row: 0},
            {col: -.5, row: -1},
            {col: .5, row: -1},
            {col: 0, row: -2}
        ]
    }
}
setRndFillClrs(PrimitiveShapes)

export const Shapes: ShapeData[] = Object.values(flipShapes(PrimitiveShapes))

function setRndFillClrs(shapes) {
    Object.values(shapes).forEach(rndClr)
}

function rndClr(shape: ShapeData) {
    const clr = Color.RandomRGB()
    shape.hexes.forEach(hex => {
        hex.style = {fill: clr.color}
    })
}

function flipShapes(shapes) {
    const uniqueShapes = new Set()

    const normalizeHexes = (hexes) => {
        // Find the top-left hex as the new reference point
        const minX = Math.min(...hexes.map(hex => hex.col))
        const minY = Math.min(...hexes.map(hex => hex.row))
        return hexes.map(hex => ({
            ...hex,
            col: hex.col - minX,
            row: hex.row - minY
        })).sort((a, b) => (a.col === b.col ? a.row - b.row : a.col - b.col)) // Sorting by col, then by row
    }

    const serializeHexes = (hexes) => {
        const normalizedHexes = normalizeHexes(hexes)
        return normalizedHexes.map(hex => `${hex.col},${hex.row}`).join('|')
    }

    const generateFlips = (key, hexes, depth = 0) => {
        if (depth > 2) return // Prevent endless recursion from flip of a flip being the same as original

        const serializedHexes = serializeHexes(hexes)
        if (uniqueShapes.has(serializedHexes)) return
        uniqueShapes.add(serializedHexes)

        flippedShapes[key] = {hexes: hexes.map(hex => ({...hex}))}

        // Generate horizontal flip
        const hexesFlipH = hexes.map(hex => ({...hex, col: -hex.col}))
        generateFlips(key + '_FlipH', hexesFlipH, depth + 1)

        // Generate vertical flip
        const hexesFlipV = hexes.map(hex => ({...hex, row: -hex.row}))
        generateFlips(key + '_FlipV', hexesFlipV, depth + 1)
    }

    const flippedShapes = {}
    Object.keys(shapes).forEach(key => {
        generateFlips(key, shapes[key].hexes)
    })
    return flippedShapes
}

export default class Shape {
    scene: Phaser.Scene
    graphics: Phaser.GameObjects.Graphics
    data: ShapeData
    hexesSettings?: GlobalShapeHexSettings
    originalPositions: { x: number, y: number }[]
    onDestroy?: () => void

    constructor(scene: Phaser.Scene, data: ShapeData, enableDrag = true, globalShapeSettings?: GlobalShapeHexSettings) {
        this.scene = scene
        this.data = data
        this.hexesSettings = globalShapeSettings
        this.graphics = this.scene.add.graphics({x: globalShapeSettings?.x || 0, y: globalShapeSettings?.y || 0})
        this.originalPositions = []

        this.drawShape()
        if (enableDrag) {
            this.setupDrag()
        }
    }

    calculateHexPoints(size: number, spacing: number): Phaser.Geom.Point[] {
        const points: Phaser.Geom.Point[] = []
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i - Math.PI / 6
            const x = Math.cos(angle) * (size + spacing / 2)
            const y = Math.sin(angle) * (size + spacing / 2)
            points.push(new Phaser.Geom.Point(x, y))
        }
        return points
    }

    drawShape() {
        const hexSettings = this.data.settings || defaultSettings()
        const {spacing, size, xSpacingT, ySpacingT} = hexSettings

        let genPoints = []

        this.data.hexes.forEach(hex => {
            const x = hex.col * (size * xSpacingT + spacing)
            const y = hex.row * (size * ySpacingT + spacing)

            const points = this.calculateHexPoints(size, spacing)
            this.graphics.fillStyle(Color.RandomRGB().color)
            this.graphics.beginPath()
            this.graphics.moveTo(points[0].x + x, points[0].y + y)

            points.forEach(point => {
                this.graphics.lineTo(point.x + x, point.y + y)
                genPoints.push({x: point.x + x, y: point.y + y})
            })

            this.graphics.closePath()
            this.graphics.fillPath()

            this.originalPositions.push({x, y})
        })

        // Set the entire graphics object as interactive
        this.graphics.setInteractive(new Phaser.Geom.Polygon(genPoints), Phaser.Geom.Polygon.Contains)
    }

    setupDrag() {
        this.scene.input.setDraggable(this.graphics)

        this.graphics.on('drag', (pointer, dragX, dragY) => {
            this.graphics.x = dragX
            this.graphics.y = dragY
        })

        this.graphics.on('dragend', () => {
            // Add logic to handle shape drop
        })
    }

    destroy() {
        this.graphics.destroy()
        if (this.onDestroy) this.onDestroy()
    }
}