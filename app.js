const keys = new Set();
["w", "a", "s", "d", "W", "A", "S", "D"].forEach(item => keys.add(item));

// Global key state, only updated by key events
var keyState = {
	w: false,
	a: false,
	s: false,
	d: false
}

const Sprite = {
	x: 0,
	y: 0,
}


spriteFactory = (image) => {
	let sprite = Object.assign({img: new Image()}, Sprite);
	sprite.img.src = image;
	return sprite
}

var ship = Object.assign(spriteFactory('ship.png'), {speed: 5});

init = () => {
	updateState();
	updateCanvas();
}

keyPressed = (event) => {
	if (keys.has(event.key)) {
		keyState[event.key.toLowerCase()] = true;
		//console.log(keyState);
	}
}

keyReleased = (event) => {
	if (keys.has(event.key)) {
		keyState[event.key.toLowerCase()] = false;
		//console.log(keyState);
	}
}


updateState = () => {
	window.setTimeout(updateState, 33);

	ship.y -= keyState.w ? ship.speed : 0;
	ship.y += keyState.s ? ship.speed : 0;
	ship.x -= keyState.a ? ship.speed : 0;
	ship.x += keyState.d ? ship.speed : 0;
}

updateCanvas = () => {
	window.requestAnimationFrame(updateCanvas);

	let canvas = document.getElementById('test');
	let ctx = canvas.getContext('2d');
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(ship.img, ship.x, ship.y);
}

window.onload = init;
document.addEventListener("keydown", keyPressed);
document.addEventListener("keyup", keyReleased);
