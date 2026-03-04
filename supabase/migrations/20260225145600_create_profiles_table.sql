-- Create a table for public profiles mapped to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'crema_agent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Allow public read access to profiles (needed for assignment dropdowns)
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR
SELECT USING (true);
-- Trigger function to automatically create a profile for every new user
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN
INSERT INTO public.profiles (id, email)
VALUES (new.id, new.email);
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to call the function when a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Backfill existing users into the profiles table
INSERT INTO public.profiles (id, email)
SELECT id,
    email
FROM auth.users ON CONFLICT (id) DO NOTHING;
-- Update sar_change_alerts to reference profiles instead of auth.users
ALTER TABLE public.sar_change_alerts DROP CONSTRAINT IF EXISTS sar_change_alerts_assigned_to_fkey;
ALTER TABLE public.sar_change_alerts
ADD CONSTRAINT sar_change_alerts_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE
SET NULL;