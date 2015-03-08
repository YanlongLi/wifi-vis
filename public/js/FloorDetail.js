/*
 * global variable required:
 * apLst:
 * apMap:
 */
var floor_image_size = WFV.FLOOR_IMG_SIZE;

WifiVis.FloorDetail = function(){
	function FloorDetail(){}
	var floor_color = ColorScheme.floor;
	var opacity_by_stay_time = d3.scale.linear().range([1,0.1]).domain([60,120]).clamp(true);
	var svg = $("#floor-detail-svg");
	// defs
	// var markerEndId = "path-arrow";
	var markerId = {
		normal: "path-arrow-normal",
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
		
	var g = d3.select("#floor-detail-g");
	var size, imgOriSize = {}, imgSize = {},
			x = d3.scale.linear(), y = d3.scale.linear(),
			img = g.select("#floor-background"),
			IMG_DIR = "data/floors/";
	var r_scale = d3.scale.log().range([10, 30]).clamp(true);
			link_scale = d3.scale.linear().range([2, 10]);
	//var imgOffset = [20,20];
	var imgOffset = [0,0];
	function _imgPath(iF){return IMG_DIR+iF+"F.jpg"};

	var gBrush = g.select("#brush-select").attr("class", 'brush'),
		gPath = g.select("#path-wrapper"), gAps = g.select("#aps-wrapper");
	var brush = d3.svg.brush();

	var current_floor, aps;// aps on current floor
	var time_point, time_range = [timeFrom, timeTo],
		deviceLst = [], selected_aps = [];
	var interval, animation_status = 0;
	var graphinfo, links;

	init_svg();
	init_interaction();

	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [0,40,0,0]);
	}
	ObserverManager.addListener(FloorDetail);
	FloorDetail.OMListen = function(message, data){
		if(message == WFV.Message.FloorChange){
			stopAnimation();
			console.log("change_floor", data);
			current_floor = +data.floor;
			change_image();
			resize_image();
			move_image();
			aps = apLst.filter(function(ap){return ap.floor == current_floor});
			update_aps(aps);
			update_device(aps);
			load_new_data(function(){
				update_links(links);
			});
		}
		if(message == WFV.Message.ApHover){
			var apdis = data.apids, change = data.change;
			if(data.isAdd){
				change.forEach(function(apid){
					$("#aps-wrapper g.ap[apid="+apid+"]").addClass("hover");
				});
			}else{
				change.forEach(function(apid){
					$("#aps-wrapper g.ap[apid="+apid+"]").removeClass("hover");
				});
			}
		}
		if(message == WFV.Message.ApSelect){// isAdd true or false
			var apids = data.apid;
			console.log("aps selected", apids);
			if(!apids.length){// no ap selected , back to normal
				$("#aps-wrapper g.ap").removeClass("fading").attr("_selected", null);
				$("#path-wrapper g.link").removeClass("fading").removeClass("hilight");
				return;
			}
			// fading all aps and links
			$("#aps-wrapper g.ap").addClass("fading").attr("_selected", null);
			$("#path-wrapper g.link").addClass("fading").removeClass("hilight");
			apids.forEach(function(apid){
				var ele = $("#aps-wrapper g.ap[apid="+apid+"]");
				ele.removeClass("fading").attr("_selected", true);
				// hilight path
				$("#path-wrapper g.link[sid="+apid+"]")
					.removeClass("fading").addClass("hilight");
				$("#path-wrapper g.link[tid="+apid+"]")
					.removeClass("fading").addClass("hilight");
			});
		}
		if(message == WFV.Message.DeviceSelect){
			// TODO
			var devs = data.device, change = data.change, isAdd = data.isAdd;
			if(isAdd){
		
			}else{
				
			}
		}
		if(message == WFV.Message.TimePointChange){
			time_point = data.time;
			tracer.gotoTime(time_point);
			update_aps(aps);
			update_device(aps);
		}
		if(message == WFV.Message.TimeRangeChange){
			stopAnimation();
		}
		if(message == WFV.Message.TimeRangeChanged){
			time_range = data.range;
			load_new_data(function(){
				update_links(links);
			});
		}
	}
	FloorDetail.startAnimation = startAnimation;
	FloorDetail.stopAnimation = stopAnimation;
	AnimationStatus = {stopped:0, running:1, paused: 2};
	function startAnimation(){
		if(animation_status == AnimationStatus.running){
			return;
		}
		var from = time_point || time_range[0], to = time_range[1];
		animation_status = AnimationStatus.running;
		interval = setInterval(function(){
			console.log("goto time", from.to_time_str());
			tracer.gotoTime(from);
			update_aps(aps);
			update_device(aps);
			time_point = from;
			// TODO whether fire time point change
			from.setMinutes(from.getMinutes() + 1);
			if(from - to >= 0){
				clearInterval(interval);
				animation_status = AnimationStatus.stopped;
				tracer.gotoTime(time_range[0]);
				time_point = time_range[0];
			}
		}, 1000);
	}
	function pauseAnimation(){
		if(animation_status == AnimationStatus.running){
			animation_status = AnimationStatus.paused;
			clearInterval(interval);
		}
	}
	function stopAnimation(){
		if(animation_status == AnimationStatus.stopped){
			return;
		}
		animation_status = AnimationStatus.stopped;
		clearInterval(interval);
		tracer.gotoTime(time_range[0]);
		time_point = time_range[0];
	}
	function init_interaction(){
		$(document).on("click","#aps-wrapper g.ap", function(e){
			var apid = $(this).attr("apid");
			console.log("apid clicked", apid);
			if($(this).attr("_selected")){
				EventManager.apDeselect([apid]);
			}else{
				EventManager.apSelect([apid]);
			}
		});
		$(document).on("mouseenter", "#aps-wrapper g.ap", function(e){
			var apid = $(this).attr("apid");
			EventManager.apHover([apid]);
		});
		$(document).on("mouseleave", "#aps-wrapper g.ap", function(e){
			var apid = $(this).attr("apid");
			EventManager.apDehover([apid]);
		});
		// device, event add when add element
		// path
		$(document).on("mouseenter", "#path-wrapper g.link", function(e){
			var opa = d3.select(this).style("opacity");
			if(opa && opa > 0){
				d3.select(this).classed("hover", true);
			}
			//TODO
		});
		$(document).on("mouseleave", "#path-wrapper g.link", function(e){
			d3.select(this).classed("hover", false);
			//TODO
		});
	}
	$(window).resize(function(e){
		init_svg();
		resize_image();
		update_links();
		update_aps();
		update_device();
	});
	function load_new_data(cb){// load new graph link data
		var range = time_range;
		var from = new Date(range[0]), to = new Date(range[1]);
		db.graph_info(from, to, function(_graphinfo){
			graphinfo = _graphinfo;
			links = graphinfo.filter(function(link){
				link.sid = link.source;
				link.tid = link.target;
				var from = apMap.get(link.source),
				to = apMap.get(link.target);
				return from.floor == current_floor && to.floor == current_floor;
			});
			cb();
		});
	}
	function change_image(){
		img.attr("xlink:href", _imgPath(current_floor));
		imgOriSize.w = floor_image_size[current_floor][0];
		imgOriSize.h = floor_image_size[current_floor][1];
		img.attr("width", imgOriSize.w);
		img.attr("height",imgOriSize.h);
		console.log("floor image original size:",imgOriSize.w,imgOriSize.h);
	}
	function resize_image(){
		// resize, compute new size
		var ratioW, ratioH, ratio;
		ratio = (ratioW = imgOriSize.w / size.width) > (ratioH = imgOriSize.h / size.height)? ratioW:ratioH;
		imgSize.w = imgOriSize.w / ratio;
		imgSize.h = imgOriSize.h / ratio;
		console.log("floor image shown size:",imgSize.w,imgSize.h);
		//
		x.domain([0, imgOriSize.w]).range([0, imgSize.w]);
		y.domain([0, imgOriSize.h]).range([0, imgSize.h]);
		img.attr('width', imgSize.w);
		img.attr('height', imgSize.h);
		gAps.select("rect.placeholder").attr("width",imgSize.w).attr("height", imgSize.h);
		gPath.select("rect.placeholder").attr("width",imgSize.w).attr("height", imgSize.h);
		brush.x(d3.scale.identity().domain([-60, imgSize.w+60]))
			.y(d3.scale.identity().domain([-60, imgSize.h+60]));
		brush.on("brushstart", brushstart)
			.on("brush", brushed)
			.on("brushend", brushend);
		g.select("#brush-select").call(brush);
		//
		console.log("svg size", svg.width(), svg.height());
		console.log("image shown size", imgSize.w, imgSize.h);
		var dx = (svg.width() - imgSize.w) / 2;
		var dy = (svg.height() - imgSize.h) / 2;
		g.attr("transform", "translate("+dx+","+dy+")");
	}
	function move_image(){
		// move by imgOffset
		img.transition().attr("x", imgOffset[0]).attr("y", imgOffset[1]);
		d3.selectAll("#path-wrapper, #aps-wrapper, #brush-select, #device-wrapper")
			.transition()
			.attr('transform', "translate("+imgOffset[0]+","+imgOffset[1]+")");
	}
	function update_aps(_data){
		// [{apid, name, pos_x, pos_y, count, cluster}]	
		// if no _data, resize
		var gAps = g.select("#aps-wrapper").selectAll("g.ap");
		if(_data){
			var cmax= d3.max(_data, function(d){return d.cluster.count});
			cmax = cmax > 2 ? cmax : 2;
			r_scale.domain([1, cmax]);
			gAps = gAps.data(_data, function(d){return d.apid});
			var ap_enter = gAps.enter().append("g").attr("class", "ap");
			ap_enter.append("circle");
			gAps.exit().remove();
		}
		gAps.attr("apid", function(d){return d.apid})
		gAps.select("circle").datum(function(d){return d})
			.attr("cx", function(d){return x(d.pos_x)})
			.attr("cy", function(d){return y(d.pos_y)})
			.attr("r", function(d){
				var r = r_scale(d.cluster.count);
				if(isNaN(r)){
					console.log(r_scale.domain(), r_scale.range(), d.cluster);
					console.warn("illegal r", r);
				}
				return r;
			}).style("fill", floor_color(current_floor));
		console.log(floor_color(current_floor));
		return;
		// update device
		gAps.each(function(ap){
			var px = ap.pos_x, py = ap.pos_y;
			var deviceLst = ap.cluster.deviceLst().map(function(pos){
				var o = {};
				o.device = pos.device;
				o.mac = pos.device.mac;
				o.x = px;
				o.y = py;
				o.dx = pos.x;
				o.dy = pos.y;
				o.ap = ap;
				return o;
			});
			var devs = d3.select(this).selectAll(".device").data(deviceLst, function(d){return d.mac});
			var devs_enter = devs.enter().append("g").attr("class","device");
			devs_enter.append("rect");
			devs.classed("selected", function(d){
				if(d.device.selected){
					console.log("====================selected");
				}
				return d.device.selected;
			});
			devs.transition().attr("transform", function(d){
				var dx = x(d.x) + d.dx;
				var dy = y(d.y) + d.dy;
				return "translate("+dx+","+dy+")";
			})
			devs.select("rect").datum(function(d){return d})
				.attr("width", 6).attr("height", 6);
			devs.exit().remove();
		});
	}
	function update_links(_data){
		// [{sid:, tid:, weight:}]
		// if no _data, resize
		var gLinks = g.select("#path-wrapper").selectAll("g.link");
		if(_data){
			_data.forEach(function(link){
				var sourceAp = apMap.get(link.source);
				var targetAp = apMap.get(link.target);
				link.sap = sourceAp;
				link.tap = targetAp;
				link.x1 = sourceAp.pos_x;
				link.y1 = sourceAp.pos_y;
				link.x2 = targetAp.pos_x;
				link.y2 = targetAp.pos_y;
			});
			//
			var extent = d3.extent(_data, function(d){return d.weight});
			extent[0] = extent[0] < 1? 1: extent[0];
			link_scale.domain(extent);
			gLinks = gLinks.data(_data, function(d){return d.sid + "," + d.tid});
			var link_enter = gLinks.enter().append("g").attr("class", "link");
			link_enter.append('path');
			gLinks.exit().remove();
		}
		var arcline = utils.arcline();
		gLinks.attr("sid", function(d){return d.sid})
			.attr("tid", function(d){return d.tid});
		gLinks.select("path").datum(function(d){return d})
			.attr("marker-end", "url(#"+markerId.normal+")")
			.attr("d",function(d){
				var p1 = [x(d.x1),y(d.y1), r_scale(d.sap.cluster.count)];
				var p2 = [x(d.x2),y(d.y2), r_scale(d.tap.cluster.count)];
				if(p1[0] == p2[0] && p1[1] == p2[1]){
					return "M"+p1[0]+","+p1[1];
				}
				return arcline([p1,p2]);
			}).style("stroke-width",function(d){
				return link_scale(d.weight);
			});
	}
	function update_device(_data){// update device pos by aps(current floor)
		// assume apLst exist[{ap with cluster}]
		// if no_data, resize
		var gDevice = g.select("#device-wrapper").selectAll("g.device");
		if(_data){
			deviceLst = [];
			_data.forEach(function(ap){
				var px = ap.pos_x, py = ap.pos_y;
				ap.cluster.deviceLst().forEach(function(pos){
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
			var device_enter = gDevice.enter().append("g")
				.attr("class","device");
			device_enter.append("rect").attr("width", 6)
				.attr("height", 6).style("fill", "red");
			device_enter.selectAll("rect").transition().style("fill", null);
			var device_exit = gDevice.exit();
			device_exit.transition()
				.duration(500).attr("transform", function(d){
					var p = WFV.VIR_AP_POS[current_floor][1];
					var dx = x(p[0]);
					var dy = y(p[1]);
					return "translate("+dx+","+dy+")";
				}).transition().remove()
		}
		gDevice.classed("hilight", function(d){
			return d.device.selected;
		}).attr("mac",function(d){return d.mac});
		gDevice.transition().duration(500).attr("transform", function(d){
			var dx = x(d.x) + d.dx;
			var dy = y(d.y) + d.dy;
			return "translate("+dx+","+dy+")";
		});
		gDevice.select("rect").datum(function(d){return d})
			.attr("width", 6).attr("height", 6)
			.style("opacity", function(d){
				var stay_time_minute = Math.round(d.device.stayTime(tracer.cur)/(1000*60));
				return opacity_by_stay_time(stay_time_minute);
			});
		// event listener
		//
		gDevice.on("click", deviceClick)
			.on("mouseover", deviceHover)
			.on("mouseout", deviceDehover);
		function deviceClick(d){
			var ele = d3.select(this);
			if(ele.attr("_selected")){
				ele.attr("_selected", null).classed("selected", false);
				d.device.selected = false;
				EventManager.deviceSelect([d.mac]);
			}else{
				ele.attr("_selected", true).classed("selected", true);
				d.device.selected = true;
				EventManager.deviceDeselect([d.mac]);
			}
		}
		function deviceHover(d){
			EventManager.apHover([d.ap.apid]);
			d3.select(this).classed("hover", true);
			d3.select(this).classed('hover', true);
		}
		function deviceDehover(d){
			EventManager.apDehover([d.ap.apid]);
			d3.select(this).classed("hover", false);
			d3.select(this).classed('hover', false);
		}
		return;
	}
	//
	function brushstart(){
		// unselected device
		deviceLst.forEach(function(d){
			d.selected = false;
		});
	}
	function brushed(){
		var extent = brush.extent();
		deviceLst= [];
		g.selectAll("#device-wrapper").selectAll("g.device")
			.classed("selected", false);
		g.selectAll("#aps-wrapper").selectAll("g.device")
			.classed("selected", false);

		g.selectAll("#device-wrapper, #aps-wrapper").selectAll("g.device")
			.classed("selected", function(d){
				var px = x(d.x) + d.dx;
				var py = y(d.y) + d.dy;
				if(extent[0][0] <= px && px < extent[1][0]
						&& extent[0][1] <= py && py < extent[1][1]){
					d.device.selected = true;
				}else{
					d.device.selected = false;
				}
				if(d.device.selected){
					deviceLst.push(d.device);
					return true;
				}
				return false;
			});
	}
	function brushend(){
		console.log("on brush end, device selected", deviceLst.length);
		// console.log(deviceLst.map(function(d){return d.mac}).join(","));
		// console.log(time_point.to_time_str());
		d3.event.target.clear();
		d3.select(this).call(d3.event.target);
		//
		var selected_device = deviceLst.filter(function(d){
			return d.selected;
		}).map(function(d){return d.mac});
		// first unselect
		EventManager.deviceDeselect(null);
		EventManager.deviceSelect(selected_device);
	}
	//
	return FloorDetail;
};

