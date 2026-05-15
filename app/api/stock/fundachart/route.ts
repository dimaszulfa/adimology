import { NextRequest, NextResponse } from 'next/server';
import { fetchFundaChart, searchCompanies, FUNDA_CHART_ITEMS } from '@/lib/stockbit';

/**
 * GET /api/stock/fundachart
 * Fetch funda chart data (Price AND Number of Shareholders) from Stockbit API
 * Uses comma-separated item IDs: 2661 (Price), 21334 (Number of Shareholders)
 *
 * Query params:
 * - ticker: Stock ticker symbol (e.g., "ENZO") - REQUIRED
 * - timeframe: Time period - 1w, 1m, 3m, 6m, 1y, 2y, 5y (default: "1y")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const timeframe = searchParams.get('timeframe') || '1y';

    if (!ticker) {
      return NextResponse.json(
        { error: 'Missing required parameter: ticker' },
        { status: 400 }
      );
    }

    // Search for the company to verify it exists
    const searchResults = await searchCompanies(ticker);
    
    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json(
        { error: `Company not found: ${ticker}` },
        { status: 404 }
      );
    }

    // Find exact match or use first result
    const exactMatch = searchResults.find(
      (r) => r.symbol?.toUpperCase() === ticker.toUpperCase() ||
            r.symbol_2?.toUpperCase() === ticker.toUpperCase() ||
            r.symbol_3?.toUpperCase() === ticker.toUpperCase()
    );
    const company = exactMatch || searchResults[0];

    // Use comma-separated item IDs: 2661 (Price), 21334 (Number of Shareholders)
    const itemIds = `${FUNDA_CHART_ITEMS.PRICE},${FUNDA_CHART_ITEMS.NUMBER_OF_SHAREHOLDERS}`;
    
    const { shareholders, prices } = await fetchFundaChart(itemIds, ticker, timeframe);

    return NextResponse.json({
      success: true,
      ticker,
      companyName: company.name,
      timeframe,
      shareholders,
      prices,
    });
  } catch (error: any) {
    console.error('Funda chart API error:', error);
    
    if (error.message?.includes('Token has expired') || error.message?.includes('401')) {
      return NextResponse.json(
        { error: 'Stockbit token expired. Please update your token.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch funda chart data' },
      { status: 500 }
    );
  }
}
