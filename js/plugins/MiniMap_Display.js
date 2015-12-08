//=============================================================================
// MiniMap.js
//=============================================================================
//v1.0 
/*:
 * @plugindesc Makes mini map. 
 * @author Jeremy Cannady
 *
 *@help YOU MUST HAVE A IMAGE OF YOUR MAP TO USE THIS, the image needs to be in /img/pictures and labled
 *mapx.png where x is the map id number. So map #7 needs to be called map7.png
 *Creates a mini map, 'o' is zoom out, 'L' is zoom in, 'I' is to increase transparency, 'K'
 * is to decrease transparency. You must have the note tage <EnableMiniMap> in the map notes or it wont 
 * display the mini map. 
 *Plugin commands: AddIconToMiniMap 60 15 30 1  ---->where 60 is the icon index, 15 is the x, 30 is the y
 * and 1 is whether or not it is activated. 1 is active and on map, 0 is not on map.
 *UpdateIconOpacity 15 30 0 ---> where 15 is the x, 30 is the y, and 0 is the new activation. If 0 then it is 
 * turned off, if 1 then it is turned on. This only works if you have the correct x and y that the icon is at.
*/

//=============================================================================
// Create variables and key mapping.
//=============================================================================
Game_Player.prototype.mapScale = 0.07;
Game_Player.prototype.mapTransparency = 200;
Input.keyMapper['79'] = 'ZoomIn';
Input.keyMapper['76'] = 'ZoomOut';
Input.keyMapper['73'] = 'TUP';
Input.keyMapper['75'] = 'TDOWN';
//=============================================================================

function Window_MiniMap() {
    this.initialize.apply(this, arguments);
}

Window_MiniMap.prototype = Object.create(Window_Base.prototype);
Window_MiniMap.prototype.constructor = Window_MiniMap;
//=============================================================================
// Create variables.
//=============================================================================
	Window_MiniMap.prototype.mapIconData = {};
	Window_MiniMap.prototype.bitmapIcon = [];
	Window_MiniMap.prototype.updateAddIcon = true;
//=============================================================================

var Add_Icon_To_MiniMap_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	Add_Icon_To_MiniMap_pluginCommand.call(this, command, args);
	if (command === "AddIconToMiniMap") {
		var arg1 = JSON.parse(args[0]);
		var arg2 = JSON.parse(args[1]);
		var arg3 = JSON.parse(args[2]);
		var arg4 = JSON.parse(args[3]);
		Window_MiniMap.prototype.addIconToMap(arg1, arg2, arg3, arg4);
	};
};

Window_MiniMap.prototype.addIconToMap = function(iconIndex, x, y, opacity){
	if(this.mapIconData[$gameMap._mapId].length > 0){
		for(var i = 0; i < this.mapIconData[$gameMap._mapId].length; i++){
			var array = this.mapIconData[$gameMap._mapId][i]
			if(array[1] !== x && array[2] !== y){
				this.mapIconData[$gameMap._mapId].push([iconIndex, x, y, opacity])
			};
		};
	}else{
		this.mapIconData[$gameMap._mapId].push([iconIndex, x, y, opacity]);
	};
};

Window_MiniMap.prototype.updateIconOpacity = function(x, y, opacity){
	for(var i = 0; i < this.mapIconData[$gameMap._mapId].length; i++){
		var array = this.mapIconData[$gameMap._mapId][i]
		if(array[1] === x && array[2] === y){
			this.mapIconData[$gameMap._mapId][i][3] = opacity;
		};
	};
};

var Icon_Opacity_Update_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	Icon_Opacity_Update_pluginCommand.call(this, command, args);
	if (command === "UpdateIconOpacity") {
		var arg1 = JSON.parse(args[0]);
		var arg2 = JSON.parse(args[1]);
		var arg3 = JSON.parse(args[2]);
		Window_MiniMap.prototype.updateIconOpacity(arg1, arg2, arg3);
	};
};

Window_MiniMap.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
	if(!Window_MiniMap.prototype.mapIconData[$gameMap._mapId]){
		this.mapIconData[$gameMap._mapId] = [];
	}
    this.deactivate();
	this.addMapPNG();
	this.addArrowPNG();
};

//=============================================================================
// Update everything...
//=============================================================================
Window_MiniMap.prototype.update = function() {

    Window_Base.prototype.update.call(this);
	if(Input.isTriggered("ZoomIn")){$gamePlayer.mapScale += 0.01;};
	if(Input.isTriggered("ZoomOut")){$gamePlayer.mapScale -= 0.01;};
	if(Input.isTriggered("TUP")){$gamePlayer.mapTransparency += 50;
		if($gamePlayer.mapTransparency < 0){$gamePlayer.mapTransparency = 0}};
	if(Input.isTriggered("TDOWN")){$gamePlayer.mapTransparency -= 50;
		if($gamePlayer.mapTransparency > 255){$gamePlayer.mapTransparency = 255}};
	this.addIcon(this.mapIconData[$gameMap._mapId]);
	this.contents.clear();
	this.updateMapPNG();
	this.updateIconPositions(this.mapIconData[$gameMap._mapId]);
	this.bitmapMap.scale.x = $gamePlayer.mapScale;
	this.bitmapMap.scale.y = $gamePlayer.mapScale;
	this.bitmapMap.opacity = $gamePlayer.mapTransparency;
	this.bitmapArrow.opacity = $gamePlayer.mapTransparency;
	this.opacity = $gamePlayer.mapTransparency;
	
};
//=============================================================================

Window_MiniMap.prototype.addMapPNG = function() {
	this.bitmapMap = new Sprite(ImageManager.loadPicture("map"+$gameMap._mapId));
	this.bitmapMap.scale.x = $gamePlayer.mapScale;
	this.bitmapMap.scale.y = $gamePlayer.mapScale;
	this.addChild(this.bitmapMap);
};

