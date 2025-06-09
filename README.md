# Simple App Chat

Simple App Chat adalah aplikasi chat sederhana yang dibuat menggunakan Node.js (Express) dan Socket.IO. Dengan aplikasi ini, kamu bisa melakukan chatting secara real-time dan bisa menggunakan banyak tab atau device untuk mengobrol bersama.

## Fitur Utama
- Chat real-time menggunakan Socket.IO
- Login dan registrasi user dengan SQLite sebagai database sederhana
- Mendukung multi user chatting, bisa buka banyak tab browser dan chat bersama
- UI tema gelap (dark UI) yang modern dan aesthetic
- Menyimpan pesan chat sementara saat sesi berjalan

## Cara Menjalankan Aplikasi
#### Clone repo ini:

```bash
git clone <URL-REPO-ANDA>
cd <NAMA-FOLDER-REPO>
```

#### Install Node.js
Jika belum ada, install Node.js dari https://nodejs.org/.

Install dependencies:

```bash
npm install
```
Jalankan aplikasi:

```bash
npm start
```
Buka browser, akses:

```bash
http://localhost:3000
```

#### Cara Menggunakan
- Daftar akun baru lewat halaman Register
- Login dengan akun yang sudah dibuat
- Masuk ke halaman chat dan mulai ngobrol
- Bisa buka beberapa tab atau browser/device lain, masuk dengan user yang sama atau berbeda, chat akan muncul secara real-time

#### Struktur Project
- app.js - file utama server Express + Socket.IO
- views/ - folder template EJS untuk halaman frontend
- public/ - folder file statis seperti CSS, JS, gambar
- chat.db - database SQLite yang menyimpan user dan pesan chat
- Catatan
Saat ini, pesan hanya disimpan sementara di database dan di-load saat user login
- UI menggunakan tema gelap yang konsisten antara halaman login, register, dan chat
- Socket.IO menghandle komunikasi real-time dan broadcast pesan ke semua user yang terkoneksi