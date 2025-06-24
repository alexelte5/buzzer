window.addEventListener("DOMContentLoaded", async () => {
  getRandom();
  applySkin();
});

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

let skin;
let random;

function getRandom() {
  random = Math.floor(Math.random() * 3);
}

// Buzzer
async function applySkin() {
  const buzzer = document.getElementById("buzzer");

  const data = await getCookies();
  const parsed = JSON.parse(data);
  const skinId = parsed.selectedSkin;
  skin = shopItems.find((s) => s.id === skinId);

  if (skinId != "") {
    if (skin.id == "DJ-Khaled") {
      await createImg();
      document.getElementById("buzzer-img").src = skin.img[0];
      document.getElementById("buzzer-sound").src = skin.sound[random];
    } else if (skin) {
      await createImg()
      document.getElementById("buzzer-img").src = skin.img[0];
      document.getElementById("buzzer-sound").src = skin.sound;
    }
  } else {
    buzzer.innerText = "Buzz";
  }
}

//TODO: Buzzern für buzzer ohne img fixen
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

  getRandom();
  await applySkin();
  socket.emit("buzz", { name: username, id });
  document.getElementById("buzzer-img").src = skin.img[1];
  document.getElementById("buzzer-sound").play();

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
    document.getElementById("buzzer-img").src = skin.img[0];
  } else {
    buzzer.classList.add("disabled");
    buzzer.removeEventListener("click", buzz);
    document.getElementById("buzzer-img").src = skin.img[1];
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
function openDialog(dialog) {
  document.getElementById(dialog).showModal();
}

function closeDialog(dialog) {
  document.getElementById(dialog).close();
}

async function openGame() {
  const container = document.getElementById("game-dialog-container");

  // Nur beim ersten Mal ladeny
  if (!document.getElementById("game-dialog")) {
    const response = await fetch("../dialogs/game.html");
    const html = await response.text();
    container.innerHTML = html;
  }

  document.getElementById("game-dialog").showModal();
}

async function openShop() {
  const container = document.getElementById("shop-dialog-container");

  // Nur beim ersten Mal ladeny
  if (!document.getElementById("shop-dialog")) {
    const response = await fetch("../dialogs/shop.html");
    const html = await response.text();
    container.innerHTML = html;
  }

  document.getElementById("shop-dialog").showModal();
  loadItems();
}

async function createImg() {
  const image = document.createElement("img");
  image.id = "buzzer-img";
  image.width = 100;
  image.alt = "Buzzer";
  image.classList.add("buzzer-img");

  document.getElementById("buzzer").appendChild(image);
}
