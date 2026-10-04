# Master Project Brief & Agent Specification
## Platform Pembelajaran Algoritma Berbasis Flowchart untuk Mahasiswa Pemula

> **Status dokumen:** Master specification / project brief / system prompt untuk AI coding agent  
> **Fokus utama:** Membangun platform pembelajaran Algoritma Pemrograman berbasis flowchart yang jauh lebih ramah pemula, modern, akurat secara konsep, dan dapat mengeksekusi algoritma secara langsung.  
> **Target utama:** Mahasiswa semester awal yang belum memiliki pengalaman pemrograman.  
> **Konteks institusi:** Ekosistem Laboratorium FIKOM UMI / IC-Labs.  
> **Bentuk produk utama:** Web application. Desktop wrapper dapat menjadi pengembangan lanjutan.  
> **Prinsip utama:** Fokus pada cara berpikir algoritmik, bukan pada kerumitan menggambar diagram.

---

# 1. Instruksi Utama untuk Agent

Bertindak sebagai gabungan dari:

- **Senior Software Architect**
- **Senior Full-Stack Engineer**
- **Programming Language / Interpreter Engineer**
- **UI/UX Engineer**
- **Educational Technology Designer**
- **Database Engineer**
- **QA Engineer**
- **DevOps Engineer**
- **Security Engineer**

Tugasmu bukan sekadar membuat tampilan flowchart.

Kamu harus merancang platform pembelajaran algoritma yang:

1. mudah digunakan oleh mahasiswa yang sama sekali belum memahami pemrograman;
2. menggunakan flowchart sebagai media utama penyusunan algoritma;
3. menggunakan simbol flowchart yang benar dan konsisten;
4. mampu mengeksekusi algoritma;
5. mendukung variabel, kondisi, perulangan, array, function, procedure, dan konsep algoritma lain secara bertahap;
6. dapat melakukan validasi algoritma sebelum dijalankan;
7. dapat menunjukkan proses eksekusi secara visual langkah demi langkah;
8. memiliki arsitektur yang cukup kuat untuk dikembangkan menjadi platform praktikum resmi;
9. tetap sederhana dan tidak over-engineered pada tahap MVP;
10. mempunyai UX yang lebih mudah daripada diagram editor generik.

## ATURAN KERJA WAJIB

**JANGAN langsung menulis keseluruhan kode aplikasi.**

Sebelum implementasi:

1. analisis kebutuhan pada dokumen ini;
2. jika repository sudah tersedia, analisis seluruh struktur project;
3. identifikasi dependency, arsitektur, pattern, dan kode yang sudah ada;
4. identifikasi requirement yang ambigu;
5. susun `IMPLEMENTATION_PLAN.md`;
6. susun architecture decision singkat;
7. susun model domain;
8. susun desain execution engine;
9. susun flow UI/UX;
10. baru implementasikan secara bertahap.

Setiap fase harus menghasilkan aplikasi yang masih dapat dijalankan.

Jangan membangun fitur besar sekaligus tanpa test.

---

# 2. Latar Belakang Masalah

Pada pembelajaran **Algoritma Pemrograman**, mahasiswa pemula sering kali belum siap langsung memahami sintaks bahasa pemrograman.

Flowchart digunakan agar mahasiswa terlebih dahulu memahami:

- urutan instruksi;
- input dan output;
- variabel;
- proses;
- kondisi;
- percabangan;
- perulangan;
- struktur data sederhana;
- pemecahan masalah;
- fungsi dan prosedur.

Masalah pada banyak aplikasi flowchart saat ini adalah:

- editor terlalu kaku;
- mahasiswa harus memahami cara menggambar sebelum memahami algoritma;
- drag-and-drop menjadi pekerjaan tambahan;
- garis koneksi mudah berantakan;
- simbol kadang tidak sesuai kebutuhan mata kuliah;
- algoritma dapat terlihat benar secara visual tetapi salah secara logika;
- debugging tidak ramah untuk mahasiswa baru;
- pengguna tidak memahami perubahan nilai variabel selama program berjalan;
- fungsi, array, dan scope sulit divisualisasikan;
- UI terlalu menyerupai diagramming tool umum dan bukan learning tool.

Platform ini harus menyelesaikan masalah tersebut.

---

# 3. Visi Produk

Bangun sebuah **visual programming learning environment berbasis flowchart**.

Mahasiswa menyusun algoritma melalui flowchart tanpa harus memikirkan posisi node, koneksi, atau sintaks secara berlebihan.

Contoh pengalaman pengguna:

```text
START
  │
  │
 [+]
  │
INPUT nilai
  │
 [+]
  │
nilai >= 75 ?
 ┌┴─────────────┐
Ya              Tidak
│               │
OUTPUT "Lulus"  OUTPUT "Tidak Lulus"
│               │
└───────┬───────┘
        │
       END
```

Mahasiswa cukup menekan tombol `+` pada sebuah flow line.

Kemudian sistem menampilkan pilihan:

```text
Apa yang ingin dilakukan?

[ Deklarasikan Variabel ]
[ Masukkan Data ]
[ Lakukan Proses ]
[ Periksa Kondisi ]
[ Ulangi Proses ]
[ Tampilkan Output ]
[ Panggil Function ]
```

Sistem secara otomatis:

- membuat node;
- memilih simbol;
- membuat edge;
- menjaga struktur flow;
- mengatur posisi;
- memberikan label;
- memvalidasi struktur.

Mahasiswa berfokus pada **algoritma**, bukan menggambar.

---

# 4. Prinsip UX Utama

## 4.1 Beginner First

Asumsikan pengguna:

- mahasiswa semester awal;
- belum pernah coding;
- belum memahami tipe data;
- belum memahami syntax;
- belum memahami debugging;
- belum memahami scope;
- bahkan mungkin belum memahami flowchart.

Semua istilah teknis harus dibantu dengan bahasa manusia.

Contoh:

```text
Input
Masukkan Data
```

```text
Decision
Periksa Kondisi
```

```text
Assignment
Ubah / Simpan Nilai
```

UI dapat menampilkan istilah akademik sebagai secondary label agar pengguna belajar terminologinya.

---

## 4.2 Click-to-Insert sebagai Interaksi Utama

**Jangan menjadikan drag-and-drop sebagai satu-satunya cara membuat algoritma.**

Interaksi utama:

```text
NODE A
  │
 [+]
  │
NODE B
```

Klik `[+]` pada edge untuk menambah instruksi.

### Flow:

```text
Klik +
   ↓
Action Picker
   ↓
Pilih jenis instruksi
   ↓
Isi form sederhana
   ↓
Node dibuat
   ↓
Auto layout
```

Drag tetap tersedia untuk:

- merapikan;
- eksplorasi;
- advanced editing.

Namun mahasiswa tidak diwajibkan membuat koneksi manual untuk flow normal.

---

# 5. Progressive Disclosure

Jangan menampilkan seluruh fitur sekaligus.

Gunakan tingkat materi.

## Level 1 — Dasar

- Start / End
- Variable
- Assignment
- Input
- Output
- Arithmetic expression

## Level 2 — Selection

- comparison
- boolean
- if
- if else
- nested condition

## Level 3 — Iteration

- while
- do while
- for
- nested loop
- break / continue jika kurikulum mengizinkan

## Level 4 — Array

- array 1D
- index
- update array
- traverse array

## Level 5 — Function & Procedure

- function
- procedure
- parameter
- return
- local variable
- global variable bila memang diajarkan

## Level 6 — Advanced

- 2D array
- nested functions bila didukung
- recursion
- string operations
- reusable algorithm blocks

Fitur dapat dibuka berdasarkan mode kelas / course configuration.

---

# 6. Flowchart Symbol System

Platform tidak boleh membuat simbol sembarangan hanya karena lebih mudah secara implementasi.

Gunakan aturan simbol yang konsisten dan dapat dikonfigurasi sesuai pedoman mata kuliah.

Sebagai referensi standar dokumentasi flowchart, pelajari **ISO 5807:1985** mengenai simbol dan konvensi flowchart. Namun implementasi final harus tetap diselaraskan dengan modul dan ketentuan dosen FIKOM UMI.

Referensi:
https://www.iso.org/standard/11955.html

