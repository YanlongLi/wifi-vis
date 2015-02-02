/*
 *
 */
floor_image_size = WifiVis.FLOOR_IMG_SIZE;

WifiVis.FloorDetail = function(selector, _iF){
	function FloorDetail(){}
	//
	var iF;
	var o = utils.initSVG(selector, [40]), g = o.g;
	var imgOriSize = {}, imgSize = {},
			x = d3.scale.linear(), y = d3.scale.linear(),
			img = g.append("image").attr("id","floor-background"),
			IMG_DIR = "data/floors/";
	var aps;
	var gAps = g.append("g").attr("id","aps-wrapper"),
			gPath = g.append("g").attr("id", "path-wrapper"),
			pathF = d3.svg.line()
				.x(function(d){return x(d.ap.x)})
				.y(function(d){return y(d.ap.y)});
	gAps.append("rect").attr("class","placeholder");
	gPath.append("rect").attr("class","placeholder");
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
		img.attr('opacity', 0.4);
		gAps.select("rect.placeholder").attr("width",imgSize.w).attr("height", imgSize.h);
		gPath.select("rect.placeholder").attr("width",imgSize.w).attr("height", imgSize.h);
	}
	function changeFloor(_iF){
		iF = _iF;
		//
		utils.log(["change to floor:", iF]);
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
		//
		_resizeImg();
		moveImage(imgOffset);

		aps = dataCenter.find_aps({floors:[iF]});
		_drawAps(aps);
		return FloorDetail;
	}
	function _drawAps(aps){
		utils.log(["draw_aps:",aps.length]);
		apSel = gAps.selectAll("circle").data(aps);
		apSelEnter = apSel.enter().append("circle");
		apSel.attr("cx", function(ap){return x(ap.x)})
			.attr("cy", function(ap){return y(ap.y)})
			.attr("r",4);
		apSel.attr("title",function(ap){return ap.name});
		apSel.exit().remove();
	}
	function drawPath(pathByMac){
		utils.log(["draw path, path number:", pathByMac.length]);
		var selPath = gPath.selectAll("path").data(pathByMac);
		var selPathEnter = selPath.enter().append("path");
		selPath.attr("d", pathF);
		selPath.exit().remove();
	}
	function moveImage(offset){
		imgOffset = offset;
		img.transition().attr("x", imgOffset[0]).attr("y", imgOffset[1]);
		d3.selectAll("#path-wrapper, #aps-wrapper").transition()
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
