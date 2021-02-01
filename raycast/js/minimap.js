var $ = $ || {};
$.raycast = $.raycast || {};
$.raycast.minimap = (function() {	
		
	let uts;	// units		
	let plr;	// player
	let map;	// map
	
	// minimap cursor
	let cursorSideMmu = 10;	
	
	let mapColor = function(id, light) {
		if (id == 0) 		
			return "black";
		let hue = id * 255 / 10;
		if (typeof light === "undefined")
			return "hsl(" + hue + ", 100%, 50%)";
		return "hsl(" + hue + ", 100%, " + light + "%)";
	};
	
	let xMvuToMmu = function(xMvu) {
		return ui.widthHalf - (map.mapCols / 2 * uts.cluToMvu - xMvu) * uts.mvuToMmu;
	};
	
	let yMvuToMmu = function(yMvu) {
		return ui.heightHalf - (map.mapRows / 2 * uts.cluToMvu - yMvu) * uts.mvuToMmu;
	};
	
	let drawMinimap = function() {
		ui.ctx.fillStyle = "black";
		ui.ctx.fillRect(0, 0, ui.width, ui.height);

		let minimapCellSize = uts.cluToMvu * uts.mvuToMmu;

		for (let row = 0; row < map.mapRows; row++) {	
			let y = ui.heightHalf - (Math.floor(map.mapRows / 2) - row) * minimapCellSize - minimapCellSize / 2;
			for (let col = 0; col < map.mapCols; col++) {
				let wall = map.walls[row * map.mapCols + col];
				if (wall == 0)
					continue;
				let x = ui.widthHalf - (Math.floor(map.mapCols / 2) - col) * minimapCellSize;
				ui.ctx.fillStyle = mapColor(wall); 
				ui.ctx.fillRect(x, y, minimapCellSize, minimapCellSize);
			}
		}
		
		let playerXMmu = xMvuToMmu(plr.xMU);
		let playerYMmu = yMvuToMmu(plr.yMU);
		
		drawCursor(playerXMmu, playerYMmu);
	};
	
	let drawRays = function(playerXMmu, playerYMmu) {
		let rayXMmu = xMvuToMmu(rayXMvu);
		let rayYMmu = yMvuToMmu(rayYMvu);
		
		ui.ctx.beginPath();
		ui.ctx.lineWidth = 2; 
		ui.ctx.strokeStyle = "white";
		ui.ctx.moveTo(playerXMmu, playerYMmu);
		ui.ctx.lineTo(rayXMmu, rayYMmu);
		ui.ctx.stroke();
	};
	
	let drawCursor = function(playerXMmu, playerYMmu) {
		ui.ctx.strokeStyle = "red";						
		
		let orientRad = plr.rotHorRD;
		let midVertX = playerXMmu + Math.cos(orientRad) * cursorSideMmu;
		let midVertY = playerYMmu + Math.sin(orientRad) * cursorSideMmu;
		
		let leftVertRad = orientRad + Math.PI * 1.25;
		let leftVertX = playerXMmu + Math.cos(leftVertRad) * cursorSideMmu;
		let leftVertY = playerYMmu + Math.sin(leftVertRad) * cursorSideMmu;
		
		let rightVertRad = orientRad - Math.PI * 1.25;
		let rightVertX = playerXMmu + Math.cos(rightVertRad) * cursorSideMmu;
		let rightVertY = playerYMmu + Math.sin(rightVertRad) * cursorSideMmu;
		
		ui.ctx.beginPath();
		ui.ctx.lineWidth = 2; 
		ui.ctx.strokeStyle = "red"; 
		ui.ctx.moveTo(leftVertX, leftVertY);
		ui.ctx.lineTo(midVertX, midVertY);
		ui.ctx.lineTo(rightVertX, rightVertY);
		ui.ctx.stroke();		
	};
	
	let ret = {};	
	ret.drawMinimap = drawMinimap;
	ret.init = function(uiRef, player, mapRef) {
		ui = uiRef;
		uts = $.raycast.units;
		plr = player;
		map = mapRef;
		
		return ret;
	};
		
	return ret;
	
})();