"use client"

import { useState } from "react"
import ChurnForm, { type ChurnResult } from "@/components/churn-form"
import InteractiveBackground from "@/components/interactive-background"
import { ResultPanel } from "@/components/result-panel"

export default function ChurnConsole() {
  const [result, setResult] = useState<ChurnResult | null>(null)

  return (
    <section className="relative">
      <InteractiveBackground />
      <div className="rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur md:p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <ChurnForm onResult={setResult} />
          </div>
          <div className="md:sticky md:top-6">
            <ResultPanel result={result} variant="compact" />
          </div>
        </div>
      </div>
    </section>
  )
}
