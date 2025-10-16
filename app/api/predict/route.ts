import { type NextRequest, NextResponse } from "next/server"
import { buildFeatureVector, loadChurnModel, predictProbability } from "@/lib/model"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = body && typeof body === "object" && !Array.isArray(body) ? body : {}

    // Load model
    const model = await loadChurnModel()

    // Build features and predict
    const features = buildFeatureVector(input, model)
    const proba = predictProbability(features, model)
    const label = proba >= 0.5 ? model.positive_label : "No"

    return NextResponse.json({
      probability: proba,
      label,
    })
  } catch (err: any) {
    console.error("[v0] /api/predict error:", err?.message)
    return NextResponse.json(
      {
        error:
          "Prediction failed. Ensure public/models/churn-model.json exists. You can run scripts/train_churn_model.py or add your pretrained model.",
      },
      { status: 400 },
    )
  }
}
