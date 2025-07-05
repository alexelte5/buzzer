// Spieleideen:
// 1. Coinflip
// 2. Zahl raten -> 1:5, 1:10, 1:100
// 3. Ride the bus
// 4. Plane crash

socket.on("coinflip-finish", async (data) => {
	const resultDiv = document.getElementById("coinflip-result");
	const won = data.payout / 2;

	if (data.error) {
		resultDiv.textContent = data.error;
		return;
	}

	// Anzeige (Kopf oder Zahl)
	document.getElementById("tails").classList.add("hide");
	document.getElementById("tails").classList.remove("red");
	document.getElementById("tails").classList.remove("green");
	document.getElementById("heads").classList.add("hide");
	document.getElementById("heads").classList.remove("red");
	document.getElementById("heads").classList.remove("green");
	if (data.win) {
		document.getElementById(data.outcome).classList.add("green");
	} else {
		document.getElementById(data.outcome).classList.add("red");
	}
	document.getElementById(data.outcome).classList.remove("hide");

	if (data.win) {
		resultDiv.textContent = `Gewonnen! +${won}¢`;
	} else {
		resultDiv.textContent = `Verloren!`;
	}

	// --- HIER: Chips im Cookie direkt aktualisieren ---
	const cookie = await getCookies();
	if (cookie) {
		const parsed = JSON.parse(cookie);
		parsed.chips = data.chips; // vom Server gesendeter Wert!
		await setCookies(JSON.stringify(parsed), 7);
	}

	loadChips("player-chips-coinflip");
});

socket.on("numberguesser-finish", async (data) => {
	const resultDiv = document.getElementById("numberguesser-result");
	const outcome = document.getElementById("number-container");
	const won = data.payout;
	outcome.classList.remove("green");
	outcome.classList.remove("red");

	if(data.error) {
		resultDiv.textContent = data.error;
		return;
	}

	outcome.innerText = data.num;

	if(data.win) {
		resultDiv.textContent = `Gewonnen! +${won}¢`;
		outcome.classList.add("green");
	} else {
		resultDiv.textContent = "Verloren!";
		outcome.classList.add("red");
	}

	const cookie = await getCookies();
	if(cookie) {
		const parsed = JSON.parse(cookie);
		parsed.chips = data.chips;
		await setCookies(JSON.stringify(parsed), 7);
	}

	loadChips("player-chips-numberguesser");
});

async function loadChips(targetId = "player-chips-main") {
	const cookies = await getCookies();
	const chips = JSON.parse(cookies).chips;
	document.getElementById(targetId).textContent = chips + "¢";
}

function openGame(game) {
	document.getElementById("game-selection").classList.add("hide");
	document.getElementById(game).classList.remove("hide");
	loadChips("player-chips-" + game);
}


async function flipCoin() {
	const cookies = await getCookies();
	const user = JSON.parse(cookies);

	const userGuess = document.getElementById("coin-selector").value;
	const userStake = parseInt(document.getElementById("stake-input").value, 10);

	if (userGuess && userStake) {
		const resultDiv = document.getElementById("coinflip-result");
		resultDiv.textContent = "";

		socket.emit("coinflip", { guess: userGuess, stake: userStake, user });
	} else {
		alert("Fehler, überprüf ob alle Felder ausgefüllt sind");
	}
}

async function guessNumber() {
	const cookies = await getCookies();
	const user = JSON.parse(cookies);

	const mode = parseInt(document.getElementById("number-selector").value, 10);
	const guess = parseInt(document.getElementById("number-guess").value, 10);
	const stake = parseInt(document.getElementById("numberguesser-stake").value, 10);

	if (user && mode && guess && stake) {
		const resultDiv = document.getElementById("numberguesser-result");
		const outcome = document.getElementById("number-container");
		resultDiv.textContent = "";
		outcome.innerText = "";

		socket.emit("numberguesser", {user, mode, guess, stake});
	} else {
		alert("Fehler, überprüf ob alle Felder ausgefüllt sind");
	}
}

async function rtb() {
	const cookies = await getCookies();
	const user = JSON.parse(cookies);

	socket.emit("rtb", user);
}