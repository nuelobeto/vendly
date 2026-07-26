import { cn } from "@/lib/utils"
import { scorePassword } from "@/features/auth/schemas"

const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const

const BAR_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-amber-500",
  "bg-amber-500",
  "bg-emerald-500",
] as const

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const score = scorePassword(password)

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index < score ? BAR_COLORS[score] : "bg-border"
            )}
          />
        ))}
      </div>
      <span
        aria-live="polite"
        className="w-16 text-right text-xs text-muted-foreground"
      >
        {LABELS[score]}
      </span>
    </div>
  )
}

export { PasswordStrength }
