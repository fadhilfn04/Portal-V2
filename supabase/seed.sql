-- ============================================================
-- PORTAL PEDUATEL — Sample Data Seed
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. STORAGE BUCKET SETUP
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','image/avif']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read article images" ON storage.objects
  FOR SELECT USING (bucket_id = 'article-images');

CREATE POLICY "Admins upload article images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'article-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','editor')
    )
  );

CREATE POLICY "Admins delete article images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'article-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','editor')
    )
  );

-- ============================================================
-- 2. ARTICLES — 2 per category, realistic Indonesian content
--    Gambar: Unsplash (sudah di remotePatterns Next.js)
-- ============================================================

-- ── BERITA PUSAT ─────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Rapat Kerja Nasional PeduaTel 2026: Perkuat Silaturahmi dan Sinergi Organisasi',
  'rakornas-peduatel-2026',
  'DPP PeduaTel menyelenggarakan Rapat Kerja Nasional yang dihadiri perwakilan dari seluruh cabang se-Indonesia untuk merumuskan program kerja strategis tahun 2026.',
  'DPP PeduaTel menyelenggarakan Rapat Kerja Nasional yang dihadiri lebih dari 500 peserta dari 34 provinsi. Ketua Umum DPP PeduaTel dalam sambutannya menekankan pentingnya penguatan solidaritas dan sinergi antar cabang dalam menghadapi berbagai tantangan di era digital ini. Rakornas menghasilkan beberapa keputusan strategis, di antaranya peningkatan layanan digital melalui portal ini, penguatan program kesehatan bagi anggota, serta peningkatan koordinasi dengan Dana Pensiun Telkom untuk memastikan kesejahteraan seluruh pensiunan. Acara ditutup dengan sesi foto bersama dan ramah tamah yang mempererat tali silaturahmi.',
  '<p>Dewan Pimpinan Pusat (DPP) Persatuan Pensiunan Telekomunikasi Indonesia (PeduaTel) telah sukses menyelenggarakan Rapat Kerja Nasional (Rakornas) 2026 yang berlangsung selama dua hari di Jakarta. Acara ini dihadiri lebih dari 500 peserta yang merupakan perwakilan dari seluruh cabang PeduaTel di 34 provinsi se-Indonesia.</p><p>Ketua Umum DPP PeduaTel dalam sambutannya menekankan pentingnya penguatan solidaritas dan sinergi antar cabang dalam menghadapi berbagai tantangan di era digital ini. "Kita harus terus bergerak bersama, saling mendukung, dan memastikan bahwa setiap anggota PeduaTel mendapatkan pelayanan dan informasi terbaik," ujarnya.</p><p>Rakornas menghasilkan beberapa keputusan strategis yang akan menjadi pedoman program kerja selama setahun ke depan: peningkatan layanan digital, penguatan program kesehatan bagi anggota, dan peningkatan koordinasi dengan Dana Pensiun Telkom (Dapentel) untuk kesejahteraan seluruh pensiunan.</p><p>Acara ditutup dengan sesi foto bersama dan ramah tamah yang semakin mempererat tali silaturahmi di antara sesama anggota PeduaTel dari berbagai penjuru Indonesia.</p>',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1200&q=80',
  'Rapat Kerja Nasional PeduaTel 2026',
  c.id, 'published', TRUE, 1247, 89, 4, NOW() - INTERVAL '3 days'
FROM public.categories c WHERE c.slug = 'berita-pusat'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['rakornas','organisasi','program-kerja']) AS t(tag)
WHERE a.slug = 'rakornas-peduatel-2026' ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Pengurus Baru PeduaTel Periode 2026–2029 Resmi Dilantik di Jakarta',
  'pelantikan-pengurus-baru-2026',
  'Sebanyak 45 pengurus baru DPP PeduaTel periode 2026–2029 resmi dilantik dalam upacara khidmat di Gedung Grha Telkom Jakarta, menandai babak baru kepemimpinan organisasi.',
  'Sebanyak 45 pengurus baru DPP PeduaTel untuk periode 2026–2029 resmi dilantik di Gedung Grha Telkom, Jakarta Selatan. Pelantikan dipimpin langsung oleh Ketua Umum terpilih dan disaksikan ratusan anggota PeduaTel dari berbagai daerah. Ketua Umum terpilih menyampaikan visi dan misi yang berfokus pada tiga pilar utama: kesejahteraan anggota, penguatan digital, dan keberlanjutan organisasi. Salah satu program unggulan yang segera diluncurkan adalah portal digital PeduaTel yang memudahkan anggota mengakses informasi terkini, kegiatan organisasi, serta layanan konsultasi kesehatan dan keuangan pensiun secara online.',
  '<p>Sebanyak 45 orang pengurus baru Dewan Pimpinan Pusat (DPP) PeduaTel untuk periode 2026–2029 resmi dilantik dalam sebuah upacara penuh kekhidmatan di Gedung Grha Telkom, Jakarta Selatan. Pelantikan dipimpin langsung oleh Ketua Umum terpilih dan disaksikan oleh ratusan anggota PeduaTel dari berbagai daerah.</p><p>Dalam sambutannya, Ketua Umum terpilih menyampaikan visi dan misi kepengurusan baru yang berfokus pada tiga pilar utama: kesejahteraan anggota, penguatan digital, dan keberlanjutan organisasi. "Kami berkomitmen untuk memberikan yang terbaik bagi seluruh anggota PeduaTel di seluruh penjuru Indonesia," tegasnya.</p><p>Salah satu program unggulan yang akan segera diluncurkan adalah portal digital PeduaTel yang memudahkan anggota mengakses informasi terkini, kegiatan organisasi, serta layanan konsultasi kesehatan dan keuangan pensiun secara online.</p>',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  'Pelantikan Pengurus Baru PeduaTel 2026',
  c.id, 'published', FALSE, 876, 54, 3, NOW() - INTERVAL '8 days'
