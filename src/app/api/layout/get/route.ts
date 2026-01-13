import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { DEFAULT_LAYOUT, DEFAULT_COLUMNS } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const employeeId = req.nextUrl.searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'employeeId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    
    // 직접 쿼리로 최신 데이터 강제 조회
    const { data: rows, error } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('employee_id', employeeId)
      .order('updated_at', { ascending: false });
    
    const data = rows && rows.length > 0 ? rows[0] : null;

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const responseData = {
      layout: data?.layout_json || DEFAULT_LAYOUT,
      columns: data?.columns || DEFAULT_COLUMNS
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData
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
    console.error('레이아웃 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch layout' },
      { status: 500 }
    );
  }
}

