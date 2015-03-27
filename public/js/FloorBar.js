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
	var tl_offset = 40;
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
	var tickFormat = d3.time.format.multi([
			["%I:%M", function(d) { return d.getMinutes(); }],
			["%H:%M", function(d) { return d.getHours(); }],
			["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
			["%b %d", function(d) { return d.getDate() != 1; }]
	]);
	var time_axis = d3.svg.axis().scale(x_line_scale)
		.orient("bottom")
		.ticks(3)
		//.ticks(d3.time.hour, 2)
		.tickFormat(tickFormat);
		//.tickFormat(d3.time.format("%H:%M"));
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
			// update sel ap bars and tls
			// console.log("selected aps", apids);
			// barData.getSelData(apids, update_sel_ap_bars);
			// ftlData.getSelData(apids, update_sel_ap_tls);
			selected_aps = apids;
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
			barData.getSelData(selected_aps, update_sel_ap_bars);
			ftlData.getSelData(selected_aps, update_sel_ap_tls);
			return;
			// floor tl data
			(function next_f(f, _data, cb){
				if(f < 18){
					//db.tl_data_floor(time_range[0], time_range[1], step, f, function(d){
					db_tl.tlDataFloor(time_range[0], time_range[1], step, f, function(d){
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
			// db.tl_data_aps_of_floor(time_range[0],
			db_tl.tlDataApsOfFloor(time_range[0],
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
		//
		g.on("mousemove", function(){
			var pos = d3.mouse(this);
			var x = pos[0] - 3;
			if(x < tl_offset || x > x_line_scale.range()[1] + tl_offset){
				return;
			}
			var time = x_line_scale.invert(x - tl_offset);
			// console.log(x, time.to_time_str());
			d3.select("#floor-bar-time-thread").attr("x1", x).attr("x2", x)
				.attr("y1", 0).attr("y2", size.height);
			//
			$("#floor-bar-tip-time").css({
				left: pos[0] + 40,
				top: pos[1] + 60
			}).html(time.to_time_str()).show();
		}).on("mouseout", function(){
			$("#floor-bar-tip-time").hide();
		});
	}
	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [10, 20, 30, 30]);
		vertical_scale[0].rangeBands([0, size.height - 2]);
		vertical_scale[1].rangeBands([0, size.height - 2]);
		line_generator[0].y0(function(){return vertical_scale[0].rangeBand()});
		line_generator[1].y0(function(){return vertical_scale[1].rangeBand()});
		//per_h.h0 = size.height / 17;
		var offset = tl_offset = size.width * 0.25;
		x_line_scale.range([0, size.width - offset]);
		//line_generator[0].y0(per_h.h0);
		
		g.selectAll("#floor-bar-aps, #floor-bar-tls, #floor-bar-ap-sel-tls")
			.attr("transform", "translate("+offset+")");
		g.select("#floor-bar-tl-x-axis")
			.attr("class", "x axis")
			.attr("transform", "translate("+offset+","+size.height+")");
		//
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
	var sel_height = 0, tls_height = 0;
	function update_sel_ap_bars(_data){
		return;
		var per_height = 30;
		var bars = g.select("#floor-bar-ap-sel-circles").selectAll("g.bar");
		if(_data){
			bars = bars.data(_data, function(d){return d.apid});
			var enter = bars.enter().append("g").attr("class", function(d){return "bar ap"});
			enter.append("rect").append("title");
			enter.append("text").attr("class", "label");
			enter.append("text").attr("class", "value");
			bars.exit().remove();
			//
			console.log("yOff", per_height, _data.length);
			var yOff = per_height * _data.length;
			sel_height = yOff;
			d3.select("#floor-bar-circles").attr("transform", "translate(0,"+yOff+")");
		}
		bars.each(function(d, i){
			var ele = d3.select(this);
			ele.attr("apid", d.apid);
			var _name = apMap.get(d.apid).name.split(/ap|f/);
			_name.shift();
			ele.select("rect").select("title").text(function(){
				return "persons(occur): " + d.count;
			});
			ele.select("text.label").text(_name.join("-"))
				.attr("x", -6).attr("y", vertical_scale[0].rangeBand()/2).attr("dy", 5);
			ele.select("text.value").text(d.count)
				.attr("x", circle_scale(d.count)).attr("y", vertical_scale[0].rangeBand()/2).attr("dy", 5);
			var dy = per_height * i;
			ele.select("rect").attr("height", vertical_scale[0].rangeBand() - 2)
				.attr("width", circle_scale(d.count));
			ele.transition().attr("transform", "translate(0,"+dy+")");
		});
		_change_svg_size();
	}
	function update_sel_ap_tls(_data){
		return;
		var per_height = 30;
		var all_tls = g.select("#floor-bar-ap-sel-tls").selectAll("g.tl");
		if(_data){
			// all_tls_data = _data;
			y_line_scale[0].range([per_height,0]);
			line_generator[0].y0(per_height);
			all_tls = all_tls.data(_data, function(d){return d.apid});
			var enter = all_tls.enter().append("g").attr("class",function(d){return "tl " + d.type});
			enter.append("path");
			all_tls.exit().remove();
			//
			var yOff = per_height * _data.length;
			sel_height = yOff;
			d3.select("#floor-bar-tls").attr("transform", "translate("+tl_offset+","+yOff+")");
		}
		all_tls.each(function(d, i){
			var ele = d3.select(this);
			ele.attr("apid", d.apid);
			var cmax = d3.max(d.tl_data, function(d){return d.count});
			y_line_scale[0].domain([0, cmax * 1.2]);
			ele.select('path').attr("d", line_generator[0](d.tl_data));
			var dy = per_height * i;
			ele.transition().attr("transform", "translate(0,"+dy+")");
		});
		_change_svg_size();
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
	// var horizon_data;
	function update_horizon_bars(_data){
		var bars = g.select("#floor-bar-circles").selectAll("g.bar");
		circle_scale.range([0, tl_offset-2]);
		if(_data && _data.length){
			// horizon_data = _data;
			vertical_scale[0].domain(_data.map(_tl_key));
			var cmax = d3.max(_data, function(d){return d.count});
			circle_scale.range([0, tl_offset-2]).domain([0, cmax]);
			bars = bars.data(_data, _tl_key);
			var enter = bars.enter().append("g").attr("class", function(d){return "bar "+d.type});
			enter.filter(function(d){return d.type ==  "ap"})
				.attr("transform", function(d){
					var dy = vertical_scale[0]("floor-" + d.floor);
					return "translate(0,"+dy+")";
				});
			enter.append("rect").append("title");
			enter.append("text").attr("class", "label");
			enter.append("text").attr("class", "value");
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
				ele.select("text.label").text("'"+d.floor+"")
					.attr("x", -6).attr("y", vertical_scale[0].rangeBand()/2).attr("dy", 5);
			}else{
				ele.attr("apid", d.apid);
				var _name = apMap.get(d.apid).name.split(/ap|f/);
				_name.shift();
				ele.select("rect").select("title").text(function(){
						return "persons(occur): " + d.count;
					});
				ele.select("text.label").text(_name.join("-"))
					.attr("x", -6).attr("y", vertical_scale[0].rangeBand()/2).attr("dy", 5);
			}
			ele.select("text.value").text(d.count)
				.attr("x", circle_scale(d.count)).attr("y", vertical_scale[0].rangeBand()/2).attr("dy", 5);
			var dy = vertical_scale[0](_tl_key(d));
			ele.select("rect").attr("height", vertical_scale[0].rangeBand() - 2)
				.attr("width", circle_scale(d.count));
			ele.transition().attr("transform", "translate(0,"+dy+")");
		});
		//
		bars.on("click", on_floor_click);
		//
		_change_svg_size();
		//
		function _tl_key(d){
			if(d.type == "floor"){
				return "floor-" + d.floor;
			}else{
				return "ap-" + d.apid;
			}
		}
	}
	// var all_tls_data;
	// var isDrag = false;// check whether it is drag or click event, if click, no drag move
	function update_all_tls(_data){
		var per_height = 30;
		vertical_scale[0].rangeBands([0, size.height]);
		per_height = vertical_scale[0].rangeBand();
		var all_tls = g.select("#floor-bar-tls").selectAll("g.tl");
		if(_data){
			// all_tls_data = _data;
			vertical_scale[0].domain(_data.map(_tl_key))
				.rangeBands([0, size.height]);
			per_height = vertical_scale[0].rangeBand();
			tls_height = per_height * _data.length;
			y_line_scale[0].range([vertical_scale[0].rangeBand(),0]);
			line_generator[0].y0(vertical_scale[0].rangeBand());
			all_tls = all_tls.data(_data, _tl_key);
			var enter = all_tls.enter().append("g").attr("class",function(d){return "tl " + d.type});
			enter.filter(function(d){return d.type ==  "ap"})
				.attr("transform", function(d){
					var dy = vertical_scale[0]("floor-" + d.floor);
					console.log(d.floor, dy);
					return "translate(0,"+dy+")";
				});
			enter.append("path");
			all_tls.exit().remove();
		}
		all_tls.order();
		all_tls.on("click", on_floor_click);
		all_tls.each(function(d){
			var ele = d3.select(this);
			if(d.type == "floor"){
				ele.attr("floor", d.floor);
				ele.select("path").style("stroke", function(d){return floor_color(d.floor)});
			}else{
				ele.attr("apid", d.apid);
			}
			var cmax = d3.max(d.tl_data, function(d){return d.count});
			y_line_scale[0].domain([0, cmax * 1.2]).range([vertical_scale[0].rangeBand(), 0]);
			ele.select('path').attr("d", line_generator[0](d.tl_data));
			var dy = vertical_scale[0](_tl_key(d));
			ele.transition().attr("transform", "translate(0,"+dy+")");
		});
		_change_svg_size();
		//
		function _tl_key(d){
			if(d.type == "floor"){
				return "floor-" + d.floor;
			}else{
				return "ap-" + d.apid;
			}
		}
	}
	function _change_svg_size(){
		// size.height = sel_height + tls_height + 30;
		// svg.height(size.height);
		g.select("#floor-bar-tl-x-axis")
			.attr("transform", "translate("+tl_offset+","+(size.height)+")");
		g.select("#floor-bar-tl-x-axis").call(time_axis.scale(x_line_scale));
	}
	function on_floor_click(d){
		if(d.type != "floor"){
			return;
		}
		if(d3.event.defaultPrevented) return; 
		var floor = +d.floor;
		var flag = false;// to be selected or not
		d3.selectAll("#floor-bar-circles, #floor-bar-tls").selectAll("g.bar.floor, g.tl.floor").filter(function(d){
			return d.floor == floor;
		}).classed("selected", function(d){
			var ele = d3.select(this);
			if(ele.attr("_selected")){
				ele.attr("_selected", null);
				return flag = false;
			}else{
				ele.attr("_selected", true);
				return flag = true;
			}
		});
		if(flag){
			EventManager.floorSelect([floor], FloorBar);
		}else{
			EventManager.floorDeselect([floor], FloorBar);
		}
		return;
	}
	$(window).resize(function(e){
		init_svg();
		update_all_tls();
		update_horizon_bars();
		update_sel_ap_bars();
		update_sel_ap_tls();
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

WFV.FloorBarFloorAps = function(timeFrom, timeTo){
	function FloorBarFloorAps(){}
	var floor_color = ColorScheme.floor;
	//
	var svg = $("#floor-bar-floor-aps-wrapper > svg"), size;
	var g = d3.select('#floor-bar-floor-aps-g');
	//
	var tl_offset;
	var x_scale = d3.time.scale(),
		y_scale = d3.scale.linear(),
		bar_scale = d3.scale.linear(),
		vertical_scale = d3.scale.ordinal();
	var tickFormat = d3.time.format.multi([
			["%I:%M", function(d) { return d.getMinutes(); }],
			["%H:%M", function(d) { return d.getHours(); }],
			["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
			["%b %d", function(d) { return d.getDate() != 1; }]
	]);
	var time_axis = d3.svg.axis().scale(x_scale).ticks(3).tickFormat(tickFormat);
	var line = d3.svg.area().interpolate("monotone")
		.x(function(d){return x_scale(d.time)})
		.y(function(d){return y_scale(d.count)})
		.y0(function(){return vertical_scale.rangeBand()});

	//
	var timePoint, timeRange = [timeFrom, timeTo],
		selFloors = [], curApidLst = [];
	var barDataByFloor;
	//
	var tipTimePoint = d3.tip().attr('class', 'd3-tip')
		.direction("nw")
		.offset(function(d){
			return [d[0],d[1]];
		}).html(function(d){
			var time = d[2];
			var f = d3.time.format("%Y-%m-%d %H:%M:%S");
			return f(time);
		});
	var tipAp= d3.tip().attr('class', 'd3-tip')
		.direction("sw")
		.offset(function(d){
			return [d[0],d[1]];
		}).html(function(d){
			var ap = d[2];
			var _name = apMap.get(ap.apid).name.split(/ap|f/);
			_name.shift();
			return "ap:" + _name.join("-") + "</br>"
				+ "apid:" + ap.apid + "</br>"
				+ "max online person:" + d.maxCount;
		});
	d3.select("#floor-bar-floor-aps-wrapper").select("svg").call(tipTimePoint);
	d3.select("#floor-bar-floor-aps-wrapper").select("svg").call(tipAp);
	//
	init_svg();
	init_interaction();
	//
	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [10, 20, 20, 30]);
		//
		var offset = tl_offset = size.width * 0.25;
		vertical_scale.rangeBands([0, size.height]);
		x_scale.range([0, size.width - offset]);
		bar_scale.range([0, offset - 6]);
		//
		//
		g.select(".ap-tls-g").attr("transform", "translate("+offset+")");
		g.select(".ap-tls-g").select(".x.axis")
			.attr("transform", "translate(0,"+size.height+")").call(time_axis.scale(x_scale));
	}
	function init_interaction(){
		g.select(".ap-tls-g").on("mousemove", function(d){
			var pos = d3.mouse(this);
			var time = x_scale.invert(pos[0]);
			d3.select(this).select("line.timepoint-line")
				.attr("x1", pos[0]).attr("y1", 0)
				.attr("x2", pos[0]).attr("y2", size.height);
			var p = [pos[1] - 10, pos[0] - 10, time];
			tipTimePoint.show(p,this);
		}).on("mouseout", function(d){
			tipTimePoint.hide();
		});
	}
	//
	ObserverManager.addListener(FloorBarFloorAps);
	FloorBarFloorAps.OMListen = function(message, data, sender){
		if(message == WFV.Message.FloorChange){
		}
		if(message ==  WFV.Message.FloorSelect){
			var floors = selFloors = data.floor, change = data.change, isAdd = data.isAdd;
			if(isAdd){
				var addBarData = change.map(function(f){
					return barDataByFloor[f-1].aps;
				});
				addBarData = Array.prototype.concat.apply([], addBarData);
				update_ap_bars(addBarData);
				//
				db_tl.tlDataApsOfFloors(timeRange[0], timeRange[1], 10, change, update_ap_tls);
				// check whether there are some old selected aps
				var oldSelAps = EventManager.selectedAps();
				console.log("old selected aps");
				g.selectAll(".ap-bars-g, .ap-tls-g").selectAll("g.tl, g.bar").filter(function(d){
					return oldSelAps.indexOf(d.apid) != -1;
				}).attr("_selected", true).classed("selected", true);
			}else{
				var removedApids = [];
				g.selectAll(".ap-bars-g, .ap-tls-g").selectAll("g.tl, g.bar").filter(function(d){
					if(change.indexOf(d.floor) != -1){
						removedApids.push(d.apid);
						return true;
					}
					return false;
				}).remove();
				curApidLst = _.difference(curApidLst, removedApids);
				update_ap_bars();
				update_ap_tls();
			}
		}
		if(message ==  WFV.Message.floorHover){

		}
		if(message ==  WFV.Message.ApHover){
			var apid = data.apid, change = data.change, isAdd = data.isAdd;
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return change.indexOf(d.apid) != -1;
			}).classed("hover", isAdd);
		}
		if(message ==  WFV.Message.ApSelect){
			var apid = data.apid, change = data.change, isAdd = data.isAdd;
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return change.indexOf(d.apid) != -1;
			}).classed("selected", isAdd).attr("_selected", isAdd ? "true" : null);
		}
		if(message ==  WFV.Message.TimeRangeChanged){
			timeRange = data.range;
			x_scale.domain(timeRange);
			db.ap_bar_data(timeRange[0], timeRange[1], function(data){
				barDataByFloor = data;	
				var newBarData = selFloors.map(function(floor){return barDataByFloor[floor-1].aps});
				newBarData = Array.prototype.concat.apply([], newBarData);
				update_ap_bars(newBarData);
			});
			db_tl.tlDataApsOfFloors(timeRange[0], timeRange[1], 10, selFloors, update_ap_tls);
			g.select(".ap-tls-g").select(".x.axis").call(time_axis.scale(x_scale));
		}
	}

	//
	function update_ap_bars(_data){
		// [{apid:, floor, count:, type:"ap"}]
		var items = g.select(".ap-bars-g").selectAll("g.bar");
		if(_data && _data.length){
			//
			items = items.data(_data, function(d){return d.apid});
			var enter = items.enter().append("g").attr("class", "bar");
			enter.append("rect").append("title");
			enter.append("text").attr("class", "label");
			enter.append("text").attr("class", "value");
			// 
			enter.each(function(d){
				curApidLst.push(d.apid);
			});
			//bars.exit().remove();
		}
		// to sort the slections  TODO
		items = g.select(".ap-bars-g").selectAll("g.bar");
		var tmpCurIds = [];
		items.sort(function(d1, d2){
			return d2.count - d1.count;	
		}).order().each(function(d){
			tmpCurIds.push(d.apid);
		});
		curApidLst = tmpCurIds;
		// update bar scale
		var cmax = 1;
		items.each(function(d){
			cmax = d.count > cmax ? d.count : cmax;	
		});
		bar_scale.domain([0, cmax]);
		//
		vertical_scale.domain(curApidLst);
		var per_height = vertical_scale.rangeBand();
		y_scale.range([per_height, 4]);
		//
		items.attr("apid", function(d){return d.apid})
			.each(function(d){
				var ele = d3.select(this);
				ele.select("rect").style("fill", floor_color(d.floor))
					.attr("height", per_height - 2)
					.attr("width", bar_scale(d.count))
					.select("title").text("persons(occur): " + d.count);
				var _name = apMap.get(d.apid).name.split(/ap|f/);
				_name.shift();
				ele.selectAll("text").attr("y", per_height/2).attr("dy", 5);
				ele.select("text.label").text(_name.join("-")).attr("x", -6)
					ele.select("text.value").text(d.count).attr("x", bar_scale(d.count)).attr("dy", 6);
			}).on("click", function(d){
				onApClick.call(this, d.apid);
			}).on("mousemove",function(d){
				onApHover(d.apid, true);
			}).on("mouseout", function(d){
				onApHover(d.apid, false);
			});
		items.transition().attr("transform", function(d){
			var dy = vertical_scale(d.apid);
			return "translate(0,"+dy+")";
		});
	}
	function update_ap_tls(_data){
		var items = g.select(".ap-tls-g").selectAll("g.tl");
		if(_data){
			items = items.data(_data, function(d){return d.apid});
			var enter = items.enter().append("g").attr("class", "tl");
			enter.append("path");
		}
		var per_height = vertical_scale.rangeBand();
		//
		items = g.select(".ap-tls-g").selectAll("g.tl");
		items.each(function(d){
			d.maxCount = d3.max(d.tl_data, function(d){return d.count});
		})
		//
		items.attr("apid", function(d){return d.apid})
			.each(function(d){
				var ele = d3.select(this);
				var cmax = d3.max(d.tl_data, function(d){return d.count});
				y_scale.domain([0, cmax || 1]);
				ele.select("path").attr("d", line(d.tl_data))
					.style("fill", floor_color(d.floor))
					.style("fill-opacity", "0.5")
					.style("stroke", "black");
			}).on("click", function(d){
				onApClick.call(this, d.apid);
			}).on("mouseenter",function(d){
				onApHover(d.apid, true);
			}).on("mousemove", function(d){
				var pos = d3.mouse(this);
				var p = [pos[1] - 10, pos[0] - 10, d];
				tipAp.show(p, this);
			}).on("mouseout", function(d){
				onApHover(d.apid, false);
				tipAp.hide();
			});
		items.transition().attr("transform", function(d){
			var dy = vertical_scale(d.apid);
			return "translate(0,"+dy+")";
		});
	}
	function onApHover(apid, f){
		g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
			return d.apid == apid;
		}).classed("hover", f);
	}
	function onApClick(apid){
		if(d3.select(this).attr("_selected")){
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return d.apid == apid;
			}).classed("selected",false).attr("_selected", null);
			EventManager.apDeselect([apid], FloorBarFloorAps);
		}else{
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return d.apid == apid;
			}).classed("selected",true).attr("_selected", true);
			EventManager.apSelect([apid], FloorBarFloorAps);
		}
	}
	//
	$(window).resize(function(){
		init_svg();
		update_ap_bars();
		update_ap_tls();
	});
	//
	return FloorBarFloorAps;
}

