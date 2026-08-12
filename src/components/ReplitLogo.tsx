import { cn } from "@/lib/utils";

export default function ReplitLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="2 0 20 24"
      fill="currentColor"
      aria-hidden
      className={cn("h-[13px] w-[10.8px] transition-colors duration-150 ease-out", className)}
    >
      <path d="M2 1.5A1.5 1.5 0 0 1 3.5 0h7A1.5 1.5 0 0 1 12 1.5V8H3.5A1.5 1.5 0 0 1 2 6.5ZM12 8h8.5A1.5 1.5 0 0 1 22 9.5v5a1.5 1.5 0 0 1-1.5 1.5H12ZM2 17.5A1.5 1.5 0 0 1 3.5 16H12v6.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 2 22.5Z" />
    </svg>
  );
}
