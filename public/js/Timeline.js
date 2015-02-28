WFV.Timeline = function(_time_range){
	function Timeline(){}
	//
	var svg = $("#timeline-svg"), size;
	var g = d3.select("#timeline-g").attr("class", "timeline");
	//
	var all_time_range = _time_range, time_range, time_point; 
	console.log(all_time_range);
	var x = d3.time.scale().domain(all_time_range),
		y = d3.scale.linear(), y_floor = d3.scale.linear();
	var xAxis = d3.svg.axis().scale(x).orient("bottom")
		.tickSize(2,0,4).tickSubdivide(0);
		//.tickFormat(function(d){return new Date(d).to_24_str()});
	var yAxis = d3.svg.axis().scale(y).orient("left")
		.tickFormat(d3.format(",.0f"));
	var line = d3.svg.line()//.interpolate("monotone")
			.x(function(d){return x(d.time)})
			.y(function(d){return y(d.count)})
			//.x0(function(d){ return x(d.time)})
			//.y0(function(d){return y(0)});
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
			ObserverManager.post(WFV.Message.TimePointChange, {time: time_point});
		}
		ObserverManager.post(WFV.Message.TimeRangeChange, {range: time_range});
	}
	function onBrushEnd(){
		if(!d3.event.sourceEvent) return;
		var range = d3.event.target.extent();
		var step = TIME_STEP[step_by] * step_count;
		if(brush.empty() || range[1] - range[0] < step){
			range = all_time_range;
		}
		ObserverManager.post(WFV.Message.TimeRangeChanged, {range: time_range});
	}
	//
	var current_floor, sel_aps, 
		floor_data_status = d3.range(0,18).map(function(){return false});
	//
	var step_by = "hour", step_count = 1;
	var TIME_STEP = WFV.TIME_STEP;
	var TIMELINE_TYPE = {
		all: "timeline_type_all",
		floor: "timeline_type_floor",
		ap: "timeline_type_ap"
	}

	init_svg();

	(function(){// append 1-17 floor lines, init invisible
		var fls = g.select("#timeline-floor")
			.selectAll("g.line").data(d3.range(1,18));
		fls.enter().append("g").attr("class", "line").append("path");
		fls.attr("floor", function(d){return d})
			.attr("id", function(d){return "tl-floor-"+d})
			.attr("visibility", "hidden");
	})();

	g.select("#timeline-basic").attr("class", "line").append("path");
	_timeline_data(TIMELINE_TYPE.all, null, update_basic_timeline);
	
	ObserverManager.post(WFV.Message.TimeRangeChanged, {range: all_time_range});

	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [0, 20, 20,40]);
		x.range([0, size.width]).nice();
		y.range([size.height, 0]).nice();
		y_floor.range([size.height, 0]).nice();
		g.select("#x-axis").attr("class", "x axis")
			.attr("transform", "translate(0,"+size.height+")")
			.call(xAxis);
		g.select("#y-axis").attr("class", "y axis")
			.attr("transform", "translate(0,0)")
			.call(yAxis);
		//
		g.select("#brush").attr("class", "brush")
			.call(brush).selectAll("rect").attr("height", size.height);
	}
	//
	ObserverManager.addListener(Timeline);
	Timeline.OMListen = function(message, data){
		if(message == WFV.Message.FloorChange){
			console.log("timeline on floor change", data.floor)
			current_floor = +data.floor;
			g.select("#timeline-floor")
				.selectAll(" g.line").style("visibility", "hidden");
			g.select("#tl-floor-"+current_floor).style("visibility", "visible");
			if(!floor_data_status[current_floor]){
				_timeline_data(TIMELINE_TYPE.floor, current_floor, function(_data){
					update_floor_timeline(_data);
					floor_data_status[current_floor] = true;
				});
			}
		}
		if(message == WFV.Message.ApSelect){
			// TODO
		}
		if(message == WFV.Message.ApDeselect){
			// TODO
		}
		if(message == WFV.Message.TimePointChange){
			// TODO
		}
		if(message == WFV.Message.TimeRangeChange){
			// TODO	
		}
	}
	function init_interaction(){
		// TODO
	}
	$(window).resize(function(e){
		init_svg();
		update_basic_timeline();
		update_floor_timeline();
		update_ap_timeline();
	});
	//
	function update_basic_timeline(_data){
		// {time:[],count:[];,values:[]}
		// if no _data, update
		var tl = g.select("#timeline-basic").select("path");
		if(_data){
			y.domain([0, d3.max(_data,function(d){return d.count})]);
			g.select("#y-axis").call(yAxis);
			tl.datum(_data);
		}
		tl.attr("d", line)
	}
	function update_ap_timeline(_data){
		// {time:,count;,values:[], apid:}
		// if _data, add; no _data, update
		if(_data){
			var tl = d3.select("#timeline-ap")
				.append("g").attr("class","line").datum(_data)
				.attr("apid", function(d){return d.apid});
			tl.append("path").datum(function(d){return d})
				.attr("d", line);
		}else{
			var tl = d3.select("#timeline-ap").selectAll("g.line");
			var lines = tl.select("path").attr("d", line);
		}
	}
	function update_floor_timeline(_data){
		// {time:,count;,values:[],floor:}
		// if _data, add; no _data, update
		if(_data){
			var tl = d3.select("#timeline-floor")
				.select("#tl-floor-"+_data.floor).datum(_data);
			tl.select("path").datum(function(d){return d})
				.attr("d", line);
				//.attr("visibility", "visible");
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
			db.tl_data_apid(from, to, step, apid, cb);
		}else{
			console.warn("unkonw timeline type");
		}
	}
	return Timeline;
}

