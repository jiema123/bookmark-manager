"use client"

import React, { useEffect, useState, useMemo } from "react"
import styles from "./snow-effect.module.css"

interface Snowflake {
  id: number
  key: string
  // Store static style properties to prevent re-renders from randomizing them
  style: {
    left: string
    animationDelay: string
    animationDuration: string
    opacity: number
  }
}

interface Explosion {
  id: number
  x: number
  y: number
  color: string
}

const COLORS = [
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#FFFFFF", // White
]

export default function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])
  const [explosions, setExplosions] = useState<Explosion[]>([])

  // Helper to generate a random style for a snowflake
  const generateSnowflakeStyle = () => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${5 + Math.random() * 10}s`,
    opacity: Math.random(),
  })

  useEffect(() => {
    // Generate a fixed number of snowflakes with static styles
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      key: `flake-${i}`,
      style: generateSnowflakeStyle(),
    }))
    setSnowflakes(flakes)
  }, [])

  const handleMouseEnter = (e: React.MouseEvent, id: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    // Calculate center relative to viewport
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    // Choose a random color
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]

    const newExplosion = {
      id: Date.now(),
      x,
      y,
      color,
    }

    setExplosions((prev) => [...prev, newExplosion])

    // Remove explosion after animation (1s matches CSS)
    setTimeout(() => {
      setExplosions((prev) => prev.filter((ex) => ex.id !== newExplosion.id))
    }, 1000)

    // Respawn snowflake by updating its key AND regenerating its style
    // This affects ONLY the specific snowflake with matching ID
    setSnowflakes((prev) =>
      prev.map((flake) =>
        flake.id === id
          ? {
            ...flake,
            key: `flake-${flake.id}-${Date.now()}`,
            style: generateSnowflakeStyle(), // Give it a new position/style
          }
          : flake // Return other snowflakes exactly as they are
      )
    )
  }

  return (
    <div className={styles.snowContainer}>
      {snowflakes.map((flake) => (
        <div
          key={flake.key}
          className={styles.snowflake}
          onMouseEnter={(e) => handleMouseEnter(e, flake.id)}
          style={{
            left: flake.style.left,
            animationDelay: flake.style.animationDelay,
            animationDuration: flake.style.animationDuration,
            opacity: flake.style.opacity,
          } as React.CSSProperties}
        >
          ❄
        </div>
      ))}

      {explosions.map((explosion) => (
        <div
          key={explosion.id}
          className={styles.explosion}
          style={{ left: explosion.x, top: explosion.y } as React.CSSProperties}
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30 * (Math.PI / 180)
            const dist = 50 + Math.random() * 50 // Distance of explosion
            const tx = Math.cos(angle) * dist
            const ty = Math.sin(angle) * dist
            return (
              <div
                key={i}
                className={styles.particle}
                style={{
                  backgroundColor: explosion.color,
                  "--tx": `${tx}px`,
                  "--ty": `${ty}px`,
                } as React.CSSProperties}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
