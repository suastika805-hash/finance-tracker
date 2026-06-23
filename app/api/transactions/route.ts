import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const type = searchParams.get('type')
  const search = searchParams.get('search')
  const userId = searchParams.get('user_id')

  let query = supabaseAdmin
    .from('transactions')
    .select('*, categories(*)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (userId) query = query.eq('user_id', userId)
  if (month) {
    const [y, m] = month.split('-')
    const lastDay = new Date(Number(y), Number(m), 0).getDate()
    query = query.gte('date', `${month}-01`).lte('date', `${month}-${lastDay}`)
  }
  if (type) query = query.eq('type', type)
  if (search) query = query.or(`note.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, amount, category_id, note, date, user_id, is_recurring, recurring_day } = body

  if (!type || !amount || !date) {
    return NextResponse.json({ error: 'Field type, amount, date wajib diisi' }, { status: 400 })
  }

  // Buat payload, masukkan is_recurring/recurring_day jika ada nilainya
  const payload: Record<string, unknown> = {
    type, amount,
    category_id: category_id || null,
    note: note || null,
    date, user_id,
  }
  if (is_recurring !== undefined) payload.is_recurring = is_recurring
  if (recurring_day !== undefined && is_recurring) payload.recurring_day = recurring_day

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert([payload])
    .select('*, categories(*)')
    .single()

  // Fallback: jika error schema cache (kolom belum ada), coba tanpa field opsional
  if (error && (error.message.includes('is_recurring') || error.message.includes('recurring_day') || error.message.includes('schema cache'))) {
    const { data: data2, error: error2 } = await supabaseAdmin
      .from('transactions')
      .insert([{ type, amount, category_id: category_id || null, note: note || null, date, user_id }])
      .select('*, categories(*)')
      .single()
    if (error2) return NextResponse.json({ error: error2.message }, { status: 500 })
    return NextResponse.json(data2, { status: 201 })
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
