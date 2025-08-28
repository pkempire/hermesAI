import React from 'react';
import { AbsoluteFill, Sequence, Video } from 'remotion';
import { colors } from '../theme/tokens';

export const SceneIntroOlympus: React.FC<{from?: number; duration?: number; src?: string}> = ({from = 0, duration = 90, src = '../assets/gods_intro.mp4'}) => {
  return (
    <>
      <Sequence from={from} durationInFrames={duration}>
        <AbsoluteFill style={{backgroundColor: colors.white}}>
          <Video src={src} />
        </AbsoluteFill>
      </Sequence>
    </>
  )
}

export default SceneIntroOlympus

