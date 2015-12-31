// Place file inside /js/plugins
// Remember to save after adding plugins or changing parameters.
//=============================================================================
// Ellye's States Damage
//=============================================================================
/*:
 * Version: 2015-11-20-2232
 * 
 * CHANGE LOG:
 * 2015-11-20-2232 - Normal attack states should also get the caster paramaters properly now.
 * 2015-11-19-2359 - Fixed decimal damage.
 * 2015-11-19-0021 - Release of Version 2 Beta - changed how the damage is applied, needs a lot of testing.
 * 2015-11-08-0156 - Changed the _stateCaster array to no longer store direct object references, that could easily result in infinite data loops. Thanks, Bobstah.
 * 2015-11-05-1029 - Added tags <drain>, <mp_drain>, <mp_heal>, <mp_damage>, <can_critical>.
 * 2015-11-04-2327 - Made this compatible with Yanfly's Cooldowns (that plugin wasn't expecting the possibility of its attributes being undefined in a skill)
 * 2015-11-03-3442 - Fixed _stateCaster information being unintentionaly shared between battlers.
 * 2015-11-03-0948 - Fixed an issue that could cause compatibility problems.
 * 2015-11-01-1141 - Added collapse animation for enemies that die due to status effects.
 * 2015-10-31-2112 - Some combinations of plugins would cause the damage popup to appear twice. So I added a compatibility parameter.
 * 2015-10-31-1802 - Fixed a bug that made the plugin not work properly in many cases.
 * 2015-10-31-1434 - Fixed a crash at turn end.
 * 2015-10-31-1225 - Fixed a few potential crashes.
 * 2015-10-31-0221 - Beta Release.
 * 
 * 
 * 
 * @plugindesc Ver.2015-11-20-2232. Customized state damage/healing. See help.
 * <Ellye SD>
 * @author https://ellyeblog.wordpress.com/ || http://steamcommunity.com/id/Ellye
 * 
 * @param Damage Popup Compatibility
 * @desc Change this to "1" if you're having an issue that causes damage numbers to appear twice per turn (compatibility).
 * @default 0
 * 
 * 
 * @help This plugin allows you to set up custom damage or healing for States.
 * Use the notes field, and swap FORMULA_HERE for the formula you want to use (exactly like you'd do for a Skill).
 * <formula:FORMULA_HERE>
 * <element:ELEMENT_ID>
 * <variance:VARIANCE_PERCENT>
 * 
 * 
 * You can also set the following flags (mutually exclusive):
 * <heal>
 * <drain>
 * <mp_damage>
 * <mp_heal>
 * <mp_drain>
 * 
 * For example, let's say we want to create a "Burning" state:
 * <formula:a.mat/(1+(b.mdf/100))>
 * <element:2>
 * <variance:20>
 * 
 * Or a "Regeneration" state:
 * <formula:a.mat>
 * <element:6>
 * <variance:10>
 * 
 * Keep in mind, "a" is always the person who have casted the state, and "b" is always the afflicted person.
 * Sometimes they might both be the same (if a person casts Regeneration on himself, for an easy example).
 */
