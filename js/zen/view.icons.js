import './core.ui.js';


function IconView (params) {
	if (arguments.length > 0) {
		this.stack = {};
		this.selected = [];
		this.init(params);
	}
	return this;
}


IconView.prototype = {

	init: function (params) {
		core.log('New IconView', params);
		this.cfg = params;
		this.render();
		return this;
	},

	render: function () {
		this.el = core.ui.createElement({
			parent: this.cfg.container,
			cls: ['iconview']
		});

		this.el.dropTarget = this;
	},

	drop: function (o) {
		let rect = this.el.getBoundingClientRect();
		this.el.append(o.el);
		this.stack[o.id] = o;
		o.parent = this;
		o.x = o.x - rect.x;
		o.y = o.y - rect.y;
		o.deselect();
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
	

	
	select: function (o, multi) {
		if (multi === true) {
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


	addItem: function (o) {
		this.stack[o.id] = o;
		o.parent = this;
		return o;
	},

	
	removeItem: function (o) {
		delete this.stack[o.id];
	},
	
};


core.namespace('core.wb', {
	IconView: IconView
});