FROM public.categories c WHERE c.slug = 'berita-pusat'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['pelantikan','pengurus-baru','dpp-peduatel']) AS t(tag)
WHERE a.slug = 'pelantikan-pengurus-baru-2026' ON CONFLICT DO NOTHING;

-- ── BERITA DAERAH ────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'PeduaTel Cabang Jakarta Gelar Halal Bihalal 2026 yang Meriah dan Penuh Keakraban',
  'halal-bihalal-jakarta-2026',
  'PeduaTel Cabang Jakarta menyelenggarakan acara Halal Bihalal yang dihadiri lebih dari 300 anggota beserta keluarga, mempererat tali silaturahmi di antara sesama pensiunan Telkom di wilayah Jakarta.',
  'PeduaTel Cabang Jakarta sukses menyelenggarakan acara Halal Bihalal 2026 di Ballroom Hotel Sahid Jaya, Jakarta Pusat. Acara dihadiri lebih dari 300 anggota beserta keluarga dari berbagai wilayah Jakarta dan sekitarnya. Ketua PeduaTel Cabang Jakarta menyampaikan bahwa acara tahunan ini merupakan momentum berharga untuk mempererat tali silaturahmi. Acara berlangsung meriah, dimulai dengan tausiyah dari ustaz kondang, dilanjutkan makan siang bersama, hiburan dari grup musik internal PeduaTel Jakarta, serta pembagian doorprize menarik.',
  '<p>Persatuan Pensiunan Telekomunikasi Indonesia (PeduaTel) Cabang Jakarta sukses menyelenggarakan acara Halal Bihalal 2026 yang berlangsung di Ballroom Hotel Sahid Jaya, Jakarta Pusat. Acara yang dimulai pukul 10.00 WIB ini dihadiri lebih dari 300 anggota beserta keluarga dari berbagai wilayah Jakarta dan sekitarnya.</p><p>Ketua PeduaTel Cabang Jakarta menyampaikan bahwa acara tahunan ini merupakan momentum sangat berharga untuk mempererat tali silaturahmi di antara sesama pensiunan Telkom. "Walaupun kita sudah tidak lagi aktif bekerja, tetapi semangat kebersamaan kita tetap harus terjaga," ujarnya dalam sambutan pembukaan.</p><p>Acara berlangsung sangat meriah, dimulai dengan tausiyah dari ustaz kondang, dilanjutkan dengan makan siang bersama, hiburan dari grup musik internal PeduaTel Jakarta, serta pembagian doorprize menarik. Tak sedikit anggota yang memanfaatkan momen ini untuk bertemu kembali dengan rekan-rekan lama semasa bertugas di Telkom.</p>',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  'Halal Bihalal PeduaTel Jakarta 2026',
  c.id, 'published', TRUE, 934, 71, 3, NOW() - INTERVAL '5 days'
FROM public.categories c WHERE c.slug = 'berita-daerah'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['jakarta','halal-bihalal','silaturahmi']) AS t(tag)
WHERE a.slug = 'halal-bihalal-jakarta-2026' ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'PeduaTel Jawa Barat Salurkan Bantuan Sembako kepada 200 Anggota yang Membutuhkan',
  'bantuan-sembako-jabar-2026',
  'Dalam rangka kepedulian sosial, PeduaTel Cabang Jawa Barat menyalurkan paket bantuan sembako senilai total Rp 60 juta kepada 200 anggota yang membutuhkan di wilayah Bandung dan sekitarnya.',
  'Pengurus PeduaTel Cabang Jawa Barat menyalurkan paket bantuan sembako kepada 200 anggota kurang mampu di wilayah Bandung Raya dan sekitarnya. Program sosial ini merupakan realisasi dari program kerja bidang sosial PeduaTel Jawa Barat tahun 2026. Setiap paket berisi beras 5 kg, minyak goreng 2 liter, gula pasir 2 kg, tepung terigu 1 kg, dan berbagai kebutuhan pokok lainnya. Total nilai bantuan yang disalurkan mencapai Rp 60 juta yang bersumber dari iuran anggota dan sumbangan sukarela pengurus.',
  '<p>Dalam wujud nyata kepedulian terhadap sesama anggota, Pengurus PeduaTel Cabang Jawa Barat menyalurkan paket bantuan sembako kepada 200 anggota yang kurang mampu di wilayah Bandung Raya dan sekitarnya. Program sosial ini merupakan salah satu realisasi dari program kerja bidang sosial PeduaTel Jawa Barat tahun 2026.</p><p>Ketua PeduaTel Cabang Jawa Barat menjelaskan bahwa setiap paket bantuan berisi beras 5 kg, minyak goreng 2 liter, gula pasir 2 kg, tepung terigu 1 kg, dan berbagai kebutuhan pokok lainnya. Total nilai bantuan yang disalurkan mencapai Rp 60 juta yang bersumber dari iuran anggota dan sumbangan sukarela pengurus.</p><p>"Kami berharap bantuan ini dapat sedikit meringankan beban saudara-saudara kita yang membutuhkan. Kebersamaan dan gotong royong adalah nilai yang selalu kami jaga dalam organisasi ini," tuturnya.</p>',
  'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1200&q=80',
  'Bantuan Sembako PeduaTel Jawa Barat',
  c.id, 'published', FALSE, 612, 48, 3, NOW() - INTERVAL '14 days'
