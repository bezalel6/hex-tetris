import {createHex, Hex, HexStyle, RenderableHex, renderHex} from '@/hex-data/hex'
import {HexTetris} from '@/game/scenes/HexTetris'
import {HexSettings} from '@/hex-data/settings'
import HexBoard, {BoardHex} from '@/components/HexBoard'
import Group = Phaser.GameObjects.Group
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
    scene: HexTetris
    data: ShapeData
    hexesSettings?: GlobalShapeHexSettings
    group: Omit<Group, 'getChildren'> & { getChildren: () => RenderableHex[] }
    originalPositions: { x: number, y: number }[]
    onDestroy?: () => void  // Optional onDestroy callback property

    constructor(scene: HexTetris, data: ShapeData, enableDrag = true, globalShapeSettings?: GlobalShapeHexSettings) {
        this.scene = scene
        this.hexesSettings = globalShapeSettings
        this.data = data
        this.group = this.scene.add.group() as any
        this.originalPositions = []
        const settings = {...scene.getSettings(), ...(data.settings || {})}
        const hexSettingsObj = this.hexesSettings || {}

        data.hexes.map(hex => {
                Object.keys(hexSettingsObj).forEach(key => {
                    if (hex[key] === undefined) {
                        hex[key] = settings[key]
                    }
                })
                return createHex({scene, settings, hex})
            }
        )
            .forEach((hex, index) => {
                this.group.add(hex)
                this.originalPositions.push({x: hex.x, y: hex.y})  // Store initial positions
            })


        if (globalShapeSettings && globalShapeSettings.x && globalShapeSettings.y) {
            this.group.incXY(globalShapeSettings.x, globalShapeSettings.y)
            this.originalPositions.forEach(pos => {
                pos.x += globalShapeSettings.x
                pos.y += globalShapeSettings.y

            })
        }
        if (enableDrag)
            this.dragSetup()
    }

    static checkIntersection(shape: Shape, board: HexBoard): Intersection[] {
        const intersections: Intersection[] = []

        const calculateRadius = (points: Phaser.Geom.Point[]) => {
            // Assuming the first point is sufficient due to the symmetry of the hex
            return Math.sqrt(points[0].x * points[0].x + points[0].y * points[0].y) / 2
        }

        const distance = (x1: number, y1: number, x2: number, y2: number) => {
            return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        }

        shape.group.getChildren().forEach(child1 => {
            const center1 = {x: child1.x, y: child1.y}
            const radius1 = calculateRadius(child1.points)

            board.shape.group.getChildren().forEach(child2 => {
                const center2 = {x: child2.x, y: child2.y}
                const radius2 = calculateRadius(child2.points)

                if (distance(center1.x, center1.y, center2.x, center2.y) < radius1 + radius2) {
                    intersections.push({
                        intersectingShapeHex: child1.data.values as Hex,
                        boardShapeHex: child2.data.values as BoardHex,
                        area: Math.PI * Math.pow((radius1 + radius2) / 2, 2) // Approximate overlap area as circle area
                    })
                }
            })
        })

        return intersections
    }

    restoreStyle() {
        this.group.getChildren().forEach(
            child => {
                this.updateHexVisual(child, child.originalStyle)
            }
        )
    }

    updateHexVisual(hex: Hex | RenderableHex, newStyle: HexStyle): void {
        const hexagon = 'points' in hex ? hex : this.findHexChild(hex)
        if (hexagon) {
            renderHex(hexagon, newStyle)
        }
    }

    findHexChild(searchFor: Hex) {
        return this.group.getChildren().find((hex) => hex.data.values === searchFor)
    }

    dragSetup() {
        let dragStartX = 0
        let dragStartY = 0

        const pointerMoveCallback = (pointer) => {
            if (pointer.isDown) {
                const dx = pointer.x - dragStartX
                const dy = pointer.y - dragStartY
                dragStartX = pointer.x
                dragStartY = pointer.y
                this.group.getChildren().forEach((child) => {
                    child.x += dx
                    child.y += dy
                })
                const intersection = Shape.checkIntersection(this, this.scene.board)
                this.scene.board.shapeIntersectingHover(this, intersection)
            } else {

                this.scene.input.removeListener('pointermove', pointerMoveCallback)
            }
        }


        this.group.getChildren().forEach((hex, index) => {
            hex.on('pointerdown', (pointer) => {
                dragStartX = pointer.x
                dragStartY = pointer.y
                this.scene.input.on('pointermove', pointerMoveCallback)
            })
            hex.on('pointerup', e => {
                this.scene.input.removeListener('pointermove', pointerMoveCallback)
                if (this.group.getChildren().length > 4) {
                    console.log('board itself')
                } else {
                    const intersection = Shape.checkIntersection(this, this.scene.board)
                    if (this.scene.board.tryFittingShape(this, intersection)) {
                        this.destroy()
                        return
                    }
                }
                console.log('pointer up')
                this.group.getChildren().forEach((child, index) => {
                    this.scene.tweens.add({
                        targets: child,
                        x: this.originalPositions[index].x,
                        y: this.originalPositions[index].y,
                        ease: 'Power1',
                        duration: 200
                    })
                })
            })
        })
    }

    destroy() {
        this.group.destroy(true, true)
        if (this.onDestroy) {this.onDestroy()}
    }
}