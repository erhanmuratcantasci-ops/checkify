'use client';

const shimmer = `
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
`;

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '600px 100%',
  animation: 'shimmer 1.6s infinite linear',
  borderRadius: 8,
};

function ShimmerCSS() {
  return <style>{shimmer}</style>;
}

function Block({ w = '100%', h = 16, radius = 8 }: { w?: string | number; h?: number; radius?: number }) {
  return (
    <div style={{ ...shimmerStyle, width: w, height: h, borderRadius: radius }} />
  );
}

export function SkeletonCard() {
  return (
    <>
      <ShimmerCSS />
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '20px 22px',
      }}>
        <Block w={28} h={22} radius={6} />
        <div style={{ marginTop: 10 }}><Block w="60%" h={26} /></div>
        <div style={{ marginTop: 8 }}><Block w="45%" h={13} /></div>
        <div style={{ marginTop: 4 }}><Block w="35%" h={12} /></div>
      </div>
    </>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <>
      <ShimmerCSS />
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '0.5fr 1.5fr 1fr 0.8fr 0.8fr 0.8fr',
          padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 16,
        }}>
          {[40, 80, 70, 60, 60, 50].map((w, i) => (
            <Block key={i} w={w} h={11} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '0.5fr 1.5fr 1fr 0.8fr 0.8fr 0.8fr',
            padding: '14px 20px', borderBottom: i < rows - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', gap: 16,
            alignItems: 'center',
          }}>
            <Block w={30} h={13} />
            <Block w="75%" h={14} />
            <Block w="80%" h={13} />
            <Block w="55%" h={14} />
            <Block w={70} h={22} radius={6} />
            <Block w="60%" h={13} />
          </div>
        ))}
      </div>
    </>
  );
}

export function SkeletonShopCard() {
  return (
    <>
      <ShimmerCSS />
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <Block w="40%" h={18} />
            <div style={{ marginTop: 8 }}><Block w="55%" h={13} /></div>
          </div>
          <Block w={50} h={32} radius={8} />
        </div>
        <Block w="100%" h={40} radius={8} />
        <div style={{ marginTop: 16 }}><Block w="100%" h={60} radius={8} /></div>
      </div>
    </>
  );
}

export function SkeletonProfile() {
  return (
    <>
      <ShimmerCSS />
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '28px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <Block w={52} h={52} radius={14} />
          <div style={{ flex: 1 }}>
            <Block w="40%" h={16} />
            <div style={{ marginTop: 6 }}><Block w="55%" h={13} /></div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[1, 2].map(i => (
            <div key={i}><Block w="40%" h={13} /><div style={{ marginTop: 6 }}><Block w="100%" h={40} radius={10} /></div></div>
          ))}
        </div>
        <Block w="100%" h={1} radius={0} />
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[1, 2].map(i => (
            <div key={i}><Block w="40%" h={13} /><div style={{ marginTop: 6 }}><Block w="100%" h={40} radius={10} /></div></div>
          ))}
        </div>
        <div style={{ marginTop: 20 }}><Block w="100%" h={42} radius={10} /></div>
      </div>
    </>
  );
}
