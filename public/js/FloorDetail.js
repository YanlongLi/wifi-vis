WifiVis.FloorBar = function(g,w,h){
	function FloorBar(){}
	//
	var hRect, dia;
	var gFloor;
	var curFloor;
	var listeners = d3.map();
	FloorBar.EventType = {EVENT_FLOOR_CHANGE: "FloorChange"};
	init();
	(function(){
		Object.defineProperty(FloorBar, "hRect", {
			get: function(){return hRect}
		});
		Object.defineProperty(FloorBar, "dia", {
			get: function(){return dia}
		});
	});
	//FloorBar.init = init;
	function init(){
		g.attr("width", w).attr("height", h)
			.attr('id',"floor-bar");
		hRect = h / 17;
		dia = hRect < w ? hRect : w;
		gFloor = g.selectAll("g.floor").data(d3.range(1,18));
		var gEnter = gFloor.enter().append("g").attr("class", "floor");
		gEnter.append("circle");
		gEnter.append("text");
		gFloor.attr('transform', function(d,i){
			var dy = hRect*i;
			return "translate(0,"+dy+")";
		}).attr("id",function(d){return "floor-"+d});
		gFloor.selectAll("circle")
			.attr("cx", dia/2).attr("cy", dia/2).attr("r", dia/2);
		gFloor.selectAll("text").text(function(i){return i})
			.attr("dy", dia/2+4).attr("dx", dia/2).style("text-anchor", "middle");
		//
		gFloor.on("click", function(d){
			gFloor.selectAll("circle").classed('pushed', false);
			var that = d3.select(this);
			that.select("circle").classed("pushed", true);
			// TODO
			curFloor = d;
			fireEvent(FloorBar.EventType.EVENT_FLOOR_CHANGE, curFloor);
		});
		//	_set_init_floor(1);
		//
		//
		gFloor.exit().remove();
	}
	FloorBar.set_init_floor = _set_init_floor;
	function _set_init_floor(f){
		curFloor = f;
		d3.select("#floor-"+curFloor + " > circle").classed("pushed", true);
		// TODO
		fireEvent(FloorBar.EventType.EVENT_FLOOR_CHANGE, curFloor);
	}
	FloorBar.addFloorChangeListener = function(obj){
		addEventListener(FloorBar.EventType.EVENT_FLOOR_CHANGE, obj);
	}
	function addEventListener(type, obj){
		if(!listeners.has(type)){
			listeners.set(type,[obj]);
		}else{
			listeners.get(type).push(obj);
		}
	}
	function removeEventListener(type, obj){
		if(!listeners.has(type)){
			return;
		}else{
			var objs = listeners.get(type);
			var len = objs.length, i = -1;
			while(++i < len){
				if(objs[i] === obj){
					break;
				}
			}
			if(i == len) return;
			objs = objs.slice(0,i).concat(objs.slice(i+1,len));
			listeners.put(type, objs);
		}
	}
	function fireEvent(type){
		var params = Array.prototype.slice.call(arguments, 1); 
		var objs = listeners.get(type);
		if(!objs || !objs.length) return;
		var i = -1, len = objs.length;
		while(++i < len){
			var fn = objs[i]["on"+type];
			fn.apply(objs[i], params);
		}
	}
	//
	return FloorBar;
}


/*
 * global variable required:
 * apLst:
 * apMap:
 */
