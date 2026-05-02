export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const fontSize = size === "sm" ? 22 : size === "lg" ? 32 : 26;
  return (
    <span
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        fontSize,
        letterSpacing: "var(--tracking-display)",
        color: "var(--color-fg)",
        lineHeight: 1,
        display: "inline-block",
      }}
    >
      Chekkify
    </span>
  );
}
