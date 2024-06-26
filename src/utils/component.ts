import {Scene} from 'phaser'
import {HexSettings} from '@/hex-data/settings'
import Graphics = Phaser.GameObjects.Graphics

export interface GraphicalComponentProps<ActualScene extends Scene> {
    scene: ActualScene,
    settings: HexSettings
}

export type GraphicalComponent<ActualScene extends Scene = Scene, AdditionalProps = {}, ReturnType = Graphics> = (props: GraphicalComponentProps<ActualScene> & AdditionalProps) => ReturnType