WFV.FloorBarSelAps = function(){
	function FloorBarSelAps(){}
	var floor_color = ColorScheme.floor;
	//
	var svg = $("#floor-bar-sel-aps-wrapper > svg"), size;
	var g = d3.select('#floor-bar-sel-aps-g');
	//
	var tl_offset;
	var x_scale = d3.time.scale(),
		y_scale = d3.scale.linear(),
		bar_scale = d3.scale.linear(),
		vertical_scale = d3.scale.ordinal();
	var tickFormat = d3.time.format.multi([
			["%I:%M", function(d) { return d.getMinutes(); }],
			["%H:%M", function(d) { return d.getHours(); }],
			["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
			["%b %d", function(d) { return d.getDate() != 1; }]
	]);
	var time_axis = d3.svg.axis().scale(x_scale).ticks(3).tickFormat(tickFormat);
	var line = d3.svg.area().interpolate("monotone")
		.x(function(d){return x_scale(d.time)})
		.y(function(d){return y_scale(d.count)})
		.y0(function(){return vertical_scale.rangeBand()});

	//
	var timePoint, timeRange = [timeFrom, timeTo],
		selFloors = [], curApidLst = [];
	var barDataByFloor, barDataMap;
	//
	var tipTimePoint = d3.tip().attr('class', 'd3-tip')
		.direction("nw")
		.offset(function(d){
			return [d[0],d[1]];
		}).html(function(d){
			var time = d[2];
			var f = d3.time.format("%Y-%m-%d %H:%M:%S");
			return f(time);
		});
	var tipAp= d3.tip().attr('class', 'd3-tip')
		.direction("sw")
		.offset(function(d){
			return [d[0],d[1]];
		}).html(function(d){
			var ap = d[2];
			var _name = apMap.get(ap.apid).name.split(/ap|f/);
			_name.shift();
			return "ap:" + _name.join("-") + "</br>"
				+ "apid:" + ap.apid + "</br>"
				+ "max online person:" + d.maxCount;
		});
	d3.select("#floor-bar-sel-aps-wrapper").select("svg").call(tipTimePoint);
	d3.select("#floor-bar-sel-aps-wrapper").select("svg").call(tipAp);
	//
	init_svg();
	init_interaction();
	//
	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [10, 20, 20, 30]);
		//
		var offset = tl_offset = size.width * 0.25;
		vertical_scale.rangeBands([0, size.height]);
		x_scale.range([0, size.width - offset]);
		bar_scale.range([0, offset - 6]);
		//
		//
		g.select(".ap-tls-g").attr("transform", "translate("+offset+")");
		g.select(".ap-tls-g").select(".x.axis")
			.attr("transform", "translate(0,"+size.height+")").call(time_axis.scale(x_scale));
	}
	function init_interaction(){
		g.select(".ap-tls-g").on("mousemove", function(d){
			var pos = d3.mouse(this);
			var time = x_scale.invert(pos[0]);
			d3.select(this).select("line.timepoint-line")
				.attr("x1", pos[0]).attr("y1", 0)
				.attr("x2", pos[0]).attr("y2", size.height);
			var p = [pos[1] - 10, pos[0] - 10, time];
			tipTimePoint.show(p,this);
		}).on("mouseout", function(d){
			tipTimePoint.hide();
		});
	}
	//
	ObserverManager.addListener(FloorBarSelAps);
	FloorBarSelAps.OMListen = function(message, data, sender){
		if(message == WFV.Message.FloorChange){
		}
		if(message ==  WFV.Message.FloorSelect){
		}
		if(message ==  WFV.Message.floorHover){
		}
		if(message ==  WFV.Message.ApHover){
			var apid = data.apid, change = data.change, isAdd = data.isAdd;
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return change.indexOf(d.apid) != -1;
			}).classed("hover", isAdd);
		}
		if(message ==  WFV.Message.ApSelect){
			var apid = data.apid, change = data.change, isAdd = data.isAdd;
			if(isAdd){
				var newBarData = change.map(function(d){return barDataMap.get(d)});
				update_ap_bars(newBarData);
				//
				db_tl.tlDataAps(timeRange[0], timeRange[1], 10, change, update_ap_tls);
			}else{
				g.selectAll(".ap-bars-g, .ap-tls-g").selectAll("g.tl, g.bar").filter(function(d){
					return change.indexOf(d.apid) != -1;
				}).remove();
				curApidLst = _.difference(curApidLst, change);
				update_ap_bars();
				update_ap_tls();
			}
		}
		if(message ==  WFV.Message.TimeRangeChanged){
			timeRange = data.range;
			x_scale.domain(timeRange);
			db.ap_bar_data(timeRange[0], timeRange[1], function(data){
				barDataMap = data;	
				var newBarData = curApidLst.map(function(apid){return barDataMap.get(apid)});
				update_ap_bars(newBarData);
			}, true);
			//
			db_tl.tlDataAps(timeRange[0], timeRange[1], 10, curApidLst, update_ap_tls);
			g.select(".ap-tls-g").select(".x.axis").call(time_axis.scale(x_scale));
		}
	}

	//
	function update_ap_bars(_data){
		// [{apid:, floor, count:, type:"ap"}]
		var items = g.select(".ap-bars-g").selectAll("g.bar");
		if(_data && _data.length){
			//
			items = items.data(_data, function(d){return d.apid});
			var enter = items.enter().append("g").attr("class", "bar");
			enter.append("rect").append("title");
			enter.append("text").attr("class", "label");
			enter.append("text").attr("class", "value");
			// 
			enter.each(function(d){
				curApidLst.push(d.apid);
			});
			//bars.exit().remove();
		}
		// to sort the slections  TODO
		items = g.select(".ap-bars-g").selectAll("g.bar");
		var tmpCurIds = [];
		items.sort(function(d1, d2){
			return d2.count - d1.count;	
		}).order().each(function(d){
			tmpCurIds.push(d.apid);
		});
		curApidLst = tmpCurIds;
		// update bar scale
		var cmax = 1;
		items.each(function(d){
			cmax = d.count > cmax ? d.count : cmax;	
		});
		bar_scale.domain([0, cmax]);
		//
		vertical_scale.domain(curApidLst);
		var per_height = vertical_scale.rangeBand();
		y_scale.range([per_height, 4]);
		//
		items.attr("apid", function(d){return d.apid})
			.each(function(d){
				var ele = d3.select(this);
				ele.select("rect").style("fill", floor_color(d.floor))
					.attr("height", per_height - 2)
					.attr("width", bar_scale(d.count))
					.select("title").text("persons(occur): " + d.count);
				var _name = apMap.get(d.apid).name.split(/ap|f/);
				_name.shift();
				ele.selectAll("text").attr("y", per_height/2).attr("dy", 5);
				ele.select("text.label").text(_name.join("-")).attr("x", -6)
					ele.select("text.value").text(d.count).attr("x", bar_scale(d.count)).attr("dy", 6);
			}).on("click", function(d){
				onApClick.call(this, d.apid);
			}).on("mousemove",function(d){
				onApHover(d.apid, true);
			}).on("mouseout", function(d){
				onApHover(d.apid, false);
			});
		items.transition().attr("transform", function(d){
			var dy = vertical_scale(d.apid);
			return "translate(0,"+dy+")";
		});
	}
	function update_ap_tls(_data){
		var items = g.select(".ap-tls-g").selectAll("g.tl");
		if(_data){
			items = items.data(_data, function(d){return d.apid});
			var enter = items.enter().append("g").attr("class", "tl");
			enter.append("path");
		}
		var per_height = vertical_scale.rangeBand();
		//
		items = g.select(".ap-tls-g").selectAll("g.tl");
		items.each(function(d){
			d.maxCount = d3.max(d.tl_data, function(d){return d.count});
		})
		//
		items.attr("apid", function(d){return d.apid})
			.each(function(d){
				var ele = d3.select(this);
				var cmax = d3.max(d.tl_data, function(d){return d.count});
				y_scale.domain([0, cmax || 1]);
				ele.select("path").attr("d", line(d.tl_data))
					.style("fill", floor_color(d.floor))
					.style("fill-opacity", "0.5")
					.style("stroke", "black");
			}).on("click", function(d){
				onApClick.call(this, d.apid);
			}).on("mouseenter",function(d){
				onApHover(d.apid, true);
			}).on("mousemove", function(d){
				var pos = d3.mouse(this);
				var p = [pos[1] - 10, pos[0] - 10, d];
				tipAp.show(p, this);
			}).on("mouseout", function(d){
				onApHover(d.apid, false);
				tipAp.hide();
			});
		items.transition().attr("transform", function(d){
			var dy = vertical_scale(d.apid);
			return "translate(0,"+dy+")";
		});
	}
	function onApHover(apid, f){
		g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
			return d.apid == apid;
		}).classed("hover", f);
	}
	function onApClick(apid){
		if(d3.select(this).attr("_selected")){
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return d.apid == apid;
			}).classed("selected",false).attr("_selected", null);
			EventManager.apDeselect([apid], FloorBarSelAps);
		}else{
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return d.apid == apid;
			}).classed("selected",true).attr("_selected", true);
			EventManager.apSelect([apid], FloorBarSelAps);
		}
	}
	//
	$(window).resize(function(){
		init_svg();
		update_ap_bars();
		update_ap_tls();
	});
	//
	return FloorBarSelAps;
}
