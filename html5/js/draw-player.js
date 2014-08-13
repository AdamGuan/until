//draw player
define(function(require, exports, module) {

	// 通过 require 引入依赖
	var debug = require('debug');
	var drawParsedata = require('draw-parsedata');
	//private
	var drawContainerName = "drawContainer";
	var progressName = "progress";
	var progressBtnName = "progressBtn";
	var playerName = "player";
	var playPauseName = "play-pause";
	var playBtnName = "play";
	var pauseBtnName = "pause";
	var infoName = "info";
	var timeName = "time";
	var timePlayedName = "time_played";
	var timeDurationName = "time_duration";
	var pageCurrentName = "page-current";
	var pageTotalName = "page-total";
	var gotoPageName = "gotopage";
	var fullscreenName = "fullscreen";
	var volumeControlName = "volume-scrubber";
	var volumeProgressName = "volume-progress";
	var btnMouseDown = 0;
	var progressPause = 0;
	var timeShowPause = 0;
	var processBtnLeftNum;
	var hidePlayerHaner = -1;
	var playerShowLock = 0;
	var eventObj;
	
	//事件绑定
	exports.bindEvent = function()
	{
		eventObj = drawParsedata.eventObj();
		var brower = drawParsedata.brower();
		
		if(brower['platformType'] == 'disktop')
		{
			$("#"+progressBtnName).bind("mousedown", function(e){
				processBtnClick(e);
				return false;
			});
		}
		else
		{
			document.getElementById(progressBtnName).addEventListener('touchstart',processBtnClick, false);
		}

		$("."+playPauseName).bind("click", function(e){
			e.preventDefault();
			playPauseClick();
			return false;
		});
		
		if(brower['platformType'] == 'disktop')
		{
			$("#"+progressBtnName).parent().parent().bind("click", function(e){
				progressClick(e);
			});
		}
		else
		{
			document.getElementById("scrubber").addEventListener('touchstart',progressClick, false);
		}

		$("#"+gotoPageName).bind("submit", function(e){
			e.preventDefault();
			gotoPage();
			return false;
		});
		
		/*
		$("#"+fullscreenName).bind("click", function(){
			fullScreenClick();
		});
		
		
		$("#"+drawContainerName).bind("focusin", function(){
			showPlayer();
		});
		

		$("#"+drawContainerName).bind("click", function(){
			showPlayer();
		});

		$("#"+drawContainerName).bind("mousemove", function(){
			showPlayer();
		});

		$("#"+drawContainerName).bind("mouseover", function(){
			showPlayer();
		});
		*/
		
		$("#"+volumeControlName).bind("click", function(e){
			e.preventDefault();
			audioVolumeClick(e);
			return false;
		});
	};

	//进度条位置设置
	var setProcessWidth = function(width){
		if(!checkProcessLocked())
		{
			$("#"+progressName).css({width:width});
			$("#"+progressBtnName).css({left:width});
		}
	};
	
	//检查进度条是否锁定
	var checkProcessLocked = function(){
		return progressPause;
	};
	
	//设置进度条锁定
	var setProcessLock = function(){
		progressPause = 1;
	};
	
	//解锁进度条
	var setProcessUnLock = function(){
		progressPause = 0;
	};
	
	//进度条btn点击时发生
	var processBtnClick = function(e){
		e.preventDefault();

		btnMouseDown = 1;
		setProcessLock();
		setTimeShowLock();
		//监听鼠标移动
		var brower = drawParsedata.brower();
		if(brower['platformType'] == 'disktop')
		{
			$("#"+playerName).bind("mousemove", function(e){
				e.preventDefault();
				mouseMove(e);
				return false;
			});
		}
		else
		{
			document.getElementById(playerName).addEventListener('touchmove',mouseMove, false);
			/*
			$("#"+playerName).bind("touchmove", function(e){
				e.preventDefault();
				mouseMove(e);
				return false;
			});
			*/
		}
		
		//监听鼠标释放
		if(brower['platformType'] == 'disktop')
		{
			$("#"+progressBtnName).bind("mouseup", function(e){
				mouseup(e);
				return false;
			});
		}
		else
		{
			document.getElementById(progressBtnName).addEventListener('touchend', mouseup, false);
		}
		
	};

	//进度条点击时发生
	var progressClick = function(e){
		e.preventDefault();
		if(btnMouseDown == 1)
		{
			btnMouseDown = 0;
		}
		else
		{
			var pageX = e.pageX;
			var brower = drawParsedata.brower();
			if(brower['platformType'] != 'disktop')
			{
				pageX = Number(e.touches[0].pageX);
			}
			//计算点击到的进度点时间以及位置
			var data = calculateProgressClickData(pageX);
			var timestamp = data['timeStamp'];
			var width = data['width'];
			//更新时间信息
			setTimeShowLock();
			timeUpdateShow(timestamp);
			//改变进度条的位置
			setProcessLock();
			$("#"+progressName).css({width:width});
			$("#"+progressBtnName).css({left:width});
			//发送 重画 事件
			$(eventObj).data("timestamp", timestamp);
			$(eventObj).trigger("reDraw");
		}
	};
	
	//mouse move
	var mouseMove = function(e){
		e.preventDefault();
		var brower = drawParsedata.brower();
		var pageX = e.pageX;
		if(brower['platformType'] != 'disktop')
		{
			pageX = Number(e.touches[0].pageX);
			
		}
		
		var progressOffsetX = $('#'+progressName).offset().left;

		var progressBtnOffsetX = $('#'+progressBtnName).parent().offset().left;

		var progressTotalW = $('#'+progressName).parent().width();
		var progressBtnTotalW = $('#'+progressBtnName).parent().width();

		var progresswidth = eval(((pageX - progressOffsetX)/progressTotalW)*100)+"%";
		if(parseFloat(progresswidth) > 100)
		{
			progresswidth = "100%";
		}
		
		processBtnLeftNum = (pageX - progressBtnOffsetX)/progressBtnTotalW;
		var progressBtnwidth = eval(processBtnLeftNum*100)+"%";
		if(parseFloat(progressBtnwidth) > 100)
		{
			progressBtnwidth = "100%";
		}

		$("#"+progressName).css({width:progresswidth});
		$("#"+progressBtnName).css({left:progressBtnwidth});

		//更新时间信息
		timeUpdateShow(calculateDragTimestamp());
	};
	
	//mouse up
	var mouseup = function(e){
		e.preventDefault();
		var brower = drawParsedata.brower();		
		if(brower['platformType'] == 'disktop')
		{
			$("#"+playerName).unbind("mousemove");
			$("#"+progressBtnName).unbind("mouseup");
		}
		else
		{
			document.getElementById(playerName).removeEventListener('touchmove',mouseMove, false);
			document.getElementById(progressBtnName).removeEventListener('touchend',mouseup, false);
			/*
			$("#"+playerName).unbind("touchmove");
			$("#"+progressBtnName).unbind("touchend");
			*/
		}
		setProcessUnLock();
		
		//发送 重画 事件
		if(typeof(processBtnLeftNum) != "undefined")
		{
			$(eventObj).data("timestamp", calculateDragTimestamp());
			processBtnLeftNum = undefined;
			$(eventObj).trigger("reDraw");
		}
	};

	//计算进度条拖动后的时间点
	var calculateDragTimestamp = function(){
		
		var timstamp = processBtnLeftNum*drawParsedata.totalTime();
		timstamp = Math.round(timstamp/100);
		timstamp = parseInt(timstamp)*100;
		if(timstamp > drawParsedata.totalTime())
		{
			timstamp = drawParsedata.totalTime();
		}
		else if(timstamp < 0)
		{
			timstamp = 0;
		}
		
		return timstamp;
	};

	//计算进度条点击的时间点
	var calculateProgressClickData = function(pageX){
		var progressBtnOffsetX = $('#'+progressBtnName).parent().parent().offset().left;
		var progressBtnTotalW = $('#'+progressBtnName).parent().parent().width();

		var timstamp = ((pageX - progressBtnOffsetX)/progressBtnTotalW)*drawParsedata.totalTime();
		timstamp = Math.round(timstamp/100);
		timstamp = parseInt(timstamp)*100;
		if(timstamp > drawParsedata.totalTime())
		{
			timstamp = drawParsedata.totalTime();
		}
		else if(timstamp < 0)
		{
			timstamp = 0;
		}
		var data = new Array();
		
		data['timeStamp'] = timstamp;
		data['width'] = eval((timstamp/drawParsedata.totalTime())*100)+"%";
		if(parseFloat(data['width']) > 100)
		{
			data['width'] = "100%";
		}
		return data;
		
	};

	//显示为播放
	var showPlayBtn = function(){
		$("#"+pauseBtnName).hide();
		$("#"+playBtnName).show();
	};
	
	//显示为暂停
	var showPauseBtn = function(){
		//不显示暂停动画
		hidePauseMsg();

		$("#"+playBtnName).hide();
		$("#"+pauseBtnName).show();
	};

	//显示暂停消息
	var showPauseMsg = function(){
		$("#"+infoName+" p").css({opacity:1});
		$("#"+infoName+" p").html("暂停");
	};

	//隐藏暂停消息
	var hidePauseMsg = function(){
		$("#"+infoName+" p").css({opacity:0});
	};

	//显示完毕消息
	var showOverMsg = function(){
		$("#"+infoName+" p").css({opacity:1});
		$("#"+infoName+" p").html("完毕");
	};

	//隐藏完毕消息
	var hideOverMsg = function(){
		$("#"+infoName+" p").css({opacity:0});
	};
	
	//暂停
	var pauseDraw = function(){
		//显示暂停动画
		showPauseMsg();
		//播放按钮样式设置
		showPlayBtn();
		//发送 暂停 事件
		$(eventObj).trigger("pauseDraw");
		//显示播放器控制器
		showPlayer();
		//锁定播放控制器
		setPlayerShowLock();
	};
	
	//播放
	var playDraw = function(){
		//不显示暂停动画
		hidePauseMsg();
		//播放按钮样式设置
		showPauseBtn();
		//解锁播放控制器
		setPlayerShowUnLock();
		//发送 播放 事件
		$(eventObj).trigger("playDraw");
	};
	
	//播放按钮点击处理
	var playPauseClick = function(){
		//pause
		if($("#"+playBtnName).css("display") == "none")
		{
			pauseDraw();
		}
		//play
		else if($("#"+pauseBtnName).css("display") == "none")
		{
			playDraw();
		}
	};

	//更新时间
	var timeUpdateShow = function(currentTimeStamp){
		var current = timeFormat(currentTimeStamp);
		var total = timeFormat(drawParsedata.totalTime());
		$("#"+timePlayedName).html(current);
		$("#"+timeDurationName).html(total);
	};

	//时间格式化
	var timeFormat = function(timeStamp){
		var min = Math.floor((timeStamp/1000)/60);
		var sec = Math.round(timeStamp/1000) - min*60;
		if(sec < 10)
		{
			sec = '0'+sec;
		}
		return min+':'+sec;
	};

	//检查显示时间是否锁定
	var checkTimeShowLocked = function(){
		return timeShowPause;
	};
	
	//设置显示时间锁定
	var setTimeShowLock = function(){
		timeShowPause = 1;
	};
	
	//解锁显示时间
	var setTimeShowUnLock = function(){
		timeShowPause = 0;
	};

	//更新form page
	var formPageUpdateShow = function(currentPage){
		$("#"+pageCurrentName).html(currentPage);
		$("#"+pageTotalName).html(drawParsedata.totalPage());
	};
	
	//跳转canvas到相应的页面
	var gotoPage = function(){
		var currentPage = $("#"+pageCurrentName).val();
		if(currentPage > drawParsedata.totalPage())
		{
			currentPage = drawParsedata.totalPage();
		}
		if(currentPage < 1)
		{
			currentPage = 1;
		}
		//暂停
		pauseDraw();
		//发送 移动canvas 事件
		$(eventObj).data("currentPage", (currentPage-1));
		$(eventObj).trigger("canvasMove");
	};

	//全屏
	var launchFullScreen = function(element) {
		if(element.requestFullscreen) {
			element.requestFullscreen();
		} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		} else if(element.msRequestFullscreen) {
			element.msRequestFullscreen();
		}
	};

	// 退出 fullscreen
	var exitFullscreen = function() {
		if(document.exitFullscreen) {
			document.exitFullscreen();
		} else if(document.mozExitFullScreen) {
			document.mozExitFullScreen();
		} else if(document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	};
	
	//fullscreen click
	var fullScreenClick = function(){
		launchFullScreen(document.getElementById(drawContainerName));
	};
	
	//hide 播放器控制台
	var hidePlayer = function(){
		if(hidePlayerHaner != -1 && !checkPlayerShowLock())
		{
			$("#"+playerName).animate({ 
				"margin-bottom": -($("#"+playerName).height()-2),
			}, 1000 );
		}
		hidePlayerHaner = setTimeout(function(){hidePlayer();},5000);
	};
	
	//show 播放器控制台
	var showPlayer = function(rightNow){
		if(hidePlayerHaner != -1 || (typeof(rightNow) !== "undefined" && rightNow == 1))
		{
			hidePlayerHaner = -1;
			$("#"+playerName).animate({ 
				"margin-bottom": 0,
			}, 500 );
		}
		hidePlayerHaner = -1;
	};
	
	//设置播放器控制锁定显示
	var setPlayerShowLock = function(){
		playerShowLock = 1;
	};
	
	//设置播放器控制解锁显示
	var setPlayerShowUnLock = function(){
		playerShowLock = 0;
	};
	
	//检查播放器控制是否被锁定显示
	var checkPlayerShowLock = function(){
		return playerShowLock;
	};
	
	//声音进度点击时
	var audioVolumeClick = function(e){
		//计算音量值,并设置
		var volumeDistance = e.pageX - $("#"+volumeControlName).offset().left;
		var volume = volumeDistance/$("#"+volumeControlName).width();
		//发送 声音 变更事件
		$(eventObj).data("volume", volume);
		$(eventObj).trigger("audioChange");
		//改变音量proress的显示
		var progressWdith = eval(volume*100)+"%";
		if(parseFloat(progressWdith) > 100)
		{
			progressWdith = "100%";
		}
		$("#"+volumeProgressName).css({width:progressWdith});
	};
	
	//public
	exports.setPlayerStyle = function(drawContainerName){
		var draContainer = $("#"+drawContainerName);
		var top = Number(draContainer.position().top)+Number(draContainer.attr("height"));
		var left = Number(draContainer.position().left);
		var width = Number(draContainer.attr("width"))+2;
		$("#player").css({top:top,width:width,display:"block"});
	};
	exports.setProcessLock = function(){setProcessLock();};
	exports.setProcessUnLock = function(){setProcessUnLock();};
	exports.hidePauseMsg = function(){hidePauseMsg();};
	exports.showPauseBtn = function(){showPauseBtn();};
	exports.formPageUpdateShow = function(currentPage){formPageUpdateShow(currentPage);};
	exports.timeUpdateShow = function(currentTimeStamp){timeUpdateShow(currentTimeStamp);};
	exports.setPlayerShowUnLock = function(){setPlayerShowUnLock();};
	exports.hidePlayer = function(){hidePlayer();};
	exports.showPlayBtn = function(){showPlayBtn();};
	exports.setPlayerShowLock = function(){setPlayerShowLock();};
	exports.showPlayer = function(rightNow){showPlayer(rightNow);};
	exports.showOverMsg = function(){showOverMsg();};
	exports.checkTimeShowLocked = function(){return checkTimeShowLocked();};
	exports.setProcessWidth = function(width){setProcessWidth(width);};
	exports.setTimeShowUnLock = function(width){setTimeShowUnLock();};
	exports.getPlayerHeight = function(){return $("#"+playerName).height();};

});