FROM public.categories c WHERE c.slug = 'berita-daerah'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['jawa-barat','bantuan-sosial','sembako']) AS t(tag)
WHERE a.slug = 'bantuan-sembako-jabar-2026' ON CONFLICT DO NOTHING;

-- ── KEGIATAN ─────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Senam Bersama Rutin PeduaTel: Aktif Bergerak Demi Kesehatan di Usia Emas',
  'senam-bersama-rutin-peduatel',
  'Program senam bersama rutin yang diselenggarakan PeduaTel setiap Jumat pagi semakin diminati. Lebih dari 150 anggota hadir setiap minggunya untuk berolahraga bersama dan menjaga kebugaran.',
  'Program senam bersama yang diinisiasi DPP PeduaTel terus menunjukkan antusiasme luar biasa dari para anggota. Setiap Jumat pagi pukul 07.00–08.30 WIB, Lapangan Olahraga Grha Telkom Jakarta dipenuhi ratusan pensiunan Telkom yang bersemangat mengikuti senam aerobik dan senam lansia yang dipimpin instruktur berpengalaman. Setelah sesi senam, para peserta biasanya duduk bersama untuk sarapan ringan sambil bersosialisasi. Program ini juga telah menginspirasi beberapa cabang daerah untuk menyelenggarakan kegiatan serupa di wilayah masing-masing.',
  '<p>Program senam bersama yang diinisiasi oleh DPP PeduaTel terus menunjukkan antusiasme yang luar biasa dari para anggota. Setiap Jumat pagi pukul 07.00–08.30 WIB, Lapangan Olahraga Grha Telkom Jakarta dipenuhi oleh ratusan pensiunan Telkom yang bersemangat mengikuti senam aerobik dan senam lansia yang dipimpin oleh instruktur berpengalaman.</p><p>"Awalnya hanya diikuti 30–40 orang, tapi sekarang sudah lebih dari 150 peserta tetap setiap minggunya. Ini membuktikan bahwa anggota PeduaTel sangat peduli dengan kesehatannya," ungkap koordinator kegiatan.</p><p>Setelah sesi senam, para peserta biasanya duduk bersama untuk sarapan ringan sambil bersosialisasi. Momen ini menjadi ajang silaturahmi yang sangat berharga. Program ini juga telah menginspirasi beberapa cabang daerah untuk menyelenggarakan kegiatan serupa di wilayah masing-masing.</p>',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
  'Senam Bersama Rutin PeduaTel',
  c.id, 'published', TRUE, 1089, 92, 3, NOW() - INTERVAL '1 day'
FROM public.categories c WHERE c.slug = 'kegiatan'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['senam','olahraga','kesehatan','kegiatan-rutin']) AS t(tag)
WHERE a.slug = 'senam-bersama-rutin-peduatel' ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Wisata Keluarga Besar PeduaTel ke Kawasan Puncak Bogor: Momen Tak Terlupakan',
  'wisata-keluarga-puncak-bogor-2026',
  'Ratusan anggota PeduaTel bersama keluarga menikmati perjalanan wisata ke kawasan Puncak Bogor yang sejuk dan indah untuk memperkuat kebersamaan dan memberikan kesempatan refreshing bagi para pensiunan.',
  'Sebanyak 12 bus penuh mengangkut ratusan anggota PeduaTel beserta keluarga untuk menikmati wisata ke kawasan Puncak Bogor yang terkenal dengan udaranya yang sejuk dan pemandangan indah. Rombongan mengunjungi beberapa destinasi wisata unggulan, termasuk Kebun Teh Gunung Mas, Taman Safari Indonesia, dan Pasar Cibodas. Para anggota sangat menikmati perjalanan ini, banyak yang memanfaatkan kesempatan untuk berfoto bersama keluarga di berbagai spot yang indah.',
  '<p>Sebanyak 12 bus penuh mengangkut ratusan anggota PeduaTel beserta keluarga untuk menikmati wisata ke kawasan Puncak Bogor yang terkenal dengan udaranya yang sejuk dan pemandangan yang indah. Kegiatan rekreasi ini diselenggarakan oleh Bidang Sosial dan Budaya DPP PeduaTel.</p><p>Rombongan mengunjungi beberapa destinasi wisata unggulan di kawasan Puncak, termasuk Kebun Teh Gunung Mas, Taman Safari Indonesia, dan Pasar Cibodas. Para anggota terlihat sangat menikmati perjalanan ini, banyak yang memanfaatkan kesempatan untuk berfoto bersama keluarga di berbagai spot yang indah.</p><p>"Kegiatan seperti ini sangat penting untuk menjaga kesehatan jiwa dan raga. Ketika pikiran segar, tubuh pun akan lebih sehat," ujar salah satu anggota yang ikut serta bersama istri dan cucu-cucunya.</p>',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
  'Wisata PeduaTel ke Puncak Bogor',
  c.id, 'published', FALSE, 743, 62, 3, NOW() - INTERVAL '21 days'
FROM public.categories c WHERE c.slug = 'kegiatan'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['wisata','puncak-bogor','rekreasi','keluarga']) AS t(tag)
WHERE a.slug = 'wisata-keluarga-puncak-bogor-2026' ON CONFLICT DO NOTHING;

