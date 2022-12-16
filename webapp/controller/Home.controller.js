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
	"sap/m/TextArea",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,JSONModel,Fragment, Core, HorizontalLayout, VerticalLayout, Dialog, Button, Label, mobileLibrary, MessageToast, Text, TextArea,Filter,FilterOperator) {
        "use strict";

        return Controller.extend("cvapp.controller.Home", {
            onInit: function () {
                var oModel = new JSONModel();
                this.getView().setModel(oModel,"CvInfoModel");

                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteHome").attachPatternMatched(this._onObjectMatched, this);
            },
            _onObjectMatched: function () {
                this.onGetData();
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
                },this);
            },
            onDownloadCV:function(oEvent){
                var sEmployeeId = oEvent.getSource().getBindingContext("CvInfoModel").getProperty().PERS_ID;
                var oDialog = new sap.m.Dialog({
                    title: "PDF", 
                    content: [
                      new sap.m.PDFViewer({
                        source:"/sap/opu/odata/sap/ZCV_APP_SRV/PdfSet(PdfType='1',DocId='"+sEmployeeId+"')/$value" ,
                        displayType:"Link",
                        title:'CV 1'
                      }),
                      new sap.m.PDFViewer({
                        source:"/sap/opu/odata/sap/ZCV_APP_SRV/PdfSet(PdfType='2',DocId='"+sEmployeeId+"')/$value" ,
                        displayType:"Link",
                        title:'CV 2'
                      })
                    ],
                    buttons: [
                      new sap.m.Button({
                        text: "Kapat",
                        press: function() {
                          oDialog.close();
                        }
                      })
                    ]
                  });
                oDialog.open();
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
                this.getView().getModel().callFunction("/DeleteCV",{
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
            onSearch: function (oEvent) {
                // add filter for search
                var aFilters = [];
                var sQuery = oEvent.getSource().getValue();
                if (sQuery && sQuery.length > 0) {
                    var filter = new Filter("AD", FilterOperator.Contains, sQuery);
                    aFilters.push(filter);
                }
    
                // update list binding
                var oList = this.byId("table");
                var oBinding = oList.getBinding("items");
                oBinding.filter(aFilters, "Application");
            },
            onSelectionChange: function (oEvent) {
                var oList = oEvent.getSource();
                var oLabel = this.byId("idFilterLabel");
                var oInfoToolbar = this.byId("idInfoToolbar");
    
                var aContexts = oList.getSelectedContexts(true);
    
                // update UI
                var bSelected = (aContexts && aContexts.length > 0);
                var sText = (bSelected) ? aContexts.length + " selected" : null;
                oInfoToolbar.setVisible(bSelected);
                oLabel.setText(sText);
            }
        });
    });
