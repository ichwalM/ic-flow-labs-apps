# Architecture

## ADR-001 — Web-first modular monorepo

Next.js untuk UI dan workspace pnpm untuk domain/schema tanpa React. NestJS + PostgreSQL/Prisma ditambahkan saat persistence diperlukan. Menghindari service awal yang belum memiliki pengguna. Editor domain dapat diuji tanpa browser.

## ADR-002 — Structured program, projected graph

Program terstruktur menjadi source of truth. Main menyimpan stable start/end IDs dan ordered instructions. React Flow memproyeksikan nodes/edges. Layout terpisah dan tidak punya pengaruh terhadap execution order. Decision memiliki blocks consequent/alternate dan titik merge turunan; while/for memiliki body, return edge, dan exit turunan; graph bebas dan manual reconnection ditunda karena tidak aman bagi beginner.

## ADR-003 — Interpreter, bukan generated JavaScript

Parser expression menghasilkan AST; interpreter bounded mengeluarkan typed events. React hanya menampilkan state/events. Tidak ada eval/Function. Rincian fase berikutnya di INTERPRETER.md.

## ADR-004 — Versioned document dan history

Schema version eksplisit, unique stable IDs, boundary validation. V1/v2/v3 dimigrasikan ke v4; versi lain ditolak. History snapshot dokumen maksimum 60 entri; runtime terpisah. Drag dicatat satu perubahan saat selesai. Local draft single-browser dengan deteksi perubahan tab lain; JSON export untuk portabilitas. Database conflict menggunakan version counter nanti.

## State ownership

Zustand editor: document, past/future, selection. React UI: picker/forms/panel. Persistence hook: hydration, dirty/saved/failure/conflict. Runtime store terpisah: interpreter instance, detached snapshot, retry diagnostic. Editor subscription membatalkan runtime saat program/document identity berubah; perubahan layout/title tidak. Browser scheduler hanya memajukan instance yang masih aktif. Derived node/edge state dihitung dari dokumen; transient drag hanya untuk interaction React Flow.

## ADR-005 — Schema v2 untuk mode output eksplisit

Menebak apakah output lama adalah teks atau expression dapat mengubah hasil algoritma. V2 memakai mode eksplisit; migrator v1 menandai seluruh output lama sebagai text. AST dikompilasi saat Run, tidak menjadi state kedua yang disimpan di editor. Runtime melakukan validasi keseluruhan program sebelum side effect output pertama.

## ADR-006 — Structured decisions dan definite assignment

Schema v3 menyimpan condition source serta dua block recursive. Merge nodes/edges hanya hasil projection dan tidak masuk project. Kedalaman dibatasi 12 dan jumlah 300 instruksi menghitung kedua cabang. Penyisipan/penghapusan menghitung ulang layout dengan mempertahankan offset manual; tidak mengubah urutan semantik.

Compiler menggabungkan environment dari dua jalur secara konservatif: deklarasi dan initialization harus pasti di semua jalur. Deklarasi dengan nama sama di dua cabang diperbolehkan hanya jika tipenya sama. Runtime memakai stack block dan kembali ke kelanjutan induk setelah cabang terpilih selesai. Event CONDITION_EVALUATED/FLOW_TRAVERSED membawa branch serta IDs sumber/tujuan yang sama dengan projection, sehingga highlight tidak bergantung posisi atau ukuran batch.

Urutan properti hasil schema disamakan dengan dokumen baru agar reload tidak menulis ulang draft identik dan memicu konflik tab palsu.

## ADR-007 — Loop terstruktur, scope per iterasi, schema v4

While/for menambah recursive body; total nesting gabungan dibatasi 12. Counter for merupakan variabel Integer outer yang ditulis otomatis dan dilindungi selama body aktif. Rentang inklusif dibaca sekali; step negatif didukung, nol ditolak. Deklarasi lokal dihapus saat frame iterasi dilepas agar iterasi berikutnya dapat mendeklarasikan ulang dengan bersih. Compiler tidak mempromosikan initialization body ke environment sesudah loop.

Loop tetap di frame induk sampai kondisi false; input dan scheduler dapat berhenti di dalam body. Projection dan runtime berbagi ID loop/merge dan branch body/exit. Return lanes mengitari nested blocks serta posisi manual. Semua mutasi subtree tetap satu entri undo. Highlight kumulatif memakai sets ID terpisah dari event ring, sehingga tidak hilang saat run panjang memangkas event lama.
