var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.SpriteLoader = {	
	create: function() {		
		// private
		let loaded = false;
		let loadingProgress = 0;
		let textures = [];		
		let lightQuality = $.GIsoGame.Configuration.lightQuality;
		let lightStep = 100 / lightQuality;
		
		// public
		return {			
			queueTexture: function(group, src, cols, rows, width, height, offsetX, offsetY, hasShades) {
				if (textures[group] == undefined)
					textures[group] = [];		
				if (hasShades == undefined)
					hasShades = true;
				textures[group].push({
					src: src,
					cols: cols, 
					rows: rows,
					width: width,
					height: height,
					offsetX: offsetX,
					offsetY: offsetY,
					hasShades: hasShades,
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
												
						texture.canvas = [];
						texture.ctx = [];		
						texture.imageData = [];
						let versions = texture.hasShades ? lightQuality : 1;
						for (let s = 0; s < versions; s++) {
							let textureCanvas = document.createElement("canvas");
							textureCanvas.width = texture.width * texture.cols;
							textureCanvas.height = texture.height * texture.rows;
							let textureCtx = textureCanvas.getContext("2d");
							let subCanvasSmoothing = false;
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
								for (let s = 0; s < versions; s++) {									
									tex.ctx[s].filter = "brightness(" + (100 - s * lightStep) + "%)";									
									tex.ctx[s].drawImage(seafImg, 0, 0);									
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