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
	"sap/m/TextArea",
	"../model/formatter"
], function (Controller,JSONModel,History,Fragment, Core, HorizontalLayout, VerticalLayout, Dialog, Button, Label, mobileLibrary, MessageToast, Text, TextArea,formatter) {
	"use strict";
	return Controller.extend("cvapp.controller.Cv", {
		formatter: formatter,
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
                    "$expand": "CvInfoToProjects,CvInfoToEducations,CvInfoToCertificates,CvInfoToSkills,CvInfoToExperiences"
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

            var oModel = new JSONModel(sData);
            this.getView().setModel(oModel,sModel);
            this._getFragmentDialog(sRecordModel).open();
			this.bEdit = true;
		},
		onDelete(sModel, sDialogName){ 
			var sAllData = this.getView().getModel("CvInfoModel").getData();

			if(sDialogName=="Education"){
				var iDeleteIndex =  sAllData.CvInfoToEducations.results.indexOf(sModel);
				sAllData.CvInfoToEducations.results.splice(iDeleteIndex,1);
			}else if(sDialogName=="Project"){
				var iDeleteIndex =  sAllData.CvInfoToProjects.results.indexOf(sModel);
				sAllData.CvInfoToProjects.results.splice(iDeleteIndex,1);
			}else if(sDialogName=="Certificate"){
				var iDeleteIndex =  sAllData.CvInfoToCertificates.results.indexOf(sModel);
				sAllData.CvInfoToCertificates.results.splice(iDeleteIndex,1);
			}else if(sDialogName=="Skill"){
				var iDeleteIndex =  sAllData.CvInfoToSkills.results.indexOf(sModel);
				sAllData.CvInfoToSkills.results.splice(iDeleteIndex,1);
			}else if(sDialogName=="Experience"){
				var iDeleteIndex =  sAllData.CvInfoToExperiences.results.indexOf(sModel);
				sAllData.CvInfoToExperiences.results.splice(iDeleteIndex,1);
			}

			this.getView().getModel("CvInfoModel").setData(sAllData);
		},
        onSaveData: function(oEvent){
			//Dinamik isimlerin elde edilmesi
			var sDialog = oEvent.oSource.oParent.sId; //butonun bulunduğu fragment diyaloğun id'si (EducationDialog)
			var sDialogName =sDialog.split(/(?=[A-Z])/)[0]; //büyük harfe göre parçala, ilk texti al (Education)
			var sModelName = sDialogName.concat("Model");

			//fragment verisi ve employee structure
			var sModelData = this.getView().getModel(sModelName).getData();
			var sAllData = this.getView().getModel("CvInfoModel").getData();

			//Zorunlu alanlar boş mu & tarihler doğru mu
			var bCondition1 = this.isMandatoryFieldEmpty(sDialogName); 
 			var bCondition2 = this.isDateFalse(sDialogName);

			//koşullar sağlanıyorsa güncelle veya kaydet
			if(bCondition1==false && bCondition2==false) 
			{
				if(this.bEdit){ //UPDATE ENTITY
					this.getView().getModel("CvInfoModel").setData(sAllData);
					this._getFragmentDialog(sDialogName).close();
					this._getFragmentDialog(sDialogName).destroy(true); 
				}
				else{ //ADD ENTITY
					if(sDialogName=="Education"){
						sAllData.CvInfoToEducations.results.push(sModelData)
					}else if(sDialogName=="Project"){
						sAllData.CvInfoToProjects.results.push(sModelData)
					}else if(sDialogName=="Certificate"){
						sAllData.CvInfoToCertificates.results.push(sModelData)
					}else if(sDialogName=="Skill"){
						sAllData.CvInfoToSkills.results.push(sModelData)
					}else if(sDialogName=="Experience"){
						sAllData.CvInfoToExperiences.results.push(sModelData)
					}
					this.getView().getModel("CvInfoModel").setData(sAllData);
					this._getFragmentDialog(sDialogName).close();
					this._getFragmentDialog(sDialogName).destroy(true); 
				}
			}
			else{
			//düzenle butonuna basılıp zorunlu alan silinerek kaydedilmek istenirse 
			//zorunlu alan dolmadan kapatma tuşuna izin verme
			if(this.bEdit){
				sap.ui.getCore().byId("closeButton").setEnabled(false);
			}
			}
        },
		isMandatoryFieldEmpty: function(sDialogName){
			var sSimpleFormName = 'SimpleForm';
			sSimpleFormName=sSimpleFormName.concat(sDialogName); //SimpleFormEducation gibi...
			var aItems=sap.ui.getCore().byId(sSimpleFormName).getContent();
			
			var aRequiredInputs = aItems.filter(function (oControl) { //required özelliği olan inputlar 
				return oControl.getMetadata().getName() !== "sap.m.Button" && //buton ve cbox hesaba katma
						oControl.getMetadata().getName() !== "sap.m.CheckBox" && //getRequired yaparken hata vermesin
						oControl.getRequired() === true;});
			var bIsEmpty = false;
			aRequiredInputs.forEach(function (oInput) {
				if (oInput._lastValue === "") {
					oInput.setValueState("Error");
					oInput.setValueStateText("Zorunlu alan");
					bIsEmpty = true;
				}
			 });
			 return bIsEmpty; //ture: zorunlu alanlar dolmamış
		},
		isDateFalse: function(sDialogName){
			var sSimpleFormName = 'SimpleForm';
			sSimpleFormName=sSimpleFormName.concat(sDialogName); //SimpleFormEducation gibi...
			var bDate=false;
			if(sSimpleFormName=="SimpleFormExperience")
			{
				if(!sap.ui.getCore().byId("chckboxStatus").getSelected())
				{
					var oExpBegin = sap.ui.getCore().byId("ExperienceBeginDate");
					var oExpEnd = sap.ui.getCore().byId("ExperienceEndDate");
					if(oExpEnd.getValue() !=="" && (oExpBegin.getValue() > oExpEnd.getValue())){
						oExpEnd.setValueState("Error");
						oExpEnd.setValueStateText("Başlangıç tarihinden sonraki bir zamanı seçin");
						bDate=true;
					}
				}
			}
			if(sSimpleFormName=="SimpleFormProject")
			{
				var oProjectBegin = sap.ui.getCore().byId("ProjectBeginDate");
				var oProjectEnd = sap.ui.getCore().byId("ProjectEndDate");
				if(oProjectEnd.getValue() !=="" && (oProjectBegin.getValue() > oProjectEnd.getValue())){
					oProjectEnd.setValueState("Error");
					oProjectEnd.setValueStateText("Başlangıç tarihinden sonraki bir zamanı seçin");
					bDate=true;
				}
			}
			return bDate; //true: tarih yanlış
		},
		onCreateDeepEntity: function(){
			var sRequest = this.getView().getModel("CvInfoModel").getData();
            this.getView().getModel().create("/CvInfoSet",sRequest,{
                success: function(oData){
                    this.onGetData();
					MessageToast.show("Kaydetme işlemi başarılı");
					$( ".sapMMessageToast" ).addClass( "sapMMessageToastSuccess " );
                }.bind(this),
                error:function(){
					this.onGetData();
					MessageToast.show("Kaydetme işlemi başarısız");
					$( ".sapMMessageToast" ).addClass( "sapMMessageToastError " );
				}.bind(this)
            });
		},
		//personel resmi bulunamazsa default resmi koy
		errorLoadImage:function(){
			this.getView().byId("employeeImg").setSrc("/Image/employee.png");
		},
		scrollToTop:function(){
			this.getView().byId("CVPage").scrollTo(0);
		},
		addImage: function(){
			var sId = this.getView().getModel("CvInfoModel").getData().PERS_ID;

            var oModel= this.getView().getModel();
            var oFileUploader = sap.ui.getCore().byId("fileUploader");
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
			this._getFragmentDialog("Image").close();
			this._getFragmentDialog("Image").destroy(true); 
			this.handleUploadComplete();
            //return;
		},
		handleUploadComplete: function (oEvent) {
			//Resim urlsini güncelle
			var oImage = this.byId("employeeImg");
			oImage.setSrc(oImage.getSrc() + "?" + new Date().getTime() );
		},
		//required inputlar boşsa uyar (veri girişine zorlamayı onSaveData içinde yaptım)
		handleInputChange: function(oEvent){ 
			var oInput = oEvent.getSource();
			var sValue = oInput.getValue();
		
			//Input boş mu
			if (sValue.trim() === '') {
			  oInput.setValueState("Error");
			  oInput.setValueStateText("Zorunlu alan");
			} else {
			  oInput.setValueState("None");
			}
		},
		onSuggestCities: function (cityId) {
			var oInput=this.getView().byId(cityId);
			var aSuggestions = ["Adana","Adiyaman","Afyon","Agri","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydin","Balikesir","Bartin","Batman","Bayburt","Bilecik","Bingol","Bitlis","Bolu","Burdur","Bursa","Canakkale","Cankiri","Corum","Denizli","Diyarbakir","Duzce","Edirne","Elazig","Erzincan","Erzurum","Eskisehir","Gaziantep","Giresun","Gumushane","Hakkari","Hatay","Igdir","Isparta","Istanbul","Izmir","Kahramanmaras","Karabuk","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kirikkale","Kirklareli","Kirsehir","Kocaeli","Konya","Kutahya","Malatya","Manisa","Mardin","Mersin","Mugla","Mus","Nevsehir","Nigde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Sanliurfa","Siirt","Sinop","Sirnak","Sivas","Tekirdag","Tokat","Trabzon","Tunceli","Usak","Van","Yalova","Yozgat","Zonguldak"];
			
			oInput.setModel(new sap.ui.model.json.JSONModel(aSuggestions));
			oInput.bindAggregation("suggestionItems", {
			path: "/",
			template: new sap.ui.core.Item({
				text: "{}"
			}),
			templateShareable: false
			});
		},
		//ComboBox değerleri dışında bir şey seçilmişse uyar
		onChangeComboBox:function(oEvent){
			var newval = oEvent.getParameter("newValue");
			var key = oEvent.getSource().getSelectedItem();
  
			if (newval !== "" && key === null){
			  oEvent.getSource().setValue("");
			}
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
		onApproveDeletePress: function (oEvent, sDialogName) {
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
							that.onDelete(sModel,sDialogName);
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