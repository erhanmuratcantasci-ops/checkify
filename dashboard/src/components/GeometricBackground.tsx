'use client';

export default function GeometricBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(0.5); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes floatDiamond {
          0%, 100% { transform: rotate(45deg) translateY(0px); opacity: 0.35; }
          50% { transform: rotate(45deg) translateY(-25px); opacity: 0.12; }
        }
        @keyframes floatTriangle {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(15deg); opacity: 0.1; }
        }
        @keyframes nebulaFloat {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
          33% { transform: scale(1.1) translate(10px, -15px); opacity: 0.4; }
          66% { transform: scale(0.95) translate(-8px, 10px); opacity: 0.7; }
        }
        @keyframes orbitRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Nebula blobs */}
      <div style={{ position:'absolute', top:'-10%', left:'-5%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(88,28,220,0.18) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)', filter:'blur(40px)', animation:'nebulaFloat 20s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'20%', right:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(109,40,217,0.06) 40%, transparent 70%)', filter:'blur(50px)', animation:'nebulaFloat 25s ease-in-out infinite 5s' }} />
      <div style={{ position:'absolute', bottom:'-15%', left:'30%', width:700, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 60%)', filter:'blur(60px)', animation:'nebulaFloat 30s ease-in-out infinite 10s' }} />

      {/* Stars */}
      {[
        [10,15],[20,45],[35,10],[50,70],[65,20],[80,55],[90,10],[15,80],[45,35],[70,85],[85,40],[25,60],[55,90],[95,65],[40,55]
      ].map(([x, y], i) => (
        <div key={i} style={{
          position:'absolute', left:`${x}%`, top:`${y}%`,
          width: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1.5,
          height: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1.5,
          borderRadius:'50%',
          background: i % 4 === 0 ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.7)',
          animation: `twinkle ${3 + (i % 4)}s ease-in-out infinite ${i * 0.3}s`,
          boxShadow: i % 3 === 0 ? '0 0 4px rgba(196,181,253,0.8)' : 'none',
        }} />
      ))}

      {/* Orbiting ring top-right */}
      <div style={{ position:'absolute', top:'5%', right:'8%', width:160, height:160, animation:'orbitRing 20s linear infinite' }}>
        <div style={{ position:'absolute', inset:0, border:'1px solid rgba(139,92,246,0.15)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:-4, left:'50%', marginLeft:-4, width:8, height:8, borderRadius:'50%', background:'rgba(168,85,247,0.6)', boxShadow:'0 0 8px rgba(168,85,247,0.8)' }} />
      </div>
      <div style={{ position:'absolute', top:'7%', right:'10%', width:100, height:100, animation:'orbitRing 14s linear infinite reverse' }}>
        <div style={{ position:'absolute', inset:0, border:'1px solid rgba(139,92,246,0.1)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:-3, left:'50%', marginLeft:-3, width:6, height:6, borderRadius:'50%', background:'rgba(139,92,246,0.5)', boxShadow:'0 0 6px rgba(139,92,246,0.7)' }} />
      </div>

      {/* Diamonds */}
      <div style={{ position:'absolute', top:'12%', left:'6%', width:80, height:80, border:'1px solid rgba(139,92,246,0.2)', background:'rgba(139,92,246,0.03)', animation:'floatDiamond 9s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'15%', left:'9%', width:40, height:40, border:'1px solid rgba(168,85,247,0.15)', background:'rgba(168,85,247,0.04)', animation:'floatDiamond 9s ease-in-out infinite 0.5s' }} />
      <div style={{ position:'absolute', bottom:'20%', right:'6%', width:60, height:60, border:'1px solid rgba(124,58,237,0.18)', background:'rgba(124,58,237,0.03)', animation:'floatDiamond 11s ease-in-out infinite 2s' }} />
      <div style={{ position:'absolute', top:'50%', left:'20%', width:25, height:25, border:'1px solid rgba(196,181,253,0.25)', animation:'floatDiamond 7s ease-in-out infinite 1s' }} />
      <div style={{ position:'absolute', top:'35%', right:'20%', width:18, height:18, border:'1px solid rgba(196,181,253,0.2)', background:'rgba(139,92,246,0.05)', animation:'floatDiamond 8s ease-in-out infinite 3s' }} />

      {/* Triangles */}
      <div style={{ position:'absolute', top:'60%', left:'5%', width:0, height:0, borderLeft:'40px solid transparent', borderRight:'40px solid transparent', borderBottom:'70px solid rgba(139,92,246,0.08)', filter:'drop-shadow(0 0 6px rgba(139,92,246,0.15))', animation:'floatTriangle 13s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'25%', right:'5%', width:0, height:0, borderLeft:'25px solid transparent', borderRight:'25px solid transparent', borderBottom:'44px solid rgba(168,85,247,0.1)', animation:'floatTriangle 10s ease-in-out infinite 2s' }} />
      <div style={{ position:'absolute', bottom:'30%', left:'45%', width:0, height:0, borderLeft:'15px solid transparent', borderRight:'15px solid transparent', borderBottom:'26px solid rgba(196,181,253,0.12)', animation:'floatTriangle 8s ease-in-out infinite 1s' }} />

      {/* Rotating large diamond center-left */}
      <div style={{ position:'absolute', top:'40%', left:'-3%', width:120, height:120, border:'1px solid rgba(88,28,220,0.12)', animation:'rotateSlow 30s linear infinite' }} />
    </div>
  );
}
