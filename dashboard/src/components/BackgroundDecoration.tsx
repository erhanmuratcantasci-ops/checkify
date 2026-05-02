export default function BackgroundDecoration() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden",
        background: "var(--color-bg)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-10%",
          width: 540,
          height: 540,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(251,113,133,0.32) 0%, rgba(251,113,133,0) 70%)",
          filter: "blur(120px)",
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "-15%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(244,63,94,0.18) 0%, rgba(244,63,94,0) 70%)",
          filter: "blur(140px)",
          opacity: 0.55,
        }}
      />
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
