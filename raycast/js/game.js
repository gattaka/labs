var $ = $ || {};
$.raycast = $.raycast || {};
$.raycast.game = (function() {	
		
	let uts;	// units
	let ui;		// UI
	let map;	// map
	let mnp;	// minimap
	let ctr;	// controls
	let mth;	// math
	
	let canvas;
	let ctx;
	let width;
	let height;
	let heightHalf;
	
	let imageData;
	let buf;
	let buf8;
	let data32;
	
	let angleSpan;	
		
	let stats;		
	let lastTime = 0;
	
	// Player
	let player;

	// rozsah v jakém hráč vidí	
	let angleRange;
	let angleIncr;

	let lensMultiplier = 15;

	let collisionPadding = 1;

	let loaded = false;
	let loadingProgress = 0;
	let textures = [];

	let darkPrecision = 10;
	let darkMinVal = 0;
	let darkMaxVal = 300;
	let darkStep = (darkMaxVal - darkMinVal) / darkPrecision;
	// multiplier forma
	let darkStepMult = 1 / darkStep;

	let innerInit = function() {
		stats = new Stats();
		stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
		document.body.appendChild(stats.dom);
		
		uts = $.raycast.units;
		map = $.raycast.map.init();
		mth = $.raycast.math;
		
		player = {
			// pozice a orientace hráče na mapě
			xMU: map.mapCols / 2 * uts.cluToMvu,
			yMU: map.mapRows / 2 * uts.cluToMvu,
			xCL: -1,
			yCL: -1,
			rotHorDG: 0,
			rotHorRD: 0,
			rotVerRD: 0,		
		};
		
		mnp = $.raycast.minimap.init(ui.minimapCanvas, player, map);		
		ctr = $.raycast.controls.init(ui, player);
		
		ctx = canvas.getContext("2d");
		width = canvas.width;
		height = canvas.height;
		heightHalf = height / 2;
		
		imageData = ctx.getImageData(0, 0, width, height);
		buf = new ArrayBuffer(imageData.data.length);
		buf8 = new Uint8ClampedArray(buf);
		data32 = new Uint32Array(buf);
		
		angleRange = 50 * uts.rad90 / 90;
		angleIncr = angleRange / width;
		
		textures.push({ src: "../sprites/wall1.jpg", width: 128, height: 128 });
		textures.push({	src: "../sprites/wall2.jpg", width: 128, height: 128 });
		textures.push({	src: "../sprites/bookcase.png",	width: 128,	height: 128	});		
		textures.push({ src: "../sprites/wall1_torch.jpg", width: 128, height: 128, frames: 4, delay: 200, shadow: false});

		for (let i = 0; i < textures.length; i++) {
			let texture = textures[i];		
			
			// Převod MVU na IMG jednotky
			texture.xMvuToImg = texture.width / uts.cluToMvu;
			texture.yMvuToImg = texture.height / uts.cluToMvu;
			texture.frame = 0;
			texture.time = 0;
			texture.size = texture.width * texture.height;
			textureImg = new Image();
			(function() {
				let seafImg = textureImg;
				let seafIndex = i;
				textureImg.onload = function() {
					let tex = textures[seafIndex];					
					tex.data32 = [];		
					let spriteXOffset = 0;
					let spriteYOffset = 0;
					if (typeof tex.frames === 'undefined')
						tex.frames = 1;
					if (typeof tex.shadow === 'undefined')
						tex.shadow = true;
					tex.frame = 0;
					tex.time = 0;
					for (let f = 0; f < tex.frames; f++) {	
						tex.data32[f] = [];
						if (f > 0)
							spriteXOffset += tex.width;
						if (spriteXOffset == textureImg.width) {
							spriteYOffset += tex.height;
							spriteXOffset = 0;
						}
						for (let i = 0; i < darkPrecision; i++) {
							let lightMult = 1 - (darkMinVal + i * darkStep) / darkMaxVal;
							let textureCanvas = document.createElement("canvas");
							textureCanvas.width = texture.width;
							textureCanvas.height = texture.height;
							let textureCtx = textureCanvas.getContext("2d");
							textureCtx.drawImage(seafImg, spriteXOffset, spriteYOffset, tex.width, tex.height, 0, 0, tex.width, tex.height);
							let texImageData = textureCtx.getImageData(0, 0, tex.width, tex.height);
							// https://stackoverflow.com/questions/16679158/javascript-imagedata-typed-array-read-whole-pixel
							let texBuf8 = texImageData.data.buffer;
							let texData32 = new Uint32Array(texBuf8);
							tex.data32[f][i] = texData32;
							
							if (lightMult < 1 && tex.shadow) {
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
					}
					loadingProgress++;
					if (loadingProgress == textures.length)
						loaded = true;
				}
			})();
			textureImg.src = texture.src;
		}

		window.requestAnimationFrame(draw);
	};

	let draw = function(time) {
		stats.begin();
		let delay = time - lastTime;
		lastTime = time;
		for (let i = 0; i < textures.length; i++) {
			let tex = textures[i];
			if (tex.frames == 1) continue;
			tex.time += delay;
			tex.frame = (tex.frame + Math.floor(tex.time / tex.delay)) % tex.frames;
			tex.time = tex.time % tex.delay;
		}
		
		updatePlayer();
		mnp.drawMinimap();
		drawScene();
		stats.end();
		window.requestAnimationFrame(draw);
	};

	let updatePlayer = function() {
		let dxMU = Math.cos(player.rotHorRD) * ctr.walkSpeedForwardMvu + Math.cos(player.rotHorRD - uts.rad90) * ctr.walkSpeedSideMvu;
		let dyMU = Math.sin(player.rotHorRD) * ctr.walkSpeedForwardMvu + Math.sin(player.rotHorRD - uts.rad90) * ctr.walkSpeedSideMvu;
		let draftxCL = Math.floor((player.xMU + dxMU + Math.sign(dxMU) * collisionPadding) / uts.cluToMvu);
		let draftyCL = Math.floor((player.yMU + dyMU + Math.sign(dyMU) * collisionPadding) / uts.cluToMvu);
		if (player.xCL == -1) player.xCL = draftxCL;
		if (player.yCL == -1) player.yCL = draftyCL;
		if (draftyCL >= 0 && draftyCL < map.mapRows && draftxCL >= 0 && draftxCL <= map.mapCols) {
			if (map.map[draftyCL][draftxCL] == 0) {			
				player.xMU += dxMU;
				player.yMU += dyMU;
				player.xCL = draftxCL;
				player.yCL = draftyCL;
			} else if (map.map[player.yCL][draftxCL] == 0){
				player.xMU += dxMU;
				player.xCL = draftxCL;
			} else if (map.map[draftyCL][player.xCL] == 0){
				player.yMU += dyMU;
				player.yCL = draftyCL;
			}
		}
	};

	let getLines = function(y, x) {
		if (y < 0 || y == map.mapRows || x < 0 || x == map.mapCols) return [];
		return map.lines[y][x];
	};
	
	let checkLines = function(lines, q, s, result) {
		let i = 0, len = lines.length;
		while (i < len) {
			let line = lines[i];
			let p = line.p;
			let r = line.r;

			// If r × s = 0 and (q − p) × r = 0, then the two lines are collinear
			// If r × s = 0 and (q − p) × r ≠ 0, then the two lines are parallel and non-intersecting.
			// If r × s ≠ 0 and 0 ≤ t ≤ 1 and 0 ≤ u ≤ 1, the two line segments meet at the point p + t r = q + u s.
			// Otherwise, the two line segments are not parallel but do not intersect.					
			// t = (q − p) × s / (r × s)
			// u = (p − q) × r / (s × r)
			let rsCross = mth.vecCross(r, s);
			let t = mth.vecCross(mth.vecDiff(q, p), s) / rsCross;
			if (t >= 0 && t <= 1) {
				let u = mth.vecCross(mth.vecDiff(p, q), r) / mth.vecCross(s, r);
				if (u >= 0 && u <= 1 && rsCross != 0) {
					// hit -- ale je nejbližší?
					let point = mth.vecAdd(p, mth.vecScal(r, t));
					let distanceMvu = Math.sqrt(Math.pow(player.xMU - point.x, 2) + Math.pow(player.yMU - point.y, 2))
					if (!result.hit || result.distanceMvu > distanceMvu) 
						result = {
							hit: true,
							value: line.value, // TODO povrch stěny, ne celé kostky
							distanceMvu: distanceMvu,
							point: point,
							p: p,
						};
				}
			}
			++i;
		}
		return result;
	};

	let checkHit = function(ray) {
		// https://www.mathsisfun.com/algebra/vectors-cross-product.html
		// https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect		
		let q = mth.vec(ray.x, ray.y);
		let s = mth.vec(ray.w, ray.h);
		let result = {
			hit: false,
		};
		let dx = Math.sign(ray.dx);
		let dy = Math.sign(ray.dy);
		let xLimit = dx > 0 ? map.mapCols - 1 : 0;
		let yLimit = dy > 0 ? map.mapRows - 1 : 0;
		let x = player.xCL;
		let y = player.yCL;
		let xmLimit = x - dx;
		let ymLimit = y - dy;
		while (x != xLimit && dx != 0 || y != yLimit && dy != 0) {
			x += x == xLimit ? 0 : dx;
			y += y == yLimit ? 0 : dy;
			result = checkLines(map.lines[y][x], q, s, result);
			
			if (dy != 0) {
				let cx = x;
				while (cx != xmLimit) {
					cx -= dx;
					result = checkLines(map.lines[y][cx], q, s, result);
				}
			}

			if (dx != 0) {
				let cy = y;
				while (cy != ymLimit) {
					cy -= dy;
					result = checkLines(map.lines[cy][x], q, s, result);
				}
			}

			if (result.hit) break;
		}

		if (typeof result.p !== 'undefined') {
			// tohle má smysl počítat jen jednou a to až u toho nejbližšího hit záznamu
			result.lineOriginDistanceMvu = Math.sqrt(Math.pow(result.p.x - result.point.x, 2) + Math.pow(result.p.y - result.point.y, 2));
		}

		return result;
	};

	let processRay = function(angleRad) {
		let dCos = Math.cos(angleRad);
		let dSin = Math.sin(angleRad);
		let w = dCos * map.mapRadiusMvu;
		let h = dSin * map.mapRadiusMvu;		
		return {
			angleRad: angleRad,
			x: player.xMU,
			y: player.yMU,
			x2: w + player.xMU,
			y2: h + player.yMU,
			w: w,
			h: h,
			dx: dCos,
			dy: dSin,
		};
	};

	let drawScene = function() {
		// musí být nahrané textury
		if (!loaded)
			return;

		let angleStartRad = player.rotHorRD - angleRange / 2;
		let angleIncrRad = angleIncr;
		
		let x = 0;
		let angleRad = angleStartRad;
		let hitResult;

		// pro každý sloupec obrazovky
		while (x < width) {
			let ray = processRay(angleRad);			
			hitResult = checkHit(ray);
			if (hitResult.hit) {
				let distanceMvu = Math.sqrt(Math.pow(player.xMU - hitResult.point.x, 2) + Math.pow(player.yMU - hitResult.point.y, 2));
				let texture = textures[hitResult.value - 1];
				
				let lightMult = distanceMvu;
				if (lightMult < darkMinVal) { 
					lightMult = darkMinVal; 
				} else if (lightMult > darkMaxVal - 1) {
					lightMult = darkMaxVal - 1;
				}
				let texLight = texture.shadow ? Math.floor((lightMult - darkMinVal) * darkStepMult) : 0;
				let texData32 = texture.data32[texture.frame][texLight];
				
				// https://math.stackexchange.com/questions/859760/calculating-size-of-an-object-based-on-distance				
				let mvuToScu = lensMultiplier * 100 / distanceMvu;
				
				// let sourceWidthImg = texture.xMvuToImg / mvuToScu;
				let sourceHeightImg = texture.height;
				let sourceXImg = texture.xMvuToImg * hitResult.lineOriginDistanceMvu;
				let targetHeightScu = Math.floor(sourceHeightImg / texture.yMvuToImg * mvuToScu);
				let targetYScu = Math.floor(height / 2 - targetHeightScu / 2) + player.rotVerRD;	
				let ratio = sourceHeightImg / targetHeightScu;
				let texX = Math.floor(sourceXImg);
				
				// pro každý řádek sloupce
				let minTargetYScu = targetYScu;
				let maxTargetYScu = targetYScu + targetHeightScu;
				let y = 0;
				while (y < height) {
					let index = y * width + x;
					if (y < minTargetYScu) {						
						let val = Math.floor(.2 * 0xFF * (heightHalf - y) / heightHalf);
						putPixel32(index, 0xFF << 24 | val << 16 | val << 8 | val);
					} else if (y > maxTargetYScu) {
						let val = Math.floor(.2 * 0xFF * (y - heightHalf) / heightHalf);
						putPixel32(index, 0xFF << 24 | val << 16 | val << 8 | val);
					} else {
						let texY = Math.floor((y - minTargetYScu) * ratio);
						let texIdx = texY * texture.width + texX;						
						putPixel32(index, texData32[texIdx]);
					}
					++y;
				}
			} else {
				let y = 0;
				while (y < height) { 	
					putPixel32(y * width + x, 0);
					++y;
				}
			}
			++x;
			angleRad += angleIncrRad;
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

		init: function(uiRef) {			
			ui = uiRef;
			canvas = ui.canvas;
			angleSpan = ui.angleSpan;								
			
			innerInit();
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
	
})();