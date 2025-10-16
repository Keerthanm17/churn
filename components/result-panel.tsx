"use client"
import { cn } from "@/lib/utils"

export type ResultData = {
  probability?: number
  label?: string
}

export function ResultPanel({
  result,
  className,
  variant = "compact",
}: {
  result: ResultData | null
  className?: string
  variant?: "compact" | "default"
}) {
  const pct = typeof result?.probability === "number" ? Math.round(result!.probability * 100) : null
  const isChurn = (result?.label || "").toLowerCase() === "yes"

  if (variant === "compact") {
    // Compact: tiny, single-line box. Keeps UI concise beside the form.
    return (
      <div
        className={cn(
          "rounded-lg border bg-card/80 p-3 text-card-foreground max-w-xs",
          "shadow-sm backdrop-blur",
          className,
        )}
      >
        {!result ? (
          <div className="text-xs text-muted-foreground">No prediction yet.</div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-medium leading-5",
                isChurn ? "bg-destructive text-destructive-foreground" : "bg-primary/15 text-primary",
              )}
            >
              {isChurn ? "Churn: Yes" : "Churn: No"}
            </span>
            <span className="text-sm font-semibold">{pct !== null ? `${pct}%` : "—"}</span>
          </div>
        )}
      </div>
    )
  }

  // Default: the previous larger card presentation
  if (!result) {
    return (
      <div
        className={cn(
          "rounded-lg border bg-card p-6 text-card-foreground flex h-full items-center justify-center",
          className,
        )}
      >
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Prediction</p>
          <p className="mt-1 text-balance text-base">Fill the form to see the churn prediction here.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 text-card-foreground flex h-full flex-col justify-between gap-4",
        className,
      )}
    >
      <div>
        <p className="text-sm text-muted-foreground">Prediction</p>
        <h3 className="text-pretty mt-2 font-sans font-extrabold leading-tight text-2xl md:text-3xl">
          {isChurn ? "Likely to Churn" : "Unlikely to Churn"}
        </h3>
        <p className="text-muted-foreground mt-2 text-sm">Model’s estimated probability of churn:</p>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium",
            isChurn ? "bg-destructive text-destructive-foreground" : "bg-primary/15 text-primary",
          )}
        >
          {isChurn ? "Churn: Yes" : "Churn: No"}
        </div>
        <div className="text-right">
          <span className="font-sans text-5xl font-black tracking-tight md:text-6xl">
            {pct !== null ? `${pct}%` : "—"}
          </span>
        </div>
      </div>
    </div>
  )
}
