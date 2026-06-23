-- ============================================
-- SCHEMA LENGKAP: CatatUang v2
-- ============================================

-- Tabel kategori
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pemasukan', 'pengeluaran')),
  icon TEXT DEFAULT '💰',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel transaksi (dengan recurring)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pemasukan', 'pengeluaran')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_day INTEGER CHECK (recurring_day BETWEEN 1 AND 31),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel budget limit per kategori per bulan
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(15, 2) NOT NULL CHECK (limit_amount > 0),
  month TEXT NOT NULL, -- format: YYYY-MM
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month)
);

-- Trigger: update updated_at otomatis
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

-- Kategori bisa dibaca semua user (public)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON categories FOR SELECT USING (true);

-- Seed kategori default
INSERT INTO categories (name, type, icon) VALUES
  ('Gaji', 'pemasukan', '💼'),
  ('Freelance', 'pemasukan', '💻'),
  ('Investasi', 'pemasukan', '📈'),
  ('Hadiah', 'pemasukan', '🎁'),
  ('Bisnis', 'pemasukan', '🏪'),
  ('Lainnya (Masuk)', 'pemasukan', '➕'),
  ('Makan & Minum', 'pengeluaran', '🍜'),
  ('Transport', 'pengeluaran', '🚗'),
  ('Belanja', 'pengeluaran', '🛒'),
  ('Hiburan', 'pengeluaran', '🎬'),
  ('Kesehatan', 'pengeluaran', '🏥'),
  ('Tagihan', 'pengeluaran', '📄'),
  ('Pendidikan', 'pengeluaran', '📚'),
  ('Investasi (Keluar)', 'pengeluaran', '📊'),
  ('Lainnya (Keluar)', 'pengeluaran', '➖')
ON CONFLICT DO NOTHING;
