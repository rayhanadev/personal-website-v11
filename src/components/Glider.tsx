import { cn } from "@/lib/utils";

export default function Glider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="357.5 359.5 1098.5 1099"
      fill="currentColor"
      aria-hidden
      className={cn("size-[13px]", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M723.58 1458.25H357.555V1092.02H723.58V1458.25ZM1089.6 725.795H1455.63V1458.25H1089.6V1092.02H723.58V359.568H1089.6V725.795Z"
      />
    </svg>
  );
}
