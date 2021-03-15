//~~~~~~~~~~~~~~~~~~~~~//
// Global Declarations //
//~~~~~~~~~~~~~~~~~~~~~//

var canvas;
var waveData;
var bomb;
var ship;

const root2 = Math.sqrt(2);
const keys = new Set();
["w", "a", "s", "d", "b", "W", "A", "S", "D", "B", " "].forEach(item => keys.add(item));

// Only updated by key events
var keyState = {
	w: false,
	a: false,
	s: false,
	d: false,
	" ": false
};

var stars = [];

var missilePool = {
	ready: [],
	fired: [],
	speed: 0,
	cooldown: 0,
	cooldownTime: 0
};

var alienPools = {
	onCanvas: [],
	onCanvasCount: {}
};

const Sprite = {
	x: 0,
	y: 0,
};

// Between 1 and Max
getRandomInt = (max) => {
	return Math.ceil(Math.random() * Math.ceil(max));
}

var Aliens = {
	Simple: {
		type: "Simple",
		x: 0,
		y: 0,
		origin: {
			x: 0,
			y: 0
		},
		update: function () {
			this.y += this.speed;
		},
		speed: 3,
		src: "red.png"
	},
	Siney: {
		type: "Siney",
		x: 0,
		y: 0,
		magnitude: 30 + getRandomInt(50),
		origin: {
			x: 0,
			y: 0
		},
		update: function () {
			this.y += this.speed;
			this.x = Math.floor(this.origin.x + this.magnitude * Math.sin(this.y/10));
		},
		speed: 3,
		src: "blue.png"
	}
}

//~~~~~~~~~~~~~~~~~~~//
// Support Functions //
//~~~~~~~~~~~~~~~~~~~//


