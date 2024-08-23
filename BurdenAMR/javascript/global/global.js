//JQUERY EXTENDED FUNCTIONALITY
if (util_isDefined("$") && util_isDefined("$.fn")) {

    $.fn.tooltip = function (innerHtml, cssClass, showFn, hideFn) {
        if (showFn === undefined || showFn === null) showFn = "show";
        if (hideFn === undefined || hideFn === null) hideFn = "hide";
        if (cssClass === undefined || cssClass === null) cssClass = "ui-default-tooltip";

        $(this).unbind('mouseenter mouseleave');
        $(this).hover(function () {
            var hover = $(this);
            if (hover.attr('hovered')) {
                return;
            } else hover.attr('hovered', true);

            var previousTooltip = hover.attr('tooltip-class');
            if (previousTooltip != undefined) $('.' + previousTooltip).remove();

            var position = { top: (hover.offset().top) + 'px', left: (hover.offset().left) + 'px' };

            var tooltip = $('.' + cssClass);
            tooltip.remove();
            hover.attr('tooltip-class', cssClass);

            $('body').append("<div class='" + cssClass + "' style='display:none;'>" + innerHtml + "</div>");
            tooltip = $('.' + cssClass);

            tooltip.css({ 'position': 'fixed', 'top': position.top, 'left': position.left });

            tooltip[showFn]();

            tooltip.mouseenter(function () {
                $(this).attr('entered', true);
            });

            setTimeout(function () {
                if (!tooltip.attr('entered') && !hover.attr('hovered')) {
                    tooltip[hideFn](function () {
                        hover.attr('hovered', '');
                        $(this).remove();
                    });
                }
            }, 2000);

            tooltip.mouseout(function () {
                $(this)[hideFn](function () {
                    hover.attr('hovered', '');
                    $(this).remove();
                });
            });
        }, function () {
            var hover = $(this);
            var tooltip = $('.' + cssClass);
            if (!tooltip.attr('entered')) {
                tooltip[hideFn](function () {
                    hover.attr('hovered', '');
                    $(this).remove();
                });
                hover.unbind('mouseout');
            }
        });

        $(this).on('remove', function () {
            $(this).unbind('mouseenter mouseleave');
            var tooltip = $('.' + cssClass);
            tooltip[hideFn](function () {
                $(this).remove();
            });
        });
    };

    $.fn.removeTooltip = function () {
        var obj = $(this);
        obj.unbind('mouseenter mouseleave');
        var previousTooltip = obj.attr('tooltip-class');
        if (previousTooltip != undefined) $('.' + previousTooltip).remove();
        obj.unbind('remove');
    };

    $.fn.refresh = function () {
        var obj = $(this);
        if (obj.length) {
            for (var i = 0; i < obj.length; i++) {
                var innerObj = obj[i];
                if (innerObj.type == "button") $(innerObj).button();
            }
        } else {
            if (obj.type == "button") obj.button();
        }
    };

}
//END JQUERY EXTENSIONS

//*********************************************************************************************************************//
//****************************SECTION START: Global Utilitiy Helpers**************************************************//
//********************************************************************************************************************//

var APP = {
    "Service": {
        "Action": function (options, successFn, failureFn) {

            options = util_extend({ "_unbox": false, "_action": "GET", "_eventArgs": null, "_indicators": true }, options);

            //_unbox is forced disabled (use the _action for overrides)
            if (options["_unbox"]) {
                options["_unbox"] = false;
            }

            var _action = util_forceString(options["_action"]);

            var _instance = this;

            var _fn = successFn;
            var _fnParseResult = function (data) {

                if (data === "") {
                    data = null;
                }

                data = util_parse(data);    //must convert from serialized string to JSON object

                if (_fn) {
                    _fn.apply(_instance, [data]);
                }
            };

            var _eventArgs = options["_eventArgs"];

            switch (_action) {

                case "SAVE":

                    _eventArgs = util_extend({ "Success": null, "SaveConflict": null, "Error": null, "Options": null }, _eventArgs);

                    if (_eventArgs.Success) {
                        _fn = _eventArgs.Success;
                    }
                    
                    successFn = global_extEntitySave(_fnParseResult, _eventArgs.SaveConflict, _eventArgs.Error, _eventArgs.Options);

                    break;

                case "LOAD":

                    successFn = ext_requestSuccess(_fnParseResult, null, null, {
                        "OnError": failureFn    //pass the error function to handle web method failures (Note: this is not supported in the "GET" action available below)
                    });

                    break;

                case "GET":
                default:

                    successFn = ext_requestSuccess(_fnParseResult);
                    break;
            }

            delete options["_action"];
            delete options["_eventArgs"];

            if (options["_indicators"] === false) {
                GlobalService.HasIndicators = false;
            }

            GlobalService.Action.apply(this, [options, successFn, failureFn]);
        }
    }
};

