import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// === Konfigurasi Upstash Redis ===
const REDIS_URL = "https://legible-donkey-35775.upstash.io";
const REDIS_TOKEN = "Bearer AYu_AAIncDJhYzlmYmY5ZTk0ZmY0ZThhYjM4YTQwMmNkZDNhODYxZHAyMzU3NzU";
const MAIN_KEY = "akun"; // semua data pengguna disimpan di sini

// ✅ GET semua akun
app.get("/api/akun", async (req, res) => {
  try {
    const r = await fetch(`${REDIS_URL}/get/${MAIN_KEY}`, {
      headers: { Authorization: REDIS_TOKEN },
    });
    const data = await r.json();

    if (!data.result) return res.json({});
    return res.json(JSON.parse(data.result));
  } catch (err) {
    console.error("❌ Error GET:", err);
    return res.status(500).json({ error: "Gagal mengambil data dari Redis" });
  }
});

// ✅ POST buat akun baru
app.post("/api/akun", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username dan password wajib diisi" });

    // Ambil data lama
    const getRes = await fetch(`${REDIS_URL}/get/${MAIN_KEY}`, {
      headers: { Authorization: REDIS_TOKEN },
    });
    const getData = await getRes.json();

    let akunData = {};
    if (getData.result) {
      try {
        akunData = JSON.parse(getData.result);
      } catch {
        akunData = {};
      }
    }

    if (akunData[username]) {
      return res.status(409).json({ error: "Pengguna sudah terdaftar" });
    }

    akunData[username] = { username, password };

    // Simpan kembali ke Redis (pakai format body: string JSON)
    const saveRes = await fetch(`${REDIS_URL}/set/${MAIN_KEY}`, {
      method: "POST",
      headers: {
        Authorization: REDIS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(JSON.stringify(akunData)), // <- string di dalam string
    });

    const text = await saveRes.text();

    if (saveRes.ok) {
      return res.json({ success: true, message: "Akun berhasil disimpan" });
    } else {
      console.error("Redis Response:", text);
      return res.status(500).json({ error: "Gagal menyimpan ke Redis", detail: text });
    }
  } catch (err) {
    console.error("❌ Error POST:", err);
    return res.status(500).json({ error: "Kesalahan server" });
  }
});

export default app;
