const OnionRedis = require('../index');
const configuration = require('../configuration');
exports.testAddition = function (test) {
    const additionService = new OnionRedis(
        configuration.onionRedis.namespaceOnionUri,
        configuration.tor.socksProxyAddress,
        function (error) {
            if (undefined !== error) {
                console.log(error);
                return;
            }
            additionService.provide('Process', function (callArguments, next) {
                const result = callArguments.a + callArguments.b;
                next(result);
            });
            setTimeout(() => {
                additionService.consume('Process', {
                    a: 7,
                    b: 11
                }, function (result) {
                    test.equal(result, 18);
                    additionService.disconnect(() => {
                        test.done();
                    });
                });
            }, 1000);
        }).Namespace('Test').Class('Add');
};