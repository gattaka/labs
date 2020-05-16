var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.LevelLoader = {
	createLevel: function() {		
		let mapW = 12;
		let mapH = 10;
		
		// mapa povrchů
		let grounds = [
			[1,2],[1,1],[1,4],[1,1],[1,2],[1,3],[1,0],[1,1],[1,4],[1,1],[1,3],[1,0],
			[1,3,0,28],[1,0,0,29],[1,1,0,29],[1,5,0,30],[1,2,0,28],[1,3,0,29],[1,2,0,30],[1,1,0,28],[1,5,0,30],[1,2,0,28],[1,3,0,45],[1,3],
			[0,0],[0,3],[0,5],[0,1],[0,5],[0,2],[0,0],[0,1],[0,4],[0,1],[1,3,0,21],[1,0],
			[0,3],[0,2],[0,3],[0,5],[0,2],[0,3],[0,3],[0,0,1,48],[0,1,1,45],[0,5],[1,2,0,22],[1,3],
			[0,0],[0,1],[0,4],[0,1],[0,3],[0,0],[0,0],[0,3,1,50],[0,5,1,47],[0,1],[1,5,0,23],[1,2],
			[0,3],[0,3],[0,0],[0,1],[0,5],[0,2],[0,3],[0,3],[0,2],[0,3],[1,5,0,21],[1,2],
			[0,0],[0,3],[0,5],[0,1],[0,5],[0,2],[0,0],[0,1],[0,4],[0,1],[1,3,0,21],[1,0],
			[0,3],[0,2],[0,3],[0,5],[0,2],[0,3],[0,3],[0,0,1,48],[0,1,1,45],[0,5],[1,2,0,22],[1,3],
			[0,0],[0,1],[0,4],[0,1],[0,3],[0,0],[0,0],[0,3,1,50],[0,5,1,47],[0,1],[1,5,0,23],[1,2],
			[0,3],[0,3],[0,0,1,48],[0,1,1,45],[0,5],[0,2],[0,3],[0,3],[0,2],[0,3],[1,5,0,21],[1,2],
		];
		
		// mapa objektů
		let objects = [
			,,,,,,,,,,,,
			,[1,0],,[0,0],,,,,,,,,
			,,,,,,,,,,,,
			,,,,,,,,,,,,
			,,,,,,,,,,,,
			,,,,,,,,,,,,
			,,,,,,,,,,,,
			,,,,,,,,,,,,
			,,,,,,,,,,,,
			,,,,,,,,,,,,
		];
		
		let walls = [
			[0,9],[0,0],[0,18],[0,16],[0,18],[0,0],[0,0],[0,18],[0,0],[0,0],[0,18],[0,13],
			[2,2],,,,,,,,,,,[0,29],
			[2,10],,,,,,,,,,,[0,27],
			[2,9],,,,[1,0],,,,,,,[0,21],
			[2,10],,,,,,,,,,,[0,1],
			[2,9],,,,,,,,,,,[0,1],
			[2,10],,,,,,,[1,0],,,,[0,21],
			[2,9],,,,,,,,,,,[0,29],
			[2,10],,[1,0],,,,,,,,,[0,27],
			[2,5],[2,10],[2,8],[2,10],[2,8],[2,10],[2,8],[2,10],[2,8],[2,10],[2,3],[0,1],
		];
		
		let innerGetGroundAtIndex = function(index) {
			let tile = grounds[index];
			if (tile == undefined)
				return undefined;				
			return {
				spriteId: tile[0],
				frameId: tile[1],
				layerSpriteId: tile[2],
				layerFrameId: tile[3]
			};
		};
		
		let innerGetObjectAtIndex = function(index) {
			let tile = objects[index];
			if (tile == undefined)
				return undefined;				
			return {
				spriteId: tile[0],
				frameId: tile[1]
			};
		};
		
		let innerGetWallAtIndex = function(index) {
			let tile = walls[index];
			if (tile == undefined)
				return undefined;				
			return {
				spriteId: tile[0],
				frameId: tile[1]
			};
		};
				
		return {
			getMapW: function() {
				return mapW;
			},
			getMapH: function() {
				return mapH;
			},
			getGroundAtIndex: function(index) {				
				return innerGetGroundAtIndex(index);
			},
			getGroundAtCoord: function(mx, my) {
				return innerGetGroundAtIndex(mx + my * mapW);
			},
			getObjectAtIndex: function(index) {				
				return innerGetObjectAtIndex(index);
			},
			getObjectAtCoord: function(mx, my) {				
				return innerGetObjectAtIndex(mx + my * mapW);
			},
			getWallAtIndex: function(index) {
				return innerGetWallAtIndex(index);
			},
			getWallAtCoord: function(mx, my) {				
				return innerGetWallAtIndex(mx + my * mapW);
			},
		}
	}	
};