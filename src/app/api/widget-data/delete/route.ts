import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const widgetId = req.nextUrl.searchParams.get('widgetId');

    if (!userId || !widgetId) {
      return NextResponse.json(
        { success: false, error: 'userId and widgetId are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('widget_data')
      .delete()
      .eq('user_id', userId)
      .eq('widget_id', widgetId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('위젯 데이터 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete widget data' },
      { status: 500 }
    );
  }
}

