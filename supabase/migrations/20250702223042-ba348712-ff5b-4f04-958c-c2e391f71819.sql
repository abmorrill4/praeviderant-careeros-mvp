-- Create missing profiles for existing users
INSERT INTO public.profiles (id, email, name, avatar_url)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'name' as name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;