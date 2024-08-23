var PLUGIN_DOSSIER_RENDERER_ATTRIBUTES = {
    "ATTRIBUTE_ACTION_BUTTON": "data-attr-plugin-dossier-btn-action-type",
    "CONTEXT_INSTANCE_DATA_VARIABLE_NAME": "data-attr-plugin-dossier-ctx-instance-data-variable",
    "TEMPLATE_CONTAINER_VIEW_ID": "data-attr-plugin-dossier-template-container-view-id",
    "EXT_TOKEN_TYPE_ID": "data-attr-plugin-dossier-ext-token-type-id",
    "EXT_PLACEHOLDER_TOKEN_ADMIN_GET_OPTIONS_FN_CALLBACK": "data-attr-plugin-dossier-ext-placeholder-token-admin-get-options",
    "EXT_TOKEN_FILE_UPLOAD_NAME": "data-attr-plugin-dossier-ext-token-file-upload-name",
    "EXT_TOKEN_FILE_UPLOAD_ORIGINAL_NAME": "data-attr-plugin-dossier-ext-token-file-upload-original-name",
    "EXT_TOKEN_TYPE_METADATA": {},
    "ATTRIBUTE_CHART_ID": "data-attr-plugin-dossier-chart-id",
    "ATTRIBUTE_CHART_GET_INSTANCE_FN": "data-attr-plugin-dossier-chart-get-instance-fn",
    "ATTRIBUTE_HAS_EDIT_TOOLS": "data-attr-plugin-dossier-chart-has-edit-tools",
    "ATTRIBUTE_CHART_WIDTH_PCT": "data-attr-plugin-dossier-chart-width-pct",
    "ATTRIBUTE_CHART_HEIGHT_PCT": "data-attr-plugin-dossier-chart-height-pct",
    "ATTRIBUTE_CHART_IS_EXPORT": "data-attr-plugin-dossier-chart-is-export"
};

PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_TYPE_METADATA[enCEExternalTokenType.Text] = [{ "Name": "text", "DisplayText": "Text", "CssClass": "CDossierTextPortion"}];

PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_TYPE_METADATA[enCEExternalTokenType.Reference] = [
    { "Name": "short_name", "DisplayText": "Short Name", CssClass: "CDossierReferenceLinkPortionShortName", "IsHidden": true },
    { "Name": "author", "DisplayText": "Author", CssClass: "CDossierReferenceLinkPortionAuthor" },
    { "Name": "source", "DisplayText": "Source", CssClass: "CDossierReferenceLinkPortionSource" },
    { "Name": "details", "DisplayText": "Details", CssClass: "CDossierReferenceLinkPortionDetails" },
    { "Name": "file_upload", "DisplayText": "Upload File", CssClass: "CDossierReferenceLinkPortionFile" },
    { "Name": "file_link", "DisplayText": "Link File" }
];

PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_TYPE_METADATA[enCEExternalTokenType.DataPoint] = [
    { "Name": "point_value", "DisplayText": "Point Value", CssClass: "InlineBlock CDossierDataPointPortionValue", "Options": {"IsTextArea": true} },
    { "Name": "ddl_reference", "DisplayText": "Reference", "Options": { "IsDropdownList": true, "FilterTokenTypeID": enCEExternalTokenType.Reference, "IsIncludeAddButton": true} }
];

PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_TYPE_METADATA[enCEExternalTokenType.Chart] = [
    { "Name": "config_value", "DisplayText": "Configuration", CssClass: "InlineBlock CDossierChartPortionValue", "Options": { "IsTextArea": true} }
];

    var CPluginDossier = function () {
        var _instance = this;

        var m_attributes = {
            "ATTRIBUTE_IS_CONTAINER_SCROLLABLE": "data-cattr-dossier-is-container-scrollable",
            "ATTRIBUTE_TEMPLATE_CONTAINER": "data-cattr-dossier-template-view",
            "ATTRIBUTE_SECTION_ID": "data-attr-section-id",
            "ATTRIBUTE_SUBSECTION_ID": "data-attr-subsection-id",
            "ATTRIBUTE_IS_CUSTOM": "data-attr-is-custom",
            "ATTRIBUTE_VALUE_MESSAGE_FILTER_GET_OPTION_FN": "data-attr-private-value-message-filter-get-option-fn", //(optional) JS function to get render options
            "ATTRIBUTE_ACTION_BUTTON": PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_ACTION_BUTTON,
            "ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST": "data-cattr-subsection-link-breadcrumbs",
            "ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_IS_REPLACE_CURRENT": "data-cattr-subsection-link-breadcrumb-replace-current",
            "ATTRIBUTE_NAVIGATION_LINK_SECTION_ID": "data-attr-presentation-navigation-section-id",
            "ATTRIBUTE_NAVIGATION_LINK_SUBSECTION_ID": "data-attr-presentation-navigation-subsection-id",
            "ATTRIBUTE_NAVIGATION_LINK_SUBSECTION_ACTION_TYPE": "data-attr-presentation-navigation-subsection-action-type",
            "ATTRIBUTE_NAVIGATION_LINK_SUBSECTION_PARAM": "data-attr-presentation-navigation-subsection-param"
        };

        this["ID"] = null;

        this["Attributes"] = m_attributes;

        this["DOM"] = {
            "GetPluginContainerCtx": function (options) {
                var _ret = null;
                options = util_extend({ "ChildElement": null });

                var _ctx = $(options["ChildElement"]);

                if (_ctx.length > 0) {
                    _ret = _ctx.closest(".CDossierPluginContainer");
                }

                if (_ret == null || _ret.length == 0) {
                    _ret = $mobileUtil.Find(".CDossierPluginContainer");
                }

                return _ret;
            },
            "IsPluginContainerScrollable": function (options) {
                options = util_extend({ "Container": null, "ChildElement": null }, options);
                var _pluginContainer = $(options["Container"]);

                if (_pluginContainer.length == 0) {
                    _pluginContainer = _instance.GetPluginContainerCtx({ "ChildElement": options["ChildElement"] });
                }

                return (util_forceInt(_pluginContainer.attr(_instance.Attributes.ATTRIBUTE_IS_CONTAINER_SCROLLABLE), enCETriState.None) == enCETriState.Yes);
            }
        };

        var m_managers = {};

        m_managers["StateManager"] = {

            FindStateElements: function (container) {
                var _ret = null;
                var _selector = "";
                var _container = $(container);

                _selector += "[" + util_renderAttribute("editor_collapsible_group") + "]";  //collapsible groups

                _ret = _container.find(_selector);

                return _ret;
            },

            GetRenderElementAttributeState: function (element, container, key, overrideBreadcrumb) {
                var _breadcrumbStr = "";
                var _breadcrumbSuffix = "nav_";

                var _container = $(container);
                var _renderAttr = util_forceString($(element).attr(DATA_ATTRIBUTE_RENDER));

                key = util_forceString(key);

                if (!util_isNullOrUndefined(overrideBreadcrumb)) {
                    _breadcrumbStr = util_forceString(overrideBreadcrumb);
                }
                else {
                    var _breadcrumbElement = _container.find("[" + _instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST + "]");

                    overrideBreadcrumb = util_forceString(_breadcrumbElement.attr(_instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST));
                }

                _breadcrumbSuffix = "nav_" + util_replaceAll(overrideBreadcrumb, "|", "_", true) + "-";

                return "data-cattr-restore-" + _breadcrumbSuffix + _renderAttr + "-" + key;
            },

            GetRenderElementIndex: function (element, lookup) {
                var _ret = null;
                var _element = $(element);
                var _renderAttr = util_forceString(_element.attr(DATA_ATTRIBUTE_RENDER));

                if (_renderAttr != "") {
                    var _index = 0;

                    if (util_isNullOrUndefined(lookup[_renderAttr])) {
                        lookup[_renderAttr] = 0;
                    }

                    _index = (lookup[_renderAttr])++;

                    _ret = _index;
                }

                return _ret;
            },

            AddState: function (obj, key, container) {
                var _container = $(container);
                var _element = $(obj);

                key = util_forceString(key);

                if (_element.length > 0 && _container.length > 0) {

                    var _renderAttr = _element.attr(DATA_ATTRIBUTE_RENDER);
                    var _state = null;

                    var _fnSetStateProp = function (attr) {
                        var _val = _element.attr(attr);

                        if (!util_isNullOrUndefined(_val)) {

                            if (_state == null) {
                                _state = {};    //init as needed
                            }

                            _state[attr] = _val;
                        }
                    };

                    switch (_renderAttr) {
                        case "editor_collapsible_group":
                            _fnSetStateProp(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_SELECTED);
                            _fnSetStateProp(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_TOGGLE_ALL_TYPE);
                            break;

                        default:
                            _state = null;
                            break;
                    }

                    var _dataAttrName = _instance.Managers.StateManager.GetRenderElementAttributeState(_element, _container, key);

                    if (_state != null) {
                        _container.attr(_dataAttrName, util_stringify(_state));
                    }
                    else {
                        _container.removeAttr(_dataAttrName);
                    }
                }
            },

            SaveState: function (triggerElement) {
                var _element = $(triggerElement);
                var _container = $mobileUtil.FindClosest(_element, "[" + _instance.Attributes.ATTRIBUTE_SUBSECTION_ID + "]");

                var _lookupIndex = {};

                var _list = _instance.Managers.StateManager.FindStateElements(_container);

                $.each(_list, function (index) {
                    var _renderElement = $(this);
                    var _index = _instance.Managers.StateManager.GetRenderElementIndex(_renderElement, _lookupIndex);

                    if (_index != null) {
                        _instance.Managers.StateManager.AddState(_renderElement, _index, _container);
                    }
                });
            },

            LoadState: function (container) {
                var _container = $(container);

                var _list = _instance.Managers.StateManager.FindStateElements(_container);
                var _lookupIndex = {};

                var _breadcrumbElement = _container.find("[" + _instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST + "]");
                var _breadcrumb = util_forceString(_breadcrumbElement.attr(_instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST));

                $.each(_list, function (indx) {
                    var _renderElement = $(this);
                    var _index = _instance.Managers.StateManager.GetRenderElementIndex(_renderElement, _lookupIndex);

                    var _attr = _instance.Managers.StateManager.GetRenderElementAttributeState(_renderElement, _container, _index, _breadcrumb);

                    var _stateVal = _container.attr(_attr);

                    if (!util_isNullOrUndefined(_stateVal)) {
                        var _optState = null;

                        try {
                            _optState = util_parse(_stateVal);
                        } catch (e) {
                            _optState = null;
                        }

                        if (_optState != null) {
                            for (var _prop in _optState) {
                                _renderElement.attr(_prop, util_forceString(_optState[_prop]));
                            }

                            $mobileUtil.RenderRefresh(_renderElement, true);
                        }
                    }
                });
            }

        };  //end: StateManager

        m_managers["CacheManager"] = {
            "Cache": {},
            "GlobalCache": {},

            "getCacheByType": function (isGlobal) {
                isGlobal = util_forceBool(isGlobal, false);

                var _prop = (isGlobal ? "GlobalCache" : "Cache");

                if (util_isNullOrUndefined(_instance.Managers.CacheManager[_prop])) {
                    _instance.Managers.CacheManager[_prop] = {};
                }

                return _instance.Managers.CacheManager[_prop];
            },

            "SetCacheItem": function (key, val, isGlobal) {
                isGlobal = util_forceBool(isGlobal, false);

                var _cache = _instance.Managers.CacheManager.getCacheByType(isGlobal);

                _cache[key] = val;
            },

            "GetCacheItem": function (key, isGlobal) {
                isGlobal = util_forceBool(isGlobal, false);

                var _ret = null;
                var _cache = _instance.Managers.CacheManager.getCacheByType(isGlobal);

                _ret = _cache[key];

                return _ret;
            },

            "ClearCache": function () {
                _instance.Managers.CacheManager["Cache"] = {};
            },

            "NewInstanceTimestampData": function (numSeconds) {
                var _timestampData = {};

                numSeconds = util_forceInt(numSeconds, 10);

                numSeconds = Math.max(numSeconds, 0);

                _timestampData["Timestamp"] = 0;
                _timestampData["Data"] = null;

                _timestampData["IsValid"] = function () {
                    var _now = (new Date()).getTime();
                    var _timestamp = util_forceInt(this.Timestamp);
                    var _diff = (_now - _timestamp) / 1000.00;

                    return (_diff <= numSeconds);
                };

                _timestampData["SetData"] = function (val) {
                    this.Data = val;
                    this.Timestamp = (new Date()).getTime();
                };

                return _timestampData;
            }
        };  //end: CacheManager

        m_managers["ChartManager"] = new CPluginDossierChartManager();

        this["Managers"] = m_managers;

        this["Metadata"] = {

            "Instance": {},
            "SetDataVariable": function (key, val, isDelete) {
                isDelete = util_forceBool(isDelete);

                if (isDelete) {
                    delete this.Instance[key];
                }
                else {
                    this.Instance[key] = val;
                }
            },
            "GetDataVariable": function (key) {
                return this.Instance[key];
            },
            "GetTemplateAttribute": function (options) {
                options = util_extend({ "TemplateType": "" }, options);

                return util_htmlAttribute(m_attributes.ATTRIBUTE_TEMPLATE_CONTAINER, options["TemplateType"]);
            },
            "GetInstanceEventReference": function (strFuncSuffix) {
                return _instance.ID + ".Events." + strFuncSuffix;
            },
            "GetContextSubsectionID": function (obj, options) {

                var _element = $(obj);
                var _subsectionContainer = $mobileUtil.FindClosest(_element, "[" + _instance.Attributes.ATTRIBUTE_SUBSECTION_ID + "]");

                //check if there is a custom subsection link for the content container
                var _subsectionContentLinkContainer = _subsectionContainer.find(".CDossierSubsectionContent" +
                                                                                "[" + DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_CURRENT_SUBSECTION_LINK_ID + "]");
                if (_subsectionContentLinkContainer.length > 0) {
                    _subsectionID = util_forceInt(_subsectionContentLinkContainer.attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_CURRENT_SUBSECTION_LINK_ID), enCE.None);
                }
                else {
                    _subsectionID = util_forceInt(_subsectionContainer.attr(_instance.Attributes.ATTRIBUTE_SUBSECTION_ID), enCE.None);
                }

                return _subsectionID;
            },
            "IsUserContentAdmin": function () {
                return global_userIsAdminRoleBase();
            },
            "IsUserSystemAdmin": function () {
                return global_userIsSystemAdmin();
            },
            "ValidFileUploadExts": function () {
                return ["jpg", "jpeg", "png", "gif", "doc", "docx", "xlsx", "xls", "ppt", "pptx", "pdf", "txt"];
            }

        }; //end: Metadata


        //templates
        var _templates = {};

        _templates["SubsectionNavigation"] = "<div class='CDossierPresentationNavigation' " + this.Metadata.GetTemplateAttribute({ "TemplateType": "navigation" }) + " />";
        _templates["SubsectionContent"] = "<div class='CDossierPresentationSubsectionContent' " + this.Metadata.GetTemplateAttribute({ "TemplateType": "content" }) + " />";
        _templates["PlaceholderTokenLoadIndicator"] = "<div class='InlineBlock IndicatorSmall CDossierPlaceholderTokenLoadingMessage' />";

        _templates["GetActionButtonHTML"] = function (typeID, label, styleAttrs, extAttrs, disableButtonStyle) {
            disableButtonStyle = util_forceBool(disableButtonStyle, false);

            if (!disableButtonStyle && util_isNullOrUndefined(styleAttrs)) {
                styleAttrs = "data-theme='action-button-a' data-mini='true' data-inline='true' data-corners='false'";
            }

            styleAttrs = util_forceString(styleAttrs);
            extAttrs = util_forceString(extAttrs);

            var _ret = "<a " + (!disableButtonStyle ? "data-role='button' " : "") +
                util_htmlAttribute(_instance.Attributes.ATTRIBUTE_ACTION_BUTTON, typeID) +
                (styleAttrs != "" ? " " + styleAttrs : "") +
                (extAttrs != "" ? " " + extAttrs : "") +
                ">" +
                util_htmlEncode(label) +
                "</a>";

            return _ret;
        };  //end: GetActionButtonHTML

        this["Templates"] = _templates;

        var _utils = {};

        _utils["ResizeContent"] = function (options) {

            options = util_extend({ "ChildElement": null }, options);

            //set container height if scrollable content. It requires the plugin container's height to be set before resizing scrollable area
            var _pluginContainer = _instance.DOM.GetPluginContainerCtx({ "ChildElement": options["ChildElement"] });
            var _isContainerScrollable = _instance.DOM.IsPluginContainerScrollable({ "Container": _pluginContainer });

            if (_isContainerScrollable) {
                //calculate and set subsection content height and overflow property
                var _subsectionContent = _pluginContainer.find(".CDossierSubsectionContent");
                var _contentHeight = _pluginContainer.height() - _pluginContainer.find(".CDossierSubsectionTitleContainer").height() - _pluginContainer.find(".CDossierSubsectionAdminContainer").height() - util_forceInt(util_replaceAll(_pluginContainer.find(".CDossierPresentationSubsectionContent").css("padding-top"), "px", ""), 0) - util_forceInt(util_replaceAll(_pluginContainer.find(".CDossierPresentationSubsectionContent").css("padding-bottom"), "px", ""), 0) - _pluginContainer.find(".CDossierSubsectionLinkBreadcrumbContainer").height();
                _subsectionContent.height(_contentHeight).css("overflow-y", "scroll");
            }
        };

        _utils["ConstructExtTokenFileURL"] = function (options) {
            var _ret = "";

            options = util_extend({ "DataItem": null, "FileName": null, "DisplayName": null, "LinkURL": null, "IsPreview": false }, options);

            var _extToken = (options["DataItem"] || {});
            var _tokenID = util_forceInt(_extToken[enColExternalTokenProperty.TokenID], enCE.None);
            var _fileName = util_forceString(options["FileName"]);
            var _displayName = util_forceString(options["DisplayName"]);
            var _isPreview = util_forceBool(options["IsPreview"], false);

            if (_fileName == "") {
                _ret = util_forceString(options["LinkURL"]);
            }
            else {

                _ret = global_extSubsectionReplaceTokensHTML("%%EDITOR_EXT_TOKEN_FILE_BASE%%") + _tokenID + "/";

                _ret += encodeURI(util_forceString(_fileName));

                if (_displayName != "") {
                    _ret = util_appendQS(_ret, "DN", encodeURI(_displayName));
                }

                if (_isPreview) {
                    _ret = util_appendQS(_ret, "IsPreview", enCETriState.Yes);
                }
            }

            return _ret;

        };  //end: ConstructExtTokenFileURL

        _utils["ParseTextLinkHTML"] = function (str, options) {
            str = util_forceString(str);
            options = util_extend({ "linkClass": "CDossierPlaceholderTokenLink", "linkAttributes": { "data-role": "none", "rel": "external" }, "nl2br": true }, options);

            try {
                str = linkifyStr(str, options);
            } catch (e) {
                util_log(e);
            }

            return str;
        };  //end: ParseTextLinkHTML

        _utils["ConvertExternalToken"] = function (extTokenItem, options) {
            var _ret = null;
            var _tokenTypeID = util_forceInt(extTokenItem[enColExternalTokenProperty.TokenTypeID], enCE.None);

            options = util_extend({
                "Format": "TEXT", "ElementList": null, "IsPreview": false, "SearchTokenData": null, "ViewModeSimple": false, "HasEditTools": false,
                "ExtContainerAttributes": {}
            }, options);

            var _elementList = (options["ElementList"] ? options.ElementList : null);
            var _format = options["Format"];
            var _isPreview = util_forceBool(options["IsPreview"], false);

            switch (_tokenTypeID) {

                default:

                    if (_format == "JSON") {

                        _ret = { "d": {}, "version": null };

                        $.each(_elementList, function (indx) {
                            var _element = $(this);
                            var _id = util_forceString(_element.attr("data-attr-dossier-token-placeholder-portion-id"));

                            if (_id != "") {
                                var _portionValue = null;

                                switch (_id) {

                                    case "file_upload":
                                        var _uploadFileName = _element.attr(CONTROL_FILE_UPLOAD_UPLOADED_FILE_NAME);
                                        var _originalFileName = _element.attr(CONTROL_FILE_UPLOAD_UPLOADED_ORIGINAL_FILE_NAME);

                                        if (util_forceString(_uploadFileName) == "") {

                                            //the file upload control does not have a new user specified file, so retrieve the existing file upload details
                                            _uploadFileName = _element.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_FILE_UPLOAD_NAME);
                                            _originalFileName = _element.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_FILE_UPLOAD_ORIGINAL_NAME);
                                        }

                                        _portionValue = { "UploadFileName": _uploadFileName, "OriginalFileName": _originalFileName };

                                        break; //end: file_upload

                                    default:

                                        if (_element.is("input[type='text'], select, textarea")) {
                                            _portionValue = _element.val();
                                        }

                                        break;  //end: default
                                }

                                if (typeof _portionValue == "string") {

                                    //replace the text values with the token placeholders
                                    _portionValue = _instance.Utils.ReplaceStrTokens(_portionValue, true);
                                }

                                _ret.d[_id] = { "Value": _portionValue };
                            }
                        });

                        //end: JSON format

                    }
                    else if (_format == "HTML" || _format == "TEXT") {

                        _ret = "";

                        var _arr = (PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_TYPE_METADATA[_tokenTypeID] || []);
                        var _isHTML = (_format == "HTML");

                        var _viewModeSimple = util_forceBool(options["ViewModeSimple"], false);

                        var _fnPortionContent = function (portionID, prefixContent) {
                            var _retPortionContent = "";
                            var _portionValue = _values[portionID];

                            var _handled = false;
                            var _isParseTextLinkHTML = true;

                            var _portionOpt = util_arrFilter(_arr, "Name", portionID, true);

                            if (_portionOpt.length == 1) {
                                _portionOpt = _portionOpt[0];
                            }
                            else {
                                _portionOpt = null;
                            }

                            prefixContent = util_forceString(prefixContent);

                            //check if it is a dropdown field
                            var _isDropdownField = false;

                            if (_portionOpt) {
                                var _opts = util_extend({}, _portionOpt["Options"]);

                                _isDropdownField = util_forceBool(_opts["IsDropdownList"], _isDropdownField);
                            }

                            if (_isDropdownField) {
                                var _searchTokenID = util_forceInt(_portionValue, enCE.None);
                                var _searchTokenItem = null;

                                if (_searchTokenID != enCE.None) {
                                    var _searchTokenData = options["SearchTokenData"];

                                    if (util_isNullOrUndefined(_searchTokenData)) {

                                        var _instTokenLookupItem = _instance.Metadata.GetDataVariable("m_placeholderTokenLookupItem");

                                        if (_instTokenLookupItem) {
                                            var _data = (_instTokenLookupItem["Data"] ? _instTokenLookupItem["Data"] : null);

                                            if (_data) {
                                                _searchTokenData = _data["List"];
                                            }
                                        }
                                    }

                                    if (_searchTokenData) {
                                        if (!$.isArray(_searchTokenData)) {

                                            //lookup (with key set to the field/portion ID)
                                            _searchTokenData = _searchTokenData[portionID];

                                            _searchTokenItem = util_arrFilter(_searchTokenData, "Value", _searchTokenID, true);
                                            _searchTokenItem = (_searchTokenItem.length == 1 ? _searchTokenItem[0] : null);

                                            if (_searchTokenItem) {
                                                _searchTokenItem = _searchTokenItem["Data"];    //retrieve the source ext token data item
                                            }
                                        }
                                        else {
                                            _searchTokenItem = util_arrFilter(_searchTokenData, enColExternalTokenProperty.TokenID, _searchTokenID, true);
                                            _searchTokenItem = (_searchTokenItem.length == 1 ? _searchTokenItem[0] : null);
                                        }
                                    }
                                }

                                if (_searchTokenItem != null) {
                                    _retPortionContent = prefixContent + _instance.Utils.ConvertExternalToken(_searchTokenItem, { "Format": _format });
                                    _handled = true;
                                }
                                else {
                                    _retPortionContent = "";
                                    _handled = true;
                                }
                            }

                            if (_tokenTypeID == enCEExternalTokenType.Reference) {

                                switch (portionID) {

                                    case "file_upload":
                                        if (_isHTML) {
                                            _portionValue = util_extend({ "UploadFileName": null, "OriginalFileName": null }, _portionValue);

                                            if ((util_forceString(_portionValue["UploadFileName"]) != "") ||
                                                (util_forceString(_values["file_link"]) != "")) {

                                                var _linkURL = _instance.Utils.ConstructExtTokenFileURL({ "DataItem": extTokenItem,
                                                    "FileName": _portionValue["UploadFileName"],
                                                    "DisplayName": _portionValue["OriginalFileName"],
                                                    "IsPreview": _isPreview,
                                                    "LinkURL": _values["file_link"]
                                                });

                                                var _portionHTML = "<a data-role='none' rel='external' target='_blank' " + util_htmlAttribute("href", _linkURL) + " " +
                                                                   util_htmlAttribute(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_FILE_UPLOAD_ORIGINAL_NAME,
                                                                                      util_forceString(_portionValue["OriginalFileName"]), null, true) +
                                                                   ">" +
                                                                   util_htmlEncode("[open]") +
                                                                   "</a>";

                                                _portionHTML = _instance.Utils.ReplaceStrTokens(_portionHTML);

                                                _portionValue = _portionHTML;
                                                _isParseTextLinkHTML = false;
                                            }
                                            else {
                                                _retPortionContent = "";
                                                _handled = true;
                                            }
                                        }
                                        else {
                                            _portionValue = "";
                                        }

                                        break;
                                }
                            }

                            if (!_handled) {

                                _portionValue = _instance.Utils.ReplaceStrTokens(_portionValue);

                                if (_isHTML) {
                                    var _cssClass = util_forceString(_portionOpt ? _portionOpt["CssClass"] : null);

                                    _retPortionContent += prefixContent +
                                                          "<span " + util_htmlAttribute("class", "CDossierPlaceholderTokenPortion" + (_cssClass != "" ? " " + _cssClass : "")) + ">" +
                                                          (_isParseTextLinkHTML ? _instance.Utils.ParseTextLinkHTML(_portionValue) : _portionValue) +
                                                          "</span>";
                                }
                                else {
                                    _retPortionContent += prefixContent + _portionValue;
                                }
                            }

                            return _retPortionContent;

                        };  //end: _fnPortionContent

                        var _values = {};
                        var _contentJSON = null;

                        if (_elementList) {
                            _contentJSON = _instance.Utils.ConvertExternalToken(extTokenItem, { "Format": "JSON", "ElementList": _elementList });
                        }
                        else {
                            _contentJSON = util_parse(extTokenItem[enColExternalTokenProperty.ContentJSON]);
                        }

                        _contentJSON = util_extend({ "d": {}, "version": null }, _contentJSON);

                        for (var i = 0; i < _arr.length; i++) {
                            var _item = _arr[i];
                            var _val = _contentJSON.d[_item.Name];

                            _values[_item.Name] = (_val ? _val["Value"] : null);
                        }

                        var _spaceCharacter = (_isHTML ? "&nbsp;" : " ");

                        var _tokenTypeIsHandled = true;

                        switch (_tokenTypeID) {

                            case enCEExternalTokenType.Reference:

                                if (_viewModeSimple) {
                                    _ret += _fnPortionContent("short_name");
                                }
                                else {
                                    _ret += _fnPortionContent("author") + _fnPortionContent("source", _spaceCharacter) + _fnPortionContent("details", _spaceCharacter) +
                                            _fnPortionContent("file_upload", _spaceCharacter);
                                }

                                break;

                            case enCEExternalTokenType.Chart:
                                if (!_isPreview && _format == "HTML") {
                                    var _hasEditTools = util_forceBool(options["HasEditTools"], false);

                                    _tokenTypeIsHandled = true;

                                    var _extContainerAttributes = (options["ExtContainerAttributes"] || {});
                                    var _cssClass = util_forceString(_extContainerAttributes["class"]);

                                    delete _extContainerAttributes[DATA_ATTRIBUTE_RENDER];

                                    _extContainerAttributes["class"] = "InlineBlock" + (_cssClass != "" ? " " + _cssClass : "");
                                    _extContainerAttributes[PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_CHART_ID] = extTokenItem[enColExternalTokenProperty.Name];
                                    _extContainerAttributes[PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_CHART_GET_INSTANCE_FN] = _instance.Metadata.GetInstanceEventReference("GetChartInstance");
                                    _extContainerAttributes[PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_HAS_EDIT_TOOLS] = (_hasEditTools ? enCETriState.Yes : enCETriState.No);

                                    _ret += "<div " + util_renderAttribute("pluginDossier_chart");

                                    for (var _attrName in _extContainerAttributes) {
                                        _ret += " " + util_htmlAttribute(_attrName, _extContainerAttributes[_attrName]);
                                    }

                                    _ret += " />";
                                }
                                else {
                                    _tokenTypeIsHandled = false;
                                }

                                break;


                            default:
                                _tokenTypeIsHandled = false;
                                break;
                        }

                        if (!_tokenTypeIsHandled) {
                            var _first = true;

                            for (var _key in _values) {
                                _ret += _fnPortionContent(_key, _first ? "" : _spaceCharacter);

                                if (_first) {
                                    _first = false;
                                }
                            }
                        }

                        //end: TEXT/HTML format

                    }

                    break;  //end: default token type

            }

            return _ret;

        };  //end: ConvertExternalToken

        _utils["ReplaceStrTokens"] = function (str, isReverseReplace, options) {
            isReverseReplace = util_forceBool(isReverseReplace, false);

            str = global_extSubsectionReplaceTokensHTML(str, { "IsReverseReplace": isReverseReplace,
                "ExtraTokens": { "%%SITE_URL%%": "<SITE_URL>" }
            });

            return str;

        };  //end: ReplaceStrTokens

        this["Utils"] = _utils;

        //events
        var _events = {};

        _events["FilterSectionList"] = function (options) {
            options = util_extend({ "List": null }, options);

            return options["List"];

        };  //end: FilterSectionList

        _events["ToggleTemplateView"] = function (options, callback) {
            var _callback = function () {
                if (callback) {
                    callback();
                }
            };

            _callback();

        };  //end: ToggleTemplateView

        _events["OnLoadSection"] = function (obj) {
            var _btn = $(obj);
            var _sectionID = util_forceInt(_btn.attr(_instance.Attributes.ATTRIBUTE_SECTION_ID), enCE.None);

            if (!_btn.hasClass("CDossierHomeSectionActiveNavItem") && _sectionID != enCE.None) {
                _instance.Events.LoadSection({ "Container": _instance.DOM.GetPluginContainerCtx({ "ChildElement": _btn }), "SectionID": _sectionID });
            }
        };

        _events["BindEventHandlers"] = function (options) {

            options = util_extend({ "Container": null, "RestrictActionButton": false }, options);

            var _container = $(options["Container"]);
            var _restrictActionButton = util_forceBool(options["RestrictActionButton"], false);

            if (!_restrictActionButton) {
                var _navigationContainer = _container.find("[" + _instance.Metadata.GetTemplateAttribute({ "TemplateType": "navigation" }) + "]");

                _navigationContainer.off("click.dossier_navigation");
                _navigationContainer.on("click.dossier_navigation", "[" + _instance.Attributes.ATTRIBUTE_SECTION_ID + "]", function () {
                    _instance.Events.OnLoadSection(this);
                });
            }

            _container.off("click.dossier_action_button");
            _container.on("click.dossier_action_button", "[" + _instance.Attributes.ATTRIBUTE_ACTION_BUTTON + "]", function () {
                _instance.Events.OnActionButtonClick(this);

                return false;
            });
        };

        _events["_ReplaceContentTokensHTML"] = function (options, callback) {
            if (callback) {
                callback(options);
            }
        };

        _events["ReplaceContentTokensHTML"] = function (options, callback) {
            var _callback = function () {
                if (callback) {
                    callback(options);
                }
            };

            options = util_extend({ "HTML": "", "Tokens": {}, "ForceSynchronous": false,
                "SetToken": function (key, val, isRemove) {
                    isRemove = util_forceBool(isRemove, false);

                    if (isRemove) {
                        delete this.Tokens[key];
                    }
                    else {
                        this.Tokens[key] = val;
                    }
                }
            }, options);

            var _temp = "";

            var _fnAddToken = function (key, val) {
                options.Tokens[key] = val;
            };

            var _attrInstancePlugin = util_htmlAttribute(DATA_ATTR_PLUGIN_INSTANCE, _instance.ID);

            //add tokens to disable jQuery mobile enhancement on links/form elements from external content
            _fnAddToken("<a", "<a data-role='none' " + util_htmlAttribute("data-attr-is-reference-link", enCETriState.Yes));

            //custom styles
            var _attrIsCustom = util_htmlAttribute(_instance.Attributes.ATTRIBUTE_IS_CUSTOM, enCETriState.Yes);

            _fnAddToken("<b>", "<b " + _attrIsCustom + ">");
            _fnAddToken("<strong>", "<strong " + _attrIsCustom + ">");

            //value message icon legend
            _temp = "<div style='display: none;' " + util_htmlAttribute("data-attr-has-legend", enCETriState.Yes) + "></div>";
            _fnAddToken("%%PRIVATE_TOKEN_VALUE_MESSAGE_ICON_LEGEND%%", _temp);

            //value message instruction & toggle collapsible group
            _temp = "<table border='0' cellpadding='0' cellspacing='0' style='width: 100%; margin-bottom: 0.25em;' " +
                util_htmlAttribute("data-attr-is-note-toggle-group", enCETriState.Yes) + ">" +
                "   <tr>" +
                "       <td align='left' valign='top'>" + util_htmlEncode("Select a Value Message:") + "</td>";

            //filter control
            _temp += "       <td align='right' valign='top'>" + util_htmlEncode("Filter Selections:") +
                 "           <div class='InlineBlock' " + util_renderAttribute("pluginDossier_valueMessageFilter") + " " + _attrInstancePlugin + " " +
                 util_htmlAttribute(_instance.Attributes.ATTRIBUTE_VALUE_MESSAGE_FILTER_GET_OPTION_FN, "plugin_dossier_getValueMessageFilterOptions") + " />" +
                 "           <div style='margin-top: 0.25em;'>" +
                 _instance.Templates.GetActionButtonHTML("vm_toggle_expand", "Expand All",
                                                         "data-mini='true' data-inline='true' data-theme='action-button-b' data-corners='false' data-icon='arrow-d'") +
                 _instance.Templates.GetActionButtonHTML("vm_toggle_collapse", "Collapse All",
                                                         "data-mini='true' data-inline='true' data-theme='action-button-b' data-corners='false' data-icon='arrow-u'") +
                 "           </div>" +
                 "       </td>";

            _temp += "   </tr>" +
                 "</table>";
            _fnAddToken("%%PRIVATE_TOKEN_VALUE_MESSAGE_NOTE_TOGGLE_COLLAPSIBLE_GROUP%%", _temp);

            //evidence statement header
            _temp = "<span class='CDossierSubsectionViewContentSubHeading'>" + util_htmlEncode("Evidence-supported statement:") + "</span>";
            _fnAddToken("%%PRIVATE_TOKEN_EVIDENCE_STATEMENT_HEADER%%", _temp);

            //evidence statement header
            _temp = "<span class='CDossierSubsectionViewContentSubHeading'>" + util_htmlEncode("Supporting evidence points ") + "</span>";
            _fnAddToken("%%PRIVATE_TOKEN_EVIDENCE_POINT_HEADER%%", _temp);

            //supporting reference header
            _temp = "<div class='CDossierSupportEvidenceList' " + util_htmlAttribute(_instance.Attributes.ATTRIBUTE_ACTION_BUTTON, "evidence_table_toggle") + ">" +
                "   <div class='CDossierSubsectionViewContentSubHeading CDossierSupportEvidenceCellR1C1'>" + util_htmlEncode("Supporting References") + "</div>" +
                "   <div class='CDossierSupportEvidenceCellR1C2'>" +
                _instance.Templates.GetActionButtonHTML("evidence_table_toggle_no_action", "",
                                                        "class='TableToggleButton' data-theme='suppport-ref-toggle' data-mini='true' data-inline='true' " +
                                                        "data-icon='arrow-d' data-iconpos='notext'") +
                "   </div>" +
                "</div>";
            _fnAddToken("%%PRIVATE_TOKEN_EVIDENCE_REFERENCE_HEADER%%", _temp);

            _fnAddToken("%%PRIVATE_TOKEN_EXPORT_DISABLE%%", "<div " + util_htmlAttribute("data-attr-disable-export", enCETriState.Yes) + " />");

            var _fn = function () {
                var _html = global_extSubsectionReplaceTokensHTML(options["HTML"]);

                _html = util_replaceTokens(_html, options.Tokens);
                options["HTML"] = _html;

                _callback();
            };

            if (util_isFunction(_instance.Events["_ReplaceContentTokensHTML"])) {
                _instance.Events._ReplaceContentTokensHTML(options, _fn);
            }
            else {
                _fn();
            }

            if (options["ForceSynchronous"]) {
                return options;
            }

        };  //end: ReplaceContentTokensHTML

        _events["PreProcessContentContainer"] = function (options) {

            options = util_extend({ "Container": null }, options);

            var _container = $(options["Container"]);
            var _list = null;

            var _listRender = _container.find("[" + DATA_ATTRIBUTE_RENDER + "]");

            //configure the chart token elements for the callback attribute
            _list = _listRender.filter("[" + util_renderAttribute("pluginDossier_chart") + "]");

            _list.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_CHART_GET_INSTANCE_FN, _instance.Metadata.GetInstanceEventReference("GetChartInstance"));

        };  //end: PreProcessContentContainer

        _events["ConfigureContentContainer"] = function (options, callback) {
            var _callback = function () {
                if (callback) {
                    callback();
                }
            };

            options = util_extend({ "Container": null }, options);

            var _container = $(options["Container"]);
            var _list = null;

            var _listRender = _container.find("[" + DATA_ATTRIBUTE_RENDER + "]");
            var _userCanAdminContent = _instance.Metadata.IsUserContentAdmin();

            //configure subsection link elements with:
            //  -the ancestor selector attribute (i.e. the container to use to replace content when link is clicked)
            //  -the callback to format the subsection content when it is loaded but prior to its HTML being set (to allow custom formatting)
            //  -the callback to execute when a subsection content has completed its load
            //  -the callback to execute when a subsection link is first clicked (used to perform state management and allow prevent default via propagation)
            _list = _listRender.filter("[" + util_renderAttribute("editor_subsection_link") + "]");

            _list.attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_ANCESTOR_SELECTOR, ".CDossierSubsectionContent")
             .attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_FORMAT_HTML_CALLBACK, _instance.Metadata.GetInstanceEventReference("OnEditorSubsectionLinkFormatHTML"))
             .attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_LOAD_CALLBACK, _instance.Metadata.GetInstanceEventReference("OnEditorSubsectionLinkLoadComplete"))
             .attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_ON_CLICK_CALLBACK, _instance.Metadata.GetInstanceEventReference("OnEditorSubsectionLinkClick"));

            //configure the placeholder token elements with the retrieve value callback attribute
            _list = _listRender.filter("[" + util_renderAttribute("editor_placeholder_token") + "]");

            if (_list.length > 0) {

                _list.attr(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_GET_VALUE_CALLBACK, _instance.Metadata.GetInstanceEventReference("GetEditorPlaceholderTokenValue"));

                if (_userCanAdminContent) {
                    _list.attr(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_ON_EDIT_CLICK_CALLBACK, _instance.Metadata.GetInstanceEventReference("OnActionButtonClick"));
                    _list.attr(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_IS_EDITABLE, _userCanAdminContent ? enCETriState.Yes : enCETriState.No);
                }
                else {
                    _list.removeAttr(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_ON_EDIT_CLICK_CALLBACK);
                }

                //must refresh the renderer placeholder element
                var _fnRefreshTokenPlaceholders = function (arrObj, id, index) {
                    if (index < arrObj.length) {
                        var _obj = $(arrObj[index]);

                        //ensure a matching render timestamp ID is found (i.e. element was not removed or a recent render call was not executed)
                        if (_obj.attr("data-cattr-render-element-timestamp-id") == id) {
                            $mobileUtil.RenderRefresh(_obj, true);

                            setTimeout(function () {
                                _fnRefreshTokenPlaceholders(arrObj, id, index + 1);
                            }, 75);
                        }
                    }
                };

                var _timestamp = (new Date()).getTime() + "";

                _list.attr("data-cattr-render-element-timestamp-id", _timestamp);   //set data attribute for unique render ID

                //configure event for the elements when it is removed/destroyed to cleanup the render timestamp ID (will in turn interrupt any active recursive timeout calls)
                _list.unbind("remove.editor_placeholder_token_timeout_render");
                _list.bind("remove.editor_placeholder_token_timeout_render", function () {
                    $(this).removeAttr("data-cattr-render-element-timestamp-id");
                });

                //set loading message for the token
                _list.find("[" + util_htmlAttribute(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_ELEMENT_TYPE, "label") + "]")
                     .html(util_forceString(_instance.Templates.PlaceholderTokenLoadIndicator));

                _list.removeClass("CEditorPlaceholderTokenError");

                _fnRefreshTokenPlaceholders(_list, _timestamp, 0);
            }

            //override the breadcrumb related subsection links to remove the ancestor selector and use custom get container callback function
            _listRender.filter(".CDossierSubsectionLinkBreadcrumbItem")
                   .removeAttr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_ANCESTOR_SELECTOR)
                   .attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_GET_CONTAINER_CALLBACK, _instance.Metadata.GetInstanceEventReference("OnBreadcrumbSubsectionLinkGetContainer"));


            _list = _container.find("[data-attr-has-legend=" + enCETriState.Yes + "]");

            var _legendPopupHTML = "<div class='InlineBlock CDossierValueMessageLegendButtonContainer'>" +
                               _instance.Templates.GetActionButtonHTML("popup_value_message", "VIEW ICON LEGEND", null, "data-icon='gear'") +
                               "</div>";

            _container.find(".CDossierValueMessageLegendButtonContainer").html("");

            $.each(_list, function (indx) {
                var _element = $mobileUtil.FindClosest(this, "[" + _instance.Attributes.ATTRIBUTE_SUBSECTION_ID + "]");
                var _tools = _element.find(".CDossierSubsectionTitleTools");

                _tools.html(_legendPopupHTML);
                $mobileUtil.refresh(_tools);
            });

            //configure the standard (non-enhancement) links
            _list = _container.find("a[data-attr-is-reference-link=" + enCETriState.Yes + "]");

            _list.attr("rel", "external");

            //configure external links (for .pdf files to show as inline popup)
            var _linksList = _list.filter("[href*='" + "<SITE_URL>dynamic/external/links/" + "'], .CInlinePopupLink")
                                  .filter("[href*='.pdf']:not(.PopupFileLink), [href*='.jpg']:not(.PopupFileLink), [href*='.png']:not(.PopupFileLink), .CInlinePopupLink")
                                  .not("[data-attr-force-download=1]");

            $.each(_linksList, function (indx) {
                var _link = $(this);
                var _href = _link.attr("href");

                _link.attr("data-attr-inline-popup-href", _href);
                _link.attr("href", "javascript: void(0);");
            });

            _linksList.addClass("PopupFileLink");

            //configure anchor links to use JS click event (instead of "#" window location URL approach)
            var _anchorLinksList = _list.filter("[href^='#']:not([" + _instance.Attributes.ATTRIBUTE_ACTION_BUTTON + "])");

            $.each(_anchorLinksList, function (indx) {
                var _anchor = $(this);
                var _href = _anchor.attr("href");

                _anchor.attr("data-attr-anchor-href", _href);
                _anchor.attr("href", "javascript: void(0);");
            });

            _anchorLinksList.addClass("AnchorLink")
                        .attr(_instance.Attributes.ATTRIBUTE_ACTION_BUTTON, "anchor");

            //configure supporting evidence container toggle
            _list = $mobileUtil.FindClosest(_container.find("[" + _instance.Attributes.ATTRIBUTE_ACTION_BUTTON + "='evidence_table_toggle']"),
                                        ".CEditorProjectEvidenceReferenceContainer");

            _list.find(".CEditorProjectEvidenceReferenceItemContainer").hide();

            _container.find("[" + _instance.Attributes.ATTRIBUTE_IS_CUSTOM + "]").addClass("CustomContent");

            _container.find(".PopupFileLink")
                      .attr(_instance.Attributes.ATTRIBUTE_ACTION_BUTTON, "popup_resource_viewer");


            //AKV TODO
            //configure the export container tools
            //        var _listExportContainer = _container.find(".SubsectionExportContainer");

            //        if (_listExportContainer.length > 0) {

            //            $.each(_listExportContainer, function () {
            //                var _exportContainer = $(this);
            //                var _parentExportContainer = _exportContainer.closest("[" + _instance.Attributes.ATTRIBUTE_SUBSECTION_ID + "]");
            //                var _disableExportElement = _parentExportContainer.find("[" + util_htmlAttribute("data-attr-disable-export", enCETriState.Yes) + "]");

            //                if (_disableExportElement.length > 0) {
            //                    _exportContainer.html("");
            //                    _exportContainer.hide();
            //                }
            //                else {
            //                    _exportContainer.html(m_exportManager.GetButtonHTML({ "Container": _parentExportContainer }));
            //                    $mobileUtil.refresh(_exportContainer);
            //                    _exportContainer.show();
            //                }

            //            });
            //        }

            //configure the content admin controls
            var _listAdminContainer = _container.find(".CDossierSubsectionAdminContainer");

            if (_listAdminContainer.length > 0) {
                if (!_instance.Metadata.IsUserSystemAdmin()) {
                    _listAdminContainer.empty();
                    _listAdminContainer.hide();
                }
                else {
                    var _currentPresVersionID = util_forceInt(_instance.Metadata.GetDataVariable("m_currentPresentationVersionID"), enCE.None);

                    $.each(_listAdminContainer, function (indx) {
                        var _adminContainer = $(this);
                        var _editButtonHTML = "";
                        var _subsectionID = _instance.Metadata.GetContextSubsectionID(_adminContainer);

                        var _editContentURL = util_constructContentEditorPageURL({ "ControllerName": "PresentationVersion", "ViewMode": "Edit", "ID": _currentPresVersionID,
                            "QueryString": util_appendQS("", "subID", _subsectionID)
                        });

                        if (_editContentURL != null) {

                            _editButtonHTML += "<a data-role='button' data-icon='edit' data-corners='false' data-mini='true' data-inline='true' rel='external' target='_blank' " +
                                               util_htmlAttribute("href", _editContentURL) + ">" + util_htmlEncode("EDIT CONTENT") + "</a>";

                            _adminContainer.html(_editButtonHTML);
                            _adminContainer.trigger("create");
                        }
                        else {
                            _adminContainer.empty();
                            _adminContainer.hide();
                        }
                    });
                }
            }

            _instance.Utils.ResizeContent();

            _instance.Managers.StateManager.LoadState(_container);

            _callback();
        };

        _events["LoadPresentationVersion"] = function (options, callback) {
            var _callback = function () {
                if (callback) {
                    callback();
                }
            };

            options = util_extend({ "Container": null, "VersionID": enCE.None, "DefaultSectionID": enCE.None, "FilterSubsectionID": enCE.None }, options);

            var _versionID = util_forceInt(options["VersionID"], enCE.None);

            _instance.Metadata.SetDataVariable("m_currentPresentationVersionID", _versionID);

            if (_versionID != enCE.None) {

                global_extSectionList({ "PresentationVersionID": _versionID }, function (data) {
                    var m_presentationVersionList = _instance.Metadata.GetDataVariable("m_presentationVersionList");

                    var m_currentPresentationVersion = util_arrFilter(m_presentationVersionList, enColExternalPresentationVersionProperty.VersionID, _versionID, true);

                    if (m_currentPresentationVersion.length == 1) {
                        m_currentPresentationVersion = m_currentPresentationVersion[0];
                    }
                    else {
                        m_currentPresentationVersion = null;
                    }

                    var m_sectionList = (data.List || []);

                    m_sectionList = (_instance.Events.FilterSectionList({ "List": m_sectionList }) || []);

                    _instance.Metadata.SetDataVariable("m_sectionList", m_sectionList);

                    //load the default first section
                    m_currentSectionID = enCE.None;

                    var _defaultSectionID = enCE.None;

                    if (m_sectionList.length > 0) {

                        var _optSectionID = util_forceInt(options["DefaultSectionID"], enCE.None);

                        if (_optSectionID != enCE.None && util_arrFilter(m_sectionList, enColExternalSectionProperty.SectionID, _optSectionID, true).length == 1) {
                            _defaultSectionID = _optSectionID;
                        }
                        else {
                            _defaultSectionID = (m_sectionList[0])[enColExternalSectionProperty.SectionID];
                        }
                    }

                    if (_defaultSectionID != enCE.None) {
                        _instance.Events.LoadSection({ "Container": options["Container"], "SectionID": _defaultSectionID, "FilterSubsectionID": options["FilterSubsectionID"] },
                                                 _callback);
                    }
                    else {
                        _callback();
                    }

                }); //end: global_extSectionList
            }
            else {
                _callback();
            }

        };  //end: LoadPresentationVersion

        _events["LoadSection"] = function (options, callback) {
            var _callback = function () {
                if (callback) {
                    callback();
                }
            };

            options = util_extend({ "Container": null, "SectionID": enCE.None, "FilterSubsectionID": enCE.None, "DisableCache": false }, options);

            var _element = $(options["Container"]);

            var _sectionID = util_forceInt(options.SectionID, enCE.None);
            var _filterSubsectionID = util_forceInt(options["FilterSubsectionID"], enCE.None);

            if (_sectionID != enCE.None) {

                _instance.Metadata.SetDataVariable("m_currentSectionID", _sectionID);    //set the current section ID

                var _methodOptions = {};

                _methodOptions = { "SectionID": _sectionID };

                global_extSectionSubsectionList(_methodOptions, function (sectionSubsectionData) {

                    var _subsections = sectionSubsectionData.List;

                    if (_filterSubsectionID != enCE.None) {
                        _subsections = util_arrFilter(_subsections, enColExternalSectionSubsectionProperty.SubsectionID, _filterSubsectionID, true);
                    }

                    var _contentContainer = _element.find("[" + _instance.Metadata.GetTemplateAttribute({ "TemplateType": "content" }) + "]");

                    //bind the subsection content view
                    var _contentHTML = "";

                    for (var s = 0; s < _subsections.length; s++) {
                        var _subsection = _subsections[s];
                        var _subsectionID = _subsection[enColExternalSectionSubsectionProperty.SubsectionID];
                        var _subsectionTypeID = util_forceInt(_subsection[enColExternalSectionSubsectionProperty.SubsectionTypeID], enCE.None);
                        var _validSubsection = (_subsectionTypeID == enCE.None || _subsectionTypeID != enCEExternalSubsectionType.Hidden); //disregard hidden subsections

                        if (_filterSubsectionID != enCE.None) {
                            _validSubsection = (_subsectionID == _filterSubsectionID);
                        }

                        if (_validSubsection) {
                            var _displayName = util_forceString(_subsection[enColExternalSectionSubsectionProperty.SubsectionDisplayName]);

                            _instance.Managers.CacheManager.SetCacheItem("SUBSECTION_DN_" + _subsectionID, _displayName);

                            _contentHTML += "<div " + util_htmlAttribute("class", "CDossierSubsectionContainer") + " " +
                                        util_htmlAttribute(_instance.Attributes.ATTRIBUTE_SUBSECTION_ID, _subsectionID) + ">" +
                                        "  <div class='CDossierSubsectionHeader' style='display: none;'></div>" +
                                        "  <div class='CDossierSubsectionTitleContainer'>" +
                                        "      <div class='CDossierSubsectionTitle'>" + util_htmlEncode(_displayName) + "</div>" +
                                        "      <div class='CDossierSubsectionTitleTools'></div>" +
                                        "  </div>" +
                                        "  <div class='CDossierSubsectionAdminContainer'></div>" +
                                        "  <div class='CDossierSubsectionContent'>" +
                                        util_forceString(_subsection[enColExternalSectionSubsectionProperty.SubsectionContent]) +
                                        "   </div>" +
                                        "</div>";

                            //AKV TODO: improper use of web service calls within for loop (review and fix issue)
                            //ProjectService.AddSubsectionStat(global_AuthUserID(), _subsectionID, enCESubsectionStatsType947.Accessed, true);
                        }
                    }

                    _instance.Events.PopulateInstanceData({ "DisableCache": options["DisableCache"] }, function () {

                        _instance.Events.ReplaceContentTokensHTML({ "HTML": _contentHTML }, function (renderOpts) {

                            _contentContainer.html(renderOpts["HTML"]);

                            _instance.Events.PreProcessContentContainer({ "Container": _contentContainer });

                            $mobileUtil.refresh(_contentContainer);

                            _instance.Events.ConfigureContentContainer({ "Container": _contentContainer }, function () {

                                //bind the navigation
                                _instance.Events.BindSectionNavigation({ "Container": _element, "SectionSubsectionList": _subsections }, _callback);

                            });

                        }); //end: ReplaceContentTokensHTML

                    }); //end: PopulateInstanceData

                });
            }
            else {
                _callback();
            }

        };  //end: LoadSection

        _events["RefreshSection"] = function (options, callback) {
            var _callback = function () {
                if (callback) {
                    callback();
                }
            };

            options = util_extend({ "ChildElement": null, "DisableCache": false }, options);

            var _currentSectionID = _instance.Metadata.GetDataVariable("m_currentSectionID");

            _instance.Events.LoadSection({ "Container": _instance.DOM.GetPluginContainerCtx({ "ChildElement": options["ChildElement"] }), "SectionID": _currentSectionID,
                "DisableCache": options["DisableCache"]
            }, _callback);

        };  //end: RefreshSection

        _events["BindSectionNavigation"] = function (options, callback) {
            var _callback = function () {
                if (callback) {
                    callback();
                }
            };

            options = util_extend({ "Container": null, "IsUpdate": false, "SectionSubsectionList": [] }, options);

            var _container = $(options["Container"]);
            var _navigationContainer = _container.find("[" + _instance.Metadata.GetTemplateAttribute({ "TemplateType": "navigation" }) + "]");

            var _isUpdate = util_forceBool(options["IsUpdate"], false);

            if (!_isUpdate) {
                var _html = "";

                var m_sectionList = _instance.Metadata.GetDataVariable("m_sectionList");

                if (!util_isNullOrUndefined(m_sectionList) && m_sectionList.length > 1) {

                    for (var i = 0; i < m_sectionList.length; i++) {
                        var _section = m_sectionList[i];
                        var _text = global_extSectionDisplayName(_section);
                        var _css = "CDossierHomeSectionNavItem InlineBlock";

                        if (i == 0) {
                            _css += " CDossierHomeSectionFirstNavItem";
                        }

                        if (i == m_sectionList.length - 1) {
                            _css += " CDossierHomeSectionLastNavItem";
                        }

                        _html += "<div " + util_htmlAttribute("class", _css) + " " +
                            util_htmlAttribute(_instance.Attributes.ATTRIBUTE_SECTION_ID, _section[enColExternalSectionProperty.SectionID]) + ">" +
                            util_htmlEncode(_text) +
                            "</div>";
                    }
                }

                _navigationContainer.html(_html);

                if (_html == "") {
                    _navigationContainer.hide();
                }
                else {
                    _navigationContainer.show();
                }

                $mobileUtil.refresh(_navigationContainer);
            }

            var _list = _navigationContainer.find(".CDossierHomeSectionNavItem");
            var m_currentSectionID = _instance.Metadata.GetDataVariable("m_currentSectionID");

            _list.removeClass("CDossierHomeSectionActiveNavItem");
            _list.filter("[" + util_htmlAttribute(_instance.Attributes.ATTRIBUTE_SECTION_ID, m_currentSectionID) + "]").addClass("CDossierHomeSectionActiveNavItem");

            _callback();

        };  //end: BindSectionNavigation

        _events["BindDashboardPresentationVersionNavigation"] = function (options, callback) {

            options = util_extend({ "Container": null, "LinkCssClass": "", "HideListSingleSubsection": false }, options);

            var _hideSingleSubsection = util_forceBool(options["HideListSingleSubsection"], false);
            var _linkCssClass = util_forceString(options["LinkCssClass"]);

            var _container = $(options["Container"]);

            if (_container.length == 0) {
                _container = $mobileUtil.DashboardContainer();
            }

            if (_linkCssClass != "") {
                _linkCssClass = _linkCssClass + " ";
            }

            global_extPresentationVersionNavigationList({ "VersionID": _instance.Metadata.GetDataVariable("m_currentPresentationVersionID") }, function (navigationData) {
                var _list = (navigationData || []);
                var _html = "";

                if (_list.length == 0) {
                    _html += "<div style='text-align: center; font-size: 0.95em; padding-top: 1em;'>" + util_htmlEncode("There are no sections available.") + "</div>";
                }
                else {
                    _html += "<ul class='CDossierPresentationNavigationList'>";

                    var _attrNavigationActionButton = util_htmlAttribute(_instance.Attributes.ATTRIBUTE_ACTION_BUTTON, "navigation_link_pres_version");

                    for (var i = 0; i < _list.length; i++) {
                        var _navigationItem = _list[i];
                        var _section = (_navigationItem[enColCExtPresentationVersionSectionNavigationProperty.Section] || {});
                        var _displayName = global_extSectionDisplayName(_section);
                        var _numSubsections = _navigationItem[enColCExtPresentationVersionSectionNavigationProperty.NumSubsections];

                        _html += "<li " + util_htmlAttribute(_instance.Attributes.ATTRIBUTE_NAVIGATION_LINK_SECTION_ID, _section[enColExternalSectionProperty.SectionID]) + ">";

                        _html += "  <a class='" + _linkCssClass + "CDossierDashboardToolLinkSection' href='javascript: void(0);' " + _attrNavigationActionButton + ">" +
                             util_htmlEncode(_displayName) +
                             "  </a>";

                        var _details = (_navigationItem[enColCExtPresentationVersionSectionNavigationProperty.Details] || []);

                        if (_details.length > 0) {
                            var _validDetails = true;
                            var _hideFirstDetail = false;

                            _html += "<div class='CDossierPresentationNavigationDetailsContainer'>";

                            if (_hideSingleSubsection) {
                                if (_numSubsections == 1) {
                                    var _detailItem = _details[0];

                                    if (util_forceInt(_detailItem[enColCExtPresentationSectionNavigationDetailProperty.SubsectionID], enCE.None) != enCE.None) {
                                        _hideFirstDetail = true;
                                    }
                                }
                            }

                            for (var d = 0; _validDetails && d < _details.length; d++) {
                                var _detailItem = _details[d];
                                var _level = util_forceInt(_detailItem[enColCExtPresentationSectionNavigationDetailProperty.Level], 0);
                                var _subsectionID = util_forceInt(_detailItem[enColCExtPresentationSectionNavigationDetailProperty.SubsectionID], enCE.None);
                                var _linkActionType = util_forceString(_detailItem[enColCExtPresentationSectionNavigationDetailProperty.ActionType], "");
                                var _linkParam = util_forceString(_detailItem[enColCExtPresentationSectionNavigationDetailProperty.Parameters], "");

                                if ((d == 0 && !_hideFirstDetail) || (d > 0)) {
                                    _html += "<div " + _attrNavigationActionButton + " " +
                                         util_htmlAttribute("class", _linkCssClass + "CDossierPresentationNavigationDetailItem" +
                                                                     (_level > 0 ? " CDossierPresentationNavigationDetailItemLevel_" + _level : "")) + " " +
                                         util_htmlAttribute(_instance.Attributes.ATTRIBUTE_NAVIGATION_LINK_SUBSECTION_ID, _subsectionID) + " " +
                                         util_htmlAttribute(_instance.Attributes.ATTRIBUTE_NAVIGATION_LINK_SUBSECTION_PARAM, _linkParam, null, true) + " " +
                                         util_htmlAttribute(_instance.Attributes.ATTRIBUTE_NAVIGATION_LINK_SUBSECTION_ACTION_TYPE, _linkActionType, null, true) + ">" +
                                         util_htmlEncode(_detailItem[enColCExtPresentationSectionNavigationDetailProperty.Title]) +
                                         "</div>";
                                }
                            }

                            _html += "</div>";
                        }

                        _html += "</li>";
                    }

                    _html += "</ul>";
                }

                _container.html(_html);

                _instance.Events.BindEventHandlers({ "Container": _container, "RestrictActionButton": true });
            });

        };  //end: BindDashboardPresentationVersionNavigation

        _events["OnEditorSubsectionLinkClick"] = function (options) {
            var _ret = { "PreventDefault": false };

            options = util_forceObject(options);

            var _target = $(options["Target"]);
            var _id = util_forceInt(options["ID"], enCE.None);

            //check if the subsection link should disable breadcrumb for the click event (i.e. replace last breadcrumb in the list, if applicable)
            var _isReplaceCurrentBreadcrumb = (util_forceInt(_target.attr(_instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_IS_REPLACE_CURRENT), enCETriState.None) ==
                                        enCETriState.Yes);

            if (_isReplaceCurrentBreadcrumb) {
                var _breadcrumbContainer = $mobileUtil.FindClosest(_target, "[" + _instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST + "]");

                if (_breadcrumbContainer.length == 1) {
                    var _strBreadcrumbList = util_forceString(_breadcrumbContainer.attr(_instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST));

                    var _index = _strBreadcrumbList.lastIndexOf("|");

                    if (_index >= 0) {
                        _strBreadcrumbList = _strBreadcrumbList.substr(0, _index);
                    }

                    _breadcrumbContainer.attr(_instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST, _strBreadcrumbList);
                }
            }

            _instance.Managers.StateManager.SaveState(_target);

            return _ret;

        };  //end: OnEditorSubsectionLinkClick

        _events["OnEditorSubsectionLinkLoadComplete"] = function (options, renderOptions) {

            renderOptions = util_extend({ "IsInlineView": false }, renderOptions);

            var _isInlineView = util_forceBool(renderOptions["IsInlineView"], false);

            options = util_forceObject(options);

            var _target = $(options["Target"]);
            var _container = $(options["Container"]);
            var _id = util_forceInt(options["ID"], enCE.None);
            var _subsectionData = util_forceObject(options["Data"]);

            if (!_isInlineView) {

                //append the current subsection ID to the breadcrumb on the container (for tracking), if applicable
                if (!_target.hasClass("CDossierSubsectionLinkBreadcrumbItem")) {

                    var _breadcrumb = util_forceString(_container.attr(_instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST));

                    if (_breadcrumb != "") {
                        _breadcrumb += "|";
                    }
                    else {
                        _breadcrumb = $mobileUtil.GetAncestorAttributeValue(_container, _instance.Attributes.ATTRIBUTE_SUBSECTION_ID) + "|";
                    }

                    _breadcrumb += _id;

                    _container.attr(_instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST, _breadcrumb);
                }
            }

            var _displayName = global_extSubsectionDisplayName(_subsectionData);

            var _subsectionTitleContainer = _container.siblings(".CDossierSubsectionTitleContainer");

            if (!_isInlineView) {
                _subsectionTitleContainer.find(".CDossierSubsectionTitle").text(_displayName);
            }

            //must reconfigure the subsection container for the updated contents
            var _contentContainer = null;
            
            if (!_isInlineView){
                _container = $mobileUtil.FindClosest(_subsectionTitleContainer, "[" + _instance.Attributes.ATTRIBUTE_SUBSECTION_ID + "]");
            }
            else{
                _contentContainer = _container;
            }

            _instance.Events.ConfigureContentContainer({ "Container": _contentContainer }, function () {

                if (util_forceInt(_target.attr("data-attr-scroll-top-on-complete"), enCETriState.None) == enCETriState.Yes) {
                    $mobileUtil.AnimateSmoothScroll(null, null, { "Top": 0, "Left": 0 });
                }

                //AKV TODO: review and verify subsection stat implementation
                //ProjectService.AddSubsectionStat(global_AuthUserID(), _id, enCESubsectionStatsType947.Accessed, true);

            });

        };  //end: OnEditorSubsectionLinkLoadComplete

        _events["OnEditorSubsectionLinkFormatHTML"] = function (options, renderOptions) {

            renderOptions = util_extend({ "IsInlineView": false }, renderOptions);

            var _isInlineView = util_forceBool(renderOptions["IsInlineView"], false);

            options = util_forceObject(options);

            var _target = $(options["Target"]);
            var _container = $(options["Container"]);
            var _id = util_forceInt(options["ID"], enCE.None);
            var _html = util_forceString(options["HTML"]);
            var _data = util_forceObject(options["Data"]);

            if (!_isInlineView) {
                _isInlineView = (util_forceInt(_target.attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_IS_INLINE), enCETriState.None) == enCETriState.Yes);
            }

            var _strBreadcrumb = util_forceString(_container.attr(_instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST));
            var _arr = (_strBreadcrumb != "" ? _strBreadcrumb.split("|") : []);
            var _breadcrumbHTML = "";

            var _renderOpts = _instance.Events.ReplaceContentTokensHTML({ "HTML": _html, "ForceSynchronous": true });   //replace the tokens (important!)

            _html = _renderOpts["HTML"];

            if (!_isInlineView) {

                if (_arr.length == 0) {
                    _arr.push($mobileUtil.GetAncestorAttributeValue(_container, _instance.Attributes.ATTRIBUTE_SUBSECTION_ID));
                }

                _arr.push(_id);

                _instance.Managers.CacheManager.SetCacheItem("SUBSECTION_DN_" + _id, global_extSubsectionDisplayName(_data));

                if (_target.hasClass("CDossierSubsectionLinkBreadcrumbItem")) {

                    var _temp = [];

                    var _maxIndex = util_forceInt(_target.attr("data-attr-breadcrumb-index"), -1);

                    for (var i = 0; i < _arr.length && i < _maxIndex; i++) {
                        _temp.push(_arr[i]);
                    }

                    _arr = _temp;

                    if (_maxIndex > 0) {
                        _arr.push(_id);
                    }

                    _container.attr(_instance.Attributes.ATTRIBUTE_SUBSECTION_LINK_BREADCRUMB_LIST, util_arrJoinStr(_arr, null, "|"));
                }

                if (_arr.length > 0) {

                    _breadcrumbHTML += "<div class='CDossierSubsectionLinkBreadcrumbContainer'>";

                    for (var i = 0; i < _arr.length; i++) {
                        var _breadcrumbSubsectionID = _arr[i];
                        var _breadcrumbAttr = "";
                        var _isCurrent = (_breadcrumbSubsectionID == _id);

                        if (!_isCurrent) {
                            _breadcrumbAttr += util_renderAttribute("editor_subsection_link") + " " +
                                               util_htmlAttribute(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_PRES_SUBSECTION_LINK_ID, _breadcrumbSubsectionID) + " " +
                                               util_htmlAttribute("data-attr-breadcrumb-index", i);
                        }

                        var _subsectionDisplayName = _instance.Managers.CacheManager.GetCacheItem("SUBSECTION_DN_" + _breadcrumbSubsectionID);

                        _breadcrumbHTML += "<div class='InlineBlock CDossierSubsectionLinkBreadcrumbItem" +
                                           (_isCurrent ? " CDossierSubsectionLinkBreadcrumbItemDisabled" : "") + "' " +
                                           _breadcrumbAttr + " " +
                                           util_htmlAttribute("title", _subsectionDisplayName, null, true) +
                                           ">" +
                                           util_htmlEncode(i + 1) +
                                           "</div>";
                    }

                    _breadcrumbHTML += "</div>";
                }

                var _parentContainer = $mobileUtil.FindClosest(_container, "[" + _instance.Attributes.ATTRIBUTE_SUBSECTION_ID + "]");

                var _headerContainer = _parentContainer.children(".CDossierSubsectionHeader");

                _headerContainer.html(_breadcrumbHTML);
                $mobileUtil.refresh(_headerContainer);

                if (_breadcrumbHTML == "") {
                    _headerContainer.hide();
                }
                else {
                    _headerContainer.show();
                }
            }
            else {
                _html = "<div class='CDossierSubsectionTitleInline'>" + global_extSubsectionDisplayName(_data) + "</div>" + _html;
            }

            options["HTML"] = _html;    //set updated HTML

            return options;

        };  //end: OnEditorSubsectionLinkFormatHTML

        _events["OnBreadcrumbSubsectionLinkGetContainer"] = function (options) {
            options = util_forceObject(options);

            var _target = $(options["Target"]);

            options["Container"] = $mobileUtil.FindClosest(_target, "[" + _instance.Attributes.ATTRIBUTE_SUBSECTION_ID + "]")
                                        .children(".CDossierSubsectionContent");

            return options;

        };  //end: OnBreadcrumbSubsectionLinkGetContainer

        _events["OnActionButtonClick"] = function (obj) {
            var _btn = $(obj);

            var _type = util_forceString(_btn.attr(_instance.Attributes.ATTRIBUTE_ACTION_BUTTON));
            var _elementContainer = null;

            //apply override to the custom action button by retrieving the closest renderer container and determining the action button ID
            if (_type == "") {
                var _attrRender = util_forceString($mobileUtil.GetClosestAttributeValue(_btn, DATA_ATTRIBUTE_RENDER));

                switch (_attrRender) {

                    case "editor_placeholder_token":
                        _type = "edit_placeholder_token";
                        break;
                }
            }

            switch (_type) {

                case "popup_value_message":
                    _instance.Events.ShowIconLegendPopup(_btn);
                    break;

                case "popup_resource_viewer":
                    _instance.Events.ShowPopupResourceViewer(_btn);
                    break;

                case "vm_toggle_expand":
                case "vm_toggle_collapse":
                    _elementContainer = $mobileUtil.FindClosest(_btn, "[data-attr-is-note-toggle-group=" + enCETriState.Yes + "]");

                    if (_elementContainer.length == 1) {

                        var _fnSearchSiblingElement = function (searchObj, criteria) {
                            var _match = null;
                            var _start = $(searchObj);

                            if (_start.length > 0 && util_forceString(criteria) != "") {

                                if (_start.is(criteria)) {
                                    _match = _start;
                                }
                                else {
                                    var _sibling = _start.next();

                                    while (_sibling.length == 1 && (_match == null || _match.length <= 0)) {

                                        if (_sibling.is(criteria)) {
                                            _match = _sibling;
                                            break;
                                        }
                                        else {
                                            _match = _sibling.find(criteria);
                                        }

                                        _sibling = _sibling.next();
                                    }
                                }
                            }
                            else if (_start.length > 0) {
                                _match = _start.next();
                            }

                            return _match;
                        };

                        var _searchSelector = "[" + util_renderAttribute("editor_collapsible_group") + "]";

                        var _search = _elementContainer.next();
                        var _searchResult = null;

                        _searchResult = _fnSearchSiblingElement(_search, _searchSelector);

                        if (_searchResult == null || _searchResult.length == 0) {
                            _searchResult = _fnSearchSiblingElement(_elementContainer.parent(), _searchSelector);   //search from the containing element's parent
                        }
                        else {
                            _searchResult = _searchResult.first();
                        }

                        //no match is found so find the next sibling
                        if (_searchResult == null || _searchResult.length == 0) {
                            var _searchSibling = _elementContainer.next();

                            if (_searchSibling.length == 0) {
                                _searchSibling = _elementContainer.parent().next();
                            }

                            if (_searchSibling.length > 0) {
                                if (_type == "vm_toggle_expand") {
                                    _searchSibling.show();
                                }
                                else {
                                    _searchSibling.hide();
                                }
                            }
                        }

                        //initial search critiera of collapsible group was found, so toggle all as applicable
                        if (_searchResult != null && _searchResult.length > 0) {
                            var _collapsibleGroup = $(_searchResult).first();

                            _collapsibleGroup.attr(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_TOGGLE_ALL_TYPE, (_type == "vm_toggle_expand" ? "show" : "hide"));

                            $mobileUtil.RenderRefresh(_collapsibleGroup, true);
                        }
                    }

                    //allow callback via the element's data value, if applicable
                    var _fnActionCallback = _btn.data("DataFnOnClickCallback");

                    if (util_isFunction(_fnActionCallback)) {
                        _fnActionCallback({ "Element": _btn, "PluginInstance": _instance });
                    }

                    break;

                case "evidence_table_toggle":
                case "anchor":

                    var _fnToggleEvidenceTableContainer = function (childObj, isVisible) {

                        var _child = $(childObj);

                        var _elementContainer = $mobileUtil.FindClosest(_child, ".CEditorProjectEvidenceReferenceContainer");
                        var _btn = _elementContainer.find("[" + util_htmlAttribute(_instance.Attributes.ATTRIBUTE_ACTION_BUTTON, "evidence_table_toggle_no_action") + "]");

                        var _supRefItemList = _elementContainer.find(".CEditorProjectEvidenceReferenceItemContainer");

                        if (util_isNullOrUndefined(isVisible)) {
                            isVisible = (util_forceValidEnum(_elementContainer.attr("data-attr-is-support-ev-visible"), enCETriState, enCETriState.None, true) == enCETriState.Yes);
                            isVisible = !isVisible; //must invert since we will be toggling the visiblity view
                        }
                        else {
                            isVisible = util_forceBool(isVisible, false);
                        }

                        if (isVisible) {
                            _supRefItemList.fadeIn();
                        }
                        else {
                            _supRefItemList.fadeOut();
                        }

                        _elementContainer.attr("data-attr-is-support-ev-visible", isVisible ? enCETriState.Yes : enCETriState.No);

                        $mobileUtil.ButtonUpdateIcon(_btn, isVisible ? "arrow-u" : "arrow-d");

                    };  //end: _fnToggleEvidenceTableContainer

                    if (_type == "evidence_table_toggle") {
                        _fnToggleEvidenceTableContainer(_btn);
                    }
                    else if (_type == "anchor") {

                        var _anchorHref = util_forceString(_btn.attr("data-attr-anchor-href"));

                        if (_anchorHref != "") {
                            try {
                                var _anchorTarget = $mobileUtil.Content().find(_anchorHref);

                                var _ctxContainer = $mobileUtil.FindClosest(_anchorTarget, ".CEditorProjectEvidenceReferenceContainer");

                                if (_ctxContainer.length == 1) {
                                    _fnToggleEvidenceTableContainer(_ctxContainer, true);
                                }

                                if (_anchorTarget.length == 1) {
                                    $mobileUtil.AnimateSmoothScroll(_anchorTarget);
                                }
                            } catch (e) {
                                //suppress exceptions from invalid anchor selector
                            }
                        }
                    }

                    break;

                case "navigation_link_pres_version":
                    var _navSectionID = util_forceInt($mobileUtil.GetClosestAttributeValue(_btn, _instance.Attributes.ATTRIBUTE_NAVIGATION_LINK_SECTION_ID), enCE.None);

                    _instance.Events.LoadSection({ "Container": _instance.DOM.GetPluginContainerCtx({ "ChildElement": _btn }), "SectionID": _navSectionID }, function () {

                        var _fn = function () {

                            _instance.Events.ProcessLinkAction({ "Element": _btn }, function () {
                                $mobileUtil.ToggleOverlay(false);
                            });

                        };  //end: _fn

                        $mobileUtil.ToggleOverlay(true);

                        if ($mobileUtil.DashboardIsOpen()) {

                            $mobileUtil.DashboardClose(null, function () {
                                _fn();
                            }, null, false);
                        }
                        else {
                            _fn();
                        }
                    });

                    break;  //end: navigation_link_pres_version

                case "edit_placeholder_token":
                    _instance.Events.ShowPlaceholderTokenPopup(_btn, { "PluginInstance": _instance });
                    break;

                default:
                    util_log("PLUGIN Dossier :: action button type not handled - [" + _type + "]");
                    break;
            }

        };  //end: OnActionButtonClick

        _events["OnFileUploadControlEventCallback"] = function (options) {
            options = util_extend({ "UploadRefID": null, "Element": null, "UploadFileName": null, "OriginalFileName": null }, options);

            var _uploadRefID = util_forceString(options["UploadRefID"]);
            var _element = $(options["Element"]);
            var _uploadFileName = util_forceString(options["UploadFileName"]);
            var _originalFileName = util_forceString(options["OriginalFileName"]);

            switch (_uploadRefID) {

                case "fld_ctl_file_upload":
                    var _container = _element.closest("[" + util_renderAttribute("pluginDossier_placeholderTokenAdmin") + "]");

                    $mobileUtil.RenderRefresh(_container, true, null, null, { "ExcludeDescendentRendererList": ["file_upload"] });
                    break;
            }

        };  //end: OnFileUploadControlEventCallback

        _events["ProcessLinkAction"] = function (options, callback) {
            var _callback = function () {
                if (callback) {
                    callback();
                }
            };

            option = util_extend({ "Element": null }, options);

            var _element = $(option["Element"]);
            var _actionButtonType = util_forceString(_element.attr(_instance.Attributes.ATTRIBUTE_ACTION_BUTTON));

            switch (_actionButtonType) {

                case "navigation_link_pres_version":
                    var _navSubsectionID = util_forceInt(_element.attr(_instance.Attributes.ATTRIBUTE_NAVIGATION_LINK_SUBSECTION_ID), enCE.None);
                    var _navActionType = util_forceString(_element.attr(_instance.Attributes.ATTRIBUTE_NAVIGATION_LINK_SUBSECTION_ACTION_TYPE), "");
                    var _navParam = util_forceString(_element.attr(_instance.Attributes.ATTRIBUTE_NAVIGATION_LINK_SUBSECTION_PARAM), "");

                    var _target = null;
                    var _selector = "";

                    if (_navSubsectionID != enCE.None) {
                        _selector = ".CDossierSubsectionContainer[" + util_htmlAttribute("data-attr-subsection-id", _navSubsectionID) + "]";
                    }

                    var _pluginContainer = _instance.DOM.GetPluginContainerCtx({ "ChildElement": _element });
                    var _offset = null;
                    var _scrollPosition = { "Top": 0, "Left": 0 };

                    _target = _pluginContainer.find(_selector);

                    if (_target.length == 1) {
                        _offset = _target.offset();
                    }

                    switch (_navActionType) {

                        case "collapsible_group":
                            var _arr = _navParam.split("|");

                            if (_arr.length > 0) {
                                var _embeddedTarget = null;

                                for (var t = 0; t < _arr.length; t++) {
                                    var _tok = _arr[t];
                                    var _anchor = _target.find("#" + _tok);

                                    if (_anchor.length == 1) {
                                        var _collapsibleGroup = _anchor.closest("[" + util_renderAttribute("editor_collapsible_group") + "]");

                                        //important! must use children to avoid embedded/nested collapsible groups
                                        var _collapsibleItems = _collapsibleGroup.children(".CEditorCollapsibleItem");
                                        var _anchorCollapsibleItem = _anchor.closest(".CEditorCollapsibleItem");

                                        _collapsibleGroup.attr(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_SELECTED, _collapsibleItems.index(_anchorCollapsibleItem));

                                        $mobileUtil.RenderRefresh(_collapsibleGroup, true);

                                        _embeddedTarget = _anchor;  //set the most recent embedded target as the anchor location
                                    }
                                }

                                if (_embeddedTarget != null) {
                                    _scrollPosition.Top = _embeddedTarget.offset().top;
                                }
                            }

                            break;  //end: collapsible_group

                        case "anchor":

                            if (_navParam != "") {
                                var _anchor = _target.find("#" + _navParam);

                                if (_anchor.length == 1) {
                                    _scrollPosition.Top = _anchor.offset().top;
                                }
                            }

                            break;  //end: anchor

                        default:

                            _scrollPosition.Top = (_offset ? _offset.top : 0);
                            _scrollPosition.Left = 0;
                            break;
                    }

                    var _isContainerScrollable = _instance.DOM.IsPluginContainerScrollable({ "Container": _pluginContainer });

                    if (_isContainerScrollable) {
                        _scrollPosition.Top -= $mobileUtil.Header().height();
                        _scrollPosition.Top = Math.max(_scrollPosition.Top, 0);
                    }

                    $mobileUtil.AnimateSmoothScroll(null, null, _scrollPosition, (_isContainerScrollable ? _pluginContainer : null));

                    break;  //end: navigation_link_pres_version
            }

            _callback();

        };  //end: ProcessLinkAction

        _events["GetEditorPlaceholderTokenValue"] = function (options) {
            var _ret = undefined;

            options = util_extend({ "Element": null, "TokenName": null, "ViewModeSimple": false }, options);

            var _tokenName = util_forceString(options["TokenName"]);
            var _viewModeSimple = util_forceBool(options["ViewModeSimple"], false);

            var _tokenLookupItem = _instance.Metadata.GetDataVariable("m_placeholderTokenLookupItem");

            if (_tokenLookupItem) {
                var _data = (_tokenLookupItem["Data"] ? _tokenLookupItem["Data"] : null);
                var _lookup = (_data ? _data["Lookup"] : null);

                _lookup = (_lookup || {});

                var _item = _lookup[_tokenName];

                if (_item) {
                    var _hasEditTools = false;

                    if (_item[enColExternalTokenProperty.TokenTypeID] == enCEExternalTokenType.Chart) {
                        var _element = $(options["Element"]);
                        var _isEditable = (util_forceInt(_element.attr(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_IS_EDITABLE), enCETriState.None) == enCETriState.Yes);

                        _element.attr("data-cattr-editor-placeholder-token-hide-edit-button", _isEditable ? enCETriState.Yes : enCETriState.None);

                        _hasEditTools = _isEditable;
                    }

                    _ret = _instance.Utils.ConvertExternalToken(_item, { "Format": "HTML", "SearchTokenData": (_data ? _data["List"] : null), "ViewModeSimple": _viewModeSimple,
                        "HasEditTools": _hasEditTools
                    });
                }
            }

            return _ret;
        };  //end: GetEditorPlaceholderTokenValue

        _events["GetChartInstance"] = function (options) {
            var _ret = null;

            options = util_extend({ "Element": null, "ChartContainer": null, "ChartID": null, "MaxWidth": 0, "MaxHeight": 0 }, options);

            var _parent = $(options["Element"]);
            var _chartContainer = $(options["ChartContainer"]);
            var _chartManager = _instance.Managers.ChartManager;

            options["PluginInstance"] = _instance;
            options["ChartManager"] = _chartManager;

            _ret = _chartManager.Utils.GetTokenChartOption(_instance, options["ChartID"], options);
            _ret = _chartManager.Events.ConfigureChartInstance(_ret, options);

            if (_ret) {

                var _chartRenderOpts = util_extend({}, _ret["cRenderOptions"]);

                //disable the chart inline title and render an element based heading title, if applicable
                if ((_parent.is("[" + util_renderAttribute("pluginDossier_chart") + "]") || _parent.hasClass("CDossierChartContainer"))
                    && _chartContainer.hasClass("CDossierChartContent")) {

                    var _ctxParent = (_parent.hasClass("CDossierChartContainer") ? _parent : _parent.children(".CDossierChartContainer"));
                    var _chartTitleElement = _ctxParent.children(".CDossierChartTitle");
                    var _isExport = (util_forceInt(_parent.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_CHART_IS_EXPORT), enCETriState.None) == enCETriState.Yes);

                    if (_chartTitleElement.length == 1) {

                        var _chartTitle = "";
                        var _title = util_extend({ "text": null }, _ret["title"]);

                        _chartTitle = util_forceString(_title["text"], _chartTitle);

                        if (_chartTitle == "") {
                            _chartTitle = util_forceString(_title["cText"]);
                        }

                        _title["cText"] = _title["text"];

                        _title.text = null;

                        _chartTitle = (_title["useHTML"] ? _chartTitle : util_htmlEncode(_chartTitle));

                        if (_isExport) {

                            var _hasPlainText = false;

                            if (_title["cTextStr"]) {
                                _chartTitle = util_forceString(_title["cTextStr"]);
                                _hasPlainText = true;
                            }

                            if (_chartTitle != "") {
                                _title.text = (!_hasPlainText && _title["useHTML"] ? util_htmlDecode(_chartTitle) : _chartTitle);
                                _title["useHTML"] = (_hasPlainText ? false : _title["useHTML"]);
                            }

                            _chartTitleElement.hide();
                        }
                        else {
                            _chartTitleElement.html(_chartTitle);

                            if (_chartTitle.length == 0) {
                                _chartTitleElement.hide();
                            }
                            else if (!_chartTitleElement.is(":visible")) {
                                _chartTitleElement.show();
                            }
                        }

                        _ret["title"] = _title;
                    }

                    var _chartFooterElement = _ctxParent.children(".CDossierChartFooter");

                    if (util_forceString(_chartRenderOpts["FooterHTML"]) == "") {
                        _chartFooterElement.hide();
                    }
                    else if (!_chartFooterElement.is(":visible")) {
                        _chartFooterElement.html(_chartRenderOpts["FooterHTML"]);
                        $mobileUtil.refresh(_chartFooterElement);
                        _chartFooterElement.show();
                    }
                }
            }

            return _ret;

        };  //end: GetChartInstance

        _events["GetElementRendererBindOptions"] = function (options) {
            var _ret = undefined;

            options = util_extend({ "Element": null }, options);

            var _element = $(options["Element"]);

            var _renderAttr = util_forceString(_element.attr(DATA_ATTRIBUTE_RENDER));
            var _ctxDataVariableName = util_forceString(_element.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.CONTEXT_INSTANCE_DATA_VARIABLE_NAME));
            var _val = (_ctxDataVariableName != "" ? _instance.Metadata.GetDataVariable(_ctxDataVariableName) : null);

            switch (_renderAttr) {

                case "pluginDossier_placeholderTokenAdmin":
                    _ret = { "ExtTokenItem": null };

                    _ret.ExtTokenItem = (_val ? _val["EditItem"] : _ret.ExtTokenItem);

                    break;  //end: pluginDossier_placeholderTokenAdmin

            }

            if (_ret) {
                _ret["PluginInstance"] = _instance;
                _ret["ContextVariableName"] = _ctxDataVariableName;
            }

            return _ret;

        };  //end: GetElementRendererBindOptions

        _events["ShowIconLegendPopup"] = function (triggerElement, renderOptions) {
            var _options = {};
            var _html = "";

            renderOptions = util_extend({ "OnPopupCloseCallback": null, "IsFilterSelectionMode": false, "FilterSelectedValue": "" }, renderOptions);

            var _isFilterSelectionMode = (util_forceBool(renderOptions["IsFilterSelectionMode"], false) == true);
            var _filterSelectedValue = util_forceString(renderOptions["FilterSelectedValue"]);

            _html += "<table border='0' cellpadding='3' cellspacing='0' style='width: 100%; margin-bottom: 0.25em;'>";

            for (var _key in PRIVATE_VALUE_MESSAGE_LEGEND_CONFIG) {
                var _config = PRIVATE_VALUE_MESSAGE_LEGEND_CONFIG[_key];

                if (!_isFilterSelectionMode ||
                    (_isFilterSelectionMode && util_forceBool(_config["IsFilterSelectionEnabled"]))
                   ) {

                    //heading
                    _html += "<tr>" +
                             "  <td class='CDossierPopupIconLegendGroupHeading' colspan='2' valign='top'>" +
                             util_htmlEncode(_config[!_isFilterSelectionMode ? "Name" : "FilterName"]) +
                             "  </td>" +
                             "</tr>";

                    //items
                    var _lookup = _config["Lookup"];

                    if (_isFilterSelectionMode) {
                        _lookup = util_extend({}, _config["LookupFilter"]);
                        _lookup = util_extend(_lookup, _config["Lookup"]);
                    }

                    if (!util_isNullOrUndefined(_lookup)) {
                        for (var _badgeKey in _lookup) {
                            var _badgeOption = _lookup[_badgeKey];
                            var _rowAttr = "";

                            if (_isFilterSelectionMode) {
                                _rowAttr = " class='CDossierPopupIconLegendFilterItem" + (_badgeKey == _filterSelectedValue ? " CDossierPopupIconLegendFilterItemSelected" : "") +
                                           "' " + util_htmlAttribute("data-attr-filter-selection-id", _badgeKey);
                            }

                            _html += "<tr" + _rowAttr + ">" +
                                     "  <td class='CDossierPopupIconLegendItemIcon' align='center' valign='middle'>" + plugin_dossier_getBadgeOptionHTML(_badgeOption) + "</td>" +
                                     "  <td class='CDossierPopupIconLegendItemLabel' valign='middle' align='left'>" + util_htmlEncode(_badgeOption["Label"]) + "</td>" +
                                     "</tr>";
                        }
                    }
                }
            }

            _html += "</table>";

            //configure the popup options
            _options["HeaderTitle"] = "";
            _options["IsPositionOnOpen"] = true;
            _options["blankContent"] = _html;
            _options["callbackClose"] = function () {

                var _fn = renderOptions["OnPopupCloseCallback"];

                if (_fn) {
                    _fn();
                }

            };

            _options["callbackOpen"] = function () {
                var _container = $mobileUtil.PopupContainer();

                if (_isFilterSelectionMode) {

                    var _btnList = _container.find("[data-attr-filter-selection-id]:not(.CDossierPopupIconLegendFilterItemSelected)");

                    _btnList.unbind("click.selection");
                    _btnList.bind("click.selection", function () {
                        var _btnSelection = $(this);
                        var _val = _btnSelection.attr("data-attr-filter-selection-id");

                        var _fnItemClick = renderOptions["OnPopupFilterItemCallback"];

                        if (util_isFunction(_fnItemClick)) {
                            _fnItemClick(_val);
                        }
                    });
                }
            };

            $mobileUtil.PopupOpen(_options);

        };  //end: ShowIconLegendPopup

        _events["ShowPlaceholderTokenPopup"] = function (triggerElement, renderOptions) {
            var _options = {};
            var _html = "";

            renderOptions = util_extend({ "OnPopupCloseCallback": null, "ExtTokenName": "", "PluginInstance": null, "IsAddNew": false,
                "BreadcrumbTokenID": null, "BreadcrumbTriggerElement": null, "EditID": enCE.None
            }, renderOptions);

            var _isAddNew = util_forceBool(renderOptions["IsAddNew"], false);
            var _editID = util_forceInt(renderOptions["EditID"], enCE.None);
            var _tokenName = util_forceString(renderOptions["ExtTokenName"]);
            var _element = $(triggerElement);

            var _breadcrumbTokenID = util_forceInt(renderOptions["BreadcrumbTokenID"], enCE.None);
            var _breadcrumbRenderOptions = {};

            if (_breadcrumbTokenID != enCE.None) {
                var _breadcrumbTriggerElement = $(renderOptions["BreadcrumbTriggerElement"]);

                _breadcrumbRenderOptions["FilterTokenTypeID"] = util_forceInt(_breadcrumbTriggerElement.attr("data-attr-breadcrumb-edit-placeholder-restrict-token-type-id"),
                                                                              enCE.None);

            }

            if (_tokenName == "") {
                var _parent = _element.closest("[" + util_renderAttribute("editor_placeholder_token") + "]");

                _tokenName = util_forceString(_parent.children("[" + DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_NAME + "]")
                                                     .attr(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_NAME)
                                             );
            }

            if (_isAddNew) {
                _tokenName = "";
            }

            _html += "<table id='tblExtTokenAdmin' class='TableStandard' border='0' cellpadding='3' cellspacing='0' " + util_renderAttribute("table") +
                     " style='width: 100%; margin-bottom: 0.25em;'>" +
                     "  <td align='center' valign='top'>" + util_htmlEncode("Loading...please wait") + "</td>" +
                     "</table>" +
                     "<div id='divExtTokenAdminTools' style='text-align: right; padding: 0.5em;'>" +
                     "  <a data-attr-admin-popup-btn='cancel' data-role='button' data-corners='false' data-inline='true' data-mini='true' style='margin-right: 0.5em;'>" +
                     util_htmlEncode("Cancel") + "</a>" +
                     "  <a data-attr-admin-popup-btn='save' data-role='button' data-corners='false' data-inline='true' data-mini='true'>" + util_htmlEncode("Save") + "</a>" +
                     "</div>";

            //configure the popup options
            _options["HeaderTitle"] = "Edit Placeholder Value";
            _options["IsPositionOnOpen"] = true;
            _options["blankContent"] = _html;
            _options["callbackClose"] = function () {

                var _fn = renderOptions["OnPopupCloseCallback"];
                var _instance = null;
                var _editInstance = null;

                if (renderOptions["PluginInstance"]) {
                    _instance = renderOptions.PluginInstance;
                    _editInstance = _instance.Metadata.GetDataVariable("_ExtTokenAdminEditInstance");

                    //clear the edit instance for the ext token
                    _instance.Metadata.SetDataVariable("_ExtTokenAdminEditInstance", null, true);
                    _instance.Metadata.SetDataVariable("_ExtTokenAdminEditInstance" + "_fieldCacheLookup", null, true);
                }

                if (_fn) {
                    _fn();
                }
                else if (_instance) {

                    if (_editInstance && _editInstance["IsRefresh"] == true) {

                        //must ensure when refreshing the section it forces the cache to be disabled (to retrieve latest values)
                        _instance.Events.RefreshSection({ "ChildElement": triggerElement, "DisableCache": true });
                    }
                }
            };

            _options["callbackOpen"] = function () {
                var _container = $mobileUtil.PopupContainer();
                var _tblExtTokenAdmin = _container.find("#tblExtTokenAdmin");
                var _instance = renderOptions["PluginInstance"];
                var _hasInstance = (util_isNullOrUndefined(_instance) == false);

                var _fnInvalidItem = function () {
                    _tblExtTokenAdmin.html("<tr>" +
                                           "   <td>" + util_htmlEncode(MSG_CONFIG.ItemNotFound) + "</td>" +
                                           "</tr>");
                };

                var _list = _container.find("[data-attr-admin-popup-btn]");

                _tblExtTokenAdmin.attr("data-attr-breadcrumb-edit-placeholder-token-id", _breadcrumbTokenID);

                _list.unbind("click.token_admin_tool");
                _list.bind("click.token_admin_tool", function () {

                    var _btn = $(this);
                    var _fnClosePopup = function () {

                        var _breadcrumbTokenID = util_forceInt(_tblExtTokenAdmin.attr("data-attr-breadcrumb-edit-placeholder-token-id"), enCE.None);

                        if (_breadcrumbTokenID != enCE.None) {
                            var _pluginInstance = renderOptions["PluginInstance"];

                            $mobileUtil.PopupContentContainer().slideUp(1000, function () {
                                _pluginInstance.Events.ShowPlaceholderTokenPopup(null, { "PluginInstance": _pluginInstance, "EditID": _breadcrumbTokenID,
                                    "OnPopupCloseCallback": renderOptions["OnPopupCloseCallback"]
                                });
                            });
                        }
                        else {
                            $mobileUtil.PopupClose();
                        }
                    };

                    switch (_btn.attr("data-attr-admin-popup-btn")) {

                        case "cancel":
                            _fnClosePopup();
                            break;

                        case "save":
                            var _editInstance = _instance.Metadata.GetDataVariable("_ExtTokenAdminEditInstance");
                            var _editItem = _editInstance["EditItem"];
                            var _properties = _editInstance["Properties"];
                            var _isAddBackStack = (util_forceInt(_btn.attr("data-attr-add-current-edit-to-back-stack"), enCETriState.None) == enCETriState.Yes);

                            //populate the item
                            ClearMessages();

                            var _listPropElement = $mobileUtil.PopupContainer().find("[data-attr-prop-name]");

                            for (var p = 0; p < _properties.length; p++) {
                                var _propItem = _properties[p];
                                var _prop = _propItem.Prop;
                                var _propRow = _listPropElement.filter("[" + util_htmlAttribute("data-attr-prop-name", _prop) + "]");
                                var _val = _editItem[_prop];
                                var _hasInput = false;

                                var _fnErrorMsg = function (isRequired) {
                                    isRequired = util_forceBool(isRequired, true);

                                    if (isRequired) {
                                        var _displayName = util_forceString(_propItem["DisplayText"]);

                                        if (_displayName == "") {
                                            _displayName = _prop;
                                        }

                                        AddUserError(_displayName + " is required.");
                                    }
                                };  //end: _fnErrorMsg

                                switch (_prop) {
                                    case enColExternalTokenProperty.TokenTypeID:
                                        var _ddl = _propRow.find("select");

                                        _hasInput = (_ddl.length == 1);

                                        _val = util_forceInt(_ddl.val(), enCE.None);

                                        if (_val == enCE.None) {
                                            _fnErrorMsg(true);
                                        }

                                        break;

                                    case enColExternalTokenProperty.Name:
                                    case enColExternalTokenProperty.DisplayName:
                                    case enColExternalTokenProperty.Description:
                                        var _tb = _propRow.find("input[type='text']");

                                        _hasInput = (_tb.length == 1);

                                        _val = util_trim(_tb.val());

                                        if (_prop == enColExternalTokenProperty.Name && _hasInput && _val == "") {
                                            _fnErrorMsg(true);
                                        }

                                        break;

                                    case enColExternalTokenProperty.ContentJSON:
                                        var _listTokenPortion = _propRow.find("[data-attr-dossier-token-placeholder-portion-id]");

                                        _hasInput = true;

                                        _val = util_stringify(_instance.Utils.ConvertExternalToken(_editItem, { "Format": "JSON", "ElementList": _listTokenPortion }) || null);

                                        //set the textual version of the value

                                        ////configure the search token data (required for dependent token field types)

                                        var _searchTokenLookup = {};

                                        var _ddlTokenList = _listTokenPortion.filter("select");
                                        var _parentEditView = _propRow.find("[" + PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.CONTEXT_INSTANCE_DATA_VARIABLE_NAME + "]");
                                        var _ctxDataVariableName = util_forceString(_parentEditView.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.CONTEXT_INSTANCE_DATA_VARIABLE_NAME));
                                        var _lookupCacheFieldData = _instance.Metadata.GetDataVariable(_ctxDataVariableName + "_fieldCacheLookup");

                                        _lookupCacheFieldData = (_lookupCacheFieldData || {});

                                        $.each(_ddlTokenList, function (indx) {
                                            var _ddlPortionID = util_forceString($(this).attr("data-attr-dossier-token-placeholder-portion-id"));

                                            _searchTokenLookup[_ddlPortionID] = (_lookupCacheFieldData[_ddlPortionID] || []);
                                        });

                                        ////

                                        _editItem[enColExternalTokenProperty.ContentText] = _instance.Utils.ConvertExternalToken(_editItem, { "Format": "TEXT",
                                            "ElementList": _listTokenPortion, "SearchTokenData": _searchTokenLookup
                                        });

                                        break;  //end: ContentJSON
                                }

                                if (_hasInput) {
                                    _editItem[_prop] = _val;
                                }
                            }

                            if (MessageCount() == 0) {

                                //save the item
                                GlobalService.ExternalTokenSave(_editItem, false, global_extEntitySave(function (saveItem) {

                                    _editInstance["EditItem"] = saveItem;

                                    //set flag to refresh the section on popup close
                                    _editInstance["IsRefresh"] = true;

                                    if (_isAddBackStack) {
                                        var _pluginInstance = renderOptions["PluginInstance"];
                                        var _breadcrumbEditTokenID = util_forceInt(_btn.attr("data-attr-breadcrumb-placeholder-edit-token-id"), enCE.None);

                                        $mobileUtil.PopupContentContainer().slideUp(1000, function () {

                                            _pluginInstance.Events.ShowPlaceholderTokenPopup(null, { "IsAddNew": (_breadcrumbEditTokenID == enCE.None),
                                                "PluginInstance": _pluginInstance,
                                                "BreadcrumbTokenID": saveItem[enColExternalTokenProperty.TokenID], "BreadcrumbTriggerElement": _btn,
                                                "EditID": _breadcrumbEditTokenID,
                                                "OnPopupCloseCallback": renderOptions["OnPopupCloseCallback"]
                                            });
                                        });
                                    }
                                    else {
                                        _fnClosePopup();
                                    }

                                }));
                            }

                            break;  //end: save
                    }

                });

                if (!_hasInstance) {
                    _list.filter("[data-attr-admin-popup-btn='save']").hide();
                }

                if (_tokenName == "" && !_isAddNew && _editID == enCE.None) {
                    _fnInvalidItem();
                }
                else {

                    var _fnBindTokenEdit = function (extTokenItem, extTokenTypeList) {

                        var _isSystemAdmin = (_hasInstance ? _instance.Metadata.IsUserSystemAdmin() : false);

                        var _arrProperties = [];
                        var _extTokenItem = (extTokenItem || {});
                        var _filteredTokenTypeList = null;

                        extTokenTypeList = (extTokenTypeList || []);

                        var _tokenID = util_forceInt(_extTokenItem[enColExternalTokenProperty.TokenID], enCE.None);

                        if (_hasInstance) {
                            _instance.Metadata.SetDataVariable("_ExtTokenAdminEditInstance", { "EditItem": _extTokenItem, "Properties": _arrProperties });
                        }

                        if (_tokenID == enCE.None) {
                            _extTokenItem[enColExternalTokenProperty.Name] = _tokenName;

                            if (!_isSystemAdmin) {
                                _extTokenItem[enColExternalTokenProperty.TokenTypeID] = enCEExternalTokenType.Text;
                            }
                        }

                        if (_breadcrumbTokenID != enCE.None && util_forceInt(_breadcrumbRenderOptions["FilterTokenTypeID"], enCE.None) != enCE.None) {
                            _filteredTokenTypeList = util_arrFilter(extTokenTypeList, enColExternalTokenTypeProperty.TokenTypeID, _breadcrumbRenderOptions["FilterTokenTypeID"], true);

                            if (_filteredTokenTypeList.length == 1 && util_forceInt(_extTokenItem[enColExternalTokenTypeProperty.TokenTypeID], enCE.None) == enCE.None) {
                                var _tempTokenType = _filteredTokenTypeList[0];

                                _extTokenItem[enColExternalTokenTypeProperty.TokenTypeID] = _tempTokenType[enColExternalTokenTypeProperty.TokenTypeID];
                            }
                        }

                        var _fnAddProp = function (propColumn, mDisplayText, mIsEditable, restrictSystemAdmin, inputMaxLength) {
                            var _validProp = true;
                            restrictSystemAdmin = util_forceBool(restrictSystemAdmin, false);

                            if (restrictSystemAdmin && !_isSystemAdmin) {
                                _validProp = false;
                            }

                            if (_validProp) {
                                mIsEditable = util_forceBool(mIsEditable, _hasInstance);
                                _arrProperties.push({ "Prop": propColumn, "DisplayText": mDisplayText, "IsEditable": mIsEditable,
                                    "MaxLength": util_forceInt(inputMaxLength, 0)
                                });
                            }
                        };

                        _fnAddProp(enColExternalTokenProperty.TokenID, "ID", false, true);
                        _fnAddProp(enColExternalTokenProperty.TokenTypeID, "Type", true, true);
                        _fnAddProp(enColExternalTokenProperty.Name, "Name", _isAddNew, null, 150);
                        _fnAddProp(enColExternalTokenProperty.DisplayName, "Display Name", _isSystemAdmin, null, 200);
                        _fnAddProp(enColExternalTokenProperty.Description, "Description", _isSystemAdmin, null, 400);
                        _fnAddProp(enColExternalTokenProperty.ContentJSON, "Value");
                        _fnAddProp(enColExternalTokenProperty.DateModified, "Last Modified", false);
                        _fnAddProp(enColExternalTokenProperty.DateAdded, "Added On", false);

                        var _html = "";

                        for (var i = 0; i < _arrProperties.length; i++) {
                            var _item = _arrProperties[i];
                            var _prop = _item.Prop;
                            var _displayText = util_forceString(_item["DisplayText"]);
                            var _isEditable = util_forceBool(_item["IsEditable"], true);
                            var _maxLength = util_forceInt(_item["MaxLength"], 0);
                            var _val = _extTokenItem[_prop];
                            var _overridePropValueHTML = null;

                            if (_displayText == "") {
                                _displayText = _prop;
                            }

                            switch (_prop) {

                                case enColExternalTokenProperty.TokenTypeID:
                                    _overridePropValueHTML = "<div style='width: 55%;'>" +
                                                             "  <select data-corners='false' data-mini='true' />" +
                                                             "</div>";
                                    break;

                                case enColExternalTokenProperty.ContentJSON:
                                    _overridePropValueHTML = "<div " + util_renderAttribute("pluginDossier_placeholderTokenAdmin") + " " +
                                                             util_htmlAttribute(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_TYPE_ID,
                                                                                _extTokenItem[enColExternalTokenProperty.TokenTypeID]) + " " +
                                                             util_htmlAttribute(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_PLACEHOLDER_TOKEN_ADMIN_GET_OPTIONS_FN_CALLBACK,
                                                                                _instance.Metadata.GetInstanceEventReference("GetElementRendererBindOptions")) + " " +
                                                             util_htmlAttribute(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.CONTEXT_INSTANCE_DATA_VARIABLE_NAME,
                                                                                "_ExtTokenAdminEditInstance") +
                                                             " />";

                                    break;  //end: ContentJSON

                                case enColExternalTokenProperty.DateAdded:
                                case enColExternalTokenProperty.DateModified:
                                    _val = util_FormatDateTime(_val, null, true, true);
                                    break;

                                default:
                                    _val = util_forceString(_val);
                                    break;
                            }

                            _html += "<tr " + util_htmlAttribute("data-attr-prop-name", _prop) + ">" +
                                     "  <td class='CDossierAdminPlaceholderTokenHeadingCell' valign='top'>" +
                                     "      <div class='CDossierAdminPlaceholderTokenHeadingLabel'>" + util_htmlEncode(_displayText) + "</div>" +
                                     "  </td>";

                            _html += "  <td class='" + (_isEditable ? "CDossierAdminPlaceholderTokenInput" : "") + "' valign='top'>";

                            if (_isEditable) {
                                if (_overridePropValueHTML != null) {
                                    _html += _overridePropValueHTML;
                                }
                                else {
                                    _html += "<input type='text' " + util_htmlAttribute("value", util_forceString(_val), null, true) +
                                             (_maxLength > 0 ? " " + util_htmlAttribute("maxlength", _maxLength) : "") + "/>";
                                }
                            }
                            else {
                                _html += "<div class='CDossierAdminPlaceholderTokenInputReadOnly'>" + util_htmlEncode(_val) + "</div>";
                            }

                            _html += "  </td>" +
                                     "</tr>";
                        }

                        _tblExtTokenAdmin.html(_html);
                        _tblExtTokenAdmin.addClass("CDossierAdminPlaceholderTable");

                        $mobileUtil.RenderRefresh(_container);

                        var _ddl = _tblExtTokenAdmin.find("[" + util_htmlAttribute("data-attr-prop-name", enColExternalTokenProperty.TokenTypeID) + "] select");
                        var _selectedTokenTypeID = _extTokenItem[enColExternalTokenTypeProperty.TokenTypeID];

                        util_dataBindDDL(_ddl, (_filteredTokenTypeList ? _filteredTokenTypeList : extTokenTypeList),
                                         enColExternalTokenTypeProperty.Name, enColExternalTokenTypeProperty.TokenTypeID,
                                         _selectedTokenTypeID);

                        if (_filteredTokenTypeList && _filteredTokenTypeList.length == 1 &&
                            (_selectedTokenTypeID == (_filteredTokenTypeList[0])[enColExternalTokenTypeProperty.TokenTypeID])) {
                            _ddl.selectmenu("disable");
                        }
                        else {
                            _ddl.selectmenu("enable");
                        }

                        _ddl.unbind("change.token_admin_type");
                        _ddl.bind("change.token_admin_type", function () {
                            var _ddl = $(this);

                            _extTokenItem[enColExternalTokenProperty.TokenTypeID] = util_forceInt(_ddl.val(), enCE.None);
                            _extTokenItem[enColExternalTokenProperty.ContentJSON] = "";
                            _extTokenItem[enColExternalTokenProperty.ContentText] = "";

                            var _tokenAdminContainer = _tblExtTokenAdmin.find("[" + util_htmlAttribute("data-attr-prop-name", enColExternalTokenProperty.ContentJSON) + "] " +
                                                                              "[" + util_renderAttribute("pluginDossier_placeholderTokenAdmin") + "]");

                            _tokenAdminContainer.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_TYPE_ID, _extTokenItem[enColExternalTokenProperty.TokenTypeID]);

                            $mobileUtil.RenderRefresh(_tokenAdminContainer, true);
                        });

                        _tblExtTokenAdmin.attr("data-attr-edit-placeholder-token-id", util_forceInt(_extTokenItem[enColExternalTokenProperty.TokenID], enCE.None));

                    };  //end: _fnBindTokenEdit

                    var _fnGetExtTokenItem = function (extTokenTypeList) {

                        if (_isAddNew) {
                            _fnBindTokenEdit({}, extTokenTypeList);
                        }
                        else if (_editID != enCE.None) {

                            GlobalService.ExternalTokenGetByPrimaryKey(_editID, false, ext_requestSuccess(function (data) {
                                _fnBindTokenEdit(data || {}, extTokenTypeList);
                            }));
                        }
                        else {

                            global_extTokenList({ "TokenTypeID": enCE.None, "Name": _tokenName, "SortColumn": enColExternalToken.Default,
                                "SortASC": true, "PageNum": 1, "PageSize": 1
                            }, function (data) {
                                var _extTokenItem = (data.List ? data.List[0] : null);

                                _extTokenItem = (_extTokenItem || {});

                                _fnBindTokenEdit(_extTokenItem, extTokenTypeList);

                            });    //end: global_extTokenList
                        }

                    };  //end: _fnGetExtTokenItem

                    GlobalService.ExternalTokenTypeGetByForeignKey(enColExternalTokenType.Name, true, enCEPaging.NoPaging, enCEPaging.NoPaging,
                                                                   ext_requestSuccess(function (extTokenTypeData) {

                                                                       _fnGetExtTokenItem(extTokenTypeData.List);

                                                                   }));    //end: ExternalTokenTypeGetByForeignKey

                }
            };

            $mobileUtil.PopupOpen(_options);

        };  //end: ShowPlaceholderTokenPopup

        _events["ShowPopupResourceViewer"] = function (triggerElement, renderOptions) {
            renderOptions = util_extend({ "OnPopupCloseCallback": null, "PluginInstance": null }, renderOptions);

            var _element = $(triggerElement);

            var _options = {};
            var _html = "";

            var _url = _element.attr("data-attr-inline-popup-href");
            var _window = $(window);
            var _width = (_window.width() * 0.85) + "px";
            var _height = (_window.height() * 0.8) + "px";

            _url = util_appendQS(_url, "IsInline", enCETriState.Yes);

            var _arrImageExt = [".jpg", ".png"];
            var _isImage = false;

            for (var i = 0; i < _arrImageExt.length; i++) {
                var _ext = _arrImageExt[i];

                if (_url.indexOf(_ext + "?") >= 0) {
                    _isImage = true;
                    break;
                }
            }

            if (!_isImage) {
                _html += "<iframe src='" + _url + "' style='width: " + _width + "; height: " + _height + ";' frameborder='0'></iframe>";
            }
            else {
                var _height = $(window).height() * 0.75;

                _html += "<div style='text-align: center;'>" +
                         "  <a class='CDossierPopupImageDownloadLink' data-role='none' target='_blank' data-role='external' " +
                         util_htmlAttribute("href", util_constructURL(["IsInline"], _url)) + ">" +
                         util_htmlEncode("[Download]") + "</a>" +
                         "</div>" +
                         "<div style='text-align: center; padding: 0.25em; overflow: auto; max-height: " + util_round(_height, 2) + "px; '>" +
                         "  <img " + util_htmlAttribute("src", _url) + " />" +
                         "</div>";
            }

            var _headerTitle = "";

            if (!_isImage && util_forceInt(_element.attr("data-attr-no-title-popup"), enCETriState.None) != enCETriState.Yes) {
                _headerTitle = "Supporting Reference";
            }

            //configure the popup options
            _options["HeaderTitle"] = _headerTitle;
            _options["IsPositionTopCenter"] = true;
            _options["blankContent"] = _html;
            _options["width"] = _width;

            $mobileUtil.PopupOpen(_options);

        };  //end: ShowPopupResourceViewer

        _events["PopulateInstanceData"] = function (options, callback) {
            var _callback = function () {
                if (callback) {
                    callback();
                }
            };

            options = util_extend({ "DisableCache": false }, options);

            var _disableCache = util_forceBool(options["DisableCache"], false);

            var _result = _instance.Metadata.GetDataVariable("m_placeholderTokenLookupItem");

            if (util_isNullOrUndefined(_result)) {
                _result = _instance.Managers.CacheManager.NewInstanceTimestampData();
                _instance.Metadata.SetDataVariable("m_placeholderTokenLookupItem", _result);
            }

            if (_disableCache || !_result.IsValid()) {

                global_extTokenList({ "SortColumn": enColExternalToken.DisplayName, "SortASC": true }, function (tokenData) {
                    var _list = (tokenData.List || []);
                    var _lookup = {};

                    for (var i = 0; i < _list.length; i++) {
                        var _extToken = _list[i];
                        var _name = _extToken[enColExternalTokenProperty.Name];

                        _lookup[_name] = _extToken;
                    }

                    _result.SetData({ "Lookup": _lookup, "List": _list });
                    _callback();
                });
            }
            else {
                _callback();
            }

        };  //end: PopulateInstanceData

        _events["Init"] = function (options, callback) {

            options = util_extend({ "InstanceID": "", "Container": null, "PresentationVersionID": enCE.None, "DefaultSectionID": enCE.None,
                "IsContainerScrollable": false, "ForceAdminViewMode": false
            }, options);

            _instance.ID = util_trim(options["InstanceID"]);

            if (_instance.ID == "" || !util_isDefined(_instance.ID)) {
                util_logError("PLUGIN Dossier :: Init - instance variable name is required and must be a valid defined variable.");
            }

            var _container = $(options["Container"]);

            var _callback = function () {

                _instance.Events.BindEventHandlers({ "Container": _container });

                if (callback) {
                    callback();
                }
            };

            var _html = _instance.Templates.SubsectionNavigation + _instance.Templates.SubsectionContent;

            _container.html(util_forceString(_html));
            _container.addClass("CDossierPluginContainer");

            _container.attr(_instance.Attributes.ATTRIBUTE_IS_CONTAINER_SCROLLABLE, (util_forceBool(options["IsContainerScrollable"], false) ? enCETriState.Yes : enCETriState.No));

            var _isModuleAdminListView = module_isCurrentView(enCEModule.PluginDossier, null, enCEModuleViewType.AdminList);

            if (!_isModuleAdminListView) {
                _isModuleAdminListView = util_forceBool(options["ForceAdminViewMode"], false);
            }

            if (!_isModuleAdminListView) {
                global_extPresentationVersionList({ "SortColumn": enColExternalPresentationVersion.DisplayOrder, "IsPresentationActive": enCETriState.Yes }, function (data) {

                    var m_presentationVersionList = (data.List || []);

                    _instance.Metadata.SetDataVariable("m_presentationVersionList", m_presentationVersionList);
                    _instance.Events.LoadPresentationVersion({ "Container": _container, "VersionID": options["PresentationVersionID"],
                        "DefaultSectionID": options["DefaultSectionID"]
                    }, _callback);
                });
            }
            else {
                _callback();
            }

        };  //end: Init

        this["Events"] = _events;

        if (util_isFunction("plugin_dossier_privateConfigureInstance")) {
            plugin_dossier_privateConfigureInstance({ "Instance": this });
        }

    };
