var canvas;

const keys = new Set();
["w", "a", "s", "d", "W", "A", "S", "D"].forEach(item => keys.add(item));

// Global key state, only updated by key events
var keyState = {
	w: false,
	a: false,
	s: false,
	d: false
}

var stars = [];

getRandomInt = (max) => {
	return Math.ceil(Math.random() * Math.ceil(max));
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
	updateState();
	updateCanvas();
}

keyPressed = (event) => {
	if (keys.has(event.key)) {
		keyState[event.key.toLowerCase()] = true;
	}
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
	ship.y -= keyState.w ? ship.speed : 0;
	ship.y += keyState.s ? ship.speed : 0;
	ship.x -= keyState.a ? ship.speed : 0;
	ship.x += keyState.d ? ship.speed : 0;
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

updateState = () => {
	window.setTimeout(updateState, 33);
	updateStars();
	updateShip();
}

updateCanvas = () => {
	window.requestAnimationFrame(updateCanvas);

	let ctx = canvas.getContext('2d');
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	drawStars(ctx);
	ctx.drawImage(ship.img, ship.x, ship.y);
}

window.onload = init;
document.addEventListener("keydown", keyPressed);
document.addEventListener("keyup", keyReleased);
