var CEvidenceRoadmapController = function (initOpts) {
    var _instance = this;

    initOpts = util_extend({ "IsDisableExtControllerInit": false }, initOpts);

    _instance["DOM"] = {
        "Element": null,
        "Container": null,
        "Search": null,
        "HomeDropdownSort": null,
        "HomeToggleSortDirections": null,
        "HomeLabelResultCount": null,
        "HomeButtonGroupToggles": null
    };

    var _utils = pluginEditor_getUtils();

    _instance["Utils"] = util_extend({
        "ContextClassificationID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-classification-id"), enCE.None);
        },
        "ContextEditorGroupComponentID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-component-id"), enCE.None);
        },
        "ContextEditorGroupPlatformID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-platform-id"), enCE.None);
        },

        "GetCurrentViewEntityTypeName": function () {
            return "Study";
        },
        "GetSearchHighlightEncoder": function (options) {

            options = util_extend({ "SearchOptions": null, "FallbackDefault": true }, options);

            var _ret = null;

            if (_instance.DOM.Search) {

                //get an instance of the highlight encoder
                var _args = { "Search": null };

                if (options.SearchOptions) {
                    _args.Search = options.SearchOptions["Query"];
                }
                else {
                    _args.Search = _instance.DOM.Search.val();
                }

                _instance.DOM.Search.trigger("events.searchable_getHighlightEncoder", _args);

                _ret = _args["Result"];
            }

            if (!_ret && options.FallbackDefault) {
                _ret = util_htmlEncode;
            }

            return _ret;
        }
    }, _utils);

    _instance["Data"] = {
        "DATA_KEY_LOOKUP_SCROLL_STATE": "LookupScrollState",
        "DATA_KEY_SCROLL_TOP": "restore-scroll-top-popup-roadmap-v2",
        "SETTING_KEY_HOME_VIEW": "home",

        "FROM_CONTEXT": {
            "ListView": "list_view",
            "ExportPopup": "export_selections"
        },

        "ListViewRenderOptions": "%%TOK|ROUTE|PluginEditor|StudyRenderOptionsListView%%",
        "HomeRenderOptions": "%%TOK|ROUTE|PluginEditor|StudyRenderOptionsHomeView%%",
        "RepositoryResourceController": (initOpts.IsDisableExtControllerInit ? null : new CRepositoryController()), //requires: the repository resource related definition as well
        "KeyOpinionLeaderController": (initOpts.IsDisableExtControllerInit ?
                                       null :
                                       new CKeyOpinionLeaderController()
                                      ), //requires: the KOL related definition as well

        "MiscellaneousClassificationID": util_forceInt("%%TOK|ROUTE|PluginEditor|MiscellaneousClassificationID%%", enCE.None),
        "MiscellaneousPlatformID": util_forceInt("%%TOK|ROUTE|PluginEditor|MiscellaneousPlatformID%%", enCE.None),
        "KOL_ManagerComponentID": util_forceInt("%%TOK|ROUTE|PluginEditor|KOL_ManagerComponentID%%", enCE.None),
        "RepositoryComponentLibraryID": util_forceInt("%%TOK|ROUTE|PluginEditor|RepositoryComponentLibraryID%%", enCE.None),

        "Fields": null,
        "LabelAddItem": "Add Study",
        "LabelEditItem": "Edit Study",

        "NoRecordsMessage": "There are no records found matching the search criteria.",

        //lazy load
        "PropertyFields": null,
        "HomeViewUserSettings": {
            "DataItem": null,
            "Current": {
                "home_sort_column": null, "home_sort_direction": null,

                //lookup of filter group toggle states (on/off)
                "LookupFilterGroupToggle": {}
            }
        }
    };

    _instance.Data.ListViewRenderOptions = (_instance.Data.ListViewRenderOptions || {});

    _instance.Data.HomeRenderOptions = util_extend({
        "Groups": null, "PropertyText": "Text", "PropertyValue": "Value",
        "GroupCountPerRow": 5,
        "GroupToggleSettingTitle": "Toggle groups to show:",
        "Detail": {
            "IconTitle": "chevron_right",
            "IconSubtitle": "chevron_right",
            "IconSubtitleTooltip": "",
            "LineItemFields": []  //list of additional fields to show for the card view of each object format: { "PropertyPath", "Tooltip", "Icon" }
        },
        "SortOptions": {
            "List": null,
            "IsDefaultSortASC": true,
            "HasDefault": true
        }
    }, _instance.Data.HomeRenderOptions, true, true);

    _instance.Data.HomeRenderOptions.Groups = (_instance.Data.HomeRenderOptions.Groups || []);
    _instance.Data.HomeRenderOptions.Detail.LineItemFields = (_instance.Data.HomeRenderOptions.Detail.LineItemFields || []);

    //initialize the line item fields with defaults
    var _lineItemFields = _instance.Data.HomeRenderOptions.Detail.LineItemFields;

    for (var f = 0; f < _lineItemFields.length; f++) {
        var _field = util_extend({ "PropertyPath": null, "Tooltip": "", "Icon": "chevron_right" }, _lineItemFields[f]);

        _lineItemFields[f] = _field;
    }
    
    _instance["State"] = {

        "Filters": function (options) {

            options = util_extend({ "From": null, "Callback": null }, options);

            var _ret = {
                "ClassificationID": _instance.Utils.ContextClassificationID(_instance.DOM.Element),
                "ComponentID": _instance.Utils.ContextEditorGroupComponentID(_instance.DOM.Element),
                "FilterSelections": null,
                "Lookup": {
                    "CanAdmin": (_instance.CanAdminView() ? enCETriState.Yes : enCETriState.No)
                }
            };

            _instance.DOM.Element.trigger("events.getComponentUserPermission", {
                "Callback": function (permissionSummary) {

                    _instance.DOM.Element.trigger("events.getLayoutManager", {
                        "Callback": function (layoutManager) {

                            var _filterSelections = layoutManager.FilterSelections();

                            _ret.FilterSelections = _filterSelections;
                            _ret.Lookup["PlatformID"] = util_forceInt(_filterSelections.GetFilterValue("platform"), enCE.None);
                            _ret.Lookup["Search"] = (_instance.DOM.Search ? _instance.DOM.Search.val() : null);

                            _instance.ProjectOnConfigureMethodParamState({
                                "From": options.From,
                                "PlatformComponentPermissions": $.merge([], _instance.State.PlatformComponentPermissions),
                                "State": _ret,
                                "Callback": function () {
                                    if (options.Callback) {
                                        options.Callback(_ret);
                                    }
                                }
                            });
                        }
                    }); //end: layout manager
                }

            }); //end: component permission summary

        },

        //lazy load
        "PlatformComponentPermissions": null,
        "KOL_PlatformComponentPermission": null,

        "CanAdminRepositoryResource": function (options) {

            options = util_extend({ "ResourceID": null, "Callback": function (canAdmin) { } }, options);

            var _callback = function (result, disableOwnerCheck) {

                result = util_forceBool(result, false);

                if (!disableOwnerCheck && !result) {

                    //user does not have admin access, so check if user is the owner of the resource (in which can override to edit it)
                    _instance.Data.RepositoryResourceController.IsResourceOwnerByID({
                        "ResourceID": options.ResourceID, "Callback": function (isOwner) {
                            isOwner = util_forceBool(isOwner, false);

                            if (options.Callback) {
                                options.Callback(isOwner);
                            }
                        }
                    });
                }
                else if (options.Callback) {
                    options.Callback(result);
                }

            };  //end: _callback

            //ensure the current view is edit mode (i.e. cannot edit the repository resource in view mode)
            if (_instance.IsContentEditView()) {

                if (_instance.CanAdminView()) {

                    //user has admin access to current module, so can also edit the resource
                    _callback(true);
                }
                else if (_instance.Data.MiscellaneousClassificationID != enCE.None && _instance.Data.MiscellaneousPlatformID != enCE.None &&
                         _instance.Data.RepositoryComponentLibraryID != enCE.None) {

                    //retrieve the repository resource library component user permission (as current user does not have Administrator role on active component)
                    _instance.DOM.Element.trigger("events.getComponentUserPermission", {
                        "OverrideClassificationID": _instance.Data.MiscellaneousClassificationID,
                        "OverridePlatformID": _instance.Data.MiscellaneousPlatformID,
                        "OverrideComponentID": _instance.Data.RepositoryComponentLibraryID,
                        "Callback": function (repPermSummary) {

                            var _canAdmin = false;

                            //user does not have access to module, so match the role to be that of the Evidence Roadmap permission
                            if (!repPermSummary || !(repPermSummary["Permission"]) || repPermSummary.Permission["IsActive"] == false) {
                                _canAdmin = false;
                            }
                            else {
                                _canAdmin = util_forceBool(repPermSummary ? repPermSummary.CanAdmin : null, false);
                            }

                            _callback(_canAdmin);
                        }
                    });
                }
            }
            else {
                _callback(false, true);
            }
        },

        "LoadUserSettings": function (callback) {

            _instance.Utils.Events.UserClassificationComponentSetting({
                "Element": _instance.DOM.Element,
                "Name": _instance.Data.SETTING_KEY_HOME_VIEW,
                "Callback": function (data) {

                    _instance.Data.HomeViewUserSettings.DataItem = data;

                    var _opts = null;

                    if (_instance.Data.HomeViewUserSettings.DataItem) {

                        try {
                            _opts = util_parse(_instance.Data.HomeViewUserSettings.DataItem[enColUserClassificationComponentSettingProperty.JSON]);
                        } catch (e) {
                            _opts = null;
                        }
                    }

                    _instance.Data.HomeViewUserSettings.Current = util_extend(_instance.Data.HomeViewUserSettings.Current, _opts, true, true);

                    if (callback) {
                        callback();
                    }
                }
            });
        },

        "SaveUserSettings": function (callback) {
            var _homeUserSetting = _instance.Data.HomeViewUserSettings.DataItem;

            _instance.Utils.Events.SetUserClassificationComponentSetting({
                "Element": _instance.DOM.Element,
                "Name": _instance.Data.SETTING_KEY_HOME_VIEW,
                "JSON": _instance.Data.HomeViewUserSettings.Current,
                "Item": _instance.Data.HomeViewUserSettings.DataItem,
                "Callback": function (data) {

                    _instance.Data.HomeViewUserSettings.DataItem = data;

                    if (callback) {
                        callback();
                    }
                }
            });
        }
    };

    _instance["PluginInstance"] = null;
};

