# Implementation Plan

## Current State

Discovery 3 Oktober 2026: workspace hanya berisi master brief, tanpa aplikasi, package, test, atau repository Git. Node 24 tersedia; pnpm dijalankan melalui `corepack pnpm`. Implementasi turn pertama dibatasi Phase 1 sesuai §140, bukan seluruh MVP.

Status terkini: Phase 0–4 selesai. While/for bertingkat, counter Integer dengan rentang inklusif dan step negatif, scope lokal per iterasi, jalur kembali/keluar, input berulang, serta batas langkah/output sudah terintegrasi. Schema v4 memigrasikan v1–v3. Verifikasi Phase 4: 204 unit tests, 28 skenario browser development (21 regresi + 7 loop), 5 smoke produksi, lint, typecheck, dan build produksi lulus. Tampilan desktop 1440×960 dan mobile 390×844 diperiksa. Dev/build menggunakan Webpack. Phase 5–9 belum dikerjakan.

## Project Understanding

Platform pembelajaran algoritma untuk mahasiswa pemula FIKOM UMI. Mahasiswa menyisipkan instruksi lewat garis alur, mengamati data, dan akhirnya mengeksekusi algoritma. Kebenaran program berasal dari domain terstruktur, bukan koordinat diagram. Editor adalah media belajar; interpreter dan penjelasan eksekusi menjadi inti pada fase berikutnya.

## Assumptions

| Pertanyaan | Keputusan sementara / bukti |
|---|---|
| Simbol resmi | Terminator, process, I/O, decision mengikuti pemetaan brief; profil simbol dapat diganti. ISO 5807 diperiksa sebagai referensi, bukan klaim sertifikasi. |
| Deklarasi | Rectangle berlabel Deklarasi sementara; convention khusus dosen belum dikonfirmasi. |
| Array index | 0, configurable pada fase array; belum diimplementasikan. |
| Nama variabel | `[A-Za-z_][A-Za-z0-9_]*`, case-sensitive; keyword dicadangkan pada parser. |
| Operator | Grammar brief; `^` pangkat, AND/OR/NOT logis, tanpa coercion JS. |
| Pseudocode | Read-only dari IR, convention final belum dikunci. |
| Bahasa | Indonesia dengan istilah akademik pendamping. |
| Loop | While dan for dalam MVP; do-while menyusul. |
| Function/procedure | MVP+1; parameter by value awal, scope lokal. |
| Rekursi | Tercantum di daftar isi modul publik 2026–2027; tetap fitur lanjutan. |
| Penilaian | Belum ada kontrak grading platform; tidak mengarang integrasi LMS. |
| Login | Prototype tanpa login; email/password fase 6, SSO menunggu kontrak kampus. |

## Product Decisions

- Codename `FlowLab`, dapat diubah lewat konfigurasi; bukan brand final.
- Desktop/laptop sebagai pengalaman utama; panel adaptif untuk layar kecil.
- Click-to-insert dan inspector sebagai interaksi utama. Drag hanya mengubah layout.
- Phase 1 mendukung penyusunan deklarasi, input, proses, output, tanpa mengklaim eksekusi.
- Draft lokal dan JSON export/import awal untuk melindungi hasil percobaan; bukan persistence server.
- Branch sudah aktif sejak Phase 3 dengan model, validasi, dan runtime terintegrasi; while/for aktif sejak Phase 4.

## Architecture

Next.js App Router + React + TypeScript strict, Tailwind, React Flow, Zustand, Zod; pnpm workspace. Domain tanpa React, schema terpisah, editor store hanya menangani dokumen/history/selection. Next.js melayani web; NestJS API dan PostgreSQL/Prisma baru ditambahkan fase persistence. Tidak ada Redis atau service yang belum dipakai.

Keputusan utama: web-first; interpreter grammar terbatas tanpa eval; structured program sebagai source of truth; format dokumen versioned. Detail pada ARCHITECTURE.md.

## Domain Model

`ProjectDocument { schemaVersion, metadata, program, layout }`. Main memiliki Start/End stabil dan ordered instructions. Instruction discriminated union: declaration, assignment, input, output pada Phase 1. Layout menyimpan posisi berdasarkan ID. React Flow nodes/edges merupakan projection, bukan salinan graph yang diedit terpisah. Decision memiliki condition serta consequent/alternate blocks; while/for memiliki body. Domain menyediakan insert/update/delete dengan validasi invariant.