-- ── KESEHATAN ────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Pemeriksaan Kesehatan Gratis: PeduaTel Peduli Kesehatan Seluruh Anggotanya',
  'pemeriksaan-kesehatan-gratis-peduatel',
  'PeduaTel bekerja sama dengan RS Telkom dan Klinik Mitra menyelenggarakan program pemeriksaan kesehatan gratis bagi seluruh anggota, mencakup cek darah lengkap, tekanan darah, EKG, dan konsultasi dokter.',
  'DPP PeduaTel bekerja sama dengan Rumah Sakit Telkom dan 15 Klinik Mitra di seluruh Indonesia menyelenggarakan Program Pemeriksaan Kesehatan Gratis 2026. Program ini tersedia bagi seluruh anggota PeduaTel aktif beserta pasangan tanpa dipungut biaya apapun. Layanan yang tersedia meliputi pemeriksaan darah lengkap, tekanan darah, elektrokardiogram (EKG) untuk jantung, konsultasi dokter umum, serta rujukan ke spesialis jika diperlukan. Untuk mengikuti program ini, anggota cukup membawa kartu anggota PeduaTel yang masih aktif.',
  '<p>Dalam rangka meningkatkan kualitas kesehatan anggota, DPP PeduaTel bekerja sama dengan Rumah Sakit Telkom dan 15 Klinik Mitra di seluruh Indonesia menyelenggarakan Program Pemeriksaan Kesehatan Gratis 2026. Program ini tersedia bagi seluruh anggota PeduaTel aktif beserta pasangan (suami/istri) tanpa dipungut biaya apapun.</p><p>Layanan yang tersedia dalam program ini meliputi: pemeriksaan darah lengkap (kadar gula, kolesterol, asam urat, hemoglobin), pemeriksaan tekanan darah, elektrokardiogram (EKG) untuk jantung, konsultasi dokter umum, serta rujukan ke spesialis jika diperlukan. Untuk mengikuti program ini, anggota cukup membawa kartu anggota PeduaTel yang masih aktif.</p><p>"Dengan deteksi dini, banyak penyakit yang bisa dicegah atau ditangani lebih efektif. Kami berkomitmen untuk terus hadir melayani kesehatan anggota PeduaTel," jelas Ketua Bidang Kesehatan DPP PeduaTel.</p>',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1200&q=80',
  'Pemeriksaan Kesehatan Gratis PeduaTel',
  c.id, 'published', FALSE, 1456, 113, 3, NOW() - INTERVAL '4 days'
FROM public.categories c WHERE c.slug = 'kesehatan'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['kesehatan','pemeriksaan-gratis','rs-telkom']) AS t(tag)
WHERE a.slug = 'pemeriksaan-kesehatan-gratis-peduatel' ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  '10 Tips Hidup Sehat untuk Pensiunan: Panduan Lengkap di Usia 60 Tahun ke Atas',
  'tips-hidup-sehat-pensiunan-60-plus',
  'Memasuki masa pensiun bukan berarti aktivitas berhenti. Justru ini saatnya menjaga kesehatan lebih serius. Berikut 10 tips praktis dari dokter spesialis untuk tetap sehat, aktif, dan bahagia di usia 60+.',
  'Memasuki usia 60 tahun ke atas, tubuh kita memerlukan perhatian dan perawatan yang lebih intensif. Dengan gaya hidup yang tepat, kualitas hidup di masa pensiun bisa tetap prima. Tips pertama: tetap aktif bergerak minimal 30 menit sehari seperti jalan kaki, senam, atau berenang. Kedua: konsumsi makanan bergizi seimbang, perbanyak sayur, buah, dan protein tanpa lemak. Ketiga: jaga hidrasi dengan minum minimal 8 gelas air putih sehari. Keempat: tidur yang cukup 7–8 jam setiap malam. Kelima: rutin periksa kesehatan minimal 6 bulan sekali. Keenam: jaga kesehatan mental dengan aktif bersosialisasi. Ketujuh: hindari rokok dan batasi konsumsi alkohol. Kedelapan: kelola stres dengan meditasi atau hobi. Kesembilan: jaga berat badan ideal. Kesepuluh: konsumsi suplemen vitamin yang direkomendasikan dokter.',
  '<p>Memasuki usia 60 tahun ke atas, tubuh kita memerlukan perhatian dan perawatan yang lebih intensif. Namun dengan gaya hidup yang tepat, kualitas hidup di masa pensiun bisa tetap prima bahkan lebih baik dari sebelumnya.</p><p><strong>1. Tetap Aktif Bergerak</strong> — Lakukan aktivitas fisik minimal 30 menit sehari, seperti jalan kaki, senam, atau berenang.</p><p><strong>2. Konsumsi Makanan Bergizi Seimbang</strong> — Perbanyak sayur, buah, protein tanpa lemak, dan biji-bijian. Kurangi garam, gula, dan makanan berlemak jenuh.</p><p><strong>3. Jaga Hidrasi</strong> — Minum minimal 8 gelas air putih sehari. Lansia sering kurang merasakan haus, padahal dehidrasi bisa memperburuk kondisi kesehatan.</p><p><strong>4. Tidur yang Cukup</strong> — Pastikan tidur 7–8 jam setiap malam untuk pemulihan sel tubuh dan kesehatan mental.</p><p><strong>5. Rutin Periksa Kesehatan</strong> — Lakukan pemeriksaan kesehatan rutin minimal 6 bulan sekali. Deteksi dini adalah kunci penanganan yang efektif.</p><p><strong>6. Jaga Kesehatan Mental</strong> — Tetap aktif bersosialisasi, bergabung dengan komunitas seperti PeduaTel untuk mencegah isolasi sosial.</p><p><strong>7. Hindari Kebiasaan Buruk</strong> — Berhenti merokok dan batasi konsumsi minuman beralkohol.</p><p><strong>8. Kelola Stres</strong> — Lakukan meditasi, yoga ringan, atau tekuni hobi yang menyenangkan.</p><p><strong>9. Jaga Berat Badan Ideal</strong> — Konsultasikan dengan dokter mengenai berat badan ideal sesuai usia dan kondisi tubuh Anda.</p><p><strong>10. Konsumsi Suplemen yang Tepat</strong> — Konsultasikan dengan dokter mengenai suplemen vitamin D, kalsium, dan omega-3 yang sesuai.</p>',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
  'Tips Hidup Sehat Pensiunan 60+',
  c.id, 'published', FALSE, 2134, 187, 5, NOW() - INTERVAL '10 days'
