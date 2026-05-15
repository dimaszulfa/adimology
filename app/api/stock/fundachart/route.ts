import { NextRequest, NextResponse } from 'next/server';
import { fetchFundaChart, searchCompanies } from '@/lib/stockbit';

/**
 * GET /api/stock/fundachart
 * Fetch funda chart data (Number of Shareholders) from Stockbit API
 *
 * Query params:
 * - ticker: Stock ticker symbol (e.g., "ENZO") - REQUIRED
 * - timeframe: Time period - 1w, 1m, 3m, 6m, 1y, 2y, 5y (default: "1y")
 *
 * Note: The item ID is fetched automatically by searching the company first
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

    // Search for the company to get the item ID
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
    const itemId = company.id;

    const data = await fetchFundaChart(itemId, ticker, timeframe);

    return NextResponse.json({
      success: true,
      ticker,
      companyName: company.name,
      itemId,
      timeframe,
      data,
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
