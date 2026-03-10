export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.4 : 1;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 * scale }}>
      <div style={{
        width: 38 * scale, height: 38 * scale,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {/* Outer hexagon/diamond shape */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 40%, #a855f7 100%)',
          clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)',
          boxShadow: '0 0 20px rgba(139,92,246,0.5)',
        }} />
        {/* Inner checkmark */}
        <svg
          width={18 * scale} height={18 * scale}
          viewBox="0 0 24 24" fill="none"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <path
            d="M5 12.5L10 17.5L19 7"
            stroke="white" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
      <span style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        fontSize: 22 * scale,
        color: '#ffffff',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        background: 'linear-gradient(135deg, #e9d5ff 0%, #ffffff 50%, #c4b5fd 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        Checkify
      </span>
    </div>
  );
}
