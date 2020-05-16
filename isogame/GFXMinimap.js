var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.GFXMinimap = {	
	drawMinimap: function(ctx, currentLevel, target, hero) {
		let miniX = 10;
		let miniY = 10;
		let miniWidth = 150;
		let miniHeight = 150;	
		
		let miniCellWidth = miniWidth / currentLevel.getMapW();
		let miniCellHeight = miniHeight / currentLevel.getMapH();
		ctx.strokeStyle = "darkgrey";
		ctx.lineWidth = 1;
		for (let mx = 0; mx < currentLevel.getMapW(); mx++) {
			for (let my = 0; my < currentLevel.getMapH(); my++) {
				let wall = currentLevel.getWallAtCoord(mx, my);				
				ctx.fillStyle = wall != undefined ? "grey" : "lightgrey";	
				let miniCellx = miniX + mx * miniCellWidth;
				let miniCelly = miniY + my * miniCellHeight;
				ctx.fillRect(Math.floor(miniCellx), Math.floor(miniCelly), Math.floor(miniCellWidth), Math.floor(miniCellHeight));
				ctx.strokeRect(Math.floor(miniCellx), Math.floor(miniCelly), Math.floor(miniCellWidth), Math.floor(miniCellHeight));
			}
		}
		$.GIsoGame.GFXUtils.drawPoint(ctx, miniX + miniCellWidth * target.mx, miniY + miniCellHeight * target.my, "yellow");
		$.GIsoGame.GFXUtils.drawPoint(ctx, miniX + miniCellWidth * hero.mx, miniY + miniCellHeight * hero.my, "lime");
		
		for (let s = 0; s < target.mxSteps.length; s++)
			$.GIsoGame.GFXUtils.drawPoint(ctx, miniX + miniCellWidth * target.mxSteps[s], miniY + miniCellHeight * target.mySteps[s], "purple");		

		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.strokeRect(miniX, miniY, miniWidth, miniHeight);
	}
};