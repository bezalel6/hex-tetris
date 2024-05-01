import {createHex, Hex} from '@/hex-data/hex'
import {HexTetris} from '@/game/scenes/HexTetris'
import {HexSettings} from '@/hex-data/settings'
import Group = Phaser.GameObjects.Group
import Graphics = Phaser.GameObjects.Graphics
import Color = Phaser.Display.Color

export type ShapeSettings = {}
const magic = Math.sqrt(3)
export type ShapeData = { hexes: Array<Hex>, settings?: Partial<HexSettings> }
type GlobalShapeHexSettings = Partial<Omit<Hex, 'col' | 'row'> & { x: number, y: number }>

// const magic = 1.5 // Adjust as needed, this is assumed to be a scaling or offset factor

// export const Shapes: { [K: string]: ShapeData } = {
//     Test: {
//         hexes: [
//             {col: 0, row: 0},
//             {col: 0, row: -2, style: {fill: 0xff00ff}},
//             {col: magic, row: -1, style: {fill: 0xffffff}},
//             {col: -magic, row: -1}
//         ],
//         settings: {
//             // xSpacingT: 0.28,
//             // ySpacingT: 1.47
//         }
//     },
//     Test1: {
//         hexes: [
//             {col: 0, row: 0},
//             {col: 1, row: 0, style: {fill: 0xff00ff}},
//             {col: 2, row: 0, style: {fill: 0xffffff}},
//             {col: 0.9 * magic, row: -1} // Applied magic as a multiplier here
//         ],
//         settings: {
//             // xSpacingT: 1.75,
//             // ySpacingT: 1.75 // Assuming uniform spacing in x and y if not otherwise stated
//         }
//     }
// }

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
    group: Omit<Group, 'getChildren'> & { getChildren: () => Graphics[] }

    constructor(scene: HexTetris, data: ShapeData, globalShapeSettings?: GlobalShapeHexSettings) {
        this.scene = scene
        this.hexesSettings = globalShapeSettings
        this.data = data
        this.group = this.scene.add.group() as any
        const settings = {...scene.getSettings(), ...(data.settings || {})}
        data.hexes.map(
            hex =>
                createHex({scene, settings, ...(this.hexesSettings || {}), ...hex})
        ).forEach(hex => {
            this.group.add(hex)
        })
        if (globalShapeSettings && globalShapeSettings.x && globalShapeSettings.y)
            this.group.incXY(globalShapeSettings.x, globalShapeSettings.y)
        this.dragSetup()
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
                this.group.incX(dx)
                this.group.incY(dy)
            }
        }

        this.group.getChildren().forEach(hex => {
            hex.on('pointerdown', (pointer) => {
                dragStartX = pointer.x
                dragStartY = pointer.y
                this.scene.input.on('pointermove', listener)
                this.group.getChildren().forEach(child => {
                })
            })

            // scene.input.on('pointermove', (pointer) => {
            //    
            // })

            this.scene.input.on('pointerup', () => {
                this.scene.input.removeListener('pointermove', listener)
                this.group.getChildren().forEach(child => {
                    // child.setAlpha(1)
                })
            })
        })
    }

}

