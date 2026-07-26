"use client"

import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Both icons render and CSS picks the winner, so there is no `mounted` flag and
 * no hydration mismatch. The app also toggles theme with the bare `d` hotkey
 * (see components/theme-provider.tsx).
 */
function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon className="dark:hidden" />
      <MoonIcon className="hidden dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export { ThemeToggle }
