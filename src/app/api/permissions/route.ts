import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 권한 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('permissions')
      .select('*')
      .order('category')
      .order('name')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    // 카테고리별 그룹화
    const groupedByCategory = (data || []).reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    }, {} as Record<string, typeof data>)

    return NextResponse.json({
      success: true,
      data,
      grouped: groupedByCategory,
    })

  } catch (error) {
    console.error('Permissions fetch error:', error)
    return NextResponse.json(
      { success: false, error: '권한 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 권한 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, category, description, canCreate, canRead, canUpdate, canDelete, canExport, canBulkEdit } = body

    // 중복 확인
    const { data: existing } = await supabase
      .from('permissions')
      .select('id')
      .eq('code', code)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 권한 코드입니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('permissions')
      .insert({
        name,
        code,
        category,
        description,
        can_create: canCreate ?? false,
        can_read: canRead ?? false,
        can_update: canUpdate ?? false,
        can_delete: canDelete ?? false,
        can_export: canExport ?? false,
        can_bulk_edit: canBulkEdit ?? false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Permission creation error:', error)
    return NextResponse.json(
      { success: false, error: '권한 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 권한 수정
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, canCreate, canRead, canUpdate, canDelete, canExport, canBulkEdit } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (canCreate !== undefined) updateData.can_create = canCreate
    if (canRead !== undefined) updateData.can_read = canRead
    if (canUpdate !== undefined) updateData.can_update = canUpdate
    if (canDelete !== undefined) updateData.can_delete = canDelete
    if (canExport !== undefined) updateData.can_export = canExport
    if (canBulkEdit !== undefined) updateData.can_bulk_edit = canBulkEdit

    const { data, error } = await supabase
      .from('permissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Permission update error:', error)
    return NextResponse.json(
      { success: false, error: '권한 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