var $mobileUtil = {
    LOADING_CONTENT_TEXT: "Please wait...",
    LOADING_CONTENT_HTML: "<div class='ContentProgressPlaceholder'>" + util_htmlEncode("Please wait...") + "</div>",
    m_overrideActivePage: null,
    RendererCache: {
        Lookup: {},

        GetKey: function (renderAttribute, name) {
            return util_forceString(renderAttribute) + "_" + util_forceString(name);
        },

        GetItem: function (renderAttribute, name) {
            var _key = $mobileUtil.RendererCache.GetKey(renderAttribute, name);

            if (util_isNullOrUndefined($mobileUtil.RendererCache["Lookup"])) {
                $mobileUtil.RendererCache["Lookup"] = {};
            }

            return $mobileUtil.RendererCache.Lookup[_key];
        },

        SetItem: function (renderAttribute, name, value) {
            var _key = $mobileUtil.RendererCache.GetKey(renderAttribute, name);

            if (util_isNullOrUndefined($mobileUtil.RendererCache["Lookup"])) {
                $mobileUtil.RendererCache["Lookup"] = {};
            }

            $mobileUtil.RendererCache.Lookup[_key] = value;
        },

        Clear: function () {
            $mobileUtil.RendererCache.Lookup = {};
        }
    },
    Configuration: {
        ToggleScrollTop: true,
        ToggleActivePageContentResize: false,
        ToggleToolbarResize: false,
        ContentResizeHeightOffset: 0,
        BlockUI: {
            IsIndicatorMode: false,
            CssClassContentBlockUI: "", IndicatorClass: "Indicator",
            SetTransparentMode: function (opts) {

                opts = util_extend({ "IsIndicatorMode": false }, opts);

                $mobileUtil.Configuration.BlockUI.IsIndicatorMode = util_forceBool(opts.IsIndicatorMode, false);
                $mobileUtil.Configuration.BlockUI.CssClassContentBlockUI = "LoadingDefaultMsgTransparent";
                $mobileUtil.Configuration.BlockUI.IndicatorClass = "Indicator02";

                $.blockUI.defaults.overlayCSS.backgroundColor = "transparent";
                $.blockUI.defaults.css["borderRadius"] = "0.5em";
                $.blockUI.defaults.css["backgroundColor"] = "transparent";
                $.blockUI.defaults.css["borderStyle"] = "none";
            }
        },
        Dialog: {
            LayoutHTML: "<div data-role='header'>" +
                        "   <span data-attr-template='sub_header'></span>" +
                        "</div>" +
                        "<div data-role='content'>" +
                        "   <br /><br />" +
                        "</div>" +
                        "<div data-role='footer'>&nbsp;</div>",
            DefaultDialogComponentType: enCDialogComponentType.Default
        },
        Popup: {
            LayoutHTML: "<div class='PopupHeaderContainer'>" +
                        "   <table border='0' cellpadding='0' cellspacing='0' style='width: 100%;'>" +
                        "       <tr>" +
                        "           <td valign='middle' align='left'><span class='PopupHeaderTitle'>%%HEADER_TITLE%%</span></td>" +
                        "           <td valign='top' align='right' style='width: 30px;'>" +
                        "               <a class='PopupHeaderToolButton' data-role='button' data-inline='true' data-theme='transparent' data-icon='arrow-l' data-iconpos='notext' " +
                        "title='Back' data-attr-popup-tool-button-id='back' style='display: none;' />" +
                        "               <a " + util_htmlAttribute("data-attr-popup-close-button", enCETriState.Yes) +
                        " data-role='button' data-iconpos='notext' data-icon='delete' data-inline='true' data-mini='false' data-theme='a' href='javascript: void(0);' " +
                        " title='Close' />" +
                        "           </td>" +
                        "       </tr>" +
                        "   </table>" +
                        "</div>" +
                        "<div class='PopupErrorContainer'>" +
                        "   <ul class='MessageContainer PopupMessageContainer' data-role='listview'></ul>" +
                        "</div>" +
                        "<div class='PopupContent'>%%CONTENT%%</div>",
            DefaultPopupComponentType: enCPopupComponentType.Default
        },
        Notification: {
            Type: enCNotificationComponentType.Default,
            Init: function () {
                try {
                    $mobileUtil.Configuration.Notification.Type = module_getSetting(enCEModule.ConfigSite)["NotificationStyleID"];
                } catch (e) {
                    util_logError(e);
                }
            }
        },
        Dashboard: {
            LoadingIndicatorHTML: "<div class='InlineBlock IndicatorSmall' />"
        },
        Page: {
            ToggleTransition: false,
            DefaultTransition: "fade"
        },
        RendererGetOption: {
            //lookup format as follows:
            //  key = renderer name
            //  value = function of the following format: function(opts){ ... } where opts is passed argument of {"Type": "", "DefaultOptions": {} }
        }
    },

    ActivePage: function (forceMobileContext) {
        var _ret = null;

        var _fnHasActivePopup = function () {
            var _hasPopup = false;
            var _currentDialog = null;

            if ($.mobile) {
                _currentDialog = $.mobile.sdCurrentDialog;
            }

            if (!util_isNullOrUndefined(_currentDialog)) {
                var _stateConfig = _currentDialog["cStateConfig"];
                var _hasStateConfig = !util_isNullOrUndefined(_stateConfig);

                if (!_hasStateConfig || (_hasStateConfig && util_forceBool(_stateConfig["IsCloseEvent"], false) == false)) {
                    _hasPopup = true;
                }
            }

            return _hasPopup;
        };

        if (!forceMobileContext && !util_isNullOrUndefined($mobileUtil.m_overrideActivePage)) {
            _ret = $($mobileUtil.m_overrideActivePage);
        }
        else if (forceMobileContext || !_fnHasActivePopup() || util_isNullOrUndefined($.mobile)) {
            _ret = $.mobile.activePage;
        }
        else {
            _ret = $($.mobile.sdCurrentDialog.sdIntContent);
        }

        return _ret;
    },

    OverrideActivePageContext: function (obj) {
        if (util_isNullOrUndefined(obj)) {
            $mobileUtil.m_overrideActivePage = null;
        }
        else {
            $mobileUtil.m_overrideActivePage = obj;
        }
    },

    StandardActivePage: function () {
        return $("#pageMain");
    },

    OnlineModelActivePage: function () {
        return $("#pageOnlineModel");
    },

    IsActiveDialogPage: function (mPage) {
        if (util_isNullOrUndefined(mPage)) {
            mPage = $mobileUtil.ActivePage();
        }

        var _page = $(mPage);
        var _isDialog = _page.attr("IsDialog");
        var _ret = false;

        if (_isDialog && util_forceValidEnum(_isDialog, enCETriState, enCETriState.No) == enCETriState.Yes) {
            _ret = true;
        }

        return _ret;
    },

    Header: function (context) {
        var _criteria = null;

        if (util_isNullOrUndefined(context)) {
            context = $mobileUtil.ActivePage();
        }

        if ($mobileUtil.IsActiveDialogPage(context)) {
            _criteria = ":jqmData(role=header) [" + DATA_ATTR_TEMPLATE + "=sub_header]";
        }
        else {
            _criteria = ":jqmData(role=header), [" + DATA_ATTR_TEMPLATE + "=layout_header]";
        }

        return context.find(_criteria);
    },

    SetCurrentActivePage: function (objPage, options) {
        var _page = $(objPage);

        if (util_isNullOrUndefined(options)) {
            options = {};
        }

        if (_page.length == 1) {

            var _options = { allowSamePageTransition: true, reloadPage: false, changeHash: false };

            for (var _prop in options) {
                _options[_prop] = options[_prop];
            }

            $.mobile.changePage(_page, _options);
        }
    },

    GetSubHeaderHTML: function () {
        var _ret = "";

        var _cssViewClass = "ViewLayoutPage";
        var _messageParentCssClass = "";

        if ($mobileUtil.IsActiveDialogPage()) {
            _cssViewClass = "ViewLayoutDialog";
        }

        if ($mobileUtil.Configuration.Notification.Type == enCNotificationComponentType.Inline) {
            _messageParentCssClass += (_messageParentCssClass != "" ? " " : "") + "MessageContainerFixed";
        }

        _ret += "<div" + (_messageParentCssClass != "" ? " class='" + _messageParentCssClass + "'" : "") + ">" +
                "   <ul class=\"MessageContainer " + _cssViewClass + "\" data-role=\"listview\"></ul>" +
                "</div>";

        return _ret;
    },

    GetSubFooterHTML: function (options) {
        var _ret = "";

        options = util_forceObject(options, { PopupFooterViewMode: enCPopupFooterViewMode.None, ButtonList: [], IsPropagateDismiss: false });

        var _footerButtons = [];
        var _fnAddButton = function (item) {
            _footerButtons.push({ ButtonID: item.ID, Text: item.Text });
        };

        options.PopupFooterViewMode = util_forceValidEnum(options.PopupFooterViewMode, enCPopupFooterViewMode, enCPopupFooterViewMode.None);

        switch (options.PopupFooterViewMode) {
            case enCPopupFooterViewMode.SaveCancel:
                _fnAddButton(BUTTON_CONFIG.Cancel);
                _fnAddButton(BUTTON_CONFIG.Save);
                break;

            case enCPopupFooterViewMode.Save:
                _fnAddButton(BUTTON_CONFIG.Save);
                break;

            case enCPopupFooterViewMode.Cancel:
                _fnAddButton(BUTTON_CONFIG.Cancel);
                break;

            case enCPopupFooterViewMode.SaveDeleteCancel:
                _fnAddButton(BUTTON_CONFIG.Cancel);
                _fnAddButton(BUTTON_CONFIG.Save);
                _fnAddButton(BUTTON_CONFIG.Delete);
                break;

            case enCPopupFooterViewMode.SaveDelete:
                _fnAddButton(BUTTON_CONFIG.Save);
                _fnAddButton(BUTTON_CONFIG.Delete);
                break;

            case enCPopupFooterViewMode.DeleteCancel:
                _fnAddButton(BUTTON_CONFIG.Cancel);
                _fnAddButton(BUTTON_CONFIG.Delete);
                break;

            case enCPopupFooterViewMode.Close:
                _fnAddButton(BUTTON_CONFIG.Close);
                break;

            case enCPopupFooterViewMode.Custom:
                var _arrButtons = options["ButtonList"];

                if (util_isNullOrUndefined(_arrButtons)) {
                    _arrButtons = [];
                }

                for (var i = 0; i < _arrButtons.length; i++) {
                    var _btnItem = _arrButtons[i];

                    _fnAddButton({ "ID": _btnItem["ID"], "Text": _btnItem["Text"] });
                }

                break;

            default:
                _footerButtons = null;  //set null to indicate that the subfooter view mode is not needed
                break;
        }

        if (_footerButtons && _footerButtons.length > 0) {
            _ret += "<div data-role=\"navbar\"><ul>";   //open div and ul tag #1

            var _isDialog = $mobileUtil.IsActiveDialogPage();

            for (var i = 0; i < _footerButtons.length; i++) {
                var _valid = true;
                var _btnItem = _footerButtons[i];

                var _href = "javascript: void(0);";
                var _onClick = "";

                var _id = _btnItem.ButtonID;

                if (!_isDialog && (_id == BUTTON_CONFIG.Cancel.ID || _id == BUTTON_CONFIG.Close.ID)) {
                    _valid = false; //if it is not a dialog and cancel/close type buttons are set, then invalidate it
                }
                else {

                    var _isDismiss = (_id == BUTTON_CONFIG.Cancel.ID || _id == BUTTON_CONFIG.Close.ID);

                    _onClick = "onclick=\"global_eventSubFooterClick(this);\"" + 
                               (_isDismiss && options["IsPropagateDismiss"] == true ? " " + util_htmlAttribute("data-attr-button-is-propagate-dismiss", enCETriState.Yes) : "");
                }

                if (_valid) {
                    _ret += "<li><a href=\"" + _href + "\" " + _onClick + " data-attr-button-id=\"" + _id + "\">" + util_htmlEncode(_btnItem.Text) + "</a></li>";
                }
            }

            _ret += "</ul></div>";  //close div and ul tag #1
        }

        return _ret;
    },

    SetSubFooterView: function (options) {
        var _html = $mobileUtil.GetSubFooterHTML(options);

        var _subfooter = $mobileUtil.GetElementsByAttribute("data-attr-role", "subfooter");

        _subfooter.html(_html);

        $mobileUtil.WidgetCreate(_subfooter);    //create the widgets from the update content, as needed
    },

    Content: function (context) {
        if (util_isNullOrUndefined(context)) {
            context = $mobileUtil.ActivePage();
        }

        return context.find(":jqmData(role=content)");
    },

    Footer: function (context) {
        if (util_isNullOrUndefined(context)) {
            context = $mobileUtil.ActivePage();
        }

        return context.find(":jqmData(role=footer)");
    },

    FooterContentPlaceholder: function () {
        return $($mobileUtil.footer().find(".FooterContentPlaceholder")[0]);
    },

    GetElementsByAttribute: function (attribute, value, isSearchHasAttribute) {
        isSearchHasAttribute = util_forceBool(isSearchHasAttribute, false);
        var _criteria = "";

        if (isSearchHasAttribute) {
            _criteria = "[" + attribute + "]";
        }
        else {
            _criteria = "[" + attribute + "=" + value + "]";
        }

        return $mobileUtil.ActivePage().find(_criteria);
    },

    GetElementByID: function (id) {
        return $mobileUtil.ActivePage().find("#" + id);
    },

    Find: function (selector) {
        return $mobileUtil.ActivePage().find(selector);
    },

    FindAncestor: function (obj, selector) {
        var _element = $(obj);

        return $(_element.parentsUntil(selector).last().parent());
    },

    FindClosest: function (obj, selector) {
        var _element = $(obj);

        return $(_element.closest(selector));
    },

    GetElementValue: function (id) {
        var _element = $mobileUtil.GetElementByID(id); //search only applicable to the active page

        return _element.val();
    },

    GetAncestorAttributeValue: function (obj, attributeName) {
        var _attributeValue = null;
        var _searchList = $(obj).parentsUntil("[" + attributeName + "]");

        if (_searchList.length > 0) {
            _attributeValue = $(_searchList.last().parent()).attr(attributeName);
        }
        else {
            _attributeValue = $(obj).parent().attr(attributeName);
        }

        return _attributeValue;
    },

    /*
    Note: use of this method is more efficient compared to "GetAncestorAttributeValue" and it should be noted that if the "obj" element contains the attribute, 
    then it is returned as the matching search list.
    */
    GetClosestAttributeValue: function (obj, attributeName) {
        var _attributeValue = null;
        var _searchList = $(obj).closest("[" + attributeName + "]");

        if (_searchList.length > 0) {
            _attributeValue = _searchList.attr(attributeName);
        }

        return _attributeValue;
    },

    ButtonSetText: function (id, text) {
        var _btn = $mobileUtil.GetElementByID(id);

        _btn.find(".ui-btn-text").text(util_forceString(text));
    },

    ButtonSetTextByElement: function (obj, text) {
        var _btn = $(obj);

        _btn.find(".ui-btn-text").text(util_forceString(text));
    },

    ButtonUpdateIcon: function (obj, strIcon) {
        var _element = $(obj);

        _element.buttonMarkup({ icon: strIcon });
    },

    //ensure form elements and buttons are not enhanced by jQuery Mobile (i.e. native form elements view)
    DisableFormElementEnhance: function (obj) {
        $(obj).attr("data-role", "none");
    },

    CheckboxIsChecked: function (obj) {
        return $(obj).is(":checked");
    },

    CheckboxSetChecked: function (objList, isChecked) {
        var _list = $(objList);
        isChecked = util_forceBool(isChecked, false);

        _list.prop("checked", isChecked);

        var _length = _list.length;

        if (_length != 1 || (_list.length == 1 && _list.first().attr("data-role") != "none")) {
            $mobileUtil.WidgetRefresh(_list, "checkboxradio");
        }
    },

    ToggleLinkCheckboxIsChecked: function (toggleObj) {
        var _toggle = $(this);
        var _isSelected = util_forceValidEnum(_toggle.attr(CONTROL_DATA_ATTR_TOGGLE_LINK_STATE), enCETriState, enCETriState.None);

        return (_isSelected == enCETriState.Yes);
    },

    ToggleLinkCheckboxSetState: function (toggleObj, isChecked) {
        var _toggle = $(this);

        isChecked = util_forceBool(isChecked, false);

        _toggle.attr(CONTROL_DATA_ATTR_TOGGLE_LINK_STATE, isChecked ? enCETriState.Yes : enCETriState.No);
    },

    ToggleLinkCheckboxClick: function (toggleObj, list) {
        var _toggle = $(this);
        var _isSelected = util_forceValidEnum(_toggle.attr(CONTROL_DATA_ATTR_TOGGLE_LINK_STATE), enCETriState, enCETriState.None);

        if (_isSelected == enCETriState.Yes) {
            _isSelected = enCETriState.No;
        }
        else {
            _isSelected = enCETriState.Yes;
        }

        $mobileUtil.ToggleLinkCheckboxSetState(_toggle, (_isSelected == enCETriState.Yes));

        $mobileUtil.CheckboxSetChecked(list, _isSelected == enCETriState.Yes);

        return false;
    },


    SetElementValue: function (id, value, obj) {
        var _element = (obj ? $(obj) : $mobileUtil.GetElementByID(id));  //search only applicable to the active page
        var _selectorTextOverrides = "span, label";

        if (_element.is(_selectorTextOverrides)) {
            _element.text(value);
        }
        else if (_element.is("select") && (_element.attr("data-attr-widget") != "flip_switch")) {

            //handle the dropdownlist (i.e. "select") elements
            $mobileUtil.SetDropdownListValue(_element, value);
        }
        else {
            _element.val(value);
            $mobileUtil.WidgetRefresh(_element);
        }
    },

    SetDropdownListValue: function (obj, value) {
        var _element = $(obj);

        _element.val(value);

        try {
            _element.selectmenu('refresh');
        } catch (e) {
        }
    },

    //initialize default events and variables prior to a view being configured
    InitDefaultView: function () {
        try {

            //set default events (in case a previous event exists)
            MODULE_MANAGER.DelegateSettings.Init(true);
        } catch (e) {

        }
    },

    SetActivePageHTML: function (html, context, options, callback) {

        options = util_extend({ "IsReplaceView": false }, options);

        var _fnCallback = function () {
            $mobileUtil.InitDefaultView();


            html = $mobileUtil.GetSubHeaderHTML(options) + "<div id=\"divContentRoot\" style=\"display: none;\">" + util_forceString(html) + "</div>" +
                   "<div data-attr-role=\"subfooter\"></div>";

            //inject the markup into the content element
            $mobileUtil.Content(context).html(html);

            // pages are lazily enhanced and as such will need to call page() on the page element to make sure it is always enhanced before 
            // attempting to enhance the markup we had just injected; subsequent calls to page() are ignored since a page/widget 
            // can only be enhanced once
            try {
                var _activePage = $mobileUtil.ActivePage(context);

                if ($mobileUtil.Configuration.Dialog.DefaultDialogComponentType == enCDialogComponentType.Inline && $mobileUtil.IsActiveDialogPage(_activePage)) {

                    //do nothing since current active page is an inline dialog [i.e. cannot call page() on it]
                }
                else {
                    _activePage.page();
                }
            } catch (e) {
                $(context).page();
            }

            //if the context is not specified or if the context is not a page clone (used for transitions) then must refresh the context as active page is valid
            if (util_isNullOrUndefined(context) || util_forceInt($(context).attr("data-attr-page-clone"), enCETriState.None) != enCETriState.Yes) {

                if (!util_forceBool(options["IsReplaceView"], false)) {

                    //refresh all jQuery Mobile content
                    $mobileUtil.refresh(context);
                }
                else {

                    $mobileUtil.refresh($mobileUtil.ActivePage(context));
                }
            }

            if (callback) {
                callback();
            }

            var _divContentRoot = $mobileUtil.GetElementByID("divContentRoot");

            if (!_divContentRoot.is(":visible")) {
                _divContentRoot.fadeIn();
            }
        };

        var _arrRecursive = [];

        var _fnSetLayoutControl = function (container, mModuleID, mCtrlName) {
            var _container = $(container);
            var _settings = module_getSetting(mModuleID);

            if (_settings) {
                var _ctrlName = "";

                mCtrlName = _settings[mCtrlName + "Page"];  //retrieve the layout page from the setting using the specified prefix property for the "Page"

                _ctrlName = mCtrlName.substr(mCtrlName.indexOf("ctl") + "ctl".length);
                _ctrlName = _ctrlName.substr(0, _ctrlName.indexOf(".html"));

                var _persistentLayout = false;

                if (mModuleID == enCEModule.ConfigHeader || mModuleID == enCEModule.ConfigFooter) {
                    var _moduleSettingSite = module_getSetting(enCEModule.ConfigSite);

                    if (_moduleSettingSite) {
                        _persistentLayout = util_forceBool(_moduleSettingSite["IsPersistentHeaderFooterLayout"], _persistentLayout);
                    }
                }

                var _fn = function () {

                    _container.hide();

                    module_getViewHTML(mModuleID, _ctrlName, null, function (html) {
                        setTimeout(function () {
                            html = util_forceString(html);

                            _container.html(html);
                            $mobileUtil.refresh(_container, true);

                            _container.data("LayoutTag", { "ModuleID": mModuleID, "ControlName": mCtrlName });

                            if (_persistentLayout) {
                                _container.trigger("events.layout_onRefresh");
                            }

                            if (html != "") {
                                _container.show();
                            }
                        }, 0);
                    });

                };  //end: _fn

                if (_persistentLayout) {
                    var _layoutTag = util_extend({ "ModuleID": enCE.None, "ControlName": null }, _container.data("LayoutTag"));

                    if (util_forceInt(_layoutTag.ModuleID, enCE.None) != mModuleID || util_forceString(_layoutTag.ControlName) != util_forceString(mCtrlName)) {
                        _fn();
                    }
                    else {

                        $mobileUtil.refresh(_container, true);
                        _container.trigger("events.layout_onRefresh");

                        if (!_container.is(":visible")) {
                            _container.show();
                        }
                    }
                }
                else {
                    _fn();
                }
            } else {
                _container.hide();
            }

            if (_arrRecursive == null || _arrRecursive.length == 0) {
                _fnCallback();
            }
            else {
                var _fn = _arrRecursive.pop();

                _fn();
            }
        };

        var _layoutType = util_forceValidEnum(MODULE_MANAGER.Current.LayoutType, enCLayoutType, enCLayoutType.None);

        if (_layoutType != enCLayoutType.None) {
            var _layoutCtrlName = null;
            var _layoutConfig = { HasHeader: true, HasFooter: true, LayoutType: _layoutType };
            var _overrideConfig = null;

            if (util_isDefined("private_getLayoutConfig")) {
                _overrideConfig = private_getLayoutConfig();
            }

            _layoutConfig = (util_isNullOrUndefined(_overrideConfig) ? _layoutConfig : _overrideConfig);

            switch (_layoutConfig.LayoutType) {
                case enCLayoutType.Private:
                    _layoutCtrlName = "Private";
                    break;

                case enCLayoutType.Dialog:
                    _layoutCtrlName = "Dialog";
                    break;

                default:
                    _layoutCtrlName = "Global";
                    break;
            }

            var _onlineModelSettings = module_getSetting(enCEModule.GlobalOnlineModel);

            //toggle header based on the layout configuration and if applicable, the online model settings (if in current module view)
            if ((MODULE_MANAGER.Current.ModuleID == enCEModule.GlobalOnlineModel && _onlineModelSettings.IsToggleHeader) ||
                (MODULE_MANAGER.Current.ModuleID != enCEModule.GlobalOnlineModel && _layoutConfig.HasHeader)
                ) {

                _arrRecursive.push(function () {
                    _fnSetLayoutControl($mobileUtil.Header(context), enCEModule.ConfigHeader, _layoutCtrlName);
                });
            }
            else {
                $mobileUtil.Header(context).html("")
                           .removeData("LayoutTag");
            }

            if (_layoutConfig.HasFooter) {
                _arrRecursive.push(function () {
                    _fnSetLayoutControl($mobileUtil.Footer(context), enCEModule.ConfigFooter, _layoutCtrlName);
                });
            }
            else {
                $mobileUtil.Footer(context).html("")
                           .removeData("LayoutTag");
            }

            if (_arrRecursive.length > 0) {
                var _fn = _arrRecursive.pop();

                _fn();
            } else {
                _fnCallback();
            }
        }
        else {
            _fnCallback();
        }
    },

    ReplaceApplicationTokensHTML: function (html) {
        var _ret = new String(html);
        var _tokens = {};

        var _fnAddToken = function (name, value) {
            _tokens[name] = value;
        };

        _fnAddToken("%%DATA_ATTRIBUTE_RENDER%%", DATA_ATTRIBUTE_RENDER);
        _fnAddToken("%%DATA_ATTRIBUTE_RENDER_EXT%%", DATA_ATTRIBUTE_RENDER_EXT);
        _fnAddToken("%%DATA_ATTR_POPUP_LINKS_EVENT_CALLBACK_ITEMS%%", DATA_ATTR_POPUP_LINKS_EVENT_CALLBACK_ITEMS);
        _fnAddToken("%%DATA_ATTR_POPUP_LINKS_IS_DASHBOARD_MODE%%", DATA_ATTR_POPUP_LINKS_IS_DASHBOARD_MODE);
        _fnAddToken("%%DATA_ATTR_POPUP_LINKS_DASHBOARD_OPENS_CALLBACK%%", DATA_ATTR_POPUP_LINKS_DASHBOARD_OPENS_CALLBACK);
        _fnAddToken("%%DATA_ATTR_POPUP_CONTENT%%", DATA_ATTR_POPUP_CONTENT);
        _fnAddToken("%%DATA_ATTR_POPUP_EVENT_CALLBACK_OPEN%%", DATA_ATTR_POPUP_EVENT_CALLBACK_OPEN);
        _fnAddToken("%%DATA_ATTR_POPUP_EVENT_CALLBACK_CLOSE%%", DATA_ATTR_POPUP_EVENT_CALLBACK_CLOSE);
        _fnAddToken("%%CONTROL_DATA_ATTR_WATERMARK_TOGGLE_CLASS%%", CONTROL_DATA_ATTR_WATERMARK_TOGGLE_CLASS);
        _fnAddToken("%%DATA_ATTR_POPUP_POSITION_FORCE_ABSOLUTE%%", DATA_ATTR_POPUP_POSITION_FORCE_ABSOLUTE);
        _fnAddToken("%%DATA_ATTR_POPUP_POSITION_X%%", DATA_ATTR_POPUP_POSITION_X);
        _fnAddToken("%%DATA_ATTR_POPUP_POSITION_Y%%", DATA_ATTR_POPUP_POSITION_Y);

        _fnAddToken("%%CONTROL_IMAGE_LINK_URL%%", CONTROL_IMAGE_LINK_URL);
        _fnAddToken("%%CONTROL_IMAGE_LINK_WIDTH%%", CONTROL_IMAGE_LINK_WIDTH);
        _fnAddToken("%%CONTROL_IMAGE_LINK_HEIGHT%%", CONTROL_IMAGE_LINK_HEIGHT);
        _fnAddToken("%%CONTROL_TAB_GROUP_HEADER%%", CONTROL_TAB_GROUP_HEADER);
        _fnAddToken("%%CONTROL_TAB_GROUP_HEADER_LINK_ID%%", CONTROL_TAB_GROUP_HEADER_LINK_ID);
        _fnAddToken("%%CONTROL_TAB_GROUP_CONTENT_ID%%", CONTROL_TAB_GROUP_CONTENT_ID);

        //language renderer related attributes
        _fnAddToken("%%DATA_ATTR_LANG_LABEL_KEY%%", DATA_ATTR_LANG_LABEL_KEY);
        _fnAddToken("%%DATA_ATTR_LANG_LABEL_DEFAULT%%", DATA_ATTR_LANG_LABEL_DEFAULT);

        _ret = util_replaceTokens(_ret, _tokens);

        return _ret;
    },

    DialogContainer: function () {
        var _ret = null;

        var _dialogComponentType = $mobileUtil.Configuration.Dialog.DefaultDialogComponentType;

        if (_dialogComponentType == enCDialogComponentType.Default) {
            _ret = $("body").find("#DialogPage");
        }
        else if (_dialogComponentType == enCDialogComponentType.Inline) {
            _ret = $mobileUtil.PopupContainer();
        }

        return _ret;
    },

    CloseDialog: function (pageRefreshMode, isApplyDelay) {
        pageRefreshMode = util_forceValidEnum(pageRefreshMode, enCPageRefreshMode, enCPageRefreshMode.None);
        isApplyDelay = util_forceBool(isApplyDelay, false);

        if (isApplyDelay) {

            //there is a delay required for the close event, therefore ensure all inputs for the view are disabled
            $mobileUtil.ToggleViewState($mobileUtil.content(), false);
        }

        setTimeout(function () {

            //if a valid refresh mode is specified, then configure the page attributes to flag that the current module is to be reloaded
            if (pageRefreshMode != enCPageRefreshMode.None) {
                $mobileUtil.ActivePage().attr(DATA_ATTR_PAGE_REFRESH_MODE, pageRefreshMode);
            }
            else {
                $mobileUtil.ActivePage().removeAttr(DATA_ATTR_PAGE_REFRESH_MODE);    //remove the attribute since refresh of new page is not requried, if applicable
            }

            var _activePage = $mobileUtil.ActivePage();

            if ($mobileUtil.Configuration.Dialog.DefaultDialogComponentType == enCDialogComponentType.Inline) {
                $mobileUtil.PopupClose();
            }
            else {

                //Note: jQuery mobile with popups of iframe does not properly close the dialog at times due to posted data state of the iframe.
                //      Following check manually removes the dialog state from query string and forces refresh of the current view if iframes exist in active page.
                if (_activePage.find("iframe").length > 0 || $browserUtil.IsUserAgentIPad()) {
                    $mobileUtil.ConfigureDialogStateURL();
                }
                else {
                    _activePage.dialog("close");
                }
            }
        }, (isApplyDelay ? 1000 : 0));
    },

    DialogConfigure: function (target) {
        var _element = $(target);
        var _dialog = $mobileUtil.DialogContainer();

        var _title = util_forceString(_element.attr("data-attr-dialog-title"), "");
        var _contentHref = util_forceString(_element.attr(DATA_ATTRIBUTE_CONTEXT_HREF), "");
        var _mode = enCDialogMode.Normal;
        var _modeCssClass = {};

        _modeCssClass[enCDialogMode.Normal] = "DialogNormal";
        _modeCssClass[enCDialogMode.Small] = "DialogSmall";
        _modeCssClass[enCDialogMode.Wide] = "DialogWide";
        _modeCssClass[enCDialogMode.FullScreen] = "DialogFullScreen";

        $mobileUtil.DialogUpdateView({ "Title": _title, "Container": _dialog }); //set the title for the dialog
        _dialog.find(":jqmData(role=content)").html($mobileUtil.LOADING_CONTENT_HTML);  //set default placeholder content

        //remove all previous dialog mode CSS classes
        for (var _key in _modeCssClass) {
            _dialog.removeClass(_modeCssClass[_key]);
        }

        //check if there is a dialog mode data attribute on the element
        if (!util_isNullOrUndefined(_element.attr(DATA_ATTRIBUTE_DIALOG_MODE))) {
            _mode = util_forceValidEnum(_element.attr(DATA_ATTRIBUTE_DIALOG_MODE), enCDialogMode, _mode);
        }
        else if (util_forceString(util_queryStringFragment("PopupMode", _contentHref)) != "") {

            //check if there is a dialog mode query string for the context URL
            _mode = util_forceValidEnum(util_queryStringFragment("PopupMode", _contentHref), enCDialogMode, _mode);
        }

        //add the appropriate class for the dialog mode
        _dialog.addClass(_modeCssClass[_mode]);

        _dialog.attr(DATA_ATTRIBUTE_CONTEXT_HREF, _contentHref);

        _dialog.attr("IsDialog", enCETriState.Yes); //set attribute that the page is a dialog

        if ($mobileUtil.Configuration.Dialog.DefaultDialogComponentType == enCDialogComponentType.Inline) {
            _dialog.addClass("DialogInline");
        }
    },

    DialogUpdateView: function (options) {
        options = util_extend({ "Title": "", "Container": null }, options);

        var _container = $(options["Container"]);
        var _title = util_forceString(options["Title"]);

        if (_container.length == 0) {
            _container = $mobileUtil.DialogContainer();
        }

        _container.find(".DialogTitle, .PopupHeaderTitle").text(_title);
    },

    DialogViewOptions: function () {
        var _ret = {};
        var _container = $mobileUtil.DialogContainer();

        _ret["Title"] = _container.find(".DialogTitle, .PopupHeaderTitle").text();

        return _ret;
    },

    InitDialog: function (context) {
        if (context == null || context == undefined) {
            context = $mobileUtil.ActivePage();
        }

        var _dialogLinks = context.find("[" + DATA_ATTRIBUTE_RENDER + "=dialog]");

        _dialogLinks.attr("href", "#" + $mobileUtil.DialogContainer().attr("id"));
    },

    InitKnob: function (context) {
        if (context == null || context == undefined) {
            context = $mobileUtil.ActivePage();
        }

        var _list = $(context).find(".knob");

        _list.knob();

        $.each(_list, function (index) {
            var _item = $(this);

            //HACK: remove the jQuery Mobile specific classes added to the knob element and its parent
            _item.attr("class", "knob");
            $(_item.parent().parent()).removeAttr("class");
        });
    },

    PopupContainer: function () {
        var _ret = null;

        if ($.mobile) {
            _ret = $.mobile.sdCurrentDialog;
        }

        if (util_isNullOrUndefined(_ret)) {
            _ret = $("#popupInlineContainer");

            if (_ret.length == 0) {
                _ret = $mobileUtil.ActivePage().find("[data-cattr-popup-container=1]");

                if (_ret.length != 1) {
                    _ret = $("#PopupPage");
                }
            }
        }
        else {
            _ret = $mobileUtil.ActivePage();
        }

        return _ret;
    },

    PopupContentContainer: function () {
        var _ret = null;
        var _popupType = $mobileUtil.PopupComponentType();
        var _container = $mobileUtil.PopupContainer();

        switch (_popupType) {
            case enCPopupComponentType.SimpleDialog:
            case enCPopupComponentType.Inline:
                _ret = $(_container.find("[data-attr-popup-content-container=" + enCETriState.Yes + "]"));
                break;

            default:
                _ret = $(_container.children());
                break;

        }

        return _ret;
    },

    PopupOpen: function (options, popupType) {
        if (options == null || options == undefined) {
            options = {};
        }

        popupType = util_forceValidEnum(popupType, enCPopupComponentType, $mobileUtil.Configuration.Popup.DefaultPopupComponentType);

        switch (popupType) {
            case enCPopupComponentType.SimpleDialog:
            case enCPopupComponentType.Inline:
                var _popupOptions = { mode: "blank", headerClose: false, forceInput: false };

                for (var _prop in _popupOptions) {
                    options[_prop] = _popupOptions[_prop];
                }

                var _optionCallbackOpen = options["callbackOpen"];
                var _optionCallbackClose = options["callbackClose"];

                var _config = {
                    ShowHeaderClose: util_forceBool(options["ShowHeaderClose"], true),
                    HeaderTitle: util_forceString(options["HeaderTitle"], "Popup"),
                    ShowHeaderTitle: util_forceBool(options["ShowHeaderTitle"], true),
                    OverrideLayoutHTML: util_forceString(options["OverrideLayoutHTML"], ""),
                    IsPositionOnOpen: util_forceBool(options["IsPositionOnOpen"], false),
                    IsPositionFixed: util_forceBool(options["IsPositionFixed"], true),
                    IsPositionAbsoluteCenter: util_forceBool(options["IsPositionAbsoluteCenter"], false),
                    IsPositionTopCenter: util_forceBool(options["IsPositionTopCenter"], false),
                    WidthCSS: util_forceString(options["width"]),
                    TargetElement: options["TargetElement"],
                    IsToggleOverlay: util_forceBool(options["IsToggleOverlay"], true),
                    IsDismissClickOverlay: util_forceBool(options["IsDismissClickOverlay"], false),
                    PopupCssClass: util_forceString(options["PopupCssClass"]),
                    DisablePosition: util_forceBool(options["DisablePosition"], false),
                    MaxWidthRatio: util_forceFloat(options["MaxWidthRatio"], 0.45),
                    IsMinimalView: util_forceBool(options["IsMinimalView"], false),
                    HasIndicators: util_forceBool(options["HasIndicators"], false)
                };

                var $trigger = $(options["Trigger"]); //element which triggered the popup (in the event additional attributes/parameters for dialog are required)
                var _maxWidthRatio = util_forceFloat($trigger.attr("data-attr-popup-open-param-MaxWidthRatio"), -1);

                if (_maxWidthRatio > 0) {
                    _config.MaxWidthRatio = _maxWidthRatio;
                }

                options["callbackOpen"] = function () {

                    //configure the overlay type
                    if (popupType == enCPopupComponentType.SimpleDialog) {
                        var _containerOverlay = $(".ui-simpledialog-screen-modal");

                        if (_config.IsToggleOverlay) {
                            _containerOverlay.removeClass("SimpleDialogTransparentOverlay");
                        }
                        else {
                            _containerOverlay.addClass("SimpleDialogTransparentOverlay");
                        }
                    }
                    else if (popupType == enCPopupComponentType.Inline) {
                        var _overlayOptions = { "IsResponsive": _config.DisablePosition };

                        if (_config.IsDismissClickOverlay) {
                            _overlayOptions["OnOverlayClick"] = function () {
                                $mobileUtil.PopupClose();
                            };
                        }

                        $mobileUtil.ToggleOverlay(true, _overlayOptions);
                    }

                    //configure the default state config object
                    if (popupType == enCPopupComponentType.SimpleDialog) {
                        $.mobile.sdCurrentDialog["cStateConfig"] = { "IsCloseEvent": false };
                    }

                    var _popupContainer = $mobileUtil.PopupContainer();

                    if (_config.PopupCssClass == "") {
                        _popupContainer.css("width", "100%");
                    }

                    if (!_config.DisablePosition) {
                        if (_config.IsPositionFixed) {
                            var _scrollPosition = $mobileUtil.ScrollPosition();

                            _popupContainer.css("top", _scrollPosition.Top + "px");
                        }

                        if (_config.WidthCSS == "") {
                            _popupContainer.css("max-width", $(window).width() * _config.MaxWidthRatio + "px");
                        }
                        else {
                            _popupContainer.css("max-width", _config.WidthCSS);
                        }
                    }

                    $mobileUtil.refresh(_popupContainer);  //refresh the contents of the popup

                    _popupContainer.off("click.popup_dismiss");
                    _popupContainer.on("click.popup_dismiss", "[data-attr-popup-close-button=" + enCETriState.Yes + "]", function () {
                        $mobileUtil.PopupClose();
                    });

                    _popupContainer.off("click.popup_headerTools");
                    _popupContainer.on("click.popup_headerTools", ".PopupHeaderToolButton[data-attr-popup-tool-button-id]", function (e) {
                        var $btn = $(this);
                        var _id = $btn.attr("data-attr-popup-tool-button-id");

                        switch (_id) {

                            default:

                                var _fnClick = $btn.data("OnClick");

                                if (util_isFunction(_fnClick)) {
                                    _fnClick();
                                }

                                break;
                        }
                    });

                    var _scrollPosition = $mobileUtil.ScrollPosition();

                    if (_config.DisablePosition) {
                        _popupContainer.hide();
                        _popupContainer.css("top", $(window).scrollTop() + "px");
                    }
                    else if (_config.IsPositionOnOpen) {

                        //reposition the popup to center screen based on current size of the popup container
                        var _width = $(window).width();
                        var _height = $(window).height();
                        var _containerWidth = _popupContainer.width();
                        var _containerHeight = _popupContainer.height();

                        var _top = _scrollPosition.Top;

                        _top += $(window).height() * 0.10;

                        _popupContainer.css("top", _top + "px");
                        _popupContainer.css("left", Math.max((_width / 2.0) - (_containerWidth / 2.0), 0) + "px");
                    }
                    else if (_config.IsPositionAbsoluteCenter || _config.IsPositionTopCenter) {
                        var _width = $(window).width();
                        var _height = $(window).height();
                        var _containerWidth = _popupContainer.width();
                        var _containerHeight = _popupContainer.height();

                        var _top = 0;
                        var _left = 0;

                        _top = $(window).scrollTop();
                        _left = $(window).scrollLeft();

                        if (_config.IsPositionAbsoluteCenter) {
                            _top += (_height / 2.0) - (_containerHeight / 2.0);
                            _left += (_width / 2.0) - (_containerWidth / 2.0);
                        }
                        else if (_config.IsPositionTopCenter) {
                            _top += $(window).height() * 0.1;
                            _left += (_width / 2.0) - (_containerWidth / 2.0);
                        }

                        _popupContainer.css("top", _top + "px");
                        _popupContainer.css("left", _left + "px");
                    }

                    if (!util_isNullOrUndefined(_config.TargetElement)) {
                        var _targetElement = $(_config.TargetElement);

                        if (_targetElement.length == 1) {

                            var _top = util_forceInt(_targetElement.position().top, 0);
                            var _left = util_forceInt(_targetElement.position().left, 0);

                            _popupContainer.css("top", _top + "px");
                            _popupContainer.css("left", _left + "px");
                        }
                    }

                    if (options["OnBeforeShow"]) {
                        options.OnBeforeShow({ "Element": _popupContainer });
                    }

                    //configure background effects for required elements of the active page
                    if (popupType == enCPopupComponentType.Inline) {
                        $.each($mobileUtil.ActivePage(true).find("[data-attr-background-effect]"), function () {
                            var $this = $(this);

                            var _effectClass = util_forceString($this.attr("data-attr-background-effect"));

                            if (_effectClass != "") {
                                $this.addClass(_effectClass);
                            }
                        });
                    }

                    _popupContainer.slideDown(1000).promise().done(function () {
                        
                        if (_optionCallbackOpen) {
                            _optionCallbackOpen();
                        }
                    });
                };

                options["callbackClose"] = function () {

                    if (popupType == enCPopupComponentType.SimpleDialog) {
                        if (!util_isNullOrUndefined($.mobile) && !util_isNullOrUndefined($.mobile.sdCurrentDialog)) {

                            var _stateConfig = $.mobile.sdCurrentDialog["cStateConfig"];

                            if (util_isNullOrUndefined(_stateConfig)) {
                                _stateConfig = {};
                                $.mobile.sdCurrentDialog["cStateConfig"] = _stateConfig;
                            }

                            _stateConfig["IsCloseEvent"] = true;
                        }
                    }

                    //remove background effects for required elements of the active page
                    if (popupType == enCPopupComponentType.Inline) {

                        $.each($mobileUtil.ActivePage(true).find("[data-attr-background-effect]"), function () {
                            var $this = $(this);

                            var _effectClass = util_forceString($this.attr("data-attr-background-effect"));

                            if (_effectClass != "") {
                                $this.removeClass(_effectClass);
                            }
                        });
                    }

                    if (_optionCallbackClose) {
                        _optionCallbackClose();
                    }
                };

                var _popupHTML = "";

                if (_config.OverrideLayoutHTML != "") {
                    _popupHTML = _config.OverrideLayoutHTML;
                }
                else {
                    _popupHTML = util_forceString(options["CustomLayoutHeaderHTML"]) +
                                 ($mobileUtil.Configuration ? $mobileUtil.Configuration.Popup.LayoutHTML : "") +
                                 util_forceString(options["CustomLayoutFooterHTML"]);
                }

                if (util_forceString(_popupHTML, "") == "") {
                    _popupHTML = "%%CONTENT%%";
                }

                var _tokens = {};

                _tokens["%%HEADER_TITLE%%"] = (_config.ShowHeaderTitle ? util_htmlEncode(_config.HeaderTitle) : "");
                _tokens["%%CONTENT%%"] = util_forceString(options["blankContent"]);

                _popupHTML = util_replaceTokens(_popupHTML, _tokens);

                var _customAttrs = "";

                if (_config.HasIndicators || options["AttributesContainer"]) {
                    var _attrs = {};

                    if (_config.HasIndicators) {
                        _attrs = util_extend({
                            "data-popup-view-indicator": enCETriState.Yes,
                            "data-attr-view-indicator-is-transparent": enCETriState.Yes, "data-attr-view-indicator-is-fixed-position": enCETriState.Yes
                        }, _attrs);

                        _attrs = util_extend(_attrs, options["IndicatorAttributes"]);

                        _attrs[DATA_ATTRIBUTE_RENDER] = "view_indicator";
                    }

                    if (options["AttributesContainer"]) {

                        var _renderAttrVal = null;

                        if (options.AttributesContainer[DATA_ATTRIBUTE_RENDER]) {
                            _renderAttrVal = options.AttributesContainer[DATA_ATTRIBUTE_RENDER];
                            delete options.AttributesContainer[DATA_ATTRIBUTE_RENDER];
                        }

                        _attrs = util_extend(_attrs, options.AttributesContainer);

                        if (util_forceString(_renderAttrVal) != "") {
                            var _current = util_forceString(_attrs[DATA_ATTRIBUTE_RENDER]);

                            _renderAttrVal = (_current != "" ? _current + "|" : "") + _renderAttrVal;
                            _attrs[DATA_ATTRIBUTE_RENDER] = _renderAttrVal;
                        }
                    }

                    for (var _name in _attrs) {
                        _customAttrs += (_customAttrs != "" ? " " : "") + util_htmlAttribute(_name, _attrs[_name]);
                    }
                }

                options["blankContent"] = "<div class='PopupSimpleDialogContent' " + util_htmlAttribute("data-attr-popup-content-container", enCETriState.Yes) +
                                          (_customAttrs != "" ? " " + _customAttrs : "") + ">" +
                                          _popupHTML +
                                          "</div>";

                if (popupType == enCPopupComponentType.SimpleDialog) {
                    $("#divPopupSimpleDialogContainer").simpledialog2(options);
                }
                else {

                    var _popupRoot = $("#popupInlineContainer");

                    if (_popupRoot.length == 1) {
                        _popupRoot.remove();
                    }

                    _popupRoot = $("<div id='popupInlineContainer' class='PopupInlineContainer' />");

                    $mobileUtil.ActivePage().append(_popupRoot);

                    if (_config.IsMinimalView) {
                        _popupRoot.addClass("PopupMinimalContentView");
                    }

                    if (_config.PopupCssClass != "") {
                        _popupRoot.addClass(_config.PopupCssClass);
                    }

                    _popupRoot.html(util_forceString(options["blankContent"]));

                    _popupRoot.off("events.popup_toggleIndicator");
                    _popupRoot.on("events.popup_toggleIndicator", function (e, args) {
                        var $element = _popupRoot.children(".PopupSimpleDialogContent[data-popup-view-indicator]");

                        $element.trigger("events.viewIndicator_toggle", args);
                    });

                    _popupRoot.off("events.popup_onPopupFocusOpen");
                    _popupRoot.on("events.popup_onPopupFocusOpen", function () {
                        var _overlayOptions = { "IsResponsive": _config.DisablePosition };

                        if (_config.IsDismissClickOverlay) {
                            _overlayOptions["OnOverlayClick"] = function () {
                                $mobileUtil.PopupClose();
                            };
                        }

                        $mobileUtil.ToggleOverlay(true, _overlayOptions);

                        //configure background effects for required elements of the active page
                        if (popupType == enCPopupComponentType.Inline) {
                            $.each($mobileUtil.ActivePage(true).find("[data-attr-background-effect]"), function () {
                                var $this = $(this);

                                var _effectClass = util_forceString($this.attr("data-attr-background-effect"));

                                if (_effectClass != "") {
                                    $this.addClass(_effectClass);
                                }
                            });
                        }

                    }); //end: events.popup_onPopupFocusOpen

                    if ($mobileUtil.Configuration.Notification.Type == enCNotificationComponentType.Inline) {
                        _popupRoot.find(".PopupErrorContainer").addClass("MessageContainerFixed");
                    }

                    if (options["CallbackOnPreEnhanceElement"]) {
                        options.CallbackOnPreEnhanceElement.call(_popupRoot);
                    }

                    $mobileUtil.refresh(_popupRoot);

                    //trigger open callback
                    var _fnCallback = options["callbackOpen"];

                    if (!util_isNullOrUndefined(_fnCallback)) {
                        _fnCallback();
                    }

                    //configure close callback (i.e. on remove event of element)
                    _popupRoot.bind("remove", function () {

                        $(this).addClass("PopupDismissedContainer");

                        var _fnCallbackClose = options["callbackClose"];

                        if (!util_isNullOrUndefined(_fnCallbackClose)) {
                            _fnCallbackClose();
                        }
                    });
                }

                break;

            default:
                $mobileUtil.PopupContainer().popup("open", options);
                break;
        }
    },

    PopupClose: function (objPopupView, isContextRemove) {
        var _popupContainer = null;
        var _popupType = $mobileUtil.Configuration.Popup.DefaultPopupComponentType;

        isContextRemove = util_forceBool(isContextRemove, false);

        if (!util_isNullOrUndefined(objPopupView)) {
            _popupContainer = $(objPopupView);
        }
        else {
            _popupContainer = $mobileUtil.PopupContainer();
        }

        _popupType = $mobileUtil.PopupComponentType(_popupContainer);

        switch (_popupType) {

            case enCPopupComponentType.SimpleDialog:
                $.mobile.sdCurrentDialog.close();
                break;

            case enCPopupComponentType.Default:
                var _fnClosePopup = function () {
                    _popupContainer.popup("close");
                };

                _popupContainer.attr("data-attr-popup-is-close-trigger", enCETriState.Yes);

                if (isContextRemove && _popupContainer.find("iframe").length > 0) {
                    var _intervalID = null;

                    _fnClosePopup();

                    //HACK: popups with iframes (depending on the content of the source URL) at times cause the popup close event to not be fired properly. 
                    //      The following is required to check whether the popup is still open and force close of it.
                    _intervalID = setInterval(function () {
                        if ($mobileUtil.PopupIsOpen(_popupContainer)) {
                            _fnClosePopup();
                        }
                        else {
                            clearInterval(_intervalID);
                        }
                    }, 1000);
                }
                else {
                    _fnClosePopup();
                }

                break;

            case enCPopupComponentType.Inline:

                var _fnOnDismissRequested = _popupContainer.data("onDismissRequested");
                var _fnClose = function () {

                    var _onDismissDialog = _popupContainer.data("onDismissDialog");

                    _popupContainer.slideUp(1000).promise().done(function () {

                        var _hasEvent = (_onDismissDialog && util_isFunction(_onDismissDialog));
                        var $clone = null;
                        var _isRemovePopupOverlay = util_forceBool(_popupContainer.data("popup-is-cleanup-remove-overlay"), true);

                        if (_hasEvent) {
                            $clone = _popupContainer.clone(true);   //clone the element with the data
                        }

                        _popupContainer.remove();

                        if (_isRemovePopupOverlay) {
                            $mobileUtil.ToggleOverlay(false);
                        }

                        if (_onDismissDialog && util_isFunction(_onDismissDialog)) {
                            _onDismissDialog.call(this, { "RemovedElement": $clone });
                        }
                    });
                };

                if (_fnOnDismissRequested) {

                    _fnOnDismissRequested(function (isDismiss) {
                        isDismiss = util_forceBool(isDismiss, true);

                        if (isDismiss) {
                            _fnClose();
                        }
                    });
                }
                else {
                    _fnClose();
                }

                break;
        }
    },

    PopupIsOpen: function (objPopupView) {
        var _ret = false;
        var _element = (util_isNullOrUndefined(objPopupView) ? $mobileUtil.PopupContainer() : $(objPopupView));
        var _popupType = $mobileUtil.PopupComponentType(_element);

        switch (_popupType) {
            case enCPopupComponentType.SimpleDialog:
                _ret = !(util_isNullOrUndefined($.mobile.sdCurrentDialog));
                break;

            case enCPopupComponentType.Inline:
                _ret = (_element.length > 0 && !_element.hasClass("PopupDismissedContainer"));
                break;

            default:
                var _parent = $(_element.parent());

                if (_parent.hasClass("ui-popup-active")) {
                    _ret = true;
                }

                break;
        }

        return _ret;
    },

    PopupComponentType: function (container) {
        var _ret = null;

        if (util_isNullOrUndefined(container)) {
            container = $mobileUtil.PopupContainer();
        }

        if (!util_isNullOrUndefined(container)) {
            if (container.hasClass("ui-simpledialog-container")) {
                _ret = enCPopupComponentType.SimpleDialog;
            }
            else if (container.attr("id") == "popupInlineContainer") {
                _ret = enCPopupComponentType.Inline;
            }
            else {
                _ret = enCPopupComponentType.Default;
            }
        }

        return _ret;
    },

    PopupConfigure: function (element, attrContentID, attrOpenCallbackJS, isForceAbsolute, attrPositionX, attrPositionY, attrCloseCallbackJS) {
        var _element = $(element);

        isForceAbsolute = util_forceValidEnum(isForceAbsolute, enCETriState, enCETriState.None);

        _element.attr(DATA_ATTRIBUTE_RENDER, "popup");
        _element.attr(DATA_ATTR_POPUP_CONTENT, util_forceString(attrContentID));
        _element.attr(DATA_ATTR_POPUP_EVENT_CALLBACK_OPEN, util_jsEncode(attrOpenCallbackJS));
        if (!util_isNullOrUndefined(attrCloseCallbackJS))
            _element.attr(DATA_ATTR_POPUP_EVENT_CALLBACK_CLOSE, util_jsEncode(attrCloseCallbackJS));

        _element.attr(DATA_ATTR_POPUP_POSITION_FORCE_ABSOLUTE, isForceAbsolute);
        _element.attr(DATA_ATTR_POPUP_POSITION_X, util_forceString(attrPositionX));
        _element.attr(DATA_ATTR_POPUP_POSITION_Y, util_forceString(attrPositionY));

        return _element;
    },

    //returns the state and invoking properties for the current instance of the popup
    PopupInstanceSetting: function () {
        var _ret = { IsOpen: false, SourceID: "", Container: null, GetLinks: null };
        var _container = $mobileUtil.PopupContainer();

        _ret.IsOpen = $mobileUtil.PopupIsOpen();
        _ret.Container = $mobileUtil.PopupContainer();
        _ret.SourceID = util_forceString(_ret.Container.attr(DATA_ATTR_POPUP_SOURCE_ELEMENT), "");
        _ret.GetLinks = function () {
            var _list = $mobileUtil.PopupContainer().find("a[" + CONTROL_DATA_ATTR_POPUP_LINKS_ITEM_ID + "]");

            return _list.not("[" + DATA_ATTRIBUTE_RENDER + "=dialog]");
        };

        return _ret;
    },

    DashboardContainer: function () {
        var _ret = $("#pnlDashboard");

        if (_ret.length == 0) {
            $("body").first().append("<div id='pnlDashboard' class='DashboardContainer' />");

            _ret = $("#pnlDashboard");
            _ret.hide();    //default hide the dashboard
        }

        return _ret;
    },

    DashboardOpen: function (options, callback, list, isAnimate) {

        options = util_extend({ "duration": 1000, "HTML": "", "ToggleOverlay": true, "DashboardCloseCallback": null }, options);

        isAnimate = util_forceBool(isAnimate, true);

        var _container = $mobileUtil.DashboardContainer();
        var _factor = util_forceFloat(options["factor"], -1);
        var _cssClass = util_forceString(options["cssClass"], "DashboardDefaultTheme");
        var _toggleOverlay = util_forceBool(options["ToggleOverlay"], true);

        var _callback = function () {

            $("body").addClass("DashboardViewOpen");

            if (_toggleOverlay) {

                var _fnOnOverlayClick = function () {
                    if ($mobileUtil.DashboardIsOpen()) {
                        $mobileUtil.DashboardClose(options, null, list);
                    }
                };

                $mobileUtil.ToggleOverlay(true, { "OnOverlayClick": _fnOnOverlayClick });
            }

            _container.unbind("refresh.dashboard_event_close");
            _container.bind("refresh.dashboard_event_close", function () {

                if (options["DashboardCloseCallback"]) {
                    options.DashboardCloseCallback();
                }

                _container.unbind("refresh.dashboard_event_close");
            });

            if (callback) {
                callback();
            }
        };

        if (_factor < 0) {
            _factor = 0.24;
        }

        if (_cssClass != "") {
            _container.addClass(_cssClass);
            _container.attr("data-attr-css-class", _cssClass);
        }

        if (!util_isNullOrUndefined(list)) {
            list = $(list);
            list.addClass("DashboardToggleElement");
        }

        _container.css("top", "");
        _container.css("left", "");
        _container.css("bottom", "");
        _container.css("right", "");

        var _anchor = util_forceString(options["anchor"]);

        switch (_anchor) {
            case "left":
                _container.css("left", "0px");
                _container.css("top", "0px");
                break;

            case "top":
                _container.css("left", "0px");
                _container.css("top", "0px");
                break;

            case "bottom":
                _container.css("left", "0px");
                _container.css("bottom", "0px");
                break;

            default:
                _container.css("right", "0px");
                _container.css("top", "0px");
                break;
        }

        if (_anchor == "left" || _anchor == "right") {

            if (_factor > 0) {
                _container.width(Math.max($(window).width() * _factor, 1024 * _factor));
            }
            else {
                _container.css("width", "");
            }

            _container.css("height", "100%");
        }
        else {
            if (_factor > 0) {
                _container.height(Math.max($(window).height() * _factor, 1024 * _factor));
            }
            else {
                _container.css("width", "");
            }

            _container.width($(window).width());
            _container.css("height", "auto");
        }

        //show the default load HTML
        var _content = util_forceString(options["HTML"], "");

        if (_content == "") {
            _content = util_forceString($mobileUtil.Configuration.Dashboard.LoadingIndicatorHTML);
        }

        _container.html(_content);
        $mobileUtil.refresh(_container);

        if (isAnimate) {
            var _duration = Math.max(util_forceInt(options["duration"], 0), 0);
            var _animation = util_forceString(options["animation"]);

            _container.attr("data-cattr-dashboard-ctx-option-animation", _animation)
                      .attr("data-cattr-dashboard-ctx-option-anchor", _anchor);

            switch (_animation) {
                case "slide":
                    var _animatePropOptions = {};
                    var _containerWidth = _container.width();
                    var _positionPropertyVal = null;

                    if (_anchor == "left") {
                        _positionPropertyVal = "left";
                    }
                    else if (_anchor == "right") {
                        _positionPropertyVal = "right";
                    }
                    else if (_anchor == "top") {
                        _positionPropertyVal = "top";
                    }
                    else if (_anchor == "bottom") {
                        _positionPropertyVal = "bottom";
                    }

                    if (_positionPropertyVal != null) {
                        _animatePropOptions[_positionPropertyVal] = "0px";
                        _container.css(_positionPropertyVal, (_containerWidth * -1) + "px");
                    }

                    _container.show();

                    _container.animate(_animatePropOptions, _duration, function () {
                        _callback();
                    });
                    break;

                default:
                    _container.fadeIn(_duration, function () {
                        _callback();
                    });
                    break;
            }
        }
        else {
            _container.show();
            _callback();
        }
    },

    DashboardClose: function (options, callback, list, isAnimate) {
        var _container = $mobileUtil.DashboardContainer();

        var _callback = function () {

            if (!util_isNullOrUndefined(list)) {
                list = $(list);
            }
            else {
                list = $mobileUtil.Find(".DashboardToggleElement");
            }

            list.removeClass("DashboardToggleElement");

            var _cssClass = util_forceString(_container.attr("data-attr-css-class"));

            if (_cssClass != "") {
                _container.removeClass(_cssClass);
            }

            $mobileUtil.ToggleOverlay(false, { "Animate": false });
            $("body").removeClass("DashboardViewOpen");

            _container.trigger("refresh.dashboard_event_close");

            _container.removeClass("DashboardEventOnClose");

            if (callback) {
                callback();
            }
        };

        isAnimate = util_forceBool(isAnimate, true);
        options = util_extend({ "duration": 1000, "animation": "", "ForceContextSettings": false }, options);

        if (util_forceBool(options["ForceContextSettings"], false)) {

            var _props = { "animation": "data-cattr-dashboard-ctx-option-animation", "anchor": "data-cattr-dashboard-ctx-option-anchor" };

            for (var _name in _props) {
                options[_name] = util_forceString(_container.attr(_props[_name]), options[_name]);
            }
        }

        _container.addClass("DashboardEventOnClose");

        if (isAnimate) {
            var _anchor = util_forceString(options["anchor"]);

            var _duration = Math.max(util_forceInt(options["duration"], 0), 0);
            var _animation = util_forceString(options["animation"]);

            switch (_animation) {

                case "slide":

                    var _animatePropOptions = {};
                    var _containerWidth = _container.width();
                    var _positionPropertyVal = null;

                    if (_anchor == "left") {
                        _positionPropertyVal = "left";
                    }
                    else if (_anchor == "right") {
                        _positionPropertyVal = "right";
                    }
                    else if (_anchor == "top") {
                        _positionPropertyVal = "top";
                    }
                    else if (_anchor == "bottom") {
                        _positionPropertyVal = "bottom";
                    }

                    if (_positionPropertyVal != null) {
                        _animatePropOptions[_positionPropertyVal] = (_containerWidth * -1) + "px";
                    }

                    _container.animate(_animatePropOptions, _duration, function () {
                        _container.hide();  //hide the dashboard container following animation
                        _callback();
                    });

                    break;

                default:
                    _container.fadeOut(_duration, function () {
                        _callback();
                    });

                    break;
            }
        }
        else {
            _container.hide();
            _callback();
        }
    },

    DashboardIsOpen: function () {
        return $mobileUtil.DashboardContainer().is(":visible");
    },

    RenderRefresh: function (context, isElementRefresh, setRefreshAttribute, disableCreate, options) {
        options = util_extend({ "ExcludeDescendentRendererList": null }, options);

        isElementRefresh = util_forceBool(isElementRefresh, false);
        setRefreshAttribute = util_forceBool(setRefreshAttribute, false);
        disableCreate = util_forceBool(disableCreate, false);

        var _attrRender = null;
        var _context = context;

        if (isElementRefresh && context != null) {
            _context = $(context);
            _attrRender = _context.attr(DATA_ATTRIBUTE_RENDER); //retrieve the data render type for the element

            _context = _context.parent();   //must invoke on the parent of the current element
        }

        if (setRefreshAttribute) {
            if (isElementRefresh && !disableCreate) {
                _context.attr(DATA_ATTRIBUTE_RENDER_REFRESH, enCETriState.Yes);
            }
            else {
                _context.children("[" + DATA_ATTRIBUTE_RENDER + "]").attr(DATA_ATTRIBUTE_RENDER_REFRESH, enCETriState.Yes);
            }
        }

        var _tempExcludeList = null;

        if (options["ExcludeDescendentRendererList"] && options.ExcludeDescendentRendererList.length > 0) {
            var _excludeSelector = "";
            var _arr = options.ExcludeDescendentRendererList;

            for (var i = 0; i < _arr.length; i++) {
                _excludeSelector += (i > 0 ? ", " : "");
                _excludeSelector += "[" + util_renderAttribute(_arr[i]) + "]";
            }

            _tempExcludeList = _context.find(_excludeSelector);

            $.each(_tempExcludeList, function (indx) {
                var _excludeRendererElement = $(this);

                _excludeRendererElement.attr("temp-disable-" + DATA_ATTRIBUTE_RENDER, _excludeRendererElement.attr(DATA_ATTRIBUTE_RENDER));
            });

            _tempExcludeList.removeAttr(DATA_ATTRIBUTE_RENDER);
        }

        renderer_apply(_context, _attrRender, disableCreate);

        if (_tempExcludeList) {
            $.each(_tempExcludeList, function (indx) {
                var _excludeRendererElement = $(this);

                _excludeRendererElement.attr(DATA_ATTRIBUTE_RENDER, _excludeRendererElement.attr("temp-disable-" + DATA_ATTRIBUTE_RENDER));
                _excludeRendererElement.removeAttr("temp-disable-" + DATA_ATTRIBUTE_RENDER);
            });
        }
    },

    WidgetCreate: function (obj) {
        var _element = $(obj);

        try {
            _element.trigger("create");
        } catch (e) {
        }
    },

    WidgetRefresh: function (obj, dataRole) {
        var _element = $(obj);

        try {

            //obtain the data role to be refreshed (either from the parameter specified or from data attribute of element)
            var _dataRole = util_forceString(dataRole, _element.attr("data-role"));

            if (_dataRole && _dataRole != "none" && _dataRole != "page" && _dataRole != "dialog") {
                _element[_dataRole]("refresh");
            }
        } catch (e) {
            util_log("Error for element dynamic refresh [data-role: " + _element.attr("data-role") + "]: " + e);
        }
    },

    refresh: function (obj, isElementGlobalCreate, disableRendererRefresh) {
        if (isElementGlobalCreate == null || isElementGlobalCreate == undefined) {
            isElementGlobalCreate = false;
        }

        disableRendererRefresh = util_forceBool(disableRendererRefresh, false);

        var _context = null;

        var _fnInitRenderer = function (containerContext) {
            if (!disableRendererRefresh) {
                $mobileUtil.RenderRefresh(containerContext);
            }
        };

        if (obj == null || obj == undefined) {
            _context = $("body");

            _context.trigger("create");
            $mobileUtil.InitDialog(_context);

            _fnInitRenderer(_context);
        }
        else {
            var _element = $(obj);

            if (isElementGlobalCreate) {
                _element.trigger("create");
            }
            else {
                $mobileUtil.WidgetRefresh(_element);
            }

            $mobileUtil.InitDialog(_element);
            _fnInitRenderer(_element);
        }

        if ($mobileUtil.Configuration && $mobileUtil.Configuration.ToggleActivePageContentResize && !$mobileUtil.IsActiveDialogPage()) {
            var _minHeight = util_forceInt($(window).height()) - util_forceInt($mobileUtil.Header().height()) - util_forceInt($mobileUtil.Footer().height()) -
                             util_forceInt($mobileUtil.Configuration.ContentResizeHeightOffset, 0);

            $mobileUtil.Content().css("min-height", _minHeight + "px");

            if ($mobileUtil.Configuration.ToggleToolbarResize) {
                $mobileUtil.ResizeToolbarViews();
            }
        }
    },

    ResizeToolbarViews: function (isClearStyle) {
        var _contentWidth = 0;

        if (!$mobileUtil.IsActiveDialogPage()) {

            isClearStyle = util_forceBool(isClearStyle, false);

            var _rootModuleBody = $("#rootModuleBody");

            if (isClearStyle) {
                _rootModuleBody.css("width", "");
            }
            else {
                if (util_isFunction("private_getResizeContentWidth")) {
                    var _fn = eval("private_getResizeContentWidth");

                    _contentWidth = _fn();
                }

                _contentWidth = util_forceInt(_contentWidth, 0);

                if (_contentWidth <= 0) {
                    _contentWidth = $mobileUtil.Content().width();
                }

                _contentWidth = Math.max(_contentWidth, $(window).width()); //force at least browser window width
                _contentWidth = Math.max(_contentWidth, 1024);  //force at least 1024px

                _contentWidth -= 1;

                _rootModuleBody.css("width", _contentWidth + "px");
            }
        }
    },

    ToggleViewState: function (context, isEnabled, isApplyFilter) {
        context = global_forceContext(context, true);
        isEnabled = util_forceBool(isEnabled, true);
        isApplyFilter = util_forceBool(isApplyFilter, false);

        var _search = $(context);
        var _selector = "input, select, textarea";
        var _list = [];

        if (isApplyFilter) {
            _list = context.filter(_selector);
        }
        else {
            _list = context.find(_selector);
        }

        if (isEnabled) {
            _list.removeAttr("disabled");
        }
        else {
            _list.attr("disabled", "disabled");
        }

        $mobileUtil.ActivePage().page();    //force the changes to be applied for the toggle state
    },

    HtmlDialogLink: function (linkContentHTML, href, title, dialogMode, cssClass, strAttr, toggleDefaultAttributes, extRenderer) {
        var _ret = "";

        title = util_forceString(title, MSG_CONFIG.DialogDefaultTitle);
        dialogMode = util_forceValidEnum(dialogMode, enCDialogMode, enCDialogMode.Normal);
        strAttr = util_forceString(strAttr);
        extRenderer = util_forceString(extRenderer);
        toggleDefaultAttributes = util_forceBool(toggleDefaultAttributes, true);

        strAttr = (strAttr != "" ? " " + strAttr + " " : "");
        extRenderer = (extRenderer != "" ? " " + DATA_ATTRIBUTE_RENDER_EXT + "='" + extRenderer + "' " : "");

        _ret += "<a class='" + util_forceString(cssClass) + "' " + DATA_ATTRIBUTE_RENDER + "='dialog' data-attr-dialog-title='" + util_jsEncode(title) + "' " +
                DATA_ATTRIBUTE_CONTEXT_HREF + "=\"" + href + "\" " +
                DATA_ATTRIBUTE_DIALOG_MODE + "=\"" + dialogMode + "\" " +
                "href='#' data-rel='dialog' " +
                (toggleDefaultAttributes ? "data-role='button' data-inline='true' data-mini='true' data-icon='gear'" : "") + strAttr +
                extRenderer + ">" + linkContentHTML +
                "</a>";

        return _ret;
    },

    HtmlDynamicLink: function (options) {
        var _ret = "";

        if (options == null || options == undefined) {
            options = { Content: "", IsHTML: false, Href: "", IsPopup: false, PopupSetting: {}, AttributeStr: null };
        }

        var _content = util_forceString(options["Content"], "");
        var _isHTML = util_forceBool(options["IsHTML"], false);
        var _href = util_forceString(options["Href"], "javascript: void(0);");
        var _attributes = util_forceString(options["AttributeStr"], "");

        if (util_forceBool(options["IsPopup"], false)) {

            _ret = $mobileUtil.HtmlDialogLink(_isHTML ? util_htmlEncode(_content) : _content, _href, options.PopupSetting["Title"],
                                              options.PopupSetting["DialogMode"], options.PopupSetting["CssClass"], _attributes,
                                              util_forceBool(options.PopupSetting["ToggleDefaultAttribute"], true));
        }
        else {
            _ret = "<a " + util_htmlAttribute("href", _href) + (_attributes != "" ? " " + _attributes : "") + ">" + (_isHTML ? _content : util_htmlEncode(_content)) + "</a>";
        }

        return _ret;
    },

    SetDisabledElement: function (obj, isDisabled) {
        var _obj = $(obj);

        isDisabled = util_forceBool(isDisabled, true);

        if (isDisabled) {
            _obj.attr("disabled", "disabled");
            _obj.addClass("ElementDisabled");
        }
        else {
            _obj.removeAttr("disabled");
            _obj.removeClass("ElementDisabled");
        }
    },

    IsDisabledElement: function (obj) {
        var _obj = $(obj);

        return _obj.attr("disabled") == "disabled" || _obj.hasClass("ElementDisabled");
    },

    IsElementOnlineRequired: function (obj) {
        return $(obj).hasClass("ButtonOnlineState");
    },

    ReloadActivePage: function (callback, isRestoreBreadcrumb) {
        isRestoreBreadcrumb = util_forceBool(isRestoreBreadcrumb, false);

        if (callback) {

            ClearMessages();    //clear the messages

            //set data attribute to preserve messages for page refresh (particular to the service method calls) in consideration of an active callback configured
            $mobileUtil.ActivePage().attr(DATA_ATTR_PAGE_MESSAGE_PRESERVE, enCETriState.Yes);
        }

        if (isRestoreBreadcrumb) {
            MODULE_MANAGER.Current.RestoreBreadcrumb(); //restore the breadcrumb state
        }
        else {
            module_load(null, null, null, null, callback);  //reload the current module view
        }
    },

    PageUnload: function () {

        $mobileUtil.Content().trigger("events.controller_contentUnload");

        if ($mobileUtil.ActivePage().attr("id") == $mobileUtil.StandardActivePage().attr("id")) {
            $mobileUtil.Content().html("");
        }

        MODULE_MANAGER.DelegateSettings.ExecEvent(enCDelegateType.PageUnload);  //trigger the delegate event to indicate the current page is to be unloaded
    },

    PageLoadComplete: function () {

        //trigger the delegate event to indicate the page is finished loading
        MODULE_MANAGER.DelegateSettings.ExecEvent(enCDelegateType.PageLoaded, null, null, true);  //persisted/static delegates
        MODULE_MANAGER.DelegateSettings.ExecEvent(enCDelegateType.PageLoaded);
    },

    ReloadBrowserWindow: function (toURL, delayType) {
        delayType = util_forceValidEnum(delayType, enCDelayType, enCDelayType.Normal);

        var _delay = null;

        switch (delayType) {
            case enCDelayType.Slow:
                _delay = 1200;
                break;

            case enCDelayType.Normal:
                _delay = 725;
                break;

            default:
                _delay = 0;
                break;
        }

        toURL = util_forceString(toURL);

        setTimeout(function () {

            if (toURL == "") {

                //Note: at this point the module manager may not be configured for the actual active page view/module.
                //      As such, the active page must first be reloaded then the browser window refresh is achieved via callback parameter specified.
                //AVK TODO: fix the above issue and avoid reloading the active (module load and set current related issue)
                $mobileUtil.ReloadActivePage(function () {

                    //no URL is specified so reload current window page location depending on current module's view state
                    var _viewStateURL = util_forceString(MODULE_MANAGER.Navigation.GetCurrentStateQS());

                    if (_viewStateURL != "") {
                        window.location.href = util_resolveAbsoluteURL(_viewStateURL);
                        window.location.reload();
                    }
                    else {
                        window.location.reload();
                    }
                });
            }
            else {

                //set the window location to the new URL and reload the browser window
                window.location.href = util_resolveAbsoluteURL(toURL);

                if (util_forceString(window.location.href).indexOf("#") >= 0) {
                    window.location.reload();
                }
            }
        }, _delay);
    },

    ToggleOverlay: function (isVisible, options) {

        var _element = $("#divPageOverlay");
        var _activePage = $mobileUtil.ActivePage();

        if (util_isNullOrUndefined(isVisible)) {
            isVisible = !_element.is(":visible");
        }

        options = util_extend({ "OnOverlayClick": null, "Animate": true, "IsResponsive": false }, options);

        var _animate = util_forceBool(options["Animate"], true);
        var _fnOnOverlayClick = options["OnOverlayClick"];

        _element.unbind("click.overlay");

        _element.finish();

        if (_fnOnOverlayClick) {
            _element.bind("click.overlay", _fnOnOverlayClick);
        }

        if (isVisible) {

            if (options.IsResponsive) {
                _element.css("width", "100%");
                _element.css("height", "100%");
            }
            else {
                _element.width(Math.max($(window).width(), _activePage.width()));
                _element.height(Math.max($(window).height(), _activePage.height()));
            }

            if (_animate) {
                _element.fadeIn();
            }
            else {
                _element.show();
            }
        }
        else {
            if (_animate) {
                _element.fadeOut();
            }
            else {
                _element.hide();
            }
        }
    },

    ConfigureDialogStateURL: function () {
        var _href = window.location.href;

        if (_href.indexOf("&ui-state=dialog") >= 0) {
            _href = util_replaceAll(_href, "&ui-state=dialog", "");

            window.location.href = _href;
        }
    },

    AnimateSmoothScroll: function (objTarget, duration, position, callback) {
        var _animateOptions = { scrollTop: 0, scrollLeft: 0 };

        duration = util_forceInt(duration, -1);

        if (duration < 0) {
            duration = 1000;
        }

        if (util_isNullOrUndefined(position)) {
            var _target = $(objTarget);

            if (_target.length > 0) {
                _animateOptions.scrollTop = _target.offset().top;
                _animateOptions.scrollLeft = _target.offset().left;
            }
        }
        else {
            _animateOptions.scrollTop = Math.max(util_forceInt(position["Top"], _animateOptions.scrollTop), _animateOptions.scrollTop);
            _animateOptions.scrollLeft = Math.max(util_forceInt(position["Left"], _animateOptions.scrollLeft), _animateOptions.scrollLeft);
        }

        $("html,body").animate(_animateOptions, duration)
                      .promise()
                      .done(function () {
                          if (callback) {
                              callback();
                          }
                      });
    },

    ScrollPosition: function () {
        var _ret = { Top: 0, Left: 0 };
        var _root = $(document);

        _ret.Top = util_forceInt(_root.scrollTop());
        _ret.Left = util_forceInt(_root.scrollLeft());

        return _ret;
    },

    NotificationManager: {

        OnShow: function (options) {

            options = util_extend({ "Type": "", "Title": "", "Message": "", "IsHTML": false, "Buttons": [], "OnButtonClick": null, "CssClass": "", "IsError": false }, options);

            var _type = options.Type;
            var $container = $(".NotificationContainer");

            var _fnGetPropHTML = function (val) {

                if (options.IsHTML != true) {
                    val = util_htmlEncode(val, true);
                }

                return val;

            };  //end: _fnGetPropHTML

            if ($container.length == 0) {
                $container = $("<div class='DisableUserSelectable NotificationContainer' />");
                $container.hide();

                $("body").append($container);
            }

            var _html = "<div class='NotificationContent'>" +
                        "   <div class='NotificationContentTitle' />" +
                        "   <div class='NotificationContentMessage' />" +
                        "   <div class='NotificationContentButtons' />" +
                        "</div>";

            $container.hide();
            $container.html(_html);

            var $content = $container.children(".NotificationContent");

            $content.hide();

            var _contentCssClass = "";

            switch (_type) {

                case "alert":
                    _contentCssClass = "NotificationAlert";

                    if (options.IsError == true) {
                        _contentCssClass += " NotificationError";
                    }

                    break;

                case "confirm":
                    _contentCssClass = "NotificationConfirm";
                    break;

                default:
                    _contentCssClass = "NotificationGeneral";
                    break;
            }

            options.CssClass = util_forceString(options.CssClass, "");

            _contentCssClass += (options.CssClass != "" ? " " + options.CssClass : "");

            $content.addClass(_contentCssClass);

            $content.find(".NotificationContentTitle").html(_fnGetPropHTML(options.Title));
            $content.find(".NotificationContentMessage").html(_fnGetPropHTML(options.Message));

            var _btnHTML = "";
            var _arrButtons = (options.Buttons || []);

            if (_arrButtons.length == 0 && _type == "alert") {
                _arrButtons = [{ "ID": "dismiss", "Text": "Close" }];
            }

            for (var b = 0; b < _arrButtons.length; b++) {
                var _btnOption = _arrButtons[b];

                _btnHTML += "<div class='NotificationButton' " + util_htmlAttribute("data-attr-notification-btn-id", _btnOption.ID) + ">" +
                            util_htmlEncode(_btnOption.Text) +
                            "</div>";
            }

            var $btnContainer = $content.find(".NotificationContentButtons");

            $btnContainer.html(_btnHTML).trigger("create");
            $btnContainer.data("is-busy", false);

            var _callbackButtonClick = options.OnButtonClick;

            $btnContainer.off("click.notification_button");
            $btnContainer.on("click.notification_button", "[data-attr-notification-btn-id]", function () {

                if ($btnContainer.data("is-busy") === true) {
                    return;
                }

                $btnContainer.data("is-busy", true);

                var _id = $(this).attr("data-attr-notification-btn-id");

                $content.toggle("height", function () {
                    $container.hide();

                    if (_callbackButtonClick) {
                        _callbackButtonClick(_id);
                    }
                });

            });

            $container.show();
            $content.toggle("height");

        }   //end: OnShow - notification

    },   //end: NotificationManager

    ErrorHandler: {
        Init: function () {

            window.onerror = function (msg, url, line, col, error) {

                var _str = msg.toLowerCase();
                var _search = "script error";

                if (_str.indexOf(_search) > -1) {
                    msg += " (Debugger is active; please see Console for details)";
                }

                var _extra = (!col ? '' : '\ncolumn: ' + col);

                _extra += (!error ? '' : '\nerror: ' + error);

                //display the error to the user browser window if it is in debug mode (otherwise will be suppressed and silently logged)
                if ("<IS_DEBUG>" == enCETriState.Yes) {
                    var _msg = $("<div style='position: fixed; bottom: 0px; left: 0px; background: #333333; color: #FFFFFF; width: 100%; text-shadow: none;' />");

                    _msg.css({ "border-top": "2px solid #FF0000", "padding": "0.25em" });

                    _msg.html("<p></p><p></p>");

                    _msg.children("p:first").text("ERROR: " + msg);
                    _msg.children("p:last").text("URL: " + url + " || LINE: " + line + " " + _extra);

                    _msg.click(function () {
                        _msg.unbind("click");

                        _msg.slideUp("normal", function () {
                            _msg.remove();
                        });
                    });

                    $("body").append(_msg);
                }

                _extra += "\nBROWSER ROOT URL: " + window.location.href;

                GlobalService.DebugClientSideException(msg, url, "LINE: " + line + " " + _extra, function () {

                    //execute the user logged in check to force application and project cache version validation (in the event the error is caused by older version of site)
                    ext_processExecUserLoggedIn();
                });

                return false;
            };

        }
    },

    ControllerInstanceIntegratedLogin: function () {

        var _ret = {
            "IsEnabled": ("<IS_INTEGRATED_LOGIN>" == enCETriState.Yes),

            "Validate": function (options) {
                var _instance = this;

                var _callback = function () {

                    if (_instance.IsEnabled) {
                        //TODO: clear the cookie?
                    }

                    if (options.Callback) {
                        options.Callback();
                    }
                };

                options = util_extend({ "Callback": null, "OnRegisterUser": null }, options);

                if (_instance.IsEnabled) {

                    GlobalService.IntegratedLoginAuthAction(null, function (data) {

                        if (data) {
                            var _action = util_parse(data);

                            if (_action) {

                                switch (_action[enColCLoginActionResultProperty.ResultType]) {

                                    case enCLoginActionResultType.AccountLocked:

                                        var _msgHTML = "";

                                        _msgHTML += "<div>" +
                                                    util_htmlEncode("The account is locked and currently not able to access the tool.") + "<br /><br />" +
                                                    util_htmlEncode("Please contact the Administrator if this is a mistake or any further questions.") +
                                                    "</div>";

                                        util_alert(_msgHTML, "User Login - Acount Locked", _callback, true);

                                        break;

                                    case enCLoginActionResultType.RegisteredPendingApproval:

                                        var _msgHTML = "";

                                        _msgHTML += "<div>" +
                                                    util_htmlEncode("The account is locked and currently pending review by the Administrator.") + "<br /><br />" +
                                                    util_htmlEncode("Following the verification of the registration request, you will receive " +
                                                                    "an e-mail indicating your access to the tool.") +
                                                    "</div>";

                                        util_alert(_msgHTML, "User Login - Pending Approval", _callback, true);

                                        break;

                                    case enCLoginActionResultType.NewUser:

                                        if (options.OnRegisterUser) {
                                            options.OnRegisterUser({ "Item": _action, "Callback": _callback });
                                        }
                                        else {
                                            util_logError("Validate :: integrated login user login action not handled - new user registration");
                                            _callback();
                                        }

                                        break;

                                    default:
                                        _callback();
                                        break;
                                }
                            }
                            else {
                                _callback();
                            }
                        }
                        else {
                            _callback();
                        }
                    }, _callback);
                }
                else {
                    _callback();
                }
            }
        };

        return _ret;

    },

    GetWindowDimensions: function () {

        var _ret = { "Width": 0, "Height": 0 };

        if (typeof (window.innerWidth) == 'number') {
            _ret.Width = window.innerWidth;
        }
        else {
            if (document.documentElement && document.documentElement.clientWidth) {
                _ret.Width = document.documentElement.clientWidth;
            }
            else {
                if (document.body && document.body.clientWidth) {
                    _ret.Width = document.body.clientWidth;
                }
            }
        }

        if (typeof (window.innerHeight) == 'number') {
            _ret.Height = window.innerHeight;
        }
        else {
            if (document.documentElement && document.documentElement.clientHeight) {
                _ret.Height = document.documentElement.clientHeight;
            }
            else {
                if (document.body && document.body.clientHeight) {
                    _ret.Height = document.body.clientHeight;
                }
            }
        }

        return _ret;
    }

};

