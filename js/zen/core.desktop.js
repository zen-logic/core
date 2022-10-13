import './core.js';
import './core.ui.js';
import './core.menubar.js';
import './core.window.js';
import './core.icon.js';


function Desktop (params) {
	if (arguments.length > 0) {
		this.stack = {};
		this.selected = [];
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

	
	init: function (params) {
		core.log('New Desktop', params);
		this.cfg = params;
		this.render();
		window.desktop = this;
		return this;
	},

	
	render: function () {
		this.el = core.ui.createElement({
			attr: {id: 'workbench'}
		});

		this.el.dropTarget = this;
		
		this.menubar = new core.wb.MenuBar({
			parent: this
		});

		this.el.addEventListener('click', (e) => {
			if (e.target === this.el) {
				this.deselectAll();
			}
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


	getTopWindow: function () {
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
		let top = this.getTopWindow();
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
	},

	
	removeItem: function (o) {
		delete this.stack[o.id];
	},
	
	
	drop: function (o) {
		this.el.append(o.el);
		this.stack[o.id] = o;
		o.parent = this;
	},

	
};


core.namespace('core.wb', {
	Desktop: Desktop
});
