
WifiVis.ApGraph = function(){
	function ApGraph(){}
	var dataHelper = WifiVis.DataHelper;
	//var color = d3.scale.category20();
	var color = WifiVis.FLOOR_COLOR;

	var DIV_ID = "aps-graph-wrapper";
	var o = utils.initSVG("#"+DIV_ID,[0]);
	var g = o.g, w = o.w, h = o.h, r = 6;
	var force = d3.layout.force().size([o.w,o.h])
		.gravity(0.8)
		.charge(-180)
		.linkDistance(15)
		.on('tick', tick);
	var nodes, links, sNode, sLink;
	var gLink = g.append("g"), gNode = g.append("g");
	var timeRange = [timeFrom, timeTo];
	//
	var edgeFilterWeight = 30;
	var slider = d3.slider().axis(d3.svg.axis().orient("top"))
		.step(1)
		.on("slide", function(evt, value){
			d3.select("#edge-filter-slider > a").text(value);
		}).on("slideend", function(evt, value) {
			edgeFilterWeight = value;
			// TODO
			update(timeRange);
		}).value(edgeFilterWeight);
	d3.select("#edge-filter-slider").call(slider);
	//
	ApGraph.init = init;
	ApGraph.draw = function(){
		update(timeRange);
	}
	ApGraph.set_time_range = function(range){
		timeRange[0] = range[0];
		timeRange[1] = range[1];
	}
	var graphinfo;
	ApGraph.update = update;
	function update(range){
		var from = new Date(range[0]), to = new Date(range[1]);
		db.graph_info(from, to, function(_graphinfo){
			graphinfo = _graphinfo;
			//
			graphinfo.forEach(function(link){
				link.source = apMap.get(link.source);
				link.target = apMap.get(link.target);
			});
			//
			console.log(graphinfo.length);
			var links = graphinfo.filter(function(l){
				return l.weight > edgeFilterWeight;
			});
			var s = d3.set();
			graphinfo.forEach(function(link){
				s.add(link.source.apid);
				s.add(link.target.apid);
			});
			var nodes = s.values().map(function(apid){
				return apMap.get(apid);
			});
			console.log("nodes:", nodes.length);
			_update_graph(nodes, links);

		});
	}
	function _update_graph(nodes, links){
		//g.selectAll(".node .link").remove();
		sNode = gNode.selectAll(".node").data(nodes);
		sLink = gLink.selectAll(".link").data(links);
		//
		force.nodes(nodes).links(links).start();
		//
		sLink.enter().append("line").attr('class',"link");
		sLink.attr('x1', function(d){return d.source.x})
			.attr('y1', function(d){return d.source.y})
			.attr('x2', function(d){return d.target.x})
			.attr('y2', function(d){return d.target.y});
		sLink.exit().remove();
		sNode.enter().append("circle").attr("class","node");
		sNode.attr("cx", function(d){return d.x})
			.attr("cy", function(d){return d.y})
			.attr('fill', function(ap){
				return color(ap.floor);
			}).attr("r",function(d){
				if(d.weight > 0){
					return 8;
				}
				return 0;
			}).call(force.drag);
		sNode.on('mouseover', function(ap){
			// TODO
			d3.select(this).append("title")
				.text((ap.name || "none")+" "+ap.weight);
		}).on('mouseout', function(ap){
			// TODO
			d3.select(this).selectAll('title').remove();
		});
		sNode.exit().remove();
	}

	function init(){}
	function draw(records){
		console.log("draw:", records.length);
		var rs = dataHelper.sortRecordsByMacAndTime(records);
		rs = dataHelper.removeDuplicateRecords(rs);
		//var data = recordToNodeLink(records.slice(0,700));
		var data = dataHelper.recordsToNodeLink(rs);
		nodes = data.nodes;
		links = data.links;
		//
		sNode = g.selectAll(".node").data(nodes);
		sLink = g.selectAll(".link").data(links);
		//
		force.nodes(nodes).links(links).start();
		//
		sLink.enter().append("line").attr('class',"link");
		sLink.attr('x1', function(d){return d.source.x})
			.attr('y1', function(d){return d.source.y})
			.attr('x2', function(d){return d.target.x})
			.attr('y2', function(d){return d.target.y});
		sLink.exit().remove();
		sNode.enter().append("circle").attr("class","node");
		sNode.attr("cx", function(d){return d.x})
			.attr("cy", function(d){return d.y})
			.attr('fill', function(ap){
				return color(ap.floor);
			}).attr("r", function(d){
				//console.log(d.weight);
				if(d.weight == 0) return 0;
				return Math.log(d.weight || 3)*3;
			}).call(force.drag);
		sNode.on('mouseover', function(ap){
			d3.select(this).append("title").text((ap.name || "none")+" "+ap.weight);
		})
		sNode.exit().remove();
	}
	function tick() {
		sNode.attr("cx", function(d) { return d.x = Math.max(r, Math.min(w - r, d.x)); })
			.attr("cy", function(d) { return d.y = Math.max(r, Math.min(h - r, d.y)); });

		sLink.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
	}
	return ApGraph;
};
