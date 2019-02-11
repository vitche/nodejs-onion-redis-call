const uuidV4 = require('uuid/v4');
var onionRedisClient = require('nodejs-onion-redis-client');
var server = {
    /**
     * Экземпляр обращения к распределенному методу.
     * @constructor
     */
    Call: function (arguments) {
        var self = this;
        this.identifier = uuidV4();
        this.arguments = arguments;
        return this;
    },
    /**
     * Изначально предполагаем, что соединение с очередью сужествует на уровне класса, поскольку в обычном языке программирования
     * именно из классов создаются экземпляры объектов.
     * @constructor
     */
    Class: function (namespace, name) {
        var self = this;
        self.namespace = namespace;
        self.name = name;
        self.providedMethods = {};
        self.consumedMethods = {};
        /**
         * Подключение имеющегося метода к очереди.
         * Этот метод будет обрабатывать запросы распределенных клиентов.
         * @param name Имя подключаемого метода.
         * @param method Непосредственно метод.
         */
        self.provide = function (name, method) {
            self.providedMethods[name] = method;
            var serverInstance = self.namespace.serverInstance;
            // Subscribe to call events corresponding to this method
            var callEventName = self.getCallEventName(name);
            serverInstance.listener.on('message', function (message) {
                if (message.channel != callEventName) {
                    return;
                }
                var method = self.providedMethods[name];
                var message = JSON.parse(message.message);
                // Make a method call
                method(message.arguments, function (result) {
                    var returnEventName = self.getReturnEventName(name, message);
                    var response = {
                        identifier: message.identifier,
                        result: result
                    };
                    response = JSON.stringify(response);
                    // Make a call corresponding to results of this method
                    serverInstance.publisher.publish(returnEventName, response);
                });
            });
            serverInstance.listener.subscribe(callEventName);
        };
        /**
         * Вызов распределенного метода.
         * @param name Имя вызываемого метода.
         * @param callArguments Данные для обращения к методу.
         */
        self.consume = function (name, callArguments, callback) {
            if (!self.consumedMethods[name]) {
                self.consumedMethods[name] = [];
            }
            var call = new server.Call(callArguments);
            call.callback = callback;
            self.consumedMethods[name].push(call);
            var serverInstance = self.namespace.serverInstance;
            // A call corresponding to this method
            var callEventName = self.getCallEventName(name);
            var request = JSON.stringify(call);
            serverInstance.publisher.publish(callEventName, request);
            // Call return corresponding to this method
            var returnEventName = self.getReturnEventName(name, call);
            serverInstance.listener.on('message', function (message) {
                if (message.channel != returnEventName) {
                    return;
                }
                var methodCalls = self.consumedMethods[name];
                var result = JSON.parse(message.message);
                for (var i = 0; i < methodCalls.length; i++) {
                    var call = methodCalls[i];
                    if (call.identifier == result.identifier) {
                        call.callback(result.result);
                        methodCalls.splice(i, 1);
                        break;
                    }
                }
            });
            serverInstance.listener.subscribe(returnEventName);
        };
        self.getCallEventName = function (name) {
            return self.namespace.name + '::' + self.name + '::' + name + '::call';
        };
        self.getReturnEventName = function (name, call) {
            return self.namespace.name + '::' + self.name + '::' + name + '::return::' + call.identifier;
        };
        return this;
    },
    /**
     * Пространство имен удобно использовать для обеспечения безопасности вызываемых методов,
     * если указать в качестве пространства имен глобальный уникальный идентификатор компонента.
     * @constructor
     */
    Namespace: function (serverInstance, name) {
        var self = this;
        self.serverInstance = serverInstance;
        self.name = name;
        self.classes = {};
        self.Class = function (name) {
            if (self.classes[name]) {
                return self.classes[name];
            }
            self.classes[name] = new server.Class(self, name);
            return self.classes[name];
        };
        return this;
    },
    /**
     * Экземпляр сервера очереди.
     * @constructor
     */
    Server: function (uri, proxyAddress, connectionCallback) {
        var self = this;
        this.uri = uri;
        this.proxyAddress = proxyAddress;
        this.namespaces = {};
        this.Namespace = function (name) {
            if (self.namespaces[name]) {
                return self.namespaces[name];
            }
            self.namespaces[name] = new server.Namespace(self, name);
            return self.namespaces[name];
        };
        // Два канала для подключения к серверу
        self.listener = new onionRedisClient(self.uri, self.proxyAddress);
        self.publisher = new onionRedisClient(self.uri, self.proxyAddress);
        // Подключение принимающего канала
        self.listener.connect(function (error) {
            if (undefined != error) {
                connectionCallback(error);
                return;
            }
            // Подключение передающего канала
            self.publisher.connect(function (error) {
                if (undefined != error) {
                    connectionCallback(error);
                    return;
                }
                if (!self.publisher.connected) {
                    connectionCallback();
                    self.publisher.connected = true;
                }
            });
        });
        return this;
    }
};
module.exports = server.Server;