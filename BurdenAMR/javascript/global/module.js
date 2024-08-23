var MODULE_MANAGER = {
    IsEnableDebugLog: false,
    ToggleContentLineBreak: true,
    module_util_log: function (msg, logType) {
        if (MODULE_MANAGER.IsEnableDebugLog) {
            util_log(msg, logType);
        }
    },
    module_util_logError: function (msg) {
        if (MODULE_MANAGER.IsEnableDebugLog) {
            util_logError(msg);
        }
    },
    Session: null,
    Redirect: {
        "Enabled": false, "Name": null, "View": null,
        "IsActiveView": function () {
            var _valid = false;
            var _view = MODULE_MANAGER.Redirect.View;

            if (_view && module_isCurrentView(_view[enColCModuleRedirectParamProperty.ModuleID], _view[enColCModuleRedirectParamProperty.ControlName],
                                              _view[enColCModuleRedirectParamProperty.ModuleViewType])
                ) {
                _valid = true;
            }

            return _valid;
        },
        "Clear": function () {
            MODULE_MANAGER.Redirect.Enabled = false;
            MODULE_MANAGER.Redirect.Name = null;
            MODULE_MANAGER.Redirect.View = null;
        },
        "MergeViewParam": function (defaultVal) {
            if (!defaultVal) {
                defaultVal = {};
            }

            if (MODULE_MANAGER.Redirect.View) {
                try {
                    var _params = MODULE_MANAGER.Redirect.View[enColCModuleRedirectParamProperty.Parameters];

                    if (util_isNullOrUndefined(_params) == false) {
                        if (typeof _params === "string") {
                            _params = util_parse(_params);
                        }
                        else if (typeof _params !== "object") {
                            _params = null;
                        }
                    }

                    util_extend(defaultVal, _params, true, true);
                } catch (e) {
                }
            }
        }
    },
    DebugHomeOption: null,
    Current: { ModuleID: enCEModule.GlobalSplash, ControlName: null, ModuleViewType: enCEModuleViewType.List,
        LayoutType: enCLayoutType.Global, Parameters: null,
        GetKey: function (moduleCurrent) {
            var _ret = "";
            var _current = (util_isNullOrUndefined(moduleCurrent) ? MODULE_MANAGER.Current : moduleCurrent);

            _ret += "ID-" + _current.ModuleID;   //module ID

            _ret += (util_isNullOrUndefined(_current.ModuleViewType) ? "" : ("_VIEW-" + _current.ModuleViewType)); //module view type, if applicable

            _ret += (util_isNullOrUndefined(_current.ControlName) ? "" : ("_CTRL-" + _current.ControlName));

            return _ret;
        },
        PreviousBreadcrumb: null,
        SetBreadcrumb: function () {
            var _temp = {};
            var _current = MODULE_MANAGER.Current;

            _temp = util_stringify(_current);

            //need to persist the parameters seperately (as it may be a complex object with functions which are not supported with stringify)
            MODULE_MANAGER.Current.PreviousBreadcrumb = {
                "Details": util_parse(_temp), "Parameters": _current.Parameters, "DelegateEvents": MODULE_MANAGER.DelegateSettings.Events,
                "ScrollTop": $(window).scrollTop()
            };
        },
        RestoreBreadcrumb: function (options) {

            options = util_extend({ "IsReload": true, "IsRestoreScrollTop": false }, options);

            var _restore = MODULE_MANAGER.Current.PreviousBreadcrumb;

            //after restoring the breadcrumb must clear the previous state
            MODULE_MANAGER.Current.PreviousBreadcrumb = null;

            if (!util_isNullOrUndefined(_restore)) {
                var _details = _restore.Details;

                MODULE_MANAGER.Current.LayoutType = null;

                if (options.IsReload) {
                    module_loadParam(_details.ModuleID, _details.ModuleViewType, _details.ControlName, _restore.Parameters, { "RestoreDelegateEvents": _restore.DelegateEvents });
                }
                else {

                    //as the reload of the view is not required, perform a property based restore of the module manager current state
                    MODULE_MANAGER.Current.ModuleID = _details["ModuleID"];
                    MODULE_MANAGER.Current.ControlName = _details["ControlName"];
                    MODULE_MANAGER.Current.LayoutType = _details["LayoutType"];
                    MODULE_MANAGER.Current.ModuleViewType = _details["ModuleViewType"];

                    MODULE_MANAGER.Current.Parameters = _restore["Parameters"];

                    MODULE_MANAGER.DelegateSettings.Events = _restore.DelegateEvents;

                    if (options.IsRestoreScrollTop) {
                        $mobileUtil.AnimateSmoothScroll(null, 750, { "Top": _restore["ScrollTop"] });
                    }
                }
            }
        }
    },
    Navigation: {
        ViewState: {},
        GetDefaultStateQS: function (moduleCurrent, urlQS) {
            var _ret = "";

            if (util_isNullOrUndefined(moduleCurrent) && util_isNullOrUndefined(urlQS)) {
                var _url = $.url(util_activePageURL());

                urlQS = _url.attr("query"); //attempt to store the query string for the current URL

                if (urlQS == "") {
                    urlQS = _url.attr("fragment");  //store fragment since no query string is available
                }
            }
            else {
                _ret = urlQS;
            }

            return _ret;
        },
        SetCurrentStateQS: function (moduleCurrent, urlQS) {
            var _key = MODULE_MANAGER.Current.GetKey(moduleCurrent);

            urlQS = MODULE_MANAGER.Navigation.GetDefaultStateQS(moduleCurrent, urlQS);

            MODULE_MANAGER.Navigation.ViewState[_key] = urlQS;
        },
        GetCurrentStateQS: function (searchModuleCurrent) {
            var _key = MODULE_MANAGER.Current.GetKey(searchModuleCurrent);

            return MODULE_MANAGER.Navigation.ViewState[_key];
        },
        SetItemQS: function (moduleCurrent, keyQS, value) {
            var _state = MODULE_MANAGER.Navigation.GetCurrentStateQS(moduleCurrent);

            _state = MODULE_MANAGER.Navigation.GetDefaultStateQS(moduleCurrent, _state);

            _state = util_constructURL([keyQS], _state);    //construct URL disregarding the query string key being set

            //check if a value for the query string key is provided (otherwise it is regarded as removing the query string key)
            if (!util_isNullOrUndefined(value)) {
                _state = util_appendFragmentQS(_state, keyQS, value);
            }

            MODULE_MANAGER.Navigation.SetCurrentStateQS(moduleCurrent, _state);
        }
    },
    Cache: {
        Lookup: {}, //cached storage for module content lookup
        GetLookupItem: function (moduleID) {
            var _ret = MODULE_MANAGER.Cache.Lookup[moduleID];

            if (util_isNullOrUndefined(_ret)) {
                _ret = {};
                MODULE_MANAGER.Cache.Lookup[moduleID] = _ret;
            }

            return _ret;
        },
        Get: function (moduleID, url) {
            var _ret = null;
            var _entry = MODULE_MANAGER.Cache.GetLookupItem(moduleID);

            url = util_forceString(url);

            if (url != "") {
                _ret = _entry[url];
            }

            return _ret;
        },
        Set: function (moduleID, url, content) {
            var _entry = MODULE_MANAGER.Cache.GetLookupItem(moduleID);

            if (util_forceString(url) != "" && CACHE_MANAGER.ToggleCache) {
                _entry[url] = content;
            }
        }
    },
    DelegateSettings: {
        Init: function (isClear) {
            if (util_forceBool(isClear, false) || util_isNullOrUndefined(MODULE_MANAGER.DelegateSettings.Events)) {
                MODULE_MANAGER.DelegateSettings.Events = {};
            }

            if (util_isNullOrUndefined(MODULE_MANAGER.DelegateSettings.StaticEvents)) {
                MODULE_MANAGER.DelegateSettings.StaticEvents = {};
            }
        },
        GetItemSubKey: function (delegateTypeID, suffix) {
            var _ret = null;

            delegateTypeID = util_forceValidEnum(delegateTypeID, enCDelegateType, null);

            if (delegateTypeID != null) {
                _ret = delegateTypeID.toString() + "_" + util_forceString(suffix, "");
            }

            return _ret;
        },
        GetItem: function (delegateTypeID, isPersist) {
            var _ret = null;

            isPersist = util_forceBool(isPersist, false);

            MODULE_MANAGER.DelegateSettings.Init();

            delegateTypeID = util_forceValidEnum(delegateTypeID, enCDelegateType, null);

            if (!isPersist) {
                _ret = MODULE_MANAGER.DelegateSettings.Events[delegateTypeID];
            }
            else {
                _ret = MODULE_MANAGER.DelegateSettings.StaticEvents[delegateTypeID];
            }

            return _ret;
        },
        SetItem: function (delegateTypeID, val, isPersist) {
            isPersist = util_forceBool(isPersist, false);

            MODULE_MANAGER.DelegateSettings.Init();

            var _item = MODULE_MANAGER.DelegateSettings.GetItem(delegateTypeID);

            if (util_isNullOrUndefined(_item)) {
                delegateTypeID = util_forceValidEnum(delegateTypeID, enCDelegateType, null);

                if (util_isNullOrUndefined(val)) {
                    val = {};
                }

                if (delegateTypeID != null) {

                    if (!isPersist) {
                        MODULE_MANAGER.DelegateSettings.Events[delegateTypeID] = val;
                    }
                    else {
                        MODULE_MANAGER.DelegateSettings.StaticEvents[delegateTypeID] = val;
                    }
                }
            }
        },
        GetEvent: function (delegateTypeID, suffix, isPersist) {
            isPersist = util_forceBool(isPersist, false);

            var _ret = null;
            var _item = MODULE_MANAGER.DelegateSettings.GetItem(delegateTypeID, isPersist);

            if (!util_isNullOrUndefined(_item)) {
                var _key = MODULE_MANAGER.DelegateSettings.GetItemSubKey(delegateTypeID, suffix);

                _ret = _item[_key];
            }

            return _ret;
        },
        SetEvent: function (delegateTypeID, suffix, fn, isPersist) {
            isPersist = util_forceBool(isPersist, false);

            MODULE_MANAGER.DelegateSettings.Init();

            var _item = MODULE_MANAGER.DelegateSettings.GetItem(delegateTypeID, isPersist);
            var _key = MODULE_MANAGER.DelegateSettings.GetItemSubKey(delegateTypeID, suffix);

            if (util_isNullOrUndefined(_item)) {
                _item = {};
                MODULE_MANAGER.DelegateSettings.SetItem(delegateTypeID, _item, isPersist);
            }

            _item[_key] = fn;
        },
        ExecEvent: function (delegateTypeID, suffix, fnParams, isPersist) {
            isPersist = util_forceBool(isPersist, false);

            var _fn = MODULE_MANAGER.DelegateSettings.GetEvent(delegateTypeID, suffix, isPersist);

            delegateTypeID = util_forceValidEnum(delegateTypeID, enCDelegateType, null);

            if (delegateTypeID != null) {

                if (!isPersist) {
                    switch (util_forceInt(delegateTypeID, null)) {
                        case enCDelegateType.PageLoaded:

                            //the page/view has indicated that it is finished loading so configure its default state

                            $mobileUtil.ActivePage().removeAttr(DATA_ATTR_PAGE_MESSAGE_PRESERVE);   //remove the message preserve attribute for service request clear messages

                            //execute any renderer specific callbacks
                            renderer_event_callback_page_load();

                            break;

                        case enCDelegateType.PageUnload:

                            //page is being unloaded so close popup, if it is opened (if applicable)
                            var _dialogComponentType = $mobileUtil.Configuration.Dialog.DefaultDialogComponentType;

                            if ($mobileUtil.PopupIsOpen() &&
                                ((_dialogComponentType != enCDialogComponentType.Inline) || (_dialogComponentType == enCDialogComponentType.Inline && !$mobileUtil.IsActiveDialogPage()))
                               ) {

                                setTimeout(function () {
                                    $mobileUtil.PopupClose();
                                }, 0);
                            }

                            if ($mobileUtil.Configuration && $mobileUtil.Configuration.ToggleToolbarResize) {
                                $mobileUtil.ResizeToolbarViews(true);
                            }

                            break;

                        case enCDelegateType.Repeater:
                            break;

                        default:
                            break;
                    }
                }

                if (_fn) {

                    //Note: must use the setTimeout function to ensure the event is executed properly.
                    setTimeout(function () {
                        _fn(fnParams);
                    }, 0);
                }
            }
        },
        Events: {},
        StaticEvents: {}    //global (i.e. persisted events) even between module load activities
    }
};

