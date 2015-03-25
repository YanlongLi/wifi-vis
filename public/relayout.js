
var currentZIndex = 100;

$(document).ready(function() {
	//init UI
	$('.dragbox').each(function(){
			var _this = this;
			$(this).find(".header")
				.dblclick(function(){
					$(_this).find('.dragbox-content').toggle("normal");
					$(_this).toggleClass("dragbox-collapse");
				})
		});
	$( ".dragbox" ).draggable({ 
		handle: ".header",
		start: function() {
			$(this).css("z-index", currentZIndex++);
		}
	}).resizable({
		start: function() {
			$(this).css("z-index", currentZIndex++);
		}
	});
	// 

	$("#controller-button").click(function() {
		$(this).toggleClass("active");
		$("#controller-wrapper").toggle();
	})
})