//end: CPluginDossier

    var CPluginDossierChartManager = function () {

        var CHART_DEFAULT_AXIS_GRID_LINE_COLOR = "#F0F0F0";
        var CHART_DEFAULT_AXIS_GRID_LINE_WIDTH = 1;

        var _instance = this;

        var _utils = {};

        _utils["ChartOptionsDefault"] = function (options) {
            options = util_extend({ "Element": null }, options);

            var _element = $(options["Element"]);

            var _ret = {
                cExportOptions: {
                    "IsExport": false,
                    "ExportID": null
                },
                cRenderOptions: {
                    "IsReverseSeries": false,
                    "FooterHTML": ""
                },
                yAxis: {
                    labels: {
                    },
                    title: {
                        text: null
                    }
                },
                xAxis: {
                    labels: {
                    },
                    title: {
                        text: null
                    }
                },
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    events: {
                        load: function () {

                            var _exportOptions = (this.options && this.options["cExportOptions"] ? this.options.cExportOptions : null);

                            if (_exportOptions != null) {
                                var _isExport = util_forceBool(_exportOptions["IsExport"], false);
                                var _chartID = util_forceString(_exportOptions["ExportID"], "");

                                if (_isExport && _chartID != "") {

                                    var _chartSVG = null;
                                    var _pluginInstance = null;

                                    try {
                                        _chartSVG = util_chartGetSVG(this.container, this);
                                        _pluginInstance = eval($mobileUtil.GetClosestAttributeValue(this.container, DATA_ATTR_PLUGIN_INSTANCE));

                                        if (_pluginInstance == null) {
                                            _pluginInstance = eval($mobileUtil.GetClosestAttributeValue(this.container, DATA_ATTR_PLUGIN_INSTANCE_REFERENCE));
                                        }
                                    }
                                    catch (ex) {
                                        util_logError("PLUGIN Dossier :: ChartOptionsDefault - chart load | ERROR: " + ex);
                                    }

                                    if (_pluginInstance) {
                                        _pluginInstance.Managers.ChartManager.Events._OnExportChartLoad({
                                            "ChartID": _chartID, "ChartSVG": _chartSVG, "ChartInstance": this, "Element": this.container, "PluginInstance": _pluginInstance
                                        });
                                    }
                                }
                            }
                        }
                    },
                    width: 600,
                    height: 400
                },
                title: {
                    text: null
                },
                tooltip: {
                },
                plotOptions: {

                },
                credits: {
                    enabled: false
                },
                legend: {

                },
                series: {

                },
                exporting: {
                    enabled: false
                }
            };

            var _parent = _element;
            var _selector = "[" + util_renderAttribute("pluginDossier_chart") + "]";

            if (!_parent.is(_selector)) {
                _parent = _element.closest(_selector);
            }

            _ret.cExportOptions.IsExport = (util_forceInt(_parent.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_CHART_IS_EXPORT), enCETriState.None) == enCETriState.Yes);

            if (_ret.cExportOptions.IsExport) {
                var _arrSearchAttrs = ["id", PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_CHART_ID];

                for (var a = 0; a < _arrSearchAttrs.length; a++) {
                    var _attrValue = util_forceString(_parent.attr(_arrSearchAttrs[a]));

                    if (_attrValue != "") {
                        _ret.cExportOptions.ExportID = _attrValue;
                        break;
                    }
                }
            }

            return _ret;

        };  //end: ChartOptionsDefault

        _utils["ChartOptionsDefaultBar"] = function (options) {

            options = util_extend({ "Element": null, "IsStacked": false }, options);

            var _element = $(options["Element"]);

            var _isStacked = util_forceBool(options["IsStacked"], false);

            var _ret = _instance.Utils.ChartOptionsDefault({ "Element": obj });

            var _item = null;

            _item = _ret["chart"];
            _item["type"] = "bar";

            //x-axis
            var _xAxis = _ret["xAxis"];

            if (util_isNullOrUndefined(_xAxis)) {
                _xAxis = {};
                _ret["xAxis"] = _xAxis;
            }

            _xAxis["categories"] = [];

            _xAxis["title"] = { text: null };

            _xAxis["lineColor"] = '#CCCCCC';
            _xAxis["lineWidth"] = 2;

            //y-axis
            var _yAxis = _ret["yAxis"];

            if (util_isNullOrUndefined(_yAxis)) {
                _yAxis = {};
                _ret["yAxis"] = _yAxis;
            }

            _yAxis["title"] = { text: null };

            _yAxis["lineColor"] = '#CCCCCC';
            _yAxis["lineWidth"] = 1;

            //plot options
            if (_isStacked) {
                _item = _ret["plotOptions"];

                if (util_isNullOrUndefined(_item["series"])) {
                    _item["series"] = {};
                }

                _item = _ret.plotOptions["series"];
                _item["stacking"] = "normal";
            }

            return _ret;

        };  //end: ChartOptionsDefaultBar

        _utils["ChartOptionsDefaultColumn"] = function (options) {

            options = util_extend({ "Element": null, "IsStacked": false }, options);

            var _element = $(options["Element"]);

            _isStacked = util_forceBool(options["IsStacked"], false);

            var _ret = _instance.Utils.ChartOptionsDefault({ "Element": _element });

            var _item = null;

            if (util_isNullOrUndefined(options)) {
                options = {};
            }

            _item = _ret["chart"];
            _item["type"] = "column";

            //x-axis
            var _xAxis = _ret["xAxis"];

            if (util_isNullOrUndefined(_xAxis)) {
                _xAxis = {};
                _ret["xAxis"] = _xAxis;
            }

            _xAxis["categories"] = [];

            _xAxis["title"] = { text: null };

            _xAxis["lineColor"] = '#CCCCCC';
            _xAxis["lineWidth"] = 2;

            //y-axis
            var _yAxis = _ret["yAxis"];

            if (util_isNullOrUndefined(_yAxis)) {
                _yAxis = {};
                _ret["yAxis"] = _yAxis;
            }

            _yAxis["title"] = { text: null };

            _yAxis["lineColor"] = '#CCCCCC';
            _yAxis["lineWidth"] = 1;

            _yAxis["gridLineColor"] = CHART_DEFAULT_AXIS_GRID_LINE_COLOR;
            _yAxis["gridLineWidth"] = CHART_DEFAULT_AXIS_GRID_LINE_WIDTH;

            _yAxis["plotLines"] = [{ "value": 0, "color": "#666666", "dashStyle": "Solid", "width": 2}];

            if (util_forceString(options["y-axis-label-format"]) != "") {
                var _labels = null;

                if (util_isNullOrUndefined(_yAxis["labels"])) {
                    _labels = {};
                    _yAxis["labels"] = _labels;
                }
                else {
                    _labels = _yAxis["labels"];
                }

                _labels["format"] = options["y-axis-label-format"];
            }

            //plot options
            if (_isStacked) {
                _item = _ret["plotOptions"];

                if (util_isNullOrUndefined(_item["column"])) {
                    _item["column"] = {};
                }

                _item = _ret.plotOptions["column"];
                _item["stacking"] = "normal";
            }

            return _ret;

        };  //end: ChartOptionsDefaultColumn

        _utils["GetTokenDataValue"] = function (options) {
            var _ret = null;

            options = util_extend({ "PluginInstance": null, "Name": null, "DefaultValue": null, "IsNumeric": false }, options);

            var _pluginInstance = options["PluginInstance"];
            var _defaultValue = options["DefaultValue"];
            var _tokenName = util_forceString(options["Name"]);
            var _valid = false;

            if (_tokenName != "") {
                var _tokenLookupItem = _pluginInstance.Metadata.GetDataVariable("m_placeholderTokenLookupItem");
                var _item = null;

                if (_tokenLookupItem) {
                    var _data = (_tokenLookupItem["Data"] ? _tokenLookupItem["Data"] : null);
                    var _lookup = (_data ? _data["Lookup"] : null);

                    _lookup = (_lookup || {});

                    _item = _lookup[_tokenName];
                }

                if (_item && (_item[enColExternalTokenProperty.TokenTypeID] == enCEExternalTokenType.DataPoint ||
                    _item[enColExternalTokenProperty.TokenTypeID] == enCEExternalTokenType.Chart)) {
                    var _val = null;
                    var _propName = null;

                    switch (_item[enColExternalTokenProperty.TokenTypeID]) {
                        case enCEExternalTokenType.DataPoint:
                            _propName = "point_value";
                            break;

                        case enCEExternalTokenType.Chart:
                            _propName = "config_value";
                            break;
                    }

                    try {
                        var _v = null;

                        _val = util_parse(_item[enColExternalTokenProperty.ContentJSON]);
                        _val = _val.d;

                        _v = _val[_propName];
                        _ret = _v["Value"];

                        _valid = true;
                    } catch (e) {
                        util_logError(e);
                    }
                }
            }

            if (!_valid) {
                _ret = _defaultValue;
                util_log("GetTokenDataValue :: invalid value - " + _tokenName);
            }
            else {
                if (util_forceBool(options["IsNumeric"], false)) {
                    _ret = util_forceFloat(_ret, _defaultValue);
                }
                else {
                    _ret = util_forceString(_ret, _defaultValue);
                }
            }

            return _ret;

        };  //end: GetTokenDataValue

        _utils["GetTokenChartOption"] = function (pluginInstance, tokenName, options) {
            var _ret = null;
            var _fnLogError = function (msg) {
                util_log("GetTokenChartOption :: ERROR: " + msg);
            };

            options = util_extend({ "Element": null, "ChartContainer": null, "ChartID": null, "DefaultTokenValue": "", "MaxWidth": 0, "MaxHeight": 0 }, options);

            var _parent = $(options["Element"]);
            var _chartContainer = $(options["ChartContainer"]);

            var _configDataPoints = chart_utilGetDataPoint(pluginInstance, tokenName, util_forceString(options["DefaultTokenValue"]));
            var _arrLines = util_forceString(_configDataPoints, "").split("\n");

            var DEFAULT_DELIMITER = "|";
            var LINE_TYPE_DELIMITER = ":";
            var CATEGORIES_DELIMITER = DEFAULT_DELIMITER;
            var SERIES_DELIMITER = DEFAULT_DELIMITER;
            var DATA_POINT_ITEM_DELIMITER = ",";
            var DATA_POINT_VALUE_DELIMITER = "=";
            var PROPERTY_CONFIG_ITEM_DELIMITER = "||";
            var PROPERTY_CONFIG_VALUE_DELIMITER = DEFAULT_DELIMITER;
            var KEY_MERGE_PROPERTY_PREFIX = "MERGE_PROPERTY_";

            var _renderConfig = {};

            var _fnConfigurePropMergeStr = function (str) {
                var _arrTemp = util_forceString(str).split(PROPERTY_CONFIG_ITEM_DELIMITER);
                var _retPropList = [];

                for (var i = 0; i < _arrTemp.length; i++) {
                    var _propConfigStr = util_trim(_arrTemp[i]);
                    var _arrConfigValues = _propConfigStr.split(PROPERTY_CONFIG_VALUE_DELIMITER);

                    if (_arrConfigValues.length >= 1) {
                        var _propItem = { "Prop": null, "JSON": null };

                        _propItem.Prop = (_arrConfigValues.length > 1 ? _arrConfigValues[0] : _propItem.Prop);
                        _propItem.JSON = _arrConfigValues[_arrConfigValues.length > 1 ? 1 : 0];

                        _retPropList.push(_propItem);
                    }
                }

                return _retPropList;

            };  //end: _fnConfigurePropMergeStr

            for (var l = 0; l < _arrLines.length; l++) {
                var _line = _arrLines[l];
                var _index = (_line.indexOf("#") == 0 ? -1 : _line.indexOf(LINE_TYPE_DELIMITER)); //exclude comment lines (i.e. starts with "#" character)

                if (_index > 0) {
                    var _name = util_trim(_line.substr(0, _index));
                    var _itemTypeID = _name.toUpperCase();
                    var _v = util_trim(_line.substr(_index + 1));
                    var _arr = null;

                    switch (_itemTypeID) {
                        case "CHART_TYPE":
                            break;

                        case "TITLE":
                        case "TITLE_HTML":
                            break;

                        case "CATEGORIES":
                            _v = _v.split(CATEGORIES_DELIMITER);
                            break;

                        case "SERIES":
                            _arr = _v.split(SERIES_DELIMITER);

                            var _seriesItem = { "name": null, "data": [] };
                            var _fnParseDataPoints = function (str) {
                                var _arrData = [];
                                var _arrValues = str.split(DATA_POINT_ITEM_DELIMITER);
                                var _fnGetChartPointValue = function (val) {
                                    return (val == "" ? null : util_forceFloat(val, 0));
                                };

                                for (var d = 0; d < _arrValues.length; d++) {
                                    var _ptData = _arrValues[d];
                                    var _arrTemp = _ptData.split(DATA_POINT_VALUE_DELIMITER);
                                    var _point = { "y": null };

                                    if (_arrTemp.length >= 3) { //name, point options JSON, (optional)selected yes/no, point y
                                        _point["name"] = _arrTemp[0];
                                        _point.y = _fnGetChartPointValue(_arrTemp[_arrTemp.length - 1]);    //last item is the point y value

                                        //point options JSON
                                        try {
                                            _point["cPointOptions"] = util_parse(_arrTemp[1]);
                                        } catch (e) {
                                            _fnLogError("_fnMergeChartProperty - JSON point options parse failed - '" + _itemTypeID + "' - LINE: [" + _line + "], " +
                                                        "JSON: [" + _arrTemp[1] + "] - " + e);
                                        }

                                        if (_arrTemp.length == 4) {
                                            _point["selected"] = (_arrTemp[2].toUpperCase() == "YES");
                                        }
                                    }
                                    else if (_arrTemp.length == 2) {    //name, point y
                                        _point["name"] = _arrTemp[0];
                                        _point.y = _fnGetChartPointValue(_arrTemp[1]);
                                    }
                                    else if (_arrTemp.length == 1) {    //point y
                                        _point.y = _fnGetChartPointValue(_arrTemp[0]);
                                    }

                                    _arrData.push(_point);
                                }

                                return _arrData;
                            };

                            for (var j = 0; j < _arr.length; j++) {
                                var _configVal = _arr[j];

                                switch (j) {

                                    case _arr.length - 1:   //last item in array is the data points value
                                        _seriesItem.data = _fnParseDataPoints(_configVal);
                                        break;

                                    case 0: //name
                                        _seriesItem.name = _configVal;
                                        break;

                                    case 1: //color
                                        _seriesItem["color"] = _configVal;
                                        break;

                                    case 2: //show in legend (yes/no)
                                        _seriesItem["showInLegend"] = (_configVal.toUpperCase() != "NO");
                                        break;
                                }
                            }

                            if (util_isNullOrUndefined(_renderConfig[_itemTypeID])) {
                                _v = [];
                            }
                            else {
                                _v = _renderConfig[_itemTypeID];
                            }

                            _v.push(_seriesItem);

                            break;  //end: SERIES

                        case "XAXIS":
                        case "YAXIS":
                        case "PLOTOPTIONS_SERIES":
                            _v = _fnConfigurePropMergeStr(_v);
                            break;

                        case "YAXIS_TITLE":
                        case "XAXIS_TITLE":
                            _v = [{ "Prop": "title", "JSON": util_stringify({ "text": _v })}];
                            break;

                        case "XAXIS_PLOTLINE":
                            var _plotlineItem = { "category": null, "text": null };

                            _arr = _v.split(DEFAULT_DELIMITER);

                            if (_arr.length == 0) {
                                _plotlineItem = null;
                            }

                            for (var p = 0; p < _arr.length; p++) {
                                var _val = _arr[p];

                                switch (p) {

                                    case 0: //category name
                                        if (_val == "%%CURRENT_YEAR%%") {
                                            _val = (new Date()).getFullYear();
                                        }

                                        _plotlineItem.category = _val;
                                        _plotlineItem.text = _val;
                                        break;

                                    case _arr.length - 1:   //override display text
                                        _plotlineItem.text = _val;
                                        break;

                                    case 1: //force specific plotline category index
                                        _plotlineItem["index"] = util_forceFloat(_val, -1);
                                        break;
                                }
                            }

                            if (_plotlineItem) {
                                if (util_isNullOrUndefined(_renderConfig[_itemTypeID])) {
                                    _v = [];
                                }
                                else {
                                    _v = _renderConfig[_itemTypeID];
                                }

                                _v.push(_plotlineItem);
                            }

                            break;

                        case "WIDTH_PCT":
                        case "HEIGHT_PCT":
                            break;

                        case "FOOTER_TEXT":
                            //text to include in the footer (note: will be HTML encoded and supports "\n" for new characters)
                            _v = util_replaceAll(_v, "\\n", "\n", true);
                            break;

                        case "FOOTER_TEXT_STYLE_CLASS":
                            break;

                        //support for overriding the delimiters used                                                                                                       
                        case "DATA_POINT_VALUE_DELIMITER":
                            DATA_POINT_VALUE_DELIMITER = _v;
                            break;

                        case "DATA_POINT_ITEM_DELIMITER":
                            DATA_POINT_ITEM_DELIMITER = _v;
                            break;

                        default:
                            if (_itemTypeID.indexOf("IS_") == 0) {
                                _v = _v.toUpperCase();
                                _v = (_v == "YES");
                            }
                            else if (_itemTypeID.indexOf(KEY_MERGE_PROPERTY_PREFIX) == 0) {
                                var _index = _itemTypeID.indexOf(KEY_MERGE_PROPERTY_PREFIX) + KEY_MERGE_PROPERTY_PREFIX.length;
                                var _propName = _name.substr(_index);
                                var _list = (_renderConfig["MERGE_PROPERTY_LIST"] || []);

                                _list.push({ "RootPropName": _propName, "List": _fnConfigurePropMergeStr(_v) });
                                _renderConfig["MERGE_PROPERTY_LIST"] = _list;
                            }
                            else {
                                console.log(_itemTypeID);
                            }

                            break;
                    }

                    _renderConfig[_itemTypeID] = _v;
                }
            }

            var _chartType = _renderConfig["CHART_TYPE"];
            var _series = (_renderConfig["SERIES"] || []);
            var _categories = (_renderConfig["CATEGORIES"] || []);

            switch (_chartType) {

                case "blank":
                    _ret = _instance.Utils.ChartOptionsDefault({ "Element": _chartContainer });
                    break;

                case "bar":
                case "bar_stack":
                    _ret = _instance.Utils.ChartOptionsDefault({ "Element": _chartContainer });
                    _ret.chart["type"] = "bar";

                    if (_chartType == "bar_stack") {
                        var _barPlotOptions = util_extend({ "series": {} }, _ret.plotOptions);

                        _barPlotOptions.series["stacking"] = "normal";

                        _ret.plotOptions = _barPlotOptions;
                    }

                    break;

                case "line":
                    _ret = _instance.Utils.ChartOptionsDefault({ "Element": _chartContainer });
                    _ret.chart["type"] = "line";
                    break;

                case "column":
                    _ret = _instance.Utils.ChartOptionsDefaultColumn({ "Element": _chartContainer });
                    break;

                case "column_stack":
                    _ret = _instance.Utils.ChartOptionsDefaultColumn({ "Element": _chartContainer, "IsStacked": true });
                    break;

                case "pie":
                    _ret = _instance.Utils.ChartOptionsDefault({ "Element": _chartContainer });
                    _ret.chart["type"] = "pie";
                    break;

                case "areaspline":
                    _ret = _instance.Utils.ChartOptionsDefault({ "Element": _chartContainer });
                    _ret.chart["type"] = "areaspline";
                    break;

                case "bubble":
                    _ret = _instance.Utils.ChartOptionsDefault({ "Element": _chartContainer });
                    _ret.chart["type"] = "bubble";
                    _ret.chart["zoomType"] = "xy";
                    break;

                case "scatter":
                    _ret = _instance.Utils.ChartOptionsDefault({ "Element": _chartContainer });
                    _ret.chart["type"] = "scatter";
                    break;

                default:
                    _fnLogError("Unhandled chart type - " + _chartType);
                    break;
            }

            if (_ret) {

                var _fnMergeChartProperty = function (item, rootPropertyName, typeID, overrideList) {
                    typeID = util_forceString(typeID);

                    var _propList = null;

                    if (typeID != "") {
                        _propList = _renderConfig[typeID];
                    }
                    else {
                        _propList = overrideList;
                    }

                    if (_propList && _propList.length > 0) {
                        var _rootPropVal = (item[rootPropertyName] || {});

                        for (var p = 0; p < _propList.length; p++) {
                            var _propItem = _propList[p];
                            var _propVal = null;
                            var _hasProperty = (util_forceString(_propItem.Prop) != "");

                            if (_hasProperty) {
                                _propVal = (_rootPropVal[_propItem.Prop] || {});
                            }
                            else {
                                _propVal = _rootPropVal;
                            }

                            try {
                                var _d = util_parse(_propItem.JSON);

                                if ($.isPlainObject(_d)) {
                                    _propVal = util_extend(_propVal, _d, null, true);
                                }
                                else {

                                    //JSON value is a non-object (e.g. array, primitive value, etc.) so must set variable value rather than extend
                                    _propVal = _d;
                                }

                            } catch (e) {
                                _fnLogError("_fnMergeChartProperty - JSON parse failed - '" + typeID + "' - PROP: [" + _propItem.Prop + "], JSON: [" + _propItem.JSON + "] - " + e);
                            }

                            if (_hasProperty) {
                                _rootPropVal[_propItem.Prop] = _propVal;
                            }
                            else {
                                _rootPropVal = _propVal;
                            }
                        }

                        item[rootPropertyName] = _rootPropVal;
                    }

                };  //end: _fnMergeChartProperty

                switch (_ret.chart["type"]) {

                    case "bubble":

                        //for bubble type charts, the categories should not be specified
                        _categories = null;

                        //disable the legend
                        if (!_ret["legend"]) {
                            _ret["legend"] = {};
                        }

                        _ret.legend["enabled"] = false;

                        _ret.yAxis["startOnTick"] = false;
                        _ret.yAxis["endOnTick"] = false;
                        break;
                }

                _ret.xAxis["categories"] = _categories;
                _ret["series"] = _series;

                if (_renderConfig["TITLE_HTML"]) {
                    _ret.title.text = _renderConfig["TITLE_HTML"];
                    _ret.title["useHTML"] = true;

                    //store the text version of the title, if available as an extended property
                    if (_renderConfig["TITLE"]) {
                        _ret.title["cTextStr"] = _renderConfig["TITLE"];
                    }
                }
                else if (_renderConfig["TITLE"]) {
                    _ret.title.text = _renderConfig["TITLE"];
                }

                var _plotOptions = util_extend({}, _ret["plotOptions"]);

                _fnMergeChartProperty(_plotOptions, "series", "PLOTOPTIONS_SERIES");
                _ret["plotOptions"] = _plotOptions;

                _fnMergeChartProperty(_ret, "xAxis", "XAXIS");
                _fnMergeChartProperty(_ret, "xAxis", "XAXIS_TITLE");

                _fnMergeChartProperty(_ret, "yAxis", "YAXIS");
                _fnMergeChartProperty(_ret, "yAxis", "YAXIS_TITLE");

                if (util_forceBool(_renderConfig["IS_REVERSE_SERIES"], false)) {
                    _ret.cRenderOptions["IsReverseSeries"] = true;
                }

                //configure the dynamic plot line markers, if applicable
                var _arrPlotlineKeys = ["XAXIS_PLOTLINE"];

                for (var i = 0; i < _arrPlotlineKeys.length; i++) {
                    var _key = _arrPlotlineKeys[i];
                    var _axis = (_ret[_key == "XAXIS_PLOTLINE" ? "xAxis" : "yAxis"]);

                    if (_key == "XAXIS_PLOTLINE" && _renderConfig[_key]) {
                        var _arr = _renderConfig[_key];
                        var _plotLines = (_axis["plotLines"] || []);

                        for (var j = 0; j < _arr.length; j++) {
                            var _plotlineConfig = _arr[j];
                            var _plotLineIndex = -1;
                            var _markerCategory = _plotlineConfig.category;

                            //determine the plotline index based on categories
                            //check if the marker is an existing category
                            _plotLineIndex = util_arrFilterItemIndex(_categories, function (searchItem) {
                                return (searchItem == _markerCategory);
                            });

                            if (_plotLineIndex < 0 && util_isNumeric(_markerCategory)) {
                                var _markerCategoryVal = util_forceFloat(_markerCategory, 0);

                                for (var i = 0; i < _categories.length; i++) {
                                    var _categoryVal = util_forceFloat(_categories[i], 0);

                                    if (_markerCategoryVal < _categoryVal) {

                                        if (i > 0) {
                                            _plotLineIndex = i;
                                        }

                                        break;
                                    }
                                }

                                if (_plotLineIndex > 0) {
                                    var _categoryVal = util_forceFloat(_categories[_plotLineIndex], 0);
                                    var _prevCategoryVal = util_forceFloat(_categories[_plotLineIndex - 1], 0);

                                    if (_prevCategoryVal < _categoryVal) {
                                        var _diff = (_categoryVal - _prevCategoryVal);

                                        _plotLineIndex = (_markerCategoryVal < _categoryVal ? _plotLineIndex - 1 : _plotLineIndex) +
                                                         (_markerCategoryVal - _prevCategoryVal) / (_diff * 1.00);
                                    }
                                    else {
                                        _plotLineIndex = -1;
                                    }
                                }
                            }

                            if (_plotLineIndex >= 0 && _plotLineIndex < _categories.length) {
                                var _plotLine = {
                                    color: '#000000',
                                    width: 2,
                                    value: _plotLineIndex,
                                    label: {
                                        verticalAlign: "top",
                                        text: _plotlineConfig.text,
                                        style: { "color": "#333333", fontWeight: "bold" }
                                    },
                                    zIndex: 5
                                };

                                _plotLines.push(_plotLine);
                            }
                        }

                        _axis["plotLines"] = _plotLines;
                    }

                }   //end: plot line marker configuration

                //configure any custom overrides for properties, if applicable
                var _arrMergeProp = (_renderConfig["MERGE_PROPERTY_LIST"] || []);

                for (var i = 0; i < _arrMergeProp.length; i++) {
                    var _mergePropItem = _arrMergeProp[i];

                    _fnMergeChartProperty(_ret, _mergePropItem.RootPropName, null, _mergePropItem.List);

                }

                var _chartRenderOpts = util_extend({}, _ret["cRenderOptions"]);

                _ret["cRenderOptions"] = _chartRenderOpts;

                if (_series) {

                    //configure dynamic series, if applicable
                    for (var s = 0; s < _series.length; s++) {
                        var _item = _series[s];
                        var _name = _item.name;
                        var _tokenName = util_forceString(_item["cExtTokenName"]);

                        if (_tokenName != "") {
                            var _opts = { "PluginInstance": _instance, "Name": _tokenName, "DefaultValue": _name };

                            _item.name = _chartManager.Utils.GetTokenDataValue(_opts);
                        }

                        var _arrData = _item["data"];

                        if (_arrData && $.isArray(_arrData)) {
                            for (var p = 0; p < _arrData.length; p++) {
                                var _point = _arrData[p];

                                if ($.isPlainObject(_point) && util_forceString(_point["cExtTokenName"]) != "") {
                                    var _y = _point["y"];
                                    var _opts = { "PluginInstance": pluginInstance, "Name": _point["cExtTokenName"], "DefaultValue": _y, "IsNumeric": true };

                                    _point["y"] = _chartManager.Utils.GetTokenDataValue(_opts);
                                }
                            }
                        }
                    }
                }

                //configure predefined axis formatters, if applicable
                var _arrAxis = [{ "v": _ret["xAxis"] }, { "v": _ret["yAxis"], "forceTooltip": true}];

                for (var i = 0; i < _arrAxis.length; i++) {
                    var _axisItem = _arrAxis[i];
                    var _axis = _axisItem.v;

                    if (_axis) {
                        var _formatter = null;
                        var _formatOptions = _axis["cFormatOptions"];

                        if (_formatOptions) {
                            var _labels = util_extend({ "formatter": null }, _axis["labels"]);

                            _formatOptions = util_extend({ "IsNumeric": false, "IsPercentage": false, "IsCurrency": false, "CurrencySymbol": "$", "Precision": 2 }, _formatOptions);

                            if (_formatOptions["IsPercentage"] || _formatOptions["IsCurrency"]) {
                                _formatOptions["IsNumeric"] = true;
                            }

                            _formatOptions["Precision"] = Math.max(0, util_forceInt(_formatOptions["Precision"], 0));

                            var _fnFormatter = function (objInstance, val, isAxisLabel, formatOpts) {

                                if (_formatOptions == null) {
                                    return val;
                                }

                                formatOpts = util_extend({ "PointOptionSuffixProp": "suffix" }, formatOpts);

                                isAxisLabel = util_forceBool(isAxisLabel, false);

                                var _val = val;
                                var _str = "";

                                if (_formatOptions["IsNumeric"] == true) {
                                    if (_val === 0 || (_val != null && _val != "")) {
                                        _str = util_formatNumber(_val, Math.max(0, _formatOptions["Precision"]));

                                        if (_formatOptions["IsPercentage"] == true) {
                                            _str += "%";
                                        }
                                        else if (_formatOptions["IsCurrency"] == true) {
                                            _str = _formatOptions["CurrencySymbol"] + _str;
                                        }
                                    }
                                }
                                else {
                                    _str = _val;
                                }

                                if (!isAxisLabel) {
                                    var _point = (objInstance && objInstance["point"] ? objInstance.point : formatOpts["Point"]);

                                    if (_point && _point["cPointOptions"]) {
                                        var _pointSuffixPropName = util_forceString(formatOpts["PointOptionSuffixProp"]);

                                        if (_pointSuffixPropName == "") {
                                            _pointSuffixPropName = "suffix";
                                        }

                                        var _pointOpts = util_extend({ "suffix": "", "summarySuffix": "" }, _point["cPointOptions"]);

                                        _str += util_forceString(_pointOpts[_pointSuffixPropName]);
                                    }
                                }

                                return _str;

                            };  //end: _fnFormatter

                            _chartRenderOpts["FnValueFormatter"] = _fnFormatter;

                            _labels.formatter = function () {
                                return _fnFormatter(this, this.value, true);
                            };

                            if (_ret["plotOptions"] && _ret.plotOptions["series"]) {
                                var _plotOptDataLabels = util_extend({}, _ret.plotOptions.series["dataLabels"]);

                                _plotOptDataLabels["formatter"] = function () {
                                    return _fnFormatter(this, this.y);
                                };

                                _ret.plotOptions.series["dataLabels"] = _plotOptDataLabels;
                            }

                            _axis["labels"] = _labels;

                            if (util_forceBool(_axisItem["forceTooltip"], false)) {
                                var _tooltip = util_extend({}, _ret["tooltip"]);

                                if (_formatOptions["IsPercentage"]) {
                                    _tooltip["valueSuffix"] = "%";
                                }
                                else if (_formatOptions["IsCurrency"]) {
                                    _tooltip["valuePrefix"] = _formatOptions["CurrencySymbol"];
                                }

                                _ret["tooltip"] = _tooltip;
                            }
                        }

                    }   //end: series configuration

                }

                //check if the series render order should be reversed
                if (util_forceBool(_chartRenderOpts["IsReverseSeries"], false)) {
                    var _temp = [];

                    for (var i = _series.length - 1; i >= 0; i--) {
                        _temp.push(_series[i]);
                    }

                    _ret["series"] = _temp;

                    //reverse the legend display
                    var _legend = util_extend({}, _ret["legend"]);

                    _legend["reversed"] = true;
                    _ret["legend"] = _legend;
                }

                //disable legend item toggles, if applicable
                if (util_forceBool(_renderConfig["IS_DISABLE_LEGEND_ITEM_CLICK"], false)) {
                    var _plotOptSeries = util_extend({}, _ret["plotOptions"]);

                    _ret["plotOptions"] = _plotOptSeries;

                    _plotOptSeries["series"] = util_extend({}, _plotOptSeries["series"]);

                    _plotOptSeries = _plotOptSeries.series;

                    if (!_plotOptSeries["events"]) {
                        _plotOptSeries["events"] = {};
                    }

                    _plotOptSeries.events["legendItemClick"] = function () {
                        return false;
                    };

                    _plotOptions["series"] = _plotOptSeries;
                }

                var _chartLegend = _ret["legend"];

                //if the legend property is available but its toggle state is not provided, must use the series list to determine if it should be enabled/disabled
                if (_chartLegend && util_isNullOrUndefined(_chartLegend["enabled"])) {

                    //NOTE: important in order to resolve export issue where the SVG generates the legend shape, but as it has no items results in an empty circle placeholder
                    //      (usually top-left of rendered image and ideally should have been hidden); by explicitly forcing legend as enabled/disabled is the solution
                    //e.g. <g class="highcharts-legend" >
                    //          <rect rx="5" ry="5" fill="none" x="0.5" y="0.5" width="7" height="7" stroke="#909090" stroke-width="1" visibility="hidden"></rect>
                    //     ...
                    //The visibility="hidden" does not render properly with the HighChart version.
                    var _series = _ret["series"];
                    var _legendEnabled = false;

                    if (_series && _series.length > 0) {

                        for (var s = 0; s < _series.length && !_legendEnabled; s++) {
                            var _seriesItem = _series[s];

                            //legend is only enabled if there is at least one series available and flagged to be shown in legend (default value: true)
                            _legendEnabled = util_forceBool(_seriesItem["showInLegend"], true);
                        }
                    }
                    
                    _chartLegend["enabled"] = _legendEnabled;
                }

                //configure the footer HTML content
                var _footerHTML = "";

                var _footerText = util_forceString(_renderConfig["FOOTER_TEXT"]);

                if (_footerText != "") {
                    var _footerCssClass = util_forceString(_renderConfig["FOOTER_TEXT_STYLE_CLASS"]);

                    _footerHTML += "<div" + (_footerCssClass != "" ? " " + util_htmlAttribute("class", _footerCssClass) : "") + ">" +
                                   util_htmlEncode(_footerText, true) +
                                   "</div>";
                }

                var _includeTableSummary = util_forceBool(_renderConfig["IS_INCLUDE_TABLE_SUMMARY"], false);

                //categories were provided indirectly using merge properties and must retrieve them from xAxis directly, if applicable
                if (_includeTableSummary && _categories.length == 0) {
                    var _xAxisCategories = (_ret["xAxis"] ? _ret.xAxis["categories"] : null);

                    if (_xAxisCategories && _xAxisCategories.length > 0) {
                        for (var i = 0; i < _xAxisCategories.length; i++) {
                            var _category = _xAxisCategories[i];

                            if ($.isPlainObject(_category)) {

                                //check for support of grouped categories (JS add-on for HighCharts)
                                if (_category["categories"]) {
                                    for (var c = 0; c < _category.categories.length; c++) {
                                        _categories.push(_category.categories[c]);
                                    }
                                }
                            }
                            else {
                                _categories.push(_category);
                            }
                        }
                    }
                }

                if (_includeTableSummary && _categories.length > 0) {

                    var _tableRowOverrideAttr = util_htmlAttribute(DATA_ATTRIBUTE_RENDER_OVERRIDE, "true");

                    _footerHTML += "<table class='CDossierChartResultTableSummary' border='0' cellpadding='3' cellspacing='0'>";

                    //header for the chart categories
                    _footerHTML += "<tr class='TableChartResultHeaderRow' " + _tableRowOverrideAttr + ">";

                    _footerHTML += "<td colspan='2'>&nbsp;</td>";

                    for (var c = 0; c < _categories.length; c++) {
                        var _categoryName = _categories[c];

                        _footerHTML += "<td>" + util_htmlEncode(_categoryName) + "</td>";
                    }

                    _footerHTML += "</tr>";

                    var _fnFormatter = (_chartRenderOpts["FnValueFormatter"] || (function (objInstance, v, isAxisLabel, formatOpts) { return v; }));

                    for (var s = 0; s < _series.length; s++) {
                        var _seriesItem = _series[s];

                        _footerHTML += "<tr " + util_htmlAttribute("class", s % 2 == 0 ? "TableChartResultRowOdd" : "TableChartResultRowEven") + " " + _tableRowOverrideAttr + ">";

                        //series color
                        _footerHTML += "<td class='CDossierChartResultLegendCell' valign='top'>" +
                                       "   <div class='CDossierChartResultLegendItem InlineBlock' " +
                                       util_htmlAttribute("style", "background-color:" + util_forceString(_seriesItem["color"])) + " />" +
                                       "</td>";

                        //series name
                        _footerHTML += "<td valign='middle'>" +
                                       util_htmlEncode(_seriesItem["name"]) +
                                       "</td>";

                        //data point cells
                        var _data = (_seriesItem["data"] || []);

                        for (var d = 0; d < _data.length; d++) {
                            var _val = _data[d];

                            if (_val == null) {
                                _val = " ";
                            }
                            else if ($.isPlainObject(_val)) {
                                _val = _fnFormatter(null, _val["y"], false, { "PointOptionSuffixProp": "summarySuffix", "Point": _val });
                            }

                            _footerHTML += "<td class='CDossierChartResultValueLabel'>" + util_htmlEncode(_val) + "</td>";
                        }

                        _footerHTML += "</tr>";
                    }

                    _footerHTML += "</table>";
                }

                _ret.cRenderOptions["FooterHTML"] = _footerHTML;

                //configure the chart dimensions, if applicable
                var _widthPct = util_forceFloat(_renderConfig["WIDTH_PCT"], 0);

                if (_widthPct > 0) {
                    var _maxWidth = util_forceFloat(options["MaxWidth"], 0);

                    _ret.chart.width = Math.max(_ret.chart.width, _maxWidth * _widthPct);
                }

                var _heightPct = util_forceFloat(_renderConfig["HEIGHT_PCT"], 0);

                if (_heightPct > 0) {
                    var _maxHeight = util_forceFloat(options["MaxHeight"], 0);

                    _ret.chart.height = Math.max(_ret.chart.height, _maxHeight * _heightPct);
                }

            }   //end: valid _ret chart configuration

            //console.log(_ret);

            return _ret;

        };  //end: GetTokenChartOption

        _instance["Utils"] = _utils;

        var _events = {};

        _events["ConfigureChartInstance"] = function (chartOptions, options) {

            //Note: defined by the project instance

            return chartOptions;

        };  //end: ConfigureChartInstance

        _events["_OnExportChartLoad"] = function (options) {
            options = util_extend({ "ChartID": null, "ChartSVG": null, "ChartInstance": null, "Element": null, "PluginInstance": null });
        };

        _instance["Events"] = _events;

    };