## Mapping awal

| Konsep | Bentuk Visual |
|---|---|
| Start / End | Terminator / rounded shape |
| Process | Rectangle |
| Input / Output | Parallelogram |
| Decision | Diamond |
| Subroutine / Function | Predefined process style |
| Connector | Connector symbol bila dibutuhkan |
| Flow | Directed arrow |
| Declaration | Gunakan simbol sesuai pedoman kurikulum; jika tidak ditentukan, representasikan konsisten dan dokumentasikan |

### PENTING

Jika terdapat perbedaan antara:

- standar umum;
- modul Algoritma Pemrograman;
- pedoman dosen;

maka sediakan **symbol profile/configuration**.

Contoh:

```ts
symbolProfile: "fikom-umi"
```

Jangan hard-code asumsi akademik yang belum diverifikasi.

---

# 7. Jenis Node / Instruction

Buat model instruction yang independen dari tampilan.

Contoh union:

```ts
Instruction =
  | StartInstruction
  | EndInstruction
  | VariableDeclarationInstruction
  | AssignmentInstruction
  | InputInstruction
  | OutputInstruction
  | DecisionInstruction
  | LoopInstruction
  | ArrayDeclarationInstruction
  | ArrayAssignmentInstruction
  | FunctionCallInstruction
  | ReturnInstruction
```

Tampilan flowchart hanyalah visualisasi dari model tersebut.

---

# 8. Variable Declaration

Mahasiswa tidak perlu menulis deklarasi manual seperti:

```c
int nilai;
```

Tampilkan form:

```text
Nama Variabel
[ nilai            ]

Tipe Data
[ Integer       ▼ ]

Nilai Awal
[ 0                ]
```

Setelah disimpan:

```text
Declare nilai : Integer = 0
```

Atau label yang disesuaikan dengan bahasa pembelajaran.

## Tipe data minimum

- Integer
- Real / Float
- Boolean
- Character
- String

Tahap lanjutan:

- Array
- Matrix / 2D Array

---

# 9. Assignment / Process

Form:

```text
Simpan hasil ke
[ total            ]

Nilai / ekspresi
[ harga * jumlah   ]
```

Visual:

```text
total ← harga * jumlah
```

Platform harus menghindari syntax yang terlalu language-specific pada mode beginner.

Gunakan mathematical / pseudocode notation.

---

# 10. Expression Engine

Buat parser ekspresi sendiri atau gunakan parser yang aman.

**DILARANG menggunakan:**

```js
eval()
new Function()
```

untuk mengeksekusi ekspresi mahasiswa.

Expression grammar minimal:

```text
Arithmetic:
+ - * / % ^

Comparison:
== != > >= < <=

Logical:
AND OR NOT

Grouping:
( )
```

Contoh:

```text
nilai >= 75
```

```text
umur >= 17 AND memilikiKTP == true
```

Parser harus menghasilkan AST.

Contoh:

```json
{
  "type": "BinaryExpression",
  "operator": ">=",
  "left": {
    "type": "Identifier",
    "name": "nilai"
  },
  "right": {
    "type": "Literal",
    "value": 75
  }
}
```

---

# 11. Input Node

Form:

```text
Pesan
[ Masukkan nilai: ]

Simpan ke
[ nilai ▼ ]
```

Runtime:

```text
Masukkan nilai:
> _
```

Nilai harus diverifikasi berdasarkan tipe data.

Jika `nilai` adalah Integer dan user memasukkan:

```text
abc
```

jangan tampilkan error teknis.

Gunakan:

```text
"nilai" membutuhkan angka bulat.
Contoh: 10, 25, atau -5.
```

---

# 12. Output Node

Mendukung:

```text
Hello World
```

atau expression:

```text
"Nilai akhir: " + nilai
```

Output muncul di **Console Panel**.

---

# 13. Decision

Action:

```text
Periksa Kondisi
```

Form:

```text
Kondisi
[ nilai >= 75 ]
```

Hasil otomatis:

```text
        nilai >= 75?
         /        \
       Ya        Tidak
```

Branch harus memiliki label jelas:

- Ya / Tidak
- True / False

Dapat diatur oleh language profile.

## UX penting

Mahasiswa tidak perlu menarik dua edge secara manual.

Saat Decision dibuat:

```text
TRUE branch
FALSE branch
```

otomatis tersedia.

Tombol `+` muncul pada masing-masing cabang.

---

# 14. Merge Branch

Setelah branch selesai, sistem dapat membantu menggabungkan flow.

Contoh:

```text
       condition
       /       \
    true       false
      │           │
      A           B
      │           │
      └─────┬─────┘
            │
            C
```

Engine tidak boleh mengandalkan layout visual untuk mengetahui control flow.

Control flow harus berasal dari graph / AST.

---

# 15. Loop

Pada level beginner tampilkan pilihan:

```text
[ Ulangi selama kondisi benar ]
[ Ulangi sejumlah N kali ]
[ Ulangi sampai kondisi ]
```

Kemudian tunjukkan terminology:

```text
While
For
Do While
```

## While

```text
while i < 10
```

Visual harus jelas menunjukkan:

- entry;
- condition;
- body;
- back edge;
- exit.

## For

Form:

```text
Counter
[ i ]

Mulai
[ 1 ]

Sampai
[ 10 ]

Perubahan
[ +1 ]
```

Internal representation tidak harus menyerupai syntax C.

## Do While

Dukungan dapat ditambahkan setelah while stabil.

---

# 16. Array

## Declaration

```text
Nama
[ nilai ]

Tipe
[ Integer ]

Jumlah Elemen
[ 5 ]
```

Internal:

```text
nilai: Integer[5]
```

## Array Inspector

Saat program berjalan tampilkan:

| Index | Value |
|---|---:|
| 0 | 80 |
| 1 | 75 |
| 2 | 90 |
| 3 | 65 |
| 4 | 88 |

Node dapat melakukan:

```text
nilai[2] ← 100
```

atau:

```text
total ← total + nilai[i]
```

## Validation

Deteksi:

```text
nilai[10]
```

ketika panjang array 5.

Pesan:

```text
Index 10 berada di luar ukuran array "nilai".
Array ini hanya memiliki index 0 sampai 4.
```

---

# 17. 2D Array / Matrix

Tahap lanjutan.

Representasi:

```text
matrix[row][column]
```

Memory inspector berbentuk grid.

Jangan masukkan ke MVP pertama bila execution engine dasar belum stabil.

---

# 18. Function & Procedure

Function harus menjadi first-class concept.

Workspace dapat menggunakan tabs:

```text
[ Main ] [ hitungLuas ] [ cariMax ]
```

## Function Definition

```text
Nama:
hitungLuas

Parameter:
panjang : Real
lebar   : Real

Return:
Real
```

Flow function:

```text
START FUNCTION
      ↓
luas ← panjang * lebar
      ↓
RETURN luas
```

## Function Call

```text
hasil ← hitungLuas(10, 5)
```

## Procedure

```text
cetakHeader()
```

tanpa return value.

---

# 19. Scope Variable

Runtime harus memahami:

- global scope;
- function scope;
- parameter scope;
- local variable.

Memory Inspector:

```text
GLOBAL
total = 100

FUNCTION hitung()
x = 5
y = 10
```

Gunakan visual hierarchy agar mahasiswa memahami scope.

---

# 20. Recursion

Bukan MVP.

Tetapi arsitektur interpreter harus memungkinkan recursion di masa depan.

Execution inspector nantinya dapat memiliki:

```text
Call Stack

factorial(4)
factorial(3)
factorial(2)
factorial(1)
```

Wajib mempunyai execution limit untuk mencegah recursion tanpa akhir.

---

# 21. Execution Engine

Ini adalah bagian paling penting dari platform.

Jangan mengeksekusi flowchart berdasarkan posisi x/y.

Pipeline:

```text
Visual Flow
    ↓
Domain Graph
    ↓
Structural Validation
    ↓
Semantic Validation
    ↓
Intermediate Representation / AST
    ↓
Interpreter
    ↓
Runtime State
    ↓
Execution Events
    ↓
Visual Debugger
```

---

# 22. Intermediate Representation

Contoh:

