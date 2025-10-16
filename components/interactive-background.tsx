"use client"

import React from "react"

export default function InteractiveBackground() {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let raf = 0

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / rect.width
      const my = (e.clientY - rect.top) / rect.height
      targetX = (mx - 0.5) * 6
      targetY = (my - 0.5) * 6
    }

    const animate = () => {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      el.style.setProperty("--offset-x", `${currentX.toFixed(2)}px`)
      el.style.setProperty("--offset-y", `${currentY.toFixed(2)}px`)
      raf = requestAnimationFrame(animate)
    }

    el.addEventListener("mousemove", onMove)
    raf = requestAnimationFrame(animate)
    return () => {
      el.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        backgroundImage: `
          /* subtle grid */
          repeating-linear-gradient(
            to right,
            color-mix(in oklab, var(--border) 26%, transparent) 0 1px,
            transparent 1px 30px
          ),
          repeating-linear-gradient(
            to bottom,
            color-mix(in oklab, var(--border) 26%, transparent) 0 1px,
            transparent 1px 30px
          ),
          /* soft glows that follow the cursor */
          radial-gradient(circle at calc(10% + var(--offset-x, 0px)) calc(20% + var(--offset-y, 0px)), color-mix(in oklab, var(--border) 38%, transparent), transparent 42%),
          radial-gradient(circle at calc(70% + var(--offset-x, 0px)) calc(75% + var(--offset-y, 0px)), color-mix(in oklab, var(--primary) 22%, transparent), transparent 50%),
          radial-gradient(circle at 0 0, var(--muted), transparent 80%)
        `,
        backgroundSize: "30px 30px, 30px 30px, 240px 240px, 420px 420px, 100% 100%",
        backgroundRepeat: "repeat, repeat, repeat, no-repeat, no-repeat",
        opacity: 0.7,
        filter: "saturate(1.04)",
      }}
    />
  )
}
