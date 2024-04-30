import {Hex} from '@/hex-data/hex'

export type ShapeSettings = {}

export type Shape = Array<Hex> & { settings: ShapeSettings }

