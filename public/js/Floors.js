WifiVis.FloorsNav = function(gName){
	function FloorsNav(){}
	var nFloors = WifiVis.NUM_FLOOR;
	var Floor = WifiVis.Floor;
	//
	//
	var size = utils.getSize(gName);
	var floorDivs = d3.select(gName).selectAll("div.floor")
		.data(d3.range(0, nFloors));
	floorDivs.enter().append("div").attr("class","floor");
	var floors = [];
	floorDivs.each(function(i){
		var floor = Floor(d3.select(this), i+1, size.width(), size.height()/nFloors);
		floors.push(floors);
	});
	//
	return FloorsNav;
};

WifiVis.Floor = function(div, index, w, h){
	function Floor(){}
	var mgBot= 0;
	div.attr("id", "floor-"+index).style({
		"width": w,
		"height": h - mgBot,
		"margin": "0 0 "+mgBot+" 0"
	});
	div.on({
		"mouseover": function(){
			console.log("floor " + index + " mouseon");
		},
		"click": function(){
			console.log("floor " + index + " clicked");
		}
	});
	return Floor;
};


