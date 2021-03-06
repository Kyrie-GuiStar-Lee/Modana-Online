var coldWeb = angular.module('ColdWeb', ['ui.bootstrap', 'ui.router', 'ui.checkbox','ngSanitize','ui.select',
                                         'ngCookies', 'xeditable','angucomplete-alt','angular-table', 'bsTable']);
var user;

angular.element(document).ready(function($ngCookies, $location) {
	$.ajax({
	      url: '/i/user/findUser',
	      type: "GET",
	      dataType: 'json',
	      cache: false
	    }).success(function(data){
	    	user = data;
	    	if(user.username == null){
	    		if(window.location.pathname != "/login.html" && window.location.pathname != '/register.html'){
	    			document.location.href = "/login.html";
	    		}
	        }
	    	angular.bootstrap(document, ['ColdWeb']);
	    })
});


coldWeb.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});

coldWeb.run(function(userService) {
      userService.setUser(user);
});


coldWeb.config(function($httpProvider) {
	$httpProvider.interceptors.push(function ($q,$injector) {
        return {
            'response': function (response) {
                return response;
            },
            'responseError': function (rejection) {
            	var modal = $injector.get('$Modal');
            	modal.open({
            		animation : true,
                    templateUrl: 'app/template/error.html',
                    controller: 'error',
                    backdrop: true,
                    resolve: {
                    	rejection : function() {
                    		return rejection;
                    	}
                    }
                });

                return $q.reject(rejection);
            }
        };
    });
});


coldWeb.factory('baseTools',['$rootScope',function(){
	return {
		getFormatTimeString: function(delta){
			delta = delta ? delta + 8 * 60 * 60 * 1000: 8 * 60 * 60 * 1000;
			return new Date(new Date().getTime() + delta).toISOString().replace("T", " ").replace(/\..*/,"")
		},
		formatTime: function(timeString){
			if (typeof(timeString) == "string"){	
				return new Date(Date.parse(timeString) + 8 * 60 * 60 * 1000).toISOString().replace("T", " ").replace(/\..*/,"")
			}else{
				return new Date(timeString.getTime() + 8 * 60 * 60 * 1000).toISOString().replace("T", " ").replace(/\..*/,"")
			}
		},
		formatTimeToMinute: function(timeString){
			return this.formatTime(timeString).substring(0,16)
		},
		formatTimeToHour: function(timeString){
			return this.formatTime(timeString).substring(0,13)
		},
		formatTimeToDay: function(timeString){
			return this.formatTime(timeString).substring(0,10)
		},
		getEchartSingleOption: function(title, xData, yData, yName, yUnit, lineName, type,yMin,yMax){
			min = max = yData.length > 0?yData[0]:0
			angular.forEach(yData,function(item,index){
				yData[index] = yData[index].toFixed(2);
				min = Math.min(min,yData[index])
                max = Math.max(max,yData[index])
			})
			if(min>=0){
				yMin=0;
			}else{
				yMin = max - min < 1 && type == 'line' ?min - 10:yMin
			}
			option = {
				    tooltip : {
				        trigger: 'axis'
				    },
				    title: {
		                text: title
		            },
				    calculable : true,
				    xAxis : [
				        {
				            type : 'category',
				            data : xData
				        }
				    ],
				    yAxis : [
					        {
					            type : 'value',
					            name : yName + "(" + yUnit + ")",
					            min : yMin ? yMin : 'auto',
					            max : yMax ? yMax : 'auto',
					            minInterval : 1
					        }
					    ],
				    series : [
				        {
				            name:lineName,
				            type: type,
				            data:yData,
				        }
				    ]
				};
			return option
		}
	}
}]);


coldWeb.factory('userService', ['$rootScope', '$state', '$http', function ($rootScope, $state,$http) {
    return {
        setUser: function (user) {
            $rootScope.user = user;
            $rootScope.logout = function () {
	        	 $.ajax({type: "GET",cache: false,dataType: 'json',url: '/i/user/logout'}).success(function(data){});
	        	 $rootScope.user =window.user=user=undefined;//????????????user;
	        	 window.location.href="login.html";
	        };
        },
    };
}]);


coldWeb.filter('objectCount', function () {
    return function (input) {
        var size = 0, key;
        for (key in input) {
            if (input.hasOwnProperty(key)) size++;
        }
        return size;
    }
});

