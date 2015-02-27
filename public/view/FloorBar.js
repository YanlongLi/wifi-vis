WFV.FloorBar = function(){
	function FloorBar(){}
	// variables
	var wrapper = $("#floor-bar-wrapper"),
		svg = $("#floor-bar-wrapper > svg");
	d3.select("#floor-bar-wrapper > svg")
		.attr("width", "100%").attr("height", "100%");
	var g = d3.select("#floor-bar"), size;
	var per_h;
	
	//
	var selected_ap = [], current_floor;
	var time_range, time_point;
	//
	init_svg();
	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [20]);
		per_h = size.height / 17;
		g.selectAll("#floor-bar-aps, #floor-bar-tls")
			.attr("transform", "translate("+per_h+")");
		var floors = g.select("#floor-bar-circles")
			.selectAll(".floor").data(d3.range(1,18));
		var floors_enter = floors.enter().append("g").attr("class","floor");
		floors_enter.append("circle");
		floors_enter.append("text");
		floors.attr("transform", function(d,i){
			var dy = per_h * i;
			return "translate(0,"+dy+")";
		});
		floors.select("circle").attr("r", per_h/2 - 1)
			.attr("cx", per_h/2).attr("cy", per_h/2);
		floors.select("text").text(function(d){return d});
		floors.exit().remove();
	}
	// change view between tls and ap bars
	function change_view(){
		// TODO
	}
	//
	function change_time_range(range, time){
		time_range = range;
		// TODO
		// update_ap_bars(), update_floor_tls()
	}

	function chagne_time_point(time){
		time_point = time;
	}
	function update_floor_circle(_data){
		
	}
	function update_ap_bars(_data){
		// []

	}
	function upate_floor_tls(_data){

	}
	$(window).resize(function(e){
		init_svg();
	});

	return FloorBar;
}
