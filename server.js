import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// =============================
// KONFIGURASI UPSTASH REDIS
// =============================
const REDIS_URL = "https://legible-donkey-35775.upstash.io";
const TOKEN = "AYu_AAIncDJhYzlmYmY5ZTk0ZmY0ZThhYjM4YTQwMmNkZDNhODYxZHAyMzU3NzU";

// =============================
// ENDPOINT: Tambah akun baru
// =============================
app.post("/api/akun", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, error: "Username & password wajib diisi" });

  try {
    // 1️⃣ Ambil data lama dari Redis
    const getRes = await fetch(`${REDIS_URL}/get/akun`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const getData = await getRes.json();

    let akunList = [];

    if (getData.result) {
      try {
        // Kadang tersimpan double string, jadi parse dua kali
        let parsed = JSON.parse(getData.result);
        if (typeof parsed === "string") {
          parsed = JSON.parse(parsed);
        }
        akunList = Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        akunList = [];
      }
    }

    // 2️⃣ Tambahkan akun baru
    akunList.push({ username, password });

    // 3️⃣ Simpan ulang ke Redis (1x stringify saja)
    const setRes = await fetch(`${REDIS_URL}/set/akun`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(JSON.stringify(akunList)),
    });

    const setData = await setRes.json();

    if (setRes.ok) {
      res.json({ success: true, result: setData });
    } else {
      res.status(500).json({ success: false, error: "Redis error", detail: setData });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Gagal menyimpan ke Redis" });
  }
});

// =============================
// ENDPOINT: Cek semua akun
// =============================
app.get("/api/akun", async (req, res) => {
  try {
    const response = await fetch(`${REDIS_URL}/get/akun`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const data = await response.json();

    if (!data.result) return res.json({ success: true, akun: [] });

    let akunList;
    try {
      akunList = JSON.parse(data.result);
      if (typeof akunList === "string") akunList = JSON.parse(akunList);
    } catch {
      akunList = [];
    }

    res.json({ success: true, akun: akunList });
  } catch (err) {
    res.status(500).json({ success: false, error: "Gagal mengambil data Redis" });
  }
});

// =============================
// ENDPOINT UTAMA
// =============================
app.get("/", (req, res) => {
  res.send("🚀 Redis Account API aktif!");
});

app.listen(3000, () => console.log("Server running on port 3000"));
