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
    }

    syncBoardIndicies() {
        this.hexGrid.forEach((row, rIndex) => {
            row.forEach((hex, cIndex) => {
                hex.actualBoardCoords = {row: rIndex, col: cIndex}
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
                        row: this.hexGrid.length,
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

    checkCompleteLines() {
        const completedRows = this.hexGrid.filter(row => !row.find(c => !c.isPopulated))


        const check = () => {
            let t: BoardHex[][] = []
            console.log(this.hexGrid)
            for (let c = 0; c < boardSize.w; c++) {
                const currentRow = []
                for (let r = 0; r < this.hexGrid.length; r++) {
                    if (!this.hexGrid[r][c]) continue
                    if (!this.hexGrid[r][c].isPopulated) break
                    currentRow.push(this.hexGrid[r][c])
                }
                t.push(currentRow)
            }

            console.log(t)
            return t.filter(row => row.length >= 5)
        }

        let t: BoardHex[] = []


        // for (let r = 0; r < this.hexGrid.length / 2; r++) {
        //     if (!this.hexGrid[r][0].isPopulated) break
        //     t.push(this.hexGrid[r][0])
        // }
        // if (t.length === 5) completedRows.push([...t])
        // t.length = 0
        // for (let r = Math.floor(this.hexGrid.length / 2); r < this.hexGrid.length; r++) {
        //     if (!this.hexGrid[r][0].isPopulated) break
        //     t.push(this.hexGrid[r][0])
        // }
        // if (t.length === 5) completedRows.push([...t])
        //
        // t.length = 0
        // for (let r = 0; r < this.hexGrid.length / 2; r++) {
        //     if (!this.hexGrid[r][this.hexGrid[r].length - 1].isPopulated) break
        //     t.push(this.hexGrid[r][this.hexGrid[r].length - 1])
        // }
        // if (t.length === 5) completedRows.push([...t])

        completedRows.push(...check())
        this.completed(completedRows.flat())
        // this.hexGrid.forEach((row, rIndex) => {
        //     row.forEach((hex, cIndex) => {
        //         hex.actualBoardCoords = {row: rIndex, col: cIndex}
        //     })
        // })
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