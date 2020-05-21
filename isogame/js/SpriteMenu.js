var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.SpriteMenu = {		
	create: function(cellW) {					
		let menu = {
			x: 0,
			y: 0,
			width: 0,
			height: 100,
			visible: true,
			dragged: false,
			itemWidth: cellW * 1.5,
			cellW: cellW,
			dragOffset: 0,
			mouseDown: false,
			cursorx: 0,
		};		
		menu.onMouse = function(movement, button, down, isInBounds, uiListener) {
			if (button == 1) {
				if (!down) { 
					uiListener.dragged = false;					
				} else if (isInBounds) {
					uiListener.dragged = true;
					return true;
				}
			} else if (button == 0) {
				if (!down) {
					uiListener.mouseDown = false;
				} else if (isInBounds) {					
					uiListener.mouseDown = true;
					menu.cursorx = movement.x;
					return true;
				}
			}
			return false;
		};
		menu.onDrag = function(movement, isInBounds, uiListener) {
			if (uiListener.dragged) {
				uiListener.dragOffset += movement.dx;
				return true;
			}
			return false;
		};		
		return menu;
	},
	
	draw: function(ctx, menu) {		
		let cfg = $.GIsoGame.Configuration;
		
		ctx.fillStyle = cfg.uiBorderColor;		
		ctx.fillRect(menu.x, menu.y, menu.width, menu.height);
		
		// zmenšení aktivní plochy menu, aby se v ní dalo pracovat s položkami
		let fromX = menu.x + cfg.uiBorder;
		let toX = menu.x + menu.width - cfg.uiBorder;
		let fromY = menu.y + cfg.uiBorder;
		let toY = menu.y + menu.height - cfg.uiBorder;
		
		ctx.fillStyle = cfg.uiAreaColor;	
		ctx.fillRect(fromX, fromY, toX - fromX, toY - fromY);
		
		let slotWidth = menu.itemWidth + cfg.uiSpacing * 2;
		let itemsStartX = Math.floor(fromX + menu.width / 2 - slotWidth / 2);
		
		ctx.fillStyle = cfg.uiBorderColor;
		ctx.fillRect(itemsStartX, fromY, slotWidth, toY - fromY);
		
		if (menu.mouseDown) {
			let diff = menu.cursorx - itemsStartX;
			menu.dragOffset -= Math.floor(diff / slotWidth) * slotWidth;
			menu.mouseDown = false;
		}
		
		let choosenItemId = Math.floor(-menu.dragOffset / slotWidth);
		if (choosenItemId < 0) {
			menu.dragOffset += slotWidth * choosenItemId;
			choosenItemId = 0;			
		} else if (choosenItemId >= menu.itemsCount) {
			menu.dragOffset += slotWidth * (choosenItemId - menu.itemsCount);
			choosenItemId = menu.itemsCount - 1;
		}
		menu.chooseItemFunc(choosenItemId);
		
		for (let i = 0; i < menu.itemsCount; i++) {	
			let texDetail = menu.texDetailFunc(i);						
			let offsetY = texDetail.tex.offsetY == 0 ? texDetail.tex.height / 2 : texDetail.tex.offsetY;		
			let slotCenterX = itemsStartX + (i - choosenItemId) * slotWidth + slotWidth / 2;
			let x = Math.floor(slotCenterX - menu.cellW / 2 - texDetail.tex.offsetX);
			let leftOverlap = fromX - x;
			let rightOverlap = x + texDetail.tex.width - toX;
			let y = Math.floor(fromY + menu.height / 2 - cfg.uiBorder - offsetY);
			if ((leftOverlap < 0 || rightOverlap < 0) && leftOverlap < texDetail.tex.width && rightOverlap < texDetail.tex.width) {
				let leftTrim = leftOverlap > 0 ? leftOverlap : 0;
				let rightTrim = rightOverlap > 0 ? rightOverlap : 0;
				let trimWidth = texDetail.tex.width - leftTrim - rightTrim;
				ctx.drawImage(texDetail.tex.canvas, 
					texDetail.col * texDetail.tex.width + leftTrim, texDetail.row * texDetail.tex.height, trimWidth, texDetail.tex.height, 
					x + leftTrim, y, trimWidth, texDetail.tex.height);	
			}
		}
	}
};