import './core.js';
import './core.ui.js';
import './core.menubar.js';
import './core.window.js';
import './core.icon.js';
import {rubberband} from './mixin.rubberband.js';


window.addEventListener('contextmenu', (e) => {
	e.preventDefault();
});


function Desktop (params) {
	if (arguments.length > 0) {
		Object.assign(this, rubberband);
		this.rubberband = null;
		this.stack = {};
		this.selected = [];
		this.autopos = {
			x: 0,
			y: 0,
			z: 0
		};
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

		return this;
	},

	cleanup: function () {
		core.removeObserver('deselect-all', this.id);

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
	},

	autoIconPos: function (icon) {
		if (!icon.cfg.x && !icon.cfg.y) {
			icon.x = this.autopos.x;
			icon.y = this.autopos.y;
			icon.z = this.autopos.z;

			this.autopos.x += icon.size.w;
			if (this.autopos.x > this.w) {
				this.autopos.x = 0;
				this.autopos.y += icon.size.h;
				icon.x = this.autopos.x;
				icon.y = this.autopos.y;
				this.autopos.x += icon.size.w;
			}
			
			this.autopos.z++;
		} else {
			icon.x = icon.pos.x;
			icon.y = icon.pos.y;
			icon.z = icon.pos.z;
		}
	}
	
	// arrangeIcons: function () {
	// 	const icons = this.icons.slice();

	// 	// get the first icon with lowest top, left - this is our fixed point

		

		
	// 	// this.icons.forEach((i1) => {
	// 	// 	this.icons.forEach((i2) => {
	// 	// 		if (i1 !== i2) {
	// 	// 			if (core.util.rectsIntersect(i1.r, i2.r)) {
	// 	// 				i2.x = i1.x + i1.size.w;
	// 	// 			}
	// 	// 		}
	// 	// 	});
	// 	// });
	// }
	
};


core.namespace('core.wb', {
	Desktop: Desktop
});
