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
	o.svg.append('svg:defs').append('svg:marker')
		.attr('id', 'triangle')
		.attr('viewBox', '0 -5 10 10')
		.attr('refX', -16)
		.attr('markerWidth', 6)
		.attr('markerHeight', 6)
		.attr('orient', 'auto')
		.append('svg:path')
		.attr('d', 'M0,-5L10,0L0,5')
		.attr('fill', 'rgb(148, 103, 189)').attr('opacity',0.7);
	var gradient = o.svg.append('defs').append('linegradient').attr('id','grad')
		.attr('gradientUnits','userSpaceOnUse')
		.attr({ "x1":0,"y1":0,"x2":10,"y2":10 });
	gradient.append('stop').attr('offset', "20%").attr("stop-color","#39F");
	gradient.append('stop').attr('offset', "90%").attr("stop-color","#F3F");
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
				.y(function(d){return y(d.ap.pos_y)})
				//.interpolate('basis');
				//.interpolate('bundle');
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
		img.attr('opacity', 0.1);
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
		d3.json("/getApsByFloor?floor="+iF, function(err, _aps){
			console.log("get aps by floor:",iF);
			aps = _aps.map(function(ap){
				ap.apid = +ap.apid;
				ap.floor = +ap.floor;
				ap.pos_x = ap.x;
				ap.pos_y = ap.y;
				delete ap.x;
				delete ap.y;
				return ap;
			});
			console.log(aps)
			_drawAps(aps);
		});
		//_drawAps(aps);
		//
		utils.log(["draw path, path number:", pathByMac.length]);
		// var sPath = gPath.selectAll("g.path-g").data(pathByMac);
		// sPath.enter().append('g').attr("path-g");
		// sPath.each(function(path, index){
		// 	var data =  path.map(function(r,i){
		// 		if(i == 0) return null;
		// 		return [r, path[i-1]];
		// 	});
		// 	data.shift();
		// 	var sP = d3.select(this).selectAll('path').data(data);
		// 	sP.enter().append('path');
		// 	sP.attr('d', pathF).attr('marker-end', 'url(#triangle)')
		// 		.attr('stroke','url(#grad)');
		// 	sP.exit().remove();
		// });
		var selPath = gPath.selectAll("path").data(pathByMac);
		var selPathEnter = selPath.enter().append("path");
		selPath.attr("d", pathF).attr('marker-mid','url(#triangle)').attr("stroke","red");
		selPath.exit().remove();
		//
		pathByMac = pathByMac.filter(function(d){return d.length > 3});
		//pathByMac.map(function(ps){console.log(ps)});
		/*
		var res = pathByMac.map(function(points){
			var r = quad(sample(pathF(points)), 8);
			return r;
		});
		var ggPath = gPath.selectAll("g.pp").data(res);
		ggPath.enter().append("g").attr("class", 'pp');
		ggPath.selectAll("path").data(function(d){return d})
			.enter().append("path");
		ggPath.selectAll("path").style("fill",function(d){return color(d.t)})
			.style("stroke", function(d){return color(d.t)})
			.attr("d",function(d){
				return lineJoin(d[0],d[1],d[2],d[3],4)
			});
		*/
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

/*
 *
 */
function sample(d, precision) {
	var path = document.createElementNS(d3.ns.prefix.svg, "path");
	path.setAttribute("d", d);
	var n = path.getTotalLength(), t = [0], i = 0, dt = precision;
	while ((i += dt) < n) t.push(i);
	t.push(n);
	return t.map(function(t) {
		var p = path.getPointAtLength(t), a = [p.x, p.y];
		a.t = t / n;
		return a;
	});
}
// Compute quads of adjacent points [p0, p1, p2, p3].
function quad(points) {
	return d3.range(points.length - 1).map(function(i) {
		var a = [points[i - 1], points[i], points[i + 1], points[i + 2]];
		a.t = (points[i].t + points[i + 1].t) / 2;
		return a;
	});
}
// Compute stroke outline for segment p12.
function lineJoin(p0, p1, p2, p3, width) {
	if(!p1 || !p2) return "";
	var u12 = perp(p1, p2),
	r = width / 2,
	a = [p1[0] + u12[0] * r, p1[1] + u12[1] * r],
		b = [p2[0] + u12[0] * r, p2[1] + u12[1] * r],
		c = [p2[0] - u12[0] * r, p2[1] - u12[1] * r],
			d = [p1[0] - u12[0] * r, p1[1] - u12[1] * r];
	if (p0) { // clip ad and dc using average of u01 and u12
		var u01 = perp(p0, p1), e = [p1[0] + u01[0] + u12[0], p1[1] + u01[1] + u12[1]];
		a = lineIntersect(p1, e, a, b);
		d = lineIntersect(p1, e, d, c);
	}
	if (p3) { // clip ab and dc using average of u12 and u23
		var u23 = perp(p2, p3), e = [p2[0] + u23[0] + u12[0], p2[1] + u23[1] + u12[1]];
		b = lineIntersect(p2, e, a, b);
		c = lineIntersect(p2, e, d, c);
	}
	return "M" + a + "L" + b + " " + c + " " + d + "Z";
}
// Compute intersection of two infinite lines ab and cd.
function lineIntersect(a, b, c, d) {
	var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
	y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
	ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
	return [x1 + ua * x21, y1 + ua * y21];
}
// Compute unit vector perpendicular to p01.
function perp(p0, p1) {
	var u01x = p0[1] - p1[1], u01y = p1[0] - p0[0],
	u01d = Math.sqrt(u01x * u01x + u01y * u01y);
	return [u01x / u01d, u01y / u01d];
} 
