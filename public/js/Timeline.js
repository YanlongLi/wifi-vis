//var d3 = require("d3");
//var utils = require("./utils");
/*
 * Timeline()
 * _data: raw data
 * id: element id
 * opt.size: timeline size
 * opt.tid: timeline id
 * opt.style: element style class
 */
WifiVis.Timeline = function(id, opt){
	function Timeline(){}
	//
	var data;
	var g = d3.select(id),
			tid = opt.tid || (100 + Math.round(Math.random() * 100)),
			size;
	g.attr("class", opt.style || "timeline");
	var x = d3.time.scale(), y = d3.scale.linear(),
			xAxis = d3.svg.axis(), yAxis = d3.svg.axis(),line,
			extent;
	xAxis = d3.svg.axis().scale(x).orient("bottom")
		.tickSize(2,0,4).tickSubdivide(0);
	yAxis = d3.svg.axis().scale(y).orient("left").ticks(4);

	g.append("g").attr("id", "timeline-x-axis-"+ tid).attr("class","x axis");
//		.attr("transform", "translate(0,"+size.height+")")
	g.append("g").attr("id", "timeline-y-axis-"+ tid).attr("class","y axis");

	g.append("path").attr("class", "basic-timeline");
	g.append("g").attr("class","timeline-dot");
	var shownData, strokeColor;
	var brushLst = [];
	//
	Timeline.set_step = set_step;
	Timeline.set_range = set_range;
	Timeline.update = update;
	Timeline.add_brush= addBrush;
	Timeline.set_size= function(_){
		if(_){
			size = _;
			console.log("init timeline size:", _);
			return Timeline;
		}
		return size;
	};
	Timeline.strokeColor = function(_){
		if(_){
			strokeColor = _;
			return Timeline;
		}
		return strokeColor;
	};
	//
	// getters and setters
	(function(){
		Object.defineProperty(Timeline, "g", {
			get: function(){return g}
		});// base group of timeline
		Object.defineProperty(Timeline, "size", {
			get: function(){return size}
		});// timeline size
		Object.defineProperty(Timeline, "x", {
			get: function(){return x}
		});
		Object.defineProperty(Timeline, "y", {
			get: function(){return y}
		});
		Object.defineProperty(Timeline, "data", {
			get: function(){return data}
		});
		Object.defineProperty(Timeline, "shownData", {
			get: function(){return shownData}
		});
		Object.defineProperty(Timeline, "brushLst", {
			get: function(){return brushLst}
		});
	})();
	//
	var from, to;
	var IS_LOAD_DATA = false;
	var curStep = "minute", stepCount = 20;
	function set_step(step, count){
		curStep = step ? step : curStep;
		stepCount = count ? count : stepCount;
		load_data();
		update();
		return Timeline;
	}
	function set_range(range){
		if(!arguments.length){
			from = timeFrom;
			to = timeTo;
		}else{
			from = range[0];
			to = range[1];
		}
		IS_LOAD_DATA = false;
		//load_data();
		//update();
		return Timeline;
	}
	function load_data(){
		// need global variable: timeFrom, timeTo
		from = from ? from : timeFrom;
		to = to ? to : timeTo;
		var url = WifiVis.RequestURL.timeline({
			start     : (new Date(from)).getTime(),
			end       : (new Date(to)).getTime(),
			step      : curStep,
			stepcount : +stepCount
		});
		d3.json(url, function(err, _data){
			if(err){
				console.error(err);
				return;
			}
			data = _data;
			var format = d3.time.format("%Y-%m-%d %H:%M:%S");
			console.log("load data:",
					format(new Date(data.start)),
					format(new Date(data.end)),
					data.time.length);
			console.log("count:",data.count.join(","));
			shownData = data.time.map(function(time,i){
				return {
					time   : time,
					count  : data.count[i],
					values : data.values[i]
				}
			});
			IS_LOAD_DATA = true;
			update();
		});
		return Timeline;
	}
	/*
	 * _size: size of the timeline view, optional
	 * strokeColor: line color, optional
	 * title: optional
	 */
	function update(_size, _strokeColor, title){
		if(!IS_LOAD_DATA){
			load_data();
			return;
		}
		size = _size || size;
		if(!size){
			console.warn("renderTimeline: no render size");
		}
		strokeColor = _strokeColor || strokeColor;
		// shownData:{start:, end:, time:, count:[], values:[]}
		//extent = d3.extent(shownData.time);
		x.range([0, size.width]).domain(d3.extent(data.time));
		y.range([size.height, 0]).domain([0,d3.max(data.count)]);
		console.log(y.domain());
		line = d3.svg.area().interpolate("monotone")
			.x(function(d){return x(d.time)})
			.y(function(d){return y(d.count)})
			.x0(function(d){ return x(d.time)})
			.y0(function(d){return y(0)});
		g.select("#timeline-x-axis-"+ tid)
			.attr("transform", "translate(0,"+size.height+")").call(xAxis);
		g.select("#timeline-y-axis-"+ tid).call(yAxis);
		// draw line
		//g.selectAll("path.basic-timeline").remove();
		var sel = g.select("path.basic-timeline").datum(shownData);
		sel.attr("d", line).style("stroke", strokeColor);
		//
		var circles = g.select("g.timeline-dot").selectAll("circle").data(shownData);
		circles.enter().append("circle").attr("class","dot");
		circles.attr("cx",function(d){return x(d.time)})
			.attr("cy",function(d){return y(d.count)})
			.attr("r", 4)
			.on({
				"mousemove": function(d){
					d3.select(this).append("title").text(d.count);
				},
				"mouseout": function(d){
					d3.select(this).select("title").remove();
				}
			});
		circles.exit().remove();
		// title
		title && (renderTitle(title));
		return Timeline;
	}
	/*
	 *
	 */
	function renderTitle(title){
		var gTitle = g.append("g").attr("class","timeline-title")
			.attr("transform","translate(-10,"+size.height/2+")");
		gTitle.append("text").text(title);
		return Timeline;
	}
	function addBrush(brush){
		brushLst.push(brush);
		return Timeline;
	}
	return Timeline;
};

