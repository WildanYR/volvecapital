import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const params = await context.params;
    // Request original URL from backend API
    const response = await api.get(`/public/short-url/${params.code}`);
    const targetUrl = response.data.target_url;

    if (!targetUrl) {
      throw new Error('Target URL not found');
    }

    return NextResponse.redirect(targetUrl);
  } catch (error) {
    return NextResponse.redirect(new URL('/?error=invalid_link', request.url));
  }
}
