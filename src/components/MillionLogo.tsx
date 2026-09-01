import { cn } from "@/lib/utils";

export default function MillionLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-13.819 -8.775 22.688 17.042"
      fill="currentColor"
      aria-hidden
      className={cn("h-[13px] w-[17.3px] transition-colors duration-150 ease-out", className)}
    >
      <polygon points="5.367 -1.323 -0.67 5.894 0.834 5.894 8.869 -1.323" />
      <polygon points="-13.819 0.765 -10.36 0.765 -5.804 -4.675 -5.804 -1.323 -3.356 -1.323 -3.356 -8.775 -5.804 -8.775" />
      <polygon points="5.345 -8.775 2.875 -8.775 -7.867 3.987 -7.867 0.739 -10.36 0.739 -10.36 8.267 -7.867 8.267 -1.679 0.791 2.875 -4.675 2.875 -1.323 5.345 -1.323" />
      <polygon points="-1.679 0.739 -1.679 8.267 0.834 8.267 8.869 -1.323 5.345 -1.323 0.834 3.961 0.834 0.739" />
    </svg>
  );
}
