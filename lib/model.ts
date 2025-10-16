import fs from "node:fs/promises"
import path from "node:path"

export type ChurnModel = {
  model_type: "logistic_regression"
  target: "Churn"
  positive_label: "Yes"
  numeric_cols: string[]
  categorical_cols: Record<string, string[]>
  feature_names: string[]
  coef: number[]
  intercept: number
}

export async function loadChurnModel(): Promise<ChurnModel> {
  const modelPath = path.join(process.cwd(), "public", "models", "churn-model.json")
  const buf = await fs.readFile(modelPath, "utf-8")
  return JSON.parse(buf)
}

export function buildFeatureVector(input: Record<string, any>, model: ChurnModel): number[] {
  const vec: number[] = new Array(model.feature_names.length).fill(0)

  // Numeric first
  let idx = 0
  for (const col of model.numeric_cols) {
    const valRaw = input[col]
    const val =
      typeof valRaw === "number"
        ? valRaw
        : valRaw === null || valRaw === undefined || valRaw === ""
          ? 0
          : Number(valRaw)
    vec[idx] = isNaN(val) ? 0 : val
    idx++
  }

  // Categorical one-hot, in the same order as saved
  for (const [col, cats] of Object.entries(model.categorical_cols)) {
    const val = `${input[col] ?? ""}`.trim()
    for (const cat of cats) {
      vec[idx] = val === cat ? 1 : 0
      idx++
    }
  }

  return vec
}

export function sigmoid(x: number): number {
  if (x > 20) return 1
  if (x < -20) return 0
  return 1 / (1 + Math.exp(-x))
}

export function predictProbability(features: number[], model: ChurnModel): number {
  // dot product
  let s = model.intercept
  for (let i = 0; i < features.length; i++) {
    s += features[i] * model.coef[i]
  }
  return sigmoid(s)
}
