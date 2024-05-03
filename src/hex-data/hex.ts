import {GraphicalComponent} from '@/utils/component'
import {HexTetris} from '@/game/scenes/HexTetris'
import Graphics = Phaser.GameObjects.Graphics
import Polygon = Phaser.Geom.Polygon

type ColorC = number
export type Point = { x: number, y: number };

const hexAngles = {
    flat: 0,
    rotated: 30
}
export type HexStyle = {
    border?: {
        width?: number;
        color?: ColorC
    }
    fill?: ColorC
}
export type Angle = keyof typeof hexAngles

export type Hex = {
    col: number,
    row: number,
    angle?: Angle
    style?: HexStyle
}
export type RenderableHex = Graphics & { points: Phaser.Geom.Point[]; originalStyle: HexStyle }

const defaultHex: Hex = {
    col: 0,
    row: 0,
    angle: 'flat',
    style: {
        border: {
            width: 3,
            color: 0xffffff
        },
        fill: 0x0000ff
    }
}

function parseHexProps(hexProps: { hex: Partial<Hex> }): Hex {
    return {
        ...defaultHex,
        ...hexProps.hex,
        style: {
            ...defaultHex.style,
            ...hexProps.hex.style || {},
            border: {
                ...defaultHex.style.border,
                ...(hexProps?.hex.style?.border || {})
            }
        }
    }
}

const areSettingsEqual = (a, b) => {
    return a.size === b.size && a.spacing === b.spacing
}
let cachedSettings: { size: number, spacing: number } = null
let cachedPoints: { settings: typeof cachedSettings, points: Phaser.Geom.Point[] } = null
export const hexPoints = (settings = cachedSettings) => {
    if (!settings)
        throw new Error('settings were not initialized')
    const {size, spacing} = settings
    if (cachedPoints && cachedSettings && areSettingsEqual(cachedSettings, cachedPoints.settings)) {
        return cachedPoints.points
    }
    const points: Phaser.Geom.Point[] = []
    for (let i = 0; i < 6; i++) {
        let angle = Math.PI / 3 * i - Math.PI / 6
        let pointX = Math.cos(angle) * (size + spacing / 2)
        let pointY = Math.sin(angle) * (size + spacing / 2)
        points.push(new Phaser.Geom.Point(pointX, pointY))
    }
    cachedSettings = settings
    cachedPoints = {settings: {...settings}, points: [...points]}
    return points
}
export const renderHex = (hexagon: RenderableHex, _style: HexStyle = null) => {

    const style = _style ? {...hexagon.originalStyle, ..._style} : hexagon.originalStyle
    hexagon.lineStyle(style.border.width, style.border.color)
    hexagon.fillStyle(style.fill)

    const polygon = {points: hexagon.points}
    // const polygon = new Phaser.Geom.Polygon(hexagon.points)
    hexagon.fillPoints(polygon.points, true)
    hexagon.strokePoints(polygon.points, true, true)
    return hexagon.points
}
export const createHex: GraphicalComponent<HexTetris, { hex: Partial<Hex> }, RenderableHex> = (_props) => {
    const props = parseHexProps(_props)

    const {col, row, style} = props
    const {settings, scene} = _props
    const {size, xSpacingT, ySpacingT, spacing} = settings

    const x = col * (size * xSpacingT + spacing)
    const y = row * (size * ySpacingT + spacing)

    // @ts-ignore
    const hexagon: RenderableHex = scene.add.graphics({x, y})
    hexagon.originalStyle = style
    // hexagon.lineStyle(style.border.width, style.border.color)
    // hexagon.fillStyle(style.fill)


    scene.input.on('wheel', (pointer, over, deltaX, deltaY, deltaZ) => {
        if (hexagon.angle) hexagon.angle = 0
        else hexagon.angle = 30
        console.log('angle', hexagon.angle)
    })
    // const polygon = new Phaser.Geom.Polygon(points)
    // hexagon.fillPoints(polygon.points, true)
    // hexagon.strokePoints(polygon.points, true, true)
    hexagon['points'] = hexPoints(settings)
    const polygon = new Polygon(renderHex(hexagon))
    hexagon.setInteractive(polygon, Phaser.Geom.Polygon.Contains)
    hexagon.setData(props)
    return hexagon
}