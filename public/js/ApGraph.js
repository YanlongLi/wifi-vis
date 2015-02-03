
WifiVis.ApGraph = function(){
	function ApGraph(){}

	var DIV_ID = "aps-graph-wrapper";
	var o = utils.initSVG("#"+DIV_ID,[0]);
	var g = o.g;
	console.log("g:",g);
	var force = d3.layout.force().size([o.w,o.h])
		.charge(-90)
		.linkDistance(20)
	//	.gravity(0.5)
		.on('tick', tick);
	var nodes, links, sNode, sLink;

	ApGraph.init = init;
	ApGraph.draw = draw;

	function init(){}
	function draw(records){
		//var data = recordToNodeLink(records.slice(0,700));
		var data = recordToNodeLink(records);
		nodes = data.nodes;
		links = data.links;
		//
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
			.attr("r", 5).call(force.drag);
		sNode.on('mouseover', function(ap){
			d3.select(this).append("title").text((ap.name || "none")+ap.weight);
		})
		sNode.exit().remove();
	}
	function tick() {
		sLink.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		sNode.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
	}
	/*
	 *  records are sorted by mac and date_time
	 */
	function recordToNodeLink(records, isPreprocess){
		var nodeMap = d3.map(), linkMap = d3.map();
		if(!isPreprocess){
			records = _sortAndRemoveDuplicate(records);
		}
		var i = 0, len = records.length, cur, pre;
		if(len == 0){
			return {nodes:[],links:[]}
		}else{
			var r = records[0];
			// TODO: here need to be rewrite
			var o = {apid:r.apid};
			nodeMap.set(r.apid, o);
			pre = o;
		}
		while(++i < len){
			var r = records[i];
			cur = nodeMap.get(r.apid);
			if(!cur){
				cur = {apid: r.apid};
				nodeMap.set(r.apid, cur);
			}
			if(records[i].mac == records[i-1].mac){
				var key = pre.apid + "," + cur.apid;
				if(linkMap.has(key)){
					var l = linkMap.get(key);
					l.weight = l.weight+1;
					linkMap.set(key,l);
				}else{
					linkMap.set(key,{source:pre, target:cur, weight:1});
				}
			}
			pre = cur;
		}
		return {nodes:nodeMap.values(),links:linkMap.values()}
	}
	function _sortAndRemoveDuplicate(records){
		records.sort(function(r1, r2){
			if(r1.mac != r2.mac){
				return r1.mac > r2.mac;
			}
			return r1.date_time > r2.date_time;
		});
		var res = [], i = 0, len = records.length, pre, cur;
		if(len == 0) return [];
		res.push(records[0]);
		pre = records[0];
		while(++i < len){
			cur = records[i];
			if(cur.mac != pre.mac || cur.apid != pre.apid){
				res.push(cur);
				pre = cur;
			}
		}
		return res;
	}
	return ApGraph;
};
