var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.IsoRenderer = {	
	create: function(ctx, width, height, cellW, cellH, levelManager, spriteLoader, cursor, onCellRenderFunc) {
		let lightQuality = $.GIsoGame.Configuration.lightQuality;
		let lightStep = 100 / lightQuality;
		let lightsOn = true;
		
		let sectorSize = 6;
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
		
		let innerDrawSprite = function(targetCtx, groupId, spriteId, frameId, ix, iy, showOutline, lightBucket) {
			let tex = spriteLoader.getTexture(groupId, spriteId);
			if (tex == undefined) {
				// chybějící textura
				targetCtx.strokeStyle = "black";
				targetCtx.fillStyle = "magenta";
				targetCtx.lineWidth = 1;			
				let w = cellW / 2, h = cellH;
				let x = ix + w / 2, y = iy - h / 2;				
				targetCtx.fillRect(x, y, w, h);
				targetCtx.strokeRect(x, y, w, h);
				return;
			}
			let col = frameId % tex.cols;
			let row = Math.floor(frameId / tex.cols);
			let x = Math.floor(ix - tex.offsetX);
			let y = Math.floor(iy - tex.offsetY);				
			targetCtx.drawImage(tex.canvas[lightBucket], 
				col * tex.width, row * tex.height, tex.width, tex.height, 
				x, y, tex.width, tex.height);
			if (showOutline) {
				targetCtx.strokeStyle = "black";
				targetCtx.lineWidth = 1;			
				targetCtx.strokeRect(x, y, tex.width, tex.height);
			}
		};				
		
		let drawSectorSprites = function(ctx, mxOffset, myOffset, ix, iy, cached) {
			for (let smy = 0; smy < sectorSize; smy++) {								
				let my = smy + myOffset;
				if (my >= levelManager.getMapH()) break;
				for (let smx = 0; smx < sectorSize; smx++) {				
					let mx = smx + mxOffset;
					if (mx >= levelManager.getMapW()) break;
					let isoCell = innerToIso(smx, smy);		
					isoCell.ix += ix;
					isoCell.iy += iy + sectorHeight / 2;
					isoCell.value = levelManager.getGroundAtCoord(mx, my);					
					if (isoCell.value == undefined)
						continue;
					isoCell.lightBucket = getLightBucketFromLight(levelManager.getLightAtCoord(mx, my));
					let x = [isoCell.ix, isoCell.ix + cellW / 2, isoCell.ix + cellW, isoCell.ix + cellW / 2];
					let y = [isoCell.iy, isoCell.iy - cellH / 2, isoCell.iy, isoCell.iy + cellH / 2];			
					let filled = false;					
					for (let i = 0; i < isoCell.value.length / 2; i++) {
						innerDrawSprite(ctx, 0, isoCell.value[i * 2], isoCell.value[i * 2 + 1], isoCell.ix, isoCell.iy - cellH / 2, false, isoCell.lightBucket);				
						filled = true;
					}
					if ($.GIsoGame.Configuration.outlines || !filled) {
						$.GIsoGame.GFXUtils.drawPolygon(ctx, [x[0], x[1], x[2], x[3]], [y[0], y[1], y[2], y[3]], "hsla(0,0%,40%,0.5)", false);
					} else if (!cached && $.GIsoGame.Configuration.showSectors) {
						$.GIsoGame.GFXUtils.drawPolygon(ctx, [x[0], x[1], x[2], x[3]], [y[0], y[1], y[2], y[3]], "#f00", false);
					}
				}
			}
		};
		
		let cacheSector = function(sx, sy) {			
			let sector = sectors[sx][sy];
			sector.ctx.clearRect(0, 0, sectorWidth, sectorHeight);
			let mxOffset = sx * sectorSize;
			let myOffset = sy * sectorSize;
			drawSectorSprites(sector.ctx, mxOffset, myOffset, 0, 0, true);
			if ($.GIsoGame.Configuration.showSectors)
				$.GIsoGame.GFXUtils.drawPolygon(sector.ctx, [0, sectorWidth / 2, sectorWidth, sectorWidth / 2], [sectorHeight / 2, 0, sectorHeight / 2, sectorHeight], "#f00", false);			
		};
		
		let createSector = function(sx, sy) {
			if (sectors[sx] == undefined)
				sectors[sx] = [];			
			let cachedCanvas = document.createElement("canvas");
			cachedCanvas.width = sectorWidth;
			cachedCanvas.height = sectorHeight;
			let cachedCtx = cachedCanvas.getContext("2d");
			let smoothing = false;
			cachedCtx.webkitImageSmoothingEnabled = smoothing;
			cachedCtx.mozImageSmoothingEnabled = smoothing;
			cachedCtx.imageSmoothingEnabled = smoothing;
			cachedCtx.msImageSmoothingEnabled = smoothing;
			let sector = {
				canvas: cachedCanvas, 
				ctx: cachedCtx,
				dirty: true,
				wasDirty: true,
			};					
			sectors[sx][sy] = sector;			
			return sector;
		};
		
		let readSector = function(sx, sy) {
			if (sectors[sx] == undefined)
				sectors[sx] = [];
			let sector;
			if (sectors[sx][sy] == undefined)
				sector = createSector(sx, sy);
			sector = sectors[sx][sy];
			sector.dirty = dirtySectors[sx] != undefined && dirtySectors[sx][sy];
			return sector;
		};
		
		let innerUpdate = function(delay, viewX, viewY) {			
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, width, height);
			
			for (let sy = 0; sy < rowsOfSectors; sy++) {
				let myOffset = sy * sectorSize;
				for (let sx = 0; sx < colsOfSectors; sx++) {
					let mxOffset = sx * sectorSize;
					let isoSector = innerToIso(mxOffset, myOffset);
					isoSector.ix += viewX;
					isoSector.iy += viewY - sectorHeight / 2;		
					if (isoSector.ix > width || isoSector.ix + sectorWidth < 0 ||
						isoSector.iy > height || isoSector.iy + sectorHeight < 0)
						continue;		
					let sector = readSector(sx, sy);
					if (sector.dirty) {						
						sector.wasDirty = true;
						drawSectorSprites(ctx, mxOffset, myOffset, isoSector.ix, isoSector.iy);
						//cacheSector(sx, sy);
						//ctx.drawImage(sector.canvas, Math.floor(isoSector.ix), Math.floor(isoSector.iy));
					} else {
						if (sector.wasDirty) {
							cacheSector(sx, sy);
							sector.wasDirty = false;
						}
						ctx.drawImage(sector.canvas, Math.floor(isoSector.ix), Math.floor(isoSector.iy));
					}
				}
			}
			
			dirtySectors = [];

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
						innerDrawSprite(ctx, 3, wall.spriteId, wall.frameId, isoCell.ix, isoCell.iy - cellH / 2, false, isoCell.lightBucket);	
					
					let object = levelManager.getObjectAtCoord(mx, my);
					if (object != undefined) 
						innerDrawSprite(ctx, 2, object.spriteId, object.frameId, isoCell.ix, isoCell.iy - cellH / 2, false, isoCell.lightBucket);
					
					if (mx == Math.floor(cursor.mx) && my == Math.floor(cursor.my)) {
						let x = [isoCell.ix, isoCell.ix + cellW / 2, isoCell.ix + cellW, isoCell.ix + cellW / 2];
						let y = [isoCell.iy, isoCell.iy - cellH / 2, isoCell.iy, isoCell.iy + cellH / 2];			
						$.GIsoGame.GFXUtils.drawPolygon(ctx, [x[0] + 4, x[1], x[2] - 4, x[3]], [y[0], y[1] + 2, y[2], y[3] - 2], "hsla(100,100%,50%,0.4)", false, 2);
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
		
		let innerMarkDirty = function(sx, sy) {			
			if (dirtySectors[sx] == undefined)
				dirtySectors[sx] = [];
			dirtySectors[sx][sy] = true;
		};
				
		return {
			toIso: function(mx, my) {
				return innerToIso(mx, my);
			},
			
			toMap: function(ix, iy) {
				return innerToMap(ix, iy);
			},
			
			drawSprite: function(groupId, spriteId, frameId, ix, iy, showOutline, light) {
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

			markAllDirty: function() {
				for (let sy = 0; sy < rowsOfSectors; sy++)
					for (let sx = 0; sx < colsOfSectors; sx++)
						innerMarkDirty(sx, sy);
			},

			markDirty: function(mx, my) {
				let sx = Math.floor(mx / sectorSize);
				let sy = Math.floor(my / sectorSize);
				innerMarkDirty(sx, sy);
				console.log("Sector mark dirty: " + sx + ":" + sy); 
			},
			
			markDirtyRange: function(fromMx, fromMy, toMx, toMy) {				
				let fromSx = Math.floor(Math.min(fromMx, toMx) / sectorSize);
				let fromSy = Math.floor(Math.min(fromMy, toMy) / sectorSize);
				let toSx = Math.floor(Math.max(fromMx, toMx) / sectorSize);
				let toSy = Math.floor(Math.max(fromMy, toMy) / sectorSize);
				for (let y = fromSy; y <= toSy; y++)
					for (let x = fromSx; x <= toSx; x++)
						innerMarkDirty(x, y);				
			},
		}
	}	
};