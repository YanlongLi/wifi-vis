WFV.FloorBar = function(_time_range){
	function FloorBar(){}
	var floor_color = ColorScheme.floor;
	// variables
	var wrapper = $("#floor-bar-wrapper"),
		svg = $("#floor-bar-wrapper > svg");
	d3.select("#floor-bar-wrapper > svg")
		.attr("width", "100%").attr("height", "100%");
	var g = d3.select("#floor-bar"), size;
	//
	g.select("#floor-bar-btn-wrapper").append("rect")
		.attr("id", "floor-bar-btn-tl").attr("class", "btn btn-tl");
	g.select("#floor-bar-btn-wrapper").append("rect")
		.attr("id", "floor-bar-btn-bar").attr("class", "btn btn-bar");
	//
	var time_range = _time_range, time_point = _time_range[0];
	var step = 1000 * 60 * 20;
	var is_floor_tl = true;
	//
	var ftlData = new FloorBarTlData();
	var barData = new FloorBarBarData();
	//
	var per_h = {h0:1, h1:0}, w_bar, bar_gap = 2, max_ap_number = 24;
	var circle_scale = d3.scale.linear().clamp(true),
		y_bar_scale    = d3.scale.linear(),
		x_line_scale   = d3.time.scale().domain(time_range),
		y_line_scale   = [d3.scale.linear(),d3.scale.linear()],
		line_generator = [
			d3.svg.area().interpolate("monotone")
				.x(function(d){return x_line_scale(d.time)})
				.y(function(d){return y_line_scale[0](d.count)}),
			d3.svg.area().interpolate("monotone")
				.x(function(d){return x_line_scale(d.time)})
				.y(function(d){return y_line_scale[1](d.count)})
		];
	//
	var vertical_scale = [d3.scale.ordinal(), d3.scale.ordinal()];
	var time_axis = d3.svg.axis().scale(x_line_scale)
		.orient("bottom")
		.ticks(3)
		//.ticks(d3.time.hour, 2)
		.tickFormat(d3.time.format("%H:%M"));
	//
	var selected_aps = [], current_floor;
	//
	init_svg();

	init_interaction();

	/*
	 * Event Listen
	 */
	ObserverManager.addListener(FloorBar);
	FloorBar.OMListen = function(message, data){
		// floor
		if(message == WFV.Message.FloorChange){
			console.log("Floor Bar on floor change", data.floor);
			if(current_floor == data.floor) return;
			current_floor = data.floor;
			//
			db.tl_data_aps_of_floor(time_range[0],
					time_range[1],
					step, current_floor,
					update_floor_ap_tls);
			change_tl();
			$("#floor-bar-circles .floor").removeClass("current");
			$("#floor-bar-circles .floor[floor="+current_floor+"]").addClass("current");
			// TODO other clean action after floor change, espacially for eles always exits
		}
		if(message == WFV.Message.FloorSelect){// isAdd true or false
			var floors = data.floor, change = data.change, isAdd = data.isAdd;
			if(isAdd){
				change.forEach(function(f){
					// floor circle
					$("#floor-bar-circles .floor[floor="+f+"]").addClass("selected")
						.attr('_selected', true);
					// floor timeline
					$("#floor-bar-tls .floor[floor="+f+"]").addClass("selected")
						.attr('_selected', true);
				});
			}else{
				change.forEach(function(f){
					// floor circle
					$("#floor-bar-circles .floor[floor="+f+"]").removeClass("selected")
						.attr('_selected', null);
					// floor timeline
					$("#floor-bar-tls .floor[floor="+f+"]").removeClass("selected")
						.attr('_selected', null);
				});
			}
		}
		if(message == WFV.Message.FloorHover){// isAdd true or false
			var floors = data.floor, change = data.change, isAdd = data.isAdd;
			if(isAdd){
				change.forEach(function(f){
					// floor circle
					$("#floor-bar-circles .floor[floor="+f+"]").addClass("hover");
					// floor timeline
					$("#floor-bar-tls .floor[floor="+f+"]").addClass("hover");
				});
			}else{
				change.forEach(function(f){
					// floor circle
					$("#floor-bar-circles .floor[floor="+f+"]").removeClass("hover");
					// floor timeline
					$("#floor-bar-tls .floor[floor="+f+"]").removeClass("hover");
				});
			}
		}
		if(message == WFV.Message.ApSelect){// isAdd true or false
			var apids = data.apid, change = data.change, isAdd = data.isAdd;
			if(isAdd){// select ap, TODO: add labels
				if(!change) return;
				change.forEach(function(apid){
					// ap time line
					$("#floor-bar-aps .floor .bar[apid="+apid+"]")
						.addClass("selected").attr("_selected", true);
					// ap bar
					$("#floor-bar-tls g.ap[apid="+apid+"]")
						.addClass("selected").attr("_selected", true);
				});
			}else{// deselect ap
				if(!change) return;
				change.forEach(function(apid){
					// ap time line
					$("#floor-bar-aps .floor .bar[apid="+apid+"]")
						.removeClass("selected").attr("_selected", null);
					// ap bar
					$("#floor-bar-tls g.ap[apid="+apid+"]")
						.removeClass("selected").attr("_selected", null);
				});
			}
		}
		if(message == WFV.Message.ApHover){// isAdd true or false
			var apids = data.apid, change = data.change, isAdd = data.isAdd;
			if(isAdd){// select ap
				change.forEach(function(apid){
					// ap time line
					$("#floor-bar-aps .floor .bar[apid="+apid+"]").addClass("hover");
					// ap bar
					$("#floor-bar-tls g.ap[apid="+apid+"]").addClass("hover");
				});
			}else{// deselect ap
				change.forEach(function(apid){
					// ap time line
					$("#floor-bar-aps .floor .bar[apid="+apid+"]").removeClass("hover");
					// ap bar
					$("#floor-bar-tls g.ap[apid="+apid+"]").removeClass("hover");
				});
			}
		}
		if(message == WFV.Message.TimeRangeChanged){
			console.log("Floor Bar on time range changed", data.range);
			time_range = data.range;
			x_line_scale.domain(time_range);
			g.select("#floor-bar-tl-x-axis").call(time_axis.scale(x_line_scale));
			// ap bars
			// db.ap_bar_data(time_range[0], time_range[1], update_ap_bars);
			//
			ftlData.changeRange(time_range, step, function(){
				ftlData.getFlattedData(update_all_tls);
			});	
			barData.changeRange(time_range, function(){
				barData.getFlattedData(update_horizon_bars);
			});
			return;
			// floor tl data
			(function next_f(f, _data, cb){
				if(f < 18){
					db.tl_data_floor(time_range[0], time_range[1], step, f, function(d){
						_data.push(d);
						next_f(f+1, _data, cb);
					});
				}else{
					// console.log("floor bar on time range chagned, tl data");
					// console.log(_data.length);
					// console.log(_data.map(function(d){return d.tl_data.length}));
					cb(_data);
				}
			})(1, [], update_floor_tls);
			// ap timeline of floor
			db.tl_data_aps_of_floor(time_range[0],
					time_range[1],
					step, current_floor,
					update_floor_ap_tls);
		}
		if(message == WFV.Message.TimePointChange){
			// TODO
		}
	}
	function init_interaction(){
		// for floor circle
		$(document).on("mousedown", "#floor-bar-circles .floor, #floor-bar-tls g.floor", function(e){e.stopPropagation()});
		$(document).on("click", "#floor-bar-circles .floor, #floor-bar-tls g.floor", function(e){
			var floor = $(this).attr("floor");
			if(floor == current_floor){
				is_floor_tl = !is_floor_tl;
				// change_tl();
				if(ftlData.floorStatus[current_floor]){
					ftlData.unflatFloor(current_floor, function(){
						ftlData.getFlattedData(update_all_tls);
					});
					barData.unflatFloor(current_floor, function(){
						barData.getFlattedData(update_horizon_bars);
					});
				}else{
					ftlData.flatFloor(current_floor, function(){
						ftlData.getFlattedData(update_all_tls);
					});
					barData.flatFloor(current_floor, function(){
						barData.getFlattedData(update_horizon_bars);
					});
				}
			}else{
				EventManager.apDeselect(null);
				EventManager.floorChange(floor);
			}
		});
		$(document).on("mouseenter", "#floor-bar-circles .floor, #floor-bar-tls .floor", function(e){
			console.log("fire floor over event");
			var sel_f = $(this).attr("floor");
			EventManager.floorHover([+sel_f]);
		});
		$(document).on("mouseleave", "#floor-bar-circles .floor, #floor-bar-tls .floor", function(e){
			var sel_f = $(this).attr("floor");
			EventManager.floorDehover([+sel_f]);
		});
		$(document).on("mouseenter", "#floor-bar-tls g.tl", function(e){
			var dx = e.pageX - $("#floor-bar-wrapper").offset().left;
			var dy = e.pageY - $("#floor-bar-wrapper").offset().top;
			//
			var html = "";
			if($(this).attr("floor")){
				var floor = $(this).attr("floor");
				html = html + "floor: " + floor + "</br>";
			}else{
				var apid = $(this).attr("apid");
				var ap = apMap.get(apid);
				var _name = ap.name.split(/ap|f/);
				_name.shift();
				html = html + "ap: " + _name.join("-") + "</br>"
				html = html + "apid: " + apid + "</br>";
			}
			//
			$("#floor-bar-tip").html(html);
			$("#floor-bar-tip").css({
				"left": dx + 10,
				"top": dy
			});
			$("#floor-bar-tip").show();
		});
		$(document).on("mouseleave", "#floor-bar-tls g.tl", function(e){
			$("#floor-bar-tip").hide();
		});
		// for bars
		$(document).on("click", "#floor-bar-aps .floor .bar", function(e){
			var apid = $(this).attr("apid");
			if($(this).attr("_selected")){
				EventManager.apDeselect([apid]);
			}else{
				EventManager.apSelect([apid]);
			}
		});
		$(document).on("mouseenter", "#floor-bar-aps .floor .bar", function(e){
			var apid = $(this).attr("apid");
			EventManager.apHover([apid]);
		});
		$(document).on("mouseleave", "#floor-bar-aps .floor .bar", function(e){
			var apid = $(this).attr("apid");
			EventManager.apDehover([apid]);
		});
		// ap-tls
		$(document).on("click", "#floor-bar-tls g.ap", function(e){
			var apid = d3.select(this).attr("apid");
			if($(this).attr("_selected")){
				$(this).attr('_selected', null);
				EventManager.apDeselect([apid]);
			}else{
				EventManager.apSelect([apid]);
			}
		});

		$(document).on("mouseenter", "#floor-bar-tls g.ap", function(e){
			var apid = d3.select(this).attr("apid");
			EventManager.apHover([apid]);
		});
		$(document).on("mouseleave", "#floor-bar-tls g.ap", function(e){
			var apid = d3.select(this).attr("apid");
			EventManager.apDehover([apid]);
		});
		// btns
		$(document).on("click", "#floor-bar-btn-tl, #floor-bar-btn-bar", function(e){
			change_view();
		});
		$(document).on("mouseenter", "#floor-bar-btn-tl, #floor-bar-btn-bar", function(e){
			d3.select(this).style("stroke","#186307");
		});
		$(document).on("mouseleave", "#floor-bar-btn-tl, #floor-bar-btn-bar", function(e){
			d3.select(this).style("stroke", null);
		});
	}


	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [10, 20, 30, 30]);
		vertical_scale[0].rangeBands([0, size.height]);
		vertical_scale[1].rangeBands([0, size.height]);
		//per_h.h0 = size.height / 17;
		var offset = 40;
		x_line_scale.range([0, size.width - offset]);
		//line_generator[0].y0(per_h.h0);
		
		g.selectAll("#floor-bar-aps, #floor-bar-tls")
			.attr("transform", "translate("+offset+")");
		g.select("#floor-bar-tl-x-axis")
			.attr("class", "x axis")
			.attr("transform", "translate("+offset+","+size.height+")");
		//
		var btns_dx = size.width - 50;
		g.select("#floor-bar-btn-wrapper").attr("transform","translate("+btns_dx+")");
		g.selectAll("#floor-bar-btn-wrapper .btn").attr("width", 20).attr('height', 10);
		g.select(".btn-bar").attr("transform", "translate(21)");
	}
	function change_tl(){// used to update postion of tls
		return;
		var floor_tls = g.select("#floor-bar-tls").selectAll("g.floor");
		var ap_tls = g.select("#floor-bar-tls").selectAll("g.ap");
		var floor_circle = g.select("#floor-bar-circles").selectAll("g.floor");
		console.log("is_floor_tl", is_floor_tl);
		if(is_floor_tl){
			floor_tls.attr("display", "block").transition().delay(250).attr("transform", function(d){
				return "translate(0,"+vertical_scale[0](d.floor)+")";
			});
			ap_tls.transition().attr("transform", function(){
				return "translate(0,"+vertical_scale[0](current_floor)+")";
			}).transition().attr("display", "none");
			//
			floor_circle.classed("fading", false);
		}else{
			floor_tls.transition().attr("display", "none")
				.attr("transform", function(d){
					if(d.floor > current_floor){
						return "translate(0,0)";
					}else if(d.floor < current_floor){
						return "translate(0,"+size.height+")";
					}else{
					}
				});
			ap_tls.transition().delay(500).attr("transform", function(d){
				return "translate(0,"+vertical_scale[1](d.apid)+")";
			}).attr("display","block");
			//
			floor_circle.classed("fading", function(d){return d.floor != current_floor});
		}
	}
	// change view between tls and ap bars
	function change_view(){
		if(g.select("#floor-bar-aps").style("visibility") == "visible"){
			g.select("#floor-bar-aps").style("visibility", "hidden");
			g.select("#floor-bar-tls").style("visibility", "visible");
			g.select("#floor-bar-tl-x-axis").attr("display", "block");
		}else{
			g.select("#floor-bar-aps").style("visibility", "visible");
			g.select("#floor-bar-tls").style("visibility", "hidden");
			g.select("#floor-bar-tl-x-axis").attr("display", "none");
		}
	}
	function update_floor_circle(_data){
		return;
		// [{floor:, count:}]	
		// if no _data, update size
		var scale = circle_scale.range([2, per_h.h0/2]);
		var floors = g.select("#floor-bar-circles").selectAll("g.floor");
		if(_data){
			var extent = d3.extent(_data, function(d){return d.count});
			extent[0] = extent[0] ? extent[0] : 1;
			extent[1] = extent[1] > extent[0] ? extent[1] : extent[0] + 1;
			scale.domain(extent);
			//console.log(scale.domain(), scale.range());
			if(isNaN(extent[1])){
				var c_a = Array.prototype
					.concat.apply([], _data.map(function(d){
						return d.count;
					}));
				console.log(c_a);
				console.warn("elegal domain")
			}
			floors = floors.data(_data, function(d){return d.floor});
			var floors_enter = floors.enter().append("g").attr("class","floor");
			floors_enter.append("circle");
			floors_enter.append("text"); // floor label
			floors.attr("floor", function(d){return d.floor});
		}
		floors.sort(_sort_by_floor);
		floors.select("circle").datum(function(d){return d})
			.attr("cx", per_h.h0/2).attr("cy", per_h.h0/2)
			.attr("count",function(d){return d.count})
			.attr("r", function(d){
				console.log("count at floor",d.floor, d.count);
				var r = scale(d.count);
				return  isNaN(r) || r < 1 ? 1 : r;
			}).style("fill", function(d){return floor_color(d.floor)});
		floors.select("text").datum(function(d){return d.floor})
			.attr("x", -30).attr("y", per_h.h0/2)
			.text(function(d){return "F"+d})
			.attr("dy", 5);
		floors.transition().attr("transform", function(d,i){
			//var dy = per_h.h0 * i;
			var dy = per_h.h0 * i;
			return "translate(0,"+dy+")";
		});
	}
	function update_ap_bars(_data){
		// [{floor:,aps:[{apid:, count:}]}]
		// if no _data, resize ap_bars
		var scale = y_bar_scale.range([per_h.h0, 0]);
		var floors = g.select("#floor-bar-aps").selectAll("g.floor");
		//var bars = floors.selectAll("g.bar");
		if(_data){
			max_ap_number = d3.max(_data,function(d){return d.aps.length});
			var max_count = d3.max(_data,function(f){
				return d3.max(f.aps, function(d){return d.count});
			});
			scale.domain([0, max_count + 2]);
			floors = floors.data(_data, function(d){return d.floor});
			floors.enter().append('g').attr('class',"floor");
			//
			var bars = floors.selectAll("g.bar").data(function(d){return d.aps});
			var bar_enter = bars.enter().append("g").attr("class", "bar");
			bar_enter.append("rect");
			//
			bars.attr("apid", function(d){return d.apid});
		}
		w_bar = (size.width - per_h.h0) / max_ap_number;
		floors.sort(_sort_by_floor);
		floors.attr("floor", function(d){return d.floor}).each(function(d){
			// sort ap bars
			var bars = d3.select(this).selectAll("g.bar")
				.data(function(d){return d.aps}, function(d){return d.apid})
				.sort(function(d1, d2){
					//var a = d1.count, b = d2.count;
					var a = d1.apid, b = d2.apid;
					return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
			});
			bars.transition().attr("transform", function(d,i){
				var dx = i * w_bar;
				return "translate("+dx+")";
			});
			bars.select("rect").attr("x", bar_gap).attr("y", function(d){
				return scale(d.count);
			}).attr("width", w_bar - bar_gap)
			.attr("height", function(d){
				var h = per_h.h0 - scale(d.count);
				return h < 1 ? 1 : h;
			});
		});
		floors.transition().attr("transform", function(d,i){
			//var dy = per_h.h0 * i
			var dy = per_h.h0 * (d.floor -1);
			return "translate(0,"+dy+")";
		});
		if(_data){
			update_floor_circle(_data);
		}else{
			update_floor_circle();
		}
	}
	var horizon_data;
	function update_horizon_bars(_data){
		var bars = g.select("#floor-bar-circles").selectAll("g.bar");
		if(_data){
			horizon_data = _data;
			vertical_scale[0].domain(_data.map(_tl_key));
			var cmax = d3.max(_data, function(d){return d.count});
			circle_scale.range([0, 38]).domain([0, cmax]);
			bars = bars.data(_data, _tl_key);
			var enter = bars.enter().append("g").attr("class", function(d){return "bar "+d.type});
			enter.append("rect").append("title");
			enter.append("text");
			bars.exit().remove();
		}
		bars.order();
		bars.each(function(d, i){
			var ele = d3.select(this);
			if(d.type == "floor"){
				ele.attr("floor", d.floor);
				ele.select("rect").style("fill", floor_color(d.floor))
					.select("title").text(function(){
						return "persons(occur): " + d.count;
					});
				ele.select("text").text("'"+d.floor+"")
					.attr("x", -6).attr("y", vertical_scale[0].rangeBand()/2).attr("dy", 5);
			}else{
				ele.attr("apid", d.apid);
				var _name = apMap.get(d.apid).name.split(/ap|f/);
				_name.shift();
				ele.select("rect").select("title").text(function(){
						return "persons(occur): " + d.count;
					});
				ele.select("text").text(_name.join("-"))
					.attr("x", -6).attr("y", vertical_scale[0].rangeBand()/2).attr("dy", 5);
			}
			var dy = vertical_scale[0](_tl_key(d));
			ele.select("rect").attr("height", vertical_scale[0].rangeBand() - 2)
				.attr("width", circle_scale(d.count));
			ele.transition().attr("transform", "translate(0,"+dy+")");
		});
		//
		function _tl_key(d){
			if(d.type == "floor"){
				return "floor-" + d.floor;
			}else{
				return "ap-" + d.apid;
			}
		}
	}
	var all_tls_data;
	function update_all_tls(_data){
		var all_tls = g.select("#floor-bar-tls").selectAll("g.tl");
		if(_data){
			all_tls_data = _data;
			vertical_scale[0].domain(_data.map(_tl_key));
			y_line_scale[0].range([vertical_scale[0].rangeBand(),0]);
			line_generator[0].y0(vertical_scale[0].rangeBand());
			all_tls = all_tls.data(_data, _tl_key);
			var enter = all_tls.enter().append("g").attr("class",function(d){return "tl " + d.type});
			enter.append("path");
			all_tls.exit().remove();
		}
		all_tls.order();
		var drag = d3.behavior.drag()
			.origin(function(d){
				var x = 0;
				var y = vertical_scale[0](_tl_key(d));
				console.log("timeline drag start");
				return {x: 0, y: 0};
			}).on("dragstart", function(d) {
				d3.event.sourceEvent.stopPropagation();
			}).on("drag", function(d) {
				var x = d3.event.x, y = d3.event.y;
				var ox = 0 + x, oy = vertical_scale[0](_tl_key(d)) + y;
				d3.select(this).attr("transform", "translate("+ox+","+oy+")");
				//
				if(d.floor){
					$("#floor-bar-circles g.floor[floor="+d.floor+"]").attr("transform","translate("+ox+","+oy+")");
				}else{
					$("#floor-bar-circles g.ap[apid="+d.floor+"]").attr("transform","translate("+ox+","+oy+")");
				}
				//
				d3.selectAll("#floor-bar-tls .tl, #floor-bar-circles .bar").style("pointer-events", "none");
			}).on("dragend", function(d, i){
				var new_all_tls_data = [].concat(d, all_tls_data.slice(0, i), all_tls_data.slice(i+1, all_tls_data.length));
				update_all_tls(new_all_tls_data);
				//
				var new_horizon_data = [].concat(horizon_data[i], horizon_data.slice(0, i), horizon_data.slice(i+1, horizon_data.length));
				update_horizon_bars(new_horizon_data);
				//
				d3.selectAll("#floor-bar-tls .tl, #floor-bar-circles .bar").style("pointer-events", null);
			});
		all_tls.call(drag);
		all_tls.each(function(d){
			var ele = d3.select(this);
			if(d.type == "floor"){
				ele.attr("floor", d.floor);
				ele.select("path").style("stroke", function(d){return floor_color(d.floor)});
			}else{
				ele.attr("apid", d.apid);
			}
			var cmax = d3.max(d.tl_data, function(d){return d.count});
			y_line_scale[0].domain([0, cmax]);
			ele.select('path').attr("d", line_generator[0](d.tl_data));
			var dy = vertical_scale[0](_tl_key(d));
			ele.transition().attr("transform", "translate(0,"+dy+")");
		});
		//
		function _tl_key(d){
			if(d.type == "floor"){
				return "floor-" + d.floor;
			}else{
				return "ap-" + d.apid;
			}
		}
	}

	function update_floor_tls(_data){
		return;
		// assume time_range.domain already been set
		// [{floor:, tl_data:[{time:, count:}]}]
		// if no _data, resize timelines
		var floors = g.select("#floor-bar-tls").selectAll("g.floor");
		//x_line_scale.range([0, size.width - per_h.h0]);
		//y_line_scale[0].range([per_h.h0, 0]);
		if(_data){
			var cmax = d3.max(_data, function(d){
				return d3.max(d.tl_data, function(d){return d.count});
			});
			(cmax <= 0) && (console.warn("illegal cmax", cmax));
			y_line_scale[0].domain([0, cmax]);
			console.log("floor bar tl scale", y_line_scale[0].domain(), y_line_scale[0].range());
			//
			floors = floors.data(_data, function(d){return d.floor});
			var floor_enter = floors.enter().append("g").attr("class", "floor");
			floor_enter.append("path");
		}
		floors.sort(_sort_by_floor);
		floors.attr("floor", function(d){
			return d.floor;
		}).each(function(d){
			d3.select(this).select("path").datum(function(d){return d})
				.attr("d", function(d){return line_generator[0](d.tl_data)})
				.style("stroke",function(d){return floor_color(d.floor)});
		});
		floors.transition().attr("transform", function(d,i){
			var dy = vertical_scale[0](d.floor);
			return "translate(0,"+dy+")";
		});
	}
	function update_floor_ap_tls(_data){
		return;
		// [{apid, tl_data:[{time:,count:}]}]	
		// if no _data, resize timeline
		var aps = g.select("#floor-bar-tls").selectAll("g.ap");
		if(_data){
			_data.sort(function(d1, d2){// sort timeline by ap position
				var a = d1.apid, b = d2.apid;
				return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
				// var ap1 = apMap.get(d1.apid),
				// ap2 = apMap.get(d2.apid);
				// function offset(x,y){
				// 	return  Math.sqrt(x*x+y*y);
				// }
				// var a = offset(ap1.pos_x, ap1.pos_y),
				// b = offset(ap2.pos_x, ap2.pos_y);
				// return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
			});
			var cmax = d3.max(_data, function(ap){
				return d3.max(ap.tl_data,function(d){return d.count});
			});
			(cmax <= 0) && (console.warn("illegal cmax", cmax));

			vertical_scale[1].domain(_data.map(function(d){return d.apid}));
			per_h.h1 = vertical_scale[1].rangeBand() || 1;
			y_line_scale[1].domain([0,cmax]);
			y_line_scale[1].range([per_h.h1, 0]);

			aps = aps.data(_data, function(d){return d.apid});
			var aps_enter = aps.enter().append("g").attr("class","ap");
			aps_enter.append("path");
			//
			aps.exit().remove();
			// move bar to positon of its floor
			aps.attr("transform", function(){
				var dy = vertical_scale[0](current_floor);
				return "translate(0,"+dy+")";
			});
		}
		aps.attr("apid", function(d){return d.apid})
			.select("path").datum(function(d){
				// console.log(d.tl_data);
				// return d.tl_data;
				return d;
			}).attr("d", function(d){return line_generator[1](d.tl_data)})
		.style("stroke",function(d){
			var floor = apMap.get(d.apid).floor;
			if(undefined === floor){
				console.warn("no floor info");
			}
			return floor_color(floor);
		});
		aps.transition().attr("transform", function(d){
			var dy = vertical_scale[1](d.apid);
			return "translate(0,"+dy+")";
		});
	}
	$(window).resize(function(e){
		init_svg();
		update_all_tls();
		update_horizon_bars();
		// update_floor_circle();
		// update_ap_bars();
		// update_floor_tls();
		// update_floor_ap_tls();
		// change_tl();
	});
	function _sort_by_floor(f1, f2){
		var a = f1.floor, b = f2.floor;
		return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
	}

	return FloorBar;
}


