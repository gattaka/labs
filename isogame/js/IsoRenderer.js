var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.IsoRenderer = {	
	create: function(groundCtx, objectsCtx, width, height, cellW, cellH, levelManager, spriteLoader, cursor, onCellRenderFunc) {
		let lightQuality = $.GIsoGame.Configuration.lightQuality;
		let lightStep = 100 / lightQuality;
		let lightsOn = true;
		
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
		
		let innerDrawSprite = function(ctx, groupId, spriteId, frameId, ix, iy, showOutline, light) {
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
			let lightBucket;
			if (light == undefined || !lightsOn) {
				lightBucket = 0;			
			} else {
				lightBucket = Math.floor((100 - light) / lightStep);
			}				
			ctx.drawImage(tex.canvas[lightBucket], 
				col * tex.width, row * tex.height, tex.width, tex.height, 
				x, y, tex.width, tex.height);			
			if (showOutline) {
				ctx.strokeStyle = "black";
				ctx.lineWidth = 1;			
				ctx.strokeRect(x, y, tex.width, tex.height);
			}
		};

		let drawIsoCell = function(isoCell, mx, my) {		
			let x = [isoCell.ix, isoCell.ix + cellW / 2, isoCell.ix + cellW, isoCell.ix + cellW / 2];
			let y = [isoCell.iy, isoCell.iy - cellH / 2, isoCell.iy, isoCell.iy + cellH / 2];		
			
			// Mimo view nemá cenu vykreslovat
			if (x[2] < 0 || x[0] > width || y[1] > height || y[3] < 0)
				return;
								
			let filled = false;
			if (isoCell.value != undefined) {
				for (let i = 0; i < isoCell.value.length / 2; i++) {
					innerDrawSprite(groundCtx, 0, isoCell.value[i * 2], isoCell.value[i * 2 + 1], isoCell.ix, isoCell.iy - cellH / 2, false, isoCell.light);
					filled = true;
				}
			}			
			
			if ($.GIsoGame.Configuration.outlines || !filled) 
				$.GIsoGame.GFXUtils.drawPolygon(objectsCtx, [x[0], x[1], x[2], x[3]], [y[0], y[1], y[2], y[3]], "hsla(0,0%,40%,0.5)", false);
			
			if (mx == Math.floor(cursor.mx) && my == Math.floor(cursor.my))
				$.GIsoGame.GFXUtils.drawPolygon(objectsCtx, [x[0] + 4, x[1], x[2] - 4, x[3]], [y[0], y[1] + 2, y[2], y[3] - 2], "hsla(100,100%,50%,0.4)", false, 2);
		};		
		
		let innerUpdate = function(delay, viewX, viewY) {
			groundCtx.clearRect(0, 0, width, height);
			objectsCtx.clearRect(0, 0, width, height);

			let mapWH = levelManager.getMapW() / 2;
			
			// map se musí vykreslovat v opačném pořadí, než je X, aby se bloky správně překrývaly
			// nejprve všechny povrchové dílky
			let isoCells = [];
			for (let mx = levelManager.getMapW() - 1; mx >= 0; mx--) {
				isoCells[mx] = [];
				for (let my = 0; my < levelManager.getMapH(); my++) {								
					let isoCell = innerToIso(mx, my);
					isoCell.ix += viewX;
					isoCell.iy += viewY;															
					isoCell.value = levelManager.getGroundAtCoord(mx, my);
					isoCell.light = levelManager.getLightAtCoord(mx, my);					
					drawIsoCell(isoCell, mx, my);
					isoCells[mx][my] = isoCell;
				}
			}
			
			// poté zdi, objekty, postavy apod.
			for (let mx = levelManager.getMapW() - 1; mx >= 0; mx--) {
				for (let my = 0; my < levelManager.getMapH(); my++) {				
					let isoCell = isoCells[mx][my];
					if (onCellRenderFunc != undefined)
						onCellRenderFunc(mx, my, isoCell.ix, isoCell.iy);					

					let wall = levelManager.getWallAtCoord(mx, my);
					if (wall != undefined) 
						innerDrawSprite(objectsCtx, 3, wall.spriteId, wall.frameId, isoCell.ix, isoCell.iy - cellH / 2, false, isoCell.light);	
					
					let object = levelManager.getObjectAtCoord(mx, my);
					if (object != undefined) 
						innerDrawSprite(objectsCtx, 2, object.spriteId, object.frameId, isoCell.ix, isoCell.iy - cellH / 2, false, isoCell.light);
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
				innerDrawSprite(ctx, groupId, spriteId, frameId, ix, iy, showOutline, light);
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
		}
	}	
};