/** Brand mark for PWA / favicon images: compass on Kompas Green (#0E7C66). */
export function BrandIcon({ size, padding = 0.18, rounded = true }: { size: number; padding?: number; rounded?: boolean }) {
  const inner = Math.round(size * (1 - padding * 2));
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0E7C66",
        borderRadius: rounded ? Math.round(size * 0.22) : 0,
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#F08A5D" stroke="#FFFFFF" />
      </svg>
    </div>
  );
}
