/**
 * @file Main BilliardBot module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

    /** @exports Common */
    var common = {};

    /**
     * Enum for the type of game we're playing.
     * @enum {string}
     */
    common.GameType = {
        /** Basic game of pool where the AI plays by itself. */
        SINGLE_AI: 'Single AI Game'
    };

    /**
     * Starts a new pool game in the given container.
     * @param container {!Element} The container that contains the pool table.
     * @param gameType {!common.GameType} The type of game we're playing.
     */
    common.startGame = function(container, gameType) {
        console.log('Starting a new pool game: ' + gameType);

        var GUI = require('gui');
        var GameLogic = require('gamelogic');

        var gui = new GUI(container);
        var gameLogic = new GameLogic(gui, gameType);
        gui.setListener(gameLogic);

        gui.init();
        gameLogic.init();
    };

    return common;
});