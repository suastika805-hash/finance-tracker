import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id wajib diisi' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('wishlist')
    .select('*, categories(*)')
    .eq('user_id', userId)
    .order('status', { ascending: false }) // 'pending' > 'purchased' in alphabetical order
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, price, category_id, note, user_id } = body

  if (!name || !price || !user_id) {
    return NextResponse.json({ error: 'Field name, price, dan user_id wajib diisi' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('wishlist')
    .insert([{
      name,
      price,
      category_id: category_id || null,
      note: note || null,
      user_id,
      status: 'pending'
    }])
    .select('*, categories(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
