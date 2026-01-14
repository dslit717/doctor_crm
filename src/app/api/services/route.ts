import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 서비스 데이터 변환 헬퍼 함수
function transformServiceData(data: any[] | null) {
  return data?.map((item: any) => ({
    ...item,
    price: item.selling_price || item.base_price || 0,
    custom_data: item.extended_data || {}
  })) || []
}

// extended_data 컬럼이 없을 때 재시도하는 헬퍼 함수 (insert용)
async function handleInsertWithExtendedData(supabase: any, insertData: any) {
  let result = await supabase.from('services').insert(insertData).select().single()
  
  if (result.error && result.error.message?.includes('extended_data')) {
    const retryData = { ...insertData }
    delete retryData.extended_data
    result = await supabase.from('services').insert(retryData).select().single()
  }
  
  return result
}

// extended_data 컬럼이 없을 때 재시도하는 헬퍼 함수 (update용)
async function handleUpdateWithExtendedData(supabase: any, updateData: any, id: string) {
  let result = await supabase.from('services').update(updateData).eq('id', id).select().single()
  
  if (result.error && result.error.message?.includes('extended_data')) {
    const retryData = { ...updateData }
    delete retryData.extended_data
    result = await supabase.from('services').update(retryData).eq('id', id).select().single()
  }
  
  return result
}

// 서비스 목록 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')
    const search = searchParams.get('search')

    let query = supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,service_code.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    // 응답 데이터를 프론트엔드 형식에 맞게 변환
    const transformedData = transformServiceData(data)

    return NextResponse.json({ success: true, data: transformedData })
  } catch (error) {
    console.error('서비스 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '서비스 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 서비스 등록
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    
    const { custom_data, price, ...restData } = body
    
    // 실제 DB 스키마에 맞게 필드 매핑
    const insertData: any = {
      service_code: restData.service_code,
      name: restData.name,
      category: restData.category,
      selling_price: price || restData.selling_price || null,
      tax_type: restData.tax_type,
      duration_minutes: restData.duration_minutes,
      description: restData.description || null,
      is_active: restData.is_active ?? true,
      sort_order: restData.sort_order || 0,
    }
    
    // extended_data에 커스텀 필드 저장
    if (custom_data && Object.keys(custom_data).length > 0) {
      insertData.extended_data = custom_data
    }

    const result = await handleInsertWithExtendedData(supabase, insertData)

    if (result.error) throw result.error

    return NextResponse.json({ 
      success: true, 
      data: transformServiceData([result.data])[0]
    })
  } catch (error: any) {
    console.error('서비스 등록 오류:', error)
    return NextResponse.json(
      { success: false, error: error.message || '서비스 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 서비스 수정
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { id, custom_data, price, ...restData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 실제 DB 스키마에 맞게 필드 매핑
    const updateData: any = {
      service_code: restData.service_code,
      name: restData.name,
      category: restData.category,
      selling_price: price !== undefined ? price : restData.selling_price,
      tax_type: restData.tax_type,
      duration_minutes: restData.duration_minutes,
      description: restData.description,
      is_active: restData.is_active,
      sort_order: restData.sort_order,
      updated_at: new Date().toISOString()
    }
    
    if (custom_data && Object.keys(custom_data).length > 0) {
      updateData.extended_data = custom_data
    }

    const result = await handleUpdateWithExtendedData(supabase, updateData, id)

    if (result.error) throw result.error

    return NextResponse.json({ 
      success: true, 
      data: transformServiceData([result.data])[0]
    })
  } catch (error: any) {
    console.error('서비스 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: error.message || '서비스 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 서비스 삭제 (비활성화)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('services')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('서비스 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '서비스 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}


