import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const { data, error } = await supabase
      .from('widget_data')
      .select('*')
      .eq('user_id', userId)
      .eq('widget_id', widgetId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data?.data || null
    });
  } catch (error) {
    console.error('위젯 데이터 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch widget data' },
      { status: 500 }
    );
  }
}