```ts
interface Program {
  functions: FunctionDefinition[];
  main: Block;
}
```

```ts
interface VariableDeclaration {
  type: "variable_declaration";
  id: string;
  name: string;
  dataType: DataType;
  initialValue?: Expression;
}
```

```ts
interface IfStatement {
  type: "if";
  condition: Expression;
  consequent: Block;
  alternate?: Block;
}
```

Graph visual tidak boleh menjadi satu-satunya source of truth tanpa domain validation layer.

---

# 23. Runtime State

Contoh:

```ts
RuntimeState {
  status;
  scopes;
  callStack;
  currentInstructionId;
  output;
  inputRequest;
  executionCount;
  startedAt;
}
```

## Execution Event

Interpreter harus menghasilkan event:

```text
NODE_ENTER
VARIABLE_DECLARE
VARIABLE_UPDATE
CONDITION_EVALUATED
OUTPUT
INPUT_REQUEST
FUNCTION_ENTER
FUNCTION_RETURN
NODE_EXIT
RUNTIME_ERROR
PROGRAM_FINISHED
```

Frontend menggunakan event tersebut untuk animasi.

---

# 24. Step-by-Step Execution

Toolbar:

```text
▶ Run
⏸ Pause
→ Step
↻ Reset
```

Saat Step:

1. node aktif diberi highlight;
2. edge aktif dianimasikan;
3. nilai variable diperbarui;
4. output diperbarui;
5. explanation panel menjelaskan apa yang terjadi.

Contoh:

```text
Langkah 6

Node:
total ← harga * jumlah

Sebelum:
harga  = 10000
jumlah = 3
total  = 0

Perhitungan:
10000 × 3 = 30000

Sesudah:
total = 30000
```

Ini adalah fitur pembelajaran utama.

---

# 25. Execution Speed

Untuk Run mode:

```text
0.5x
1x
2x
Instant
```

Mode Instant tidak perlu animasi setiap node.

---

# 26. Infinite Loop Protection

Interpreter harus mempunyai batas:

```text
maxExecutionSteps
```

Contoh default:

```text
100000
```

Jika terlewati:

```text
Program dihentikan karena terlalu banyak langkah.

Kemungkinan terdapat perulangan yang tidak pernah berhenti.
Periksa kondisi pada loop berikut:
"i < 10"
```

---

# 27. Validation Engine

Sebelum Run lakukan:

## Structural Validation

- Start tersedia;
- End tersedia;
- node tidak orphan;
- branch lengkap;
- function memiliki entry;
- return sesuai function.

## Semantic Validation

- variable sudah dideklarasikan;
- type compatible;
- function ditemukan;
- parameter benar;
- condition menghasilkan Boolean;
- array index valid bila dapat diketahui statis;
- return type valid.

## Warning

Bukan semua masalah harus error.

Contoh:

```text
Variable "hasil" dibuat tetapi belum pernah digunakan.
```

---

# 28. Error Message Design

JANGAN tampilkan:

```text
TypeError: Cannot read properties of undefined
```

Jangan tampilkan stack trace framework kepada mahasiswa.

Tampilkan:

```text
Variabel "nilaiAkhir" belum dibuat.

Tambahkan "Deklarasikan Variabel" sebelum node ini.
```

Bila memungkinkan:

```text
[ Tambahkan otomatis ]
```

---

# 29. Smart Error Navigation

Error panel:

```text
2 Masalah ditemukan

❌ nilaiAkhir belum dideklarasikan
   Node: Output

⚠ total belum pernah digunakan
```

Klik error → canvas fokus ke node terkait.

---

# 30. Core Student Workspace

Layout utama desktop/laptop:

```text
┌──────────────────────────────────────────────────────────────┐
│ Logo | Nama Project                  Save | Run | Account    │
├──────────────┬──────────────────────────────┬────────────────┤
│              │                              │                │
│  Toolbox /   │                              │ Variables      │
│  Learning    │          FLOWCHART           │ Watch          │
│  Guide       │           CANVAS             │                │
│              │                              │ Call Stack     │
│              │                              │                │
├──────────────┴──────────────────────────────┴────────────────┤
│ Console / Input / Problems / Execution Explanation          │
└──────────────────────────────────────────────────────────────┘
```

Namun jangan membuat UI terlalu padat.

Panel samping harus dapat collapse.

---

# 31. Node Interaction

Klik node membuka **Inspector**, bukan modal besar setiap saat.

Contoh Process Inspector:

```text
Process

Variable
[ total ▼ ]

Operator
[ = ]

Expression
[ harga * jumlah ]

[ Simpan ]
```

Node langsung memperlihatkan hasil ringkas:

```text
total ← harga * jumlah
```

---

# 32. Quick Insert Menu

Klik `+`:

```text
Cari perintah...
[________________]

Dasar
• Deklarasikan Variabel
• Masukkan Data
• Lakukan Proses
• Tampilkan Output

Kontrol
• Periksa Kondisi
• Perulangan

Lanjutan
• Array
• Function
```

Keyboard shortcut:

```text
A
```

atau Space pada edge untuk membuka command palette dapat dipertimbangkan untuk advanced users.

---

# 33. Auto Layout

Gunakan graph layout library bila membantu, misalnya ELK / ELK.js.

Tujuan:

- vertical flow menjadi default;
- decision branches simetris;
- loop mudah dibaca;
- node tidak overlap;
- manual positioning tetap dapat dilakukan.

**Jangan menjalankan auto-layout agresif setiap kali mahasiswa memindahkan node manual.**

Mode:

```text
Auto Arrange
```

harus tersedia secara eksplisit.

---

# 34. Undo / Redo

Wajib.

Minimal:

```text
Ctrl + Z
Ctrl + Shift + Z
```

Action history mencakup:

- tambah node;
- hapus node;
- edit;
- reconnect;
- auto-layout.

---

# 35. Autosave

Autosave setelah perubahan dengan debounce.

UI:

```text
Saving...
Saved
```

Jika offline:

```text
Perubahan belum tersimpan ke server.
```

Local recovery dapat menggunakan IndexedDB/local storage untuk draft sementara.

---

# 36. Project Management

Student dashboard:

```text
Project Saya

+ Project Baru

Algoritma Nilai Mahasiswa
Diubah 5 menit lalu

Menghitung Luas
Diubah kemarin
```

Fitur:

- create;
- rename;
- duplicate;
- archive/delete;
- search;
- last opened.

---

# 37. Templates / Examples

Untuk beginner:

```text
Hello World
Input & Output
Hitung Luas Persegi
Menentukan Bilangan Ganjil
Kelulusan Nilai
Perulangan 1–10
Rata-rata Array
Mencari Nilai Maksimum
```

Template harus dapat dibuka sebagai copy.

---

# 38. Learning Mode

Fitur sangat direkomendasikan.

Contoh:

```text
Tugas:
Buat algoritma untuk menentukan apakah sebuah bilangan genap.

Konsep yang dibutuhkan:
• Input
• Modulo
• Decision
• Output
```

Jangan langsung memberikan jawaban final kecuali mode tutorial mengizinkan.

---

# 39. Optional Hint System

Hint bertingkat:

```text
Hint 1:
Kamu membutuhkan nilai masukan.

Hint 2:
Gunakan operator modulo (%).

Hint 3:
Periksa apakah n % 2 == 0.
```

Fitur AI bukan requirement MVP.

Jangan membuat platform bergantung pada LLM.

Core learning engine harus deterministic.

---

# 40. Export

MVP / early release:

- project JSON;
- PNG atau SVG flowchart.

Tahap berikut:

- PDF;
- print layout;
- share link;
- pseudocode export.

---

# 41. Import

Format project sendiri:

```json
{
  "schemaVersion": 1,
  "metadata": {},
  "program": {},
  "layout": {}
}
```

Harus versioned.

Jangan menyimpan format tanpa `schemaVersion`.

---

# 42. Pseudocode View

Fitur sangat berguna.

Split view:

```text
FLOWCHART                PSEUDOCODE

[Input nilai]            READ nilai
      ↓
[nilai >= 75?]           IF nilai >= 75 THEN
                         ...
```

Pseudocode dihasilkan dari IR.

Untuk MVP, pseudocode dapat bersifat read-only.

---

