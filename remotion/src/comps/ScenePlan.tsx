import React from 'react'
import { interpolate, Sequence, useCurrentFrame } from 'remotion'
import { colors, type } from '../theme/tokens'
import { DeviceFrame } from './DeviceFrame'

const Chip: React.FC<{text: string; index: number; from: number}> = ({text, index, from}) => {
  const frame = useCurrentFrame()
  const appear = frame - (from + index * 6)
  const o = interpolate(appear, [0, 6, 12], [0, 1, 1], {extrapolateLeft: 'clamp'})
  const y = interpolate(appear, [0, 6], [8, 0], {extrapolateLeft: 'clamp'})
  return (
    <div style={{
      opacity: o,
      transform: `translateY(${y}px)`,
      border: `1px solid ${colors.black}`,
      borderRadius: 999,
      padding: '6px 12px',
      fontFamily: type.ui,
      background: colors.white
    }}>{text}</div>
  )
}

export const ScenePlan: React.FC<{from?: number; duration?: number}> = ({from = 270, duration = 180}) => {
  const criteria = ['CTO', 'Fintech', 'Posted about API challenges']
  const enrich = ['Email', 'LinkedIn', 'Title', 'Company', 'Phone']
  return (
    <Sequence from={from} durationInFrames={duration}>
      <DeviceFrame>
        <div style={{fontFamily: type.ui}}>
          <div style={{fontFamily: type.heading, fontSize: 24, marginBottom: 16}}>Generated Plan</div>
          <div style={{display: 'flex', gap: 24}}>
            <div style={{flex: 1}}>
              <div style={{fontWeight: 600, marginBottom: 8}}>Criteria</div>
              <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                {criteria.map((c, i) => (
                  <Chip key={i} text={c} index={i} from={from} />
                ))}
              </div>
            </div>
            <div style={{flex: 1}}>
              <div style={{fontWeight: 600, marginBottom: 8}}>Enrichments</div>
              <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                {enrich.map((e, i) => (
                  <Chip key={i} text={e} index={i} from={from + 24} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DeviceFrame>
    </Sequence>
  )
}

export default ScenePlan