//end: CPluginDossierChartManager

RENDERER_LOOKUP["pluginDossier_valueMessageHeading"] = pluginDossier_renderer_editorProjectValueMessageHeading;
RENDERER_LOOKUP["pluginDossier_valueMessageFilter"] = pluginDossier_renderer_valueMessageFilter;
RENDERER_LOOKUP["editor_project_placeholder_token"] = renderer_editorPlaceholderToken;
RENDERER_LOOKUP["pluginDossier_placeholder_token_admin"] = pluginDossier_renderer_placeholderTokenAdmin;
RENDERER_LOOKUP["pluginDossier_chart"] = pluginDossier_renderer_chart;

function pluginDossier_renderer_editorProjectValueMessageHeading(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "editor_project_value_message_heading");

    var _configLookup = {};

    if (util_isFunction("plugin_dossier_getValueMessageHeadingConfig")) {
        _configLookup = plugin_dossier_getValueMessageHeadingConfig();
    }
    else {
        util_logError("pluginDossier_renderer_editorProjectValueMessageHeading :: plugin_dossier_getValueMessageHeadingConfig not defined");
    }

    var _fnConfigureBadges = function (parentContainer, container) {
        var _arrBadges = [];

        var _badgeHTML = "";
        var _parent = $(parentContainer);
        var _container = $(container);

        var _hasPlaceHolders = (util_forceInt(_parent.attr("data-attr-value-message-has-placeholders"), enCETriState.None) == enCETriState.Yes);

        for (var _prop in _configLookup) {
            var _config = _configLookup[_prop];
            var _data = _config["Lookup"];
            var _attrName = "data-pres-value-message-" + _prop;
            var _val = _parent.attr(_attrName);
            var _includePlaceHolderDivider = util_forceBool(_config["IncludePlaceHolderDivider"], false);

            if (util_forceBool(_config["IsMultiple"], false)) {
                _val = util_forceString(_val);

                var _arr = _val.split("|");

                if (_val != "") {
                    for (var _key in _data) {
                        var _searchItem = util_arrFilter(_arr, null, _key, true);
                        var _foundItem = (_searchItem.length == 1);

                        if (_foundItem || _hasPlaceHolders) {
                            _badgeHTML += plugin_dossier_getBadgeOptionHTML(_data[_key], { "IsDisabled": !_foundItem, "IncludeDivider": _includePlaceHolderDivider });
                        }
                    }
                }
            }
            else {

                var _option = (_val != "" ? _data[_val] : null);

                _badgeHTML += plugin_dossier_getBadgeOptionHTML(_option, { "IncludeDivider": _includePlaceHolderDivider });
            }
        }

        _container.html(_badgeHTML);

        //check if there is only one badge and if so, remove any dividers
        var _listBadges = _container.find(".CDossierValueMessageBadge");

        if (_listBadges.length == 1) {
            _container.find(".CDossierValueMessageBadgeDivider").remove();
        }
    };

    $.each(_list, function (index) {
        var _element = $(this);

        var _isInit = util_forceInt(_element.attr("data-attr-is-init"), enCETriState.None);

        if (_isInit != enCETriState.Yes) {

            //has not been initialized so, configure the default layout and set flag

            _element.attr("data-attr-is-init", enCETriState.Yes);

            var _contents = _element.html();

            _element.html("<div class='CDossierValueMessageHeadingContainer'>" + _contents + "</div>" +
                          "<div class='CDossierValueMessageBadgeContainer'>" + "</div>");

            _element.addClass("CDossierValueMessageContainer");
        }

        _fnConfigureBadges(_element, _element.children(".CDossierValueMessageBadgeContainer"));

    });
}