/*
 * TimelineBrush()
 * timeline: Timeline object
 * opt.brushClass
 */
WifiVis.TimelineBrush = function(timeline, opt){
	function TimelineBrush(){};
	//
	var g = timeline.g, x = timeline.x, y = timeline.y, tl = timeline;
	var brushClass = opt && opt.brushClass || "brush",
			BRUSH_LOCK = false, IN_SELECTION = false, ALL_DEFAULT = true;
	// some functiion
	var validateExtent = defaultValidateExtent,
			adjustExtent, onBrushEnd;
			
	// getter and setter
	(function(){
		Object.defineProperty(TimelineBrush, "timeline",{
			get: function(){return tl}
		});
		Object.defineProperty(TimelineBrush, "x", {
			get: function(){return x}
		});
		Object.defineProperty(TimelineBrush, "y", {
			get: function(){return y}
		});
		Object.defineProperty(TimelineBrush, "g", {
			get: function(){return gBrush}
		});
		Object.defineProperty(TimelineBrush, "brush", {
			get: function(){return brush}
		});
		Object.defineProperty(TimelineBrush, "extent", {
			get: function(){return extent}
		});
	})();
	// clear odl brush
	g.select("g.brush").remove();
	g.select("g."+brushClass).remove();
	var brush, extent, gBrush = g.append("g").attr("class", brushClass);

	setBrush();
	/*
	 *
	 */
	function setBrush(){
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
	}
	function cbBrushMove(){
		console.log("brush move");
		var e = d3.event.target.extent();
		if(adjustExtent){
			e = adjustExtent(e);
		}
		extent = e;
		onBrushEnd(e);
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
		onBrushEnd && onBrushEnd(e);
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
	TimelineBrush.onBrushEnd = function(f){
		if(f){
			onBrushEnd = f.bind(TimelineBrush);
			return TimelineBrush;
		}
		return onBrushEnd;
	}
	return TimelineBrush;
};

//module.exports = Timeline;