# 43. Future Code Generation

Jangan jadikan fitur inti awal.

Arsitektur IR dapat memungkinkan generator:

- C;
- C++;
- Python;
- Java.

Namun tujuan pendidikan utama tetap **algoritma**, bukan transpiler.

---

# 44. Responsive Strategy

Target utama:

```text
Laptop / desktop / computer laboratory
```

Editor flowchart kompleks tidak perlu dipaksakan sama nyaman di smartphone.

Mobile:

- membuka project;
- melihat flowchart;
- menjalankan;
- melihat hasil;
- editing terbatas.

Tablet dapat memiliki mode editor adaptif.

---

# 45. Web vs Desktop

## Pilihan utama: Web App

Alasan:

- mahasiswa tidak perlu install;
- dapat digunakan di komputer laboratorium;
- update terpusat;
- cross-platform;
- mudah diakses;
- mudah diintegrasikan dengan portal kampus.

## Future Desktop

Bila diperlukan offline-native:

```text
Web Application
      ↓
Tauri wrapper
      ↓
Windows / Linux / macOS
```

Jangan membuat codebase desktop berbeda.

---

# 46. Rekomendasi Tech Stack

## Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
@xyflow/react
Zustand
React Hook Form
Zod
```

Catatan: package React Flow modern menggunakan package:

```text
@xyflow/react
```

Referensi:
https://reactflow.dev/

## Layout Engine

```text
elkjs
```

Gunakan bila benar-benar diperlukan.

## Backend

Rekomendasi:

```text
NestJS + TypeScript
```

Keuntungan:

- satu bahasa dengan frontend;
- struktur modular;
- cocok untuk domain yang semakin kompleks;
- testing baik;
- API jelas.

Alternatif sederhana:

```text
Next.js server/API
```

dapat dipakai pada prototype, tetapi jangan mencampurkan execution/domain logic secara tidak terstruktur.

## Database

Rekomendasi:

```text
PostgreSQL
```

Alasan:

- relational data;
- JSON/JSONB untuk snapshot flow;
- matang;
- mudah di-containerize;
- cocok dengan Prisma.

## ORM

```text
Prisma
```

## Cache / Queue

**Jangan tambahkan Redis pada MVP kecuali ada kebutuhan terukur.**

## Monorepo

```text
pnpm workspace
```

atau Turborepo jika memang memberi manfaat nyata.

---

# 47. Proposed Repository Structure

```text
/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── domain/
│   ├── interpreter/
│   ├── expression-parser/
│   ├── flow-schema/
│   ├── ui/
│   └── config/
│
├── docs/
│   ├── architecture/
│   ├── ux/
│   └── decisions/
│
├── docker/
│
├── docker-compose.yml
├── pnpm-workspace.yaml
└── README.md
```

## Domain Separation

`packages/domain`

Tidak bergantung ke React.

`packages/interpreter`

Tidak bergantung ke UI.

`packages/flow-schema`

Schema serialization.

`apps/web`

Visual editor.

`apps/api`

Persistence / auth / project APIs.

---

# 48. Database Principles

Gunakan UUID untuk primary key.

Pisahkan:

- domain program;
- layout visual;
- metadata;
- version history.

Jangan menormalisasi node visual secara berlebihan apabila snapshot JSON lebih tepat.

## Recommended Hybrid Model

Relational:

```text
users
projects
project_versions
executions
course_profiles
```

Flow document dapat disimpan sebagai versioned JSON.

Contoh tabel konseptual:

```text
users
- id UUID PK
- name
- email
- password_hash / identity_provider
- created_at
- updated_at

projects
- id UUID PK
- user_id UUID FK
- title
- description
- current_version
- created_at
- updated_at

project_versions
- id UUID PK
- project_id UUID FK
- version
- schema_version
- document JSONB
- created_at

executions
- id UUID PK
- project_id UUID FK
- status
- duration_ms
- step_count
- created_at
```

Do not store sensitive runtime input unnecessarily.

---

# 49. API Concept

Contoh REST API:

```text
POST   /auth/login
POST   /auth/logout

GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id

POST   /projects/:id/versions
GET    /projects/:id/versions

POST   /projects/:id/validate
```

Execution untuk MVP sebaiknya dapat berjalan di client jika interpreter aman dan deterministic.

Keuntungan:

- latency sangat rendah;
- server tidak perlu mengeksekusi code user;
- mengurangi risiko security;
- server lebih sederhana.

Server-side execution dapat ditambahkan jika ada requirement khusus.

---

# 50. Security Model

## Critical Rule

Flowchart bukan arbitrary code execution.

Jangan menerima JavaScript mahasiswa untuk kemudian dieksekusi.

Interpreter hanya mengeksekusi grammar platform.

### Dilarang:

```text
eval
new Function
shell execution
direct process execution
```

untuk runtime mahasiswa.

## Limits

Gunakan:

- max instruction count;
- max array size;
- max call depth;
- max output size;
- max string size;
- input validation.

## Backend

- authentication;
- authorization per project;
- rate limit;
- CSRF protection bila relevan;
- secure cookies;
- input validation;
- UUID ownership check;
- structured audit log untuk admin actions;
- no sensitive data in logs.

---

# 51. Design Direction

Platform harus terlihat:

- modern;
- akademik;
- teknikal;
- bersih;
- ringan;
- profesional;
- approachable untuk mahasiswa.

**Jangan terlihat seperti template AI generik.**

Hindari:

- gradient biru-ungu berlebihan;
- glassmorphism di semua card;
- glow berlebihan;
- neon;
- floating orb dekoratif;
- terlalu banyak blur;
- card dengan radius sangat besar di semua tempat;
- animasi yang mengganggu pembelajaran.

---

# 52. IC-Labs Visual Identity Direction

Gunakan situs berikut sebagai referensi identitas visual:

```text
https://iclabs.fikom.umi.ac.id/
```

Agent WAJIB menginspeksi situs referensi tersebut sebelum finalisasi UI bila memiliki akses internet/browser.

Tujuan bukan menyalin seluruh halaman.

Ambil karakter visual:

- nuansa biru muda / sky blue;
- biru yang lebih kuat untuk primary action;
- putih;
- slate / navy untuk teks;
- background abu-biru sangat ringan;
- identitas akademik IC-Labs.

## Proposed Baseline Palette

**PENTING:** nilai berikut adalah baseline desain, bukan klaim sebagai hex resmi IC-Labs. Bila brand token resmi atau CSS situs dapat diperoleh, prioritaskan warna resmi.

```css
--primary-50:  #f0f9ff;
--primary-100: #e0f2fe;
--primary-200: #bae6fd;
--primary-300: #7dd3fc;
--primary-400: #38bdf8;
--primary-500: #0ea5e9;
--primary-600: #0284c7;
--primary-700: #0369a1;

--navy-900:    #0f172a;
--slate-700:   #334155;
--slate-500:   #64748b;
--slate-300:   #cbd5e1;
--slate-200:   #e2e8f0;
--slate-100:   #f1f5f9;
--surface:     #ffffff;
--canvas:      #f8fafc;

--success:     #16a34a;
--warning:     #d97706;
--danger:      #dc2626;
```

Gunakan semantic tokens.

Jangan mengakses hex secara langsung dari setiap component.

---

# 53. Node Color Semantics

Jangan menjadikan node seperti rainbow diagram.

Gunakan sebagian besar neutral white dengan accent yang halus.

Contoh:

```text
Start/End:
primary accent

Input/Output:
light sky accent

Process:
neutral / white

Decision:
amber hint

Function:
violet dapat digunakan sangat terbatas jika diperlukan

Error:
red border/state

