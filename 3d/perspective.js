var $ = $ || {};
$.perspectiveBuilder = (function() {

	let PIHalf = Math.PI / 2;

	let canvas = document.getElementById("perspectiveCanvas");
	let ctx = canvas.getContext("2d");

	let width = canvas.width;
	let height = canvas.height;

	let writeAs32Bit = true;

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
	//	 let mvuToMmu = 1.2;

	// Wolfenstein typ -- dílky mapy mají konstantní velikost, 
	// nemají patra a jsou vždy na sebe kolmé
	// 0 = prázdno
	// 1 = díl mapy (kostka) se zdmi typu 1
	let map = [
		[ ,1,1,1,1,1,1,1,1,1,1,1,1, ],
		[ ,1, , , , , , , , , , ,1, ],
		[ ,1, , , , , , , , , , ,1, ],
		[ ,1, , ,2, , , , ,2, , ,1, ],
		[1,1, , , , , , , , , , ,1,1],
		[1, , , , , , , , , , , , ,1],
		[1, , , , , , , , , , , , ,1],
		[1, , , ,2, , , , ,2, , , ,1],
		[1, , , ,1, , , , ,1, , , ,1],
		[1, , , ,1, , , , ,1, , , ,1],
		[1, , , ,1, , , , ,1, , , ,1],
		[1, , , ,1, , , , ,1, , , ,1],
		[1,1,1,1,1, , , , ,1,1,1,1,1],
		[1, , , ,1, , , , ,1, , , ,1],
		[1, , , ,2, , , , ,2, , , ,1],
		[1, , , , , , , , , , , , ,1],
		[1,1,1,1,1,1,1,1,1,1,1,1,1,1],
	];
	let mapRows = map.length;
	let mapCols = map[0].length;

	let mapRadiusMvu = Math.sqrt(mapRows * mapRows + mapCols * mapCols) * cluToMvu;
	let lines = [];

	// pozice a orientace hráče na mapě
	let playerXMvu = mapCols / 2 * cluToMvu;
	let playerYMvu = mapRows / 2 * cluToMvu;
	let playerHOrient = PIHalf * 3; // 270° (0-360)
	//let playerVOrient = 270; // 0-360	
	let playerXClu = -1;
	let playerYClu = -1;

	// rozsah v jakém hráč vidí
	let angleRangeDeg = PIHalf;
	let angleIncrDeg = angleRangeDeg / width;
	let lensMultiplier = 10;

	let collisionPadding = 1;

	let walkSpeedStepMvu = 2;
	let walkSpeedForwardMvu = 0;
	let walkSpeedSideMvu = 0;

	let mouseHSensitivity = 0.8;
	
	let showLight = true;

	let loaded = false;
	let loadingProgress = 0;
	let textures = [];

	let fpsSpan = document.getElementById("fpsSpan");
	let frames = 0;
	let fpsTime = 0;

	let toRad = function(angle) {
		return PIHalf * angle / 90;
	};

	let init = function() {
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("keyup", onKeyUp);

		canvas.addEventListener("mousemove", function(e) {
			playerHOrient = toRad(mouseHSensitivity * (e.clientX - width / 2));
			//playerVOrient = mouseVSensitivity * (height / 2 - e.clientY);
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

		for (let i = 0; i < textures.length; i++) {
			let texture = textures[i];
			let textureCanvas = document.createElement("canvas");
			textureCanvas.width = texture.width;
			textureCanvas.height = texture.height;
			
			// Převod MVU na IMG jednotky
			texture.xMvuToImg = texture.width / cluToMvu;
			texture.yMvuToImg = texture.height / cluToMvu;
			texture.canvas = textureCanvas;
			textureImg = new Image();
			(function() {
				let seafImg = textureImg;
				let seafIndex = i;
				textureImg.onload = function() {
					let tex = textures[seafIndex];
					let textureCtx = texture.canvas.getContext("2d");
					textureCtx.drawImage(seafImg, 0, 0);
					let texImageData = textureCtx.getImageData(0, 0, tex.width, tex.height);
					// https://stackoverflow.com/questions/16679158/javascript-imagedata-typed-array-read-whole-pixel
					let texBuf = texImageData.data.buffer;
					tex.data32 = new Uint32Array(texBuf);
					loadingProgress++;
					if (loadingProgress == textures.length)
						loaded = true;
				}
			})();
			textureImg.src = texture.src;
		}

		for (let yClu = 0; yClu < map.length; yClu++) {
			let row = map[yClu];
			for (let xClu = 0; xClu < row.length; xClu++) {
				let value = row[xClu];
				if (typeof value === 'undefined' || value == 0) {
					row[xClu] = 0;
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
				lines.push(lineLeft);
				lines.push(lineRight);
				lines.push(lineTop);
				lines.push(lineBottom);
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
		let dPlayerXMvu = Math.cos(playerHOrient) * walkSpeedForwardMvu + Math.cos(playerHOrient - PIHalf) * walkSpeedSideMvu;
		let dPlayerYMvu = Math.sin(playerHOrient) * walkSpeedForwardMvu + Math.sin(playerHOrient - PIHalf) * walkSpeedSideMvu;
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

	let checkHit = function(rayXMvu, rayYMvu, playerXMvu, playerYMvu) {
		// https://www.mathsisfun.com/algebra/vectors-cross-product.html
		// https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect		
		let ray = { x: playerXMvu, y: playerYMvu, w: rayXMvu - playerXMvu, h: rayYMvu - playerYMvu };
		let result = {
			hit: false,
			point: {
				x: rayXMvu,
				y: rayYMvu
			}
		};
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];

			let p = vec(line.x, line.y);
			let r = vec(line.w, line.h);
			let q = vec(ray.x, ray.y);
			let s = vec(ray.w, ray.h);

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

		let angleStartRad = playerHOrient - angleRangeDeg / 2;
		let angleIncrRad = angleIncrDeg;

		let angleRad = angleStartRad;
		let hitResult;

		// pro každý sloupec obrazovky
		for (let x = 0; x < width; x++, angleRad += angleIncrRad) {

			ray = processRay(playerXMvu, playerYMvu, angleRad);
			hitResult = checkHit(ray.x, ray.y, playerXMvu, playerYMvu);
			if (hitResult.hit) {
				let distanceMvu = Math.sqrt(Math.pow(playerXMvu - hitResult.point.x, 2) + Math.pow(playerYMvu - hitResult.point.y, 2));
				let texture = textures[hitResult.value - 1];
				
				let lightMultiplier;
				if (showLight) {
					// https://stackoverflow.com/questions/6615002/given-an-rgb-value-how-do-i-create-a-tint-or-shade/6615053
					let baseMvu = 300;
					let minVal = 0.3;
					let maxVal = 1;
					lightMult = Math.max(minVal, Math.min(maxVal, 1 - distanceMvu / baseMvu));
				}
				
				// https://math.stackexchange.com/questions/859760/calculating-size-of-an-object-based-on-distance				
				let mvuToScu = lensMultiplier * 100 / distanceMvu;
				
				// let sourceWidthImg = texture.xMvuToImg / mvuToScu;
				let sourceHeightImg = texture.height;
				let sourceXImg = texture.xMvuToImg * hitResult.lineOriginDistanceMvu;
				let targetHeightScu = Math.floor(sourceHeightImg / texture.yMvuToImg * mvuToScu);
				let targetYScu = Math.floor(height / 2 - targetHeightScu / 2); // + playerVOrient;	
				let ratio = sourceHeightImg / targetHeightScu;
				let texX = Math.floor(sourceXImg);
				
				// pro každý řádek sloupce
				for (let y = 0; y < height; y++) {
					let index = y * width + x;
					if (y < targetYScu || y > targetYScu + targetHeightScu) {
						putPixel32(index, 0);
					} else {
						let texY = Math.floor((y - targetYScu) * ratio);
						let texIdx = texY * texture.width + texX;
						let texData32 = texture.data32;
						if (showLight) {						
							let color = texData32[texIdx];
							let r = lightMult * (texData32[texIdx] & 0xFF);
							let g = lightMult * (texData32[texIdx] >> 8 & 0xFF);
							let b = lightMult * (texData32[texIdx] >> 16 & 0xFF);
							let a = texData32[texIdx] >> 24 & 0xFF;
							color = (a << 24) | (b << 16) | (g << 8) | r;
							putPixel32(index, color);
						} else {
							putPixel32(index, texData32[texIdx]);
						}
					}
				}
			} else {
				for (let y = 0; y < height; y++)
					putPixel32(y * width + x, 0);
			}
		}

		if (writeAs32Bit)
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
			console.log("viewAngle changed from '" + angleRangeDeg + "' to '" + newValue + "'");
			angleRangeDeg = toRad(newValue);
			angleIncrDeg = angleRangeDeg / width;
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