FROM public.categories c WHERE c.slug = 'kesehatan'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['tips-kesehatan','gaya-hidup','lansia']) AS t(tag)
WHERE a.slug = 'tips-hidup-sehat-pensiunan-60-plus' ON CONFLICT DO NOTHING;

-- ── OLAHRAGA ─────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Turnamen Tenis Meja Antar Cabang PeduaTel Se-Jawa 2026 Berlangsung Seru',
  'turnamen-tenis-meja-peduatel-2026',
  'Turnamen tenis meja bergengsi antar cabang PeduaTel se-Jawa berlangsung selama tiga hari di GOR Pulogadung Jakarta, mempertemukan 128 atlet terbaik dari 16 cabang dengan semangat sportivitas tinggi.',
  'GOR Pulogadung, Jakarta Timur, menjadi saksi berlangsungnya Turnamen Tenis Meja Antar Cabang PeduaTel Se-Jawa 2026 selama tiga hari penuh. Sebanyak 128 atlet dari 16 cabang PeduaTel di seluruh Pulau Jawa berlaga dengan penuh semangat dan sportivitas tinggi. Turnamen ini dibagi dalam beberapa kategori: tunggal putra, tunggal putri, ganda putra, ganda putri, dan ganda campuran. Juara umum kali ini berhasil diraih oleh PeduaTel Cabang Surabaya yang tampil dominan di hampir semua kategori.',
  '<p>Gelanggang Olahraga (GOR) Pulogadung, Jakarta Timur, menjadi saksi berlangsungnya Turnamen Tenis Meja Antar Cabang PeduaTel Se-Jawa 2026 yang diselenggarakan selama tiga hari penuh. Sebanyak 128 atlet dari 16 cabang PeduaTel di seluruh Pulau Jawa berlaga dengan penuh semangat dan sportivitas tinggi.</p><p>Turnamen ini dibagi dalam beberapa kategori: tunggal putra, tunggal putri, ganda putra, ganda putri, dan ganda campuran. Sistem pertandingan menggunakan knockout untuk babak penyisihan dan round-robin untuk babak final.</p><p>Juara umum kali ini berhasil diraih oleh PeduaTel Cabang Surabaya yang tampil dominan di hampir semua kategori. "Turnamen ini bukan hanya tentang menang atau kalah, tetapi tentang bagaimana kita menjaga semangat olahraga dan mempererat persaudaraan," ucap Ketua Panitia Turnamen.</p>',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
  'Turnamen Tenis Meja PeduaTel 2026',
  c.id, 'published', FALSE, 823, 67, 3, NOW() - INTERVAL '6 days'
FROM public.categories c WHERE c.slug = 'olahraga'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['tenis-meja','turnamen','kompetisi']) AS t(tag)
WHERE a.slug = 'turnamen-tenis-meja-peduatel-2026' ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Kelompok Jalan Santai PeduaTel: Sehat Bersama Setiap Minggu Pagi di Monas',
  'jalan-santai-peduatel-monas',
  'Kelompok Jalan Santai PeduaTel yang aktif setiap Minggu pagi di kawasan Monas semakin berkembang dengan jumlah peserta rutin mencapai 80 orang, menjadi ajang silaturahmi sekaligus menjaga kebugaran.',
  'Setiap Minggu pagi, kawasan Monas Jakarta menjadi tempat berkumpulnya anggota PeduaTel yang tergabung dalam Kelompok Jalan Santai "PeduaTel Sehat". Kelompok yang terbentuk sejak 2023 ini kini memiliki anggota aktif lebih dari 80 orang yang rutin hadir setiap minggunya. Rute jalan santai yang ditempuh biasanya sepanjang 3–5 km, mengitari kawasan Monas dan sekitarnya. Setelah berjalan santai, peserta berkumpul untuk sarapan bersama dengan menu yang sehat dan bergizi, kemudian dilanjutkan dengan sesi obrolan santai.',
  '<p>Setiap Minggu pagi, kawasan Monas (Monumen Nasional) Jakarta menjadi tempat berkumpulnya anggota PeduaTel yang tergabung dalam Kelompok Jalan Santai "PeduaTel Sehat". Kelompok yang terbentuk sejak 2023 ini kini memiliki anggota aktif lebih dari 80 orang yang rutin hadir setiap minggunya.</p><p>Rute jalan santai yang ditempuh biasanya sepanjang 3–5 km, mengitari kawasan Monas dan sekitarnya. Setelah berjalan santai, peserta berkumpul untuk sarapan bersama dengan menu yang sehat dan bergizi, kemudian dilanjutkan dengan sesi obrolan santai yang semakin mempererat keakraban.</p><p>"Manfaatnya luar biasa. Selain tubuh jadi lebih sehat, saya juga merasa lebih bahagia karena bertemu teman-teman setiap minggu," kata salah satu anggota aktif kelompok ini.</p>',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80',
  'Jalan Santai PeduaTel di Monas',
  c.id, 'published', FALSE, 567, 45, 3, NOW() - INTERVAL '15 days'
FROM public.categories c WHERE c.slug = 'olahraga'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['jalan-santai','monas','komunitas']) AS t(tag)
WHERE a.slug = 'jalan-santai-peduatel-monas' ON CONFLICT DO NOTHING;

