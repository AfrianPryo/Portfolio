# Audit Performa Website

Tanggal audit: 23 Oktober 2026  
Ruang lingkup: halaman utama, animasi/renderer, pemuatan media dan font, konfigurasi Next.js, serta inventaris aset publik.  
Jenis audit: inspeksi statis kode dan ukuran berkas; belum termasuk pengukuran Lighthouse atau profiling runtime di perangkat nyata.

## Ringkasan

Prioritas terbesar bukan ukuran gambar yang dipakai di hero, tetapi kerja JavaScript dan GPU yang dimulai pada halaman utama. Three.js diimpor langsung dari Hero, efek fluida membuat simulasi WebGL berulang di desktop, dan beberapa animasi ticker tetap aktif saat bagian halamannya tidak terlihat. Ketiganya berpotensi memengaruhi waktu interaksi, penggunaan CPU/GPU, baterai, serta kelancaran scroll.

Inventaris `public/` berisi 43 aset dengan total sekitar **13,13 MB**. Angka ini mencakup aset yang tampak tidak dirujuk dari `src/`; jadi angka tersebut **bukan** ukuran unduhan halaman utama.

## Temuan berprioritas tinggi

### 1. Three.js dan fallback renderer berada di jalur impor Hero

- **Dampak potensial:** tinggi pada JavaScript awal, parse/compile, dan waktu interaksi.
- `Hero.tsx` mengimpor `OrnamentScene` secara statis. `ornamentscene.tsx` mengimpor Three.js, GLTFLoader, dan `SoftwareRenderer`; renderer cadangan itu juga mengimpor Three.js.
- Akibatnya, kode 3D berpotensi masuk ke bundle client awal walaupun model GLB baru diproses secara asinkron sesudah komponen dipasang.
- **Arah optimasi:** pisahkan scene 3D menjadi chunk yang dapat dimuat belakangan, pertahankan konten hero yang penting agar tampil lebih dulu, dan pertimbangkan mode efek yang lebih ringan untuk perangkat terbatas.
- **Verifikasi:** analisis bundle per route dan ukur JavaScript awal yang ditransfer serta waktu parse/execute. Jangan menganggap ukuran chunk gabungan sebagai ukuran unduhan route tanpa analyzer.

### 2. Simulasi WebGL kursor memiliki beban GPU yang tinggi dan dimulai otomatis

- **Dampak potensial:** tinggi pada GPU, baterai, dan perangkat desktop dengan GPU terintegrasi.
- `FlameCursor` memulai fluida saat komponen terpasang pada perangkat `pointer: fine`. Default `flameFluid` memakai dye grid `640` dan `18` iterasi pressure per frame.
- Loop terus menyimulasikan hingga 360 frame idle (sekitar enam detik pada 60 FPS) sebelum tidur. Jadi beban dapat muncul meski pengguna belum menggerakkan kursor.
- Simulasi memakai beberapa framebuffer tekstur floating-point dan canvas satu layar dengan DPR maksimal 1,5.
- **Arah optimasi:** mulai simulasi setelah gerakan pointer pertama, tidurkan lebih cepat saat tidak ada input, batasi frekuensi/resolusi atau iterasi pada perangkat lemah, dan pastikan simulasi berhenti ketika tab/efek tidak terlihat.
- **Verifikasi:** rekam GPU/frame time dan konsumsi daya sebelum/sesudah; uji perangkat desktop dengan iGPU serta perangkat tanpa dukungan WebGL2.

### 3. Renderer ornamen 3D berjalan pada ticker global dan melakukan pembacaan layout tiap frame

- **Dampak potensial:** tinggi pada kelancaran scroll dan CPU, terutama saat beberapa animasi aktif bersama.
- `OrnamentScene` mendaftarkan `tick` ke GSAP ticker. Callback tersebut membaca posisi beberapa anchor/section lewat `getBoundingClientRect()` dan merender canvas full-screen ketika scene dianggap terlihat.
- Scene mencakup rentang Hero, About, Experience, dan Running Text; objek juga memiliki animasi idle. Walaupun sudah ada early-exit setelah bagian-bagian terkait lewat, loop ticker tetap terdaftar.
- **Arah optimasi:** batasi loop render hanya selama animasi/section aktif, jadwalkan pembaruan posisi berdasarkan scroll/resize/ResizeObserver, dan hentikan render ketika tab tersembunyi atau objek tidak perlu digambar. Hindari membaca layout berkali-kali setiap frame bila nilainya dapat diperbarui saat layout berubah.
- **Verifikasi:** gunakan Performance panel untuk memeriksa long frame, jumlah layout read, frame rate, serta aktivitas GPU ketika halaman diam dan saat scroll.

### 4. Beberapa animasi kontinu tetap memperbarui halaman di luar viewport

