export interface HexSettings {
    spacing: number;
    size: number;
    xSpacingT: number;
    ySpacingT: number;
    angle: number;
}

export function defaultSettings(): HexSettings {
    return {
        spacing: 0,
        size: 50,
        xSpacingT: 1.75,
        ySpacingT: 3 / 2,
        angle: 30
    }
}