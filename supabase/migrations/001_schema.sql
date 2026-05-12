-- ============================================================
-- CoBuy Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. USERS TABLE
-- App-level user profiles linked to Supabase Auth users.
-- ============================================================
CREATE TABLE public.users (
  user_id     SERIAL PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email       TEXT NOT NULL,
  first_name  TEXT DEFAULT '',
  last_name   TEXT DEFAULT '',
  username    TEXT UNIQUE,
  app_role    TEXT DEFAULT 'member' CHECK (app_role IN ('admin', 'leader', 'member')),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 2. GROUPS TABLE
-- ============================================================
CREATE TABLE public.groups (
  group_id    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  join_code   TEXT UNIQUE DEFAULT upper(
                substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)
              ),
  is_private  BOOLEAN DEFAULT true,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'ordering', 'closed')),
  created_at  TIMESTAMPTZ DEFAULT now()
);


-- 3. GROUP MEMBERS TABLE
-- ============================================================
CREATE TABLE public.group_members (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id          UUID REFERENCES public.groups(group_id) ON DELETE CASCADE NOT NULL,
  user_uuid         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_role        TEXT DEFAULT 'member' CHECK (group_role IN ('leader', 'member')),
  membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive')),
  joined_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_uuid)
);


-- 4. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Users: own profile only
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Groups: visible to leader or active members
CREATE POLICY "Members can view groups they belong to" ON public.groups
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.group_id
        AND user_uuid = auth.uid()
        AND membership_status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group leaders can update their groups" ON public.groups
  FOR UPDATE USING (auth.uid() = created_by);

-- Group members: visible within the same group
CREATE POLICY "Active members can view group memberships" ON public.group_members
  FOR SELECT USING (
    user_uuid = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE group_id = group_members.group_id
        AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own membership" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_uuid);

CREATE POLICY "Leaders or self can remove membership" ON public.group_members
  FOR DELETE USING (
    user_uuid = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE group_id = group_members.group_id
        AND created_by = auth.uid()
    )
  );


-- 5. join_group RPC FUNCTION
-- Called by /api/groups/join — runs as SECURITY DEFINER so it can
-- read groups by join_code even before the user is a member.
-- ============================================================
CREATE OR REPLACE FUNCTION public.join_group(join_code_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group    public.groups%ROWTYPE;
  v_user_id  UUID;
  v_existing UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Find group by join code (case-insensitive match)
  SELECT * INTO v_group
  FROM public.groups
  WHERE join_code = upper(join_code_param);

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite code');
  END IF;

  IF v_group.status = 'closed' THEN
    RETURN json_build_object('success', false, 'error', 'This group is closed and no longer accepting members');
  END IF;

  -- Check if already a member
  SELECT user_uuid INTO v_existing
  FROM public.group_members
  WHERE group_id = v_group.group_id AND user_uuid = v_user_id;

  IF FOUND THEN
    -- Already a member — just return the group
    RETURN json_build_object(
      'success', true,
      'group', row_to_json(v_group)
    );
  END IF;

  -- Add as member
  INSERT INTO public.group_members (group_id, user_uuid, group_role, membership_status)
  VALUES (v_group.group_id, v_user_id, 'member', 'active');

  RETURN json_build_object(
    'success', true,
    'group', row_to_json(v_group)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
