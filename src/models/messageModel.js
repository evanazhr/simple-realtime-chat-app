const db = require('../utils/db');
const CryptoJS = require("crypto-js");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
console.log(ENCRYPTION_KEY)

if (!ENCRYPTION_KEY) {
  console.error("Error: ENCRYPTION_KEY is not defined in environment variables. Please set it.");
}

class MessageModel {
  static createMessage(sender, receiver, message, callback) {
    if (!ENCRYPTION_KEY) {
      console.error("Cannot encrypt message: ENCRYPTION_KEY is missing.");
      return callback(new Error("Encryption key missing."));
    }
    const encryptedMessage = CryptoJS.AES.encrypt(message, ENCRYPTION_KEY).toString();
    const timestamp = new Date().toISOString();
    db.run(
      "INSERT INTO messages (sender, receiver, message, timestamp) VALUES (?, ?, ?, ?)",
      [sender, receiver || null, encryptedMessage, timestamp],
      callback
    );
  }

  static getGlobalMessages(callback) {
    db.all("SELECT * FROM messages WHERE receiver IS NULL ORDER BY timestamp ASC", (err, messages) => {
      if (err) return callback(err);
      const decryptedMessages = messages.map(msg => MessageModel._decryptMessage(msg));
      callback(null, decryptedMessages);
    });
  }

  static getPrivateMessages(user1, user2, callback) {
    db.all(
      `SELECT * FROM messages WHERE
        (sender = ? AND receiver = ?) OR
        (sender = ? AND receiver = ?) ORDER BY timestamp ASC`,
      [user1, user2, user2, user1],
      (err, messages) => {
        if (err) return callback(err);
        const decryptedMessages = messages.map(msg => 
            MessageModel._decryptMessage(msg)
        );
        
        callback(null, decryptedMessages);
      }
    );
  }
  static _decryptMessage(msg) {
    const messageCopy = { ...msg };
    let decryptedContent = "[DECRYPTION FAILED]";

    console.log("--- Dekripsi Pesan ---");
    console.log("Pesan terenkripsi dari DB:", messageCopy.message);
    console.log("Panjang ENCRYPTION_KEY:", ENCRYPTION_KEY ? ENCRYPTION_KEY : 'UNDEFINED');

    try {
        if (!ENCRYPTION_KEY) {
            console.error("Decryption failed: ENCRYPTION_KEY is undefined.");
            messageCopy.message = "[ERROR: NO ENCRYPTION KEY]";
            return messageCopy;
        }
        const bytes = CryptoJS.AES.decrypt(messageCopy.message, ENCRYPTION_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);

        console.log("Hasil bytes.toString(CryptoJS.enc.Utf8):", originalText);

        if (originalText) {
            decryptedContent = originalText;
        } else {
            console.warn("Decryption resulted in empty string for:", messageCopy.message);
            decryptedContent = "[DECRYPTION FAILED - EMPTY]";
        }
    } catch (e) {
        console.error("Decryption error for message:", messageCopy.message, "Error:", e);
        decryptedContent = "[ERROR DECRYPTING MESSAGE]";
    }

    messageCopy.message = decryptedContent;
    console.log("Pesan setelah dekripsi:", messageCopy.message);
    console.log("----------------------");
    return messageCopy;
}
}

module.exports = MessageModel;