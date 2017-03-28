var OnionRedis = require('../index');
var configuration = require('../configuration');
function reverseString(value) {
    return value.split("").reverse().join("");
}
exports.testEcho = function (test) {
    var echoService = new OnionRedis(
        configuration.onionRedis.namespaceOnionUri,
        configuration.tor.socksProxyAddress,
        function (error) {
            if (undefined != error) {
                console.log(error);
                return;
            }
            echoService.provide('Process', function (arguments, next) {
                arguments.message = reverseString(arguments.message);
                // Echo arguments
                next(arguments);
            });
            echoService.consume('Process', {
                message: 'Hello, world!'
            }, function (result) {
                test.equal(
                    JSON.stringify(result),
                    JSON.stringify({
                        message: '!dlrow ,olleH'
                    })
                );
                test.done();
            });
        }).Namespace('Test').Class('Echo');
};