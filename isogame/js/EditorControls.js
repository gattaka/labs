var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.EditorControls = {		
	create: function(canvas) {
		// pole všech UI prvků, které reagují na mouse události
		// povinná pole: 
		// 		x, y, width, height, visible, 
		// 		consumed = onMouse(movement, button, down, isInBounds, uiListener)
		// 		consumed = onDrag(movement, isInBounds, uiListener)
		let uiListeners = [];
		let movement = {
			dx: 0,
			dy: 0,
			x: 0,
			y: 0,	
		};	 		
		
		let isInBounds = function(uiListener)  {
			return movement.x > uiListener.x && movement.x < uiListener.x + uiListener.width
				&& movement.y > uiListener.y && movement.y < uiListener.y + uiListener.height;
		};
		
		let copyMovement = function() {
			return { dx: movement.dx, dy: movement.dy, x: movement.x, y: movement.y };	 
		};
		
		let mouseButtonChange = function(down, button) {
			for (let i = 0; i < uiListeners.length; i++)
				if (uiListeners[i].visible && uiListeners[i].onMouse(copyMovement(), button, down, isInBounds(uiListeners[i]), uiListeners[i]))
					break;	
		};
		
		canvas.addEventListener('contextmenu', function(e) {		
			if (e.button == 2) e.preventDefault();		
		});
		
		canvas.addEventListener("mousedown", function (e) {
			mouseButtonChange(true, e.button);
		}, false);
	 
		canvas.addEventListener("mouseup", function (e) {
			mouseButtonChange(false, e.button);
		}, false);
		
		canvas.addEventListener("mouseleave", function (e) {
			mouseButtonChange(false, 0);
			mouseButtonChange(false, 1);
			mouseButtonChange(false, 2);
		}, false);
		
		canvas.addEventListener("mousemove", function (e) {		
			// výchozí vyresetování kurzoru
			document.body.style.cursor = "default";	
			
			let bound = canvas.getBoundingClientRect();
			let lastSx = movement.x;
			let lastSy = movement.y;
			movement.x = e.clientX - bound.x;
			movement.y = e.clientY - bound.y;
			movement.dx = movement.x - lastSx;
			movement.dy = movement.y - lastSy;					
			for (let i = 0; i < uiListeners.length; i++)
				if (uiListeners[i].visible && uiListeners[i].onDrag(copyMovement(), isInBounds(uiListeners[i]), uiListeners[i]))
					break;
		}, false);
		
		// public
		return {										
			addUIListener: function(uiListener) {
				return uiListeners.push(uiListener);
			},						
		}
	}	
};