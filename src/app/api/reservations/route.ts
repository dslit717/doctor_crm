import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const searchParams = req.nextUrl.searchParams;
    const all = searchParams.get('all');
    const date = searchParams.get('date');
    const patientId = searchParams.get('patient_id');

    // 특정 환자의 예약 내역
    if (patientId) {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }

    // 전체 데이터 요청
    if (all === 'true') {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }

    // 특정 날짜 데이터 요청
    if (!date) {
      return NextResponse.json({ success: false, error: 'Date parameter is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body = await req.json();

    const { data, error } = await supabase
      .from('reservations')
      .insert([
        {
          date: body.date,
          time: body.time,
          patient_id: body.patient_id || null,
          patient_name: body.patient_name,
          age: body.age || 0,
          gender: body.gender || '여',
          phone: body.phone,
          treatment: body.treatment,
          category: body.category,
          memo: body.memo || null,
          chart_number: body.chart_number || null,
          status: body.status || 'scheduled',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // 기존 예약 정보 조회 (상태 변경 확인용)
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('status, patient_id, date')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('reservations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 상태가 'completed'로 변경되었고, 환자 ID가 있으면 환자 정보 업데이트
    const isNewlyCompleted = 
      existingReservation?.status !== 'completed' && 
      updateData.status === 'completed';
    
    const patientId = updateData.patient_id || existingReservation?.patient_id;

    if (isNewlyCompleted && patientId) {
      // 환자의 visit_count 증가 및 last_visit_date 업데이트
      const { data: patient } = await supabase
        .from('patients')
        .select('visit_count')
        .eq('id', patientId)
        .single();

      const newVisitCount = (patient?.visit_count || 0) + 1;
      const visitDate = data.date || existingReservation?.date;

      await supabase
        .from('patients')
        .update({
          visit_count: newVisitCount,
          last_visit_date: visitDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patientId);

      console.log(`[환자 정보 업데이트] patient_id: ${patientId}, visit_count: ${newVisitCount}, last_visit_date: ${visitDate}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('reservations').delete().eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
