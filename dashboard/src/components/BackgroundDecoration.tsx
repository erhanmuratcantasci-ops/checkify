export default function BackgroundDecoration() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "var(--color-bg)",
      }}
    >
      {/* Primary coral glow — bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "-18%",
          right: "-12%",
          width: 620,
          height: 620,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(251,113,133,0.55) 0%, rgba(251,113,133,0) 70%)",
          filter: "blur(120px)",
          opacity: 0.25,
        }}
      />
      {/* Faint counter-glow — far top-left */}
      <div
        style={{
          position: "absolute",
          top: "-25%",
          left: "-20%",
          width: 460,
          height: 460,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(244,63,94,0.35) 0%, rgba(244,63,94,0) 70%)",
          filter: "blur(140px)",
          opacity: 0.12,
        }}
      />
      {/* Subtle noise dots */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.045) 1px, transparent 0)," +
            "radial-gradient(1px 1px at 75% 65%, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "180px 180px, 220px 220px",
          opacity: 0.5,
        }}
      />
    </div>
  );
}
