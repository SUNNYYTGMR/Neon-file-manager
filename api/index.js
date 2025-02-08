const express = require("express");
const multer = require("multer");
const { Pool } = require("pg");
const basicAuth = require("basic-auth");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(express.static("public"));

// ✅ PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ Create Table if Not Exists
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT NOW()
    );
  `);
})();

// ✅ Password Protection (5588)
const auth = (req, res, next) => {
  const user = basicAuth(req);
  if (!user || user.pass !== "5588") {
    res.set("WWW-Authenticate", 'Basic realm="Protected"');
    return res.status(401).send("Access Denied");
  }
  next();
};

// ✅ File Upload System (Multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ✅ Ensure Uploads Folder Exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ✅ Upload API
app.post("/upload", auth, upload.single("file"), async (req, res) => {
  const { filename, mimetype, path: filepath } = req.file;
  await pool.query("INSERT INTO files (filename, filepath, mimetype) VALUES ($1, $2, $3)", [
    filename,
    filepath,
    mimetype,
  ]);
  res.json({ success: true, message: "File uploaded successfully!", filename });
});

// ✅ List Files API
app.get("/files", auth, async (req, res) => {
  const { rows } = await pool.query("SELECT id, filename, mimetype FROM files ORDER BY uploaded_at DESC");
  res.json(rows);
});

// ✅ Download API
app.get("/download/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query("SELECT * FROM files WHERE id = $1", [id]);
  if (rows.length === 0) return res.status(404).send("File not found!");
  res.download(rows[0].filepath, rows[0].filename);
});

// ✅ Preview API
app.get("/preview/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query("SELECT * FROM files WHERE id = $1", [id]);
  if (rows.length === 0) return res.status(404).send("File not found!");
  res.sendFile(path.resolve(rows[0].filepath));
});

// ✅ Start Server (Only for Local Testing)
const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
}

module.exports = app;