(function() {

    var parameters = $plugins.filter(function(p) {
        return p.description.contains('<Ellye SD>');
    })[0].parameters; //Thanks to Iavra
    var damage_popup_compatibility = Number(parameters['Damage Popup Compatibility'] || 0);

    //Let's add a new property for battlers, called "_stateCaster". It will be array holding the caster of each state we have.
    Object.defineProperties(Game_Battler.prototype, {
        _stateCasterIndex: {
            writable: true,
            value: [],
            configurable: true,
            enumerable: true
        }
    });

    Game_Battler.prototype.stateCasters = function() {
        var stateCasters = [];
        this._stateCasterIndex.forEach(function(index, state) {
            //Actors receive a positive id on the array
            if (index > 0 && $gameActors._data.length >= index - 1 && typeof $gameActors._data[index] !== 'undefined')
            {
                stateCasters[state] = $gameActors._data[index];
            }
            else
            {
                index *= -1;
                if ($gameTroop._enemies.length >= index - 1 && typeof $gameTroop._enemies[index] !== 'undefined')
                {
                    stateCasters[state] = $gameTroop._enemies[index];
                }
            }
        }, this);
        return stateCasters;
    };

    //We need to initialize _stateCaster for our Game Battlers:
    _alis_gb_init = Game_Battler.prototype.initMembers;
    Game_Battler.prototype.initMembers = function() {
        _alis_gb_init.call(this);
        this._stateCasterIndex = [];
    };


    //We modify the function that adds states, so that it shall pass the caster as a parameter:
    Game_Action.prototype.itemEffectAddNormalState = function(target, effect) {
        var caster = this.subject();
        var chance = effect.value1;
        if (!this.isCertainHit()) {
            chance *= target.stateRate(effect.dataId);
            chance *= this.lukEffectRate(target);
        }
        if (Math.random() < chance) {
            target.addState(effect.dataId, caster);
            this.makeSuccess(target);
        }
    };

    //And also this one:
    Game_Action.prototype.itemEffectAddAttackState = function(target, effect) {
        this.subject().attackStates().forEach(function(stateId) {
            var chance = effect.value1;
            chance *= target.stateRate(stateId);
            chance *= this.subject().attackStatesRate(stateId);
            chance *= this.lukEffectRate(target);
            if (Math.random() < chance) {
                target.addState(stateId, this.subject());
                this.makeSuccess(target);
            }
        }.bind(this), target);
    };

    //We start receiving a parameter:
    Game_Battler.prototype.addState = function(stateId, caster) {
        if (typeof caster === 'undefined') {
            caster = this;
        }
        if (this.isStateAddable(stateId)) {
            if (!this.isStateAffected(stateId)) {
                this.addNewState(stateId);
                this.refresh();
            }
            this.resetStateCounts(stateId);
            this._result.pushAddedState(stateId);
        }
        //We could also override AddNewState() to make it receive the parameter and assign values, but we might be compromising compatibility a bit too much.
        //So we are going to add those values here. This also means that receiving a second Poison will override the values from the first one.
        if (caster.isActor())
        {
            this._stateCasterIndex[stateId] = $gameActors._data.indexOf(caster);
        }
        else
        {
            this._stateCasterIndex[stateId] = -$gameTroop._enemies.indexOf(caster);
        }
    };

    //At end of turn, we need to call our method that will deal with those parameters:
    _game_battler_onTurnEnd_alias = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        this.ProcessEllyeStatesDamage();
        _game_battler_onTurnEnd_alias.call(this);
    };

    //And our method:
    Game_Battler.prototype.ProcessEllyeStatesDamage = function() {
        this.states().forEach(function(state) {
            if (typeof state.meta !== 'undefined' && state.meta !== null && typeof state.meta.formula !== 'undefined')
            {
                var caster = this;
                var element = 1;
                var variance = 0;
                var formula = state.meta.formula;
                var stateCasters = this.stateCasters();
                var damageOrHeal = -1;
                if (typeof stateCasters[state.id] !== 'undefined') {
                    caster = stateCasters[state.id];
                }
                if (typeof state.meta.element !== 'undefined')
                {
                    element = Number(state.meta.element || 1);
                }
                if (typeof state.meta.variance !== 'undefined')
                {
                    variance = Number(state.meta.variance || 0);
                }
                if (state.meta.heal || state.meta.mp_recover || state.meta.mp_heal)
                {
                    damageOrHeal = 1;
                }
                var value = EllyeSD_EvalFormula(formula, caster, this, damageOrHeal, element, variance);
                if (state.meta.mp_damage || state.meta.mp_drain)
                {
                    this.gainMp(value);
                    if (state.meta.mp_drain && caster.isAlive())
                    {
                        caster.gainMp(-value);
                    }
                }
                else
                {
                    this.gainHp(value);
                    if (state.meta.drain && caster.isAlive())
                    {
                        caster.gainHp(value);
                    }
                }
                BattleManager.refreshStatus();
                if (damage_popup_compatibility !== 1)
                {
                    this.startDamagePopup();
                }
                if (this.isActor())
                {
                    BattleManager._spriteset._actorSprites.forEach(function(sprite)
                    {
                        if (typeof sprite._battler !== 'undefined' && sprite._battler === this)
                        {
                            sprite.update();
                        }
                    }, this);
                }
                else
                {
                    BattleManager._spriteset._enemySprites.forEach(function(sprite)
                    {
                        if (typeof sprite._battler !== 'undefined' && sprite._battler === this)
                        {
                            sprite.update();
                        }
                    }, this);
                }
                if (this.isDead())
                {
                    this.performCollapse();
                }
            }
        }, this);
    };

    //-1 for damage, 1 for heal
    EllyeSD_EvalFormula = function(formula, caster, target, damageOrHeal, elementId, variance) {
        try {
            var a = caster;
            var b = target;
            var v = $gameVariables._data;
            var elementRate = target.elementRate(elementId);
            var damage = Math.floor(Math.max(eval(formula), 0) * damageOrHeal * elementRate);
            var amp = Math.floor(Math.max(Math.abs(damage) * variance / 100, 0));
            var v = Math.floor(Math.randomInt(amp + 1) + Math.randomInt(amp + 1) - amp);
            return damage >= 0 ? damage + v : damage - v;
        } catch (e) {
            return 0;
        }
    };

    //Clear everything on battle end:
    _alias_gb_obe = Game_Battler.prototype.onBattleEnd;
    Game_Battler.prototype.onBattleEnd = function() {
        _alias_gb_obe.call(this);
        this._stateCasterIndex = [];
    };
}());