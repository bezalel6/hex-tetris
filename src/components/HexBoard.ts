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

export default class HexBoard {
    scene: HexTetris
    shape: Shape
    hexGrid: BoardHex[][]
    resetHex: RenderableHex[] = []
    lastHash = ''
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

        this.shape = new Shape(scene, {hexes: this.hexGrid.flat()}, false, center)
        this.syncBoardIndicies(true)

        this.checkCompleteLines()
        this.getCurrentHash(true)
        console.log(this.hexGrid)
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
                if (this.shape || shouldShapeBeDefined)
                    this.find(hex).data.set(hex)
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
        return this.shape.group.getChildren().find(h => {
            const {row, col} = (h.data.values as BoardHex).actualBoardCoords
            return hex.actualBoardCoords.row == row && hex.actualBoardCoords.col == col
        })
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
        this.hexGrid.forEach((row, i) => {
            row.forEach(r => {
                this.highlight(r, this.rainbowColors[i])
            })
        })

        // for (let i = 0; i < this.hexGrid.length; i++) {
        //     for (let j = 0; j <; j++) {
        //         for (let k = 0; k <; k++) {
        //            
        //         }
        //     }
        // }

        // return
        const completedLines: BoardHex[][] = []

        // Check rows
        this.hexGrid.forEach(row => {
            if (row.every(hex => hex && hex.isPopulated)) {
                completedLines.push(row)
            }
        })

        // Check "\" diagonals: from each cell in the first row and first cell of each row
        for (let startCol = 0; startCol < boardSize.w; startCol++) {
            this.checkDiagonalFromPoint(0, startCol, 1, 1, completedLines)
        }
        for (let startRow = 1; startRow < Math.ceil(boardSize.h / 2); startRow++) {
            this.checkDiagonalFromPoint(startRow, 0, 1, 1, completedLines)
        }
        // for (let startRow = 0; startRow < boardSize.h; startRow++) {
        //     this.checkDiagonalFromPoint(startRow, 0, 1, 1, completedLines)
        // }
        //
        // // Check "\" diagonals: from each cell in the first row and last cell of each row
        // for (let startCol = 0; startCol < boardSize.w; startCol++) {
        //     this.checkDiagonalFromPoint(0, startCol, 1, -1, completedLines)
        // }
        // for (let startRow = 0; startRow < boardSize.h; startRow++) {
        //     this.checkDiagonalFromPoint(startRow, boardSize.w - 1, 1, -1, completedLines)
        // }

        // Complete all filled lines
        this.completed(completedLines.flat())
        this.lastHash = currentHash
    }

// Helper method to check diagonal from a starting point
    checkDiagonalFromPoint(startRow: number, startCol: number, rowIncrement: number, colIncrement: number, completedLines: BoardHex[][]) {
        let diagonal = []
        let row = startRow
        let col = startCol
        const c = Color.RandomRGB().color
        while (row < boardSize.h && col >= 0 && col < boardSize.w) {
            const hex = this.hexGrid[row][col]
            if (hex) {
                this.highlight(hex, c)
            } else {
                // debugger
                console.log('breaking', {row, col})
                break
            }
            console.log({row, col})
            if (!hex || !hex.isPopulated) {
                if (diagonal.length > 0) break // Stop if we find a gap after starting the diagonal
            } else {
                diagonal.push(hex)
            }
            if (rowIncrement > 0 && row === 4) {
                colIncrement = 0
            }
            row += rowIncrement
            col += colIncrement
        }
        this.calculateDiagonalLength(startRow, startCol, rowIncrement, colIncrement)
        if (diagonal.length > 0 && diagonal.length == this.calculateDiagonalLength(startRow, startCol, rowIncrement, colIncrement)) {
            completedLines.push(diagonal)
        }
    }

// Helper method to calculate the length of a diagonal
    calculateDiagonalLength(startRow, startCol, rowIncrement, colIncrement) {
        let length = 0
        let row = startRow
        let col = startCol
        while (row < boardSize.h && col >= 0 && col < boardSize.w) {
            length++
            row += rowIncrement
            col += colIncrement
        }
        console.log({length})
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
        this.resetHex.length = 0

        if (shape.group.getChildren().length !== intersections.length) return false

        if (intersections.find(t => t.boardShapeHex.isPopulated)) return false

        intersections.forEach(t => {
            const hex = this.shape.findHexChild(t.boardShapeHex)
            t.boardShapeHex.isPopulated = true
            this.set({...t.boardShapeHex})
            renderHex(hex, t.intersectingShapeHex.style)
        })
        this.checkCompleteLines()
        return true
    }
}