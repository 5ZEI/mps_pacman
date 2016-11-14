/**
 * 
 */
$(document).ready(function(){
	var canvas = document.createElement("canvas");

	if (canvas.getContext){
		var ctx = canvas.getContext("2d");
		canvas.width = 400;
		canvas.height = 400;
		
		roundedRect(ctx,12,12,150,150,15);
		
		//Dr.Hyde
	    function drHyde(ctx, x, y, radius, anticlockwise){
		    ctx.beginPath();
		    //ctx.arc(100, 100, 50, 0.25 * Math.PI, 1.25 * Math.PI, false);
		    ctx.arc(x, y, radius, 0.25 * Math.PI, 1.25 * Math.PI, anticlockwise);
		    ctx.fillStyle = "rgb(255, 0, 0)";
		    ctx.fill();
		    ctx.beginPath();
		    ctx.arc(x, y, radius, 0.75 * Math.PI, 1.75 * Math.PI, anticlockwise);
		    ctx.fill();
	    }
	    
	    
	    drHyde(ctx, 37, 37, 13, false);
	    ctx.save();
	    ctx.fillStyle = "rgb(255, 0, 255)";
	    ctx.translate(50, 50);
	    drHyde(ctx, 37, 37, 13, false);
	    ctx.restore();;

//	    ctx.beginPath();
//	    ctx.moveTo(83,116);
//	    ctx.lineTo(83,102);
//	    ctx.bezierCurveTo(83,94,89,88,97,88);
//	    ctx.bezierCurveTo(105,88,111,94,111,102);
//	    ctx.lineTo(111,116);
//	    ctx.lineTo(106.333,111.333);
//	    ctx.lineTo(101.666,116);
//	    ctx.lineTo(97,111.333);
//	    ctx.lineTo(92.333,116);
//	    ctx.lineTo(87.666,111.333);
//	    ctx.lineTo(83,116);
//	    ctx.fill();
//
//	    
//	    ctx.fillStyle = "white";
//	    ctx.beginPath();
//	    ctx.moveTo(91,96);
//	    ctx.bezierCurveTo(88,96,87,99,87,101);
//	    ctx.bezierCurveTo(87,103,88,106,91,106);
//	    ctx.bezierCurveTo(94,106,95,103,95,101);
//	    ctx.bezierCurveTo(95,99,94,96,91,96);
//	    ctx.moveTo(103,96);
//	    ctx.bezierCurveTo(100,96,99,99,99,101);
//	    ctx.bezierCurveTo(99,103,100,106,103,106);
//	    ctx.bezierCurveTo(106,106,107,103,107,101);
//	    ctx.bezierCurveTo(107,99,106,96,103,96);
//	    ctx.fill();
//	    
//	    ctx.fillStyle = "black";
//	    ctx.beginPath();
//	    ctx.arc(101,102,2,0,Math.PI*2,true);
//	    ctx.fill();
//
//	    ctx.beginPath();
//	    ctx.arc(89,102,2,0,Math.PI*2,true);
//	    ctx.fill(); 
	    
		// A utility function to draw a rectangle with rounded corners.

		function roundedRect(ctx,x,y,width,height,radius){
		  ctx.beginPath();
		  ctx.moveTo(x,y+radius);
		  ctx.lineTo(x,y+height-radius);
		  ctx.arcTo(x,y+height,x+radius,y+height,radius);
		  ctx.lineTo(x+width-radius,y+height);
		  ctx.arcTo(x+width,y+height,x+width,y+height-radius,radius);
		  ctx.lineTo(x+width,y+radius);
		  ctx.arcTo(x+width,y,x+width-radius,y,radius);
		  ctx.lineTo(x+radius,y);
		  ctx.arcTo(x,y,x,y+radius,radius);
		  ctx.stroke();
		}

		document.body.appendChild(canvas);
	  // drawing code here
	} else {
	  // canvas-unsupported code here
	}
});