var $browserUtil = {
    IsAttributeInputPlaceholderSupport: function () {
        return Modernizr.input.placeholder;
    },
    IsInputNumberTypeButtonSupport: function () {
        var _valid = true;

        //at the moment IE does not support number type increment/decrement
        if ($browserUtil.IsIE) {
            _valid = false;
        }
        else {
            _valid = (Modernizr.inputtypes && Modernizr.inputtypes["number"]);
        }

        return _valid;
    },
    IsTouchSupported: function () {
        return Modernizr.touch;
    },
    IsUserAgentIPad: function () {
        return (navigator.userAgent.match(/iPad/i) != null);
    },
    IsIE: false,
    IsIE8: false,
    IsEdge: false,
    IsUnsupportedIE: false
};


var $canvas = {
    Context: null,

    GetPoint: function (coordX, coordY) {
        return { "x": coordX, "y": coordY };
    },

    GetLineParams: function (coordInitX, coordInitY, coordEndX, coordEndY) {
        return { "MoveX": coordInitX, "MoveY": coordInitY, "EndX": coordEndX, "EndY": coordEndY };
    },

    GetArcParams: function (moveX, moveY, coordInitX, coordInitY, coordEndX, coordEndY, radius) {
        return { "MoveX": moveX, "MoveY": moveY, "StartX": coordInitX, "StartY": coordInitY, "EndX": coordEndX, "EndY": coordEndY, "Radius": radius };
    },

    GetLabelIndicatorSetting: function (labelText, renderSettings, offsetX, offsetY) {
        return { "Text": labelText, "Style": renderSettings, "OffsetX": offsetX, "OffsetY": offsetY };
    },

    DrawLine: function (params, renderType, settings, commit, isContinue) {
        if (commit == null || commit == undefined) {
            commit = true;
        }

        if (isContinue == null || isContinue == undefined) {
            isContinue = false;
        }

        if (renderType == null || renderType == undefined) {
            renderType = enCCanvasRenderType.Line;
        }

        if (isContinue != true) {
            this.Context.beginPath();
            this.Context.moveTo(params.MoveX, params.MoveY);
        }

        switch (renderType) {
            case enCCanvasRenderType.Line:
                this.Context.lineTo(params.EndX, params.EndY);
                break;

            case enCCanvasRenderType.Arc:
                this.Context.arcTo(params.StartX, params.StartY, params.EndX, params.EndY, params.Radius);
                break;
        }

        var _postProcessSetting = { IsClosePath: true, RequireFill: false };

        if (settings) {
            for (var _settingKey in settings) {
                switch (_settingKey) {
                    case "fillStyle":
                        this.Context[_settingKey] = settings[_settingKey];
                        _postProcessSetting.RequireFill = true;
                        break;

                    case "CClosePath":
                        _postProcessSetting.IsClosePath = settings[_settingKey];
                        break;

                    default:
                        this.Context[_settingKey] = settings[_settingKey];
                        break;
                }

            }
        }

        if (commit) {
            if (_postProcessSetting.IsClosePath) {
                this.Context.closePath();
            }

            if (_postProcessSetting.RequireFill) {
                this.Context.fill();
            }

            this.Context.stroke();
        }

        if (renderType == enCCanvasRenderType.Line) {
            util_log(params.MoveX + ", " + params.MoveY + " to " + params.EndX + ", " + params.EndY);
        }
    },

    GetContext: function (elementID) {
        return document.getElementById(elementID).getContext("2d");
    },

    SetContext: function (elementID) {
        this.Context = this.GetContext(elementID);
    },

    SaveContext: function () {
        this.Context.save();    // save the context so we avoid modifying it for other calls
    },

    RestoreContext: function () {
        this.Context.restore();  // restore context to what it was on previous save context call
    },

    BeginPath: function () {
        this.Context.beginPath();
    },

    ClosePath: function () {
        this.Context.closePath();
    },

    ClearCanvas: function (elementID) {
        var _canvas = document.getElementById(elementID);
        var _context = this.GetContext(elementID);

        _context.clearRect(0, 0, _canvas.width, _canvas.height);
    },

    DrawLabelIndicator: function (labelSetting, coordCenterX, coordCenterY, width, height, radius, handleWidth, handleHeight, isForceFill, isForceStroke) {
        this.SaveContext();
        this.BeginPath();

        if (labelSetting == null || labelSetting == undefined) {
            labelSetting = { Text: "", Style: { "font": "20px Arial", "strokeStyle": "#000000", "fillStyle": "#000000"} };
        }
        else if (!labelSetting.Style) {
            labelSetting.Style = { "font": "20px Arial", "strokeStyle": "#000000", "fillStyle": "#000000" };
        }

        var _x = coordCenterX - width / 2;
        var _y = coordCenterY - height / 2;

        //draw top and top right corner
        this.Context.moveTo(_x + radius, _y);
        this.Context.arcTo(_x + width, _y, _x + width, _y + radius, radius);

        //draw right side and bottom right corner
        this.Context.arcTo(_x + width, _y + height, _x + width - radius, _y + height, radius);

        //draw bottom and bottom left corner
        this.Context.arcTo(coordCenterX + handleWidth / 2, _y + height, _x, _y + height - radius, radius);

        this.Context.lineTo(coordCenterX, _y + height + handleHeight);
        this.Context.lineTo(coordCenterX - handleWidth / 2, _y + height);

        this.Context.arcTo(_x, _y + height, _x, _y + height - radius, radius);

        //draw left and top left corner 
        this.Context.arcTo(_x, _y, _x + radius, _y, radius);

        //force the fill and/or stroke methods, if applicable
        if (isForceFill) {
            this.Context.fill();
        }

        if (isForceStroke) {
            this.Context.stroke();
        }

        //draw the text for the indicator
        var _positionLabelX, _positionLabelY;
        var _text = util_forceString(labelSetting.Text, "");
        var _textMeasure = this.Context.measureText(_text);

        _positionLabelX = coordCenterX - Math.ceil(_textMeasure.width / 2) + util_forceInt(labelSetting.OffsetX, 0);
        _positionLabelY = coordCenterY + util_forceInt(labelSetting.OffsetY, 0);

        //apply the label render settings
        if (labelSetting.Style) {
            for (var _labelProp in labelSetting.Style) {
                this.Context[_labelProp] = labelSetting.Style[_labelProp];
            }
        }

        this.Context.fillText(_text, _positionLabelX, _positionLabelY);

        this.RestoreContext();
    },

    DrawTriangle: function (pointA, pointB, pointC) {
        this.SaveContext();

        this.BeginPath();

        this.Context.moveTo(pointA.x, pointA.y);
        this.Context.lineTo(pointB.x, pointB.y);
        this.Context.lineTo(pointC.x, pointC.y);

        this.Context.closePath();

        this.Context.stroke();

        this.RestoreContext();
    },

    DrawRoundRectangle: function (coordCenterX, coordCenterY, width, height, radius, isForceFill, isForceStroke) {
        this.SaveContext();
        this.BeginPath();

        var _x = coordCenterX - width / 2;
        var _y = coordCenterY - height / 2;

        //draw top and top right corner
        this.Context.moveTo(_x + radius, _y);
        this.Context.arcTo(_x + width, _y, _x + width, _y + radius, radius);

        // draw right side and bottom right corner
        this.Context.arcTo(_x + width, _y + height, _x + width - radius, _y + height, radius);

        // draw bottom and bottom left corner
        this.Context.arcTo(_x, _y + height, _x, _y + height - radius, radius);

        // draw left and top left corner 
        this.Context.arcTo(_x, _y, _x + radius, _y, radius);

        //force the fill and/or stroke methods, if applicable
        if (isForceFill) {
            this.Context.fill();
        }

        if (isForceStroke) {
            this.Context.stroke();
        }

        this.RestoreContext();
    }
};

