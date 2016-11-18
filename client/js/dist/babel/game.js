"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getInitialConfiguration = exports.getNewPositions = undefined;

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var space = 4; /**
                *
                */

var between = 10;
var map = void 0;

function generateMap1(height, width, x, y) {
	var map = new Array();
	map[0] = {
		height: height,
		width: 3 * width,
		x: 2 * x + between,
		y: 2 * y
	};

	map[1] = {
		height: height,
		width: 4 * width,
		x: 8 * x - space + 2 * between,
		y: 2 * y
	};

	map[2] = {
		height: 4 * height - 2 * space,
		width: width,
		x: 8 * x - space + 2 * between,
		y: 2 * y
	};

	map[3] = {
		height: 6 * height + space + between,
		width: width,
		x: 15 * x - space + 3 * between,
		y: 2 * y
	};

	map[4] = {
		height: height / 2,
		width: 7 * width,
		x: 11 * x + 3 * between,
		y: 6 * y
	};

	map[5] = {
		height: height,
		width: 4 * width,
		x: 18 * x + 4 * between,
		y: 2 * y
	};

	map[6] = {
		height: 4 * height - 2 * space,
		width: width,
		x: 22 * x - space + 4 * between,
		y: 2 * y
	};

	map[7] = {
		height: height,
		width: 3 * width - space,
		x: 25 * x + 5 * between,
		y: 2 * y
	};

	map[8] = {
		height: height,
		width: 2 * width,
		x: 0,
		y: 5 * y + space + between
	};

	map[9] = {
		height: 3 * height,
		width: width,
		x: 4 * x + 2 * space + between,
		y: 5 * y + space + between
	};

	map[10] = {
		height: height,
		width: 3 * width,
		x: 2 * x + between,
		y: 8 * y + 2 * space + between
	};

	map[11] = {
		height: height,
		width: 4 * width,
		x: 8 * x - space + 2 * between,
		y: 8 * y + 2 * space + between
	};

	map[12] = {
		height: height,
		width: 4 * width,
		x: 18 * x + 4 * between,
		y: 8 * y + 2 * space + between
	};

	map[13] = {
		height: 4 * height - 2 * space,
		width: width,
		x: 25 * x + 5 * between,
		y: 5 * y + space + between
	};

	map[14] = {
		height: height,
		width: 3 * width,
		x: 25 * x + 5 * between,
		y: 9 * y - 2 * space + between
	};

	map[15] = {
		height: height,
		width: 2 * width,
		x: 28 * x + space + 6 * between,
		y: 5 * y + space + between
	};

	map[16] = {
		height: height,
		width: 2 * width - space,
		x: 0,
		y: 12 * y - space + 2 * between
	};

	map[17] = {
		height: 3 * height,
		width: width,
		x: 4 * x + 2 * space + between,
		y: 12 * y - space + 2 * between
	};

	map[18] = {
		height: height,
		width: 3 * width,
		x: 2 * x + between,
		y: 15 * y + 2 * between
	};

	map[19] = {
		height: 2 * height,
		width: width,
		x: 8 * x - space + 2 * between,
		y: 12 * y - space + 2 * between
	};

	map[20] = {
		height: height,
		width: 7 * width,
		x: 11 * x + 3 * between,
		y: 12 * y - space + 2 * between
	};

	map[21] = {
		height: 6 * height - 2 * space,
		width: width,
		x: 22 * x - space + 4 * between,
		y: 12 * y - space + 2 * between
	};

	map[22] = {
		height: 4 * height - 2 * space,
		width: width,
		x: 25 * x + 5 * between,
		y: 12 * y - space + 2 * between
	};

	map[23] = {
		height: height,
		width: 3 * width,
		x: 25 * x + 5 * between,
		y: 15 * y + 2 * between
	};

	map[24] = {
		height: height,
		width: 2 * width,
		x: 28 * x + space + 6 * between,
		y: 12 * y - space + 2 * between
	};

	map[25] = {
		height: height / 2,
		width: 4 * width,
		x: 11 * x + 3 * between,
		y: 15 * y + 3 * between
	};

	map[26] = {
		height: 3 * height,
		width: width / 2,
		x: 11 * x + 3 * between,
		y: 15 * y + 3 * between
	};

	map[27] = {
		height: 3 * height,
		width: width / 2,
		x: 19 * x + 3 * between,
		y: 15 * y + 3 * between
	};

	map[28] = {
		height: height / 2,
		width: 3 * width,
		x: 15 * x + 3 * space + 3 * between,
		y: 18 * y + 3 * between + 2
	};

	map[29] = {
		height: height,
		width: 2 * width,
		x: 0,
		y: 22 * y - space + 3 * between
	};

	map[30] = {
		height: height,
		width: 3 * width - space,
		x: 2 * x + between,
		y: 18 * y + space + 3 * between
	};

	map[31] = {
		height: 4 * height - space,
		width: width,
		x: 4 * x + 2 * space + between,
		y: 18 * y + space + 3 * between
	};

	map[32] = {
		height: 5 * height + 2 * space,
		width: width,
		x: 8 * x - space + 2 * between,
		y: 16 * y + space + 3 * between
	};

	map[33] = {
		height: height,
		width: 7 * width,
		x: 11 * x + 3 * between,
		y: 22 * y - space + 3 * between
	};

	map[34] = {
		height: 2 * height - space,
		width: width,
		x: 22 * x - space + 4 * between,
		y: 21 * y - space + 3 * between
	};

	map[35] = {
		height: 4 * height - space,
		width: width,
		x: 25 * x + 5 * between,
		y: 19 * y - 3 * space + 3 * between
	};

	map[36] = {
		height: height,
		width: 3 * width,
		x: 25 * x + 5 * between,
		y: 19 * y - 3 * space + 3 * between
	};

	map[37] = {
		height: height,
		width: 2 * width,
		x: 0,
		y: 28 * y + space + 4 * between
	};

	map[38] = {
		height: height,
		width: 3 * width,
		x: 2 * x + between,
		y: 25 * y + 4 * between
	};

	map[39] = {
		height: 3 * height - 2 * space,
		width: width,
		x: 4 * x + 2 * space + between,
		y: 26 * y + space + 4 * between
	};

	map[40] = {
		height: height,
		width: 4 * width,
		x: 8 * x - space + 2 * between,
		y: 25 * y + 4 * between
	};

	map[41] = {
		height: 6 * height + space + between,
		width: width,
		x: 15 * x - space + 3 * between,
		y: 25 * y + 4 * between
	};

	map[42] = {
		height: height / 2,
		width: 7 * width,
		x: 11 * x + 3 * between,
		y: 29 * y + 4 * between
	};

	map[43] = {
		height: height,
		width: 4 * width,
		x: 18 * x + 4 * between,
		y: 25 * y + 4 * between
	};

	map[44] = {
		height: height,
		width: 3 * width,
		x: 25 * x + 5 * between,
		y: 25 * y + 4 * between
	};

	map[45] = {
		height: 4 * height - 2 * space,
		width: width,
		x: 25 * x + 5 * between,
		y: 25 * y + 4 * between
	};

	map[46] = {
		height: height,
		width: 2 * width,
		x: 28 * x + space + 6 * between,
		y: 28 * y + space + 4 * between
	};

	map[47] = {
		height: height,
		width: 3 * width,
		x: 2 * x + between,
		y: 31 * y + 2 * space + 5 * between
	};

	map[48] = {
		height: 4 * height - 2 * space,
		width: width,
		x: 8 * x - space + 2 * between,
		y: 28 * y + space + 5 * between
	};

	map[49] = {
		height: height,
		width: 4 * width,
		x: 8 * x - space + 2 * between,
		y: 31 * y + 2 * space + 5 * between
	};

	map[50] = {
		height: height,
		width: 4 * width,
		x: 18 * x + 4 * between,
		y: 31 * y + 2 * space + 5 * between
	};

	map[51] = {
		height: 4 * height - 2 * space,
		width: width,
		x: 22 * x - space + 4 * between,
		y: 28 * y + space + 5 * between
	};

	map[52] = {
		height: height,
		width: 3 * width,
		x: 25 * x + 5 * between,
		y: 32 * y - 2 * space + 5 * between
	};

	map[53] = {
		height: height + space,
		width: 2 * width,
		x: 28 * x + space + 6 * between,
		y: 22 * y - 2 * space + 3 * between
	};

	return map;
}

