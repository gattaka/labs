var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.GFXUtils = {	
	drawPolygon: function(ctx, xArr, yArr, color, fill) {		
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = 1;			
		for (let d = 0; d < 2; d++) {
			ctx.beginPath();
			for (let i = 0; i < xArr.length + 1; i++) {
				let ii = i % xArr.length;
				if (i == 0) 
					ctx.moveTo(xArr[ii], yArr[ii]);
				else 
					ctx.lineTo(xArr[ii], yArr[ii]);
			}
			if (fill) {
				ctx.fill();
			} else {
				ctx.stroke();
			}
		}
	},
	
	drawPoint: function(ctx, x, y, color) {
		ctx.fillStyle = "black";
		ctx.fillRect(Math.floor(x - 2), Math.floor(y - 2), 5, 5);
		ctx.fillStyle = color;
		ctx.fillRect(Math.floor(x - 1), Math.floor(y - 1), 3, 3);
	},
};