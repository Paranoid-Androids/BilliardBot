define(function(require) {
    "use strict";

    var Utils = {};

    Utils.removeOptions = function(select) {
        for (var i = select.options.length - 1; i >= 0; i--) {
            select.remove(i);
        }
    }

    Utils.addOption = function(select, value, innerHTML) {
        var opt = document.createElement('option');
        opt.value = value;
        opt.innerHTML = innerHTML;
        select.appendChild(opt);
    }

    return Utils;
});