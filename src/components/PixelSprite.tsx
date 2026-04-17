import { useEffect, useState } from "react"

const SPRITE_PIXELS = [
  [0,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [1,1,2,1,1,2,1,1],
  [1,1,1,1,1,1,1,1],
  [0,1,1,3,3,1,1,0],
  [0,1,2,1,1,2,1,0],
  [0,0,1,1,1,1,0,0],
  [0,1,0,1,1,0,1,0],
]

interface PixelSpriteProps {
  size?: number
  active?: boolean
  breathing?: boolean
  color?: string
}

export function PixelSprite({ size = 32, active = true, breathing = true, color }: PixelSpriteProps) {
  const [blinkState, setBlinkState] = useState(false)
  const cellSize = size / 8

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => {
      setBlinkState(true)
      setTimeout(() => setBlinkState(false), 120)
    }, 4000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [active])

  const baseColor = color || (active ? "var(--retro-green)" : "#556677")
  const darkColor = active ? (color || "#009933") : "#334455"
  const eyeColor = active ? (blinkState ? darkColor : "#ffffff") : "#445566"
  const mouthColor = active ? "var(--retro-yellow)" : "#445566"

  return (
    <div
      className={breathing && active ? "sprite-breathe" : ""}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(8, ${cellSize}px)`,
        gridTemplateRows: `repeat(8, ${cellSize}px)`,
        imageRendering: "pixelated",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {SPRITE_PIXELS.flat().map((px, i) => {
        const col = px === 1 ? baseColor : px === 2 ? eyeColor : px === 3 ? mouthColor : "transparent"
        return <div key={i} style={{ background: col, width: cellSize, height: cellSize }} />
      })}
    </div>
  )
}
