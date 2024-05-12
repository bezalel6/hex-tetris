import Shape, {Intersection} from '@/hex-data/shape'
import {HexTetris} from '@/game/scenes/HexTetris'
import {Angle, Hex, hexPoints, HexStyle, RenderableHex, renderHex} from '@/hex-data/hex'
import Color = Phaser.Display.Color

const boardSize = {
    w: 9, h: 9
}
export type BoardHex = Hex & { isPopulated: boolean; actualBoardCoords: { row: number, col: number } }

const hoveredStyle: HexStyle = {
    border: {
        color: Color.RandomRGB().color
    },
    fill: Color.RandomRGB().color
}
type OneOf<T, U> = (T & Partial<U>) | (U & Partial<T>);

type Increment = OneOf<{
    // before the half height point where the indicis direction change
    beforeHalf: number;
}, {
    //after the half, so, for example, in a board of height 9, afterHalf will be used for line indicies 5, 6, 7, 8
    afterHalf: number;
}>

export default class HexBoard {
    scene: HexTetris
    boardShape: Shape
    hexGrid: BoardHex[][]
    resetHex: RenderableHex[] = []
    lastHash = ''
    onGameTick: () => void
    // Define an array of hexadecimal color values for the rainbow colors in decimal form
    rainbowColors: number[] = [
        0xE6E6FA, // Lavender (Lighter Violet)
        0x9400D3, // Violet
        0x4B0082, // Indigo
        0x0000FF, // Blue
        0x00FF00, // Green
        0xFFFF00, // Yellow
        0xFF7F00, // Orange
        0xFF0000, // Red
        0x8B0000  // Dark Red
    ]

    constructor(scene: HexTetris) {
        this.scene = scene
        this.hexGrid = []

        hexPoints(scene.getSettings())

        this.initializeHexes(0, true) // Initialize top half
        this.initializeHexes(0, false) // Initialize bottom half
        this.hexGrid = this.hexGrid.slice(0, 5).reverse().concat(this.hexGrid.slice(5)).reverse()
        this.syncBoardIndicies()

        const {size, ySpacingT, xSpacingT, spacing} = scene.getSettings()
        const boardWidth = boardSize.w * (size * xSpacingT + spacing)
        const boardHeight = boardSize.h * (size * ySpacingT + spacing)
        const {width, height} = scene.sys.game.canvas
        const center = {x: width / 2 - boardWidth / 2, y: height / 2}

        this.boardShape = new Shape(scene, {hexes: this.hexGrid.flat()}, false, center)
        this.syncBoardIndicies(true)

        this.checkCompleteLines()
        this.getCurrentHash(true)
        console.log(this.hexGrid)
    }

    tick() {
        if (this.onGameTick) this.onGameTick()
    }

    getCurrentHash(shouldUpdateHash = true) {
        const hashParts = []
        this.hexGrid.forEach(row => {
            row.forEach(c => {
                hashParts.push(c.isPopulated ? '1' : '0')
            })
        })
        if (shouldUpdateHash) {
            return this.lastHash = hashParts.join('')

        }
        return hashParts.join('')
    }

    syncBoardIndicies(shouldShapeBeDefined = false) {
        this.hexGrid.forEach((row, rIndex) => {
            row.forEach((hex, cIndex) => {
                hex.actualBoardCoords = {row: rIndex, col: cIndex}
                if (this.boardShape || shouldShapeBeDefined)
                    this.find(hex)?.data.set(hex)
            })
        })
    }

    initializeHexes(shiftCols: number, topHalf: boolean) {
        const halfHeight = boardSize.h / 2
        shiftCols = topHalf ? 0 : 0.5
        const rowStart = topHalf ? 0 : 1
        const rowEnd = halfHeight
        const rowMultiplier = topHalf ? 1 : -1

        for (let r = rowStart; r < rowEnd; r++) {
            const row: BoardHex[] = []
            const angle: Angle = r % 2 === 0 ? 'flat' : 'rotated'
            for (let c = 0; c < boardSize.w - r; c++) {
                const hex: BoardHex = {
                    row: r * rowMultiplier,
                    col: c + shiftCols,
                    angle,
                    isPopulated: false,
                    actualBoardCoords: {
                        row: r,
                        col: c
                    }
                }
                row.push(hex)
            }
            this.hexGrid.push(row)
            shiftCols += 0.5
        }
    }

    find(hex: BoardHex): RenderableHex {
        // return this.boardShape.group.getChildren().find(h => {
        //     const {row, col} = (h.data.values as BoardHex).actualBoardCoords
        //     return hex.actualBoardCoords.row == row && hex.actualBoardCoords.col == col
        // })
        return null
    }

    completed(hexes: BoardHex[]) {
        hexes.forEach(hex => {
            hex.isPopulated = false
            const renderable = this.find(hex)
            renderable.data.set(hex)
            renderHex(renderable)
        })

    }

    highlight(hex: BoardHex, clr = Color.RandomRGB().color) {
        renderHex(this.find(hex), {fill: clr})
    }

