var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.FPS = {	
	create: function(refreshRate, ctx, bars) {		
		// private
		let h = 20;
		
		let time = 0;
		let frames = 0;					
		let pointer = 0;
		let array = [];		
		
		let innerUpdate = function(x, y, delay) {		
			time += delay;			
			frames++;
			
			if (time >= refreshRate) {				
				pointer = (pointer + 1) % bars;
				array[pointer] = Math.floor(frames * 1000 / time);
				time = 0;
				frames = 0;
			}
						
			let fps = array[pointer] + " FPS";
			ctx.font = h + "px Monospace";
			let w = ctx.measureText(fps).width;
			ctx.fillStyle = "cyan";
			ctx.fillText(fps, x - w, y + h);
			
			/*
			let barWidth = 3;
			ctx.lineWidth = barWidth;
			ctx.strokeStyle = "cyan";
			ctx.beginPath();						
			for (let i = 0; i < array.length; i++) {
				let index = (i + pointer + 1) % array.length;
				let len = Math.floor(array[index] / 60 * h);
				let bx = x - i * barWidth;
				let by = y + h + 10 + h;
				ctx.moveTo(bx, by);
				ctx.lineTo(bx, by - len);
			}
			ctx.stroke();
			*/
		};
		
		// public
		return {			
			update: function(x, y, delay) {				
				return innerUpdate(x, y, delay);
			},						
		}
	}	
};