function pluginDossier_renderer_valueMessageFilter(context, options) {

    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "pluginDossier_valueMessageFilter");

    var _categoryLegend = PRIVATE_VALUE_MESSAGE_LEGEND_CONFIG.Category;

    var _fnGetFilterSelectionsHTML = function (pluginInstance, renderOptions) {
        var _filterHTML = "";
        var _categoryBadgeOption = null;

        renderOptions = util_extend({ "IsPrimaryFilterOnly": true, "SelectedPrimaryFilterID": "" }, renderOptions);

        //category
        var _selectedCategoryID = util_forceString(renderOptions["SelectedPrimaryFilterID"]);

        if (_selectedCategoryID != "" &&
            util_isNullOrUndefined(_categoryLegend.Lookup[_selectedCategoryID]) == false) {
            _categoryBadgeOption = _categoryLegend.Lookup[_selectedCategoryID];
        }
        else {
            _selectedCategoryID = "no_filter";

            _categoryBadgeOption = _categoryLegend.LookupFilter[_selectedCategoryID];
        }

        _filterHTML += plugin_dossier_getBadgeOptionHTML(_categoryBadgeOption, { "IncludeDivider": (renderOptions["IsPrimaryFilterOnly"] != true),
            "ExtAttributes": util_htmlAttribute("data-attr-filter-selection-type", "PrimaryFilter") + " " +
                             util_htmlAttribute("data-attr-filter-selection-value", _selectedCategoryID) + " " +
                             util_htmlAttribute("data-attr-filter-selection-is-popup", enCETriState.Yes) + " " +
                             util_htmlAttribute("data-attr-current-css-class", _categoryBadgeOption["CssClass"])
        });

        return _filterHTML;
    };

    $.each(_list, function (indx) {

        var _element = $(this);
        var _pluginInstance = eval($mobileUtil.GetClosestAttributeValue(_element, DATA_ATTR_PLUGIN_INSTANCE));

        var _fnRenderOptions = _element.attr(_pluginInstance.Attributes.ATTRIBUTE_VALUE_MESSAGE_FILTER_GET_OPTION_FN);
        var _html = "";

        var _options = { "FnOnClickCallback": function (element, state) {
        }, "DefaultSelections": {}

        };

        var _toggleInclusiveFilter = true;

        var _itemRenderOptions = { "IsPrimaryFilterOnly": true };

        if (util_isFunction(_fnRenderOptions)) {
            _fnRenderOptions = eval(_fnRenderOptions);

            _options = util_extend(_options,
                                   _fnRenderOptions(_element,
                                                    { "PluginInstance": _pluginInstance,
                                                        "IsClear": (util_forceInt(_element.attr("data-attr-is-clear-selection"), enCETriState.None) == enCETriState.Yes)
                                                    })
                                  );
        }

        if (util_isDefined(_options["DefaultSelections"])) {

            var _defaultSelections = _options["DefaultSelections"];
            var _selectedCategoryID = util_forceString(_defaultSelections["Category"]);
            var _arrDisableSelectedEvidenceLevel = util_forceString(_defaultSelections["DisableEvidenceLevel"]).split("|");

            var _lookupDisableEvidenceLevel = {};

            _itemRenderOptions["SelectedPrimaryFilterID"] = _selectedCategoryID;
            _itemRenderOptions["LookupDisableEvidenceLevelID"] = _lookupDisableEvidenceLevel;

            for (var el = 0; el < _arrDisableSelectedEvidenceLevel.length; el++) {
                var _evidenceLevelID = _arrDisableSelectedEvidenceLevel[el];

                _lookupDisableEvidenceLevel[_evidenceLevelID] = true;
            }

            _toggleInclusiveFilter = util_forceBool(_defaultSelections["ToggleInclusive"], _toggleInclusiveFilter);
        }

        var _fnOnItemClick = _options["FnOnClickCallback"];
        var _fnOnPopupItemClick = _options["FnOnPopupItemClick"];

        var _callbackChange = function (triggerElement, parentContainer) {

            var _parentContainer = $(parentContainer);

            if (util_isFunction(_fnOnItemClick)) {

                var _valueState = { "IsInclusive": $mobileUtil.CheckboxIsChecked(_parentContainer.find("#cbFilterSelectionInclusive")),
                    "ValueOptions": {},
                    "FilterContainer": _parentContainer
                };

                var _filterTypeList = _parentContainer.find("[data-attr-filter-selection-type]");

                $.each(_filterTypeList, function (j) {
                    var _btnGroupItem = $(this);
                    var _filterType = _btnGroupItem.attr("data-attr-filter-selection-type");
                    var _itemValue = util_forceString(_btnGroupItem.attr("data-attr-filter-selection-value"));

                    if (_filterType != "" && _itemValue != "") {
                        var _itemTypeOption = _valueState.ValueOptions[_filterType];

                        if (util_isNullOrUndefined(_itemTypeOption)) {
                            _itemTypeOption = {};

                            _valueState.ValueOptions[_filterType] = _itemTypeOption;
                        }

                        _itemTypeOption[_itemValue] = (_btnGroupItem.hasClass("ValueMessageBadgeDisabled") == false);
                    }
                });

                _fnOnItemClick(triggerElement, _valueState, function () {
                    _parentContainer.removeAttr("data-attr-is-busy");
                    _parentContainer.removeAttr("data-attr-is-clear-selection");
                });
            }
            else {
                _parentContainer.removeAttr("data-attr-is-busy");
                _parentContainer.removeAttr("data-attr-is-clear-selection");
            }

        };

        if (util_forceInt(_element.attr("data-attr-is-init"), enCETriState.None) != enCETriState.Yes) {

            var _isPrimaryFilterOnly = (_itemRenderOptions["IsPrimaryFilterOnly"] == true);
            _html += "<a " + util_htmlAttribute("data-attr-filter-clear-selection", enCETriState.Yes) + " title='Reset Filter' " +
                     " data-role='button' data-mini='true' data-inline='true' data-theme='clear-filter-selection' data-icon='back' data-iconpos='notext' /><br />";

            _html += _fnGetFilterSelectionsHTML(_pluginInstance, _itemRenderOptions) + "<br />";

            if (!_isPrimaryFilterOnly) {
                _html += "<div class='InlineBlock WidgetDisableRoundBorder'>" +
                         "  <label>" +
                         "      <input type='checkbox' id='cbFilterSelectionInclusive' data-mini='true' data-inline='true'" +
                         (_toggleInclusiveFilter ? " checked='checked'" : "") + ">" +
                         util_htmlEncode("Is Inclusive?") +
                         "  </label>" +
                         "</div>";
            }

            _html += "<div class='ValueMessageFilterResultLabel' />";

            _element.html(_html);

            _element.addClass("ValueMessageFilterContainer");
            _element.attr("data-attr-is-init", enCETriState.Yes);

            var _badgeList = _element.find("[data-attr-filter-selection-type]");

            //checkbox change callbackm, if applicable

            if (!_isPrimaryFilterOnly) {
                var _cbFilterSelectionInclusive = _element.find("#cbFilterSelectionInclusive");

                _cbFilterSelectionInclusive.unbind("change.filterToggle");
                _cbFilterSelectionInclusive.bind("change.filterToggle", function () {
                    var _cb = $(this);
                    var _container = $mobileUtil.FindClosest(_cb, "[" + util_renderAttribute("pluginDossier_valueMessageFilter") + "]");

                    if (util_forceInt(_container.attr("data-attr-is-busy"), enCETriState.None) != enCETriState.Yes) {

                        _container.attr("data-attr-is-busy", enCETriState.Yes);
                        _callbackChange(_cb, _container);
                    }
                });
            }


            //badge click callback
            _badgeList.unbind("click.filterBadge");
            _badgeList.bind("click.filterBadge", function () {

                var _btn = $(this);
                var _filterType = _btn.attr("data-attr-filter-selection-type");
                var _container = $mobileUtil.FindClosest(_btn, "[" + util_renderAttribute("pluginDossier_valueMessageFilter") + "]");

                if (util_forceInt(_container.attr("data-attr-is-busy"), enCETriState.None) != enCETriState.Yes) {

                    _container.attr("data-attr-is-busy", enCETriState.Yes);

                    var _isPopup = (util_forceInt(_btn.attr("data-attr-filter-selection-is-popup"), enCETriState.None) == enCETriState.Yes);

                    if (_isPopup) {
                        if (util_isFunction(_fnOnPopupItemClick)) {
                            _fnOnPopupItemClick(_btn, _container, {

                                "Callback": function () {

                                    _callbackChange(_btn, _container);

                                },

                                "SetButtonValue": function (val) {

                                    switch (_filterType) {

                                        case "PrimaryFilter":

                                            var _currentValue = util_forceString(_btn.attr("data-attr-filter-selection-value"));
                                            var _currentCssClass = util_forceString(_btn.attr("data-attr-current-css-class"));
                                            var _categoryBadgeOption = _categoryLegend.Lookup[val];
                                            var _newCssClass = "";

                                            if (util_isNullOrUndefined(_categoryBadgeOption)) {
                                                _categoryBadgeOption = _categoryLegend.LookupFilter[val];
                                            }

                                            if (_currentCssClass != "") {
                                                _btn.removeClass(_currentCssClass);
                                            }

                                            if (util_isNullOrUndefined(_categoryBadgeOption)) {
                                                _newCssClass = "ValueMessageCategoryFilterAll";
                                            }
                                            else {
                                                _newCssClass = _categoryBadgeOption["CssClass"];
                                            }

                                            _btn.addClass(_newCssClass);
                                            _btn.attr("data-attr-filter-selection-value", val);
                                            _btn.attr("data-attr-current-css-class", _newCssClass);

                                            _btn.attr("title", util_forceString(_categoryBadgeOption["Label"]));

                                            break;  //end: PrimaryFilter

                                    }

                                }
                            }
                            );
                        }
                        else {

                            _callbackChange(_btn, _container);
                        }
                    }
                    else {

                        _btn.toggleClass("ValueMessageBadgeDisabled");
                        _callbackChange(_btn, _container);
                    }
                }

            });


            //clear selection button
            var _btnClearSelection = _element.find("[" + util_htmlAttribute("data-attr-filter-clear-selection", enCETriState.Yes) + "]");

            _btnClearSelection.unbind("click.filterClear");
            _btnClearSelection.bind("click.filterClear", function () {

                var _btnClear = $(this);

                dialog_confirmYesNo("Reset Filter", "Are you sure you want to reset the filter selections?", function () {

                    var _parent = $mobileUtil.FindClosest(_btnClear, "[" + util_renderAttribute("pluginDossier_valueMessageFilter") + "]");

                    _parent.removeAttr("data-attr-is-init");
                    _parent.attr("data-attr-is-clear-selection", enCETriState.Yes);

                    $mobileUtil.RenderRefresh(_parent, true);
                });
            });
        }

        //force the filters to be active (initial state)
        _callbackChange(_element, _element);

    });

}

