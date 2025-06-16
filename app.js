const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");
const app = express();
const server = app.listen(3000, () => console.log("Server jalan di port 3000"));
const io = require("socket.io")(server);

const db = new sqlite3.Database("./database.sqlite");
const saltRounds = 10;
const ENCRYPTION_KEY = "your-secret-key";

// Buat tabel

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT,
    receiver TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "chat-secret",
    resave: false,
    saveUninitialized: false,
  })
);

function checkAuth(req, res, next) {
  if (!req.session.username) return res.redirect("/login");
  next();
}

app.get("/", (req, res) => {
  res.redirect("/chat");
});

app.get("/login", (req, res) => {
  res.render("auth", { register: false, error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (!user) return res.render("auth", { register: false, error: "User tidak ditemukan" });
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        req.session.username = username;
        res.redirect("/chat");
      } else {
        res.render("auth", { register: false, error: "Password salah" });
      }
    });
  });
});

app.get("/register", (req, res) => {
  res.render("auth", { register: true, error: null });
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  bcrypt.hash(password, saltRounds, (err, hash) => {
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], (err) => {
      if (err) return res.render("auth", { register: true, error: "Username sudah dipakai" });
      res.redirect("/login");
    });
  });
});

// Global Chat
app.get("/chat", checkAuth, (req, res) => {
  db.all("SELECT * FROM messages WHERE receiver IS NULL ORDER BY timestamp ASC", (err, messages) => {
    const decryptedMessages = messages.map((msg) => {
      try {
        const bytes = CryptoJS.AES.decrypt(msg.message, ENCRYPTION_KEY);
        msg.message = bytes.toString(CryptoJS.enc.Utf8) || "[DECRYPTION FAILED]";
      } catch {
        msg.message = "[ERROR]";
      }
      return msg;
    });

    res.render("chat", {
      username: req.session.username,
      messages: decryptedMessages,
      chattingWith: null
    });
  });
});

// Private Chat
app.get("/chat/:targetUser", checkAuth, (req, res) => {
  const { username } = req.session;
  const target = req.params.targetUser;

  db.all(
    `SELECT * FROM messages WHERE 
      (sender = ? AND receiver = ?) OR 
      (sender = ? AND receiver = ?) ORDER BY timestamp ASC`,
    [username, target, target, username],
    (err, messages) => {
      const decryptedMessages = messages.map((msg) => {
        try {
          const bytes = CryptoJS.AES.decrypt(msg.message, ENCRYPTION_KEY);
          msg.message = bytes.toString(CryptoJS.enc.Utf8) || "[DECRYPTION FAILED]";
        } catch {
          msg.message = "[ERROR]";
        }
        return msg;
      });

      res.render("chat", {
        username,
        messages: decryptedMessages,
        chattingWith: target
      });
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("new_message", (data) => {
    const { sender, receiver, message } = data;
    const timestamp = new Date().toISOString();

    db.run(
      "INSERT INTO messages (sender, receiver, message, timestamp) VALUES (?, ?, ?, ?)",
      [sender, receiver || null, message, timestamp],
      (err) => {
        if (err) return console.error(err);
        if (receiver) {
          io.to(receiver).emit("new_message", { sender, receiver, message, timestamp });
        } else {
          io.emit("new_message", { sender, message, timestamp });
        }
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
