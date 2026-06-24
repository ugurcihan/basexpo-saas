-- Organizatör profili için bio alanı
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Anon kullanıcılar organizatör profillerini görebilsin (isim + avatar)
CREATE POLICY "profiles: public organizer read" ON public.profiles
  FOR SELECT USING (role = 'organizer');

-- Organizatör takip tablosu
CREATE TABLE IF NOT EXISTS public.organizer_follows (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, organizer_id)
);

ALTER TABLE public.organizer_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizer_follows: public read" ON public.organizer_follows
  FOR SELECT USING (true);

CREATE POLICY "organizer_follows: own insert" ON public.organizer_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "organizer_follows: own delete" ON public.organizer_follows
  FOR DELETE USING (auth.uid() = follower_id);
