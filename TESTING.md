# Testing

```sh
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm exec playwright install chromium
corepack pnpm test:e2e
```

Playwright menjalankan dev server di 127.0.0.1:3000 bila belum tersedia. Untuk smoke terhadap build produksi, jalankan `corepack pnpm start` terlebih dahulu. Linux mungkin memerlukan system dependencies browser; pasang sesuai dokumentasi Playwright bila browser gagal diluncurkan.

Jika Chrome sistem sudah terpasang, `PLAYWRIGHT_CHANNEL=chrome corepack pnpm test:e2e` dapat digunakan tanpa mengunduh Chromium. Development dan build memakai Webpack karena resolver Turbopack pada kombinasi dependency/environment ini tidak konsisten menemukan React Flow. Untuk server eksternal yang sudah berjalan, set `PLAYWRIGHT_BASE_URL` (tanpa auto-start server).

Domain tests mencakup terminal invariants, insertion order, reject stale/duplicate insertion, delete reconnect, edit kind preservation, layout independence, manual placement, bounded movement/count, undo/redo dan history cap. Schema tests mencakup roundtrip semua instruction, version/field rejection, duplicate IDs/orphan positions, malformed payload, limits.

Browser tests mencakup insert/edit/delete, edge order, keyboard undo/redo, form names, semua instruction types, JSON export/import, refresh recovery, corrupt draft, multi-tab conflict, dan mobile viewport. Traces disimpan saat gagal. Visual screenshot review dilakukan untuk desktop/mobile; tidak sama dengan audit aksesibilitas penuh.

Phase 2 menambah pengujian precedence/asosiasi, short-circuit, type rules, numeric/string limits, parser bounds, declaration/initialization, input retry, bounded runtime, immutable events, cancellation, program/layout separation, dan schema migration. Empat fixture program menyertakan expected output serta event sequence; hasil dibandingkan antar ukuran batch untuk memeriksa determinisme.

Browser runtime tests membangun algoritma lewat UI, menjalankan I/O dan assignment, memvalidasi masukan, memisahkan Console/Masalah, membuka node bermasalah, menjalankan Stop/Reset, membatalkan input setelah edit, memigrasikan draft v1, serta menjalankan input/output di mobile.

Belum diuji: browser selain Chromium, hardware lab 100–300 node, uji pemula nyata, aksesibilitas assistive technology lengkap, serta fitur Phase 5+ yang belum ada.

## Hasil verifikasi Phase 1 — 2026-10-03

- Frozen-lockfile install, lint, typecheck, dan production build: lulus.
- Vitest: 16 tests, 2 files, lulus.
- Playwright dengan Chrome sistem: 9 skenario development lulus, termasuk storage failure dan undo posisi drag.
- Server production pada port terpisah: smoke edit/recovery dan mobile insertion lulus (2 skenario).
- Screenshot desktop 1440×960 dan mobile 390×844 diperiksa; tidak ada overflow horizontal pada viewport mobile yang diuji.

Jalankan typecheck dan build secara berurutan: build dapat menulis ulang folder `.next/types` yang dibaca typecheck.

Browser bundle Playwright sempat gagal diunduh karena timeout jaringan; seluruh browser test di atas memakai Chrome sistem melalui `PLAYWRIGHT_CHANNEL=chrome`.

## Hasil verifikasi Phase 2 — 2026-10-03

- Lint, typecheck, production build: lulus.
- Vitest: 120 tests dalam 5 files, seluruhnya lulus.
- Browser development: 15 skenario editor/runtime lulus; tambahan navigasi keyboard tab runtime lulus (16 total).
- Production smoke: penyusunan dan eksekusi program lewat form, migrasi legacy draft, serta mobile input/output lulus (3 skenario).
- Screenshot input dan hasil runtime pada desktop 1440×960 serta mobile 390×844 diperiksa; output contoh `Luas persegi: 64` sesuai input `8`.
- Typecheck dan lint terakhir juga mencakup test tambahan untuk kelima tipe data.

## Hasil verifikasi Phase 3 — 2026-10-04

- Lint, typecheck, production build: lulus.
- Vitest: 158 tests dalam 7 files, seluruhnya lulus.
- Browser development (Chrome sistem): 21 skenario lulus, termasuk 5 skenario decision baru.
- Production smoke: 6 skenario lulus, mencakup seluruh skenario decision baru dan pemulihan konflik tab.
- Kasus baru: insert pada kedua cabang dan setelah merge, nested/empty branches, hapus subtree + cancel/undo, manual layout offsets, schema v1/v2→v3, duplicate IDs lintas cabang, count/depth limits, kondisi Boolean, definite declaration/initialization, input di nested branch, determinisme batch 1/32, dan mapping traversal ke projected edges.
- Skenario UI membangun cek kelulusan lewat form: input 80 → Lulus, 60 → Tidak Lulus; output setelah merge tetap berjalan. Highlight bersih setelah edit dan draft v3 kembali setelah refresh.
- Regresi konflik tab palsu: dokumen baru tetap serialized identik setelah parsing; membuka tab kedua tidak menandai konflik sebelum ada perubahan.
- Screenshot desktop 1440×960 dan mobile 390×844 diperiksa; diamond, label Ya/Tidak, titik merge, dan highlight jalur terlihat. Tidak ada overflow horizontal pada mobile yang diuji.


## Hasil verifikasi Phase 4 — 2026-10-04

- Lint, typecheck, production build: lulus.
- Vitest: 204 tests dalam 9 files, seluruhnya lulus.
- Browser development (Chrome sistem): 21 skenario regresi dan 7 skenario loop lulus (28 total).
- Production smoke: 5 skenario loop lulus (form for/rentang menurun/export/reload, body while/back edge/delete/undo, input di nested loop, diagnosis step nol/counter, dan mobile).
- Unit tests mencakup urutan 1–10, batas inklusif, step negatif/nol, nol iterasi, rentang dibaca sekali, counter overflow, local declarations per iterasi, definite initialization, perlindungan counter termasuk nested branch, loop bertingkat, input retry, Stop, step/output/event limits, determinisme batch 1/128, traversal sesuai projection, serta migrasi v3→v4.
- Browser mengisi node Input yang sama empat kali dalam nested loop; form dikosongkan tiap permintaan, dan output tepat 10/20/30/40.
- Empty infinite while berhenti otomatis dengan diagnostic STEP_LIMIT pada 100.000 langkah (skenario sekitar 17 detik pada mesin ini). Tombol Hentikan dan Reset tetap dapat digunakan, dan entry highlight bertahan setelah event ring memangkas event lama. Ini bukan benchmark hardware lab.
- Screenshot desktop 1440×960 dan mobile 390×844 diperiksa; jalur kembali dan exit jelas, tanpa overflow horizontal pada viewport mobile yang diuji.
