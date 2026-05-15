import { NextRequest, NextResponse } from 'next/server';
import { searchCompanies, addToWatchlist } from '@/lib/stockbit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, watchlistId } = body;

    if (!ticker) {
      return NextResponse.json(
        { success: false, error: 'ticker is required' },
        { status: 400 }
      );
    }

    // Search for the company to get companyId
    const searchResults = await searchCompanies(ticker);
    
    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Find exact match or first result
    const exactMatch = searchResults.find(
      (r) => r.name.toUpperCase() === ticker.toUpperCase()
    );
    const company = exactMatch || searchResults[0];

    // If watchlistId is not provided, try to get the default
    let targetWatchlistId = watchlistId;
    if (!targetWatchlistId) {
      // Import here to avoid circular dependency issues
      const { fetchWatchlistGroups } = await import('@/lib/stockbit');
      const groups = await fetchWatchlistGroups();
      if (groups && groups.length > 0) {
        targetWatchlistId = groups[0].id;
      }
    }

    if (!targetWatchlistId) {
      return NextResponse.json(
        { success: false, error: 'No watchlist found. Please create a watchlist first.' },
        { status: 400 }
      );
    }

    // Add to watchlist
    await addToWatchlist(Number(targetWatchlistId), Number(company.id));

    return NextResponse.json({
      success: true,
      message: `${company.name} added to watchlist successfully`,
      company: {
        id: company.id,
        name: company.name,
        desc: company.desc
      }
    });
  } catch (error) {
    console.error('Add to Watchlist by Ticker API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
