var canvas;
const root2 = Math.sqrt(2);

const keys = new Set();
["w", "a", "s", "d", "b", "W", "A", "S", "D", "B", " "].forEach(item => keys.add(item));

// Global key state, only updated by key events
var keyState = {
	w: false,
	a: false,
	s: false,
	d: false,
	" ": false
}

var stars = [];

var missilePool = {
	ready: [],
	fired: [],
	speed: 0,
	cooldown: 0,
	cooldownTime: 0
};

var bomb = null;

getRandomInt = (max) => {
	return Math.ceil(Math.random() * Math.ceil(max));
}

getDist2 = (x1, y1, x2, y2) => {
	return (Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

const Sprite = {
	x: 0,
	y: 0,
}


starFactory = (height=-5) => {
	return {
		x: getRandomInt(canvas.width),
		y: height,
		sz: getRandomInt(3)
	};
}

populateStars = () => {
	let i = 0;
	for (i = -5; i < canvas.height; i += 10) {
		stars.push(starFactory(i));
	}
	stars.reverse()
	//console.log(stars);
}

populateMissilePool = (count=10, cooldownTime=10, image='missile.png', speed=8 ) => {
	missilePool.cooldownTime = cooldownTime;
	missilePool.speed = speed;
	let i = 0;
	for (i = 0; i < count; i++) {
		let missile = Object.assign({img: new Image()}, Sprite);
		missile.img.src = image;
		missilePool.ready.push(missile)
	}
}

drawStars = (ctx) => {
	ctx.fillStyle = "yellow";
	let i = 0;
	for (i = 0; i < stars.length; i++) {
		ctx.save();
		ctx.translate(stars[i].x, stars[i].y);
		ctx.fillRect(0, 0, stars[i].sz, stars[i].sz);
		ctx.restore();
	}
}

drawMissiles = (ctx) => {
	missilePool.fired.forEach(missile => ctx.drawImage(missile.img, missile.x, missile.y));
}

drawBomb = (ctx) => {
	if (bomb) {
		ctx.strokeStyle ="blue";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(bomb.x, bomb.y, bomb.r, 0, 2 * Math.PI);
		ctx.stroke();
	}

}


spriteFactory = (image) => {
	let sprite = Object.assign({img: new Image()}, Sprite);
	sprite.img.src = image;
	return sprite;
}

var ship = Object.assign(spriteFactory('ship.png'), {speed: 5});

init = () => {
	canvas = document.getElementById('gameArea');
	ship.x = canvas.width / 2 - ship.img.width / 2;
	ship.y = canvas.height - ship.img.height;
	populateStars();
	populateMissilePool();
	updateState();
	updateCanvas();
}

keyPressed = (event) => {
	if (keys.has(event.key)) {
		keyState[event.key.toLowerCase()] = true;
	}
	console.log(keyState);
}

keyReleased = (event) => {
	if (keys.has(event.key)) {
		keyState[event.key.toLowerCase()] = false;
	}
}

updateStars = () => {
	stars.forEach(s => s.y += 1);
	if (stars[0].y >= canvas.height) {
		stars.shift();
		stars.push(starFactory());
	}
}

updateShip = () => {
	ship.y -= keyState.w && !keyState.a && !keyState.d ? ship.speed : 0;
	ship.y += keyState.s && !keyState.a && !keyState.d ? ship.speed : 0;
	ship.x -= keyState.a && !keyState.w && !keyState.s ? ship.speed : 0;
	ship.x += keyState.d && !keyState.w && !keyState.s ? ship.speed : 0;
	if (keyState.w && keyState.a) {
		ship.x -= Math.ceil(ship.speed / root2);
		ship.y -= Math.ceil(ship.speed / root2);
	}
	if (keyState.a && keyState.s) {
		ship.x -= Math.ceil(ship.speed / root2);
		ship.y += Math.ceil(ship.speed / root2);
	}
	if (keyState.s && keyState.d) {
		ship.x += Math.ceil(ship.speed / root2);
		ship.y += Math.ceil(ship.speed / root2);
	}
	if (keyState.w && keyState.d) {
		ship.x += Math.ceil(ship.speed / root2);
		ship.y -= Math.ceil(ship.speed / root2);
	}
	if (ship.x < 0) {
		ship.x = 0;
	}
	if (ship.x > canvas.width - ship.img.width) {
		ship.x = canvas.width - ship.img.width;
	}
	if (ship.y < 0) {
		ship.y = 0;
	}
	if (ship.y > canvas.height - ship.img.height) {
		ship.y = canvas.height - ship.img.height;
	}
}

updateMissiles = () => {
	if (missilePool.cooldown > 0) {
		missilePool.cooldown -= 1;
	}
	if (keyState[" "] && missilePool.cooldown == 0 && missilePool.ready.length > 0) {
		missilePool.ready[0].x = ship.x + Math.floor(ship.img.width / 2) - Math.floor(missilePool.ready[0].img.width / 2);
		missilePool.ready[0].y = ship.y;
		missilePool.fired.push(missilePool.ready.shift());
		missilePool.cooldown = missilePool.cooldownTime;
		console.log(missilePool);
	}
	missilePool.fired.forEach(missile => missile.y -= missilePool.speed);
	if (missilePool.fired.length > 0 && missilePool.fired[0].y < -Math.floor(missilePool.fired[0].img.height / 2)) {
		missilePool.ready.push(missilePool.fired.shift());
	}
}

updateBomb = () => {
	if (keyState.b && !bomb) {
		bomb = {
			x: ship.x + Math.floor(ship.img.width / 2),
			y: ship.y + Math.floor(ship.img.height / 2),
			r: 0
		}
		bomb.dist2 = Math.max(getDist2(bomb.x, bomb.y, 0, 0,), getDist2(bomb.x, bomb.y, canvas.width, 0), getDist2(bomb.x, bomb.y, 0, canvas.height), getDist2(bomb.x, bomb.y, canvas.width, canvas.height));
		console.log(bomb)
	}
	if (bomb) {
		bomb.r += 5;
		if (Math.pow(bomb.r, 2) > bomb.dist2) {
			bomb = null;
		}
	}
}

updateState = () => {
	window.setTimeout(updateState, 33);
	updateStars();
	updateMissiles();
	updateBomb();
	updateShip();
}

updateCanvas = () => {
	window.requestAnimationFrame(updateCanvas);

	let ctx = canvas.getContext('2d');
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	drawStars(ctx);
	drawMissiles(ctx);
	drawBomb(ctx);
	ctx.drawImage(ship.img, ship.x, ship.y);
}

window.onload = init;
document.addEventListener("keydown", keyPressed);
document.addEventListener("keyup", keyReleased);