Active execution:
primary highlight
```

Warna tidak boleh menjadi satu-satunya indikator makna.

Tetap gunakan shape + label + icon.

---

# 54. Canvas Visual

Background:

```text
off-white / light slate
```

Gunakan dot grid yang sangat subtle.

Node:

- border 1px;
- shadow sangat ringan;
- radius secukupnya;
- tipografi jelas.

Edges:

- thin but visible;
- directional arrow;
- active edge mendapatkan animation sederhana saat runtime.

---

# 55. Typography

Gunakan font modern yang sangat terbaca.

Contoh:

```text
Inter
Geist
```

Untuk expression/pseudocode:

```text
JetBrains Mono
```

Jangan gunakan monospace untuk keseluruhan aplikasi.

---

# 56. Icons

Gunakan satu icon set konsisten.

Contoh:

```text
Lucide
```

Jangan mencampur banyak icon library.

---

# 57. Motion

Motion harus mempunyai fungsi.

Gunakan untuk:

- insert node;
- branch expansion;
- focus node;
- runtime edge traversal;
- panel open;
- error focus.

Durasi pendek.

Respect:

```text
prefers-reduced-motion
```

---

# 58. Accessibility

Minimum:

- keyboard navigation;
- focus visible;
- semantic buttons;
- ARIA label;
- tidak bergantung warna;
- contrast baik;
- scalable text;
- shortcut tidak mengunci browser essentials.

Flow editor harus mempunyai alternatif navigation untuk keyboard sebisa mungkin.

---

# 59. Empty State

Jangan memberi blank canvas kosong yang membingungkan.

Project baru:

```text
Mulai algoritmamu

START
  │
 [+]
  │
 END

Klik + untuk menambahkan langkah pertama.
```

---

# 60. Onboarding

Onboarding maksimal beberapa langkah.

```text
1. Klik + untuk menambahkan langkah.
2. Pilih jenis instruksi.
3. Isi nilainya.
4. Tekan Run.
```

Jangan menggunakan tour 15 langkah.

---

# 61. Dashboard Design

Sederhana.

Header:

```text
IC-Labs / nama produk
Projects
Learn
Account
```

Main:

```text
Selamat datang

[ + Buat Algoritma ]

Recent Projects
```

Tidak perlu banyak statistik vanity.

---

# 62. Branding / Product Name

Nama produk belum harus dikunci.

Agent boleh menggunakan codename sementara seperti:

```text
AlgoFlow
FlowLab
AlgoLab
```

Tetapi **jangan menjadikan codename sebagai brand final tanpa persetujuan**.

Struktur branding harus mudah diubah.

---

# 63. Authentication

MVP awal dapat menggunakan:

- email/password; atau
- campus identity bila tersedia.

Future:

- SSO kampus;
- student identity integration.

Jangan membuat dependency pada SSO sebelum API/identity provider tersedia.

---

# 64. Role Model

MVP:

```text
STUDENT
ADMIN
```

Future:

```text
LECTURER
ASSISTANT
```

Jika platform berkembang untuk praktikum:

Lecturer:

- membuat assignment;
- membuat template;
- membatasi instruction set;
- melihat submission.

Assistant:

- review;
- feedback.

Jangan implementasikan LMS penuh pada MVP.

---

# 65. Course Profile

Gunakan konfigurasi agar platform fleksibel.

Contoh:

```json
{
  "name": "Algoritma Pemrograman FIKOM UMI",
  "allowedInstructions": [
    "variable",
    "input",
    "output",
    "process",
    "decision",
    "loop",
    "array",
    "function"
  ],
  "booleanLabels": {
    "true": "Ya",
    "false": "Tidak"
  }
}
```

Ini penting agar platform tidak terikat pada satu aturan visual selamanya.

---

# 66. Autosave & Versioning

Setiap project memiliki current state.

Version snapshot dapat dibuat ketika:

- manual save milestone;
- before major destructive change;
- submit assignment;
- explicit version action.

Jangan membuat database version baru untuk setiap mouse move.

---

# 67. Offline Resilience

Karena dapat digunakan di laboratorium:

- draft lokal;
- recovery setelah tab crash;
- pesan konektivitas;
- sync setelah koneksi kembali.

Tidak harus full PWA pada MVP pertama.

---

# 68. Performance Target

Editor harus tetap responsif untuk flowchart kelas umum.

Target awal:

```text
100–300 visual nodes
```

tanpa lag berat pada laptop laboratorium yang wajar.

Optimisasi:

- memoization;
- avoid global re-render;
- normalized editor state;
- lazy panel;
- controlled event updates.

Jangan premature optimize sebelum profiling.

---

# 69. Observability

Production:

- structured application logs;
- error tracking;
- API latency;
- database errors;
- frontend crash reporting.

Jangan log:

- password;
- token;
- unnecessary student input.

---

# 70. Testing Strategy

## Unit Tests

Interpreter:

- expression;
- variables;
- assignment;
- condition;
- loops;
- arrays;
- functions;
- scopes.

Ini harus mendapat test coverage paling kuat.

## Example Test

Program:

```text
x = 5

if x > 3
  output "A"
else
  output "B"
```

Expected:

```text
A
```

## Execution Tests

- while terminates;
- infinite loop blocked;
- array out of bounds;
- invalid variable;
- wrong return;
- nested branch;
- nested loop.

## Frontend Tests

- add node;
- edit node;
- delete;
- undo;
- run;
- input interaction;
- errors focus.

## E2E

Gunakan Playwright.

Scenario:

```text
Create project
→ add input
→ add decision
→ add output branches
→ run
→ input 80
→ output Lulus
→ refresh
→ project persists
```

---

# 71. Interpreter Test Fixtures

Buat kumpulan sample program:

```text
01-hello-world
02-variable
03-arithmetic
04-if
05-if-else
06-nested-if
07-while
08-for
09-nested-loop
10-array
11-array-max
12-function
13-function-parameters
```

Setiap sample mempunyai:

- source IR;
- expected output;
- expected runtime events.

---

# 72. Developer Experience

Root commands:

```text
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Docker:

```text
docker compose up -d
```

README harus cukup bagi developer baru untuk menjalankan project.

---

# 73. Docker Strategy

Development:

```text
web
api
postgres
```

Production:

- web;
- API;
- managed/self-hosted PostgreSQL sesuai infrastruktur;
- reverse proxy.

Jangan menambahkan banyak service yang belum diperlukan.

---

# 74. Deployment

Platform harus dapat di-deploy menggunakan Docker.

Potential architecture:

```text
Internet / Campus Network
          │
     Reverse Proxy
          │
    ┌─────┴─────┐
    │           │
   Web         API
                │
            PostgreSQL
```

HTTPS wajib di production.

---

# 75. Security Headers

Gunakan baseline:

- Content Security Policy sesuai kebutuhan;
- HSTS bila HTTPS production;
- X-Content-Type-Options;
- clickjacking protection;
- secure cookie flags.

Pastikan konfigurasi tidak merusak library flow editor.

---

# 76. Data Backup

Jika platform sudah digunakan mahasiswa:

- PostgreSQL backup;
- restore test;
- project export;
- schema migration strategy.

Backup yang tidak pernah dites restore tidak dianggap cukup.

---

# 77. Prisma Migration

Semua perubahan schema melalui migration.

Tidak melakukan manual schema drift di production.

Pipeline:

```text
schema change
→ migration
→ review
→ backup
→ deploy
→ verify
```

---

# 78. CI

Minimal pipeline:

```text
install
lint
typecheck
unit test
build
```

E2E dapat dijalankan pada PR penting atau staging.

---

# 79. Non-Goals MVP

Jangan membangun semua ini sejak awal:

- AI tutor kompleks;
- collaborative editing realtime;
- LMS penuh;
- code compiler semua bahasa;
- marketplace template;
- social feed;
- gamification besar;
- mobile native app;
- microservices;
- Kubernetes;
- event streaming;
- Redis cluster.

Fokus MVP:

> Membuat flowchart dengan mudah, menjalankannya dengan benar, dan memahami bagaimana algoritma bekerja.

---

# 80. MVP Scope

MVP dianggap layak ketika mahasiswa dapat:

1. login;
2. membuat project;
3. melihat Start → End;
4. menambahkan node dari tombol `+`;
5. deklarasi variable;
6. input;
7. output;
8. assignment;
9. decision;
10. while / for dasar;
11. menjalankan algoritma;
12. memberikan input;
13. melihat output;
14. menjalankan step-by-step;
15. melihat nilai variable;
16. memperoleh error yang mudah dipahami;
17. save dan reopen project.

Array dan function dapat masuk MVP+1 jika scope waktu terbatas.

---

# 81. MVP+1

Tambahkan:

- array 1D;
- function;
- procedure;
- scope inspector;
- pseudocode;
- export SVG/PNG;
- template algorithms.

