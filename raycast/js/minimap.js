var $ = $ || {};
$.raycast = $.raycast || {};
$.raycast.minimap = (function() {	
		
	let uts;	// units		
	let plr;	// player
	let map;	// map
	
	// minimap cursor
	let cursorSideMmu = 10;	
	
	let minimapCtx;
	let minimapWidth;
	let minimapHeight;
	let minimapHalfWidth;
	let minimapHalfHeight;
	
	let mapColor = function(id, light) {
		if (id == 0) 		
			return "black";
		let hue = id * 255 / 10;
		if (typeof light === "undefined")
			return "hsl(" + hue + ", 100%, 50%)";
		return "hsl(" + hue + ", 100%, " + light + "%)";
	};
	
	let xMvuToMmu = function(xMvu) {
		return minimapHalfWidth - (map.mapCols / 2 * uts.cluToMvu - xMvu) * uts.mvuToMmu;
	};
	
	let yMvuToMmu = function(yMvu) {
		return minimapHalfHeight - (map.mapRows / 2 * uts.cluToMvu - yMvu) * uts.mvuToMmu;
	};
	
	let drawMinimap = function() {
		minimapCtx.fillStyle = "black";
		minimapCtx.fillRect(0, 0, minimapWidth, minimapHeight);

		let minimapCellSize = uts.cluToMvu * uts.mvuToMmu;

		for (let row = 0; row < map.mapRows; row++) {	
			let rowData = map.map[row];
			let y = minimapHalfHeight - (Math.floor(map.mapRows / 2) - row) * minimapCellSize - minimapCellSize / 2;
			for (let col = 0; col < map.mapCols; col++) {
				let colData = rowData[col];
				if (colData == 0)
					continue;
				let x = minimapHalfWidth - (Math.floor(map.mapCols / 2) - col) * minimapCellSize;
				minimapCtx.fillStyle = mapColor(colData); 
				minimapCtx.fillRect(x, y, minimapCellSize, minimapCellSize);
			}
		}
		
		let playerXMmu = xMvuToMmu(plr.xMU);
		let playerYMmu = yMvuToMmu(plr.yMU);
		
		drawCursor(playerXMmu, playerYMmu);
	};
	
	let drawRays = function(playerXMmu, playerYMmu) {
		let rayXMmu = xMvuToMmu(rayXMvu);
		let rayYMmu = yMvuToMmu(rayYMvu);
		
		minimapCtx.beginPath();
		minimapCtx.lineWidth = 2; 
		minimapCtx.strokeStyle = "white";
		minimapCtx.moveTo(playerXMmu, playerYMmu);
		minimapCtx.lineTo(rayXMmu, rayYMmu);
		minimapCtx.stroke();
	};
	
	let drawCursor = function(playerXMmu, playerYMmu) {
		minimapCtx.strokeStyle = "red";						
		
		let orientRad = plr.rotHorRD;
		let midVertX = playerXMmu + Math.cos(orientRad) * cursorSideMmu;
		let midVertY = playerYMmu + Math.sin(orientRad) * cursorSideMmu;
		
		let leftVertRad = orientRad + Math.PI * 1.25;
		let leftVertX = playerXMmu + Math.cos(leftVertRad) * cursorSideMmu;
		let leftVertY = playerYMmu + Math.sin(leftVertRad) * cursorSideMmu;
		
		let rightVertRad = orientRad - Math.PI * 1.25;
		let rightVertX = playerXMmu + Math.cos(rightVertRad) * cursorSideMmu;
		let rightVertY = playerYMmu + Math.sin(rightVertRad) * cursorSideMmu;
		
		minimapCtx.beginPath();
		minimapCtx.lineWidth = 2; 
		minimapCtx.strokeStyle = "red"; 
		minimapCtx.moveTo(leftVertX, leftVertY);
		minimapCtx.lineTo(midVertX, midVertY);
		minimapCtx.lineTo(rightVertX, rightVertY);
		minimapCtx.stroke();		
	};
	
	let ret = {};	
	ret.drawMinimap = drawMinimap;
	ret.init = function(minimapCanvas, player, mapRef) {
		minimapCtx = minimapCanvas.getContext("2d");
		minimapWidth = minimapCanvas.width;
		minimapHeight = minimapCanvas.height;
		minimapHalfWidth = minimapWidth / 2; 
		minimapHalfHeight = minimapHeight / 2;	

		uts = $.raycast.units;
		plr = player;
		map = mapRef;
		
		return ret;
	};
		
	return ret;
	
})();