/*
 *
 */
function FloorBarTlData(){
	this.timeRange;
	this.step;
	this.data = null; //[{floor:, tl_data[], aps:}]
	this.floorStatus = d3.range(0,18).map(function(){return false});
}

FloorBarTlData.prototype.init = function(range, step, cb){
	// this function may not be called expicity
	var that = this;
	that.timeRange = range;
	that.step = step;
	that.data = null;
	that.data = [];
	that.data.push([]);
	(function next_f(f, _data, cb){
		if(f < 18){
			db.tl_data_floor(that.timeRange[0], that.timeRange[1], step, f, function(d){
				d.type = "floor";
				_data.push(d);
				next_f(f+1, _data, cb);
			});
		}else{
			cb(that);
		}
	})(1, that.data, cb);
}

FloorBarTlData.prototype.changeRange = function(range, step, cb){
	this.timeRange = range ? range : this.timeRange;
	this.step = step ? step : this.step;
	this.init(this.timeRange, this.step, _recover_status);
	function _recover_status(that){
		(function next_f(f){
			if(f >= 18){
				cb(that);
			}else{
				if(that.floorStatus[f]){
					that.flatFloor(f, function(){});
				}
				next_f(f+1);
			}
		})(1);
	}
}

FloorBarTlData.prototype.flatFloor = function(f, cb){
	// force to reload aps timeline
	console.log("flatter floor", f);
	var that = this;
	if(that.data[f].aps){
		that.floorStatus[f] = true;
		cb(that);
		return;
	}
	if(that.floorStatus[f]) console.warn("illegal status");
	db.tl_data_aps_of_floor(that.timeRange[0],
			that.timeRange[1], that.step, f, function(apsTlData){
				// TODO sort?
				apsTlData.forEach(function(d){d.type = "ap"});
				that.data[f].aps = apsTlData;
				that.floorStatus[f] = true;
				cb(that);
			});
	
};