## Interpreter Design

Phase 2: tokenizer → expression AST → semantic validation → IR → bounded interpreter → typed events. Source instruction ID ikut dalam IR dan diagnostics. Integer aman, Real finite, Boolean ketat, Character satu Unicode code point, String bounded. Parser menentukan precedence dan short-circuit, bukan JavaScript. Input mem-pause eksekusi; reset membuang state runtime. Scheduler membatasi batch agar UI tetap responsif. Langkah default maksimum 100000; tambahkan batas string/output/array/call-depth serta parser depth. Tidak ada runtime di Phase 1.

## UI/UX Structure

Top bar: nama project, status draft, import/export. Toolbar: undo/redo, auto arrange, fit view. Kiri: panduan singkat dan daftar langkah yang bisa dinavigasi keyboard. Tengah: canvas dengan Start → + → End. Kanan: picker lalu inspector berisi form instruksi. Bawah: informasi dokumen; Console/Problems/Explain aktif bertahap saat runtime tersedia. Panel dapat ditutup. Node I/O berupa parallelogram; declaration/process rectangle. Posisi manual dipertahankan sampai pengguna memilih rapikan.

## Database Design

Fase 6: users (UUID), projects (owner UUID, title, currentVersion), project_versions (unique project/version, schemaVersion, JSONB), course_profiles. API melakukan ownership check dan optimistic concurrency; conflict memberikan reload/save copy. Execution metadata hanya bila ada kebutuhan terukur; tidak menyimpan input mahasiswa secara default.

## Security

Zod di boundary import/recovery/API; batasi ukuran file, panjang teks, jumlah instruksi dan koordinat. Render teks melalui React. Jangan eval, Function, shell, atau generated JS untuk program mahasiswa. Local draft bukan tempat data rahasia. Auth, cookies, CSRF, rate limits, CSP, audit admin, backup/restore ditambahkan sebelum deployment produksi.

## Testing

Vitest: domain invariants, insertion order, deletion, history, layout independence, schema rejection. Playwright: empty state → insert → edit → undo/redo → recovery, import/export, keyboard, mobile layout. Setiap milestone menjalankan lint, typecheck, test, build. Fase interpreter wajib fixtures deterministik dan limit tests. Performance 100–300 node perlu profiling pada mesin lab, belum menjadi klaim Phase 1.

## Risks

- Graph bebas menimbulkan alur ambigu: gunakan structured blocks dan projection.
- Perbedaan kurikulum: pisahkan course/symbol profile dan catat asumsi.
- UI terlihat dapat menjalankan program padahal belum: tampilkan batas fase secara jujur.
- LocalStorage bisa penuh/ditolak: status gagal terlihat, ekspor tetap tersedia.
- Banyak tab: jangan diam-diam menimpa draft eksternal; recovery dengan reload atau export.
- Scope besar: implementasi dan acceptance per fase; arrays/functions bukan syarat fase awal.

## Repository Structure

```text
apps/web/                 Next.js, editor, UI, copy, design tokens
packages/domain/          model dan operasi dokumen
packages/flow-schema/     validasi boundary dan serialization
tests/                    E2E
docs/decisions/            keputusan penting
```

`packages/expression-parser`, `packages/interpreter`, `apps/api`, Prisma, dan Docker ditambahkan saat dibutuhkan, bukan folder kosong.

## Milestones

### Phase 1 — Foundation (selesai)

Files affected: root workspace/config/docs, apps/web, packages/domain, packages/flow-schema, tests.

Implementation: app shell/tokens, dokumen versioned, Start/End, insert empat instruksi dasar, inspector, move/arrange, undo/redo, keyboard, local draft, JSON import/export.

Acceptance criteria: aplikasi dapat dibuka; fresh document berisi Start/End; + menyisipkan pada urutan yang dipilih; form tervalidasi; delete reconnect otomatis; move tidak mengubah program; undo/redo mencakup edit/layout; draft kembali setelah refresh; file tidak valid ditolak; tidak ada Run palsu; checks lulus.

