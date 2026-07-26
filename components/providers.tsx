"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MotionConfig } from "motion/react"
import { ThemeProvider } from "./theme-provider"

export default function Providers({ children }: { children: React.ReactNode }) {
  // Lazy init so the cache survives re-renders instead of being rebuilt.
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
