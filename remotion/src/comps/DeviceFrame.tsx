import React from 'react'
import { AbsoluteFill } from 'remotion'
import { colors, shadow } from '../theme/tokens'

export const DeviceFrame: React.FC<{children?: React.ReactNode}> = ({children}) => {
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white}}>
      <div style={{
        width: 1400,
        height: 840,
        borderRadius: 18,
        border: `2px solid ${colors.black}`,
        boxShadow: shadow.soft,
        background: '#FFFFFF',
        overflow: 'hidden'
      }}>
        <div style={{height: 42, background: colors.black}} />
        <div style={{padding: 24}}>
          {children}
        </div>
      </div>
    </AbsoluteFill>
  )
}

export default DeviceFrame