function module_load(moduleID, moduleViewType, ctrlName, url, callback, activePage, options) {
    var _isLoadCurrent = false;

    if (util_isNullOrUndefined(moduleID)) {
        moduleID = util_queryStringFragment("ModuleID", url);
    }

    //if no moduleID is specified then load the current module view from settings
    if (util_isNullOrUndefined(moduleID)) {
        _isLoadCurrent = true;
        moduleID = MODULE_MANAGER.Current.ModuleID;
        ctrlName = MODULE_MANAGER.Current.ControlName;
        moduleViewType = MODULE_MANAGER.Current.ModuleViewType;
    } else {

        if (util_isNullOrUndefined(ctrlName)) {
            ctrlName = util_queryStringFragment("CTRL", url);
        }

        if (util_isNullOrUndefined(moduleViewType)) {
            moduleViewType = util_queryStringFragment("ModuleViewType", url);
        }
    }

    MODULE_MANAGER.module_util_log("module_load :: ModuleID: " + moduleID + ", " + util_enumNameLookup(moduleID, enCEModule, "NA") + 
                                   " | CTRL: " + ctrlName + " | ModuleViewType: " + moduleViewType + ", " + util_enumNameLookup(moduleViewType, enCEModuleViewType, "NA") );

    var _fn = function () {
        module_setCurrent(moduleID, ctrlName, moduleViewType, callback, activePage, options);
    };

    var _dialogComponentType = $mobileUtil.Configuration.Dialog.DefaultDialogComponentType;

    if ($mobileUtil.PopupIsOpen() &&
        ((_dialogComponentType != enCDialogComponentType.Inline) || (_dialogComponentType == enCDialogComponentType.Inline && !$mobileUtil.IsActiveDialogPage()))
       ) {

        $mobileUtil.PopupClose();

        setTimeout(function () {
            _fn();
        }, 100);
    }
    else if ($mobileUtil.DashboardIsOpen()) {
        $mobileUtil.DashboardClose(null, null, null, false);

        setTimeout(function () {
            _fn();
        }, 100);
    }
    else {
        _fn();
    }

    return false;
}

