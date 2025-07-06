const { exec } = require("child_process");
const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 5002;

let users = [];
let buzzerEnabled = false;
let buzzed = [];
let enable_time = 0;
const rtbGamestate = {};

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "./pages/login.html"));
});

app.get("/admin", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "./pages/admin.html"));
});

app.get("/admin/users", (req, res) => {
	const filteredUsers = users.map((user) => ({
		name: user.name,
		score: user.score,
	}));
	res.json(filteredUsers);
});

app.post("/deploy", (req, res) => {
	const data = req.body;
	if (data && data.ref === "refs/heads/main") {
		exec('pkill -f "node server.js"', (error, stdout, stderr) => {
			if (error) {
				console.error(`Fehler beim Beenden: ${error.message}`);
				return;
			}
			if (stderr) {
				console.error(`Fehlerausgabe: ${stderr}`);
				return;
			}
			console.log(`Beendet: ${stdout}`);
		});
		return res.status(200).send("Deploy started");
	}
	return res.status(400).send("No main branch push");
});

app.post("/register", (req, res) => {
	const { name } = req.body;
	if (!name) return res.status(400).send("Name ist erforderlich");

	const user = {
		id: Date.now().toString(),
		name,
		score: 0,
		chips: 1000,
		skins: [],
		selectedSkin: "",
	};
	res.json(user);
	if (name === "admin1") {
		return;
	}

	users.push(user);
	io.emit("updateUsers", users);
});

app.post("/disconnect", (req, res) => {
	const { name, id } = req.body;
	const index = users.findIndex((u) => u.id === id);
	if (index !== -1) {
		users.splice(index, 1);
	} else {
	}
	res.json({ success: true });
	io.emit("updateUsers", users);
});

app.post("/admin/reset-score", (req, res) => {
	users.forEach((user) => {
		user.score = 0;
	});

	io.emit("updateUsers", users);
	res.send({ success: true });
});

app.post("/admin/exportCSV", (req, res) => {
	const headers = ["name", "score"];
	const rows = users.map((user) =>
		headers.map((key) => JSON.stringify(user[key] ?? "")).join(",")
	);
	const csvContent = [headers.join(","), ...rows].join("\n");

	res.setHeader("Content-Type", "text/csv");
	res.setHeader("Content-Disposition", "attachment; filename=users.csv");
	res.send(csvContent);
});

