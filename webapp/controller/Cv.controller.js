sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/core/Fragment"
], function (Controller,JSONModel,History,Fragment) {
	"use strict";

	var employeeId;

	return Controller.extend("cvapp.controller.Cv", {
		onInit: function () {
			var oModel = new JSONModel();
            this.getView().setModel(oModel,"CvInfoModel");

			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("Cv").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function (oEvent) {
			employeeId = oEvent.getParameter("arguments").EmployeeId;
			this.getView().bindElement({
				path: "/" + window.decodeURIComponent(oEvent.getParameter("arguments").EmployeeId),
				model: "CvInfoModel"
			});
		},
		onAfterRendering: function(){
			this.onGetData();
		},
		onGetData: function(){
			var that = this;
			this.getView().getModel().read("/CvInfoSet('" + employeeId + "')",{
                async:true,
                urlParameters:{
                    "$expand": "CvInfoToProjects,CvInfoToEducations,CvInfoToCertificates"
                },
                success:function(oData){
                    var oModel = new JSONModel(oData);
                    that.getView().setModel(oModel,"CvInfoModel")
                }.bind(this),
                error: function(){}
            })
		},
		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Home", {}, true);
			}
		},
		onAddEducation : function () {
			var iEmployeeId = this.getView().getModel("CvInfoModel").getData().PERS_ID;

			var sEducation ={
				PERS_ID : iEmployeeId
			};
			var oModel = new JSONModel(sEducation);
            this.getView().setModel(oModel,"EducationModel");
			this._getEducationDialog().open();
		},
		onCloseDialog : function () {
			this._getEducationDialog().close();
		},
        _getEducationDialog: function(){
            this.oEducationDialog = sap.ui.getCore().byId("educationDialog");			
            if (!this.oEducationDialog) {				
                this.oEducationDialog = sap.ui.xmlfragment("cvapp.view.Education", this); 
                this.getView().addDependent(this.oEducationDialog);
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oEducationDialog);	
            }			
            return this.oEducationDialog;	
        },
        onSaveEducation: function(){
			var that = this;
			var sEducationDetail = this.getView().getModel("EducationModel").getData();
			this.getView().getModel().create("/EducationSet",sEducationDetail,{
                success: function(oData){
					that.onGetData();
                    that._getEducationDialog().close();
                },
                error: function(){
                }
            })
        }
	});
});