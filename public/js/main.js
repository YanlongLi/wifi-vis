
var DATA_PATH = WifiVis.DATA_PATH;
var apCenter = WifiVis.ApCenter(), 
		recordCenter = WifiVis.RecordCenter(apCenter),
		pathCenter = WifiVis.PathCenter(recordCenter),
		dataHelper = WifiVis.DataHelper,
		FloorsNav = WifiVis.FloorsNav,
		FloorDetail = WifiVis.FloorDetail,
		Timeline = WifiVis.Timeline,
		TimelineBrush = WifiVis.TimelineBrush;
//
var curF = 1;
var floorsNav, floorDetail;
var tlSize, timeline, tlBrush;
var apGraph = WifiVis.ApGraph();

function onEnd(extent){
	var tl = this.timeline,
		shownData = tl.shownData, data = tl.data;
	var e0 = extent[0], e1 = extent[1];
	console.log("on bursh end:", e0, e1);
	/*var records = recordCenter.findRecords(function(r){
		return r.ap.floor == curF
			&& r.dateTime >= e0
			&& r.dateTime <= e1;	
	});*/
	var records = data.filter(function(r){
		return r.dateTime >= e0
			&& r.dateTime <= e1;	
	});
	var pathes = dataHelper.groupRecordsByMac(records)
		.map(dataHelper.removeDuplicateRecords);
	floorDetail.drawPath(pathes);
	// apGraph
	/*
	var allRecords = recordCenter.findAllRecords(function(r){
		return r.dateTime >= e0
			&& r.dateTime <= e1;
	});
	apGraph.draw(allRecords);*/
}

// load aps and records
d3.csv(DATA_PATH+"APS.csv", function(err, _aps){
	err && (console.error(err));
	d3.csv(DATA_PATH+"September/"+"2013-09-02.csv", function(err, _records){
		err && (console.error(err));
		apCenter.init(_aps);
		recordCenter.init(_records);
		pathCenter.init();
		var records = recordCenter.findAllRecords();
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

	var timelineData = recordCenter.findAllRecordsOnFloor(curF);
	timeline = Timeline("#timeline-g",{tid:1}, timelineData)
		.renderTimeline(tlSize, "rgb(255, 127, 14)");
	// tlBrush
	tlBrush = TimelineBrush(timeline).onBrushEnd(onEnd);
	// floor detail
	var recs = recordCenter.findAllRecordsOnFloor(curF);
	var pathes = dataHelper.groupRecordsByMac(recs)
		.map(dataHelper.removeDuplicateRecords);
	floorDetail.drawPath(pathes);
	// apGraph
	var allRecords = recordCenter.findAllRecords();
	apGraph.draw(allRecords);
}
