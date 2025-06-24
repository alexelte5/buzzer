socket.on("buy-error", (message) => {
  document.getElementById("buy-error-toast").innerText = message;
  showToast("buy-error-toast");
});
socket.on("buy-success", async (data) => {
  // Cookie sofort aktualisieren
  const cookie = await getCookies();
  if (cookie) {
    const parsed = JSON.parse(cookie);
    parsed.skins = data.skins;
    parsed.chips = data.chips;
    parsed.selectedSkin = data.selectedSkin;
    await setCookies(JSON.stringify(parsed), 7);
  }
  showToast("buy-success-toast");
  loadItems();
  applySkin();
});

socket.on("skin-change-success", async (data) => {
  const cookie = await getCookies();
  if (cookie) {
    const parsed = JSON.parse(cookie);
    parsed.selectedSkin = data.selectedSkin
    await setCookies(JSON.stringify(parsed), 7);
  }
  showToast("skin-change")
  loadItems();
  applySkin();
})

async function loadItems() {
  const skinsContainer = document.getElementById("skins");
  const chipsContainer = document.getElementById("player-chips");
  if (!skinsContainer) return; // Abbrechen, wenn das Element nicht existiert

  const userData = await getCookies();
  const parsed = JSON.parse(userData);
  const allSkins = shopItems;
  const boughtSkins = parsed.skins;
  const appliedSkin = parsed.selectedSkin;
  const chips = parsed.chips;
  const user = parsed;

  chipsContainer.textContent = chips + "¢";
  skinsContainer.innerHTML = "";

  allSkins.forEach((skin) => {
    const isBought = boughtSkins.includes(skin.id);
    const isApplied = appliedSkin == skin.id;

    const skinDiv = document.createElement("div");
    skinDiv.classList.add("skin");

    const name = document.createElement("h2");
    name.textContent = skin.name;

    const image = document.createElement("img");
    image.classList.add("img-preview");
    image.src = skin.img[0];

    const price = document.createElement("button");
    price.classList.add("buy-button");
    if (isApplied) {
      price.textContent = "Auswählen";
      price.classList.add("disabled");
      price.disabled = true;
    } else if (isBought) {
      price.textContent = "Auswählen";
      price.addEventListener("click", () => selectSkin(skin, user));
    }  else {
      price.textContent = `${skin.price}¢`;
      price.addEventListener("click", () => buySkin(skin, user));
    }

    skinDiv.appendChild(name);
    skinDiv.appendChild(image);
    skinDiv.appendChild(price);

    skinsContainer.appendChild(skinDiv);
  });
}

function selectSkin(skin, user) {
  socket.emit("skin-change", { skin, user })
}

function buySkin(skin, user) {
  socket.emit("skin-purchase", { skin, user });
}
