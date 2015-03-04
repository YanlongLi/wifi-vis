WFV.Timeline = function(_time_range){
	function Timeline(){}
	//
	var svg = $("#timeline-svg"), size;
	var g = d3.select("#timeline-g").attr("class", "timeline");
	// TODO to change scale
	g.select("#timeline-btn-scale")
		.attr("class", "timeline-btn-scale")
		.attr("width", 30).attr("height", 15);
	//
	var all_time_range = _time_range, time_range, time_point; 
	console.log(all_time_range);
	var x = d3.time.scale().domain(all_time_range);
	var ys = d3.range(0,3).map(function(){
		return d3.scale.linear().range([0,10]);
	}),y = ys[0];
	var floor_max_count = d3.map(), ap_max_count = d3.map();
	var xAxis = d3.svg.axis().scale(x).orient("bottom")
		.tickSize(2,0,4).tickSubdivide(0);
		//.tickFormat(function(d){return new Date(d).to_24_str()});
	var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5)
		.tickFormat(d3.format(",.0f"));
	var line = d3.svg.line().interpolate("monotone")
			.x(function(d){return x(d.time)})
			.y(function(d){return y(d.count)});
	var brush = d3.svg.brush().x(x)
		.on("brushstart", onBrushStart)
		.on("brush", onBrushMove)
		.on("brushend", onBrushEnd);
	function onBrushStart(){
		console.log("brush start");
	}
	function onBrushMove(e){
		time_range  = d3.event.target.extent();
		if(time_point - time_range[0] != 0){
			time_point = time_range[0];
			ObserverManager.post(WFV.Message1.TimePointChange, {time: time_point});
		}
		ObserverManager.post(WFV.Message1.TimeRangeChange, {range: time_range});
	}
	function onBrushEnd(){
		if(!d3.event.sourceEvent) return;
		var range = d3.event.target.extent();
		var step = TIME_STEP[step_by] * step_count;
		if(brush.empty() || range[1] - range[0] < step){
			range = all_time_range;
		}
		time_range = range;
		ObserverManager.post(WFV.Message1.TimeRangeChanged, {range: time_range});
	}
	//
	var current_floor, sel_aps, 
		floor_data_status = d3.range(0,18).map(function(){return false});
	//
	var step_by = "minute", step_count = 20;
	var TIME_STEP = WFV.TIME_STEP;
	var TIMELINE_TYPE = {
		all: "timeline_type_all",
		floor: "timeline_type_floor",
		ap: "timeline_type_ap"
	}

	init_svg();
	init_interaction();

	(function(){// append 1-17 floor lines, init invisible
		var fls = g.select("#timeline-floor")
			.selectAll("g.line").data(d3.range(1,18));
		fls.enter().append("g").attr("class", "line").append("path");
		fls.attr("floor", function(d){return d})
			.attr("id", function(d){return "tl-floor-"+d})
			.attr("display", "none");
		d3.range(1,18).forEach(_show_floor);
	})();

	g.select("#timeline-basic").attr("class", "line").append("path");
	_timeline_data(TIMELINE_TYPE.all, null, update_basic_timeline);
	
	ObserverManager.post(WFV.Message1.TimeRangeChanged, {range: all_time_range});

	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [10, 50, 20, 50]);
		x.range([0, size.width]).nice();
		ys[0].range([size.height, 0]).nice();
		ys[1].range([size.height, 0]).nice();
		ys[2].range([size.height, 0]).nice();
		g.select("#x-axis").attr("class", "x axis")
			.attr("transform", "translate(0,"+size.height+")")
			.call(xAxis);
		g.select("#y-axis").attr("class", "y axis")
			.attr("transform", "translate(0,0)")
			.call(yAxis);
		//
		g.select("#brush").attr("class", "brush")
			.call(brush).selectAll("rect").attr("height", size.height);
		//
		var btn_scale_dx = size.width;
		g.select("#timeline-btn-scale")
			.attr("transform", "translate("+btn_scale_dx+")");
	}
	//
	ObserverManager.addListener(Timeline);
	Timeline.OMListen = function(message, data){
		if(message == WFV.Message1.FloorChange){
			console.log("timeline on floor change", data.floor)
			current_floor = +data.floor;
			g.select("#timeline-floor")
				.selectAll(" g.line").style("display", "none")
				.classed("cur", false);
			g.select("#tl-floor-"+current_floor).style("display","block")
				.classed("cur", true);
			_show_floor(current_floor, true);
		}
		if(message == WFV.Message1.FloorSelect){
			var floors = data.floor;
			floors.forEach(function(floor){
				if(floor == current_floor) return;
				_show_floor(floor, true);
			});
		}
		if(message == WFV.Message1.FloorDeSelect){
			console.log("timeline onfloor deselect", data.floor);
			var floors = data.floor;
			floors.forEach(function(floor){
				if(floor == current_floor) return;
				_show_floor(floor, false);
			});
		}
		if(message == WFV.Message1.ApSelect){
			var apids = data.apid;
			apids.forEach(function(apid){
				if(ap_max_count.get(apid)){
					g.select("#timeline-ap-"+apid).style("display","block");
				}else{
					_timeline_data(TIMELINE_TYPE.ap, apid, update_ap_timeline);
				}
			});
		}
		if(message == WFV.Message1.ApDeSelect){
			var apids = data.apid;
			console.log("timeline on ap deselect", apids, ap_max_count.values());
			apids.forEach(function(apid){
				// console.log(apid, ap_max_count.keys());
				if(ap_max_count.get(apid)){
					g.select("#timeline-ap-"+apid).style("display","none");
					//$("#timeline-ap-"+apid).css("opacity",0);
				}
			});
		}
		if(message == WFV.Message1.TimePointChange){
			// TODO
		}
		if(message == WFV.Message1.TimeRangeChange){
			// TODO	
		}
	}
	function init_interaction(){
		// TODO
		$(document).on("click","#timeline-btn-scale", function(e){
			console.log("clicked");
			change_scale();
		});
	}
	$(window).resize(function(e){
		init_svg();
		update_basic_timeline();
		update_floor_timeline();
		update_ap_timeline();
	});
	var scale_type = (function(){
		var type = 0;
		return function(_type){
			if(undefined == _type || _type < 0 || _type > 2){
				return (type++) % 3;
			}else{
				return (type = _type);
			}
		};
	})();
	function change_scale(_type){
		// type:0,all; 1:floor; 2:ap
		var type = scale_type(_type);
		console.log("change scale", type);
		y = ys[type];
		d3.select("#timeline-basic")
			.style("display", type <= 0 ? "block":"none");
		d3.select("#timeline-floor")
			.style("display", type <= 1 ? "block":"none");
		d3.select("#timeline-ap").style("display","block");
		/*
		d3.select("#timeline-basic")
			.style("visibility", type <= 0 ? "visible":"hidden");
		d3.select("#timeline-floor")
			.style("visibility", type <= 1 ? "visible":"hidden");
		d3.select("#timeline-ap").style("visibility","visible");*/
		yAxis.scale(y);
		// TODO
  	line = d3.svg.line().interpolate("monotone")
			.x(function(d){return x(d.time)})
			.y(function(d){return y(d.count)});
		init_svg();
		update_basic_timeline();
		update_floor_timeline();
		update_ap_timeline();
	}
	//
	function update_basic_timeline(_data){
		// {time:[],count:[];,values:[]}
		// if no _data, update
		var tl = g.select("#timeline-basic").select("path");
		if(_data){
			ys[0].domain([0, d3.max(_data,function(d){return d.count})]).nice();
			g.select("#y-axis").call(yAxis);
			tl.datum(_data);
		}
		tl.attr("d", line)
	}
	function update_ap_timeline(_data){
		// [{time:,count;,values:[]}].apid:
		// if _data, add; no _data, update
		if(_data){
			var cmax = d3.max(_data, function(d){return d.count});
			ap_max_count.set(_data.apid, cmax);
			ys[2].domain([0, d3.max(ap_max_count.values())]).nice();
			g.select("#y-axis").call(yAxis.scale(y));
			var tl = d3.select("#timeline-ap")
				.append("g").attr("class","line").datum(_data)
				.attr("apid", function(d){return d.apid})
				.attr("id", function(d){return "timeline-ap-"+d.apid});
			tl.append("path").datum(function(d){return d})
				.attr("d", line);
		}else{
			var tl = d3.select("#timeline-ap").selectAll("g.line");
			var lines = tl.select("path").attr("d", line);
		}
	}
	function _show_floor(floor, b){
		// load floor data and draw path, 
		// not change visibility
		if(b && !floor_data_status[floor]){
			_timeline_data(TIMELINE_TYPE.floor, floor, update_floor_timeline);
		}
		//g.select("#tl-floor-"+floor).style("display", b ? "block" : "none");
	}
	function update_floor_timeline(_data){
		// {time:,count;,values:[],floor:}
		// if _data, add; no _data, update
		if(_data){
			var cmax = d3.max(_data, function(d){return d.count});
			console.log("update_floor_timeline", _data.floor);
			floor_max_count.set(_data.floor, cmax);
			console.log("update_floor_timeline, floor_max_count",
					floor_max_count.values());
			ys[1].domain([0, d3.max(floor_max_count.values())]).nice();
			g.select("#y-axis").call(yAxis.scale(y));
			//
			var tl = d3.select("#timeline-floor")
				.select("#tl-floor-"+_data.floor).datum(_data);
			tl.select("path").datum(function(d){return d})
				.attr("d", line);
			//
			floor_data_status[_data.floor] = true;
		}else{
			var tl = d3.select("#timeline-floor").selectAll("g.line");
			var lines = tl.select("path").attr("d", line);
		}
	}
	/*
	 * help function
	 */
	function _timeline_data(type, id, cb){
		// type
		// 0: total records, 1: by floor, 2: by apid
		var step      = TIME_STEP[step_by] * step_count;
		var from = all_time_range[0], to = all_time_range[1];
		if(type == TIMELINE_TYPE.all){
			db.tl_data_all(from, to, step, cb);	
		}else if(type == TIMELINE_TYPE.floor){
			var floor     = id;
			db.tl_data_floor(from, to, step, floor, cb);
		}else if(type == TIMELINE_TYPE.ap){
			var apid = id;
			db.tl_data_ap(from, to, step, apid, cb);
		}else{
			console.warn("unkonw timeline type");
		}
	}
	return Timeline;
}
