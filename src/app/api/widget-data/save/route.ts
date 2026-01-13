import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { employeeId, widgetId, data } = await req.json();

    if (!employeeId || !widgetId || !data) {
      return NextResponse.json(
        { success: false, error: 'employeeId, widgetId, and data are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data: result, error } = await supabase
      .from('widget_data')
      .upsert(
        { 
          employee_id: employeeId, 
          widget_id: widgetId, 
          data: data 
        },
        { onConflict: 'employee_id,widget_id' }
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

