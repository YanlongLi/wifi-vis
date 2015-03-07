WFV.Timeline = function(_time_range){
	function Timeline(){}
	//
	var floor_color = ColorScheme.floor;
	var svg = $("#timeline-svg"), size;
	var g = d3.select("#timeline-g").attr("class", "timeline");
	// TODO to change scale
	g.select("#timeline-btn-scale")
		.attr("class", "timeline-btn-scale")
		.attr("width", 30).attr("height", 15);
	//
	var all_time_range = _time_range, time_range = _time_range, time_point = _time_range[0]; 
	console.log(all_time_range);
	var x = d3.time.scale().domain(all_time_range);
	var ys = d3.range(0,3).map(function(){
		return d3.scale.linear().range([0,10]).domain([0,1]);
	}),y = ys[1];
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
			EventManager.timePointChange(time_point);
		}
		EventManager.timeRangeChange(time_range);
	}
	function onBrushEnd(){
		if(!d3.event.sourceEvent) return;
		var range = d3.event.target.extent();
		var step = TIME_STEP[step_by] * step_count;
		if(brush.empty() || range[1] - range[0] < step){
			range = all_time_range;
		}
		time_range = range;
		EventManager.timeRangeChanged(time_range);
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
	//change_scale(1);

	(function(){// append 1-17 floor lines, init invisible
		var fls = g.select("#timeline-floor")
			.selectAll("g.line").data(d3.range(1,18).map(function(d){return {floor:d}}));
		fls.enter().append("g").attr("class", "line").append("path");
		fls.attr("floor", function(d){return d.floor})
			.each(function(d){
				d3.select(this).classed("floor-" + d.floor, true);
			});
		d3.range(1,18).forEach(function(f){_load_floor(f,true)});
	})();

	g.select("#timeline-basic").attr("class", "line").append("path");
	_timeline_data(TIMELINE_TYPE.all, null, update_basic_timeline);
	
	EventManager.timeRangeChanged(all_time_range);

	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [10, 50, 20, 50]);
		x.domain(all_time_range).range([0, size.width]).nice();
		ys[0].range([size.height, 0]).nice();
		ys[1].range([size.height, 0]).nice();
		ys[2].range([size.height, 0]).nice();
		// update axis
		g.select("#x-axis").attr("class", "x axis")
			.attr("transform", "translate(0,"+size.height+")")
			.call(xAxis);
		g.select("#y-axis").attr("class", "y axis")
			.attr("transform", "translate(0,0)")
			.call(yAxis);
  	line = line.x(function(d){return x(d.time)})
			.y(function(d){return y(d.count)});
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
		// floor
		if(message == WFV.Message.FloorChange){
			console.log("timeline on floor change", data.floor)
			current_floor = +data.floor;
			$("#timeline-floor g.line").removeClass("current");
			$("#timeline-floor g.line[floor="+current_floor+"]").addClass("current");
			// when change floor, only show floor timeline, ap timeline remove by ApSelect
			change_scale(3);
			_load_floor(current_floor, true);
		}
		if(message == WFV.Message.FloorSelect){// isAdd true or false
			var floors = data.floor, change = data.change, isAdd = data.isAdd;
			if(isAdd){
				// when floor select, show floor timeline
				// hide ap timeline, this is done by manually
				// change_scale(2);
				if(!change) return;
				change.forEach(function(f){
					$("#timeline-floor g.line[floor="+f+"]").addClass("selected")
						.attr('_selected', true);
				});
			}else{
				if(!change) return;
				change.forEach(function(f){
					$("#timeline-floor g.line[floor="+f+"]").removeClass("selected")
						.attr('_selected', null);
				});
			}
		}
		if(message == WFV.Message.FloorHover){
			var floors = data.floor, change = data.change, isAdd = data.isAdd;
			console.log("timeline on floor hover", floors);
			if(isAdd){
				change_scale(2);
				change.forEach(function(f){
					$("#timeline-floor g.line[floor="+f+"]").addClass("hover");
				});
			}else{
				change.forEach(function(f){
					$("#timeline-floor g.line[floor="+f+"]").removeClass("hover");
				});
			}
		}
		// ap
		if(message == WFV.Message.ApSelect){// isAdd true or false
			var apids = data.apid, change = data.change, isAdd = data.isAdd;
			if(isAdd){// select ap, TODO: add labels
				 change_scale(1);
				if(!change) return;
				change.forEach(function(apid){
					// ap time line
					//$("#timeline-ap g.line[apid="+apid+"]")
					//	.addClass("selected").attr("_selected", true);
					_timeline_data(TIMELINE_TYPE.ap, apid, update_ap_timeline);
				});
			}else{// deselect ap
				if(!change) return;
				change.forEach(function(apid){
					// ap time line
					$("#timeline-ap g.line[apid="+apid+"]")
						.removeClass("selected").attr("_selected", null);
					$("#timeline-ap g.line[apid="+apid+"]").remove();
				});
				if(!apids.length){
					change_scale(2);
				}
			}
		}
		if(message == WFV.Message.ApHover){// isAdd true or false
			// TODO
			var apids = data.apid, change = data.change, isAdd = data.isAdd;
			if(isAdd){
				if(!change) return;
				change.forEach(function(apid){
				});
			}else{
				if(!change) return;
				change.forEach(function(apid){
				});
			}
		}
		//
		if(message == WFV.Message.TimePointChange){
			// TODO
		}
		if(message == WFV.Message.TimeRangeChange){
			// TODO	
		}
	}
	function init_interaction(){
		// floor timeline
		$(document).on("mouseenter", "#timeline-floor g.line",function(e){
			var sel_f = $(this).attr("floor");
			EventManager.floorHover([+sel_f]);
		});
		$(document).on("mouseleave", "#timeline-floor g.line",function(e){
			var sel_f = $(this).attr("floor");
			EventManager.floorDehover([+sel_f]);
		});
		// ap timeline
		$(document).on("mouseenter", "#timeline-ap .ap", function(e){
			var apid = $(this).attr("apid");
			EventManager.apHover([+apid]);
		});
		$(document).on("mouseleave", "#timeline-ap .ap", function(e){
			var apid = $(this).attr("apid");
			EventManager.apDehover([+apid]);
		});
		// btn
		$(document).on("click","#timeline-btn-scale", function(e){
			console.log("clicked");
			change_scale(1);
		});
	}
	$(window).resize(function(e){
		init_svg();
		update_basic_timeline();
		update_floor_timeline();
		update_ap_timeline();
	});
	function change_scale(type){
		console.log("change scale", type);
		y = (function(){
			if(type & 4){
				return ys[0];
			}else if(type & 2){
				return ys[1];
			}else if(type & 1){
				return ys[2];
			}else{
				console.error("illegal change_scale type");
			}
		})();
		yAxis.scale(y);
  	line = line.x(function(d){return x(d.time)})
			.y(function(d){return y(d.count)});

		g.select("#y-axis").call(yAxis);
		// init_svg();
		_show_tl_g(0, (type & 4) ? true : false);
		_show_tl_g(1, (type & 2) ? true : false);
		_show_tl_g(2, (type & 1) ? true : false);
		//
		// TODO BUGS
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
			tl.datum(_data);
			g.select("#y-axis").call(yAxis);
		}
		tl.attr("d", line)
	}
	function update_ap_timeline(_data){
		// [{time:,count;,values:[]}].apid:
		// if _data, add; no _data, update
		if(_data){
			console.log(_data);
			var cmax = d3.max(_data.tl_data, function(d){return d.count});
			ap_max_count.set(_data.apid, cmax);
			ys[2].domain([0, d3.max(ap_max_count.values())]).nice();
			var tls = d3.select("#timeline-ap")
				.selectAll("g.line").data([_data], function(d){return d.apid});
			var tls_enter = tls.enter().append("g").attr("class","line");
			tls_enter.append('path');
			tls.attr("apid", function(d){return d.apid}).each(function(d){
					d3.select(this).classed("ap-"+d.apid);
			});
			tls.selectAll("path").datum(function(d){return d});
				//.attr("d", line);
			g.select("#y-axis").call(yAxis);
		}
		d3.select("#timeline-ap").selectAll("g.line path")
			.attr("d",function(d){
				return line(d.tl_data);
			});
	}
	function _show_tl_g(type, flag){
		// type:0, show timeline-basic
		// type:1, show timeline-floor
		// type:2  show timeline-ap
		var selector = ["#timeline-basic", "#timeline-floor", "#timeline-ap"];
		//g.select(selector[type]).style('display', flag ? "block":"none");
		$(selector[type]).css("display", flag ? "block":"none");
	}
	function _load_floor(floor, b){// load floor data and draw path, 
		// not change visibility
		if(b && !floor_data_status[floor]){
			console.log("load floor timeline data", floor);
			_timeline_data(TIMELINE_TYPE.floor, floor, update_floor_timeline);
		}
		//g.select("#tl-floor-"+floor).style("display", b ? "block" : "none");
	}
	function update_floor_timeline(_data){
		// [{time:,count;,values:[],floor:}]
		// if _data, add; no _data, update
		if(_data){
			var cmax = d3.max(_data.tl_data, function(d){return d.count});
			console.log("update_floor_timeline", _data.floor);
			floor_max_count.set(_data.floor, cmax);
			console.log("update_floor_timeline, floor_max_count",
					floor_max_count.values());
			ys[1].domain([0, d3.max(floor_max_count.values())]).nice();
			//
			var tl = d3.select(".floor-"+_data.floor).datum(_data);
			tl.select("path").datum(function(d){return d.tl_data})
				.attr("d", line).style("stroke", function(d){return floor_color(d.floor)});
			//
			floor_data_status[_data.floor] = true;
			g.select("#y-axis").call(yAxis);
		}else{
			var tl = d3.select("#timeline-floor").selectAll("g.line");
			var lines = tl.selectAll("path").attr("d", line)
				.style("stroke",function(d){return floor_color(d.floor)});
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
