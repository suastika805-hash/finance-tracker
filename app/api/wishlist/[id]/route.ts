import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// DELETE: Hapus target pembelian
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin
    .from('wishlist')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Target pembelian berhasil dihapus' })
}

// PUT: Update target pembelian (atau ACC)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { name, price, category_id, note, status } = body

  // 1. Ambil detail item wishlist lama
  const { data: item, error: fetchError } = await supabaseAdmin
    .from('wishlist')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchError || !item) {
    return NextResponse.json({ error: fetchError?.message || 'Target tidak ditemukan' }, { status: 404 })
  }

  // 2. Siapkan data update
  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (price !== undefined) updateData.price = price
  if (category_id !== undefined) updateData.category_id = category_id || null
  if (note !== undefined) updateData.note = note || null
  if (status !== undefined) updateData.status = status

  // 3. Update data wishlist
  const { error: updateError } = await supabaseAdmin
    .from('wishlist')
    .update(updateData)
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // 4. Jika status berubah dari pending ke purchased, buat transaksi pengeluaran baru
  if (item.status !== 'purchased' && status === 'purchased') {
    const finalName = name || item.name
    const finalPrice = price || item.price
    const finalCategoryId = category_id !== undefined ? category_id : item.category_id

    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert([{
        user_id: item.user_id,
        type: 'pengeluaran',
        amount: finalPrice,
        category_id: finalCategoryId,
        note: `Beli target: ${finalName}`,
        date: new Date().toISOString().split('T')[0]
      }])

    if (txError) {
      // Rollback status ke pending jika gagal insert transaksi
      await supabaseAdmin
        .from('wishlist')
        .update({ status: 'pending' })
        .eq('id', params.id)

      return NextResponse.json({ error: `Gagal membuat transaksi: ${txError.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ message: 'Target pembelian berhasil diperbarui' })
}