function renderer_editorPlaceholderToken(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "editor_placeholder_token", null, filterList);

    var _fnGetChildElement = function (obj, childType) {
        return $(obj).children("[" + util_htmlAttribute(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_ELEMENT_TYPE, childType) + "]");
    };

    $.each(_list, function (indx) {
        var _element = $(this);
        var _metadata = _element.children("[" + DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_NAME + "]");
        var _fnGetValue = _element.attr(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_GET_VALUE_CALLBACK);
        var _isEditable = (util_forceInt(_element.attr(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_IS_EDITABLE), enCETriState.None) == enCETriState.Yes);
        var _viewModeSimple = (util_forceInt(_element.attr(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_VIEW_TYPE_SIMPLE), enCETriState.None) == enCETriState.Yes);

        if (_metadata.length == 0) {
            var _html = "";
            var _val = util_jsEncode(util_trim(_element.text()));

            _html += "<div " + util_htmlAttribute(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_NAME, _val, null, true) + " style='display: none;' />";
            _html += "<span " + util_htmlAttribute(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_ELEMENT_TYPE, "label") + " />";
            _html += "<a data-role='button' data-inline='true' data-mini='true' data-icon='edit' data-theme='dossier-placeholder-edit' " +
                     util_htmlAttribute(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_ELEMENT_TYPE, "edit_button") + " style='display: none;'>" +
                     util_htmlEncode("EDIT") +
                     "</a>";

            _element.html(_html);

            _element.trigger("create");
            _metadata = _element.children("[" + DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_NAME + "]");
        }

        var _label = _fnGetChildElement(_element, "label");
        var _editButton = _fnGetChildElement(_element, "edit_button");
        var _key = _metadata.attr(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_NAME);
        var _tokenValueHTML = undefined;

        if (_isEditable) {
            _editButton.show();
        }
        else {
            _editButton.hide();
        }

        if (util_isFunction(_fnGetValue)) {
            _fnGetValue = eval(_fnGetValue);
            _tokenValueHTML = _fnGetValue({ "Element": _element, "TokenName": _key, "ViewModeSimple": _viewModeSimple });
        }

        if (_tokenValueHTML == undefined) {
            _tokenValueHTML = util_htmlEncode(_key);
            _element.addClass("CEditorPlaceholderTokenError");
        }
        else {
            _element.removeClass("CEditorPlaceholderTokenError");
        }

        _label.addClass("CEditorPlaceholderTokenLabel");
        _label.html(util_forceString(_tokenValueHTML));

        if (_isEditable && util_forceInt(_element.attr("data-cattr-editor-placeholder-token-hide-edit-button"), enCETriState.None) == enCETriState.Yes) {
            _editButton.hide();
        }
    });

    var _btnList = _list.find("[" + util_htmlAttribute(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_ELEMENT_TYPE, "edit_button") + "]");

    var _fn = function (obj, isMouseOver) {
        var _btn = $(obj);
        var _element = _btn.closest("[" + util_renderAttribute("editor_placeholder_token") + "]");
        var _label = _fnGetChildElement(_element, "label");

        if (isMouseOver) {
            _label.addClass("CEditorPlaceholderTokenHighlight");
        }
        else {
            _label.removeClass("CEditorPlaceholderTokenHighlight");
        }
    };

    _btnList.unbind("click.edit_placeholder_token");
    _btnList.bind("click.edit_placeholder_token", function () {
        var _btn = $(this);
        var _element = _btn.closest("[" + util_renderAttribute("editor_placeholder_token") + "]");
        var _fn = _element.attr(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_ON_EDIT_CLICK_CALLBACK);

        if (util_isFunction(_fn)) {
            _fn = eval(_fn);
            _fn(_btn);
        }
    });

    _btnList.unbind("mouseover.edit");
    _btnList.bind("mouseover.edit", function () {        
        _fn(this, true);
    });

    _btnList.unbind("mouseout.edit");
    _btnList.bind("mouseout.edit", function () {
        _fn(this, false);
    });

    if (_list.length > 0) {
        var _baseTokenLinkURL = global_extSubsectionReplaceTokensHTML("%%EDITOR_EXT_TOKEN_FILE_BASE%%");


        var _linksList = _list.find("a[href*='" + _baseTokenLinkURL + "'], .CInlinePopupLink")
                              .filter("[href*='.pdf']:not(.PopupFileLink), [href*='.jpg']:not(.PopupFileLink), [href*='.png']:not(.PopupFileLink), .CInlinePopupLink")
                              .not("[data-attr-force-download=1]");

        $.each(_linksList, function (indx) {
            var _link = $(this);
            var _href = _link.attr("href");

            _link.attr("data-attr-inline-popup-href", _href);
            _link.attr("href", "javascript: void(0);");
        });

        _linksList.addClass("PopupFileLink")
                  .attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_ACTION_BUTTON, "popup_resource_viewer");
    }
}

