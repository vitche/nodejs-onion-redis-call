const OnionRedis = require('../index');
const configuration = require('../configuration');

function reverseString(value) {
    return value.split("").reverse().join("");
}

exports.testEcho = function (test) {
    const echoService = new OnionRedis(
        configuration.onionRedis.namespaceOnionUri,
        configuration.tor.socksProxyAddress,
        function (error) {
            if (undefined !== error) {
                console.log(error);
                return;
            }
            echoService.provide('Process', function (callArguments, next) {
                callArguments.message = reverseString(callArguments.message);
                // Echo arguments
                next(callArguments);
            });
            setTimeout(() => {
                echoService.consume('Process', {
                    message: 'Hello, world!'
                }, function (result) {
                    test.equal(
                        JSON.stringify(result),
                        JSON.stringify({
                            message: '!dlrow ,olleH'
                        })
                    );
                    echoService.disconnect(() => {
                        test.done();
                    });
                });
            }, 1000);
        }).Namespace('Test').Class('Echo');
};