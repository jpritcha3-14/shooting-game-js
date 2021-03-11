const Sprite = {
	x: 0,
	y: 0,
}

const keys = new Set();
["w", "a", "s", "d"].forEach(item => keys.add(item));

var keyState = {
	w: false,
	a: false,
	s: false,
	d: false
}

spriteFactory = (image) => {
	let sprite = Object.assign({img: new Image()}, Sprite);
	sprite.img.src = image;
	return sprite
}

var ship = Object.assign(spriteFactory('ship.png'), {speed: 5});

init = () => {
	updateState();
	window.requestAnimationFrame(updateCanvas);
}

keyPressed = (event) => {
	if (keys.has(event.key)) {
		keyState[event.key] = true;
		//console.log(keyState);
	}
}

keyReleased = (event) => {
	if (keys.has(event.key)) {
		keyState[event.key] = false;
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
	
	ctx = document.getElementById('test').getContext('2d');
	ctx.clearRect(0, 0, 150, 150);
	ctx.drawImage(ship.img, ship.x, ship.y)
}


window.onload = init
document.addEventListener("keydown", keyPressed);
document.addEventListener("keyup", keyReleased);