Window_MiniMap.prototype.addArrowPNG = function() {
	this.bitmapArrow = new Sprite(ImageManager.loadPicture("arrow"));
	this.bitmapArrow.scale.x = 0.08;
	this.bitmapArrow.scale.y = 0.08;
	this.bitmapArrow.x = 70;
	this.bitmapArrow.y = 65;
	this.addChild(this.bitmapArrow);
};

Window_MiniMap.prototype.addIcon = function(array) {
	if(this.updateAddIcon){
		if(this.mapIconData[$gameMap._mapId][0] === 'undefined'){
		}else{
			for(var i = 0; i < array.length; i++){
				this.bitmapIcon[i] = new Sprite(ImageManager.loadSystem('IconSet'));
				this.bitmapIcon[i].scale.x = 0.5;
				this.bitmapIcon[i].scale.y = 0.5;
				var pw = Window_Base._iconWidth;
				var ph = Window_Base._iconHeight;
				var sx = array[i][0] % 16 * pw;
				var sy = Math.floor(array[i][0] / 16) * ph;
				this.addChild(this.bitmapIcon[i]);
				this.bitmapIcon[i].setFrame(sx,sy,32,32);
			};
		};
		this.updateAddIcon = false;
	};
};

Window_MiniMap.prototype.updateIconPositions = function(array){
	var xMap = $gamePlayer.x * 48;
	var yMap = $gamePlayer.y * 48;
	var scale = $gamePlayer.mapScale;
	for(var i = 0; i < array.length; i++){
		var IconXMap = array[i][1]*48;
		var IconYMap = array[i][2]*48;
		if(!this.bitmapIcon[i] === false ){
			if(Math.abs(IconXMap - xMap) > this.width/scale/2 || Math.abs(IconYMap - yMap) > this.width/scale/2){
				this.bitmapIcon[i].opacity = 0;
			}else{
				if(array[i][3] === 0){
				this.bitmapIcon[i].opacity = 0;
				}else{
					this.bitmapIcon[i].opacity = $gamePlayer.mapTransparency;
				};
				if(IconXMap - xMap == 0 && IconYMap - yMap == 0){
					this.bitmapIcon[i].x = this.width/2;
					this.bitmapIcon[i].y = this.height/2;
				}else if(IconXMap - xMap >= 0 && IconYMap - yMap >= 0){
					this.bitmapIcon[i].x = this.width/2 + Math.abs(IconXMap - xMap)*scale;
					this.bitmapIcon[i].y = this.height/2 + Math.abs(IconYMap - yMap)*scale;
				}else if(IconXMap - xMap >= 0 && IconYMap - yMap <= 0){
					this.bitmapIcon[i].x = this.width/2 + Math.abs(IconXMap - xMap)*scale;
					this.bitmapIcon[i].y = this.height/2 - Math.abs(IconYMap - yMap)*scale;
				}else if(IconXMap - xMap <= 0 && IconYMap - yMap <= 0){
					this.bitmapIcon[i].x = this.width/2 - Math.abs(IconXMap - xMap)*scale;
					this.bitmapIcon[i].y = this.height/2 - Math.abs(IconYMap - yMap)*scale;
				}else{
					this.bitmapIcon[i].x = this.width/2 - Math.abs(IconXMap - xMap)*scale;
					this.bitmapIcon[i].y = this.height/2 + Math.abs(IconYMap - yMap)*scale;
				};
			};
		};
	};
};

Window_MiniMap.prototype.updateMapPNG = function() {
	this.bitmapMap.opacity = 200;
	var scale = $gamePlayer.mapScale;
	var xMap = $gamePlayer.x * 48;
	var yMap = $gamePlayer.y * 48;
	var width = this.width/scale;
	var height = this.height/scale;
	this.bitmapMap.x = this.width/2 - xMap * scale;
	this.bitmapMap.y = this.height/2 - yMap * scale;
	if(this.bitmapMap.x < 0 && this.bitmapMap.y < 0){
		this.bitmapMap.setFrame(-this.bitmapMap.x / scale , -this.bitmapMap.y/ scale ,width, height);
		this.bitmapMap.x = 0;
		this.bitmapMap.y = 0;
	}else if(this.bitmapMap.y > 0 && this.bitmapMap.x < 0){
		this.bitmapMap.setFrame(-this.bitmapMap.x/scale , 0 ,width, height-height*(this.bitmapMap.y/this.height));	
		this.bitmapMap.x = 0;
	}else if(this.bitmapMap.y > 0){
		this.bitmapMap.setFrame(0 , 0 ,width, height-height*(this.bitmapMap.y/this.height));	
	}else if(this.bitmapMap.x < 0){
		this.bitmapMap.setFrame(-this.bitmapMap.x/scale , 0 ,width, height);
		this.bitmapMap.x = 0;
	}else if(this.bitmapMap.y < 0){
		this.bitmapMap.setFrame(0 , -this.bitmapMap.y/scale ,width, height);
		this.bitmapMap.y = 0;
	}else{
		this.bitmapMap.setFrame(0, 0, width, height);
	};
};

var alias_Scene_Map_createAllWindowsJC = Scene_Map.prototype.createAllWindows;
Scene_Map.prototype.createAllWindows = function() {
	alias_Scene_Map_createAllWindowsJC.call(this);
	if($dataMap.meta.EnableMiniMap){
		this.createMiniMap();
	};
};

Scene_Map.prototype.createMiniMap = function() {
    this._windowMiniMap = new Window_MiniMap(Graphics.width-150,0,150,150);
    this.addChild(this._windowMiniMap);
};