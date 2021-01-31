var $ = $ || {};
$.raycast = $.raycast || {};
$.raycast.map = (function() {	
	
	let ret = {};
	
	// Wolfenstein typ -- dílky mapy mají konstantní velikost, 
	// nemají patra a jsou vždy na sebe kolmé
	// 0 = prázdno
	// 1 = díl mapy (kostka) se zdmi typu 1
	let blueprint = [
		[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
		[  , 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1,  ], 
		[  , 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1,  ], 
		[  , 1,  ,  , 2,  ,  ,  ,  ,  , 2,  ,  , 1,  ], 
		[ 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1, 1], 
		[ 1,  ,  ,  ,  ,  ,  ,-4,-4,  ,  ,  ,  ,  , 1], 
		[ 1,  ,  ,  ,  ,  ,  ,-4,-4,  ,  ,  ,  ,  , 1], 
		[ 1,  ,  ,  , 6,  ,  ,  ,  ,  , 6,  ,  ,  , 1], 
		[ 1,  ,  ,  , 1,  ,  ,  ,  ,  , 1,  ,  ,  , 1], 
		[ 1,  ,  ,  , 1,  ,  ,  ,  ,  , 1,  ,  ,  , 1], 
		[ 1,  ,  ,  , 1,  ,  ,  ,  ,  , 1,  ,  ,  , 1], 
		[ 1,  ,  ,  , 1,  ,  ,  ,  ,  , 1,  ,  ,  , 1], 
		[ 1, 1, 1, 1, 4,  ,  ,  ,  ,  , 4, 1, 1, 1, 1], 
		[ 1,  ,  ,  , 1,  ,  ,  ,  ,  , 1,  ,  ,  , 1], 
		[ 1,  ,  ,  , 6,  ,  ,  ,  ,  , 6,  ,  ,  , 1], 
		[ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1], 
		[ 1, 1, 1, 1, 6,  ,  ,  ,  ,  , 6, 1, 1, 1, 1], 
		[ 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1, 1], 
		[ 1, 3,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 3, 1], 
		[ 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1, 1], 
		[  , 1,  ,  , 2,  ,  ,  ,  ,  , 2,  ,  , 1,  ], 
		[ 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1, 1], 
		[ 1, 3,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 3, 1], 
		[ 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1, 1], 
		[  , 1,  ,  , 2,  ,  ,  ,  ,  , 2,  ,  , 1,  ], 
		[ 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1, 1], 
		[ 1, 3,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 3, 1], 
		[ 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1, 1], 
		[  , 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  ], 
	];
	ret.mapRows = blueprint.length;
	ret.mapCols = blueprint[0].length;
	
	let defaultFloor = 4;
	ret.walls = [];
	ret.floors = new Uint8Array(ret.mapRows * ret.mapCols);
	
	ret.lines = [];	
	
	let createLine = function(x, y, w, h, value) {
		return { 
			x: x, y: y, w: w, h: h,
			value: value,
			p: $.raycast.math.vec(x, y),
			r: $.raycast.math.vec(w, h),
		};
	};
	
	let hasNoWall = function(x, y) {
		let value = blueprint[y][x];
		return typeof value === 'undefined' || value <= 0;
	};
	
	ret.init = function() {
		let cluToMvu = $.raycast.units.cluToMvu;
				
		ret.mapRadiusMvu = Math.sqrt(ret.mapRows * ret.mapRows + ret.mapCols * ret.mapCols) * cluToMvu; 
		let linescount = 0;
		for (let yClu = 0; yClu < ret.mapRows; yClu++) {
			let wallsRow = new Uint8Array(ret.mapCols);
			let floorsRow = new Uint8Array(ret.mapCols);
			ret.walls[yClu] = wallsRow;
			let blueprintRow = blueprint[yClu];
			let linesRow = ret.lines[yClu];
			linesRow = [];
			ret.lines[yClu] = linesRow;
			for (let xClu = 0; xClu < ret.mapCols; xClu++) {
				let value = blueprintRow[xClu];
				if (typeof value === 'undefined' || value < 0) {
					ret.floors[yClu * ret.mapCols + xClu] = value < 0 ? value * -1 : defaultFloor;
					wallsRow[xClu] = 0;
					linesRow[xClu] = [];
					continue;
				} else {
					wallsRow[xClu] = value;
					floorsRow[xClu] = 0;
				}
				// přímky buňky -- je potřeba aby byly zachovány normály, 
				// které poslouží k odlišení počátku přímky od jejího konce
				// normála je vždy ve směru doleva od přímky se směrem nahoru
				// ^ ---> |
				// |	  |
				// | <--- v		
				let cellLines = [];
				linesRow[xClu] = cellLines;
				if (xClu > 0 && hasNoWall(xClu - 1, yClu)) {
					cellLines.push(createLine(xClu * cluToMvu, yClu * cluToMvu, 0, cluToMvu, value)); // left
					linescount++;
				}
				if (xClu < ret.mapCols - 1 && hasNoWall(xClu + 1, yClu)) {
					cellLines.push(createLine((xClu + 1) * cluToMvu, (yClu + 1) * cluToMvu, 0, -cluToMvu, value)); // right
					linescount++;
				}
				if (yClu < ret.mapRows - 1 && hasNoWall(xClu, yClu + 1)) {
					cellLines.push(createLine(xClu * cluToMvu, (yClu + 1) * cluToMvu, cluToMvu, 0, value)); // top
					linescount++;
				}
				if (yClu > 0 && hasNoWall(xClu, yClu - 1)) {
					cellLines.push(createLine((xClu + 1) * cluToMvu, yClu * cluToMvu, -cluToMvu, 0, value)); // bottom	 
					linescount++;
				}				
			}
		}
		console.log(linescount); // 552
		return ret;
	};
	
	return ret;
	
})();