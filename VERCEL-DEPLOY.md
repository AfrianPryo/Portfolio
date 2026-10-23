# Panduan Deploy ke Vercel

Panduan ini dibuat untuk repository portfolio ini (Next.js 16.4.2, React 19, npm). Deploy dilakukan dari GitHub agar setiap perubahan yang di-push ke branch production dapat memicu deployment Vercel.

## 1. Periksa perubahan sebelum deploy

Pastikan perubahan yang ingin dipublikasikan sudah lengkap dan file yang tidak ingin diikutkan tidak ikut ter-stage.

```powershell
git status --short
npm ci
npm run lint
npm run build
```

Pastikan build berhasil. Jangan deploy bila lint atau build gagal.

Periksa juga konten yang dilihat pengunjung:

- Resume dapat diunduh dan merupakan versi final.
- Tautan email, Instagram, GitHub, dan tautan proyek mengarah ke tujuan yang benar.
- Tautan LinkedIn saat ini masih ke halaman umum `linkedin.com`; ganti ke profil pribadi bila sudah siap.
- Formulir Contact menggunakan `mailto:` dan membuka aplikasi email pengunjung; form ini belum mengirim melalui backend.

## 2. Commit dan push ke GitHub

Review diff lebih dahulu:

```powershell
git diff --check
git diff
git status --short
```

Stage hanya file yang memang akan dipublikasikan. Contoh bila semua perubahan saat ini sudah diperiksa dan memang dimaksudkan:

```powershell
git add -A
git diff --cached --check
git diff --cached
git commit -m "Prepare portfolio for Vercel deployment"
git push origin main
```

Jika ada perubahan lokal lain yang belum siap dipublikasikan, jangan gunakan `git add -A`; stage file yang sudah disetujui satu per satu. Pastikan file rahasia atau `.env*` tidak ikut commit. File `.env*` dan `.vercel` sudah diabaikan oleh `.gitignore`.

## 3. Hubungkan repository ke Vercel

1. Masuk ke [Vercel](https://vercel.com/) dan login dengan akun GitHub.
2. Pilih **Add New… → Project**.
3. Pilih repository `AfrianPryo/Portfolio`, lalu pilih **Import**.
4. Periksa konfigurasi project:
   - **Framework Preset:** Next.js (biasanya terdeteksi otomatis).
   - **Root Directory:** root repository, yaitu folder yang berisi `package.json`.
   - **Install Command:** biarkan otomatis atau gunakan `npm install`.
   - **Build Command:** `npm run build` (atau default Next.js).
   - **Output Directory:** biarkan default/otomatis. Jangan isi `out` karena aplikasi ini bukan static export.
5. Tidak ada environment variable aplikasi yang perlu dimasukkan berdasarkan konfigurasi repository saat ini.
6. Pilih **Deploy**.

Jangan menambahkan `vercel.json` atau mengubah output directory kecuali ada kebutuhan baru yang memang memerlukannya.

## 4. Uji Preview Deployment

Setelah deployment selesai, buka URL Preview yang diberikan Vercel dan periksa:

- Beranda tampil utuh; hero, gambar, font, serta scene ornamen berjalan.
- Tautan navigasi menuju section yang benar.
- Bagian Works dapat dibuka, foto tampil, sidebar detail dapat dibuka/ditutup, dan semua proyek tidak menampilkan gambar rusak.
- Route proyek langsung seperti `/works/usman` dapat dibuka.
- Tombol resume mengunduh file PDF yang benar.
- Email membuka aplikasi email, dan tautan eksternal membuka profil/proyek yang benar.
- Contact menggunakan alur email `mailto:` yang diharapkan.
- Tampilan mobile dan desktop, termasuk reduced motion dan browser/perangkat yang tidak mendukung WebGL.

Jika ada yang gagal, buka deployment di Vercel → **Build Logs** atau **Runtime Logs**, perbaiki masalahnya di repository, lalu push perubahan baru. Jangan mempromosikan Preview yang belum lolos pemeriksaan.

## 5. Production dan domain

1. Di pengaturan project Vercel, pastikan branch production adalah `main`.
2. Setelah Preview lolos, buat atau pilih domain di **Settings → Domains**.
3. Ikuti record DNS yang ditampilkan Vercel. Hindari menebak record; nilai yang benar dapat berbeda menurut domain dan konfigurasi akun.
4. Tunggu status domain menjadi valid dan sertifikat HTTPS aktif.
5. Buka domain production dan ulangi smoke test minimal untuk beranda, satu route proyek, serta `/resume.pdf`.
6. Setelah situs production dapat diakses publik, tambahkan properti domain di [Google Search Console](https://search.google.com/search-console), verifikasi kepemilikan domain mengikuti metode yang tersedia, lalu kirim `https://afrianpryo.vercel.app/sitemap.xml`. Gunakan URL Inspection untuk meminta crawl beranda. Verifikasi tambahan di Search Console mungkin membutuhkan record DNS atau tag yang disediakan Google; masukkan hanya nilai yang diberikan akun milik Anda.

Push berikutnya ke branch production akan memicu deployment baru. Pull request/branch lain biasanya menghasilkan Preview Deployment sehingga perubahan dapat ditinjau sebelum dirilis.

Pengiriman sitemap dan permintaan crawl membantu mesin pencari menemukan halaman, tetapi tidak menjamin kapan atau apakah halaman akan muncul di hasil pencarian. Pastikan deployment production tidak memakai perlindungan sandi dan halaman tidak mengirim `noindex`.

## 6. Rollback

Jika deployment production menimbulkan masalah:

1. Buka project di Vercel → **Deployments**.
2. Pilih deployment terakhir yang diketahui berjalan baik.
3. Gunakan tindakan **Promote to Production** atau opsi rollback yang tersedia.
4. Perbaiki sumber masalah di Git, jalankan kembali `npm run lint` dan `npm run build`, lalu deploy versi perbaikan.

Rollback deployment mengembalikan versi aplikasi yang disajikan, tetapi tidak membatalkan perubahan di Git.

## Catatan

- Vercel mendeteksi Next.js secara otomatis; file konfigurasi Vercel khusus tidak diperlukan untuk kondisi project saat ini.
- Build production dan lint terakhir telah berhasil saat panduan ini dibuat. Jalankan ulang pemeriksaan sebelum setiap rilis karena file dan data proyek dapat berubah.
- Deployment tidak dijalankan oleh panduan ini; langkah-langkah di atas meminta pemilik repository untuk melakukan push dan konfirmasi di dashboard Vercel.
