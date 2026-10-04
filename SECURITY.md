# Security

## Phase 4

Algoritma berurutan, percabangan, dan perulangan berjalan melalui grammar/AST platform di browser. Parser hanya menerima literal, identifier, operator yang didukung, dan tanda kurung; tidak ada akses host property, arbitrary call, assignment di dalam expression, atau JavaScript execution. Tidak memakai eval/new Function/shell. React merender label/output sebagai teks. Belum ada API, auth, atau database.

Import/recovery memakai strict Zod schema, UUID node unik, schemaVersion eksplisit, posisi finite, dan batas ukuran/jumlah node/teks. Migrator v1/v2/v3 mempertahankan mode output lama. Preflight iteratif menolak struktur cyclic, kedalaman gabungan decision/loop di atas 12, dan lebih dari 300 instruksi total sebelum schema recursive berjalan. Compiler memeriksa initialization di semua jalur, declaration order, kondisi Boolean, dan tipe sebelum eksekusi. Variables disimpan di Map, bukan properti global. Parser source/token/depth, safe integer/finite Real, runtime string/input/output, instruction count dan event ring dibatasi (lihat INTERPRETER.md).

Input mentah, hasil, serta event hanya berada di memori runtime. Reset, program edit, atau reload membuangnya; autosave/export hanya menyimpan source project. Scheduler maksimal 128 instruksi per tick menjaga UI dapat menghentikan eksekusi. Setiap pemeriksaan kondisi loop mengonsumsi budget langkah, termasuk body kosong; batas default 100.000 langkah menghentikan loop tak berujung. Overflow counter dan step nol terdiagnosis. Deklarasi lokal dibersihkan tiap iterasi, event ring dibatasi 5.000, dan highlight menyimpan sets ID yang dibatasi ukuran program. Array/call-depth limits akan ditambahkan bersama fitur tersebut, bukan diklaim sudah tersedia.

LocalStorage tidak terenkripsi dan dapat dibaca JavaScript pada origin yang sama. Jangan menyimpan data sensitif. Error recovery mempertahankan draft lama sampai pengguna memilih reset. Multi-tab conflict memblokir autosave dan menawarkan reload; localStorage bukan sistem transaksi terdistribusi. Simpan salinan melalui JSON.

Header awal: nosniff, strict-origin-when-cross-origin, DENY framing. CSP/nonce serta HSTS produksi perlu diuji terhadap Next.js dan React Flow sebelum deployment resmi; belum dinyatakan hardened. Tidak ada telemetry mahasiswa atau raw input logging yang ditambahkan oleh aplikasi.

## Gate sebelum produksi / Phase 6–9

Auth/session cookie HttpOnly/Secure/SameSite, password hashing teruji atau identity provider, ownership setiap project/version, rate limits, CSRF sesuai transport, schema boundary API, optimistic versions, backup dan restore drill, dependency audit, CSP production, HTTPS/HSTS, minimal audit metadata. Runtime wajib memiliki batas steps, parser depth, data/output/string/array size, dan call depth. Tidak ada arbitrary user code execution.
