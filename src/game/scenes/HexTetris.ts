import {Scene} from 'phaser'
import {EventBus} from '@/game/EventBus'
import {defaultSettings, HexSettings} from '@/hex-data/settings'
import {createHex} from '@/hex-data/hex'


export class HexTetris extends Scene {
    private settings: HexSettings = defaultSettings()

    constructor() {
        super('HexTetris')
    }

    getSettings() {return this.settings}

    setSettings(settings: HexSettings) {
        console.log('setting spacing', settings)
        this.settings = settings
        this.scene.restart()
    }

    create() {
        console.log('creating hex with settings', this.settings)
        createDraggableShape(this)
        EventBus.emit('current-scene-ready', this)

    }

    changeScene() {
        this.scene.start('Game')
    }

}

// Creating the entire shape as a draggable group
const createDraggableShape = (scene: HexTetris) => {
    const shapePattern = [
        {x: 0, y: 0},
        {x: Math.sqrt(3), y: 0},
        {x: 1, y: 1},
        {x: 2, y: 2},
    ]
    // const shapePattern = [
    //     {x: 0, y: 0},
    //     {x: 0, y: -2},
    //     {x: Math.sqrt(3), y: -1},
    //     {x: -Math.sqrt(3), y: -1},
    // ]

    const center = {x: 400, y: 300}
    const group = scene.add.group()

    shapePattern.forEach(pos => {
        const hex = createHex({scene: scene, pos: pos, center: center, settings: scene.getSettings()})

        group.add(hex)
    })

    // group.getChildren().forEach(c => {
    //     c.setInteractive({draggable: true,hitArea:})
    // })
    // Make the entire group draggable
    let dragStartX = 0
    let dragStartY = 0


    const listener = (pointer) => {
        if (pointer.isDown) {
            const dx = pointer.x - dragStartX
            const dy = pointer.y - dragStartY
            dragStartX = pointer.x
            dragStartY = pointer.y
            group.incX(dx)
            group.incY(dy)
        }
    }
    // const animateGroup = (expansionDistance: number, duration: number) => {
    //     let centerX = 0
    //     let centerY = 0
    //     const children = group.getChildren() as Graphics[]
    //     children.forEach(child => {
    //         centerX += child.x
    //         centerY += child.y
    //     })
    //     centerX /= children.length
    //     centerY /= children.length
    //
    //     // Animate each hexagon moving away from the center
    //     children.forEach(child => {
    //         // Calculate the angle to the center
    //         const angle = Math.atan2(child.y - centerY, child.x - centerX)
    //         // Determine the new target position
    //         const targetX = child.x + Math.cos(angle) * expansionDistance
    //         const targetY = child.y + Math.sin(angle) * expansionDistance
    //
    //         // Create the animation tween for moving away from the center
    //         child.scene.tweens.add({
    //             targets: child,
    //             x: targetX,
    //             y: targetY,
    //             ease: 'Sine.easeOut', // Smoother animation outwards
    //             duration: duration,
    //         })
    //     })
    // }

    group.getChildren().forEach(hex => {
        hex.on('pointerdown', (pointer) => {
            dragStartX = pointer.x
            dragStartY = pointer.y
            scene.input.on('pointermove', listener)
            group.getChildren().forEach(child => {
            })
        })

        // scene.input.on('pointermove', (pointer) => {
        //    
        // })

        scene.input.on('pointerup', () => {
            scene.input.removeListener('pointermove', listener)
            group.getChildren().forEach(child => {
                // child.setAlpha(1)
            })
        })
    })
}

