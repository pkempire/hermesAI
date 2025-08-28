import React from 'react'
import { Sequence } from 'remotion'
import { colors, type } from '../theme/tokens'
import { DeviceFrame } from './DeviceFrame'

export const SceneEmail: React.FC<{from?: number; duration?: number}> = ({from = 630, duration = 120}) => {
  return (
    <Sequence from={from} durationInFrames={duration}>
      <DeviceFrame>
        <div style={{fontFamily: type.ui}}>
          <div style={{fontFamily: type.heading, fontSize: 24, marginBottom: 16}}>Personalized Email</div>
          <div style={{border: `1px solid ${colors.black}`, borderRadius: 12, padding: 16}}>
            <div>Hi Sarah,</div>
            <div style={{marginTop: 8}}>
              Saw your post about API latency hitting 500ms during Black Friday. HermesAI helps teams cut P95 by 35% in under a week.
            </div>
            <div style={{marginTop: 8}}>— Would you be open to a quick chat?</div>
          </div>
        </div>
      </DeviceFrame>
    </Sequence>
  )
}

export default SceneEmail

