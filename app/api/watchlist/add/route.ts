import { NextRequest, NextResponse } from 'next/server';
import { addToWatchlist } from '@/lib/stockbit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { watchlistId, companyId } = body;

    if (!watchlistId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'watchlistId and companyId are required' },
        { status: 400 }
      );
    }

    await addToWatchlist(Number(watchlistId), Number(companyId));
    
    return NextResponse.json({
      success: true,
      message: 'Company added to watchlist successfully',
    });
  } catch (error) {
    console.error('Add to Watchlist API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
