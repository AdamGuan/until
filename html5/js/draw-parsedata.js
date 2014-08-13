//parse data
define(function(require, exports, module) {

	//private , 通过 require 引入依赖
	var debug = require('debug');
	
	//private
	var getJsonDataUrl;
	var getJsonDataMethod = "GET";
	var getJsonDataSend = "";
	var totalTime;
	var totalPage;
	var bgImgList;
	var audioName = "drawAudio";
	var drawContainerName = "drawContainer";
	var parseLoadingName = "parseLoading";
	var datas = new Array();
	var eventObj = {};
	var brower = new Array();

	//显示loading
	var showParseLoading = function(){
		var left = $("#"+drawContainerName).attr("width")/2;
		var top = $("#"+drawContainerName).attr("height")/2;
		$("<img id='"+parseLoadingName+"' src='./resource/loading.gif' style='position:absolute;z-index:110;left:"+left+"px;top:"+top+"px' />").insertAfter("#"+drawContainerName);
	};
	
	//隐藏loading
	var hideDrawLoading = function(){
		$("#"+parseLoadingName).remove();
	};

	//private 解析数据
	var parseData = function(jsonData){
		//xy
		for(var j=0;j<jsonData.length;++j)
		{
			for(var i=0;i<jsonData[j].length;++i)
			{
				var item = jsonData[j][i];
				if(typeof(datas[j]) == "undefined")
				{
					datas[j] = new Array();
				}
				if(typeof(datas[j][item['timeoffset']]) == "undefined")
				{
					datas[j][item['timeoffset']] = new Array();
				}
				datas[j][item['timeoffset']][datas[j][item['timeoffset']].length] = item;
			}
		}
		//bgimg
		if(typeof(bgImgList) != "undefined")
		{
			var tmpList = new Array();
			for(var i=0;i<bgImgList.length;++i)
			{
				var item = bgImgList[i];
				if(typeof(item) != "undefined")
				{
					if(typeof(tmpList[item['timeoffset']]) == "undefined")
					{
						tmpList[item['timeoffset']] = new Array();
					}
					tmpList[item['timeoffset']][tmpList[item['timeoffset']].length] = item;
				}
			}
			bgImgList = tmpList;
		}
	};

	//private 加载解析数据
	var getJsonData = function()
	{
		showParseLoading();
		$.ajax({
			type: getJsonDataMethod,
			url: getJsonDataUrl,
			data: getJsonDataSend,
			success: function(msg){
				hideDrawLoading();
				jsonObj=eval('('+msg+')');
				if(typeof(jsonObj['errno']) != "undefined")
				{
					alert("播放数据缺失");
				}
				else
				{
					totalTime = jsonObj[2];
					totalPage = jsonObj[3];
					bgImgList = jsonObj[4];
					document.getElementById(audioName).addEventListener("canplaythrough",sendDrawReadyEvent,false);
					$("#"+audioName).attr("src",jsonObj[5]);
					$("#"+audioName).attr("autoplay","autoplay");
					jsonObj.pop();
					jsonObj.pop();
					jsonObj.pop();
					jsonObj.pop();
					parseData(jsonObj);
				}
			}
		});
	};

	var sendDrawReadyEvent = function(){
			//触发事件 准备开始画
			$(eventObj).trigger("drawReady");
			document.getElementById(audioName).removeEventListener("canplaythrough",sendDrawReadyEvent,false);
	};
	
	//public 获取画的数据	
	exports.datas = function(){
		return datas;
	};

	//public 获取totaltime
	exports.totalTime = function(){
		return totalTime;
	};

	//public 获取totalPage
	exports.totalPage = function(){
		return totalPage;
	};

	//public 获取bgImgList
	exports.bgImgList = function(){
		return bgImgList;
	};

	//public start
	exports.start = function(url){
		getJsonDataUrl = url
		getJsonData();
	};
	
	//public
	exports.eventObj = function(){
		return eventObj;
	};

	//public
	exports.brower = function(){
		if(brower.length  == 2)
		{
			return brower;
		}
		else
		{
			var userAgent = navigator.userAgent.toLowerCase();
			//判断是哪种浏览器
			var browerType = 'chrome';
			browerReg = /^.*Chrome.*$/gi;
			result = browerReg.test(userAgent);
			if(result)
			{
				//chrome
				browerType = "chrome";
			}
			else
			{
				browerReg = /^.*Safari.*$/gi;
				result = browerReg.test(userAgent);
				if(result)
				{
					//Safari
					browerType = "Safari";
				}
				else
				{
					browerReg = /^.*Firefox.*$/gi;
					result = browerReg.test(userAgent);
					if(result)
					{
						//Firefox
						browerType = "Firefox";
					}
					else
					{
						browerReg = /^.*MSIE.*$/gi;
						result = browerReg.test(userAgent);
						if(result)
						{
							//IE
							browerType = "IE";
						}
					}
				}
			}

			var browerReg = /^.*Android.*$/gi;
			var result = browerReg.test(userAgent);
			//判断来自哪个客户端
			var platformType = 'disktop';
			//来自android系统
			if(result)
			{
				platformType = "android";

			}
			brower['browerType'] = browerType;
			brower['platformType'] = platformType;
			return brower;
		}
	};

});
