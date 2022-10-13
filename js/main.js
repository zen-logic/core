import './zen/core.desktop.js';

core.log('application loaded');

let desktop = new core.wb.Desktop({});

desktop.menubar.setMenu({
	items: [
		{type: 'icon', image: 'css/zen/img/icon/enso.png', items: [
			{type: 'action', cls: 'disabled', label: 'About'},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Projects...'},
			{type: 'action', cls: 'disabled', label: 'Publish...'},
			{type: 'separator'},
			{type: 'action', label: 'CMS', action: (e) => {location = '/cms';}},
			{type: 'action', label: 'Developer tools', action: (e) => {location = '/developer/system';}},
			{type: 'action', label: 'View site', action: (e) => {window.open('/', '_blank').focus();}},
			{type: 'separator'},
		]},
		{type: 'menu', cls: 'app', label: 'Application', items: [
			{type: 'action', label: 'Navigation', action: (e) => {app.showHierarchy();}},
			{type: 'action', label: 'Live preview', action: (e) => {app.showPreview();}},
			{type: 'action', label: 'Content editor', action: (e) => {app.showContentEditor();}},
			
			{type: 'action', cls: 'disabled', label: 'Content modules'},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Brand settings'},
			{type: 'action', label: 'Templates', action: (e) => {app.showTemplates();}},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Visitor analytics'}
		]},
		{type: 'menu', label: 'Window', items: [
			{type: 'action', label: 'Show icons', action: (e) => {app.desktop.showAsIcons();}},
			{type: 'action', label: 'Show list', action: (e) => {app.desktop.showAsList();}},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Properties'}
		]},
		{type: 'menu', label: 'Icon', items: [
			{type: 'action', cls: 'disabled', label: 'Fix in place'},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Properties'}
		]},
		{type: 'menu', label: 'Workspace', items: [
			{type: 'action', label: 'Reset', action: (e) => {app.desktop.cleanup();}},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Save current'}
		]}
	]
});


desktop.addItem(
	new core.wb.Icon({
		label: 'Test icon 1',
		x: 0
	})
);

desktop.addItem(
	new core.wb.Icon({
		label: 'Test icon 2',
		x: 80
	})
);

desktop.addItem(
	new core.wb.Icon({
		label: 'Test icon 3 with a long label',
		x: 160
	})
);

desktop.addItem(
	new core.wb.Window({
		parent: desktop,

		title: 'Zen Workbench',
		
		pos: {
			x: 'centre',
			y: 'centre'
		},

		size: {
			w: 320,
			h: 240,
			minW: 200,
			minH: 100,
			maxW: 600
		}
	})
);


// window.desktop = desktop;
