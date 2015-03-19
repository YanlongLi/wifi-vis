
WifiVis.ApGraph = function(){
	function ApGraph(){}
	var dataHelper = WifiVis.DataHelper;
	var color = ColorScheme.floor;

	var DIV_ID = "aps-graph-wrapper"
	var gOffset = [10, 10];
	var o = utils.initSVG("#"+DIV_ID,[10]);
	var svg = o.svg, g = o.g, w = o.w, h = o.h, r = 6;

	var aps, links;
	var gLink = g.append("g").attr("class", "links"),
		gNode = g.append("g").attr("class", "nodes");
		gPath = g.append("g").attr("class", "paths");
	var edgeFilterWeight = 0;
	var isShowEdge = false;     

	var timeRange = [timeFrom, timeTo];
	var disMatrix = [], dotPositions, dotNormalPositions = [];
	var tsneWorker;
	var graphinfo;
	var spinner;

	$(window).resize(function(e){
		o = utils.resizeSVG(o);
		render();
	});

	ApGraph.init = function(){
		var _this = this;
		ObserverManager.addListener(this);
		spinner = utils.createSpinner(5, 5);
		initArrowMarker();
		processData();
		var worker = new Worker("js/workers/tsneWorker.js");
		tsneWorker = worker;
		// worker.postMessage({"cmd":"init", "distance":disMatrix});
		worker.onmessage = function(event) {
			dotPositions = event.data.positions;				
			if (event.data.isFinished == false) {
				isShowEdge = false;
				render();
			}
			else {
				isShowEdge = true;
				// console.log("XXX", dotNormalPositions)
				repel();
			}
			
		}
		var drag = initDragPolygon();
		o.svg.call(drag)
			.on("click", function(){
				console.log("svg click");
				EventManager.apDeselect(null, this);
			});
	}

	function initArrowMarker() {
		var arrowData = ["aps-graph-arrow"];
		o.svg.append("defs")
			.selectAll("marker")
			.data(arrowData)
			.enter()
			.append("marker")
			.attr("id",String)
			.attr("class","pairMarker")
			.attr("viewBox","0 0 5 5")
			.attr("refX",4.5)
			.attr("refY",2.5)
			.attr("markerWidth",3)
			.attr("markerHeight",5)
			.attr("orient","auto")
			.append("svg:path")
			.attr("d","M0,0L6,2.5L0,5")

			// .attr("viewBox","0 -10 20 20")
			// .attr("refX",14.5)
			// .attr("refY",0)
			// .attr("markerWidth",5)
			// .attr("markerHeight",4)
			// .attr("orient","auto")
			// .append("svg:path")
			// .attr("d","M0,0L20,0L0,10")			
	}

	ApGraph.draw = function(){
		this.update(timeRange);
	}
	ApGraph.set_time_range = function(range){
		timeRange[0] = range[0];
		timeRange[1] = range[1];
	}
	
	ApGraph.update = function(range){
		spinner.spin($("#" + DIV_ID).get(0));
		var from = new Date(range[0]), to = new Date(range[1]);
		var records = db.records_by_interval(from, to)
		// console.log("records", records);
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
			tsneWorker.postMessage({"cmd":"init", "distance":disMatrix});
			links = graphinfo.filter(function(l){
				return l.weight > edgeFilterWeight;
			});
		});
	}

	ApGraph.OMListen = function(message, data){
		if(message == WFV.Message.FloorChange){
			var currentFloor = data.floor;
			unhighlight();
			svg.selectAll(".dot").filter(function(d) {
				if (d3.select(this).attr("floor") == currentFloor)
					return true;
				return false;
			}).classed("highlight", true);
		}
		if (message == WFV.Message.FloorHover) {
			var floorList = data.floor;
			console.log(floorList);
			svg.selectAll(".dot.temp-highlight").classed("temp-highlight", false);
			svg.selectAll(".dot").filter(function(d) {
				if (floorList.indexOf(+d3.select(this).attr("floor")) >= 0)
					return true;
				return false;
			}).classed("temp-highlight", true);
		}
		if (message == WFV.Message.ApHover) {
			// if (data.isAdd == false) {
			// 	svg.selectAll(".dot").classed("temp-highlight", false);
			// 	return;
			// }
			// var apids = data.apid;
			// for (var i = 0; i < apids.length; i++) {
			// 	var id = apids[i];
			// 	svg.selectAll(".dot[apid='" + id + "']").classed("temp-highlight", true);
			// }
		}				
		if (message == WFV.Message.ApSelect) {
			svg.selectAll(".dot").classed("highlight", false);
			var apids = data.apid;
			console.log("apselect", apids);
			for (var i = 0; i < apids.length; i++) {
				var id = apids[i];
				// console.log(".dot[apid='" + id + "']")
				svg.selectAll(".dot[apid='" + id + "']").classed("highlight", true);
			}
		}
		if (message == WFV.Message.DeviceSelect) {
			if (!(data.change.length == 1 && data.isAdd == true))
				return;
			var deviceID = data.change[0]
			var pathOfAP = [];
			var path = db.path_by_mac(deviceID);
			for (var i = 0; i < path.length; i++) {
				pathOfAP.push(path[i].apid);
			}
			console.log("path of AP", pathOfAP);
			drawDevicePath(pathOfAP);
		}		
	}	

	function drawDevicePath(path) {
		gPath.selectAll(".route").remove();
		gNode.selectAll(".route-highlight").classed("route-highlight", false);
		var links = [];
		for (var i = 0; i < path.length-1; i++) {
			var l = {};
			l.source = _.findWhere(aps, {apid:path[i]})
			l.target = _.findWhere(aps, {apid:path[i+1]})
			gNode.select(".dot[apid='" + path[i] + "']").classed("route-highlight", true);
			gNode.select(".dot[apid='" + path[i+1] + "']").classed("route-highlight", true);
			l.weight = 1;
			links.push(l);
		}
		gPath.selectAll(".route")
			.data(links)
			.enter()
			.append("path")
			.attr("class", "route")
	        .attr("marker-end",function(d){
	        	return "url(#aps-graph-arrow)";
	        })
			.attr("d",function(d){
				var src = [d.source.x, d.source.y];
				var dest = [d.target.x, d.target.y];
				var srcR = 5;
				var destR = 5;
				var p1 = src;
				var p2 = dest;
		        var dx = p2[0]-p1[0];
		        var dy = p2[1]-p1[1];

				var theta = Math.atan(dy/dx);
				var theta1 = theta + Math.PI/6.0;
				var theta2 = theta - Math.PI/6.0;
				var directionX = dx>=0?1:-1;
				var directionY = dy>0?1:-1;

				if(dx<0){
					theta+=Math.PI;
					if(dy<0){
					//	directionY*=-1;						
					}
				}
				if((dx<=0&&dy>0) || (dx>=0&&dy<0)){
					directionY*=-1;
				}
				// var newX0 = p1[0] + directionX*srcR*Math.abs(Math.cos(theta1));
				// var newY0 = p1[1] + directionY*srcR*Math.abs(Math.sin(theta1));

				// var newX1 = p2[0] - directionX*destR*Math.abs(Math.cos(theta2));
				// var newY1 = p2[1] - directionY*destR*Math.abs(Math.sin(theta2));
				var newX0 = p1[0] + directionX*srcR*(Math.cos(theta1));
				var newY0 = p1[1] + directionY*srcR*(Math.sin(theta1));

				var newX1 = p2[0] - directionX*destR*(Math.cos(theta2));
				var newY1 = p2[1] - directionY*destR*(Math.sin(theta2));

//		        var dr = Math.sqrt(dx*dx+dy*dy);
				// var parameterD = d3.max([(1-0.2*d.dupIndex),0]);
				var parameterD = 1;
		        var dr = Math.sqrt(dx*dx+dy*dy)*parameterD;

				// var newX0 = p1[0];
				// var newY0 = p1[1];
				// var newX1 = p2[0];
				// var newY1 = p2[1];
				str = "M"+ newX0 + "," + newY0 + "A" + dr + "," + dr + " 0 0,0 " + newX1 + "," + newY1;

				return str;
			})

	}

	function createElements() {
		gNode.selectAll(".dot")
			.data(dotPositions)
			.enter()
			.append("circle")
			.attr("class", "dot")  
			.attr("r", 5)
			.attr("ap-id", function(d, index) {
				return aps[index]._id;
			})
			.attr("apid", function(d, index) {
				return aps[index].apid;
			})
			.attr("floor", function(d, index) {
				return aps[index].floor;
			})
			.attr("fill", function(d, index) {
				var floor = aps[index].floor;
				return color(floor)
				// return gColorScale(topicID);
			})
			.on('mouseover', function(d, index) {
				gNode.selectAll(".dot").classed("temp-dark", true);
				gNode.selectAll(".link-highlight").classed("link-highlight", false);

				d3.select(this).classed("temp-highlight", true);

				var ap = aps[index];
				var neighbours = [];
				svg.selectAll(".link[source-id='" + ap._id + "']")
					.classed("temp-highlight", true)
					.each(function(d) {
						// neighbours.push(d.target.apid)
						gNode.select(".dot[apid='" + d.target.apid + "']")
							.classed("link-highlight", true);
					})

				svg.selectAll(".link[target-id='" + ap._id + "']").classed("temp-highlight", true)
					.each(function(d) {
						gNode.select(".dot[apid='" + d.source.apid + "']")
							.classed("link-highlight", true);
					})


				//tiph
				var dx = $(this).offset().left - $("#"+DIV_ID).offset().left;
				var dy = $(this).offset().top - $("#"+DIV_ID).offset().top;

				var desc = "ap id: " + ap.apid + "</br>"
					+ "ap name: " + ap.name + "</br>"
					+ "ap floor: " + ap.floor + "</br>"; 
				$("#ap-graph-description").html(desc);
				$("#ap-graph-description").css({
					"left": dx + 15,
					"top": dy + 15
				});
				$("#ap-graph-description").show();
			})
			.on('mouseout', function(d, index) {
				d3.select(this).classed("temp-highlight", false);
				gNode.selectAll(".link-highlight").classed("link-highlight", false);
				gNode.selectAll(".dot").classed("temp-dark", false);
				svg.selectAll(".link").classed("temp-highlight", false);
				//tip
				$("#ap-graph-description").hide();
			})
			.on("click", function(d,index) {
				console.log("click")
				d3.event.stopPropagation()
				d3.select(this).classed("highlight", true);
				var ap = aps[index];
				var list = [ap.apid];
				EventManager.apSelect(list);
			})

		gLink.selectAll(".link")
			.data(links)
			.enter()
			.append("line")
			.attr("class", "link")
			.attr("source-id", function(d) {
				return d.source._id; 
			})
			.attr("target-id", function(d) {
				return d.target._id;
			})
			.style("stroke-width", function(d) {
				var scale = d3.scale.log().base(6);
				return scale(d.weight+1) * 1.5;	
			})
			.style("display", "none");	
	}

	function render(needScale) {
		spinner.stop();	

		if (needScale == null)
			needScale = true;
		
		var _this = this;
		var minX = _.min(dotPositions, function(d) {return d[0]})[0];
		var maxX = _.max(dotPositions, function(d) {return d[0]})[0];
		var minY = _.min(dotPositions, function(d) {return d[1]})[1];
		var maxY = _.max(dotPositions, function(d) {return d[1]})[1];
		var width = o.w;
			height = o.h;
		// width = height = Math.min(width, height) - 20;
		width = width - 20; height = height - 20;
		if (gNode.selectAll(".dot").size() == 0) {
			createElements();
		}

		if (needScale) {
			gNode.selectAll(".dot")
				.data(dotPositions)
				.attr("cx", function(d, index) {
					var ap = aps[index];
					var x = mapping(d[0], minX, maxX, 0, width);
					dotNormalPositions[index][0] = x;
					ap.x = x;
					return x;
				})
				.attr("cy", function(d, index) {
					var ap = aps[index];
					y = mapping(d[1], minY, maxY, 0, height);
					dotNormalPositions[index][1] = y;
					ap.y = y;
					return y;
				})			
		} else {
			gNode.selectAll(".dot")
				.data(dotPositions)
				.attr("cx", function(d, index) {
					var ap = aps[index];
					ap.x = d[0];
					return d[0];					
				})
				.attr("cy", function(d, index) {
					var ap = aps[index];
					ap.y = d[1];
					return d[1];					
				})				
		}

		// isShowEdge = false;
		if (isShowEdge) {
			gLink.selectAll(".link")
				.data(links)
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; })            
				.style("display", "block");
		} else {
			gLink.selectAll(".link").style("display", "none");
		}
	}

	function repel() {
		var radius = [], delta = [];
		dotPositions = dotNormalPositions;
		// console.log("dotNormalPositions", dotNormalPositions);
		
		for (var i = 0; i < dotPositions.length; i++) {
			radius[i] = 5;
			delta[i] = [0, 0];
		}

		var cost = 10000;
		var iter = 0;

		var timer = setInterval(function() {
			iterFunc();
			if (iter > 100 || cost < 5) {
				clearInterval(timer);
			}
		}, 30)

		function iterFunc() {
			iter++;
			cost = 0;
			for (var i = 0; i < dotPositions.length; i++) {
				delta[i] = [0, 0];
			}			
			for (var i = 0; i < dotPositions.length; i++) {
				var pi = dotPositions[i];
				for (var j = i+1; j < dotPositions.length; j++) {
					var pj = dotPositions[j];
					dis = Math.sqrt( (pi[0]-pj[0])*(pi[0]-pj[0]) + (pi[1]-pj[1])*(pi[1]-pj[1]) );
					if (dis < radius[i] + radius[j]) {
						// console.log("iter", iter, "===", radius[i] + radius[j] - dis, radius[i], radius[j], dis)
						cost += radius[i] + radius[j] - dis;
						if (pi[0] > pj[0]) {
							delta[i][0]++;
							delta[j][0]--;
						} else {
							delta[i][0]--;
							delta[j][0]++;
						}
						if (pi[1] > pj[1]) {
							delta[i][1]++;
							delta[j][1]--;
						} else {
							delta[i][1]--;
							delta[j][1]++;
						}
					}
				}
			}
			for (var i = 0; i < dotPositions.length; i++) {
				dotPositions[i][0] += delta[i][0] * 0.5;
				dotPositions[i][1] += delta[i][1] * 0.5;
			}
			render(false);
		}
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

				//由于svgGroup做了居中处理，与svg的坐标系不一致，所以要纠正偏移
				var offsetX = Number(gOffset[0]),
					offsetY = Number(gOffset[1]);
				console.log("offset:", offsetX, offsetY);
				// var offsetX = 0, offsetY = 0;
				var selected = [];
				svg.selectAll(".dot").each(function(d, i) {
					point = [ Number(d3.select(this).attr("cx")) +  offsetX, 
							Number(d3.select(this).attr("cy")) +  offsetY];
					if (utils.pointInPolygon(point, coords)) {
						selected.push(d);
					}
				});
				highlight(selected);
			})
			.on("dragend", function() {
				console.log("dragend")
				svg = d3.select(this);
				// If the user clicks without having
				// drawn a path, remove any paths
				// that were drawn previously.
				if (coords.length === 0) {
					svg.select(".polygon-selection").remove();
					// unhighlight();
					// postSelectMessage([]);
					return;
				}             
				// Draw a path between the first point
				// and the last point, to close the path.
				svg.append("path").attr({
					"class": "terminator",
					d: line([coords[0], coords[coords.length-1]])
				});
				svg.select(".polygon-selection").remove();

				//由于svgGroup做了居中处理，与svg的坐标系不一致，所以要纠正偏移
				var offsetX = Number(gOffset[0]), offsetY = Number(gOffset[1]);
				var selectedAp = [];
				svg.selectAll(".dot").each(function(d, i) {
					point = [ Number(d3.select(this).attr("cx")) +  offsetX, 
							Number(d3.select(this).attr("cy")) +  offsetY];
					if (utils.pointInPolygon(point, coords)) {
						selectedAp.push(aps[i]);
					}
				});

 				postSelectMessage(selectedAp);
			});

		function postSelectMessage(ApList) {
			var list = _.pluck(ApList, "apid");
			EventManager.apDeselect(null, this);
			EventManager.apSelect(list, this);
		}

		return drag;
	}

	function unhighlight() {
		svg.selectAll(".dot").classed("highlight", false);
	}

	function highlight(dotsData) {
		unhighlight();

		// Find the circles that have an id
		// in the array of ids given, and 
		// highlight those.
		svg.selectAll(".dot").filter(function(d, i) {
			var index = dotsData.indexOf(d);
			return index > -1;
		})
		.classed("highlight", true);
	}

	function processData() {
		aps = db.aps_all();
		var defaultValue = getDistance(0);
		for (var i = 0; i < aps.length; i++) {
			dotNormalPositions[i] = [0, 0];
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


	function mapping(value, vMin, vMax, tMin, tMax) {
		value = value < vMin ? vMin : value;
		value = value > vMax ? vMax : value;
		return (value - vMin) / (vMax - vMin) * (tMax - tMin) + tMin;
	}	

	return ApGraph;
};
