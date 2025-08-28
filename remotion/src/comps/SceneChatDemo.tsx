import React from 'react'
import { interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion'
import { colors, type } from '../theme/tokens'
import { DeviceFrame } from './DeviceFrame'

export const SceneChatDemo: React.FC<{from?: number; duration?: number; prompt?: string}> = ({from = 90, duration = 180, prompt = 'Find 50 CTOs at fintech companies who posted about API challenges'}) => {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()
  const chars = Math.floor(interpolate(frame - from, [0, duration], [0, prompt.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))
  const typed = prompt.slice(0, Math.max(0, chars))

  return (
    <Sequence from={from} durationInFrames={duration}>
      <DeviceFrame>
        <div style={{fontFamily: type.ui}}>
          <div style={{fontFamily: type.heading, fontSize: 24, marginBottom: 12, color: colors.black}}>HermesAI Chat</div>
          <div style={{height: 440, background: '#F8FAFC', border: `1px solid ${colors.grayLight}`, borderRadius: 12, padding: 16, marginBottom: 12}}>
            <div style={{color: colors.gray}}>Assistant is ready…</div>
          </div>
          <div style={{display: 'flex', gap: 8}}>
            <div style={{flex: 1, border: `1px solid ${colors.black}`, borderRadius: 12, padding: 14, fontSize: 18}}>
              {typed}
              <span style={{opacity: frame % (fps / 2) < fps / 4 ? 1 : 0}}>|</span>
            </div>
            <div style={{background: colors.black, color: colors.white, padding: '14px 18px', borderRadius: 12}}>Send</div>
          </div>
        </div>
      </DeviceFrame>
    </Sequence>
  )
}

export default SceneChatDemo

