'use client'

import { useEffect, useRef } from 'react'

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Find all elements with reveal-hidden inside the container
            const targets = entry.target.querySelectorAll('.reveal-hidden')
            
            if (targets.length > 0) {
              targets.forEach((target) => {
                target.classList.add('reveal-visible')
              })
            } else {
              // If the container itself should reveal
              entry.target.classList.add('reveal-visible')
            }
            
            // Once revealed, we don't need to observe anymore
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Start slightly before it's fully in view
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return ref
}
