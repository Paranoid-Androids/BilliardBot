requirejs.config({
    baseUrl: '../js/billiardbot',
    paths: {
        test: '../../tests/js',
        third_party: '../third_party'
    },
    shim: {
        'third_party/matter': {
            exports: 'Matter'
        }
    }
});
