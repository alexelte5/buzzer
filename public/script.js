const socket = io();

// function to set height of the viewport
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setViewportHeight);
setViewportHeight();


async function navigate() {
    const username = document.getElementById('username').value;
    
    if (username === 'admin1') {
        window.location.href = '/admin';
    } else if (username) {
        const user = await registerUser(username);
        window.location.href = '/game'; 
    } else {
        alert('Bitte gib einen Benutzernamen ein.');
    }
}

async function registerUser(name) {
    const response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
    });
    const user = await response.json();
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userId", user.id);
    return user;
};

if (window.location.pathname === '/game') {
    window.addEventListener('beforeunload', () => {
        const payload = JSON.stringify({
            name: localStorage.getItem("userName"),
            id: localStorage.getItem("userId")
        });

        navigator.sendBeacon('/disconnect', new Blob([payload], { type: 'application/json' }));

        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
    });
};

if (window.location.pathname === '/admin') {
    socket.on('updateUsers', (users) => {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    users.forEach(user => {
      const li = document.createElement('li');
      li.textContent = user.name;
      userList.appendChild(li);
    });
  });

  socket.on('updateBuzzed', (buzzed) => {
    const buzzedList = document.getElementById('buzzList');
    buzzedList.innerHTML = '';
    buzzed.forEach(buzz => {
      const li = document.createElement('li');
      li.textContent = `${buzz.name} - ${buzz.time}s`;
      buzzedList.appendChild(li);
    });
  });   
};

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

  document.getElementById("qrModal").classList.add("show");
}

function closeQRModal() {
  document.getElementById("qrModal").classList.remove("show");
}

function enableBuzzer() {
    socket.emit("setBuzzer", true);

    document.getElementById("enableBuzzer").classList.add("hide");
    document.getElementById("disableBuzzer").classList.remove("hide");
};

function disableBuzzer() {
    socket.emit("setBuzzer", false);

    document.getElementById("enableBuzzer").classList.remove("hide");
    document.getElementById("disableBuzzer").classList.add("hide");
}

function buzz() {
    const username = localStorage.getItem("userName");
    const buzzer = document.getElementById('buzzer');
    if (username) {
        socket.emit('buzz', username);
        buzzer.removeEventListener('click', buzz);
        buzzer.disabled = true;
        buzzer.classList.add('disabled');
    } else {
        alert('Bitte melde dich an, um den Buzzer zu benutzen.');
        return;
    }
}

socket.on('buzzerStatus', (enabled) => {
  const buzzer = document.getElementById('buzzer');
  if (!buzzer) {
    console.warn('Buzzer Button nicht gefunden!');
    return;
  }
  buzzer.disabled = !enabled;
  if (enabled) {
    buzzer.classList.remove('disabled');
    buzzer.addEventListener('click', buzz);
  } else {
    buzzer.classList.add('disabled');
    buzzer.removeEventListener('click', buzz);
  }
});

async function openCasino() {
    const container = document.getElementById('casino-dialog-container');

    // Nur beim ersten Mal ladeny
    if (!document.getElementById('casino-dialog')) {
        const response = await fetch('/casino.html'); // Pfad zur ausgelagerten Datei
        const html = await response.text();
        container.innerHTML = html;
    }

    document.getElementById('casino-dialog').showModal();
}

async function openShop() {
    const container = document.getElementById('shop-dialog-container');

    // Nur beim ersten Mal ladeny
    if (!document.getElementById('shop-dialog')) {
        const response = await fetch('/shop.html'); // Pfad zur ausgelagerten Datei
        const html = await response.text();
        container.innerHTML = html;
    }

    document.getElementById('shop-dialog').showModal();
}