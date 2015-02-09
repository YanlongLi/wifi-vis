
/*
 *
 */
floor_image_size = WifiVis.FLOOR_IMG_SIZE;

WifiVis.FloorDetail = function(selector, _iF){
	function FloorDetail(){}
	var color = d3.interpolateLab("#008000", "#c83a22");
	//
	var iF;
	var o = utils.initSVG(selector, [0]), g = o.g;
	// defs
	var marker = o.svg.append("defs").append("marker")
		.attr("id","triangle").attr("viewBox","0 0 60 40")
		.attr("refX","40").attr("refY", "10")
		.attr("markerUnits","strokeWidth")
		.attr("markerWidth", 24).attr("markerHeight", 12)
		.attr("orient", "auto")
		.attr("fill","#8C564B").attr("opacity", 0.4);
	marker.append("path").attr("d", "M 0 0 L 30 10 L 0 20 z");
	//
	var imgOriSize = {}, imgSize = {},
			x = d3.scale.linear(), y = d3.scale.linear(),
			img = g.append("image").attr("id","floor-background"),
			IMG_DIR = "data/floors/";
	var aps;
	var gAps = g.append("g").attr("id","aps-wrapper"),
			gPath = g.append("g").attr("id", "path-wrapper"),
			//gFloorLabel = g.append("g").attr("class",'floor-label'),
			pathF = d3.svg.line()
				.x(function(d){return x(d.ap.pos_x)})
				.y(function(d){return y(d.ap.pos_y)});
	gAps.append("rect").attr("class","placeholder");
	gPath.append("rect").attr("class","placeholder");
	//gFloorLabel.append('text');
	var imgOffset = [20,20];

	if(_iF){
		changeFloor(_iF);
	}
	//
	FloorDetail.changeFloor = changeFloor;
	FloorDetail.move = moveImage;
	FloorDetail.moveRelative = moveRelative;
	FloorDetail.drawPath = drawPath;
	FloorDetail.drawAps = _drawAps;
	//
	function _imgPath(iF){return IMG_DIR+iF+"F.jpg"};
	function _resizeImg(){
		x.domain([0, imgOriSize.w]).range([0, imgSize.w]);
		y.domain([0, imgOriSize.h]).range([0, imgSize.h]);
		img.attr('width', imgSize.w);
		img.attr('height', imgSize.h);
		gAps.select("rect.placeholder").attr("width",imgSize.w).attr("height", imgSize.h);
		gPath.select("rect.placeholder").attr("width",imgSize.w).attr("height", imgSize.h);
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
	function _drawAps(apLst){
		var aps = apLst.filter(function(ap){
			return ap.floor == iF;
		});
		var deviceLst = [];
		aps.forEach(function(ap){
			var px = ap.pos_x, py = ap.pos_y;
			ap.cluster.deviceLst().forEach(function(pos){
				var o = {};
				o.device = pos.device;
				o.x = px + pos.x;
				o.y = py + pos.y;
				o.ap = ap;
				deviceLst.push(o);
			});
		});
		var dvLst = gAps.selectAll("circle.device").data(deviceLst, function(d){return d.mac});
		dvLst.enter().append("circle").attr("class", "device");
		dvLst.attr("cx", function(d){return x(d.x)})
			.attr("cy", function(d){return y(d.y)})
			.attr("r", function(d){return x(2)});

	}
	var pathByMac, numByAp;
	function drawPath(_pathByMac){
		pathByMac = _pathByMac;
		//
		var records = Array.prototype.concat.apply([], pathByMac);
		var i = -1, len = records.length, r;
		numByAp = d3.map();
		//console.log("record size:", records.length);
		while(++i < len){
			r = records[i];
			if(numByAp.has(r.apid)){
				numByAp.set(r.apid, numByAp.get(r.apid)+1);
			}else{
				numByAp.set(r.apid, 1);
			}
		}
		console.log("mapsize:", numByAp.size());
		aps = apCenter.findAllApsOnFloor(iF);
		_drawAps(aps);
		//
		console.log("draw path, path number:", pathByMac.length);
		var selPath = gPath.selectAll("path").data(pathByMac);
		var selPathEnter = selPath.enter().append("path");
		selPath.attr("d", function(path){
			var len = path.length;
			if(len <= 2) return "";
			var res = "";
			path.forEach(function(r,i){
				if(i == 0) return;
				var p0 = {x:x(path[i-1].ap.pos_x), y:y(path[i-1].ap.pos_y)};
				var p1 = {x:x(r.ap.pos_x), y:y(r.ap.pos_y)};
				var p = getPoint(p0, p1);
				res = res + " Q"+p.x+","+p.y+" "+p1.x+","+p1.y+" ";
			});
			res = "M"+x(path[0].ap.pos_x)+","+y(path[0].ap.pos_y)+res;
			//console.log("res",res);
			return res;
		});
		//.attr("marker-mid","url(#triangle)");
		selPath.exit().remove();
	}
	function moveImage(offset){
		imgOffset = offset;
		img.transition().attr("x", imgOffset[0]).attr("y", imgOffset[1]);
		d3.selectAll("#path-wrapper, #aps-wrapper, .floor-label")
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

