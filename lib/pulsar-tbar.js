'use babel';

//	import PulsarTbarView from './pulsar-tbar-view';
import { CompositeDisposable } from 'atom';
const code = require('./pulsar-tbar-code');

export default {

	pulsarTbarView: null,
	modalPanel: null,
	subscriptions: null,

	activate(state) {
	//	this.pulsarTbarView = new PulsarTbarView(state.pulsarTbarViewState);
	//	this.modalPanel = atom.workspace.addModalPanel({
	//		item: this.pulsarTbarView.getElement(),
	//		visible: false
	//	});

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'pulsar-tbar:add-item': () => this.addItem(),
			'pulsar-tbar:reload-items': () => code.load(),
			'pulsar-tbar:reload-css': () => this.toggle(),
		}));

		code.init();
	},

	deactivate() {
		this.modalPanel.destroy();
		this.subscriptions.dispose();
		this.pulsarTbarView.destroy();
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
	}

};