### Phase 2 — Basic Algorithms (selesai)

Files: packages/expression-parser, packages/interpreter, runtime UI.
Implementation: AST, numeric/type semantics, declaration/assignment/input/output, console.
Acceptance: fixtures arithmetic dan I/O deterministik, invalid operand terdiagnosis, input menunggu tanpa browser prompt, grammar asing ditolak, bounded runtime.

Deliverable aktual: parser + type inference/evaluator tanpa host execution, compiler dokumen, interpreter dengan events/snapshot, validator input, runtime store terpisah, Console/Masalah/Variabel, input retry, Stop/Reset, invalidasi saat program diedit, migrator v1→v2. Fixtures menguji output dan event sequence yang identik pada batch 1 dan 32. Runtime values dan input tidak tersimpan dalam draft. Pengujian tercatat di TESTING.md.

Rencana pelaksanaan: parser Pratt murni TypeScript dengan AST dan batas panjang/token/depth; type checking sebelum Run; interpreter berurutan yang menghasilkan typed events dan menunggu input tervalidasi. Browser menjalankan batch kecil dengan scheduler yang dapat dibatalkan. Console dan panel masalah terpisah; Run, Stop, Reset serta nilai variabel dasar tersedia, sementara debugger Step/Pause tetap Phase 5. Perubahan program membatalkan hasil runtime lama; perubahan layout tidak.

Keputusan schema: output mempunyai mode `text` atau `expression`. Dokumen baru memakai v2; migrator v1 mempertahankan seluruh output lama sebagai teks literal. Draft key lama tetap dibaca sehingga project Phase 1 tidak hilang. Declaration tanpa nilai awal belum terinisialisasi; harus mendapat input/assignment sebelum dibaca. `/` dan `^` menghasilkan Real, widening Integer→Real dan Character→String diperbolehkan, konversi lainnya tidak implisit. Character menggunakan literal tanda petik tunggal; String tanda petik ganda. Operator logical tidak bergantung coercion JavaScript.

### Phase 3 — Decision (selesai)

Files: domain blocks, schema migration bila diperlukan, projection, validator/interpreter.
Implementation: if/else, branch insertion/merge, Boolean validation, highlight.
Acceptance: input 80 → Lulus; 60 → Tidak Lulus; nested branch benar tanpa mengandalkan layout.

Implementasi Phase 3: instruction `decision` berisi condition serta dua block `consequent`/`alternate`, termasuk block kosong untuk if tanpa else. Schema v3 memigrasikan v1/v2 tanpa mengubah urutan atau isi. Batas 300 instruksi dihitung rekursif, kedalaman decision maksimum 12. Canvas memproyeksikan diamond, dua cabang berlabel Ya/Tidak dan titik penggabungan otomatis; tombol + setelah merge menyisipkan pada block induk. Penghapusan decision menghapus subtreenya dengan konfirmasi serta dapat di-undo. Layout otomatis mempertahankan offset posisi manual saat penyisipan maupun penghapusan mengubah struktur.

Compiler memeriksa kedua cabang dalam environment terpisah. Sesudah merge, variabel harus pasti dideklarasikan/diberi nilai di semua jalur sebelum dibaca; declaration dengan tipe berbeda antarcabang ditolak. Runtime menggunakan stack block, hanya menjalankan cabang yang dipilih, kemudian kembali ke kelanjutan induk. Event CONDITION_EVALUATED dan FLOW_TRAVERSED menjadi sumber highlight jalur, independen dari koordinat node. Step/Pause tetap Phase 5.

Penyelesaian 4 Oktober 2026: melengkapi styling diamond/merge, outline bersarang, branch actions, dan penanda jalur yang dieksekusi. Memperbaiki konflik tab palsu akibat urutan properti JSON yang berubah saat parsing. Menambah pengujian domain nested blocks/history/layout, schema recursive limits/migration, validasi semua jalur, determinisme runtime, serta skenario browser cek kelulusan, empty branch, diagnosis, subtree delete/undo, recovery, dan mobile.

### Phase 4 — Loops (selesai)

Files: domain, interpreter, flow projection, fixtures.
Implementation: while/for, back edge, bounds dan nested loops.
Acceptance: urutan 1–10 benar, zero/negative step semantics eksplisit, infinite loop berhenti dengan diagnostic.

