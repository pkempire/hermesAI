import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const Title: React.FC<{text: string, delay?: number}> = ({text, delay = 0}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame - delay * fps, [0, 10, 20], [0, 1, 1], {extrapolateLeft: 'clamp'});
  const translateY = interpolate(frame - delay * fps, [0, 10, 20], [20, 0, 0], {extrapolateLeft: 'clamp'});
  return (
    <div style={{
      opacity,
      transform: `translateY(${translateY}px)`,
      fontFamily: 'Inter, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      textAlign: 'center',
      color: '#ECF2FF',
      textShadow: '0 6px 24px rgba(0,0,0,0.35)',
      fontSize: 72
    }}>{text}</div>
  );
};

const Sub: React.FC<{text: string, delay?: number}> = ({text, delay = 0}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame - delay * fps, [0, 8, 16], [0, 1, 1], {extrapolateLeft: 'clamp'});
  return (
    <div style={{
      opacity,
      marginTop: 16,
      fontFamily: 'Inter, sans-serif',
      fontWeight: 400,
      textAlign: 'center',
      color: '#BBD1FF',
      fontSize: 28
    }}>{text}</div>
  );
};

const GlowBG: React.FC = () => (
  <AbsoluteFill style={{
    background: 'radial-gradient(60% 60% at 50% 40%, rgba(46,88,255,0.35) 0%, rgba(12,18,36,0.9) 55%, #0B1224 100%)'
  }} />
);

const LightningGlyph: React.FC<{delay?: number}> = ({delay = 0}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame - delay * fps, [0, 15, 30], [0, 1, 1], {extrapolateLeft: 'clamp'});
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" style={{
      margin: '0 auto', display: 'block', filter: 'drop-shadow(0 0 24px rgba(64,128,255,0.6))'
    }}>
      <path d="M110 10 L70 100 H110 L90 190 L140 90 H100 Z" fill="none" stroke="#78A6FF" strokeWidth="6" strokeLinecap="round"
        strokeDasharray="300" strokeDashoffset={300 - 300 * p} />
    </svg>
  );
};

const Caption: React.FC<{text: string}> = ({text}) => (
  <div style={{
    position: 'absolute', bottom: 100, width: '100%', textAlign: 'center',
    fontFamily: 'Inter, sans-serif', color: '#C9D8FF', fontSize: 24
  }}>{text}</div>
);

const ProspectsRow: React.FC<{progress: number}> = ({progress}) => {
  const cards = new Array(5).fill(0).map((_, i) => i);
  return (
    <div style={{display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40}}>
      {cards.map((i) => {
        const show = progress > i / cards.length;
        return (
          <div key={i} style={{
            width: 220, height: 120,
            borderRadius: 16,
            border: '1px solid rgba(120,166,255,0.35)',
            background: 'linear-gradient(180deg, rgba(120,166,255,0.08), rgba(12,18,36,0.6))',
            opacity: show ? 1 : 0,
            transform: `translateY(${show ? 0 : 12}px)`,
            transition: 'all 300ms ease-out'
          }} />
        );
      })}
    </div>
  );
};

export const HermesLaunch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (sec: number) => Math.floor(sec * fps);
  const progress = Math.min(1, Math.max(0, (frame - t(36)) / t(8)));

  return (
    <AbsoluteFill>
      <GlowBG />

      {frame < t(4) && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <LightningGlyph />
          <Title text="HermesAI" delay={0.5} />
          <Sub text="Your personal messenger of growth" delay={0.9} />
        </AbsoluteFill>
      )}

      {frame >= t(4) && frame < t(12) && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <Title text="Prospecting is slow and noisy" />
          <Sub text="Tabs. Spreadsheets. Missed timing." />
        </AbsoluteFill>
      )}

      {frame >= t(12) && frame < t(22) && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <Title text="Describe your ideal customer" />
          <Sub text="Hermes turns intent into action" />
        </AbsoluteFill>
      )}

      {frame >= t(22) && frame < t(36) && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <Title text="Extracted Criteria + Enrichments" />
          <Sub text="Interactive plan, ready to refine" />
          <Caption text="VP Engineering • Series A–B • Fintech • LinkedIn Hiring Posts" />
        </AbsoluteFill>
      )}

      {frame >= t(36) && frame < t(46) && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 160}}>
          <Title text="Live, enriched results" />
          <ProspectsRow progress={progress} />
        </AbsoluteFill>
      )}

      {frame >= t(46) && frame < t(54) && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <Title text="Personalized openers" />
          <Sub text="Approve and send with confidence" />
        </AbsoluteFill>
      )}

      {frame >= t(54) && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <LightningGlyph />
          <Title text="HermesAI" />
          <Sub text="Find your next customers" />
          <Caption text="hermes.ai" />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export default HermesLaunch;

