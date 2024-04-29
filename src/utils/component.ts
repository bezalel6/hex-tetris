import {Scene} from 'phaser'
import {HexSettings} from '@/hex-data/settings'

export interface GraphicalComponentProps<ActualScene extends Scene> {
    scene: ActualScene,
    settings: HexSettings
}

export type GraphicalComponent<ActualScene extends Scene = Scene, AdditionalProps = {}> = (props: GraphicalComponentProps<ActualScene> & AdditionalProps) => void