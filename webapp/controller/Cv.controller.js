sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/core/Fragment",
	"sap/ui/core/Core",
	"sap/ui/layout/HorizontalLayout",
	"sap/ui/layout/VerticalLayout",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label",
	"sap/m/library",
	"sap/m/MessageToast",
	"sap/m/Text",
	"sap/m/TextArea"
], function (Controller,JSONModel,History,Fragment, Core, HorizontalLayout, VerticalLayout, Dialog, Button, Label, mobileLibrary, MessageToast, Text, TextArea) {
	"use strict";
	return Controller.extend("cvapp.controller.Cv", {
		onInit: function () {
			var oModel = new JSONModel();
            this.getView().setModel(oModel,"CvInfoModel");

			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("Cv").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function (oEvent) {
			this.employeeId = oEvent.getParameter("arguments").EmployeeId;
			this.getView().bindElement({
				path: "/" + window.decodeURIComponent(oEvent.getParameter("arguments").EmployeeId),
				model: "CvInfoModel"
			});
			this.onGetData();
		},
		onAfterRendering: function(){
			this.onGetData();
		},
		onGetData: function(){
			var that = this;
			this.getView().getModel().read("/CvInfoSet('" + this.employeeId + "')",{
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
		onAdd: function (sData){ //buton parametresini tutar (Education, Project, Certificate gibi değerler alır)
			var sModel = sData.concat("Model"); 
			var iEmployeeId = this.getView().getModel("CvInfoModel").getData().PERS_ID;
			var sNewData ={
				PERS_ID : iEmployeeId
			};
			var oModel = new JSONModel(sNewData);
            this.getView().setModel(oModel,sModel);
			this._getFragmentDialog(sData).open();
			this.bEdit = false;
		},
		onEdit: function (oEvent, sRecordModel){
			var sModel = sRecordModel.concat("Model"); //EmployeeModel...
			var sData = oEvent.getSource().getBindingContext("CvInfoModel").getProperty();
			this.sbeforeEdit = JSON.stringify(sData); //save metodunda kullandım

            var oModel = new JSONModel(sData);
            this.getView().setModel(oModel,sModel);
            this._getFragmentDialog(sRecordModel).open();
			this.bEdit = true;
		},
		onDelete(sData, sModel){ //FUNCTION IMPORT - DELETE
            var that = this;
			
			if(sData=="Education"){
				var sParams = {
					PERS_ID: sModel.PERS_ID,
					EGITIM_TIPI: sModel.EGITIM_TIPI,
					OKUL: sModel.OKUL,
					BOLUM: sModel.BOLUM,
				};
			}else if(sData=="Project"){
				var sParams = {
					PERS_ID: sModel.PERS_ID,
					PROJE_ID: sModel.PROJE_ID,
				};
			}else if(sData=="Certificate"){
				var sParams = {
					PERS_ID: sModel.PERS_ID,
					SERTIFIKA_ID: sModel.SERTIFIKA_ID,
				};
			}
            this.getView().getModel().callFunction("/Delete"+sData,{
                method:"GET",
                urlParameters: sParams,
                async: true,
                success: function(oData){
                    that.onGetData();
                }.bind(this),
                error: function(){
                }
            });
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

			//FUNCTION IMPORT - UPDATE
			//sap'de önce silme sonra ekleme yaptım çünkü key alanlar da değişebilir
			if(this.bEdit){
				var sParams = {
					NEWDATA: JSON.stringify(sModelData),
					OLDDATA: this.sbeforeEdit,
					ENTITYNAME: sDialogName
				};
				this.getView().getModel().callFunction("/Update",{
					method: "GET",
					urlParameters: sParams,
					async: true,
					success: function(oData){
						that.onGetData();
						that._getFragmentDialog(sDialogName).close();
						that._getFragmentDialog(sDialogName).destroy(true); 
					}.bind(this),
					error:function(){}
				});
			}
			else{
			//CREATE ENTITY
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
        },
		addImage: function(){
			var sId = this.getView().getModel("CvInfoModel").getData().PERS_ID;

            var oModel= this.getView().getModel();
            var oFileUploader = this.getView().byId("fileUploader");
            if(oFileUploader.getValue() === ""){
                MessageToast.show("please choose any file");
            }
            //güvenlik için
            oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                name: "x-csrf-token",
                value: oModel.getSecurityToken()
            }));
            //üst üste tetiklenme için
            oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                name: "X-Requested-With",
                value: "X"
            }));
            //kullanacağımız verileri göndermek için
            oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                name: "content-disposition",
                value: encodeURIComponent(oFileUploader.getValue() ) + "#" + sId
            }));

            oFileUploader.upload();
            return;
		},
		handleUploadComplete: function (oEvent) {
			//RESİM GÜNCELLENMİYOR !!!!
			// var oImage = this.getView().byId("employeeImg");
			// oImage.setSrc(oImage.getSrc());
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
		onCloseDialog : function (oEvent) { //dialog id'ye erişip diyalogları dinamik şekilde kapatma
			var sDialogName = oEvent.oSource.oParent.sId; //butonun bulunduğu fragment diyaloğun id'si (EducationDialog)
			sDialogName =sDialogName.split(/(?=[A-Z])/)[0]; //büyük harfe göre parçala, ilk texti al (Education)
			this._getFragmentDialog(sDialogName).close();

			//fragmenti tamamen ortadan kaldır
			//bir fragment çağırma metodunu birden fazla fragmentte kullandığımız için
			//addDependent fonskiyonu hata vermesin diye
			this._getFragmentDialog(sDialogName).destroy(true); 
			this.bEdit = false;
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
		onApproveDeletePress: function (oEvent,sData) {
			var that = this;
            var sModel = oEvent.getSource().getBindingContext("CvInfoModel").getProperty();
			if (!this.oApproveDialog) {
				this.oApproveDialog = new Dialog({
					type: mobileLibrary.DialogType.Message,
					title: "Dikkat",
					content: new Text({ text: "Silme işlemini onaylıyor musunuz?" }),
					beginButton: new Button({
						text: "Onayla",
						press: function () {
							that.onDelete(sData, sModel);
							this.oApproveDialog.close();
							this.oApproveDialog.destroy(true); 
							this.oApproveDialog = undefined;
						}.bind(this)
					}),
					endButton: new Button({
						text: "İptal",
						press: function () {
							this.oApproveDialog.close();
							this.oApproveDialog.destroy(true); 
							this.oApproveDialog = undefined;
						}.bind(this)
					})
				});
			}
			this.oApproveDialog.open();
		}
	});
});