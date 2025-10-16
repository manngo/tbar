'use strict';

function dbug(data) {
	let error = new Error();
	let recent = [...error.stack.matchAll(/\n *at \S* \(?([^()]*)/g)][1][1]
	let[file, line, charpos] = recent.split(':');
	file = file.split(/[\\/]/).pop();

	let info = `${file}: ${line}`;
	console.log(info, data ? data : '');
}

dbug('tbar-code.js');

const jx = require('./library');
const code = {
	toolbar: undefined,
	fsp: undefined,
	packageDir: undefined,
	packageInfo: undefined,
	name: undefined,
	buttons: [],
	items: undefined,
	popup: undefined,

	about() {
		let html = `
			<p id="title">About TBar</p>
			<p>Copyright © Mark Simon</p>
			<p>More information at:</p>
			<p><a href="https://github.com/manngo/tbar">https://github.com/manngo/tbar</a></p>
			<p>Share &amp Enjoy</p>
			<button name="ok" value="1">OK</button>
		`;
		return jx.pseudoDialog(html, {id: 'tbar-about', returnElement: 'ok'})
		.then(response => {
			console.log(response);
		});

	},

	renameButton(button) {
			button = this.popup.button;
		//	embed temporary span for renameing to allow spaces
			let content = button.textContent;
			let span = document.createElement('span');
			span.textContent = content;
		//	button.firstChild.replaceWith(span);
		//	button.replaceChild(span, button.firstChild);
			button.innerHTML = '';
			button.append(span);
			span.contentEditable = 'plaintext-only';

		//	Select content
			var range = document.createRange();
			var selection = window.getSelection();
			range.setStart(span, 0);
			range.setEnd(span, span.childNodes.length);
			selection.removeAllRanges();
			selection.addRange(range);

		//	temporarily disable button
			let onclick = button.onclick;
			button.onclick = undefined;

		//	cancel renaming on loss of focus
			span.onblur = event => {
				button.textContent = content;
				button.onclick = onclick;
			};

		//	Finish renaming on Enter
			span.onkeydown = event => {
				if(event.key=='Enter') {
					event.preventDefault();
					if(!span.textContent) button.textContent = content;
					else button.textContent = button.textContent;
					this.save();
					button.onclick = onclick;
				}
			}

		//	Close popup
			this.popup.blur();
	},

	addURL() {
		let html = `
			<p id="title">Add URL</p>
			<label>URL: <input name="url" type="text"></label>
			<button name="cancel">Cancel</button><button name="ok">OK</button>
		`;
		return jx.pseudoDialog(html, {id: 'tbar-addurl', returnEement: 'url', focus: 'url'})
		.then(url => {
			if(!url) return;
			if(!url.match(/https?:\/\//)) url = `https://${url}`;
			let button = this.addButton(url, url, `open ${url}`, true, this.popup);
			this.renameButton(button);
		});

	},

	addFile() {
		let file = atom.workspace.getActiveTextEditor()?.getPath();
		let button = this.addButton(file, `file:///${file}`, `open ${file}`, true, this.popup);
		this.renameButton(button);
	},

	addDummyMenu() {
		let menuItems = [
			{label: 'Item 1', action: '', tooltip: '' },
			{label: 'Item 2', action: '', tooltip: '' }
		];

		let [menu, items, toggle] = jx.addMenu(
			'Menu Label', 'tbar-menu', undefined, menuItems
		);
		menu.dataset.save = true;
		menu.querySelector('button').classList.add('menu');
		menu.content = menuItems;
		menu.title = '';
		this.addToolButton(menu);
		this.items.append(menu);
	},

	dispatch(action) {
		switch(typeof action) {
			case 'function':
				action();
				break;
			case 'string':
				if(action.match(/^file:\/\//)) {
					action = action.replace(/^file:\/\//,'');
					atom.workspace.open(action);
					dbug(`atom.workspace.open('${action}')`);
				}
				else if(action.match(/^https?:\/\//)) {
					require('electron').shell.openExternal(action);
					dbug(`require('electron').shell.openExternal('${action}')`);
				}
				else if(action.match(/^.+?:.+$/)) {
					atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), action);
					dbug(`do ${action}`);
				}
				break;
		}
	},

	addButton(label, action, tooltip=undefined, save=false) {
		//	Create Button
			let button = document.createElement('button');
			button.innerHTML = label;

		//	Button Properties
			tooltip = tooltip ?? action;
			button.title = tooltip;

		//	Action
			switch(typeof action) {
				case 'string':
					button.dataset.action = action;
					button.onclick = event => {
					//	atom.commands.dispatch(atom.views.getView(atom.workspace), action);
						this.dispatch(action);
					};

					break;
				case 'function':
					button.onclick = action;
					break;
			}

		//	Saveable
			if(save) button.dataset.save = true;
			if(save) this.addToolButton(button);
			this.items.append(button);


//		if(this.popup) button.oncontextmenu = this.popup.show;
		if(this.popup) button.oncontextmenu = event => {
			this.popup.item = this.popup.button = event.target;
			this.popup.show(event.target.parentElement);
			event.stopPropagation();
			event.preventDefault();
		};


		return button;
	},

	addMenu(item) {
//	dbug(item);
		let content = JSON.parse(JSON.stringify(item.menu));
		item.menu.forEach(i => {
			let {label, action, tooltip, menu} = i;
			if(typeof action == 'string') i.action = code.dispatch.bind(code, action);
			else if(menu) {
				dbug(i);
				menu.forEach(i => {
					let {action} = i;
					if(typeof action == 'string') i.action = code.dispatch.bind(code, action);
				});
			}
		});
		let [menu, items, button] = jx.addMenu(
			item.label, 'tbar-menu', undefined, item.menu
		);
		menu.dataset.save = true;
		menu.querySelector('button').classList.add('menu');
		menu.content = content;
		menu.title = item.tooltip;
		this.addToolButton(menu);
		this.items.append(menu);

		if(this.popup) button.oncontextmenu = event => {
			this.popup.button = button;
			this.popup.item = menu;
			this.popup.show(event.target.parentElement.parentElement);
			event.stopPropagation();
			event.preventDefault();
		};

	},

	async load() {
		this.items.innerHTML = '';
	//	this.popup = this.addContextMenu(undefined, 'popup', 'button-rename', [
		[this.popup] = jx.addMenu(undefined, 'popup', 'button-rename', [
			{	label: 'Remove',
				action: event => {
dbug(`Remove ${this.popup.item}`)
					this.popup.item.remove();
					code.save();
				},
				tooltip: 'Remove Button'
			},
			{	label: 'Rename',
				action: event => {
dbug(`Rename ${this.popup.button}`)
					code.renameButton(this.popup.button);
					code.save();
				},
				tooltip: 'Rename Button Label'
			},
		]);

		this.items.append(this.popup);

		let text, data;

		//	get defaults
			try {
				let path = `${this.packagePath}/lib/default.json`;
				text = await this.fsp.readFile(path, 'utf8');
			}
			catch (error) {
				dbug(error);
				text = `{ "buttons": []	}`;
			}

			data = JSON.parse(text);

		//	get or create config file
			let tbarJSONpath = `${atom.getConfigDirPath()}/tbar.json`;

			try {
				await this.fsp.access(tbarJSONpath);
dbug('file exists');
				await this.fsp.copyFile(tbarJSONpath, `${atom.getConfigDirPath()}/tbar.bak.json`);
				text = await this.fsp.readFile(tbarJSONpath, 'utf8');
				data = JSON.parse(text);
dbug(data);
			} catch(error) {
await jx.pseudoAlert('<code>tbar.json</code> not available.<br>Creating new file.');
				text = JSON.stringify(data, null, '\t');
				try {
					await this.fsp.writeFile(tbarJSONpath, text, 'utf8');
dbug('written?');
				} catch(error) {
dbug(error)
				}
			}

		data.buttons.forEach(item => {
			if(item.action) this.addButton(item.label, item.action, item.tooltip, true, this.popup);
			else if(item.menu) this.addMenu(item);
		});
	},

	async save() {
dbug('save');
		let data = await this.fsp.readFile(`${atom.getConfigDirPath()}/tbar.json`, 'utf8');
		data = JSON.parse(data);
		data.buttons = Array.from(this.buttons)
			.filter(button => button.dataset.save)
			.map(button =>
				typeof(button.dataset.action) == 'string'
				? {
					label: button.textContent,
					action: button.dataset.action,
					tooltip: button.title,
				}
				: button.content
				? {
						label: button.querySelector('button').textContent,
						menu: button.content,
						tooltip: button.title,
				}
				: {}
			);
		data = JSON.stringify(data, null, '\t');
		await this.fsp.writeFile(`${atom.getConfigDirPath()}/tbar.json`, data, 'utf8');
	},
	async loadCSS() {
	//	let ssPath = `${this.packagePath}/styles/${this.packageInfo['name']}.less`;
		let packageInfo = require('../package.json');
		let packagePath = `${atom.getConfigDirPath()}/packages/${packageInfo['name']}`;
		let ssPath = `${packagePath}/styles/${packageInfo['name']}.less`;
		let css = atom.themes.loadStylesheet(ssPath);
		atom.styles.addStyleSheet(css, {sourcePath: ssPath});
	},

	initCommandPanel() {
		function doFilter() {
			let ul = this.querySelector('ul#commands');
			let filter = this.querySelector('input[name="filter"]');
			let filterText = filter.value;

			let commands = atom.commands.findCommands({target: atom.views.getView(atom.workspace.getActiveTextEditor())})
			.filter(command => command.name.includes(filterText));
			commands = commands.map(command => `<li><span class="display-name">${command.displayName}</span><span class="name">${command.name}</span></li>`);
			ul.innerHTML = commands.join('');
			ul.querySelectorAll('li>span').forEach(span => {
				span.inert = true;
			});
		}

		let div = document.createElement('div');
		div.classList.add('native-key-bindings');
		div.id='tbar-command-panel';

		let form = document.createElement('form');
		div.appendChild(form);

		form.innerHTML = `
				<input name="filter" type="text"/>
				<ul id="commands">hahaha</ul>
				<span id="command">
					<input type="text" name="display-name">
					<input type="text" name="name" readonly>
				</span>
				<button name="cancel">Cancel</button>
				<button name="ok">Add</button>
		`;

		let filter = form.elements['filter'];
		let ul = form.querySelector('ul#commands');
		let name = form.elements['name'];
		let displayName = form.elements['display-name'];

		filter.addEventListener('keyup', doFilter.bind(form));
		ul.addEventListener('click', event => {
			let [displayName, name] = event.target.querySelectorAll('span');
			[form.elements['display-name'].value, form.elements['name'].value] = [displayName.textContent, name.textContent];
		});
		filter.addEventListener('focus', doFilter.bind(form));

		filter.addEventListener('keydown', event => {
//	dbug(event.key)
			switch(event.key) {
				case 'Enter':
				case 'Return':
					form.elements['ok'].click();
					break;
				case 'Escape':
					form.elements['cancel'].click();
					break;
			}
		});

		this.commandPanel = atom.workspace.addModalPanel({item: div, visible: false,});
	},

	openCommandPanel() {
		this.commandPanel.show();
		let form = this.commandPanel.getElement().querySelector('div>form');
		form.elements['filter'].focus();
		return new Promise ((resolve, reject) => {
			form.elements['ok'].onclick = event => {
				resolve([form.elements['display-name'].value, form.elements['name'].value]);
				this.commandPanel.hide();
			};
			form.elements['cancel'].onclick = event => {
				resolve(null);
				this.commandPanel.hide();
			};
		});


	},

	async addCommand() {
		let result = await code.openCommandPanel();
		if(result) {
			let [displayName, name] = result;
//	dbug([displayName, name])
			if(displayName && name) {
				let button = code.addButton(displayName, name, undefined, true);
				code.save();
			}
		}
	},

	init() {
		dbug('tbar init?')
		this.fsp = require("fs/promises");

		this.packageInfo = require('../package.json');
		this.packagePath = `${atom.getConfigDirPath()}/packages/${this.packageInfo['name']}`;

		this.toolbar = document.createElement('div');
		this.toolbar.id = 'tbar';
		this.toolbar.classList.add('native-key-bindings');

		this.toolbar.classList.add('horizontal');
		var panel = atom.workspace.addTopPanel({item: this.toolbar});

		/*	TBar Menu
			================================================
			👀 🦧 🍺 🍵
			atom.commands.dispatch(atom.views.getView(atom.workspace), action);
			================================================ */

			let [menu, items, toggle] = jx.addMenu('Actions', 'tbar-menu', 'tbar-main-menu');
			this.toolbar.append(menu);

			//	menu.addItem('Add Item …', this.addCommand.bind(code), 'Add Item');

			menu.addItems([
				{ label: 'About …', action: this.about.bind(code), tooltip: 'About Tbar'},
				{ },
				{ label: 'Add Command Button …', action: this.addCommand.bind(code), tooltip: 'Add Command Button'},
				{ label: 'Add File …', action: this.addFile.bind(code), tooltip: 'Add Current File'},
				{ label: 'Add URL …', action: this.addURL.bind(code), tooltip: 'Add URL'},
				{ label: 'Add Menu …', action: this.addDummyMenu.bind(code), tooltip: 'Add dummy menu to JSON file'},
				{ },
				{ label: 'Add Text Tools Menu', action: code.dispatch.bind(code, 'tbar:get-text-tools-menu'), tooltip: 'Add Text Tools Menu'},
				{ label: 'Add HTML Tools Menu', action: code.dispatch.bind(code, 'tbar:get-html-tools-menu'), tooltip: 'Add Text Tools Menu'},
				{ },
				//	code.dispatch.bind(code, action);
				{ label: 'Open GitHub Repository', action: code.dispatch.bind(code, 'https://github.com/manngo/tbar'), tooltip: 'GitHub Repository'},
				{ label: 'Open JSON File', action: code.dispatch.bind(code, `file:///${atom.getConfigDirPath()}/tbar.json`), tooltip: 'TBar Data'},
				{ hidden: true },
				{ label: 'Open CSS File', action: code.dispatch.bind(code, `file:///${this.packagePath}/styles/${this.packageInfo['name']}.less`), tooltip: 'TBar CSS', hidden: true },
				{ label: 'Reload TBar', action: this.load.bind(code), tooltip: 'Reload TBar Items', hidden: true },
				{ label: 'Refresh CSS', action: this.loadCSS.bind(code), tooltip: 'Refresh CSS', hidden: true },
				{ label: 'Save', action: this.save.bind(code), tooltip: 'Save TBar Items', hidden: true },
		]);

		/*	Add div for items
			================================================ */

			this.items = document.createElement('div');
			this.items.id = 'tbar-items';
			this.toolbar.append(this.items);
			this.addToolButton = jx.dragList(this.items, { callback: this.save.bind(this)});
			this.buttons = this.items.children;

		this.load();

		this.modalPanel = this.initCommandPanel();

		return panel;
	}
}

module.exports = code;
