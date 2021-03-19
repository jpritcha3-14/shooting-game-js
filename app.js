//~~~~~~~~~~~~~~~~~~~~~//
// Global Declarations //
//~~~~~~~~~~~~~~~~~~~~~//

var gameStart = false;
var firstKeyPress = true;
var canvas = {width: 0, height:0};
var waveData; 
var bomb;
var ship;
var display;


const root2 = Math.sqrt(2);
const keys = new Set();
['w', 'a', 's', 'd', 'f', 'r', 'c', ' ', 'shift'].forEach(item => keys.add(item));

// Only updated by key events
var keyState = {
	w: false,
	a: false,
	s: false,
	d: false,
	f: false,
	r: false,
	c: false,
	' ': false,
	'shift': false
};

var stars = [];

var missilePool = {
	ready: [],
	onCanvas: [],
	speed: 0,
	cooldown: 0,
	cooldownTime: 0
};

var explosionPool = {
	onCanvas: [],
	queue: []
};

var powerupPool = {
	timeout: 250,
	time: 0,
	active: -1,
	powerups: []
};
 
var alienPools = {
	onCanvas: [],
	onCanvasCount: {},
};

const Sprite = {
	x: 0,
	y: 0,
};

//~~~~~~~~~~~~~~~~~~~//
// Support Functions //
//~~~~~~~~~~~~~~~~~~~//

// Between 1 and Max
getRandomInt = (max) => {
	return Math.ceil(Math.random() * Math.ceil(max));
};

// Rectangular collision
detectCollision = (a, b, wiggle=0) => {
	return (a.x > b.x - a.img.width + wiggle
		&& a.x < b.x + b.img.width - wiggle 
		&& a.y > b.y - a.img.height + wiggle
		&& a.y < b.y + b.img.height - wiggle);
};

// Random choice from an array
choose = (choices) => {
  let index = Math.floor(Math.random() * choices.length);
  return choices[index];
};