function generateMap2(height, width, x, y) {
	document.getElementById("canvas").style.height = 560;
	var map = new Array();
	map[0] = {
		height: height,
		width: 15 * width,
		x: x + between,
		y: y + between
	};

	map[1] = {
		height: height,
		width: 15 * width,
		x: 6 * x + 3 * between,
		y: y + between
	};

	map[2] = {
		height: height * 6,
		width: width,
		x: 12 * x + between,
		y: 0
	};

	map[3] = {
		height: height * 15,
		width: width,
		x: 13 * x + 3 * between,
		y: y + between
	};

	map[4] = {
		height: height,
		width: width * 5,
		x: 0,
		y: 2 * y + 3 * between
	};

	map[5] = {
		height: height * 8 - between - 4,
		width: width,
		x: 2 * x + 3 * between,
		y: 2 * y + 3 * between
	};

	map[6] = {
		height: height,
		width: width * 17,
		x: 4 * x + 2 * between,
		y: 2 * y + 3 * between
	};

	map[7] = {
		height: 7 * height - 4,
		width: width,
		x: 10 * x + 3 * between - 4,
		y: y + between
	};

	map[8] = {
		height: height,
		width: width * 7 - 4,
		x: 10 * x + 3 * between - 4,
		y: 3 * y - between + 4
	};

	map[9] = {
		height: height,
		width: width * 6 + 6,
		x: x + between,
		y: 5 * y - 2 * between
	};

	map[10] = {
		height: height * 15,
		width: width,
		x: x + between,
		y: 5 * y - 2 * between
	};

	map[11] = {
		height: height * 17 - 4,
		width: width,
		x: 4 * x + 2 * between,
		y: 4 * y + 2 * between
	};

	map[12] = {
		height: height,
		width: width * 15 + 4,
		x: 6 * x + between,
		y: 4 * y + 2 * between
	};

	map[13] = {
		height: height * 15,
		width: width,
		x: 12 * x + between - 8,
		y: 4 * y + 2 * between
	};

	map[14] = {
		height: height * 15 + 4,
		width: width,
		x: 2 * x + 3 * between,
		y: 7 * y - 2 * between
	};

	map[15] = {
		height: height * 11,
		width: width * 9,
		x: 6 * x + between,
		y: 6 * y
	};

	map[16] = {
		height: height * 17,
		width: width,
		x: 10 * x + between,
		y: 6 * y
	};

	map[17] = {
		height: height * 10 + between,
		width: width,
		x: 13 * x + 3 * between,
		y: 7 * y
	};

	map[18] = {
		height: height * 20,
		width: width,
		x: x + between,
		y: 11 * y - 3 * between
	};

	map[19] = {
		height: height,
		width: width * 16 - between,
		x: 4 * x + 2 * between,
		y: 11 * y - 2 * between
	};

	map[20] = {
		height: height,
		width: width * 7 + 4,
		x: 12 * x + 2,
		y: 10 * y
	};

	map[21] = {
		height: height * 9 - 4,
		width: width,
		x: 12 * x + between - 8,
		y: 10 * y
	};

	map[22] = {
		height: height,
		width: width * 6,
		x: 2 * x + 3 * between,
		y: 14 * y - between
	};

	map[23] = {
		height: height,
		width: width * 28,
		x: 3 * x + between - 2 * between + 4,
		y: 13 * y - 3 * between
	};

	map[24] = {
		height: height,
		width: width * 5 + 4,
		x: 13 * x + 3 * between,
		y: 13 * y - 3 * between
	};

	map[25] = {
		height: height * 7,
		width: width,
		x: 4 * x + 2 * between - 4,
		y: 15 * y - 4 * between - 6
	};

	map[26] = {
		height: height * 6,
		width: width,
		x: 2 * x + 3 * between,
		y: 16 * y - 2 * between
	};

	map[27] = {
		height: height,
		width: width * 14,
		x: 4 * x + 2 * between - 4,
		y: 16 * y - 2 * between
	};

	map[28] = {
		height: height,
		width: width * 14 - 4,
		x: 10 * x + 4,
		y: 16 * y - 2 * between
	};

	map[29] = {
		height: height,
		width: width * 28,
		x: 6 * x + 4,
		y: 14 * y - between
	};

	return map;
}

