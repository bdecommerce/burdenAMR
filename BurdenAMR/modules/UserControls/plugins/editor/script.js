var CPluginEditorDataManager = function () {

    var _instance = this;

    util_extend(_instance, {
        "ComponentList": "%%TOK|ROUTE|PluginEditor|ComponentGetByForeignKey|{ IsCached: true }%%",
        "LookupPlatformComponentEditorGroups":{},
        "LookupPlatformComponentMultiple": {},
        "HasMultipleEditorGroups": function (options) {

            var _ret = false;

            options = util_extend({ "ClassificationPlatformID": enCE.None, "ComponentID": enCE.None }, options);

            var _key = options.ClassificationPlatformID + "_" + options.ComponentID;

            if (_instance.LookupPlatformComponentMultiple[_key]) {
                var _component = util_arrFilter(_instance.ComponentList, enColComponentProperty.ComponentID, options.ComponentID, true);

                _component = (_component.length == 1 ? _component[0] : null);

                if (_component && util_forceInt(_component[enColComponentProperty.LinkEditorForeignTypeID], enCE.None) != enCE.None) {
                    _ret = true;
                }
            }

            return _ret;
        },

        "InlineEditorGroupSwitchHTML": function (options) {

            options = util_extend({
                "PlatformID": enCE.None, "ComponentID": enCE.None, "EditorForeignTypeID": enCE.None, "BridgeList": null, 
                "PropertyBridgeEditorGroupID": enColEditorGroupForeignPermissionProperty.EditorGroupID
            }, options);

            var _html = "";
            var _key = options.PlatformID + "_" + options.ComponentID;

            if (_instance.LookupPlatformComponentEditorGroups[_key]) {
                var _editorGroups = util_arrFilter(_instance.LookupPlatformComponentEditorGroups[_key], enColEditorGroupProperty.EditorForeignTypeID, options.EditorForeignTypeID);

                if (_editorGroups.length > 0) {
                    _html += "<div class='FlipSwitchChildToggles'>";

                    for (var i = 0; i < _editorGroups.length; i++) {
                        var _editorGroup = _editorGroups[i];
                        var _editorGroupID = _editorGroup[enColEditorGroupProperty.EditorGroupID];
                        var _selected = (util_arrFilter(options.BridgeList, options.PropertyBridgeEditorGroupID, _editorGroupID, true).length == 1);

                        _html += "<div class='DisableUserSelectable FlipSwitchInline LinkClickable'>" +
                                 " <div " + util_renderAttribute("flip_switch") +
                                 (_selected ? " " + util_htmlAttribute(DATA_ATTR_DEFAULT_VALUE, enCETriState.Yes) : "") +
                                 " data-corners='false' data-mini='true' style='display: inline-block;' " +
                                 util_htmlAttribute("data-attr-platform-toggle-editor-group-id", _editorGroupID) + "/>" +
                                 " <div class='Label'>" + util_htmlEncode(_editorGroup[enColEditorGroupProperty.Name]) + "</div>" +
                                 "</div>";

                    }
                    
                    _html += "</div>";
                }
            }

            return _html;
        },
        "InitEditorGroupForeignPermissionList": function (options) {

            options = util_extend({
                "PlatformID": enCE.None, "ComponentID": enCE.None, "List": null,
                "BridgeItemEditorForeignTypeID": enCE.None, "EditorForeignTypeID": enCE.None,
                "PropertyBridgeEditorGroupID": enColEditorGroupForeignPermissionProperty.EditorGroupID,
                "PropertyBridgeEditorForeignTypeID": enColEditorGroupForeignPermissionProperty.EditorForeignTypeID
            }, options);

            var _ret = (options.List || []);
            var _key = options.PlatformID + "_" + options.ComponentID;

            if (_instance.LookupPlatformComponentEditorGroups[_key]) {
                var _editorGroups = util_arrFilter(_instance.LookupPlatformComponentEditorGroups[_key], enColEditorGroupProperty.EditorForeignTypeID, options.EditorForeignTypeID);

                for (var i = 0; i < _editorGroups.length; i++) {
                    var _editorGroup = _editorGroups[i];
                    var _editorGroupID = _editorGroup[enColEditorGroupProperty.EditorGroupID];

                    var _search = util_arrFilterSubset(_ret, function (searchItem) {
                        return (searchItem[options.PropertyBridgeEditorGroupID] == _editorGroupID &&
                                searchItem[options.PropertyBridgeEditorForeignTypeID] == options.BridgeItemEditorForeignTypeID);
                    }, true);

                    if (_search.length == 0) {
                        var _item = new CEEditorGroupForeignPermission();

                        _item[options.PropertyBridgeEditorGroupID] = _editorGroupID;
                        _item[options.PropertyBridgeEditorForeignTypeID] = options.BridgeItemEditorForeignTypeID;

                        _ret.push(_item);
                    }
                }
            }

            return _ret;
        },

        "PopulateEditorGroupForeignPermissions": function (options) {

            var _ret = [];

            options = util_extend({
                "Element": null, "SourceList": null, "BridgeItemEditorForeignTypeID": enCE.None,
                "BridgeEntityInstance": CEEditorGroupForeignPermission,
                "PropertyBridgeEditorGroupID": enColEditorGroupForeignPermissionProperty.EditorGroupID,
                "PropertyBridgeEditorForeignTypeID": enColEditorGroupForeignPermissionProperty.EditorForeignTypeID
            }, options);

            var $element = $(options.Element);

            if (!$element.is(".FlipSwitchChildToggles")) {
                $element = $element.find(".FlipSwitchChildToggles");
            }

            if ($element.length == 1) {
                var $cbPlatforms = $element.find(".FlipSwitchInline [data-attr-platform-toggle-editor-group-id] select[data-attr-widget='flip_switch']");

                $.each($cbPlatforms, function () {
                    var $cb = $(this);
                    var _selected = (util_forceInt($cb.val(), enCETriState.No) == enCETriState.Yes);

                    if (_selected) {
                        var _editorGroupID = util_forceInt($mobileUtil.GetClosestAttributeValue($cb, "data-attr-platform-toggle-editor-group-id"), enCE.None);
                        var _bridgeEditorGroupPermItem = util_arrFilterSubset(options.SourceList, function (searchItem) {
                            return (searchItem[options.PropertyBridgeEditorGroupID] == _editorGroupID &&
                                    searchItem[options.PropertyBridgeEditorForeignTypeID] == options.BridgeItemEditorForeignTypeID);
                        }, true);

                        if (_bridgeEditorGroupPermItem.length == 1) {
                            _bridgeEditorGroupPermItem = _bridgeEditorGroupPermItem[0];
                        }
                        else {
                            _bridgeEditorGroupPermItem = (options.BridgeEntityInstance ? new options.BridgeEntityInstance() : {});
                        }

                        _bridgeEditorGroupPermItem[options.PropertyBridgeEditorGroupID] = _editorGroupID;
                        _bridgeEditorGroupPermItem[options.PropertyBridgeEditorForeignTypeID] = options.BridgeItemEditorForeignTypeID;

                        _ret.push(_bridgeEditorGroupPermItem);
                    }
                });
            }

            return _ret;

        }

    }, true, true);

    var _classPlatformComponents = "%%TOK|ROUTE|PluginEditor|ClassificationPlatformComponentGetByForeignKey|{ IsCached: true, HasMultipleEditorGroups: \"enCETriState.Yes\" }%%";
    var _editorGroupList = "%%TOK|ROUTE|PluginEditor|EditorGroupGetByForeignKey|{ IsCached: false, HasEditorForeignType: \"enCETriState.Yes\" }%%";

    _classPlatformComponents = (_classPlatformComponents || []);

    for (var i = 0; i < _classPlatformComponents.length; i++) {

        var _classPlatformComponent = _classPlatformComponents[i];
        var _classificationPlatformID = _classPlatformComponent[enColClassificationPlatformComponentProperty.ClassificationPlatformID];
        var _componentID = _classPlatformComponent[enColClassificationPlatformComponentProperty.ComponentID];
        var _platformID = _classPlatformComponent[enColClassificationPlatformComponentProperty.RefPlatformID];

        var _key = _classificationPlatformID + "_" + _componentID;

        var _editorGroups = util_arrFilterSubset(_editorGroupList, function (searchItem) {
            return (searchItem[enColEditorGroupProperty.ClassificationPlatformID] == _classificationPlatformID &&
                    searchItem[enColEditorGroupProperty.ComponentID] == _componentID);
        });

        _instance.LookupPlatformComponentMultiple[_key] = { "ClassificationPlatformComponent": _classPlatformComponent, "EditorGroupList": _editorGroups };

        var _list = null;

        _key = _platformID + "_" + _componentID;

        if (_instance.LookupPlatformComponentEditorGroups[_key]) {
            _list = _instance.LookupPlatformComponentEditorGroups[_key];
        }
        else {
            _list = [];
            _instance.LookupPlatformComponentEditorGroups[_key] = _list;
        }

        $.merge(_list, _editorGroups);
    }

};  //end: CPluginEditorDataManager

var CPluginEditor = function () {

    var _instance = this;

    this["Configuration"] = {
        "LabelDefaultSelection": util_forceString("%%TOK|ROUTE|PluginEditor|LabelDefaultSelection%%"),
        "Views": {
            "AdminRoleList": {
                "Title": "Role Administration",
                "EditPopupRatio": 0.7,
                "AddButtonTitle": "Add Role",
                "AddItemTitle": "Add Role",
                "EditItemTitle": "Edit Role",
                "DeleteConfirmTitle": "Delete Role(s)",
                "DeleteConfirmMessage": util_htmlEncode("Are you sure you want to delete the selected role(s)?") + "<br />" +
                                        "<b>" + util_htmlEncode("Warning") + "</b>" +
                                        util_htmlEncode(": all associated users will be removed from the selected role(s)"),
                "DeleteConfirmMessageIsHTML": true,
                "SaveMessageSuccess": "Role successfully updated.",
                "EditTemplateParams": enCEModule.PluginEditor + "_AdminEditRole",
                "SortEnum": "enColClassificationPlatformRole",
                "DefaultSortEnum": enColClassificationPlatformRole.Name,
                "SortOrderGroup": -1000,
                "Columns": [
                    {
                        "SortEnum": enColClassificationPlatformRole.ClassificationIDName, "Property": enColClassificationPlatformRoleProperty.ClassificationIDName,
                        "Content": "Classification"
                    },
                    {
                        "SortEnum": enColClassificationPlatformRole.PlatformIDName, "Property": enColClassificationPlatformRoleProperty.PlatformIDName,
                        "Content": "Platform"
                    },
                    {
                        "SortEnum": enColClassificationPlatformRole.Name, "Property": enColClassificationPlatformRoleProperty.Name,
                        "Content": "Name"
                    },
                    {
                        "Content": "&nbsp;", "IsHTML": true, "RenderOptions": { "IsNoLink": true, "IsEditCell": true }
                    }
                ],
                "RowConfigurationRoleComponents": [
                    {
                        "Property": enColClassificationPlatformRoleComponentProperty.IsActive, "Label": "Active:",
                        "InputHTML": "<div " + util_renderAttribute("flip_switch") + " data-mini='true' />"
                    },
                    {
                        "Property": enColClassificationPlatformRoleComponentProperty.UserRoleID, "Label": "Role:",
                        "InputHTML": "<select data-mini='true' data-corners='false' />",
                        "DropdownConfiguration": {
                            "List": null,
                            "Text": enColRoleProperty.Name,
                            "Value": enColRoleProperty.RoleID,
                            "IsNullable": true
                        },
                        "LoadData": function (opts) {
                            opts = util_extend({ "Config": null, "Callback": null }, opts);

                            var _callback = function () {

                                if (opts.Callback) {
                                    opts.Callback();
                                }
                            };

                            if (opts.Config && opts.Config.DropdownConfiguration.List) {
                                _callback();
                            }
                            else {
                                _instance.GetData({ "Type": "ApplicationRoleList", "From": "AdminRoleEdit" }, function (result) {
                                    opts.Config.DropdownConfiguration.List = (result && result.Data ? result.Data.List : null);
                                    _callback();
                                });
                            }
                            
                        }
                    }
                ],
                "EditTemplateController": null
            },
            "AdminDefaultRoleList": {
                "Title": "Default Access Request Role Administration",
                "HasAddNewButton": false,
                "HasDeleteItem": false,
                "EditItemTitle": "Edit Default Access Request Role",
                "SaveMessageSuccess": "Default access request role successfully updated.",
                "EditTemplateParams": enCEModule.PluginEditor + "_AdminEditDefaultAccessRole",
                "SortEnum": "enColPlatformDefaultRequestRole",
                "DefaultSortEnum": enColPlatformDefaultRequestRole.PlatformIDName,
                "SortOrderGroup": -1002,
                "Columns": [
                    {
                        "SortEnum": enColPlatformDefaultRequestRole.PlatformIDName, "Property": enColPlatformDefaultRequestRoleProperty.PlatformIDName,
                        "Content": "Platform"
                    },
                    {
                        "SortEnum": enColPlatformDefaultRequestRole.RoleIDName, "Property": enColPlatformDefaultRequestRoleProperty.RoleIDName,
                        "Content": "Assigned Role"
                    },
                    {
                        "Content": "&nbsp;", "IsHTML": true, "RenderOptions": {
                            "IsNoLink": true, "IsEditCell": true, "CanRender": function (opts) {

                                var _lookupRenderPlatform = $(opts.Container).data("PlatformRenderLookup");
                                var _platformDefaultReqRole = opts.Item;
                                var _valid = true;

                                if (_lookupRenderPlatform && _platformDefaultReqRole) {
                                    var _platformID = _platformDefaultReqRole[enColPlatformDefaultRequestRoleProperty.PlatformID];

                                    _valid = (_lookupRenderPlatform[_platformID] == true);
                                }

                                return _valid;
                            }
                        }
                    }
                ],
                "OverrideListWebMethod": null,
                "EditTemplateController": null
            },
            "EffectivePermissionSummaryList": {
                "Columns": [
                    { "Property": enColCPlatformComponentUserRoleProperty.IsActive, "Heading": "Active:", "Format": enCDataFormat.Boolean },
                    {
                        "Property": enColCPlatformComponentUserRoleProperty.UserRoleID, "Heading": "Role:", "Format": enCDataFormat.Lookup,
                        "LookupMethod": "GetByUserRoleID"
                    }
                ]
            }
        }
    };

    this["Data"] = new CPluginEditorDataManager();

    //configure the new instance
    if (this["OnNewInstance"]) {
        this.OnNewInstance({ "Instance": this });
    }
};

//TODO: remove after proper validation is available
function script_validateHTML(opts) {

    opts = util_extend({ "Index": -1, "HTML": "" }, opts);

    if (opts.HTML) {
        var $temp = $("<div>" + opts.HTML + "</div>");
        var _fnAddError = function(msg){
            AddUserError("Slide #" + opts.Index + 1 + ": " + msg);
        };

        //check if embedded tables are found
        if ($temp.find("table table").length) {
            _fnAddError("embedded tables are not supported; please ensure that cells do not contain any embedded tables.");
        }
    }
}

CPluginEditor.prototype.OnNewInstance = function (options) {
    //NOTE: avoid modifying this function as it is prototyped to allow project level overrides/configuration on new instance inits of the CPluginEditor
};

CPluginEditor.prototype.GetData = function (options, callback) {
    var _instance = this;

    var _callback = function (data, success) {
        success = util_forceBool(success, true);

        var _result = { "Success": success, "Data": data };

        //allow custom overrides via project level function
        if (_instance["_GetData"]) {
            var _fn = _instance["_GetData"];

            _fn(options, { "Callback": callback, "Result": _result });
        }
        else if (callback) {
            callback(_result);
        }
    };

    options = util_extend({ "Type": null, "Filters": null }, options);

    var _filters = options["Filters"];

    var _dataCallback = function(data){
        _callback(data, true);
    };

    var _errorCallback = function(){
        _callback(null, false);
    };

    switch (options["Type"]) {

        case "ClassificationList":
            GlobalService.ClassificationGetByForeignKey(_filters, _dataCallback, _errorCallback);
            break;

        case "PlatformList":
            GlobalService.PlatformGetByForeignKey(_filters, _dataCallback, _errorCallback);
            break;

        case "ComponentByPrimaryKey":
            GlobalService.ComponentGetByPrimaryKey(_filters, _dataCallback, _errorCallback);
            break;

        case "ComponentList":
            GlobalService.ComponentGetByForeignKey(_filters, _dataCallback, _errorCallback);
            break;

        case "ClassificationPlatformByPrimaryKey":
            GlobalService.ClassificationPlatformGetByPrimaryKey(_filters, _dataCallback, _errorCallback);
            break;

        case "ClassificationPlatformList":
            GlobalService.ClassificationPlatformGetByForeignKey(_filters, _dataCallback, _errorCallback);
            break;

        case "ClassificationPlatformComponentList":
            GlobalService.ClassificationPlatformComponentGetByForeignKey(_filters, _dataCallback, _errorCallback);
            break;

        case "ApplicationRoleList":
            _filters = util_extend({
                "IsApplyUserFilter": true, "SortColumn": enColRole.Name, "SortASC": true, "PageSize": enCEPaging.NoPaging, "PageNum": enCEPaging.NoPaging
            }, _filters);

            GlobalService.RoleGetByForeignKey(_filters.IsApplyUserFilter, _filters.SortColumn, _filters.SortASC, _filters.PageSize, _filters.PageNum,
                                               ext_requestSuccess(function (data) {
                                                   _dataCallback(data);
                                               }), _errorCallback);
            break;

        case "ClassificationPlatformRoleList":
            GlobalService.ClassificationPlatformRoleGetByForeignKey(_filters, _dataCallback, _errorCallback);
            break;

        case "UserClassificationPlatformRoleList":
            APP.Service.Action({ "c": "PluginEditor", "m": "UserClassificationPlatformRoleGetByForeignKey", "args": _filters }, _dataCallback, _errorCallback);
            break;

        case "EditorGroupByPrimaryKey":
            GlobalService.EditorGroupGetByPrimaryKey(_filters, _dataCallback, _errorCallback);
            break;

        case "EditorGroupContentList":
            GlobalService.EditorGroupContentGetByForeignKey(_filters, _dataCallback, _errorCallback);
            break;

        case "ContentList":
            GlobalService.ContentGetByForeignKey(_filters, _dataCallback, _errorCallback);
            break;

        default:
            _callback(null, false);
            break;

    }

};  //end: GetData

CPluginEditor.prototype.LoadModule = function (options) {

    options = util_extend({ "ViewMode": null }, options);

    var _title = null;
    var _valid = true;
    var _instance = this;

    var _titleConfiguration = _instance.Configuration.Titles;
    var _viewMode = options["ViewMode"];
    var _viewConfiguration = null;

    if (_viewMode && _instance.Configuration.Views[_viewMode]) {
        _viewConfiguration = _instance.Configuration.Views[_viewMode];
    }

    _viewConfiguration = util_extend({}, _viewConfiguration);

    _title = _viewConfiguration["Title"];

    var _mergeProperties = [];

    var _fnAppendMergeProps = function (val) {
        if ($.isArray(val)) {
            for (var i = 0; i < val.length; i++) {
                _mergeProperties.push(val[i]);
            }
        }
        else {
            _mergeProperties.push(val);
        }

    };  //end: _fnAppendMergeProps

    var _isAdminList = false;

    switch (_viewMode) {

        case "AdminRoleList":
            _isAdminList = true;
            _fnAppendMergeProps(["RowConfigurationRoleComponents"]);
            break;

        case "AdminDefaultRoleList":
            _isAdminList = true;
            _fnAppendMergeProps(["OverrideListWebMethod"]);
            break;

        default:
            _valid = false;
            break;
    }

    if (_isAdminList) {
        _fnAppendMergeProps(["HasAddNewButton", "HasDeleteItem", "AddButtonTitle", "AddItemTitle", "EditItemTitle", "Columns", "EditTemplateParams",
                             "EditTemplateController", "SortOrderGroup", "DefaultSortEnum", "SaveMessageSuccess", "DeleteConfirmTitle", "DeleteConfirmMessage",
                             "DeleteConfirmMessageIsHTML", "EditPopupRatio"]);
    }

    if (_valid) {

        if (!options["LabelModuleTitle"]) {
            options["LabelModuleTitle"] = _title;
        }

        for (var i = 0; i < _mergeProperties.length; i++) {
            var _propName = _mergeProperties[i];

            options[_propName] = _viewConfiguration[_propName];
        }
        
        module_loadParam(enCEModule.PluginEditor, enCEModuleViewType.List, null, options);
    }
    else {
        AddErrorCritical("Requested page is not available; invalid navigation request.");
    }

};  //end: LoadModule

CPluginEditor.prototype.LoadControllerInstance = function (options) {

    options = util_extend({ "Key": null, "URL": null, "DisableCache": false, "Callback": null }, options);

    var _callback = function () {
        if (options.Callback) {
            options.Callback();
        }
    };

    if (util_forceString(options.Key) != "" && util_forceString(options.URL) != "") {
        var _key = "data-editor-controller-init-" + options.Key;
        var $body = $("body");

        var _init = util_forceBool($body.data(_key), false);
        var _disableCache = util_forceBool(options.DisableCache, false);

        if (!_init || _disableCache) {
            var _url = options.URL;
            var _tokens = {};

            _tokens["%%SITE_URL%%"] = "<SITE_URL>";
            _tokens["%%PROJECT_NO%%"] = "<PROJECT_NO>";
            _tokens["%%PRIVATE_JAVASCRIPT%%"] = "<SITE_URL>javascript/private/<PROJECT_NO>/";

            //debug purposes (will replace "V2.js" instances with ".js")
            if (util_forceInt(util_queryString("mDebugDisableV2"), enCETriState.None) == enCETriState.Yes) {
                _tokens["V2.js"] = ".js";
            }

            _url = util_replaceTokens(_url, _tokens);
            _url += util_getVersionQS(_url.indexOf("?") >= 0 ? "" : "?");

            $body.data(_key, true);

            GlobalService.Get(_url, _callback, _callback);
        }
        else {
            _callback();
        }
    }
    else {
        _callback();
    }

};  //end: LoadControllerInstance

CPluginEditor.prototype.IsCurrentAdminView = function (options) {
    var _ret = false;

    if (module_isCurrentView(enCEModule.PluginEditor, null, enCEModuleViewType.List)) {
        var _params = util_extend({ "ViewMode": null }, MODULE_MANAGER.Current.Parameters);

        switch (_params["ViewMode"]) {

            case "AdminRoleList":
            case "AdminDefaultRoleList":
                _ret = true;
                break;
        }
    }

    return _ret;
};

CPluginEditor.prototype.IsCurrentExportView = function (options) {

    options = util_extend({ "Element": null }, options);

    var _ret = false;

    var $element = $(options.Element);
    var $vwComponent = $element.find(".CEditorComponentHome:first:visible");

    var _editorGroup = $vwComponent.data("DataItem");

    if (_editorGroup) {
        var _exportSupportedComponentIDs = "%%TOK|ROUTE|PluginEditor|ComponentExportSupported%%";
        var _componentID = util_forceInt(_editorGroup[enColEditorGroupProperty.ComponentID], enCE.None);

        var _search = util_arrFilter(_exportSupportedComponentIDs, null, _componentID, true);

        _ret = (_search.length == 1);
    }

    return _ret;
};

CPluginEditor.prototype.Events = {

    "OnNavigateHomeRequest": function (options) {

        var _handled = false;

        options = util_extend({ "Element": null, "Trigger": null, "Controller": null }, options);

        var _controller = options.Controller;
        var $trigger = $(options.Trigger);

        if ($trigger.is("[" + util_renderAttribute("label_module_name") + "]")) {            
            var $container = _controller.DOM.Container.find(".CEditorHomeView");

            var $search = $container.find(".CEditorComponentHome");

            if ($search.is(":visible")) {
                $container.trigger("events.homeview_navigateBack", { "Trigger": $search, "ForcePreviousView": true });
                _handled = true;
            }
        }

        return _handled;

    }  //end: OnNavigateHomeRequest

};  //end: Events

CPluginEditor.prototype.RenderEvents = {};

CPluginEditor.prototype.RenderEvents.UserRolesView = function (options) {

    options = util_extend({
        "Element": null, "Callback": null, "Instance": null, "UserID": null, "UserRolesData": null, "ParamDataItem": null, "TemplateRenderOptions": null,

        //lookup of classification and platform access with property item of key classification/platform ID and value of true/false of whether access is allowed
        "LookupAccessRestriction": { "Classification": null, "Platform": null },

        "OverridePlatformRoleListWebMethod": null
    }, options);

    var _instance = options.Instance;

    var $element = $(options.Element);
    var _callback = function () {

        if (options.Callback) {
            options.Callback();
        }

    };  //end: callback

    var _fn = function (arr, index) {

        if (!arr || index >= arr.length) {
            _callback();
        }
        else {
            var $vw = $($(arr).get(index));

            $vw.trigger("events.userRoles_bind_classification_group", {
                "Callback": function () {
                    _fn(arr, index + 1);
                }
            });
        }
    };

    var _lookupAccessRestriction = options.LookupAccessRestriction;

    _instance.GetData({ "Type": "ClassificationList" }, function (result) {

        if (result.Success) {

            var _classificationList = (result.Data && result.Data.List ? result.Data.List : null);
            var _html = "<div class='CEditorTableAdminUserRoles'>";

            _classificationList = (_classificationList || []);

            var _fnAppendRowHTML = function (td1, td2) {
                _html += "<div class='TableBlockRow'>" +
                         "   <div class='TableBlockCell TableBlockHeadingCell'>" + td1 + "</div>" +
                         "   <div class='TableBlockCell'>" + td2 + "</div>" +
                         "</div>";
            };

            for (var c = 0; c < _classificationList.length; c++) {
                var _classification = _classificationList[c];
                var _classificationID = _classification[enColClassificationProperty.ClassificationID];
                var _hasClassificationAccess = (!_lookupAccessRestriction || !_lookupAccessRestriction.Classification ||
                                                _lookupAccessRestriction.Classification[_classificationID] == true);

                var _opts = _instance.Utils.GetDefaultOptions({ "Type": "Classification", "StrJSON": _classification[enColClassificationProperty.OptionJSON] });

                var _isDisableMultipleRoles = (_opts && _opts["UserRoles"] && _opts.UserRoles["DisableMultipleRoles"]);
                var _extControllerOpts = {
                    "IsEnabled": false,
                    "ControllerInstance": null,
                    "Load": function () {

                        this.ControllerInstance = util_forceString(_opts && _opts["UserRoles"] ? _opts.UserRoles["ControllerInstance"] : null);
                        this.IsEnabled = (this.ControllerInstance != "" && util_isDefined(this.ControllerInstance));
                    }
                };

                _extControllerOpts.Load();

                _html += "<div " + util_htmlAttribute("data-attr-user-role-classification-id", _classificationID) + " " +
                         util_htmlAttribute("data-attr-user-role-classification-has-multiple-roles",
                                            _isDisableMultipleRoles ? enCETriState.No : enCETriState.Yes) +
                         (_extControllerOpts.IsEnabled ? " " + util_htmlAttribute("data-attr-user-role-classification-has-controller", enCETriState.Yes) : "") +
                                            ">" +
                         "  <div class='GroupHeaderTitle'>" +
                         util_htmlEncode(_instance.Utils.ForceEntityDisplayName({ "Item": _classification, "Type": "Classification" })) +
                         "</div>";

                _html += "  <div class='GroupContentDetails'>";

                var _btnViewPermHTML = "<a data-attr-user-roles-input-id='clViewPermissions' data-role='button' data-corners='false' data-mini='true' " +
                                       "data-inline='true' data-iconpos='right' data-icon='arrow-r'>" +
                                       util_htmlEncode("View Effective Permissions") +
                                       "</a>";

                var _roleDropdownHTML = "<div class='TableBlockDropdown TableBlockCell_C2'>" +
                                        "    <select data-corners='false' data-mini='true' disabled='disabled' " +
                                        util_htmlAttribute("data-attr-user-roles-input-id", "ddlRoles") + " />" +
                                        (!_isDisableMultipleRoles && _hasClassificationAccess ? 
                                         "   <a class='ActionAddButton' data-role='button' data-mini='true' data-inline='true' data-corners='false' data-icon='plus' " +
                                         "data-iconpos='right' " + util_htmlAttribute("data-attr-user-roles-input-id", "clAddUserRole") + ">" +
                                         util_htmlEncode("Add") + "</a>" :
                                         ""
                                        ) +
                                        "</div>";

                if (_extControllerOpts.IsEnabled) {
                    _html += "<div " + util_htmlAttribute("data-attr-classification-user-role-renderer", _extControllerOpts.ControllerInstance) + ">" +
                             util_htmlEncode("Loading...") +
                             "</div>";
                }
                else if (_isDisableMultipleRoles) {
                    _fnAppendRowHTML("Assigned Role:", _roleDropdownHTML + _btnViewPermHTML);
                }
                else {
                    _fnAppendRowHTML("Select Access Role:", _roleDropdownHTML + _btnViewPermHTML);
                    _fnAppendRowHTML("Assigned Roles:", "<div data-attr-user-roles-input-id='vwUserRoleSelection'>Loading...</div>");
                }

                _html += "  </div>" +
                         "</div>";
            }

            _html += "</div>";

            $element.html(_html);

            $mobileUtil.refresh($element);

            $element.off("events.userRoles_bind_classification_group");
            $element.on("events.userRoles_bind_classification_group", "[data-attr-user-role-classification-id]", function (e, args) {

                var $this = $(this);
                var $ddlRoles = $this.find("[" + util_htmlAttribute("data-attr-user-roles-input-id", "ddlRoles") + "]");
                var $vwUserRoleSelection = $this.find("[" + util_htmlAttribute("data-attr-user-roles-input-id", "vwUserRoleSelection") + "]");
                
                var _classificationID = util_forceInt($this.attr("data-attr-user-role-classification-id"), enCE.None);

                args = util_extend({ "Callback": null }, args);

                var _bindCallback = function () {
                    if (args.Callback) {
                        args.Callback();
                    }
                };

                var _methodName = util_forceString(options.OverridePlatformRoleListWebMethod);

                if (_methodName == "") {
                    _methodName = "ClassificationPlatformRoleList";
                }

                if ($ddlRoles.length == 0 && $vwUserRoleSelection.length == 0) {

                    //check if there is a custom classification user roles renderer
                    var $vwRenderer = $this.find("[data-attr-classification-user-role-renderer]");
                    var _handled = false;

                    if ($vwRenderer.length == 1) {

                        var _type = eval($vwRenderer.attr("data-attr-classification-user-role-renderer"));
                        var _classificationRenderer = new _type();

                        $vwRenderer.data("Controller", _classificationRenderer);

                        if (_classificationRenderer["Render"]) {
                            _handled = true;

                            _classificationRenderer.Render({
                                "PluginInstance": _instance, "Element": $vwRenderer, "Parent": $this, "ClassificationID": _classificationID,
                                "UserID": options.UserID, "DataItem": options.ParamDataItem, "Callback": _bindCallback
                            });
                        }
                    }

                    if (!_handled) {
                        _bindCallback();
                    }

                    return;
                }

                _instance.GetData({
                    "Type": _methodName, "From": "UserRolesView",
                    "Filters": {
                        "ClassificationID": _classificationID
                    }
                }, function (result) {

                    var _roles = (result.Success ? result.Data.List : null);
                    var _selected = util_forceInt($ddlRoles.val(), enCE.None);
                    var _hasMultipleRoles = true;
                    var _hasClassificationAccess = (!_lookupAccessRestriction || !_lookupAccessRestriction.Classification ||
                                                    _lookupAccessRestriction.Classification[_classificationID] == true);
                    
                    _roles = (_roles || []);

                    if (util_forceInt($this.attr("data-attr-user-role-classification-has-multiple-roles"), enCETriState.None) == enCETriState.No) {
                        _hasMultipleRoles = false;
                    }

                    if (_selected == enCE.None && !_hasMultipleRoles) {

                        var _searchUserRole = util_arrFilter(options.UserRolesData, enColUserClassificationPlatformRoleProperty.RoleClassificationID,
                                                             _classificationID, true);

                        if (_searchUserRole.length == 1) {
                            _searchUserRole = _searchUserRole[0];

                            _selected = util_forceInt(_searchUserRole[enColUserClassificationPlatformRoleProperty.RoleID], _selected);
                        }
                    }

                    util_dataBindDDL($ddlRoles, _roles, enColClassificationPlatformRoleProperty.Name, enColClassificationPlatformRoleProperty.RoleID, _selected, true,
                                     enCE.None, "");

                    $ddlRoles.data("List", _roles);

                    try {
                        $ddlRoles.selectmenu(_hasClassificationAccess && _roles.length > 0 ? "enable" : "disable");
                    } catch (e) {
                    }

                    var _filteredUserRoles = util_arrFilter(options.UserRolesData, enColUserClassificationPlatformRoleProperty.RoleClassificationID, _classificationID);

                    if (!_hasMultipleRoles) {

                        //associate the source user roles to the dropdown iteself since does not have multiple roles support
                        $ddlRoles.data("SourceList", _filteredUserRoles);
                    }

                    $vwUserRoleSelection.data("SourceList", _filteredUserRoles);
                    $vwUserRoleSelection.trigger("events.userRoles_bindRoleSelections", { "List": _filteredUserRoles });

                    _bindCallback();
                });

            }); //end: events.userRoles_bind_classification_group

            $element.off("events.userRoles_addRoleSelection");
            $element.on("events.userRoles_addRoleSelection", "[data-attr-user-role-classification-id]", function (e, args){

                var $this = $(this);
                
                args = util_extend({ "RoleID": enCE.None, "TriggerElement": null, "Callback": null }, args);

                var _addCallback = function () {
                    if (args.Callback) {
                        args.Callback();
                    }
                };

                var _roleID = util_forceInt(args.RoleID, enCE.None);

                ClearMessages();

                if (_roleID == enCE.None) {
                    AddUserError("Role is required.", { "IsTimeout": true });
                    _addCallback();
                }
                else {

                    var $vwUserRoleSelection = $this.find("[data-attr-user-roles-input-id='vwUserRoleSelection']");
                    var $search = $vwUserRoleSelection.find("[data-attr-user-role-line-item][data-attr-item-role-id='" + _roleID + "']");

                    if ($search.length) {

                        AddUserError("Role specified already exists.", { "IsTimeout": true });
                        _addCallback();
                    }
                    else {

                        var $ddlRoles = $this.find("[data-attr-user-roles-input-id='ddlRoles']");
                        var _roles = $ddlRoles.data("List");
                        var _selectedRole = util_arrFilter(_roles, enColClassificationPlatformRoleProperty.RoleID, _roleID, true);

                        if (_selectedRole.length) {

                            var _userRole = {};

                            _selectedRole = _selectedRole[0];

                            _userRole[enColUserClassificationPlatformRoleProperty.RoleID] = _roleID;
                            _userRole[enColUserClassificationPlatformRoleProperty.RoleClassificationID] = _classificationID;
                            _userRole[enColUserClassificationPlatformRoleProperty.RoleIDName] = _selectedRole[enColClassificationPlatformRoleProperty.Name];

                            $vwUserRoleSelection.trigger("events.userRoles_bindRoleSelections", { "List": [_userRole], "IsAppend": true, "Callback": _addCallback });
                        }
                        else{
                            _addCallback();
                        }
                    }
                }

            }); //end: events.userRoles_addRoleSelection
            
            $element.off("events.userRoles_renderPermissionSummary");
            $element.on("events.userRoles_renderPermissionSummary", "[data-attr-user-role-classification-id]", function (e, args) {
                
                var $this = $(this);
                var _userRoles = [];

                var _classificationID = util_forceInt($this.attr("data-attr-user-role-classification-id"), enCE.None);

                if (util_forceInt($this.attr("data-attr-user-role-classification-has-multiple-roles"), enCETriState.None) == enCETriState.No) {

                    var _roleID = util_forceInt($this.find("[data-attr-user-roles-input-id='ddlRoles']").val(), enCE.None);

                    if (_roleID != enCE.None) {
                        var _userRole = {};

                        _userRole[enColUserClassificationPlatformRoleProperty.RoleID] = _roleID;
                        _userRole[enColUserClassificationPlatformRoleProperty.RoleClassificationID] = _classificationID;

                        _userRoles.push(_userRole);
                    }
                }
                else {
                    var $vwUserRoleSelection = $this.find("[data-attr-user-roles-input-id='vwUserRoleSelection']");

                    $.each($vwUserRoleSelection.find("[data-attr-user-role-line-item][data-attr-item-role-id]"), function () {
                        var _userRole = {};

                        _userRole[enColUserClassificationPlatformRoleProperty.RoleID] = util_forceInt($(this).attr("data-attr-item-role-id"), enCE.None);
                        _userRole[enColUserClassificationPlatformRoleProperty.RoleClassificationID] = _classificationID;

                        _userRoles.push(_userRole);
                    });
                }

                if (_userRoles.length == 0) {
                    return;
                }

                var _html = "<div class='EffectivePermissionSummary'>" +
                            "  <div class='SubHeaderTitle'>" +
                            "<div class='Label'>" + util_htmlEncode("Effective Permissions") + "</div>" +
                            "<div class='Actions'><select id='ddlFilterComponentView' disabled='disabled' data-corners='false' data-mini='true' />" + "</div>" +
                            "   </div>" +
                            "  <div class='GroupContentDetails'>" +
                            "       <div class='IndicatorSmall' />" +
                            "   </div>" +
                            "</div>";

                var _fnRenderPermissionSummary = function (viewRenderOpts) {
                    viewRenderOpts = util_extend({ "Container": null, "SummaryList": null, "Callback": null, "ContextClassificationID": enCE.None }, viewRenderOpts);

                    var $container = $(viewRenderOpts.Container);
                    var _components = ($container.data("data-components") || []);
                    var _platforms = ($container.data("data-platforms") || []);
                    var _userRoles = ($container.data("data-user-roles") || []);
                    var _summaryList = (viewRenderOpts.SummaryList || []);

                    var _summaryHTML = "";

                    var _lookupName = $container.data("data-lookup-name");

                    if (!_lookupName) {
                        _lookupName = {
                            "m_platforms": _platforms,
                            "m_userRoles": _userRoles,
                            "m_lookup": {},
                            "GetByPlatformID": function (searchPlatformID) {

                                searchPlatformID = util_forceInt(searchPlatformID, enCE.None);

                                var _val = "";
                                var _key = "platform_" + searchPlatformID;
                                var _lookup = this.m_lookup;

                                if (_lookup[_key]) {
                                    _val = _lookup[_key];
                                }
                                else {
                                    var _platform = util_arrFilter(this.m_platforms, enColPlatformProperty.PlatformID, searchPlatformID, true);

                                    _platform = (_platform.length ? _platform[0] : null);

                                    _val = _instance.Utils.ForceEntityDisplayName({ "Item": _platform, "Type": "Platform" });

                                    _lookup[_key] = _val;
                                }

                                return _val;
                            },
                            "GetByUserRoleID": function (searchUserRoleID) {
                                searchUserRoleID = util_forceInt(searchUserRoleID, enCE.None);

                                var _val = "";
                                var _key = "role_" + searchUserRoleID;
                                var _lookup = this.m_lookup;

                                if (_lookup[_key]) {
                                    _val = _lookup[_key];
                                }
                                else {
                                    var _userRole = util_arrFilter(this.m_userRoles, enColRoleProperty.RoleID, searchUserRoleID, true);

                                    _userRole = (_userRole.length ? _userRole[0] : null);

                                    if (_userRole) {
                                        _val = _userRole[enColRoleProperty.Name];
                                    }
                                    else {
                                        _val = NA;
                                    }

                                    _lookup[_key] = _val;
                                }

                                return _val;
                            }
                        };
                        
                        $container.data("data-lookup-name", _lookupName);
                    }

                    var _filterDataList = [];
                    var _componentListMergePermission = "%%TOK|ROUTE|PluginEditor|ComponentListMergePermission%%";

                    _componentListMergePermission = (_componentListMergePermission || []);

                    for (var c = 0; c < _components.length; c++) {
                        var _component = _components[c];
                        var _componentID = _component[enColComponentProperty.ComponentID];

                        var _filteredList = util_arrFilter(_summaryList, enColCPlatformComponentUserRoleProperty.ComponentID, _componentID);

                        if (_filteredList.length > 0) {
                            var _componentName = _instance.Utils.ForceEntityDisplayName({ "Item": _component, "Type": "Component" });

                            _filterDataList.push({ "Text": _componentName, "Value": _componentID });

                            _summaryHTML += "<div class='Detail' " + util_htmlAttribute("data-attr-summary-component-id", _componentID) + ">" +
                                            "   <div class='ProjectThemePrimaryColor GroupHeaderTitle'>" +
                                            util_htmlEncode(_componentName) +
                                            "   </div>" +
                                            "   <div class='Content'>";

                            var _fnGetContentHTML = function (platformComponentUserRoles, renderOpts) {

                                var _ret = "";

                                platformComponentUserRoles = (platformComponentUserRoles || []);

                                renderOpts = util_extend({ "Fields": null }, renderOpts);

                                for (var s = 0; s < platformComponentUserRoles.length; s++) {
                                    var _userRoleSummary = platformComponentUserRoles[s];
                                    var _platformID = _userRoleSummary[enColCPlatformComponentUserRoleProperty.PlatformID];
                                    var _enabled = (_userRoleSummary[enColCPlatformComponentUserRoleProperty.IsActive] == true);
                                    var _platformName = _lookupName.GetByPlatformID(_platformID);

                                    _ret += "<div class='PluginEditorCardView" + (!_enabled ? " StateDisabled" : "") + "'>" +
                                            "   <div class='ProjectThemeSecondaryColor Title'>" + util_htmlEncode(_platformName) + "</div>";

                                    var _arrProps = _instance.Configuration.Views.EffectivePermissionSummaryList.Columns;

                                    for (var p = 0; p < _arrProps.length; p++) {
                                        var _prop = _arrProps[p];
                                        var _propName = _prop.Property;
                                        var _heading = _prop["Heading"];
                                        var _dataFormat = _prop["Format"];
                                        var _propContent = _userRoleSummary[_propName];
                                        var _valid = true;

                                        if (_prop["IsValidRender"]) {
                                            var _fnIsValidRender = _prop.IsValidRender;

                                            _valid = _fnIsValidRender.apply(_prop, [{
                                                "Configuration": _prop, "Data": _userRoleSummary, "ComponentItem": _component,
                                                "ClassificationID": viewRenderOpts.ContextClassificationID
                                            }]);
                                        }

                                        if (_valid) {

                                            switch (_dataFormat) {

                                                case enCDataFormat.Boolean:

                                                    if (_propContent === true) {
                                                        _propContent = "Yes";
                                                    }
                                                    else if (_propContent === false) {
                                                        _propContent = "No";
                                                    }
                                                    else {
                                                        _propContent = NA;
                                                    }

                                                    break;

                                                case enCDataFormat.Lookup:

                                                    if (_prop["LookupMethod"]) {
                                                        var _fnLookup = _lookupName[_prop.LookupMethod];

                                                        if (_fnLookup) {
                                                            _propContent = _fnLookup.apply(_lookupName, [_propContent]);
                                                        }
                                                    }

                                                    break;
                                            }

                                            if (!_heading) {
                                                _heading = _propName;
                                            }

                                            _ret += "<div class='TableBlockRow'>" +
                                                    "   <div class='TableBlockCell ColumnHeading'>" + util_htmlEncode(_heading) + "</div>" +
                                                    "   <div class='TableBlockCell_C2 ColumnContent'>" + util_htmlEncode(_propContent) + "</div>" +
                                                    "</div>";
                                        }
                                    }

                                    if (renderOpts.Fields) {
                                        for (var f = 0; f < renderOpts.Fields.length; f++) {
                                            var _field = renderOpts.Fields[f];

                                            _ret += "<div class='TableBlockRow'>" +
                                                    "   <div class='TableBlockCell ColumnHeading'>" + util_htmlEncode(_field["n"]) + "</div>" +
                                                    "   <div class='TableBlockCell_C2 ColumnContent'>" + util_forceString(_field["html"]) + "</div>" +
                                                    "</div>";
                                        }
                                    }

                                    _ret += "</div>";
                                }

                                return _ret;

                            };  //end: _fnGetContentHTML

                            var _hasMergedPermissions = (util_arrFilter(_componentListMergePermission, null, _componentID, true).length == 1);

                            if (_hasMergedPermissions) {
                                var _mergedPermission = new CPlatformComponentUserRole();
                                var _search;
                                var _isActive = (util_arrFilter(_filteredList, enColCPlatformComponentUserRoleProperty.IsActive, true, true).length == 1);
                                var _roleID = null;

                                _mergedPermission[enColCPlatformComponentUserRoleProperty.IsActive] = _isActive;

                                _search = util_arrFilterSubset(_filteredList, function (search) {
                                    return (search[enColCPlatformComponentUserRoleProperty.IsActive] == true &&
                                            search[enColCPlatformComponentUserRoleProperty.UserRoleID] == enCERoleBase.Administrator
                                           );
                                }, true);

                                if (_search.length == 1) {
                                    _roleID = enCERoleBase.Administrator;
                                }
                                else {
                                    _search = util_arrFilterSubset(_filteredList, function (search) {
                                        return (search[enColCPlatformComponentUserRoleProperty.IsActive] == true &&
                                                search[enColCPlatformComponentUserRoleProperty.UserRoleID] == enCERoleBase.User
                                               );
                                    }, true);

                                    if (_search.length == 1) {
                                        _roleID = enCERoleBase.User;
                                    }
                                }

                                _mergedPermission[enColCPlatformComponentUserRoleProperty.UserRoleID] = _roleID;

                                _instance.ProjectOnMergeComponentPermissions({
                                    "ComponentID": _componentID,
                                    "Item": _mergedPermission,
                                    "Permissions": _filteredList
                                });

                                var _platformsHTML = "";

                                for (var p = 0; p < _platforms.length; p++) {
                                    var _platform = _platforms[p];
                                    var _platformID = _platform[enColPlatformProperty.PlatformID];

                                    _search = util_arrFilter(_filteredList, enColCPlatformComponentUserRoleProperty.PlatformID, _platformID, true);
                                    _search = (_search.length == 1 ? _search[0] : null);

                                    if (_search && _search[enColCPlatformComponentUserRoleProperty.IsActive] == true) {
                                        _platformsHTML += "<li>" + util_htmlEncode(_lookupName.GetByPlatformID(_platformID)) + "</li>";
                                    }
                                }

                                if (_platformsHTML == "") {
                                    _platformsHTML += util_htmlEncode("There are no platforms available.");
                                }
                                else {
                                    _platformsHTML = "<ul>" + _platformsHTML + "</ul>";
                                }

                                _summaryHTML += _fnGetContentHTML([_mergedPermission], {
                                    "Fields": [{ "n": "Platforms:", "html": _platformsHTML }]
                                });

                                _summaryHTML += "<div class='PreviewPermissionBreakdown StateOn'>" +
                                                "<div class='DisableUserSelectable Message ProjectThemeSecondaryColor ActionRestore'>" +
                                                "   <div class='Label'><i class='material-icons'>info_outline</i>" +
                                                "<div>" + util_htmlEncode("Hide details of the source permissions") + "</div>" +
                                                "   </div>" +
                                                "</div>" +
                                                _fnGetContentHTML(_filteredList) + 
                                                "<div class='DisableUserSelectable Message ProjectThemeSecondaryColor'>" +
                                                "   <div class='Label'><i class='material-icons'>info</i>" +
                                                "<div>" + util_htmlEncode("Click to view details of the source permissions") + "</div>" +
                                                "   </div>" +
                                                "</div>" +
                                                "</div>";
                            }
                            else {
                                _summaryHTML += _fnGetContentHTML(_filteredList);
                            }

                            _summaryHTML += "   </div>" +
                                            "</div>";
                        }
                    }

                    var $content = $container.find(".GroupContentDetails");

                    $content.fadeOut("normal", function () {

                        $content.html(_summaryHTML);
                        $mobileUtil.refresh($content);

                        var $ddlFilterComponentView = $container.find("#ddlFilterComponentView");
                        var _selectedValue = util_forceInt($mobileUtil.ActivePage().data("_EffectivePermissionsFilterComponentID"), enCE.None);

                        util_dataBindDDL($ddlFilterComponentView, _filterDataList, "Text", "Value", _selectedValue, true, enCE.None, "");

                        try {
                            $ddlFilterComponentView.selectmenu("enable");
                        } catch (e) {
                        }

                        $ddlFilterComponentView.off("change.onFilterView");
                        $ddlFilterComponentView.on("change.onFilterView", function () {
                            var _componentID = util_forceInt($(this).val(), enCE.None);
                            var $list = $ddlFilterComponentView.data("List");

                            if (!$list || $list.length == 0) {
                                $list = $container.find("[data-attr-summary-component-id]");
                                $ddlFilterComponentView.data("List", $list);
                            }

                            //persist the selected filter
                            $mobileUtil.ActivePage().data("_EffectivePermissionsFilterComponentID", _componentID);

                            if (_componentID == enCE.None) {
                                $list.removeClass("EditorElementHidden");
                            }
                            else {
                                var $current = $list.filter("[" + util_htmlAttribute("data-attr-summary-component-id", _componentID) + "]");

                                $list.not($current).addClass("EditorElementHidden");
                                $current.removeClass("EditorElementHidden");
                            }

                        }); //end: change.onFilterView

                        $content.off("click.onToggleDetailView");
                        $content.on("click.onToggleDetailView",
                                    ".PreviewPermissionBreakdown.StateOn, .PreviewPermissionBreakdown:not(.StateOn) .ActionRestore",
                                    function () {

                                        $(this).closest(".PreviewPermissionBreakdown")
                                               .toggleClass("StateOn");
                                    }); //end: click.onToggleDetailView

                        if (_selectedValue != enCE.None) {
                            $ddlFilterComponentView.trigger("change");
                        }

                        $content.toggle("height");
                    });

                };  //end: _fnRenderPermissionSummary

                if (options.TemplateRenderOptions && options.TemplateRenderOptions["TransitionInlineScreen"]) {
                    options.TemplateRenderOptions.TransitionInlineScreen({
                        "HTML": _html, "Callback": function (opts) {
                            opts = util_extend({ "Container": null }, opts);

                            var $container = $(opts.Container);

                            APP.Service.Action({
                                "c": "PluginEditor", "m": "EffectivePermissionSummaryUserPlatformRoles",
                                "args": { "UserRoles": util_stringify(_userRoles) }
                            }, function (roleSummaryList) {

                                var _permSummaryOptions = { "Container": $container, "SummaryList": roleSummaryList, "ContextClassificationID": _classificationID };

                                if (!$container.data("is-data-init")) {

                                    _instance.GetData({ "Type": "ApplicationRoleList", "From": "AdminRoleEdit" }, function (resultRoles) {
                                        var _userRoles = (resultRoles.Success && resultRoles.Data ? resultRoles.Data.List : null);

                                        _instance.GetData({ "Type": "PlatformList" }, function (result1) {
                                            var _platforms = (result1.Success && result1.Data ? result1.Data.List : null);

                                            _platforms = (_platforms || []);

                                            _instance.GetData({ "Type": "ComponentList" }, function (result2) {

                                                var _components = (result2.Success && result2.Data ? result2.Data.List : null);

                                                _components = (_components || []);

                                                $container.data("is-data-init", true);
                                                $container.data("data-platforms", _platforms);
                                                $container.data("data-components", _components);
                                                $container.data("data-user-roles", _userRoles);

                                                _fnRenderPermissionSummary(_permSummaryOptions);
                                            });

                                        });

                                    });

                                }
                                else {
                                    _fnRenderPermissionSummary(_permSummaryOptions);
                                }

                            });

                        }
                    });
                }
                else {

                    var $summary = $this.find(".EffectivePermissionSummary");

                    if ($summary.length == 0) {
                        var $row = $this.find("[data-attr-user-roles-input-id='clViewPermissions']").closest(".TableBlockRow");

                        $summary = $(_html);

                        if ($row.length == 0) {
                            $summary.addClass("TableBlockRow");
                            $this.append($summary);
                        }
                        else {
                            $summary.insertAfter($row);
                        }

                        $summary.trigger("create");
                    }
                }

            }); //end: events.userRoles_renderPermissionSummary

            $element.off("events.userRoles_bindRoleSelections");
            $element.on("events.userRoles_bindRoleSelections", "[data-attr-user-roles-input-id='vwUserRoleSelection']", function (e, args) {

                var $this = $(this);

                args = util_extend({ "List": [], "IsAppend": false, "Callback": null }, args);

                var _userRoles = (args.List || []);
                var _html = "";
                
                if (!$this.data("is-init")) {
                    $this.data("is-init", true);
                    $this.html("<div class='NoRecordsMessage' style='display: none;'>" + util_htmlEncode("There are no roles available.") + "</div>");
                }

                for (var i = 0; i < _userRoles.length; i++) {
                    var _userRole = _userRoles[i];
                    var _platformID = _userRole[enColUserClassificationPlatformRoleProperty.RolePlatformID];
                    var _hasPlatformAccess = (!_lookupAccessRestriction || !_lookupAccessRestriction.Platform || _lookupAccessRestriction.Platform[_platformID] == true);

                    _html += "<div class='ListLineItemView' " + util_htmlAttribute("data-attr-user-role-line-item", enCETriState.Yes) + " " +
                             util_htmlAttribute("data-attr-item-role-id", _userRole[enColUserClassificationPlatformRoleProperty.RoleID]) + " " +
                             util_htmlAttribute("data-attr-item-role-platform-id", _platformID) + ">" +
                             "  <div class='TableBlockCell_C2'>" + util_htmlEncode(_userRole[enColUserClassificationPlatformRoleProperty.RoleIDName]) + "</div>" +
                             (_hasPlatformAccess ? "<a data-role='button' data-corners='false' data-mini='true' data-inline='true' data-icon='delete' " +
                                                   "data-iconpos='right' " + util_htmlAttribute("data-attr-user-roles-input-id", "clRemoveUserRole") + ">" +
                                                   util_htmlEncode("Remove") +
                                                   "  </a>" :
                                                   "&nbsp;") +
                             "</div>";
                }

                if (!args.IsAppend) {
                    $this.find("[data-attr-user-role-line-item]")
                         .remove();
                }

                var $temp = $(_html);

                $temp.hide();

                $this.append($temp);

                $this.find(".NoRecordsMessage")
                     .toggle(_userRoles.length == 0);

                $mobileUtil.refresh($this);

                $temp.toggle("height");

                if (args.Callback) {
                    args.Callback();
                }

            }); //end: events.userRoles_bindRoleSelections

            var _arrInputID = ["clAddUserRole", "clRemoveUserRole", "clViewPermissions"];
            var _selector = "";

            for (var s = 0; s < _arrInputID.length; s++) {
                var _id = _arrInputID[s];

                _selector += (s > 0 ? ", " : "") + "[data-attr-user-roles-input-id='" + _id + "']";
            }

            $element.off("click.userRoles_inputButton");
            $element.on("click.userRoles_inputButton", _selector,
                        function (e, args) {

                            var $btn = $(this);
                            var _id = $btn.attr("data-attr-user-roles-input-id");
                            var $parentClassification = $btn.closest("[data-attr-user-role-classification-id]");

                            switch (_id) {

                                case "clAddUserRole":

                                    var $ddlRoles = $parentClassification.find("[data-attr-user-roles-input-id='ddlRoles']");
                                    var _roleID = util_forceInt($ddlRoles.val(), enCE.None);

                                    $parentClassification.trigger("events.userRoles_addRoleSelection", {
                                        "RoleID": _roleID,
                                        "TriggerElement": $btn,
                                        "Callback": function () {

                                            $mobileUtil.SetDropdownListValue($ddlRoles, enCE.None); //clear the dropdown
                                        }
                                    });

                                    break;  //end: clAddUserRole

                                case "clRemoveUserRole":

                                    _instance.Utils.ToggleInlineConfirmation({
                                        "Target": $btn, "OnPositiveClick": function () {
                                            var $line = $btn.closest("[data-attr-user-role-line-item]");

                                            $line.removeAttr("data-attr-item-role-id");

                                            $line.toggle("height").promise().done(function () {
                                                $line.remove();
                                            });
                                        }
                                    });

                                    break;  //end: clRemoveUserRole

                                case "clViewPermissions":

                                    $parentClassification.trigger("events.userRoles_renderPermissionSummary");

                                    break;  //end: clViewPermissions
                            }

                        }); //end: click.userRoles_inputButton

            $element.off("events.userRoles_populateItem");
            $element.on("events.userRoles_populateItem", function (e, args) {
                args = util_extend({ "Item": null, "Callback": null }, args);

                var _item = (args.Item || {});
                var _userRoles = [];

                var _fnAddUserRole = function (roleID, srcList) {

                    if (roleID != enCE.None) {

                        var _userRole = util_arrFilter(srcList, enColUserClassificationPlatformRoleProperty.RoleID, roleID, true);

                        if (_userRole.length == 1) {
                            _userRole = _userRole[0];
                        }
                        else {
                            _userRole = {};
                        }

                        _userRole[enColUserClassificationPlatformRoleProperty.RoleID] = roleID;

                        _userRoles.push(_userRole);
                    }

                };  //end: _fnAddUserRole

                _item[enColUserExtProperty.UserClassificationPlatformRoles] = _userRoles;

                var $classifications = $element.find("[data-attr-user-role-classification-id]");
                var _queue = new CEventQueue();

                $.each($classifications, function () {
                    var $classification = $(this);
                    var _classificationID = util_forceInt($classification.attr("data-attr-user-role-classification-id"), enCE.None);

                    if (util_forceInt($classification.attr("data-attr-user-role-classification-has-controller"), enCETriState.None) == enCETriState.Yes) {
                        var $vwRenderer = $classification.find("[data-attr-classification-user-role-renderer]");
                        var _classificationController = $vwRenderer.data("Controller");

                        if (_classificationController && _classificationController["Populate"]) {

                            _queue.Add(function (onCallback) {

                                _classificationController.Populate({
                                    "PluginInstance": _instance, "Element": $vwRenderer, "Parent": $classification, "ClassificationID": _classificationID,
                                    "UserID": options.UserID, "DataItem": _item, "Callback": onCallback
                                });

                            });
                        }
                    }
                    else if (util_forceInt($classification.attr("data-attr-user-role-classification-has-multiple-roles"), enCETriState.None) == enCETriState.No) {

                        //single role only
                        var $ddlRoles = $classification.find("[data-attr-user-roles-input-id='ddlRoles']");
                        var _roleID = util_forceInt($ddlRoles.val(), enCE.None);

                        _fnAddUserRole(_roleID, $ddlRoles.data("SourceList"));
                    }
                    else {

                        //multiple roles supported
                        var $vwUserRoleSelection = $classification.find("[data-attr-user-roles-input-id='vwUserRoleSelection']");
                        var _sourceFilteredUserRoles = $vwUserRoleSelection.data("SourceList");

                        $.each($vwUserRoleSelection.find("[data-attr-user-role-line-item][data-attr-item-role-id]"), function () {
                            var _roleID = util_forceInt($(this).attr("data-attr-item-role-id"), enCE.None);

                            _fnAddUserRole(_roleID, _sourceFilteredUserRoles);
                        });
                    }
                });

                _queue.Run({
                    "Callback": function () {

                        if (args.Callback) {
                            args.Callback(_item);
                        }
                    }
                });

            }); //end: events.userRoles_populateItem

            var $list = $element.find("[data-attr-user-role-classification-id]");

            //if it is a new user being specified, then force default user roles data
            if (options.UserID == enCE.None) {
                options.UserRolesData = [];
            }

            if (!options.UserRolesData) {

                //load the current user's roles data and bind
                _instance.GetData({ "Type": "UserClassificationPlatformRoleList", "Filters": { "UserID": options.UserID } }, function (result) {

                    options.UserRolesData = (result.Success ? result.Data.List : null);
                    options.UserRolesData = (options.UserRolesData || []);

                    _fn($list, 0);
                });
            }
            else {

                //bind using the existing user roles
                _fn($list, 0);
            }

        }
        else {
            _callback();
        }
    });

};  //end: UserRolesView

CPluginEditor.prototype.RenderEvents.UserHomeView = function (options) {

    options = util_extend({
        "Element": null, "Callback": null, "Instance": null, "UserID": null, "UserRolesData": null, "IsConsolidatedLandingView": true,
        "HtmlTemplates": {
            "ClassificationDetail": "<div class='%%CSS_CLASS%%' %%ATTR%%>" +
                                    "    <div class='Label'>%%TITLE%%</div>" +
                                    "</div>",
            "ClassificationPlatformDetail": "<div class='%%CSS_CLASS%%' %%ATTR%%>" +
                                            "    <div class='Label'>%%TITLE%%</div>" +
                                            "</div>",
            "EmptyListItems": "<div>" + util_htmlEncode("There are no items available for selection.") + "</div>",
            "NavigateBackButtonInline": "<div style='text-align: right;'>" +
                                        "   <a %%ATTR_NAV_BTN%% class='LinkClickable' data-role='button' data-icon='arrow-l' data-inline='true' data-mini='true' " +
                                        "data-corners='false' data-theme='transparent'>" +
                                        util_htmlEncode("Return") +
                                        "   </a>" +
                                        "</div>",
            "LandingPermissionNoAccess": util_htmlEncode("No modules have been configured for this account.") +
                                         "<br />" +
                                         util_htmlEncode("If this is a mistake, please contact the Administrator to request access.")
        },
        "PopulateExtTokens": null,   //where function(populateOpts){ ... } with {"Tokens", "Type", "Item", "RenderData"}
        "Events": {
            "OnClassificationClick": function (opts) {
                opts = util_extend({ "ItemID": enCE.None, "Item": null, "Event": null, "Element": null, "Parent": null, "FnAnimateSelection": null }, opts);

                return false;   //flag that it is not handled
            },
            "OnClassPlatformClick": function (opts) {
                opts = util_extend({
                    "ItemID": enCE.None, "Item": null, "Event": null, "Element": null, "Parent": null, "FnAnimateSelection": null
                }, opts);

                return false;   //flag that it is not handled
            }
        },
        "RestoreDefaultView": {
            "Name": "classification",   //one of: classification, class_platform, platform_component, component
            "Parameters": null
        }
    }, options, true, true);

    var _instance = options.Instance;

    var $element = $(options.Element);
    var _callback = function () {

        if (options.Callback) {
            options.Callback();
        }

    };  //end: callback

    var _fnGetClassificationData = function (opts, dataCallback) {
        opts = util_extend({ "Container": null, "ItemID": enCE.None, "PopulateResult": null }, opts);

        _instance.GetData({
            "Type": "ClassificationPlatformList", "Filters": { "ClassificationID": opts.ItemID, "IsUserFiltered": true },
            "From": "UserHomeView"
        }, function (result) {
            var _classPlatformList = (result && result.Success && result.Data ? result.Data.List : null);

            var $container = $(opts.Container);
            var _result = opts.PopulateResult;

            if (!_result) {
                _result = {};
                opts.PopulateResult = _result;
            }

            _result["List"] = _classPlatformList;
            _result["PlatformList"] = $container.data("list-platforms");

            var _dataCallback = function () {
                if (dataCallback) {
                    dataCallback(_result);
                }
            };

            if (!_result.PlatformList) {
                _instance.GetData({ "Type": "PlatformList", "From": "UserHomeView" },
                                  function (platformResult) {
                                      _result.PlatformList = (platformResult && platformResult.Success && platformResult.Data ?
                                                              platformResult.Data.List : null);
                                      _result.PlatformList = (_result.PlatformList || []);

                                      _dataCallback();
                                  });

            } else {
                _dataCallback();
            }
        });

    };    //end: _fnGetClassificationData

    var _fnGetData = function (resultCallback) {
        var _result = {};

        var _arr = [];

        _arr.push(function (dataCallback) {
            _instance.GetData({ "Type": "ClassificationList", "Filters": { "IsUserFiltered": true }, "From": "UserHomeView" },
                              function (result) {
                                  _result["Classifications"] = (result && result.Success && result.Data ? result.Data["List"] : null);
                                  dataCallback(_result);
                              });
        });

        //get user roles and permission summary
        _arr.push(function (dataCallback) {

            APP.Service.Action({ "c": "PluginEditor", "m": "UserClassificationPlatformRoleGetByForeignKey" }, function (userRoles) {

                _result["UserRoles"] = (userRoles ? userRoles.List : null);

                APP.Service.Action({
                    "c": "PluginEditor", "m": "EffectivePermissionSummaryUserPlatformRoles",
                    "args": { "UserRoles": util_stringify(_result.UserRoles), "IsLookupFormat": true }
                }, function (permissionSummary) {

                    _result["PermissionSummary"] = permissionSummary;

                    if (dataCallback) {
                        dataCallback();
                    }
                });

            });

        });

        if (options.IsConsolidatedLandingView) {
            _arr.push(function (dataCallback) {
                _fnGetClassificationData({ "Container": $element, "PopulateResult": _result }, dataCallback);
            });
        }

        var _fn = function () {
            if (_arr.length == 0) {
                resultCallback(_result);
            }
            else {
                var _fnData = _arr.shift();

                _fnData(_fn);
            }
        };

        _fn();

    };  //end: _fnGetData

    _fnGetData(function (result) {

        var _classifications = result.Classifications;
        var _html = "";

        _classifications = (_classifications || []);

        _html += "<div class='CEditorHomeView'>" +
                 "    <div data-attr-home-listing='main'>";

        //apply permissions to verify if user has access to the classification
        _classifications = util_arrFilterSubset(_classifications, function (classificationItem) {
            var _searchClassificationID = classificationItem[enColClassificationProperty.ClassificationID];
            var _valid = true;

            if (_valid) {
                _valid = (util_arrFilter(result.UserRoles, enColUserClassificationPlatformRoleProperty.RoleClassificationID, _searchClassificationID, true).length == 1);

                //check if the classification is unmanaged (i.e. does not require standard user classification role)
                if (!_valid) {
                    var _classificationOpts = _instance.Utils.GetDefaultOptions({
                        "Type": "Classification", "StrJSON": classificationItem[enColClassificationProperty.OptionJSON]
                    });

                    if (_classificationOpts && _classificationOpts["UserHomeView"] && _classificationOpts.UserHomeView["IsUnmanaged"]) {
                        _valid = true;
                    }
                }
            }
            
            if (_valid) {

                //check user has access to one of the modules within the classification item
                var _permissionSummaryList = result.PermissionSummary[_searchClassificationID];

                _valid = false;                               

                if (_permissionSummaryList) {
                    _valid = util_arrFilter(_permissionSummaryList, enColCPlatformComponentUserRoleProperty.IsActive, true, true);
                }
            }

            return _valid;
        });

        for (var i = 0; i < _classifications.length; i++) {
            var _classification = _classifications[i];
            var _opts = _instance.Utils.GetDefaultOptions({ "Type": "Classification", "StrJSON": _classification[enColClassificationProperty.OptionJSON] });
            var _isDisabled = false;
            var _tokens = {};

            if (_opts && _opts["UserHomeView"] && _opts.UserHomeView["IsDisabled"]) {
                _isDisabled = true;
            }

            _tokens["%%CSS_CLASS%%"] = "DisableUserSelectable DetailItem LinkClickable" + (_isDisabled ? " LinkDisabled" : "");
            _tokens["%%ATTR%%"] = util_htmlAttribute("data-attr-home-classification-id", _classification[enColClassificationProperty.ClassificationID]);
            _tokens["%%TITLE%%"] = util_htmlEncode(_instance.Utils.ForceEntityDisplayName({ "Type": "Classification", "Item": _classification }));

            if (options.PopulateExtTokens) {
                options.PopulateExtTokens({
                    "PluginInstance": _instance,
                    "RenderType": "classification", "Item": _classification, "ClassificationOptions": _opts, "IsDisabled": _isDisabled, "Tokens": _tokens,
                    "RenderData": result
                });
            }

            _html += util_replaceTokens(options.HtmlTemplates.ClassificationDetail, _tokens);
        }

        if (_classifications.length == 0) {
            _html += util_forceString(options.HtmlTemplates.LandingPermissionNoAccess);
        }

        _html += "    </div>" +
                 "</div>";

        var $temp = $(_html);
        var _fnIsBusy = function (obj) {
            return $(obj).closest(".CEditorHomeView").data("is-busy");
        };

        $element.append($temp);
        $mobileUtil.refresh($temp);

        $temp.data("list-classifications", _classifications)
             .data("data-permission-summary", result.PermissionSummary);

        if (options.IsConsolidatedLandingView) {
            $temp.find("[data-attr-home-listing='main']")
                 .data("list-classification-platforms", result && result["List"] ? result.List : null);
        }
        
        var _lookupPermissionSummary = result.PermissionSummary;

        var _fnGetClassPlatformData = function (opts, dataCallback) {
            opts = util_extend({ "Target": null, "Container": null, "ItemID": enCE.None, "Item": null }, opts);

            _instance.GetData({
                "Type": "ClassificationPlatformComponentList", "Filters": {
                    "ClassificationPlatformID": opts.ItemID, "IsUserFiltered": true, "SortColumn": enColClassificationPlatformComponent.ComponentDisplayOrder
                },
                "From": "UserHomeView"
            }, function (result) {

                var _platformComponentList = (result && result.Success && result.Data ? result.Data.List : null);
                var $container = $(opts.Container);
                var _result = { "List": _platformComponentList };

                var _classificationID = opts.Item[enColClassificationPlatformProperty.ClassificationID];
                var _permissionSummaryList = (_lookupPermissionSummary[_classificationID] || []);
                
                //apply permissions for only active components for the platform
                _result.List = util_arrFilterSubset(_result.List, function (search) {
                    var _searchPlatformID = search[enColClassificationPlatformComponentProperty.RefPlatformID];
                    var _searchComponentID = search[enColClassificationPlatformComponentProperty.ComponentID];
                    var _active = false;
                    
                    for (var p = 0; p < _permissionSummaryList.length; p++) {
                        var _permSummary = _permissionSummaryList[p];

                        if (_permSummary[enColCPlatformComponentUserRoleProperty.PlatformID] == _searchPlatformID &&
                            _permSummary[enColCPlatformComponentUserRoleProperty.ComponentID] == _searchComponentID) {
                            _active = (_permSummary[enColCPlatformComponentUserRoleProperty.IsActive] == true);
                            break;
                        }
                    }

                    return _active;
                });


                if (dataCallback) {
                    dataCallback(_result);
                }
            });

        };    //end: _fnGetClassPlatformData

        $temp.off("click.homeview_loadClassification");
        $temp.on("click.homeview_loadClassification", 
                (options.IsConsolidatedLandingView ? "[data-attr-home-classification-id] .ActionLink" :
                                                     ":not(.LinkSelected):not(.LinkDisabled)[data-attr-home-classification-id]"),
                function (e, args) {

                    args = util_extend({ "IsAnimate": true, "Callback": null }, args);

                    $(this).trigger("events.homeview_onDetailItemSelection", {
                        "IsAnimate": args.IsAnimate,
                        "Callback": args.Callback,
                        "PropertyIdentifier": "data-attr-home-classification-id", "PropertyClickEvent": "OnClassificationClick",
                        "SelectorPostProcessParentView": "[data-attr-home-listing='main']",
                        "AttributeNameDetailsView": "data-attr-home-current-classification-id",
                        "GetDataItemFromSource": function (opts) {

                            var _classification = util_arrFilter($(opts.Parent).data("list-classifications"), enColClassificationProperty.ClassificationID,
                                                                  opts.SearchID, true);

                            _classification = (_classification.length == 1 ? _classification[0] : {});

                            return _classification;
                        },
                        "GetSelectedItemRenderData": _fnGetClassificationData,
                        "DefaultOptions": {
                            "TypeName": "Classification", "PropertyStrJSON": enColClassificationProperty.OptionJSON, "PropertyClickJS": "ClassificationClickJS"
                        },
                        "PopulateDetailRenderTokens": function (opts) {
                            var _result = opts.DataSelectionResult;
                            var _platforms = (_result ? _result.PlatformList : null);

                            var _platformID = opts.Item[enColClassificationPlatformProperty.PlatformID];
                            var _platform = util_arrFilter(_platforms, enColPlatformProperty.PlatformID, _platformID, true);

                            _platform = (_platform.length == 1 ? _platform[0] : null);

                            opts.Tokens["%%ATTR%%"] = util_htmlAttribute("data-attr-home-class-platform-item-id",
                                                                         opts.Item[enColClassificationPlatformProperty.ID]) + " " +
                                                        util_htmlAttribute("data-attr-home-class-platform-item-platform-id", _platformID);

                            opts.Tokens["%%TITLE%%"] = util_htmlEncode(_instance.Utils.ForceEntityDisplayName({
                                "Type": "Platform",
                                "Item": _platform
                            }));
                        },
                        "OnNavigateBack": function (navOpts) {
                            $(navOpts.Element).find("[data-attr-home-class-platform-item-id]").show();
                        }
                    });
                });

        $temp.off("click.homeview_loadClassPlatformComponent");
        $temp.on("click.homeview_loadClassPlatformComponent", ":not(.LinkSelected):not(.LinkDisabled)[data-attr-home-class-platform-item-id]", function (e, args) {

            args = util_extend({ "IsAnimate": true, "Callback": null }, args);

            $(this).trigger("events.homeview_onDetailItemSelection", {
                "IsAnimate": (options.IsConsolidatedLandingView ? false : args.IsAnimate),
                "IsTargetTrigger": options.IsConsolidatedLandingView,
                "Callback": args.Callback,
                "PropertyIdentifier": "data-attr-home-class-platform-item-id", "PropertyClickEvent": "OnClassPlatformClick",
                "SelectorCurrentView": (options.IsConsolidatedLandingView ? "[data-attr-home-listing]" : "[data-attr-home-current-classification-id]"),
                "AttributeNameDetailsView": "data-attr-home-current-class-platform-id",
                "GetDataItemFromSource": function (opts) {

                    var $view = $(opts.Parent).find(options.IsConsolidatedLandingView ? "[data-attr-home-listing='main']" :
                                                    "[data-attr-home-current-classification-id]");
                    var _classPlatform = util_arrFilter($view.data(options.IsConsolidatedLandingView ? "list-classification-platforms" : "list"),
                                                        enColClassificationPlatformProperty.ID, opts.SearchID, true);

                    _classPlatform = (_classPlatform.length == 1 ? _classPlatform[0] : {});

                    return _classPlatform;
                },
                "GetSelectedItemRenderData": _fnGetClassPlatformData,
                "PopulateDetailRenderTokens": function (opts) {

                    opts.Tokens["%%ATTR%%"] = util_htmlAttribute("data-attr-home-class-platform-comp-item-id",
                                                                 opts.Item[enColClassificationPlatformComponentProperty.ClassificationPlatformID]) + " " +
                                                util_htmlAttribute("data-attr-home-class-platform-component-id",
                                                                   opts.Item[enColClassificationPlatformComponentProperty.ComponentID]);

                    opts.Tokens["%%TITLE%%"] = util_htmlEncode(_instance.Utils.ForceEntityDisplayName({
                        "Type": "ClassificationPlatformComponent",
                        "Item": opts.Item
                    }));

                    if (options.PopulateExtTokens) {
                        options.PopulateExtTokens({
                            "PluginInstance": _instance,
                            "RenderType": "component", "Item": opts.Item, "Tokens": opts.Tokens, "RenderData": result
                        });
                    }
                },
                "OnBindView": function () {
                    var $this = $(this);

                    $this.off("events.homeview_classificationPlatformLoadComponent");
                    $this.on("events.homeview_classificationPlatformLoadComponent", function (e, args) {

                        args = util_extend({ "ComponentID": null, "RenderArguments": null }, args);

                        var _componentID = util_forceInt(args.ComponentID, enCE.None);
                        var $search = $this.find("[data-attr-home-class-platform-comp-item-id]" +
                                                 "[" + util_htmlAttribute("data-attr-home-class-platform-component-id", _componentID) + "]:first");

                        if ($search.length == 1) {
                            $search.trigger("click.homeview_loadComponent", { "RenderArguments": args.RenderArguments });
                        }
                        else {
                            global_unknownErrorAlert();
                        }

                    }); //end: events.homeview_classificationPlatformLoadComponent
                },
                "OnRefreshRenderers": function (opts) {

                    opts = util_extend({ "Element": null, "Callback": null }, opts);

                    var _queue = new CEventQueue();
                    var $vw = $(opts.Element);

                    //refresh all notification renderers for the current view
                    var $list = $vw.find("[" + util_renderAttribute("pluginEditor_notifications") + "]");

                    $.each($list, function () {
                        (function ($this) {

                            _queue.Add(function (onCallback) {
                                $this.trigger("event.notifications_refresh", { "IsDependencyUpdate": true, "Callback": onCallback });
                            });

                        })($(this));
                    });

                    _queue.Run({ "Callback": opts.Callback });
                }
            });

        });

        $temp.off("click.homeview_loadComponent");
        $temp.on("click.homeview_loadComponent", ":not(.LinkSelected):not(.LinkDisabled)[data-attr-home-class-platform-comp-item-id]", function (e, args) {

            args = util_extend({ "IsAnimate": true, "IsDisableTransition": false, "RenderArguments": null, "EditorGroupID": enCE.None, "Callback": null }, args);

            var $this = $(this);
            var $parent = $this.closest(".CEditorHomeView");
            var _fnEnableClick = function () {
                $this.removeClass("LinkDisabled");
            };

            $this.addClass("LinkDisabled");

            if (_fnIsBusy($parent)) {
                _fnEnableClick();
                return;
            }

            var _classPlatformID = util_forceInt($this.attr("data-attr-home-class-platform-comp-item-id"), enCE.None);
            var _componentID = util_forceInt($this.attr("data-attr-home-class-platform-component-id"), enCE.None);

            if (_classPlatformID != enCE.None && _componentID != enCE.None) {

                //check if class platform component link being clicked supports multiple editor groups
                if (args.EditorGroupID == enCE.None && _instance.Data.HasMultipleEditorGroups({ "ClassificationPlatformID": _classPlatformID, "ComponentID": _componentID })) {

                    var _classPlatformDetail = _instance.Data.LookupPlatformComponentMultiple[_classPlatformID + "_" + _componentID];

                    var $parent = $this.closest("[data-attr-home-current-class-platform-id]");
                    var $vwSelection = $parent.children(".ComponentDetailEditorGroupSelection");

                    if ($vwSelection.length == 0) {
                        $vwSelection = $("<div class='DisableUserSelectable ComponentDetailEditorGroupSelection' />");

                        var $anchor = $parent.children(".EditorPlaceholderViewAnchor:first");

                        if ($anchor.length == 0) {
                            $parent.append($vwSelection);
                        }
                        else {
                            $vwSelection.insertBefore($anchor);
                        }
                    }

                    var _html = "";

                    if (_classPlatformDetail && _classPlatformDetail["EditorGroupList"]) {

                        var _editorGroups = _classPlatformDetail.EditorGroupList;

                        for (var i = 0; i < _editorGroups.length; i++) {
                            var _editorGroup = _editorGroups[i];

                            _html += "<a class='LinkClickable EditorGroupComponentReferenceLink' data-role='button' data-theme='transparent' data-icon='arrow-r' " +
                                     "data-iconpos='right' data-corners='false' " + 
                                     util_htmlAttribute("data-attr-home-class-platform-link-editor-group-id", _editorGroup[enColEditorGroupProperty.EditorGroupID]) + ">" +
                                     util_htmlEncode(_editorGroup[enColEditorGroupProperty.Name]) +
                                     "</a>";
                        }

                    }

                    if ($vwSelection.is(":visible") && util_forceInt($vwSelection.attr("data-attr-ref-class-platform-id"), enCE.None) == _classPlatformID) {
                        _fnEnableClick();
                        return;
                    }

                    $vwSelection.finish()
                                .hide()
                                .data("ParamOnClick", { "Trigger": $this, "Arguments": args })
                                .removeData("is-busy")
                                .attr("data-attr-ref-class-platform-id", _classPlatformID)
                                .html(_html)
                                .trigger("create");

                    $vwSelection.addClass("EffectBlur")
                                .toggle("height", function () {

                                    _fnEnableClick();

                                    $vwSelection.removeClass("EffectBlur");

                                    if (!$vwSelection.data("is-init")) {

                                        $vwSelection.data("is-init", true);

                                        $vwSelection.off("remove.cleanup_componentEditorGroupSelection");
                                        $vwSelection.on("remove.cleanup_componentEditorGroupSelection", function () {
                                            $(document).off("click.dismiss_componentEditorGroupSelection");
                                        });

                                        var $document = $(document);

                                        $document.off("click.dismiss_componentEditorGroupSelection");
                                        $document.on("click.dismiss_componentEditorGroupSelection", function (e, args) {
                                            var $target = $(e.target);

                                            args = util_extend({ "IsForceDismiss": false }, args);

                                            if (args.IsForceDismiss ||
                                                (!args.IsForceDismiss && $target.closest(".CEditorHomeView, [data-attr-home-class-platform-component-id]")
                                                                                .is(":not([data-attr-home-class-platform-component-id])"))
                                                ) {

                                                if (args.IsForceDismiss || $target.closest(".ComponentDetailEditorGroupSelection, body").is("body")) {

                                                    $document.off("click.dismiss_componentEditorGroupSelection");

                                                    $vwSelection.empty()
                                                                .hide()
                                                                .removeData("is-init");
                                                }
                                                else {

                                                    var $editorGroup = $target.closest(".LinkClickable.EditorGroupComponentReferenceLink, .ComponentDetailEditorGroupSelection");
                                                    var _editorGroupID = util_forceInt($editorGroup.attr("data-attr-home-class-platform-link-editor-group-id"), enCE.None);

                                                    if (_editorGroupID != enCE.None && !$vwSelection.data("is-busy")) {

                                                        $vwSelection.data("is-busy", true);

                                                        $(document).trigger("click.dismiss_componentEditorGroupSelection", { "IsForceDismiss": true });

                                                        var _param = $vwSelection.data("ParamOnClick");

                                                        if (_param) {
                                                            var _clickArgs = _param.Arguments;

                                                            _clickArgs["EditorGroupID"] = _editorGroupID;

                                                            _param.Trigger.trigger("click.homeview_loadComponent", _clickArgs);
                                                        }

                                                    }
                                                }
                                            }

                                        }); //end: click.dismiss_componentEditorGroupSelection

                                    }

                                });

                    return;
                }

                _instance.RenderEvents.ComponentHomeView({
                    "IsAnimate": args.IsAnimate,
                    "ClassificationPlatformID": _classPlatformID, "ComponentID": _componentID, "EditorGroupID": args.EditorGroupID,
                    "Parent": $parent, "Trigger": $this, "Instance": _instance,
                    "TransitionElement": (args.IsDisableTransition ? null : $parent.find("[data-attr-home-current-class-platform-id]")),
                    "RenderArguments": args.RenderArguments,
                    "Callback": function () {

                        _fnEnableClick();

                        $parent.trigger("events.homeview_setTitle", { "Title": null });

                        if (args.Callback) {
                            args.Callback();
                        }
                    }
                });
            }
            else {
                _fnEnableClick();
            }
        });

        $temp.off("events.homeview_onDetailItemSelection");
        $temp.on("events.homeview_onDetailItemSelection", ".DetailItem:not(.LinkSelected):not(.LinkDisabled)", function (e, args) {

            args = util_extend({
                "OnBindView": null,
                "IsTargetTrigger": false,
                "PropertyIdentifier": null, "GetDataItemFromSource": null, "PropertyClickEvent": null, "GetSelectedItemRenderData": null,
                "AttributeNameDetailsView": null, "SelectorCurrentView": null, "SelectorPostProcessParentView": null, "IsAnimate": true,
                "DefaultOptions": {
                    "TypeName": null, "PropertyStrJSON": null, "PropertyClickJS": null
                },
                "OnNavigateBack": null,
                "OnRefreshRenderers": null, //refresh the renderers for the view (such as when a navigate back request is executed)
                "Callback": null
            }, args);

            var $this = $(args.IsTargetTrigger && e && e.target ? e.target : this);
            var _fnOnBindView = args.OnBindView;
            var $parent = $this.closest(".CEditorHomeView");

            var _selectionCallback = function () {

                $parent.trigger("events.homeview_setTitle", { "Title": null });

                //check if the trigger element requires automatic navigation to a specific component
                var _onNavigateComponentID = util_forceInt($this.attr("data-attr-home-class-platform-on-navigate-component-id"), enCE.None);

                if (_onNavigateComponentID != enCE.None) {

                    var $componentDetail = $parent.find("[data-attr-home-current-class-platform-id] .DetailItem.ComponentDetail[" +
                                                        util_htmlAttribute("data-attr-home-class-platform-component-id", _onNavigateComponentID) + "]");
                    
                    if ($componentDetail.length == 1) {
                        $parent.addClass("ModeAnimationTransitionHide");

                        var $vwLoading = $("<div class='LoadingView' />");

                        $parent.prepend($vwLoading);
                        blockUI();

                        setTimeout(function () {
                            $componentDetail.trigger("click", {
                                "Callback": function () {
                                    $vwLoading.remove();
                                    $parent.removeClass("ModeAnimationTransitionHide");
                                    unblockUI();
                                }
                            });
                        }, 100);
                    }
                }

                if (args.Callback) {
                    args.Callback();
                }
            };

            if (_fnIsBusy($parent)) {
                return;
            }

            var _dataItem = $this.data("DataItem");
            var _itemID = util_forceInt($this.attr(args.PropertyIdentifier), enCE.None);

            if (!_dataItem) {
                _dataItem = args.GetDataItemFromSource.apply(_instance, [{ "Parent": $parent, "Trigger": $this, "SearchID": _itemID }]);

                $this.data("DataItem", _dataItem);
            }

            if (args.DefaultOptions && args.DefaultOptions.PropertyStrJSON) {
                var _opts = _instance.Utils.GetDefaultOptions({ "Type": args.DefaultOptions.TypeName, "StrJSON": _dataItem[args.DefaultOptions.PropertyStrJSON] });

                if (_opts && _opts.UserHomeView && util_forceString(_opts.UserHomeView[args.DefaultOptions.PropertyClickJS]) != "") {

                    try {
                        eval(_opts.UserHomeView[args.DefaultOptions.PropertyClickJS]);
                        return;
                    }
                    catch (e) {
                        util_logError(e);
                    }
                }
            }

            var $links = $parent.find("[" + args.PropertyIdentifier + "]");

            var _fnAnimateSelection = function (animationCallback) {

                var $target = null;

                if (args.SelectorCurrentView) {
                    $target = $parent.find(args.SelectorCurrentView);
                }

                if (!$target || $target.length == 0) {
                    $target = $links.not($this);
                }

                $target.addClass("EffectBlur");

                var _fnAnimationEnd = function () {
                    $target.removeClass("EffectBlur");

                    if (animationCallback) {
                        animationCallback();
                    }
                };

                if (args.IsAnimate) {
                    $target.toggle("height").promise()
                           .done(_fnAnimationEnd);
                }
                else {
                    $target.hide();
                    _fnAnimationEnd();
                }

            };    //end: _fnAnimateSelection

            var _fnEventClick = options.Events[args.PropertyClickEvent];

            if (_fnEventClick) {

                var _handled = _fnEventClick({
                    "ItemID": _itemID, "Item": _dataItem, "Event": e, "Element": $this, "Parent": $parent,
                    "FnAnimateSelection": _fnAnimateSelection
                });

                if (_handled) {

                    _selectionCallback();
                    return;
                }
            }

            $parent.data("is-busy", true);
            $this.addClass("LinkSelected");

            _fnAnimateSelection(function () {

                args.GetSelectedItemRenderData({ "Target": $this, "Container": $parent, "ItemID": _itemID, "Item": _dataItem },
                                               function (result) {

                                                   var $details = $parent.find("[" + args.AttributeNameDetailsView + "]");

                                                   if ($details.length == 0) {
                                                       $details = $("<div />");
                                                       $details.hide();

                                                       $parent.append($details);

                                                       $details.off("events.onNavigateBack");
                                                       $details.on("events.onNavigateBack", function () {

                                                           if (args.OnNavigateBack) {
                                                               args.OnNavigateBack({ "Element": $details });
                                                           }
                                                       });

                                                       var _fnOnRefreshRenderers = args.OnRefreshRenderers;

                                                       $details.off("events.onRefreshViewRenderers");
                                                       $details.on("events.onRefreshViewRenderers", function (e, args) {

                                                           if (_fnOnRefreshRenderers) {

                                                               args = (args || {});

                                                               args["Element"] = $details;

                                                               _fnOnRefreshRenderers.call(this, args);
                                                           }

                                                       });  //end: events.onRefreshViewRenderers
                                                   }

                                                   $details.hide();

                                                   var _html = "";
                                                   var _detailsList = (result ? result.List : null);

                                                   _detailsList = (_detailsList || []);

                                                   $details.attr(args.AttributeNameDetailsView, _itemID);

                                                   var _tokens = null;

                                                   _tokens = {};
                                                   _tokens["%%ATTR_NAV_BTN%%"] = util_htmlAttribute("data-attr-home-nav-button-id", "back");

                                                   _html += util_replaceTokens(options.HtmlTemplates.NavigateBackButtonInline, _tokens);

                                                   if (_detailsList.length == 0) {
                                                       _html += util_forceString(options.HtmlTemplates.EmptyListItems);
                                                       $details.removeData("list");
                                                       $details.removeData("result");
                                                   }
                                                   else {

                                                       for (var i = 0; i < _detailsList.length; i++) {
                                                           var _detailDataItem = _detailsList[i];

                                                           _tokens = {};

                                                           _tokens["%%CSS_CLASS%%"] = "DisableUserSelectable DetailItem LinkClickable";
                                                           _tokens["%%ATTR%%"] = "";
                                                           _tokens["%%TITLE%%"] = "";

                                                           var _renderOpts = {
                                                               "Tokens": _tokens, "DataSelectionResult": result, "Item": _detailDataItem
                                                           };

                                                           args.PopulateDetailRenderTokens(_renderOpts);

                                                           _html += util_replaceTokens(options.HtmlTemplates.ClassificationPlatformDetail, _renderOpts.Tokens);
                                                       }

                                                       var _stateKey = "PlatformComponentStateEditorNotification_" + MODULE_MANAGER.Current.GetKey() + "_ID_" + _itemID;

                                                       _html += "<div class='EditorPlaceholderViewAnchor' style='display: none;' />";
                                                       _html += "<div " + util_renderAttribute("pluginEditor_notifications") + " " +
                                                                util_htmlAttribute("data-notification-view-state-key", _stateKey) + " />";

                                                       $details.data("list", _detailsList);
                                                       $details.data("result", result);
                                                   }

                                                   $details.html(_html);

                                                   //configure the notification view
                                                   var $notification = $details.find("[" + util_renderAttribute("pluginEditor_notifications") + "]");

                                                   _instance.ProjectOnInitializeNotificationControls({
                                                       "List": $notification, "ClassificationPlatformItemID": _itemID, "ClassificationPlatformItem": _dataItem
                                                   });

                                                   //check if there is a project specific definition for the init function (will invoke following global code)
                                                   var _fnProjectOnNotificationInit = $notification.data("NotificationOnInit");

                                                   $notification.data("NotificationOnInit", function (opts) {

                                                       //set the state parameters for initialization
                                                       var _controlInstance = opts.Controller;

                                                       _controlInstance.Data.ClassificationPlatformID = util_forceInt(
                                                           $mobileUtil.GetClosestAttributeValue($details, "data-attr-home-current-class-platform-id"),
                                                            enCE.None
                                                       );

                                                       if (_fnProjectOnNotificationInit) {
                                                           _fnProjectOnNotificationInit.call(this, opts);
                                                       }
                                                       else if (opts.Callback) {
                                                           opts.Callback();
                                                       }
                                                   });

                                                   $mobileUtil.refresh($details);

                                                   $element.trigger("events.resize_homeview", { "IsInit": true });

                                                   var _fnAnimationEndDetail = function () {

                                                       if (args.SelectorPostProcessParentView) {
                                                           $parent.find(args.SelectorPostProcessParentView)
                                                                  .hide();

                                                           //restore all links to be visible, since the parent container is hidden
                                                           $links.show();
                                                       }

                                                       var $children = $details.find(".DetailItem");

                                                       var _fnClearBusyFlag = function () {

                                                           $this.removeClass("LinkSelected");
                                                           $parent.removeData("is-busy");

                                                           _selectionCallback();
                                                       };

                                                       var _fnEffect = function (lst, index) {
                                                           if (index < lst.length) {
                                                               var $current = $(lst.get(index));

                                                               $current.toggle("height", function () {
                                                                   $current.removeClass("EffectBlur");
                                                                   _fnEffect(lst, index + 1);
                                                               });
                                                           }
                                                           else {
                                                               _fnClearBusyFlag();
                                                           }

                                                       }; //end: _fnEffect

                                                       $children.addClass("EffectBlur")
                                                                .hide();

                                                       if (args.IsAnimate) {
                                                           $details.toggle("height", function () {
                                                               _fnEffect($children, 0);
                                                           });
                                                       }
                                                       else {
                                                           $children.removeClass("EffectBlur")
                                                                    .show();
                                                           $details.show();
                                                           _fnClearBusyFlag();
                                                       }
                                                   };

                                                   if (_fnOnBindView) {
                                                       _fnOnBindView.call($element);
                                                   }

                                                   if (options.IsConsolidatedLandingView) {
                                                       _fnAnimationEndDetail();
                                                   }
                                                   else if (args.IsAnimate) {
                                                       $this.toggle("height", _fnAnimationEndDetail);
                                                   }
                                                   else {
                                                       $this.hide();
                                                       _fnAnimationEndDetail();
                                                   }

                                               });  //end: get data

            });   //end: animation

        });   //end: events.homeview_onDetailItemSelection

        $temp.off("events.homeview_navigateBack");
        $temp.on("events.homeview_navigateBack", function (e, args) {
            var _handled = false;

            args = util_extend({ "Trigger": null, "ForcePreviousView": false }, args);

            var $trigger = $(args.Trigger);
            var $parent = $trigger.closest(".CEditorHomeView");
            var $container = null;
            var $target = null;

            if (_fnIsBusy($parent)) {
                return;
            }

            var _arr = [{ "c": "[data-home-editor-group-component-id]", "IsController": true, "ParentContextSelectors": [".Content:visible", ".InlinePopup:visible"] }];
            
            if (options.IsConsolidatedLandingView) {
                _arr.push({ "c": "[data-attr-home-current-class-platform-id]", "t": "[data-attr-home-listing='main']" });
            }
            else {
                _arr.push({ "c": "[data-attr-home-current-classification-id]", "t": "[data-attr-home-listing='main']" });
                _arr.push({ "c": "[data-attr-home-current-class-platform-id]", "t": "[data-attr-home-current-classification-id]" });
            }

            _arr.push({ "c": "[data-attr-home-editor-group-id]", "t": "[data-attr-home-current-class-platform-id]" });

            var _breadcrumbComponent = $parent.data("DataHomeNavComponentBreadcrumb");

            if (_breadcrumbComponent) {
                $parent.removeData("DataHomeNavComponentBreadcrumb");
            }

            if (_breadcrumbComponent && args.ForcePreviousView) {
                _breadcrumbComponent = null;
            }

            if (_breadcrumbComponent) {
                _breadcrumbComponent["IsBreadcrumb"] = false;   //do not add current view to breadcrumb
                $trigger.trigger("events.homeview_loadComponentView", _breadcrumbComponent);
            }
            else {
                for (var i = 0; i < _arr.length && !_handled; i++) {
                    var _selector = _arr[i];

                    var $search = $trigger.closest(_selector.c);

                    if ($search.is(":visible")) {

                        if (!args.ForcePreviousView && _selector["IsController"]) {
                            var _selectorController = "";

                            if (_selector["ParentContextSelectors"] && $.isArray(_selector.ParentContextSelectors)) {
                                for (var p = 0; p < _selector.ParentContextSelectors.length; p++) {

                                    _selectorController += (p > 0 ? ", " : "") +
                                                           _selector.ParentContextSelectors[p] + " [" + util_renderAttribute("pluginEditor_viewController") + "]";
                                }
                            }
                            else {
                                _selectorController = "[" + util_renderAttribute("pluginEditor_viewController") + "]";
                            }

                            var $controllers = $search.find(_selectorController);

                            _handled = false;

                            //loop through the available controllers (depending on which view has the active context) and allow the controller to process the back request
                            for (var i = 0; i < $controllers.length; i++) {
                                var $controller = $($controllers.get(i));
                                var _fnOnNavigateBackRequest = $controller.data("OnNavigateBackRequest");

                                if (_fnOnNavigateBackRequest) {
                                    var _request = { "IsHandled": false, "Iteration": i, "FilteredControllers": $controllers };

                                    _fnOnNavigateBackRequest(_request);

                                    if (_request && _request.IsHandled) {
                                        _handled = true;
                                        break;
                                    }
                                }
                            }

                            if (_handled) {

                                //set false to clear temp flag and then exit loop
                                _handled = false;
                                break;
                            }
                        }
                        else if (!_selector["IsController"]) {

                            _handled = true;

                            $container = $search;
                            $target = $parent.find(_selector.t);
                        }
                    }
                }
            }

            if (_handled) {

                $container.addClass("EffectBlur");

                //dismiss inline popup view, if applicable
                if ($element.find(".InlinePopup").is(":visible")) {
                    $container.trigger("events.popup", { "IsEnabled": false });
                }

                $container.toggle("height", function () {
                    $container.removeClass("EffectBlur");

                    if ($target) {

                        $target.trigger("events.onNavigateBack")
                               .toggle("height", function () {
                                   $parent.trigger("events.homeview_setTitle", { "Title": null });
                                   $target.trigger("events.onRefreshViewRenderers");
                               });
                    }
                });
            }
        });

        $temp.off("events.homeview_setTitle");
        $temp.on("events.homeview_setTitle", function (e, args) {

            args = util_extend({ "Title": null }, args);

            if (!args.Title) {

                //determine the title based on the active view
                var _handled = false;
                var $view = null;

                if (!_handled) {
                    $view = $temp.find("[data-attr-home-current-class-platform-id]");

                    if ($view.length) {

                        var _selectedClassPlatformID = util_forceInt($view.attr("data-attr-home-current-class-platform-id"), enCE.None);

                        if (options.IsConsolidatedLandingView) {
                            var $vwMain = $temp.find("[data-attr-home-listing='main']");

                            if (!$vwMain.is(":visible")) {
                                var _classPlatform = util_arrFilter($vwMain.data("list-classification-platforms"), enColClassificationPlatformProperty.ID,
                                                                    _selectedClassPlatformID, true);

                                _classPlatform = (_classPlatform.length == 1 ? _classPlatform[0] : null);

                                if (_classPlatform) {
                                    args["ClassificationPlatform"] = _classPlatform;
                                    args["ClassificationPlatformID"] = _selectedClassPlatformID;
                                    args["PlatformID"] = _classPlatform[enColClassificationPlatformProperty.PlatformID];
                                }
                            }
                        }
                        else if ($view.is(":visible")) {
                            var $vwPrev = $temp.find("[data-attr-home-current-classification-id]");

                            var _classPlatformItem = util_arrFilter($vwPrev.data("list"), enColClassificationPlatformProperty.ID, _selectedClassPlatformID);

                            _classPlatformItem = (_classPlatformItem.length ? _classPlatformItem[0] : null);

                            if (_classPlatformItem) {
                                var _dataResult = $vwPrev.data("result");
                                var _platform = util_arrFilter(_dataResult ? _dataResult["PlatformList"] : null, enColPlatformProperty.PlatformID,
                                                               _classPlatformItem[enColClassificationPlatformProperty.PlatformID], true);

                                _platform = (_platform.length ? _platform[0] : null);

                                if (_platform) {
                                    args.Title = _instance.Utils.ForceEntityDisplayName({ "Type": "Platform", "Item": _platform });
                                }
                            }
                        }

                        _handled = true;

                    }
                }
            }

            var $headerController = $mobileUtil.Header().find("[" + util_htmlAttribute(DATA_ATTR_IS_VIEW_CONTROLLER, enCETriState.Yes) + "]");

            $headerController.trigger("events.controller_reload", args);
        });

        $temp.off("click.homeview_actionButton");
        $temp.on("click.homeview_actionButton", "[data-attr-home-nav-button-id]", function (e, args) {
            var $btn = $(this);
            var _btnID = util_forceString($btn.attr("data-attr-home-nav-button-id"));

            switch (_btnID) {

                case "back":
                    $temp.trigger("events.homeview_navigateBack", { "Trigger": $btn });
                    break;
            }
        });

        $element.trigger("events.resize_homeview", { "IsInit": true });

        if (options.RestoreDefaultView && options.RestoreDefaultView.Name) {
            var _validRestore = false;

            var _params = util_extend({}, options.RestoreDefaultView.Parameters);
            var _restoreClassificationID = util_forceInt(_params["ClassificationID"], enCE.None);
            var _restoreClassPlatformID = util_forceInt(_params["ClassificationPlatformID"], enCE.None);
            var _restoreComponentID = util_forceInt(_params["ComponentID"], enCE.None);
            var _restoreSectionContentID = util_forceInt(_params["SectionContentID"], enCE.None);

            var _restoreDossierSettings = {
                "ValueMessageID": util_forceInt(_params["ValueMessageID"], enCE.None),
                "StatementID": util_forceInt(_params["StatementID"], enCE.None)
            };

            var _fnValidateID = function (arr) {
                var _validIDs = true;

                for (var v = 0; v < arr.length && _validIDs; v++) {
                    var _id = arr[v];

                    _validIDs = (_id != enCE.None);
                }

                return _validIDs;

            };    //end: _fnValidateID

            switch (options.RestoreDefaultView.Name) {

                case "class_platform":
                    _validRestore = _fnValidateID([_restoreClassificationID]);
                    _restoreClassPlatformID = enCE.None;
                    _restoreComponentID = enCE.None;
                    _restoreSectionContentID = enCE.None;
                    break;

                case "platform_component":
                    _validRestore = _fnValidateID([_restoreClassificationID, _restoreClassPlatformID]);
                    _restoreComponentID = enCE.None;
                    _restoreSectionContentID = enCE.None;
                    break;

                case "component":
                    _validRestore = _fnValidateID([_restoreClassificationID, _restoreClassPlatformID, _restoreComponentID]);
                    break;

                case "dossier_statement":
                    _validRestore = _fnValidateID([_restoreClassificationID, _restoreClassPlatformID, _restoreComponentID, _restoreDossierSettings.ValueMessageID,
                                                   _restoreDossierSettings.StatementID]);
                    break;

                default:
                    _validRestore = false;
                    break;
            }

            if (!_validRestore) {
                _callback();
            }
            else {
                var _arr = [];

                if (options.IsConsolidatedLandingView) {
                    if (_restoreClassificationID != enCE.None && _restoreClassPlatformID != enCE.None) {
                        _arr.push({
                            "t": "[data-attr-home-listing='main'] .DetailItem[" +
                                 util_htmlAttribute("data-attr-home-classification-id", _restoreClassificationID) + "] " +
                                 "[" + util_htmlAttribute("data-attr-home-class-platform-item-id", _restoreClassPlatformID) + "]"
                        });
                    }
                }
                else {

                    if (_restoreClassificationID != enCE.None) {
                        _arr.push({
                            "t": "[data-attr-home-listing='main'] .DetailItem[" + util_htmlAttribute("data-attr-home-classification-id", _restoreClassificationID) + "]"
                        });
                    }

                    if (_restoreClassPlatformID != enCE.None) {
                        _arr.push({
                            "t": "[data-attr-home-current-classification-id] .DetailItem" +
                                 "[" + util_htmlAttribute("data-attr-home-class-platform-item-id", _restoreClassPlatformID) + "]"
                        });
                    }
                }
                
                if (_restoreComponentID != enCE.None) {
                    _arr.push({
                        "t": "[data-attr-home-current-class-platform-id] .DetailItem" +
                             "[" + util_htmlAttribute("data-attr-home-class-platform-component-id", _restoreComponentID) + "]"
                    });
                }

                if (_restoreSectionContentID != enCE.None) {
                    _arr.push({
                        "t": ".CEditorComponentHome .NavigationHeader .SectionTab" +
                             "[" + util_htmlAttribute("data-attr-home-editor-group-content-id", _restoreSectionContentID) + "]"

                    });

                    //if it is component view, check if there are component specific restore attributes on controller level
                    var _restoreEditorCriteriaID = util_forceInt(_params["ComponentEditorCriteriaID"], enCE.None);

                    if (_restoreEditorCriteriaID != enCE.None) {
                        _arr.push({
                            "t": ".CEditorComponentHome .Content [" + util_renderAttribute("pluginEditor_viewController") + "]",
                            "overrideEvent": "events.controller_setRestoreState", "params": {
                                "RestoreEditorCriteriaID": _restoreEditorCriteriaID,
                                "RestoreValueMessageID": _restoreDossierSettings.ValueMessageID,
                                "RestoreStatementID": _restoreDossierSettings.StatementID
                            }
                        });
                    }
                }

                var _fn = function () {
                    if (_arr.length) {
                        var _item = _arr.shift();
                        var $search = $temp.find(_item.t);

                        if ($search.length == 0) {
                            _fn();
                        }
                        else {

                            var _eventName = "click";
                            var _eventArgs = { "IsAnimate": false, "Callback": _fn };

                            if (_item["overrideEvent"]) {
                                _eventName = _item.overrideEvent;
                            }

                            if (_item["params"]) {
                                _eventArgs = util_extend(_eventArgs, _item.params, true, true);
                            }

                            $search.trigger(_eventName, _eventArgs);
                        }
                    }
                    else {
                        $temp.removeClass("EffectBlur");
                        _callback();
                    }
                };

                $temp.addClass("EffectBlur");

                _fn();
            }
        }
        else {
            _callback();
        }
    });

};

CPluginEditor.prototype.RenderEvents.ComponentHomeView = function (options) {
    options = util_extend({
        "Instance": null, "From": "UserHomeView", "ClassificationPlatformID": enCE.None, "ComponentID": enCE.None, "EditorGroupID": enCE.None,
        "Parent": null, "Trigger": null, "TransitionElement": null, "IsAnimate": true, "RenderArguments": null, "Callback": null,
        "HtmlTemplates": {
            "Layout": "<div class='%%CSS_CLASS%%'>" +
                      " <div class='NavigationHeader'>&nbsp;</div>" +
                      " <div class='Toolbar'>&nbsp;</div>" +
                      " <div class='FiltersControl' />" +
                      " <div class='Content'>&nbsp;</div>" +
                      " <div class='InlinePopup'>&nbsp;</div>" +
                      "</div>",
            "SectionTab": "<div class='%%CSS_CLASS%%' %%ATTR%%>%%TITLE%%</div>",
            "ActionButtonTemplate": "<a %%ATTR%% class='LinkClickable' data-role='button' data-icon='%%ICON%%' data-mini='true' data-inline='true' " +
                                    "data-corners='false' data-theme='transparent'>%%CONTENT%%</a>",
            "ActionButtonEdit": null,
            "ActionButtonCancel": null,
            "ActionButtonSave": null,
            "ActionButtonSaveContinue": null,
            "ActionButtonNavigateBack": null,
            "ActionButtonNavigateDone": null
        },
        "RestoreDefaultView": {
            "SectionContentID": enCE.None
        }
    }, options);

    var _callback = function () {
        if (options.Callback) {
            options.Callback();
        }
    };

    if (options.ClassificationPlatformID == enCE.None || options.ComponentID == enCE.None) {
        _callback();
        return;
    }

    if (!options.HtmlTemplates.ActionButtonNavigateBack) {
        var _tokens = {};

        _tokens["%%ICON%%"] = "arrow-l";
        _tokens["%%CONTENT%%"] = util_htmlEncode("Return");
        _tokens["%%ATTR%%"] = "%%ATTR_NAV_BTN%%";

        options.HtmlTemplates.ActionButtonNavigateBack = util_replaceTokens(options.HtmlTemplates.ActionButtonTemplate, _tokens);
    }

    var _instance = options.Instance;
    var _labelDefault = util_forceString(_instance ? util_propertyValue(_instance, "Configuration.LabelDefaultSelection") : null);

    var $parent = $(options.Parent);

    var _fnLoadData = function (dataCallback) {
        var _data = { "EditorGroup": null, "ClassificationPlatform": null };

        _instance.GetData({
            "Type": "EditorGroupByPrimaryKey", "Filters": {
                "SearchClassificationPlatformID": options.ClassificationPlatformID, "SearchComponentID": options.ComponentID,
                "EditorGroupID": options.EditorGroupID, //override support for direct editor group (instead of search by class platform ID and component ID)
                "IsInitNotFound": (options.EditorGroupID == enCE.None),
                "DeepLoad": true
            }, "From": options.From
        }, function (editorGroupResult) {

            _data.EditorGroup = (editorGroupResult && editorGroupResult.Success ? editorGroupResult.Data : null);

            _instance.GetData({ "Type": "ClassificationPlatformByPrimaryKey", "Filters": { "ID": options.ClassificationPlatformID } }, function (classPlatformResult) {

                _data.ClassificationPlatform = (classPlatformResult && classPlatformResult.Success ? classPlatformResult.Data : null);

                if (dataCallback) {
                    dataCallback(_data);
                }

            });
            
        });
        
    };

    var _fn = function () {

        _fnLoadData(function (result) {

            var _editorGroup = result.EditorGroup;
            var _classificationPlatform = (result.ClassificationPlatform || {});
            var _renderedComponentID = options.ComponentID;

            _editorGroup = (_editorGroup || {});

            var _id = util_forceInt(_editorGroup[enColEditorGroupProperty.EditorGroupID], enCE.None);

            if (_id == enCE.None) {
                AddError("The specified component is not available or invalid.");
            }
            else {
                var $element = $parent.find("[data-attr-home-editor-group-id]");

                if ($element.length == 0) {
                    var _layoutHTML = options.HtmlTemplates.Layout;
                    var _tokens = {};

                    _tokens["%%CSS_CLASS%%"] = "CEditorComponentHome";

                    _layoutHTML = util_replaceTokens(_layoutHTML, _tokens);

                    $element = $(_layoutHTML);
                    $parent.append($element);
                }
                else {
                    $element.show();
                }

                var $header = $element.find(".NavigationHeader");
                var $content = $element.find(".Content:first");

                var $toolbar = $element.find(".Toolbar");
                var $filters = $element.find(".FiltersControl");
                var $inlinePopup = $element.find(".InlinePopup");

                $element.attr({
                    "data-attr-home-editor-group-id": _id,
                    "data-home-editor-group-classification-id": _classificationPlatform[enColClassificationPlatformProperty.ClassificationID],
                    "data-home-editor-group-platform-id": _classificationPlatform[enColClassificationPlatformProperty.PlatformID],
                    "data-home-editor-group-component-id": _editorGroup[enColEditorGroupProperty.ComponentID]
                });

                var _html = "";

                var _sections = _editorGroup[enColCEEditorGroupProperty.ContentSections];
                var _groupContents = _editorGroup[enColCEEditorGroupProperty.GroupContents];
                var _disableComponentView = false;

                _sections = (_sections || []);
                _groupContents = (_groupContents || []);

                var _lookupSectionContent = {};

                for (var s = 0; s < _sections.length; s++) {
                    var _content = _sections[s];
                    var _contentID = _content[enColContentProperty.ContentID];

                    _lookupSectionContent[_contentID] = _content;
                }

                for (var c = 0; c < _groupContents.length; c++) {
                    var _groupContent = _groupContents[c];
                    var _searchContentID = _groupContent[enColEditorGroupContentProperty.ContentID];
                    var _content = _lookupSectionContent[_searchContentID];

                    if (_content) {
                        var _tokens = {};

                        _tokens["%%CSS_CLASS%%"] = "DisableUserSelectable LinkClickable SectionTab";
                        _tokens["%%ATTR%%"] = util_htmlAttribute("data-attr-home-editor-group-content-id", _content[enColContentProperty.ContentID]) + " " +
                                              util_htmlAttribute("data-attr-home-editor-group-content-state-id",
                                                                 _groupContent[enColEditorGroupContentProperty.ContentStateID]);
                        _tokens["%%TITLE%%"] = util_htmlEncode(_instance.Utils.ForceEntityDisplayName({ "Type": "Content", "Item": _content }));

                        _html += util_replaceTokens(options.HtmlTemplates.SectionTab, _tokens);
                    }
                }

                //if no sections/tabs are available, then disable the component view
                if (_groupContents.length == 0) {
                    _disableComponentView = true;
                }

                $element.data("DataItem", _editorGroup);

                $element.find(".NavigationHeader")
                        .html(_html);

                var _fnUserComponentPermission = function (opts) {

                    opts = util_extend({ "PlatformID": enCE.None, "OverrideComponentID": enCE.None }, opts);

                    var _permissionSummaryLookup = ($parent.data("data-permission-summary") || {});
                    var _classificationID = util_forceInt(opts["OverrideClassificationID"], enCE.None);

                    if (_classificationID == enCE.None) {
                        _classificationID = _classificationPlatform[enColClassificationPlatformProperty.ClassificationID];
                    }

                    var _platformID = opts.PlatformID;
                    var _searchComponentID = util_forceInt(opts.OverrideComponentID, enCE.None);

                    if (_searchComponentID == enCE.None) {
                        _searchComponentID = _renderedComponentID;
                    }

                    if (_platformID == enCE.None) {
                        _platformID = _classificationPlatform[enColClassificationPlatformProperty.PlatformID];
                    }

                    var _compPermission = util_arrFilterSubset(_permissionSummaryLookup[_classificationID], function (searchPermSummary) {
                        return (searchPermSummary[enColCPlatformComponentUserRoleProperty.PlatformID] == _platformID &&
                                searchPermSummary[enColCPlatformComponentUserRoleProperty.ComponentID] == _searchComponentID);
                    }, true);

                    if (_compPermission.length == 1) {
                        _compPermission = _compPermission[0];
                    }
                    else {
                        _compPermission = null;
                    }

                    return _compPermission;

                };  //end: _fnUserComponentPermission

                //permissions for current user related to admin access
                var _fnUserCanAdmin = function (opts) {
                    var _canAdmin = false;
                    var _compPermission = (opts && opts["Permission"] ? opts.Permission : _fnUserComponentPermission());

                    _canAdmin = (_compPermission && (_compPermission[enColCPlatformComponentUserRoleProperty.UserRoleID] == enCERoleBase.Administrator ||
                                                     _compPermission[enColCPlatformComponentUserRoleProperty.UserRoleID] == enCERoleBase.SystemAdmin));

                    return _canAdmin;
                };

                var _fnInitToolbarButtons = function (forceRefresh, currentPermission, isDisableState, opts) {

                    var _toolbarHTML = "";
                    var _tokens = null;
                    var _from = (opts ? opts["From"] : null);

                    _tokens = {};
                    _tokens["%%ATTR_NAV_BTN%%"] = util_htmlAttribute("data-attr-home-nav-button-id", "back");

                    _toolbarHTML += util_replaceTokens(options.HtmlTemplates.ActionButtonNavigateBack, _tokens);

                    var $vwController = $content.children("[" + util_renderAttribute("pluginEditor_viewController") + "]:first");
                    var _toolbarRenderOptions = {
                        "IsDisableEditActions": false,
                        "GetToolbarButtons": null
                    };

                    if (!isDisableState && $vwController.length == 1) {
                        _toolbarRenderOptions = util_extend(_toolbarRenderOptions, $vwController.data("ToolbarRenderOptions"));
                    }

                    if (!_toolbarRenderOptions.IsDisableEditActions && _fnUserCanAdmin({ "Permission": currentPermission })) {

                        var _itemHTML = options.HtmlTemplates.ActionButtonEdit;

                        _tokens = {};
                        _tokens["%%ATTR%%"] = util_htmlAttribute("data-attr-home-editor-group-toolbar-btn", "edit");

                        if (!_itemHTML) {
                            _itemHTML = options.HtmlTemplates.ActionButtonTemplate;

                            _tokens["%%ICON%%"] = "edit";
                            _tokens["%%CONTENT%%"] = util_htmlEncode("Edit");
                        }

                        _toolbarHTML += util_replaceTokens(_itemHTML, _tokens);
                    }

                    if (_from == "filter_platform" && _toolbarRenderOptions["GetToolbarButtons"]) {
                        _toolbarHTML = util_forceString(_toolbarRenderOptions.GetToolbarButtons({ "From": _from })) + _toolbarHTML;
                    }

                    $toolbar.removeData("init-admin-edit-buttons");
                    $toolbar.html(_toolbarHTML);

                    if (forceRefresh) {
                        $mobileUtil.refresh($toolbar);
                    }

                };  //end: _fnInitToolbarButtons

                if (!_disableComponentView) {
                    _fnInitToolbarButtons(null, null, true);
                }

                $filters.empty();

                $mobileUtil.refresh($element);

                var _fnGetLayoutManager = function () {
                    var _manager = {
                        "ToolbarSetButtons": function (opts) {

                            opts = util_extend({
                                "List": null, "IsInsertStart": false, "IsClear": true, "IsHideNavigateBackButton": null, "IsHideDoneButton": false, "IsHideEditButtons": null,
                                "IsClearAllButtons": false,
                                "ExcludeButtons": []    //used to exclude buttons via ID
                            }, opts);

                            var $list = $(opts.List);

                            if (opts.IsClear || opts.IsClearAllButtons) {
                                var _isAnimate = false;
                                var $removeBtns = null;

                                if (opts.IsClearAllButtons) {
                                    $removeBtns = $toolbar.find("[data-attr-editor-controller-action-btn]");
                                }
                                else {
                                    var $prevList = $($toolbar.data("snapshot-visible"));

                                    $removeBtns = $toolbar.find(".LinkCustomButton")
                                                          .not($prevList);
                                }

                                if (opts.ExcludeButtons && opts.ExcludeButtons.length > 0) {
                                    var _excludeSelector = "";

                                    for (var s = 0; s < opts.ExcludeButtons.length; s++) {
                                        _excludeSelector += (s > 0 ? "," : "");
                                        _excludeSelector += "[" + util_htmlAttribute("data-attr-editor-controller-action-btn", opts.ExcludeButtons[s]) + "]";
                                    }

                                    $removeBtns = $removeBtns.not(_excludeSelector);
                                    _isAnimate = true;
                                }

                                if (_isAnimate) {
                                    $removeBtns.removeAttr("data-attr-editor-controller-action-btn");
                                    $removeBtns.fadeOut("normal");
                                }
                                else {
                                    $removeBtns.remove();
                                }
                            }

                            if (opts.IsHideDoneButton) {
                                $toolbar.find("[data-attr-home-editor-group-toolbar-btn='done']")
                                        .hide();
                            }

                            if (opts.IsHideEditButtons != null) {
                                $toolbar.find("[data-attr-home-editor-group-toolbar-btn='edit']")
                                        .toggle(!opts.IsHideEditButtons);
                            }

                            if (opts.IsHideNavigateBackButton != null) {
                                $toolbar.find("[" + util_htmlAttribute("data-attr-home-nav-button-id", "back") + "]")
                                        .toggle(!opts.IsHideNavigateBackButton);
                            }

                            $list.addClass("LinkCustomButton");

                            if (opts.IsInsertStart) {
                                $toolbar.prepend($list);
                            }
                            else {
                                $toolbar.append($list);
                            }

                            $toolbar.trigger("create");
                        },
                        "ToolBarSnapshot": function (opts) {
                            $toolbar.trigger("events.snapshot", opts);
                        },
                        "ToolbarTriggerButton": function (opts) {
                            opts = util_extend({ "ButtonID": null, "IsControllerButton": false, "FilterSelector": null, "InvokeExtArgs": null, "Callback": null }, opts);

                            if (opts.ButtonID) {
                                var $search = $toolbar.find(".LinkClickable[" +
                                                           util_htmlAttribute(opts.IsControllerButton ? "data-attr-editor-controller-action-btn" :
                                                                                                        "data-attr-home-editor-group-toolbar-btn", opts.ButtonID) + "]");
                                
                                if (util_forceString(opts.FilterSelector) != ""){
                                    $search = $search.filter(opts.FilterSelector);
                                }

                                $search.trigger("click", { "Callback": opts.Callback, "InvokeExtArgs": opts.InvokeExtArgs });
                            }
                        },
                        "FilterSetView": function (opts) {
                            $filters.trigger("events.filter_setView", opts);
                        },
                        "FilterToggleState": function (opts) {
                            $filters.trigger("events.filter_toggleState", opts);
                        },
                        "FilterSelections": function (opts) {

                            var _selections = {
                                "Lookup": {},
                                "GetFilterValue": function (key, index) {
                                    var _val = undefined;

                                    index = util_forceInt(index, 0);

                                    if (this.Lookup && this.Lookup[key]) {
                                        var _arr = this.Lookup[key];

                                        if (index >= 0 && index < _arr.length) {
                                            _val = _arr[index];
                                        }
                                    }

                                    return _val;
                                },
                                "GetFilterID": function (key, index) {
                                    return util_forceInt(this.GetFilterValue(key, index), enCE.None);
                                }
                            };

                            var $vwFilters = $filters.find(".EditorFilterView[data-attr-filter-type]");

                            $.each($vwFilters, function () {
                                var $this = $(this);
                                var _filterType = util_forceString($this.attr("data-attr-filter-type"));

                                if (_filterType == "") {
                                    _filterType = $this.attr("data-attr-filter-view-id");
                                }

                                if (util_forceString(_filterType) != "") {
                                    var $input = $this.find(".FilterElement select");
                                    var _arr = _selections.Lookup[_filterType];

                                    if (!_arr) {
                                        _arr = [];
                                        _selections.Lookup[_filterType] = _arr;
                                    }

                                    _arr.push($input.val());
                                }

                            });

                            return _selections;
                        },
                        "FilterRefresh": function (opts) {

                            opts = util_extend({ "TypeID": null, "Callback": null }, opts);

                            var $filter = null;

                            var _filterRefreshCallback = function () {
                                if (opts.Callback) {
                                    opts.Callback({ "Element": $filter });
                                }
                            };

                            $filter = $filters.find(".EditorFilterView[" + util_htmlAttribute("data-attr-filter-type", opts.TypeID) + "]:first");

                            if ($filter.length == 0) {
                                _filterRefreshCallback();
                            }
                            else {
                                $filter.trigger("events.filter_refreshView", { "Callback": _filterRefreshCallback });
                            }
                        },
                        "ToggleOverlay": function (opts) {
                            $element.trigger("events.toggleOverlay", opts);
                        },
                        "HeaderTabState": function (opts) {
                            $header.trigger("events.homeview_setTabEnabled", opts);
                        },
                        "PopupShow": function (opts) {
                            _instance.Utils.Popup(opts);
                        }
                    };

                    return _manager;

                };  //end: _fnGetLayoutManager                

                $header.off("events.homeview_onTabSelected");
                $header.on("events.homeview_onTabSelected", function (e, args) {

                    args = util_extend({ "Trigger": null, "SelectedID": enCE.None, "Callback": null }, args);

                    var $tabs = $header.find(".SectionTab[data-attr-home-editor-group-content-id]");
                    var $selected = $tabs.filter("[" + util_htmlAttribute("data-attr-home-editor-group-content-id", args.SelectedID) + "]");

                    $tabs.not($selected).removeClass("LinkSelected");
                    $selected.addClass("LinkSelected");

                    //reset the header toolbar by removing all custom buttons
                    _fnGetLayoutManager().ToolbarSetButtons({ "IsClear": true });

                    if (args.Callback) {
                        args.Callback({ "Current": $selected });
                    }
                });

                $header.off("events.homeview_setTabEnabled");
                $header.on("events.homeview_setTabEnabled", function (e, args) {

                    args = util_extend({ "IsEnabled": true }, args);

                    var $tabs = $header.find(".SectionTab[data-attr-home-editor-group-content-id]:not(.LinkSelected)");

                    $tabs.toggleClass("LinkDisabled", !args.IsEnabled);
                });

                $toolbar.off("click.homeview_onToolbarButtonSelected");
                $toolbar.on("click.homeview_onToolbarButtonSelected", ":not(.ButtonDisabled)[data-attr-home-editor-group-toolbar-btn]", function (e, args) {

                    args = util_extend({ "Callback": null }, args);

                    var _toolbarClickCallback = function () {
                        if (args.Callback) {
                            args.Callback();
                        }
                    };

                    var $btn = $(this);
                    var _btnID = $btn.attr("data-attr-home-editor-group-toolbar-btn");
                    var _fnToggleEditState = function (isEditMode, disableModifyButtons) {

                        if (isEditMode && !$toolbar.data("init-admin-edit-buttons")) {

                            $toolbar.data("init-admin-edit-buttons", true);

                            var _arr = [
                                        {
                                            "html": options.HtmlTemplates.ActionButtonSaveContinue, "id": "save", "icon": "check", "v": "Save & Continue",
                                            "attr": util_htmlAttribute("data-attr-home-editor-is-continue", enCETriState.Yes)
                                        },
                                        { "html": options.HtmlTemplates.ActionButtonSave, "id": "save", "icon": "check", "v": "Save" },
                                        { "html": options.HtmlTemplates.ActionButtonCancel, "id": "cancel", "icon": "back", "v": "Cancel" },
                                        { "html": options.HtmlTemplates.ActionButtonDone, "id": "done", "icon": "check", "v": "Done" }
                            ];

                            var _btnHTML = "";

                            for (var b = 0; b < _arr.length; b++) {
                                var _btnItem = _arr[b];
                                var _tokens = {};
                                var _itemHTML = _btnItem.html;

                                if (!_itemHTML) {

                                    //if no HTML override is provided for the button, use the generic button template
                                    _itemHTML = options.HtmlTemplates.ActionButtonTemplate;

                                    _tokens["%%ICON%%"] = _btnItem.icon;
                                    _tokens["%%CONTENT%%"] = util_htmlEncode(_btnItem.v);
                                }

                                _tokens["%%ATTR%%"] = util_htmlAttribute("data-attr-home-editor-group-toolbar-btn", _btnItem.id) +
                                                      (util_forceString(_btnItem["attr"]) != "" ? " " + _btnItem["attr"] : "");

                                _btnHTML += util_replaceTokens(_itemHTML, _tokens);
                            }

                            $toolbar.append(_btnHTML);

                            $mobileUtil.refresh($toolbar);
                        }

                        var $btnList = $toolbar.find("[data-attr-home-editor-group-toolbar-btn='save'], [data-attr-home-editor-group-toolbar-btn='cancel'], " +
                                                     "[data-attr-home-editor-group-toolbar-btn='edit'], [data-attr-home-editor-group-toolbar-btn='done']");

                        var $btnNavigateBack = $toolbar.find("[data-attr-home-nav-button-id='back']");

                        $btnList.filter("[data-attr-home-editor-group-toolbar-btn='edit']").toggle(!isEditMode);
                        $btnList.not("[data-attr-home-editor-group-toolbar-btn='edit']").toggle(isEditMode && !disableModifyButtons);
                        $btnList.filter("[data-attr-home-editor-group-toolbar-btn='done']").toggle(isEditMode && disableModifyButtons);

                        $btnNavigateBack.toggle(!isEditMode);

                    };

                    switch (_btnID) {

                        case "edit":
                        case "save":
                        case "cancel":
                        case "done":

                            var _isEditButton = (_btnID == "edit");
                            var _sectionContentStateID = util_forceInt($header.find(".SectionTab.LinkSelected[data-attr-home-editor-group-content-id]")
                                                                              .attr("data-attr-home-editor-group-content-state-id"), enCE.None);

                            if (_sectionContentStateID == enCEContentState.ReadOnly) {

                                var _handled = false;

                                if (_btnID == "done" && $content.hasClass("StateDisableToolbarButtonAction")) {
                                    _handled = true;
                                }

                                if (!_handled) {

                                    _handled = true;

                                    //read only sections can only be edited by its controller
                                    $content.toggleClass("ViewModeEdit", _isEditButton);

                                    $header.trigger("events.homeview_setTabEnabled", { "IsEnabled": !_isEditButton });

                                    _fnToggleEditState(_isEditButton, true);

                                    var $viewControllers = $content.find("[" + util_renderAttribute("pluginEditor_viewController") + "]");

                                    $viewControllers.trigger("events.controller_toggleEditMode", {
                                        "PluginInstance": _instance, "IsEdit": _isEditButton, "Trigger": $btn, "Callback": args.Callback,
                                        "LayoutManager": _fnGetLayoutManager(), "RevertToggleEditState": function () {
                                            _fnToggleEditState(false, true);
                                        }
                                    });
                                }

                                return;
                            }

                            if ((_btnID == "save" || _btnID == "cancel") && !$btn.data("has-prompt-response")) {

                                var _prompt = { "Title": "", "Message": "", "IsHTML": false };

                                switch (_btnID) {

                                    case "save":
                                        _prompt.Title = "Save Changes";
                                        _prompt.Message = "Are you sure you want to save changes?";
                                        break;

                                    case "cancel":
                                        _prompt.Title = "Discard";
                                        _prompt.Message = "Are you sure you want to revert all changes?";
                                        break;
                                }

                                dialog_confirmYesNo(_prompt.Title, _prompt.Message,
                                                   function () {

                                                       if (_btnID == "save") {
                                                           var _isContinueEdit = (util_forceInt($btn.attr("data-attr-home-editor-is-continue"), enCETriState.None) ==
                                                                                  enCETriState.Yes);

                                                           $element.trigger("events.save", {
                                                               "IsContinueEdit": _isContinueEdit,
                                                               "Callback": function (saveResult) {

                                                                   saveResult = util_extend({ "IsSaved": false, "SaveItem": null, "ErrorCallback": null }, saveResult);

                                                                   if (!_isContinueEdit) {
                                                                       $btn.data("has-prompt-response", true);
                                                                       $btn.trigger("click.homeview_onToolbarButtonSelected", { "Callback": saveResult.ErrorCallback });
                                                                   }
                                                               }
                                                           });
                                                       }
                                                       else {
                                                           $btn.data("has-prompt-response", true);
                                                           $btn.trigger("click.homeview_onToolbarButtonSelected");
                                                       }
                                                   },
                                                   function () {
                                                       $btn.removeData("has-prompt-response");
                                                   }, _prompt.IsHTML);

                                return;
                            }

                            $btn.removeData("has-prompt-response");

                            var _isRestore = (_btnID == "cancel");

                            $header.trigger("events.homeview_setTabEnabled", { "IsEnabled": !_isEditButton });

                            if (_isRestore) {

                                //remove all the temporary created editors that are not yet saved
                                var $tempEditors = $content.find("[" + util_renderAttribute("pluginEditor_content") + "]" + "[data-attr-home-editor-temp-content-id]");

                                $tempEditors.remove();
                            }

                            if (_fnUserCanAdmin()) {
                                var $editors = $content.find("[" + util_renderAttribute("pluginEditor_content") + "]");

                                var _fn = function (index) {

                                    if (index < $editors.length) {
                                        var $currentEditor = $($editors.get(index));

                                        $currentEditor.trigger("events.setEditable", {
                                            "IsRestore": _isRestore,
                                            "IsEditable": (_btnID == "edit"),
                                            "Callback": function () {

                                                setTimeout(function () {
                                                    _fn(index + 1);
                                                }, 100);
                                            }
                                        });
                                    }
                                    else {
                                        $btn.removeClass("ButtonDisabled");
                                        _fnToggleEditState(_isEditButton);

                                        $element.trigger("events.toggleOverlay", { "IsEnabled": false });
                                        _toolbarClickCallback();
                                    }

                                };  //end: _fn

                                $btn.addClass("ButtonDisabled");

                                $element.trigger("events.toggleOverlay", { "IsEnabled": true });

                                if (_isEditButton && $editors.length == 0) {
                                    $element.trigger("events.insertContentEditor", {
                                        "Callback": function () {
                                            _fn(0);
                                        }
                                    });
                                }
                                else {
                                    _fn(0);
                                }

                            }
                            else {
                                _fnToggleEditState(false);
                                _toolbarClickCallback();
                            }

                            break;  //end: edit, cancel

                        default:

                            _toolbarClickCallback();

                            break;
                    }

                });

                $toolbar.off("click.controller_toolbarButtonClick");
                $toolbar.on("click.controller_toolbarButtonClick", ".LinkClickable:not(.LinkDisabled)[data-attr-editor-controller-action-btn]", function (e, args) {

                    //view controllers can only be invoked from content container (not the inline popup)
                    var $viewControllers = $content.find("[" + util_renderAttribute("pluginEditor_viewController") + "]");

                    $viewControllers.trigger("events.controller_OnButtonClick", {
                        "Trigger": this, "Event": e, "Parent": ($inlinePopup.is(":visible") ? $inlinePopup : $content),
                        "InvokeExtArgs": (args ? args["InvokeExtArgs"] : null),
                        "LayoutManager": _fnGetLayoutManager()
                    });
                });

                $toolbar.off("events.reload");
                $toolbar.on("events.reload", function (e) {

                    //retrieve the editor group item from source and update the container DOM data
                    _instance.GetData({
                        "Type": "EditorGroupByPrimaryKey", "Filters": {
                            "EditorGroupID": util_forceInt($element.attr("data-attr-home-editor-group-id"), enCE.None),
                            "DeepLoad": true
                        }, "From": options.From
                    }, function (result) {

                        var _editorGroup = (result && result.Success ? result.Data : null);

                        _editorGroup = (_editorGroup || {});

                        $element.data("DataItem", _editorGroup);

                        //force reload of the current section
                        $header.find(".LinkSelected[data-attr-home-editor-group-content-id]")
                               .removeClass("LinkSelected")
                               .trigger("click");
                    });

                }); //end: events.reload

                $toolbar.off("events.snapshot");
                $toolbar.on("events.snapshot", function (e, args) {

                    args = util_extend({ "IsRestore": false, "IsHide": false, "IncludeCustomButtons": false }, args);

                    var $btnList = $toolbar.find("[data-attr-home-nav-button-id='back'], [data-attr-home-editor-group-toolbar-btn]" +
                                                 (args.IncludeCustomButtons ? ", .LinkCustomButton" : ""));

                    if (args.IsRestore) {

                        $btnList.hide();

                        var $prevList = $($toolbar.data("snapshot-visible"));

                        $prevList.show();

                        //remove custom buttons that were created (as they are not persisted when restoring snapshot)
                        $toolbar.find(".LinkCustomButton")
                                .not($prevList)
                                .remove();

                        $toolbar.removeData("snapshot-visible");
                    }
                    else {
                        $toolbar.data("snapshot-visible", $btnList.filter(":visible"));

                        if (args.IsHide) {
                            $btnList.hide();
                        }
                    }

                }); //end: events.snapshot

                var m_editorPluginUtils = pluginEditor_getUtils();

                $filters.off("change.filter_update");
                $filters.on("change.filter_update", ".EditorFilterView .FilterElement select", function (e, args) {

                    //view controllers can only be invoked from content container (not the inline popup)
                    var $viewControllers = $content.find("[" + util_renderAttribute("pluginEditor_viewController") + "]");

                    var $this = $(this);
                    var $vwCurrentFilter = $this.closest(".EditorFilterView");
                    var _filterType = $vwCurrentFilter.attr("data-attr-filter-type");

                    var _fnUpdate = function () {

                        $viewControllers.trigger("events.controller_OnFilterUpdate", {
                            "Trigger": this, "Event": e, "Parent": $content,
                            "InvokeExtArgs": (args ? args["InvokeExtArgs"] : null),
                            "LayoutManager": _fnGetLayoutManager(),
                            "Callback": null
                        });

                    };  //end: _fnUpdate

                    //check if the filter that was updated is related to Platform (in which case need to rebuild all other filters for updated values)
                    if (_filterType == "platform") {

                        //TODO does not support reload of editor group that has a custom Name and/or EditorForeignTypeID (only uses specific unique constraint keys)
                        $this.trigger("events.setDataAttributes", {
                            "PlatformID": util_forceInt($this.val(), enCE.None),
                            "Callback": function () {

                                var $vwFilters = $filters.find(".EditorFilterView[data-attr-filter-type]").not($vwCurrentFilter);

                                $this.trigger("events.getComponentUserPermission", {
                                    "Callback": function (perm) {
                                        var _queue = new CEventQueue();
                                        var _currentPermission = (perm ? perm["Permission"] : null);

                                        _fnInitToolbarButtons(true, _currentPermission, null, { "From": "filter_platform" });

                                        $.each($vwFilters, function () {
                                            var $vwFilter = $(this);

                                            _queue.Add(function (onCallback) {
                                                $vwFilter.trigger("events.filter_refreshView", { "Permission": _currentPermission, "Callback": onCallback });
                                            });
                                        });

                                        _queue.Run({ "Callback": _fnUpdate });
                                    }
                                });

                            }
                        });
                    }
                    else {
                        _fnUpdate();
                    }

                }); //end: change.filter_update

                $filters.off("events.filter_toggleState");
                $filters.on("events.filter_toggleState", function (e, args) {

                    args = util_extend({ "IsEnabled": true }, args);

                    var $list = $filters.find(".EditorFilterView .FilterElement select");

                    $list.selectmenu(args.IsEnabled ? "enable" : "disable");
                });

                $filters.off("events.filter_setView");
                $filters.on("events.filter_setView", function (e, args) {

                    args = util_extend({ "List": null, "Callback": null }, args);

                    var _list = (args.List || []);
                    var _arr = [];

                    var _fnGetDropdownHTML = function (filterID, filterType, label) {
                        return "<div class='EditorFilterView' " + util_htmlAttribute("data-attr-filter-view-id", filterID) + " " +
                               util_htmlAttribute("data-attr-filter-type", filterType) + ">" +
                               "    <div class='Label'>" + util_htmlEncode(label) + "</div>" +
                               "    <div class='FilterElement'>" + "<select data-mini='true' data-corners='false' />" + "</div>" +
                               "</div>";
                    };
                    
                    for (var i = 0; i < _list.length; i++) {
                        var _detail = util_extend({ "Type": null, "HTML": "", "Params": null, "OnBind": null, "Label": null }, _list[i]);

                        var _filterID = "vwFilter_" + i;
                        var _type = util_forceString(_detail.Type);

                        var _filterConfig = {
                            "HTML": util_forceString(_detail.HTML), "Params": _detail.Params, "OnBind": function (opts) {
                                if (opts["Callback"]) {
                                    opts.Callback();
                                }
                            },
                            "FilterType": _type, "IsOptional": false
                        };

                        if (_detail.OnBind) {
                            _filterConfig.OnBind = _detail.OnBind;
                        }

                        switch (_detail.Type) {

                            case "platform":
                                _filterConfig.HTML += _fnGetDropdownHTML(_filterID, _type, "Platform:");
                                
                                if (!_detail.OnBind) {

                                    var _isOptional = util_forceBool(_detail["IsOptional"], false);

                                    _filterConfig.IsOptional = _isOptional;

                                    _filterConfig.OnBind = function (opts) {
                                        
                                        m_editorPluginUtils.Events.UserAccess({
                                            "Trigger": $element,
                                            "ClassificationID": util_forceInt($element.attr("data-home-editor-group-classification-id"), enCE.None),
                                            "FilterComponentID": util_forceInt($element.attr("data-home-editor-group-component-id"), enCE.None),
                                            "Callback": function (userAccessResult) {

                                                var $ddl = $(opts.Element);
                                                var _selected = util_forceInt($ddl.val(), enCE.None);
                                                var _foundSelection = false;
                                                var _list = [];

                                                if (userAccessResult && userAccessResult["LookupPlatformAccess"]) {
                                                    var _lookupPlatformAccess = userAccessResult.LookupPlatformAccess;

                                                    for (var _platformID in _lookupPlatformAccess) {
                                                        var _item = _lookupPlatformAccess[_platformID];

                                                        _list.push({
                                                            "ID": _platformID, "Text": _instance.Utils.ForceEntityDisplayName({
                                                                "Type": "Platform", "Item": _item.Platform
                                                            })
                                                        });

                                                        if (_selected == _platformID) {
                                                            _foundSelection = true;
                                                            break;
                                                        }
                                                    }
                                                }

                                                if (_selected == enCE.None || !_foundSelection) {
                                                    _selected = util_forceInt($element.attr("data-home-editor-group-platform-id"), enCE.None);
                                                }

                                                util_dataBindDDL($ddl, _list, "Text", "ID", _selected, _isOptional, enCE.None, _labelDefault);

                                                if (opts.Callback) {
                                                    opts.Callback();
                                                }
                                            }
                                        });
                                        
                                    };  //end: platform OnBind function
                                }

                                break;  //end: platform

                            default:

                                if (_detail.Label) {
                                    _filterConfig.HTML += _fnGetDropdownHTML(_filterID, _type, _detail.Label);
                                }

                                break;
                        }

                        _arr.push(_filterConfig);
                    }

                    var _filtersHTML = "";

                    for (var i = 0; i < _arr.length; i++) {
                        var _filterConfig = _arr[i];

                        if (_filterConfig["HTML"]) {
                            _filtersHTML += _filterConfig["HTML"];
                        }
                    }

                    $filters.html(_filtersHTML);
                    $mobileUtil.refresh($filters);

                    var _permission = _fnUserComponentPermission();

                    var _fn = function (arr, index, viewStateOpts) {
                        if (index >= arr.length) {
                            if (args.Callback) {
                                args.Callback();
                            }
                        }
                        else {
                            var _config = arr[index];

                            if (!_config["OnBind"]) {
                                config["OnBind"] = function (opts) {
                                    if (opts["Callback"]) {
                                        opts.Callback();
                                    }
                                };
                            }

                            var $vw = $filters.find(".EditorFilterView[" + util_htmlAttribute("data-attr-filter-view-id", "vwFilter_" + index) + "]");

                            var _fnBindDDL = _config.OnBind;

                            $vw.off("events.filter_refreshView");
                            $vw.on("events.filter_refreshView", function (e, args) {

                                var $this = $(this).closest(".EditorFilterView");

                                args = util_extend({ "Permission": null, "Callback": null }, args);

                                var _fnGetPermission = function (onCallback) {

                                    if (args.Permission) {
                                        onCallback();
                                    }
                                    else {

                                        $this.trigger("events.getComponentUserPermission", {
                                            "Callback": function (perm) {

                                                args.Permission = perm;
                                                onCallback();
                                            }
                                        });
                                    }

                                };  //end: _fnGetPermission

                                _fnGetPermission(function () {

                                    _fnBindDDL({
                                        "Container": $this,
                                        "Permission": util_extend({}, args.Permission),
                                        "Element": $this.find(".FilterElement select"),
                                        "ViewState": util_extend({}, _viewStateOpts),
                                        "Callback": function () {
                                            if (args.Callback) {
                                                args.Callback();
                                            }
                                        }
                                    });

                                });

                            }); //end: events.filter_refreshView

                            $vw.trigger("events.filter_refreshView", {
                                "Permission": _permission,
                                "Callback": function () {
                                    _fn(arr, index + 1, viewStateOpts);
                                }
                            });

                        }
                    };

                    var _viewStateOpts = {
                        "IsPlatformOptional": false,
                        "ComponentID": util_forceInt($mobileUtil.GetClosestAttributeValue($filters, "data-home-editor-group-component-id"), enCE.None)
                    };

                    var _search = util_arrFilter(_arr, "FilterType", "platform", true);

                    if (_search.length == 1) {
                        _search = _search[0];
                        _viewStateOpts.IsPlatformOptional = util_forceBool(_search["IsOptional"], _viewStateOpts.IsPlatformOptional);
                    }

                    if (_viewStateOpts.IsPlatformOptional) {

                        //load the platform permissions regardless of the current viewed platform (required for filters view state on bind event)
                        $filters.trigger("events.getComponentUserPermission", {
                            "IsContextFilter": false, "IsListFormat": true,
                            "Callback": function (result) {
                                _viewStateOpts["PlatformComponentPermissions"] = (result || []);
                                _fn(_arr, 0, _viewStateOpts);
                            }
                        });
                    }
                    else {
                        _fn(_arr, 0, _viewStateOpts);
                    }

                }); //end: events.filter_setView

                $element.off("click.homeview_loadSectionContent");
                $element.on("click.homeview_loadSectionContent",
                            ":not(.LinkDisabled,.LinkSelected).SectionTab[data-attr-home-editor-group-content-id]", function (e, args) {
                                args = util_extend({ "Callback": null }, args);

                                var _clickCallback = function () {

                                    $element.trigger("events.toggleOverlay", { "IsEnabled": false });

                                    if (args.Callback) {
                                        args.Callback();
                                    }
                                };

                                if ($element.data("is-busy")) {
                                    return;
                                }

                                $element.trigger("events.toggleOverlay", { "IsEnabled": true, "Message": "Loading..." });

                                $element.data("is-busy", true);

                                var $this = $(this);
                                var _sectionContentID = util_forceInt($this.attr("data-attr-home-editor-group-content-id"), enCE.None);
                                var _sectionContentStateID = util_forceInt($this.attr("data-attr-home-editor-group-content-state-id"), enCE.None);

                                $header.trigger("events.homeview_onTabSelected", {
                                    "Trigger": $this, "SelectedID": _sectionContentID, "Callback": function (tabOpts) {

                                        var _editorGroupID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-home-editor-group-id"), enCE.None);

                                        if (_editorGroupID == enCE.None) {

                                            $element.removeData("is-busy");
                                            _clickCallback();
                                        }

                                        _instance.GetData({
                                            "Type": "EditorGroupContentList", "Filters": {
                                                "EditorGroupID": _editorGroupID, "ParentContentID": _sectionContentID, "ContentStateID": enCEContentState.Visible,
                                                "FilterContentTypeID": enCEContentType.Subsection
                                            },
                                            "From": args.From
                                        }, function (gcResult) {

                                            var _groupContentList = (gcResult && gcResult.Success && gcResult.Data ? gcResult.Data.List : null);
                                            var _found = false;

                                            _groupContentList = (_groupContentList || []);

                                            var _html = "";

                                            if (_sectionContentStateID != enCEContentState.ReadOnly) {
                                                _html += "<div " + util_renderAttribute("pluginEditor_userExportAction") + " />";
                                            }

                                            for (var i = 0; i < _groupContentList.length; i++) {
                                                var _groupContent = _groupContentList[i];
                                                var _contentID = _groupContent[enColEditorGroupContentProperty.ContentID];

                                                _html += "<div " + util_renderAttribute("pluginEditor_content") + " " +
                                                         util_htmlAttribute(DATA_ATTR_CONTROL_EDITOR_IS_INLINE_EDITABLE, enCETriState.No) + " " +
                                                         util_htmlAttribute("data-attr-home-editor-content-id", _contentID) + ">" +
                                                         "  <div class='ContentPlaceholder' />" +
                                                         "</div>";
                                            }

                                            $content.removeClass("ViewModeEdit");

                                            $content.html(_html);
                                            $mobileUtil.refresh($content);

                                            $content.data("CurrentSectionGroupContentList", _groupContentList);

                                            var $editorList = $content.find("[" + util_renderAttribute("pluginEditor_content") + "]");
                                            var _isReadOnly = (util_forceInt($(tabOpts.Current).attr("data-attr-home-editor-group-content-state-id"), enCE.None) ==
                                                               enCEContentState.ReadOnly);
                                            var _contentTokens = {};

                                            if (_isReadOnly) {
                                                var _controlTokenList = [
                                                    { p: "%%CONTROLLER_EDITOR_CRITERIA%%", c: "CValueMessageController" },
                                                    {
                                                        p: "%%CONTROLLER_CLAIMS%%", c: "CValueMessageController",
                                                        attr: util_htmlAttribute("data-attr-controller-param-default-view-mode", enCValueMessageViewMode.Claims)
                                                    }
                                                ];

                                                for (var t = 0; t < _controlTokenList.length; t++) {
                                                    var _tokenItem = _controlTokenList[t];
                                                    var _tokenKey = _tokenItem.p;
                                                    var _tokenVal = _tokenItem.c;
                                                    var _attrs = util_forceString(_tokenItem["attr"]);

                                                    _contentTokens[_tokenKey] = "<div " + util_renderAttribute("pluginEditor_viewController") + " " +
                                                                                util_htmlAttribute("data-attr-view-controller-instance-type", _tokenVal) +
                                                                                (_attrs != "" ? " " + _attrs : "") +
                                                                                " />";
                                                }
                                            }

                                            var _fnInitUserExportTools = function (onCallback) {

                                                var $vwUserExportAction = $content.find("[" + util_renderAttribute("pluginEditor_userExportAction") + "]");
                                                var _editorGroup = $element.data("DataItem"); //NOTE: the editor group data item is required and will be already populated

                                                if (!_editorGroup[enColCEEditorGroupProperty.UserContentExports]) {
                                                    _editorGroup[enColCEEditorGroupProperty.UserContentExports] = [];
                                                }

                                                $element.off("events.componentHome_onUpdateItemToggle");
                                                $element.on("events.componentHome_onUpdateItemToggle", function (e, args) {

                                                    args = util_extend({ "Type": null, "Item": null, "IsAdd": false }, args);

                                                    var _item = args.Item;

                                                    switch (args.Type) {

                                                        case "user_content_export":

                                                            //NOTE: the editor group data item is required and will be already populated
                                                            var _editorGroup = $element.data("DataItem"); 
                                                            var _userContentList = _editorGroup[enColCEEditorGroupProperty.UserContentExports];

                                                            if (!_userContentList) {
                                                                _userContentList = [];
                                                                _editorGroup[enColCEEditorGroupProperty.UserContentExports] = _userContentList;
                                                            }

                                                            if (args.IsAdd && _item) {
                                                                _userContentList.push(_item);
                                                            }
                                                            else if (!args.IsAdd && _item) {

                                                                _userContentList = util_arrFilterSubset(_userContentList, function (searchItem) {

                                                                    var _arr = [enColUserContentExportProperty.ClassificationPlatformID, enColUserContentExportProperty.EditorGroupID,
                                                                               enColUserContentExportProperty.ContentID, enColUserContentExportProperty.ValueMessageID,
                                                                               enColUserContentExportProperty.StatementID];

                                                                    //exclude the item that is being removed (use the PK fields)
                                                                    var _match = true;

                                                                    for (var i = 0; i < _arr.length && _match; i++) {
                                                                        var _prop = _arr[i];

                                                                        _match = (searchItem[_prop] == _item[_prop]);
                                                                    }

                                                                    return !_match;
                                                                });

                                                                _editorGroup[enColCEEditorGroupProperty.UserContentExports] = _userContentList;
                                                            }

                                                            break;  //end: user_content_export
                                                    }

                                                });

                                                $vwUserExportAction.trigger("events.userExportAction_OnInit", {
                                                    "Instance": _instance,
                                                    "Data": _editorGroup[enColCEEditorGroupProperty.UserContentExports],
                                                    "ContentID": _sectionContentID,
                                                    "Attributes": {
                                                        "data-user-export-context-classification-platform-id": _editorGroup[enColEditorGroupProperty.ClassificationPlatformID],
                                                        "data-user-export-context-content-id": _sectionContentID
                                                    },
                                                    "OnUpdateItemToggle": function (obj, mItem, mIsAdd) {

                                                        //update the source editor group item's content user export list for the modified entry
                                                        $element.trigger("events.componentHome_onUpdateItemToggle", {
                                                            "Type": "user_content_export", "Item": mItem, "IsAdd": mIsAdd
                                                        });
                                                    }
                                                });

                                                if (onCallback) {
                                                    onCallback();
                                                }

                                            };  //end: _fnInitUserExportTools

                                            var _fnPopulate = function (index, lookupContent) {

                                                if (index < $editorList.length) {
                                                    var $editor = $($editorList.get(index));
                                                    var _contentID = util_forceInt($editor.attr("data-attr-home-editor-content-id"), enCE.None);
                                                    var _contentHTML = "";
                                                    var _contentItem = lookupContent[_contentID];

                                                    if (_contentItem) {
                                                        _contentHTML = _contentItem[enColContentProperty.ContentHTML];
                                                    }

                                                    $editor.data("DataItem", _contentItem);  //persist the source content data item

                                                    $editor.trigger("events.setContent", { "HTML": _contentHTML, "IsReadOnly": _isReadOnly, "Tokens": _contentTokens });

                                                    setTimeout(function () {
                                                        _fnPopulate(index + 1, lookupContent);
                                                    }, (options.IsAnimate ? 100 : 0));
                                                }
                                                else {

                                                    _fnInitUserExportTools(function () {

                                                        var _fnLoadCustomTabHTML = null;

                                                        if (_groupContentList.length == 0 && $this.data("OnLoadTabHTML")) {
                                                            _fnLoadCustomTabHTML = $this.data("OnLoadTabHTML");
                                                        }

                                                        var _fnBindViewControllers = function () {

                                                            var $viewControllers = (_isReadOnly ?
                                                                                    $content.find("[" + util_renderAttribute("pluginEditor_viewController") + "]") :
                                                                                    null);

                                                            if ($viewControllers != null && $viewControllers.length) {
                                                                $viewControllers.trigger("events.controller_bind", {
                                                                    "PluginInstance": _instance, "EditorGroupID": _editorGroupID, "LayoutManager": _fnGetLayoutManager()
                                                                });
                                                            }

                                                            _clickCallback();

                                                        };  //end: _fnBindViewControllers

                                                        $element.removeData("is-busy");

                                                        if (_fnLoadCustomTabHTML) {
                                                            _fnLoadCustomTabHTML(function (customHTML) {

                                                                $content.html(util_forceString(customHTML));
                                                                $mobileUtil.refresh($content);

                                                                _fnBindViewControllers();
                                                            });
                                                        }
                                                        else {
                                                            _fnBindViewControllers();
                                                        }
                                                    });

                                                    
                                                }

                                            };  //end: _fnPopulate

                                            _instance.GetData({
                                                "Type": "ContentList", "Filters": {
                                                    "ContentTypeID": enCEContentType.Subsection,
                                                    "EditorGroupID": _editorGroupID,
                                                    "ParentContentID": _sectionContentID
                                                }, "From": args.From
                                            }, function (contentResult) {

                                                var _lookupContent = {};

                                                var _contentList = (contentResult && contentResult.Success && contentResult.Data ? contentResult.Data.List : null);

                                                _contentList = (_contentList || []);

                                                for (var c = 0; c < _contentList.length; c++) {
                                                    var _content = _contentList[c];
                                                    var _contentID = _content[enColContentProperty.ContentID];

                                                    _lookupContent[_contentID] = _content;
                                                }

                                                _fnPopulate(0, _lookupContent);

                                            }); //end: ContentList data call
                                        });
                                    }
                                });

                            });
                //end: click.homeview_loadSectionContent

                $element.off("events.getLayoutManager");
                $element.on("events.getLayoutManager", function (e, args) {
                    args = util_extend({ "Callback": null }, args);

                    if (args.Callback) {
                        args.Callback(_fnGetLayoutManager());
                    }
                });

                $element.off("events.getComponentUserPermission");
                $element.on("events.getComponentUserPermission", function (e, args) {

                    args = util_extend({
                        "Callback": null, "IsContextFilter": true, "OverridePlatformID": enCE.None, "OverrideComponentID": enCE.None, "OverrideClassificationID": enCE.None,
                        "IsListFormat": false
                    }, args);

                    var _fn = function (perm) {

                        if (args.Callback) {

                            if (args.IsListFormat) {

                                m_editorPluginUtils.Events.UserAccess({
                                    "Trigger": $element,
                                    "ClassificationID": util_forceInt($element.attr("data-home-editor-group-classification-id"), enCE.None),
                                    "FilterComponentID": util_forceInt($element.attr("data-home-editor-group-component-id"), enCE.None),
                                    "Callback": function (userAccessResult) {

                                        var _result = [];

                                        if (userAccessResult && userAccessResult["LookupPlatformAccess"]) {
                                            var _lookupPlatformAccess = userAccessResult.LookupPlatformAccess;

                                            for (var _platformID in _lookupPlatformAccess) {
                                                var _item = _lookupPlatformAccess[_platformID];
                                                var _perm = _item["Permission"];

                                                _result.push({
                                                    "PlatformID": util_forceInt(_platformID, enCE.None),
                                                    "Item": _item,
                                                    "Permission": util_extend({}, _perm),
                                                    "CanAdmin": (_perm ? _fnUserCanAdmin({ "Permission": _perm }) : false)
                                                });
                                            }
                                        }

                                        args.Callback(_result);
                                    }
                                });
                            }
                            else {
                                args.Callback({
                                    "Permission": util_extend({}, perm),
                                    "CanAdmin": (perm ? _fnUserCanAdmin({ "Permission": perm }) : false)
                                });
                            }
                        }
                    };

                    var _platformID = enCE.None;

                    if (util_forceInt(args.OverridePlatformID, enCE.None) != enCE.None) {
                        _platformID = args.OverridePlatformID;
                    }
                    else if (args.IsContextFilter) {
                        var _layoutManager = _fnGetLayoutManager();
                        var _filterSelections = _layoutManager.FilterSelections();

                        _platformID = _filterSelections.GetFilterID("platform");
                    }

                    if (!args.IsListFormat) {
                        _fn(_fnUserComponentPermission({
                            "PlatformID": _platformID, "OverrideComponentID": args.OverrideComponentID,
                            "OverrideClassificationID": args.OverrideClassificationID
                        }));
                    }
                    else {
                        _fn(null);
                    }

                }); //end: events.getComponentUserPermission

                $element.off("events.getUserEffectiveComponentPermissionSummary");
                $element.on("events.getUserEffectiveComponentPermissionSummary", function (e, args) {

                    args = util_extend({
                        "ClassificationID": enCE.None, "PlatformID": enCE.None, "ComponentID": enCE.None,
                        "IsFilterActive": true, //restrict to only active permission summaries
                        "Callback": null
                    }, args);

                    var _queue = new CEventQueue();
                    var _val = {
                        "SummaryList": null,
                        "UserRoles": null,
                        "Result": null
                    };

                    //get the applicable user roles
                    _queue.Add(function (onCallback) {
                        APP.Service.Action({
                            "c": "PluginEditor", "m": "UserClassificationPlatformRoleGetByForeignKey",
                            "args": {
                                "ClassificationID": util_forceInt(args.ClassificationID, enCE.None),
                                "PlatformID": util_forceInt(args.PlatformID, enCE.None)
                            }
                        }, function (data) {

                            _val.UserRoles = (data ? data.List : null);
                            _val.UserRoles = (_val.UserRoles || []);

                            onCallback();
                        });
                    });

                    _queue.Add(function (onCallback) {

                        APP.Service.Action({
                            "c": "PluginEditor", "m": "EffectivePermissionSummaryUserPlatformRoles",
                            "args": { "UserRoles": util_stringify(_val.UserRoles), "IsLookupFormat": false }
                        }, function (data) {
                            _val.SummaryList = (data || []);
                            onCallback();
                        });

                    });

                    _queue.Run({
                        "Callback": function () {

                            //apply additional filter for active components, if applicable
                            var _isFilterActive = util_forceBool(args["IsFilterActive"], false);
                            var _componentID = util_forceInt(args["ComponentID"], enCE.None);

                            if (_isFilterActive) {
                                _val.SummaryList = util_arrFilter(_val.SummaryList, enColCPlatformComponentUserRoleProperty.IsActive, true);
                            }

                            _val.Result = [];

                            for (var p = 0; p < _val.SummaryList.length; p++) {
                                var _permSummary = _val.SummaryList[p];

                                if (_componentID == enCE.None || _permSummary[enColCPlatformComponentUserRoleProperty.ComponentID] == _componentID) {
                                    _val.Result.push({
                                        "Item": _permSummary,
                                        "CanAdmin": _fnUserCanAdmin({ "Permission": _permSummary })
                                    });
                                }
                            }

                            if (args.Callback) {
                                args.Callback(_val);
                            }
                        }
                    });

                }); //end: events.getUserEffectiveComponentPermissionSummary

                $element.off("events.insertContentEditor");
                $element.on("events.insertContentEditor", function (e, args) {

                    args = util_extend({ "Callback": null, "Target": null }, args);

                    var $target = $(args.Target);
                    var _tempID = util_forceInt($element.data("temp-content-id"), 0);

                    _tempID += 1;

                    $element.data("temp-content-id", _tempID);

                    var $temp = $("<div " + util_renderAttribute("pluginEditor_content") + " " +
                                  util_htmlAttribute(DATA_ATTR_CONTROL_EDITOR_IS_INLINE_EDITABLE, enCETriState.Yes) + " " +
                                  util_htmlAttribute("data-attr-home-editor-temp-content-id", _tempID) + "></div>");

                    $temp.hide();

                    if ($target.length == 0) {
                        $content.append($temp);
                    }
                    else {
                        $temp.insertAfter($target);
                    }

                    $mobileUtil.RenderRefresh($temp, true);

                    $temp.trigger("events.setContent", {
                        "HTML": "", "Callback": function () {

                            $temp.trigger("events.setEditable", {
                                "IsEditable": true, "Callback": function () {

                                    $temp.toggle("height", function () {
                                        if (args.Callback) {
                                            args.Callback();
                                        }
                                    });
                                }
                            });
                        }
                    });

                }); //end: events.insertContentEditor

                var _fnPopulateSaveItem = function (opts) {

                    opts = util_extend({ "Item": null, "IsContinueEdit": false, "Callback": null }, opts);

                    var $selectedTab = $header.find(".LinkSelected[data-attr-home-editor-group-content-id]");
                    var _item = opts.Item;

                    var _arrGroupContents = [];
                    var _arrContentList = [];

                    //use the latest editor group data item and set its save restriction to current section content ID (as parent)
                    var _sectionContentID = util_forceInt($selectedTab.attr("data-attr-home-editor-group-content-id"), enCE.None);

                    _item[enColCEEditorGroup_JSONProperty.RestrictParentContentID] = _sectionContentID;

                    //retrieve the main editor group item along with editor group content item of current section
                    //(this will be used as base to determine if there is save conflict)
                    var _prevEditorGroup = $element.data("DataItem");

                    var _searchSection = util_arrFilterSubset(_prevEditorGroup[enColCEEditorGroupProperty.GroupContents], function (search) {

                        //the parent section editor group content will have the same ID for the parent and child content
                        return (search[enColEditorGroupContentProperty.ContentID] == _sectionContentID && search[enColEditorGroupContentProperty.ParentContentID]);
                    }, true);

                    _searchSection = _searchSection[0];

                    _arrGroupContents.push(_searchSection);

                    //populate the subsection editor group content items (as bound to the DOM element data)
                    var _prevSectionGroupContentList = $content.data("CurrentSectionGroupContentList");
                    var $editors = $content.find("[" + util_renderAttribute("pluginEditor_content") + "]");

                    var _fnGetEditorContent = function (index) {

                        //possible states of the editor:
                        //  -deleted (existing)
                        //  -update (existing)
                        //  -add new
                        //  -no changes (existing); must save the item but not the deep save of the child content
                        //NOTES:
                        //  -deleted and flag it as such (exclude temp elements)
                        //  -updated and set its related content item with the new HTML
                        //  -newly added using temp IDs and its related content item with the HTML

                        if (index < $editors.length) {

                            var $editor = $($editors.get(index));
                            var _isTemp = $editor.is("[data-attr-home-editor-temp-content-id]");
                            var _isDeleted = $editor.hasClass("DeletedItem");
                            var _valid = true;

                            //disregard temp editor items that have been deleted
                            if (_isTemp && _isDeleted) {
                                _valid = false;
                            }

                            if (_valid) {

                                var _editorGroupContent = null;
                                var _editorContentItem = $editor.data("DataItem");

                                if (!_editorContentItem) {
                                    _editorContentItem = new CEContent_JSON();
                                }

                                if (!_isTemp) {

                                    //find existing data item
                                    var _searchContentID = util_forceInt($editor.attr("data-attr-home-editor-content-id"), enCE.None);

                                    _editorGroupContent = util_arrFilter(_prevSectionGroupContentList, enColEditorGroupContentProperty.ContentID, _searchContentID,
                                                                         true);
                                    _editorGroupContent = (_editorGroupContent.length == 1 ? _editorGroupContent[0] : null);
                                }

                                if (!_editorGroupContent) {
                                    _editorGroupContent = new CEEditorGroupContent();
                                }

                                _editorGroupContent[enColEditorGroupContentProperty.ParentContentID] = _sectionContentID;
                                _editorGroupContent[enColEditorGroupContentProperty.ContentStateID] = enCEContentState.Visible;
                                _editorGroupContent[enColCEEditorGroupContent_JSONProperty.EditType] = (_isDeleted ? enCEEditType.Delete : enCEEditType.Update);

                                _editorContentItem[enColContentProperty.ContentTypeID] = enCEContentType.Subsection;

                                if (_isTemp) {

                                    //set the temp content ID and configure the default content item properties
                                    var _tempContentID = util_forceInt($editor.attr("data-attr-home-editor-temp-content-id"), enCE.None);

                                    _editorContentItem[enColCEContent_JSONProperty.TempContentID] = _tempContentID;
                                    _editorGroupContent[enColCEEditorGroupContent_JSONProperty.TempContentID] = _tempContentID;
                                }
                                else {
                                    _editorGroupContent[enColCEEditorGroupContent_JSONProperty.TempContentID] = enCE.None;
                                }

                                //associate the content item to the editor group only if it is being deleted
                                _editorGroupContent[enColCEEditorGroupContent_JSONProperty.ContentItem] = (_isDeleted ? _editorContentItem : null);

                                _arrGroupContents.push(_editorGroupContent);

                                if (_isDeleted) {

                                    //if the item has been deleted, execute next recursive call as the content does not need to be populated
                                    setTimeout(function () {
                                        _fnGetEditorContent(index + 1);
                                    }, 50);

                                    return;
                                }

                                $editor.trigger("events.getContent", {
                                    "Callback": function (editMetadata) {

                                        editMetadata.IsModified = (editMetadata.IsModified || $editor.data("is-modified", true));

                                        if (editMetadata.IsModified) {
                                            var $temp = $("<div>" + util_forceString(editMetadata.HTML) + "</div>");

                                            _editorContentItem[enColContentProperty.ContentHTML] = editMetadata.HTML;
                                            _editorContentItem[enColContentProperty.ContentText] = util_trim($temp.text());

                                            script_validateHTML({ "Index": index, "HTML": editMetadata.HTML });
                                        }

                                        //only include the content to be saved if it has been modified or is a new temp entry
                                        var _isModified = (_isTemp || editMetadata.IsModified);

                                        _editorGroupContent[enColCEEditorGroupContent_JSONProperty.EditType] = (_isModified ? enCEEditType.Update :
                                                                                                                enCEEditType.NoChange);

                                        if (_isModified) {
                                            _arrContentList.push(_editorContentItem);
                                        }

                                        $editor.toggleClass("ContentIsModified", _isModified)
                                               .data("is-modified", true);

                                        if (opts.IsContinueEdit && !_isTemp && editMetadata.IsModified) {

                                            //mode is "save & continue" edit, so need to reset editor content and state
                                            var $currentEditor = $editor.find("[" + util_renderAttribute("editor") + "]");

                                            $currentEditor.trigger("events.editor_saveState", {
                                                "IsReset": true, "Callback": function () {
                                                    $currentEditor.trigger("blur.homeview_editorContent");
                                                }
                                            });
                                        }

                                        setTimeout(function () {
                                            _fnGetEditorContent(index + 1);
                                        }, 50);
                                    }
                                });

                            }
                            else {

                                setTimeout(function () {
                                    _fnGetEditorContent(index + 1);
                                }, 50);
                            }
                        }
                        else {

                            //update the display order (only for items not deleted and excluding the section editor group content item)
                            var _order = 1;
                            var _foundChange = false;

                            //default value for edit type on parent section of no change
                            _searchSection[enColCEEditorGroupContent_JSONProperty.EditType] = enCEEditType.NoChange;

                            for (var gc = 0; gc < _arrGroupContents.length; gc++) {
                                var _editorGroupContent = _arrGroupContents[gc];

                                if (_editorGroupContent[enColCEEditorGroupContent_JSONProperty.EditType] != enCEEditType.Delete &&
                                    _editorGroupContent[enColEditorGroupContentProperty.ParentContentID] !=
                                    _editorGroupContent[enColEditorGroupContentProperty.ContentID]) {

                                    var _currentDisplayOrder = _editorGroupContent[enColEditorGroupContentProperty.DisplayOrder];
                                    var _newDisplayOrder = _order++;

                                    _editorGroupContent[enColEditorGroupContentProperty.DisplayOrder] = _newDisplayOrder;

                                    //check if the editor group content entry has not been modified, but its display order has changed (in which flag it as an update)
                                    if (_editorGroupContent[enColCEEditorGroupContent_JSONProperty.EditType] == enCEEditType.NoChange &&
                                        _newDisplayOrder !== _currentDisplayOrder) {
                                        _editorGroupContent[enColCEEditorGroupContent_JSONProperty.EditType] = enCEEditType.Update;
                                    }
                                }

                                _foundChange = (_foundChange || (_editorGroupContent[enColCEEditorGroupContent_JSONProperty.EditType] != enCEEditType.NoChange));

                            }

                            //for the parent section editor content, configure its edit type property to Update only if there are children with modifications
                            _searchSection[enColCEEditorGroupContent_JSONProperty.EditType] = (_foundChange ? enCEEditType.Update : enCEEditType.NoChange);

                            //set the editor group content and raw content list on the JSON instance of the class property
                            _item[enColCEEditorGroup_JSONProperty.EditorGroupContentList] = _arrGroupContents;
                            _item[enColCEEditorGroup_JSONProperty.ContentList] = _arrContentList;

                            if (opts.Callback) {
                                opts.Callback(_item);
                            }

                        }

                    };  //end: _fnGetEditorContent

                    _fnGetEditorContent(0);

                };  //end: _fnPopulateSaveItem

                var _fnUpdateViewData = function (opts) {

                    opts = util_extend({ "EditorGroupDataItem": null, "IsContinueEdit": false }, opts);

                    var _updateItem = opts.EditorGroupDataItem;

                    $content.data("CurrentSectionGroupContentList",
                                  util_arrFilterSubset(_updateItem[enColCEEditorGroup_JSONProperty.EditorGroupContentList], function (searchItem) {

                                      //exclude the subsection item (i.e. parent and child content ID are the same)
                                      return searchItem[enColEditorGroupContentProperty.ParentContentID] !=
                                             searchItem[enColEditorGroupContentProperty.ContentID];
                                  }));

                    var _editorGroup = $element.data("DataItem");
                    var _sections = _editorGroup[enColCEEditorGroupProperty.GroupContents];
                    var _found = -1;

                    if (!_sections) {
                        _sections = [];
                        _editorGroup[enColCEEditorGroupProperty.GroupContents] = _sections;
                    }

                    var $selectedTab = $header.find(".LinkSelected[data-attr-home-editor-group-content-id]");
                    var _searchContentID = util_forceInt($selectedTab.attr("data-attr-home-editor-group-content-id"), enCE.None);

                    //find index of selected section content from source array and update with new value
                    for (var s = 0; s < _sections.length; s++) {
                        var _editorGroupContent = _sections[s];

                        if (_editorGroupContent[enColEditorGroupContentProperty.ContentID] == _searchContentID) {
                            _found = s;
                            break;
                        }
                    }

                    var _updateSectionContent = util_arrFilter(_updateItem[enColCEEditorGroup_JSONProperty.EditorGroupContentList],
                                                               enColEditorGroupContentProperty.ContentID, _searchContentID, true);

                    _updateSectionContent = _updateSectionContent[0];

                    if (_found < 0) {
                        _sections.push(_updateSectionContent);
                    }
                    else {
                        _sections[_found] = _updateSectionContent;
                    }

                    //update data items of all editors (excluding deleted entries and restricted to modified content)
                    var $editors = $content.find("[" + util_renderAttribute("pluginEditor_content") + "].ContentIsModified:not(.DeletedItem)");

                    $editors.removeData("is-modified");

                    $.each($editors, function () {
                        var $editor = $(this);
                        var _contentDataItem = null;

                        var _isTemp = $editor.is("[data-attr-home-editor-temp-content-id]");
                        var _searchProp = null;
                        var _searchID = null;

                        $editor.removeClass("ContentIsModified");

                        if (_isTemp) {

                            //search using the temp content ID
                            _searchID = util_forceInt($editor.attr("data-attr-home-editor-temp-content-id"), enCE.None);
                            _searchProp = enColCEContent_JSONProperty.TempContentID;
                        }
                        else {
                            _searchID = util_forceInt($editor.attr("data-attr-home-editor-content-id"), enCE.None);
                            _searchProp = enColContentProperty.ContentID;
                        }

                        _contentDataItem = util_arrFilter(_updateItem[enColCEEditorGroup_JSONProperty.ContentList], _searchProp, _searchID, true);
                        _contentDataItem = (_contentDataItem.length == 1 ? _contentDataItem[0] : null);

                        if (_contentDataItem) {
                            $editor.data("DataItem", _contentDataItem);

                            if (_isTemp) {

                                //remove the temp content ID and update data attributes to the newly created content ID
                                $editor.trigger("events.removeTempState", {
                                    "ContentID": _contentDataItem[enColContentProperty.ContentID], "IsForceRefresh": (opts.IsContinueEdit == true)
                                });

                                //cleanup the temp properties of the data item
                                _contentDataItem[enColCEContent_JSONProperty.TempContentID] = enCE.None;
                            }
                        }
                    });


                };  //end: _fnUpdateViewData

                $element.off("events.save");
                $element.on("events.save", function (e, args) {

                    args = util_extend({ "Callback": null, "IsContinueEdit": false }, args);

                    var _saveCallback = function (success, saveItem) {

                        var _fnErrorCallback = null;

                        if (success && saveItem) {

                            //update the data items bound to DOM elements
                            _fnUpdateViewData({ "EditorGroupDataItem": saveItem, "IsContinueEdit": args.IsContinueEdit });

                            AddMessage("Changes have  been successfully saved.", null, null, { "IsTimeout": true });
                        }

                        //remove the deleted editors
                        var $deletedEditors = $content.find(".DeletedItem[" + util_renderAttribute("pluginEditor_content") + "]");

                        $deletedEditors.remove();

                        if (success) {
                            $element.trigger("events.toggleOverlay", { "IsEnabled": false });
                        }
                        else {

                            _fnErrorCallback = function () {

                                $element.trigger("events.toggleOverlay", {
                                    "IsEnabled": true, "Message": "Click here to reload the page.", "IsHTML": true,
                                    "OnClick": function () {
                                        $toolbar.trigger("events.reload");
                                    }
                                });
                            };
                        }

                        if (args.Callback) {
                            args.Callback({ "IsSaved": success, "SaveItem": saveItem, "ErrorCallback": _fnErrorCallback });
                        }
                    };

                    $element.trigger("events.toggleOverlay", { "IsEnabled": true, "Message": "Saving changes..." });

                    var _editorGroupID = util_forceInt($element.attr("data-attr-home-editor-group-id"), enCE.None);

                    //get the latest editor group data item (without deep load)
                    _instance.GetData({ "Type": "EditorGroupByPrimaryKey", "Filters": { "EditorGroupID": _editorGroupID, "DeepLoad": false }, "From": options.From },
                                      function (result) {

                                          var _editorGroup = (result && result.Success ? result.Data : null);

                                          var _fnCallbackError = function (isSaveConflict) {
                                              _saveCallback(false);
                                          };

                                          _editorGroup = (_editorGroup || {});

                                          if (util_forceInt(_editorGroup[enColEditorGroupProperty.EditorGroupID], enCE.None) == enCE.None) {
                                              _fnCallbackError();
                                              return;
                                          }

                                          ClearMessages();

                                          _fnPopulateSaveItem({
                                              "Item": _editorGroup, "IsContinueEdit": args.IsContinueEdit,
                                              "Callback": function () {

                                                  if (MessageCount() != 0) {
                                                      $element.trigger("events.toggleOverlay", { "IsEnabled": false });
                                                      return;
                                                  }

                                                  var $userExportList = $element.find("[" + util_renderAttribute("pluginEditor_userExportAction") + "]");
                                                  var _exportQueue = new CEventQueue();

                                                  $.each($userExportList, function () {

                                                      var $this = $(this);

                                                      _exportQueue.Add(function (onCallback) {

                                                          var $btn = $this.find("[" + util_htmlAttribute("data-user-export-type", "refresh") + "]");

                                                          if ($btn.length == 1) {
                                                              $btn.trigger("click.userExportAction", { "Callback": onCallback });
                                                          }
                                                          else {
                                                              _callback();
                                                          }
                                                      });
                                                  });

                                                  //deep save the editor group data item
                                                  GlobalService.EditorGroupSave({ "_unbox": false, "Item": _editorGroup, "DeepSave": true, "IsRefreshUserExportList": true },
                                                                                global_extEntitySave(function (saveItem) {

                                                                                    _exportQueue.Run({
                                                                                        "Callback": function () {
                                                                                            _saveCallback(true, saveItem);
                                                                                        }
                                                                                    });

                                                                                }, function () {
                                                                                    _fnCallbackError(true);
                                                                                }, _fnCallbackError));                                                  
                                              }
                                          });

                                      });

                }); //end: events.save

                $element.off("events.toggleOverlay");
                $element.on("events.toggleOverlay", function (e, args) {

                    args = util_extend({ "IsEnabled": false, "Message": "Please wait...", "IsHTML": false, "OnClick": null, "IsTransparent": true }, args);

                    var $overlay = $element.children(".OverlayContent");
                    var _hasClickEvent = (args.IsEnabled && args.OnClick && util_isFunction(args.OnClick));

                    if (args.IsEnabled && $overlay.length == 0) {
                        $overlay = $("<div class='OverlayContent'>" +
                                     "  <div class='DisableUserSelectable OverlayDisabled' />" +
                                     "  <div class='DisableUserSelectable FixedMessageLabel' />" +
                                     "</div>");

                        $element.append($overlay);
                    }

                    $element.toggleClass("Overlay", args.IsEnabled)
                            .toggleClass("OverlayTransparent", args.IsTransparent)
                            .toggleClass("Clickable", _hasClickEvent == true);

                    $overlay.toggle(args.IsEnabled);

                    $overlay.off("click.overlay_action");

                    if (_hasClickEvent) {
                        $overlay.on("click.overlay_action", args.OnClick);
                    }

                    if (args.IsEnabled) {

                        args.Message = util_forceString(args.Message);

                        if (!args.IsHTML) {
                            args.Message = util_htmlEncode(args.Message);
                        }

                        $overlay.find(".FixedMessageLabel")
                                .html("<a data-role='button' data-icon='info' data-theme='transparent' data-inline='true' data-iconpos='notext' />" + args.Message)
                                .toggle(args.Message != "")
                                .toggleClass("Clickable", _hasClickEvent)
                                .trigger("create");
                    }

                }); //end: events.toggleOverlay

                $element.off("events.popup");
                $element.on("events.popup", function (e, args) {

                    var $this = $(this);

                    var _popupCallback = function () {

                        if (args.IsEnabled) {

                            var $trigger = $(args.Trigger);

                            if ($trigger.length == 0) {
                                $trigger = $this;
                            }

                            $inlinePopup.data("PopupHideOptions", $trigger.data("PopupHideOptions"));
                        }
                        else {
                            var _popupHideOptions = $inlinePopup.data("PopupHideOptions");

                            if (_popupHideOptions) {
                                if (_popupHideOptions["IsDisableEditMode"]) {

                                    _fnGetLayoutManager().HeaderTabState({ "IsEnabled": true });

                                    $toolbar.find("[data-attr-home-editor-group-toolbar-btn='done']")
                                            .trigger("click");
                                }
                            }

                            $inlinePopup.removeData("PopupHideOptions");
                        }

                        $element.trigger("events.toggleOverlay", { "IsEnabled": false });

                        if (args.Callback) {
                            args.Callback({ "Container": $inlinePopup.find(".InlinePopupContent"), "Controller": args.Controller });
                        }
                    };

                    args = util_extend({
                        "IsEnabled": false, "Title": null, "HTML": null, "ToolbarButtons": null, "Controller": null, "Callback": null, "Trigger": null,
                        "AnimationDuration": "normal"
                    }, args);

                    var _animationDuration = args.AnimationDuration;

                    if (util_isNullOrUndefined(_animationDuration)) {
                        _animationDuration = "normal";
                    }

                    $element.trigger("events.toggleOverlay", { "IsEnabled": args.IsEnabled, "Message": null });

                    if (args.IsEnabled) {

                        //show popup and configure the toolbar view

                        $toolbar.trigger("events.snapshot", { "IsRestore": false, "IsHide": true, "IncludeCustomButtons": true });
                        $inlinePopup.data("scroll-position-top", $(window).scrollTop());

                        $content.addClass("EffectBlur");
                        $filters.addClass("EffectBlur");

                        $content.slideUp(_animationDuration, function () {

                            $filters.show()
                                    .slideUp(_animationDuration, function () {

                                        if (!$inlinePopup.data("is-init")) {
                                            $inlinePopup.data("is-init", true);

                                            $inlinePopup.html("<div class='SubHeaderTitle'>&nbsp;</div>" +
                                                              "<div class='InlinePopupContent' />");
                                        }

                                        $inlinePopup.children(".SubHeaderTitle")
                                                    .text(util_forceString(args.Title));

                                        $inlinePopup.children(".InlinePopupContent")
                                                    .html(util_forceString(args.HTML));

                                        $mobileUtil.refresh($inlinePopup);

                                        var _fn = function () {
                                            _fnGetLayoutManager().ToolbarSetButtons({ "List": args.ToolbarButtons });
                                            _popupCallback();
                                        };

                                        if (util_forceInt(_animationDuration, -1) == 0) {
                                            $inlinePopup.show();
                                            _fn();
                                        }
                                        else {
                                            $inlinePopup.toggle("height", function () {
                                                _fn();
                                            });
                                        }
                                    });

                        });
                    }
                    else {

                        //hide the popup and restore the toolbar view

                        $content.hide();
                        $inlinePopup.show();

                        var $btns = $toolbar.find(".LinkClickable:not(.LinkDisabled)");

                        $btns.addClass("LinkDisabled");

                        $inlinePopup.slideUp(_animationDuration, function () {

                            var _scrollTop = util_forceFloat($inlinePopup.data("scroll-position-top"));

                            $inlinePopup.removeData("scroll-position-top");

                            $filters.removeClass("EffectBlur")
                                    .slideDown(_animationDuration, function () {

                                        $content.removeClass("EffectBlur")
                                                .slideDown(_animationDuration, function () {

                                                    $(window).scrollTop(_scrollTop);

                                                    $btns.removeClass("LinkDisabled");

                                                    $toolbar.trigger("events.snapshot", { "IsRestore": true, "IncludeCustomButtons": true });
                                                    _popupCallback();

                                                });
                                    });
                        });
                    }

                }); //end: events.popup

                $element.off("events.popup_state");
                $element.on("events.popup_state", function (e, args) {

                    if (args) {
                        args["IsVisible"] = $inlinePopup.is(":visible");
                    }

                }); //end: events.popup_state

                $element.off("events.setDataAttributes");
                $element.on("events.setDataAttributes", function (e, args) {

                    args = util_extend({ "PlatformID": enCE.None, "ComponentID": enCE.None, "Callback": null }, args);

                    args.PlatformID = util_forceInt(args.PlatformID, enCE.None);

                    if (util_forceInt(args.ComponentID, enCE.None) == enCE.None) {
                        args.ComponentID = util_forceInt($element.attr("data-home-editor-group-component-id"), enCE.None);
                    }

                    //TODO DOSSIER
                    _instance.GetData({
                        "Type": "EditorGroupByPrimaryKey",
                        "Filters": {
                            "SearchClassificationPlatformID": args.PlatformID, "SearchComponentID": args.ComponentID, "DeepLoad": true, "IsInitNotFound": true
                        }
                    }, function (result) {

                        var _editorGroupItem = (result && result.Success ? result.Data : null);

                        _editorGroupItem = (_editorGroupItem || {});

                        $element.attr({
                            "data-attr-home-editor-group-id": util_forceInt(_editorGroupItem[enColEditorGroupProperty.EditorGroupID], enCE.None),
                            "data-home-editor-group-platform-id": args.PlatformID
                        });

                        $element.data("DataItem", _editorGroupItem);

                        if (args.Callback) {
                            args.Callback();
                        }
                    });

                }); //end: events.setDataAttributes

                $element.off("events.homeview_loadComponentView");
                $element.on("events.homeview_loadComponentView", function (e, args) {

                    args = util_extend({
                        "IsDisableTransition": true,
                        "IsBreadcrumb": true,
                        "ClassificationID": enCE.None,
                        "PlatformID": enCE.None,
                        "ComponentID": enCE.None,
                        "RenderArguments": null
                    }, args);

                    var _breadcrumb = null;

                    if (args.IsBreadcrumb) {

                        var _fnGetID = function (attr) {
                            return util_forceInt($mobileUtil.GetClosestAttributeValue($element, attr), enCE.None);
                        };

                        _breadcrumb = {
                            "ComponentID": _fnGetID("data-home-editor-group-component-id"),
                            "ClassificationID": _fnGetID("data-home-editor-group-classification-id"),
                            "PlatformID": _fnGetID("data-home-editor-group-platform-id")
                        };
                    }

                    if (args.ClassificationID != enCE.None && args.PlatformID != enCE.None && args.ComponentID != enCE.None) {

                        var $homeView = $element.closest(".CEditorHomeView");

                        $homeView.removeData("DataHomeNavComponentBreadcrumb");

                        _instance.GetData({
                            "Type": "ClassificationPlatformList",
                            "Filters": {
                                "ClassificationID": args.ClassificationID,
                                "PlatformID": args.PlatformID,
                                "PageSize": 1,
                                "PageNum": 1
                            }
                        }, function (dataResult) {

                            var _classPlatformList = (dataResult && dataResult.Success ? dataResult.Data : null);

                            _classPlatformList = (_classPlatformList ? _classPlatformList.List : null);
                            _classPlatformList = (_classPlatformList || []);

                            if (_classPlatformList.length == 1) {
                                var _classPlatformItem = _classPlatformList[0];
                                var $temp = $("<div />");

                                $temp.attr({
                                    "data-attr-home-class-platform-comp-item-id": _classPlatformItem[enColClassificationPlatformProperty.ID],
                                    "data-attr-home-class-platform-component-id": args.ComponentID
                                });

                                $element.append($temp);

                                if (args.IsBreadcrumb) {
                                    $homeView.data("DataHomeNavComponentBreadcrumb", _breadcrumb);
                                }

                                $temp.trigger("click.homeview_loadComponent", args);
                            }

                        });

                    }

                }); //end: events.homeview_loadComponentView

                $content.off("blur.homeview_editorContent");
                $content.on("blur.homeview_editorContent", ".ContentEditor [" + util_renderAttribute("editor") + "]", function (e) {
                    var $editor = $(this);
                    var $parent = $editor.closest("[" + util_renderAttribute("pluginEditor_content") + "]");

                    $editor.trigger("events.editor_isModified", {
                        "Callback": function (modified) {
                            $parent.toggleClass("ContentEditorModified", modified);
                        }
                    });
                });

                var $tab = $element.find(".SectionTab[" + util_htmlAttribute("data-attr-home-editor-group-content-id",
                                                                             options.RestoreDefaultView.SectionContentID) + "]");

                if ($tab.length != 1) {
                    $tab = $element.find(".SectionTab[data-attr-home-editor-group-content-id]:first");
                }

                if ($tab.length) {
                    $tab.trigger("click.homeview_loadSectionContent", { "Callback": _callback });
                }
                else {

                    var _component = $content.data("data-component-" + _renderedComponentID);

                    var _fnBindComponentFromOptions = function () {

                        _html = "";

                        var _opts = _instance.Utils.GetDefaultOptions({ "Type": "Component", "StrJSON": _component[enColComponentProperty.OptionJSON] });

                        if (_opts && _opts["UserHomeView"] && _opts.UserHomeView["ControllerInstance"]) {
                            _disableComponentView = false;
                        }

                        if (_disableComponentView) {
                            _html += "<div style='margin: 1em;'>" + util_htmlEncode("The feature is currently not available.") + "</div>";
                            $content.html(_html);
                            _callback();
                        }
                        else {

                            var _tokens = {};

                            _tokens["%%CSS_CLASS%%"] = "DisableUserSelectable LinkClickable SectionTab SectionTabComponentView";
                            _tokens["%%ATTR%%"] = util_htmlAttribute("data-attr-home-editor-group-content-id", enCE.None) + " " +
                                                  util_htmlAttribute("data-attr-home-editor-group-content-state-id", enCEContentState.ReadOnly);
                            _tokens["%%TITLE%%"] = _instance.Utils.ForceEntityDisplayName({ "Type": "Component", "Item": _component });

                            _html += util_replaceTokens(options.HtmlTemplates.SectionTab, _tokens);

                            $element.find(".NavigationHeader")
                                          .html(_html);

                            $element.data("RenderArguments", options.RenderArguments);

                            $tab = $element.find(".SectionTab[data-attr-home-editor-group-content-id]:first");

                            $tab.data("OnLoadTabHTML", function (onCallback) {
                                var _contentHTML = "";

                                _contentHTML += "<div " + util_renderAttribute("pluginEditor_viewController") + " " +
                                                util_htmlAttribute("data-attr-view-controller-instance-type", _opts.UserHomeView.ControllerInstance) +
                                                " />";

                                onCallback(_contentHTML);
                            });

                            _fnInitToolbarButtons(true, null, true);

                            _instance.LoadControllerInstance({
                                "Key": _opts.UserHomeView.ControllerInstance, "URL": _opts.UserHomeView["LazyLoad"],
                                "DisableCache": _opts.UserHomeView["DisableCache"],
                                "Callback": function () {

                                    $tab.trigger("click.homeview_loadSectionContent", { "Callback": _callback });
                                }
                            });
                        }

                    };

                    if (!_component) {

                        _component = util_arrFilter(_instance.Data.ComponentList, enColComponentProperty.ComponentID, _renderedComponentID, true);
                        _component = (_component.length == 1 ? util_extend({}, _component[0], true, true) : null);
                        _component = (_component || {});

                        $content.data("data-component-" + _renderedComponentID, _component);

                        _fnBindComponentFromOptions();
                    }
                    else {
                        _fnBindComponentFromOptions();
                    }
                }
            }
        });

    };  //end: _fn

    var $transition = $(options.TransitionElement);

    if ($transition.length) {
        if (options.IsAnimate) {
            $transition.toggle("height", function () {
                _fn();
            });
        }
        else {
            $transition.hide();
            _fn();
        }
    }
    else {
        _fn();
    }
};

CPluginEditor.prototype.RenderEvents.UserExportView = function (options) {

    options = util_extend({ "PluginElement": null, "Container": null, "Instance": null, "Callback": null, "ButtonCssClass": "" }, options);

    var _extUtils = pluginEditor_getUtils();

    var $container = $(options.Container);
    var _pluginInstance = options.Instance;

    var $pluginContainer = $(options.PluginElement);
    var $vwComponent = $pluginContainer.find(".CEditorComponentHome:first:visible");

    var _callback = function (obj) {

        if (options.Callback) {
            options.Callback({ "Element": obj });
        }
    };

    var $element = $container.children(".CEditorUserExportView");
    var _editorGroup = $vwComponent.data("DataItem");

    if (_editorGroup && util_forceInt(_editorGroup[enColEditorGroupProperty.ClassificationPlatformID], enCE.None) != enCE.None) {

        if ($element.length == 1) {
            $element.empty();
        }
        else {
            $element = $("<div class='EditorDraggableContainer EditorDraggableOn CEditorUserExportView' />");

            $container.append($element);

            $element.off("events.userExport_download");
            $element.on("events.userExport_download", function (e, args) {

                args = util_extend({ "Callback": null }, args);

                var _callback = function () {

                    unblockUI();

                    if (args.Callback) {
                        args.Callback();
                    }
                };

                var _list = ($element.data("DataItem") || []);

                //retrieve the updated list (in case it was rearranged)
                var _exportList = [];

                $.each($element.find(".Item[data-attr-user-export-id]"), function () {
                    var $this = $(this);
                    var _item = $this.data("DataItem");

                    if (!_item) {
                        var _id = util_forceString($this.attr("data-attr-user-export-id"));

                        _item = util_arrFilter(_list, enColCEUserContentExportProperty.UniqueFileName, _id, true);
                        _item = (_item.length == 1 ? _item[0] : null);

                        $this.data("DataItem");
                    }

                    _exportList.push(_item);
                });

                if (_exportList.length == 0) {
                    _callback();
                }
                else {

                    APP.Service.Action({
                        "c": "PluginEditor", "m": "ConstructExtensionExportURL",
                        "args": {
                            "Action": "merge",
                            "Item": util_stringify(_exportList)
                        }
                    }, function (result) {

                        result = (result || {});

                        var _url = util_forceString(result["URL"]);

                        if (_url != "") {

                            var _frameID = "ifmModelExportContainer";
                            var $frame = $mobileUtil.GetElementByID(_frameID);

                            if ($frame.length == 0) {
                                $frame = $("<iframe " + util_htmlAttribute("id", _frameID) + " frameborder='0' scrolling='no' width='0' height='0' " +
                                           "style='display: none;'></iframe>");

                                $mobileUtil.Content().append($frame);
                            }

                            blockUI();

                            $.post(_url, result["Data"]).done(function (data) {

                                try {
                                    data = util_parse(data);
                                } catch (e) {
                                    data = null;
                                }

                                data = util_extend({ "Path": null, "FileName": null }, data);

                                var _downloadURL = util_constructDownloadURL({
                                    "IsProjectRelative": enCETriState.Yes, "FilePath": data.Path, "ExportFileName": util_forceString(result["ExportFileName"])
                                });

                                $frame.attr("src", _downloadURL);
                                _callback();

                            }).fail(function (xhr, status, error) {

                                global_unknownErrorAlert();
                                _callback();
                            });
                        }
                        else {
                            _callback();
                        }
                    });
                }

            }); //end: events.userExport_download

            $element.off("click.userExport_onButtonAction");
            $element.on("click.userExport_onButtonAction", "[data-user-export-button-id]:not(.LinkDisabled)", function () {

                var $btn = $(this);
                var _btnID = $btn.attr("data-user-export-button-id");

                var _callback = function () {
                    $btn.removeClass("LinkDisabled");
                };

                $btn.addClass("LinkDisabled");

                switch (_btnID) {

                    case "remove":

                        var $parent = $btn.closest("[data-attr-user-export-id]");
                        var _id = $parent.attr("data-attr-user-export-id");

                        $parent.removeAttr("data-attr-user-export-id")
                               .addClass("EffectBlur");

                        $parent.toggle("height", function () {

                            $parent.remove();

                            var _userContentList = ($element.data("DataItem") || []);
                            var _item = util_arrFilter(_userContentList, enColCEUserContentExportProperty.UniqueFileName, _id, true);

                            _item = (_item.length == 1 ? _item[0] : null);

                            if ($element.children(".Item[data-attr-user-export-id]:first").length == 0) {
                                $element.html("<div style='margin: 0.5em;'>" + util_htmlEncode(MSG_CONFIG.ListNoRecords) + "</div>");
                            }

                            //remove the item from the user export
                            APP.Service.Action({
                                "c": "PluginEditor", "m": "UserContentExportToggle", "_indicators": false, "args": {
                                    "Item": util_stringify(_item), "IsAdd": false, "IsNoConflict": true
                                }
                            }, function (result) {

                                var $list = $pluginContainer.find("[" + util_renderAttribute("pluginEditor_userExportAction") + "] [data-user-export-type='toggle'].StateOn");
                                var _found = false;

                                $.each($list, function () {

                                    if (!_found) {
                                        var $btnToggle = $(this);
                                        var $parent = $btnToggle.closest("[" + util_renderAttribute("pluginEditor_userExportAction") + "]");

                                        var _result = { "Item": null };

                                        $parent.trigger("events.userExportAction_populateItem", _result);

                                        if (_result.Item) {
                                            var _arr = [enColUserContentExportProperty.ClassificationPlatformID, enColUserContentExportProperty.EditorGroupID,
                                                        enColUserContentExportProperty.ContentID, enColUserContentExportProperty.ValueMessageID,
                                                        enColUserContentExportProperty.StatementID];

                                            var _match = true;

                                            for (var i = 0; i < _arr.length && _match; i++) {
                                                var _prop = _arr[i];

                                                _match = (_result.Item[_prop] == _item[_prop]);
                                            }

                                            if (_match) {

                                                //need to update the toggle
                                                $btnToggle.trigger("click.userExportAction");
                                                _found = true;
                                            }
                                        }
                                    }

                                });

                                if (!_found) {

                                    $pluginContainer.find(".CEditorComponentHome:first:visible")
                                                    .trigger("events.componentHome_onUpdateItemToggle", {
                                                        "Type": "user_content_export", "Item": _item, "IsAdd": false
                                                    });
                                }

                                _callback();
                            });

                        });

                        break;

                    default:
                        _callback();
                        break;
                }

            });

            //init sortable
            _extUtils.Sortable({
                "Containers": $element, "SelectorDraggable": ".Item",
                "DropOptions": {
                    "DataAttributeIdentifier": "data-attr-user-export-id", "PropertyDisplayOrder": enColUserContentExportProperty.DisplayOrder,
                    "PropertyEntityIdentifier": enColCEUserContentExportProperty.UniqueFileName, "IsTextDataAttrIdentifier": true,
                    "GetDataItem": function (id, ctx, callCache) {
                        var _retDataItem = $(ctx).data("DataItem");

                        if (!_retDataItem) {

                            //retrieve from the source data item
                            var _userContentList = ($element.data("DataItem") || []);

                            id = util_forceString(id, "");

                            _retDataItem = util_arrFilter(_userContentList, enColCEUserContentExportProperty.UniqueFileName, id, true);

                            _retDataItem = (_retDataItem.length == 1 ? _retDataItem[0] : null);
                        }

                        return _retDataItem;
                    }
                },
                "OnDrop": function (dropOptions) {

                    dropOptions.IsAppService = true;
                    dropOptions.SaveParams = {
                        "c": "PluginEditor", "m": "UserContentSaveAll",
                        "args": {
                            "Item": util_stringify(dropOptions.SaveList)
                        }
                    };

                    dropOptions.OnSaveSuccess = function (opts) {

                        var _updatedList = (opts.List || []);
                        var _userContentList = $element.data("DataItem");

                        if (!_userContentList) {
                            _userContentList = [];
                            $element.data("DataItem", _userContentList);
                        }

                        for (var i = 0; i < _updatedList.length; i++) {
                            var _item = _updatedList[i];
                            var _id = _item[enColCEUserContentExportProperty.UniqueFileName];

                            var _index = util_arrFilterItemIndex(_userContentList, function (searchItem) {
                                return (searchItem[enColCEUserContentExportProperty.UniqueFileName] == _id);
                            });

                            if (_index >= 0) {
                                _userContentList[_index] = _item;
                            }
                            else {
                                _userContentList.push(_item);
                            }
                        }
                    };
                }
            });
        }

        var _buttonCssClass = util_forceString(options.ButtonCssClass);

        var _fnGetUserExportHTML = function (opts) {

            opts = util_extend({ "Item": null, "NoCache": true }, opts);

            var _userContent = opts.Item;
            var _html = "";
            var _title = "";

            var _thumbnailURL = util_constructDownloadURL({
                "TypeID": "_ExportThumbnail", "NoCache": opts.NoCache,
                "ExtraQS": {
                    "rn": "PluginEditor",
                    "Name": encodeURIComponent(_userContent[enColCEUserContentExportProperty.UniqueFileName])
                }
            });

            if (_userContent[enColCEUserContentExportProperty.IsEditorGroupContent]) {
                _title = _userContent[enColUserContentExportProperty.ContentIDDisplayName];
            }
            else if (_userContent[enColCEUserContentExportProperty.IsValueMessageStatementContent]) {
                _title = _userContent[enColUserContentExportProperty.ValueMessageIDName] + "\n" + _userContent[enColUserContentExportProperty.StatementIDName];
            }

            _html += "<div class='UserContentExportDetail Item' " +
                     util_htmlAttribute("data-attr-user-export-id", _userContent[enColCEUserContentExportProperty.UniqueFileName]) + " " +
                     util_htmlAttribute("title", _title, null, true) + ">" +
                     "  <div class='Header HiddenDragElement'>" +
                     "      <a " + util_htmlAttribute("class", _buttonCssClass) + " data-role='button' data-icon='delete' data-iconpos='right' data-theme='transparent' " +
                     "data-corners='false' data-mini='true' data-user-export-button-id='remove'>" + util_htmlEncode("Remove") + "</a>" +
                     "  </div>" +
                     "  <img class='Thumbnail' alt='Thumbnail' " + util_htmlAttribute("src", _thumbnailURL) + " />" +
                     "</div>";

            return _html;

        };  //end: _fnGetUserExportHTML

        APP.Service.Action({
            "c": "PluginEditor", "m": "UserContentGetByForeignKey",
            "args": {
                "ClassificationPlatformID": _editorGroup[enColEditorGroupProperty.ClassificationPlatformID],
                "ContextParentEditorGroupID": _editorGroup[enColEditorGroupProperty.EditorGroupID],
                "IsRemoveInvalidItems": true
            }
        }, function (data) {

            var _userContents = (data ? data.List : null);

            _userContents = (_userContents || []);

            if (_userContents.length == 0) {
                $element.html("<div style='margin: 0.5em;'>" + util_htmlEncode(MSG_CONFIG.ListNoRecords) + "</div>");
            }
            else {
                var _html = "";

                for (var i = 0; i < _userContents.length; i++) {
                    _html += _fnGetUserExportHTML({ "Item": _userContents[i] });
                }

                $element.html(_html);
                $mobileUtil.refresh($element);
            }

            $element.data("DataItem", _userContents);

            _callback($element);
        });
    }
    else {
        _callback($element);
    }
};

CPluginEditor.prototype.Utils = {

    "ForceEntityDisplayName": function (opts) {
        var _ret = "";

        opts = util_extend({ "Item": null, "Type": null }, opts);

        var _item = opts.Item;

        if (_item) {
            var _displayName = "";
            var _name = "";

            switch (opts.Type) {

                case "Classification":

                    _displayName = _item[enColClassificationProperty.DisplayName];
                    _name = _item[enColClassificationProperty.Name];
                    break;

                case "Platform":

                    _displayName = _item[enColPlatformProperty.DisplayName];
                    _name = _item[enColPlatformProperty.Name];
                    break;

                case "Component":

                    _displayName = _item[enColComponentProperty.DisplayName];
                    _name = _item[enColComponentProperty.Name];
                    break;

                case "ClassificationPlatformComponent":

                    if (util_forceBool(opts["IsComponentName"], true)) {
                        _displayName = _item[enColClassificationPlatformComponentProperty.ComponentDisplayName];
                        _name = _item[enColClassificationPlatformComponentProperty.ComponentIDName];
                    }

                    break;

                case "PlatformDefaultRequestRole":

                    _displayName = _item[enColPlatformDefaultRequestRoleProperty.PlatformDisplayName];
                    _name = _item[enColPlatformDefaultRequestRoleProperty.PlatformIDName];
                    break;

                case "Content":

                    _displayName = _item[enColContentProperty.DisplayName];
                    _name = _item[enColContentProperty.Name];
                    break;
            }

            if (util_forceString(_displayName) != "") {
                _ret = _displayName;
            }
            else {
                _ret = _name;
            }
        }

        return _ret;
    },

    "GetDefaultOptions": function (opts) {
        var _ret = null;

        opts = util_extend({ "Type": null, "StrJSON": null }, opts);

        var _str = util_forceString(opts.StrJSON);
        var _temp = null;
        var _default = {};

        if (_str != "") {
            _temp = util_parse(_str);
        }

        switch (opts.Type) {

            case "Classification":

                _default = {
                    "UserRoles": { "DisableMultipleRoles": false, "ControllerInstance": null },
                    "UserHomeView": { "IsDisabled": false, "IsUnmanaged": false, "ClassificationClickJS": null },
                    "Notifications": { "IsAutoSelectPlatform": false }
                };

                break;

            case "Platform":

                _default = {
                    "UserHomeView": { "IsUnmanaged": false }
                };

                break;

            case "Component":

                _default = {
                    "UserHomeView": { "ControllerInstance": null, "LazyLoad": null }
                };

                break;
        }

        _ret = util_extend(_default, _temp);

        return _ret;
    },

    "ToggleInlineConfirmation": function (options) {
        util_inlineConfirm(options);
    },

    "Popup": function (options) {
        var _popupOptions = util_extend({
            "HeaderTitle": "", "IsPositionOnOpen": true, "HTML": "", "OnOpen": null, "OnClose": null, "OnBeforeShow": null, "GetContent": null,
            "PopupCssClass": "", "IsDismissClickOverlay": true, "PopupSize": null, "DisablePosition": true,
            "IsRefreshControllerOnDismiss": false
        }, options);

        //(optional) controller parameter
        var _controller = (options && options["Controller"] ? options.Controller : null);

        _popupOptions.PopupCssClass = "EditorPopup" + (util_forceString(_popupOptions.PopupCssClass) != "" ? " " + _popupOptions.PopupCssClass : "");

        switch (_popupOptions.PopupSize) {

            case "small":
                _popupOptions.PopupCssClass += " EditorPopupSizeSmall";
                break;

            case "medium":
                _popupOptions.PopupCssClass += " EditorPopupSizeMedium";
                break;

            case "large":
                _popupOptions.PopupCssClass += " EditorPopupSizeLarge";
                break;
        }

        _popupOptions["callbackOpen"] = function () {

            var $popupContainer = $mobileUtil.PopupContentContainer();
            var $content = $popupContainer.find(".PopupContent");
            
            if (options.GetContent) {
                options.GetContent(function (contentHTML) {

                    contentHTML = util_forceString(contentHTML);

                    var $loading = $content.find(".EditorPopupLoadIndicator");

                    $popupContainer.trigger("events.popup_toggleIndicator", { "IsEnabled": false });

                    if (contentHTML != "") {
                        var $temp = $("<div>" + contentHTML + "</div>");

                        if ($loading.length == 0) {
                            $content.empty();
                        }

                        $temp.hide();
                        $content.append($temp);

                        $mobileUtil.refresh($content);

                        if ($loading.length == 0) {
                            $temp.slideDown("normal", function () {
                                if (_popupOptions.OnOpen) {
                                    _popupOptions.OnOpen();
                                }
                            });
                        }
                        else {

                            $loading.fadeOut("normal", function () {
                                $loading.remove();

                                $temp.slideDown("normal", function () {
                                    if (_popupOptions.OnOpen) {
                                        _popupOptions.OnOpen();
                                    }
                                });
                            });
                        }
                    }
                    else {
                        $loading.remove();

                        if (_popupOptions.OnOpen) {
                            _popupOptions.OnOpen();
                        }
                    }

                });
            }
            else if (_popupOptions.OnOpen) {
                $popupContainer.trigger("events.popup_toggleIndicator", { "IsEnabled": false });
                _popupOptions.OnOpen();
            }
        };

        _popupOptions["callbackClose"] = function () {

            if (_popupOptions.IsRefreshControllerOnDismiss && _controller && _controller["Utils"] && _controller.Utils["Actions"] &&
                _controller.Utils.Actions["Refresh"]) {
                _controller.Utils.Actions.Refresh({ "Controller": _controller, "LayoutManager": options["LayoutManager"], "Callback": _popupOptions.OnClose });
            }
            else if (_popupOptions.OnClose) {
                _popupOptions.OnClose();
            }
        };

        if (options.GetContent && util_forceString(_popupOptions.HTML) == "") {
            _popupOptions.HTML = "<div class='EditorPopupLoadIndicator'></div>";
        }

        _popupOptions["HasIndicators"] = true;
        _popupOptions["IndicatorAttributes"] = {
            "data-attr-view-indicator-is-default-on": enCETriState.Yes
        };

        _popupOptions["blankContent"] = _popupOptions.HTML;

        $mobileUtil.PopupOpen(_popupOptions);

    }   //end: Popup
};

//SECTION START: project specific support

CPluginEditor.prototype.ProjectOnInitializeNotificationControls = function (options) {
    options = util_extend({ "List": null });    //where List is an array of jQuery objects for renderers of "pluginEditor_notifications"
};

CPluginEditor.prototype.ProjectOnMergeComponentPermissions = function (options) {

};

//SECTION END: project specific support

var CListBoxUserControlBase = function (options) {

    options = util_extend({
        "Controller": null, "Field": null, "FieldOptions": null, "IsReadOnly": false, "Item": null, "Target": null, "Value": null
    }, options);

    var _instance = this;
    var _controller = options.Controller;
    var _isReadOnly = options.IsReadOnly;
    var $element = $(options.Target);
    var _item = options.Item;
    var _value = (options.Value || []);

    var _html = "";
    var LABEL_REMOVE = "Remove";

    //cleanup any legacy data values
    $element.removeData("PopupSearchSourceSelections")
            .removeData("PopupExternalAddNewList")
            .removeData("SourceValue");

    $element.data("SourceValue", _value);   //persist the source list of values (used for populate)

    _instance["DOM"] = {
        "Element": $element
    };

    _instance["Data"] = {
        "DATA_KEY_SCROLL_TOP": "restore-scroll-top-popup-listbox-base",
        "MiscellaneousClassificationID": util_forceInt("%%TOK|ROUTE|PluginEditor|MiscellaneousClassificationID%%", enCE.None),
        "MiscellaneousPlatformID": util_forceInt("%%TOK|ROUTE|PluginEditor|MiscellaneousPlatformID%%", enCE.None),
        "KOL_ManagerComponentID": util_forceInt("%%TOK|ROUTE|PluginEditor|KOL_ManagerComponentID%%", enCE.None),
        "RepositoryComponentLibraryID": util_forceInt("%%TOK|ROUTE|PluginEditor|RepositoryComponentLibraryID%%", enCE.None)
    };

    var _fieldItem = options.Field;
    var _renderList = util_extend({

        "ControlCssClass": null,

        "IsModePopup": false,
        "IsMultiple": true,

        "HasDetailsView": false,
        "TemplateDetailID": null,   //supported values are: kol

        "Data": [],
        "PropertyText": "Text",
        "PropertyValue": "Value",

        "InstanceType": null,
        "PropertyBridgeID": null,
        "PropertyBridgeIDName": null,
        "PropertyBridgeIsEnabled": null,    //bridge item property for whether the item is selected (support for persist item values regardless of seleection)

        "LabelDelimiter": ", ",

        "MergeDataControllers": [],  //property names to merge for the controller instances (on the "Data" property member)

        "GetRestrictedListID": null, //if specified, selectable entries are enabled only for the list of IDs returned; format: function (opts) { ... }
        "HasAdminControls": function (opts) {
            return true;
        },
        "MessageUnauthorizedAccess": "You are not authorized to access this item.",

        //used to determine which item from the list of values are to be shown as selected
        //(e.g. support for not showing selected list item based on "IsEnabled"/"IsActive" item property for example)
        "IsShowItemSelection": null, //function (opts) { return true; } where opts: { "Item" } 

        "RenderUnspecifiedOption": {
            "IsEnabled": false,
            "Label": "Other / Unclassified",
            "PropertyValue": null,
            "IsActive": function () {
                return (this.IsEnabled == true && util_forceString(this.PropertyValue) != "");
            },
            "CanRender": function () {
                return (this.IsActive() && this.CanAdmin());
            },
            "CanAdmin": function () {
                return false;
            },
            "OnToggleValue": function (opts) {

                var $this = $(this);

                opts = util_extend({  "Trigger": null, "Selected": null, "Callback": null }, opts);

                if (opts.Callback) {
                    opts.Callback();
                }
            }
        }

    }, _fieldItem["_renderList"], true, true);

    var _renderUnspecifiedOption = _renderList.RenderUnspecifiedOption;

    var _isPopupMode = util_forceBool(_renderList.IsModePopup, false);
    var _isMultiple = util_forceBool(_renderList.IsMultiple, true);
    var _hasDetailsView = util_forceBool(_renderList.HasDetailsView, false);
    var _fnIsShowItemSelection = _renderList.IsShowItemSelection;

    //filter the current values to reflect only the items that should be rendered/selected
    if (_fnIsShowItemSelection) {
        _value = util_arrFilterSubset(_value, function (search) {
            return _fnIsShowItemSelection.call(_instance, { "Item": search });
        });
    }

    if (util_forceString(_renderList.PropertyBridgeIsEnabled) != "") {
        _value = util_arrFilterSubset(_value, function (search) {
            var _valid = util_propertyValue(search, _renderList.PropertyBridgeIsEnabled);

            return util_forceBool(_valid, false);
        });
    }

    _renderList.IsMultiple = _isMultiple;

    _renderList.Data = (_renderList.Data || []);

    if (_renderList.InstanceType && typeof _renderList.InstanceType === "string") {
        _renderList.InstanceType = eval(_renderList.InstanceType);
    }

    if (_controller && _renderList.MergeDataControllers && _renderList.MergeDataControllers.length > 0) {
        for (var p = 0; p < _renderList.MergeDataControllers.length; p++) {
            var _propName = _renderList.MergeDataControllers[p];
            var _propPath = "Data." + _propName;
            var _dataController = util_propertyValue(_controller, _propPath);

            if (_dataController) {
                util_propertySetValue(_instance, _propPath, _dataController);
            }
        }
    }

    if (_isReadOnly && !_isPopupMode) {

        var _propBridgeIDName = _renderList.PropertyBridgeIDName;

        if (util_forceString(_propBridgeIDName) == "") {
            _propBridgeIDName = _renderList.PropertyText;
        }

        if (util_forceString(_propBridgeIDName) == "") {
            _html += "<div style='color: #FF0000;'>" + util_htmlEncode("CListBoxUserControlBase :: invalid property for render list options") + "</div>";
        }
        else {

            var _delimiter = util_htmlEncode(_renderList.LabelDelimiter);

            //check if the unspecified option is supported and current value from data item
            var _hasUnspecifiedOption = _renderUnspecifiedOption.IsActive();
            var _isUnspecified = false;

            if (_hasUnspecifiedOption) {
                _isUnspecified = util_propertyValue(_item, _renderUnspecifiedOption.PropertyValue);

                _isUnspecified = util_forceBool(_isUnspecified, false);
            }

            if (_isUnspecified) {
                _html += util_htmlEncode(_renderUnspecifiedOption.Label);
            }
            else {

                for (var i = 0; i < _value.length; i++) {
                    var _listItem = _value[i];
                    var _val = util_propertyValue(_listItem, _propBridgeIDName);

                    _html += (i > 0 ? _delimiter : "") + util_htmlEncode(_val);
                }
            }
        }
    }
    else if (!_isPopupMode) {
        var _arrRestrictedID = null;

        if (_renderList.GetRestrictedListID) {
            _arrRestrictedID = _renderList.GetRestrictedListID({ "Value": _value, "Item": _item });
        }

        var _hasUnspecifiedOption = _renderUnspecifiedOption.CanRender();   //as we are in edit mode, whether user can administrator unspecified option
        var _isUnspecified = false;

        if (_hasUnspecifiedOption) {
            _isUnspecified = util_propertyValue(_item, _renderUnspecifiedOption.PropertyValue);

            _isUnspecified = util_forceBool(_isUnspecified, false);
        }

        var _fnLineItemHTML = function (id, label, selected, enabled, isLineItemUnspecified) {

            var _ret = "";

            selected = util_forceBool(selected, false);
            enabled = util_forceBool(enabled, true);
            isLineItemUnspecified = util_forceBool(isLineItemUnspecified, false);

            _ret += "<div class='DisableUserSelectable EntityLineItem" + (isLineItemUnspecified ? " OptionUnspecifiedLineItem" : "") +
                    (selected ? " Selected" : "") + (!enabled ? " LinkDisabled" : "") +
                    (!isLineItemUnspecified && enabled && _hasUnspecifiedOption && _isUnspecified ? " LinkNotAllowed" : "") + "'" +
                    (isLineItemUnspecified ? "" : " " + util_htmlAttribute("data-list-item-value", id)) + ">";

            _ret += "  <div class='EditorImageButton ImageToggleSelection" + (selected ? " StateOn" : "") + "'>" +
                    "      <div class='ImageIcon' />" +
                    "  </div>";

            _ret += "  <div class='Label'>" + util_htmlEncode(label) + "</div>";

            if (!isLineItemUnspecified && !enabled) {
                _ret += "<div class='ViewUnauthorizedAccess'>" +
                        "<i class='material-icons'>error_outline</i>" +
                        "<div class='Label'>" + "<span>" + util_htmlEncode(_renderList.MessageUnauthorizedAccess) + "</span>" + "</div>" +
                        "</div>";
            }

            _ret += "</div>";

            return _ret;

        };  //end: _fnLineItemHTML

        for (var i = 0; i < _renderList.Data.length; i++) {
            var _listItem = _renderList.Data[i];
            var _id = util_propertyValue(_listItem, _renderList.PropertyValue);
            var _label = util_propertyValue(_listItem, _renderList.PropertyText);

            var _selected = (util_arrFilter(_value, _renderList.PropertyBridgeID, _id, true).length == 1);
            var _enabled = true;

            if (_arrRestrictedID != null) {
                _enabled = (util_arrFilter(_arrRestrictedID, null, _id, true).length == 1);
            }

            _html += _fnLineItemHTML(_id, _label, _selected, _enabled);
        }

        if (_hasUnspecifiedOption) {
            _html += _fnLineItemHTML(enCE.None, _renderUnspecifiedOption.Label, _isUnspecified, true, true);
        }
    }
    else {

        _renderList = util_extend({
            "DetailFieldList": [],
            "DefaultNoRecordsMessage": null
        }, _renderList);

        var _detailFields = (_renderList.DetailFieldList || []);

        for (var f = 0; f < _detailFields.length; f++) {
            var _field = _detailFields[f];

            _detailFields[f] = util_extend({ "Icon": "chevron_right", "PropertyPath": null, "LinkStyle": null, "Heading": null, "IsOptional": false }, _field);
        }

        var _cacheFunctionLookup = {};
        var _hasAdminControls = (!_isReadOnly && _renderList.HasAdminControls ? _renderList.HasAdminControls({ "Item": _item, "Value": _value }) : null);

        _hasAdminControls = util_forceBool(_hasAdminControls, !_isReadOnly);

        var _fnGetItemHTML = function (item) {
            var _ret = "";
            var _itemID = util_propertyValue(item, _renderList.PropertyBridgeID);

            _ret += "<div class='" + (!_isReadOnly ? "DisableUserSelectable " : "") +
                    "PluginEditorCardView CardModeInline EntityLineItem" + (_hasDetailsView ? " LinkClickable" : "") + "' " +
                    util_htmlAttribute("data-list-item-value", _itemID) +
                    (_hasDetailsView ? " " + util_htmlAttribute("data-attr-user-control-button-id", "view_details") : "") + ">";

            if (!_isReadOnly && _hasAdminControls) {
                _ret += "<div class='Header'>" +
                        _instance.Utils.HTML.GetButton({
                            "Attributes": {
                                "data-icon": "delete",
                                "data-iconpos": "notext",
                                "data-attr-user-control-button-id": "remove_list_item",
                                "title": "Delete"
                            }
                        }) +                        
                        "</div>";
            }

            for (var f = 0; f < _detailFields.length; f++) {
                var _field = _detailFields[f];
                var _contentHTML = "";
                var _val = util_forceString(util_propertyValue(item, _field.PropertyPath));
                var _hasValue = true;

                if (_field["Heading"]) {
                    _contentHTML += "<span class='Label Heading'>" + util_htmlEncode(_field.Heading) + "</span>";
                }

                if (_val === "") {
                    _contentHTML += "&nbsp;";
                    _hasValue = false;
                }
                else if (_field["LinkStyle"] == "email") {
                    _contentHTML += "<a class='LinkExternal' data-rel='external' data-role='none' " + util_htmlAttribute("href", "mailto:" + _val) + ">" +
                                    util_htmlEncode(_val) +
                                    "</a>";
                }
                else {
                    _contentHTML += util_htmlEncode(_val);
                }

                var _isOptional = (_field["IsOptional"] == true);

                if (!_isOptional || (_isOptional && _hasValue)) {
                    var _renderIcon = {
                        "CssClass": "Icon",
                        "HTML": ""
                    };

                    switch (_field["Template"]) {

                        case "kol_profile":

                            var _key = "kol_profile_ConstructBackgroundURL";
                            var _fnConstructBackgroundURL = _cacheFunctionLookup[_key];

                            if (!_fnConstructBackgroundURL) {
                                _fnConstructBackgroundURL = util_propertyValue(_instance, "Data.KeyOpinionLeaderController.Utils.ConstructKeyOpinionLeaderProfileURL");

                                if (!_fnConstructBackgroundURL) {
                                    _fnConstructBackgroundURL = function () {
                                        return "image_err.png";
                                    };
                                }

                                _cacheFunctionLookup[_key] = _fnConstructBackgroundURL;
                            }

                            _renderIcon.HTML += "<div class='EditorImageButton ImageUserProfile'>" +
                                                "    <div class='ImageIcon' " +
                                                util_htmlAttribute("style",
                                                                   "background-image: url('" + _fnConstructBackgroundURL({ "ID": _itemID }) + "')") +
                                                "    />" +
                                                "</div>";

                            break;  //end: kol_profile

                        default:
                            _renderIcon.HTML += "<i class='material-icons'>" + _field.Icon + "</i>";
                            break;
                    }

                    _ret += "<div class='ViewDetailField" + (_isOptional ? " StateOptionalField" : "") + "'>" +
                            "   <div " + util_htmlAttribute("class", _renderIcon.CssClass) + ">" + _renderIcon.HTML + "</div>" +
                            "   <div class='Label WordBreak'>" +
                            "       <div>" + _contentHTML + "</div>" +
                            "   </div>" +
                            "</div>";
                }
            }

            _ret += "</div>";

            return _ret;

        };  //end: _fnGetItemHTML

        _instance["Utils"] = pluginEditor_getUtils();

        if (!_isReadOnly && _hasAdminControls) {
            _html += "<div class='Header'>" +
                     _instance.Utils.HTML.GetButton({
                         "Content": "Edit",
                         "Attributes": {
                             "data-icon": "search",
                             "data-attr-user-control-button-id": "search_popup"
                         }
                     }) +
                     _controller.Utils.HTML.GetButton({
                         "Content": LABEL_REMOVE, "Attributes": {
                             "data-attr-user-control-button-id": "clear_items",
                             "data-icon": "delete",
                             "style": "display: none;"  //default hidden
                         }
                     }) +
                     "</div>";
        }

        _html += "<div class='Content'>";   //open content tag

        for (var i = 0; i < _value.length; i++) {
            _html += _fnGetItemHTML(_value[i]);
        }

        _html += "</div>";  //close content tag

        var _noRecordsLabel = _renderList["DefaultNoRecordsMessage"];

        if (util_forceString(_noRecordsLabel) == "") {
            _noRecordsLabel = MSG_CONFIG.ListNoRecords;
        }

        _html += "<div class='EditorViewNoRecords'>" +
                 "  <div class='EditorNoRecordsLabel'>" + util_htmlEncode(_noRecordsLabel) + "</div>" +
                 "</div>";

        _instance.Data["GetPopupItemHTML"] = _fnGetItemHTML;
    }

    _instance["State"] = {
        "RenderList": _renderList
    };

    $element.off("events.userControl_getValue");
    $element.on("events.userControl_getValue", function (e, args) {

        var _value = [];

        if (!args) {
            args = {};
        }

        var _extProperties = args["ExtPropertyValues"];

        if (!_extProperties) {
            _extProperties = {};
            args["ExtPropertyValues"] = _extProperties;
        }

        var _isRequired = (util_forceInt($element.attr("data-attr-input-is-required"), enCETriState.No) == enCETriState.Yes);

        var _hasUnspecifiedOption = _renderUnspecifiedOption.CanRender();
        var _isUnspecified = false;

        if (_hasUnspecifiedOption) {
            var $item = $element.children(".EntityLineItem.OptionUnspecifiedLineItem:first");

            _isUnspecified = $item.hasClass("Selected");

            //if the unspecified option is selected, then the field is no longer required (optional state)
            if (_isUnspecified) {
                _isRequired = false;
            }

            _extProperties[_renderUnspecifiedOption.PropertyValue] = _isUnspecified;
        }

        //list values are populated only if the unspecified option is not applicable (otherwise all values are cleared)
        if (!_hasUnspecifiedOption || !_isUnspecified) {
            var _srcList = ($element.data("SourceValue") || []);
            var $list = null;

            if (util_forceString(args["SearchFallbackDataKey"]) != "") {

                //create a new array with the contents of the source list and fallback list (important not to append to the actual source value list)
                _srcList = $.merge([], _srcList);

                //merge the source list with an extended temp fallback list
                $.merge(_srcList, $element.data(args.SearchFallbackDataKey) || []);
            }

            if (args["FilteredList"]) {

                //check if a custom filtered list is provided to get restricted values
                $list = $(args.FilteredList);
            }
            else if (!_isPopupMode) {
                $list = $element.children(".EntityLineItem.Selected[data-list-item-value]");
            }
            else {
                $list = $element.find(".Content:first > .EntityLineItem[data-list-item-value]");
            }

            var _addNewItemList = (_isPopupMode ? $element.data("PopupExternalAddNewList") : null);

            _addNewItemList = (_addNewItemList || []);

            $.each($list, function (index) {
                var $this = $(this);
                var _id = util_forceInt($this.attr("data-list-item-value"), enCE.None);
                var _item = util_arrFilter(_srcList, _renderList.PropertyBridgeID, _id, true);

                if (_item.length == 1) {
                    _item = _item[0];
                }
                else {
                    if (_renderList.InstanceType) {
                        _item = new _renderList.InstanceType();
                    }
                    else {
                        _item = {};
                    }
                }

                util_propertySetValue(_item, _renderList.PropertyBridgeID, _id);

                if (_renderList.PropertyBridgeIDName) {

                    if (_isPopupMode) {
                        var _search = util_arrFilter(_addNewItemList, _renderList.PropertyBridgeID, _id, true);

                        if (_search.length == 1) {
                            _search = _search[0];

                            var _label = util_propertyValue(_search, _renderList.PropertyBridgeIDName);

                            util_propertySetValue(_item, _renderList.PropertyBridgeIDName, _label);
                        }
                    }
                    else {
                        var _dataListItem = util_arrFilter(_renderList.Data, _renderList.PropertyValue, _id, true);

                        if (_dataListItem.length == 1) {

                            _dataListItem = _dataListItem[0];

                            var _label = util_propertyValue(_dataListItem, _renderList.PropertyText);

                            util_propertySetValue(_item, _renderList.PropertyBridgeIDName, _label);
                        }
                    }
                }

                _value.push(_item);

            });
        }

        args["ItemValue"] = _value;

        if (_isRequired && _value.length == 0) {
            args["HasValidValue"] = false;
        }

        //check if bridge items from source which are not selected should be persisted (i.e. enabled toggle property)
        if (util_forceString(_renderList.PropertyBridgeIsEnabled) != "") {

            var _unselectedItems = util_arrFilterSubset(_srcList, function (search) {
                var _valid = util_arrFilter(_value, _renderList.PropertyBridgeID, search[_renderList.PropertyBridgeID], true);

                _valid = (_valid.length == 0);

                return _valid;
            });

            for (var i = 0; i < _unselectedItems.length; i++) {
                var _bridgeItem = _unselectedItems[i];

                //set flag that the bridge item is unselected
                util_propertySetValue(_bridgeItem, _renderList.PropertyBridgeIsEnabled, false);
            }

            //update all selected items with the selected state
            for (var i = 0; i < _value.length; i++) {
                var _bridgeItem = _value[i];

                util_propertySetValue(_bridgeItem, _renderList.PropertyBridgeIsEnabled, true);
            }

            //append the unselected items from the source list to the result
            $.merge(_value, _unselectedItems);
        }

    }); //end: events.userControl_getValue

    $element.addClass("CEditorListBoxControl")
            .toggleClass("StateReadOnlyOn", _isReadOnly)
            .toggleClass("StateIsPopupMode", _isPopupMode);

    $element.off("click.onListControlToggle");
    $element.on("click.onListControlToggle", ".EntityLineItem:not(.LinkDisabled):not(.LinkNotAllowed)", function (e, args) {
        var $this = $(this);

        args = util_extend({ "IsForceClearSelection": false }, args);

        if (args.IsForceClearSelection) {
            $this.removeClass("Selected");
        }
        else {
            $this.toggleClass("Selected");
        }

        var _selected = $this.hasClass("Selected");

        $this.children(".ImageToggleSelection:first").toggleClass("StateOn", _selected);
    });

    $element.off("click.onListControlToggleUnspecifiedOption");

    if (!_isPopupMode && _renderUnspecifiedOption.CanRender()) {

        $element.on("click.onListControlToggleUnspecifiedOption", ".EntityLineItem.OptionUnspecifiedLineItem:not(.LinkDisabled):not(.LinkNotAllowed)", function () {
            var $this = $(this);
            var _selected = $this.hasClass("Selected");

            var _onCallback = function () {
                $this.removeClass("LinkNotAllowed");
            };

            $this.addClass("LinkNotAllowed");

            var $list = $element.children(".EntityLineItem[data-list-item-value]:not(.LinkDisabled)");

            $list.trigger("click.onListControlToggle", { "IsForceClearSelection": true });

            $list.toggleClass("LinkNotAllowed", _selected);

            if (_renderUnspecifiedOption.OnToggleValue) {
                _renderUnspecifiedOption.OnToggleValue.call($element, { "Trigger": $this, "Selected": _selected, "Callback": _onCallback });
            }
            else {
                _onCallback();
            }

        }); //end: click.onListControlToggleUnspecifiedOption
    }

    $element.html(_html);
    $mobileUtil.refresh($element);

    if (util_forceString(_renderList.ControlCssClass) != "") {
        $element.addClass(_renderList.ControlCssClass);
    }

    if (_isPopupMode) {

        var PREFIX_NAMESPACE = "uc_listbox_base_";
        var EVENT_NAMES = {
            "RefreshNoRecordsState": "events." + PREFIX_NAMESPACE + "refreshNoRecordState",
            "OnButtonAction": "click." + PREFIX_NAMESPACE + "onButtonAction",

            //appends a parent/lookup data item to current list of selections (converts to bridge item and performs validation to avoid duplicates)
            "OnAppendEntry": "events." + PREFIX_NAMESPACE + "onAppendEntry"
        };

        var $vwListView = $element.children(".Content:first");
        var $clClearAll = $element.find("[" + util_htmlAttribute("data-attr-user-control-button-id", "clear_items") + "]");

        $element.off(EVENT_NAMES.OnButtonAction);
        $element.on(EVENT_NAMES.OnButtonAction, "[data-attr-user-control-button-id]:not(.LinkDisabled)", function (e, args) {

            args = util_extend({ "Callback": null }, args);

            var _onClickCallback = function () {

                $this.removeClass("LinkDisabled");

                if (args.Callback) {
                    args.Callback();
                }

            };  //end: _onClickCallback

            var $this = $(this);
            var _buttonID = util_forceString($this.attr("data-attr-user-control-button-id"));

            $this.addClass("LinkDisabled");

            switch (_buttonID) {

                case "search_popup":

                    var _value = {
                        "SearchFallbackDataKey": "PopupSearchSourceSelections"
                    };

                    $element.trigger("events.userControl_getValue", _value);

                    _instance.OnSearchPopupView({
                        "Callback": _onClickCallback, "ListSelections": _value.ItemValue,
                        "OnDismissCallback": function (result) {

                            result = util_extend({ "List": null }, result);

                            var _fn = _instance.Data.GetPopupItemHTML;
                            var _updateHTML = "";

                            result.List = (result.List || []);

                            for (var i = 0; i < result.List.length; i++) {
                                _updateHTML += _fn(result.List[i]);
                            }

                            $vwListView.html(_updateHTML);
                            $mobileUtil.refresh($vwListView);

                            //persist the selections from the popup search to the element (required for future searches)
                            $element.data(_value.SearchFallbackDataKey, result.List);

                            $element.trigger(_instance.Data.EVENT_NAMES.RefreshNoRecordsState);
                        }
                    });

                    break;  //end: search_popup

                case "remove_list_item":

                    dialog_confirmYesNo("Remove", "Are you sure you want to remove the selected item?", function () {

                        var $item = $this.closest("[data-list-item-value]");

                        $item.removeAttr("data-list-item-value");

                        $item.addClass("EffectGrayscale")
                             .toggle("height", function () {
                                 $item.remove();

                                 $element.trigger(_instance.Data.EVENT_NAMES.RefreshNoRecordsState);
                                 _onClickCallback();
                             });

                    }, _onClickCallback);

                    break;  //end: remove_list_item

                case "clear_items":

                    dialog_confirmYesNo("Remove", "Are you sure you want to remove " + (_isMultiple ? "all items" : "the item") + "?", function () {

                        $vwListView.empty();
                        $element.trigger(EVENT_NAMES.RefreshNoRecordsState);
                        _onClickCallback();

                    }, _onClickCallback);

                    break;  //end: clear_items

                case "view_details":

                    var _parentButtonID = $mobileUtil.GetClosestAttributeValue(e.target, "data-attr-user-control-button-id");

                    if (_parentButtonID == _buttonID) {
                        var $item = $this.closest("[data-list-item-value]");
                        var _value = {
                            "SearchFallbackDataKey": "PopupSearchSourceSelections",
                            "FilteredList": $item
                        };

                        $element.trigger("events.userControl_getValue", _value);

                        if (_value.ItemValue.length == 1) {
                            _instance.OnViewItemDetail({ "Item": _value.ItemValue[0], "Element": $item, "Callback": _onClickCallback });
                        }
                        else {
                            _onClickCallback();
                        }
                    }
                    else {
                        _onClickCallback();
                    }

                    break;  //end: view_details

                default:
                    _onClickCallback();
                    break;
            }

        }); //end: OnButtonAction

        $element.off(EVENT_NAMES.OnAppendEntry);
        $element.on(EVENT_NAMES.OnAppendEntry, function (e, args) {

            args = util_extend({ "Item": null, "From": null, "Callback": null }, args);

            var _item = args.Item;
            var _from = util_forceString(args.From);
            var _callback = function () {
                if (args.Callback) {
                    args.Callback();
                }
            };

            var _bridgeItem = _instance.ConvertSourceEntryToBridgeItem({ "ParentDataItem": _item, "From": _from });

            if (_bridgeItem) {

                var _valid = true;

                //check if the item is valid (i.e. has proper bridge ID and also not a duplicate of current selections)
                var _itemID = util_forceInt(util_propertyValue(_bridgeItem, _renderList.PropertyBridgeID), enCE.None);

                _valid = (_valid && (_itemID != enCE.None));

                if (_valid) {
                    var $search = $vwListView.find(".EntityLineItem[" + util_htmlAttribute("data-list-item-value", _itemID) + "]:first");

                    _valid = ($search.length == 0);
                }

                if (_valid) {

                    //append the new entry and refresh the list view

                    var _listAddNewItemCache = _instance.DOM.Element.data("PopupExternalAddNewList");

                    if (!_listAddNewItemCache) {
                        _listAddNewItemCache = [];
                        _instance.DOM.Element.data("PopupExternalAddNewList", _listAddNewItemCache);
                    }

                    _listAddNewItemCache.push(_bridgeItem);

                    var _fn = _instance.Data.GetPopupItemHTML;
                    var $item = $(_fn(_bridgeItem));

                    $item.hide();

                    $vwListView.append($item);
                    $mobileUtil.refresh($item);

                    var _arr = $element.data("PopupSearchSourceSelections");

                    if (!_arr) {
                        _arr = [];
                        $element.data("PopupSearchSourceSelections", _arr);
                    }

                    var _index = util_arrFilterItemIndex(_arr, function (search) {
                        return (util_propertyValue(search, _renderList.PropertyBridgeID) == _itemID);
                    });

                    if (_index < 0) {
                        _arr.push(_bridgeItem);
                    }
                    else {
                        _arr[_index] = _bridgeItem;
                    }

                    $item.toggle("height", function () {
                        $item.addClass("HighlightOn");

                        setTimeout(function () {
                            $item.removeClass("HighlightOn");
                        }, 1200);
                    });

                    $element.trigger(_instance.Data.EVENT_NAMES.RefreshNoRecordsState);
                }
            }

            _callback();

        }); //end: OnAppendEntry

        $element.off(EVENT_NAMES.RefreshNoRecordsState);
        $element.on(EVENT_NAMES.RefreshNoRecordsState, function () {
            var $search = $vwListView.children(".EntityLineItem");
            var _count = $search.length;

            if (_isMultiple) {
                $mobileUtil.ButtonSetTextByElement($clClearAll, LABEL_REMOVE + " (" + util_formatNumber(_count) + ")");
            }

            $clClearAll.toggle(_count > 0);
            $element.toggleClass("ModeNoRecords", (_count == 0));

        }); //end: RefreshNoRecordsState

        _instance.Data["EVENT_NAMES"] = EVENT_NAMES;

        //refresh the default no records state for the list view
        $element.trigger(_instance.Data.EVENT_NAMES.RefreshNoRecordsState);
    }
};

CListBoxUserControlBase.prototype.OnSearchPopupView = function (options) {

    var _instance = this;

    options = util_extend({ "ListSelections": null, "OnDismissCallback": null, "Callback": null }, options);

    var _html = "";
    var _popupRenderOptions = util_extend({

        "EntityMetadataParam": null,    //required

        "HasSearch": true,
        "Title": "Search",

        "IsEnableAddAction": false,
        "NoRecordsMessageAddNew": "There are no records found matching the search criteria. Would you like to add a new entry?",

        "PropertyDataIdentifier": "",   //required
        "MethodName": null, //required
        "PageSize": 15,

        "SortEnum": "", //required
        "LookupPropertyPathUpdates": null,

        "RepeaterSortID": null

    }, util_propertyValue(_instance, "State.RenderList.PopupRenderOptions"));

    var _renderList = _instance.State.RenderList;

    var _canSearch = util_forceBool(_popupRenderOptions.HasSearch, true);
    var $parent = $(_instance.DOM.Element);

    var _fnGetListRenderFields = function (onCallback) {

        var _fields = $parent.data("ListViewFields");

        if (!_fields) {

            GlobalService.HasIndicators = false;
            GlobalService.EntityMetadata(MODULE_MANAGER.Current.ModuleID, _popupRenderOptions.EntityMetadataParam, ext_requestSuccess(function (data) {

                var _propertyFields = (data || []);
                var _renderFields = _instance.Utils.ConvertPropertyDetailsToRenderFields({ "Controller": _instance, "List": _propertyFields });

                $parent.data("ListViewFields", _renderFields);

                onCallback(_renderFields);
            }));
        }
        else {
            onCallback(_fields);
        }

    };  //end: _fnGetListRenderFields

    if (_canSearch) {
        _html += "<div class='SearchableView EditorSearchableView PluginEditorCardView" + (_popupRenderOptions.IsEnableAddAction ? " EditorHeaderActionEnabled" : "") + "'>" +
                 "  <input id='tbSearch' type='text' maxlength='1000' data-role='none' placeholder='Search' />" +
                 "  <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' data-iconpos='notext' title='Clear' />" +
                 "</div>";

        if (_popupRenderOptions.IsEnableAddAction) {
            _html += "<div class='EditorHeaderActionDivider'>" +
                     "  <div class='Label'>" + util_htmlEncode("Or") + "</div>" +
                     "</div>" +
                     "<div class='EditorHeaderActionAdd'>" +
                     _instance.Utils.HTML.GetButton({
                         "Content": "Add new",
                         "CssClass": "ButtonTheme",
                         "Attributes": {
                             "data-icon": "plus",
                             "data-button-id-add-new": enCETriState.Yes
                         }
                     }) +
                     "</div>";
        }
    }

    _html += "<div id='vwListView' />";

    var _repeaterID = util_forceString(_instance.State["ListViewRepeaterID"]);

    if (_repeaterID == "") {
        _repeaterID = util_forceString(_popupRenderOptions["RepeaterSortID"]);

        if (_repeaterID == "") {
            _repeaterID = "searchListBox_" + (new Date()).getTime();
        }

        _instance.State["ListViewRepeaterID"] = _repeaterID;
    }

    var _repeaterOpts = null;
    var _onCustomDismissCallback = null;

    var _popupOptions = _instance.Utils.DefaultPopupOptions({
        "Controller": _instance,
        "Title": _popupRenderOptions.Title,
        "HTML": _html,
        "PopupClass": "PopupListBoxUserControlBase",
        "OnPopupBind": function () {
            var $popup = $mobileUtil.PopupContainer();
            var _queue = new CEventQueue();

            var $vwListView = $popup.find("#vwListView");
            var $tbSearch = null;
            var $vwRepeater = null;

            _queue.Add(function (onCallback) {

                _fnGetListRenderFields(function (fields) {

                    var _renderFields = (fields || []);
                    var _priorityColumnIndex = -1;
                    var _noRecordsMsgHTML = null;

                    _repeaterOpts = {
                        "SortEnum": null,
                        "DefaultSortEnum": "null",
                        "Columns": [],
                        "PropertyDataIdentifier": null,
                        "GetList": null,
                        "OnConfigureParams": null,
                        "MethodName": null,
                        "LookupPropertyPathUpdates": null,
                        "IsMultiSelect": _renderList.IsMultiple,
                        "HasPriorityColumn": false,
                        "LookupDefaultSelections": {},
                        "AddSelection": function (itemID) {
                            var _temp = {};

                            _temp[this.PropertyDataIdentifier] = itemID;
                            _temp["_isFromSource"] = true;
                            
                            this.LookupDefaultSelections[itemID] = _temp;
                        },
                        "BridgeEntity": {
                            "Instance": _renderList.InstanceType,
                            "PropertyText": _renderList.PropertyText, //parent lookup item name
                            "PropertyBridgeID": _renderList.PropertyBridgeID,
                            "PropertyBridgeIDName": _renderList.PropertyBridgeIDName,
                            "OnConfigureItem": null //format: function (opts) { ... } where opts: { "Item": "LookupItem" }
                        },
                        "CacheFunctionLookup": {}
                    };

                    if (_popupRenderOptions.IsEnableAddAction) {
                        _noRecordsMsgHTML = util_htmlEncode(_popupRenderOptions.NoRecordsMessageAddNew) +
                                            _instance.Utils.HTML.GetButton({
                                                "CssClass": "ButtonThemeInvert",
                                                "Content": "Add New",
                                                "Attributes": {
                                                    "data-button-id-add-new": enCETriState.Yes, "style": "margin-top: 0em;"
                                                }
                                            });
                    }

                    //checkmark toggle column
                    _repeaterOpts.Columns.push({
                        "ID": "toggle_icon",
                        "Content": "",
                        "IsNoLink": true
                    });

                    var _first = true;

                    for (var f = 0; f < _renderFields.length; f++) {
                        var _field = _renderFields[f];
                        var _options = _field[enColCEditorRenderFieldProperty.Options];
                        var _column = null;

                        if (_options && _options["ColumnTemplateID"]) {
                            _column = {
                                "ID": _options.ColumnTemplateID,
                                "Content": "",
                                "IsNoLink": true
                            };
                        }
                        else {
                            _column = {
                                "Content": _field[enColCEditorRenderFieldProperty.Title],
                                "SortEnum": (_options ? _options["SortEnum"] : null),
                                "PropertyPath": _field[enColCEditorRenderFieldProperty.PropertyPath],
                                "IsDate": (_options ? _options["IsDate"] : false),
                                "HasSearchHighlight": util_forceBool(_options ? _options["HasSearchHighlight"] : true, true)
                            };
                        }

                        if (_first && !(_column["IsNoLink"])) {
                            _repeaterOpts.DefaultSortEnum = _column.SortEnum;
                            _first = false;
                        }

                        _repeaterOpts.Columns.push(_column);

                        if (_repeaterOpts.HasPriorityColumn && _priorityColumnIndex < 0 && !(_column["IsNoLink"])) {
                            _priorityColumnIndex = _repeaterOpts.Columns.length - 1;
                        }
                    }

                    _repeaterOpts.GetList = function (element, sortSetting, callback) {

                        var _callback = function (data) {

                            if (callback) {
                                callback(data);
                            }
                        };

                        if ($vwListView.data("IsCached")) {

                            var _cacheData = $vwListView.data("CacheData");

                            $vwListView.removeData("IsCached")
                                       .removeData("CacheData");

                            _callback(_cacheData);
                        }
                        else {
                            var _params = {
                                "SortColumn": sortSetting.SortColumn,
                                "SortAscending": sortSetting.SortASC,
                                "PageSize": util_forceInt(sortSetting.PageSize, _popupRenderOptions.PageSize),
                                "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1),
                                "Search": (_canSearch ? $tbSearch.val() : null)
                            };

                            if (_repeaterOpts.OnConfigureParams) {
                                _repeaterOpts.OnConfigureParams(_params);
                            }

                            APP.Service.Action({
                                "c": "PluginEditor", "m": _repeaterOpts.MethodName, "args": _params
                            }, function (result) {
                                _callback(result);
                            });

                            if (_canSearch) {
                                $tbSearch.data("LastRequest", GlobalService.LastRequest);
                            }
                        }

                    };  //end: _fnGetList

                    _repeaterOpts.PropertyDataIdentifier = _popupRenderOptions.PropertyDataIdentifier;

                    _repeaterOpts.SortEnum = _popupRenderOptions.SortEnum;
                    _repeaterOpts.MethodName = _popupRenderOptions.MethodName;
                    _repeaterOpts.LookupPropertyPathUpdates = _popupRenderOptions.LookupPropertyPathUpdates;

                    //iterate through the list of bridge items and add its values as selections
                    var _listSelections = (options.ListSelections || []);

                    for (var v = 0; v < _listSelections.length; v++) {
                        var _bridgeItem = _listSelections[v];

                        _repeaterOpts.AddSelection(_bridgeItem[_repeaterOpts.BridgeEntity.PropertyBridgeID]);
                    }

                    var $repeater = _instance.Utils.Repeater({
                        "ID": "Table_" + _repeaterID,
                        "CssClass": "EditorDataAdminListTableTheme",
                        "PageSize": _popupRenderOptions.PageSize,
                        "SortEnum": _repeaterOpts.SortEnum,
                        "DefaultSortEnum": _repeaterOpts.DefaultSortEnum,
                        "SortOrderGroupKey": "popup_listview_table_" + _repeaterID,
                        "IsDisablePagingFooter": false,
                        "DefaultNoRecordMessage": _noRecordsMsgHTML,
                        "IsNoRecordMessageHTML": (util_forceString(_noRecordsMsgHTML) != ""),
                        "Columns": _repeaterOpts.Columns,
                        "RepeaterFunctions": {
                            "ContentRowAttribute": function (item) {
                                return util_htmlAttribute("data-attr-item-id", item[_repeaterOpts.PropertyDataIdentifier]);
                            },
                            "ContentRowCssClass": function (opts) {
                                var _item = opts.Item;
                                var _selected = false;
                                var _itemID = _item[_repeaterOpts.PropertyDataIdentifier];
                                var _lookupSelections = $vwListView.data("LookupSelections");

                                if (_lookupSelections && _lookupSelections[_itemID]) {
                                    _selected = true;
                                }

                                return "EntityLineItem" + (_selected && !_repeaterOpts.IsMultiSelect ? " LinkDisabled" : "") + (_selected ? " Selected" : "");
                            },
                            "FieldCellOption": function (cellOpts) {

                                var _column = _repeaterOpts.Columns[cellOpts.Index];

                                if (_column["IsNoLink"]) {

                                    switch (_column["ID"]) {

                                        case "toggle_icon":
                                            cellOpts.CssClass += "ImageToggleIconCell";
                                            break;

                                        case "download_resource":
                                            cellOpts.CssClass += "LinkDisabled ImageDownloadCell";
                                            break;

                                        case "kol_profile":
                                            cellOpts.CssClass += "ImageKOL_ProfileIconCell";
                                            break;
                                    }
                                }
                                else if (cellOpts.Index == _priorityColumnIndex) {
                                    cellOpts.CssClass += "PriorityColumnContentCell";
                                }

                                return cellOpts;
                            },
                            "FieldValue": function (opts) {
                                var _val = "";
                                var _item = opts.Item;
                                var _isEncode = true;
                                var _isNewLineEncode = false;

                                if (opts.IsContent) {
                                    var _column = _repeaterOpts.Columns[opts.Index];
                                    var _propertyPath = _column["PropertyPath"];
                                    var _isDate = (_column["IsDate"] === true);

                                    if (_propertyPath) {
                                        var _hasHighlight = (util_forceBool(_column["HasSearchHighlight"], true) && !_isDate);

                                        _val = util_propertyValue(_item, _propertyPath);

                                        if (_isDate) {
                                            _val = util_FormatDateTime(_val, "", null, false, { "ForceDayPadding": true, "IsValidateConversion": true });
                                        }

                                        if (_isEncode && _hasHighlight && $vwListView.data("HighlightEncoder")) {
                                            _val = util_forceString(_val);
                                            _val = $vwListView.data("HighlightEncoder").call(this, _val, _isNewLineEncode);
                                            _isEncode = false;  //disable HTML encode
                                        }
                                    }
                                    else if (_column["ID"] == "toggle_icon") {
                                        var _selected = false;
                                        var _itemID = _item[_repeaterOpts.PropertyDataIdentifier];
                                        var _lookupSelections = $vwListView.data("LookupSelections");

                                        if (_lookupSelections && _lookupSelections[_itemID]) {
                                            _selected = true;
                                        }

                                        _val = "<div class='EditorImageButton ImageToggleSelection" + (_selected ? " StateOn" : "") + "'>" +
                                               "    <div class='ImageIcon' />" +
                                               "</div>";
                                        _isEncode = false;
                                    }
                                    else if (_column["ID"] == "kol_profile") {
                                        var _itemID = _item[_repeaterOpts.PropertyDataIdentifier];
                                        var _fnConstructBackgroundURL = _repeaterOpts.CacheFunctionLookup[_column.ID];

                                        if (!_fnConstructBackgroundURL) {
                                            _fnConstructBackgroundURL = util_propertyValue(_instance, "Data.KeyOpinionLeaderController.Utils.ConstructKeyOpinionLeaderProfileURL");

                                            if (!_fnConstructBackgroundURL) {
                                                _fnConstructBackgroundURL = function () {
                                                    return "image_err.png";
                                                };
                                            }

                                            _repeaterOpts.CacheFunctionLookup[_column.ID] = _fnConstructBackgroundURL;
                                        }

                                        _val = "<div class='EditorImageButton ImageUserProfile'>" +
                                               "    <div class='ImageIcon' " +
                                               util_htmlAttribute("style",
                                                                  "background-image: url('" + _fnConstructBackgroundURL({ "ID": _itemID }) + ")'") +
                                               "    />" +
                                               "</div>";

                                        _isEncode = false;
                                    }
                                }

                                _val = (_isEncode ? util_htmlEncode(_val, _isNewLineEncode) : util_forceString(_val));

                                return _val;
                            },
                            "GetData": function (element, sortSetting, callback) {

                                var _isCachedData = $vwListView.data("is-cached-data");

                                if (_isCachedData) {
                                    $vwListView.removeData("is-cached-data");
                                    callback($vwListView.data("DataSource"));
                                }
                                else if (_repeaterOpts.GetList) {
                                    _repeaterOpts.GetList.apply(this, [element, sortSetting, callback]);
                                }
                                else {
                                    callback(null);
                                }
                            },
                            "BindComplete": function (opts) {

                                var _list = util_extend({ "List": null, "NumItems": null }, opts.Data);

                                $vwListView.data("DataSource", _list);

                                if ($vwListView.is(":visible") == false) {
                                    $vwListView.slideDown("normal");
                                }

                                if ($vwListView.data("OnCallback")) {
                                    var _fn = $vwListView.data("OnCallback");

                                    $vwListView.removeData("OnCallback");
                                    _fn.call($vwListView);
                                }
                            }
                        }
                    });

                    $vwListView.hide().empty();
                    $vwListView.append($repeater);

                    $mobileUtil.refresh($vwListView);

                    //set data lookup for IDs of selected items
                    $vwListView.data("LookupSelections", _repeaterOpts.LookupDefaultSelections);

                    $repeater.off("click.onItemClick");
                    $repeater.on("click.onItemClick", ".EntityLineItem:not(.LinkDisabled)[data-attr-item-id]", function (e) {

                        var $search = $(e.target).closest("td.LinkDisabled, tr.EntityLineItem");

                        if ($search.hasClass("EntityLineItem")) {

                            var $this = $(this);
                            var _itemID = util_forceInt($this.attr("data-attr-item-id"), enCE.None);
                            var _fnGetSelectionItem = function () {
                                var _search = util_arrFilter($vwListView.data("DataSource").List, _repeaterOpts.PropertyDataIdentifier, _itemID, true);

                                return (_search.length == 1 ? _search[0] : null);
                            };

                            var _lookupSelections = $vwListView.data("LookupSelections");

                            if (!_lookupSelections) {
                                _lookupSelections = {};
                                $vwListView.data("LookupSelections", _lookupSelections);
                            }

                            if (!_repeaterOpts.IsMultiSelect) {
                                $repeater.off("click.onItemClick");

                                //remove all selections (since can have at most only one)
                                for (var _id in _lookupSelections) {
                                    delete _lookupSelections[_id];
                                }

                                _lookupSelections[_itemID] = _fnGetSelectionItem();
                            }
                            else {
                                var _selected = (_lookupSelections[_itemID] ? false : true);

                                if (_selected) {
                                    _lookupSelections[_itemID] = _fnGetSelectionItem();
                                }
                                else {
                                    delete _lookupSelections[_itemID];
                                }
                            }

                            $this.addClass("LinkDisabled");

                            $vwListView.data("OnCallback", function () {

                                if (!_repeaterOpts.IsMultiSelect) {
                                    $mobileUtil.PopupClose();
                                }
                            });

                            $repeater.trigger("events.refresh_list");
                        }

                    }); //end: click.onItemClick
                    
                    $vwListView.off("events.refreshListView");
                    $vwListView.on("events.refreshListView", function (e, args) {

                        args = util_extend({ "IsCache": false, "Data": null, "SearchParam": null }, args);

                        if (args.IsCache) {

                            //set flag to use cached data
                            $vwListView.data("IsCached", true)
                                       .data("CacheData", args.Data);

                            $vwListView.data("HighlightEncoder", (args.SearchParam ? args.SearchParam["HighlightEncoder"] : null));

                            //default to first page
                            ctl_repeater_setSortSettingCurrentPage($vwRepeater, 1);
                        }
                        else {

                            //remove any cached data
                            $vwListView.removeData("IsCached")
                                       .removeData("CacheData");
                        }

                        renderer_event_data_admin_list_bind($vwListView);

                    }); //end: events.refreshListView

                    $popup.off("click.onSearchAddNew");
                    $popup.on("click.onSearchAddNew", "[data-button-id-add-new]:not(.LinkDisabled)", function () {

                        _onCustomDismissCallback = function () {
                            _instance.OnAddNewView();
                        };

                        $mobileUtil.PopupClose();

                    }); //end: click.onSearchAddNew

                    if (_canSearch) {

                        //init refresh list view will be handled by the search input
                        onCallback();
                    }
                    else {
                        $vwListView.trigger("events.refreshListView", { "Callback": onCallback });
                    }
                });
            });

            if (_canSearch) {
                $tbSearch = $popup.find("#tbSearch");

                $tbSearch.attr(DATA_ATTRIBUTE_RENDER, "searchable_field")
                         .data("SearchConfiguration",
                               {
                                   "SearchableParent": $tbSearch.closest(".SearchableView"),
                                   "OnRenderResult": function (result, opts) {
                                       $vwListView.trigger("events.refreshListView", { "IsCache": true, "Data": result, "SearchParam": opts });
                                   },
                                   "OnSearch": function (opts, callback) {

                                       var _isInit = false;

                                       if (!$vwRepeater || $vwRepeater.length == 0 || $vwRepeater.hasClass("CRepeater") == false) {
                                           $vwRepeater = $vwListView.find(".CRepeater");

                                           //check if the initialization has not completed, in which case the repeater element is acquired using a custom selector
                                           if ($vwRepeater.length == 0) {
                                               $vwRepeater = $vwListView.find("[sort-order-group]:first");
                                               _isInit = true;
                                           }
                                       }

                                       if (!_isInit) {

                                           //force it to be default first page
                                           ctl_repeater_setSortSettingCurrentPage($vwRepeater, 1);
                                       }

                                       var _sortSettings = ctl_repeater_getSortSetting($vwRepeater);

                                       if (_isInit) {

                                           //page size will not be properly configured for sort setting as the data admin list has issues with it;
                                           //will use the pre-init attribute value, if applicable
                                           var _pageSize = util_forceInt($vwRepeater.attr("default-page-size"), -1);

                                           if (_pageSize >= 0) {
                                               _sortSettings["PageSize"] = _pageSize;
                                           }
                                       }

                                       _repeaterOpts.GetList($vwRepeater, _sortSettings, function (result) {
                                           callback(result);
                                       });
                                   }
                               });

                $mobileUtil.RenderRefresh($tbSearch, true);

                _queue.Add(function (onCallback) {

                    $vwListView.data("OnCallback", function () {
                        try {
                            $tbSearch.trigger("focus");
                        } catch (e) {
                        }

                        onCallback();
                    });

                    $tbSearch.trigger("events.searchable_submit", { "IsForceRefresh": true });
                });
            }

            _queue.Run();
        },
        "OnPopupCloseCallback": function () {

            var _lookupSelections = ($mobileUtil.PopupContainer().find("#vwListView").data("LookupSelections") || {});
            var _result = {
                "List": [],
                "SourceSelections": (options.ListSelections || [])
            };

            if (!_repeaterOpts) {

                //popup initialization did not complete, so return the source selections
                _result.List = _result.SourceSelections;
            }
            else {
                var _arr = [];

                //iterate over the source list and add its ID to the list (required in order to ensure source order is preserved)
                for (var i = 0; i < _result.SourceSelections.length; i++) {
                    var _item = _result.SourceSelections[i];

                    _arr.push(util_propertyValue(_item, _repeaterOpts.BridgeEntity.PropertyBridgeID));
                }

                //add the list of current selections
                for (var _key in _lookupSelections) {
                    _arr.push(_key);
                }

                for (var i = 0; i < _arr.length; i++) {
                    var _itemID = _arr[i];
                    var _entry = _lookupSelections[_itemID];

                    if (_entry) {

                        var _isFromSource = (_entry["_isFromSource"] == true);
                        var _bridgeItem = null;

                        if (_isFromSource) {
                            _bridgeItem = util_arrFilter(_result.SourceSelections, _repeaterOpts.PropertyDataIdentifier, _itemID, true);
                            _bridgeItem = (_bridgeItem.length == 1 ? _bridgeItem[0] : null);
                        }

                        if (!_bridgeItem) {
                            _bridgeItem = (_repeaterOpts.BridgeEntity.Instance ? new _repeaterOpts.BridgeEntity.Instance() : {});
                        }

                        util_propertySetValue(_bridgeItem, _repeaterOpts.PropertyDataIdentifier, _itemID);

                        if (!_isFromSource) {

                            //set the bridge ID text, if applicable
                            if (_repeaterOpts.BridgeEntity.PropertyText && _repeaterOpts.BridgeEntity.PropertyBridgeIDName) {
                                var _name = util_propertyValue(_entry, _repeaterOpts.BridgeEntity.PropertyText);

                                util_propertySetValue(_bridgeItem, _repeaterOpts.BridgeEntity.PropertyBridgeIDName, _name);
                            }

                            _instance.Utils.ApplyPropertyPathMappings({
                                "SourceItem": _entry, "TargetItem": _bridgeItem, "LookupPropertyPathUpdates": _repeaterOpts.LookupPropertyPathUpdates
                            });
                        }

                        _result.List.push(_bridgeItem);

                        //remove the selection since has been handled
                        delete _lookupSelections[_itemID];
                    }
                }
            }

            if (options.OnDismissCallback) {
                options.OnDismissCallback(_result);
            }

            if (_onCustomDismissCallback) {
                _onCustomDismissCallback();
            }
        }
    });

    $mobileUtil.PopupOpen(_popupOptions);

    //return callback immediately (to avoid issues with popup quickly being dismissed and callback not triggered on popup bind method)
    if (options.Callback) {
        options.Callback();
    }
};

CListBoxUserControlBase.prototype.OnViewItemDetail = function (options) {

    var _instance = this;

    options = util_extend({ "Element": null, "Callback": null }, options);

    var _renderList = _instance.State.RenderList;

    var _html = "";

    var _popupRenderOptions = util_extend({
        "DetailTitle": "Details"
    }, util_propertyValue(_instance, "State.RenderList.PopupRenderOptions"));

    var _templateDetailID = util_forceString(_renderList.TemplateDetailID);
    var _callback = function () {
        if (options.Callback) {
            options.Callback();
        }
    };

    if (_templateDetailID == "") {
        _callback();
    }
    else {

        var _popupCssClass = "";

        if (_templateDetailID == "kol") {
            _popupCssClass = "PopupNavigationModeInline StateHiddenDefaultContent";
        }

        var _popupOptions = _instance.Utils.DefaultPopupOptions({
            "Controller": _instance,
            "Title": _popupRenderOptions.DetailTitle,
            "HTML": _html,
            "PopupClass": _popupCssClass,
            "OnPopupBind": function () {

                var $popupContent = $mobileUtil.PopupContentContainer();
                var $divItemDetails = $("<div " + util_renderAttribute("pluginEditor_fileDisclaimer") + " />");
                var _queue = new CEventQueue();

                $popupContent.append($divItemDetails);
                $mobileUtil.RenderRefresh($divItemDetails, true);

                switch (_templateDetailID) {

                    case "kol":

                        var _controllerKOL = util_propertyValue(_instance, "Data.KeyOpinionLeaderController");

                        if (_controllerKOL && options.Element) {

                            _queue.Add(function (onCallback) {

                                var $trigger = $(options.Element);

                                $trigger.attr("data-view-entity-type", "KOL");  //set the data attribute for the details entity type

                                //configure extended events, as needed for the KOL Controller in external container mode
                                _instance["CanAdminComponentKOL"] = (_renderList["CanAdminComponentKOL"] ? _renderList.CanAdminComponentKOL : null);

                                _controllerKOL.ShowEntityDetailsPopup({
                                    "Trigger": options.Element, "DataAttributeID": "data-list-item-value", "IsForceTriggerClickEvent": true,
                                    "TriggerController": _instance,
                                    "RenderContainer": $divItemDetails, "RenderTitleElement": $popupContent.find(".PopupHeaderTitle:first"), "Callback": function () {
                                        onCallback();
                                    }
                                });
                            });
                        }

                        break;  //end: kol
                }

                _queue.Run({ "Callback": _callback });
            }
        });

        $mobileUtil.PopupOpen(_popupOptions);
    }
};

CListBoxUserControlBase.prototype.OnAddNewView = function (options) {

    var _instance = this;

    options = util_extend({ "Callback": null }, options);

    var _renderList = _instance.State.RenderList;

    var _queue = new CEventQueue();

    var _popupRenderOptions = util_extend({
        "TemplateAddItem": null //supported values are: kol
    }, util_propertyValue(_instance, "State.RenderList.PopupRenderOptions"));

    var _templateAddItem = util_forceString(_popupRenderOptions.TemplateAddItem);

    blockUI();

    switch (_templateAddItem) {

        case "kol":

            var $root = $mobileUtil.GetElementByID("divContentRoot");
            var $element = $("<div class='CEditorHomeView EditorActiveView EffectGrayscale'>" +
                             "  <div class='CEditorComponentHome'>" +
                             "      <div class='Content'>" +
                             "          <div " + util_renderAttribute("pluginEditor_viewController") + " " +
                             util_htmlAttribute("data-attr-view-controller-instance-type", "CKeyOpinionLeaderController") + " />" +
                             "      </div>" +
                             "  </div>" +
                             "</div>");

            $root.addClass("EditorStateCustomView");
            $root.append($element);

            //configure DOM intermediate events
            $element.off("events.getComponentUserPermission");
            $element.on("events.getComponentUserPermission", function (e, args) {

                if (!args) {
                    args = {};
                }

                if (util_forceBool(args["IsContextFilter"], true) == true) {

                    //restrict it to the applicable component (as it is in an embedded state)
                    util_extend(args, {
                        "OverrideClassificationID": _instance.Data.MiscellaneousClassificationID,
                        "OverridePlatformID": _instance.Data.MiscellaneousPlatformID,
                        "OverrideComponentID": _instance.Data.KOL_ManagerComponentID
                    }, true);
                }

                _instance.DOM.Element.trigger("events.getComponentUserPermission", args);
            });

            $element.off("events.externalOnAction");
            $element.on("events.externalOnAction", function (e, args) {

                args = util_extend({ "Trigger": null, "Action": null, "Callback": null }, args);

                var _onCallback = function () {
                    if (args.Callback) {
                        args.Callback();
                    }
                };

                var $trigger = $(args.Trigger);
                var _action = util_forceString(args.Action);

                switch (_action) {

                    case "navigate_back":

                        var _dataItem = (args["DataItem"] || {});
                        var _itemID = util_forceInt(util_propertyValue(_dataItem, _renderList.PropertyValue), enCE.None);

                        $element.addClass("EffectGrayscale")
                                .toggle("height", function () {

                                    $element.remove();
                                    $root.removeClass("EditorStateCustomView");

                                    if (_instance.DOM.Element && _itemID != enCE.None) {
                                        _instance.DOM.Element.trigger(_instance.Data.EVENT_NAMES.OnAppendEntry, {
                                            "Item": _dataItem, "From": "add_new", "Callback": _onCallback
                                        });
                                    }
                                    else {
                                        _onCallback();
                                    }
                                });

                        break;  //end: navigate_back

                    default:
                        _onCallback();
                        break;
                }

            }); //end: events.externalOnAction

            _queue.Add(function (onCallback) {

                var $viewController = $element.find("[" + util_renderAttribute("pluginEditor_viewController") + "]");

                $viewController.data("ControllerRenderOptions", {
                    "IsExternalMode": true, "AddViewMode": "kol"
                });

                $mobileUtil.refresh($element);

                $viewController.trigger("events.controller_bind", {
                    "Callback": function () {
                        $element.removeClass("EffectGrayscale");
                        onCallback();
                    }
                });
            });

            break;  //end: kol
    }

    setTimeout(function () {
        _queue.Run({
            "Callback": function () {

                unblockUI();

                if (options.Callback) {
                    options.Callback();
                }
            }
        });
    }, 500);

};

CListBoxUserControlBase.prototype.ConvertSourceEntryToBridgeItem = function (options) {

    options = util_extend({ "ParentDataItem": null, "From": null }, options);

    var _instance = this;
    var _renderList = _instance.State.RenderList;
    var _ret = null;
    var _parentDataItem = options.ParentDataItem;
    var _itemID = util_forceInt(util_propertyValue(_parentDataItem, _renderList.PropertyValue), enCE.None);

    if (_instance.DOM.Element) {

        var _current = {
            "SearchFallbackDataKey": "PopupSearchSourceSelections"
        };

        _instance.DOM.Element.trigger("events.userControl_getValue", _current);

        _ret = util_arrFilter(_current.ItemValue, _renderList.PropertyBridgeID, _itemID, true);
        _ret = (_ret.length == 1 ? _ret[0] : null);
    }

    if (!_ret) {
        _ret = (_renderList.InstanceType ? new _renderList.InstanceType() : {});        
    }

    if (options.From == "external_add") {

        //the "parent data item" in this case is actually the bridge item, so will copy all values
        util_extend(_ret, _parentDataItem, true, true);
    }

    util_propertySetValue(_ret, _renderList.PropertyBridgeID, _itemID);

    //set the bridge ID text, if applicable
    if ((options.From != "external_add") && _renderList.PropertyText && _renderList.PropertyBridgeIDName) {
        var _name = util_propertyValue(_parentDataItem, _renderList.PropertyText);

        util_propertySetValue(_ret, _renderList.PropertyBridgeIDName, _name);
    }

    if (options.From == "popup" || options.From == "add_new") {
        var _lookupPropertyPathUpdates = util_propertyValue(_renderList, "PopupRenderOptions.LookupPropertyPathUpdates");

        _instance.Utils.ApplyPropertyPathMappings({
            "SourceItem": _parentDataItem, "TargetItem": _ret, "LookupPropertyPathUpdates": _lookupPropertyPathUpdates
        });
    }

    return _ret;
};

function pluginEditor_getUtils() {

    var _utils = {

        "Data": {
            "NextRenderFieldID": 1
        },

        "Managers": {
            "Data": new CPluginEditorDataManager()
        },

        "IsEditMode": function (obj) {
            return $(obj).closest(".Content, .ViewModeEdit").is(".ViewModeEdit");
        },
        "NextTempID": function (obj) {
            var $obj = $(obj);
            var _ret = util_forceInt($obj.data("data-ctx-temp-id"), 0);

            _ret += 1;

            $obj.data("data-ctx-temp-id", _ret);

            return _ret;
        },

        "FormatDateTime": function (val) {
            val = (typeof val === "object") ? val : util_JS_convertToDate(val);

            return util_FormatDateTime(val);
        },

        "ConvertPropertyDetailsToRenderFields": function (options) {

            var _ret = [];
            var _instance = this;

            options = util_extend({ "Controller": null, "List": null }, options);

            var _controller = options.Controller;

            var _propertyDetailList = (options.List || []);

            //filter to only include the ones which are visible
            _propertyDetailList = util_arrFilterSubset(_propertyDetailList, function (searchItem) {
                var _visible = util_propertyValue(searchItem, enColCPropertyDetailProperty.RenderDetail + "." + enColCFieldRenderDetailProperty.IsVisible);

                return (_visible === true);
            });

            //sort by ascending DisplayOrder of the render details; fallback to DisplayName/Name ascending order
            _propertyDetailList = _propertyDetailList.sort(function (lhs, rhs) {
                var _retOrder = 0;

                var _lhRender = lhs[enColCPropertyDetailProperty.RenderDetail];
                var _rhRender = rhs[enColCPropertyDetailProperty.RenderDetail];

                if (!_lhRender && _rhRender) {
                    _retOrder = -1;
                }
                else if (_lhRender && !_rhRender) {
                    _retOrder = 1;
                }
                else {
                    _retOrder = (util_forceInt(_lhRender[enColCFieldRenderDetailProperty.DisplayOrder], 0) -
                                 util_forceInt(_rhRender[enColCFieldRenderDetailProperty.DisplayOrder], 0));

                    if (_retOrder == 0) {

                        //the display order for both items are the same so use the display name
                        var _lhDisplayName = util_forceString(lhs[enColCPropertyDetailProperty.DisplayName]);
                        var _rhDisplayName = util_forceString(rhs[enColCPropertyDetailProperty.DisplayName]);

                        if (_lhDisplayName == "") {
                            _lhDisplayName = util_forceString(lhs[enColCPropertyDetailProperty.Name]);
                        }

                        if (_rhDisplayName == "") {
                            _rhDisplayName = util_forceString(rhs[enColCPropertyDetailProperty.Name]);
                        }

                        if (_lhDisplayName === _rhDisplayName) {
                            _retOrder = 0;
                        }
                        else {
                            _retOrder = (_lhDisplayName < _rhDisplayName ? -1 : 1);
                        }
                    }
                }

                return _retOrder;
            });

            var _mappings = [
                { "p": enColCEditorRenderFieldProperty.Title, "s": enColCPropertyDetailProperty.DisplayName },
                { "p": enColCEditorRenderFieldProperty.PropertyPath, "s": enColCPropertyDetailProperty.Name }
            ];

            for (var i = 0; i < _propertyDetailList.length; i++) {
                var _propertyDetail = _propertyDetailList[i];

                //check if a custom render field is available
                var _field = util_propertyValue(_propertyDetail, enColCPropertyDetailProperty.RenderDetail + "." + enColCFieldRenderDetailProperty.EditorRenderField);

                if (_field) {
                    _field = util_extend({}, _field, true, true);   //create a clone
                }
                else {

                    _field = new CEditorRenderField();

                    var _dataType = _propertyDetail[enColCPropertyDetailProperty.DataType];
                    var _editorDataTypeID = enCEEditorDataType.Text;
                    var _isRequired = util_propertyValue(_propertyDetail, enColCPropertyDetailProperty.Validation + "." + enColCFieldValidationProperty.IsRequired);
                    var _fieldOptions = _field[enColCEditorRenderFieldProperty.Options];

                    //merge with the property detail provided render options
                    _fieldOptions = util_extend(_fieldOptions,
                                                util_propertyValue(_propertyDetail, enColCPropertyDetailProperty.RenderDetail + "." +
                                                                   enColCFieldRenderDetailProperty.EditorRenderFieldOptions));

                    switch (_dataType) {

                        case enCDataFormat.Boolean:
                        case enCDataFormat.BooleanCheckbox:
                            _editorDataTypeID = enCEEditorDataType.FlipSwitch;
                            break;

                        case enCDataFormat.Date:
                            _editorDataTypeID = enCEEditorDataType.Date;
                            break;

                        case enCDataFormat.Lookup:

                            _editorDataTypeID = enCEEditorDataType.Dropdown;

                            var _isExcludeLookupNumericDefault = util_propertyValue(_propertyDetail,
                                                                                    enColCPropertyDetailProperty.Validation + "." +
                                                                                    enColCFieldValidationProperty.ExcludeLookupNumericDefault);

                            _isExcludeLookupNumericDefault = util_forceBool(_isExcludeLookupNumericDefault, false);

                            _fieldOptions = util_extend(_fieldOptions, { "IsExcludeLookupNumericDefault": _isExcludeLookupNumericDefault });

                            break;

                        case enCDataFormat.TextExt:
                            var _maxLength = util_propertyValue(_propertyDetail, enColCPropertyDetailProperty.Validation + "." + enColCFieldValidationProperty.MaxLength);

                            _editorDataTypeID = enCEEditorDataType.FreeText;

                            _maxLength = util_forceInt(_maxLength, 0);

                            _fieldOptions = util_extend(_fieldOptions, { "MaxLength": _maxLength });
                            break;
                    }

                    util_propertySetValue(_field, enColCEditorRenderFieldProperty.EditorDataTypeID, _editorDataTypeID);
                    util_propertySetValue(_field, enColCEditorRenderFieldProperty.IsRequired, util_forceBool(_isRequired, _field[enColCEditorRenderFieldProperty.IsRequired]));
                    util_propertySetValue(_field, enColCEditorRenderFieldProperty.Options, _fieldOptions);

                    for (var m = 0; m < _mappings.length; m++) {
                        var _mappingItem = _mappings[m];
                        var _prop = _mappingItem.p;
                        var _srcProp = _mappingItem.s;
                        var _val = util_propertyValue(_propertyDetail, _srcProp);

                        switch (_srcProp) {

                            case enColCPropertyDetailProperty.DisplayName:
                                if (util_forceString(_val) == "") {
                                    _val = util_propertyValue(_propertyDetail, enColCPropertyDetailProperty.Name);
                                }

                                break;
                        }

                        util_propertySetValue(_field, _prop, _val);
                    }
                }

                _controller.Utils.InitEditorRenderField({ "Controller": _controller, "Field": _field });

                _ret.push(_field);
            }

            return _ret;
        },

        "ForceValidURL": function (str) {

            str = util_trim(str);

            if (str != "") {
                var _url = $.url(str);

                if (_url.attr("protocol") == "") {
                    str = "http://" + str;
                }
            }

            return str;
        },

        "ForceDatePickerValue": function (options) {
            options = util_extend({ "Value": null, "IsFullDate": true }, options);

            var _val = options.Value;
            var _dt = { "Month": null, "Day": null, "Year": null };

            if (!util_isNullOrUndefined(_val)) {

                if (typeof _val === "object") {
                    _dt.Month = _val.getMonth();
                    _dt.Day = _val.getDate();
                    _dt.Year = _val.getFullYear();
                }
                else if (typeof _val === "string") {

                    _val = util_trim(_val);

                    var _arr = util_replaceAll(_val, ",", "").split(" ");

                    if (_arr.length == 0 || (_arr.length == 1 && _arr[0] === _val)) {

                        //check if it is a JS version of the date (convert and retrieve the date portions, if applicable)
                        var _temp = util_JS_convertToDate(_val, null);

                        if (_temp && !isNaN(_temp.getTime())) {
                            _dt.Month = _temp.getMonth();
                            _dt.Day = _temp.getDate();
                            _dt.Year = _temp.getFullYear();
                        }
                    }
                    else if (_arr.length == 2 || _arr.length == 3) {

                        var _search = _arr[0].toLowerCase();

                        _dt.Month = util_arrFilterItemIndex(_months, function (month) {
                            return (month.toLowerCase() === _search);
                        });

                        if (_dt.Month < 0) {
                            _dt.Month = null;
                        }

                        if (_arr.length > 2) {
                            _dt.Day = util_forceInt(_arr[1], -1);

                            if (_dt.Day < 1 || _dt.Day > 31) {
                                _dt.Day = null;
                            }
                        }

                        _dt.Year = util_forceInt(_arr[_arr.length - 1], -1);
                    }
                }
            }

            //invalidate the day portion if it is not full date (i.e. MMM YYYY format type)
            if (!options.IsFullDate) {
                _dt.Day = null;
            }

            return _dt;
        },

        "ForceRepositoryFieldValue": function (options) {
            
            options = util_extend({ "Item": null, "Field": null }, options);

            var _instance = this;

            var _ret = null;
            var _item = options.Item;
            var _field = options.Field;
            var _fieldOptions = (_field["_options"] || {}); //NOTE: must have been initialized prior to method call

            var _propertyPath = _field["_propertyPath"];

            if (_propertyPath === undefined) {

                _propertyPath = util_forceString(_field[enColRepositoryFieldProperty.PropertyPath]);
                var _fieldPropPath = null;

                if (_propertyPath != "") {
                    try {

                        try {
                            _fieldPropPath = eval(_propertyPath);
                        } catch (e) {

                            //if the expression cannot be evaluated, check if it is a JSON object
                            _fieldPropPath = util_parse(_propertyPath);
                        }

                        //support for custom overrides using JSON objects for property path
                        if (typeof _fieldPropPath === "object") {
                            var _temp = util_extend({ "PropertyPath": null, "DisplayPropertyPath": null }, _fieldPropPath);

                            _fieldPropPath = eval(_temp.PropertyPath);
                            _field["_displayPropertyPath"] = eval(_temp.DisplayPropertyPath);
                        }
                    } catch (e) {
                        util_logError("CRepositoryController :: malformed property path for field ID - " + _fieldID);
                    }
                }

                _propertyPath = _fieldPropPath;
                _field["_propertyPath"] = _propertyPath;
            }

            if (_field["_displayPropertyPath"]) {

                //override display property exists for the field, so directly retrieve the value
                _ret = util_propertyValue(_item, _field["_displayPropertyPath"]);
            }
            else if (_propertyPath) {

                _ret = util_propertyValue(_item, _propertyPath);

                switch (_field[enColRepositoryFieldProperty.EditorDataTypeID]) {

                    case enCEEditorDataType.Date:

                        var _months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

                        if (_ret == null) {
                            _ret = "";
                        }
                        else {
                            var _isFullDate = true;

                            if (util_forceString(_fieldOptions["PropertyIsFullDate"]) != "") {
                                var _propertyIsFullDate = _fieldOptions["PropertyIsFullDate"];

                                _isFullDate = util_forceBool(util_propertyValue(_item, _propertyIsFullDate), _isFullDate);
                            }

                            var _dt = _instance.ForceDatePickerValue({ "Value": _ret, "IsFullDate": _isFullDate });

                            _ret = _months[_dt.Month] + (_dt.Day != null ? " " + _dt.Day + "," : "") + (" " + _dt.Year);
                        }

                        break;

                    case enCEEditorDataType.FlipSwitch:

                        if (_ret != null) {
                            _ret = (_ret == true ? "Yes" : "No");
                        }

                        break;
                }
            }

            return _ret;
        },

        "ApplyPropertyPathMappings": function (opts) {

            opts = util_extend({ "SourceItem": null, "TargetItem": null, "LookupPropertyPathUpdates": {} }, opts);

            var _selection = (opts.SourceItem || {});
            var _dataItem = (opts.TargetItem || {});

            //apply the value mappings based on the property path lookup
            var _lookupPropertyPaths = (opts.LookupPropertyPathUpdates || {});

            for (var _propPath in _lookupPropertyPaths) {
                var _propValue = _lookupPropertyPaths[_propPath];
                var _value = null;

                if ($.isArray(_propValue)) {
                    var _arr = [];

                    for (var p = 0; p < _propValue.length; p++) {
                        var _prop = _propValue[p];

                        _arr.push(_selection[_prop]);
                    }

                    _value = util_arrJoinStr(_arr, null, " ");
                }
                else {
                    _value = _selection[_propValue];
                }

                util_propertySetValue(_dataItem, _propPath, _value);
            }
        },

        "InitEditorRenderField": function (options) {

            options = util_extend({ "Field": null, "Controller": null }, options);

            var _controller = options.Controller;

            var _field = options.Field;
            var _dataType = _field[enColCEditorRenderFieldProperty.EditorDataTypeID];

            //set internal ID
            var _id = _controller.Utils.Data.NextRenderFieldID++;

            _field["_id"] = _id;

            var _fieldItem = {
                "_propertyPath": _field[enColCEditorRenderFieldProperty.PropertyPath]
            };

            switch (_dataType) {

                case enCEEditorDataType.Dropdown:
                case enCEEditorDataType.Listbox:

                    //set wrapper _field item
                    _fieldItem = util_extend({
                        "_renderList": {
                            "HasDefault": undefined,
                            "LabelDefaultText": null,
                            "DefaultListValue": undefined,
                            "Data": [],
                            "PropertyText": null,
                            "PropertyValue": null,
                            "InstanceType": null
                        }
                    }, _fieldItem);

                    var _render = util_extend(_fieldItem["_renderList"], _field[enColCEditorRenderFieldProperty.Options], true, true);
                    var _instanceTypeStr = _render.InstanceType;

                    if (_render.InstanceType) {
                        _render.InstanceType = eval(_render.InstanceType);
                    }

                    break;

                case enCEEditorDataType.UserControl:

                    _fieldItem = util_extend({
                        "_options": _field[enColCEditorRenderFieldProperty.Options]
                    }, _fieldItem);

                    break;

                case enCEEditorDataType.FreeText:

                    _fieldItem = util_extend({
                        "_options": _field[enColCEditorRenderFieldProperty.Options]
                    }, _fieldItem);

                    break;

                case enCEEditorDataType.Label:

                    _fieldItem = util_extend({
                        "_options": _field[enColCEditorRenderFieldProperty.Options]
                    }, _fieldItem);
                    break;
            }

            _field["_fieldItem"] = _fieldItem;

            return _field;

        },  //end: InitEditorRenderField

        "GetWindowDimensions": function () {

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
        },

        "ConstructDownloadURL": function (options) {
            var _url = null;

            if (options["TypeID"]) {
                var _extraQS = {};
                var _item = (options["Item"] ? options.Item : null);

                switch (options.TypeID) {

                    case "editor":

                        var _qsProp = "FileID";
                        var _defaultPropID = enColFileProperty.FileID;

                        if (options["IsResourceMode"]) {
                            _qsProp = "RepositoryResourceID";
                            _defaultPropID = enColRepositoryResourceProperty.ResourceID;
                        }

                        var _propID = (options["Property"] ? options.Property : _defaultPropID);

                        _extraQS[_qsProp] = _item[_propID];
                        
                        break;

                }

                _url = util_constructDownloadURL({ "TypeID": options.TypeID, "NoCache": true, "ExtraQS": _extraQS });
            }

            return _url;
        },

        //configures an instance of popup options to be used with $mobileUtil.PopupOpen(...)
        //supports styled scrollbars and additional state based options
        "DefaultPopupOptions": function (options) {

            options = util_extend({
                "Controller": null, //required: controller must be specified
                "HTML": "", "Title": null, "Size": "", "IsViewMode": false, "HasFooter": false, "IsHideFooterButtons": false, "HasReturnAction": false, "IsHideScrollbar": true,
                "FooterButtonList": [],
                "OnPopupBind": function () { }, "OnPopupCloseCallback": null, "OnButtonClick": function (opts) { }, "OnPopupDismissRequested": null,
                "PopupClass": null
            }, options);

            var _controller = options.Controller;

            options.Size = "EditorPopupFixed ScrollbarPrimary" + (util_forceString(options.Size) != "" ? " " + options.Size : "");

            //validate if hide scrollbar can be properly supported; requires data key for scroll top state and initializes if not specified on controller instance
            if (options.IsHideScrollbar) {
                var _dataKey = util_propertyValue(_controller, "Data.DATA_KEY_SCROLL_TOP");

                if (util_isNullOrUndefined(_dataKey)) {
                    if (util_isNullOrUndefined(_controller["Data"])) {
                        _controller["Data"] = {};
                    }

                    util_propertySetValue(_controller, "Data.DATA_KEY_SCROLL_TOP", "ScrollState_" + (new Date()).getTime());

                    util_logError("DefaultPopupOptions :: controller instance does not contain data key property path value - 'Data.DATA_KEY_SCROLL_TOP' " +
                                  "| Default value set.");
                }
            }

            if (options.IsHideScrollbar) {
                var _fnClose = options.OnPopupCloseCallback;

                options.OnPopupCloseCallback = function (args) {

                    if (_fnClose) {
                        _fnClose.call(this, args);
                    }

                    var $activePage = $mobileUtil.ActivePage();
                    var _scrollTop = util_forceInt($activePage.data(_controller.Data.DATA_KEY_SCROLL_TOP), -1);

                    $activePage.removeData(_controller.Data.DATA_KEY_SCROLL_TOP);

                    $("body").removeClass("ViewOverflowHidden");

                    if (_scrollTop >= 0) {
                        $("html").animate({ "scrollTop": _scrollTop }, "normal");
                    }
                };
            }

            var _ret = {
                "PopupCssClass": "EditorPopup " + options.Size + " PopupThemeA" + (util_forceString(options.PopupClass) != "" ? " " + options.PopupClass : ""),
                "HasIndicators": true,
                "DisablePosition": true,
                "IsDismissClickOverlay": true,
                "HeaderTitle": options.Title,
                "blankContent": "",
                "callbackOpen": function () {

                    var $popup = $mobileUtil.PopupContainer();

                    if (options.HasReturnAction) {
                        var $btn = $popup.find(".PopupHeaderContainer .ui-btn[" + util_htmlAttribute("data-attr-popup-close-button", enCETriState.Yes) + "]");

                        $mobileUtil.ButtonUpdateIcon($btn, "arrow-l");
                        $btn.attr("title", "Return");

                        $popup.data("popup-is-cleanup-remove-overlay", false);
                    }

                    //set the dismissable action
                    if (options.OnPopupDismissRequested) {
                        $popup.data("onDismissRequested", options.OnPopupDismissRequested);
                    }

                    $popup.off("click.onButtonClick");
                    $popup.on("click.onButtonClick", ".LinkClickable[data-attr-editor-controller-action-btn]:not(.LinkDisabled)", function (e, args) {

                        args = util_extend({ "Callback": null }, args);

                        var $btn = $(this);
                        var _btnID = $btn.attr("data-attr-editor-controller-action-btn");

                        $btn.addClass("LinkDisabled");

                        var _onClickCallback = function () {

                            $btn.removeClass("LinkDisabled");

                            if (args.Callback) {
                                args.Callback();
                            }
                        };

                        switch (_btnID) {

                            case "popup_save":

                                args = util_extend({ "Callback": null }, args);

                                var _saveCallback = function (isClose) {

                                    if (isClose) {
                                        $mobileUtil.PopupClose();
                                    }

                                    _onClickCallback();
                                };

                                $popup.trigger("events.onSaveEntity", { "Callback": _saveCallback });

                                break;  //end: popup_save

                            default:

                                if (options.OnButtonClick) {

                                    options.OnButtonClick.apply(this, [{ "Element": $btn, "ButtonID": _btnID, "Callback": _onClickCallback }]);
                                }
                                else {
                                    _onClickCallback();
                                }

                                break;
                        }

                    }); //end: click.onButtonClick

                    if (options.OnPopupBind) {
                        options.OnPopupBind.apply(this);
                    }
                },
                "callbackClose": options.OnPopupCloseCallback
            };

            var _html = util_forceString(options.HTML);

            var _customFooterButtonHTML = "";
            var _btnList = (options["FooterButtonList"] || []);
            var _hasFooter = util_forceBool(options.HasFooter, true);

            for (var i = 0; i < _btnList.length; i++) {

                var _btn = util_extend({ "ID": null, "CssClass": null, "Content": null, "Attributes": {} }, _btnList[i]);

                _btn.Attributes = util_extend({
                    "data-inline": "true",
                    "data-icon": "arrow-r",
                    "data-iconpos": "left"
                }, _btn.Attributes);

                _btn.CssClass = util_forceString(_btn.CssClass);
                _btn.CssClass = "ButtonTheme" + (_btn.CssClass != "" ? " " + _btn.CssClass : "");

                _customFooterButtonHTML += _controller.Utils.HTML.GetButton({
                    "ActionButtonID": _btn.ID,
                    "CssClass": _btn.CssClass,
                    "Content": _btn.Content,
                    "Attributes": _btn.Attributes
                });
            }

            if (_hasFooter) {
                _html += "<div class='Footer'>" +
                         _customFooterButtonHTML +
                         (options.IsViewMode ?
                          _controller.Utils.HTML.GetButton({
                              "ActionButtonID": "popup_close",
                              "CssClass": "ButtonTheme",
                              "Content": "Close",
                              "Attributes": {
                                  "data-inline": "true",
                                  "data-icon": "delete",
                                  "data-iconpos": "left",
                                  "data-attr-popup-close-button": enCETriState.Yes
                              }
                          }) :
                          _controller.Utils.HTML.GetButton({
                              "ActionButtonID": "popup_save",
                              "CssClass": "ButtonTheme",
                              "Content": "Save",
                              "Attributes": {
                                  "data-inline": "true",
                                  "data-icon": "check",
                                  "data-iconpos": "left",
                                  "style": (options.IsHideFooterButtons ? "display: none;" : "")
                              }
                          }) +
                          _controller.Utils.HTML.GetButton({
                              "ActionButtonID": "popup_cancel",
                              "CssClass": "ButtonTheme",
                              "Content": "Cancel",
                              "Attributes": {
                                  "data-inline": "true",
                                  "data-icon": "back",
                                  "data-iconpos": "left",
                                  "data-attr-popup-close-button": enCETriState.Yes,
                                  "style": (options.IsHideFooterButtons ? "display: none;" : "")
                              }
                          })
                         ) +
                         "</div>";
            }

            _ret.blankContent = _html;

            if (options.IsHideScrollbar) {
                var $activePage = $mobileUtil.ActivePage();
                var $body = $("body");

                if (!$body.hasClass("ViewOverflowHidden")) {
                    var $window = $(window);

                    $activePage.data(_controller.Data.DATA_KEY_SCROLL_TOP, $window.scrollTop());

                    $window.scrollTop(0);
                    $body.addClass("ViewOverflowHidden");
                }
            }

            return _ret;
        },

        "BindFlipSwitchEvents": function (options) {

            options = util_extend({ "Element": null }, options);

            var $element = $(options.Element);

            $element.off("change.flip_switch");
            $element.on("change.flip_switch", "[" + util_renderAttribute("flip_switch") + "]", function (e) {

                var $this = $(this);

                var $vwChildToggles = $this.closest(".FlipSwitchInline ")
                                           .children(".FlipSwitchChildToggles");

                if ($vwChildToggles.length == 1) {
                    var $ddl = $this.find("select[data-attr-widget='flip_switch']");

                    var $list = $vwChildToggles.find("[" + util_renderAttribute("flip_switch") + "]");
                    var _val = util_forceInt($ddl.val(), enCETriState.None);

                    $list.trigger("events.flipSwitchToggle", { "IsEnabled": (_val == enCETriState.Yes) });
                }

            });

            $element.off("click.inlineFlipSwitch");
            $element.on("click.inlineFlipSwitch", ".FlipSwitchInline.LinkClickable:not([" + util_renderAttribute("flip_switch") + "])", function (e, args) {

                args = util_extend({ "IsRefresh": false }, args);

                var $this = $(this);
                var $target = $(e.target);

                if ($target.closest(".FlipSwitchInline, [" + util_renderAttribute("flip_switch") + "]").is(".FlipSwitchInline")) {

                    e.stopPropagation();

                    var $ddl = $this.children("[" + util_renderAttribute("flip_switch") + "]")
                                    .find("select[data-attr-widget='flip_switch']");

                    if (!args.IsRefresh) {
                        var _val = ($ddl.val() == enCETriState.Yes ? enCETriState.No : enCETriState.Yes);

                        $ddl.val(_val);
                    }

                    $ddl.trigger("change");

                }
            });

            var $list = $element.find(".FlipSwitchChildToggles");

            $.each($list, function () {
                $(this).closest(".FlipSwitchInline").trigger("click.inlineFlipSwitch", { "IsRefresh": true });
            });

        },  //end: BindFlipSwitchEvents

        "BindFileUploadEvents": function (options) {

            options = util_extend({ "Element": null, "Parent": null }, options);

            var $element = $(options.Element);
            var $parent = $(options.Parent);

            if ($parent.length != 1) {
                util_logError("BindFileUploadEvents :: missing required parameter of Parent");
            }

            $parent.off("remove.uploads_cleanup");
            $parent.on("remove.uploads_cleanup", function (e, args) {
                var _uploads = ($parent.data("uploads-cleanup") || {});
                var _arr = [];

                for (var _fileName in _uploads) {
                    _arr.push(_fileName);
                }

                if (_arr.length) {
                    GlobalService.UserTempFileUploadCleanup(_arr);
                }
            });

            $parent.off("events.uploads_setSavedFiles");
            $parent.on("events.uploads_setSavedFiles", function (e, args) {

                args = util_extend({ "List": [] }, args);

                if (args.List && args.List.length > 0) {

                    var _uploads = ($parent.data("uploads-cleanup") || {});

                    for (var i = 0; i < args.List.length; i++) {
                        var _fileName = args.List[i];

                        delete _uploads[_fileName];
                    }
                }
            });

            $element.removeData(CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK);
            $element.data(CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK, function (uploadOpts) {

                var _uploads = $parent.data("uploads-cleanup");

                if (!_uploads) {
                    _uploads = {};
                    $parent.data("uploads-cleanup", _uploads);
                }

                _uploads[uploadOpts.UploadFileName] = true;

                if (uploadOpts["PreviousUploadFileName"]) {
                    delete _uploads[uploadOpts.PreviousUploadFileName];
                }

                $element.trigger("events.onFileUploadSuccess", {
                    "Trigger": $element, "UploadOptions": uploadOpts, "OnClearUpload": function () {
                        $element.trigger("events.fileUpload_clear");
                    }
                });

            });

        },  //end: BindFileUploadEvents

        "BindBridgeListSelectionView": function(options) {

            options = util_extend({
                "RenderMode": "dropdown", //supported modes: "dropdown" (default), "searchable"
                "Controller": null, "Element": null, "IsDraggable": false, "ButtonCssClass": null, "IsDefaultLinkEnabled": false, "IsItemSizeSmall": false,
                "IsItemInlineView": false,
                "IsViewMode": false,
                "DefaultLabel": "",
                "Data": [], "PropertyText": null, "PropertyID": null, "IsDynamicValueMode": false,
                "BridgeData": null, "PropertyBridgeID": null, "PropertyBridgeIDName": null, "BridgeEntityInstance": null,
                "PropertyBridgeItemDisplayOrder": null,   //(optional) used to specify that the display order should be set for bridge item for draggable items
                "AllowInvalidSelection": false, "IsDefaultInvalidSelected": true,
                "IsSingleModeSelection": false,
                "ItemNotAvailableLabel": "",
                "Events": {
                    "OnItemPopulate": null  //function(opts){ ... } where opts: { "Element", "ID", "IsAddNew", "Item" }
                },

                "SearchableOptions": null   //supported only for render mode "searchable"
            }, options, true, true);

            var _controller = options.Controller;
            var $element = $(options.Element);
            var _html = "";
            var _btnCssClass = util_forceString(options.ButtonCssClass);
            var _isDefaultLinkEnabled = options.IsDefaultLinkEnabled;
            var _isDynamicValueMode = util_forceBool(options.IsDynamicValueMode, false);
            var _isViewMode = options.IsViewMode;
            var _renderMode = util_forceString(options.RenderMode);
            var _inputHTML = "";

            var _fnHighlightEncoder = options["HighlightEncoder"];
            var _isRenderDelimited = (_isViewMode && _fnHighlightEncoder);

            var _isSingleModeSelection = options.IsSingleModeSelection;

            if (_renderMode == "") {
                _renderMode = "dropdown";
            }

            switch (_renderMode) {

                case "searchable":
                    _inputHTML = "<div class='SearchableView'>" +
                                 "  <input type='text' data-attr-id='search' data-mini='true' data-corners='false' placeholder='Search...' />" +
                                 "  <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' " +
                                 "data-iconpos='notext' title='Clear' />" +
                                 "</div>";
                    break;

                default:

                    _inputHTML = "<select data-attr-id='dropdown' data-corners='false' data-mini='true' />" +
                                 _controller.Utils.HTML.GetButton({
                                     "CssClass": _btnCssClass,
                                     "Content": "Add", "Attributes": { "data-attr-id": "add_link", "data-icon": "plus" }
                                 });

                    break;
            }

            var _itemCssClass = (_isViewMode ? "ViewListSelectionItemLabel" : "ViewListSelectionItem") +
                                (options.IsItemSizeSmall ? " ItemSizeSmall" : "") + (options.IsItemSizeSmall ? " ItemInlineView" : "") + (_isViewMode ? " ViewMode" : "");

            _html += (!_isViewMode ? _inputHTML : "") +
                     "<div class='ContentSelections' />";

            $element.attr("data-selection-view-render-mode", _renderMode);

            $element.toggleClass("DropdownSelectionViewSizeSmall", options.IsItemSizeSmall == true);

            $element.addClass("DropdownSelectionView")
                    .html(_html);

            var _elementFields = {};
            var _fnLabelHTML = function (opts) {
                return util_htmlEncode(util_forceString(opts["Label"]) + util_forceString(opts["Delimiter"]));
            };

            //configure available lookup of elements for the render mode
            switch (_renderMode) {

                case "searchable":

                    var _searchableOpts = util_extend({
                        "OnSearch": function (opts) { },
                        "RenderOptionSelectable": null
                    }, options.SearchableOptions);

                    _elementFields["Search"] = $element.find("input[type='text'][data-attr-id='search']");

                    //initialize the searchable field
                    var $searchParent = _elementFields.Search.closest(".SearchableView");

                    var _selectableRenderOpts = util_extend({}, _searchableOpts.RenderOptionSelectable);

                    if (_selectableRenderOpts["OnRenderLabel"]) {
                        _fnLabelHTML = _selectableRenderOpts["OnRenderLabel"];
                    }

                    _selectableRenderOpts["OnItemClick"] = function (opts) {

                        var _isClear = false;
                        var _id = util_forceInt(opts.ID, enCE.None);
                        var $this = $(this);

                        var _clickCallback = function (isRefresh) {
                            var _fn = function () {
                                if (opts.Callback) {
                                    opts.Callback(_isSingleModeSelection);
                                }
                            };

                            if (_isClear || isRefresh) {
                                $this.trigger("events.searchableField_popupOnRefreshSelections", {
                                    "Selections": (_isClear ? [_id] : null), "Callback": _fn,

                                    //if a valid bridge item is selected (i.e. not default not available/specified option), ensure to clear the placeholder selection
                                    "RemoveSelections": (!_isClear && _id != enCE.None ? [enCE.None] : null)
                                });
                            }
                            else {
                                _fn();
                            }
                        };

                        if (opts.IsSelected) {
                            _isClear = (_id == enCE.None || _isSingleModeSelection);

                            if (_isDynamicValueMode && _id != enCE.None && opts["DataItem"]) {
                                var _dataItem = opts.DataItem;

                                _lookup[_id] = _dataItem;
                            }

                            $element.trigger("events._setItem", {
                                "ID": _id, "Callback": _clickCallback
                            });
                        }
                        else {

                            var $vwContent = $element.data("ElementContentSelections");

                            if (!$vwContent || $vwContent.length == 0) {
                                $vwContent = $element.children(".ContentSelections");
                                $element.data("ElementContentSelections", $vwContent);
                            }

                            var $search = $vwContent.find(".ViewListSelectionItem[" + util_htmlAttribute("data-attr-selection-item-id", _id) + "]");

                            if ($search.length == 0) {
                                _clickCallback();
                            }
                            else {
                                $search.trigger("click.remove_item", { "Callback": _clickCallback });
                            }
                        }

                    };  //end: OnItemClick

                    _elementFields.Search
                                  .attr(DATA_ATTRIBUTE_RENDER, "searchable_field")
                                  .data("SearchConfiguration",
                                        {
                                            "RenderMode": "selectable", //set it to be selectable for the render options
                                            "SearchableParent": $searchParent,
                                            "OnSearch": function (opts, callback) {
                                                var $this = $(this);

                                                //set the lookup selections from the current container element to the search trigger
                                                var _lookupSelections = $this.data("LookupSelections");

                                                if (!_lookupSelections) {
                                                    _lookupSelections = $element.data("LookupSelections");

                                                    if (!_lookupSelections) {
                                                        _lookupSelections = {};
                                                        $element.data("LookupSelections", _lookupSelections);
                                                    }

                                                    $this.data("LookupSelections", _lookupSelections);
                                                }

                                                if (_searchableOpts.OnSearch) {
                                                    _searchableOpts.OnSearch.call(this, { "Options": opts, "Callback": callback });
                                                }
                                                else {
                                                    callback(null);
                                                }
                                            },
                                            "RenderOptionSelectable": _selectableRenderOpts
                                        });

                    break;  //end: searchable

                default:
                    _elementFields["Dropdown"] = $element.find("select[data-attr-id='dropdown']");
                    _elementFields["AddButton"] = $element.find(".LinkClickable[data-attr-id='add_link']");
                    break;
            }

            $mobileUtil.refresh($element);

            var $vwContent = $element.children(".ContentSelections");

            var _propText = options.PropertyText;
            var _propID = options.PropertyID;
            var _defaultLabel = options.DefaultLabel;
            var _notAvailableLabel = util_forceString(options.ItemNotAvailableLabel);
            var _allowInvalidSelection = options.AllowInvalidSelection;
            var _isDefaultInvalidSelected = options.IsDefaultInvalidSelected;

            var _bridgeEntityInstance = options.BridgeEntityInstance;
            var _propBridgeID = options.PropertyBridgeID;
            var _propBridgeIDName = options.PropertyBridgeIDName;
            var _isDraggable = (!_isViewMode && options.IsDraggable);

            var _propDisplayOrder = options.PropertyBridgeItemDisplayOrder;

            var _fnOnItemPopulate = (options.Events && options.Events.OnItemPopulate ? options.Events.OnItemPopulate : null);

            $element.removeData("ElementContentSelections");

            $element.off("events._toggleState");
            $element.on("events._toggleState", function(e, args) {

                args = util_extend({ "IsEnabled": true }, args);

                args.IsEnabled = (args.IsEnabled === true);

                if (_elementFields["Dropdown"]) {
                    _elementFields.Dropdown.selectmenu(args.IsEnabled ? "enable" : "disable");
                }

                if (_elementFields["AddButton"]) {
                    _elementFields.AddButton.toggleClass("LinkDisabled", !args.IsEnabled);
                }
            });

            $element.off("events._bindField");
            $element.on("events._bindField", function (e, args) {

                args = util_extend({ "Data": null }, args);

                if (_elementFields["Dropdown"]) {
                    var $ddl = _elementFields.Dropdown;

                    util_dataBindDDL($ddl, args.Data, _propText, _propID, util_forceInt($ddl.val(), enCE.None), true, enCE.None, _defaultLabel);
                }
            });

            $element.off("events._getItemHTML");
            $element.on("events._getItemHTML", function(e, args) {

                var _itemHTML = "";
                var _name = "";

                var _id = util_forceInt(args["ID"], enCE.None);

                var _lookup = ($element.data("Lookup") || {});
                var _item = (_lookup ? _lookup[_id] : null);

                if(_id == enCE.None) {
                    _name = _defaultLabel;
                }
                else {
                    _name = (_item ? _item[_propText] : _notAvailableLabel);
                }

                var _isDisableDrag = (_isDraggable && !_item);

                if (!_isViewMode) {

                    _itemHTML += "<div class='LinkClickable DisableUserSelectable PluginEditorCardView " + _itemCssClass +
                                 (_isDisableDrag ? " DisableDragElement" : "") + "' " +
                                 util_htmlAttribute("data-attr-selection-item-id", _id) + ">" +
                                 "   <div class='Label'>" + _fnLabelHTML({ "From": "item_label", "ItemID": _id, "Label": _name, "IsViewMode": _isViewMode }) + "</div>" +
                                 (!_isDisableDrag ? "<div class='ViewListItemTools'>" : "") + //open optional tag #1
                                 ((!_isDraggable || !_isDisableDrag) ?
                                  _controller.Utils.HTML.GetButton({
                                      "Content": "Delete", "IsHidden": args["HasAnimate"],
                                      "CssClass": (_btnCssClass ? _btnCssClass + " " : "") + (args["IsDisableDefaultState"] ? "" : "LinkDisabled"),
                                      "Attributes": { "data-icon": "delete", "data-iconpos": "right" }
                                  }) :
                                  "") +
                                 (!_isDisableDrag ? "</div>" : "") +   //close optional tag #1
                                 "</div>";
                }
                else {

                    var _delimiter = (args["HasSeparator"] ? ", " : "");

                    _name = util_forceString(_name);

                    if (args["IsDelimitedMode"]) {
                        args["DelimitedResult"] = util_forceString(args["DelimitedResult"]) + _name + _delimiter;
                    }
                    else {
                        _itemHTML += "<span " + util_htmlAttribute("class", _itemCssClass) + " " + util_htmlAttribute("data-attr-selection-item-id", _id) + ">" +
                                     _fnLabelHTML({ "From": "item_label", "ItemID": _id, "Label": _name, "Delimiter": _delimiter, "IsViewMode": _isViewMode }) +
                                     "</span>";
                    }
                }

                args["HTML"] = _itemHTML;

            });

            $element.off("events._setItem");
            $element.on("events._setItem", function (e, args) {

                var _isRefresh = false;

                var _onCallback = function () {
                    if (args.Callback) {
                        args.Callback(_isRefresh);
                    }
                };

                args = util_extend({ "ID": enCE.None, "Callback": null }, args);

                if (args.ID == enCE.None && !_allowInvalidSelection) {
                    _onCallback();
                }
                else {

                    var $search = $vwContent.find(".ViewListSelectionItem[" + util_htmlAttribute("data-attr-selection-item-id", args.ID) + "]");

                    ClearMessages();

                    if ($search.length == 0) {

                        if (_isSingleModeSelection) {
                            $vwContent.empty();
                            _isRefresh = true;
                        }
                        else if (_allowInvalidSelection) {

                            if (!$element.data("is-item-mode")) {
                                $element.data("is-item-mode", true);
                                $vwContent.empty();
                                _isRefresh = true;
                            }

                            if (args.ID == enCE.None) {
                                $vwContent.empty();
                                $element.data("is-item-mode", false);
                                _isRefresh = true;
                            }
                        }

                        var _render = { "ID": args.ID, "HasAnimate": true };

                        $element.trigger("events._getItemHTML", _render);

                        $search = $(_render["HTML"]);

                        $search.hide();

                        $vwContent.append($search);

                        $search.trigger("create");

                        if (_elementFields["Search"]) {
                            _elementFields.Search.trigger("events.searchableField_setSelectionState", { "ID": args.ID, "IsSelected": true });
                        }

                        var _fnAnimateCallback = function () {

                            var $btn = $search.find(".LinkDisabled");

                            $btn.fadeIn();

                            if (_isDefaultLinkEnabled) {
                                $btn.removeClass("LinkDisabled");
                            }

                            _onCallback();
                        };

                        if (_isSingleModeSelection) {
                            $search.show();
                            _fnAnimateCallback();
                        }
                        else {
                            $search.toggle("height", _fnAnimateCallback);
                        }

                    }
                    else {
                        AddUserError("The selected item already exists.", { "IsTimeout": true });
                        _onCallback();
                    }
                }

            }); //end: events._setItem

            $element.off("events._populate");
            $element.on("events._populate", function(e, args) {

                var _result = args;
                
                var $selections = $vwContent.find(".ViewListSelectionItem[data-attr-selection-item-id!='" + enCE.None + "']");

                if (_isSingleModeSelection) {
                    _result["Value"] = null;

                    if ($selections.length == 1) {
                        _result.Value = util_forceInt($selections.attr("data-attr-selection-item-id"), enCE.None);
                    }
                }
                else {

                    var _bridgeList = [];
                    var _srcBridgeList = ($element.data("SourceList") || []);

                    $.each($selections, function (index) {
                        var $this = $(this);
                        var _id = util_forceInt($this.attr("data-attr-selection-item-id"), enCE.None);
                        var _bridgeItem = util_arrFilter(_srcBridgeList, _propBridgeID, _id, true);
                        var _isAddNew = false;

                        if (_bridgeItem.length == 1) {
                            _bridgeItem = _bridgeItem[0];
                        }
                        else {
                            _bridgeItem = new _bridgeEntityInstance();
                            _isAddNew = true;
                        }

                        _bridgeItem[_propBridgeID] = _id;

                        if (_propDisplayOrder) {
                            _bridgeItem[_propDisplayOrder] = (index + 1);
                        }

                        if (_fnOnItemPopulate) {
                            _fnOnItemPopulate.apply(this, [{ "Element": $this, "ID": _id, "Item": _bridgeItem, "IsAddNew": _isAddNew, "Index": index }]);
                        }

                        _bridgeList.push(_bridgeItem);
                    });

                    if (_allowInvalidSelection && _bridgeList.length == 0) {
                        var $search = $vwContent.find(".ViewListSelectionItem[data-attr-selection-item-id='" + enCE.None + "']");

                        _result["HasInvalidItemSelected"] = ($search.length == 1);
                    }

                    _result["List"] = _bridgeList;
                }

            }); //end: events._populate

            $element.off("click.remove_item");
            $element.on("click.remove_item",
                        ".ViewListSelectionItem[data-attr-selection-item-id]" + (options.IsDraggable ? " > .ViewListItemTools > .LinkClickable" : ""), function (e, args) {
                            var $this = $(this).closest(".ViewListSelectionItem");
                            var _id = $this.attr("data-attr-selection-item-id");

                            args = util_extend({ "Callback": null }, args);

                            if (_elementFields["Search"]) {                                
                                _elementFields.Search.trigger("events.searchableField_setSelectionState", { "ID": _id, "IsSelected": false });
                            }

                            $this.removeAttr("data-attr-selection-item-id");

                            $this.find(".LinkDisabled").hide();

                            $this.toggle("height", function() {
                                $this.remove();

                                if (args.Callback) {
                                    args.Callback();
                                }
                            });

                        });

            if (_elementFields["AddButton"]) {
                var $clAdd = _elementFields.AddButton;

                $clAdd.off("click.add_item");
                $clAdd.on("click.add_item", function () {

                    if (!$clAdd.hasClass("LinkDisabled")) {

                        var _id = util_forceInt(_elementFields.Dropdown.val(), enCE.None);

                        $clAdd.addClass("LinkDisabled");

                        $element.trigger("events._setItem", {
                            "ID": _id, "Callback": function () {
                                $clAdd.removeClass("LinkDisabled");
                            }
                        });
                    }

                }); //end: click.add_item
            }

            var _list = (options.Data || []);
            var _lookup = {};

            if (!_isViewMode) {
                $element.trigger("events._bindField", { "Data": _list });
            }

            for(var i = 0; i < _list.length; i++) {
                var _item = _list[i];
                var _id = _item[_propID];

                _lookup[_id] = _item;
            }

            $element.data("Lookup", _lookup);

            var _bridgeList = (options.BridgeData || []);
            var _selectionHTML = "";
            var _lookupCurrentSelections = {};
            
            if (_bridgeList.length == 0 && _allowInvalidSelection && _isDefaultInvalidSelected) {
                var _render = { "ID": enCE.None, "IsDisableDefaultState": _isDefaultLinkEnabled };

                if (_isRenderDelimited) {
                    _render["IsDelimitedMode"] = true;
                }

                $element.trigger("events._getItemHTML", _render);

                if (_isRenderDelimited) {
                    _selectionHTML += _fnHighlightEncoder.call(this, _render["DelimitedResult"]);
                }
                else {
                    _selectionHTML += _render.HTML;
                }

                _lookupCurrentSelections[enCE.None] = true;
            }
            else {

                var _tempStr = "";

                for (var i = 0; i < _bridgeList.length; i++) {
                    var _bridgeItem = _bridgeList[i];
                    var _id = _bridgeItem[_propBridgeID];

                    if (_isDynamicValueMode) {

                        var _temp = {};

                        _temp[_propID] = _id;
                        _temp[_propText] = _bridgeItem[_propBridgeIDName];

                        _lookup[_id] = _temp;
                    }

                    var _render = {
                        "ID": _id, "IsDisableDefaultState": _isDefaultLinkEnabled,
                        "HasSeparator": ((i + 1) != _bridgeList.length)
                    };

                    if (_isRenderDelimited) {
                        _render["IsDelimitedMode"] = true;
                        _render["DelimitedResult"] = _tempStr;
                    }

                    $element.trigger("events._getItemHTML", _render);

                    if (_isRenderDelimited) {
                        _tempStr = _render["DelimitedResult"];
                    }
                    else {
                        _selectionHTML += _render.HTML;
                    }

                    _lookupCurrentSelections[_id] = true;
                }

                if (_isRenderDelimited) {
                    _selectionHTML += _fnHighlightEncoder.call(this, _tempStr);
                }
            }

            $element.data("is-item-mode", _bridgeList.length > 0)
                    .data("LookupSelections", _lookupCurrentSelections);

            if (_renderMode == "searchable" && _elementFields["Search"]) {

                //copy over the selections to the target child
                _elementFields.Search.data("LookupSelections", _lookupCurrentSelections);
            }

            $vwContent.html(_selectionHTML)
                      .trigger("create");

            $element.data("SourceList", _bridgeList);

            $vwContent.toggleClass("EditorDraggableContainer EditorDraggableOn", _isDraggable);

            if (_isDraggable) {

                if (!$vwContent.data("is-init-drag")) {
                    $vwContent.data("is-init-drag", true);

                    _controller.Utils.Sortable({
                        "Controller": _controller, "Containers": $vwContent, "DropOptions": { "IsDisableDropEvent": true },
                        "SelectorDraggable": ".ViewListSelectionItem"
                    });
                }
            }
        },

        "ProcessDeleteToggleButton": function (options) {

            options = util_extend({
                "Trigger": null, "ButtonID": null, "ActionDeleteID": null, "ActionUndoID": null,
                "EntityContextSelector": null,
                "ConfirmationTarget": null, "EntityName": "Item", "OnDeleteCallback": null, "OnUndoCallback": null, "IsPermanentDelete": false, "HasUndoButton": true,
                "OnCancelClick": null
            }, options);

            var $trigger = $(options.Trigger);
            var $entityElement = null;

            if (options.EntityContextSelector && typeof options.EntityContextSelector === "object") {

                //provided as jQuery object
                $entityElement = $(options.EntityContextSelector);
            }
            else {

                //provided as search closest ancestor selector
                $entityElement = $trigger.closest(options.EntityContextSelector);
            }

            options["EntityElement"] = $entityElement;

            if (options.ButtonID == options.ActionDeleteID) {

                var _msgHTML = util_htmlEncode("Delete?");

                if (options.IsPermanentDelete) {
                    if (util_forceString(options.EntityName) == "") {
                        options.EntityName = "Item";
                    }

                    _msgHTML = "<span class='EditorWarningHighlight'>" + util_htmlEncode("Warning: ") + "</span>" +
                               util_htmlEncode("you are about to permanently delete the " + options.EntityName + ". Continue?");
                }

                if (!options.ConfirmationTarget) {
                    options.ConfirmationTarget = options.Trigger;
                }

                util_inlineConfirm({
                    "Target": options.ConfirmationTarget, "Message": _msgHTML, "IsMessageHTML": true, "OnPositiveClick": function () {

                        $entityElement.addClass("DeletedItem EffectStrikethrough");

                        if (options.HasUndoButton && options.ActionUndoID) {
                            var $btnUndo = $entityElement.find("[data-attr-editor-controller-action-btn='" + options.ActionUndoID + "']");

                            if ($btnUndo.length == 0) {
                                $btnUndo = $("<a data-attr-editor-controller-action-btn='" + options.ActionUndoID + "' class='DisableDragElement LinkClickable' " +
                                             "data-role='button' data-icon='back' data-mini='true' data-inline='true' data-theme='transparent'>" +
                                             util_htmlEncode("Undo") +
                                             "</a>");

                                $btnUndo.insertAfter($trigger);
                                $trigger.parent().trigger("create");
                            }

                            $trigger.hide();
                            $btnUndo.show();
                        }

                        if (options.OnDeleteCallback) {
                            options.OnDeleteCallback(options);
                        }
                    },
                    "OnNegativeClick": options.OnCancelClick
                });
            }
            else if (options.ButtonID == options.ActionUndoID) {
                var $btnDelete = $entityElement.find("[data-attr-editor-controller-action-btn='" + options.ActionDeleteID + "']");

                $entityElement.removeClass("DeletedItem EffectStrikethrough");

                $btnDelete.show();
                $trigger.hide();

                if (options.OnUndoCallback) {
                    options.OnUndoCallback(options);
                }
            }

        },   //end: ProcessDeleteToggleButton

        "ProcessEditViewSaveEvent": function (options) {

            options = util_extend({
                "ElementController": null, "DataItem": null, "Trigger": null, "MessageSaved": "Changes have been successfully saved.",
                "CallbackSaveChanges": null, "CallbackOnSuccess": null, "CallbackDismissView": null, "CallbackOnDone": null,
                "PopulateEventName": "events.populateItem"
            }, options);

            var $element = $(options.ElementController);
            var $trigger = $(options.Trigger);

            if (!options.DataItem) {
                options.DataItem = {};
            }

            var _dataItem = options.DataItem;

            ClearMessages();

            var _callbackOnDone = function () {

                if (options.CallbackOnDone) {
                    options.CallbackOnDone();
                }
            };

            $element.trigger(options.PopulateEventName, {
                "Item": _dataItem, "Callback": function () {

                    if (MessageCount() == 0) {

                        var _fnError = function () {
                            $trigger.trigger("events.toggleOverlay", { "IsEnabled": false });

                            _callbackOnDone();
                        };

                        $trigger.trigger("events.toggleOverlay", { "IsEnabled": true, "Message": "Saving changes..." });

                        options.CallbackSaveChanges(function (saveItem) {

                            if (util_forceString(options.MessageSaved) != "") {
                                AddMessage(options.MessageSaved);
                            }

                            _callbackOnDone();

                            if (options.CallbackOnSuccess) {
                                options.CallbackOnSuccess(saveItem);
                            }

                            setTimeout(function () {

                                //dismiss the view
                                if (options.CallbackDismissView) {
                                    options.CallbackDismissView();
                                }

                            }, 1000);

                        }, _fnError);

                    }
                    else {
                        _callbackOnDone();
                    }
                }
            });

        },

        "ProcessButtonClick": function (options) {

            var _handled = true;

            options = util_extend({ "Controller": null, "Trigger": null, "ButtonID": null }, options);

            var _controller = options.Controller;

            switch (options.ButtonID) {

                case "dismiss":

                    _controller.Utils.Actions.ToggleEditView({
                        "Controller": _controller, "Trigger": options.Trigger, "IsEnabled": false, "Callback": options["OnDismissCallback"]
                    });
                    break;  //end: dismiss

                default:

                    _handled = false;
                    break;
            }

            return _handled;

        },

        "Sortable": function (options) {

            options = util_extend({
                "Controller": null,
                "Containers": null, "LibraryConfiguration": { "removeOnSpill": false },
                "DropOptions": {
                    "DataAttributeIdentifier": null, "PropertyEntityIdentifier": null, "PropertyDisplayOrder": null,
                    "GetDataItem": function (id, ctx, callCache) { return null; }, "GetUpdateDataList": function (saveItem) { return []; },
                    "IsDisableDropEvent": false, "IsTextDataAttrIdentifier": false
                },
                "SelectorDraggable": null,
                "DisregardSelector": null,  //jQuery selector of items to disregard when finding the prev/next closest siblings for context drop
                "OnValidateDragRequest": function (opts) {
                    //where opts: {"TargetElement", "Source", "Handle": "Sibling" }
                    return true;    //whether it is a valid request to allow dragging
                },
                "OnCloned": null,    //function(opts){ where opts: {"Cloned", "Original", "CloneType"}

                //function(opts){ where opts: {"Element": "DropIntoContainer": "SourceContainer": "PrevDropSibling", "SaveList": _saveList,
                //                             "IsSave":, "SaveContext", "SaveMethod", "SaveParams", "OnSaveSuccess"}
                "OnDrop": null,
                "OnValidateDropRequest": null
            }, options, true, true);

            var _arrDragContainer = [];
            var $dragContainers = $(options.Containers);

            $.each($dragContainers, function () {
                _arrDragContainer.push(this);
            });

            var _dragulaOptions = options.LibraryConfiguration;

            _dragulaOptions["moves"] = function (el, source, handle, sibling) {
                var $this = $(el);
                var $handle = $(handle);
                var _valid = ($this.closest(".EditorDraggableContainer").is(".EditorDraggableOn"));

                if (_valid) {
                    _valid = (!$handle.hasClass("DisableDragElement") &&
                              !$handle.closest(".DisableDragElement, .InlineConfirmation" + (options.SelectorDraggable ? ", " + options.SelectorDraggable : ""))
                                      .is(".DisableDragElement, .InlineConfirmation")
                             );
                }

                if (_valid) {
                    _valid = options.OnValidateDragRequest({ "TargetElement": el, "Source": source, "Handle": handle, "Sibling": sibling });
                }

                return _valid;
            };

            var _dragInstance = dragula(_arrDragContainer, _dragulaOptions);

            _dragInstance.on("cloned", function (clone, original, type) {

                //remove the fixed height attribute for the element
                $(clone).css("height", "auto");

                if (options.OnCloned) {
                    options.OnCloned({ "Clone": clone, "Original": original, "CloneType": type });
                }
            });

            var _dropOptions = options.DropOptions;

            _dragInstance.off("drop");
            _dragInstance.on("drop", function (el, objDropIntoContainer, objSourceContainer, objPreviousSiblingForDrop) {

                var _processDropEvent = !_dropOptions.IsDisableDropEvent;

                if (_processDropEvent && options.DisregardSelector != null) {
                    _processDropEvent = $(el).is(options.DisregardSelector);
                }

                if (_processDropEvent && options.OnValidateDropRequest) {
                    var _dropRequest = {
                        "Element": el, "DropIntoContainer": objDropIntoContainer, "SourceContainer": objSourceContainer, "PrevDropSibling": objPreviousSiblingForDrop,
                        "IsValid": true
                    };

                    options.OnValidateDropRequest(_dropRequest);

                    _processDropEvent = (_dropRequest.IsValid == true);
                }

                if (!_processDropEvent) {
                    return;
                }

                var $dropElement = $(el);
                var _siblingSelector = "[" + _dropOptions.DataAttributeIdentifier + "]" + (options.DisregardSelector != null ? options.DisregardSelector : "");

                var $prevList = $dropElement.prevAll(_siblingSelector);
                var $next = $dropElement.next(_siblingSelector);

                var _saveList = [];

                var _fnGetDataID = function ($obj) {
                    var _dataID = $obj.attr(_dropOptions.DataAttributeIdentifier);

                    if (_dropOptions.IsTextDataAttrIdentifier) {
                        _dataID = util_forceString(_dataID, "");
                    }
                    else {
                        _dataID = util_forceInt(_dataID, enCE.None);
                    }

                    return _dataID;
                };

                var _currentDataItemID = _fnGetDataID($dropElement);
                var _searchNextDataItemID = _fnGetDataID($next);

                var _displayOrder = 0;
                var _callCacheGetItem = {};
                var _currentDataItem = _dropOptions.GetDataItem(_currentDataItemID, $dropElement, _callCacheGetItem);
                var _nextDataItem = _dropOptions.GetDataItem(_searchNextDataItemID, $next, _callCacheGetItem);

                if (_nextDataItem) {
                    _displayOrder = util_forceInt(_nextDataItem[_dropOptions.PropertyDisplayOrder], 0);
                }

                if ($prevList.length == 0) {

                    //start of list, set the current data item display order to be one less than the next element
                    _currentDataItem[_dropOptions.PropertyDisplayOrder] = _displayOrder - 1;
                    _saveList.push(_currentDataItem);
                }
                else {

                    //middle or end of list
                    if (!$next.length) {
                        _displayOrder = $prevList.length + 1;
                    }

                    _currentDataItem[_dropOptions.PropertyDisplayOrder] = --_displayOrder;
                    _saveList.push(_currentDataItem);

                    //NOTE: traverse from closest element first [i.e. the order in which prevAll(...) returns the list]
                    for (var i = 0; i < $prevList.length; i++) {
                        var $detail = $($prevList.get(i));
                        var _dataItem = _dropOptions.GetDataItem(_fnGetDataID($detail), $detail, _callCacheGetItem);

                        _displayOrder--;

                        _dataItem[_dropOptions.PropertyDisplayOrder] = _displayOrder;

                        _saveList.push(_dataItem);
                    }
                }

                var _opts = {
                    "Element": el, "DropIntoContainer": objDropIntoContainer, "SourceContainer": objSourceContainer, "PrevDropSibling": objPreviousSiblingForDrop,
                    "SaveList": _saveList,
                    "IsSave": true,
                    "IsAppService": false,
                    "SaveContext": GlobalService,
                    "SaveMethod": null,
                    "SaveParams": null,
                    "ForceParseResult": false,  //whether the save result should be parsed to JSON from string value
                    "OnSaveSuccess": function (saveItem, updateOpts) { }
                };

                if (options.OnDrop) {
                    options.OnDrop(_opts);
                }

                if (_opts.IsSave) {

                    var _fnError = function () {

                        if (options.Controller) {

                            var _controller = options.Controller;

                            $(_controller.DOM.Element).trigger("events.toggleOverlay", {
                                "IsEnabled": true, "Message": "Click here to reload the page.", "IsHTML": true,
                                "OnClick": function () {

                                    $(_controller.DOM.Element).trigger("events.toggleOverlay", { "IsEnabled": false });
                                    _controller.Bind({ "IsRefresh": true });
                                }
                            });
                        }

                    };  //end: _fnError

                    var _fnOnSave = function (saveItem) {

                        if (_opts.ForceParseResult) {
                            saveItem = util_parse(saveItem);    //force parse from string to JSON object
                        }

                        //update the modified items and related elements
                        var _updatedRefList = [];
                        var _lookupUpdates = {};

                        var _selector = "";
                        var _fnAddUpdate = function (item) {

                            var _id = item[_dropOptions.PropertyEntityIdentifier];

                            _lookupUpdates[_id] = item;

                            _selector += (_selector != "" ? ", " : "") + "[" + util_htmlAttribute(_dropOptions.DataAttributeIdentifier, _id) + "]";
                        };

                        if (_dropOptions.GetUpdateDataList) {
                            _updatedRefList = (_dropOptions.GetUpdateDataList(saveItem) || []);
                        }
                        else if ($.isArray(saveItem)) {
                            _updatedRefList = saveItem;
                        }

                        if (!$.isArray(saveItem)) {
                            _fnAddUpdate(saveItem);
                        }

                        for (var r = 0; r < _updatedRefList.length; r++) {
                            _fnAddUpdate(_updatedRefList[r]);
                        }

                        var $filtered = $(objDropIntoContainer).find(_selector);

                        $.each($filtered, function () {
                            var $this = $(this);
                            var _id = _fnGetDataID($this);

                            $this.data("DataItem", _lookupUpdates[_id]);
                        });

                        //trigger callback of success method
                        if (_opts.OnSaveSuccess) {
                            $dropElement.trigger("events.toggleOverlay", { "IsEnabled": false });
                            _opts.OnSaveSuccess(saveItem, { "UpdatedElements": $filtered, "ReferenceList": _updatedRefList, "DropContainer": objDropIntoContainer });
                        }
                        else {
                            $dropElement.trigger("events.toggleOverlay", { "IsEnabled": false });
                        }

                    };

                    var _fnSaveCallback = null;

                    if (_opts.IsAppService) {

                        _fnSaveCallback = _fnOnSave;

                        _opts.SaveMethod = APP.Service.Action;

                        _opts.SaveParams = util_extend({}, _opts.SaveParams);
                        _opts.SaveParams["_action"] = "SAVE";
                        
                        var _eventArgs = util_extend({}, _opts.SaveParams["_eventArgs"]);

                        _eventArgs["Options"] = util_extend({}, _eventArgs["Options"]);
                        _eventArgs.Options["CallbackGeneralFailure"] = _fnError;

                        _opts.SaveParams["_eventArgs"] = _eventArgs;
                    }
                    else {
                        _fnSaveCallback = global_extEntitySave(_fnOnSave, null, null, { "CallbackGeneralFailure": _fnError });  //end: _saveCallback

                        if (_opts.SaveParams) {
                            _opts.SaveParams["_unbox"] = false;    //ensure the save result is not boxed
                        }
                    }

                    $dropElement.trigger("events.toggleOverlay", { "IsEnabled": true, "Message": "Saving changes..." });
                    
                    _opts.SaveMethod.apply(_opts.SaveContext, [_opts.SaveParams, _fnSaveCallback]);
                }

            });

            return _dragInstance;

        },   //end: Sortable

        "FloatingDropdown": function (options) {

            options = util_extend({
                "Element": null, "Data": [], "OnItemHTML": null, "OnDefaultItemHTML": null, "SelectedValue": null, "OnComplete": null, "OnRender": null,
                "Events": {
                    "OnChange": null
                }
            }, options, true, true);

            var $input = $(options.Element);
            var _inputHTML = "";

            var _fnGetHTML = function (opts) {

                var _html = "";
                var _dataList = (opts["Data"] || []);
                var _fnItemHTML = opts["OnItemHTML"];

                if (_fnItemHTML) {
                    if (opts["OnDefaultItemHTML"]) {
                        _html += opts.OnDefaultItemHTML();
                    }
                    else {
                        _html += _fnItemHTML(null, opts);
                    }

                    for (var i = 0; i < _dataList.length; i++) {
                        var _item = _dataList[i];

                        _html += _fnItemHTML(_item, opts);
                    }
                }

                return _html;

            };  //end: _fnGetHTML

            var _fnConfigureDropdownOptions = function (obj) {

                $(obj).find("[data-option-value]").addClass("LinkClickable EditorDropdownOption");

            };  //end: _fnConfigureDropdownOptions

            _inputHTML += _fnGetHTML(options);

            if (_inputHTML != "") {
                var $temp = $("<div>" + _inputHTML + "</div>");
                var $anchor = null;

                if ($input.is("select")) {
                    $anchor = $input.closest(".ui-select");
                }

                if ($anchor == null || $anchor.length == 0) {
                    $anchor = $input;
                }

                $anchor.addClass("EditorDropdownTrigger");

                $temp.hide()
                     .addClass("DisableUserSelectable ScrollbarPrimary PluginEditorCardView EditorDropdown EditorFloatingDropdown");

                _fnConfigureDropdownOptions($temp);

                $temp.insertAfter($anchor);
                $mobileUtil.refresh($temp);

                $input.data("TargetFloatingView", $temp);

                $temp.off("click.dropdown_selected");
                $temp.on("click.dropdown_selected", ".EditorDropdownOption", function (e, args) {
                    var $item = $(this);
                    var _currentValue = $input.val();
                    var _value = $item.attr("data-option-value");

                    //the selected dropdown option is considered as user input change if it differs from current selection, i.e. updated value
                    var _changed = (util_forceString(_currentValue) != util_forceString(_value));

                    $input.trigger("change.floating_view", { "Value": _value, "IsDismiss": true, "IsUserInput": _changed });
                });

                $input.off("remove.floating_view");
                $input.on("remove.floating_view", function () {
                    $(document).off("click.dismiss_floating_view");
                });

                $input.off("click.floating_view");
                $input.on("click.floating_view", function (e, args) {

                    e.stopPropagation();

                    var $this = $(this);
                    var $vw = $($this.data("TargetFloatingView"));

                    if (!$vw.length || $this.data("is-busy")) {
                        return false;
                    }

                    $this.data("is-busy", true);

                    var _visible = $vw.is(":visible");

                    if (args && args["ForceHidden"] && !_visible) {
                        $this.removeData("is-busy");
                        return false;
                    }

                    if (!_visible) {
                        var $document = $(document);

                        $document.trigger("click.dismiss_floating_view", { "ForceHidden": true });

                        //configure size of floating view
                        $vw.width($this.width());

                        $document.off("click.dismiss_floating_view");
                        $document.on("click.dismiss_floating_view", function (e, args) {

                            args = util_extend({ "ForceHidden": true }, args);

                            $(document).off("click.dismiss_floating_view");
                            $this.trigger("click.floating_view", args);
                        });

                        $vw.off("click.stopBubble_floating_view");
                        $vw.on("click.stopBubble_floating_view", function (e) {
                            e.stopPropagation();
                            return false;
                        });

                        var $window = $(window);

                        $window.off("resize.floating_view");
                        $window.on("resize.floating_view", function () {
                            $(window).off("resize.floating_view");
                            $this.trigger("click.floating_view", { "ForceHidden": true });
                        });
                    }

                    var _fn = function () {
                        var $btn = $this.closest(".ui-btn");

                        $mobileUtil.ButtonUpdateIcon($btn, _visible ? "arrow-d" : "arrow-u");

                        $this.removeData("is-busy");
                    };

                    //set the seelcted option element
                    var $options = $vw.find("[data-option-value]");
                    var _value = util_forceString($input.val());

                    var $selected = null;

                    if (_value != "") {
                        $selected = $options.filter("[" + util_htmlAttribute("data-option-value", _value) + "]:first");
                    }

                    $selected = $($selected);

                    $options.not($selected).removeClass("Selected");
                    $selected.addClass("Selected");

                    var $parent = $this.closest(".EditorDropdownTrigger");

                    $parent.toggleClass("StateOpen", !_visible);

                    if (_visible) {

                        //clear the restricted dimensions from previous render
                        $vw.hide()
                           .css({ "top": "", "left": "", "width": "", "max-height": "" });
                    }
                    else {
                        $input.trigger("events.dropdown_popupOnPosition", { "View": $vw });
                        $vw.show();

                        //focus on selected item, if applicable
                        var $selected = $vw.find(".EditorDropdownOption.Selected:first");

                        if ($selected.length == 1) {
                            $vw.scrollTop($selected.position().top);
                        }
                    }

                    _fn();

                    return true;
                });

                $input.off("change.floating_view");
                $input.on("change.floating_view", function (e, args) {
                    args = util_extend({ "Value": null, "IsDismiss": false, "IsUserInput": false }, args);

                    var _value = args.Value;
                    var $label = null;
                    var $selected = null;
                    var $vw = $($input.data("TargetFloatingView"));

                    if (!util_isNullOrUndefined(_value)) {
                        $selected = $vw.find(".EditorDropdownOption[" + util_htmlAttribute("data-option-value", _value) + "]");
                    }

                    if ($selected == null || $selected.length == 0) {
                        $selected = $vw.find(".EditorDropdownOption[data-option-value]:first");
                        _value = ($selected.length == 1 ? $selected.attr("data-option-value") : _value);
                    }

                    if ($selected && $selected.length == 1) {
                        $label = $selected.clone()
                                          .removeClass("EditorDropdownOption EditorDropdownOptionFixedHeight")
                                          .addClass("EditorDropdownCurrentSelected");
                    }

                    var $ddl = $input.closest(".EditorDropdownTrigger");

                    $ddl.find(".ui-btn-inner .ui-btn-text")
                        .html("<div class='EditorDropdownOptionFixedHeight'>&nbsp;</div>");

                    var $vw = $ddl.next(".EditorDropdownSelectionView");

                    if ($vw.length == 0) {
                        $vw = $("<div class='EditorDropdownSelectionView' />");
                        $vw.insertAfter($ddl);
                    }

                    if ($label) {
                        $label.addClass("LinkDisabled");
                    }

                    $vw.empty();

                    if (_value != enCE.None) {
                        $vw.append($label);
                    }

                    if ($label && $label.length == 1) {
                        $input.html("<option style='display: none;' " + util_htmlAttribute("value", _value) + " />");
                        $input.val(_value);
                    }
                    else {
                        $input.empty();
                    }

                    if (args.IsDismiss) {
                        $(document).trigger("click.dismiss_floating_view");
                    }

                    if (args.IsUserInput) {
                        $input.trigger("events.change");
                    }
                });

                $input.off("events.refresh");
                $input.on("events.refresh", function (e, args) {

                    args = util_extend({ "Callback": null }, args);

                    if (options.OnRender) {

                        options.OnRender(function (renderOptions) {
                            var $vw = $($input.data("TargetFloatingView"));
                            var _val = $input.val();

                            $vw.html(_fnGetHTML(renderOptions));
                            $mobileUtil.refresh($vw);

                            _fnConfigureDropdownOptions($vw);

                            if (options["OnComplete"]) {
                                options.OnComplete({ "Element": $vw, "DataList": (renderOptions["Data"] || []), "RenderOptions": options });
                            }

                            $input.trigger("change", { "Value": _val });
                        });
                    }
                });

                $input.off("events.dropdown_toggleState");
                $input.on("events.dropdown_toggleState", function (e, args) {

                    args = util_extend({ "IsEnabled": true }, args);

                    args.IsEnabled = util_forceBool(args.IsEnabled, true);

                    $input.toggleClass("LinkDisabled", args.IsEnabled)
                          .selectmenu(args.IsEnabled ? "enable" : "disable");
                });

                $input.off("events.dropdown_popupOnPosition");
                $input.on("events.dropdown_popupOnPosition", function (e, args) {

                    args = util_extend({ "View": null }, args);

                    var $parent = $anchor;
                    var $vw = $(args.View);

                    var _position = $parent.offset();

                    var _render = {
                        "IsPositionAbove": false,
                        "MaxHeight": 0,
                        "ScrollTop": $(window).scrollTop(),
                        "Target": {
                            "Top": _position.top,
                            "Left": _position.left
                        },
                        "Position": {
                            "Top": null,
                            "Left": _position.left
                        },
                        "Above": {
                            "Top": null,
                            "Height": null
                        },
                        "Below": {
                            "Top": null,
                            "Height": null
                        },
                        "Y": 0
                    };

                    _render.Y = _render.Target.Top - _render.ScrollTop;

                    $vw.css("width", "calc(" + $parent.width() + "px - 2px)");

                    if (typeof (window.innerHeight) == 'number') {
                        _render.MaxHeight = window.innerHeight;
                    }
                    else {
                        if (document.documentElement && document.documentElement.clientHeight) {
                            _render.MaxHeight = document.documentElement.clientHeight;
                        }
                        else {
                            if (document.body && document.body.clientHeight) {
                                _render.MaxHeight = document.body.clientHeight;
                            }
                        }
                    }

                    //default values for modes
                    _render.Above.Top = _render.Position.Top;
                    _render.Above.Height = _render.MaxHeight;

                    _render.Below.Top = _render.Position.Top;
                    _render.Below.Height = _render.MaxHeight;

                    //configure above
                    _render.Above.Top = Math.max(_render.Y - $vw.outerHeight(), 0);
                    _render.Above.Top += _render.ScrollTop + 5;
                    _render.Above.Height = _render.Y - 5;

                    //configure below
                    var _height = $parent.outerHeight();

                    _render.Below.Top = _render.Target.Top + _height;
                    _render.Below.Height -= (_render.Y + _height);
                    _render.Below.Height *= 0.98;

                    //determine which has the most space to render
                    var _mode = null;

                    if (_render.Above.Height > _render.Below.Height) {
                        _render.IsPositionAbove = true;
                        _mode = _render.Above;
                    }
                    else {
                        _render.IsPositionAbove = false;
                        _mode = _render.Below;
                    }

                    _render.Position.Top = _mode.Top;
                    _render.MaxHeight = _mode.Height;

                    $vw.toggleClass("ModeAnchorAbove", _render.IsPositionAbove)
                       .toggleClass("ModeAnchorBelow", (_render.IsPositionAbove == false));

                    $vw.css({
                        "top": _render.Position.Top + "px", "left": _render.Position.Left + "px",
                        "max-height": _render.MaxHeight + "px"
                    });

                }); //end: events.dropdown_popupOnPosition

                if (options.Events) {
                    if (options.Events.OnChange) {
                        $input.off("events.change");
                        $input.on("events.change", options.Events.OnChange);
                    }
                }

                if (options["OnComplete"]) {
                    options.OnComplete({ "Element": $temp, "DataList": (options["Data"] || []), "RenderOptions": options });
                }
            }

            $input.trigger("change", { "Value": options.SelectedValue });

        },  //end: FloatingDropdown

        "ConfigureTabView": function (option) {
            option = util_extend({ "Conntroller": null, "List": null, "IsDisableTextSelection": true }, option);

            var _controller = option.Controller;

            $.each($(option.List), function () {
                var $this = $(this);

                $this.addClass((option.IsDisableTextSelection ? "DisableUserSelectable " : "") + "EditorTabView");

                $this.off("click.tab_heading");
                $this.on("click.tab_heading", ".LinkClickable.TabItem:not(.LinkDisabled)", function (e, args) {

                    args = util_extend({ "Callback": null }, args);

                    var $tab = $(this);
                    var _tabID = util_forceInt($tab.attr("data-attr-tab-id"), enCE.None);

                    var $parent = $tab.closest(".EditorTabView");
                    var $tabs = $parent.children(".Tab.TabItem");
                    var $indicators = $parent.children(".TabIndicator.TabItem");

                    $tabs.filter(".Selected")
                         .removeClass("Selected LinkDisabled");

                    $indicators.removeClass("Selected");

                    $tab.addClass("Selected LinkDisabled");

                    $indicators.filter("[" + util_htmlAttribute("data-attr-ref-tab-id", _tabID) + "]")
                               .addClass("Selected");

                    var _onClick = $parent.data("OnTabClick");

                    var _clickCallback = function () {

                        var $tabContents = $parent.children(".TabContent");
                        var $currentContent = $tabContents.filter("[" + util_htmlAttribute("data-attr-tab-content-view-id", _tabID) + "]");

                        $tabContents.not($currentContent).addClass("EditorElementHidden");
                        $currentContent.removeClass("EditorElementHidden");

                        if (args.Callback) {
                            args.Callback();
                        }
                    };

                    if (_onClick && util_isFunction(_onClick)) {
                        _onClick({
                            "ID": _tabID, "IsEditable": (util_forceInt($tab.attr("data-attr-tab-is-editable"), enCETriState.Yes) == enCETriState.Yes),
                            "Element": $tab, "Callback": _clickCallback, "RawParams": args
                        });
                    }
                    else {
                        _clickCallback();
                    }

                }); //end: click.tab_heading

                $this.off("events.tab_init");
                $this.on("events.tab_init", function (e, args) {
                    var $contentList = $this.children(".TabContent");

                    $contentList.not(".TabContentNonEditable").remove();
                    $contentList.filter(".TabContentNonEditable").addClass("EditorElementHidden")
                                .data("is-init-data-list", false);    //set flag the tab needs to be initialized
                });

                $this.off("events.tab_onSetHeaderEnabled");
                $this.on("events.tab_onSetHeaderEnabled", function (e, args) {

                    args = util_extend({ "IsEnabled": true }, args);

                    var $tabs = $this.children(".TabItem.Tab[data-attr-tab-id]");
                    var _enabled = args.IsEnabled;

                    $this.toggleClass("EditorTabViewDisabled", !_enabled);
                    $tabs.toggleClass("LinkDisabled", !_enabled);

                }); //end:events.tab_onSetHeaderEnabled
            });

        },   //end: ConfigureTabView

        "HTML": {
            "GetButton": function (options) {

                options = util_extend({
                    "Content": "", "IsHTML": false, "ActionButtonID": null, "LinkURL": null, "Attributes": {}, "CssClass": "", "IsClickable": true, "IsHidden": false,
                    "IsDisabled": false, "IsIconInformation": false
                }, options, true, true);

                var _ret = "";

                var _attrs = util_extend({ "data-role": "button", "data-mini": "true", "data-inline": "true", "data-theme": "transparent" }, options.Attributes);

                if (options.ActionButtonID) {
                    _attrs["data-attr-editor-controller-action-btn"] = options.ActionButtonID;
                }

                if (options.LinkURL) {
                    _attrs["data-rel"] = "external";
                    _attrs["target"] = "_blank";
                    _attrs["href"] = options.LinkURL;

                    options.CssClass = "EffectFocusDisable" + (util_forceString(options.CssClass) != "" ? " " + options.CssClass : "");
                }

                var _cssClass = "DisableDragElement" + (options.IsClickable && !options.IsDisabled ? " LinkClickable" : "") +
                                (options.IsDisabled ? " LinkDisabled" : "");

                if (util_forceString(options.CssClass) != "") {
                    _cssClass += " " + options.CssClass;
                }

                _ret += "<a " + util_htmlAttribute("class", _cssClass);

                if (options.IsHidden) {
                    _attrs["style"] = "display: none;" + util_forceString(_attrs["style"]);
                }

                if (options.IsIconInformation) {
                    _attrs["data-icon"] = "info";
                    _attrs["data-iconpos"] = "notext";

                    options.Content = "";
                }

                if (_attrs["title"]) {
                    _attrs["title"] = util_jsEncode(_attrs["title"]);
                }

                for (var _name in _attrs) {
                    _ret += " " + util_htmlAttribute(_name, _attrs[_name]);
                }

                if (!options.IsHTML) {
                    options.Content = util_htmlEncode(options.Content);
                }

                _ret += ">" + options.Content + "</a>";

                return _ret;
            },

            "FileUploadControl": function (options) {

                options = util_extend({ "Controller": null, "ID": null, "CssClass": null }, options);

                var _controller = options.Controller;

                if (util_forceString(options.ID) == "") {
                    options.ID = "vm_fileUpload_" + renderer_uniqueID();
                }

                var _ret = "<div " + util_htmlAttribute("id", options.ID) + " " +
                           (util_forceString(options.CssClass) != "" ? util_htmlAttribute("class", options.CssClass) + " " : "") +
                           util_renderAttribute("file_upload") + " " +
                           util_htmlAttribute("data-attr-file-upload-exts", util_arrJoinStr(_controller.FileUploadSupportedExt || [], null, "|")) + " " +
                           util_htmlAttribute("data-attr-file-upload-ref-id", options.ID) + " " +
                           util_htmlAttribute("data-attr-file-upload-css-class", "EditorFileUpload") + " " +
                           util_htmlAttribute(CONTROL_FILE_UPLOAD_IS_FORCE_UPLOAD_ON_CHANGE, enCETriState.Yes);

                _ret += " />";

                return _ret;
            },

            "Checkbox": function (options) {

                options = util_extend({ "Attributes": null, "ID": null, "Content": null, "CssClass": null }, options);

                var _attrs = util_extend({ "data-mini": "true", "data-inline": "true", "data-theme": "editor-checkbox-a", "data-corners": "false" }, options.Attributes);

                var _attrLabel = { "data-corners": null, "data-inline": null };

                for (var _name in _attrLabel) {
                    _attrLabel[_name] = _attrs[_name];
                    delete _attrs[_name];
                }

                if (util_forceString(options.ID) != "") {
                    _attrs["id"] = options.ID;
                }

                var _ret = "<label" +
                           (util_forceString(options.CssClass) != "" ? " " + util_htmlAttribute("class", options.CssClass) : "");

                for (var _name in _attrLabel) {
                    _ret += " " + util_htmlAttribute(_name, _attrLabel[_name]);
                }

                _ret += ">" +
                        "   <input type='checkbox'";

                for (var _name in _attrs) {
                    _ret += " " + util_htmlAttribute(_name, _attrs[_name]);
                }

                _ret += " />" +   //close input checkbox tag
                        util_htmlEncode(options.Content) +
                        "</label>";

                return _ret;
            },

            "Pagination": function (options) {

                options = util_extend({
                    "RenderElement": null,  //(optional)
                    "PageSize": 0, "NumItems": 0, "CurrentPage": 1, "IsMinimalFormat": false, "IsPagingDisplayCount": false, "LayoutType": "default"
                }, options);

                var _instance = this;
                var _html = "";

                var _pageSize = util_forceFloat(options.PageSize, 0);
                var $element = $(options.RenderElement);

                if (_pageSize > 0) {
                    var _numItems = util_forceInt(options.NumItems, 1);
                    var _currentPage = util_forceInt(options.CurrentPage, 1);

                    var _numPages = parseInt(Math.ceil(_numItems / parseFloat(_pageSize)), 0);
                    var _html = "";                    

                    if (_numPages == 0) {
                        _numPages = 1;
                    }

                    if (_currentPage < 1) {
                        _currentPage = 1;
                    }

                    if (_currentPage > _numPages) {
                        _currentPage = _numPages;
                    }

                    var _pageCountHTML = "<div class='LabelPageCount'>" + util_htmlEncode("of " + _numPages) + "</div>";

                    switch (options.LayoutType) {

                        case "buttons":
                            var _perNumPageLinksShow = Math.max(util_forceInt(options["NumPageLinksShow"], PAGE_NUM_INDEX_TO_SHOW), 0);

                            var _fnGetNavBtnHTML = function (text, isEnabled, isPrev, pageNo, isCurrent) {
                                var _btn = "";
                                var _linkStyle = "";

                                if (!isCurrent) {

                                    if (isPrev == true) {
                                        _linkStyle = " data-icon='arrow-l'";
                                    }
                                    else if (isPrev == false) {
                                        _linkStyle = " data-icon='arrow-r'";
                                    }
                                }
                                else {
                                    isEnabled = false;
                                }

                                _btn = "<a class='LinkClickable" + (!isEnabled ? " ui-disabled" : "") + "' data-role='button' data-mini='true' " +
                                       "data-inline='true' data-theme='transparent' " +
                                       util_htmlAttribute("data-attr-nav-page-num", pageNo) + " " + _linkStyle + ">" + util_htmlEncode(text) + "</a>";

                                return _btn;

                            };  //end: _fnGetNavBtnHTML

                            _html += _fnGetNavBtnHTML("Prev", (_currentPage != 1), true, _currentPage - 1);

                            if (_perNumPageLinksShow >= 3) {
                                var _numItemsShowBefore = parseInt(Math.ceil((_perNumPageLinksShow - 1) / 2.0), 0);

                                if (_currentPage - _numItemsShowBefore < 1) {
                                    _numItemsShowBefore = _currentPage - 1;
                                }

                                var _numItemsShowAfter = _perNumPageLinksShow - _numItemsShowBefore;

                                if (_currentPage + _numItemsShowAfter > _numPages) {
                                    _numItemsShowAfter = _numPages - _currentPage;
                                }

                                for (var i = _currentPage - _numItemsShowBefore; i <= _currentPage - 1; i++) {
                                    _html += _fnGetNavBtnHTML(i, true, null, i);
                                }

                                _html += _fnGetNavBtnHTML(_currentPage, null, null, _currentPage, true);

                                for (var j = _currentPage + 1; j <= _currentPage + _numItemsShowAfter; j++) {
                                    _html += _fnGetNavBtnHTML(j, true, null, j);
                                }
                            }

                            _html += _fnGetNavBtnHTML("Next", (_currentPage != _numPages), false, _currentPage + 1) +
                                     _pageCountHTML;

                            $element.addClass("PaginationLayoutButtons");

                            break;  //end: buttons

                        default:

                            var _fnGetNavBtnHTML = function (text, isEnabled, isPrev, pageNo) {
                                var _btn = "";

                                if (!options.IsMinimalFormat) {
                                    var _linkStyle = "";

                                    if (isPrev == true) {
                                        _linkStyle = " data-icon='arrow-l'";
                                    }
                                    else if (isPrev == false) {
                                        _linkStyle = " data-icon='arrow-r'";
                                    }

                                    _btn = "<a class='ButtonTheme" + (!isEnabled ? " ui-disabled" : "") + "' data-role='button' data-iconpos='notext' data-mini='true' " +
                                           "data-inline='true' " + util_htmlAttribute("data-attr-nav-page-num", pageNo) + " " + _linkStyle + ">" + text + "</a>";
                                }

                                return _btn;

                            };  //end: _fnGetNavBtnHTML

                            _html += _fnGetNavBtnHTML("Prev", (_currentPage != 1), true, _currentPage - 1);

                            _html += "<select class='DropdownPageView' data-corners='false' data-mini='true' data-inline='true'>";

                            for (var i = 1; i <= _numPages; i++) {
                                _html += "<option " + util_htmlAttribute("value", i) + (_currentPage == i ? " selected='selected'" : "") + ">" +
                                         util_htmlEncode("Page " + i) +
                                         "</option>";
                            }

                            _html += "</select>" +
                                     _pageCountHTML +
                                     _fnGetNavBtnHTML("Next", (_currentPage != _numPages), false, _currentPage + 1);

                            break;  //end: default
                    }

                    if (_numPages == 1 && options.IsMinimalFormat) {

                        //clear current HTML content if there is only a single page and minimal format
                        _html = "";
                    }

                    if (options.IsPagingDisplayCount) {
                        _html += "<div class='LabelPagingItemCount'>" +
                                 "  <b>" + util_htmlEncode("Search results: ") + "</b>" + util_htmlEncode(util_formatNumber(_numItems)) +
                                 "</div>";
                    }
                }

                if ($element.length > 0) {
                    $element.html(_html);
                    $mobileUtil.refresh($element);
                }

                return _html;
            },

            "PlatformFlipSwitchToggles": function (options) {

                var _ret = "";

                options = util_extend({
                    "Controller": null, "Platforms": null, "BridgeList": null, "PropertyBridgePlatformID": null,
                    "ComponentID": enCE.None, "RenderEditorForeignTypeID": enCE.None, "BridgeEditorGroupPermissionList": null
                }, options);

                var _controller = options.Controller;

                var _platforms = (options.Platforms || []);
                var _platformBridgeList = options.BridgeList;

                var _checkSelection = (options.PropertyBridgePlatformID && _platformBridgeList);
                var _hasInlineEditorSwitchHTML = (options.ComponentID != enCE.None && options.RenderEditorForeignTypeID != enCE.None &&
                                                  ((_controller["Utils"] && _controller.Utils["Managers"] && _controller.Utils.Managers["Data"] &&
                                                    _controller.Utils.Managers.Data["InlineEditorGroupSwitchHTML"]) ? true : false
                                                  )
                                                 );

                for (var p = 0; p < _platforms.length; p++) {
                    var _platform = _platforms[p];
                    var _platformID = _platform[enColPlatformProperty.PlatformID];
                    var _selected = false;

                    if (_checkSelection) {
                        _selected = (util_arrFilter(_platformBridgeList, options.PropertyBridgePlatformID, _platformID, true).length == 1);
                    }

                    _ret += "<div class='DisableUserSelectable FlipSwitchInline LinkClickable'>" +
                            " <div " + util_renderAttribute("flip_switch") +
                            (_selected ? " " + util_htmlAttribute(DATA_ATTR_DEFAULT_VALUE, enCETriState.Yes) : "") +
                            " data-corners='false' data-mini='true' style='display: inline-block;' " +
                            util_htmlAttribute("data-attr-platform-toggle-id", _platformID) + "/>" +
                            " <div class='Label'>" + _controller.PluginInstance.Utils.ForceEntityDisplayName({ "Type": "Platform", "Item": _platform }) + "</div>";

                    if (_hasInlineEditorSwitchHTML) {
                        _ret += _controller.Utils.Managers.Data.InlineEditorGroupSwitchHTML({
                            "PlatformID": _platformID, "ComponentID": options.ComponentID, "EditorForeignTypeID": options.RenderEditorForeignTypeID,
                            "BridgeList": options.BridgeEditorGroupPermissionList
                        });
                    }

                    _ret += "</div>";
                }

                return _ret;

            },  //end: PlatformFlipSwitchToggles

            "ParseTextLinkHTML": function (str, options) {

                var _tokens = null;
                var _lookupRegex = null;

                str = util_forceString(str);
                options = util_extend({ "linkClass": "LinkExternal", "linkAttributes": { "data-role": "none", "rel": "external" }, "nl2br": true }, options);

                if (options["HighlightEncoder"]) {

                    _tokens = {};

                    str = options.HighlightEncoder.call(this, str, false, true, _tokens);

                    _lookupRegex = {};

                    for (var _search in _tokens) {

                        //TODO: performance issue?
                        var _regex = new RegExp(_search, "g");

                        _lookupRegex[_search] = _regex;
                    }

                    options["formatHref"] = function (href, type) {

                        //for the href attribute value must remove all the placeholder tokens for the search highlight (since it should not be applied for attribute value)
                        for (var _key in _lookupRegex) {
                            href = href.replace(_lookupRegex[_key], "");
                        }

                        return href;
                    };
                }

                try {
                    str = linkifyStr(str, options);

                    if (_tokens) {

                        for (var _search in _tokens) {

                            //TODO: performance issue?
                            var _regex = new RegExp(_search, "g");

                            str = str.replace(_regex, _tokens[_search]);
                        }
                    }
                } catch (e) {
                    util_log(e);
                }

                return str;
            },

            //Note: also see the Actions related "InputEditorDataType" methods
            "InputEditorDataType": function (options) {

                options = util_extend({ "DataType": enCEEditorDataType.Text, "Attributes": null, "IsRequired": false }, options);

                var _ret = "";
                var _editorDataType = util_forceInt(options.DataType, enCEEditorDataType.Text);

                var _attrInput = util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + " " +
                                 util_htmlAttribute("data-attr-input-data-type", _editorDataType) + " " +
                                 util_htmlAttribute("data-attr-input-is-required", options.IsRequired ? enCETriState.Yes : enCETriState.No);

                if (options.Attributes) {
                    for (var _attr in options.Attributes) {
                        _attrInput += " " + util_htmlAttribute(_attr, options.Attributes[_attr]);
                    }
                }

                switch (_editorDataType) {

                    case enCEEditorDataType.Text:
                        _ret = "<input type='text' data-corners='false' data-mini='true' " + _attrInput + " />";
                        break;

                    case enCEEditorDataType.FreeText:
                        _ret = "<textarea class='ScrollbarPrimary' data-corners='false' data-mini='true' " + _attrInput + " />";
                        break;

                    case enCEEditorDataType.Date:

                        if (options["IsDatePickerRenderer"]) {
                            _ret = "<div " + util_renderAttribute("datepickerV2") + " " + _attrInput + " />";
                        }
                        else {
                            _ret = "<div " + util_renderAttribute("pluginEditor_dropdownDatePicker") + " " + _attrInput + " />";
                        }

                        break;

                    case enCEEditorDataType.Dropdown:

                        var _isValidateExcludeLookupNumericDefault = false;

                        if (options["FieldItem"]) {
                            var _renderList = options.FieldItem["_renderList"];

                            if (_renderList) {
                                _isValidateExcludeLookupNumericDefault = util_forceBool(_renderList["IsExcludeLookupNumericDefault"], _isValidateExcludeLookupNumericDefault);
                            }
                        }

                        _ret = "<select data-mini='true' data-corners='false' " + 
                               util_htmlAttribute("data-attr-dropdown-is-validate-exclude-default",
                                                  _isValidateExcludeLookupNumericDefault ? enCETriState.Yes : enCETriState.No) + " " +
                               _attrInput + " />";

                        break;  //end: Dropdown

                    case enCEEditorDataType.Listbox:

                        var _isListBoxPopup = false;

                        if (options["FieldItem"]) {
                            var _renderList = options.FieldItem["_renderList"];

                            if (_renderList) {
                                var _isMultiple = (_editorDataType == enCEEditorDataType.Listbox);

                                _isListBoxPopup = (_isMultiple && util_forceBool(_renderList["IsListBoxPopupMode"], false));
                            }
                        }

                        if (_isListBoxPopup) {


                            _ret = "<div class='ListBoxPopup' " + _attrInput + ">" +
                                   "    <a class='LinkClickable ButtonTheme' data-role='button' data-theme='transparent' data-corners='false' data-inline='true' " +
                                   "data-mini='true' data-icon='plus' data-list-box-btn='add_new' style='display: none;'>" +
                                   util_htmlEncode("Add New") +
                                   "    </a>" +
                                   "    <a class='LinkClickable ButtonTheme' data-role='button' data-theme='transparent' data-corners='false' data-inline='true' " +
                                   "data-mini='true' data-icon='search' data-list-box-btn='edit'>" +
                                   util_htmlEncode("Edit") +
                                   "    </a>" +
                                   "    <div class='ListBoxSelections' />" +
                                   "</div>";
                        }
                        else {
                            _ret = "<select class='ScrollbarPrimary Listbox' multiple='multiple' data-role='none' " + _attrInput + " />";
                        }

                        break;

                    case enCEEditorDataType.FlipSwitch:
                        _ret = "<div class='FlipSwitchInline'>" +
                               "    <div " + util_renderAttribute("flip_switch") + " " + _attrInput + " " +
                               util_htmlAttribute("data-flip-switch-is-mini", enCETriState.Yes) + " />" +
                               "</div>";
                        break;

                    case enCEEditorDataType.File:

                        var _id = util_forceString(options["FileUploadID"]);
                        var _canLinkExternal = util_forceBool(options["CanLinkExternal"], true);

                        if (_id == "") {
                            _id = "File_" + renderer_uniqueID();
                        }

                        _ret = "<div " + _attrInput + " " + util_htmlAttribute("id", _id) + " " +
                               util_renderAttribute("file_upload") + " class='EditorInlineFileUploadView' " +
                               util_htmlAttribute("data-attr-file-upload-exts", util_arrJoinStr(options["FileUploadSupportedExt"] || [], null, "|")) + " " +
                               util_htmlAttribute("data-attr-file-upload-ref-id", _id) + " " +
                               util_htmlAttribute("data-attr-file-upload-css-class", "EditorFileUpload") + " " +
                               util_htmlAttribute("data-attr-file-upload-can-link-external", _canLinkExternal ? enCETriState.Yes : enCETriState.No) + " " +
                               util_htmlAttribute(CONTROL_FILE_UPLOAD_IS_FORCE_UPLOAD_ON_CHANGE, enCETriState.Yes) + " />";

                        break;

                    case enCEEditorDataType.UserControl:
                        _ret = "<div " + _attrInput + ">" + util_htmlEncode("LOADING...") + "</div>";
                        break;

                    case enCEEditorDataType.Label:

                        var _readOnlyDataType = util_forceInt(options["ReadOnlyDataType"], enCE.None);

                        if (_readOnlyDataType == enCE.None) {
                            _readOnlyDataType = util_forceInt(util_propertyValue(options, "FieldItem._options.ReadOnlyDataType"), _readOnlyDataType);
                        }

                        _ret = "<div class='LabelContent' " + _attrInput + " " +
                               util_htmlAttribute("data-attr-read-only-data-type", _readOnlyDataType) + ">" +
                               "&nbsp;" +
                               "</div>";
                        break;

                    default:
                        _ret = "<div " + _attrInput + ">" + "&nbsp;" + "</div>";
                        break;
                }

                return _ret;

            },  //end: InputEditorDataType

            "RenderOptionTableHTML": function (options) {

                options = util_extend({
                    "Controller": null, "List": null, "IsSummaryView": false, "IsRenderAllModes": false, "Attributes": {},
                    "CssClass": null, "IsLayoutFreeFlow": false,
                    "OnRenderLoopItemHTML": null,    //format: function(opts){ ... } where opts is: { "Index", "List" } and return HTML string to append
                    "HasPlaceholders": false
                }, options);

                var _ret = "";
                var _controller = options.Controller;

                var _list = (options.List || []);
                var _attr = "";
                var _isSummaryView = util_forceBool(options.IsSummaryView, false);

                var _isLayoutFreeFlow = util_forceBool(options.IsLayoutFreeFlow, false);

                if (options.Attributes) {
                    for (var _name in options.Attributes) {
                        _attr += " " + util_htmlAttribute(_name, options.Attributes[_name]);
                    }
                }

                if (_isLayoutFreeFlow) {
                    _ret += "<div class='TableRenderFieldListView StateLayoutFreeFlowOn" + (util_forceString(options.CssClass) != "" ? " " + options.CssClass : "") + "' " +
                            (_attr != "" ? " " + _attr : "") + ">";
                }
                else {

                    _ret += "<table data-role='none' class='TableRenderFieldListView" + (util_forceString(options.CssClass) != "" ? " " + options.CssClass : "") + "' " +
                            "border='0' cellpadding='3' cellspacing='0'" + (_attr != "" ? " " + _attr : "") + ">" +
                            "   <tbody>";
                }

                var _renderState = {
                    "Index": 0,
                    "Increment": function () {
                        this.Index++;
                    },
                    "Reset": function () {
                        this.Index = 0;
                    }
                };

                var _fnRenderLookupItemCall = function (isPrefix, index, cssClass, field, fieldOptions) {

                    if (options.OnRenderLoopItemHTML) {
                        _renderState["IsPrefix"] = isPrefix;
                        _renderState["List"] = _list;
                        _renderState["ListItem"] = index;
                        _renderState["CssClass"] = cssClass;
                        _renderState["Field"] = field;
                        _renderState["FieldOptions"] = fieldOptions;

                        _ret += util_forceString(options.OnRenderLoopItemHTML.call(this, _renderState));
                    }

                };  //end: _fnRenderLookupItemCall

                for (var i = 0; i < _list.length; i++) {
                    var _field = _list[i];
                    var _isDivider = _field[enColCEditorRenderFieldProperty.IsDivider];
                    var _required = _field[enColCEditorRenderFieldProperty.IsRequired];
                    var _fieldOptions = _field[enColCEditorRenderFieldProperty.Options];
                    var _internalID = _field["_id"];

                    var _cssClass = util_forceString(_fieldOptions ? _fieldOptions["RowCssClass"] : null);

                    _fnRenderLookupItemCall.call(this, true, i, _cssClass, _field, _fieldOptions);

                    _ret += (_isLayoutFreeFlow ?
                             "<div class='TableRow" + (_cssClass != "" ? " " + _cssClass : "") + "' " :
                             "<tr " + util_htmlAttribute("class", _cssClass)
                            ) +
                            util_htmlAttribute("data-attr-render-field-id", _internalID) + ">";

                    if (_isDivider) {
                        if (_isLayoutFreeFlow) {
                            _ret += "<div class='Divider' />";
                        }
                        else {
                            _ret += "<td class='Divider' colspan='2'>" +
                                    "   <div />" +
                                    "</td>";
                        }
                    }
                    else {

                        var _hasPropertyPath = (util_forceString(_field[enColCEditorRenderFieldProperty.PropertyPath]) != "");
                        var _hasCustomLabel = false;
                        var _renderCustomLabelType = "";
                        var _labelAttributes = {};
                        var _inputAttributes = {};

                        if (_fieldOptions && _fieldOptions["IsLink"] == true) {
                            _hasCustomLabel = true;
                            _renderCustomLabelType = "link";
                        }

                        if (_fieldOptions && _fieldOptions["IsDateTime"] == true) {
                            _hasCustomLabel = true;
                            _renderCustomLabelType = "datetime";
                        }

                        if (_fieldOptions && _fieldOptions["InputAttributes"]) {
                            _inputAttributes = _fieldOptions["InputAttributes"];
                        }

                        if (_hasCustomLabel) {
                            _labelAttributes["data-render-label-type"] = _renderCustomLabelType;
                        }

                        var _render = {
                            "Heading": "<div class='Label'>" +
                                       util_htmlEncode(_field[enColCEditorRenderFieldProperty.Title], true) +
                                       (!_isSummaryView && _required ? "<span class='LabelRequired'>*</span>" : "") +
                                       "</div>",
                            "Content": (_hasPropertyPath ?
                                        _controller.Utils.HTML.GetEntityFieldHTML({
                                            "Controller": _controller,
                                            "IsRenderAllModes": options.IsRenderAllModes,
                                            "PropertyPath": _field[enColCEditorRenderFieldProperty.PropertyPath],
                                            "DataType": _field[enColCEditorRenderFieldProperty.EditorDataTypeID],
                                            "IsRequired": _required,
                                            "HasCustomLabel": _hasCustomLabel,
                                            "Attributes": (_fieldOptions ? _fieldOptions["Attributes"] : null),
                                            "LabelAttributes": _labelAttributes,
                                            "InputAttributes": _inputAttributes,
                                            "Title": _field[enColCEditorRenderFieldProperty.Title],
                                            "FieldItem": _field["_fieldItem"],
                                            "IsSummaryModeOnly": _isSummaryView
                                        }) :
                                        "<span style='color: #FF0000; font-size: 0.75em;'>" + util_htmlEncode("ERROR :: Property path is not specified.") + "</span>"
                                       )
                        };

                        if (options.HasPlaceholders) {
                            _render.Content += "<div class='ToggleView Placeholders'>";

                            _render.Content += "    <div class='Placeholder' />" +
                                               "    <div class='Placeholder TextLine_2' />" +
                                               "    <div class='Placeholder' />";

                            if (i % 3 == 0) {
                                _render.Content += "    <div class='Placeholder TextLine_3' />";
                            }

                            _render.Content += "</div>";
                        }

                        if (_fieldOptions && _fieldOptions["RowFieldNote"]) {
                            var _labelNote = util_forceString(_fieldOptions["RowFieldNote"]);

                            if (_labelNote != "") {
                                _render.Content = "<div class='PropertyNote MaterialLink NoLink'>" +
                                                  "<i class='material-icons'>info</i>" +
                                                  "<div class='Label'><span>" + util_htmlEncode(_labelNote, true) + "</span></div>" +
                                                  "</div>" +
                                                  _render.Content;
                            }
                        }

                        if (_isLayoutFreeFlow) {
                            _ret += "<div class='RC1'>" + _render.Heading + "</div>" +
                                    "<div class='RC2'>" + _render.Content + "</div>";
                        }
                        else {
                            _ret += "<td valign='top' class='Heading'>" + _render.Heading + "</td>" +
                                    "<td valign='top'>" + _render.Content + "</td>";
                        }
                    }

                    _ret += (_isLayoutFreeFlow ? "</div>" : "</tr>");

                    _fnRenderLookupItemCall.call(this, false, i, _cssClass, _field, _fieldOptions);

                    _renderState.Increment();
                }

                if (_isLayoutFreeFlow) {
                    _ret += "</div>";
                }
                else {
                    _ret += "   </tbody>" +
                            "</table>";
                }

                return _ret;

            },   //end: RenderOptionTableHTML

            "GetEntityFieldHTML": function (options) {

                options = util_extend({
                    "Controller": null,
                    "IsRenderAllModes": false,
                    "PropertyPath": null, "DataType": null, "IsRequired": false, "Title": null, "HasCustomLabel": false, "CssClass": null,
                    "FieldItem": null, "IsInputModeOnly": false, "IsSummaryModeOnly": false, "TitleHTML": null,
                    "Attributes": {}, "InputAttributes": {}, "LabelAttributes": {}
                }, options);

                var _controller = options.Controller;
                var _ret = "";

                options.CssClass = util_forceString(options.CssClass);

                _ret += "<div class='PropertyView" + (options.CssClass != "" ? " " + options.CssClass : "") + "' " + util_htmlAttribute("data-attr-prop-path", options.PropertyPath) +
                        (options.HasCustomLabel ? " " + util_htmlAttribute("data-attr-label-is-custom-value", enCETriState.Yes) : "");

                if (options.Attributes) {
                    for (var _attr in options.Attributes) {
                        _ret += " " + util_htmlAttribute(_attr, options.Attributes[_attr]);
                    }
                }

                options.InputAttributes = (options.InputAttributes || {});
                options.InputAttributes["data-field-title"] = util_jsEncode(options.Title);

                //copy over the parent level attributes that are also applicable to input attributes
                var _arr = [{ "p": "InputAttributes", "n": "data-toggle-add-button" }, { "p": "InputAttributes", "n": "data-is-clickable-detail-label" },
                            { "p": "LabelAttributes", "n": "data-is-clickable-labels" }, { "p": "LabelAttributes", "n": "data-detail-label-tooltip-property-path" }
                ];

                for (var i = 0; i < _arr.length && options.Attributes; i++) {
                    var _attr = _arr[i];
                    var _name = _attr.n;

                    if (options.Attributes[_name] !== undefined) {
                        var _lookup = options[_attr.p];

                        _lookup[_name] = options.Attributes[_name];
                    }
                }

                _ret += ">";

                if (options.IsRenderAllModes && !options.IsInputModeOnly) {
                    _ret += "   <div class='ToggleView ViewSummary'>" +
                            _controller.Utils.HTML.InputEditorDataType({
                                "DataType": enCEEditorDataType.Label, "ReadOnlyDataType": options.DataType, "Attributes": options.LabelAttributes
                            }) +
                            "   </div>";
                }

                if (!options.IsSummaryModeOnly) {
                    _ret += "   <div class='" + (options.IsRenderAllModes ? "ToggleView " : "") + "ViewInput" +
                            (options.DataType == enCEEditorDataType.Date ? " InputDatePicker" : "") + "'>" +
                            (options.IsInputModeOnly ? util_forceString(options.TitleHTML) : "") +
                            _controller.Utils.HTML.InputEditorDataType({
                                "DataType": options.DataType, "Attributes": options.InputAttributes, "IsRequired": options.IsRequired, "IsDatePickerRenderer": true,
                                "FieldItem": options.FieldItem
                            }) +
                            "   </div>";
                }

                _ret += "</div>";

                return _ret;

            }  //end: GetEntityFieldHTML

        },

        "LABELS": {
            "DefaultSelection": util_forceString("%%TOK|ROUTE|PluginEditor|LabelDefaultSelection%%"),
            "SaveChanges": "Save Changes",
            "ConfirmSaveChanges": "Are you sure you want to save changes?",
            "CancelChanges": "Discard",
            "ConfirmCancelChanges": "Are you sure you want to revert all changes?",
            "MessageSaveSuccess": "Changes have been successfully saved."
        },

        "Repeater": function (options) {

            options = util_extend({
                "ID": null, "CssClass": null, "PageSize": PAGE_SIZE, "SortEnum": "", "DefaultSortEnum": "", "DefaultSortAsc": null,
                "SortOrderGroupKey": null, "HasDelete": false, "Columns": [],
                "RepeaterFunctions": null, "IsDisablePagingFooter": false, "IsFooterNoRecords": false, "IsTableEnhance": true,
                "DefaultNoRecordMessage": null, "IsNoRecordMessageHTML": false
            }, options);

            var _html = "";
            var $ret = null;
            var _cssClass = util_forceString(options.CssClass);

            options.HasDelete = util_forceBool(options.HasDelete, false);

            var _id = util_forceString(options.ID, "");
            var _sortOrderGroup = null;

            if (_id == "") {
                _id = renderer_uniqueID();
            }

            if (util_forceString(options.SortOrderGroupKey) != "") {
                var $body = $("body");
                var _lookup = $body.data("CPluginEditor.Repeater_SortOrderLookup");

                if (!_lookup) {
                    _lookup = { "Value": {}, "Current": -1000 };
                    $body.data("CPluginEditor.Repeater_SortOrderLookup", _lookup);
                }

                _sortOrderGroup = util_forceString(_lookup.Value[options.SortOrderGroupKey]);

                if (_sortOrderGroup == "") {
                    _sortOrderGroup = _lookup.Current--;
                    _lookup.Value[options.SortOrderGroupKey] = _sortOrderGroup;
                }
            }

            if (!_sortOrderGroup) {
                _sortOrderGroup = (new Date().getTime()) * -1;
            }

            _html += "<div " + util_htmlAttribute("id", _id) + " " + util_renderAttribute("data_admin_list") + " " +
                     util_htmlAttribute("class", "EditorDataAdminListTable" + (_cssClass != "" ? " " + _cssClass : "")) + ">";   //open tag #1

            _html += "<div data-attr-data-template='setting' data-attr-toggle-add-new-link='0'>"; //open setting tag

            _html += "  <div " + util_htmlAttribute("data-attr-data-template-id", "tbl_" + _id) + " data-attr-data-template-renderer='repeater'>";  //open tag #2

            _html += "<div data-attr-repeater-ext='fn' data-attr-is-element-data-functions='" + enCETriState.Yes + "' />" +
                     "<div data-attr-repeater-ext='config' " + util_htmlAttribute("allow-delete", options.HasDelete) + " />" +
                     "<div data-cattr-type='setting' " + util_htmlAttribute("sort-enum", options.SortEnum) + " " +
                     util_htmlAttribute("default-page-size", options.PageSize) + " " +
                     util_htmlAttribute("default-sort", options.DefaultSortEnum) + " " +
                     (options.DefaultSortAsc !== null ? util_htmlAttribute("default-sort-asc", util_forceBool(options.DefaultSortAsc, true)) + " " : "") +
                     util_htmlAttribute("is-footer-default-paging", options.IsDisablePagingFooter ? enCETriState.No : enCETriState.Yes) + " " +
                     util_htmlAttribute("is-footer-no-records-label", options.IsFooterNoRecords ? enCETriState.Yes : enCETriState.No) + " " +
                     util_htmlAttribute("is-table-enhance", options.IsTableEnhance? enCETriState.Yes : enCETriState.No) + " " +
                     util_htmlAttribute("sort-order-group", _sortOrderGroup) +
                     " />";

            //headers
            _html += "<div data-cattr-type='header'>";  //open header tag

            var _arrColumns = (options.Columns || []);

            for (var c = 0; c < _arrColumns.length; c++) {
                var _column = _arrColumns[c];

                _column = util_extend({
                    "Content": "", "IsHTML": false, "SortEnum": "", "CssClass": "", "IsNoLink": false, "HasTooltip": false, "IsTooltipTitleFormat": false
                }, _column);

                _html += "<div data-cattr-type='item' " +
                         (_column.IsNoLink ? util_htmlAttribute("no-link", enCETriState.Yes) : util_htmlAttribute("sort-column", _column.SortEnum)) +
                         (util_forceString(_column.CssClass) != "" ? " " + util_htmlAttribute("css-class", _column.CssClass) : "") +
                         (_column.HasTooltip ? " " + util_htmlAttribute("has-tooltip", enCETriState.Yes) : "") +
                         (_column.IsTooltipTitleFormat ? " " + util_htmlAttribute("is-tooltip-title-format", enCETriState.Yes) : "") +
                         ">" +
                         (_column.IsHTML ? util_forceString(_column.Content) : util_htmlEncode(_column.Content)) +
                         "</div>";
            }

            _html += "</div>";  //close header tag

            _html += "  </div>";    //close tag #2

            _html += "</div>";    //close setting tag

            _html += "<div data-attr-data-template='content' />";

            _html += "</div>";  //close tag #1

            $ret = $("<div>" + _html + "</div>");

            var $vwAdminList = $ret.children("#" + _id);

            if (options.RepeaterFunctions) {
                var _fnFieldValue = options.RepeaterFunctions["FieldValue"];

                options.RepeaterFunctions["Field"] = function (tokenKey, item, vwOpts) {

                    vwOpts = (vwOpts || {});

                    var _val = "";
                    var _opts = {
                        "Key": tokenKey, "Item": item, "IsDeleteIdentifier": false, "IsContent": false, "Index": -1, "DataItemIndex": vwOpts["DataItemIndex"]
                    };

                    switch (tokenKey) {

                        case "%%TEMPLATE_DELETE_ITEM_VALUE%%":
                            _opts.IsDeleteIdentifier = true;
                            break;

                        case "%%TEMPLATE_CELL_CONTENT_0%%":
                        default:

                            var _cellIndex = -1;

                            var _str = util_replaceAll(tokenKey, "%", "");
                            var _found = _str.lastIndexOf("_");

                            var _type = _str.substr(0, _found);
                            var _isContentCell = (_type === "TEMPLATE_CELL_CONTENT");

                            _cellIndex = util_forceInt(_str.substr(_found + 1), _cellIndex);

                            if (_isContentCell && _cellIndex == 0 && options.HasDelete) {

                                //exit the switch statement since the delete toggle is included and the current token is related to the delete cell
                                break;
                            }
                            else if (options.HasDelete) {
                                _cellIndex -= 1;    //offset by one for the delete column
                            }

                            _opts.IsContent = _isContentCell;
                            _opts.Index = _cellIndex;

                            break;

                    }

                    if (_fnFieldValue) {
                        _val = _fnFieldValue(_opts);
                    }

                    return _val;
                };
            }

            $vwAdminList.data("RepeaterFunctions", options.RepeaterFunctions);

            if (options.DefaultNoRecordMessage != null) {
                options.DefaultNoRecordMessage = (!options.IsNoRecordMessageHTML ? util_htmlEncode(options.DefaultNoRecordMessage) : options.DefaultNoRecordMessage);
                $vwAdminList.data("DefaultNoRecordsHTML", options.DefaultNoRecordMessage);
            }

            $ret.attr("data-attr-ref-data-admin-list-id", _id);

            $ret.off("events.refresh_list");
            $ret.on("events.refresh_list", function (e, args) {

                args = util_extend({ "NavigatePageNo": null }, args);

                if (args.NavigatePageNo != null) {
                    args.NavigatePageNo = util_forceInt(args.NavigatePageNo, 0);

                    if (args.NavigatePageNo > 0) {
                        var $tbl = $ret.find("#tbl_" + _id);

                        ctl_repeater_setSortSettingCurrentPage($tbl, args.NavigatePageNo);
                    }
                }

                renderer_event_data_admin_list_repeater_bind("tbl_" + _id);
            });

            return $ret;
        },

        "Events": {

            "UserAccess": function (options) {

                options = util_extend({
                    "Trigger": null, "ClassificationID": enCE.None, "FilterComponentID": enCE.None, "Callback": null,
                    "IsLoadComponentFilters": false
                }, options);

                var _userAccessResult = {
                    "UserRoles": [],
                    "PermissionSummary": {},
                    "LookupPlatformAccess": null    //only populated if valid classification and component ID provided
                };

                var _callback = function () {
                    if (options.Callback) {
                        options.Callback(_userAccessResult);
                    }
                };

                if (options.IsLoadComponentFilters) {
                    var $vwComponentHome = $(options.Trigger).closest(".CEditorComponentHome");

                    options.ClassificationID = util_forceInt($vwComponentHome.attr("data-home-editor-group-classification-id"), enCE.None);
                    options.FilterComponentID = util_forceInt($vwComponentHome.attr("data-home-editor-group-component-id"), enCE.None);
                }

                APP.Service.Action({ "c": "PluginEditor", "m": "UserClassificationPlatformRoleGetByForeignKey" }, function (userRoles) {

                    _userAccessResult.UserRoles = (userRoles ? userRoles.List : null);
                    _userAccessResult.UserRoles = (_userAccessResult.UserRoles || []);

                    APP.Service.Action({
                        "c": "PluginEditor", "m": "EffectivePermissionSummaryUserPlatformRoles",
                        "args": { "UserRoles": util_stringify(_userAccessResult.UserRoles), "IsLookupFormat": true }
                    }, function (permissionSummary) {

                        _userAccessResult.PermissionSummary = (permissionSummary || {});

                        var _classificationID = util_forceInt(options.ClassificationID, enCE.None);
                        var _filterComponentID = util_forceInt(options.FilterComponentID, enCE.None);

                        if (_classificationID != enCE.None && _filterComponentID != enCE.None) {

                            var _permissionSummaryList = (_userAccessResult.PermissionSummary[_classificationID] || []);
                            var _platformCacheKey = "utils-events-userAccess-platforms-" + _classificationID;

                            _userAccessResult.LookupPlatformAccess = {};

                            var $trigger = $(options.Trigger);
                            var _platforms = $trigger.data(_platformCacheKey);

                            var _fn = function () {

                                _platforms = (_platforms || []);

                                for (var p = 0; p < _platforms.length; p++) {
                                    var _platform = _platforms[p];
                                    var _platformID = _platform[enColPlatformProperty.PlatformID];
                                    var _compPermission = false;

                                    _compPermission = util_arrFilterSubset(_permissionSummaryList, function (searchPermSummary) {
                                        return (searchPermSummary[enColCPlatformComponentUserRoleProperty.PlatformID] == _platformID &&
                                                searchPermSummary[enColCPlatformComponentUserRoleProperty.ComponentID] == _filterComponentID &&
                                                searchPermSummary[enColCPlatformComponentUserRoleProperty.IsActive] == true);
                                    }, true);

                                    if (_compPermission.length == 1) {

                                        //only if the current platform component has access
                                        _compPermission = _compPermission[0];

                                        _userAccessResult.LookupPlatformAccess[_platformID] = { "Platform": _platform, "Permission": _compPermission };
                                    }
                                }

                                _callback();

                            };  //end: _fn

                            if (_platforms) {
                                _fn();
                            }
                            else {
                                GlobalService.PlatformGetByForeignKey({ "ClassificationID": _classificationID }, function (platformData) {

                                    _platforms = (platformData ? platformData.List : null);
                                    _platforms = (_platforms || []);

                                    $trigger.data(_platformCacheKey, _platforms);
                                    _fn();
                                });
                            }

                        }
                        else {
                            _callback();
                        }

                    });
                });

            },   //end: UserAccess

            "_getContextClassificationComponentState": function (options) {

                options = util_extend({ "Element": null }, options);

                var $element = $(options.Element);
                var _ret = {
                    "ClassificationID": enCE.None,
                    "ComponentID": enCE.None
                };

                _ret.ClassificationID = util_forceInt($mobileUtil.GetClosestAttributeValue($element, "data-home-editor-group-classification-id"), _ret.ClassificationID);
                _ret.ComponentID = util_forceInt($mobileUtil.GetClosestAttributeValue($element, "data-home-editor-group-component-id"), _ret.ComponentID);

                return _ret;
            },

            "UserClassificationComponentSetting": function (options) {

                options = util_extend({ "HasIndicators": true, "ClassificationID": null, "ComponentID": null, "Name": null, "Callback": null }, options);

                if (options["Element"]) {
                    var _state = this._getContextClassificationComponentState({ "Element": options.Element });

                    options.ClassificationID = _state.ClassificationID;
                    options.ComponentID = _state.ComponentID;
                }

                APP.Service.Action({
                    "_indicators": util_forceBool(options.HasIndicators, true),
                    "c": "PluginEditor", "m": "UserClassificationComponentSetting", "args": {
                        "ClassificationID": options.ClassificationID, "ComponentID": options.ComponentID, "Name": options.Name
                    }
                }, function (result) {
                    if (options.Callback) {
                        options.Callback(result);
                    }
                });
            },

            "SetUserClassificationComponentSetting": function (options) {

                options = util_extend({
                    "HasIndicators": true, "ClassificationID": null, "ComponentID": null, "Name": null, "JSON": null, "Item": null,
                    "Callback": null
                }, options);

                if (typeof options.JSON !== "string") {
                    options.JSON = util_stringify(options.JSON);
                }

                if (options["Element"]) {
                    var _state = this._getContextClassificationComponentState({ "Element": options.Element });

                    options.ClassificationID = _state.ClassificationID;
                    options.ComponentID = _state.ComponentID;
                }

                APP.Service.Action({
                    "_indicators": util_forceBool(options.HasIndicators, true),
                    "c": "PluginEditor", "m": "SetUserClassificationComponentSetting", "args": {
                        "ClassificationID": options.ClassificationID, "ComponentID": options.ComponentID, "Name": options.Name, "JSON": options.JSON,
                        "Item": options.Item
                    }
                }, function (result) {
                    if (options.Callback) {
                        options.Callback(result);
                    }
                });
            }
        },

        "Actions": {

            "InputEditorDataType": function (options) {
                var _ret = null;

                options = util_extend({ "Controller": null, "IsGetValue": true, "Element": null, "IsPrimitiveType": true }, options);

                var $element = $(options.Element);
                var _editorDataType = util_forceInt($element.attr("data-attr-input-data-type"), enCE.None);
                var _controller = options.Controller;

                if (options.IsGetValue) {
                    var _val = $element.val();
                    var _hasValidValue = true;
                    var _isRequired = (util_forceInt($element.attr("data-attr-input-is-required"), enCETriState.None) == enCETriState.Yes);

                    switch (_editorDataType) {

                        case enCEEditorDataType.Text:
                        case enCEEditorDataType.FreeText:
                            _ret = util_trim(_val);

                            _hasValidValue = (_ret != "");
                            break;

                        case enCEEditorDataType.Date:
                            var _dtValue = {};
                            var _isDateRenderer = $element.is("[" + util_renderAttribute("datepickerV2") + "]");

                            if (_isDateRenderer) {

                                _dtValue = renderer_datepicker_getDate($element, { "IsPrimitiveType": options.IsPrimitiveType });

                                if (options.IsPrimitiveType) {
                                    _ret = _dtValue;
                                    _hasValidValue = (_ret ? util_isDate(_ret) : false);
                                }
                                else {
                                    _ret = _dtValue.Value;
                                    _hasValidValue = _dtValue.Value.IsValid(_isRequired);
                                }
                            }
                            else {
                                $element.trigger("events.getValue", _dtValue);

                                _ret = (options.IsPrimitiveType ? _dtValue.Value.ToDate() : _dtValue.Value);

                                //TODO: support for partial date (IsValid function param)
                                _hasValidValue = (_dtValue.Value.IsValid() && _dtValue.Value.IsFullDate());
                            }

                            break;

                        case enCEEditorDataType.Dropdown:

                            var _isExcludeLookupNumericDefault = (util_forceInt($element.attr("data-attr-dropdown-is-validate-exclude-default"),
                                                                                enCETriState.No) == enCETriState.Yes);

                            _ret = _val;

                            if (_isExcludeLookupNumericDefault && _isRequired && util_forceInt(_ret, enCE.None) == enCE.None) {
                                _hasValidValue = false;
                            }

                            break;

                        case enCEEditorDataType.FlipSwitch:
                            var $ddlFlipSwitch = $element.find("select[data-attr-widget='flip_switch']");

                            _ret = (util_forceInt($ddlFlipSwitch.val(), enCETriState.No) == enCETriState.Yes);
                            break;

                        case enCEEditorDataType.Listbox:
                            var _renderMetadata = util_extend({ "InstanceType": null, "PropertyValue": null }, $element.data("RenderMetadata"));

                            _ret = [];

                            if (_renderMetadata.InstanceType && _renderMetadata.PropertyValue) {

                                var _isListBoxPopup = $element.hasClass("ListBoxPopup");

                                if (_isListBoxPopup) {
                                    var $selections = $element.find(".ListBoxSelections > .ItemSelection[item-value]");

                                    _val = [];

                                    $.each($selections, function () {
                                        var $this = $(this);

                                        _val.push($this.attr("item-value"));
                                    });
                                }

                                _val = (_val || []);    //will be an array of the selected list box values

                                var _srcBridgeList = ($element.data("SourceDataList") || []);
                                var _lastBindList = ($element.data("LastBindDataList") || []);

                                for (var v = 0; v < _val.length; v++) {
                                    var _selectedID = util_forceInt(_val[v], enCE.None);
                                    var _bridgeItem = null;

                                    if (_isListBoxPopup) {

                                        //search the current list for the item based on the last data bind for this element
                                        _bridgeItem = util_arrFilter(_lastBindList, _renderMetadata.PropertyValue, _selectedID, true);
                                    }

                                    if (!_bridgeItem || _bridgeItem.length == 0) {
                                        _bridgeItem = util_arrFilter(_srcBridgeList, _renderMetadata.PropertyValue, _selectedID, true);
                                    }

                                    if (_bridgeItem.length == 1) {
                                        _bridgeItem = _bridgeItem[0];
                                    }
                                    else {
                                        _bridgeItem = new _renderMetadata.InstanceType();
                                    }

                                    _bridgeItem[_renderMetadata.PropertyValue] = _selectedID;

                                    _ret.push(_bridgeItem);
                                }
                            }

                            break;  //end: ListBox

                        case enCEEditorDataType.UserControl:

                            var _ucValue = { "ItemValue": null, "ExtPropertyValues": {}, "HasValidValue": _hasValidValue };

                            $element.trigger("events.userControl_getValue", _ucValue);

                            _ret = (options.IsPrimitiveType ? _ucValue.ItemValue : _ucValue);
                            _hasValidValue = _ucValue.HasValidValue;
                            break;

                        case enCEEditorDataType.File:

                            var _uploadedFile = $element.data("LastUploadedFile");
                            
                            var _file = null;
                            var _isDeleteSourceFile = util_forceBool($element.data("FileUploadIsDeleteSource"), false);
                            var _optsExtFile = {};

                            $element.trigger("events.fileUpload_optionsExternalFile", _optsExtFile);

                            _optsExtFile = (_optsExtFile["Result"] || {});

                            var _isExternal = util_forceBool(_optsExtFile["HasExternalFile"], false);

                            if (!util_isNullOrUndefined(_uploadedFile) || _isExternal) {

                                _file = $element.data("SourceFileItem");

                                if (!_file) {
                                    _file = new CEFile_JSON();
                                }

                                _file[enColFileProperty.IsExternal] = _isExternal;

                                if (_isExternal) {
                                    _file[enColFileProperty.ExternalLink] = util_trim(_optsExtFile["URL"]);
                                    _file[enColCEFile_JSONProperty.UploadFileName] = null;
                                }
                                else {
                                    _file[enColFileProperty.ExternalLink] = null;
                                    _file[enColFileProperty.Name] = _uploadedFile["OriginalFileName"];
                                    _file[enColCEFile_JSONProperty.UploadFileName] = _uploadedFile["UploadFileName"];
                                }
                            }

                            _ret = { "FileItem": _file, "UploadedFile": _uploadedFile, "IsDeleteSource": _isDeleteSourceFile };

                            break;

                        case enCEEditorDataType.Label:
                            _ret = null;
                            break;

                        default:
                            _ret = _val;
                            break;
                    }

                    $element.data("is-valid", !_isRequired || _isRequired && _hasValidValue);
                }
                else {

                    //bind the value
                    var _item = options["DataItem"];
                    var _fieldItem = (options["FieldItem"] || {});
                    var _fieldOptions = options["FieldOptions"];    //(optional) will retrieve from field item, if not specified
                    var _propertyPath = options["PropertyPath"];    //(optional) will retrieve from field item, if not specified
                    var _isSelectiveUpdate = util_forceBool(options["IsSelectiveUpdate"], false);   //whether the bind/update should not modify state related data (minor update)
                    var _value = null;

                    if (!_propertyPath) {
                        _propertyPath = _fieldItem["_propertyPath"];
                    }

                    if (!_fieldOptions) {
                        _fieldOptions = _fieldItem["_options"];
                    }

                    if (_propertyPath) {
                        _value = util_propertyValue(_item, _propertyPath);
                    }

                    _fieldOptions = (_fieldOptions || {});

                    switch (_editorDataType) {

                        case enCEEditorDataType.Text:
                        case enCEEditorDataType.FreeText:

                            var _maxLength = util_forceInt(_fieldOptions["MaxLength"], 0);

                            if (_maxLength > 0) {
                                $element.attr("maxlength", _maxLength);
                            }

                            $element.val(util_forceString(_value));
                            break;

                        case enCEEditorDataType.Date:
                            var _isDateRenderer = $element.is("[" + util_renderAttribute("datepickerV2") + "]");
                            var _isFullDate = true;

                            if (util_forceString(_fieldOptions["PropertyIsFullDate"]) != "") {
                                var _propertyIsFullDate = _fieldOptions["PropertyIsFullDate"];

                                _isFullDate = util_forceBool(util_propertyValue(_item, _propertyIsFullDate), _isFullDate);
                            }

                            if (_isDateRenderer) {
                                var _strDate = util_FormatDateTime(_value, null, null, false, { "IsValidateConversion": true });

                                renderer_datepicker_setDate($element, _strDate, { "IsFullDate": _isFullDate });
                            }
                            else {
                                $element.trigger("events.setValue", { "Value": _value, "IsFullDate": _isFullDate });
                            }

                            break;

                        case enCEEditorDataType.Dropdown:
                        case enCEEditorDataType.Listbox:

                            var _renderList = _fieldItem["_renderList"];
                            var _isMultiple = (_editorDataType == enCEEditorDataType.Listbox);
                            var _isListBoxPopup = (_isMultiple && util_forceBool(_renderList["IsListBoxPopupMode"], false));
                            var _arrSelectedValue = [];

                            if (_renderList){
                                var _hasDefault = util_forceBool(_renderList["HasDefault"], !_isMultiple);
                                var _defaultText = util_forceString(_renderList["LabelDefaultText"], "");
                                var _defaultListValue = (_renderList["DefaultListValue"] !== undefined ? _renderList["DefaultListValue"] : enCE.None);

                                if (!_isListBoxPopup) {

                                    //configure the element with events to allow rebinds
                                    $element.off("events.editorInput_bindDDL");
                                    $element.on("events.editorInput_bindDDL", function (e, args) {

                                        args = util_extend({ "Data": undefined, "SelectedValue": $element.val() }, args);

                                        if (args.Data === undefined) {
                                            args.Data = _renderList["Data"];
                                        }

                                        util_dataBindDDL($element, args.Data, _renderList["PropertyText"], _renderList["PropertyValue"], args.SelectedValue,
                                                         _hasDefault, _defaultListValue, _defaultText, util_forceBool(_renderList["HasOptionGroups"], false));
                                    }); //end: events.editorInput_bindDDL

                                    $element.trigger("events.editorInput_bindDDL", { "SelectedValue": null });
                                }
                                else {

                                    //toggle add new button based on data attributes
                                    var _hasAddNew = (util_forceInt($element.attr("data-toggle-add-button"), enCETriState.None) == enCETriState.Yes);

                                    $element.children("[data-list-box-btn='add_new']").toggle(_hasAddNew);
                                }

                                if (_isMultiple) {
                                    var _arr = (_value || []);

                                    if (_renderList["PropertyValue"]) {

                                        var _selectionsHTML = "";
                                        var _fnGetLabelContentHTML = _renderList["GetLabelContentHTML"];

                                        if (!_fnGetLabelContentHTML) {
                                            _fnGetLabelContentHTML = function (opts) {
                                                return util_htmlEncode(opts.Name);
                                            };
                                        }

                                        for (var j = 0; j < _arr.length; j++) {
                                            var _bridgeItem = _arr[j];
                                            var _itemValue = _bridgeItem[_renderList.PropertyValue];

                                            if (_isListBoxPopup) {

                                                var _isClickableLabel = (util_forceInt($element.attr("data-is-clickable-detail-label"), enCETriState.None) != enCETriState.No);

                                                //for the bridge item will retrieve the corresponding "Name" property using the PropertyValue prefix
                                                //(as per code generation structure)
                                                var _name = _bridgeItem[_renderList.PropertyValue + "Name"];

                                                _selectionsHTML += "<div class='ItemSelection' " + util_htmlAttribute("item-value", _itemValue) + ">" +
                                                                   "    <div class='" + (_isClickableLabel ? "LinkClickable " : "") + "Label'>" +
                                                                   _fnGetLabelContentHTML({ "Item": _bridgeItem, "Name": _name }) +
                                                                   "    </div>" +
                                                                   "    <a class='LinkClickable ButtonTheme' data-role='button' data-theme='transparent' data-inline='true' " +
                                                                   "data-mini='true' data-icon='delete' data-iconpos='notext' data-list-box-btn='delete' title='Delete' />" +
                                                                   "</div>";
                                            }
                                            else {

                                                //TODO: possible bug where it requires the bridge item property to be the same as the source data lookup (may not always be true)

                                                _arrSelectedValue.push(_itemValue);
                                            }
                                        }

                                        if (_isListBoxPopup) {
                                            $element.children(".ListBoxSelections")
                                                    .html(_selectionsHTML)
                                                    .trigger("create");
                                        }
                                    }

                                    if (!_isSelectiveUpdate) {
                                        $element.data("SourceDataList", _arr)
                                                .removeData("LastBindDataList");
                                    }
                                    else {
                                        $element.data("LastBindDataList", _arr);
                                    }
                                }
                                else if (_value !== null && _value !== undefined) {

                                    //TODO handle object versus primitive type
                                    _arrSelectedValue.push(_value);
                                }

                                if (_isListBoxPopup && !$element.data("is-init-listbox-popup")) {
                                    $element.data("is-init-listbox-popup", true);

                                    $element.off("click.onListBoxSelectionAction");
                                    $element.on("click.onListBoxSelectionAction", ".LinkClickable[data-list-box-btn]:not(.LinkDisabled)", function (e, args) {

                                        args = util_extend({ "Callback": null }, args);

                                        var $btn = $(this);
                                        var _btnID = $btn.attr("data-list-box-btn");

                                        var _onClickCallback = function () {
                                            $btn.removeClass("LinkDisabled");

                                            if (args.Callback) {
                                                args.Callback();
                                            }
                                        };

                                        $btn.addClass("LinkDisabled");

                                        switch (_btnID) {

                                            case "delete":

                                                dialog_confirmYesNo("Remove", "Are you sure you want to remove the selected item?", function () {

                                                    var $item = $btn.closest(".ItemSelection[item-value]");

                                                    $item.toggle("height", function () {

                                                        $item.remove();
                                                        _onClickCallback();
                                                    });

                                                }, function () {
                                                    _onClickCallback();
                                                });

                                                break;

                                            case "add_new":
                                                $element.trigger("events.onListBoxPopupAddNew", { "Trigger": $btn, "Element": $element, "Callback": _onClickCallback });
                                                break;

                                            case "edit":
                                                $element.trigger("events.onListBoxPopupEdit", { "Trigger": $btn, "Element": $element, "Callback": _onClickCallback });
                                                break;

                                            default:
                                                _onClickCallback();
                                                break;
                                            
                                        }

                                    }); //end: click.onListBoxSelectionAction
                                }
                            }

                            $element.data("RenderMetadata", {
                                "InstanceType": (_renderList ? _renderList["InstanceType"] : null),
                                "PropertyValue": (_renderList ? _renderList["PropertyValue"] : null)
                            });

                            //set selected value(s)
                            if (!_isListBoxPopup) {
                                $element.val(_arrSelectedValue);

                                try {
                                    $element.selectmenu("refresh");
                                } catch (e) {
                                }
                            }

                            break;

                        case enCEEditorDataType.FlipSwitch:
                            var $ddlFlipSwitch = $element.find("select[data-attr-widget='flip_switch']");

                            $ddlFlipSwitch.val(_value === true ? enCETriState.Yes : enCETriState.No)
                                          .slider("refresh");

                            break;

                        case enCEEditorDataType.UserControl:

                            if (_fieldOptions["UserControlInstance"]) {
                                var _ucType = _fieldOptions["UserControlInstance"];

                                if (typeof _ucType === "string") {
                                    _ucType = eval(_ucType);
                                    _fieldOptions["UserControlInstance"] = _ucType;
                                }

                                var _ctl = new _ucType({
                                    "Controller": _controller, "Target": $element, "Item": _item, "Value": _value,
                                    "PropertyPath": _propertyPath, "Field": _fieldItem, "FieldOptions": _fieldOptions
                                });

                                $element.data("UserControl", _ctl);
                            }                            

                            break;

                        case enCEEditorDataType.File:

                            if (!$element.data("is-init-file-upload-input")) {
                                $element.data("is-init-file-upload-input", true);

                                $element.data(CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK, function (uploadOpts) {

                                    uploadOpts = util_extend({ "Element": null, "IsDisableDataOptions": false }, uploadOpts);

                                    $element.trigger("events.onFileUploadSuccess", { "UploadOptions": uploadOpts });

                                    if (util_forceBool(uploadOpts["IsDisableDataOptions"], false) == false) {
                                        $(uploadOpts.Element).data("LastUploadedFile", uploadOpts);
                                    }
                                });

                                $element.data("OnFileUploadClear", function (optsClear) {
                                    optsClear = util_extend({ "Element": null, "Callback": null }, optsClear);

                                    //remove the last uploaded file data flag
                                    $(optsClear.Element).removeData("LastUploadedFile");

                                    if (optsClear.Callback) {
                                        optsClear.Callback();
                                    }
                                });
                            }

                            var _srcFileItemValue = null;

                            if (util_forceString(_fieldOptions["PropertyFileItem"]) != "") {
                                var _propertyFileItem = _fieldOptions["PropertyFileItem"];

                                _srcFileItemValue = util_propertyValue(_item, _propertyFileItem);
                            }

                            if (_srcFileItemValue && util_forceBool(_srcFileItemValue[enColFileProperty.IsExternal]) == true) {
                                $element.trigger("events.fileUpload_setExternalFile", {
                                    "HasExternalFile": true,
                                    "URL": _srcFileItemValue[enColFileProperty.ExternalLink]
                                });
                            }

                            $element.data("SourceFileItem", _srcFileItemValue);

                            break;

                        case enCEEditorDataType.Label:

                            var _contextEditorDataType = util_forceInt($element.attr("data-attr-read-only-data-type"), enCE.None);
                            var _result = {
                                "Item": _item,
                                "PropertyPath": _propertyPath,
                                "FieldItem": _fieldItem,
                                "FieldOptions": _fieldOptions,
                                "EditorDataTypeID": _contextEditorDataType,
                                "IsHandled": false,
                                "IsHTML": false,
                                "Value": _value,
                                "HighlightEncoder": null
                            };

                            //check if the highlight encoder is supported for this element
                            if (options["FieldContentHighligher"] && util_forceInt($element.attr("data-render-has-highlight"), enCETriState.None) == enCETriState.Yes) {
                                _result.HighlightEncoder = options.FieldContentHighligher;
                            }

                            switch (_contextEditorDataType) {

                                case enCEEditorDataType.FlipSwitch:

                                    if (_fieldOptions && _fieldOptions["IsTriState"] && util_isNullOrUndefined(_result.Value)) {
                                        _result.Value = "";
                                    }
                                    else {
                                        _result.Value = (_result.Value == true ? "Yes" : "No");
                                    }

                                    break;

                                case enCEEditorDataType.Date:

                                    if (options["IsDatePickerRenderer"]) {

                                        var _dtValue = _result.Value;

                                        if (typeof _dtValue === "string") {
                                            _dtValue = util_JS_convertToDate(_dtValue);
                                        }

                                        if (util_isNullOrUndefined(_dtValue)) {
                                            _result.Value = "";
                                        }
                                        else {

                                            var $tempDatePicker = $element.children("[" + util_renderAttribute("datepickerV2") + "]");
                                            var _isFullDate = true;

                                            if (util_forceString(_fieldOptions["PropertyIsFullDate"]) != "") {
                                                var _propertyIsFullDate = _fieldOptions["PropertyIsFullDate"];

                                                _isFullDate = util_forceBool(util_propertyValue(_result.Item, _propertyIsFullDate), _isFullDate);
                                            }

                                            if ($tempDatePicker.length == 0) {

                                                var _inputAttrs = (_fieldOptions ? _fieldOptions["InputAttributes"] : null);

                                                _inputAttrs = (_inputAttrs || {});

                                                var _tempHTML = "<div " + util_renderAttribute("datepickerV2");

                                                for (var _attrName in _inputAttrs) {
                                                    _tempHTML += " " + util_htmlAttribute(_attrName, _inputAttrs[_attrName], null, true);
                                                }

                                                _tempHTML += " />";

                                                $tempDatePicker = $(_tempHTML);

                                                $tempDatePicker.hide();
                                                $element.append($tempDatePicker);

                                                $mobileUtil.RenderRefresh($tempDatePicker, true);
                                            }

                                            $tempDatePicker.trigger("events.datepicker_setValue", { "Value": _dtValue, "IsFullDate": _isFullDate });

                                            var _temp = {};

                                            $tempDatePicker.trigger("events.datepicker_getOptions", _temp);

                                            if (_temp && _temp["FormattedValue"]) {
                                                _result.Value = _temp.FormattedValue(_dtValue, true);
                                            }
                                            else {
                                                _result.Value = util_FormatDateTime(_dtVal, null, null, false, { "ForceDayPadding": true, "IsValidateConversion": true });
                                            }
                                        }
                                    }
                                    else {
                                        var $tempDatePicker = $element.children("[" + util_renderAttribute("pluginEditor_dropdownDatePicker") + "]");
                                        var _dtValue = {};

                                        if ($tempDatePicker.length == 0) {
                                            $tempDatePicker = $("<div " + util_renderAttribute("pluginEditor_dropdownDatePicker") + " />");

                                            $tempDatePicker.hide();
                                            $element.append($tempDatePicker);

                                            $mobileUtil.RenderRefresh($tempDatePicker, true);
                                        }

                                        var _isFullDate = true;

                                        if (_fieldOptions && _fieldOptions["PropertyIsFullDate"]) {
                                            var _propPathIsFullDate = _fieldOptions["PropertyIsFullDate"];

                                            _isFullDate = util_forceBool(util_propertyValue(_result.Item, _propPathIsFullDate), _isFullDate);
                                        }

                                        var _dtValue = {};

                                        $tempDatePicker.trigger("events.setValue", { "Value": _result.Value, "IsFullDate": _isFullDate })
                                                       .trigger("events.getValue", _dtValue);

                                        _result.Value = _dtValue.Value.ToString();
                                    }

                                    break;  //end: label date

                                case enCEEditorDataType.Dropdown:
                                case enCEEditorDataType.Listbox:

                                    var _renderList = _fieldItem["_renderList"];
                                    var _isMultiple = (_contextEditorDataType == enCEEditorDataType.Listbox);
                                    var _isListBoxPopup = (_isMultiple && util_forceBool(_renderList["IsListBoxPopupMode"], false));
                                    var _isListBoxCustomLabel = (_isListBoxPopup && util_forceBool(_renderList["IsListBoxDisplayCustomLabel"], false) &&
                                                                 _renderList["GetDisplayLabelHTML"]);
                                    var _isClickableListItems = (_isListBoxPopup &&
                                                                 (util_forceInt($element.attr("data-is-clickable-labels"), enCETriState.None) == enCETriState.Yes));
                                    var _propertyPathLabelDescription = util_forceString(_isListBoxPopup ? $element.attr("data-detail-label-tooltip-property-path") : null);
                                    var _hasDescription = (_propertyPathLabelDescription != "");

                                    if (_renderList && _renderList["PropertyValue"] && _renderList["PropertyText"]) {
                                        var _arrLabels = [];
                                        var _fnAddLabel = function (bridgeItem, searchValue, description) {

                                            if (_isListBoxPopup || _isListBoxCustomLabel) {

                                                //for the bridge item will retrieve the corresponding "Name" property using the PropertyValue prefix
                                                //(as per code generation structure)
                                                var _name = bridgeItem[_renderList.PropertyValue + "Name"];

                                                if (_isClickableListItems || _isListBoxCustomLabel) {
                                                    _arrLabels.push({ "n": _name, "v": searchValue, "item": bridgeItem });
                                                }
                                                else if (_hasDescription) {
                                                    _arrLabels.push({ "n": _name, "description": description });
                                                }
                                                else {
                                                    _arrLabels.push(_name);
                                                }
                                            }
                                            else {

                                                var _search = null;

                                                if (_renderList["HasOptionGroups"]) {

                                                    var _groups = (_renderList["Data"] || []);

                                                    //iterate for each option group and its item (until a match is found)
                                                    for (var g = 0; g < _groups.length; g++) {
                                                        var _group = _groups[g];

                                                        _search = util_arrFilter(_group["Items"], _renderList.PropertyValue, searchValue, true);

                                                        if (_search.length == 1) {
                                                            break;
                                                        }
                                                    }
                                                }
                                                else {
                                                    _search = util_arrFilter(_renderList["Data"], _renderList.PropertyValue, searchValue, true);
                                                }

                                                if (_search && _search.length == 1) {
                                                    _search = _search[0];

                                                    _arrLabels.push(_search[_renderList.PropertyText]);
                                                }
                                            }

                                        };  //end: _fnAddLabel

                                        var _fnBaseGetDisplayLabelHTML = function (opts) {

                                            var _labelHTML = null;

                                            if (opts["HighlightEncoder"]) {
                                                _labelHTML = opts.HighlightEncoder.call(this, opts["Name"]);
                                            }
                                            else {
                                                _labelHTML = util_htmlEncode(opts["Name"]);
                                            }

                                            return _labelHTML;

                                        };  //end: _fnBaseGetDisplayLabelHTML

                                        if (_isMultiple) {

                                            var _arr = (_value || []);

                                            if (_renderList && _renderList["Data"]) {
                                                var _currentSelections = {};
                                                var _lookupDataList = _renderList["Data"];

                                                for (var j = 0; j < _arr.length; j++) {
                                                    var _bridgeItem = _arr[j];
                                                    var _itemValue = _bridgeItem[_renderList.PropertyValue];

                                                    _currentSelections[_itemValue] = _bridgeItem;
                                                }

                                                //loop through all lookup data list and add the bridge item, if applicable (this approach preserves display order)
                                                for (var j = 0; j < _lookupDataList.length; j++) {
                                                    var _lookupDataItem = _lookupDataList[j];
                                                    var _searchValue = _lookupDataItem[_renderList.PropertyValue];
                                                    var _bridgeItem = _currentSelections[_searchValue];

                                                    if (_bridgeItem) {
                                                        _fnAddLabel(_bridgeItem, _searchValue,
                                                                    _hasDescription ? util_propertyValue(_lookupDataItem, _propertyPathLabelDescription) : null
                                                                   );
                                                    }
                                                }
                                            }
                                            else {

                                                for (var j = 0; j < _arr.length; j++) {
                                                    var _bridgeItem = _arr[j];

                                                    //TODO: possible bug where it requires the bridge item property to be the same as the source data lookup (may not always be true)
                                                    var _itemValue = _bridgeItem[_renderList.PropertyValue];

                                                    _fnAddLabel(_bridgeItem, _itemValue);
                                                }
                                            }
                                        }
                                        else {

                                            //dropdown
                                            _fnAddLabel(null, _value);
                                        }

                                        if (_isClickableListItems) {

                                            _result.Value = "";
                                            _result.IsHTML = true;
                                            
                                            var _fnGetDisplayLabelHTML = _fnBaseGetDisplayLabelHTML;

                                            if (_renderList["GetDisplayLabelHTML"]) {
                                                _fnGetDisplayLabelHTML = _renderList["GetDisplayLabelHTML"];
                                            }

                                            for (var v = 0; v < _arrLabels.length; v++) {
                                                var _labelItem = _arrLabels[v];

                                                _result.Value += "<div class='LinkClickable' " + util_htmlAttribute("item-value", _labelItem["v"]) + ">" +
                                                                 _fnGetDisplayLabelHTML({
                                                                     "Item": _labelItem["item"], "Name": _labelItem["n"], "Value": _labelItem["v"],
                                                                     "HighlightEncoder": _result.HighlightEncoder,
                                                                     "BaseGetLabelHTML": _fnBaseGetDisplayLabelHTML
                                                                 }) +
                                                                 "</div>";
                                            }
                                        }
                                        else if (_isListBoxCustomLabel) {
                                            var _fnGetDisplayLabelHTML = _renderList["GetDisplayLabelHTML"];    //required

                                            _result.Value = "";
                                            _result.IsHTML = true;

                                            for (var v = 0; v < _arrLabels.length; v++) {
                                                var _labelItem = _arrLabels[v];

                                                _result.Value += _fnGetDisplayLabelHTML({
                                                    "Item": _labelItem["item"], "Name": _labelItem["n"], "Value": _labelItem["v"],
                                                    "HighlightEncoder": _result.HighlightEncoder,
                                                    "BaseGetLabelHTML": _fnBaseGetDisplayLabelHTML
                                                });
                                            }
                                        }
                                        else if (_hasDescription) {
                                            _result.Value = "";
                                            _result.IsHTML = true;

                                            $element.addClass("ListBoxPopupSummary");

                                            for (var j = 0; j < _arrLabels.length; j++) {
                                                var _itemLabel = _arrLabels[j];
                                                var _tooltip = util_forceString(_itemLabel["description"]);

                                                _result.Value += "<div class='ItemSelection'>" +
                                                                 "<div class='Label'>" + _fnBaseGetDisplayLabelHTML({ "Name": _itemLabel.n }) + "</div>" +
                                                                 "<a data-role='button' data-mini='true' data-inline='true' data-theme='transparent' data-icon='info' " +
                                                                 "data-iconpos='notext' " + util_htmlAttribute("title", _tooltip, null, true) + "></a>" +
                                                                 "</div>";
                                            }
                                        }
                                        else {
                                            _result.Value = util_arrJoinStr(_arrLabels, null, _isListBoxPopup ? "\n" : ", ", "");
                                        }
                                    }

                                    break;  //end: label dropdown, listbox

                                case enCEEditorDataType.UserControl:

                                    if (_fieldOptions["UserControlInstance"]) {
                                        var _ucType = _fieldOptions["UserControlInstance"];

                                        if (typeof _ucType === "string") {
                                            _ucType = eval(_ucType);
                                            _fieldOptions["UserControlInstance"] = _ucType;
                                        }

                                        var _ctl = new _ucType({
                                            "Controller": _controller, "Target": $element, "Item": _item, "Value": _value, "Field": _fieldItem,
                                            "FieldOptions": _fieldOptions,
                                            "IsReadOnly": true,  //set flag to display in read only/label view
                                            "HighlightEncoder": _result.HighlightEncoder
                                        });

                                        $element.data("UserControl", _ctl);

                                        _result.IsHandled = true; //set flag it should not modify the element contents; handled
                                    }

                                    break;
                            }

                            if (!_result.IsHandled) {

                                //check if the value is specified but it is a blank string, in which case use a placeholder non-breaking space
                                if (_result.Value === "") {
                                    _result.IsHTML = true;
                                    _result.Value = "&nbsp;";
                                }
                            }
                            
                            //allow custom overrides for the display values by triggering populate events
                            $element.trigger("events.onActionInputEditorDataType", _result);

                            if (!_result.IsHandled) {

                                if (_contextEditorDataType == enCEEditorDataType.Label) {
                                    var _renderLabelType = util_forceString($element.attr("data-render-label-type"));

                                    switch (_renderLabelType) {

                                        case "datetime":
                                            _result.Value = util_FormatDateTime(_result.Value, "", null, true, { "IsValidateConversion": true });
                                            break;
                                    }
                                }

                                if (!_result.IsHTML && _result.HighlightEncoder) {
                                    _result.Value = _result.HighlightEncoder.call(this, _result.Value);
                                    _result.IsHTML = true;
                                }

                                $element.html(!_result.IsHTML ? util_htmlEncode(_result.Value, true) : util_forceString(_result.Value))
                                        .trigger("create");
                            }                            

                            break;  //end: Label
                    }
                }

                return _ret;
            },

            "Refresh": function (options) {

                options = util_extend({ "Controller": null, "LayoutManager": null, "Callback": null }, options);

                var _controller = options.Controller;

                options.Callback = (options.Callback && util_isFunction(options.Callback) ? options.Callback : null);

                if (options.LayoutManager) {
                    options.LayoutManager.ToggleOverlay({ "IsEnabled": false });
                }

                _controller.Bind({ "IsRefresh": true }, options.Callback);
            },

            "OnError": function (options) {

                var _actionsInstance = this;

                options = util_extend({ "Controller": null, "LayoutManager": null, "OnRefreshCallback": null }, options);

                var _controller = options.Controller;

                options.LayoutManager.ToggleOverlay({
                    "IsEnabled": true, "Message": "Click here to reload the page.", "IsHTML": true,
                    "OnClick": function () {
                        _actionsInstance.Refresh({ "Controller": options.Controller, "LayoutManager": options.LayoutManager, "Callback": options.OnRefreshCallback });
                    }
                });
            },

            "ToggleEditView": function (options) {

                options = util_extend({
                    "Controller": null, "Trigger": null, "LayoutManager": null, "IsEnabled": false, "Title": null, "ContentHTML": null, "SaveButtonID": null,
                    "CustomToolbarButtonHTML": "", "AnimationDuration": null,
                    "Callback": null
                }, options);

                var _controller = options.Controller;

                if (util_isNullOrUndefined(options.AnimationDuration)) {
                    options.AnimationDuration = _controller["AnimationDuration"];

                    if (util_isNullOrUndefined(options.AnimationDuration)) {
                        options.AnimationDuration = "normal";
                    }
                }

                ClearMessages();

                var $trigger = $(options.Trigger);

                var _fnPopup = function () {

                    $trigger.trigger("events.popup", {
                        "AnimationDuration": options.AnimationDuration,
                        "IsEnabled": options.IsEnabled, "Title": options.Title,
                        "Controller": _controller, "Trigger": $trigger,
                        "ToolbarButtons": (options.IsEnabled ? util_forceString(options.CustomToolbarButtonHTML) +
                                                               "<a class='LinkClickable' " +
                                                               util_htmlAttribute("data-attr-editor-controller-action-btn", options.SaveButtonID) +
                                                               " data-role='button' data-icon='check' " +
                                                               "data-mini='true' data-inline='true' data-theme='transparent'>" + util_htmlEncode("Save") + "</a>" +
                                                               "<a class='LinkClickable' data-attr-editor-controller-action-btn='dismiss' data-role='button' " +
                                                               "data-icon='back' data-mini='true' data-inline='true' data-theme='transparent'>" +
                                                               util_htmlEncode("Cancel") + "</a>" : null),
                        "HTML": (options.IsEnabled ? options.ContentHTML : null),
                        "Callback": options.Callback
                    });

                };

                if (options.IsEnabled) {
                    _fnPopup();
                }
                else {
                    _controller.Utils.Actions.Refresh({ "Controller": _controller, "LayoutManager": options.LayoutManager, "Callback": _fnPopup });
                }

            },

            "SaveEntity": function (options) {

                options = util_extend({
                    "Controller": null, "LayoutManager": null, "Trigger": null, "IsAppService": false, "ExecuteContext": null, "Method": null, "Params": null, 
                    "OnSuccess": null, "IsPromptRefreshOnError": true, "IsDisplaySaveMessage": false, "OnErrorCallback": null
                }, options);

                var _controller = options.Controller;
                var _pluginInstance = _controller.PluginInstance;

                var $trigger = $(options.Trigger);

                var _fnError = function () {

                    var _popupState = {};

                    $(_controller.DOM.Element).trigger("events.popup_state", _popupState);

                    //if the current view is popup mode, then disable prompt on refresh
                    if (options.IsPromptRefreshOnError && _popupState && util_forceBool(_popupState["IsVisible"], false)) {
                        options.IsPromptRefreshOnError = false;
                    }

                    if (options.IsPromptRefreshOnError) {

                        $(_controller.DOM.Element).trigger("events.toggleOverlay", {
                            "IsEnabled": true, "Message": "Click here to reload the page.", "IsHTML": true,
                            "OnClick": function () {

                                $(_controller.DOM.Element).trigger("events.toggleOverlay", { "IsEnabled": false });

                                _controller.Bind({ "PluginInstance": _pluginInstance, "LayoutManager": options.LayoutManager, "IsRefresh": true });
                            }
                        });
                    }
                    else {
                        $trigger.trigger("events.toggleOverlay", { "IsEnabled": false });

                        if (options.OnErrorCallback) {
                            options.OnErrorCallback();
                        }
                    }

                };  //end: _fnError

                var _fnSaveCallback = null;

                var _fnPostProcessSave = function () {

                    if (options.IsDisplaySaveMessage) {
                        var _message = null;

                        if (_controller["Utils"] && _controller.Utils["LABELS"]) {
                            _message = _controller.Utils.LABELS["MessageSaveSuccess"];
                        }

                        if (!_message) {
                            _message = "Successfully saved";
                        }

                        AddMessage(_message, null, null, { "IsTimeout": true });
                    }

                };  //end: _fnPostProcessSave

                if (options.IsAppService) {

                    options.ExecuteContext = APP.Service;
                    options.Method = APP.Service.Action;

                    _fnSaveCallback = function (saveItem) {

                        $trigger.trigger("events.toggleOverlay", { "IsEnabled": false });

                        _fnPostProcessSave();

                        if (options.OnSuccess) {
                            options.OnSuccess(saveItem);
                        }
                    };

                    options.Params = util_extend({}, options.Params);
                    options.Params["_action"] = "SAVE";
                    options.Params["_eventArgs"] = util_extend({ "Options": { "CallbackGeneralFailure": _fnError } },
                                                               options.Params["_eventArgs"], true, true);

                }
                else {
                    _fnSaveCallback = global_extEntitySave(function (saveItem) {

                        $trigger.trigger("events.toggleOverlay", { "IsEnabled": false });

                        _fnPostProcessSave();

                        if (options.OnSuccess) {
                            options.OnSuccess(saveItem);
                        }

                    }, null, null, { "CallbackGeneralFailure": _fnError });  //end: _saveCallback

                }

                $trigger.trigger("events.toggleOverlay", { "IsEnabled": true, "Message": "Saving changes..." });

                if (!options.IsAppService && options.Params) {
                    options.Params["_unbox"] = false;    //ensure the save result is not boxed
                }

                options.Method.apply(options.ExecuteContext, [options.Params, _fnSaveCallback]);

            },

            "PopulatePlatformToggleSelections": function (options) {

                var _ret = [];

                options = util_extend({
                    "Element": null, "BridgeEntityInstance": null, "PropertyBridgePlatformID": null, "SourceBridgePlatformList": []
                }, options);

                var $element = $(options.Element);
                var $cbPlatforms = $element.find(".FlipSwitchInline [data-attr-platform-toggle-id] select[data-attr-widget='flip_switch']");

                $.each($cbPlatforms, function () {
                    var $cb = $(this);
                    var _selected = (util_forceInt($cb.val(), enCETriState.No) == enCETriState.Yes);

                    if (_selected) {
                        var _platformID = util_forceInt($mobileUtil.GetClosestAttributeValue($cb, "data-attr-platform-toggle-id"), enCE.None);
                        var _bridgePlatformItem = util_arrFilter(options.SourceBridgePlatformList, options.PropertyBridgePlatformID, _platformID, true);

                        if (_bridgePlatformItem.length == 1) {
                            _bridgePlatformItem = _bridgePlatformItem[0];
                        }
                        else {
                            _bridgePlatformItem = (options.BridgeEntityInstance ? new options.BridgeEntityInstance() : {});
                        }

                        _bridgePlatformItem[options.PropertyBridgePlatformID] = _platformID;

                        _ret.push(_bridgePlatformItem);
                    }
                });

                return _ret;

            },

            "EditorRendererResetState": function (options) {
                options = util_extend({ "List": null, "Callback": null }, options);

                var _queue = new CEventQueue();
                var $list = $(options.List);

                //filter to only be applicable to the plugin editor content renderers
                $list = $list.filter("[" + util_renderAttribute("pluginEditor_content") + "]");

                $.each($list, function () {

                    var $this = $(this);

                    _queue.Add(function (onCallback) {

                        $this.trigger("events.saveContentState", {
                            "IsReset": true, "Callback": function () {

                                $this.find("[" + util_renderAttribute("editor") + "]")
                                     .trigger("blur.homeview_editorContent");

                                onCallback();
                            }
                        });

                    });

                });

                _queue.Run({ "Callback": options.Callback });

            },

            "ButtonUpdate": function (options) {

                options = util_extend({ "Element": null, "ButtonID": null, "Icon": null, "Text": null }, options);

                var $btn = $(options.Element);

                if ($btn.is(".ui-btn")) {

                    if (options.ButtonID) {
                        $btn.attr("data-attr-editor-controller-action-btn", options.ButtonID);
                    }

                    if (options.Icon) {
                        $mobileUtil.ButtonUpdateIcon($btn, options.Icon);
                    }

                    if (options.Text) {
                        $mobileUtil.ButtonSetTextByElement($btn, options.Text);
                    }

                }
            },

            "RefreshExportCache": function (options) {

                options = util_extend({ "Element": null, "Callback": null, "OverrideAction": null }, options);

                var $element = $(options.Element);

                var $userExportList = $element.find("[" + util_renderAttribute("pluginEditor_userExportAction") + "]");
                var _exportQueue = new CEventQueue();
                var _action = options.OverrideAction;

                $.each($userExportList, function () {

                    var $this = $(this);

                    _exportQueue.Add(function (onCallback) {

                        var $btn = $this.find("[" + util_htmlAttribute("data-user-export-type", "refresh") + "]");

                        if ($btn.length == 1) {
                            $btn.trigger("click.userExportAction", { "Callback": onCallback, "OverrideAction": _action });
                        }
                        else {
                            _callback();
                        }
                    });
                });

                _exportQueue.Run({ "Callback": options.Callback });
            }
        },

        "AnimateFromOptions": function (options) {
            options = util_extend({ "AnimationCallback": null }, options);

            if (options.AnimationCallback) {
                options.AnimationCallback();
            }
        },

        "TransitionView": function (options) {

            options = util_extend({ "ActiveElement": null, "AnimationCallback": null, "IsTransition": false, "IsAnimate": true, "PrevActiveView": null }, options);

            var $prevActiveView = $(options.PrevActiveView);
            var $element = $(options.ActiveElement);

            var _callback = function () {
                if (options.AnimationCallback) {
                    options.AnimationCallback();
                }
            };

            if (options.IsTransition && $prevActiveView && $prevActiveView.length && $prevActiveView.not($element) && $prevActiveView.is(":visible")) {

                if (options.IsAnimate) {

                    $prevActiveView.show()
                                   .addClass("EffectBlur")
                                   .slideUp("normal", function () {

                                       $prevActiveView.removeClass("EffectBlur");

                                       $element.toggle("height", function () {
                                           _callback();
                                       });

                                   });
                }
                else {
                    $prevActiveView.hide();
                    $element.show();

                    _callback();
                }
            }
            else {

                if (options.IsTransition) {
                    $element.show();
                }

                _callback();
            }
        }
    };

    return _utils;
}

RENDERER_LOOKUP["pluginEditor_content"] = function (context, options) {

    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_content");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.data("is-init")) {
            $element.data("is-init", true);

            $element.addClass("ContentEditorDisabled");

            $element.off("events.removeTempState");
            $element.on("events.removeTempState", function (e, args) {
                args = util_extend({ "ContentID": null, "IsForceRefresh": false }, args);

                $element.removeAttr("data-attr-home-editor-temp-content-id")
                        .attr("data-attr-home-editor-content-id", args.ContentID);

                var $editor = $element.find("[" + util_renderAttribute("editor") + "]");
                var _id = "editor_" + $mobileUtil.GetClosestAttributeValue($element, "data-attr-home-editor-group-id") + "_" + args.ContentID;

                //remove current editor instance
                $editor.trigger("events.removeInstance", { "ID": $editor.attr("id") });

                $editor.attr("id", _id);

                //force refresh with the new ID
                if (args.IsForceRefresh) {
                    $editor.trigger("events.editor_refresh");
                }
            });

            $element.off("events.saveContentState");
            $element.on("events.saveContentState", function (e, args) {

                var $editor = $element.find("[" + util_renderAttribute("editor") + "]");

                $editor.trigger("events.editor_saveState", args);

            }); //end: events.saveContentState

            $element.off("events.restoreState");
            $element.on("events.restoreState", function (e, args) {

                var $editor = $element.find("[" + util_renderAttribute("editor") + "]");

                $editor.trigger("events.editor_restoreState", args);

            }); //end: events.restoreState

            $element.off("events.setContent");
            $element.on("events.setContent", function (e, args) {
                args = util_extend({ "HTML": "", "IsReadOnly": false, "Tokens": null, "Callback": null }, args);

                var _id = "editor_" + $mobileUtil.GetClosestAttributeValue($element, "data-attr-home-editor-group-id") + "_";
                var _contentID = $element.attr("data-attr-home-editor-content-id");

                if (!_contentID) {

                    //use temp content ID
                    _id += "temp_" + $element.attr("data-attr-home-editor-temp-content-id");
                }
                else {
                    _id += _contentID;
                }

                args.HTML = util_forceString(args.HTML);

                if (args.Tokens) {
                    args.HTML = util_replaceTokens(args.HTML, args.Tokens);
                }

                if (!args.IsReadOnly) {
                    var $editor = $element.find("[" + util_renderAttribute("editor") + "]");
                    var _isInlineEditable = $mobileUtil.GetClosestAttributeValue($element, DATA_ATTR_CONTROL_EDITOR_IS_INLINE_EDITABLE);

                    if ($editor.length == 0) {
                        $editor = $("<div " + util_renderAttribute("editor") + " />");

                        $element.children(".ContentPlaceholder").hide();
                        $element.append($editor);
                    }

                    $editor.attr("id", _id)
                           .attr(DATA_ATTR_CONTROL_EDITOR_IS_INLINE_EDITABLE, _isInlineEditable)
                           .html(args.HTML);

                    $mobileUtil.refresh($element);

                    if (_isInlineEditable == enCETriState.Yes) {
                        $editor.trigger("events.editor_saveState");
                    }
                }
                else {
                    $element.html(args.HTML);
                    $mobileUtil.refresh($element);
                }

                if (args.Callback) {
                    args.Callback();
                }
            });

            $element.off("events.getContent");
            $element.on("events.getContent", function (e, args) {
                args = util_extend({ "Callback": null }, args);

                var $editor = $element.find("[" + util_renderAttribute("editor") + "]");
                var _contentCallback = function (val) {
                    val = util_extend({ "IsModified": false, "HTML": null }, val);

                    if (args.Callback) {
                        args.Callback(val);
                    }
                };

                if ($editor.length == 0) {
                    _contentCallback(null);
                }
                else {
                    $editor.trigger("events.editor_getContent", { "Callback": _contentCallback });
                }
                
            });

            $element.off("events.setEditable");
            $element.on("events.setEditable", function (e, args) {

                args = util_extend({ "IsEditable": false, "IsRestore": false, "Callback": null }, args);

                $element.toggleClass("PluginEditorCardView ContentEditor", args.IsEditable);

                var $editor = $element.find("[" + util_renderAttribute("editor") + "]");

                $editor.attr(DATA_ATTR_CONTROL_EDITOR_IS_INLINE_EDITABLE, args.IsEditable ? enCETriState.Yes : enCETriState.No);

                var $header = null;
                var $footer = null;
                var _fnConfigureEditMode = function () {

                    $element.data("is-init-edit-mode", true);

                    var _isDisableSlideActions = (util_forceInt($element.attr("data-attr-editor-is-disable-slide-actions"), enCETriState.None) == enCETriState.Yes);

                    if (!$header || $header.length == 0) {
                        $header = $("<div class='DisableUserSelctable Header'>" +
                                    "   <div class='ModifiedIndicator" + (_isDisableSlideActions ? " NoBorder" : "") + "'>" +
                                    "       <a data-role='button' data-inline='true' data-icon='info' data-theme='transparent' data-iconpos='notext' />" +
                                    "       <span class='Label'>" + util_htmlEncode("Modified") + "</span>" +
                                    "   </div>" +
                                    (_isDisableSlideActions ? "&nbsp;" :
                                    "   <a class='LinkClickable' data-role='button' data-icon='delete' data-corners='false' data-mini='true' data-inline='true' " +
                                    "data-theme='transparent' data-iconpos='right' data-attr-editor-content-action-btn='delete'>" +
                                    util_htmlEncode("Delete Slide") +
                                    "   </a>"
                                    ) +
                                    "   <a class='LinkClickable' data-role='button' data-icon='back' data-corners='false' data-mini='true' data-inline='true' " +
                                    "data-theme='transparent' data-iconpos='right' data-attr-editor-content-action-btn='undo' style='display: none;'>" +
                                    util_htmlEncode("Undo") +
                                    "   </a>" +
                                    "</div>");

                        $element.prepend($header);
                        $header.trigger("create");
                    }

                    if (!$footer || $footer.length == 0) {
                        $footer = $("<div class='DisableUserSelctable Footer'>" +
                                    (_isDisableSlideActions ? "&nbsp;" :
                                    "   <a class='LinkClickable' data-role='button' data-icon='plus' data-corners='false' data-mini='true' data-inline='true' " +
                                    "data-theme='transparent' data-iconpos='right' data-attr-editor-content-action-btn='add'>" +
                                    util_htmlEncode("Add Slide Below") +
                                    "   </a>"
                                    ) +
                                    "</div>");

                        $element.append($footer);
                        $footer.trigger("create");
                    }

                };

                if (!$element.data("is-init-edit-mode")) {
                    _fnConfigureEditMode();
                }
                else {
                    $header = $element.find(".Header");
                    $footer = $element.find(".Footer");

                    if ($header.length == 0 || $footer.length == 0) {
                        _fnConfigureEditMode();
                    }
                }

                $editor.trigger("events.editor_refresh", {
                    "IsRestore": args.IsRestore,
                    "Callback": function () {

                        if (!args.IsEditable || args.IsRestore) {

                            if ($element.hasClass("DeletedItem")) {
                                var $btns = $header.find("[data-attr-editor-content-action-btn]");

                                $btns.filter("[data-attr-editor-content-action-btn='undo']").hide();
                                $btns.filter("[data-attr-editor-content-action-btn='delete']").show();
                            }

                            $element.removeClass("ContentEditorModified ContentEditorFocused DeletedItem");

                            $element.find(".InlineConfirmButton.NegativeActionButton")
                                    .trigger("click.dismiss", { "IsAnimate": false });

                        }

                        if (args.IsEditable) {

                            $editor.trigger("events.editor_saveState", {
                                "Callback": function (prev) {
                                    if (args.Callback) {
                                        args.Callback();
                                    }
                                }
                            }); //end: editor_saveState call

                        }
                        else if (args.Callback) {
                            args.Callback();
                        }
                    }

                }); //end editor_refresh call

            });

            $element.off("click.editor_tools");
            $element.on("click.editor_tools", ":not(.LinkDisabled)[data-attr-editor-content-action-btn]", function (e, args) {
                var $this = $(this);
                var _btnID = $this.attr("data-attr-editor-content-action-btn");
                var _fnSetEditorReadOnly = function (readOnly) {

                    var $editor = $element.find("[" + util_renderAttribute("editor") + "]");

                    $editor.trigger("events.editor_setReadOnly", { "IsReadOnly": readOnly });
                };

                switch (_btnID) {

                    case "add":

                        $this.addClass("LinkDisabled");

                        var $container = $this.closest(".ViewContentEditorController, [data-attr-home-editor-group-id]");

                        $container.trigger("events.insertContentEditor", {
                            "Target": $element,
                            "Callback": function () {
                                $this.removeClass("LinkDisabled");
                            }
                        });
                        
                        break;  //end: add

                    case "delete":

                        var _fn = function (isDelete) {

                            $this.removeClass("LinkDisabled");
                            isDelete = (isDelete && $element.hasClass("ContentEditorFocused"));
                            
                            $element.find(".Header [data-attr-editor-content-action-btn='undo']").toggle(isDelete);

                            $element.toggleClass("ContentEditorFocused", isDelete);
                            $element.toggleClass("DeletedItem", isDelete);

                            $this.toggle(!isDelete);
                            _fnSetEditorReadOnly(false);
                        };

                        $this.addClass("LinkDisabled");

                        $element.addClass("ContentEditorFocused");
                        _fnSetEditorReadOnly(true);
                        
                        util_inlineConfirm({
                            "Target": $this, "Message": "Delete?",
                            "OnPositiveClick": function () {
                                _fn(true);
                            }, "OnNegativeClick": function () {
                                _fn(false);
                            }
                        });

                        break;  //end: delete

                    case "undo":

                        if ($element.hasClass("DeletedItem")) {
                            $element.removeClass("ContentEditorFocused DeletedItem");

                            var $btns = $element.find(".Header [data-attr-editor-content-action-btn='delete'], .Header [data-attr-editor-content-action-btn='undo']");

                            $btns.filter("[data-attr-editor-content-action-btn='undo']").hide();
                            $btns.not("[data-attr-editor-content-action-btn='undo']").show();
                        }

                        break;  //end: undo
                }
            });

            $element.off("click.ec_anchorLink");
            $element.on("click.ec_anchorLink", ".EditorAnchorLink", function (e, args) {

                e.stopPropagation();    //must prevent any parent event handlers of this namespace from executing

                var $anchor = $(this);
                var $search = null;
                var _href = util_forceString($anchor.attr("href"));

                if (_href != "") {
                    try {
                        $search = $mobileUtil.Find(_href);
                    } catch (e) {
                    }
                }

                if ($search != null && $search.length) {
                    $mobileUtil.AnimateSmoothScroll(null, 750, { "Top": $search.offset().top });
                }

                return false;
            });
        }
    });

};  //end: pluginEditor_content

RENDERER_LOOKUP["pluginEditor_userExportAction"] = function (context, options) {

    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_userExportAction");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.data("is-init")) {

            $element.addClass("ContentUserExportAction");

            $element.data("is-init", true);

            $element.off("events.userExportAction_OnInit");
            $element.on("events.userExportAction_OnInit", function (e, args) {

                args = util_extend({
                    "Instance": null, "Data": null, "ContentID": null, "ValueMessageID": null, "StatementID": null,
                    "Attributes": null, "OnUpdateItemToggle": function (obj, item, isAdd) { }
                }, args);

                var _instance = args.Instance;

                var _data = args.Data;
                var _contentID = util_forceInt(args.ContentID, enCE.None);
                var _enabled = false;
                var _userExportContent = null;

                if (_contentID != enCE.None) {

                    _data = (_data || []);  //list of user export content

                    _userExportContent = util_arrFilter(_data, enColUserContentExportProperty.ContentID, _contentID, true);
                    _userExportContent = (_userExportContent.length == 1 ? _userExportContent[0] : null);
                }
                else {

                    //value message's statement
                    var _valueMessageID = util_forceInt(args.ValueMessageID, enCE.None);
                    var _statementID = util_forceInt(args.StatementID, enCE.None);

                    _data = (_data || []);  //list of user export content

                    _userExportContent = util_arrFilterSubset(_data, function (searchItem) {
                        return (searchItem[enColUserContentExportProperty.ValueMessageID] == _valueMessageID &&
                                searchItem[enColUserContentExportProperty.StatementID] == _statementID);
                    }, true);

                    _userExportContent = (_userExportContent.length == 1 ? _userExportContent[0] : null);
                }

                _enabled = (_userExportContent ? true : false);

                if (args.Attributes) {
                    for (var _attr in args.Attributes) {
                        $element.attr(_attr, args.Attributes[_attr]);
                    }
                }

                $element.data("DataItem", _userExportContent)
                        .data("OnUpdateItemToggle", args.OnUpdateItemToggle || function () { })
                        .trigger("events.userExportAction_toggleState", { "IsEnabled": _enabled });

            }); //end: events.userExportAction_OnInit

            $element.off("events.userExportAction_toggleState");
            $element.on("events.userExportAction_toggleState", function (e, args) {

                args = util_extend({ "IsEnabled": null }, args);

                var $btn = $element.children("a[" + util_htmlAttribute("data-user-export-type", "toggle") + "]");

                if (args.IsEnabled === null) {
                    args.IsEnabled = ($btn.length == 1 ? !$btn.hasClass("StateOn") : false);
                }

                var _buttonDetail = {
                    "Label": (args.IsEnabled ? "Remove from Export" : "Add to Export"),
                    "Icon": (args.IsEnabled ? "minus" : "plus")
                };

                if ($btn.length == 0) {

                    var _html = "<a class='LinkClickable' data-role='button' data-theme='transparent' data-mini='true' data-inline='true' " +
                                util_htmlAttribute("data-user-export-type", "toggle") + " " + util_htmlAttribute("data-icon", _buttonDetail.Icon) + ">" +
                                util_htmlEncode(_buttonDetail.Label) +
                                "</a>";

                    //system admin users see an extended direct download of the content
                    if (global_userIsSystemAdmin()) {
                        _html += "<a class='LinkClickable' data-role='button' data-theme='transparent' data-mini='true' data-inline='true' data-icon='arrow-r' " +
                                 util_htmlAttribute("data-user-export-type", "download") + ">" +
                                 util_htmlEncode("Download") +
                                 "</a>";
                    }

                    //TODO: implement a proper fix
                    //hidden button (for refresh of export cache)
                    _html += "<a class='LinkClickable' data-role='button' data-theme='transparent' data-mini='true' data-inline='true' data-icon='refresh' " +
                                 util_htmlAttribute("data-user-export-type", "refresh") + " style='display: none;'>" +
                                 util_htmlEncode("Refresh") +
                                 "</a>";

                    $element.html(_html);

                    $element.trigger("create");

                    $btn = $element.children("a[" + util_htmlAttribute("data-user-export-type", "toggle") + "]");
                }
                else {
                    $mobileUtil.ButtonSetTextByElement($btn, _buttonDetail.Label);
                    $mobileUtil.ButtonUpdateIcon($btn, _buttonDetail.Icon);
                }

                $btn.toggleClass("StateOn", args.IsEnabled);

            }); //end: events.userExportAction_toggleState

            $element.off("events.userExportAction_populateItem");
            $element.on("events.userExportAction_populateItem", function (e, args) {

                var $this = $(this);
                var _data = null;

                if (!args) {
                    args = {};
                }

                var _config = $this.data("UserExportConfig");

                if (!_config) {

                    _config = {
                        "search": "",
                        "List": [
                            {
                                "selector": "[data-attr-vw-value-message-id][data-attr-vw-statement-id]",
                                "mappings": [
                                    { "p": enColUserContentExportProperty.ValueMessageID, "n": "data-attr-vw-value-message-id" },
                                    { "p": enColUserContentExportProperty.StatementID, "n": "data-attr-vw-statement-id" }
                                ]
                            },
                            {
                                "selector": "[data-attr-home-editor-group-id]",
                                "mappings": [
                                    { "p": enColUserContentExportProperty.EditorGroupID, "n": "data-attr-home-editor-group-id" }
                                ],
                                "OnApply": function (trigger, ctx, item) {
                                    item[enColUserContentExportProperty.ContentID] = util_forceInt($mobileUtil.GetClosestAttributeValue($(trigger),
                                                                                                   "data-user-export-context-content-id"), enCE.None);
                                }
                            }
                        ]
                    };

                    for (var i = 0; i < _config.List.length; i++) {
                        var _item = _config.List[i];

                        _config.search += (i > 0 ? ", " : "") + _item.selector;
                    }

                    $this.data("UserExportConfig", _config);
                }

                var $vw = $this.closest(_config.search);

                if ($vw.length == 1) {

                    for (var i = 0; i < _config.List.length; i++) {
                        var _searchConfig = _config.List[i];

                        if ($vw.is(_searchConfig.selector)) {

                            var _mappings = (_searchConfig["mappings"] || []);

                            _data = new CEUserContentExport();

                            for (var m = 0; m < _mappings.length; m++) {
                                var _mapping = _mappings[m];

                                _data[_mapping.p] = util_forceInt($vw.attr(_mapping.n), enCE.None);
                            }

                            if (_searchConfig["OnApply"]) {
                                _searchConfig.OnApply($this, $vw, _data);
                            }

                            break;
                        }
                    }
                }
                else {
                    _data = null;
                }

                if (_data) {

                    _data[enColUserContentExportProperty.ClassificationPlatformID]= util_forceInt($mobileUtil.GetClosestAttributeValue($this,
                                                                                                  "data-user-export-context-classification-platform-id"), enCE.None);
                }

                args["Item"] = _data;

            }); //end: events.userExportAction_populateItem

            $element.off("click.userExportAction");
            $element.on("click.userExportAction", ".LinkClickable:not(.LinkDisabled)", function (e, args) {

                args = util_extend({ "Callback": null, "OverrideAction": null }, args);

                var $btn = $(this);
                var _exportType = $btn.attr("data-user-export-type");
                
                var $parent = $btn.closest("[" + util_renderAttribute("pluginEditor_userExportAction") + "]");
                var _data = $parent.data("DataItem");

                var _isRemove = false;
                var _callback = function () {

                    unblockUI();
                    $btn.removeClass("LinkDisabled");

                    if (args.Callback) {
                        args.Callback();
                    }

                };  //end: _callback

                $btn.addClass("LinkDisabled");

                switch (_exportType) {

                    case "toggle":
                        _isRemove = $btn.hasClass("StateOn");
                        break;

                    case "download":
                    case "refresh":
                        _data = null;
                        break;
                }

                if (!_isRemove) {
                    var _result = { "Item": null };

                    $parent.trigger("events.userExportAction_populateItem", _result);

                    _data = _result["Item"];
                }

                if (_data) {

                    //Note: user ID will be configured on the server side

                    var _isDisableGenerateExportFile = window["pluginEditor_userExportActionIsDisableExportCall"];

                    //check if the query string currently has disabled the support for generating export file of content
                    if (util_isNullOrUndefined(_isDisableGenerateExportFile)) {
                        _isDisableGenerateExportFile = (global_IsDymaxiumUser() &&
                                                        (util_forceInt(util_queryString("mIsDossierExportExt"), enCETriState.None) == enCETriState.No)
                                                       );

                        window["pluginEditor_userExportActionIsDisableExportCall"] = _isDisableGenerateExportFile;
                    }

                    if (_isDisableGenerateExportFile) {
                        _callback();
                    }
                    else if (_exportType == "download" || _exportType == "refresh") {

                        if (util_forceString(args.OverrideAction) == "") {
                            args.OverrideAction = "export";
                        }

                        //TODO: implement client side support? (remove server requirement)
                        APP.Service.Action({
                            "c": "PluginEditor", "m": "ConstructExtensionExportURL", "_indicators": false, "args": {
                                "Action": args.OverrideAction,
                                "Item": util_stringify(_data), "IsNoCache": (_exportType == "download" ? enCETriState.Yes : enCETriState.None),
                                "ForceRefreshCache": (_exportType == "refresh")
                            }
                        }, function (result) {

                            result = (result || {});

                            var _url = util_forceString(result["URL"]);
                            var _cacheFilePath = util_forceString(result["CacheFilePath"]);

                            if (_url != "" || _cacheFilePath != "") {
                                var _frameID = "ifmModelExportContainer";
                                var $frame = $mobileUtil.GetElementByID(_frameID);

                                if ($frame.length == 0) {
                                    $frame = $("<iframe " + util_htmlAttribute("id", _frameID) + " frameborder='0' scrolling='no' width='0' height='0' " +
                                               "style='display: none;'></iframe>");

                                    $mobileUtil.Content().append($frame);
                                }

                                blockUI();

                                if (_exportType != "refresh" && _cacheFilePath != "") {
                                    var _downloadURL = util_constructDownloadURL({
                                        "IsProjectRelative": enCETriState.Yes, "FilePath": _cacheFilePath, "ExportFileName": util_forceString(result["ExportFileName"])
                                    });

                                    $frame.attr("src", _downloadURL);
                                    _callback();
                                }
                                else {

                                    var _fnOnError = function (xhr, status, error) {

                                        if (util_forceString(error) == "") {
                                            error = MSG_CONFIG.UnexpectedError;
                                        }

                                        console.log(error);

                                        if (_exportType == "download") {
                                            global_unknownErrorAlert();
                                        }

                                        _callback();
                                    };

                                    $.post(_url, result["Data"]).done(function (data) {

                                        if (_exportType != "download") {
                                            _callback();
                                        }
                                        else {
                                            try {
                                                data = util_parse(data);
                                            } catch (e) {
                                                data = null;
                                            }

                                            data = util_extend({ "Path": null, "FileName": null }, data);

                                            var _downloadURL = util_constructDownloadURL({
                                                "IsProjectRelative": enCETriState.Yes, "FilePath": data.Path, "ExportFileName": util_forceString(result["ExportFileName"])
                                            });

                                            $frame.attr("src", _downloadURL);
                                            _callback();
                                        }

                                    }).fail(_fnOnError).error(_fnOnError);
                                }
                            }
                            else {
                                _callback();
                            }
                        });
                    }
                    else {

                        APP.Service.Action({
                            "c": "PluginEditor", "m": "UserContentExportToggle", "_indicators": false, "args": {
                                "Item": util_stringify(_data), "IsAdd": !_isRemove, "IsNoConflict": true
                            }
                        }, function (result) {

                            result = util_extend({ "Item": null, "IsRefreshExport": false }, result);

                            var _valid = false;
                            var _saveItem = result.Item;

                            if (_isRemove || (!_isRemove && _saveItem)) {
                                _valid = true;
                            }

                            if (_valid) {

                                if (_isRemove) {
                                    $parent.removeData("DataItem");
                                }
                                else {
                                    $parent.data("DataItem", _saveItem);
                                }

                                $element.data("OnUpdateItemToggle").apply(this, [$btn, _saveItem, !_isRemove]);

                                $element.trigger("events.userExportAction_toggleState", { "IsEnabled": !_isRemove });
                            }

                            if (result.IsRefreshExport) {

                                var $btnRefresh = $parent.find("[" + util_htmlAttribute("data-user-export-type", "refresh") + "]");

                                if ($btnRefresh.length == 1) {
                                    $btnRefresh.trigger("click.userExportAction", { "Callback": _callback });
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
                }
                else {
                    _callback();
                }

            }); //end: events.userExportAction_click

            $element.html("&nbsp;");
        }
    });
};

RENDERER_LOOKUP["pluginEditor_viewController"] = function (context, options) {

    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_viewController");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.data("is-init")) {
            $element.data("is-init", true);

            var _instanceType = eval($element.attr("data-attr-view-controller-instance-type"));
            var _controller = new _instanceType();

            $element.data("editor-view-controller", _controller);

            $element.off("events.controller_setRestoreState");
            $element.on("events.controller_setRestoreState", function (e, args) {
                args = util_extend({ "Callback": null, "PluginInstance": args.PluginInstance, "Element": $element }, args);

                var _viewController = $element.data("editor-view-controller");

                if (_viewController["SetRestoreState"]) {
                    _viewController.SetRestoreState(args);
                }
                else if (args.Callback) {
                    args.Callback();
                }
            });

            $element.off("events.controller_bind");
            $element.on("events.controller_bind", function (e, args) {

                $element.data("editor-view-controller")
                        .Bind({
                            "PluginInstance": args.PluginInstance, "Element": $element, "EditorGroupID": args.EditorGroupID,
                            "LayoutManager": args["LayoutManager"]
                        }, args["Callback"]);
            });

            $element.off("events.controller_toggleEditMode");
            $element.on("events.controller_toggleEditMode", function (e, args) {

                var _callback = function () {                    
                    $triggerElement.trigger("events.toggleOverlay", { "IsEnabled": false });

                    if (args.Callback) {
                        args.Callback();
                    }
                };

                args = util_extend({ "PluginInstance": null, "IsEdit": false, "Trigger": null, "LayoutManager": null, "RevertToggleEditState": function () { } }, args);

                var $triggerElement = $(args.Trigger);

                $triggerElement.trigger("events.toggleOverlay", { "IsEnabled": true, "Message": "Loading..." });

                var _viewController = $element.data("editor-view-controller");

                args.LayoutManager.FilterToggleState({ "IsEnabled": !args.IsEdit });

                ClearMessages();

                _viewController.ToggleEditMode({
                    "Controller": _viewController, "PluginInstance": args.PluginInstance, "IsEdit": args.IsEdit, "Callback": _callback,
                    "LayoutManager": args.LayoutManager, "Trigger": $triggerElement, "RevertToggleEditState": args.RevertToggleEditState
                });
            });

            $element.off("events.controller_OnButtonClick");
            $element.on("events.controller_OnButtonClick", function (e, args) {

                args = util_extend({ "Trigger": null, "Event": null, "Parent": null, "InvokeExtArgs": null }, args);

                var _viewController = $element.data("editor-view-controller");

                var $trigger = $(args.Trigger);

                if ($trigger.length == 0) {
                    $trigger = $(this);
                }

                if (_viewController["OnButtonClick"]) {

                    args["Event"] = (args.Event ? args.Event : e);
                    args["Trigger"] = $trigger;
                    args["ButtonID"] = $trigger.attr("data-attr-editor-controller-action-btn");
                    args["Controller"] = _viewController;
                    args["InvokeExtArgs"] = args.InvokeExtArgs;

                    if (!args.Parent) {
                        args["Parent"] = $element;
                    }

                    if (util_forceInt($trigger.attr("data-attr-require-layout-manager"), enCETriState.None) == enCETriState.Yes) {
                        $element.trigger("events.getLayoutManager", {
                            "Callback": function (layoutManager) {

                                args["LayoutManager"] = layoutManager;

                                _viewController.OnButtonClick(args);
                            }
                        });
                    }
                    else {
                        _viewController.OnButtonClick(args);
                    }
                }

            }); //end: events.controller_OnButtonClick

            $element.off("events.controller_OnFilterUpdate");
            $element.on("events.controller_OnFilterUpdate", function (e, args) {

                args = util_extend({ "Trigger": null, "Event": null, "Parent": null, "InvokeExtArgs": null }, args);

                var _viewController = $element.data("editor-view-controller");

                var $trigger = $(args.Trigger);


                if ($trigger.length == 0) {
                    $trigger = $(this);
                }

                args["Event"] = (args.Event ? args.Event : e);
                args["Trigger"] = $trigger;
                args["Controller"] = _viewController;
                args["InvokeExtArgs"] = args.InvokeExtArgs;
                args["LayoutManager"] = args["LayoutManager"];

                if (!args.Parent) {
                    args["Parent"] = $element;
                }

                var _fn = function () {

                    if (_viewController["OnFilterUpdate"]) {
                        _viewController.OnFilterUpdate(args);
                    }
                    else if (_viewController && _viewController["Utils"] && _viewController.Utils["Actions"] && _viewController.Utils.Actions["Refresh"]) {

                        //default action of refreshing the view
                        _viewController.Utils.Actions.Refresh(args);
                    }
                };

                if (!args.LayoutManager) {
                    $element.trigger("events.getLayoutManager", {
                        "Callback": function (layoutManager) {

                            args["LayoutManager"] = layoutManager;

                            _fn();
                        }
                    });
                }
                else {
                    _fn();
                }

            }); //end: events.controller_OnFilterUpdate

            $element.off("click.controller_buttonClick");
            $element.on("click.controller_buttonClick", ".LinkClickable:not(.LinkDisabled)[data-attr-editor-controller-action-btn]", function (e, args) {
                args = util_extend({ "Trigger": this, "Event": e }, args);

                $element.trigger("events.controller_OnButtonClick", args);
            });
        }
    });

};  //end: pluginEditor_viewController

RENDERER_LOOKUP["pluginEditor_dropdownDatePicker"] = function (context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_dropdownDatePicker");
    var _now = new Date();
    var _currentYear = _now.getFullYear();
    var _offsetRange = 3;
    var _monthHTML = null;
    var _dayHTML = null;
    var _yearHTML = null;

    var _months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

    $.each($list, function () {
        var $element = $(this);

        if (!$element.is("is-init")) {

            $element.is("is-init", true);

            if (_monthHTML == null) {

                _monthHTML = "<option value='-1'>&nbsp;</option>";

                for (var m = 0; m < _months.length; m++) {
                    _monthHTML += "<option value='" + m + "'>" + util_htmlEncode(_months[m]) + "</option>";
                }
            }

            if (_dayHTML == null) {
                _dayHTML = "";

                _dayHTML = "<option value='-1'>&nbsp;</option>";

                for (var d = 1; d <= 31; d++) {
                    _dayHTML += "<option value='" + d + "'>" + d + "</option>";
                }
            }

            if (_yearHTML == null) {
                _yearHTML = "<option value='-1'>&nbsp;</option>";

                for (var y = _currentYear - _offsetRange; y <= _currentYear + _offsetRange; y++) {
                    _yearHTML += "<option value='" + y + "'>" + y + "</option>";
                }
            }

            var _isReadOnly = (util_forceInt($element.attr("data-attr-is-read-only"), enCETriState.None) == enCETriState.Yes);

            var _html = "<div class='EditorDropdownDatePickerElement'" + (_isReadOnly ? " style='display: none;'" : "") + ">" +
                        "   <select data-date-picker-id='month' data-corners='false' data-mini='true'>" + _monthHTML + "</select>" +
                        "   <select data-date-picker-id='day' data-corners='false' data-mini='true'>" + _dayHTML + "</select>" +
                        "   <select data-date-picker-id='year' data-corners='false' data-mini='true'>" + _yearHTML + "</select>" +
                        "   <a data-attr-dt-picker-btn='set_today' class='LinkClickable ButtonTheme' data-role='button' data-icon='refresh' data-mini='true' " +
                        "data-inline='true' data-theme='transparent'>" +
                        util_htmlEncode("Today") +
                        "   </a>" +
                        "   <div class='LabelError LabelValidation' style='display: none;'>" + util_htmlEncode("Selected date is invalid") + "</div>" +
                        "</div>";

            $element.html(_html);
            $element.trigger("create");

            var $ddls = $element.find("select[data-date-picker-id]");
            var $ddlMonth = $ddls.filter("[data-date-picker-id='month']");
            var $ddlDay = $ddls.filter("[data-date-picker-id='day']");
            var $ddlYear = $ddls.filter("[data-date-picker-id='year']");

            var $lbl = $element.find(".LabelValidation");

            var _fnGetValue = function () {

                var _val = {
                    "Month": null,
                    "Day": null,
                    "Year": null,
                    "IsValid": function (hasSelection) {
                        var _valid = false;
                        var _hasMonth = (this.Month != null);
                        var _hasDay = (this.Day != null);
                        var _hasYear = (this.Year != null);

                        if ((!hasSelection && !_hasMonth && !_hasDay && !_hasYear) || (_hasMonth && !_hasDay && _hasYear)) {
                            _valid = true;
                        }
                        else if (_hasMonth && _hasDay && _hasYear) {

                            var _dt = new Date(this.Year, this.Month, this.Day);

                            _valid = ((this.Month == _dt.getMonth()) &&
                                      (this.Day == _dt.getDate()) &&
                                      (this.Year == _dt.getFullYear())
                                     );
                        }

                        return _valid;
                    },
                    "IsFullDate": function () {
                        return (this.Month != null && this.Day != null && this.Year != null);
                    },
                    "ToDate": function () {
                        var _val = null;

                        if (this.IsValid(true)) {
                            _val = new Date(this.Year, this.Month, (this.Day != null ? this.Day : 1));
                        }

                        return _val;
                    },
                    "ToString": function () {
                        var _str = "";

                        if (this.IsValid(true)) {
                            _str = _months[this.Month] + (this.Day != null ? " " + this.Day + "," : "") + (" " + this.Year);
                        }

                        return _str;
                    }
                };

                var _fnGetDropdownValue = function (obj) {
                    var _v = util_forceInt($(obj).val(), -1);

                    return (_v != -1 ? _v : null);
                };

                _val.Month = _fnGetDropdownValue($ddlMonth);
                _val.Day = _fnGetDropdownValue($ddlDay);
                _val.Year = _fnGetDropdownValue($ddlYear);

                return _val;

            };  //end: _fnGetValue

            $element.off("click.ddl_datepicker_action");
            $element.on("click.ddl_datepicker_action", ".LinkClickable[data-attr-dt-picker-btn]", function () {
                var _action = $(this).attr("data-attr-dt-picker-btn");

                if (_action == "set_today") {
                    $element.trigger("events.setValue", { "Value": (new Date()) });
                }
            });

            $element.off("change.ddl_datepicker");
            $element.on("change.ddl_datepicker", "select[data-date-picker-id]", function (e, args) {
                var $ddl = $(this);

                if ($ddl.attr("data-date-picker-id") == "year") {

                    args = util_extend({ "OverrideValue": null }, args);

                    var _year = null;

                    if (args.OverrideValue) {
                        _year = args.OverrideValue;
                    }
                    else {
                        _year = $ddl.val();
                    }

                    _year = util_forceInt(_year);

                    if (_year > 0) {
                        var _optionHTML = "";

                        _optionHTML += "<option value='-1'>&nbsp;</option>";

                        for (var y = Math.max(_year - _offsetRange, 1) ; y <= _year + _offsetRange; y++) {
                            _optionHTML += "<option value='" + y + "'" + (y == _year ? " selected='selected'" : "") + ">" + y + "</option>";
                        }

                        $ddl.html(_optionHTML)
                            .selectmenu("refresh");
                    }
                }

                var _val = _fnGetValue();

                $lbl.toggle(!_isReadOnly && _val.IsValid() == false);

                if (_isReadOnly) {
                    var $vwLabel = $element.children(".Label");

                    if ($vwLabel.length == 0) {
                        $vwLabel = $("<div class='Label' />");
                        $element.append($vwLabel);
                    }

                    $vwLabel.text(_val.ToString());
                }
            });

            $element.off("events.getValue");
            $element.on("events.getValue", function (e, args) {
                args["Value"] = _fnGetValue();
            });

            $element.off("events.setValue");
            $element.on("events.setValue", function (e, args) {
                args = util_extend({ "Value": null, "IsFullDate": true }, args);

                var _val = args.Value;
                var _dt = { "Month": null, "Day": null, "Year": null };

                if (!util_isNullOrUndefined(_val)) {

                    if (typeof _val === "object") {
                        _dt.Month = _val.getMonth();
                        _dt.Day = _val.getDate();
                        _dt.Year = _val.getFullYear();
                    }
                    else if (typeof _val === "string") {

                        _val = util_trim(_val);

                        var _arr = util_replaceAll(_val, ",", "").split(" ");

                        if (_arr.length == 0 || (_arr.length == 1 && _arr[0] === _val)) {

                            //check if it is a JS version of the date (convert and retrieve the date portions, if applicable)
                            var _temp = util_JS_convertToDate(_val, null);

                            if (_temp && !isNaN(_temp.getTime())) {
                                _dt.Month = _temp.getMonth();
                                _dt.Day = _temp.getDate();
                                _dt.Year = _temp.getFullYear();
                            }
                        }
                        else if (_arr.length == 2 || _arr.length == 3) {

                            var _search = _arr[0].toLowerCase();

                            _dt.Month = util_arrFilterItemIndex(_months, function (month) {
                                return (month.toLowerCase() === _search);
                            });

                            if (_dt.Month < 0) {
                                _dt.Month = null;
                            }

                            if (_arr.length > 2) {
                                _dt.Day = util_forceInt(_arr[1], -1);

                                if (_dt.Day < 1 || _dt.Day > 31) {
                                    _dt.Day = null;
                                }
                            }

                            _dt.Year = util_forceInt(_arr[_arr.length - 1], -1);
                        }

                    }
                }

                //invalidate the day portion if it is not full date (i.e. MMM YYYY format type)
                if (!args.IsFullDate) {
                    _dt.Day = null;
                }

                var _arrDDL = [{ "t": $ddlMonth, "p": "Month" }, { "t": $ddlDay, "p": "Day" }, { "t": $ddlYear, "p": "Year" }];

                for (var i = 0; i < _arrDDL.length; i++) {
                    var _detail = _arrDDL[i];
                    var _selectedValue = util_forceInt(_dt[_detail.p], -1);

                    $(_detail.t).val(_selectedValue)
                                .selectmenu("refresh");
                }

                $ddlYear.trigger("change.ddl_datepicker", { "OverrideValue": _dt.Year });

            });

            $element.off("events.init");
            $element.on("events.init", function (e, args) {

                args = util_extend({}, args);

            }); //end: events.init
        }
    });

};  //end: pluginEditor_dropdownDatePicker

RENDERER_LOOKUP["pluginEditor_fileDisclaimer"] = function (context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_fileDisclaimer");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.data("is-init-editor-file-disclaimer") ||
            (util_forceInt($element.attr("data-editor-file-disclaimer-init"), enCETriState.None) == enCETriState.Yes)) {

            $element.data("is-init-editor-file-disclaimer", true);
            $element.removeAttr("data-editor-file-disclaimer-init");

            var _filePrefixURL = "<SITE_URL>home/file.aspx";
            var _selector = "a[data-rel='external'][href!='javascript: void(0);'][href^='" + _filePrefixURL + "']";

            var _extSelector = util_forceString($element.attr("data-editor-file-disclaimer-selector"));

            if (_extSelector != "") {
                _selector += ", " + _extSelector;
            }

            $element.off("click.editor_onFileDisclaimer");
            $element.on("click.editor_onFileDisclaimer", _selector, function (e, args) {
                var $this = $(this);
                var _handled = false;

                _handled = true;

                if (_handled) {
                    e.preventDefault();
                    
                    var _options = util_extend({
                        "Title": "", "HTML": "", "LabelPositiveButton": "Accept", "LabelDismissButton": "Cancel"
                    }, "%%TOK|ROUTE|PluginEditor|LayoutFileDisclaimerPopup%%");

                    //display the disclaimer popup
                    var $container = $("#vwEditorFileDisclaimer");

                    if ($container.length > 0) {
                        $container.remove();
                    }

                    $container = $("<div id='vwEditorFileDisclaimer' class='ApplicationFont ViewModeStackTop ScrollbarPrimary EditorDisclaimerFileAccess'>" +
                                   "    <div class='Content'>" +
                                   "        <div class='Title'>" + util_htmlEncode(_options.Title) + "</div>" +
                                   "        <div class='Disclaimer'>" + util_forceString(_options.HTML) + "</div>" +
                                   "        <div class='Footer'>" +
                                   "            <a class='LinkClickable ButtonTheme' data-role='button' data-theme='transparent' data-icon='check' data-iconpos='right' " +
                                   "data-inline='true' data-mini='true' data-rel='external' target='_blank' " +
                                   util_htmlAttribute("href", $this.attr("href")) + ">" +
                                   util_htmlEncode(_options.LabelPositiveButton) +
                                   "            </a>" +
                                   "            <a class='LinkClickable ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' data-iconpos='right' " +
                                   "data-inline='true' data-mini='true' " + util_htmlAttribute("data-is-dismiss-action", enCETriState.Yes) + ">" +
                                   util_htmlEncode(_options.LabelDismissButton) +
                                   "            </a>" +
                                   "        </div>" +
                                   "    </div>" +
                                   "</div>");

                    $container.hide();
                    $("body").append($container);
                    $mobileUtil.refresh($container);

                    $container.css("top", "200%");
                    $container.show();

                    var $activePage = $mobileUtil.ActivePage();

                    $activePage.addClass("EffectGrayscale");

                    $container.animate({ "top": "0px" }, 500, function () {

                        $container.off("click.editor_onFileDisclaimerDismiss");
                        $container.on("click.editor_onFileDisclaimerDismiss", function (e) {
                            var $target = $(e.target);
                            var _isAnimate = true;
                            var _selectorDismissable = "[" + util_htmlAttribute("data-is-dismiss-action", enCETriState.Yes) + "], [data-rel='external'], " +
                                                       ".Content, .EditorDisclaimerFileAccess";

                            var $search = $target.closest(_selectorDismissable);
                            var _canDismiss = $search.hasClass("EditorDisclaimerFileAccess");

                            if (!_canDismiss && $search.is("[data-rel], " + "[" + util_htmlAttribute("data-is-dismiss-action", enCETriState.Yes) + "]")) {
                                _canDismiss = true;
                                _isAnimate = ($search.is("[data-rel]") == false);
                            }

                            if (_canDismiss) {
                                $container.off("click.editor_onFileDisclaimerDismiss");

                                if (_isAnimate) {
                                    $container.animate({ "top": "200%" }, "normal", function () {
                                        $container.remove();
                                    });
                                }
                                else {
                                    $container.remove();
                                }
                            }
                        });

                        $container.off("remove.editor_onFileDisclaimerCleanup");
                        $container.on("remove.editor_onFileDisclaimerCleanup", function () {
                            $activePage.removeClass("EffectGrayscale");
                        });

                        //properly handle jQuery Mobile buttons post click events (since preventing default)
                        if ($this.hasClass("ui-btn-active") && $this.is("[data-role='button']")) {
                            $this.removeClass("ui-btn-active");
                        }
                    });
                }

            });
        }
    });

};  //end: pluginEditor_fileDisclaimer

RENDERER_LOOKUP["pluginEditor_notifications"] = function (context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_notifications");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.data("is-init-editor-notifications-view")) {
            $element.data("is-init-editor-notifications-view", true);

            var _controlInstance = {
                "Options": {
                    "Layout": "default",
                    "EntityType": "announcement",
                    "ViewStateKey": null,
                    "ListSize": 10,
                    "Set": function (prop, name) {
                        this[prop] = util_forceString($element.attr(name), this[prop]);
                    }
                },
                "Data": {
                    "RenderIndexOdd": true,
                    "LookupRenderOptions": "%%TOK|ROUTE|PluginEditor|NotificationsLookupRenderOption%%",
                    "CurrentRenderOptions": null,    //dynamically populated based on entity type
                    "Cache": {
                        "CanAdmin": false,
                        "OnRenderOptionListItem": null,
                        "OnRenderOptionListItemCallout": null,
                        "OnRenderOptionListItemConfigureCalloutFields": null,
                        "LookupEntityMetadata": {}
                    },

                    "ClassificationPlatformID": enCE.None,
                    "ComponentID": enCE.None
                },
                "Utils": pluginEditor_getUtils(),
                "DOM": {
                    "Element": $element,
                    "ListCardContainer": null,
                    "ListHeaderTitleLabel": null,
                    "ListView": null,
                    "Badge": null,
                    "BadgeLabelCount": null,
                    "ActiveEditView": null
                }
            };

            _controlInstance["State"] = {
                "BaseParams": function (params) {

                    var _extendedFilters = {};

                    if (_controlInstance.Data.CurrentRenderOptions) {
                        var _filters = (_controlInstance.Data.CurrentRenderOptions.SettingsFilterOptions || []);
                        var $vwSettings = _controlInstance.DOM.Element.find(".ViewSettings:first");

                        if ($vwSettings.length == 1) {
                            var $filters = $vwSettings.find(".Filter[data-notification-filter-index]");

                            $.each($filters, function () {
                                var $this = $(this);
                                var _index = util_forceInt($this.attr("data-notification-filter-index"), -1);

                                if (_index >= 0 && _index < _filters.length) {
                                    var _filter = _filters[_index];
                                    var _key = util_forceString(_filter["Key"]);

                                    if (_key != "") {
                                        var _val = _controlInstance.Utils.Actions.InputEditorDataType({
                                            "Element": $this.find("[" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]:first"), "IsGetValue": true
                                        });

                                        _extendedFilters[_key] = _val;
                                    }
                                }
                            });
                        }
                    }

                    params = util_extend({
                        "EntityType": _controlInstance.Options.EntityType,
                        "ClassificationPlatformID": _controlInstance.Data.ClassificationPlatformID,
                        "ComponentID": _controlInstance.Data.ComponentID,
                        "ExtendedFilters": _extendedFilters
                    }, params, true, true);

                    return params;

                },  //end: BaseParams

                "ListParams": function (params) {

                    var _sortColumn = util_forceInt(_controlInstance.DOM.ListView.data("SortColumn"), _controlInstance.Data.CurrentRenderOptions.DefaultSortColumn);
                    var _sortASC = util_forceBool(_controlInstance.DOM.ListView.data("SortAscending"), _controlInstance.Data.CurrentRenderOptions.DefaultSortAscending);

                    params = _controlInstance.State.BaseParams(params);

                    params = util_extend({
                        "SortColumn": _sortColumn,
                        "SortAscending": _sortASC,
                        "PageSize": enCEPaging.NoPaging,
                        "PageNum": enCEPaging.NoPaging
                    }, params);

                    return params;

                },   //end: ListParams

                "ListViewSortSettings": function () {
                    var _ret = null;

                    if (_controlInstance.DOM.ListView) {
                        var $search = _controlInstance.DOM.ListView.find("[" + util_renderAttribute("data_admin_list") + "]:first .CRepeater:first");

                        if ($search.length == 1) {
                            _ret = ctl_repeater_getSortSetting($search);
                        }
                    }

                    return _ret;
                },

                "GetListItem": function (id, itemIndex) {

                    var _ret = null;

                    if (_controlInstance.DOM.ListView) {
                        var _data = _controlInstance.DOM.ListView.data("DataSource");
                        var _list = (_data ? _data["List"] : null);

                        _list = (_list || []);

                        itemIndex = util_forceInt(itemIndex, -1);

                        if (itemIndex >= 0 && itemIndex < _list.length) {
                            _ret = _list[itemIndex];
                        }
                        else {

                            _ret = util_arrFilterSubset(_list, function (searchItem) {
                                var _searchID = util_propertyValue(searchItem, _controlInstance.Data.CurrentRenderOptions.PropertyPathID);

                                return (_searchID == id);
                            }, true);

                            _ret = (_ret.length == 1 ? _ret[0] : null);
                        }
                    }

                    return _ret;
                },   //end: GetListItem

                "ListItemAttributeNamePropertyPath": function (propPath) {
                    return "data-attr-list-item-prop-path-" + propPath.toLowerCase();
                },

                "IsFixedView": function () {
                    return _controlInstance.DOM.Element.hasClass("ViewModeFixed");
                },

                "HasViewStateKey": function(){
                    return (util_forceString(_controlInstance.Options.ViewStateKey) != "");
                },

                "GetViewState": function (prop) {
                    var _ret = undefined;

                    if (_controlInstance.State.HasViewStateKey()) {
                        var _lookup = $("body").data("pluginEditor_notifications");

                        if (_lookup) {
                            _ret = _lookup[_controlInstance.Options.ViewStateKey];

                            prop = util_forceString(prop, "Control");

                            if (_ret && prop != "") {
                                _ret = _ret[prop];
                            }

                        }
                    }

                    return _ret;
                },

                "SaveViewState": function (options) {
                    _controlInstance.DOM.Element.trigger("events.notifications_persistViewState", options);
                },

                "CanAdmin": function () {
                    var _ret = false;
                    var _fn = _controlInstance.DOM.Element.data("NotificationCanUserAdmin");

                    if (!_fn) {

                        //if the custom user administration check function is not specified, then use generic framework version
                        _fn = function (opts) {
                            return global_userIsAdminRoleBase();
                        };
                    }
                    
                    if (_fn) {
                        _ret = _fn({ "Element": _controlInstance.DOM.Element, "Controller": _controlInstance });
                        _ret = util_forceBool(_ret, false);
                    }

                    return _ret;

                },   //end: CanAdmin

                "OnApplyDataFunction": function (name, options, isExecuteFunction) {

                    isExecuteFunction = util_forceBool(isExecuteFunction, true);
                    
                    var _fn = _controlInstance.DOM.Element.data(name);

                    if (!_fn) {

                        //if the function is not specified, then use placeholder
                        _fn = function (opts) {
                            if (opts.Callback) {
                                opts.Callback();
                            }
                        };
                    }

                    options = util_extend({ "Element": _controlInstance.DOM.Element, "Controller": _controlInstance }, options);

                    if (isExecuteFunction) {
                        _fn.call(_controlInstance.DOM.Element.get(0), options);
                    }

                    return _fn;

                }   //end: OnApplyDataFunction

            };  //end: State

            _controlInstance["Events"] = {
                "AnimateScrollTo": function (options, onCallback) {

                    options = util_extend({ "Element": null, "ScrollTop": null, "Offset": 0, "IsDisableScrollValidation": false }, options);

                    var _isFixedMode = _controlInstance.State.IsFixedView();

                    var $target = null;

                    if (_isFixedMode) {
                        $target = _controlInstance.DOM.Element;
                    }
                    else {
                        $target = $("html,body");
                    }

                    scrollTop = util_forceFloat(options.ScrollTop, -1);

                    var _handled = false;

                    if (scrollTop < 0) {
                        var $element = $(options.Element);

                        if ($element.length == 1) {
                            scrollTop = $element.offset().top;

                            if (_isFixedMode && !options.IsDisableScrollValidation) {

                                //check if the current element is in view
                                var _containterScrollTop = $target.scrollTop();
                                var _height = $target.outerHeight();

                                if (scrollTop >= _containterScrollTop && scrollTop <= _height) {
                                    scrollTop = _containterScrollTop;
                                    _handled = true;
                                }
                            }
                        }
                    }

                    if (!_handled) {
                        scrollTop += util_forceFloat(options.Offset, 0);
                    }

                    scrollTop = Math.max(scrollTop, 0);

                    $target.finish()
                           .animate({ "scrollTop": scrollTop }, onCallback);
                },
                "GetEditView": function (options) {

                    options = util_extend({ "IsInit": false }, options);

                    var $vw = _controlInstance.DOM.ListCardContainer.children(".ViewEditEntity:first");

                    if (options.IsInit) {
                        $vw.remove();
                        $vw = null;
                    }

                    if (!$vw || $vw.length == 0) {
                        $vw = $("<div class='ViewEditEntity' />");
                        $vw.hide();

                        $vw.insertBefore(_controlInstance.DOM.ListView);
                    }

                    _controlInstance.DOM.ActiveEditView = $vw;

                    return $vw;
                },
                "GetList": function (params, onCallback) {

                    params = _controlInstance.State.ListParams(params);

                    APP.Service.Action({
                        "c": "PluginEditor", "m": "NotificationUserList",
                        "args": params
                    }, function (result) {
                        if (onCallback) {
                            onCallback(result);
                        }
                    });

                },  //end: GetList

                "OnDataItemAction": function (params, onCallback, opts) {

                    opts = util_extend({
                        "IsConfirm": false, "ConfirmTitle": null, "ConfirmMessage": null, "IsRefreshCallback": true, "IsMessageHTML": false,
                        "DelayRefreshTimeout": 100, "IsDependencyUpdate": true
                    }, opts);

                    params = _controlInstance.State.BaseParams(params);

                    params["_action"] = "SAVE"; //treat the current method request as save entity (properly handle save conflicts, error messages)

                    params["_eventArgs"] = {
                        "SaveConflict": (opts["SaveConflict"] || onCallback),
                        "Error": (opts["Error"] || onCallback)
                    };

                    var _fn = function (isSubmit) {

                        if (isSubmit) {
                            APP.Service.Action({
                                "c": "PluginEditor", "m": "NotificationDataItemAction",
                                "args": params
                            }, function (result) {
                                
                                if (opts.IsRefreshCallback) {
                                    setTimeout(function () {
                                        _controlInstance.Events.Refresh({
                                            "IsDependencyUpdate": util_forceBool(opts.IsDependencyUpdate, false),
                                            "Callback": function () {

                                                if (onCallback) {
                                                    onCallback(result);
                                                }
                                            }
                                        });
                                    }, util_forceInt(opts.DelayRefreshTimeout, 0));
                                }
                                else if (onCallback) {
                                    onCallback(result);
                                }
                            });
                        }
                        else if (onCallback) {
                            onCallback();
                        }

                    };  //end: _fn

                    if (opts.IsConfirm) {
                        dialog_confirmYesNo(opts.ConfirmTitle, opts.ConfirmMessage, function () {
                            _fn(true);
                        }, function () {
                            _fn(false);
                        }, opts.IsMessageHTML);
                    }
                    else {
                        _fn(true);
                    }

                },  //end: OnDataItemAction

                "Init": function (options) {

                    _controlInstance.Options.Set("Layout", "data-notification-layout-type");
                    _controlInstance.Options.Set("EntityType", "data-notification-entity-type");
                    _controlInstance.Options.Set("ViewStateKey", "data-notification-view-state-key");

                    _controlInstance.Data.CurrentRenderOptions = util_extend({
                        "Title": "",

                        "PropertyPathID": "ID",
                        "PropertyPathFallbackDismissableID": null,
                        "PropertyPathHeading": "Heading",
                        "PropertyPathTitle": "Title",
                        "PropertyPathDate": "Date",
                        "PropertyPathUserHasViewed": "UserHasViewed",

                        "PropertyPathIsPriority": null,

                        "ListItemRenderAttributePropertyPaths": null,

                        "PlaceholderHeading": NA,

                        "TooltipActionAddNew": "",
                        "TooltipActionDismiss": "",
                        "TooltipActionDismissUndo": "",
                        "TooltipActionDelete": "",

                        "DefaultSortColumn": enCE.None,
                        "DefaultSortAscending": true,
                        "SettingsSortColumnOptions": [],
                        "SettingsFilterOptions": [],

                        "EditEntityRenderOptions": null
                    }, _controlInstance.Data.LookupRenderOptions[_controlInstance.Options.EntityType]);

                    _controlInstance.Data.CurrentRenderOptions.DefaultSortColumn = util_forceInt(_controlInstance.Data.CurrentRenderOptions.DefaultSortColumn, enCE.None);
                    _controlInstance.Data.CurrentRenderOptions.DefaultSortAscending = util_forceBool(_controlInstance.Data.CurrentRenderOptions.DefaultSortAscending, true);

                    var _renderOptions = util_extend({
                        "Title": null, "Fields": null, "EntityTypeInstance": null, "Confirmation": {
                            "IsEnabled": true,
                            "Title": "Save",
                            "Message": "Are you sure you want to save the Announcement?",
                            "IsHTML": false,
                            "Buttons": []
                        }
                    }, _controlInstance.Data.CurrentRenderOptions.EditEntityRenderOptions, null, true);

                    if (_renderOptions.EntityTypeInstance && typeof _renderOptions.EntityTypeInstance === "string") {
                        _renderOptions.EntityTypeInstance = eval(_renderOptions.EntityTypeInstance);
                    }

                    if (_renderOptions.Fields) {

                        for (var f = 0; f < _renderOptions.Fields.length; f++) {
                            var _field = _renderOptions.Fields[f];

                            _controlInstance.Utils.InitEditorRenderField({ "Controller": _controlInstance, "Field": _field });
                        }
                    }

                    _controlInstance.Data.CurrentRenderOptions.EditEntityRenderOptions = _renderOptions;

                    var $element = _controlInstance.DOM.Element;

                    $element.addClass("EditorNotifications");

                    var _html = "";
                    var _fnConfigureElement = null;
                    var _canAdmin = _controlInstance.State.CanAdmin();

                    var _fnBindViewFilters = function () {

                        //configure the view settings view (by default it is hidden, but need to render it due to filters and state value)
                        var _viewState = _controlInstance.State.GetViewState();
                        var _hasExtendedViewState = (_viewState && _viewState["ListState"] && _viewState.ListState["ExtendedFilters"] ? true : false);

                        //check if a list view state is available, in which case need to initialize default sort column and order (before the ListParams is invoked)
                        if (_controlInstance.DOM.ListView && _viewState && _viewState["ListState"]) {

                            if (!util_isNullOrUndefined(_viewState.ListState["SortColumn"])) {
                                _controlInstance.DOM.ListView.data("SortColumn", _viewState.ListState["SortColumn"]);
                            }

                            if (!util_isNullOrUndefined(_viewState.ListState["SortAscending"])) {
                                _controlInstance.DOM.ListView.data("SortAscending", _viewState.ListState["SortAscending"]);
                            }
                        }

                        var _params = _controlInstance.State.ListParams();
                        var _isASC = util_forceBool(_params["SortAscending"]);

                        var _fnGetCssClass = function (isSortASC) {
                            var _selected = ((isSortASC && _isASC) || (!isSortASC && !_isASC));

                            return "LinkClickable material-icons" + (_selected ? " LinkDisabled StateOn" : "");
                        };

                        var $vw = _controlInstance.DOM.Element.find(".ViewSettings:first");

                        var _html = "";
                        var _filters = (_controlInstance.Data.CurrentRenderOptions.SettingsFilterOptions || []);
                        var _canAdminBase = (_controlInstance.State.CanAdmin() && global_userIsAdminRoleBase());
                        
                        for (var f = 0; f < _filters.length; f++) {
                            var _filter = util_extend({
                                "Key": null, "EditorDataType": enCEEditorDataType.Text, "Text": "", "IsEnabled": true, "IsDivider": false,
                                "RequireAdministratorBase": false, "Value": null, "Attributes": null, "CssClass": null, "FieldOptions": null
                            }, _filters[f]);

                            var _valid = util_forceBool(_filter["IsEnabled"], true);

                            if (util_forceBool(_filter["RequireAdministratorBase"], false) && !_canAdminBase) {
                                _valid = false;
                            }

                            if (_valid) {

                                if (_filter.IsDivider) {
                                    _html += "<div class='Divider' />";
                                }
                                else {
                                    var _inputHTML = "";
                                    var _cssClass = util_forceString(_filter.CssClass);

                                    switch (_filter.Key) {

                                        case "Search":
                                            var _inputOptions = { "DataType": enCEEditorDataType.Text, "Attributes": null };
                                            var _val = (_hasExtendedViewState ? _viewState.ListState.ExtendedFilters[_filter.Key] : null);

                                            _inputOptions.Attributes = util_extend({
                                                "data-role": "none",
                                                "placeholder": "Search",
                                                "value": util_jsEncode(_val)
                                            }, _filter.Attributes);

                                            _inputOptions.Attributes[DATA_ATTRIBUTE_RENDER] = "searchable_field";

                                            _cssClass += (_cssClass != "" ? " " : "") + "FilterLayoutFull";

                                            _inputHTML = "<div class='SearchableView EditorSearchableView PluginEditorCardView'>" +
                                                         _controlInstance.Utils.HTML.InputEditorDataType(_inputOptions) +
                                                         "  <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' " +
                                                         "data-iconpos='notext' title='Clear' />" +
                                                         "</div>";

                                            break;  //end: Search

                                        default:

                                            var _inputOptions = {
                                                "DataType": _filter.EditorDataType
                                            };

                                            _inputHTML = _controlInstance.Utils.HTML.InputEditorDataType(_inputOptions);

                                            break;  //end: default
                                    }

                                    _html += "<div " + util_htmlAttribute("class", "Filter" + (_cssClass != "" ? " " + _cssClass : "")) + " " + 
                                             util_htmlAttribute("data-notification-filter-index", f) + ">" +
                                             "  <div class='Label'>" + util_htmlEncode(_filter.Text) + "</div>" +
                                             "  <div class='Content'>" + _inputHTML + "</div>" +
                                             "</div>";
                                }
                            }
                        }

                        //sort column dropdown
                        _html += "<select data-notification-sort-dropdown='1' data-mini='true' data-corners='false' />";

                        _html += "<span class='" + _fnGetCssClass(true) + "' data-notification-action-id='sort_toggle' title='Sort Ascending' " +
                                 util_htmlAttribute("data-attr-is-sort-asc", enCETriState.Yes) + ">arrow_upward</span>" +
                                 "<span class='" + _fnGetCssClass(false) + "' data-notification-action-id='sort_toggle' title='Sort Descending' " +
                                 util_htmlAttribute("data-attr-is-sort-asc", enCETriState.No) + ">arrow_downward</span>";

                        $vw.html(_html);

                        //bind extended filter events

                        $vw.off("change.onFilterItemRefresh");
                        $vw.on("change.onFilterItemRefresh", ".Filter[data-notification-filter-index] select[data-attr-input-element]", function (e, args) {
                            _controlInstance.Events.Refresh();
                        });

                        //flip switches
                        var $flipSwitches = $vw.find("[" + util_renderAttribute("flip_switch") + "]");

                        $flipSwitches.data("onChange", function () {
                            _controlInstance.Events.Refresh();
                        });

                        //allow clickable label events for flip switches
                        $.each($flipSwitches, function () {
                            var $flipSwitch = $(this);
                            var $parent = $flipSwitch.closest(".Filter");
                            var $lbl = $parent.children(".Label:first");

                            $lbl.off("click.onLabelFlipSwitchToggle");
                            $lbl.on("click.onLabelFlipSwitchToggle", function (e) {

                                var $ddl = $flipSwitch.find("select[data-attr-widget='flip_switch']:first");
                                var _disabled = $ddl.prop("disabled");

                                if (!_disabled) {
                                    var _current = $ddl.val();

                                    $ddl.val(_current == enCETriState.Yes ? enCETriState.No : enCETriState.Yes)
                                        .slider("refresh")
                                        .trigger("change");
                                }
                            });
                        });

                        //searchables
                        var $searchables = $vw.find("[" + util_renderAttribute("searchable_field") + "]");

                        $.each($searchables, function () {
                            $(function ($tb) {

                                $tb.data("SearchConfiguration", {
                                    "SearchableParent": $tb.closest(".SearchableView"),
                                    "OnRenderResult": function (result, opts) {

                                        var $repeater = null;

                                        if (_controlInstance.DOM.ListView) {
                                            $repeater = _controlInstance.DOM.ListView.data("Repeater");
                                        }

                                        if ($repeater) {

                                            //persist the highlight encoder and cached results to the list view
                                            _controlInstance.DOM.ListView.data({
                                                "cachedResults": result,
                                                "highlightEncoder": opts["HighlightEncoder"]
                                            });

                                            $repeater.trigger("events.refresh_list", { "NavigatePageNo": 1 });
                                        }
                                    },
                                    "OnSearch": function (opts, callback) {

                                        var _params = _controlInstance.State.ListParams({
                                            "PageSize": _controlInstance.Options.ListSize,
                                            "PageNum": 1    //default to first page for the search
                                        });

                                        _controlInstance.Events.GetList.call(this, _params, callback);

                                        //associate last service request to search element
                                        $tb.data("LastRequest", GlobalService.LastRequest);
                                    }
                                });

                            }($(this)));
                        });

                        $mobileUtil.refresh($vw);

                        //refresh the searchable fields clear button based on text
                        $searchables.trigger("events.toggleSearchModeState");

                        //bind the filter default values
                        var $inputs = $vw.find("[" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");                        

                        $.each($inputs, function () {
                            var $this = $(this);
                            var _index = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-notification-filter-index"), -1);

                            if (_index >= 0 && _index < _filters.length) {
                                var _filter = _filters[_index];

                                var _tempItem = {
                                    "Value": _filter["Value"]
                                };

                                if (_hasExtendedViewState) {
                                    var _key = util_forceString(_filter["Key"]);

                                    if (_key != "") {
                                        _tempItem.Value = _viewState.ListState.ExtendedFilters[_key];
                                    }
                                }

                                //construct wrapper editor render field item and initialize
                                var _field = {};

                                _field[enColCEditorRenderFieldProperty.EditorDataTypeID] = _filter["EditorDataType"];
                                _field[enColCEditorRenderFieldProperty.Options] = _filter["FieldOptions"];

                                _controlInstance.Utils.InitEditorRenderField({ "Controller": _controlInstance, "Field": _field });

                                _controlInstance.Utils.Actions.InputEditorDataType({
                                    "Controller": _controlInstance,
                                    "IsGetValue": false,
                                    "Element": $this,
                                    "PropertyPath": "Value",
                                    "DataItem": _tempItem,
                                    "FieldItem": _field["_fieldItem"]
                                });
                            }
                        });

                        //bind the sort column dropdown and event
                        var $ddl = $vw.find("select[data-notification-sort-dropdown='1']:first");

                        util_dataBindDDL($ddl, _controlInstance.Data.CurrentRenderOptions.SettingsSortColumnOptions, "Text", "Value",
                                         _controlInstance.Data.CurrentRenderOptions.DefaultSortColumn, false);

                        $ddl.off("change.notifications_onSort");
                        $ddl.on("change.notifications_onSort", function () {
                            var $this = $(this);
                            var _val = $this.val();

                            //set updated sort column and refresh (do not force numeric, as this is handled elsewhere and may need to support non-numeric sort column values)
                            _controlInstance.DOM.ListView.data("SortColumn", _val);

                            _controlInstance.Events.Refresh();

                        }); //end: change.notifications_onSort

                    };  //end: _fnBindViewFilters

                    switch (_controlInstance.Options.Layout) {

                        case "badge":

                            //disable spaces between elements for the HTML due to inline styles
                            _html += "<div class='DisableUserSelectable LinkClickable Badge ModeNoRecords'>" +
                                     "<i class='material-icons'>announcement</i>" +
                                     "<div class='Label'>" +
                                     "      <span>" + util_htmlEncode("0") + "</span>" +
                                     "</div>" +
                                     "<div class='ViewSettings' style='display: none;' />" +
                                     "</div>";

                            _fnConfigureElement = function () {

                                $element.off("click.notifications_onViewBadgeDetails");
                                $element.on("click.notifications_onViewBadgeDetails", function () {
                                    if (!$element.hasClass("LinkDisabled")) {
                                        $element.addClass("LinkDisabled");

                                        var _clickCallback = function () {
                                            $body.addClass("ViewOverflowHidden");
                                            $element.removeClass("LinkDisabled");
                                        };

                                        var _id = util_forceString($element.data("notifications-linked-details-id"));

                                        if (_id == "") {
                                            _id = "vwDetailNotifications_" + (new Date()).getTime();
                                            $element.data("notifications-linked-details-id", _id);
                                        }

                                        var $vw = $mobileUtil.GetElementByID(_id);
                                        var $body = $("body");

                                        if ($vw.length == 0) {
                                            $vw = $("<div class='ViewModeFixed ScrollbarSecondary' " + util_htmlAttribute("id", _id) + " " +
                                                    util_renderAttribute("pluginEditor_notifications") + " />");

                                            $vw.css({ "width": "0%" });

                                            $mobileUtil.Content().append($vw);

                                            //associate the user admin validation function
                                            $vw.data("NotificationCanUserAdmin", _controlInstance.DOM.Element.data("NotificationCanUserAdmin"));

                                            //force initialization of the notification element
                                            _controlInstance.State.OnApplyDataFunction("NotificationOnViewBadeDetailInit", {
                                                "List": $vw
                                            });

                                            $mobileUtil.RenderRefresh($vw, true);
                                        }

                                        $vw.animate({ "width": "100%" }, "normal", function () {
                                            _clickCallback();
                                        });
                                    }

                                }); //end: click.notifications_onViewBadgeDetails
                            };

                            break;  //end: badge

                        default:
                            var _isVisibleViewSettings = false;
                            var _viewState = _controlInstance.State.GetViewState();

                            if (_viewState) {
                                _isVisibleViewSettings = util_forceBool(_viewState["IsViewSettingsOpen"], _isVisibleViewSettings);
                            }

                            _html += "<div class='PluginEditorCardView CardModeInline'>" +
                                     "  <div class='DisableUserSelectable Header'>" +
                                     "      <div class='Title'>" +
                                     "          <div class='Label'>" + util_htmlEncode(_controlInstance.Data.CurrentRenderOptions.Title) + "</div>" +
                                     "      </div>" +
                                     "      <div class='Actions'>" +
                                     (_canAdmin ?
                                     "          <span class='LinkClickable material-icons' data-notification-action-id='add_new' " +
                                     util_htmlAttribute("title", _controlInstance.Data.CurrentRenderOptions.TooltipActionAddNew, null, true) + ">add_circle</span>" :
                                     ""
                                     ) +
                                     "          <span class='LinkClickable material-icons" + (_isVisibleViewSettings ? " StateOn": "") + "' " +
                                     "title='Settings' data-notification-action-id='settings'>more_vert</span>" +
                                     "          <span class='LinkClickable material-icons ViewFixedModeOn ButtonDismiss' title='Close' " +
                                     "data-notification-action-id='exit'>cancel</span>" +
                                     "      </div>" +
                                     "  </div>" +
                                     "  <div class='DisableUserSelectable ViewSettings'" + (_isVisibleViewSettings ? "" : " style='display: none;'") + " />" +
                                     "  <div class='ListView' />" +
                                     "</div>";

                            break;  //end: default
                    }

                    $element.html(_html);
                    $mobileUtil.refresh($element);

                    $element.toggleClass("ViewModeAdmin", _canAdmin);

                    _controlInstance.DOM.ListCardContainer = $element.children(".PluginEditorCardView.CardModeInline:first");
                    _controlInstance.DOM.ListHeaderTitleLabel = _controlInstance.DOM.ListCardContainer.children(".Header").find(".Title:first > .Label");
                    _controlInstance.DOM.ListView = _controlInstance.DOM.ListCardContainer.children(".ListView:first");
                    _controlInstance.DOM.Badge = $element.children(".Badge:first");
                    _controlInstance.DOM.BadgeLabelCount = _controlInstance.DOM.Badge.find(".Label:first > span");

                    $element.off("click.notifications_onAction");
                    $element.on("click.notifications_onAction", ".LinkClickable[data-notification-action-id]:not(.LinkDisabled)", _controlInstance.Events.OnActionClick);

                    $element.off("events.notifications_persistViewState");
                    $element.on("events.notifications_persistViewState", function (e, args) {
                        args = util_extend({ "ExtState": undefined }, args);

                        //requires a valid view state key
                        if (_controlInstance.State.HasViewStateKey()) {
                            var _baseState = _controlInstance.State.BaseParams();
                            var $clActionSettings = _controlInstance.DOM.Element.find(".Header:first .Actions > .LinkClickable[data-notification-action-id='settings']");

                            var _state = {
                                "ListState": _controlInstance.State.ListParams(),
                                "ListSortSettings": _controlInstance.State.ListViewSortSettings(),
                                "IsViewSettingsOpen": $clActionSettings.hasClass("StateOn")
                            };

                            var $body = $("body");
                            var _lookup = $body.data("pluginEditor_notifications");

                            if (!_lookup) {
                                _lookup = {};
                                $body.data("pluginEditor_notifications", _lookup);
                            }

                            var _entry = _lookup[_controlInstance.Options.ViewStateKey];

                            if (!_entry) {
                                _entry = { "Control": null, "Ext": null };
                                _lookup[_controlInstance.Options.ViewStateKey] = _entry;
                            }

                            _entry["Control"] = _state;

                            if (args.ExtState !== undefined) {
                                _entry["Ext"] = args.ExtState;
                            }
                        }

                    }); //end: events.notifications_persistViewState

                    $element.off("remove.notifications_cleanup");
                    $element.on("remove.notifications_cleanup", function () {
                        $element.trigger("events.notifications_persistViewState");
                    });

                    $element.off("event.notifications_refresh");
                    $element.on("event.notifications_refresh", function (e, args) {

                        args = util_extend({ "IsClearInitBindState": true }, args);

                        _controlInstance.Events.Refresh(args);
                    }); //end: event.notifications_refresh

                    if (_fnConfigureElement) {
                        _fnConfigureElement();
                    }

                    var _instance = this;

                    _controlInstance.State.OnApplyDataFunction("NotificationOnInit", {
                        "Callback": function () {

                            _fnBindViewFilters();

                            if (!options) {
                                options = {};
                            }

                            options["IsInit"] = true;

                            _instance.Bind(options);
                        }
                    });

                },  //end: Init

                "Bind": function (options) {

                    options = util_extend({ "IsInit": false, "Callback": null, "IsDependencyUpdate": false, "IsBackgroundUpdate": false }, options);

                    var _queue = new CEventQueue();                    

                    switch (_controlInstance.Options.Layout) {

                        case "badge":

                            //disable dependency updates for badges
                            options.IsDependencyUpdate = false;

                            //restrict to first page and single item (since only want total count)
                            _queue.Add(function (onCallback) {

                                _controlInstance.Events.GetList({
                                    "_indicators": (util_forceBool(options.IsBackgroundUpdate, false) == false),
                                    "PageSize": 1,
                                    "PageNum": 1
                                }, function (result) {

                                    result = util_extend({ "NumItems": null }, result);

                                    var _count = util_forceInt(result.NumItems);
                                    var _strCount = _count;

                                    if (_count >= 100) {
                                        _strCount = "99+";
                                    }

                                    var _title = util_forceString(_controlInstance.Data.CurrentRenderOptions["Title"], "");

                                    if (_title != "") {
                                        _title += ": ";
                                    }

                                    _controlInstance.DOM.BadgeLabelCount.text(_strCount)
                                                        .toggleClass("LabelSizeSmall", (_count >= 100));
                                    _controlInstance.DOM.Badge.attr("title", _title + _count);

                                    _controlInstance.DOM.Badge.toggleClass("ModeNoRecords", (_count == 0));

                                    onCallback();
                                });
                            });

                            break;  //end: badge

                        default:

                            var $repeater = _controlInstance.DOM.ListView.data("Repeater");

                            if (!$repeater || $repeater.length == 0) {
                                var _id = "vwEditorNotifications_" + (new Date()).getTime();

                                var _noRecords = util_extend({
                                    "DefaultNoRecordMessage": null,
                                    "IsNoRecordMessageHTML": false
                                }, {
                                    "DefaultNoRecordMessage": _controlInstance.Data.CurrentRenderOptions["ListNoRecordsMessage"],
                                    "IsNoRecordMessageHTML": _controlInstance.Data.CurrentRenderOptions["IsListNoRecordsMessageHTML"]
                                });

                                if (_noRecords.DefaultNoRecordMessage == null) {
                                    _noRecords.DefaultNoRecordMessage = "<i class='material-icons'>error_outline</i>" +
                                                                        "<div class='Label'>" + util_htmlEncode(MSG_CONFIG.ListNoRecords) + "</div>";
                                    _noRecords.IsNoRecordMessageHTML = true;
                                }

                                $repeater = _controlInstance.Utils.Repeater({
                                    "ID": _id,
                                    "CssClass": "TableMinimalList",
                                    "IsTableEnhance": false,
                                    "IsFooterNoRecords": true,
                                    "DefaultNoRecordMessage": _noRecords.DefaultNoRecordMessage,
                                    "IsNoRecordMessageHTML": _noRecords.IsNoRecordMessageHTML,
                                    "PageSize": _controlInstance.Options.ListSize,
                                    "SortOrderGroupKey": "listview_" + _id,
                                    "Columns": [{ "id": "detail" }],
                                    "RepeaterFunctions": {
                                        "FieldValue": function (opts) {
                                            var _val = "";
                                            var _item = opts.Item;
                                            var _isEncode = true;

                                            if (opts.IsContent && opts.Index == 0) {

                                                _isEncode = false;

                                                var _entityRenderOptions = _controlInstance.Data.CurrentRenderOptions;

                                                var _canAdmin = (_controlInstance.Data.Cache.CanAdmin === true);

                                                var _itemID = util_propertyValue(_item, _entityRenderOptions.PropertyPathID);
                                                var _hasItemID = (util_forceInt(_itemID, enCE.None) != enCE.None);
                                                var _itemIndex = util_forceInt(opts["DataItemIndex"], -1);

                                                var _heading = util_propertyValue(_item, _entityRenderOptions.PropertyPathHeading);
                                                var _title = util_propertyValue(_item, _entityRenderOptions.PropertyPathTitle);
                                                var _date = util_propertyValue(_item, _entityRenderOptions.PropertyPathDate);
                                                var _userHasViewed = util_forceBool(util_propertyValue(_item, _entityRenderOptions.PropertyPathUserHasViewed), false);
                                                var _letter = "?";
                                                var _fnHighlightEncoder = _controlInstance.DOM.ListView.data("highlightEncoder");
                                                var _isPriority = false;
                                                var _attr = util_htmlAttribute("data-item-id", _itemID) + " " + util_htmlAttribute("data-item-index", _itemIndex);
                                                var _canDismiss = _hasItemID;

                                                if (_entityRenderOptions.PropertyPathIsPriority) {
                                                    _isPriority = util_forceBool(util_propertyValue(_item, _entityRenderOptions.PropertyPathIsPriority), _isPriority);
                                                }

                                                if (_entityRenderOptions.ListItemRenderAttributePropertyPaths) {

                                                    for (var a = 0; a < _entityRenderOptions.ListItemRenderAttributePropertyPaths.length; a++) {
                                                        var _propPath = _entityRenderOptions.ListItemRenderAttributePropertyPaths[a];
                                                        var _attrName = _controlInstance.State.ListItemAttributeNamePropertyPath(_propPath);

                                                        _attr += " " + util_htmlAttribute(_attrName, util_propertyValue(_item, _propPath), null, true);
                                                    }
                                                }

                                                if (util_forceString(_heading) == "") {
                                                    _heading = util_forceString(_entityRenderOptions.PlaceholderHeading);
                                                }

                                                if (_heading != "" && _heading.length >= 1) {
                                                    _letter = _heading.charAt(0);
                                                }

                                                if (!_canDismiss && _entityRenderOptions.PropertyPathFallbackDismissableID) {

                                                    //check if the item is still dismissable (if it has a fallback property path ID)
                                                    var _fallbackID = util_forceInt(util_propertyValue(_item, _entityRenderOptions.PropertyPathFallbackDismissableID), enCE.None);

                                                    _canDismiss = (_fallbackID != enCE.None);
                                                }

                                                _date = util_FormatDateTime(_date, NA, null, false, { "IsValidateConversion": true, "ForceDayPadding": true });

                                                _val += "<div class='NotificationItem" + (_hasItemID ? "" : " StateOff") + (_isPriority ? " NotificationPriorityOn" : "") +
                                                        (_controlInstance.Data.RenderIndexOdd ? " ListItemOdd" : "") +
                                                        (_userHasViewed ? " NotificationViewedOn" : "") + "' " + _attr + ">" +
                                                        "    <div class='DisableUserSelectable Icon'>" +
                                                        "       <div class='Label'>" + util_htmlEncode(_letter) + "</div>" +
                                                        "    </div>" +
                                                        "    <div class='Content'>";    //open content tag

                                                _val += "<div class='Heading'>" +
                                                        "<div class='DisableUserSelectable material-icons'>chevron_right</div>" +
                                                        "<div class='Label'>" +
                                                        (_fnHighlightEncoder ? _fnHighlightEncoder(_heading, true) : util_htmlEncode(_heading, true)) +
                                                        "</div>" +
                                                        "</div>";

                                                _val += "        <div class='Title'>" +
                                                        "            <div class='Label'>" +
                                                        _controlInstance.Utils.HTML.ParseTextLinkHTML(_title, { "HighlightEncoder": _fnHighlightEncoder }) +
                                                        "            </div>" +
                                                        "        </div>" +
                                                        "    </div>";   //close content tag

                                                _val += "   <div class='LabelDate'>" +
                                                        "<i class='material-icons'>date_range</i>" +
                                                        "<span>" + util_htmlEncode(_date) + "</span>" +
                                                        "   </div>";

                                                var MAX_ACTION_ICONS = 3;

                                                var _listItemRenderOpts = {
                                                    "Element": _controlInstance.DOM.Element, "Controller": _controlInstance,
                                                    "ViewAction": {
                                                        "IsEnabled": false, "HasCallout": false, "Icon": "visibility"
                                                    },
                                                    "ActionList": [], "Item": _item, "Index": _itemIndex
                                                };

                                                var _arrActions = [];

                                                if (_controlInstance.Data.Cache.OnRenderOptionListItem) {
                                                    _controlInstance.Data.Cache.OnRenderOptionListItem.call(this, _listItemRenderOpts);
                                                }
                                                
                                                _val += "<div class='DisableUserSelectable Actions'>";

                                                if (_canDismiss) {
                                                    _arrActions.push({
                                                        "id": (_userHasViewed ? "list_item_restore" : "list_item_dismiss"),
                                                        "icon": (_userHasViewed ? "archive" : "unarchive"),
                                                        "cssClass": (_userHasViewed ? " ActionThemeUndo" : ""),
                                                        "tooltip": (_userHasViewed ? _entityRenderOptions.TooltipActionDismissUndo : _entityRenderOptions.TooltipActionDismiss)
                                                    });
                                                }
                                                
                                                if (_canAdmin && _hasItemID) {
                                                    _arrActions.push({
                                                        "id": "list_item_edit",
                                                        "icon": "edit",
                                                        "tooltip": "Edit"
                                                    });

                                                    _arrActions.push({
                                                        "id": "list_item_delete",
                                                        "icon": "delete",
                                                        "tooltip": "_entityRenderOptions.TooltipActionDelete"
                                                    });
                                                }

                                                if (_listItemRenderOpts.ViewAction.IsEnabled) {
                                                    var _viewAction = {
                                                        "id": "list_item_view",
                                                        "icon": _listItemRenderOpts.ViewAction.Icon,
                                                        "tooltip": (_listItemRenderOpts.ViewAction.HasCallout ? "" : "View"),
                                                        "Attributes": {}
                                                    };

                                                    if (_listItemRenderOpts.ViewAction.HasCallout) {
                                                        _viewAction["renderer"] = "callout";
                                                        _viewAction.Attributes["data-callout-disable-is-touch"] = enCETriState.Yes;
                                                        _viewAction.Attributes["data-callout-options-side"] = "left";
                                                    }

                                                    _arrActions.push(_viewAction);
                                                }

                                                for (var a = 0; a < _arrActions.length; a++) {
                                                    var _actionItem = _arrActions[a];
                                                    var _itemCssClass = util_forceString(_actionItem["cssClass"]);
                                                    var _attrs = "";

                                                    if (util_forceString(_actionItem["renderer"]) != "") {
                                                        _attrs += " " + util_renderAttribute(_actionItem.renderer);
                                                    }

                                                    if (_actionItem["Attributes"]) {
                                                        for (var _name in _actionItem.Attributes) {
                                                            _attrs += " " + util_htmlAttribute(_name, _actionItem.Attributes[_name], null, true);
                                                        }
                                                    }

                                                    _val += "<span class='LinkClickable material-icons" + (_itemCssClass != "" ? " " + _itemCssClass : "") + "' " +
                                                            (_attrs != "" ? _attrs + " " : "") +
                                                            util_htmlAttribute("data-notification-action-id", _actionItem["id"], null, true) + " " +
                                                            util_htmlAttribute("title", _actionItem["tooltip"], null, true) + ">" +
                                                            _actionItem.icon +
                                                            "</span>";

                                                    if (a + 1 < _arrActions.length && (a + 1) % MAX_ACTION_ICONS == 0) {
                                                        _val += "<div class='Divider' />";
                                                    }
                                                }

                                                //append placeholder elements (to force alignment to the left)
                                                var _remainder  = _arrActions.length % MAX_ACTION_ICONS;

                                                if (_remainder > 0){
                                                    _remainder = Math.max(MAX_ACTION_ICONS - _remainder, 0);

                                                    for (var i = 0; i < _remainder; i++) {
                                                        _val += "<span class='LinkDisabled material-icons'>block</span>";
                                                    }
                                                }

                                                _val += "</div>";   //close actions tag

                                                _val += "</div>";

                                                _controlInstance.Data.RenderIndexOdd = !(_controlInstance.Data.RenderIndexOdd);
                                            }

                                            return _val;
                                        },
                                        "GetData": function (element, sortSetting, callback) {

                                            _controlInstance.Data.RenderIndexOdd = true;
                                            _controlInstance.Data.Cache.CanAdmin = _controlInstance.State.CanAdmin();

                                            //cache instance to function for configuring a list item render option
                                            _controlInstance.Data.Cache.OnRenderOptionListItem = _controlInstance.State.OnApplyDataFunction("NotificationOnRenderOptionListItem",
                                                                                                                                            null, false);

                                            _controlInstance.Data.Cache.OnRenderOptionListItemCallout =
                                                _controlInstance.State.OnApplyDataFunction("NotificationOnRenderOptionListItemCallout", null, false);

                                            _controlInstance.Data.Cache.OnRenderOptionListItemConfigureCalloutFields =
                                                _controlInstance.State.OnApplyDataFunction("NotificationOnRenderOptionListItemConfigureCalloutFields", null, false);

                                            var _cachedResults = _controlInstance.DOM.ListView.data("cachedResults");

                                            //check if a cached result is available to be rendered
                                            if (_cachedResults) {
                                                _controlInstance.DOM.ListView.removeData("cachedResults");
                                                callback(_cachedResults);
                                            }
                                            else {

                                                var _params = _controlInstance.State.ListParams({
                                                    "PageSize": util_forceInt(sortSetting.PageSize, _controlInstance.Options.ListSize),
                                                    "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
                                                });

                                                _controlInstance.Events.GetList.call(this, _params, callback);
                                            }
                                        },
                                        "BindComplete": function (opts) {

                                            _controlInstance.DOM.ListView.data("DataSource", opts.Data);

                                            var _numItems = util_forceInt(opts.Data ? opts.Data["NumItems"] : null, 0);

                                            _controlInstance.DOM.ListHeaderTitleLabel
                                                                .text(util_forceString(_controlInstance.Data.CurrentRenderOptions.Title) +
                                                                      " (" + util_formatNumber(_numItems) + ")");

                                            if (!_controlInstance.DOM.ListView.data("is-init-listview-bind-event")) {
                                                _controlInstance.DOM.ListView.data("is-init-listview-bind-event", true);

                                                var _extViewState = _controlInstance.State.GetViewState("Ext");

                                                if (_extViewState && _extViewState["InitialFocus"]) {

                                                    var _stateInitialFocus = _extViewState["InitialFocus"];
                                                    var _entityRenderOptions = _controlInstance.Data.CurrentRenderOptions;

                                                    if (_entityRenderOptions.ListItemRenderAttributePropertyPaths) {
                                                        var _selector = ".NotificationItem[data-item-index]";

                                                        for (var a = 0; a < _entityRenderOptions.ListItemRenderAttributePropertyPaths.length; a++) {
                                                            var _propPath = _entityRenderOptions.ListItemRenderAttributePropertyPaths[a];
                                                            var _attrName = _controlInstance.State.ListItemAttributeNamePropertyPath(_propPath);

                                                            var _key = "ListItem" + _propPath;
                                                            var _val = _stateInitialFocus[_key];

                                                            if (_val === null || _val === undefined) {
                                                                _selector += "[" + _attrName + "]";
                                                            }
                                                            else {
                                                                _selector += "[" + util_htmlAttribute(_attrName, _val, null, true) + "]";
                                                            }
                                                        }

                                                        _selector += ":first";

                                                        var $search = _controlInstance.DOM.ListView.find(_selector);

                                                        if ($search.length == 1) {

                                                            $search.addClass("StateFocus");

                                                            setTimeout(function () {

                                                                $("html, body").finish()
                                                                               .animate({ "scrollTop": $search.position().top + "px" }, function () {

                                                                                   setTimeout(function () {
                                                                                       $search.removeClass("StateFocus");
                                                                                   }, 750);
                                                                               });
                                                            }, 10);
                                                        }
                                                    }

                                                    //delete the property value as it has been processed
                                                    delete _extViewState["InitialFocus"];
                                                }
                                            }

                                            if (_controlInstance.DOM.ListView.data("OnCallback")) {
                                                var _fn = _controlInstance.DOM.ListView.data("OnCallback");

                                                _controlInstance.DOM.ListView.removeData("OnCallback");
                                                _fn.call(_controlInstance.DOM.ListView);
                                            }
                                        }
                                    }
                                });

                                _controlInstance.DOM.ListView.append($repeater);
                                $mobileUtil.refresh(_controlInstance.DOM.ListView);

                                //configure the list view tooltip events
                                $repeater.off("callout_tooltip.getContent");
                                $repeater.on("callout_tooltip.getContent", function (e, args) {

                                    var $this = $(args.Trigger);
                                    var $parent = $this.closest("[data-item-id]");
                                    var _itemID = util_forceInt($parent.attr("data-item-id"), enCE.None);
                                    var _itemIndex = util_forceInt($parent.attr("data-item-index"), -1);
                                    var _item = _controlInstance.State.GetListItem(_itemID, _itemIndex);

                                    args = util_extend({}, args);

                                    args["ElementListItem"] = $parent;
                                    args["Item"] = _item;

                                    var _baseCallback = args["Callback"];   //callback used for the callout tooltip content

                                    var _fnLoadMetadata = function (key, canCache, loadCallback) {

                                        var _callback = function (data, fromCache) {

                                            if (!fromCache) {
                                                data = _controlInstance.Utils.ConvertPropertyDetailsToRenderFields({
                                                    "Controller": _controlInstance, "List": data
                                                });

                                                //find all list box based fields and configure the custom label item HTML function
                                                for (var f = 0; f < data.length; f++) {
                                                    var _field = data[f];

                                                    if (_field[enColCEditorRenderFieldProperty.EditorDataTypeID] == enCEEditorDataType.Listbox) {
                                                        var _renderList = util_propertyValue(_field, "_fieldItem._renderList");

                                                        if (_renderList) {
                                                            _renderList["IsListBoxDisplayCustomLabel"] = true;
                                                            _renderList["GetDisplayLabelHTML"] = function (opts) {

                                                                return "<div class='LabelLineItem' " + util_htmlAttribute("item-value", opts.Value) + ">" +
                                                                       util_htmlEncode(opts.Name) +
                                                                       "</div>";
                                                            };
                                                        }
                                                    }
                                                }
                                            }

                                            if (canCache) {
                                                _lookup[key] = data;
                                            }

                                            loadCallback(data);

                                        };  //end: _callback

                                        canCache = util_forceBool(canCache, false);

                                        var _lookup = _controlInstance.Data.Cache.LookupEntityMetadata;

                                        if (!_lookup){
                                            _lookup = {};
                                            _controlInstance.Data.Cache.LookupEntityMetadata = _lookup;
                                        }

                                        if (canCache && _lookup[key]) {
                                            _callback(_lookup[key], true);
                                        }
                                        else {

                                            GlobalService.HasIndicators = false;
                                            GlobalService.EntityMetadata(util_forceInt(MODULE_MANAGER.Current.ModuleID, enCE.None), key, ext_requestSuccess(function (data) {
                                                _callback(data);
                                            }));
                                        }

                                    };  //end: _fnLoadMetadata

                                    args["Callback"] = function (result) {
                                        result = util_extend({ "EntityMetadataParam": null, "Title": null, "Content": null, "IsHTML": false }, result);

                                        //check if the entity metadata parameter is specified (i.e. not hardcoded specific tooltip content)
                                        if (util_forceString(result.EntityMetadataParam) != "") {

                                            var _fnGetTooltipContentHTML = function (title, fields, isPlaceholder) {

                                                isPlaceholder = util_forceBool(isPlaceholder, false);
                                                fields = (fields || []);

                                                var _html = "";

                                                _html += "<div class='EditorNotificationTooltipView" + (isPlaceholder ? " EditorElementPlaceholderOn" : "") + "'>";

                                                if (isPlaceholder) {

                                                    _html += "<div class='Placeholders'>" +
                                                             "  <div class='Placeholder' />" +
                                                             "  <div class='Placeholder TextLine_2' />" +
                                                             "  <div class='Placeholder' />" +
                                                             "  <div class='Placeholder TextLine_3' />" +
                                                             "  <div class='Placeholder' />" +
                                                             "  <div class='Placeholder' />" +
                                                             "</div>";

                                                }
                                                else {
                                                    _html += "  <div class='Title'>" +
                                                             "      <div class='Label'>" + util_htmlEncode(title, true) + "</div>" +
                                                             "  </div>";

                                                    _html += _controlInstance.Utils.HTML.RenderOptionTableHTML({
                                                        "Controller": _controlInstance, "List": fields, "IsRenderAllModes": true
                                                    });
                                                }

                                                _html += "</div>";

                                                return _html;

                                            };  //end: _fnGetTooltipContentHTML

                                            args.SetCalloutContent($(_fnGetTooltipContentHTML(null, null, true)));

                                            _fnLoadMetadata(result.EntityMetadataParam, true, function (fields) {

                                                APP.Service.Action({
                                                    "_indicators": false,
                                                    "c": "PluginEditor", "m": "NotificationGetCalloutDataItem",
                                                    "args": {
                                                        "Item": util_stringify(_item),
                                                        "EntityMetadataParam": result.EntityMetadataParam
                                                    }
                                                }, function (dataItem) {

                                                    var _fieldsOpts = {
                                                        "Fields": fields,
                                                        "Item": _item,
                                                        "EntityMetadataParam": result.EntityMetadataParam,
                                                        "EntityDataItem": dataItem
                                                    };

                                                    //allow project overrides to the render fields
                                                    _controlInstance.Data.Cache.OnRenderOptionListItemConfigureCalloutFields.call($this, _fieldsOpts);

                                                    var _html = _fnGetTooltipContentHTML(result.Title, fields);
                                                    
                                                    var $vw = $(_html);
                                                    var $inputs = $vw.find(".PropertyView .ViewSummary [" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");

                                                    //bind the details
                                                    $.each($inputs, function (index) {
                                                        var $this = $(this);
                                                        var _field = fields[index];

                                                        _controlInstance.Utils.Actions.InputEditorDataType({
                                                            "Controller": _controlInstance,
                                                            "IsGetValue": false,
                                                            "Element": $this,
                                                            "FieldItem": _field["_fieldItem"],
                                                            "DataItem": dataItem,
                                                            "IsDatePickerRenderer": true
                                                        });
                                                    });
                                                    
                                                    setTimeout(function () {
                                                        args.SetCalloutContent($vw);
                                                    }, 250);
                                                });
                                            });
                                        }
                                        else {

                                            //call the base tooltip content callback to render the result
                                            _baseCallback(result);
                                        }
                                    };

                                    if (_controlInstance.Data.Cache.OnRenderOptionListItemCallout) {
                                        _controlInstance.Data.Cache.OnRenderOptionListItemCallout.call($this, args);
                                    }

                                }); //end: callout_tooltip.getContent

                                _controlInstance.DOM.ListView.data("Repeater", $repeater);
                            }

                            _queue.Add(function (onCallback) {
                                _controlInstance.DOM.ListView.data("OnCallback", onCallback);

                                var _navigatePageNo = null;

                                if (options.IsInit && _controlInstance.State.HasViewStateKey()) {
                                    var _viewState = _controlInstance.State.GetViewState();
                                    var $tbSearch = _controlInstance.DOM.Element.find(".ViewSettings:first .Filter [" + util_renderAttribute("searchable_field") + "]:first");

                                    var _temp = {
                                        "Search": $tbSearch.val()
                                    };

                                    if (_temp.Search != "") {

                                        $tbSearch.trigger("events.searchable_getHighlightEncoder", _temp);

                                        //persist the highlight encoder
                                        _controlInstance.DOM.ListView.data({
                                            "highlightEncoder": _temp["Result"]
                                        });
                                    }

                                    if (_viewState && _viewState["ListSortSettings"]) {
                                        var _no = util_forceInt(_viewState.ListSortSettings["PageNo"], -1);

                                        if (_no > 0) {
                                            _navigatePageNo = _no;
                                        }
                                    }
                                }

                                $repeater.trigger("events.refresh_list", { "NavigatePageNo": _navigatePageNo });
                            });
                            
                            break;  //end: default, list view
                    }

                    _queue.Run({
                        "Callback": function () {

                            if (options.IsDependencyUpdate) {

                                //find all elements on the page and queue it to be part of its update
                                var $list = $mobileUtil.Find("[" + util_renderAttribute("pluginEditor_notifications") + "]").not($element);

                                var _updateQueue = new CEventQueue();

                                $.each($list, function () {
                                    $(function (obj) {
                                        var $this = $(obj);

                                        _updateQueue.Add(function (onCallback) {

                                            var _currentCtlInstance = $this.data("Controller-EditorNotifications");

                                            if (_currentCtlInstance) {
                                                try {
                                                    _currentCtlInstance.Events.Bind({ "Callback": onCallback });
                                                } catch (e) {
                                                    onCallback();
                                                }
                                            }
                                            else {
                                                onCallback();
                                            }
                                        });
                                    }(this));
                                });

                                _updateQueue.Run({
                                    "Callback": function () {
                                        if (options.Callback) {
                                            options.Callback();
                                        }
                                    }
                                });
                            }
                            else if (options.Callback) {
                                options.Callback();
                            }
                        }
                    });

                },   //end: Bind

                "Refresh": function (options) {

                    options = util_extend({ "IsClearInitBindState": false }, options);

                    options["IsRefresh"] = true;

                    if (options.IsClearInitBindState && _controlInstance.DOM.ListView) {
                        _controlInstance.DOM.ListView.removeData("is-init-listview-bind-event");
                    }

                    _controlInstance.Events.Bind(options);

                },   //end: Refresh,

                "OnConfigureEditView": {

                    "announcement": function (options) {

                        var _onConfigureCallback = function () {
                            if (options.Callback) {
                                options.Callback();
                            }
                        };

                        var _selector = "";
                        var _arrPropertyPath = [
                            {
                                "p": enColEditorAnnouncementProperty.ClassificationID, "requireInit": true,
                                "onChangeRef": [enColEditorAnnouncementProperty.ClassificationPlatformID]
                            },
                            {
                                "p": enColEditorAnnouncementProperty.ClassificationPlatformID, "dependency": [enColEditorAnnouncementProperty.ClassificationID],
                                "onChangeRef": [enColEditorAnnouncementProperty.ComponentID]
                            },
                            {
                                "p": enColEditorAnnouncementProperty.ComponentID, "dependency": [enColEditorAnnouncementProperty.ClassificationPlatformID]
                            }
                        ];

                        for (var i = 0; i < _arrPropertyPath.length; i++) {
                            var _propItem = _arrPropertyPath[i];

                            _selector += (i > 0 ? "," : "") + ".PropertyView[" + util_htmlAttribute("data-attr-prop-path", _propItem.p) + "] " +
                                         "select[" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]";
                        }

                        var $list = _controlInstance.DOM.ActiveEditView.find(_selector);
                        var _queue = new CEventQueue();
                        var _dataItem = options.Item;
                        var _isAddNew = util_forceBool(options["IsAddNew"], true);

                        $list.selectmenu("disable");

                        var _lookupElement = {};

                        var _lookupFieldItem = {};
                        var _renderOptions = _controlInstance.DOM.ActiveEditView.data("RenderOptions");

                        if (_renderOptions && _renderOptions["Fields"]) {
                            var _fields = _renderOptions.Fields;

                            for (var f = 0; f < _fields.length; f++) {
                                var _field = _fields[f];
                                var _prop = _field[enColCEditorRenderFieldProperty.PropertyPath];

                                if (_prop) {
                                    _lookupFieldItem[_prop] = _field;
                                }
                            }
                        }

                        var _tempInstancePluginEditor = null;
                        var _fnIsClassificationSelectPlatform = function (classification) {
                            var _ret = null;

                            if (classification) {
                                if (!_tempInstancePluginEditor) {
                                    _tempInstancePluginEditor = new CPluginEditor();
                                }

                                var _classificationOpts = _tempInstancePluginEditor.Utils.GetDefaultOptions({
                                    "Type": "Classification", "StrJSON": classification[enColClassificationProperty.OptionJSON]
                                });

                                var _isUnmanaged = util_propertyValue(_classificationOpts, "UserHomeView.IsUnmanaged");
                                var _isAutoSelectPlatform = util_propertyValue(_classificationOpts, "Notifications.IsAutoSelectPlatform");

                                _ret = (_isUnmanaged || _isAutoSelectPlatform);
                            }

                            return _ret;

                        };  //end: _fnIsClassificationSelectPlatform

                        $.each($list, function (index) {
                            var $ddl = $(this);

                            $(function ($ddl) {

                                var _propItem = _arrPropertyPath[index];

                                _lookupElement[_propItem.p] = $ddl;

                                if (_propItem["dependency"]) {
                                    _propItem["LookupDependency"] = {};

                                    for (var d = 0; d < _propItem.dependency.length; d++) {
                                        var _depPropertyPath = _propItem.dependency[d];

                                        if (!_lookupElement[_depPropertyPath]){
                                            var $search = _controlInstance.DOM.ActiveEditView
                                                                              .find(".PropertyView[" + util_htmlAttribute("data-attr-prop-path", _depPropertyPath) + "]:first " +
                                                                              "select[" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");

                                            _lookupElement[_depPropertyPath] = $search;
                                        }

                                        _propItem.LookupDependency[_depPropertyPath] = {
                                            "Element": _lookupElement[_depPropertyPath]
                                        };
                                    }
                                }

                                $ddl.data("_propertyItem", _propItem);

                                $ddl.off("change.notification_fieldPropertyUpdate");
                                $ddl.on("change.notification_fieldPropertyUpdate", function (e, args) {

                                    var $this = $(this);
                                    var _propItem = $ddl.data("_propertyItem");

                                    args = util_extend({ "Callback": null, "IsInit": false }, args);

                                    var _changeCallback = function () {
                                        if (args.Callback) {
                                            args.Callback();
                                        }
                                    };

                                    var _fn = function () {
                                        var _params = {
                                            "Action": "edit_field_data",
                                            "ExtendedFilters": {
                                                "PropertyPath": _propItem.p,
                                                "Value": util_forceString($this.val())
                                            }
                                        };

                                        var _valid = true;

                                        if (_propItem["LookupDependency"]) {

                                            for (var _key in _propItem.LookupDependency) {
                                                var _entry = _propItem.LookupDependency[_key];
                                                var _depValue = util_forceInt(_entry.Element.val(), enCE.None);

                                                _params.ExtendedFilters[_key] = _depValue;

                                                _valid = (_valid && (_depValue != enCE.None));
                                            }
                                        }

                                        var _fnBindDropdown = function (result) {

                                            var _list = (result ? result.List : null);
                                            var _val = $this.val();

                                            if (args.IsInit) {
                                                _val = util_propertyValue(_dataItem, _propItem.p);

                                                if (!_isAddNew) {

                                                    //edit mode does not allow the dropdown elements to be edited (read only)
                                                    _valid = false;
                                                }
                                                else {

                                                    //check if notifications view is shown as part of a classification platform context, if so will disable predefined values
                                                    _valid = (_valid && util_forceInt(_val, enCE.None) == enCE.None);
                                                }
                                            }

                                            var _fnGetListFieldOption = function () {
                                                var _field = _lookupFieldItem[_propItem.p];

                                                return {
                                                    "Field": _field,
                                                    "DataListPropertyValue": util_propertyValue(_field, "_fieldItem._renderList.PropertyValue")
                                                };
                                            };

                                            if (_propItem.p == enColEditorAnnouncementProperty.ClassificationID) {
                                                var _fieldListOpt = _fnGetListFieldOption();
                                                var _attrs = {
                                                    "data-classification-auto-select-platform": null
                                                };

                                                if (_fieldListOpt.DataListPropertyValue && util_forceInt(_val, enCE.None) != enCE.None) {
                                                    var _classification = util_arrFilter(_list, _fieldListOpt.DataListPropertyValue, util_forceInt(_val, enCE.None), true);

                                                    if (_classification.length == 1) {
                                                        _classification = _classification[0];

                                                        if (_fnIsClassificationSelectPlatform(_classification) == true) {
                                                            _attrs["data-classification-auto-select-platform"] = enCETriState.Yes;
                                                        }
                                                    }
                                                }

                                                $this.attr(_attrs);
                                            }
                                            else if (_propItem.p == enColEditorAnnouncementProperty.ClassificationPlatformID && _list && _list.length == 1) {

                                                var $ddlClassification = _lookupElement[enColEditorAnnouncementProperty.ClassificationID];

                                                //check if the current classification is unmanaged or is standalone (i.e. should auto select the classification platform)
                                                if (util_forceInt($ddlClassification.attr("data-classification-auto-select-platform"), enCETriState.None) == enCETriState.Yes) {
                                                    var _fieldListOpt = _fnGetListFieldOption();

                                                    if (_fieldListOpt.DataListPropertyValue) {

                                                        //force default value
                                                        _val = util_propertyValue(_list[0], _fieldListOpt.DataListPropertyValue);

                                                        _valid = false;
                                                    }
                                                }
                                            }

                                            $this.selectmenu(_valid ? "enable" : "disable");

                                            $this.trigger("events.editorInput_bindDDL", { "Data": _list, "SelectedValue": _val });

                                            var _changeQueue = new CEventQueue();

                                            if (!args.IsInit && _propItem["onChangeRef"]) {
                                                for (var r = 0; r < _propItem.onChangeRef.length; r++) {
                                                    $(function (refPropPath) {

                                                        var $refDDL = _lookupElement[refPropPath];

                                                        if ($refDDL && $refDDL.length == 1) {
                                                            _changeQueue.Add(function (onCallback) {

                                                                $refDDL.trigger("change.notification_fieldPropertyUpdate", { "Callback": onCallback });
                                                            });
                                                        }

                                                    }(_propItem.onChangeRef[r]));
                                                }
                                            }

                                            _changeQueue.Run({ "Callback": _changeCallback });

                                        };  //end: _fnBindDropdown

                                        if (_valid) {
                                            _controlInstance.Events.OnDataItemAction(_params, function (result) {
                                                _fnBindDropdown(result);
                                            }, {
                                                "IsRefreshCallback": false
                                            });
                                        }
                                        else {
                                            _fnBindDropdown(null);
                                        }

                                    };  //end: _fn

                                    if (args.IsInit) {

                                        $this.selectmenu("enable");
                                        _fn();
                                    }
                                    else {
                                        _fn();
                                    }

                                }); //end: change.notification_fieldPropertyUpdate

                                _queue.Add(function (onCallback) {
                                    $ddl.trigger("change.notification_fieldPropertyUpdate", { "Callback": onCallback, "IsInit": true });
                                });

                            }($ddl));
                        });

                        _queue.Run({ "Callback": _onConfigureCallback });

                    }   //end: announcement

                },  //end: OnConfigureEditView

                "OnSaveResult": function (options) {

                    var _handled = false;

                    var _callback = function () {
                        if (options.Callback) {
                            options.Callback({ "IsHandled": _handled });
                        }
                    };

                    options = util_extend({ "ConfirmationResult": null, "Item": null, "ItemID": null, "Callback": null }, options);

                    var _itemID = util_forceInt(options.ItemID, enCE.None);

                    switch (_controlInstance.Options.EntityType) {

                        case "announcement":

                            if (options.ConfirmationResult == "save_review") {
                                _handled = true;

                                var $vw = _controlInstance.Events.GetEditView({ "IsInit": true });
                                var LIST_SIZE_USERS = 30;
                                var _html = "";

                                _html += "<div class='Title'>" +
                                         "  <div class='Label'>" +
                                         "      <span>" + util_htmlEncode("Users (" + util_formatNumber(0) + ")") + "</span>" +
                                         "  </div>" +
                                         "  <div class='Actions'>" +
                                         _controlInstance.Utils.HTML.GetButton({
                                             "Content": "Close", "Attributes": { "data-icon": "delete", "data-view-action": "dismiss" }
                                         }) +
                                         _controlInstance.Utils.HTML.GetButton({
                                             "Content": "Email", "Attributes": { "data-icon": "check", "data-view-action": "email" }
                                         }) +
                                         "  </div>" +
                                         "</div>";

                                _html += "<div class='SearchableView EditorSearchableView PluginEditorCardView'>" +
                                         "  <input data-view-id='search' type='text' maxlength='1000' data-role='none' placeholder='Search users' " +
                                         util_renderAttribute("searchable_field") + " />" +
                                         "  <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' " +
                                         "data-iconpos='notext' title='Clear' />" +
                                         "</div>";

                                _html += "<div class='Instructions'>" +
                                         "  <i class='material-icons'>info</i>" +
                                         "  <div class='Label'>" +
                                         util_htmlEncode("The search feature is for review purposes only and does not impact the final list of " +
                                                         "users that will receive the email.") +
                                         "  </div>" +
                                         "</div>";

                                _html += "<div class='Content' />" +
                                         "<div class='DisableUserSelectable PaginationView' />";

                                $vw.hide()
                                   .html(_html);

                                var $tbSearch = $vw.find("input[data-view-id='search']");

                                //configure the searchable input
                                $tbSearch.data("SearchConfiguration", {
                                    "SearchableParent": $tbSearch.closest(".SearchableView"),
                                    "OnRenderResult": function (result, opts) {

                                        $vw.data({ "currentPage": 1, "cachedResult": result, "highlightEncoder": opts["HighlightEncoder"] })
                                           .trigger("events.onNotificationUserReviewBind", { "IsCached": true, "Search": opts });
                                    },
                                    "OnSearch": function (opts, callback) {
                                        $vw.trigger("events.onNotificationUserReviewBind", {
                                            "IsLoad": true, "Callback": callback, "RequestElement": $tbSearch
                                        });
                                    }
                                });

                                $mobileUtil.refresh($vw);

                                var $vwContentListView = $vw.children(".Content:first");
                                var $lblCount = $vw.find(".Title:first > .Label > span:first");
                                var $vwPagination = $vw.children(".PaginationView:first");

                                $vw.off("events.onNotificationUserReviewDismiss");
                                $vw.on("events.onNotificationUserReviewDismiss", function (e, args) {
                                    $vw.off("events.onNotificationUserReviewDismiss");

                                    args = util_extend({ "Callback": null }, args);

                                    $vw.show().slideUp("normal", function () {
                                        if (args.Callback) {
                                            args.Callback();
                                        }

                                        $vw.remove();
                                    });

                                }); //end: events.onNotificationUserReviewDismiss

                                //bind header action events
                                $vw.off("click.onNotificationUserReviewAction");
                                $vw.on("click.onNotificationUserReviewAction", "[data-view-action]:not(.LinkDisabled)", function () {

                                    var $this = $(this);
                                    var _id = util_forceString($this.attr("data-view-action"));
                                    var _clickCallback = function () {
                                        $this.removeClass("LinkDisabled");
                                    };

                                    $this.addClass("LinkDisabled");

                                    switch (_id) {

                                        case "dismiss":

                                            $vw.trigger("events.onNotificationUserReviewDismiss", { "Callback": _clickCallback });
                                            break;  //end: dismiss

                                        case "email":

                                            $vw.trigger("events.onNotificationUserReviewBind", {
                                                "IsLoad": true, "IsListCount": true,
                                                "Callback": function (data) {

                                                    data = util_extend({ "NumItems": null }, data);

                                                    var _count = util_formatNumber(util_forceInt(data.NumItems, 0));

                                                    var _params = {
                                                        "Action": "email",
                                                        "ItemID": _itemID
                                                    };

                                                    _controlInstance.Events.OnDataItemAction(_params, function (result) {
                                                        if (result) {
                                                            AddMessage("Email has been successfully sent to users.", null, null, { "IsTimeout": true });
                                                            $vw.trigger("events.onNotificationUserReviewDismiss", { "Callback": _clickCallback });
                                                        }
                                                        else {
                                                            _clickCallback();
                                                        }
                                                    }, {
                                                        "IsConfirm": true,                                                        
                                                        "ConfirmTitle": "Email Users",
                                                        "ConfirmMessage": "<div>" + util_htmlEncode("Are you sure you want to send the email?") + "</div>" +
                                                                          "<table border='0' cellpadding='3' cellspacing='0' style='margin-top: 0.5em;'>" +
                                                                          " <tr>" +
                                                                          "     <td valign='top' style='color: #FF0000;'>" +
                                                                          "<i class='material-icons'>info</i>" +
                                                                          "     </td>" +
                                                                          "     <td valign='middle'>" + util_htmlEncode("Applicable Users: " + _count) + "</td>" +
                                                                          " </tr>" +
                                                                          "</table>",
                                                        "IsMessageHTML": true,
                                                        "IsRefreshCallback": false,
                                                        "IsDependencyUpdate": false
                                                    });

                                                }
                                            });                                            

                                            break;  //end: email
                                    }

                                }); //end: click.onNotificationUserReviewAction

                                $vw.off("change.navigatePage");
                                $vw.on("change.navigatePage", ".PaginationView select.DropdownPageView", function () {
                                    var $ddl = $(this);
                                    var _pageNo = util_forceInt($ddl.val(), 1);

                                    $vw.data("currentPage", _pageNo)
                                       .trigger("events.onNotificationUserReviewBind");
                                });

                                $vw.off("click.navigatePage");
                                $vw.on("click.navigatePage", "[data-attr-nav-page-num]:not(.LinkDisabled)", function () {
                                    var $this = $(this);
                                    var _pageNo = util_forceInt($this.attr("data-attr-nav-page-num"), 1);

                                    $this.addClass("LinkDisabled");

                                    $vw.data("currentPage", _pageNo)
                                       .trigger("events.onNotificationUserReviewBind");
                                });

                                $vw.off("events.onNotificationUserReviewBind");
                                $vw.on("events.onNotificationUserReviewBind", function (e, args) {

                                    args = util_extend({
                                        "Callback": null, "IsLoad": false, "IsInit": false, "IsCached": false, "IsListCount": false,
                                        "RequestElement": null
                                    }, args);

                                    var _currentPage = (args.IsLoad ? 1 : util_forceInt($vw.data("currentPage"), 1));

                                    var _params = _controlInstance.State.BaseParams({
                                        "Action": options.ConfirmationResult, "ItemID": _itemID,
                                        "PageSize": LIST_SIZE_USERS,
                                        "PageNum": _currentPage,
                                        "ExtendedFilters": {
                                            "Search": $tbSearch.val()
                                        }
                                    });

                                    if (args.IsListCount) {
                                        _params.PageNum = 1;
                                        _params.PageSize = 1;
                                        _params.ExtendedFilters.Search = null;  //clear the search
                                    }

                                    var _fnRender = function (result) {

                                        result = util_extend({ "List": null, "NumItems": null }, result);

                                        var _html = "";

                                        var _users = (result.List || []);
                                        var _count = util_forceInt(result.NumItems, 0);
                                        var _fnEncoder = $vw.data("highlightEncoder");
                                        var _hasHighlight = (_fnEncoder ? true : false);

                                        //validate the current page no (in the event it has been updated)
                                        if (_users.length == 0 && _count > 0 && _currentPage > 1 && util_forceBool(args["IsResuriveCall"]) == false) {
                                            var _maxPage = util_maxListPage(result, LIST_SIZE_USERS);

                                            if (_currentPage > _maxPage) {

                                                //update with max page and rebind the list
                                                $vw.data("currentPage", _maxPage);

                                                args["IsResuriveCall"] = true;

                                                setTimeout(function () {
                                                    $vw.trigger("events.onNotificationUserReviewBind", args);
                                                }, 100);

                                                return;
                                            }
                                        }

                                        _html += "<div class='LayoutGrid Columns_3'>";

                                        for (var i = 0; i < _users.length; i++) {
                                            var _user = _users[i];
                                            var _displayName = util_forceString(_user[enColCUserBaseDetailProperty.FirstName]) + " " +
                                                               util_forceString(_user[enColCUserBaseDetailProperty.LastName]);
                                            var _username = _user[enColCUserBaseDetailProperty.Username];

                                            _html += "<div class='ListTile' " + util_htmlAttribute("data-item-user-id", _user[enColCUserBaseDetailProperty.UserID]) + ">" +
                                                     "  <div class='Leading'>" + "<i class='material-icons'>account_circle</i>" + "</div>" +
                                                     "  <div class='Content'>" +
                                                     "      <div class='Title'>" +
                                                     (_hasHighlight ? _fnEncoder(_displayName) : util_htmlEncode(_displayName)) +
                                                     util_htmlEncode(" (") +
                                                     _controlInstance.Utils.HTML.ParseTextLinkHTML(_username, { "HighlightEncoder": _fnEncoder }) +
                                                     util_htmlEncode(")") +
                                                     "      </div>" +
                                                     "  </div>" +
                                                     "</div>";
                                        }

                                        if (_count == 0) {
                                            _html += "<div class='CRepeaterNoRecords'>" +
                                                     "<i class='material-icons'>error_outline</i>" +
                                                     "<div class='Label'>" + util_htmlEncode(MSG_CONFIG.ListNoRecords) + "</div>";
                                            "</div>";
                                        }

                                        _html += "</div>";

                                        $vwContentListView.html(_html);
                                        $mobileUtil.refresh($vwContentListView);

                                        _controlInstance.Utils.HTML.Pagination({
                                            "RenderElement": $vwPagination,
                                            "PageSize": LIST_SIZE_USERS, "NumItems": _count, "CurrentPage": _currentPage,
                                            "LayoutType": "buttons", "IsMinimalFormat": true
                                        });

                                        $lblCount.text("Users (" + util_formatNumber(_count) + ")");

                                        if (args.IsInit && _count == 0) {
                                            $tbSearch.closest(".SearchableView").hide();
                                            $vw.find(".Actions:first .LinkClickable[data-view-action='email']").hide();
                                        }

                                    };  //end: _fnRender

                                    var _data = null;

                                    if (args.IsCached) {
                                        _data = $vw.data("cachedResult");
                                        $vw.removeData("cachedResult");
                                    }

                                    if (_data) {
                                        _fnRender(_data);
                                    }
                                    else {

                                        APP.Service.Action({
                                            "c": "PluginEditor", "m": "NotificationEmailSummaryUserList",
                                            "args": _params
                                        }, function (result) {

                                            if (args.IsLoad) {

                                                if (args.Callback) {
                                                    args.Callback(result);
                                                }

                                                return;
                                            }

                                            _fnRender(result);

                                            if (args.Callback) {
                                                args.Callback();
                                            }
                                        });

                                        if (args.RequestElement) {

                                            //associate last service request to request element
                                            $(args.RequestElement).data("LastRequest", GlobalService.LastRequest);
                                        }
                                    }

                                }); //end: events.onNotificationUserReviewBind

                                $vw.trigger("events.onNotificationUserReviewBind", {
                                    "IsInit": true,
                                    "Callback": function () {
                                        $vw.slideDown("normal");
                                    }
                                });
                            }

                            break;  //end: announcement
                    }

                    _callback();

                },  //end: OnSaveResult

                "EditEntity": function (options) {

                    options = util_extend({
                        "RenderElement": null, "TriggerElement": null, "OnDismissCallback": null, "Callback": null, "IsFocus": false,
                        "IsFromItemView": false
                    }, options);

                    var $element = $(options.RenderElement);
                    var $trigger = $(options.TriggerElement);

                    var _itemID = util_forceInt($trigger.hasClass("LinkClickable") ? $mobileUtil.GetClosestAttributeValue($trigger, "data-item-id") : null,
                                                enCE.None);

                    var _isAddNew = (_itemID == enCE.None);

                    if (!_isAddNew) {
                        options.IsFocus = true;

                        _controlInstance.DOM.ListCardContainer.find("[data-notification-action-id='add_new'].LinkDisabled")
                                                              .removeClass("LinkDisabled");
                    }

                    var _callback = function (isInvalid) {

                        var _fn = function () {

                            if (!isInvalid && options.IsFocus) {
                                _controlInstance.Events.AnimateScrollTo({ "Element": $element, "Offset": -2 }, function () {
                                    if (options.Callback) {
                                        options.Callback(_isAddNew);
                                    }
                                });
                            }
                            else {
                                if (options.Callback) {
                                    options.Callback(isInvalid ? false : _isAddNew);
                                }
                            }

                        };  //end: _fn

                        if (isInvalid) {
                            _fn();
                        }
                        else if ($element.is(":visible")) {
                            _fn();
                        }
                        else {
                            $element.slideDown("normal", _fn);
                        }

                    };  //end: _callback

                    var _onDismissCallback = options.OnDismissCallback;

                    //validate the edit IDs and mode
                    if (options.IsFromItemView && _isAddNew) {
                        _callback(true);
                        return;
                    }

                    var _renderOptions = util_extend({
                        "Title": null, "EditTitle": null, "Fields": null, "EntityTypeInstance": null, "PropertyPathIdentifier": null
                    }, _controlInstance.Data.CurrentRenderOptions.EditEntityRenderOptions);

                    var _html = "";
                    var _propertyIdentifier = _renderOptions.PropertyPathIdentifier;

                    _html += "<div class='Title'>" +
                             "  <div class='Label'>" + "<span>" + util_htmlEncode(_renderOptions[_isAddNew ? "Title" : "EditTitle"]) + "</span>" + "</div>" +
                             "  <div class='Actions'>" +
                             _controlInstance.Utils.HTML.GetButton({
                                 "Content": "Cancel", "Attributes": { "data-icon": "delete", "data-view-action": "dismiss" }
                             }) +
                             _controlInstance.Utils.HTML.GetButton({
                                 "Content": "Save", "Attributes": { "data-icon": "check", "data-view-action": "save" }
                             }) +
                             "  </div>" +
                             "</div>";

                    _html += "<div class='Content'>" +
                             _controlInstance.Utils.HTML.RenderOptionTableHTML({ "Controller": _controlInstance, "List": _renderOptions.Fields, "IsRenderAllModes": false }) +
                             "</div>";
                    
                    $element.html(_html);
                    $mobileUtil.refresh($element);

                    $element.data("RenderOptions", _renderOptions);

                    var $inputs = $element.find(".PropertyView [" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");

                    $element.off("events.onEditNotification_dismiss");
                    $element.on("events.onEditNotification_dismiss", function (e, args) {

                        args = util_extend({ "Callback": null }, args);

                        $element.show().slideUp("normal", function () {
                            $element.removeData("DataItem");

                            if (_onDismissCallback) {
                                _onDismissCallback();
                            }

                            if (args.Callback) {
                                args.Callback();
                            }
                        });

                    }); //end: events.onEditNotification_dismiss

                    //bind header action events
                    $element.off("click.onEditNotificationAction");
                    $element.on("click.onEditNotificationAction", "[data-view-action]:not(.LinkDisabled)", function () {

                        var $this = $(this);
                        var _id = util_forceString($this.attr("data-view-action"));
                        var _clickCallback = function () {
                            $this.removeClass("LinkDisabled");
                        };

                        $this.addClass("LinkDisabled");

                        switch (_id) {

                            case "dismiss":

                                dialog_confirmYesNo("Discard", "Are you sure you want to revert all changes?", function () {
                                    $element.trigger("events.onEditNotification_dismiss", { "Callback": _clickCallback });
                                }, _clickCallback);

                                break;  //end: dismiss

                            case "save":

                                var _dataItem = $element.data("DataItem");
                                var _validation = { "Errors": [] };

                                ClearMessages();

                                $.each($inputs, function (index) {
                                    var $input = $(this);

                                    //populate input to the data item (disregard label data types)
                                    var _editorDataTypeID = util_forceInt($input.attr("data-attr-input-data-type"), enCE.None);

                                    if (_editorDataTypeID != enCEEditorDataType.Label) {
                                        var _handled = false;

                                        var _value = _controlInstance.Utils.Actions.InputEditorDataType({
                                            "Controller": _controlInstance, "Element": $input,
                                            "IsPrimitiveType": true
                                        });

                                        if (_editorDataTypeID == enCEEditorDataType.Dropdown && _value == enCE.None) {
                                            var _required = (util_forceInt($input.attr("data-attr-input-is-required"), enCETriState.None) == enCETriState.Yes);

                                            if (!_required) {

                                                //force it to be null value since the default None option is selected
                                                _value = null;
                                            }
                                            else {
                                                $input.data("is-valid", false); //set invalid flag
                                            }
                                        }

                                        if (!_handled) {
                                            var _propertyPath = $mobileUtil.GetClosestAttributeValue($input, "data-attr-prop-path");

                                            util_propertySetValue(_dataItem, _propertyPath, _value);
                                        }

                                        var _isRequired = (util_forceInt($input.attr("data-attr-input-is-required"), enCETriState.None) == enCETriState.Yes);

                                        if (_isRequired && !$input.data("is-valid")) {

                                            var _fieldTitle = $input.attr("data-field-title");

                                            if (util_forceString(_fieldTitle, "") == "") {
                                                _fieldTitle = "Field";
                                            }

                                            _validation.Errors.push(_fieldTitle + " is required.");
                                        }
                                    }

                                });

                                if (_validation.Errors.length == 0) {

                                    //save the new item
                                    var _opts = null;

                                    var _fn = function (extFilters) {

                                        var _params = _controlInstance.State.BaseParams({
                                            "Action": "add_new",
                                            "Item": util_stringify(_dataItem)
                                        });

                                        if (extFilters) {
                                            for (var _name in extFilters) {
                                                _params.ExtendedFilters[_name] = extFilters[_name];
                                            }
                                        }

                                        var _itemID = util_forceInt($element.data("EditID"), enCE.None);

                                        _controlInstance.Events.OnDataItemAction(_params, function (result) {
                                            if (result) {
                                                AddMessage("Changes have been successfully saved.", null, null, { "IsTimeout": true });

                                                if (_itemID == enCE.None) {

                                                    //get the updated item ID and set it to the element data value
                                                    _itemID = util_forceInt(util_propertyValue(result, _propertyIdentifier), _itemID);
                                                    $element.data("EditID", _itemID);
                                                }

                                                $element.trigger("events.onEditNotification_dismiss", {
                                                    "Callback": function () {

                                                        _controlInstance.Events.OnSaveResult({
                                                            "ConfirmationResult": (extFilters ? extFilters["ConfirmationResult"] : null),
                                                            "Item": result,
                                                            "ItemID": _itemID,
                                                            "Callback": function (saveOpts) {

                                                                saveOpts = util_extend({ "IsHandled": false }, saveOpts);

                                                                if (saveOpts.IsHandled == false && _itemID != enCE.None) {

                                                                    //check the list view and attempt to focus to the current item (if it exists)
                                                                    var $search = _controlInstance.DOM.ListView
                                                                                                      .find(".NotificationItem[" +
                                                                                                            util_htmlAttribute("data-item-id", _itemID) +
                                                                                                            "]:first");

                                                                    if ($search.length == 1) {

                                                                        setTimeout(function () {
                                                                            _controlInstance.Events.AnimateScrollTo({
                                                                                "Element": $search, "Offset": -2, "IsDisableScrollValidation": true
                                                                            });
                                                                        }, 750);
                                                                    }
                                                                }

                                                            }
                                                        }); //end: save result call

                                                    }
                                                });                                                
                                            }
                                            else {
                                                _clickCallback();
                                            }

                                        }, _opts);

                                    };  //end: _fn

                                    var _btnList = $.merge([], (_renderOptions.Confirmation.Buttons || []));

                                    if (!_renderOptions.Confirmation.IsEnabled) {
                                        _fn();
                                    }
                                    else if (_btnList.length == 0) {
                                        _opts = {
                                            "IsConfirm": true,
                                            "ConfirmTitle": _renderOptions.Confirmation.Title,
                                            "ConfirmMessage": _renderOptions.Confirmation.Message
                                        };

                                        _fn();
                                    }
                                    else {

                                        _btnList.push({ "ID": "cancel", "Text": "Cancel" });

                                        util_confirm(_renderOptions.Confirmation.Message, _renderOptions.Confirmation.Title,
                                                     util_forceBool(_renderOptions.Confirmation.IsHTML, false),
                                                     _btnList, function (btnID) {

                                                         if (btnID == "cancel") {
                                                             _clickCallback();
                                                         }
                                                         else {
                                                             _fn({ "ConfirmationResult": btnID });
                                                         }
                                                     }, null, null, { "CssClass": (_btnList.length >= 3 ? "SizeMedium" : "SizeSmall") });
                                    }
                                }
                                else {
                                    for (var i = 0; i < _validation.Errors.length; i++) {
                                        AddUserError(_validation.Errors[i]);
                                    }

                                    _clickCallback();
                                }

                                break;  //end: save

                            default:
                                _clickCallback();
                                break;
                        }

                    }); //end: click.onEditNotificationAction

                    var _params = _controlInstance.State.BaseParams(null);                    

                    _params["Action"] = "load";
                    _params["ItemID"] = _itemID;

                    APP.Service.Action({
                        "c": "PluginEditor", "m": "NotificationDataItemAction",
                        "args": _params
                    }, function (result) {

                        var _editItem = result;

                        if (!_editItem && _renderOptions.EntityTypeInstance) {
                            _editItem = new _renderOptions.EntityTypeInstance();
                        }

                        _editItem = (_editItem || {});

                        $.each($inputs, function (index) {
                            var $this = $(this);
                            var _field = _renderOptions.Fields[index];

                            _controlInstance.Utils.Actions.InputEditorDataType({
                                "Controller": _controlInstance,
                                "IsGetValue": false,
                                "Element": $this,
                                "FieldItem": _field["_fieldItem"],
                                "DataItem": _editItem
                            });
                        });

                        $element.data({
                            "DataItem": _editItem,
                            "EditID": _itemID
                        });

                        _controlInstance.State.OnApplyDataFunction("NotificationOnEdit", {
                            "EditItem": _editItem,
                            "Callback": function () {

                                var _fn = _controlInstance.Events.OnConfigureEditView[_controlInstance.Options.EntityType];

                                if (!_fn) {
                                    _fn = function (opts) {
                                        if (opts.Callback) {
                                            opts.Callback();
                                        }
                                    };
                                }

                                _fn({ "Callback": _callback, "Item": _editItem, "IsAddNew": _isAddNew });
                            }
                        });

                    });
                    
                },  //end: EditEntity

                "OnActionClick": function (e, args) {

                    var $this = $(this);

                    args = util_extend({ "ActionID": null, "Callback": null }, args);

                    var _clickCallback = function (disableClassState) {

                        if (!disableClassState) {
                            $this.removeClass("LinkDisabled");
                        }

                        if (args.Callback) {
                            args.Callback();
                        }

                    };  //end: _clickCallback

                    if (util_forceString(args.ActionID) == "") {
                        args.ActionID = util_forceString($this.attr("data-notification-action-id"), "");
                    }

                    $this.addClass("LinkDisabled");

                    switch (args.ActionID) {

                        case "settings":

                            var $vw = _controlInstance.DOM.ListCardContainer.children(".ViewSettings:first");
                            var _visible = ($vw.is(":visible") == false);

                            var _fn = function () {

                                $this.toggleClass("StateOn", _visible);

                                _clickCallback();
                            };

                            if (_visible) {
                                $vw.slideDown("normal", _fn);
                            }
                            else {
                                $vw.slideUp("normal", _fn);
                            }

                            break;  //end: settings

                        case "sort_toggle":

                            var _isSortASC = (util_forceInt($this.attr("data-attr-is-sort-asc"), enCETriState.No) == enCETriState.Yes);
                            var $parent = $this.closest(".ViewSettings");
                            var $btns = $parent.find("[data-notification-action-id='sort_toggle']");

                            $btns.not($this).removeClass("LinkDisabled StateOn");
                            $this.addClass("LinkDisabled StateOn");

                            //set the updated sort order and refresh the list
                            _controlInstance.DOM.ListView.data("SortAscending", _isSortASC);

                            _controlInstance.Events.Refresh({
                                "Callback": function () {
                                    _clickCallback(true);
                                }
                            });

                            break;  //end: sort_toggle

                        case "list_item_dismiss":
                        case "list_item_restore":
                        case "list_item_delete":
                        case "list_item_view":

                            var $parent = $this.closest("[data-item-id]");
                            var _itemID = util_forceInt($parent.attr("data-item-id"), enCE.None);
                            var _itemIndex = util_forceInt($parent.attr("data-item-index"), -1);
                            var _isConfirm = true;
                            var _handled = false;
                            var _confirmTitle = null;
                            var _confirmMessage = null;

                            var _params = _controlInstance.State.BaseParams({
                                "ItemID": _itemID,
                                "Action": args.ActionID,
                                "Item": _controlInstance.State.GetListItem(_itemID, _itemIndex)
                            });

                            if (_controlInstance.Data.CurrentRenderOptions["ListItemRenderAttributePropertyPaths"]) {

                                //populate the list item attribute values to the filters
                                for (var a = 0; a < _controlInstance.Data.CurrentRenderOptions.ListItemRenderAttributePropertyPaths.length; a++) {
                                    var _propPath = _controlInstance.Data.CurrentRenderOptions.ListItemRenderAttributePropertyPaths[a];
                                    var _attrName = _controlInstance.State.ListItemAttributeNamePropertyPath(_propPath);

                                    var _key = "ListItem" + _propPath;
                                    var _val = $parent.attr(_attrName);

                                    if (_val === undefined) {
                                        _val = null;
                                    }

                                    _params.ExtendedFilters[_key] = _val;
                                }
                            }

                            if (args.ActionID == "list_item_dismiss") {
                                _confirmTitle = _controlInstance.Data.CurrentRenderOptions["ConfirmDismissTitle"];
                                _confirmMessage = _controlInstance.Data.CurrentRenderOptions["ConfirmDismissMessage"];
                            }
                            else if (args.ActionID == "list_item_restore") {
                                _confirmTitle = _controlInstance.Data.CurrentRenderOptions["ConfirmDismissUndoTitle"];
                                _confirmMessage = _controlInstance.Data.CurrentRenderOptions["ConfirmDismissUndoMessage"];
                            }
                            else if (args.ActionID == "list_item_delete") {
                                _confirmTitle = _controlInstance.Data.CurrentRenderOptions["ConfirmDeleteTitle"];
                                _confirmMessage = _controlInstance.Data.CurrentRenderOptions["ConfirmDeleteMessage"];
                            }
                            else if (args.ActionID == "list_item_view") {
                                _isConfirm = false;

                                _handled = true;

                                _params["Trigger"] = $this;
                                _params["Callback"] = function () {
                                    $parent.removeClass("Disabled");
                                    _clickCallback();
                                };
                                
                                $parent.addClass("Disabled");

                                _controlInstance.State.OnApplyDataFunction("NotificationOnViewAction", _params);
                            }
                            else {
                                _isConfirm = false;
                            }

                            if (!_handled) {
                                _params.Item = util_stringify(_params.Item);

                                $parent.addClass("Disabled");

                                _controlInstance.Events.OnDataItemAction(_params, function (result) {

                                    $parent.removeClass("Disabled");
                                    _clickCallback();
                                }, {
                                    "IsConfirm": _isConfirm,
                                    "ConfirmTitle": _confirmTitle,
                                    "ConfirmMessage": _confirmMessage
                                });
                            }

                            break;  //end: general list item actions

                        case "add_new":
                        case "list_item_edit":

                            var $vw = _controlInstance.Events.GetEditView();

                            _controlInstance.Events.EditEntity({
                                "RenderElement": $vw,
                                "TriggerElement": $this,
                                "IsFromItemView": (args.ActionID == "list_item_edit"),
                                "OnDismissCallback": function () {
                                    $this.removeClass("LinkDisabled");
                                    _controlInstance.DOM.ActiveEditView = null;
                                },
                                "Callback": function (disableButtonState) {

                                    //ensure the disabled button state is preserved (will be removed by the edit entity function)
                                    disableButtonState = util_forceBool(disableButtonState, true);

                                    _clickCallback(disableButtonState);
                                }
                            });

                            break;  //end: add_new

                        case "exit":

                            $("body").removeClass("ViewOverflowHidden");

                            $element.animate({ "width": "0%" }, "normal", function () {
                                _clickCallback();
                            });

                            break;  //end: exit

                        default:
                            _clickCallback();
                            break;
                    }

                }   //end: OnActionClick
            };

            $element.data("Controller-EditorNotifications", _controlInstance);

            _controlInstance.Events.Init();
        }
    });

};  //end: pluginEditor_fileDisclaimer