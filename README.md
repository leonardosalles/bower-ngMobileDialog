# ngMobileDialog
A responsive dialog projected as mobile-first, in mobile use fullscreen like iOS modals, and 768+ screens use modal like [Bootstrap](http://getbootstrap.com)

Install

    bower install ngMobileDialog --save
    
Use
```javascript
    angular.module("app", ["ngMobileDialog"], function ($dialogProvider) {
    	//Default is false
    	$dialogProvider.multiple = true;
    });
```
Markup
```html
    <button ng-click="openDialog()">Open Dialog</button>
```
Javascript

main-controller.js
```javascript
    angular.module("app", []).controller("MainController", function ($scope, $dialog) {
		$scope.openDialog = function() {
			var resolverOne = function () {
				return "MainController"
			};
			$dialog.create({templateUrl: "dialog.html", controller: "DialogController", resolve: {resolveOne: resolverOne}}, function (dialog) {
				dialog.open().then(function (someValue) {
					//Will show: This can be whatever from dialog like an object or string
					console.log(someValue);
				});
			});
			
			//Or
			$dialog.create({template: "<h1>this is a dialog from {{parent}}<!-- MainController will be show--></h1>", controller: "DialogController", resolve: {resolveOne: resolverOne}}, function (dialog) {
				dialog.open().then(function (someValue) {
					//Will show: This can be whatever from dialog like an object or string
					console.log(someValue);
				});
			});
		};
    });
```
dialog-controller.js
```javascript
	angular.module("app").controller("DialogController", function ($scope, resolveOne) {
		$scope.parent = resolveOne;//MainController
		
		$scope.close = function () {
			$scope.resolve("This can be whatever from dialog like an object or string");
		};
	});
```

dialog.html
```html
    <h1>this is a dialog from {{parent}}<!-- MainController will be show--></h1>
    <button ng-click="close()">Close Dialog</button>
    <strong>Without parameters can resolve and close directly</strong>
    <button ng-click="resolve()">Close Dialog without parameters</button>
```
Options

| Name      | Type   | Example                                                | Required            | Description                                                              |
|-------------|--------|--------------------------------------------------------|---------------------|--------------------------------------------------------------------------|
| template    | String | "template string with div, h1, whatever from html"                                      | If not template url | Template string                                                          |
| templateUrl | String | "src/app/dialog.html"                                  | If not template     | Template url for load                                                    |
| resolve     | Object | resolve: {resolveOne: function () { return "example"}} | false               | A object with keys of functions with values that will be passed to dialog controller |

