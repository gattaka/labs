var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.LevelLoader = {
	createLevel: function(level) {		
		let mapW = level.mapW;
		let mapH = level.mapH;
		
		// mapa povrchů
		let grounds = level.grounds;
		
		// mapa objektů
		let objects = level.objects;
		
		let walls = level.walls;
		
		let innerGetGroundAtIndex = function(index) {
			return grounds[index];
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