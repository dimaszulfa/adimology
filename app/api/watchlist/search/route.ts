import { NextRequest, NextResponse } from 'next/server';
import { searchCompanies } from '@/lib/stockbit';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  if (!keyword || keyword.trim().length < 1) {
    return NextResponse.json(
      { success: false, error: 'Keyword is required' },
      { status: 400 }
    );
  }

  try {
    const results = await searchCompanies(keyword.trim());
    
    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Search Companies API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
