"use client"

import type React from "react"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Model = {
  numeric_cols: string[]
  categorical_cols: Record<string, string[]>
}

export type ChurnResult = { probability: number; label: string }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ChurnForm({
  onResult,
}: {
  onResult?: (r: ChurnResult | null) => void
}) {
  const { data: model, error } = useSWR<Model | { error: string }>("/api/model", fetcher)
  const [submitting, setSubmitting] = useState(false)

  const isMissingModel = useMemo(() => {
    return !!model && (model as any).error
  }, [model])

  const [values, setValues] = useState<Record<string, any>>({})

  const handleChange = (name: string, val: any) => {
    setValues((prev) => ({ ...prev, [name]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    onResult?.(null)
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Prediction failed")
      onResult?.(data)
    } catch (err: any) {
      console.error("[v0] Predict error:", err?.message)
      alert(err?.message || "Prediction failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <p className="text-destructive">Failed to load model metadata. Please refresh.</p>
  }

  if (!model) {
    return <p>Loading model...</p>
  }

  if (isMissingModel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model not found</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Please run scripts/train_churn_model.py to generate public/models/churn-model.json, or add your pretrained
          model at that path.
        </CardContent>
      </Card>
    )
  }

  const numericCols = (model as Model).numeric_cols || []
  const categoricalCols = (model as Model).categorical_cols || {}

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-pretty">Customer Features</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          {/* Numeric fields */}
          {numericCols.map((name) => (
            <div key={name} className="grid gap-2">
              <Label htmlFor={name} className="capitalize">
                {name}
              </Label>
              <Input
                id={name}
                type="number"
                inputMode="decimal"
                placeholder={name}
                value={values[name] ?? ""}
                onChange={(e) => handleChange(name, e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          ))}

          {/* Categorical fields */}
          {Object.entries(categoricalCols).map(([name, options]) => (
            <div key={name} className="grid gap-2">
              <Label htmlFor={name} className="capitalize">
                {name}
              </Label>
              <select
                id={name}
                className="h-10 rounded-md border border-input bg-background px-3 text-foreground"
                value={values[name] ?? ""}
                onChange={(e) => handleChange(name, e.target.value)}
              >
                <option value="" disabled>
                  Select {name}
                </option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Predicting..." : "Predict Churn"}
        </Button>
      </div>
    </form>
  )
}