-- ── SOSIAL ───────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Bakti Sosial PeduaTel: Kunjungi dan Santuni Penghuni Panti Jompo di Jakarta Timur',
  'bakti-sosial-panti-jompo-2026',
  'DPP PeduaTel bersama pengurus cabang Jakarta mengadakan kegiatan bakti sosial ke dua panti jompo di Jakarta Timur, menyerahkan bantuan senilai Rp 25 juta dan menghibur para lansia yang tinggal di panti.',
  'DPP PeduaTel bersama Pengurus Cabang Jakarta mengadakan kegiatan Bakti Sosial ke dua panti jompo di wilayah Jakarta Timur. Kegiatan ini diikuti sekitar 50 sukarelawan dari pengurus PeduaTel berbagai tingkatan. Bantuan yang diserahkan meliputi sembako, perlengkapan kebersihan diri, pakaian layak pakai, serta uang tunai dengan total nilai mencapai Rp 25 juta. Selain penyerahan bantuan materi, rombongan PeduaTel juga menghibur para lansia penghuni panti dengan penampilan musik dan bernyanyi bersama.',
  '<p>Dalam semangat kepedulian sosial, Dewan Pimpinan Pusat (DPP) PeduaTel bersama Pengurus Cabang Jakarta mengadakan kegiatan Bakti Sosial ke dua panti jompo di wilayah Jakarta Timur. Kegiatan ini diikuti oleh sekitar 50 sukarelawan dari pengurus PeduaTel berbagai tingkatan.</p><p>Bantuan yang diserahkan meliputi sembako, perlengkapan kebersihan diri, pakaian layak pakai, serta uang tunai dengan total nilai mencapai Rp 25 juta. Selain penyerahan bantuan materi, rombongan PeduaTel juga menghibur para lansia penghuni panti dengan penampilan musik, bernyanyi bersama, dan mengobrol hangat penuh keakraban.</p><p>"Melihat senyum para lansia di panti jompo ini membuat hati kami sangat tersentuh. Mereka adalah bagian dari generasi yang telah berjasa membangun bangsa ini. Sudah sepatutnya kita hadir dan memperhatikan mereka," ungkap Ketua Bidang Sosial DPP PeduaTel.</p>',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
  'Bakti Sosial PeduaTel ke Panti Jompo',
  c.id, 'published', FALSE, 698, 83, 3, NOW() - INTERVAL '9 days'
FROM public.categories c WHERE c.slug = 'sosial'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['bakti-sosial','panti-jompo','kepedulian']) AS t(tag)
WHERE a.slug = 'bakti-sosial-panti-jompo-2026' ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Program Beasiswa PeduaTel 2026: Dorong Prestasi Anak dan Cucu Anggota',
  'beasiswa-peduatel-2026',
  'PeduaTel kembali membuka program beasiswa untuk anak dan cucu anggota aktif yang berprestasi. Tersedia 50 beasiswa dengan nilai total Rp 500 juta untuk jenjang SMA/SMK hingga perguruan tinggi.',
  'PeduaTel kembali membuka Program Beasiswa 2026. Tersedia 50 beasiswa dengan total anggaran Rp 500 juta yang diperuntukkan bagi anak dan cucu anggota aktif yang berprestasi. Program beasiswa terbagi dalam tiga kategori: Beasiswa SMA/SMK (20 penerima, Rp 5 juta/tahun), Beasiswa D3/S1 (25 penerima, Rp 8 juta/tahun), dan Beasiswa S2/S3 (5 penerima, Rp 15 juta/tahun). Selain dukungan finansial, penerima beasiswa juga mendapatkan mentoring dari para profesional dan senior Telkom yang berpengalaman. Pendaftaran dibuka mulai 1 Juni hingga 31 Juli 2026.',
  '<p>Komitmen PeduaTel terhadap masa depan keluarga anggota kembali diwujudkan melalui pembukaan Program Beasiswa PeduaTel 2026. Tahun ini, tersedia sebanyak 50 beasiswa dengan total anggaran Rp 500 juta yang diperuntukkan bagi anak dan cucu anggota aktif PeduaTel yang berprestasi.</p><p>Program beasiswa ini terbagi dalam tiga kategori: Beasiswa SMA/SMK (20 penerima, nilai Rp 5 juta/tahun), Beasiswa D3/S1 (25 penerima, nilai Rp 8 juta/tahun), dan Beasiswa S2/S3 (5 penerima, nilai Rp 15 juta/tahun).</p><p>Selain dukungan finansial, penerima beasiswa juga akan mendapatkan mentoring dari para profesional dan senior Telkom yang berpengalaman.</p><p><strong>Persyaratan utama:</strong> merupakan anak/cucu kandung anggota aktif PeduaTel, memiliki IPK/nilai rata-rata minimal 3.0/80, tidak sedang menerima beasiswa dari sumber lain, dan bersedia mengikuti kegiatan sosial yang diorganisir PeduaTel.</p><p>Pendaftaran dibuka mulai 1 Juni hingga 31 Juli 2026 melalui website PeduaTel atau kantor cabang terdekat.</p>',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
  'Program Beasiswa PeduaTel 2026',
  c.id, 'published', FALSE, 1876, 154, 4, NOW() - INTERVAL '18 days'
FROM public.categories c WHERE c.slug = 'sosial'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['beasiswa','pendidikan','anak-anggota']) AS t(tag)
WHERE a.slug = 'beasiswa-peduatel-2026' ON CONFLICT DO NOTHING;

