/**
 * Ambient backdrop for the landing page. Larger and quieter than the auth /
 * customer COD glows: 4 coral / rose blobs at very low opacity over the page
 * background, plus a subtle dot grid. Lives behind everything (z-0); page
 * content sits in a relative z-10 container.
 */
export function MarketingBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Top-right warm coral wash */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: 760,
          height: 760,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(251,113,133,0.4) 0%, rgba(251,113,133,0) 70%)",
          filter: "blur(140px)",
          opacity: 0.4,
        }}
      />
      {/* Mid-left rose secondary */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "-15%",
          width: 620,
          height: 620,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(244,63,94,0.25) 0%, rgba(244,63,94,0) 70%)",
          filter: "blur(160px)",
          opacity: 0.35,
        }}
      />
      {/* Bottom-right warm tail */}
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-20%",
          width: 720,
          height: 720,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(253,164,175,0.18) 0%, rgba(253,164,175,0) 70%)",
          filter: "blur(150px)",
          opacity: 0.3,
        }}
      />
      {/* Far bottom-left subtle */}
      <div
        style={{
          position: "absolute",
          bottom: "-25%",
          left: "10%",
          width: 540,
          height: 540,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(251,113,133,0.12) 0%, rgba(251,113,133,0) 70%)",
          filter: "blur(180px)",
          opacity: 0.5,
        }}
      />
      {/* Quiet noise dots */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.04) 1px, transparent 0)," +
            "radial-gradient(1px 1px at 75% 65%, rgba(255,255,255,0.035) 1px, transparent 0)",
          backgroundSize: "200px 200px, 240px 240px",
          opacity: 0.45,
        }}
      />
    </div>
  );
}
