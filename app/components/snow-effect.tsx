"use client"

import { useEffect, useState } from "react"
import styles from "./snow-effect.module.css"

export default function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState<number[]>([])

  useEffect(() => {
    // Generate a fixed number of snowflakes
    const flakes = Array.from({ length: 50 }, (_, i) => i)
    setSnowflakes(flakes)
  }, [])

  return (
    <div className={styles.snowContainer}>
      {snowflakes.map((i) => (
        <div
          key={i}
          className={styles.snowflake}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
            opacity: Math.random(),
          }}
        >
          ❄
        </div>
      ))}
    </div>
  )
}
