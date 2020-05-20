var $ = $ || {};
$.GJSLibAStar = {	

	// A* hledání cesty - Minimální struktura pro popis bodu:
	//
	// let point = {
	//     id: 0 
	// }
	findPath: function(aPoint, bPoint, heuristicFunc, distanceFunc, neighborsFunc) {				
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
		let openSet = new Set();
		openSet.add(aPoint);
		
		let cameFrom = [];
		
		let constructList = function() {
			let path = [];
			let point = bPoint;
			while (point.id != aPoint.id) {
				point = cameFrom[point.id];
				path.push(point);
			}
			return path;
		};		
		
		let gScore = [];
		gScore[aPoint.id] = 0; 		
		
		let fScore = [];
		fScore[aPoint.id] = heuristicFunc(aPoint, bPoint); 
		
		while (openSet.size > 0) {			
			let cPoint;
			let min = -1;
			for (let point of openSet) {
				let score = fScore[point.id];
				if (min == -1 || score < min) {
					cPoint = point;
					min = score;
				}
			}
			
			if (cPoint.id == bPoint.id)
				return constructList();

			openSet.delete(cPoint);						
			
			let neighbors = neighborsFunc(cPoint);
			
			for (let n = 0; n < neighbors.length; n++) {
				let nPoint = neighbors[n];
				let tScore = gScore[cPoint.id] + distanceFunc(cPoint, nPoint); 
				if (gScore[nPoint.id] == undefined || tScore < gScore[nPoint.id]) {				
					cameFrom[nPoint.id] = cPoint;
					gScore[nPoint.id] = tScore;
					fScore[nPoint.id] = gScore[nPoint.id] + heuristicFunc(nPoint, bPoint); ;						
					if (!openSet.has(nPoint)) 						
						openSet.add(nPoint);					
				}				
			}						
		}
		
		// cesta neexistuje
		return [];
	}
};