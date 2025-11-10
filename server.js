import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// === KONFIGURASI REDIS ===
const REDIS_URL = "https://legible-donkey-35775.upstash.io";
const REDIS_TOKEN = "Aou_AAIgcDKNU75m5VspbhA1h8YoxUe90Wlt_HFQ_kQn1Q2E3u9v4g";
const MAIN_KEY = "akun"; // semua akun disimpan di bawah key ini

// ✅ GET semua akun
app.get("/api/akun", async (req, res) => {
  try {
    const r = await fetch(`${REDIS_URL}/get/${MAIN_KEY}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const data = await r.json();
    if (!data.result) return res.json({});
    return res.json(JSON.parse(data.result));
  } catch (err) {
    console.error(err);
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
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
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

    // Jika username sudah ada
    if (akunData[username]) {
      return res.status(409).json({ error: "Pengguna sudah terdaftar" });
    }

    // Tambah akun baru
    akunData[username] = { username, password };

    // Simpan kembali ke Redis
    const saveRes = await fetch(`${REDIS_URL}/set`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([MAIN_KEY, JSON.stringify(akunData)]),
    });

    if (saveRes.ok) {
      return res.json({ success: true, message: "Akun berhasil disimpan" });
    } else {
      return res.status(500).json({ error: "Gagal menyimpan ke Redis" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Kesalahan server" });
  }
});

// ✅ Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server berjalan di port ${PORT}`));