CEvidenceRoadmapController.prototype.Bind = function (options, callback) {

    var _callback = function () {

        if (callback) {
            callback();
        }
    };

    options = util_extend({
        "PluginInstance": null, "LayoutManager": null, "Element": null, "IsRefresh": false,
        "HtmlTemplates": {
        },
        "AnimationCallback": null
    }, options);

    var _pluginInstance = options.PluginInstance;
    var _controller = this;

    var $element = $(options.Element);
    var _queue = new CEventQueue();

    if ($element.length == 0) {
        $element = $(_controller.DOM.Element);
    }

    if (!_pluginInstance) {
        _pluginInstance = _controller.PluginInstance;
    }

    var $vw = $element.children(".CEditorEvidenceRoadmap");

    if (!options.LayoutManager) {
        _queue.Add(function (onCallback) {
            $element.trigger("events.getLayoutManager", {
                "Callback": function (result) {
                    options.LayoutManager = result;
                    onCallback();
                }
            });
        });
    }

    if ($vw.length == 0) {

        var _html = "";
        var _renderOptionsHome = _controller.Data.HomeRenderOptions;
        var _hasDropdownSort = (_renderOptionsHome.SortOptions && _renderOptionsHome.SortOptions.List && _renderOptionsHome.SortOptions.List.length > 0);

        _html += "<div class='CViewController CEditorEvidenceRoadmap' " + util_renderAttribute("pluginEditor_fileDisclaimer") + " style='display: none;'>" +
                 "  <div class='Content'>";

        if (_hasDropdownSort) {
            _html += "<div class='ViewHeadingSortOptions'>";   //open tag #1
        }        

        _html += "      <div class='SearchableView EditorSearchableView PluginEditorCardView'>" +
                 "          <input data-view-id='search' type='text' maxlength='1000' data-role='none' placeholder='Search...' />" +
                 "          <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' " +
                 "data-iconpos='notext' title='Clear' />" +
                 "      </div>";

        if (_hasDropdownSort) {
            _html += "<div class='Divider' />";
            _html += "<div class='DisableUserSelectable EditorElementDropdown ViewExtendedSettings'>" +
                     "<select data-view-id='home_sort_column' data-corners='false' data-mini='true' data-corners='false' />" +
                     "<i class='LinkClickable material-icons' data-view-id='home_sort_direction' " + util_htmlAttribute("data-is-asc", enCETriState.Yes) +
                     " title='Sort Ascending'>arrow_upward</i>" +
                     "<i class='LinkClickable material-icons' data-view-id='home_sort_direction' " + util_htmlAttribute("data-is-asc", enCETriState.No) +
                     " title='Sort Descending'>arrow_downward</i>" +
                     "<i class='LinkClickable material-icons' title='Settings' " +
                     util_htmlAttribute("data-attr-editor-controller-action-btn", "ext_settings") + ">more_vert</i>" +
                     "</div>";

            _html += "</div>";  //close tag #1
        }

        _html += "      <div class='BannerBubbleView'>" +
                 _controller.Utils.HTML.GetButton({
                     "ActionButtonID": "ext_open_group_toggles", "Content": "Groups", "Attributes": {
                         "data-icon": "gear", "style": "display: none;"
                     }
                 }) +
                 "          <div class='LabelResultCount'>" +
                 "              <div>" + "<span>" + util_htmlEncode("Results: 0") + "</span>" + "</div>" +
                 "          </div>" +
                 "      </div>";

        _html += "      <div class='SummaryView LayoutDefault'>"; //open summary tab

        for (var i = 0; i < _renderOptionsHome.Groups.length; i++) {
            var _group = _renderOptionsHome.Groups[i];
            var _groupID = util_propertyValue(_group, _renderOptionsHome.PropertyValue);
            var _title = util_propertyValue(_group, _renderOptionsHome.PropertyText);

            _html += "<div class='Group StateLoadingOn' " + util_htmlAttribute("data-group-id", _groupID) + ">" +
                     "  <div class='DisableUserSelectable ProjectThemeSecondaryColor Title'>" +
                     "      <div class='ProjectThemePrimaryColor Icon'>" + "<i class='material-icons'>library_books</i>" + "</div>" +
                     "      <div class='Label'>" +
                     "          <div>" + "<span>" + util_htmlEncode(_title, true) + "</span>" + "</div>" +
                     "      </div>" +
                     "  </div>" +
                     "  <div class='DisableUserSelectable Badge'>" + "<span>0</span>" + "</div>" +
                     "  <div class='Content'>" +
                     "      <div class='ListView' />" +
                     "      <div class='DisableUserSelectable LoadingView' title='Loading...'>" + "<i class='material-icons'>hourglass_empty</i>" + "</div>" +
                     "  </div>" +
                     "</div>";
        }

        _html += "      </div>" + //close summary tag
                 "      <div class='BannerBubbleView BannerListView'>" +
                 _controller.Utils.HTML.GetButton({
                     "ActionButtonID": "export_popup", "Content": "Export Report", "Attributes": { "data-icon": "arrow-r" }
                 }) +
                 "          <div class='LabelResultCount'>" +
                 "              <div>" + "<span>" + util_htmlEncode("Results: 0") + "</span>" + "</div>" +
                 "          </div>" +
                 "      </div>" +
                 "      <div class='ListView' />" +
                 "  </div>" +   //close content tag
                 "</div>";

        $element.html(_html);
        $mobileUtil.refresh($element);

        $vw = $element.children(".CEditorEvidenceRoadmap");
        
        _controller.DOM.Element = $element;
        _controller.DOM.Container = $vw;
        _controller.PluginInstance = _pluginInstance;
        _controller.DOM.HomeDropdownSort = (_hasDropdownSort ? _controller.DOM.Container.find("select[data-view-id='home_sort_column']") : null);
        _controller.DOM.HomeToggleSortDirections = (_hasDropdownSort ? _controller.DOM.Container.find("[data-view-id='home_sort_direction'][data-is-asc]") : null);
        _controller.DOM.HomeLabelResultCount = _controller.DOM.Container.find(".BannerBubbleView:not(.BannerListView) > .LabelResultCount > div > span");
        _controller.DOM.HomeButtonGroupToggles = _controller.DOM.Container.find("[data-attr-editor-controller-action-btn='ext_open_group_toggles']");

        _controller.DOM.Element.data("OnNavigateBackRequest", function (request) {

            var _handled = true;

            //check if it is currently in edit mode
            if (_controller.IsContentDetailScreen()) {
                _controller.OnProcessBackNavigation();
            }
            else {
                _handled = false;
            }

            if (_handled) {
                request.IsHandled = true;
            }
        });

        //configure search view
        _controller.DOM.Search = $element.find("input[type='text'][data-view-id='search']:first");

        _controller.DOM.Search.attr(DATA_ATTRIBUTE_RENDER, "searchable_field")
                              .data("SearchConfiguration", {
                                  "SearchableParent": _controller.DOM.Search.closest(".SearchableView"),
                                  "OnRenderResult": function (result, opts) {
                                  },
                                  "OnSearch": function (opts, callback) {
                                      var _key = (new Date()).getTime() + "_" + util_forceString(opts.Query);

                                      _controller.BindSummaryView({
                                          "RenderKey": _key,
                                          "SearchOptions": opts,
                                          "Callback": function () {
                                              callback({ "Key": _key });
                                          }
                                      });
                                  }
                              });

        $mobileUtil.RenderRefresh(_controller.DOM.Search, true);

        //load the user settings
        _queue.Add(function (onCallback) {
            _controller.State.LoadUserSettings(onCallback);
        });

        if (_hasDropdownSort) {

            //bind the sort dropdown options and state
            _queue.Add(function (onCallback) {

                var _isSortASC = util_forceBool(_renderOptionsHome.SortOptions["IsDefaultSortASC"], true);
                var _selectedValue = null;
                var _temp = null;

                //restore sort column, if applicable
                _temp = _controller.Data.HomeViewUserSettings.Current["home_sort_column"];

                if (!util_isNullOrUndefined(_temp)) {
                    var _search = util_arrFilter(_renderOptionsHome.SortOptions.List, "Value", _temp, true);

                    if (_search.length == 1) {
                        _selectedValue = _temp;
                    }
                    else {
                        delete _controller.Data.HomeViewUserSettings.Current["home_sort_column"];
                    }
                }

                //restore sort direction, if applicable
                _temp = _controller.Data.HomeViewUserSettings.Current["home_sort_direction"];

                if (!util_isNullOrUndefined(_temp)) {
                    _isSortASC = util_forceBool(_temp, _isSortASC);
                }

                util_dataBindDDL(_controller.DOM.HomeDropdownSort, _renderOptionsHome.SortOptions.List, "Text", "Value", _selectedValue,
                                 util_forceBool(_renderOptionsHome.SortOptions["HasDefault"], true), enCE.None, "");

                $.each(_controller.DOM.HomeToggleSortDirections, function () {
                    var $this = $(this);
                    var _isDirectionASC = (util_forceInt($this.attr("data-is-asc"), enCETriState.No) == enCETriState.Yes);
                    var _enabled = false;

                    if (_isSortASC && _isDirectionASC) {
                        _enabled = true;
                    }
                    else if (!_isSortASC && !_isDirectionASC) {
                        _enabled = true;
                    }

                    $this.toggleClass("LinkDisabled", _enabled)
                         .toggleClass("StateOn", _enabled);
                });

                _controller.DOM.HomeDropdownSort.off("change.moduleEVR_onSort");
                _controller.DOM.HomeDropdownSort.on("change.moduleEVR_onSort", function () {

                    var $ddl = $(this);
                    var _sortField = $ddl.val();

                    _controller.Data.HomeViewUserSettings.Current["home_sort_column"] = _sortField;

                    _controller.State.SaveUserSettings(function () {
                        _controller.BindSummaryView();
                    });

                }); //end: change.moduleEVR_onSort

                var $vwSettingExt = _controller.DOM.Container.find(".ViewHeadingSortOptions .ViewExtendedSettings:first");

                $vwSettingExt.off("click.moduleEVR_onSortDirection");
                $vwSettingExt.on("click.moduleEVR_onSortDirection", ".LinkClickable[data-view-id='home_sort_direction']:not(.LinkDisabled)", function () {
                    var $this = $(this);
                    var _isASC = (util_forceInt($this.attr("data-is-asc"), enCETriState.No) == enCETriState.Yes);

                    _controller.DOM.HomeToggleSortDirections.not($this).removeClass("LinkDisabled StateOn");
                    $this.addClass("LinkDisabled StateOn");

                    _controller.Data.HomeViewUserSettings.Current["home_sort_direction"] = _isASC;

                    _controller.State.SaveUserSettings(function () {
                        _controller.BindSummaryView();
                });

                }); //end: click.moduleEVR_onSortDirection

                onCallback();
            });
        }

        //render the extended settings for filter group toggles
        _queue.Add(function (onCallback) {

            var _renderOptionsHome = _controller.Data.HomeRenderOptions;
            var _renderGroups = _renderOptionsHome.Groups;
            var _lookupFilterGroupToggle = _controller.Data.HomeViewUserSettings.Current["LookupFilterGroupToggle"];

            var $vwSortOptions = _controller.DOM.Container.find(".ViewHeadingSortOptions");

            //remove previous entries, if applicable
            $vwSortOptions.children(".ViewExtendedSettingContent").remove();

            var _html = "<div class='ViewExtendedSettingContent'>";

            _html += "  <div class='Section'>" +    //open section tag #1
                     "      <div class='Title'>" + "<span>" + util_htmlEncode(_renderOptionsHome["GroupToggleSettingTitle"]) + "</span>" + "</div>" +
                     "      <div class='Selections'>";

            if (!_lookupFilterGroupToggle) {
                _lookupFilterGroupToggle = {};
            }

            for (var g = 0; g < _renderGroups.length; g++) {
                var _group = _renderGroups[g];
                var _groupID = util_propertyValue(_group, _renderOptionsHome.PropertyValue);
                var _title = util_propertyValue(_group, _renderOptionsHome.PropertyText);
                var _selected = true;
                var _toggle = _lookupFilterGroupToggle[_groupID];

                if (!util_isNullOrUndefined(_toggle)) {
                    _selected = util_forceBool(_toggle, true);
                }
                
                _html += "<div class='DisableUserSelectable ToggleGroupSetting" + (_selected ? " Selected" : "") + "' " +
                         util_htmlAttribute("data-filter-group-id", _groupID) + ">" +
                         "  <div class='EditorImageButton ImageToggleSelection" + (_selected ? " StateOn" : "") + "'>" +
                         "      <div class='ImageIcon' />" +
                         "  </div>" +
                         "  <div class='Label'>" + util_htmlEncode(_title) + "</div>" +
                         "</div>";
            }

            _html += "      </div>" +
                     "  </div>";    //close section tag #1

            _html += "</div>";

            var $vw = $(_html);

            $vw.hide();
            $vwSortOptions.append($vw);

            $mobileUtil.refresh($vw);

            var $groupToggles = $vwSortOptions.find(".ViewExtendedSettingContent .Selections > .ToggleGroupSetting[data-filter-group-id]");

            $vw.off("events.refreshLabelButtonGroupToggles");
            $vw.on("events.refreshLabelButtonGroupToggles", function () {
                var _length = $groupToggles.filter(".Selected").length;
                var _label = "Groups: " + util_formatNumber(_length) + " of " + util_formatNumber($groupToggles.length);

                $mobileUtil.ButtonSetTextByElement(_controller.DOM.HomeButtonGroupToggles, _label);
                _controller.DOM.HomeButtonGroupToggles.toggle(_length != $groupToggles.length);

            }); //end: events.refreshLabelButtonGroupToggles

            $vw.trigger("events.refreshLabelButtonGroupToggles");

            $vw.off("click.onToggleItem");
            $vw.on("click.onToggleItem", ".Selections > .ToggleGroupSetting[data-filter-group-id]:not(.LinkDisabled)", function () {

                var $this = $(this);
                var _groupID = $this.attr("data-filter-group-id");
                var _onClickCallback = function () {
                    $this.removeClass("LinkDisabled");
                };

                $this.addClass("LinkDisabled");

                var _valid = true;

                if ($this.hasClass("Selected")) {

                    //check if there is at least one other group currently shown (i.e. cannot hide the last group)
                    _valid = ($groupToggles.not($this)
                                           .filter(".Selected").length > 0);
                }

                if (_valid) {

                    $this.toggleClass("Selected");

                    var _selected = $this.hasClass("Selected");

                    $this.children(".ImageToggleSelection")
                         .toggleClass("StateOn", _selected);

                    var _key = (new Date()).getTime() + "_" + _groupID;

                    var $element = _controller.DOM["SummaryView"];

                    if (!$element || $element.length == 0) {
                        var $content = _controller.DOM.Container.children(".Content:first");

                        $element = $content.children(".Content > .SummaryView");
                        _controller.DOM["SummaryView"] = $element;
                    }

                    //toggle the view group and update the label
                    var $group = $element.find(".Group[" + util_htmlAttribute("data-group-id", _groupID) + "]");

                    $vw.trigger("events.refreshLabelButtonGroupToggles");

                    $group.toggleClass("EditorElementHidden", !_selected);

                    var _lookupFilterGroupToggle = _controller.Data.HomeViewUserSettings.Current["LookupFilterGroupToggle"];

                    if (!_lookupFilterGroupToggle) {
                        _lookupFilterGroupToggle = {};
                        _controller.Data.HomeViewUserSettings.Current["LookupFilterGroupToggle"] = _lookupFilterGroupToggle;
                    }

                    if (_selected) {
                        delete _lookupFilterGroupToggle[_groupID];
                    }
                    else {
                        _lookupFilterGroupToggle[_groupID] = false;
                    }

                    _controller.State.SaveUserSettings(function () {
                        _controller.BindSummaryView({
                            "RenderKey": _key,
                            "Callback": _onClickCallback
                        });
                    });
                }
                else {
                    _onClickCallback();
                }

            }); //end: click.onToggleItem

            onCallback();

        }); //end: render extended settings for filter group toggles

        _queue.Add(function (onCallback) {

            //get permission summary of all platforms for this component (current classification)
            _controller.DOM.Element.trigger("events.getComponentUserPermission", {
                "IsContextFilter": false, "IsListFormat": true,
                "Callback": function (result) {

                    _controller.State.PlatformComponentPermissions = (result || []);
                    
                    _controller.DOM.Container.show();

                    onCallback();
                }
            });
        });

        _queue.Add(function (onCallback) {

            //get permission summary for the KOL Manager component
            _controller.State.KOL_PlatformComponentPermission = {}; //default empty state

            if (_controller.Data.MiscellaneousClassificationID != enCE.None && _controller.Data.MiscellaneousPlatformID != enCE.None &&
                _controller.Data.KOL_ManagerComponentID != enCE.None) {

                _controller.DOM.Element.trigger("events.getUserEffectiveComponentPermissionSummary", {
                    "ClassificationID": _controller.Data.MiscellaneousClassificationID,
                    "PlatformID": _controller.Data.MiscellaneousPlatformID,
                    "ComponentID": _controller.Data.KOL_ManagerComponentID,
                    "Callback": function (val) {

                        val = util_extend({ "Result": null }, val);

                        val.Result = (val.Result || []);

                        if (val.Result.length == 1) {
                            _controller.State.KOL_PlatformComponentPermission = val.Result[0];
                        }

                        onCallback();
                    }
                });
            }
            else {
                onCallback();
            }
        });
    }

    if (util_forceBool(_controller.DOM.Container.data("data-init-evidence-roadmap"), false) == false) {

        _queue.Add(function (onCallback) {

            _controller.DOM.Container.data("data-init-evidence-roadmap", true);

            var _fnViewKey = function () {
                return "View_Roadmap_Edit_" + _controller.IsContentDetailScreen();
            };

            _controller.DOM.Element.off("events.moduleEVR_saveScrollTop");
            _controller.DOM.Element.on("events.moduleEVR_saveScrollTop", function (e, args) {

                args = util_extend({ "ViewState": null, "TriggerListElement": null }, args);

                var _lookup = _controller.DOM.Element.data(_controller.Data.DATA_KEY_LOOKUP_SCROLL_STATE);

                if (!_lookup) {
                    _lookup = {};
                    _controller.DOM.Element.data(_controller.Data.DATA_KEY_LOOKUP_SCROLL_STATE, _lookup);
                }

                var _key = _fnViewKey();

                //if a trigger element from list view context is provided, configure its view state (used for highlight effect on return navigation)
                if (args.TriggerListElement != null) {
                    var $trigger = $(args.TriggerListElement);
                    var $item = $trigger.closest("[data-item-id]");

                    args.ViewState = util_extend({}, args.ViewState);

                    args.ViewState["ListViewID"] = $trigger.closest("[" + util_renderAttribute("data_admin_list") + "]")
                                                           .attr("id");

                    args.ViewState["ItemID"] = $item.attr("data-item-id");
                    args.ViewState["IsSummaryDetail"] = $item.hasClass("Detail");
                }

                _lookup[_key] = { "ScrollTop": $(window).scrollTop(), "ViewState": args.ViewState };

            }); //end: events.moduleEVR_saveScrollTop

            _controller.DOM.Element.off("events.moduleEVR_restoreScrollTop");
            _controller.DOM.Element.on("events.moduleEVR_restoreScrollTop", function () {
                var _lookup = _controller.DOM.Element.data(_controller.Data.DATA_KEY_LOOKUP_SCROLL_STATE);
                var _key = _fnViewKey();

                if (_lookup && util_isNullOrUndefined(_lookup[_key]) == false) {
                    var _entry = _lookup[_key];
                    var _scrollTop = util_forceFloat(_entry["ScrollTop"], 0);

                    var _viewState = util_extend({ "ListViewID": null, "ItemID": null, "IsSummaryDetail": false }, _entry["ViewState"]);

                    delete _lookup[_key];

                    var _fn = function () {

                        var $search = null;

                        //check if a list view related view state is available for highlight effect
                        if (util_forceString(_viewState.ListViewID) != "" && util_forceString(_viewState.ItemID) != "") {
                            $search = _controller.DOM.Container.find("[" + util_htmlAttribute("id", _viewState.ListViewID) + "] .CRepeater " +
                                                                     "[" + util_htmlAttribute("data-item-id", _viewState.ItemID) + "]:first");
                        }
                        else if (_viewState.IsSummaryDetail && util_forceInt(_viewState.ItemID, enCE.None) != enCE.None) {

                            //summary view related view state is available for highlight effect
                            $search = _controller.DOM.Container.find(".SummaryView:first .ListView " +
                                                                     ".Detail[" + util_htmlAttribute("data-item-id", _viewState.ItemID) + "]");
                        }

                        if ($search && $search.length == 1) {
                            $search.addClass("ViewHighlight");

                            setTimeout(function () {
                                $search.removeClass("ViewHighlight");
                            }, 1250);
                        }

                    };  //end: _fn

                    if (_scrollTop == 0) {
                        $(window).scrollTop(0);
                        _fn();
                    }
                    else {
                        $("html,body").animate({ "scrollTop": _scrollTop + "px" }, _fn);
                    }
                }
            });

            //configure the view filters
            var _arrFilters = [{ "Type": "platform", "IsOptional": true }]; //allow optional Platform dropdown option

            //force it to hide the edit button
            options.LayoutManager.ToolbarSetButtons({
                "IsClear": true, "IsHideEditButtons": true, "IsInsertStart": true, "List": _controller.GetToolbarAdminButtons()
            });

            //configure the main toolbar options (such as when the header toolbar is rebound after change in Platform filter)
            _controller.DOM.Element.data("ToolbarRenderOptions", {
                "IsDisableEditActions": true,
                "GetToolbarButtons": function (opts) {
                    var _ret = "";

                    if (opts["From"] == "filter_platform") {
                        _ret += _controller.GetToolbarAdminButtons();
                    }

                    return _ret;
                }
            });

            _controller.ProjectOnGetFilters({
                "Callback": function (arr) {

                    arr = (arr || []);
                    _arrFilters = $.merge(_arrFilters, arr);

                    options.LayoutManager.FilterSetView({
                        "List": _arrFilters, "Callback": onCallback
                    });
                }
            });
        });
    }

    _queue.Add(function (onCallback) {
        _controller.Build({ "Callback": onCallback });
    });

    _queue.Run({ "Callback": _callback });
};

