import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

export async function GET() {
  try {
    const modelPath = path.join(process.cwd(), "public", "models", "churn-model.json")
    const buf = await fs.readFile(modelPath, "utf-8")
    const model = JSON.parse(buf)
    return NextResponse.json(model)
  } catch (err: any) {
    console.error("[v0] /api/model error:", err?.message)
    return NextResponse.json(
      {
        error:
          "Model file not found. Please run scripts/train_churn_model.py or add your pretrained model at public/models/churn-model.json.",
      },
      { status: 404 },
    )
  }
}
