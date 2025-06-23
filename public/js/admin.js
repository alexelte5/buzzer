socket.on("updateUsers", (users) => {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";
  users.forEach((user) => {
    const userButton = document.createElement("button");
    userButton.onclick = () => openPoints(user);
    userButton.className = "user-item";
    userButton.textContent = user.name + ": " + user.score;
    userList.appendChild(userButton);
  });
});

socket.on("updateBuzzed", (buzzed) => {
  const buzzedList = document.getElementById("buzzList");
  buzzedList.innerHTML = "";
  buzzed.forEach((buzz) => {
    const p = document.createElement("p");
    p.className = "buzzed-item";
    p.textContent = `${buzz.name} - ${buzz.time}s`;
    buzzedList.appendChild(p);
  });
});

function openQRModal() {
  const url = `${location.origin}/`;
  const container = document.getElementById("qrcode");
  container.innerHTML = ""; // Clear previous QR

  // QR-Code erzeugen
  QRCode.toCanvas(url, { width: 256 }, function (err, canvas) {
    if (err) {
      console.error(err);
      container.innerText = "Fehler beim Generieren des QR-Codes.";
    } else {
      container.appendChild(canvas);
    }
  });

  document.getElementById("modal-content").classList.remove("hide");
  document.getElementById("openQR").classList.add("hide");
  document.getElementById("closeQR").classList.remove("hide");
}

function closeQRModal() {
  document.getElementById("modal-content").classList.add("hide");
  document.getElementById("openQR").classList.remove("hide");
  document.getElementById("closeQR").classList.add("hide");
}

function enableBuzzer() {
  socket.emit("setBuzzer", true);

  document.getElementById("enableBuzzer").classList.add("hide");
  document.getElementById("disableBuzzer").classList.remove("hide");
}

function disableBuzzer() {
  socket.emit("setBuzzer", false);

  document.getElementById("enableBuzzer").classList.remove("hide");
  document.getElementById("disableBuzzer").classList.add("hide");
}

async function openPoints(user) {
  const points = user.score;
  const userName = user.name;
  const container = document.getElementById("points-dialog-container");

  // Nur beim ersten Mal laden
  if (!document.getElementById("points-dialog")) {
    const response = await fetch("../dialogs/points.html");
    const html = await response.text();
    container.innerHTML = html;
  }

  // Jetzt existiert der Dialog + Wrapper im DOM
  const wrapper = document.getElementById("user-detail");
  wrapper.innerHTML = "";

  const userElement = document.createElement("h2");

  const nameSpan = document.createElement("span");
  nameSpan.id = "username-display";
  nameSpan.textContent = userName;

  const formatSpan = document.createElement("span");
  formatSpan.textContent = ": ";

  const pointsSpan = document.createElement("span");
  pointsSpan.id = "userpoints-display";
  pointsSpan.textContent = points;

  userElement.appendChild(nameSpan);
  userElement.appendChild(formatSpan);
  userElement.appendChild(pointsSpan);
  wrapper.appendChild(userElement);

  userData = {
    name: userName,
    id: user.id,
    score: points,
  };

  document.getElementById("points-dialog").showModal();
}

async function editPoints() {
  const currentPoints =
    document.getElementById("userpoints-display").textContent;
  const pointsInput = document.getElementById("points-input").value.trim();
  const points = parseInt(currentPoints, 10) + parseInt(pointsInput, 10);

  socket.emit("updatePoints", {
    name: userData.name,
    id: userData.id,
    score: points,
  });
  document.getElementById("points-input").value = "";
  document.getElementById("points-dialog").close();
}
function openSettings() {
  document.getElementById("settings-dialog").showModal();
}

function closeSettings() {
  document.getElementById("settings-dialog").close();
  cancelReset();
}

// in server.js auslagern
async function exportCSV() {
  const response = await fetch("/admin/exportCSV", {
    method: "POST",
  });
  const csvData = await response.text();

  const blob = new Blob([csvData], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toLocaleDateString("de-DE").replace(/\//g, "-");

  const a = document.createElement("a");
  a.href = url;
  a.download = "Punktestand_" + date + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function askReset() {
  document.getElementById("reset-button").classList.add("hide");
  document.getElementById("confirm-reset").classList.remove("hide");
  document.getElementById("cancel-reset").classList.remove("hide");
}

function cancelReset() {
  document.getElementById("reset-button").classList.remove("hide");
  document.getElementById("confirm-reset").classList.add("hide");
  document.getElementById("cancel-reset").classList.add("hide");
}

async function resetScore() {
  const response = await fetch("/admin/reset-score", { method: "POST" });
  const result = await response.json();
  if (result.success) {
    showToast("score-reset-toast");

    document.getElementById("reset-button").classList.remove("hide");
    document.getElementById("confirm-reset").classList.add("hide");
    document.getElementById("cancel-reset").classList.add("hide");
  } else {
    console.error("Fehler beim zurücksetzen des Punktestandes");
  }
}
