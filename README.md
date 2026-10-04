# FlowLab — platform pembelajaran algoritma

Codename sementara untuk workspace flowchart IC-Labs/FIKOM UMI. Dibangun berdasarkan [master brief](MASTER_PROJECT_FLOWCHART_ALGORITHM_PLATFORM.md). **Status: Phase 4, editor dan eksekusi algoritma dengan percabangan serta perulangan while/for. Belum merupakan MVP lengkap.**

## Menjalankan

Prasyarat: Node.js 22+ (dikembangkan pada Node 24), Corepack, browser modern. Package manager dikunci dalam package.json. Jika Corepack belum tersedia, pasang melalui pengelola Node Anda.

```sh
corepack pnpm install
corepack pnpm dev
```

Buka http://127.0.0.1:3000. Bila shim pnpm sudah tersedia, `pnpm install` dan `pnpm dev` juga dapat digunakan. Tidak memerlukan database, login, atau environment secrets untuk fase ini.

```sh
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm start
```

## Fitur saat ini

- Dokumen baru dengan Start/End dan insert melalui tombol +.
- Deklarasi lima tipe dasar, input, assignment, output teks/ekspresi; form inspector.
- Parser AST, validasi variabel/tipe sebelum Run, interpreter terbatas tanpa eval.
- Jalankan, Hentikan, Reset, console, masukan bertipe dengan retry, masalah yang dapat difokuskan ke node, dan nilai variabel runtime.
- Percabangan if/else bertingkat, kondisi Boolean, cabang Ya/Tidak, dan penggabungan otomatis.
- While dan for bertingkat, penghitung naik/turun, jalur kembali/keluar, serta batas 100.000 langkah.
- Bentuk terminator, rectangle, parallelogram, dan diamond; node serta jalur yang dieksekusi ditandai. Posisi terpisah dari urutan program.
- Drag/pan/zoom/fit, rapikan alur, daftar langkah alternatif keyboard.
- Undo/redo untuk insert/edit/delete/rename/layout; Ctrl/Cmd+Z dan Ctrl/Cmd+Shift+Z di luar input.
- Draft lokal debounced, pemulihan reload, deteksi perubahan tab lain, feedback storage failure.
- JSON v4 import/export tervalidasi; migrasi otomatis dari v1/v2/v3, maksimum 1 MB, 300 instruksi total, dan 12 tingkat gabungan percabangan/perulangan.
- Tampilan laptop dan drawer adaptif untuk layar kecil.

Expression disimpan sebagai source dan dikompilasi menjadi AST saat Jalankan. Eksekusi berjalan di browser dalam batch kecil; perubahan program menghapus state runtime lama, sedangkan perubahan layout tidak. Step/Pause, auth, server persistence, array, function, dan Docker mengikuti fase berikutnya.

## Penggunaan singkat

1. Klik + di antara Mulai dan Selesai.
2. Pilih Tampilkan output dan isi `Halo Dunia`.
3. Klik Tambahkan ke alur. Pilih node atau daftar langkah untuk mengedit.
4. Klik Jalankan; `Halo Dunia` muncul di Console.
5. Ekspor JSON untuk menyimpan salinan di luar browser.

Untuk menghitung dari input: deklarasikan `sisi` sebagai Integer, tambahkan Input ke `sisi`, deklarasikan `luas` sebagai Integer dengan nilai awal `sisi * sisi`, lalu tambahkan Output mode Ekspresi berisi `"Luas: " + luas`. Jalankan dan masukkan `8`; output menjadi `Luas: 64`.

Untuk cek kelulusan: deklarasikan `nilai` sebagai Integer, tambahkan Input ke `nilai`, lalu **Periksa kondisi** berisi `nilai >= 75`. Pilih **Tambah di cabang Ya** untuk output `Lulus`, dan **Tambah di cabang Tidak** untuk output `Tidak Lulus`. Tombol **Tambah setelah penggabungan** menambah langkah yang berjalan setelah kedua jalur. Input `80` menghasilkan `Lulus`, sedangkan `60` menghasilkan `Tidak Lulus`. Cabang kosong langsung menuju penggabungan.

Variabel yang dibaca setelah percabangan harus pasti dideklarasikan dan diisi di semua jalur. Cara termudah: deklarasikan sebelum kondisi, lalu ubah nilainya di cabang. Menghapus kondisi yang berisi instruksi meminta konfirmasi; undo mengembalikan seluruh cabangnya.

Untuk menampilkan 1–10: deklarasikan `i` sebagai Integer (nilai awal boleh kosong), tambahkan **Ulangi dengan penghitung**, isi counter `i`, mulai `1`, sampai `10`, perubahan `1`. Pilih **Tambah di dalam perulangan**, lalu Output mode Ekspresi `i`. Langkah sesudah loop disisipkan melalui **Tambah setelah perulangan**. Untuk hitung mundur, gunakan mulai `10`, sampai `1`, perubahan `-1`.

For memasukkan batas akhir bila tercapai. Step `0` menghasilkan masalah; arah step yang tidak menuju batas menghasilkan nol iterasi. Rentang dibaca sekali sebelum counter diisi. Counter diperbarui otomatis sesudah tiap body (termasuk terakhir), sehingga for 1–10 berakhir dengan `i = 11`; jangan mengubahnya lewat proses/input di dalam loop. While memeriksa kondisi setiap putaran: contoh `i <= 10`, lalu output `i` dan proses `i + 1` di body. Deklarasi di dalam loop bersifat lokal per iterasi; deklarasikan penampung hasil di luar loop.

Nilai awal kosong berarti variabel belum diisi. String memakai tanda petik ganda (`"teks"`), Character petik tunggal (`'A'`), Boolean `true`/`false`. Operator `/` dan `^` menghasilkan Real; tidak ada konversi otomatis Real→Integer. Detail aturan ada di INTERPRETER.md. Nilai input/runtime tidak masuk draft atau ekspor project.

Draft hanya satu per browser/origin. Algoritma baru mengganti draft aktif; undo masih tersedia selama sesi. Draft bukan backup: gunakan ekspor sebelum membersihkan browser. Konflik tab memblokir autosave sampai versi terbaru dimuat; ekspor perubahan terlebih dahulu bila diperlukan.

## Struktur

```text
apps/web/src/app           Next.js app shell dan semantic design tokens
apps/web/src/components    canvas, inspector, workspace
apps/web/src/lib           copy Indonesia, profile, editor store, recovery
packages/domain/src       domain murni dan document history
packages/flow-schema/src  validasi schema/import
packages/expression-parser/src  tokenizer, AST, type inference, evaluator
packages/interpreter/src        compiler, runtime, input, fixtures deterministik
tests                     Playwright browser scenarios
```

Lihat [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), [ARCHITECTURE.md](ARCHITECTURE.md), [INTERPRETER.md](INTERPRETER.md), [FLOW_SCHEMA.md](FLOW_SCHEMA.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [TESTING.md](TESTING.md), [SECURITY.md](SECURITY.md), [DEPLOYMENT.md](DEPLOYMENT.md).

Warna UI mengacu pada CSS publik https://iclabs.fikom.umi.ac.id/css/variables.css yang diperiksa saat discovery. Produk ini belum mengklaim persetujuan brand atau seluruh konvensi akademik institusi.
