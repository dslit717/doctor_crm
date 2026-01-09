import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { userId, layout, columns } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from('layouts')
      .upsert(
        {
          user_id: userId,
          layout_json: layout,
          columns: columns,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('레이아웃 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save layout' },
      { status: 500 }
    );
  }
}
