/**
 * 
 */

$(document).ready(function(){
	var canvas=document.getElementById("canvas");
	var ctx=canvas.getContext("2d");

	var speed = 4;
	var precision = 2;
	var space = 4;
	var object = {
	    height: 32,
	    width: 32,
	    x: 0,
	    y: 0, 
	}

	function generateMap(height, width, x, y){
		var map = new Array();
		map[0] = {
			height: height,
			width: 3 * width,
			x: 2 * x,
			y: 2 * y,
		};

		map[1] = {
			height: height,
			width: 4 * width,
			x: 8 * x - space,
			y: 2 * y,
		};

		map[2] = {
			height: 4 * height - 2* space,
			width: width,
			x: 8 * x - space,
			y: 2 * y,
		};

		map[3] = {
			height: 6 * height + space,
			width: width,
			x: 15 * x - space,
			y: 2 * y,
		};

		map[4] = {
			height: height,
			width: 7 * width,
			x: 11 * x,
			y: 5 * y + space,
		};

		map[5] = {
			height: height,
			width: 4 * width,
			x: 18 * x,
			y: 2 * y,
		};

		map[6] = {
			height: 4 * height - (2* space),
			width: width,
			x: 22 * x - space,
			y: 2 * y,
		};

		map[7] = {
			height: height,
			width: 3 * width - space,
			x: 25 * x,
			y: 2 * y,
		};

		map[8] = {
			height: height,
			width: 2 * width,
			x: 0,
			y: 5 * y + space,
		};

		map[9] = {
			height: 3 * height,
			width: width,
			x: 4 * x + 2 * space,
			y: 5 * y + space,
		};

		map[10] = {
			height: height,
			width: 3 * width,
			x: 2 * x,
			y: 8 * y + (2*space),
		};

		map[11] = {
			height: height,
			width: 4 * width,
			x: 8 * x - space,
			y: 8 * y + (2*space),
		};

		map[12] = {
			height: height,
			width: 4 * width,
			x: 18 * x,
			y: 8 * y + (2*space),
		};

		map[13] = {
			height: 4 * height - 2 * space,
			width: width,
			x: 25 * x,
			y: 5 * y + space,
		};

		map[14] = {
			height: height,
			width: 3 * width,
			x: 25 * x,
			y: 9 * y - 2 * space,
		};

		map[15] = {
			height: height,
			width: 2 * width,
			x: 28 * x + space,
			y: 5 * y + space,
		};

		map[16] = {
			height: height,
			width: 2 * width - space,
			x: 0,
			y: 12 * y - space,
		};

		map[17] = {
			height: 3 * height,
			width: width,
			x: 4 * x + 2 * space,
			y: 12 * y - space,
		};

		map[18] = {
			height: height,
			width: 3 * width,
			x: 2 * x,
			y: 15 * y,
		};

		map[19] = {
			height: 2 * height,
			width: width,
			x: 8 * x - space,
			y: 12 * y - space,
		};

		map[20] = {
			height: height,
			width: 7 * width,
			x: 11 * x,
			y: 12 * y - space,
		};

		map[21] = {
			height: 6 * height - (2* space),
			width: width,
			x: 22 * x - space,
			y: 12 * y - space,
		};

		map[22] = {
			height: 4 * height - 2 * space,
			width: width,
			x: 25 * x,
			y: 12 * y - space,
		};

		map[23] = {
			height: height,
			width: 3 * width,
			x: 25 * x,
			y: 15 * y,
		};

		map[24] = {
			height: height,
			width: 2 * width,
			x: 28 * x + space,
			y: 12 * y - space,
		};

		map[25] = {
			height: height,
			width: 4 * width + 2 * space,
			x: 11 * x,
			y: 15 * y,
		};

		map[26] = {
			height: 4 * height - space,
			width: width + space,
			x: 11 * x,
			y: 15 * y,
		};

		map[27] = {
			height: 4 * height - 2 * space,
			width: width,
			x: 18 * x + 2 * space,
			y: 15 * y,
		};

		map[28] = {
			height: height + space,
			width: 4 * width + space,
			x: 14 * x + 2 * space,
			y: 18 * y + space,
		};

		map[29] = {
			height: height,
			width: 2 * width,
			x: 0,
			y: 22 * y - space,
		};

		map[30] = {
			height: height,
			width: 3 * width - space,
			x: 2 * x,
			y: 18 * y + space,
		};

		map[31] = {
			height: 4 * height - space,
			width: width,
			x: 4 * x + 2*space,
			y: 18 * y + space,
		};

		map[32] = {
			height: 5 * height + 2*space,
			width: width,
			x: 8 * x - space,
			y: 16 * y + space,
		};

		map[33] = {
			height: height,
			width: 7 * width,
			x: 11 * x,
			y: 22 * y - space,
		};

		map[34] = {
			height: 2 * height - space,
			width: width,
			x: 22 * x - space,
			y: 21 * y - space,
		};

		map[35] = {
			height: 4 * height - space,
			width: width,
			x: 25 * x,
			y: 19 * y - 3*space,
		};

		map[36] = {
			height: height,
			width: 3 * width,
			x: 25 * x,
			y: 19 * y - 3*space,
		};

		map[37] = {
			height: height,
			width: 2 * width,
			x: 0,
			y: 28 * y + space,
		};

		map[38] = {
			height: height,
			width: 3 * width,
			x: 2 * x,
			y: 25 * y,
		};

		map[39] = {
			height: 3 * height - 2*space,
			width: width,
			x: 4 * x + 2*space,
			y: 26 * y + space,
		};

		map[40] = {
			height: height,
			width: 4 * width,
			x: 8 * x - space,
			y: 25 * y,
		};

		map[41] = {
			height: 6 * height + space,
			width: width,
			x: 15 * x - space,
			y: 25 * y,
		};

		map[42] = {
			height: height,
			width: 7 * width,
			x: 11 * x,
			y: 28 * y + space,
		};

		map[43] = {
			height: height,
			width: 4 * width,
			x: 18 * x,
			y: 25 * y,
		};

		map[44] = {
			height: height,
			width: 3 * width,
			x: 25 * x,
			y: 25 * y,
		};

		map[45] = {
			height: 4 * height - 2*space,
			width: width,
			x: 25 * x,
			y: 25 * y,
		};

		map[46] = {
			height: height,
			width: 2 * width,
			x: 28 * x + space,
			y: 28 * y + space,
		};

		map[47] = {
			height: height,
			width: 3 * width,
			x: 2 * x,
			y: 31 * y + 2 * space,
		};

		map[48] = {
			height: 4 * height - 2 * space,
			width: width,
			x: 8 * x - space,
			y: 28 * y + space,
		};

		map[49] = {
			height: height,
			width: 4 * width,
			x: 8 * x - space,
			y: 31 * y + 2 * space,
		};

		map[50] = {
			height: height,
			width: 4 * width,
			x: 18 * x,
			y: 31 * y + 2 * space,
		};

		map[51] = {
			height: 4 * height - 2 * space,
			width: width,
			x: 22 * x - space,
			y: 28 * y + space,
		};

		map[52] = {
			height: height,
			width: 3 * width,
			x: 25 * x,
			y: 32 * y - 2 * space,
		};

		map[53] = {
			height: height + space,
			width: 2 * width,
			x: 28 * x + space,
			y: 22 * y - 2 * space,
		};

		return map;
	}

		
	var map = generateMap(20, 20, 16, 16);

	renderObject();

	function upCollision(object, map, precision){

		if(object.y + object.height >= 556){
			return true;
		}

		var ok = 1;
		for(var i = 0; i < map.length; i++){
			if(object.y + object.height + precision >= map[i].y && object.y + object.height - precision <= map[i].y && object.x + object.width > map[i].x && object.x < map[i].x + map[i].width){
				ok = 0;
				break;
			}
		}

		if(ok == 1){
			return false;
		}else{
			return true;
		}
	}
	
	function rightCollision(object, map, precision){

		if(object.x + object.width >= 492){
			return true;
		}

		var ok = 1;
		for(var i = 0; i < map.length; i++){
			if(object.x + object.width >= map[i].x && object.x + object.width <= map[i].x && object.y + object.height > map[i].y && object.y < map[i].y + map[i].height){
				ok = 0;
				break;
			}
		}

		if(ok == 1){
			return false;
		}else{
			return true;
		}
	}
	
	function leftCollision(object, map, precision){

		if(object.x <= 0){
			return true;
		}

		var ok = 1;
		for(var i = 0; i < map.length; i++){
			if(object.x >= map[i].x + map[i].width && object.x <= map[i].x + map[i].width && object.y + object.height > map[i].y && object.y < map[i].y + map[i].height){
				ok = 0;
				break;
			}
		}

		if(ok == 1){
			return false;
		}else{
			return true;
		}
	}
	
	function downCollision(object, map, precision){

		if(object.y <= 0){
			return true;
		}

		var ok = 1;
		for(var i = 0; i < map.length; i++){
			if(object.y <= map[i].y + map[i].height + precision &&  object.y >= map[i].y + map[i].height - precision && object.x < map[i].x + map[i].width && object.x + object.width > map[i].x){
				ok = 0;
				break;
			}
		}

		if(ok == 1){
			return false;
		}else{
			return true;
		}
	}

	document.body.onkeydown=function(event){
	    switch(event.keyCode){
	        case 98: // 2
	        	if(upCollision(object, map, precision)){
		            console.log("Loveste perete sus");
	    		}else{
	    			object.x += 0;
		            object.y += speed;
	    		}
				break;
	        case 100: // 4
	        	if(leftCollision(object, map, precision)){
	        		console.log("Loveste perete dreapta");
		        }else{
		        	object.x -= speed;
			           object.y += 0; 
		        }
	        	break;
	        case 102: // 6
	        	if(rightCollision(object, map, precision)){
	        		console.log("Loveste perete stanga");
		        }else{
		        	object.x += speed;
			        object.y += 0;  
		        }
	        	break;
	        case 104: // 8
	       		if(downCollision(object, map, precision)){
	        		console.log("Loveste perete jos");
		        }else{
		        	object.x += 0;
			        object.y -= speed; 
		        }
	        	break;
	    }
	    renderObject();
	}

	function renderObject(){
		base_image = new Image();
		base_image.src = '../images/hero.png';
		base_image.onload = function(){
			ctx.drawImage(base_image, object.x, object.y);
		}
	    ctx.clearRect(0,0,canvas.width,canvas.height);
	    //(wall1.x, wall1.y, wall1.width, wall1.height);
	    //ctx.fillRect(wall1.x, wall1.y, wall1.width, wall1.height);

	    for(var i = 0; i < map.length; i++){
			ctx.fillRect(map[i].x, map[i].y, map[i].width, map[i].height);
		}
	}
});