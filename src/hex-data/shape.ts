import {createHex, Hex} from '@/hex-data/hex'
import {HexTetris} from '@/game/scenes/HexTetris'
import {HexSettings} from '@/hex-data/settings'
// @ts-ignore
import {Clipper, ClipType, PolyType} from 'js-clipper'
import Group = Phaser.GameObjects.Group
import Graphics = Phaser.GameObjects.Graphics
import Color = Phaser.Display.Color

export type ShapeSettings = {}
export type ShapeData = { hexes: Array<Hex>, settings?: Partial<HexSettings> }
type GlobalShapeHexSettings = Partial<Omit<Hex, 'col' | 'row'> & { x: number, y: number }>

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
    group: Omit<Group, 'getChildren'> & { getChildren: () => (Graphics & { points: Phaser.Geom.Point[] })[] }

    originalPositions: { x: number, y: number }[]

    constructor(scene: HexTetris, data: ShapeData, globalShapeSettings?: GlobalShapeHexSettings) {
        this.scene = scene
        this.hexesSettings = globalShapeSettings
        this.data = data
        this.group = this.scene.add.group() as any
        this.originalPositions = []
        const settings = {...scene.getSettings(), ...(data.settings || {})}
        data.hexes.map(hex => createHex({scene, settings, ...(this.hexesSettings || {}), ...hex}))
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
        this.dragSetup()
    }

    static checkIntersection(shape1: Shape, shape2: Shape): { hexFromShape1: Hex, hexFromShape2: Hex, area: number }[] {
        const intersections: { hexFromShape1: Hex, hexFromShape2: Hex, area: number }[] = []
        const maxIntersections = new Map<Hex, { hexFromShape2: Hex, area: number }>()

        shape1.group.getChildren().forEach(child1 => {
            shape2.group.getChildren().forEach(child2 => {
                const solution = new Clipper()
                const poly1 = child1.points.map(p => ({X: p.x + child1.x, Y: p.y + child1.y}))
                const poly2 = child2.points.map(p => ({X: p.x + child2.x, Y: p.y + child2.y}))
                solution.AddPath(poly1, PolyType.ptSubject, true)
                solution.AddPath(poly2, PolyType.ptClip, true)
                const solutionPolygons = []
                solution.Execute(ClipType.ctIntersection, solutionPolygons, PolyType.ptSubject, PolyType.ptClip)

                if (solutionPolygons.length > 0) {
                    const area = Math.abs(Clipper.Area(solutionPolygons[0]))
                    const existingMax = maxIntersections.get(child1.data.values as Hex)

                    if (!existingMax || existingMax.area < area) {
                        maxIntersections.set(child1.data.values as Hex, {
                            hexFromShape2: child2.data.values as Hex,
                            area: area
                        })
                    }
                }
            })
        })

        maxIntersections.forEach((value, hex1) => {
            intersections.push({
                hexFromShape1: hex1,
                hexFromShape2: value.hexFromShape2,
                area: value.area
            })
        })

        return intersections
    }


    findHexChild(searchFor: Hex) {
        return this.group.getChildren().find((hex) => hex.data.values === searchFor)
    }

    dragSetup() {
        let dragStartX = 0
        let dragStartY = 0

        const listener = (pointer) => {
            if (pointer.isDown) {
                const dx = pointer.x - dragStartX
                const dy = pointer.y - dragStartY
                dragStartX = pointer.x
                dragStartY = pointer.y
                this.group.getChildren().forEach((child, index) => {
                    child.x += dx
                    child.y += dy
                })
            } else {
                this.scene.input.removeListener('pointermove', listener)
            }
        }

        this.group.getChildren().forEach((hex, index) => {
            hex.on('pointerdown', (pointer) => {
                dragStartX = pointer.x
                dragStartY = pointer.y
                this.scene.input.on('pointermove', listener)
            })
            hex.on('pointerup', e => {
                this.scene.input.removeListener('pointermove', listener)
                if (this.group.getChildren().length > 4) {
                    console.log('board itself')
                } else {
                    const intersection = Shape.checkIntersection(this, this.scene.board.shape)
                    intersection.forEach(intersection => {
                        const myHex = this.findHexChild(intersection.hexFromShape1)
                        const boardHex = this.scene.board.shape.findHexChild(intersection.hexFromShape2)

                        function hexify(hex) {
                            hex.fillStyle(Color.RandomRGB().color)
                            hex.fill()
                        }

                        hexify(myHex)
                        hexify(boardHex)
                    })
                    console.log({intersection})
                    return
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
}

