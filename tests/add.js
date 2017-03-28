var OnionRedis = require('../index');
var configuration = require('../configuration');
exports.testAddition = function (test) {
    var additionService = new OnionRedis(
        configuration.onionRedis.namespaceOnionUri,
        configuration.tor.socksProxyAddress,
        function (error) {
            if (undefined != error) {
                console.log(error);
                return;
            }
            additionService.provide('Process', function (arguments, next) {
                var result = arguments.a + arguments.b;
                next(result);
            });
            additionService.consume('Process', {
                a: 7,
                b: 11
            }, function (result) {
                test.equal(result, 18);
                test.done();
            });
        }).Namespace('Test').Class('Add');
};