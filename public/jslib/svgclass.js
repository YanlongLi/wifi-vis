/*
 * ref to:
 * http://toddmotto.com/hacking-svg-traversing-with-ease-addclass-removeclass-toggleclass-functions/ 
 */
SVGElement.prototype.hasClass = function (className) {
	return new RegExp('(\\s|^)' + className + '(\\s|$)').test(this.getAttribute('class'));
};

SVGElement.prototype.addClass = function (className) {
	if (!this.hasClass(className)) {
		var oClass = this.getAttribute('class');
		if(oClass && oClass.trim().length > 0){
			oClass = oClass.trim();
			this.setAttribute('class',  oClass + ' ' + className);
		}else{
			this.setAttribute("class", className);
		}
	}
};

SVGElement.prototype.removeClass = function (className) {
	var removedClass = this.getAttribute('class').replace(new RegExp('(\\s|^)' + className + '(\\s|$)', 'g'), '$2');
	if (this.hasClass(className)) {
		removedClass = removedClass.trim();
		if(removedClass.length > 0){
			this.setAttribute('class', removedClass);
		}else{
			this.removeAttribute("class");
		}
	}
};

SVGElement.prototype.toggleClass = function (className) {
	if (this.hasClass(className)) {
		this.removeClass(className);
	} else {
		this.addClass(className);
	}
};

(function($){

	/* addClass shim
	 ****************************************************/
	var addClass = $.fn.addClass;
	$.fn.addClass = function(value) {
		var orig = addClass.apply(this, arguments);

		var elem,
			i = 0,
			len = this.length;
			
		for (; i < len; i++ ) {
			elem = this[ i ];
			if ( elem instanceof SVGElement ) {
				var classes = $(elem).attr("class");
				if(!classes){
					$(elem).attr("class", value);
				}else{
					elem.addClass(value);
				}
			}
		}
		return orig;
	};

	/* removeClass shim
	 ****************************************************/
	var removeClass = $.fn.removeClass;
	$.fn.removeClass = function(value) {
		var orig = removeClass.apply(this, arguments);

		var elem,
		i = 0,
			len = this.length;

		for (; i < len; i++ ) {
			elem = this[ i ];
			if ( elem instanceof SVGElement ) {
				var classes = $(elem).attr("class");
				if(classes){
					elem.removeClass(value);
				}
			}
		}
		return orig;
	};

	/* hasClass shim
	 ****************************************************/
	var hasClass = $.fn.hasClass;
	$.fn.hasClass = function(value) {
		var orig = hasClass.apply(this, arguments);

		var elem,
		i = 0,
			len = this.length;

		for (; i < len; i++ ) {
			elem = this[ i ];
			if ( elem instanceof SVGElement ) {
				return elem.hasClass(value);
			}
		}
		return orig;
	};
})(jQuery);