//*********************************************************************************************************************//
//****************************SECTION END: Global Utilitiy Helpers****************************************************//
//********************************************************************************************************************//

var EditItem;   //the source item being modified for an edit view

//ID of item being modified for a module edit view
function EditID() {
    return util_forceInt(global_activePageQueryStr("EditID"), enCE.None);
}

function IsEditAddNew() {
    return (EditID() == enCE.None);
}

function TemplateSourceModuleID() {
    return util_forceInt(global_activePageQueryStr("TemplateSourceModuleID"), enCE.None);
}

function TemplateParams() {
    return util_forceString(global_activePageQueryStr("TemplateParams"), "");
}

function global_activePageQueryStr(nameQS) {
    var _page = $mobileUtil.ActivePage();
    var _url = _page.attr(DATA_ATTRIBUTE_CONTEXT_HREF);

    if (util_isNullOrUndefined(_url)){
        _url = null;
    }

    return util_queryStringFragment(nameQS, _url);
}

function global_forceContext(context, isRestrictActivePage) {
    isRestrictActivePage = util_forceBool(isRestrictActivePage, false);

    if (context == null || context == undefined) {
        if (isRestrictActivePage) {
            context = $mobileUtil.ActivePage();
        }
        else {
            context = $("body");
        }
    }

    return context;
}

