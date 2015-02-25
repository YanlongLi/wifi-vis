
var db = new WFV_DB(new Date(2013,08,01), new Date(2013,08,02));

db.init(function(){
	console.log("end");
	var from = new Date(2013,08,01,09);
	var to = new Date(2013,08,01,20);
	db.records.forEach(function(r){
		console.log(r.date_time.to_time_str())	
	});
});
