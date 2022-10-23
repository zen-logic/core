import './zen/core.desktop.js';
import './zen/core.storage.js';
import './zen/view.icons.js';


function App (params) {
	if (arguments.length > 0) this.init(params);
	return this;
}

App.prototype = {

	init: function (params) {
		core.log('application loaded');
		this.id = 'APPLICATION';
		this.cfg = params;
		this.urlParams = new URLSearchParams(window.location.search);

		this.db = new core.db.Storage(this.cfg.schema);
        this.db.open().then(() => {
			this.launch();
		});
		
		return this;
	},

	launch: function () {
		this.desktop = new core.wb.Desktop(this.cfg.workbench);
		// this.desktop.menubar.setMenu(menu);
		this.desktop.menubar.setMenu(this.cfg.menubar);
		this.setupObservers();
	},

	setupObservers: function () {

		core.observe('CreateWindow', this.id, (src) => {

			if (src.options) {
				if (src.options.single === true) {
					if (desktop.hasItem(src.options.id)) {
						desktop.getItem(src.options.id).select();
						return;
					}			
				}
				const win = new core.wb[src.options.type](src.options);
				desktop.addItem(win);
			}
			
		});

	}
	
};


core.getJSON('js/config.json').then((config) => {
	window.app = new App(config);			
});



