import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const userId = searchParams.get('user_id')

  const { data: budgets, error } = await supabaseAdmin
    .from('budgets')
    .select('*, categories(*)')
    .eq('user_id', userId!)
    .eq('month', month!)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const [y, m] = month!.split('-')
  const lastDay = new Date(Number(y), Number(m), 0).getDate()

  const enriched = await Promise.all(
    budgets.map(async (b) => {
      const { data: txs } = await supabaseAdmin
        .from('transactions')
        .select('amount')
        .eq('user_id', userId!)
        .eq('category_id', b.category_id)
        .eq('type', 'pengeluaran')
        .gte('date', `${month}-01`)
        .lte('date', `${month}-${lastDay}`)

      const spent = txs?.reduce((s, t) => s + Number(t.amount), 0) || 0
      return { ...b, spent }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { category_id, limit_amount, month, user_id } = body

  const { data, error } = await supabaseAdmin
    .from('budgets')
    .upsert([{ category_id, limit_amount, month, user_id }], {
      onConflict: 'user_id,category_id,month'
    })
    .select('*, categories(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin.from('budgets').delete().eq('id', id!)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Budget dihapus' })
}
