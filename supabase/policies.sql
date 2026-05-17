
ALTER TABLE profiles
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"

ON profiles

FOR SELECT

USING (

    auth.uid() = id

);


CREATE POLICY "Managers can read team profiles"

ON profiles

FOR SELECT

USING (

    manager_id = auth.uid()

);

CREATE POLICY "Admins can read all profiles"

ON profiles

FOR SELECT

USING (

    EXISTS (

        SELECT 1

        FROM profiles

        WHERE profiles.id = auth.uid()

        AND profiles.role = 'admin'

    )

);

-- GOAL SHEETS RLS POLICIES
ALTER TABLE goal_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goal sheets"
ON goal_sheets FOR SELECT TO authenticated
USING (auth.uid() = employee_id);

CREATE POLICY "Users can insert own goal sheets"
ON goal_sheets FOR INSERT TO authenticated
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update own goal sheets"
ON goal_sheets FOR UPDATE TO authenticated
USING (auth.uid() = employee_id);

CREATE POLICY "Users can delete own goal sheets"
ON goal_sheets FOR DELETE TO authenticated
USING (auth.uid() = employee_id);

-- GOALS RLS POLICIES
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
ON goals FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM goal_sheets
    WHERE goal_sheets.id = goals.goal_sheet_id
    AND goal_sheets.employee_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own goals"
ON goals FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM goal_sheets
    WHERE goal_sheets.id = goal_sheet_id
    AND goal_sheets.employee_id = auth.uid()
  )
);

CREATE POLICY "Users can update own goals"
ON goals FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM goal_sheets
    WHERE goal_sheets.id = goals.goal_sheet_id
    AND goal_sheets.employee_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own goals"
ON goals FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM goal_sheets
    WHERE goal_sheets.id = goals.goal_sheet_id
    AND goal_sheets.employee_id = auth.uid()
  )
);