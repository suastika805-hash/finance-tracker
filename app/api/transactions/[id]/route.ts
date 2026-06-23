import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PUT: Update transaksi
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { type, amount, category_id, note, date } = body

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .update({ type, amount, category_id, note, date })
    .eq('id', params.id)
    .select('*, categories(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: Hapus transaksi
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin
    .from('transactions')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Transaksi berhasil dihapus' })
}