function pluginDossier_renderer_placeholderTokenAdmin(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "pluginDossier_placeholderTokenAdmin", null, filterList);

    $.each(_list, function (indx) {
        var _element = $(this);

        var _extTokenTypeID = util_forceInt(_element.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_TYPE_ID), enCE.None);
        var _container = _element.children("[" + util_htmlAttribute(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.TEMPLATE_CONTAINER_VIEW_ID, "content") + "]");
        var _fnGetOptions = _element.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_PLACEHOLDER_TOKEN_ADMIN_GET_OPTIONS_FN_CALLBACK);

        var _fnOnPreviewUpdate = function () {
            var _this = $(this);
            var _parent = _this.closest("[" + DATA_ATTRIBUTE_RENDER + "]");
            var _lblPreview = _parent.find(".CDossierAdminPlaceholderTokenReferencePreview .CDossierAdminPlaceholderTokenReferenceDetail");
            var _searchTokenLookup = {};

            if (_pluginInstance) {
                var _ddlTokenList = _parent.find("select[data-attr-dossier-token-placeholder-portion-id]");
                var _ctxDataVariableName = util_forceString(_parent.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.CONTEXT_INSTANCE_DATA_VARIABLE_NAME));
                var _lookupCacheFieldData = _pluginInstance.Metadata.GetDataVariable(_ctxDataVariableName + "_fieldCacheLookup");

                _lookupCacheFieldData = (_lookupCacheFieldData || {});

                $.each(_ddlTokenList, function (indx) {
                    var _ddlPortionID = util_forceString($(this).attr("data-attr-dossier-token-placeholder-portion-id"));

                    _searchTokenLookup[_ddlPortionID] = (_lookupCacheFieldData[_ddlPortionID] || []);
                });
            }

            _lblPreview.html(_pluginInstance ? _pluginInstance.Utils.ConvertExternalToken(_dataItem, { "Format": "HTML", "ElementList": _list, "IsPreview": true,
                "SearchTokenData": _searchTokenLookup
            }) : "<span style='color: #FF0000;'>" + util_htmlEncode("ERROR") + "</span>");

            if (_this.is("select")) {
                _this.trigger("update.change_dropdown_value_refresh_button");
            }

        };  //end: _fnOnPreviewUpdate

        var _renderOptions = { "ExtTokenItem": null, "PluginInstance": null };
        var _isInit = false;
        var _disablePreviewEventTrigger = false;

        if (_container.length == 0 || util_forceInt(_container.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_TYPE_ID), enCE.None) != _extTokenTypeID) {
            _container.remove();

            _container = $("<div />");
            _container.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.TEMPLATE_CONTAINER_VIEW_ID, "content");
            _container.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_TYPE_ID, _extTokenTypeID);

            _element.prepend(_container);

            _isInit = true;
        }

        if (util_isFunction(_fnGetOptions)) {
            _fnGetOptions = eval(_fnGetOptions);
            _renderOptions = util_extend(_renderOptions, _fnGetOptions({ "Element": _element }));
        }

        var _pluginInstance = _renderOptions["PluginInstance"];
        var _ctxVariableName = util_forceString(_renderOptions["ContextVariableName"]);
        var _dataItem = (_renderOptions["ExtTokenItem"] || {});
        var _arr = [];

        var _contentJSON = util_forceString(_dataItem[enColExternalTokenProperty.ContentJSON]);
        var _listTokenPortion = null;

        if (!_isInit) {

            //persist the user entered values into the data item (based on the existing placeholder portions)
            _listTokenPortion = _container.find("[data-attr-dossier-token-placeholder-portion-id]");

            _contentJSON = util_stringify(_pluginInstance.Utils.ConvertExternalToken(_dataItem, { "Format": "JSON", "ElementList": _listTokenPortion }) || null);

            _dataItem[enColExternalTokenProperty.ContentJSON] = _contentJSON;
        }

        try {
            if (_contentJSON != "") {
                _contentJSON = util_parse(_contentJSON);
            }
            else {
                _contentJSON = null;
            }
        } catch (e) {
            _contentJSON = null;
            util_log("pluginDossier_renderer_placeholderTokenAdmin :: " + e + " | JSON object malformed");
        }

        _contentJSON = util_extend({ "d": null, "version": null }, _contentJSON);

        var _contentData = (_contentJSON["d"] || {});

        if (_isInit) {

            var _html = "";
            var _arrReferencePortion = (PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_TYPE_METADATA[_extTokenTypeID] || []);

            var _fnGetInstructionHTML = function (optInstruction) {
                var _instructionHTML = "";

                optInstruction = util_extend({ "Message": null, "IsHTML": false }, optInstruction);

                var _msg = util_forceString(optInstruction["Message"]);

                if (!util_forceBool(optInstruction["IsHTML"], false)) {
                    _msg = util_htmlEncode(_msg);
                }

                _instructionHTML += "<table class='NoTableStyle'>" +
                                    "   <tr " + util_htmlAttribute(DATA_ATTRIBUTE_RENDER_OVERRIDE, "true") + ">" +
                                    "       <td valign='middle'>" +
                                    "           <a data-role='button' data-icon='info' data-iconpos='notext' data-inline='true' data-theme='transparent' " +
                                    "style='margin: 0em;' />" +
                                    "       </td>" +
                                    "       <td valign='middle'>" +
                                    "           <div class='CDossierAdminPlaceholderTokenInstructionLabel'>" + _msg + "</div>" +
                                    "       </td>" +
                                    "   </tr>" +
                                    "</table>";

                return _instructionHTML;

            };  //end: _fnGetInstructionHTML

            for (var i = 0; i < _arrReferencePortion.length; i++) {
                var _portion = _arrReferencePortion[i];
                var _isHidden = _portion["IsHidden"];
                var _cssClass = util_forceString(_portion["CssClass"]);

                var _attrPortion = util_htmlAttribute("data-attr-dossier-token-placeholder-portion-id", _portion.Name) + " " +
                                   util_htmlAttribute("data-attr-dossier-token-placeholder-css-class", _cssClass, null, true);
                var _portionVal = "";
                var _portionContent = _contentData[_portion.Name];

                if (_portionContent) {
                    _portionVal = util_forceString(_portionContent["Value"]);
                }

                _html += "<div class='CDossierAdminPlaceholderTokenReferencePortion'>" +
                         "  <div class='CDossierAdminPlaceholderTokenReferenceHeading'>" + util_htmlEncode(_portion.DisplayText) + "</div>" +
                         "  <div class='CDossierAdminPlaceholderTokenReferenceDetail'>";

                if (typeof _portionVal == "string") {
                    _portionVal = _pluginInstance.Utils.ReplaceStrTokens(_portionVal);
                }

                switch (_portion.Name) {

                    case "file_upload":
                        _portionVal = util_extend({}, _portionVal);

                        var _fileUploadName = util_forceString(_portionVal["UploadFileName"]);
                        var _fileOriginalName = util_forceString(_portionVal["OriginalFileName"]);
                        var _hasFile = (_fileUploadName != "");

                        _html += "<div style='display: none;' " + util_renderAttribute("file_upload") +
                                 util_htmlAttribute("data-attr-file-upload-exts", _pluginInstance.Metadata.ValidFileUploadExts().join("|")) + " " +
                                 util_htmlAttribute("data-attr-file-upload-ref-id", "fld_ctl_file_upload") + " " +
                                 util_htmlAttribute(CONTROL_FILE_UPLOAD_IS_FORCE_UPLOAD_ON_CHANGE, enCETriState.Yes) + " " +
                                 util_htmlAttribute(CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK,
                                                    _pluginInstance.Metadata.GetInstanceEventReference("OnFileUploadControlEventCallback")) + " " +
                                 util_htmlAttribute(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_FILE_UPLOAD_NAME, _fileUploadName, null, true) + " " +
                                 util_htmlAttribute(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_FILE_UPLOAD_ORIGINAL_NAME, _fileOriginalName, null, true) + " " +
                                 _attrPortion +
                                 " />" +
                                 "<div class='CDossierAdminPlaceholderTokenFileUploadInfo'>" +
                                 "  <div class='CDossierAdminPlaceholderTokenSubHeadingLabel'>" + util_htmlEncode("Associated File:") + "</div>";

                        var _linkURL = "javascript: void(0);";

                        if (_hasFile) {
                            _linkURL = _pluginInstance.Utils.ConstructExtTokenFileURL({ "DataItem": _dataItem, "FileName": _fileUploadName, "DisplayName": _fileOriginalName,
                                "IsPreview": true,
                                "LinkURL": _contentData["file_link"]
                            });
                        }

                        var _downloadLinkHTML = "<a " + util_htmlAttribute("data-attr-file-upload-view-id", "download_link") + " " +
                                                "data-role='button' rel='external' target='_blank' data-mini='true' data-corners='false' data-inline='true' " +
                                                "style='margin: 0em; margin-top: 0.25em;' " + util_htmlAttribute("href", _linkURL) + ">" +
                                                util_htmlEncode("DOWNLOAD") +
                                                "</a>";

                        _downloadLinkHTML = global_extSubsectionReplaceTokensHTML(_downloadLinkHTML);

                        _html += "<ul>" +
                                 "  <li>" +
                                 "      <span " + util_htmlAttribute("data-attr-file-upload-view-id", "lbl") + ">" +
                                 util_htmlEncode(_hasFile ? (_fileOriginalName == "" ? _fileUploadName : _fileOriginalName) : "There is no file currently available.") +
                                 "      </span>" +
                                 "      <a " + util_htmlAttribute("data-attr-file-upload-view-id", "link_details") + " " +
                                 util_htmlAttribute("data-attr-portion-button", _portion.Name) + " " +
                                 util_htmlAttribute("data-attr-portion-button-action-id", "delete_file") +
                                 " style='margin: 0em;" + (_hasFile ? "" : " display: none;") + "' " +
                                 "data-role='button' data-icon='delete' data-mini='true' data-inline='true' data-iconpos='notext' />" +
                                 "  </li>" +
                                 "  <li" + " " + util_htmlAttribute("data-attr-file-upload-view-id", "link_details") + (_hasFile ? "" : " style='display: none;'") + ">" +
                                 _downloadLinkHTML +
                                 "  </li>" +
                                 "</ul>";

                        _html += "</div>";

                        break;  //end: file_upload

                    default:
                        var _portionOptions = util_extend({}, _portion["Options"]);

                        if (util_forceBool(_portionOptions["IsDropdownList"], false)) {
                            var _filterTokenTypeID = util_forceInt(_portionOptions["FilterTokenTypeID"], enCE.None);

                            _html += "<select data-mini='true' data-corners='false' " + _attrPortion + " " +
                                     util_htmlAttribute("data-attr-field-dropdown-selected-val", _portionVal, null, true) + " " +
                                     util_htmlAttribute("data-attr-ddl-filter-token-type-id", _filterTokenTypeID) +
                                     " />";

                            if (util_forceBool(_portionOptions["IsIncludeAddButton"], false)) {
                                _html += "<div>" +
                                         _fnGetInstructionHTML({ "Message": "If the '" + _portion.DisplayText + "' is not available from the list, " +
                                                                            "click the 'Add New...' button below to create a new entry."
                                         }) +
                                         "  <div style='text-align: right;'>" +
                                         "      <a class='ui-disabled' data-role='button' data-inline='true' data-mini='true' data-corners='false' data-icon='edit' " +
                                         util_htmlAttribute("data-attr-portion-button", _portion.Name) + " " +
                                         util_htmlAttribute("data-attr-portion-button-action-id", "edit_token") + " " +
                                         util_htmlAttribute("data-attr-add-new-token-restrict-token-type-id", _filterTokenTypeID) + ">" +
                                         util_htmlEncode("Edit") +
                                         "      </a>" +
                                         "      <a data-role='button' data-inline='true' data-mini='true' data-corners='false' data-icon='plus' " +
                                         util_htmlAttribute("data-attr-portion-button", _portion.Name) + " " +
                                         util_htmlAttribute("data-attr-portion-button-action-id", "add_token") + " " +
                                         util_htmlAttribute("data-attr-add-new-token-restrict-token-type-id", _filterTokenTypeID) + ">" +
                                         util_htmlEncode("Add New...") +
                                         "      </a>" +
                                         "  </div>" +
                                         "</div>";
                            }
                        }
                        else if (util_forceBool(_portionOptions["IsTextArea"], false)) {
                            _html += "<textarea " + _attrPortion + " style='min-height: 8em;'>" +
                                     util_htmlEncode(_portionVal, null, true) +
                                     "</textarea>" +
                                     "<div style='text-align: right;'>" +
                                     "  <a " + util_htmlAttribute("data-attr-expand-toggle-button", enCETriState.Yes) + " data-corners='false' data-role='button' data-mini='true' " +
                                     "data-inline='true' data-icon='arrow-d' data-iconpos='right'>" +
                                     util_htmlEncode("EXPAND") +
                                     "  </a>" +
                                     "</div>";
                        }
                        else {
                            _html += "<input type='text' " + _attrPortion + " " + util_htmlAttribute("value", _portionVal, null, true) + " />";
                        }

                        break;
                }

                _html += "  </div>" +
                         "</div>";
            }

            _html += "<div class='CDossierAdminPlaceholderTokenReferencePreview'>" +
                     "  <div class='CDossierAdminPlaceholderTokenReferenceHeading'>" + util_htmlEncode("Preview") + "</div>" +
                     "  <div class='CDossierAdminPlaceholderTokenReferenceDetail'>" + "&nbsp;" + "</div>" +
                     "</div>";

            _container.html(_html);
            $mobileUtil.refresh(_container);

            var _list = _container.find("[data-attr-dossier-token-placeholder-portion-id] ");
            var _inputList = _list.filter("input[type='text'], select, textarea");
            var _buttonList = _container.find("[data-attr-portion-button]");

            var _expandToggleButtonList = _container.find("[" + util_htmlAttribute("data-attr-expand-toggle-button", enCETriState.Yes) + "]");

            _expandToggleButtonList.unbind("click.admin_token_expand_toggle");
            _expandToggleButtonList.bind("click.admin_token_expand_toggle", function () {
                var _btn = $(this);
                var _parentDetail = _btn.closest(".CDossierAdminPlaceholderTokenReferenceDetail");

                var _textArea = _parentDetail.find("textarea[data-attr-dossier-token-placeholder-portion-id]");
                var _isCollapsed = (util_forceInt(_btn.attr("data-attr-expand-toggle-is-collapsed"), enCETriState.Yes) == enCETriState.Yes);

                if (_isCollapsed) {
                    _textArea.css("min-height", ($(window).height() * 0.4) + "px");
                }
                else {
                    _textArea.css("min-height", "8em");
                }

                _btn.attr("data-attr-expand-toggle-is-collapsed", _isCollapsed ? enCETriState.No : enCETriState.Yes);
                $mobileUtil.ButtonSetTextByElement(_btn, _isCollapsed ? "COLLAPSE" : "EXPAND");
                $mobileUtil.ButtonUpdateIcon(_btn, _isCollapsed ? "arrow-u" : "arrow-d");
            });

            _buttonList.unbind("click.admin_token_ref_portion_button");
            _buttonList.bind("click.admin_token_ref_portion_button", function () {
                var _btn = $(this);
                var _portionID = util_forceString(_btn.attr("data-attr-portion-button"));
                var _buttonID = util_forceString(_btn.attr("data-attr-portion-button-action-id"));
                var _parent = _btn.closest(".CDossierAdminPlaceholderTokenReferencePortion");
                var _portionContainer = _parent.find("[" + util_htmlAttribute("data-attr-dossier-token-placeholder-portion-id", _portionID) + "]");

                var _fnRefresh = function () {
                    $mobileUtil.RenderRefresh(_portionContainer.closest("[" + util_renderAttribute("pluginDossier_placeholderTokenAdmin") + "]"), true);
                };

                var _handled = true;

                switch (_buttonID) {

                    case "add_token":
                    case "edit_token":

                        dialog_confirmYesNo("Save Changes",
                                            "<b>" + util_htmlEncode("Warning:") + "</b>" +
                                            util_htmlEncode(" you are about to navigate away from the current screen and all changes will be saved.") + "<br />" +
                                            util_htmlEncode("Are you sure you want to proceed?"), function () {

                                                var _btnSave = $mobileUtil.PopupContainer().find("[data-attr-admin-popup-btn='save']");

                                                _btnSave.attr("data-attr-breadcrumb-placeholder-edit-token-id",
                                                              util_forceInt(_btn.attr("data-attr-edit-token-current-placeholder-token-id"), enCE.None));
                                                _btnSave.attr("data-attr-add-current-edit-to-back-stack", enCETriState.Yes);
                                                _btnSave.attr("data-attr-breadcrumb-edit-placeholder-restrict-token-type-id",
                                                              util_forceInt(_btn.attr("data-attr-add-new-token-restrict-token-type-id"), enCE.None));

                                                _btnSave.trigger("click");

                                            }, null, true);

                        break;

                    default:
                        _handled = false;
                        break;
                }

                if (!_handled && _extTokenTypeID == enCEExternalTokenType.Reference) {

                    switch (_portionID) {

                        case "file_upload":

                            if (_buttonID == "delete_file") {

                                dialog_confirmYesNo("Remove File", "Are you sure you want to remove the associated file?", function () {

                                    //remove the associated file and original file name attributes
                                    _portionContainer.removeAttr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_FILE_UPLOAD_NAME);
                                    _portionContainer.removeAttr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.EXT_TOKEN_FILE_UPLOAD_ORIGINAL_NAME);

                                    renderer_event_file_upload_cleanup_temp_file(_parent);

                                    var _fileUploadList = _parent.find("[" + util_renderAttribute("file_upload") + "]").hide();

                                    _fileUploadList.hide();
                                    $mobileUtil.RenderRefresh(_fileUploadList, true);

                                    _fnRefresh();   //force refresh to persist the changes and rebind the UI
                                });
                            }

                            break;  //end: file_upload
                    }

                }

            }); //end: click.admin_token_ref_portion_button

            _inputList.unbind("change.admin_token_ref_portion");
            _inputList.bind("change.admin_token_ref_portion", _fnOnPreviewUpdate);

            var _previewContainer = _container.find(".CDossierAdminPlaceholderTokenReferencePreview");

            _previewContainer.unbind("update.admin_token_preview");
            _previewContainer.bind("update.admin_token_preview", _fnOnPreviewUpdate);

            //bind the dropdown list related fields
            var _ddlList = _inputList.filter("select");

            var _arrBindDDL = [];

            $.each(_ddlList, function (indx) {
                var _ddl = $(this);

                var _fnBindDDL = function (onBindCallback) {
                    var _callbackBind = function () {
                        if (onBindCallback) {
                            onBindCallback();
                        }
                    };

                    var _filterTokenTypeID = util_forceInt(_ddl.attr("data-attr-ddl-filter-token-type-id"), enCE.None);

                    global_extTokenList({ "TokenTypeID": _filterTokenTypeID, "SortColumn": enColExternalToken.Name }, function (data) {
                        var _list = (data.List || []);

                        //store the dropdown list data (for future use)
                        var _ddlPortionID = util_forceString(_ddl.attr("data-attr-dossier-token-placeholder-portion-id"));
                        var _cacheFieldLookup = _pluginInstance.Metadata.GetDataVariable(_ctxVariableName + "_fieldCacheLookup");

                        if (util_isNullOrUndefined(_cacheFieldLookup)) {
                            _cacheFieldLookup = {};
                            _pluginInstance.Metadata.SetDataVariable(_ctxVariableName + "_fieldCacheLookup", _cacheFieldLookup);
                        }

                        var _arrData = [];

                        for (var d = 0; d < _list.length; d++) {
                            var _extTokenItem = _list[d];
                            var _item = { "Text": "", "Value": _extTokenItem[enColExternalTokenProperty.TokenID], "Data": _extTokenItem };

                            _item.Text = _extTokenItem[enColExternalTokenProperty.Name];
                            _item.Text += ": " + _pluginInstance.Utils.ConvertExternalToken(_extTokenItem, { "Format": "TEXT" });

                            _arrData.push(_item);
                        }

                        _cacheFieldLookup[_ddlPortionID] = _arrData;

                        var _parentDDL = _ddl.closest(".ui-select");

                        _parentDDL.css("width", _ddl.width() + "px");
                        _parentDDL.css("max-width", _ddl.width() + "px");

                        var _ddlValue = util_forceInt(_ddl.attr("data-attr-field-dropdown-selected-val"), enCE.None);

                        _ddl.removeAttr("data-attr-field-dropdown-selected-val");

                        _ddl.selectmenu("enable");
                        util_dataBindDDL(_ddl, _arrData, "Text", "Value", _ddlValue, true, enCE.None, "");

                        var _fnOnChangeUpdateDDL = function () {
                            var _ddlElement = $(this);
                            var _parentDetail = _ddlElement.closest(".CDossierAdminPlaceholderTokenReferenceDetail");
                            var _btnEditToken = _parentDetail.find("a[data-attr-portion-button-action-id='edit_token']");
                            var _val = util_forceInt(_ddlElement.val(), enCE.None);

                            if (_val == enCE.None) {
                                _btnEditToken.addClass("ui-disabled");
                            }
                            else {
                                _btnEditToken.removeClass("ui-disabled");
                            }

                            _btnEditToken.attr("data-attr-edit-token-current-placeholder-token-id", _val);
                        };

                        _ddl.unbind("update.change_dropdown_value_refresh_button");
                        _ddl.bind("update.change_dropdown_value_refresh_button", _fnOnChangeUpdateDDL);

                        _ddl.trigger("update.change_dropdown_value_refresh_button");

                        _callbackBind();
                    });

                };  //end: _fnBindDDL

                _arrBindDDL.push(_fnBindDDL);
            });

            _ddlList.selectmenu("disable");

            var _fn = function (arr) {
                if (arr.length > 0) {
                    var _fnBindDDL = arr.pop();

                    _fnBindDDL(function () {
                        _fn(arr);
                    });
                }
                else {
                    _container.find(".CDossierAdminPlaceholderTokenReferencePreview")
                              .trigger("update.admin_token_preview");
                }

            };  //end: _fn

            if (_arrBindDDL.length > 0) {
                _fn(_arrBindDDL);
                _disablePreviewEventTrigger = true;
            }

            //end: initialization
        }
        else {

            $.each(_listTokenPortion, function (indx) {
                var _tokenElement = $(this);
                var _portionID = util_forceString(_tokenElement.attr("data-attr-dossier-token-placeholder-portion-id"));
                var _portionVal = "";
                var _portionContent = _contentData[_portionID];

                if (_portionContent) {
                    _portionVal = util_forceString(_portionContent["Value"]);
                }

                switch (_portionID) {
                    case "file_upload":
                        var _viewList = _tokenElement.closest(".CDossierAdminPlaceholderTokenReferencePortion")
                                                     .find("[data-attr-file-upload-view-id]");
                        _portionVal = util_extend({}, _portionVal);

                        var _fileUploadName = util_forceString(_portionVal["UploadFileName"]);
                        var _fileOriginalName = util_forceString(_portionVal["OriginalFileName"]);
                        var _hasFile = (_fileUploadName != "");

                        _viewList.filter("[data-attr-file-upload-view-id='lbl']")
                                 .text(_hasFile ? (_fileOriginalName != "" ? _fileOriginalName : _fileUploadName) : "There is no file currently available.");

                        var _linkURL = _pluginInstance.Utils.ConstructExtTokenFileURL({ "DataItem": _dataItem,
                            "FileName": _fileUploadName,
                            "DisplayName": _fileOriginalName,
                            "IsPreview": true,
                            "LinkURL": _contentData["file_link"]
                        });

                        var _linkDetails = _viewList.filter("[data-attr-file-upload-view-id='link_details']");

                        if (_hasFile) {
                            _linkDetails.show();
                        }
                        else {
                            _linkDetails.hide();
                        }

                        _viewList.filter("[data-attr-file-upload-view-id='download_link']")
                                 .attr("href", _linkURL);

                        break;

                    default:
                        _tokenElement.val(_portionVal);
                        break;
                }

            });

            //end: update
        }


        //update the preview container contents, if applicable (such as no dropdown initializations pending and/or is simply an update)
        if (!_disablePreviewEventTrigger) {
            _container.find(".CDossierAdminPlaceholderTokenReferencePreview")
                      .trigger("update.admin_token_preview");
        }

    });
}

