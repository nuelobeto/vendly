import { cn } from "@/lib/utils"

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-7 text-primary", className)}
    >
      <rect width="24" height="24" rx="7" fill="currentColor" />
      <path
        d="M7 8l5 9 5-9"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-heading text-lg font-semibold tracking-tight">
        Vendly
      </span>
    </span>
  )
}

export { Logo, LogoMark }
