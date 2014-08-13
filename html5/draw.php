<?php
ini_set("max_execution_time", 60*30);
$flag_id = isset($_REQUEST['flag_id'])?$_REQUEST['flag_id']:'0';
//$flag_id = "167801323";
function curlrequest($url, $data, $method = 'post') {
	$ch = curl_init(); //初始化CURL句柄 
	curl_setopt($ch, CURLOPT_URL, $url); //设置请求的URL
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); //设为TRUE把curl_exec()结果转化为字串，而不是直接输出 
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method); //设置请求方式
	curl_setopt($ch, CURLOPT_HTTPHEADER, array("X-HTTP-Method-Override: $method")); //设置HTTP头信息
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data); //设置提交的字符串

	$document = curl_exec($ch); //执行预定义的CURL 
	if (!curl_errno($ch)) {
		$info = curl_getinfo($ch);
	} else {
	} 
	curl_close($ch);
	return $document;
} 

$url = 'http://115.28.232.58/api/cloudTeaching/playback/playback_data';
$list = array(
	"flag_id"=>$flag_id,
);

ksort($list);
$valid = md5(http_build_query($list));
$list2 = array(
	"token"=>"jjss123987",
	"version"=>"server_v1",
	"valid"=>$valid,
);

$data = http_build_query($list2)."&".http_build_query($list);

$method = "GET";
$getPlayerBackUrl = $url.'?'.$data;
$getPlayerBackUrl = "http://192.168.1.95/html5/parsedata.php";
?>
<!DOCTYPE HTML>
<html>
	<header>
		<meta http-equiv="content-type" content="text/html; charset=utf-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge;chrome" />
		<!--
		<meta name="viewport" content="width=device-width, initial-scale=1"> 
		-->
		<?php echo '<script type="text/javascript">var getPlayDataUrl="'.$getPlayerBackUrl.'";</script>';?>
		<script type="text/javascript" src="./js/jquery-1.11.1.min.js"></script>
		<script type="text/javascript" src="./js/quo.js"></script>
	</header>
	<link rel="stylesheet" href="./css/index.css" />
<body>
	<div id="mainContainer">
	<div id="drawContainer" width = "100%" height="100%" style="border:1px solid #c3c3c3;margin:0 auto;background-color:white;">

		<div id="canvasContainer"></div>

		<div class="pencil" id="pencil"></div>

		<div id="info" class="info">
			<p>暂停</p>
		</div>
		
		<audio id="drawAudio">
		</audio>
	</div>

	<div class="player" id="player">
		<div class="scrubber" id="scrubber">
			<div id="progress" class="progress" style="width: 0%;"></div>
			<div id="loaded" class="loaded" style="width: 100%;"></div>
			<div class="scrubber-track" id="scrubber-track">
				<div id="progressBtn" class="scrubber-draggable progress-tracker" style="left: 0%;"></div>
			</div>
		</div>
		
		<div class="buttons">
			<ul class="play-pause" id="play-pause">
				<li class="play" id="play"><a href="#"></a></li>
				<li class="pause" id="pause"><a href="#"></a></li>
				<li class="warn"></li>
			</ul>

			<ul class="volume-bar">
				<li class="volume volume-on"><a href="#"></a></li>
				<div class="volume-scrubber" id="volume-scrubber">
					<div class="progress" id="volume-progress" style="width: 100%;"></div>
				</div>
			</ul>

			<div class="time" id="time">
				<em class="played" id="time_played">0:00</em>/<strong class="duration" id="time_duration">0:00</strong>
			</div>
			
			
			<!--
			<ul class="fullscreen" id="fullscreen">
				<li class="exit hide"><a href="#exit"></a></li>
				<li class="full"><a href="#full"></a></li>
			</ul>
			-->

			<form class="gotopage" id="gotopage">
				<input type="text" id="page-current" value="1" class="page-current">/<span class="page-total" id="page-total">1</span>
			</form>
			
		</div>
		<div class="player-bg"></div>
		
	</div>
	</div>
	
	<script type="text/javascript" src="./js/sea.js"></script>
	<script>
		
		$(document).ready(function(){
			seajs.config({
				base: "./js/",
			});
			
			seajs.use('draw-main', function(draw) {
				draw.start(getPlayDataUrl);
			});
		});
	</script>

</body>
</html>