function upCollision(object, map, precision) {

	if (object.y + object.height >= 615) {
		return true;
	}

	var ok = 1;
	for (var i = 0; i < map.length; i++) {
		if (object.y + object.height + precision >= map[i].y && object.y + object.height - precision <= map[i].y && object.x + object.width > map[i].x && object.x < map[i].x + map[i].width) {
			ok = 0;
			break;
		}
	}

	if (ok == 1) {
		return false;
	} else {
		return true;
	}
}

function rightCollision(object, map, precision) {

	if (object.x + object.width >= 552) {
		return true;
	}

	var ok = 1;
	for (var i = 0; i < map.length; i++) {
		if (object.x + object.width + precision >= map[i].x && object.x + object.width - precision <= map[i].x && object.y + object.height > map[i].y && object.y < map[i].y + map[i].height) {
			ok = 0;
			break;
		}
	}

	if (ok == 1) {
		return false;
	} else {
		return true;
	}
}

function leftCollision(object, map, precision) {

	if (object.x <= 0) {
		return true;
	}

	var ok = 1;
	for (var i = 0; i < map.length; i++) {
		if (object.x >= map[i].x + map[i].width - precision && object.x <= map[i].x + map[i].width + precision && object.y + object.height > map[i].y && object.y < map[i].y + map[i].height) {
			ok = 0;
			break;
		}
	}

	if (ok == 1) {
		return false;
	} else {
		return true;
	}
}

