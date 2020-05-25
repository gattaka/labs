var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.IsoRenderer = {	
	create: function(groundCtx, objectsCtx, width, height, cellW, cellH, levelManager, spriteLoader, cursor, onCellRenderFunc) {
		let lightQuality = $.GIsoGame.Configuration.lightQuality;
		let lightStep = 100 / lightQuality;
		let lightsOn = true;
		
		let sectorSize = 5;
		let colsOfSectors = Math.ceil(levelManager.getMapW() / sectorSize);
		let rowsOfSectors = Math.ceil(levelManager.getMapH() / sectorSize);		
		let sectorWidth = sectorSize * cellW;
		let sectorHeight = sectorSize * cellH;
		let sectors = [];
		
		let dirtySectors = [];
		
		let innerToIso = function(mx, my) {
			let w = cellW / 2;
			let h = cellH / 2;
			return {
				ix: mx * w + my * w,  
				iy: my * h - mx * h
			};
		};
		
		let innerToMap = function(ix, iy) {
			let w = cellW / 2;
			let h = cellH / 2;
			let my = iy / (2 * h) + ix / (2 * w);		
			return {
				mx: (ix - my * w) / w,
				my: my
			};
		};						
		
		let getLightBucketFromLight = function(light) {
			if (light == undefined || !lightsOn) {
				return 0;
			} else {
				return Math.floor((100 - light) / lightStep);
			}	
		};			
		
		let innerDrawSprite = function(ctx, groupId, spriteId, frameId, ix, iy, showOutline, lightBucket) {
			let tex = spriteLoader.getTexture(groupId, spriteId);
			if (tex == undefined) {
				// chybějící textura
				ctx.strokeStyle = "black";
				ctx.fillStyle = "magenta";
				ctx.lineWidth = 1;			
				let w = cellW / 2, h = cellH;
				let x = ix + w / 2, y = iy - h / 2;				
				ctx.fillRect(x, y, w, h);
				ctx.strokeRect(x, y, w, h);
				return;
			}
			let col = frameId % tex.cols;
			let row = Math.floor(frameId / tex.cols);
			let x = Math.floor(ix - tex.offsetX);
			let y = Math.floor(iy - tex.offsetY);				
			ctx.drawImage(tex.canvas[lightBucket], 
				col * tex.width, row * tex.height, tex.width, tex.height, 
				x, y, tex.width, tex.height);
			if (showOutline) {
				ctx.strokeStyle = "black";
				ctx.lineWidth = 1;			
				ctx.strokeRect(x, y, tex.width, tex.height);
			}
		};	
				
		let createCanvas = function(w, h) {					
			let cachedCanvas = document.createElement("canvas");
			cachedCanvas.width = w;
			cachedCanvas.height = h;
			let cachedCtx = cachedCanvas.getContext("2d");
			let smoothing = false;
			cachedCtx.webkitImageSmoothingEnabled = smoothing;
			cachedCtx.mozImageSmoothingEnabled = smoothing;
			cachedCtx.imageSmoothingEnabled = smoothing;
			cachedCtx.msImageSmoothingEnabled = smoothing;
			return {canvas: cachedCanvas, ctx: cachedCtx};			
		};
		
		let updateSector = function(sx, sy) {			
			let sector = sectors[sx][sy];
			sector.ctx.clearRect(0, 0, sectorWidth, sectorHeight);
			let mxOffset = sx * sectorSize;
			let myOffset = sy * sectorSize;
			for (let smx = 0; smx < sectorSize; smx++) {				
				for (let smy = 0; smy < sectorSize; smy++) {								
					let isoCell = innerToIso(smx, smy);			
					isoCell.iy += sectorHeight / 2;
					let mx = smx + mxOffset;
					let my = smy + myOffset;
					isoCell.value = levelManager.getGroundAtCoord(mx, my);					
					isoCell.lightBucket = getLightBucketFromLight(levelManager.getLightAtCoord(mx, my));
					let x = [isoCell.ix, isoCell.ix + cellW / 2, isoCell.ix + cellW, isoCell.ix + cellW / 2];
					let y = [isoCell.iy, isoCell.iy - cellH / 2, isoCell.iy, isoCell.iy + cellH / 2];			
					let filled = false;					
					for (let i = 0; i < isoCell.value.length / 2; i++) {
						innerDrawSprite(sector.ctx, 0, isoCell.value[i * 2], isoCell.value[i * 2 + 1], isoCell.ix, isoCell.iy - cellH / 2, false, isoCell.lightBucket);				
						filled = true;
					}
					if ($.GIsoGame.Configuration.outlines || !filled) 
						$.GIsoGame.GFXUtils.drawPolygon(sector.ctx, [x[0], x[1], x[2], x[3]], [y[0], y[1], y[2], y[3]], "hsla(0,0%,40%,0.5)", false);
				}
			}
			if ($.GIsoGame.Configuration.showSectors)
				$.GIsoGame.GFXUtils.drawPolygon(sector.ctx, [0, sectorWidth / 2, sectorWidth, sectorWidth / 2], [sectorHeight / 2, 0, sectorHeight / 2, sectorHeight], "#f00", false);			
		};
		
		let createSector = function(sx, sy) {
			if (sectors[sx] == undefined)
				sectors[sx] = [];
			let sector = createCanvas(sectorWidth, sectorHeight);
			sectors[sx][sy] = sector;
			updateSector(sx, sy);
			return sectors[sx][sy];
		};
		
		let getSector = function(sx, sy) {
			if (sectors[sx] == undefined)
				return undefined;
			return sectors[sx][sy];
		};			
		
		let innerUpdate = function(delay, viewX, viewY) {
			groundCtx.clearRect(0, 0, width, height);
			objectsCtx.clearRect(0, 0, width, height);
			
			for (let sy = 0; sy < rowsOfSectors; sy++) {
				for (let sx = 0; sx < colsOfSectors; sx++) {
					let isoSector = innerToIso(sx * sectorSize, sy * sectorSize);
					isoSector.ix += viewX;
					isoSector.iy += viewY - sectorHeight / 2;		
					if (isoSector.ix > width || isoSector.ix + sectorWidth < 0 ||
						isoSector.iy > height || isoSector.iy + sectorHeight < 0)
						continue;		
					let sector = getSector(sx, sy);
					if (sector == undefined) {
						sector = createSector(sx, sy);
					} else if (dirtySectors[sx] != undefined && dirtySectors[sx][sy]) {
						updateSector(sx, sy);
					}											
					groundCtx.drawImage(sector.canvas, Math.floor(isoSector.ix), Math.floor(isoSector.iy));
				}
			}

			// map se musí vykreslovat v opačném pořadí, než je X, aby se bloky správně překrývaly
			// poté zdi, objekty, postavy apod.
			for (let mx = levelManager.getMapW() - 1; mx >= 0; mx--) {
				for (let my = 0; my < levelManager.getMapH(); my++) {				
					let isoCell = innerToIso(mx, my);
					isoCell.ix += viewX;
					isoCell.iy += viewY;
					isoCell.lightBucket = getLightBucketFromLight(levelManager.getLightAtCoord(mx, my));
					if (onCellRenderFunc != undefined)
						onCellRenderFunc(mx, my, isoCell.ix, isoCell.iy);					

					let wall = levelManager.getWallAtCoord(mx, my);
					if (wall != undefined) 
						innerDrawSprite(objectsCtx, 3, wall.spriteId, wall.frameId, isoCell.ix, isoCell.iy - cellH / 2, false, isoCell.lightBucket);	
					
					let object = levelManager.getObjectAtCoord(mx, my);
					if (object != undefined) 
						innerDrawSprite(objectsCtx, 2, object.spriteId, object.frameId, isoCell.ix, isoCell.iy - cellH / 2, false, isoCell.lightBucket);
					
					if (mx == Math.floor(cursor.mx) && my == Math.floor(cursor.my)) {
						let x = [isoCell.ix, isoCell.ix + cellW / 2, isoCell.ix + cellW, isoCell.ix + cellW / 2];
						let y = [isoCell.iy, isoCell.iy - cellH / 2, isoCell.iy, isoCell.iy + cellH / 2];			
						$.GIsoGame.GFXUtils.drawPolygon(objectsCtx, [x[0] + 4, x[1], x[2] - 4, x[3]], [y[0], y[1] + 2, y[2], y[3] - 2], "hsla(100,100%,50%,0.4)", false, 2);
					}
				}
			}
		};
		
		let innerSetWidth = function(w) {
			width = w;	
		};
			
		let innerSetHeight = function(h) {
			height = h;
		};
				
		return {
			toIso: function(mx, my) {
				return innerToIso(mx, my);
			},
			
			toMap: function(ix, iy) {
				return innerToMap(ix, iy);
			},
			
			drawSprite: function(ctx, groupId, spriteId, frameId, ix, iy, showOutline, light) {
				let lightBucket = getLightBucketFromLight(light);
				innerDrawSprite(ctx, groupId, spriteId, frameId, ix, iy, showOutline, lightBucket);
			},
					
			setWidth: function(w) {
				innerSetWidth(w);
			},
			
			setHeight: function(h) {
				innerSetHeight(h);
			},
			
			setLights: function(show) {
				lightsOn = show;
			},
			
			isLights: function() {
				return lightsOn;
			},
			
			update: function(delay, viewX, viewY) {
				innerUpdate(delay, viewX, viewY);
			},		

			markDirty: function(mx, my) {
				let sx = Math.floor(mx / sectorSize);
				let sy = Math.floor(my / sectorSize);
				if (dirtySectors[sx] == undefined)
					dirtySectors[sx] = [];
				dirtySectors[sx][sy] = true;
			},
		}
	}	
};