    checkCompleteLines() {
        const currentHash = this.getCurrentHash(false)
        if (this.lastHash === currentHash) {
            console.log('hash match')
            return
        }

        const completedLines: BoardHex[][] = []

        // Check rows
        this.hexGrid.forEach(row => {
            if (row.every(hex => hex && hex.isPopulated)) {
                completedLines.push(row)
            }
        })

        // Check "\" diagonals
        for (let startCol = boardSize.w - 1; startCol >= 0; startCol--) {
            this.checkDiagonalFromPoint(0, startCol, 1, {beforeHalf: 1, afterHalf: 0}, completedLines)
        }
        for (let startRow = 1; startRow < Math.ceil(boardSize.h / 2); startRow++) {
            this.checkDiagonalFromPoint(startRow, 0, 1, {beforeHalf: 1, afterHalf: 0}, completedLines)
        }


        // Check "/" diagonals
        for (let startCol = this.hexGrid[0].length; startCol >= 0; startCol--) {
            this.checkDiagonalFromPoint(0, startCol, 1, {beforeHalf: 0, afterHalf: -1}, completedLines)
        }
        for (let startRow = 1; startRow < Math.ceil(boardSize.h / 2); startRow++) {
            this.checkDiagonalFromPoint(startRow, this.hexGrid[startRow].length - 1, 1, {
                beforeHalf: 0,
                afterHalf: -1
            }, completedLines)
        }

        // Complete all filled lines
        this.completed(completedLines.flat())
        this.lastHash = currentHash
        this.tick()
    }

// Helper method to check diagonal from a starting point
    checkDiagonalFromPoint(startRow: number, startCol: number, _rowIncrement: number | Increment, _colIncrement: Increment | number, completedLines: BoardHex[][]) {

        function parse(n: number | Increment): Required<Increment> {
            if (typeof n === 'number') return {afterHalf: n, beforeHalf: n}
            return {beforeHalf: n.beforeHalf ?? n.afterHalf, afterHalf: n.afterHalf ?? n.beforeHalf}
        }

        const rowIncrement = parse(_rowIncrement)
        const colIncrement = parse(_colIncrement)
        let diagonal = []
        let row = startRow
        let col = startCol
        while (row < boardSize.h && col >= 0 && col < boardSize.w && this.hexGrid[row]) {
            const hex = this.hexGrid[row][col]
            if (!hex) {
                break
            }
            if (!hex || !hex.isPopulated) {
                if (diagonal.length > 0) break // Stop if we find a gap after starting the diagonal
            } else {
                diagonal.push(hex)
            }
            row += row > 4 ? rowIncrement.afterHalf : rowIncrement.beforeHalf
            col += row > 4 ? colIncrement.afterHalf : colIncrement.beforeHalf
        }
        if (diagonal.length > 0 && diagonal.length == this.calculateDiagonalLength(startRow, startCol, rowIncrement, colIncrement)) {
            completedLines.push(diagonal)
        }
    }

    // Helper method to calculate the length of a diagonal
    calculateDiagonalLength(startRow: number, startCol: number, rowIncrement: Increment, colIncrement: Increment) {
        let length = 0
        let row = startRow
        let col = startCol
        while (row < boardSize.h && col >= 0 && col < this.hexGrid[row].length) {
            length++
            row += row > 4 ? rowIncrement.afterHalf : rowIncrement.beforeHalf
            col += row > 4 ? colIncrement.afterHalf : colIncrement.beforeHalf
        }
        return length
    }


    get(hex: BoardHex) {
        return this.hexGrid[hex.actualBoardCoords.row][hex.actualBoardCoords.col]
    }

    set(hex: BoardHex) {
        this.hexGrid[hex.actualBoardCoords.row][hex.actualBoardCoords.col] = hex
    }

    // Example method implementations would continue as previously written but using hexGrid
    // For instance:
    getHex(row: number, col: number): Hex | undefined {
        if (row >= 0 && row < boardSize.h && col >= 0 && col < boardSize.w) {
            return this.hexGrid[row][col]
        }
        return undefined
    }

    setHex(row: number, col: number, hex: BoardHex): void {
        if (row >= 0 && row < boardSize.h && col >= 0 && col < boardSize.w) {
            this.hexGrid[row][col] = hex
            console.log('set', {row, col, hex})
        } else {
            console.log('couldnt set', {row, col, hex})
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
        this.resetHex.length = 0

        // if (shape.group.getChildren().length !== intersections.length) return false
        // if (intersections.find(t => t.boardShapeHex.isPopulated)) return false
        //
        // intersections.forEach(t => {
        //     const hex = this.boardShape.findHexChild(t.boardShapeHex)
        //     renderHex(hex, hoveredStyle)
        //     this.resetHex.push(hex)
        // })

        return true
    }

    /**
     * called when the user dragged a piece over the board and mouseup
     * @param shape
     * @param intersections
     */
    tryFittingShape(shape: Shape, intersections: Intersection[]): boolean {
        this.resetHex.length = 0

        // if (shape.group.getChildren().length !== intersections.length) return false
        //
        // if (intersections.find(t => t.boardShapeHex.isPopulated)) return false
        //
        // intersections.forEach(t => {
        //     const hex = this.boardShape.findHexChild(t.boardShapeHex)
        //     t.boardShapeHex.isPopulated = true
        //     this.set({...t.boardShapeHex})
        //     renderHex(hex, t.intersectingShapeHex.style)
        // })
        this.checkCompleteLines()
        return true
    }

    checkGameOver(shapes: Shape[]): boolean {
        for (let x = 0; x < this.hexGrid.length; x++) {
            for (let y = 0; y < this.hexGrid[x].length; y++) {
                if (!this.hexGrid[x][y].isPopulated) {
                    for (const shape of shapes) {
                        if (this.canPlaceShape(shape, x, y)) {
                            return false // There is at least one place where a shape can fit
                        }
                    }
                }
            }
        }
        return true // No shapes can fit
    }

    canPlaceShape(shape: Shape, boardX: number, boardY: number): boolean {
        for (const hex of shape.data.hexes) {

        }
        return true
    }
}