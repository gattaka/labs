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
		ctx.strokeStyle = "darkgrey";
		ctx.lineWidth = 1;
		for (let mx = 0; mx < currentLevel.getMapW(); mx++) {
			for (let my = 0; my < currentLevel.getMapH(); my++) {
				let wall = currentLevel.getWallAtCoord(mx, my);				
				ctx.fillStyle = wall != undefined ? "grey" : "lightgrey";	
				let miniCellx = miniX + mx * miniCellWidth;
				let miniCelly = miniY + my * miniCellHeight;
				ctx.fillRect(miniCellx, miniCelly, miniCellWidth, miniCellHeight);
				ctx.strokeRect(miniCellx, miniCelly, miniCellWidth, miniCellHeight);
			}
		}
		if (target != undefined) {
			$.GIsoGame.GFXUtils.drawPoint(ctx, miniX + miniCellWidth * target.mx, miniY + miniCellHeight * target.my, "yellow");
			for (let s = 0; s < target.mxSteps.length; s++)
				$.GIsoGame.GFXUtils.drawPoint(ctx, miniX + miniCellWidth * target.mxSteps[s], miniY + miniCellHeight * target.mySteps[s], "purple");
		}
		
		if (hero != undefined)
			$.GIsoGame.GFXUtils.drawPoint(ctx, miniX + miniCellWidth * hero.mx, miniY + miniCellHeight * hero.my, "lime");
		
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.strokeRect(miniX, miniY, miniWidth, miniHeight);
	}
};