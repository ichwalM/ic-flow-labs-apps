# Interpreter — Phase 4

Sudah diimplementasikan di `packages/expression-parser` dan `packages/interpreter`, tanpa React/DOM. Pipeline: validasi dokumen v4 → tokenizer → Pratt parser → expression AST → semantic validation → IR → interpreter → typed execution events. Tiap statement membawa ID instruksi sumber. UI menerjemahkan error code dan context ke bahasa Indonesia, tanpa stack trace mahasiswa.

Precedence rendah→tinggi: OR, AND, equality, comparison, additive, multiplicative, unary, exponent (right associative). `-2 ^ 2 = -4`, `2 ^ 3 ^ 2 = 512`. Gunakan `NOT (nilai > 5)` untuk negasi comparison. AND/OR short-circuit pada runtime; kedua operand tetap diperiksa tipenya sebelum Run. Identifier case-sensitive, logical/Boolean keywords case-insensitive dan tidak dapat menjadi nama variabel.

| Aturan | Semantik |
|---|---|
| Integer | Safe integer JavaScript, overflow terdiagnosis |
| Real | Floating-point finite; bukan desimal presisi arbitrer |
| `/`, `^` | Selalu Real; nol denominator dan hasil nonfinite ditolak |
| `%` | Sisa pembagian; tanda mengikuti dividend |
| `+` dengan String/Character | Concatenation scalar eksplisit → String |
| `- * / % ^`, ordering | Operand angka; tidak coercion teks/Boolean |
| Equality | Tipe sama, angka campuran, atau Character/String |
| Widening | Integer→Real, Character→String |
| Narrowing | Real→Integer dan String→Character tidak implisit |
| Character | Literal `'A'`, tepat satu Unicode code point |
| String | Literal `"teks"`; escape n, r, t, backslash dan tanda petik |

Declaration tanpa initialValue membuat slot belum diisi, bukan default nol. Compiler melarang pembacaan sebelum initialization. Input atau assignment menandai slot initialized. Main adalah satu scope Map, sehingga nama seperti `constructor` tidak mengakses properti JavaScript. Cabang memakai scope pembungkusnya; body loop membentuk scope lokal per iterasi. Function scopes belum tersedia. Compiler menganalisis kedua cabang dengan salinan environment lalu menggabungkannya. Deklarasi/initialization setelah merge harus terjamin di semua jalur, termasuk cabang kosong. Pemeriksaan ini konservatif: kondisi literal true/false pun tidak menghapus pemeriksaan cabang lain. Deklarasi dengan nama sama pada dua cabang sah jika tipenya sama; deklarasi ulang variabel outer ditolak.

State: idle (UI), running, waiting_for_input, finished, error, stopped. `advance` menjalankan batch default 32/max 128 instruksi; browser memakai maksimal 128 instruksi per tick dengan jeda scheduler 16 ms. Menunggu input tidak melakukan polling dan tidak menambah executionCount. Input Integer memakai desimal bulat; Real menerima desimal/exponent, bukan hex/Infinity/NaN; Boolean true/false; String mempertahankan whitespace; Character satu code point. Input invalid tidak memutasi variabel, event, atau instruction pointer. Input valid melanjutkan program. Stop membatalkan input; Reset membuang instance runtime.

Events sekarang: CONDITION_EVALUATED (hasil Boolean dan cabang), FLOW_TRAVERSED (ID asal/tujuan dan cabang bila keluar dari decision/loop), NODE_ENTER/EXIT (termasuk terminal), VARIABLE_DECLARE/UPDATE (before/after), VARIABLE_SCOPE_EXIT (nama lokal yang dihapus), INPUT_REQUEST, OUTPUT, RUNTIME_ERROR, PROGRAM_FINISHED, PROGRAM_STOPPED. Sequence monoton, tanpa timestamp/random ID. Snapshot dan payload disalin agar perubahan variabel tidak mengubah event sebelumnya. Run ulang menghasilkan output/event sequence yang sama untuk dokumen dan input yang sama. Terminal tidak dihitung dalam executionCount.

