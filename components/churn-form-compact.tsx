"use client"

import type React from "react"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ModelField = {
  name: string
  type: "string" | "number"
  categories?: string[] // if categorical
}

type ModelMeta = {
  fields: ModelField[]
}

type Prediction = { probability: number; label: string }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Fallback schema (from your provided dataset) if /api/model isn't ready
const FALLBACK_FIELDS: ModelField[] = [
  { name: "gender", type: "string" },
  { name: "SeniorCitizen", type: "number" },
  { name: "Partner", type: "string" },
  { name: "Dependents", type: "string" },
  { name: "tenure", type: "number" },
  { name: "PhoneService", type: "string" },
  { name: "MultipleLines", type: "string" },
  { name: "InternetService", type: "string" },
  { name: "OnlineSecurity", type: "string" },
  { name: "OnlineBackup", type: "string" },
  { name: "DeviceProtection", type: "string" },
  { name: "TechSupport", type: "string" },
  { name: "StreamingTV", type: "string" },
  { name: "StreamingMovies", type: "string" },
  { name: "Contract", type: "string" },
  { name: "PaperlessBilling", type: "string" },
  { name: "PaymentMethod", type: "string" },
  { name: "MonthlyCharges", type: "number" },
  // TotalCharges is string in raw data; models often coerce to number
  { name: "TotalCharges", type: "number" },
]

export function ChurnFormCompact({
  onResult,
}: {
  onResult?: (p: Prediction) => void
}) {
  const { data } = useSWR<ModelMeta>("/api/model", fetcher)
  const fields = data?.fields?.length ? data.fields : FALLBACK_FIELDS

  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: values }),
      })
      const json = await res.json()
      if (json && typeof json.probability === "number" && json.label) {
        onResult?.({ probability: json.probability, label: json.label })
      } else {
        onResult?.({ probability: 0, label: "No" })
      }
    } catch (err) {
      onResult?.({ probability: 0, label: "No" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 md:p-6 bg-card text-card-foreground">
      <form onSubmit={handleSubmit} className="grid gap-4">
        {fields.map((f) => {
          const v = values[f.name] ?? ""
          if (f.type === "number") {
            return (
              <div className="grid gap-2" key={f.name}>
                <label className="text-sm text-foreground" htmlFor={f.name}>
                  {f.name}
                </label>
                <Input
                  id={f.name}
                  inputMode="decimal"
                  type="number"
                  value={v}
                  onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                  className="bg-background"
                />
              </div>
            )
          }

          // string type
          if (f.categories && f.categories.length) {
            return (
              <div className="grid gap-2" key={f.name}>
                <label className="text-sm text-foreground">{f.name}</label>
                <Select value={v} onValueChange={(val) => setValues((s) => ({ ...s, [f.name]: val }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {f.categories.map((c) => (
                      <SelectItem value={c} key={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          }

          return (
            <div className="grid gap-2" key={f.name}>
              <label className="text-sm text-foreground" htmlFor={f.name}>
                {f.name}
              </label>
              <Input
                id={f.name}
                value={v}
                onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                className="bg-background"
              />
            </div>
          )
        })}

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Predicting..." : "Predict"}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default ChurnFormCompact
