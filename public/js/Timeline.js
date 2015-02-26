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
			xAxis, yAxis, line,
			extent;
	xAxis = d3.svg.axis().scale(x).orient("bottom")
		.tickSize(2,0,4).tickSubdivide(0)
		//.tickFormat(function(d){return new Date(d).to_24_str()});
	yAxis = d3.svg.axis().scale(y).orient("left")
		.ticks(5);
	var aplineColor = WifiVis.AP_COLOR;
		//
	g.append("g").attr("id", "timeline-x-axis-"+ tid).attr("class","x axis");
//		.attr("transform", "translate(0,"+size.height+")")
	g.append("g").attr("id", "timeline-y-axis-"+ tid).attr("class","y axis");
	g.append("g").attr("class","y-description")
		.attr("transform","translate(6,"+10+")")
		.append("text").text("records number/per 20 minutes");

	g.append("path").attr("class", "basic-timeline");
	g.append("g").attr("id","ap-timeline-container");
	var apLine = g.select("#ap-timeline-container");
	var gPop;
	(function(){
		var pW = 200, pH = 60;
		gPop = g.append("g").attr("id", "popup").attr("opacity", 0);
		gPop.append("rect").attr("width", pW).attr("height", pH)
			.attr("fill", "black").attr("opacity", 0.13);
		gPop.append("g").attr("class","time").append("rect")
			.attr("width", 200).attr("height",20).style("fill","#FFFFFF");
		gPop.select("g.time").append("text").attr("dy",16);
	})();
	var shownData, strokeColor;
	//
	var from, to;
	var IS_LOAD_DATA = false, curF = 1;
	var curStep = "minute", stepCount = 20;
	var brushLst = [];
	//
	$("#btn-step").click(function(){
		curStep = $("#step").val();
		stepCount = $("#step-count").val();
		set_step(curStep, stepCount);
	});
	//
	
	var mouseTime;
	g.on("mouseenter", mouseenter)
		.on("mousemove", mousemove)
		.on("mouseleave",mouseleave);
	function mouseenter(){
		apLine.selectAll("circle, text").attr("opacity", 1);
	}
	function mousemove(){
		var _ref = d3.mouse(this);
		var mx = _ref[0], my = _ref[1];
		if(mx <= 0 || my <= 0){
			mouseleave();
			return;
		}
		mouseenter();
		mouseTime = x.invert(mx);
		var popData = [];
		apLine.selectAll("text").attr("transform",function(d){
			var i = -1;
			while(++i < d.length && d[i].time - mouseTime < 0){
			}
			if(i == 0){
				i = 1;
			}
			if(i == d.length){
				console.log("mouse pos overflow");
				mouseleave();
				return;
			}
			var dx = x(new Date(d[i-1].time));
			var dy = y(d[i-1].count);
			//
			var pData = {name: d.ap.name, count:d[i-1].count};
			//
			return "translate("+dx+","+dy+")";
		});
		apLine.selectAll("circle").each(function(d){
			var i = -1;
			while(++i < d.length && d[i].time - mouseTime < 0){
			}
			if(i == 0){
				i = 1;
			}
			if(i == d.length){
				console.warn("mouse pos overflow");
				return;
			}
			var dx = x(new Date(d[i-1].time));
			var dy = y(d[i-1].count);
			//
			var pData = {name: d.ap.name, count:d[i-1].count, ap: d.ap};
			popData.push(pData);
			//
			d3.select(this).attr("transform", "translate("+dx+","+dy+")");
		});
		if(!popData.length){
			return;
		}
		gPop.select("g.time").select("text").text(mouseTime.to_time_str());
		popData.sort(function(d1, d2){
			return d2.count - d1.count;
		});
		var popItem= gPop.selectAll("g.text")
			.data(popData,function(d){return d.name});
			//.data(popData,function(d){return d.name});
		popItem.enter().append("g").attr("class","text").each(function(d){
			d3.select(this).append("rect").attr("height", 20).attr("width", 200)
				.attr("fill", function(d){
					return aplineColor(d.ap.apid);
				});
			d3.select(this).append("text").attr("class","name");
			d3.select(this).append("text").attr("class","count");
		});
		popItem.attr("transform",function(d,i){
			var dy = (i+1) * 20;
			return "translate(0,"+dy+")";
		}).each(function(d){
			d3.select(this).select("text.name").attr("dy",16)
				.attr("dx",20)
				.text(function(d){return d.name});
			d3.select(this).select("text.count").attr("dy",16)
				.attr("dx", 80)
				.text(function(d){return d.count});
		});
		popItem.exit().remove();
		gPop.attr("transform","translate("+mx+","+my+")")
			.attr("height", 20*popData.length+20);
		gPop.attr("opacity",1);
	}
	function mouseleave(){
		apLine.selectAll("circle, text").attr("opacity", 0);
		gPop.attr("opacity", 0);
	}
	//
	Timeline.change_floor = function(){
		IS_LOAD_DATA = false;
		update();
	}
	Timeline.onFloorChange = function(f){
		curF = f;
		IS_LOAD_DATA = false;
		update();
		apLine.selectAll("g.ap-line").remove();
	}
	Timeline.onApClick = add_ap_timeline;
	Timeline.add_ap_timeline = add_ap_timeline;
	Timeline.set_step = set_step;
	Timeline.set_range = set_range;
	Timeline.update = update;
	Timeline.add_brush= addBrush;
	Timeline.set_size= function(_){
		if(_){
			size = _;
			x.range([0, size.width]);
			y.range([size.height, 0]);
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
		//
		var params = {
			start     : (new Date(from)).getTime(),
			end       : (new Date(to)).getTime(),
			step      : curStep,
			stepcount : +stepCount,
			floor     : curF 
		};
		//
		timeline_data(params, function(_data){
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
		x.range([0, size.width]).domain(d3.extent(data.time)).nice();
		y.range([size.height, 0]).domain([0,d3.max(data.count)]).nice();
		line = d3.svg.area()
		//	.interpolate("monotone")
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
		// title
		title && (renderTitle(title));
		return Timeline;
	}
	function add_ap_timeline(ap, flag){
		var apid = ap.apid;
		if(!flag){
			g.select("#ap-timeline-"+apid).remove();
			return;
		}
		from = from ? from : timeFrom;
		to = to ? to : timeTo;
		var params = {
			start     : (new Date(from)).getTime(),
			end       : (new Date(to)).getTime(),
			step      : curStep,
			stepcount : +stepCount,
			apid : apid
		}
		timeline_data(params, function( _data){
			var apTlData = _data.time.map(function(time,i){
				return {
					time   : time,
					count  : _data.count[i],
					values : _data.values[i]
				}
			});
			apTlData.ap = ap;
			console.log("ap",apid,"timeline count:",_data.count.join(","));
			// draw
			var sel = apLine.append("g").attr("class","ap-line")
				.attr("id","ap-timeline-"+apid).datum(apTlData);
			var path = sel.append("path").attr("class","ap-timeline");
			sel.append("circle").attr("opacity", 0).attr("r",5);
			sel.append("text").attr("opacity", 0).text(function(d){
				return d.ap.name;
			});
			apLine.selectAll("path.ap-timeline")
				.attr("d", line).style("stroke",function(d){
					return aplineColor(d.ap.apid);
				});
			//
		});
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
			adjustExtent;
	var onBrushStart = function(){},
			onBrushMove = function(){},
			onBrushEnd = function(){};

			
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
	//
	var listeners = d3.map();
	TimelineBrush.EventType = {
		EVENT_BRUSH_START: "BrushStart",
		EVENT_BRUSH_MOVE: "BrushMove",
		EVENT_BRUSH_END: "BrushEnd"
	};
	TimelineBrush.addEventListener = addEventListener;
	TimelineBrush.removeEventListener = removeEventListener;
	function addEventListener(type, obj){
		if(!listeners.has(type)){
			listeners.set(type,[obj]);
		}else{
			listeners.get(type).push(obj);
		}
	}
	function removeEventListener(type, obj){
		if(!listeners.has(type)){
			return;
		}else{
			var objs = listeners.get(type);
			var len = objs.length, i = -1;
			while(++i < len){
				if(objs[i] === obj){
					break;
				}
			}
			if(i == len) return;
			objs = objs.slice(0,i).concat(objs.slice(i+1,len));
			listeners.put(type, objs);
		}
	}
	function fireEvent(type){
		var params = Array.prototype.slice.call(arguments, 1); 
		var objs = listeners.get(type);
		if(!objs || !objs.length) return;
		var i = -1, len = objs.length;
		while(++i < len){
			var fn = objs[i]["on"+type];
			fn.apply(objs[i], params);
		}
	}
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

//module.exports = Timeline;

var TIME_STEP = {
	second : 1000,
	minute : 60*1000,
	hour   : 60*60*1000,
	day    : 60*60*24*1000
};

function timeline_data(params, cb){
	var stepBy    = params.step || "hour";
	var stepcount = +(params.stepcount || 1);
	var step      = TIME_STEP[stepBy] * stepcount;
	var floor     = params.floor;
	var apid = params.apid;
	console.log(apid);
	if(undefined == apid){
		db.tl_data(timeFrom, timeTo, step, floor, cb);
	}else{
		db.tl_data_apid(timeFrom, timeTo, step, apid, cb);
	}
}
