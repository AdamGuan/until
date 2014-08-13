//draw canvas
define(function(require, exports, module) {

	//private , 通过 require 引入依赖
	var debug = require('debug');
	var drawPlayer = require('draw-player');
	var drawParsedata = require('draw-parsedata');
	
	//private
	var c;
	var ctx;
	var startDrawHander;
	var currentTimeoffset = 0;
	var lastPoint = new Array();
	var drawContainerName = "drawContainer";
	var canvasNameBase = "myCanvas";
	var canvasImgNameBase = "myCanvas_";
	var canvasContainerName = "canvasContainer";
	var canvasPageFooterNameBase = "canvasPageFooter";
	var penName = "pencil";
	var drawLoadingName = "drawLoading";
	var imgLoadingName = "imgLoading";
	var audioName = "drawAudio";
	var mainContainerName = "mainContainer";
	var drawPause = 0;
	var penTimeOutHander;
	var eventObj;
	var canvasScroll = 0;
	var left;
	var bgImgHeightK = 0.9;
	
	//事件绑定
	exports.bindEvent = function(){
		
		eventObj = drawParsedata.eventObj();
		var brower = drawParsedata.brower();

		$(eventObj).bind("drawReady", function(){
				if(brower['platformType'] == 'disktop')
				{
					listenerMouseScroll();
				}
				else
				{
					$$('#'+canvasContainerName).swiping(function(e) {
						e.preventDefault();
						if(checkCanvasScroll())
						{
							scrollCanvasContainer(e['iniTouch']['y']-e['currentTouch']['y']);
						}
					});
				}
				debug.log("drawReady");
				drawLineStart();
			});

		$(eventObj).bind("reDraw", function(){
			reDraw($(eventObj).data("timestamp"));
			drawPlayer.setTimeShowUnLock();
		});

		$(eventObj).bind("pauseDraw", function(){
			debug.log("pauseDraw");
			//停止划线
			drawLineStop();
			//停止声音
			document.getElementById(audioName).pause();
			//设置鼠标滚动时canvas container也滚动
			setCanvasScroll();
		});

		$(eventObj).bind("playDraw", function(){
			debug.log("playDraw");
			//划线开启
			drawLineStart();
			//开启声音
			document.getElementById(audioName).play();
		});

		$(eventObj).bind("canvasMove", function(){
			//画面移动到currentPage
			var sprintY = getContainerH()*$(eventObj).data("currentPage");
			addCanvas(sprintY,1);
			locateCanvas(sprintY);
		});

		$(eventObj).bind("audioChange", function(){
			document.getElementById(audioName).volume = $(eventObj).data("volume");
		});
	};

	//设置添加的页脚的样式
	var setAddCanvasPageFooter = function(footer,cav){
		$(footer).css({ position: "absolute", top: ($(cav).position().top+$(cav).height()-$(footer).height()-8), left:($(cav).width()-$(footer).width()-8),"z-index":99});
	};
	
	//获取draw container的高度
	var getContainerH = function(){
			return $("#"+drawContainerName).attr("height");
	};
	
	//获取draw container的宽度
	var getContainerW = function(){
		return $("#"+drawContainerName).attr("width");
	};
	
	//设置添加的canvas的位置
	var setAddCanvasPosition = function(cav,commonCav,pageNum){
		$(cav).css({ position: "absolute", top: $(commonCav).height()*pageNum, left:$(commonCav).position().left,"z-index":1});
	};
	
	//设置canvas的宽高
	var setCanvasWH = function(cav){
		var drawContainer = $("#"+drawContainerName);
		drawContainer.width(drawContainer.attr("width"));
		drawContainer.height(drawContainer.attr("height"));
		$(cav).width(drawContainer.width());
		$(cav).height(drawContainer.height());
	};
	
	//设置线条的颜色
	var setLineColor = function(ctx,colorNum){
		var color;
		switch(colorNum)
		{
			case 1:
				color = "#000000";
				break;
			case 2:
				color = "#0000ff";
				break;
			case 3:
				color = "#FF0000";
				break;
			case 4:
				color = "#6bb82d";
				break;
			case 5:
				color = "yellow";
				break;
			default:
				color = "black";
				break;
		}
		ctx.strokeStyle = color;
	};
	
	//设置canvas container的宽高
	exports.setDrawContainerWH = function(){
		var h = $(window).height() - drawPlayer.getPlayerHeight();
		var w = ($(window).height() - drawPlayer.getPlayerHeight())*1280/768;
		h *= 1;
		w *= 1;
		$("#"+drawContainerName).attr("height",h);
		$("#"+drawContainerName).attr("width",w);
		$("#"+drawContainerName).css({'margin':'0 auto'});
		
		//设置player style
		drawPlayer.setPlayerStyle(drawContainerName);
		//设置main container 高
		$("#"+mainContainerName).css({height:(Number($("#"+drawContainerName).attr("height"))+Number(drawPlayer.getPlayerHeight())),width:$("#"+drawContainerName).attr("width"),'margin':'0 auto'})
//		$("#"+mainContainerName).attr("height",eval(Number($("#"+drawContainerName).attr("height"))+Number(drawPlayer.getPlayerHeight()))+"px");
	};

	//ctx style默认设置
	var setDefaultCtxStyle = function(ctx,lineCap,lineWidth,miterLimit,lineJoin)
	{
		ctx.lineCap = lineCap;
		ctx.lineWidth= lineWidth;
		ctx.miterLimit = miterLimit;
		ctx.lineJoin = lineJoin;
	};

	//笔移动
	var penMove = function(left,top){
		if(typeof(penTimeOutHander) != "undefined")
		{
			clearTimeout(penTimeOutHander);
		}
		$("#"+penName).show();
		$("#"+penName).css({ top: top, left:left});
		penTimeOutHander = setTimeout(function(){penHide();},2000);
	};

	//笔隐藏
	var penHide = function(){
		$("#"+penName).hide("normal");
	};

	//显示重画loading
	var showDrawLoading = function(){
		var left = $("#"+drawContainerName).width()/2;
		var top = $("#"+drawContainerName).height()/2;
		$("<img id='"+drawLoadingName+"' src='./resource/loading.gif' style='position:absolute;z-index:110;left:"+left+"px;top:"+top+"px' />").insertAfter("#"+drawContainerName);
	};
	
	//隐藏重画loading
	var hideDrawLoading = function(){
		$("#"+drawLoadingName).remove();
	};

	//显示题目加载loading
	var showImgLoading = function(){
		var left = $("#"+drawContainerName).width()/2;
		var top = $("#"+drawContainerName).height()/2;
		$("<img id='"+imgLoadingName+"' src='./resource/loading.gif' style='position:absolute;z-index:110;left:"+left+"px;top:"+top+"px' />").insertAfter("#"+drawContainerName);
	};
	
	//隐藏题目加载loading
	var hideImgLoading = function(){
		$("#"+imgLoadingName).remove();
	};
	
	

	//重画一直到某个时间点
	var reDraw = function(timestamp){
		//显示loading
		showDrawLoading();
		//进度条锁定
		drawPlayer.setProcessLock();
		//关闭划线定时器
		debug.log("reDraw");
		drawLineStop();
		//关闭声音
		document.getElementById(audioName).pause();
		//删除所有画布以及页脚
		var totalPage = drawParsedata.totalPage();
		for(var i=0;i<totalPage;++i)
		{
			if($("#"+canvasNameBase+i).is("canvas"))
			{
				$("#"+canvasNameBase+i).remove();
			}
			if($("#"+canvasImgNameBase+i).is("canvas"))
			{
				$("#"+canvasImgNameBase+i).remove();
			}
			if($("#"+canvasPageFooterNameBase+i).is("span"))
			{
				$("#"+canvasPageFooterNameBase+i).remove();
			}
		}		
		//重画所有的轨迹
		$("#"+canvasContainerName).hide();
		currentTimeoffset = 0;
		lastPoint = new Array();
		for(;currentTimeoffset<timestamp;)
		{
			drawLine();
		}
		$("#"+canvasContainerName).show();
		//校正page footer的位置
		for(var i=0;i<totalPage;++i)
		{
			if($("#"+canvasPageFooterNameBase+i).is("span"))
			{
				setAddCanvasPageFooter(document.getElementById(""+canvasPageFooterNameBase+i+""),document.getElementById(""+canvasNameBase+i));
			}
		}
		
		//解锁进度条
		drawPlayer.setProcessUnLock();
		//开启并seek声音
		document.getElementById(audioName).currentTime = Math.round(timestamp/1000);
		document.getElementById(audioName).play();
		//开启划线定时器
		drawLineStart();
		//不显示暂停动画
		drawPlayer.hidePauseMsg();
		//设置播放按钮的样式
		drawPlayer.showPauseBtn();
		//关闭loading
		hideDrawLoading();
	};

	//设置canvas滚动
	var setCanvasScroll = function(){
		canvasScroll = 1;
	};
	
	//设置canvas不可滚动
	var setCanvasNoScroll = function(){
		canvasScroll = 0;
	};
	
	//检查canvas是否可滚动
	var checkCanvasScroll = function(){
		return canvasScroll;
	};
	
	//监听canvas鼠标滚动
	var listenerMouseScroll = function(){
		var element = window.document.getElementById(canvasContainerName);
		// firefox
		if(element.addEventListener){
			element.addEventListener('DOMMouseScroll', function(event){
				if(checkCanvasScroll(event.detail))
				{
					//滚动canvas container
					scrollCanvasContainer(event.detail);
					return false;
				}
			}, false);
		}
		// ie & chrome & opera & safari
		element.onmousewheel = function(event) {
			event = event || window.event;
			if(checkCanvasScroll())
			{
				//滚动canvas container
				scrollCanvasContainer(event.wheelDelta);
				return false;
			}
		};
	};
	
	//滚动canvas
	var scrollCanvasContainer = function(upDown){
//		alert(upDown);
		var item = $("#"+canvasContainerName);
		var top = item.position().top + upDown;
		if(top < 0)
		{
			//判断是否最底
			var totalPage = drawParsedata.totalPage();
			var tmp = 0;
			for(var i=0;i<totalPage;++i)
			{
				if($("#"+canvasNameBase+i).is("canvas"))
				{
					++tmp;
				}
			}
			if(tmp > 0)
			{
				var h = -(tmp-1)*getContainerH();
				if(top < h)
				{
					top = h;
				}
			}
		}
		else if(top > 0)
		{
			top = 0;
		}
		$("#"+canvasContainerName).css({top: top});
	};

	//计算需要减掉的左侧距离
	var calculateLeft = function(){
		if(typeof(left) == "undefined")
		{
			left = getContainerH()*100/1280;
		}
		return left;
	};

	//计算图片高度rate
	var calculateBGIMGK = function(){
		if(typeof(bgImgK) == "undefined")
		{
			bgImgK = getContainerH()*100/1280;
		}
		return bgImgK;
	};

	//获取myCanvas0 Context obj
	var getCtxById = function(id)
	{
		return document.getElementById(id).getContext("2d");
	};
	
	//计算当前点所在的page
	var calculatePointPage = function(sprintY,y){
		var aCanvasH = getContainerH();
		var page = Math.floor(sprintY/aCanvasH);
		if((y - (aCanvasH - (sprintY - page*aCanvasH))) > 0)
		{
			page += 1;
		}
		return page;
	};
	
	//计算当前点所在的canvas的y值
	var calculatePointCanvasY = function(sprintY,y){
		var aCanvasH = getContainerH();
		return (y - (calculatePointPage(sprintY,y)*aCanvasH - sprintY));
	};
	
	//添加canvas page footer
	var addPageFooter = function(objId,text,currentPageNum){
		$("<span id='"+canvasPageFooterNameBase+currentPageNum+"'>"+text+"</span>").insertAfter("#"+objId);
		
		setAddCanvasPageFooter(document.getElementById(""+canvasPageFooterNameBase+currentPageNum+""),document.getElementById(""+objId+""));
	};
	
	//添加canvas
	var addCanvas = function(sprintY,y){
		var currentPointPage = calculatePointPage(sprintY,y);
		for(var i=0;i<=currentPointPage;++i)
		{
			if(!$("#"+canvasNameBase+i).is("canvas"))
			{
				if(i == 0)
				{
					$("<canvas id='"+canvasNameBase+i+"' width='"+$("#"+drawContainerName).attr("width")+"' height = '"+$("#"+drawContainerName).attr("height")+"'></canvas>").prependTo("#"+canvasContainerName);
				}
				else
				{
					$("<canvas id='"+canvasNameBase+i+"' width='"+$("#"+drawContainerName).attr("width")+"' height = '"+$("#"+drawContainerName).attr("height")+"'></canvas>").insertAfter("#"+canvasNameBase+(i-1));
				}
				//设置canvas大小,位置以及ctx样式
				setAddCanvasPosition(document.getElementById(canvasNameBase+i),document.getElementById(canvasNameBase+'0'),i);
				setCanvasWH(document.getElementById(canvasNameBase+""+i));
				setDefaultCtxStyle(document.getElementById(canvasNameBase+""+i).getContext("2d"),"round",3,1,"round");
				//添加footer
				addPageFooter(""+canvasNameBase+i+"",eval(i+1)+"/"+drawParsedata.totalPage(),i);
			}
		}
		return document.getElementById(canvasNameBase+currentPointPage);
	};

	//添加画题目专用canvas
	var addImgCanvas = function(canvasId,num){
		$("<canvas id='"+canvasImgNameBase+num+"' width='"+$("#"+drawContainerName).attr("width")+"' height = '"+$("#"+drawContainerName).attr("height")+"'></canvas>").insertAfter("#"+canvasId);
		//设置canvas大小,位置以及ctx样式
		$("#"+canvasImgNameBase+num).css({ position: "absolute", top: $("#"+canvasId).css("top"), left:$("#"+canvasId).css("left"),"z-index":0});
		
		setCanvasWH(document.getElementById(""+canvasImgNameBase+num));
		
		return document.getElementById(canvasImgNameBase+num);
	};
	
	//重新定位canvas
	var locateCanvas = function(sprintY){
		$("#"+canvasContainerName).css({ position: "absolute", top: -Math.abs(sprintY)});
	};
	
	//计算分页时的点坐标
	var calculateCrossPoint = function(x1,y1,x2,y2,page1,page2){
		var canvasH = parseFloat(getContainerH());
		var y = canvasH;
		if(page1 > page2)
		{
			y1 = eval(y1+canvasH);
		}
		else
		{
			y2 = eval(y2+canvasH);
		}
		var x = (x1*y+x2*y1-x2*y-x1*y2)/(y1-y2);
		var point = new Array();
		y = 0;
		if(page1 > page2)
		{
			y = canvasH;
		}
		point['x'] = Math.abs(x);
		point['y'] = y;
		return point;
	};

	//画线开始
	var drawLineStart = function()
	{
		//撤销鼠标滚动时，canvas container也滚动
		setCanvasNoScroll();
		//设置form page
		drawPlayer.formPageUpdateShow(1);
		//显示时间更新
		drawPlayer.timeUpdateShow(currentTimeoffset);
		//解除播放控制器锁定
		drawPlayer.setPlayerShowUnLock();
		//player隐藏
//		drawPlayer.hidePlayer();
		//划线定时器开启
		startDrawHander = window.setInterval(function(){drawLine();},100);
		debug.log('start');
	};
	
	//画线停止
	var drawLineStop = function()
	{
		window.clearInterval(startDrawHander);
		//播放按钮样式设置
		drawPlayer.showPlayBtn();
		//设置鼠标滚动时canvas container也滚动
		setCanvasScroll();
		//锁定播放控制器
		drawPlayer.setPlayerShowLock();
		//显示播放器控制器
		drawPlayer.showPlayer(1);
		debug.log("draw end!");
	};

	//画线过程
	var drawLine = function()
	{
		var drawDataList = drawParsedata.datas();
		var bgImgList = drawParsedata.bgImgList();
		var totalTime = drawParsedata.totalTime();
		var canvasW = getContainerW();
		var canvasH = getContainerH();
		//判断播放时间是否结束
		if(currentTimeoffset > totalTime)
		{
			//显示播放完毕消息
			drawPlayer.showOverMsg();
			debug.log("drawline");
			drawLineStop();
		}
		//题目图片加载
		if(typeof(bgImgList[currentTimeoffset]) != "undefined")
		{
			var item = bgImgList[currentTimeoffset];
			for(var z=0;z<item.length;++z)
			{
				var page = item[z]['page'];
				var sprintY = page*canvasH;
				addCanvas(sprintY,1);
				showImgLoading();
				var img = new Image();
				var ctx = addImgCanvas((canvasNameBase+""+page),page).getContext("2d");
				img.src = item[z]['bgImgName'];
				img.width = canvasW,
				img.height = bgImgHeightK*canvasH,
				img.addEventListener("load", function() {
					ctx.drawImage(img,0,0,img.width,img.height);
					hideImgLoading();
				}, false);
				locateCanvas(sprintY);
			}
		}
		//画线
		for(var z=0;z<drawDataList.length;++z)
		{
			var dataItem = drawDataList[z];
			if(typeof(dataItem[currentTimeoffset]) != "undefined")
			{
				for(var i=0;i<dataItem[currentTimeoffset].length;++i)
				{
					var sprintY = dataItem[currentTimeoffset][i]['sprinty']*canvasH;
					var x = dataItem[currentTimeoffset][i]['x']*canvasW - calculateLeft();
					var y = dataItem[currentTimeoffset][i]['y']*canvasH;
					var brushNum = dataItem[currentTimeoffset][i]['brushnum'];
					var currentCanvas = addCanvas(sprintY,y);
					var ctx = currentCanvas.getContext("2d");
					var currentCanvasPage = calculatePointPage(sprintY,y);
					var currentCanvasY = calculatePointCanvasY(sprintY,y);
					var currentCanvasX = x;
					
					locateCanvas(sprintY);
					ctx.beginPath();
					setLineColor(ctx,brushNum);
					if(typeof(lastPoint[z]) == "undefined" || (typeof(lastPoint[z]['end']) != "undefined" && lastPoint[z]['end'] == 1))
					{
						ctx.moveTo(currentCanvasX,currentCanvasY);
						penMove(x,y);
					}
					else
					{
						if(typeof(lastPoint[z]['x']) != "undefined" && typeof(lastPoint[z]['y']) != "undefined")
						{
							if(lastPoint[z]['page'] != currentCanvasPage)
							{
								ctx.stroke();
								var crossPoint = calculateCrossPoint(lastPoint[z]['x'],lastPoint[z]['y'],currentCanvasX,currentCanvasY,lastPoint[z]['page'],currentCanvasPage);
								var tmpy = (crossPoint['y'] > 0)?0:canvasH;
								lastPoint[z]['ctx'].beginPath();
								lastPoint[z]['ctx'].moveTo(lastPoint[z]['x'],lastPoint[z]['y']);
								lastPoint[z]['ctx'].lineTo(crossPoint['x'],tmpy);
								lastPoint[z]['ctx'].stroke();
								ctx.beginPath();
								ctx.moveTo(crossPoint['x'],crossPoint['y']);
							}
							else
							{
								ctx.moveTo(lastPoint[z]['x'],lastPoint[z]['y']);
							}
						}
						ctx.lineTo(currentCanvasX,currentCanvasY);
						penMove(x,y);
					}
					ctx.stroke();
					lastPoint[z] = new Array();
					lastPoint[z]['end'] = 0;
					lastPoint[z]['x'] = currentCanvasX;
					lastPoint[z]['y'] = currentCanvasY;
					lastPoint[z]['page'] = currentCanvasPage;
					lastPoint[z]['ctx'] = ctx;
					if(dataItem[currentTimeoffset][i]['end'] == 1)
					{
						lastPoint[z]['end'] = 1;
					}
				}
			}
		}
		currentTimeoffset += 100;
		//显示时间更新
		if(!drawPlayer.checkTimeShowLocked())
		{
			drawPlayer.timeUpdateShow(currentTimeoffset);
		}
		//进度条位置设置
		var tmp = eval((currentTimeoffset/drawParsedata.totalTime())*100)+"%";
		if(parseFloat(tmp) > 100)
		{
			tmp = "100%";
		}
		drawPlayer.setProcessWidth(tmp);
	};
	
});
