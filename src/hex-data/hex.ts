import {GraphicalComponent} from '@/utils/component'
import {HexTetris} from '@/game/scenes/HexTetris'
import {GameObjects, Geom} from 'phaser'
import Point = Phaser.Geom.Point

export const createHex: GraphicalComponent<HexTetris, { pos: Point }> = (props) => {

    const hexagon = props.scene.add.graphics({
        x: props.pos.x,
        y: props.pos.y,
        lineStyle: {width: 2, color: 0xffffff},
        fillStyle: {color: 0x0000ff}
    })

    const points = []
    for (let i = 0; i < 6; i++) {
        let angle = Math.PI / 3 * i - Math.PI / 6
        let pointX = Math.cos(angle) * (props.settings.size + props.settings.spacing / 2) // Add half of the spacing to the size for the outline
        let pointY = Math.sin(angle) * (props.settings.size + props.settings.spacing / 2) // Add half of the spacing to the size for the outline
        points.push(new Geom.Point(pointX, pointY))
    }

    const polygon = new Geom.Polygon(points)
    hexagon.fillPoints(polygon.points, true)
    hexagon.strokePoints(polygon.points, true, true)

    // Make hexagon interactive
    hexagon.setInteractive(polygon, Geom.Polygon.Contains)

    // Variable to keep track of current hexagon being hovered
    let currentHexagon: GameObjects.Graphics | null = null

    // Pointer events
    hexagon.on('pointerover', () => {
        currentHexagon = hexagon
    })

    hexagon.on('pointerout', () => {
        currentHexagon = null
    })
// Make hexagon interactive and draggable
    props.scene.input.setDraggable(hexagon)

    // Update the position of the hexagon on drag
    hexagon.on('drag', (pointer, dragX, dragY) => {
        hexagon.x = dragX
        hexagon.y = dragY
    })
    // Mouse wheel event
    props.scene.input.on('wheel', (pointer, over, deltaX, deltaY, deltaZ) => {
        if (currentHexagon) {
            currentHexagon.angle += deltaY > 0 ? -5 : 5
        }
    })

}