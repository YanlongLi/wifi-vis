WFV.FloorBar_ = function(){
	function FloorBar(){}
	// variables
	var wrapper = $("#floor-bar-wrapper"),
		svg = $("#floor-bar-wrapper > svg");
	d3.select("#floor-bar-wrapper > svg")
		.attr("width", "100%").attr("height", "100%");
	var g = d3.select("#floor-bar"), size;
	var per_h, w_bar, bar_gap = 2, max_ap_number;
	var circle_scale = d3.scale.log().clamp(true),
		y_bar_scale    = d3.scale.linear(),
		x_line_scale   = d3.time.scale(),
		y_line_scale   = d3.scale.linear(),
		line_generator = d3.svg.line()
			.x(function(d){return x_line_scale(d.time)})
			.y(function(d){return y_line_scale(d.count)});
	
	//
	var selected_aps = [], current_floor;
	var time_range, time_point;
	//
	init_svg();
	
	update_ap_bars((function(){
		var _data = d3.range(1,18).map(function(d){
			var o = {floor:d};
			o.aps = d3.range(1, Math.random()*20).map(function(d){
				var ap = {apid:d};
				ap.count = Math.random() * 100 +1;
				return ap;
			})
			o.count = d3.sum(o.aps, function(ap){return ap.count});
			return o;
		});
		return _data;
	})());

	init_interaction();
	/*
	 * Event Listen
	 */
	ObserverManager.addListener(FloorBar);
	FloorBar.OMListen = function(message, data){
		if(message == WFV.Message.FloorChange){
			current_floor = data.floor;
			$("#floor-bar-circles .floor").attr("class","floor");
			$(data._this).attr("class", "floor selected");
		}
		if(message == WFV.Message.ApSelect){
			var ids = data.apid;
			ids.forEach(function(apid){
				var bar = $("#floor-bar-aps .floor .bar[apid="+apid+"]");
				bar.attr("class", "bar selected");
			});
		}
		if(message == WFV.Message.ApDeSelect){
			var ids = data.apid;
			ids.forEach(function(apid){
				var bar = $("#floor-bar-aps .floor .bar[apid="+apid+"]");
				bar.attr("class", "bar");
			});
		}
	}
	function init_interaction(){
		$(document).on("click", "#floor-bar-circles .floor", function(e){
			var data = {_this: this, floor: $(this).attr("floor-id")}
			ObserverManager.post(WFV.Message.FloorChange, data);
		});
		$(document).on("click", "#floor-bar-aps .floor .bar", function(e){
			if($(this).attr("_selected")){
				$(this).attr("_selected", null);
				var data = {_this: this, apid: [$(this).attr("apid")]}
				ObserverManager.post(WFV.Message.ApDeSelect, data);
				return;
			}else{
				$(this).attr("_selected", true);
				var data = {_this: this, apid: [$(this).attr("apid")]}
				ObserverManager.post(WFV.Message.ApSelect, data);
			}
		});
		$(document).on("mouseenter", "#floor-bar-aps .floor .bar", function(e){
			if($(this).attr("_selected")){
				return;
			}
			var data = {_this: this, apid: [$(this).attr("apid")]}
			ObserverManager.post(WFV.Message.ApSelect, data);
		});
		$(document).on("mouseleave", "#floor-bar-aps .floor .bar", function(e){
			if($(this).attr("_selected")){
				return;
			}
			var data = {_this: this, apid: [$(this).attr("apid")]}
			ObserverManager.post(WFV.Message.ApDeSelect, data);
		});

		
	}

	//setTimeout(change_view, 1000);

	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [20]);
		per_h = size.height / 17;
		g.selectAll("#floor-bar-aps, #floor-bar-tls")
			.attr("transform", "translate("+per_h+")");
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
	//
	function change_time_range(range, time){
		time_range = range;
		x_line_scale.domain(time_range);
		// TODO
		// update_ap_bars(), update_floor_tls()
	}

	function chagne_time_point(time){
		time_point = time;
		// TODO
	}
	function update_floor_circle(_data){
		// [{floor:, count:}]	
		// if no _data, update size
		var scale = circle_scale.range([0, per_h/2]);
		var floors = g.select("#floor-bar-circles").selectAll("g.floor");
		if(_data){
			var extent = d3.extent(_data, function(d){return d.count});
			extent[0] = extent[0] ? extent[0] : 1;
			scale.domain(extent);
			floors = floors.data(_data, function(d){return d.floor});
			var floors_enter = floors.enter().append("g").attr("class","floor");
			floors_enter.append("circle");
			floors.attr("floor-id", function(d){return d.floor});
		}
		floors.select("circle").datum(function(d){return d})
			.attr("cx", per_h/2).attr("cy", per_h/2)
			.attr("count",function(d){return d.count})
			.attr("r", function(d){
				var r = scale(d.count);
				return  isNaN(r) || r < 1 ? 1 : r;
			});
		floors.transition().attr("transform", function(d,i){
			var dy = per_h * (d.floor - 1);
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
			var all_aps = Array.prototype.concat.apply([], _data.map(function(d){
				return d.aps
			}));
			var extent = d3.extent(all_aps, function(d){return d.count+2});
			extent[0] = 0;
			scale.domain(extent);
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
		floors.each(function(d){
			// sort ap bars
			var bars = d3.select(this).selectAll("g.bar").sort(function(d1, d2){
				var a = d1.count, b = d2.count;
				return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
			});
			bars.transition().attr("transform", function(d,i){
				var dx = i * w_bar;
				return "translate("+dx+")";
			});
			bars.select("rect").attr("x", bar_gap).attr("y", function(d){
				return dy = scale(d.count);
			}).attr("width", w_bar - bar_gap)
			.attr("height", function(d){
				var h = per_h - scale(d.count);
				return h < 1 ? 1 : h;
			});
		})
		floors.transition().attr("transform", function(d,i){
			var dy = per_h * (d.floor - 1);
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
		x_line_scale.range([0, size.width - per_h]);
		y_line_scale.range([per_h, 0]);
		if(_data){
			var extents = _data.map(function(d){
				return d3.extent(d.tl_data, function(d){return d.count});
			})
			var extent = d3.extent(Array.prototype.concat.apply([], extents));
			extent[0] = 0;
			y_line_scale.domain(extent);
			//
			floors = floor.data(_data, function(d){return d.floor});
			var floor_enter = floor.enter().append("g").attr("class", "floor");
			floor_enter.append("path");
		}
		floors.selectAll("path").datum(function(d){return d})
			.attr("d", line_generator);
		floors.transition().attr("transform", function(d,i){
			var dy = per_h * (d.floor - 1);
			return "translate(0,"+dy+")";
		});
	}
	$(window).resize(function(e){
		init_svg();
		// update_floor_circle();
		update_ap_bars();
	});

	return FloorBar;
}
