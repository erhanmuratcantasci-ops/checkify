export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const fontSize = size === 'sm' ? 42 : size === 'lg' ? 62 : 48;
  const letterSpacing = '6px';
  return (
    <span style={{
      fontFamily: "'Rajdhani', sans-serif",
      fontWeight: 700,
      fontSize,
      letterSpacing,
      textTransform: 'uppercase',
      background: 'linear-gradient(135deg, #e9d5ff 0%, #ffffff 60%, #c4b5fd 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}>
      Checkify
    </span>
  );
}
