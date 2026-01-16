"use client"

import React, { useEffect, useRef, useState } from "react"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
  opacity: number
}

const COLORS = [
  "#FF3366", // Pink/Red
  "#33FF99", // Green
  "#33CCFF", // Light Blue
  "#FFCC33", // Yellow
  "#9933FF", // Purple
  "#FF9933", // Orange
  "#FFFFFF", // White
]

export default function AmbientEffect({ enabled = true }: { enabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const mouse = useRef({ x: -100, y: -100, active: false })
  const animationFrameId = useRef<number>(0)

  useEffect(() => {
    if (!enabled) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    // Initialize particles
    particles.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 1,
      speedY: Math.random() * 1 + 0.5, // Initial free fall (gravity-like)
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.5 + 0.2,
    }))

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      mouse.current.active = true
    }

    const handleMouseLeave = () => {
      mouse.current.active = false
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseleave", handleMouseLeave)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.current.forEach((p) => {
        // Apply physics
        if (mouse.current.active) {
          // Follow mouse logic
          const dx = mouse.current.x - p.x
          const dy = mouse.current.y - p.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 300) {
            const force = (300 - distance) / 300
            p.speedX += dx * force * 0.02
            p.speedY += dy * force * 0.02
          }
        }

        // Natural drag/gravity
        p.speedX *= 0.95
        p.speedY = p.speedY * 0.95 + 0.1 // Adding a bit of gravity

        p.x += p.speedX
        p.y += p.speedY

        // Wrap around
        if (p.y > canvas.height) {
          p.y = -10
          p.x = Math.random() * canvas.width
          p.speedY = Math.random() * 1 + 0.5
        }
        if (p.x > canvas.width) p.x = 0
        if (p.x < 0) p.x = canvas.width

        // Draw
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.shadowBlur = 10
        ctx.shadowColor = p.color
        ctx.fill()
      })

      animationFrameId.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseleave", handleMouseLeave)
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ filter: "blur(0.5px)" }}
    />
  )
}
