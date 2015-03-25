

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
			$("#"+id).closest(".dragbox").css({
				//"left": "", "top": "",
				"visibility":"visible"
			});
		}else{
			$("#"+id).closest(".dragbox").css("visibility", "hidden");
		}
	});
});
