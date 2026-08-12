import { cn } from "@/lib/utils";

// Hack Club's square app icon. The "h" is painted rather than knocked out so it can take
// its own colour on hover — black by default (matching the page behind it) and white when
// hovered, which is how the real icon reads.
export default function HackClubLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden
      className={cn("size-[13px] transition-colors duration-150 ease-out", className)}
    >
      <rect width="256" height="256" />
      <path
        d="M115.103 48.3682C115.103 47.1299 113.989 46.1892 112.769 46.3965L81.6652 51.6777C80.7036 51.8409 80 52.6741 80 53.6494V205.085C80 206.189 80.8954 207.085 82 207.085H113.103C114.208 207.085 115.103 206.189 115.103 205.085V148.397C115.103 131.127 124.261 120.429 131.892 120.429C138.76 120.429 140.744 127.307 140.744 137.699V205.085C140.744 206.189 141.639 207.085 142.744 207.085H174C175.105 207.085 176 206.189 176 205.085V132.656C176 109.12 167.148 93.9892 144.102 93.9892C134.852 93.9892 125.825 96.2163 118.633 101.146C117.205 102.125 115.103 101.161 115.103 99.4284V48.3682Z"
        className="fill-black transition-colors duration-150 ease-out group-hover:fill-white"
      />
    </svg>
  );
}
