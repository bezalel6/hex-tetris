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

function parseHexProps<AdditionalProps = {}>(hexProps: Partial<Hex> & AdditionalProps): Hex & AdditionalProps {
    return {
        ...defaultHex,
        ...hexProps,
        style: {
            ...defaultHex.style,
            ...hexProps?.style,
            border: {
                ...defaultHex.style.border,
                ...(hexProps?.style?.border || {})
            }
        }
    }
}

export const renderHex = (hexagon: RenderableHex, _style: HexStyle = null) => {
    const style = _style ? _style : hexagon.originalStyle
    hexagon.lineStyle(style.border.width, style.border.color)
    hexagon.fillStyle(style.fill)
    const polygon = {points: hexagon.points}
    // const polygon = new Phaser.Geom.Polygon(hexagon.points)
    hexagon.fillPoints(polygon.points, true)
    hexagon.strokePoints(polygon.points, true, true)
    return hexagon.points
}
export const createHex: GraphicalComponent<HexTetris, Partial<Hex>, RenderableHex> = (_props) => {
    const props = parseHexProps(_props)
    const {col, row, settings, scene, style} = props
    const {size, xSpacingT, ySpacingT, spacing} = settings

    const x = col * (size * xSpacingT + spacing)
    const y = row * (size * ySpacingT + spacing)

    // @ts-ignore
    const hexagon: RenderableHex = scene.add.graphics({x, y})
    hexagon.originalStyle = style
    // hexagon.lineStyle(style.border.width, style.border.color)
    // hexagon.fillStyle(style.fill)

    const points: Phaser.Geom.Point[] = []
    for (let i = 0; i < 6; i++) {
        let angle = Math.PI / 3 * i - Math.PI / 6
        let pointX = Math.cos(angle) * (size + spacing / 2)
        let pointY = Math.sin(angle) * (size + spacing / 2)
        points.push(new Phaser.Geom.Point(pointX, pointY))
    }
    props.scene.input.on('wheel', (pointer, over, deltaX, deltaY, deltaZ) => {
        if (hexagon.angle) hexagon.angle = 0
        else hexagon.angle = 30
        console.log('angle', hexagon.angle)
    })
    // const polygon = new Phaser.Geom.Polygon(points)
    // hexagon.fillPoints(polygon.points, true)
    // hexagon.strokePoints(polygon.points, true, true)
    hexagon['points'] = points
    const polygon = new Polygon(renderHex(hexagon))
    hexagon.setInteractive(polygon, Phaser.Geom.Polygon.Contains)
    hexagon.setData(props)
    return hexagon
}