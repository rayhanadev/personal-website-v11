import { cn } from "@/lib/utils";

// Deel's "d." lettermark knocked out of a rounded box, so the whole badge is a
// single currentColor shape. The transform maps the lettermark's own bounds
// (53.49,51.48 → 206.2,190.84) into a centred 64×64 box.
export default function DeelLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden
      className={cn("size-[13px] transition-colors duration-150 ease-out", className)}
    >
      <mask id="deel-lettermark">
        <rect width="64" height="64" rx="14" fill="#fff" />
        <g fill="#000" transform="translate(5.14 6.96) scale(0.2067)">
          <path d="M53.4941 136.168C53.4941 98.316 77.6565 81.4955 104.151 81.4955C128.332 81.4955 138.529 96.8594 138.529 96.8594V51.4778H164.719V163.316C164.719 172.497 165.035 180.78 165.675 188.167H138.537V175.615C138.537 175.615 128.146 190.84 104.16 190.84C78.5889 190.84 53.4941 176.167 53.4941 136.168ZM110.84 170.745C129.389 170.745 141.381 156.627 141.381 136.168C141.381 114.993 129.381 101.591 110.84 101.591C92.3003 101.591 80.7428 114.331 80.7428 136.168C80.7428 158.004 92.7871 170.745 110.84 170.745Z" />
          <path d="M180.975 163.616H206.203V188.08H180.975V163.616Z" />
        </g>
      </mask>
      <rect width="64" height="64" rx="14" mask="url(#deel-lettermark)" />
    </svg>
  );
}
