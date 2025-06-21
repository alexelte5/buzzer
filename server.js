const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, "public")));

// Login-Seite
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/game", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Server läuft unter http://localhost:${PORT}`);
});
