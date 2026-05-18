-- =============================================
-- PROFILES TABLE
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- =============================================
-- GOAL SHEETS TABLE
-- =============================================
ALTER TABLE public.goal_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can read own goal sheet"
ON public.goal_sheets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Employees can insert own goal sheet"
ON public.goal_sheets
FOR INSERT
TO authenticated
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update own goal sheet"
ON public.goal_sheets
FOR UPDATE
TO authenticated
USING (employee_id = auth.uid());

CREATE POLICY "Managers can read team goal sheets"
ON public.goal_sheets
FOR SELECT
TO authenticated
USING (manager_id = auth.uid());

CREATE POLICY "Managers can update team goal sheets"
ON public.goal_sheets
FOR UPDATE
TO authenticated
USING (manager_id = auth.uid());

CREATE POLICY "Admin can read all goal sheets"
ON public.goal_sheets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can update all goal sheets"
ON public.goal_sheets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- GOALS TABLE
-- =============================================
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can read own goals"
ON public.goals
FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert own goals"
ON public.goals
FOR INSERT
TO authenticated
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update own goals"
ON public.goals
FOR UPDATE
TO authenticated
USING (employee_id = auth.uid());

CREATE POLICY "Employees can delete own goals"
ON public.goals
FOR DELETE
TO authenticated
USING (employee_id = auth.uid());

CREATE POLICY "Managers can read team goals"
ON public.goals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.goal_sheets
    WHERE goal_sheets.id = goals.goal_sheet_id
    AND goal_sheets.manager_id = auth.uid()
  )
);

CREATE POLICY "Managers can update team goals"
ON public.goals
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.goal_sheets
    WHERE goal_sheets.id = goals.goal_sheet_id
    AND goal_sheets.manager_id = auth.uid()
  )
);

CREATE POLICY "Admin can read all goals"
ON public.goals
FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- ACHIEVEMENTS TABLE
-- =============================================
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read achievements"
ON public.achievements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert achievements"
ON public.achievements
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update achievements"
ON public.achievements
FOR UPDATE
TO authenticated
USING (true);

-- =============================================
-- APPROVALS TABLE
-- =============================================
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read approvals"
ON public.approvals
FOR SELECT
TO authenticated
USING (manager_id = auth.uid());

CREATE POLICY "Managers can insert approvals"
ON public.approvals
FOR INSERT
TO authenticated
WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Managers can update approvals"
ON public.approvals
FOR UPDATE
TO authenticated
USING (manager_id = auth.uid());

CREATE POLICY "Admin can read all approvals"
ON public.approvals
FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- CHECKINS TABLE
-- =============================================
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can read own checkins"
ON public.checkins
FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

CREATE POLICY "Managers can read and insert checkins"
ON public.checkins
FOR ALL
TO authenticated
USING (manager_id = auth.uid())
WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Admin can read all checkins"
ON public.checkins
FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- ESCALATIONS TABLE
-- =============================================
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read escalations"
ON public.escalations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert escalations"
ON public.escalations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update escalations"
ON public.escalations
FOR UPDATE
TO authenticated
USING (true);

-- =============================================
-- CYCLES TABLE
-- =============================================
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cycles"
ON public.cycles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can manage cycles"
ON public.cycles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- REPORTS TABLE
-- =============================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers and admins can read reports"
ON public.reports
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (true);
