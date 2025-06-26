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
});

socket.on("remove-skin-success", async (data) => {
  const cookie = await getCookies();
  if (cookie) {
    const parsed = JSON.parse(cookie);
    parsed.selectedSkin = data.selectedSkin
    await setCookies(JSON.stringify(parsed), 7);
  }
  showToast("skin-change")
  loadItems();
  applySkin();
});

async function loadItems() {
  const skinsContainer = document.getElementById("skins");
  const chipsContainer = document.getElementById("player-chips");
  if (!skinsContainer) return;

  const userData = await getCookies();
  const parsed = JSON.parse(userData);
  const allSkins = shopItems;
  const boughtSkins = parsed.skins;
  const appliedSkin = parsed.selectedSkin;
  const chips = parsed.chips;
  const user = parsed;

  chipsContainer.textContent = chips + "¢";
  skinsContainer.innerHTML = "";

  const defaultDiv = document.createElement("div");
  defaultDiv.classList.add("skin");
  const defaultName = document.createElement("h2");
  defaultName.textContent = "Default";
  const defaultButton = document.createElement("button");
  defaultButton.classList.add("img-preview");
  defaultButton.innerText = "Buzz";
  const applyButton = document.createElement("button");
  applyButton.classList.add("buy-button");
  applyButton.textContent = "Auswählen";
  if (appliedSkin != "") {
    applyButton.addEventListener("click", () => removeSkin(user));
  } else if (appliedSkin == "") {
    applyButton.disabled = true;
    applyButton.classList.add("disabled");
  }
  defaultDiv.appendChild(defaultName);
  defaultDiv.appendChild(defaultButton);
  defaultDiv.appendChild(applyButton);
  skinsContainer.appendChild(defaultDiv);

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
    }  else if (skin) {
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

function removeSkin(user) {
  socket.emit("remove-skin", (user));
}