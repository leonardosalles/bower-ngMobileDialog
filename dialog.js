(function () {
	"use strict";

	angular.module("ngMobileDialog", []).provider("$dialog", function () {
		this.multiple = false;

		this.$get = function ($timeout, $compile, $rootScope, $controller, $injector, $q, $http, $templateCache) {

			function Dialog(opts, modalEl) {
				this.options = opts;
				this.modalEl = modalEl;
			}

			Dialog.prototype.open = function () {
				var self = this;
				var $body = angular.element("body");
				var $backdrop = angular.element(".dialog-backdrop");

				this._loadResolves().then(function (locals) {
					var $scope = locals.$scope = locals.$scope ? locals.$scope : $rootScope.$new();

					if (self.options.controller) {
						var ctrl = $controller(self.options.controller, locals);
						self.modalEl.data("ngControllerController", ctrl);
					}

					self.modalEl.addClass("dialog");

					var $modal = $compile(self.modalEl)($scope).find(".dialog").prevObject;

					$scope.options = self.options;

					var backdrop = self.options.backdrop === false ? false : true;

					if (backdrop) {
						$backdrop.on("click", function () {
							$scope.resolve();
						});
					}

					$scope.resolve = function (result) {
						self.deferred.resolve(result);
						self.deferred = null;
						$modal.removeClass("active");

						$timeout(function () {
							$scope.$destroy();
						}, 100);
					};

					$scope.$on("$destroy", function () {
						$modal.remove();
						$backdrop.remove();
						$body.off("keypress");
						$body.trigger("hidden.ngMobileDialog");
					});

					$scope.$on("$locationChangeSuccess", function () {
						$modal.removeClass("active");
					});

					$timeout(function () {
						$modal.addClass("active");
						$backdrop.addClass("in");
						$body.on("keypress", function (e) {
							if (e.keyCode === 13) {
								e.preventDefault();
							}
						});
					}, 50);
				});

				this.deferred = $q.defer();
				return this.deferred.promise;
			};

			Dialog.prototype._loadResolves = function () {
				var values = [];
				var keys = [];

				angular.forEach(this.options.resolve || [], function (value, key) {
					keys.push(key);
					values.push(angular.isString(value) ? $injector.get(value) : $injector.invoke(value));
				});

				return $q.all(values).then(function (values) {
					var locals = {};
					angular.forEach(values, function (value, index) {
						locals[keys[index]] = value;
					});

					return locals;
				});
			};

			return {
				create: function (opts, callback) {
					if (!this.multiple && angular.element(".dialog").length) {
						return;
					}

					if (!opts.template && !opts.templateUrl) {
						throw new Error("Template or template url must be informed!");
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

					$http.get(opts.templateUrl, {})
					.success(function(data) {
						setElements(data);
						$templateCache.put(opts.templateUrl, data);
				  	}).error(function() {
						throw new Error("Can not load dialog template from url: " + opts.templateUrl);
				  	});

					function setElements (template) {
						var backdrop = "\n<div class=\"dialog-backdrop fade\"></div>";

						var modalEl = angular.element("<div>");
						modalEl.html(template);

						angular.element("body").append(modalEl).append(backdrop);

						var dialog = new Dialog(opts, modalEl);

						callback(dialog);
					}
				},
				multiple: this.multiple
			};
		};
	});
})();
