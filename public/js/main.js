var timeFrom = new Date(2013,8,2),
		timeTo   = new Date(2013,8,3);
var loading_tip = loading_tip || {};

var db = new WFV_DB(timeFrom, timeTo);

var apLst = [], apMap = d3.map();
var records = [];

db.init(function(){ 
	apLst = db.aps;
	apMap = db.apMap;
	records = db.records;
	init_aplst_records();
	loading_tip.add_tip("done");
	setTimeout(function(){
		$("#mask").css("visibility", "hidden");
		$("#timeline-option-bar").css("visibility", "hidden");
		init();
	}, 500);
});


var curF = 1;
var tracer;
var floorDetail, floorsNav;
var tlSize, timeline, tlBrush;
var apGraph;


// after get apLst and records

function init(){
	// init floorsNav
	// floorsNav = WifiVis.FloorsNav("#floor-wrapper");
	// init recordTracer and floorDetail
	tracer = RecordTracer.CreateTracer();
	floorDetail = WifiVis.FloorDetail("#floor-detail-wrapper", curF);
	//
	// init timeline
	tlSize = utils.getSize("#timeline-wrapper-inner");
	var svg = d3.select("#timeline-wrapper-inner > svg")
		.attr("width", tlSize.width()).attr("height", tlSize.height());
	var _tlG = utils.initSVG("#timeline-wrapper-inner", [20, 40, 20, 80]);
	_tlG.g.attr("id","timeline-g");
	tlSize = {width: _tlG.w, height: _tlG.h};
	// TODO
	timeline = WifiVis.Timeline("#timeline-g",{tid:1});
	timeline.set_size(tlSize);
	floorDetail.addFloorChangeListener(timeline);
	floorDetail.addEventListener(floorDetail.EventType.AP_CLICK, timeline);
	// brush
	tlBrush = WifiVis.TimelineBrush(timeline)
		.onBrushMove(onMove)
		.onBrushEnd(onEnd);
	// apGraph
	apGraph = WifiVis.ApGraph();
	floorDetail.addFloorChangeListener(apGraph);
	floorDetail.addEventListener(floorDetail.EventType.AP_CLICK, apGraph);
	floorDetail.addEventListener(floorDetail.EventType.AP_MOUSE_ENTER, apGraph);
	floorDetail.addEventListener(floorDetail.EventType.AP_MOUSE_LEAVE, apGraph); 
	tlBrush.addEventListener(tlBrush.EventType.EVENT_BRUSH_END, apGraph);
	apGraph.addEventListener(apGraph.EventType.AP_CLICK, floorDetail);
	//
	//tracer.gotoTime((timeFrom.getTime()+timeTo.getTime())/2);
	//floorDetail.update_links([timeFrom.getTime(),timeTo.getTime()]);
	//floorDetail.hide_links();
	//floorDetail.update_ap_device(apLst);
	timeline.update();
	apGraph.draw();
	floorDetail.set_init_floor();
}

function init_aplst_records(){
	apLst.forEach(function(ap){
		ap.cluster = new DeviceCluster(ap.apid);
		apMap.set(ap.apid, ap);
	});
	records.forEach(function(r,i){r.index = i});
	records.forEach(function(r){
		r.floor = apMap.get(r.apid).floor;
	})
}

function onStart(extent){
}
function onMove(extent){
	var tl = this.timeline,
		shownData = tl.shownData, data = tl.data;
	var e0 = extent[0], e1 = extent[1];
	tracer.gotoTime(new Date(e0));
	floorDetail.update_ap_device(apLst);
	//floorDetail.update_links([e0, e1]);
}
function onEnd(extent){
	var tl = this.timeline,
		shownData = tl.shownData, data = tl.data;
	var e0 = extent[0], e1 = extent[1];
	console.log("on bursh end:", e0, e1);
	tracer.gotoTime(new Date(e0));
	floorDetail.update_ap_device(apLst);
	floorDetail.update_links([e0, e1]);
	// apGraph
	/*
	var allRecords = recordCenter.findAllRecords(function(r){
		return r.dateTime >= e0
			&& r.dateTime <= e1;
	});
	apGraph.draw(allRecords);*/
}


// var timelineData = recordCenter.findAllRecordsOnFloor(curF);
// timeline = Timeline("#timeline-g",{tid:1}, timelineData)
// .renderTimeline(tlSize, "rgb(255, 127, 14)");
