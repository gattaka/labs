var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.GFXUtils = {	
	drawPolygon: function(ctx, xArr, yArr, color, fill, lineWidth) {		
		ctx.strokeStyle = color;
		ctx.fillStyle = color;		
		ctx.lineWidth = lineWidth == undefined ? 1 : lineWidth;					
		ctx.beginPath();
		for (let i = 0; i < xArr.length + 2; i++) {
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
	},
	
	drawPoint: function(ctx, x, y, color, size) {
		if (size == undefined)
			size = 1;		
		let width = (size + 1) * 2 + 1;
		ctx.fillStyle = "black";
		ctx.fillRect(Math.floor(x - size - 1), Math.floor(y - size - 1), width, width);
		ctx.fillStyle = color;
		ctx.fillRect(Math.floor(x - size), Math.floor(y - size), width - 2, width - 2);
	},
};