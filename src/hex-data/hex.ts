import {GraphicalComponent} from '@/utils/component'
import {HexTetris} from '@/game/scenes/HexTetris'
import {Geom} from 'phaser'
import Color = Phaser.Display.Color

export type Point = { x: number, y: number };


const hexAngles = {
    flat: 0,
    rotated: 30
}
type HexStyle = {
    border: {
        width: number;
        color: Color
    }
    fill: Color
}
export type Angle = keyof typeof hexAngles

export type Hex = Point & {
    angle: Angle
}

export const createHex: GraphicalComponent<HexTetris, { pos: Point, center: Point }> = (props) => {
    const {x, y} = {
        x: props.center.x + props.pos.x * (props.settings.size * props.settings.xSpacingT + props.settings.spacing),
        y: props.center.y + props.pos.y * (props.settings.size * props.settings.ySpacingT + props.settings.spacing)
    }

    const hexagon = props.scene.add.graphics({x, y})
    hexagon.lineStyle(2, 0xffffff)
    hexagon.fillStyle(0x0000ff)

    const points = []
    for (let i = 0; i < 6; i++) {
        let angle = Math.PI / 3 * i - Math.PI / 6
        let pointX = Math.cos(angle) * (props.settings.size + props.settings.spacing / 2)
        let pointY = Math.sin(angle) * (props.settings.size + props.settings.spacing / 2)
        points.push(new Geom.Point(pointX, pointY))
    }
    let hovered = true


    props.scene.input.on('wheel', (pointer, over, deltaX, deltaY, deltaZ) => {
        if (hovered) {
            if (hexagon.angle) hexagon.angle = 0
            else hexagon.angle = 30
            console.log('angle', hexagon.angle)
        }
    })
    const polygon = new Geom.Polygon(points)
    hexagon.fillPoints(polygon.points, true)
    hexagon.strokePoints(polygon.points, true, true)
    hexagon.setInteractive(polygon, Phaser.Geom.Polygon.Contains)


    return hexagon // Return the hexagon for group manipulation
}
