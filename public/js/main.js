
var DATA_PATH = WifiVis.DATA_PATH;
var dataCenter = WifiVis.DataCenter("all-data"), 
		pathDataCenter = WifiVis.PathDataCenter("path-data"),
		FloorsNav = WifiVis.FloorsNav,
		FloorDetail = WifiVis.FloorDetail,
		Timeline = WifiVis.Timeline,
		TimelineBrush = WifiVis.TimelineBrush;
//
var curF = 1;
var floorsNav, floorDetail;
var tlSize, timeline, tlBrush;

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
	floorsNav = WifiVis.FloorsNav("#floor-wrapper");
	floorDetail = WifiVis.FloorDetail("#floor-detail-wrapper", curF);
	// timeline
	tlSize = utils.getSize("#timeline-wrapper-inner");
	var svg = d3.select("#timeline-wrapper-inner").select("svg")
		.attr("width", tlSize.width()).attr("height", tlSize.height());
	var gTimeline =	svg.append("g").attr("class", "timeline");
	var _tlG = utils.initSVG("#timeline-wrapper-inner", [20, 40]);
	tlSize = {width: _tlG.w, height: _tlG.h};
	_tlG.g.attr("id","timeline-g");

	var timelineData = dataCenter.find_records({floors:[curF]});
	timeline = Timeline("#timeline-g",{tid:1}, timelineData)
		.renderTimeline(tlSize, "#1C98F3");
	// tlBrush
	tlBrush = TimelineBrush(timeline).onBrushEnd(onEnd);
	// floor detail
	var recs = dataCenter.find_records({floors:[curF]});
	var rMaps = pathDataCenter.groupByMac(recs);
	floorDetail.drawPath(rMaps.values());
}
