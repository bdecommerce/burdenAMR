var CKeyOpinionLeaderController = function (initOpts) {
    var _instance = this;

    initOpts = util_extend({ "IsDisableExtControllerInit": false }, initOpts);

    _instance["DOM"] = {
        "Element": null,
        "View": null,
        "GroupTabs": null,
        "GroupContents": null,

        "ToggleIndicator": function (isEnabled) {
            if (this.View) {
                this.View.trigger("events.viewIndicator_toggle", { "IsEnabled": isEnabled });
            }
        }
    };

    var _utils = pluginEditor_getUtils();

    _instance["Utils"] = util_extend({
        "ContextClassificationID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-classification-id"), enCE.None);
        },
        "ContextEditorGroupID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-attr-home-editor-group-id"), enCE.None);
        },
        "ContextEditorGroupPlatformID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-platform-id"), enCE.None);
        },
        "ContextEditorGroupComponentID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-component-id"), enCE.None);
        },
        "ConstructRepositoryResourceLinkHTML": function (opts) {
            var _ret = util_forceString(opts["ContentHTML"]);
            var _item = (opts ? opts["Item"] : null);

            _item = (_item || {});

            var _fileID = util_forceInt(_item[enColRepositoryResourceProperty.FileID], enCE.None);
            var _hasFile = (_fileID != enCE.None);

            _isEncode = false;

            if (_hasFile) {
                var _url = _instance.Utils.ConstructDownloadURL({
                    "TypeID": "editor", "Item": _item, "Property": enColRepositoryResourceProperty.FileID
                });

                var _isWrapper = false;
                var _showDisplayName = opts["IncludeDisplayName"];

                if (_ret != "") {
                    _ret += "<div class='EditorResourceFileLinkView'>";
                    _isWrapper = true;
                }

                _ret += "<a " + (_showDisplayName ? "class='LinkExternal WordBreak' " : "") +
                        "data-role='none' data-rel='external' target='_blank' " + util_htmlAttribute("href", _url) + " " +
                        util_htmlAttribute("title", _item[enColRepositoryResourceProperty.FileDisplayName], null, true) + ">" +
                        "<div class='EditorImageButton ImageDownloadFile'>" +
                        "        <div class='ImageIcon' />" +
                        "</div>" +
                        (_showDisplayName ? util_htmlEncode(_item[enColRepositoryResourceProperty.FileDisplayName]) : "") +
                        "</a>";

                if (_isWrapper) {
                    _ret += "</div>";
                }
            }

            if (_ret == "") {
                _ret = "&nbsp;";
            }

            return _ret;
        },
        "ConstructKeyOpinionLeaderProfileURL": function (opts) {
            var _keyOpinionLeaderID = (opts ? opts["ID"] : null);
            var _cKey = null;

            _keyOpinionLeaderID = util_forceInt(_keyOpinionLeaderID, enCE.None);

            if (!opts["IsInitCacheKey"] && _instance.Data.CacheURL.KOL[_keyOpinionLeaderID]) {
                _cKey = _instance.Data.CacheURL.KOL[_keyOpinionLeaderID];
            }
            else {
                _cKey = (new Date()).getTime();
                _instance.Data.CacheURL.KOL[_keyOpinionLeaderID] = _cKey;
            }

            var _url = util_constructDownloadURL({
                "TypeID": "_ProfileKOL", "NoCache": false,
                "ExtraQS": {
                    "rn": "PluginEditor",
                    "KeyOpinionLeaderID": encodeURIComponent(_keyOpinionLeaderID),
                    "ckey": _cKey
                }
            });

            return _url;
        }     
    }, _utils);

    _instance.Utils["LABELS"] = util_extend({
        "Maximize": "Maximize",
        "Minimize": "Minimize",
        "Save": "Save"
    }, _instance.Utils["LABELS"]);

    _instance["Data"] = {
        "DefaultViewGroupID": (IS_DEBUG ? util_queryString("DefaultGroupID_KOL") : null),
        "DefaultContentViewModeID": (IS_DEBUG ? util_forceInt(util_queryString("DefaultContentViewModeID_KOL"), enCContentViewModeKOL.Event) : enCContentViewModeKOL.Event),
        "FilterEntityTypeSwitchEventActivityID": -1000,
        "NextRenderFieldID": 1,
        "ID": {
            KOL: "kol",
            EventActivity: "events_activites",
            DevelopmentGoal: "goals"
        },
        "HasUnifiedRepositoryResourceSearch": "%%TOK|ROUTE|PluginEditor|KOL_HasUnifiedRepositoryResourceSearch%%",
        "HasCommentsFeature": "%%TOK|ROUTE|PluginEditor|KOL_HasCommentsFeature%%",
        "HasRatingsFeature": "%%TOK|ROUTE|PluginEditor|KOL_HasRatingsFeature%%",
        "HasRatingsBreakdownChartFeature": "%%TOK|ROUTE|PluginEditor|KOL_HasRatingsBreakdownChartFeature%%",
        "HasExportExcelFeature": "%%TOK|ROUTE|PluginEditor|KOL_HasExportExcelFeature%%",
        "HasExportPowerPointFeature": "%%TOK|ROUTE|PluginEditor|KOL_HasExportPowerPointFeature%%",
        "LayoutRatings": "%%TOK|ROUTE|PluginEditor|LayoutKOL_Rating%%",
        "DefaultEntityKOL": ("%%TOK|ROUTE|PluginEditor|KOL_NewInstance%%" || new CEKeyOpinionLeader()),
        "DefaultEntityEvent": ("%%TOK|ROUTE|PluginEditor|KOL_EventNewInstance%%" || new CEEvent()),
        "DefaultEntityActivity": ("%%TOK|ROUTE|PluginEditor|KOL_ActivityNewInstance%%" || new CEActivity()),
        "ContextGroups": ("%%TOK|ROUTE|PluginEditor|KOL_ContextGroups%%" || []),
        "LookupGroupFilters": {
            "Primary": {
                "KOL": "%%TOK|ROUTE|PluginEditor|KOL_FilterGroups|{ GroupID: \"kol\", IsPrimary: true }%%",
                "Events": "%%TOK|ROUTE|PluginEditor|KOL_FilterGroups|{ GroupID: \"events_activites\", IsPrimary: true }%%",
                "Goals": "%%TOK|ROUTE|PluginEditor|KOL_FilterGroups|{ GroupID: \"goals\", IsPrimary: true }%%"
            },
            "Secondary": {
                "KOL": "%%TOK|ROUTE|PluginEditor|KOL_FilterGroups|{ GroupID: \"kol\", IsPrimary: false }%%",
                "Events": "%%TOK|ROUTE|PluginEditor|KOL_FilterGroups|{ GroupID: \"events_activites\", IsPrimary: false }%%",
                "Goals": "%%TOK|ROUTE|PluginEditor|KOL_FilterGroups|{ GroupID: \"goals\", IsPrimary: false }%%"
            }
        },
        "RenderOptionDetailViewKOL": ("%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsDetailView|{ IsPopupDetails: false }%%" || []),
        "RenderOptionDetailPopupViewKOL": ("%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsDetailView|{ IsPopupDetails: true }%%" || []),
        "RenderOptionDetailViewEvent": ("%%TOK|ROUTE|PluginEditor|KOL_EventRenderOptionsDetailView|{ IsPopupDetails: false }%%" || []),
        "RenderOptionDetailPopupViewEvent": ("%%TOK|ROUTE|PluginEditor|KOL_EventRenderOptionsDetailView|{ IsPopupDetails: true }%%" || []),
        "RenderOptionDetailViewActivity": ("%%TOK|ROUTE|PluginEditor|KOL_ActivityRenderOptionsDetailView|{ IsPopupDetails: false }%%" || []),
        "RenderOptionDetailPopupViewActivity": ("%%TOK|ROUTE|PluginEditor|KOL_ActivityRenderOptionsDetailView|{ IsPopupDetails: true }%%" || []),
        "RenderOptionRepositoryCategoryLookup": {
            "m_lookup": {},
            "m_lookupRepositoryField": null,
            "RepositoryFields": ("%%TOK|ROUTE|PluginEditor|RepositoryFields%%" || []),
            "Get": function (opts) {

                var _this = this;
                var _lookup = this.m_lookup;

                opts = util_extend({ "DocumentTypeID": enCE.None, "Callback": null }, opts);

                var _documentTypeID = util_forceInt(opts.DocumentTypeID, enCE.None);

                var _callback = function () {
                    if (opts.Callback) {
                        opts.Callback(_lookup[_documentTypeID]);
                    }
                };

                if (_lookup[_documentTypeID]) {
                    _callback();
                }
                else if (_documentTypeID != enCE.None) {
                    _instance.DOM.ToggleIndicator(true);

                    APP.Service.Action({
                        "_indicators": false, "c": "PluginEditor", "m": "RepositoryCategory", "args": {
                            "SearchContextDocumentTypeID": _documentTypeID,
                            "IsFallbackDefault": true
                        }
                    }, function (category) {

                        category = (category || {});

                        //init the lookup for the repository fields, if applicable
                        if (!_this.m_lookupRepositoryField) {
                            _this.m_lookupRepositoryField = {};

                            for (var f = 0; f < _this.RepositoryFields.length; f++) {
                                var _repoField = _this.RepositoryFields[f];
                                var _fieldID = _repoField[enColRepositoryFieldProperty.FieldID];

                                _this.m_lookupRepositoryField[_fieldID] = _repoField;
                            }
                        }

                        //map the repository category fields into editor render fields
                        var _fields = [];
                        var _categoryFields = (category[enColCERepositoryCategoryProperty.CategoryFields] || []);

                        for (var f = 0; f < _categoryFields.length; f++) {
                            var _categoryField = _categoryFields[f];
                            var _repoFieldID = _categoryField[enColRepositoryCategoryFieldProperty.FieldID];
                            var _repoField = _this.m_lookupRepositoryField[_repoFieldID];

                            if (_categoryField[enColRepositoryCategoryFieldProperty.IsVisbleUserField] && _repoField &&
                                util_forceString(_repoField[enColRepositoryFieldProperty.PropertyPath]) != "") {

                                var _propertyPath = _repoField[enColRepositoryFieldProperty.PropertyPath];

                                try {
                                    _propertyPath = eval(_propertyPath);
                                } catch (e) {

                                    //if the expression cannot be evaluated, check if it is a JSON object
                                    _propertyPath = util_parse(_propertyPath);
                                }
                                
                                //support for custom overrides using JSON objects for property path
                                if (typeof _propertyPath === "object") {
                                    var _temp = util_extend({ "PropertyPath": null, "DisplayPropertyPath": null }, _propertyPath);

                                    _propertyPath = eval(_temp.DisplayPropertyPath);
                                }

                                if (_propertyPath && typeof _propertyPath === "string") {
                                    var _field = new CEditorRenderField();

                                    //check if the user control uses an instance type which requires the options to be carried over
                                    if (_repoField[enColRepositoryFieldProperty.EditorDataTypeID] == enCEEditorDataType.UserControl) {

                                        var _temp = _field[enColCEditorRenderFieldProperty.Options];

                                        try {
                                            _temp = util_parse(_repoField[enColRepositoryFieldProperty.OptionJSON]);

                                            if (_temp && _temp["UserControlInstance"] == "CRepositoryController.CFieldUserControl") {
                                                _field[enColCEditorRenderFieldProperty.Options] = _temp;
                                            }
                                        } catch (e) {
                                        }
                                    }

                                    _field[enColCEditorRenderFieldProperty.Title] = _repoField[enColRepositoryFieldProperty.Name];
                                    _field[enColCEditorRenderFieldProperty.EditorDataTypeID] = _repoField[enColRepositoryFieldProperty.EditorDataTypeID];
                                    _field[enColCEditorRenderFieldProperty.PropertyPath] = _propertyPath;

                                    _instance.InitRenderField(_field);

                                    _fields.push(_field);
                                }
                                else {
                                    console.log(_repoField);
                                    util_logError("Category Field not handled || Property path: " + _repoField[enColRepositoryFieldProperty.PropertyPath]);
                                }
                            }
                        }

                        category["_editorRenderFields"] = _fields;

                        _lookup[_documentTypeID] = category;

                        _instance.DOM.ToggleIndicator(false);

                        _callback();
                    });
                }
                else {
                    _callback();
                }
            }
        },
        "LookupRenderField": {},    //populated below
        "ListPageSize": PAGE_SIZE,
        "PopupPageSize": 15,
        "HighlightEncoder": null,
        "MiscellaneousClassificationID": util_forceInt("%%TOK|ROUTE|PluginEditor|MiscellaneousClassificationID%%", enCE.None),
        "MiscellaneousPlatformID": util_forceInt("%%TOK|ROUTE|PluginEditor|MiscellaneousPlatformID%%", enCE.None),
        "RepositoryComponentLibraryID": util_forceInt("%%TOK|ROUTE|PluginEditor|RepositoryComponentLibraryID%%", enCE.None),
        "RepositoryResourceController": (initOpts.IsDisableExtControllerInit ? null : new CRepositoryController()), //requires: the repository resource related definition as well
        "CacheURL": {
            "KOL": {}
        }
    };

    //cleanup the date based fields
    delete _instance.Data.DefaultEntityKOL[enColKeyOpinionLeaderProperty.DateModified];
    delete _instance.Data.DefaultEntityEvent[enColEventProperty.DateModified];
    delete _instance.Data.DefaultEntityActivity[enColActivityProperty.DateModified];

    _instance["State"] = {
        "ControllerRenderOptions": {
            "IsExternalMode": false, "AddViewMode": null, "HasExternalAddMode": false
        }
    };

    _instance["InitRenderField"] = function (field) {

        var _dataType = field[enColCEditorRenderFieldProperty.EditorDataTypeID];

        //set internal ID
        var _id = _instance.Data.NextRenderFieldID++;

        field["_id"] = _id;

        switch (_dataType) {

            case enCEEditorDataType.Dropdown:
            case enCEEditorDataType.Listbox:

                //set wrapper field item
                var _fieldItem = {
                    "_renderList": {
                        "HasDefault": undefined,
                        "LabelDefaultText": null,
                        "DefaultListValue": undefined,
                        "Data": [],
                        "PropertyText": null,
                        "PropertyValue": null,
                        "InstanceType": null
                    }
                };

                var _render = util_extend(_fieldItem["_renderList"], field[enColCEditorRenderFieldProperty.Options], true, true);
                var _instanceTypeStr = _render.InstanceType;

                if (_render.InstanceType) {
                    _render.InstanceType = eval(_render.InstanceType);
                }
                
                if (_render["IsListBoxPopupMode"] == true && (_instanceTypeStr == "CEKeyOpinionLeaderActivity" || _instanceTypeStr == "CEKeyOpinionLeaderEvent") &&
                    _render["Attributes"] && _render.Attributes["data-view-entity-type"] == "KOL") {

                    var _propertyID = null;
                    var _propertyIDName = null;

                    switch (_instanceTypeStr) {

                        case "CEKeyOpinionLeaderActivity":
                            _propertyID = enColKeyOpinionLeaderActivityProperty.KeyOpinionLeaderID;
                            _propertyIDName = enColKeyOpinionLeaderActivityProperty.KeyOpinionLeaderIDName;
                            break;

                        case "CEKeyOpinionLeaderEvent":
                            _propertyID = enColKeyOpinionLeaderEventProperty.KeyOpinionLeaderID;
                            _propertyIDName = enColKeyOpinionLeaderEventProperty.KeyOpinionLeaderIDName;
                            break;
                    }

                    _render["GetDisplayLabelHTML"] = function (opts) {

                        var _kolBridgeItem = opts.Item;
                        var _name = _kolBridgeItem[_propertyIDName];
                        var _id = _kolBridgeItem[_propertyID];
                        var _html = "";

                        _html += "<div class='ProfileListItemKOL'>" +
                                 "  <div class='EditorImageButton ImageUserProfile'>" +
                                 "      <div class='ImageIcon' " +
                                             util_htmlAttribute("style", "background-image: url('" + _instance.Utils.ConstructKeyOpinionLeaderProfileURL({ "ID": _id }) + "')") +
                                             "  />" +
                                 "  </div>" +
                                 "  <div class='Label'>" + (opts["BaseGetLabelHTML"] ? opts.BaseGetLabelHTML.call(this, opts) : util_htmlEncode(_name)) + "</div>" +
                                 "</div>";

                        return _html;
                    };
                }
                else if (_render["IsListBoxPopupMode"] == true &&
                        (_instanceTypeStr == "CERepositoryResourceActivity" || _instanceTypeStr == "CERepositoryResourceEvent" ||
                         _instanceTypeStr == "CERepositoryResourceKeyOpinionLeader") &&
                         _render["Attributes"] && _render.Attributes["data-view-entity-type"] == "Resource") {

                    var _propertyID = null;

                    switch (_instanceTypeStr) {

                        case "CERepositoryResourceEvent":
                            _propertyID = enColRepositoryResourceEventProperty.RepositoryResourceFileID;
                            break;

                        case "CERepositoryResourceActivity":
                            _propertyID = enColRepositoryResourceActivityProperty.RepositoryResourceFileID;
                            break;

                        case "CERepositoryResourceKeyOpinionLeader":
                            _propertyID = enColRepositoryResourceKeyOpinionLeaderProperty.RepositoryResourceFileID;
                            break;
                    }

                    _render["GetDisplayLabelHTML"] = function (opts) {
                        var _bridgeItem = opts.Item;
                        var _fileID = util_forceInt(_bridgeItem[_propertyID], enCE.None);
                        var _html = "";
                        var _url = "javascript: void(0);";
                        var _hasFile = (_fileID != enCE.None);

                        if (_hasFile) {
                            _url = _instance.Utils.ConstructDownloadURL({
                                "TypeID": "editor", "Item": _bridgeItem, "Property": _propertyID
                            });
                        }

                        _html += "<a class='LinkDownload" + (_hasFile ? "" : " LinkDisabled") + "' data-role='none' data-rel='external' target='_blank' " +
                                 util_htmlAttribute("href", _url) + (_hasFile ? " title='Download'" : "") + " style='margin-right: 0.25em;'>" +
                                 "<div class='EditorImageButton ImageDownloadFile'>" +
                                 "  <div class='ImageIcon' />" +
                                 "</div>" +
                                 "</a>";

                        _html += util_htmlEncode(opts.Name);

                        return _html;
                    };
                }

                field["_fieldItem"] = _fieldItem;

                break;

            case enCEEditorDataType.UserControl:

                var _fieldItem = {
                    "_options": field[enColCEditorRenderFieldProperty.Options]
                };

                if (i == 0 &&
                    (field[enColCEditorRenderFieldProperty.PropertyPath] == enColKeyOpinionLeaderProperty.CompanyUserID ||
                    field[enColCEditorRenderFieldProperty.PropertyPath] == enColKeyOpinionLeaderProperty.CompanyUserDisplayName
                    )) {
                    _fieldItem["_options"] = util_extend({ "UserControlInstance": "CKeyOpinionLeaderUserSearchControl" }, _fieldItem["_options"]);
                }

                field["_fieldItem"] = _fieldItem;

                break;

            case enCEEditorDataType.Label:

                var _fieldItem = {
                    "_options": field[enColCEditorRenderFieldProperty.Options]
                };

                field["_fieldItem"] = _fieldItem;

                break;
        }

        _instance.Data.LookupRenderField[_id] = field;

    };  //end: InitRenderField

    //append the view sub type toggle filter to the Events Activity group (primary filter)
    var _eventActivityFilters = _instance.Data.LookupGroupFilters.Primary.Events;
    var _childViewToggleFilter = new CFilterGroupDetail();

    _childViewToggleFilter[enColCFilterGroupDetailProperty.EntityTypeID] = _instance.Data.FilterEntityTypeSwitchEventActivityID;
    _childViewToggleFilter[enColCFilterGroupDetailProperty.Name] = "";
    _childViewToggleFilter[enColCFilterGroupDetailProperty.Title] = "";

    _eventActivityFilters.push(_childViewToggleFilter);

    //initialize the fields
    var _arr = [_instance.Data.RenderOptionDetailViewKOL, _instance.Data.RenderOptionDetailPopupViewKOL,
                _instance.Data.RenderOptionDetailViewEvent, _instance.Data.RenderOptionDetailPopupViewEvent,
                _instance.Data.RenderOptionDetailViewActivity, _instance.Data.RenderOptionDetailPopupViewActivity];

    for (var i = 0; i < _arr.length; i++) {
        var _list = _arr[i];

        for (var f = 0; f < _list.length; f++) {
            var _field = _list[f];

            _instance.InitRenderField(_field);
        }
    }

    //cleanup placeholder property values
    var _fnRemoveProperty = function (target, props) {
        for (var p = 0; p < props.length; p++) {
            var _prop = props[p];

            delete target[_prop];
        }
    };

    _fnRemoveProperty(_instance.Data.DefaultEntityEvent, [enColEventProperty.StartDate, enColEventProperty.EndDate]);
    _fnRemoveProperty(_instance.Data.DefaultEntityActivity, [enColActivityProperty.StartDate, enColActivityProperty.EndDate]);

    _instance["PluginInstance"] = null;
    _instance["FileUploadSupportedExt"] = ["jpg", "jpeg", "png", "gif", "doc", "docx", "xlsx", "xls", "xlsm", "ppt", "pptx", "pdf", "txt"];
};

CKeyOpinionLeaderController.prototype.Bind = function (options, callback) {

    var _callback = function () {

        if (callback) {
            callback();
        }
    };

    options = util_extend({
        "PluginInstance": null, "LayoutManager": null, "Element": null
    }, options);
    
    var _pluginInstance = options.PluginInstance;
    var _controller = this;

    var $element = $(options.Element);

    if (options.LayoutManager) {
        options.LayoutManager.ToolbarSetButtons({ "IsHideEditButtons": true });
    }

    if ($element.length == 0) {
        $element = $(_controller.DOM.Element);
    }

    _controller.State.ControllerRenderOptions = util_extend({ "IsExternalMode": false, "AddViewMode": null, "HasExternalAddMode": false },
                                                            $element.closest("[" + util_renderAttribute("pluginEditor_viewController") + "]")
                                                                    .data("ControllerRenderOptions")
                                                           );

    _controller.State.ControllerRenderOptions.IsExternalMode = util_forceBool(_controller.State.ControllerRenderOptions.IsExternalMode, false);
    _controller.State.ControllerRenderOptions.AddViewMode = util_forceString(_controller.State.ControllerRenderOptions.AddViewMode, "");
    _controller.State.ControllerRenderOptions.HasExternalAddMode = (_controller.State.ControllerRenderOptions.IsExternalMode &&
                                                                    _controller.State.ControllerRenderOptions.AddViewMode != ""
                                                                   );

    //HACK: hide the navigation related header and toolbar
    $element.closest(".CEditorComponentHome").addClass("CEditorComponentHomeHiddenHeader");

    var $vw = $element.children(".EditorKOLView");

    if ($vw.length == 0) {
        var _html = "";

        _html += "<div class='ViewParentToggleEdit EditorFixedView EditorKOLView' " + util_renderAttribute("view_indicator|pluginEditor_fileDisclaimer") + " " +
                 util_htmlAttribute("data-attr-view-indicator-is-transparent", enCETriState.Yes) + " " +
                 util_htmlAttribute("data-attr-view-indicator-is-fixed-position", enCETriState.Yes) + ">";  //open container tag

        var _tabContentHTML = "";
        var _activeGroupID = _controller.ActiveGroupID();

        if (_controller.State.ControllerRenderOptions.HasExternalAddMode) {
            var _currentGroup = util_arrFilter(_controller.Data.ContextGroups, "ID", _activeGroupID, true);

            _currentGroup = (_currentGroup.length == 1 ? _currentGroup[0] : {});

            _html += "<div class='DisableUserSelectable Banner'>" +
                     "  <div class='Title'>" +
                     "      <div class='Label'>" + util_htmlEncode(_currentGroup["Title"] + " — Add New") + "</div>" +
                     "  </div>" +
                     "  <div class='Actions'>" +
                     _controller.Utils.HTML.GetButton({
                         "ActionButtonID": "external_action",
                         "CssClass": "ActionButton",
                         "Content": "Return", "Attributes": {
                             "data-icon": "arrow-l",
                             "data-external-action-id": "navigate_back"
                         }
                     }) +
                     "  </div>" +
                     "</div>";
        }

        //header titles
        _html += "  <div class='DisableUserSelectable Header'>" +
                 "      <div class='Label'>" + util_htmlEncode("Lookup by:") + "</div>";

        var _fnGetFiltersHTML = function (groupID, isPrimary) {

            var _filterHTML = "";
            var _filterList = null;

            var _lookupFilters = _controller.Data.LookupGroupFilters[isPrimary ? "Primary" : "Secondary"];
            var _key = null;

            switch (groupID) {

                case _controller.Data.ID.KOL:
                    _key = "KOL";
                    break;

                case _controller.Data.ID.EventActivity:
                    _key = "Events";
                    break;

                case _controller.Data.ID.DevelopmentGoal:
                    _key = "Goals";
                    break;
            }

            _filterList = (_key ? _lookupFilters[_key] : null);
            _filterList = (_filterList || []);

            for (var f = 0; f < _filterList.length; f++) {
                var _filter = _filterList[f];
                var _title = _filter[enColCFilterGroupDetailProperty.Title];
                var _isTextInput = _filter[enColCFilterGroupDetailProperty.IsTextInput];
                var _filterOptions = util_extend({ "IsDependencyFilter": true, "AttributeStr": null }, _filter[enColCFilterGroupDetailProperty.Options]);

                var _strAttr = util_forceString(_filterOptions.AttributeStr);

                _filterHTML += "<div class='Filter' " + util_htmlAttribute("data-filter-lookup-key", _key) + " " +
                               util_htmlAttribute("data-filter-is-primary", isPrimary ? enCETriState.Yes : enCETriState.No) + " " +
                               util_htmlAttribute("data-filter-index", f) + " " +
                               util_htmlAttribute("data-filter-is-refresh-dependency", _filterOptions.IsDependencyFilter ? enCETriState.Yes : enCETriState.No) +
                               (_strAttr != "" ? " " + _strAttr : "") + ">";

                if (isPrimary) {
                    _filterHTML += (_isTextInput ?
                                   "   <input type='text' data-corners='false' data-mini='true' maxlength='1000' " + util_htmlAttribute("placeholder", _title, null, true) + " />" :
                                   "   <select data-mini='true' data-corners='false'>" +
                                   "       <option value=''>" + util_htmlEncode(_title) + "</option>" +
                                   "   </select>"
                                   );
                }
                else if (!isPrimary && !_isTextInput) {

                    //secondary filters do not support text input and are rendered as toggle flip switches
                    _filterHTML += "    <div class='Title'>" + util_htmlEncode(_title) + "</div>" +
                                   "    <div class='ViewOptions' />";
                }

                _filterHTML += "</div>";
            }

            return _filterHTML;

        };  //end: _fnGetFiltersHTML

        var _fnGetListViewTitleLabelHTML = function (title) {
            return util_htmlEncode(title) + "<span class='LabelCount'>" + util_htmlEncode("(0)") + "</span>";
        };

        for (var i = 0; i < _controller.Data.ContextGroups.length; i++) {
            var _group = _controller.Data.ContextGroups[i];
            var _groupID = _group["ID"];
            var _selected = (_groupID == _activeGroupID);

            _html += (i > 0 ? "<div class='Divider'>&nbsp</div>" : "") +
                     "<div class='TabItem LinkClickable" + (_selected ? " LinkDisabled Selected" : "") + "' " + util_htmlAttribute("data-group-index", i) + " " +
                     util_htmlAttribute("data-group-id", _groupID) + ">" +
                     "  <div class='Title'>" + util_htmlEncode(_group["Title"]) + "</div>" +
                     "</div>";

            //construct the related content view for the group
            _tabContentHTML += "<div tabindex='-1' class='ScrollbarPrimary Content' " + util_htmlAttribute("data-content-group-index", i) + " " +
                               util_htmlAttribute("data-content-group-id", _groupID) + (!_selected ? " style='display: none;'" : "") + ">";

            var _exportButtonActionHTML = "";

            if (_controller.Data.HasExportExcelFeature) {
                _exportButtonActionHTML += _controller.Utils.HTML.GetButton({
                    "CssClass": "ViewEditStateBase",
                    "ActionButtonID": "export_entity",
                    "Content": "Export Excel",
                    "Attributes": {
                        "data-icon": "arrow-r", "data-attr-export-report-type": enCReportExportType.Excel
                    }
                });
            }

            if (_controller.Data.HasExportPowerPointFeature) {
                _exportButtonActionHTML += _controller.Utils.HTML.GetButton({
                    "CssClass": "ViewEditStateBase",
                    "ActionButtonID": "export_entity",
                    "Content": "Export PPT",
                    "Attributes": {
                        "data-icon": "arrow-r", "data-attr-export-report-type": enCReportExportType.PPT
                    }
                });
            }

            switch (_groupID) {

                case _controller.Data.ID.KOL:

                    if (!_controller.State.ControllerRenderOptions.HasExternalAddMode) {
                        _tabContentHTML += _controller.GetViewHTML(
                                            {
                                                "ViewType": enCViewTypeKOL.PrimaryFilters,
                                                "CssClass": "EditorFixedViewPositionTopLeft EditorFixedViewSizeWidthA EditorFixedViewSizeHeightA",
                                                "HTML":
                                                    "<div tabindex='-1' class='ScrollableContent ScrollbarPrimary FooterStateOn'>" +
                                                    _fnGetFiltersHTML(_groupID, true) +
                                                    "</div>" +
                                                    "<div class='Footer'>" +
                                                    "    <div class='SearchableView NoEnhance PaddingScrolled'>" +
                                                    "        <input data-input-id='tbGlobalSearch' type='text' data-role='none' placeholder='Name Search...' maxlength='1000' />" +
                                                    "        <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' " +
                                                    "data-iconpos='notext' title='Clear' />" +
                                                    "    </div>" +
                                                    "</div>",
                                                "IsScrollable": false
                                            }) +
                                            _controller.GetViewHTML({
                                                "ViewType": enCViewTypeKOL.SecondaryFilters,
                                                "CssClass": "EditorFixedViewPositionA EditorFixedViewSizeWidthA EditorFixedViewSizeHeightA",
                                                "HTML":
                                                    "<div tabindex='-1' class='ScrollableContent ScrollbarPrimary'>" +
                                                    _fnGetFiltersHTML(_groupID, false) +
                                                    "</div>"
                                            }) +
                                            _controller.GetViewHTML({
                                                "ViewType": enCViewTypeKOL.Calendar,
                                                "CssClass": "EditorFixedViewPositionB EditorFixedViewSizeWidthB EditorFixedViewSizeHeightFull",
                                                "HasExpandToggle": true
                                            }) +
                                            _controller.GetViewHTML({
                                                "ViewType": enCViewTypeKOL.ActivityDetails,
                                                "CssClass": "NoPadding EditorFixedViewPositionTopRight EditorFixedViewSizeWidthA EditorFixedViewSizeHeightFull",
                                                "HasExpandToggle": true
                                            });
                    }

                    _tabContentHTML += _controller.GetViewHTML({
                                           "ViewType": enCViewTypeKOL.ListView,
                                           "CssClass": "LayoutTypeRow EditorFixedViewPositionBottomLeft EditorFixedViewSizeWidthA EditorFixedViewSizeHeightA",
                                           "HasExpandToggle": !_controller.State.ControllerRenderOptions.HasExternalAddMode,
                                           "HasRestoreInitialToggle": !_controller.State.ControllerRenderOptions.HasExternalAddMode,
                                           "IsDefaultFullscreen": _controller.State.ControllerRenderOptions.HasExternalAddMode,
                                           "HTML":
                                               "<div tabindex='-1' class='ScrollbarPrimary RC R1C1 EditorInteractiveStateMode'>" +
                                               _controller.Utils.HTML.GetButton({
                                                   "ActionButtonID": "add_entity",
                                                   "CssClass": "ActionButton",
                                                   "Content": "Add", "Attributes": { "data-icon": "plus" }
                                               }) +
                                               "   <div class='LabelFixedTitle Title'>" + _fnGetListViewTitleLabelHTML("KOL") + "</div>" +
                                               "   <div class='ListView' data-list-view-type='summary_kol' />" +
                                               "</div>" +
                                               //details profile
                                               "<div tabindex='-1' class='ScrollbarPrimary RC'>" +
                                               "   <div class='ActionButton'>" +
                                               _exportButtonActionHTML +
                                               _controller.Utils.HTML.GetButton({
                                                   "ActionButtonID": "delete_entity",
                                                   "Content": "Delete", "Attributes": { "data-icon": "delete", "style": "display: none;", "data-display-title": "KOL" }
                                               }) +
                                               _controller.Utils.HTML.GetButton({
                                                   "ActionButtonID": "cancel_edit_entity",
                                                   "Content": "Cancel", "Attributes": { "data-icon": "back", "style": "display: none;" }
                                               }) +
                                               _controller.Utils.HTML.GetButton({
                                                   "ActionButtonID": "save_entity",
                                                   "CssClass": "",
                                                   "Content": _controller.Utils.LABELS.Save, "Attributes": { "data-icon": "check", "style": "display: none;" }
                                               }) +
                                               "   </div>" +
                                               "    <div class='DetailsViewEntityKOL'>" +
                                               "        <div id='clProfileImage' class='EditorImageButton ImageUserProfile'>" +
                                               "            <div class='ImageIcon' />" +
                                               "            <div class='LabelEdit'>" + util_htmlEncode("Edit") + "</div>" +
                                               "        </div>" +
                                               _controller.GetEntityFieldHTML({
                                                   "PropertyPath": enColKeyOpinionLeaderProperty.Name, "DataType": enCEEditorDataType.Text, "IsRequired": true,
                                                   "CssClass": "LabelName",
                                                   "Title": "Name",
                                                   "InputAttributes": {
                                                       "placeholder": "Name"
                                                   }                                                   
                                               }) +
                                               _controller.GetEntityFieldHTML({
                                                   "PropertyPath": enColKeyOpinionLeaderProperty.Description, "DataType": enCEEditorDataType.FreeText,
                                                   "Attributes": {
                                                       "style": "margin-top: 1em;",
                                                       "data-attr-label-is-custom-value": enCETriState.Yes
                                                   },
                                                   "InputAttributes": {
                                                       "style": "min-height: 14em;",
                                                       "Placeholder": "Description"
                                                   },
                                                   "LabelAttributes": {
                                                       "data-render-label-type": "link"
                                                   }
                                               }) +
                                               "   </div>" +   //end: details view profile banner
                                               //comments, if applicable
                                               (_controller.Data.HasCommentsFeature ?
                                               "   <div class='ViewSection FillWidth CommentsView'>" +
                                               "       <div class='Header'>" +
                                               "           <div class='EditorImageButton ImageComments'>" +
                                               "               <div class='ImageIcon' />" +
                                               "           </div>" +
                                               "           <div class='Title'>" +
                                               util_htmlEncode("Comments") + "&nbsp;<span class='LabelCount'>" + util_htmlEncode("(0)") + "</span>" +
                                               "            </div>" +
                                               _controller.Utils.HTML.GetButton({
                                                   "ActionButtonID": "add_comment",
                                                   "CssClass": "ActionButton",
                                                   "Content": "Add", "Attributes": { "data-icon": "plus" }
                                               }) +
                                               "       </div>" +
                                               "       <div class='ListView' data-list-view-type='comments' />" +
                                               "   </div>" :
                                               ""
                                               ) +
                                               //user ratings, if applicable
                                               (_controller.Data.HasRatingsFeature ?
                                               "   <div class='ViewSection FillWidth RatingsView'>" +
                                               "       <div class='Header'>" +
                                               "           <div class='EditorImageButton ImageComments'>" +
                                               "               <div class='ImageIcon' />" +
                                               "           </div>" +
                                               "           <div class='Title'>" +
                                               util_htmlEncode(_controller.Data.LayoutRatings["Title"]) +
                                               "            </div>" +
                                               "       </div>" +
                                               "       <div class='Content' />" +
                                               "   </div>" :
                                               ""
                                               ) +
                                               "</div>" +
                                               //details extended
                                               "<div tabindex='-1' class='ScrollbarPrimary RC DetailsViewExtKOL'>" +
                                               "   <div class='LabelFixedTitle Title'>" + util_htmlEncode("Details") + "</div>" +
                                               "   <div class='Content'>" +
                                               _controller.GetRenderOptionTableHTML({ "List": _controller.Data.RenderOptionDetailViewKOL }) +
                                               "   </div>" +
                                               "</div>" +
                                               "<div tabindex='-1' class='ScrollbarPrimary RC DetailsViewFilesKOL'>" +
                                               "   <div class='LabelFixedTitle Title'>" + util_htmlEncode("Events, Activities, and Documents") + "</div>" +
                                               "   <div class='Content'>" +
                                               _controller.GetSearchListViewEditor({
                                                   "GroupID": _controller.Data.ID.KOL,
                                                   "EntityType": "Event|Activity|Resource",
                                                   "IsEntitySummaryView": true,
                                                   "ServiceParamViewType": "KOL|EventActivityResource",
                                                   "ServiceFilterIDProperty": enColKeyOpinionLeaderProperty.KeyOpinionLeaderID
                                               }) +
                                               "   </div>" +
                                               "</div>"
                                       });

                    break;  //end: KOL content

                case _controller.Data.ID.EventActivity:

                    _tabContentHTML += _controller.GetViewHTML(
                                        {
                                            "ViewType": enCViewTypeKOL.PrimaryFilters,
                                            "CssClass": "EditorFixedViewPositionTopLeft EditorFixedViewSizeWidthA EditorFixedViewSizeHeightA",
                                            "HTML":
                                                "<div tabindex='-1' class='ScrollableContent ScrollbarPrimary FooterStateOn'>" +
                                                _fnGetFiltersHTML(_groupID, true) +
                                                "</div>" +
                                                "<div class='Footer'>" +
                                                "   <div class='SearchableView NoEnhance'>" +
                                                "       <input data-input-id='tbGlobalSearch' type='text' data-role='none' placeholder='Name Search...' maxlength='1000' />" +
                                                "       <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' " +
                                                "data-iconpos='notext' title='Clear' />" +
                                                "   </div>" +
                                                "</div>",
                                            "IsScrollable": false
                                        }) +
                                        _controller.GetViewHTML(
                                        {
                                            "ViewType": enCViewTypeKOL.SecondaryFilters,
                                            "CssClass": "EditorFixedViewPositionA EditorFixedViewSizeWidthA EditorFixedViewSizeHeightA",
                                            "HTML":
                                                "<div tabindex='-1' class='ScrollableContent ScrollbarPrimary ControlViewModeSwitch'>" +
                                                _fnGetFiltersHTML(_groupID, false) +
                                                "</div>"
                                        }) +
                                        _controller.GetViewHTML(
                                        {
                                            "ViewType": enCViewTypeKOL.Calendar,
                                            "CssClass": "EditorFixedViewPositionB EditorFixedViewSizeWidthB EditorFixedViewSizeHeightFull",
                                            "HasExpandToggle": true
                                        }) +
                                        _controller.GetViewHTML(
                                        {
                                            "ViewType": enCViewTypeKOL.ActivityDetails,
                                            "CssClass": "NoPadding EditorFixedViewPositionTopRight EditorFixedViewSizeWidthA EditorFixedViewSizeHeightFull",
                                            "HasExpandToggle": true
                                        }) +
                                        _controller.GetViewHTML(
                                        {
                                            "ViewType": enCViewTypeKOL.ListView,
                                            "CssClass": "LayoutTypeRow EditorFixedViewPositionBottomLeft EditorFixedViewSizeWidthA EditorFixedViewSizeHeightA " +
                                                        "ControlViewModeSwitch",
                                            "HasExpandToggle": true, "HasRestoreInitialToggle": true,
                                            "HTML":
                                                "<div tabindex='-1' class='ScrollbarPrimary RC R1C1 EditorInteractiveStateMode'>" +
                                                _controller.Utils.HTML.GetButton({
                                                    "ActionButtonID": "add_entity",
                                                    "CssClass": "ActionButton",
                                                    "Content": "Add", "Attributes": { "data-icon": "plus" }
                                                }) +
                                                "   <div class='LabelFixedTitle Title' " + util_htmlAttribute("data-content-view-mode-id", enCContentViewModeKOL.Event) + ">" +
                                                _fnGetListViewTitleLabelHTML("Event") +
                                                "   </div>" +
                                                "   <div class='LabelFixedTitle Title' " + util_htmlAttribute("data-content-view-mode-id", enCContentViewModeKOL.Activity) + ">" +
                                                _fnGetListViewTitleLabelHTML("Activity") +
                                                "   </div>" +
                                                "   <div class='ListView' data-list-view-type='summary_event' " +
                                                util_htmlAttribute("data-content-view-mode-id", enCContentViewModeKOL.Event) + " />" +
                                                "   <div class='ListView' data-list-view-type='summary_activity' " +
                                                util_htmlAttribute("data-content-view-mode-id", enCContentViewModeKOL.Activity) + " />" +
                                                "</div>" +
                                                //details event
                                                "<div tabindex='-1' class='ScrollbarPrimary RC'>" +
                                                "   <div class='ActionButton' " + util_htmlAttribute("data-content-view-mode-id", enCContentViewModeKOL.Event) + ">" +
                                                _exportButtonActionHTML +
                                                _controller.Utils.HTML.GetButton({
                                                    "ActionButtonID": "delete_entity",
                                                    "Content": "Delete", "Attributes": { "data-icon": "delete", "style": "display: none;", "data-display-title": "Event" }
                                                }) +
                                                _controller.Utils.HTML.GetButton({
                                                    "ActionButtonID": "cancel_edit_entity",
                                                    "Content": "Cancel", "Attributes": { "data-icon": "back", "style": "display: none;" }
                                                }) +
                                                _controller.Utils.HTML.GetButton({
                                                    "ActionButtonID": "save_entity",
                                                    "CssClass": "",
                                                    "Content": _controller.Utils.LABELS.Save, "Attributes": { "data-icon": "check", "style": "display: none;" }
                                                }) +
                                                "   </div>" +
                                                "   <div class='ActionButton' " + util_htmlAttribute("data-content-view-mode-id", enCContentViewModeKOL.Activity) + ">" +
                                                _exportButtonActionHTML +
                                                _controller.Utils.HTML.GetButton({
                                                    "ActionButtonID": "delete_entity",
                                                    "Content": "Delete", "Attributes": { "data-icon": "delete", "style": "display: none;", "data-display-title": "Activity" }
                                                }) +
                                                _controller.Utils.HTML.GetButton({
                                                    "ActionButtonID": "cancel_edit_entity",
                                                    "Content": "Cancel", "Attributes": { "data-icon": "back", "style": "display: none;" }
                                                }) +
                                                _controller.Utils.HTML.GetButton({
                                                    "ActionButtonID": "save_entity",
                                                    "CssClass": "",
                                                    "Content": _controller.Utils.LABELS.Save, "Attributes": { "data-icon": "check", "style": "display: none;" }
                                                }) +
                                                "   </div>" +
                                                "   <div class='DetailsViewEntityKOL'>" +
                                               _controller.GetRenderOptionTableHTML({
                                                   "List": _controller.Data.RenderOptionDetailViewEvent,
                                                   "Attributes": { "data-content-view-mode-id": enCContentViewModeKOL.Event }
                                               }) +
                                               _controller.GetRenderOptionTableHTML({
                                                   "List": _controller.Data.RenderOptionDetailViewActivity,
                                                   "Attributes": { "data-content-view-mode-id": enCContentViewModeKOL.Activity }
                                               }) +
                                                "   </div>" +
                                                "</div>" +
                                                //details extended
                                                "<div tabindex='-1' class='ScrollbarPrimary RC DetailsViewExtKOL'>" +
                                                "   <div class='LabelFixedTitle Title' " + util_htmlAttribute("data-content-view-mode-id", enCContentViewModeKOL.Event) + ">" +
                                                util_htmlEncode("Activites and Documents") +
                                                "   </div>" +
                                                "   <div class='LabelFixedTitle Title' " + util_htmlAttribute("data-content-view-mode-id", enCContentViewModeKOL.Activity) + ">" +
                                                util_htmlEncode("Documents") +
                                                "   </div>" +
                                                "   <div class='Content'>" +
                                                _controller.GetSearchListViewEditor({
                                                    "GroupID": _controller.Data.ID.EventActivity,
                                                    "ContentViewModeID": enCContentViewModeKOL.Event,
                                                    "EntityType": "Activity|Resource",
                                                    "IsEntitySummaryView": true,
                                                    "ServiceParamViewType": "Event|ActivityResource",
                                                    "ServiceFilterIDProperty": enColEventProperty.EventID,
                                                    "Attributes": {
                                                        "data-content-view-mode-id": enCContentViewModeKOL.Event                                                        
                                                    }
                                                }) +
                                                _controller.GetSearchListViewEditor({
                                                    "GroupID": _controller.Data.ID.EventActivity,
                                                    "ContentViewModeID": enCContentViewModeKOL.Activity,
                                                    "EntityType": "Resource",
                                                    "Attributes": {
                                                        "data-content-view-mode-id": enCContentViewModeKOL.Activity
                                                    }
                                                }) +
                                                "   </div>" +
                                                "</div>" +
                                                "<div tabindex='-1' class='ScrollbarPrimary RC DetailsViewFilesKOL'>" +
                                                "   <div class='LabelFixedTitle Title'>" + util_htmlEncode("Involved") + "</div>" +
                                                "   <div class='Content'>" +
                                                _controller.GetSearchListViewEditor({
                                                    "GroupID": _controller.Data.ID.EventActivity,
                                                    "ContentViewModeID": enCContentViewModeKOL.Event,
                                                    "EntityType": "KOL",
                                                    "IsEntitySummaryView": true,
                                                    "ServiceParamViewType": "Event|KOL",
                                                    "ServiceFilterIDProperty": enColEventProperty.EventID,
                                                    "Attributes": {
                                                        "data-content-view-mode-id": enCContentViewModeKOL.Event
                                                    }
                                                }) +
                                                _controller.GetSearchListViewEditor({
                                                    "GroupID": _controller.Data.ID.EventActivity,
                                                    "ContentViewModeID": enCContentViewModeKOL.Activity,
                                                    "EntityType": "KOL",
                                                    "Attributes": {
                                                        "data-content-view-mode-id": enCContentViewModeKOL.Activity
                                                    }
                                                }) +
                                                "   </div>" +
                                                "</div>"
                                        });

                    break;  //end: events/activities content

                case _controller.Data.ID.DevelopmentGoal:

                    _tabContentHTML += _controller.GetViewHTML(
                                       {
                                           "ViewType": enCViewTypeKOL.PrimaryFilters,
                                           "CssClass": "EditorFixedViewPositionTopLeft EditorFixedViewSizeWidthA EditorFixedViewSizeHeightA",
                                           "HTML":
                                               "<div tabindex='-1' class='ScrollableContent ScrollbarPrimary FooterStateOn'>" +
                                               _fnGetFiltersHTML(_groupID, true) +
                                               "</div>" +
                                               "<div class='Footer'>" +
                                               "    <div class='SearchableView NoEnhance PaddingScrolled'>" +
                                               "        <input data-input-id='tbGlobalSearch' type='text' data-role='none' placeholder='Name Search...' maxlength='1000' />" +
                                               "        <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' " +
                                               "data-iconpos='notext' title='Clear' />" +
                                               "    </div>" +
                                               "</div>",
                                           "IsScrollable": false
                                       }) +
                                       _controller.GetViewHTML(
                                       {
                                           "ViewType": enCViewTypeKOL.SecondaryFilters,
                                           "CssClass": "EditorFixedViewPositionA EditorFixedViewSizeWidthA EditorFixedViewSizeHeightA",
                                           "HTML":
                                               "<div tabindex='-1' class='ScrollableContent ScrollbarPrimary'>" +
                                               _fnGetFiltersHTML(_groupID, false) +
                                               "</div>"
                                       }) +
                                       _controller.GetViewHTML(
                                       {
                                           "ViewType": enCViewTypeKOL.Chart,
                                           "CssClass": "EditorFixedViewPositionB EditorFixedViewSizeWidthB EditorFixedViewSizeHeightFull",
                                           "ChartType": "DevelopmentGoal"
                                       }) +
                                       _controller.GetViewHTML(
                                       {
                                           "ViewType": enCViewTypeKOL.ListView,
                                           "CssClass": "EditorFixedViewPositionBottomLeft EditorFixedViewSizeWidthA EditorFixedViewSizeHeightA",
                                           "HTML": "<div class='Title'>" + _fnGetListViewTitleLabelHTML("KOL") + "</div>" +
                                                   "<div class='ListView' data-list-view-type='summary_kol_goals' data-view-entity-type='KOL' " +
                                                   util_htmlAttribute("data-listview-is-disable-item-detail-click", enCETriState.Yes) + " />"
                                       });

                    break;  //end: development goals content

                default:
                    _tabContentHTML += "<div style='padding: 0.5em;'>" + util_htmlEncode("The feature is currently not available.") + "</div>";
                    break;
            }

            _tabContentHTML += "</div>";
        }
        
        _html += "  </div>";    //close header tag

        //content views
        _html += _tabContentHTML;

        _html += "  <div class='EditorKOLNavigationOverlay' />";    //view used as part of navigation indicator

        _html += "</div>";  //close container tag

        $element.html(_html);

        $vw = $element.children(".EditorKOLView");

        //configure renderer related events
        $vw.off("events.datepicker_onSelected");
        $vw.on("events.datepicker_onSelected", "[" + util_renderAttribute("datepickerV2") + "]", function (e, args) {
            var $this = $(this);
            var _dt = args.Value;

            if (_dt != null) {

                switch (_controller.ActiveGroupID()) {

                    case _controller.Data.ID.EventActivity:

                        //check if the related date range property does not currently have a value and as such set it to focus on the current date value

                        var $prop = $this.closest("[data-attr-prop-path]");
                        var _currentProp = $prop.attr("data-attr-prop-path");
                        var _refProp = null;

                        switch (_controller.ActiveContentViewModeID()) {

                            case enCContentViewModeKOL.Event:
                                _refProp = (_currentProp == enColEventProperty.StartDate ? enColEventProperty.EndDate : enColEventProperty.StartDate);
                                break;

                            case enCContentViewModeKOL.Activity:
                                _refProp = (_currentProp == enColActivityProperty.StartDate ? enColActivityProperty.EndDate : enColActivityProperty.StartDate);
                                break;
                        }

                        var $parent = $this.closest(".TableRenderFieldListView");
                        var $refProp = $parent.find("[" + util_htmlAttribute("data-attr-prop-path", _refProp) + "]");

                        var $refDatepicker = $refProp.find("[" + util_renderAttribute("datepickerV2") + "]");

                        var _refDate = renderer_datepicker_getDate($refDatepicker);

                        if (!_refDate && _dt) {
                            $refDatepicker.attr("data-datepicker-fallback-focus-date", _dt.getTime());
                        }

                        break;
                }
            }
        });

        $mobileUtil.refresh($element);

        _controller.DOM.View = $vw;
        _controller.DOM.GroupTabs = $vw.find(".Header > .TabItem[data-group-id]");
        _controller.DOM.GroupContents = $vw.children(".Content[data-content-group-id]");

        _controller.DOM.View.off("remove.cleanup");
        _controller.DOM.View.on("remove.cleanup", function () {

            $(window).off("resize.kol_onResize");

            var _arrFilterID = [];
            var _fnAddFilterID = function ($obj, suffix) {
                var _key = "ContextFilterID" + util_forceString(suffix);
                var _filterID = util_forceString($obj.data(_key));

                if (_filterID != "") {
                    _arrFilterID.push(_filterID);
                }
            };

            $.each(_controller.DOM.GroupContents, function () {
                var $group = $(this);
                var _groupID = $group.attr("data-content-group-id");
                var _includeViewGroups = false;

                switch (_groupID) {
                    case _controller.Data.ID.EventActivity:
                        _includeViewGroups = true;
                        break;
                }

                _fnAddFilterID($group);

                if (_includeViewGroups) {
                    _fnAddFilterID($group, "_" + enCContentViewModeKOL.Event);
                    _fnAddFilterID($group, "_" + enCContentViewModeKOL.Activity);
                }
            });

            //clean up the filters
            if (_arrFilterID.length > 0) {
                APP.Service.Action({
                    "_indicators": false, "c": "PluginEditor", "m": "EditorTempUserFilterCleanup", "args": {
                        "ListFilterID": _arrFilterID
                    }
                });
            }
        });

        var $window = $(window);
        var _offset = 0;

        try {
            if (util_isDefined("LAYOUT_CONFIGURATION_FULL")) {
                _offset += util_forceFloat(LAYOUT_CONFIGURATION_FULL.FixedFooterHeight, 0) + util_forceFloat(LAYOUT_CONFIGURATION_FULL.ContentPaddingOffset, 0) * 0.05;
            }
        } catch (e) {
        }

        $window.off("resize.kol_onResize");
        $window.on("resize.kol_onResize", $.debounce(function () {

            if (_controller.DOM.View) {
                var _windowSize = _controller.Utils.GetWindowDimensions();
                var _position = _controller.DOM.View.position();
                var _width = _windowSize.Width;
                var _height = _windowSize.Height;

                _height -= _position.top + _offset;
                _height = Math.max(_height, 300);

                $element.css("width", "calc(" + _width + "px - 0.5em)")
                        .css("height", _height + "px");
            }
        }, 100));

        $window.trigger("resize.kol_onResize");

        //bind the view events
        var _fnOnTabItemClick = function (e, args) {

            args = util_extend({ "Callback": null }, args);

            var $this = $(this);
            var _groupID = $this.attr("data-group-id");

            _controller.DOM.GroupTabs.not($this).removeClass("LinkDisabled Selected");
            $this.addClass("LinkDisabled Selected");

            _controller.DOM.View.data("ActiveGroupID", _groupID);
            _controller.RefreshActiveView({ "IsInit": true, "Callback": args.Callback });
        };

        _controller.DOM.View.off("click.onTabItemClick");
        _controller.DOM.View.on("click.onTabItemClick", ".Header > .LinkClickable.TabItem[data-group-id]:not(.Selected)", _fnOnTabItemClick);

        _controller.DOM.View.off("events.toggleHeaderTabViewState");
        _controller.DOM.View.on("events.toggleHeaderTabViewState", function (e, args) {

            args = util_extend({ "IsEnabled": true, "OnDisabledHeaderClick": null }, args);

            var $header = _controller.DOM.View.children(".Header");

            $header.toggleClass("HeaderTabsDisabled", !args.IsEnabled);

            $header.off("click.onHeaderClick");

            if (!args.IsEnabled && args.OnDisabledHeaderClick) {
                $header.on("click.onHeaderClick", args.OnDisabledHeaderClick);
            }

            _controller.DOM.View.off("click.onTabItemClick");

            if (args.IsEnabled) {
                _controller.DOM.View.on("click.onTabItemClick", ".Header > .LinkClickable.TabItem[data-group-id]:not(.Selected)", _fnOnTabItemClick);
            }
        });

        //initialize the data items for the view
        $.each(_controller.DOM.GroupContents, function () {
            var _dataItem = null;
            var $vw = $(this);
            var _handled = false;

            switch ($vw.attr("data-content-group-id")) {

                case _controller.Data.ID.KOL:
                    _dataItem = _controller.Data.DefaultEntityKOL;
                    break;

                case _controller.Data.ID.EventActivity:

                    $vw.data("EditItem_" + enCContentViewModeKOL.Event, util_extend({}, _controller.Data.DefaultEntityEvent, false, true));
                    $vw.data("EditItem_" + enCContentViewModeKOL.Activity, util_extend({}, _controller.Data.DefaultEntityActivity, false, true));

                    _handled = true;
                    break;
            }

            if (!_handled) {
                $vw.data("EditItem", util_extend({}, _dataItem, false, true));
            }
        });
    }

    if (!_pluginInstance) {
        _pluginInstance = _controller.PluginInstance;
    }

    if (!$vw.data("is-init")) {
        $vw.data("is-init", true);

        $vw.toggleClass("StateExternalModeKOL", _controller.State.ControllerRenderOptions.IsExternalMode)
           .toggleClass("StateExternalAddModeOn", _controller.State.ControllerRenderOptions.HasExternalAddMode);
    }

    setTimeout(function () {
        $(window).trigger("resize.kol_onResize");
    }, 500);

    _controller.RefreshActiveView({ "IsInit": true });

    $element.trigger("events.getComponentUserPermission", {
        "Callback": function (permSummary) {

            var _canAdmin = util_forceBool(permSummary ? permSummary.CanAdmin : null, false);

            $vw.toggleClass("AdminViewMode", _canAdmin);

            var _fn = function (canAdminLibrary) {

                canAdminLibrary = util_forceBool(canAdminLibrary, false);

                $vw.toggleClass("AdminViewModeComponentRepositoryResource", canAdminLibrary);

                if (_controller.State.ControllerRenderOptions.HasExternalAddMode) {

                    //NOTE: must force a delay to ensure that the add action is properly triggered
                    setTimeout(function () {

                        _controller.ActiveGroupContainer()
                                   .find("[data-attr-editor-controller-action-btn='add_entity']")
                                   .trigger("click.controller_buttonClick", { "IsDisableInteractiveValidation": true, "OnAddCallback": _callback });
                    }, 500);
                }
                else {
                    _callback();
                }
            };

            //retrieve the repository resource library component user permission (only if current user does not have Administrator role on active component)
            if (!_canAdmin && _controller.Data.MiscellaneousClassificationID != enCE.None && _controller.Data.MiscellaneousPlatformID != enCE.None &&
                _controller.Data.RepositoryComponentLibraryID != enCE.None) {
                $element.trigger("events.getComponentUserPermission", {
                    "IsContextFilter": false,
                    "OverrideClassificationID": _controller.Data.MiscellaneousClassificationID,
                    "OverridePlatformID": _controller.Data.MiscellaneousPlatformID,
                    "OverrideComponentID": _controller.Data.RepositoryComponentLibraryID,
                    "Callback": function (repPermSummary) {

                        //user does not have access to module, so match the role to be that of the KOL permission
                        if (!repPermSummary || !repPermSummary["Permission"] || repPermSummary.Permission["IsActive"] == false) {
                            _fn(_canAdmin);
                        }
                        else {
                            _fn(util_forceBool(repPermSummary ? repPermSummary.CanAdmin : null, false));
                        }
                    }
                });
            }
            else {
                _fn(_canAdmin);
            }
        }
    });
};

CKeyOpinionLeaderController.prototype.BindFilters = function (options) {

    options = util_extend({ "Callback": null, "FilterSelector": null, "IsDependencyTrigger": false, "ToggleIndicator": true, "IsDisableElementCache": false }, options);

    var _controller = this;

    var _callback = function () {

        if (options.ToggleIndicator) {
            _controller.DOM.ToggleIndicator(false);
        }

        if (options.Callback) {
            options.Callback();
        }
    };

    var _queue = new CEventQueue();

    if (options.ToggleIndicator) {
        _controller.DOM.ToggleIndicator(true);
    }

    var $container = _controller.ActiveGroupContainer();
    var $list = $container.data("Filters");

    if (!$list || $list.length == 0 || options.IsDisableElementCache) {
        $list = $container.find(".Filter[data-filter-is-primary][data-filter-index]");
        $container.data("Filters", $list);
    }

    if (options.IsDependencyTrigger) {
        options.FilterSelector = util_forceString(options.FilterSelector);
        options.FilterSelector += (options.FilterSelector != "" ? ", " : "") + "[" + util_htmlAttribute("data-filter-is-refresh-dependency", enCETriState.Yes) + "]";
    }

    if (util_forceString(options.FilterSelector) != "") {
        $list = $list.filter(options.FilterSelector);
    }

    $.each($list, function () {
        var $this = $(this);

        (function ($filter) {

            _queue.Add(function (onCallback) {

                var _onBindFilterCallback = function () {
                    $filter.find("select").trigger("events.onRefreshFilterHighlight");
                    onCallback();
                };

                var _filterGroup = $filter.data("FilterGroup");
                var _isPrimary = (util_forceInt($filter.attr("data-filter-is-primary"), enCETriState.None) == enCETriState.Yes);

                if (!_filterGroup) {
                    var _key = $filter.attr("data-filter-lookup-key");
                    var _index = util_forceInt($filter.attr("data-filter-index"), -1);

                    var _lookupFilters = _controller.Data.LookupGroupFilters[_isPrimary ? "Primary" : "Secondary"];
                    var _filterList = _lookupFilters[_key];

                    _filterGroup = _filterList[_index];

                    $filter.data("FilterGroup", _filterGroup);
                }

                //check if it is custom filter group applicable to view toggles
                var _filterEntityTypeID = _filterGroup[enColCFilterGroupDetailProperty.EntityTypeID];

                if (_filterEntityTypeID == _controller.Data.FilterEntityTypeSwitchEventActivityID) {

                    //set data attribute that the filter has a custom entity type ID (required for other events to search for and update this filter directly)
                    $filter.attr("data-filter-entity-type-id", _filterEntityTypeID);

                    var $ddl = $filter.find("select");

                    $filter.addClass("FilterDisableHighlight");

                    util_dataBindDDL($ddl, [{ "Text": "EVENT", "Value": enCContentViewModeKOL.Event }, { "Text": "ACTIVITY", "Value": enCContentViewModeKOL.Activity }],
                                     "Text", "Value", util_forceInt($ddl.val(), _controller.Data.DefaultContentViewModeID), false);

                    $ddl.off("change.onToggleViewMode");
                    $ddl.on("change.onToggleViewMode", function (e, args) {

                        args = util_extend({ "Callback": null }, args);
                        var $this = $(this);

                        var _viewMode = util_forceInt($this.val(), enCE.None);

                        _controller.SetActiveGroupContentViewMode({ "ViewMode": _viewMode, "Callback": args.Callback });

                    }); //end: change.onToggleViewMode

                    _onBindFilterCallback();
                }
                else {

                    _controller.ProjectOnPopulateFilter({
                        "Element": $filter, "FilterGroup": _filterGroup, "IsPrimary": _isPrimary, "Callback": function () {
                            setTimeout(_onBindFilterCallback, 10);
                        }
                    });
                }
            });

        })($this);
    });

    //set the view group's filter value selections
    //TODO performance fix for selective updates?
    _queue.Add(function (onCallback) {
        _controller.SetFilterSelections({ "Callback": onCallback });
    });

    _queue.Run({ "Callback": _callback });
};

CKeyOpinionLeaderController.prototype.SetFilterSelections = function (options) {

    options = util_extend({ "HasIndicators": true, "IsDisableElementCache": false, "Callback": null }, options);

    var _controller = this;
    var _selections = {};
    var _callback = function () {

        if (options.HasIndicators) {
            _controller.DOM.ToggleIndicator(false);
        }
        
        if (options.Callback) {
            options.Callback();
        }

    };  //end: _callback

    var $container = _controller.ActiveGroupContainer();
    var $list = $container.data("Filters");

    if (!$list || $list.length == 0 || options.IsDisableElementCache) {
        $list = $container.find(".Filter[data-filter-is-primary][data-filter-index]");
        $container.data("Filters", $list);
    }

    $.each($list, function () {
        var $filter = $(this);
        var _filterGroup = $filter.data("FilterGroup");
        var _isPrimary = (util_forceInt($filter.attr("data-filter-is-primary"), enCETriState.None) == enCETriState.Yes);

        console.log(enColCFilterGroupDetailProperty.EntityTypeID);
        var _entityTypeID = _filterGroup[enColCFilterGroupDetailProperty.EntityTypeID];
        var _isTextInput = _filterGroup[enColCFilterGroupDetailProperty.IsTextInput];
        var _values = [];

        if (_isPrimary) {
            var $input = $filter.find(_isTextInput ? "input[type='text']" : "select");

            _values.push($input.val());
        }
        else {

            var $vwListToggle = $filter.find("[" + util_renderAttribute("pluginEditor_listToggle") + "]");

            _values = {};
            $vwListToggle.trigger("events.getListToggleSelections", _values);

            _values = _values.Result;
        }

        _selections[_entityTypeID] = _values;
    });

    if (options.HasIndicators) {
        _controller.DOM.ToggleIndicator(true);
    }

    _controller.GetContextFilterID(function (filterID) {

        APP.Service.Action({
            "_indicators": false, "c": "PluginEditor", "m": "KOL_SaveFilterSelections", "args": {
                "FilterID": filterID,
                "Item": _selections
            }
        }, function () {
            _callback();
        });
    });

};

CKeyOpinionLeaderController.prototype.BindSearchListViewEditor = function (options) {

    options = util_extend({ "IsDisableEditModeBind": false, "Callback": null }, options);

    var _controller = this;

    //refresh all search list view editors
    var $list = _controller.ActiveGroupContainer().find(".SearchListViewEditor");
    var _queue = new CEventQueue();

    $.each($list, function () {
        (function ($vw) {

            _queue.Add(function (onCallback) {

                if (options.IsDisableEditModeBind) {
                    $vw.data("override-disable-edit-mode", true);
                }

                $vw.trigger("events.refreshSearchListEditor",
                            {
                                "Callback": function () {
                                    if (options.IsDisableEditModeBind) {
                                        $vw.removeData("override-disable-edit-mode");
                                    }

                                    onCallback();
                                }
                            });
            });

        })($(this));
    });

    if ($list.length > 0) {
        _controller.DOM.ToggleIndicator(true);
    }

    _queue.Run({
        "Callback": function () {

            _controller.DOM.ToggleIndicator(false);

            if (options["Callback"]) {
                options.Callback();
            }

        }
    });
};

CKeyOpinionLeaderController.prototype.BindCalendarView = function (options) {

    options = util_extend({ "HasIndicators": true, "Callback": null }, options);

    var _controller = this;

    //refresh all calendar views
    var $list = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.Calendar });
    var _queue = new CEventQueue();

    $.each($list, function () {
        (function ($vw) {

            _queue.Add(function (onCallback) {
                $vw.trigger("events.onCalendarRefreshData", { "HasIndicators": options.HasIndicators, "Callback": onCallback });
            });

        })($(this));
    });

    _queue.Run({
        "Callback": function () {
            if (options["Callback"]) {
                options.Callback();
            }
        }
    });
};

CKeyOpinionLeaderController.prototype.BindFeedbackView = function (options) {

    options = util_extend({ "Callback": null }, options);

    var _controller = this;
    var _queue = new CEventQueue();

    //refresh all comment and user rating views, if applicable
    if (_controller.ActiveGroupID() == _controller.Data.ID.KOL) {

        var $container = _controller.ActiveGroupContainer();

        if (_controller.Data.HasRatingsFeature) {
            var $vwRatings = $container.find(".RatingsView:first");

            if (!$vwRatings.data("is-init-ratings-view")) {
                $vwRatings.data("is-init-ratings-view", true);

                var $content = $vwRatings.children(".Content:first");
                var RATING_LEVELS = 5;

                $vwRatings.off("events.ratings_refresh");
                $vwRatings.on("events.ratings_refresh", function (e, args) {

                    args = util_extend({ "Callback": null }, args);

                    var _onCallback = function () {
                        if (args.Callback) {
                            args.Callback();
                        }
                    };

                    var _dataItem = _controller.EditItem();
                    var _hasItem = (_dataItem && util_forceInt(_dataItem[enColKeyOpinionLeaderCommentProperty.KeyOpinionLeaderID], enCE.None) != enCE.None);

                    var _fnBindRatingGroups = function (groups) {

                        groups = (groups || []);

                        var _html = "";

                        for (var i = 0; i < groups.length; i++) {
                            var _group = groups[i];
                            var _enabled = util_forceBool(_group[enColCRatingGroupProperty.IsActive], true);
                            var _attrs = util_extend({}, _group[enColCRatingGroupProperty.Attributes]);
                            var _attrNameDelimited = "";

                            var _cssClass = util_forceString(_attrs["class"]);

                            _cssClass = "RatingGroup" + (_cssClass != "" ? " " : "") + _cssClass;

                            _attrs["class"] = _cssClass + (!_enabled ? " DisableUserSelectable EffectGrayscale Disabled" : "");

                            _html += "<div";

                            for (var _name in _attrs) {
                                _html += " " + util_htmlAttribute(_name, _attrs[_name]);

                                if (_name != "class") {
                                    _attrNameDelimited += (_attrNameDelimited != "" ? "|" : "") + _name;
                                }
                            }

                            _html += " " + util_htmlAttribute("data-rating-group-attributes", _attrNameDelimited);

                            _html += ">";   //open tag #1

                            _html += "  <div class='Title'>" +
                                     "      <div class='R1C1'>" +
                                     "          <div class='SizeSmall' " + util_renderAttribute("ratingV2") + " " +
                                     util_htmlAttribute("data-rating-is-editable", enCETriState.No) + " " + util_htmlAttribute("data-rating-has-total", enCETriState.Yes) + " " +
                                     util_htmlAttribute("data-rating-label-total-suffix", "review(s)") + " " +
                                     util_htmlAttribute("data-rating-num-levels", RATING_LEVELS) + " />" +
                                     "          <div class='Label' " + util_htmlAttribute("data-rating-prop", enColCRatingGroupProperty.RatedAverage) + ">&nbsp;</div>" +
                                     "      </div>" +
                                     "      <div class='R1C2'>" +
                                     "          <span class='Label'>" + util_htmlEncode(_group[enColCRatingGroupProperty.Title]) + "</span>" +
                                     (_enabled ?
                                     "          <div class='DisableUserSelectable LinkClickable ViewMyUserRating'>" +
                                     "              <div class='Label'>" + util_htmlEncode("My Rating: ") + "</div>" +
                                     "              <div class='EditorImageButton ImageRatingStar'>" + 
                                     "                  <div class='ImageIcon' />"  +
                                     "              </div>" +
                                     "              <div class='LabelUserRating' " +
                                     util_htmlAttribute("data-rating-prop", enColCRatingGroupProperty.UserRatedValue) + ">&nbsp;</div>" +
                                     "              <span class='EditLabel'>" + util_htmlEncode("EDIT") + "</span>" +
                                     "          </div>"
                                     :
                                     ""
                                     ) +
                                     "      </div>" +
                                     "  </div>" +
                                     (_enabled ?
                                     "  <div class='Details'>" +
                                     "      <a class='LinkClickable' data-role='button' data-theme='transparent' data-icon='arrow-d' data-iconpos='right' " +
                                     "data-corners='false' data-mini='true'>" + util_htmlEncode("Details") +
                                     "      </a>" +
                                     "  </div>" :
                                     ""
                                     ) +
                                     "  <div class='Divider' />";

                            _html += "</div>";
                        }

                        if (groups.length == 0) {
                            _html = util_htmlEncode("There are no reviews currently available.");
                        }

                        $content.html(_html);
                        $mobileUtil.refresh($content);

                        $vwRatings.data("DataItem", groups);

                        $.each($vwRatings.find(".RatingGroup"), function (index) {
                            var $group = $(this);

                            $group.trigger("events.ratings_setGroupRating", { "Item": groups[index] });
                        });

                        _controller.DOM.ToggleIndicator(false);
                        _onCallback();

                    };  //end: _fnBindRatingGroups

                    _controller.DOM.ToggleIndicator(true);

                    if (_hasItem) {
                        APP.Service.Action({
                            "_indicators": false, "c": "PluginEditor", "m": "KOL_UserRatings", "args": {
                                "KeyOpinionLeaderID": util_forceInt(_dataItem[enColKeyOpinionLeaderCommentProperty.KeyOpinionLeaderID], enCE.None)
                            }
                        }, function (result) {
                            _fnBindRatingGroups(result);
                        });
                    }
                    else {
                        _fnBindRatingGroups(null);
                    }

                }); //end: events.ratings_refresh

                $vwRatings.off("events.ratings_setGroupRating");
                $vwRatings.on("events.ratings_setGroupRating", ".RatingGroup", function (e, args) {

                    args = util_extend({ "Item": null, "IsRefreshList": false, "Callback": null }, args);

                    var $this = $(this);
                    var _callback = function () {
                        if (args.Callback) {
                            args.Callback();
                        }
                    };

                    var _groupDataItem = util_extend({}, args.Item);
                    var _avgRating = util_forceFloat(_groupDataItem[enColCRatingGroupProperty.RatedAverage], -1);
                    var _numRating = util_forceInt(_groupDataItem[enColCRatingGroupProperty.NumRatings], 0);
                    var _userRating = util_forceInt(_groupDataItem[enColCRatingGroupProperty.UserRatedValue], 0);

                    var $lblAvg = $this.data("LabelAvg");
                    var $lblUser = $this.data("LabelUser");
                    var $rating = $this.data("Rating");

                    if (!$lblAvg) {
                        $lblAvg = $this.find("[" + util_htmlAttribute("data-rating-prop", enColCRatingGroupProperty.RatedAverage) + "]");
                        $this.data("LabelAvg", $lblAvg);
                    }

                    if (!$lblUser) {
                        $lblUser = $this.find("[" + util_htmlAttribute("data-rating-prop", enColCRatingGroupProperty.UserRatedValue) + "]");
                        $this.data("LabelUser", $lblUser);
                    }

                    if (!$rating) {
                        $rating = $this.find("[" + util_renderAttribute("ratingV2") + "]");
                        $this.data("Rating", $rating);
                    }

                    var _fnForceRating = function (val, numDecimals) {
                        var _str = "";

                        numDecimals = util_forceInt(numDecimals, 0);

                        if (val <= 0) {
                            _str = "NR";
                        }
                        else {
                            _str = util_formatNumber(val, numDecimals);
                        }

                        return _str;
                    };  //end: _fnForceRating

                    $rating.trigger("events.rating_setValue", { "Value": _avgRating, "Count": _numRating });

                    $lblAvg.text(_fnForceRating(_avgRating, 1));
                    $lblUser.text(_fnForceRating(_userRating));

                    $this.data("DataItem", _groupDataItem);

                    if (args.IsRefreshList) {

                        //check if the ratings breakdown view is currently being shown
                        var $vwBreakdown = $this.find(".Details > .RatingBreakdown");

                        if ($vwBreakdown.length == 1 && $vwBreakdown.is(":visible")) {
                            $vwBreakdown.trigger("events.ratings_onBreakdownRefresh", { "Callback": _callback });
                        }
                        else {
                            _callback();
                        }
                    }
                    else {
                        _callback();
                    }

                }); //end: events.ratings_setGroupRating

                $vwRatings.off("events.ratings_getContextAttributes");
                $vwRatings.on("events.ratings_getContextAttributes", ".RatingGroup", function (e, args) {

                    var $group = $(this);

                    if (!args) {
                        args = {};
                    }

                    var _arr = util_forceString($group.attr("data-rating-group-attributes")).split("|");

                    for (var i = 0; i < _arr.length; i++) {
                        var _name = _arr[i];

                        args[_name] = $group.attr(_name);
                    }

                }); //end: events.ratings_getContextAttributes

                $vwRatings.off("click.ratings_onUserEdit");
                $vwRatings.on("click.ratings_onUserEdit", ".LinkClickable.ViewMyUserRating:not(.LinkDisabled)", function (e, args) {
                    var $this = $(this);
                    var _onClickCallback = function () {
                        $this.removeClass("LinkDisabled");
                    };

                    var $parent = $this.closest(".R1C2");
                    var $lblAction = $this.children(".EditLabel");
                    var $rating = $parent.children("[" + util_renderAttribute("ratingV2") + "]");

                    $this.addClass("LinkDisabled");
                    $this.find(".EditorImageButton.ImageRatingStar")
                         .addClass("EffectGrayscale");

                    if ($rating.length == 0) {
                        $rating = $("<div " + util_renderAttribute("ratingV2") + " " + util_htmlAttribute("data-rating-num-levels", RATING_LEVELS) + " />");
                        $rating.hide();
                        $parent.append($rating);

                        //associate the labels for the rating levels
                        $rating.data("LookupRatingLevelLabel", "%%TOK|ROUTE|PluginEditor|KOL_UserRatingLevelLabels%%");

                        $rating.data("OnClick", function (opts) {
                            $(this).closest(".R1C2").find(".ViewMyUserRating > .EditLabel").trigger("click");
                        });

                        $mobileUtil.RenderRefresh($rating, true);
                    }
                    else {
                        $rating.hide();
                    }

                    var _groupDataItem = $parent.closest(".RatingGroup").data("DataItem");
                    var _rating = null;

                    if (_groupDataItem) {
                        _rating = _groupDataItem[enColCRatingGroupProperty.UserRatedValue];
                    }

                    $rating.trigger("events.rating_setValue", { "Value": _rating })
                           .toggle("height");

                    $lblAction.text("Save")
                              .addClass("LinkClickable");

                }); //end: click.ratings_onUserEdit

                $vwRatings.off("click.ratings_onUserSave");
                $vwRatings.on("click.ratings_onUserSave", ".LinkClickable.ViewMyUserRating.LinkDisabled > .EditLabel.LinkClickable:not(.LinkDisabled)", function (e, args) {
                    var $this = $(this);
                    var $ratings = $this.closest(".R1C2").children("[" + util_renderAttribute("ratingV2") + "]");

                    $this.text("Edit")
                         .removeClass("LinkClickable");

                    var $vw = $this.closest(".ViewMyUserRating");
                    var $group = $this.closest(".RatingGroup");

                    var _dataItem = _controller.EditItem();
                    var _keyOpinionLeaderID = util_forceInt(_dataItem ? _dataItem[enColKeyOpinionLeaderCommentProperty.KeyOpinionLeaderID] : null, enCE.None);
                    
                    var _selection = { "Result": null };

                    $ratings.trigger("events.rating_getValue", _selection);
                    _selection = _selection.Result;

                    var _attrs = {};

                    $group.trigger("events.ratings_getContextAttributes", _attrs);
                    
                    _controller.DOM.ToggleIndicator(true);

                    APP.Service.Action({
                        "_indicators": false, "c": "PluginEditor", "m": "KOL_UserRatingSetRating", "args": {
                            "KeyOpinionLeaderID": _keyOpinionLeaderID,
                            "Attributes": _attrs,
                            "Rating": _selection.Value,
                            "Levels": _selection.Levels
                        }
                    }, function (userRatingResult) {

                        $vw.removeClass("LinkDisabled");
                        $vw.find(".EditorImageButton.ImageRatingStar")
                           .removeClass("EffectGrayscale");

                        $ratings.hide();

                        //refresh the group and user rating
                        APP.Service.Action({
                            "_indicators": false, "c": "PluginEditor", "m": "KOL_UserRatingByAttribute", "args": {
                                "KeyOpinionLeaderID": _keyOpinionLeaderID,
                                "Attributes": _attrs
                            }
                        }, function (result) {

                            _controller.DOM.ToggleIndicator(false);

                            $group.trigger("events.ratings_setGroupRating", {
                                "Item": result, "IsRefreshList": true, "Callback": function () {
                                    AddMessage("Rating has been successfully updated.", null, null, { "IsTimeout": true });
                                }
                            });
                        });

                    });

                }); //end: click.ratings_onUserSave

                $vwRatings.off("click.ratings_toggleListDetails");
                $vwRatings.on("click.ratings_toggleListDetails", ".RatingGroup > .Details > .LinkClickable:not(.LinkDisabled)", function () {

                    var $this = $(this);
                    
                    $this.addClass("LinkDisabled");

                    var $group = $this.closest(".RatingGroup");
                    var $details = $group.find(".Details:first");
                    var $vwBreakdown = $details.children(".RatingBreakdown");
                    var $repeater = $vwBreakdown.children(".ListView");
                    var _visible = false;

                    var _clickCallback = function () {
                        $this.removeClass("LinkDisabled");
                        $mobileUtil.ButtonUpdateIcon($this, _visible ? "arrow-d" : "arrow-u");
                    };

                    if ($vwBreakdown.length == 0) {
                        var _attrs = {};
                        var _id = "TableUserRatings_" + $vwRatings.find(".RatingGroup").index($group) + "_";

                        $group.trigger("events.ratings_getContextAttributes", _attrs);

                        for (var _name in _attrs) {
                            _id += util_forceString(_attrs[_name]) + "_";
                        }

                        var _renderOpts = util_extend({
                            "PropertyDisplayName": "DisplayName", "PropertyDate": "PostedOn", "PropertyRatedValue": "RatedValue",
                            "PropertyUsername": null,
                            "SortEnum": "", "DefaultSortEnum": "", "DefaultSortAsc": true, "PageSize": 10
                        }, "%%TOK|ROUTE|PluginEditor|KOL_UserRatingRenderOption%%");

                        $vwBreakdown = $("<div class='RatingBreakdown'>" +
                                         (_controller.Data.HasRatingsBreakdownChartFeature ? "<div class='ChartView' />" : "") +
                                         "</div>");

                        $vwBreakdown.hide();
                        $details.append($vwBreakdown);

                        $repeater = _controller.Utils.Repeater({
                            "ID": _id,
                            "CssClass": "TableMinimalList",
                            "IsTableEnhance": false,
                            "IsDisablePagingFooter": true,
                            "IsFooterNoRecords": true,
                            "DefaultNoRecordMessage": "No ratings were found.",
                            "PageSize": _renderOpts.PageSize,
                            "SortEnum": _renderOpts.SortEnum,
                            "DefaultSortEnum": _renderOpts.DefaultSortEnum,
                            "DefaultSortAsc": _renderOpts.DefaultSortAsc,
                            "SortOrderGroupKey": "kol_ratings_" + _id,
                            "Columns": [{ "id": "detail" }],
                            "RepeaterFunctions": {
                                "FieldValue": function (opts) {
                                    var _val = "";
                                    var _item = opts.Item;
                                    var _isEncode = true;

                                    if (opts.IsContent && opts.Index == 0) {

                                        var _displayName = _item[_renderOpts.PropertyDisplayName];
                                        var _dt = _item[_renderOpts.PropertyDate];
                                        var _rating = _item[_renderOpts.PropertyRatedValue];
                                        var _usernameHTML = "";

                                        if (_renderOpts.PropertyUsername) {
                                            var _username = util_forceString(_item[_renderOpts.PropertyUsername]);

                                            _usernameHTML += "<div class='LabelUsername'>" +
                                                             "[" + _controller.Utils.HTML.ParseTextLinkHTML(_username, { "linkClass": "LinkExternal WordBreak" }) + "]" +
                                                             "</div>";
                                        }

                                        _dt = util_FormatDateTime(_dt, "", null, false, { "IsValidateConversion": true });

                                        _val = "<div class='RatingDetail'>" +
                                               "    <div class='LabelDisplayName'>" +
                                               "        <span>" + util_htmlEncode(_displayName) + "</span>" + _usernameHTML +
                                               "    </div>" +
                                               "    <div class='LabelPostedOn'>" + "<span>" + util_htmlEncode(_dt) + "</span>" + "</div>" +
                                               "    <div class='SizeSmall' " + util_renderAttribute("ratingV2") + " " +
                                               util_htmlAttribute("data-rating-is-editable", enCETriState.No) + " " +
                                               util_htmlAttribute("data-rating-num-levels", RATING_LEVELS) + " " +
                                               util_htmlAttribute("data-rating-default-value", util_forceString(_rating)) +
                                               " />" +
                                               "</div>";
                                    }

                                    return _val;
                                },
                                "GetData": function (element, sortSetting, callback) {

                                    _controller.DOM.ToggleIndicator(true);

                                    var _dataItem = _controller.EditItem();

                                    var _params = {
                                        "KeyOpinionLeaderID": util_forceInt(_dataItem ? _dataItem[enColKeyOpinionLeaderCommentProperty.KeyOpinionLeaderID] : null, enCE.None),
                                        "Attributes": _attrs,
                                        "SortColumn": sortSetting.SortColumn,
                                        "SortAscending": sortSetting.SortASC,
                                        "PageSize": util_forceInt(sortSetting.PageSize, _controller.Data.ListPageSize),
                                        "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
                                    };

                                    APP.Service.Action({
                                        "_indicators": false, "c": "PluginEditor", "m": "KOL_UserRatingGetByForeignKey", "args": _params
                                    }, function (result) {

                                        _controller.DOM.ToggleIndicator(false);
                                        callback(result);
                                    });
                                },
                                "BindComplete": function (opts) {

                                    var _list = util_extend({
                                        "List": null, "NumItems": null
                                    }, opts.Data);
                                    var _sortSetting = ctl_repeater_getSortSetting(opts.Element);
                                    var $vwPagination = $details.children(".PaginationView");
                                    var _pagingHTML = _controller.Utils.HTML.Pagination({
                                        "PageSize": _sortSetting.PageSize, "CurrentPage": util_forceInt(_sortSetting["PageNo"], 1),
                                        "NumItems": _list.NumItems, "IsPagingDisplayCount": false, "IsMinimalFormat": true
                                    });

                                    if ($vwPagination.length == 0) {
                                        $vwPagination = $("<div class='PaginationView ViewMinimal' />");
                                        $details.append($vwPagination);

                                        $vwPagination.on("change.onNavigatePage", "select.DropdownPageView", function () {
                                            var $ddl = $(this);
                                            var _pageNum = util_forceInt($ddl.val(), 0);

                                            $repeater.trigger("events.refresh_list", {
                                                "NavigatePageNo": _pageNum
                                            });
                                        });
                                    }

                                    $vwPagination.html(_pagingHTML)
                                                 .trigger("create");

                                    $details.data("DataSource", _list);

                                    if (!$vwBreakdown.is(":visible")) {
                                        $vwBreakdown.slideDown("normal");
                                    }

                                    if ($details.data("OnCallback")) {
                                        var _fn = $details.data("OnCallback");

                                        $details.removeData("OnCallback");
                                        _fn.call($details);
                                    }
                                }
                            }
                        });

                        $repeater.addClass("ListView");
                        $vwBreakdown.append($repeater);

                        $mobileUtil.refresh($vwBreakdown);

                        $vwBreakdown.off("events.ratings_onBreakdownRefresh");
                        $vwBreakdown.on("events.ratings_onBreakdownRefresh", function (e, args) {

                            args = util_extend({ "Callback": null }, args);

                            var _refreshCallback = function () {
                                if (args.Callback) {
                                    args.Callback();
                                }
                            };

                            var _queue = new CEventQueue();
                            var $group = $(this).closest(".RatingGroup");
                            var $chart = $vwBreakdown.children(".ChartView");
                            var $repeater = $vwBreakdown.children(".ListView");

                            var _dataItem = _controller.EditItem();
                            var _keyOpinionLeaderID = util_forceInt(_dataItem ? _dataItem[enColKeyOpinionLeaderCommentProperty.KeyOpinionLeaderID] : null, enCE.None);
                            var _attrs = {};

                            $group.trigger("events.ratings_getContextAttributes", _attrs);

                            if ($chart.length == 1) {
                                _queue.Add(function (onCallback) {

                                    _controller.DOM.ToggleIndicator(true);

                                    APP.Service.Action({
                                        "_indicators": false, "c": "PluginEditor", "m": "KOL_UserRatingBreakdown", "args": {
                                            "KeyOpinionLeaderID": _keyOpinionLeaderID,
                                            "Attributes": _attrs
                                        }
                                    }, function (result) {

                                        var _breakdownList = (result || []);

                                        $chart.width($chart.closest(".RatingsView").outerWidth() * 0.9);

                                        var _chartOptions = {
                                            chart: {
                                                type: "bar",
                                                renderTo: $chart.get(0),
                                                height: 190
                                            },
                                            title: {
                                                text: null
                                            },
                                            exporting: {
                                                enabled: false
                                            },
                                            credits: {
                                                enabled: false
                                            },
                                            xAxis: {
                                                labels: {
                                                    style: {
                                                        color: "#CCCCCC",
                                                        fontFamily: "Arial",
                                                        textShadow: "none"
                                                    }
                                                },
                                                title: {
                                                    text: "Rating",
                                                    style: {
                                                        color: "#999999",
                                                        fontFamily: "Arial",
                                                        textShadow: "none"
                                                    }
                                                },
                                                categories: []
                                            },
                                            yAxis: {
                                                min: 0,
                                                lineWidth: 1,
                                                allowDecimals: false,
                                                labels: {
                                                    style: {
                                                        color: "#CCCCCC",
                                                        fontFamily: "Arial",
                                                        textShadow: "none"
                                                    }
                                                },
                                                title: {
                                                    text: "Reviews",
                                                    style: {
                                                        color: "#999999",
                                                        fontFamily: "Arial",
                                                        textShadow: "none"
                                                    }
                                                }
                                            },
                                            legend: {
                                                enabled: false
                                            },
                                            plotOptions: {
                                                series: {
                                                    pointWidth: 15
                                                }
                                            },
                                            series: [{
                                                name: "Reviews",
                                                data: []
                                            }]
                                        };

                                        //order by descending rating level
                                        var _series = _chartOptions.series[0];

                                        for (var i = RATING_LEVELS; i >= 1; i--) {
                                            var _val = null;
                                            var _color = null;

                                            var _breakdown = util_arrFilter(_breakdownList, enColCRatingLevelBreakdownProperty.Level, i, true);

                                            if (_breakdown.length == 1) {
                                                _breakdown = _breakdown[0];
                                                _val = util_forceInt(_breakdown[enColCRatingLevelBreakdownProperty.NumRatings], 0);
                                            }

                                            switch (i) {
                                                case 5:
                                                    _color = "#79C8A1";
                                                    break;

                                                case 4:
                                                    _color = "#ADD788";
                                                    break;

                                                case 3:
                                                    _color = "#FFD83A";
                                                    break;

                                                case 2:
                                                    _color = "#FFB13A";
                                                    break;

                                                case 1:
                                                    _color = "#FF8C5D";
                                                    break;
                                            }

                                            _chartOptions.xAxis.categories.push(i + "");
                                            _series.data.push({ "y": _val, "color": _color });
                                        }

                                        var _chartInstance = new Highcharts.Chart(_chartOptions);

                                        $chart.data("ChartInstance", _chartInstance);

                                        _controller.DOM.ToggleIndicator(false);
                                        onCallback();
                                    });
                                });
                            }

                            if ($repeater.length == 1) {
                                _queue.Add(function (onCallback) {
                                    $repeater.closest(".Details").data("OnCallback", onCallback);
                                    $repeater.trigger("events.refresh_list");
                                });
                            }

                            _queue.Run({ "Callback": _refreshCallback });

                        }); //end: events.ratings_onBreakdownRefresh
                    }
                    else {
                        _visible = $vwBreakdown.is(":visible");
                    }

                    if (_visible) {
                        $vwBreakdown.slideUp("normal", function () {
                            _clickCallback();
                        });
                    }
                    else {
                        $vwBreakdown.trigger("events.ratings_onBreakdownRefresh", { "Callback": _clickCallback });
                    }

                }); //end: click.ratings_toggleListDetails

                $vwRatings.off("remove.ratings_onCleanUp");
                $vwRatings.on("remove.ratings_onCleanUp", function () {
                    $(window).off("resize.ratings_charts");
                });

                var $window = $(window);

                $window.off("resize.ratings_charts");

                if (_controller.Data.HasRatingsBreakdownChartFeature) {

                    $window.on("resize.ratings_charts", $.debounce(function () {
                        var $charts = $vwRatings.find(".ChartView");
                        var _width = $vwRatings.outerWidth() * 0.9;

                        $.each($charts, function () {
                            try {
                                var $chart = $(this);

                                $chart.width(_width);
                                $chart.data("ChartInstance").reflow();
                            } catch (e) {
                            }
                        });
                    }, 100));
                }

            }

            _queue.Add(function (onCallback) {
                $vwRatings.trigger("events.ratings_refresh", { "Callback": onCallback });
            });
        }

        if (_controller.Data.HasCommentsFeature) {

            //comments list view
            var $list = $container.find(".ListView[data-list-view-type='comments']");

            $.each($list, function () {
                (function ($vw) {

                    _queue.Add(function (onCallback) {
                        $vw.trigger("events.onRefreshListView", { "Callback": onCallback });
                    });

                })($(this));
            });
        }
    }

    _queue.Run({
        "Callback": function () {
            if (options["Callback"]) {
                options.Callback();
            }
        }
    });
};

CKeyOpinionLeaderController.prototype.OnProcessViewForEvent = function (options) {

    options = util_extend({ "Event": null }, options);

    var _controller = this;

    switch (options.Event) {

        case "EditPopupResource":
            var _resource = options.Resource;

            _controller.Data.RenderOptionRepositoryCategoryLookup.Get({
                "DocumentTypeID": _resource[enColRepositoryResourceProperty.DocumentTypeID],
                "Callback": function (category) {

                    var _categoryID = util_forceInt(category ? category[enColRepositoryCategoryProperty.CategoryID] : null, enCE.None);

                    if (_categoryID != enCE.None) {
                        _controller.Data.RepositoryResourceController.PopupEditResource({
                            "IsExtViewMode": true,
                            "EditID": _resource[enColRepositoryResourceProperty.ResourceID],
                            "IsImpersonateAddNewFields": true,   //restrict to minimial fields similar to add new (although editing item)
                            "Size": "EditorPopupFixed ScrollbarPrimary",
                            "CategoryID": _categoryID,
                            "OnSaveCallback": function (opts) {

                                var _saveResourceItem = opts.Item;  //repository resource save item
                                var _dataItem = _controller.EditItem(); //current edit item for module

                                var $vwGroupTypeListView = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.ListView });

                                //for the active list view, search its children for Resource related property views (ensure it has an add entity type data attribute)
                                var $list = $vwGroupTypeListView.find(".PropertyView[data-attr-prop-path][data-view-entity-type='Resource'][data-add-entity-type]");
                                var _hasEditMode = false;

                                $.each($list, function () {
                                    var $vwProperty = $(this);

                                    _hasEditMode = (_hasEditMode || $vwProperty.hasClass("EditModeOn"));

                                    var _fieldID = util_forceInt($vwProperty.attr("data-attr-render-field-id"), enCE.None);
                                    var _field = _controller.Data.LookupRenderField[_fieldID];
                                    var _fieldItem = (_field && _field["_fieldItem"] ? _field["_fieldItem"] : null);

                                    if (_fieldItem && _fieldItem["_renderList"]) {
                                        var _renderList = _fieldItem["_renderList"];
                                        var _propertyPath = $vwProperty.attr("data-attr-prop-path");
                                        var _propertyMappings = _controller.GetBridgeEntityPropertyMappings({
                                            "BridgeEntityTypeID": $vwProperty.attr("data-add-entity-type")
                                        });

                                        var _valList = util_propertyValue(_dataItem, _propertyPath);

                                        if (!_valList) {
                                            _valList = [];
                                            util_propertySetValue(_dataItem, _propertyPath, _valList);
                                        }

                                        //find the item in the bridge list matching it and update its property mappings
                                        var _bridgeItem = util_arrFilter(_valList, _renderList.PropertyValue,
                                                                         _saveResourceItem[enColRepositoryResourceProperty.ResourceID], true);

                                        if (_bridgeItem.length == 1) {
                                            _bridgeItem = _bridgeItem[0];

                                            for (var _prop in _propertyMappings) {
                                                if (_prop == "_transaction") {

                                                    var _transactionConfig = _propertyMappings[_prop];

                                                    //update the transaction ID for cached list for the resource
                                                    var _resourceBridgeList = util_propertyValue(_resource, _transactionConfig.PropertyPath);

                                                    _resourceBridgeList = (_resourceBridgeList || []);

                                                    var _search = util_arrFilter(_resourceBridgeList, _renderList.PropertyValue,
                                                                                 _saveResourceItem[enColRepositoryResourceProperty.ResourceID], true);

                                                    var _transactionID = null;

                                                    if (_search.length == 1) {
                                                        _search = _search[0];

                                                        //offset by 1 for the current save action
                                                        _transactionID = util_forceInt(_search[_transactionConfig.PropertyPathTransactionID], 0) + 1;
                                                    }
                                                    else {
                                                        _transactionID = _bridgeItem[_transactionConfig.PropertyPathTransactionID];
                                                    }

                                                    _bridgeItem[_transactionConfig.PropertyPathTransactionID] = _transactionID;
                                                }
                                                else {
                                                    var _valueProp = _propertyMappings[_prop];

                                                    _bridgeItem[_prop] = _saveResourceItem[_valueProp];
                                                }
                                            }
                                        }

                                        //rebind the current item for the applicable property path (restricted bind of elements)
                                        _controller.DataItemBind({
                                            "FilterSelector": "[" + util_htmlAttribute("data-attr-prop-path", _propertyPath) + "]",
                                            "IsSelectiveUpdate": true
                                        });
                                    }

                                });

                                if (!_hasEditMode) {

                                    //force refresh of the current selected item (since currently not in edit mode)
                                    var $search = $vwGroupTypeListView.find(".R1C1:first .ListView[data-list-view-type]:first [data-attr-item-id] .EntityLineItem.Selected:first");

                                    if ($search.length == 1) {

                                        //remove the selected/disabled state (to allow force refresh)
                                        $search.removeClass("LinkDisabled Selected")
                                               .trigger("click", {
                                                   "IsDisableInteractiveValidation": true
                                               });
                                    }
                                }
                            }
                        });
                    }
                }
            });

            break;  //end: EditPopupResource

        default:
            util_logError("OnProcessViewForEvent :: unhandled for event - " + options.Event);
            break;
    }
};

CKeyOpinionLeaderController.prototype.RefreshActiveView = function (options) {

    options = util_extend({ "Callback": null, "IsInit": false, "IsDisableElementCache": false, "IsFilterUpdate": false }, options);

    var _controller = this;
    var $element = null;

    var _callback = function () {

        _controller.DOM.ToggleIndicator(false);

        if (options.Callback) {
            options.Callback();
        }
    };

    _controller.DOM.ToggleIndicator(true);

    $element = _controller.ActiveGroupContainer();

    if (options.IsInit) {
        _controller.DOM.GroupContents.not($element).hide();
        $element.show();
    }

    var _queue = new CEventQueue();

    //find all views that require toggle based on content view mode
    //NOTE: due to race conditions with the following list view element bind, this cannot be performed within a queue (must be executed outside of queue callbacks)
    var $list = $element.find(".ControlViewModeSwitch");
    var _fnGetNextID = function ($this) {
        var _id = util_forceInt($this.data("temp-id"), 0);

        _id++;
        $this.data("temp-id", _id);

        return _id;
    };

    var _activeContentViewModeID = _controller.ActiveContentViewModeID();

    $.each($list, function () {
        var $parent = $(this);

        $.each($parent.find("[data-content-view-mode-id]"), function () {
            var $vw = $(this);

            //retrieve (or initialize) the unique temp ID for the view
            var _id = util_forceInt($vw.attr("data-content-temp-view-id"), enCE.None);

            if (_id == enCE.None) {
                _id = _fnGetNextID($parent);
                $vw.attr("data-content-temp-view-id", _id);
            }

            //check if the view mode matches the current content view mode
            var _valid = (_activeContentViewModeID == util_forceInt($vw.attr("data-content-view-mode-id"), enCE.None));

            if (_valid) {

                //check if the view was previously removed/placeholder, in which case will restore it from the parent element data cache
                if ($vw.hasClass("EditorDetachedPlaceholder")) {
                    var $vwRestore = $parent.data("ContentView_" + _id);

                    $vwRestore.insertAfter($vw);

                    //remove the placeholder
                    $vw.remove();

                    //remove the data since restored to DOM
                    $parent.removeData("ContentView_" + _id);
                }
            }
            else {

                //invalid view shown for the current view mode, so detach it (if it has not already been removed/placeholder)
                if (!$vw.hasClass("EditorDetachedPlaceholder")) {

                    var $placeholder = $("<div class='EditorDetachedPlaceholder' />");

                    //copy over the temp ID and view mode ID to the placeholder
                    $placeholder.attr({ "data-content-temp-view-id": _id, "data-content-view-mode-id": $vw.attr("data-content-view-mode-id") });

                    $placeholder.insertAfter($vw);

                    //detach and bind using ID to the parent element
                    $vw = $vw.detach();
                    $parent.data("ContentView_" + _id, $vw);
                }
            }
        });
    });

    //force valid filter ID
    _queue.Add(function (onCallback) {
        _controller.GetContextFilterID(onCallback);
    });

    if (!options.IsFilterUpdate) {

        //bind the filters
        _queue.Add(function (onCallback) {
            _controller.BindFilters({ "Callback": onCallback, "ToggleIndicator": false, "IsDisableElementCache": options.IsDisableElementCache });
        });
    }

    //bind the search editors
    _queue.Add(function (onCallback) {

        $.each($element.find(".SearchListViewEditor"), function () {
            var $this = $(this);

            if (!$this.data("is-init-search-list-view-editor")) {
                $this.data("is-init-search-list-view-editor", true);

                var $tb = $this.find(".R1C1 input[type='text']");
                var $ddl = $this.find(".R1C2 select");
                var $vwListView = $this.children(".ListView");

                //bind the filter dropdown
                var _entityType = $this.attr("data-entity-type");
                var _data = null;

                var _fnGetOptionData = function (type) {

                    var _ret = null;

                    switch (type) {

                        case "KOL":
                            _ret = "%%TOK|ROUTE|PluginEditor|KOL_SearchListViewEditorFilters|{ EntityType: \"KOL\" }%%";
                            break;

                        case "Resource":
                            _ret = "%%TOK|ROUTE|PluginEditor|KOL_SearchListViewEditorFilters|{ EntityType: \"Resource\" }%%";
                            break;

                        case "Activity":
                            _ret = "%%TOK|ROUTE|PluginEditor|KOL_SearchListViewEditorFilters|{ EntityType: \"Activity\" }%%";
                            break;

                        case "Event":
                            _ret = "%%TOK|ROUTE|PluginEditor|KOL_SearchListViewEditorFilters|{ EntityType: \"Event\" }%%";
                            break;
                    }

                    return _ret;

                };  //end: _fnGetOptionData

                if (util_forceString(_entityType) != "") {
                    var _arr = _entityType.split("|");

                    if (_arr.length == 1) {
                        _data = _fnGetOptionData(_entityType);
                    }
                    else {

                        _data = [];

                        for (var t = 0; t < _arr.length; t++) {
                            var _val = _fnGetOptionData(_arr[t]);

                            _val = (_val || []);

                            if (_val.length > 0) {
                                _data.push(_val[0]);
                            }
                        }
                    }
                }

                _data = (_data || []);

                var _hasGroups = (_data.length > 1);

                if (!_hasGroups && _data.length == 1) {
                    var _temp = _data[0];

                    _data = _temp["Items"];
                }

                var _blankLabel = util_propertyValue(_controller, "Utils.LABELS.DefaultSelection");

                _blankLabel = util_forceString(_blankLabel);

                util_dataBindDDL($ddl, _data, enColCFilterGroupItemProperty.Text, enColCFilterGroupItemProperty.Value, $ddl.val(), _hasGroups, "all", _blankLabel, _hasGroups);

                $ddl.off("change.onSearchListEditorFilter");
                $ddl.on("change.onSearchListEditorFilter", function (e, args) {

                    args = util_extend({ "Callback": null }, args);

                    $vwListView.trigger("events.refreshListView", { "Callback": args.Callback });
                });

                //configure the searchable text view
                var $vwRepeater = null;

                $tb.attr(DATA_ATTRIBUTE_RENDER, "searchable_field")
                   .data("SearchConfiguration",
                         {
                             "OnRenderResult": function (result, opts) {
                                 $vwListView.trigger("events.refreshListView", { "IsCache": true, "Data": result, "SearchParam": opts });
                             },
                             "OnSearch": function (opts, callback) {

                                 if (!$vwRepeater) {
                                     $vwRepeater = $vwListView.find(".CRepeater");
                                 }

                                 var _sortSettings = ctl_repeater_getSortSetting($vwRepeater);

                                 _sortSettings["PageNo"] = 1;

                                 var _fnGetList = $vwListView.data("GetList");

                                 _fnGetList($vwRepeater, _sortSettings, function (result) {
                                     callback(result);
                                 });
                             }
                         });

                $vwListView.off("events.refreshListView");
                $vwListView.on("events.refreshListView", function (e, args) {

                    args = util_extend({
                        "IsCache": false, "Data": null, "SearchParam": null
                    }, args);

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

                $mobileUtil.RenderRefresh($tb, true);

                $this.data("SearchElement", $tb)
                     .data("FilterTypeElement", $ddl)
                     .data("ClearButtonElement", $this.find(".R1C1 .SearchableView .SearchClearButton.ui-btn"));

                $this.off("events.onSearchListEditorSetEditable");
                $this.on("events.onSearchListEditorSetEditable", function (e, args) {
                    args = util_extend({ "IsEditable": true }, args);

                    $this.data("SearchElement").textinput(!args.IsEditable ? "enable" : "disable");
                    $this.data("FilterTypeElement").selectmenu(!args.IsEditable ? "enable" : "disable");
                    $this.data("ClearButtonElement").toggleClass("ui-disabled", args.IsEditable);
                });

                $this.off("events.refreshSearchListEditor");
                $this.on("events.refreshSearchListEditor", function (e, args) {

                    args = util_extend({ "Callback": null }, args);

                    var _bindCallback = function () {
                        if (args.Callback) {
                            args.Callback();
                        }
                    };

                    var $listView = $this.data("ListView");

                    if (!$listView || $listView.length == 0) {
                        $listView = $this.find(".ListView[data-list-view-type='searchViewEditor']");
                        $this.data("ListView", $listView);
                    }

                    if ($listView.length == 1) {
                        $listView.trigger("events.onRefreshListView", { "Callback": _bindCallback });
                    }
                    else {
                        _bindCallback();
                    }

                }); //end: events.refreshSearchListEditor
            }
        });

        onCallback();
    });

    var _fnBindListView = function ($listView, onCallback) {

        var $repeater = null;

        if (!$listView.data("is-init-listview")) {

            var _isWrapper = true;
            var _type = $listView.attr("data-list-view-type");
            var _repeaterOpts = {
                "CanSelect": true,
                "IsEntitySummaryView": false,
                "IsDisableEntityTypeBadge": false,
                "ViewAction": {
                    "Enabled": false,
                    "EntityType": ""
                },
                "SortEnum": "",
                "DefaultSortEnum": null,
                "DefaultNoRecordMessage": null,
                "Columns": [],
                "PropertyDataIdentifier": null,
                "OnConfigureParams": null,
                "LabelItemCount": null,
                "PropertyValidateUserID": null
            };

            var _fnGetList = null;

            switch (_type) {

                case "summary_kol":
                case "summary_kol_goals":

                    if (_type == "summary_kol_goals") {
                        _repeaterOpts.LabelItemCount = $listView.closest(".EditorCardViewKOL").find(".Title:first > .LabelCount");
                    }
                    else {
                        _repeaterOpts.LabelItemCount = $listView.closest(".RC").find(".Title:first > .LabelCount");
                    }

                    _repeaterOpts.SortEnum = "enColKeyOpinionLeader";
                    _repeaterOpts.DefaultSortEnum = _repeaterOpts.SortEnum + "." + enColKeyOpinionLeaderProperty.Name;
                    _repeaterOpts.PropertyDataIdentifier = enColKeyOpinionLeaderProperty.KeyOpinionLeaderID;

                    _repeaterOpts.Columns.push({
                        "SortEnum": _repeaterOpts.DefaultSortEnum,
                        "PropertyPath": enColKeyOpinionLeaderProperty.Name
                    });

                    _fnGetList = function (element, sortSetting, callback) {

                        var _callback = function (data) {

                            if (callback) {
                                callback(data);
                            }
                        };

                        var _params = {
                            "FilterID": null,
                            "Search": null,
                            "SortColumn": sortSetting.SortColumn,
                            "SortAscending": sortSetting.SortASC,
                            "PageSize": util_forceInt(sortSetting.PageSize, _controller.Data.ListPageSize),
                            "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
                        };

                        _controller.DOM.ToggleIndicator(true);                        

                        if (_repeaterOpts.OnConfigureParams) {
                            _repeaterOpts.OnConfigureParams(_params);
                        }

                        _controller.GetContextFilterID(function (filterID) {

                            _params.FilterID = filterID;

                            //set the text search
                            var $tbGlobalSearch = $listView.data("GlobalSearchInput");

                            if (!$tbGlobalSearch || $tbGlobalSearch.length == 0) {
                                $tbGlobalSearch = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.PrimaryFilters })
                                                             .find("input[type='text'][data-input-id='tbGlobalSearch']");

                                $listView.data("GlobalSearchInput", $tbGlobalSearch);
                            }

                            _params.Search = $tbGlobalSearch.val();

                            APP.Service.Action({
                                "_indicators": false, "c": "PluginEditor", "m": "KeyOpinionLeaderGetByForeignKey", "args": _params
                            }, function (result) {

                                _controller.DOM.ToggleIndicator(false);
                                _callback(result);
                            });

                        });

                    };  //end: _fnGetList

                    if (_type == "summary_kol_goals") {
                        _repeaterOpts.OnConfigureParams = function (params) {

                            //filter to only include KOLs that have development plans
                            params["HasDevelopmentPlan"] = enCETriState.Yes;
                        };
                    }
                    else {
                        _repeaterOpts.PropertyValidateUserID = enColKeyOpinionLeaderProperty.CompanyUserID;
                    }

                    break;  //end: summary KOL related

                case "summary_event":

                    _repeaterOpts.LabelItemCount = $listView.closest(".RC").find(".Title:first > .LabelCount");
                    _repeaterOpts.SortEnum = "enColEvent";
                    _repeaterOpts.DefaultSortEnum = _repeaterOpts.SortEnum + "." + enColEventProperty.Name;
                    _repeaterOpts.PropertyDataIdentifier = enColEventProperty.EventID;

                    _repeaterOpts.PropertyValidateUserID = enColEventProperty.UserID;

                    _repeaterOpts.Columns.push({
                        "SortEnum": _repeaterOpts.DefaultSortEnum,
                        "PropertyPath": enColEventProperty.Name
                    });

                    _fnGetList = function (element, sortSetting, callback) {

                        var _callback = function (data) {

                            if (callback) {
                                callback(data);
                            }
                        };

                        var _params = {
                            "FilterID": null,
                            "Search": null,
                            "SortColumn": sortSetting.SortColumn,
                            "SortAscending": sortSetting.SortASC,
                            "PageSize": util_forceInt(sortSetting.PageSize, _controller.Data.ListPageSize),
                            "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
                        };

                        _controller.DOM.ToggleIndicator(true);

                        _controller.GetContextFilterID(function (filterID) {

                            _params.FilterID = filterID;

                            //set the text search
                            var $tbGlobalSearch = $listView.data("GlobalSearchInput");

                            if (!$tbGlobalSearch || $tbGlobalSearch.length == 0) {
                                $tbGlobalSearch = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.PrimaryFilters })
                                                             .find("input[type='text'][data-input-id='tbGlobalSearch']");

                                $listView.data("GlobalSearchInput", $tbGlobalSearch);
                            }

                            _params.Search = $tbGlobalSearch.val();

                            APP.Service.Action({
                                "_indicators": false, "c": "PluginEditor", "m": "EventGetByForeignKey", "args": _params
                            }, function (result) {

                                _controller.DOM.ToggleIndicator(false);
                                _callback(result);
                            });
                        });

                    };  //end: _fnGetList

                    break;  //end: summary_event

                case "summary_activity":

                    _repeaterOpts.LabelItemCount = $listView.closest(".RC").find(".Title:first > .LabelCount");
                    _repeaterOpts.SortEnum = "enColActivity";
                    _repeaterOpts.DefaultSortEnum = _repeaterOpts.SortEnum + "." + enColActivityProperty.Name;
                    _repeaterOpts.PropertyDataIdentifier = enColActivityProperty.ActivityID;

                    _repeaterOpts.PropertyValidateUserID = enColActivityProperty.UserID;

                    _repeaterOpts.Columns.push({
                        "SortEnum": _repeaterOpts.DefaultSortEnum,
                        "PropertyPath": enColActivityProperty.Name
                    });

                    _fnGetList = function (element, sortSetting, callback) {

                        var _callback = function (data) {

                            if (callback) {
                                callback(data);
                            }
                        };

                        var _params = {
                            "FilterID": null,
                            "Search": null,
                            "SortColumn": sortSetting.SortColumn,
                            "SortAscending": sortSetting.SortASC,
                            "PageSize": util_forceInt(sortSetting.PageSize, _controller.Data.ListPageSize),
                            "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
                        };

                        _controller.DOM.ToggleIndicator(true);

                        _controller.GetContextFilterID(function (filterID) {

                            _params.FilterID = filterID;

                            //set the text search
                            var $tbGlobalSearch = $listView.data("GlobalSearchInput");

                            if (!$tbGlobalSearch || $tbGlobalSearch.length == 0) {
                                $tbGlobalSearch = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.PrimaryFilters })
                                                             .find("input[type='text'][data-input-id='tbGlobalSearch']");

                                $listView.data("GlobalSearchInput", $tbGlobalSearch);
                            }

                            _params.Search = $tbGlobalSearch.val();

                            APP.Service.Action({
                                "_indicators": false, "c": "PluginEditor", "m": "ActivityGetByForeignKey", "args": _params
                            }, function (result) {

                                _controller.DOM.ToggleIndicator(false);
                                _callback(result);
                            });
                        });

                    };  //end: _fnGetList

                    break;  //end: summary_activity

                case "calendar_list_view":

                    //need to force unique ID for the type (to ensure unique repeater since all share the same type)
                    var _subTypeID = util_forceInt($listView.attr("data-subtype-id"), enCE.None);

                    if (_subTypeID == enCE.None) {
                        _subTypeID = util_forceInt(_controller.DOM.View.data("TempID_Details"), 0) + 1;
                        _controller.DOM.View.data("TempID_Details", _subTypeID);
                        $listView.attr("data-subtype-id", _subTypeID);
                    }

                    _type += "_SubType_" + _subTypeID;

                    _isWrapper = false;

                    _repeaterOpts.CanSelect = false;
                    _repeaterOpts.IsEntitySummaryView = true;
                    _repeaterOpts.ViewAction.Enabled = true;
                    _repeaterOpts.PropertyDataIdentifier = enColCEntitySummaryBaseProperty.EntityID;

                    var _fnGetDate = function (val) {
                        val = (typeof val === "object") ? val : util_JS_convertToDate(val);

                        //clear the time portion
                        val.setHours(0, 0, 0, 0); //NOTE: non-nullable date expected

                        return val;
                    };

                    var _fnGetLabelHTML = function (val, isHTML, cssClass) {

                        val = (isHTML ? util_forceString(val) : util_htmlEncode(val));

                        cssClass = util_forceString(cssClass);

                        return (val != "" ? "<div class='Label" + (cssClass != "" ? " " + cssClass : "") + "'>" + val + "</div>" : "");
                    };

                    _repeaterOpts.Columns.push({
                        "GetContentHTML": function (opts) {
                            var _html = "";
                            var _calendarItem = opts.Item;
                            var _startDate = _fnGetDate(_calendarItem[enColCEntityCalendarSummaryBaseProperty.StartDate]);
                            var _endDate = _fnGetDate(_calendarItem[enColCEntityCalendarSummaryBaseProperty.EndDate]);
                            var _isDateRange = (_startDate.getTime() != _endDate.getTime());

                            _html += "<div class='CalendarDetail'>" +
                                     "  <div class='Header'>" + (_repeaterOpts.ViewAction.Enabled ? _repeaterOpts.ViewAction.HTML : "") + "</div>" +
                                     "  <div class='Title'>" + util_htmlEncode(_calendarItem[enColCEntitySummaryBaseProperty.Name]) + "</div>";

                            if (_isDateRange) {
                                _html += _fnGetLabelHTML(util_FormatDate(_startDate, "", false) + " to " + util_FormatDate(_endDate, "", false));
                            }
                            else {
                                _html += _fnGetLabelHTML(util_FormatDate(_startDate, "", false));
                            }

                            var _propPathList = ("%%TOK|ROUTE|PluginEditor|KOL_RenderCalendarEntitySummaryPropertyPathList%%" || []);

                            for (var p = 0; p < _propPathList.length; p++) {
                                var _propPath = _propPathList[p];

                                if (typeof _propPath === "string") {
                                    _html += _fnGetLabelHTML(util_propertyValue(_calendarItem, _propPath));
                                }
                                else {

                                    var _arrPropPaths = (_propPath || []);
                                    var _arr = [];

                                    for (var j = 0; j < _arrPropPaths.length; j++) {

                                        //only include if the value is not null
                                        var _val = util_forceString(util_propertyValue(_calendarItem, _arrPropPaths[j]));

                                        if (_val != "") {
                                            _arr.push(_val);
                                        }
                                    }

                                    if (_arr.length > 0) {
                                        _html += _fnGetLabelHTML(util_arrJoinStr(_arr, null, ", "));
                                    }
                                }
                            }

                            var _description = util_forceString(_calendarItem[enColCEntityCalendarSummaryBaseProperty.Description]);
                            var _descriptionHTML = _controller.Utils.HTML.ParseTextLinkHTML(_description, { "linkClass": "LinkExternal WordBreak" });

                            _html += _fnGetLabelHTML(_descriptionHTML, true, "Description");

                            _html += "</div>";

                            return _html;
                        }
                    });

                    _fnGetList = function (element, sortSetting, callback) {

                        var _callback = function (data) {

                            if (callback) {
                                callback(data);
                            }
                        };

                        //use the calendar view's data source
                        var $vwCalendar = $listView.data("CalendarView");

                        if (!$vwCalendar || $vwCalendar.length == 0) {
                            $vwCalendar = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.Calendar });
                            $listView.data("CalendarView", $vwCalendar);
                        }

                        var _list = ($vwCalendar.data("DataItem") || []);

                        _callback({ "List": _list, "NumItems": _list.length });

                    };  //end: _fnGetList

                    break;  //end: calendar_list_view

                case "searchViewEditor":

                    var _entityType = $mobileUtil.GetClosestAttributeValue($listView, "data-entity-type");
                    var _viewGroupID = _controller.ActiveGroupID();
                    var _viewMode = _controller.ActiveContentViewModeID();
                    var _ctxOptions = {
                        "MethodName": null,
                        "RequirePropertyDataIdentifier": null,
                        "OnConfigureParams": function (params) { }
                    };

                    //disable select support and instead allow view action
                    _repeaterOpts.CanSelect = false;
                    _repeaterOpts.ViewAction.Enabled = true;

                    //need to force unique ID for the type (to ensure unique repeater since all share the same type)
                    var _subTypeID = util_forceInt($listView.attr("data-subtype-id"), enCE.None);

                    if (_subTypeID == enCE.None) {
                        _subTypeID = util_forceInt(_controller.DOM.View.data("TempID_SearchViewEditor"), 0) + 1;
                        _controller.DOM.View.data("TempID_SearchViewEditor", _subTypeID);
                        $listView.attr("data-subtype-id", _subTypeID);
                    }

                    _type += "_SubType_" + _subTypeID;

                    var _handled = false;

                    //check if it is a customized entity summary view mode
                    if (!_handled &&
                        util_forceInt($mobileUtil.GetClosestAttributeValue($listView, "data-is-entity-summary-view-mode"), enCETriState.None) == enCETriState.Yes) {

                        _handled = true;

                        _repeaterOpts.IsEntitySummaryView = true;

                        var _propID = $mobileUtil.GetClosestAttributeValue($listView, "data-entity-summary-view-id-property");
                        var _paramViewType = $mobileUtil.GetClosestAttributeValue($listView, "data-entity-summary-view-type");

                        _ctxOptions.MethodName = "KOL_EntitySummaryView";
                        _ctxOptions.RequirePropertyDataIdentifier = _propID;
                        _ctxOptions.OnConfigureParams = function (params, dataItem) {
                            params["FilterID"] = dataItem[_propID];
                            params["ViewType"] = _paramViewType;

                            //user does not have Administrator role, so restrict the resources
                            if (!_controller.CanAdmin()) {
                                var _extFilters = params["ExtendedFilters"];

                                if (!_extFilters) {
                                    _extFilters = {};
                                    params["ExtendedFilters"] = _extFilters;
                                }

                                _extFilters["CanAdmin"] = enCETriState.No;
                            }
                        };

                        _propertyName = enColCEntitySummaryBaseProperty.Name;
                        _repeaterOpts.PropertyDataIdentifier = enColCEntitySummaryBaseProperty.EntityID;

                        var _column = {
                            "IsNoLink": true,
                            "PropertyPath": _propertyName,
                            "HasHighlight": true
                        };

                        _repeaterOpts.Columns.push(_column);

                        //check if the list view requires KOL styled content
                        if (_paramViewType == "Event|KOL") {
                            _column["GetContentHTML"] = function (opts) {

                                var _html = "";
                                var _val = util_forceString(opts["Value"]);
                                var _id = (opts["Item"] ? opts.Item[enColCEntitySummaryBaseProperty.EntityID] : null);

                                _val = (opts["IsHTML"] ? _val : util_htmlEncode(_val));

                                _html += "<div class='ProfileListItemKOL'>" +
                                         "  <div class='EditorImageButton ImageUserProfile'>" +
                                         "      <div class='ImageIcon' " +
                                         util_htmlAttribute("style", "background-image: url('" + _controller.Utils.ConstructKeyOpinionLeaderProfileURL({ "ID": _id }) + "')") +
                                         "  />" +
                                         "  </div>" +
                                         "  <div class='Label'>" + _val + "</div>" +
                                         "</div>";

                                return _html;
                            };
                        }
                        else if (!_repeaterOpts.IsDisableEntityTypeBadge) {

                            _column["GetContentHTML"] = function (opts) {

                                var _html = "";
                                var _val = util_forceString(opts["Value"]);
                                var _item = opts.Item;
                                var _badgeLetter = "";
                                var _tooltip = "";

                                _val = (opts["IsHTML"] ? _val : util_htmlEncode(_val));

                                switch (_item[enColCEntitySummaryBaseProperty.EntityTypeID]) {

                                    case enCEntitySummaryBaseTypeKOL.KOL:
                                        _badgeLetter = "K";
                                        _tooltip = "KOL";
                                        break;

                                    case enCEntitySummaryBaseTypeKOL.Activity:
                                        _badgeLetter = "A";
                                        _tooltip = "Activity";
                                        break;

                                    case enCEntitySummaryBaseTypeKOL.Resource:
                                        _badgeLetter = "D";
                                        _tooltip = "Document";
                                        break;

                                    case enCEntitySummaryBaseTypeKOL.Event:
                                        _badgeLetter = "E";
                                        _tooltip = "Event";
                                        break;
                                }

                                _html += "<div class='BadgeListItemEntity'>" +
                                         "  <div class='BadgeIcon' " + util_htmlAttribute("title", _tooltip, null, true) + ">" +
                                         "      <div class='Label'>" + util_htmlEncode(_badgeLetter) + "</div>" +
                                         "  </div>" +
                                         "  <div class='Label'>" + _val + "</div>" +
                                         "</div>";

                                return _html;
                            };
                        }
                    }

                    if (!_handled) {

                        switch (_entityType) {

                            case "KOL":

                                if (_viewGroupID == _controller.Data.ID.EventActivity) {

                                    _repeaterOpts.ViewAction.EntityType = _entityType;

                                    switch (_viewMode) {

                                        case enCContentViewModeKOL.Event:
                                        case enCContentViewModeKOL.Activity:

                                            var _propertyName = null;

                                            if (_viewMode == enCContentViewModeKOL.Event) {

                                                _ctxOptions.MethodName = "KeyOpinionLeaderEventGetByForeignKey";
                                                _ctxOptions.RequirePropertyDataIdentifier = enColEventProperty.EventID;
                                                _ctxOptions.OnConfigureParams = function (params, dataItem) {
                                                    params["EventID"] = dataItem[enColEventProperty.EventID];
                                                };

                                                _propertyName = enColKeyOpinionLeaderEventProperty.KeyOpinionLeaderIDName;

                                                _repeaterOpts.SortEnum = "enColKeyOpinionLeaderEvent";
                                                _repeaterOpts.DefaultSortEnum = _repeaterOpts.SortEnum + "." + _propertyName;
                                                _repeaterOpts.PropertyDataIdentifier = enColKeyOpinionLeaderEventProperty.KeyOpinionLeaderID;
                                            }
                                            else if (_viewMode == enCContentViewModeKOL.Activity) {

                                                _ctxOptions.MethodName = "KeyOpinionLeaderActivityGetByForeignKey";
                                                _ctxOptions.RequirePropertyDataIdentifier = enColActivityProperty.ActivityID;
                                                _ctxOptions.OnConfigureParams = function (params, dataItem) {
                                                    params["ActivityID"] = dataItem[enColActivityProperty.ActivityID];
                                                };

                                                _propertyName = enColKeyOpinionLeaderActivityProperty.KeyOpinionLeaderIDName;

                                                _repeaterOpts.SortEnum = "enColKeyOpinionLeaderActivity";
                                                _repeaterOpts.DefaultSortEnum = _repeaterOpts.SortEnum + "." + _propertyName;
                                                _repeaterOpts.PropertyDataIdentifier = enColKeyOpinionLeaderActivityProperty.KeyOpinionLeaderID;
                                            }

                                            _repeaterOpts.Columns.push({
                                                "SortEnum": _repeaterOpts.DefaultSortEnum,
                                                "PropertyPath": _propertyName,
                                                "HasHighlight": true,
                                                "GetContentHTML": function (opts) {

                                                    var _html = "";
                                                    var _val = util_forceString(opts["Value"]);
                                                    var _id = (opts["Item"] ? opts.Item[_repeaterOpts.PropertyDataIdentifier] : null);

                                                    _val = (opts["IsHTML"] ? _val : util_htmlEncode(_val));

                                                    _html += "<div class='ProfileListItemKOL'>" +
                                                             "  <div class='EditorImageButton ImageUserProfile'>" +
                                                             "      <div class='ImageIcon' " +
                                                             util_htmlAttribute("style",
                                                                                "background-image: url('" + _controller.Utils.ConstructKeyOpinionLeaderProfileURL({
                                                                                    "ID": _id
                                                                                }) + "')") +
                                                             "  />" +
                                                             "  </div>" +
                                                             "  <div class='Label'>" + _val + "</div>" +
                                                             "</div>";

                                                    return _html;
                                                }
                                            });

                                            break;  //end: Event, Activity
                                    }
                                }

                                break;  //end: KOL

                            case "Resource":

                                if (_viewGroupID == _controller.Data.ID.KOL) {

                                    //KOL
                                    _repeaterOpts.ViewAction.EntityType = _entityType;

                                    _ctxOptions.MethodName = "RepositoryResourceKeyOpinionLeaderGetByForeignKey";
                                    _ctxOptions.RequirePropertyDataIdentifier = enColKeyOpinionLeaderProperty.KeyOpinionLeaderID;
                                    _ctxOptions.OnConfigureParams = function (params, dataItem) {
                                        params["KeyOpinionLeaderID"] = dataItem[enColKeyOpinionLeaderProperty.KeyOpinionLeaderID];
                                    };

                                    var _propertyName = enColRepositoryResourceKeyOpinionLeaderProperty.ResourceIDName;

                                    _repeaterOpts.SortEnum = "enColRepositoryResourceKeyOpinionLeader";
                                    _repeaterOpts.DefaultSortEnum = _repeaterOpts.SortEnum + "." + _propertyName;
                                    _repeaterOpts.PropertyDataIdentifier = enColRepositoryResourceKeyOpinionLeaderProperty.ResourceID;

                                    _repeaterOpts.Columns.push({
                                        "SortEnum": _repeaterOpts.DefaultSortEnum,
                                        "PropertyPath": _propertyName,
                                        "HasHighlight": true
                                    });
                                }
                                else if (_viewGroupID == _controller.Data.ID.EventActivity) {

                                    if (_viewGroupID == _controller.Data.ID.EventActivity) {

                                        _repeaterOpts.ViewAction.EntityType = _entityType;

                                        switch (_viewMode) {

                                            case enCContentViewModeKOL.Event:
                                            case enCContentViewModeKOL.Activity:

                                                var _propertyName = null;

                                                if (_viewMode == enCContentViewModeKOL.Event) {

                                                    _ctxOptions.MethodName = "RepositoryResourceEventGetByForeignKey";
                                                    _ctxOptions.RequirePropertyDataIdentifier = enColEventProperty.EventID;
                                                    _ctxOptions.OnConfigureParams = function (params, dataItem) {
                                                        params["EventID"] = dataItem[enColEventProperty.EventID];

                                                        if (!_controller.CanAdmin()) {
                                                            params["CanAdmin"] = enCETriState.No;
                                                        }
                                                    };

                                                    _propertyName = enColRepositoryResourceEventProperty.ResourceIDName;

                                                    _repeaterOpts.SortEnum = "enColRepositoryResourceEvent";
                                                    _repeaterOpts.DefaultSortEnum = _repeaterOpts.SortEnum + "." + _propertyName;
                                                    _repeaterOpts.PropertyDataIdentifier = enColRepositoryResourceEventProperty.ResourceID;
                                                }
                                                else if (_viewMode == enCContentViewModeKOL.Activity) {

                                                    _ctxOptions.MethodName = "RepositoryResourceActivityGetByForeignKey";
                                                    _ctxOptions.RequirePropertyDataIdentifier = enColActivityProperty.ActivityID;
                                                    _ctxOptions.OnConfigureParams = function (params, dataItem) {
                                                        params["ActivityID"] = dataItem[enColActivityProperty.ActivityID];

                                                        if (!_controller.CanAdmin()) {
                                                            params["CanAdmin"] = enCETriState.No;
                                                        }
                                                    };

                                                    _propertyName = enColRepositoryResourceActivityProperty.ResourceIDName;

                                                    _repeaterOpts.SortEnum = "enColRepositoryResourceActivity";
                                                    _repeaterOpts.DefaultSortEnum = _repeaterOpts.SortEnum + "." + _propertyName;
                                                    _repeaterOpts.PropertyDataIdentifier = enColRepositoryResourceActivityProperty.ResourceID;
                                                }

                                                _repeaterOpts.Columns.push({
                                                    "SortEnum": _repeaterOpts.DefaultSortEnum,
                                                    "PropertyPath": _propertyName,
                                                    "HasHighlight": true
                                                });

                                                break;  //end: Event, Activity
                                        }
                                    }
                                }

                                break;  //end: Resource

                            default:

                                debugger;
                                //TODO

                                break;
                        }

                    }

                    _fnGetList = function (element, sortSetting, callback) {

                        var _callback = function (data) {

                            if (callback) {
                                callback(data);
                            }
                        };

                        //check if the current data item has a valid identifier, if applicable
                        var _valid = true;
                        var _dataItem = _controller.EditItem();
                        var $parent = $listView.closest(".SearchListViewEditor");

                        var _isEditMode = $parent.hasClass("EditModeOn");

                        if (_isEditMode && ($parent.data("override-disable-edit-mode") == true)) {
                            _isEditMode = false;
                        }

                        if (util_forceString(_ctxOptions.RequirePropertyDataIdentifier) != "") {
                            var _id = util_forceInt(_dataItem[_ctxOptions.RequirePropertyDataIdentifier], enCE.None);

                            _valid = (_id != enCE.None);
                        }

                        _valid = (_valid && !_isEditMode);

                        if (_valid) {

                            var _params = {
                                "Search": null,
                                "FilterGroupValue": null,
                                "FilterValue": null,
                                "SortColumn": sortSetting.SortColumn,
                                "SortAscending": sortSetting.SortASC,
                                "PageSize": util_forceInt(sortSetting.PageSize, _controller.Data.ListPageSize),
                                "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
                            };

                            _controller.DOM.ToggleIndicator(true);

                            //configure the text search and selected filter value
                            var $tbSearch = $parent.data("SearchElement");
                            var $ddlFilter = $parent.data("FilterTypeElement");

                            if (!$tbSearch || $ddlFilter) {
                                $tbSearch = $parent.find(".R1C1 input[type='text']");
                                $ddlFilter = $parent.find(".R1C2 select");

                                $parent.data("SearchElement", $tbSearch)
                                       .data("FilterTypeElement", $ddlFilter);
                            }

                            _params.Search = $tbSearch.val();

                            var $option = $ddlFilter.find("option:selected");
                            var _hasGroupOption = $option.parent().is("optgroup");

                            if (_hasGroupOption) {
                                _params.FilterGroupValue = $mobileUtil.GetClosestAttributeValue($option, "data-attr-group-value");
                            }

                            _params.FilterValue = $ddlFilter.val();

                            if (_ctxOptions.OnConfigureParams) {
                                _ctxOptions.OnConfigureParams(_params, _dataItem);
                            }

                            APP.Service.Action({
                                "_indicators": false, "c": "PluginEditor", "m": _ctxOptions.MethodName, "args": _params
                            }, function (result) {

                                _controller.DOM.ToggleIndicator(false);
                                _callback(result);
                            });

                            $tbSearch.data("LastRequest", GlobalService.LastRequest);   //associate last service request to searchable field
                        }
                        else {
                            _callback(null);
                        }

                    };  //end: _fnGetList

                    //associate the get list function to list view element (for text search support)
                    $listView.data("GetList", _fnGetList);

                    break;  //end: searchViewEditor

                case "comments":

                    _isWrapper = false;

                    _repeaterOpts.CanSelect = false;
                    _repeaterOpts.SortEnum = "enColKeyOpinionLeaderComment";
                    _repeaterOpts.DefaultSortEnum = _repeaterOpts.SortEnum + "." + enColKeyOpinionLeaderCommentProperty.PostedOn;
                    _repeaterOpts.PropertyDataIdentifier = enColKeyOpinionLeaderCommentProperty.CommentID;
                    _repeaterOpts.LabelItemCount = $listView.closest(".CommentsView").find(".Header > .Title > .LabelCount");
                    _repeaterOpts.DefaultNoRecordMessage = "No comments were found.";

                    var _userID = global_AuthUserID();
                    var _canAdmin = _controller.CanAdmin();

                    _repeaterOpts.Columns.push({
                        "GetContentHTML": function (opts) {
                            var _html = "";
                            var _comment = opts.Item;
                            var _isOwner = (_comment[enColKeyOpinionLeaderCommentProperty.UserID] == _userID);
                            var _tempID = _comment["_tempID"];

                            _html += "<div class='CommentDetail" + (_isOwner ? " UserCommentItem" : "") + "'" +
                                     (_tempID ? " " + util_htmlAttribute("data-comment-temp-id", _tempID) : "") + ">" +
                                     _controller.Utils.HTML.GetButton({
                                         "CssClass": (!_canAdmin && !_isOwner ? "LinkDisabled" : ""),
                                         "ActionButtonID": "delete_comment",
                                         "Attributes": {
                                             "data-iconpos": "notext", "data-icon": "delete",
                                             "title": (!_canAdmin && !_isOwner ? "You are not authorized to delete this comment." : "Delete")
                                         }
                                     }) +
                                     "  <div class='LabelDisplayName'>" +
                                     "      <span>" + util_htmlEncode(_comment[enColKeyOpinionLeaderCommentProperty.UserDisplayName]) + "</span>" +
                                     "  </div>" +
                                     "  <div class='LabelPostedOn'>" +
                                     "      <span>" + 
                                     util_FormatDateTime(_comment[enColKeyOpinionLeaderCommentProperty.PostedOn], NA, null, false, 
                                                         { "ForceDayPadding": true, "IsValidateConversion": true }) +
                                     "      </span>" +
                                     "  </div>";

                            _html += "  <div class='LabelComment'>" +
                                     "      <div>" +
                                     _controller.Utils.HTML.ParseTextLinkHTML(_comment[enColKeyOpinionLeaderCommentProperty.CommentText],
                                                                              { "linkClass": "LinkExternal WordBreak" }) +
                                     "      </div>" +
                                     "  </div>";

                            _html += "</div>";

                            return _html;
                        }
                    });

                    _fnGetList = function (element, sortSetting, callback) {

                        var _callback = function (data) {

                            if (callback) {
                                callback(data);
                            }
                        };

                        var _dataItem = _controller.EditItem();
                        var _hasItem = (_dataItem && util_forceInt(_dataItem[enColKeyOpinionLeaderCommentProperty.KeyOpinionLeaderID], enCE.None) != enCE.None);

                        if (_hasItem) {
                            var _params = {
                                "KeyOpinionLeaderID": util_forceInt(_dataItem[enColKeyOpinionLeaderCommentProperty.KeyOpinionLeaderID], enCE.None),
                                "SortColumn": sortSetting.SortColumn,
                                "SortAscending": false, //force descending order
                                "PageSize": util_forceInt(sortSetting.PageSize, _controller.Data.ListPageSize),
                                "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
                            };

                            _controller.DOM.ToggleIndicator(true);

                            if (_repeaterOpts.OnConfigureParams) {
                                _repeaterOpts.OnConfigureParams(_params);
                            }

                            APP.Service.Action({
                                "_indicators": false, "c": "PluginEditor", "m": "KeyOpinionLeaderCommentGetByForeignKey", "args": _params
                            }, function (result) {

                                _controller.DOM.ToggleIndicator(false);
                                _callback(result);
                            });
                        }
                        else {

                            //load the comments from the data item (create wrapper list entity)
                            var _comments = {
                                "List": _dataItem[enColCEKeyOpinionLeaderProperty.Comments],
                                "NumItems": 0
                            };

                            _comments.List = (_comments.List || []);
                            _comments.NumItems = _comments.List.length;

                            _callback(_comments);
                        }

                    };  //end: _fnGetList

                    break;  //end: comments

                default:
                    break;
            }

            if (_repeaterOpts.ViewAction.Enabled) {

                var _attrs = {
                    "data-inline": "true",
                    "data-view-entity-type": _repeaterOpts.ViewAction.EntityType
                };

                if (_repeaterOpts.IsEntitySummaryView) {
                    delete _attrs["data-view-entity-type"];
                }

                _repeaterOpts.ViewAction["HTML"] = _controller.Utils.HTML.GetButton({
                    "ActionButtonID": "entity_details_view",
                    "Content": "View", "CssClass": "ButtonThemeInvert",
                    "Attributes": _attrs
                });
            }

            var _contextPermissions = {
                "UserID": enCE.None,
                "CanAdmin": null,
                "Init": function () {
                    this.UserID = global_AuthUserID();
                    this.CanAdmin = _controller.CanAdmin();
                }
            };

            $repeater = _controller.Utils.Repeater({
                "ID": "Table_" + _type,
                "CssClass": "TableMinimalList",
                "IsTableEnhance": false,
                "IsDisablePagingFooter": true,
                "IsFooterNoRecords": true,
                "DefaultNoRecordMessage": _repeaterOpts.DefaultNoRecordMessage,
                "PageSize": _controller.Data.ListPageSize,
                "SortEnum": _repeaterOpts.SortEnum,
                "DefaultSortEnum": _repeaterOpts.DefaultSortEnum,
                "SortOrderGroupKey": "kol_listview_table_" + _type,
                "Columns": _repeaterOpts.Columns,
                "RepeaterFunctions": {
                    "ContentRowAttribute": function (item) {
                        var _rowAttr = util_htmlAttribute("data-attr-item-id", item[_repeaterOpts.PropertyDataIdentifier]);

                        //configure the view details enttity type, if current render is a summary list view
                        if (_repeaterOpts.IsEntitySummaryView) {

                            var _viewEntityType = null;

                            switch (item[enColCEntitySummaryBaseProperty.EntityTypeID]) {

                                case enCEntitySummaryBaseTypeKOL.KOL:
                                    _viewEntityType = "KOL";
                                    break;

                                case enCEntitySummaryBaseTypeKOL.Event:
                                    _viewEntityType = "Event";
                                    break;

                                case enCEntitySummaryBaseTypeKOL.Activity:
                                    _viewEntityType = "Activity";
                                    break;

                                case enCEntitySummaryBaseTypeKOL.Resource:
                                    _viewEntityType = "Resource";
                                    break;
                            }

                            if (_viewEntityType != null) {
                                _rowAttr += " " + util_htmlAttribute("data-view-entity-type", _viewEntityType);
                            }
                        }

                        return _rowAttr;
                    },
                    "ContentRowCssClass": function (opts) {
                        var _item = opts.Item;

                        return "";
                    },
                    "FieldCellOption": function (cellOpts) {
                    },
                    "FieldValue": function (opts) {
                        var _val = "";
                        var _item = opts.Item;
                        var _isEncode = true;
                        var _isNewLineEncode = false;

                        if (opts.IsContent) {
                            var _column = _repeaterOpts.Columns[opts.Index];
                            var _propertyPath = _column["PropertyPath"];

                            if (_propertyPath) {
                                var _hasHighlight = util_forceBool(_column["HasHighlight"], false);

                                _val = util_propertyValue(_item, _propertyPath);

                                if (_isEncode && _hasHighlight) {

                                    var _fnHighlightEncoder = $listView.data("HighlightEncoder");

                                    if (_fnHighlightEncoder) {

                                        _val = util_forceString(_val);
                                        _val = _fnHighlightEncoder(_val, _isNewLineEncode);
                                        _isEncode = false;  //disable HTML encode
                                    }
                                }

                                if (_column["GetContentHTML"]) {
                                    _val = _column.GetContentHTML({
                                        "Item": _item, "Value": _val, "IsHTML": !_isEncode
                                    });
                                    _isEncode = false;
                                }
                            }

                            if (_isWrapper || _column["IsWrapper"]) {

                                var _selected = false;
                                var _canEdit = _contextPermissions.CanAdmin;
                                var _itemID = _item[_repeaterOpts.PropertyDataIdentifier];

                                if (_repeaterOpts.CanSelect && $listView.data("SelectedItemID") == _itemID) {
                                    _selected = true;
                                }

                                //check if user does not have admin permission, but validate the item UserID value, if applicable
                                if (_selected && !_canEdit && _repeaterOpts.PropertyValidateUserID) {
                                    var _itemUserID = util_forceInt(_item[_repeaterOpts.PropertyValidateUserID], enCE.None);

                                    _canEdit = (_itemUserID == _contextPermissions.UserID);
                                }

                                _val = (_isEncode ? util_htmlEncode(_val, _isNewLineEncode) : util_forceString(_val));

                                _isEncode = false;
                                _val = "<div class='DisableUserSelectable EntityLineItem" + (!_repeaterOpts.CanSelect ? " LinkDisabled" : "") +
                                       (_selected ? " LinkDisabled Selected" : "") + (_repeaterOpts.ViewAction.Enabled ? " ViewActionStateOn" : "") +
                                       "'>" +
                                       "    <div class='Label'>" + _val + "</div>" +
                                       (_selected && _canEdit ? _controller.Utils.HTML.GetButton({
                                           "ActionButtonID": "edit_entity",
                                           "Attributes": {
                                               "data-inline": "true",
                                               "data-iconpos": "notext",
                                               "data-icon": "edit",
                                               "title": "Edit"
                                           }
                                       }) : "") +
                                       (_repeaterOpts.ViewAction.Enabled ? _repeaterOpts.ViewAction.HTML : "") +
                                       "</div>";
                            }
                            else if (!_propertyPath && _column["GetContentHTML"]) {
                                _val = _column.GetContentHTML({
                                    "Item": _item
                                });
                                _isEncode = false;
                            }
                        }

                        _val = (_isEncode ? util_htmlEncode(_val, _isNewLineEncode) : util_forceString(_val));

                        return _val;
                    },
                    "GetData": function (element, sortSetting, callback) {

                        var _isCachedData = $listView.data("is-cached-data");

                        _contextPermissions.Init();

                        if (_isCachedData) {
                            $listView.removeData("is-cached-data");
                            callback($listView.data("DataSource"));
                        }
                        else if (_fnGetList) {
                            _fnGetList.apply(this, [element, sortSetting, callback]);
                        }
                        else {
                            callback(null);
                        }
                    },
                    "BindComplete": function (opts) {

                        var _list = util_extend({
                            "List": null, "NumItems": null
                        }, opts.Data);
                        var _sortSetting = ctl_repeater_getSortSetting(opts.Element);
                        var $vwPagination = $listView.children(".PaginationView");
                        var _pagingHTML = _controller.Utils.HTML.Pagination({
                            "PageSize": _sortSetting.PageSize, "CurrentPage": util_forceInt(_sortSetting["PageNo"], 1),
                            "NumItems": _list.NumItems, "IsPagingDisplayCount": false, "IsMinimalFormat": true
                        });

                        if ($vwPagination.length == 0) {
                            $vwPagination = $("<div class='PaginationView ViewMinimal' />");
                            $listView.append($vwPagination);

                            $vwPagination.on("change.onNavigatePage", "select.DropdownPageView", function () {
                                var $ddl = $(this);
                                var _pageNum = util_forceInt($ddl.val(), 0);

                                $listView.trigger("events.onRefreshListView", {
                                    "NavigatePageNo": _pageNum
                                });
                            });
                        }

                        $vwPagination.html(_pagingHTML)
                                     .trigger("create");

                        $listView.data("DataSource", _list);

                        if (_repeaterOpts.LabelItemCount != null) {
                            var _count = util_forceInt(_list.NumItems, 0);

                            _repeaterOpts.LabelItemCount.text("(" + util_formatNumber(_count) + ")");
                        }

                        if ($listView.data("OnCallback")) {
                            var _fn = $listView.data("OnCallback");

                            $listView.removeData("OnCallback");
                            _fn.call($listView);
                        }
                    }
                }
            });

            $listView.empty();
            $listView.append($repeater);

            $mobileUtil.refresh($listView);

            //bind the repeater related additional events
            $repeater.off("click.onItemClick");

            if (_repeaterOpts.CanSelect) {
                $repeater.on("click.onItemClick", "[data-attr-item-id] .EntityLineItem:not(.LinkDisabled)", function (e, args) {

                    args = util_extend({
                        "IsDisableInteractiveValidation": false,
                        "Callback": null
                    }, args);

                    var $this = $(this);
                    var _itemID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-item-id"), enCE.None);
                    var _isDisableListItemDetails = (util_forceInt($listView.attr("data-listview-is-disable-item-detail-click"), enCETriState.None) == enCETriState.Yes);

                    var $parent = $this.closest("[data-view-type]");

                    //check if the parent view type has disabled interactive events, e.g. such as when in add/edit item mode
                    if (util_forceBool(args.IsDisableInteractiveValidation, false) == false && $parent.hasClass("DisableInteractiveEvents")) {
                        return;
                    }

                    if (!_isDisableListItemDetails) {
                        $this.addClass("LinkDisabled");

                        $listView.data("SelectedItemID", _itemID);

                        $listView.data("OnCallback", function () {

                            //NOTE: the trigger context cannot be used since the repeater is being refreshed immediately resulting in the DOM element to be destroyed
                            _controller.OnListViewEntityAction({
                                "ItemID": _itemID, "ListView": $listView, "ListViewType": _type, "Callback": args.Callback
                            });
                        });

                        $repeater.trigger("events.refresh_list");
                    }
                    else {
                        _controller.ShowEntityDetailsPopup({ "Trigger": $this });
                    }
                });
            }

            $listView.off("events.onRefreshListView");
            $listView.on("events.onRefreshListView", function (e, args) {

                args = util_extend({
                    "IsCachedData": false, "SelectedItemID": $listView.data("SelectedItemID"), "NavigatePageNo": null, "Callback": null
                }, args);

                $listView.data("is-cached-data", util_forceBool(args.IsCachedData, false))
                         .data("SelectedItemID", args.SelectedItemID)
                         .data("OnCallback", args.Callback);
                $repeater.trigger("events.refresh_list", {
                    "NavigatePageNo": args.NavigatePageNo
                });
            });

            $listView.data("is-init-listview", true)
                     .attr("is-listview-init-complete", enCETriState.Yes);
        }
        else {
            $repeater = $listView.children(":first");
        }

        $listView.data("OnCallback", onCallback);
        $repeater.trigger("events.refresh_list");

    };  //end: _fnBindListView

    var $ctxListViews = $element.find(".ListView[data-list-view-type]");

    //bind the list views, if applicable (excludes calendar list view)
    $.each($ctxListViews.not("[data-list-view-type='calendar_list_view']"), function () {
        (function ($listView) {

            _queue.Add(function (onCallback) {
                _fnBindListView($listView, onCallback);
            });

        })($(this));
    });

    if (!options.IsFilterUpdate) {

        _queue.Add(function (onCallback) {
            _controller.DataItemBind({ "Callback": onCallback });
        });
    }

    //bind the calendar view
    $.each(_controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.Calendar }), function () {
        (function ($vwCalendar) {

            _queue.Add(function (onCallback) {

                var _isFocusToday = false;

                if (!$vwCalendar.data("is-init")) {
                    $vwCalendar.data("is-init", true);

                    _isFocusToday = true;

                    $vwCalendar.off("events.onCalendarRefreshData");
                    $vwCalendar.on("events.onCalendarRefreshData", function (e, args) {

                        args = util_extend({ "Callback": null, "HasIndicators": true }, args);

                        var _refreshCallback = function () {

                            if (args.HasIndicators) {
                                _controller.DOM.ToggleIndicator(false);
                            }

                            if (args.Callback) {
                                args.Callback();
                            }

                        };  //end: _refreshCallback

                        if (args.HasIndicators) {
                            _controller.DOM.ToggleIndicator(true);
                        }

                        var $renderCalendar = $vwCalendar.children("[" + util_renderAttribute("pluginEditor_calendar") + "]");
                        var _val = {};

                        $renderCalendar.trigger("events.calendarGetYear", _val);

                        var _dataItem = (_controller.EditItem() || {});

                        var _params = {
                            "Search": null,
                            "FilterStrID": null,
                            "FilterYear": _val.Result,   //restrict to current year
                            "FilterType": null,   //passing the entity type ID
                            "FilterID": enCE.None
                        };

                        switch (_controller.ActiveGroupID()) {

                            case _controller.Data.ID.KOL:
                                _params.FilterType = enCEntitySummaryBaseTypeKOL.KOL;
                                _params.FilterID = _dataItem[enColKeyOpinionLeaderProperty.KeyOpinionLeaderID];
                                break;

                            case _controller.Data.ID.EventActivity:

                                switch (_controller.ActiveContentViewModeID()) {

                                    case enCContentViewModeKOL.Event:
                                        _params.FilterType = enCEntitySummaryBaseTypeKOL.Event;
                                        _params.FilterID = _dataItem[enColEventProperty.EventID];
                                        break;

                                    case enCContentViewModeKOL.Activity:
                                        _params.FilterType = enCEntitySummaryBaseTypeKOL.Activity;
                                        _params.FilterID = _dataItem[enColActivityProperty.ActivityID];
                                        break;
                                }

                                break;
                        }

                        _params.FilterType = util_forceString(_params.FilterType) + "";
                        _params.FilterID = util_forceInt(_params.FilterID, enCE.None);

                        _controller.GetContextFilterID(function (filterID) {

                            _params.FilterStrID = filterID; //must use the string version since it applies to the filter groups view selections

                            //set the text search
                            var $tbGlobalSearch = $vwCalendar.data("GlobalSearchInput");

                            if (!$tbGlobalSearch || $tbGlobalSearch.length == 0) {
                                $tbGlobalSearch = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.PrimaryFilters })
                                                             .find("input[type='text'][data-input-id='tbGlobalSearch']");

                                $vwCalendar.data("GlobalSearchInput", $tbGlobalSearch);
                            }

                            _params.Search = $tbGlobalSearch.val();

                            APP.Service.Action({
                                "_indicators": false, "c": "PluginEditor", "m": "KOL_CalendarView", "args": _params
                            }, function (result) {

                                var _list = (result ? result.List : null);

                                _list = (_list || []);

                                //force the date properties
                                var _arr = [enColCEntityCalendarSummaryBaseProperty.StartDate, enColCEntityCalendarSummaryBaseProperty.EndDate];
                                for (var i = 0; i < _list.length; i++) {
                                    var _calendarItem = _list[i];

                                    for (var p = 0; p < _arr.length; p++) {
                                        var _prop = _arr[p];
                                        var _val = _calendarItem[_prop];

                                        _val = (typeof _val === "object") ? _val : util_JS_convertToDate(_val);

                                        //clear the time portion
                                        _val.setHours(0, 0, 0, 0); //NOTE: non-nullable date expected

                                        _calendarItem[_prop] = _val;
                                    }
                                }

                                $vwCalendar.data("DataItem", _list);    //bind the data to the calendar element (since will need it later)

                                $renderCalendar.trigger("events.calendarRefresh", { "IsYearUpdate": false, "List": _list });

                                //refresh the activity details view groups
                                var _queue = new CEventQueue();
                                var $detailsListView = $vwCalendar.data("DetailsListView");

                                if (!$detailsListView || $detailsListView.length == 0) {
                                    $detailsListView = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.ActivityDetails })
                                                                  .find(".ListView[data-list-view-type]");

                                    $vwCalendar.data("DetailsListView", $detailsListView);
                                }

                                //ensure the list view has been initialzied (prior to binding it)
                                $.each($detailsListView.filter("[" + util_htmlAttribute("is-listview-init-complete", enCETriState.Yes) + "]"), function () {

                                    (function ($vwListView) {

                                        _queue.Add(function (onCallback) {
                                            $vwListView.data("OnCallback", onCallback);
                                            renderer_event_data_admin_list_bind($vwListView);
                                        });
                                    })($(this));
                                });

                                _queue.Run({ "Callback": _refreshCallback });
                            });

                        });

                    });

                    $element.off("events.onCalendarViewDate");
                    $element.on("events.onCalendarViewDate", function (e, args) {
                        args = util_extend({ "Trigger": null, "Parent": null, "MonthIndex": null, "Day": null, "Date": null, "Callback": null }, args);

                        var $month = $(args.Parent);
                        var _list = ($month.data("DataList") || []);

                        if (_list.length > 0) {

                            var _matches = [];

                            var _dt = args.Date;

                            _dt = _dt.getTime();

                            //find the list of matches
                            for (var i = 0; i < _list.length; i++) {
                                var _calendarItem = _list[i];
                                var _item = _calendarItem.Item;

                                if (_calendarItem.Start <= _dt && _calendarItem.End >= _dt) {
                                    _matches.push(_item);
                                }
                            }

                            if (_matches.length == 0) {
                                if (args.Callback) {
                                    args.Callback();
                                }
                            }
                            else if (_matches.length == 1) {

                                //directly show the details popup view
                                _controller.ShowEntityDetailsPopup({ "Trigger": args.Trigger, "Item": _matches[0], "Callback": args.Callback });
                            }
                            else {

                                //scroll to the first item in the list
                                var _entityType = null;
                                var _entityItem = _matches[0];

                                switch (_entityItem[enColCEntitySummaryBaseProperty.EntityTypeID]) {

                                    case enCEntitySummaryBaseTypeKOL.KOL:
                                        _entityType = "KOL";
                                        break;

                                    case enCEntitySummaryBaseTypeKOL.Event:
                                        _entityType = "Event";
                                        break;

                                    case enCEntitySummaryBaseTypeKOL.Activity:
                                        _entityType = "Activity";
                                        break;

                                    case enCEntitySummaryBaseTypeKOL.Resource:
                                        _entityType = "Resource";
                                        break;
                                }

                                if (_entityType != null) {
                                    var _selector = "[" + util_htmlAttribute("data-attr-item-id", _entityItem[enColCEntitySummaryBaseProperty.EntityID]) + "]" +
                                                    "[" + util_htmlAttribute("data-view-entity-type", _entityType) + "]:first";

                                    var $vwDetails = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.ActivityDetails });
                                    var $search = $vwDetails.find(_selector);

                                    if ($search.length == 1) {

                                        var _top = $search.position().top + $vwDetails.scrollTop();

                                        $vwDetails.finish();
                                        $vwDetails.animate({ "scrollTop": _top + "px" }, 750);
                                    }

                                    if (args.Callback) {
                                        args.Callback();
                                    }
                                }
                            }
                        }
                    });
                }

                $vwCalendar.trigger("events.onCalendarRefreshData", {
                    "HasIndicators": false, "IsForceUpdate": true, "Callback": function () {

                        if (_isFocusToday) {
                            var $today = $vwCalendar.find(".DayDetail.Today");

                            if ($today.length == 1) {
                                var _position = $today.closest(".DetailMonth").position();

                                $vwCalendar.animate({ "scrollTop": Math.max(_position.top - 10, 0) + "px" }, 750);
                            }
                        }

                        onCallback();
                    }
                });
            });

        })($(this));
    });

    //bind the calendar list views (since the related calendar view has been bound)
    $.each($ctxListViews.filter("[data-list-view-type='calendar_list_view']"), function () {
        (function ($listView) {

            _queue.Add(function (onCallback) {
                _fnBindListView($listView, onCallback);
            });

        })($(this));
    });

    //bind the chart view
    $.each(_controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.Chart }), function () {
        (function ($vwChart) {
            _queue.Add(function (onCallback) {

                if (!$vwChart.data("is-init-chart-view")) {
                    $vwChart.data("is-init-chart-view", true);

                    var $btnList = $vwChart.find(".Header [data-chart-mode-type]");

                    $vwChart.off("click.chartToggleViewMode");
                    $vwChart.on("click.chartToggleViewMode", ".LinkClickable[data-chart-mode-type]:not(.LinkDisabled)", function () {

                        var $this = $(this);

                        $btnList.not($this).removeClass("LinkDisabled");
                        $this.addClass("LinkDisabled");

                        $vwChart.trigger("events.refreshChart", { "IsCachedData": true });
                    });

                    $vwChart.off("events.getChartViewMode");
                    $vwChart.on("events.getChartViewMode", function (e, args) {
                        var $selected = $btnList.filter(".LinkDisabled:first");

                        args["Result"] = $selected.attr("data-chart-mode-type");
                    });

                    $vwChart.off("events.refreshChart");
                    $vwChart.on("events.refreshChart", function (e, args) {

                        args = util_extend({ "Callback": null, "IsCachedData": false, "HasIndicators": true }, args);

                        var _refreshCallback = function () {

                            if (args.HasIndicators) {
                                _controller.DOM.ToggleIndicator(false);
                            }

                            if (args.Callback) {
                                args.Callback();
                            }

                        };  //end: _refreshCallback

                        if (args.HasIndicators) {
                            _controller.DOM.ToggleIndicator(true);
                        }

                        var _chartType = $vwChart.attr("data-chart-type");

                        var _result = $vwChart.data("DataItem");

                        var _fnGetData = function (onDataCallback) {

                            var _params = {
                                "Search": null,
                                "FilterID": null,
                                "ChartType": _chartType
                            };

                            if (!_result || !args.IsCachedData) {

                                _controller.GetContextFilterID(function (filterID) {

                                    _params.FilterID = filterID;

                                    //set the text search
                                    var $tbGlobalSearch = $vwChart.data("GlobalSearchInput");

                                    if (!$tbGlobalSearch || $tbGlobalSearch.length == 0) {
                                        $tbGlobalSearch = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.PrimaryFilters })
                                                                     .find("input[type='text'][data-input-id='tbGlobalSearch']");

                                        $vwChart.data("GlobalSearchInput", $tbGlobalSearch);
                                    }

                                    _params.Search = $tbGlobalSearch.val();

                                    APP.Service.Action({
                                        "_indicators": false, "c": "PluginEditor", "m": "KeyOpinionLeaderChartData", "args": _params
                                    }, function (result) {

                                        $vwChart.data("DataItem", result);
                                        onDataCallback(result);
                                    });

                                });
                            }
                            else {
                                onDataCallback(_result);
                            }

                        };  //end: _fnGetData

                        _fnGetData(function (result) {

                            var $render = $vwChart.children(".ChartContainer");

                            if ($render.length == 0) {
                                $render = $("<div class='ChartContainer' />");
                                $vwChart.append($render);
                            }

                            var _chartOptions = _controller.GetChartOptions({ "Target": $render, "Element": $vwChart, "Data": result });

                            $render.highcharts(_chartOptions);

                            _refreshCallback();
                        });

                    }); //end: events.refreshChart
                }

                $vwChart.trigger("events.refreshChart", { "Callback": onCallback });
            });

        })($(this));
    });

    var _isInitViewGroup = $element.data("is-init-view-group");
    var _groupID = _controller.ActiveGroupID();

    switch (_groupID) {

        case _controller.Data.ID.KOL:
        case _controller.Data.ID.EventActivity:

            if (_isInitViewGroup && _groupID == _controller.Data.ID.EventActivity) {

                var _viewMode = _controller.ActiveContentViewModeID();

                //check to make sure that the init events for the view group matches the view mode that it was initially configured for (otherwise re-init the view group)
                _isInitViewGroup = (util_forceInt($element.data("InitGroupContentViewMode"), enCE.None) == _viewMode);
            }

            if (!_isInitViewGroup) {

                var _ctxOptions = {
                    "ListViewID": null,
                    "AddNewItem": null,
                    "OnAddNewFocusProperty": null,
                    "OnAddNewConfigureDataItem": null,
                    "PropertyDataIdentifier": null,
                    "SaveActionMethod": null,
                    "DeleteActionMethod": null,
                    "SavePostProcessDateModifiedProperty": null,
                    "OnValidateForm": null,
                    "OnEditModeToggle": null,
                    "OnDefaultState": null
                };

                switch (_groupID) {

                    case _controller.Data.ID.KOL:
                        _ctxOptions.ListViewID = "summary_kol";
                        _ctxOptions.AddNewItem = _controller.Data.DefaultEntityKOL;
                        _ctxOptions.OnAddNewFocusProperty = enColKeyOpinionLeaderProperty.Name;
                        _ctxOptions.PropertyDataIdentifier = enColKeyOpinionLeaderProperty.KeyOpinionLeaderID;
                        _ctxOptions.OnAddNewConfigureDataItem = function (opts) {

                            if (_controller.CanAdmin()) {
                                if (opts.Callback) {
                                    opts.Callback();
                                }
                            }
                            else {

                                var _item = opts.Item;

                                _controller.DOM.ToggleIndicator(true);

                                APP.Service.Action({
                                    "_indicators": false, "c": "PluginEditor", "m": "UserCompanySearch", "args": { "IsCurrentUser": enCETriState.Yes }
                                }, function (result) {

                                    var _userDetail = (result ? result.List : null);

                                    _userDetail = (_userDetail || []);

                                    if (_userDetail.length == 1) {

                                        _userDetail = _userDetail[0];

                                        _controller.Utils.ApplyPropertyPathMappings({
                                            "SourceItem": _userDetail,
                                            "TargetItem": _item,
                                            "LookupPropertyPathUpdates": "%%TOK|ROUTE|PluginEditor|KOL_EntitySearchViewSelectionPropertyPathMapping|{ \"EntityType\": \"User\" }%%"
                                        });
                                    }

                                    _controller.DOM.ToggleIndicator(false);

                                    if (opts.Callback) {
                                        opts.Callback();
                                    }
                                });
                            }
                        };

                        _ctxOptions.SaveActionMethod = "KeyOpinionLeaderSave";
                        _ctxOptions.DeleteActionMethod = "KeyOpinionLeaderDelete";
                        _ctxOptions.SavePostProcessDateModifiedProperty = enColKeyOpinionLeaderProperty.DateModified;

                        var $clProfileImage = $element.find("#clProfileImage");
                        var $imgProfileKOL = $clProfileImage.children(".ImageIcon");

                        $element.data("ProfileImageView", $clProfileImage);

                        $clProfileImage.off("events.updateProfilePicture");
                        $clProfileImage.on("events.updateProfilePicture", function(e, args) {

                            args = util_extend({ "IsRemove": false, "URL": null, "UploadFileName": null }, args);

                            var $img = $imgProfileKOL;

                            var _url = util_forceString(args.URL);
                            var _editItem = (_controller.EditItem() || {});

                            if (!args.IsRemove && _url == "") {
                                var _info = util_extend({ "URL": null, "UploadFileName": null }, $clProfileImage.data("ImageInfo"));

                                args = util_extend(args, _info);

                                _url = util_forceString(args.URL);
                            }
                            else if (args.IsRemove) {
                                _editItem[enColCEKeyOpinionLeaderProperty.IsDeleteProfileImage] = true; //set flag to remove the profile picture
                            }

                            if (_url == "") {
                                $img.removeAttr("style");
                                $clProfileImage.removeData("ImageInfo");

                                args["UploadFileName"] = null;
                            }
                            else {
                                $img.css("background-image", "url('" + _url + "')");
                                $clProfileImage.data("ImageInfo", { "URL": _url, "UploadFileName": args.UploadFileName });
                            }

                            _editItem[enColCEKeyOpinionLeaderProperty.UploadProfileImageFileName] = args.UploadFileName;
                        });

                        $clProfileImage.off("click.editProfilePicture");
                        $clProfileImage.on("click.editProfilePicture", function (e, args) {

                            if (!$clProfileImage.hasClass("LinkClickable")) {
                                return;
                            }

                            var _onPopupBind = function () {

                                var $popup = $mobileUtil.PopupContainer();
                                var $vwFileUploadPicture = $popup.find("#vwFileUploadPicture");
                                var $img = $popup.find(".PreviewImageKOL > .ImageUserProfile > .ImageIcon");
                                var $clRemovePicture = $popup.find("#clRemovePicture");

                                var _imageInfo = util_extend({ "URL": null }, $clProfileImage.data("ImageInfo"));
                                var _hasExistPicture = (util_forceString(_imageInfo.URL) != "");

                                if (_hasExistPicture) {
                                    $img.css("background-image", "url('" + _imageInfo.URL + "')");
                                }

                                $clRemovePicture.toggle(_hasExistPicture && (util_forceString(_imageInfo["UploadFileName"]) != "" || _imageInfo["HasProfileImage"]));

                                $clRemovePicture.off("click.remove");
                                $clRemovePicture.on("click.remove", function () {

                                    dialog_confirmYesNo("Remove Picture", "Are you sure you want to remove the picture for the KOL and use the default?",
                                                        function () {
                                                            $vwFileUploadPicture.trigger("events.fileUpload_clear", { "IsDeleteUploadFile": true });
                                                            $img.removeAttr("style");
                                                            $clProfileImage.trigger("events.updateProfilePicture", { "IsRemove": true });
                                                        });

                                });

                                $vwFileUploadPicture.data(CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK, function (uploadOpts) {

                                    uploadOpts = util_extend({ "Element": null }, uploadOpts);

                                    var _url = uploadOpts.PreviewFileURL;

                                    $img.css("background-image", "url('" + _url + "')");

                                    $clRemovePicture.toggle(true);

                                    //$container.trigger("events.onFileUploadSuccess", { "UploadOptions": uploadOpts });
                                    $(uploadOpts.Element).data("LastUploadedFile", uploadOpts);
                                });

                                $vwFileUploadPicture.data("OnFileUploadClear", function (optsClear) {

                                    optsClear = util_extend({ "Element": null, "Callback": null }, optsClear);

                                    //remove the last uploaded file data flag
                                    $(optsClear.Element).removeData("LastUploadedFile");

                                    $clRemovePicture.toggle(false);

                                    if (optsClear.Callback) {
                                        optsClear.Callback();
                                    }
                                });

                                $popup.off("events.onSaveProfileKOL");
                                $popup.on("events.onSaveProfileKOL", function () {
                                    var _lastUploadedFile = $vwFileUploadPicture.data("LastUploadedFile");

                                    _lastUploadedFile = (_lastUploadedFile || {});

                                    $clProfileImage.trigger("events.updateProfilePicture", {
                                        "URL": _lastUploadedFile["PreviewFileURL"], "UploadFileName": _lastUploadedFile["UploadFileName"]
                                    });

                                    $vwFileUploadPicture.trigger("events.fileUpload_clear");
                                });

                            };  //end: _onPopupBind

                            var _html = "";
                            var _arrExt = [".png", ".jpg", ".jpeg", ".bmp"];

                            _html += "<div class='EditorEditProfilePictureKOL'>" +
                                     "  <div class='Instructions'>" +
                                     "      <p>" +
                                     util_htmlEncode("Upload the picture to use for the KOL profile with a recommended size of 100x100 and in one of the following formats: ") +
                                     util_arrJoinStr(_arrExt, null, ", ") +
                                     "      </p>" +
                                     "      <p>" + util_htmlEncode("Click the \"Remove\" button to delete the current KOL picture and use the default.") + "</p>" +
                                     "  </div>" +
                                     "  <div class='Content'>" +
                                     "      <div id='vwFileUploadPicture' " + util_renderAttribute("file_upload") + " " +
                                     util_htmlAttribute("data-attr-file-upload-exts", util_arrJoinStr(_arrExt, null, "|")) + " " +
                                     util_htmlAttribute("data-attr-file-upload-ref-id", "vwFileUploadPicture") + " " +
                                     util_htmlAttribute("data-attr-file-upload-css-class", "EditorFileUpload") + " " +
                                     util_htmlAttribute(CONTROL_FILE_UPLOAD_IS_FORCE_UPLOAD_ON_CHANGE, enCETriState.Yes) + " />" +
                                     "      <div class='PreviewImageKOL'>" +
                                     "          <div class='Label'>" + util_htmlEncode("Preview:") + "</div>" +
                                     "          <div class='EditorImageButton ImageUserProfile'>" +
                                     "              <div class='ImageIcon' />" +
                                     "          </div>" +
                                     _controller.Utils.HTML.GetButton({
                                         "Content": "Remove", "CssClass": "ButtonTheme",
                                         "Attributes": { "id": "clRemovePicture", "data-icon": "delete", "style": "display: none;" }
                                     }) +
                                     "      </div>" +
                                     "  </div>" +
                                     "</div>";

                            var _popupOptions = _controller.DefaultPopupOptions({
                                "Title": "Edit KOL Picture",
                                "HTML": _html, "Size": "EditorPopupFixed EditorPopupSizeSmall ScrollbarPrimary", "IsDisableFooterButtons": true,
                                "OnPopupBind": _onPopupBind,
                                "OnClose": function () {
                                    var $popup = $mobileUtil.PopupContainer();

                                    $popup.trigger("events.onSaveProfileKOL");
                                }
                            });

                            var _fnIndicator = _popupOptions.Utils.ToggleIndicator;

                            ClearMessages();

                            $mobileUtil.PopupOpen(_popupOptions);

                        }); //end: click.editProfilePicture

                        var $vwComments = $element.find(".CommentsView");

                        _ctxOptions.OnEditModeToggle = function (opts) {
                            $clProfileImage.toggleClass("LinkClickable", opts.IsEditable);
                            $vwComments.toggleClass("EditModeOn", opts.IsEditable);
                        };

                        _ctxOptions.OnDefaultState = function () {
                            $clProfileImage.removeData("ItemID");                            
                        };

                        break;

                    case _controller.Data.ID.EventActivity:

                        var _viewMode = _controller.ActiveContentViewModeID();
                        var _propEntityStartDate = null;
                        var _propEntityEndDate = null;

                        if (_viewMode == enCContentViewModeKOL.Event) {

                            _ctxOptions.ListViewID = "summary_event";
                            _ctxOptions.AddNewItem = _controller.Data.DefaultEntityEvent;
                            _ctxOptions.OnAddNewFocusProperty = enColEventProperty.Name;
                            _ctxOptions.PropertyDataIdentifier = enColEventProperty.EventID;
                            _ctxOptions.OnAddNewConfigureDataItem = function (opts) {

                                var _item = opts.Item;

                                //set owner to be current user
                                _item[enColEventProperty.UserID] = global_AuthUserID();

                                if (opts.Callback) {
                                    opts.Callback();
                                }
                            };

                            _ctxOptions.SaveActionMethod = "EventSave";
                            _ctxOptions.DeleteActionMethod = "EventDelete";
                            _ctxOptions.SavePostProcessDateModifiedProperty = enColEventProperty.DateModified;

                            _propEntityStartDate = enColEventProperty.StartDate;
                            _propEntityEndDate = enColEventProperty.EndDate;
                        }
                        else if (_viewMode == enCContentViewModeKOL.Activity) {

                            _ctxOptions.ListViewID = "summary_activity";
                            _ctxOptions.AddNewItem = _controller.Data.DefaultEntityActivity;
                            _ctxOptions.OnAddNewFocusProperty = enColActivityProperty.Name;
                            _ctxOptions.PropertyDataIdentifier = enColActivityProperty.ActivityID;
                            _ctxOptions.OnAddNewConfigureDataItem = function (opts) {

                                var _item = opts.Item;

                                //set owner to be current user
                                _item[enColActivityProperty.UserID] = global_AuthUserID();

                                if (opts.Callback) {
                                    opts.Callback();
                                }
                            };

                            _ctxOptions.SaveActionMethod = "ActivitySave";
                            _ctxOptions.DeleteActionMethod = "ActivityDelete";
                            _ctxOptions.SavePostProcessDateModifiedProperty = enColActivityProperty.DateModified;

                            _propEntityStartDate = enColActivityProperty.StartDate;
                            _propEntityEndDate = enColActivityProperty.EndDate;
                        }

                        _ctxOptions.OnValidateForm = function (opts) {

                            var $propDates = $(opts.List).filter(".PropertyView[" + util_htmlAttribute("data-attr-prop-path", _propEntityStartDate) + "]," +
                                                                 ".PropertyView[" + util_htmlAttribute("data-attr-prop-path", _propEntityEndDate) + "]");

                            if ($propDates.length == 2) {
                                var _validDates = true;
                                var _fieldTitles = [];

                                $.each($propDates, function (index) {
                                    var $prop = $(this);
                                    var $input = $prop.find(".ViewInput [" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");

                                    _fieldTitles.push($input.attr("data-field-title"));

                                    _validDates = (_validDates && $input.data("is-valid"));
                                });

                                if (_validDates) {
                                    var _startDate = opts.DataItem[_propEntityStartDate];
                                    var _endDate = opts.DataItem[_propEntityEndDate];

                                    if (_endDate < _startDate) {
                                        opts.Result.Errors.push(_fieldTitles[0] + " must be less than or equal to the " + _fieldTitles[1]);
                                    }
                                }
                            }
                        };

                        $element.data("InitGroupContentViewMode", _viewMode);

                        break;  //end: EventActivity context options
                }

                var $btnExports = $element.find("[data-attr-editor-controller-action-btn='export_entity']");
                var $btnDelete = $element.find("[data-attr-editor-controller-action-btn='delete_entity']");
                var $btnCancel = $element.find("[data-attr-editor-controller-action-btn='cancel_edit_entity']");
                var $btnSave = $element.find("[data-attr-editor-controller-action-btn='save_entity']");
                var $listView = $element.find(".ListView[" + util_htmlAttribute("data-list-view-type", _ctxOptions.ListViewID) + "]");
                var $vwGroupTypeListView = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.ListView });

                //configure the list view group settings
                $vwGroupTypeListView.data("AddNewItem", _ctxOptions.AddNewItem)
                                    .data("OnAddNewFocusProperty", _ctxOptions.OnAddNewFocusProperty)
                                    .data("OnAddNewConfigureDataItem", _ctxOptions.OnAddNewConfigureDataItem);

                var _fnRefresh = function (isSave, opts) {
                    var _item = (isSave ? (opts.DataItem || {}) : null);

                    //set the current item selected to be the save item entry, if applicable
                    $listView.data("SelectedItemID", isSave ? util_forceInt(_item[_ctxOptions.PropertyDataIdentifier], enCE.None) : null);

                    if (!isSave) {

                        _controller.DataItemBind({
                            "DataItem": util_extend({}, _ctxOptions.AddNewItem, false, true), "Callback": function () {

                                _controller.BindFeedbackView({
                                    "Callback": function () {
                                        _controller.SetPropertyViewEditMode(false);

                                        $listView.trigger("events.onRefreshListView", { "Callback": opts["Callback"] });
                                    }
                                });
                            }
                        });
                    }
                    else {
                        $listView.trigger("events.onRefreshListView", { "Callback": opts["Callback"] });
                    }
                };

                $element.data("OnDefaultState", _ctxOptions.OnDefaultState);

                $element.data("OnSetPropertyViewEditMode", function (isEditable, validateEditItemExists) {

                    validateEditItemExists = util_forceBool(validateEditItemExists, false);

                    var _dataItem = _controller.EditItem();
                    var _hasItem = (_dataItem && util_forceInt(_dataItem[_ctxOptions.PropertyDataIdentifier], enCE.None) != enCE.None);

                    $btnSave.toggle(isEditable);
                    $btnDelete.toggle(isEditable && _hasItem);
                    $btnExports.toggle(!isEditable && _hasItem);    //export only supported in view mode of existing items
                    $btnCancel.toggle(isEditable);

                    //check if it is edit mode and the edit item does not exist (e.g. in the case of edit existing item but it has since been deleted)
                    if (validateEditItemExists && isEditable && !_hasItem) {
                        _controller.SetPropertyViewEditMode(false);
                    }

                    if (_ctxOptions.OnEditModeToggle) {
                        _ctxOptions.OnEditModeToggle.call(this, { "Item": _dataItem, "HasItem": _hasItem, "IsEditable": isEditable });
                    }
                });

                $element.data("OnValidateForm", _ctxOptions.OnValidateForm);

                $btnSave.data("OnSetSaveArgs", function (opts) {
                    opts.Params.m = _ctxOptions.SaveActionMethod;

                    if (opts["PostProcessDateModifiedOptions"]) {
                        opts.PostProcessDateModifiedOptions.PropertyDateModified = _ctxOptions.SavePostProcessDateModifiedProperty;
                    }
                });

                $btnSave.data("OnSaveSuccess", function (opts) {
                    _fnRefresh(true, opts);
                });

                $btnDelete.data("OnSetDeleteArgs", function (opts) {
                    opts.Params.m = _ctxOptions.DeleteActionMethod;
                });

                $btnDelete.data("OnDeleteSuccess", function (opts) {
                    _fnRefresh(false, opts);
                });

                $element.data("OnDataBind", function (opts) {

                    var _dataItem = _controller.EditItem();
                    var _hasItem = (_dataItem && util_forceInt(_dataItem[_ctxOptions.PropertyDataIdentifier], enCE.None) != enCE.None);

                    var _itemID = (opts["Item"] ? opts.Item[enColKeyOpinionLeaderProperty.KeyOpinionLeaderID] : null);
                    var _url = _controller.Utils.ConstructKeyOpinionLeaderProfileURL({
                        "ID": _itemID,
                        "IsInitCacheKey": opts["IsClearEntityCache"]
                    });

                    var $clProfileImage = $element.data("ProfileImageView");

                    if ($clProfileImage) {

                        var _isRefresh = true;
                        var _id = $clProfileImage.data("ItemID");

                        _isRefresh = (_id === undefined || _id != util_forceInt(_itemID, enCE.None));

                        if (_isRefresh) {
                            var $imgProfileKOL = $clProfileImage.children(".ImageIcon");

                            $clProfileImage.data("ItemID", _itemID);

                            $imgProfileKOL.css("background-image", "url(" + _url + ")");

                            $clProfileImage.data("ImageInfo", {
                                "URL": _url,
                                "HasProfileImage": (opts["Item"] ? opts.Item[enColCEKeyOpinionLeaderProperty.HasProfileImage] : false)
                            });
                        }
                    }

                    if (!_hasItem) {
                        $btnExports.hide();
                    }
                    else {
                        $.each($btnExports, function () {
                            var $btn = $(this);

                            $btn.toggle($btn.hasClass("EditModeOn") == false);
                        });
                    }
                });
            }

            break;  //end: KOL
    }

    if (!_isInitViewGroup) {
        $element.data("is-init-view-group", true);

        $element.off("events.onActionInputEditorDataType");
        $element.on("events.onActionInputEditorDataType",
                    ".PropertyView[" + util_htmlAttribute("data-attr-label-is-custom-value", enCETriState.Yes) + "] .LabelContent", function (e, args) {

                        if (!args.IsHTML) {
                            var $this = $(this);
                            var _labelType = $this.attr("data-render-label-type");

                            switch (_labelType) {

                                case "link":
                                    args.Value = _controller.Utils.HTML.ParseTextLinkHTML(args.Value, { "linkClass": "LinkExternal WordBreak" });
                                    args.IsHTML = true;
                                    break;

                                case "datetime":
                                    var _dt = util_FormatDateTime(args.Value, "", null, null, { "IsValidateConversion": true });

                                    args.IsHandled = true;
                                    $this.text(_dt);
                                    break;
                            }
                        }

                    }); //end: events.onActionInputEditorDataType

        $element.off("events.onListBoxPopupEdit");
        $element.on("events.onListBoxPopupEdit", ".ListBoxPopup", function (e, args) {

            var $listBox = $(this);
            var $vwProperty = $listBox.closest(".PropertyView");

            args = util_extend({ "Trigger": null, "Element": null, "Callback": null }, args);

            var _popupActionButtonID = $mobileUtil.GetClosestAttributeValue(args.Trigger, "data-popup-action-button-id");

            var $btnPopup = $(_controller.Utils.HTML.GetButton({
                "ActionButtonID": _popupActionButtonID, "Content": "Edit", "Attributes": {
                    "data-field-title": util_forceString($mobileUtil.GetClosestAttributeValue(args.Trigger, "data-field-title"))
                }
            }));

            var _callback = function () {

                $btnPopup.remove();

                if (args.Callback) {
                    args.Callback();
                }
            };

            $btnPopup.hide();

            $element.append($btnPopup);

            var $inputElement = $vwProperty.find("[" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");

            //if multiple input elements are found, search again but restrict to only be contained with view input types
            if ($inputElement.length > 1) {
                $inputElement = $vwProperty.find(".ViewInput [" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");
            }

            //set the source data list (from the initial data item state available on the input element)
            $btnPopup.data("SourceDataList", $inputElement.data("SourceDataList"));

            $btnPopup.data("ListBoxElement", $listBox);

            //populate the current selections of the property list to the data item (prior to invoking search popup)
            _controller.DataItemBind({
                "IsPopulate": true, "FilterSelector": "[" + util_htmlAttribute("data-attr-prop-path", $vwProperty.attr("data-attr-prop-path")) + "]",
                "IsValidate": false, "Callback": function (result) {
                    $btnPopup.trigger("click", { "Callback": _callback });
                }
            });

        }); //end: events.onListBoxPopupEdit

        $element.off("events.onListBoxPopupAddNew");
        $element.on("events.onListBoxPopupAddNew", ".ListBoxPopup", function (e, args) {

            var $listBox = $(this);
            var $vwProperty = $listBox.closest(".PropertyView");

            args = util_extend({ "Trigger": null, "Element": null, "Callback": null }, args);

            var _callback = function () {

                if (args.Callback) {
                    args.Callback();
                }
            };

            var _addEntityType = $mobileUtil.GetClosestAttributeValue(args.Trigger, "data-add-entity-type");
            var _ctxOptions = {
                "PropertyMappings": {}
            };

            switch (_addEntityType) {

                case "Resource_KOL":
                case "Resource_Event":
                case "Resource_Activity":

                    if (_addEntityType == "Resource_KOL") {
                        _ctxOptions.PropertyMappings[enColRepositoryResourceKeyOpinionLeaderProperty.ResourceDocumentTypeID] = enColRepositoryResourceProperty.DocumentTypeID;
                        _ctxOptions.PropertyMappings[enColRepositoryResourceKeyOpinionLeaderProperty.ResourceIDName] = enColRepositoryResourceProperty.Name;
                    }
                    else if (_addEntityType == "Resource_Activity") {
                        _ctxOptions.PropertyMappings[enColRepositoryResourceActivityProperty.ResourceDocumentTypeID] = enColRepositoryResourceProperty.DocumentTypeID;
                        _ctxOptions.PropertyMappings[enColRepositoryResourceActivityProperty.ResourceIDName] = enColRepositoryResourceProperty.Name;
                    }
                    else if (_addEntityType == "Resource_Event") {
                        _ctxOptions.PropertyMappings[enColRepositoryResourceEventProperty.ResourceDocumentTypeID] = enColRepositoryResourceProperty.DocumentTypeID;
                        _ctxOptions.PropertyMappings[enColRepositoryResourceEventProperty.ResourceIDName] = enColRepositoryResourceProperty.Name;
                    }

                    var _documentTypes = ("%%TOK|ROUTE|PluginEditor|KOL_RepositoryDocumentTypes%%" || []);
                    var _html = "";

                    //show the document types supported for the add view
                    _html += "<div>" + util_htmlEncode("Please select the type of document to add:") + "</div>";

                    _html += "<div class='ListViewPopupSelection'>";

                    for (var i = 0; i < _documentTypes.length; i++) {
                        var _documentType = _documentTypes[i];

                        _html += _controller.Utils.HTML.GetButton({
                            "CssClass": "ButtonTheme",
                            "Content": _documentType[enColRepositoryDocumentTypeProperty.Name],
                            "Attributes": {
                                "data-icon": "arrow-r", "data-inline": "false", "data-mini": "false",
                                "data-document-type-id": _documentType[enColRepositoryDocumentTypeProperty.DocumentTypeID]
                            }
                        });
                    }

                    _html += "</div>";

                    var _selectedDocumentTypeID = null;
                    var _fnIndicator = null;

                    var _onPopupBind = function () {

                        var $popup = $mobileUtil.PopupContainer();

                        $popup.off("click.onItemSelection");
                        $popup.on("click.onItemSelection", ".LinkClickable[data-document-type-id]:not(.LinkDisabled)", function () {
                            _selectedDocumentTypeID = util_forceInt($(this).attr("data-document-type-id"), enCE.None);
                            $mobileUtil.PopupClose();
                        });
                    };

                    var _onDismissCallback = function () {

                        _callback();

                        if (util_forceInt(_selectedDocumentTypeID) != enCE.None) {

                            setTimeout(function () {

                                _controller.Data.RenderOptionRepositoryCategoryLookup.Get({
                                    "DocumentTypeID": _selectedDocumentTypeID, "Callback": function (category) {

                                        var _categoryID = util_forceInt(category ? category[enColRepositoryCategoryProperty.CategoryID] : null, enCE.None);

                                        if (_categoryID != enCE.None) {
                                            _controller.Data.RepositoryResourceController.PopupEditResource({
                                                "IsExtViewMode": true,
                                                "Size": "EditorPopupFixed ScrollbarPrimary",
                                                "CategoryID": _categoryID,
                                                "OnSaveCallback": function (opts) {

                                                    var _fieldID = util_forceInt($vwProperty.attr("data-attr-render-field-id"), enCE.None);
                                                    var _field = _controller.Data.LookupRenderField[_fieldID];
                                                    var _fieldItem = (_field && _field["_fieldItem"] ? _field["_fieldItem"] : null);

                                                    if (_fieldItem["_renderList"]) {
                                                        var _resource = opts.Item;
                                                        var _renderList = _fieldItem["_renderList"];
                                                        var _propertyPath = $vwProperty.attr("data-attr-prop-path");

                                                        var _bridgeItem = new _renderList.InstanceType();

                                                        _bridgeItem[_renderList.PropertyValue] = _resource[enColRepositoryResourceProperty.ResourceID];

                                                        for (var _prop in _ctxOptions.PropertyMappings) {
                                                            var _valueProp = _ctxOptions.PropertyMappings[_prop];

                                                            _bridgeItem[_prop] = _resource[_valueProp];
                                                        }

                                                        var _dataItem = _controller.EditItem();
                                                        var _valList = util_propertyValue(_dataItem, _propertyPath);

                                                        if (!_valList) {
                                                            _valList = [];
                                                            util_propertySetValue(_dataItem, _propertyPath, _valList);
                                                        }

                                                        _valList.push(_bridgeItem);

                                                        //rebind the current item for the applicable property path (restricted bind of elements)
                                                        _controller.DataItemBind({
                                                            "FilterSelector": "[" + util_htmlAttribute("data-attr-prop-path", _propertyPath) + "]",
                                                            "IsSelectiveUpdate": true
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    }
                                });

                            }, 500);
                        }

                    };  //end: _onDismissCallback

                    var _popupOptions = _controller.DefaultPopupOptions({
                        "Title": "Add New",
                        "HTML": _html, "Size": "EditorPopupFixed EditorPopupSizeSmall ScrollbarPrimary", "IsDisableFooterButtons": true,
                        "OnPopupBind": _onPopupBind,
                        "OnClose": function () {
                            _onDismissCallback();
                        }
                    });

                    _fnIndicator = _popupOptions.Utils.ToggleIndicator;

                    ClearMessages();

                    $mobileUtil.PopupOpen(_popupOptions);

                    break;  //end: Resource

                default:
                    _callback();
                    break;
            }

        }); //end: events.onListBoxPopupAddNew

        $element.off("click.onListBoxItemSelection");
        $element.on("click.onListBoxItemSelection",
                    ".ListBoxPopup > .ListBoxSelections > .ItemSelection[item-value] > .Label.LinkClickable:not(.LinkDisabled), " +
                    ".LabelContent[" + util_htmlAttribute("data-is-clickable-labels", enCETriState.Yes) + "] > .LinkClickable[item-value]:not(.LinkDisabled)",
                    function (e, args) {
                        
                        //check if the closest target is not an external download link
                        var $search = $(e.target).closest(".LinkDownload,.LinkClickable[item-value]");

                        if (!$search.is(".LinkDownload")) {

                            //TODO: refactor with controller method "ShowEntityDetailsPopup"
                            var $this = $(this);
                            var _itemID = $mobileUtil.GetClosestAttributeValue($this, "item-value");
                            var _entityType = $mobileUtil.GetClosestAttributeValue($this, "data-view-entity-type");

                            var $temp = $(_controller.Utils.HTML.GetButton({
                                "ActionButtonID": "entity_details_view", "Attributes": {
                                    "data-attr-item-id": _itemID,
                                    "data-view-entity-type": _entityType
                                }
                            }));

                            $temp.hide()
                                 .insertAfter($this);

                            $temp.trigger("click", {

                                //although this is not needed due to the context of action
                                //(will ensure in the event if list item is clicked the legacy click action is still executed)
                                "IsDisableInteractiveValidation": true,
                                "Callback": function () {
                                    $temp.remove();
                                }
                            });
                        }

                    }); //end: click.onListBoxItemSelection

        $element.off("change.onFilterUpdate");
        $element.on("change.onFilterUpdate",
                    "[" + util_htmlAttribute("data-view-type", enCViewTypeKOL.PrimaryFilters) + "] .Filter[data-filter-is-primary] select," +
                    "[" + util_renderAttribute("pluginEditor_listToggle") + "]," + "input[type='text'][data-input-id='tbGlobalSearch']",
                    function () {
                        var $this = $(this);
                        var _isDropdown = $this.is("select");
                        var _valid = true;

                        if (_isDropdown) {
                            $this.trigger("events.onRefreshFilterHighlight");

                            var _entityTypeID = $mobileUtil.GetClosestAttributeValue($this, "data-filter-entity-type-id");

                            //check if the entity tpye is the view switch for events/activity (in which case must disable saving the filter selections)
                            if (_entityTypeID == _controller.Data.FilterEntityTypeSwitchEventActivityID) {
                                _valid = false;
                            }
                        }
                        else if (!_isDropdown && $this.is("[data-input-id='tbGlobalSearch']")) {

                            //check if the current global search text was already processed (i.e. does not perform an uncessary repeated search)
                            var _prevSearch = $this.data("LastSearch");
                            var _val = $this.val();

                            if (_prevSearch && _prevSearch === _val){
                                _valid = false;
                            }

                            $this.data("LastSearch", _val);
                        }

                        if (_valid) {
                            _controller.SetFilterSelections({
                                "Callback": function () {
                                    _controller.RefreshActiveView({ "IsFilterUpdate": true });
                                }
                            });
                        }
                    });

        $element.off("events.onRefreshFilterHighlight");
        $element.on("events.onRefreshFilterHighlight",
                    "[" + util_htmlAttribute("data-view-type", enCViewTypeKOL.PrimaryFilters) + "] .Filter[data-filter-is-primary]:not(.FilterDisableHighlight) select",
                    function () {
                        var $this = $(this);
                        var _val = $this.val();
                        var _opt = $this.find("option:first");

                        //toggle dropdown highlight text is a value other than the first option is selected
                        $this.closest(".Filter")
                             .toggleClass("FilterEnabled", util_forceString(_opt.val()) !== util_forceString(_val));
                    });

        $element.off("events.onViewSetEditItem");
        $element.on("events.onViewSetEditItem", function (e, args) {

            args = util_extend({ "Item": null, "ItemID": null, "Callback": null }, args);

            var $listView = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.ListView });
            var _isFullScreen = $listView.hasClass("EditorFixedViewTransitionFullScreen");

            var _onCallback = function () {

                if (!_isFullScreen) {
                    $listView.removeClass("EditorFixedViewDisableTransition"); //restore transition animations
                }

                if (args.Callback) {
                    args.Callback();
                }
            };

            if (!_isFullScreen) {
                var $clResize = $listView.find("[data-attr-editor-controller-action-btn='resize']:first");

                $listView.addClass("EditorFixedViewDisableTransition"); //disable transition animations (for now)

                $clResize.trigger("click.controller_buttonClick");
            }

            var $vwSelectionListView = $listView.find(".R1C1 .ListView[data-list-view-type]:first");
            var $repeater = $vwSelectionListView.find(".CRepeater:first");

            if ($repeater.length == 1) {
                var _isTemp = false;
                var $clEntry = $vwSelectionListView.find("[" + util_htmlAttribute("data-attr-item-id", args.ItemID) + "]:first");

                if ($clEntry.length == 0) {
                    $clEntry = $("<div class='EditorElementHidden' " + util_htmlAttribute("data-attr-item-id", args.ItemID) + ">" +
                                 " <div class='EntityLineItem'>" +
                                 _controller.Utils.HTML.GetButton({ "ActionButtonID": "edit_entity" }) +
                                 " </div>" +
                                 "</div>");

                    _isTemp = true;
                }

                if (_isTemp) {
                    $repeater.append($clEntry);
                    $clEntry.trigger("create");
                }

                var $vwEntityItem = $clEntry.find(".EntityLineItem:first");

                $vwEntityItem.removeClass("LinkDisabled Selected");   //remove the disabled/selected state (otherwise click event will not fire)

                $vwEntityItem.trigger("click.onItemClick", {
                    "IsDisableInteractiveValidation": true,
                    "Callback": function () {

                        //need to find the item again (as the list view has refreshed the data on selection)
                        $clEntry = $vwSelectionListView.find("[" + util_htmlAttribute("data-attr-item-id", args.ItemID) + "]:first");

                        if ($clEntry.length == 0) {

                            //handle the case where the item is no longer available
                            setTimeout(function () {
                                AddMessage("The item is invalid or no longer exists.", null, null, { "IsTimeout": true });
                            }, 100);

                            _onCallback();
                        }
                        else {

                            $clEntry.find("[data-attr-editor-controller-action-btn='edit_entity']:first")
                                    .trigger("click.controller_buttonClick", {
                                        "OnEditCallback": function () {

                                            if (_isTemp) {
                                                $clEntry.remove();
                                            }

                                            _onCallback();
                                        }
                                    });
                        }
                    }
                });
            }
            else {
                _controller.OnListViewEntityAction({
                    "ItemID": args.ItemID, "ListView": $vwSelectionListView, "ListViewType": $vwSelectionListView.attr("data-list-view-type"), "Callback": _onCallback
                });
            }

        }); //end: events.onViewSetEditItem

        var $tbGlobalSearch = $element.find("input[type='text'][data-input-id='tbGlobalSearch']");

        if (!$tbGlobalSearch.data("is-init-global-search")) {
            $tbGlobalSearch.data("is-init-global-search", true);

            $tbGlobalSearch.attr(DATA_ATTRIBUTE_RENDER, "searchable_field")
                           .data("SearchConfiguration", {
                               "SearchableParent": $tbGlobalSearch.closest(".SearchableView"),
                               "OnRenderResult": function (result, opts) {
                                   $tbGlobalSearch.trigger("change.onFilterUpdate");
                               },
                               "OnSearch": function (opts, callback) {
                                   callback();
                               }
                           });

            $mobileUtil.RenderRefresh($tbGlobalSearch, true);
        }
    }

    _queue.Run({ "Callback": _callback });
};

CKeyOpinionLeaderController.prototype.SetActiveGroupContentViewMode = function (options) {
    var _controller = this;

    options = util_extend({ "ViewMode": _controller.ActiveContentViewModeID(), "IsRefreshFilterEntityType": false, "Callback": null }, options);

    var _callback = function () {

        if (options.Callback) {
            options.Callback();
        }
    };

    //set the updated view mode
    _controller.DOM.View.data("ActiveContentViewModeID", options.ViewMode);

    if (options.IsRefreshFilterEntityType) {
        var $filter = _controller.ActiveGroupContainer().find(".Filter[" + util_htmlAttribute("data-filter-entity-type-id",
                                                                                              _controller.Data.FilterEntityTypeSwitchEventActivityID) + "]:first");

        if ($filter.length == 1) {
            var $ddl = $filter.find("select:first");

            $ddl.val(options.ViewMode);

            try {
                $ddl.selectmenu("refresh");
            } catch (e) {
            }
        }
    }

    //refresh the active view and ensure no DOM element cache is used (since child elements for the active group may be restored)
    _controller.RefreshActiveView({ "Callback": _callback, "IsDisableElementCache": true });
};

CKeyOpinionLeaderController.prototype.ToggleEditMode = function (options) {
    options = util_extend({ "Controller": null, "PluginInstance": null, "IsEdit": false, "Callback": null, "LayoutManager": null, "FilteredList": null, "Trigger": null }, options);

    var _handled = false;
    var _controller = options.Controller;
    var _pluginInstance = (options.PluginInstance ? options.PluginInstance : _controller.PluginInstance);
    var $container = $(_controller.DOM.Element);

    if (options.LayoutManager) {
        options.LayoutManager.ToolbarSetButtons({ "IsHideEditButtons": true });
    }

    if (_controller.DOM.View) {
        _controller.DOM.View.toggleClass("EditModeOn", options.IsEdit);
    }

    if (!_handled && options.Callback) {
        options.Callback();
    }
};

CKeyOpinionLeaderController.prototype.OnButtonClick = function (options) {
    options = util_extend({
        "Controller": null, "PluginInstance": null, "ButtonID": null, "Trigger": null, "Event": null, "Parent": null, "LayoutManager": null, "InvokeExtArgs": null
    }, options);

    var $btn = $(options.Trigger);
    var _controller = options.Controller;
    var _pluginInstance = _controller.PluginInstance;
    var $container = $(_controller.DOM.Element);

    var _html = "";

    if (options.ButtonID == "dismiss") {
        options["OnDismissCallback"] = function () {
        };
    }

    var _handled = _controller.Utils.ProcessButtonClick(options);

    if (!_handled) {

        var _fnToggleButton = function (isEnabled) {
            $btn.toggleClass("LinkDisabled", !isEnabled);
        };

        _fnToggleButton(false);

        if (options.ButtonID == "add_entity") {
            var _isDisableInteractiveValidation = util_forceBool(options.IsDisableInteractiveValidation, false);

            if (!_isDisableInteractiveValidation) {

                //check if the parent view type has disabled interactive events, e.g. such as when in add/edit item mode
                var $parent = $btn.closest("[data-view-type]");

                if (_isDisableInteractiveValidation == false && $parent.hasClass("DisableInteractiveEvents")) {
                    _fnToggleButton(true);
                    return;
                }
            }
        }

        switch (options.ButtonID) {

            case "add_entity":
                var $list = _controller.FindActiveGroupViewTypes({ "ViewType": [enCViewTypeKOL.Calendar, enCViewTypeKOL.ActivityDetails] });
                var $parent = $btn.closest("[data-view-type]");
                var _addItem = util_extend({}, $parent.data("AddNewItem"), false, true);
                var _focusPropertyName = $parent.data("OnAddNewFocusProperty");
                var _onConfigureDataItem = $parent.data("OnAddNewConfigureDataItem");
                var _isAddClearItem = util_forceBool($btn.data("IsAddClearItem"), false);

                if (_isAddClearItem) {
                    $btn.removeData("IsAddClearItem");
                }

                $list.addClass("EditorFixedViewTransitionSizeHeightA");
                $parent.addClass("EditorFixedViewTransitionSizeWidthFull CanResizeInitial");

                if (!_onConfigureDataItem) {
                    _onConfigureDataItem = function (opts) {
                        opts = util_extend({ "Item": null, "Callback": null }, opts);

                        if (opts.Callback) {
                            opts.Callback();
                        }
                    };
                }

                var _fnOnDefaultState = _controller.ActiveGroupContainer().data("OnDefaultState");

                if (_fnOnDefaultState) {
                    _fnOnDefaultState();
                }

                _onConfigureDataItem({
                    "Item": _addItem, "Trigger": $btn, "Parent": $parent, "Callback": function () {

                        //rebind the list view (use cached data since mainly want to refresh selection)
                        _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.ListView })
                                   .find(".ListView")
                                   .trigger("events.onRefreshListView", { "IsCachedData": true, "SelectedItemID": null });

                        _controller.DataItemBind({
                            "DataItem": _addItem, "IsAddNewTrigger": true, "Callback": function () {

                                if (!_isAddClearItem) {
                                    _controller.SetPropertyViewEditMode(true);

                                    if ($parent && !$parent.hasClass("EditorFixedViewTransitionFullScreen")) {

                                        //force full screen
                                        $parent.find("[data-attr-editor-controller-action-btn='resize']").trigger("click");
                                    }

                                    if (util_forceString(_focusPropertyName) != "") {
                                        var $tb = $parent.find(".PropertyView[" + util_htmlAttribute("data-attr-prop-path", _focusPropertyName) + "] input:first");

                                        $tb.trigger("focus");
                                    }
                                }
                                else {
                                    _controller.SetPropertyViewEditMode(false);
                                }

                                var _queueRefresh = new CEventQueue();

                                _queueRefresh.Add(function (onCallback) {
                                    _controller.BindSearchListViewEditor({
                                        "Callback": onCallback
                                    });
                                });

                                _queueRefresh.Add(function (onCallback) {
                                    _controller.BindCalendarView({
                                        "Callback": onCallback
                                    });
                                });

                                if (_controller.ActiveGroupID() == _controller.Data.ID.KOL) {
                                    _queueRefresh.Add(function (onCallback) {
                                        _controller.BindFeedbackView({ "Callback": onCallback });
                                    });
                                }

                                _queueRefresh.Run({
                                    "Callback": function () {
                                        _fnToggleButton(true);

                                        if (options["OnAddCallback"]) {
                                            options.OnAddCallback();
                                        }
                                    }
                                });
                            }
                        });
                    }
                });

                break;  //end: add_entity

            case "delete_entity":

                var _title = $btn.attr("data-display-title");

                if (util_forceString(_title) == "") {
                    _title = "Item";
                }

                var _fn = function (success, saveItem) {

                    var _fnMessage = function () {
                        AddMessage(_title + " has been successfully deleted.", null, null, { "IsTimeout": true });
                    };

                    _fnToggleButton(true);
                    _controller.DOM.ToggleIndicator(false);

                    if (success) {

                        _controller.BindCalendarView({
                            "Callback": function () {

                                var _fnDeleteSuccess = $btn.data("OnDeleteSuccess");

                                if (_fnDeleteSuccess) {
                                    _fnDeleteSuccess.call(_controller, { "Trigger": $btn, "Callback": _fnMessage });
                                }
                                else {
                                    _fnMessage();
                                }
                            }
                        });
                    }
                };

                dialog_confirmYesNo("Delete", "Are you sure you want to delete the " + _title + "?", function () {

                    //delete item and rebind view
                    var _fnSetDeleteArgs = $btn.data("OnSetDeleteArgs");
                    var _item = _controller.EditItem();

                    var _params = {
                        "_action": "SAVE", "_indicators": false,
                        "c": "PluginEditor", "m": "", "args": {
                            "Item": util_stringify(_item)
                        },
                        "_eventArgs": {
                            "Options": {
                                "CallbackGeneralFailure": function () {

                                    //TODO handle save conflict and rebind
                                    _fn();
                                }
                            }
                        }
                    };

                    if (_fnSetDeleteArgs) {
                        _fnSetDeleteArgs.call(_controller, { "Trigger": $btn, "DataItem": _item, "Params": _params });
                    }

                    _controller.DOM.ToggleIndicator(true);

                    APP.Service.Action(_params, function (result) {

                        //refresh filters
                        _controller.BindFilters({
                            "ToggleIndicator": false, "IsDependencyTrigger": true, "Callback": function () {
                                _fn(true);
                            }
                        });
                    });

                }, _fn);

                break;

            case "save_entity":

                var _fn = function (success, saveItem) {

                    var _saveContinue = (util_forceInt($btn.attr("data-is-save-button-continue"), enCETriState.None) == enCETriState.Yes);
                    var _fnMessage = function () {
                        AddMessage("Changes have been successfully saved.", null, null, { "IsTimeout": true });

                        if (_controller.State.ControllerRenderOptions.HasExternalAddMode) {
                            var _dataItem = _controller.EditItem();
                            var $clNavigateBack = _controller.DOM.View.find("[data-attr-editor-controller-action-btn='external_action']" +
                                                                            "[data-external-action-id='navigate_back']:first");

                            //set the data item for the navigate back request
                            $clNavigateBack.data("DataItem", _dataItem)
                                           .data("IsRequirePrompt", false);
                            $clNavigateBack.trigger("click");
                        }
                    };

                    _fnToggleButton(true);
                    _controller.DOM.ToggleIndicator(false);
                    
                    if (success) {
                        
                        //refresh the search editor list views and calendar view
                        _controller.BindSearchListViewEditor({
                            "IsDisableEditModeBind": true,
                            "Callback": function () {

                                _controller.BindFeedbackView({
                                    "Callback": function () {

                                        _controller.BindCalendarView({
                                            "Callback": function () {

                                                if (!_saveContinue) {
                                                    _controller.SetPropertyViewEditMode(false); //switch to read only mode
                                                }

                                                var _fnSaveSuccess = $btn.data("OnSaveSuccess");

                                                if (_fnSaveSuccess) {
                                                    _fnSaveSuccess.call(_controller, {
                                                        "Trigger": $btn, "DataItem": saveItem, "Callback": _fnMessage
                                                    });
                                                }
                                                else {
                                                    _fnMessage();
                                                }
                                            }
                                        }); //end: calendar view refresh

                                    }
                                });
                            }
                        });
                    }

                };  //end: _fn

                dialog_confirmYesNo("Save", "Are you sure you want to save changes?", function () {

                    ClearMessages();

                    _controller.DataItemBind({
                        "IsPopulate": true, "IsValidate": true, "Callback": function (result) {

                            var _item = result.DataItem;
                            var _valid = (result.Errors.length == 0);

                            if (_valid) {

                                //save the item and rebind view
                                var _fnSetSaveArgs = $btn.data("OnSetSaveArgs");

                                var _params = {
                                    "_action": "SAVE", "_indicators": false,
                                    "c": "PluginEditor", "m": "", "args": {
                                        "Item": util_stringify(_item),
                                        "DeepSave": true
                                    },
                                    "_eventArgs": {
                                        "Options": {
                                            "CallbackGeneralFailure": function () {

                                                //TODO handle save conflict and rebind
                                                _fn();
                                            }
                                        }
                                    }
                                };

                                var _postProcessDateModifiedOptions = {
                                    "PropertyDateModified": null
                                };

                                if (_fnSetSaveArgs) {
                                    _fnSetSaveArgs.call(_controller, {
                                        "Trigger": $btn, "DataItem": _item, "Params": _params, "PostProcessDateModifiedOptions": _postProcessDateModifiedOptions
                                    });
                                }

                                _controller.DOM.ToggleIndicator(true);

                                APP.Service.Action(_params, function (saveItem) {

                                    //update the date modified field, if applicable
                                    if (_postProcessDateModifiedOptions.PropertyDateModified) {
                                        util_propertySetValue(saveItem, _postProcessDateModifiedOptions.PropertyDateModified, new Date());
                                    }

                                    //rebind and update the source data item (refresh applicable filters as well)
                                    _controller.DataItemBind({
                                        "DataItem": saveItem, "IsClearEntityCache": true, "IsRefreshFilters": true, "Callback": function () {
                                            _fn(true, saveItem);                                            
                                        }
                                    });
                                });
                            }
                            else {

                                for (var i = 0; i < result.Errors.length; i++) {
                                    AddUserError(result.Errors[i]);
                                }

                                _fn();
                            }
                        }
                    });

                }, _fn);

                break;

            case "edit_entity":

                var $parent = null;
                var _validateEditItemExists = ($btn.closest(".EntityLineItem").length == 1);

                _controller.SetPropertyViewEditMode(true, _validateEditItemExists);
                
                switch (_controller.ActiveGroupID()) {

                    case _controller.Data.ID.KOL:
                    case _controller.Data.ID.EventActivity:

                        var $list = _controller.FindActiveGroupViewTypes({ "ViewType": [enCViewTypeKOL.Calendar, enCViewTypeKOL.ActivityDetails] });

                        $parent = $btn.closest("[data-view-type]");

                        $list.addClass("EditorFixedViewTransitionSizeHeightA");
                        $parent.addClass("EditorFixedViewTransitionSizeWidthFull CanResizeInitial");

                        break;  //end: KOL edit action

                    default:
                        break;
                }

                if ($parent && !$parent.hasClass("EditorFixedViewTransitionFullScreen")) {

                    //force full screen
                    $parent.find("[data-attr-editor-controller-action-btn='resize']").trigger("click");
                }

                //refresh all search list view editors
                _controller.BindSearchListViewEditor({
                    "Callback": function () {
                        _fnToggleButton(true);

                        //update the button to cancel mode
                        $mobileUtil.ButtonUpdateIcon($btn, "back");
                        $btn.attr("title", "Cancel");
                        $btn.attr("data-attr-editor-controller-action-btn", "cancel_entity");

                        if (options["OnEditCallback"]) {
                            options.OnEditCallback();
                        }
                    }
                });

                break;  //end: edit_entity

            case "cancel_entity":
            case "cancel_edit_entity":

                dialog_confirmYesNo(_controller.Utils.LABELS.CancelChanges, _controller.Utils.LABELS.ConfirmCancelChanges, function () {

                    _fnToggleButton(true);
                    
                    var _fnRefreshEntityLineItem = function (obj) {

                        var $this = $(obj);

                        //remove the selected/disabled state (to allow force refresh)
                        $this.removeClass("LinkDisabled Selected");

                        $this.trigger("click", {
                            "IsDisableInteractiveValidation": true
                        });
                        
                    };  //end: _fnRefreshEntityLineItem

                    var _fnOnDefaultState = _controller.ActiveGroupContainer().data("OnDefaultState");

                    if (_fnOnDefaultState) {
                        _fnOnDefaultState();
                    }

                    if (options.ButtonID == "cancel_entity") {
                        var $parent = $btn.closest(".EntityLineItem");

                        _fnRefreshEntityLineItem($parent);
                    }
                    else {

                        //check if the list view selection item exists, attempt to force refresh if applicable
                        var $vwGroupTypeListView = _controller.FindActiveGroupViewTypes({ "ViewType": enCViewTypeKOL.ListView });
                        var $search = $vwGroupTypeListView.find(".R1C1:first .ListView[data-list-view-type]:first [data-attr-item-id] .EntityLineItem.Selected:first");

                        if ($search.length == 1) {
                            _fnRefreshEntityLineItem($search);
                        }
                        else {
                            var $clAdd = _controller.ActiveGroupContainer().find("[data-attr-editor-controller-action-btn='add_entity']");

                            if ($clAdd.length == 1) {
                                $clAdd.data("IsAddClearItem", true);

                                $clAdd.trigger("click", {
                                    "IsDisableInteractiveValidation": true
                                });
                            }
                            else {
                                _controller.SetPropertyViewEditMode(false);
                            }
                        }

                        if (_controller.State.ControllerRenderOptions.HasExternalAddMode) {
                            var $clNavigateBack = _controller.DOM.View.find("[data-attr-editor-controller-action-btn='external_action']" +
                                                                            "[data-external-action-id='navigate_back']:first");

                            $clNavigateBack.data("IsRequirePrompt", false)
                                           .trigger("click");
                        }
                    }
                }, function () {
                    _fnToggleButton(true);
                });

                break;  //end: cancel edit

            case "export_entity":

                _controller.OnExportEntity({
                    "Trigger": $btn,
                    "Callback": function () {
                        _fnToggleButton(true);
                    }
                });

                break;  //end: export_entity

            case "resize":
                
                var $vw = $btn.closest(".EditorCardViewKOL[data-view-type]");
                var _viewTypeID = util_forceInt($vw.attr("data-view-type"), enCE.None);
                var _isOn = $btn.hasClass("StateOn");

                var _cssClass = {
                    "Add": "",
                    "Remove": "",
                    "Set": function (stateOnAdd, stateOnRemove, stateOffAdd, stateOffRemove) {
                        if (_isOn) {
                            _cssClass.Add = util_forceString(stateOnAdd);
                            _cssClass.Remove = util_forceString(stateOnRemove);
                        }
                        else {
                            _cssClass.Add = util_forceString(stateOffAdd);
                            _cssClass.Remove = util_forceString(stateOffRemove);
                        }
                    }
                };

                _isOn = !_isOn;

                switch (_controller.ActiveGroupID()) {

                    case _controller.Data.ID.KOL:
                        if (_viewTypeID == enCViewTypeKOL.ListView || _viewTypeID == enCViewTypeKOL.Calendar || _viewTypeID == enCViewTypeKOL.ActivityDetails) {
                            _cssClass.Set("EditorFixedViewTransitionFullScreen", null, null, "EditorFixedViewTransitionFullScreen");
                        }

                        break;

                    case _controller.Data.ID.EventActivity:
                        if (_viewTypeID == enCViewTypeKOL.ListView || _viewTypeID == enCViewTypeKOL.Calendar || _viewTypeID == enCViewTypeKOL.ActivityDetails) {
                            _cssClass.Set("EditorFixedViewTransitionFullScreen", null, null, "EditorFixedViewTransitionFullScreen");
                        }

                        break;
                }

                $vw.removeClass(_cssClass.Remove)
                   .addClass(_cssClass.Add);

                $vw.toggleClass("CanResizeInitial", $vw.hasClass("EditorFixedViewTransitionSizeWidthFull"));

                $btn.toggleClass("StateOn")
                    .toggleClass("ImageExpandLight", !_isOn)
                    .toggleClass("ImageRestoreLight", _isOn);

                $btn.attr("title", _isOn ? _controller.Utils.LABELS.Minimize : _controller.Utils.LABELS.Maximize);

                _fnToggleButton(true);

                break;

            case "resize_initial":

                var $vw = $btn.closest(".EditorCardViewKOL[data-view-type]");

                $vw.removeClass("EditorFixedViewTransitionSizeWidthFull CanResizeInitial");

                switch (_controller.ActiveGroupID()) {

                    default:

                        var $list = _controller.FindActiveGroupViewTypes({ "ViewType": [enCViewTypeKOL.Calendar, enCViewTypeKOL.ActivityDetails] });

                        $list.removeClass("EditorFixedViewTransitionSizeHeightA");
                        break;
                }

                _fnToggleButton(true);

                break;

            case "popup_kol_userSearch":
            case "popup_Activity_KOL_Search":
            case "popup_eventSearch":
            case "popup_KOL_EventSearch":
            case "popup_KOL_ActivitySearch":
            case "popup_RepositoryResource_KeyOpinionLeaderSearch":
            case "popup_RepositoryResource_EventSearch":
            case "popup_RepositoryResource_ActivitySearch":
            case "popup_Activity_EventSearch":
            case "popup_Event_KeyOpinionLeaderSearch":
            case "popup_eventListStatic":

                _fnToggleButton(false);

                var _html = "";

                var _renderFields = null;
                var _canSearch = true;
                var _popupTitle = util_forceString($mobileUtil.GetClosestAttributeValue($btn, "data-field-title"));
                var _srcValueList = ($btn.data("SourceDataList") || []);

                var _repeaterOpts = {
                    "CssClass": "",
                    "StaticList": {
                        "Enabled": false,
                        "Data": [],
                        "PropertyText": null,
                        "PropertyValue": null,
                        "PropertyDescription": null
                    },
                    "SortEnum": null,
                    "DefaultSortEnum": "null",
                    "Columns": [],
                    "PropertyDataIdentifier": null,
                    "GetList": null,
                    "OnConfigureParams": null,
                    "MethodName": null,
                    "LookupPropertyPathUpdates": null,
                    "IsMultiSelect": false,
                    "HasPriorityColumn": false,
                    "LookupDefaultSelections": {},
                    "AddSelection": function (itemID, arrExtProps) {
                        var _temp = {};

                        _temp[this.PropertyDataIdentifier] = itemID;

                        if (arrExtProps) {
                            for (var p = 0; p < arrExtProps.length; p++) {
                                var _prop = arrExtProps[p];

                                _temp[_prop.n] = _prop.v;
                            }
                        }

                        this.LookupDefaultSelections[itemID] = _temp;
                    },
                    "BridgeEntity": {
                        "ListPropertyPath": null,
                        "Instance": null,
                        "PropertyID_Name": null,
                        "PropertyValue": null,
                        "ParentPropertyText": null,
                        "OnConfigureItem": null //format: function (opts) { ... } where opts: { "Item": "LookupItem" }
                    },
                    "OnOverrideCustomPopup": null
                };

                //checkmark toggle column
                _repeaterOpts.Columns.push({
                    "ID": "toggle_icon",
                    "Content": "",
                    "IsNoLink": true
                });

                if (util_forceString(_popupTitle) == "") {
                    _popupTitle = "Search";
                }

                switch (options.ButtonID) {

                    case "popup_eventListStatic":

                        _repeaterOpts.StaticList.Enabled = true;

                        var $listBox = $btn.data("ListBoxElement");
                        var _propertyPath = $mobileUtil.GetClosestAttributeValue($listBox, "data-attr-prop-path");
                        var _field = ($listBox.data("Field") || {});
                        var _fieldItem = _field["_fieldItem"];
                        var _renderList = (_fieldItem ? _fieldItem["_renderList"] : null);

                        if (_renderList) {
                            _repeaterOpts.StaticList.Data = (_renderList["Data"] || []);
                            _repeaterOpts.StaticList.PropertyText = _renderList["PropertyText"];
                            _repeaterOpts.StaticList.PropertyValue = _renderList["PropertyValue"];
                            _repeaterOpts.PropertyDataIdentifier = _repeaterOpts.StaticList.PropertyValue;  //TODO: possible conflict with bridge and lookup parent name differences

                            var _bridgeDetails = null;

                            var _activeGroupID = _controller.ActiveGroupID();
                            var _key = _activeGroupID;
                            var _lookupBridgeDetails = ("%%TOK|ROUTE|PluginEditor|KOL_RenderStaticListBridgeEntityOptionLookup%%" || {});

                            //if it is the event/activity view group, then must append the view mode ID
                            if (_activeGroupID == _controller.Data.ID.EventActivity) {
                                _key += "_" + _controller.ActiveContentViewModeID();
                            }

                            _key += "_" + _propertyPath;

                            _bridgeDetails = util_extend({
                                "IsMultiSelect": true,
                                "ListPropertyPath": null,
                                "PropertyID_Name": null,
                                "PropertyValue": null,
                                "ParentPropertyText": null,
                                "PropertyDescription": null,
                                "Instance": null
                            }, _lookupBridgeDetails[_key]);

                            if (typeof _bridgeDetails.Instance == "string") {
                                _bridgeDetails.Instance = eval(_bridgeDetails.Instance);
                            }

                            _repeaterOpts.StaticList.PropertyDescription = util_forceString(_bridgeDetails.PropertyDescription);
                            _repeaterOpts.IsMultiSelect = _bridgeDetails.IsMultiSelect;

                            //bridge entity details details
                            _repeaterOpts.BridgeEntity.ListPropertyPath = _bridgeDetails.ListPropertyPath;
                            _repeaterOpts.BridgeEntity.Instance = _bridgeDetails.Instance;
                            _repeaterOpts.BridgeEntity.PropertyID_Name = _bridgeDetails.PropertyID_Name;
                            _repeaterOpts.BridgeEntity.PropertyValue = _bridgeDetails.PropertyValue;
                            _repeaterOpts.BridgeEntity.ParentPropertyText = _bridgeDetails.ParentPropertyText;
                        }

                        _repeaterOpts.Columns.push({
                            "IsNoLink": true,
                            "CssClass": "ContentCell",
                            "PropertyPath": _repeaterOpts.StaticList.PropertyText
                        });

                        if (_repeaterOpts.StaticList.PropertyDescription != "") {
                            _repeaterOpts.Columns.push({
                                "ID": "tooltip_icon",
                                "Content": "",
                                "IsNoLink": true
                            });

                            _repeaterOpts.CssClass = "TableSearchableTooltipModeOn";
                        }

                        break;  //end: popup_eventListStatic

                    case "popup_kol_userSearch":

                        _renderFields = ("%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsEntitySearchView|{ \"EntityType\": \"User\" }%%" || []);

                        if (_renderFields.length == 0) {
                            var _field = null;

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Username";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColUserProperty.Username;
                            _field[enColCEditorRenderFieldProperty.Options] = { "SortEnum": "enColUser.Username" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "First Name";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColUserProperty.FirstName;
                            _field[enColCEditorRenderFieldProperty.Options] = { "SortEnum": "enColUser.FirstName" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Last Name";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColUserProperty.LastName;
                            _field[enColCEditorRenderFieldProperty.Options] = { "SortEnum": "enColUser.LastName" };

                            _renderFields.push(_field);

                            _canSearch = false;
                        }

                        _repeaterOpts.SortEnum = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewSortEnum|{ \"EntityType\": \"User\" }%%";
                        _repeaterOpts.PropertyDataIdentifier = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewPropertyDataIdentifier|{ \"EntityType\": \"User\" }%%";
                        _repeaterOpts.MethodName = "UserCompanySearch";
                        _repeaterOpts.LookupPropertyPathUpdates = "%%TOK|ROUTE|PluginEditor|KOL_EntitySearchViewSelectionPropertyPathMapping|{ \"EntityType\": \"User\" }%%";

                        var _dataItem = _controller.EditItem();
                        var _userID = util_forceInt(_dataItem ? _dataItem[enColKeyOpinionLeaderProperty.CompanyUserID] : null, enCE.None);

                        if (_userID != enCE.None) {

                            var _arrExtPropValues = [];

                            if (_repeaterOpts.LookupPropertyPathUpdates) {
                                for (var _propPath in _repeaterOpts.LookupPropertyPathUpdates) {
                                    _arrExtPropValues.push({
                                        "n": _propPath,
                                        "v": util_propertyValue(_dataItem, _propPath)
                                    });
                                }
                            }

                            _arrExtPropValues.push({ "n": "_isDefaultPropPath", "v": true });

                            _repeaterOpts.AddSelection(_userID, _arrExtPropValues);
                        }

                        break;  //end: popup_kol_userSearch options

                    case "popup_eventSearch":
                    case "popup_Event_KeyOpinionLeaderSearch":

                        _renderFields = ("%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsEntitySearchView|{ \"EntityType\": \"Event\" }%%" || []);

                        if (_renderFields.length == 0) {

                            var _field = null;

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Name";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColEventProperty.Name;
                            _field[enColCEditorRenderFieldProperty.Options] = { "SortEnum": "enColEvent.Name" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Start Date";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColEventProperty.StartDate;
                            _field[enColCEditorRenderFieldProperty.Options] = { "IsDate": true, "SortEnum": "enColEvent.StartDate" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "End Date";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColEventProperty.EndDate;
                            _field[enColCEditorRenderFieldProperty.Options] = { "IsDate": true, "SortEnum": "enColEvent.EndDate" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Venue";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColEventProperty.Venue;
                            _field[enColCEditorRenderFieldProperty.Options] = { "SortEnum": "enColEvent.Venue" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Created On";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColEventProperty.DateAdded;
                            _field[enColCEditorRenderFieldProperty.Options] = { "IsDate": true, "SortEnum": "enColEvent.DateAdded" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Last Updated";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColEventProperty.DateModified;
                            _field[enColCEditorRenderFieldProperty.Options] = { "IsDate": true, "SortEnum": "enColEvent.DateModified" };

                            _renderFields.push(_field);
                        }

                        _repeaterOpts.SortEnum = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewSortEnum|{ \"EntityType\": \"Event\" }%%";
                        _repeaterOpts.PropertyDataIdentifier = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewPropertyDataIdentifier|{ \"EntityType\": \"Event\" }%%";
                        _repeaterOpts.MethodName = "EventSearch";
                        _repeaterOpts.LookupPropertyPathUpdates = "%%TOK|ROUTE|PluginEditor|KOL_EntitySearchViewSelectionPropertyPathMapping|{ \"EntityType\": \"Event\" }%%";

                        _repeaterOpts.IsMultiSelect = true;

                        if (options.ButtonID == "popup_eventSearch") {

                            //event searches applicable to ActivityEvent bridge entity
                            _repeaterOpts.BridgeEntity.ListPropertyPath = enColCEActivityProperty.Events;
                            _repeaterOpts.BridgeEntity.Instance = CEActivityEvent;
                            _repeaterOpts.BridgeEntity.PropertyID_Name = enColActivityEventProperty.EventIDName;
                            _repeaterOpts.BridgeEntity.PropertyValue = enColActivityEventProperty.EventID;
                        }
                        else if (options.ButtonID == "popup_Event_KeyOpinionLeaderSearch") {

                            //event searches applicable to KeyOpinionLeaderEvent bridge entity
                            _repeaterOpts.BridgeEntity.ListPropertyPath = enColCEKeyOpinionLeaderProperty.Events;
                            _repeaterOpts.BridgeEntity.Instance = CEKeyOpinionLeaderEvent;
                            _repeaterOpts.BridgeEntity.PropertyID_Name = enColKeyOpinionLeaderEventProperty.EventIDName;
                            _repeaterOpts.BridgeEntity.PropertyValue = enColKeyOpinionLeaderEventProperty.EventID;
                        }

                        _repeaterOpts.BridgeEntity.ParentPropertyText = enColEventProperty.Name;

                        break;  //end: popup_eventSearch, popup_Event_KeyOpinionLeaderSearch options

                    case "popup_Activity_KOL_Search":
                    case "popup_Activity_EventSearch":

                        _renderFields = ("%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsEntitySearchView|{ \"EntityType\": \"Activity\" }%%" || []);

                        if (options.ButtonID == "popup_Activity_KOL_Search") {

                            //activity searches applicable to KeyOpinionLeaderActivity bridge entity
                            _repeaterOpts.BridgeEntity.ListPropertyPath = enColCEKeyOpinionLeaderProperty.Activities;
                            _repeaterOpts.BridgeEntity.Instance = CEKeyOpinionLeaderActivity;
                            _repeaterOpts.BridgeEntity.PropertyID_Name = enColKeyOpinionLeaderActivityProperty.ActivityIDName;
                            _repeaterOpts.BridgeEntity.PropertyValue = enColKeyOpinionLeaderActivityProperty.ActivityID;
                        }
                        else if (options.ButtonID == "popup_Activity_EventSearch") {

                            //activity searches applicable to ActivityEvent bridge entity
                            _repeaterOpts.BridgeEntity.ListPropertyPath = enColCEEventProperty.Activities;
                            _repeaterOpts.BridgeEntity.Instance = CEActivityEvent;
                            _repeaterOpts.BridgeEntity.PropertyID_Name = enColActivityEventProperty.ActivityIDName;
                            _repeaterOpts.BridgeEntity.PropertyValue = enColActivityEventProperty.ActivityID;
                        }

                        if (_renderFields.length == 0) {

                            var _field = null;

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Name";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColActivityProperty.Name;
                            _field[enColCEditorRenderFieldProperty.Options] = {
                                "SortEnum": "enColActivity.Name"
                            };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Start Date";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColActivityProperty.StartDate;
                            _field[enColCEditorRenderFieldProperty.Options] = {
                                "IsDate": true, "SortEnum": "enColActivity.StartDate"
                            };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "End Date";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColActivityProperty.EndDate;
                            _field[enColCEditorRenderFieldProperty.Options] = {
                                "IsDate": true, "SortEnum": "enColActivity.EndDate"
                            };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Venue";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColActivityProperty.Venue;
                            _field[enColCEditorRenderFieldProperty.Options] = { "SortEnum": "enColActivity.Venue" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Created On";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColActivityProperty.DateAdded;
                            _field[enColCEditorRenderFieldProperty.Options] = {
                                "IsDate": true, "SortEnum": "enColActivity.DateAdded"
                            };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Last Updated";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColActivityProperty.DateModified;
                            _field[enColCEditorRenderFieldProperty.Options] = {
                                "IsDate": true, "SortEnum": "enColActivity.DateModified"
                            };

                            _renderFields.push(_field);

                            _repeaterOpts.HasPriorityColumn = true;
                        }

                        _repeaterOpts.SortEnum = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewSortEnum|{ \"EntityType\": \"Activity\" }%%";
                        _repeaterOpts.PropertyDataIdentifier = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewPropertyDataIdentifier|{ \"EntityType\": \"Activity\" }%%";
                        _repeaterOpts.MethodName = "ActivitySearch";
                        _repeaterOpts.LookupPropertyPathUpdates = "%%TOK|ROUTE|PluginEditor|KOL_EntitySearchViewSelectionPropertyPathMapping|{ \"EntityType\": \"Activity\" }%%";

                        _repeaterOpts.IsMultiSelect = true;
                        
                        _repeaterOpts.BridgeEntity.ParentPropertyText = enColActivityProperty.Name;

                        break;  //end: activity related search options

                    case "popup_KOL_EventSearch":
                    case "popup_KOL_ActivitySearch":

                        if (options.ButtonID == "popup_KOL_EventSearch") {
                            _renderFields = ("%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsEntitySearchView|{ \"EntityType\": \"KOL_Event\" }%%" || []);

                            _repeaterOpts.SortEnum = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewSortEnum|{ \"EntityType\": \"KOL_Event\" }%%";
                            _repeaterOpts.PropertyDataIdentifier = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewPropertyDataIdentifier|{ \"EntityType\": \"KOL_Event\" }%%";
                            _repeaterOpts.LookupPropertyPathUpdates =
                                "%%TOK|ROUTE|PluginEditor|KOL_EntitySearchViewSelectionPropertyPathMapping|{ \"EntityType\": \"KOL_Event\" }%%";

                            //KOL searches applicable to KeyOpinionLeaderEvent bridge entity
                            _repeaterOpts.BridgeEntity.ListPropertyPath = enColCEEventProperty.KeyOpinionLeaders;
                            _repeaterOpts.BridgeEntity.Instance = CEKeyOpinionLeaderEvent;
                            _repeaterOpts.BridgeEntity.PropertyID_Name = enColKeyOpinionLeaderEventProperty.KeyOpinionLeaderIDName;
                            _repeaterOpts.BridgeEntity.PropertyValue = enColKeyOpinionLeaderEventProperty.KeyOpinionLeaderID;
                        }
                        else if (options.ButtonID == "popup_KOL_ActivitySearch") {
                            _renderFields = ("%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsEntitySearchView|{ \"EntityType\": \"KOL_Activity\" }%%" || []);

                            _repeaterOpts.SortEnum = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewSortEnum|{ \"EntityType\": \"KOL_Activity\" }%%";
                            _repeaterOpts.PropertyDataIdentifier = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewPropertyDataIdentifier|{ \"EntityType\": \"KOL_Activity\" }%%";
                            _repeaterOpts.LookupPropertyPathUpdates =
                                "%%TOK|ROUTE|PluginEditor|KOL_EntitySearchViewSelectionPropertyPathMapping|{ \"EntityType\": \"KOL_Activity\" }%%";

                            //KOL searches applicable to KeyOpinionLeaderActivity bridge entity
                            _repeaterOpts.BridgeEntity.ListPropertyPath = enColCEActivityProperty.KeyOpinionLeaders;
                            _repeaterOpts.BridgeEntity.Instance = CEKeyOpinionLeaderActivity;
                            _repeaterOpts.BridgeEntity.PropertyID_Name = enColKeyOpinionLeaderActivityProperty.KeyOpinionLeaderIDName;
                            _repeaterOpts.BridgeEntity.PropertyValue = enColKeyOpinionLeaderActivityProperty.KeyOpinionLeaderID;
                        }

                        //KOL profile column
                        _repeaterOpts.Columns.push({
                            "ID": "kol_profile",
                            "Content": "",
                            "IsNoLink": true
                        });

                        if (_renderFields.length == 0) {

                            var _field = null;

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Name";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColKeyOpinionLeaderProperty.Name;
                            _field[enColCEditorRenderFieldProperty.Options] = { "SortEnum": "enColKeyOpinionLeader.Name" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Title";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColKeyOpinionLeaderProperty.Title;
                            _field[enColCEditorRenderFieldProperty.Options] = { "SortEnum": "enColKeyOpinionLeader.Title" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Organization";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColKeyOpinionLeaderProperty.Organization;
                            _field[enColCEditorRenderFieldProperty.Options] = { "SortEnum": "enColKeyOpinionLeader.Organization" };

                            _renderFields.push(_field);
                        }

                        _repeaterOpts.MethodName = "KeyOpinionLeaderGetByForeignKey";
                        _repeaterOpts.IsMultiSelect = true;

                        _repeaterOpts.OnConfigureParams = function (params) {

                            //user does not have Administrator role, so restrict the KOLs to ones current user is owner for
                            if (!_controller.CanAdmin()) {
                                params["CompanyUserID"] = global_AuthUserID();
                            }
                        };

                        _repeaterOpts.BridgeEntity.ParentPropertyText = enColKeyOpinionLeaderProperty.Name;

                        break;  //end: KOL related Event and Activity options

                    case "popup_RepositoryResource_KeyOpinionLeaderSearch":
                    case "popup_RepositoryResource_EventSearch":
                    case "popup_RepositoryResource_ActivitySearch":
                        
                        //TODO performance updates (use custom user view)
                        //TODO configure the temp enum for the sort fields (since it uses custom format)

                        var _propertyMappings = {};

                        if (options.ButtonID == "popup_RepositoryResource_KeyOpinionLeaderSearch") {

                            _renderFields = ("%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsEntitySearchView|{ \"EntityType\": \"Resource_KOL\" }%%" || []);
                            _repeaterOpts.PropertyDataIdentifier =
                            "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewPropertyDataIdentifier|{ \"EntityType\": \"Resource_KOL\" }%%";
                            _repeaterOpts.LookupPropertyPathUpdates =
                                "%%TOK|ROUTE|PluginEditor|KOL_EntitySearchViewSelectionPropertyPathMapping|{ \"EntityType\": \"Resource_KOL\" }%%";

                            //Resource searches applicable to RepositoryResourceKeyOpinionLeader bridge entity
                            _repeaterOpts.BridgeEntity.ListPropertyPath = enColCEKeyOpinionLeaderProperty.Resources;
                            _repeaterOpts.BridgeEntity.Instance = CERepositoryResourceKeyOpinionLeader;
                            _repeaterOpts.BridgeEntity.PropertyID_Name = enColRepositoryResourceKeyOpinionLeaderProperty.ResourceIDName;
                            _repeaterOpts.BridgeEntity.PropertyValue = enColRepositoryResourceKeyOpinionLeaderProperty.ResourceID;

                            _repeaterOpts.SortEnum = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewSortEnum|{ \"EntityType\": \"Resource_KOL\" }%%";

                            _propertyMappings[enColRepositoryResourceKeyOpinionLeaderProperty.ResourceDocumentTypeID] = enColRepositoryResourceProperty.DocumentTypeID;
                            _propertyMappings[enColRepositoryResourceKeyOpinionLeaderProperty.ResourceIDName] = enColRepositoryResourceProperty.Name;
                        }
                        else if (options.ButtonID == "popup_RepositoryResource_EventSearch") {

                            _renderFields = ("%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsEntitySearchView|{ \"EntityType\": \"Resource_Event\" }%%" || []);
                            _repeaterOpts.PropertyDataIdentifier =
                            "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewPropertyDataIdentifier|{ \"EntityType\": \"Resource_Event\" }%%";
                            _repeaterOpts.LookupPropertyPathUpdates =
                                "%%TOK|ROUTE|PluginEditor|KOL_EntitySearchViewSelectionPropertyPathMapping|{ \"EntityType\": \"Resource_Event\" }%%";

                            //Resource searches applicable to RepositoryResourceEvent bridge entity
                            _repeaterOpts.BridgeEntity.ListPropertyPath = enColCEEventProperty.Resources;
                            _repeaterOpts.BridgeEntity.Instance = CERepositoryResourceEvent;
                            _repeaterOpts.BridgeEntity.PropertyID_Name = enColRepositoryResourceEventProperty.ResourceIDName;
                            _repeaterOpts.BridgeEntity.PropertyValue = enColRepositoryResourceEventProperty.ResourceID;

                            _repeaterOpts.SortEnum = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewSortEnum|{ \"EntityType\": \"Resource_Event\" }%%";

                            _propertyMappings[enColRepositoryResourceEventProperty.ResourceDocumentTypeID] = enColRepositoryResourceProperty.DocumentTypeID;
                            _propertyMappings[enColRepositoryResourceEventProperty.ResourceIDName] = enColRepositoryResourceProperty.Name;
                        }
                        else if (options.ButtonID == "popup_RepositoryResource_ActivitySearch") {

                            _renderFields = ("%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsEntitySearchView|{ \"EntityType\": \"Resource_Activity\" }%%" || []);
                            _repeaterOpts.PropertyDataIdentifier =
                            "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewPropertyDataIdentifier|{ \"EntityType\": \"Resource_Activity\" }%%";
                            _repeaterOpts.LookupPropertyPathUpdates =
                                "%%TOK|ROUTE|PluginEditor|KOL_EntitySearchViewSelectionPropertyPathMapping|{ \"EntityType\": \"Resource_Activity\" }%%";

                            //Resource searches applicable to RepositoryResourceActivity bridge entity
                            _repeaterOpts.BridgeEntity.ListPropertyPath = enColCEActivityProperty.Resources;
                            _repeaterOpts.BridgeEntity.Instance = CERepositoryResourceActivity;
                            _repeaterOpts.BridgeEntity.PropertyID_Name = enColRepositoryResourceActivityProperty.ResourceIDName;
                            _repeaterOpts.BridgeEntity.PropertyValue = enColRepositoryResourceActivityProperty.ResourceID;

                            _repeaterOpts.SortEnum = "%%TOK|ROUTE|PluginEditor|KOL_ListEntitySearchViewSortEnum|{ \"EntityType\": \"Resource_Activity\" }%%";

                            _propertyMappings[enColRepositoryResourceActivityProperty.ResourceDocumentTypeID] = enColRepositoryResourceProperty.DocumentTypeID;
                            _propertyMappings[enColRepositoryResourceActivityProperty.ResourceIDName] = enColRepositoryResourceProperty.Name;
                        }

                        if (_renderFields.length == 0) {

                            var _field = null;

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Name";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColRepositoryResourceProperty.Name;
                            _field[enColCEditorRenderFieldProperty.Options] = { "SortEnum": "enColRepositoryResource.Name" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Document Type";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColRepositoryResourceProperty.DocumentTypeIDName;
                            _field[enColCEditorRenderFieldProperty.Options] = {
                                "SortEnum": "enColRepositoryResource.DocumentTypeIDName", "HasSearchHighlight": false
                            };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Created On";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColRepositoryResourceProperty.DateAdded;
                            _field[enColCEditorRenderFieldProperty.Options] = { "IsDate": true, "SortEnum": "enColRepositoryResource.DateAdded" };

                            _renderFields.push(_field);

                            _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Last Updated";
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColRepositoryResourceProperty.DateModified;
                            _field[enColCEditorRenderFieldProperty.Options] = { "IsDate": true, "SortEnum": "enColRepositoryResource.DateModified" };

                            _renderFields.push(_field);

                            _repeaterOpts.SortEnum = "enColRepositoryResource";
                        }

                        //download link column
                        _repeaterOpts.Columns.push({
                            "ID": "download_resource",
                            "Content": "",
                            "IsNoLink": true
                        });

                        var _documentTypes = "%%TOK|ROUTE|PluginEditor|KOL_RepositoryDocumentTypes%%";
                        var _arrRestrictDocumentTypes = [];

                        if (_documentTypes) {
                            for (var d = 0; d < _documentTypes.length; d++) {
                                var _repositoryDocumentType = _documentTypes[d];
                                _arrRestrictDocumentTypes.push(_repositoryDocumentType[enColRepositoryDocumentTypeProperty.DocumentTypeID]);
                            }
                        }

                        _repeaterOpts.OnConfigureParams = function (params) {

                            var _extFilters = params["ExtendedFilters"];

                            if (!_extFilters) {
                                _extFilters = {};
                                params["ExtendedFilters"] = _extFilters;
                            }

                            //restrict the available document types supported for the KOL Manager
                            _extFilters["RestrictDocumentTypes"] = _arrRestrictDocumentTypes;

                            //user does not have Administrator role, so restrict the resources
                            if (!_controller.CanAdmin()) {
                                _extFilters["CanAdmin"] = enCETriState.No;
                            }
                        };

                        _repeaterOpts.MethodName = "RepositoryResourceUserViewList";
                        _repeaterOpts.IsMultiSelect = true;

                        _repeaterOpts.BridgeEntity.ParentPropertyText = enColRepositoryResourceProperty.Name;

                        if (_controller.Data.HasUnifiedRepositoryResourceSearch) {
                            _repeaterOpts.OnOverrideCustomPopup = function () {

                                var $triggerListBoxElement = $($btn.data("ListBoxElement"));
                                var $vwProperty = $triggerListBoxElement.closest(".PropertyView");

                                var _opts = {
                                    "Title": _popupTitle,
                                    "Events": {
                                        "OnConfigureParams": _repeaterOpts.OnConfigureParams,
                                        "OnSave": function (opts) {

                                            opts = util_extend({ "Selector": null }, opts);

                                            if (util_forceString(opts.Selector) != "") {

                                                //rebind the current item for the applicable property paths (restricted bind of elements)
                                                _controller.DataItemBind({ "FilterSelector": opts.Selector, "IsSelectiveUpdate": true });
                                            }

                                            _onDismissCallback();
                                        }
                                    },
                                    "ContextDataItem": _controller.EditItem(),
                                    "SourceDataList": _srcValueList,
                                    "BridgeEntity": _repeaterOpts.BridgeEntity,
                                    "IsRestrictDocumentTypeFilter": true,
                                    "AddActionOptions": {
                                        "DocumentTypes": "%%TOK|ROUTE|PluginEditor|KOL_RepositoryDocumentTypes%%",
                                        "OnWizardSelection": function (opts, onCallback) {

                                            opts = util_extend({ "DocumentTypeID": enCE.None }, opts);

                                            _controller.Data.RenderOptionRepositoryCategoryLookup.Get({
                                                "DocumentTypeID": util_forceInt(opts.DocumentTypeID, enCE.None),
                                                "Callback": function (category) {

                                                    var _categoryID = util_forceInt(category ? category[enColRepositoryCategoryProperty.CategoryID] : null, enCE.None);

                                                    onCallback(_categoryID);
                                                }
                                            });
                                        },
                                        "OnSaveCallback": function (opts) {

                                            var _fieldID = util_forceInt($vwProperty.attr("data-attr-render-field-id"), enCE.None);
                                            var _field = _controller.Data.LookupRenderField[_fieldID];
                                            var _fieldItem = (_field && _field["_fieldItem"] ? _field["_fieldItem"] : null);

                                            if (_fieldItem["_renderList"]) {
                                                var _resource = opts.Item;
                                                var _renderList = _fieldItem["_renderList"];
                                                var _propertyPath = $vwProperty.attr("data-attr-prop-path");

                                                var _bridgeItem = new _renderList.InstanceType();

                                                _bridgeItem[_renderList.PropertyValue] = _resource[enColRepositoryResourceProperty.ResourceID];

                                                for (var _prop in _propertyMappings) {
                                                    var _valueProp = _propertyMappings[_prop];

                                                    _bridgeItem[_prop] = _resource[_valueProp];
                                                }

                                                var _dataItem = _controller.EditItem();
                                                var _valList = util_propertyValue(_dataItem, _propertyPath);

                                                if (!_valList) {
                                                    _valList = [];
                                                    util_propertySetValue(_dataItem, _propertyPath, _valList);
                                                }

                                                _valList.push(_bridgeItem);

                                                //rebind the current item for the applicable property path (restricted bind of elements)
                                                _controller.DataItemBind({
                                                    "FilterSelector": "[" + util_htmlAttribute("data-attr-prop-path", _propertyPath) + "]",
                                                    "IsSelectiveUpdate": true
                                                });
                                            }
                                        }
                                    }
                                };

                                _controller.Data.RepositoryResourceController.PopupSearchResource(_opts);
                            };
                        }

                        break;  //end: Resource related Event and Activity options
                }

                _renderFields = (_renderFields || []);

                //for multi-select mode, iterate through the list and add its values as selections
                if (_repeaterOpts.IsMultiSelect && util_forceString(_repeaterOpts.BridgeEntity.ListPropertyPath) != "") {

                    var _list = util_propertyValue(_controller.EditItem(), _repeaterOpts.BridgeEntity.ListPropertyPath);

                    _list = (_list || []);

                    for (var v = 0; v < _list.length; v++) {
                        var _bridgeItem = _list[v];

                        _repeaterOpts.AddSelection(_bridgeItem[_repeaterOpts.BridgeEntity.PropertyValue], 
                                                   [{ "n": _repeaterOpts.BridgeEntity.ParentPropertyText, "v": _bridgeItem[_repeaterOpts.BridgeEntity.PropertyID_Name] }]);
                    }
                }

                var _fnIndicator = null;

                var _onPopupBind = function () {
                    _fnToggleButton(true);

                    var $popup = $mobileUtil.PopupContainer();
                    var $vwListView = $popup.find("#vwListView");
                    var $tbSearch = (_canSearch ? $popup.find("#tbSearch") : null);
                    var $vwRepeater = null;
                    var _priorityColumnIndex = -1;

                    for (var f = 0; f < _renderFields.length; f++) {
                        var _field = _renderFields[f];
                        var _options = _field[enColCEditorRenderFieldProperty.Options];
                        var _column = {
                            "Content": _field[enColCEditorRenderFieldProperty.Title],
                            "SortEnum": (_options ? _options["SortEnum"] : null),
                            "PropertyPath": _field[enColCEditorRenderFieldProperty.PropertyPath],
                            "IsDate": (_options ? _options["IsDate"] : false),
                            "HasSearchHighlight": util_forceBool(_options ? _options["HasSearchHighlight"] : true, true)
                        };

                        if (f == 0) {
                            _repeaterOpts.DefaultSortEnum = _column.SortEnum;
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
                        else if (_repeaterOpts.StaticList.Enabled) {
                            var _data = { "List": _repeaterOpts.StaticList.Data, "NumItem": 0 };

                            //apply text search, if applicable
                            if (_canSearch && _search != "" && _repeaterOpts.BridgeEntity && _repeaterOpts.BridgeEntity.ParentPropertyText) {
                                var _search = util_forceString($tbSearch.val()).toLowerCase();

                                _data.List = util_arrFilterSubset(_data.List, function (searchItem) {
                                    var _str = util_forceString(searchItem[_repeaterOpts.BridgeEntity.ParentPropertyText], "").toLowerCase();

                                    return (_str.indexOf(_search) >= 0);
                                });
                            }

                            _data.List = (_data.List || []);
                            _data.NumItem = _data.List.length;

                            _callback(_data);
                        }
                        else {
                            var _params = {
                                "SortColumn": sortSetting.SortColumn,
                                "SortAscending": sortSetting.SortASC,
                                "PageSize": util_forceInt(sortSetting.PageSize, _controller.Data.PopupPageSize),
                                "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1),
                                "Search": (_canSearch ? $tbSearch.val() : null)
                            };

                            if (_repeaterOpts.OnConfigureParams) {
                                _repeaterOpts.OnConfigureParams(_params);
                            }

                            _fnIndicator(true);

                            APP.Service.Action({
                                "_indicators": false, "c": "PluginEditor", "m": _repeaterOpts.MethodName, "args": _params
                            }, function (result) {

                                _fnIndicator(false);
                                _callback(result);
                            });

                            if (_canSearch) {
                                $tbSearch.data("LastRequest", GlobalService.LastRequest);
                            }
                        }

                    };  //end: _fnGetList

                    $repeater = _controller.Utils.Repeater({
                        "ID": "Table_" + options.ButtonID,
                        "CssClass": "EditorDataAdminListTableTheme" + (_repeaterOpts.StaticList.Enabled ? " TableMinimalList" : "") +
                                    (util_forceString(_repeaterOpts.CssClass) != "" ? " " + _repeaterOpts.CssClass : ""),
                        "PageSize": _controller.Data.PopupPageSize,
                        "SortEnum": _repeaterOpts.SortEnum,
                        "DefaultSortEnum": _repeaterOpts.DefaultSortEnum,
                        "SortOrderGroupKey": "popup_listview_table_" + options.ButtonID,
                        "IsDisablePagingFooter": _repeaterOpts.StaticList.Enabled,
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

                                        case "tooltip_icon":
                                            cellOpts.CssClass += "ImageTooltipCell";
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
                                var _cssClass = null;

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

                                        _cssClass = _column["CssClass"];
                                    }
                                    else if (_column["ID"] == "toggle_icon") {
                                        var _selected = false;
                                        var _itemID = _item[_repeaterOpts.PropertyDataIdentifier];
                                        var _lookupSelections = $vwListView.data("LookupSelections");

                                        if (_lookupSelections && _lookupSelections[_itemID]) {
                                            _selected = true;
                                        }

                                        _val = "<div class='EditorImageButton ImageToggleSelection" + (_selected ? " StateOn": "") + "'>" +
                                               "    <div class='ImageIcon' />" +
                                               "</div>";
                                        _isEncode = false;
                                    }
                                    else if (_column["ID"] == "download_resource") {
                                        _val = _controller.Utils.ConstructRepositoryResourceLinkHTML({ "Item": _item });
                                        _isEncode = false;
                                    }
                                    else if (_column["ID"] == "kol_profile") {
                                        var _itemID = _item[_repeaterOpts.PropertyDataIdentifier];

                                        _val = "<div class='EditorImageButton ImageUserProfile'>" +
                                               "    <div class='ImageIcon' " + 
                                               util_htmlAttribute("style",
                                                                  "background-image: url('" + _controller.Utils.ConstructKeyOpinionLeaderProfileURL({ "ID": _itemID }) + "')") +
                                               "    />" +
                                               "</div>";

                                        _isEncode = false;
                                    }
                                    else if (_column["ID"] == "tooltip_icon") {
                                        var _hasTooltip = false;
                                        var _tooltip = util_forceString(util_propertyValue(_item, _repeaterOpts.StaticList.PropertyDescription));

                                        _val = "<a data-role='button' data-inline='true' data-icon='info' data-iconpos='notext' data-theme='transparent' " +
                                               util_htmlAttribute("title", _tooltip, null, true) + "></a>";

                                        _isEncode = false;
                                    }
                                }

                                _val = (_isEncode ? util_htmlEncode(_val, _isNewLineEncode) : util_forceString(_val));

                                if (opts.IsContent && _isEncode && _cssClass != null) {
                                    _val = "<div " + util_htmlAttribute("class", _cssClass) + ">" + _val + "</div>";
                                }

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

                    $vwListView.data("OnCallback", function () {
                        if (_canSearch) {
                            $tbSearch.trigger("focus");
                        }

                        $vwListView.toggle("height");
                    });                    

                    //set selected items
                    $vwListView.data("LookupSelections", _repeaterOpts.LookupDefaultSelections);

                    //configure searchable text input, if applicable
                    if (_canSearch) {

                        $tbSearch.attr(DATA_ATTRIBUTE_RENDER, "searchable_field")
                                 .data("SearchConfiguration",
                                       {
                                           "SearchableParent": $tbSearch.closest(".SearchableView"),
                                           "OnRenderResult": function (result, opts) {
                                               $vwListView.trigger("events.refreshListView", { "IsCache": true, "Data": result, "SearchParam": opts });
                                           },
                                           "OnSearch": function (opts, callback) {

                                               if (!$vwRepeater) {
                                                   $vwRepeater = $vwListView.find(".CRepeater");
                                               }

                                               var _sortSettings = ctl_repeater_getSortSetting($vwRepeater);

                                               _sortSettings["PageNo"] = 1;

                                               _repeaterOpts.GetList($vwRepeater, _sortSettings, function (result) {
                                                   callback(result);
                                               });
                                           }
                                       });

                        $mobileUtil.RenderRefresh($tbSearch, true);
                    }

                    //bind the repeater related additional events
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
                    });

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

                    $repeater.trigger("events.refresh_list");

                };  //end: _onPopupBind

                if (_canSearch) {
                    _html += "<div class='SearchableView EditorSearchableView PluginEditorCardView'>" +
                             "  <input id='tbSearch' type='text' maxlength='1000' data-role='none' placeholder='Search' />" +
                             "  <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' data-iconpos='notext' title='Clear' />" +
                             "</div>";
                }

                _html += "<div id='vwListView' />";

                var _onDismissCallback = function () {

                    if (options["Callback"]) {
                        options.Callback();
                    }
                };

                var _popupOptions = _controller.DefaultPopupOptions({
                    "Title": _popupTitle,
                    "HTML": _html, "Size": "EditorPopupFixed" + (_repeaterOpts.StaticList.Enabled ? " EditorPopupSizeSmall EditorTableHiddenHeaderRow" : "") + " ScrollbarPrimary",
                    "IsDisableFooterButtons": true,
                    "OnPopupBind": _onPopupBind,
                    "OnClose": function () {

                        var _lookupSelections = ($mobileUtil.PopupContainer().find("#vwListView").data("LookupSelections") || {});
                        var _dataItem = _controller.EditItem();
                        var _selector = "";

                        if (_repeaterOpts.IsMultiSelect) {

                            var _valueList = util_propertyValue(_dataItem, _repeaterOpts.BridgeEntity.ListPropertyPath);
                            var _list = [];

                            var _arrOrderedIDs = [];

                            //iterate over the source list and add its ID to the list (requried in order to ensure source order is preserved)
                            if (_valueList) {
                                for (var v = 0; v < _valueList.length; v++) {
                                    var _bridgeItem = _valueList[v];

                                    _arrOrderedIDs.push(_bridgeItem[_repeaterOpts.BridgeEntity.PropertyValue]);
                                }
                            }

                            //add the selection keys to the list as IDs (duplicates will be handled below within the main loop iteration)
                            for (var _key in _lookupSelections) {
                                _arrOrderedIDs.push(_key);
                            }

                            for (var i = 0; i < _arrOrderedIDs.length; i++) {

                                var _id = util_forceInt(_arrOrderedIDs[i], enCE.None);
                                var _lookupItem = _lookupSelections[_id];

                                //check that an item exists (in the event it was already processed)
                                if (_lookupItem) {

                                    //search existing list for match
                                    var _bridgeItem = util_arrFilter(_valueList, _repeaterOpts.BridgeEntity.PropertyValue, _id, true);

                                    if (_bridgeItem.length == 1) {
                                        _bridgeItem = _bridgeItem[0];
                                    }
                                    else {

                                        //if no match is found, then search the source data list
                                        _bridgeItem = util_arrFilter(_srcValueList, _repeaterOpts.BridgeEntity.PropertyValue, _id, true);
                                        _bridgeItem = (_bridgeItem.length == 1 ? _bridgeItem[0] : null);
                                    }

                                    if (!_bridgeItem) {
                                        _bridgeItem = new _repeaterOpts.BridgeEntity.Instance();
                                    }

                                    _bridgeItem[_repeaterOpts.BridgeEntity.PropertyValue] = _id;

                                    if (_lookupItem[_repeaterOpts.BridgeEntity.ParentPropertyText]) {
                                        _bridgeItem[_repeaterOpts.BridgeEntity.PropertyID_Name] = _lookupItem[_repeaterOpts.BridgeEntity.ParentPropertyText];
                                    }

                                    //allow custom configurations for the bridge item, if applicable
                                    if (_repeaterOpts.BridgeEntity.OnConfigureItem) {
                                        _repeaterOpts.BridgeEntity.OnConfigureItem({ "Item": _bridgeItem, "LookupItem": _lookupItem });
                                    }

                                    _list.push(_bridgeItem);

                                    //remove the entry since it has been processed
                                    delete _lookupSelections[_id];
                                }
                            }

                            //set update list selections
                            util_propertySetValue(_dataItem, _repeaterOpts.BridgeEntity.ListPropertyPath, _list);

                            //rebind the field
                            _selector += (_selector != "" ? "," : "") + "[" + util_htmlAttribute("data-attr-prop-path", _repeaterOpts.BridgeEntity.ListPropertyPath) + "]";

                        }
                        else {
                            var _selection = null;

                            //will be at most only one selection
                            for (var _id in _lookupSelections) {
                                _selection = _lookupSelections[_id];
                                break;
                            }

                            if (_selection) {

                                //apply the value mappings based on the property path lookup
                                var _lookupPropertyPaths = (_repeaterOpts.LookupPropertyPathUpdates || {});
                                var _isDefaultPropPath = util_forceBool(_selection["_isDefaultPropPath"], false);

                                for (var _propPath in _lookupPropertyPaths) {
                                    var _propValue = _lookupPropertyPaths[_propPath];
                                    var _value = null;

                                    if (_isDefaultPropPath) {
                                        _value = _selection[_propPath];
                                    }
                                    else {
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
                                    }

                                    _selector += (_selector != "" ? "," : "") + "[" + util_htmlAttribute("data-attr-prop-path", _propPath) + "]";

                                    util_propertySetValue(_dataItem, _propPath, _value);
                                }                                
                            }
                        }

                        if (util_forceString(_selector) != "") {

                            //rebind the current item for the applicable property paths (restricted bind of elements)
                            _controller.DataItemBind({ "FilterSelector": _selector, "IsSelectiveUpdate": true });
                        }

                        _onDismissCallback();
                    }
                });

                _fnIndicator = _popupOptions.Utils.ToggleIndicator;

                ClearMessages();

                if (_repeaterOpts.OnOverrideCustomPopup) {
                    _repeaterOpts.OnOverrideCustomPopup();
                }
                else {
                    $mobileUtil.PopupOpen(_popupOptions);
                }

                break;  //end: popup search entity

            case "entity_details_view":

                var _ctxOptions = {
                    "RenderContainer": $btn.data("RenderContainer"),
                    "RenderTitleElement": $btn.data("RenderTitleElement"),
                    "IsExternalContainer": false,
                    "ViewModeEditOptions": {
                        "IsEnabled": false,
                        "PropertyValidateUserID": null
                    },
                    "CanAdminItem": null,
                    "OnEditClick": null,
                    "HeadingTitle": "Details",
                    "Item": null,
                    "Params": {
                        "DeepLoad": true
                    },
                    "Fields": null,
                    "ItemID": util_forceInt($mobileUtil.GetClosestAttributeValue($btn, "data-attr-item-id"), enCE.None),
                    "MethodName": null,
                    "Type": $mobileUtil.GetClosestAttributeValue($btn, "data-view-entity-type"),
                    "IsDisableAnimation": (util_forceInt($mobileUtil.GetClosestAttributeValue($btn, "data-is-disable-animation"), enCETriState.None) == enCETriState.Yes),
                    "Title": "%%NAME%%",
                    "ImageIconCssName": "",
                    "OnConfigureImage": null,
                    "PropertyTitleToken": null,
                    "SelectorInputLabelAction": "",
                    "OnActionInputEditorDataType": function (opts) { },
                    "PropertyMappings": {},
                    "TriggerController": $btn.data("TriggerController"),
                    "CanExport": false
                };

                _ctxOptions.IsExternalContainer = (_ctxOptions.RenderContainer && _ctxOptions.RenderContainer.length == 1);

                var _fnLoad = function (onCallback) {

                    if (!_ctxOptions.Item) {
                        APP.Service.Action({
                            "_indicators": false, "c": "PluginEditor", "m": _ctxOptions.MethodName, "args": _ctxOptions.Params
                        }, function (result) {
                            _ctxOptions.Item = result;
                            onCallback();
                        });
                    }
                    else {
                        onCallback();
                    }

                };  //end: _fnLoad

                var $trigger = $($btn.data("TriggerElement"));

                if ($trigger.length == 0) {
                    $trigger = $btn;
                }

                var _isEditMode = ($trigger.closest(".EditModeOn, .ViewStateEditModeOn").length == 1);

                if (_ctxOptions.ItemID != enCE.None && util_forceString(_ctxOptions.Type) != "") {

                    var _fnPreProcess = null;
                    var _fnGetCanAdminContext = function () {
                        var _canAdmin = enCETriState.None;

                        if (_ctxOptions.IsExternalContainer) {

                            //embedded view is being shown, so check controller to see if user does not have admin access on Repository component
                            if (!_controller.CanAdminComponentRepositoryResource()) {

                                //check if external controller (from trigger) supports method to determnine whether current user has admin access on KOL component
                                if (_ctxOptions.TriggerController && _ctxOptions.TriggerController["CanAdminComponentKOL"]) {
                                    _canAdmin = (_ctxOptions.TriggerController.CanAdminComponentKOL() ? enCETriState.None : enCETriState.No);
                                }
                                else {
                                    _canAdmin = enCETriState.No;
                                }
                            }
                        }
                        else {
                            _canAdmin = (_controller.CanAdmin() ? enCETriState.None : enCETriState.No);
                        }

                        return _canAdmin;

                    };  //end: _fnGetCanAdminContext

                    var _fnOnNavigateEditEntity = function (editParams) {

                        var $this = $(this);
                        var _valid = true;
                        var _requireBaseCallback = false;

                        var _navOptions = {
                            "GroupID": null,
                            "ViewMode": null,
                            "DataItem": _ctxOptions.Item,
                            "ItemID": _ctxOptions.ItemID,
                            "IsEditMode": true,
                            "Placeholder": null
                        };

                        switch (_ctxOptions.Type) {

                            case "KOL":
                                _navOptions.GroupID = "kol";
                                break;

                            case "Event":
                                _navOptions.GroupID = "events_activites";
                                _navOptions.ViewMode = enCContentViewModeKOL.Event;
                                break;

                            case "Activity":
                                _navOptions.GroupID = "events_activites";
                                _navOptions.ViewMode = enCContentViewModeKOL.Activity;
                                break;

                            case "Resource":
                                _requireBaseCallback = true;
                                break;

                            default:
                                _valid = false;
                                util_logError("_fnOnNavigateEditEntity :: not handled for type - " + _ctxOptions.Type);
                                break;
                        }

                        if (_valid) {
                            if (_requireBaseCallback) {
                                editParams = util_extend({ "OnBaseEditClick": null }, editParams);

                                if (editParams.OnBaseEditClick) {
                                    editParams.OnBaseEditClick.call($this);
                                }
                            }
                            else {
                                var $parent = $this.closest(".EditorFixedViewPopup");
                                var $clDimissAll = $parent.find("[data-attr-editor-controller-action-btn='popup_dismiss_all']:first");

                                _navOptions.Placeholder = $parent.clone();

                                $clDimissAll.trigger("click.controller_buttonClick", {
                                    "CanAnimate": false,    //disable all animations
                                    "OnDismissCallback": function () {
                                        _controller.NavigateToScreen(_navOptions);
                                    }
                                });
                            }
                        }

                    };  //end: _fnOnNavigateEditEntity

                    switch (_ctxOptions.Type) {

                        case "KOL":

                            _ctxOptions.HeadingTitle = "KOL";
                            _ctxOptions.CanExport = true;
                            _ctxOptions.Fields = [];

                            //add the Description field
                            var _field = new CEditorRenderField();

                            _field[enColCEditorRenderFieldProperty.Title] = "Description";
                            _field[enColCEditorRenderFieldProperty.EditorDataTypeID] = enCEEditorDataType.FreeText;
                            _field[enColCEditorRenderFieldProperty.PropertyPath] = enColKeyOpinionLeaderProperty.Description;

                            _ctxOptions.Fields.push(_field);
                            _ctxOptions.Fields = $.merge(_ctxOptions.Fields, _controller.Data.RenderOptionDetailPopupViewKOL);

                            _ctxOptions.MethodName = "KeyOpinionLeaderGetByPrimaryKey";

                            _ctxOptions.Params["KeyOpinionLeaderID"] = _ctxOptions.ItemID;
                            _ctxOptions.Params["ExtendedFilters"] = {
                                "CanAdmin": _fnGetCanAdminContext()
                            };

                            _ctxOptions.PropertyTitleToken = enColKeyOpinionLeaderProperty.Name;

                            _ctxOptions.ImageIconCssName = "ImageUserProfile";
                            _ctxOptions.OnConfigureImage = function ($img, item) {
                                var _id = item[enColKeyOpinionLeaderProperty.KeyOpinionLeaderID];

                                $img.attr("style", "background-image: url('" + _controller.Utils.ConstructKeyOpinionLeaderProfileURL({ "ID": _id }) + "')");
                            };

                            _ctxOptions.ViewModeEditOptions.IsEnabled = true;
                            _ctxOptions.ViewModeEditOptions.PropertyValidateUserID = enColKeyOpinionLeaderProperty.CompanyUserID;

                            break;  //end: KOL

                        case "Event":

                            _ctxOptions.HeadingTitle = "Event";
                            _ctxOptions.CanExport = true;
                            _ctxOptions.Fields = _controller.Data.RenderOptionDetailPopupViewEvent;

                            _ctxOptions.MethodName = "EventGetByPrimaryKey";

                            _ctxOptions.Params["EventID"] = _ctxOptions.ItemID;
                            _ctxOptions.Params["ExtendedFilters"] = {
                                "CanAdmin": _fnGetCanAdminContext()
                            };

                            _ctxOptions.PropertyTitleToken = enColEventProperty.Name;

                            _ctxOptions.ViewModeEditOptions.IsEnabled = true;
                            _ctxOptions.ViewModeEditOptions.PropertyValidateUserID = enColEventProperty.UserID;

                            break;  //end: Event

                        case "Activity":

                            _ctxOptions.HeadingTitle = "Activity";
                            _ctxOptions.CanExport = true;
                            _ctxOptions.Fields = _controller.Data.RenderOptionDetailPopupViewActivity;

                            _ctxOptions.MethodName = "ActivityGetByPrimaryKey";

                            _ctxOptions.Params["ActivityID"] = _ctxOptions.ItemID;
                            _ctxOptions.Params["ExtendedFilters"] = {
                                "CanAdmin": _fnGetCanAdminContext()
                            };

                            _ctxOptions.PropertyTitleToken = enColActivityProperty.Name;

                            _ctxOptions.ViewModeEditOptions.IsEnabled = true;
                            _ctxOptions.ViewModeEditOptions.PropertyValidateUserID = enColActivityProperty.UserID;

                            break;  //end: Activity

                        case "Resource":

                            _ctxOptions.HeadingTitle = "Document";
                            _ctxOptions.MethodName = "RepositoryResourceGetByPrimaryKey";
                            _ctxOptions.Params["ResourceID"] = _ctxOptions.ItemID;
                            _ctxOptions.PropertyTitleToken = enColRepositoryResourceProperty.Name;

                            _ctxOptions.SelectorInputLabelAction += (_ctxOptions.SelectorInputLabelAction != "" ? "," : "") +
                                                                    ".PropertyView[data-attr-prop-path]";

                            _ctxOptions.OnActionInputEditorDataType = function (opts) {
                                var _propPath = $(this).attr("data-attr-prop-path");

                                switch (_propPath) {

                                    case enColRepositoryResourceProperty.Name:
                                        var _val = opts.Value;

                                        _val = (opts.IsHTML ? opts.Value : util_htmlEncode(_val));

                                        opts.Value = _controller.Utils.ConstructRepositoryResourceLinkHTML({
                                            "Item": _ctxOptions.Item, "ContentHTML": _val, "IncludeDisplayName": true
                                        });
                                        opts.IsHTML = true;

                                        break;

                                    default:

                                        if (!opts.IsHTML && !opts.IsHandled &&
                                            (opts.EditorDataTypeID == enCEEditorDataType.Text || opts.EditorDataTypeID == enCEEditorDataType.FreeText)) {

                                            //force all Text and FreeText fields to parse links as HTML

                                            opts.Value = _controller.Utils.HTML.ParseTextLinkHTML(opts.Value, { "linkClass": "LinkExternal WordBreak" });
                                            opts.IsHTML = true;
                                        }

                                        break;
                                }
                            };

                            _fnPreProcess = function (onCallback) {

                                _fnLoad(function () {

                                    _ctxOptions.Item = (_ctxOptions.Item || {});

                                    _controller.Data.RenderOptionRepositoryCategoryLookup.Get({
                                        "DocumentTypeID": _ctxOptions.Item[enColRepositoryResourceProperty.DocumentTypeID], "Callback": function (category) {

                                            var _fields = (category ? category["_editorRenderFields"] : null);

                                            _fields = (_fields || []);

                                            //check if the document type field is available, if not add it as first entry
                                            var _search = util_arrFilter(_fields, enColCEditorRenderFieldProperty.PropertyPath, enColRepositoryResourceProperty.DocumentTypeIDName,
                                                                         true);

                                            if (_search.length == 0) {
                                                var _field = new CEditorRenderField();

                                                _field[enColCEditorRenderFieldProperty.Title] = "Document Type";
                                                _field[enColCEditorRenderFieldProperty.PropertyPath] = enColRepositoryResourceProperty.DocumentTypeIDName;

                                                _fields = $.merge([_field], _fields);
                                            }

                                            _ctxOptions.Fields = _fields;

                                            onCallback();
                                        }
                                    });
                                });
                            };

                            _ctxOptions.ViewModeEditOptions.IsEnabled = true;
                            _ctxOptions.ViewModeEditOptions.PropertyValidateUserID = enColRepositoryResourceProperty.UserID;

                            _ctxOptions.CanAdminItem = function (item) {

                                var _canAdminLibrary = _controller.CanAdminComponentRepositoryResource();

                                if (!_canAdminLibrary) {

                                    //check if user is owner of the repository resource item
                                    _canAdminLibrary = (util_forceInt(item[enColRepositoryResourceProperty.UserID], enCE.None) == global_AuthUserID());
                                }

                                return _canAdminLibrary;
                            };

                            _ctxOptions.OnEditClick = function () {
                                var $this = $(this);
                                var $header = $this.closest(".ActionButton");

                                $header.find("[data-attr-editor-controller-action-btn='popup_dismiss_all']")
                                       .trigger("click.controller_buttonClick", {
                                           "OnDismissCallback": function () {

                                               _controller.OnProcessViewForEvent({
                                                   "Event": "EditPopupResource",
                                                   "Resource": _ctxOptions.Item
                                               });
                                           }
                                       });
                            };

                            var _addEntityType = $mobileUtil.GetClosestAttributeValue($trigger, "data-add-entity-type");

                            if (util_forceString(_addEntityType) != "") {
                                _ctxOptions.PropertyMappings = util_extend(_ctxOptions.PropertyMappings,
                                                                           _controller.GetBridgeEntityPropertyMappings({ "BridgeEntityTypeID": _addEntityType }));
                            }

                            break;  //end: Resource

                    }

                    if (util_forceString(_ctxOptions.MethodName) != "") {
                        _fnToggleButton(false);

                        _controller.DOM.ToggleIndicator(true);

                        if (!_fnPreProcess) {
                            _fnPreProcess = function (onCallback) {
                                onCallback();
                            };
                        }

                        if (!_ctxOptions.IsExternalContainer) {

                            //temporarily disable the header tab events
                            _controller.DOM.View.trigger("events.toggleHeaderTabViewState", { "IsEnabled": false });
                        }

                        _fnPreProcess(function () {
                            var _html = "";
                            var _title = util_forceString(_ctxOptions.Title);
                            var _hasIcon = (util_forceString(_ctxOptions.ImageIconCssName) != "");

                            if (_title == "%%NAME%%" && _ctxOptions.PropertyTitleToken == null) {
                                _title = "&nbsp";
                            }

                            if (_ctxOptions.IsExternalContainer) {
                                _html += "<div class='Heading'>" +
                                         _controller.Utils.HTML.GetButton({
                                             "ActionButtonID": "popup_return", "Content": "Return", "CssClass": "LinkClickable ButtonTheme ActionButtonNavigationBack",
                                             "Attributes": {
                                                 "data-icon": "arrow-l"
                                             }
                                         }) +
                                         "</div>";

                                if (_ctxOptions.RenderTitleElement) {
                                    _ctxOptions.RenderTitleElement = $(_ctxOptions.RenderTitleElement);

                                    var _temp = util_forceString(_ctxOptions.HeadingTitle);

                                    if (_ctxOptions.IsDisableAnimation) {
                                        _ctxOptions.RenderTitleElement.data("ViewTitle", _temp);
                                    }
                                    else {
                                        _ctxOptions.RenderTitleElement.text(_temp);
                                    }
                                }
                            }
                            else {
                                _html += "<div class='Heading'>" +
                                         "  <div class='Label'>" + util_htmlEncode(_ctxOptions.HeadingTitle) + "</div>" +
                                         "</div>";
                            }

                            _html += "<div class='Title" + (_hasIcon ? " ImageStateOn" : "") + "'>" +
                                     (_hasIcon ?
                                      "<div class='EditorImageButton " + _ctxOptions.ImageIconCssName + "'>" +
                                      "   <div class='ImageIcon' />" +
                                      "</div>" :
                                      ""
                                     ) +
                                     "  <div class='Label'>" + _title + "</div>" +
                                     "</div>" +
                                     _controller.GetRenderOptionTableHTML({ "IsSummaryView": true, "List": _ctxOptions.Fields });

                            var $vwContainer;

                            if (_ctxOptions.IsExternalContainer) {
                                $vwContainer = _ctxOptions.RenderContainer;
                            }
                            else {
                                $vwContainer = _controller.ActiveGroupContainer();
                            }

                            var _numPopupViews = $vwContainer.children(".EditorFixedViewPopup").length;

                            var $vwDetail = $(_controller.GetViewHTML({
                                "IsPopupMode": true,
                                "SuffixDismissAllButtonText": (_numPopupViews > 0 ? "(" + util_formatNumber(_numPopupViews) + ")" : ""),
                                "IsDisableDismissButton": _ctxOptions.IsExternalContainer,
                                "ViewType": enCViewTypeKOL.None,
                                "CssClass": "EditorFixedViewPopup EditorFixedViewPositionTopLeft" + (_ctxOptions.IsExternalContainer ? " EmbeddedViewMode" : "") +
                                            (_isEditMode ? " ViewStateEditModeOn" : ""),
                                "HTML": _html
                            }));

                            $vwContainer.append($vwDetail);

                            $vwDetail.hide()
                                     .toggleClass("StateOnCanDismissAll", (_numPopupViews > 0));

                            //bind the callback to the element                            
                            $vwDetail.data("OnCallback", options["Callback"])
                                     .data("TriggerElement", $trigger.closest(".PropertyView"));

                            if (util_forceString(_ctxOptions.SelectorInputLabelAction) != "" && _ctxOptions.OnActionInputEditorDataType) {
                                $vwDetail.off("events.onActionInputEditorDataType");
                                $vwDetail.on("events.onActionInputEditorDataType", _ctxOptions.SelectorInputLabelAction, function (e, args) {
                                    _ctxOptions.OnActionInputEditorDataType.call(this, args);
                                });
                            }

                            $mobileUtil.refresh($vwDetail);

                            if (!_ctxOptions.IsExternalContainer) {
                                _controller.DOM.View.trigger("events.toggleHeaderTabViewState", {
                                    "IsEnabled": false, "OnDisabledHeaderClick": function () {
                                        $vwDetail.find("[data-attr-editor-controller-action-btn='popup_dismiss']")
                                                 .trigger("click");
                                    }
                                });
                            }

                            _fnLoad(function () {

                                var _item = (_ctxOptions.Item || {});

                                //bind the contents
                                if (_ctxOptions.OnConfigureImage) {
                                    _ctxOptions.OnConfigureImage($vwDetail.find(".ImageUserProfile > .ImageIcon"), _item);
                                }

                                if (_ctxOptions.PropertyTitleToken != null) {
                                    var $title = $vwDetail.find(".Title > .Label");
                                    var _strTitle = util_replaceAll(_ctxOptions.Title, "%%NAME%%", _item[_ctxOptions.PropertyTitleToken], true);

                                    $title.html(util_htmlEncode(_strTitle));
                                }

                                _controller.DataItemBind({
                                    "Context": $vwDetail, "DataItem": _item, "FieldList": _ctxOptions.Fields, "Callback": function () {

                                        var $headerActionView = $vwDetail.children(".ActionButton:first");
                                        var _checkEdit = (_isEditMode || (!_isEditMode && _ctxOptions.ViewModeEditOptions.IsEnabled));

                                        if (!_isEditMode && _ctxOptions.ViewModeEditOptions.IsEnabled) {

                                            //force default options
                                            if (!_ctxOptions.CanAdminItem) {
                                                _ctxOptions.CanAdminItem = function (item) {
                                                    var _canEdit = _controller.CanAdmin();

                                                    //check if user does not have admin permission, but validate the item UserID value, if applicable
                                                    if (!_canEdit && _ctxOptions.ViewModeEditOptions.PropertyValidateUserID) {
                                                        var _itemUserID = util_forceInt(util_propertyValue(item, _ctxOptions.ViewModeEditOptions.PropertyValidateUserID),
                                                                                        enCE.None);

                                                        _canEdit = (_itemUserID == global_AuthUserID());
                                                    }

                                                    return _canEdit;
                                                };
                                            }

                                            //configure the event to handle edit action
                                            var _baseOnEditClick = _ctxOptions.OnEditClick;

                                            _ctxOptions.OnEditClick = function () {
                                                _fnOnNavigateEditEntity.call(this, { "OnBaseEditClick": _baseOnEditClick });
                                            };
                                        }

                                        if (_checkEdit && _ctxOptions.CanAdminItem && _ctxOptions.CanAdminItem(_item)) {
                                            var $btnEdit = _controller.Utils.HTML.GetButton({
                                                "Content": "Edit",
                                                "Attributes": { "data-button-id": "edit", "data-icon": "edit", "data-iconpos": "right" }
                                            });

                                            $btnEdit = $($btnEdit);
                                            $headerActionView.prepend($btnEdit)
                                                             .trigger("create");

                                            $btnEdit.off("click.edit");
                                            $btnEdit.on("click.edit", function () {
                                                if (_ctxOptions.OnEditClick) {
                                                    _ctxOptions.OnEditClick.call(this);
                                                }
                                            });
                                        }

                                        if (_ctxOptions.CanExport) {

                                            var $btns = "";

                                            if (_controller.Data.HasExportPowerPointFeature) {
                                                $btns += _controller.Utils.HTML.GetButton({
                                                    "ActionButtonID": "export_entity",
                                                    "Content": "Export PPT",
                                                    "Attributes": {
                                                        "data-icon": "arrow-r",
                                                        "data-attr-export-report-type": enCReportExportType.PPT,
                                                        "data-attr-export-item-id": _ctxOptions.ItemID,
                                                        "data-attr-export-entity-type": _ctxOptions.Type
                                                    }
                                                });
                                            }

                                            if (_controller.Data.HasExportExcelFeature) {
                                                $btns += _controller.Utils.HTML.GetButton({
                                                    "ActionButtonID": "export_entity",
                                                    "Content": "Export Excel",
                                                    "Attributes": {
                                                        "data-icon": "arrow-r", "data-attr-export-report-type": enCReportExportType.Excel,
                                                        "data-attr-export-item-id": _ctxOptions.ItemID,
                                                        "data-attr-export-entity-type": _ctxOptions.Type
                                                    }
                                                });
                                            }

                                            $btns = $($btns);

                                            $.each($btns, function () {
                                                var $btn = $(this);

                                                $headerActionView.prepend($btn)
                                                                 .trigger("create");
                                            });
                                        }

                                        var _fn = function () {
                                            _controller.DOM.ToggleIndicator(false);
                                            _fnToggleButton(true);

                                            if (_ctxOptions.IsExternalContainer && options["Callback"]) {
                                                options.Callback();
                                            }
                                        };

                                        if (_ctxOptions.IsDisableAnimation) {
                                            if (_ctxOptions.RenderTitleElement) {
                                                var _temp = util_forceString(_ctxOptions.RenderTitleElement.data("ViewTitle"));

                                                _ctxOptions.RenderTitleElement
                                                           .text(_temp);
                                            }

                                            $vwDetail.show();
                                            _fn();
                                        }
                                        else {
                                            $vwDetail.slideDown("normal", function () {
                                                _fn();
                                            });
                                        }
                                    }
                                });

                            });

                        });
                    }
                }

                break; //end: entity_details_view

            case "popup_dismiss":

                _fnToggleButton(false);

                var $parent = $btn.closest(".EditorFixedViewPopup");
                var _hasPopupViews = ($parent.siblings(".EditorFixedViewPopup:first").length > 0);

                var _onDismissCallback = $parent.data("OnCallback");
                var _fn = function () {

                    //restore the header tabs state, if applicable
                    if (!_hasPopupViews) {
                        _controller.DOM.View.trigger("events.toggleHeaderTabViewState", { "IsEnabled": true });
                    }

                    if (_onDismissCallback) {
                        _onDismissCallback();
                    }

                    //check if the trigger button has its own click callback
                    if ($btn.data("OnCallback")) {
                        var _fn = $btn.data("OnCallback");

                        _fn.call($btn);
                    }

                    $parent.remove();

                    //execute callback event from button trigger, if applicable
                    if (options["OnDismissCallback"]) {
                        options.OnDismissCallback();
                    }

                };  //end: _fn

                if (util_forceBool(options["DisableAnimation"], false) == true) {
                    _fn();
                }
                else {
                    $parent.slideUp("normal", _fn);
                }

                break;

            case "popup_dismiss_all":

                var $parent = $btn.closest(".EditorFixedViewPopup");
                var $list = $parent.siblings(".EditorFixedViewPopup");

                var _queue = new CEventQueue();
                var _canAnimate = util_forceBool(options["CanAnimate"], true);

                var _fnDismissPopupView = function (vw, onDismissCallback, disableAnimation) {
                    var $clDimiss = $(vw).find("[data-attr-editor-controller-action-btn='popup_dismiss']:first");

                    if ($clDimiss.length == 0) {
                        onDismissCallback();
                    }
                    else {
                        $clDimiss.trigger("click.controller_buttonClick", {
                            "OnDismissCallback": function () {
                                onDismissCallback();
                            },
                            "DisableAnimation": (_canAnimate ? util_forceBool(disableAnimation, true) : true)
                        });
                    }

                };  //end: _fnDismissPopupView

                _queue.Add(function (onCallback) {
                    _fnDismissPopupView($parent, onCallback, ($list.length > 0));
                });

                var _length = $list.length;

                //execute in descending order to ensure top most view is dismissed first
                for (var i = _length - 1; i >= 0; i--) {
                    $(function ($this, isLast) {
                        _queue.Add(function (onCallback) {
                            _fnDismissPopupView($this, onCallback, !isLast);
                        });
                    }($list.get(i), i == 0));
                }

                _queue.Run({
                    "Callback": function () {
                        var _fn = (options["OnDismissCallback"] || function (args) { });
                        _fn();
                    }
                });

                break;  //end: popup_dimiss_all

            case "add_comment":
            case "delete_comment":

                //supported for only KOL view
                var _dataItem = _controller.EditItem();

                if (_dataItem) {

                    var _keyOpinionLeaderID = util_forceInt(_dataItem[enColKeyOpinionLeaderProperty.KeyOpinionLeaderID], enCE.None);
                    var _isAddNewDataItem = (_keyOpinionLeaderID == enCE.None);
                    var _fnIndicator = null;

                    if (options.ButtonID == "add_comment" &&
                        (!_isAddNewDataItem || (_isAddNewDataItem && $btn.closest(".CommentsView").hasClass("EditModeOn")))
                       ) {
                        var _onPopupBind = function () {

                            var $popup = $mobileUtil.PopupContainer();

                            _fnToggleButton(true);

                            var $clSaveComment = $popup.find("#clSaveComment");
                            var $tbComment = $popup.find("#tbComment");

                            $clSaveComment.off("click.save");
                            $clSaveComment.on("click.save", function () {

                                if ($clSaveComment.hasClass("LinkDisabled")) {
                                    return;
                                }

                                $clSaveComment.addClass("LinkDisabled");

                                var _val = util_trim($tbComment.val());

                                $tbComment.val(_val);

                                ClearMessages();

                                if (_val == "") {
                                    AddUserError("Comment is required.");
                                    $tbComment.trigger("focus");
                                }
                                else {

                                    var _fnOnSave = function () {
                                        AddMessage("Comment has been saved.");

                                        setTimeout(function () {
                                            $popup.data("IsRefreshList", true);
                                            $mobileUtil.PopupClose();
                                        }, 500);
                                    };

                                    var _comment = new CEKeyOpinionLeaderComment();

                                    _comment[enColKeyOpinionLeaderCommentProperty.CommentText] = _val;
                                    _comment[enColKeyOpinionLeaderCommentProperty.KeyOpinionLeaderID] = _keyOpinionLeaderID;

                                    if (_isAddNewDataItem) {

                                        //item is currently being added (i.e. not edit with PK set to None), so will add the comment to the data item list property
                                        var _comments = _dataItem[enColCEKeyOpinionLeaderProperty.Comments];
                                        var _currentUser = global_AuthUserDetail();
                                        var _displayName = "";

                                        if (!_comments) {
                                            _comments = [];
                                            _dataItem[enColCEKeyOpinionLeaderProperty.Comments] = _comments;
                                        }

                                        if (_currentUser) {
                                            _displayName = util_forceString(_currentUser[enColUserProperty.FirstName]) + " " +
                                                           util_forceString(_currentUser[enColUserProperty.LastName]);
                                        }

                                        _comment[enColKeyOpinionLeaderCommentProperty.UserDisplayName] = _displayName;
                                        _comment[enColKeyOpinionLeaderCommentProperty.PostedOn] = new Date();
                                        _comment[enColKeyOpinionLeaderCommentProperty.UserID] = global_AuthUserID();

                                        //set temp ID
                                        _comment["_tempID"] = _controller.NextUniqueID();

                                        var _temp = [];

                                        _temp.push(_comment);
                                        $.merge(_temp, _comments);

                                        _dataItem[enColCEKeyOpinionLeaderProperty.Comments] = _temp;

                                        _fnOnSave();
                                    }
                                    else {

                                        //NOTE: the user and posted on date will be populated by server

                                        _fnIndicator(true);

                                        var _params = {
                                            "_action": "SAVE", "_indicators": false,
                                            "c": "PluginEditor", "m": "KeyOpinionLeaderCommentCurrentUserSave", "args": {
                                                "Item": util_stringify(_comment)
                                            },
                                            "_eventArgs": {
                                                "Options": {
                                                    "CallbackGeneralFailure": function () {
                                                        $clSaveComment.removeClass("LinkDisabled");
                                                    }
                                                }
                                            }
                                        };

                                        APP.Service.Action(_params, function (result) {
                                            _fnOnSave();
                                        });
                                    }

                                }
                            });

                            $tbComment.trigger("focus");
                        };

                        var _html = "<div class='PopupContentCommentEdit'>" +
                                    "   <div class='PropertyView'>" +
                                    "       <textarea id='tbComment' />" +
                                    "   </div>" +
                                    "   <div class='Footer'>" +
                                    _controller.Utils.HTML.GetButton({
                                        "Content": "Save", "CssClass": "ButtonTheme",
                                        "Attributes": { "id": "clSaveComment", "data-icon": "check" }
                                    }) +
                                    "   </div>" +
                                    "</div>";

                        var _popupOptions = _controller.DefaultPopupOptions({
                            "Title": "Add Comment",
                            "HTML": _html, "Size": "EditorPopupFixed EditorPopupSizeSmall ScrollbarPrimary", "IsDisableFooterButtons": true,
                            "OnPopupBind": _onPopupBind,
                            "OnClose": function () {
                                var $popup = $mobileUtil.PopupContainer();

                                if ($popup.data("IsRefreshList")) {
                                    _controller.BindFeedbackView();
                                }
                            }
                        });

                        _fnIndicator = _popupOptions.Utils.ToggleIndicator;

                        ClearMessages();

                        $mobileUtil.PopupOpen(_popupOptions);
                    }
                    else if (options.ButtonID == "delete_comment") {

                        var _comment = null;
                        var _fnDeleteComment = function () {

                            if (!_comment) {
                                _fnToggleButton(true);
                            }
                            else {

                                dialog_confirmYesNo("Delete", "Are you sure you want to delete the comment?", function () {

                                    var _fnRefreshList = function () {

                                        var $vw = $btn.closest(".CommentDetail");

                                        $vw.toggle("height", function () {

                                            _fnToggleButton(true);

                                            //refresh the list
                                            _controller.BindFeedbackView({
                                                "Callback": function () {
                                                    AddMessage("Comment has been successfully deleted.", null, null, { "IsTimeout": true });
                                                }
                                            });
                                        });

                                    };  //end: _fnRefreshList

                                    if (_isAddNewDataItem) {

                                        //filter the comments to exclude the deleted comment
                                        var _comments = util_arrFilterSubset(_dataItem[enColCEKeyOpinionLeaderProperty.Comments], function (searchItem) {
                                            return (searchItem["_tempID"] != _comment["_tempID"]);
                                        });

                                        _dataItem[enColCEKeyOpinionLeaderProperty.Comments] = _comments;

                                        _fnRefreshList();
                                    }
                                    else {
                                        var _params = {
                                            "_action": "SAVE", "_indicators": false,
                                            "c": "PluginEditor", "m": "KeyOpinionLeaderCommentDelete", "args": {
                                                "Item": util_stringify(_comment)
                                            },
                                            "_eventArgs": {
                                                "Options": {
                                                    "CallbackGeneralFailure": function () {
                                                        _fnToggleButton(true);
                                                    }
                                                }
                                            }
                                        };

                                        APP.Service.Action(_params, function (result) {
                                            _fnRefreshList();
                                        });
                                    }
                                    
                                }, function () {
                                    _fnToggleButton(true);
                                });
                            }

                        };  //end: _fnDeleteComment

                        if (_isAddNewDataItem) {

                            //delete the item from the local comments list (using temp ID)
                            var _tempCommentID = util_forceInt($mobileUtil.GetClosestAttributeValue($btn, "data-comment-temp-id"), enCE.None);
                            var _comments = _dataItem[enColCEKeyOpinionLeaderProperty.Comments];

                            _comment = util_arrFilter(_comments, "_tempID", _tempCommentID, true);
                            _comment = (_comment.length == 1 ? _comment[0] : null);
                            
                            _fnDeleteComment();
                        }
                        else if (_controller.CanAdmin() || _comment[enColKeyOpinionLeaderCommentProperty.UserID] == global_AuthUserID()) {

                            //delete the comment since user is either Administrator or owner of comment
                            var _comments = $btn.closest(".ListView").data("DataSource");
                            var _commentID = util_forceInt($mobileUtil.GetClosestAttributeValue($btn, "data-attr-item-id"), enCE.None);

                            _comments = (_comments ? _comments.List : null);

                            _comment = util_arrFilter(_comments, enColKeyOpinionLeaderCommentProperty.CommentID, _commentID, true);
                            _comment = (_comment.length == 1 ? _comment[0] : null);

                            _fnDeleteComment();
                        }
                        else {
                            _fnToggleButton(true);
                        }
                    }
                    else {
                        _fnToggleButton(true);
                    }
                }
                else {
                    _fnToggleButton(true);
                }

                break;  //end: add_comment, delete_comment

            case "external_action":

                //for buttons with external action ID, will trigger event on the containing element and pass its data attribute for the action
                if (_controller.DOM.View) {

                    var _action = $btn.attr("data-external-action-id");
                    var _eventArgs = {
                        "Trigger": $btn,
                        "Action": _action,
                        "IsRequirePrompt": false,
                        "Callback": function () {
                            _fnToggleButton(true);
                        }
                    };

                    if (_action == "navigate_back") {
                        _eventArgs["DataItem"] = $btn.data("DataItem");
                        _eventArgs.IsRequirePrompt = util_forceBool($btn.data("IsRequirePrompt"), true);
                    }

                    var _fn = function () {
                        $(_controller.DOM.View).trigger("events.externalOnAction", _eventArgs);
                    };

                    if (_eventArgs.IsRequirePrompt) {
                        dialog_confirmYesNo(_controller.Utils.LABELS.CancelChanges, _controller.Utils.LABELS.ConfirmCancelChanges, function () {
                            _fn();
                        }, function () {
                            _fnToggleButton(true);
                        });
                    }
                    else {
                        _fn();
                    }
                }
                else {
                    _fnToggleButton(true);
                }

                break;  //end: external_action

            default:
                _fnToggleButton(true);
                break;
        }
    }
};

CKeyOpinionLeaderController.prototype.OnListViewEntityAction = function (options) {
    var _itemID = options.ItemID;
    var _listViewType = options.ListViewType;
    var $listView = $(options.ListView);

    var _controller = this;
    var _callback = function () {

        var _queueRefresh = new CEventQueue();

        _queueRefresh.Add(function (onCallback) {
            _controller.BindSearchListViewEditor({ "Callback": onCallback });
        });

        _queueRefresh.Add(function (onCallback) {
            _controller.BindCalendarView({ "Callback": onCallback });
        });

        if (_controller.ActiveGroupID() == _controller.Data.ID.KOL) {
            _queueRefresh.Add(function (onCallback) {
                _controller.BindFeedbackView({ "Callback": onCallback });
            });
        }

        _queueRefresh.Run({ "Callback": options["Callback"] });
    };

    var _ctxOptions = {
        "MethodName": null,
        "MethodArgs": {
            "DeepLoad": true
        }
    };
    var _isSummaryView = false;

    switch (_listViewType) {

        case "summary_kol":
            _ctxOptions.MethodName = "KeyOpinionLeaderGetByPrimaryKey";
            _ctxOptions.MethodArgs["KeyOpinionLeaderID"] = _itemID;
            _isSummaryView = true;
            break;

        case "summary_event":
            _ctxOptions.MethodName = "EventGetByPrimaryKey";
            _ctxOptions.MethodArgs["EventID"] = _itemID;
            _isSummaryView = true;
            break;

        case "summary_activity":
            _ctxOptions.MethodName = "ActivityGetByPrimaryKey";
            _ctxOptions.MethodArgs["ActivityID"] = _itemID;
            _isSummaryView = true;
            break;
    }

    var $parent = $listView.closest("[data-view-type]");

    if (!$parent.hasClass("EditorFixedViewTransitionSizeWidthFull") && !$parent.hasClass("EditorFixedViewTransitionFullScreen")) {
        var $list = _controller.FindActiveGroupViewTypes({ "ViewType": [enCViewTypeKOL.Calendar, enCViewTypeKOL.ActivityDetails] });

        $list.addClass("EditorFixedViewTransitionSizeHeightA");
        $parent.addClass("EditorFixedViewTransitionSizeWidthFull CanResizeInitial");
    }

    //force it to be in read only mode (with current data item; in the event a new item is being loaded it will be handled below)
    _controller.SetPropertyViewEditMode(false);

    _controller.DOM.ToggleIndicator(true);

    var _fnOnDefaultState = _controller.ActiveGroupContainer().data("OnDefaultState");

    if (_fnOnDefaultState) {
        _fnOnDefaultState();
    }

    APP.Service.Action({
        "_indicators": false, "c": "PluginEditor", "m": _ctxOptions.MethodName, "args": _ctxOptions.MethodArgs
    }, function (result) {
        _controller.DOM.ToggleIndicator(false);
        _controller.DataItemBind({
            "DataItem": result, "Callback": function () {

                if (_isSummaryView) {

                    //force it to refresh the read only mode (using the updated data item, if applicable)
                    _controller.SetPropertyViewEditMode(false);
                }

                _callback();
            }
        });
    });

};

CKeyOpinionLeaderController.prototype.OnExportEntity = function (options) {

    var _controller = this;

    options = util_extend({ "Trigger": null, "Callback": null }, options);

    var _callback = function (success) {

        success = util_forceBool(success, false);

        unblockUI();

        if (!success) {
            global_unknownErrorAlert();
        }

        $trigger.removeClass("LinkDisabled");

        if (options.Callback) {
            options.Callback(success);
        }

    };  //end: _callback

    var $trigger = $(options.Trigger);
    var _itemState = _controller.EditItemIsExistEntity({ "Trigger": $trigger, "IsObjectFormat": true });

    $trigger.addClass("LinkDisabled");

    if (_itemState.HasItem) {

        var _reportFormat = enCReportExportType.None;

        var _exportSetting = {
            "Fields": {
                "ExportTemplateType": null,
                "EditorReportID": "%%TOK|ROUTE|PluginEditor|ExportReportID_KOL_Manager%%"
            },
            "Configuration": { "ReportExportType": enCReportExportType.Dynamic }
        };

        var _fields = _exportSetting.Fields;

        _reportFormat = util_forceInt($mobileUtil.GetClosestAttributeValue($trigger, "data-attr-export-report-type"), enCReportExportType.None);

        if (_reportFormat == enCReportExportType.None) {
            _reportFormat = enCReportExportType.Excel;
        }

        _fields["ReportFormat"] = _reportFormat;
        _fields["RouteName"] = "PluginEditor";
        _fields["ClassificationID"] = _controller.Utils.ContextClassificationID($trigger);
        _fields["ComponentID"] = _controller.Utils.ContextEditorGroupComponentID($trigger);

        util_extend(_fields, "%%TOK|ROUTE|PluginEditor|KOL_ManagerExportOptions%%", true);

        _fields["ItemID"] = _itemState.ID;
        _fields["EntityTypeID"] = _itemState.EntityTypeID;
        _fields["CanAdmin"] = (_controller.CanAdmin() ? enCETriState.None : enCETriState.No);

        //check if the export iframe is available (add it to the page content, if applicable)
        var $frame = $mobileUtil.GetElementByID("ifmModelExportContainer");

        if ($frame.length == 0) {
            $frame = $("<iframe id='ifmModelExportContainer' frameborder='0' scrolling='no' width='0' height='0' style='display: none;'></iframe>");
            $mobileUtil.Content().append($frame);
        }

        blockUI();

        global_onlineModelExport(_exportSetting, function () {

            //successfully exported report
            _callback(true);
        }, function () {

            //error has occurred
            _callback(false);
        });
    }
    else {
        _callback();
    }

};

CKeyOpinionLeaderController.prototype.DefaultPopupOptions = function (options) {

    var _controller = this;

    options = util_extend({
        "HTML": "", "Title": null, "Size": "EditorPopupSizeMedium", "OnPopupBind": function () { },
        "IsDisableFooterButtons": false, "OnButtonClick": function (opts) { }, "OnClose": function () { }
    }, options);

    if (util_forceString(options.Size) == "") {
        options.Size = "EditorPopupSizeMedium";
    }

    var _ret = {
        "PopupCssClass": "EditorPopup " + options.Size + " PopupThemeA",
        "HasIndicators": true,
        "DisablePosition": true,
        "IsDismissClickOverlay": true,
        "HeaderTitle": options.Title,
        "blankContent": "",
        "callbackOpen": function () {

            var $popup = $mobileUtil.PopupContainer();

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
        "callbackClose": options.OnClose,
        "AttributesContainer": {},

        "Utils": {

            "ToggleIndicator": function (isEnabled) {
                $mobileUtil.PopupContainer().trigger("events.popup_toggleIndicator", { "IsEnabled": isEnabled });
            }
        }
    };

    var _html = util_forceString(options.HTML);

    _html += "<div class='Footer'>" +
             (options.IsDisableFooterButtons ? 
              "" :
              _controller.Utils.HTML.GetButton({
                  "ActionButtonID": "popup_save",
                  "CssClass": "ButtonTheme",
                  "Content": "Save",
                  "Attributes": {
                      "data-inline": "true",
                      "data-icon": "check",
                      "data-iconpos": "left"
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
                      "data-attr-popup-close-button": enCETriState.Yes
                  }
              })
              ) +
             "</div>";

    _ret.blankContent = _html;
    _ret.AttributesContainer[DATA_ATTRIBUTE_RENDER] = "pluginEditor_fileDisclaimer";

    return _ret;
};

CKeyOpinionLeaderController.prototype.ShowPanel = function (options) {

    options = util_extend({ "OnClose": null, "Callback": null }, options);

    var _controller = this;

    var _callback = function (obj) {

        if (options.Callback) {
            options.Callback(obj);
        }
    };

    var $element = $mobileUtil.Find("#vwPanelMain");
    var _html = "";

    if ($element.length == 0) {
        $element = $("<div id='vwPanelMain' class='EditorPanel' />");

        $element.on("remove.cleanup", function () {
            $("body").removeClass("EditorOverflowPageHidden");
        });

        $element.off("events.panel_dismiss");
        $element.on("events.panel_dismiss", function () {
            var $panel = $element.children(".Content");
            var $btn = $element.children(".ActionButton");

            $element.off("events.panel_dismiss");

            $btn.fadeOut("fast", function () {
                $panel.animate({ "right": ($(window).width() * -0.33) + "px" }, function () {
                    var _onClose = $element.data("OnClose");

                    if (_onClose) {
                        _onClose({ "Element": $element });
                    }

                    $element.remove();
                });
            });

        }); //end: events.panel_dismiss

        $element.off("click.panel_overlay");
        $element.on("click.panel_overlay", ".Overlay", function () {
            $element.trigger("events.panel_dismiss");
        }); //end: click.panel_overlay

        $element.off("click.panel_close");
        $element.on("click.panel_close", ".ActionButton", function () {
            $element.trigger("events.panel_dismiss");
        });

        $mobileUtil.Content().append($element);
    }

    _html += "<div class='Overlay' />" +
             "<div class='ActionButton'>" +
             _controller.Utils.HTML.GetButton({
                 "CssClass": "ButtonTheme",
                 "Attributes": {
                     "data-inline": "true",
                     "data-icon": "delete",
                     "data-iconpos": "notext"
                 }
             }) +
             "</div>" +
             "<div tabindex='-1' class='ScrollbarPrimary Content'>" +
             "  <div class='Title'>" + util_htmlEncode(options["Title"]) + "</div>" +
             util_forceString(options["HTML"]) +
             "</div>";

    $element.html(_html)
            .hide();

    $mobileUtil.refresh($element);

    $("body").addClass("EditorOverflowPageHidden");

    var $panel = $element.children(".Content");
    var $btn = $element.children(".ActionButton");

    $btn.hide();
    $element.show();

    $element.data("OnClose", options.OnClose);

    $panel.css("right", ($(window).width() * -0.33) + "px");

    $panel.animate({ "right": "0px" }, function () {
        $btn.fadeIn("fast");
        _callback($element);
    });
};

CKeyOpinionLeaderController.prototype.GetContextFilterID = function (callback, isDisableInit) {

    var _key = "ContextFilterID";
    var _controller = this;

    if (_controller.ActiveGroupID() == _controller.Data.ID.EventActivity) {
        _key += "_" + _controller.ActiveContentViewModeID();
    }

    var _filterID = (_controller.DOM.View ? _controller.ActiveGroupContainer().data(_key) : null);
    var _callback = function () {

        if (callback) {
            callback(_filterID);
        }
    };

    if (isDisableInit || util_forceString(_filterID) != "") {
        _callback();
    }
    else {
        GlobalService.HasIndicators = false;
        GlobalService.NewGUID(function (id) {
            _filterID = id;

            if (_controller.DOM.View) {
                _controller.ActiveGroupContainer().data(_key, _filterID);
            }

            _callback();
        });
    }
};

CKeyOpinionLeaderController.prototype.ActiveGroupContainer = function () {
    var _controller = this;
    var $element = _controller.DOM.GroupContents.filter("[" + util_htmlAttribute("data-content-group-id", _controller.ActiveGroupID()) + "]");

    return $element;
};

CKeyOpinionLeaderController.prototype.ActiveGroupID = function () {
    var _ret = null;
    var _controller = this;

    if (_controller.DOM.View) {
        _ret = _controller.DOM.View.data("ActiveGroupID");
    }

    if (util_forceString(_ret) == "" && _controller.Data.ContextGroups.length > 0) {

        _ret = util_forceString(_controller.Data.DefaultViewGroupID);

        if (_ret == "") {

            //default to the first group
            var _group = _controller.Data.ContextGroups[0];

            _ret = _group["ID"];
        }

        if (_controller.DOM.View) {
            _controller.DOM.View.data("ActiveGroupID", _ret);
        }
    }

    return _ret;
};

CKeyOpinionLeaderController.prototype.CanAdmin = function () {
    var _instance = this;
    var _ret = false;

    if (_instance.DOM.View) {
        _ret = _instance.DOM.View.hasClass("AdminViewMode");
    }

    return _ret;
};

CKeyOpinionLeaderController.prototype.CanAdminComponentRepositoryResource = function () {
    var _instance = this;
    var _ret = false;

    if (_instance.DOM.View) {
        _ret = _instance.DOM.View.hasClass("AdminViewModeComponentRepositoryResource");
    }

    return _ret;
};

CKeyOpinionLeaderController.prototype.NextUniqueID = function () {
    var _instance = this;
    var _ret = null;

    if (_instance.DOM.View) {
        _ret = util_forceInt(_instance.DOM.View.data("TempID"), enCE.None);

        if (_ret == enCE.None) {
            _ret = 1;
        }
        else {
            _ret += 1;
        }

        _instance.DOM.View.data("TempID", _ret);
    }
    else {
        _ret = (new Date()).getTime();
    }

    return _ret;
};

//returns the active group element's entity data item (supports multiple data items based on content view modes as well)
CKeyOpinionLeaderController.prototype.EditItem = function () {
    var _controller = this;
    var $container = _controller.ActiveGroupContainer();

    return $container.data(_controller.KeyEditDataItem());
};

CKeyOpinionLeaderController.prototype.KeyEditDataItem = function () {

    var _controller = this;
    var _ret = "EditItem";

    switch (_controller.ActiveGroupID()) {

        case _controller.Data.ID.EventActivity:
            _ret += "_" + _controller.ActiveContentViewModeID();
            break;
    }

    return _ret;
};

//returns whether the edit item is an existing entity (i.e. update item based on edit item and its view based property ID value)
CKeyOpinionLeaderController.prototype.EditItemIsExistEntity = function (options) {

    var _controller = this;

    options = util_extend({ "Trigger": null, "IsObjectFormat": false }, options);

    var _ret = {
        "HasItem": true, //default assume edit item exists (regardless of its property values or null state)
        "ID": enCE.None,
        "EntityTypeID": null
    };

    var _controller = this;
    var $trigger = $(options.Trigger);
    var _propertyPathID = null;
    var _dataItem = null;

    if ($trigger.length == 1) {
        _ret.ID = $mobileUtil.GetClosestAttributeValue($trigger, "data-attr-export-item-id");
        _ret.EntityTypeID = $mobileUtil.GetClosestAttributeValue($trigger, "data-attr-export-entity-type");
    }

    if (util_forceString(_ret.EntityTypeID) == "") {
        _dataItem = _controller.EditItem();

        switch (_controller.ActiveGroupID()) {

            case _controller.Data.ID.KOL:
                _propertyPathID = enColKeyOpinionLeaderProperty.KeyOpinionLeaderID;
                _ret.EntityTypeID = "KOL";
                break;

            case _controller.Data.ID.EventActivity:

                switch (_controller.ActiveContentViewModeID()) {

                    case enCContentViewModeKOL.Event:
                        _propertyPathID = enColEventProperty.EventID;
                        _ret.EntityTypeID = "Event";
                        break;

                    case enCContentViewModeKOL.Activity:
                        _propertyPathID = enColActivityProperty.ActivityID;
                        _ret.EntityTypeID = "Activity";
                        break;
                }

                break;
        }
    }

    if (_propertyPathID != null) {
        _ret.ID = util_propertyValue(_dataItem || {}, _propertyPathID);
    }

    _ret.ID = util_forceInt(_ret.ID, enCE.None);
    _ret.HasItem = (_ret.ID != enCE.None);

    return (options.IsObjectFormat ? _ret : _ret.HasItem);
};

CKeyOpinionLeaderController.prototype.FindActiveGroupViewTypes = function (options) {
    var _controller = this;

    options = util_extend({ "ViewType": null }, options);

    var _arr = [];
    var _ret = null;

    //check if the view types is an array of ids
    if ($.isArray(options.ViewType)) {
        $.merge(_arr, options.ViewType);
    }
    else {
        _arr.push(util_forceInt(options.ViewType, enCE.None));
    }

    var _selector = "";

    for (var i = 0; i < _arr.length; i++) {
        _selector += (i > 0 ? "," : "") + ".EditorCardViewKOL[" + util_htmlAttribute("data-view-type", _arr[i]) + "]";
    }

    if (_selector != "") {
        _ret = _controller.ActiveGroupContainer().find(_selector);
    }

    return $(_ret);
};

CKeyOpinionLeaderController.prototype.ActiveContentViewModeID = function () {
    var _ret = null;
    var _controller = this;

    if (_controller.DOM.View) {
        _ret = _controller.DOM.View.data("ActiveContentViewModeID");
    }

    if (!_ret) {
        _ret = _controller.Data.DefaultContentViewModeID;

        if (_controller.DOM.View) {
            _controller.DOM.View.data("ActiveContentViewModeID", _ret);
        }
    }

    return _ret;
};

CKeyOpinionLeaderController.prototype.GetViewHTML = function (options) {

    options = util_extend({
        "ViewType": enCViewTypeKOL.None, "CssClass": "", "HTML": null, "IsScrollable": true, "HasExpandToggle": false, "HasRestoreInitialToggle": false,
        "IsDefaultFullscreen": false,
        "IsPopupMode": false, "IsDisableDismissButton": false, "SuffixDismissAllButtonText": null
    }, options);

    var _controller = this;
    var _ret = "";
    var _strAttr = "";

    if (options.ViewType == enCViewTypeKOL.Calendar) {
        options.HTML = util_forceString(options.HTML) + "<div " + util_renderAttribute("pluginEditor_calendar") + " />";
    }
    else if (options.ViewType == enCViewTypeKOL.ActivityDetails) {
        options.HTML = "   <div class='ListView' data-list-view-type='calendar_list_view' />";
    }
    else if (options.ViewType == enCViewTypeKOL.Chart) {
        options.HTML = "<div class='KOL_ChartView'>" +
                       "    <div class='Header'>" +
                       _controller.Utils.HTML.GetButton({
                           "CssClass": "LinkDisabled", "Content": "#", "Attributes": { "data-theme": "transparent", "data-corners": "false", "data-chart-mode-type": "num" }
                       }) +
                       _controller.Utils.HTML.GetButton({
                           "Content": "%", "Attributes": { "data-theme": "transparent", "data-corners": "false", "data-chart-mode-type": "pct" }
                       }) +
                       "    </div>" +
                       "</div>";

        _strAttr += util_htmlAttribute("data-chart-type", options["ChartType"]);
    }

    if (options.IsPopupMode) {
        options.HasExpandToggle = false;
        options.HasRestoreInitialToggle = false;
    }

    _ret += "<div tabindex='-1' class='EditorFixedViewContent PluginEditorCardView " + (options.IsScrollable ? "ScrollbarPrimary " : "") +
            (options.IsDefaultFullscreen ? "EditorFixedViewTransitionFullScreen " : "") + util_forceString(options.CssClass) +
            " EditorCardViewKOL' " + util_htmlAttribute("data-view-type", options.ViewType) + (_strAttr != "" ? " " + _strAttr : "") + ">" +
            (options.HasRestoreInitialToggle ? "<div class='LinkClickable ActionButtonResizeInitial EditorImageButton ImageResizeInitial' " +
                                               "data-attr-editor-controller-action-btn='resize_initial' " +
                                               util_htmlAttribute("title", _controller.Utils.LABELS.Minimize, null, true) + ">" +
                                               "   <div class='ImageIcon' />" +
                                               "</div>"
                                               : ""
            ) +
            (options.HasExpandToggle ? "<div class='LinkClickable ActionButtonResize EditorImageButton ImageExpandLight' data-attr-editor-controller-action-btn='resize' " +
                                       util_htmlAttribute("title", _controller.Utils.LABELS.Maximize, null, true) + ">" +
                                       "   <div class='ImageIcon' />" +
                                       "</div>"
                                     : ""
            ) +
            (
             options.IsPopupMode && !options.IsDisableDismissButton ?
             "<div class='ActionButton'>" +
             _controller.Utils.HTML.GetButton({
                 "CssClass": "ActionButtonStateDismissAll",
                 "ActionButtonID": "popup_dismiss_all", 
                 "Content": "Dismiss All" + (util_forceString(options["SuffixDismissAllButtonText"]) != "" ? " " + options.SuffixDismissAllButtonText : ""),
                 "Attributes": {
                     "data-icon": "delete", "data-iconpos": "right"
                 }
             }) +
             _controller.Utils.HTML.GetButton({
                 "ActionButtonID": "popup_dismiss", "Content": "Close",
                 "Attributes": {
                     "data-icon": "arrow-l", "data-iconpos": "right"
                 }
             }) +
             "</div>" :
             ""
            ) +
            util_forceString(options.HTML) +
            "</div>";

    return _ret;
};

CKeyOpinionLeaderController.prototype.GetEntityFieldHTML = function (options) {

    options = util_extend({
        "PropertyPath": null, "DataType": null, "IsRequired": false, "Title": null, "HasCustomLabel": false, "CssClass": null,
        "FieldItem": null, "IsInputModeOnly": false, "IsSummaryModeOnly": false, "TitleHTML": null,
        "Attributes": {}, "InputAttributes": {}, "LabelAttributes": {}
    }, options);

    var _controller = this;
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

    if (!options.IsInputModeOnly) {
        _ret += "   <div class='ToggleView ViewSummary'>" +
                _controller.Utils.HTML.InputEditorDataType({ "DataType": enCEEditorDataType.Label, "ReadOnlyDataType": options.DataType, "Attributes": options.LabelAttributes }) +
                "   </div>";
    }

    if (!options.IsSummaryModeOnly) {

        _ret += "   <div class='ToggleView ViewInput" + (options.DataType == enCEEditorDataType.Date ? " InputDatePicker" : "") + "'>" +
                (options.IsInputModeOnly ? util_forceString(options.TitleHTML) : "") +
                _controller.Utils.HTML.InputEditorDataType({
                    "DataType": options.DataType, "Attributes": options.InputAttributes, "IsRequired": options.IsRequired, "IsDatePickerRenderer": true,
                    "FieldItem": options.FieldItem
                }) +
                "   </div>";
    }

    _ret += "</div>";

    return _ret;
};

CKeyOpinionLeaderController.prototype.GetRenderOptionTableHTML = function (options) {

    options = util_extend({ "List": null, "IsSummaryView": false, "Attributes": {} }, options);

    var _ret = "";
    var _controller = this;

    var _list = (options.List || []);
    var _attr = "";
    var _isSummaryView = util_forceBool(options.IsSummaryView, false);

    if (options.Attributes) {
        for (var _name in options.Attributes) {
            _attr += " " + util_htmlAttribute(_name, options.Attributes[_name]);
        }
    }

    _ret += "<table data-role='none' class='TableRenderFieldListView' border='0' cellpadding='3' cellspacing='0'" + (_attr != "" ? " " + _attr : "") + ">" +
            "   <tbody>";

    for (var i = 0; i < _list.length; i++) {
        var _field = _list[i];
        var _isDivider = _field[enColCEditorRenderFieldProperty.IsDivider];
        var _required = _field[enColCEditorRenderFieldProperty.IsRequired];
        var _fieldOptions = _field[enColCEditorRenderFieldProperty.Options];
        var _internalID = _field["_id"];

        _ret += "<tr " + util_htmlAttribute("data-attr-render-field-id", _internalID) + ">";

        if (_isDivider) {
            _ret += "<td class='Divider' colspan='2'>" +
                    "   <div />" +
                    "</td>";
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

            _ret += "<td valign='top' class='Heading'>" +
                    "   <div class='Label'>" +
                    util_htmlEncode(_field[enColCEditorRenderFieldProperty.Title], true) +
                    (!_isSummaryView && _required ? "<span class='LabelRequired'>*</span>" : "") +
                    "   </div>" +
                    "</td>" +
                    "<td valign='top'>" +
                    (_hasPropertyPath ?
                     _controller.GetEntityFieldHTML({
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
                    ) +
                    "</td>";
        }

        _ret += "</tr>";
    }

    _ret += "   </tbody>" +
            "</table>";

    return _ret;
};

CKeyOpinionLeaderController.prototype.GetSearchListViewEditor = function (options) {

    var _controller = this;
    var _ret = "";

    options = util_extend({
        "EntityType": null, "ListViewID": null, "Attributes": {},
        "IsEntitySummaryView": false, "ServiceParamViewType": null, "ServiceFilterIDProperty": null
    }, options);

    var _attr = util_htmlAttribute("data-entity-type", options.EntityType) + " " +
                util_htmlAttribute("data-is-entity-summary-view-mode", options.IsEntitySummaryView ? enCETriState.Yes : enCETriState.No);

    if (options.IsEntitySummaryView) {
        options.Attributes = (options.Attributes || {});
        options.Attributes["data-entity-summary-view-type"] = options.ServiceParamViewType;
        options.Attributes["data-entity-summary-view-id-property"] = options.ServiceFilterIDProperty;
    }

    if (options.Attributes) {
        for (var _name in options.Attributes) {
            _attr += " " + util_htmlAttribute(_name, options.Attributes[_name]);
        }
    }

    _ret += "<div class='SearchListViewEditor' " + _attr + ">";

    _ret += "   <div class='R1C1'>" +
            "       <div class='SearchableView'>" +
            "           <input type='text' data-corners='false' data-mini='true' maxlength='1000' " + util_htmlAttribute("placeholder", "Search", null, true) + " />" +
            "           <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' " +
            "data-iconpos='notext' title='Clear' />" +
            "       </div>" +
            "   </div>" +
            "   <div class='R1C2'>" +
            "       <select data-corners='false' data-corners='false' data-mini='true' />" +
            "   </div>";

    _ret += "   <div class='ListView ToggleView ViewSummary' " + util_htmlAttribute("data-list-view-type", "searchViewEditor") + " />";

    var _fields = null;
    var _viewGroup = options["GroupID"];
    var _viewMode = options["ContentViewModeID"];

    if (util_forceString(options.EntityType) != "") {
        var _arr = options.EntityType.split("|");

        _fields = [];

        for (var i = 0; i < _arr.length; i++) {

            var _val = null;

            switch (_arr[i]) {

                case "KOL":

                    if (_viewGroup == _controller.Data.ID.EventActivity && _viewMode == enCContentViewModeKOL.Event) {
                        _val = "%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsSearchListViewEntities|{ EntityType: \"KOL_Event\" }%%";
                    }
                    else if (_viewGroup == _controller.Data.ID.EventActivity && _viewMode == enCContentViewModeKOL.Activity) {
                        _val = "%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsSearchListViewEntities|{ EntityType: \"KOL_Activity\" }%%";
                    }

                    break;  //end: KOL

                case "Resource":

                    if (_viewGroup == _controller.Data.ID.KOL) {
                        _val = "%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsSearchListViewEntities|{ EntityType: \"Resource_KOL\" }%%";
                    }
                    else if (_viewGroup == _controller.Data.ID.EventActivity && _viewMode == enCContentViewModeKOL.Event) {
                        _val = "%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsSearchListViewEntities|{ EntityType: \"Resource_Event\" }%%";
                    }
                    else if (_viewGroup == _controller.Data.ID.EventActivity && _viewMode == enCContentViewModeKOL.Activity) {
                        _val = "%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsSearchListViewEntities|{ EntityType: \"Resource_Activity\" }%%";
                    }

                    break;  //end: Resource

                case "Activity":

                    if (_viewGroup == _controller.Data.ID.KOL) {
                        _val = "%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsSearchListViewEntities|{ EntityType: \"Activity_KOL\" }%%";
                    }
                    else if (_viewGroup == _controller.Data.ID.EventActivity && _viewMode == enCContentViewModeKOL.Event) {
                        _val = "%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsSearchListViewEntities|{ EntityType: \"Event_Activity\" }%%";
                    }

                    break;  //end: Activity

                case "Event":

                    if (_viewGroup == _controller.Data.ID.KOL) {
                        _val = "%%TOK|ROUTE|PluginEditor|KOL_RenderOptionsSearchListViewEntities|{ EntityType: \"Event_KOL\" }%%";
                    }

                    break;  //end: Event
            }

            if (_val) {
                _fields = $.merge(_fields, _val);
            }
        }
    }

    if (_fields) {

        var _showDividers = (_fields.length > 1);

        for (var f = 0; f < _fields.length; f++) {

            var _field = _fields[f];
            var _dataType = _field[enColCEditorRenderFieldProperty.EditorDataTypeID];
            var _fieldOptions = _field[enColCEditorRenderFieldProperty.Options];

            _controller.InitRenderField(_field);

            //TODO refactor?
            if (_viewGroup != _controller.Data.ID.KOL &&
                _dataType == enCEEditorDataType.Listbox && _fieldOptions && _fieldOptions["IsListBoxPopupMode"] == true &&
                (_fieldOptions["InstanceType"] == "CEKeyOpinionLeaderActivity" || _fieldOptions["InstanceType"] == ["CEKeyOpinionLeaderEvent"]) && _field["_fieldItem"]) {

                var _fieldItem = _field["_fieldItem"];
                var _renderList = _fieldItem["_renderList"];

                var _propertyID = null;
                var _propertyIDName = null;

                switch (_fieldOptions["InstanceType"]) {

                    case "CEKeyOpinionLeaderActivity":
                        _propertyID = enColKeyOpinionLeaderActivityProperty.KeyOpinionLeaderID;
                        _propertyIDName = enColKeyOpinionLeaderActivityProperty.KeyOpinionLeaderIDName;
                        break;

                    case "CEKeyOpinionLeaderEvent":
                        _propertyID = enColKeyOpinionLeaderEventProperty.KeyOpinionLeaderID;
                        _propertyIDName = enColKeyOpinionLeaderEventProperty.KeyOpinionLeaderIDName;
                        break;
                }

                _renderList["GetLabelContentHTML"] = function (opts) {
                    var _kolBridgeItem = opts.Item;
                    var _name = _kolBridgeItem[_propertyIDName];
                    var _id = _kolBridgeItem[_propertyID];
                    var _html = "";

                    _html += "<div class='ProfileListItemKOL'>" +
                             "  <div class='EditorImageButton ImageUserProfile'>" +
                             "      <div class='ImageIcon' " +
                                         util_htmlAttribute("style", "background-image: url('" + _controller.Utils.ConstructKeyOpinionLeaderProfileURL({ "ID": _id }) + "')") +
                                         "  />" +
                             "  </div>" +
                             "  <div class='Label'>" + util_htmlEncode(_name) + "</div>" +
                             "</div>";

                    return _html;
                };
            }

            var _internalID = _field["_id"];
            var _titleHTML = "";

            if (_showDividers) {
                _titleHTML += "<div class='Title'>" + util_htmlEncode(_field[enColCEditorRenderFieldProperty.Title]) + "</div>";
            }

            var _itemAttributes = util_extend({}, (_fieldOptions ? _fieldOptions["Attributes"] : null));

            _itemAttributes["data-attr-render-field-id"] = _internalID;

            _ret += _controller.GetEntityFieldHTML({
                "PropertyPath": _field[enColCEditorRenderFieldProperty.PropertyPath],
                "DataType": _field[enColCEditorRenderFieldProperty.EditorDataTypeID],
                "Title": _field[enColCEditorRenderFieldProperty.Title],
                "FieldItem": _field["_fieldItem"],
                "Attributes": _itemAttributes,
                "IsInputModeOnly": true,
                "TitleHTML": _titleHTML
            });

        }
    }

    _ret += "</div>";

    return _ret;
};

CKeyOpinionLeaderController.prototype.GetBridgeEntityPropertyMappings = function (options) {

    options = util_extend({ "BridgeEntityTypeID": null }, options);

    var _ret = {};

    switch (options.BridgeEntityTypeID) {

        case "Resource_KOL":

            _ret[enColRepositoryResourceKeyOpinionLeaderProperty.ResourceDocumentTypeID] = enColRepositoryResourceProperty.DocumentTypeID;
            _ret[enColRepositoryResourceKeyOpinionLeaderProperty.ResourceIDName] = enColRepositoryResourceProperty.Name;
            _ret["_transaction"] = {
                "PropertyPath": enColCERepositoryResourceProperty.ResourceKeyOpinionLeaders,
                "PropertyPathTransactionID": enColRepositoryResourceKeyOpinionLeaderProperty.TransactionID
            };

            break;

        case "Resource_Activity":

            _ret[enColRepositoryResourceActivityProperty.ResourceDocumentTypeID] = enColRepositoryResourceProperty.DocumentTypeID;
            _ret[enColRepositoryResourceActivityProperty.ResourceIDName] = enColRepositoryResourceProperty.Name;
            _ret["_transaction"] = {
                "PropertyPath": enColCERepositoryResourceProperty.ResourceActivities,
                "PropertyPathTransactionID": enColRepositoryResourceActivityProperty.TransactionID
            };

            break;

        case "Resource_Event":

            _ret[enColRepositoryResourceEventProperty.ResourceDocumentTypeID] = enColRepositoryResourceProperty.DocumentTypeID;
            _ret[enColRepositoryResourceEventProperty.ResourceIDName] = enColRepositoryResourceProperty.Name;
            _ret["_transaction"] = {
                "PropertyPath": enColCERepositoryResourceProperty.ResourceEvents,
                "PropertyPathTransactionID": enColRepositoryResourceEventProperty.TransactionID
            };

            break;
    }

    return _ret;
};

CKeyOpinionLeaderController.prototype.DataItemBind = function (options) {

    var _controller = this;

    options = util_extend({
        "Context": null, "DataItem": null, "FilterSelector": null, "Callback": null, "IsPopulate": false, "IsValidate": false, "IsRefreshFilters": false,
        "IsSelectiveUpdate": false, "IsClearEntityCache": false
    }, options);

    var $container = $(options.Context);

    if ($container.length == 0) {
        $container = _controller.ActiveGroupContainer();
    }

    var $list = $container.find(".PropertyView");
    var _dataItem = options.DataItem;
    var _ret = { "DataItem": null, "Errors": [] };
    var _populate = options.IsPopulate;
    var _validate = options.IsValidate;

    var _callback = function () {

        if (!_populate) {
            _controller.DOM.ToggleIndicator(false);
        }

        if (options.Callback) {
            options.Callback(_ret);
        }
    };

    if (!_dataItem) {
        _dataItem = $container.data(_controller.KeyEditDataItem());
    }
    else {
        $container.data(_controller.KeyEditDataItem(), _dataItem); //update the context data item for the view
    }

    _ret.DataItem = _dataItem;

    //apply filter for property views, if applicable
    if (util_forceString(options.FilterSelector) != "") {
        $list = $list.filter(options.FilterSelector);
    }

    var _queue = new CEventQueue();

    if (!_populate) {
        _controller.DOM.ToggleIndicator(true);

        _queue.Add(function (onCallback) {

            var _fields = options["FieldList"];

            if (!_fields) {

                switch (_controller.ActiveGroupID()) {

                    case _controller.Data.ID.KOL:
                        _fields = _controller.Data.RenderOptionDetailViewKOL;
                        break;

                    case _controller.Data.ID.EventActivity:

                        var _viewMode = _controller.ActiveContentViewModeID();

                        if (_viewMode == enCContentViewModeKOL.Event) {
                            _fields = _controller.Data.RenderOptionDetailViewEvent;
                        }
                        else if (_viewMode == enCContentViewModeKOL.Activity) {
                            _fields = _controller.Data.RenderOptionDetailViewActivity;
                        }
                        else {
                            _fields = [];
                        }

                        break;

                    default:
                        _fields = [];
                        break;
                }
            }

            var _opts = {
                "Controller": _controller,
                "ActiveGroupID": _controller.ActiveGroupID(),
                "List": _fields,
                "OnSetFieldListData": function (opts) {

                    opts = util_extend({ "FieldID": enCE.None, "Data": null, "InstanceType": null, "PropertyText": null, "PropertyValue": null }, opts);

                    var _search = util_arrFilter(this.List, enColCEditorRenderFieldProperty.FieldID, opts.FieldID, true);

                    if (_search.length == 1) {
                        _search = _search[0];

                        var _fieldItem = _search["_fieldItem"];

                        if (!_fieldItem) {
                            _fieldItem = {};
                            _search["_fieldItem"] = _fieldItem;
                        }

                        var _renderList = _fieldItem["_renderList"];

                        if (!_renderList) {
                            _renderList = {
                                "InstanceType": null,
                                "PropertyText": null,
                                "PropertyValue": null,
                                "Data": null
                            };

                            _fieldItem["_renderList"] = _renderList;
                        }

                        //set render list metadata values, if specified
                        if (opts.InstanceType) {
                            _renderList.InstanceType = opts.InstanceType;
                        }

                        if (opts.PropertyText) {
                            _renderList.PropertyText = opts.PropertyText;
                        }

                        if (opts.PropertyValue) {
                            _renderList.PropertyValue = opts.PropertyValue;
                        }

                        _renderList.Data = (opts.Data || _renderList.Data);
                    }
                    else {
                        _search = null;
                    }

                    return _search;
                }, "Callback": onCallback
            };

            _controller.ProjectOnPopulateFieldListData(_opts);
        });
    }

    _queue.Add(function (onCallback) {

        $.each($list, function () {
            var $this = $(this);
            var $vwList = $this.data("Views");
            var _propertyPath = $this.attr("data-attr-prop-path");

            if (!$vwList || $vwList.length == 0) {
                $vwList = $this.find("[" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "][data-attr-input-data-type]");
                $this.data("Views", $vwList);
            }

            $.each($vwList, function () {
                var $input = $(this);

                if (_populate) {

                    //populate input to the data item (disregard label data types)
                    var _editorDataTypeID = util_forceInt($input.attr("data-attr-input-data-type"), enCE.None);

                    if (_editorDataTypeID != enCEEditorDataType.Label) {
                        var _handled = false;

                        var _value = _controller.Utils.Actions.InputEditorDataType({
                            "Controller": _controller, "Element": $input,
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
                            util_propertySetValue(_dataItem, _propertyPath, _value);
                        }

                        if (_validate) {
                            var _isRequired = (util_forceInt($input.attr("data-attr-input-is-required"), enCETriState.None) == enCETriState.Yes);

                            if (_isRequired && !$input.data("is-valid")) {

                                var _fieldTitle = $input.attr("data-field-title");

                                if (util_forceString(_fieldTitle, "") == "") {
                                    _fieldTitle = "Field";
                                }

                                _ret.Errors.push(_fieldTitle + " is required.");
                            }
                        }
                    }
                }
                else {

                    var _field = $input.data("Field");

                    if (!_field) {
                        var _fieldID = util_forceInt($mobileUtil.GetClosestAttributeValue($input, "data-attr-render-field-id"), enCE.None);

                        _field = _controller.Data.LookupRenderField[_fieldID];

                        _field = (_field || {});
                        $input.data("Field", _field);
                    }

                    //bind the data item property to the input element
                    _controller.Utils.Actions.InputEditorDataType({
                        "Controller": _controller, "IsGetValue": false, "Element": $input, "DataItem": _dataItem, "PropertyPath": _propertyPath,
                        "FieldItem": (_field ? _field["_fieldItem"] : null),
                        "IsSelectiveUpdate": options.IsSelectiveUpdate
                    });
                }
            });
        });

        //custom group validation support
        if (_populate) {
            var _fnValidateForm = $container.data("OnValidateForm");

            if (_fnValidateForm) {
                _fnValidateForm.call(this, { "List": $list, "DataItem": _dataItem, "Result": _ret });
            }
        }

        onCallback();
    });

    if (!_populate && options.IsRefreshFilters) {
        _queue.Add(function (onCallback) {
            _controller.BindFilters({ "IsDependencyTrigger": true, "ToggleIndicator": false, "Callback": onCallback });
        });
    }

    _queue.Run({
        "Callback": function () {

            if (options["IsAddNewTrigger"]) {
                $container.find("[" + util_renderAttribute("datepickerV2") + "]")
                          .trigger("events.datepicker_init", { "IsReloadState": true });
            }

            var _fnOnDataBind = $container.data("OnDataBind");

            if (_fnOnDataBind) {
                _fnOnDataBind({ "Item": _dataItem, "IsClearEntityCache": options.IsClearEntityCache, "IsAddNewTrigger": options["IsAddNewTrigger"] });
            }

            _callback();
        }
    });
};

CKeyOpinionLeaderController.prototype.SetPropertyViewEditMode = function (isEditable, validateEditItemExists) {
    var _controller = this;
    var $element = _controller.ActiveGroupContainer();
    var $list = $element.find(".PropertyView, .SearchListViewEditor, .ViewEditStateBase");

    isEditable = util_forceBool(isEditable, false);
    validateEditItemExists = util_forceBool(validateEditItemExists, false);

    $list.toggleClass("EditModeOn", isEditable);

    $list.filter(".SearchListViewEditor")
         .trigger("events.onSearchListEditorSetEditable", { "IsEditable": isEditable });

    //toggle the navigation tab view based on editable state
    _controller.DOM.View.trigger("events.toggleHeaderTabViewState", { "IsEnabled": !isEditable });

    var $vwList = _controller.FindActiveGroupViewTypes({ "ViewType": [enCViewTypeKOL.ListView] });

    $vwList.toggleClass("DisableInteractiveEvents", isEditable);

    //toggle the filters
    var $vwFilters = _controller.FindActiveGroupViewTypes({ "ViewType": [enCViewTypeKOL.PrimaryFilters, enCViewTypeKOL.SecondaryFilters] });
    var $filterElements = $vwFilters.find(".Filter");

    $filterElements.find("select[data-role!='none']").selectmenu(isEditable ? "disable" : "enable");

    var $inputs = $vwFilters.find("input[type='text']");    //need to do it on the top parent level (since it may not be a Filter based view)

    $inputs.filter("[data-role!='none']").textinput(isEditable ? "disable" : "enable");
    $inputs.filter("[data-role='none']").prop("disabled", isEditable);

    $filterElements.trigger("events.filter_onToggleEditableMode", { "IsEditable": isEditable });

    var _fn = $element.data("OnSetPropertyViewEditMode");

    if (_fn) {
        _fn.call(_controller, isEditable, validateEditItemExists);
    }
};

CKeyOpinionLeaderController.prototype.ShowEntityDetailsPopup = function (options) {

    var _controller = this;

    options = util_extend({
        "Trigger": null, "DataAttributeID": "data-attr-item-id", "Item": null, "Callback": null, "IsForceTriggerClickEvent": false,
        "RenderContainer": null, "RenderTitleElement": null, "IsDisableAnimation": false
    }, options);

    var _callback = function () {
        if (options.Callback) {
            options.Callback();
        }
    };

    var $trigger = $(options.Trigger);
    var _itemID = null;
    var _entityType = null;

    if (options.Item) {

        var _viewEntityType = null;
        var _item = options.Item;

        _itemID = _item[enColCEntitySummaryBaseProperty.EntityID];

        switch (_item[enColCEntitySummaryBaseProperty.EntityTypeID]) {

            case enCEntitySummaryBaseTypeKOL.KOL:
                _entityType = "KOL";
                break;

            case enCEntitySummaryBaseTypeKOL.Event:
                _entityType = "Event";
                break;

            case enCEntitySummaryBaseTypeKOL.Activity:
                _entityType = "Activity";
                break;

            case enCEntitySummaryBaseTypeKOL.Resource:
                _entityType = "Resource";
                break;
        }
    }
    else {
        _itemID = $mobileUtil.GetClosestAttributeValue($trigger, options.DataAttributeID);
        _entityType = $mobileUtil.GetClosestAttributeValue($trigger, "data-view-entity-type");
    }

    var $temp = $(_controller.Utils.HTML.GetButton({
        "ActionButtonID": "entity_details_view", "Attributes": {
            "data-attr-item-id": _itemID,
            "data-view-entity-type": _entityType,
            "data-is-disable-animation": (options.IsDisableAnimation ? enCETriState.Yes : enCETriState.None)
        }
    }));

    $temp.hide()
         .insertAfter($trigger);

    $temp.data("TriggerElement", $trigger);

    if (options["TriggerController"]) {
        $temp.data("TriggerController", options.TriggerController);
    }

    if (options.IsForceTriggerClickEvent) {
        var _opts = { "Controller": _controller, "ButtonID": "entity_details_view", "Trigger": $temp, "Callback": _callback };

        $temp.data("RenderContainer", options.RenderContainer)
             .data("RenderTitleElement", options.RenderTitleElement);

        _controller.OnButtonClick(_opts);
    }
    else {

        $temp.trigger("click", {
            "Callback": function () {
                $temp.remove();
                _callback();
            }
        });
    }
};

CKeyOpinionLeaderController.prototype.NavigateToScreen = function (options) {
    var _controller = this;

    options = util_extend({
        "GroupID": null,
        "ViewMode": null,
        "DataItem": null,
        "ItemID": null,
        "IsEditMode": false,
        "Placeholder": null,
        "Callback": null
    }, options);

    var _queue = new CEventQueue();

    var _currentViewGroup = _controller.ActiveGroupID();
    var _currentContentViewMode = _controller.ActiveContentViewModeID();

    //check if navigation, if applicable
    var _hasUpdatedGroup = (util_forceString(options.GroupID) != "" && _currentViewGroup != options.GroupID);
    var _hasUpdatedContentViewMode = (util_forceString(options.ViewMode) != "" && _currentContentViewMode != options.ViewMode);

    if (_hasUpdatedGroup || _hasUpdatedContentViewMode) {

        if (_hasUpdatedGroup) {
            var $tab = _controller.DOM.GroupTabs.filter("[" + util_htmlAttribute("data-group-id", options.GroupID) + "]:not(.Selected):first");

            if ($tab.length == 1) {
                _queue.Add(function (onCallback) {
                    $tab.trigger("click.onTabItemClick", {
                        "Callback": function () {
                            onCallback();
                        }
                    });
                });
            }
        }

        if (_hasUpdatedContentViewMode) {
            _queue.Add(function (onCallback) {
                _controller.SetActiveGroupContentViewMode({ "ViewMode": options.ViewMode, "IsRefreshFilterEntityType": true, "Callback": onCallback });
            });
        }
    }

    var $vwNavigationOverlay = _controller.DOM.View.children(".EditorKOLNavigationOverlay:first");

    $vwNavigationOverlay.empty();

    if (options.Placeholder) {
        $vwNavigationOverlay.append($(options.Placeholder))
                            .trigger("create");
    }

    $vwNavigationOverlay.append("<div class='LabelMessage'>" + 
                                "<i class='material-icons'>info</i>" + "<div class='Label'>" + util_htmlEncode("Loading") + "</div>" +
                                "</div>" +
                                "<div class='EditorAbsorbView' />");

    _controller.DOM.View.addClass("EditorKOLViewNavigationStateOn");

    _queue.Run({
        "Callback": function () {

            var _fn = function () {
                _controller.DOM.View.removeClass("EditorKOLViewNavigationStateOn");
                $vwNavigationOverlay.empty();

                if (!_controller.EditItemIsExistEntity()) {

                    //handle the case where the item is no longer available
                    setTimeout(function () {
                        AddMessage("The item is invalid or no longer exists.", null, null, { "IsTimeout": true });
                    }, 100);
                }

                if (options["Callback"]) {
                    options.Callback();
                }
            };

            //process edit mode, if requested
            if (options.IsEditMode) {
                _controller.ActiveGroupContainer()
                           .trigger("events.onViewSetEditItem", { "ItemID": options.ItemID, "Item": options.DataItem, "Callback": _fn });
            }
            else {
                _fn();
            }
        }
    });
};

CKeyOpinionLeaderController.prototype.GetChartOptions = function (options) {

    var _controller = this;

    options = util_extend({ "Target": null, "Element": null, "Data": null }, options);

    var _ret = null;
    var $vwChart = $(options.Element);
    var _chartType = $vwChart.attr("data-chart-type");
    var _primaryChartColor = "%%TOK|ROUTE|PluginEditor|KeyOpinionLeaderChartColor|{\"IsPrimary\": true}%%";
    var _secondaryChartColor = "%%TOK|ROUTE|PluginEditor|KeyOpinionLeaderChartColor|{\"IsPrimary\": false}%%";
    var _viewMode = {};

    $vwChart.trigger("events.getChartViewMode", _viewMode);

    _viewMode = _viewMode.Result;

    var _defaultOptions = {
        chart: {
        },
        title: {
            text: null
        },
        xAxis: {
            categories: []
        },
        yAxis: {
            title: {
                text: null
            }
        },
        legend: {
            enabled: false
        },
        tooltip: {
            enabled: false
        },
        plotOptions: {},
        series: [],
        exporting: {
            enabled: false
        },
        credits: {
            enabled: false
        }
    };

    var _data = options.Data;

    switch (_chartType) {

        case "DevelopmentGoal":

            _data = util_extend({ "Num": 0, "Total": 0 }, _data);

            if (_viewMode == "num") {

                //column
                _ret = {
                    chart: {
                        type: "column"
                    },
                    title: {
                        text: "Number of KOLs with Development Goals"
                    },
                    xAxis: {
                        categories: ["KOL"]
                    },
                    yAxis: {
                        min: 0,
                        allowDecimals: false
                    },
                    series: [{ data: [_data.Num], color: _primaryChartColor }]
                };
            }
            else if (_viewMode == "pct") {

                var _pctHasGoals = (_data.Total > 0 ? (_data.Num / _data.Total * 1.00) * 100.00 : 0);
                var _pctWithoutGoals = (_data.Total > 0 ? 100.00 - _pctHasGoals : 0);

                //pie
                _ret = {
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        type: 'pie'
                    },
                    title: {
                        text: "KOL Development Goals"
                    },
                    tooltip: {
                        enabled: true,
                        pointFormat: '<b>{point.percentage:.1f}%</b>'
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: false,
                            dataLabels: {
                                enabled: false,
                                format: '{point.name}: <b>{point.percentage:.1f}</b>%',
                                style: {
                                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                }
                            }
                        }
                    },
                    series: [{
                        name: 'KOLs with Development Goals',
                        colorByPoint: true,
                        data: [{
                            name: 'With Development Goals',
                            y: _pctHasGoals,
                            color: _primaryChartColor
                        }, {
                            name: 'Without Development Goals',
                            y: _pctWithoutGoals,
                            color: _secondaryChartColor
                        }]
                    }]
                };
            }

            break;
    }

    var _chartOptions = util_extend(_defaultOptions, _ret, true, true);

    return _chartOptions;
};

var CKeyOpinionLeaderUserSearchControl = function (opts) {

    var _instance = this;
    var _controller = opts.Controller;

    var _readOnly = opts.IsReadOnly;
    var _item = opts.Item;
    var _value = (_item ? _item[enColKeyOpinionLeaderProperty.CompanyUserDisplayName] : null);
    var $element = $(opts.Target);

    var _html = "";

    if (util_forceString(_value) == "") {
        _value = "Not Available";
    }

    _html += "<div class='Label'>" + util_htmlEncode(_value) + "</div>" +
             (_readOnly || !_controller.CanAdmin() ? 
              "" :
              _controller.Utils.HTML.GetButton({
                  "ActionButtonID": "popup_kol_userSearch", "Content": "Edit",
                  "Attributes": { "data-icon": "search", "style": "margin-left: 0em;" }
              })
             );

    $element.html(_html)
            .trigger("create")
            .data("value", opts.Value);

    $element.off("events.userControl_getValue");
    $element.on("events.userControl_getValue", function (e, args) {
        var _companyUserID = util_forceInt($element.data("value"), enCE.None);

        if (_companyUserID == enCE.None) {
            _companyUserID = null;
        }

        args.ItemValue = _companyUserID;
        args.HasValidValue = (_companyUserID != null);
    });
};

//SECTION START: project specific support

CKeyOpinionLeaderController.prototype.ProjectOnPopulateFieldListData = function (options) {

    options = util_extend({
        "List": [], "OnSetFieldListData": function (opts) { }, "Callback": null
    }, options);

    if (options.Callback) {
        options.Callback();
    }
};

CKeyOpinionLeaderController.prototype.ProjectOnPopulateFilter = function (options) {

    options = util_extend({ "Element": null, "FilterGroup": null, "IsPrimary": null, "Callback": null }, options);

    if (options.Callback) {
        options.Callback();
    }
};

//SECTION END: project specific support

RENDERER_LOOKUP["pluginEditor_listToggle"] = function (context, options) {

    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_listToggle");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.data("is-init-list-toggle")) {
            $element.data("is-init-list-toggle", true);

            $element.off("events.onListToggleRender");
            $element.on("events.onListToggleRender", function (e, args) {

                args = util_extend({ "Data": [] }, args);

                var _data = (args.Data || []);

                var _html = "";
                var _selections = {};

                $.each($element.children(".OptionItem.Selected[list-option-value]"), function () {
                    var $this = $(this);
                    var _value = $this.attr("list-option-value");

                    _selections[_value] = true;
                });

                for (var i = 0; i < _data.length; i++) {
                    var _item = util_extend({ "Content": null, "Value": null, "IsHTML": false, "IsSelected": false, "Tooltip": null }, _data[i]);
                    var _selected = (_item.IsSelected || (_selections[_item.Value + ""] ? true : false));
                    var _hasTooltip = (util_forceString(_item.Tooltip) != "");

                    _html += "<div class='OptionItem" + (_hasTooltip ? " OptionItemTooltipModeOn" : "") + (_selected ? " Selected" : "") + "' " +
                             util_htmlAttribute("list-option-value", _item.Value) + ">" +
                             "  <div class='EditorImageButton ImageToggleSelection'>" +
                             "      <div class='ImageIcon' />" +
                             "  </div>" +
                             "  <div class='Title'>" +
                             "      <div class='Label'>" + (_item.IsHTML ? util_forceString(_item.Content) : util_htmlEncode(_item.Content)) + "</div>" +
                             "  </div>" +
                             (_hasTooltip ?
                              "<a data-role='button' data-inline='true' data-iconpos='notext' data-icon='info' data-theme='transparent' " +
                              util_htmlAttribute("title", _item.Tooltip, null, true) + "></a>" :
                              ""
                             ) +
                             "</div>";
                }

                $element.addClass("DisableUserSelectable CListViewToggles")
                        .html(_html)
                        .trigger("create");
            });

            var _fnOnListToggleClick = function () {
                var $this = $(this);

                $this.toggleClass("Selected");
                $element.trigger("change.onFilterUpdate");
            };

            $element.off("click.onListToggle");
            $element.on("click.onListToggle", ".OptionItem[list-option-value]", _fnOnListToggleClick);

            $element.off("events.onListToggleEditable");
            $element.on("events.onListToggleEditable", function (e, args) {

                args = util_extend({ "IsEditable": true }, args);

                $element.toggleClass("EditableStateOff", args.IsEditable);

                $element.off("click.onListToggle");

                if (!args.IsEditable) {
                    $element.on("click.onListToggle", ".OptionItem[list-option-value]", _fnOnListToggleClick);
                }
            });

            $element.off("events.getListToggleSelections");
            $element.on("events.getListToggleSelections", function (e, args) {
                var _values = [];

                var $list = $element.find(".OptionItem.Selected[list-option-value]");

                $.each($list, function () {
                    _values.push($(this).attr("list-option-value"));
                });

                args["Result"] = _values;
            });

            var $options = $element.children("option");
            var _data = [];

            $.each($options, function () {
                var $this = $(this);
                var _item = {
                    "Content": $this.html(),
                    "Value": $this.val(),
                    "IsHTML": true,
                    "IsSelected": ($this.attr("selected") == "selected"),
                    "Tooltip": util_forceString($this.attr("title"))
                };

                _data.push(_item);
            });

            $element.trigger("events.onListToggleRender", { "Data": _data });
        }
    });
};

RENDERER_LOOKUP["pluginEditor_calendar"] = function (context, options) {

    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_calendar");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.data("is-calendar-init")) {
            $element.data("is-calendar-init", true);

            var _html = "";
            var _now = new Date();
            var _currentYear = _now.getFullYear();
            var _offsetRange = 5;
            var _months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            var _dayOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

            $element.off("events.calendar_getYearOptionHTML");
            $element.on("events.calendar_getYearOptionHTML", function (e, args) {

                var _yearHTML = "";
                var _year = util_forceInt(args["Year"], 0);
                var _selectedYear = util_forceInt(args["SelectedValue"], 0);

                if (_year <= 0) {
                    _year = _currentYear;
                }

                if (_selectedYear < 0) {
                    _selectedYear = _year;
                }

                for (var y = _year - _offsetRange; y <= _year + _offsetRange; y++) {
                    _yearHTML += "<option value='" + y + "'" + (_selectedYear == y ? " selected='selected'" :"") + ">" + y + "</option>";
                }

                args["Result"] = _yearHTML;

            }); //end: events.calendar_getYearOptionHTML

            var _yearOptions = {};

            $element.trigger("events.calendar_getYearOptionHTML", _yearOptions);

            _html += "<div class='Header'>" +
                     "  <select data-view-id='ddlYear' data-mini='true' data-corners='false' data-inline='true'>" + _yearOptions.Result + "</select>" +
                     "</div>";

            //month details
            _html += "<div class='Content'>";

            for (var m = 0; m < _months.length; m++) {
                _html += "<div class='DetailMonth' " + util_htmlAttribute("data-calendar-month", m + 1) + ">" +
                         "  <div class='Title'>" +
                         "      <div class='Label'>" + util_htmlEncode(_months[m]) + "</div>" +
                         "  </div>";

                _html += "  <div class='Heading'>";

                for (var day = 0; day < _dayOfWeek.length; day++) {
                    _html += "<div class='CellView'>" +
                             "  <div class='Label'>" + util_htmlEncode(_dayOfWeek[day]) + "</div>" +
                             "</div>";
                }

                _html += "  </div>";

                _html += "  <div class='MonthDaysView'>";

                for (var d = 1; d <= 31; d++) {
                    _html += "<div class='CellView DayDetail DayDetail_" + d + "' " + util_htmlAttribute("data-calendar-day", d) + ">" +
                             " <div class='Label'>" + "<span>" + d + "</span>" + "</div>" +
                             "</div>";

                    if (d % 7 == 0) {
                        _html += "<div class='Divider' />";
                    }
                }

                _html += "  </div>";

                _html += "</div>";
            }

            _html += "</div>";

            $element.html(_html)
                    .trigger("create");

            var $ddlYear = $element.find("select[data-view-id='ddlYear']");

            $mobileUtil.SetDropdownListValue($ddlYear, _currentYear);

            $ddlYear.off("change.calendarYearFilter");
            $ddlYear.on("change.calendarYearFilter", function (e, args) {
                var _temp = {
                    "Year": $ddlYear.val(),
                    "SelectedValue": null
                };

                _temp.SelectedValue = _temp.Year;

                $element.trigger("events.calendar_getYearOptionHTML", _temp);

                $ddlYear.html(_temp.Result);

                $element.trigger("events.calendarRefresh", { "IsYearUpdate": true })
                        .trigger("events.onCalendarRefreshData");

            }); //end: change.calendarYearFilter

            $element.off("events.calendarRefresh");
            $element.on("events.calendarRefresh", function (e, args) {

                args = util_extend({ "IsYearUpdate": true, "IsForceUpdate": false, "List": null }, args);

                var _selectedYear = util_forceInt($ddlYear.val());

                var _now = new Date();
                var _nowYear = _now.getFullYear();
                var _nowMonth = (_now.getMonth() + 1);
                var _nowDateValue = _now.getDate();

                var $months = $element.data("ElementMonths");

                if (!$months || $months.length == 0) {
                    $months = $element.find(".DetailMonth[data-calendar-month]");
                    $element.data("ElementMonths", $months);
                }

                //update the calendar month views, if applicable
                if (args.IsYearUpdate) {
                    var $today = null;

                    if (_selectedYear == _nowYear) {
                        $today = $months.filter("[" + util_htmlAttribute("data-calendar-month", _nowMonth) + "]")
                                        .find(".DayDetail_" + _nowDateValue);

                        $today.addClass("Today");
                    }

                    var $prevToday = $element.find(".DayDetail.Today");

                    $today = $($today);

                    $prevToday.not($today).removeClass("Today");

                    $.each($months, function () {
                        var $month = $(this);
                        var _monthIndex = util_forceInt($month.attr("data-calendar-month")) - 1;
                        var _firstDate = new Date(_selectedYear, _monthIndex, 1);
                        var _lastDate = new Date(_selectedYear, _monthIndex + 1, 0);    //last day of the current month
                        var _firstDayWeekIndex = _firstDate.getDay();   //note: returns Sun = 0, Mon = 1, etc.

                        var _maxDate = _lastDate.getDate();
                        var _selectorHidden = "";

                        var $dates = $month.data("ElementDates");
                        var $monthDatesView = $month.data("ElementMonthDaysView");

                        if (!$dates || $dates.length == 0) {
                            $dates = $month.find(".DayDetail");
                            $month.data("ElementDates", $dates);
                        }

                        if (!$monthDatesView || $monthDatesView.length == 0) {
                            $monthDatesView = $month.children(".MonthDaysView");
                            $month.data("ElementMonthDaysView", $monthDatesView);
                        }

                        for (var d = _maxDate + 1; d <= 31; d++) {
                            _selectorHidden += (_selectorHidden != "" ? "," : "") + ".DayDetail_" + d;
                        }

                        var $currentHidden = $dates.filter(".EditorElementHidden");
                        var $hiddenDates = null;

                        if (_selectorHidden != "") {
                            $hiddenDates = $dates.filter(_selectorHidden);
                        }

                        $hiddenDates = $($hiddenDates);
                        $currentHidden.not($hiddenDates).removeClass("EditorElementHidden");
                        $hiddenDates.addClass("EditorElementHidden");

                        $month.find(".DayDetailPlaceholder, .Divider").remove();

                        var _placeholderHTML = "";

                        //set previous month placeholder dates
                        var _prevMonthDate = new Date(_firstDate);
                        _prevMonthDate.setDate(0);    //last day of the previous month

                        for (var p = 0; p <= _firstDayWeekIndex - 1; p++) {
                            _placeholderHTML = "<div class='CellView DayDetailPlaceholder'>" +
                                               "   <div class='Label'>" + "<span>" + _prevMonthDate.getDate() + "</span>" + "</div>" +
                                               "</div>" + _placeholderHTML;

                            _prevMonthDate.setDate(_prevMonthDate.getDate() - 1);
                        }

                        $monthDatesView.prepend(_placeholderHTML);

                        //set next month placeholder dates
                        var _nextMonthDate = new Date(_lastDate);
                        _nextMonthDate.setDate(_lastDate.getDate() + 1);    //first day of the next month

                        _placeholderHTML = "";

                        for (var p = 0; p < (_dayOfWeek.length - _lastDate.getDay() - 1) && p >= 0; p++) {
                            _placeholderHTML += "<div class='CellView DayDetailPlaceholder'>" +
                                                "   <div class='Label'>" + "<span>" + _nextMonthDate.getDate() + "</span>" + "</div>" +
                                                "</div>";

                            _nextMonthDate.setDate(_nextMonthDate.getDate() + 1);
                        }

                        $monthDatesView.append(_placeholderHTML);

                        var $list = $monthDatesView.children(".CellView:not(.EditorElementHidden)");

                        $.each($list, function (index) {
                            if (index > 0 && index % 7 == 0) {
                                $("<div class='Divider' />").insertBefore(this);
                            }
                        });
                    });
                }

                //bind the selected dates
                var _list = (args.List || []);
                var _lookup = {};

                //create lookup of date range conditions and list items by month for current year
                var _dtFirstYearDate = new Date(_selectedYear, 0, 1);
                var _dtMaxYearDate = new Date(_selectedYear, 12, 0);

                _dtFirstYearDate.setHours(0, 0, 0, 0);
                _dtFirstYearDate = _dtFirstYearDate.getTime();

                _dtMaxYearDate.setHours(0, 0, 0, 0);
                _dtMaxYearDate = _dtMaxYearDate.getTime();

                for (var i = 0; i < _list.length; i++) {
                    var _calendarItem = _list[i];
                    var _startDate = _calendarItem[enColCEntityCalendarSummaryBaseProperty.StartDate];
                    var _endDate = _calendarItem[enColCEntityCalendarSummaryBaseProperty.EndDate];

                    //restrict to valid date range
                    if (_startDate && _endDate) {

                        var _dtStart = _startDate.getTime();
                        var _dtEnd = _endDate.getTime();

                        var _fnAddMonthEntry = function (monthIndex, isFirstDateMonthStart) {
                            var _key = monthIndex;

                            //add the condition criteria and associated item
                            var _valueList = _lookup[_key];
                            var _start = _dtStart;

                            if (!_valueList) {
                                _valueList = [];
                                _lookup[_key] = _valueList;
                            }

                            if (isFirstDateMonthStart) {
                                _start = new Date(_selectedYear, monthIndex, 1);
                                _start.setHours(0, 0, 0, 0);
                                _start = _start.getTime();
                            }

                            _valueList.push({ "Start": _start, "End": _dtEnd, "Item": _calendarItem });
                        };

                        //check if the start and end date are the same
                        if (_dtStart == _dtEnd) {
                            _fnAddMonthEntry(_startDate.getMonth());
                        }
                        else if (_dtStart < _dtEnd) {

                            //start and end date span multiple months, so iterate through the months (max to be last month of current year)
                            var _current = new Date(_startDate.getTime());
                            var _isFirstMonthDefault = false;

                            //check if the start date is before the first date of the current year
                            if (_current.getTime() < _dtFirstYearDate) {

                                //set the month to the first month
                                _current.setMonth(0);
                                _isFirstMonthDefault = true;
                            }

                            _current.setDate(1);

                            //set the current date to be the selected year (in case the condition is from an extended date range which includes the current year)
                            _current.setYear(_selectedYear);

                            while (_current.getTime() <= _dtEnd && _current.getTime() <= _dtMaxYearDate) {
                                _fnAddMonthEntry(_current.getMonth(), _isFirstMonthDefault);
                                _current.setMonth(_current.getMonth() + 1);
                            }
                        }
                    }
                }

                //remove previous highlighted dates
                $months.find(".DayDetail.HighlightOn")
                       .removeClass("HighlightOn HighlightPrimary");

                ////var _perfStart = new Date();

                //loop through the required months and configure the highlights
                $.each($months, function () {

                    var $month = $(this);
                    var _monthIndex = util_forceInt($month.attr("data-calendar-month")) - 1;

                    var _dtFirstDate = (new Date(_selectedYear, _monthIndex, 1)).getTime();
                    var _dtLastDate = (new Date(_selectedYear, _monthIndex + 1, 0)).getTime();    //last day of the current month

                    var _current = new Date(_dtFirstDate);
                    var _dtCurrent = _current.getTime();

                    var _searchList = (_lookup[_monthIndex] || []);
                    var _selector = "";
                    var _selectorHighlightPrimary = "";

                    while (_dtCurrent <= _dtLastDate) {

                        var _found = false;
                        var _foundHighlight = false;

                        for (var i = 0; i < _searchList.length; i++) {
                            var _search = _searchList[i];

                            if (_dtCurrent >= _search.Start && _dtCurrent <= _search.End) {
                                _found = true;

                                //check if the item requires a highlight primary
                                var _calendarItem = _search.Item;

                                if (_calendarItem[enColCEntityCalendarSummaryBaseProperty.IsEntityAssociation]) {
                                    _foundHighlight = true;
                                }
                            }

                            if (_found && _foundHighlight) {
                                break;
                            }
                        }

                        if (_found) {
                            _selector += (_selector != "" ? "," : "") + ".DayDetail_" + (_current.getDate());
                        }

                        if (_foundHighlight) {
                            _selectorHighlightPrimary += (_selectorHighlightPrimary != "" ? "," : "") + ".DayDetail_" + (_current.getDate());
                        }

                        _current.setDate(_current.getDate() + 1);
                        _dtCurrent = _current.getTime();
                    }

                    var $dates = $month.data("ElementDates");

                    if (!$dates || $dates.length == 0) {
                        $dates = $month.find(".DayDetail");
                        $month.data("ElementDates", $dates);
                    }

                    $dates.filter(_selector).addClass("HighlightOn")
                          .filter(_selectorHighlightPrimary).addClass("HighlightPrimary");

                    $month.data("DataList", _searchList);
                });

                ////console.log("Duration", (new Date()).getTime() - _perfStart.getTime());

            }); //end: events.calendarRefresh

            $element.off("events.calendarGetYear");
            $element.on("events.calendarGetYear", function(e, args){
                args["Result"] = util_forceInt($ddlYear.val());
            });

            $element.off("click.calendarOnDateView");
            $element.on("click.calendarOnDateView",
                        ".DetailMonth[data-calendar-month] > .MonthDaysView > .DayDetail.HighlightOn[data-calendar-day]:not(.LinkDisabled)", function (e, args) {

                args = util_extend({ "Callback": null }, args);

                var $this = $(this);
                var $month = $this.closest(".DetailMonth");
                var _monthIndex = util_forceInt($month.attr("data-calendar-month"), 0) - 1;
                var _day = util_forceInt($this.attr("data-calendar-day"), 0);
                var _year = {};

                $this.addClass("LinkDisabled");

                $element.trigger("events.calendarGetYear", _year);

                _year = _year.Result;

                var _date = new Date(_year, _monthIndex, _day);

                _date.setHours(0, 0, 0, 0);

                $element.trigger("events.onCalendarViewDate", {
                    "Trigger": $this, "Parent": $month, "MonthIndex": _monthIndex, "Day": _day, "Date": _date,
                    "Callback": function () {
                        $this.removeClass("LinkDisabled");

                        if (args.Callback) {
                            args.Callback();
                        }
                    }
                });
            });

            $element.data("DropdownYear", $ddlYear)
                    .addClass("DisableUserSelectable EditorCalendar");

            $element.trigger("events.calendarRefresh");
        }
    });
};