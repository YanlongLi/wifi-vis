
WifiVis.ApGraph = function(){
	function ApGraph(){}
	var dataHelper = WifiVis.DataHelper;
	var color = WifiVis.FLOOR_COLOR;
	var color = d3.scale.category20();

	var DIV_ID = "aps-graph-wrapper"
	var o = utils.initSVG("#"+DIV_ID,[0]);

	console.log("init SVG", $("#"+DIV_ID));
	var g = o.g, w = o.w, h = o.h, r = 6;

	var nodes, links, sNode, sLink;
	var gLink = g.append("g"), gNode = g.append("g");
	var timeRange = [timeFrom, timeTo];
	var disMatrix = [], dotPositions;
	var tsneWorker;

	var graphinfo;
	
	var edgeFilterWeight = 30;

	// var slider = d3.slider().axis(d3.svg.axis().orient("top")).min(20).max(150)
	// 	.step(1)
	// 	.on("slide", function(evt, value){
	// 		d3.select("#edge-filter-slider > a").text(value);
	// 	}).on("slideend", function(evt, value) {
	// 		edgeFilterWeight = value;
	// 		// TODO
	// 		update(timeRange);
	// 	}).value(edgeFilterWeight);
	// d3.select("#edge-filter-slider").call(slider);
	//
	ApGraph.init = function(){
		var _this = this;
		processData();
		worker = new Worker("js/workers/tsneWorker.js");
		tsneWorker = worker;
		worker.postMessage({"cmd":"init", "distance":disMatrix});
		worker.onmessage = function(event) {
			console.log("onmessage", event);
			dotPositions = event.data;
			render();
		}
	}
	ApGraph.draw = function(){
		this.update(timeRange);
	}
	ApGraph.set_time_range = function(range){
		timeRange[0] = range[0];
		timeRange[1] = range[1];
	}
	
	ApGraph.update = function(range){
		console.log("update", range)
		var from = new Date(range[0]), to = new Date(range[1]);
		db.graph_info(from, to, function(_graphinfo){
			graphinfo = _graphinfo;
			graphinfo.forEach(function(link){
				link.source = apMap.get(link.source);
				link.target = apMap.get(link.target);
				disMatrix[link.source._id][link.target._id] = 100 / (link.weight+1);
			});
			tsneWorker.postMessage({"cmd":"init", "distance":disMatrix});
			// var links = graphinfo.filter(function(l){
			// 	return l.weight > edgeFilterWeight;
			// });
			// var s = d3.set();
			// graphinfo.forEach(function(link){
			// 	s.add(link.source.apid);
			// 	s.add(link.target.apid);
			// });
			// var nodes = s.values().map(function(apid){
			// 	return apMap.get(apid);
			// });
			// console.log("nodes:", nodes.length);
		});
	}

	function render() {		
		var _this = this;
		var minX = _.min(dotPositions, function(d) {return d[0]})[0];
		var maxX = _.max(dotPositions, function(d) {return d[0]})[0];
		var minY = _.min(dotPositions, function(d) {return d[1]})[1];
		var maxY = _.max(dotPositions, function(d) {return d[1]})[1];
		var width = o.w;
			height = o.h;
		width = height = Math.min(width, height) - 20;
		console.log("render", width, height)
		if (g.selectAll(".doc-dot").size() == 0) {
			g.selectAll(".doc-dot")
				.data(dotPositions)
				.enter()
				.append("circle")
				.attr("class", "doc-dot")  
				.attr("r", 5)
				// .attr("doc-id", function(d, index) {
				// 	return _this.documents[index].id;
				// })
				// .attr("topic-id", function(d, index){
				// 	var topicID = _this.documents[index].topicID;
				// 	return topicID;
				// })              
				// .attr("r", function(d, index) {
				// 	var doc = _this.documents[index];
				// 	var topicID = _this.documents[index].topicID;
				// 	return doc.probs[topicID] * 4 + 2;
				// })  
				// .attr("fill", function(d, index) {
				// 	var topicID = _this.documents[index].topicID;
				// 	return gColorScale(topicID);
				// })
				.attr("opacity", 0.7)                 
		}

		g.selectAll(".doc-dot")
			.data(dotPositions)
			// .enter()
			.attr("cx", function(d, index) {
				var x = mapping(d[0], minX, maxX, 0, width);
				return x;
			})
			.attr("cy", function(d) {
				y = mapping(d[1], minY, maxY, 0, height);
				return y;
			})
			// .on('mouseover', function(d, index) {
			// 	//设置tip
			// 	var x = mapping(d[0], minX, maxX, 0, width),
			// 		y = mapping(d[1], minY, maxY, 0, height);
			// 	var tip = _this.tip;
			// 	var text = _this.documents[index].text;
			// 	var dir = getTipDirection(x, y, 300, 200, width, height);
			// 	tip.html("Doc " + _this.documents[index].id + ": " + cutOffString(text, 200))
			// 		.direction(dir)
			// 		.offset( function() {
			// 			if (dir == 'n')
			// 				return [-10, 0]
			// 			else
			// 				return [10, 0];
			// 		})
			// 	tip.show();
			// })
			// .on('mouseout', this.tip.hide)               
	}

	function _update_graph(nodes, links){
		// //g.selectAll(".node .link").remove();
		// sNode = gNode.selectAll(".ap").data(nodes, function(d){return d.apid});
		// sLink = gLink.selectAll(".link").data(links, function(d){
		// 	return d.source.apid + "," + d.target.apid;
		// });
		// //
		// force.nodes(nodes).links(links).start();
		// //
		// sLink.enter().append("line").attr('class',"link");
		// console.log("link weight:", links.length, d3.extent(links, function(d){return d.weight}));
		// sLink.attr("source", function(d){return d.source.apid})
		// 	.attr("target", function(d){return d.target.apid})
		// 	.style("stroke-width", function(d){
		// 		var scale = d3.scale.log().base(6);
		// 		return scale(d.weight+1);
		// 	}).attr('x1', function(d){return d.source.x})
		// 	.attr('y1', function(d){return d.source.y})
		// 	.attr('x2', function(d){return d.target.x})
		// 	.attr('y2', function(d){return d.target.y});
		// sLink.exit().remove();
		// sNode.enter().append("circle").attr("class","ap");
		// sNode.attr("apid", function(d){return d.apid})
		// 	.attr("cx", function(d){return d.x})
		// 	.attr("cy", function(d){return d.y})
		// 	.attr("r",function(d){
		// 		if(d.weight > 0){
		// 			return 8;
		// 		}
		// 		return 0;
		// 	}).call(force.drag);
		// sNode.on("click", function(ap){
		// 	// TODO
		// 	fireEvent(ApGraph.EventType.AP_CLICK, ap);
		// }).on('mouseover', function(ap){
		// 	// TODO
		// 	d3.select(this).append("title")
		// 		.text((ap.name || "none")+" "+ap.weight);
		// }).on('mouseout', function(ap){
		// 	// TODO
		// 	d3.select(this).selectAll('title').remove();
		// });
		// sNode.exit().remove();
	}

	function processData() {
		var aps = db.aps_all();
		for (var i = 0; i < aps.length; i++) {
			disMatrix[i] = [];
			for (var j = 0; j < aps.length; j++) {
				disMatrix[i][j] = 0;
			}
		}
	}



	function tick() {
		sNode.attr("cx", function(d) { return d.x = Math.max(r, Math.min(w - r, d.x)); })
			.attr("cy", function(d) { return d.y = Math.max(r, Math.min(h - r, d.y)); });

		sLink.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
		//console.log(force.alpha());
		if(force.alpha() < 0.07){
			force.stop();
		}
	}

	function mapping(value, vMin, vMax, tMin, tMax) {
		value = value < vMin ? vMin : value;
		value = value > vMax ? vMax : value;
		return (value - vMin) / (vMax - vMin) * (tMax - tMin) + tMin;
	}	


	
	// Event Type
	var listeners = d3.map();
	ApGraph.EventType = {
		AP_CLICK: "ApClick"
	}
	ApGraph.addEventListener = addEventListener;
	ApGraph.removeEventListener = removeEventListener;	
	function addEventListener(type, obj){
		// if(!listeners.has(type)){
		// 	listeners.set(type,[obj]);
		// }else{
		// 	listeners.get(type).push(obj);
		// }
	}
	function removeEventListener(type, obj){
		// if(!listeners.has(type)){
		// 	return;
		// }else{
		// 	var objs = listeners.get(type);
		// 	var len = objs.length, i = -1;
		// 	while(++i < len){
		// 		if(objs[i] === obj){
		// 			break;
		// 		}
		// 	}
		// 	if(i == len) return;
		// 	objs = objs.slice(0,i).concat(objs.slice(i+1,len));
		// 	listeners.put(type, objs);
		// }
	}
	function fireEvent(type){
		// var params = Array.prototype.slice.call(arguments, 1); 
		// var objs = listeners.get(type);
		// if(!objs || !objs.length) return;
		// var i = -1, len = objs.length;
		// while(++i < len){
		// 	var fn = objs[i]["on"+type];
		// 	fn.apply(objs[i], params);
		// }
	}

	ApGraph.onFloorChange = function(f){
		// console.log("apGraph", "onFloorChange", f);
		// sNode.style("fill", null);
		// sNode.attr("class","ap").filter(function(d){
		// 	return d.floor == f;
		// }).classed("hilight", true);
	}
	ApGraph.onApClick = function(ap, flag){
		// console.log("apGraph", "onApClick");
		// sNode.filter(function(d){
		// 		return d.apid == ap.apid
		// }).style("fill", function(d){
		// 	if(!flag){
		// 		return null;
		// 	}
		// 	return WifiVis.AP_COLOR(d.apid);
		// });
	}
	ApGraph.onApMouseEnter = function(ap){
		// console.log("apGraph", "onApMouseEnter");
	}
	ApGraph.onApMouseLeave = function(ap){
		// console.log("apGraph", "onApMouseLeave");
	}
	ApGraph.onBrushEnd = function(extent){
		// console.log("apGraph", "onBrushEnd");
		// console.log(extent[0], extent[1]);
		// TODO
		//update(extent);
	}


	return ApGraph;
};
