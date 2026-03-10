'use client';

export default function GeometricBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(0.4); }
        }
        @keyframes floatDiamond {
          0%, 100% { transform: rotate(45deg) translateY(0px); opacity: 0.45; }
          50% { transform: rotate(45deg) translateY(-30px); opacity: 0.15; }
        }
        @keyframes floatTriangle {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.35; }
          50% { transform: translateY(-25px) rotate(12deg); opacity: 0.1; }
        }
        @keyframes nebulaFloat {
          0%, 100% { transform: scale(1) translate(0,0); }
          33% { transform: scale(1.08) translate(12px,-18px); }
          66% { transform: scale(0.94) translate(-10px,12px); }
        }
        @keyframes orbitRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* DOT GRID OVERLAY */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.35) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        opacity: 0.6,
      }} />

      {/* Nebula blobs */}
      <div style={{ position:'absolute', top:'-15%', left:'-8%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(88,28,220,0.22) 0%, rgba(139,92,246,0.1) 40%, transparent 70%)', filter:'blur(50px)', animation:'nebulaFloat 22s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'15%', right:'-12%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.16) 0%, rgba(109,40,217,0.07) 40%, transparent 70%)', filter:'blur(60px)', animation:'nebulaFloat 28s ease-in-out infinite 6s' }} />
      <div style={{ position:'absolute', bottom:'-20%', left:'25%', width:800, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.13) 0%, transparent 60%)', filter:'blur(70px)', animation:'nebulaFloat 35s ease-in-out infinite 12s' }} />
      <div style={{ position:'absolute', top:'45%', left:'-5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter:'blur(40px)', animation:'nebulaFloat 18s ease-in-out infinite 3s' }} />

      {/* Stars */}
      {([
        [8,12,3],[18,42,2],[32,8,1.5],[48,68,2.5],[62,18,2],[78,52,3],[88,8,1.5],[12,78,2],
        [42,32,1.5],[68,82,2],[83,38,2.5],[22,58,1.5],[52,88,2],[93,62,3],[38,52,1.5],
        [5,55,2],[72,25,1.5],[28,95,2],[58,5,2.5],[95,35,1.5],[15,22,2],[85,72,1.5],
        [45,48,3],[65,90,2],[30,70,1.5],
      ] as [number,number,number][]).map(([x,y,size], i) => (
        <div key={i} style={{
          position:'absolute', left:`${x}%`, top:`${y}%`,
          width: size, height: size, borderRadius:'50%',
          background: i % 5 === 0 ? 'rgba(196,181,253,0.95)' : i % 3 === 0 ? 'rgba(216,180,254,0.8)' : 'rgba(255,255,255,0.75)',
          animation: `twinkle ${3 + (i % 5)}s ease-in-out infinite ${i * 0.25}s`,
          boxShadow: size > 2 ? `0 0 ${size*2}px rgba(196,181,253,0.7)` : 'none',
        }} />
      ))}

      {/* Orbiting rings */}
      <div style={{ position:'absolute', top:'4%', right:'7%', width:180, height:180, animation:'orbitRing 22s linear infinite' }}>
        <div style={{ position:'absolute', inset:0, border:'1px solid rgba(139,92,246,0.2)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:-5, left:'50%', marginLeft:-5, width:10, height:10, borderRadius:'50%', background:'rgba(168,85,247,0.7)', boxShadow:'0 0 10px rgba(168,85,247,0.9)' }} />
      </div>
      <div style={{ position:'absolute', top:'6%', right:'9.5%', width:110, height:110, animation:'orbitRing 15s linear infinite reverse' }}>
        <div style={{ position:'absolute', inset:0, border:'1px solid rgba(139,92,246,0.14)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:-4, left:'50%', marginLeft:-4, width:7, height:7, borderRadius:'50%', background:'rgba(139,92,246,0.6)', boxShadow:'0 0 7px rgba(139,92,246,0.8)' }} />
      </div>

      {/* Diamonds */}
      <div style={{ position:'absolute', top:'10%', left:'5%', width:90, height:90, border:'1px solid rgba(139,92,246,0.25)', background:'rgba(139,92,246,0.04)', animation:'floatDiamond 10s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'13%', left:'8.5%', width:44, height:44, border:'1px solid rgba(168,85,247,0.18)', background:'rgba(168,85,247,0.05)', animation:'floatDiamond 10s ease-in-out infinite 0.6s' }} />
      <div style={{ position:'absolute', bottom:'18%', right:'5%', width:70, height:70, border:'1px solid rgba(124,58,237,0.22)', background:'rgba(124,58,237,0.04)', animation:'floatDiamond 12s ease-in-out infinite 2s' }} />
      <div style={{ position:'absolute', bottom:'21%', right:'8%', width:35, height:35, border:'1px solid rgba(124,58,237,0.15)', animation:'floatDiamond 12s ease-in-out infinite 2.5s' }} />
      <div style={{ position:'absolute', top:'48%', left:'18%', width:28, height:28, border:'1px solid rgba(196,181,253,0.3)', animation:'floatDiamond 8s ease-in-out infinite 1s' }} />
      <div style={{ position:'absolute', top:'33%', right:'18%', width:20, height:20, border:'1px solid rgba(196,181,253,0.25)', background:'rgba(139,92,246,0.06)', animation:'floatDiamond 9s ease-in-out infinite 3s' }} />
      <div style={{ position:'absolute', bottom:'45%', left:'80%', width:15, height:15, border:'1px solid rgba(168,85,247,0.3)', animation:'floatDiamond 7s ease-in-out infinite 0.5s' }} />

      {/* Triangles */}
      <div style={{ position:'absolute', top:'58%', left:'4%', width:0, height:0, borderLeft:'45px solid transparent', borderRight:'45px solid transparent', borderBottom:'78px solid rgba(139,92,246,0.1)', filter:'drop-shadow(0 0 8px rgba(139,92,246,0.2))', animation:'floatTriangle 14s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'22%', right:'4%', width:0, height:0, borderLeft:'30px solid transparent', borderRight:'30px solid transparent', borderBottom:'52px solid rgba(168,85,247,0.12)', filter:'drop-shadow(0 0 6px rgba(168,85,247,0.15))', animation:'floatTriangle 11s ease-in-out infinite 2s' }} />
      <div style={{ position:'absolute', bottom:'28%', left:'43%', width:0, height:0, borderLeft:'18px solid transparent', borderRight:'18px solid transparent', borderBottom:'31px solid rgba(196,181,253,0.14)', animation:'floatTriangle 9s ease-in-out infinite 1s' }} />
      <div style={{ position:'absolute', top:'75%', right:'28%', width:0, height:0, borderLeft:'12px solid transparent', borderRight:'12px solid transparent', borderBottom:'20px solid rgba(139,92,246,0.18)', animation:'floatTriangle 7s ease-in-out infinite 3s' }} />

      {/* Rotating large diamond */}
      <div style={{ position:'absolute', top:'38%', left:'-4%', width:130, height:130, border:'1px solid rgba(88,28,220,0.14)', animation:'rotateSlow 35s linear infinite' }} />
      <div style={{ position:'absolute', bottom:'10%', right:'35%', width:80, height:80, border:'1px solid rgba(139,92,246,0.1)', animation:'rotateSlow 25s linear infinite reverse' }} />

      {/* Vignette */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(5,5,10,0.5) 100%)' }} />
    </div>
  );
}
