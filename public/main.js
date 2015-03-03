
var timeFrom = new Date(2013,8,2),
		timeTo   = new Date(2013,8,3);
var db = new WFV_DB(timeFrom, timeTo);

var apLst = [], apMap = d3.map();
var records = [];

var tracer;

var floor_bar = WFV.FloorBar();

var floorDetail, floorsNav, timeline;
var apGraph;

var loading_tip = loading_tip || {};

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

	// add cluster to aps and add floor to records
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
});

function init(){
	//tracer = RecordTracer.CreateTracer();
	//floorDetail = WFV.FloorDetail();
	timeline = WFV.Timeline([timeFrom, timeTo]);
	ObserverManager.post(WFV.Message1.TimeRangeChange,
			{range:[new Date(2013,08,02,12), new Date(2013,08,02,16)]});
	ObserverManager.post(WFV.Message1.TimePointChange, {time:new Date(2013,08,02,12)});
	ObserverManager.post(WFV.Message1.FloorChange, {floor:1});
	/*
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
	*/
	// apGraph
	apGraph = WifiVis.ApGraph();
	apGraph.init();
	// floorDetail.addFloorChangeListener(apGraph);
	// floorDetail.addEventListener(floorDetail.EventType.AP_CLICK, apGraph);
	// floorDetail.addEventListener(floorDetail.EventType.AP_MOUSE_ENTER, apGraph);
	// floorDetail.addEventListener(floorDetail.EventType.AP_MOUSE_LEAVE, apGraph); 
	// tlBrush.addEventListener(tlBrush.EventType.EVENT_BRUSH_END, apGraph);
	// apGraph.addEventListener(apGraph.EventType.AP_CLICK, floorDetail);
	// //
	// timeline.update();
	apGraph.draw(); 
}

/*
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
}*/