function module_loadParam(moduleID, moduleViewType, ctrlName, parameters, options) {
    options = util_extend({}, options);

    if (parameters) {
        options["Parameters"] = parameters;
    }

    module_load(moduleID, moduleViewType, ctrlName, null, null, null, options);
}

function module_loadNavContext(moduleID, moduleViewType, ctrlName, navContextURL, callback, toggleTransition) {
    toggleTransition = util_forceBool(toggleTransition, $mobileUtil.Configuration.Page.ToggleTransition);

    MODULE_MANAGER.Navigation.SetCurrentStateQS({ "ModuleID": moduleID, "ModuleViewType": moduleViewType, "ControlName": ctrlName }, navContextURL);

    if (toggleTransition) {
        module_loadTransition(moduleID, moduleViewType, ctrlName, null, callback);
    }
    else {
        module_load(moduleID, moduleViewType, ctrlName, null, callback);
    }
}

function module_loadTransition(moduleID, moduleViewType, ctrlName, url, callback, isReverse, options) {
    isReverse = util_forceBool(isReverse, false);

    if (util_forceBool($mobileUtil.Configuration.Page.ToggleTransition, false)) {
        var _page = $("[data-attr-page-clone=" + enCETriState.Yes + "]").first();

        module_load(moduleID, moduleViewType, ctrlName, url, function () {

            if (callback) {
                callback();
            }

            var _options = { "transition": util_forceString($mobileUtil.Configuration.Page.DefaultTransition, ""), "reverse": isReverse };

            if (_options["transition"] == "") {
                _options["transition"] = "none";
            }

            $mobileUtil.SetCurrentActivePage(_page, _options);
        }, _page, options);
    }
    else {
        module_load(moduleID, moduleViewType, ctrlName, url, callback, null, options);        
    }    
}