CEvidenceRoadmapController.prototype.ElementEditView = function (options) {
    var _controller = this;

    return _controller.DOM.Container.children(".ViewEditEntity:first");
};

CEvidenceRoadmapController.prototype.IsContentDetailScreen = function () {
    var _controller = this;
    var $parent = _controller.DOM.Element.closest(".CEditorComponentHome");

    return $parent.hasClass("ModeInlineEditOn");
};

CEvidenceRoadmapController.prototype.IsContentEditView = function () {
    var _controller = this;
    var _ret = false;

    if (_controller.IsContentDetailScreen()) {
        var $vwEdit = _controller.ElementEditView();

        _ret = util_forceBool($vwEdit.data("IsEditMode"), false);
    }

    return _ret;
};

CEvidenceRoadmapController.prototype.ToggleEditMode = function (options) {
    options = util_extend({ "Controller": null, "PluginInstance": null, "IsEdit": false, "Callback": null, "LayoutManager": null, "FilteredList": null, "Trigger": null }, options);

    var _handled = false;
    var _controller = options.Controller;
    var _pluginInstance = (options.PluginInstance ? options.PluginInstance : _controller.PluginInstance);
    var $container = $(_controller.DOM.Element);

    var $parent = $container.closest(".CEditorComponentHome");

    $parent.toggleClass("ModeInlineEditOn", options.IsEdit);

    _controller.ElementEditView().toggleClass("StateEditModeOn", _controller.IsContentEditView());

    if (options.Callback) {
        options.Callback();
    }
};

CEvidenceRoadmapController.prototype.OnButtonClick = function (options) {

    options = util_extend({
        "Controller": null, "PluginInstance": null, "ButtonID": null, "Trigger": null, "Event": null, "Parent": null, "LayoutManager": null, "InvokeExtArgs": null
    }, options);

    var $btn = $(options.Trigger);
    var _controller = options.Controller;
    var _pluginInstance = _controller.PluginInstance;
    var $container = $(_controller.DOM.Element);

    var _html = "";

    var _handled = _controller.Utils.ProcessButtonClick(options);
    var _layoutManager = options.LayoutManager;

    if (!_handled) {

        $btn.addClass("LinkDisabled");

        var _onClickCallback = function () {
            $btn.removeClass("LinkDisabled");

            if (options["Callback"]) {
                options.Callback();
            }

        };  //end: _onClickCallback

        switch (options.ButtonID) {

            case "add_entity":
            case "edit_entity":
            case "view_entity":

                var _editID = enCE.None;
                var _isEditMode = true;

                if (options.ButtonID == "edit_entity") {
                    _editID = null;
                }
                else if (options.ButtonID == "view_entity") {
                    _editID = util_forceInt($mobileUtil.GetClosestAttributeValue($btn, "data-item-id"), enCE.None);
                    _isEditMode = false;
                }

                _controller.ForceScrollTop({
                    "TriggerListElement": $btn,
                    "Callback": function () {
                        _controller.OnEditEntity({
                            "EditID": _editID, "Callback": _onClickCallback, "IsEditMode": _isEditMode, "Callback": _onClickCallback
                        });
                    }
                });
                
                break;  //add/edit entity

            case "save_entity":
            case "delete_entity":
            case "cancel_edit_entity":
            case "done_edit_entity":
                var _fn = function (onCallback) {

                    var _navigateViewMode = false;
                    var _itemID = util_forceInt(_controller.ElementEditView().data("EditID"), enCE.None);
                    
                    if (options.ButtonID == "save_entity" || options.ButtonID == "cancel_edit_entity") {
                        _navigateViewMode = (_itemID != enCE.None);
                    }

                    _layoutManager.ToolbarSetButtons({
                        "IsClearAllButtons": true, "IsHideNavigateBackButton": false, "IsInsertStart": true,
                        "List": (!_navigateViewMode ? _controller.GetToolbarAdminButtons() : "")
                    });

                    if (_navigateViewMode) {
                        _controller.OnEditEntity({ "EditID": _itemID, "Callback": onCallback, "IsEditMode": false });
                    }
                    else {
                        _controller.ToggleEditMode({
                            "Controller": _controller, "PluginInstance": _controller.PluginInstance, "IsEdit": false, "LayoutManager": _layoutManager,
                            "Callback": function () {

                                //refresh all views since item no longer is available
                                _controller.Build({ "Callback": onCallback });
                            }
                        });
                    }
                };

                var _fnOnSubmit = function () {

                    if (options.ButtonID == "save_entity") {
                        _controller.OnSaveEditItem({
                            "Callback": function (saveResult) {

                                saveResult = util_extend({ "Success": false, "Callback": null }, saveResult);

                                if (saveResult.Success) {
                                    _fn(saveResult.Callback);
                                }

                                _onClickCallback();
                            }
                        });
                    }
                    else if (options.ButtonID == "delete_entity") {                        
                        _controller.OnDeleteEditItem({
                            "Callback": function (deleteResult) {

                                deleteResult = util_extend({ "Success": false, "Callback": null }, deleteResult);

                                if (deleteResult.Success) {
                                    _fn(deleteResult.Callback);
                                }

                                _onClickCallback();
                            }
                        });
                    }
                    else if (options.ButtonID == "done_edit_entity") {

                        //remove the edit ID to force back to the list view
                        var $vwEdit = _controller.ElementEditView();

                        $vwEdit.removeData("EditID")
                               .removeData("EditItem")
                               .removeData("IsEditMode");

                        _fn();
                    }
                    else {
                        _fn();
                    }

                };  //end: _fnOnSubmit

                var _confirmationOpts = {
                    "IsEnabled": false,
                    "Title": null,
                    "Message": null
                };

                ClearMessages();

                if (options.ButtonID == "save_entity") {
                    _confirmationOpts.IsEnabled = true;
                    _confirmationOpts.Title = _controller.Utils.LABELS.SaveChanges;
                    _confirmationOpts.Message = _controller.Utils.LABELS.ConfirmSaveChanges;
                }
                else if (options.ButtonID == "cancel_edit_entity") {
                    _confirmationOpts.IsEnabled = true;
                    _confirmationOpts.Title = _controller.Utils.LABELS.CancelChanges;
                    _confirmationOpts.Message = _controller.Utils.LABELS.ConfirmCancelChanges;
                }
                else if (options.ButtonID == "delete_entity") {
                    var _entityName = _controller.Utils.GetCurrentViewEntityTypeName();

                    _confirmationOpts.IsEnabled = true;
                    _confirmationOpts.Title = "Delete " + _entityName;
                    _confirmationOpts.Message = "Are you sure you want to permanently delete the " + _entityName + "?";
                }

                if (_confirmationOpts.IsEnabled) {
                    dialog_confirmYesNo(_confirmationOpts.Title, _confirmationOpts.Message, _fnOnSubmit, function () {
                        _onClickCallback();
                    });
                }
                else {
                    _fnOnSubmit();
                }

                break;  //end: save/cancel entity

            case "export_entity":

                var _itemID = util_forceInt(_controller.ElementEditView().data("EditID"), enCE.None);

                if (_itemID != enCE.None) {
                    _controller.OnExport({
                        "Callback": _onClickCallback,
                        "ExtExportFields": {
                            "StudyID": _itemID
                        }
                    });
                }
                else {
                    _onClickCallback();
                }

                break;  //end: export_entity

            case "export_popup":

                _controller.OnPopupExportSelections({ "Callback": _onClickCallback });

                break;  //end: export_popup

            case "ext_settings":

                var _isOpen = ($btn.hasClass("StateOn") == false);

                var $parent = $btn.closest(".ViewHeadingSortOptions");
                var $vw = $parent.children(".ViewExtendedSettingContent:first");

                var _fn = function () {
                    $btn.toggleClass("StateOn", _isOpen);
                    _onClickCallback();
                };  //end: _fn

                if (_isOpen) {
                    $vw.slideDown("normal", _fn);
                }
                else {
                    $vw.slideUp("normal", _fn);
                }

                break;  //end: ext_settings

            case "ext_open_group_toggles":

                var $clSettings = _controller.DOM.Element.find("[data-attr-editor-controller-action-btn='ext_settings']:first");

                $clSettings.trigger("click.controller_buttonClick", {
                    "Callback": _onClickCallback
                });

                break;  //end: ext_open_group_toggles

            default:
                _onClickCallback();
                break;
        }
    }
};

CEvidenceRoadmapController.prototype.CanAdminView = function (options) {

    var _ret = false;
    var _controller = this;

    options = util_extend({ "Item": null, "PlatformID": null }, options);

    var _item = options.Item;

    if (_item) {

        var _studyPlatforms = _item[enColCEStudyProperty.StudyPlatforms];

        _studyPlatforms = (_studyPlatforms || []);

        //search each study platform and check if user has admin access on one of them
        for (var i = 0; i < _studyPlatforms.length && !_ret; i++) {
            var _studyPlatform = _studyPlatforms[i];
            var _platformID = _studyPlatform[enColStudyPlatformProperty.PlatformID];

            var _search = util_arrFilterSubset(_controller.State.PlatformComponentPermissions, function (search) {
                return (search["CanAdmin"] === true && (search["PlatformID"] == _platformID));
            }, true);

            _ret = (_search.length == 1);
        }

        if (!_ret) {

            //user does not have admin access on the study, so will check if user is an owner (override)
            _ret = _controller.IsStudyOwner(_item);
        }

        if (!_ret) {

            //check if user has Administrator access for the overall module
            var _hasGeneralAdmin = _controller.CanAdminView();

            if (_hasGeneralAdmin) {

                //check if the render fields support unspecified platform for the study
                var _renderUnspecifiedOption = _controller.State["_cacheStudyPlatformRenderUnspecifiedOption"];

                if (!_renderUnspecifiedOption) {
                    var $vwEdit = _controller.ElementEditView();
                    var _fields = $vwEdit.data("RenderFields");
                    var _fieldStudyPlatforms = util_arrFilter(_fields, enColCEditorRenderFieldProperty.PropertyPath, enColCEStudyProperty.StudyPlatforms, true);

                    if (_fieldStudyPlatforms.length == 1) {
                        _fieldStudyPlatforms = _fieldStudyPlatforms[0];

                        _renderUnspecifiedOption = util_propertyValue(_fieldStudyPlatforms, "_fieldItem._renderList.RenderUnspecifiedOption");
                        _renderUnspecifiedOption = util_extend({ "IsEnabled": false, "PropertyValue": null }, _renderUnspecifiedOption);
                    }

                    _controller.State["_cacheStudyPlatformRenderUnspecifiedOption"] = _renderUnspecifiedOption;
                }

                if (_renderUnspecifiedOption && _renderUnspecifiedOption.IsEnabled && util_forceString(_renderUnspecifiedOption.PropertyValue) != "") {
                    var _isUnspecified = util_propertyValue(_item, _renderUnspecifiedOption.PropertyValue);

                    _isUnspecified = util_forceBool(_isUnspecified, false);

                    _ret = _isUnspecified;
                }
            }
        }
    }
    else {

        var _platformID = util_forceInt(options.PlatformID, enCE.None);

        var _search = util_arrFilterSubset(_controller.State.PlatformComponentPermissions, function (search) {
            return (search["CanAdmin"] === true && (_platformID == enCE.None || search["PlatformID"] == _platformID));
        }, true);

        _ret = (_search.length == 1);
    }

    //allow project overrides to the admin state
    var _args = util_extend({}, options);

    _args["CanAdmin"] = _ret;

    _controller.ProjectCanAdminView(_args);

    _ret = util_forceBool(_args["CanAdmin"], _ret);

    return _ret;
};

CEvidenceRoadmapController.prototype.GetToolbarAdminButtons = function () {
    var _controller = this;
    var _canAdmin = _controller.CanAdminView(); //check if general admin is supported
    var _ret = "";

    //by default all users regardless of role can add a new item (the form displayed for add new is restricted for the user based on platform roles)
    _ret += _controller.Utils.HTML.GetButton({
        "ActionButtonID": "add_entity", "Content": "Add Study", "Attributes": { "data-icon": "plus" }
    });

    return _ret;
};

CEvidenceRoadmapController.prototype.Build = function (options) {
    var _controller = this;

    options = util_extend({ "Callback": null }, options);

    var _queue = new CEventQueue();
    var _isEditMode = _controller.IsContentDetailScreen();

    if (!_isEditMode) {

        var $element = _controller.DOM.Container.children(".Content:first");

        //summary view
        _queue.Add(function (onCallback) {
            _controller.BindSummaryView({ "IsRefreshListView": false, "Callback": onCallback });
        });

        //list views
        var $listViews = $element.children(".Content > .ListView");

        _queue.Add(function (onCallback) {
            _controller.BindListViews({ 
                "List": $listViews, "Container": $element, "From": _controller.Data.FROM_CONTEXT.ListView,
                "IsEditMode": _isEditMode, "Callback": onCallback 
            });
        });
    }

    _queue.Run({ "Callback": options.Callback });
};

CEvidenceRoadmapController.prototype.BindSummaryView = function (options) {
    var _controller = this;

    options = util_extend({ "RenderKey": null, "SearchOptions": null, "HighlightEncoder": null, "Callback": null, "IsRefreshListView": true }, options);

    var _callback = function () {

        unblockUI();

        if (options.Callback) {
            options.Callback();
        }
    };

    var _queue = new CEventQueue();
    var $element = _controller.DOM["SummaryView"];

    if (!$element || $element.length == 0) {
        var $content = _controller.DOM.Container.children(".Content:first");

        $element = $content.children(".Content > .SummaryView");
        _controller.DOM["SummaryView"] = $element;
    }

    var _groupSummaries = null;
    var _filterState = null;
    var _renderKey = util_forceString(options.RenderKey);
    var _hasRenderKey = (_renderKey != "");
    var _canRender = function () {
        var _valid = (!_hasRenderKey ||
                      (_hasRenderKey && (util_forceString($element.data("RenderKey")) === _renderKey))
                     );

        return _valid;
    };  //end: _canRender

    var _resultCountState = {
        "Total": 0,
        "Increment": function (val) {
            val = util_forceInt(val, 0);
            this.Total += val;
        }
    };

    if (_hasRenderKey) {
        $element.data("RenderKey", _renderKey);
    }
    else {
        $element.removeData("RenderKey");
    }

    blockUI();

    var _fnHighlightEncoder = null;

    if (options.HighlightEncoder) {
        _fnHighlightEncoder = options.HighlightEncoder;
    }

    if (!_fnHighlightEncoder) {
        _fnHighlightEncoder = _controller.Utils.GetSearchHighlightEncoder({ "SearchOptions": options.SearchOptions });
    }

    //if it is the initialization, then configure the view from the user settings
    if (util_forceBool($element.data("data-is-init-summary-view"), true)) {

        $element.data("data-is-init-summary-view", false);

        var _selector = "";
        var _lookupFilterGroupToggle = _controller.Data.HomeViewUserSettings.Current["LookupFilterGroupToggle"];

        if (!_lookupFilterGroupToggle) {
            _lookupFilterGroupToggle = {};
            _controller.Data.HomeViewUserSettings.Current["LookupFilterGroupToggle"] = _lookupFilterGroupToggle;
        }

        for (var _key in _lookupFilterGroupToggle) {
            if (_lookupFilterGroupToggle[_key] === false) {
                _selector += (_selector != "" ? "," : "") + ".Group[" + util_htmlAttribute("data-group-id", _key) + "]";
            }
        }

        if (_selector != "") {
            var $groups = $element.children(_selector);

            $groups.addClass("EditorElementHidden");
        }
    }

    _queue.Add(function (onCallback) {

        if (_canRender() == false) {
            onCallback();
            return;
        }

        _controller.State.Filters({
            "From": "summary", "Callback": function (filterState) {

                _filterState = filterState;

                if (_canRender() == false) {
                    onCallback();
                    return;
                }

                if (options.SearchOptions) {
                    _filterState.Lookup["Search"] = options.SearchOptions["Query"];
                }

                APP.Service.Action({
                    "_indicators": false, "c": "PluginEditor", "m": "StudyHomeViewGroupSummaries",
                    "args": {
                        "ClassificationID": _filterState.ClassificationID,
                        "ComponentID": _filterState.ComponentID,
                        "ExtendedFilters": _filterState.Lookup
                    }
                }, function (data) {
                    _groupSummaries = (data || []);
                    onCallback();
                });
            }
        });
    });

    var $groups = $element.children(".Group[data-group-id]:not(.EditorElementHidden)"); //exclude groups that are hidden
    var _count = $groups.length;

    $groups.addClass("StateLoadingOn");

    //configure the custom css class
    var _removeClass = "";
    var _groupCountPerRow = _controller.Data.HomeRenderOptions.GroupCountPerRow;

    for (var n = 1; n < _groupCountPerRow; n++) {
        if (_count != n) {
            _removeClass += (_removeClass != "" ? " " : "") + "LayoutGroupCount_" + n;
        }
    }

    $element.removeClass(_removeClass)
            .toggleClass("LayoutGroupCount_" + _count, (_count < _groupCountPerRow));

    $.each($groups, function (index) {

        (function ($this, index, total) {

            _queue.Add(function (onCallback) {

                if (_canRender() == false) {
                    onCallback();
                    return;
                }

                _controller.OnRenderSummaryViewGroup({
                    "Element": $this, "GroupSummaries": _groupSummaries, "FilterState": _filterState, "HasIndicators": false, "Progress": (index + 1) + " of " + total,
                    "HighlightEncoder": _fnHighlightEncoder, "RunningTotalState": _resultCountState,
                    "Callback": onCallback
                });
            });
        })($(this), index, _count);
    });

    _queue.Add(function (onCallback) {
        if (_canRender()) {
            _controller.DOM.HomeLabelResultCount.text("Results: " + util_formatNumber(_resultCountState.Total));
        }

        onCallback();
    });

    if (options.IsRefreshListView) {

        _queue.Add(function (onCallback) {

            var _isEditMode = _controller.IsContentDetailScreen();

            if (_canRender() == false) {
                onCallback();
                return;
            }

            var $element = _controller.DOM.Container.children(".Content:first");

            var $listViews = $element.children(".Content > .ListView");

            //associate the highlight encoder to the list view containers
            $listViews.data("HighlightEncoder", _fnHighlightEncoder);

            _controller.BindListViews({
                "List": $listViews, "Container": $element, "From": _controller.Data.FROM_CONTEXT.ListView,
                "IsEditMode": _isEditMode, "Callback": onCallback
            });
        });
    }

    _queue.Run({
        "Callback": _callback
    });
};