function global_convertValue(value, fieldSetting, obj, applyValidator) {
    var _ret = undefined;
    var _dataFormatType = util_forceValidEnum(fieldSetting[enColCPropertyDetailProperty.DataType], enCDataFormat, enCDataFormat.Unknown);
    var _element = $(obj);

    applyValidator = util_forceBool(applyValidator, false);

    var _validator = fieldSetting[enColCPropertyDetailProperty.Validation];
    var _hasValidator = (applyValidator && !util_isNullOrUndefined(_validator));
    var _isRequired = (_hasValidator ? util_forceBool(_validator[enColCFieldValidationProperty.IsRequired], true) : true);

    switch (_dataFormatType) {
        case enCDataFormat.Boolean:
            _ret = util_forceBoolFromInt(value, undefined, true);
            break;

        case enCDataFormat.BooleanCheckbox:
            _ret = _element.prop("checked");
            break;

        case enCDataFormat.Numeric:
            if (!_isRequired && (value == "" || value == null)) {
                _ret = null;
            }
            else {
                _ret = util_forceInt(value, undefined, true);
            }
            break;

        case enCDataFormat.Decimal:
            if (!_isRequired && (value == "" || value == null)) {
                _ret = null;
            }
            else {
                _ret = util_forceFloat(value, undefined, true);
            }
            break;

        case enCDataFormat.Text:        
            _ret = util_trim(value, "");
            break;

        case enCDataFormat.TextExt:
            _ret = util_trim(value, "");
            _ret = util_replaceAll(_ret, "\n\r", "\n");
            break;

        case enCDataFormat.Enumeration:
            var _enumType = eval(fieldSetting[enColCPropertyDetailProperty.EnumTypeName]);
            var _names = util_reflectionPropertyList(_enumType, null, true);

            if (!util_isNullOrUndefined(_enumType)) {
                _ret = util_forceValidEnum(value, _enumType, undefined);
            }
            else {
                _ret = undefined;
            }

            break;

        case enCDataFormat.Date:

            //TODO DATEPICKER
            var _datepicker = _element.find(".CDatePicker");

            if (_datepicker.hasClass("hasDatepicker")) {
                _ret = _datepicker.datepicker("getDate");

                if (!util_isDate(_ret)) {
                    _ret = null;
                }
            }

            break;

        case enCDataFormat.Color:
            var _colorPicker = _element.find(".CColorPicker");

            _ret = util_forceString(_colorPicker.val());

            break;

        case enCDataFormat.Lookup:
            _ret = value;
            break;

        case enCDataFormat.Password:
            _ret = util_forceString(value, "");
            break;
    }

    return _ret;
}

function global_getFieldValue(obj, fieldSetting, applyValidator) {
    var _ret = undefined;
    var _isEditable = util_forceBool(fieldSetting[enColCPropertyDetailProperty.IsEditable], false);

    var _element = $(obj);
    var _value = undefined;

    applyValidator = util_forceBool(applyValidator, false);

    if (!_isEditable) {
        _value = _element.text();   //read-only fields will have its value as the text of the element (e.g. span contents)
    }
    else {
        _value = _element.val();
    }

    _ret = global_convertValue(_value, fieldSetting, _element, applyValidator);

    return _ret;
}

function global_getFieldHTML(fieldSetting, value, extraTagAttributes, isForceDisabledOverride, renderUniqueID) {
    var _ret = "";
    
    var _fieldName = util_forceString(fieldSetting[enColCPropertyDetailProperty.Name]);
    var _dataFormatType = util_forceValidEnum(fieldSetting[enColCPropertyDetailProperty.DataType], enCDataFormat, enCDataFormat.Unknown);
    var _isEditable = util_forceBool(fieldSetting[enColCPropertyDetailProperty.IsEditable], false);
    var _isNullable = util_forceBool(fieldSetting[enColCPropertyDetailProperty.IsNullable], false);
    var _validator = fieldSetting[enColCPropertyDetailProperty.Validation];
    var _overrideDefaultDisableHTML = { };

    _overrideDefaultDisableHTML[enCDataFormat.BooleanCheckbox] = true;

    isForceDisabledOverride = util_forceBool(isForceDisabledOverride, false);

    if (util_isNullOrUndefined(value)) {
        value = "";
    }

    if (util_isNullOrUndefined(_validator)) {
        _validator = {};
    }

    extraTagAttributes = util_forceString(extraTagAttributes);

    _ret = util_htmlEncode(value);

    //util_log("global_getFieldHTML :: params - " + [_fieldName, _dataFormatType, _isEditable, value, extraTagAttributes].join("|"));

    var _attrFieldName = DATA_ATTR_INPUT_FIELD + "=\"" + util_jsEncode(_fieldName) + "\"";

    var _fnGetFieldDisplayName = function(){
        var _displayName = util_forceString(fieldSetting[enColCPropertyDetailProperty.DisplayName]);

        if (_displayName == "") {
            _displayName = _fieldName;
        }

        return _displayName;
    };

    if (!_isEditable && (_overrideDefaultDisableHTML[_dataFormatType] != true && !isForceDisabledOverride)) {
        _ret = "<span " + _attrFieldName + ">" + util_htmlEncode(value) + "</span>";
    }
    else {

        switch (_dataFormatType) {
            case enCDataFormat.Boolean:
            case enCDataFormat.BooleanCheckbox:

                if (_dataFormatType == enCDataFormat.Boolean) {
                    var _value = 1;
                    var _attrDisabled = "";
                    
                    if (
                        ((util_forceString(value) + "") != "" && !util_forceBool(value, false)) ||
                        (_isNullable && ((util_forceString(value) + "") == ""))
                    ) {
                        _value = 0;
                    }

                    if (!_isEditable) {
                        _attrDisabled = util_htmlAttribute("disabled", "disabled") + " ";
                    }

                    _ret = "<span " + _attrFieldName + " data-attr-render=\"flip_switch\" data-attr-default=\"" + _value + "\" " + extraTagAttributes + " " +
                           _attrDisabled + "></span>";
                }
                else if (_dataFormatType == enCDataFormat.BooleanCheckbox) {
                    var _cbID = util_forceString(renderUniqueID);
                    var _value = util_forceBool(value, false);

                    var _attrState = (_value == true ? util_htmlAttribute("checked", "checked") + " " : "");

                    if (!_isEditable) {
                        _attrState += util_htmlAttribute("disabled", "disabled") + " ";
                    }

                    if (_cbID == "") {
                        _cbID = "cbProp_" + _fieldName + "_" + renderer_uniqueID();
                    }

                    _ret = "<input type=\"checkbox\" name=\"" + _cbID + "\" id=\"" + _cbID + "\" " + _attrState + extraTagAttributes + "/>";

                    var _displayName = util_trim(_fnGetFieldDisplayName());

                    if (_displayName == "") {
                        _ret += "<label for=\"" + _cbID + "\">" + "&nbsp;" + "</label>";
                    }
                    else {
                        _ret += "<label for=\"" + _cbID + "\">" + util_htmlEncode(_fnGetFieldDisplayName()) + "</label>";
                    }
                }

                break;

            case enCDataFormat.Numeric:
            case enCDataFormat.Decimal:
            case enCDataFormat.Text:
            case enCDataFormat.Password:
                var _maxLength = util_forceInt(_validator[enColCFieldValidationProperty.MaxLength], 0);

                _ret = "<input type=\"" + (_dataFormatType != enCDataFormat.Password ? "text" : "password") + "\" " + _attrFieldName + " value=\"" + util_jsEncode(value) + "\" " + 
                       (_maxLength > 0 ? "maxlength=\"" + _maxLength + "\" " : "") +
                       (_dataFormatType == enCDataFormat.Password ? "autocomplete='new-password' " : "") +
                       extraTagAttributes + " />";
                break;

            case enCDataFormat.TextExt:
                var _maxLength = util_forceInt(_validator[enColCFieldValidationProperty.MaxLength], 0);

                _ret = "<textarea " + _attrFieldName + " " +
                       (_maxLength > 0 ? "maxlength=\"" + _maxLength + "\" " : "") + extraTagAttributes + ">" +
                       util_htmlEncode(value, false, true) +
                       "</textarea>";
                break;

            case enCDataFormat.Enumeration:
                var _enumType = eval(fieldSetting[enColCPropertyDetailProperty.EnumTypeName]);
                var _names = util_reflectionPropertyList(_enumType, null, true);

                if (!util_isNullOrUndefined(_enumType)) {
                    value = util_forceValidEnum(value, _enumType, null);
                }
                else {
                    value = null;
                }

                _ret = "<select " + _attrFieldName + " " + extraTagAttributes + ">";    //open select tag #1

                for (var _nameIndex = 0; _nameIndex < _names.length; _nameIndex++) {
                    var _name = _names[_nameIndex];
                    var _val = _enumType[_name];

                    _ret += "<option value=\"" + _val + "\" " + (_val == value ? "selected='selected'" : "") +
                                ">" + util_htmlEncode(_name) + "</option>";
                }

                _ret += "</select>";    //close select tag #1

                break;

            case enCDataFormat.Lookup:
                _ret = "<select " + _attrFieldName + " " + extraTagAttributes + ">";    //open select tag #1
                _ret += "</select>";    //close select tag #1
                break;

            case enCDataFormat.Date:
                var _defaultDateValue = "";

                if (util_isDate(value)) {
                    _defaultDateValue = value.getTime();
                }
                
                _ret = "<div " + _attrFieldName + " " + extraTagAttributes + " " + util_htmlAttribute(DATA_ATTRIBUTE_RENDER, "datepicker") + " " +
                       util_htmlAttribute(CONTROL_DATA_ATTR_DATEPICKER_DEFAULT, _defaultDateValue) + "></div>";
                break;

            case enCDataFormat.Color:
                _ret = "<div " + _attrFieldName + " " + extraTagAttributes + " " + util_htmlAttribute(DATA_ATTRIBUTE_RENDER, "colorpicker") + " " +
                       util_htmlAttribute("data-attr-color", value) + "></div>";
                break;

            case enCDataFormat.Unknown:
                _ret = "<div " + _attrFieldName + " " + extraTagAttributes + "></div>";
                break;
        }
    }

    return _ret;
}

function global_moduleSettingPopulateItem(moduleID, objFieldsList) {
    var _ret = {};  //empty setting object to be populated and returned to caller
    var _settingMetadata = module_getItem(moduleID).SettingMetadata;
    
    if (util_isNullOrUndefined(objFieldsList)) {
        objFieldsList = $mobileUtil.GetElementsByAttribute(DATA_ATTR_INPUT_FIELD, null, true);
    }

    var _list = $(objFieldsList);

    var _fnGetFieldSetting = function(fieldName){
        var _retSetting = null;

        for (var i = 0; i < _settingMetadata.length; i++) {
            var _property = _settingMetadata[i];
            var _propertyName = _property[enColCPropertyDetailProperty.Name];

            if (_propertyName == fieldName){
                _retSetting = _property;
                break;
            }
        }

        return _retSetting;
    };

    //loop through the input fields and populate the settings based on the property and field setting
    $.each(_list, function (index) {
        var _element = $(this);

        var _propertyName = _element.attr(DATA_ATTR_INPUT_FIELD);
        var _fieldSetting = _fnGetFieldSetting(_propertyName);

        _ret[_propertyName] = global_getFieldValue(_element, _fieldSetting);
    });

    return _ret;
}

function global_moduleSettingAdminViewHTML(moduleID) {
    var _ret = "";

    moduleID = util_forceValidEnum(moduleID, enCEModule, null);

    if (moduleID) {
        var _setting = module_getSetting(moduleID);

        if (_setting) {
            _ret += "<table border='0' cellpadding='0' cellspacing='0' " + DATA_ATTRIBUTE_RENDER + "='table' style='width: 100%;'>";

            var _settingMetadata = module_getItem(moduleID).SettingMetadata;

            var _valueUndefinedNoteHTML = "<span style='font-weight: bold; color: #FF0000; font-size: 0.8em;'>" + util_htmlEncode("* Value not defined") + "</span>";

            for (var i = 0; i < _settingMetadata.length; i++) {
                var _property = _settingMetadata[i];
                var _propertyName = _property[enColCPropertyDetailProperty.Name];
                var _value = _setting[_propertyName];

                _ret += "<tr>"; //open row tag #1

                _ret += "<td style='width: 25%;'>"; //open cell tag #1
                _ret += util_htmlEncode(_propertyName + ":");
                _ret += "</td>"; //close cell tag #1


                _ret += "<td>"; //open cell tag #2

                _ret += global_getFieldHTML(_property, _value, (_property.IsEditable == true ? "data-mini=\"true\"" : "")) +
                        (_value == undefined ? _valueUndefinedNoteHTML : "");

                _ret += "</td>"; //close cell tag #2

                _ret += "</tr>";    //close row tag #1                    
            }

            _ret += "</table>";
        }
    }

    if (_ret == "") {
        _ret = util_htmlEncode("No settings are available for the specified item.");
    }

    return _ret;
}

function global_eventSubFooterClick(obj) {
    var _btn = $(obj);

    var _btnID = util_forceInt(_btn.attr("data-attr-button-id"), null);

    util_log("global_eventSubFooterClick :: clicked button ID: " + _btnID);

    //retrieve the function from the delegate settings
    var _fn = MODULE_MANAGER.DelegateSettings.GetEvent(enCDelegateType.SubFooterClick, null);

    if (
        (util_forceInt(_btn.attr("data-attr-button-is-propagate-dismiss"), enCETriState.None) != enCETriState.Yes) &&
        (_btnID == BUTTON_CONFIG.Cancel.ID || _btnID == BUTTON_CONFIG.Close.ID)
    ) {
        $mobileUtil.CloseDialog();
    }
    else if (_fn != null && _fn != undefined) {
        _fn(_btn, _btnID);
    }

    return false;
}


function resizeView(obj) {
    var _container = $(obj);
    var _width = 1024;
    var _height = 768;

    var _windowWidth = $(window).width();

    if (_windowWidth >= 2048) {
        _width = 2048;
        _height = 1536;
    }

    _container.width(_width);
    _container.height(_height);

    return false;
}

function global_setAppTitle(fnCallback) {
    var _fn = function () {
        document.title = APP_NAME;
        $(".CAppName").text(APP_NAME);

        if (fnCallback) {
            fnCallback();
        }
    };

    util_execCallbackState(function () {
        GlobalService.GetAppName(function (ret) {
            APP_NAME = util_forceString(ret, APP_NAME);
            _fn();

        }, function () { _fn(); });
    }, _fn);
}

function ext_content(fileURL, successFn, failureFn, isDialog) {
    $.ajax({
        type: "GET",
        contentType: "text/html; charset=utf-8",
        dataType: "text",
        url: fileURL,
        success: function (data, status, xmlHttp) {
            var _html = data;

            if (isDialog != true) {
                $mobileUtil.SetActivePageHTML(_html);
            }
            else {

                //refresh all jQuery Mobile content        
                $mobileUtil.refresh();
            }

            successFn(_html);
        },
        error: failureFn
    });
}

function js_bindEvent(obj, strEvent, fn) {
    var _obj = $(obj);

    _obj.unbind(strEvent);
    _obj.bind(strEvent, fn);
}

function js_bindClick(obj, fn) {
    var _obj = $(obj);

    _obj.unbind("click");
    _obj.click(fn);
}

function js_bindChange(obj, fn, isScopeFunction) {
    var _obj = $(obj);

    isScopeFunction = util_forceBool(isScopeFunction, false);

    if (isScopeFunction) {
        _obj.unbind("change", fn);
        _obj.bind("change", fn);
    }
    else {
        _obj.unbind("change");
        _obj.change(fn);
    }
}

function js_bindBlur(obj, fn) {
    var _obj = $(obj);
    _obj.unbind('blur');
    _obj.blur(fn);
}

function js_bindHover(obj, fn) {
    var _obj = $(obj);
    _obj.unbind('hover');
    _obj.hover(fn);
}

function js_bindMouseEnter(obj, fn) {
    var _obj = $(obj);

    _obj.unbind("mouseenter");
    _obj.mouseenter(fn);
}

function js_bindMouseLeave(obj, fn) {
    var _obj = $(obj);

    _obj.unbind("mouseleave");
    _obj.mouseleave(fn);
}

function ajax_err(xhr, status, error) {
    var _msg = "An unexpected error has occurred while processing your request. " +
               "Please try again and if the issue persists inform the site Administrator.";

    if (IS_DEBUG && !IS_SUPPRESS_FAILURE) {
        GlobalService.ext_ajax_error_detailed(xhr, status, error);
    }
    else {
        util_alert(_msg);
    }
}

function MessageContainer(options) {
    var _ret = null;

    options = util_extend({ "IsValidateContext": true }, options);

    if (util_forceBool(options["IsValidateContext"], true)) {

        if (!$mobileUtil.IsActiveDialogPage() && $mobileUtil.PopupIsOpen()) {
            _ret = $mobileUtil.PopupContainer().find(".PopupMessageContainer");
        }
    }

    if (_ret == null || _ret.length == 0) {
        _ret = $mobileUtil.ActivePage().find(".MessageContainer:not(.PopupMessageContainer)");
    }

    return _ret;
}

