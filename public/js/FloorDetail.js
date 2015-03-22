
/*
 * global variable required:
 * apLst:
 * apMap:
 */
var floor_image_size = WFV.FLOOR_IMG_SIZE;

WifiVis.FloorDetail = function(){
	function FloorDetail(){}
	//
	var apMap = tracer.apMap;
	var apLst = tracer.aps;
	//
	var floorColor = ColorScheme.floor;
	var opacity_by_stay_time = d3.scale.linear().range([1,0.3]).domain([60,120]).clamp(true);
	var svg = $("#floor-detail-svg");
		
	var g = d3.select("#floor-detail-g");

	var size;
	var r_scale = d3.scale.log().range([10, 30]).clamp(true);
	//

	var currentFloor, aps, nodes;
	var timePoint, timeRange = [timeFrom, timeTo];
	//
	var all_links, links, link_scale = d3.scale.linear().range([2, 10]);
	//
	var deviceLst = [];
	//
	var tip = d3.tip().attr('class', 'd3-tip')
		.offset([-10, 0]).html(function(ap){
			var name = ap.displayName();
			var desc = "ap: " + name + "</br>";
			desc = desc + "apid: " + ap.apid  + "</br>"
			//
			var devs = ap.cluster.deviceLst();
			desc = desc + "persons: " +devs.length + "</br>";
			var f = d3.time.format("20%y-%m-%d %H:%M:%S");
			return desc + f(timePoint) +"</br>";
		});
	d3.select("#floor-detail-svg").call(tip);

	var tip_device = d3.tip().attr('class', 'd3-tip')
		.offset([-10, 0]).html(function(d){
			var desc = "_id: "+ macMap.get(d.mac) + "</br>";
			var stay_time_minute = Math.round(d.device.stayTime(timePoint)/(1000*60));
			desc = desc + "stay time: " + stay_time_minute + " minutes</br>";
			var f = d3.time.format("20%y-%m-%d %H:%M:%S");
			return desc + "cur time: " + f(timePoint) +"</br>";
		});
	d3.select("#floor-detail-svg").call(tip_device);
	// defs
	// var markerEndId = "path-arrow";
	var markerId = {
		normal: "path-arrow-normal",
		device: "path-arrow-device",
		hilight: "path-arrow-hilight",
		reverse: "path-arrow-reverse",
		fading: "path-arrow-fading",
		hover: "path-arrow-hover"
	};
	function marker_url(id){
		return "url(#"+id+")";
	}
	(function(){
		var ids = d3.values(markerId);
		d3.select("#floor-detail-svg").append("defs").selectAll("marker").data(ids)
			.enter().append("marker")
			.attr("id",String)
			.attr("class","pairMarker")
			.attr("viewBox","0 0 5 5")
			.attr("refX",4.5)
			.attr("refY",2.5)
			.attr("markerWidth",4)
			.attr("markerHeight",3)
			.attr("orient","auto")
			.append("svg:path")
			.attr("d","M0,0L5,2.5L0,5");
	})();
	//
	function collide(alpha) {
		var quadtree = d3.geom.quadtree(aps);
		var padding = 10, radius = 40;
		return function(d) {
			var rb = 2*radius + padding,
			nx1 = d.x - rb,
			nx2 = d.x + rb,
				ny1 = d.y - rb,
				ny2 = d.y + rb;
			quadtree.visit(function(quad, x1, y1, x2, y2) {
				if (quad.point && (quad.point !== d)) {
					var x = d.x - quad.point.x,
						y = d.y - quad.point.y,
					l = Math.sqrt(x * x + y * y);
					if (l < rb) {
						l = (l - rb) / l * alpha;
						d.x -= x *= l;
						d.y -= y *= l;
						quad.point.x += x;
						quad.point.y += y;
					}
				}
				return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
			});
		};
	}	
	var force = d3.layout.force().charge(-100)
		.linkDistance(function(l){return Math.pow(l.weight, 2)})
		.on("tick", function tick(){
			nodes.attr("transform", function(d){
				var dx = d.x, dy = d.y;
				var r = r_scale(d.cluster.count(timePoint));
				if(dx - r < 0){
					dx = r + r - dx;
				}
				if(size.width - dx < r){
					dx = 2 * (size.width - r) - dx;
				}
				if(dy - r < 0){
					dy = r + r - dy;
				}
				if(size.height - dy < r){
					dy = 2 * (size.height - r) - dy;
				}
				d.x = dx; d.y = dy;
				return "translate("+dx+","+dy+")";
			});
			nodes.each(collide(0.5));
			update_links(links);
			update_device();
		}).on("end", function(d){
			// force.stop();
		});
	//
	//
	init_svg();
	init_interaction();

	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [40,10,0,20]);
	}
	ObserverManager.addListener(FloorDetail);
	FloorDetail.OMListen = function(message, data, sender){
		if(message == WFV.Message.FloorChange){
			currentFloor = +data.floor;
			if(!currentFloor) return;
			$("#floor-detail-floor-label").text("F" + currentFloor);
			aps = apLst.filter(function(d){return d.floor == currentFloor});
			load_links_data(function(){
				update_aps(aps);
			});
		}
		if(message == WFV.Message.ApHover){
			if(sender == FloorDetail) return;
			var apids = data.apid, change = data.change, isAdd = data.isAdd;
			g.select("#aps-wrapper").selectAll("g.ap").filter(function(d){
				return change.indexOf(d.apid) != -1;
			}).each(function(d){
				var ele = d3.select(this);
				ele.classed("hover", isAdd);
			});
		}
		if(message == WFV.Message.ApSelect){
			if(sender == FloorDetail) return;
			var apids = data.apid, change = data.change, isAdd = data.isAdd;
			g.select("#aps-wrapper").selectAll("g.ap").filter(function(d){
				return change.indexOf(d.apid) != -1;
			}).each(function(d){
				var ele = d3.select(this);
				ele.attr("selected", isAdd ? true : null).classed("selected", isAdd);
			});
		}
		if(message == WFV.Message.DeviceSelect){
		}
		if(message == WFV.Message.DeviceHover){
		}
		if(message == WFV.Message.TimePointChange){
			timePoint = data.time;
			tracer.gotoTime(timePoint);
			update_aps();
			update_device();
		}
		if(message == WFV.Message.TimeRangeChange){
		}
		if(message == WFV.Message.TimeRangeChanged){
			timeRange = data.range;
			d3.select("#path-wrapper").selectAll(".device-path").remove();
			load_links_data(function(){
				update_links(links);
			});
		}
	}
	function init_interaction(){
	}
	$(window).resize(function(e){
		init_svg();
		update_aps(aps);// links will be update after aps pos update
	});
	function update_aps(aps){
		// compute virtual links
		nodes = g.select("#aps-wrapper").selectAll("g.ap");
		if(aps){
			var virtualLinks = [], len = aps.length;
			for(var i = 0; i < len; i++){
				for(var j = i+1; j < len; j++){
					var x1 = aps[i].pos_x, y1 = aps[i].pos_y;
					var x2 = aps[j].pos_x, y2 = aps[j].pos_y;
					var w = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
					var l = {source: i, target: j, weight: w};
					virtualLinks.push(l);
				}
			}
			var cmax= d3.max(aps, function(d){return d.cluster.count(timePoint)});
			cmax = cmax > 2 ? cmax : 2;
			r_scale.domain([1, cmax]);
			//
			force.size([size.width, size.height]);
			// force.nodes(aps, function(d){return d.apid}).links(virtualLinks).start();
			force.nodes(aps, function(d){return d.apid}).start();
			//
			nodes = nodes.data(aps);
			var enter = nodes.enter().append("g").attr("class", "ap");
			enter.append("circle");
			nodes.exit().remove();
		}
		//
		nodes.each(function(d){
			var ele = d3.select(this);
			var r = r_scale(d.cluster.count(timePoint));
			ele.select("circle").attr("r", r).style("fill", floorColor(currentFloor));
		}).on("mousemove", function(d){
			d3.select(this).classed("hover", true);
			tip.show(d);
		}).on("mouseout", function(d){
			d3.select(this).classed("hover", false);
			tip.hide(d);
		}).on("click", function(d){
			var ele = d3.select(this);
			if(ele.attr("selected")){
				ele.attr("selected", null).classed("selected", false);
				EventManager.apDeselect([d.apid], FloorDetail);
			}else{
				ele.attr("selected", true).classed("selected", true);
				EventManager.apSelect([d.apid], FloorDetail);
			}
		});
	}
	function load_links_data(cb){
		var range = timeRange;
		var from = range[0], to = range[1];
		db.graph_info(from, to, function(_graphinfo){
			all_links = _graphinfo;
			links = all_links.filter(function(link){
				link.sid = link.source;
				link.tid = link.target;
				var from = apMap.get(link.source),
				to = apMap.get(link.target);
				link.sap = from;
				link.tap = to;
				return from.floor == currentFloor && to.floor == currentFloor;
			});
			cb();
		});
	}
	function update_links(_data){
		var gLinks = g.select("#path-wrapper").selectAll("g.link");
		if(_data){
			_data.forEach(function(link){
				link.x1 = link.sap.x;
				link.y1 = link.sap.y;
				link.x2 = link.tap.x;
				link.y2 = link.tap.y;
			});
			//
			var extent = d3.extent(_data, function(d){return d.weight});
			extent[0] = extent[0] < 1? 1: extent[0];
			link_scale.domain(extent);
			gLinks = gLinks.data(_data, function(d){return d.sid + "," + d.tid});
			var link_enter = gLinks.enter().append("g").attr("class", "link");
			link_enter.append('path');
			link_enter.append('text').append("textpath");
			gLinks.exit().remove();
		}
		var arcline = utils.arcline();
		gLinks.attr("sid", function(d){return d.sid})
			.attr("tid", function(d){return d.tid});
		gLinks.each(function(d, i){
			var ele = d3.select(this);
			ele.select("path")
				.attr("marker-end", "url(#"+markerId.normal+")")
				.attr("d",function(){
					var p1 = [d.x1,d.y1, r_scale(d.sap.cluster.count(timePoint))];
					var p2 = [d.x2,d.y2, r_scale(d.tap.cluster.count(timePoint))];
					if(p1[0] == p2[0] && p1[1] == p2[1]){
						return "M"+p1[0]+","+p1[1];
					}
					return arcline([p1,p2]);
				}).style("stroke-width", link_scale(d.weight))
				.attr("id", d.sid + "to" + d.tid);
				//
				ele.select("text").select("textpath")
					.attr("xlink:href", "#"+d.sid+"to"+d.tid)
					.text(d.weight);
		});
	}
	function update_device(){
		var gDevice = g.select("#device-wrapper").selectAll("g.device");
		deviceLst = [];
		if(!aps) return;
		aps.forEach(function(ap){
			var px = ap.x, py = ap.y;
			ap.cluster.deviceLst(timePoint).forEach(function(pos){
				var o = {};
				o.device = pos.device;
				o.mac = pos.device.mac;
				o.x = px;
				o.y = py;
				o.dx = pos.x;
				o.dy = pos.y;
				o.ap = ap;
				deviceLst.push(o);
			});
		});
		gDevice = gDevice.data(deviceLst, function(d){return d.mac});
		var device_enter = gDevice.enter().append("g").attr("class","device");
		device_enter.append("rect").attr("width", 6).attr("height", 6);
		//
		device_enter.each(function(d){
		});
		//
		gDevice.exit().remove();
		gDevice.classed("selected", function(d){
			return d.device.selected;
		}).attr("mac",function(d){return d.mac}).each(function(d){
			var ele = d3.select(this);
			ele.select("rect").attr("width", 6).attr("height", 6)
				.style("fill-opacity", function(){
					var stay_time_minute = Math.round(d.device.stayTime(timePoint)/(1000*60));
					return opacity_by_stay_time(stay_time_minute);
				});
		}).on("mousemove", function(d){
			d3.select(this).classed("hover", true);
			tip_device.show(d);
		}).on("mouseout", function(d){
			d3.select(this).classed("hover", false);
			tip_device.hide(d);
		});
		gDevice.transition().duration(80).ease("quard").attr("transform", function(d){
			var dx = d.x + d.dx;
			var dy = d.y + d.dy;
			return "translate("+dx+","+dy+")";
		});
	}
	//
	return FloorDetail;
};

