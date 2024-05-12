import {useEffect, useRef, useState} from 'react'
import {IRefPhaserGame, PhaserGame} from '../game/PhaserGame'
import {HexTetris} from '@/game/scenes/HexTetris'
import {defaultSettings, HexSettings} from '@/hex-data/settings'

// @refresh reset
function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null)
    const [canMoveSprite, setCanMoveSprite] = useState(true)
    const [spritePosition, setSpritePosition] = useState({x: 0, y: 0})
    const [settings, setSettings] = useState<HexSettings>(defaultSettings())

    // Initialize settings from HexTetris defaults or fetch them if needed
    useEffect(() => {
        const scene = phaserRef.current?.scene as HexTetris
        if (scene) {
            // Assume there's a method to fetch settings or use the default
            const initialSettings = scene.getSettings ? scene.getSettings() : defaultSettings()
            setSettings(initialSettings)
        }
    }, [])

    const handleSettingChange = (settingKey: keyof HexSettings, value: number) => {
        const newSettings = {...settings, [settingKey]: value}
        setSettings(newSettings)
        const scene = phaserRef.current?.scene as HexTetris
        if (scene && scene.setSettings) {
            scene.setSettings(newSettings)
        }
    }

    const settingsControls = Object.entries(settings).map(([key, value]) => (
        <div key={key}>
            <label>{key}: {value}</label>
            <br/>
            <input
                type="range"
                min={-50}
                max={50}
                step="0.01"
                defaultValue={value}
                onChange={(e) => handleSettingChange(key as keyof HexSettings, Number(e.target.value))}
            />
        </div>
    ))

    // @ts-ignore
    return (
        <div id="app">
            <div>
                <div className="settings">
                    <h4 id="debug"></h4>
                    {settingsControls}
                </div>
            </div>
            <PhaserGame ref={phaserRef}
                        currentActiveScene={(scene) => setCanMoveSprite(scene.scene.key !== 'MainMenu')}/>
        </div>
    )
}

export default App
