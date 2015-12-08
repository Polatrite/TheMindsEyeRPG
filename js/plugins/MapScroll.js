//=============================================================================
// MapScroll.js
//=============================================================================
/*:
 *Version 2.0
 *Change log: 
 *11/5/2015:Scroll scales with window width/height.
 *			Added plugin commands to disable/enagle scrolling in game.
 *11/5/2015: v2.0 Auto grid snap more commands and notetags.
 *
 *
 * @plugindesc Scrolls the map when you get to the edge.
 * @author Jeremy Cannady
 *
 * @help Scrolls the map when you get to the edge, normal maps are 13 by 17
 * 	
 *Plugin commands:
 *	Map_Scroll_Disable ----> This will disable and revert to normal scrolling.
 *	Map_Scroll_Enable  ----> This will enable scrolling.
 *	Grid_Snap_Disable  ---> Disables grid auto snap.
 *	Grid_Snap_Enable   ---> Enables grid auto snap (default)
 *
 *Note Tags:
 *<ScrollDisable> if put in the map note tags then scrolling will be back to normal instead of grid scrolling.
 *
*/

(function(){
//Define a variable to enable/disable the scrolling
Game_Player.prototype._Map_Scroll_Enabled = true;
//Default grid snap
Game_Player.prototype.gridSnap = true;

//Superseding the updateScroll function. Don't scroll until we are on the edge.
Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
	//If we have scroll diabled for this map then set scroll to false.
	if($dataMap.meta.ScrollDisable){
		Game_Player.prototype.Map_Scroll_for_this_Map = false;
	}else{
		Game_Player.prototype.Map_Scroll_for_this_Map = true;
	};
	
	var x1 = lastScrolledX;
    var y1 = lastScrolledY;
    var x2 = this.scrolledX();
    var y2 = this.scrolledY(); 
	var xScroll = Math.round(SceneManager._boxWidth/48);
	var yScroll = Math.round(SceneManager._boxHeight/48);

	if(Game_Player.prototype._Map_Scroll_Enabled && Game_Player.prototype.Map_Scroll_for_this_Map){
		//Checks to see if we move beyond the screen if we do then it scrolls it for us.
		if (x2 > xScroll-1) {$gameMap.startScroll(6,xScroll,6);};//Left
		if (x2 < -0.5) {$gameMap.startScroll(4,xScroll,6);};//Right
		if (y2 > yScroll-1) {$gameMap.startScroll(2,yScroll,6);};//Down
		if (y2 < -0.5) {$gameMap.startScroll(8,yScroll,6);};//Up	
	}else{//If we have it disabled then run the original code
		if (y2 > y1 && y2 > this.centerY()) {$gameMap.scrollDown(y2 - y1);};
		if (x2 < x1 && x2 < this.centerX()) {$gameMap.scrollLeft(x1 - x2);};
		if (x2 > x1 && x2 > this.centerX()) {$gameMap.scrollRight(x2 - x1);};
		if (y2 < y1 && y2 < this.centerY()) {$gameMap.scrollUp(y1 - y2);};	
	};
};//End of update scroll.

//Superseding the canMove function. Check if we are scrolling the screen.
Game_Player.prototype.canMove = function() {
    if ($gameMap.isEventRunning() || $gameMessage.isBusy()) {return false;}
    if (this.isMoveRouteForcing() || this.areFollowersGathering()) {return false;}
    if (this._vehicleGettingOn || this._vehicleGettingOff) {return false;}
    if (this.isInVehicle() && !this.vehicle().canMove()) {return false;}
	if (Game_Player.prototype._Map_Scroll_Enabled && $gameMap.isScrolling()){return false;};	
	return true;
};//End of canMove.

var alias_Game_Map_setDisplayPos = Game_Map.prototype.setDisplayPos;
Game_Map.prototype.setDisplayPos = function(x, y) {
	//If the grid snap is disabled then run the original code;
	if(Game_Player.prototype.gridSnap === false){
		alias_Game_Map_setDisplayPos.call(this,x,y);	
	}else{//If grid snap is enabled then snap the camera to the correct position.
		var xScroll = Math.floor(SceneManager._boxWidth / 48);
		var yScroll = Math.floor(SceneManager._boxHeight / 48);
		var newX = $gamePlayer._newX;
		var newY = $gamePlayer._newY;
		var gridX = Math.floor(newX / xScroll)
		var gridY = Math.floor(newY / yScroll)
		this._displayX = gridX * xScroll;
		this._displayY = gridY * yScroll;
		this._parallaxX = this._displayX;
		this._parallaxY = this._displayY;
	};
};//End of set display position.

//Define the pugin command for disable.
var Map_Scroll_Disable_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	Map_Scroll_Disable_pluginCommand.call(this, command, args);
	if (command === "Map_Scroll_Disable") {
		//If we type in Map_Scroll_Disable then disable scrolling.
		Game_Player.prototype._Map_Scroll_Enabled = false;
	};
};

//Define the pugin command for enable.
var Map_Scroll_Enable_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	Map_Scroll_Enable_pluginCommand.call(this, command, args);
	if (command === "Map_Scroll_Enable") {
		//If we type in Map_Scroll_Enable then enable scrolling.
		Game_Player.prototype._Map_Scroll_Enabled = true;
	};
};

var Grid_Snap_Disable_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	Grid_Snap_Disable_pluginCommand.call(this, command, args);
	if (command === "Grid_Snap_Disable") {
		//If we type in Grid_Snap_Disable then disable grid snap.
		Game_Player.prototype.gridSnap = false;
	};
};

var Grid_Snap_Enable_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	Grid_Snap_Enable_pluginCommand.call(this, command, args);
	if (command === "Grid_Snap_Enable") {
		//If we type in Grid_Snap_Enable then enable grip snap.
		Game_Player.prototype.gridSnap = true;
	};
};

})();