function ClearMessages(options) {

    options = util_extend({ "IsValidateContext": true }, options);

    var _container = MessageContainer(options);

    _container.html("");

    if (_container.is(":visible") == true) {
        _container.hide();
    }
}

function MessageCount(filterErrorTypes, options) {
    var _ret = 0;
    options = util_extend({ "IsValidateContext": true, "ScrollTopErrors": false }, options);

    var _container = MessageContainer({ "IsValidateContext": options["IsValidateContext"] });

    filterErrorTypes = util_forceBool(filterErrorTypes, false);

    if (_container.length > 0) {
        var _children = _container.children();

        if (filterErrorTypes) {
            _children = _children.not(".MessageTypeMessage");
        }

        _ret = _children.length;
    }
    else {
        _ret = 0;
    }

    if (_ret > 0 && util_forceBool(options["ScrollTopErrors"], false)) {
        $mobileUtil.AnimateSmoothScroll(_container);
    }

    return _ret;
}

function AddMessage(msg, msgType, isHTML, options) {

    options = util_extend({ "IsValidateContext": true, "IsTimeout": false, "TimeoutDuration": 2200, "IsDurationLong": false }, options);

    if (msgType == null || msgType == undefined) {
        msgType = enCMessageType.Message;
    }

    isHTML = util_forceBool(isHTML, false);

    var _container = MessageContainer(options);

    var _cssClass = null;
    var _msgTypeText = "Message";

    switch (msgType) {
        case enCMessageType.Error:
            _cssClass = "MessageTypeError";
            _msgTypeText = "Error";
            break;

        case enCMessageType.UserError:
            _cssClass = "MessageTypeUserError";
            _msgTypeText = "User Error";
            break;

        case enCMessageType.Critical:
            _cssClass = "MessageTypeCritical";
            _msgTypeText = "Application Error";
            break;

        default:
            _cssClass = "MessageTypeMessage";
            _msgTypeText = "Message";
            break;
    }

    var _item = $("<li class=\"" + _cssClass + "\"></li>");

    if (isHTML) {
        _item.html(util_forceString(msg, ""));
    }
    else {
        _item.text(util_forceString(msg, ""));
    }

    _item.append($("<span class=\"ui-li-count\"></span>").text(_msgTypeText));

    _container.append(_item);

    _item.click(function () {
        var _msgItem = $(this);

        if ($mobileUtil.Configuration.Notification.Type == enCNotificationComponentType.Inline) {
            _msgItem.slideUp("normal", function () {
                _msgItem.remove();
            });
        }
        else {
            _msgItem.fadeOut("normal", function () {
                _msgItem.remove();
            });
        }
    });

    if (_container.is(":visible") == false) {
        _container.show();
    }

    if (options["IsTimeout"] == true) {

        if (options["IsDurationLong"]) {
            options["TimeoutDuration"] = 8000;
        }

        var _duration = Math.max(util_forceInt(options["TimeoutDuration"], 0), 0);

        setTimeout(function () {
            _item.trigger("click");
        }, _duration);
    }

    $mobileUtil.refresh(_container);
}

function AddError(msg, severity, options) {

    options = util_extend({ "IsValidateContext": true, "IsHTML": null }, options);

    severity = util_forceValidEnum(severity, enCMessageType, enCMessageType.Error);

    AddMessage(msg, severity, options["IsHTML"], options);

    if (IS_DEBUG) {
        util_log("UserError : " + msg);
    }
}

function AddUserError(msg, options) {
    options = util_extend({ "IsValidateContext": true }, options);

    AddError(msg, enCMessageType.UserError, options);
}

function AddErrorCritical(msg, options) {
    options = util_extend({ "IsValidateContext": true }, options);

    AddError(msg, enCMessageType.Critical, options);
}

function blockUI(msgText, options) {

    options = util_extend({ "IsFixedMode": false, "IsHTML": false }, options);

    msgText = util_forceString(msgText);

    if (msgText == "") {
        msgText = "Please wait...";
        options.IsHTML = false;
    }

    msgText = (!options.IsHTML ? util_htmlEncode(msgText) : util_forceString(msgText));

    var _optionsBlockUI = $mobileUtil.Configuration.BlockUI;
    var _cssClass = util_forceString(_optionsBlockUI["CssClassContentBlockUI"], "");

    if (_optionsBlockUI.IsIndicatorMode) {

        var $body = $("body");
        var $indicator = $body.find("#ctlRootBlockView");

        if ($indicator.length == 0) {

            var _html = "<div id='ctlRootBlockView' class='DisableUserSelectable LoadingBlockView" + (_indicatorCssClass != "" ? " " + _indicatorCssClass : "") + "'>" +
                        "   <div class='ProgressBar'>" +
                        "       <div class='ModeIndeterminate' />" +
                        "   </div>" +
                        "   <div class='Title'>" + msgText + "</div>" +
                        "</div>";

            $indicator = $(_html);
            $indicator.hide();

            $body.append($indicator);
        }
        else {
            $indicator.children(".Title").text(msgText);
        }

        if (!$indicator.is(":visible")) {
            $indicator.show();
        }
    }
    else {

        //deprecated: use the "IsIndicatorMode" with flag set to true (blockUI no longer properly supported)
        var _indicatorCssClass = util_forceString(_optionsBlockUI["IndicatorClass"], "Indicator");
        var _container = $("body");

        msgText = "<table id='divLoadingDefault' class='DisableUserSelectable LoadingDefaultMsg" + (_cssClass != "" ? " " + _cssClass : "") + "'>" +
                  '<tr><td align="center" valign="middle">' + '<span class="LoadingMsgText" data-cattr-block-ui-msg="1">' + msgText + '</span>' +
                  "<div class='" + _indicatorCssClass + "'>&nbsp;</div>" + "</td></tr></table>";

        _container.block({ "baseZ": 9999, message: msgText });

        if (options.IsFixedMode) {
            var $block = _container.find(".blockUI.blockMsg");

            $block.css({ "position": "fixed", "width": "100%", "height": "100%", "top": "0px", "left": "0px" });
            $block.addClass("LoadingDefaultFixedMode");
        }
    }
}

function unblockUI() {
    var _container = $("body");

    if ($mobileUtil.Configuration.BlockUI.IsIndicatorMode) {
        var $indicator = _container.find("#ctlRootBlockView");

        $indicator.hide();
    }
    else {

        //deprecated
        _container.unblock();
    }
}

function refreshBlockUI(msgText) {
    if ($mobileUtil.Configuration.BlockUI.IsIndicatorMode) {
        blockUI(msgText);
    }
    else {
        if ($("#divLoadingDefault").length == 0) {
            blockUI(msgText);
        }
        else {
            global_setMessageBlockUI(msgText);
        }
    }
}

function global_setMessageBlockUI(msgText) {
    if ($mobileUtil.Configuration.BlockUI.IsIndicatorMode) {
        var $indicator = $("#ctlRootBlockView");

        $indicator.children(".Title")
                  .text(util_forceString(msgText));
    }
    else {
        $("#divLoadingDefault").find("[data-cattr-block-ui-msg=1]").text(util_forceString(msgText));
    }
}

function global_serviceResultExecute(serviceResult, fnServiceSuccess, messageTypeSeverity, options) {

    options = util_extend({ "OnError": null }, options);

    if (util_forceInt($mobileUtil.ActivePage().attr(DATA_ATTR_PAGE_MESSAGE_PRESERVE)) != enCETriState.Yes) {
        ClearMessages();
    }

    if (ext_service_isResultError(serviceResult, null)) {
        AddError(serviceResult.ErrorMessage, messageTypeSeverity);

        if (options.OnError) {
            options.OnError();
        }
    }
    else {
        if (fnServiceSuccess) {
            fnServiceSuccess(serviceResult);
        }
    }
}

function global_serviceRequestError(status, error, msg) {

    //an AJAX related request error has occurred so handle it accordingly (displaying to the user as a critical error)
    //AKV TODO: implement automatic e-mail to IT of the error and detailed exception

    var _str = MSG_CONFIG.UnexpectedError;
    
    _str += " | Error Msg: \"" + error + "\", Status: \"" + status + "\"";

    AddErrorCritical(_str);
}

function global_serviceIsValidationError(serviceRet) {
    var _ret = false;

    if (!util_isNullOrUndefined(serviceRet) && util_forceInt(serviceRet[enColCServiceResultProperty.ErrorType], undefined, true) == enCEServiceErrorType.Validation) {
        _ret = true;
    }

    return _ret;
}

function global_serviceProcessValidationError(serviceRet, opts) {
    if (global_serviceIsValidationError(serviceRet)) {
        var _message = serviceRet[enColCServiceResultProperty.ErrorMessage];

        _message = util_forceString(_message, MSG_CONFIG.UnexpectedError);

        var _isHTML = util_forceBool(serviceRet[enColCServiceResultProperty.IsMessageHTML], false);
        var _arrError = (_isHTML ? [_message] : _message.split("\n"));

        opts = util_extend({ "IsTimeout": false, "TimeoutDuration": 2200, "IsDurationLong": false }, opts);

        for (var _index = 0; _index < _arrError.length; _index++) {
            var _validateMsg = _arrError[_index];

            if (_validateMsg != "") {
                AddError(_validateMsg, null, {
                    "IsHTML": _isHTML, "IsTimeout": opts.IsTimeout, "TimeoutDuration": opts.TimeoutDuration, "IsDurationLong": opts.TimeoutDuration
                });
            }
        }
    }
}

function global_extEntitySave(callbackSuccess, callbackSaveConflict, callbackError, options) {
    var _fnShowErrors = function () {

        if (MessageCount(true) > 0) {
            $mobileUtil.AnimateSmoothScroll(MessageContainer());
        }
    };

    var _callbackGeneralFailure = function () {
        if (options["CallbackGeneralFailure"]) {
            options.CallbackGeneralFailure();
        }
    };

    options = util_extend({
        "CallbackValidationErrors": function () {
            _fnShowErrors();
            _callbackGeneralFailure();
        },
        "CallbackGeneralFailure": null  //the callback to execute when any error (validation, save conflict, or server error) has occurred
    }, options);

    
    if (options.CallbackGeneralFailure && !options["CallbackValidationErrors"]) {
        options["CallbackValidationErrors"] = options.CallbackGeneralFailure;
    }

    if (util_isNullOrUndefined(callbackError)) {
        callbackError = function (errMsg) {
            AddErrorCritical(errMsg);

            _fnShowErrors();
            _callbackGeneralFailure();
        };
    }

    var _ret = ext_requestSuccessSave(function (saveItem) {

        if (callbackSuccess) {
            callbackSuccess(saveItem);
        }

        _fnShowErrors();

    }, function () {

        AddError(MSG_CONFIG.SaveUserConflict);

        if (callbackSaveConflict) {
            callbackSaveConflict();
        }

        _fnShowErrors();
        _callbackGeneralFailure();
    }, callbackError, true, null, null, options);

    return _ret;
}

function dialog_confirm(title, message, fnOK, fnCancel) {
    util_confirm(message, title, null, null, function (btnID) {
        if (btnID == NOTIFICATION_BUTTON_CONFIG.OK.ID) {
            if (fnOK) {
                fnOK();
            }
        }
        else if (btnID == NOTIFICATION_BUTTON_CONFIG.Cancel.ID) {
            if (fnCancel) {
                fnCancel();
            }
        }
    });
}

function dialog_confirmYesNo(title, message, fnYes, fnNo, isHTML, extOptions) {
    var _arrButtons = [{ ID: NOTIFICATION_BUTTON_CONFIG.Yes.ID, Text: NOTIFICATION_BUTTON_CONFIG.Yes.Text },
                       { ID: NOTIFICATION_BUTTON_CONFIG.No.ID, Text: NOTIFICATION_BUTTON_CONFIG.No.Text}];

    util_confirm(message, title, isHTML, _arrButtons, function (btnID) {
        if (btnID == NOTIFICATION_BUTTON_CONFIG.Yes.ID) {
            if (fnYes) {
                fnYes();
            }
        }
        else if (btnID == NOTIFICATION_BUTTON_CONFIG.No.ID) {
            if (fnNo) {
                fnNo();
            }
        }
    }, null, null, extOptions);
}

function GoToHome() {
    var _moduleID = enCEModule.GlobalHome;
    var _moduleViewType = enCEModuleViewType.List;
    var _ctrlName = "";
    var _loadOptions = null;

    if (MODULE_MANAGER.DebugHomeOption != null) {
        var _debugOption = MODULE_MANAGER.DebugHomeOption;

        _moduleID = _debugOption["ModuleID"];
        _moduleViewType = _debugOption["ModuleViewType"];
        _ctrlName = _debugOption["ControlName"];
    }
    else if (MODULE_MANAGER.Redirect.Enabled) {

        var _redirectView = MODULE_MANAGER.Redirect.View;

        MODULE_MANAGER.Redirect.Enabled = false;    //disable redirect since processed

        if (_redirectView && util_forceInt(_redirectView[enColCModuleRedirectParamProperty.ModuleID], enCE.None) != enCE.None) {
            _moduleID = util_forceInt(_redirectView[enColCModuleRedirectParamProperty.ModuleID], enCE.None);
            _moduleViewType = _redirectView[enColCModuleRedirectParamProperty.ModuleViewType];
            _ctrlName = _redirectView[enColCModuleRedirectParamProperty.ControlName];

            _loadOptions = { "Parameters": _redirectView[enColCModuleRedirectParamProperty.Parameters] };
        }
    }

    module_loadTransition(_moduleID, _moduleViewType, _ctrlName, null, null, null, _loadOptions);

    return false;
}

function GoToLogin() {
    var _moduleSplashSettings = module_getSetting(enCEModule.GlobalSplash);

    if (util_forceBool(_moduleSplashSettings["ForceWebFormSplashMode"], false) == true) {
        window.location.href = "<SITE_URL>";
    }
    else {

        //enable all future requests for the service (in case the external webservice library has disabled it for the session expire)
        ProjectService.DisableAllFutureRequests = false;
        GlobalService.DisableAllFutureRequests = false;
        ModelService.DisableAllFutureRequests = false;

        if ($mobileUtil.DashboardIsOpen()) {
            $mobileUtil.DashboardClose(null, null, null, false);
        }

        if ($mobileUtil.IsActiveDialogPage()) {

            //close the active dialog page to force refresh of the page (indirectly redirect to login page due to expired session, if applicable)
            $mobileUtil.CloseDialog();
        }
        else {
            module_loadTransition(enCEModule.GlobalSplash, enCEModuleViewType.List, "");
        }
    }

    return false;
}

function GoToUserProfile() {
    module_load(enCEModule.GlobalUser, null, "Profile");
    return false;
}

function GoToAdminHome() {
    module_loadTransition(enCEModule.AdminHome, enCEModuleViewType.List);
    return false;
}

function GoToSystemAdmin() {
    module_loadTransition(enCEModule.AdminModule, enCEModuleViewType.AdminList);
    return false;
}

function GoToModel(modelIDStr, options) {
    modelIDStr = util_forceString(modelIDStr, "");

    var _ctxURL = util_appendFragmentQS("", "ModelID", modelIDStr);

    module_loadNavContext(enCEModule.GlobalOnlineModel, null, "Model", _ctxURL);
}

function LogoutUser() {

    if (util_isFunction("private_onLogoutUser")) {
        private_onLogoutUser();
    }

    var _toggleCache = CACHE_MANAGER.ToggleCache;

    if (_toggleCache) {
        $cacheManager.ClearUpdateInterval();
        $cacheManager.IsConfirmOnUpdateCache = false;
    }

    GlobalService.LogoutUser(ext_requestSuccess(function (data) {

        //clear the flags for the online model page (i.e. force refresh when user logs back in)
        var _onlineModelPage = $mobileUtil.OnlineModelActivePage();

        _onlineModelPage.removeAttr("data-cattr-page-module-id")
                        .removeAttr("data-cattr-page-module-ctrl-name");

        _onlineModelPage.find("[data-role='content']").empty();//to avoid that the online model flashes for 1 second next time user logs in.

        var _disableCacheLogout = util_forceBool($cacheManager.IsDisableCacheLogout, false);

        if (_toggleCache && !_disableCacheLogout) {
            setTimeout(function () {
                blockUI("Please wait...ending user session");
            }, 0);

            $cacheManager.IsUserLogout = true;
            $cacheManager.StartUpdateInterval();
        }
        else {
            GoToLogin();
        }
    }));
}

function global_eventPageInit(options, callback) {

    options = util_extend({ "IsDisplayUnsupportedBrowserMessage": false, "CanDisableAccess": false }, options);

    options.IsDisplayUnsupportedBrowserMessage = util_forceBool(options.IsDisplayUnsupportedBrowserMessage, false);

    if (options.IsDisplayUnsupportedBrowserMessage && ($browserUtil.IsUnsupportedIE || ($browserUtil.IsIE && !$browserUtil.IsEdge))) {
        var $message = $("<div class='ApplicationFont DisableUserSelectable NotificationApplicationMessage NotificationTypeUnsupportedBrowser'>" +
                         "  <a data-role='button' data-icon='info' data-iconpos='notext' data-theme='transparent' data-inline='true' />" +
                         "  <div class='Title'>" + util_htmlEncode("Unsupported Browser Detected") + "</div>" +
                         "  <div class='Message'>" +
                         "      <div>" + util_htmlEncode("We noticed you are using an outdated version of Internet Explorer.") + "</div>" +
                         "      <div>" +
                         util_htmlEncode("We would recommend Microsoft Edge or Google Chrome for a better experience when using the <APP_NAME_JS>.") +
                         "      </div>" +
                         "  </div>" +
                         "</div>");

        var $body = $("body");

        $body.append($message);
        $message.trigger("create");

        if (options.CanDisableAccess) {
            $message.css({ "position": "fixed", "top": "0px", "left": "0px", "width": "100%", "height": "100%", "z-index": 999999, "cursor": "default" });
            $body.css("overflow", "hidden");
        }
        else {
            $message.click(function () {
                $message.slideUp("normal");
            });
        }
    }

    global_setAppTitle(callback);

    return false;
}

function global_userLoggedIn() {
    var _ret = (MODULE_MANAGER.Session && MODULE_MANAGER.Session.IsLoggedIn == true);

    return _ret;
}

function global_AuthUserID() {
    var _ret = enCE.None;

    if (global_userLoggedIn()) {
        _ret = MODULE_MANAGER.Session[enColCSessionStatusProperty.AuthUserID];
    }

    return _ret;
}

function global_AuthUserDetail() {
    var _ret = null;

    if (global_userLoggedIn()) {
        _ret = MODULE_MANAGER.Session[enColCSessionStatusProperty.User];
    }

    return _ret;
}

function global_IsCompanyEmailAddress(email) {
    var _arrSearch = ["@dymaxium.com", "@xcenda.com"];
    var _ret = false;

    email = util_forceString(email).toLowerCase();

    for (var i = 0; i < _arrSearch.length && !_ret; i++) {
        var _search = _arrSearch[i];

        _search = _search.toLowerCase();

        var _index = email.indexOf(_search);

        _ret = (_index >= 0 && _index == (email.length - _search.length));
    }

    return _ret;
}

function global_IsDymaxiumUser() {
    var _ret = false;
    var _user = global_AuthUserDetail();

    if (_user != null) {
        var _username = util_forceString(_user[enColUserProperty.Username]);

        _ret = global_IsCompanyEmailAddress(_username);
    }

    return _ret;
}

function global_userInRole(roleID) {
    var _ret = false;

    roleID = util_forceInt(roleID, enCE.None);

    if (global_userLoggedIn()) {
        var _sessionDetail = MODULE_MANAGER.Session;

        if (!util_isNullOrUndefined(_sessionDetail) && !util_isNullOrUndefined(_sessionDetail[enColCSessionStatusProperty.UserRoles])) {
            var _userRoles = _sessionDetail[enColCSessionStatusProperty.UserRoles];

            for (var i = 0; i < _userRoles.length; i++) {
                var _userRole = _userRoles[i];

                if (_userRole[enColUserRoleProperty.RoleID] == roleID) {
                    _ret = true;
                    break;
                }
            }
        }
    }

    return _ret;
}

function global_userIsSystemAdmin() {
    return global_userInRole(enCERoleBase.SystemAdmin);
}

function global_userIsAdmin() {
    return global_userInRole(enCERoleBase.Administrator);
}

function global_userIsAdminRoleBase() {
    return (global_userIsAdmin() || global_userIsSystemAdmin());
}

function global_isIntegratedLogin() {
    return (util_forceValidEnum("<IS_INTEGRATED_LOGIN>", enCETriState, enCETriState.No) == enCETriState.Yes);
}

function global_getUserSessionExtra(options) {

    options = util_extend({ "Property": null, "DefaultValue": null }, options);

    var _ret = null;

    if (global_userLoggedIn()) {
        _ret = MODULE_MANAGER.Session[enColCSessionStatusProperty.Extra];
    }

    //check if an item property is requested from the user session root data item
    if (options.Property) {
        if (_ret && !util_isNullOrUndefined(_ret[options.Property])) {
            _ret = _ret[options.Property];
        }
        else {
            _ret = options.DefaultValue;
        }
    }

    return _ret;
}

function global_configureResolutionView(context) {
    var _list = null;
    var _searchQuery = ".CToggleResolution";

    var _cssClass = global_getResolutionClass();

    if (context == null || context == undefined) {
        _list = $mobileUtil.ActivePage().find(_searchQuery);
    }
    else {
        _list = $(context).find(_searchQuery);
    }

    if (_cssClass != null) {
        _list.addClass(_cssClass);
    }
}

function global_getResolutionClass() {
    var _windowWidth = $(window).width();
    var _ret = null;

    if (_windowWidth >= 2048) { //2048x1536 
        //do nothing since default configured for this resolution
    }
    else if (_windowWidth >= 1024) {    //1024x768
        _ret = "CResolution_1024";
    }

    return _ret;
}

function global_configureDynamicImages(context) {
    if (context == null || context == undefined) {
        context = $mobileUtil.ActivePage();
    }

    var _list = context.find(".CImage");

    $.each(_list, function (index) {
        var _element = $(this);

        var _url = util_forceString(_element.css("background-image"), "");

        if (_url != "") {
            _url = util_replaceAll(_url, "url[(][\"']?", "");
            _url = util_replaceAll(_url, "[\"']?[)]$", "");

            _element.html("<img src='" + _url + "' />");

            //remove the background image CSS property
            _element.css("background-image", "none");

            _element.removeClass("CImage")
                        .addClass("CImageView");
        }

    });
}

var private_onlineModelExportSetting = null;    //function invokved by model specific code used to retrieve the export setting

function global_onlineModelFrame() {
    return document.getElementById("ifmModel").contentWindow;
}

//used in particular by the child frames to set the project specific method to retrieve the export setting for user
function global_onlineModelSetExportSettingFn(fn) {
    private_onlineModelExportSetting = fn;
}

