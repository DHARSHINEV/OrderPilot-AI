import { NextRequest, NextResponse } from 'next/server';
import { orchestrateOrderProcessing } from '@/lib/agent/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sourceType, mode, apiKey, aiProvider } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Customer message is required and cannot be empty.' },
        { status: 400 }
      );
    }

    const result = await orchestrateOrderProcessing({
      rawMessage: message,
      sourceType: sourceType || 'paste',
      mode: mode || 'demo_deterministic',
      apiKey,
      aiProvider,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error during order processing';
    console.error('Order processing error:', err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
