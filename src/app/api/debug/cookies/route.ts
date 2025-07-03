import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Get all cookies
    const allCookies = cookieStore.getAll();
    
    // Filter for Supabase-related cookies
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('auth') ||
      cookie.name.includes('sb-')
    );
    
    return NextResponse.json({
      allCookiesCount: allCookies.length,
      supabaseCookies: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      requestHeaders: Object.fromEntries(request.headers.entries()),
    });
  } catch (error) {
    console.error("Debug cookies error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}