function module_getItem(moduleID) {
    if (util_isNullOrUndefined(moduleID)) {
        moduleID = MODULE_MANAGER.Current.ModuleID;
    }

    return MODULE_SETTINGS[moduleID];
}

function module_getSetting(moduleID, isSuppressError) {
    var _ret = null;
    var _item = null;

    isSuppressError = util_forceBool(isSuppressError, false);

    if (util_isNullOrUndefined(moduleID)) {
        moduleID = MODULE_MANAGER.Current.ModuleID;
    }

    _item = module_getItem(moduleID);

    if (util_isNullOrUndefined(_item) || util_isNullOrUndefined(_item.Setting)) {
        if (!isSuppressError) {
            MODULE_MANAGER.module_util_logError("module_getSetting :: no module settings are configured for ModuleID - " + moduleID);
        }
    }
    else {
        _ret = _item.Setting;
    }

    return _ret;
}

function module_getViewHTML(moduleID, ctrlName, moduleViewType, fnSuccess, options) {

    options = util_extend({ "HasIndicators": true }, options);

    var _html = null;
    var _settings = module_getSetting(moduleID, true);  //suppress the error if no valid settings is obtained for the module
    var _ctrlFileName = null;

    moduleID = util_forceValidEnum(moduleID, enCEModule, null);
    moduleViewType = util_forceValidEnum(moduleViewType, enCEModuleViewType, null);
    ctrlName = util_forceString(ctrlName, "");

    //check if the moduleID specified and the module settings are invalid
    if (moduleID == null || _settings == null) {

        //default content (moduleID and/or settings is invalid)
        _html = "<b>" + util_htmlEncode("ERROR - Content not found.") + "</b>";
    }
    else {

        //check if a control fragment query string is provided (overrides the module view type ID)
        if (ctrlName != "") {
            _ctrlFileName = "ctl" + ctrlName + ".html";
        }
        else {
            var _pageProp = null;

            switch (util_forceInt(moduleViewType)) {
                case enCEModuleViewType.Edit:
                    _pageProp = "EditPage";
                    break;

                case enCEModuleViewType.AdminList:
                    _pageProp = "AdminListPage";
                    break;

                case enCEModuleViewType.AdminEdit:
                    _pageProp = "AdminEditPage";
                    break;

                default:
                    _pageProp = "ListPage";
                    break;
            }

            _ctrlFileName = _settings[_pageProp];
        }

        var _path = _settings.BaseControlPath + _ctrlFileName;

        var _urlPath = $.url(_path).attr("path");

        _path = util_resolveAbsoluteURL("..");

        //fix for websites with root location and $.url(...) returning website seperator character
        if (_path.lastIndexOf("/") == _path.length - 1 && (_urlPath.indexOf("/") == 0 && _urlPath.length > 1)) {
            _urlPath = _urlPath.substr(1);
        }

        _path += _urlPath;

        //check if file supports custom controller action
        if (util_forceString(_settings["ControllerName"]) != "") {
            _path = util_appendQS(_path, "rn", _settings["ControllerName"]);
        }

        MODULE_MANAGER.module_util_log("module_getViewHTML :: load page path - \"" + _path + "\"");

        var _keyURL = $.url(_path).attr("path");

        _html = MODULE_MANAGER.Cache.Get(moduleID, _keyURL);

        var _fnCallback = function (strHTML) {
            strHTML = $mobileUtil.ReplaceApplicationTokensHTML(strHTML);

            if (fnSuccess) {
                fnSuccess(strHTML);
            }
        };

        //check if there is an entry in the module manager cache for the current module's content to be loaded
        if (!util_isNullOrUndefined(_html)) {

            MODULE_MANAGER.module_util_log("module_getViewHTML :: cache content found - ModuleID: " + moduleID + ", URL: " + _path);

            _fnCallback(_html);
        }
        else {

            MODULE_MANAGER.module_util_log("module_getViewHTML :: cache content not found; retrieve from source - ModuleID: " + moduleID + ", URL: " + _path);

            GlobalService.HasIndicators = options.HasIndicators;
            GlobalService.Get(_path, function (ret) {

                //set the module url's content to the cache for future use
                MODULE_MANAGER.Cache.Set(moduleID, _keyURL, util_forceString(ret));

                _fnCallback(ret);
            });
        }
    }
}

