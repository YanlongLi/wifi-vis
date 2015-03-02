WFV.FloorBar_ = function(){
	function FloorBar(){}
	// variables
	var wrapper = $("#floor-bar-wrapper"),
		svg = $("#floor-bar-wrapper > svg");
	d3.select("#floor-bar-wrapper > svg")
		.attr("width", "100%").attr("height", "100%");
	var g = d3.select("#floor-bar"), size;
	var per_h, w_bar, bar_gap = 2, max_ap_number = 24;
	var circle_scale = d3.scale.log().clamp(true),
		y_bar_scale    = d3.scale.linear(),
		x_line_scale   = d3.time.scale(),
		y_line_scale   = d3.scale.linear(),
		line_generator = d3.svg.line().interpolate("monotone")
			.x(function(d){return x_line_scale(d.time)})
			.y(function(d){return y_line_scale(d.count)});
	var time_axis = d3.svg.axis().scale(x_line_scale)
		.orient("bottom")
		.tickFormat(d3.time.format("%H:%M")).ticks(5);
	//
	var selected_aps = [], current_floor;
	var time_range, time_point;
	//
	init_svg();

	init_interaction();

	/*
	 * Event Listen
	 */
	ObserverManager.addListener(FloorBar);
	FloorBar.OMListen = function(message, data){
		if(message == WFV.Message.FloorChange){
			current_floor = data.floor;
			$("#floor-bar-circles .floor").attr("class","floor");
			$("#floor-bar-circles .floor[floor-id="+current_floor+"]")
				.attr("class", "floor selected");
			//$(data._this).attr("class", "floor selected");
			var sels = $("#floor-bar-aps .floor g.selected");
			sels.attr("class", "bar").attr('_selected', null);
			var apids = sels.map(function(){
					return $(this).attr("apid");
				}).get();
			apids.length && ObserverManager.post(WFV.Message.ApDeSelect, {apid:apids, click:true});
		}
		if(message == WFV.Message.ApSelect){
			var ids = data.apid;
			ids.forEach(function(apid){
				var bar = $("#floor-bar-aps .floor .bar[apid="+apid+"]");
				bar.attr("class", "bar selected");
				if(data.click){
					bar.attr("_selected", true);	
				}
			});
		}
		if(message == WFV.Message.ApDeSelect){
			var ids = data.apid;
			ids.forEach(function(apid){
				var bar = $("#floor-bar-aps .floor .bar[apid="+apid+"]");
				bar.attr("class", "bar");
				if(data.click){
					bar.attr("_selected", null);
				}
			});
		}
		if(message == WFV.Message.TimeRangeChanged){
			time_range = data.range;
			x_line_scale.domain(time_range);
			g.select("#floor-bar-tl-x-axis").call(time_axis.scale(x_line_scale));
			db.ap_bar_data(time_range[0], time_range[1], update_ap_bars);
			// floor tl data
			var step = 1000 * 60 * 20;
			(function next_f(f, _data, cb){
				if(f < 18){
					db.tl_data_floor(time_range[0], time_range[1], step, f, function(d){
						_data.push({floor:f, tl_data:d});
						next_f(f+1, _data, cb);
					});
				}else{
					console.log("floor bar on time range chagned, tl data");
					console.log(_data.length);
					console.log(_data.map(function(d){return d.tl_data.length}));
					cb(_data);
				}
			})(1, [], update_floor_tls);
			
		}
		if(message == WFV.Message.TimePointChange){
			// TODO
		}
	}
	function init_interaction(){
		// for floor circle
		$(document).on("click", "#floor-bar-circles .floor", function(e){
			var data = {floor: $(this).attr("floor-id")}
			console.log("floor changed", data.floor);
			ObserverManager.post(WFV.Message.FloorChange, data);
		});
		$(document).on("mouseenter", "#floor-bar-circles .floor", function(e){
			d3.select(this).classed("hover", true);
			var sel_f = $(this).attr("floor-id");
			console.log("floor select", sel_f);
			ObserverManager.post(WFV.Message.FloorSelect, {floor:[sel_f]});
		});
		$(document).on("mouseleave", "#floor-bar-circles .floor", function(e){
			d3.select(this).classed("hover", false);
			var sel_f = $(this).attr("floor-id");
			ObserverManager.post(WFV.Message.FloorDeSelect, {floor:[sel_f]});
		});
		// for bars
		$(document).on("click", "#floor-bar-aps .floor .bar", function(e){
			if($(this).attr("_selected")){
				$(this).attr("_selected", null);
				var data = {apid: [$(this).attr("apid")], click: true}
				ObserverManager.post(WFV.Message.ApDeSelect, data);
				return;
			}else{
				$(this).attr("_selected", true);
				var data = {apid: [$(this).attr("apid")], click: true};
				ObserverManager.post(WFV.Message.ApSelect, data);
			}
		});
		$(document).on("mouseenter", "#floor-bar-aps .floor .bar", function(e){
			if($(this).attr("_selected")){
				d3.select(this).classed("hover", true);
				return;
			}
			var data = {apid: [$(this).attr("apid")]}
			ObserverManager.post(WFV.Message.ApSelect, data);
		});
		$(document).on("mouseleave", "#floor-bar-aps .floor .bar", function(e){
			if($(this).attr("_selected")){
				d3.select(this).classed("hover", false);
				return;
			}
			var data = {apid: [$(this).attr("apid")]}
			ObserverManager.post(WFV.Message.ApDeSelect, data);
		});
	}

	setTimeout(change_view, 2000);

	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [20]);
		per_h = size.height / 17;
		x_line_scale.range([0, size.width - per_h]);
		y_line_scale.range([per_h, 0]);
		//line_generator.y0(per_h);
		g.selectAll("#floor-bar-aps, #floor-bar-tls")
			.attr("transform", "translate("+per_h+")");
		g.select("#floor-bar-tl-x-axis")
			.attr("class", "x axis")
			.attr("transform", "translate("+per_h+","+size.height+")");
	}
	// change view between tls and ap bars
	function change_view(){
		if(g.select("#floor-bar-aps").style("visibility") == "visible"){
			g.select("#floor-bar-aps").style("visibility", "hidden");
			g.select("#floor-bar-tls").style("visibility", "visible");
		}else{
			g.select("#floor-bar-aps").style("visibility", "visible");
			g.select("#floor-bar-tls").style("visibility", "hidden");
		}
	}
	function chagne_time_point(time){
		time_point = time;
		// TODO
	}
	function update_floor_circle(_data){
		// [{floor:, count:}]	
		// if no _data, update size
		var scale = circle_scale.range([2, per_h/2]);
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
			floors.attr("floor-id", function(d){return d.floor});
		}
		floors.sort(_sort_by_floor);
		floors.select("circle").datum(function(d){return d})
			.attr("cx", per_h/2).attr("cy", per_h/2)
			.attr("count",function(d){return d.count})
			.attr("r", function(d){
				console.log("count at floor",d.floor, d.count);
				var r = scale(d.count);
				return  isNaN(r) || r < 1 ? 1 : r;
			});
		floors.transition().attr("transform", function(d,i){
			//var dy = per_h * i;
			var dy = per_h * i;
			return "translate(0,"+dy+")";
		});
	}
	function update_ap_bars(_data){
		// [{floor:,aps:[{apid:, count:}]}]
		// if no _data, resize ap_bars
		var scale = y_bar_scale.range([per_h, 0]);
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
		w_bar = (size.width - per_h) / max_ap_number;
		floors.sort(_sort_by_floor);
		floors.attr("floor", function(d){return d.floor}).each(function(d){
			// sort ap bars
			var bars = d3.select(this).selectAll("g.bar")
				.data(function(d){return d.aps}, function(d){return d.apid})
				.sort(function(d1, d2){
					//var a = d1.count, b = d2.count;
					var a = d1.apid, b = d2.apid;
					return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NbN;
			});
			bars.transition().attr("transform", function(d,i){
				var dx = i * w_bar;
				return "translate("+dx+")";
			});
			bars.select("rect").attr("x", bar_gap).attr("y", function(d){
				return scale(d.count);
			}).attr("width", w_bar - bar_gap)
			.attr("height", function(d){
				var h = per_h - scale(d.count);
				return h < 1 ? 1 : h;
			});
		});
		floors.transition().attr("transform", function(d,i){
			//var dy = per_h * i
			var dy = per_h * (d.floor -1);
			return "translate(0,"+dy+")";
		});
		if(_data){
			update_floor_circle(_data);
		}else{
			update_floor_circle();
		}
	}
	function update_floor_tls(_data){
		// assume time_range.domain already been set
		// [{floor:, tl_data:[{time:, count:}]}]
		// if no _data, resize timelines
		var floors = g.select("#floor-bar-tls").selectAll("g.floor");
		//x_line_scale.range([0, size.width - per_h]);
		//y_line_scale.range([per_h, 0]);
		if(_data){
			var cmax = d3.max(_data, function(d){
				return d3.max(d.tl_data, function(d){return d.count});
			});
			(cmax <= 0) && (console.warn("illegal cmax", cmax));
			y_line_scale.domain([0, cmax]);
			console.log("floor bar tl scale", y_line_scale.domain(), y_line_scale.range());
			//
			floors = floors.data(_data, function(d){return d.floor});
			var floor_enter = floors.enter().append("g").attr("class", "floor");
			floor_enter.append("path");
		}
		floors.sort(_sort_by_floor);
		floors.attr("id", function(d){
			return "floor-bar-tl-"+d.floor;
		}).each(function(d){
			d3.select(this).select("path").datum(function(d){return d.tl_data})
				.attr("d", line_generator);
		});
		floors.transition().attr("transform", function(d,i){
			var dy = per_h * i;
			return "translate(0,"+dy+")";
		});
	}
	$(window).resize(function(e){
		init_svg();
		// update_floor_circle();
		update_ap_bars();
	});
	function _sort_by_floor(f1, f2){
		var a = f1.floor, b = f2.floor;
		return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
	}

	return FloorBar;
}