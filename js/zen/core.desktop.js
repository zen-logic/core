import './core.js';
import './core.ui.js';
import './core.menubar.js';
import './core.window.js';
import './core.icon.js';
import {rubberband} from './mixin.rubberband.js';
import {grid} from './mixin.grid.js';


window.addEventListener('contextmenu', (e) => {
	e.preventDefault();
});


function Desktop (params) {
	if (arguments.length > 0) {
		Object.assign(this, rubberband);
		Object.assign(this, grid);
		this.rubberband = null;
		this.workspace = null;
		this.stack = {};
		this.selected = [];
		this.iconpos = {x: 0, y: 0, z: 0};
		this.winpos = {x: 0, y: 0, z: 0};
		this.init(params);
	}
	return this;
}


Desktop.prototype = {

	get minX () {
		return 0;
	},
	
	get maxX () {
		return this.el.getBoundingClientRect().width;
	},
	
	get minY () {
		if (this.menubar) {
			return this.menubar.el.getBoundingClientRect().height;
		}
		return 0;
	},
	
	get maxY () {
		return this.el.getBoundingClientRect().height;
	},


	get icons () {
		const icons = [];
		for (const item in this.stack) {
			if (this.stack[item] instanceof core.wb.Icon) {
				icons.push(this.stack[item]);
			}
		}
		return icons;
	},

	init: function (params) {
		core.log('New Desktop', params);
		this.id = 'workbench';
		this.cfg = params;
		this.render();
		window.desktop = this;

		core.observe('deselect-all', this.id, (params) => {
			if (params.source !== this.id) {
				this.deselectAll();
			}
		});

		core.observe('ToggleGrid', desktop.id, () => {
			if (this.grid) {
				this.hideGrid();
			} else {
				this.showGrid();
			}
		});

		core.observe('ResetWorkbench', this.id, (o) => {
			location.reload();
		});

		core.observe('SnapWindow', this.id, (o) => {
			this.snapWindow(o.owner);
		});

		core.observe('ArrangeWindows', this.id, (o) => {
			this.snapWindows(o.owner);
		});
		
		core.observe('ToggleFullscreen', this.id, () => {
			this.toggleFullscreen();
		});

		return this;
	},

	cleanup: function () {
		core.removeObservers(this.id);

		for (const item in this.stack) {
			if (this.stack[item] instanceof core.wb.Window) {
				this.stack[item].close();
			}
		}
	},
	
	render: function () {
		this.el = core.ui.createElement({
			id: 'workbench'
		});

		this.el.dropTarget = this;
		
		this.menubar = new core.wb.MenuBar({
			parent: this
		});

		this.el.addEventListener('mousedown', (e) => {
			if (e.currentTarget === e.target) {
				this.deselectAll();
				core.notify('deselect-all', {source: this.id});
				this.getRubberBand(e);
			}
		});
		
		if (this.cfg.items) this.setItems(this.cfg.items);
		
	},

	setItems: function (items) {
		items.forEach((o) => {
			o.parent = this;
			this.addItem(new core.wb[o.type](o));
		});
	},
	
	select: function (o, multi) {
		if (multi === true) {
			if (this.selected[0] instanceof core.wb.Window) {
				this.selected[0].deselect();
			}
			
			// check it's not already selected
			if (!this.selected.includes(o)) {
				this.selected.push(o);
			}
			
		} else {
			this.deselectAll();
			core.notify('deselect-all', {source: this.id});
			// o.el.classList.add('selected');
			this.selected.push(o);
		}
	},
	
	deselect: function (o) {
		for (let idx = 0; idx < this.selected.length; idx++) {
			if (this.selected[idx] === o) {
				this.selected.splice(idx);
				break;
			}
		}
	},
	
	deselectAll: function () {
		this.menubar.updateMenu('MNU_WINDOW', []);
		while (this.selected.length > 0) {
			let o = this.selected.pop();
			o.deselect();
		}
	},
	
	remove: function (o) {
		o.el.remove();
		delete this.stack[o.id];
	},

	getTop: function () {
		let top = -1, o;
		for (const item in this.stack) {
			if (this.stack[item].z > top) {
				o = this.stack[item];
				top = o.z;
			}
		}
		return o;
	},
	
	bringToFront: function (o) {
		let top = this.getTop();
		if (top) {
			o.z = top.z + 1;
		}
	},

	getItem: function (id) {
		return this.stack[id];
	},
	
	addItem: function (o) {
		this.stack[o.id] = o;
		o.parent = this;
		return o;
	},
	
	removeItem: function (o) {
		delete this.stack[o.id];
	},

	hasItem: function (id) {
		return this.stack[id] !== undefined;
	},
	
	drop: function (o) {
		this.el.append(o.el);
		this.stack[o.id] = o;
		o.parent = this;
		
		if (this.grid && o instanceof core.wb.Icon) {
			this.snapIcon(o);
		}
	},

	autoIconPos: function (icon) {
		if (!icon.cfg.x && !icon.cfg.y) {
			icon.x = this.iconpos.x;
			icon.y = this.iconpos.y;
			icon.z = this.iconpos.z;

			this.iconpos.x += icon.size.w;
			if (this.iconpos.x > this.w) {
				this.iconpos.x = 0;
				this.iconpos.y += icon.size.h;
				icon.x = this.iconpos.x;
				icon.y = this.iconpos.y;
				this.iconpos.x += icon.size.w;
			}
			
			this.iconpos.z++;
		} else {
			icon.x = icon.pos.x;
			icon.y = icon.pos.y;
			icon.z = icon.pos.z;
		}
	},

	autoWindowPos: function (win) {
		if (win.cfg.size) {
			let s = win.cfg.size;
			win.w = s.w !== undefined ? s.w : win.size.w;
			win.h = s.h !== undefined ? s.h : win.size.h;
		} else {
			// auto size - use defaults
			win.w = win.size.w;
			win.h = win.size.h;
		}

		if (win.cfg.pos) {
			let p = win.cfg.pos;
			win.x = p.x !== undefined ? p.x : win.pos.x;
			win.y = p.y !== undefined ? p.y : win.pos.y;
		} else {
			if (this.winpos.y === 0) {
				this.winpos.y = this.minY + 64;
				this.winpos.x = 64;
			}

			// auto position - centre on desktop
			win.x = this.winpos.x;
			win.y = this.winpos.y;

			this.winpos.x += 32;
			this.winpos.y += 32;
		}

	},


	toggleFullscreen: function () {
		let el = document.documentElement;

		if (!document.mozFullScreen && !document.webkitIsFullScreen) {
			if (el.mozRequestFullScreen) {
				el.mozRequestFullScreen();
			} else {
				el.webkitRequestFullScreen();
			}
		} else {
			if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else {
				document.webkitCancelFullScreen();
			}
		}
	}
	
};


core.namespace('core.wb', {
	Desktop: Desktop
});
