sap.ui.define([
    "sap/ui/core/mvc/Controller"
 ], function (Controller) {
    "use strict";
    return Controller.extend("cvapp.controller.NotFound", {
       onInit: function () {
         var oRouter = this.getOwnerComponent().getRouter();
         oRouter.getRoute("notFound").attachPatternMatched(this._onObjectMatched, this);
       },            
       _onObjectMatched: function (oEvent) {
        //
     },
		onNavBack: function () {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RouteHome", {}, true);
		},	
    });
 });