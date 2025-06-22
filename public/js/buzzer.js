// Remove user when disconnecting
window.addEventListener("beforeunload", async () => {
  const data = await getCookies();
  if (!data) return;

  const userData = JSON.parse(data);

  const payload = JSON.stringify({
    name: userData.name,
    id: userData.id,
  });

  navigator.sendBeacon(
    "/disconnect",
    new Blob([payload], {
      type: "application/json",
    })
  );
});

// Buzzer
async function buzz() {
  const data = await getCookies();
  const parsed = JSON.parse(data);
  const username = parsed.name;
  const id = parsed.id;

  const buzzer = document.getElementById("buzzer");

  if (!username || !id) {
    alert("Bitte melde dich an, um den Buzzer zu benutzen.");
    return;
  }

  socket.emit("buzz", { name: username, id });

  buzzer.removeEventListener("click", buzz);
  buzzer.disabled = true;
  buzzer.classList.add("disabled");
}

socket.on("buzzerStatus", (enabled) => {
  const buzzer = document.getElementById("buzzer");
  if (!buzzer) {
    return;
  }
  buzzer.disabled = !enabled;
  if (enabled) {
    buzzer.classList.remove("disabled");
    buzzer.addEventListener("click", buzz);
  } else {
    buzzer.classList.add("disabled");
    buzzer.removeEventListener("click", buzz);
  }
});

socket.on("buzzRejected", (message) => {
  alert(message);
  const buzzer = document.getElementById("buzzer");
  if (buzzer) {
    buzzer.disabled = true;
    buzzer.classList.add("disabled");
  }
});

// Dialogs
async function openCasino() {
  const container = document.getElementById("casino-dialog-container");

  // Nur beim ersten Mal ladeny
  if (!document.getElementById("casino-dialog")) {
    const response = await fetch("/casino.html"); // Pfad zur ausgelagerten Datei
    const html = await response.text();
    container.innerHTML = html;
  }

  document.getElementById("casino-dialog").showModal();
}

async function openShop() {
  const container = document.getElementById("shop-dialog-container");

  // Nur beim ersten Mal ladeny
  if (!document.getElementById("shop-dialog")) {
    const response = await fetch("/shop.html"); // Pfad zur ausgelagerten Datei
    const html = await response.text();
    container.innerHTML = html;
  }

  document.getElementById("shop-dialog").showModal();
}
