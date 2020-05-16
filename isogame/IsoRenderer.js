var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.IsoRenderer = {
	// TODO vyjmout drawTarget a drawHero -> zobecnit na "entity"
	create: function(ctx, width, height, cellW, cellH, currentLevel, spriteLoader, cursor, onCellRenderFunc) {
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
		
		let innerDrawSprite = function(groupId, spriteId, frameId, ix, iy, showOutline) {
			let tex = spriteLoader.getTexture(groupId, spriteId);
			let col = frameId % tex.cols;
			let row = Math.floor(frameId / tex.cols);
			let x = Math.floor(ix - tex.offsetX);
			let y = Math.floor(iy - tex.offsetY);
			ctx.drawImage(tex.canvas, 
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
						
			innerDrawSprite(0, isoCell.value.spriteId, isoCell.value.frameId, isoCell.ix, isoCell.iy - cellH / 2, false);	

			// existuje přechod?
			if (isoCell.value.layerSpriteId != undefined)
				innerDrawSprite(0, isoCell.value.layerSpriteId, isoCell.value.layerFrameId, isoCell.ix, isoCell.iy - cellH / 2, false);	
			
			if ($.GIsoGame.Configuration.outlines) 
				$.GIsoGame.GFXUtils.drawPolygon(ctx, [x[0], x[1], x[2], x[3]], [y[0], y[1], y[2], y[3]], "hsla(0,0%,0%,0.2)", false);
			
			if (mx == Math.floor(cursor.mx) && my == Math.floor(cursor.my))
				$.GIsoGame.GFXUtils.drawPolygon(ctx, [x[0], x[1], x[2], x[3]], [y[0], y[1], y[2], y[3]], "hsla(100,100%,50%,0.2)", true);
		};		
		
		let innerUpdate = function(delay, viewX, viewY) {
			ctx.clearRect(0, 0, width, height);		
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, width, height);					

			// map se musí vykreslovat v opačném pořadí, než je X, aby se bloky správně překrývaly
			// nejprve všechny povrchové dílky
			let isoCells = [];
			for (let mx = currentLevel.getMapW() - 1; mx >= 0; mx--) {
				isoCells[mx] = [];
				for (let my = 0; my < currentLevel.getMapH(); my++) {								
					let isoCell = innerToIso(mx, my);
					isoCell.ix += viewX;
					isoCell.iy += viewY;
					isoCell.value = currentLevel.getGroundAtCoord(mx, my);				
					drawIsoCell(isoCell, mx, my);
					isoCells[mx][my] = isoCell;
				}
			}
			
			// poté zdi, objekty, postavy apod.
			for (let mx = currentLevel.getMapW() - 1; mx >= 0; mx--) {
				for (let my = 0; my < currentLevel.getMapH(); my++) {				
					let isoCell = isoCells[mx][my];
					if (onCellRenderFunc != undefined)
						onCellRenderFunc(mx, my);					

					let wall = currentLevel.getWallAtCoord(mx, my);
					if (wall != undefined) 
						innerDrawSprite(3, wall.spriteId, wall.frameId, isoCell.ix, isoCell.iy - cellH / 2, false);	
					
					let object = currentLevel.getObjectAtCoord(mx, my);
					if (object != undefined && object.length > 0) 
						innerDrawSprite(2, object.spriteId, object.frameId, isoCell.ix, isoCell.iy - cellH / 2, false);
									
					if ($.GIsoGame.Configuration.showNumbers) {
						ctx.font = "30px Arial";
						ctx.fillStyle = "white";
						ctx.fillText(i, Math.floor(isoCell.ix + cellW / 3), Math.floor(isoCell.iy + cellH / 4));
					}
				}
			}
		};
				
		return {
			toIso: function(mx, my) {
				return innerToIso(mx, my);
			},
			
			toMap: function(ix, iy) {
				return innerToMap(ix, iy);
			},
			
			drawSprite: function(groupId, spriteId, frameId, ix, iy, showOutline) {
				innerDrawSprite(groupId, spriteId, frameId, ix, iy, showOutline);
			},
			
			update: function(delay, viewX, viewY) {
				innerUpdate(delay, viewX, viewY);
			},			
		}
	}	
};