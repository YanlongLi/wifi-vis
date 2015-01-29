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
var Timeline = function(_data, id, opt){
	function Timeline(){}
	//
	var data = _data;
	var g = d3.select(id),
			tid = opt.tid || (100 + Math.round(Math.random() * 100)),
			size;
	g.attr("class", opt.style || "timeline");
	var x = d3.time.scale(), y = d3.scale.linear(),
			xAxis, yAxis,line,
			extent;
	var binNum = 200,
			binSize;
	var shownData;
	var brushLst = [];
	//
	updateData(data);
	//
	Timeline.updateData = updateData;
	Timeline.renderTimeline = renderTimeline;
	Timeline.addBrush = addBrush;
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
		Object.defineProperty(Timeline, "shownData", {
			get: function(){return shownData}
		});
		Object.defineProperty(Timeline, "brushLst", {
			get: function(){return brushLst}
		});
	})();
	//
	function updateData(_data){
		extent = d3.extent(data, function(d){return d.dateTime});
		//utils.log(["extent:", extent], 1);
		binSize = (extent[1].getTime() - extent[0].getTime())/binNum;
		shownData = [], i = -1;
		while(++i <= binNum){
			var t = extent[0].getTime() + i*binSize,
					dt = new Date(t);
			shownData.push({dateTime:dt, value:0});
		}
		i = -1;
		while(++i < data.length){
			var iBin = parseInt((data[i].dateTime - extent[0])/binSize);
			shownData[iBin].value++;
		}
		x.domain(d3.extent(shownData.map(function(d){return d.dateTime})));
		y.domain(d3.extent(shownData.map(function(d){return d.value})));
		//
		//utils.log(["Timeline update_data:", shownData], 1);
	}
	/*
	 * reanderTimelien()
	 * _size: size of the timeline view
	 * strokeColor: line color
	 * title:
	 */
	function renderTimeline(_size, strokeColor, title){
		size = _size;
		// init scale and axis
		x.range([0,size.width]);
		y.range([size.height,0]),
		xAxis = d3.svg.axis().scale(x).orient("bottom")
			.tickSize(2,0,4).tickSubdivide(0);
		yAxis = d3.svg.axis().scale(y).orient("left").ticks(4);
		g.append("g").attr("id", "timeline-x-axis-"+ tid)
			.attr("transform", "translate(0,"+size.height+")")
			.attr("class","x axis").call(xAxis);
		g.append("g").attr("id", "timeline-y-axis-"+ tid)
			.attr("class","y axis").call(yAxis);
		line = d3.svg.line().interpolate("monotone")
			.x(function(d){return x(d.dateTime)})
			.y(function(d){return y(d.value)});
		// draw line
		var sel = g.append("path").attr("class", "basic-timeline")
			.datum(shownData);
		sel.attr("d", line).style("stroke", strokeColor)
			.attr("fill","none");
		// draw dots
		var circles = g.append("g").attr("class","timeline-dot").selectAll("circle").data(shownData);
		circles.enter().append("circle").attr("class","dot")
			.attr("cx",function(d){return x(d.dateTime)})
			.attr("cy",function(d){return y(d.value)})
			.attr("r", 2);
		// title
		title && (renderTitle(title));
	}
	/*
	 *
	 */
	function renderTitle(title){
		var gTitle = g.append("g").attr("class","timeline-title")
			.attr("transform","translate(-10,"+size.height/2+")");
		gTitle.append("text").text(title);
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
var TimelineBrush = function(timeline, opt){
	function TimelineBrush(){};
	//
	var g = timeline.g, x = timeline.x, y = timeline.y, tl = timeline;
	var brushClass = opt && opt.brushClass || "brush",
			BRUSH_LOCK = false, IN_SELECTION = false;
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
	var brush, extent,
		gBrush = g.append("g").attr("class", brushClass);

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
		gBrush.selectAll("rect.extent").style("fill", "rgba(255,255,255,0.5)");
	}
	/*
	 * call back function for brush
	 */
	function cbBrushStart(){
		gBrush.classed("active", true);
		BRUSH_LOCK = true;
		extent = null;
	}
	function cbBrushMove(){
		var e = d3.event.target.extent();
		if(adjustExtent){
			e = adjustExtent(e);
		}
		extent = e;
		onBrushEnd(e);
	}
	function cbBrushEnd(){
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
			IN_SELECTION = false;
			utils.log(["brush, no selection"], 1);
			updateBrushTag(true);
			return;
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
