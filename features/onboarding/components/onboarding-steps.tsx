import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const STEPS = [
  { key: "profile", label: "Your details" },
  { key: "store", label: "Your store" },
] as const

type StepKey = (typeof STEPS)[number]["key"] | "done"

function OnboardingSteps({ current }: { current: StepKey }) {
  // "done" sits past the last step, so every step renders as complete.
  const currentIndex =
    current === "done"
      ? STEPS.length
      : STEPS.findIndex((step) => step.key === current)

  return (
    <ol className="flex items-center justify-center gap-3">
      {STEPS.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex

        return (
          <li key={step.key} className="flex items-center gap-3">
            <span
              className={cn(
                "flex items-center gap-2 text-sm",
                active ? "font-medium text-foreground" : "text-muted-foreground"
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full font-mono text-xs",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <CheckIcon className="size-3.5" /> : index + 1}
              </span>
              {step.label}
            </span>

            {index < STEPS.length - 1 ? (
              <span aria-hidden="true" className="h-px w-8 bg-border" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

export { OnboardingSteps }
