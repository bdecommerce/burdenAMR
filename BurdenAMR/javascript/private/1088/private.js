/***************************************************************************************************************************************/
/********************************* SECTION START: Custom Project Renderers *************************************************************/
/***************************************************************************************************************************************/


/***************************************************************************************************************************************/
/********************************* SECTION END: Custom Project Renderers ***************************************************************/
/***************************************************************************************************************************************/

function private_templateViewOptions(renderOptions, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    var _params = TemplateParams();
    var _handled = true;

    switch (TemplateSourceModuleID()) {

        default:
            _handled = false;
            break;
    }

    renderOptions.Events.OnBeforeEnhance = function (options) {
        var $element = $(options.Element);

        $element.find("select, input[type='text'], input[type='password']").attr({
            "data-theme": "light-a"
        });

        $element.find("[" + util_renderAttribute("flip_switch") + "]").addClass("FlipSwitchView");
    };

    renderOptions.GetRenderContainer().addClass("TableTemplateRenderView");

    if (!_handled) {

        switch (_params) {
            default:
                _callback(renderOptions, {});
                break;
        }
    }
}

function private_renderer_options(context, rendererAttribute) {
    var _options = {};

    switch (rendererAttribute) {

        case "label_module_name":   //header title for current module
            var _title = null;

            switch (util_forceInt(MODULE_MANAGER.Current.ModuleID)) {
                case enCEModule.GlobalUser:
                    _title = "User Administration";
                    break;

                case enCEModule.AdminHome:
                    switch (MODULE_MANAGER.Current.ControlName) {
                        default:
                            _title = "Administration";
                            break;
                    }

                    break;

                default:
                    _title = "<APP_NAME_JS>";
                    break;
            }

            if (_title != null) {
                _options["Title"] = _title;
            }

            break;
    }

    return _options;
}

function private_getAdministrationLinks() {	
    var _ret = [];
    var _fnAddAdminLink = function (desc, mContent, mHref, mIsHTML, attr, mIsPopup, mPopupSettings, mIsDivider) {

        attr = util_forceString(attr);

        attr += " " + "data-role='button' data-mini='true' " + util_htmlAttribute(DATA_ATTRIBUTE_RENDER, "module_link");

        _ret.push({
            Description: desc, Options: { Content: mContent, Href: mHref, AttributeStr: attr, IsPopup: mIsPopup, PopupSetting: mPopupSettings },
            IsDivider: mIsDivider
        });
    };
    var _href = null;

    //administration
    _fnAddAdminLink("Administration Menu", null, null, null, null, null, null, true);

    _href = util_constructModuleURL(enCEModule.GlobalUser, enCEModuleViewType.AdminList);
    _fnAddAdminLink("User Administration", "Edit", _href, false, "");

    return _ret;
}

function private_getLayoutConfig() {
    var _ret = { HasHeader: true, HasFooter: true, LayoutType: MODULE_MANAGER.Current.LayoutType };

    var _moduleID = MODULE_MANAGER.Current.ModuleID;
    var _moduleViewType = MODULE_MANAGER.Current.ModuleViewType;
    var _ctrlName = MODULE_MANAGER.Current.ControlName;

    _moduleID = util_forceInt(_moduleID);

    switch (_moduleID) {
        case enCEModule.GlobalSplash:
            _ret.HasHeader = true;
            _ret.HasFooter = true;

            _ret.LayoutType = enCLayoutType.Global;
            break;

        case enCEModule.GlobalResetPassword:
            _ret.LayoutType = enCLayoutType.Global;
            break;

        default:
            break;
    }

    return _ret;
}

function private_moduleUserHasAccess() {
    var _ret = false;
    var _moduleID = MODULE_MANAGER.Current.ModuleID;

    switch (util_forceInt(_moduleID, null)) {
        case enCEModule.GlobalSplash:
            if (util_forceValidEnum(util_queryStringFragment("IsForce"), enCETriState, enCETriState.No) == enCETriState.Yes) {
                _ret = true;
            }

            break;

        case enCEModule.GlobalResetPassword:
            _ret = true;
            break;

        default:
            _ret = false;
            break;
    }

    return _ret;
}

function private_modelGetInstance() {
    var _ret = { "FrameElement": null, "ContentWindow": null, "SharedData": null };
    var _isModelView = module_isCurrentView(enCEModule.GlobalOnlineModel, "Model");

    if (_isModelView) {
        var _modelFrame = $mobileUtil.GetElementByID("ifmModel");

        var _modelContentWindow = (_modelFrame.length == 1 ? _modelFrame.get(0)["contentWindow"] : null);

        _ret.FrameElement = _modelFrame;
        _ret.ContentWindow = _modelContentWindow;

        if (_modelContentWindow && _modelContentWindow["modelSettings"] && _modelContentWindow.modelSettings["SharedData"]) {
            _ret.SharedData = util_extend({ "ScreenNavigationMenuOptions": function () { } }, _modelContentWindow.modelSettings.SharedData);
        }
    }

    return _ret;
}

function private_onlineModelContactUs(options, success, error) {

    success = (success || function (d) { });
    error = (error || function () { });

    options = util_extend({ email: null, name: null, subject: null, message: null }, options);

    APP.Service.Action({
        c: "Project", m: "ContactUs",
        "args": options
    }, function (d) {
        if (d === true) {
            success(d);
        }
        else {
            error();
        }
    }, error);
}

function private_generatePDFReport(options, success, error) {

    success = (success || function (d) { });
    error = (error || function () { });

    options = util_extend({ html: null }, options);
	console.log(options["html"].length);

    APP.Service.Action({
        c: "Project", m: "GeneratePDFReport",
        "args": options
    }, function (d) {
		success(d);
    }, error);
}


$(function () {

    //conditional as the script file may be used as part of web form instead of default module main page
    if (util_isDefined("LAYOUT_CONFIGURATION_FULL")) {
        var _footerHeight = 45;

        LAYOUT_CONFIGURATION_FULL.ContentPaddingOffset = _footerHeight;
        LAYOUT_CONFIGURATION_FULL.FixedHeaderFooter(80, _footerHeight);
    }

    MODULE_MANAGER.ToggleContentLineBreak = false;

    $mobileUtil.Configuration.Page.DefaultTransition = "fade";
    $mobileUtil.Configuration.Dashboard.LoadingIndicatorHTML = "";
    $mobileUtil.ErrorHandler.Init();

    $("body").addClass("ScrollbarPrimary");

    $mobileUtil.Configuration.RendererGetOption["data_admin_list"] = function (opts) {

        var _options = opts.DefaultOptions;

        switch (opts.Type) {

            case "AddNewDialogLink":
                var _cssClass = util_forceString(_options["CssClass"]);
                var _attrs = util_forceString(_options["AttributeStr"]);

                _options["CssClass"] = _cssClass + (_cssClass != "" ? " " : "") + "LinkClickable";
                _options["AttributeStr"] = _attrs + (_attrs != "" ? " " : "") +
                                           "data-role='button' data-theme='light-a' data-corners='false' data-mini='true' data-inlin='true' data-icon='plus' ";
                _options["ToggleDefaultAttributes"] = false;

                break;
        }
    };
});