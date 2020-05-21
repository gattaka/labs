var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.Minimap = {	
	drawMinimap: function(ctx, currentLevel, target, hero) {
		let miniX = $.GIsoGame.Configuration.uiMargin;
		let miniY = $.GIsoGame.Configuration.uiMargin;
		let miniWidth = $.GIsoGame.Configuration.minimapWidth;
		let miniHeight = $.GIsoGame.Configuration.minimapHeight;	
		
		let miniCellWidth = Math.floor(miniWidth / currentLevel.getMapW());
		let miniCellHeight = Math.floor(miniHeight / currentLevel.getMapH());
		
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
		for (let mx = 0; mx < currentLevel.getMapW(); mx++) 
			for (let my = 0; my < currentLevel.getMapH(); my++) 
				if (currentLevel.getWallAtCoord(mx, my) != undefined)		
					ctx.fillRect(miniX + mx * miniCellWidth, miniY + my * miniCellHeight, miniCellWidth, miniCellHeight);			
		
		if (target != undefined) {
			$.GIsoGame.GFXUtils.drawPoint(ctx, miniX + miniCellWidth * target.mx, miniY + miniCellHeight * target.my, "yellow");
			for (let s = 0; s < target.mxSteps.length; s++)
				$.GIsoGame.GFXUtils.drawPoint(ctx, miniX + miniCellWidth * target.mxSteps[s], miniY + miniCellHeight * target.mySteps[s], "purple");
		}
		
		if (hero != undefined)
			$.GIsoGame.GFXUtils.drawPoint(ctx, miniX + miniCellWidth * hero.mx, miniY + miniCellHeight * hero.my, "lime");				
	}
};