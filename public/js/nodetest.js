var Timeline = require('./Timeline');
var fs = require('fs');
var d3 = require('d3');
var csv = require('fast-csv');

var timelineData = [];
var format = d3.time.format("%Y-%m-%d %H:%M:%S");

var dataStream = fs.createReadStream("../data/September/2013-09-01.csv");
var csvStream = csv({"headers":true}).on("data",function(data){
	data.dateTime = format.parse(data.date_time);
	timelineData.push(data);
}).on("end", function(){
	console.log(timelineData.slice(0,4));
	console.log("done");
	start();
});

dataStream.pipe(csvStream);

function start(){
	var timeline = Timeline(timelineData, {
		size:{width: 700, height: 400}
	});
}

