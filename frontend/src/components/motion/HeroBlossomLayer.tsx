import type { CSSProperties } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const petals = [
  { left: '8%', delay: '0s', duration: '15.5s', drift: '24px', scale: 0.82, opacity: 0.46 },
  { left: '22%', delay: '-2.4s', duration: '18s', drift: '-18px', scale: 0.68, opacity: 0.38 },
  { left: '37%', delay: '-1.2s', duration: '16.8s', drift: '28px', scale: 0.9, opacity: 0.42 },
  { left: '54%', delay: '-4.1s', duration: '19.5s', drift: '-22px', scale: 0.74, opacity: 0.36 },
  { left: '69%', delay: '-0.8s', duration: '17.4s', drift: '20px', scale: 0.8, opacity: 0.4 },
  { left: '83%', delay: '-3.3s', duration: '15.9s', drift: '-16px', scale: 0.66, opacity: 0.34 },
]

export function HeroBlossomLayer() {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (prefersReducedMotion) {
    return null
  }

  return (
    <div aria-hidden="true" className="blossom-layer">
      {petals.map((petal, index) => (
        <span
          key={`${petal.left}-${index}`}
          className="blossom-layer__petal"
          style={
            {
              left: petal.left,
              animationDelay: petal.delay,
              animationDuration: petal.duration,
              '--blossom-drift': petal.drift,
              '--blossom-scale': petal.scale,
              '--blossom-opacity': petal.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
