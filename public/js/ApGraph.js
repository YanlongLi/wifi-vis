
WifiVis.ApGraph = function(){
	function ApGraph(){}
	var dataHelper = WifiVis.DataHelper;
	//var color = d3.scale.category20();
	var color = WifiVis.FLOOR_COLOR;

	var DIV_ID = "aps-graph-wrapper";
	var o = utils.initSVG("#"+DIV_ID,[0]);
	var g = o.g, w = o.w, h = o.h, r = 6;
	var force = d3.layout.force().size([o.w,o.h])
		.charge(-200)
		.linkDistance(20)
		.gravity(0.5)
		.on('tick', tick);
	var nodes, links, sNode, sLink;

	ApGraph.init = init;
	ApGraph.draw = draw;

	function init(){}
	function draw(records){
		console.log("draw:", records.length);
		var rs = dataHelper.sortRecordsByMacAndTime(records);
		rs = dataHelper.removeDuplicateRecords(rs);
		//var data = recordToNodeLink(records.slice(0,700));
		var data = dataHelper.recordsToNodeLink(rs);
		nodes = data.nodes.filter(function(d){return d.weight > 0});
		links = data.links;
		//nodes = data.nodes.filter(function(n){return n.weight > 1500});
		//links = data.links.filter(function(n){return n.weight > 50});
		// filter node: 1500 and links: 50
		/*
		console.log("node summary:");
		nodes.forEach(function(n){console.log("apid:",n.apid, n.weight)})
		console.log("link summary:");
		links.forEach(function(l){
			console.log(l.source.apid, l.target.apid,l.weight);
		});
		*/
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
				console.log(d.weight);
				return Math.log(d.weight)*3;
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