function global_onlineModelExport(options, onExportCallback, onErrorCallback) {
    var _exportCallback = function () {
        if (onExportCallback) {
            onExportCallback();
        }
    };

    util_isOnline(function (isOnline) {

        if (!isOnline) {
            util_alert("The export feature is not available in offline mode. Please try again with a valid internet connection.");
            return;
        }

        util_log("Export online model");

        var _fnExport = function (exportSetting, callback, errorCallback) {
            var _settings = (exportSetting ? exportSetting : {});

            var _args = { "ChartIDs": "", "FieldIDs": "", "ChartWidth": "" };
            var _fnConcatenateValue = function (str, val) {
                str += (str != "" ? ";" : "") + val;

                return str;
            };

            if (_settings.Charts) {
                var _regexChart = new RegExp("<svg.+?>.+?</svg>");

                for (var _chartID in _settings.Charts) {
                    var _chartContent = _settings.Charts[_chartID];
                    var _match = _regexChart.exec(_chartContent);

                    if (_match != null && _match.length == 1) {
                        _chartContent = _match[0];
                    }

                    _settings.Charts[_chartID] = _chartContent;
                }
                for (var _chartID in _settings.Charts) {
                    _args.ChartIDs = _fnConcatenateValue(_args.ChartIDs, _chartID);
                    _args[_chartID] = util_htmlEncode(util_forceString(_settings.Charts[_chartID], ""));  //escape the HTML chart content
                }

                if (_settings.ChartWidth) {
                    for (var _chartID in _settings.Charts) {
                        _args.ChartWidth = _fnConcatenateValue(_args.ChartWidth, _settings.ChartWidth[_chartID]);
                    }
                }
            }

            if (_settings.Fields) {
                for (var _fieldID in _settings.Fields) {
                    _args.FieldIDs = _fnConcatenateValue(_args.FieldIDs, _fieldID);
                    _args[_fieldID] = util_htmlEncode(util_forceString(_settings.Fields[_fieldID], ""));   //escape the field value
                }
            }

            //include the configuration related settings
            var _config = _settings["Configuration"];

            if (_config != null && _config != undefined) {
                _config["IsExportWebsitePath"] = ($browserUtil.IsUserAgentIPad() ? enCETriState.Yes : enCETriState.No);

                for (var _prop in _config) {
                    _args[_prop] = _config[_prop];
                }
            }

            $.post("../home/exportReport.aspx", _args, function (data) {
                var _ret = null;

                try {
                    eval(data);
                    _ret = EXPORT_REPORT_RESULT;
                } catch (e) {
                    _ret = null;
                }

                unblockUI();

                if (callback) {

                    if (_ret) {
                        var _downloadPath = util_forceString(_ret.ExportPath, "");

                        if (_ret.Success && _downloadPath != "") {
                            var _exportURL = util_constructFileDownloadURL(_downloadPath);

                            var _ifmExport = $mobileUtil.GetElementByID("ifmModelExportContainer");
                            var _isFilePathExport = util_forceBool(_ret["IsFilePathExport"], true);
                            var _isPrint = util_forceBool(_ret["IsPrint"], false);

                            if (!_isFilePathExport) {
                                _exportURL = "<SITE_URL>_export/" + global_AuthUserID() + "/" + _downloadPath;
                            }
                            else if (_isPrint == true) {
                                _exportURL = util_appendQS(_exportURL, "IsAttachment", enCETriState.No);
                            }

                            _ret["URL"] = _exportURL;

                            if ($browserUtil.IsUserAgentIPad() || !_isFilePathExport || (_isPrint == true)) {
                                setTimeout(function () {
                                    var _window = window.open(_exportURL, "_blank", "height=1024,width=768");

                                    if (_isPrint) {
                                        _window.print();
                                    }
                                }, 500);
                            }
                            else {
                                if (_ifmExport.length == 1) {
                                    _ifmExport.attr("src", _exportURL);
                                }
                                else {
                                    var _window = window.open(_exportURL, "Export Report", "height=1024,width=768");
                                }
                            }
                        }
                        else {

                            //TODO: handle unexpected errors as a result of export report post
                        }
                    }

                    setTimeout(function () {
                        callback(_ret);
                    }, 0);
                }
            }).fail(function (jqXHR, txtStatus, err) {
                unblockUI();

                if (errorCallback) {

                    var _errOptions = { "jqXHR": jqXHR, "Status": txtStatus, "Error": err };
                    var _errorHTML = (jqXHR && jqXHR["responseText"] ? jqXHR["responseText"] : "");

                    if (_errorHTML != "") {

                        try {
                            _errorHTML = $("<div>" + _errorHTML + "</div>");

                            var _title = _errorHTML.find("title:first");
                            var _body = _errorHTML.find("body");

                            _errOptions["ErrorDetailTitleHTML"] = util_trim(_title.text());
                            _errOptions["ErrorDetailContentHTML"] = (_body.length == 0 ? _errorHTML.html() : _body.html());

                            var _contentHTML = "";

                            $.each($("<div>" + _errOptions.ErrorDetailContentHTML + "</div>").children(":not(style, title)"), function () {
                                _contentHTML += $(this).html();
                            });

                            if (_contentHTML != "") {
                                _errOptions["ErrorDetailContentHTML"] = _contentHTML;
                            }

                        } catch (e) {
                            _errorHTML = "";
                        }
                    }

                    errorCallback(_errOptions);
                }
                else {
                    util_alert(MSG_CONFIG.UnexpectedError, "Export Error");

                    if (callback) {
                        callback();
                    }
                }
            });
        };

        if (options == null || options == undefined) {

            setTimeout(function () {
                blockUI("Exporting...please wait.");
            }, 0);

            var _fn = private_onlineModelExportSetting;

            if (_fn) {
                _fn(_fnExport);
            }
        }
        else {
            _fnExport(options, function () {
                _exportCallback();
            }, onErrorCallback);
        }

    }); //end: util_isOnline
}

function global_getCookieKeyName(name) {
    
    //Note: modifications to this method must also be done to match the .NET version: GetCookieKeyName(...)

    return "Web_APP_<PROJECT_NO>_" + name + "_<COOKIE_SUFFIX>";
}

function global_setCookie(name, val, expireDays) {
    var _forceSSL = util_forceValidEnum("<IS_FORCE_SSL>", enCETriState, enCETriState.None);
    var _cookiePath = util_forceString("<COOKIE_PATH>", "");
    var _options = { path: "/", secure: (_forceSSL == enCETriState.Yes) };

    if (_cookiePath != "") {
        _options.path = _cookiePath;
    }

    if (!util_isNullOrUndefined(expireDays) && util_isNumeric(expireDays)) {
        expireDays = util_forceInt(expireDays, 0);

        _options["expires"] = expireDays;
    }

    name = global_getCookieKeyName(name);

    $.cookie(name, val, _options);
}

function global_getCookie(name) {
    name = global_getCookieKeyName(name);

    return $.cookie(name);
}

function global_removeCookie(name) {
    name = global_getCookieKeyName(name);

    $.removeCookie(name);
}

function global_configureLoginViewFromCookies(tbUsername, tbPassword, cbRememberMe, cbKeepLoggedIn, callback) {
    var _callback = function () {
        if (callback) {
            callback();
        }
    };

    util_isOnline(function (isOnline) {

        if (!isOnline) {
            _callback();
            return;
        }

        var _fnSetValue = function (obj, value, isCheckbox) {
            if (!util_isNullOrUndefined(obj)) {
                var _element = $(obj);

                isCheckbox = util_forceBool(isCheckbox, false);

                if (isCheckbox) {
                    $mobileUtil.CheckboxSetChecked(_element, util_forceBool(value, false));
                }
                else {
                    _element.val(util_forceString(value));
                }
            }
        };

        GlobalService.GetAppCookieDetail(false, function (data) {
            var _detail = data;

            if (!util_isNullOrUndefined(_detail)) {
                var _rememberMe = util_forceValidEnum(_detail[enColCApplicationCookieDetailProperty.RememberMe], enCETriState, enCETriState.No);

                if (_rememberMe == enCETriState.Yes) {
                    var _keepMeLoggedIn = util_forceValidEnum(_detail[enColCApplicationCookieDetailProperty.KeepMeLoggedIn], enCETriState, enCETriState.No);

                    _fnSetValue(tbUsername, _detail[enColCApplicationCookieDetailProperty.Username]);
                    _fnSetValue(tbPassword, _detail[enColCApplicationCookieDetailProperty.Password]);

                    _fnSetValue(cbKeepLoggedIn, _keepMeLoggedIn == enCETriState.Yes, true);
                    _fnSetValue(cbRememberMe, _rememberMe == enCETriState.Yes, true);
                }
            }

            _callback();
        }, function () {
            _callback();
        });

    }); //end: util_isOnline  
}

function global_setLoginCookie(rememberMe, keepMeLoggedIn, callback) {
    var _callback = function () {
        if (callback) {
            callback();
        }
    };

    rememberMe = util_forceBool(rememberMe, false);
    keepMeLoggedIn = util_forceBool(keepMeLoggedIn, false);

    //set the application cookie service (force from Session rather than cookie itself)
    APP.Service.Action({
        "c": "Framework", "m": "SetSessionCookies",
        "args": {
            "RememberMe": rememberMe,
            "KeepMeLoggedIn": keepMeLoggedIn
        }
    }, _callback,_callback);
}

function global_setFavIcon(iconImgPath, displayTitle) {
    displayTitle = util_forceString(displayTitle, "<APP_NAME_JS>");

    var _element = $("#icoAppFav");

    if (_element.length != 0) {
        _element.remove();
    }

    _element = $("<link>");

    _element.attr("id", "iconAppFav")
            .attr("type", "image/x-icon")
            .attr("rel", "shortcut icon")
            .attr("href", iconImgPath);

    $("head").first().append(_element);

    document.title = displayTitle;
}

function global_renderer_file_upload_error(refID, errMsg, options) {
    if (util_isDefined("private_renderer_file_upload_error")) {
        private_renderer_file_upload_error(refID, errMsg, options);
    }
    else {
        ClearMessages();
        AddUserError(errMsg);
        MessageCount(null, { "ScrollTopErrors": true });
    }
}

function global_unknownErrorAlert(callbackClose) {
    util_alert(MSG_CONFIG.UnexpectedError, "Application Error", callbackClose);
}

function global_isPresentationBuilderMode() {
    var _ret = false;

    if (parent != null && !util_isNullOrUndefined(parent["m_viewer"])) {
        _ret = true;
    }

    return _ret;
}

function global_presentationBuilderManager() {
    var _ret = null;

    if (global_isPresentationBuilderMode()) {
        _ret = parent["m_viewer"];
    }

    return _ret;
}

function global_langVersion() {
    return "<LANG_VERSION>";
}

function global_langGetTranslation(key, defaultVal, replaceTokens) {
    var _ret = defaultVal;

    if (util_isDefined("LANG_TRANSLATIONS")) {
        if (!util_isNullOrUndefined(LANG_TRANSLATIONS[key])) {
            _ret = LANG_TRANSLATIONS[key];
        }

        if (!util_isNullOrUndefined(replaceTokens) && !util_isNullOrUndefined(_ret)) {
            _ret = _ret + "";

            for (var _key in replaceTokens) {
                _ret = util_replaceAll(_ret, "%%" + _key + "%%", util_forceString(replaceTokens[_key]), true);
            }
        }
    }

    return _ret;
}

function global_extPresentationList(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "FilterHasVersions": enCETriState.None, "IsActive": enCETriState.None,
        "SortColumn": enColExternalPresentation.Default, "SortASC": true, "PageNum": enCEPaging.NoPaging, "PageSize": enCEPaging.NoPaging
    }, options);

    var _filterHasVersions = util_forceInt(options.FilterHasVersions, enCETriState.None);
    var _isActive = util_forceInt(options.IsActive, enCETriState.None);
    var _sortColumn = util_forceValidEnum(options.SortColumn, enColExternalPresentation, enColExternalPresentation.Default, true);
    var _sortASC = util_forceBool(options.SortASC, true);
    var _pageNum = util_forceInt(options.PageNum, enCEPaging.NoPaging);
    var _pageSize = util_forceInt(options.PageSize, enCEPaging.NoPaging);

    GlobalService.ExternalPresentationGetByForeignKey(_filterHasVersions, _isActive, _sortColumn, _sortASC, _pageSize, _pageNum, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

function global_extPresentationVersionList(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "PresentationID": enCE.None, "IsPresentationActive": enCETriState.None,
        "SortColumn": enColExternalPresentationVersion.Default, "SortASC": true, "PageNum": enCEPaging.NoPaging,
        "PageSize": enCEPaging.NoPaging
    }, options);

    var _presentationID = util_forceInt(options.PresentationID, enCE.None);
    var _isPresentationActive = util_forceInt(options.IsPresentationActive, enCETriState.None);
    var _sortColumn = util_forceValidEnum(options.SortColumn, enColExternalPresentationVersion, enColExternalPresentationVersion.Default, true);
    var _sortASC = util_forceBool(options.SortASC, true);
    var _pageNum = util_forceInt(options.PageNum, enCEPaging.NoPaging);
    var _pageSize = util_forceInt(options.PageSize, enCEPaging.NoPaging);

    GlobalService.ExternalPresentationVersionGetByForeignKey(_presentationID, _isPresentationActive, _sortColumn, _sortASC, _pageSize, _pageNum, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

function global_extPresentationVersionByPrimaryKey(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "VersionID": enCE.None, "DeepLoad": false }, options);

    var _versionID = util_forceInt(options.VersionID, enCE.None);
    var _deepLoad = util_forceBool(options.DeepLoad, false);

    GlobalService.ExternalPresentationVersionGetByPrimaryKey(_versionID, _deepLoad, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

function global_extPresentationVersionNavigationList(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "VersionID": enCE.None, "IsCachedResult": true }, options);

    var _versionID = util_forceInt(options.VersionID, enCE.None);
    var _isCachedResult = util_forceBool(options.IsCachedResult, true);

    GlobalService.ExternalPresentationVersionNavigationList(_versionID, _isCachedResult, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

function global_extTokenList(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "TokenTypeID": enCE.None, "Name": null, "SearchCriteria": null,
        "SortColumn": enColExternalToken.Default, "SortASC": true, "PageNum": enCEPaging.NoPaging, "PageSize": enCEPaging.NoPaging
    }, options);

    var _tokenTypeID = util_forceInt(options.TokenTypeID, enCE.None);
    var _name = util_forceString(options.Name, "");
    var _searchCriteria = util_forceString(options.SearchCriteria, "");
    var _sortColumn = util_forceValidEnum(options.SortColumn, enColExternalToken, enColExternalToken.Default, true);
    var _sortASC = util_forceBool(options.SortASC, true);
    var _pageNum = util_forceInt(options.PageNum, enCEPaging.NoPaging);
    var _pageSize = util_forceInt(options.PageSize, enCEPaging.NoPaging);

    GlobalService.ExternalTokenGetByForeignKey(_tokenTypeID, _name, _searchCriteria, _sortColumn, _sortASC, _pageSize, _pageNum, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

function global_extSectionList(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({
        "PresentationVersionID": enCE.None, "SortColumn": enColExternalSection.OrderNo, "SortASC": true, "PageNum": enCEPaging.NoPaging, "PageSize": enCEPaging.NoPaging
    }, options);

    var _presentationVersionID = util_forceInt(options.PresentationVersionID, enCE.None);
    var _sortColumn = util_forceValidEnum(options.SortColumn, enColExternalSection, enColExternalSection.OrderNo, true);
    var _sortASC = util_forceBool(options.SortASC, true);
    var _pageNum = util_forceInt(options.PageNum, enCEPaging.NoPaging);
    var _pageSize = util_forceInt(options.PageSize, enCEPaging.NoPaging);

    GlobalService.ExternalSectionGetByForeignKey(_presentationVersionID, _sortColumn, _sortASC, _pageSize, _pageNum, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

function global_extSectionByPrimaryKey(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "SectionID": enCE.None, "DeepLoad": false }, options);

    var _sectionID = util_forceInt(options.SectionID, enCE.None);
    var _deepLoad = util_forceBool(options.DeepLoad, false);

    GlobalService.ExternalSectionGetByPrimaryKey(_sectionID, _deepLoad, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

function global_extSubsectionPrimaryKey(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "SubsectionID": enCE.None, "DeepLoad": false }, options);

    var _subsectionID = util_forceInt(options.SubsectionID, enCE.None);
    var _deepLoad = util_forceBool(options.DeepLoad, false);

    GlobalService.ExternalSubsectionGetByPrimaryKey(_subsectionID, _deepLoad, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

function global_extSubsectionTypeList(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "SortColumn": enColExternalSubsectionType.Name, "SortASC": true, "PageNum": enCEPaging.NoPaging, "PageSize": enCEPaging.NoPaging
    }, options);

    var _sortColumn = util_forceValidEnum(options.SortColumn, enColExternalSubsectionType, enColExternalSubsectionType.Name, true);
    var _sortASC = util_forceBool(options.SortASC, true);
    var _pageNum = util_forceInt(options.PageNum, enCEPaging.NoPaging);
    var _pageSize = util_forceInt(options.PageSize, enCEPaging.NoPaging);

    GlobalService.ExternalSubsectionTypeGetByForeignKey(_sortColumn, _sortASC, _pageSize, _pageNum,
                                                        ext_requestSuccess(function (data) {
                                                            _callback(data);
                                                        }));
}

function global_extSectionSubsectionList(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "SectionID": enCE.None, "SubsectionID": enCE.None, "SubsectionTypeID": enCE.None, "PresentationVersionID": enCE.None,
        "SortColumn": enColExternalSectionSubsection.OrderNo, "SortASC": true, "PageNum": enCEPaging.NoPaging, "PageSize": enCEPaging.NoPaging
    }, options);

    var _sectionID = util_forceInt(options.SectionID, enCE.None);
    var _subsectionID = util_forceInt(options.SubsectionID, enCE.None);
    var _subsectionTypeID = util_forceInt(options.SubsectionTypeID, enCE.None);
    var _presVersionID = util_forceInt(options.PresentationVersionID, enCE.None);
    var _sortColumn = util_forceValidEnum(options.SortColumn, enColExternalSectionSubsection, enColExternalSectionSubsection.OrderNo, true);
    var _sortASC = util_forceBool(options.SortASC, true);
    var _pageNum = util_forceInt(options.PageNum, enCEPaging.NoPaging);
    var _pageSize = util_forceInt(options.PageSize, enCEPaging.NoPaging);

    GlobalService.ExternalSectionSubsectionGetByForeignKey(_sectionID, _subsectionID, _subsectionTypeID, _presVersionID, _sortColumn, _sortASC, _pageSize, _pageNum,
                                                           ext_requestSuccess(function (data) {
                                                               _callback(data);
                                                           }));
}

function global_extSectionDisplayName(sectionItem) {
    var _ret = "";

    if (!util_isNullOrUndefined(sectionItem)) {
        _ret = util_forceString(sectionItem[enColExternalSectionProperty.DisplayName]);

        if (_ret == "") {
            _ret = util_forceString(sectionItem[enColExternalSectionProperty.Name]);
        }
    }

    return _ret;
}

function global_extSubsectionDisplayName(subsectionItem) {
    var _ret = "";

    if (!util_isNullOrUndefined(subsectionItem)) {
        _ret = util_forceString(subsectionItem[enColExternalSubsectionProperty.DisplayName]);

        if (_ret == "") {
            _ret = util_forceString(subsectionItem[enColExternalSubsectionProperty.Name]);
        }
    }

    return _ret;
}

function global_extSubsectionReplaceTokensHTML(html, options) {
    var _tokens = {};

    options = util_extend({ "IsReverseReplace": false, "IsEncode": false, "ExtraTokens": null }, options);

    var _isReverseReplace = util_forceBool(options["IsReverseReplace"], false);

    var _fnAddToken = function (key, val) {

        if (!_isReverseReplace) {
            _tokens[key] = val;
        }
        else {
            _tokens[val] = key;
        }
    };

    html = util_forceString(html);

    _fnAddToken("%%EDITOR_IMAGE_BASE%%", "<SITE_URL>dynamic/external/images/");
    _fnAddToken("%%EDITOR_FILE_LINK_BASE%%", "<SITE_URL>dynamic/external/links/");
    _fnAddToken("%%EDITOR_EXT_TOKEN_FILE_BASE%%", "<SITE_URL>dynamic/external/token/");    //base path for files related to external tokens (e.g. placeholder reference files)
    _fnAddToken("data-attr-editor-template-type", DATA_ATTRIBUTE_RENDER);

    //include the additional tokens, if specified
    if (options["ExtraTokens"]) {
        var _extraTokens = options["ExtraTokens"];

        for (var _key in _extraTokens) {
            _fnAddToken(_key, _extraTokens[_key]);
        }
    }

    html = util_replaceTokens(html, _tokens);

    return html;
}

function global_extModelPropertyList(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "ModelID": null,
        "SortColumn": enColModelProperty.Default, "SortASC": true, "PageNum": enCEPaging.NoPaging, "PageSize": enCEPaging.NoPaging,
        "ServiceResultUnbox": false
    }, options);

    var _modelID = util_forceString(options.ModelID, "");
    var _sortColumn = util_forceValidEnum(options.SortColumn, enColModelProperty, enColModelProperty.Default, true);
    var _sortASC = util_forceBool(options.SortASC, true);
    var _pageNum = util_forceInt(options.PageNum, enCEPaging.NoPaging);
    var _pageSize = util_forceInt(options.PageSize, enCEPaging.NoPaging);

    GlobalService.ModelPropertyGetByForeignKey(_modelID, _sortColumn, _sortASC, _pageSize, _pageNum, ext_requestSuccess(function (data) {
        var _result = data;

        if (util_forceBool(options["ServiceResultUnbox"], false)) {
            _result = (data ? data.List : []);
        }

        _callback(_result);
    }));
}

function global_extModelScenarioContentGetByPrimaryKey(options, callback, fnFailure) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "ModelScenarioContentID": enCE.None, "DeepLoad": false }, options);

    GlobalService.ModelScenarioContentGetByPrimaryKey(null, options.ModelScenarioContentID, options.DeepLoad, ext_requestSuccess(function (data) {
        _callback(data);
    }), fnFailure);
}

function global_extModelScenarioContentSave(options, callback, fnFailure) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    //NOTE: support for list of model scenario content allowed via the "ModelScenarioContent" (depending on whether it is an array, the appropriate save method is invoked)
    options = util_extend({ "ModelScenarioContent": null, "DeepSave": false }, options);

    if ($.isArray(options.ModelScenarioContent)) {

        options = util_extend({ "MethodRequest": null, "DeepSave": false, "ModelScenarioContents": options.ModelScenarioContent, "ScenarioID": enCE.None }, options);

        GlobalService.ModelScenarioContentSaveAll(options, function (data) {
            _callback(data);
        }, fnFailure);
    }
    else {
        GlobalService.ModelScenarioContentSave(null, options.ModelScenarioContent, options.DeepSave, ext_requestSuccess(function (data) {
            _callback(data);
        }), fnFailure);
    }
}

function global_extModelScenarioContentDelete(options, callback, fnFailure) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({ "ModelScenarioContent": null }, options);

    GlobalService.ModelScenarioContentDelete(null, options.ModelScenarioContent, ext_requestSuccess(function (data) {
        _callback(data);
    }), fnFailure);
}