Limits: source 2000 UTF-16 units, 512 tokens, parser/AST/evaluation depth 64, runtime string/input 10000 units, output kumulatif 50000 units termasuk newline, 100000 instructions per run, event ring 5000. Dokumen maksimal 300 instruksi termasuk isi kedua cabang dan body loop, dengan kedalaman gabungan decision/loop maksimal 12. Event ring dapat memangkas event awal pada run panjang, sehingga full replay belum dijanjikan. visitedNodeIds/traversedEdgeIds disimpan terpisah untuk highlight yang bertahan sepanjang run; ukurannya dibatasi struktur program, bukan jumlah iterasi. Runtime tidak memanggil eval, Function, host function, network, shell, atau generated code.

UI Run memvalidasi keseluruhan dokumen sebelum menjalankan satu instruksi pun. Runtime failure mempertahankan output sebelum error tetapi menghentikan instruksi berikutnya. Masalah dan Console terpisah. Mengubah program/undo/import membatalkan runtime; title/layout changes tidak. Runtime/input/event tidak masuk persistence atau history editor.

Berikutnya: Step/Pause/speed/explanations Phase 5; arrays dan functions/scopes setelahnya. Core API `advance(1)` dapat menjadi fondasi Step, tetapi debugger tersebut belum diaktifkan di UI.

Decision mengevaluasi kondisi satu kali dan hanya menjalankan cabang terpilih. Stack menyimpan kelanjutan induk selama nested branch atau input menunggu. Cabang kosong tetap menghasilkan traversal decision→merge, tanpa langkah instruksi tambahan. Merge juga menghasilkan traversal sebelum melanjutkan induk; node sintetis ini tidak menambah executionCount. Error di kondisi/cabang menghentikan run sebelum merge/kelanjutan berikutnya. Run/Reset/edit membersihkan highlight sebelumnya.


## Perulangan

While mengevaluasi kondisi Boolean sebelum setiap iterasi, termasuk pemeriksaan terakhir yang menghasilkan false. Body boleh kosong; setiap pemeriksaan tetap menghitung satu langkah sehingga loop kosong tidak melewati batas eksekusi.

For memakai counter Integer yang sudah dideklarasikan. From/to/step bertipe Integer, dievaluasi sekali sebelum counter mendapat nilai from. Step 0 menghasilkan FOR_STEP_ZERO sebelum counter berubah. Positif memeriksa counter <= to, negatif counter >= to. Arah rentang yang tidak cocok menjalankan nol iterasi tetapi tetap mengisi counter dengan from. Sesudah body, counter ditambah step sebelum pemeriksaan berikutnya; penambahan akhir tetap terjadi, dan overflow Integer menghasilkan NUMBER_RANGE. Body, termasuk decision/loop di dalamnya, tidak boleh menulis counter aktif melalui assignment/input atau memakainya sebagai counter for lain (FOR_COUNTER_READONLY).

Compiler memakai salinan environment untuk body. Initialization di body tidak menjamin initialization setelah loop karena loop mungkin tidak pernah masuk. For sendiri pasti menginisialisasi counter. Deklarasi body boleh dipakai dalam body, dibuat ulang tiap iterasi, dan dihapus saat iterasi selesai; shadowing variabel outer ditolak. Untuk akumulasi, deklarasikan variabel sebelum loop. Stop/error mempertahankan snapshot saat berhenti untuk pemeriksaan; Reset membuangnya.

Stack mempertahankan header loop saat masuk body, kemudian kembali untuk pemeriksaan berikutnya. Nested for diinisialisasi ulang setiap kali dimasuki dari outer loop. CONDITION_EVALUATED menggunakan branch body/exit; FLOW_TRAVERSED mencakup jalur kembali dan keluar yang sama dengan projection. Input menunggu pada frame/iterasi aktif, menerima retry tanpa memajukan loop, lalu melanjutkan sesudah input. Tidak ada instruksi berulang yang dijalankan lewat recursive host calls.