// Distance metric between 2 points
getDist2 = (x1, y1, x2, y2) => {
	return (Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

// Random choice from an array
choose = (choices) => {
  let index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

spriteFactory = (image) => {
	let sprite = Object.assign({img: new Image()}, Sprite);
	sprite.img.src = image;
	return sprite;
}

starFactory = (height=-5) => {
	return {
		x: getRandomInt(canvas.width),
		y: height,
		sz: getRandomInt(3)
	};
}

alienFactory = (type) => {
	let alien = Object.assign({}, type, {img: new Image()});
	alien.img.src = alien.src;
	console.log(alien);
	return alien;
}

populateStars = () => {
	let i = 0;
	for (i = -5; i < canvas.height; i += 10) {
		stars.push(starFactory(i));
	}
	stars.reverse();
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

populateAlientPools = (types, numeach=5) => {
	types.forEach(type => {
		alienPools[type] = [];
		alienPools.onCanvasCount[type] = 0;
		let i = 0;
		for (i = 0; i < numeach; i++) {
			alienPools[type].push(alienFactory(Aliens[type]));
		}
	});
}

//~~~~~~~~~~~~~~~~//
// Draw Functions //
//~~~~~~~~~~~~~~~~//

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

drawAliens = (ctx) => {
	alienPools.onCanvas.forEach(alien => ctx.drawImage(alien.img, alien.x, alien.y));
}

//~~~~~~~~~~~~~~~~~~//
// Update Functions //
//~~~~~~~~~~~~~~~~~~//
updateStars = () => {
	stars.forEach(s => s.y += 1);

	// Create a new star when one goes off bottom of canvas
	if (stars[0].y >= canvas.height) {
		stars.shift();
		stars.push(starFactory());
	}
}

updateMissiles = () => {
	// Decrement cooldown
	if (missilePool.cooldown > 0) {
		missilePool.cooldown -= 1;
	}

	// Launch Missile
	if (keyState[" "] && missilePool.cooldown == 0 && missilePool.ready.length > 0) {
		missilePool.ready[0].x = ship.x + Math.floor(ship.img.width / 2) - Math.floor(missilePool.ready[0].img.width / 2);
		missilePool.ready[0].y = ship.y;
		missilePool.fired.push(missilePool.ready.shift());
		missilePool.cooldown = missilePool.cooldownTime;
		console.log(missilePool);
	}
	
	// Move each fired missile
	missilePool.fired.forEach(missile => missile.y -= missilePool.speed);

	// Boundary check oldest fired missile
	if (missilePool.fired.length > 0 && missilePool.fired[0].y < -Math.floor(missilePool.fired[0].img.height / 2)) {
		missilePool.ready.push(missilePool.fired.shift());
	}
}

updateBomb = () => {
	// Initialize bomb
	if (keyState.b && !bomb) {
		bomb = {
			x: ship.x + Math.floor(ship.img.width / 2),
			y: ship.y + Math.floor(ship.img.height / 2),
			r: 0
		}
		bomb.dist2 = Math.max(getDist2(bomb.x, bomb.y, 0, 0,), getDist2(bomb.x, bomb.y, canvas.width, 0), getDist2(bomb.x, bomb.y, 0, canvas.height), getDist2(bomb.x, bomb.y, canvas.width, canvas.height));
		console.log(bomb)
	}

	// Grow bomb
	if (bomb) {
		bomb.r += 5;
		if (Math.pow(bomb.r, 2) > bomb.dist2) {
			bomb = null;
		}
	}
}

updateShip = () => {
	// Cardinal Directions
	ship.y -= keyState.w && !keyState.a && !keyState.d ? ship.speed : 0;
	ship.y += keyState.s && !keyState.a && !keyState.d ? ship.speed : 0;
	ship.x -= keyState.a && !keyState.w && !keyState.s ? ship.speed : 0;
	ship.x += keyState.d && !keyState.w && !keyState.s ? ship.speed : 0;

	// Diagonals
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

	// Boundary Checks
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

updateAliens = () => {
	
	// Determine whether to add a new alien to the canvas
	if (waveData.spacingTimeout > 0) {
		waveData.spacingTimeout -= 1;
	} else {
		let typesLeft = [];
		let canSpawn = [];
		let newType;
		waveData.spacingTimeout = waveData.spacing[waveData.curWave];
		// Create array of types with remaining values > 0;
		for (t in waveData.leftInCurWave) {
			if (waveData.leftInCurWave[t]> 0) {
				typesLeft.push(t);
			} 
			if (waveData.leftInCurWave[t] - alienPools.onCanvasCount[t] > 0) {
				canSpawn.push(t);
			} 
		}

		// If empty, move to next wave
		if (typesLeft.length == 0) {
			waveData.curWave = 0; // CHANGE THIS TO INCREMENT WHEN NEW WAVES/ALIENS IMPLEMENTED!!!
			waveData.leftInCurWave = Object.create(waveData.waves[waveData.curWave]);
			return;
		}

		// Choose a spawnable type at random, initialize from pool, add to on canvas count for type 
		newType = choose(canSpawn);
		if (newType && alienPools[newType].length > 0) {
			let curAlien = alienPools[newType][0];
			curAlien.origin.x = getRandomInt(canvas.width - curAlien.img.width);
			curAlien.origin.y = -curAlien.img.height;
			curAlien.x = curAlien.origin.x;
			curAlien.y = curAlien.origin.y;
			alienPools.onCanvas.push(alienPools[newType].shift());
			//waveData.leftInCurWave[newType] -= 1;
			alienPools.onCanvasCount[newType] += 1;
		}

	}

	// Update alien positions
	alienPools.onCanvas.forEach((alien, index) => {
		alien.update();
	});

	// Sort the onCanvas pool by y position, then pop any aliens off canvas back to their waiting pools 
	alienPools.onCanvas.sort((a, b) => (a.y > b.y) ? -1 : 1);

	while (alienPools.onCanvas.length > 0 && alienPools.onCanvas[0].y > canvas.height) {
		alienPools.onCanvasCount[alienPools.onCanvas[0].type] -= 1;
		alienPools[alienPools.onCanvas[0].type].push(alienPools.onCanvas.shift());
	}

}

//~~~~~~~~~~~~//
// Main Logic //
//~~~~~~~~~~~~//

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

init = () => {
	canvas = document.getElementById('gameArea');
	ship = Object.assign(spriteFactory('ship.png'), {speed: 5});
	ship.x = canvas.width / 2 - ship.img.width / 2;
	ship.y = canvas.height - ship.img.height;
	populateStars();
	populateMissilePool();
	$.getJSON("waveData.json").done(function (data) {
		waveData = data;
		populateAlientPools(waveData.types);
		waveData.curWave = 0;
		waveData.spacingTimeout = 0;
		waveData.leftInCurWave = Object.create(waveData.waves[0]);
		console.log(alienPools);
		console.log(waveData);
		updateState();
		updateCanvas();
	});
}

// Main Update Function, called at regular interval
updateState = () => {
	window.setTimeout(updateState, 33);

	updateStars();
	updateMissiles();
	updateBomb();
	updateShip();
	updateAliens();
}

// Main Draw Function, tied to browser refresh rate
updateCanvas = () => {
	window.requestAnimationFrame(updateCanvas);

	let ctx = canvas.getContext('2d');
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	drawStars(ctx);
	drawMissiles(ctx);
	drawBomb(ctx);
	drawAliens(ctx);
	ctx.drawImage(ship.img, ship.x, ship.y);
}

window.onload = init;
document.addEventListener("keydown", keyPressed);
document.addEventListener("keyup", keyReleased);
