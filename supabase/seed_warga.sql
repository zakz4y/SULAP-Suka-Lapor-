--
-- SEED DATA WARGA SULAP (Berdasarkan data_warga.csv)
-- Idempoten: ON CONFLICT DO NOTHING
--
do $$
declare
  v_rt_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;
  v_user_id uuid;
begin

  -- User 1: Achmad Fajar Fauzih (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'achmad.fajar@sulap.id', '$2b$10$6M6qAKsWttvKu0dQyYORpeXluQ3VDzh.TxTzRdUdMero2O8BEMe0W', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Achmad Fajar Fauzih', 'username', 'achmad.fajar', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$6M6qAKsWttvKu0dQyYORpeXluQ3VDzh.TxTzRdUdMero2O8BEMe0W', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Achmad Fajar Fauzih', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 2: Ananda Satria (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000002'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ananda.satria@sulap.id', '$2b$10$iHi/Uv3riIHwUByKenqeKOokvw2JJZ9PAp1q9Lhy3zPwAdyGwV4eW', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Ananda Satria', 'username', 'ananda.satria', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$iHi/Uv3riIHwUByKenqeKOokvw2JJZ9PAp1q9Lhy3zPwAdyGwV4eW', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Ananda Satria', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 3: Angelia Yurieski Putri Pribadi (Sekretaris RT)
  v_user_id := '00000000-0000-0000-0000-000000000003'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'angelia.yurieski@sulap.id', '$2b$10$QZcbRsHdcKhvhqoTf88Yr.KtIgmrGYqBPt.feityOz581Z5ShKBXe', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Angelia Yurieski Putri Pribadi', 'username', 'angelia.yurieski', 'jabatan', 'Sekretaris RT'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$QZcbRsHdcKhvhqoTf88Yr.KtIgmrGYqBPt.feityOz581Z5ShKBXe', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Angelia Yurieski Putri Pribadi', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'rt_admin'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 4: Anya Anindya Mandiri Jamil (Bendahara RT)
  v_user_id := '00000000-0000-0000-0000-000000000004'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anya.anindya@sulap.id', '$2b$10$zzV4l63t44hRgkkh76sKJOyVQ0PRF8SVfuU0kYdw5BD5BNTs8983W', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Anya Anindya Mandiri Jamil', 'username', 'anya.anindya', 'jabatan', 'Bendahara RT'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$zzV4l63t44hRgkkh76sKJOyVQ0PRF8SVfuU0kYdw5BD5BNTs8983W', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Anya Anindya Mandiri Jamil', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'rt_admin'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 5: Arya Dwimulya Ardyono (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000005'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'arya.dwimulya@sulap.id', '$2b$10$USRl1lEXK9cAM7y/FX2wjO1wj.HkITtQy0PiCPc8W91Hl7ZrbzqQu', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Arya Dwimulya Ardyono', 'username', 'arya.dwimulya', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$USRl1lEXK9cAM7y/FX2wjO1wj.HkITtQy0PiCPc8W91Hl7ZrbzqQu', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Arya Dwimulya Ardyono', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 6: Aryasatya Djava Dwinatha (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000006'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aryasatya.djava@sulap.id', '$2b$10$Zhfo74EIgL8UYoiVw758FuiiNmPvTZdvWZOCcNY/NuXkq1zFajDcm', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Aryasatya Djava Dwinatha', 'username', 'aryasatya.djava', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$Zhfo74EIgL8UYoiVw758FuiiNmPvTZdvWZOCcNY/NuXkq1zFajDcm', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Aryasatya Djava Dwinatha', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 7: Azril Ilham Erlangga (Petugas Lingkungan)
  v_user_id := '00000000-0000-0000-0000-000000000007'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'azril.ilham@sulap.id', '$2b$10$zZ/hdzI3OrwH8SIYjrlwgekZoxK6yErYqskCiIll2zbgHoYWNHVly', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Azril Ilham Erlangga', 'username', 'azril.ilham', 'jabatan', 'Petugas Lingkungan'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$zZ/hdzI3OrwH8SIYjrlwgekZoxK6yErYqskCiIll2zbgHoYWNHVly', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Azril Ilham Erlangga', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'officer'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 8: Bagus Darmawan (Petugas Keamanan)
  v_user_id := '00000000-0000-0000-0000-000000000008'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bagus.darmawan@sulap.id', '$2b$10$6AaAfRFsnmpKkU7fG3sm.Olup63SBLGWqsIJ5uU9/Mi/zcPKiHvwW', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Bagus Darmawan', 'username', 'bagus.darmawan', 'jabatan', 'Petugas Keamanan'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$6AaAfRFsnmpKkU7fG3sm.Olup63SBLGWqsIJ5uU9/Mi/zcPKiHvwW', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Bagus Darmawan', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'officer'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 9: Beryl Feodora Elysia (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000009'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'beryl.feodora@sulap.id', '$2b$10$EMT.A0dGkrsOuMFCQ.cwUeQo2uYZPuvY4fh.AKSdl867RliW2EkvG', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Beryl Feodora Elysia', 'username', 'beryl.feodora', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$EMT.A0dGkrsOuMFCQ.cwUeQo2uYZPuvY4fh.AKSdl867RliW2EkvG', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Beryl Feodora Elysia', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 10: Chelsea Fellycia (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000010'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'chelsea.fellycia@sulap.id', '$2b$10$pb.JrUqKeDs4wRa98.MUse1Qd/uicknlaiGw5r.RSWowzrC7jG0.C', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Chelsea Fellycia', 'username', 'chelsea.fellycia', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$pb.JrUqKeDs4wRa98.MUse1Qd/uicknlaiGw5r.RSWowzrC7jG0.C', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Chelsea Fellycia', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 11: Darrell Syadid Yasma (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000011'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'darrell.syadid@sulap.id', '$2b$10$9ShjnMAkWcRq9lXTFiA.KuT72xXdUsb596Zj5TujdX9o.78VImor6', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Darrell Syadid Yasma', 'username', 'darrell.syadid', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$9ShjnMAkWcRq9lXTFiA.KuT72xXdUsb596Zj5TujdX9o.78VImor6', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Darrell Syadid Yasma', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 12: Dike Dwi Rahmadana (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000012'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dike.dwi@sulap.id', '$2b$10$lc6/Jg8G2ND25FWGg4CgPOvio2RTYtNYQ.VngAPZ2mNdQmGxEQJV.', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Dike Dwi Rahmadana', 'username', 'dike.dwi', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$lc6/Jg8G2ND25FWGg4CgPOvio2RTYtNYQ.VngAPZ2mNdQmGxEQJV.', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Dike Dwi Rahmadana', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 13: Eka Fajar Lazuardi (Petugas Kebersihan)
  v_user_id := '00000000-0000-0000-0000-000000000013'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eka.fajar@sulap.id', '$2b$10$oUCsBKVf9kR4D9i0j0vBPe/vVy7W4wp3YGeSA8TPm9PSRvr4ZzGA6', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Eka Fajar Lazuardi', 'username', 'eka.fajar', 'jabatan', 'Petugas Kebersihan'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$oUCsBKVf9kR4D9i0j0vBPe/vVy7W4wp3YGeSA8TPm9PSRvr4ZzGA6', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Eka Fajar Lazuardi', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'officer'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 14: Huliatul Awliya Nurrahmah (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000014'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'huliatul.awliya@sulap.id', '$2b$10$iM6OjR.bZqDrTMsFfOnN8u3Qum7JHGGsGKIZZrI9.JbWehs8xQF5y', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Huliatul Awliya Nurrahmah', 'username', 'huliatul.awliya', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$iM6OjR.bZqDrTMsFfOnN8u3Qum7JHGGsGKIZZrI9.JbWehs8xQF5y', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Huliatul Awliya Nurrahmah', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 15: Intania Tansa Nejananda Maolan (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000015'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intania.tansa@sulap.id', '$2b$10$9RKy8dkIJgO2.vBrEn.HsOKkuZSdYjfR7QUG26SED.6gW3GmLuia6', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Intania Tansa Nejananda Maolan', 'username', 'intania.tansa', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$9RKy8dkIJgO2.vBrEn.HsOKkuZSdYjfR7QUG26SED.6gW3GmLuia6', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Intania Tansa Nejananda Maolan', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 16: Jonathan Azazia Atara Kurnia W (Developer Platform)
  v_user_id := '00000000-0000-0000-0000-000000000016'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jonathan.azazia@sulap.id', '$2b$10$5/BuqcJqvimqrikBurhiyOyWAESrdFbTADWRaz2XHaDF527tf.vo.', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Jonathan Azazia Atara Kurnia W', 'username', 'jonathan.azazia', 'jabatan', 'Developer Platform'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$5/BuqcJqvimqrikBurhiyOyWAESrdFbTADWRaz2XHaDF527tf.vo.', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Jonathan Azazia Atara Kurnia W', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'developer'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 17: Kaysan Rizky Akbar (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000017'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kaysan.rizky@sulap.id', '$2b$10$J/.J1H30glVDOKQOXL.0Pu3dBVYEc6q4QpkY7syDm52DkBYJ5IJPu', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Kaysan Rizky Akbar', 'username', 'kaysan.rizky', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$J/.J1H30glVDOKQOXL.0Pu3dBVYEc6q4QpkY7syDm52DkBYJ5IJPu', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Kaysan Rizky Akbar', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 18: Kresna Andika Wirasana (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000018'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kresna.andika@sulap.id', '$2b$10$ENRPe0JrCjg9OsZvVKNva.UpzPVp8P/4iyNt22Wt4e.vxDfTCTXsu', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Kresna Andika Wirasana', 'username', 'kresna.andika', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$ENRPe0JrCjg9OsZvVKNva.UpzPVp8P/4iyNt22Wt4e.vxDfTCTXsu', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Kresna Andika Wirasana', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 19: Moch Aqila Al Hayyu Caesar (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000019'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'moch.aqila@sulap.id', '$2b$10$pujpQ3Qved3mknaqNfawA.UzVz1VtETHllCEU3FFBr7UgeZOrLAyW', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Moch Aqila Al Hayyu Caesar', 'username', 'moch.aqila', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$pujpQ3Qved3mknaqNfawA.UzVz1VtETHllCEU3FFBr7UgeZOrLAyW', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Moch Aqila Al Hayyu Caesar', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 20: Mohamad Zidan Al Haqqi (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000020'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mohamad.zidan@sulap.id', '$2b$10$mNQFy43lb.uLUKyMeCPkWu6Y6LtBWRdmQSwHL52KgU.vkQcMbPgLq', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Mohamad Zidan Al Haqqi', 'username', 'mohamad.zidan', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$mNQFy43lb.uLUKyMeCPkWu6Y6LtBWRdmQSwHL52KgU.vkQcMbPgLq', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Mohamad Zidan Al Haqqi', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 21: Muchammad Revano Essa Ilmansyah (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000021'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'muchammad.revano@sulap.id', '$2b$10$yZ3WfnsvuftGIPNd.UHObuhYZEtFBhY69mcsHI1kOTzst21J8yQje', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Muchammad Revano Essa Ilmansyah', 'username', 'muchammad.revano', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$yZ3WfnsvuftGIPNd.UHObuhYZEtFBhY69mcsHI1kOTzst21J8yQje', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Muchammad Revano Essa Ilmansyah', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 22: Muhammad Afcel Fahmi Huda (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000022'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'muhammad.afcel@sulap.id', '$2b$10$fpujKTnE2CfV4e.wIH9ylO8opnb0g4.YkxZ79c1smcE8lqg1RWh2u', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Muhammad Afcel Fahmi Huda', 'username', 'muhammad.afcel', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$fpujKTnE2CfV4e.wIH9ylO8opnb0g4.YkxZ79c1smcE8lqg1RWh2u', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Muhammad Afcel Fahmi Huda', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 23: Muhammad Daud Ibnu Abbas (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000023'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'muhammad.daud@sulap.id', '$2b$10$jHETgO0gtc/PXGsUVozNkO.Y3Mhopf/OyTRvuR2m3oDRhtQOAf0OG', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Muhammad Daud Ibnu Abbas', 'username', 'muhammad.daud', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$jHETgO0gtc/PXGsUVozNkO.Y3Mhopf/OyTRvuR2m3oDRhtQOAf0OG', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Muhammad Daud Ibnu Abbas', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 24: Muhammad Erlan Galih Wiratama (Petugas Keamanan)
  v_user_id := '00000000-0000-0000-0000-000000000024'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'muhammad.erlan@sulap.id', '$2b$10$1quTFt5ZmHzs3Kjj7f9EXuFitMu813LHyLi0amMDdpa7QJPFHJO8G', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Muhammad Erlan Galih Wiratama', 'username', 'muhammad.erlan', 'jabatan', 'Petugas Keamanan'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$1quTFt5ZmHzs3Kjj7f9EXuFitMu813LHyLi0amMDdpa7QJPFHJO8G', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Muhammad Erlan Galih Wiratama', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'officer'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 25: Muhammad Ozil Rizqy Saputra (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000025'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'muhammad.ozil@sulap.id', '$2b$10$msbLDEdNbo4xAEd6Cj8/ZeyI0SLi7YjfwAJsAhMv22K284ApgkjFu', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Muhammad Ozil Rizqy Saputra', 'username', 'muhammad.ozil', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$msbLDEdNbo4xAEd6Cj8/ZeyI0SLi7YjfwAJsAhMv22K284ApgkjFu', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Muhammad Ozil Rizqy Saputra', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 26: Nailah Zahra Talita Azhar Vidyanata (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000026'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nailah.zahra@sulap.id', '$2b$10$E56rU05bYZiFLSC4eiBzHuQcw5lD7JpKHmx30zC85pshlgxpuqcn6', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Nailah Zahra Talita Azhar Vidyanata', 'username', 'nailah.zahra', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$E56rU05bYZiFLSC4eiBzHuQcw5lD7JpKHmx30zC85pshlgxpuqcn6', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Nailah Zahra Talita Azhar Vidyanata', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 27: Novia Yunita Sari (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000027'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'novia.yunita@sulap.id', '$2b$10$NhmkGI7tLd8T2jv7.Tcpm.KheTQs2FK3auqw.AENMMFrGdJKp0hnu', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Novia Yunita Sari', 'username', 'novia.yunita', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$NhmkGI7tLd8T2jv7.Tcpm.KheTQs2FK3auqw.AENMMFrGdJKp0hnu', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Novia Yunita Sari', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 28: Rafa Putra Prabowo (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000028'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rafa.putra@sulap.id', '$2b$10$PdwZsEXlWdLFleFERnsEsOrcxu6mu4.dBNg9pii2VT5CbQrYTyHVm', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Rafa Putra Prabowo', 'username', 'rafa.putra', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$PdwZsEXlWdLFleFERnsEsOrcxu6mu4.dBNg9pii2VT5CbQrYTyHVm', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Rafa Putra Prabowo', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 29: Rafi Dzil Dzaka (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000029'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rafi.dzil@sulap.id', '$2b$10$GZKwFYbUoi3swyPdpNcPD.OMit5I5A2HIk/Lo9Jj0I2QMcXroRAUa', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Rafi Dzil Dzaka', 'username', 'rafi.dzil', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$GZKwFYbUoi3swyPdpNcPD.OMit5I5A2HIk/Lo9Jj0I2QMcXroRAUa', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Rafi Dzil Dzaka', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 30: Rayhana Kaylila Khalisa (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000030'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rayhana.kaylila@sulap.id', '$2b$10$BGuSJXIjyWlfSHK/LorePuVICPvNQD3kJFuZYckax.gwfQe.QEZUu', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Rayhana Kaylila Khalisa', 'username', 'rayhana.kaylila', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$BGuSJXIjyWlfSHK/LorePuVICPvNQD3kJFuZYckax.gwfQe.QEZUu', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Rayhana Kaylila Khalisa', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 31: Reyhan Kresna Putra Nurcahya (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000031'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reyhan.kresna@sulap.id', '$2b$10$gWf/MMtBu0GfxJsgvANObeTuPwZk7FHQp2aq9aSbAAJMe1na.imwW', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Reyhan Kresna Putra Nurcahya', 'username', 'reyhan.kresna', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$gWf/MMtBu0GfxJsgvANObeTuPwZk7FHQp2aq9aSbAAJMe1na.imwW', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Reyhan Kresna Putra Nurcahya', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 32: Rizqy Farhan Listyansah (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000032'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rizqy.farhan@sulap.id', '$2b$10$yBe9Nf6.GuhSC5nchTy.keRbajnwGl8QXzfsi.u5PbipgMBOG./Sq', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Rizqy Farhan Listyansah', 'username', 'rizqy.farhan', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$yBe9Nf6.GuhSC5nchTy.keRbajnwGl8QXzfsi.u5PbipgMBOG./Sq', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Rizqy Farhan Listyansah', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 33: Suhail Muhammad (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000033'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'suhail.muhammad@sulap.id', '$2b$10$BivGU2Ax8amm6hG3XqoZZu7uwz48hspjbpZ4BlKjDJxygcHBMRjw6', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Suhail Muhammad', 'username', 'suhail.muhammad', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$BivGU2Ax8amm6hG3XqoZZu7uwz48hspjbpZ4BlKjDJxygcHBMRjw6', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Suhail Muhammad', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 34: Tarischa Nur Wijayanti (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000034'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tarischa.nur@sulap.id', '$2b$10$3b40eXk9jIBoFO4AaYgqjOs0OoN6kEGp9rhqIMVooxvvrL3dz86WW', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Tarischa Nur Wijayanti', 'username', 'tarischa.nur', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$3b40eXk9jIBoFO4AaYgqjOs0OoN6kEGp9rhqIMVooxvvrL3dz86WW', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Tarischa Nur Wijayanti', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 35: Tirta Raditya Arfa (Warga)
  v_user_id := '00000000-0000-0000-0000-000000000035'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tirta.raditya@sulap.id', '$2b$10$Ear7OVfozwbljlKFPo20a.1Q4GFpWXwQiWCvRpssv9Lswi9Yq/tRa', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Tirta Raditya Arfa', 'username', 'tirta.raditya', 'jabatan', 'Warga'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$Ear7OVfozwbljlKFPo20a.1Q4GFpWXwQiWCvRpssv9Lswi9Yq/tRa', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Tirta Raditya Arfa', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'resident'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;


  -- User 36: Yuda Adi Pratama (Ketua RT)
  v_user_id := '00000000-0000-0000-0000-000000000036'::uuid;
  
  -- 1. auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'yuda.adi@sulap.id', '$2b$10$cAZniB/nJmzJEmUYfbjMieA0jWKUnKgAjyxutnkTB3.rB95eEUsoO', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Yuda Adi Pratama', 'username', 'yuda.adi', 'jabatan', 'Ketua RT'),
    now(), now()
  ) on conflict (id) do update set encrypted_password = '$2b$10$cAZniB/nJmzJEmUYfbjMieA0jWKUnKgAjyxutnkTB3.rB95eEUsoO', raw_user_meta_data = excluded.raw_user_meta_data;

  -- 2. public.profiles
  insert into public.profiles (id, display_name, locale, created_at, updated_at)
  values (v_user_id, 'Yuda Adi Pratama', 'id-ID', now(), now())
  on conflict (id) do update set display_name = excluded.display_name;

  -- 3. public.memberships
  insert into public.memberships (user_id, rt_id, role, status, join_method, created_at)
  values (v_user_id, v_rt_id, 'rt_admin'::public.member_role, 'active'::public.membership_status, 'request'::public.join_method, now())
  on conflict do nothing;

end $$;
