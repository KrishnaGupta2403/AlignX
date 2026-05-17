
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