CEvidenceRoadmapController.prototype.BindListViews = function (options) {

    var _controller = this;

    options = util_extend({ "List": null, "IsEditMode": false, "Container": null, "From": null, "Callback": null, "SelectionManager": null }, options);

    var _queue = new CEventQueue();
    var $listViews = $(options.List);
    var _from = util_forceString(options.From);
    var _isEditMode = util_forceBool(options.IsEditMode, false);

    if (_from == "") {
        _from = "_rnd_" + (new Date()).getTime();
    }

    var _hasSearch = false;
    var _forceCellValueHighlight = false;
    var _isModeSelection = false;
    var _selectionManager = options.SelectionManager;

    switch (_from) {

        case _controller.Data.FROM_CONTEXT.ListView:
            _forceCellValueHighlight = true;
            break;

        case _controller.Data.FROM_CONTEXT.ExportPopup:
            _isModeSelection = true;
            _hasSearch = true;
            break;        
    }

    if (_isModeSelection) {
        _selectionManager = util_extend({
            "m_lookup": {},
            "IsItemSelected": function (item, id) {
                return (this.m_lookup[id] === true);
            },
            "ToggleItemSelection": function (item, id, selected) {
                if (selected) {
                    this.m_lookup[id] = true;
                }
                else {
                    delete this.m_lookup[id];
                }
            },
            "ToggleAll": function (arrID, selected) {
                arrID = (arrID || []);

                for (var i = 0; i < arrID.length; i++) {
                    var _id = arrID[i];

                    if (selected) {
                        this.m_lookup[_id] = true;
                    }
                    else {
                        delete this.m_lookup[_id];
                    }
                }
            },

            "Clear": function () {
                this.m_lookup = {};
            },

            "ToList": function () {
                var _arr = [];

                for (var _key in this.m_lookup) {
                    var _id = util_forceInt(_key, enCE.None);

                    if (_id != enCE.None) {
                        _arr.push(_id);
                    }
                }

                return _arr;
            },

            "IsValid": function () {
                var _valid = false;

                for (var _key in this.m_lookup) {
                    _valid = true;
                    break;
                }

                return _valid;
            },

            "OnRebind": function () { }

        }, _selectionManager);
    }

    $.each($listViews, function (index) {
        (function ($this, index) {
            _queue.Add(function (onCallback) {

                if (!($this.data("data-init-list-view"))) {
                    $this.data("data-init-list-view", true)
                         .data("SelectionManager", _selectionManager);

                    var _id = util_forceString($this.attr("id"));
                    var $lblCount = null;

                    if (index == 0) {
                        $lblCount = $(options.Container).find(".BannerListView > .LabelResultCount > div > span, .ResultFilterCountSummary .LabelCount");
                    }

                    if (_id == "") {
                        _id = "EVR_vw" + _from + "_" + _isEditMode + "_" + (index + 1);
                    }

                    var _repeaterOpts = {
                        "ID": _id, "CssClass": "EditorDataAdminListTableTheme TableEvidenceRoadmapA",
                        "PageSize": PAGE_SIZE, "SortEnum": "", "DefaultSortEnum": "", "DefaultSortAsc": true,
                        "SortOrderGroupKey": "sort_" + _id,
                        "PropertyPathIdentifier": null,
                        "Columns": [],

                        //NOTE: requires a valid sort enum value configured first
                        "AddColumn": function (content, propertyPath, sortEnumPropertyName, params) {

                            var _column = {
                                "Content": util_forceString(content),
                                "SortEnum": this.SortEnum + "." + sortEnumPropertyName,
                                "PropertyPath": propertyPath
                            };

                            if (params) {
                                for (var _prop in params) {
                                    _column[_prop] = params[_prop];
                                }
                            }

                            this.Columns.push(_column);

                            return _column;
                        },
                        "Templates": {},    //lookup of template/static HTML content used for renderering the list content
                        "Service": {
                            "Controller": "PluginEditor",
                            "Method": null,
                            "OnConfigureParams": null   //format: function (params, filterState) { ... }
                        },
                        "RepeaterFunctions": {
                            "ContentRowAttribute": null,
                            "ContentRowCssClass": null,
                            "FieldCellOption": function (cellOpts) {
                                var _columnIndex = cellOpts.Index;

                                if (_columnIndex >= 0 && _columnIndex <= _repeaterOpts.Columns.length) {
                                    var _column = _repeaterOpts.Columns[_columnIndex];

                                    if (_column["CssClass"]) {
                                        cellOpts.CssClass = _column.CssClass;
                                    }

                                    if (_column["IsAlignCenter"] === true) {
                                        cellOpts.ForceHorizontalAlign = true;
                                    }
                                }

                                return cellOpts;
                            },
                            "FieldValue": null,
                            "GetData": null,
                            "BindComplete": function (opts) {
                                var _fn = $this.data("OnCallback");

                                var _result = util_extend({ "List": null, "NumItems": null }, opts["Data"]);
                                var _list = (_result.List || []);

                                $this.data("DataSource", _list);

                                if (_repeaterOpts.IsClickable) {
                                    $this.trigger("events.cListView_refreshToggleAllLinkState");
                                }

                                //set label count, if applicable
                                if ($lblCount) {
                                    $lblCount.text((_isModeSelection ? "" : "Results: ") + util_formatNumber(_result["NumItems"]));
                                }

                                if (util_forceBool($this.data("is-init-repeater-animation"), false) == false) {
                                    $this.data("is-init-repeater-animation", true);

                                    var $repeater = $($this.data("RepeaterView"));

                                    if ($repeater.is(":visible") == false) {
                                        $repeater.slideDown("fast");
                                    }
                                }

                                if (_fn) {

                                    $this.removeData("OnCallback");
                                    _fn.call($this);
                                }
                            }
                        }, "IsTableEnhance": true,
                        "DefaultNoRecordMessage": _controller.Data.NoRecordsMessage,
                        "IsNoRecordMessageHTML": false,
                        "IsClickable": _isModeSelection,
                        "IsSelected": function (item) {
                            var _id = util_propertyValue(item, _repeaterOpts.PropertyPathIdentifier);

                            return _selectionManager.IsItemSelected(item, _id);
                        }
                    };

                    //configure default templates
                    _repeaterOpts.Templates["template_view_details"] = "<span class='ButtonTheme LinkClickable material-icons' title='View Details' " +
                                                                       util_renderAttribute("callout") + " " +
                                                                       util_htmlAttribute("data-callout-disable-is-touch", enCETriState.Yes) + " " +
                                                                       util_htmlAttribute("data-callout-options-side", "left") + " " +
                                                                       (
                                                                        _isModeSelection ?
                                                                        "" :
                                                                        util_htmlAttribute("data-attr-editor-controller-action-btn", "view_entity") + " "
                                                                       ) +
                                                                       ">visibility</span>";

                    for (var i = 0; i < 2; i++) {
                        var _key;
                        var _checked = (i == 1);

                        if (i == 0) {
                            _key = "template_toggle_selection_off";
                        }
                        else {
                            _key = "template_toggle_selection_on";
                        }

                        _repeaterOpts.Templates[_key] = "<div class='EditorImageButton ImageToggleSelection" + (_checked ? " StateOn" : "") + "'>" +
                                                        "   <div class='ImageIcon' />" +
                                                        "</div>";
                    }

                    _repeaterOpts.RepeaterFunctions.ContentRowAttribute = function (item) {
                        return (_repeaterOpts.PropertyPathIdentifier ?
                                util_htmlAttribute("data-item-id", util_propertyValue(item, _repeaterOpts.PropertyPathIdentifier)) :
                                null);
                    };

                    _repeaterOpts.RepeaterFunctions.FieldValue = function (opts) {

                        if (opts.IsContent) {
                            var _item = opts.Item;
                            var _columnIndex = opts.Index;
                            var _ret = "";
                            var _isEncode = true;

                            if (_columnIndex >= 0 && _columnIndex <= _repeaterOpts.Columns.length) {
                                var _column = _repeaterOpts.Columns[_columnIndex];
                                var _propertyPath = util_forceString(_column["PropertyPath"]);

                                if (_propertyPath != "") {
                                    _ret = util_propertyValue(_item, _propertyPath);

                                    var _format = _column["Format"];

                                    if (_format) {
                                        switch (_format) {

                                            case enCDataFormat.Boolean:

                                                if (!util_isNullOrUndefined(_ret)) {
                                                    _ret = (_ret === true ? "Yes" : "No");
                                                }

                                                break;

                                            case enCDataFormat.Date:
                                                _ret = util_FormatDateTime(_ret, "", null, true, { "IsValidateConversion": true });
                                                break;
                                        }
                                    }

                                    if ((_hasSearch || _forceCellValueHighlight) && _column["CanSearch"]) {
                                        var _fnHighlightEncoder = $this.data("HighlightEncoder");

                                        if (_fnHighlightEncoder) {

                                            _isEncode = false;
                                            _ret = _fnHighlightEncoder(_ret);
                                        }
                                    }
                                }
                                else if (_column["GetValueHTML"]) {
                                    _isEncode = false;
                                    _ret = _column.GetValueHTML({ "Column": _column, "Item": _item });
                                }
                                else if (_column["ID"]) {

                                    switch (_column.ID) {

                                        case "toggle_selection":
                                            var _selected = _repeaterOpts.IsSelected(_item);

                                            _ret = _repeaterOpts.Templates[_selected ? "template_toggle_selection_on" : "template_toggle_selection_off"];
                                            _isEncode = false;

                                            break;  //end: toggle_selection

                                        default:
                                            if (util_forceString(_column.ID).indexOf("template_") == 0) {
                                                _ret = _repeaterOpts.Templates[_column.ID];
                                                _isEncode = false;
                                            }

                                            break;
                                    }
                                }
                            }

                            return (_isEncode ? util_htmlEncode(_ret, true) : util_forceString(_ret));
                        }
                    };

                    var _fnGetListData = function (element, sortSetting, callback, trigger) {

                        //check if a cache version is available
                        if (util_forceBool($this.data("IsCacheMode"), false)) {

                            var _cacheResult = util_extend({ "Data": null, "SearchOptions": null }, $this.data("CacheResult"));

                            $this.removeData("IsCacheMode")
                                 .removeData("CacheResult");

                            var _highlightEncoder = null;

                            if (_cacheResult.SearchOptions && _cacheResult.SearchOptions["HighlightEncoder"]) {
                                _highlightEncoder = _cacheResult.SearchOptions["HighlightEncoder"];
                            }

                            $this.data("HighlightEncoder", _highlightEncoder);

                            if (callback) {
                                callback(_cacheResult.Data);
                            }
                        }
                        else {
                            var _params = {
                                "SortColumn": sortSetting.SortColumn,
                                "SortAscending": sortSetting.SortASC,
                                "PageSize": util_forceInt(sortSetting.PageSize, _repeaterOpts.PageSize),
                                "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
                            };                            

                            _controller.State.Filters({
                                "From": _from, "Callback": function (filterState) {

                                    //required classification and component ID filters to apply user permissions
                                    _params["ClassificationID"] = filterState.ClassificationID;
                                    _params["ComponentID"] = filterState.ComponentID;

                                    if (_repeaterOpts.Service.OnConfigureParams) {
                                        _repeaterOpts.Service.OnConfigureParams(_params, filterState);
                                    }

                                    _params["ExtendedFilters"] = filterState.Lookup;

                                    //get the list data
                                    APP.Service.Action({
                                        "c": _repeaterOpts.Service.Controller, "m": _repeaterOpts.Service.Method, "args": _params
                                    }, function (result) {
                                        callback(result);
                                    });

                                    if (trigger) {
                                        $(trigger).data("LastRequest", GlobalService.LastRequest);
                                    }
                                }
                            });
                        }

                    };  //end: _fnGetListData

                    _repeaterOpts.RepeaterFunctions.GetData = function (element, sortSetting, callback) {
                        _fnGetListData(element, sortSetting, callback);
                    };

                    //default list view
                    var _renderOpts = util_extend({
                        "PropertyPathIdentifier": enColStudyProperty.StudyID,
                        "ServiceMethod": "StudyGetByForeignKey",
                        "SortEnumName": "enColStudy",
                        "DefaultSortEnumName": enColStudyProperty.Name,
                        "Columns": [
                            { "n": "Name", "p": enColStudyProperty.Name },
                            {
                                "n": "Added On", "p": enColStudyProperty.DateAdded,
                                "args": { "CssClass": "CellExpandedDate", "Format": enCDataFormat.Date, "IsAlignCenter": true }
                            },
                            {
                                "n": "Last Modified", "p": enColStudyProperty.DateModified,
                                "args": { "CssClass": "CellExpandedDate", "Format": enCDataFormat.Date, "IsAlignCenter": true }
                            }
                        ]
                    }, _controller.Data.ListViewRenderOptions);

                    _repeaterOpts.PropertyPathIdentifier = _renderOpts.PropertyPathIdentifier;
                    _repeaterOpts.Service.Method = _renderOpts.ServiceMethod;
                    _repeaterOpts.SortEnum = _renderOpts.SortEnumName;
                    _repeaterOpts.DefaultSortEnum = _repeaterOpts.SortEnum + "." + _renderOpts.DefaultSortEnumName;

                    _renderOpts.Columns = (_renderOpts.Columns || []);

                    for (var c = 0; c < _renderOpts.Columns.length; c++) {
                        var _column = _renderOpts.Columns[c];

                        if (!_column["s"]) {
                            _column["s"] = _column.p;
                        }

                        _repeaterOpts.AddColumn(_column.n, _column.p, _column.s, _column["args"]);
                    }

                    if (_isModeSelection) {

                        //prepend the toggle column for the list view and configure row style function
                        var _temp = _repeaterOpts.Columns;

                        _repeaterOpts.Columns = [];

                        _repeaterOpts.AddColumn("<div data-view-id='clToggleAll' class='LinkClickable EditorImageButton ImageToggleSelection' title='Toggle Current Selections'>" +
                                                "   <div class='ImageIcon' />" +
                                                "</div>",
                                                null, null, {
                                                    "IsNoLink": true, "ID": "toggle_selection", "CssClass": "ImageToggleIconCell", "IsHTML": true
                                                });

                        _repeaterOpts.Columns = $.merge(_repeaterOpts.Columns, _temp);

                        _repeaterOpts.RepeaterFunctions.ContentRowCssClass = function (opts) {
                            var _item = opts.Item;
                            var _id = util_propertyValue(_item, _repeaterOpts.PropertyPathIdentifier);
                            var _selected = _selectionManager.IsItemSelected(_item, _id);

                            return "EntityLineItem" + (_selected ? " Selected" : "");
                        };

                        _repeaterOpts.PageSize = 10;

                        _repeaterOpts.Service.OnConfigureParams = $this.data("OnConfigureParams");
                    }

                    _repeaterOpts.AddColumn(" ", null, null, { "IsNoLink": true, "ID": "template_view_details", "CssClass": "CellActionTools" });

                    var $repeater = _controller.Utils.Repeater(_repeaterOpts);

                    $repeater.hide();

                    $this.append($repeater);
                    $mobileUtil.refresh($this);

                    $this.data("RepeaterView", $repeater);

                    $this.off("click.cListView_onToggleSelection");

                    if (_repeaterOpts.IsClickable) {

                        $this.on("click.cListView_onToggleSelection", ".EntityLineItem:not(.LinkDisabled)", function () {
                            var $item = $(this);

                            var _itemID = $mobileUtil.GetClosestAttributeValue($item, "data-item-id");
                            var _list = ($this.data("DataSource") || []);

                            _itemID = util_forceInt(_itemID, enCE.None);

                            var _item = util_arrFilter(_list, _repeaterOpts.PropertyPathIdentifier, _itemID, true);

                            _item = (_item.length == 1 ? _item[0] : null);

                            var _selected = _selectionManager.IsItemSelected(_item, _itemID);

                            _selected = !_selected;

                            _selectionManager.ToggleItemSelection(_item, _itemID, _selected);

                            $item.toggleClass("Selected", _selected);

                            $item.find(".ImageToggleIconCell:first > .EditorImageButton.ImageToggleSelection")
                                 .toggleClass("StateOn", _selected);

                            $this.trigger("events.cListView_refreshToggleAllLinkState")
                                 .trigger("events.onSelectionManagerRebind");

                        }); //end: change.cListView_onToggleSelection

                        $this.off("click.cListView_headerToggleAll");
                        $this.on("click.cListView_headerToggleAll", "[data-view-id='clToggleAll']:not(.LinkDisabled)", function () {

                            var $cl = $(this);

                            $cl.addClass("LinkDisabled");

                            var _toggleAll = $cl.hasClass("StateOn");
                            var _list = ($this.data("DataSource") || []);

                            var _arrID = [];

                            for (var i = 0; i < _list.length; i++) {
                                var _item = _list[i];
                                var _itemID = util_propertyValue(_item, _repeaterOpts.PropertyPathIdentifier);

                                _arrID.push(_itemID);
                            }

                            _toggleAll = !_toggleAll;

                            _selectionManager.ToggleAll(_arrID, _toggleAll);

                            $this.trigger("events.onSelectionManagerRebind");

                            //refresh the list view (to get updated selection toggles)
                            $this.trigger("events.onRefreshListView", {
                                "Callback": function () {
                                    $cl.toggleClass("StateOn", _toggleAll);
                                    $cl.removeClass("LinkDisabled");
                                }
                            });

                        }); //end: click.cListView_headerToggleAll

                        $this.off("events.cListView_refreshToggleAllLinkState");
                        $this.on("events.cListView_refreshToggleAllLinkState", function () {

                            var $clToggleAll = $this.find(".TableHeaderRow .EditorImageButton[data-view-id='clToggleAll']");
                            var $search = $this.find(".EntityLineItem > .ImageToggleIconCell > .EditorImageButton.ImageToggleSelection:not(.StateOn):first");

                            //toggle the selected state for the toggle all link if there are no entries without a selected state for the content list items
                            $clToggleAll.toggleClass("StateOn", ($search.length == 0));

                        }); //end: events.cListView_refreshToggleAllLinkState

                        $this.off("events.onSelectionManagerRebind");

                        if (_selectionManager["OnRebind"]) {
                            $this.on("events.onSelectionManagerRebind", _selectionManager.OnRebind);
                        }
                    }

                    $this.off("events.onSearchListViewData");
                    $this.on("events.onSearchListViewData", function (e, args) {

                        args = util_extend({ "Trigger": null, "SearchOptions": null, "Callback": null }, args);

                        var _isInit = false;

                        var $vwRepeater = $this.data("ElementRepeater");

                        if (!$vwRepeater || $vwRepeater.length == 0 || $vwRepeater.hasClass("CRepeater") == false) {
                            $vwRepeater = $this.find(".CRepeater:first");

                            //check if the initialization has not completed, in which case the repeater element is acquired using a custom selector
                            if ($vwRepeater.length == 0) {
                                $vwRepeater = $this.find("[sort-order-group]:first");
                                _isInit = true;
                            }

                            $this.data("ElementRepeater", $vwRepeater);
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

                        _fnGetListData($vwRepeater, _sortSettings, args.Callback, args.Trigger);

                    }); //end: events.onSearchListViewData

                    $this.off("events.onRefreshListView");
                    $this.on("events.onRefreshListView", function (e, args) {

                        args = util_extend({ "NavigatePageNo": null, "Callback": null }, args);

                        $this.data("OnCallback", args.Callback);

                        $repeater.trigger("events.refresh_list", {
                            "NavigatePageNo": args.NavigatePageNo
                        });

                    }); //end: events.onRefreshListView

                    //configure the list view tooltip events
                    $repeater.off("callout_tooltip.getContent");
                    $repeater.on("callout_tooltip.getContent", function (e, args) {
                        _controller.ShowCallout({ "Event": e, "Args": args, "This": this, "PropertyPathIdentifier": _repeaterOpts.PropertyPathIdentifier });
                    }); //end: callout_tooltip.getContent
                }

                $this.trigger("events.onRefreshListView", { "Callback": onCallback });
            });

        })($(this), index);
    });

    _queue.Run({ "Callback": options.Callback });
};

CEvidenceRoadmapController.prototype.OnRenderSummaryViewGroup = function (options) {

    var _controller = this;

    options = util_extend({
        "Element": null, "GroupSummaries": [], "Progress": "", "FilterState": null, "HasIndicators": true,
        "HighlightEncoder": null,
        "Callback": null,
        "RunningTotalState": {
            "Increment": function (val) { }
        }
    }, options);

    var _hasIndicators = util_forceBool(options.HasIndicators, true);
    var _fnHighlightEncoder = options.HighlightEncoder;

    if (!_fnHighlightEncoder) {
        _fnHighlightEncoder = _controller.Utils.GetSearchHighlightEncoder();
    }

    var _queue = new CEventQueue();
    var $group = $(options.Element);
    var _groupID = util_forceInt($group.attr("data-group-id"), enCE.None);
    var _groupSummary = util_arrFilter(options.GroupSummaries, enColCStudyGroupSummaryBaseProperty.GroupID, _groupID, true);
    var _filterState = options.FilterState;

    var _layouts = {
        "IconTitle": "",
        "IconTitleTooltipOff": "",
        "IconSubtitle": "",
        "IconSubtitleTooltip": "",
        "LineItemFields": null
    };

    _layouts.IconTitle = util_forceString(util_propertyValue(_controller.Data.HomeRenderOptions, "Detail.IconTitle"));
    _layouts.IconTitleTooltipOff = util_forceString(util_propertyValue(_controller.Data.HomeRenderOptions, "Detail.IconTitleTooltipOff"));
    _layouts.IconSubtitle = util_forceString(util_propertyValue(_controller.Data.HomeRenderOptions, "Detail.IconSubtitle"));
    _layouts.IconSubtitleTooltip = util_forceString(util_propertyValue(_controller.Data.HomeRenderOptions, "Detail.IconSubtitleTooltip"));
    _layouts.LineItemFields = util_propertyValue(_controller.Data.HomeRenderOptions, "Detail.LineItemFields");

    _layouts.LineItemFields = (_layouts.LineItemFields || []);

    if (_layouts.IconTitle != "") {
        _layouts.IconTitle = "<i class='material-icons'>" + _layouts.IconTitle + "</i>";
    }
    else {
        _layouts.IconTitle = "";
    }

    if (_layouts.IconTitleTooltipOff != "") {
        _layouts.IconTitleTooltipOff = "<i class='material-icons'>" + _layouts.IconTitleTooltipOff + "</i>";
    }
    else {
        _layouts.IconTitleTooltipOff = _layouts.IconTitle;  //default if the tooltip off icon is not specifed
    }

    if (_layouts.IconSubtitle != "") {
        _layouts.IconSubtitle = "<i class='material-icons' " + util_htmlAttribute("title", _layouts.IconSubtitleTooltip, null, true) + ">" + _layouts.IconSubtitle + "</i>";
    }
    else {
        _layouts.IconSubtitle = "";
    }

    var _fnGetDetailHTML = function (item) {
        var _ret = "";
        var _studyID = item[enColCStudyGroupSummaryDetailBaseProperty.StudyID];
        var _tooltip = util_forceString(item[enColCStudyGroupSummaryDetailBaseProperty.IconTooltip]);
        var _currentLayoutTitleIcon = (_tooltip != "" ? _layouts.IconTitle : _layouts.IconTitleTooltipOff);

        _ret += "<div class='PluginEditorCardView CardModeInline DisableUserSelectable LinkClickable Detail' " +
                util_htmlAttribute("data-attr-editor-controller-action-btn", "view_entity") + " " + util_htmlAttribute("data-item-id", _studyID) + ">";

        _ret += util_forceString(_controller.ProjectOnGetContentHTML({ "Type": "GroupSummaryDetail_Header", "Item": item }));

        _ret += "<div class='LineItem Title'>" +
                (_currentLayoutTitleIcon != "" ?
                 "<div class='Icon' " + util_htmlAttribute("title", _tooltip, null, true) + ">" + _currentLayoutTitleIcon + "</div>" :
                 ""
                ) +
                "<div class='Label'>" + _fnHighlightEncoder(item[enColCStudyGroupSummaryDetailBaseProperty.Title], true) + "</div>" +
                "</div>";

        _ret += "<div class='LineItem Subtitle'>" +
                (_layouts.IconSubtitle != "" ?
                 "<div class='Icon'>" + _layouts.IconSubtitle + "</div>" :
                 ""
                ) +
                "<div class='Label'>" + _fnHighlightEncoder(item[enColCStudyGroupSummaryDetailBaseProperty.Subtitle], true) + "</div>" +
                "</div>";

        //render additional fields, if applicable
        if (_layouts.LineItemFields) {
            for (var f = 0; f < _layouts.LineItemFields.length; f++) {
                var _field = _layouts.LineItemFields[f];
                var _fieldPropertyPath = _field["PropertyPath"];
                var _fieldTooltip = util_forceString(_field["Tooltip"]);
                var _hasSearch = (_field["HasSearch"] === true);

                var _val = util_propertyValue(item, _fieldPropertyPath);

                _ret += "<div class='LineItem Subtitle'>" +
                        (_field["Icon"] && _field.Icon != "" ?
                         "<div class='Icon' " + util_htmlAttribute("title", _fieldTooltip, null, true) + "><i class='material-icons'>" + _field["Icon"] + "</i></div>" :
                         ""
                        ) +
                        "<div class='Label'>" + (_hasSearch ? _fnHighlightEncoder(_val, true) : util_htmlEncode(_val, true)) + "&nbsp;</div>" +
                        "</div>";
            }
        }

        _ret += "</div>";

        return _ret;

    };  //end: _fnGetDetailHTML

    _groupSummary = (_groupSummary.length == 1 ? _groupSummary[0] : {});

    var _numItems = util_forceInt(_groupSummary[enColCStudyGroupSummaryBaseProperty.NumItems], 0);
    var _strNumItems = util_formatNumber(_numItems);

    var $badge = $group.find(".Badge:first");

    $badge.attr("title", _strNumItems + " " + (_numItems == 1 ? "study" : "studies"));

    var $lbl = $badge.children("span:first");

    $lbl.text(_numItems > 99 ? "99+" : _strNumItems)
        .toggleClass("LabelSizeSmall", _numItems > 99);

    options.RunningTotalState.Increment(_numItems);

    if (_filterState == null) {
        _queue.Add(function (onCallback) {
            _controller.State.Filters({
                "From": "summary", "Callback": function (filterState) {
                    _filterState = filterState;
                    onCallback();
                }
            });
        });
    }

    _queue.Add(function (onCallback) {

        //TODO paged data and render (test with maximum items)
        var _params = {
            "GroupID": _groupID,
            "ClassificationID": _filterState.ClassificationID,
            "ComponentID": _filterState.ComponentID,
            "ExtendedFilters": _filterState.Lookup,
            "SortColumn": enCE.None,
            "SortAscending": true
        };

        if (_controller.DOM.HomeDropdownSort) {
            _params.SortColumn = util_forceInt(_controller.DOM.HomeDropdownSort.val(), _params.SortColumn);
        }

        if (_controller.DOM.HomeToggleSortDirections) {
            var $selected = _controller.DOM.HomeToggleSortDirections.filter(".StateOn:first");

            _params.SortAscending = (util_forceInt($selected.attr("data-is-asc"), enCETriState.Yes) == enCETriState.Yes);
        }

        APP.Service.Action({
            "_indicators": _hasIndicators, "c": "PluginEditor", "m": "StudyHomeViewGroupDetailList", "args": _params
        }, function (data) {

            data = util_extend({ "List": null, "NumItems": 0 }, data);
            data.List = (data.List || []);

            var _hasItems = (data.List.length > 0);

            var _html = "";

            for (var i = 0; i < data.List.length; i++) {
                _html += _fnGetDetailHTML(data.List[i]);
            }

            if (!_hasItems) {
                _html += "<div class='DisableUserSelectable LabelNoRecords'>" +
                         "<i class='material-icons'>error_outline</i>" +
                         "<div class='Label'>" + util_htmlEncode("No records were found") + "</div>" +
                         "</div>";
            }

            $group.data("DataItem", data)
                  .toggleClass("StateNoRecordsOn", !_hasItems);

            var $listView = $group.find(".Content:first > .ListView");

            $listView.html(_html);
            $mobileUtil.refresh($listView);

            onCallback();
        });
    });

    $group.addClass("StateLoadingOn");

    _queue.Run({
        "Callback": function () {

            setTimeout(function () {
                $group.removeClass("StateLoadingOn");

                if (options.Callback) {
                    options.Callback();
                }
            }, 10);
        }
    });
};

CEvidenceRoadmapController.prototype.OnEditEntity = function (options) {

    var _controller = this;

    options = util_extend({ "Container": null, "EditID": enCE.None, "Callback": null, "IsEditMode": false, "HasIndicators": true }, options);

    var _hasIndicators = util_forceBool(options.HasIndicators, true);

    var _callback = function () {

        unblockUI();

        if (options.Callback) {
            options.Callback();
        }

    };  //end: _callback

    blockUI();

    var _queue = new CEventQueue();
    var _layoutManager = null;

    var _editID = options.EditID;
    
    var _isItemInvalid = false;    
    var _isEditMode = util_forceBool(options.IsEditMode, false);

    var $vwEdit = null;
    var _isExternalMode = false;

    //data is optional (will use context data item, if not specified)
    var _fnBindViewProperties = function (data, onBindCallback) {

        var _dataItem = data;

        if (!_dataItem) {
            _dataItem = $vwEdit.data("EditItem");
        }

        var $properties = $vwEdit.find(".PropertyView");
        var $inputs = $properties.find((_isEditMode ? ".ViewInput" : ".ViewSummary") + " [" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");
        var _fields = $vwEdit.data("RenderFields");

        $properties.toggleClass("EditModeOn", _isEditMode);

        //bind the details
        $.each($inputs, function (index) {
            var $this = $(this);
            var _field = _fields[index];

            _controller.Utils.Actions.InputEditorDataType({
                "Controller": _controller,
                "IsGetValue": false,
                "Element": $this,
                "FieldItem": _field["_fieldItem"],
                "DataItem": _dataItem,
                "IsDatePickerRenderer": true
            });
        });

        if (onBindCallback) {
            onBindCallback();
        }

    };  //end: _fnBindViewProperties

    if (!options.Container) {
        $vwEdit = _controller.DOM.Container.children(".ViewEditEntity:first");

        if ($vwEdit.length == 0) {
            var _html = "<div class='ViewEditEntity'>";

            _html += "   <div class='Title'>" + "<div />" + "</div>" +
                     "   <div class='Content' />";

            _html += "<div class='ViewItemNotFoundMessage'>" +
                     "  <i class='material-icons'>error_outline</i>" +
                     "  <div class='Label'>" + util_htmlEncode(MSG_CONFIG.ItemNotFound) + "</div>" +
                     "</div>";

            _html += "</div>";

            $vwEdit = $(_html);
            _controller.DOM.Container.append($vwEdit);

            $mobileUtil.refresh($vwEdit);
        }
    }
    else {
        $vwEdit = $(options.Container);
        _isExternalMode = true;
    }

    if (_editID === null) {

        //use the edit ID from the view
        _editID = $vwEdit.data("EditID");
    }

    _editID = util_forceInt(_editID, enCE.None);

    var _hasID = (_editID != enCE.None);
    var _canDelete = _hasID;
    var _title = null;

    if (_isEditMode) {
        _title = (_hasID ? _controller.Data.LabelEditItem : _controller.Data.LabelAddItem);
    }

    if (_title == null) {
        _title = _controller.Utils.GetCurrentViewEntityTypeName();
    }

    $vwEdit.find(".Title:first > div").text(_title);

    $vwEdit.data("EditID", _editID)
           .data("IsEditMode", _isEditMode);

    //get layout manager instance
    _queue.Add(function (onCallback) {

        _controller.DOM.Element.trigger("events.getLayoutManager", {
            "Callback": function (result) {
                _layoutManager = result;
                onCallback();
            }
        });
    });    

    //set edit mode, if applicable
    if (!_isExternalMode) {
        _queue.Add(function (onCallback) {
            _controller.ToggleEditMode({
                "Controller": _controller, "PluginInstance": _controller.PluginInstance, "IsEdit": true, "LayoutManager": _layoutManager, "Callback": onCallback
            });
        });
    }

    if (_controller.Data.PropertyFields == null) {

        //initialize the property fields
        _queue.Add(function (onCallback) {

            GlobalService.HasIndicators = false;
            GlobalService.EntityMetadata(MODULE_MANAGER.Current.ModuleID, "EditorStudy", ext_requestSuccess(function (data) {
                _controller.Data.PropertyFields = (data || []);
                onCallback();
            }));
        });
    }

    if (!($vwEdit.data("RenderFields"))) {

        var _renderFields = null;

        var _fnMergeFieldItemRenderList = function (propPath, opts) {
            var _searchField = util_arrFilter(_renderFields, enColCEditorRenderFieldProperty.PropertyPath, propPath, true);

            if (_searchField.length == 1) {
                _searchField = _searchField[0];

                util_extend(util_propertyValue(_searchField, "_fieldItem._renderList"), opts, true, true);
            }

            return _searchField;

        };  //end: _fnMergeFieldItemRenderList

        //initialize and render the view based on render fields from the property fields
        _queue.Add(function (onCallback) {

            _renderFields = _controller.Utils.ConvertPropertyDetailsToRenderFields({ "Controller": _controller, "List": _controller.Data.PropertyFields });

            //configure the render fields
            for (var f = 0; f < _renderFields.length; f++) {
                var _field = _renderFields[f];
                var _editorDataTypeID = _field[enColCEditorRenderFieldProperty.EditorDataTypeID];
                var _fieldItem = _field["_fieldItem"];
                var _updateOptions = false;

                if (_editorDataTypeID == enCEEditorDataType.Date) {
                    _updateOptions = true;
                }
                else if (_editorDataTypeID == enCEEditorDataType.UserControl) {
                    _updateOptions = true;
                }

                if (_updateOptions && _fieldItem) {
                    var _options = (_field[enColCEditorRenderFieldProperty.Options] || {});

                    _fieldItem["_renderList"] = util_extend({}, _options["_renderList"]);
                    _fieldItem["_options"] = util_extend(_fieldItem["_options"], _options);
                }
            }

            onCallback();
        });

        _queue.Add(function (onCallback) {

            _controller.PluginInstance.GetData({
                "Type": "PlatformList", "Filters": {
                    "FilterClassificationID": _controller.Utils.ContextClassificationID(_controller.DOM.Element),
                    "SortColumn": enColPlatformProperty.DisplayOrder
                }
            }, function (dataResult) {

                var _platforms = (dataResult && dataResult.Success && dataResult.Data ? dataResult.Data.List : null);

                _platforms = (_platforms || []);

                var _list = [];

                for (var i = 0; i < _platforms.length; i++) {
                    var _platform = _platforms[i];

                    _list.push({
                        "Text": _controller.PluginInstance.Utils.ForceEntityDisplayName({ "Item": _platform, "Type": "Platform" }),
                        "Value": _platform[enColPlatformProperty.PlatformID]
                    });
                }

                var _field = _fnMergeFieldItemRenderList(enColCEStudyProperty.StudyPlatforms, {
                    "Data": _list,
                    "InstanceType": CEStudyPlatform,
                    "PropertyBridgeID": enColStudyPlatformProperty.PlatformID,
                    "PropertyBridgeIDName": enColStudyPlatformProperty.PlatformLabelName,
                    "GetRestrictedListID": function (opts) {
                        var _ret = [];

                        if (_controller.State.PlatformComponentPermissions) {
                            var _reqCanAdmin = true;
                            var _item = (opts.Item || {});

                            if (util_forceInt(_item[enColStudyProperty.StudyID], enCE.None) == enCE.None) {
                                _reqCanAdmin = false;
                            }
                            else {

                                //check if user is an owner of the study
                                if (_controller.IsStudyOwner(_item)) {
                                    _reqCanAdmin = false;
                                }
                            }

                            for (var i = 0; i < _controller.State.PlatformComponentPermissions.length; i++) {
                                var _platformComponentPerm = _controller.State.PlatformComponentPermissions[i];

                                if (!_reqCanAdmin || _platformComponentPerm["CanAdmin"] === true) {
                                    _ret.push(_platformComponentPerm["PlatformID"]);
                                }
                            }
                        }

                        return _ret;
                    },
                    "RenderUnspecifiedOption": {
                        "CanAdmin": function () {
                            return _controller.CanAdminView();
                        },
                        "OnToggleValue": function (opts) {

                            opts = util_extend({ "Trigger": null, "Selected": null, "Callback": null }, opts);

                            var $this = $(this);    //user control element

                            var _onToggleCallback = function () {
                                if (opts.Callback) {
                                    opts.Callback();
                                }
                            };

                            var _handled = false;

                            if (opts.Selected) {

                                var $vwEdit = _controller.ElementEditView();
                                var _fields = $vwEdit.data("RenderFields");
                                var _fieldID = $mobileUtil.GetClosestAttributeValue($this, "data-attr-render-field-id");

                                var _field = util_arrFilter(_fields, "_id", _fieldID, true);

                                _field = (_field.length == 1 ? _field[0] : null);

                                if (_field) {

                                    //retrieve the current value for the study users field
                                    var $inputStudyUsers = $vwEdit.find(".PropertyView[" + util_htmlAttribute("data-attr-prop-path", enColCEStudyProperty.StudyUsers) + "] " +
                                                                        ".ViewInput [" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]:first");

                                    var _userControlInstance = $inputStudyUsers.data("UserControl");

                                    var _value = _controller.Utils.Actions.InputEditorDataType({
                                        "Controller": _controller, "Element": $inputStudyUsers,
                                        "IsPrimitiveType": false
                                    });

                                    if (util_forceBool(_value["HasValidValue"], false) == false) {

                                        //a valid study user is not specified, so will automatically set it to the current user
                                        _handled = true;

                                        APP.Service.Action({
                                            "c": "PluginEditor", "m": "StudyGetDefaultCurrentUser"
                                        }, function (data) {

                                            if (data) {

                                                $inputStudyUsers.trigger(_userControlInstance.Data.EVENT_NAMES.OnAppendEntry, {
                                                    "From": "external_add",
                                                    "Item": data,
                                                    "Callback": function () {

                                                        _onToggleCallback();

                                                        setTimeout(function(){
                                                            var _offset = $inputStudyUsers.offset();

                                                            $("html,body").animate({ "scrollTop": (_offset.top + "px") }, 750);
                                                        }, 500);

                                                    }
                                                });
                                            }
                                            else {
                                                _onToggleCallback();
                                            }
                                        });
                                    }
                                }
                            }

                            if (!_handled) {
                                _onToggleCallback();
                            }
                        }
                    }
                });

                var _extOpts = {
                    "UserControlInstance": "CListBoxUserControlBase"
                };

                var _fieldItem = _field["_fieldItem"];

                //apply on the global field and the extended file item property to include the user control instance specific options
                _field[enColCEditorRenderFieldProperty.Options] = util_extend(_field[enColCEditorRenderFieldProperty.Options] || {}, _extOpts, true);
                _fieldItem["_options"] = util_extend(_fieldItem["_options"] || {}, _extOpts, true);

                //force the study platforms field to be non primitive when loading the user control values from current state
                //(required in order to support the unspecified option, if enabled)
                var _temp = _field[enColCEditorRenderFieldProperty.Options];

                _temp["IsApplyValueNonPrimitive"] = true;

                //for the study users field, update the list box user control instance's render list options to dynamically toggle the admin related features
                _fnMergeFieldItemRenderList(enColCEStudyProperty.StudyUsers, {
                    "HasAdminControls": function (opts) {
                        return _controller.CanAdminView();
                    }
                });

                //for the study KOLs field, merge the function used to determine whether user has Administrator/User role on KOL details (i.e. restricted Documents)
                _fnMergeFieldItemRenderList(enColCEStudyProperty.StudyKeyOpinionLeaders, {
                    "CanAdminComponentKOL": function () {
                        return _controller.CanAdminComponentKOL();
                    }
                });

                onCallback();
            });
        });

        _queue.Add(function (onCallback) {

            _controller.ProjectOnInitRenderFields({
                "List": _renderFields,
                "MergeFieldItemRenderList": _fnMergeFieldItemRenderList,
                "Callback": function () {

                    var _html = _controller.Utils.HTML.RenderOptionTableHTML({
                        "Controller": _controller, "List": _renderFields, "IsRenderAllModes": true, "IsLayoutFreeFlow": true,
                        "CssClass": "GridLayoutColumn_2 StateHasDividerOn",
                        "HasPlaceholders": true,
                        "OnRenderLoopItemHTML": function (opts) {
                            var _ret = "";
                            var _index = opts.Index;
                            var _setDivider = false;
                            var _isPrefix = opts.IsPrefix;

                            if (_isPrefix && opts["CssClass"] == "ModeExpanded") {
                                _setDivider = true;
                                opts.Reset();
                            }
                            else if (!_isPrefix && (_index + 1) % 2 == 0) {
                                _setDivider = true;
                            }

                            if (_setDivider) {
                                _ret += "<div class='TableRowDivider' />";
                            }

                            return _ret;
                        }
                    });

                    var $content = $vwEdit.children(".Content:first");

                    $content.html(_html);
                    $mobileUtil.refresh($content);

                    $vwEdit.data("RenderFields", _renderFields);
                    onCallback();
                }
            });

        });
    }

    //bind default/blank view
    var $tbl = null;

    _queue.Add(function (onCallback) {

        $tbl = $vwEdit.find(".TableRenderFieldListView");
        $tbl.addClass("EditorElementPlaceholderOn");

        onCallback();
    });

    //load the item and bind the data view    
    _queue.Add(function (onCallback) {

        var _fnOnLoadItem = function (data) {

            var _dataItem = (data || {});
            var _studyID = util_forceInt(_dataItem[enColStudyProperty.StudyID], enCE.None);

            _isItemInvalid = (_studyID != _editID);

            if (!_isItemInvalid && _studyID == enCE.None) {

                var _platformID = _controller.Utils.ContextEditorGroupPlatformID(_controller.DOM.Element);

                //set default study platforms for the context platform, if applicable
                if (_platformID != enCE.None) {
                    var _studyPlatforms = [];
                    var _currentStudyPlatform = new CEStudyPlatform();

                    _currentStudyPlatform[enColStudyPlatformProperty.PlatformID] = _platformID;
                    _studyPlatforms.push(_currentStudyPlatform);

                    util_propertySetValue(_dataItem, enColCEStudyProperty.StudyPlatforms, _studyPlatforms);
                }
            }

            $vwEdit.toggleClass("StateItemNotFoundOn", _isItemInvalid)
                   .data("EditItem", _dataItem);

            _fnBindViewProperties(_dataItem, function () {
                $tbl.removeClass("EditorElementPlaceholderOn");
                onCallback();
            });

        };  //end: _fnOnLoadItem
        var _canAdmin = _controller.CanAdminView(); //check if user has general admin support
        var _from = null;

        if (!_canAdmin) {

            //user does not have Administrator access, so set flag for the load method that it is triggered from roadmap as User role
            //i.e. pass the source of the request to force default values based on item ID
            _from = "roadmap_user";
        }

        APP.Service.Action({
            "_action": "LOAD",
            "_indicators": _hasIndicators,
            "c": "PluginEditor", "m": "StudyGetByPrimaryKeyV2",
            "args": {
                "ClassificationID": _controller.Utils.ContextClassificationID(_controller.DOM.Element),
                "ComponentID": _controller.Utils.ContextEditorGroupComponentID(_controller.DOM.Element),
                "ItemID": _editID, "DeepLoad": true,
                "From": _from
            }
        }, _fnOnLoadItem, function () {

            //an error has occurred, so return blank item (this can happen if user does not have permission to access the item)
            _fnOnLoadItem(null);
        });
    });

    //configure the toolbar buttons, if applicable
    if (!_isExternalMode) {
        _queue.Add(function (onCallback) {

            var _buttons = "";

            if (_isItemInvalid) {
                if (_isEditMode) {
                    _buttons += _controller.Utils.HTML.GetButton({
                        "ActionButtonID": "done_edit_entity", "Content": "Done", "Attributes": { "data-icon": "refresh" }
                    });
                }
            }
            else {

                var _dataItem = $vwEdit.data("EditItem");
                var _canAdminItem = _controller.CanAdminView({ "Item": _dataItem });

                if (!_isEditMode) {
                    _buttons += _controller.Utils.HTML.GetButton({
                        "ActionButtonID": "export_entity", "Content": "Export", "Attributes": { "data-icon": "arrow-r" }
                    });

                    if (_canAdminItem) {
                        _buttons += _controller.Utils.HTML.GetButton({
                            "ActionButtonID": "edit_entity", "Content": "Edit", "Attributes": { "data-icon": "edit" }
                        });
                    }
                }
                else {

                    _buttons += (_canDelete && _canAdminItem ?
                                 _controller.Utils.HTML.GetButton({
                                     "ActionButtonID": "delete_entity", "Content": "Delete", "Attributes": { "data-icon": "delete" }
                                 }) :
                                 ""
                                ) +
                                _controller.Utils.HTML.GetButton({
                                    "ActionButtonID": "save_entity", "Content": "Save", "Attributes": { "data-icon": "check" }
                                }) +
                                _controller.Utils.HTML.GetButton({
                                    "ActionButtonID": "cancel_edit_entity", "Content": "Cancel", "Attributes": { "data-icon": "refresh" }
                                });
                }
            }

            _layoutManager.ToolbarSetButtons({ "IsClearAllButtons": true, "IsHideNavigateBackButton": _isEditMode, "List": _buttons });

            onCallback();
        });
    }

    _queue.Run({ "Callback": _callback });
};

CEvidenceRoadmapController.prototype.OnSaveEditItem = function (options) {

    var _controller = this;

    options = util_extend({ "IsRestrictPopulateItem": false, "Callback": null }, options);

    var $vwEdit = _controller.ElementEditView();
    var _queue = new CEventQueue();
    var _result = {
        "Success": false,
        "Item": $vwEdit.data("EditItem"),
        "Validation": {
            "Errors": []
        }
    };

    var _isRestrictPopulateItem = util_forceBool(options.IsRestrictPopulateItem, false);

    ClearMessages();

    var _fieldList = $vwEdit.data("RenderFields");

    //validate the data item
    _queue.Add(function (onCallback) {

        var $inputs = $vwEdit.find("[data-attr-prop-path] .ViewInput " +
                                   "[" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "][data-attr-input-data-type]");

        $.each($inputs, function () {
            var $input = $(this);

            //populate input to the data item (disregard label data types)
            var _editorDataTypeID = util_forceInt($input.attr("data-attr-input-data-type"), enCE.None);

            if (_editorDataTypeID != enCEEditorDataType.Label) {
                var _propertyPath = $mobileUtil.GetClosestAttributeValue($input, "data-attr-prop-path");
                var _required = (util_forceInt($input.attr("data-attr-input-is-required"), enCETriState.None) == enCETriState.Yes);

                var _handled = false;
                var _isPrimitiveType = true;
                var _canSetExtPropertyPaths = false;

                var _isDate = (_editorDataTypeID == enCEEditorDataType.Date);

                var _fieldID = util_forceInt($mobileUtil.GetClosestAttributeValue($input, "data-attr-render-field-id"), enCE.None);
                var _field = util_arrFilter(_fieldList, "_id", _fieldID, true);

                _field = _field[0];

                var _fieldOptions = _field["_options"];

                if (!_fieldOptions && typeof _field[enColCEditorRenderFieldProperty.Options] === "object") {
                    _fieldOptions = _field[enColCEditorRenderFieldProperty.Options];
                }

                if (_isDate) {
                    _isPrimitiveType = false;
                }
                else if (_editorDataTypeID == enCEEditorDataType.UserControl) {
                    if (_fieldOptions) {
                        var _isApplyValueNonPrimitive = util_forceBool(_fieldOptions["IsApplyValueNonPrimitive"], false);

                        if (_isApplyValueNonPrimitive) {
                            _isPrimitiveType = false;
                            _canSetExtPropertyPaths = true;
                        }
                    }
                }

                var _value = _controller.Utils.Actions.InputEditorDataType({
                    "Controller": _controller, "Element": $input,
                    "IsPrimitiveType": _isPrimitiveType
                });

                if (_editorDataTypeID == enCEEditorDataType.Dropdown && _value == enCE.None) {
                    if (!_required) {

                        //force it to be null value since the default None option is selected
                        _value = null;
                    }
                    else {
                        $input.data("is-valid", false); //set invalid flag
                    }
                }

                if (!_isPrimitiveType) {                    
                    if (_isDate) {

                        var _isFullDate = _value.IsFullDate();
                        var _propertyIsFullDate = null;

                        if (_fieldOptions && util_forceString(_fieldOptions["PropertyIsFullDate"]) != "") {
                            _propertyIsFullDate = _fieldOptions["PropertyIsFullDate"];
                        }

                        _value = _value.ToDate();

                        //if the date value is not specified/blank, then clear the IsFullDate value
                        if (_value === null) {
                            _isFullDate = null;
                        }

                        if (util_forceString(_propertyIsFullDate) != "") {
                            util_propertySetValue(_result.Item, _propertyIsFullDate, _isFullDate);
                        }
                    }
                    else {

                        var _extPropertyValues = (_value["ExtPropertyValues"] || {});

                        //unbox from the property item value
                        _value = _value["ItemValue"];

                        if (_canSetExtPropertyPaths) {

                            //lookup will be keys of property paths and values to be applied directly to the data item
                            for (var _key in _extPropertyValues) {
                                util_propertySetValue(_result.Item, _key, _extPropertyValues[_key]);
                            }
                        }
                    }
                }

                if (!_handled) {
                    util_propertySetValue(_result.Item, _propertyPath, _value);
                }

                if (_required && !$input.data("is-valid")) {

                    var _fieldTitle = $input.attr("data-field-title");

                    if (util_forceString(_fieldTitle, "") == "") {
                        _fieldTitle = "Field";
                    }

                    _result.Validation.Errors.push(_fieldTitle + " is required.");
                }
            }

        });

        onCallback();
    });

    //project level validation
    _queue.Add(function (onCallback) {
        _controller.ProjectOnValidateSaveItem.call(_controller, {
            "RenderFields": _fieldList, "Item": _result.Item, "EditID": util_forceInt($vwEdit.data("EditID"), enCE.None),
            "Callback": function (validationResult) {

                validationResult = util_extend({ "Errors": null }, validationResult);
                validationResult.Errors = (validationResult.Errors || []);

                $.merge(_result.Validation.Errors, validationResult.Errors);

                onCallback();
            }
        });
    });

    _queue.Add(function (onCallback) {
        var _hasErrors = (_result.Validation.Errors.length > 0);

        if (_isRestrictPopulateItem) {
            onCallback();
        }
        else if (_hasErrors) {
            for (var i = 0; i < _result.Validation.Errors.length; i++) {
                AddUserError(_result.Validation.Errors[i]);
            }

            onCallback();
        }
        else {

            //save the data item
            var _saveCallback = function (success, data) {

                if (success) {

                    //update the view data item and item ID
                    $vwEdit.data("EditItem", data)
                           .data("EditID", util_propertyValue(data, enColStudyProperty.StudyID));

                    _result.Success = true;
                    _result.Item = data;

                    _result["Callback"] = function () {
                        AddMessage(_controller.Utils.LABELS.MessageSaveSuccess, null, null, { "IsTimeout": true });
                    };
                }

                onCallback();

            };  //end: _saveCallback

            APP.Service.Action({
                "c": "PluginEditor", "m": "StudySaveV2", "args": {
                    "ClassificationID": _controller.Utils.ContextClassificationID(_controller.DOM.Element),
                    "ComponentID": _controller.Utils.ContextEditorGroupComponentID(_controller.DOM.Element),
                    "Item": util_stringify(_result.Item),
                    "DeepSave": true
                },
                "_action": "SAVE",
                "_eventArgs": {
                    "SaveConflict": function () {
                        _saveCallback(false);
                    },
                    "Error": function () {
                        _saveCallback(false);
                    },
                    "Success": function (data) {
                        _saveCallback(true, data);
                    }
                }
            }, null, function () {
                unblockUI();    //dismiss any loading indicators/blockers

                global_unknownErrorAlert(function () {
                    _saveCallback(false);
                });
            });
        }
    });

    _queue.Run({
        "Callback": function () {
            if (options.Callback) {
                options.Callback(_result);
            }
        }
    });
};

CEvidenceRoadmapController.prototype.OnDeleteEditItem = function (options) {

    var _controller = this;
    var $vwEdit = _controller.ElementEditView();
    var _item = $vwEdit.data("EditItem");

    options = util_extend({ "Callback": null }, options);

    options.Callback = (options.Callback || function (val) { });

    var _result = {
        "Success": false,
        "Item": _item,
        "Callback": null
    };

    var _deleteCallback = function (success, data, isCancel) {

        if (success) {

            //update the view data item and item ID by clearing the state
            $vwEdit.removeData("EditItem")
                   .removeData("EditID");

            _result.Success = true;

            _result.Callback = function () {
                AddMessage(_controller.Utils.GetCurrentViewEntityTypeName() + " has been successfully deleted.", null, null, {
                    "IsTimeout": true
                });
            };
        }

        options.Callback(_result);

    };  //end: _deleteCallback

    APP.Service.Action({
        "c": "PluginEditor", "m": "StudyDeleteV2", "args": {
            "ClassificationID": _controller.Utils.ContextClassificationID(_controller.DOM.Element),
            "ComponentID": _controller.Utils.ContextEditorGroupComponentID(_controller.DOM.Element),
            "Item": util_stringify(_item)
        },
        "_action": "SAVE",
        "_eventArgs": {
            "SaveConflict": function () {
                _deleteCallback(false);
            },
            "Error": function () {
                _deleteCallback(false);
            },
            "Success": function (data) {
                _deleteCallback(true, data);
            }
        }
    }, null, function () {
        unblockUI();    //dismiss any loading indicators/blockers

        global_unknownErrorAlert(function () {
            _deleteCallback(false);
        });
    });

};

CEvidenceRoadmapController.prototype.OnProcessBackNavigation = function (options) {

    var _controller = this;
    var _queue = new CEventQueue();

    options = util_extend({ "Callback": null }, options);

    var _layoutManager = options["LayoutManager"];

    if (!_layoutManager) {
        _queue.Add(function (onCallback) {
            _controller.DOM.Element.trigger("events.getLayoutManager", {
                "Callback": function (layoutManager) {
                    _layoutManager = layoutManager;
                    onCallback();
                }
            });
        });
    }

    if (_controller.IsContentDetailScreen()) {
        _queue.Add(function (onCallback) {
            _layoutManager.ToolbarSetButtons({ "IsClearAllButtons": true, "IsHideNavigateBackButton": false, "IsInsertStart": true, "List": _controller.GetToolbarAdminButtons() });
            _controller.ToggleEditMode({ "Controller": _controller, "PluginInstance": _controller.PluginInstance, "IsEdit": false, "Callback": onCallback });
        });
    }

    _queue.Add(function (onCallback) {
        _controller.Build({ "Callback": onCallback });
    });

    _queue.Add(function (onCallback) {
        _controller.RestoreScrollTop();
        onCallback();
    });

    _queue.Run({ "Callback": options.Callback });
};

CEvidenceRoadmapController.prototype.OnExport = function (options) {

    var _controller = this;

    options = util_extend({ "Callback": null }, options);

    var _callback = function (success) {

        success = util_forceBool(success, false);

        unblockUI();

        if (!success) {
            global_unknownErrorAlert();
        }

        if (options.Callback) {
            options.Callback(success);
        }
    };

    var _exportSetting = {
        "Fields": {
            "ExportTemplateType": null, "ReportFormat": enCReportExportType.Excel,
            "EditorReportID": "%%TOK|ROUTE|PluginEditor|ExportReportID_Study%%"
        },
        "Configuration": { "ReportExportType": enCReportExportType.Dynamic }
    };

    var _fields = _exportSetting.Fields;

    _fields["RouteName"] = "PluginEditor";
    _fields["ClassificationID"] = _controller.Utils.ContextClassificationID(_controller.DOM.Element);
    _fields["ComponentID"] = _controller.Utils.ContextEditorGroupComponentID(_controller.DOM.Element);
    _fields["CanAdmin"] = (_controller.CanAdminView() ? enCETriState.Yes : enCETriState.No);

    util_extend(_fields, "%%TOK|ROUTE|PluginEditor|StudyExportOptions%%", true);

    if (options["ExtExportFields"]) {

        //merge the fields with the extended values (overwrite the source)
        util_extend(_fields, options.ExtExportFields, true);
    }

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
};

CEvidenceRoadmapController.prototype.OnPopupExportSelections = function (options) {

    var _controller = this;

    options = util_extend({ "Callback": null }, options);

    var _callback = function () {

        if (options.Callback) {
            options.Callback();
        }

    };  //end: _callback

    var _html = "";
    var _filterState = null;

    _html += "<div class='ViewFilterGroupExpanded' " + util_renderAttribute("filter_view") + " />";

    _html += "<div class='Instructions'>" + //open instructions tag
             "  <div class='Label'>" +
             "<span>" +
             util_htmlEncode("Please select the Study(s) to include for the export. " +
                             "Once the selections are complete, click on the \"Export\" button to generate the report.") +
            "</span>" +
             "  </div>" +
             "  <div class='ActionButtons'>" +
             _controller.Utils.HTML.GetButton({
                 "ActionButtonID": "clear_selections",
                 "CssClass": "ButtonTheme EditorElementHidden",
                 "Content": "Clear", "Attributes": { "data-icon": "delete" }
             }) +
             _controller.Utils.HTML.GetButton({
                 "ActionButtonID": "export",
                 "CssClass": "ButtonTheme",
                 "Content": "Export", "Attributes": { "data-icon": "arrow-r" }
             }) +
             "  </div>" +
             "</div>";  //close instructions tag

    _html += "<div class='ListView' />";

    var _popupOptions = _controller.Utils.DefaultPopupOptions({
        "Controller": _controller,
        "Title": "Export Report",
        "PopupClass": "PopupEditorComponentExport",
        "HTML": _html,        
        "OnPopupBind": function () {
            var $popup = $mobileUtil.PopupContainer();
            var _queue = new CEventQueue();

            var $filters = $popup.find("[" + util_renderAttribute("filter_view") + "]");

            var $vwListView = $popup.find(".ListView");
            var $tbSearch = $popup.find("[" + util_renderAttribute("filter_view") + "]:first [data-attr-filter-row-id='Search'] input[type='text']");

            var $clExport = $popup.find("[data-attr-editor-controller-action-btn='export']");
            var $clClearSelections = $popup.find("[data-attr-editor-controller-action-btn='clear_selections']");

            //bind the filters
            var $filterRows = $filters.find("[data-attr-filter-row-id]");

            $.each($filterRows, function () {
                (function ($this) {

                    var _filterID = $this.attr("data-attr-filter-row-id");
                    var $ddl = $this.find(".FilterContentCell select");

                    if ($ddl.length == 1) {
                        $ddl.selectmenu("enable");
                    }

                    _queue.Add(function (onCallback) {

                        switch (_filterID) {

                            case "PlatformID":

                                _controller.Utils.Events.UserAccess({
                                    "Trigger": _controller.DOM.Element,
                                    "IsLoadComponentFilters": true,
                                    "Callback": function (userAccessResult) {

                                        var _selected = enCE.None;
                                        var _foundSelection = false;
                                        var _list = [];

                                        if (_filterState && _filterState["Lookup"]) {
                                            _selected = util_forceInt(_filterState.Lookup["PlatformID"], _selected);
                                        }

                                        if (userAccessResult && userAccessResult["LookupPlatformAccess"]) {
                                            var _lookupPlatformAccess = userAccessResult.LookupPlatformAccess;

                                            for (var _platformID in _lookupPlatformAccess) {
                                                var _item = _lookupPlatformAccess[_platformID];

                                                _list.push({
                                                    "ID": _platformID, "Text": _controller.PluginInstance.Utils.ForceEntityDisplayName({
                                                        "Type": "Platform", "Item": _item.Platform
                                                    })
                                                });

                                                if (_selected == _platformID) {
                                                    _foundSelection = true;
                                                }
                                            }
                                        }

                                        if (!_foundSelection) {
                                            _selected = enCE.None;
                                        }

                                        util_dataBindDDL($ddl, _list, "Text", "ID", _selected, true, enCE.None, _controller.Utils.LABELS.DefaultSelection);

                                        onCallback();
                                    }
                                });

                                break;  //end: platform

                            default:

                                _controller.ProjectOnBindFilterViewEntry({
                                    "PlatformComponentPermissions": $.merge([], _controller.State.PlatformComponentPermissions),
                                    "Element": $this, "FilterID": _filterID, "FilterState": _filterState, "FilterList": $filterRows,
                                    "DefaultSelectionLabel": _controller.Utils.LABELS.DefaultSelection,
                                    "Callback": onCallback
                                });

                                break;
                        }
                    });

                })($(this));
            });

            //initialize the searchable field
            _queue.Add(function (onCallback) {

                $tbSearch.attr(DATA_ATTRIBUTE_RENDER, "searchable_field")
                         .data("SearchConfiguration", {
                             "IsFocusSearchOnClear": true,
                             "SearchableParent": $tbSearch.closest(".SearchableView"),
                             "OnRenderResult": function (result, opts) {
                                 $vwListView.data("IsCacheMode", true)
                                            .data("CacheResult", { "Data": result, "SearchOptions": opts });

                                 //refresh the list view
                                 $vwListView.trigger("events.onRefreshListView");
                             },
                             "OnSearch": function (opts, callback) {

                                 $vwListView.trigger("events.onSearchListViewData", {
                                     "Trigger": $tbSearch,
                                     "SearchOptions": opts,
                                     "Callback": function (data) {
                                         callback(data);
                                     }
                                 });
                             }
                         });

                $mobileUtil.RenderRefresh($tbSearch, true);

                $vwListView.data("ElementSearchableField", $tbSearch);  //set the element for the list view for the searchable field input

                onCallback();
            });

            _queue.Add(function (onCallback) {

                $clExport.off("click.cListView_onExportListReport");

                //configure the export button extended attributes for filter ID
                if ($filters.length == 1) {

                    var _fnGetSelectionManager = function () {
                        var _manager = $vwListView.data("SelectionManager");

                        return _manager;

                    };  //end: _fnGetSelectionManager

                    $clExport.on("click.cListView_onExportListReport", function () {
                        var $this = $(this);
                        var _onClickCallback = function () {
                            $this.removeClass("LinkDisabled");
                        };

                        ClearMessages();

                        if (!$this.hasClass("LinkDisabled")) {
                            $this.addClass("LinkDisabled");

                            var _selectionManager = _fnGetSelectionManager();

                            if (_selectionManager && _selectionManager.IsValid()) {

                                _controller.OnExport({
                                    "ExtExportFields": {
                                        "ListSelectionID_JSON": util_stringify(_selectionManager.ToList())
                                    },
                                    "Callback": _onClickCallback
                                });
                            }
                            else {
                                AddUserError("Please select at least one item for the export report.", { "IsTimeout": true });
                                _onClickCallback();
                            }
                        }

                    }); //end: click.cListView_onExportListReport

                    $clClearSelections.off("click.cListView_onClearExportSelections");
                    $clClearSelections.on("click.cListView_onClearExportSelections", function () {

                        if (!$clClearSelections.hasClass("LinkDisabled")) {

                            $clClearSelections.addClass("LinkDisabled");

                            var _fn = function () {
                                $clClearSelections.removeClass("LinkDisabled");
                            };  //end: _fn

                            dialog_confirmYesNo("Clear Selections", "Are you sure you want to clear all selections?", function () {

                                var _manager = _fnGetSelectionManager();

                                if (_manager) {
                                    _manager.Clear();
                                }

                                $clExport.trigger("events.cListView_refreshLabelCount");

                                _fn();

                                $vwListView.trigger("events.onRefreshListView");
                            }, _fn);
                        }

                    }); //end: click.cListView_onClearExportSelections

                    $clExport.off("events.cListView_refreshLabelCount");
                    $clExport.on("events.cListView_refreshLabelCount", function (e, args) {

                        var _count = null;
                        var _manager = _fnGetSelectionManager();

                        if (_manager) {
                            _count = _manager.ToList().length;
                        }

                        _count = util_forceInt(_count, 0);

                        $mobileUtil.ButtonSetTextByElement($clClearSelections, "Clear (" + util_formatNumber(_count) + ")");
                        $clClearSelections.toggleClass("EditorElementHidden", (_count == 0));

                    }); //end: events.cListView_refreshLabelCount

                    $clExport.trigger("events.cListView_refreshLabelCount");
                }
                else {
                    util_logError("OnPopupExportSelections :: more than one active filter is found or not available - length: " + $filters.length);
                }

                onCallback();
            });

            //bind the list view
            var _lookupFilterElement = null;

            $vwListView.data("OnConfigureParams", function (params, filterState) {

                if (!_lookupFilterElement) {
                    _lookupFilterElement = {};

                    $.each($filterRows, function () {
                        var $this = $(this);
                        var _filterID = $this.attr("data-attr-filter-row-id");
                        var $input = $this.find(".RC2 input[type='text'], .RC2 select");

                        if ($input.length == 1) {
                            _lookupFilterElement[_filterID] = $input;
                        }
                    });
                }

                for (var _filterID in _lookupFilterElement) {
                    var $input = _lookupFilterElement[_filterID];

                    filterState.Lookup[_filterID] = $input.val();
                }
            });

            _queue.Add(function (onCallback) {
                _controller.BindListViews({
                    "List": $vwListView, "Container": $popup, "From": _controller.Data.FROM_CONTEXT.ExportPopup, "Callback": onCallback,
                    "SelectionManager": {
                        "OnRebind": function () {
                            setTimeout(function () {
                                $clExport.trigger("events.cListView_refreshLabelCount");
                            }, 10);
                        }
                    }
                });
            });

            //bind filter related events
            $popup.off("change.onFilterUpdate");
            $popup.on("change.onFilterUpdate", "[" + util_renderAttribute("filter_view") + "] select", function () {

                //refresh the list view
                $vwListView.trigger("events.onRefreshListView");

            }); //end: change.onFilterUpdate

            _queue.Run({
                "Callback": function () {
                    try {
                        $tbSearch.trigger("focus");
                    } catch (e) {
                    }
                }
            });
        },
        "OnPopupCloseCallback": function () {
            if (options.OnDismissCallback) {
                options.OnDismissCallback();
            }
        },
        "OnButtonClick": function (args) {

            args = util_extend({ "Element": null, "ButtonID": null, "Callback": null }, args);

            var $btn = $(args.Element);

            var _clickCallback = function () {
                if (args.Callback) {
                    args.Callback();
                }
            };

            switch (args.ButtonID) {

                case "filters_clear":

                    dialog_confirmYesNo("Clear Filters", "Are you sure you want to clear all the filters?", function () {

                        var $filterGroup = $btn.closest("[" + util_renderAttribute("filter_view") + "]");
                        var $filterRows = $filterGroup.find("[data-attr-filter-row-id]");

                        $.each($filterRows, function () {
                            var $input = $(this).find(".RC2 input:first, .RC2 select:first");

                            if ($input.length == 1) {
                                if ($input.is("select")) {

                                    var $opt = $input.find("option:first");

                                    $input.val(util_forceString($opt.attr("value")));

                                    try {
                                        $input.selectmenu("refresh");
                                    } catch (e) {
                                    }
                                }
                                else {
                                    $input.val("");
                                }
                            }
                        });

                        _clickCallback();

                        //refresh the list view
                        var $vwListView = $mobileUtil.PopupContainer().find(".ListView");

                        $vwListView.trigger("events.onRefreshListView");

                    }, _clickCallback);

                    break;  //end: filters_clear

                default:
                    _clickCallback();
                    break;
            }
        }
    });

    _popupOptions["CallbackOnPreEnhanceElement"] = function () {
        var $popup = $(this);
        var $filters = $popup.find("[" + util_renderAttribute("filter_view") + "]");

        $.each($filters, function () {
            _controller.ConfigureFilterViewGroup({ "Element": $(this) });
        });
    };

    _controller.State.Filters({
        "From": _controller.Data.FROM_CONTEXT.ExportPopup, "Callback": function (filterState) {

            _filterState = filterState;

            $mobileUtil.PopupOpen(_popupOptions);

            if (options.Callback) {
                options.Callback();
            }
        }
    });
};

CEvidenceRoadmapController.prototype.ForceScrollTop = function (options) {
    var _controller = this;

    options = util_extend({ "Callback": null }, options);

    if (!options.Callback) {
        options.Callback = function () { };
    }

    var _scrollTop = $(window).scrollTop();

    //save the current scroll top state
    _controller.DOM.Element.trigger("events.moduleEVR_saveScrollTop", {
        "ViewState": options["ViewState"], "TriggerListElement": options["TriggerListElement"]
    });

    if (_scrollTop == 0) {
        options.Callback();
    }
    else {
        $("html,body").animate({ "scrollTop": 0 }, "fast")
                      .promise()
                      .done(function () {
                          options.Callback();
                      });
    }
};

CEvidenceRoadmapController.prototype.RestoreScrollTop = function () {
    var _controller = this;

    _controller.DOM.Element.trigger("events.moduleEVR_restoreScrollTop");
};

CEvidenceRoadmapController.prototype.ConfigureFilterViewGroup = function (options) {

    var _controller = this;

    options = util_extend({ "Element": null }, options);

    var $element = $(options.Element);

    var _fnGetFilterHTML = function (itemHTML) {
        return "<div class='FilterContentCell'>" + itemHTML + "</div>";
    };

    $element.data(DATA_ATTR_FILTER_VIEW_RENDER_OPTIONS_CALLBACK, function (element, filterOpts) {

        filterOpts["LayoutType"] = "free-flow";

        filterOpts.AddItem("PlatformID", "Platform",
                           _fnGetFilterHTML("<div class='EditorElementDropdown'><select data-mini='true' disabled='disabled' /></div>"),
                           true);

        _controller.ProjectOnConfigureFilterViewRenderOptions(element, filterOpts, { "GetFilterHTML": _fnGetFilterHTML });

        filterOpts.AddItem("Search", "Search",
                           "<div class='SearchableView EditorSearchableView PluginEditorCardView'>" +
                           "   <input type='text' data-role='none' maxlength='1000' " +
                           util_htmlAttribute("placeholder", "Search...", null, true) + " />" +
                           "   <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' data-iconpos='notext' title='Clear' />" +
                           "</div>", true, {
                               "CssClass": "ExpandedRC StateNoHeading"
                           });

        filterOpts.FooterHTML += "<div class='FilterActionButtonClear'>" +
                                 _controller.Utils.HTML.GetButton({
                                     "CssClass": "ButtonTheme", "ActionButtonID": "filters_clear", "Content": "Clear Filters",
                                     "Attributes": { "data-icon": "refresh" }
                                 }) +
                                 "</div>";

        filterOpts.FooterHTML += "<div class='ResultFilterCountSummary'>" +
                                 "  <div class='Label'>" +
                                 util_htmlEncode("Search results: ") +
                                 "<span class='LabelCount'>" + util_htmlEncode("0") + "</span>" +
                                 "  </div>" +
                                 "</div>";

        return filterOpts;

    });
};

CEvidenceRoadmapController.prototype.InitializeFilterID = function (options) {

    var _controller = this;

    options = util_extend({ "Element": null, "Callback": null }, options);

    var $element = $(options.Element);

    GlobalService.NewGUID(function (id) {
        $element.attr("data-attr-filter-id", id);

        $element.off("remove.filters_onCleanup");
        $element.on("remove.filters_onCleanup", function () {

            APP.Service.Action({
                "_indicators": false, "c": "PluginEditor", "m": "CleanupEditorTempFilterValues", "args": {
                    "FilterID": id
                }
            }, function () { });
        });

        if (options.Callback) {
            options.Callback();
        }
    });
};

CEvidenceRoadmapController.prototype.IsStudyOwner = function (study) {
    var _ret = false;

    if (study) {
        var _studyUsers = study[enColCEStudyProperty.StudyUsers];
        var _userID = global_AuthUserID();

        _ret = (util_arrFilter(_studyUsers, enColStudyUserProperty.UserID, _userID, true).length == 1);
    }

    return _ret;
};

CEvidenceRoadmapController.prototype.ShowCallout = function (options) {
    var _controller = this;

    options = util_extend({ "Event": null, "Args": null, "This": null, "PropertyPathIdentifier": null }, options);

    var _args = options.Args;

    var $this = $(_args.Trigger);
    var _itemID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-item-id"), enCE.None);

    if (_itemID != enCE.None) {
        var _html = "";

        _html += "<div class='EditorNotificationTooltipView EditorElementPlaceholderOn'>" +
                 "  <div class='Placeholders'>" +
                 "      <div class='Placeholder' />" +
                 "      <div class='Placeholder TextLine_2' />" +
                 "      <div class='Placeholder' />" +
                 "      <div class='Placeholder TextLine_3' />" +
                 "      <div class='Placeholder' />" +
                 "      <div class='Placeholder' />" +
                 "  </div>" +
                 "</div>";

        var $callout = $(_html);

        _args.SetCalloutContent($callout);

        var $vw = $("<div class='EditorNotificationTooltipView' " + util_renderAttribute("pluginEditor_fileDisclaimer") + ">" +
                    "  <div class='Title'>" +
                    "      <div class='Label'>" + util_htmlEncode(_controller.Utils.GetCurrentViewEntityTypeName()) + "</div>" +
                    "  </div>" +
                    "   <div class='ViewEditEntity'>" +
                    "       <div class='Content'>&nbsp;</div>" +
                    "   </div>" +
                    "</div>");

        var _key = "View_" + _controller.IsContentDetailScreen() + "_" + _controller.IsContentEditView();
        var _fnIsViewStateValid = function () {
            var _val = "View_" + _controller.IsContentDetailScreen() + "_" + _controller.IsContentEditView();

            return (_val == _key);
        };

        _controller.OnEditEntity({
            "HasIndicators": false, //disable indicators for the callout view (as we have placeholders while the view is being initialized)
            "Container": $vw.find(".ViewEditEntity"), "EditID": _itemID, "IsEditMode": false,
            "Callback": function () {

                var _fnDismiss = function () {
                    $callout.empty()
                            .closest(".tooltipster-base").remove();
                };

                if (!_fnIsViewStateValid()) {
                    _fnDismiss();
                }
                else {

                    setTimeout(function () {
                        _args.SetCalloutContent($vw);
                        $mobileUtil.RenderRefresh($vw, true);

                        $callout = $vw;

                        //remove the tooltip once user has clicked on an link
                        $callout.off("click.tooltip_onDismissLinkClick");
                        $callout.on("click.tooltip_onDismissLinkClick", function (e, args) {
                            var $target = $(e.target);
                            var $search = $target.closest(".LinkExternal, .tooltipster-base");

                            if ($search.is(".tooltipster-base") == false) {
                                _fnDismiss();
                            }
                        });

                        if (!_fnIsViewStateValid()) {
                            _fnDismiss();
                        }

                    }, 250);
                }
            }
        });
    }
};

CEvidenceRoadmapController.prototype.CanAdminComponentKOL = function () {
    var _controller = this;
    var _ret = false;

    if (_controller.CanAdminView()) {

        //user has Administrator access for the Evidence Roadmap, as such has full Administrator access on the KOL Manager
        _ret = true;
    }
    else {

        //user has User access for the Evidence Roadmap, as such use the KOL Manager permission for whether has full Administrator access
        var _permission = _controller.State.KOL_PlatformComponentPermission;

        _permission = (_permission || {});

        _ret = util_forceBool(_permission["CanAdmin"], false);
    }

    return _ret;
};

//SECTION START: project specific support

CEvidenceRoadmapController.prototype.ProjectOnGetFilters = function (options) {

    if (options.Callback) {
        options.Callback(null);
    }
};

CEvidenceRoadmapController.prototype.ProjectOnValidateSaveItem = function (options) {

    //where options: { "RenderFields", "Item", "EditID" }

    if (options.Callback) {
        options.Callback({ "Errors": [] });
    }
};

CEvidenceRoadmapController.prototype.ProjectOnInitRenderFields = function (options) {

    //where options: { "MergeFieldItemRenderList", "List" //render fields list }

    if (options.Callback) {
        options.Callback();
    }
};

CEvidenceRoadmapController.prototype.ProjectOnConfigureMethodParamState = function (options) {

    //where options is format of: { "From", "State" }

    if (options.Callback) {
        options.Callback();
    }
};

CEvidenceRoadmapController.prototype.ProjectOnGetContentHTML = function (options) {
    return "";
};

CEvidenceRoadmapController.prototype.ProjectOnConfigureFilterViewRenderOptions = function (element, filterOpts, options) {
};

CEvidenceRoadmapController.prototype.ProjectOnBindFilterViewEntry = function (options) {
    if (options["Callback"]) {
        options.Callback();
    }
};

CEvidenceRoadmapController.prototype.ProjectCanAdminView = function (options) {
    //do nothing (default will use global value); where options format: { "CanAdmin" }, update this value to change whether admin is supported
};

//SECTION END: project specific support

var CEvidenceRoadmapPlaceholderControl = function (options) {

    var $element = $(options.Target);
    var _html = "<div style='color: #FF0000;'>";

    _html += "<div style='display: inline-block; vertical-align: top;'>" +
             "<i class='material-icons'>error_outline</i>" +
             "</div>";

    _html += "<div style='display: inline-block; vertical-align: top; padding-top: 4px; padding-left: 4px; font-size: 0.9em;'>" +
             util_htmlEncode("This feature is currently not supported. Please check back later.") +
             "</div>";

    _html += "</div>";

    $element.html(_html);
};