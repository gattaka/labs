var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.SpriteLoader = {	
	create: function() {		
		// private
		let loaded = false;
		let loadingProgress = 0;
		let textures = [];			
		
		// public
		return {			
			queueTexture: function(group, src, cols, rows, width, height, offsetX, offsetY) {
				if (textures[group] == undefined)
					textures[group] = [];				
				textures[group].push({
					src: src,
					cols: cols, 
					rows: rows,
					width: width,
					height: height,
					offsetX: offsetX,
					offsetY: offsetY,					
				});
				loadingProgress++;
				return textures[group].length - 1;
			},				
			
			getProgress: function() {
				return loadingProgress;
			},
			
			isLoaded: function() {
				return loaded;
			},
			
			getTexture: function(group, id) {
				return textures[group][id];
			},
			
			getGroupSize: function(group) {
				return textures[group].length;
			},
			
			
			setTileGroupSizes: function(group, id, tileGroupsSizes) {
				textures[group][id].tileGroupsSizes = tileGroupsSizes;
			},
			
			// async
			load: function(){
				for (let g = 0; g < textures.length; g++) {	
					let group = textures[g];
					// některá Id mohla být vynechána
					if (group == undefined) 
						continue;
					for (let i = 0; i < group.length; i++) {
						let texture = group[i];
						
						let shades = 10;
						texture.canvas = [];
						texture.ctx = [];		
						texture.imageData = [];
						for (let s = 0; s < shades; s++) {
							let textureCanvas = document.createElement("canvas");
							textureCanvas.width = texture.width * texture.cols;
							textureCanvas.height = texture.height * texture.rows;
							let textureCtx = textureCanvas.getContext("2d");
							let subCanvasSmoothing = true;
							textureCtx.webkitImageSmoothingEnabled = subCanvasSmoothing;
							textureCtx.mozImageSmoothingEnabled = subCanvasSmoothing;
							textureCtx.imageSmoothingEnabled = subCanvasSmoothing;
							textureCtx.msImageSmoothingEnabled = subCanvasSmoothing; 						
							texture.canvas.push(textureCanvas);
							texture.ctx.push(textureCtx);
						}
						
						textureImg = new Image();			
						(function() {
							let seafImg = textureImg;
							let seafGroup = g;
							let seafIndex = i;
							textureImg.onload = function() {
								loadingProgress--;
								if (loadingProgress == 0)
									loaded = true;
								let tex = textures[seafGroup][seafIndex];
								for (let s = 0; s < shades; s++) {
									let bright = Math.floor(s / shades * 100);
									tex.ctx[s].filter = "brightness(" + bright + "%)";
									//tex.ctx[s].filter = "brightness(100%)";
									tex.ctx[s].drawImage(seafImg, 0, 0);
									//tex.ctx[s].filter = "none";
									//tex.imageData[s] = tex.ctx[s].getImageData(0, 0, tex.canvas[s].width, tex.canvas[s].height);
								}
							}
						})();
						textureImg.src = texture.src;
					}
				}				
			}
		}
	}	
};