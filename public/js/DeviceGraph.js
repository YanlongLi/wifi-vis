
WifiVis.DeviceGraph = function(){
    function DeviceGraph(){}
    var dataHelper = WifiVis.DataHelper;
    var color = ColorScheme.floor;

    var DIV_ID = "device-graph-wrapper"
    var gOffset = [10, 10];
    var o = utils.initSVG("#"+DIV_ID,[10]);
    var g = o.g, w = o.w, h = o.h, r = 6;

    var devices, links;
    var gLink = g.append("g").attr("class", "links"),
        gNode = g.append("g").attr("class", "nodes");
    var edgeFilterWeight = 30;
    var isShowEdge = false;     

    var timeRange = [timeFrom, timeTo];
    var disMatrix = [], dotPositions;
    var tsneWorker;
    var graphinfo;
    var spinner;

    $(window).resize(function(e){
        o = utils.resizeSVG(o);
        render();
    });

    DeviceGraph.init = function(){
        var _this = this;
        ObserverManager.addListener(this);
        spinner = utils.createSpinner(5, 5);

        var worker = new Worker("js/workers/tsneWorker.js");
        tsneWorker = worker;
        // worker.postMessage({"cmd":"init", "distance":disMatrix});
        worker.onmessage = function(event) {
            console.log("device graph on message");
            dotPositions = event.data.positions;
            if (event.data.state == 0)
                isShowEdge = false;
            else 
                isShowEdge = true;
            render();
        }
        var drag = initDragPolygon();
        o.svg.call(drag)
            .on("click", function(){
                console.log("svg click");
                EventManager.apDeselect(null, this);
            });

    }
    DeviceGraph.draw = function(){
        this.update(timeRange);
    }
    DeviceGraph.set_time_range = function(range){
        timeRange[0] = range[0];
        timeRange[1] = range[1];
    }
    
    DeviceGraph.update = function(range){
        // spinner.spin($("#" + DIV_ID).get(0));
        // var from = new Date(range[0]), to = new Date(range[1]);
        // var records = db.records_by_interval(from, to)
        // console.log("records", records);
        // db.graph_info(from, to, function(_graphinfo){
        //     graphinfo = _graphinfo;
        //     var count = 0;
        //     graphinfo.forEach(function(link){
        //         count++;
        //         link.source = apMap.get(link.source);
        //         link.target = apMap.get(link.target);
        //         disMatrix[link.source._id][link.target._id] 
        //             = disMatrix[link.target._id][link.source._id] 
        //             = getDistance(link.weight);
        //     });
        //     console.log("link count", count);
        //     tsneWorker.postMessage({"cmd":"init", "distance":disMatrix});
        //     links = graphinfo.filter(function(l){
        //         return l.weight > edgeFilterWeight;
        //     });
        // });
    }

    DeviceGraph.OMListen = function(message, data){
        // if(message == WFV.Message.FloorChange){
        //     var currentFloor = data.floor;
        //     unhighlight();
        //     svg.selectAll(".dot").filter(function(d) {
        //         if (svg.select(this).attr("floor") == currentFloor)
        //             return true;
        //         return false;
        //     }).classed("highlight", true);
        // }
        // if (message == WFV.Message.FloorHover) {
        //     var floorList = data.floor;
        //     console.log(floorList);
        //     svg.selectAll(".dot.temp-highlight").classed("temp-highlight", false);
        //     svg.selectAll(".dot").filter(function(d) {
        //         if (floorList.indexOf(+svg.select(this).attr("floor")) >= 0)
        //             return true;
        //         return false;
        //     }).classed("temp-highlight", true);
        // }
        // if (message == WFV.Message.ApHover) {
        //     if (data.isAdd == false) {
        //         svg.selectAll(".dot").classed("temp-highlight", false);
        //         return;
        //     }
        //     var apids = data.apid;
        //     for (var i = 0; i < apids.length; i++) {
        //         var id = apids[i];
        //         svg.selectAll(".dot[apid='" + id + "']").classed("temp-highlight", true);
        //     }
        // }               
        // if (message == WFV.Message.ApSelect) {
        //     svg.selectAll(".dot").classed("highlight", false);
        //     var apids = data.apid;
        //     console.log("apselect", apids);
        //     for (var i = 0; i < apids.length; i++) {
        //         var id = apids[i];
        //         console.log(".dot[apid='" + id + "']")
        //         svg.selectAll(".dot[apid='" + id + "']").classed("highlight", true);
        //     }
        // }       
        if (message == WFV.Message.DeviceSelect) {
            deviceList = data.device;
            devices = [];
            for (var i = 0; i < deviceList.length; i++)
                devices.push({id:deviceList[i]});
            processData(devices);
            gNode.html("");
            gLink.html("");
            tsneWorker.postMessage({"cmd":"init", "distance":disMatrix}); 
        } 
    }   

    function createElements() {
        gNode.selectAll(".dot")
            .data(dotPositions)
            .enter()
            .append("circle")
            .attr("class", "dot")  
            .attr("r", 5)
            .attr("device-id", function(d, index) {
                return devices[index]
            })
            .attr("fill", function(d, index) {
                return "#999";
            })
            // .on('mouseover', function(d, index) {
            //     svg.select(this).classed("temp-highlight", true);
            //     var ap = aps[index];
            //     svg.selectAll(".link[source-id='" + ap._id + "']").classed("temp-highlight", true);
            //     svg.selectAll(".link[target-id='" + ap._id + "']").classed("temp-highlight", true);
            // })
            // .on('mouseout', function(d, index) {
            //     svg.select(this).classed("temp-highlight", false);
            //     svg.selectAll(".link").classed("temp-highlight", false);
            // })
            // .on("click", function(d,index) {
            //     console.log("click")
            //     d3.event.stopPropagation()
            //     svg.select(this).classed("highlight", true);
            //     var ap = aps[index];
            //     var list = [ap.apid];
            //     EventManager.apSelect(list);
            // })

        // gLink.selectAll(".link")
        //     .data(links)
        //     .enter()
        //     .append("line")
        //     .attr("class", "link")
        //     .attr("source-id", function(d) {
        //         return d.source._id; 
        //     })
        //     .attr("target-id", function(d) {
        //         return d.target._id;
        //     })
        //     .style("stroke-width", function(d) {
        //         var scale = d3.scale.log().base(6);
        //         return scale(d.weight+1) * 1.5; 
        //     })
        //     .style("display", "none");  
    }

    function render() {
        spinner.stop(); 

        var _this = this;
        var minX = _.min(dotPositions, function(d) {return d[0]})[0];
        var maxX = _.max(dotPositions, function(d) {return d[0]})[0];
        var minY = _.min(dotPositions, function(d) {return d[1]})[1];
        var maxY = _.max(dotPositions, function(d) {return d[1]})[1];
        var width = o.w;
            height = o.h;
        // width = height = Math.min(width, height) - 20;
        width = width - 20; height = height - 20;
        if (gNode.selectAll(".dot").size() == 0) {
            createElements();
        }

        console.log("render")
        gNode.selectAll(".dot")
            .data(dotPositions)
            .attr("cx", function(d, index) {
                var x = mapping(d[0], minX, maxX, 0, width);
                return x;
            })
            .attr("cy", function(d, index) {
                y = mapping(d[1], minY, maxY, 0, height);
                return y;
            })
        
        // if (isShowEdge) {
        //     gLink.selectAll(".link")
        //         .data(links)
        //         .attr("x1", function(d) { return d.source.x; })
        //         .attr("y1", function(d) { return d.source.y; })
        //         .attr("x2", function(d) { return d.target.x; })
        //         .attr("y2", function(d) { return d.target.y; })            
        //         .style("display", "block");
        // } else {
        //     gLink.selectAll(".link").style("display", "none");
        // }

     
    }

    function initDragPolygon(){
        //reference from http://bl.ocks.org/bycoffe/5871227
        var line = d3.svg.line(),
        drag = d3.behavior.drag()
            .on("dragstart", function() {
                // Empty the coords array.
                coords = [];
                svg = svg.select(this);
                // If a selection line already exists,
                // remove it.
                svg.select(".polygon-selection").remove();
                // Add a new selection line.
                svg.append("path").attr({"class": "polygon-selection"});
            })
            .on("drag", function() {
                // Store the mouse's current position
                coords.push(d3.mouse(this));
                svg = svg.select(this);
                // Change the path of the selection line
                // to represent the area where the mouse
                // has been dragged.
                svg.select(".polygon-selection").attr({
                    d: line(coords)
                });

                // Figure out which dots are inside the
                // drawn path and highlight them.

                //由于svgGroup做了居中处理，与svg的坐标系不一致，所以要纠正偏移
                var offsetX = Number(gOffset[0]),
                    offsetY = Number(gOffset[1]);
                console.log("offset:", offsetX, offsetY);
                // var offsetX = 0, offsetY = 0;
                var selected = [];
                svg.selectAll(".dot").each(function(d, i) {
                    point = [ Number(svg.select(this).attr("cx")) +  offsetX, 
                            Number(svg.select(this).attr("cy")) +  offsetY];
                    if (utils.pointInPolygon(point, coords)) {
                        selected.push(d);
                    }
                });
                highlight(selected);
            })
            .on("dragend", function() {
                console.log("dragend")
                svg = svg.select(this);
                // If the user clicks without having
                // drawn a path, remove any paths
                // that were drawn previously.
                if (coords.length === 0) {
                    svg.select(".polygon-selection").remove();
                    // unhighlight();
                    // postSelectMessage([]);
                    return;
                }             
                // Draw a path between the first point
                // and the last point, to close the path.
                svg.append("path").attr({
                    "class": "terminator",
                    d: line([coords[0], coords[coords.length-1]])
                });
                svg.select(".polygon-selection").remove();

                //由于svgGroup做了居中处理，与svg的坐标系不一致，所以要纠正偏移
                var offsetX = Number(gOffset[0]), offsetY = Number(gOffset[1]);
                var selectedAp = [];
                svg.selectAll(".dot").each(function(d, i) {
                    point = [ Number(svg.select(this).attr("cx")) +  offsetX, 
                            Number(svg.select(this).attr("cy")) +  offsetY];
                    if (utils.pointInPolygon(point, coords)) {
                        selectedAp.push(aps[i]);
                    }
                });

                postSelectMessage(selectedAp);
            });

        function postSelectMessage(ApList) {
            var list = _.pluck(ApList, "apid");
            EventManager.apDeselect(null, this);
            EventManager.apSelect(list, this);
        }

        return drag;
    }

    function unhighlight() {
        svg.selectAll(".dot").classed("highlight", false);
    }

    function highlight(dotsData) {
        unhighlight();

        svg.selectAll(".dot").filter(function(d, i) {
            var index = dotsData.indexOf(d);
            return index > -1;
        })
        .classed("highlight", true);
    }

    function processData(devices) {
        disMatrix = [];
        var defaultValue = getDistance(0);
        console.log("devices.length", devices.length);
        for (var i = 0; i < devices.length; i++) {
            disMatrix[i] = [];
            for (var j = 0; j < devices.length; j++) {
                if (i == j)
                    disMatrix[i][j] = 0;
                else
                    disMatrix[i][j] = defaultValue;
            }
        }
    }

    function getDistance(weight) {
        return 1;
        var distance = 100 - (weight+1) ;
        if (distance <= 1)
            return 1;
        return distance;
    }


    function mapping(value, vMin, vMax, tMin, tMax) {
        value = value < vMin ? vMin : value;
        value = value > vMax ? vMax : value;
        return (value - vMin) / (vMax - vMin) * (tMax - tMin) + tMin;
    }   

    return DeviceGraph;
};
