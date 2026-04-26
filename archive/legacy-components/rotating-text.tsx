'use client'

import { useEffect, useState } from 'react'

interface RotatingTextProps {
  words: string[]
  className?: string
  interval?: number
}

export function RotatingText({ 
  words, 
  className = '',
  interval = 2500 
}: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (words.length === 0) return
    
    const timer = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length)
        setIsVisible(true)
      }, 200) // Fade out duration
    }, interval)

    return () => clearInterval(timer)
  }, [words.length, interval])

  const currentWord = words[currentIndex] || words[0] || ''

  return (
    <span
      className={`inline-block transition-all duration-300 text-amber-600 font-semibold ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${className}`}
    >
      {currentWord}
    </span>
  )
}

