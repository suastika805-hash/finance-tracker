'use client'
import { Transaction } from '@/lib/types'
import { formatRupiah, formatDate, getMonthLabel } from '@/lib/utils'

interface Props { transactions: Transaction[]; month: string }

export default function ExportButton({ transactions, month }: Props) {
  const exportCSV = () => {
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Catatan']
    const rows = transactions.map(t => [
      t.date,
      t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
      t.categories?.name || 'Tanpa Kategori',
      t.amount,
      t.note || ''
    ])
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CatatUang_${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('CatatUang - Laporan Keuangan', 14, 20)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Periode: ${getMonthLabel(month)}`, 14, 30)

    const totalMasuk = transactions.filter(t => t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0)
    const totalKeluar = transactions.filter(t => t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0)

    doc.setFontSize(10)
    doc.text(`Total Pemasukan : ${formatRupiah(totalMasuk)}`, 14, 42)
    doc.text(`Total Pengeluaran: ${formatRupiah(totalKeluar)}`, 14, 50)
    doc.text(`Saldo Bersih    : ${formatRupiah(totalMasuk - totalKeluar)}`, 14, 58)

    autoTable(doc, {
      startY: 68,
      head: [['Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Catatan']],
      body: transactions.map(t => [
        formatDate(t.date),
        t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
        t.categories?.name || '-',
        formatRupiah(t.amount),
        t.note || '-'
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })

    doc.save(`CatatUang_${month}.pdf`)
  }

  return (
    <div className="flex gap-2">
      <button onClick={exportCSV}
        className="flex items-center gap-1.5 text-xs bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors font-medium">
        📥 CSV
      </button>
      <button onClick={exportPDF}
        className="flex items-center gap-1.5 text-xs bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors font-medium">
        📄 PDF
      </button>
    </div>
  )
}
