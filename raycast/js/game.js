var $ = $ || {};
$.raycast = $.raycast || {};
$.raycast.game = (function() {	
		
	let uts;	// units
	let ui;		// UI
	let map;	// map
	let mnp;	// minimap
	let ctr;	// controls
	let mth;	// math
		
	let stats;		
	let lastTime = 0;
	
	// Player
	let player;	
	let objects = [];

	// Cache
	let fvCache;
	let skyXCache;
	let skyYCache;

	// Skybox
	let skybox;

	// focal length
	let foc = 300;
	let focfoc = foc * foc;
	let extrusionHeight = 16;
	let collisionPadding = 1;
	
	let rotVec;

	let loaded = false;
	let loadingProgress = 0;
	let textures = [];

	let darkPrecision = 10;
	let darkMinVal = 0;
	let darkMaxVal = 300;
	let darkStep = (darkMaxVal - darkMinVal) / darkPrecision;
	// multiplier forma
	let darkStepMult = 1 / darkStep;

	let initSkybox = function() {
		skybox = {
			tex: textures[8],
			sxWidthToDeg: 90 / ui.width,			
		};
		skybox.degToTexWidth = skybox.tex.width / 180;
		skybox.yRatio = skybox.tex.height / ui.heightHalf;		
		skybox.texData32 = skybox.tex.data32[0][0];
	};

	let innerInit = function() {
		stats = new Stats();
		stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
		document.body.appendChild(stats.dom);
		
		fvCache = new Float32Array(ui.width);	
		skyXCache = new Float32Array(ui.width);
		skyYCache = new Float32Array(ui.width);
		
		uts = $.raycast.units;
		map = $.raycast.map.init();
		mth = $.raycast.math;
		
		rotVec = mth.rotateVectorFactory(0, 0, 0);
		
		player = {
			// pozice a orientace hráče na mapě
			xMU: map.mapCols / 2 * uts.cluToMvu,
			yMU: map.mapRows / 2 * uts.cluToMvu,
			xCL: -1,
			yCL: -1,
			rotHorDG: 270,
			rotHorRD: uts.rad270,
			angleChanged: true,
		};
		
		mnp = $.raycast.minimap.init(ui, player, map);		
		ctr = $.raycast.controls.init(ui, player);		
		
		angleRange = 50 * uts.rad90 / 90;
		angleIncr = angleRange / ui.width;
		
		objects.push({
			texture: 9,
			x: 7.5 * uts.cluToMvu, // MU
			y: 5.5 * uts.cluToMvu, // MU
			w: 1 * uts.cluToMvu,
			h: 1 * uts.cluToMvu,
		});
		
		for (let t = 0; t < textures.length; t++) {
			let texture = textures[t];		
			
			// Převod MVU na IMG jednotky
			texture.xMvuToImg = texture.width / uts.cluToMvu;
			texture.yMvuToImg = texture.height / uts.cluToMvu;
			texture.frame = 0;
			texture.time = 0;
			texture.size = texture.width * texture.height;
			texture.widthHalf = texture.width / 2;
			texture.heightHalf = texture.height / 2; 
			textureImg = new Image();
			(function(tex, textureImg) {
				textureImg.onload = function() {			
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
							textureCtx.drawImage(textureImg, spriteXOffset, spriteYOffset, tex.width, tex.height, 0, 0, tex.width, tex.height);
							let texImageData = textureCtx.getImageData(0, 0, tex.width, tex.height);
							// https://stackoverflow.com/questions/16679158/javascript-imagedata-typed-array-read-whole-pixel
							let texBuf8 = texImageData.data.buffer;
							let texData32 = new Uint32Array(texBuf8);
							tex.data32[f][i] = texData32;
							
							if (lightMult < 1 && tex.shadow) {
								for (let index = 0; index < tex.size; index++) {
									let color = texData32[index];
									if (color == texture.alphaKey) {
										texData32[index] = color;
									} else {
										// https://stackoverflow.com/questions/6615002/given-an-rgb-value-how-do-i-create-a-tint-or-shade/6615053
										let r = lightMult * (color & 0xFF);
										let g = lightMult * (color >> 8 & 0xFF);
										let b = lightMult * (color >> 16 & 0xFF);
										let a = color >> 24 & 0xFF;
										texData32[index] = (a << 24) | (b << 16) | (g << 8) | r;
									}
								}
							}
							
							texImageData.data.set(texBuf8);
							textureCtx.putImageData(texImageData, 0, 0);
							
							if (!tex.shadow)
								break;
						}
					}
					
					if (texture.sky) 
						initSkybox();					
					
					loadingProgress++;
					if (loadingProgress == textures.length)
						loaded = true;
				}
			})(texture, textureImg);
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
			if (tex.frames > 1) {
				tex.time += delay;
				tex.frame = (tex.frame + Math.floor(tex.time / tex.delay)) % tex.frames;
				tex.time = tex.time % tex.delay;
			}
		}
		ctr.updateSpeed();
		updatePlayer();
		if (ctr.showMinimap) {
			mnp.drawMinimap();
		} else {
			drawScene();
		}
		stats.end();
		window.requestAnimationFrame(draw);
	};

	let updatePlayer = function() {
		if (player.angleChanged) {
			player.angleChanged = false;
			rotVec = mth.rotateVectorFactory(player.rotHorRD - uts.rad90, 0, 0);
		}
		let dxMU = Math.cos(player.rotHorRD) * ctr.walkSpeedForwardMvu + Math.cos(player.rotHorRD - uts.rad90) * ctr.walkSpeedSideMvu;
		let dyMU = Math.sin(player.rotHorRD) * ctr.walkSpeedForwardMvu + Math.sin(player.rotHorRD - uts.rad90) * ctr.walkSpeedSideMvu;
		let draftxCL = Math.floor((player.xMU + dxMU + Math.sign(dxMU) * collisionPadding) / uts.cluToMvu);
		let draftyCL = Math.floor((player.yMU + dyMU + Math.sign(dyMU) * collisionPadding) / uts.cluToMvu);
		if (player.xCL == -1) player.xCL = draftxCL;
		if (player.yCL == -1) player.yCL = draftyCL;
		if (draftyCL >= 0 && draftyCL < map.mapRows && draftxCL >= 0 && draftxCL <= map.mapCols) {			
			if (map.walls[draftyCL * map.mapCols + draftxCL] == 0) {			
				player.xMU += dxMU;
				player.yMU += dyMU;
				player.xCL = draftxCL;
				player.yCL = draftyCL;
			} else if (map.walls[player.yCL * map.mapCols + draftxCL] == 0){
				player.xMU += dxMU;
				player.xCL = draftxCL;
			} else if (map.walls[draftyCL * map.mapCols + player.xCL] == 0){
				player.yMU += dyMU;
				player.yCL = draftyCL;
			}
		}
	};

	let getLines = function(y, x) {
		if (y < 0 || y == map.mapRows || x < 0 || x == map.mapCols) return [];
		return map.lines[y * map.mapCols + x];
	};
	
	let checkLines = function(lines, q, s, result) {
		let i = 0, len = lines.length;
		while (i < len) {
			let line = lines[i];
			let p = line.p;
			let r = line.r;

			// If r × s = 0 and (q − p) × r = 0, then the two lines are collinear
			// If r × s = 0 and (q − p) × r ≠ 0, then the two lines are parallel and non-intersecting.
			// If r × s ≠ 0 and 0 ≤ t ≤ 1 and 0 ≤ u ≤ 1, the two line segments meet at the point p + t.r = q + u.s.
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
							// bod ve kterém se paprsek setkal se stěnou (počátkem je hráč)
							point: point,
							// vzdálenost od hráče k bodu protnutí (délka vektoru hráč-point)
							distanceMvu: distanceMvu,
							// vektor linie, na které došlo k protnutí paprsku (počátkem je začátek linie)
							// je potřeba pro zjištění offsetu textury při zobrazování pruhu stěny
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
		let dx = Math.sign(ray.w);
		let dy = Math.sign(ray.h);
		let xLimit = dx > 0 ? map.mapCols - 1 : 0;
		let yLimit = dy > 0 ? map.mapRows - 1 : 0;
		let x = player.xCL;
		let y = player.yCL;
		let xmLimit = x - dx;
		let ymLimit = y - dy;
		while (x != xLimit && dx != 0 || y != yLimit && dy != 0) {
			x += x == xLimit ? 0 : dx;
			y += y == yLimit ? 0 : dy;
			result = checkLines(map.lines[y * map.mapCols + x], q, s, result);
			
			if (dy != 0) {
				let cx = x;
				while (cx != xmLimit) {
					cx -= dx;
					result = checkLines(map.lines[y * map.mapCols + cx], q, s, result);
				}
			}

			if (dx != 0) {
				let cy = y;
				while (cy != ymLimit) {
					cy -= dy;
					result = checkLines(map.lines[cy * map.mapCols + x], q, s, result);
				}
			}

			if (result.hit) break;
		}
		
		result.objects = [];
		
		// bod kamery K
		let xk = ray.x;
		let yk = ray.y;
		// vektor hit paprsku r
		let xr = ray.w;
		let yr = ray.h;		
		let o = 0, len = objects.length;
		while (o < len) {			
			let object = objects[o];
			// střed sprite objektu P		
			let xp = object.x;
			let yp = object.y;
			// vektor c spojující P a K
			let xc = xp - xk;
			let yc = yp - yk;			
			// vektor q který je kolmí na vektor c
			let xq = -yc;
			let yq = xc;				
			
			// bod S, který je průsečíkem vektorů r a q
			// S = K + a * r			
			// S = P + b * q
			let b = (yr * (xp - xk) + xr * (yk - yp)) / (yq * xr - xq * yr);			
			let xs = xp + b * xq;
			let ys = yp + b * yq;			
			
			let a;			
			if (xr == 0) {
				a = (ys - yk) / yr;
			} else if (yr == 0) {
				a = (xs - xk) / xr;
			} else {
				a = (xp + b * xq - xk) / xr;
			}			
			// pokud je a < 0, pak je protnutí vektorů za zády hráče
			if (a < 0) {
				++o; continue;
			}		

			// vzdálenost S od středu sprinte P
			let dsp = Math.sqrt(Math.pow(xp - xs, 2) + Math.pow(yp - ys, 2));
			// Je sprite v paprsku?
			if (dsp > object.w / 2) {
				++o; continue;
			}
				
			// vzdálenost bodu S od kamery K
			let dks = Math.sqrt(Math.pow(xk - xs, 2) + Math.pow(yk - ys, 2));	
			// není objekt krytý stěnou?
			if (typeof result.p === 'undefined' || dks < result.distanceMvu) {
				result.objects.push({
					object: object,
					xs: xs,
					ys: ys,
					dks: dks,		
					dsp: Math.sign(b) * dsp + object.w / 2
				});
			}
			++o;
		}

		if (typeof result.p !== 'undefined') {
			// tohle má smysl počítat jen jednou a to až u toho nejbližšího hit záznamu
			// vzdálenost od počátku stěny k bodu průniku stěny paprskem (bude použito na výpočet offsetu textury stěny)
			result.lineOriginDistanceMvu = Math.sqrt(Math.pow(result.p.x - result.point.x, 2) + Math.pow(result.p.y - result.point.y, 2));
		}

		return result;
	};

	let processRay = function(sx) {
		// vytvoří paprsek od pozice hráče směrem ke stávajímu sloupci plátna
		let w = sx;
		let h = foc;
		// paprsek je otočen dle natočení hráče
		let vec = rotVec(w, foc);
		return {
			x: player.xMU,
			y: player.yMU,
			w: vec.x * map.mapRadiusMvu,
			h: vec.y * map.mapRadiusMvu,
		};
	};	
	
	let drawSky = function(ax, ay) {	
		let skx = skyXCache[ax];
		if (typeof skx == 'undefined' || skx == 0) {
			skx = ax * skybox.sxWidthToDeg * skybox.degToTexWidth;
			skyXCache[ax] = skx;
		}
		let texY = skyYCache[ay];
		if (typeof texY == 'undefined' || texY == 0) {
			texY = Math.floor(ay * skybox.yRatio);
			skyYCache[ay] = texY;
		}
		let texX = Math.floor(skx + player.rotHorDG * skybox.degToTexWidth);		
		return skybox.texData32[texY * skybox.tex.width + texX];
	};
	
	let drawFloor = function(sx, sy, fv) {
			
		// https://en.wikipedia.org/wiki/3D_projection#Diagram
		// s screen coord (from screen center)
		// m model coord (from screen center)
		// f screen length (distance of screen from viewer)
		// d model distance (distance of model from viewer)
		// s = m * (f / d)
		// d = m * (f / s)		
		
		// střed, horizont, nekonečno
		if (sy <= 0)
			return { textureFill: false };			
	
		// spočítám dvě projekce -- horizontální a vertikální		
		// vertikální 		
		let my = extrusionHeight;
		let fh = foc;
		// dv / my = fv / sy  ->  dv = my * (fv / sy)
		let dv = my * fv / sy;
		
		// horizontální
		// mx / dv = sx / fv  ->  mx = dv * sx / fv
		// dh / dv = fh / fv  ->  dh = dv * fh / fv
		let mx = dv * sx * -1 / fv;
		let dh = dv * fh / fv;
				
		let lightMult = dv;
		if (lightMult < darkMinVal) { 
			lightMult = darkMinVal; 
		} else if (lightMult > darkMaxVal - 1) {
			lightMult = darkMaxVal - 1;
		}
		
		// otočení dle úhlu
		let zoom = 1;
		let rotated = rotVec(mx * zoom, dh * zoom);

		let xMU = player.xMU + rotated.x;
		let yMU = player.yMU + rotated.y;
		
		let xCLd = xMU * uts.mvuToClu;
		let yCLd = yMU * uts.mvuToClu;		
		let xCL = Math.floor(xCLd);
		let yCL = Math.floor(yCLd);
		
		// čtení z typovaného jednorozměrného pole je asi o 100ms rychlejší než 
		// když je to dvourozměrné a nepočítá se index, ale rovnou se dá [y][x]
		let texture = textures[map.floors[yCL * map.mapCols + xCL]];		
		//let texLight = texture.shadow ? Math.floor((lightMult - darkMinVal) * darkStepMult) : 0;
		let texLight = texture.shadow ? Math.floor((lightMult - darkMinVal) * darkStepMult) : 0;
		
		//if (typeof texture === 'undefined') return 0;
		let texX = Math.floor((xCLd - xCL) * texture.width);
		let texY = Math.floor((yCLd - yCL) * texture.height);
		let texData32 = texture.data32[texture.frame][texLight];
		return texData32[texY * texture.width + texX];
	};

	let drawSprite = function(hitResult, sx, sy, fv, index) {
		let o = 0, len = hitResult.objects.length;
		while (o < len) {
			let objectHit = hitResult.objects[o];			
			let object = objectHit.object;
			let dv = objectHit.dks;
			
			// sy / fv = mv / dv
			let mv = object.h;
			// protože je raycast symetrický, stačí půl-vzdálenost od středu
			// obrazovky -- tohle číslo bude tím páde vždy kladné
			let topSy = fv * mv / dv;
			if (sy < -topSy || sy > topSy) 
				return false;
							
			let texture = textures[object.texture];
			let texX = Math.floor(texture.xMvuToImg * objectHit.dsp);				
			
			let lightMult = dv;
			if (lightMult < darkMinVal) { 
				lightMult = darkMinVal; 
			} else if (lightMult > darkMaxVal - 1) {
				lightMult = darkMaxVal - 1;
			}
			let texLight = texture.shadow ? Math.floor((lightMult - darkMinVal) * darkStepMult) : 0;
			let texData32 = texture.data32[texture.frame][texLight];
			let texScale = texture.heightHalf / topSy;	
				
			let texY = Math.floor((sy + topSy) * texScale);						
			let texIdx = texY * texture.width + texX;						
			let pixel = texData32[texIdx];
			// 00aaff je modrá barva 
			if (pixel == texture.alphaKey)
				return false;
			putPixel32(index, pixel);
			return true;
			++o;							
		}
		return false;
	};

	let drawScene = function() {
		// musí být nahrané textury
		if (!loaded)
			return;

		// pro každý sloupec obrazovky
		let ax = 0;
		let sx = -ui.widthHalf;		
		let hitResult;
		let xIndex = 0;
		while (sx < ui.widthHalf) {
			let ray = processRay(-sx);			
			hitResult = checkHit(ray);
			if (hitResult.hit) {
				let dv = hitResult.distanceMvu;
				// fv je přepona pro fh a sx
				// fv = Math.sqrt(foc * foc + sx * sx)
				let fv = fvCache[ax];
				if (typeof fv == 'undefined' || fv == 0) {
					fv = Math.sqrt(focfoc + sx * sx);
					fvCache[ax] = fv;
				}
				// sy / fv = mv / dv
				let mv = extrusionHeight;				
				// protože je raycast symetrický, stačí půl-vzdálenost od středu
				// obrazovky -- tohle číslo bude tím páde vždy kladné
				let topSy = fv * mv / dv;
								
				let texture = textures[hitResult.value - 1];
				let texX = Math.floor(texture.xMvuToImg * hitResult.lineOriginDistanceMvu);				
				
				let lightMult = dv;
				if (lightMult < darkMinVal) { 
					lightMult = darkMinVal; 
				} else if (lightMult > darkMaxVal - 1) {
					lightMult = darkMaxVal - 1;
				}
				let texLight = texture.shadow ? Math.floor((lightMult - darkMinVal) * darkStepMult) : 0;
				let texData32 = texture.data32[texture.frame][texLight];
				let texScale = texture.heightHalf / topSy;	
				
				// pro každý řádek sloupce		
				let ay = 0;
				let sy = -ui.heightHalf;
				let yIndex = 0;
				while (sy < ui.heightHalf) {
					//let index = sx + ui.widthHalf + (sy + ui.heightHalf) * ui.width;
					//let index = xIndex + yIndex;
					let index = ay * ui.width + ax;
					let filled = false;
					if (hitResult.objects.length > 0) 
						filled = drawSprite(hitResult, sx, sy, fv, index);
					if (!filled) {
						if (sy < -topSy) {	
							// strop
							let pixel = drawSky(ax, ay, fv);		
							putPixel32(index, pixel);
						} else if (sy > topSy) {
							// podlaha
							let pixel = drawFloor(sx, sy, fv);		
							putPixel32(index, pixel);
						} else {
							let texY = Math.floor((sy + topSy) * texScale);						
							let texIdx = texY * texture.width + texX;						
							putPixel32(index, texData32[texIdx]);
						}
					}
					++sy;
					++ay;
					//yIndex += ui.width;
				}
			} else {				
				let y = 0;
				while (y < ui.height) {					
					putPixel32(y * ui.width + ax , 0);
					++y;
				}
			}
			++sx;
			++ax;
			//++xIndex;
		}
		
		ui.imageData.data.set(ui.buf8);
		ui.ctx.putImageData(ui.imageData, 0, 0);
	}
 
	// https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
	// https://jsperf.com/canvas-pixel-manipulation
	let putPixel32 = function(index, pixel32) {
		ui.data32[index] = pixel32;
	};

	return {

		init: function(uiRef, texturesRef) {			
			ui = uiRef;			
			textures = texturesRef;
			innerInit();
		},
	};
	
})();