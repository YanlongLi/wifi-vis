
// 楼层颜色： "#9CBFE7"

var ColorScheme = {};

ColorScheme.floor = function(floor) {
    var floorColor = [
        "#000000",
        "#1f77b4",
        "#ff7f0e",
        "#2ca02c",
        "#d62728",
        "#9467bd",
        "#8c564b",
        "#e377c2",
        "#bcbd22",
        "#17becf",
        "#aec7e8",
        "#ffbb78",
        "#98df8a",
        "#ff9896",
        "#c5b0d5",
        "#c49c94",
        "#f7b6d2",
        "#dbdb8d",
        "#9edae5"
    ]
    return floorColor[floor];
}