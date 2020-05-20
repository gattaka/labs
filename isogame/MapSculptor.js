var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.MapSculptor = {	
	create: function(fills, level) {
		
		let mergeMatrix;
		let overlapMatrix;
		let fullTileType;	
		
		(function() {
			let TL=0,T=1,TR=2,L=3,M=4,R=5,BL=6,B=7,BR=8,OTL=9,OTR=10,OBL=11,OBR=12;
			let E=-1; // nedefinováno -- zatím budiž M
			fullTileType = M;
			mergeMatrix = [
				//  TL   T  TR   L   M   R  BL   B  BR OTL OTR OBL OBR
				[   TL,  T,  T,  L,  M,OBL,  L,OTR,  E,  M,OTR,OBL,OBR], // TL
				[     ,  T,  T,OBR,  M,OBL,OBR,  M,OBL,  M,  M,OBL,OBR], // T
				[     ,   , TR,OBR,  M,  R,  E,OTL,  R,OTL,  M,OBL,OBR], // TR
				[     ,   ,   ,  L,  M,  M,  L,OTR,OTR,  M,OTR,  M,OBR], // L
				[     ,   ,   ,   ,  M,  M,  M,  M,  M,  M,  M,  M,  M], // M
				[     ,   ,   ,   ,   ,  R,OTL,OTL,  R,OTL,  M,OBL,  M], // R
				[     ,   ,   ,   ,   ,   , BL,  B,  B,OTL,OTR,  M,OBR], // BL
				[     ,   ,   ,   ,   ,   ,   ,  B,  B,OTL,OTR,  M,  M], // B
				[     ,   ,   ,   ,   ,   ,   ,   , BR,OTL,OTR,OBL,  M], // BR			
				[     ,   ,   ,   ,   ,   ,   ,   ,   ,OTL,  M,  M,  M], // OTL
				[     ,   ,   ,   ,   ,   ,   ,   ,   ,   ,OTR,  M,  M], // OTR
				[     ,   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,OBL,  M], // OBL
				[     ,   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,OBR], // OBR
			];
			for (let i = 0; i < mergeMatrix.length; i++)
				for (let j = 0; j < mergeMatrix.length; j++)
					mergeMatrix[j][i] = mergeMatrix[i][j];
					
			let n = 1; // new
			let o = -1; // old
			let x = 0; // n/a
			overlapMatrix = [
			// new  TL   T  TR   L   M   R  BL   B  BR OTL OTR OBL OBR   // old
				[    n,  n,  x,  n,  n,  x,  x,  x,  x,  x,  x,  n,  n], // TL
				[    o,  n,  o,  x,  n,  x,  x,  x,  x,  x,  x,  n,  n], // T
				[    x,  n,  n,  x,  n,  n,  x,  x,  x,  x,  x,  n,  n], // TR
				[    o,  x,  x,  n,  n,  x,  o,  x,  x,  x,  n,  x,  n], // L
				[    o,  o,  o,  o,  n,  o,  o,  o,  o,  o,  o,  o,  o], // M
				[    x,  x,  o,  x,  n,  n,  x,  x,  o,  n,  x,  n,  x], // R
				[    x,  x,  x,  n,  n,  x,  n,  n,  x,  x,  n,  x,  n], // BL
				[    x,  x,  x,  x,  n,  x,  o,  n,  o,  n,  n,  x,  x], // B
				[    x,  x,  x,  x,  n,  n,  x,  n,  n,  n,  n,  x,  x], // BR			
				[    x,  x,  x,  x,  n,  o,  x,  o,  o,  n,  x,  x,  x], // OTL
				[    x,  x,  x,  o,  n,  x,  o,  o,  o,  x,  n,  x,  x], // OTR
				[    o,  o,  o,  x,  n,  o,  x,  x,  x,  x,  x,  n,  x], // OBL
				[    o,  o,  o,  o,  n,  x,  o,  x,  x,  x,  x,  x,  n], // OBR
			];
		})();		
		
		let getTypeByTile = function(groupId, spriteId, tileId) {
			let tiles = fills[groupId][spriteId].tiles;
			for (let type = 0; type < tiles.length; type++)
				if (tileId >= tiles[type][0] && tileId < tiles[type][1])
					return type;
			return -1;
		};
		
		let getRandomTileByType = function(groupId, spriteId, type) {
			let fill = fills[groupId][spriteId];
			let range = fill.tiles[type];	
			return range[0] + Math.floor(Math.random() * (range[1] - range[0]));
		};
		
		let placeGroundTile = function(index, spriteId, type) {	
			let tile = level.grounds[index];
			if (tile == undefined || tile.length == 0 || type == fullTileType) {
				// prázdné nebo se nastavuje plně překrývající tile
				level.grounds[index] = [spriteId, getRandomTileByType(0, spriteId, type)]; 
				return;
			}
						
			let layers = tile.length / 2;				
			for (let i = tile.length - 2; i >= 0; i -= 2) {				
				let layerSpriteId = tile[i];
				let layerType = getTypeByTile(0, layerSpriteId, tile[i + 1]);
				// bude nový tile překrývat danou vrstvu? Pokud ano, vrstvu smaž
				if (overlapMatrix[layerType][type] == 1) {
					tile.splice(i, 2);
					layers--;
					continue;
				}
				// je aktuální nový sprite stejný jako stávající v této vrstvě?
				if (i == tile.length - 2 && layerSpriteId == spriteId) {
					// zkus na něm provést merge
					let mergedType = mergeMatrix[layerType][type];
					// pokud se merge podařil, odeber vrstvu a změn type, který se bude přidávat
					if (mergedType != -1) {
						type = mergedType;
						tile.splice(i, 2);
						layers--;
						continue;
					}
				}	
			}		
			tile.push(spriteId);
			tile.push(getRandomTileByType(0, spriteId, type));		
		};
				
		let paintGround = function(mx, my, brush) {					
			let fromX = mx - brush.size;
			let toX = mx + brush.size;
			let fromY = my - brush.size;
			let toY = my + brush.size;
			for (let tx = fromX; tx <= toX; tx++) {
				if (tx >= level.mapW || tx < 0) continue;
				for (let ty = fromY; ty <= toY; ty++) {
					if (ty >= level.mapH || ty < 0) continue;
					let index = tx + ty * level.mapW;
					if (brush.mode == -1) {
						level.grounds[index] = undefined;
					} else {
						let type;
						if (tx == fromX && ty == fromY) type = 0; // levý horní roh
						else if (tx == fromX && ty == toY) type = 6; // levý dolní roh
						else if (tx == toX && ty == fromY) type = 2; // pravý horní roh
						else if (tx == toX && ty == toY) type = 8; // pravý dolní roh
						else if (tx == fromX) type = 3; // levá strana
						else if (tx == toX) type = 5; // pravá strana
						else if (ty == fromY) type = 1; // horní strana
						else if (ty == toY) type = 7; // dolní strana
						else type = 4; // prostředek					
						placeGroundTile(index, brush.spriteId, type);
					}
				}
			}					
		};
		
		let paintWall = function(mx, my, brush) {
			if (mx >= level.mapW || mx < 0 || my >= level.mapH || my < 0) 
				return;
			let index = mx + my * level.mapW;
			if (brush.mode == -1) {
				level.walls[index] = undefined;
			} else {
				level.walls[index] = [brush.spriteId, brush.tileId];
			}
		};
		
		return {
			paint: function(mx, my, brush) {				
				switch (brush.groupId) {
				case 0:
					paintGround(mx, my, brush);
					break;
				case 3:
					paintWall(mx, my, brush);
					break;
				}
			},
			
		};
	}				
};