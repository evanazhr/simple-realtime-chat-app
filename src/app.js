require('dotenv').config(); // Load environment variables first

const express = require("express");
const session = require("express-session");
const http = require("http"); // Menggunakan modul http untuk server
const socketIo = require("socket.io"); // Menggunakan nama yang lebih jelas untuk socket.io

// Pastikan import db hanya untuk inisialisasi awal jika diperlukan,
// atau hapus jika model sudah menanganinya
require('./utils/db'); // Ini akan menjalankan inisialisasi DB

// Import Models untuk Socket.IO agar bisa berinteraksi dengan DB
const MessageModel = require('./models/messageModel');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app); // Buat server HTTP dari aplikasi Express
const io = socketIo(server); // Attach Socket.IO ke server HTTP

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Dipakai oleh MessageModel, tapi tetap di sini jika ada logika lain yang butuh.

const onlineUsers = {}; // username -> socket.id

// EJS as view engine
app.set("view engine", "ejs");
app.set('views', './views'); // Pastikan Express tahu di mana menemukan views

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Untuk file CSS, JS client-side
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_chat_secret", // Ambil dari .env
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Session 1 hari
  })
);

// Routes
app.use("/", authRoutes); // Menggunakan router authRoutes
app.use("/", chatRoutes); // Menggunakan router chatRoutes
app.use("/", userRoutes); // Menggunakan router userRoutes

// ------------------- SOCKET.IO ------------------- //

io.on("connection", (socket) => {
  socket.on("join", (username) => {
    socket.username = username;
    onlineUsers[username] = socket.id;
    console.log(`${username} connected as ${socket.id}`);
    io.emit('user_online', username); // Beri tahu semua klien ada user online baru
  });

  socket.on("new_message", (data) => {
    const { sender, receiver, message } = data; // Pesan dari klien belum dienkripsi
    
    // Simpan pesan yang sudah dienkripsi ke database melalui Model
    MessageModel.createMessage(sender, receiver, message, (err) => {
      if (err) return console.error("Error saving message to DB:", err);

      // Setelah berhasil disimpan, baru kirim ke klien.
      // Untuk pengiriman ke klien, kita kirim pesan asli (yang belum dienkripsi)
      // atau bisa juga kirim yang sudah didekripsi jika memang mau dekripsi di server
      // dan kirim yang sudah didekripsi ke klien.
      // Dalam kasus ini, karena EJS render sudah dekripsi, kita kirim yang sudah dienkripsi
      // oleh MessageModel dan nanti didekripsi lagi di sisi klien jika mau.
      // Atau, untuk kesederhanaan, kirim pesan asli ke klien setelah disimpan.
      
      const msgPayload = { sender, receiver, message, timestamp: new Date().toISOString() };

      if (receiver) {
        const targetSocketId = onlineUsers[receiver];
        const senderSocketId = onlineUsers[sender];
        if (targetSocketId) io.to(targetSocketId).emit("private_message", msgPayload);
        if (senderSocketId && senderSocketId !== targetSocketId) io.to(senderSocketId).emit("private_message", msgPayload);
      } else {
        io.emit("new_message", msgPayload); // Global chat
      }
    });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      delete onlineUsers[socket.username];
      console.log(`${socket.username} disconnected`);
      io.emit('user_offline', socket.username); // Beri tahu semua klien ada user offline
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));