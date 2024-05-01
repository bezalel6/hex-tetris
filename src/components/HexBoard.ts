import Shape, {Intersection} from '@/hex-data/shape'
import {HexTetris} from '@/game/scenes/HexTetris'
import {Angle, Hex, HexStyle, RenderableHex, renderHex} from '@/hex-data/hex'
import Color = Phaser.Display.Color

const boardSize = {
    w: 9, h: 9
}
export type BoardHex = Hex & { isPopulated: boolean }

const hoveredStyle: HexStyle = {
    border: {
        color: Color.RandomRGB().color
    },
    fill: Color.RandomRGB().color
}

export default class HexBoard {
    scene: HexTetris
    shape: Shape
    hexMap: Map<string, BoardHex>
    resetHex: RenderableHex[] = []

    constructor(scene: HexTetris) {
        this.scene = scene
        this.hexMap = new Map()

        let shiftCols = 0
        this.initializeHexes(shiftCols, true) // Initialize top half
        this.initializeHexes(shiftCols, false) // Initialize bottom half

        const {size, ySpacingT, xSpacingT, spacing} = scene.getSettings()
        const boardWidth = boardSize.w * (size * xSpacingT + spacing)
        const boardHeight = boardSize.h * (size * ySpacingT + spacing)
        const {width, height} = scene.sys.game.canvas
        const center = {x: width / 2 - boardWidth / 2, y: height / 2}

        this.shape = new Shape(scene, {hexes: Array.from(this.hexMap.values())}, false, center)
    }

    static key(hex: Hex) {
        return (`${hex.row},${hex.col}`)

    }

    initializeHexes(shiftCols: number, topHalf: boolean) {
        const halfHeight = boardSize.h / 2
        shiftCols = topHalf ? 0 : 0.5
        const rowStart = topHalf ? 0 : 1
        const rowEnd = halfHeight
        const rowMultiplier = topHalf ? 1 : -1

        for (let r = rowStart; r < rowEnd; r++) {
            const angle: Angle = r % 2 === 0 ? 'flat' : 'rotated'
            for (let c = 0; c < boardSize.w - r; c++) {
                const hex: BoardHex = {row: r * rowMultiplier, col: c + shiftCols, angle, isPopulated: false}
                this.hexMap.set(`${hex.row},${hex.col}`, hex)
            }
            shiftCols += 0.5
        }
    }

    /**
     * will highlight the hexes under the piece if they are empty and can fit it
     * @param shape the intersecting shape
     * @param intersections hexFromShape2 is the one from the board
     * @returns true if the shape can fully fit within the intersected hexes, false otherwise
     */
    shapeIntersectingHover(shape: Shape, intersections: Intersection[]): boolean {
        this.resetHex.forEach(reset => {
            renderHex(reset)
        })
        this.resetHex = []

        if (shape.group.getChildren().length !== intersections.length) return false
        if (intersections.find(t => t.boardShapeHex.isPopulated)) return false

        intersections.forEach(t => {
            const hex = this.shape.findHexChild(t.boardShapeHex)
            renderHex(hex, hoveredStyle)
            this.resetHex.push(hex)
        })

        return true
    }

    /**
     * called when the user dragged a piece over the board and mouseup
     * @param shape
     * @param intersections
     */
    tryFittingShape(shape: Shape, intersections: Intersection[]): boolean {
        if (shape.group.getChildren().length !== intersections.length) return false

    }

    getHex(row: number, col: number): Hex | undefined {
        return this.hexMap.get(`${row},${col}`)
    }

    setHex(row: number, col: number, hex: BoardHex): void {
        this.hexMap.set(`${row},${col}`, hex)
    }
}
