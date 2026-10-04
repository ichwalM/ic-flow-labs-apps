# Design system

Referensi yang diperiksa: https://iclabs.fikom.umi.ac.id/home dan https://iclabs.fikom.umi.ac.id/css/variables.css (2026-10-03). CSS publik memakai primary #2563eb, hover #1e40af, navy #1e3a8a, background #f8fbff, surface #fff, muted #eff6ff; ini token website yang diamati, bukan klaim pedoman identitas institusi resmi.

Semantic tokens terpusat di globals.css: background, surface, surface-muted, text-primary/secondary, border, primary/hover, danger, flow-edge, canvas-grid. Font system dengan Inter fallback, monospace untuk expression. Icon Lucide konsisten. Tidak memakai aset logo institusi sebagai brand produk resmi.

Codename FlowLab ada di config; bahasa Indonesia terpusat di copy. Symbol profile menggunakan terminator, rectangle, parallelogram, diamond; declaration rectangle provisional. Node mengandung label dan shape sehingga warna bukan satu-satunya pembeda. Focus ring, semantic buttons, inspector label, live save status, reduced motion, keyboard instruction list, responsive drawer. Canvas interaksi utama laptop; layar kecil panel satu per satu.

Phase 2 menambahkan kontrol Jalankan/Hentikan/Reset di toolbar serta tab Console/Masalah/Variabel di bawah canvas. Input muncul inline dengan tipe dan pesan retry; program output tidak bercampur diagnostics. Tab mendukung ArrowLeft/ArrowRight/Home/End. Label status live mengumumkan menunggu input, selesai, dihentikan, atau error. Panel variabel runtime diberi label tersendiri agar tidak tertukar dengan daftar deklarasi.

Phase 3 menambahkan diamond dengan token decision-border/decision-surface, tombol cabang Ya/Tidak, dan titik merge otomatis. Highlight memakai primary serta tanda centang pada node/cabang yang sudah dijalankan. Outline bersarang menyediakan jalur navigasi keyboard alternatif; inspector decision menyediakan insertion di dua cabang dan setelah merge. Kondisi panjang dipotong di canvas dan dapat dibaca penuh melalui inspector.

Phase 4 memakai diamond untuk kondisi loop, label Ulangi/Selesai, return edge ke sisi kiri header, dan body di bawah header. Form for memisahkan penghitung, mulai, sampai inklusif, dan perubahan per putaran. Outline menampilkan Isi perulangan; inspector memiliki tombol insert body/kelanjutan dan konfirmasi penghapusan seluruh subtree. Jalur eksekusi tetap ditandai setelah event lama dipangkas.
