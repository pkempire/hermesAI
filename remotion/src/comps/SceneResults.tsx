import React from 'react'
import { interpolate, Sequence, useCurrentFrame } from 'remotion'
import { colors, type } from '../theme/tokens'
import { DeviceFrame } from './DeviceFrame'

const Card: React.FC<{i: number; from: number}> = ({i, from}) => {
  const frame = useCurrentFrame()
  const f = frame - (from + i * 4)
  const o = interpolate(f, [0, 8], [0, 1], {extrapolateLeft: 'clamp'})
  const y = interpolate(f, [0, 8], [12, 0], {extrapolateLeft: 'clamp'})
  return (
    <div style={{
      opacity: o,
      transform: `translateY(${y}px)`,
      width: 300,
      height: 140,
      border: `1px solid ${colors.black}`,
      borderRadius: 16,
      padding: 12,
      background: colors.white
    }}>
      <div style={{fontWeight: 600, fontFamily: type.ui}}>Prospect {i + 1}</div>
      <div style={{color: colors.gray}}>CTO • Fintech</div>
      <div style={{marginTop: 8, display: 'flex', gap: 8}}>
        <div style={{border: `1px solid ${colors.black}`, borderRadius: 999, padding: '4px 8px'}}>LinkedIn</div>
        <div style={{border: `1px solid ${colors.black}`, borderRadius: 999, padding: '4px 8px'}}>Phone</div>
      </div>
    </div>
  )
}

export const SceneResults: React.FC<{from?: number; duration?: number}> = ({from = 450, duration = 180}) => {
  const cards = new Array(6).fill(0).map((_, i) => i)
  return (
    <Sequence from={from} durationInFrames={duration}>
      <DeviceFrame>
        <div style={{fontFamily: type.ui}}>
          <div style={{fontFamily: type.heading, fontSize: 24, marginBottom: 16}}>Live Results</div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12}}>
            {cards.map((i) => (
              <Card key={i} i={i} from={from} />
            ))}
          </div>
        </div>
      </DeviceFrame>
    </Sequence>
  )
}

export default SceneResults

