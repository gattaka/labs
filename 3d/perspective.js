var $ = $ || {};
$.perspectiveBuilder = (function() {	

	let canvas = document.getElementById("perspectiveCanvas");
	let ctx = canvas.getContext("2d");

	let width = canvas.width;
	let height = canvas.height;
	
	let imageData = ctx.getImageData(0, 0, width, height);
	let buf = new ArrayBuffer(imageData.data.length);
	let buf8 = new Uint8ClampedArray(buf);
	let data32 = new Uint32Array(buf);

	// Jednotky
	// CLU -- cell unit, jednotka buňky mapy = 1
	// MVU -- map unit, jednotka virtuální mapy
	// MMU -- minimapk unit, jednotka zobrazení minimapy
	// SCU -- scena unit, jednotka zobrazení scény

	// kolik jednotek má dílek mapy
	let cluToMvu = 20;
	let mvuToClu = 1 / cluToMvu;
	//	 let mvuToMmu = 1.2;

	// Wolfenstein typ -- dílky mapy mají konstantní velikost, 
	// nemají patra a jsou vždy na sebe kolmé
	// 0 = prázdno
	// 1 = díl mapy (kostka) se zdmi typu 1
	let map = [
		[ ,1,1,1,1,1,1,1,1,1,1,1,1,1, ],
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
	let mapRows = map.length;
	let mapCols = map[0].length;

	let mapRadiusMvu = Math.sqrt(mapRows * mapRows + mapCols * mapCols) * cluToMvu;
	let lines = [];

	let rad90 = Math.PI / 2;
	let rad180 = rad90 * 2;
	let rad270 = rad90 * 3;
	
	// pozice a orientace hráče na mapě
	let playerXMvu = mapCols / 2 * cluToMvu;
	let playerYMvu = mapRows / 2 * cluToMvu;
	let playerHOrient = rad270; // 270° (0-360)
	let playerVOrient = rad270; // 270° (0-360)
	let playerXClu = -1;
	let playerYClu = -1;

	// rozsah v jakém hráč vidí
	let angleRange = 50 * rad90 / 90;
	let angleIncr = angleRange / width;
	let lensMultiplier = 15;

	let collisionPadding = 1;

	let walkSpeedStepMvu = 2;
	let walkSpeedForwardMvu = 0;
	let walkSpeedSideMvu = 0;

	let mouseHSensitivity = 0.5;
	let mouseVSensitivity = 1;

	let loaded = false;
	let loadingProgress = 0;
	let textures = [];

	let fpsSpan = document.getElementById("fpsSpan");
	let frames = 0;
	let fpsTime = 0;
	
	let darkPrecision = 10;
	let darkMinVal = 0;
	let darkMaxVal = 300;
	let darkStep = (darkMaxVal - darkMinVal) / darkPrecision;
	// multiplier forma
	let darkStepMult = 1 / darkStep;

	let toRad = function(angle) {
		return rad90 * angle / 90;
	};

	let init = function() {
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("keyup", onKeyUp);

		canvas.addEventListener("mousemove", function(e) {
			let angle = mouseHSensitivity * (e.clientX - width / 2);
			if (angle < 0) angle = 360 + angle;			
			//console.log(angle);
			playerHOrient = toRad(angle);
			playerVOrient = mouseVSensitivity * (height / 2 - e.clientY);
		}, false);

		textures.push({
			src: "data:image/jpeg;base64,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",
			width: 128,
			height: 128,
		});
		textures.push({
			src: "data:image/jpeg;base64,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",
			width: 128,
			height: 128,
		});
		textures.push({
			src: "data:image/png;base64,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",
			width: 128,
			height: 128,
		});		

		for (let i = 0; i < textures.length; i++) {
			let texture = textures[i];		
			
			// Převod MVU na IMG jednotky
			texture.xMvuToImg = texture.width / cluToMvu;
			texture.yMvuToImg = texture.height / cluToMvu;
			texture.size = texture.width * texture.height;
			textureImg = new Image();
			(function() {
				let seafImg = textureImg;
				let seafIndex = i;
				textureImg.onload = function() {
					let tex = textures[seafIndex];					
					tex.data32 = [];					
					for (let i = 0; i < darkPrecision; i++) {
						let lightMult = 1 - (darkMinVal + i * darkStep) / darkMaxVal;
						let textureCanvas = document.createElement("canvas");
						textureCanvas.width = texture.width;
						textureCanvas.height = texture.height;
						let textureCtx = textureCanvas.getContext("2d");
						textureCtx.drawImage(seafImg, 0, 0);
						let texImageData = textureCtx.getImageData(0, 0, tex.width, tex.height);
						// https://stackoverflow.com/questions/16679158/javascript-imagedata-typed-array-read-whole-pixel
						let texBuf8 = texImageData.data.buffer;
						let texData32 = new Uint32Array(texBuf8);
						tex.data32[i] = texData32;
						
						if (lightMult < 1) {
							for (let index = 0; index < tex.size; index++) {
								let color = texData32[index];
								// https://stackoverflow.com/questions/6615002/given-an-rgb-value-how-do-i-create-a-tint-or-shade/6615053
								let r = lightMult * (color & 0xFF);
								let g = lightMult * (color >> 8 & 0xFF);
								let b = lightMult * (color >> 16 & 0xFF);
								let a = color >> 24 & 0xFF;
								texData32[index] = (a << 24) | (b << 16) | (g << 8) | r;
							}
						}
						
						texImageData.data.set(texBuf8);
						textureCtx.putImageData(texImageData, 0, 0);
					}
					loadingProgress++;
					if (loadingProgress == textures.length)
						loaded = true;
				}
			})();
			textureImg.src = texture.src;
		}

		for (let yClu = 0; yClu < map.length; yClu++) {
			let row = map[yClu];
			let linesRow = lines[yClu];
			linesRow = [];
			lines[yClu] = linesRow;
			for (let xClu = 0; xClu < row.length; xClu++) {
				let value = row[xClu];
				if (typeof value === 'undefined' || value == 0) {
					row[xClu] = 0;
					//linesRow[xClu] = [];
					continue;
				}
				// přímky buňky -- je potřeba aby byly zachovány normály, 
				// které poslouží k odlišení počátku přímky od jejího konce
				// normála je vždy ve směru doleva od přímky se směrem nahoru
				// ^ ---> |
				// |	  |
				// | <--- v				
				let lineLeft = { x: xClu * cluToMvu, y: yClu * cluToMvu, w: 0, h: cluToMvu, value: value };
				let lineRight = { x: (xClu + 1) * cluToMvu, y: (yClu + 1) * cluToMvu, w: 0, h: -cluToMvu, value: value };
				let lineTop = { x: xClu * cluToMvu, y: (yClu + 1) * cluToMvu, w: cluToMvu, h: 0, value: value };
				let lineBottom = { x: (xClu + 1) * cluToMvu, y: yClu * cluToMvu, w: -cluToMvu, h: 0, value: value };
				linesRow[xClu] = [lineLeft, lineRight, lineTop, lineBottom];
			}
		}

		window.requestAnimationFrame(draw);
	};

	let onKeyDown = function(event) {
		switch (event.keyCode) {
			case 87:
				walkSpeedForwardMvu = walkSpeedStepMvu;
				break;
			case 83:
				walkSpeedForwardMvu = -walkSpeedStepMvu;
				break;
			case 65:
				walkSpeedSideMvu = walkSpeedStepMvu;
				break;
			case 68:
				walkSpeedSideMvu = -walkSpeedStepMvu;
				break;
		}
	};

	let onKeyUp = function(event) {
		switch (event.keyCode) {
			case 87:
			case 83:
				walkSpeedForwardMvu = 0;
				break;
			case 65:
			case 68:
				walkSpeedSideMvu = 0;
				break;
		}
	};

	let updateFPS = function(timestamp) {
		frames++;
		let time = timestamp;
		if (time - fpsTime > 1000) {
			fpsSpan.innerHTML = frames;
			fpsTime = time;
			frames = 0;
		}
	};

	let draw = function(timestamp) {
		updatePlayer();
		drawScene();
		updateFPS(timestamp);
		window.requestAnimationFrame(draw);
	};

	let updatePlayer = function() {
		let dPlayerXMvu = Math.cos(playerHOrient) * walkSpeedForwardMvu + Math.cos(playerHOrient - rad90) * walkSpeedSideMvu;
		let dPlayerYMvu = Math.sin(playerHOrient) * walkSpeedForwardMvu + Math.sin(playerHOrient - rad90) * walkSpeedSideMvu;
		let draftPlayerXClu = Math.floor((playerXMvu + dPlayerXMvu + Math.sign(dPlayerXMvu) * collisionPadding) / cluToMvu);
		let draftPlayerYClu = Math.floor((playerYMvu + dPlayerYMvu + Math.sign(dPlayerYMvu) * collisionPadding) / cluToMvu);
		if (playerXClu == -1) playerXClu = draftPlayerXClu;
		if (playerYClu == -1) playerYClu = draftPlayerYClu;
		if (draftPlayerYClu >= 0 && draftPlayerYClu < mapRows && draftPlayerXClu >= 0 && draftPlayerXClu <= mapCols) {
			if (map[draftPlayerYClu][draftPlayerXClu] == 0) {			
				playerXMvu += dPlayerXMvu;
				playerYMvu += dPlayerYMvu;
				playerXClu = draftPlayerXClu;
				playerYClu = draftPlayerYClu;
			} else if (map[playerYClu][draftPlayerXClu] == 0){
				playerXMvu += dPlayerXMvu;
				playerXClu = draftPlayerXClu;
			} else if (map[draftPlayerYClu][playerXClu] == 0){
				playerYMvu += dPlayerYMvu;
				playerYClu = draftPlayerYClu;
			}
		}
	};

	let vecCross = function(a, b) {
		// a × b = ax * by − ay * bx
		return a.x * b.y - a.y * b.x;
	};

	let vecScal = function(a, t) {
		// a * t = [ax * t, ay * t]
		return { x: a.x * t, y: a.y * t };
	};

	let vecDiff = function(a, b) {
		// a - b = [ax - bx, ay - by]
		return { x: a.x - b.x, y: a.y - b.y };
	};

	let vecAdd = function(a, b) {
		// a + b = [ax - bx, ay + by]
		return { x: a.x + b.x, y: a.y + b.y };
	};

	let vec = function(x, y) {
		return { x: x, y: y };
	};

	let checkHit = function(rayXMvu, rayYMvu, playerXMvu, playerYMvu, clip) {
		// https://www.mathsisfun.com/algebra/vectors-cross-product.html
		// https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect		
		let ray = { x: playerXMvu, y: playerYMvu, w: rayXMvu - playerXMvu, h: rayYMvu - playerYMvu };
		let q = vec(ray.x, ray.y);
		let s = vec(ray.w, ray.h);
		let result = {
			hit: false,
			point: {
				x: rayXMvu,
				y: rayYMvu
			}
		};
		let x0 = 0;
		let y0 = 0;
		let mx = mapCols;
		let my = mapRows;
		
		switch (clip) {
			case 0: y = playerYClu; break;
			case 1: x = playerXClu; break;
			case 2: my = playerYClu; break;
			case 3: mx = playerXClu; break;
		}
		
		for (let x = x0; x < mx; x++) {
			for (let y = y0; y < my; y++) {	
				let cellLines = lines[y][x];
				if (typeof cellLines === 'undefined')
					continue;		
				for (let i = 0; i < 4; i++) {					
					let line = cellLines[i];
					
					let p = vec(line.x, line.y);
					let r = vec(line.w, line.h);

					// t = (q − p) × s / (r × s)
					let t = vecCross(vecDiff(q, p), s) / vecCross(r, s);

					// u = (p − q) × r / (s × r)
					let u = vecCross(vecDiff(p, q), r) / vecCross(s, r);

					// If r × s = 0 and (q − p) × r = 0, then the two lines are collinear
					// If r × s = 0 and (q − p) × r ≠ 0, then the two lines are parallel and non-intersecting.
					// If r × s ≠ 0 and 0 ≤ t ≤ 1 and 0 ≤ u ≤ 1, the two line segments meet at the point p + t r = q + u s.
					// Otherwise, the two line segments are not parallel but do not intersect.
					if (vecCross(r, s) != 0 && t >= 0 && t <= 1 && u >= 0 && u <= 1) {
						// hit -- ale je nejbližší?
						let hitPoint = vecAdd(p, vecScal(r, t));
						let distanceMvu = Math.sqrt(Math.pow(playerXMvu - hitPoint.x, 2) + Math.pow(playerYMvu - hitPoint.y, 2))
						if (!result.hit || result.distanceMvu > distanceMvu) {
							result = {
								hit: true,
								value: line.value, // TODO povrch stěny, ne celé kostky
								distanceMvu: distanceMvu,
								point: hitPoint,
								lineOriginDistanceMvu: Math.sqrt(Math.pow(p.x - hitPoint.x, 2) + Math.pow(p.y - hitPoint.y, 2))
							};
						}
					}
				}
			}
		}

		return result;
	};

	let processRay = function(playerXMvu, playerYMvu, angleRad) {
		return {
			x: playerXMvu + Math.cos(angleRad) * mapRadiusMvu,
			y: playerYMvu + Math.sin(angleRad) * mapRadiusMvu
		};
	};

	let drawScene = function() {
		// musí být nahrané textury
		if (!loaded)
			return;

		let angleStartRad = playerHOrient - angleRange / 2;
		let angleIncrRad = angleIncr;
		
		// clipping segment
		let clip;
		if (angleStartRad >= 0 && angleStartRad < rad90) {
			clip = 0;
		} else if (angleStartRad >= rad90 && angleStartRad < rad180) {
			clip = 1;
		} else if (angleStartRad >= rad180 && angleStartRad < rad270) {
			clip = 2;
		} else if (angleStartRad >= rad270 && angleStartRad < 0) {
			clip = 3;
		}

		let angleRad = angleStartRad;
		let hitResult;

		// pro každý sloupec obrazovky
		for (let x = 0; x < width; x++, angleRad += angleIncrRad) {			
			let ray = processRay(playerXMvu, playerYMvu, angleRad);			
			hitResult = checkHit(ray.x, ray.y, playerXMvu, playerYMvu, clip);
			if (hitResult.hit) {
				let distanceMvu = Math.sqrt(Math.pow(playerXMvu - hitResult.point.x, 2) + Math.pow(playerYMvu - hitResult.point.y, 2));
				let texture = textures[hitResult.value - 1];
				
				let lightMult = distanceMvu;
				if (lightMult < darkMinVal) { 
					lightMult = darkMinVal; 
				} else if (lightMult > darkMaxVal - 1) {
					lightMult = darkMaxVal - 1;
				}
				let texLight = Math.floor((lightMult - darkMinVal) * darkStepMult);
				let texData32 = texture.data32[texLight];
				
				// https://math.stackexchange.com/questions/859760/calculating-size-of-an-object-based-on-distance				
				let mvuToScu = lensMultiplier * 100 / distanceMvu;
				
				// let sourceWidthImg = texture.xMvuToImg / mvuToScu;
				let sourceHeightImg = texture.height;
				let sourceXImg = texture.xMvuToImg * hitResult.lineOriginDistanceMvu;
				let targetHeightScu = Math.floor(sourceHeightImg / texture.yMvuToImg * mvuToScu);
				let targetYScu = Math.floor(height / 2 - targetHeightScu / 2) + playerVOrient;	
				let ratio = sourceHeightImg / targetHeightScu;
				let texX = Math.floor(sourceXImg);
				
				// pro každý řádek sloupce
				let minTargetYScu = targetYScu;
				let maxTargetYScu = targetYScu + targetHeightScu;
				for (let y = 0; y < height; y++) {
					let index = y * width + x;
					if (y < minTargetYScu || y > maxTargetYScu) {
						putPixel32(index, 0);
					} else {
						let texY = Math.floor((y - minTargetYScu) * ratio);
						let texIdx = texY * texture.width + texX;						
						putPixel32(index, texData32[texIdx]);
					}
				}
			} else {
				for (let y = 0; y < height; y++)					
					putPixel32(y * width + x, 0);
			}
		}
		
		imageData.data.set(buf8);
		ctx.putImageData(imageData, 0, 0);
	}
 
	// https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
	// https://jsperf.com/canvas-pixel-manipulation
	let putPixel32 = function(index, pixel32) {
		data32[index] = pixel32;
	};

	return {

		start: function() {
			init();
		},

		changeViewAngle: function(value) {
			if (isNaN(value))
				return;
			let newValue = Number(value);
			console.log("viewAngle changed from '" + angleRange + "' to '" + newValue + "'");
			angleRange = toRad(newValue);
			angleIncr = angleRange / width;
		},

		changeLensSize: function(value) {
			if (isNaN(value))
				return;
			let newValue = Number(value);
			console.log("lensSize changed from '" + lensMultiplier + "' to '" + newValue + "'");
			lensMultiplier = newValue;
		},

		changeShowLight: function(value) {
			console.log("showLight changed from '" + showLight + "' to '" + value + "'");
			showLight = value;
		},

	};
});