- **Dampak potensial:** menengah–tinggi pada CPU, baterai, dan stabilitas frame.
- Running Headline dan Running Text mendaftarkan callback ticker berulang. Running Text membaca `scrollWidth` setiap tick. Cincin di Contact memiliki tween berulang tanpa syarat visibilitas section.
- Semua efek tersebut berada pada halaman utama yang panjang; sebagian dapat terus aktif saat pengguna berada jauh dari section terkait.
- **Arah optimasi:** aktifkan/pause ticker dan tween berdasarkan IntersectionObserver atau ScrollTrigger; cache ukuran teks dan hitung ulang hanya setelah font/ukuran layout berubah.
- **Verifikasi:** saat halaman diam di tengah section lain, cek apakah callback ticker/contact masih menghasilkan kerja atau paint.

## Temuan berprioritas menengah

### 5. Gambar dekoratif di bawah fold belum semuanya ditunda

- **Dampak potensial:** menengah pada bandwidth awal dan kompetisi untuk LCP.
- Foto About `/about-tribal-bg.png` dan beberapa gambar dekoratif/form Contact menggunakan `<img>` tanpa `loading="lazy"`; ornamen kiri/kanan Contact sudah memakai lazy loading.
- Hero utama `/hero-person.webp` sudah memakai prioritas tinggi, yang tepat untuk kandidat LCP.
- **Arah optimasi:** lazy-load gambar dekoratif yang benar-benar berada di bawah fold, gunakan `next/image` untuk ukuran responsif bila cocok, dan jangan lazy-load elemen LCP.
- **Verifikasi:** Network panel pada pemuatan awal harus menunjukkan bahwa gambar section bawah tidak diunduh jauh sebelum mendekati viewport.

### 6. Font Switzer menambah ketergantungan stylesheet eksternal; font Acerok terdaftar melalui dua jalur

- **Dampak potensial:** menengah pada render teks awal dan ketergantungan jaringan pihak ketiga.
- Switzer dimuat lewat stylesheet Fontshare dari `<head>` dengan bobot 300–900. CSS eksternal dapat menambah koneksi dan waktu tunggu sebelum font tersedia.
- Acerok Mages didaftarkan melalui `next/font/local` dan juga `@font-face` manual di `globals.css`. Variable dari jalur `next/font/local` tampak tidak dipakai oleh theme yang memakai keluarga `AcerokMages`; validasi pemakaian sebelum menghapus salah satu jalur.
- **Arah optimasi:** pertimbangkan self-host font WOFF2 dengan subset/bobot yang benar-benar dipakai. Pertahankan `font-display: swap`; hilangkan registrasi yang redundan hanya setelah memastikan fallback/hasil visual.
- **Verifikasi:** periksa waterfall font, jumlah bobot yang diunduh, FOIT/FOUT, dan request font duplikat.

### 7. Efek filter dapat menyebabkan repaint mahal

- **Dampak potensial:** menengah, terutama pada perangkat mobile.
- About menganimasikan `filter: blur()` pada artwork latar berukuran besar; beberapa ornamen Contact juga memakai filter/efek bayangan. Filter pada area besar dapat memerlukan rasterisasi ulang saat animasi.
- **Arah optimasi:** ukur dampak filter terlebih dahulu; bila menjadi bottleneck, prioritaskan opacity/transform, atau kurangi area/kompleksitas blur tanpa mengubah arah desain.
- **Verifikasi:** gunakan paint flashing dan layer/compositing diagnostics di browser; jangan menghapus efek hanya berdasarkan dugaan.

### 8. Ukuran responsif gambar pilar Experience perlu dicocokkan dengan ukuran tampil

- **Dampak potensial:** rendah–menengah pada transfer gambar dan kerja optimizer.
- `ExperienceArtDirection.tsx` memakai aset pilar yang sama pada tiga posisi; variasi `sizes` adalah `400px` untuk sisi dan hingga `860px` untuk pilar utama. Sumber WebP sekitar 0,16 MB.
- Browser/cache dapat menggunakan varian yang sama, sehingga tiga elemen tidak otomatis berarti tiga unduhan penuh. Namun deklarasi `sizes` yang lebih besar dari lebar tampilan nyata dapat membuat optimizer memilih varian berlebih.
- **Arah optimasi:** ukur lebar CSS aktual pada breakpoint dan bandingkan dengan URL/varian yang dipilih sebelum mengubah `sizes`.
- **Verifikasi:** periksa `currentSrc`, byte transfer, serta cache di desktop dan mobile.

### 9. Placeholder Works berupa SVG data URI dibuat untuk banyak gambar

