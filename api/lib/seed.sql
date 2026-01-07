-- Seed Data for SD Plandi Database
-- Generated from students-data.json
-- Current Academic Year: 2026/2027
-- Cohort-based: Each grade links to their entry year

-- ============================================================================
-- 1. ACADEMIC YEARS (Cohort Entry Years Only)
-- ============================================================================
-- Each year represents when a cohort entered Grade 1
-- Only includes years for currently active students + current year
INSERT INTO academic_years (id, name, start_date, end_date, is_active) VALUES
-- Grade 6 cohort - entered Grade 1 in 2020/2021
('ay2020', '2020/2021', '2020-07-15', '2021-06-30', false),
-- Grade 5 cohort - entered Grade 1 in 2021/2022
('ay2021', '2021/2022', '2021-07-15', '2022-06-30', false),
-- Grade 4 cohort - entered Grade 1 in 2022/2023
('ay2022', '2022/2023', '2022-07-15', '2023-06-30', false),
-- Grade 3 cohort - entered Grade 1 in 2023/2024
('ay2023', '2023/2024', '2023-07-15', '2024-06-30', false),
-- Grade 2 cohort - entered Grade 1 in 2024/2025
('ay2024', '2024/2025', '2024-07-15', '2025-06-30', false),
-- Grade 1 cohort - entered Grade 1 in 2025/2026
('ay2025', '2025/2026', '2025-07-15', '2026-06-30', false),
-- Current active academic year (for reference only)
('ay2026', '2026/2027', '2026-07-15', '2027-06-30', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. TEACHERS
-- ============================================================================
INSERT INTO teachers (id, nip, full_name, role, email, phone) VALUES
('tch001', '197805152008012001', 'Dra. Siti Aminah, M.Pd', 'principal', 'siti.aminah@sdplandi.sch.id', '081234567001'),
('tch002', '198206102009012002', 'Ahmad Yusuf, S.Pd', 'teacher', 'ahmad.yusuf@sdplandi.sch.id', '081234567002'),
('tch003', '198509152010012001', 'Nur Hidayah, S.Pd.I', 'teacher', 'nur.hidayah@sdplandi.sch.id', '081234567003'),
('tch004', '199001202015012001', 'Eko Prasetyo, S.Pd', 'teacher', 'eko.prasetyo@sdplandi.sch.id', '081234567004'),
('tch005', '198703142012012001', 'Dewi Kartika, S.Pd', 'teacher', 'dewi.kartika@sdplandi.sch.id', '081234567005'),
('tch006', '199205182016011001', 'Budi Santoso, S.Pd', 'teacher', 'budi.santoso@sdplandi.sch.id', '081234567006'),
('tch007', '198812252014012002', 'Sri Wahyuni, S.Pd', 'admin', 'sri.wahyuni@sdplandi.sch.id', '081234567007')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. ROMBELS (Class Groups - Cohort Entry Years)
-- ============================================================================
-- Each rombel links to the academic year when that cohort first entered Grade 1
INSERT INTO rombels (id, academic_year_id, grade_level, class_name, wali_teacher_id) VALUES
-- Grade 1 (26 students) - Entered in 2025/2026 (currently in Grade 1 for 2026/2027)
('rmb2501', 'ay2025', 1, 'Kelas 1', 'tch002'),
-- Grade 2 (32 students) - Entered in 2024/2025 (now in Grade 2 for 2026/2027)
('rmb2402', 'ay2024', 2, 'Kelas 2', 'tch003'),
-- Grade 3 (25 students) - Entered in 2023/2024 (now in Grade 3 for 2026/2027)
('rmb2303', 'ay2023', 3, 'Kelas 3', 'tch004'),
-- Grade 4 (25 students) - Entered in 2022/2023 (now in Grade 4 for 2026/2027)
('rmb2204', 'ay2022', 4, 'Kelas 4', 'tch005'),
-- Grade 5 (22 students) - Entered in 2021/2022 (now in Grade 5 for 2026/2027)
('rmb2105', 'ay2021', 5, 'Kelas 5', 'tch006'),
-- Grade 6 (31 students) - Entered in 2020/2021 (now in Grade 6 for 2026/2027)
('rmb2006', 'ay2020', 6, 'Kelas 6', 'tch002')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. SUBJECTS (Kurikulum Merdeka) - Intrakurikuler & Ekstrakurikuler
-- ============================================================================
INSERT INTO subjects (id, code, name, grade_level, subject_group, subject_type, description, is_active) VALUES
-- INTRAKURIKULER
('subj001', 'PAI', 'Pendidikan Agama dan Budi Pekerti', NULL, 'A', 'intrakurikuler', 'Pendidikan Agama dan Budi Pekerti', true),
('subj002', 'PPKN', 'Pendidikan Pancasila', NULL, 'A', 'intrakurikuler', 'Pendidikan Pancasila', true),
('subj003', 'BIND', 'Bahasa Indonesia', NULL, 'A', 'intrakurikuler', 'Bahasa Indonesia', true),
('subj004', 'MTK', 'Matematika', NULL, 'A', 'intrakurikuler', 'Matematika', true),
('subj005', 'IPA', 'Ilmu Pengetahuan Alam', NULL, 'A', 'intrakurikuler', 'Ilmu Pengetahuan Alam', true),
('subj006', 'IPS', 'Ilmu Pengetahuan Sosial', NULL, 'A', 'intrakurikuler', 'Ilmu Pengetahuan Sosial', true),
('subj007', 'PJOK', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', NULL, 'B', 'intrakurikuler', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', true),
('subj008', 'SRP', 'Seni Rupa', NULL, 'B', 'intrakurikuler', 'Seni Rupa', true),
('subj009', 'BING', 'Bahasa Inggris', NULL, 'B', 'intrakurikuler', 'Bahasa Inggris', true),
('subj010', 'JAWA', 'Bahasa Jawa', NULL, 'B', 'intrakurikuler', 'Bahasa Jawa', true),
('subj011', 'MULOK_AGAMA', 'Mulok Keagamaan', NULL, 'C', 'intrakurikuler', 'Mulok Keagamaan', true),
('subj012', 'DINIYAH', 'Pendidikan Diniyah', NULL, 'C', 'intrakurikuler', 'Pendidikan Diniyah', true),
-- EKSTRAKURIKULER
('subj015', 'PRAMUKA', 'Pramuka', NULL, NULL, 'ekstrakurikuler', 'Kegiatan kepramukaan untuk pembentuk karakter', true),
('subj016', 'TARI', 'Tari', NULL, NULL, 'ekstrakurikuler', 'Kegiatan seni tari tradisional dan modern', true),
('subj017', 'BANJARI', 'Banjari', NULL, NULL, 'ekstrakurikuler', 'Kegiatan seni musik banjari', true),
('subj018', 'VOLLY', 'Volly', NULL, NULL, 'ekstrakurikuler', 'Kegiatan olahraga voli', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. STUDENTS (From students-data.json)
-- ============================================================================
INSERT INTO students (id, nisn, full_name, gender, birth_date, birth_place, religion, address, parent_name, parent_phone, qr_code) VALUES
('std001', '3182391263', 'ADELIA PUTRI RAMADHANI', 'P', '2018-06-08', 'Jombang', 'Islam', null, null, null, 'STD001-3182391263'),
('std002', '3186086318', 'ADIBAH SHAKILA ATMARINI', 'P', '2018-12-28', 'Jombang', 'Islam', null, null, null, 'STD002-3186086318'),
('std003', '3187165533', 'AHMAD ABYAN ARTA PRADIPTA', 'L', '2018-06-16', 'Jombang', 'Islam', null, null, null, 'STD003-3187165533'),
('std004', '3189842430', 'AHMAD ALVINO MIKAIL', 'L', '2018-10-06', 'Jombang', 'Islam', null, null, null, 'STD004-3189842430'),
('std005', '3185972548', 'AISYAH DWI IZZATUNNISA', 'P', '2018-11-05', 'Jombang', 'Islam', null, null, null, 'STD005-3185972548'),
('std006', '3184846248', 'AMANDA AMELIA PUTRI', 'P', '2018-05-14', 'Jombang', 'Islam', null, null, null, 'STD006-3184846248'),
('std007', '3186407847', 'ANINDITA KEISYAH ZAHRA TRI MULYANI', 'P', '2018-04-09', 'Jombang', 'Islam', null, null, null, 'STD007-3186407847'),
('std008', '3183756690', 'ARZETTY QURROTUL VANIA PUTRI', 'P', '2018-10-06', 'Jombang', 'Islam', null, null, null, 'STD008-3183756690'),
('std009', '3189756693', 'AZZRIL FAUZAN RASYA', 'L', '2018-01-17', 'Jombang', 'Islam', null, null, null, 'STD009-3189756693'),
('std010', '3180246548', 'DAYU PUTRI HAPSARI', 'P', '2018-07-25', 'Jombang', 'Islam', null, null, null, 'STD010-3180246548'),
('std011', '3189168510', 'DIYAH AYU ANGGRAINI', 'P', '2018-03-14', 'Jombang', 'Islam', null, null, null, 'STD011-3189168510'),
('std012', '3190608604', 'DJAKA PUTRA JUANDA', 'L', '2019-01-19', 'Jombang', 'Islam', null, null, null, 'STD012-3190608604'),
('std013', '3191541051', 'HANIFA PUTRI AZZAHRAH', 'P', '2019-02-25', 'Jombang', 'Islam', null, null, null, 'STD013-3191541051'),
('std014', '3195449894', 'KATEEYA QUEEN EIJAZLOVA', 'P', '2019-03-01', 'Jombang', 'Islam', null, null, null, 'STD014-3195449894'),
('std015', '3186842031', 'KHABIB AL GHAZALI', 'L', '2018-08-20', 'Jombang', 'Islam', null, null, null, 'STD015-3186842031'),
('std016', '3186312047', 'MAHESA PUTRA', 'L', '2018-04-27', 'Jombang', 'Islam', null, null, null, 'STD016-3186312047'),
('std017', '3182675169', 'MELODY ZIANKA', 'P', '2018-12-29', 'Jombang', 'Islam', null, null, null, 'STD017-3182675169'),
('std018', '3189509345', 'MUHAMAD FATIKH AR ROKHIM', 'L', '2018-03-13', 'Jombang', 'Islam', null, null, null, 'STD018-3189509345'),
('std019', '3186946508', 'MUHAMMAD ANDRIAN RAMDHANI', 'L', '2018-06-29', 'Jombang', 'Islam', null, null, null, 'STD019-3186946508'),
('std020', '3185238652', 'MUHAMMAD AZKA DANIYAL ASSAYYIDI', 'L', '2018-09-07', 'Jombang', 'Islam', null, null, null, 'STD020-3185238652'),
('std021', '3182956126', 'MUHAMMAD FAREL RAMADHAN', 'L', '2018-05-20', 'Jombang', 'Islam', null, null, null, 'STD021-3182956126'),
('std022', '3184803391', 'MUHAMMAD RULLY RISQIANSYAH', 'L', '2018-08-25', 'Jombang', 'Islam', null, null, null, 'STD022-3184803391'),
('std023', '3182075457', 'NADYA SARAHLIA NAZAFARIN', 'P', '2018-06-25', 'Jombang', 'Islam', null, null, null, 'STD023-3182075457'),
('std024', '3189247944', 'NAURA SAFIRA PUTRI', 'P', '2018-11-21', 'Jombang', 'Islam', null, null, null, 'STD024-3189247944'),
('std025', '3180362309', 'SAFINA AN NAJAH', 'P', '2018-04-27', 'Jombang', 'Islam', null, null, null, 'STD025-3180362309'),
('std026', '3187195379', 'THALIA SOFEA ALINARAHMAN', 'P', '2018-05-01', 'Jombang', 'Islam', null, null, null, 'STD026-3187195379'),
('std027', '3175104470', 'AFIF SHURURI', 'L', '2017-04-16', 'Jombang', 'Islam', null, null, null, 'STD027-3175104470'),
('std028', '3185666508', 'AISYAH VANIA RAMADHANI', 'P', '2018-05-21', 'Jombang', 'Islam', null, null, null, 'STD028-3185666508'),
('std029', '3173100803', 'AMIRA EKA PUTRI', 'P', '2017-10-14', 'Jombang', 'Islam', null, null, null, 'STD029-3173100803'),
('std030', '3167441460', 'ANANDHITA AZAHRA', 'P', '2016-12-30', 'Jombang', 'Islam', null, null, null, 'STD030-3167441460'),
('std031', '3176799872', 'ANNISA SALMA AGUSTINA', 'P', '2017-08-15', 'Jombang', 'Islam', null, null, null, 'STD031-3176799872'),
('std032', '3188856854', 'ARVINO MAUZA ZULKARNAIN', 'L', '2018-01-19', 'Jombang', 'Islam', null, null, null, 'STD032-3188856854'),
('std033', '3179073027', 'AYU WILDA HAYATI PUTRI', 'P', '2017-12-27', 'Jombang', 'Islam', null, null, null, 'STD033-3179073027'),
('std034', '3175704342', 'AZRIL RAHANDIKA ALFARIQ', 'L', '2017-05-28', 'Jombang', 'Islam', null, null, null, 'STD034-3175704342'),
('std035', '3169403771', 'CANGGIH SUGIARTO', 'L', '2016-02-24', 'Jombang', 'Islam', null, null, null, 'STD035-3169403771'),
('std036', '3172097609', 'CHENIYA AMORA MARCHELLA PUTRI', 'P', '2017-03-31', 'Jombang', 'Islam', null, null, null, 'STD036-3172097609'),
('std037', '3172935346', 'DESSY NATALIA ANGGRAINI', 'P', '2017-12-23', 'Jombang', 'Islam', null, null, null, 'STD037-3172935346'),
('std038', '3172580173', 'DINDA KIRANA', 'P', '2017-07-07', 'Jombang', 'Islam', null, null, null, 'STD038-3172580173'),
('std039', '3176987443', 'FANDI AHSANUL DIANSYAH', 'L', '2017-05-22', 'Jombang', 'Islam', null, null, null, 'STD039-3176987443'),
('std040', '3176111530', 'FATIHAH SYIFAUS SYAUQI', 'P', '2017-05-18', 'Jombang', 'Islam', null, null, null, 'STD040-3176111530'),
('std041', '3177274404', 'FEBRYAN FATTAN NARENDRA', 'L', '2017-02-13', 'Jombang', 'Islam', null, null, null, 'STD041-3177274404'),
('std042', '3178955288', 'FEBRYAN HAIDAR SETIO', 'L', '2017-02-27', 'Jombang', 'Islam', null, null, null, 'STD042-3178955288'),
('std043', '3179135175', 'GIBRAN ARGA SAPUTRA', 'L', '2017-09-24', 'Jombang', 'Islam', null, null, null, 'STD043-3179135175'),
('std044', '3175538453', 'HAFIZH SHAKA MAULANA', 'L', '2017-04-23', 'Jombang', 'Islam', null, null, null, 'STD044-3175538453'),
('std045', '3169351646', 'KEVIN PRATAMA', 'L', '2016-12-31', 'Jombang', 'Islam', null, null, null, 'STD045-3169351646'),
('std046', '3178798711', 'MUCHAMMAD AKBAR FADZILAH', 'L', '2017-09-19', 'Jombang', 'Islam', null, null, null, 'STD046-3178798711'),
('std047', '3164721638', 'MUHAMMAD FAJRUL ALFIANSYAH', 'L', '2016-09-29', 'Jombang', 'Islam', null, null, null, 'STD047-3164721638'),
('std048', '3173980033', 'MUHAMMAD RADHIKA ADITYA', 'L', '2017-10-02', 'Jombang', 'Islam', null, null, null, 'STD048-3173980033'),
('std049', '3177039428', 'MUHAMMAD WAFI BILFAQIH', 'L', '2017-01-17', 'Jombang', 'Islam', null, null, null, 'STD049-3177039428'),
('std050', '3176945067', 'NAJWA NUR AZIZAH', 'P', '2017-09-03', 'Jombang', 'Islam', null, null, null, 'STD050-3176945067'),
('std051', '3189705496', 'RADEN NUR ROHMATULLOH HADIWIJAYA', 'L', '2018-01-01', 'Jombang', 'Islam', null, null, null, 'STD051-3189705496'),
('std052', '3161155472', 'REISHA TRI PANDUWINATA', 'P', '2016-12-22', 'Jombang', 'Islam', null, null, null, 'STD052-3161155472'),
('std053', '3173784670', 'SINTIA AINUR ROHMA', 'P', '2017-11-21', 'Jombang', 'Islam', null, null, null, 'STD053-3173784670'),
('std054', '3179858326', 'SITI WULANDARI', 'P', '2017-03-19', 'Jombang', 'Islam', null, null, null, 'STD054-3179858326'),
('std055', '3174791022', 'SYARIFA MARWAH MUFIDA', 'P', '2017-07-19', 'Jombang', 'Islam', null, null, null, 'STD055-3174791022'),
('std056', '3179501678', 'VIOLA PUTRI SUYUTI', 'P', '2017-11-28', 'Jombang', 'Islam', null, null, null, 'STD056-3179501678'),
('std057', '3172531256', 'WIJAYA AHMAD AFFATARIZ', 'L', '2017-10-31', 'Jombang', 'Islam', null, null, null, 'STD057-3172531256'),
('std058', '3174607631', 'ZAIM FELIQ HARDIN JUNIOR', 'L', '2017-10-15', 'Jombang', 'Islam', null, null, null, 'STD058-3174607631'),
('std059', '3164159623', 'Aditya Rifqi Hamizan', 'L', '2016-10-12', 'Jombang', 'Islam', null, null, null, 'STD059-3164159623'),
('std060', '3166213783', 'AHMAD HASAN', 'L', '2016-05-13', 'Jombang', 'Islam', null, null, null, 'STD060-3166213783'),
('std061', '3165107080', 'AHMAD HUSEN', 'L', '2016-05-13', 'Jombang', 'Islam', null, null, null, 'STD061-3165107080'),
('std062', '3165888028', 'ALIYAH KINANTI ADINDA PUTRI', 'P', '2016-01-19', 'Jombang', 'Islam', null, null, null, 'STD062-3165888028'),
('std063', '3162871098', 'ANISA AQILAH KHUMAIROH', 'P', '2016-09-05', 'Jombang', 'Islam', null, null, null, 'STD063-3162871098'),
('std064', '3168115306', 'ARCHELINE EMBUN AZZAHRA', 'P', '2016-12-28', 'Jombang', 'Islam', null, null, null, 'STD064-3168115306'),
('std065', '3169303719', 'ATHARAZKA TRY VALDINO PUTRA', 'L', '2016-09-26', 'Jombang', 'Islam', null, null, null, 'STD065-3169303719'),
('std066', '3166367892', 'BERBY MUFTA REGINA PUTRI', 'P', '2016-11-17', 'Jombang', 'Islam', null, null, null, 'STD066-3166367892'),
('std067', '3165721043', 'BILQIS RISQI ABRAR PUTRI', 'P', '2016-04-12', 'Jombang', 'Islam', null, null, null, 'STD067-3165721043'),
('std068', '3169973730', 'CITRA AYUDIAH MAHARANI', 'P', '2016-10-06', 'Jombang', 'Islam', null, null, null, 'STD068-3169973730'),
('std069', '3160034288', 'DEA NAFISA AULIA', 'P', '2016-04-03', 'Jombang', 'Islam', null, null, null, 'STD069-3160034288'),
('std070', '3158262470', 'DEWA TRISTAN AL FATTAH', 'L', '2015-10-01', 'Jombang', 'Islam', null, null, null, 'STD070-3158262470'),
('std071', '3165642428', 'DIMAS ADITYA', 'L', '2016-12-16', 'Jombang', 'Islam', null, null, null, 'STD071-3165642428'),
('std072', '3169065298', 'EISHA AZKADINA AFSHEEN', 'P', '2016-06-04', 'Jombang', 'Islam', null, null, null, 'STD072-3169065298'),
('std073', '0134047519', 'FARZANA AYRA SHEZA', 'P', '2016-05-26', 'Jombang', 'Islam', null, null, null, 'STD073-0134047519'),
('std074', '3162207124', 'FATHIR UMAR AL FAWWAZ', 'L', '2016-08-15', 'Jombang', 'Islam', null, null, null, 'STD074-3162207124'),
('std075', '3169366388', 'HAIDAR DAVID LUIS WIBOWO', 'L', '2016-04-30', 'Jombang', 'Islam', null, null, null, 'STD075-3169366388'),
('std076', '0165477775', 'JASMINE WILENTYA SANTIYAN', 'P', '2016-06-16', 'Jombang', 'Islam', null, null, null, 'STD076-0165477775'),
('std077', '3162371594', 'MOCH DANI ARDIANSYAH', 'L', '2016-01-02', 'Jombang', 'Islam', null, null, null, 'STD077-3162371594'),
('std078', '3157304605', 'MOCHAMAD IKHWAN ABIYU', 'L', '2015-11-11', 'Jombang', 'Islam', null, null, null, 'STD078-3157304605'),
('std079', '3166492669', 'NAURA AZZAHRA LAILA SAFITRI', 'P', '2016-07-05', 'Jombang', 'Islam', null, null, null, 'STD079-3166492669'),
('std080', '3165882098', 'NOVITA CALYA ATAILLA', 'P', '2016-04-06', 'Jombang', 'Islam', null, null, null, 'STD080-3165882098'),
('std081', '3163160333', 'Raisha Qaila Azzahra', 'P', '2016-07-21', 'Jombang', 'Islam', null, null, null, 'STD081-3163160333'),
('std082', '3162517080', 'SABERINA OKTAVIA SARI', 'P', '2016-10-03', 'Jombang', 'Islam', null, null, null, 'STD082-3162517080'),
('std083', '3160523170', 'SATRIA ABDUL RAFARDHAN', 'L', '2016-05-17', 'Jombang', 'Islam', null, null, null, 'STD083-3160523170'),
('std084', '3151268299', 'AFRAH ALIYAH PUTRI WIDODO', 'P', '2015-11-24', 'Jombang', 'Islam', null, null, null, 'STD084-3151268299'),
('std085', '0151673234', 'AFTA ALUN WAFA', 'L', '2015-02-04', 'Jombang', 'Islam', null, null, null, 'STD085-0151673234'),
('std086', '3151733874', 'AHMAD YUDA ALFIN', 'L', '2015-04-18', 'Jombang', 'Islam', null, null, null, 'STD086-3151733874'),
('std087', '3163910915', 'ANNADA FAJRIA SALSABILA', 'P', '2016-02-19', 'Jombang', 'Islam', null, null, null, 'STD087-3163910915'),
('std088', '3152979325', 'AQILA FARANISA PUTRI ANGGIANTO', 'P', '2015-12-10', 'Jombang', 'Islam', null, null, null, 'STD088-3152979325'),
('std089', '3167743646', 'AQILA PUTRI YULIANTO', 'P', '2016-05-09', 'Jombang', 'Islam', null, null, null, 'STD089-3167743646'),
('std090', '0136626215', 'ARIN NAYLA PUTRI', 'P', '2015-09-06', 'Jombang', 'Islam', null, null, null, 'STD090-0136626215'),
('std091', '3156473006', 'ASYIFA NAJLA QOTRUNADA', 'P', '2015-01-27', 'Jombang', 'Islam', null, null, null, 'STD091-3156473006'),
('std092', '0157778402', 'AVIKA HANUM SULKHA', 'P', '2015-03-12', 'Jombang', 'Islam', null, null, null, 'STD092-0157778402'),
('std093', '3161706830', 'BALQIS AZAHRA', 'P', '2016-02-10', 'Jombang', 'Islam', null, null, null, 'STD093-3161706830'),
('std094', '3152808128', 'DAVIN RAFFI SAPUTRA', 'L', '2015-05-26', 'Jombang', 'Islam', null, null, null, 'STD094-3152808128'),
('std095', '3159062469', 'ELDIAN DWI SYAHPUTRA', 'L', '2015-11-23', 'Jombang', 'Islam', null, null, null, 'STD095-3159062469'),
('std096', '0158009832', 'FABIAN HAFIZ AZIGHAH PRADANA', 'L', '2015-02-28', 'Jombang', 'Kristen', null, null, null, 'STD096-0158009832'),
('std097', '3153994028', 'FAHMI FAUZIL ''ADHIM', 'L', '2015-04-06', 'Jombang', 'Islam', null, null, null, 'STD097-3153994028'),
('std098', '0132560903', 'FIRMAN OKTA SETIAWAN', 'L', '2015-10-18', 'Jombang', 'Islam', null, null, null, 'STD098-0132560903'),
('std099', '3167173451', 'GANENDRA AKBAR ARDHANI', 'L', '2016-02-05', 'Jombang', 'Islam', null, null, null, 'STD099-3167173451'),
('std100', '3159445244', 'HAMEDA ARETA SETYA', 'P', '2015-02-05', 'Jombang', 'Islam', null, null, null, 'STD100-3159445244'),
('std101', '3151407402', 'JENAR ARYO SASONGKO', 'L', '2015-05-28', 'Jombang', 'Islam', null, null, null, 'STD101-3151407402'),
('std102', '3154057539', 'KANAYA RALINESYAH', 'P', '2015-11-27', 'Jombang', 'Islam', null, null, null, 'STD102-3154057539'),
('std103', '3157560664', 'MOZA YUDHA ADILEN', 'L', '2015-11-04', 'Jombang', 'Islam', null, null, null, 'STD103-3157560664'),
('std104', '3168159947', 'MUHAMMAD HUSEN', 'L', '2016-02-29', 'Jombang', 'Islam', null, null, null, 'STD104-3168159947'),
('std105', '3168418948', 'MUHAMMAD HUSIN', 'L', '2016-02-29', 'Jombang', 'Islam', null, null, null, 'STD105-3168418948'),
('std106', '0154667730', 'RAFFA ARELIAN HAFIZH', 'L', '2015-04-27', 'Jombang', 'Islam', null, null, null, 'STD106-0154667730'),
('std107', '0159681138', 'RESKY DWI RAMADHAN', 'L', '2015-07-08', 'Jombang', 'Islam', null, null, null, 'STD107-0159681138'),
('std108', '3159523943', 'SYAKILLA PERMATA ATMOJO', 'P', '2015-03-17', 'Jombang', 'Islam', null, null, null, 'STD108-3159523943'),
('std109', '0146281180', 'AISYAH PUTRI ANDINI', 'P', '2014-04-21', 'Jombang', 'Islam', null, null, null, 'STD109-0146281180'),
('std110', '0155402628', 'DINA AVIRA PUTRI', 'P', '2015-01-14', 'Jombang', 'Islam', null, null, null, 'STD110-0155402628'),
('std111', '0152132106', 'FAJRIL ARSYAD BRIANSYAH', 'L', '2015-02-08', 'Jombang', 'Islam', null, null, null, 'STD111-0152132106'),
('std112', '3149633442', 'FIKRI RAMADHAN PUTRA FERIANSYAH', 'L', '2014-07-28', 'Jombang', 'Islam', null, null, null, 'STD112-3149633442'),
('std113', '3143532245', 'IBNU HAFIZH', 'L', '2014-06-10', 'Jombang', 'Islam', null, null, null, 'STD113-3143532245'),
('std114', '0141294432', 'JEO PRADITA PUTRA', 'L', '2014-02-10', 'Jombang', 'Islam', null, null, null, 'STD114-0141294432'),
('std115', '0141007001', 'MAHIRA HASNA TAQIYYA', 'P', '2014-08-15', 'Jombang', 'Islam', null, null, null, 'STD115-0141007001'),
('std116', '0157851479', 'MAHIRA VIOLITA', 'P', '2015-01-14', 'Jombang', 'Islam', null, null, null, 'STD116-0157851479'),
('std117', '0145672249', 'MIFTAKHUL UKHYA', 'P', '2014-03-02', 'Jombang', 'Islam', null, null, null, 'STD117-0145672249'),
('std118', '0142108377', 'MOCHAMMAD WILDAN MUSYAFFA', 'L', '2014-07-17', 'Jombang', 'Islam', null, null, null, 'STD118-0142108377'),
('std119', '0149493184', 'MOHAMAD OKTA ALVIANSYAH', 'L', '2014-10-24', 'Jombang', 'Islam', null, null, null, 'STD119-0149493184'),
('std120', '3140824058', 'MUHAMMAD ABDUL HAFIZ RAMADHAN', 'L', '2014-07-01', 'Jombang', 'Islam', null, null, null, 'STD120-3140824058'),
('std121', '3144782799', 'MUHAMMAD AKMA YAFI LABIB', 'L', '2014-12-24', 'Jombang', 'Islam', null, null, null, 'STD121-3144782799'),
('std122', '3146374011', 'NAMANYA GENDHIS AYU MAYANGSARI', 'P', '2014-07-09', 'Jombang', 'Islam', null, null, null, 'STD122-3146374011'),
('std123', '0144960811', 'NUR HIKMAH', 'P', '2014-09-19', 'Jombang', 'Islam', null, null, null, 'STD123-0144960811'),
('std124', '3144341399', 'RAHADIAN FATTAH NUR-DZIKRI KURNIAWAN', 'L', '2014-06-07', 'Jombang', 'Islam', null, null, null, 'STD124-3144341399'),
('std125', '3143631827', 'RAHADIAN SYAHID NUR-DZIKRI KURNIAWAN', 'L', '2014-06-07', 'Jombang', 'Islam', null, null, null, 'STD125-3143631827'),
('std126', '0144989432', 'Rayyan Alvaro Rizal', 'L', '2014-04-04', 'Jombang', 'Islam', null, null, null, 'STD126-0144989432'),
('std127', '0143434849', 'SHAVA ALVIO MAY AZZAHRA', 'P', '2014-05-20', 'Jombang', 'Islam', null, null, null, 'STD127-0143434849'),
('std128', '0149694799', 'SIFFA AZZAHRA', 'P', '2014-03-22', 'Jombang', 'Islam', null, null, null, 'STD128-0149694799'),
('std129', '0144696190', 'VIRA ANANDA RAHMAH', 'P', '2014-05-29', 'Jombang', 'Islam', null, null, null, 'STD129-0144696190'),
('std130', '0142721597', 'ZASKIA ANATA UDIARTI', 'P', '2014-10-02', 'Jombang', 'Islam', null, null, null, 'STD130-0142721597'),
('std131', '0147403607', 'AISYAH NUR JANNAH', 'P', '2014-02-07', 'Jombang', 'Islam', null, null, null, 'STD131-0147403607'),
('std132', '3138443464', 'ALENNA EMILYA KHAN SABRINNA', 'P', '2013-11-06', 'Jombang', 'Islam', null, null, null, 'STD132-3138443464'),
('std133', '3131162579', 'ALFARIZY ARIK NORFIAN', 'L', '2013-05-21', 'Jombang', 'Islam', null, null, null, 'STD133-3131162579'),
('std134', '3134579629', 'AMEERA ZARANI ISKANDAR', 'P', '2013-04-22', 'Jombang', 'Islam', null, null, null, 'STD134-3134579629'),
('std135', '3139832530', 'ANINDITYA MULYA ZAHRA', 'P', '2013-03-04', 'Jombang', 'Islam', null, null, null, 'STD135-3139832530'),
('std136', '0135886783', 'AULIA NUR INAYAH', 'P', '2013-03-03', 'Jombang', 'Islam', null, null, null, 'STD136-0135886783'),
('std137', '0132333880', 'AYSA NUR ROHMAH PUTRI', 'P', '2013-12-11', 'Jombang', 'Islam', null, null, null, 'STD137-0132333880'),
('std138', '0137579754', 'DEVI RIZQI RAMADHANI', 'P', '2013-07-29', 'Jombang', 'Islam', null, null, null, 'STD138-0137579754'),
('std139', '0136466485', 'DIFAN DWI SASONGKO', 'L', '2013-08-14', 'Jombang', 'Islam', null, null, null, 'STD139-0136466485'),
('std140', '0131745072', 'DWI RAMADANI MUZAKIYAH', 'P', '2013-07-24', 'Jombang', 'Islam', null, null, null, 'STD140-0131745072'),
('std141', '0133156102', 'FAHRI AKBAR TRIANSANO', 'L', '2013-08-06', 'Jombang', 'Islam', null, null, null, 'STD141-0133156102'),
('std142', '3142894277', 'LAURA LETHISIA AGUSTINE', 'P', '2014-08-17', 'Jombang', 'Islam', null, null, null, 'STD142-3142894277'),
('std143', '0148136168', 'M. ARBY MAULANA', 'L', '2014-01-08', 'Jombang', 'Islam', null, null, null, 'STD143-0148136168'),
('std144', '3100663838', 'MEISYA NILAM CAHYA', 'P', '2010-05-23', 'Jombang', 'Islam', null, null, null, 'STD144-3100663838'),
('std145', '0134018793', 'MIKAYLA GIFTY AUZHORA', 'P', '2013-07-19', 'Jombang', 'Islam', null, null, null, 'STD145-0134018793'),
('std146', '0136236339', 'MOCH NAUFALDO DWIANDIKHA', 'L', '2013-06-02', 'Jombang', 'Islam', null, null, null, 'STD146-0136236339'),
('std147', '0135003741', 'MOCHAMMAD YUDISTIRA ADITYA WARDHANA', 'L', '2013-10-09', 'Jombang', 'Islam', null, null, null, 'STD147-0135003741'),
('std148', '0137312856', 'MUHAMAD VARREL VERZA VENO', 'L', '2013-06-27', 'Jombang', 'Islam', null, null, null, 'STD148-0137312856'),
('std149', '0139033637', 'MUHAMMAD ALFAN ALYANDRA', 'L', '2013-12-19', 'Jombang', 'Islam', null, null, null, 'STD149-0139033637'),
('std150', '3139763183', 'MUHAMMAD ARFA DWI HARIADI', 'L', '2013-05-21', 'Jombang', 'Islam', null, null, null, 'STD150-3139763183'),
('std151', '3139977641', 'MUHAMMAD ISMAIL', 'L', '2013-03-22', 'Jombang', 'Islam', null, null, null, 'STD151-3139977641'),
('std152', '0146534112', 'MUHAMMAD NADZRIL MAULITDIN', 'L', '2014-02-15', 'Jombang', 'Islam', null, null, null, 'STD152-0146534112'),
('std153', '0139158545', 'MUHAMMAD RIZKI APRILLIO', 'L', '2013-04-08', 'Jombang', 'Islam', null, null, null, 'STD153-0139158545'),
('std154', '0143523394', 'NAADHIROTUL MAULIDIYAH', 'P', '2014-01-05', 'Jombang', 'Islam', null, null, null, 'STD154-0143523394'),
('std155', '3148167736', 'NATHANIA CANTIKA MAHESWARI ELBIANTO', 'P', '2014-01-09', 'Jombang', 'Islam', null, null, null, 'STD155-3148167736'),
('std156', '0136275258', 'NOVIA SALMA RACHMAN', 'P', '2013-11-24', 'Jombang', 'Islam', null, null, null, 'STD156-0136275258'),
('std157', '0143198492', 'NURAINI FEBRIANTI', 'P', '2014-02-24', 'Jombang', 'Islam', null, null, null, 'STD157-0143198492'),
('std158', '0141146376', 'PRICILLA AKITS BINTI JAMIILUN', 'P', '2014-06-28', 'Jombang', 'Islam', null, null, null, 'STD158-0141146376'),
('std159', '0131415132', 'SEKAR ARUM', 'P', '2013-11-12', 'Jombang', 'Islam', null, null, null, 'STD159-0131415132'),
('std160', '0137762366', 'TSULITSTIA DLOHIROTUL ULUM', 'P', '2013-05-24', 'Jombang', 'Islam', null, null, null, 'STD160-0137762366'),
('std161', '3132032683', 'VINA PUJI RAHAYU', 'P', '2013-08-06', 'Jombang', 'Islam', null, null, null, 'STD161-3132032683')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. ROMBEL MEMBERSHIPS (Active Enrollments for 2026/2027)
-- ============================================================================
INSERT INTO rombel_memberships (id, student_id, rombel_id, status, entry_date) VALUES
('mem0001', 'std001', 'rmb2501', 'active', '2026-07-15'),
('mem0002', 'std002', 'rmb2501', 'active', '2026-07-15'),
('mem0003', 'std003', 'rmb2501', 'active', '2026-07-15'),
('mem0004', 'std004', 'rmb2501', 'active', '2026-07-15'),
('mem0005', 'std005', 'rmb2501', 'active', '2026-07-15'),
('mem0006', 'std006', 'rmb2501', 'active', '2026-07-15'),
('mem0007', 'std007', 'rmb2501', 'active', '2026-07-15'),
('mem0008', 'std008', 'rmb2501', 'active', '2026-07-15'),
('mem0009', 'std009', 'rmb2501', 'active', '2026-07-15'),
('mem0010', 'std010', 'rmb2501', 'active', '2026-07-15'),
('mem0011', 'std011', 'rmb2501', 'active', '2026-07-15'),
('mem0012', 'std012', 'rmb2501', 'active', '2026-07-15'),
('mem0013', 'std013', 'rmb2501', 'active', '2026-07-15'),
('mem0014', 'std014', 'rmb2501', 'active', '2026-07-15'),
('mem0015', 'std015', 'rmb2501', 'active', '2026-07-15'),
('mem0016', 'std016', 'rmb2501', 'active', '2026-07-15'),
('mem0017', 'std017', 'rmb2501', 'active', '2026-07-15'),
('mem0018', 'std018', 'rmb2501', 'active', '2026-07-15'),
('mem0019', 'std019', 'rmb2501', 'active', '2026-07-15'),
('mem0020', 'std020', 'rmb2501', 'active', '2026-07-15'),
('mem0021', 'std021', 'rmb2501', 'active', '2026-07-15'),
('mem0022', 'std022', 'rmb2501', 'active', '2026-07-15'),
('mem0023', 'std023', 'rmb2501', 'active', '2026-07-15'),
('mem0024', 'std024', 'rmb2501', 'active', '2026-07-15'),
('mem0025', 'std025', 'rmb2501', 'active', '2026-07-15'),
('mem0026', 'std026', 'rmb2501', 'active', '2026-07-15'),
('mem0027', 'std027', 'rmb2402', 'active', '2026-07-15'),
('mem0028', 'std028', 'rmb2402', 'active', '2026-07-15'),
('mem0029', 'std029', 'rmb2402', 'active', '2026-07-15'),
('mem0030', 'std030', 'rmb2402', 'active', '2026-07-15'),
('mem0031', 'std031', 'rmb2402', 'active', '2026-07-15'),
('mem0032', 'std032', 'rmb2402', 'active', '2026-07-15'),
('mem0033', 'std033', 'rmb2402', 'active', '2026-07-15'),
('mem0034', 'std034', 'rmb2402', 'active', '2026-07-15'),
('mem0035', 'std035', 'rmb2402', 'active', '2026-07-15'),
('mem0036', 'std036', 'rmb2402', 'active', '2026-07-15'),
('mem0037', 'std037', 'rmb2402', 'active', '2026-07-15'),
('mem0038', 'std038', 'rmb2402', 'active', '2026-07-15'),
('mem0039', 'std039', 'rmb2402', 'active', '2026-07-15'),
('mem0040', 'std040', 'rmb2402', 'active', '2026-07-15'),
('mem0041', 'std041', 'rmb2402', 'active', '2026-07-15'),
('mem0042', 'std042', 'rmb2402', 'active', '2026-07-15'),
('mem0043', 'std043', 'rmb2402', 'active', '2026-07-15'),
('mem0044', 'std044', 'rmb2402', 'active', '2026-07-15'),
('mem0045', 'std045', 'rmb2402', 'active', '2026-07-15'),
('mem0046', 'std046', 'rmb2402', 'active', '2026-07-15'),
('mem0047', 'std047', 'rmb2402', 'active', '2026-07-15'),
('mem0048', 'std048', 'rmb2402', 'active', '2026-07-15'),
('mem0049', 'std049', 'rmb2402', 'active', '2026-07-15'),
('mem0050', 'std050', 'rmb2402', 'active', '2026-07-15'),
('mem0051', 'std051', 'rmb2402', 'active', '2026-07-15'),
('mem0052', 'std052', 'rmb2402', 'active', '2026-07-15'),
('mem0053', 'std053', 'rmb2402', 'active', '2026-07-15'),
('mem0054', 'std054', 'rmb2402', 'active', '2026-07-15'),
('mem0055', 'std055', 'rmb2402', 'active', '2026-07-15'),
('mem0056', 'std056', 'rmb2402', 'active', '2026-07-15'),
('mem0057', 'std057', 'rmb2402', 'active', '2026-07-15'),
('mem0058', 'std058', 'rmb2402', 'active', '2026-07-15'),
('mem0059', 'std059', 'rmb2303', 'active', '2026-07-15'),
('mem0060', 'std060', 'rmb2303', 'active', '2026-07-15'),
('mem0061', 'std061', 'rmb2303', 'active', '2026-07-15'),
('mem0062', 'std062', 'rmb2303', 'active', '2026-07-15'),
('mem0063', 'std063', 'rmb2303', 'active', '2026-07-15'),
('mem0064', 'std064', 'rmb2303', 'active', '2026-07-15'),
('mem0065', 'std065', 'rmb2303', 'active', '2026-07-15'),
('mem0066', 'std066', 'rmb2303', 'active', '2026-07-15'),
('mem0067', 'std067', 'rmb2303', 'active', '2026-07-15'),
('mem0068', 'std068', 'rmb2303', 'active', '2026-07-15'),
('mem0069', 'std069', 'rmb2303', 'active', '2026-07-15'),
('mem0070', 'std070', 'rmb2303', 'active', '2026-07-15'),
('mem0071', 'std071', 'rmb2303', 'active', '2026-07-15'),
('mem0072', 'std072', 'rmb2303', 'active', '2026-07-15'),
('mem0073', 'std073', 'rmb2303', 'active', '2026-07-15'),
('mem0074', 'std074', 'rmb2303', 'active', '2026-07-15'),
('mem0075', 'std075', 'rmb2303', 'active', '2026-07-15'),
('mem0076', 'std076', 'rmb2303', 'active', '2026-07-15'),
('mem0077', 'std077', 'rmb2303', 'active', '2026-07-15'),
('mem0078', 'std078', 'rmb2303', 'active', '2026-07-15'),
('mem0079', 'std079', 'rmb2303', 'active', '2026-07-15'),
('mem0080', 'std080', 'rmb2303', 'active', '2026-07-15'),
('mem0081', 'std081', 'rmb2303', 'active', '2026-07-15'),
('mem0082', 'std082', 'rmb2303', 'active', '2026-07-15'),
('mem0083', 'std083', 'rmb2303', 'active', '2026-07-15'),
('mem0084', 'std084', 'rmb2204', 'active', '2026-07-15'),
('mem0085', 'std085', 'rmb2204', 'active', '2026-07-15'),
('mem0086', 'std086', 'rmb2204', 'active', '2026-07-15'),
('mem0087', 'std087', 'rmb2204', 'active', '2026-07-15'),
('mem0088', 'std088', 'rmb2204', 'active', '2026-07-15'),
('mem0089', 'std089', 'rmb2204', 'active', '2026-07-15'),
('mem0090', 'std090', 'rmb2204', 'active', '2026-07-15'),
('mem0091', 'std091', 'rmb2204', 'active', '2026-07-15'),
('mem0092', 'std092', 'rmb2204', 'active', '2026-07-15'),
('mem0093', 'std093', 'rmb2204', 'active', '2026-07-15'),
('mem0094', 'std094', 'rmb2204', 'active', '2026-07-15'),
('mem0095', 'std095', 'rmb2204', 'active', '2026-07-15'),
('mem0096', 'std096', 'rmb2204', 'active', '2026-07-15'),
('mem0097', 'std097', 'rmb2204', 'active', '2026-07-15'),
('mem0098', 'std098', 'rmb2204', 'active', '2026-07-15'),
('mem0099', 'std099', 'rmb2204', 'active', '2026-07-15'),
('mem0100', 'std100', 'rmb2204', 'active', '2026-07-15'),
('mem0101', 'std101', 'rmb2204', 'active', '2026-07-15'),
('mem0102', 'std102', 'rmb2204', 'active', '2026-07-15'),
('mem0103', 'std103', 'rmb2204', 'active', '2026-07-15'),
('mem0104', 'std104', 'rmb2204', 'active', '2026-07-15'),
('mem0105', 'std105', 'rmb2204', 'active', '2026-07-15'),
('mem0106', 'std106', 'rmb2204', 'active', '2026-07-15'),
('mem0107', 'std107', 'rmb2204', 'active', '2026-07-15'),
('mem0108', 'std108', 'rmb2204', 'active', '2026-07-15'),
('mem0109', 'std109', 'rmb2105', 'active', '2026-07-15'),
('mem0110', 'std110', 'rmb2105', 'active', '2026-07-15'),
('mem0111', 'std111', 'rmb2105', 'active', '2026-07-15'),
('mem0112', 'std112', 'rmb2105', 'active', '2026-07-15'),
('mem0113', 'std113', 'rmb2105', 'active', '2026-07-15'),
('mem0114', 'std114', 'rmb2105', 'active', '2026-07-15'),
('mem0115', 'std115', 'rmb2105', 'active', '2026-07-15'),
('mem0116', 'std116', 'rmb2105', 'active', '2026-07-15'),
('mem0117', 'std117', 'rmb2105', 'active', '2026-07-15'),
('mem0118', 'std118', 'rmb2105', 'active', '2026-07-15'),
('mem0119', 'std119', 'rmb2105', 'active', '2026-07-15'),
('mem0120', 'std120', 'rmb2105', 'active', '2026-07-15'),
('mem0121', 'std121', 'rmb2105', 'active', '2026-07-15'),
('mem0122', 'std122', 'rmb2105', 'active', '2026-07-15'),
('mem0123', 'std123', 'rmb2105', 'active', '2026-07-15'),
('mem0124', 'std124', 'rmb2105', 'active', '2026-07-15'),
('mem0125', 'std125', 'rmb2105', 'active', '2026-07-15'),
('mem0126', 'std126', 'rmb2105', 'active', '2026-07-15'),
('mem0127', 'std127', 'rmb2105', 'active', '2026-07-15'),
('mem0128', 'std128', 'rmb2105', 'active', '2026-07-15'),
('mem0129', 'std129', 'rmb2105', 'active', '2026-07-15'),
('mem0130', 'std130', 'rmb2105', 'active', '2026-07-15'),
('mem0131', 'std131', 'rmb2006', 'active', '2026-07-15'),
('mem0132', 'std132', 'rmb2006', 'active', '2026-07-15'),
('mem0133', 'std133', 'rmb2006', 'active', '2026-07-15'),
('mem0134', 'std134', 'rmb2006', 'active', '2026-07-15'),
('mem0135', 'std135', 'rmb2006', 'active', '2026-07-15'),
('mem0136', 'std136', 'rmb2006', 'active', '2026-07-15'),
('mem0137', 'std137', 'rmb2006', 'active', '2026-07-15'),
('mem0138', 'std138', 'rmb2006', 'active', '2026-07-15'),
('mem0139', 'std139', 'rmb2006', 'active', '2026-07-15'),
('mem0140', 'std140', 'rmb2006', 'active', '2026-07-15'),
('mem0141', 'std141', 'rmb2006', 'active', '2026-07-15'),
('mem0142', 'std142', 'rmb2006', 'active', '2026-07-15'),
('mem0143', 'std143', 'rmb2006', 'active', '2026-07-15'),
('mem0144', 'std144', 'rmb2006', 'active', '2026-07-15'),
('mem0145', 'std145', 'rmb2006', 'active', '2026-07-15'),
('mem0146', 'std146', 'rmb2006', 'active', '2026-07-15'),
('mem0147', 'std147', 'rmb2006', 'active', '2026-07-15'),
('mem0148', 'std148', 'rmb2006', 'active', '2026-07-15'),
('mem0149', 'std149', 'rmb2006', 'active', '2026-07-15'),
('mem0150', 'std150', 'rmb2006', 'active', '2026-07-15'),
('mem0151', 'std151', 'rmb2006', 'active', '2026-07-15'),
('mem0152', 'std152', 'rmb2006', 'active', '2026-07-15'),
('mem0153', 'std153', 'rmb2006', 'active', '2026-07-15'),
('mem0154', 'std154', 'rmb2006', 'active', '2026-07-15'),
('mem0155', 'std155', 'rmb2006', 'active', '2026-07-15'),
('mem0156', 'std156', 'rmb2006', 'active', '2026-07-15'),
('mem0157', 'std157', 'rmb2006', 'active', '2026-07-15'),
('mem0158', 'std158', 'rmb2006', 'active', '2026-07-15'),
('mem0159', 'std159', 'rmb2006', 'active', '2026-07-15'),
('mem0160', 'std160', 'rmb2006', 'active', '2026-07-15'),
('mem0161', 'std161', 'rmb2006', 'active', '2026-07-15')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. USERS (Sample Authentication Accounts)
-- ============================================================================
INSERT INTO users (id, username, password_hash, role, teacher_id, is_active) VALUES
('usr001', 'admin', '$2b$10$rKZLvXCH0y0fMjhxKzGqTONfZ5vHQJqX5qHJ9J5qKZLvXCH0y0fMj', 'admin', NULL, true),
('usr002', 'siti.aminah', '$2b$10$rKZLvXCH0y0fMjhxKzGqTONfZ5vHQJqX5qHJ9J5qKZLvXCH0y0fMj', 'principal', 'tch001', true),
('usr003', 'ahmad.yusuf', '$2b$10$rKZLvXCH0y0fMjhxKzGqTONfZ5vHQJqX5qHJ9J5qKZLvXCH0y0fMj', 'teacher', 'tch002', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VALIDATION QUERIES (To verify data integrity)
-- ============================================================================

-- Total students per rombel
SELECT
  r.grade_level,
  r.class_name,
  COUNT(rm.student_id) as total_students
FROM rombels r
LEFT JOIN rombel_memberships rm ON r.id = rm.rombel_id AND rm.status = 'active'
WHERE r.academic_year_id = 'ay2026'
GROUP BY r.grade_level, r.class_name
ORDER BY r.grade_level, r.class_name;

-- Students with their current class
SELECT
  s.nisn,
  s.full_name,
  r.grade_level,
  r.class_name,
  t.full_name as wali_teacher
FROM students s
JOIN rombel_memberships rm ON s.id = rm.student_id
JOIN rombels r ON rm.rombel_id = r.id
JOIN teachers t ON r.wali_teacher_id = t.id
WHERE rm.status = 'active'
ORDER BY r.grade_level, r.class_name, s.full_name;