WifiVis.TimelineBrush = function(timeline, opt){
	function TimelineBrush(){};
	//
	var g = timeline.g, x = timeline.x, y = timeline.y, tl = timeline;
	var brushClass = opt && opt.brushClass || "brush",
			BRUSH_LOCK = false, IN_SELECTION = false, ALL_DEFAULT = true;
	// some functiion
	var validateExtent = defaultValidateExtent,
			adjustExtent;
	var onBrushStart = function(){},
			onBrushMove = function(){},
			onBrushEnd = function(){};

	// clear odl brush
	g.select("g.brush").remove();
	g.select("g."+brushClass).remove();
	var brush, extent, gBrush = g.append("g").attr("class", brushClass);

	setBrush();
	TimelineBrush.addBrushStartListener = function(obj){
		addEventListener(TimelineBrush.EventType.EVENT_BRUSH_START, obj);
		return TimelineBrush;
	}
	TimelineBrush.addBrushMoveListener = function(obj){
		addEventListener(TimelineBrush.EventType.EVENT_BRUSH_MOVE, obj);
		return TimelineBrush;
	}
	TimelineBrush.addBrushEndListener = function(obj){
		addEventListener(TimelineBrush.EventType.EVENT_BRUSH_END, obj);
		return TimelineBrush;
	}
	/*
	 *
	 */
	function setBrush(){
		console.log(x.range(), x.domain());
		brush = d3.svg.brush().x(x)
			.on("brushstart",cbBrushStart)
			.on("brush", cbBrushMove)
			.on("brushend", cbBrushEnd);
		gBrush.call(brush).selectAll("rect").attr("height", tl.size.height);
		//gBrush.selectAll("rect.extent").style("fill", "rgba(255,255,255,0.5)");
	}
	/*
	 * call back function for brush
	 */
	function cbBrushStart(){
		console.log("brush begin");
		gBrush.classed("active", true);
		BRUSH_LOCK = true;
		extent = null;
		onBrushStart();
		fireEvent(TimelineBrush.EventType.EVENT_BRUSH_START);
	}
	function cbBrushMove(){
		//console.log("brush move");
		var e = d3.event.target.extent();
		if(adjustExtent){
			e = adjustExtent(e);
		}
		extent = e;
		onBrushMove(e);
		fireEvent(TimelineBrush.EventType.EVENT_BRUSH_MOVE, e);
	}
	function cbBrushEnd(){
		console.log("brush end");
		var e = d3.event.target.extent();	
		//utils.log(["brush extent:", e]);
		//utils.log(["extent distence",e[1] - e[0]], 1);
		if(adjustExtent){
			//utils.log(["extent before adjust:", e[0].getTime(), e[1].getTime()]);
			e = e.map(adjustExtent);
			//utils.log(["extent after adjust:", e[0].getTime(), e[1].getTime()]);
			//d3.select(this).transition().call(brush.extent(e)).call(brush.event);
		}
		if(!validateExtent(e)){
			if(ALL_DEFAULT){
				e = x.domain();
			}else{
				IN_SELECTION = false;
				utils.log(["brush, no selection"], 1);
				updateBrushTag(true);
				return;
			}
		}
		extent = e;
		//
		onBrushEnd(e);
		fireEvent(TimelineBrush.EventType.EVENT_BRUSH_END, e);
		//
		updateBrushTag(false, e);
		//
		IN_SELECTION = true;
		BRUSH_LOCK = false;
	}
	/*
	 * update brush selection tag
	 *
	 */
	function updateBrushTag(isRemoveAll, e0, e1){
		if(isRemoveAll){
			gBrush.selectAll("g.brush-tag").remove();
			return;
		}
	}
	/*
	 * some default function
	 */
	function defaultValidateExtent(e){
		var e0 = e[0], e1 = e[1];
		if(e0 instanceof Date && e1 instanceof Date){
			return Math.abs(e1 - e0) > 1000;
		}
		return e0 !== e1;
	}
	function defaultAdjustExtent(e0){
		return e0;
	}
	/*
	 * validateExtent
	 * chech whether the select exent a validate extent
	 */
	TimelineBrush.validateExtent = function(f){
		if(f){
			validateExtent = f;
			return TimelineBrush;
		}
		return validateExtent;
	};
	/*
	 * adjustExtent
	 * adjust extent
	 */
	TimelineBrush.adjustExtent = function(f){
		if(f){
			adjustExtent = f.bind(TimelineBrush);
			return TimelineBrush;
		}
		return adjustExtent;
	};
	TimelineBrush.onBrushStart = function(f){
		if(f){
			onBrushStart = f.bind(TimelineBrush);
			return TimelineBrush;
		}
		return onBrushStart;
	}
	TimelineBrush.onBrushMove = function(f){
		if(f){
			onBrushMove = f.bind(TimelineBrush);
			return TimelineBrush;
		}
		return onBrushMove;
	}
	TimelineBrush.onBrushEnd = function(f){
		if(f){
			onBrushEnd = f.bind(TimelineBrush);
			return TimelineBrush;
		}
		return onBrushEnd;
	}
	return TimelineBrush;
};
