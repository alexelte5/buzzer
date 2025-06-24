const socket = io();

let userData = {
  name: "",
  id: "",
  score: 0,
  chips: 0,
  skins: [],
  selectedSkin: "",
};

// richtige höhe des Viewports setzen
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

window.addEventListener("resize", setViewportHeight);
setViewportHeight();

// Cookies
async function setCookies(value, days) {
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toUTCString();
  document.cookie = `data=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/`;
}

async function getCookies() {
  const values = document.cookie
    .split("; ")
    .find((row) => row.startsWith("data="));
  return values ? decodeURIComponent(values.split("=")[1]) : null;
}

async function deleteCookies() {
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

  const deleted = await setCookies("", -1);
  window.location.href = "/login";
}

socket.on("updateUsers", async (users) => {
  // wo users.id == cookie.userid -> score updaten
  const data = await getCookies();
  if (!data) return;
  const cookieData = JSON.parse(data);
  const user = users.find((u) => u.id === cookieData.id);
  if (user) {
    cookieData.score = user.score;
    cookieData.chips = user.chips;
    cookieData.skins = user.skins;
    cookieData.selectedSkin = user.selectedSkin;
    await setCookies(JSON.stringify(cookieData), 7);
  }
})

// Navigation
async function navigation() {
  const data = await getCookies();
  if (!data) {
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    return;
  }

  let userData;
  try {
    userData = JSON.parse(data);
  } catch (error) {
    console.error("Fehler beim Parsen der Cookies:", error);
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    return;
  }

  const userName = userData.name;

  if (!userName && window.location.pathname !== "/login") {
    window.location.href = "/login";
    return;
  }

  if (userName === "admin1" && window.location.pathname !== "/admin") {
    window.location.href = "/admin";
    return;
  }

  if (userName !== "admin1" && window.location.pathname !== "/") {
    window.location.href = "/";
    return;
  }
}

socket.on("connect", async () => {
  await navigation();

  const cookieData = await getCookies();
  if (!cookieData) return;

  userData = JSON.parse(cookieData);

  // Nur registrieren, wenn kein admin
  if (userData.name !== "admin1") {
    socket.emit("register", userData);
  }
});


// toast
function showToast(el) {
  const toast = document.getElementById(el);
  toast.classList.remove("hide");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
  }, 3000);
}