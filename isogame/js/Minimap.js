var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.Minimap = {	
	drawMinimap: function(ctx, levelReader, hero) {
		let miniX = $.GIsoGame.Configuration.uiMargin;
		let miniY = $.GIsoGame.Configuration.uiMargin;
		let miniWidth = $.GIsoGame.Configuration.minimapWidth;
		let miniHeight = $.GIsoGame.Configuration.minimapHeight;	
		
		let miniCellWidth = Math.floor(miniWidth / levelReader.getMapW());
		let miniCellHeight = Math.floor(miniHeight / levelReader.getMapH());
		
		ctx.fillStyle = "#bbb";
		ctx.fillRect(miniX, miniY, miniWidth, miniHeight);
		
		ctx.strokeStyle = "#888";
		ctx.lineWidth = 1;		
		ctx.beginPath();	
		let toX = miniX + miniWidth;
		let toY = miniY + miniHeight;
		for (let x = miniX; x <= toX; x += miniCellWidth) {
			ctx.moveTo(x, miniY);
			ctx.lineTo(x, toY);
		}
		for (let y = miniY; y <= toY; y += miniCellHeight) {
			ctx.moveTo(miniY, y);
			ctx.lineTo(toX, y);
		}
		ctx.stroke();
					
		ctx.fillStyle = "#555";
		for (let mx = 0; mx < levelReader.getMapW(); mx++) 
			for (let my = 0; my < levelReader.getMapH(); my++) 
				if (levelReader.getWallAtCoord(mx, my) != undefined)		
					ctx.fillRect(miniX + mx * miniCellWidth, miniY + my * miniCellHeight, miniCellWidth, miniCellHeight);			
		
		if (hero != undefined)
			$.GIsoGame.GFXUtils.drawPoint(ctx, miniX + miniCellWidth * hero.mx, miniY + miniCellHeight * hero.my, "lime");				
	}
};