
var DATA_PATH = WifiVis.DATA_PATH;
var dataCenter = WifiVis.DataCenter("all-data"), 
		FloorsNav = WifiVis.FloorsNav,
		FloorDetail = WifiVis.FloorDetail;

// load aps and records
d3.csv(DATA_PATH+"APS.csv", function(err, _aps){
	err && (utils.error(err));
	d3.csv(DATA_PATH+"September/"+"2013-09-01.csv", function(err, _records){
		err && (utils.error(err));
		dataCenter.init(_aps, _records);
		init();
	});
});

function init(){
	var floorsNav = FloorsNav("#floor-wrapper");
	//
	var floorDetail = FloorDetail("#floor-detail-wrapper", 1);
	//
	var tlSize = utils.getSize("#timeline-wrapper-inner");
	var svg = d3.select("#timeline-wrapper-inner").select("svg")
		.attr("width", tlSize.width()).attr("height", tlSize.height());
	var gTimeline =	svg.append("g").attr("class", "timeline");
	var timelineData = dataCenter.find_records({floors:[1]});
	//
	var _tlG = utils.initSVG("#timeline-wrapper-inner", [20, 40]);
	var tlSize = {width: _tlG.w, height: _tlG.h};
	_tlG.g.attr("id","timeline-g");
	var timeline = Timeline(timelineData,"#timeline-g",{tid:1});
	timeline.renderTimeline(tlSize, "#1C98F3");
	var tlBrush = TimelineBrush(timeline).onBrushEnd(onEnd);
	function onEnd(extent){
		var tl = this.timeline, shownData = tl.shownData;
		
	}
}
