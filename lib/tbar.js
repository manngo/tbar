'use babel';

import { CompositeDisposable } from 'atom';
const code = require('./tbar-code');

export default {
	subscriptions: null,
	panel: null,

	activate(state) {
		this.subscriptions = new CompositeDisposable();

		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'tbar:toggle': () => this.toggle(),
		}));

		this.panel = code.init();

console.log('activating TBar');
	},

	deactivate() {
		this.panel.destroy();
	//	this.modalPanel.destroy();
		this.subscriptions.dispose();
	//	this.pulsarTbarView.destroy();
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
	}

};
