(function() {
    'use strict';

    angular.module('ngMobileDialog', []).provider('$dialog', function() {
        var vm = this;
        vm.multiple = false;
        vm.headers = {};
        vm.currentScopes = {};
        vm.$get = ['$timeout', '$compile', '$rootScope', '$controller', '$injector', '$q', '$http', '$templateCache', function($timeout, $compile, $rootScope, $controller, $injector, $q, $http, $templateCache) {

            function Dialog(opts, modalEl) {
                this.options = opts;
                this.modalEl = modalEl;
            }

            Dialog.prototype.open = function() {
                var self = this;
                var $body = document.body;
                var $backdrop = document.querySelector('.dialog-backdrop');

                this._loadResolves().then(function(locals) {
                    var $scope = locals.$scope = locals.$scope ? locals.$scope : $rootScope.$new();
                    $scope.dialogId = new Date();
                    vm.currentScopes[$scope.dialogId] = $scope;

                    if (self.options.controller) {
                        var ctrl = $controller(self.options.controller, locals);
                        self.modalEl.dataset.ngControllerController = self.options.controller;
                    }

                    self.modalEl.classList.add('dialog');

                    var $modal = $compile(self.modalEl)($scope)[0];

                    $scope.options = self.options;

                    var backdrop = self.options.backdrop === false ? false : true;

                    if (backdrop) {
                        $backdrop.addEventListener('click', function() {
                            $scope.resolve();
                        });
                    }

                    $scope.resolve = function(result) {
                        delete vm.currentScopes[$scope.dialogId];
                        self.deferred.resolve(result);
                        self.deferred = null;
                        $modal.classList.remove('active');

                        $timeout(function() {
                            $scope.$destroy();
                            vm.currentDialog = null;
                        }, 100);
                    };

                    $scope.$on('$destroy', function() {
                        $modal.remove();
                        $backdrop.remove();
                        var event = new Event('hidden.ngMobileDialog');
                        document.dispatchEvent(event);
                    });

                    $scope.$on('$locationChangeSuccess', function() {
                        $modal.classList.remove('active');
                    });

                    $timeout(function() {
                        $modal.classList.add('active');
                        $backdrop.classList.add('in');
                        if (self.options.escKey) {
                            window.onkeydown = function(e) {
                                var keyCode = e.keyCode || e.which;
                                if (keyCode == 27) {
                                    e.preventDefault();
                                    $scope.resolve();
                                }
                            };
                        }
                    }, 50);
                });

                this.deferred = $q.defer();
                return this.deferred.promise;
            };

            Dialog.prototype._loadResolves = function() {
                var values = [];
                var keys = [];

                angular.forEach(this.options.resolve || [], function(value, key) {
                    keys.push(key);
                    values.push(angular.isString(value) ? $injector.get(value) : $injector.invoke(value));
                });

                return $q.all(values).then(function(values) {
                    var locals = {};
                    angular.forEach(values, function(value, index) {
                        locals[keys[index]] = value;
                    });

                    return locals;
                });
            };

            return {
                create: function(opts, callback) {
                    if (!this.multiple && document.querySelector('.dialog').length) {
                        return;
                    }

                    if (!opts.template && !opts.templateUrl) {
                        throw new Error('Template or template url must be informed!');
                    }

                    var templateCache = null;

                    if (opts.templateUrl) {
                        templateCache = $templateCache.get(opts.templateUrl);

                        if (templateCache) {
                            setElements(templateCache);
                            return;
                        }
                    }

                    if (opts.template && !opts.templateUrl) {
                        setElements(opts.template);
                        return;
                    }

                    $http.get(opts.templateUrl, {
                            headers: this.headers
                        })
                        .success(function(data) {
                            setElements(data);
                            $templateCache.put(opts.templateUrl, data);
                        })
                        .error(function() {
                            throw new Error('Can not load dialog template from url: ' + opts.templateUrl);
                        });

                    function setElements(template) {
                        var backdrop = document.createElement('div');
                        backdrop.classList.add('dialog-backdrop');
                        backdrop.classList.add('fade');

                        var body = document.body;

                        var modalEl = document.createElement('div');
                        modalEl.innerHTML = template;

                        modalEl.querySelector('.modal-header > button.close').dataset.ngClick = 'resolve()';

                        var first = modalEl.firstChild;
                        body.appendChild(first);
                        body.appendChild(backdrop);

                        var dialog = new Dialog(opts, first);

                        callback(dialog);
                    }
                },
                multiple: this.multiple,
                headers: this.headers,
                resolve: function(result) {
                    if (vm.currentScopes) {
                        for (var key in vm.currentScopes) {
                            if (vm.currentScopes.hasOwnProperty(key)) {
                                var obj = vm.currentScopes[key];
                                obj.resolve(result);
                            }
                        }
                    }
                }
            };
        }];
    });
})();
