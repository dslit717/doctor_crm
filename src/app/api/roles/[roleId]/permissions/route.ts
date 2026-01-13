import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 역할의 권한 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params

    // 역할-권한 매핑 조회
    const { data: rolePermissions, error } = await supabase
      .from('role_permissions')
      .select('id, permission_id, data_scope')
      .eq('role_id', roleId)

    if (error) throw error

    // 권한 상세 정보 조회
    const permissionIds = rolePermissions?.map(rp => rp.permission_id) || []
    const { data: permissions } = await supabase
      .from('permissions')
      .select('*')
      .in('id', permissionIds)

    // 권한 맵 생성
    const permissionMap = new Map(permissions?.map(p => [p.id, p]) || [])

    return NextResponse.json({
      success: true,
      data: rolePermissions?.map(rp => {
        const permission = permissionMap.get(rp.permission_id)
        return {
          ...permission,
          data_scope: rp.data_scope,
          role_permission_id: rp.id,
        }
      }).filter(Boolean) || [],
    })

  } catch (error) {
    console.error('Role permissions fetch error:', error)
    return NextResponse.json(
      { success: false, error: '역할 권한 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 역할에 권한 할당
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params
    const body = await request.json()
    const { permissionId, dataScope = 'own' } = body

    // 중복 확인
    const { data: existing } = await supabase
      .from('role_permissions')
      .select('id')
      .eq('role_id', roleId)
      .eq('permission_id', permissionId)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 할당된 권한입니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('role_permissions')
      .insert({
        role_id: roleId,
        permission_id: permissionId,
        data_scope: dataScope,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Role permission assignment error:', error)
    return NextResponse.json(
      { success: false, error: '권한 할당 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 역할 권한 일괄 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params
    const body = await request.json()
    const { permissions } = body // [{ permissionId, dataScope }]

    // 기존 권한 삭제
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)

    // 새 권한 삽입
    if (permissions && permissions.length > 0) {
      const { error } = await supabase
        .from('role_permissions')
        .insert(
          permissions.map((p: { permissionId: string; dataScope: string }) => ({
            role_id: roleId,
            permission_id: p.permissionId,
            data_scope: p.dataScope || 'own',
          }))
        )

      if (error) throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Role permissions update error:', error)
    return NextResponse.json(
      { success: false, error: '권한 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 역할에서 권한 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params
    const { searchParams } = new URL(request.url)
    const permissionId = searchParams.get('permissionId')

    if (!permissionId) {
      return NextResponse.json(
        { success: false, error: '권한 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Role permission removal error:', error)
    return NextResponse.json(
      { success: false, error: '권한 제거 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