function module_setCurrent(moduleID, ctrlName, moduleViewType, fnSuccess, activePage, options) {

    options = util_extend({ "Parameters": null }, options);

    $mobileUtil.PageUnload();   //unload the current page (prior to loading the new view)

    GlobalService.DisableAllFutureRequests = false; //ensure future requests for the web service are by default allowed

    MODULE_MANAGER.module_util_log("module_setCurrent :: ModuleID: " + moduleID + ", " + util_enumNameLookup(moduleID, enCEModule, "ERROR") +
             " | CTRL: " + ctrlName + " | ModuleViewType: " + moduleViewType + ", " + util_enumNameLookup(moduleViewType, enCEModuleViewType, "NA"));

    moduleID = util_forceValidEnum(moduleID, enCEModule, null);
    moduleViewType = util_forceValidEnum(moduleViewType, enCEModuleViewType, null);
    ctrlName = util_forceString(ctrlName, "");

    //set the current view and load the contents
    MODULE_MANAGER.Current.ModuleID = moduleID;
    MODULE_MANAGER.Current.ModuleViewType = moduleViewType;
    MODULE_MANAGER.Current.ControlName = (ctrlName == "" ? null : ctrlName);

    MODULE_MANAGER.Current.Parameters = options["Parameters"];

    if ($mobileUtil.IsActiveDialogPage()) {
        MODULE_MANAGER.Current.LayoutType = enCLayoutType.Dialog;
    }
    else {

        switch (util_forceInt(moduleID, null)) {
            case enCEModule.GlobalHome:
            case enCEModule.GlobalContent:
            case enCEModule.AdminModule:
            case enCEModule.AdminImport:
                MODULE_MANAGER.Current.LayoutType = enCLayoutType.Private;
                break;

            default:
                MODULE_MANAGER.Current.LayoutType = enCLayoutType.Global;
                break;
        }
    }

    var _settings = module_getSetting(moduleID, true);  //suppress the error if no valid settings is obtained for the module
    var _ctrlFileName = null;

    //check if the moduleID specified and the module settings are invalid
    if (moduleID == null || _settings == null) {

        //unable to load the current view therefore load default home module
        //AKV TODO: consideration to properly handle by loading/displaying error message

        MODULE_MANAGER.module_util_log("module_setCurrent :: invalid moduleID and/or module setting specified - Loading default view.");
        GoToHome();
    } else {

        var _loadView = true;
        var _isOnlineModel = (MODULE_MANAGER.Current.ModuleID == enCEModule.GlobalOnlineModel);
        var _refreshView = true;
        var _activePage = $mobileUtil.ActivePage(); //store the current active page to be used to set content
        //(required due to possible user interactions and switching to another active page)

        if (util_isNullOrUndefined(activePage)) {

            if (_isOnlineModel) {
                var _persistOnlineModel = util_forceBool(module_getSetting(enCEModule.GlobalOnlineModel)["PersistOnlineModelFrame"], false);

                if (_persistOnlineModel) {
                    var _onlineModelPage = $mobileUtil.OnlineModelActivePage();

                    if (_activePage.attr("id") != _onlineModelPage.attr("id")) {
                        $mobileUtil.SetCurrentActivePage(_onlineModelPage);
                        _loadView = false;
                    }
                    else {
                        if (
                        (util_forceValidEnum(_activePage.attr("data-cattr-page-module-id"), enCEModule, null) == MODULE_MANAGER.Current.ModuleID) &&
                        (util_forceString(_activePage.attr("data-cattr-page-module-ctrl-name"), "") == util_forceString(MODULE_MANAGER.Current.ControlName, ""))
                       ) {
                            _refreshView = false;
                        }
                    }
                }
            }
            else if (_activePage.attr("id") != $mobileUtil.DialogContainer().attr("id")) {
                var _standardPage = $mobileUtil.StandardActivePage();

                if (_activePage.attr("id") != _standardPage.attr("id")) {
                    $mobileUtil.SetCurrentActivePage(_standardPage);
                    _loadView = false;
                }
            }
        }
        else {
            _activePage = $(activePage);
        }

        var _fnSetHTML = function (strHTML) {
            var _fnRenderView = function () {
                if (_refreshView) {
                    $mobileUtil.SetActivePageHTML(strHTML + (MODULE_MANAGER.ToggleContentLineBreak ? "<br />" : ""), _activePage, null, fnSuccess);
                }
                else if (fnSuccess) {
                    fnSuccess();
                }

                if (util_isNullOrUndefined(activePage)) {

                    //active page content has been set (along with any scripts) so execute the callback for page load complete
                    $mobileUtil.PageLoadComplete();
                }
            };

            var _overrideUserLoggedInCheck = false;

            if (util_isDefined("private_moduleUserHasAccess")) {
                _overrideUserLoggedInCheck = util_forceBool(private_moduleUserHasAccess(), _overrideUserLoggedInCheck);
            }

            ext_processExecUserLoggedIn(function () {

                //user is logged in so check if the user is viewing the splash login and if so redirect to the home module
                if (!_overrideUserLoggedInCheck && MODULE_MANAGER.Current.ModuleID == enCEModule.GlobalSplash && MODULE_MANAGER.Current.ModuleViewType == enCEModuleViewType.List) {
                    GoToHome();
                }
                else {
                    _fnRenderView();
                }

            }, function () {
                var _requireLogin = true;

                if (MODULE_MANAGER.Current.ModuleID == enCEModule.GlobalSplash ||
                    !module_isCurrentView(enCEModule.GlobalDynamicTemplate, "Redirect", enCEModuleViewType.List)) {
                    _requireLogin = false;
                }

                if (_requireLogin) {

                    //navigate user to login view if the user is not logged in and viewing a module other than the splash module
                    GoToLogin();
                }
                else {

                    //user is viewing the Splash module and as such render the view
                    _fnRenderView();
                }
            }, _overrideUserLoggedInCheck);
        };

        if (_loadView) {
            module_getViewHTML(moduleID, ctrlName, moduleViewType, _fnSetHTML);
        }
        
    }   //end of check for module ID and module setting valid (load view success)
}

