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
    if (event.data.cmd == "init") {
        tSNE.setDataDist(distanceMatrix, true);
        start(distanceMatrix, maxIter);
    } else if (event.data.cmd == "update") {
        tSNE.setDataDist(distanceMatrix, false);
        start(distanceMatrix, maxIter);
    }
};

function start(distanceMatrix, iter) {
    var count = 0;
    iterTimer = setInterval(function() {
        count++;
        if (count > iter) {
            clearInterval(iterTimer);
        }
        tSNE.step();
        if (count > 300) {
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