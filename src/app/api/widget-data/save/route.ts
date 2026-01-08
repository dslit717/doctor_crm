import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userId, widgetId, data } = await req.json();

    if (!userId || !widgetId || !data) {
      return NextResponse.json(
        { success: false, error: 'userId, widgetId, and data are required' },
        { status: 400 }
      );
    }

    const { data: result, error } = await supabase
      .from('widget_data')
      .upsert(
        { 
          user_id: userId, 
          widget_id: widgetId, 
          data: data 
        },
        { onConflict: 'user_id,widget_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('위젯 데이터 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save widget data' },
      { status: 500 }
    );
  }
}