var floor_image_size = WifiVis.FLOOR_IMG_SIZE;

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
	var markerEndId = "path-arrow";
	(function(){
		var svg = d3.select(selector + "> svg");
		utils.initArrowMarker(svg, markerEndId);
		utils.initArrowMarker(svg, markerEndId + "-hilight");
	})();
	//
	var o = utils.initSVG(selector, [0, 40, 0, 0]), g = o.g;
	var bar = WifiVis.FloorBar(o.svg.append("g"), 40, o.h);
	bar.addFloorChangeListener(FloorDetail);
	FloorDetail.addFloorChangeListener = function(obj){
		bar.addFloorChangeListener(obj);
	};
	//
	var listeners = d3.map();
	FloorDetail.EventType = {
		AP_CLICK: "ApClick",
		AP_MOUSE_ENTER: "ApMouseEnter",
		AP_MOUSE_LEAVE: "ApMouseLeave",
		DEVICE_SELECT: "DeviceSelect"
	}
	FloorDetail.addEventListener = addEventListener;
	FloorDetail.removeEventListener = removeEventListener;
	function addEventListener(type, obj){
		if(!listeners.has(type)){
			listeners.set(type,[obj]);
		}else{
			listeners.get(type).push(obj);
		}
	}
	function removeEventListener(type, obj){
		if(!listeners.has(type)){
			return;
		}else{
			var objs = listeners.get(type);
			var len = objs.length, i = -1;
			while(++i < len){
				if(objs[i] === obj){
					break;
				}
			}
			if(i == len) return;
			objs = objs.slice(0,i).concat(objs.slice(i+1,len));
			listeners.put(type, objs);
		}
	}
	function fireEvent(type){
		var params = Array.prototype.slice.call(arguments, 1); 
		var objs = listeners.get(type);
		if(!objs || !objs.length) return;
		var i = -1, len = objs.length;
		while(++i < len){
			var fn = objs[i]["on"+type];
			fn.apply(objs[i], params);
		}
	}
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

	var graphinfo;
	var nSelectedAp = 0;
	//
	FloorDetail.changeFloor = changeFloor;
	FloorDetail.set_init_floor = function(){
		bar.set_init_floor(1);
	}
	FloorDetail.onFloorChange = function(f){
		changeFloor(f);
		update_ap_device(apLst);
		gPath.selectAll("path.link").remove();
		var initRange = [timeFrom, timeTo];
		update_links(initRange);
		nSelectedAp = 0;
	};
	FloorDetail.onApClick = function(ap){
		if(ap.floor != iF){
			return;
		}
		var apSel = gAps.selectAll("circle.ap").filter(function(d){
			return d.apid == ap.apid;
		}).each(function(d,i){
			_on_ap_click.call(this, d, i);
		});
	}
	FloorDetail.move = moveImage;
	FloorDetail.moveRelative = moveRelative;
	FloorDetail.update_ap_device = update_ap_device;
	FloorDetail.update_links = update_links;
	//bar.init();
	function update_links(range){
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
		db.graph_info(from, to, function(_graphinfo){
			graphinfo = _graphinfo;
			console.log(graphinfo.length);
			var links = graphinfo.filter(function(link){
				var from = apMap.get(link.source),
				to = apMap.get(link.target);
				return from.floor == iF && to.floor == iF;
			});
			console.log(links);
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
			}
		});
		gAps.selectAll("rect.device").classed("selected", function(d){
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
		var dvLst = gAps.selectAll("rect.device")
			.data(deviceLst, function(d){return d.mac});
		var dvEnter = dvLst.enter().append("rect").attr("class", "device");
		dvEnter.each(function(d){
			var circle = d3.select(this);
			var device = d.device;
			var preR = device.previousRecord();
			if(!preR){
				circle.attr("x", -20).attr("y", 0)
					.style("fill","red").attr("width", 10).attr("height", 10);
			}else{
				circle.attr("x", -20)
					.attr("y", o.h/17*preR.floor).attr("width",10).attr("height", 10);
			}
		});
		dvLst.on("mouseover", function(d){
			// TODO
			d3.select(this).append("title").text(d.mac);
		}).on("mouseout", function(d){
			d3.select(this).selectAll('title').remove();
		});
		dvLst.style("fill",null)
			.transition().attr("x", function(d){return d.x})
			.attr("y", function(d){return d.y})
			.attr("width", 8).attr("height", 8);
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
			.on("click", _on_ap_click)
			.on("mouseenter", _on_ap_enter)
			.on("mouseleave", _on_ap_leave);
		apSel.exit().remove();
	}
	var apcolor = WifiVis.AP_COLOR;
	function _on_ap_click(d){
		var selected = d3.select(this).classed("hilight");
		d3.select(this).classed("hilight",!selected)
			.style("fill",function(d){
				return selected? null: apcolor(d.apid);
			});
		// TODO
		if(!selected){
			gPath.selectAll("path.link").attr("class", function(d){
				if(d3.select(this).classed("hilight")){
					return d3.select(this).attr("class");
				}
				if(d3.select(this).classed("reverse")){
					return d3.select(this).attr("class");
				}
				return "link fade";
			});
			d3.selectAll($("#path-wrapper path.link[source="+d.apid+"]"))
				.classed("hilight",true)
				.style("stroke",function(d){
					return apcolor(d.source);
				});
			d3.selectAll($("#path-wrapper path.link[target="+d.apid+"]"))
				.attr("class", function(d){
					if(d3.select(this).classed("hilight")){
						return "link fade reverse hilight";
					}
					return "link fade reverse";
				});
			nSelectedAp ++;
		}else{
			d3.selectAll($("#path-wrapper path.link[source="+d.apid+"]"))
				.style("stroke",null)
				.attr("class", function(d){
					if(d3.select(this).classed("reverse")){
						return "link fade reverse";
					}
					return "link fade";
				});
			d3.selectAll($("#path-wrapper path.link[target="+d.apid+"]"))
				.attr("class", function(d){
					if(d3.select(this).classed("hilight")){
						return "link hilight";
					}
					return "link fade";
				});
			nSelectedAp --;
			if(nSelectedAp == 0){
				d3.selectAll("#path-wrapper path.link").attr("class", "link");
			}
		}
		//
		fireEvent(FloorDetail.EventType.AP_CLICK, d, !selected);
	}
	function _on_ap_enter(d){
		d3.select(this).append("title").text(d.name);
		if(!d3.select(this).classed("hilight")){
			return;
		}
		gPath.selectAll("path.link").style("opacity", function(d){
			var that = d3.select(this);
			var c = that.attr("class");
			if(c == "link fade reverse"){
				return 0;
			}
			return that.attr("opacity");
		});
		fireEvent(FloorDetail.EventType.AP_MOUSE_MOVE, d);
	}
	function _on_ap_leave(d){
		d3.select(this).select("title").remove();
		if(!d3.select(this).classed("hilight")){
			return;
		}
		gPath.selectAll("path.link").style("opacity", function(d){
			var that = d3.select(this);
			var c = that.attr("class");
			if(c == "link fade reverse"){
				return null;
			}
			return that.attr("opacity");
		});
		fireEvent(FloorDetail.EventType.AP_MOUSE_LEAVE, d);
	}
	function _update_links(links){
		//console.log("links:",links.length, links.slice(0,10));
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
		gLine.enter().append("path").attr("class",function(d){
			return nSelectedAp?"link fade":"link";
		});
		gLine.attr("d",function(d){
			var p1 = [x(d.x1),y(d.y1), 20];
      var p2 = [x(d.x2),y(d.y2), 20];
			return arcline([p1,p2]);
		}).attr("source", function(l){return l.source})
		.attr("target", function(l){return l.target})
		.on("mousemove", function(d){
			// TODO
			/*d3.select(this).style("stroke","#000000").attr("opacity", 1);
			d3.select(this).append("title").text(function(d){
				return d.weight;
			});*/
		}).on("mouseleave", function(d){
			// TODO
			/*d3.select(this).style("stroke", "rgb(115, 115, 115)").attr("opacity", 0.7);
			d3.select(this).selectAll("title").remove();*/
		}).transition().attr("marker-end", "url(#"+markerEndId+")")
		.style("stroke-width",function(d){return Math.log10(d.weight+3)*3});
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
		console.log("move image:", imgOffset);
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

