(function(){
/*Game_Actor.prototype.gainExp = function(exp) {
    var newExp = this.currentExp() + Math.round(exp * this.finalExpRate());
    this.changeExp(newExp, this.shouldDisplayLevelUp());
};*/

Game_Actor.prototype.expForLevel = function(level) {
    return 1000 * level;
};

BattleManager.makeRewards = function() {
    this._rewards = {};
    this._rewards.gold = $gameTroop.goldTotal();
    this._rewards.exp = $gameTroop.expTotal();

    var baseExp = 0;

    var partyLevel = $gameParty.getAverageLevel();
    var troopLevel = $gameTroop.getAverageLevel();

    var levelRange = Math.round(troopLevel - partyLevel);

    console.log("Party level: " + partyLevel + ", Troop level: " + troopLevel);

    if(levelRange == -9)
        baseExp = 1;
    else if(levelRange == -8)
        baseExp = 2;
    else if(levelRange == -7)
        baseExp = 5;
    else if(levelRange == -6)
        baseExp = 9;
    else if(levelRange == -5)
        baseExp = 11;
    else if(levelRange == -4)
        baseExp = 22;
    else if(levelRange == -3)
        baseExp = 33;
    else if(levelRange == -2)
        baseExp = 50;
    else if(levelRange == -1)
        baseExp = 66;
    else if(levelRange == 0)
        baseExp = 83;
    else if(levelRange == 1)
        baseExp = 99;
    else if(levelRange == 2)
        baseExp = 121;
    else if(levelRange == 3)
        baseExp = 143;
    else if(levelRange == 4)
        baseExp = 165;
   	else if(levelRange > 4)
   		baseExp = 160 + 20 * (levelRange - 4);
    else
        baseExp = 0;

	baseExp = Math.round(baseExp * 1.4);

    if(partyLevel < 6) {
    	baseExp = 10 * baseExp / (partyLevel + 4);
    }

    if(partyLevel > 35) {
    	baseExp = 15 * baseExp / (partyLevel - 25);
    }

    baseExp *= $gameTroop.members().length;

    this._rewards.exp = Math.floor(baseExp);
    console.log("Battle rewards set to " + this._rewards.exp);

    this._rewards.items = $gameTroop.makeDropItems();
};

Game_Party.prototype.getAverageLevel = function() {
	var actors = this.battleMembers();
	var level = -1;
    for (var i = 0; i < actors.length; i++) {
    	level += actors[i]._level;
    }
    level /= actors.length;
    return Math.floor(level);
}

Game_Troop.prototype.getAverageLevel = function(troopId) {
    var enemies = this._enemies;
    var level = -1;
    for (var i = 0; i < enemies.length; i++) {
    	var dataEnemy = $dataEnemies[enemies[i]._enemyId];
		var config = MRP.OptionParser.extractFirstOfType(dataEnemy.note, "Level");
        if(config.args && config.args.length > 0) 
		    level += config.args[0];
        else
            level += $gameParty.getAverageLevel();
		console.log("Troop added " + level);
    }
    level /= enemies.length;
    return Math.round(level);
};


//var config = MRP.OptionParser.extractAll(ItemNoteTag);
//config['Level'];
})();