/**
 * Všechny definice spritů, jejich frame animací apod. jsou zde
 * mimo tento soubor by neměly být žádná konkrétní čísla snímků,
 * velikosti spritů apod.	
 */ 
var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.SpritePalette = {		
	create: function(spriteLoader) {	
		let cellW = 64;
		let cellH = 32;		
		let grounds = [];
		let characters = [];
		
		let addGround = function(ranges) {			
			grounds.push([ranges.tl, ranges.t, ranges.tr, 
						ranges.l, ranges.m, ranges.r,
						ranges.bl, ranges.b, ranges.br,
						ranges.otl, ranges.otr, ranges.obl, ranges.obr]);			
		};
		
		let addCharacter = function(directionFrames, loops, loopsFrames, loopsMirror) {			
			characters.push({
				// počet všech snímků v jednom směru
				directionFrames: directionFrames,
				// počáteční frame animací
				loops: loops,		
				// počty frame animací
				loopsFrames: loopsFrames,
				// které animace mají smyčku typu tam-zpět
				loopsMirror: loopsMirror, 
				frameDuration: 100,
			});
		};
		
		// --- Grounds --- 
		
		["grass_medium_64x32.png", "stone_path_64x32.png", "grass_dry_64x32.png", "forest_ground_64x32.png", "sand_64x32.png", 
		 "dirt_dark_64x32.png"].forEach((g) => {		
			spriteLoader.queueTexture(0, "./sprites/grounds/" + g, 8, 7, cellW, cellH, 0, 0);
			addGround({m: [0, 20], r: [20, 24], b: [24, 28], t: [28, 32], l: [32, 36],
						otr: [36, 38], obr: [38, 40], otl: [40, 42], obl: [42, 44],
						tr: [44, 46], br: [46, 48], tl: [48, 50], bl: [50, 52]
			});
		});		
		spriteLoader.queueTexture(0, "./sprites/grounds/32_flagstone_tiles.png", 4, 8, cellW, cellH, 0, 0);
		addGround({m: [0, 32]});
		
		// --- Characters ---
		// Stance (4 frames), Walk (8 frames), Attack (4 frames), Cast (4 frames), Block (2 frames), Hit and Die (6 frames), Aim Crossbow (4 frames)
		spriteLoader.queueTexture(1, "./sprites/characters/skeleton_0.png", 32, 8, 128, 128, 64, 128 - 32);	
		addCharacter(32, [0, 4, 8, 4, 4, 2, 6], [4, 8, 4, 4, 2, 6, 4], [true, false, false, false, false, false, false], 100);
		
		// --- Objects ---
		
		for (let i = 1; i <= 6; i++)
			spriteLoader.queueTexture(2, "./sprites/objects/weed0" + i + ".png", 1, 1, 128, 64, 34, 25);
		for (let i = 1; i <= 2; i++)
			spriteLoader.queueTexture(2, "./sprites/objects/swirl0" + i + ".png", 1, 1, 128, 64, 34, 30);		
		for (let i = 1; i <= 5; i++)
			spriteLoader.queueTexture(2, "./sprites/objects/grasses0" + i + ".png", 1, 1, 128, 64, 34, 30);				
		
		// --- Walls ---
		
		spriteLoader.queueTexture(3, "./sprites/walls/iso_dungeon_walls_by_pfunked.png", 8, 4, 128, 128, 32, 64 + 16);
		for (let i = 1; i <= 8; i++) 
			spriteLoader.queueTexture(3, "./sprites/objects/pine-none0" + i + ".png", 1, 1, 256, 256, 64 + 50, 128 + 64);
		spriteLoader.queueTexture(3, "./sprites/walls/barricade_tiles.png", 4, 3, 128, 128, 32, 64 + 16);	
		spriteLoader.load();
		
		// public
		return {										
			getGround: function(groundId) {
				return grounds[groundId];
			},			
			getCharacter: function(characterId) {
				return characters[characterId];
			},
			getCellW: function() {
				return cellW;
			},
			getCellH: function() {
				return cellH;
			},
		}
	}	
};