function downCollision(object, map, precision) {
	if (object.y <= 0) {
		return true;
	}

	var ok = 1;
	for (var i = 0; i < map.length; i++) {
		if (object.y <= map[i].y + map[i].height + precision && object.y >= map[i].y + map[i].height - precision && object.x < map[i].x + map[i].width && object.x + object.width > map[i].x) {
			ok = 0;
			break;
		}
	}

	if (ok == 1) {
		return false;
	} else {
		return true;
	}
}

// function colideWithPlayer(player, player2, precision){
// 	let ok = 1;

// 	// down
// 	if(player.y <= player2.y + player2.height + precision &&  player.y >= player2.y + player2.height - precision && player.x < player2.x + player2.width && player.x + player.width > player2.x){
// 		ok = 0;
// 	}

// 	//left
// 	if(player.x >= player2.x + player2.width - precision && player.x <= player2.x + player2.width + precision && player.y + player.height > player2.y && player.y < player2.y + player2.height){
// 		ok = 0;
// 	}

// 	//right
// 	if(player.x + player.width + precision >= player2.x && player.x + player.width -precision <= player2.x && player.y + player.height > player2.y && player.y < player2.y + player2.height){
// 		ok = 0;
// 	}

// 	//up
// 	if(player.y + player.height + precision >= player2.y && player.y + player.height - precision <= player2.y && player.x + player.width > player2.x && player.x < player2.x + player2.width){
// 		ok = 0;
// 	}