-- ── DAPEN TELKOM ─────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Kabar Gembira: Manfaat Pensiun Naik 8% Efektif 1 Juli 2026',
  'kenaikan-manfaat-pensiun-juli-2026',
  'Dana Pensiun Telkom (Dapentel) mengumumkan kenaikan manfaat pensiun sebesar 8% yang berlaku efektif mulai 1 Juli 2026 sebagai bentuk komitmen dalam menjaga kesejahteraan pensiunan Telkom Indonesia.',
  'Kabar menggembirakan datang dari Dana Pensiun Telkom (Dapentel). Mulai 1 Juli 2026, seluruh penerima manfaat pensiun Telkom akan mendapatkan kenaikan manfaat sebesar 8% dari jumlah yang selama ini diterima. Kenaikan ini merupakan hasil dari kinerja investasi yang baik dan komitmen manajemen untuk terus meningkatkan kesejahteraan para pensiunan. Kenaikan akan diterapkan secara otomatis tanpa memerlukan pengajuan atau tindakan apapun dari penerima manfaat. Perubahan jumlah manfaat yang baru akan terlihat pada pembayaran pensiun bulan Juli 2026.',
  '<p>Kabar menggembirakan datang dari Dana Pensiun Telkom (Dapentel). Mulai 1 Juli 2026, seluruh penerima manfaat pensiun Telkom akan mendapatkan kenaikan manfaat sebesar 8% dari jumlah yang selama ini diterima. Keputusan ini resmi diumumkan oleh Direksi Dapentel melalui surat edaran yang dikirimkan kepada seluruh peserta aktif.</p><p>Direktur Utama Dapentel menjelaskan bahwa kenaikan ini merupakan hasil dari kinerja investasi yang baik dan komitmen manajemen untuk terus meningkatkan kesejahteraan para pensiunan. "Kami berhasil membukukan imbal hasil investasi di atas target, dan sebagian dari hasil tersebut kami kembalikan kepada peserta dalam bentuk kenaikan manfaat," jelasnya.</p><p>Kenaikan ini akan diterapkan secara otomatis tanpa memerlukan pengajuan atau tindakan apapun dari penerima manfaat. Perubahan jumlah manfaat yang baru akan terlihat pada pembayaran pensiun bulan Juli 2026 yang akan masuk ke rekening masing-masing pada tanggal 1 Juli 2026.</p>',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
  'Kenaikan Manfaat Pensiun Dapentel 2026',
  c.id, 'published', TRUE, 3241, 276, 3, NOW() - INTERVAL '2 days'
FROM public.categories c WHERE c.slug = 'dapen-telkom'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['dapentel','manfaat-pensiun','kenaikan']) AS t(tag)
WHERE a.slug = 'kenaikan-manfaat-pensiun-juli-2026' ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Panduan Lengkap: Cara Mengajukan Klaim Dana Pensiun Telkom Secara Online',
  'panduan-klaim-dapentel-online',
  'Dapentel kini hadir dengan layanan pengajuan klaim secara online yang lebih mudah dan cepat. Artikel ini memandu Anda langkah demi langkah dalam menggunakan layanan digital Dapentel untuk berbagai jenis klaim.',
  'Dana Pensiun Telkom (Dapentel) telah meluncurkan platform layanan digital yang memungkinkan peserta untuk mengajukan berbagai jenis klaim secara online tanpa perlu datang ke kantor. Cara mendaftar: kunjungi website Dapentel, klik menu Daftar Layanan Digital, masukkan Nomor Peserta dan tanggal lahir, buat username dan password, verifikasi identitas dengan OTP. Jenis klaim yang bisa diajukan online meliputi perubahan rekening bank, laporan mutasi rekening, pengajuan manfaat berkala, surat keterangan penerima pensiun, dan klaim santunan kematian.',
  '<p>Dana Pensiun Telkom (Dapentel) telah meluncurkan platform layanan digital yang memungkinkan peserta untuk mengajukan berbagai jenis klaim secara online tanpa perlu datang ke kantor.</p><p><strong>Cara Mendaftar Layanan Digital Dapentel:</strong></p><ol><li>Kunjungi website resmi Dapentel</li><li>Klik menu "Daftar Layanan Digital"</li><li>Masukkan Nomor Peserta Dapentel dan tanggal lahir</li><li>Buat username dan password yang kuat</li><li>Verifikasi identitas dengan OTP yang dikirim ke nomor HP terdaftar</li></ol><p><strong>Jenis Klaim yang Bisa Diajukan Online:</strong></p><ul><li>Perubahan rekening bank penerima manfaat</li><li>Laporan mutasi rekening</li><li>Pengajuan manfaat berkala (pensiun janda/duda)</li><li>Surat keterangan penerima pensiun</li><li>Klaim santunan kematian</li></ul><p>Pastikan dokumen Anda sudah di-scan dan siap diupload: KTP, Kartu Peserta Dapentel, Buku Rekening Bank, dan dokumen pendukung sesuai jenis klaim.</p>',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
  'Panduan Klaim Dana Pensiun Online',
  c.id, 'published', FALSE, 2567, 198, 4, NOW() - INTERVAL '25 days'
FROM public.categories c WHERE c.slug = 'dapen-telkom'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['dapentel','klaim-online','layanan-digital','panduan']) AS t(tag)
WHERE a.slug = 'panduan-klaim-dapentel-online' ON CONFLICT DO NOTHING;