function global_extModelScenarioContentGetByForeignKey(options, callback) {
    var _callback = function (data) {
        if (callback) {
            callback(data);
        }
    };

    options = util_extend({
        "ModelContentTypeID": enCE.None,
        "ScenarioID": enCE.None, "Name": null,
        "ModelID": null,
        "SortColumn": enColModelScenarioContent.Default,
        "SortAscending": true, "PageNum": enCEPaging.NoPaging, "PageSize": enCEPaging.NoPaging,
        "ServiceResultUnbox": false
    }, options);

    var _sortColumn = util_forceValidEnum(options.SortColumn, enColModelScenarioContent, enColModelScenarioContent.Default, true);
    var _sortASC = util_forceBool(options.SortAscending, true);
    var _pageNum = util_forceInt(options.PageNum, enCEPaging.NoPaging);
    var _pageSize = util_forceInt(options.PageSize, enCEPaging.NoPaging);

    GlobalService.ModelScenarioContentGetByForeignKey(null, options.ModelContentTypeID, options.ScenarioID, options.Name, options.ModelID, _sortColumn, _sortASC, _pageSize, _pageNum,
                                                      ext_requestSuccess(function (data) {
                                                          var _result = data;

                                                          if (util_forceBool(options["ServiceResultUnbox"], false)) {
                                                              _result = (data ? data.List : []);
                                                          }

                                                          _callback(_result);
                                                      }));
}

function global_onVideoEnd(obj, player) {
    var _playerInstance = player; //reference to the video player instance with support for API calls

    var _videoElement = $(obj);
    var _config = {};

    var _list = _videoElement.find("source");
    var _arrSources = [];

    $.each(_list, function (indx) {
        var _source = $(this);

        _arrSources.push({ "Type": util_forceString(_source.attr("type")), "Source": util_forceString(_source.attr("src")) });
    });

    _config["ID"] = util_forceString(_videoElement.attr("id"));
    _config["SourceList"] = _arrSources;
    _config["Player"] = _playerInstance;

    if (util_isFunction("private_onVideoEnd")) {
        private_onVideoEnd(obj, _config);
    }
}

function global_onVideoPlayerReady(player) {
    var _playerInstance = player; //reference to the video player instance with support for API calls

    if (util_isFunction("private_onVideoPlayerReady")) {
        private_onVideoPlayerReady(_playerInstance);
    }
}

/**********************************************************************************************************************/
/****************************** SECTION START: jQuery Mobile **********************************************************/
/**********************************************************************************************************************/
$(document).bind("pagebeforechange", function (e, data) {

    //only handle changePage() calls where the caller is requesting to load a page by URL (string)
    if (typeof data.toPage === "string") {
        var _options = data.options;

        //check if options are provided and the executing element of the change page (the link) is available, if applicable
        if (_options && _options.link) {
            var _element = $(_options.link);

            var _renderer = _element.attr(DATA_ATTRIBUTE_RENDER);

            var _fnLoadModule = function (opts) {

                opts = util_extend({ "ContentHref": "" }, opts);

                var _moduleParams = null;
                var _selector = _element.attr(DATA_ATTR_MODULE_PARAMS_DOM_SELECTOR);
                var _moduleContentHref = util_forceString(_element.attr(DATA_ATTRIBUTE_CONTEXT_HREF), "");

                if (util_forceString(_selector) == "") {
                    _moduleParams = _element.data(ELEMENT_DOM_DATA_MODULE_PARAMS);
                }
                else {
                    _moduleParams = _element.closest(_selector)
                                            .data(ELEMENT_DOM_DATA_MODULE_PARAMS);
                }

                if (_moduleContentHref == "") {
                    _moduleContentHref = util_forceString(opts["ContentHref"], "");
                }

                if (_moduleContentHref != "") {
                    module_load(null, null, null, _moduleContentHref, null, null, { "Parameters": _moduleParams });
                }

            };  //end: _fnLoadModule

            //force current renderer mode to dialog/module link mode if it is module navigation element
            if (_renderer == "module_navigation") {

                if (util_forceInt(_element.attr("data-attr-is-dialog"), enCETriState.Yes) == enCETriState.Yes) {
                    _renderer = "dialog";
                }
                else {
                    _renderer = "module_link";
                }

                var _contentHref = _element.attr(DATA_ATTRIBUTE_CONTEXT_HREF);

                //configure dynamic content href based on whether it is specified (in which case no changes needed), or use extended parameters to construct the URL
                if (util_forceString(_contentHref) == "") {

                    var _moduleID = util_forceInt(_element.attr("data-param-ModuleID"), enCE.None);
                    var _viewType = util_forceValidEnum(_element.attr("data-param-ModuleViewType"), enCEModuleViewType, enCEModuleViewType.List, true);
                    var _ctrlName = util_forceString(_element.attr("data-param-ControlName"), "");

                    var _editID = util_forceInt(_element.attr("data-param-EditID"), enCE.None);

                    if (_moduleID == enCEModule.GlobalDynamicTemplate) {
                        _contentHref = util_constructTemplateModuleURL(_viewType, _element.attr("data-param-TemplateParams"), {
                            "SourceModuleID": _element.attr("data-param-TemplateSourceModuleID")
                        });
                    }
                    else {
                        _contentHref = util_constructModuleURL(_moduleID, _viewType, _ctrlName);
                    }

                    _contentHref = util_appendFragmentQS(_contentHref, "EditID", _editID);

                    var _suffixQS = util_forceString(_element.attr("data-param-ExtQS"));

                    if (_suffixQS != "") {
                        _contentHref += (_suffixQS.indexOf("&") < 0 ? "&" : "") + _suffixQS;
                    }

                    _element.attr(DATA_ATTRIBUTE_CONTEXT_HREF, _contentHref);
                }

            }

            switch (_renderer) {

                case "dialog":
                    var _fn = function () {
                        var _dialogComponentType = $mobileUtil.Configuration.Dialog.DefaultDialogComponentType;

                        if (_dialogComponentType == enCDialogComponentType.Default) {
                            $mobileUtil.DialogConfigure(_element);  //configure the dialog view before it being shown
                        }
                        else if (_dialogComponentType == enCDialogComponentType.Inline) {

                            if (util_forceInt(_element.attr("data-attr-allow-event-propagation"), enCETriState.None) != enCETriState.Yes) {
                                e.preventDefault();
                            }

                            if ($mobileUtil.DashboardIsOpen()) {
                                $mobileUtil.DashboardClose(null, null, null, false);
                            }

                            var _isDialogNoConflictView = (util_forceInt(_element.attr(DATA_ATTR_DIALOG_IS_NO_CONFLICT_VIEW), enCETriState.None) == enCETriState.Yes);

                            $mobileUtil.PopupOpen({
                                "IsPositionTopCenter": true, "blankContent": $mobileUtil.Configuration.Dialog.LayoutHTML, "HeaderTitle": "Popup",
                                "Trigger": _element,
                                "callbackOpen": function () {

                                    $mobileUtil.DialogConfigure(_element);  //configure the dialog view before it is updated with the module view

                                    var _dialog = $mobileUtil.DialogContainer();
                                    var _contentHref = util_forceString(_dialog.attr(DATA_ATTRIBUTE_CONTEXT_HREF), "");

                                    //override the active page context to be the dialog container
                                    $mobileUtil.OverrideActivePageContext(_dialog);

                                    //if the dialog is designed and configured to be in no conflict view (i.e. is self contained and managed without code conflicts)
                                    //allow the dialog to disable refresh on close callback
                                    if (_isDialogNoConflictView) {
                                        _dialog.attr(DATA_ATTR_PAGE_FORCE_NO_REFRESH_DEFAULT, enCETriState.Yes);

                                        //set flag on the dialog container that it is currently in no conflict mode
                                        _dialog.attr(DATA_ATTR_DIALOG_IS_NO_CONFLICT_VIEW, enCETriState.Yes);
                                    }

                                    MODULE_MANAGER.Current.SetBreadcrumb(); //store the current view as a breadcrumb state

                                    util_log("pagechange :: dialog content URL - inline dialog - " + _contentHref);

                                    //(optional) process any dialog load events from trigger element
                                    var _dialogLoadCallback = _element.data("OnDialogLoadCallback");

                                    if (_dialogLoadCallback) {
                                        _dialogLoadCallback();
                                    }

                                    _fnLoadModule({ "ContentHref": _contentHref });
                                },

                                "callbackClose": function () {
                                    var _dialogActivePage = $mobileUtil.ActivePage();

                                    //must clear the active page override
                                    $mobileUtil.OverrideActivePageContext(null);

                                    var _refreshPageMode = util_forceValidEnum(_dialogActivePage.attr(DATA_ATTR_PAGE_REFRESH_MODE), enCPageRefreshMode, enCPageRefreshMode.None);
                                    _dialogActivePage.removeAttr(DATA_ATTR_PAGE_REFRESH_MODE);

                                    var _forceNoRefreshDefault = util_forceValidEnum(_dialogActivePage.attr(DATA_ATTR_PAGE_FORCE_NO_REFRESH_DEFAULT), enCETriState, enCETriState.No);
                                    _dialogActivePage.removeAttr(DATA_ATTR_PAGE_FORCE_NO_REFRESH_DEFAULT);

                                    var _defaultRefreshMode = (_forceNoRefreshDefault == enCETriState.Yes ? enCPageRefreshMode.None : enCPageRefreshMode.View);

                                    //important! if the active page is a dialog then must force the new page to refresh itself at the least, if applicable
                                    //(to ensure any JavaScript functions that were overridden for dialog call be reverted back to correct state)
                                    _refreshPageMode = util_forceValidEnum(_refreshPageMode, enCPageRefreshMode, _defaultRefreshMode);

                                    if (_refreshPageMode == enCPageRefreshMode.None) {
                                        _refreshPageMode = _defaultRefreshMode;
                                    }

                                    var _handled = true;

                                    switch (util_forceInt(_refreshPageMode, null)) {
                                        case enCPageRefreshMode.View:
                                            var _isRestoreBreadcrumb = !util_isNullOrUndefined(MODULE_MANAGER.Current.PreviousBreadcrumb);

                                            $mobileUtil.ReloadActivePage(null, _isRestoreBreadcrumb); //refresh the current view
                                            break;

                                        case enCPageRefreshMode.Window:
                                            $mobileUtil.ReloadBrowserWindow();
                                            break;

                                        default:
                                            _handled = false;
                                            break;
                                    }

                                    if (!_handled && (_isDialogNoConflictView || (_refreshPageMode == enCPageRefreshMode.Controller))) {
                                        var _isRestoreBreadcrumb = !util_isNullOrUndefined(MODULE_MANAGER.Current.PreviousBreadcrumb);

                                        if (_isRestoreBreadcrumb) {

                                            //restore the breadcrumb state without reloading the entire view
                                            MODULE_MANAGER.Current.RestoreBreadcrumb({ "IsReload": false, "IsRestoreScrollTop": true });

                                            ext_refreshUserSessionDetail(function () {

                                                //force the view controller(s) to reload itself
                                                $mobileUtil.Content().find("[" + util_htmlAttribute(DATA_ATTR_IS_VIEW_CONTROLLER, enCETriState.Yes) + "]")
                                                                     .trigger("events.controller_reload", { "From": "dialog_close" });
                                            });                                                                                       
                                        }
                                        else {
                                            $mobileUtil.ReloadActivePage(null, _isRestoreBreadcrumb); //refresh the current view
                                        }
                                    }
                                }
                            });

                            return false;
                        }
                    };

                    if ($mobileUtil.IsElementOnlineRequired(_element)) {

                        util_isOnline(function (isOnline) {

                            if (isOnline) {
                                _fn();
                            }
                            else {
                                util_execOnlineFeature();
                                e.preventDefault();
                                return false;
                            }

                        });                        
                    }
                    else {
                        _fn();
                    }

                    break;

                case "module_link":
                    
                    _fnLoadModule({ "ContentHref": _element.attr("href") });
                    e.preventDefault();
                    return false;
                    break;
            }
        }
    }
    else {

        //page to be changed to is an object and as such copy over the required attributes from the current active page to the new page
        var _toPage = $(data.toPage);
        var _activePage = $mobileUtil.ActivePage();

        if (_activePage) {
            var _refreshPageMode = _activePage.attr(DATA_ATTR_PAGE_REFRESH_MODE);

            if ($mobileUtil.IsActiveDialogPage()) {

                var _forceNoRefreshDefault = util_forceValidEnum(_activePage.attr(DATA_ATTR_PAGE_FORCE_NO_REFRESH_DEFAULT), enCETriState, enCETriState.No);
                var _defaultRefreshMode = (_forceNoRefreshDefault == enCETriState.Yes ? enCPageRefreshMode.None : enCPageRefreshMode.View);

                //important! if the active page is a dialog then must force the new page to refresh itself at the least, if applicable
                //(to ensure any JavaScript functions that were overridden for dialog call be reverted back to correct state)
                _refreshPageMode = util_forceValidEnum(_refreshPageMode, enCPageRefreshMode, _defaultRefreshMode);

                if (_refreshPageMode == enCPageRefreshMode.None) {
                    _refreshPageMode = _defaultRefreshMode;
                }

                _toPage.attr(DATA_ATTR_PAGE_REFRESH_MODE, _refreshPageMode);
            }
            else {
                _toPage.attr(DATA_ATTR_PAGE_REFRESH_MODE, _refreshPageMode);
            }

            //remove the attributes from the active page since no longer needed
            _activePage.removeAttr(DATA_ATTR_PAGE_REFRESH_MODE);
            _activePage.removeAttr(DATA_ATTR_PAGE_FORCE_NO_REFRESH_DEFAULT);
        }
    }
});

$(document).bind("pagechange", function (e, data) {

    var _page = $mobileUtil.ActivePage();
    var _dataRole = _page.attr("data-role");
    var _fromPage = (data && data["options"] && data.options["fromPage"] ? $(data.options.fromPage) : null);

    if (_dataRole == "dialog") {
        var _contentHref = util_forceString(_page.attr(DATA_ATTRIBUTE_CONTEXT_HREF), "");

        if (_contentHref != "") {

            MODULE_MANAGER.Current.SetBreadcrumb(); //store the current view as a breadcrumb state

            util_log("pagechange :: dialog content URL - " + _contentHref);
            module_load(null, null, null, _contentHref);
        }
    }
    else if (_dataRole == "page" &&
             (_fromPage == null || (_fromPage != null && _fromPage.length == 1 && $(data.options.fromPage).attr("id") != $mobileUtil.DialogContainer().attr("id")))
            ) {

        var _body = $($("#rootModuleBody").first());

        var _isInit = util_forceValidEnum(_body.attr("data-cattr-module-manager-init"), enCETriState, enCETriState.Yes);

        if (_isInit == enCETriState.Yes) {
            _body.attr("data-cattr-module-manager-init", enCETriState.No);
        }
        else {
            if (util_forceInt(_page.attr("data-attr-page-clone"), enCETriState.None) == enCETriState.Yes) {
                var _id = util_forceString(_fromPage.attr("id"));

                if (_id != "") {

                    _fromPage.removeAttr("id");
                    _fromPage.attr("data-attr-page-clone", enCETriState.Yes);

                    _page.attr("id", _id);
                }

                _page.removeAttr("data-attr-page-clone");
            }
            else {
                module_load();
            }
        }
    }
    else {

        var _refreshMode = util_forceValidEnum(_page.attr(DATA_ATTR_PAGE_REFRESH_MODE), enCPageRefreshMode, enCPageRefreshMode.None);

        _page.removeAttr(DATA_ATTR_PAGE_REFRESH_MODE);
        _page.removeAttr(DATA_ATTR_PAGE_FORCE_NO_REFRESH_DEFAULT);

        switch (util_forceInt(_refreshMode, null)) {
            case enCPageRefreshMode.View:
                var _isRestoreBreadcrumb = !util_isNullOrUndefined(MODULE_MANAGER.Current.PreviousBreadcrumb);

                $mobileUtil.ReloadActivePage(null, _isRestoreBreadcrumb); //refresh the current view
                break;

            case enCPageRefreshMode.Window:
                $mobileUtil.ReloadBrowserWindow();
                break;

            default:
                break;
        }
    }
});

$(document).bind("pagebeforeshow", function (e, data) {
    var _page = $mobileUtil.ActivePage();

    if (util_forceInt(_page.attr("data-attr-page-clone"), enCETriState.None) == enCETriState.Yes) {
        $mobileUtil.refresh(_page);
    }
});

$(document).bind("pageshow", function (e, data) {
    var _page = $mobileUtil.ActivePage();

    if (util_forceInt(_page.attr("data-attr-page-clone"), enCETriState.None) == enCETriState.Yes) {
        $mobileUtil.PageLoadComplete();
    }
});

$(document).bind("swipeleft", function () {
    MODULE_MANAGER.DelegateSettings.ExecEvent(enCDelegateType.SwipeLeft);
});

$(document).bind("swiperight", function () {
    MODULE_MANAGER.DelegateSettings.ExecEvent(enCDelegateType.SwipeRight);
});

/**********************************************************************************************************************/
/****************************** SECTION END: jQuery Mobile ************************************************************/
/**********************************************************************************************************************/

var CEventQueue = function (option) {
    option = util_extend({ "List": null }, option);

    this["List"] = (option.List || []);
};

CEventQueue.prototype.Set = function (option) {

    option = util_extend({ "List": null }, option);

    this["List"] = (option.List || []);
};

CEventQueue.prototype.Add = function (fn) {

    var _list = this["List"];

    if (!_list) {
        _list = [];
        this["List"] = _list;
    }

    _list.push(fn);
};

CEventQueue.prototype.Run = function (option) {
    option = util_extend({ "List": undefined, "Callback": null }, option);

    if (option.List) {
        this["List"] = option.List;
    }

    var _arr = (this.List || []);

    var _fn = function () {

        if (_arr.length == 0) {
            if (option.Callback) {
                option.Callback();
            }
        }
        else {
            var _fnLoad = _arr.shift();

            _fnLoad(_fn);
        }
    };

    _fn();
};

$(function () {
    util_configureKeyPress(document, KEY_CODES.ESC, function () {

        //the ESC key has been pressed, so check that the active page is a popup, dialog, or dashboard
        if ($mobileUtil.PopupIsOpen()) {

            //ensure the popup is not in a non-dimissable state
            if ($mobileUtil.PopupContainer().hasClass("PopupNonDimissable") == false) {
                $mobileUtil.PopupClose(null, true);
            }
        }
        else if ($mobileUtil.IsActiveDialogPage()) {
            $mobileUtil.CloseDialog();
        }
        else if ($mobileUtil.DashboardIsOpen()) {
            $mobileUtil.DashboardClose({ "ForceContextSettings": true });
        }
        else {
            MODULE_MANAGER.DelegateSettings.ExecEvent(enCDelegateType.KeyEsc);
        }
    }, true);

    //set the default style for the blockUI's overlay
    $.blockUI.defaults.overlayCSS.backgroundColor = "transparent";
    $.blockUI.defaults.css["borderRadius"] = "0.5em";
    $.blockUI.defaults.css["backgroundColor"] = "#000000";

    //bind default popup events
    var _popupContainer = $mobileUtil.PopupContainer();

    _popupContainer.bind({
        popupafteropen: function (event, ui) {
            var _popup = $mobileUtil.PopupContainer();
            var _callbackJS = util_forceString(_popup.attr(DATA_ATTR_POPUP_EVENT_CALLBACK_OPEN));

            if (_callbackJS != "") {
                var _fnResult = eval(_callbackJS);

                //based on the eval result of the callback JS, if it is a function then it needs to be explicitly invoked
                if ($.isFunction(_fnResult)) {
                    _fnResult();
                }
            }
        }
    });

    if (util_forceValidEnum(_popupContainer.attr("data-attr-popup-is-init"), enCETriState, enCETriState.No) != enCETriState.Yes) {
        _popupContainer.attr("data-attr-popup-is-init", enCETriState.Yes);

        _popupContainer.on({
            popupafteropen: function () {

            },
            popupafterclose: function () {
                var _container = $(this);
                var _callbackCloseJS = util_forceString(_container.attr(DATA_ATTR_POPUP_EVENT_CALLBACK_CLOSE));

                _callbackCloseJS = util_isFunction(_callbackCloseJS) ? eval(_callbackCloseJS) : null;

                if (!util_isNullOrUndefined(_callbackCloseJS)) _callbackCloseJS();

                if (util_forceValidEnum(_container.attr("data-attr-popup-is-close-trigger"), enCETriState, enCETriState.None) == enCETriState.Yes) {
                    _container.removeAttr("data-attr-popup-is-close-trigger");
                    $mobileUtil.ConfigureDialogStateURL();
                }
            }
        });
    }

    //configure the scroll to top
    var _scrollTop = $("#clScrollBackTop");

    _scrollTop.hide();

    if ($browserUtil.IsUserAgentIPad()) {
        var $body = $("body");
        var $document = $(document);

        $body.off("events.toggleScrollTopAbsolute");
        $body.on("events.toggleScrollTopAbsolute", function (e, args) {
            args = util_extend({ "IsEnabled": false }, args);

            $body.toggleClass("ScrollTopPositionAbsolute", args.IsEnabled);
        });

        $document.off("focus.scrollTopInput");
        $document.off("blur.scrollTopInput");

        $document.on("focus.scrollTopInput", "input", function () {
            $body.trigger("events.toggleScrollTopAbsolute", { "IsEnabled": true });
        });
        
        $document.on("blur.scrollTopInput", "input", function () {
            $body.trigger("events.toggleScrollTopAbsolute", { "IsEnabled": false });
        });
    }

    $(window).scroll(function () {
        if ($mobileUtil.Configuration.ToggleScrollTop) {
            var _scrollY = util_forceInt($(window).scrollTop(), 0);
            var _windowHeight = $(window).height();
            var _isScrolledToBottom = (_scrollY + _windowHeight >= $(document).height());

            var _header = $mobileUtil.Header();
            var _footer = $mobileUtil.Footer();

            var _headerHeight = (_header.length == 1 ? _header.height() : 100);
            var _footerHeight = (_footer.length == 1 ? _footer.height() : 0);

            if (_isScrolledToBottom) {
                _scrollTop.css('padding-bottom', _footerHeight + 'px');
            } else {
                _scrollTop.css('padding-bottom', '');
            }

            if (_scrollY > _headerHeight) {
                _scrollTop.fadeIn();
            } else {
                _scrollTop.fadeOut();
            }
        }
        else if (_scrollTop.is(":visible")) {
            _scrollTop.hide();
        }
    });

    _scrollTop.unbind("click");

    _scrollTop.click(function () {
        var _position = $mobileUtil.ScrollPosition();

        _position.Top = 0;

        if (!$browserUtil.IsUserAgentIPad())
            $mobileUtil.AnimateSmoothScroll(null, 800, _position);
        else
            window.scrollTo(window.scrollX, 0);

        return false;
    });


    //configure model input events
    $("body").off("focus", "input.ModelInput");
    $("body").on("focus", "input.ModelInput", model_eventOnFocus);

    $("body").off("blur", "input.ModelInput");
    $("body").on("blur", "input.ModelInput", model_eventOnBlur);

});