/*
 * ==============================================================================
 * ** Victor Engine MV - Counter Actions
 * ------------------------------------------------------------------------------
 * Version History:
 *  v 1.00 - 2015.12.04 > First release.
 *  v 1.01 - 2015.12.07 > Compatibility with VE - Retaliation Damage.
 *                      > Addeded counter animation.
 *  v 1.02 - 2015.12.21 > Compatibility with Basic Module 1.04.
 *  v 1.03 - 2015.12.26 > Fixed issue with item counter.
 * ==============================================================================
 */

var Imported = Imported || {};
Imported['VE - Counter Actions'] = '1.03';

var VictorEngine = VictorEngine || {};
VictorEngine.CounterActions = VictorEngine.CounterActions || {};

(function() {

	VictorEngine.CounterActions.loadDatabase = DataManager.loadDatabase;
	DataManager.loadDatabase = function() {
		VictorEngine.CounterActions.loadDatabase.call(this);
		PluginManager.requiredPlugin.call(PluginManager, 'VE - Counter Actions', 'VE - Basic Module', '1.04');
		PluginManager.requiredPlugin.call(PluginManager, 'VE - Counter Actions', 'VE - Retaliation Damage');
	};

	VictorEngine.CounterActions.requiredPlugin = PluginManager.requiredPlugin;
	PluginManager.requiredPlugin = function(name, required, version) {
		if (!VictorEngine.BasicModule) {
			var msg = "The plugin " + name + " requires the plugin " + required + " v" + version + " or higher ";
			msg += "installed to work properly. Go to http://victorenginescripts.wordpress.com/ to download the plugin.";
			throw new Error(msg);
		} else {
			VictorEngine.CounterActions.requiredPlugin.call(this, name, required, version)
		};
	};
	
})();

/*:
 *------------------------------------------------------------------------------ 
 * @plugindesc v1.03 - Skills and items to be used as counter attacks.
 * @author Victor Sant
 *
 * @param Counter Animation
 * @desc ID of the animation displayed when a action is countered.
 * Default: 0. (No animation)
 * @default 0
 *
 * ------------------------------------------------------------------------------
 * @help 
 * ------------------------------------------------------------------------------
 * Actors, Classes, Enemies, Weapons, Armors and States Notetags:
 * ------------------------------------------------------------------------------
 *
 *  <action counter: trigger, action, rate(, priority)>
 *  Setup a custom counter effect. 
 *
 *    The trigger value must be one of the following values
 *      skill x   | Counter when hit by the skill ID = x
 *      item x    | Counter when hit by the item ID = x
 *      stype x   | Counter when hit by skills with skill type ID x
 *      itype x   | Counter when hit by items with item type ID x
 *      element x | Counter when hit by actions with element ID x
 *      physical  | Counter when hit by physical damage
 *      magical   | Counter when hit by magical damage
 *      damage    | Counter when hit by any damage
 *
 *    The action value must be one of the following values
 *      attack    | Uses a basic attack
 *      guard     | Uses the guard action
 *      skill x   | Counter with the skill ID = x
 *      item x    | Counter with the item ID = x
 *
 *    The rate value should be a % numeric or a custom code.
 *
 *    The priority is a opitional arbitrary value, this defines wich skill will 
 *    have priority when multiple different actions are usable as a counter.
 *    The ones with higher priority will go first. If several actions have the
 *    same priority, the one with highest ID will be used.
 *
 * ------------------------------------------------------------------------------
 *
 *  When using the 'code' always insert the code inside quotations and don't use
 *  line breaks. The code uses the same values as the damage formula, so you can 
 *  use "a" for the user, "b" for the target, "v[x]" for variable. The result
 *  must be a numeric value between 0 and 100 (any value above or bellow that
 *  is irrelevant)
 *
 *  Each counter source is calculated separatedely. So if you have two effects
 *  that gives 50% counter, you will not have 100% counter, even if those sources
 *  have exactly the same setup.
 *
 *  The counter action must be still usable and the costs are still consumed.
 *  Enemies can't use items.
 *
 * ------------------------------------------------------------------------------
 *
 * Example Notetags:
 *   <action counter: physical, attack, 20%>
 *
 *   <action counter: damage, item 1, 50%, 10>
 *
 *   <action counter: stype 1, skill 3, 'a.level'>
 *
 *   <action counter: skill 1, item 3, 25%>
 *
 *   <action counter: element 1, guard, 30%>
 *
 * ------------------------------------------------------------------------------
 *
 * Compatibility:
 * - When used together with the plugin 'VE - Retaliation Damage', place this
 *   plugin above it.
 *
 * ------------------------------------------------------------------------------
 */

	