coldWeb.filter('toArray', function () {
    'use strict';

    return function (obj) {
        if (!(obj instanceof Object)) {
            return obj;
        }

        return Object.keys(obj).filter(function (key) {
            if (key.charAt(0) !== "$") {
                return key;
            }
        }).map(function (key) {
            if (!(obj[key] instanceof Object)) {
                obj[key] = {value: obj[key]};
            }

            return Object.defineProperty(obj[key], '$key', {__proto__: null, value: key});
        });
    };
});

coldWeb.directive('snippet', function () {
    return {
        restrict: 'E',
        template: '<pre><div class="hidden code" ng-transclude></div><code></code></pre>',
        replace: true,
        transclude: true,
        link: function (scope, elm, attrs) {
            scope.$watch(function () {
                return elm.find('.code').text();
            }, function (newValue, oldValue) {
                if (newValue != oldValue) {
                    elm.find('code').html(hljs.highlightAuto(newValue).value);
                }
            });
        }
    };
});

coldWeb.directive('activeLink', ['$location','$filter', function (location,filter) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs, controller) {
            var clazz = attrs.activeLink;
            var path = element.children().attr('href') + "";
            path = filter('limitTo')(path,path.length - 1 ,1);
            scope.location = location;
            scope.$watch('location.path()', function (newPath) {
                if (newPath.indexOf(path) > -1) {
                    element.addClass(clazz);
                } else {
                    element.removeClass(clazz);
                }
            });
        }
    };
}]);

coldWeb.filter('sizeformat',function(){
    return function(size){
        if(size / (1024 * 1024 * 1024) > 1)
            return (size/(1024*1024*1024)).toFixed(2)+'G';
        else if(size / (1024*1024) > 1)
            return (size/(1024*1024)).toFixed(2)+'M';
        else if(size / 1024 > 1)
            return (size/1024).toFixed(2)+'K';
        else
            return size+'B'
    }
});

