import './core.ui.js';
import {rubberband} from './mixin.rubberband.js';


function IconView (params) {
	if (arguments.length > 0) {
		Object.assign(this, rubberband);
		this.rubberband = null;
		this.stack = {};
		this.selected = [];
		this.init(params);
	}
	return this;
}


IconView.prototype = {

	init: function (params) {
		core.log('New IconView', params);
		this.parent = params.parent;
		this.cfg = params;
		this.id = params.id === undefined ? core.util.createUUID() : params.id;
		this.parent.addView(this);
		this.render();
		return this;
	},

	render: function () {
		this.el = core.ui.createElement({
			parent: this.cfg.container,
			cls: ['iconview']
		});

		this.el.addEventListener('click', (e) => {
			if (this.selected.length > 0) {
				e.stopPropagation();
			}
		});
		
		this.el.addEventListener('mousedown', (e) => {
			if (e.currentTarget === e.target) {
				this.deselectAll();
				core.notify('deselect-all', {source: this.id});
				this.getRubberBand(e);
			}
		});

		this.el.dropTarget = this;

		core.observe('deselect-all', this.id, (params) => {
			if (params.source !== this.id) {
				this.deselectAll();
			}
		});
		
	},

	cleanup: function () {
		core.removeObserver('deselect-all', this.id);
	},
	
	drop: function (o) {
		let rect = this.el.getBoundingClientRect();
		this.el.append(o.el);
		this.stack[o.id] = o;
		o.parent = this;
		o.x = o.x - rect.x;
		o.y = o.y - rect.y;
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
			// core.log('select multi');
			// check it's not already selected
			if (!this.selected.includes(o)) {
				this.selected.push(o);
			}
			
		} else {
			// core.log('select single');
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