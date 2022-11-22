sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller,JSONModel) {
	"use strict";

	var deneme;

	return Controller.extend("cvapp.controller.Cv", {
		onInit: function () {

			// var oModel = new JSONModel();
            // this.getView().setModel(oModel,"EmployeeModel");

			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("Cv").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function (oEvent) {
			this.getView().bindElement({
				path: "/" + window.decodeURIComponent(oEvent.getParameter("arguments").EmployeeId),
				model: "CvInfoModel" //buraya tekrar bak
			});
		}
	});
});