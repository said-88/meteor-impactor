import { NextRequest, NextResponse } from 'next/server';

const NASA_API_BASE = "https://api.nasa.gov/neo/rest/v1";
const API_KEY = process.env.NEXT_PUBLIC_NASA_API_KEY || "DEMO_KEY";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    console.log(`🌌 NASA API Proxy Request: ${endpoint}`);

    if (!endpoint) {
      console.error('❌ Missing endpoint parameter');
      return NextResponse.json({ error: 'Endpoint parameter required' }, { status: 400 });
    }

    let url: string;

    switch (endpoint) {
      case 'feed':
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        if (!startDate || !endDate) {
          console.error('❌ Missing start_date or end_date for feed');
          return NextResponse.json({ error: 'start_date and end_date required for feed' }, { status: 400 });
        }
        url = `${NASA_API_BASE}/feed?start_date=${startDate}&end_date=${endDate}&api_key=${API_KEY}`;
        break;

      case 'neo':
        const asteroidId = searchParams.get('id');
        if (!asteroidId) {
          console.error('❌ Missing id parameter for neo lookup');
          return NextResponse.json({ error: 'id parameter required for neo lookup' }, { status: 400 });
        }
        url = `${NASA_API_BASE}/neo/${asteroidId}?api_key=${API_KEY}`;
        break;

      case 'browse':
        const page = searchParams.get('page') || '0';
        const size = searchParams.get('size') || '20';
        url = `${NASA_API_BASE}/neo/browse?page=${page}&size=${size}&api_key=${API_KEY}`;
        break;

      default:
        console.error(`❌ Invalid endpoint: ${endpoint}`);
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    console.log(`🔗 Proxying to: ${url.replace(API_KEY, '[API_KEY]')}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Meteor-Impact-Simulator/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ NASA API error: ${response.status} ${response.statusText} - ${errorText}`);
      return NextResponse.json(
        { error: `NASA API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ NASA API response successful for ${endpoint}`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ NASA API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}