(function() {

	//=============================================================================
	// Parameters
	//=============================================================================
	
	var parameters = PluginManager.parameters("VE_CounterActions");
	VictorEngine.Parameters = VictorEngine.Parameters || {};
	
	VictorEngine.Parameters.CounterAnimation = Number(parameters["Counter Animation"]) || 0;
	
	//=============================================================================
	// VictorEngine
	//=============================================================================
	
	VictorEngine.CounterActions.loadNotetagsValues = VictorEngine.loadNotetagsValues;
	VictorEngine.loadNotetagsValues = function(data, index) {
		VictorEngine.CounterActions.loadNotetagsValues.call(this, data, index);
		var list = ['actor', 'class', 'enemy', 'weapon', 'armor', 'state'];
		if (this.objectSelection(index, list)) VictorEngine.CounterActions.loadNotes(data);
	};
	
	VictorEngine.CounterActions.loadNotes = function(data) {
		data.counterActions = data.counterActions || [];
		this.processNotes(data);
	};
	
	VictorEngine.CounterActions.processNotes = function(data) {
		part1 = "[ ]*(\\w+)[ ]*(\\d+)?[ ]*,[ ]*(\\w+)[ ]*(\\d+)?"
		part2 = "[ ]*,[ ]*(\\d+\\%|[\"'“‘].*[\"'”’])(?:,[ ]*(\\d+))?"
		var regex = new RegExp('<action counter:' + part1 + part2 + '>', 'gi');
		var match;
		while ((match = regex.exec(data.note)) !== null) {
			this.processValues(match, data.counterActions);
		};
	};
		
	VictorEngine.CounterActions.processValues = function(match, data) {
		var value;
		var result = {};
		var regex1 = new RegExp('(\\d+)\\%', 'gi');
		var regex2 = new RegExp("[\"'“‘](.*)[\"'”’]", 'gi');
		result.type = match[1].toLowerCase();
		result.typeId = Number(match[2]) || 0;
		result.action = match[3].toLowerCase();
		result.actionId = Number(match[4]) || 0;
		while ((value = regex1.exec(match[5])) !== null) { result.rate = Number(value[1]) };
		while ((value = regex2.exec(match[5])) !== null) { result.code = value[1] };
		result.priority = Number(match[6]) || 0;
		data.push(result);
	};
	
	//=============================================================================
	// BattleManager
	//=============================================================================
	
	VictorEngine.CounterActions.invokeCounterAttack = BattleManager.invokeCounterAttack;
	BattleManager.invokeCounterAttack = function(subject, target) {
		if (this._action._counterAction) {
			BattleManager.startCounterAction(subject, target);
		} else {
			VictorEngine.CounterActions.invokeCounterAttack.call(this, subject, target);
		};
	};
		
	VictorEngine.CounterActions.update = BattleManager.update;
	BattleManager.update = function() {
		if (!this.isBusy() && !this.updateEvent() && this._phase === 'counter') {
			this.updateCounterAction();
			return;
		}
		VictorEngine.CounterActions.update.call(this);
	};
		
	BattleManager.startCounterAction = function(subject, target) {
		var action  = this.setupCounterAction(target, this._action._counterAction);
		var targets = this.setCounterActionTargets(subject, target, action);
		this._phase = 'counter';
		this._counterAction  = action
		this._counterSubject = target;
		this._counterTargets = targets;
		this._counterSubject.useItem(action.item());
		action.applyGlobal();
		this.refreshStatus();
		var animId = VictorEngine.Parameters.CounterAnimation;
		if (animId > 0) target.startAnimation(animId, false, this._logWindow.animationBaseDelay());
		this._logWindow.push('addText', TextManager.counterAttack.format(target.name()));
		this._logWindow.startAction(target, action, targets);
		this._action._counterAction = null;
	};
	
	BattleManager.setupCounterAction = function(target, counter) {
		action = new Game_Action(target);
		if (counter.action === 'item') {
			action.setItem(counter.actionId);
		} else if (counter.action === 'attack') {
			action.setAttack();
		} else if (counter.action === 'guard') {
			action.setGuard();
	    } else {
			action.setSkill(counter.actionId);
		};
		return action
	};
	
	BattleManager.invokeCounterAction = function(subject, target) {
		this._logWindow.push('pushBaseLine');
		this._counterAction.apply(target);
		this._logWindow.displayActionResults(subject, target);
		this._logWindow.push('popBaseLine');
		this.refreshStatus();
	};
	
	BattleManager.updateCounterAction = function() {
		var target = this._counterTargets.shift();
		if (target) {
			this.invokeCounterAction(this._counterSubject, target);
		} else {
			this.endCounter();
		}
	};
	
	BattleManager.endCounter = function() {
		this._logWindow.endCounter(this._counterSubject);
		this._phase = 'turn';
	};
		
	BattleManager.isCounterAction = function() {
		return this._phase === 'counter';
	};
	
	BattleManager.setCounterActionTargets = function(subject, target, action) {
		if (action.isForUser() || (action.isForFriend() && action.isForOne())) {
			return [target];
		} else if (action.isForFriend() && action.isForAll() && action.isForDeadFriend()) {
			return target.friendsUnit().aliveMembers();
		} else if (action.isForFriend() && action.isForAll() && !action.isForDeadFriend()) {
			return target.friendsUnit().deadMembers();
		} else if (action.isForOpponent() && action.isForAll()) {
			return target.opponentsUnit().aliveMembers();
		} else {
			return [subject];
		};
	};

	//=============================================================================
	// Game_Action
	//=============================================================================

	VictorEngine.CounterActions.itemCnt	= Game_Action.prototype.itemCnt;
	Game_Action.prototype.itemCnt = function(target) {
		if (BattleManager.isCounterAction() || target === this.subject()) {
			return 0;
		} else if (this.checkCounterAction(target)) {
			return 1;
		} else {
			return VictorEngine.CounterActions.itemCnt.call(this, target);
		};
	};
	
	Game_Action.prototype.checkCounterAction = function(target) {
		var actions = this.getCounterAction(target);
		this._counterAction = this.resultCounterAction(actions);
		return this._counterAction;
	};
		
	Game_Action.prototype.resultCounterAction = function(actions) {
		result = actions.sort(function(a, b) {
			var p1 = a.priority;
			var p2 = b.priority;
			if (p1 !== p2) return p2 - p1;
			return b.id - a.id;
		});
		return result[0];
	};
	
	Game_Action.prototype.getCounterAction = function(target) {
		var list = this.getCounterActionsValues(target)
		return list.filter(function(data) { 
			return this.testCounterAction(data, target);
		}, this);
	};
	
	Game_Action.prototype.testCounterAction = function(data, target) {
		if (!data || (target.isEnemy() && data.action === 'item')) return false;
		var item = this.item();
		if ((data.type === 'skill' && this.isSkill() && item.id == data.typeId) ||
			(data.type === 'item'  && this.isItem()  && item.id == data.typeId) ||
			(data.type === 'stype' && this.isSkill() && item.stypeId == data.typeId) ||
			(data.type === 'itype' && this.isItem()  && item.itypeId == data.typeId) ||
			(data.type === 'elemental' && item.damage.elementId == data.typeId) ||
			(data.type === 'physical'  && this.isPhysical()) ||
			(data.type === 'magical'   && this.isMagical()) ||
			(data.type === 'damage'    && ![3, 4].contains(item.damage.type))) {
			console.log(data, this.testCounterActionSuccess(data, target))
			return this.testCounterActionSuccess(data, target);
		} else {
			return false;
		};
	};
		
	Game_Action.prototype.testCounterActionSuccess = function(data, target) {
		if (data.action === 'item'  && !target.canUse($dataItems[data.actionId]))  return false;
		if (data.action === 'skill' && !target.canUse($dataSkills[data.actionId])) return false;
		if (data.rate) return Math.random() < data.rate / 100;
		if (data.code) return Math.random() < this.getCounterActionsCode(data, target);
		return false;
	};
	
	Game_Action.prototype.getCounterActionsCode = function(data, target) {
		var item = this.item();
        var b = this.subject();
        var a = target;
        var v = $gameVariables._data;
		var code = eval(data.code);
		return (Number(code) / 100 || 0);
	};
	
	Game_Action.prototype.getCounterActionsValues = function(target) {
		return VictorEngine.getAllObjects(target).reduce(function(r, data) {
			return r.concat(data.counterActions);
		}, []);
	};

	//=============================================================================
	// Window_BattleLog
	//=============================================================================
	
	Window_BattleLog.prototype.endCounter = function(subject) {
		this.push('clear');
		this.push('performActionEnd', subject);
	};
	
})(); 
