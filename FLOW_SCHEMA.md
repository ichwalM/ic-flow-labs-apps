# Flow schema v4

`schemaVersion: 4`; metadata `{id, title}`; program `{startId, endId, instructions}`; layout `{positions: Record<instructionId, {x,y}>}`.

Instruction discriminated union:

- declaration `{id, kind, name, dataType, initialValue}`
- assignment `{id, kind, target, expression}`
- input `{id, kind, target, prompt}`
- output `{id, kind, mode, text}`
- decision `{id, kind, condition, consequent: Instruction[], alternate: Instruction[]}`
- while `{id, kind, condition, body: Instruction[]}`
- for `{id, kind, counter, from, to, step, body: Instruction[]}`

Output `mode` wajib `text` atau `expression`. Pada mode text, string ditampilkan apa adanya; expression diparse dan dievaluasi. `initialValue`, `expression`, dan `condition` adalah source grammar platform. Decision/while membutuhkan kondisi Boolean saat kompilasi. For membutuhkan counter Integer yang sudah dideklarasikan dan source expression Integer untuk from/to/step. Step nol ditolak saat eksekusi; step negatif sah. Body wajib array dan boleh kosong. Kedua branch wajib berupa array; array kosong berarti langsung menuju penggabungan. Merge nodes tidak disimpan dan tidak menerima posisi manual.

Metadata/start/end/instruction IDs stabil; seluruh node ID unik lintas cabang. Batas 300 instruksi total secara rekursif, 12 tingkat gabungan decision/loop, 1 MB import, teks 2000 karakter, title 100, koordinat finite dalam ±100000. Boundary Zod menolak versi asing, ID duplikat, posisi orphan, field asing, dan nama tidak valid. Preflight iteratif membatasi count/depth sebelum recursive validation dan menolak object cyclic. Program order tidak ditentukan dari layout. Compiler memeriksa declaration, definite initialization, dan tipe sebelum Run.

## Migrasi v1/v2/v3 → v4

`parseDocument` memeriksa legacy schema secara strict. V1 mendapat `mode: "text"` untuk output lama; v2 mempertahankan mode text/expression. V3 mempertahankan cabang yang sudah ada. Ketiganya kemudian divalidasi sebagai v4. Metadata, IDs, urutan, posisi, dan isi dipertahankan. Teks v1 `1 + unknown` tetap literal. V1 dengan mode tambahan atau v1/v2 berisi decision ditolak. Loop di dokumen legacy v1/v2/v3 ditolak. Migrasi idempotent untuk dokumen v4. Ekspor selalu v4; aplikasi fase lama tidak dapat membukanya.

Storage key tetap `flowlab.draft.v1` untuk menemukan draft yang sudah ada; suffix key historis ini tidak menentukan schemaVersion dokumen. Autosave menyimpan hasil migrasi v4. Urutan properti schema mengikuti dokumen baru agar roundtrip tidak mengubah serialized draft identik. Runtime values, output, input, diagnostics, event, serta penanda jalur yang dikunjungi tidak diserialisasi ke project.
