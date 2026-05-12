const cards = Array.from(document.querySelectorAll('.game-card'));
const statusEl = document.getElementById('status');

let selectedIndex = 0;
let lastMoveTime = 0;
let lastActionTime = 0;

const gameRoutes = {
  'Space Blaster': 'games/space-blaster/index.html',
  'Pixel Racer': 'games/pixel-racer/index.html',
  'Dungeon Quest': 'games/dungeon-quest/index.html',
};

function isVerticalLayout() {
  if (cards.length < 2) {
    return false;
  }

  return cards[1].offsetTop > cards[0].offsetTop;
}

function updateSelection(index) {
  selectedIndex = (index + cards.length) % cards.length;

  cards.forEach((card, i) => {
    card.classList.toggle('is-selected', i === selectedIndex);
  });

  const selectedName = cards[selectedIndex].dataset.game;
  statusEl.textContent = `Geselecteerd: ${selectedName}`;
}

function launchSelectedGame() {
  const selectedName = cards[selectedIndex].dataset.game;
  const targetPath = gameRoutes[selectedName];

  if (!targetPath) {
    statusEl.textContent = `Nog niet beschikbaar: ${selectedName}`;
    return;
  }

  statusEl.textContent = `Starten: ${selectedName}`;
  window.location.href = targetPath;
}

function moveSelection(delta) {
  updateSelection(selectedIndex + delta);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  const verticalLayout = isVerticalLayout();

  if (!verticalLayout && ['arrowright', 'd'].includes(key)) {
    event.preventDefault();
    moveSelection(1);
  }

  if (!verticalLayout && ['arrowleft', 'a'].includes(key)) {
    event.preventDefault();
    moveSelection(-1);
  }

  if (verticalLayout && ['arrowdown', 's'].includes(key)) {
    event.preventDefault();
    moveSelection(1);
  }

  if (verticalLayout && ['arrowup', 'w'].includes(key)) {
    event.preventDefault();
    moveSelection(-1);
  }

  if (['enter', ' '].includes(key)) {
    event.preventDefault();
    launchSelectedGame();
  }
});

cards.forEach((card, i) => {
  card.addEventListener('click', () => {
    updateSelection(i);
    launchSelectedGame();
  });
});

function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = pads && pads[0];

  if (!pad) {
    requestAnimationFrame(pollGamepad);
    return;
  }

  const now = performance.now();
  const verticalLayout = isVerticalLayout();

  const previousPressed = verticalLayout
    ? pad.buttons[12]?.pressed || pad.axes[1] < -0.6
    : pad.buttons[14]?.pressed || pad.axes[0] < -0.6;
  const nextPressed = verticalLayout
    ? pad.buttons[13]?.pressed || pad.axes[1] > 0.6
    : pad.buttons[15]?.pressed || pad.axes[0] > 0.6;
  const aPressed = pad.buttons[0]?.pressed;

  if ((previousPressed || nextPressed) && now - lastMoveTime > 180) {
    moveSelection(previousPressed ? -1 : 1);
    lastMoveTime = now;
  }

  if (aPressed && now - lastActionTime > 180) {
    launchSelectedGame();
    lastActionTime = now;
  }

  requestAnimationFrame(pollGamepad);
}

window.addEventListener('gamepadconnected', () => {
  statusEl.textContent = 'Xbox-controller verbonden';
});

window.addEventListener('gamepaddisconnected', () => {
  statusEl.textContent = `Geselecteerd: ${cards[selectedIndex].dataset.game}`;
});

updateSelection(0);
pollGamepad();

// PWA: Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, (err) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// PWA: Notifications
const notifyBtn = document.getElementById('btn-notify');

if ('Notification' in window) {
  if (Notification.permission === 'default' || Notification.permission === 'denied') {
    notifyBtn.removeAttribute('hidden');
  }

  notifyBtn.addEventListener('click', () => {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        notifyBtn.setAttribute('hidden', 'true');
        new Notification('Retro Hub', {
          body: 'Notificaties zijn succesvol ingeschakeld!',
          icon: '/console.png'
        });
      }
    });
  });
}

