/**
 * @file Main BilliardBot module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

    /** @namespace */
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
     * @param container {!Element} The container that contains the pool table.
     * @param gameType {!common.GameType} The type of game we're playing.
     */
    common.init = function(container, gameType) {
        console.log('Loading a new pool game: ' + gameType)

        var gui = require('gui');
        gui.init(container);
    };

    return common;
});