FloorBarTlData.prototype.unflatFloor = function(f, cb){
	console.log("unflat floor", f);
	var that = this;
	that.floorStatus[f] = false;
	cb(that);
}

FloorBarTlData.prototype.getFlattedData = function(cb){
	// cb([{floor:,tl_data:}, {apid:, tl_data:}])
	var res = [];
	var that = this;
	this.data.forEach(function(ftl,i){
		res = res.concat(ftl);
		if(that.floorStatus[i]){
			if(!ftl.aps){console.warn("no aptl data")};
			res = res.concat(ftl.aps);
		}
	});
	cb(res)
}

FloorBarTlData.prototype.getFloorData = function(cb){
	var res = this.data.map(function(d){return d})
	cb(res);
}


/*
 *
 */

function FloorBarBarData(){
	this.timeRange;
	this.data = null;
	this.floorStatus = d3.range(0,18).map(function(){return false});
}

FloorBarBarData.prototype.init = function(range, cb){
	var that = this;
	that.timeRange = range;
	db.ap_bar_data(that.timeRange[0], that.timeRange[1], function(data){
		data.unshift([]);	
		that.data = data;
		cb && cb(that);
	});
}

FloorBarBarData.prototype.changeRange = function(range, cb){
	this.init(range, cb);
}

FloorBarBarData.prototype.flatFloor = function(f, cb){
	this.floorStatus[f]	= true;
	this.getFlattedData(cb);
}

FloorBarBarData.prototype.unflatFloor = function(f, cb){
	this.floorStatus[f]	= false;
	this.getFlattedData(cb);
}

FloorBarBarData.prototype.getFlattedData = function(cb){
	var res = [];
	var that = this;
	this.data.forEach(function(ftl,i){
		res = res.concat(ftl);
		if(that.floorStatus[i]){
			if(!ftl.aps){console.warn("no aptl data")};
			ftl.aps.forEach(function(d){d.type = "ap"});
			res = res.concat(ftl.aps);
		}
	});
	cb(res)
}
