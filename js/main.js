import './zen/core.desktop.js';
import './zen/view.icons.js';

core.log('application loaded');

let desktop = new core.wb.Desktop({});

const splash = `
	<div class="imageview" style="
		background-image: url(img/zen/wall/2.jpg);
		background-size: cover;
		border: 1px solid #000;
		display: flex; justify-content: center; align-items: center;
		position: relative;
	">
		<img src="css/zen/img/icon/enso.png" style="height: 80%; filter: invert(1); opacity: .5;" draggable="false">
		<div style="
			text-shadow: -1px 1px 1px #000,
						  1px 1px 1px #000,
						 1px -1px 1px #000,
						-1px -1px 1px #000;
			position: absolute; 
			width: 100%; height: 100%; top: 0; left: 0;
			text-align: center;
			color: #fff; 
			display: flex; 
			flex-direction: column; 
			justify-content: center; 
			align-items: center;
			">
			<div>
				<p style="font-size: 18px; font-weight: bold; margin: 0;">Workbench</p>
				<div style="text-shadow: none; font-size: 10px;">
					<p style="margin: 0;">Core: 2.03.11</p>
					<p style="margin: 0;">Python: 3.9.13</p>
					<p style="margin: 0;">UWSGI: 2.0.20</p>
				</div>
				<p style="margin: .5em 0 0 0; font-size: 12px;">&copy; 2015-2022 <a style="color: #fff; text-decoration: none;" href="https://zenlogic.co.uk" target="_blank">Zen Logic Ltd.</a></p>
			</div>
		</div>
	</div>`;

desktop.menubar.setMenu({
	items: [
		{type: 'icon', image: 'css/zen/img/icon/enso.png', items: [
			{type: 'action', label: 'About', action: (e) => {
				if (desktop.hasItem('splash')) {
					desktop.getItem('splash').select();
				} else {
					desktop.addItem(
						new core.wb.Window({
							id: 'splash',
							parent: desktop,
							features: ['close'],
							pos: {x: 'centre', y: 'centre'},
							size: {w: 320, h: 240},
							content: splash
						})
					);
				}
			}},
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
		image: 'img/zen/icon/world.png',
		label: 'System',
		_fixed: true,
		x: 0,
		data: {
			dblclick: (o) => {
				alert(o.label);
			}
		}
	})
);

desktop.addItem(
	new core.wb.Icon({
		image: 'img/zen/icon/cubes.png',
		label: 'Content blocks',
		x: 80
	})
);

desktop.addItem(
	new core.wb.Icon({
		image: 'img/zen/icon/templates.png',
		label: 'Templates',
		x: 160
	})
);

desktop.addItem(
	new core.wb.Icon({
		image: 'img/zen/icon/websites.png',
		label: 'Organisations',
		x: 240
	})
);

desktop.addItem(
	new core.wb.Icon({
		image: 'img/zen/icon/database.png',
		label: 'Databases',
		x: 320
	})
);

desktop.addItem(
	new core.wb.Icon({
		image: 'img/zen/icon/users.png',
		label: 'Users',
		x: 400
	})
);

desktop.addItem(
	new core.wb.Icon({
		image: 'img/zen/icon/images.png',
		label: 'Images',
		x: 480
	})
);

desktop.addItem(
	new core.wb.Icon({
		image: 'img/zen/icon/folder.png',
		label: 'Files',
		x: 560
	})
);

desktop.addItem(
	new core.wb.Icon({
		image: 'img/zen/icon/config.png',
		label: 'Configuration',
		x: 640
	})
);

desktop.addItem(
	new core.wb.Icon({
		image: 'img/zen/icon/video.png',
		label: 'Video',
		x: 720
	})
);

const win = desktop.addItem(
	new core.wb.Window({
		parent: desktop,
		title: 'Icon Window',
		pos: {x: 100, y: 200},
		size: {w: 320, h: 240, minW: 200, minH: 100, maxW: 600}
	})
);

new core.wb.IconView({
	parent: win,
	container: win.body
});

