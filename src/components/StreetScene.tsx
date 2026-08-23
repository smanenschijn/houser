function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-2.5" y="0" width="5" height="24" rx="2.5" fill="#7a4a21" />
      <circle cx="0" cy="-12" r="14" fill="#5db361" />
      <circle cx="-10" cy="-2" r="9" fill="#3a9a44" />
      <circle cx="10" cy="-2" r="9" fill="#57b25f" />
      <circle cx="0" cy="-20" r="5" fill="#8ecd8e" />
    </g>
  );
}

function House({
  x,
  y,
  s = 1,
  body,
  roof,
  door,
}: {
  x: number;
  y: number;
  s?: number;
  body: string;
  roof: string;
  door: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="18" y="-28" width="8" height="16" rx="2" fill={roof} />
      <path d="M -40 2 L 0 -36 L 40 2 Z" fill={roof} />
      <rect x="-32" y="2" width="64" height="46" rx="6" fill={body} />
      <rect x="-10" y="22" width="20" height="26" rx="5" fill={door} />
      <circle cx="-18" cy="16" r="5" fill="#ffffff" opacity="0.95" />
      <circle cx="18" cy="16" r="5" fill="#ffffff" opacity="0.95" />
      <rect x="-34" y="-2" width="68" height="6" rx="3" fill={roof} opacity="0.35" />
    </g>
  );
}

export default function StreetScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 200"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* sun */}
      <circle cx="64" cy="48" r="26" fill="#ffd166" />
      <g fill="#ffedb0">
        <circle cx="64" cy="48" r="36" opacity="0.4" />
      </g>

      {/* clouds */}
      <g fill="#ffffff">
        <circle cx="150" cy="42" r="10" />
        <circle cx="165" cy="34" r="12" />
        <circle cx="180" cy="42" r="10" />
        <circle cx="380" cy="60" r="9" />
        <circle cx="394" cy="52" r="11" />
        <circle cx="408" cy="60" r="9" />
      </g>

      {/* ground */}
      <path
        d="M0 150 Q 120 130 240 148 T 480 142 L480 200 L0 200 Z"
        fill="#ddf0d9"
      />
      <path
        d="M0 170 Q 140 152 260 168 T 480 162 L480 200 L0 200 Z"
        fill="#bce2b8"
      />

      {/* houses + trees */}
      <House x={118} y={150} s={1} body="#ffc9b1" roof="#f4612c" door="#7a2d18" />
      <Tree x={205} y={150} s={1.05} />
      <House x={252} y={152} s={0.95} body="#ffe9ae" roof="#f4b942" door="#7a2d18" />
      <Tree x={330} y={152} s={0.9} />
      <House x={372} y={150} s={1} body="#c2e7ff" roof="#38a7d6" door="#1c4122" />

      {/* foreground path */}
      <path
        d="M0 186 Q 160 176 300 186 T 480 182 L480 200 L0 200 Z"
        fill="#f3e7cd"
      />
    </svg>
  );
}
