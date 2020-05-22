var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.LevelManager = {
	createNewLevelBlueprint: function(mapW, mapH) {
		return {
			mapW: mapW,
			mapH: mapH,
			baseLight: 10,
			grounds:[],
			objects: [],
			walls: [],
			lights: [],
		};
	},
	
	createLevelReader: function(levelBlueprint) {		
		let lightQuality = $.GIsoGame.Configuration.lightQuality;
		let mapW = levelBlueprint.mapW;
		let mapH = levelBlueprint.mapH;
		let baseLight = levelBlueprint.baseLight;
		
		// mapa povrchů
		let grounds = levelBlueprint.grounds;
		
		// mapa objektů
		let objects = levelBlueprint.objects;
		
		// mapa kolizí
		let walls = levelBlueprint.walls;
		
		// list světel
		let lights = levelBlueprint.lights;
		
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
		
		let innerGetLightAtCoord = function(mx, my) {
			let light = baseLight;			
			for (i = 0; i < lights.length; i++) {
				let l = lights[i];				
				let dx = Math.abs(l.mx - mx);
				let dy = Math.abs(l.my - my);
				let product = dx * dx + dy * dy;
				if (product > l.lightReach * l.lightReach)
					continue;
				light += (l.lightReach - Math.sqrt(product)) / l.lightReach * l.light;
				if (light >= 100)
					return 100;				
			}
			return light;
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
			getLightAtCoord: function(mx, my) {
				return innerGetLightAtCoord(mx, my);
			},
		}
	}	
};