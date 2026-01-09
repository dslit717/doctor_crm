import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const widgetId = req.nextUrl.searchParams.get('widgetId');

    if (!userId || !widgetId) {
      return NextResponse.json(
        { success: false, error: 'userId and widgetId are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    
    const { data: rows, error } = await supabase
      .from('widget_data')
      .select('*')
      .eq('user_id', userId)
      .eq('widget_id', widgetId)
      .order('updated_at', { ascending: false });
    
    const data = rows && rows.length > 0 ? rows[0] : null;

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data: data?.data || null
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('위젯 데이터 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch widget data' },
      { status: 500 }
    );
  }
}

