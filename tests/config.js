requirejs.config({
    baseUrl: '../js/billiardbot',
    paths: {
        third_party: '../third_party'
    },
    shim: {
        'third_party/matter': {
            exports: 'Matter'
        }
    }
});
