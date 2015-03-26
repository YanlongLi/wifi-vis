var currentZIndex = 100;
var timeFrom = new Date(2013,8,2),
		timeTo   = new Date(2013,8,3);
var db = new WFV_DB(timeFrom, timeTo);

var apLst = [], apMap = d3.map(), macMap;
var records = [];

var tracer = new RecordTracer();
var db_tl = new WFV_TL_DATA();

var floor_bar = WFV.FloorBar([timeFrom, timeTo]);

var floorDetail, floorsNav, timeline;
var apGraph, deviceGraph, controllerView;
var deviceView, apView;
var deviceStats;
var loading_tip = loading_tip || {};

$(document).ready(function() {
	//init UI
	$('.dragbox')
		.each(function(){
			var _this = this;
			$(this).find(".header")
				.dblclick(function(){
					$(_this).find('.dragbox-content').toggle("normal");
					$(_this).toggleClass("dragbox-collapse");
				})
		});
	$( ".dragbox" ).draggable({ 
		handle: ".header",
		start: function() {
			$(this).css("z-index", currentZIndex++);
		}
	}).resizable({
        start: function() {
            $(this).css("z-index", currentZIndex++);
        }
    });

    $("#controller-button").click(function() {
        $(this).toggleClass("active");
        $("#controller-wrapper").toggle();
    })
})

db.init(function(){ 
  apLst = db.aps;
  apMap = db.apMap;
	macMap = db.macIdByMac;
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
	tracer.init(records, apLst);
	db_tl.init(db.dateFrom, db.dateTo, tracer, 10);
	
	floorDetail = WFV.FloorDetail();
	timeline = WFV.Timeline([timeFrom, timeTo]);
	// apGraph
	apGraph = WifiVis.ApGraph();
	apGraph.init();
	apGraph.draw(); 
	// deviceGrpah
	deviceGraph = WifiVis.DeviceGraph();
	deviceGraph.init();

	deviceView = WFV.DeviceView();
	//deviceView.draw();
	apView = WFV.ApView();
	// floorDetail.addFloorChangeListener(apGraph);
	// floorDetail.addEventListener(floorDetail.EventType.AP_CLICK, apGraph);
	// floorDetail.addEventListener(floorDetail.EventType.AP_MOUSE_ENTER, apGraph);
	// floorDetail.addEventListener(floorDetail.EventType.AP_MOUSE_LEAVE, apGraph); 
	// tlBrush.addEventListener(tlBrush.EventType.EVENT_BRUSH_END, apGraph);
	// apGraph.addEventListener(apGraph.EventType.AP_CLICK, floorDetail);
	// //
	// timeline.update();
	//apGraph.draw(); 
	deviceStats = WFV.DeviceStats();
	//
	apStats = WFV.ApStats();
	//
	EventManager.floorChange(1);
    controllerView = WFV.ControllerView();
    controllerView.init();
	//
	EventManager.timePointChange(new Date(2013,08,02,12));

}
