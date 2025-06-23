function register() {
  const userName = document.getElementById("username").value.trim();

  if (userName === "") {
    alert("Bitte gib einen Benutzernamen ein.");
    return;
  }

  registerUser(userName)
    .then(() => {
      const target = userName === "admin1" ? "/admin" : "/";
      if (window.location.pathname !== target) {
        window.location.href = target;
      }
    })
    .catch((error) => {
      console.error("Fehler beim Registrieren des Benutzers:", error);
      alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
    });
}

async function registerUser(name) {
  const response = await fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  const user = await response.json();
  userData = {
    name: user.name,
    id: user.id,
    score: user.score,
    coins: user.coins,
    skins: user.skins,
    selectedSkin: user.selectedSkin,
  };

  setCookies(JSON.stringify(userData), 7);
  return user;
}
