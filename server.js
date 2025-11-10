import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// API Upstash Redis
const REDIS_URL = "https://legible-donkey-35775.upstash.io";
const TOKEN = "AYu_AAIncDJhYzlmYmY5ZTk0ZmY0ZThhYjM4YTQwMmNkZDNhODYxZHAyMzU3NzU";

// Tambah akun ke dalam array di key "akun"
app.post("/api/akun", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, error: "Username & password wajib diisi" });

  try {
    // 1️⃣ Ambil data akun lama
    const getRes = await fetch(`${REDIS_URL}/get/akun`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const getData = await getRes.json();

    let akunList = [];
    if (getData.result) {
      try {
        akunList = JSON.parse(getData.result);
      } catch {
        akunList = [];
      }
    }

    // 2️⃣ Tambahkan akun baru ke array
    akunList.push({ username, password });

    // 3️⃣ Simpan ulang ke Redis
    const setRes = await fetch(`${REDIS_URL}/set/akun`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(JSON.stringify(akunList)), // dua kali stringify
    });

    const setData = await setRes.json();
    res.json({ success: true, result: setData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Gagal menyimpan ke Redis" });
  }
});

app.get("/", (req, res) => {
  res.send("Redis Account API aktif 🚀");
});

app.listen(3000, () => console.log("Server running on port 3000"));
