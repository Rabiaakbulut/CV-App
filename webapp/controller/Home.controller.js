sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,JSONModel) {
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
            }
        });
    });