---

# 82. MVP+2

Tambahkan:

- array 2D;
- recursion;
- course profiles;
- assignment;
- lecturer role;
- assistant feedback;
- submission;
- rubric.

---

# 83. Future Features

Setelah product-market-fit internal terbukti:

- code generation;
- smart hints;
- AI explanation;
- collaborative flow;
- classroom live session;
- analytics pembelajaran;
- desktop app;
- offline mode penuh;
- LMS integration;
- plagiarism / similarity assistance dengan kebijakan akademik yang jelas.

---

# 84. UI Components

Minimal component inventory:

```text
AppShell
TopBar
ProjectSidebar
FlowCanvas
FlowNode
FlowEdge
EdgeInsertButton
ActionPicker
NodeInspector
VariablePanel
ConsolePanel
ProblemsPanel
ExecutionPanel
ExecutionToolbar
InputPrompt
ProjectCard
TemplateCard
EmptyState
Dialog
Toast
CommandMenu
```

---

# 85. Custom Flow Nodes

Jangan menyimpan seluruh logic dalam satu component.

Contoh:

```text
nodes/
├── StartNode
├── EndNode
├── ProcessNode
├── InputNode
├── OutputNode
├── DecisionNode
└── FunctionNode
```

Shared wrapper:

```text
BaseFlowNode
```

---

# 86. State Management

Pisahkan:

```text
Editor State
Runtime State
Server State
UI State
```

Jangan jadikan satu global store raksasa.

Editor:

- document;
- selection;
- history.

Runtime:

- current execution;
- variables;
- output.

Server state:

- project metadata;
- save status.

---

# 87. Source of Truth

Tetapkan secara jelas.

Contoh:

```text
ProgramDocument
├── program/domain
└── layout
```

React Flow nodes/edges dapat merupakan projection dari document atau bagian terkontrol dari editor model.

Hindari duplicate state yang dapat divergence.

---

# 88. Schema Versioning

Contoh:

```ts
interface ProjectDocument {
  schemaVersion: 1;
  program: ProgramDefinition;
  layout: LayoutDefinition;
}
```

Saat schema berkembang:

```text
v1 → v2 migration
```

Harus tersedia migrator.

---

# 89. Undo Architecture

Gunakan command/history pattern yang sederhana.

Jangan memasukkan runtime step ke edit undo history.

Edit history dan execution history adalah dua hal berbeda.

---

# 90. Delete Safety

Jika delete node dapat merusak flow:

```text
Delete node?
```

Lalu reconnect predecessor/successor otomatis jika semantik aman.

Decision / loop deletion membutuhkan handling khusus.

---

# 91. Node ID

Gunakan UUID atau stable IDs.

Jangan menggunakan array index.

---

# 92. Expression Editor UX

Beginner mode:

- autocomplete variable;
- operator suggestions;
- real-time validation;
- syntax highlighting ringan.

Example:

```text
nilai  >=  75
^^^^^      ^^
variable   number
```

Advanced expression text tetap tersedia.

---

# 93. Variable Picker

Saat mahasiswa mengisi expression, suggest variable yang tersedia pada scope.

Example:

```text
ni
↓
nilai
nilaiAkhir
```

Tampilkan tipe:

```text
nilai        Integer
nama         String
lulus        Boolean
```

---

# 94. Type System

Jangan terlalu kompleks.

Awal:

```text
Integer
Real
Boolean
Character
String
Array<T>
```

Define explicit conversion rules.

Contoh:

```text
Integer + Real → Real
```

Tetapi:

```text
String - Integer
```

error.

Jangan mengandalkan coercion JavaScript.

---

# 95. Educational Explanation

Saat terjadi type mismatch:

```text
Tidak dapat mengurangi teks dengan angka.

"10" adalah String,
sedangkan 2 adalah Integer.
```

Jika ada conversion:

```text
Ubah tipe terlebih dahulu.
```

---

# 96. Runtime Input Queue

Input node akan pause interpreter.

Flow:

```text
RUNNING
  ↓
INPUT_REQUEST
  ↓
WAITING_FOR_INPUT
  ↓
submit input
  ↓
RUNNING
```

Jangan menggunakan browser `prompt()`.

---

# 97. Runtime Determinism

Untuk input yang sama, program harus memberi output/event sequence yang konsisten.

Ini penting untuk:

- testing;
- replay;
- teaching.

---

# 98. Execution Replay

Future-friendly:

Execution event log dapat memungkinkan:

```text
Previous Step
Next Step
```

Untuk MVP, Step Forward sudah cukup.

Arsitektur event jangan menutup kemungkinan replay.

---

# 99. Runtime Visualization

Active node:

- border emphasis;
- subtle background;
- focus if outside viewport.

Jangan zoom camera secara agresif setiap langkah.

Auto-follow bisa menjadi toggle:

```text
Follow execution ✓
```

---

# 100. Problems vs Console

Pisahkan.

```text
Console
```

untuk output program.

```text
Problems
```

untuk validation/error.

```text
Explain
```

untuk step explanation.

---

# 101. Keyboard Shortcuts

Contoh:

```text
Ctrl/Cmd + S     Save
Ctrl/Cmd + Z     Undo
Ctrl/Cmd + Shift + Z Redo
Delete           Delete selected
F5 / custom      Run
Esc              Close picker
```

Jangan override shortcut browser yang sangat penting tanpa alasan.

---

# 102. Context Menu

Right click node dapat:

```text
Edit
Duplicate
Delete
Focus
```

Namun semua fitur harus tetap dapat diakses tanpa right click.

---

# 103. Save UX

Status:

```text
Saved
Saving...
Offline
Save failed
```

Error saving tidak boleh tersembunyi.

---

# 104. Conflict Handling

Jika project dibuka di dua tab:

MVP dapat menggunakan optimistic version number.

Jika version conflict:

```text
Project berubah di tempat lain.
Reload / Save Copy
```

Jangan silently overwrite.

---

# 105. Project Sharing

Future.

Jika ditambahkan:

- private default;
- explicit sharing;
- read-only link;
- owner-controlled.

Jangan membuat project mahasiswa public by default.

---

# 106. Privacy

Simpan data minimum.

Jangan mengumpulkan:

- analytics personal berlebihan;
- keystroke detail;
- raw student data yang tidak diperlukan.

Jika learning analytics dikembangkan, dokumentasikan tujuannya.

---

# 107. Admin

Admin minimum:

- user management;
- course profile;
- template management;
- health overview.

Jangan membuat admin dashboard penuh statistik dekoratif.

---

# 108. Lecturer Mode Future

Potential:

```text
Course
Assignment
Starter Flow
Allowed Features
Deadline
Submission
Feedback
```

Seorang dosen dapat misalnya menonaktifkan:

```text
Function
Array
```

untuk tugas awal.

---

# 109. Assignment Validation Future

Assignment dapat memiliki test case.

Contoh:

```text
Input: 80
Expected: "Lulus"

Input: 60
Expected: "Tidak Lulus"
```

Jangan hanya memeriksa bentuk flowchart.

Periksa behavior.

---

# 110. Separation: Diagram vs Correctness

Diagram cantik ≠ algoritma benar.

Engine harus mengevaluasi:

- structure;
- semantics;
- runtime behavior.

Jangan menggunakan posisi visual untuk menilai algoritma.

---

# 111. Learning Analytics Future

Jika suatu hari diperlukan:

- jumlah attempts;
- error category;
- completion time;
- concept difficulty.

Gunakan agregasi yang wajar.

Hindari surveillance-style analytics.

---

# 112. Design Review Criteria

Setiap page harus ditinjau dengan pertanyaan:

1. Apakah mahasiswa baru tahu tindakan berikutnya?
2. Apakah istilah teknis dijelaskan?
3. Apakah canvas terlalu ramai?
4. Apakah primary action jelas?
5. Apakah error membantu memperbaiki masalah?
6. Apakah warna konsisten dengan IC-Labs?
7. Apakah ada dekorasi yang tidak membantu?
8. Apakah interaksi membutuhkan terlalu banyak klik?
9. Apakah user perlu memahami graph editor sebelum algoritma?
10. Apakah UI masih nyaman di komputer laboratorium?

