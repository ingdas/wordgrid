// Bahasa Indonesia — papan asli, bukan terjemahan papan Inggris.
import type { LocaleContent } from "./types.ts";

export const content: LocaleContent = {
  keys: [
    "NYALA",
    "HANGAT",
    "SIMPUL",
    "SAMARAN",
    "PUSARAN",
    "PUSTAKA",
    "MISTERI",
    "SAMUDERA",
    "TIPU DAYA",
    "PERLAHAN",
    "BERBAHAYA",
    "KECERDASAN",
  ],
  decoys: [
    "WORTEL", "SELIMUT", "GERGAJI", "KELINCI", "JERAPAH",
    "SEPEDA", "PAYUNG", "KOMPOR", "BANTAL", "LEMARI",
    "SEPATU", "TOMAT", "GUNTING", "SENDOK", "GARPU",
    "BONEKA", "SEMANGKA", "NANAS", "PANDA", "TERMOS",
  ],
  campaign: {
    star: {
      title: "Bintang Utama",
      pivot: "BINTANG",
      categories: [
        { name: "Yang bersinar di langit malam", words: ["BULAN", "KOMET", "PLANET"] },
        { name: "Orang yang sangat terkenal", words: ["IDOLA", "LEGENDA", "IKON"] },
        { name: "Tanda penghargaan", words: ["MEDALI", "PIALA", "LENCANA"] },
        { name: "Bentuk sederhana", words: ["HATI", "PANAH", "SILANG"] },
      ],
    },
    trunk: {
      title: "Melebarkan Sayap",
      pivot: "SAYAP",
      categories: [
        { name: "Bagian tubuh burung", words: ["PARUH", "CAKAR", "BULU"] },
        { name: "Bagian pesawat terbang", words: ["KOKPIT", "TURBIN", "MONCONG"] },
        { name: "Posisi pemain sepak bola", words: ["KIPER", "BEK", "GELANDANG"] },
        { name: "Bagian gedung bertingkat", words: ["LOBI", "SERAMBI", "KORIDOR"] },
      ],
    },
    ring: {
      title: "Mata Rantai",
      pivot: "RANTAI",
      categories: [
        { name: "Bagian sebuah sepeda", words: ["PEDAL", "SADEL", "JERUJI"] },
        { name: "Perhiasan yang dipakai perempuan", words: ["ANTING", "GELANG", "BROS"] },
        { name: "Pengaman pintu pagar", words: ["GEMBOK", "SELOT", "PALANG"] },
        { name: "Runtutan yang saling sambung", words: ["DERET", "URUTAN", "SERI"] },
      ],
    },
    bug: {
      title: "Semua Bundar",
      pivot: "BOLA",
      categories: [
        { name: "Yang dilempar atlet di lapangan", words: ["CAKRAM", "LEMBING", "PELURU"] },
        { name: "Bagian dari mata", words: ["PUPIL", "KELOPAK", "ALIS"] },
        { name: "Mainan anak zaman dulu", words: ["KELERENG", "GASING", "YOYO"] },
        { name: "Alat bantu pelajaran geografi", words: ["PETA", "ATLAS", "KOMPAS"] },
      ],
    },
    bank: {
      title: "Halaman Depan",
      pivot: "HALAMAN",
      categories: [
        { name: "Bagian sebuah buku", words: ["BAB", "SAMPUL", "JILID"] },
        { name: "Yang ada di depan rumah", words: ["TAMAN", "TERAS", "PAGAR"] },
        { name: "Istilah dunia internet", words: ["SITUS", "TAUTAN", "PERAMBAN"] },
        { name: "Isi surat kabar pagi", words: ["TAJUK", "KOLOM", "KARIKATUR"] },
      ],
    },
    stick: {
      title: "Air Pasang",
      pivot: "PASANG",
      categories: [
        { name: "Naik turunnya permukaan laut", words: ["SURUT", "ARUS", "OMBAK"] },
        { name: "Dua yang selalu berdampingan", words: ["JODOH", "KEMBAR", "DUET"] },
        { name: "Membuat alat baru siap dipakai", words: ["RAKIT", "SETEL", "INSTAL"] },
        { name: "Ikut adu untung di meja judi", words: ["TARUHAN", "SABUNG", "LOTRE"] },
      ],
    },
    cap: {
      title: "Kepala Dingin",
      pivot: "KEPALA",
      categories: [
        { name: "Anggota tubuh sebelah atas", words: ["LEHER", "BAHU", "DADA"] },
        { name: "Orang yang memimpin kantor", words: ["KETUA", "MANDOR", "DIREKTUR"] },
        { name: "Bagian surat resmi", words: ["SALAM", "LAMPIRAN", "TEMBUSAN"] },
        { name: "Olahan dari susu sapi", words: ["KEJU", "MENTEGA", "YOGURT"] },
      ],
    },
    bat: {
      title: "Buah Tangan",
      pivot: "BUAH",
      categories: [
        { name: "Isi keranjang di pasar", words: ["MANGGA", "JERUK", "SALAK"] },
        { name: "Bidak di papan catur", words: ["KUDA", "BENTENG", "MENTERI"] },
        { name: "Hasil olah pikir", words: ["GAGASAN", "IDE", "PENDAPAT"] },
        { name: "Oleh-oleh khas daerah", words: ["KERIPIK", "DODOL", "BATIK"] },
      ],
    },
    club: {
      title: "Naik Kelas",
      pivot: "KELAS",
      categories: [
        { name: "Yang ada di ruang belajar", words: ["PAPAN", "BANGKU", "KAPUR"] },
        { name: "Pilihan tiket pesawat", words: ["EKONOMI", "BISNIS", "UTAMA"] },
        { name: "Pembagian berat petinju", words: ["RINGAN", "BULU", "BANTAM"] },
        { name: "Lapisan dalam masyarakat", words: ["KASTA", "GOLONGAN", "STRATA"] },
      ],
    },
    spring: {
      title: "Kunci Sukses",
      pivot: "KUNCI",
      categories: [
        { name: "Isi kotak perkakas", words: ["OBENG", "TANG", "PALU"] },
        { name: "Yang selalu dibawa keluar rumah", words: ["DOMPET", "PONSEL", "JAKET"] },
        { name: "Yang tertulis di partitur", words: ["BIRAMA", "OKTAF", "TEMPO"] },
        { name: "Penentu keberhasilan usaha", words: ["RESEP", "RAHASIA", "MODAL"] },
      ],
    },
    cell: {
      title: "Dari Mulut ke Mulut",
      pivot: "MULUT",
      categories: [
        { name: "Anggota tubuh di wajah", words: ["HIDUNG", "PIPI", "DAGU"] },
        { name: "Bagian sebuah botol kaca", words: ["LEHER", "BADAN", "DASAR"] },
        { name: "Yang ditemui saat menjelajah gua", words: ["STALAKTIT", "LORONG", "KELELAWAR"] },
        { name: "Kabar yang beredar tanpa bukti", words: ["GOSIP", "ISU", "RUMOR"] },
      ],
    },
    chip: {
      title: "Titik Temu",
      pivot: "TITIK",
      categories: [
        { name: "Tanda baca dalam kalimat", words: ["KOMA", "SERU", "KURUNG"] },
        { name: "Air yang jatuh sedikit demi sedikit", words: ["TETES", "EMBUN", "PERCIK"] },
        { name: "Cara menyebut tempat di peta", words: ["LOKASI", "KOORDINAT", "POSISI"] },
        { name: "Motif pada kain", words: ["GARIS", "KOTAK", "BUNGA"] },
      ],
    },
    wave: {
      title: "Satu Gelombang",
      pivot: "GELOMBANG",
      categories: [
        { name: "Yang terlihat di permukaan laut", words: ["BUIH", "RIAK", "PASANG"] },
        { name: "Istilah siaran radio", words: ["FREKUENSI", "ANTENA", "SINYAL"] },
        { name: "Udara siang yang menyiksa", words: ["TERIK", "GERAH", "PENGAP"] },
        { name: "Datang serentak dalam jumlah besar", words: ["LONJAKAN", "BANJIR", "SERBUAN"] },
      ],
    },
    glass: {
      title: "Di Balik Kaca",
      pivot: "KACA",
      categories: [
        { name: "Bagian sebuah jendela", words: ["KUSEN", "TIRAI", "ENGSEL"] },
        { name: "Alat bantu penglihatan", words: ["LENSA", "TEROPONG", "LUP"] },
        { name: "Bahan yang mudah pecah", words: ["KERAMIK", "PORSELEN", "KRISTAL"] },
        { name: "Perlengkapan di dalam mobil", words: ["SETIR", "JOK", "WIPER"] },
      ],
    },
    bark: {
      title: "Sekadar Luaran",
      pivot: "KULIT",
      categories: [
        { name: "Lapisan tubuh manusia", words: ["OTOT", "TULANG", "LEMAK"] },
        { name: "Bahan pembuat tas mahal", words: ["KANVAS", "BELUDRU", "DENIM"] },
        { name: "Bagian buah yang dibuang", words: ["BIJI", "TANGKAI", "GETAH"] },
        { name: "Isi sebuah kabel listrik", words: ["TEMBAGA", "SERAT", "STEKER"] },
      ],
    },
    step: {
      title: "Kaki Lima",
      pivot: "KAKI",
      categories: [
        { name: "Anggota tubuh bagian bawah", words: ["PAHA", "LUTUT", "TUMIT"] },
        { name: "Bagian sebuah gunung", words: ["PUNCAK", "LERENG", "KAWAH"] },
        { name: "Satuan panjang", words: ["METER", "INCI", "HASTA"] },
        { name: "Bagian sebuah kursi", words: ["SANDARAN", "DUDUKAN", "RODA"] },
      ],
    },
    fire: {
      title: "Naik Darah",
      pivot: "PANAS",
      categories: [
        { name: "Yang dirasakan saat demam", words: ["MENGGIGIL", "PUSING", "LEMAS"] },
        { name: "Kabar yang sedang ramai dibicarakan", words: ["VIRAL", "HEBOH", "AKTUAL"] },
        { name: "Perasaan marah yang tertahan", words: ["GERAM", "KESAL", "DONGKOL"] },
        { name: "Cuaca siang di pesisir", words: ["TERIK", "GERAH", "LEMBAP"] },
      ],
    },
    block: {
      title: "Batu Loncatan",
      pivot: "BATU",
      categories: [
        { name: "Yang terinjak di dasar sungai", words: ["LUMPUR", "SIPUT", "GANGGANG"] },
        { name: "Isi cincin pertunangan", words: ["BERLIAN", "ZAMRUD", "MUTIARA"] },
        { name: "Yang terlihat dokter lewat USG", words: ["TUMOR", "KISTA", "POLIP"] },
        { name: "Bahan bangunan yang diangkut truk", words: ["BATA", "SEMEN", "BESI"] },
      ],
    },
    crane: {
      title: "Panjang Leher",
      pivot: "LEHER",
      categories: [
        { name: "Anggota tubuh di bawah kepala", words: ["BAHU", "DADA", "PUNGGUNG"] },
        { name: "Bagian sebuah gitar", words: ["SENAR", "FRET", "BODI"] },
        { name: "Bagian sebuah kemeja", words: ["KANCING", "SAKU", "MANSET"] },
        { name: "Bagian sebuah botol", words: ["TUTUP", "LABEL", "DASAR"] },
      ],
    },
    bolt: {
      title: "Garis Tangan",
      pivot: "GARIS",
      categories: [
        { name: "Bentuk dalam ilmu ukur", words: ["TITIK", "LENGKUNG", "SUDUT"] },
        { name: "Perlengkapan di tepi lapangan bola", words: ["GAWANG", "TIANG", "JARING"] },
        { name: "Asal usul sebuah keluarga", words: ["SILSILAH", "MARGA", "TRAH"] },
        { name: "Yang sudah ditentukan sejak lahir", words: ["NASIB", "TAKDIR", "UNTUNG"] },
      ],
    },
    pen: {
      title: "Panjang Lidah",
      pivot: "LIDAH",
      categories: [
        { name: "Isi rongga mulut", words: ["GIGI", "GUSI", "AMANDEL"] },
        { name: "Bagian sebuah sepatu", words: ["TALI", "SOL", "HAK"] },
        { name: "Tanaman hias berdaun tebal", words: ["KAKTUS", "SUKULEN", "PAKIS"] },
        { name: "Yang muncul dari kobaran api", words: ["ASAP", "BARA", "JELAGA"] },
      ],
    },
    check: {
      title: "Nilai Tukar",
      pivot: "NILAI",
      categories: [
        { name: "Yang tertulis di rapor", words: ["ANGKA", "PERINGKAT", "CATATAN"] },
        { name: "Berapa yang harus dibayar", words: ["HARGA", "ONGKOS", "TARIF"] },
        { name: "Pedoman baik buruk di masyarakat", words: ["NORMA", "ETIKA", "ADAT"] },
        { name: "Istilah pasar uang", words: ["KURS", "INFLASI", "SAHAM"] },
      ],
    },
    track: {
      title: "Keluar Rel",
      pivot: "REL",
      categories: [
        { name: "Bagian jalur kereta api", words: ["BANTALAN", "WESEL", "PALANG"] },
        { name: "Perlengkapan tirai jendela", words: ["GORDEN", "CINCIN", "KAIT"] },
        { name: "Yang membuat laci bisa ditarik", words: ["RODA", "PEGAS", "ENGSEL"] },
        { name: "Menyimpang dari rencana", words: ["MELENCENG", "MELESET", "NGAWUR"] },
      ],
    },
    note: {
      title: "Kabar Baik",
      pivot: "SURAT",
      categories: [
        { name: "Yang diurus di kantor pos", words: ["PAKET", "PERANGKO", "AMPLOP"] },
        { name: "Perlengkapan di bilik pemungutan suara", words: ["PAKU", "TINTA", "KOTAK"] },
        { name: "Dokumen wajib pengendara motor", words: ["SIM", "STNK", "KTP"] },
        { name: "Bacaan pagi di teras", words: ["MAJALAH", "TABLOID", "BULETIN"] },
      ],
    },
    rock: {
      title: "Kepala Batu",
      pivot: "KERAS",
      categories: [
        { name: "Bunyi yang memekakkan telinga", words: ["NYARING", "LANTANG", "BISING"] },
        { name: "Sifat benda yang sulit ditekuk", words: ["PADAT", "KAKU", "KOKOH"] },
        { name: "Minuman beralkohol", words: ["ARAK", "TUAK", "WISKI"] },
        { name: "Sifat orang yang sulit dinasihati", words: ["BANDEL", "NGOTOT", "DEGIL"] },
      ],
    },
    park: {
      title: "Musim Berbunga",
      pivot: "BUNGA",
      categories: [
        { name: "Tanaman hias di dalam pot", words: ["MELATI", "ANGGREK", "KAKTUS"] },
        { name: "Yang dibayar peminjam ke bank", words: ["CICILAN", "DENDA", "POKOK"] },
        { name: "Yang muncul saat besi digerinda", words: ["PIJAR", "ASAP", "SERPIH"] },
        { name: "Yang dialami orang saat tidur", words: ["MIMPI", "IGAUAN", "DENGKUR"] },
      ],
    },
    roll: {
      title: "Cari Jalan",
      pivot: "JALAN",
      categories: [
        { name: "Bagaimana sebuah cerita bergerak", words: ["ALUR", "PLOT", "LAKON"] },
        { name: "Pemecahan sebuah masalah", words: ["SOLUSI", "CARA", "KIAT"] },
        { name: "Keadaan mesin yang bekerja", words: ["HIDUP", "NYALA", "AKTIF"] },
        { name: "Gerak tubuh untuk berpindah tempat", words: ["LARI", "MERANGKAK", "MELOMPAT"] },
      ],
    },
    table: {
      title: "Karang Taruna",
      pivot: "KARANG",
      categories: [
        { name: "Yang ditemui penyelam di laut dangkal", words: ["SPONS", "ANEMON", "TERIPANG"] },
        { name: "Membuat lagu atau cerita baru", words: ["GUBAH", "SUSUN", "TULIS"] },
        { name: "Masalah yang ditangani dokter gigi", words: ["PLAK", "BOLONG", "BENGKAK"] },
        { name: "Perkumpulan pemuda kampung", words: ["PAGUYUBAN", "ARISAN", "RONDA"] },
      ],
    },
    sheet: {
      title: "Lembar Baru",
      pivot: "LEMBAR",
      categories: [
        { name: "Satuan untuk menghitung kertas", words: ["HELAI", "RIM", "KEPING"] },
        { name: "Yang dibagikan pengawas ujian", words: ["SOAL", "PENSIL", "ABSEN"] },
        { name: "Masa baru dalam hidup seseorang", words: ["BABAK", "FASE", "ERA"] },
        { name: "Yang dijual di toko kain", words: ["METERAN", "GULUNGAN", "POTONGAN"] },
      ],
    },
    seal: {
      title: "Satu Suara",
      pivot: "SUARA",
      categories: [
        { name: "Cara manusia mengeluarkan bunyi", words: ["BISIKAN", "TERIAKAN", "DESAHAN"] },
        { name: "Jenis penyanyi dalam paduan nada", words: ["SOPRAN", "ALTO", "TENOR"] },
        { name: "Bunyi yang keluar dari mesin tua", words: ["DERU", "DENGUNG", "DERIT"] },
        { name: "Yang dihitung panitia setelah pemilu", words: ["KURSI", "PEROLEHAN", "SELISIH"] },
      ],
    },
    pipe: {
      title: "Ikut Aliran",
      pivot: "ALIRAN",
      categories: [
        { name: "Gerak air yang terus menerus", words: ["DERAS", "ALUR", "RIAM"] },
        { name: "Yang sampai ke rumah dari gardu", words: ["LISTRIK", "TEGANGAN", "DAYA"] },
        { name: "Ragam musik populer", words: ["DANGDUT", "JAZZ", "ROCK"] },
        { name: "Paham yang dianut sekelompok orang", words: ["MAZHAB", "IDEOLOGI", "SEKTE"] },
      ],
    },
    fry: {
      title: "Asam Garam",
      pivot: "ASAM",
      categories: [
        { name: "Rasa yang dikenali lidah", words: ["MANIS", "PAHIT", "ASIN"] },
        { name: "Istilah pelajaran kimia", words: ["BASA", "ION", "LARUTAN"] },
        { name: "Bumbu dapur untuk sayur", words: ["SEREH", "LENGKUAS", "KEMIRI"] },
        { name: "Penyakit yang menyerang sendi", words: ["REMATIK", "ENCOK", "OSTEOPOROSIS"] },
      ],
    },
    pound: {
      title: "Berat Sebelah",
      pivot: "BERAT",
      categories: [
        { name: "Yang terbaca pada timbangan", words: ["KILO", "GRAM", "TON"] },
        { name: "Ujian hidup yang sulit dilalui", words: ["SUSAH", "PAYAH", "PELIK"] },
        { name: "Enggan mengerjakan sesuatu", words: ["SEGAN", "RAGU", "MALAS"] },
        { name: "Tidak adil kepada salah satu pihak", words: ["BIAS", "CONDONG", "MEMIHAK"] },
      ],
    },
    well: {
      title: "Makin Dalam",
      pivot: "DALAM",
      categories: [
        { name: "Tempat yang jauh ke bawah", words: ["PALUNG", "JURANG", "LUBUK"] },
        { name: "Bukan dari luar negeri", words: ["DOMESTIK", "LOKAL", "NASIONAL"] },
        { name: "Ruang rumah yang tak dilihat tamu", words: ["DAPUR", "GUDANG", "KAMAR"] },
        { name: "Sisi rohani manusia", words: ["BATIN", "JIWA", "SUKMA"] },
      ],
    },
    scale: {
      title: "Naik Tangga",
      pivot: "TANGGA",
      categories: [
        { name: "Yang menghubungkan lantai satu dan dua", words: ["LIFT", "ESKALATOR", "RAMP"] },
        { name: "Istilah dasar dalam musik", words: ["OKTAF", "AKOR", "BIRAMA"] },
        { name: "Peralatan tukang cat", words: ["KUAS", "ROL", "EMBER"] },
        { name: "Urusan sebuah keluarga", words: ["MERTUA", "NAFKAH", "WARISAN"] },
      ],
    },
    spell: {
      title: "Sudah Dasarnya",
      pivot: "DASAR",
      categories: [
        { name: "Bagian paling bawah", words: ["ALAS", "FONDASI", "LANDASAN"] },
        { name: "Pedoman utama sebuah negara", words: ["ASAS", "PRINSIP", "PATOKAN"] },
        { name: "Sifat bawaan seseorang", words: ["WATAK", "TABIAT", "PERANGAI"] },
        { name: "Tingkat pertama sebuah pelajaran", words: ["PEMULA", "AWAL", "POKOK"] },
      ],
    },
    date: {
      title: "Tanggal Muda",
      pivot: "TANGGAL",
      categories: [
        { name: "Satuan pada kalender", words: ["HARI", "PEKAN", "TAHUN"] },
        { name: "Terlepas dari tempatnya", words: ["COPOT", "LEPAS", "RONTOK"] },
        { name: "Yang ditunggu karyawan tiap akhir bulan", words: ["GAJIAN", "BONUS", "THR"] },
        { name: "Yang tercetak pada kartu undangan", words: ["ALAMAT", "DENAH", "BUSANA"] },
      ],
    },
    press: {
      title: "Di Bawah Tekanan",
      pivot: "TEKAN",
      categories: [
        { name: "Yang dilakukan pada tombol lift", words: ["PENCET", "SENTUH", "KETUK"] },
        { name: "Yang diperiksa dokter di lengan", words: ["NADI", "DENYUT", "GULA"] },
        { name: "Membuat pengeluaran jadi lebih kecil", words: ["PANGKAS", "HEMAT", "KURANGI"] },
        { name: "Beban pikiran yang menghimpit", words: ["STRES", "CEMAS", "GELISAH"] },
      ],
    },
    clip: {
      title: "Potongan Harga",
      pivot: "POTONGAN",
      categories: [
        { name: "Gaya rambut baru", words: ["PONI", "CEPAK", "BOB"] },
        { name: "Yang ditawarkan toko saat cuci gudang", words: ["DISKON", "OBRAL", "PROMO"] },
        { name: "Yang mengurangi gaji bulanan", words: ["PAJAK", "IURAN", "PINJAMAN"] },
        { name: "Bentuk tubuh seseorang", words: ["POSTUR", "PERAWAKAN", "BADAN"] },
      ],
    },
    pitch: {
      title: "Boleh Ditawar",
      pivot: "TAWAR",
      categories: [
        { name: "Ikan yang hidup di sungai", words: ["LELE", "NILA", "GURAME"] },
        { name: "Yang dilakukan di pasar sebelum membayar", words: ["PILIH", "BAYAR", "TIMBANG"] },
        { name: "Yang disuntikkan setelah digigit ular", words: ["SERUM", "VAKSIN", "ANTIBISA"] },
        { name: "Yang diajukan perusahaan ke calon karyawan", words: ["GAJI", "JABATAN", "KONTRAK"] },
      ],
    },
    jam: {
      title: "Masuk Akal",
      pivot: "MASUK",
      categories: [
        { name: "Keluhan badan setelah kehujanan", words: ["MERIANG", "MUAL", "PEGAL"] },
        { name: "Alasan yang bisa diterima nalar", words: ["LOGIS", "WAJAR", "RASIONAL"] },
        { name: "Yang diurus calon mahasiswa baru", words: ["PENDAFTARAN", "SELEKSI", "BEASISWA"] },
        { name: "Uang yang diterima perusahaan", words: ["OMZET", "LABA", "SETORAN"] },
      ],
    },
    drop: {
      title: "Jatuh Cinta",
      pivot: "JATUH",
      categories: [
        { name: "Yang terjadi saat kaki hilang keseimbangan", words: ["TERPELESET", "TERSANDUNG", "TERGULING"] },
        { name: "Perasaan orang yang dimabuk asmara", words: ["RINDU", "KASMARAN", "TERGILA"] },
        { name: "Kapan tagihan harus dilunasi", words: ["TENGGAT", "BATAS", "DEADLINE"] },
        { name: "Keadaan harga yang terjun bebas", words: ["ANJLOK", "MEROSOT", "AMBLAS"] },
      ],
    },
    crash: {
      title: "Pecah Kongsi",
      pivot: "PECAH",
      categories: [
        { name: "Nasib gelas yang jatuh ke lantai", words: ["RETAK", "HANCUR", "REMUK"] },
        { name: "Lembaran uang di dalam dompet", words: ["RIBUAN", "RATUSAN", "KOIN"] },
        { name: "Akhir sebuah persekutuan", words: ["BUBAR", "PISAH", "CERAI"] },
        { name: "Cara sebuah perang dimulai", words: ["MELETUS", "BERKOBAR", "MEMBARA"] },
      ],
    },
    palm: {
      title: "Mata Tajam",
      pivot: "TAJAM",
      categories: [
        { name: "Sifat mata pisau yang baru diasah", words: ["LANCIP", "RUNCING", "TIRUS"] },
        { name: "Penglihatan yang teliti", words: ["AWAS", "JELI", "CERMAT"] },
        { name: "Kritik yang menyakitkan hati", words: ["PEDAS", "KERAS", "SINIS"] },
        { name: "Sifat tikungan di jalan pegunungan", words: ["CURAM", "PATAH", "EKSTREM"] },
      ],
    },
    light: {
      title: "Ringan Tangan",
      pivot: "RINGAN",
      categories: [
        { name: "Camilan sore hari", words: ["KERUPUK", "BISKUIT", "KACANG"] },
        { name: "Sifat barang yang mudah dijinjing", words: ["ENTENG", "MUNGIL", "TIPIS"] },
        { name: "Hukuman yang tidak memberatkan", words: ["TEGURAN", "DENDA", "PERINGATAN"] },
        { name: "Bacaan santai di waktu senggang", words: ["KOMIK", "KARTUN", "DONGENG"] },
      ],
    },
    mint: {
      title: "Masih Segar",
      pivot: "SEGAR",
      categories: [
        { name: "Keadaan badan setelah tidur cukup", words: ["BUGAR", "FIT", "PRIMA"] },
        { name: "Sayur yang baru dipetik dari kebun", words: ["RENYAH", "HIJAU", "MULUS"] },
        { name: "Ingatan yang belum pudar", words: ["JELAS", "LEKAT", "UTUH"] },
        { name: "Udara pagi di pegunungan", words: ["SEJUK", "DINGIN", "NYAMAN"] },
      ],
    },
    post: {
      title: "Tiang Utama",
      pivot: "TIANG",
      categories: [
        { name: "Yang menghantar listrik di pinggir jalan", words: ["KABEL", "TRAFO", "ISOLATOR"] },
        { name: "Bagian gawang sepak bola", words: ["MISTAR", "JARING", "SUDUT"] },
        { name: "Yang berdiri di lapangan upacara", words: ["BENDERA", "PENGERAS", "PODIUM"] },
        { name: "Penopang rumah panggung", words: ["PANCANG", "BALOK", "USUK"] },
      ],
    },
    spin: {
      title: "Putaran Kedua",
      pivot: "PUTARAN",
      categories: [
        { name: "Satu bagian dari sebuah turnamen", words: ["BABAK", "TAHAP", "SESI"] },
        { name: "Yang diukur pada mesin mobil", words: ["TORSI", "TENAGA", "KOMPRESI"] },
        { name: "Yang membuat ekonomi terus bergerak", words: ["TRANSAKSI", "INVESTASI", "KONSUMSI"] },
        { name: "Gerakan penari balet di panggung", words: ["LOMPATAN", "AYUNAN", "JINJIT"] },
      ],
    },
    shower: {
      title: "Hujan Pujian",
      pivot: "HUJAN",
      categories: [
        { name: "Yang turun dari langit mendung", words: ["GERIMIS", "SALJU", "EMBUN"] },
        { name: "Yang diterima juara setelah menang", words: ["PUJIAN", "SORAKAN", "UCAPAN"] },
        { name: "Fenomena di langit malam", words: ["METEOR", "GERHANA", "AURORA"] },
        { name: "Yang menerpa prajurit di medan tempur", words: ["PELURU", "PANAH", "BOM"] },
      ],
    },
    deck: {
      title: "Lantai Dansa",
      pivot: "LANTAI",
      categories: [
        { name: "Yang dipasang tukang di ruang tamu", words: ["UBIN", "KERAMIK", "PARKET"] },
        { name: "Susunan gedung dari bawah ke atas", words: ["TINGKAT", "LOTENG", "BASEMEN"] },
        { name: "Nomor pertandingan senam artistik", words: ["PALANG", "KUDA", "GELANG"] },
        { name: "Yang terpampang di gedung bursa", words: ["INDEKS", "BROKER", "PAPAN"] },
      ],
    },
    break: {
      title: "Putus Sambung",
      pivot: "PUTUS",
      categories: [
        { name: "Yang terjadi pada tali yang ditarik kuat", words: ["PATAH", "SOBEK", "RENGGANG"] },
        { name: "Akhir sebuah hubungan asmara", words: ["BERAKHIR", "KANDAS", "BUBAR"] },
        { name: "Yang dilakukan hakim di akhir sidang", words: ["VONIS", "KETUK", "TETAPKAN"] },
        { name: "Nasib sinyal saat hujan deras", words: ["HILANG", "LEMAH", "TERGANGGU"] },
      ],
    },
    nail: {
      title: "Terpaku",
      pivot: "PAKU",
      categories: [
        { name: "Isi laci tukang kayu", words: ["SEKRUP", "BAUT", "ENGSEL"] },
        { name: "Tak bergerak karena terkejut", words: ["DIAM", "KAKU", "BEKU"] },
        { name: "Tumbuhan hijau tanpa bunga", words: ["LUMUT", "SUPLIR", "JAMUR"] },
        { name: "Yang ditancapkan ke tanah", words: ["PATOK", "TONGGAK", "PANCANG"] },
      ],
    },
    brush: {
      title: "Sikat Habis",
      pivot: "SIKAT",
      categories: [
        { name: "Perlengkapan mandi", words: ["SABUN", "SAMPO", "HANDUK"] },
        { name: "Ulah maling di rumah kosong", words: ["GASAK", "EMBAT", "CURI"] },
        { name: "Membersihkan lantai kamar mandi", words: ["GOSOK", "PEL", "SEMPROT"] },
        { name: "Menghabiskan makanan di meja", words: ["LAHAP", "SANTAP", "TANDAS"] },
      ],
    },
    tank: {
      title: "Angkat Tangan",
      pivot: "ANGKAT",
      categories: [
        { name: "Menaikkan barang berat", words: ["JINJING", "USUNG", "JUNJUNG"] },
        { name: "Menempatkan orang di sebuah jabatan", words: ["LANTIK", "TUNJUK", "PILIH"] },
        { name: "Sebutan hubungan anak dan orang tua", words: ["KANDUNG", "TIRI", "ASUH"] },
        { name: "Yang dilakukan saat telepon berdering", words: ["JAWAB", "SAMBUT", "TERIMA"] },
      ],
    },
    vault: {
      title: "Simpan Rahasia",
      pivot: "SIMPAN",
      categories: [
        { name: "Yang dilakukan pada dokumen komputer", words: ["UNGGAH", "SALIN", "HAPUS"] },
        { name: "Yang dilakukan pada uang di bank", words: ["TABUNG", "SETOR", "TRANSFER"] },
        { name: "Membuat rahasia tidak terbongkar", words: ["SEMBUNYIKAN", "PENDAM", "KUBUR"] },
        { name: "Perempuan yang dinikahi diam-diam", words: ["GUNDIK", "SELIR", "PIARAAN"] },
      ],
    },
    figure: {
      title: "Bentuk Badan",
      pivot: "BENTUK",
      categories: [
        { name: "Yang dipelajari di pelajaran geometri", words: ["LINGKARAN", "SEGITIGA", "KUBUS"] },
        { name: "Gambaran fisik seseorang", words: ["POSTUR", "LEKUK", "SILUET"] },
        { name: "Yang dilakukan pelatih pada tim baru", words: ["LATIH", "SUSUN", "GEMBLENG"] },
        { name: "Sistem pemerintahan sebuah negara", words: ["REPUBLIK", "MONARKI", "FEDERASI"] },
      ],
    },
    hook: {
      title: "Tarik Suara",
      pivot: "TARIK",
      categories: [
        { name: "Menggerakkan benda ke arah diri", words: ["SERET", "HELA", "RENGGUT"] },
        { name: "Yang dilakukan nasabah di mesin ATM", words: ["AMBIL", "CEK", "TRANSFER"] },
        { name: "Membuat orang lain terpesona", words: ["PIKAT", "GODA", "MEMUKAU"] },
        { name: "Yang dilakukan biduan di atas panggung", words: ["MENYANYI", "BERSENANDUNG", "MELANTUN"] },
      ],
    },
    plot: {
      title: "Bidang Datar",
      pivot: "BIDANG",
      categories: [
        { name: "Ukuran tanah yang dijual", words: ["KAVLING", "HEKTARE", "PETAK"] },
        { name: "Yang dipelajari mahasiswa di kampus", words: ["JURUSAN", "FAKULTAS", "DISIPLIN"] },
        { name: "Bagian dari sebuah kubus", words: ["SUDUT", "RUSUK", "SISI"] },
        { name: "Pesawat sederhana dalam fisika", words: ["TUAS", "KATROL", "RODA"] },
      ],
    },
    court: {
      title: "Kursi Panas",
      pivot: "KURSI",
      categories: [
        { name: "Perabot di ruang tamu", words: ["MEJA", "SOFA", "RAK"] },
        { name: "Yang direbut partai di parlemen", words: ["MANDAT", "JATAH", "PENGARUH"] },
        { name: "Yang dipakai pasien sulit berjalan", words: ["TONGKAT", "WALKER", "KRUK"] },
        { name: "Isi kabin pesawat terbang", words: ["SABUK", "JENDELA", "BAGASI"] },
      ],
    },
    trip: {
      title: "Pulang Kampung",
      pivot: "PULANG",
      categories: [
        { name: "Yang dilakukan perantau saat lebaran", words: ["MUDIK", "BERKUMPUL", "SILATURAHMI"] },
        { name: "Cara halus menyebut meninggal dunia", words: ["WAFAT", "MANGKAT", "TIADA"] },
        { name: "Keadaan usaha yang tidak untung rugi", words: ["IMPAS", "SEIMBANG", "LUNAS"] },
        { name: "Sudah berada di rumah lagi", words: ["KEMBALI", "TIBA", "SAMPAI"] },
      ],
    },
    turn: {
      title: "Jalan Keluar",
      pivot: "KELUAR",
      categories: [
        { name: "Meninggalkan pekerjaan lama", words: ["PENSIUN", "BERHENTI", "RESIGN"] },
        { name: "Yang dilakukan hasil ujian di papan pengumuman", words: ["TERBIT", "MUNCUL", "TERPAMPANG"] },
        { name: "Uang yang dibelanjakan perusahaan", words: ["BIAYA", "ONGKOS", "BELANJA"] },
        { name: "Meninggalkan ruangan lewat pintu", words: ["PERGI", "MINGGAT", "KABUR"] },
      ],
    },
    lead: {
      title: "Ujung Tombak",
      pivot: "UJUNG",
      categories: [
        { name: "Bagian tangan yang paling luar", words: ["JARI", "KUKU", "TELAPAK"] },
        { name: "Yang paling depan dalam sebuah serangan", words: ["PELOPOR", "GARDA", "TOMBAK"] },
        { name: "Bagian akhir sebuah cerita", words: ["EPILOG", "PENUTUP", "KLIMAKS"] },
        { name: "Daratan yang menjorok ke laut", words: ["TANJUNG", "SEMENANJUNG", "PESISIR"] },
      ],
    },
    stamp: {
      title: "Cap Jempol",
      pivot: "CAP",
      categories: [
        { name: "Yang dibubuhkan agar surat sah", words: ["PARAF", "MATERAI", "SEGEL"] },
        { name: "Yang tercetak di kemasan produk", words: ["MEREK", "LOGO", "BARKODE"] },
        { name: "Yang ditinggalkan jari di kaca", words: ["NODA", "BEKAS", "JEJAK"] },
        { name: "Sebutan buruk yang melekat pada orang", words: ["JULUKAN", "STIGMA", "GELAR"] },
      ],
    },
    panel: {
      title: "Papan Atas",
      pivot: "PAPAN",
      categories: [
        { name: "Potongan kayu di toko bangunan", words: ["BILAH", "TRIPLEKS", "KASO"] },
        { name: "Yang berdiri di pinggir jalan tol untuk iklan", words: ["BALIHO", "SPANDUK", "POSTER"] },
        { name: "Sebutan untuk klub terbaik di liga", words: ["ELITE", "UNGGULAN", "JAWARA"] },
        { name: "Perlengkapan mengajar di depan kelas", words: ["SPIDOL", "PENGHAPUS", "PENGGARIS"] },
      ],
    },
    peak: {
      title: "Masa Puncak",
      pivot: "PUNCAK",
      categories: [
        { name: "Bagian tertinggi sebuah gunung", words: ["KAWAH", "LERENG", "KALDERA"] },
        { name: "Masa terbaik seorang atlet", words: ["JAYA", "EMAS", "PRIMA"] },
        { name: "Bagian paling dinanti dari sebuah pesta", words: ["PEMBUKAAN", "HIBURAN", "SAMBUTAN"] },
        { name: "Saat lalu lintas paling parah", words: ["SIBUK", "PADAT", "RAMAI"] },
      ],
    },
    switch: {
      title: "Tukar Pikiran",
      pivot: "TUKAR",
      categories: [
        { name: "Yang dilakukan anak dengan kartu koleksinya", words: ["BARTER", "PINJAM", "KUMPUL"] },
        { name: "Yang diurus di gerai valuta asing", words: ["KURS", "RUPIAH", "DOLAR"] },
        { name: "Mencari jalan terbaik bersama-sama", words: ["BERUNDING", "BERDEBAT", "BERMUSYAWARAH"] },
        { name: "Yang dilakukan pelatih di menit akhir", words: ["SUBSTITUSI", "ROTASI", "CADANGAN"] },
      ],
    },
    match: {
      title: "Korek Api",
      pivot: "KOREK",
      categories: [
        { name: "Yang dipakai menyalakan tungku", words: ["PEMANTIK", "MANCIS", "GERETAN"] },
        { name: "Menggali keterangan dari saksi", words: ["USUT", "SELIDIK", "PANCING"] },
        { name: "Alat kecil pembersih telinga", words: ["PINSET", "KAPAS", "LIDI"] },
        { name: "Yang dilakukan ayam di halaman", words: ["MEMATUK", "MENGAIS", "MENGGARUK"] },
      ],
    },
    sink: {
      title: "Matahari Tenggelam",
      pivot: "TENGGELAM",
      categories: [
        { name: "Nasib kapal yang bocor lambungnya", words: ["KARAM", "TERBALIK", "KANDAS"] },
        { name: "Yang dilakukan matahari di ufuk barat", words: ["TERBENAM", "TURUN", "MEREDUP"] },
        { name: "Terlalu fokus sampai lupa waktu", words: ["ASYIK", "KHUSYUK", "LARUT"] },
        { name: "Nasib nama besar yang dilupakan orang", words: ["PUDAR", "LENYAP", "TERKUBUR"] },
      ],
    },
    plug: {
      title: "Dorongan Hati",
      pivot: "DORONG",
      categories: [
        { name: "Menggerakkan benda ke depan", words: ["TOLAK", "SORONG", "DESAK"] },
        { name: "Yang membuat orang mau berusaha", words: ["MOTIVASI", "SEMANGAT", "AMBISI"] },
        { name: "Gaya dalam pelajaran fisika", words: ["TEKANAN", "GESEKAN", "GRAVITASI"] },
        { name: "Yang diberikan pemerintah pada usaha kecil", words: ["SUBSIDI", "INSENTIF", "PELATIHAN"] },
      ],
    },
    snap: {
      title: "Buka Puasa",
      pivot: "BUKA",
      categories: [
        { name: "Yang dinanti saat azan magrib", words: ["TAKJIL", "KURMA", "KOLAK"] },
        { name: "Memulai usaha baru di ruko", words: ["MERINTIS", "MENDIRIKAN", "MELUNCURKAN"] },
        { name: "Membeberkan hal yang disembunyikan", words: ["UNGKAP", "BONGKAR", "BEBERKAN"] },
        { name: "Bagian awal sebuah pertunjukan", words: ["PROLOG", "SAMBUTAN", "PEMANASAN"] },
      ],
    },
    slate: {
      title: "Muka Tebal",
      pivot: "TEBAL",
      categories: [
        { name: "Sifat kabut di pagi hari", words: ["PEKAT", "RAPAT", "LEBAT"] },
        { name: "Sifat orang yang tak tahu malu", words: ["BADAK", "NEKAT", "CUEK"] },
        { name: "Ukuran sebuah buku catatan", words: ["LEBAR", "PANJANG", "BESAR"] },
        { name: "Keadaan dompet orang kaya", words: ["PENUH", "MENGGEMBUNG", "BUNCIT"] },
      ],
    },
    grain: {
      title: "Butir Demi Butir",
      pivot: "BUTIR",
      categories: [
        { name: "Yang ditumbuk menjadi tepung", words: ["BERAS", "GANDUM", "JAGUNG"] },
        { name: "Satuan untuk menghitung telur", words: ["LUSIN", "KILO", "PETI"] },
        { name: "Bagian dari sebuah peraturan", words: ["PASAL", "AYAT", "BAB"] },
        { name: "Sesuatu yang sangat kecil", words: ["ZARAH", "PARTIKEL", "SERPIH"] },
      ],
    },
    prime: {
      title: "Pokok Persoalan",
      pivot: "POKOK",
      categories: [
        { name: "Bagian terpenting sebuah tulisan", words: ["INTI", "SARI", "TEMA"] },
        { name: "Yang dibayar selain bunga pinjaman", words: ["ANGSURAN", "CICILAN", "TENOR"] },
        { name: "Batang besar sebuah pohon", words: ["TUNGGUL", "AKAR", "DAHAN"] },
        { name: "Kebutuhan yang harus ada di dapur", words: ["MINYAK", "GARAM", "GULA"] },
      ],
    },
    swing: {
      title: "Goyang Dangdut",
      pivot: "GOYANG",
      categories: [
        { name: "Gerakan penyanyi dangdut di panggung", words: ["LENGGOK", "GELIAT", "HENTAK"] },
        { name: "Keadaan meja yang tidak rata kakinya", words: ["OLENG", "MIRING", "DOYONG"] },
        { name: "Keadaan jabatan yang terancam", words: ["RAWAN", "GENTING", "RAPUH"] },
        { name: "Yang dilakukan gempa pada bangunan", words: ["MENGGUNCANG", "MERETAKKAN", "MEROBOHKAN"] },
      ],
    },
    shift: {
      title: "Geser Sedikit",
      pivot: "GESER",
      categories: [
        { name: "Memindahkan meja sedikit ke kiri", words: ["SORONG", "INGSUT", "SENGGOL"] },
        { name: "Perubahan pelan pada kebiasaan masyarakat", words: ["TRANSISI", "EVOLUSI", "PEMBAHARUAN"] },
        { name: "Yang dialami pejabat yang dicopot", words: ["MUTASI", "DEMOSI", "ROTASI"] },
        { name: "Yang dilakukan panitia pada jadwal acara", words: ["UNDUR", "MAJUKAN", "TUNDA"] },
      ],
    },
    strain: {
      title: "Urat Tegang",
      pivot: "TEGANG",
      categories: [
        { name: "Keadaan tali yang ditarik dua orang", words: ["KENCANG", "KAKU", "LURUS"] },
        { name: "Suasana ruang tunggu operasi", words: ["MENCEKAM", "SUNYI", "CEMAS"] },
        { name: "Hubungan dua negara yang berselisih", words: ["RENGGANG", "DINGIN", "MEMANAS"] },
        { name: "Yang terasa pada otot setelah olahraga berat", words: ["KRAM", "PEGAL", "NYERI"] },
      ],
    },
    string: {
      title: "Benang Merah",
      pivot: "BENANG",
      categories: [
        { name: "Isi kotak jahit ibu", words: ["JARUM", "BIDAL", "KANCING"] },
        { name: "Kaitan tersembunyi antar peristiwa", words: ["POLA", "HUBUNGAN", "KESAMAAN"] },
        { name: "Yang dipakai menerbangkan layangan", words: ["GELASAN", "KUMPARAN", "ANGIN"] },
        { name: "Yang tersusun menjadi sehelai kain", words: ["TENUNAN", "ANYAMAN", "RAJUTAN"] },
      ],
    },
    shock: {
      title: "Getaran Hati",
      pivot: "GETAR",
      categories: [
        { name: "Yang dirasakan warga saat gempa", words: ["GONCANGAN", "RETAKAN", "LONGSOR"] },
        { name: "Mode ponsel saat rapat", words: ["SENYAP", "HENING", "DIAM"] },
        { name: "Perasaan pertama saat jatuh cinta", words: ["DEBARAN", "DESIR", "GELORA"] },
        { name: "Yang keluar dari senar gitar dipetik", words: ["BUNYI", "NADA", "DENTING"] },
      ],
    },
    forge: {
      title: "Cetak Biru",
      pivot: "CETAK",
      categories: [
        { name: "Yang dilakukan percetakan pada naskah", words: ["TERBIT", "JILID", "SABLON"] },
        { name: "Cara pemain menambah angka", words: ["SUNDUL", "TEMBAK", "SODOK"] },
        { name: "Rencana rinci sebuah proyek", words: ["DENAH", "SKEMA", "RANCANGAN"] },
        { name: "Yang dilakukan sekolah pada muridnya", words: ["DIDIK", "LATIH", "BINA"] },
      ],
    },
    channel: {
      title: "Ganti Saluran",
      pivot: "SALURAN",
      categories: [
        { name: "Yang dibersihkan warga saat kerja bakti", words: ["GOT", "PARIT", "SELOKAN"] },
        { name: "Yang dipindah dengan remote", words: ["SIARAN", "PROGRAM", "FREKUENSI"] },
        { name: "Bagian sistem pencernaan", words: ["LAMBUNG", "USUS", "KERONGKONGAN"] },
        { name: "Jalur barang dari pabrik ke toko", words: ["DISTRIBUTOR", "AGEN", "GROSIR"] },
      ],
    },
    steam: {
      title: "Menguap Habis",
      pivot: "UAP",
      categories: [
        { name: "Yang keluar dari cerek mendidih", words: ["ASAP", "EMBUN", "KABUT"] },
        { name: "Reaksi tubuh saat kurang tidur", words: ["MENGANTUK", "MENGUCEK", "MEREGANG"] },
        { name: "Nasib genangan air di panas terik", words: ["MENYUSUT", "MENGERING", "HILANG"] },
        { name: "Perawatan wajah di salon", words: ["MASKER", "LULUR", "SCRUB"] },
      ],
    },
    rail: {
      title: "Tanggung Jawab",
      pivot: "TANGGUNG",
      categories: [
        { name: "Memikul beban tugas", words: ["PIKUL", "EMBAN", "GALAS"] },
        { name: "Ukuran yang tidak besar tidak kecil", words: ["SEDANG", "SETENGAH", "KEPALANG"] },
        { name: "Yang dibiayai kepala keluarga", words: ["ISTRI", "ANAK", "ADIK"] },
        { name: "Yang diberikan toko pada barang elektronik", words: ["GARANSI", "NOTA", "BONUS"] },
      ],
    },
    stall: {
      title: "Kredit Macet",
      pivot: "MACET",
      categories: [
        { name: "Keadaan jalan raya pada jam pulang", words: ["PADAT", "MERAYAP", "MENGULAR"] },
        { name: "Keadaan mesin yang tak mau hidup", words: ["MOGOK", "NGADAT", "MATI"] },
        { name: "Utang nasabah yang tak kunjung dibayar", words: ["TUNGGAKAN", "DENDA", "SITAAN"] },
        { name: "Perundingan yang tidak maju", words: ["BUNTU", "ALOT", "BERLARUT"] },
      ],
    },
    grade: {
      title: "Naik Tingkat",
      pivot: "TINGKAT",
      categories: [
        { name: "Bagian gedung dihitung dari bawah", words: ["LOTENG", "MEZANIN", "BASEMEN"] },
        { name: "Jenjang pendidikan anak", words: ["SD", "SMP", "SMA"] },
        { name: "Kadar rumitnya sebuah permainan", words: ["MUDAH", "SULIT", "EKSTREM"] },
        { name: "Angka yang diumumkan badan statistik", words: ["INFLASI", "PENGANGGURAN", "KEMISKINAN"] },
      ],
    },
    fan: {
      title: "Angin Panas",
      pivot: "KIPAS",
      categories: [
        { name: "Alat penyejuk ruangan", words: ["AC", "BLOWER", "EXHAUST"] },
        { name: "Yang dibawa penari di panggung", words: ["SELENDANG", "SANGGUL", "GELUNG"] },
        { name: "Membuat pertengkaran makin panas", words: ["HASUT", "PROVOKASI", "SULUT"] },
        { name: "Isi kotak komputer", words: ["HARDISK", "PROSESOR", "MOTHERBOARD"] },
      ],
    },
    drive: {
      title: "Tenaga Dalam",
      pivot: "TENAGA",
      categories: [
        { name: "Sumber pembangkit listrik", words: ["SURYA", "ANGIN", "NUKLIR"] },
        { name: "Sebutan untuk orang yang bekerja di pabrik", words: ["BURUH", "KARYAWAN", "PEGAWAI"] },
        { name: "Yang dilatih pesilat lewat meditasi", words: ["NAPAS", "BATIN", "JURUS"] },
        { name: "Yang menipis setelah lari jauh", words: ["STAMINA", "OKSIGEN", "CADANGAN"] },
      ],
    },
    charm: {
      title: "Kata Manis",
      pivot: "MANIS",
      categories: [
        { name: "Rasa pada makanan", words: ["ASIN", "PAHIT", "GURIH"] },
        { name: "Wajah yang enak dipandang", words: ["CANTIK", "AYU", "ELOK"] },
        { name: "Janji yang enak didengar", words: ["MEMIKAT", "MENGGIURKAN", "MERDU"] },
        { name: "Akhir cerita yang melegakan", words: ["BAHAGIA", "HARU", "MENGESANKAN"] },
      ],
    },
    sole: {
      title: "Alas Kaki",
      pivot: "ALAS",
      categories: [
        { name: "Yang dipakai di kaki", words: ["SANDAL", "SELOP", "BAKIAK"] },
        { name: "Yang dibentangkan di meja makan", words: ["TAPLAK", "SERBET", "TATAKAN"] },
        { name: "Yang digelar sebelum tidur di lantai", words: ["TIKAR", "KASUR", "MATRAS"] },
        { name: "Yang dipakai pengacara untuk menuntut", words: ["BUKTI", "PASAL", "DALIL"] },
      ],
    },
    spot: {
      title: "Main Mata",
      pivot: "MAIN",
      categories: [
        { name: "Yang dilakukan anak di halaman", words: ["LARI", "LOMPAT", "KEJAR"] },
        { name: "Yang dilakukan aktor di depan kamera", words: ["AKTING", "BERPERAN", "BERLAKON"] },
        { name: "Yang dilakukan pemusik di panggung", words: ["MEMETIK", "MENIUP", "MENABUH"] },
        { name: "Isyarat genit antara dua orang", words: ["KEDIPAN", "LIRIKAN", "SENYUMAN"] },
      ],
    },
    cross: {
      title: "Silang Pendapat",
      pivot: "SILANG",
      categories: [
        { name: "Tanda yang dibubuhkan di lembar jawaban", words: ["CENTANG", "LINGKARAN", "CORETAN"] },
        { name: "Hasil perkawinan dua jenis hewan", words: ["BLASTERAN", "HIBRIDA", "PERANAKAN"] },
        { name: "Perbedaan pendapat dalam rapat", words: ["DEBAT", "SELISIH", "SENGKETA"] },
        { name: "Cara mengoper bola ke kawan", words: ["UMPAN", "SODORAN", "LAMBUNG"] },
      ],
    },
    run: {
      title: "Lari Pagi",
      pivot: "LARI",
      categories: [
        { name: "Nomor di lintasan atletik", words: ["SPRINT", "MARATON", "ESTAFET"] },
        { name: "Yang dilakukan buronan agar tak tertangkap", words: ["MENGHILANG", "BERSEMBUNYI", "MENYAMAR"] },
        { name: "Tidak mau berhadapan dengan masalah", words: ["MENGELAK", "MENGHINDAR", "BERKILAH"] },
        { name: "Ke mana perginya uang perusahaan", words: ["MENGALIR", "BOCOR", "TERSEDOT"] },
      ],
    },
    tender: {
      title: "Hati Lembut",
      pivot: "LEMBUT",
      categories: [
        { name: "Sifat kain sutra", words: ["HALUS", "LICIN", "RINGAN"] },
        { name: "Sifat orang yang penuh kasih", words: ["PENYABAR", "RAMAH", "PENYAYANG"] },
        { name: "Sifat daging yang mudah dikunyah", words: ["EMPUK", "LUNAK", "LUMER"] },
        { name: "Suara ibu saat menidurkan anak", words: ["PELAN", "MERDU", "SYAHDU"] },
      ],
    },
    present: {
      title: "Uang Muka",
      pivot: "MUKA",
      categories: [
        { name: "Yang dibayar lebih dulu saat membeli rumah", words: ["PANJAR", "DEPOSIT", "JAMINAN"] },
        { name: "Posisi paling dekat dengan loket", words: ["DEPAN", "AWAL", "PERTAMA"] },
        { name: "Permukaan bumi tempat kita berpijak", words: ["TANAH", "KERAK", "DARATAN"] },
        { name: "Menolak menatap orang yang dibenci", words: ["MEMBUANG", "MEMALINGKAN", "MENUNDUK"] },
      ],
    },
    temper: {
      title: "Darah Biru",
      pivot: "DARAH",
      categories: [
        { name: "Yang mengalir di dalam pembuluh", words: ["PLASMA", "TROMBOSIT", "LIMFA"] },
        { name: "Sebutan untuk anak raja dan kerabatnya", words: ["NINGRAT", "PRIYAYI", "BANGSAWAN"] },
        { name: "Keadaan orang yang sedang marah", words: ["MENDIDIH", "MEMUNCAK", "MEMERAH"] },
        { name: "Pertalian antara orang tua dan anak", words: ["KETURUNAN", "GARIS", "NASAB"] },
      ],
    },
    mold: {
      title: "Pola Pikir",
      pivot: "POLA",
      categories: [
        { name: "Yang digambar penjahit sebelum menggunting kain", words: ["UKURAN", "MODEL", "SKETSA"] },
        { name: "Cara seseorang memandang masalah", words: ["PERSPEKTIF", "LOGIKA", "NALAR"] },
        { name: "Yang diatur dokter untuk pasien diabetes", words: ["MENU", "PORSI", "JADWAL"] },
        { name: "Corak pada kain batik", words: ["MOTIF", "RAGAM", "ORNAMEN"] },
      ],
    },
    score: {
      title: "Nada Tinggi",
      pivot: "NADA",
      categories: [
        { name: "Istilah dalam not balok", words: ["KRES", "MOL", "BIRAMA"] },
        { name: "Cara seseorang menyampaikan ucapan", words: ["INTONASI", "LOGAT", "TEKANAN"] },
        { name: "Yang berbunyi saat ponsel dipanggil", words: ["DERING", "GETAR", "ALARM"] },
        { name: "Sikap dalam pernyataan politikus", words: ["KERAS", "LUNAK", "SINIS"] },
      ],
    },
    floor: {
      title: "Rata dengan Tanah",
      pivot: "RATA",
      categories: [
        { name: "Sifat permukaan jalan tol yang bagus", words: ["DATAR", "MULUS", "LICIN"] },
        { name: "Nilai tengah sekumpulan angka", words: ["MEDIAN", "MODUS", "MEAN"] },
        { name: "Cara membagi warisan tanpa pilih kasih", words: ["SAMA", "ADIL", "SEIMBANG"] },
        { name: "Nasib kota setelah dibom", words: ["HANCUR", "MUSNAH", "LENYAP"] },
      ],
    },
    draw: {
      title: "Hasil Seri",
      pivot: "SERI",
      categories: [
        { name: "Hasil pertandingan tanpa pemenang", words: ["IMBANG", "REMIS", "DRAW"] },
        { name: "Kumpulan film bersambung", words: ["SEKUEL", "TRILOGI", "EPISODE"] },
        { name: "Wajah orang yang sedang bahagia", words: ["CERAH", "BERBINAR", "SUMRINGAH"] },
        { name: "Yang tertera di bodi mesin cuci", words: ["MEREK", "TIPE", "NOMOR"] },
      ],
    },
    volume: {
      title: "Isi Kepala",
      pivot: "ISI",
      categories: [
        { name: "Yang dilakukan di pom bensin", words: ["TAMBAH", "TUANG", "ANTRE"] },
        { name: "Yang ada di dalam perut sapi", words: ["BABAT", "USUS", "HATI"] },
        { name: "Yang ditulis pada formulir pendaftaran", words: ["NAMA", "ALAMAT", "TANGGAL"] },
        { name: "Yang terkandung dalam sebuah pidato", words: ["PESAN", "MAKNA", "AMANAT"] },
      ],
    },
    mark: {
      title: "Tanda Mata",
      pivot: "TANDA",
      categories: [
        { name: "Gejala yang mendahului hujan", words: ["MENDUNG", "GERAH", "ANGIN"] },
        { name: "Yang dibubuhkan di akhir surat", words: ["PARAF", "STEMPEL", "SALAM"] },
        { name: "Lambang di pundak tentara", words: ["BINTANG", "LENCANA", "EMBLEM"] },
        { name: "Yang dipakai dalam kalimat tertulis", words: ["KOMA", "TITIK", "KURUNG"] },
      ],
    },
  },
  emoji: {
    title: "Hitung Bijinya",
    pivot: "BIJI",
    categories: [
      { name: "Bidak di papan catur", words: ["GAJAH", "KUDA", "BENTENG"] },
      { name: "Kata untuk menghitung benda", words: ["BUAH", "KEPING", "BUTIR"] },
      { name: "Bagian dari sebuah mata", words: ["KELOPAK", "BOLA", "BULU"] },
      { name: "Yang digiling menjadi bubuk", words: ["KOPI", "GANDUM", "JAGUNG"] },
    ],
    emoji: {
      GAJAH: "\u{1F418}",
      KUDA: "\u{1F40E}",
      BENTENG: "\u{1F3F0}",
      BUAH: "\u{1F34E}",
      KEPING: "\u{1FA99}",
      BUTIR: "\u{1F95A}",
      KELOPAK: "\u{1F338}",
      BOLA: "\u{26BD}",
      BULU: "\u{1FAB6}",
      KOPI: "\u{2615}",
      GANDUM: "\u{1F33E}",
      JAGUNG: "\u{1F33D}",
    },
  },
  daily: {
    key: {
      title: "Akar Masalah",
      pivot: "AKAR",
      categories: [
        { name: "Bagian tumbuhan di dalam tanah", words: ["UMBI", "SERABUT", "RIMPANG"] },
        { name: "Sumber sebuah persoalan", words: ["BIANG", "SEBAB", "PANGKAL"] },
        { name: "Operasi dalam hitungan matematika", words: ["PANGKAT", "KALI", "KURANG"] },
        { name: "Bagian pembentuk sebuah kata", words: ["IMBUHAN", "AWALAN", "SISIPAN"] },
      ],
    },
    board: {
      title: "Cabang Olahraga",
      pivot: "CABANG",
      categories: [
        { name: "Bagian pohon yang menjulur", words: ["RANTING", "DAHAN", "PUCUK"] },
        { name: "Milik perusahaan di kota lain", words: ["KANTOR", "GERAI", "PERWAKILAN"] },
        { name: "Pembagian dalam pesta olahraga", words: ["NOMOR", "KELAS", "KATEGORI"] },
        { name: "Pembagian karya seni", words: ["LUKIS", "TARI", "MUSIK"] },
      ],
    },
    crown: {
      title: "Mahkota Raja",
      pivot: "MAHKOTA",
      categories: [
        { name: "Perlengkapan seorang raja", words: ["TAKHTA", "TONGKAT", "JUBAH"] },
        { name: "Yang dipasang dokter gigi", words: ["BEHEL", "TAMBALAN", "VENEER"] },
        { name: "Bagian sebuah bunga", words: ["KELOPAK", "PUTIK", "TANGKAI"] },
        { name: "Yang dirawat perempuan di salon", words: ["RAMBUT", "KUKU", "KULIT"] },
      ],
    },
    train: {
      title: "Rangkaian Acara",
      pivot: "RANGKAIAN",
      categories: [
        { name: "Yang membentuk satu kereta panjang", words: ["GERBONG", "SAMBUNGAN", "LOKOMOTIF"] },
        { name: "Yang disusun tukang listrik di papan", words: ["KABEL", "SAKELAR", "RESISTOR"] },
        { name: "Susunan acara pada undangan", words: ["SAMBUTAN", "HIBURAN", "PENUTUP"] },
        { name: "Yang dibuat penjual bunga untuk pengantin", words: ["BUKET", "KARANGAN", "VAS"] },
      ],
    },
    watch: {
      title: "Jaga Malam",
      pivot: "JAGA",
      categories: [
        { name: "Tugas bergiliran di pos kampung", words: ["RONDA", "PIKET", "SISKAMLING"] },
        { name: "Merawat agar tetap sehat", words: ["RAWAT", "PELIHARA", "LINDUNGI"] },
        { name: "Keadaan mata di tengah malam", words: ["MELEK", "BANGUN", "SADAR"] },
        { name: "Yang dilakukan kiper di depan gawang", words: ["HADANG", "TEPIS", "TANGKAP"] },
      ],
    },
    band: {
      title: "Pita Suara",
      pivot: "PITA",
      categories: [
        { name: "Hiasan di rambut anak perempuan", words: ["JEPIT", "BANDO", "KARET"] },
        { name: "Yang terputar di dalam kaset lama", words: ["SPUL", "GULUNGAN", "MAGNET"] },
        { name: "Bagian dalam leher penghasil bunyi", words: ["TENGGOROK", "LARING", "AMANDEL"] },
        { name: "Alat untuk mengukur panjang", words: ["METERAN", "PENGGARIS", "JANGKA"] },
      ],
    },
    beam: {
      title: "Batang Hidung",
      pivot: "BATANG",
      categories: [
        { name: "Kata untuk menghitung rokok", words: ["BUNGKUS", "SLOP", "PAK"] },
        { name: "Bagian dari sebuah hidung", words: ["CUPING", "LUBANG", "TULANG"] },
        { name: "Bahan bangunan berbentuk panjang", words: ["BESI", "BAMBU", "PIPA"] },
        { name: "Bagian utama sebuah tubuh", words: ["TORSO", "PINGGANG", "DADA"] },
      ],
    },
    box: {
      title: "Kotak Suara",
      pivot: "KOTAK",
      categories: [
        { name: "Motif pada kain flanel", words: ["GARIS", "POLKADOT", "BUNGA"] },
        { name: "Yang dijaga panitia saat pemilu", words: ["BILIK", "TINTA", "FORMULIR"] },
        { name: "Bangun datar dalam ilmu ukur", words: ["SEGITIGA", "LINGKARAN", "JAJARGENJANG"] },
        { name: "Yang disiapkan untuk keadaan darurat", words: ["ALARM", "PEMADAM", "SELANG"] },
      ],
    },
    cast: {
      title: "Tuang Gagasan",
      pivot: "TUANG",
      categories: [
        { name: "Yang dilakukan pada teh di dalam cangkir", words: ["SEDUH", "SARING", "ADUK"] },
        { name: "Yang dilakukan pandai besi pada logam cair", words: ["LEBUR", "TEMPA", "CETAK"] },
        { name: "Menyalurkan isi pikiran ke dalam tulisan", words: ["CURAHKAN", "UNGKAPKAN", "RANGKAI"] },
        { name: "Yang dilakukan pada adonan kue di loyang", words: ["RATAKAN", "OLES", "TABUR"] },
      ],
    },
    charge: {
      title: "Beban Pikiran",
      pivot: "BEBAN",
      categories: [
        { name: "Yang diangkut truk barang", words: ["MUATAN", "KARGO", "PETI"] },
        { name: "Yang menghimpit pikiran", words: ["MASALAH", "TANGGUNGAN", "TEKANAN"] },
        { name: "Yang harus dibayar pelanggan listrik", words: ["TAGIHAN", "TARIF", "PAJAK"] },
        { name: "Yang dipikul atlet angkat besi", words: ["BARBEL", "PIRINGAN", "DUMBEL"] },
      ],
    },
    coach: {
      title: "Bangku Cadangan",
      pivot: "BANGKU",
      categories: [
        { name: "Masa menempuh pendidikan", words: ["SEKOLAH", "KULIAH", "PESANTREN"] },
        { name: "Perabot di taman kota", words: ["AYUNAN", "LAMPU", "TONG"] },
        { name: "Tempat pemain yang belum diturunkan", words: ["CADANGAN", "PENGGANTI", "SIMPANAN"] },
        { name: "Yang ada di dalam ruang sidang", words: ["MIMBAR", "PALU", "JUBAH"] },
      ],
    },
    coat: {
      title: "Kue Lapis",
      pivot: "LAPIS",
      categories: [
        { name: "Yang dikuaskan tukang ke tembok", words: ["CAT", "PLAMIR", "PERNIS"] },
        { name: "Kue basah di toko oleh-oleh", words: ["BOLU", "PUTU", "NAGASARI"] },
        { name: "Tingkatan dalam masyarakat", words: ["GOLONGAN", "KASTA", "STRATA"] },
        { name: "Yang menutupi kendaraan tempur", words: ["BAJA", "PELAT", "PERISAI"] },
      ],
    },
    count: {
      title: "Hitung Mundur",
      pivot: "HITUNG",
      categories: [
        { name: "Yang dilakukan kasir di akhir hari", words: ["REKAP", "TOTAL", "CEK"] },
        { name: "Yang terdengar sebelum roket meluncur", words: ["MUNDUR", "DETIK", "ANGKA"] },
        { name: "Pelajaran dasar di sekolah", words: ["MEMBACA", "MENULIS", "MENGGAMBAR"] },
        { name: "Yang dilakukan sebelum mengambil keputusan", words: ["TIMBANG", "UKUR", "KAJI"] },
      ],
    },
    draft: {
      title: "Kabar Angin",
      pivot: "ANGIN",
      categories: [
        { name: "Yang berembus di pantai sore hari", words: ["SEPOI", "BAYU", "BADAI"] },
        { name: "Keluhan badan setelah kehujanan", words: ["MERIANG", "MUAL", "KEROKAN"] },
        { name: "Kabar yang belum tentu benar", words: ["ISU", "GOSIP", "DESAS"] },
        { name: "Sifat orang yang gampang berubah pikiran", words: ["PLINPLAN", "LABIL", "RAGU"] },
      ],
    },
    drill: {
      title: "Jalan Tembus",
      pivot: "TEMBUS",
      categories: [
        { name: "Yang dilakukan peluru pada papan kayu", words: ["LUBANGI", "JEBOL", "ROBEK"] },
        { name: "Rute singkat antar kampung", words: ["PINTAS", "POTONG", "GANG"] },
        { name: "Berhasil melewati seleksi", words: ["LOLOS", "DITERIMA", "LULUS"] },
        { name: "Sifat kain yang bisa dilihat isinya", words: ["TIPIS", "BENING", "TERAWANG"] },
      ],
    },
    duck: {
      title: "Rendah Hati",
      pivot: "RENDAH",
      categories: [
        { name: "Letak tanah yang mudah banjir", words: ["CEKUNG", "DATAR", "LEMBAH"] },
        { name: "Sifat orang yang tidak sombong", words: ["SEDERHANA", "BERSAHAJA", "SANTUN"] },
        { name: "Harga yang meringankan pembeli", words: ["MURAH", "MIRING", "TERJANGKAU"] },
        { name: "Suara berat seorang penyanyi", words: ["BAS", "BARITON", "DASAR"] },
      ],
    },
    fair: {
      title: "Pasar Malam",
      pivot: "PASAR",
      categories: [
        { name: "Tempat berbelanja sayur pagi hari", words: ["WARUNG", "KIOS", "LAPAK"] },
        { name: "Tempat saham diperjualbelikan", words: ["BURSA", "INDEKS", "EMITEN"] },
        { name: "Hiburan keliling dengan bianglala", words: ["KOMEDI", "ODONG", "TONG"] },
        { name: "Sasaran penjualan sebuah produk", words: ["KONSUMEN", "SEGMEN", "PEMBELI"] },
      ],
    },
    fall: {
      title: "Daun Gugur",
      pivot: "GUGUR",
      categories: [
        { name: "Yang dilakukan daun di musim kemarau", words: ["RONTOK", "LURUH", "MELUNCUR"] },
        { name: "Nasib prajurit di medan perang", words: ["TEWAS", "SYAHID", "WAFAT"] },
        { name: "Nasib peserta di babak penyisihan", words: ["TERSINGKIR", "TERELIMINASI", "KALAH"] },
        { name: "Nasib janji yang tidak jadi ditepati", words: ["BATAL", "HANGUS", "LUNTUR"] },
      ],
    },
    file: {
      title: "Berkas Cahaya",
      pivot: "BERKAS",
      categories: [
        { name: "Yang dibawa pelamar kerja ke wawancara", words: ["IJAZAH", "LAMARAN", "SERTIFIKAT"] },
        { name: "Yang menembus celah jendela pagi hari", words: ["CAHAYA", "SINAR", "SOROT"] },
        { name: "Yang disimpan di dalam folder komputer", words: ["DOKUMEN", "GAMBAR", "VIDEO"] },
        { name: "Yang diserahkan ke pengadilan sebelum sidang", words: ["DAKWAAN", "BUKTI", "GUGATAN"] },
      ],
    },
    flat: {
      title: "Bangun Datar",
      pivot: "DATAR",
      categories: [
        { name: "Bentuk dua dimensi dalam ilmu ukur", words: ["PERSEGI", "TRAPESIUM", "LINGKARAN"] },
        { name: "Nada bicara tanpa perasaan", words: ["MONOTON", "DINGIN", "KAKU"] },
        { name: "Bentang alam tanpa bukit", words: ["PADANG", "SABANA", "STEPA"] },
        { name: "Grafik penjualan yang tidak naik turun", words: ["STAGNAN", "TETAP", "MANDEK"] },
      ],
    },
    fly: {
      title: "Uang Terbang",
      pivot: "TERBANG",
      categories: [
        { name: "Yang dilakukan burung di udara", words: ["MELAYANG", "MENGEPAK", "MELUNCUR"] },
        { name: "Hilang tanpa meninggalkan jejak", words: ["RAIB", "LENYAP", "MENGUAP"] },
        { name: "Pembagian berat dalam tinju", words: ["BULU", "BANTAM", "RINGAN"] },
        { name: "Yang dilakukan pikiran saat melamun", words: ["MENGEMBARA", "MENERAWANG", "MELANTUR"] },
      ],
    },
    fold: {
      title: "Lipat Ganda",
      pivot: "LIPAT",
      categories: [
        { name: "Yang dilakukan ibu pada baju kering", words: ["SETRIKA", "SUSUN", "GANTUNG"] },
        { name: "Memperbanyak jumlah menjadi dua atau tiga", words: ["GANDA", "KALI", "TAMBAH"] },
        { name: "Jejak yang tertinggal di kertas origami", words: ["GARIS", "TEKUKAN", "SUDUT"] },
        { name: "Bentukan pada kerak bumi", words: ["PATAHAN", "SESAR", "PALUNG"] },
      ],
    },
    frame: {
      title: "Bingkai Berita",
      pivot: "BINGKAI",
      categories: [
        { name: "Yang menempel di dinding ruang tamu", words: ["FOTO", "LUKISAN", "JAM"] },
        { name: "Bagian dari sepasang kacamata", words: ["LENSA", "GAGANG", "ENGSEL"] },
        { name: "Cara media menyudutkan sebuah berita", words: ["SUDUT", "NARASI", "OPINI"] },
        { name: "Bagian dari sebuah jendela", words: ["KUSEN", "DAUN", "TERALI"] },
      ],
    },
    hand: {
      title: "Tangan Kanan",
      pivot: "TANGAN",
      categories: [
        { name: "Bagian dari lengan", words: ["SIKU", "PERGELANGAN", "BAHU"] },
        { name: "Orang kepercayaan seorang bos", words: ["AJUDAN", "ASISTEN", "SEKRETARIS"] },
        { name: "Yang dibawa pulang dari perjalanan", words: ["SUVENIR", "CENDERAMATA", "KENANGAN"] },
        { name: "Cara memimpin dengan keras", words: ["BESI", "OTORITER", "TEGAS"] },
      ],
    },
    iron: {
      title: "Kopi Kuat",
      pivot: "KUAT",
      categories: [
        { name: "Sifat badan seorang atlet", words: ["BUGAR", "KEKAR", "PERKASA"] },
        { name: "Rasa kopi tanpa gula", words: ["PEKAT", "PAHIT", "KENTAL"] },
        { name: "Alasan yang sulit dibantah", words: ["LOGIS", "SAHIH", "MEYAKINKAN"] },
        { name: "Sifat bahan yang tidak mudah rusak", words: ["AWET", "TAHAN", "LIAT"] },
      ],
    },
    jack: {
      title: "Angka Keramat",
      pivot: "ANGKA",
      categories: [
        { name: "Lambang untuk menghitung", words: ["DIGIT", "BILANGAN", "NUMERAL"] },
        { name: "Yang dilaporkan badan statistik", words: ["PERSENTASE", "RASIO", "DATA"] },
        { name: "Yang bertambah saat tim unggul", words: ["POIN", "SKOR", "GOL"] },
        { name: "Yang dipasang penjudi togel", words: ["TEBAKAN", "SHIO", "MIMPI"] },
      ],
    },
    lap: {
      title: "Keliling Dunia",
      pivot: "KELILING",
      categories: [
        { name: "Yang dihitung dengan rumus dua pi er", words: ["LUAS", "DIAMETER", "JARI"] },
        { name: "Pedagang yang mendatangi rumah", words: ["ASONGAN", "PIKULAN", "GEROBAK"] },
        { name: "Perjalanan mengunjungi banyak tempat", words: ["TUR", "JELAJAH", "SAFARI"] },
        { name: "Yang dilakukan satpam pada malam hari", words: ["PATROLI", "RONDA", "INSPEKSI"] },
      ],
    },
    line: {
      title: "Baris Terakhir",
      pivot: "BARIS",
      categories: [
        { name: "Bagian dari sebuah puisi", words: ["BAIT", "RIMA", "LARIK"] },
        { name: "Susunan perintah di layar pemrogram", words: ["KODE", "SKRIP", "FUNGSI"] },
        { name: "Formasi pasukan di lapangan upacara", words: ["SAF", "BANJAR", "REGU"] },
        { name: "Yang dilakukan penonton sebelum masuk", words: ["ANTRE", "MENUNGGU", "BERDESAK"] },
      ],
    },
    log: {
      title: "Catatan Kaki",
      pivot: "CATATAN",
      categories: [
        { name: "Buku tempat menulis rahasia pribadi", words: ["DIARI", "JURNAL", "AGENDA"] },
        { name: "Yang tercetak di bagian bawah halaman", words: ["NOMOR", "SUMBER", "KETERANGAN"] },
        { name: "Yang dipegang dokter tentang pasien", words: ["REKAM", "RIWAYAT", "RESEP"] },
        { name: "Yang dipecahkan atlet di kejuaraan", words: ["REKOR", "WAKTU", "PRESTASI"] },
      ],
    },
    march: {
      title: "Langkah Seribu",
      pivot: "LANGKAH",
      categories: [
        { name: "Bagian dari sebuah prosedur", words: ["TAHAP", "FASE", "PROSES"] },
        { name: "Gerak pasukan di jalan raya", words: ["DERAP", "HENTAK", "IRAMA"] },
        { name: "Yang dipikirkan pemain catur", words: ["JURUS", "STRATEGI", "GILIRAN"] },
        { name: "Tindakan yang diambil pemerintah", words: ["KEBIJAKAN", "TEROBOSAN", "UPAYA"] },
      ],
    },
    mine: {
      title: "Tambang Emas",
      pivot: "TAMBANG",
      categories: [
        { name: "Yang digali dari perut bumi", words: ["EMAS", "BATUBARA", "NIKEL"] },
        { name: "Lomba khas tujuh belasan", words: ["KARUNG", "BAKIAK", "EGRANG"] },
        { name: "Bahan pembuat simpul di kapal", words: ["TALI", "KAWAT", "SERAT"] },
        { name: "Sumber penghasilan yang melimpah", words: ["LADANG", "LAHAN", "SUMUR"] },
      ],
    },
    model: {
      title: "Contoh Teladan",
      pivot: "CONTOH",
      categories: [
        { name: "Yang dikerjakan siswa sebelum ulangan", words: ["LATIHAN", "SOAL", "PEMBAHASAN"] },
        { name: "Orang yang patut ditiru", words: ["PANUTAN", "TELADAN", "IDOLA"] },
        { name: "Yang dibawa sales ke calon pembeli", words: ["KATALOG", "BROSUR", "SAMPEL"] },
        { name: "Yang diambil dokter untuk diperiksa", words: ["DARAH", "LENDIR", "JARINGAN"] },
      ],
    },
    net: {
      title: "Jaring Pengaman",
      pivot: "JARING",
      categories: [
        { name: "Perlengkapan nelayan di perahu", words: ["PUKAT", "PANCING", "BUBU"] },
        { name: "Bagian dari gawang sepak bola", words: ["MISTAR", "TIANG", "GARIS"] },
        { name: "Perlindungan bagi warga miskin", words: ["BANTUAN", "SUBSIDI", "ASURANSI"] },
        { name: "Yang dibuat laba-laba di sudut kamar", words: ["SARANG", "BENANG", "PERANGKAP"] },
      ],
    },
    patch: {
      title: "Tambal Sulam",
      pivot: "TAMBAL",
      categories: [
        { name: "Yang dipakai membetulkan ban bocor", words: ["PRES", "LEM", "KOMPRESOR"] },
        { name: "Yang dipakai dokter pada gigi berlubang", words: ["BOR", "SEMEN", "AMALGAM"] },
        { name: "Perbaikan yang setengah-setengah", words: ["SULAM", "DARURAT", "SEMENTARA"] },
        { name: "Yang dilakukan penjahit pada baju sobek", words: ["JAHIT", "SOM", "OBRAS"] },
      ],
    },
    pick: {
      title: "Pilih Kasih",
      pivot: "PILIH",
      categories: [
        { name: "Yang dilakukan warga di bilik suara", words: ["COBLOS", "CONTRENG", "DATANG"] },
        { name: "Bentuk soal dalam ujian", words: ["ESAI", "URAIAN", "ISIAN"] },
        { name: "Memperlakukan orang secara tidak sama", words: ["MEMBEDAKAN", "MENGISTIMEWAKAN", "MENGANAKEMASKAN"] },
        { name: "Yang dilakukan ibu pada beras", words: ["TAMPI", "SORTIR", "BERSIHKAN"] },
      ],
    },
    plant: {
      title: "Tanam Modal",
      pivot: "TANAM",
      categories: [
        { name: "Yang dilakukan petani di sawah", words: ["BAJAK", "SEMAI", "PANEN"] },
        { name: "Yang dilakukan investor pada perusahaan", words: ["SETOR", "INVESTASI", "SAHAM"] },
        { name: "Kesan yang tak hilang dari ingatan", words: ["MEMBEKAS", "MELEKAT", "TERUKIR"] },
        { name: "Yang dilakukan pada jenazah di pemakaman", words: ["KUBUR", "MAKAM", "LIANG"] },
      ],
    },
    plate: {
      title: "Pelat Nomor",
      pivot: "PELAT",
      categories: [
        { name: "Yang tertempel di depan mobil", words: ["NOMOR", "STIKER", "LOGO"] },
        { name: "Bahan penutup lambung kapal", words: ["BAJA", "LOGAM", "ALUMINIUM"] },
        { name: "Yang dipakai di percetakan offset", words: ["TINTA", "ROL", "KERTAS"] },
        { name: "Cara bicara yang tidak jelas", words: ["CADEL", "SENGAU", "GAGAP"] },
      ],
    },
    pool: {
      title: "Kumpul Keluarga",
      pivot: "KUMPUL",
      categories: [
        { name: "Acara keluarga besar saat lebaran", words: ["ARISAN", "REUNI", "HALALBIHALAL"] },
        { name: "Yang dilakukan panitia untuk korban bencana", words: ["GALANG", "DONASI", "SUMBANG"] },
        { name: "Yang dilakukan siswa dengan tugasnya", words: ["SERAHKAN", "SETOR", "ANTAR"] },
        { name: "Yang dilakukan semut pada makanan", words: ["TIMBUN", "SIMPAN", "BAWA"] },
      ],
    },
    port: {
      title: "Tempat Bersandar",
      pivot: "SANDAR",
      categories: [
        { name: "Yang dilakukan kapal di dermaga", words: ["MERAPAT", "BERLABUH", "TAMBAT"] },
        { name: "Bagian dari sebuah kursi", words: ["DUDUKAN", "LENGAN", "KAKI"] },
        { name: "Tempat mengadu saat sedih", words: ["BAHU", "PELUKAN", "TELINGA"] },
        { name: "Menggantungkan harapan pada orang lain", words: ["BERGANTUNG", "BERHARAP", "MENUMPANG"] },
      ],
    },
    range: {
      title: "Wawasan Luas",
      pivot: "LUAS",
      categories: [
        { name: "Yang dicatat saat mengukur tanah", words: ["PANJANG", "LEBAR", "TINGGI"] },
        { name: "Sifat wawasan orang yang rajin membaca", words: ["KAYA", "DALAM", "TERBUKA"] },
        { name: "Bentang alam tanpa batas", words: ["SAMUDERA", "PADANG", "GURUN"] },
        { name: "Seberapa jauh siaran bisa ditangkap", words: ["RADIUS", "CAKUPAN", "DAYA"] },
      ],
    },
    school: {
      title: "Guru Besar",
      pivot: "GURU",
      categories: [
        { name: "Gelar tertinggi seorang dosen", words: ["PROFESOR", "DOKTOR", "MAGISTER"] },
        { name: "Orang yang mengajar di pesantren", words: ["KIAI", "USTAZ", "MUALIM"] },
        { name: "Yang memberi pelajaran hidup", words: ["PENGALAMAN", "KEGAGALAN", "WAKTU"] },
        { name: "Petugas di sebuah sekolah dasar", words: ["KEPSEK", "PENJAGA", "PUSTAKAWAN"] },
      ],
    },
    screen: {
      title: "Layar Tancap",
      pivot: "LAYAR",
      categories: [
        { name: "Bagian dari sebuah perahu", words: ["DAYUNG", "KEMUDI", "JANGKAR"] },
        { name: "Yang disorot proyektor di bioskop", words: ["FILM", "GAMBAR", "IKLAN"] },
        { name: "Bagian depan sebuah ponsel", words: ["KAMERA", "SPEAKER", "TOMBOL"] },
        { name: "Yang dilakukan pelaut meninggalkan pelabuhan", words: ["BERANGKAT", "MELAUT", "MENGARUNG"] },
      ],
    },
    shade: {
      title: "Warna Suara",
      pivot: "WARNA",
      categories: [
        { name: "Yang dipilih saat mengecat rumah", words: ["KREM", "MARUN", "TOSKA"] },
        { name: "Ciri khas suara seorang penyanyi", words: ["TIMBRE", "CENGKOK", "VIBRA"] },
        { name: "Corak sebuah partai politik", words: ["IDEOLOGI", "HALUAN", "GARIS"] },
        { name: "Yang membuat hidup jadi menarik", words: ["RAGAM", "VARIASI", "KEJUTAN"] },
      ],
    },
    shell: {
      title: "Perusahaan Cangkang",
      pivot: "CANGKANG",
      categories: [
        { name: "Pembungkus sebutir telur", words: ["SELAPUT", "PUTIH", "KUNING"] },
        { name: "Yang dipungut anak di pantai", words: ["KERANG", "SIPUT", "PASIR"] },
        { name: "Perusahaan tanpa kegiatan nyata", words: ["FIKTIF", "SILUMAN", "KOSONG"] },
        { name: "Bagian luar yang keras pada hewan", words: ["SISIK", "DURI", "TANDUK"] },
      ],
    },
    shot: {
      title: "Suntik Dana",
      pivot: "SUNTIK",
      categories: [
        { name: "Yang dilakukan perawat di lengan pasien", words: ["VAKSIN", "IMUNISASI", "INFUS"] },
        { name: "Yang diberikan pemerintah pada perusahaan rugi", words: ["DANA", "MODAL", "BANTUAN"] },
        { name: "Yang dilakukan pada hewan yang sakit parah", words: ["EUTANASIA", "BIUS", "TIDUR"] },
        { name: "Yang dipakai atlet curang", words: ["DOPING", "STEROID", "HORMON"] },
      ],
    },
    sign: {
      title: "Bahasa Isyarat",
      pivot: "ISYARAT",
      categories: [
        { name: "Gerakan tangan tanpa suara", words: ["LAMBAIAN", "TUNJUKAN", "KEDIPAN"] },
        { name: "Yang dipakai tunarungu berkomunikasi", words: ["BAHASA", "JARI", "EKSPRESI"] },
        { name: "Yang dibaca nelayan sebelum melaut", words: ["AWAN", "OMBAK", "BINTANG"] },
        { name: "Yang dinyalakan pengemudi sebelum berbelok", words: ["SEIN", "KLAKSON", "LAMPU"] },
      ],
    },
    slip: {
      title: "Selip Lidah",
      pivot: "SELIP",
      categories: [
        { name: "Yang terjadi pada ban di jalan basah", words: ["TERGELINCIR", "OLENG", "MELINTIR"] },
        { name: "Nasib kunci di antara tumpukan buku", words: ["TERSEMBUNYI", "TERJEPIT", "HILANG"] },
        { name: "Kesalahan kecil saat berbicara", words: ["KESELEO", "KELIRU", "SALAH"] },
        { name: "Yang dilakukan penyuap dengan amplop", words: ["SISIPKAN", "SODORKAN", "SERAHKAN"] },
      ],
    },
    square: {
      title: "Turun ke Lapangan",
      pivot: "LAPANGAN",
      categories: [
        { name: "Tempat pesawat mendarat", words: ["BANDARA", "LANDASAN", "APRON"] },
        { name: "Yang dicari lulusan baru", words: ["PEKERJAAN", "LOWONGAN", "KARIER"] },
        { name: "Tempat upacara bendera diadakan", words: ["TIANG", "PODIUM", "BARISAN"] },
        { name: "Cara peneliti mengumpulkan data langsung", words: ["SURVEI", "WAWANCARA", "OBSERVASI"] },
      ],
    },
    stage: {
      title: "Panggung Politik",
      pivot: "PANGGUNG",
      categories: [
        { name: "Perlengkapan pertunjukan musik", words: ["SOROT", "PENGERAS", "TIRAI"] },
        { name: "Rumah adat yang berdiri di atas tiang", words: ["JOGLO", "GADANG", "HONAI"] },
        { name: "Tempat orang berpidato di depan umum", words: ["MIMBAR", "PODIUM", "BALKON"] },
        { name: "Dunia tempat politikus saling beradu", words: ["ARENA", "KANCAH", "GELANGGANG"] },
      ],
    },
    stand: {
      title: "Tegak Lurus",
      pivot: "TEGAK",
      categories: [
        { name: "Sikap tubuh saat upacara", words: ["SIAP", "HORMAT", "ISTIRAHAT"] },
        { name: "Yang dilakukan aparat pada hukum", words: ["JAGA", "JALANKAN", "TERAPKAN"] },
        { name: "Posisi garis yang membentuk sudut siku", words: ["LURUS", "VERTIKAL", "MIRING"] },
        { name: "Sifat orang yang tidak goyah", words: ["TEGUH", "KUKUH", "MANTAP"] },
      ],
    },
    stock: {
      title: "Modal Nekat",
      pivot: "MODAL",
      categories: [
        { name: "Uang untuk memulai usaha", words: ["DANA", "PINJAMAN", "TABUNGAN"] },
        { name: "Kelebihan yang dimiliki seseorang", words: ["BAKAT", "WAJAH", "SUARA"] },
        { name: "Yang dibagi dalam sebuah perseroan", words: ["SAHAM", "DIVIDEN", "LEMBAR"] },
        { name: "Bekal orang yang berani ambil risiko", words: ["NEKAT", "KEYAKINAN", "NYALI"] },
      ],
    },
    strike: {
      title: "Mogok Kerja",
      pivot: "MOGOK",
      categories: [
        { name: "Keadaan mesin yang tak mau menyala", words: ["MATI", "NGADAT", "REWEL"] },
        { name: "Cara buruh menuntut kenaikan upah", words: ["DEMO", "BOIKOT", "PETISI"] },
        { name: "Cara tahanan memprotes tanpa kekerasan", words: ["PUASA", "DIAM", "BERTAHAN"] },
        { name: "Sikap anak yang tidak mau ke sekolah", words: ["MEMBOLOS", "NGAMBEK", "MALAS"] },
      ],
    },
    suit: {
      title: "Cocok Tanam",
      pivot: "COCOK",
      categories: [
        { name: "Sesuai satu sama lain", words: ["PAS", "SERASI", "KLOP"] },
        { name: "Kegiatan bertani di ladang", words: ["BAJAK", "TANAM", "PANEN"] },
        { name: "Yang dilakukan pada sate sebelum dibakar", words: ["TUSUK", "LUMURI", "BAKAR"] },
        { name: "Yang dicari dua orang sebelum menikah", words: ["JODOH", "RESTU", "KESIAPAN"] },
      ],
    },
    tie: {
      title: "Ikat Pinggang",
      pivot: "IKAT",
      categories: [
        { name: "Satuan untuk membeli kangkung", words: ["GENGGAM", "KILO", "BUNGKUS"] },
        { name: "Yang dipakai melingkar di pinggang", words: ["SABUK", "TALI", "KORSET"] },
        { name: "Yang mempersatukan dua orang", words: ["JANJI", "SUMPAH", "AKAD"] },
        { name: "Kain yang dililitkan di kepala", words: ["UDENG", "BLANGKON", "SORBAN"] },
      ],
    },
    tip: {
      title: "Pucuk Pimpinan",
      pivot: "PUCUK",
      categories: [
        { name: "Bagian teratas sebuah tanaman", words: ["TUNAS", "DAUN", "TANGKAI"] },
        { name: "Jabatan tertinggi di sebuah lembaga", words: ["KETUA", "DIREKTUR", "PIMPINAN"] },
        { name: "Kata untuk menghitung senapan", words: ["BUTIR", "BATANG", "LARAS"] },
        { name: "Yang datang lewat kantor pos", words: ["SURAT", "KARTU", "PAKET"] },
      ],
    },
    toast: {
      title: "Bakar Semangat",
      pivot: "BAKAR",
      categories: [
        { name: "Cara memasak ikan di tepi pantai", words: ["ASAP", "GORENG", "KUKUS"] },
        { name: "Membuat penonton makin bergairah", words: ["SULUT", "KOBARKAN", "PANASKAN"] },
        { name: "Yang dilakukan usaha rintisan dengan dananya", words: ["HABISKAN", "BOROSKAN", "GELONTORKAN"] },
        { name: "Nasib kulit di bawah terik matahari", words: ["GOSONG", "MELEPUH", "MENGHITAM"] },
      ],
    },
    top: {
      title: "Kelas Atas",
      pivot: "ATAS",
      categories: [
        { name: "Orang yang memberi perintah di kantor", words: ["BOS", "PIMPINAN", "MANAJER"] },
        { name: "Golongan orang berada", words: ["ELITE", "KAYA", "BORJUIS"] },
        { name: "Bagian tertinggi sebuah bangunan", words: ["ATAP", "MENARA", "KUBAH"] },
        { name: "Yang baru terjadi dalam hitungan rencana", words: ["TEORI", "KERTAS", "WACANA"] },
      ],
    },
    story: {
      title: "Babak Baru",
      pivot: "BABAK",
      categories: [
        { name: "Pembagian dalam pertandingan tinju", words: ["RONDE", "SESI", "JEDA"] },
        { name: "Bagian dari sebuah pementasan", words: ["ADEGAN", "PROLOG", "EPILOG"] },
        { name: "Masa baru dalam perjalanan hidup", words: ["FASE", "ERA", "LEMBARAN"] },
        { name: "Keadaan orang yang habis dihajar", words: ["LEBAM", "BENGKAK", "REMUK"] },
      ],
    },
    web: {
      title: "Jaringan Gelap",
      pivot: "JARINGAN",
      categories: [
        { name: "Yang tersusun dari sel-sel tubuh", words: ["OTOT", "SARAF", "LEMAK"] },
        { name: "Yang dibutuhkan agar ponsel terhubung", words: ["SINYAL", "PULSA", "WIFI"] },
        { name: "Milik peritel di banyak kota", words: ["CABANG", "GERAI", "WARALABA"] },
        { name: "Kelompok rahasia yang saling terhubung", words: ["SINDIKAT", "KOMPLOTAN", "MAFIA"] },
      ],
    },
    wing: {
      title: "Bulu Kuduk",
      pivot: "BULU",
      categories: [
        { name: "Bagian dari sebuah mata", words: ["KELOPAK", "ALIS", "PUPIL"] },
        { name: "Bahan pembuat sapu dan kemoceng", words: ["IJUK", "RAFIA", "LIDI"] },
        { name: "Pembagian berat dalam tinju", words: ["TERBANG", "BANTAM", "RINGAN"] },
        { name: "Yang merinding saat orang ketakutan", words: ["KUDUK", "TENGKUK", "ROMA"] },
      ],
    },
    yard: {
      title: "Petak Umpet",
      pivot: "PETAK",
      categories: [
        { name: "Permainan sembunyi anak kampung", words: ["UMPET", "GALASIN", "BENTENGAN"] },
        { name: "Ukuran tanah yang disewakan", words: ["KAVLING", "BIDANG", "LAHAN"] },
        { name: "Hunian kecil yang dikontrakkan", words: ["KOS", "KAMAR", "LOSMEN"] },
        { name: "Yang tergambar di papan permainan", words: ["KOTAK", "BIDAK", "DADU"] },
      ],
    },
    bow: {
      title: "Busur Derajat",
      pivot: "BUSUR",
      categories: [
        { name: "Perlengkapan olahraga memanah", words: ["PANAH", "SASARAN", "PELINDUNG"] },
        { name: "Perlengkapan seorang pemain biola", words: ["SENAR", "DAWAI", "ROSIN"] },
        { name: "Bagian dari sebuah lingkaran", words: ["JARI", "DIAMETER", "TALI"] },
        { name: "Alat ukur di dalam kotak pensil", words: ["JANGKA", "PENGGARIS", "SEGITIGA"] },
      ],
    },
    bill: {
      title: "Paruh Waktu",
      pivot: "PARUH",
      categories: [
        { name: "Bagian tubuh seekor burung", words: ["CAKAR", "SAYAP", "JAMBUL"] },
        { name: "Status kerja seorang mahasiswa", words: ["MAGANG", "LEPAS", "SAMBILAN"] },
        { name: "Pembagian sebuah kompetisi liga", words: ["PUTARAN", "MUSIM", "SERI"] },
        { name: "Bagian mulut seekor hewan", words: ["MONCONG", "TARING", "LIDAH"] },
      ],
    },
    party: {
      title: "Pesta Demokrasi",
      pivot: "PESTA",
      categories: [
        { name: "Acara syukuran di rumah", words: ["SELAMATAN", "KENDURI", "RESEPSI"] },
        { name: "Sebutan untuk pemilihan umum", words: ["PEMILU", "COBLOSAN", "DEMOKRASI"] },
        { name: "Ajang olahraga antarnegara", words: ["OLIMPIADE", "ASIAD", "SEAGAMES"] },
        { name: "Cara merayakan secara berlebihan", words: ["PORA", "FOYA", "HURAHURA"] },
      ],
    },
    pump: {
      title: "Pompa Semangat",
      pivot: "POMPA",
      categories: [
        { name: "Yang dipasang di sumur bor", words: ["PARALON", "TOREN", "KERAN"] },
        { name: "Perlengkapan bengkel tambal ban", words: ["KOMPRESOR", "DONGKRAK", "KUNCI"] },
        { name: "Yang diberikan pelatih sebelum bertanding", words: ["SEMANGAT", "ARAHAN", "DUKUNGAN"] },
        { name: "Yang bekerja tanpa henti di dalam dada", words: ["JANTUNG", "PARU", "NADI"] },
      ],
    },
    wheel: {
      title: "Roda Kehidupan",
      pivot: "RODA",
      categories: [
        { name: "Bagian dari sebuah sepeda motor", words: ["BAN", "VELG", "RANTAI"] },
        { name: "Yang terus berputar dalam hidup", words: ["NASIB", "UNTUNG", "ZAMAN"] },
        { name: "Yang dijalankan sebuah pemerintahan", words: ["BIROKRASI", "KEBIJAKAN", "PROGRAM"] },
        { name: "Bagian dalam sebuah jam mekanik", words: ["PEGAS", "GIGI", "PENDULUM"] },
      ],
    },
    bridge: {
      title: "Jembatan Keledai",
      pivot: "JEMBATAN",
      categories: [
        { name: "Yang dipakai menyeberangi sungai", words: ["RAKIT", "PERAHU", "GETEK"] },
        { name: "Cara mengingat pelajaran dengan mudah", words: ["SINGKATAN", "AKRONIM", "LAGU"] },
        { name: "Yang menghubungkan dua pihak berselisih", words: ["PENENGAH", "MEDIATOR", "JURUDAMAI"] },
        { name: "Tempat truk ditimbang muatannya", words: ["TIMBANGAN", "POS", "PORTAL"] },
      ],
    },
    race: {
      title: "Lomba Karung",
      pivot: "LOMBA",
      categories: [
        { name: "Nomor yang dipertandingkan di stadion", words: ["LARI", "LOMPAT", "LEMPAR"] },
        { name: "Yang diadakan di kampung tiap Agustus", words: ["KARUNG", "KELERENG", "PANJATPINANG"] },
        { name: "Yang dilakukan dua perusahaan di pasar sama", words: ["BERSAING", "BEREBUT", "BERPACU"] },
        { name: "Ajang mengasah bakat anak sekolah", words: ["OLIMPIADE", "FESTIVAL", "TURNAMEN"] },
      ],
    },
    belt: {
      title: "Sabuk Hitam",
      pivot: "SABUK",
      categories: [
        { name: "Perlengkapan keselamatan di mobil", words: ["AIRBAG", "REM", "HELM"] },
        { name: "Tingkatan dalam bela diri", words: ["PUTIH", "COKELAT", "HITAM"] },
        { name: "Wilayah rawan gempa di dunia", words: ["ZONA", "JALUR", "CINCIN"] },
        { name: "Yang dipakai menahan celana", words: ["SUSPENDER", "TALI", "KAIT"] },
      ],
    },
    dress: {
      title: "Rapi Jali",
      pivot: "RAPI",
      categories: [
        { name: "Keadaan kamar setelah dibereskan", words: ["TERTATA", "TERATUR", "BERES"] },
        { name: "Sifat tulisan tangan yang enak dibaca", words: ["JELAS", "INDAH", "TERBACA"] },
        { name: "Cara penjahat menutupi jejaknya", words: ["LICIN", "MULUS", "SENYAP"] },
        { name: "Penampilan para tamu undangan", words: ["NECIS", "PARLENTE", "KLIMIS"] },
      ],
    },
    horn: {
      title: "Adu Tanduk",
      pivot: "TANDUK",
      categories: [
        { name: "Yang tumbuh di kepala seekor hewan", words: ["JAMBUL", "SURAI", "KUMIS"] },
        { name: "Yang dilakukan dua kambing jantan", words: ["ADU", "SERUDUK", "SERANG"] },
        { name: "Bahan kerajinan dari bagian tubuh hewan", words: ["GADING", "KULIT", "TULANG"] },
        { name: "Yang dipakai memanggil pasukan zaman dulu", words: ["TEROMPET", "GENDANG", "BENDERA"] },
      ],
    },
    point: {
      title: "Inti Masalah",
      pivot: "INTI",
      categories: [
        { name: "Bagian tengah sebuah atom", words: ["ELEKTRON", "PROTON", "NEUTRON"] },
        { name: "Bagian terpanas di dalam bumi", words: ["KERAK", "MANTEL", "MAGMA"] },
        { name: "Hal terpenting dari sebuah pidato", words: ["PESAN", "MAKSUD", "POKOK"] },
        { name: "Yang tersisa setelah bahan disaring", words: ["SARI", "EKSTRAK", "PATI"] },
      ],
    },
    punch: {
      title: "Pukul Rata",
      pivot: "PUKUL",
      categories: [
        { name: "Cara menyebut waktu dalam undangan", words: ["JAM", "LEWAT", "TEPAT"] },
        { name: "Yang dilontarkan petinju di atas ring", words: ["JAB", "HOOK", "UPPERCUT"] },
        { name: "Menyamakan semua tanpa membedakan", words: ["RATA", "SAMA", "SEREMPAK"] },
        { name: "Yang dilakukan pada gong dan kentongan", words: ["TABUH", "PALU", "KETUK"] },
      ],
    },
    season: {
      title: "Lagi Musim",
      pivot: "MUSIM",
      categories: [
        { name: "Pergantian cuaca dalam setahun", words: ["KEMARAU", "PANCAROBA", "PENGHUJAN"] },
        { name: "Bagian dari sebuah serial televisi", words: ["EPISODE", "SEKUEL", "FINALE"] },
        { name: "Masa panen buah di kebun", words: ["RAYA", "LEBAT", "MELIMPAH"] },
        { name: "Yang sedang digemari banyak orang", words: ["TREN", "MODE", "DEMAM"] },
      ],
    },
    space: {
      title: "Ruang Lingkup",
      pivot: "RUANG",
      categories: [
        { name: "Bagian dalam sebuah rumah", words: ["KAMAR", "DAPUR", "TERAS"] },
        { name: "Yang berada di luar atmosfer bumi", words: ["BINTANG", "GALAKSI", "ASTRONOT"] },
        { name: "Batas cakupan sebuah penelitian", words: ["LINGKUP", "BIDANG", "FOKUS"] },
        { name: "Jarak kosong antara dua kata", words: ["SPASI", "JEDA", "MARGIN"] },
      ],
    },
    staff: {
      title: "Tongkat Estafet",
      pivot: "TONGKAT",
      categories: [
        { name: "Yang dipakai kakek untuk berjalan", words: ["KRUK", "WALKER", "PENYANGGA"] },
        { name: "Perlengkapan lomba lari beranting", words: ["ESTAFET", "LINTASAN", "PELUIT"] },
        { name: "Yang dipegang penyihir di dongeng", words: ["JUBAH", "TOPI", "MANTRA"] },
        { name: "Lambang kekuasaan seorang jenderal", words: ["BINTANG", "SERAGAM", "LENCANA"] },
      ],
    },
    wake: {
      title: "Bangun Ruang",
      pivot: "BANGUN",
      categories: [
        { name: "Yang dilakukan orang setelah alarm berbunyi", words: ["MELEK", "BERANJAK", "MENGUCEK"] },
        { name: "Yang dilakukan pemborong di lahan kosong", words: ["DIRIKAN", "GARAP", "RENOVASI"] },
        { name: "Bentuk tiga dimensi dalam ilmu ukur", words: ["KUBUS", "LIMAS", "KERUCUT"] },
        { name: "Yang dilakukan pada semangat yang padam", words: ["KOBARKAN", "HIDUPKAN", "PULIHKAN"] },
      ],
    },
    boot: {
      title: "Hidup Lagi",
      pivot: "HIDUP",
      categories: [
        { name: "Yang dilakukan pada mesin mobil pagi hari", words: ["STATER", "KONTAK", "PANASI"] },
        { name: "Sebutan untuk makhluk yang bernapas", words: ["MANUSIA", "HEWAN", "TUMBUHAN"] },
        { name: "Yang diteriakkan massa di jalanan", words: ["MERDEKA", "LAWAN", "BERSATU"] },
        { name: "Yang dilalui orang dari lahir sampai tua", words: ["NASIB", "TAKDIR", "KISAH"] },
      ],
    },
    current: {
      title: "Arus Mudik",
      pivot: "ARUS",
      categories: [
        { name: "Yang berputar di sungai deras", words: ["PUSARAN", "RIAM", "OLAKAN"] },
        { name: "Yang diukur dalam satuan ampere", words: ["TEGANGAN", "DAYA", "HAMBATAN"] },
        { name: "Perpindahan orang saat lebaran", words: ["MUDIK", "BALIK", "LIBURAN"] },
        { name: "Derasnya kabar di media sosial", words: ["INFORMASI", "BERITA", "UNGGAHAN"] },
      ],
    },
    pilot: {
      title: "Uji Nyali",
      pivot: "UJI",
      categories: [
        { name: "Yang dijalani siswa di akhir semester", words: ["ULANGAN", "KUIS", "EVALUASI"] },
        { name: "Yang dilakukan pabrik pada produk baru", words: ["COBA", "PURWARUPA", "SAMPEL"] },
        { name: "Acara televisi yang menantang keberanian", words: ["NYALI", "HANTU", "MISTERI"] },
        { name: "Yang dilakukan pada bahan di laboratorium", words: ["ANALISIS", "PERIKSA", "TELITI"] },
      ],
    },
  },
};
