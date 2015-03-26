
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
	var floorImgSize = WFV.FLOOR_IMG_SIZE;
	//
	var floorColor = ColorScheme.floor;
	var opacity_by_stay_time = d3.scale.linear().range([1,0.3]).domain([60,120]).clamp(true);
	var svg = $("#floor-detail-svg");
		
	var g = d3.select("#floor-detail-g");

	var size;
	var r_scale = d3.scale.log().range([10, 30]).clamp(true);
	var x = d3.scale.linear(), y = d3.scale.linear();
	//

	var currentFloor, aps;
	var timePoint, timeRange = [timeFrom, timeTo];
	//
	var graphInfo, links, link_scale = d3.scale.linear().range([2, 10]);
	//
	var deviceLst = [];
	//
	var h_hist = 60;
	var x_ap_hist = d3.scale.ordinal();
	var y_ap_hist = d3.scale.linear();
	var ap_hist_axis = d3.svg.axis().scale(x_ap_hist).orient("bottom");
	//
	var apNumOfFloor = WFV.AP_NUM_OF_FLOOR;
	_.range(1,18).forEach(function(f){
		var html = "F"+f+"("+apNumOfFloor(f)+")";
		$("<option></option>").attr("value", f).html(html).appendTo($("#floor-select-menu"));
	});
	$("#floor-select-menu option").first().attr("selected", "selected");
	$("#floor-select-menu").selectmenu({
		change: function(event, ui){
			_help_change_floor(+ui.item.value);
			EventManager.floorChange(+ui.item.value, FloorDetail);
		}
	});
	//
	$("#path-weight-slider").slider({
		orientation: "vertical",
		range: true,
		values: [0,100],
		slide: function(event, ui){
			var v1 = ui.values[0] || 0, v2 = ui.values[1];
			$("#path-weight-label").val(v1 + "-" + v2);
			filter_links(v1, v2);
		}
	});
	//
	var tip = d3.tip().attr('class', 'd3-tip')
		.direction("w")
		.offset([0, -10]).html(function(ap){
			var name = ap.displayName();
			var desc = "ap: " + name + "</br>";
			desc = desc + "apid: " + ap.apid  + "</br>"
			//
			var devs = ap.cluster.deviceLst(timePoint);
			desc = desc + "persons: " +devs.length + "</br>";
			var f = d3.time.format("20%y-%m-%d %H:%M:%S");
			return desc + f(timePoint) +"</br>";
		});
	d3.select("#floor-detail-svg").call(tip);

	var tip_device = d3.tip().attr('class', 'd3-tip')
		.direction('w')
		.offset([0, -10]).html(function(d){
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
	g.select("#brush-select").attr("class", 'brush');
	var brush = d3.svg.brush();
	brush.on("brushstart", brushstart)
		.on("brush", brushed)
		.on("brushend", brushend);
	function brushstart(){
		deviceLst.forEach(function(d){
			d.selected = null;
		});
		// EventManager.deviceDeselect(deviceLst.map(function(d){return d.mac}), FloorDetail);
		EventManager.deviceDeselect(null, FloorDetail);
		d3.event.sourceEvent.stopPropagation();
	}
	function brushed(){
		var extent = brush.extent();
		deviceLst= [];
		g.selectAll("#device-wrapper").selectAll("g.device")
			.attr("selected", null).classed("selected", false);
		g.select("#device-wrapper").selectAll("g.device")
			.classed("selected", function(d){
				var px = x(d.x) + d.dx;
				var py = y(d.y) + d.dy;
				if(extent[0][0] <= px && px < extent[1][0]
						&& extent[0][1] <= py && py < extent[1][1]){
					deviceLst.push(d.device);
					d3.select(this).attr("selected", true);
					return true;
				}
				return false;
			});
		d3.event.sourceEvent.stopPropagation();
	}
	function brushend(){
		d3.event.target.clear();
		d3.select(this).call(d3.event.target);
		deviceLst.forEach(function(d){d.selected = true});
		//
		var macs = deviceLst.map(function(d){return d.mac});
		EventManager.deviceSelect(macs, FloorDetail);
		d3.event.sourceEvent.stopPropagation();
	}
	//
	init_svg();
	init_interaction();

	function init_svg(){
		var _w = svg.width(), _h = svg.height() - 30;
		size = utils.initG(g, _w, _h, [40,10,70,100]);
		x.range([0, size.width]);
		y.range([0, size.height]);
		h_hist = 60;
		d3.select("#floor-detail-ap-histogram").attr("transform", "translate(20,"+(40 + size.height + 10)+")");
		y_ap_hist.range([h_hist, 0]);
		x_ap_hist.rangeRoundBands([0, size.width + 80], 0.1);
		//
		var sliderHeight = size.height - 80;
		$("#path-weight-slider").height(sliderHeight);
		//
		brush.x(d3.scale.identity().domain([0, size.width]))
			.y(d3.scale.identity().domain([0, size.height]));
		g.select("#brush-select").call(brush);
	}
	function _help_change_floor(f){
		currentFloor = f;
		if(!currentFloor) return;
		$("#floor-detail-floor-label").text("F" + currentFloor);
		var imgSize = floorImgSize(currentFloor)
			x.domain([0, imgSize[0]]);
		y.domain([0, imgSize[1]]);
		aps = apLst.filter(function(d){return d.floor == currentFloor});
		//
		if(graphInfo){
			_reset();
		}else{
			load_links_data(_reset);
		}
	}
	ObserverManager.addListener(FloorDetail);
	FloorDetail.OMListen = function(message, data, sender){
		if(message == WFV.Message.FloorChange){
			_help_change_floor(+data.floor);
		}
		if(message == WFV.Message.ApHover){
			if(sender == FloorDetail) return;
			var apids = data.apid, change = data.change, isAdd = data.isAdd;
			g.select("#aps-wrapper").selectAll("g.ap").filter(function(d){
				return change.indexOf(""+d.apid) != -1;
			}).each(function(d){
				var ele = d3.select(this);
				ele.classed("hover", isAdd);
			});
		}
		if(message == WFV.Message.ApSelect){
			if(sender == FloorDetail) return;
			var apids = data.apid, change = data.change, isAdd = data.isAdd;
			g.select("#aps-wrapper").selectAll("g.ap").filter(function(d){
				return change.indexOf(""+d.apid) != -1;
			}).each(function(d){
				var ele = d3.select(this);
				ele.attr("selected", isAdd ? true : null).classed("selected", isAdd);
			});
		}
		if(message == WFV.Message.DeviceSelect){
			if(sender == FloorDetail) return;
			var devs = data.device, change = data.change, isAdd = data.isAdd;
			d3.select("#device-wrapper").selectAll("g.device").filter(function(d){
				return change.indexOf(d.mac) != -1;
			}).each(function(d){
				var ele = d3.select(this);
				ele.attr("selected", isAdd).classed("selected", isAdd);
				d.device.selected = isAdd ? true : null;
			});
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
			graphInfo = null;
			load_links_data(_reset);
		}
	}
	function _reset(){
		// reset slider
		links = graphInfo.filter(function(link){
			return link.sap.floor == currentFloor && link.tap.floor == currentFloor;
		});
		var max = d3.max(links, function(d){return d.weight});
		$("#path-weight-slider").slider("option", "max", max)
			.slider("option", "min", 0)
			.slider("option", "values", [0, max]);
		update_aps(aps);
		update_device(aps);
		update_links(links);
		update_histogram_in_out(links);
		var v0 = $("#path-weight-slider" ).slider("values", 0) || 0;
		var v1 = $("#path-weight-slider" ).slider("values", 1);
		$("#path-weight-label").val(v0 + "-" + v1);
	}
	function init_interaction(){
	}
	$(window).resize(function(e){
		init_svg();
		update_aps(aps);
		update_device(aps);
		update_links();
		update_histogram_in_out();
	});
	function update_aps(aps){
		// compute virtual links
		var nodes = g.select("#aps-wrapper").selectAll("g.ap");
		if(aps){
			var cmax= d3.max(aps, function(d){return d.cluster.count(timePoint)});
			cmax = cmax > 2 ? cmax : 2;
			r_scale.domain([1, cmax]);
			//
			nodes = nodes.data(aps);
			var enter = nodes.enter().append("g").attr("class", "ap");
			enter.append("circle");
			enter.append("text");
			nodes.exit().remove();
		}
		//
		nodes.attr("transform", function(d){
			var dx = x(d.pos_x), dy = y(d.pos_y);
			// var r = r_scale(d.cluster.count(timePoint));
			return "translate("+dx+","+dy+")";
		}).each(function(d){
			var ele = d3.select(this);
			var r = r_scale(d.cluster.count(timePoint));
			ele.select("circle").attr("r", r).style("fill", floorColor(currentFloor));
			//	
			ele.select("text").text(d.displayName())
				.attr("x", r).attr("y", r);
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
			graphInfo = _graphinfo;
			graphInfo.forEach(function(link){
				link.sid = link.source;
				link.tid = link.target;
				var from = apMap.get(link.source),
				to = apMap.get(link.target);
				link.sap = from;
				link.tap = to;
			});
			cb();
		});
	}
	function update_links(_data){
		var gLinks = g.select("#path-wrapper").selectAll("g.link");
		if(_data){
			_data.forEach(function(link){
				link.x1 = link.sap.pos_x;
				link.y1 = link.sap.pos_y;
				link.x2 = link.tap.pos_x;
				link.y2 = link.tap.pos_y;
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
					var p1 = [x(d.x1), y(d.y1), r_scale(d.sap.cluster.count(timePoint))];
					var p2 = [x(d.x2), y(d.y2), r_scale(d.tap.cluster.count(timePoint))];
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
	var timeSpeed = 10;
	function update_device(){
		deviceLst = [];
		if(!aps) return;
		// translate data
		aps.forEach(function(ap){
			var px = ap.pos_x, py = ap.pos_y;
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
		var gDevice = g.select("#device-wrapper")
			.selectAll("g.device").data(deviceLst, function(d){return d.mac});
		// enter and enter transition
		var device_enter = gDevice.enter().append("g").attr("class","device");
		device_enter.append("rect").attr("width", 6).attr("height", 6);
		device_enter.attr("transform", function(d){
			var dx = x(d.x) + d.dx;
			var dy = y(d.y) + d.dy;
			return "translate("+dx+","+dy+")";
		}).selectAll("rect").transition().duration(800).each("start", function(d){
			d3.select(this).style("fill", "red");
		}).each("end", function(d){
			d3.select(this).style("fill", "");
		});
		//
		// transition for update
		gDevice.transition().duration(800).ease("linear").attr("transform", function(d){
			var dx = x(d.x) + d.dx;
			var dy = y(d.y) + d.dy;
			return "translate("+dx+","+dy+")";
		}).each('start', function(d){
			var x1 = d3.select(this).attr('cx') || 0, y1 = d3.select(this).attr('cy') || 0;
			var apid = d3.select(this).attr("apid");
			if(apid == d.ap.apid) return;
			var x2 = x(d.x) + d.dx, y2 = y(d.y) + d.dy;
			d3.select(this).attr("cx", x2).attr("cy", y2).attr("apid", d.ap.apid);
			d3.select("#aps-wrapper").append("line")
				.attr('stroke-width', 3)
				.attr('stroke', '#000000')
				.attr('stroke-opacity', 0.3)
				.attr('x1', x1).attr('y1', y1)
				.attr('x2', x1).attr('y2', y1)
				.transition()
				.duration(700)
				.ease('linear')
				.attr('x2', x2)
				.attr('y2', y2)
				.each('end', function() {
					var tThis = d3.select(this);
					tThis
						.transition()
						.duration(800)
						.ease('linear')
						.attr('x1', tThis.attr('x2'))
						.attr('y1', tThis.attr('y2'))
						.each('end', function() {
							this.remove();
						});
				});
		});
		gDevice.exit().remove();
		// update with enter
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
		}).on("click", function(d){
			var ele = d3.select(this);
			if(ele.attr("selected")){
				ele.attr("selected", null).classed("selected", false);
				d.device.selected = null;
				//
				deviceLst = _.difference(deviceLst, [d.mac]);
				EventManager.deviceDeselect([d.mac], FloorDetail);
			}else{
				ele.attr("selected", true).classed("selected", true);
				d.device.selected = true;
				//
				deviceLst = _.union(deviceLst, [d.mac]);
				EventManager.deviceSelect([d.mac], FloorDetail);
			}
		});
	}
	function update_histogram_in_out(_data){
		var hists = d3.select("#floor-detail-ap-histogram").selectAll("g.hist");
		if(_data){
			if(!_data.length) return;
			var aps = d3.map();
			_data.forEach(function(l){
				if(!aps.has(+l.sid)){
					aps.set(+l.sid, {in:0, out:0, in_links:[], out_links:[]});
				}
				if(!aps.has(l.tid)){
					aps.set(+l.tid, {in:0, out:0, in_links:[], out_links:[]});
				}
				aps.get(+l.sid).out += l.weight;
				aps.get(+l.sid).out_links.push(l);
				aps.get(+l.tid).in += l.weight;
				aps.get(+l.tid).in_links.push(l);
			});
			var data = aps.entries().map(function(d){
				return {
					apid: +d.key, in: +d.value.in, out: +d.value.out,
					in_links: d.value.in_links, out_links: d.value.out_links
				};
			}).sort(function(a,b){
				return b.in - a.in;
			});
			x_ap_hist.domain(data.map(function(d){
				var ap = apMap.get(d.apid);
				d.ap = ap;
				var arr = ap.name.split(/f|ap/);
				arr.shift();
				return arr.join("-");
			}));
			y_ap_hist.domain([0,d3.max(data,function(d){return d.out > d.in ? d.out : d.in})])
				.range([h_hist, 0]);
			//
			hists = hists.data(data);
			var enter = hists.enter().append("g").attr("class", "hist");
			enter.append("rect").attr("class", "in");
			enter.append("rect").attr("class", "out");
			enter.append("text").attr("class", "in");
			enter.append("text").attr("class", "out");
			hists.exit().remove();
		}
		//
		d3.select("#floor-detail-ap-histogram").select(".x.axis")
			.attr("transform", "translate(0,"+h_hist+")").call(ap_hist_axis);
		hists.attr("apid", function(d){return d.apid}).attr("transform", function(d){
			var arr = d.ap.name.split(/f|ap/);
			arr.shift();
			var dx = x_ap_hist(arr.join("-"));
			return "translate("+dx+",0)";
		});
		hists.each(function(d){
			var ele = d3.select(this);
			var band = x_ap_hist.rangeBand();
			ele.select("rect.in").attr("width", band/2 - 1)
				.attr("height", h_hist - y_ap_hist(d.in))
				.attr("y", y_ap_hist(d.in))
				.on("mouseover", function(){
					$("#path-wrapper g.link[tid="+d.apid+"]").addClass("hover");
					// show device exchange number in other bars
					var in_links = d.in_links;
					update_exchange_hist(in_links, true);
				}).on("mouseleave", function(){
					$("#path-wrapper g.link[tid="+d.apid+"]").removeClass("hover");
				});
			ele.select("text.in").attr("x", band/4)
				.attr("y", y_ap_hist(d.in)).text(d.in)
				.attr("dy", -3);
			ele.select("rect.out").attr("width", band/2 - 1)
				.attr("height", h_hist - y_ap_hist(d.out))
				.attr("x", band/2).attr("y", y_ap_hist(d.out))
				.on("mouseover", function(){
					$("#path-wrapper g.link[sid="+d.apid+"]").addClass("hover");
					// show device exchange number in other bars
					var out_links = d.out_links;
					update_exchange_hist(out_links, false);
				}).on("mouseleave", function(){
					$("#path-wrapper g.link[sid="+d.apid+"]").removeClass("hover");
				});
			ele.select("text.out").attr("x", band*3/4)
				.attr("y", y_ap_hist(d.out)).text(d.out)
				.attr("dy", -3);
		}).on("mouseover", function(d){
			d3.select("#aps-wrapper").selectAll("g.ap").filter(function(a){
				return a.apid == d.apid;
			}).classed("hover", true);
			EventManager.apHover([d.apid], FloorDetail);
		}).on("mouseleave", function(d){
			d3.select("#aps-wrapper").selectAll("g.ap").filter(function(a){
				return a.apid == d.apid;
			}).classed("hover", false);
			EventManager.apDehover([d.apid], FloorDetail);
		});
	}
	function update_exchange_hist(links, isIn){
		var hists = d3.select("#floor-detail-ap-histogram").selectAll("g.exchange");
		if(links){
			hists = hists.data(links, function(d){return isIn ? d.sid : d.tid});
			var enter = hists.enter().append("g").attr("class", "exchange")
				.each(function(d){
					var ele = d3.select(this);
					ele.append("rect").attr("class", "in");
					ele.append("rect").attr("class", "out");
				});
			hists.exit().remove();
		}
		hists.attr("transform", function(d){
			var ap = apMap.get(isIn ? d.sid : d.tid);
			var arr = ap.name.split(/f|ap/);
			arr.shift();
			var name = arr.join("-");
			var dx = x_ap_hist(name);
			return "translate("+dx+")";
		}).each(function(d){
			var ele = d3.select(this);
			var band = x_ap_hist.rangeBand();
			var clss = isIn ? "in" : "out";
			var hcls = isIn ? "out" : "in";
			var dx = isIn ? 0 : band / 2;
			ele.select("rect." + clss).attr("x", dx)
				.attr("y", y_ap_hist(d.weight))
				.attr("width", band/2).attr("height", h_hist - y_ap_hist(d.weight))
				.style("opacity", 1);
			ele.select("rect."+hcls).style("opacity", 0);
		});
	}
	function filter_links(v1, v2){
		console.log("filter path", v1, v2);
		g.select("#path-wrapper").selectAll("g.link").style("display", function(d){
			console.log("weight", d.weight);
			if(+d.weight >= +v1 && +d.weight <= +v2){
				return "block";
			}else{
				return "none";
			}
		});
	}
	//
	return FloorDetail;
}

