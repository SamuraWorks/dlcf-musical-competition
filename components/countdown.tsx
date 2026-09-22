'use client'

import { useEffect, useState } from 'react'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(target: string): TimeLeft | null {
  const ms = new Date(target).getTime() - Date.now()
  if (ms <= 0) return null
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms / 3600000) % 24),
    minutes: Math.floor((ms / 60000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  }
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

interface CountdownProps {
  target: string
  label: string
  sub?: string
  doneLabel: string
  doneSub?: string
  compact?: boolean
}

export function Countdown({ target, label, sub, doneLabel, doneSub, compact }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const tick = () => setTimeLeft(getTimeLeft(target))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  if (!mounted) return null

  if (timeLeft === null) {
    return (
      <div className="cd-done" role="status">
        <strong>{doneLabel}</strong>
        {doneSub && <span>{doneSub}</span>}
      </div>
    )
  }

  return (
    <div className={`cd-wrap${compact ? ' cd-compact' : ''}`} aria-label={label}>
      <p className="cd-label">{label}</p>
      {sub && <p className="cd-sub">{sub}</p>}
      <div className="cd-grid">
        <div className="cd-unit"><strong>{pad(timeLeft.days)}</strong><span>Days</span></div>
        <div className="cd-unit"><strong>{pad(timeLeft.hours)}</strong><span>Hours</span></div>
        <div className="cd-unit"><strong>{pad(timeLeft.minutes)}</strong><span>Minutes</span></div>
        <div className="cd-unit"><strong>{pad(timeLeft.seconds)}</strong><span>Seconds</span></div>
      </div>
    </div>
  )
}