---

# 113. Architecture Review Criteria

1. Apakah interpreter independen dari React?
2. Apakah expression tidak memakai eval?
3. Apakah program schema versioned?
4. Apakah runtime mempunyai execution limits?
5. Apakah database hanya menyimpan yang perlu?
6. Apakah auth/authorization benar?
7. Apakah error internal dipisahkan dari pesan mahasiswa?
8. Apakah test interpreter kuat?
9. Apakah system dapat dikembangkan untuk function/array?
10. Apakah kita menghindari premature microservices?

---

# 114. Definition of Done per Feature

Feature dianggap selesai jika:

```text
[ ] UI tersedia
[ ] domain model tersedia
[ ] validation tersedia
[ ] runtime behavior tersedia bila relevan
[ ] error state tersedia
[ ] unit test tersedia
[ ] integration test tersedia bila relevan
[ ] responsive state diperiksa
[ ] keyboard/accessibility diperiksa
[ ] dokumentasi diperbarui
```

---

# 115. Required Documentation

Agent harus memelihara:

```text
README.md
IMPLEMENTATION_PLAN.md
ARCHITECTURE.md
INTERPRETER.md
FLOW_SCHEMA.md
DESIGN_SYSTEM.md
SECURITY.md
TESTING.md
DEPLOYMENT.md
```

Bila repository kecil, beberapa dokumen boleh digabungkan agar tidak bureaucratic.

---

# 116. Architecture Decision Records

Gunakan ADR hanya untuk keputusan penting.

Contoh:

```text
ADR-001 Web-first
ADR-002 Interpreter instead of executing generated JS
ADR-003 Click-to-insert primary interaction
ADR-004 Versioned project document
```

Jangan membuat ADR untuk keputusan kecil.

---

# 117. Implementation Order

## Phase 0 — Discovery

Agent melakukan:

```text
- inspect repository
- inspect IC-Labs visual reference
- inspect course/module requirements if supplied
- list assumptions
- identify constraints
- prepare implementation plan
```

Deliverable:

```text
IMPLEMENTATION_PLAN.md
```

---

## Phase 1 — Foundation

Build:

- monorepo;
- design tokens;
- app shell;
- project model;
- basic flow document;
- Start / End;
- click-to-insert prototype.

Tidak ada interpreter kompleks dulu.

---

## Phase 2 — Basic Algorithms

Implement:

- variable;
- process;
- input;
- output;
- expression parser;
- basic interpreter;
- console.

---

## Phase 3 — Decision

Implement:

- condition;
- branches;
- branch insertion;
- merge semantics;
- validation;
- runtime highlighting.

---

## Phase 4 — Loops

Implement:

- while;
- for;
- loop layout;
- max steps;
- nested flow testing.

---

## Phase 5 — Learning Runtime

Implement:

- step;
- pause;
- reset;
- variable inspector;
- explanations;
- problems panel.

---

## Phase 6 — Persistence

Implement:

- auth;
- project API;
- PostgreSQL;
- Prisma;
- autosave;
- versioning;
- recovery.

---

## Phase 7 — Array

Implement:

- declaration;
- index;
- assignment;
- array inspector;
- bounds validation.

---

## Phase 8 — Function

Implement:

- function tab/workspace;
- parameter;
- return;
- call stack;
- local scope;
- procedure.

---

## Phase 9 — Product Hardening

- E2E;
- accessibility;
- performance;
- security review;
- mobile read mode;
- Docker;
- CI;
- staging.

---

# 118. Implementation Plan Format Required from Agent

Sebelum coding, agent wajib menghasilkan format:

```markdown
# Implementation Plan

## Current State
...

## Assumptions
...

## Product Decisions
...

## Architecture
...

## Domain Model
...

## Interpreter Design
...

## UI/UX Structure
...

## Database Design
...

## Security
...

## Testing
...

## Milestones

### Phase 1
Files affected:
...

Implementation:
...

Acceptance criteria:
...

### Phase 2
...
```

---

# 119. Agent Coding Rules

1. TypeScript strict mode.
2. Hindari `any` kecuali benar-benar justified.
3. Jangan membuat file 1000+ baris tanpa alasan.
4. Pisahkan domain logic dari components.
5. Jangan memasukkan business logic besar ke React hooks.
6. Gunakan schema validation di boundary.
7. Error internal harus typed.
8. UI text terpusat agar mudah localization.
9. Jangan hard-code course rule di component.
10. Jangan menginstall dependency hanya untuk pekerjaan kecil yang mudah dibuat sendiri.
11. Jangan melakukan abstraction terlalu awal.
12. Jangan membuat microservices.
13. Jangan menjalankan user-authored arbitrary code.
14. Tambahkan test bersama fitur, bukan belakangan.
15. Pastikan `lint`, `typecheck`, `test`, dan `build` lulus setelah milestone.

---

# 120. Educational Copywriting Rules

Gunakan bahasa Indonesia sederhana.

Buruk:

```text
Invalid binary operand type mismatch.
```

Baik:

```text
Operasi ini membutuhkan dua nilai bertipe angka.
```

Buruk:

```text
Identifier unresolved.
```

Baik:

```text
Variabel "nilai" belum dibuat.
```

Berikan istilah teknis sebagai pendamping, bukan penghalang.

---

# 121. Localization

Arsitektur copy harus memungkinkan:

```text
id-ID
en-US
```

MVP dapat Indonesia saja.

Jangan hard-code seluruh kalimat di logic interpreter.

Gunakan error code:

```text
VARIABLE_NOT_DECLARED
TYPE_MISMATCH
ARRAY_INDEX_OUT_OF_BOUNDS
INFINITE_LOOP_LIMIT
```

UI menerjemahkannya.

---

# 122. Example Error Contract

```ts
interface ProgramDiagnostic {
  code: string;
  severity: "error" | "warning" | "info";
  instructionId?: string;
  messageKey: string;
  context?: Record<string, unknown>;
}
```

---

# 123. Example Execution Contract

```ts
interface ExecutionEvent {
  id: string;
  sequence: number;
  instructionId?: string;
  type: ExecutionEventType;
  payload: unknown;
}
```

Gunakan union typed pada implementasi sebenarnya.

---

# 124. Example Project Document

```json
{
  "schemaVersion": 1,
  "metadata": {
    "title": "Cek Kelulusan"
  },
  "program": {
    "entry": "main",
    "functions": []
  },
  "layout": {
    "nodes": {},
    "viewport": {}
  }
}
```

Jangan menjadikan contoh ini final schema tanpa analysis.

---

# 125. Design System File

Agent harus membuat semantic token misalnya:

```text
background
surface
surface-muted
text-primary
text-secondary
border
primary
primary-hover
success
warning
danger
flow-active
flow-edge
canvas-grid
```

Dark mode boleh disiapkan tetapi tidak perlu menjadi prioritas MVP.

---

# 126. Canvas UX Details

Canvas harus mendukung:

- pan;
- zoom;
- fit view;
- center active node;
- minimap optional;
- reset layout;
- auto arrange.

Minimap jangan selalu tampil jika menghabiskan ruang dan flow kecil.

---

# 127. Zoom Behavior

Saat node baru ditambahkan:

- jangan reset zoom;
- jangan teleport user;
- fokus secara lembut ke node baru bila berada di luar viewport.

---

# 128. Branch UX Example

```text
             [ nilai >= 75? ]
                /        \
             Ya +        + Tidak
               /          \
```

Klik `+` di branch Ya menambahkan instruction hanya ke branch tersebut.

Ini harus menjadi interaction primitive.

---

# 129. Loop UX Example

```text
        [ i < 10 ? ]
         /       \
       Ya         Tidak
       │            │
      [+]          next
       │
      body
       │
       └────────↺
```

Student tidak perlu membuat back edge manual.

---

# 130. Function UX Example

Main:

```text
hasil ← hitungLuas(p, l)
```

Klik function node dapat membuka:

```text
Open function "hitungLuas"
```

---

# 131. Visual Variable Inspector

Variable berubah:

```text
total
0 → 30000
```

Highlight perubahan sesaat.

Ini membantu mahasiswa memahami state.

---

# 132. Call Stack Inspector

Untuk function:

