-- ========================================================
-- SRINIVASAM PLATFORM — SUPABASE POSTGRESQL SCHEMA REFERENCE
-- ========================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'donor' CHECK (role IN ('donor', 'orphanage_admin', 'volunteer', 'platform_admin')),
  phone TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. ORPHANAGES TABLE
CREATE TABLE IF NOT EXISTS public.orphanages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  registration_number TEXT,
  children_count INT DEFAULT 0,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'rejected', 'suspended')),
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Orphanages
ALTER TABLE public.orphanages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified orphanages public read" ON public.orphanages FOR SELECT USING (true);
CREATE POLICY "Admins can update own orphanage" ON public.orphanages FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "Admins can insert own orphanage" ON public.orphanages FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- 3. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orphanage_id UUID REFERENCES public.orphanages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_amount NUMERIC(10, 2) NOT NULL,
  raised_amount NUMERIC(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campaigns public read" ON public.campaigns FOR SELECT USING (true);

-- 4. NEEDS TABLE
CREATE TABLE IF NOT EXISTS public.needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orphanage_id UUID REFERENCES public.orphanages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled')),
  quantity TEXT,
  estimated_cost TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Needs
ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Needs public read" ON public.needs FOR SELECT USING (true);

-- 5. DONATIONS TABLE
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  is_recurring BOOLEAN DEFAULT FALSE,
  transaction_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donors read own donations" ON public.donations FOR SELECT USING (auth.uid() = donor_id);
CREATE POLICY "Authenticated insert donations" ON public.donations FOR INSERT WITH CHECK (true);

-- 6. SPECIAL OCCASIONS TABLE (OPTIONAL)
CREATE TABLE IF NOT EXISTS public.special_occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  occasion_date DATE NOT NULL,
  type TEXT DEFAULT 'Birthday',
  target_amount NUMERIC(10, 2) DEFAULT 250,
  raised_amount NUMERIC(10, 2) DEFAULT 0,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Special Occasions
ALTER TABLE public.special_occasions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own occasions" ON public.special_occasions FOR ALL USING (auth.uid() = user_id);