// 	return (ok == 1);
// }

// function colideWithHero(player, hero, precision){
// 	return colideWithPlayer(player, hero, precision);
// }

function setDirection(direction, speed) {
	var xs = 0;
	var ys = 0;
	switch (direction) {
		case 'up':
			xs = 0;
			ys = -speed;
			break;
		case 'down':
			xs = 0;
			ys = speed;
			break;
		case 'left':
			xs = -speed;
			ys = 0;
			break;
		case 'right':
			xs = speed;
			ys = 0;
			break;
	}
	return { 'xs': xs, 'ys': ys };
}

var direction = void 0;
var opponentsPositions = {};
// let directionChanged = false;
var huntedSpeed = 0.2;
var hunterSpeed = 0.4;
var precision = 0.4;
var others = {};
var me = {};

function renderObject() {
	// console.log(directionChanged);
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var directions = setDirection(direction, me.state === 'hunter' ? hunterSpeed : huntedSpeed);
	me.x += directions.xs;
	me.y += directions.ys;

	if (upCollision(me, map, precision) || downCollision(me, map, precision) || leftCollision(me, map, precision) || rightCollision(me, map, precision)) {
		me.x -= directions.xs;
		me.y -= directions.ys;
	}
	if (connected) {
		connection.send(JSON.stringify({ myNewPosition: { x: me.x, y: me.y } }));
	}
	// for (let opponent in others) {
	// 	if ((others[opponent] === 'hunter') && (colideWithHero(me, others[opponent]))){
	// 		me.x -= directions.xs;
	// 		me.y -= directions.ys;
	// 		connection.send('hunterAteMe');
	// 	}
	// 	else if (colideWithPlayer(me, others[opponent])) {
	// 		me.x -= directions.xs;
	// 		me.y -= directions.ys;
	// 	}
	// }

	var myImage = new Image();
	myImage.src = me.state === 'hunter' ? '../images/me-hero.jpg' : '../images/me.jpg';
	myImage.onload = function () {
		ctx.drawImage(myImage, me.x, me.y);
	};

	var _loop = function _loop(opponent) {
		var opImage = new Image();
		opImage.src = others[opponent].state === 'hunter' ? '../images/hero.jpg' : '../images/pac.jpg';
		opImage.onload = function () {
			if (!opponentsPositions[opponent]) {
				ctx.drawImage(opImage, others[opponent].x, others[opponent].y);
			} else {
				ctx.drawImage(opImage, opponentsPositions[opponent].x, opponentsPositions[opponent].y);
			}
		};
	};

	for (var opponent in others) {
		_loop(opponent);
	}

	for (var i = 0; i < map.length; i++) {
		ctx.fillRect(map[i].x, map[i].y, map[i].width, map[i].height);
	}
};

var getNewPositions = exports.getNewPositions = function getNewPositions(newPosition, newPositionId) {
	opponentsPositions[newPositionId] = newPosition;
};

var getInitialConfiguration = exports.getInitialConfiguration = function getInitialConfiguration(initialCoords) {
	if (initialCoords !== undefined) {
		initialConfig = initialCoords;
	}
	playersInGame = Object.keys(initialConfig).length;
	me = initialConfig[myId];

	delete initialCoords[myId];

	others = initialCoords;

	document.body.onkeydown = function (event) {
		switch (event.keyCode) {
			case 98: // 2
			case 40:
				// down key
				direction = 'down';
				break;
			case 100: // 4
			case 37:
				//left key
				direction = 'left';
				break;
			case 102: // 6
			case 39:
				// right key
				direction = 'right';
				break;
			case 104: // 8
			case 38:
				// up key
				direction = 'up';
				break;
		}
	};

	map = mapChosen === 'map2' ? generateMap2(10, 10, 36, 36) : generateMap1(20, 20, 16, 16);
	setInterval(renderObject, 5);
};
