var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.Button = {		
	create: function(ctx, text, onClick) {
		let cfg = $.GIsoGame.Configuration;
		let button = {			
			highlighted: false,
			pushed: false,
			visible: true,
			switched: false,
			backgroundColor: cfg.uiAreaColor,
			borderColor: cfg.uiBorderColor,
			fontColor: cfg.uiFontColor,
			fontSize: cfg.uiButtonFontSize,
			highlightBackgroundColor: "#226",
			highlightBorderColor: "#337",
			highlightFontColor: "#99c",
			text: text,
		};		

		ctx.font = button.fontSize + "px Monospace";				
		button.width = ctx.measureText(button.text).width + cfg.uiSpacing * 2;
		button.height = button.fontSize / 2 + cfg.uiSpacing * 2;
		button.onMouse = function(movement, mouseBtn, down, isInBounds, uiListener) {
			if (isInBounds && mouseBtn == 0) {
				if (down) {
					uiListener.pushed = true;
				} else if (uiListener.pushed) {
					uiListener.pushed = false;
					onClick(button);
				}
				return true;
			}
			return false;
		};
		button.onDrag = function(movement, isInBounds, uiListener) {
			if (isInBounds)
				document.body.style.cursor = "pointer";					
			uiListener.highlighted = isInBounds;
			return false;
		};		
		return button;	
	},
	
	draw: function(ctx, button) {		
		let cfg = $.GIsoGame.Configuration;
		let light = button.switched || button.highlighted;
		ctx.fillStyle = light ? button.highlightBackgroundColor : button.backgroundColor;
		ctx.fillRect(button.x, button.y, button.width, button.height);			
		ctx.fillStyle = light ? button.highlightBorderColor : button.borderColor;		
		ctx.fillRect(button.x + cfg.uiBorder, button.y + cfg.uiBorder, button.width - cfg.uiBorder * 2, button.height - cfg.uiBorder * 2);

		ctx.font = button.fontSize + "px Monospace";
		ctx.fillStyle = light ? button.highlightFontColor : button.fontColor;
		ctx.fillText(button.text, button.x + cfg.uiSpacing, button.y + button.height - 9);
	}
};