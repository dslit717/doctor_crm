import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userId, layout, columns } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('layouts')
      .select('id')
      .eq('user_id', userId)
      .single();

    const updateData = {
      layout_json: layout,
      ...(columns !== undefined && { columns })
    };

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('layouts')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const insertData = {
        user_id: userId,
        layout_json: layout,
        ...(columns !== undefined && { columns })
      };
      
      const { data, error } = await supabase
        .from('layouts')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('레이아웃 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save layout' },
      { status: 500 }
    );
  }
}

