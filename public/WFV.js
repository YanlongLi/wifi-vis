var WFV = {};

var WifiVis = WFV;

WFV.Message = {
	FloorChange      : "FloorChange"      , //{floor  : }
	FloorSelect      : "FloorSelect"      , //{floor: [], change:[], isAdd: bool}
	FloorHover       : "FloorHover"    , //{floor: [], change:[], isAdd: bool}

	ApSelect         : "ApSelect"         , //{apid: [], change:[], isAdd: bool}
	ApHover          : "ApHover"          , //{apid: [], change:[], isAdd: bool}

	DeviceSelect     : "DeviceSelect"     , //{device : [], change:[], isAdd: bool}
	DeviceHover      : "DeviceHover"   , //{device : [], change:[], isAdd: bool}

	PathSelect       : "PathSelect"       , // {sid   , tid , weight}
	PathDeSelect     : "PathDeselect"     , // {sid   , tid , weight}

	TimePointChange  : "TimePointChange"  , //{time   : }
	TimeRangeChange  : "TimeRangeChange"  , //{range  : []}
	TimeRangeChanged : "TimeRangeChanged" , //{range  : []}
};


ObserverManager.setMessageCollection((function(){
	var collection = [];
	for(key in WFV.Message1){
		collection.push(WFV.Message1[key]);
	}
	for(key in WFV.Message){
		collection.push(WFV.Message[key]);
	}
	console.log(collection);
	return collection;
}()));

WFV.TIME_STEP = {
	second : 1000,
	minute : 60*1000,
	hour   : 60*60*1000,
	day    : 60*60*24*1000
};


WFV.DATA_PATH = function(){return "data/"};
WFV.NUM_FLOOR = 17;
WFV.FLOOR_IMG_SIZE = [
	[0,0], [1003,519], [680,698], [680,700], [1001,510], [1000,509],
	[1000,507], [997,828], [894,902], [1002,505], [1000,511],
	[996,510], [998,506], [998,508], [1000,507], [879,1064],
	[798,800], [999,995]];

WFV.VIR_AP_POS = [
	[[0 , 0] , [1003 , 0] , [0 , 519]  , [1003 , 519]]  ,
	[[0 , 0] , [680  , 0] , [0 , 698]  , [680  , 698]]  ,
	[[0 , 0] , [680  , 0] , [0 , 700]  , [680  , 700]]  ,
	[[0 , 0] , [1001 , 0] , [0 , 510]  , [1001 , 510]]  ,
	[[0 , 0] , [1000 , 0] , [0 , 509]  , [1000 , 509]]  ,
	[[0 , 0] , [1000 , 0] , [0 , 507]  , [1000 , 507]]  ,
	[[0 , 0] , [997  , 0] , [0 , 828]  , [997  , 828]]  ,
	[[0 , 0] , [894  , 0] , [0 , 902]  , [894  , 902]]  ,
	[[0 , 0] , [1002 , 0] , [0 , 505]  , [1002 , 505]]  ,
	[[0 , 0] , [1000 , 0] , [0 , 511]  , [1000 , 511]]  ,
	[[0 , 0] , [996  , 0] , [0 , 510]  , [996  , 510]]  ,
	[[0 , 0] , [998  , 0] , [0 , 506]  , [998  , 506]]  ,
	[[0 , 0] , [998  , 0] , [0 , 508]  , [998  , 508]]  ,
	[[0 , 0] , [1000 , 0] , [0 , 507]  , [1000 , 507]]  ,
	[[0 , 0] , [879  , 0] , [0 , 1064] , [879  , 1064]] ,
	[[0 , 0] , [798  , 0] , [0 , 800]  , [798  , 800]]  ,
	[[0 , 0] , [999  , 0] , [0 , 995]  , [999  , 995]]
];