// Distance metric between 2 points
getDist2 = (x1, y1, x2, y2) => {
	return (Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
};

spriteFactory = (image) => {
	let sprite = Object.assign({img: new Image()}, Sprite);
	sprite.img.src = image;
	return sprite;
};

starFactory = (height=-5) => {
	let cur = {
		x: getRandomInt(canvas.width),
		y: height,
		sz: choose([1,2,2,3,3]),
	};
	cur.speed = (cur.sz == 1) ? choose([0.5, 1, 1]) : (cur.sz == 2) ? choose([1, 1.5, 1.5]) : choose([1.5, 1.5, 2]);
	return cur;
};

alienFactory = (type) => {
	let alien = Object.assign({}, type, {img: new Image()});
	alien.img.src = alien.src;
	alien.initialize();
	return alien;
};

populateStars = () => {
	let i = 0;
	for (i = -5; i < canvas.height; i += 10) {
		stars.push(starFactory(i));
	}
	stars.reverse();
};

populateMissilePool = (count=10, cooldownTime=10, image='imgs/missile.png', speed=8 ) => {
	missilePool.cooldownTime = cooldownTime;
	missilePool.speed = speed;
	let i = 0;
	for (i = 0; i < count; i++) {
		let missile = Object.assign({img: new Image()}, Sprite);
		missile.img.src = image;
		missile.exploded = false;
		missilePool.ready.push(missile)
	}
};

populateAlientPools = (types, numeach=10) => {
	types.forEach(type => {
		alienPools[type] = [];
		alienPools.onCanvasCount[type] = 0;
		let i = 0;
		for (i = 0; i < numeach; i++) {
			alienPools[type].push(alienFactory(Aliens[type]));
		}
	});
};

populateExplosionPool = (num=10, img='imgs/explosion.png', life=10) => {
	let i = 0;
	for (i = 0; i < num; i++) {
		let explosion = Object.assign({}, {img: new Image()}, Sprite);
		explosion.life = 10;
		explosion.ttl = 0;
		explosion.img.src = img;
		explosionPool.queue.push(explosion)
	}
};

populatePowerupPool = () => {
	let numMissiles = 10;
	let numShield = 3;
	let numBomb = 1;
	for (p in Powerups) {
		let maxNum = (p == 'Missiles') ? numMissiles : (p == 'Shield') ? numShield : numBomb;
		let i = 0;
		for (i = 0; i < maxNum; i++) {
			let cur = Object.assign({img: new Image()}, Powerups[p]);
			cur.img.src = cur.src;
			powerupPool.powerups.push(cur);
		}
	}
};

resetShip = () => {
	ship.x = canvas.width / 2 - ship.img.width / 2;
	ship.y = canvas.height - 3 * ship.img.height;
	ship.alive = true;
	ship.missiles = 50;
	ship.bombs = 1;
	ship.shield.power = 20;
	ship.score = 0;
};

initializeShip = () => {
	ship = Object.assign({}, {
		x: 0,
		y: 0,
		img: new Image(),
		speed: 5, 
		alive: true, 
		missiles: 50, 
		bombs: 1, 
		shield: {
			active: false,
			power: 20,
			drain: 10,
			drainTime: 10,
			img: new Image()
		}, 
		score: 0 
	});
	ship.img.onload = resetShip;
	ship.img.src = 'imgs/ship.png';
	ship.shield.img.src = 'imgs/ship_shield.png';
};

//~~~~~~~~~~~~~~~~~~~~//
// Object Definitions //
//~~~~~~~~~~~~~~~~~~~~//

var BasePowerup = {
	x: 0,
	y: 0,
	theta: 0,
	rotation: 0.05,
	speed: 3,
	initialize: function () {
		this.originX = getRandomInt(canvas.width - this.img.width);
		this.originY = -this.img.height;
		this.x = this.originX;
		this.y = this.originY;
	},
	update: function () {
		this.y += this.speed;
		this.theta += this.rotation;
	},
	outOfBounds: function() {
		return this.y > canvas.height;
	}
}

var Powerups = {
	Missiles: Object.assign({}, BasePowerup, {
		src: 'imgs/missiles.png',
		pickup: function () {
			ship.missiles += 20;
			ship.missiles = (ship.missiles > 100) ? 100 : ship.missiles;
		}
	}),
	Shield: Object.assign({}, BasePowerup, {
		src: 'imgs/shield.png',
		pickup: function () {
			ship.shield.power += 15;
			ship.shield.power = (ship.shield.power > 100) ? 100 : ship.shield.power;
		}
	}),
	Bomb: Object.assign({}, BasePowerup, {
		src: 'imgs/bomb.png',
		pickup: function () {
			ship.bombs += 1;
			ship.bombs = (ship.bombs > 3) ? 3 : ship.bombs;
		}
	})
};

var BaseAlien = {
	x: 0,
	y: 0,
	originX: 0,
	originY: 0,
	speed: 3,
	exploded: false,
	initialize: function () {
		this.originX = getRandomInt(canvas.width - this.img.width);
		this.originY = -this.img.height;
		this.x = this.originX;
		this.y = this.originY;
		this.exploded = false;
		this.customInitialize();
	},
	outOfBounds: function() {
		return this.y > canvas.height;
	},
	customInitialize: () => { return; }

};

var Aliens = {
	Simple: Object.assign({}, BaseAlien, {
		type: 'Simple',
		update: function () {
			this.y += this.speed;
		},
		speed: 3,
		src: 'imgs/red.png'
	}),
	Siney: Object.assign({}, BaseAlien, {
		type: 'Siney',
		magnitude: 0,
		phase: 0,
		frequency: 0,
		update: function () {
			this.y += this.speed;
			this.x = this.originX + this.magnitude * Math.sin(this.y/this.frequency + this.phase);
		},
		customInitialize: function () {
			this.magnitude = 30 + getRandomInt(50);
			this.phase = 6 * Math.random();
			this.frequency = 10 + getRandomInt(30);
		},
		speed: 3,
		src: 'imgs/blue.png'
	}),
	Crawly: Object.assign({}, BaseAlien, {
		type: 'Crawly',
		update: function () {
			this.x += this.speed;
		},
		customInitialize: function () {
			this.originX = choose([-this.img.width, canvas.width]);	
			this.originY = (canvas.height * 0.75 
				+ getRandomInt(Math.floor(canvas.height * 0.25)) - this.img.height);
			this.x = this.originX;
			this.y = this.originY;
			this.speed = (this.originX > 0) ? -this.baseSpeed : this.baseSpeed;
		},
		outOfBounds: function() {
			return ((this.x > canvas.width + 1) || (this.x < -this.img.width));
		},
		baseSpeed: 3,
		src: 'imgs/yellow.png'
	}),
	Fasty: Object.assign({}, BaseAlien, {
		type: 'Fasty',
		update: function () {
			this.y += this.speed;
		},
		speed: 6,
		src: 'imgs/white.png'
	}),
	Circley: Object.assign({}, BaseAlien, {
		type: 'Circley',
		rotation: 0.1,
		theta: 0,
		r: 0,
		update: function () {
			this.offsetY += this.speed;
			this.theta += this.rotation;
			this.x = this.originX + this.r * Math.cos(this.theta);
			this.y = this.offsetY + this.r * Math.sin(this.theta);
		},
		customInitialize: function () {
			this.offsetY = this.originY;
			this.r = 40 + getRandomInt(40);
			this.theta = 0;
			this.rotation = choose([1, -1]) * this.rotation;
		},
		outOfBounds: function() {
			return this.offsetY > canvas.height && this.y > canvas.height;
		},
		speed: 2,
		src: 'imgs/green.png'
	})
};

//~~~~~~~~~~~~~~~~//
// Draw Functions //
//~~~~~~~~~~~~~~~~//

drawStars = (ctx) => {
	ctx.fillStyle = 'yellow';
	let i = 0;
	for (i = 0; i < stars.length; i++) {
		ctx.save();
		ctx.translate(stars[i].x, stars[i].y);
		ctx.fillRect(0, 0, stars[i].sz, stars[i].sz);
		ctx.restore();
	}
}

drawMissiles = (ctx) => {
	missilePool.onCanvas.forEach(missile => ctx.drawImage(missile.img, missile.x, missile.y));
}

drawBomb = (ctx) => {
	if (bomb) {
		ctx.strokeStyle ='blue';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(bomb.x, bomb.y, bomb.r, 0, 2 * Math.PI);
		ctx.stroke();
	}

}

drawAliens = (ctx) => {
	alienPools.onCanvas.forEach(alien => ctx.drawImage(alien.img, alien.x, alien.y));
}

drawPowerup = (ctx) => {
	if (powerupPool.active > -1) {
		let p = powerupPool.powerups[powerupPool.active];
		ctx.save();
		ctx.translate(p.x + p.img.width/2, p.y + p.img.height/2);
		ctx.rotate(p.theta);
		ctx.translate(-p.x - p.img.width/2, -p.y - p.img.height/2);
		ctx.drawImage(p.img, p.x, p.y);
		ctx.restore();
	}
}

drawExplosions = (ctx) => {
	explosionPool.onCanvas.forEach(explosion => ctx.drawImage(explosion.img, explosion.x, explosion.y));
}

drawShip = (ctx) => {
	if (ship.alive) {
		ctx.drawImage((ship.shield.active) ? ship.shield.img : ship.img, ship.x, ship.y);
	}
}

drawStartMessage = (ctx) => {
	ctx.save();
	ctx.font = 'bold 30px Courier New';
	ctx.fillStyle = 'blue';
	ctx.textAlign = 'center';
	ctx.fillText('PRESS S TO START', canvas.width/2, canvas.height/2);
	ctx.restore();
}

drawGameOver = (ctx) => {
	ctx.font = 'bold 30px Courier New';
	ctx.fillStyle = 'red';
	ctx.textAlign = 'center';
	ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
}

drawWaveNumber = (ctx) => {
	ctx.font = 'bold 30px Courier New';
	ctx.fillStyle = 'blue';
	ctx.textAlign = 'center';
	ctx.fillText(`WAVE ${waveData.curWave + 1}`, canvas.width/2, canvas.height/2);
}

//~~~~~~~~~~~~~~~~~~//
// Update Functions //
//~~~~~~~~~~~~~~~~~~//
updateStars = () => {
	stars.forEach(s => s.y += s.speed);

	// Create a new star when one goes off bottom of canvas
	stars.sort((a, b) => {return b.y - a.y});
	while (stars[0].y >= canvas.height) {
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
	if (keyState[' '] && ship.alive && ship.missiles > 0 && missilePool.cooldown == 0 && missilePool.ready.length > 0) {
		missilePool.ready[0].x = ship.x + ship.img.width / 2 - missilePool.ready[0].img.width / 2;
		missilePool.ready[0].y = ship.y;
		missilePool.ready[0].exploded = false;
		missilePool.onCanvas.push(missilePool.ready.shift());
		missilePool.cooldown = missilePool.cooldownTime;
		ship.missiles -= 1;
	}
	
	// Move each onCanvas missile
	missilePool.onCanvas.forEach(missile => missile.y -= missilePool.speed);

	// Boundary check oldest onCanvas missile
	if (missilePool.onCanvas.length > 0 && missilePool.onCanvas[0].y < -missilePool.onCanvas[0].img.height / 2) {
		missilePool.ready.push(missilePool.onCanvas.shift());
	}
}

updateBomb = () => {
	// Initialize bomb
	if (keyState.f && !bomb && ship.alive && ship.bombs > 0) {
		bomb = {
			x: ship.x + ship.img.width / 2,
			y: ship.y + ship.img.height / 2,
			r: 0
		}
		bomb.dist2 = Math.max(getDist2(bomb.x, bomb.y, 0, 0,), getDist2(bomb.x, bomb.y, canvas.width, 0), getDist2(bomb.x, bomb.y, 0, canvas.height), getDist2(bomb.x, bomb.y, canvas.width, canvas.height));
		ship.bombs -= 1;
	}

	// Grow bomb
	if (bomb) {
		bomb.r += 5;
		if (Math.pow(bomb.r, 2) > bomb.dist2) {
			bomb = null;
		}
	}
}

updatePowerup = () => {
	if (powerupPool.active == -1) {
		powerupPool.time -= 1;
		if (powerupPool.time <= 0) {
			powerupPool.time = powerupPool.timeout;
			let aliensLeft = Object.values(waveData.leftInCurWave).reduce((a, b) => a + b);
			if (aliensLeft > 10) {
				powerupPool.active = getRandomInt(powerupPool.powerups.length) - 1;
			} else if (ship.missiles < 10) {
				powerupPool.active = 0;
			} else {
				return;
			}
			powerupPool.powerups[powerupPool.active].initialize();
		}
	} else {
		let cur = powerupPool.powerups[powerupPool.active];
		cur.update();
		if (cur.outOfBounds()) {
			powerupPool.active = -1;	
		}
	}
}

updateShip = () => {
	if (firstKeyPress) {
		return;
	}
	if (!ship.alive) {
		if (keyState.r || keyState.c) { restart(); }
		return;
	}
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

	// Shield
	if (keyState.shift && ship.shield.power > 0) {
		ship.shield.active = true;
		ship.shield.drain -= 1;
		if (ship.shield.drain <= 0) {
			ship.shield.drain = ship.shield.drainTime;
			ship.shield.power -= 1;
		}
	} else {
		ship.shield.active = false;	
	}
}

updateAliens = () => {
	
	// Determine whether to add a new alien to the canvas
	if (waveData.newWaveTime > 0) {
		waveData.newWaveTime -= 1;
		if (waveData.newWaveTime <= 0) {
			waveData.newWave = false;
		}
	} else if (waveData.spacingTimeout > 0) {
		waveData.spacingTimeout -= 1;
	} else {
		let typesLeft = [];
		let canSpawn = [];
		let newType;
		waveData.spacingTimeout = waveData.waves[waveData.curWave].spacing;
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
			waveData.curWave += 1; 
			if (waveData.curWave == waveData.waves.length) {
				waveData.curWave = 0;
			}
			waveData.newWave = true;
			waveData.newWaveTime = waveData.newWaveTimeout;
			waveData.leftInCurWave = Object.assign({}, waveData.waves[waveData.curWave].aliens);
			return;
		}

		// Choose a spawnable type at random, initialize from pool, add to on canvas count for type 
		newType = choose(canSpawn);
		if (newType && alienPools[newType].length > 0) {
			let curAlien = alienPools[newType][0];
			curAlien.initialize();
			alienPools.onCanvas.push(alienPools[newType].shift());
			alienPools.onCanvasCount[newType] += 1;
		}

	}

	// Update alien positions
	alienPools.onCanvas.forEach((alien, index) => {
		alien.update();
	});

	// Sort the onCanvas pool by outOfBounds, then pop any aliens off canvas back to their waiting pools 
	alienPools.onCanvas.sort(function(x,y) { return (x.outOfBounds() === y.outOfBounds()) ? 0 : x.outOfBounds() ? -1 : 1 });

	while (alienPools.onCanvas.length > 0 && alienPools.onCanvas[0].outOfBounds()) {
		alienPools.onCanvasCount[alienPools.onCanvas[0].type] -= 1;
		alienPools[alienPools.onCanvas[0].type].push(alienPools.onCanvas.shift());
	}

}

updateExplosions = () => {
	explosionPool.onCanvas.forEach(explosion => {explosion.ttl -= 1});
	while (explosionPool.onCanvas.length > 0 && explosionPool.onCanvas[0].ttl <= 0) {
		explosionPool.queue.push(explosionPool.onCanvas.shift());
	}
}

placeExplosion = (thing) => {
	if (explosionPool.queue.length > 0) {
		let explosion = explosionPool.queue[0];
		explosion.x = thing.x - (explosion.img.width - thing.img.width)/2;
		explosion.y = thing.y - (explosion.img.height - thing.img.height)/2;
		explosion.ttl = explosion.life;
		explosionPool.onCanvas.push(explosionPool.queue.shift());
	} 
} 

detectCollisions = () => {
	// Between ship and aliens
	alienPools.onCanvas.forEach(alien => {
		if (ship.alive && detectCollision(ship, alien, wiggle=3)) {
			if (ship.shield.active) {
				alien.exploded = true;
				ship.score += 1;
				placeExplosion(alien);
			} else {
				ship.alive = false;
				placeExplosion(ship);
			}
		}
	});

	// Between ship and powerup
	if (powerupPool.active >= 0 && ship.alive && detectCollision(ship, powerupPool.powerups[powerupPool.active])) {
		powerupPool.powerups[powerupPool.active].pickup();
		powerupPool.active = -1;
	}
	
	// Between aliens and missiles
	if (alienPools.onCanvas.length > 0 && missilePool.onCanvas.length > 0) {
		alienPools.onCanvas.forEach(a => {
			missilePool.onCanvas.forEach(m => {
				if (detectCollision(a, m)) {
					a.exploded = true;
					m.exploded = true;
					ship.score += 1;
					placeExplosion(a);
				}	
			});
		});
	}

	// Between bomb and aliens
	if (bomb && alienPools.onCanvas.length > 0) {
		alienPools.onCanvas.forEach(a => {
			if (getDist2(bomb.x, bomb.y, a.x + a.img.width/2, a.y + a.img.height/2) < Math.pow(bomb.r, 2)) {
				a.exploded = true;
				placeExplosion(a);
			}
		});
	}

	// Sort alien and missile pools, placing exploded objects at the front
	alienPools.onCanvas.sort(function(x,y) { return (x.exploded === y.exploded) ? 0 : x.exploded ? -1 : 1 });
	missilePool.onCanvas.sort(function(x,y) { return (x.exploded === y.exploded) ? 0 : x.exploded ? -1 : 1 });

	// Pop exploded aliens and missiles from canvas back to waiting pools 
	while (alienPools.onCanvas.length > 0 && alienPools.onCanvas[0].exploded) {
		let alienType = alienPools.onCanvas[0].type;
		waveData.leftInCurWave[alienType] -= 1;
		alienPools.onCanvasCount[alienType] -= 1;
		alienPools[alienType].push(alienPools.onCanvas.shift());
	}
	while (missilePool.onCanvas.length > 0 && missilePool.onCanvas[0].exploded) {
		missilePool.ready.push(missilePool.onCanvas.shift());
	} 
}

updateDisplay = () => {
	display.missiles.innerHTML = ship.missiles;
	display.bombs.innerHTML = ship.bombs;
	display.shield.innerHTML = ship.shield.power;
	display.score.innerHTML = ship.score;
}

//~~~~~~~~~~~~~~~~~~~~//
// Key Event Handlers //
//~~~~~~~~~~~~~~~~~~~~//

keyPressed = (event) => {
	if (keys.has(event.key.toLowerCase())) {
		keyState[event.key.toLowerCase()] = true;
		if (firstKeyPress && gameStart && event.key.toLowerCase() != 's') {
			firstKeyPress = false;
		}
	}
	// Prevent space bar from scrolling page
	if (event.keyCode == 32 && event.target == document.body) {
		event.preventDefault();
	}
}

keyReleased = (event) => {
	if (keys.has(event.key.toLowerCase())) {
		keyState[event.key.toLowerCase()] = false;
	}
	if (firstKeyPress && event.key.toLowerCase() == 's') {
		firstKeyPress = false;
	}
}

clearKeyEvents = (event) => {
	for (key in keyState) {
		keyState[key] = false;
	}
}

//~~~~~~~~~~~~//
// Main Logic //
//~~~~~~~~~~~~//

restart = () => {
	bomb = null;
	while (missilePool.onCanvas.length > 0) {
		missilePool.ready.push(missilePool.onCanvas.shift());
	}
	while (alienPools.onCanvas.length > 0) {
		alienPools[alienPools.onCanvas[0].type].push(alienPools.onCanvas.shift());
	}
	while (explosionPool.onCanvas.length > 0) {
		explosionPool.queue.push(explosionPool.onCanvas.shift());
	}
	waveData.types.forEach(t => { 
		alienPools.onCanvasCount[t] = 0;
	});
	waveData.curWave = (keyState.c) ? Math.floor(waveData.curWave/5) * 5 : 0;
	waveData.leftInCurWave = Object.assign({}, waveData.waves[waveData.curWave].aliens); 
	clearKeyEvents();
	powerupPool.active = -1;
	powerupPool.time = powerupPool.timeout;
	waveData.newWave = true;
	waveData.newWaveTime = waveData.newWaveTimeout;
	resetShip();
}

init = () => {
	canvas = document.getElementById('gameArea');
	display = {
		missiles: document.getElementById('missiles'),
		bombs: document.getElementById('bombs'),
		shield: document.getElementById('shield'),
		score: document.getElementById('score')
	};
	initializeShip();
	updateDisplay();
	populateStars();
	populateMissilePool();
	populateExplosionPool();
	populatePowerupPool();
	$.getJSON('waveData.json')
	.done(function (data) {
		waveData = data;
		populateAlientPools(waveData.types);
		waveData.curWave = 0;
		waveData.spacingTimeout = 0;
		waveData.newWaveTimeout = 60;
		waveData.newWaveTime = 60;
		waveData.newWave = true;
		waveData.leftInCurWave = Object.assign({}, waveData.waves[0].aliens);
		updateState();
		updateCanvas(); })
	.fail(function (error) {
		console.log(error);
	});
}

// Main Update Function, called at regular interval
updateState = () => {
	window.setTimeout(updateState, 33);

	updateStars();
	if (!gameStart) { 
		if (keyState.s) {
			gameStart = true;
		} else {
			return;
		}
	};
	updateMissiles();
	updateBomb();
	updateAliens();
	updatePowerup();
	updateShip();
	detectCollisions();
	updateExplosions();
	updateDisplay();
}

// Main Draw Function, tied to browser refresh rate
updateCanvas = () => {
	window.requestAnimationFrame(updateCanvas);
	let ctx = canvas.getContext('2d');
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	drawStars(ctx);
	if (!gameStart) {
		drawShip(ctx);
		drawStartMessage(ctx);
		return;
	}
	drawMissiles(ctx);
	drawBomb(ctx);
	drawAliens(ctx);
	drawPowerup(ctx);
	drawShip(ctx);
	drawExplosions(ctx);
	if (!ship.alive) {
		drawGameOver(ctx);
	}
	if (waveData.newWave) {
		drawWaveNumber(ctx);
	}
}

window.onload = init;
document.addEventListener('keydown', keyPressed);
document.addEventListener('keyup', keyReleased);
window.addEventListener('focus', clearKeyEvents);
