socket.on("updateUsers", (users) => {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user.name;
    userList.appendChild(li);
  });
});

socket.on("updateBuzzed", (buzzed) => {
  const buzzedList = document.getElementById("buzzList");
  buzzedList.innerHTML = "";
  buzzed.forEach((buzz) => {
    const li = document.createElement("li");
    li.textContent = `${buzz.name} - ${buzz.time}s`;
    buzzedList.appendChild(li);
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
}

function closeQRModal() {
  document.getElementById("modal-content").classList.add("hide");
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
