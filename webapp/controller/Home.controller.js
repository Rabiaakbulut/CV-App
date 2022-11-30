sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
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
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,JSONModel,Fragment, Core, HorizontalLayout, VerticalLayout, Dialog, Button, Label, mobileLibrary, MessageToast, Text, TextArea) {
        "use strict";

        return Controller.extend("cvapp.controller.Home", {
            onInit: function () {
                var oModel = new JSONModel();
                this.getView().setModel(oModel,"CvInfoModel");
            },
            onAfterRendering: function(){
                this.onGetData();
            },
            onGetData: function(){
                var that = this;
                this.getView().getModel().read("/CvInfoSet",{
                    filters:null,
                    async:true,
                    success: function(oData){
                        var aData = oData.results;
                        var oModel = new JSONModel(aData);
                        that.getView().setModel(oModel,"CvInfoModel");
                    },
                    error: function(){
    
                    }
                })
            },
            onPress: function(oEvent){
                //Cv.view.xml'e git. Parametre olarak personelin id'sini gönder
                var oItem = oEvent.getSource();
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("Cv", {
                    EmployeeId: window.encodeURIComponent(oItem.getBindingContext("CvInfoModel").getProperty("PERS_ID"))
                });
            },
            onApproveDeleteCV: function(oEvent){
                var that = this;
                var sEmployeeId = oEvent.getSource().getBindingContext("CvInfoModel").getProperty().PERS_ID;
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: "Dikkat",
                        content: new Text({ text: "Silme işlemini onaylıyor musunuz?" }),
                        beginButton: new Button({
                            text: "Onayla",
                            press: function () {
                                that.onDelete(sEmployeeId);
                                this.oApproveDialog.close();
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: "İptal",
                            press: function () {
                                this.oApproveDialog.close();
                            }.bind(this)
                        })
                    });
                }
                this.oApproveDialog.open();
            },
            onDelete: function(sEmployeeId){
            var that = this;
            var sParams = {
                PERS_ID: sEmployeeId
            };
            this.getView().getModel().callFunction("/DeleteCv",{
                method:"GET",
                urlParameters: sParams,
                async: true,
                success: function(oData){
                    that.onGetData();
                }.bind(this),
                error: function(){
                }
            });
            }
        });
    });
