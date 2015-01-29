/*
 *
 */
WifiVis.FloorDetail = function(selector, _iF){
	function FloorDetail(){}
	//
	var div = d3.select(selector), iF = _iF;
	var imgOriSize = {}, imgSize = {w: 800, h:400};
			x = d3.scale.linear(), y = d3.scale.linear(),
			img = div.select("#floor-background"),imgJ = $("#floor-background"),
			IMG_DIR = "data/floors/";
	var aps;
	imgJ.hide().on("load", onImgLoad);
	changeFloor(iF);
	function _imgPath(iF){return IMG_DIR+iF+"F.jpg"};
	function onImgLoad(){
		imgOriSize.w = imgJ.width();
		imgOriSize.h = imgJ.height();
		x.domain([0, imgOriSize.w]).range([0, imgSize.w]);
		y.domain([0, imgOriSize.h]).range([0, imgSize.h]);
		setTimeout(function(){
			imgJ.width(x(imgOriSize.w));
			imgJ.height(y(imgOriSize.h));
			imgJ.show();
		}, 2000);
	}
	FloorDetail.changeFloor = changeFloor;
	function changeFloor(_iF){
		iF = _iF;
		img.attr("src", _imgPath(iF));
	}

	//
	return FloorDetail;
}
