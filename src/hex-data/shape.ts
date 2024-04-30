import {Scene} from 'phaser'
import {Hex} from '@/hex-data/hex'

export type ShapeSettings = {}

export type ShapeData = { hexes: Array<Hex>, settings: ShapeSettings }

class Shape {
    scene: Scene

    constructor(scene: Scene) {
        this.scene = scene
    }


}

