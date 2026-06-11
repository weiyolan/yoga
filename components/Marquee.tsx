export default function Marquee() {
  const items = [
    "Ashtanga",
    "Vinyasa",
    "Yin",
    "Freediving",
    "Hikes",
    "Pranayama",
    "Foodiejives",
  ];
  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div className="marquee">
        {items.map((w, i) => (
          <span key={`a-${i}`}>{w}</span>
        ))}
        {items.map((w, i) => (
          <span key={`b-${i}`}>{w}</span>
        ))}
      </div>
    </div>
  );
}
