'use babel';

//	import PulsarTbarView from './tbar-view';
import { CompositeDisposable } from 'atom';
const code = require('./tbar-code');

export default {
	subscriptions: null,
	panel: null,

	activate(state) {
		//	this.pulsarTbarView = new PulsarTbarView(state.pulsarTbarViewState);
		//	this.modalPanel = atom.workspace.addModalPanel({
		//		item: this.pulsarTbarView.getElement(),
		//		visible: false
		//	});

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'tbar:add-item': () => this.addItem(),
			'tbar:reload-items': () => code.load(),
			'tbar:reload-css': () => this.toggle(),
			'tbar:toggle': () => this.toggle(),
		}));

		this.panel = code.init();

console.log('activating Pulsar TBar');
	},

	deactivate() {
		this.panel.destroy();
	//	this.modalPanel.destroy();
		this.subscriptions.dispose();
	//	this.pulsarTbarView.destroy();
	},

	serialize() {
		return {
			pulsarTbarViewState: this.pulsarTbarView.serialize()
		};
	},

	async addItem() {
		let [displayName, name] = await code.openFinder();
console.log([displayName, name])
		if(displayName && name) {
			let button = code.addButton(displayName, name, undefined, true);
			code.save();
		}
	},

	toggle() {
console.log(`${this.panel.isVisible()}`);
		return this.panel.isVisible()
		? this.panel.hide()
		: this.panel.show();
console.log(`${this.panel.isVisible()}`);
	}

};
