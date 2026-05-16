import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0f0f, #2a2a2a)',
          borderRadius: 32,
          fontSize: 100,
          fontWeight: 800,
          color: '#fbbf24',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        P
      </div>
    ),
    { ...size },
  );
}