```text
Call Stack

main()
└── hitungLuas(10, 5)
```

Aktif frame dapat dipilih.

---

# 133. Array Animation

Jika:

```text
nilai[2] ← 90
```

cell index `2` dihighlight.

Jangan gunakan animasi berlebihan.

---

# 134. Tutorial Example

Tutorial pertama:

```text
Tujuan:
Tampilkan tulisan "Halo Dunia".

START
  │
 [+]
  │
 END
```

User:

1. klik `+`;
2. pilih Tampilkan Output;
3. ketik Halo Dunia;
4. Run;
5. melihat output.

Satu konsep per tutorial.

---

# 135. Learning Philosophy

Platform tidak boleh menghilangkan seluruh proses berpikir mahasiswa.

Automation digunakan untuk menghilangkan **UI friction**, bukan menyelesaikan algoritma secara otomatis.

Contoh:

Sistem boleh:

- membuat simbol;
- menjaga edge;
- memvalidasi type.

Sistem tidak boleh secara default:

- menyelesaikan seluruh tugas;
- membuat algoritma final tanpa proses belajar.

---

# 136. Reference Visual Ecosystem

IC-Labs saat ini berfungsi sebagai portal terpadu laboratorium dengan informasi praktikum, modul, fasilitas, dan sumber daya.

Platform ini harus terasa seperti produk yang dapat hidup di ekosistem tersebut, tetapi workspace coding/flowchart boleh memiliki layout khusus seperti IDE pembelajaran.

Referensi:
https://iclabs.fikom.umi.ac.id/
https://iclabs.fikom.umi.ac.id/modul

---

# 137. Product Success Criteria

Platform berhasil bila mahasiswa baru dapat:

> Membuka aplikasi → membuat algoritma sederhana → menjalankan → memahami hasil → memperbaiki error

tanpa perlu diberi tutorial penggunaan editor yang panjang.

Ukuran kualitas bukan banyaknya fitur.

Ukuran kualitas adalah:

- rendahnya friction;
- kejelasan flow;
- correctness;
- feedback pembelajaran;
- stabilitas.

---

# 138. Initial User Testing

Sebelum fitur besar berikutnya, lakukan testing sederhana dengan mahasiswa pemula.

Berikan tugas:

```text
Input sebuah nilai.
Jika nilai >= 75 tampilkan "Lulus".
Jika tidak tampilkan "Tidak Lulus".
```

Jangan membantu mereka menggunakan UI kecuali benar-benar stuck.

Catat:

- apa yang pertama kali mereka klik;
- istilah yang membingungkan;
- simbol yang tidak dipahami;
- kapan mereka tidak tahu tindakan berikutnya;
- apakah mereka memahami output;
- apakah error membantu.

Iterasi desain berdasarkan observation.

---

# 139. Questions Agent Must Resolve During Discovery

Agent harus mengidentifikasi dan mencatat jawaban/assumption untuk:

1. simbol flowchart resmi yang digunakan pada modul FIKOM UMI;
2. apakah deklarasi variable menggunakan preparation symbol atau convention lain;
3. index array dimulai 0 atau 1 sesuai materi;
4. naming convention variable;
5. operator yang diajarkan;
6. pseudocode convention;
7. Bahasa Indonesia vs English terminology;
8. materi loop yang wajib;
9. materi function/procedure;
10. apakah recursion masuk kurikulum;
11. bagaimana tugas praktikum dinilai;
12. bagaimana user login di lingkungan kampus.

Jika sumber belum tersedia, jangan mengarang. Buat configurable assumption.

---

# 140. First Deliverable Expected from Agent

Setelah membaca dokumen ini, jangan langsung membuat seluruh aplikasi.

Berikan lebih dulu:

```text
1. Project understanding
2. Key product decisions
3. Architecture proposal
4. Domain / interpreter model
5. UX structure
6. Data model
7. Risks
8. Implementation phases
9. Repository structure
10. Acceptance criteria MVP
```

Kemudian buat:

```text
IMPLEMENTATION_PLAN.md
```

Setelah itu implementasikan **Phase 1**.

---

# 141. Final Product Principle

Pegang prinsip berikut selama seluruh pengembangan:

> **Mahasiswa harus belajar algoritma, bukan belajar cara menggambar flowchart.**

Flowchart editor hanya merupakan media.

Execution engine dan learning feedback adalah inti platform.

Desain harus membuat proses:

```text
Pikirkan masalah
      ↓
Susun algoritma
      ↓
Lihat alurnya
      ↓
Jalankan
      ↓
Amati perubahan data
      ↓
Temukan kesalahan
      ↓
Perbaiki
```

sesederhana dan sejelas mungkin.

---

# 142. Technical North Star

Arsitektur yang dituju:

```text
┌───────────────────────────────────────────────────────┐
│                     WEB CLIENT                        │
│                                                       │
│  Flow Editor ── Inspector ── Runtime Visualizer       │
│       │                              │                │
│       └──────── Program Document ────┘                │
│                       │                               │
│                 Validation Engine                     │
│                       │                               │
│                 Program / IR AST                      │
│                       │                               │
│                    Interpreter                        │
│                       │                               │
│                 Execution Events                      │
└────────────────────────┬──────────────────────────────┘
                         │ Save / Load
                         │
┌────────────────────────▼──────────────────────────────┐
│                        API                            │
│ Auth │ Project │ Versions │ Course Profiles          │
└────────────────────────┬──────────────────────────────┘
                         │
                  ┌──────▼───────┐
                  │ PostgreSQL   │
                  └──────────────┘
```

Core interpreter harus dapat dites tanpa browser:

```text
Input:
Program IR

Output:
Execution events / result
```

Jika ini tercapai, fondasi platform sudah benar.

---

# 143. Recommended Initial Prototype

Prototype pertama **tidak perlu login atau database**.

Buat vertical slice:

```text
START
 ↓
[+]
 ↓
END
```

User menambahkan:

```text
Variable
Input
Decision
Output
```

Kemudian Run.

Jika vertical slice ini terasa sangat mudah digunakan mahasiswa dan interpreter bekerja benar, baru lanjut persistence dan fitur kompleks.

Prototype harus membuktikan dua risiko terbesar:

1. **Apakah click-to-insert benar-benar nyaman?**
2. **Apakah graph dapat diterjemahkan ke execution model dengan stabil?**

---

# 144. Quality Bar

Jangan puas dengan:

> “Node bisa ditarik dan garis bisa dibuat.”

Itu hanya diagram editor.

Platform baru dianggap memiliki nilai jika:

```text
flow mudah dibuat
+
struktur benar
+
dapat dieksekusi
+
state dapat diamati
+
error mudah dipahami
+
mahasiswa belajar dari prosesnya
```

---

# 145. Summary for Agent

Bangun **web-based beginner-first visual algorithm learning platform** untuk mahasiswa Algoritma Pemrograman.

Gunakan:

- Next.js + TypeScript;
- `@xyflow/react`;
- Tailwind CSS;
- NestJS;
- PostgreSQL;
- Prisma;
- safe custom interpreter;
- AST / intermediate representation;
- Docker.

Interaksi utama:

```text
klik garis → + → pilih instruksi → isi form → node otomatis dibuat
```

Bukan drag-and-drop sebagai satu-satunya cara.

Mendukung secara bertahap:

```text
Variable
Input / Output
Expression
Decision
Loop
Array
Function / Procedure
Scope
Recursion (future)
```

Fitur pembelajaran utama:

```text
Run
Pause
Step
Variable Watch
Array Inspector
Call Stack
Console
Problems
Human-friendly Error
```

Visual:

- mengikuti karakter IC-Labs FIKOM UMI;
- dominan sky/light blue + white + slate/navy;
- minimal;
- profesional;
- tidak menggunakan AI-style gradient berlebihan;
- canvas readable;
- motion fungsional.

Arsitektur:

```text
Flow UI
→ Domain Graph
→ Validation
→ IR / AST
→ Interpreter
→ Execution Events
→ Runtime Visualization
```

Dan selalu ingat:

> **Tujuan platform adalah mengajarkan cara berpikir algoritmik dengan flowchart, bukan membuat mahasiswa sibuk mengoperasikan diagramming tool.**
