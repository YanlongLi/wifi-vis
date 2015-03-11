WifiVis.ControllerView = function(){
  function CV(){}

  var dataHelper = WifiVis.DataHelper;
  var DIV_ID = "controller-wrapper";
  var rootEle; 

  CV.init = function(){
    var _this = this;
    
    ObserverManager.addListener(this);
    $(document).ready(function(){
      rootEle = $("#" + DIV_ID);
      _this.initInteraction();
    })
  }

  CV.OMListen = function(message, data){
    console.log(message, data);
    if (message == WFV.Message.ApSelect) {
      var apids = data.apid;
      console.log(apids.length)
      rootEle.find("#ap-selected-count").html(apids.length)
    }   
    if (message == WFV.Message.DeviceSelect) {
      var devices = data.device;
      console.log(devices.length)
      rootEle.find("#device-selected-count").html(devices.length)
    }
  } 

  CV.initInteraction = function(){
    rootEle.on("click", "#ap-clear-button", function(e){
      EventManager.apDeselect(null, this);
    })
    rootEle.on("click", "#device-clear-button", function(e){
      EventManager.deviceDeselect(null, this);
    })    
  }

 
  return CV;
};
