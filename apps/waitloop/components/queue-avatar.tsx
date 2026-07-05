import type { Avatar, EarnedItem } from "@/lib/avatars";

/**
 * The queue avatar: a colored face built from three layers (expression,
 * accessory, earned items). Pure SVG so it renders identically in server
 * components, client components, and at any size.
 */

const INK = "#1f3a52";

function Dot({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={4.5} fill={INK} />;
}

function Smile() {
  return (
    <path d="M38 66 Q50 77 62 66" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
  );
}

function Star({ x, y, fill = INK }: { x: number; y: number; fill?: string }) {
  const d = `M${x} ${y - 8} L${x + 2.5} ${y - 2.5} L${x + 8} ${y} L${x + 2.5} ${y + 2.5} L${x} ${y + 8} L${x - 2.5} ${y + 2.5} L${x - 8} ${y} L${x - 2.5} ${y - 2.5} Z`;
  return <path d={d} fill={fill} />;
}

const EXPRESSION_LAYERS: Record<Avatar["expression"], React.ReactNode> = {
  smile: (
    <>
      <Dot x={36} y={52} />
      <Dot x={64} y={52} />
      <Smile />
    </>
  ),
  grin: (
    <>
      <Dot x={36} y={52} />
      <Dot x={64} y={52} />
      <path d="M35 62 Q50 82 65 62 Z" fill={INK} />
    </>
  ),
  wink: (
    <>
      <Dot x={36} y={52} />
      <path d="M57 52 h13" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <Smile />
    </>
  ),
  joy: (
    <>
      <path d="M30 53 Q36 44 42 53" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <path d="M58 53 Q64 44 70 53" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <Smile />
    </>
  ),
  starry: (
    <>
      <Star x={36} y={52} />
      <Star x={64} y={52} />
      <circle cx={50} cy={70} r={5.5} fill={INK} />
    </>
  ),
};

const ACCESSORY_LAYERS: Record<Avatar["accessory"], React.ReactNode> = {
  none: null,
  party: (
    <>
      <polygon points="50,2 37,30 63,30" fill="#ff7bac" />
      <circle cx={46} cy={20} r={2.2} fill="#fff" opacity={0.75} />
      <circle cx={55} cy={26} r={2.2} fill="#fff" opacity={0.75} />
      <circle cx={50} cy={4} r={4.5} fill="#ffd166" />
    </>
  ),
  cap: (
    <>
      <path d="M27 33 Q50 7 73 33 L73 35 L27 35 Z" fill="#57a9e8" />
      <path d="M70 28 q17 0 16 9 q-10 4 -20 -1 Z" fill="#57a9e8" />
      <circle cx={50} cy={13} r={3.5} fill="#2d6da8" />
    </>
  ),
  bow: (
    <>
      <path d="M66 18 L53 10 L55 26 Z" fill="#e2618f" />
      <path d="M66 18 L79 10 L77 26 Z" fill="#e2618f" />
      <circle cx={66} cy={18} r={4.5} fill="#c14b76" />
    </>
  ),
  glasses: (
    <>
      <circle cx={36} cy={52} r={10.5} fill="none" stroke={INK} strokeWidth={3.5} />
      <circle cx={64} cy={52} r={10.5} fill="none" stroke={INK} strokeWidth={3.5} />
      <path d="M46.5 52 h7" stroke={INK} strokeWidth={3.5} />
      <path d="M25.5 50 l-7 -3 M74.5 50 l7 -3" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
    </>
  ),
};

const EARNED_LAYERS: Record<EarnedItem, React.ReactNode> = {
  crown: (
    <>
      <path
        d="M33 27 L36 10 L44 20 L50 5 L56 20 L64 10 L67 27 Z"
        fill="#ffd166"
        stroke="#e8b437"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx={36} cy={9} r={2.5} fill="#e8b437" />
      <circle cx={50} cy={4} r={2.5} fill="#e8b437" />
      <circle cx={64} cy={9} r={2.5} fill="#e8b437" />
    </>
  ),
  balloon: (
    <>
      <path d="M84 26 Q76 38 71 47" fill="none" stroke={INK} strokeWidth={2} />
      <circle cx={85} cy={14} r={11} fill="#ff7bac" />
      <polygon points="85,25 82,29 88,29" fill="#e2618f" />
      <path
        d="M80 8 a10 10 0 0 1 6 -2"
        fill="none"
        stroke="#fff"
        strokeWidth={2.5}
        opacity={0.6}
        strokeLinecap="round"
      />
    </>
  ),
  pennant: (
    <>
      <path d="M79 46 L79 8" stroke="#9a7b52" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M79 9 L99 15 L79 23 Z" fill="#57c785" />
    </>
  ),
  glow: (
    <>
      <circle cx={50} cy={58} r={40} fill="none" stroke="#ffd166" strokeWidth={4} opacity={0.9} />
      <Star x={13} y={20} fill="#ffd166" />
      <Star x={88} y={88} fill="#ffd166" />
    </>
  ),
};

export function QueueAvatar({
  avatar,
  earned = [],
  title,
  className,
}: {
  avatar: Avatar;
  earned?: EarnedItem[];
  title?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {/* glow sits behind the face */}
      {earned.includes("glow") ? EARNED_LAYERS.glow : null}
      <circle cx={50} cy={58} r={36} fill={avatar.color} />
      <circle cx={31} cy={67} r={5} fill="#fff" opacity={0.35} />
      <circle cx={69} cy={67} r={5} fill="#fff" opacity={0.35} />
      {EXPRESSION_LAYERS[avatar.expression]}
      {ACCESSORY_LAYERS[avatar.accessory]}
      {earned.filter((e) => e !== "glow").map((e) => (
        <g key={e}>{EARNED_LAYERS[e]}</g>
      ))}
    </svg>
  );
}
