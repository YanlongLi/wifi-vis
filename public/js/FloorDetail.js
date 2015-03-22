
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
	var tip = d3.tip().attr('class', 'd3-tip')
		.offset([-10, 0]).html(function(d){return d.name});
	d3.select("#floor-detail-svg").call(tip);
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
		.linkStrength(function(l){return l.weight})
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
				d.x = dx; d.y - dy;
				return "translate("+dx+","+dy+")";
			});
			nodes.each(collide(0.5));
		}).alpha(0.2).charge(function(d){
			return r_scale(d.cluster.count(timePoint));
		});
	//
	//
	init_svg();
	init_interaction();

	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [40,10,0,20]);
		force.size([size.width, size.height]);
		console.log(size.width, size.height);
	}
	ObserverManager.addListener(FloorDetail);
	FloorDetail.OMListen = function(message, data){
		if(message == WFV.Message.FloorChange){
			currentFloor = +data.floor;
			$("#floor-detail-floor-label").text("F" + currentFloor);
			aps = apLst.filter(function(d){return d.floor == currentFloor});
			update_aps(aps);
		}
		if(message == WFV.Message.ApHover){
		}
		if(message == WFV.Message.ApSelect){
		}
		if(message == WFV.Message.DeviceSelect){
		}
		if(message == WFV.Message.DeviceHover){
		}
		if(message == WFV.Message.TimePointChange){
		}
		if(message == WFV.Message.TimeRangeChange){
			timePoint = data.time;
		}
		if(message == WFV.Message.TimeRangeChanged){
			timeRange = data.range;
		}
	}
	function init_interaction(){
	}
	$(window).resize(function(e){
		init_svg();
	});
	function update_aps(_data){
		nodes = g.select("#aps-wrapper").selectAll("g.ap");
		if(_data){
			// compute virtual links
			var virtualLinks = [], len = _data.length;
			for(var i = 0; i < len; i++){
				for(var j = i+1; j < len; j++){
					var x1 = aps[i].pos_x, y1 = aps[i].pos_y;
					var x2 = aps[i].pos_x, y2 = aps[j].pos_y;
					var w = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
					var l = {source: aps[i], target: aps[j], weight: w};
					virtualLinks.push(l);
				}
			}
			//
			var cmax= d3.max(_data, function(d){return d.cluster.count(timePoint)});
			cmax = cmax > 2 ? cmax : 2;
			r_scale.domain([1, cmax]);
			//
			// force.nodes(_data, function(d){return d.apid}).links(virtualLinks).start();
			force.size([size.width, size.height]);
			force.nodes(_data, function(d){return d.apid}).start();
			nodes = nodes.data(aps);
			var enter = nodes.enter().append("g").attr("class", "ap");
			enter.append("circle");
			nodes.exit().remove();
		}
		nodes.each(function(d){
			var ele = d3.select(this);
			var r = r_scale(d.cluster.count(timePoint));
			ele.select("circle").attr("r", r).style("fill", floorColor(currentFloor));
		}).on("mousemove", function(d){
			tip.show(d);
		}).on("mouseout", function(d){
			tip.hide(d);
		});
		//
		force.on("end", function(d){
			console.log(d);
		})
	}
	function update_links(_data){
	}
	function update_device(_data){
	}
	//
	return FloorDetail;
};

