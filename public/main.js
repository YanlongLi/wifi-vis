var params = (function(){
	var queryString = window.location.search.substring(1);
	if(queryString.length < 16) return {}
	queryString = queryString.slice(0, queryString.length-1);
	var params = {};
	var keyValue = queryString.split("&").map(function(d){return d.split("=")}).forEach(function(d){
		params[d[0]] = d[1];
	});
	var format = d3.time.format("%Y%m%d");
	for(attr in params){
		params[attr] = format.parse(params[attr]);
	}
	console.log("params", params.from);
	console.log("params", params.to);
	return params;
})();

var currentZIndex = 100;
var timeFrom = params.from || new Date(2013,8,2),
		timeTo   = params.to || new Date(2013,8,3);
var db = new WFV_DB(timeFrom, timeTo);

var apLst = [], apMap = d3.map(), macMap;
var records = [];

var tracer = new RecordTracer();
var db_tl = new WFV_TL_DATA();

var floor_bar = WFV.FloorBar([timeFrom, timeTo]);
var floor_bar_floor_aps = WFV.FloorBarFloorAps([timeFrom, timeTo]);
var floor_bar_sel_aps = WFV.FloorBarSelAps([timeFrom, timeTo]);

var floorDetail, floorsNav, timeline;
var apGraph, deviceGraph, controllerView;
var deviceView, apView;
var deviceStats;
var loading_tip = loading_tip || {};

var spinner = utils.createSpinner(10,10);
spinner.spin($("#mask").get(0));

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
	//
	tracer.init(records, apLst);
	db_tl.init(db.dateFrom, db.dateTo, tracer, 10);
	//
	apStats = WFV.ApStats(timeFrom, timeTo);
	//
	init();
});
 

function init(){
	
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
	// deviceView.draw();
	apView = WFV.ApView();
	//
	deviceStats = WFV.DeviceStats();
	//
	EventManager.floorChange(1);
    controllerView = WFV.ControllerView();
    controllerView.init();
	//
	EventManager.timePointChange(new Date(2013,08,02,12));
  loading_tip.add_tip("done");
	spinner.stop();
	setTimeout(function(){
    $("#mask").css("visibility", "hidden");
    $("#timeline-option-bar").css("visibility", "hidden");
  }, 1000);
}
