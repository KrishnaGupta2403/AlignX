-- =============================================
-- SCHEMA.SQL — All Table Definitions
-- =============================================

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('employee', 'manager', 'admin')) DEFAULT 'employee',
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CYCLES (performance review cycles)
CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- e.g. "Q1 2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'closed', 'upcoming')) DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GOAL SHEETS (one per employee per cycle)
CREATE TABLE public.goal_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.profiles(id),
  cycle_id UUID REFERENCES public.cycles(id),
  status TEXT CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GOALS (individual goals inside a goal sheet)
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_sheet_id UUID REFERENCES public.goal_sheets(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  weight NUMERIC CHECK (weight >= 0 AND weight <= 100),
  target TEXT,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACHIEVEMENTS
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPROVALS
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_sheet_id UUID REFERENCES public.goal_sheets(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.profiles(id),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  comments TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHECKINS (1:1 notes between manager and employee)
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.profiles(id),
  goal_id UUID REFERENCES public.goals(id),
  notes TEXT,
  checkin_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  type TEXT,   -- e.g. 'approval', 'checkin', 'escalation'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESCALATIONS
CREATE TABLE public.escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_sheet_id UUID REFERENCES public.goal_sheets(id),
  raised_by UUID REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'resolved')) DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,       -- e.g. 'goal_submitted', 'approved'
  target_table TEXT,
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPORTS
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_by UUID REFERENCES public.profiles(id),
  cycle_id UUID REFERENCES public.cycles(id),
  type TEXT,    -- e.g. 'team_summary', 'individual'
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
