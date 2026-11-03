DIHO KASIR PRO — PEMBARUAN TAMPILAN

ISI PAKET
- index.html
- styles.css
- app.js
- sw.js
- manifest.json
- assets/dashboard-reference.jpg

TAMPILAN
Beranda memakai potongan gambar aplikasi dari screenshot yang diberikan agar komposisi, gambar, warna, dan susunan menu mengikuti referensi. Area menu dan kartu dibuat dapat ditekan.

FITUR
- Beranda dan pencarian barang cepat
- Front-Office / POS, keranjang, checkout, pengurangan stok
- Scan UPC / barcode dengan kamera jika browser mendukung BarcodeDetector
- Cari barcode secara manual
- Tambah, edit, hapus, dan cari barang
- Membership
- Back-Office dan ekspor JSON
- Laporan penjualan dan ekspor CSV
- Backup dan pulihkan data JSON
- Penyimpanan lokal browser
- PWA / cache offline

CARA MEMASANG DI GITHUB PAGES
1. Ekstrak ZIP.
2. Unggah semua file dan folder dengan susunan yang sama ke repository.
3. Pastikan folder assets ikut terunggah.
4. Aktifkan GitHub Pages atau tunggu deploy selesai.
5. Buka URL HTTPS di Chrome Android lalu muat ulang.
6. Jika tampilan lama masih tersimpan, hapus data/cache situs atau ubah versi cache service worker, lalu buka kembali.

CATATAN DATA
Aplikasi menggunakan localStorage dengan kunci lama:
diho-products, diho-tx, diho-members.
Karena kunci penyimpanan tetap sama, data lama pada browser/perangkat yang sama akan tetap dibaca. Sebaiknya buat backup sebelum mengganti file.
Data localStorage terikat pada browser dan alamat situs; pindah domain/browser/perangkat tidak otomatis memindahkan data.
Kamera barcode memerlukan HTTPS, izin kamera, dan dukungan BarcodeDetector dari browser.
Ini aplikasi front-end lokal, belum memiliki sinkronisasi antarperangkat atau server pusat.
