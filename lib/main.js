'use babel';
console.log('tbar:main.js');

import { CompositeDisposable } from 'atom';
const code = require('./tbar-code');

let consumedService1, consumedService2;

export default {
	subscriptions: null,
	panel: null,

	activate(state) {
		this.subscriptions = new CompositeDisposable();

		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'tbar:toggle': () => this.toggle(),
			'tbar:get-text-tools-menu': () => this.getTextToolsMenu(),
			'tbar:get-html-tools-menu': () => this.getHTMLToolsMenu(),
		}));

		this.panel = code.init();

console.log('activating TBar');
	},

	deactivate() {
		this.panel.destroy();
		this.subscriptions.dispose();
	},

	serialize() {
		return {
		//	pulsarTbarViewState: this.pulsarTbarView.serialize()
		};
	},

	toggle() {
		return this.panel.isVisible()
		? this.panel.hide()
		: this.panel.show();
	},

	importTextToolsMenu(service) {
		consumedService1 = service;
	},
	importHTMLToolsMenu(service) {
		consumedService2 = service;
	},
	async getTextToolsMenu() {
		if (consumedService1) {
			let menu = await consumedService1.doSomething();
			console.log(menu);

			code.addMenu(menu);
			code.save();
		}
	},
	async getHTMLToolsMenu() {
		if (consumedService2) {
			let menu = await consumedService2.doSomething();
			console.log(menu);

			code.addMenu(menu);
			code.save();
		}
	},

};
