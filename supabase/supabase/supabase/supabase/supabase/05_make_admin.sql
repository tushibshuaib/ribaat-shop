update public.profiles
   set role = 'admin'
 where lower(email) = lower('YOUR_EMAIL_HERE');

select id, email, role from public.profiles;