-- ── PENGUMUMAN ───────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Pendaftaran Anggota Baru PeduaTel Periode 2026 Resmi Dibuka',
  'pendaftaran-anggota-baru-2026',
  'DPP PeduaTel mengumumkan pembukaan pendaftaran anggota baru untuk periode 2026. Seluruh pensiunan Telkom Indonesia yang belum terdaftar diundang untuk bergabung dan menikmati berbagai manfaat keanggotaan.',
  'DPP PeduaTel mengumumkan pembukaan pendaftaran anggota baru untuk periode keanggotaan 2026. Program ini ditujukan bagi seluruh pensiunan Telkom Indonesia yang belum terdaftar sebagai anggota PeduaTel. Manfaat menjadi anggota meliputi: akses ke seluruh program kesehatan termasuk pemeriksaan kesehatan gratis, undangan ke seluruh kegiatan sosial dan olahraga, informasi terkini tentang kebijakan Dana Pensiun Telkom, jaringan pertemanan sesama pensiunan di seluruh Indonesia, akses ke program beasiswa untuk anak dan cucu, serta konsultasi hukum dan keuangan gratis. Pendaftaran ditutup pada 31 Desember 2026.',
  '<p>Dewan Pimpinan Pusat (DPP) PeduaTel dengan bangga mengumumkan pembukaan pendaftaran anggota baru untuk periode keanggotaan 2026. Program ini ditujukan bagi seluruh pensiunan Telkom Indonesia yang belum terdaftar sebagai anggota PeduaTel.</p><p><strong>Manfaat Menjadi Anggota PeduaTel:</strong></p><ul><li>✅ Akses ke seluruh program kesehatan PeduaTel termasuk pemeriksaan kesehatan gratis</li><li>✅ Undangan ke seluruh kegiatan sosial, rekreasi, dan olahraga</li><li>✅ Informasi terkini tentang kebijakan Dana Pensiun Telkom</li><li>✅ Jaringan pertemanan sesama pensiunan di seluruh Indonesia</li><li>✅ Akses ke program beasiswa untuk anak dan cucu anggota</li><li>✅ Konsultasi hukum dan keuangan gratis</li></ul><p><strong>Cara Mendaftar:</strong> Pendaftaran dapat dilakukan secara online melalui portal ini atau secara langsung di kantor PeduaTel cabang terdekat. Pendaftaran ditutup pada 31 Desember 2026.</p>',
  'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=80',
  'Pendaftaran Anggota Baru PeduaTel 2026',
  c.id, 'published', FALSE, 1123, 89, 3, NOW() - INTERVAL '1 day'
FROM public.categories c WHERE c.slug = 'pengumuman'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['pendaftaran','anggota-baru','keanggotaan']) AS t(tag)
WHERE a.slug = 'pendaftaran-anggota-baru-2026' ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────

INSERT INTO public.articles (
  title, slug, excerpt, content, content_html,
  cover_image, cover_image_alt, category_id,
  status, is_featured, view_count, like_count, reading_time, published_at
) SELECT
  'Perubahan Jadwal Pembayaran Manfaat Pensiun Bulan Juli 2026',
  'perubahan-jadwal-pensiun-juli-2026',
  'Dapentel mengumumkan perubahan jadwal pembayaran manfaat pensiun untuk bulan Juli 2026 sehubungan dengan libur nasional Hari Raya Idul Adha. Pembayaran dipercepat menjadi tanggal 25 Juni 2026.',
  'Sehubungan dengan Hari Raya Idul Adha 1447 H yang jatuh pada awal Juli 2026, Dana Pensiun Telkom (Dapentel) mengumumkan perubahan jadwal pembayaran manfaat pensiun untuk bulan Juli 2026. Pembayaran yang biasanya dilakukan pada tanggal 1 Juli akan dipercepat menjadi tanggal 25 Juni 2026. Pembayaran akan masuk ke rekening masing-masing penerima pada tanggal 25 Juni 2026 selambat-lambatnya pukul 16.00 WIB. Pastikan rekening bank Anda aktif dan data rekening yang terdaftar di Dapentel sudah benar. Dapentel mengucapkan Selamat Hari Raya Idul Adha 1447 H kepada seluruh penerima manfaat dan keluarga.',
  '<p>Sehubungan dengan Hari Raya Idul Adha 1447 H yang jatuh pada awal Juli 2026, Dana Pensiun Telkom (Dapentel) mengumumkan perubahan jadwal pembayaran manfaat pensiun untuk bulan Juli 2026.</p><p><strong>Detail Perubahan Jadwal:</strong></p><ul><li>Pembayaran Normal: 1 Juli 2026</li><li>Pembayaran Dipercepat: <strong>25 Juni 2026</strong></li><li>Jenis Manfaat: Semua jenis manfaat pensiun reguler</li></ul><p>Pembayaran akan masuk ke rekening masing-masing penerima pada tanggal 25 Juni 2026 selambat-lambatnya pukul 16.00 WIB. Pastikan rekening bank Anda aktif dan data rekening yang terdaftar di Dapentel sudah benar.</p><p>Jika ada pertanyaan, silakan hubungi Call Center Dapentel di nomor 1500-XXX (Senin–Jumat, 08.00–17.00 WIB).</p><p><em>Dapentel mengucapkan Selamat Hari Raya Idul Adha 1447 H kepada seluruh penerima manfaat dan keluarga.</em></p>',
  'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80',
  'Perubahan Jadwal Pembayaran Pensiun Juli 2026',
  c.id, 'published', FALSE, 4892, 321, 3, NOW() - INTERVAL '5 days'
FROM public.categories c WHERE c.slug = 'pengumuman'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag)
SELECT a.id, t.tag FROM public.articles a
  CROSS JOIN LATERAL unnest(ARRAY['pengumuman','pembayaran-pensiun','jadwal']) AS t(tag)
WHERE a.slug = 'perubahan-jadwal-pensiun-juli-2026' ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFIKASI
-- ============================================================
SELECT
  c.name AS kategori,
  COUNT(a.id) AS jumlah_artikel
FROM public.categories c
LEFT JOIN public.articles a ON a.category_id = c.id AND a.status = 'published'
GROUP BY c.name, c.sort_order
ORDER BY c.sort_order;
