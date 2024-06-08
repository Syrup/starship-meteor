const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let starship = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  width: 50,
  height: 50,
  color: "blue",
  bullets: [],
  speed: 5,
  maxSpeed: 10,
  acceleration: 0.5,
  direction: 0,
  bulletSpeed: 7,
  lastBulletTime: 0,
  bulletCooldown: 300,
};

let score = 0;
let explosionSound = new Audio("assets/sounds/explosion.mp3");
let backgroundSound = new Audio("assets/sounds/background.mp3");
let bulletSound = new Audio("assets/sounds/bullet.mp3");

let enemyImage = new Image();
enemyImage.src = "assets/img/enemy.png";

let starshipImage = new Image();
starshipImage.src = "assets/img/spaceship.png";

backgroundSound.loop = true;
backgroundSound.play();

let keys = {
  ArrowLeft: false,
  ArrowRight: false,
  " ": false,
};

let enemies = [];

function resetGame() {
  starship = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    color: "blue",
    bullets: [],
    speed: 5,
    maxSpeed: 10,
    acceleration: 0.5,
    direction: 0,
    bulletSpeed: 7,
    lastBulletTime: 0,
    bulletCooldown: 300,
  };

  score = 0;

  enemies = [];

  while (enemies.length < 10) {
    createEnemy();
  }
}

function createEnemy() {
  let minDistance = 16;
  let newEnemy;

  do {
    newEnemy = {
      x: Math.random() * (canvas.width - 30),
      y: Math.random() * -canvas.height,
      width: 30,
      height: 30,
      color: "red",
      speed: 2,
    };
  } while (
    enemies.some((enemy) => Math.abs(enemy.x - newEnemy.x) < minDistance)
  );

  enemies.push(newEnemy);
}

function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

function applyText(canvas, text) {
  const ctx = canvas.getContext("2d");
  let fontSize = 70;

  do {
    ctx.font = `${(fontSize -= 10)}px "Press Start 2P", Arial, sans-serif`;
  } while (ctx.measureText(text).width > canvas.width - 300);

  return ctx.font;
}

function updateGame() {
  if (score === 60) {
    let isMobile = window.innerWidth <= 768;

    context.font = isMobile
      ? `30px "Press Start 2P", Arial, sans-serif`
      : applyText(canvas, "You Win!");
    context.fillStyle = "white";
    context.fillText("You Win!", canvas.width / 3.7, canvas.height / 2);

    setTimeout(() => {
      resetGame();
      requestAnimationFrame(updateGame);
    }, 1000);

    return;
  }

  if (starship.direction !== 0) {
    starship.speed += starship.acceleration * starship.direction;
    starship.speed = Math.max(
      -starship.maxSpeed,
      Math.min(starship.maxSpeed, starship.speed)
    );
  } else {
    starship.speed *= 0.9;
  }
  starship.x += starship.speed;

  if (starship.x < 0) {
    starship.x = 0;
    starship.speed = 0;
  } else if (starship.x + starship.width > canvas.width) {
    starship.x = canvas.width - starship.width;
    starship.speed = 0;
  }

  if (
    keys[" "] &&
    new Date().getTime() - starship.lastBulletTime > starship.bulletCooldown
  ) {
    starship.bullets.push({
      x: starship.x + starship.width / 2 - 2.5,
      y: starship.y,
      width: 5,
      height: 10,
    });
    starship.lastBulletTime = new Date().getTime();
    let bulletFired = new CustomEvent("bulletFired");
    window.dispatchEvent(bulletFired);
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.drawImage(
    starshipImage,
    starship.x,
    starship.y,
    starship.width,
    starship.height
  );

  starship.bullets.forEach((bullet, i) => {
    context.fillStyle = "white";
    context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    bullet.y -= starship.bulletSpeed;
    if (bullet.y < 0) {
      starship.bullets.splice(i, 1);
    }
  });

  context.fillStyle = "white";
  context.font = "16px 'Press Start 2P', Arial";
  context.fillText("Score: " + score, 10, 25);

  enemies.forEach((enemy, i) => {
    context.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
    enemy.y += enemy.speed;
    if (enemy.y > canvas.height) {
      enemies.splice(i, 1);
    }
  });

  enemies.forEach((enemy, i) => {
    starship.bullets.forEach((bullet, j) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemies.splice(i, 1);
        starship.bullets.splice(j, 1);
        score++;

        let explosionEvent = new CustomEvent("explosion");
        window.dispatchEvent(explosionEvent);
      }
    });
  });

  if (Math.random() < 0.01) {
    createEnemy();
  }

  requestAnimationFrame(updateGame);
}

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if (keys["ArrowLeft"]) {
    starship.direction = -1;
  } else if (keys["ArrowRight"]) {
    starship.direction = 1;
  }

  switch (e.key) {
    case "ArrowLeft":
      starship.direction = -1;
      break;
    case "ArrowRight":
      starship.direction = 1;
      break;
    case " ":
      let bulletFired = new CustomEvent("bulletFired");
      window.dispatchEvent(bulletFired);
      let currentTime = new Date().getTime();
      if (currentTime - starship.lastBulletTime > starship.bulletCooldown) {
        starship.bullets.push({
          x: starship.x + starship.width / 2 - 2.5,
          y: starship.y,
          width: 5,
          height: 10,
        });
        starship.lastBulletTime = currentTime;
      }

      break;
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;

  if (!keys["ArrowLeft"] && keys["ArrowRight"]) {
    starship.direction = 1;
  } else if (keys["ArrowLeft"] && !keys["ArrowRight"]) {
    starship.direction = -1;
  } else {
    starship.direction = 0;
  }
});

window.addEventListener("bulletFired", () => {
  bulletSound.play();
});

window.addEventListener("explosion", () => {
  explosionSound.play();
});

while (enemies.length < 10) {
  createEnemy();
}
document
  .getElementById("leftButton")
  .addEventListener("touchstart", function () {
    starship.direction = -1;
  });
document.getElementById("leftButton").addEventListener("touchend", function () {
  starship.direction = 0;
});
document
  .getElementById("rightButton")
  .addEventListener("touchstart", function () {
    starship.direction = 1;
  });
document
  .getElementById("rightButton")
  .addEventListener("touchend", function () {
    starship.direction = 0;
  });
document
  .getElementById("shootButton")
  .addEventListener("touchstart", function () {
    let bulletFired = new CustomEvent("bulletFired");
    window.dispatchEvent(bulletFired);

    let currentTime = new Date().getTime();
    if (currentTime - starship.lastBulletTime > starship.bulletCooldown) {
      starship.bullets.push({
        x: starship.x + starship.width / 2 - 2.5,
        y: starship.y,
        width: 5,
        height: 10,
      });
      starship.lastBulletTime = currentTime;
    }
  });

window.onload = updateGame;
