import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { colors, type } from '../theme/tokens';

export const SceneCTA: React.FC<{from?: number; duration?: number}> = ({from = 750, duration = 90}) => {
  return (
    <Sequence from={from} durationInFrames={duration}>
      <AbsoluteFill style={{backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: type.heading, fontSize: 64, color: colors.black}}>HermesAI</div>
          <div style={{fontFamily: type.ui, fontSize: 24, color: colors.gold, marginTop: 8}}>Find your next customers</div>
          <div style={{display: 'inline-block', marginTop: 24, border: `2px solid ${colors.black}`, borderRadius: 999, padding: '12px 18px', fontFamily: type.ui}}>Get Started</div>
        </div>
      </AbsoluteFill>
    </Sequence>
  )
}

export default SceneCTA