var m_pluginDossierChartResizeID = null;

function pluginDossier_renderer_chart(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "pluginDossier_chart", null, filterList);
    var _window = $(window);
    var _width = _window.width();
    var _height = _window.height();

    var _fnResize = function () {
        var _listChart = $mobileUtil.Find("[" + util_renderAttribute("pluginDossier_chart") + "]");

        clearInterval(m_pluginDossierChartResizeID);

        m_pluginDossierChartResizeID = setInterval(function () {
            clearInterval(m_pluginDossierChartResizeID);

            var _fn = function (arr, index) {

                if (index < arr.length) {
                    $mobileUtil.RenderRefresh(arr.get(index), true);

                    setTimeout(function () {
                        _fn(arr, index + 1);
                    }, 100);
                }

            };

            _fn(_listChart, 0);

        }, 750);

    };  //end: _fnResize

    _window.unbind("resize.dossier_chartResize");
    _window.bind("resize.dossier_chartResize", _fnResize);

    $.each(_list, function (indx) {
        var _element = $(this);
        var _chartContainer = _element.children("CDossierChartContainer");
        var _chartWidth = 500;
        var _chartHeight = 500;
        var _chartID = _element.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_CHART_ID);
        var _fnGetChartInstance = _element.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_CHART_GET_INSTANCE_FN);

        var _pctWidth = util_forceFloat(_element.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_CHART_WIDTH_PCT), 0.35);
        var _pctHeight = util_forceFloat(_element.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_CHART_HEIGHT_PCT), 0.35);

        if (_pctWidth > 0) {
            _chartWidth = Math.max(_width * _pctWidth, _chartWidth);
        }

        if (_pctHeight > 0) {
            _chartHeight = Math.max(_height * _pctHeight, _chartHeight);
        }

        if (_chartContainer.length == 0) {
            var _html = "";

            _html += "<div class='CDossierChartContainer InlineBlock'>" +
                     "  <div class='CDossierChartAdminTools' style='display: none;'>&nbsp;</div>" +
                     "  <div class='CDossierChartTitle'>&nbsp;</div>" +
                     "  <div class='CDossierChartContent InlineBlock'>&nbsp;</div>" +
                     "  <div class='CDossierChartFooter' style='display: none;'>&nbsp;</div>" +
                     "</div>";

            _chartContainer = $(_html);

            _element.empty();
            _element.append(_chartContainer);
        }
        else {

            //update
        }

        var _container = _chartContainer.children(".CDossierChartContent");

        _element.width(_chartWidth);
        _element.css("min-height", _chartHeight + "px");

        if (util_isFunction(_fnGetChartInstance)) {
            _fnGetChartInstance = eval(_fnGetChartInstance);

            var _chartOpt = _fnGetChartInstance({ "Element": _element, "ChartContainer": _container, "ChartID": _chartID, "ChartWidth": _chartWidth, "ChartHeight": _chartHeight,
                                                  "MaxWidth": _width, "MaxHeight": _height });

            if (_chartOpt) {

                //resize the element container, if applicable
                if (_chartOpt["chart"]) {
                    _chartWidth = Math.max(_chartWidth, util_forceFloat(_chartOpt.chart["width"], 0));
                    _chartHeight = Math.max(_chartHeight, util_forceFloat(_chartOpt.chart["height"], 0));

                    _element.width(_chartWidth);
                    _element.css("min-height", _chartHeight + "px");
                }

                _element.width(_chartWidth);
                _element.css("min-height", _chartHeight + "px");

                _container.highcharts(_chartOpt);
            }
            else {
                _container.empty();
            }
        }

        var _divAdminTools = _chartContainer.children(".CDossierChartAdminTools");

        if (util_forceInt(_element.attr(PLUGIN_DOSSIER_RENDERER_ATTRIBUTES.ATTRIBUTE_HAS_EDIT_TOOLS), enCETriState.None) == enCETriState.Yes) {

            if (_divAdminTools.children("[data-edit-chart-placeholder-btn]").length == 0) {

                var _adminToolsHTML = "";

                _adminToolsHTML += "<a data-role='button' data-inline='true' data-mini='true' data-icon='edit' data-corners='false' " +
                                   util_htmlAttribute("data-edit-chart-placeholder-btn", enCETriState.Yes) + ">" +
                                   util_htmlEncode("EDIT") +
                                   "</a>";

                _divAdminTools.html(_adminToolsHTML);
                _divAdminTools.trigger("create");

                var _btnEdit = _divAdminTools.children("[data-edit-chart-placeholder-btn]");

                _btnEdit.bind("click.edit_chart_token_value", function () {
                    var _btn = $(this);
                    var _parent = _btn.closest("[" + util_renderAttribute("editor_placeholder_token") + "]");

                    _parent.find("[" + util_htmlAttribute(DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_ELEMENT_TYPE, "edit_button") + "]")
                           .trigger("click");
                });

                var _fn = function (obj, isMouseOver) {
                    var _btn = $(obj);
                    var _element = _btn.closest(".CDossierChartContainer");

                    if (isMouseOver) {
                        _element.addClass("CEditorPlaceholderTokenHighlight");
                    }
                    else {
                        _element.removeClass("CEditorPlaceholderTokenHighlight");
                    }
                };

                _btnEdit.bind("mouseover.edit_chart_token_value", function () {
                    _fn(this, true);
                });

                _btnEdit.bind("mouseout.edit_chart_token_value", function () {
                    _fn(this, false);
                });
            }

            _divAdminTools.show();
        }
        else if (_divAdminTools.is(":visible")) {
            _divAdminTools.empty();
            _divAdminTools.hide();
        }
    });

}

function plugin_dossier_getBadgeOptionHTML(badgeOption, renderOptions) {
    var _ret = "";

    if (!(util_isNullOrUndefined(badgeOption))) {
        var _cssClass = util_forceString(badgeOption["CssClass"]);
        var _badgeText = util_forceString(badgeOption["BadgeText"]);
        var _label = util_forceString(badgeOption["Label"]);

        renderOptions = util_extend({ "IsDisabled": false, "IncludeDivider": false, "ExtAttributes": "" }, renderOptions);

        var _extAttributes = util_forceString(renderOptions["ExtAttributes"]);

        if (_extAttributes != "") {
            _extAttributes = " " + _extAttributes;
        }

        _ret += "<div class='InlineBlock CDossierValueMessageBadge" + (_cssClass != "" ? " " + _cssClass : "") +
                (renderOptions["IsDisabled"] ? " CDossierValueMessageBadgeDisabled" : "") + "' data-content=\"" + util_jsEncode(_badgeText) + "\" " +
                util_htmlAttribute("title", _label, null, true) + _extAttributes + "></div>";

        if (renderOptions["IncludeDivider"]) {
            _ret += "<div class='InlineBlock CDossierValueMessageBadgeDivider' />";
        }
    }

    return _ret;
}

function plugin_dossier_getValueMessageFilterOptions(obj, options) {
    var _element = $(obj);
    var _ret = {};

    options = util_extend({ "PluginInstance": null }, options);

    _ret["DefaultSelections"] = { "PrimaryFilter": "no_filter" };

    var _pluginInstance = options.PluginInstance;
    var m_currentSectionID = _pluginInstance.Metadata.GetDataVariable("m_currentSectionID");

    if (!util_forceBool(options["IsClear"])) {
        var _keyFilterSelectionState = "VALUE_MESSAGE_FILTER_STATE_" + m_currentSectionID + "_" +
                                       util_forceInt($mobileUtil.GetAncestorAttributeValue(_element, DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_CURRENT_SUBSECTION_LINK_ID));

        _ret.DefaultSelections = util_extend(_ret.DefaultSelections, _pluginInstance.Managers.CacheManager.GetCacheItem(_keyFilterSelectionState, true));
    }

    _ret["FnOnPopupItemClick"] = function (triggerElement, container, options) {

        var _callback = function () {
            var _fn = options["Callback"];

            if (_fn) {
                _fn();
            }
        };

        var _btn = $(triggerElement);
        var _filterType = _btn.attr("data-attr-filter-selection-type");
        var _fnSetButtonValue = options["SetButtonValue"];

        switch (_filterType) {

            case "PrimaryFilter":

                _pluginInstance.Events.ShowIconLegendPopup(_btn, { "OnPopupCloseCallback": _callback, "IsFilterSelectionMode": true,
                    "FilterSelectedValue": _btn.attr("data-attr-filter-selection-value"),
                    "OnPopupFilterItemCallback": function (selectedFilterID) {

                        _fnSetButtonValue(selectedFilterID);

                        $mobileUtil.PopupClose();
                    }
                });

                break;
        }
    };


    _ret["FnOnClickCallback"] = function (triggerElement, valueState, callback) {

        var _callback = function () {
            if (callback) {
                callback();
            }
        };

        var _btn = $(triggerElement);

        if (util_isNullOrUndefined(valueState)) {
            valueState = { "IsInclusive": true };
        }

        var _list = $mobileUtil.Find(".CEditorCollapsibleItem");
        var _selectorValueMessageBadgeContainer = "[" + util_renderAttribute("editor_project_value_message_heading") + "] .CDossierValueMessageBadgeContainer";
        var _selector = "";
        var _requiredSelector = "";
        var _isInclusive = util_forceBool(valueState["IsInclusive"]);
        var _filterContainer = $(valueState["FilterContainer"]);

        if (!util_isNullOrUndefined(valueState["ValueOptions"])) {
            var _requiredCount = 0;

            var _valueOptions = valueState["ValueOptions"];
            var _elementSaveStateConfig = { "PrimaryFilter": "", "ToggleInclusive": _isInclusive };

            for (var _filterType in _valueOptions) {
                var _lookupSource = null;

                switch (_filterType) {

                    case "PrimaryFilter":

                        _lookupSource = PRIVATE_VALUE_MESSAGE_LEGEND_CONFIG.Category.Lookup;

                        var _categoryLookupFilterTypeSelections = _valueOptions[_filterType];

                        if (!util_isNullOrUndefined(_categoryLookupFilterTypeSelections["no_filter"])) {

                            //do nothing since will show all category items (no filter)
                            _elementSaveStateConfig.PrimaryFilter = "no_filter";

                            _requiredSelector += (_requiredSelector != "" ? ", " : "");
                            _requiredSelector += _selectorValueMessageBadgeContainer;   //general required selector (not applying the category filter)
                        }
                        else {

                            for (var _categorySelectionKey in _categoryLookupFilterTypeSelections) {
                                var _categoryBadgeOption = _lookupSource[_categorySelectionKey];

                                _requiredSelector += (_requiredSelector != "" ? ", " : "");
                                _requiredSelector += _selectorValueMessageBadgeContainer + " ." + _categoryBadgeOption["CssClass"];

                                _elementSaveStateConfig.PrimaryFilter = _categorySelectionKey;
                            }
                        }

                        _lookupSource = null;   //invalidate the current filter type (since it will be part of the required selector)

                        break;
                }
            }
        }

        var _countMatches = 0;

        if (util_forceString(_selector) != "" || util_forceString(_requiredSelector) != "") {

            $.each(_list, function (indx) {

                var _groupItem = $(this);
                var _match = false;

                if (_requiredSelector == "") {
                    _match = true;
                }
                else {
                    _match = (_groupItem.find(_requiredSelector).length > 0);
                }

                if (_match && _selector != "") {
                    var _count = _groupItem.find(_selector).length;

                    _match = (_isInclusive ? _count > 0 : _count == _requiredCount);
                }

                _groupItem.attr("data-attr-filter-selection-is-match", _match ? enCETriState.Yes : enCETriState.No);
            });

            var _matchList = _list.filter("[data-attr-filter-selection-is-match='" + enCETriState.Yes + "']");
            var _notMatchList = _list.filter("[data-attr-filter-selection-is-match='" + enCETriState.No + "']");

            _matchList.show();
            _notMatchList.hide();

            _countMatches = _matchList.length;
        }
        else {
            _list.filter(function () {
                return ($(this).find(_selectorValueMessageBadgeContainer).length > 0);
            }).hide();
        }

        _filterContainer.find(".ValueMessageFilterResultLabel")
                            .text(_countMatches + " - result" + (_countMatches != 1 ? "s" : "") + " found");

        //save state
        var _keyFilterSelectionState = "VALUE_MESSAGE_FILTER_STATE_" + m_currentSectionID + "_" +
                                       util_forceInt($mobileUtil.GetAncestorAttributeValue(_filterContainer,
                                                                                           DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_CURRENT_SUBSECTION_LINK_ID));

        _pluginInstance.Managers.CacheManager.SetCacheItem(_keyFilterSelectionState, _elementSaveStateConfig, true);

        _callback();
    };

    return _ret;
}