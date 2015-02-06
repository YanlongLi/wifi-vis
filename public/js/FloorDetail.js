/*
 *
 */
floor_image_size = WifiVis.FLOOR_IMG_SIZE;

WifiVis.FloorDetail = function(selector, _iF){
	function FloorDetail(){}
	//
	var iF;
	var o = utils.initSVG(selector, [0]), g = o.g;
	//
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
	//
	function _imgPath(iF){return IMG_DIR+iF+"F.jpg"};
	function _resizeImg(){
		x.domain([0, imgOriSize.w]).range([0, imgSize.w]);
		y.domain([0, imgOriSize.h]).range([0, imgSize.h]);
		img.attr('width', imgSize.w);
		img.attr('height', imgSize.h);
		img.attr('opacity', 0.3);
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
	function _drawAps(aps){
		aps.forEach(function(ap){
			ap.c = numByAp.get(ap.apid) || 0;
			if(ap.c == 0){
				console.log("empty ap:", ap);
			}
		});
		console.log("draw_aps:",aps.length);
		apSel = gAps.selectAll("circle").data(aps);
		apSelEnter = apSel.enter().append("circle");
		apSel.attr("cx", function(ap){return x(ap.pos_x)})
			.attr("cy", function(ap){return y(ap.pos_y)})
			.attr("opacity","0.3")
			.attr("r",function(ap){
				return ap.c/10 > 5?ap.c/10:5;
			}).on("mouseover", function(ap){
				d3.select(this).append("title").text("Record Num:"+ap.c);
			}).on("mouseout", function(ap){
				d3.select(this).selectAll('title').remove();
			});
		apSel.attr("title",function(ap){return ap.name});
		apSel.exit().remove();
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
		/*
		d3.json("/getApsByFloor?floor="+iF, function(err, _aps){
			console.log("get aps by floor:",iF);
			aps = _aps.map(function(ap){
				ap.apid = +ap.apid;
				ap.floor = +ap.floor;
				ap.pos_x = ap.x;
				ap.pos_y = ap.y;
				delete ap.x;
				delete ap.y;
			});
			_drawAps(aps);
		});*/
		_drawAps(aps);
		//
		utils.log(["draw path, path number:", pathByMac.length]);
		var sPath = gPath.selectAll("g.path-g").data(pathByMac);
		/*
		sPath.enter().append('g').attr("path-g");
		sPath.each(function(path, index){
			var data =  path.map(function(r,i){
				if(i == 0) return null;
				return [r, path[i-1]];
			});
			data.shift();
			var sP = d3.select(this).selectAll('path').data(data);
			sP.enter().append('path');
			sP.attr('d', pathF).attr('marker-end', 'url(#triangle)')
				.attr('stroke','url(#grad)');
			sP.exit().remove();
		});
		*/
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
function getPoint(p0, p1){
	if(p0.x == p1.x && p0.y == p1.y) return {x:"",y:""};
	var tant = -0.3, l = Math.sqrt(tant*tant+1);
	var cosy = 1/l, siny = tant/l;
	var ux = p1.x - p0.x, uy = p1.y - p0.y;
	var len = Math.sqrt(ux*ux + uy*uy);
	var cosx = ux/len, sinx = uy/len;
	var cosr = cosx*cosy - sinx*siny;
	var sinr = cosx*siny + cosy*sinx;
	var ll = len/(2*cosy);
	var dx = ll*cosr, dy = ll*sinr;
	//console.log("cosx", cosx);
	//console.log("sinx", sinx);
	//console.log("dx", dx);
	//console.log("dy", dy);
	return {x:p0.x+dx, y:p0.y+dy, name:"mid"}
}

