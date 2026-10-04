import { NextRequest, NextResponse } from 'next/server';
import { runAllEvaluationScenarios, EVALUATION_SCENARIOS } from '@/lib/evaluation-scenarios';

export async function GET() {
  // Returns scenario definitions and metadata
  const list = EVALUATION_SCENARIOS.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
  }));
  return NextResponse.json({ success: true, count: list.length, scenarios: list });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const scenarioId = body.scenario_id;

    if (scenarioId) {
      const scenario = EVALUATION_SCENARIOS.find((s) => s.id === Number(scenarioId));
      if (!scenario) {
        return NextResponse.json({ error: `Scenario ${scenarioId} not found` }, { status: 404 });
      }
      const singleResult = await scenario.run();
      return NextResponse.json({ success: true, result: singleResult });
    }

    // Run entire suite of 20 scenarios
    const summary = await runAllEvaluationScenarios();
    return NextResponse.json({ success: true, summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Evaluation run failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
