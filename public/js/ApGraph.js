
WifiVis.ApGraph = function(){
	function ApGraph(){}
	var dataHelper = WifiVis.DataHelper;
	// var color = WifiVis.FLOOR_COLOR;
	var color = d3.scale.category20();

	var DIV_ID = "aps-graph-wrapper"
	var gOffset = [10, 10];
	var o = utils.initSVG("#"+DIV_ID,[10]);

	console.log("o", o)
	var g = o.g, w = o.w, h = o.h, r = 6;

	var aps, links;
	var gLink = g.append("g").attr("class", "links")
	 gNode = g.append("g").attr("class", "nodes");

	var timeRange = [timeFrom, timeTo];
	var disMatrix = [], dotPositions;
	ddd = disMatrix;
	var tsneWorker;

	var graphinfo;

	var spinner	
	
	var edgeFilterWeight = 50;

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
		spinner = utils.createSpinner(5, 5);
		processData();
		worker = new Worker("js/workers/tsneWorker.js");
		tsneWorker = worker;
		// worker.postMessage({"cmd":"init", "distance":disMatrix});
		worker.onmessage = function(event) {
			dotPositions = event.data;
			render();
		}
		var drag = initDragPolygon();
        o.svg.call(drag);

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
		spinner.spin($("#" + DIV_ID).get(0));
		var from = new Date(range[0]), to = new Date(range[1]);
		var records = db.records_by_interval(from, to)
		console.log("records", records);
		db.graph_info(from, to, function(_graphinfo){
			graphinfo = _graphinfo;
			var count = 0;
			graphinfo.forEach(function(link){
				count++;
				link.source = apMap.get(link.source);
				link.target = apMap.get(link.target);
				disMatrix[link.source._id][link.target._id] 
					= disMatrix[link.target._id][link.source._id] 
					= getDistance(link.weight);
			});
			console.log("link count", count);
			tsneWorker.postMessage({"cmd":"init", "distance":disMatrix});
			links = graphinfo.filter(function(l){
				return l.weight > edgeFilterWeight;
			});
			GLINKS = links
			
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
		spinner.stop();	

		var _this = this;
		var minX = _.min(dotPositions, function(d) {return d[0]})[0];
		var maxX = _.max(dotPositions, function(d) {return d[0]})[0];
		var minY = _.min(dotPositions, function(d) {return d[1]})[1];
		var maxY = _.max(dotPositions, function(d) {return d[1]})[1];
		var width = o.w;
			height = o.h;
		width = height = Math.min(width, height) - 20;
		if (gNode.selectAll(".ap-dot").size() == 0) {
			gNode.selectAll(".ap-dot")
				.data(dotPositions)
				.enter()
				.append("circle")
				.attr("class", "ap-dot")  
				.attr("r", 5)
				.attr("ap-id", function(d, index) {
					return aps[index]._id;
				})
				// .attr("topic-id", function(d, index){
				// 	var topicID = _this.documents[index].topicID;
				// 	return topicID;
				// })              
				// .attr("r", function(d, index) {
				// 	var doc = _this.documents[index];
				// 	var topicID = _this.documents[index].topicID;
				// 	return doc.probs[topicID] * 4 + 2;
				// })  
				.attr("fill", function(d, index) {
					var floor = aps[index].floor;
					return color(floor)
					// return gColorScale(topicID);
				})
				.attr("opacity", 0.7)   
			// gLink.selectAll(".ap-link")
			// 	.data(links)
			// 	.enter()
			// 	.append("line")
			// 	.attr("class", "ap-link")
			// 	.style("stroke-width", function(d) {
			// 		var scale = d3.scale.log().base(6);
			// 		return scale(d.weight+1) * 1;	
			// 	})			
		}

		gNode.selectAll(".ap-dot")
			.data(dotPositions)
			// .enter()
			.attr("cx", function(d, index) {
				var ap = aps[index];
				var x = mapping(d[0], minX, maxX, 0, width);
				ap.x = x;
				return x;
			})
			.attr("cy", function(d, index) {
				var ap = aps[index];
				y = mapping(d[1], minY, maxY, 0, height);
				ap.y = y;
				return y;
			})

		// gLink.selectAll(".ap-link")
		// 	.data(links)
		// 	.attr("x1", function(d) { return d.source.x; })
		// 	.attr("y1", function(d) { return d.source.y; })
		// 	.attr("x2", function(d) { return d.target.x; })
		// 	.attr("y2", function(d) { return d.target.y; })


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

    function initDragPolygon(){
        //reference from http://bl.ocks.org/bycoffe/5871227
        var line = d3.svg.line(),
        drag = d3.behavior.drag()
            .on("dragstart", function() {
                // Empty the coords array.
                coords = [];
                svg = d3.select(this);

                // If a selection line already exists,
                // remove it.
                svg.select(".polygon-selection").remove();
                // Add a new selection line.
                svg.append("path").attr({"class": "polygon-selection"});
            })
            .on("drag", function() {
                // Store the mouse's current position
                coords.push(d3.mouse(this));
                svg = d3.select(this);
                // Change the path of the selection line
                // to represent the area where the mouse
                // has been dragged.
                svg.select(".polygon-selection").attr({
                  d: line(coords)
                });

                // Figure out which dots are inside the
                // drawn path and highlight them.

                // _this.selected = [];
                // _this.selectedDocuments = [];
                //由于svgGroup做了居中处理，与svg的坐标系不一致，所以要纠正偏移
                var offsetX = Number(gOffset[0]),
                    offsetY = Number(gOffset[1]);
                console.log("offset:", offsetX, offsetY);
                // var offsetX = 0, offsetY = 0;
                var selected = [];
                svg.selectAll(".ap-dot").each(function(d, i) {
                    point = [ Number(d3.select(this).attr("cx")) +  offsetX, 
                            Number(d3.select(this).attr("cy")) +  offsetY];
                    if (utils.pointInPolygon(point, coords)) {
                        selected.push(d);
                        // _this.selectedDocuments.push(doc);
                    }
                });
                highlight(selected);
            })
            .on("dragend", function() {
                svg = d3.select(this);
                // If the user clicks without having
                // drawn a path, remove any paths
                // that were drawn previously.
                if (coords.length === 0) {
                	svg.select(".polygon-selection").remove();
                    // svg.selectAll("path").remove();
                    unhighlight();
                    return;
                }             
                // Draw a path between the first point
                // and the last point, to close the path.
                svg.append("path").attr({
                    "class": "terminator",
                    d: line([coords[0], coords[coords.length-1]])
                });
                svg.select(".polygon-selection").remove();

                // Post message to update other views
                // ObserverManager.post("SelectDocuments", 
                //     {documents: _this.selectedDocuments})   
 
            });

            function unhighlight() {
                d3.selectAll(".ap-dot").classed("highlight", false);
            }

            function highlight(dotsData) {
                // First unhighlight all the circles.
                unhighlight();

                // Find the circles that have an id
                // in the array of ids given, and 
                // highlight those.
                d3.selectAll(".ap-dot").filter(function(d, i) {
                    var index = dotsData.indexOf(d);
                    return index > -1;
                })
                .classed("highlight", true);
            }
        return drag;
    }

	function processData() {
		aps = db.aps_all();
		var defaultValue = getDistance(0);
		for (var i = 0; i < aps.length; i++) {
			disMatrix[i] = [];
			for (var j = 0; j < aps.length; j++) {
				if (i == j)
					disMatrix[i][j] = 0;
				else
					disMatrix[i][j] = defaultValue;
			}
		}
	}

	function getDistance(weight) {
		var distance = 100 - (weight+1) ;
		if (distance <= 1)
			return 1;
		return distance;
	}



	function tick() {
		sNode.attr("cx", function(d) { return d.x = Math.max(r, Math.min(w - r, d.x)); })
			.attr("cy", function(d) { return d.y = Math.max(r, Math.min(h - r, d.y)); });

		sLink.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
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
