export interface HexSettings {
    spacing: number;
    size: number;
    xSpacingT: number;
    ySpacingT: number;
}

export function defaultSettings(): HexSettings {
    return {
        spacing: 0,
        size: 20,
        xSpacingT: .7,
        ySpacingT: 3 / 2
    }
}