
var DATA_PATH = WifiVis.DATA_PATH;
var dataCenter = WifiVis.DataCenter("all-data"), 
		pathDataCenter = WifiVis.PathDataCenter("path-data"),
		FloorsNav = WifiVis.FloorsNav,
		FloorDetail = WifiVis.FloorDetail;
var curF = 1;

// load aps and records
d3.csv(DATA_PATH+"APS.csv", function(err, _aps){
	err && (utils.error(err));
	d3.csv(DATA_PATH+"September/"+"2013-09-02.csv", function(err, _records){
		err && (utils.error(err));
		dataCenter.init(_aps, _records);
		var records = dataCenter.find_records();
		pathDataCenter.init(records);
		init();
	});
});

function init(){
	var floorsNav = WifiVis.FloorsNav("#floor-wrapper");
	//
	var floorDetail = WifiVis.FloorDetail("#floor-detail-wrapper", curF);
	//
	var tlSize = utils.getSize("#timeline-wrapper-inner");
	var svg = d3.select("#timeline-wrapper-inner").select("svg")
		.attr("width", tlSize.width()).attr("height", tlSize.height());
	var gTimeline =	svg.append("g").attr("class", "timeline");
	var timelineData = dataCenter.find_records({floors:[curF]});
	//
	var _tlG = utils.initSVG("#timeline-wrapper-inner", [20, 40]);
	var tlSize = {width: _tlG.w, height: _tlG.h};
	_tlG.g.attr("id","timeline-g");
	var timeline = Timeline(timelineData,"#timeline-g",{tid:1});
	timeline.renderTimeline(tlSize, "#1C98F3");
	var tlBrush = TimelineBrush(timeline).onBrushEnd(onEnd);
	function onEnd(extent){
		var tl = this.timeline, shownData = tl.shownData;
		var e0 = extent[0], e1 = extent[1];
		utils.log(["on bursh end:", e0, e1]);
		var recs = dataCenter.find_records({floors:[curF], recordFilter: function(r){
			return r.dateTime >= e0 && r.dateTime <= e1;	
		}});
		var rMap = pathDataCenter.groupByMac(recs);
		floorDetail.drawPath(rMap.values());
	}
}
