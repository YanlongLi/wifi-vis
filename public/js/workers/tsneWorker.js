importScripts("../../jslib/tsne.js")

var opt = {epsilon: 2};
var tSNE = new tsnejs.tSNE(opt);
var _distanceMatrix;

var iterTimer;
var maxIter = 500;

onmessage = function(event) {
    var distanceMatrix = event.data.distance;
    console.log("cmd", event.data.cmd);
    clearInterval(iterTimer);
    var iter = maxIter;
    if (event.data.iter != null) {
        iter = event.data.iter;
    }    
    if (event.data.cmd == "init") {
        if (iterTimer != null)
            clearInterval(iterTimer);
        tSNE.setDataDist(distanceMatrix, true);
        start(distanceMatrix, iter);
    } else if (event.data.cmd == "update") {
        tSNE.setDataDist(distanceMatrix, false);
        start(distanceMatrix, iter);
    }
};

function start(distanceMatrix, iter) {
    console.log("tsne iter:" , iter);
    var count = 0;
    iterTimer = setInterval(function() {
        count++;
        if (count > iter) {
            clearInterval(iterTimer);
        }
        tSNE.step();
        if (count > iter * 300) {
            var state = 0;
            if (count > iter)
                state = 1;
            postMessage({
                state: state,
                positions: tSNE.getSolution()
            });
        }
    }, 10)
    // for (var i = 0; i < iter; i++) {
    //  if (workTimestamp != messageTimestamp) {
    //      console.log("break");
    //      break;
    //  }
    //  tSNE.step();
    //  postMessage(tSNE.getSolution());    
    // }
    // postMessage(tSNE.getSolution());
}