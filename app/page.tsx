import ChurnConsole from "@/components/churn-console"

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl p-6 md:p-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span>AI Model</span>
          <span className="h-1 w-1 rounded-full bg-primary" />
          <span>Churn Estimator</span>
        </div>
        <h1 className="text-pretty font-sans text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          <span className="underline decoration-primary/40 decoration-4 underline-offset-8">
            Customer Churn Prediction
          </span>
        </h1>
        <p className="mt-2 text-muted-foreground">Enter customer attributes to estimate churn probability.</p>
      </header>

      <ChurnConsole />

      <footer className="mt-10 text-xs text-muted-foreground">
        Model file expected at {"public/models/churn-model.json"}. Use the provided training script to generate it.
      </footer>
    </main>
  )
}