io.on("connection", (socket) => {
	socket.emit("buzzerStatus", buzzerEnabled);
	socket.emit("updateUsers", users);
	socket.emit("updateBuzzed", buzzed);

	socket.on("setBuzzer", (status) => {
		buzzerEnabled = status;
		socket.broadcast.emit("buzzerStatus", buzzerEnabled);

		if (status == true) {
			enable_time = Date.now();
		} else {
			buzzed = [];
			io.emit("updateBuzzed", buzzed);
		}
	});

	socket.on("buzz", ({ id, name }) => {
		const alreadyBuzzed = buzzed.find((b) => b.id === id);
		if (alreadyBuzzed) {
			socket.emit("buzzRejected", "Du hast bereits gebuzzert!");
			return;
		}

		const buzzTime = (Date.now() - enable_time) / 1000;

		buzzed.push({ id, name, time: buzzTime });
		io.emit("updateBuzzed", buzzed);
	});

	socket.on("register", (userData) => {
		if (!users.some((u) => u.id === userData.id)) {
			users.push(userData);
			socket.emit("buzzerStatus", buzzerEnabled);
			io.emit("updateUsers", users);
		}
	});

	socket.on("manualDisconnect", (userData) => {
		const index = users.findIndex((u) => u.id === userData.id);
		if (index !== -1) {
			users.splice(index, 1);
			io.emit("updateUsers", users);
		}
	});

	socket.on("updatePoints", (userData) => {
		const user = users.find((u) => u.id === userData.id);
		if (user) {
			user.score = userData.score;
			io.emit("updateUsers", users);
		}
	});

	socket.on("skin-purchase", ({ skin, user }) => {
		if (!user) {
			socket.emit("buy-error", "User nicht gefunden");
			return;
		}
		const serverUser = users.find((u) => u.id === user.id);
		if (!serverUser) {
			socket.emit("buy-error", "User nicht gefunden");
			return;
		}
		if (serverUser.skins.includes(skin.id)) {
			socket.emit("buy-error", "Skin bereits gekauft");
			return;
		}
		if (serverUser.chips < skin.price) {
			socket.emit("buy-error", "Nicht genügend Chips");
			return;
		}

		serverUser.chips -= skin.price;
		serverUser.skins.push(skin.id);
		serverUser.selectedSkin = skin.id;

		socket.emit("buy-success", {
			skins: serverUser.skins,
			chips: serverUser.chips,
			selectedSkin: serverUser.selectedSkin,
		});
		socket.emit("buzzerStatus", buzzerEnabled);
		io.emit("updateUsers", users);
	});

	socket.on("skin-change", ({ skin, user }) => {
		if (!user) {
			socket.emit("buy-error", "User nicht gefunden");
			return;
		}
		const serverUser = users.find((u) => u.id === user.id);
		if (!serverUser) {
			socket.emit("buy-error", "User nicht gefunden");
			return;
		}
		if (serverUser.selectedSkin == skin.id) {
			socket.emit("buy-error", "Skin bereits ausgewählt");
			return;
		}

		serverUser.selectedSkin = skin.id;
		socket.emit("buzzerStatus", buzzerEnabled);
		socket.emit("skin-change-success", {
			selectedSkin: serverUser.selectedSkin,
		});
		io.emit("updateUsers", users);
	});

	socket.on("remove-skin", (user) => {
		if (!user) {
			socket.emit("buy-error", "User nicht gefunden");
			return;
		}
		const serverUser = users.find((u) => u.id === user.id);
		if (!serverUser) {
			socket.emit("buy-error", "User nicht gefunden");
			return;
		}
		if (serverUser.selectedSkin == "") {
			socket.emit("buy-error", "Skin bereits ausgewählt");
			return;
		}

		serverUser.selectedSkin = "";
		socket.emit("buzzerStatus", buzzerEnabled);
		socket.emit("skin-change-success", {
			selectedSkin: serverUser.selectedSkin,
		});
		io.emit("updateUsers", users);
	});

	socket.on("coinflip", ({ guess, stake, user }) => {
		// User validieren
		if (!user || !user.id) {
			socket.emit("coinflip-finish", { error: "User nicht gefunden." });
			return;
		}
		const serverUser = users.find((u) => u.id === user.id);
		if (!serverUser) {
			socket.emit("coinflip-finish", { error: "User nicht gefunden." });
			return;
		}

		// Einsatz prüfen
		if (!stake || stake <= 0) {
			socket.emit("coinflip-finish", { error: "Ungültiger Einsatz." });
			return;
		}
		if (serverUser.chips < stake) {
			socket.emit("coinflip-finish", { error: "Nicht genügend Chips." });
			return;
		}

		// Einsatz abziehen
		serverUser.chips -= stake;

		// Ergebnis berechnen
		const outcome = Math.random() < 0.5 ? "heads" : "tails";
		let win = false;
		let payout = 0;

		if (guess === outcome) {
			win = true;
			payout = stake * 2;
			serverUser.chips += payout;
		}

		// Ergebnis an Client schicken
		socket.emit("coinflip-finish", {
			outcome,
			win,
			payout: win ? payout : 0,
			chips: serverUser.chips,
		});

		// Chips für alle aktualisieren
		io.emit("updateUsers", users);
	});

	socket.on("numberguesser", ({ user, mode, guess, stake }) => {
		if (!user || !user.id) {
			socket.emit("numberguesser-finish", {
				error: "User nicht gefunden.",
			});
			return;
		}
		const serverUser = users.find((u) => u.id === user.id);
		if (!serverUser) {
			socket.emit("numberguesser-finish", {
				error: "User nicht gefunden.",
			});
			return;
		}
		if (stake <= 0) {
			socket.emit("numberguesser-finish", {
				error: "Ungültiger Einsatz",
			});
			return;
		}
		if (user.chips < stake) {
			socket.emit("numberguesser-finish", { error: "Nicht genug Chips" });
			return;
		}
		if (guess >= mode || guess <= 0) {
			socket.emit("numberguesser-finish", { error: "Ungültiger Guess" });
			return;
		}

		serverUser.chips -= stake;

		const num = Math.floor(Math.random() * mode) + 1;
		let win = false;
		let payout = 0;

		if (guess === num) {
			win = true;
			payout = stake * mode;
			serverUser.chips += payout;
		}

		socket.emit("numberguesser-finish", {
			num,
			win,
			payout: win ? payout : 0,
			chips: serverUser.chips,
			stake,
		});

		io.emit("updateUsers", users);
	});

	socket.on("rtb", ({ user, option, stake }) => {
		if (!user || !user.id) {
			socket.emit("rtb-finish", {
				error: "User nicht gefunden.",
			});
			return;
		}
		const serverUser = users.find((u) => u.id === user.id);
		if (!serverUser) {
			socket.emit("rtb-finish", {
				error: "User nicht gefunden.",
			});
			return;
		}
		if (stake <= 0) {
			socket.emit("rtb-finish", {
				error: "Ungültiger Einsatz",
			});
			return;
		}
		if (user.chips < stake) {
			socket.emit("rtb-finish", { error: "Nicht genug Chips" });
			return;
		}

		if (!rtbGamestate[user]) {
			rtbGamestate[user] = {
				usedCards: [],
				phase: 1,
			};
		}

		serverUser.chips -= stake;
		let win = false;
		let payout = 0;

		const card = drawCard(rtbGamestate[user].usedCards);
		const color = getCardColor(card);
		if(color === option) {
			win = true;
			payout = stake * 2;
		}

		socket.emit("rtb-finish", ({
			win,
			payout,
			card
		}))

		socket.on("rtb2", (option) => {});

		socket.on("rtb3", (option) => {});

		socket.on("rtb4", (option) => {});

		socket.on("rtb-cancel", () => {

			delete rtbGamestate[user];
		});

		function drawCard(usedCards) {
			let card;
			do {
				card = Math.floor(Math.random() * 52);
			} while (usedCards.includes(card));
			usedCards.push(card);
			return card;
		}

		function getCardValue(index) {
			return index / 4 + 2;
		}

		function getCardColor(index) {
			return index % 4 < 2 ? "schwarz" : "rot";
		}

		function getCardSuit(index) {
			const card = index % 4;
			switch (card) {
				case 1:
					return "club";
				case 2:
					return "diamond";
				case 3:
					return "heart";
				case 0:
					return "spade";
				default:
					return "error";
			}
		}
	});
});

// Server starten
startServer();
async function startServer() {
	const IP = '0.0.0.0';
	try {
		server.listen(PORT, IP)
	} catch (err) {
		console.error("Error: ", err)
	}
}
