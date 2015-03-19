var currentZIndex = 100;
var timeFrom = new Date(2013,8,2),
		timeTo   = new Date(2013,8,3);
var db = new WFV_DB(timeFrom, timeTo);

var apLst = [], apMap = d3.map(), macMap;
var records = [];

var tracer;

var floor_bar = WFV.FloorBar([timeFrom, timeTo]);

var floorDetail, floorsNav, timeline;
var apGraph, deviceGraph, controllerView;
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
	tracer = RecordTracer.CreateTracer();
	floorDetail = WFV.FloorDetail();
	timeline = WFV.Timeline([timeFrom, timeTo]);
	//EventManager.timeRangeChanged([new Date(2013,08,02,12), new Date(2013,08,02,16)]);
	EventManager.timePointChange(new Date(2013,08,02,12));
	EventManager.floorChange(1);
	// apGraph
	apGraph = WifiVis.ApGraph();
	apGraph.init();
	// deviceGrpah
	deviceGraph = WifiVis.DeviceGraph();
	deviceGraph.init();

	deviceView = WFV.DeviceView();
	//nlDeviceView = WFV.NlDeviceView();
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
	apGraph.draw(); 

    controllerView = WFV.ControllerView();
    controllerView.init()

}