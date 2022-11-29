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
			this.onAdd("Education");
		},
		onAddProject: function(){
			this.onAdd("Project");
		},
		onAddCertificate: function(){
			this.onAdd("Certificate");
		},
		onAdd: function (sRecordModel){
			var sModel = sRecordModel.concat("Model");
			var iEmployeeId = this.getView().getModel("CvInfoModel").getData().PERS_ID;

			var sData ={
				PERS_ID : iEmployeeId
			};
			var oModel = new JSONModel(sData);
            this.getView().setModel(oModel,sModel);
			this._getFragmentDialog(sRecordModel).open();
		},
		onCloseDialog : function (oEvent) { //dialog id'ye erişip diyalogları dinamik şekilde kapatma
			var sDialogName = oEvent.oSource.oParent.sId; //butonun bulunduğu fragment diyaloğun id'si (EducationDialog)
			sDialogName =sDialogName.split(/(?=[A-Z])/)[0]; //büyük harfe göre parçala, ilk texti al (Education)
			this._getFragmentDialog(sDialogName).close();

			//fragmenti tamamen ortadan kaldır
			//bir fragment çağırma metodunu birden fazla fragmentte kullandığımız için
			//addDependent fonskiyonu hata vermesin diye
			this._getFragmentDialog(sDialogName).destroy(true); 
		},
        _getFragmentDialog: function(sRecordModel){
			//dynamic değişkenler
			var sDialogName = sRecordModel.concat("Dialog");        //EducationDialog...
			var sFragmentName = "cvapp.view.".concat(sRecordModel)  //cvapp.view.Education...

            this.oFragmentDialog = sap.ui.getCore().byId(sDialogName);			
            if (!this.oFragmentDialog) {				
                this.oFragmentDialog = sap.ui.xmlfragment(sFragmentName, this); 
                this.getView().addDependent(this.oFragmentDialog);
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oFragmentDialog);	
            }			
            return this.oFragmentDialog;	
        },
        onSaveData: function(oEvent){
			//Fragmentte kullanılan model adı (EducationModel ...)
			var sDialogName = oEvent.oSource.oParent.sId; //butonun bulunduğu fragment diyaloğun id'si (EducationDialog)
			sDialogName =sDialogName.split(/(?=[A-Z])/)[0]; //büyük harfe göre parçala, ilk texti al (Education)
			var sModelName = sDialogName.concat("Model");

			//SAP'de kullanılan entity set adı (/EducationSet ...)
			var sEntitySetName = "/";
			sEntitySetName = sEntitySetName.concat(sDialogName);
			sEntitySetName = sEntitySetName.concat("Set");

			var sModelData = this.getView().getModel(sModelName).getData();
			var that = this;
			this.getView().getModel().create(sEntitySetName,sModelData,{
                success: function(oData){
					that.onGetData();
                    that._getFragmentDialog(sDialogName).close();
					that._getFragmentDialog(sDialogName).destroy(true); 
                },
                error: function(){
                }
            })
        }
	});
});