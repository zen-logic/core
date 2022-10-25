const GRID_SIZE = 32;

window.addEventListener('resize', (e) => {
	if (desktop && desktop.grid) {
		desktop.showGrid();
	}
});

export const grid = {

	hideGrid: function () {
		if (this.grid) {
			this.grid.remove();
			delete this.grid;
		}
	},

	
	showGrid: function () {

		const w = this.maxX,
			  h = this.maxY;

		this.hideGrid();
		
		this.grid = core.ui.createElement({
			tag: 'canvas',
			id: 'wb-grid',
			attr: {
				width: w,
				height: h
			}
		});

		const ctx = this.grid.getContext('2d');
		ctx.beginPath();
		ctx.strokeStyle = '#ffffff';
		ctx.setLineDash([4, 2]);
		let x = this.minX,
			y = this.minY;

		while (x < w) {
			ctx.moveTo(x, this.minY);
			ctx.lineTo(x, h);
			x += GRID_SIZE;
		}

		while (y < h) {
			ctx.moveTo(this.minX, y);
			ctx.lineTo(w, y);
			y += GRID_SIZE;
		}
		
		ctx.stroke();

	},

	snapWindows: function () {
		for (const item in this.stack) {
			if (this.stack[item] instanceof core.wb.Window) {
				this.snapWindow(this.stack[item]);
			}
		}
	},

	snapWindow: function (win) {
		let top = win.y - this.minY;
		let left = win.x - this.minX;

		top = Math.round(top / GRID_SIZE) * GRID_SIZE;
		left = Math.round(left / GRID_SIZE) * GRID_SIZE;

		let w = win.w, h = win.h;

		w = Math.round(w / GRID_SIZE) * GRID_SIZE - 1;
		h = Math.round(h / GRID_SIZE) * GRID_SIZE - 1;
		
		win.y = top + this.minY;
		win.x = left + this.minX;
		win.w = w;
		if (!win.el.classList.contains('minimised')) {
			win.h = h;
		}
		win.saveState();
	}
	

};
