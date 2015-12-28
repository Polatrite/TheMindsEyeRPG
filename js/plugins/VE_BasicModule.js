/*
 * ==============================================================================
 * ** Victor Engine MV - Basic Module
 * ------------------------------------------------------------------------------
 * Version History:
 *  v 1.00 - 2015.11.26 > First release.
 *  v 1.01 - 2015.11.29 > Added function to get database objects.
 *  v 1.02 - 2015.12.07 > Added function to get multiples elements.
 *                      > Added check for plugin correct order.
 *  v 1.03 - 2015.12.13 > Added function to get page comments.
 *  v 1.04 - 2015.12.21 > Added function to check only relevant objects.
 *  v 1.05 - 2015.12.25 > Added check to wait bitmap loading.
 * ==============================================================================
 */

var Imported = Imported || {};
Imported['VE - Basic Module'] = '1.05';

var VictorEngine = VictorEngine || {};
VictorEngine.BasicModule = VictorEngine.BasicModule || {};

(function() {

	PluginManager.requiredPlugin = function(name, required, version) {
		VictorEngine.BasicModule.loadedPlugins = VictorEngine.BasicModule.loadedPlugins || {};
		if (version && (!Imported[required] || Number(Imported[required]) < Number(version))) {
			var msg = 'The plugin ' + name + ' requires the plugin ' + required;
			msg += ' v' + version + ' or higher installed to work properly'
			if (Number(Imported[required]) < Number(version)) {
				msg += '. Your current version is v' + Imported[required];
			}
			msg += '. Go to http://victorenginescripts.wordpress.com/ to download the updated plugin.';
			throw msg;
		} else if (!version && VictorEngine.BasicModule.loadedPlugins[required] === true) {
			var msg = 'The plugin ' + name + ' requires the plugin ' + required;
			msg += ' to be placed bellow it. Open the Plugin Manager and place';
			msg += ' the plugins in the correct order.';
			throw msg;
		} else {
			VictorEngine.BasicModule.loadedPlugins[name] = true
		}
	};

})();

/*:
 * ------------------------------------------------------------------------------
 * @plugindesc v1.05 - Plugin with base code required for all Victor Engine plugins.
 * @author Victor Sant
 *
 * ------------------------------------------------------------------------------
 * @help 
 * ------------------------------------------------------------------------------
 * Install this plugin above any other Victor Engine plugin.
 * ------------------------------------------------------------------------------
 */
 
(function() {
	
	//=============================================================================
	// DataManager
	//=============================================================================
	

	VictorEngine.BasicModule.isDatabaseLoaded = DataManager.isDatabaseLoaded;
	DataManager.isDatabaseLoaded = function() {
		if (!VictorEngine.BasicModule.isDatabaseLoaded.call(this)) return false;
		VictorEngine.loadParameters();
		VictorEngine.loadNotetags();
		return ImageManager.isReady();
	};

	//=============================================================================
	// VictorEngine
	//=============================================================================
	
	VictorEngine.loadNotetags = function() {
		if (VictorEngine.BasicModule.loaded) return;
		VictorEngine.BasicModule.loaded = true;
		var list = [$dataActors, $dataClasses, $dataSkills, $dataItems, $dataWeapons, 
					$dataArmors, $dataEnemies, $dataStates];
		list.forEach(function(objects, index) { this.processNotetags(objects, index) }, this);
	};
	
	VictorEngine.processNotetags = function(objects, index) {
		objects.forEach(function(data) {
			if (data) this.loadNotetagsValues(data, index);
		}, this);
	};
	
	VictorEngine.objectSelection = function(index, list) {
		var objects = ['actor', 'class', 'skill', 'item', 'weapon', 'armor', 'enemy', 'state'];
		return list.contains(objects[index]);
	};
	
	VictorEngine.loadNotetagsValues = function(data) {
	};
	
	VictorEngine.loadParameters = function(data) {
	};
	
	VictorEngine.getNotesValues = function(value1, value2) {
		if (!value2) value2 = value1;
		return new RegExp('<' + value1 + '>((?:[^<]|<[^\\/])*)<\\/' + value2 + '>', 'gi');
	};
	
	VictorEngine.getPageNotes = function(event) {
		if (!event.list()) return "";
		return event.list().reduce(function(r, cmd) {
			var valid   = (cmd.code === 108 || cmd.code === 408);
			var comment = valid ? cmd.parameters[0] + "\r\n" : "";
			return r + comment;
		}, "");
	};
	
	VictorEngine.getAllObjects = function(object) {
		return object.traitObjects().reduce(function(r, obj) {
			return r.concat(obj);
		}, []);
	};
	
	VictorEngine.getAllElements = function(subject, item) {
		if (item.damage.elementId < 0) {
			return subject.attackElements();
		} else {
			return [item.damage.elementId];
		}
	};
	
	VictorEngine.getAllStates = function(subject, item) {
		var result;
		return item.effects.reduce(function(r, effect) {
			if (effect.code === 21) {
				if (effect.dataId === 0) {
					result = subject.attackStates();
				} else {
					result = [effect.dataId];
				};
			} else {
				result = [];
			};
            return r.concat(result);
        }, []);
	};
	
})();