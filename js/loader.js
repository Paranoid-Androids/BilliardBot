requirejs.config({
    baseUrl: 'js/billiardbot',
    paths: {
        third_party: '../third_party'
    },
    shim: {
        'third_party/matter': {
            exports: 'Matter'
        }
    }
});

requirejs(['common'], function(common) {
    common.startGame(document.getElementById('matter-canvas'),
        common.GameType.SINGLE_AI);
});