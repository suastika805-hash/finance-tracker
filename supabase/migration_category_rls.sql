-- ============================================
-- FIX LENGKAP: CatatUang - Jalankan di Supabase SQL Editor
-- Mengatasi 2 error sekaligus:
-- 1. Kolom is_recurring tidak ditemukan di transactions
-- 2. RLS policy categories (tidak bisa tambah kategori baru)
-- ============================================

-- ──────────────────────────────────────────────
-- BAGIAN 1: Tambah kolom is_recurring ke tabel transactions
-- (Aman dijalankan berulang kali karena ada IF NOT EXISTS)
-- ──────────────────────────────────────────────

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS recurring_day INTEGER CHECK (recurring_day BETWEEN 1 AND 31);

-- Refresh schema cache Supabase
NOTIFY pgrst, 'reload schema';

-- ──────────────────────────────────────────────
-- BAGIAN 2: Fix RLS categories agar bisa tambah/hapus kategori
-- ──────────────────────────────────────────────

-- Hapus policy lama
DROP POLICY IF EXISTS "Categories are public" ON categories;
DROP POLICY IF EXISTS "Categories readable by all" ON categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON categories;

-- Policy baru: semua orang bisa baca
CREATE POLICY "categories_select_all" ON categories
  FOR SELECT USING (true);

-- Policy baru: user yang login bisa tambah kategori
CREATE POLICY "categories_insert_authenticated" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy baru: user yang login bisa hapus kategori
CREATE POLICY "categories_delete_authenticated" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- ──────────────────────────────────────────────
-- Selesai! Coba simpan transaksi dan kategori lagi.
-- ──────────────────────────────────────────────