function module_isCurrentView(moduleID, ctrlName, moduleViewType) {
    var _ret = false;
    var _current = MODULE_MANAGER.Current;

    if (_current.ModuleID == moduleID && _current.ControlName == ctrlName && _current.ModuleViewType == moduleViewType) {
        _ret = true;
    }

    return _ret;
}

//Note: mainly applicable to dialog views
function module_replaceCurrentView(options) {

    var _fnToggleOverlay = function (isOn) {
        if (util_forceBool(options["ToggleOverlay"])) {
            $mobileUtil.ToggleOverlay(isOn);
        }
    };

    options = util_extend({ "ModuleID": null, "ControlName": null, "ModuleViewType": null, "ContextURL": null, "ExtQueryList": {},
        "IsRestoreSource": false, "ToggleOverlay": true, "CallbackLoad": null
    }, options);

    _fnToggleOverlay(true);

    var _currentContext = $mobileUtil.ActivePage().attr(DATA_ATTRIBUTE_CONTEXT_HREF);
    var _updatedModuleURL = options["ContextURL"];

    if (util_isNullOrUndefined(_updatedModuleURL)) {
        var _processedQS = {};

        if (util_isNullOrUndefined(options["ExtQueryList"])) {
            options["ExtQueryList"] = {};
        }

        if (options["ModuleID"] == enCEModule.GlobalDynamicTemplate) {
            _updatedModuleURL = util_constructTemplateModuleURL(options["ModuleViewType"], options.ExtQueryList["TemplateParams"]);
            _processedQS["TemplateParams"] = true;
        }
        else {
            _updatedModuleURL = util_constructModuleURL(options["ModuleID"], options["ModuleViewType"], options["ControlName"]);
        }

        for (var _key in options.ExtQueryList) {
            if (_processedQS[_key] != true) {
                _updatedModuleURL = util_appendFragmentQS(_updatedModuleURL, _key, options.ExtQueryList[_key]);
            }
        }

        if ($mobileUtil.IsActiveDialogPage()) {
            _updatedModuleURL = util_constructPopupURL(_updatedModuleURL);
        }
    }

    $mobileUtil.ActivePage().attr(DATA_ATTRIBUTE_CONTEXT_HREF, _updatedModuleURL)
                            .attr(DATA_ATTRIBUTE_CONTEXT_HREF_TEMP_SOURCE, _currentContext);

    var _fn = function () {

        module_getViewHTML(options["ModuleID"], options["ControlName"], options["ModuleViewType"], function (html) {

            var _temp = $(html);

            $mobileUtil.Content().html("");

            $mobileUtil.SetActivePageHTML("<div id='divEmbeddedContent' />" + "<br />", null, { "IsReplaceView": true }, function () {
                var _placeholder = $mobileUtil.Content().find("#divEmbeddedContent");

                _temp.insertBefore(_placeholder);
                _placeholder.remove();

                $mobileUtil.refresh($mobileUtil.Content());

                _fnToggleOverlay(false);

                if (util_isFunction(options["CallbackLoad"])) {
                    options.CallbackLoad();
                }
            });
        });

    };     //end: _fn

    setTimeout(_fn, 50);

}