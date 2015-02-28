var WFV = {};

var WifiVis = WFV;

WFV.Message = {
	FloorChange     : "FloorChange"     , //{floor  : }

	ApSelect        : "ApSelect"        , //{apid   : []}
	ApDeSelect      : "ApDeSelect"      , //{apid   : []}

	DeviceSelect    : "DeviceSelect"    , //{device : []}
	DeviceDeSelect  : "DeviceDeSelect"  , //{device : []}

	PathSelect   : "PathSelect"   , // {sid , tid , weight}
	PathDeSelect : "PathDeSelect" , // {sid , tid , weight}

	TimePointChange : "TimePointChange" , //{time   : }
	TimeRangeChange : "TimeRangeChange"  //{range  : []}
};

ObserverManager.setMessageCollection((function(){
	var collection = [];
	for(key in WFV.Message){
		collection.push(WFV.Message[key]);
	}
	console.log(collection);
	return collection;
}()));

WFV.AP_COLOR = (function(){
	var colors = [
		"#B28A00", "#B2AE00", "#42B200",
		"#00B22B", "#00B28C", "#0077B2"];
	return d3.scale.ordinal().range(colors);
})();


WFV.NUM_FLOOR = 17;
WFV.DATA_PATH = "data/";
WFV.FLOOR_IMG_SIZE = [
	[0,0], [1003,519], [680,698], [680,700], [1001,510], [1000,509],
	[1000,507], [997,828], [894,902], [1002,505], [1000,511],
	[996,510], [998,506], [998,508], [1000,507], [879,1064],
	[798,800], [999,995]];
