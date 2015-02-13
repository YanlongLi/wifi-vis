
var db = new WFV_DB(new Date(2013,08,01), new Date(2013,08,02));

db.init(function(){
	console.log("end");
	var from = new Date(2013,08,01,09);
	var to = new Date(2013,08,01,20);
	var len = db.records_by_interval(from, to).length;
	console.log("len", len);
	var paths = db.graph_info(from, to);
	console.log(paths[0]);
});
