import './core.ui.js';

let core = window.core !== undefined ? window.core : {};


function Example (params) {
	if (arguments.length > 0) this.init(params);
	return this;
}


Example.prototype = {

	init: function (params) {
		core.log('New Example', params);
		this.cfg = params;
		this.render();
		return this;
	},

	render: function () {
		this.el = core.ui.createElement({
		});
	}
	
};


core.namespace('core.wb', {
	Example: Example
});
