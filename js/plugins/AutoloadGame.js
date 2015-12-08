/* globals PluginManager, SceneManager, Scene_Load, DataManager */
/*:
 * @plugindesc Autoload a saved game when the game boots
 * @param File ID
 * @desc The 1-based index of the file to load
 * @default 1
 * @author Jeremy Kahn
 */
(function () {
  'use strict';
  function poll () {
    if (SceneManager._scene && SceneManager._scene.commandContinue) {
      SceneManager.push(Scene_Load);
      var parameters = PluginManager.parameters('AutoloadGame');
      DataManager.loadGame(parameters['File ID'] || 1);

      setTimeout(function () {
        SceneManager._scene.onLoadSuccess();
      }, 100);
    } else {
      setTimeout(poll, 10);
    }
  }

  poll();
}());