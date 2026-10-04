import type { Diagnostic, DiagnosticCode, RuntimeStatus } from '@flowlab/interpreter';

export const runtimeCopy = {
  run: 'Jalankan', stop: 'Hentikan', reset: 'Reset eksekusi', console: 'Console', problems: 'Masalah',
  empty: 'Hasil algoritma akan muncul di sini. Klik Jalankan untuk mencoba.',
  noOutput: 'Belum ada output dari program ini.',
  noProblems: 'Tidak ada masalah yang ditemukan.', submit: 'Kirim masukan', input: 'Nilai masukan',
  inputHint: 'Masukkan nilai untuk', variables: 'Nilai saat eksekusi', uninitialized: 'Belum diisi',
  outputMode: 'Jenis output', textMode: 'Teks biasa', expressionMode: 'Ekspresi', outputExpression: 'Ekspresi output',
  outputHint: 'Contoh: "Luas: " + luas. Teks dalam ekspresi memakai tanda petik ganda.',
  initialHint: 'Kosong berarti belum diisi. String: "teks", Character: \'A\', Boolean: true atau false.',
  resultHint: 'Perubahan algoritma menghapus hasil eksekusi sebelumnya.',
  steps: 'langkah', goTo: 'Periksa langkah', showVariables: 'Variabel',
} as const;
export const statusLabels: Record<RuntimeStatus, string> = {
  idle: 'Siap dijalankan', running: 'Berjalan', waiting_for_input: 'Menunggu masukan',
  finished: 'Program selesai', error: 'Periksa masalah', stopped: 'Program dihentikan',
};
const messages: Record<DiagnosticCode, (context: Diagnostic['context']) => string> = {
  INVALID_DOCUMENT: () => 'Dokumen algoritma tidak valid. Impor kembali file yang sesuai.',
  INVALID_EXPRESSION: () => 'Ekspresi belum benar. Periksa operator, tanda kurung, dan tanda petik.',
  EXPRESSION_LIMIT: () => 'Ekspresi terlalu panjang atau terlalu dalam. Pecah menjadi beberapa langkah.',
  TYPE_MISMATCH: (c) => `Operasi ini membutuhkan ${c.expected}, tetapi mendapat ${c.actual}. Periksa tipe data dan nilainya.`,
  VARIABLE_NOT_DECLARED: (c) => `Variabel "${c.name}" belum dibuat. Tambahkan deklarasi sebelum langkah ini.`,
  VARIABLE_NOT_ALWAYS_DECLARED: (c) => `Variabel "${c.name}" belum pasti dibuat di semua cabang. Deklarasikan sebelum kondisi agar tersedia pada kedua jalur.`,
  VARIABLE_UNINITIALIZED: (c) => `Variabel "${c.name}" belum memiliki nilai. Isi melalui nilai awal, input, atau proses terlebih dahulu.`,
  DUPLICATE_VARIABLE: (c) => `Variabel "${c.name}" sudah dibuat. Gunakan Ubah nilai untuk memperbaruinya.`,
  RESERVED_NAME: (c) => `"${c.name}" adalah kata khusus. Pilih nama variabel lain.`,
  DIVISION_BY_ZERO: () => 'Tidak dapat membagi dengan nol. Periksa nilai pembagi.',
  NUMBER_RANGE: () => 'Hasil angka di luar jangkauan. Gunakan angka yang lebih kecil; Integer harus berupa bilangan bulat yang aman.',
  STRING_LIMIT: () => 'Teks terlalu panjang. Maksimal 10.000 karakter saat eksekusi.',
  INVALID_CHARACTER: () => 'Character membutuhkan tepat satu karakter, misalnya A.',
  INPUT_INVALID: (c) => c.expected === 'Integer'
    ? `"${c.name}" membutuhkan angka bulat. Contoh: 10, 25, atau -5.`
    : c.expected === 'Real' ? `"${c.name}" membutuhkan angka. Contoh: 3.5 atau -2.`
      : `"${c.name}" membutuhkan Boolean. Ketik true atau false.`,
  FOR_STEP_ZERO: () => 'Perubahan tiap putaran tidak boleh 0. Gunakan angka positif untuk naik atau negatif untuk turun.',
  FOR_COUNTER_READONLY: (c) => `Counter for "${c.name}" diperbarui otomatis. Gunakan variabel lain untuk proses/input atau penghitung loop di dalamnya.`,
  STEP_LIMIT: (c) => `Program dihentikan setelah batas ${c.limit} langkah. Periksa alur algoritmamu.`,
  OUTPUT_LIMIT: (c) => `Output melebihi batas ${c.limit} karakter. Kurangi jumlah teks yang ditampilkan.`,
  INTERNAL_ERROR: () => 'Eksekusi mengalami masalah. Reset dan coba lagi; ekspor algoritma jika masalah berulang.',
};
export function diagnosticMessage(diagnostic: Diagnostic): string {
  const message = messages[diagnostic.code](diagnostic.context);
  return diagnostic.position === undefined ? message : `${message} (Posisi ${diagnostic.position + 1}.)`;
}
