import { NextRequest, NextResponse } from 'next/server';

const GPT5 = { inputTokenCost: 1.25e-6, cachedInputTokenCost: 0.125e-6, outputTokenCost: 10e-6 }; // USD per token

// un GET para posible frontend de costos tipo admin dashboard 
// con lolo la bajamos por ahora pero doable despues, por eso lo comento

// export async function GET(request: NextRequest) {
//   return NextResponse.json({ GPT5 });
// }

export async function POST(request: NextRequest) {
  try {
    const { tokenUsage } = await request.json();

    if (!tokenUsage) {
      return NextResponse.json({ error: 'Token usage data is required' }, { status: 400 });
    }

    console.log('Full usage object:', tokenUsage);
    console.log('Available properties:', Object.keys(tokenUsage));

    const { inputTokens, outputTokens, totalTokens, reasoningTokens, cachedInputTokens } = tokenUsage;
    
    // Calculate cost based on token usage
    const inputCost = (inputTokens ? inputTokens * GPT5.inputTokenCost : 0);
    const outputCost = (outputTokens ? outputTokens * GPT5.outputTokenCost : 0);
    const cachedInputCost = (cachedInputTokens ? cachedInputTokens * GPT5.cachedInputTokenCost : 0);
    const totalCost = inputCost + outputCost + cachedInputCost;

    console.log('Input Cost:', inputCost);
    console.log('Output Cost:', outputCost);
    console.log('Cached Input Cost:', cachedInputCost);
    console.log('Total Cost:', totalCost);


    // devuelve un objeto con el costo total, un 
    // breakdown de los costos por tipo de token 
    // y el pricing mas raw de GPT5 bro
    
    // CAMBIAR ESTO AL CAMBIAR DE MODELO
    return NextResponse.json({
      cost: totalCost,
      breakdown: {
        inputTokens,
        outputTokens,
        cachedInputTokens,
        totalTokens,
        reasoningTokens,
        inputCost,
        outputCost,
        cachedInputCost,
        totalCost
      },
      pricing: GPT5
    });

  } catch (error) {
    console.error('Error in POST /api/price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate price' },
      { status: 500 }
    );
  }
}