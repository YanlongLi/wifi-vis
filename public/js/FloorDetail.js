
/*
 * global variable required:
 * apLst:
 * apMap:
 */
floor_image_size = WifiVis.FLOOR_IMG_SIZE;

/*
 * the interface:
 * changeFloor: iF
 * update_ap_device: apLst(with cluster)
 * update_links: [range]
 */
WifiVis.FloorDetail = function(selector, _iF){
	function FloorDetail(){}
	var iF;
	// defs
	var markerEndId = "arrowMarkerEnd";
	(function(){
		var svg = d3.select(selector + "> svg");
		utils.initArrowMarker(svg, markerEndId);
	})();
	//
	var o = utils.initSVG(selector, [0]), g = o.g;
	//
	var imgOriSize = {}, imgSize = {},
			x = d3.scale.linear(), y = d3.scale.linear(),
			img = g.append("image").attr("id","floor-background"),
			IMG_DIR = "data/floors/";
	var aps;
	var gBrush = g.append("g").attr("id", "brush-select").attr("class", 'brush');
	var	gPath = g.append("g").attr("id", "path-wrapper"),
		gAps = g.append("g").attr("id","aps-wrapper");
			//gFloorLabel = g.append("g").attr("class",'floor-label'),
	var brush = d3.svg.brush();
	gAps.append("rect").attr("class","placeholder");
	gPath.append("rect").attr("class","placeholder");
	//gFloorLabel.append('text');
	var imgOffset = [20,20];

	if(_iF){
		changeFloor(_iF);
	}
	var graphinfo;
	//
	FloorDetail.changeFloor = changeFloor;
	FloorDetail.move = moveImage;
	FloorDetail.moveRelative = moveRelative;
	FloorDetail.update_ap_device = update_ap_device;
	FloorDetail.update_links = function(range){
		if(!apMap){
			console.error("no global variable apMap");
			return;
		}
		if(!arguments.length){
			if(!graphinfo){
				console.error("no graphinfo, range not assigned");
			}
			var links = graphinfo.filter(function(link){
				var from = apMap.get(link.source),
							to = apMap.get(link.target);
				return from.floor == iF && to.floor == iF;
			});
			_update_links(links);
			return;
		}
		var from = new Date(range[0]), to = new Date(range[1]);
		var params = {start: +from.getTime(), end: +to.getTime()};
		var url = WifiVis.RequestURL.graphinfo(params);
		d3.json(url,function(err, _graphinfo){
			graphinfo = _graphinfo;
			console.log(graphinfo.length);
			var links = graphinfo.filter(function(link){
				var from = apMap.get(link.source),
							to = apMap.get(link.target);
				return from.floor == iF && to.floor == iF;
			});
			_update_links(links);
		});
	};
	FloorDetail.hide_links = function(){
		gPath.attr("opacity", 0);
		return FloorDetail;
	};
	FloorDetail.show_links = function(){
		gPath.attr("opacity", 1);
		return FloorDetail;
	}
	//
	function _imgPath(iF){return IMG_DIR+iF+"F.jpg"};
	function _resizeImg(){
		x.domain([0, imgOriSize.w]).range([0, imgSize.w]);
		y.domain([0, imgOriSize.h]).range([0, imgSize.h]);
		img.attr('width', imgSize.w);
		img.attr('height', imgSize.h);
		gAps.select("rect.placeholder").attr("width",imgSize.w).attr("height", imgSize.h);
		gPath.select("rect.placeholder").attr("width",imgSize.w).attr("height", imgSize.h);
		brush.x(d3.scale.identity().domain([-20, imgSize.w+20]))
			.y(d3.scale.identity().domain([-20, imgSize.h+20]));
		brush.on("brushstart", brushstart)
			.on("brush", brushed)
			.on("brushend", brushend);
		gBrush.call(brush);
	}
	function brushstart(d){
		console.log('brush start:', d);
	}
	function brushed(){
		var extent = brush.extent();
		console.log("extent", extent[0], extent[1]);
		deviceLst.forEach(function(d){
			d.device.selected = false;
			if(extent[0][0] <= d.x && d.x < extent[1][0]
					&& extent[0][1] <= d.y && d.y < extent[1][1]){
				d.device.selected = true;
				console.log("one device selected");
			}
		});
		gAps.selectAll("circle.device").classed("selected", function(d){
			if(d.device.selected){
				return true;
			}
			return false;
		});
	}
	function brushend(){
		d3.event.target.clear();
		d3.select(this).call(d3.event.target);
	}
	function changeFloor(_iF){
		iF = _iF;
		// update label
		//gFloorLabel.select("text").text("Floor " +iF);
		//
		console.log("change to floor:", iF);
		img.attr("xlink:href", _imgPath(iF));
		imgOriSize.w = floor_image_size[iF][0];
		imgOriSize.h = floor_image_size[iF][1];
		img.attr("width", imgOriSize.w);
		img.attr("height",imgOriSize.h);
		console.log("floor image original size:",imgOriSize.w,imgOriSize.h);
		// compute new size
		var ratioW, ratioH, ratio;
		ratio = (ratioW = imgOriSize.w / o.w) > (ratioH = imgOriSize.h / o.h)?
			ratioW:ratioH;
		imgSize.w = imgOriSize.w / ratio;
		imgSize.h = imgOriSize.h / ratio;
		console.log("floor image shown size:",imgSize.w,imgSize.h);
		//gFloorLabel.select("text").attr("x",imgSize.w/2).attr("y", imgSize.h/2);
		//
		_resizeImg();
		moveImage(imgOffset);

		//aps = dataCenter.find_aps({floors:[iF]});
		return FloorDetail;
	}
	var deviceLst = [];
	function _update_device(aps){
		// apLst:[{ap with cluster}]
		deviceLst = [];
		aps.forEach(function(ap){
			var px = ap.pos_x, py = ap.pos_y;
			ap.cluster.deviceLst().forEach(function(pos){
				var o = {};
				o.device = pos.device;
				o.mac = pos.device.mac;
				o.x = x(px) + pos.x;
				o.y = y(py) + pos.y;
				o.ap = ap;
				deviceLst.push(o);
			});
		});
		//console.log("device list", deviceLst.length, deviceLst.slice(0,10));
		var dvLst = gAps.selectAll("circle.device")
			.data(deviceLst, function(d){return d.mac});
		dvLst.enter().append("circle")
			.attr("class", "device")
			.attr("cx", function(d) {return d.x})
			.attr("cy", function(d){return d.y})
			.attr("r", 0);
		dvLst.on("mouseover", function(d){
			// TODO
			d3.select(this).append("title").text(d.mac);
		}).on("mouseout", function(d){
			d3.select(this).selectAll('title').remove();
		}).transition().attr("cx", function(d){return d.x})
			.attr("cy", function(d){return d.y})
			.attr("r", function(d){return 4});
		//dvLst.exit().transition().attr("cx", 0).attr("cy",0).remove();
		dvLst.exit().remove();
		return;
	}
	function _update_aps(aps){
		var apSel = gAps.selectAll("circle.ap")
			.data(aps,function(ap){return ap.apid});
		apSel.enter().append("circle").attr("class", "ap");
		apSel.attr("cx", function(d){return x(d.pos_x)})
			.attr("cy", function(d){return y(d.pos_y)})
			.attr("r", function(d){return 20})
			.on("mouseover", function(d){
				// TODO
				timeline.add_ap_timeline(d.apid);
				//console.log(d);
				d3.select(this).attr("opacity",1);
				d3.select(this).append('title').text(d.name);
			}).on("mouseout", function(d){
				d3.select(this).attr("opacity", 0);
				d3.select(this).selectAll("title").remove();
				timeline.remove_ap_timeline();
			});
		apSel.exit().remove();
	}
	function _update_links(links){
		console.log("links:",links.length, links.slice(0,10));
		links.forEach(function(link){
			var sourceAp = apMap.get(link.source);
			var targetAp = apMap.get(link.target);
			link.x1 = sourceAp.pos_x;
			link.y1 = sourceAp.pos_y;
			link.x2 = targetAp.pos_x;
			link.y2 = targetAp.pos_y;
		});
		console.log("link weight:",links.map(function(l){return +l.weight}).sort(function(a,b){return a-b}).join(","));
		var arcline = utils.arcline();
		var gLine = gPath.selectAll("path.link").data(links,function(l){
			return l.source + "," + l.target;
		});
		gLine.enter().append("path").attr("class","link");
		gLine.attr("d",function(d){
			var p1 = [x(d.x1),y(d.y1)];
      var p2 = [x(d.x2),y(d.y2)];
			return arcline([p1,p2]);
		}).transition().attr("marker-end", "url(#"+markerEndId+")")
		.style("stroke-width",function(d){return Math.log(d.weight+3)*3});
		gLine.exit().transition().style("stroke-width",0).remove();
	}
	function update_ap_device(apLst){
		if(!apMap){
			console.error("no global variable apMap");
			return;
		}
		var aps = apLst.filter(function(ap){
			return ap.floor == iF;
		});
		console.log("aps on floor", aps.length);
		_update_aps(aps);
		_update_device(aps);
	}
	function moveImage(offset){
		imgOffset = offset;
		img.transition().attr("x", imgOffset[0]).attr("y", imgOffset[1]);
		d3.selectAll("#path-wrapper, #aps-wrapper, #brush-select, .floor-label")
			.transition()
			.attr('transform', "translate("+imgOffset[0]+","+imgOffset[1]+")");
		//
		utils.log(["move image:", imgOffset]);
	}
	function moveRelative(offset){
		var dx = offset[0], dy = offset[1];
		imgOffset[0] += dx;
		imgOffset[1] += dy;
		moveImage(imgOffset);
	}
	//
	return FloorDetail;
};

function getPoint(p0, p1, tant){
	if(typeof tan == 'undefine') tan = 0.3;
	if(p0.x == p1.x && p0.y == p1.y) return {x:"",y:""};
	var l = Math.sqrt(tant*tant+1);
	var cosy = 1/l, siny = tant/l;
	var ux = p1.x - p0.x, uy = p1.y - p0.y;
	var len = Math.sqrt(ux*ux + uy*uy);
	var cosx = ux/len, sinx = uy/len;
	var cosr = cosx*cosy - sinx*siny;
	var sinr = cosx*siny + cosy*sinx;
	var ll = len/(2*cosy);
	var dx = ll*cosr, dy = ll*sinr;
	//console.log("cosx:", cosx, "sinx:", sinx, "dx:", dx, "dy:", dy);
	return {x:p0.x+dx, y:p0.y+dy, name:"mid"}
}

