//draw main
define(function(require, exports, module) {

	//private , 通过 require 引入依赖	
	var drawParsedata = require('draw-parsedata');
	var drawCanvas = require('draw-canvas');
	var drawPlayer = require('draw-player');
		
	//public start
	exports.start = function(url){
		drawCanvas.setDrawContainerWH();
		drawCanvas.bindEvent();
		drawPlayer.bindEvent();
		drawParsedata.start(url);
	};

});