Implementasi: schema v4 menambahkan while `{condition, body}` dan for `{counter, from, to, step, body}`; v1–v3 dimigrasikan tanpa mengubah program lama. Batas 300 instruksi dan 12 tingkat berlaku untuk gabungan decision/loop. For memakai counter Integer yang sudah dideklarasikan, batas inklusif, ekspresi rentang dievaluasi sekali sebelum counter diisi, step nonzero, arah rentang yang tidak cocok menghasilkan nol iterasi. Counter naik/turun sesudah body, termasuk iterasi terakhir; overflow terdiagnosis. Body tidak boleh menulis counter for aktif. Deklarasi di body bersifat lokal per iterasi, tanpa shadowing variabel outer. Initialization di body tidak dianggap pasti sesudah loop karena loop boleh berjalan nol kali. While mengevaluasi ulang kondisi Boolean tiap putaran.

Projection menampilkan body, jalur kembali dan exit. Runtime tetap memakai stack, event deterministik, batas langkah/output, input retry, Stop/Reset dan scheduler batch terbatas. Fixtures mencakup 1–10, countdown, nested loop/decision, zero iteration, local declarations, bounds capture, infinite loop, serta regresi import/history/mobile.

Penyelesaian 4 Oktober 2026: domain dan projection menyertakan body/back edge/exit, editor menyediakan form while/for dan navigasi subtree, compiler memvalidasi tipe dan counter aktif, runtime menjalankan stack loop dengan scope lokal serta input retry. Scheduler memakai batch maksimal 128 instruksi dengan jeda 16 ms. Penanda jalur kumulatif dipisah dari ring event 5.000 agar jejak awal tetap terlihat pada loop panjang. Tes browser membuktikan loop kosong berhenti otomatis pada 100.000 langkah serta dapat dihentikan manual.

### Phase 5 — Learning Runtime

Files: runtime store, panels, scheduler.
Implementation: Run/Pause/Step/Reset, speeds, watch, explanations, problems focus.
Acceptance: step tepat satu instruksi, pause responsif, reset bersih, events sesuai nilai sebelum/sesudah.

### Phase 6 — Persistence

Files: apps/api, Prisma, database config, web server-state.
Implementation: auth, project CRUD, ownership, autosave, optimistic versioning, recovery.
Acceptance: login → create → save → reopen; akses owner saja; multi-tab conflict tidak overwrite diam-diam.

### Phase 7 — Arrays (MVP+1)

Implementation: 1D array, index validation, inspector. Acceptance: bounds errors ramah, fixtures sum/max benar.

### Phase 8 — Functions (MVP+1)

Implementation: functions/procedures, typed parameters/return, local frames, call stack. Acceptance: scope isolation, return checking, call-depth limits.

### Phase 9 — Hardening

Implementation: Playwright lengkap, a11y, profiling, security review, Docker/CI/staging, backup restore. Acceptance: MVP gates di bawah lulus; akses produksi membutuhkan konfigurasi deployment nyata.

## Acceptance Criteria MVP

Login, buat project, Start/End, insert, declaration/input/output/assignment, if, while/for, Run + input + output, Step + variable watch, diagnostics Indonesia, save/reopen. Test terintegrasi: buat cek kelulusan, jalankan dua cabang, refresh, hasil dokumen tetap sama. Phase 1 saja belum memenuhi MVP ini.

## Discovery Sources

- https://iclabs.fikom.umi.ac.id/home dan `/css/variables.css`: portal dan token CSS diperiksa 2026-10-03; primary `#2563eb`, navy `#1e3a8a`, light `#f8fbff`.
- https://iclabs.fikom.umi.ac.id/modul → https://iclabs.fikom.umi.ac.id/assets/uploads/modul/modul_6ab27e5e05fd6.pdf : daftar materi publik diperiksa; belum merupakan persetujuan dosen untuk semua pilihan implementasi.
- https://www.iso.org/standard/11955.html : halaman standar; isi berbayar tidak diasumsikan tersedia.
- https://reactflow.dev/ dan https://nextjs.org/docs/app/getting-started/installation : dokumentasi resmi.