- **Dampak potensial:** rendah–menengah pada ukuran markup dan cache.
- `Works.tsx` membuat beberapa gambar placeholder SVG sebagai data URI untuk setiap proyek, lalu mengirimkannya sebagai `src`. Ini menghindari request gambar terpisah tetapi mengulang string SVG di markup dan tidak mendapat manfaat cache lintas halaman seperti aset bersama.
- **Arah optimasi:** jika placeholder masih dipakai, pertimbangkan gradien CSS atau aset placeholder bersama; jika seluruh gambar proyek sudah final, ganti data dummy dengan gambar produksi dan ukuran responsif.
- **Verifikasi:** ukur ukuran HTML/RSC dan payload gambar sebelum/sesudah; saat ini jumlah proyek masih terbatas sehingga bukan prioritas pertama.

### 10. Gambar dekoratif besar yang tampak tidak terpakai di `public/`

- **Dampak potensial:** rendah untuk waktu muat halaman bila memang tidak diminta browser; menengah untuk ukuran repository dan deployment.
- Pencarian referensi literal di `src/` tidak menemukan penggunaan untuk beberapa aset besar, antara lain `greek-wall.webp` (~6,62 MB), `wall-background.png` (~1,87 MB), `greek-wall-no-door.webp` (~0,98 MB), dan `hero-person.png` (~0,78 MB). Hero memakai `hero-person.webp`.
- **Arah optimasi:** cek route, CSS, metadata, dan referensi dinamis di luar `src/` sebelum menghapus. Jika tidak digunakan, hapus atau arsipkan di luar deployment.
- **Catatan:** aset yang tidak diminta tidak memperlambat transfer halaman, sehingga pembersihan ini bukan pengganti optimasi JS/GPU.

## Temuan khusus `ExperienceArtDirection.tsx`

- Konten pengalaman sebagian besar berupa data statis, tetapi komponen client diperlukan untuk GSAP/ScrollTrigger. Bila ukuran bundle menjadi masalah, evaluasi pemisahan konten statis dari lapisan animasi client.
- Bagian ini merender tiga instance gambar pilar dan menganimasikan transform/opacity. Penggunaan `will-change` dibatasi pada stage, pilar, dan blok teks; tetap cek penggunaan layer GPU pada perangkat mobile.
- Pemuatan gambar memakai `next/image`, yang merupakan praktik baik. Prioritas berikutnya adalah mengukur `sizes` aktual, bukan mengganti mekanisme tanpa data.
- Tidak ditemukan indikasi bahwa komponen ini sendiri merupakan penyebab dominan dibanding Three.js dan simulasi fluida global.

## Rencana pengukuran sebelum implementasi

1. Rekam baseline production pada route utama menggunakan Lighthouse mobile/desktop dan profil CPU throttling.
2. Catat LCP, INP, CLS, FCP, TTFB, total JavaScript transfer, jumlah request, dan byte gambar/font.
3. Rekam frame/GPU saat halaman idle, bergerak pointer, scroll melewati Experience, dan berhenti pada section lain.
4. Terapkan perubahan satu kelompok pada satu waktu, lalu bandingkan hasil dengan perangkat dan kondisi jaringan yang sama.
5. Uji visual serta navigasi desktop/mobile setelah perubahan; efek dekoratif tidak boleh mengorbankan konten hero atau aksesibilitas reduced-motion.

## Batasan audit

Belum dilakukan pengukuran runtime/Lighthouse pada build production dan perangkat nyata. Karena itu, prioritas di atas berdasarkan pola kode dan ukuran aset, bukan klaim peningkatan skor atau waktu muat tertentu. Bundle output yang tersedia belum cukup untuk mengatribusikan ukuran JavaScript terkompresi ke route utama; gunakan analyzer build sebelum menetapkan target angka.

## Optimasi yang sudah diterapkan

Tanggal: 23 Oktober 2026

- Scene Three.js dipisah ke dynamic client chunk dari Hero agar tidak ikut ke chunk statis komponen Hero.
- Simulasi Flame Cursor tidak lagi dibuat saat mount; kode dan konteks WebGL baru dimuat setelah pointer pertama bergerak. Nilai kualitas simulasi tidak diubah.
- Ticker Running Headline dan Running Text dihentikan saat elemen terkait berada di luar viewport. Running Text juga meng-cache lebar track dan memperbaruinya lewat ResizeObserver, bukan membacanya setiap frame.
- Animasi putar cincin Contact dijeda di luar section Contact.
- Gambar dekoratif About dan aset Contact yang berada di bawah fold diberi lazy loading.
- Penggunaan `next/font` yang tidak dirujuk (Bebas Neue, Azeret Mono, dan preload Acerok duplikat) dihapus; font Acerok yang dipakai tetap dilayani oleh deklarasi `@font-face` yang sudah ada. Font eksternal Switzer tidak diganti karena belum ada berkas font lokal yang setara di repo.

Validasi yang direncanakan: lint dan production build. Dampak runtime harus diukur terpisah dengan Lighthouse/profiling sebelum menetapkan angka peningkatan.
