/* =============================================================================
*     FileName: relayout.js
*         Desc:  
*       Author: YanlongLi
*        Email: lansunlong@gmail.com
*     HomePage: 
*      Version: 0.0.1
*   CreateTime: 2015-03-25 22:34:24
*   LastChange: 2015-03-30 00:54:55
*      History:
============================================================================= */

$(document).ready(function(){
	["floor-bar-wrapper", "floor-detail-wrapper", "ap-view-wrapper", "device-view-wrapper"].forEach(function(id){
		$("#control-" + id).prop("checked", true);
	});
	//
	$(".view-control-wrapper").buttonset();
	$(".view-control-panel .control-button").on("change", function(e){
		var value = $(this).prop("checked");
		var names = $(this).attr("id").split("-");
		names.shift();
		var id = names.join("-");
		var p = $("#" + id).closest(".dragbox");
		if(value){
			p.css("z-index", ++currentZIndex);
			$("#"+id).closest(".dragbox").css({
				//"left": "", "top": "",
				"visibility":"visible"
			});
		}else{
			$("#"+id).closest(".dragbox").css("visibility", "hidden");
		}
	});
});
