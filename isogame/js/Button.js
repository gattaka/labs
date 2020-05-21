var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.Button = {		
	create: function(ctx, text, onClick) {
		let cfg = $.GIsoGame.Configuration;
		let button = {};
		button.backgroundColor = cfg.uiAreaColor;
		button.borderColor = cfg.uiBorderColor;
		button.fontColor = cfg.uiFontColor;
		button.fontSize = cfg.uiButtonFontSize;

		button.highlightBackgroundColor = "#226";
		button.highlightBorderColor = "#337";
		button.highlightFontColor = "#99c";

		button.highlighted = false;
		button.pushed = false;
		button.visible = true;
		ctx.font = button.fontSize + "px Monospace";		
		button.text = text;
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
			if (!uiListener.highlighted) {
				uiListener.backgroundColor = isInBounds ? uiListener.highlightBackgroundColor : cfg.uiAreaColor;
				uiListener.borderColor = isInBounds ? uiListener.highlightBorderColor : cfg.uiBorderColor;
				uiListener.fontColor = isInBounds ? uiListener.highlightFontColor : cfg.uiFontColor;
			}
			return false;
		};		
		return button;	
	},
	
	draw: function(ctx, button) {		
		let cfg = $.GIsoGame.Configuration;
		ctx.fillStyle = button.highlighted ? button.highlightBackgroundColor : button.backgroundColor;
		ctx.fillRect(button.x, button.y, button.width, button.height);			
		ctx.fillStyle = button.highlighted ? button.highlightBorderColor : button.borderColor;		
		ctx.fillRect(button.x + cfg.uiBorder, button.y + cfg.uiBorder, button.width - cfg.uiBorder * 2, button.height - cfg.uiBorder * 2);

		ctx.font = button.fontSize + "px Monospace";
		ctx.fillStyle = button.highlighted ? button.highlightFontColor : button.fontColor;
		ctx.fillText(button.text, button.x + cfg.uiSpacing, button.y + button.height - 9);
	}
};