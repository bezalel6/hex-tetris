import Shape from '@/hex-data/shape'
import {HexTetris} from '@/game/scenes/HexTetris'
import {Hex} from '@/hex-data/hex'

const boardSize = {
    w: 11, h: 11
}

interface HexBoardProps {

}

// export default class HexBoard {
//    
// }

export const HexBoard = (scene: HexTetris): Shape => {
    const hexes: Hex[] = []
    let shiftCols = 0
    for (let r = 0; r < boardSize.h / 2; r++) {
        const angle = r % 2 === 0 ? 'flat' : 'rotated'
        for (let c = 0; c < boardSize.w - r; c++) {
            hexes.push({row: r, col: c + shiftCols, angle})
        }
        shiftCols += .5
        console.log({addCol: shiftCols})
    }
    const {width, height} = scene.sys.game.canvas
    const center = {x: width / 2, y: height / 2}
    return new Shape(scene, {hexes}, {...center})
}

function hasDecimal(num: number): boolean {
    return num.toString().includes('.')
}
