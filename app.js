const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const app = express();
const server = app.listen(3000, () => console.log('Server jalan di port 3000'));
const io = require('socket.io')(server);

const db = new sqlite3.Database('./database.sqlite');

const saltRounds = 10;

// Buat tabel kalau belum ada
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'chat-secret',
  resave: false,
  saveUninitialized: false
}));

// Middleware cek login
function checkAuth(req, res, next) {
  if (!req.session.username) return res.redirect('/login');
  next();
}

// Routes

app.get('/', (req, res) => {
    // Misal cek session user login (sesuaikan dengan cara kamu menyimpan user login)
    const user = req.session?.user || null; 
  
    res.render('index', { user });
  });

app.get('/login', (req, res) => {
    res.render('login', { register: false, error: null });
  });
  

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.send("DB error");
    if (!user) return res.render('login', { error: "User tidak ditemukan" });

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        req.session.username = username;
        res.redirect('/chat');
      } else {
        res.render('login', { register: false, error: "Password salah" });
      }
    });
  });
});

app.get('/register', (req, res) => {
  res.render('login', { error: null, register: true });
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) return res.send("Hash error");
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], (err) => {
      if (err) {
        return res.render('login', { error: "Username sudah digunakan", register: true });
      }
      res.redirect('/login');
    });
  });
});

app.get('/chat', checkAuth, (req, res) => {
  db.all("SELECT * FROM messages ORDER BY timestamp ASC", (err, messages) => {
    if (err) return res.send("DB error");
    res.render('chat', { username: req.session.username, messages });
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Socket.io handling
io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('new_message', (data) => {
    // Simpan pesan ke DB
    const stmt = db.prepare("INSERT INTO messages (sender, message) VALUES (?, ?)");
    stmt.run(data.username, data.message, (err) => {
      if (err) return console.error(err);
      // Broadcast pesan ke semua client
      io.emit('new_message', { username: data.username, message: data.message });
    });
    stmt.finalize();
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
