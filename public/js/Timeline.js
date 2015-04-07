/* =============================================================================
*     FileName: Timeline.js
*         Desc:  
*       Author: YanlongLi
*        Email: lansunlong@gmail.com
*     HomePage: 
*      Version: 0.0.1
*   CreateTime: 2015-01-29 16:02:28
*   LastChange: 2015-03-30 00:46:16
*      History:
============================================================================= */
WFV.Timeline = function(_time_range){
	function Timeline(){}
	//
	var floor_color = ColorScheme.floor;// floor color function
	var svg = $("#timeline-svg"), size;
	var g = d3.select("#timeline-g").attr("class", "timeline");
	//
	var all_time_range = _time_range, time_range = _time_range, time_point = _time_range[0]; 
	var current_floor, sel_aps; 
	//
	var x = d3.time.scale().domain(all_time_range);
	var ys = d3.range(0,3).map(function(){
		return d3.scale.linear().range([0,10]).domain([0,1]);
	}),y = ys[1];
	//
	var floor_max_count = d3.map(), ap_max_count = d3.map();

	var tickFormat = d3.time.format.multi([
			["%I:%M", function(d) { return d.getMinutes() % 30; }],
			["%H:%M", function(d) { return d.getHours(); }],
			["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
			["%b %d", function(d) { return d.getDate() != 1; }]
	]);
	var xAxis = d3.svg.axis().scale(x).orient("bottom")
		.tickSize(2,0,4).tickSubdivide(0)
		.ticks(6)
		.tickPadding(6)
		.tickFormat(tickFormat);
	var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5)
		.tickFormat(d3.format(",.0f"));

	var line = d3.svg.line().interpolate("monotone")
			.x(function(d){return x(d.time)})
			.y(function(d){return y(d.count)});

	// timepoint line
	var line_time_point = function(){
		var tp = time_point;
		var line = d3.svg.line().x(function(d){return x(d[0])});
		var points = [[tp, 0],[tp, size.height]];
		return line(points);
	};
	g.append("path").attr("id", "time-point-line")
		.style("stroke", "#000000").attr("stroke-width",2);
	//
	var step_by = "minute", step_count = 20;
	var TIME_STEP = WFV.TIME_STEP;
	var TIMELINE_TYPE = {
		all: "timeline_type_all",
		floor: "timeline_type_floor",
		ap: "timeline_type_ap"
	}
	// timeline change select
	$("input[name=timelineTypeSelect]:radio").change(function(e){
		var v = $(this).val();
		console.log("change scale to ", v);
		change_scale(v);
	});
	//
	var AnimationStatus = {stopped:0, running:1, paused: 2};
	var interval, animation_status = AnimationStatus.stopped;
	// brush
	var isBrushing = false;
	var brush = d3.svg.brush().x(x)
		.on("brushstart", onBrushStart)
		.on("brush", onBrushMove)
		.on("brushend", onBrushEnd);
	init_svg();
	init_interaction();
	//change_scale(1);
	//
	g.select("#timeline-basic").attr("class", "tl").append("path");
	
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
	}
	/*
	 * message handle
	 */
	ObserverManager.addListener(Timeline);
	Timeline.OMListen = function(message, data){
		// floor
		if(message == WFV.Message.FloorChange){
			var of = current_floor;
			current_floor = +data.floor;
			db_tl.tlDataFloors(all_time_range[0], all_time_range[1], 20, [current_floor], update_floor_timeline);
			d3.select("#timeline-floor").selectAll("g.tl").filter(function(d){
				return d.floor == current_floor;
			}).classed("current", true);
			if(EventManager.selectedAps().indexOf(of) == -1){
				d3.select("#timeline-floor").selectAll("g.tl").filter(function(d){
					return d.floor == of;
				}).remove();
			}
			update_floor_timeline();
			update_ap_timeline();
		}
		if(message == WFV.Message.FloorSelect){// isAdd true or false
			var floors = data.floor, change = data.change, isAdd = data.isAdd;
			if(isAdd){
				if(!change) return;
				var as = _.union(change, [current_floor]);
				db_tl.tlDataFloors(all_time_range[0], all_time_range[1], 20, as, update_floor_timeline);
				return;
			}else{
				if(!change) return;
				d3.select("#timeline-floor").selectAll("g.tl").filter(function(d){
					if(d.floor == current_floor) return;
					if(change.indexOf(+d.floor) != -1){
						floor_max_count.remove(d.floor);
						return true;
					}
					return false;
				}).remove();
				update_floor_timeline();
				update_ap_timeline();
				return;
			}
		}
		if(message == WFV.Message.FloorHover){
			var floors = data.floor, change = data.change, isAdd = data.isAdd;
			g.select("#timeline-floor").selectAll("g.tl").filter(function(d){
				return change.indexOf(d.floor) != -1;
			}).classed("hover", isAdd);
		}
		// ap
		if(message == WFV.Message.ApSelect){// isAdd true or false
			var apids = data.apid, change = data.change, isAdd = data.isAdd;
			if(isAdd){// select ap, TODO: add labels
				 // change_scale(1);
				if(!change) return;
				db_tl.tlDataAps(all_time_range[0], all_time_range[1], 20, change, update_ap_timeline);
			}else{// deselect ap
				if(!change) return;
				d3.select("#timeline-ap").selectAll("g.tl").filter(function(d){
					if(change.indexOf(+d.apid) != -1){
						ap_max_count.remove(d.apid);
						return true;
					}
					return false;
				}).remove();
			}
		}
		if(message == WFV.Message.ApHover){// isAdd true or false
			var apids = data.apid, change = data.change, isAdd = data.isAdd;
			g.select("#timeline-ap").selectAll("g.tl").filter(function(d){
				return change.indexOf(d.apid) != -1;
			}).classed("hover", isAdd);
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
		g.on("mousemove", function(){
			var pos = d3.mouse(this);
			var x = pos[0], y = pos[1];
			if(x > 0 && x < size.width && y > 0 && y < size.height){
				update_h_v_line(x,y);
			}
		}).on("mouseout", function(){
			g.selectAll("line.h-line, line.v-line, text.value-text, text.time-text").style("opacity", 0);
		});
		// animation
		$(document).on("click", "#timeline-btn-play", onBtnPlay);
		$(document).on("click", "#timeline-btn-stop", onBtnStop);
		function update_h_v_line(dx,dy){
			var v = Math.floor(y.invert(dy)), t = x.invert(dx);
			// if(t - time_range[0] > 0 && t - time_range[1] < 0){
				// return;
			// }
			g.selectAll("line.h-line, line.v-line, text.value-text, text.time-text").style("opacity", isBrushing ? 0 : 1);
			g.select("line.h-line").attr("x1", 0).attr("y1", dy).attr("x2", size.width).attr("y2",dy);
			g.select("line.v-line").attr("x1", dx).attr("y1", 0).attr("x2", dx).attr("y2", size.height);
			//
			g.select("text.value-text").attr("x", dx + 3).attr("y", dy).text(v).attr("dy", -2);
			g.select("text.time-text").attr("x", dx + 3).attr("y", dy).text(t.to_time_str()).attr("dy", 12);
		}
	}
	/*
	 * animation control
	 */
	function onBtnPlay(e){
		if(animation_status == AnimationStatus.running){
			animation_status = AnimationStatus.paused;
			pauseAnimation();
			$("#timeline-btn-play i").attr("class", "fa fa-play");
		}else if(animation_status == AnimationStatus.paused){
			animation_status = AnimationStatus.running;
			$("#timeline-btn-play i").attr("class", "fa fa-pause");
			startAnimation();	
		}else if(animation_status == AnimationStatus.stopped){
			animation_status = AnimationStatus.running;
			$("#timeline-btn-play i").attr("class", "fa fa-pause");
			$("#timeline-btn-play").addClass("btn-success");
			// time_point = time_range[0];
			g.select("#time-point-line").attr("d", line_time_point(time_point));
			startAnimation();
		}else{
			console.warn("illegal status");
		}
	}
	function onBtnStop(e){
		if(animation_status == AnimationStatus.stopped){
			return;
		}else if(animation_status == AnimationStatus.running ||
				animation_status == AnimationStatus.paused){
			animation_status = AnimationStatus.stopped;
			$("#timeline-btn-play i").attr("class", "fa fa-play");
			$("#timeline-btn-play").removeClass("btn-success");
			stopAnimation();
			time_point = time_range[0];
			g.select("#time-point-line").attr("d", line_time_point(time_point));
		}
	}
	function startAnimation(){
		var from = time_point, to = time_range[1];
		interval = setInterval(function(){
			if(from - to >= 0){
				clearInterval(interval);
				animation_status = AnimationStatus.stopped;
				time_point = time_range[0];
				g.select("#time-point-line").attr("d", line_time_point(time_point));
				return;
			}
			time_point = from;
			EventManager.timePointChange(time_point);
			g.select("#time-point-line").attr("d", line_time_point(time_point));
			// TODO whether fire time point change
			//from.setMinutes(from.getMinutes() + 1);
			from.setSeconds(from.getSeconds() + 60);
		}, 1000);
	}
	function pauseAnimation(){
		clearInterval(interval);
	}
	function stopAnimation(){
		clearInterval(interval);
		time_point = time_range[0];
		EventManager.timePointChange(time_point);
	}
	/*
	 *
	 */
	$(window).resize(function(e){
		init_svg();
		update_floor_timeline();
		update_ap_timeline();
	});
	function change_scale(type){
		console.log("change scale", type);
		ys[1].domain([0, d3.max(floor_max_count.values())]).nice();
		ys[2].domain([0, d3.max(ap_max_count.values())]).nice();
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
		update_floor_timeline();
		update_ap_timeline();
		//
		function _show_tl_g(type, flag){
			// type:0, show timeline-basic
			// type:1, show timeline-floor
			// type:2  show timeline-ap
			var selector = ["#timeline-basic", "#timeline-floor", "#timeline-ap"];
			//g.select(selector[type]).style('display', flag ? "block":"none");
			$(selector[type]).css("display", flag ? "block":"none");
		}
	}
	/*
	 * update
	 */
	function update_ap_timeline(_data){
		var tls = d3.select("#timeline-ap").selectAll("g.tl"); if(_data && _data.length){
			tls = tls.data(_data, function(d){return d.apid});
			var enter = tls.enter().append("g").attr("class", "tl");
			enter.each(function(d){
				var cmax = d3.max(d.tl_data, function(d){return d.count});
				ap_max_count.set(d.apid, cmax);
				d3.select(this).append("path");
			});
		}
		ys[2].domain([0, d3.max(ap_max_count.values())]).nice();
		tls = d3.select("#timeline-ap").selectAll("g.tl");
		tls.attr("apid", function(d){return d.apid})
			.each(function(d){
				d3.select(this).select("path")
					.style("stroke", floor_color(d.floor))
					.attr("d", d.tl_data ? line(d.tl_data) : "");
			}).on("mouseemove", function(d){
				d3.select(this).classed("hover", true);
				EventManager.apHover([d.apid], Timeline);
			}).on("mouseout", function(d){
				d3.select(this).classed("hover", false);
				EventManager.apDehover([d.apid], Timeline);
			});
		yAxis.scale(y);
		g.select("#y-axis").call(yAxis);
	}
	function update_floor_timeline(_data){
		var tls = d3.select("#timeline-floor").selectAll("g.tl");
		if(_data && _data.length){
			tls = tls.data(_data, function(d){return d.floor});
			var enter = tls.enter().append("g").attr("class", "tl");
			enter.each(function(d){
				var cmax = d3.max(d.tl_data, function(d){return d.count});
				floor_max_count.set(d.floor, cmax);
				d3.select(this).append("path");
			});
		}
		ys[1].domain([0, d3.max(floor_max_count.values())]).nice();
		tls = d3.select("#timeline-floor").selectAll("g.tl");
		tls.attr("floor", function(d){return d.floor})
			.each(function(d){
				d3.select(this).select("path")
					.style("stroke", floor_color(d.floor))
					.attr("d", d.tl_data ? line(d.tl_data) : "");
			}).on("mousemove", function(d){
				d3.select(this).classed("hover", true);
				EventManager.floorHover([d.floor], Timeline);
			}).on("mouseout", function(d){
				d3.select(this).classed("hover", false);
				EventManager.floorDehover([d.floor], Timeline);
			});
		yAxis.scale(y);
		g.select("#y-axis").call(yAxis);
	}
	/*
	 * brush event
	 */
	function onBrushStart(){
		isBrushing = true;
		onBtnStop();
	}
	function onBrushMove(e){
		time_range  = d3.event.target.extent();
		if(time_point - time_range[0] <= 0){
			time_point = time_range[0];
			g.select("#time-point-line").attr("d", line_time_point(time_point));
			EventManager.timePointChange(time_point);
		}else if(time_point - time_range[1] >= 0){
			time_point = time_range[1];
			g.select("#time-point-line").attr("d", line_time_point(time_point));
			EventManager.timePointChange(time_point);
		}
		EventManager.timeRangeChange(time_range);
	}
	function onBrushEnd(){
		isBrushing = false;
		if(!d3.event.sourceEvent) return;
		var range = d3.event.target.extent();
		var step = TIME_STEP[step_by] * step_count;
		if(brush.empty() || range[1] - range[0] < step){
			range = all_time_range;
		}else{
			var from = range[0];
			from.setMinutes(from.getMinutes() - (from.getMinutes() % 20));
			from.setSeconds(0);
			from.setMilliseconds(0);
			var to = range[1];
			to.setMinutes(to.getMinutes() + 20);
			to.setMinutes(to.getMinutes() - (to.getMinutes() % 20));
			to.setSeconds(0);
			to.setMilliseconds(0);
		}
		time_range = range;
		EventManager.timeRangeChanged(time_range);
	}

	return Timeline;
}