coldWeb.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/home");

    //index
    $stateProvider.state('home',{
		url:'/home',
		controller: 'base',
	    templateUrl: 'app/template/home.html'
    }).state('about',{
    	url:'/about',
    	controller: 'base0',
        templateUrl: 'app/template/about.html'
    }).state('login',{
    	url:'/login',
    	controller: 'login',
        templateUrl: 'app/template/login.html'
    }).state('warn', {
        url: '/warn/:rdcId',
        controller: 'warn',
        templateUrl: 'app/template/warn.html'
    }).state('warncoldAnalysis', {//??????????????????
        url: '/warncoldAnalysis/{rdcId}',
        controller: 'warncoldAnalysis',
        templateUrl: 'app/template/warncoldAnalysis.html'
    }).state('myColdStorage',{
    	url:'/myColdStorage/:storageID',
    	controller: 'myColdStorage',
        templateUrl: 'app/template/myColdStorage.html'
    }).state('aboutus',{
    	url:'/aboutus',
    	controller: 'aboutus',
        templateUrl: 'app/template/about-us.html'
    }).state('report',{
    	url:'/report-{time}-{item}',
    	controller: 'report',
        templateUrl: 'app/template/report.html'
    }).state('coldStorageMap', {
        url: '/coldStorageMap/:storageID',
        controller: 'coldStorageMap',
        templateUrl: 'app/template/coldStorageMap.html'
    }).state('coldStorageMonitor', {
        url: '/coldStorageMonitor/:storageID',
        controller: 'coldStorageMonitor',
        templateUrl: 'app/template/coldStorageMonitor.html'
    }).state('compressorMonitor', {
        url: '/compressorMonitor/:storageID',
        controller: 'compressorMonitor',
        templateUrl: 'app/template/compressorMonitor.html'
    }).state('coldStorageDoor', {
        url: '/coldStorageDoor/:storageID',
        controller: 'coldStorageDoor',
        templateUrl: 'app/template/coldStorageDoor.html'
    }).state('coldStorageInOutGoods', {
        url: '/coldStorageInOutGoods',
        controller: 'coldStorageInOutGoods',
        templateUrl: 'app/template/coldStorageInOutGoods.html'
    }).state('coldStorageTemper', {
        url: '/coldStorageTemper/:storageID',
        controller: 'coldStorageTemper',
        templateUrl: 'app/template/coldStorageTemper.html'
    }).state('compressorPressure', {
        url: '/compressorPressure/:compressorID',
        controller: 'compressorPressure',
        templateUrl: 'app/template/compressorPressure.html'
    }).state('compressorBlower', {
        url: '/compressorBlower/{rdcId}',
        controller: 'compressorBlower',
        templateUrl: 'app/template/compressorBlower.html'
    }).state('coldStorageDiv', {
        url: '/coldStorageDiv/:storageID',
        controller: 'coldStorageDiv',
        templateUrl: 'app/template/coldStorageDiv.html'
    }).state('rdcPower', {
        url: '/rdcPower/:rdcId',
        controller: 'rdcPower',
        templateUrl: 'app/template/rdcPower.html'
    }).state('historyData',{
    	url:'/historyData',
    	controller: 'historyData',
        templateUrl: 'app/template/historyData.html'
    }).state('power',{
    	url:'/power/{powerid}',
    	controller: 'power',
        templateUrl: 'app/template/power.html'
    }).state('waterCost',{
    	url:'/waterCost',
    	controller: 'waterCost',
        templateUrl: 'app/template/waterCost.html'
    }).state('platformDoor',{
    	url:'/platformDoor/{doorid}',
    	controller: 'platformDoor',
        templateUrl: 'app/template/platformDoor.html'
    }).state('other',{
    	url:'/otherDevice',
    	controller: 'other',
        templateUrl: 'app/template/other.html'
    }).state('light',{
    	url:'/light/:storageID',
    	controller: 'light',
        templateUrl: 'app/template/light.html'
    }).state('reportsAnalysis',{//???????????? -?????? rdcID
    	url: '/reportsAnalysis/{rdcId}',
    	controller: 'reportsAnalysis',
        templateUrl: 'app/template/reportsAnalysis.html'
    }).state('coolingAnalysis',{//??????????????????  -?????? rdcID
    	url: '/coolingAnalysis/{rdcId}',
    	controller: 'coolingAnalysis',
        templateUrl: 'app/template/coolingAnalysis.html'
    }).state('runningAnalysis',{//??????????????????  -????????????--jhy
    	url: '/runningAnalysis/{rdcId}',
    	controller: 'runningAnalysis',
        templateUrl: 'app/template/runningAnalysis.html'
    }).state('goodsYzAnalysis',{//????????????  -??????????????????--jhy
    	url: '/goodsYzAnalysis/{rdcId}',
    	controller: 'goodsYzAnalysis',
        templateUrl: 'app/template/goodsYzAnalysis.html'
    }).state('monthReport',{//??????  -????????????--jhy--2016-10-31
    	url: '/monthReport/{rdcId}',
    	controller: 'monthReport',
        templateUrl: 'app/template/monthReport.html'
    }).state('cpswaterCost',{//
    	url: '/cpswaterCost/{groupID}',
    	controller: 'cpswaterCost',
        templateUrl: 'app/template/waterCostGroup.html'
    }).state('overTemperature',{
    	url:'/overTemperature/{rdcId}',
    	controller: 'overTemperature',
        templateUrl: 'app/template/overTemperature.html'
    }).state('overTemperatureYZ',{
    	url:'/overTemperatureYZ/{rdcId}',
    	controller: 'overTemperatureYZ',
        templateUrl: 'app/template/overTemperatureYZ.html'
    }).state('BWYZ',{
    	url:'/BWYZ/{rdcId}',
    	controller: 'BWYZ',
        templateUrl: 'app/template/BWYZ.html'
    }).state('WDZQYZ',{
    	url:'/WDZQYZ/{rdcId}',
    	controller: 'WDZQYZ',
        templateUrl: 'app/template/WDZQYZ.html'
    }).state('doorAnalysis',{
    	url:'/doorAnalysis/{rdcId}',
    	controller: 'doorAnalysis',
        templateUrl: 'app/template/doorAnalysis.html'
    }).state('baoyangReminder',{
    	url:'/baoyangReminder',
    	controller: 'baoyangReminder',
        templateUrl: 'app/template/baoyangReminder.html'
    }).state('baoyangWeixiuRecords',{
    	url:'/baoyangWeixiuRecords',
    	controller: 'baoyangWeixiuRecords',
        templateUrl: 'app/template/baoyangWeixiuRecords.html'
    }).state('baoyangWeixiuApply',{
    	url:'/baoyangWeixiuApply',
    	controller: 'baoyangWeixiuApply',
        templateUrl: 'app/template/baoyangWeixiuApply.html'
    }).state('hotAnalysis',{
    	url:'/hotAnalysis',
    	controller: 'hotAnalysis',
        templateUrl: 'app/template/hotAnalysis.html'
    }).state('dalsmc',{
    	url:'/dalsmc',
    	controller: 'dalsmc',
        templateUrl: 'app/template/dalsmc.html'
    });
});


//??????????????????????????????
function activeLi(ops){
	$('.my_sidebar li').removeClass('active');
	$(ops).addClass('active');
}