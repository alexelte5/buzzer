const dns = require('node:dns');
const os = require('node:os');

const express = require("express");
const path = require("path");
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

let users = [];
let buzzerEnabled = false;
let buzzed = [];
let enable_time = 0;

// IP-Adresse des Servers ermitteln
function getIP() {
    return new Promise((resolve, reject) => {
        dns.lookup(os.hostname(), {family: 4}, (err, addr) => {
            if (err) {
                reject(err);
            } else {
                resolve(addr);
            }
        });
    });
};

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

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

app.post("/register", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).send("Name ist erforderlich");
    const user = { id: Date.now().toString(), name };
    users.push(user);
    res.json(user);
    console.log(`Neuer Benutzer registriert: ${name}`);
    console.log(`Aktuelle Benutzer: ${users.map(u => u.name).join(", ")}`);
    io.emit('updateUsers', users);
});

app.post("/disconnect", (req, res) => {
    const { name, id } = req.body;
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
        users.splice(index, 1);
    }
    res.json({ success: true });
    console.log(`Benutzer ${name} hat sich abgemeldet.`);
    console.log(`Aktuelle Benutzer: ${users.map(u => u.name).join(", ")}`);
    io.emit('updateUsers', users);
});

io.on('connection', (socket) => {
  socket.emit('buzzerStatus', buzzerEnabled);
  socket.emit('updateUsers', users);
  socket.emit('updateBuzzed', buzzed);

  socket.on('setBuzzer', (status) => {
    buzzerEnabled = status;
    socket.broadcast.emit('buzzerStatus', buzzerEnabled);

    if (status == true) {
        enable_time = Date.now();
    } else {
        buzzed = [];
        io.emit('updateBuzzed', buzzed);
    }
  });

  socket.on('buzz', name => {
    buzzed.push({name: name, time: (Date.now() - enable_time) / 1000});
    io.emit('updateBuzzed', buzzed);
  });
});

// Server starten
startServer();
async function startServer() {
    const IP = await getIP();
    if (IP) {
        server.listen(PORT, IP, () => {
            console.log(`🚀 Server läuft unter http://${IP}:${PORT}`);
        });
    } else {
        console.error("Fehler beim Ermitteln der IP-Adresse.");
    }
};