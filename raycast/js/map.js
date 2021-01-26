var $ = $ || {};
$.raycast = $.raycast || {};
$.raycast.map = (function() {	
	
	let ret = {};
	
	// Wolfenstein typ -- dílky mapy mají konstantní velikost, 
	// nemají patra a jsou vždy na sebe kolmé
	// 0 = prázdno
	// 1 = díl mapy (kostka) se zdmi typu 1
	ret.map = [
		[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
		[ ,1, , , , , , , , , , , ,1, ],
		[ ,1, , , , , , , , , , , ,1, ],
		[ ,1, , ,2, , , , , ,2, , ,1, ],
		[1,1, , , , , , , , , , , ,1,1],
		[1, , , , , , , , , , , , , ,1],
		[1, , , , , , , , , , , , , ,1],
		[1, , , ,2, , , , , ,2, , , ,1],
		[1, , , ,1, , , , , ,1, , , ,1],
		[1, , , ,1, , , , , ,1, , , ,1],
		[1, , , ,1, , , , , ,1, , , ,1],
		[1, , , ,1, , , , , ,1, , , ,1],
		[1,1,1,1,1, , , , , ,1,1,1,1,1],
		[1, , , ,1, , , , , ,1, , , ,1],
		[1, , , ,2, , , , , ,2, , , ,1],
		[1, , , , , , , , , , , , , ,1],
		[1,1,1,1,1, , , , , ,1,1,1,1,1],
		[1,1, , , , , , , , , , , ,1,1],
		[1,3, , , , , , , , , , , ,3,1],
		[1,1, , , , , , , , , , , ,1,1],
		[ ,1, , ,2, , , , , ,2, , ,1, ],
		[1,1, , , , , , , , , , , ,1,1],
		[1,3, , , , , , , , , , , ,3,1],
		[1,1, , , , , , , , , , , ,1,1],
		[ ,1, , ,2, , , , , ,2, , ,1, ],
		[1,1, , , , , , , , , , , ,1,1],
		[1,3, , , , , , , , , , , ,3,1],
		[1,1, , , , , , , , , , , ,1,1],
		[ ,1,1,1,1,1,1,1,1,1,1,1,1,1, ],
	];
	
	ret.mapRows = ret.map.length;
	ret.mapCols = ret.map[0].length;
	ret.lines = [];	
	
	let createLine = function(x, y, w, h, value) {
		return { 
			x: x, y: y, w: w, h: h,
			value: value,
			p: $.raycast.math.vec(x, y),
			r: $.raycast.math.vec(w, h),
		};
	};
	
	ret.init = function() {
		let cluToMvu = $.raycast.units.cluToMvu;
				
		ret.mapRadiusMvu = Math.sqrt(ret.mapRows * ret.mapRows + ret.mapCols * ret.mapCols) * cluToMvu; 
		
		for (let yClu = 0; yClu < ret.mapRows; yClu++) {
			let row = ret.map[yClu];
			let linesRow = ret.lines[yClu];
			linesRow = [];
			ret.lines[yClu] = linesRow;
			for (let xClu = 0; xClu < ret.mapCols; xClu++) {
				let value = row[xClu];
				if (typeof value === 'undefined' || value == 0) {
					row[xClu] = 0;
					linesRow[xClu] = [];
					continue;
				}
				// přímky buňky -- je potřeba aby byly zachovány normály, 
				// které poslouží k odlišení počátku přímky od jejího konce
				// normála je vždy ve směru doleva od přímky se směrem nahoru
				// ^ ---> |
				// |	  |
				// | <--- v				
				let lineLeft = createLine(xClu * cluToMvu, yClu * cluToMvu, 0, cluToMvu, value);
				let lineRight = createLine((xClu + 1) * cluToMvu, (yClu + 1) * cluToMvu, 0, -cluToMvu, value);
				let lineTop = createLine(xClu * cluToMvu, (yClu + 1) * cluToMvu, cluToMvu, 0, value);
				let lineBottom = createLine((xClu + 1) * cluToMvu, yClu * cluToMvu, -cluToMvu, 0, value);
				linesRow[xClu] = [lineLeft, lineRight, lineTop, lineBottom];
			}
		}
		return ret;
	};
	
	return ret;
	
})();