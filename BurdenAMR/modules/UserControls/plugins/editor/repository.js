var CRepositoryController = function () {
    var _instance = this;

    _instance["DOM"] = {
        "Element": null,
        "View": null,
        "ListView": null,
        "PaginationView": null,
        "ViewFilters": null,
        "ViewResults": null,
        "ViewAnchor": null,
        "FilterTextSearch": null,
        "FilterToggleFavorite": null,

        "ToggleIndicator": function (isEnabled) {
            if (this.View) {
                this.View.trigger("events.viewIndicator_toggle", { "IsEnabled": isEnabled });
            }
        }
    };

    var _utils = pluginEditor_getUtils();

    _instance["Utils"] = util_extend({
        "ContextEditorGroupID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-attr-home-editor-group-id"), enCE.None);
        },
        "ContextEditorGroupPlatformID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-platform-id"), enCE.None);
        },
        "ConstructRepositoryFileHTML": function (opts) {

            var _ret = "";

            if (!opts) {
                opts = util_extend({
                    "Item": null, "NotAvailableMessageHTML": "&nbsp;", "IsIncludeFileName": false, "HasRemoveFileButton": false,
                    "IsFileUpload": false
                }, opts);
            }

            var _isFileUpload = (opts["IsFileUpload"] == true);

            var _item = opts.Item;
            var _fileID = util_forceInt(_item[enColRepositoryResourceProperty.FileID], enCE.None);
            var _hasFile = true;

            if (_isFileUpload) {
                _hasFile = (util_forceString(_item["PreviewFileURL"]) != "");
            }
            else {
                _hasFile = (_fileID != enCE.None);
            }

            var _hasRemoveButton = ((_hasFile && opts["HasRemoveFileButton"] == true));

            if (_hasFile) {
                var _displayName = "";
                var _url = null;

                if (_isFileUpload) {
                    _url = _item["PreviewFileURL"];
                    _displayName = _item["OriginalFileName"];
                }
                else {
                    _url = _instance.Utils.ConstructDownloadURL({
                        "TypeID": "editor", "Item": _item, "Property": enColRepositoryResourceProperty.FileID
                    });

                    _displayName = _item[enColRepositoryResourceProperty.FileDisplayName];
                }

                _ret = "<a class='LinkExternal WordBreak DisableLinkStyle' data-role='none' data-rel='external' target='_blank' " + util_htmlAttribute("href", _url) + " " +
                       util_htmlAttribute("title", _displayName, null, true) + ">" +
                       "    <div class='EditorImageButton ImageDownloadFile'>" +
                       "        <div class='ImageIcon' />" +
                       "    </div>" +
                       (opts["IsIncludeFileName"] ?
                        "<span class='LabelFileName'>" + (opts["HighlightEncoder"] ? opts.HighlightEncoder.call(this, _displayName) : util_htmlEncode(_displayName)) + "</span>" :
                        ""
                       ) +
                       "</a>";

                if (_hasRemoveButton) {
                    _ret += "<a class='LinkClickable ButtonTheme ButtonRemoveFile' data-role='button' data-theme='transparent' data-icon='delete' data-corners='false' " +
                            "data-mini='true' data-inline='true'>" +
                            util_htmlEncode("Remove") +
                            "</a>";
                }
            }
            else {
                _ret = util_forceString(opts["NotAvailableMessageHTML"], "&nbsp;");
            }

            return _ret;
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
        }
    }, _utils);

    _instance["Data"] = {
        "DATA_KEY_SCROLL_TOP": "restore-scroll-top-popup-repository",
        "DefaultCategoryID": util_forceInt("%%TOK|ROUTE|PluginEditor|RepositoryDefaultCategoryID%%", enCE.None),
        "DefaultSearchCategoryID": util_forceInt("%%TOK|ROUTE|PluginEditor|RepositoryDefaultSearchCategoryID%%", enCE.None),
        "DefaultDossierSearchCategoryID": util_forceInt("%%TOK|ROUTE|PluginEditor|RepositoryDefaultDossierSearchCategoryID%%", enCE.None),
        "DefaultEditorToolResourceSearchCategoryID": util_forceInt("%%TOK|ROUTE|PluginEditor|RepositoryDefaultEditorToolResourceSearchCategoryID%%", enCE.None),
        "DefaultListViewDocumentTypeID": util_forceInt("%%TOK|ROUTE|PluginEditor|RepositoryDefaultListViewDocumentTypeID%%", enCE.None),
        "FilterGroups": ("%%TOK|ROUTE|PluginEditor|RepositoryFilterGroups%%" || []),
        "Fields": ("%%TOK|ROUTE|PluginEditor|RepositoryFields%%" || []),
        "Categories": ("%%TOK|ROUTE|PluginEditor|RepositoryCategories%%" || []),
        "DefaultUserView": ("%%TOK|ROUTE|PluginEditor|RepositoryDefaultUserView%%" || []),
        "LookupField": {},
        "DocumentTypes": ("%%TOK|ROUTE|PluginEditor|RepositoryDocumentTypes%%" || []),
        "PopupSearchRenderOptions": util_extend({
            "IsEnableAddActionNoRecords": true,
            "NoRecordsMessage": "There are no records found matching the search criteria. Would you like to add a new Document?",
            "IsMessageHtml": false
        }, "%%TOK|ROUTE|PluginEditor|LayoutRepositoryPopupSearch%%"),
        "ControllerInstanceKOL": null,
        "LookupDocumentTypeCategory": {},

        "ListPageSize": PAGE_SIZE,
        "PopupPageSize": 15,
        "HighlightEncoder": null,
        "UserFilterGroupValues": {
            "m_lookup": null,

            "Init": function () {
                this.m_lookup = {};
            },

            "GetGroupList": function (groupName) {
                var _ret = null;

                if (!this.m_lookup) {
                    this.Init();
                }

                _ret = this.m_lookup[groupName];

                if (!_ret) {
                    _ret = [];
                    this.m_lookup[groupName] = _ret;
                }

                return _ret;
            },

            "Add": function (obj, groupName, data) {
                var _list = this.GetGroupList(groupName);
                var _item = new CEEditorTempUserFilterValue();
                var _value = data[enColCFilterGroupItemProperty.Value];
                var _isNumber = (typeof _value === "number");

                _item[enColEditorTempUserFilterValueProperty.ItemID] = (_list.length + 1);

                var _propValue = null;
                var _propUnset = null;

                if (_isNumber) {
                    _propValue = enColEditorTempUserFilterValueProperty.FilterValueNumeric;
                    _propUnset = enColEditorTempUserFilterValueProperty.FilterValueText;
                }
                else {
                    _propValue = enColEditorTempUserFilterValueProperty.FilterValueText;
                    _propUnset = enColEditorTempUserFilterValueProperty.FilterValueNumeric;
                }
                
                _item[_propValue] = _value;
                _item[_propUnset] = null;

                _list.push(_item);
            },

            "ClearGroupValues": function (groupName) {
                var _ret = this.GetGroupList(groupName);

                delete this.m_lookup[groupName];

                return _ret;
            }
        }
    };

    var _fields = _instance.Data.Fields;

    for (var i = 0; i < _fields.length; i++) {
        var _field = _fields[i];
        var _fieldID = _field[enColRepositoryFieldProperty.FieldID];

        //configure the property paths to evaluated property string
        var _propertyPath = util_forceString(_field[enColRepositoryFieldProperty.PropertyPath]);
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

        _field["_propertyPath"] = _fieldPropPath;

        //force the field's option JSON to be a proper objectoption, if applicable
        var _optionJSON = util_forceString(_field[enColRepositoryFieldProperty.OptionJSON]);
        var _opts = null;

        if (_optionJSON != "") {

            var _fnForcePropertyValueParse = function (propName) {
                if (_opts[propName] !== undefined) {
                    _opts[propName] = eval(_opts[propName]);
                }
            };

            var _arrPropEval = ["IsDatePickerRenderer", "PropertyIsFullDate", "PropertyFileItem", "PropertyTempFileItem"];

            try {
                _opts = util_parse(_optionJSON);

                for (var p = 0; p < _arrPropEval.length; p++) {
                    var _prop = _arrPropEval[p];

                    _fnForcePropertyValueParse(_prop);
                }

            } catch (e) {
                util_logError("CRepositoryController :: malformed option JSON for field ID - " + _fieldID);
            }
        }

        _field["_options"] = (_opts || {});

        _instance.Data.LookupField[_fieldID] = _field;
    }

    _instance["PluginInstance"] = null;
    _instance["FileUploadSupportedExt"] = [
        "jpg", "jpeg", "png", "gif", "doc", "docx", "xlsx", "xls", "xlsm", "ppt", "pptx", "pdf", "txt",
        //audio extensions
        ".mp3", ".m4a", ".aac", ".ac3", ".ogg",
        //video extensions
        ".mp4", ".avi", ".mpeg", ".mpg", ".mkv", ".3gp", ".webm"
    ];
};

CRepositoryController.prototype.Bind = function (options, callback) {

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

    if ($element.length == 0) {
        $element = $(_controller.DOM.Element);
    }

    //HACK: hide the navigation related header and toolbar
    $element.closest(".CEditorComponentHome").addClass("CEditorComponentHomeHiddenHeader");

    if (!$element.data("init-events")) {
        $element.data("init-events", true);

        $element.data("OnNavigateBackRequest", function (request) {
            request.IsHandled = true;

            //force to Home module (required for now as the "application" based modules cannot navigate back to franchise's platform's components view)
            GoToHome();
        });
    }

    var $vw = $element.children(".EditorRepositoryView");

    if ($vw.length == 0) {
        var _html = "";
        var _title = "%%TOK|ROUTE|PluginEditor|RepositoryResultViewTitle%%";
        var _disclaimer = "%%TOK|ROUTE|PluginEditor|RepositoryResultViewDisclaimer%%";

        var _buttons = [
            { "ActionButtonID": "repo_add", "Label": "Add Article", "Icon": "plus" },
            { "ActionButtonID": "toggle_favorites", "CssClass": "StateOff", "Label": "Show Favorites", "Icon": "check" },
            { "ActionButtonID": "repo_viewEdit", "Label": "Customize View", "Icon": "grid" },
            { "ActionButtonID": "repo_toggleEdit", "Label": "Edit", "Icon": "edit" }
        ];

        _html += "<div class='EditorRepositoryView' " + util_renderAttribute("view_indicator|pluginEditor_fileDisclaimer") + " " +
                 util_htmlAttribute("data-attr-view-indicator-is-transparent", enCETriState.Yes) + " " +
                 util_htmlAttribute("data-attr-view-indicator-is-fixed-position", enCETriState.Yes) + ">" +
                 "  <div class='ViewFilters PluginEditorCardView'>";

        for (var i = 0; i < _controller.Data.FilterGroups.length; i++) {
            var _filterGroup = _controller.Data.FilterGroups[i];
            var _cssClass = util_forceString(_filterGroup[enColCFilterGroupDetailProperty.CssClass], "");

            _html += "<div " + util_htmlAttribute("class", "LinkClickable FilterGroup" + (_cssClass != "" ? " " + _cssClass : "")) + " " +
                     util_htmlAttribute("data-filter-group-entity-type-id", _filterGroup[enColCFilterGroupDetailProperty.EntityTypeID]) + ">" +
                     "  <div class='Logo' />" +
                     "  <div class='Label'>" + util_htmlEncode(_filterGroup[enColCFilterGroupDetailProperty.Title]) + "</div>" +
                     "</div>";
        }

        _html += "  </div>" +   //end: filters
                 "  <div class='ViewResults'>" +
                 "      <div class='Header'>" +
                 "          <div class='Title'>" +
                 "              <div class='Label'>" + util_htmlEncode(_title) + "</div>" +
                 "          </div>" +
                 "          <div class='ToolButtons'>";

        for (var i = 0; i < _buttons.length; i++) {
            var _btn = _buttons[i];

            _html += _controller.Utils.HTML.GetButton({
                "ActionButtonID": _btn["ActionButtonID"],
                "CssClass": _btn["CssClass"],
                "Content": _btn.Label,
                "Attributes": {
                    "data-inline": "true",
                    "data-icon": _btn["Icon"],
                    "data-iconpos": "left",
                    "title": _btn["Title"]
                }
            });
        }

        //TODO: maximize button support
        ////_html += "              <div class='LinkClickable EditorImageButton ImageMaximize StateOff' title='Maximize' data-attr-editor-controller-action-btn='toggle_fullscreen'>" +
        ////         "                  <div class='ImageIcon' />" +
        ////         "              </div>";

        _html += "          </div>" +   //end: tool buttons
                 "      </div>" +   //end: header
                 "      <div class='LabelDisclaimer'>" +
                 "          <div class='Label'>" + util_htmlEncode(_disclaimer) + "</div>" +
                 "      </div>" +
                 "      <div class='SearchableView'>" +
                 "          <input id='tbSearchListView' type='text' maxlength='1000' data-corners='false' data-mini='true' placeholder='Search...' />" +
                 "          <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' data-iconpos='notext' title='Clear' />" +
                 "      </div>" +
                 "      <div class='PaginationView' />" +
                 "      <div class='Anchor' />" +
                 "      <div class='ScrollbarPrimary ListView' style='display: none;' />" +
                 "  </div>" +
                 "</div>";

        $element.html(_html);
        $mobileUtil.refresh($element);

        $vw = $element.children(".EditorRepositoryView");

        _controller.DOM.View = $vw;
        _controller.DOM.ViewFilters = $vw.find(".ViewFilters");
        _controller.DOM.ViewResults = $vw.find(".ViewResults");
        _controller.DOM.FilterTextSearch = _controller.DOM.ViewResults.find("#tbSearchListView");
        _controller.DOM.FilterToggleFavorite = _controller.DOM.ViewResults.find("[data-attr-editor-controller-action-btn='toggle_favorites']");
        _controller.DOM.ViewAnchor = $vw.find(".Anchor");
        _controller.DOM.ListView = _controller.DOM.ViewResults.children(".ListView");
        _controller.DOM.PaginationView = _controller.DOM.ViewResults.children(".PaginationView");

        _controller.DOM.ListView.data("FilterDocumentTypeID", _controller.Data.DefaultListViewDocumentTypeID);

        _controller.DOM.ViewFilters.off("click.onFilterGroupAction");
        _controller.DOM.ViewFilters.on("click.onFilterGroupAction", ".FilterGroup[data-filter-group-entity-type-id]:not(.LinkDisabled)", function () {
            var $group = $(this);
            var _filterGroupEntityTypeID = util_forceInt($group .attr("data-filter-group-entity-type-id"), enCE.None);
            var _filterGroup = util_arrFilter(_controller.Data.FilterGroups, enColCFilterGroupDetailProperty.EntityTypeID, _filterGroupEntityTypeID, true);
            var _groupName = "GRP_" + _filterGroupEntityTypeID;

            var _onClickCallback = function () {
                $group .removeClass("LinkDisabled");

                _controller.DOM.ToggleIndicator(false);
            };

            var _onClose = function (opts) {

                var $element = $(opts.Element);
                var _dataList = ($element.data("DataItem") || []);
                var $cb = $element.find(".RepositoryFilterOption input[type='checkbox']:checked");

                var _srcList = _controller.Data.UserFilterGroupValues.ClearGroupValues(_groupName);

                $.each($cb, function (index) {
                    var $this = $(this);
                    var _itemIndex = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-filter-item-index"), -1);
                    var _optData = _dataList[_itemIndex];

                    _controller.Data.UserFilterGroupValues.Add(this, _groupName, _optData, _srcList);
                });

                _controller.DOM.ToggleIndicator(true);

                _controller.GetContextFilterID(function(filterID){

                    APP.Service.Action({
                        "_indicators": false, "c": "PluginEditor", "m": "SetEditorTempUserFilterValues", "args": {
                            "FilterID": filterID,
                            "EntityTypeID": _filterGroupEntityTypeID,
                            "List": _controller.Data.UserFilterGroupValues.GetGroupList(_groupName)
                        }
                    }, function (result) {

                        $group.trigger("events.onFilterGroupRefresh");
                        _controller.DOM.ToggleIndicator(false);
                        
                        if (_controller.DOM.ListView) {
                            _controller.DOM.ListView.trigger("events.refreshListView");
                        }
                    });
                });

            };  //end: _onClose

            $group.addClass("LinkDisabled");

            _filterGroup = (_filterGroup.length == 1 ? _filterGroup[0] : null);

            _controller.DOM.ToggleIndicator(true);

            APP.Service.Action({
                "_indicators": false, "c": "PluginEditor", "m": "RepositoryFilterGroupItemList", "args": {
                    "EntityTypeID": _filterGroupEntityTypeID
                }
            }, function (result) {

                var _list = (result || []);
                var _stepSize = 20;
                var _html = "";

                var _fnSetHTML = function (index) {

                    var _start = index;
                    var _max = Math.min(_start + _stepSize, _list.length);

                    if (_start >= _list.length) {
                        _controller.ShowPanel({
                            "Title": (_filterGroup ? "Filter by " + _filterGroup[enColCFilterGroupDetailProperty.Title] : ""),
                            "HTML": _html,
                            "Callback": function (obj) {

                                $(obj).data("DataItem", _list); //persist the source filter options list
                                _onClickCallback();
                            },
                            "OnClose": _onClose
                        });
                    }
                    else {
                        var _selectionList = _controller.Data.UserFilterGroupValues.GetGroupList(_groupName);

                        for (var i = _start; i < _max; i++) {
                            var _filterItem = _list[i];
                            var _value = _filterItem[enColCFilterGroupItemProperty.Value];
                            var _selected = util_arrFilterSubset(_selectionList, function (search) {
                                var _filterValue = null;

                                if (search[enColEditorTempUserFilterValueProperty.FilterValueNumeric] !== null) {
                                    _filterValue = search[enColEditorTempUserFilterValueProperty.FilterValueNumeric];
                                }
                                else if (search[enColEditorTempUserFilterValueProperty.FilterValueText] !== null) {
                                    _filterValue = search[enColEditorTempUserFilterValueProperty.FilterValueText];
                                }

                                return (_value == _filterValue);
                            }, true);

                            _selected = (_selected.length == 1);

                            _html += "<div class='RepositoryFilterOption' " + util_htmlAttribute("data-attr-filter-item-index", i) + ">" +
                                     "  <label>" +
                                     "      <input type='checkbox' data-corners='false' data-mini='true'" + (_selected ? " checked='checked'" : "") + " />" +
                                     util_htmlEncode(_filterItem[enColCFilterGroupItemProperty.Text]) +
                                     "  </label>" +
                                     "</div>";

                            index++;
                        }

                        setTimeout(function () {
                            _fnSetHTML(index);
                        }, 50);
                    }                    

                };  //end: _fnSetHTML

                _fnSetHTML(0);
                
            });

        }); //end: click.onFilterGroupAction

        _controller.DOM.ViewFilters.off("events.onFilterGroupRefresh");
        _controller.DOM.ViewFilters.on("events.onFilterGroupRefresh", ".FilterGroup[data-filter-group-entity-type-id]", function () {
            var $this = $(this);
            var _filterGroupEntityTypeID = util_forceInt($this.attr("data-filter-group-entity-type-id"), enCE.None);
            var _groupName = "GRP_" + _filterGroupEntityTypeID;
            var _list = _controller.Data.UserFilterGroupValues.GetGroupList(_groupName);

            _list = (_list || []);

            $this.toggleClass("FilterEnabled", _list.length > 0);
        });

        _controller.DOM.View.off("remove.cleanup");
        _controller.DOM.View.on("remove.cleanup", function () {

            _controller.GetContextFilterID(function (filterID) {
                if (util_forceString(filterID) != "") {

                    APP.Service.Action({
                        "_indicators": false, "c": "PluginEditor", "m": "EditorTempUserFilterCleanup", "args": {
                            "FilterID": filterID
                        }
                    });
                }
            }, true);
        });

        _controller.DOM.PaginationView.off("events.navigateToPage");
        _controller.DOM.PaginationView.on("events.navigateToPage", function (e) {
            var $target = $(e.target);
            var _pageNum = null;

            if ($target.is("select")) {
                _pageNum = $target.val();
            }
            else if ($target.is("[data-attr-nav-page-num]")) {
                _pageNum = $target.attr("data-attr-nav-page-num");
            }

            _pageNum = util_forceInt(_pageNum, 0);

            if (_pageNum > 0 && _controller.DOM.ListView) {
                _controller.DOM.ListView.children("[data-attr-ref-data-admin-list-id]:first")
                                        .trigger("events.refresh_list", { "NavigatePageNo": _pageNum });
            }

        }); //end: events.navigateToPage

        _controller.DOM.PaginationView.off("change.navigate");
        _controller.DOM.PaginationView.on("change.navigate", ".DropdownPageView", function () {
            $(this).trigger("events.navigateToPage");
        });

        _controller.DOM.PaginationView.off("click.navigate");
        _controller.DOM.PaginationView.on("click.navigate", "[data-attr-nav-page-num]", function () {
            $(this).trigger("events.navigateToPage");
        });

        _controller.DOM.ViewResults.off("click.edit_resource");
        _controller.DOM.ViewResults.on("click.edit_resource",
                                       ".ListView:not(.EditModeOn) .EntityLineItem[data-attr-item-id]:not(.LinkDisabled), " +
                                       ".ListView.EditModeOn .EntityLineItem:not(.EntityLineItemViewMode)[data-attr-item-id]:not(.LinkDisabled)",
                                       function (e, args) {
                                           var $this = $(this);
                                           var _valid = true;

                                           var $target = $(e.target);

                                           if ($target.closest("a[data-rel='external'], .EntityLineItem").hasClass("EntityLineItem") == false) {

                                               //disable edit popup since an external link is found
                                               _valid = false;
                                           }

                                           if (_valid) {
                                               var _editID = util_forceInt($this.attr("data-attr-item-id"), enCE.None);
                                               var $parent = $this.closest(".ListView");
                                               var _isViewMode = ($parent.hasClass("EditModeOn") == false);

                                               $this.addClass("LinkDisabled");

                                               _controller.PopupEditResource({
                                                   "EditID": _editID,
                                                   "IsViewMode": _isViewMode,
                                                   "Callback": function () {
                                                       $this.removeClass("LinkDisabled");
                                                   }
                                               });
                                           }

                                       }); //end: click.edit_resource

        _controller.DOM.ListView.off("click.toggleUserFavorite");
        _controller.DOM.ListView.on("click.toggleUserFavorite",
                                    ".EntityLineItem[data-attr-item-id]:not(.LinkDisabled) .UserFavoriteToggle.LinkClickable:not(.LinkDisabled), " +
                                    ".EntityLineItem:not(.EntityLineItemViewMode)[data-attr-item-id]:not(.LinkDisabled) .DeleteListItem.LinkClickable:not(.LinkDisabled)",
                                    function (e) {

                                        //stop event propagation (required to suppress edit mode view resource popup)
                                        e.stopPropagation();

                                        var $this = $(this);
                                        var _resourceID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-item-id"), enCE.None);

                                        $this.addClass("LinkDisabled");

                                        if ($this.hasClass("UserFavoriteToggle")) {

                                            var _isAdd = $this.hasClass("StateOff");

                                            _controller.DOM.ToggleIndicator(true);

                                            APP.Service.Action({
                                                "_indicators": false, "c": "PluginEditor", "m": "RepositoryResourceUserFavoriteToggle",
                                                "args": {
                                                    "ResourceID": _resourceID,
                                                    "IsAdd": _isAdd
                                                }
                                            }, function (result) {

                                                if ((_isAdd && result) || (!_isAdd && !result)) {
                                                    $this.toggleClass("StateOff");
                                                }

                                                _controller.DOM.ToggleIndicator(false);

                                                $this.removeClass("LinkDisabled")
                                                     .attr("title", $this.hasClass("StateOff") ? "Add to Favorite" : "Remove from Favorite");

                                                //check if the list needs to be refreshed (only applicable if the favorites filter is turned on)
                                                if (_controller.DOM.FilterToggleFavorite && !_controller.DOM.FilterToggleFavorite.hasClass("StateOff") &&
                                                    _controller.DOM.ListView) {
                                                    _controller.DOM.ListView.trigger("events.refreshListView");
                                                }
                                            });
                                        }
                                        else if ($this.hasClass("DeleteListItem")) {

                                            dialog_confirmYesNo("Delete", "Are you sure you want to delete the item?", function () {

                                                _controller.DOM.ToggleIndicator(true);

                                                APP.Service.Action({
                                                    "_indicators": false, "c": "PluginEditor", "m": "RepositoryResourceGetByPrimaryKey", "args": {
                                                        "ResourceID": _resourceID
                                                    }
                                                }, function (item) {

                                                    var _fn = function () {

                                                        _controller.DOM.ToggleIndicator(false);
                                                        $this.removeClass("LinkDisabled");

                                                        _controller.BindListView(); //refresh the list view
                                                    };

                                                    if (!item || util_forceInt(item[enColRepositoryResourceProperty.ResourceID], enCE.None) == enCE.None) {
                                                        _fn();
                                                    }
                                                    else {

                                                        APP.Service.Action({
                                                            "_indicators": false, "c": "PluginEditor", "m": "RepositoryResourceDelete", "args": {
                                                                "Item": util_stringify(item)
                                                            }
                                                        }, function (result) {

                                                            _controller.DOM.ToggleIndicator(false);

                                                            result = util_extend({ "Success": false, "Message": null, "RequireForceDelete": false }, result);

                                                            if (result.Success) {
                                                                _fn();
                                                            }
                                                            else if (result.RequireForceDelete) {

                                                                var _message = util_htmlEncode("The specified Article is currently being referenced by dependent data. " +
                                                                                               "Do you want to force delete it?") +
                                                                               "<br /><br />" +
                                                                               "<b>" + util_htmlEncode("WARNING: ") + "</b>" +
                                                                               util_htmlEncode("doing so will result in all dependent data also being deleted.");

                                                                dialog_confirmYesNo("Delete", _message, function () {
                                                                    APP.Service.Action({
                                                                        "_indicators": false, "c": "PluginEditor", "m": "RepositoryResourceDelete", "args": {
                                                                            "Item": util_stringify(item), "IsForceDelete": true
                                                                        }
                                                                    }, function (result) {

                                                                        if (result && result["Success"]) {
                                                                            _fn();
                                                                        }
                                                                        else {
                                                                            global_unknownErrorAlert(_fn);
                                                                        }
                                                                    });

                                                                }, _fn, true);
                                                            }
                                                            else {
                                                                global_unknownErrorAlert(_fn);
                                                            }
                                                        });

                                                    }
                                                });

                                            }, function () {
                                                $this.removeClass("LinkDisabled");
                                            });
                                        }
                                        else {
                                            $this.removeClass("LinkDisabled");
                                        }

                                        return true;

                                    }); //end: click.toggleUserFavorite

        //configure the searchable text input
        _controller.DOM.FilterTextSearch.attr(DATA_ATTRIBUTE_RENDER, "searchable_field")
                                        .data("SearchConfiguration", {
                                            "OnRenderResult": function (result, opts) {

                                                if (_controller.DOM.ListView) {
                                                    _controller.DOM.ListView.trigger("events.refreshListView", { "IsCache": true, "Data": result, "SearchParam": opts });
                                                }
                                            },
                                            "OnSearch": function (opts, callback) {
                                                var _sortSettings = ctl_repeater_getSortSetting(_controller.DOM.ListView);

                                                _sortSettings["PageNo"] = 1;

                                                var _fnGetList = _controller.DOM.ListView.data("OnGetList");

                                                if (_fnGetList) {

                                                    _fnGetList(_controller.DOM.ListView, _sortSettings, function (result) {
                                                        callback(result);
                                                    });
                                                }
                                                else {
                                                    callback(null);
                                                }
                                            }
                                        });

        $mobileUtil.RenderRefresh(_controller.DOM.FilterTextSearch, true);

        //initialize the data items for the view
        $vw.data("DataItemUserView", util_extend({}, _controller.Data.DefaultUserView, false, true));
    }

    if (!_pluginInstance) {
        _pluginInstance = _controller.PluginInstance;
    }

    if (!$vw.data("is-init")) {
        $vw.data("is-init", true);
    }

    _controller.GetContextFilterID(function (filterID) {

        $element.trigger("events.getComponentUserPermission", {
            "Callback": function (permSummary) {

                var _canAdmin = util_forceBool(permSummary ? permSummary.CanAdmin : null, false);

                $vw.toggleClass("AdminViewMode", _canAdmin);

                var _componentKOL_ID = util_forceInt("%%TOK|ROUTE|PluginEditor|RepositoryComponentKeyOpinionLeaderID%%", enCE.None);
                var _fn = function (canAdminKOL) {

                    canAdminKOL = util_forceBool(canAdminKOL, false);

                    $vw.toggleClass("AdminViewModeComponentKOL", canAdminKOL);

                    _controller.BindListView();
                    _callback();
                };

                //retrieve the KOL manager component user permission (only if current user does not have Administrator role on active component)
                if (!_canAdmin && _componentKOL_ID != enCE.None) {
                    $element.trigger("events.getComponentUserPermission", {
                        "OverrideComponentID": _componentKOL_ID, "Callback": function (kolPermSummary) {

                            //user does not have access to module, so match the role to be that of the repository resource permission
                            if (!kolPermSummary || !kolPermSummary["Permission"] || kolPermSummary.Permission["IsActive"] == false) {
                                _fn(_canAdmin);
                            }
                            else {
                                _fn(util_forceBool(kolPermSummary ? kolPermSummary.CanAdmin : null, false));
                            }
                        }
                    });
                }
                else {
                    _fn(_canAdmin);
                }
            }
        });
    });
};

CRepositoryController.prototype.ToggleEditMode = function (options) {
    options = util_extend({ "Controller": null, "IsEdit": false, "Callback": null, "Trigger": null }, options);

    var _handled = false;
    var _controller = options.Controller;
    var $container = $(_controller.DOM.Element);

    if (_controller.DOM.ListView) {
        _controller.DOM.ListView.toggleClass("EditModeOn", options.IsEdit);
    }

    if (!_handled && options.Callback) {
        options.Callback();
    }
};

CRepositoryController.prototype.OnButtonClick = function (options) {
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

        switch (options.ButtonID) {

            case "repo_toggleEdit":
                if (_controller.DOM.ListView) {
                    var _isEdit = _controller.DOM.ListView.hasClass("EditModeOn");

                    _isEdit = !_isEdit;

                    _fnToggleButton(false);

                    _controller.ToggleEditMode({
                        "Controller": _controller, "IsEdit": _isEdit, "Trigger": $btn, "Callback": function () {

                            $mobileUtil.ButtonUpdateIcon($btn, _isEdit ? "check" : "edit");
                            $mobileUtil.ButtonSetTextByElement($btn, _isEdit ? "Done" : "Edit");

                            _fnToggleButton(true);
                        }
                    });
                }

                break;

            case "repo_add":

                _fnToggleButton(false);

                _controller.PopupEditResource({
                    "Callback": function () {
                        _fnToggleButton(true);
                    }
                });

                break;

            case "repo_viewEdit":

                _fnToggleButton(false);

                _controller.PopupCustomizeView({
                    "Callback": function () {
                        _fnToggleButton(true);
                    }
                });

                break;

            case "toggle_favorites":

                $btn.toggleClass("StateOff");

                if (_controller.DOM.ListView) {
                    _controller.DOM.ListView.trigger("events.refreshListView");
                }

                var _isOff = $btn.hasClass("StateOff");

                $mobileUtil.ButtonUpdateIcon($btn, _isOff ? "check" : "delete");
                $mobileUtil.ButtonSetTextByElement($btn, _isOff ? "Show Favorites" : "Show All");

                break;

            case "toggle_fullscreen":
                $btn.addClass("LinkDisabled");

                $btn.toggleClass("StateOff");

                var _isFullscreen = !$btn.hasClass("StateOff");

                $btn.removeClass("LinkDisabled")
                    .attr("title", _isFullscreen ? "Minimize" : "Maximize");

                break;
        }
    }
};

CRepositoryController.prototype.DefaultCategoryConfiguration = function (options) {

    options = util_extend({ "CategoryID": enCE.None }, options);

    var _controller = this;

    var _categoryID = util_forceInt(options.CategoryID, enCE.None);
    var _category = util_arrFilter(_controller.Data.Categories, enColRepositoryCategoryProperty.CategoryID, _categoryID, true);

    if (_category.length == 1) {
        _category = _category[0];
    }
    else {
        _categoryID = _controller.Data.DefaultCategoryID;

        _category = util_arrFilter(_controller.Data.Categories, enColRepositoryCategoryProperty.CategoryID, _categoryID, true);
        _category = (_category.length == 1 ? _category[0] : null);
    }

    return { "ID": _categoryID, "Item": _category };
};

CRepositoryController.prototype.DefaultPopupOptions = function (options) {

    var _controller = this;    

    options = util_extend({
        "HTML": "", "Title": null, "Size": "", "IsViewMode": false, "HasFooter": true, "IsHideFooterButtons": false, "HasReturnAction": false, "IsHideScrollbar": false,
        "FooterButtonList": [],
        "OnPopupBind": function () { }, "OnPopupCloseCallback": null, "OnButtonClick": function (opts) { }, "OnPopupDismissRequested": null,
        "PopupClass": null
    }, options);

    options.Size = "EditorPopupFixed ScrollbarPrimary" + (util_forceString(options.Size) != "" ? " " + options.Size : "");

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
        "callbackClose": options.OnPopupCloseCallback,

        "Utils": {

            "ToggleIndicator": function (isEnabled) {
                $mobileUtil.PopupContainer().trigger("events.popup_toggleIndicator", { "IsEnabled": isEnabled });
            }
        }
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
};

CRepositoryController.prototype.PopupSearchResource = function (options) {

    options = util_extend({
        "ContextDataItem": null, "SourceDataList": null, "Callback": null, "Title": null, "Size": "", "IsMultiSelect": true,
        "IsRestrictDocumentTypeFilter": false,
        "IsHideScrollbar": false,   //hide scrollbar is handled manually and not part of default popup options
        "Events": {
            "OnConfigureParams": function (params) { },
            "OnSave": function (opts) { }
        },
        "LookupPropertyPathUpdates": null,
        "ListDisableSelectionID": null,   //list of IDs that should be disabled from selection
        //only applicable to single mode (i.e. not multi select)
        "DefaultSelection": {
            "Value": null,
            "ExtProperties": null
        },
        "BridgeEntity": {
            "ListPropertyPath": null,
            "Instance": null,
            "PropertyID_Name": null,
            "PropertyValue": null,
            "ParentPropertyText": null,
            "OnConfigureItem": null //format: function (opts) { ... } where opts: { "Item": "LookupItem" }
        },
        "AddActionOptions": {
            "IsEnabled": true,
            "DisableValidationIsAddVisibleUserField": false,
            "DisableSelectionScreen": false,
            "DocumentTypes": null,
            "OnWizardSelection": null,
            "OnSaveCallback": null,
            "OnClickEvent": null,
            "CanAdminComponentKOL": null
        }

    }, options);

    var _callback = function () {
        if (options.Callback) {
            options.Callback();
        }
    };

    var _controller = this;
    var _events = (options.Events || {});
    var _bridgeEntity = options.BridgeEntity;
    var _ctxDataItem = (options.ContextDataItem || {});

    var _isMultiSelect = util_forceBool(options.IsMultiSelect, true);
    var _addOptions = util_extend({
        "IsEnabled": true,
        "DisableValidationIsAddVisibleUserField": false,
        "DisableSelectionScreen": false,
        "DocumentTypes": null,
        "OnWizardSelection": null,
        "OnSaveCallback": null,
        "OnClickEvent": null
    }, options.AddActionOptions);

    //force it to default search category ID, if not specified
    if (util_forceInt(options["CategoryID"], enCE.None) == enCE.None) {
        options["CategoryID"] = _controller.Data.DefaultSearchCategoryID;
    }

    var _categoryConfig = _controller.DefaultCategoryConfiguration({ "CategoryID": options.CategoryID });
    var _categoryID = _categoryConfig.ID;
    var _category = _categoryConfig.Item;

    var _html = "";

    _category = (_category || {});

    var _categoryFields = (_category[enColCERepositoryCategoryProperty.CategoryFields] || []);

    var _onPopupBind = function () {
        var $popup = $mobileUtil.PopupContainer();
        var $vwListView = $popup.find("#vwListView");
        var $tbSearch = $popup.find("input[data-filter-property='Search']");
        var $lblResultSummary = $popup.find(".LabelDividerResult > .Label > span");
        var $vwRepeater = null;
        var _priorityColumnIndex = -1;

        var $filters = $popup.find("[data-filter-prop]");

        var _repeaterOpts = {
            "PropertyDataIdentifier": enColRepositoryResourceProperty.ResourceID,
            "SortEnum": "_repositorySearchSortEnum",
            "DefaultSortEnum": null,
            "Columns": [],            
            "LookupDefaultSelections": {},
            "LookupDisableSelections": null,
            "m_tempOrder": 1,
            "AddSelection": function (itemID, arrExtProps) {
                var _temp = {};

                _temp[this.PropertyDataIdentifier] = itemID;

                if (arrExtProps) {
                    for (var p = 0; p < arrExtProps.length; p++) {
                        var _prop = arrExtProps[p];

                        _temp[_prop.n] = _prop.v;
                    }
                }

                this.LookupDefaultSelections[itemID] = { "Order": this.m_tempOrder++, "Item": _temp };
            }
        };

        var _sortEnum = {};

        window[_repeaterOpts.SortEnum] = _sortEnum;

        //for multi-select mode, iterate through the list and add its values as selections
        if (_isMultiSelect && util_forceString(_bridgeEntity.ListPropertyPath) != "") {

            var _list = util_propertyValue(_ctxDataItem, _bridgeEntity.ListPropertyPath);

            _list = (_list || []);

            for (var v = 0; v < _list.length; v++) {
                var _bridgeItem = _list[v];

                _repeaterOpts.AddSelection(_bridgeItem[_bridgeEntity.PropertyValue],
                                           [{ "n": _bridgeEntity.ParentPropertyText, "v": _bridgeItem[_bridgeEntity.PropertyID_Name] }]);
            }
        }
        else if (!_isMultiSelect && options.DefaultSelection && util_forceInt(options.DefaultSelection["Value"], enCE.None) != enCE.None) {
            var _defaultSelection = options.DefaultSelection;

            _repeaterOpts.AddSelection(_defaultSelection.Value, _defaultSelection["ExtProperties"]);
        }

        //checkmark toggle column
        if (_isMultiSelect) {
            _repeaterOpts.Columns.push({
                "ID": "toggle_icon",
                "Content": "",
                "IsNoLink": true
            });
        }

        //download link column
        _repeaterOpts.Columns.push({
            "ID": "download_resource",
            "Content": "",
            "IsNoLink": true
        });
        
        for (var i = 0; i < _categoryFields.length; i++) {
            var _categoryField = _categoryFields[i];

            //only render the columns that are visible (note that the hidden category fields are used for the search feature)
            if (_categoryField[enColRepositoryCategoryFieldProperty.IsVisbleUserField]) {
                var _fieldID = _categoryField[enColRepositoryCategoryFieldProperty.FieldID];
                var _field = _controller.Data.LookupField[_fieldID];

                var _options = _field["_options"];

                var _isDate = (_field[enColRepositoryFieldProperty.EditorDataTypeID] == enCEEditorDataType.Date);

                _isDate = util_forceBool(_options ? _options["IsDate"] : null, _isDate);

                var _column = {
                    "Content": _field[enColRepositoryFieldProperty.Name],
                    "SortEnum": "Column_" + (i + 1),
                    "PropertyPath": _field["_propertyPath"],
                    "IsDate": _isDate,
                    "HasSearchHighlight": util_forceBool(_options ? _options["HasSearchHighlight"] : true, true)
                };

                _sortEnum[_column.SortEnum] = _field[enColRepositoryFieldProperty.FieldID];

                _column.SortEnum = _repeaterOpts.SortEnum + "." + _column.SortEnum;

                if (i == 0) {
                    _repeaterOpts.DefaultSortEnum = _column.SortEnum;
                }

                _repeaterOpts.Columns.push(_column);
            }
        }

        //item details column
        _repeaterOpts.Columns.push({
            "ID": "view_details",
            "Content": "",
            "IsNoLink": true
        });

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
                    "SortFieldID": util_forceInt(sortSetting.SortColumn, enCE.None),
                    "SortAscending": sortSetting.SortASC,
                    "PageSize": util_forceInt(sortSetting.PageSize, _controller.Data.PopupPageSize),
                    "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1),
                    "Search": $tbSearch.val(),
                    "BaseRepositoryCategoryID": _categoryID, //ensure the base category ID is set to specify the user view for the results and search/sort support
                    "ExtendedFilters": {}
                };

                $.each($filters, function () {
                    var $this = $(this);
                    var _prop = $this.attr("data-filter-prop");
                    var _val = util_forceString($this.val());

                    if ($this.is("select")) {
                        _val = util_forceInt(_val, enCE.None);
                    }                    

                    _params[_prop] = _val;
                });

                if (_events["OnConfigureParams"]) {
                    _events.OnConfigureParams.call(_controller, _params);
                }

                APP.Service.Action({ "c": "PluginEditor", "m": "RepositoryResourceUserViewList", "args": _params }, function (result) {
                    _callback(result);
                });
            }

        };  //end: _fnGetList

        var _noRecordsMsgHTML = null;
        var _popupSearchRenderOptions = _controller.Data.PopupSearchRenderOptions;

        if (_addOptions.IsEnabled && _popupSearchRenderOptions.IsEnableAddActionNoRecords) {
            _noRecordsMsgHTML = (_popupSearchRenderOptions.IsMessageHtml ? 
                                 util_forceString(_popupSearchRenderOptions.NoRecordsMessage) : 
                                 util_htmlEncode(_popupSearchRenderOptions.NoRecordsMessage)
                                ) +
                                _controller.Utils.HTML.GetButton({
                                    "CssClass": "LinkClickable ButtonThemeInvert",
                                    "Content": "Add New",
                                    "Attributes": {
                                        "data-button-id-add-new": enCETriState.Yes, "style": "margin-top: 0em;"
                                    }
                                });
        }

        if (options.ListDisableSelectionID && options.ListDisableSelectionID.length > 0) {
            _repeaterOpts.LookupDisableSelections = {};

            for (var i = 0; i < options.ListDisableSelectionID.length; i++) {
                var _id = options.ListDisableSelectionID[i];

                _repeaterOpts.LookupDisableSelections[_id] = true;
            }
        }

        var $repeater = _controller.Utils.Repeater({
            "ID": "Table_PopupSearchResource",
            "CssClass": "EditorDataAdminListTableTheme" + (_repeaterOpts.LookupDisableSelections ? " TableRenderModeHighlightStates" : ""),
            "PageSize": _controller.Data.PopupPageSize,
            "SortEnum": _repeaterOpts.SortEnum,
            "DefaultSortEnum": _repeaterOpts.DefaultSortEnum,
            "SortOrderGroupKey": "popup_PopupSearchResource",
            "IsDisablePagingFooter": false,
            "Columns": _repeaterOpts.Columns,
            "DefaultNoRecordMessage": _noRecordsMsgHTML,
            "IsNoRecordMessageHTML": (util_forceString(_noRecordsMsgHTML) != ""),
            "RepeaterFunctions": {
                "ContentRowAttribute": function (item) {
                    return util_htmlAttribute("data-attr-item-id", item[_repeaterOpts.PropertyDataIdentifier]);
                },
                "ContentRowCssClass": function (opts) {
                    var _item = opts.Item;
                    var _selected = false;
                    var _itemID = _item[_repeaterOpts.PropertyDataIdentifier];
                    var _disabled = (_repeaterOpts.LookupDisableSelections && _repeaterOpts.LookupDisableSelections[_itemID]);

                    var _lookupSelections = $vwListView.data("LookupSelections");

                    if (_lookupSelections && _lookupSelections[_itemID]) {
                        _selected = true;
                    }

                    return "EntityLineItem" + ((_disabled || (_selected && !_isMultiSelect)) ? " LinkDisabled" : "") + (_selected ? " Selected" : "");
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

                            case "view_details":
                                cellOpts.CssClass += "DisableUserSelectable LinkDisabled ViewDetailCell";
                                break;
                        }
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
                        else if (_column["ID"] == "view_details") {
                            _val = "<a class='LinkClickable ButtonThemeInvert' data-role='button' data-theme='transparent' data-mini='true' " +
                                   util_htmlAttribute("data-view-item-detail", enCETriState.Yes) + ">" +
                                   util_htmlEncode("View") +
                                   "</a>";
                            _isEncode = false;
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
                        else if (_column["ID"] == "download_resource") {
                            _val = _controller.Utils.ConstructRepositoryResourceLinkHTML({ "Item": _item });
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
                    var _numItems = util_forceInt(_list.NumItems);

                    $lblResultSummary.text("Results: " + util_formatNumber(_numItems));

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
            $tbSearch.prop("disabled", false)
                     .data("searchable-field-disable-focus-selection", true)
                     .trigger("focus")
                     .removeData("searchable-field-disable-focus-selection");

            $vwListView.toggle("height");
        });

        $popup.off("click.onAddNewItem");
        $popup.on("click.onAddNewItem", "[" + util_htmlAttribute("data-button-id-add-new", enCETriState.Yes) + "]:not(.LinkDisabled)", function () {

            var $this = $(this);
            var _fn = function (canShowAddNew, stateValue) {

                canShowAddNew = util_forceBool(canShowAddNew, true);

                if (canShowAddNew) {

                    //set flag that the current popup has an add item trigger event
                    $popup.data("is-add-item-trigger", true)
                          .data("AddNewStateValueParam", stateValue);

                    $mobileUtil.PopupClose();
                }
                else {
                    $this.removeClass("LinkDisabled");
                }

            };  //end: _fn

            $this.addClass("LinkDisabled");

            if (_addOptions.OnClickEvent) {
                _addOptions.OnClickEvent.call(this, { "Callback": _fn });
            }
            else {
                _fn(true);
            }

        }); //end: click.onAddNewItem

        //set selected items
        $vwListView.data("LookupSelections", _repeaterOpts.LookupDefaultSelections);

        //configure searchable text input
        var _propSearchText = $tbSearch.attr("data-filter-property");

        $tbSearch.val(util_forceString(_stateManager.Get(_propSearchText)))
                 .attr(DATA_ATTRIBUTE_RENDER, "searchable_field")
                 .data("SearchConfiguration",
                       {
                           "SearchableParent": $tbSearch.closest(".SearchableView"),
                           "OnRenderResult": function (result, opts) {

                               if (opts) {
                                   _stateManager.Set(_propSearchText, opts["Query"]);
                               }

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

        var _fnGetSelectionItem = function (itemID) {
            var _search = util_arrFilter($vwListView.data("DataSource").List, _repeaterOpts.PropertyDataIdentifier, itemID, true);

            return (_search.length == 1 ? _search[0] : null);

        };  //end: _fnGetSelectionItem

        //bind the repeater related additional events
        $repeater.off("click.onItemClick");
        $repeater.on("click.onItemClick", ".EntityLineItem:not(.LinkDisabled)[data-attr-item-id]", function (e) {

            var $search = $(e.target).closest("td.LinkDisabled, tr.EntityLineItem");

            if ($search.hasClass("EntityLineItem")) {

                var $this = $(this);
                var _itemID = util_forceInt($this.attr("data-attr-item-id"), enCE.None);

                var _lookupSelections = $vwListView.data("LookupSelections");

                if (!_lookupSelections) {
                    _lookupSelections = {};
                    $vwListView.data("LookupSelections", _lookupSelections);
                }

                if (!_isMultiSelect) {
                    $repeater.off("click.onItemClick");

                    //remove all selections (since can have at most only one)
                    for (var _id in _lookupSelections) {
                        delete _lookupSelections[_id];
                    }

                    _lookupSelections[_itemID] = { "Order": _repeaterOpts.m_tempOrder++, "Item": _fnGetSelectionItem(_itemID) };
                }
                else {
                    var _selected = (_lookupSelections[_itemID] ? false : true);

                    if (_selected) {
                        _lookupSelections[_itemID] = { "Order": _repeaterOpts.m_tempOrder++, "Item": _fnGetSelectionItem(_itemID) };
                    }
                    else {
                        delete _lookupSelections[_itemID];
                    }
                }

                $this.addClass("LinkDisabled");

                if (_isMultiSelect) {
                    $repeater.trigger("events.refresh_list");
                }
                else {

                    //remove current selection
                    var $selected = $repeater.find(".EntityLineItem.Selected[data-attr-item-id]");

                    $selected.removeClass("Selected");
                    $this.addClass("Selected");

                    $mobileUtil.PopupClose();
                }
            }
        });

        $repeater.off("click.onViewDetail");
        $repeater.on("click.onViewDetail", ".LinkClickable[" + util_htmlAttribute("data-view-item-detail", enCETriState.Yes) + "]:not(.LinkDisabled)", function (e, args) {

            var $this = $(this);
            var $row = $this.closest("[data-attr-item-id]");
            var _itemID = util_forceInt($row.attr("data-attr-item-id"), enCE.None);
            var _item = _fnGetSelectionItem(_itemID);
            var _clickCallback = function () {
                $this.removeClass("LinkDisabled");
            };

            $this.addClass("LinkDisabled");

            var $container = $mobileUtil.PopupContainer();

            var $anchor = $("<div id='popup_restore_" + (new Date()).getTime() + " style='display: none;' />");

            $anchor.insertBefore($container);

            $container.data("restore-scroll-top", $container.scrollTop());

            $row.addClass("Highlight");

            //detach the current popup instance
            $container.slideUp("normal", function () {
                _clickCallback();

                $anchor.data("PopupContainer", $container.detach());

                //get an instance of the search text highligher
                var _temp = {
                    "Search": $tbSearch.val()
                };

                $tbSearch.trigger("events.searchable_getHighlightEncoder", _temp);

                //show the details view popup
                _controller.PopupEditResource({
                    "EditID": _itemID,                    
                    "IsViewMode": true,
                    "FieldContentHighligher": _temp["Result"],
                    "HasReturnAction": true,
                    "OnPopupCloseCallback": function () {

                        var $prevPopup = $mobileUtil.PopupContainer();

                        var $popup = $anchor.data("PopupContainer");

                        if ($popup) {
                            $popup.insertAfter($anchor);
                            $anchor.remove();

                            $popup.trigger("events.popup_onPopupFocusOpen");
                            $popup.slideDown("normal", function () {
                                var _scrollTop = util_forceInt($popup.data("restore-scroll-top"), 0);

                                $popup.animate({ "scrollTop": _scrollTop }, function () {
                                    $popup.find(".EntityLineItem.Highlight[data-attr-item-id]")
                                          .removeClass("Highlight");

                                    var _isRebind = util_forceBool($prevPopup.data("is-refresh-trigger-view"), false);

                                    if (_isRebind) {
                                        setTimeout(function () {
                                            $repeater.trigger("events.refresh_list");
                                        }, 250);
                                    }
                                });
                            });
                        }
                    }
                });
            });

        }); //end: click.onViewDetail

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

        //bind the filters
        $.each($filters, function () {
            var $this = $(this);
            var _prop = $this.attr("data-filter-prop");
            var _val = $this.val();

            if (util_forceString(_val) == "") {
                _val = _stateManager.Get(_prop);
            }

            switch (_prop) {

                case "DocumentTypeID":

                    var _documentTypes = null;

                    if (options.IsRestrictDocumentTypeFilter && _addOptions && _addOptions.IsEnabled) {
                        _documentTypes = _addOptions.DocumentTypes;
                    }

                    if (!_documentTypes) {
                        _documentTypes = _controller.Data.DocumentTypes;
                    }

                    util_dataBindDDL($this, _documentTypes, enColRepositoryDocumentTypeProperty.Name, enColRepositoryDocumentTypeProperty.DocumentTypeID,
                                     util_forceInt(_val, enCE.None), true, enCE.None, "");
                    break;

                case "IsFileExternal":

                    var _arr = [{ "n": "Yes", "v": enCETriState.Yes }, { "n": "No", "v": enCETriState.No }];

                    util_dataBindDDL($this, _arr, "n", "v", util_forceInt(_val, enCETriState.None), true, enCETriState.None, "");
                    break;
            }

            if ($this.is("select")) {

                if ($this.prop("disabled")) {
                    $this.selectmenu("enable");
                }

                $this.off("change.onFilter");
                $this.on("change.onFilter", function () {
                    var $this = $(this);

                    _stateManager.Set($this.attr("data-filter-prop"), $this.val());

                    $repeater.trigger("events.refresh_list");
                });
            }
        });

        $tbSearch.trigger("events.searchable_submit", { "IsForceRefresh": true });

        _callback();

    };  //end: _onPopupBind

    var _srcValueList = (options.SourceDataList || []);

    var _fnOnCleanupPopup = function () {

        if (options.IsHideScrollbar) {
            var $activePage = $mobileUtil.ActivePage();
            var _scrollTop = util_forceInt($activePage.data(_controller.Data.DATA_KEY_SCROLL_TOP), -1);

            $activePage.removeData(_controller.Data.DATA_KEY_SCROLL_TOP);

            $("body").removeClass("ViewOverflowHidden");

            if (_scrollTop >= 0) {
                $("html").animate({ "scrollTop": _scrollTop }, "normal");
            }
        }

    };  //end: _fnOnCleanupPopup

    var _onPopupClose = function () {

        var $popup = $mobileUtil.PopupContainer();
        var _result = {
            "Selector": "",
            "SourceList": _srcValueList,
            "Item": _ctxDataItem,
            "List": [],
            "IsAddTrigger": util_forceBool($popup.data("is-add-item-trigger"), false),
            "AddNewStateValueParam": $popup.data("AddNewStateValueParam")
        };

        var _lookupSelections = ($popup.find("#vwListView").data("LookupSelections") || {});

        if (_isMultiSelect) {

            var _valueList = util_propertyValue(_result.Item, _bridgeEntity.ListPropertyPath);
            var _arrOrderedIDs = [];

            //iterate over the source list and add its ID to the list (requried in order to ensure source order is preserved)
            if (_valueList) {
                for (var v = 0; v < _valueList.length; v++) {
                    var _bridgeItem = _valueList[v];

                    _arrOrderedIDs.push(_bridgeItem[_bridgeEntity.PropertyValue]);
                }
            }

            //add the selection keys to the list as IDs (duplicates will be handled below within the main loop iteration)
            var _arrTemp = [];

            for (var _key in _lookupSelections) {
                var _entry = _lookupSelections[_key];
                var _order = util_forceInt(_entry["Order"], 0);

                _arrTemp.push({ "Order": _order, "Key": _key, "Value": _entry });
            }

            //sort by the Order property (to ensure it is added in the same order as user selection)
            _arrTemp.sort(function (v1, v2) {
                var _comp = 0;

                if (v1.Order < v2.Order) {
                    _comp = -1;
                }
                else if (v1.Order > v2.Order) {
                    _comp = 1;
                }

                return _comp;
            });

            for (var i = 0; i < _arrTemp.length; i++) {
                var _entry = _arrTemp[i];

                _arrOrderedIDs.push(_entry.Key);
            }

            for (var i = 0; i < _arrOrderedIDs.length; i++) {

                var _id = util_forceInt(_arrOrderedIDs[i], enCE.None);
                var _entry = _lookupSelections[_id];
                var _lookupItem = (_entry ? _entry["Item"] : null);

                //check that an item exists (in the event it was already processed)
                if (_lookupItem) {

                    //search existing list for match
                    var _bridgeItem = util_arrFilter(_valueList, _bridgeEntity.PropertyValue, _id, true);

                    if (_bridgeItem.length == 1) {
                        _bridgeItem = _bridgeItem[0];
                    }
                    else {

                        //if no match is found, then search the source data list
                        _bridgeItem = util_arrFilter(_result.SourceList, _bridgeEntity.PropertyValue, _id, true);
                        _bridgeItem = (_bridgeItem.length == 1 ? _bridgeItem[0] : null);
                    }

                    if (!_bridgeItem) {
                        _bridgeItem = new _bridgeEntity.Instance();
                    }

                    _bridgeItem[_bridgeEntity.PropertyValue] = _id;

                    if (_lookupItem[_bridgeEntity.ParentPropertyText]) {
                        _bridgeItem[_bridgeEntity.PropertyID_Name] = _lookupItem[_bridgeEntity.ParentPropertyText];
                    }

                    //allow custom configurations for the bridge item, if applicable
                    if (_bridgeEntity.OnConfigureItem) {
                        _bridgeEntity.OnConfigureItem({ "Item": _bridgeItem, "LookupItem": _lookupItem });
                    }

                    _result.List.push(_bridgeItem);

                    //remove the entry since it has been processed
                    delete _lookupSelections[_id];
                }
            }

            //set update list selections
            util_propertySetValue(_result.Item, _bridgeEntity.ListPropertyPath, _result.List);

            //include the trigger field
            _result.Selector += (_result.Selector != "" ? "," : "") + "[" + util_htmlAttribute("data-attr-prop-path", _bridgeEntity.ListPropertyPath) + "]";
        }
        else {

            var _selection = null;

            //will be at most only one selection
            for (var _id in _lookupSelections) {
                var _entry = _lookupSelections[_id];
                var _lookupItem = _entry.Item;

                if (_bridgeEntity.Instance) {
                    _selection = new _bridgeEntity.Instance();

                    _selection[_bridgeEntity.PropertyValue] = util_forceInt(_id, enCE.None);

                    if (_lookupItem[_bridgeEntity.ParentPropertyText]) {
                        _selection[_bridgeEntity.PropertyID_Name] = _lookupItem[_bridgeEntity.ParentPropertyText];
                    }
                }
                else {

                    //an instance is not provided, so force to empty object initialization
                    _selection = {};
                    _selection["ID"] = util_forceInt(_id, enCE.None);
                    _selection["Data"] = _lookupItem;
                }

                //allow custom configurations for the bridge item, if applicable
                if (_bridgeEntity.OnConfigureItem) {
                    _bridgeEntity.OnConfigureItem({ "Item": _selection, "LookupItem": _lookupItem });
                }

                break;
            }

            _result["SelectedItem"] = _selection;
        }

        if (_events["OnSave"]) {
            _events.OnSave(_result);
        }

        if (_result.IsAddTrigger) {

            setTimeout(function () {
                $popup.remove();    //remove previous instance, if applicable

                _controller.PopupWizardAddResource({
                    "DisableSelectionScreen": _addOptions.DisableSelectionScreen,
                    "DisableValidationIsAddVisibleUserField": _addOptions.DisableValidationIsAddVisibleUserField,
                    "AddNewStateValueParam": _result.AddNewStateValueParam,
                    "DocumentTypes": _addOptions.DocumentTypes,
                    "OnWizardSelection": _addOptions.OnWizardSelection,
                    "OnSaveCallback": _addOptions.OnSaveCallback,
                    "OnPopupCloseCallback": _fnOnCleanupPopup,
                    "CanAdminComponentKOL": _addOptions.CanAdminComponentKOL
                });
            }, 100);
        }
        else {
            _fnOnCleanupPopup();
        }

    };  //end: _onPopupClose

    var _stateManager = {
        "Key": null,
        "m_lookup": null,
        "Init": function () {
            var $groupComponent = $mobileUtil.Content().find("[data-home-editor-group-component-id]:first");

            this.Key = "PopupSearchResourceData_" + MODULE_MANAGER.Current.GetKey();

            if ($groupComponent.length == 1) {
                this.Key += "_Component_" + util_forceInt($groupComponent.attr("data-home-editor-group-component-id"), enCE.None);
            }

            var $body = $("body");

            this.m_lookup = $body.data(this.Key);

            if (!this.m_lookup) {
                this.m_lookup = {};
                $body.data(this.Key, this.m_lookup);
            }
        },
        "Get": function (name) {
            return this.m_lookup[name];
        },
        "Set": function (name, val) {
            if (val === null || val === undefined) {
                delete this.m_lookup[name];
            }
            else {
                this.m_lookup[name] = val;
            }
        }
    };

    _stateManager.Init();

    _html += "<div class='SearchableView EditorSearchableView PluginEditorCardView" + (_addOptions.IsEnabled ? " EditorHeaderActionEnabled" : "") + "'>" +
             "  <input data-filter-property='Search' type='text' maxlength='1000' data-role='none' placeholder='Search' disabled='disabled' " +
             util_htmlAttribute("data-searchable-field-select-on-focus", enCETriState.Yes) + " />" +
             "  <a class='SearchClearButton ButtonTheme' data-role='button' data-theme='transparent' data-icon='delete' data-iconpos='notext' title='Clear' />" +
             "</div>" +
             (_addOptions.IsEnabled ?
             "<div class='EditorHeaderActionDivider'>" +
             "  <div class='Label'>" + util_htmlEncode("Or") + "</div>" +
             "</div>" +
             "<div class='EditorHeaderActionAdd'>" +
              _controller.Utils.HTML.GetButton({
                  "CssClass": "ButtonTheme",
                  "Content": "Add New",
                  "Attributes": {
                      "data-icon": "plus", "data-button-id-add-new": enCETriState.Yes
                  }
              }) +
              "</div><br />"
              :
              ""
             ) +
             "<div class='Filter'>" +
             "  <div class='Heading'>" + util_htmlEncode("Document type:") + "</div>" +
             "  <div class='Content'>" +
             "      <select " + util_htmlAttribute("data-filter-prop", "DocumentTypeID") + " data-corners='false' data-mini='true' disabled='disabled' />" +
             "  </div>" +
             "</div>" +
             "<div class='Filter SizeFull'>" +
             "  <div class='Heading'>" + util_htmlEncode("Externally located file or link:") + "</div>" +
             "  <div class='Content' style='width: 5em;'>" +
             "      <select " + util_htmlAttribute("data-filter-prop", "IsFileExternal") + " data-corners='false' data-mini='true' disabled='disabled' />" +
             "  </div>" +
             "</div>" +
             "<div class='LabelDividerResult'>" +
             "  <div class='Label'>" +
             "      <span>" + util_htmlEncode("Results: 0") + "</span>" +
             "  </div>" +
             "</div>" +
             "<div id='vwListView' class='ListView' />";

    var _title = util_forceString(options.Title);

    if (_title == "") {
        _title = _category[enColRepositoryCategoryProperty.TitlePopupView];
    }

    if (util_forceString(_title) == "") {
        _title = _category[enColRepositoryCategoryProperty.Name];
    }

    var _popupOptions = _controller.DefaultPopupOptions({
        "PopupClass": "PopupRepositorySearch", "Title": _title, "HTML": _html, "HasFooter": false,
        "Size": options.Size, "IsViewMode": true,
        "OnPopupBind": _onPopupBind, "OnPopupCloseCallback": _onPopupClose
    });

    _popupOptions["AttributesContainer"] = util_extend({}, _popupOptions["AttributesContainer"]);
    _popupOptions.AttributesContainer[DATA_ATTRIBUTE_RENDER] = "pluginEditor_fileDisclaimer";

    var _fn = function () {
        $mobileUtil.PopupOpen(_popupOptions);
    };

    if (options.IsHideScrollbar) {
        var $activePage = $mobileUtil.ActivePage();
        var $body = $("body");

        if (!$body.hasClass("ViewOverflowHidden")) {
            $activePage.data(_controller.Data.DATA_KEY_SCROLL_TOP, $(window).scrollTop());

            $(window).scrollTop(0);
            $body.addClass("ViewOverflowHidden");
        }

        _fn();
    }
    else {
        _fn();
    }
};

CRepositoryController.prototype.PopupEditResource = function (options) {

    options = util_extend({ "EditID": null }, options);

    var _editID = util_forceInt(options.EditID, enCE.None);

    var _queue = new CEventQueue();
    var _controller = this;

    //if an existing item is being edited and the category ID is not specifed, populate it based on the data item's document type
    if (_editID != enCE.None && util_forceInt(options["CategoryID"], enCE.None) == enCE.None) {
        _queue.Add(function (onCallback) {

            APP.Service.Action({
                "c": "PluginEditor", "m": "RepositoryResourceRenderCategoryConfig", "args": {
                    "ResourceID": _editID
                }
            }, function (result) {

                result = util_extend({ "CategoryID": options["CategoryID"], "IsValidItem": true }, result);

                options["CategoryID"] = result.CategoryID;
                options["IsInvalidItem"] = !result.IsValidItem;

                onCallback();
            });

        });
    }

    _queue.Run({
        "Callback": function () {
            _controller.RenderEditResourceView.call(_controller, options);
        }
    });
};

CRepositoryController.prototype.RenderEditResourceView = function (options) {

    options = util_extend({
        "EditID": enCE.None, "CategoryID": enCE.None, "Callback": null, "OnSaveCallback": null, "Size": "",
        "IsViewMode": false, "IsImpersonateAddNewFields": false, "IsExtViewMode": false, "DisableValidationIsAddVisibleUserField": false,
        "OnPopupCloseCallback": null, "HasReturnAction": false,
        "IsPopupModeViewer": false,
        "IsHideScrollbar": false, "IsForcePopupFocus": false, "ToggleEditButton": false, "OnEditSaveCallback": null,
        "FieldContentHighligher": null, "AddNewStateValueParam": null,

        //synchronous function to determine the role level for the component (if not specified, fallback to use the repository controller which defaults to false/user role)
        "CanAdminComponentKOL": null
    }, options);

    var _callback = function () {
        if (options.Callback) {
            options.Callback();
        }
    };

    var _onTriggerSaveCallback = function (item) {

        if (options.OnSaveCallback) {
            options.OnSaveCallback({ "CategoryID": options.CategoryID, "Item": item });
        }
    };

    var _controller = this;

    var _isViewMode = util_forceBool(options.IsViewMode, false);
    var _disableValidationIsAddVisibleUserField = util_forceBool(options.DisableValidationIsAddVisibleUserField, false);
    var _editID = util_forceInt(options.EditID, enCE.None);
    var _isAddNew = (_editID == enCE.None);
    var _categoryConfig = _controller.DefaultCategoryConfiguration({ "CategoryID": options.CategoryID });
    var _categoryID = _categoryConfig.ID;
    var _category = _categoryConfig.Item;
    var _isPromptWizard = (_isAddNew && !_isViewMode);
    var _isInvalidItem = util_forceBool(options["IsInvalidItem"], false);
    var _addNewStateValueParam = util_extend({ "OnConfigureDataItem": null }, options.AddNewStateValueParam);

    var _html = "";

    _category = (_category || {});

    var _categoryFields = (_category[enColCERepositoryCategoryProperty.CategoryFields] || []);

    var _canLinkExternal = true;
    var _fnCanRenderField = function (categoryField) {

        //only include the field if current item is being edited or is an add new and supported for it
        var _ret = (!options.IsExtViewMode || !_isAddNew && !options.IsImpersonateAddNewFields ||
                    (
                        (_isAddNew || options.IsImpersonateAddNewFields) &&
                        (_disableValidationIsAddVisibleUserField || categoryField[enColRepositoryCategoryFieldProperty.IsAddVisibleUserField] == true)
                    )
                   );

        if (_ret && categoryField[enColRepositoryCategoryFieldProperty.IsRestrictViewMode] == true) {

            //check if the field is valid but the category field requires to be restricted to only view mode (i.e. not edit mode and valid items)
            _ret = (_isViewMode && !_isAddNew);
        }

        return _ret;

    };  //end: _fnCanRenderField

    var _tempFileField = util_arrFilterSubset(_categoryFields, function (searchItem) {
        var _valid = false;

        if (_fnCanRenderField(searchItem)) {

            var _fieldID = searchItem[enColRepositoryCategoryFieldProperty.FieldID];
            var _field = _controller.Data.LookupField[_fieldID];

            if (_field[enColRepositoryFieldProperty.EditorDataTypeID] == enCEEditorDataType.File) {
                _valid = true;
            }
        }

        return _valid;
    }, true);

    if (_tempFileField.length == 1) {
        _tempFileField = _tempFileField[0];

        var _fieldID = _tempFileField[enColRepositoryCategoryFieldProperty.FieldID];
        var _field = _controller.Data.LookupField[_fieldID];

        var _fieldOptions = (_field["_options"] || {});

        _canLinkExternal = util_forceBool(_fieldOptions["CanLinkExternal"], true);
    }

    _tempFileField = null;

    //wizard view
    _html += "<div class='WizardView RepositoryResourceWizard'" + (_isPromptWizard ? "" : " style='display: none;'") + ">" +
             "  <div class='Instructions'>" +
             util_htmlEncode("Please upload" + (_canLinkExternal ? " (or enter the link, if it is an external file)" : "") +
                             " to validate whether it is currently available in the system. To disregard this check, click on the 'Skip' button below.") +
             "  </div>" +
             "  <div class='Content'>" +
             "      <div class='Heading'>" + util_htmlEncode("File:") + "</div>" +
             "      <div id='clWizardFile' " + util_renderAttribute("file_upload") + " class='EditorInlineFileUploadView' " +
             util_htmlAttribute("data-attr-file-upload-exts", util_arrJoinStr(_controller.FileUploadSupportedExt || [], null, "|")) + " " +
             util_htmlAttribute("data-attr-file-upload-ref-id", "clWizardFile") + " " + util_htmlAttribute("data-attr-file-upload-css-class", "EditorFileUpload") + " " +
             util_htmlAttribute("data-attr-file-upload-can-link-external", _canLinkExternal ? enCETriState.Yes : enCETriState.No) + " " +
             util_htmlAttribute(CONTROL_FILE_UPLOAD_IS_FORCE_UPLOAD_ON_CHANGE, enCETriState.Yes) + " />" +
             "  </div>" +
             "</div>";

    //fields view
    _html += "<div class='TableInline EditorTableEdit TableRepositoryEdit" + (_isViewMode ? " ViewMode" : "") + "'" + (_isPromptWizard ? " style='display: none;'" : "") + ">";

    if (_isViewMode && options.ToggleEditButton) {
        _html += "<div class='Heading'>" +
                 _controller.Utils.HTML.GetButton({
                     "CssClass": "ButtonTheme",
                     "Content": "Edit Document",
                     "Attributes": {
                         "id": "clEditResource",
                         "data-inline": "true",
                         "data-icon": "edit",
                         "data-iconpos": "left"
                     }
                 }) +
                 "</div>";
    }

    for (var i = 0; i < _categoryFields.length && !_isInvalidItem; i++) {
        var _categoryField = _categoryFields[i];

        if (_fnCanRenderField(_categoryField)) {

            var _isRequired = _categoryField[enColRepositoryCategoryFieldProperty.IsRequired];
            var _fieldID = _categoryField[enColRepositoryCategoryFieldProperty.FieldID];
            var _field = _controller.Data.LookupField[_fieldID];
            var _fieldOptions = _field["_options"];
            var _isFile = false;
            var _inputArgs = {
                "Controller": _controller, "DataType": _field[enColRepositoryFieldProperty.EditorDataTypeID], "IsRequired": _isRequired,
                "Attributes": {}
            };

            var _name = _field[enColRepositoryFieldProperty.Name];
            var _placeholderHTML = "";

            if (_field[enColRepositoryFieldProperty.EditorDataTypeID] == enCEEditorDataType.File) {
                _inputArgs["FileUploadSupportedExt"] = _controller.FileUploadSupportedExt;
                _isFile = true;

                if (_fieldOptions) {
                    _inputArgs["CanLinkExternal"] = util_forceBool(_fieldOptions["CanLinkExternal"], true);
                }
            }

            if (_field[enColRepositoryFieldProperty.EditorDataTypeID] == enCEEditorDataType.Date && _fieldOptions) {
                _inputArgs["IsDatePickerRenderer"] = util_forceBool(_fieldOptions["IsDatePickerRenderer"]);
            }

            if (_fieldOptions) {
                util_extend(_inputArgs.Attributes, _fieldOptions["Attributes"], true);
            }

            if (_isViewMode) {
                _inputArgs["ReadOnlyDataType"] = _inputArgs.DataType;
                _inputArgs.DataType = enCEEditorDataType.Label;

                if (options.FieldContentHighligher &&
                   (_field[enColCERepositoryFieldProperty.CanSearch] || (_fieldOptions && _fieldOptions["HasViewModeCanSearch"]))) {
                    _inputArgs.Attributes["data-render-has-highlight"] = enCETriState.Yes;
                }

                _placeholderHTML += "<div class='Placeholders'>";

                switch (_inputArgs.ReadOnlyDataType) {

                    case enCEEditorDataType.FreeText:

                        _placeholderHTML += "<div class='Placeholder' />" +
                                            "<div class='Placeholder TextLine_2' />" +
                                            "<div class='Placeholder TextLine_3' />";
                        break;

                    default:

                        _placeholderHTML += "<div class='Placeholder TextLine_3' />" +
                                            "<div class='Placeholder TextLine_2' />";
                        break;
                }

                if (_inputArgs.ReadOnlyDataType == enCEEditorDataType.Text || _inputArgs.ReadOnlyDataType == enCEEditorDataType.FreeText ||
                    (_inputArgs.ReadOnlyDataType == enCEEditorDataType.Label && (_fieldOptions && _fieldOptions["IsLabelTypeLink"]))
                   ) {
                    _inputArgs.Attributes["data-render-label-type"] = "link";
                }

                //override the display name using the options, if available
                if (_fieldOptions && _fieldOptions["OverrideViewDisplayName"] && (util_forceString(_fieldOptions["OverrideViewDisplayName"]) != "")) {
                    _name = util_forceString(_fieldOptions["OverrideViewDisplayName"]);
                }

                _placeholderHTML += "</div>";
            }

            var _inputHTML = _controller.Utils.HTML.InputEditorDataType(_inputArgs);
            var _tooltipHTML = util_forceString(_field[enColRepositoryFieldProperty.TooltipHTML]);

            if (_tooltipHTML != "") {
                _tooltipHTML = "<a class='ButtonTheme IconButton' data-role='button' data-theme='transparent' data-icon='info' data-iconpos='notext' data-inline='true' />" +
                               "<div class='Content'>" + _tooltipHTML + "</div>";
            }
            else {
                _tooltipHTML = "&nbsp;";
            }

            _html += "<div class='TableBlockRow' " + util_htmlAttribute("data-attr-field-id", _fieldID) + ">" +
                     "  <div class='TableBlockCell'>" +
                     "      <span class='Title'>" + util_htmlEncode(_name) + "</span>" +
                     (_isRequired ? "<span class='LabelRequired'>*</span>" : "") +
                     "  </div>" +
                     "  <div class='TableBlockCell" + (_isViewMode ? " EditorElementPlaceholderOn" : " EditInputCell") + "'>" +
                     _placeholderHTML + _inputHTML + (_isFile && !_isViewMode ? "<div class='FileDetailView' />" : "") +
                     "  </div>" +
                     "  <div class='TableBlockCell TooltipView'>" + _tooltipHTML + "</div>" +
                     "</div>";
        }
    }

    _html += "</div>";

    var _fnIndicator = null;

    var _onPopupBind = function () {
        var $popup = $mobileUtil.PopupContainer();

        if (options.IsForcePopupFocus) {
            $popup.trigger("events.popup_onPopupFocusOpen");
        }

        var $container = $popup.find(".TableRepositoryEdit");
        var $wizard = $popup.find(".WizardView");
        var $footer = $popup.find(".PopupContent > .Footer");

        var $btnSkip = _controller.Utils.HTML.GetButton({
            "ActionButtonID": "popup_wizardSkip",
            "CssClass": "ButtonTheme",
            "Content": "Skip",
            "Attributes": {
                "data-inline": "true",
                "data-icon": "arrow-r",
                "data-iconpos": "left"
            }
        });

        $btnSkip = $($btnSkip);
        $btnSkip.hide();

        $footer.prepend($btnSkip)
               .trigger("create");

        var $wizardFileUpload = $wizard.find("#clWizardFile");

        var _fnGetOnFileUploadCallback = function ($vw, opts) {

            opts = util_extend({
                "ID": null,
                "ElementFileUpload": null, "RenderContainer": null, "IsInputMode": false, "IsDisplayWarningMessage": true,
                "IsPrependMessage": false, "IsBindExternalFileEvents": false,
                "OnValidationSuccess": function () { }
            }, opts);

            var $element = $(opts.RenderContainer);
            var $fileUpload = $(opts.ElementFileUpload);
            var _isInputMode = util_forceBool(opts.IsInputMode, false);
            var _id = util_forceString(opts.ID, "");

            if (_id == "") {
                _id = renderer_uniqueID();
            }

            if ($element.length == 0) {
                $element = $vw.children(".Content:first");
            }

            var _onValidationSuccess = opts.OnValidationSuccess;
            var _displayWarningMessage = util_forceBool(opts.IsDisplayWarningMessage, false);
            var _prependMessage = util_forceBool(opts.IsPrependMessage, false);

            var _ret = function (opts) {

                var _isExternal = util_forceBool(opts["HasExternalFile"], false);
                var _md5 = util_forceString(opts["MD5"]);
                var _fnProcessSearch = function (opts) {

                    var _results = (opts && opts.Data ? opts.Data.List : null);

                    _results = (_results || []);

                    var _hasResults = (_results.length > 0);

                    if (_displayWarningMessage) {

                        var $lbl = $element.data("LabelDuplicateFileMessage");

                        if (!$lbl) {

                            $lbl = $("<div class='LabelFileUploadDuplicateError'>" +
                                     "  <a data-role='button' data-icon='info' data-iconpos='notext' data-theme='transparent' data-inline='true' />" +
                                     "  <div class='Label'>" + util_htmlEncode("The file is currently available in the system.") + "</div>" +
                                     "</div>");
                            $lbl.hide();

                            if (_prependMessage) {
                                var $list = $vw.find("#" + _id);

                                $lbl.insertBefore($list);
                            }
                            else {
                                $element.prepend($lbl);
                            }

                            $lbl.trigger("create");

                            $element.data("LabelDuplicateFileMessage", $lbl);
                        }

                        $lbl.toggle(_hasResults);
                    }

                    if (!_hasResults) {
                        if ((!_isExternal || (_isExternal && util_forceString($vw.data("FileExternalMD5")) != "")) && _onValidationSuccess) {
                            _onValidationSuccess();
                        }
                    }
                    else {

                        //duplicates were found, so inform user to try again
                        AddUserError("The file is currently available in the system.", { "IsTimeout": true, "IsDurationLong": true });
                    }
                };

                if (_isExternal) {
                    _md5 = util_forceString(opts["URL"]);
                }

                $vw.data("FileExternalMD5", _md5)
                   .data("IsExternalLink", _isExternal);

                if (_isExternal) {
                    $vw.removeData("FileOriginalName");
                }
                else {
                    $vw.data("FileOriginalName", util_forceString(opts["OriginalFileName"]));
                }

                $fileUpload.data("UploadResult", opts);   //persist the upload success options
                
                if (!_isInputMode && _md5 == "") {
                    _fnProcessSearch(null);
                }
                else {

                    var $repeater = $vw.data("Repeater");

                    if (!$repeater) {

                        var _columns = [];

                        _columns.push({
                            "IsNoLink": true,
                            "Content": "",
                            "ID": "download"
                        });

                        _columns.push({ "Content": "Title", "SortEnum": "enColRepositoryResource.Name", "Property": enColRepositoryResourceProperty.Name });
                        _columns.push({
                            "Content": "Document Type", "SortEnum": "enColRepositoryResource.DocumentTypeIDName",
                            "Property": enColRepositoryResourceProperty.DocumentTypeIDName
                        });

                        _columns.push({
                            "Content": "File", "SortEnum": "enColRepositoryResource.FileDisplayName",
                            "Property": enColRepositoryResourceProperty.FileDisplayName
                        });

                        _columns.push({
                            "Content": "Added On", "SortEnum": "enColRepositoryResource.DateAdded",
                            "Property": enColRepositoryResourceProperty.DateAdded,
                            "IsDate": true
                        });

                        _columns.push({
                            "Content": "Last Modified", "SortEnum": "enColRepositoryResource.DateModified",
                            "Property": enColRepositoryResourceProperty.DateModified,
                            "IsDate": true
                        });

                        $repeater = _controller.Utils.Repeater({
                            "ID": _id,
                            "CssClass": "EditorDataAdminListTableTheme",
                            "PageSize": 10,
                            "SortEnum": "enColRepositoryResource",
                            "DefaultSortEnum": "enColRepositoryResource.Name",
                            "SortOrderGroupKey": "repository_wizard_search",
                            "Columns": _columns,
                            "RepeaterFunctions": {
                                "ContentRowAttribute": function (item) {
                                    return util_htmlAttribute("data-attr-item-id", item[enColRepositoryResourceProperty.ResourceID]);
                                },
                                "ContentRowCssClass": function (opts) {
                                },
                                "FieldCellOption": function (cellOpts) {

                                    if (cellOpts.Index == 0) {
                                        cellOpts["ForceHorizontalAlign"] = true;
                                    }

                                    return cellOpts;
                                },
                                "FieldValue": function (opts) {
                                    var _val = "";
                                    var _item = opts.Item;
                                    var _isEncode = true;
                                    var _isNewLineEncode = false;

                                    if (opts.IsContent) {
                                        var _column = _columns[opts.Index];

                                        switch (_column["ID"]) {

                                            case "download":

                                                _val = _controller.Utils.ConstructRepositoryFileHTML({ "Item": _item });

                                                _isEncode = false;
                                                break;

                                            default:
                                                var _property = _column.Property;

                                                _val = util_propertyValue(_item, _property);

                                                if (_column["IsDate"]) {
                                                    _val = util_FormatDateTime(_val, "", null, true, { "ForceDayPadding": true, "IsValidateConversion": true });
                                                }

                                                break;
                                        }
                                    }

                                    _val = (_isEncode ? util_htmlEncode(_val, _isNewLineEncode) : util_forceString(_val));

                                    return _val;
                                },
                                "GetData": function (element, sortSetting, callback) {

                                    var _params = {
                                        "DocumentTypeID": util_forceInt(_category[enColRepositoryCategoryProperty.ContextDocumentTypeID], enCE.none),
                                        "SearchExternalMD5": $vw.data("FileExternalMD5"),
                                        "SearchFileName": util_forceString($vw.data("FileOriginalName")),
                                        "IsExternalLinkSearch": (util_forceBool($vw.data("IsExternalLink"), false) ? enCETriState.Yes : enCETriState.None),
                                        "ExcludeResourceID": util_forceInt($mobileUtil.GetClosestAttributeValue($vw, "data-resource-edit-item-id"), enCE.None),
                                        "SortColumn": sortSetting.SortColumn,
                                        "SortAscending": sortSetting.SortASC,
                                        "PageSize": util_forceInt(sortSetting.PageSize, PAGE_SIZE),
                                        "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
                                    };

                                    //if no MD5 is available, then return empty results (required parameter for search)
                                    if (util_forceString(_params.SearchExternalMD5) == "") {
                                        callback(null);
                                    }
                                    else {

                                        _fnIndicator(true);

                                        APP.Service.Action({
                                            "_indicators": false, "c": "PluginEditor", "m": "RepositoryResourceSearchFileMD5", "args": _params
                                        }, function (result) {
                                            _fnIndicator(false);
                                            callback(result);
                                        });
                                    }
                                },
                                "BindComplete": function (opts) {

                                    var _list = util_extend({ "List": null, "NumItems": null }, opts.Data);
                                    var $repeater = $vw.data("Repeater");

                                    if ($repeater.data("OnCallback")) {
                                        var _fn = $repeater.data("OnCallback");

                                        _fn({ "Element": $repeater, "Data": _list });

                                        $repeater.removeData("OnCallback");
                                    }

                                    var _hasData = (_list.List && _list.List.length > 0);

                                    if ($repeater.data("is-init") && _hasData) {

                                        $repeater.data("is-init", true)
                                                 .slideDown("normal");
                                    }
                                    else {

                                        var _visible = $repeater.is(":visible");

                                        if (_visible && !_hasData) {
                                            $repeater.slideUp("normal");
                                        }
                                        else if (!_visible && _hasData) {
                                            $repeater.slideDown("normal");
                                        }
                                    }
                                }
                            }
                        });

                        $element.append($repeater);
                        $mobileUtil.refresh($repeater);

                        $vw.data("Repeater", $repeater);

                        $repeater.hide()
                                 .data("is-init", true);
                    }

                    var _fn = function () {
                        $repeater.data("OnCallback", _fnProcessSearch)
                                 .trigger("events.refresh_list", { "NavigatePageNo": 1 });
                    };

                    if (_isInputMode) {
                        setTimeout(_fn, 500);
                    }
                    else {
                        _fn();
                    }
                }
            };

            $fileUpload.off("events.onFileUploadRefreshMD5");
            $fileUpload.on("events.onFileUploadRefreshMD5", function (e, args) {
                _ret.call(this, args);
            });

            if (opts.IsBindExternalFileEvents) {
                $fileUpload.off("events.fileUpload_onSubmitExtInput");
                $fileUpload.on("events.fileUpload_onSubmitExtInput", function (e, args) {
                    $fileUpload.trigger("events.onFileUploadRefreshMD5", args);
                });
            }

            return _ret;

        };  //end: _fnGetOnFileUploadCallback

        $wizardFileUpload.data(CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK,
                               _fnGetOnFileUploadCallback($wizard, {
                                   "ID": "tblWizardRepositoryResource",
                                   "IsPrependMessage": true,
                                   "ElementFileUpload": $wizardFileUpload,
                                   "IsBindExternalFileEvents": true,
                                   "OnValidationSuccess": function () {

                                       //no duplicates were found, so navigate to the edit screen
                                       $btnSkip.trigger("click.wizard");
                                   }
                               }));

        $popup.data("PopupData", {
            "CategoryID": _categoryID,
            "CategoryItem": _category,
            "EditID": _editID,
            "DataItem": null
        });

        _fnIndicator(true);

        var $inputs = $container.find("[data-attr-input-data-type][" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");

        $container.off("events.onActionInputEditorDataType");
        $container.on("events.onActionInputEditorDataType",
                      ".LabelContent", function (e, args) {

                          if (args.EditorDataTypeID == enCEEditorDataType.File) {

                              args.Value = _controller.Utils.ConstructRepositoryFileHTML({
                                  "Item": args.Item,
                                  "IsIncludeFileName": true,
                                  "NotAvailableMessageHTML": util_htmlEncode("There is no file associated."),
                                  "HighlightEncoder": args["HighlightEncoder"]
                              });

                              args.IsHTML = true;
                          }
                          else if (!args.IsHTML) {
                              var $this = $(this);
                              var _labelType = $this.attr("data-render-label-type");

                              switch (_labelType) {

                                  case "link":

                                      args.Value = _controller.Utils.HTML.ParseTextLinkHTML(args.Value, {
                                          "linkClass": "LinkExternal WordBreak", "HighlightEncoder": args["HighlightEncoder"]
                                      });
                                      args.IsHTML = true;
                                      break;
                              }
                          }

                      }); //end: events.onActionInputEditorDataType

        $container.off("events.bind");
        $container.on("events.bind", function (e, args) {

            args = util_extend({ "Item": null, "Callback": null }, args);

            var _callback = function () {
                if (args.Callback) {
                    args.Callback();
                }
            };

            var _item = args.Item;

            if (!_item) {
                _item = new CERepositoryResource();
            }

            $popup.data("PopupData").DataItem = _item;
            $popup.attr("data-resource-edit-item-id", util_forceInt(_item[enColRepositoryResourceProperty.ResourceID], enCE.None));

            var _queue = new CEventQueue();

            _queue.Add(function (onCallback) {

                var _opts = {
                    "List": _controller.Data.Fields,
                    "OnSetFieldListData": function (opts) {

                        opts = util_extend({ "FieldID": enCE.None, "Data": null, "InstanceType": null, "PropertyText": null, "PropertyValue": null }, opts);

                        var _search = util_arrFilter(this.List, enColRepositoryFieldProperty.FieldID, opts.FieldID, true);

                        if (_search.length == 1) {
                            _search = _search[0];
                            _search["_renderList"] = {
                                "InstanceType": opts.InstanceType,
                                "PropertyText": opts.PropertyText,
                                "PropertyValue": opts.PropertyValue,
                                "Data": (opts.Data || [])
                            };
                        }
                        else {
                            _search = null;
                        }

                        return _search;
                    }, "Callback": onCallback
                };

                var _platformFieldID = util_forceInt("%%TOK|ROUTE|PluginEditor|RepositoryPlatformFieldID%%", enCE.None);

                if (_platformFieldID != enCE.None) {
                    _opts.OnSetFieldListData({
                        "FieldID": _platformFieldID, "Data": ("%%TOK|ROUTE|PluginEditor|PlatformListRepositorySupported%%" || []),
                        "InstanceType": CERepositoryResourcePlatform,
                        "PropertyText": enColPlatformProperty.DisplayName, "PropertyValue": enColPlatformProperty.PlatformID
                    });
                }

                _controller.ProjectOnPopulateFieldListData(_opts);
            });

            _queue.Add(function (onCallback) {

                $.each($inputs, function () {
                    var $this = $(this);
                    var _fieldID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-field-id"), enCE.None);
                    var _field = _controller.Data.LookupField[_fieldID];
                    var _propertyPath = _field["_propertyPath"];

                    if (_propertyPath || _field[enColRepositoryFieldProperty.EditorDataTypeID] == enCEEditorDataType.UserControl) {

                        if (_field[enColRepositoryFieldProperty.EditorDataTypeID] == enCEEditorDataType.UserControl) {
                            $this.data("IndicatorToggle", _fnIndicator);
                        }

                        _controller.Utils.Actions.InputEditorDataType({
                            "Controller": _controller, "Element": $this, "DataItem": _item, "FieldItem": _field, "IsGetValue": false,
                            "FieldContentHighligher": options.FieldContentHighligher
                        });
                    }
                    else {

                        $this.closest("[data-attr-field-id]").hide();

                        if (util_queryString("IsDebug") == enCETriState.Yes) {
                            util_logError("Property Path not available for field :: " + _fieldID + " | " + _field[enColRepositoryFieldProperty.Name]);
                        }
                    }
                });

                if (!_isViewMode) {

                    //search for custom user controls and initialize the views
                    $.each($popup.find(".CRepositoryViewUserControl"), function () {
                        (function ($this) {
                            _queue.Add(function (onCallback) {
                                $this.trigger("events.onInitUserControl", { "CanAdminComponentKOL": options.CanAdminComponentKOL, "Callback": onCallback });
                            });
                        })($(this));
                    });
                }

                onCallback();
            });

            _queue.Add(function (onCallback) {

                var $vwFileDetail = $container.find(".FileDetailView:first");
                
                $vwFileDetail.off("events.fileDetail_setFileSummary");
                $vwFileDetail.on("events.fileDetail_setFileSummary", function (e, args) {

                    args = util_extend({ "Item": null, "UploadOptions": null, "ExternalFileOptions": null }, args);

                    var _item = args.Item;
                    var _isFileUpload = false;
                    var _isExtFile = false;

                    //check if the upload options are related to external file options
                    if (!args.ExternalFileOptions && args.UploadOptions && args.UploadOptions["HasExternalFile"]) {
                        var _temp = args.UploadOptions;

                        delete args.UploadOptions;
                        args.ExternalFileOptions = _temp;
                    }

                    if (args["UploadOptions"]) {
                        _isFileUpload = true;

                        //construct temp object for the file upload details (to be used for constructing the download HTML)
                        _item = {};

                        _item["PreviewFileURL"] = args.UploadOptions["PreviewFileURL"];
                        _item["OriginalFileName"] = args.UploadOptions["OriginalFileName"];
                        _item["UploadFileName"] = args.UploadOptions["UploadFileName"];
                    }
                    else if (args.ExternalFileOptions) {

                        _isFileUpload = true;
                        _isExtFile = true;

                        _item = {};
                        _item["OriginalFileName"] = args.ExternalFileOptions["URL"];
                        _item["PreviewFileURL"] = args.ExternalFileOptions["URL"];

                        if (!args.ExternalFileOptions["HasExternalFile"]) {
                            var _prevItem = $vwFileDetail.data("LastFileItem");

                            if (_prevItem) {
                                _isFileUpload = _prevItem.IsFileUpload;
                                _item = _prevItem.Item;
                            }
                        }
                    }

                    if (!_isFileUpload && !_item) {
                        _item = new CERepositoryResource();
                    }

                    if (!_isExtFile) {
                        $vwFileDetail.data("LastFileItem", { "IsFileUpload": _isFileUpload, "Item": _item });
                    }

                    $vwFileDetail.html(_controller.Utils.ConstructRepositoryFileHTML({
                        "IsFileUpload": _isFileUpload,
                        "Item": _item, "IsIncludeFileName": true,
                        "HasRemoveFileButton": !_isViewMode,
                        "NotAvailableMessageHTML": ""
                    }));

                    $vwFileDetail.trigger("create");

                });  //end: events.fileDetail_setFileSummary

                $vwFileDetail.off("click.fileDetail_remove");
                $vwFileDetail.on("click.fileDetail_remove", ".ButtonRemoveFile:not(.LinkDisabled)", function () {

                    var $btn = $(this);
                    var _onClickCallback = function () {
                        $btn.removeClass("LinkDisabled");
                    };

                    $btn.addClass("LinkDisabled");

                    dialog_confirmYesNo("Remove File", "Are you sure you want to remove the current file?", function () {

                        //find the file upload control for the current field item
                        var $field = $vwFileDetail.closest("[data-attr-field-id]");
                        var $fileUpload = $field.find("[" + util_renderAttribute("file_upload") + "]");

                        //clear the current file upload, if applicable
                        $fileUpload.trigger("events.fileUpload_clear");
                        
                        var _uploadOpts = {};

                        _uploadOpts["ElementRefID"] = $fileUpload.attr("data-attr-file-upload-ref-id");
                        _uploadOpts["IsDisableDataOptions"] = true;  //set flag that the upload event is being triggered manually and disable data modifications on element

                        renderer_event_file_upload_success(_uploadOpts);    //trigger the file upload event with cleared file

                        //set flag for file upload control that source file should be deleted
                        $fileUpload.data("FileUploadIsDeleteSource", true);

                        $vwFileDetail.trigger("events.fileDetail_setFileSummary", null);

                        _onClickCallback();

                    }, _onClickCallback);

                }); //end: click.fileDetail_remove

                $vwFileDetail.trigger("events.fileDetail_setFileSummary", { "Item": _item });

                onCallback();
            });

            _queue.Run({ "Callback": _callback });

        }); //end: events.bind

        $popup.off("events.setFooterButtonState");
        $popup.on("events.setFooterButtonState", function (e, args) {

            args = util_extend({ "IsWizardMode": false }, args);

            var $list = $footer.find("[data-attr-editor-controller-action-btn]");
            var _selector = "";

            if (args.IsWizardMode) {
                _selector = "[data-attr-editor-controller-action-btn='popup_wizardSkip']";
            }
            else {
                _selector = ":not([data-attr-editor-controller-action-btn='popup_wizardSkip'])";
            }

            var $current = $list.filter(_selector);

            $list.not($current).hide();
            $current.show();
        });

        $popup.off("events.onSaveEntity");
        $popup.on("events.onSaveEntity", function (e, args) {

            args = util_extend({ "Callback": null }, args);

            var $popup = $mobileUtil.PopupContainer();
            var _popupData = $popup.data("PopupData");
            var _item = _popupData.DataItem;

            var _onSaveCallback = function (isClose) {
                if (args.Callback) {
                    args.Callback(isClose);
                }
            };

            ClearMessages();

            var _isAddNew = (util_forceInt(_item[enColRepositoryResourceProperty.ResourceID], enCE.None) == enCE.None);

            if (_isAddNew && util_forceInt(_item[enColRepositoryResourceProperty.DocumentTypeID], enCE.None) == enCE.None) {

                //initialize the document type (based on the category item)
                var _category = _popupData.CategoryItem;

                _item[enColRepositoryResourceProperty.DocumentTypeID] = _category[enColRepositoryCategoryProperty.ContextDocumentTypeID];
            }

            $.each($inputs, function () {
                var $this = $(this);
                var _fieldID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-field-id"), enCE.None);
                var _field = _controller.Data.LookupField[_fieldID];
                var _fieldOptions = _field["_options"];
                var _propertyPath = _field["_propertyPath"];
                var _editorDataTypeID = _field[enColRepositoryFieldProperty.EditorDataTypeID];
                var _isUserControl = (_editorDataTypeID == enCEEditorDataType.UserControl);

                if (_propertyPath || _isUserControl) {
                    var _isDate = (_editorDataTypeID == enCEEditorDataType.Date);
                    var _isFile = (_editorDataTypeID == enCEEditorDataType.File);

                    var _handled = false;
                    var _value = _controller.Utils.Actions.InputEditorDataType({
                        "Controller": _controller, "Element": $this,
                        "IsPrimitiveType": (_isDate || _isUserControl ? false : true)
                    });

                    if (_isDate) {
                        var _isFullDate = _value.IsFullDate();
                        var _propertyIsFullDate = null;

                        if (_fieldOptions && util_forceString(_fieldOptions["PropertyIsFullDate"]) != "") {
                            _propertyIsFullDate = _fieldOptions["PropertyIsFullDate"];
                        }

                        _value = _value.ToDate();

                        if (util_forceString(_propertyIsFullDate) != "") {
                            util_propertySetValue(_item, _propertyIsFullDate, _isFullDate);
                        }
                    }
                    else if (_isUserControl) {

                        var _val = util_extend({ "ItemValue": null, "ExtPropertyValues": {} }, _value);

                        if (_val.ExtPropertyValues) {
                            for (var _prop in _val.ExtPropertyValues) {
                                var _extValue = _val.ExtPropertyValues[_prop];

                                util_propertySetValue(_item, _prop, _extValue);
                            }
                        }

                        //only set the updated value if it has a property path
                        if (_propertyPath) {
                            _value = _val.ItemValue;
                        }
                        else {
                            _handled = true;
                        }
                    }
                    else if (_isFile) {

                        _handled = true;    //set flag this property path does not update the value and is handled

                        //set the property for the temp file item value (if available)
                        if (_fieldOptions && util_forceString(_fieldOptions["PropertyTempFileItem"]) != "") {
                            var _propertyTempFileItem = _fieldOptions["PropertyTempFileItem"];
                            var _fileItem = _value["FileItem"];

                            util_propertySetValue(_item, _propertyTempFileItem, _fileItem);

                            if (!_fileItem && _value["IsDeleteSource"] == true) {

                                //remove the value for the current property path (since it is a field ID value and should support null, i.e. deleted/not available)
                                util_propertySetValue(_item, _propertyPath, null);
                            }
                            else if (_fileItem && _fileItem[enColFileProperty.IsExternal] === true && util_trim(_fileItem[enColFileProperty.ExternalLink]) == "") {
                                AddUserError("External file / link is required.");
                            }
                        }
                    }

                    if (!_handled) {
                        util_propertySetValue(_item, _propertyPath, _value);
                    }

                    //validate the field
                    var _isRequired = (util_forceInt($this.attr("data-attr-input-is-required"), enCETriState.None) == enCETriState.Yes);

                    if (_isRequired && !$this.data("is-valid")) {
                        AddUserError(_field[enColRepositoryFieldProperty.Name] + " is required.");
                    }
                }
            });

            if (MessageCount() == 0) {

                _fnIndicator(true);

                APP.Service.Action({
                    "_action": "SAVE", "_indicators": false,
                    "c": "PluginEditor", "m": "RepositoryResourceSave", "args": {
                        "Item": util_stringify(_item),
                        "DeepSave": true
                    },
                    "_eventArgs": {
                        "Options": {
                            "CallbackGeneralFailure": function () {
                                _fnIndicator(false);
                                _onSaveCallback(false);
                            }
                        }
                    }
                }, function (item) {

                    _popupData.DataItem = item;

                    AddMessage("File has been successfully updated.");
                    _fnIndicator(false);
                    
                    setTimeout(function () {
                        _onSaveCallback(true);

                        if (_onTriggerSaveCallback) {
                            _onTriggerSaveCallback(item);
                        }

                        //check to make sure the DOM element exists, in the event it is executed from external code
                        if (_controller.DOM.View) {
                            _controller.BindListView(); //refresh the list view (since fields selected have been updated)
                        }
                    }, 1000);

                });
            }
            else {
                _onSaveCallback(false);
            }

        }); //end: events.onSaveEntity

        $popup.trigger("events.setFooterButtonState", { "IsWizardMode": _isPromptWizard });

        $btnSkip.off("click.wizard");
        $btnSkip.on("click.wizard", function (e, args) {

            args = util_extend({ "Trigger": null }, args);

            var $triggerFileUpload = $(args.Trigger);

            if ($triggerFileUpload.length == 0 && $wizardFileUpload.data("UploadResult")) {
                $triggerFileUpload = $wizardFileUpload;
            }

            if (!$btnSkip.hasClass("LinkDisabled")) {
                $btnSkip.addClass("LinkDisabled");

                $wizard.slideUp(700, function () {                    
                    $container.slideDown(700, function () {
                        $popup.trigger("events.setFooterButtonState", { "IsWizardMode": false });
                        $btnSkip.removeClass("LinkDisabled");

                        if ($triggerFileUpload && $triggerFileUpload.length == 1) {

                            var _uploadOpts = $triggerFileUpload.data("UploadResult");

                            if (_uploadOpts) {

                                //trigger upload event for edit screen file upload control
                                var $fileUpload = $container.find("[" + util_renderAttribute("file_upload") + "][data-attr-file-upload-ref-id]:first");

                                _uploadOpts["ElementRefID"] = $fileUpload.attr("data-attr-file-upload-ref-id");

                                //clear upload instance (to ensure file is not deleted when element is removed)
                                $triggerFileUpload.trigger("events.fileUpload_clear", { "IsDeleteUploadFile": false });

                                //refresh current file upload with updated details
                                $fileUpload.trigger("events.fileUpload_clear", {
                                    "IsDeleteUploadFile": false,
                                    "DefaultFileUploadURL": _uploadOpts["PreviewFileURL"],
                                    "DefaultFileUploadOriginalName": _uploadOpts["OriginalFileName"],
                                    "DefaultFileUploadName": _uploadOpts["UploadFileName"]
                                });

                                renderer_event_file_upload_success(_uploadOpts);
                            }
                        }
                    });
                });
            }
        });

        if (options.ToggleEditButton) {
            var $clEditResource = $popup.find("#clEditResource");

            $clEditResource.off("click.onEditResource");
            $clEditResource.on("click.onEditResource", function () {

                if (!$clEditResource.hasClass("LinkDisabled")) {

                    var _resourceID = util_forceInt($popup.data("ResourceID"), enCE.None);

                    if (_resourceID != enCE.None) {

                        $clEditResource.addClass("LinkDisabled");

                        $popup.slideUp(750, function () {

                            var $prevPopup = $popup.detach();   //detach current popup and persist it (will use its remove event for close callback)

                            setTimeout(function () {

                                _controller.PopupEditResource({
                                    "EditID": _resourceID,
                                    "IsViewMode": false,
                                    "Callback": function () {
                                        $clEditResource.removeClass("LinkDisabled");
                                    },
                                    "OnSaveCallback": options.OnEditSaveCallback,
                                    "OnPopupCloseCallback": function () {
                                        $prevPopup.remove();    //remove the previous popup to trigger the close callback from its instance
                                    },
                                    "CanAdminComponentKOL": options.CanAdminComponentKOL
                                });
                            }, 100);

                        });
                    }
                }

            }); //end: click.onEditResource
        }

        var _queueLoadDataItem = new CEventQueue();
        var _dataItem = null;

        _queueLoadDataItem.Add(function (onCallback) {

            APP.Service.Action({
                "_indicators": false, "c": "PluginEditor", "m": "RepositoryResourceGetByPrimaryKey", "args": {
                    "ResourceID": _editID,
                    "DeepLoad": true
                }
            }, function (item) {
                _dataItem = item;
                onCallback();
            });

        });

        if (_isAddNew && _addNewStateValueParam && _addNewStateValueParam["OnConfigureDataItem"]) {
            _queueLoadDataItem.Add(function (onCallback) {
                _addNewStateValueParam.OnConfigureDataItem.call(_controller, { "DataItem": _dataItem, "Callback": onCallback, "AddNewStateValueParam": _addNewStateValueParam });
            });
        }

        _queueLoadDataItem.Add(function (onCallback) {

            var _canBind = true;

            if (_isViewMode && !_isAddNew &&
                     (!_dataItem || util_forceInt(_dataItem[enColRepositoryResourceProperty.ResourceID], enCE.None) == enCE.None)) {
                _canBind = false;
            }
            else if (_isAddNew || util_forceInt(_dataItem[enColRepositoryResourceProperty.ResourceID], enCE.None) == enCE.None) {

                //for add new items, set owner to be the current user ID
                _dataItem[enColRepositoryResourceProperty.UserID] = global_AuthUserID();
            }            

            if (_canBind) {

                $popup.data("ResourceID", _dataItem[enColRepositoryResourceProperty.ResourceID]);

                $container.trigger("events.bind", {
                    "Item": _dataItem, "Callback": function () {

                        //remove the placeholders, if applicable
                        if (_isViewMode) {
                            setTimeout(function () {
                                $container.find(".EditorElementPlaceholderOn")
                                          .removeClass("EditorElementPlaceholderOn");
                            }, 100);
                        }
                        else {

                            //configure the file upload control to validate against duplicate entries (MD5 checksum validation)
                            var $fileUpload = $container.find("[" + util_renderAttribute("file_upload") + "][data-attr-file-upload-ref-id]:first");
                            var $temp = $("<div class='Content' />");

                            $fileUpload.closest(".TableBlockCell").append($temp);

                            $fileUpload.data("OnValidateFileUploadMD5", _fnGetOnFileUploadCallback($container, {
                                "ID": "tblValidationRepositoryResource",
                                "ElementFileUpload": $fileUpload,
                                "RenderContainer": $temp,
                                "IsInputMode": true
                            }));

                            $fileUpload.off("events.onFileUploadSuccess");
                            $fileUpload.on("events.onFileUploadSuccess", function (e, args) {

                                args = util_extend({ "UploadOptions": null }, args);

                                var _fn = $fileUpload.data("OnValidateFileUploadMD5");

                                _fn.call($fileUpload, args.UploadOptions);

                                var $vwFileDetail = $fileUpload.data("ElementFileDetail");

                                if (!$vwFileDetail || $vwFileDetail.length == 0) {
                                    $vwFileDetail = $container.find(".FileDetailView");
                                    $fileUpload.data("ElementFileDetail", $vwFileDetail);
                                }

                                $vwFileDetail.trigger("events.fileDetail_setFileSummary", { "UploadOptions": args.UploadOptions });
                            });

                            $fileUpload.off("events.fileUpload_onSubmitExtInput");
                            $fileUpload.on("events.fileUpload_onSubmitExtInput", function (e, args) {

                                $fileUpload.trigger("events.fileUpload_onToggleExternalLink", args)
                                           .trigger("events.onFileUploadRefreshMD5", args);
                            }); //end: events.fileUpload_onSubmitExtInput

                            $fileUpload.off("events.fileUpload_onToggleExternalLink");
                            $fileUpload.on("events.fileUpload_onToggleExternalLink", function (e, args) {

                                var $vwFileDetail = $fileUpload.data("ElementFileDetail");

                                if (!$vwFileDetail || $vwFileDetail.length == 0) {
                                    $vwFileDetail = $container.find(".FileDetailView");
                                    $fileUpload.data("ElementFileDetail", $vwFileDetail);
                                }

                                $vwFileDetail.trigger("events.fileDetail_setFileSummary", { "ExternalFileOptions": args });
                            });
                        }

                        _fnIndicator(false);
                        onCallback();
                    }
                });
            } else {

                if (!_isInvalidItem) {
                    $popup.find(".PopupHeaderTitle").text("Error");
                    $popup.find(".PopupContent:first")
                          .html("<div style='vertial-align: top;'>" +
                                "<a class='ButtonTheme' data-role='button' data-inline='true' data-theme='transparent' data-icon='info' data-iconpos='notext' " +
                                "style='margin: 0em; margin-right: 0.25em; cursor: default;' />" + util_htmlEncode(MSG_CONFIG.ItemNotFound) +
                                "</div>")
                          .trigger("create");
                }

                $popup.data("is-refresh-trigger-view", true);   //set flag that the triggered view should rebind
                _fnIndicator(false);
                onCallback();
            }
        });

        _queueLoadDataItem.Run();

    };  //end: _onPopupBind

    var _title = (_isViewMode ? _category[enColRepositoryCategoryProperty.TitlePopupView] : _category[enColRepositoryCategoryProperty.TitlePopupEdit]);

    if (util_forceString(_title) == "") {
        _title = _category[enColRepositoryCategoryProperty.Name];
    }

    if (_isInvalidItem) {
        _title = "Error";
        _html = "<div style='vertial-align: top;'>" +
                "<a class='ButtonTheme' data-role='button' data-inline='true' data-theme='transparent' data-icon='info' data-iconpos='notext' " +
                "style='margin: 0em; margin-right: 0.25em; cursor: default;' />" + util_htmlEncode(MSG_CONFIG.ItemNotFound) +
                "</div>";
    }

    var _cssClass = null;

    if (options.IsPopupModeViewer) {
        _cssClass = "EditorPopupFullscreenViewer PopupNonDimissable";
    }
    else {
        _cssClass = (options.HasReturnAction ? "PopupNavigationModeInline" : null);
    }

    var _popupOptions = _controller.DefaultPopupOptions({
        "Title": _title, "HTML": _html,
        "PopupClass": _cssClass,
        "Size": options.Size, "IsViewMode": _isViewMode, "OnPopupBind": _onPopupBind, "OnPopupCloseCallback": options.OnPopupCloseCallback,
        "IsHideFooterButtons": _isPromptWizard,
        "HasFooter": !options.IsPopupModeViewer && (!_isViewMode || _isViewMode && !options.HasReturnAction),
        "HasReturnAction": options.HasReturnAction, "IsHideScrollbar": options.IsHideScrollbar,
        "OnPopupDismissRequested": function (callbackOnDismiss) {
            if (options.HasReturnAction) {
                var $search = $mobileUtil.PopupContainer().find("[data-attr-editor-controller-action-btn='popup_return']:first");

                if ($search.length == 1) {
                    callbackOnDismiss(false);
                    $search.trigger("click");
                }
                else {
                    callbackOnDismiss(true);
                }
            }
            else {
                callbackOnDismiss(true);
            }
        }
    });

    _fnIndicator = _popupOptions.Utils.ToggleIndicator;

    _popupOptions["CustomLayoutHeaderHTML"] = options["CustomLayoutHeaderHTML"];
    _popupOptions["CustomLayoutFooterHTML"] = options["CustomLayoutFooterHTML"];

    _popupOptions["AttributesContainer"] = util_extend({}, _popupOptions["AttributesContainer"]);
    _popupOptions.AttributesContainer[DATA_ATTRIBUTE_RENDER] = "pluginEditor_fileDisclaimer";
    _popupOptions.AttributesContainer["data-editor-file-disclaimer-selector"] = ".FileDetailView a[data-rel='external'][href!='javascript: void(0);']";

    $mobileUtil.PopupOpen(_popupOptions);

    if (options.IsForcePopupFocus) {
        $mobileUtil.PopupContainer().trigger("events.popup_onPopupFocusOpen");
    }

    _callback();
};

CRepositoryController.prototype.PopupCustomizeView = function (options) {

    options = util_extend({ "CategoryID": enCE.None, "Callback": null }, options);

    var _controller = this;

    var _callback = function () {
        if (options.Callback) {
            options.Callback();
        }
    };

    var _repoUserView = _controller.DOM.View.data("DataItemUserView");
    
    var _categoryConfig = _controller.DefaultCategoryConfiguration({ "CategoryID": options.CategoryID });
    var _categoryID = _categoryConfig.ID;
    var _category = _categoryConfig.Item;

    var _html = "";

    if (!_repoUserView) {
        _repoUserView = new CERepositoryUserView();
        _controller.DOM.View.data("DataItemUserView", _repoUserView);
    }

    var _viewFields = (_repoUserView[enColCERepositoryUserViewProperty.ViewFields] || []);

    _category = (_category || {});

    //filter the fields for only the ones that are supported for user view fields
    var _categoryFields = util_arrFilter(_category[enColCERepositoryCategoryProperty.CategoryFields], enColRepositoryCategoryFieldProperty.IsVisbleUserField, true);
    var _lookupReadOnlyFields = {};

    var _fnGetFieldHTML = function (fieldID) {
        var _field = _controller.Data.LookupField[fieldID];
        var _ret = "";
        var _isReadOnly = (_lookupReadOnlyFields[fieldID] == true);

        _ret += "<div class='DisableUserSelectable PluginEditorCardView EditorEntityItem EditorDragViewLineItem" + (_isReadOnly ? " UserFieldReadOnly" : "") + "' " +
                util_htmlAttribute("data-attr-field-id", fieldID) + ">" +
                "  <div class='ModeToggleEdit IndicatorDraggable'>" +
                "   <img alt='' " + util_htmlAttribute("src", "<SITE_URL><IMAGE_SKIN_PATH>buttons/btn_drag.png") + " />" +
                "  </div>" +
                "  <div class='Label'>" + util_htmlEncode(_field[enColRepositoryFieldProperty.Name]) + "</div>" +
                _controller.Utils.HTML.GetButton({
                    "ActionButtonID": "repo_userView_add",
                    "CssClass": "ButtonTheme DragButtonAction ButtonPrimary",
                    "Attributes": {
                        "data-inline": "true",
                        "data-icon": "plus",
                        "data-iconpos": "notext",
                        "title": "Add Column"
                    }
                }) +
                (
                _isReadOnly ? "" :
                _controller.Utils.HTML.GetButton({
                    "ActionButtonID": "repo_userView_remove",
                    "CssClass": "ButtonTheme DragButtonAction ButtonSecondary",
                    "Attributes": {
                        "data-inline": "true",
                        "data-icon": "minus",
                        "data-iconpos": "notext",
                        "title": "Remove Column"
                    }
                })
                ) +
                "</div>";

        return _ret;

    };  //end: _fnGetFieldHTML

    _html += "<div class='ViewModeEdit'>";  //open tag #1

    var _lookupActiveFields = {};
    
    for (var i = 0; i < _viewFields.length; i++) {
        var _repoViewField = _viewFields[i];
        var _fieldID = _repoViewField[enColRepositoryUserViewFieldProperty.FieldID];

        _lookupActiveFields[_fieldID] = true;        
    }

    //source draggable fields
    _html += "  <div class='EditorDraggableContainer EditorDraggableOn EditorDraggableGroupR1C1'>" +  //open tag #2
             "      <div class='Title'>" + util_htmlEncode("Available Columns") + "</div>" +
             "      <div class='Tools'>" +
             _controller.Utils.HTML.GetButton({
                 "CssClass": "ButtonTheme",
                 "ActionButtonID": "toggle_all",
                 "Content": "Add All",
                 "Attributes": {
                     "data-inline": "true",
                     "data-icon": "plus",
                     "data-iconpos": "left",
                     "title": "Click to add all columns"
                 }
             }) +
             "      </div>" +
             "      <div class='Content'>";  //open content tag #1

    for (var f = 0; f < _categoryFields.length; f++) {
        var _categoryField = _categoryFields[f];
        var _fieldID = _categoryField[enColRepositoryCategoryFieldProperty.FieldID];
        var _canRemove = _categoryField[enColRepositoryCategoryFieldProperty.CanRemoveUserField];

        if (!_canRemove) {
            _lookupReadOnlyFields[_fieldID] = true;
        }

        //add field to source list only if it is currently not being used in the user view
        if (!_lookupActiveFields[_fieldID]) {
            _html += _fnGetFieldHTML(_fieldID);
        }
    }

    _html += "      </div>" +   //close content tag #1
             "  </div>";   //close tag #2

    //current draggable fields
    _html += "  <div class='EditorDraggableContainer EditorDraggableOn EditorDraggableGroupR1C2'>" +  //open tag #3
             "      <div class='Title'>" + util_htmlEncode("Current Columns") + "</div>" +
             "      <div class='Tools'>" +
             _controller.Utils.HTML.GetButton({
                 "CssClass": "ButtonTheme",
                 "ActionButtonID": "toggle_all",
                 "Content": "Remove All",
                 "Attributes": {
                     "data-inline": "true",
                     "data-icon": "minus",
                     "data-iconpos": "left",
                     "title": "Click to remove all columns"
                 }
             }) +
             "      </div>" +
             "      <div class='Content'>";  //open content tag #2

    for (var i = 0; i < _viewFields.length; i++) {
        var _repoViewField = _viewFields[i];
        var _fieldID = _repoViewField[enColRepositoryUserViewFieldProperty.FieldID];

        _html += _fnGetFieldHTML(_fieldID);
    }

    _html += "      </div>" +   //close content tag #2
             "  </div>";   //close tag #3

    _html += "</div>";  //close tag #1

    var _onBindPopup = function () {
        var $popup = $mobileUtil.PopupContainer();
        var $vwDragGroups = $popup.find(".EditorDraggableGroupR1C1, .EditorDraggableGroupR1C2");

        $popup.data("SourceUserViewFields", _viewFields)
              .data("DraggableViews", $vwDragGroups);

        //init sortable events
        var _dragInstance = _controller.Utils.Sortable({
            "Containers": $vwDragGroups.children(".Content"),
            "SelectorDraggable": ".EditorDragViewLineItem",
            "DropOptions": {
                "IsDisableDropEvent": true
            },
            "LibraryConfiguration": {
                "accepts": function (el, target) {

                    var $this = $(el);
                    var _valid = true;

                    if ($this.hasClass("UserFieldReadOnly")) {
                        var _isDropSourceGroup = $(target).closest(".EditorDraggableContainer").hasClass("EditorDraggableGroupR1C1");
                        var _isItemFromSource = $this.data("drag-is-from-source");

                        _valid = (_isItemFromSource || (!_isItemFromSource && !_isDropSourceGroup));
                    }

                    return _valid;
                }
            }
        });

        _dragInstance.off("drag");
        _dragInstance.on("drag", function (el, src) {
            var $parent = $(src).closest(".EditorDraggableContainer");

            $(el).data("drag-is-from-source", $parent.hasClass("EditorDraggableGroupR1C1"));
        });

        _dragInstance.off("dragend");
        _dragInstance.on("dragend", function (el, src) {
            $(el).removeData("drag-is-from-source");
        });

        $popup.off("events.onSaveEntity");
        $popup.on("events.onSaveEntity", function (e, args) {

            args = util_extend({ "Callback": null }, args);

            var _srcUserViewFields = ($popup.data("SourceUserViewFields") || []);

            var _onSaveCallback = function (isClose) {
                if (args.Callback) {
                    args.Callback(isClose);
                }
            };

            var $selections = $vwDragGroups.filter(".EditorDraggableGroupR1C2").find(".EditorDragViewLineItem[data-attr-field-id]");
            var _userViewFields = [];

            $.each($selections, function (index) {
                var $this = $(this);
                var _fieldID = util_forceInt($this.attr("data-attr-field-id"), enCE.None);
                var _userViewField = util_arrFilter(_srcUserViewFields, enColRepositoryUserViewFieldProperty.FieldID, _fieldID, true);

                if (_userViewField.length == 1) {
                    _userViewField = _userViewField[0];
                }
                else {
                    _userViewField = new CERepositoryUserViewField();
                }

                _userViewField[enColRepositoryUserViewFieldProperty.FieldID] = _fieldID;
                _userViewField[enColRepositoryUserViewFieldProperty.DisplayOrder] = (index + 1);

                _userViewFields.push(_userViewField);
            });

            _repoUserView[enColCERepositoryUserViewProperty.ViewFields] = _userViewFields;

            _controller.BindListView(); //refresh the list view (since fields selected have been updated)
            _onSaveCallback(true);
        });

        _callback();

    };  //end: _onBindPopup

    var _onButtonClick = function (opts) {

        var _onCallback = function () {
            if (opts.Callback) {
                opts.Callback();
            }
        };

        var _btnID = opts.ButtonID;

        switch (_btnID) {

            case "repo_userView_add":
            case "repo_userView_remove":
                var _isAdd = (_btnID == "repo_userView_add");
                var $popup = $mobileUtil.PopupContainer();
                var $vwDragGroups = $popup.data("DraggableViews");
                
                var $item = $(opts.Element).closest(".EditorDragViewLineItem[data-attr-field-id]").detach();
                var $dest = $vwDragGroups.filter(_isAdd ? ".EditorDraggableGroupR1C2" : ".EditorDraggableGroupR1C1");

                $dest.children(".Content").append($item);
                _onCallback();

                break;

            case "toggle_all":

                var $popup = $mobileUtil.PopupContainer();
                var $vwDragGroups = $popup.data("DraggableViews");
                var $current = $(opts.Element).closest(".EditorDraggableGroupR1C1, .EditorDraggableGroupR1C2");
                var $dest = $vwDragGroups.not($current);

                var $list = $current.find(".Content > .EditorDragViewLineItem[data-attr-field-id]:not(.UserFieldReadOnly)").detach();

                $dest.children(".Content").append($list);

                _onCallback();
                break;

            case "repo_restore":

                dialog_confirmYesNo("Restore Columns", "Are you sure you want to restore the columns to the default view?", function () {

                    var $popup = $mobileUtil.PopupContainer();
                    var $list = $popup.find(".EditorDraggableGroupR1C1 > .Content, .EditorDraggableGroupR1C2 > .Content");

                    var _defaultUserView = util_extend({}, _controller.Data.DefaultUserView, false, true);

                    var _lookupActiveFields = {};
                    var _viewFields = (_defaultUserView[enColCERepositoryUserViewProperty.ViewFields] || []);

                    for (var i = 0; i < _viewFields.length; i++) {
                        var _repoViewField = _viewFields[i];
                        var _fieldID = _repoViewField[enColRepositoryUserViewFieldProperty.FieldID];

                        _lookupActiveFields[_fieldID] = true;
                    }

                    $.each($list, function () {
                        var $this = $(this);
                        var _isSourceGroup = $this.closest(".EditorDraggableContainer")
                                                  .hasClass("EditorDraggableGroupR1C1");

                        var _html = "";

                        if (_isSourceGroup) {
                            for (var f = 0; f < _categoryFields.length; f++) {
                                var _categoryField = _categoryFields[f];
                                var _fieldID = _categoryField[enColRepositoryCategoryFieldProperty.FieldID];
                                var _canRemove = _categoryField[enColRepositoryCategoryFieldProperty.CanRemoveUserField];

                                if (!_canRemove) {
                                    _lookupReadOnlyFields[_fieldID] = true;
                                }

                                //add field to source list only if it is currently not being used in the user view
                                if (!_lookupActiveFields[_fieldID]) {
                                    _html += _fnGetFieldHTML(_fieldID);
                                }
                            }
                        }
                        else {
                            for (var i = 0; i < _viewFields.length; i++) {
                                var _repoViewField = _viewFields[i];
                                var _fieldID = _repoViewField[enColRepositoryUserViewFieldProperty.FieldID];

                                _html += _fnGetFieldHTML(_fieldID);
                            }
                        }

                        $this.html(_html)
                             .trigger("create");
                    });

                    $mobileUtil.PopupContainer().animate({ "scrollTop": "0px" }, 500);

                    _onCallback();
                }, _onCallback);

                break;  //end: repo_restore

            default:
                _onCallback();
                break;
        }

    };  //end: _onButtonClick

    var _popupOptions = _controller.DefaultPopupOptions({
        "Size": "EditorPopupSizeMedium", "Title": "Customize View", "HTML": _html, "OnPopupBind": _onBindPopup, "OnButtonClick": _onButtonClick,
        "FooterButtonList": [
            { "ID": "repo_restore", "Content": "Restore", "Attributes": { "data-icon": "back" } }
        ]
    });

    $mobileUtil.PopupOpen(_popupOptions);
};

CRepositoryController.prototype.PopupWizardAddResource = function (options) {

    options = util_extend({
        "DisableValidationIsAddVisibleUserField": false,
        "DisableSelectionScreen": false,
        "AddNewStateValueParam": null,
        "DocumentTypes": [], "Title": "Add New", "Callback": null, "OnWizardSelection": function (opts, onCallback) {
            onCallback(null);   //return the category ID
        },
        "OnSaveCallback": function (opts) { },
        "OnPopupCloseCallback": null,
        "CanAdminComponentKOL": null
    }, options);

    var _controller = this;

    var _disableValidationIsAddVisibleUserField = options.DisableValidationIsAddVisibleUserField;
    var _addNewStateValueParam = options.AddNewStateValueParam;
    var _documentTypes = (options.DocumentTypes || []);
    var _html = "";

    if (_documentTypes.length == 0) {
        _documentTypes = (_controller.Data.DocumentTypes || []);
    }

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

    var _onPopupBind = function () {

        var $popup = $mobileUtil.PopupContainer();

        $popup.off("click.onItemSelection");
        $popup.on("click.onItemSelection", ".LinkClickable[data-document-type-id]:not(.LinkDisabled)", function () {
            $popup.data("SelectedDocumentTypeID", util_forceInt($(this).attr("data-document-type-id"), enCE.None));
            $mobileUtil.PopupClose();
        });

    };  //end: _onPopupBind

    var _onTriggerPopupCloseCallback = options.OnPopupCloseCallback;

    var _fnOnDocumentTypeSelected = function (_selectedDocumentTypeID) {

        if (_selectedDocumentTypeID != enCE.None) {

            var _queue = new CEventQueue();
            var _categoryID = null;

            if (options.OnWizardSelection) {
                _queue.Add(function (onCallback) {
                    options.OnWizardSelection.call(this, {
                        "DocumentTypeID": _selectedDocumentTypeID, "AddNewStateValueParam": _addNewStateValueParam
                    }, function (categoryID) {

                        _categoryID = util_forceInt(categoryID, enCE.None);
                        onCallback();
                    });
                });
            }

            _queue.Run({
                "Callback": function () {

                    var _fn = function () {

                        setTimeout(function () {

                            _controller.PopupEditResource({
                                "DisableValidationIsAddVisibleUserField": _disableValidationIsAddVisibleUserField,
                                "IsForcePopupFocus": true,
                                "IsExtViewMode": true,
                                "Size": "EditorPopupFixed ScrollbarPrimary",
                                "CategoryID": _categoryID,
                                "OnSaveCallback": options.OnSaveCallback,
                                "OnPopupCloseCallback": _onTriggerPopupCloseCallback,
                                "AddNewStateValueParam": _addNewStateValueParam,
                                "CanAdminComponentKOL": options.CanAdminComponentKOL
                            });
                        }, 100);

                    };  //end: _fn

                    if (util_forceInt(_categoryID, enCE.None) != enCE.None) {
                        _fn();
                    }
                    else {
                        var _cachedCategory = _controller.Data.LookupDocumentTypeCategory[_selectedDocumentTypeID];

                        if (_cachedCategory) {
                            _categoryID = _cachedCategory[enColRepositoryCategoryProperty.CategoryID];
                            _fn();
                        }
                        else {
                            APP.Service.Action({
                                "c": "PluginEditor", "m": "RepositoryCategory", "args": {
                                    "SearchContextDocumentTypeID": _selectedDocumentTypeID,
                                    "IsFallbackDefault": true
                                }
                            }, function (category) {

                                if (category && util_forceInt(category[enColRepositoryCategoryProperty.CategoryID], enCE.None) != enCE.None) {
                                    _controller.Data.LookupDocumentTypeCategory[_selectedDocumentTypeID] = category;
                                    _categoryID = category[enColRepositoryCategoryProperty.CategoryID];

                                    _fn();
                                }
                                else if (_onTriggerPopupCloseCallback) {
                                    _onTriggerPopupCloseCallback();
                                }
                            });
                        }
                    }
                }
            });

        }
        else if (_onTriggerPopupCloseCallback) {
            _onTriggerPopupCloseCallback();
        }

    };  //end: _fnOnDocumentTypeSelected

    if (options.DisableSelectionScreen != true || (options.DisableSelectionScreen && _documentTypes.length > 1)) {

        var _onPopupClose = function () {
            var $prevPopup = $mobileUtil.PopupContainer();

            if ($prevPopup.data("is-dirty")) {
                return;
            }

            var _selectedDocumentTypeID = util_forceInt($prevPopup.data("SelectedDocumentTypeID"), enCE.None);

            //remove the data and flag it as dirty (to avoid recursive popup calls)
            $prevPopup.removeData("SelectedDocumentTypeID")
                      .data("is-dirty", true);

            $prevPopup.off("remove");

            _fnOnDocumentTypeSelected(_selectedDocumentTypeID);

        };  //end: _onPopupClose

        var _popupOptions = _controller.DefaultPopupOptions({
            "Title": options.Title,
            "HTML": _html, "Size": "EditorPopupFixed EditorPopupSizeSmall ScrollbarPrimary", "HasFooter": false,
            "OnPopupBind": _onPopupBind,
            "OnPopupCloseCallback": _onPopupClose
        });

        $mobileUtil.PopupOpen(_popupOptions);
    }
    else {
        var _documentType = _documentTypes[0];
        var _documentTypeID = _documentType[enColRepositoryDocumentTypeProperty.DocumentTypeID];

        _fnOnDocumentTypeSelected(_documentTypeID);
    }
};

CRepositoryController.prototype.BindListView = function (options) {

    options = util_extend({ "Item": null }, options);

    var _controller = this;
    var _html = "";
    var _repoUserView = _controller.DOM.View.data("DataItemUserView");

    var $element = _controller.DOM.ListView;
    var _documentTypeID = util_forceInt($element.data("FilterDocumentTypeID"), enCE.None);

    if (!_controller.DOM.View.data("is-init-listview")) {
        _controller.DOM.View.data("is-init-listview", true);

        var $window = $(window);
        var _offset = 0;

        try {
            if (util_isDefined("LAYOUT_CONFIGURATION_FULL")) {
                _offset += util_forceFloat(LAYOUT_CONFIGURATION_FULL.FixedFooterHeight, 0) + util_forceFloat(LAYOUT_CONFIGURATION_FULL.ContentPaddingOffset, 0) * 0.2;
            }
        } catch (e) {
        }

        _controller.DOM.View.off("remove.repository_cleanup");
        _controller.DOM.View.on("remove.repository_cleanup", function () {
            $(window).off("resize.repository_onResize");
        });

        $window.off("resize.repository_onResize");
        $window.on("resize.repository_onResize", $.debounce(function () {

            if (_controller.DOM.ViewAnchor && _controller.DOM.ViewFilters) {
                var _windowSize = _controller.Utils.GetWindowDimensions();
                var _position = _controller.DOM.ViewAnchor.position();
                var _width = _windowSize.Width - 250;
                var _height = _windowSize.Height;

                _height -= _position.top + _offset;
                _height = Math.max(_height, 300);

                $element.css("width", "calc(" + _width + "px - 3.75em)")
                        .css("height", _height + "px");
            }
        }, 100));

        $element.off("events.refreshListView");
        $element.on("events.refreshListView", function (e, args) {

            args = util_extend({ "IsCache": false, "Data": null, "SearchParam": null }, args);

            if (args.IsCache) {

                //set flag to use cached data
                _controller.DOM.ListView.data("IsCached", true)
                                        .data("CacheData", args.Data);

                var $tbl = _controller.DOM.ListView.data("RepeaterTable");

                if (!$tbl) {
                    $tbl = _controller.DOM.ListView.find("#tblUserAdminList");
                    _controller.DOM.ListView.data("RepeaterTable", $tbl);
                }

                _controller.Data.HighlightEncoder = (args.SearchParam ? args.SearchParam["HighlightEncoder"] : null);

                //default to first page
                ctl_repeater_setSortSettingCurrentPage($tbl, 1);
            }
            else {

                //remove any cached data
                _controller.DOM.ListView.removeData("IsCached")
                                        .removeData("CacheData");
            }

            renderer_event_data_admin_list_bind(_controller.DOM.ListView);

        }); //end: events.refreshListView
    }

    if (!_repoUserView) {
        _repoUserView = new CERepositoryUserView();
        _controller.DOM.View.data("DataItemUserView", _repoUserView);
    }

    var _viewFields = (_repoUserView[enColCERepositoryUserViewProperty.ViewFields] || []);

    var _repeaterOpts = {
        "SortEnum": "enColRepositoryResourceListViewSort",
        "DefaultSortEnum": null,
        "Columns": []
    };

    var enColRepositoryResourceListViewSort = {};

    var _html = "";

    _html += "<table border='1'>";

    _html += "<tr>";

    //favorites column
    _repeaterOpts.Columns.push({
        "ID": "tools",
        "Content": "",
        "IsNoLink": true,
        "CssClass": "CellTools"
    });

    //download file column
    _repeaterOpts.Columns.push({
        "ID": "download",
        "Content": "",
        "IsNoLink": true,
        "CssClass": "CellTools"
    });

    for (var i = 0; i < _viewFields.length; i++) {
        var _repoUserViewField = _viewFields[i];

        var _fieldID = _repoUserViewField[enColRepositoryUserViewFieldProperty.FieldID];
        var _field = _controller.Data.LookupField[_fieldID];

        var _sortKey = "Field_" + _fieldID;
        var _sortEnum = _repeaterOpts.SortEnum + "." + _sortKey;

        var _column = {
            "Content": _field[enColRepositoryFieldProperty.Name],
            "UserFieldItem": _repoUserViewField,
            "SortEnum": _sortEnum,
            "FieldItem": _field,
            "HasTooltip": (util_forceString(_field[enColRepositoryFieldProperty.TooltipHTML]) != "")
        };

        enColRepositoryResourceListViewSort[_sortKey] = _fieldID;

        if (i == 0) {
            _repeaterOpts.DefaultSortEnum = _sortEnum;
        }

        _repeaterOpts.Columns.push(_column);

        _html += "<th>" + util_htmlEncode(_column.Content) + "</th>";
    }

    _html += "</tr>";

    //TODO add the download link

    window["enColRepositoryResourceListViewSort"] = enColRepositoryResourceListViewSort;

    var _contextPermissions = {
        "UserID": enCE.None,
        "CanAdmin": null,
        "Init": function () {
            this.UserID = global_AuthUserID();
            this.CanAdmin = _controller.CanAdmin();
        }
    };

    var _fnGetList = function (element, sortSetting, callback) {

        var _callback = function (data) {

            _contextPermissions.Init();

            _controller.DOM.ListView.data("DataItem", data);

            if (callback) {
                callback(data);
            }
        };

        if (_controller.DOM.ListView.data("IsCached")) {

            var _cacheData = _controller.DOM.ListView.data("CacheData");

            _controller.DOM.ListView.removeData("IsCached")
                                    .removeData("CacheData");

            _callback(_cacheData);
        }
        else {

            var _params = {
                "SortColumn": sortSetting.SortColumn,
                "SortAscending": sortSetting.SortASC,
                "PageSize": util_forceInt(sortSetting.PageSize, PAGE_SIZE),
                "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
            };

            _controller.DOM.ToggleIndicator(true);

            _controller.GetContextFilterID(function (filterID) {

                APP.Service.Action({
                    "_indicators": false, "c": "PluginEditor", "m": "RepositoryResourceUserViewList", "args": {
                        "DocumentTypeID": _documentTypeID,
                        "UserViewItem": util_stringify(_repoUserView),
                        "Search": (_controller.DOM.FilterTextSearch ? _controller.DOM.FilterTextSearch.val() : null),
                        "IsUserFavorite": (_controller.DOM.FilterToggleFavorite ? !_controller.DOM.FilterToggleFavorite.hasClass("StateOff") : false) ?
                                          enCETriState.Yes : enCETriState.None,                        
                        "FilterID": filterID,
                        "SortFieldID": _params.SortColumn,  //passing the field ID to sort by (from the user view field column)
                        "SortAscending": _params.SortAscending, "PageNum": _params.PageNum, "PageSize": _params.PageSize
                    }
                }, function (result) {

                    _controller.DOM.ToggleIndicator(false);

                    _callback(result);
                });

                if (_controller.DOM.FilterTextSearch) {
                    _controller.DOM.FilterTextSearch.data("LastRequest", GlobalService.LastRequest);   //associate last service request to searchable field
                }

            }); //end: get filter ID
        }

    };  //end: _fnGetList

    var _deleteButtonHTML = _controller.Utils.HTML.GetButton({
        "CssClass": "ActionButton ViewModeEdit DeleteListItem",
        "Attributes": {
            "data-inline": "true",
            "data-icon": "delete",
            "data-iconpos": "notext",
            "title": "Delete"
        }
    });

    var $repeater = _controller.Utils.Repeater({
        "ID": "tblRepositoryResource",
        "CssClass": "TableRepositoryResource",
        "IsTableEnhance": false,
        "IsDisablePagingFooter": true,
        "PageSize": _controller.Data.ListPageSize,
        "SortEnum": _repeaterOpts.SortEnum,
        "DefaultSortEnum": _repeaterOpts.DefaultSortEnum,
        "SortOrderGroupKey": "repository_listview_table",
        "Columns": _repeaterOpts.Columns,
        "RepeaterFunctions": {
            "ContentRowAttribute": function (item) {
                return util_htmlAttribute("data-attr-item-id", item[enColRepositoryResourceProperty.ResourceID]);
            },
            "ContentRowCssClass": function (opts) {
                var _item = opts.Item;
                var _cssClass = "EntityLineItem";

                if (!_contextPermissions.CanAdmin && util_forceInt(_item[enColRepositoryResourceProperty.UserID], enCE.None) != _contextPermissions.UserID) {
                    _cssClass += " EntityLineItemViewMode";
                }

                return _cssClass;
            },
            "FieldCellOption": function (cellOpts) {

                if (cellOpts.Index == 0) {
                    cellOpts["ForceHorizontalAlign"] = true;
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
                    var _field = _column["FieldItem"];

                    if (_field) {
                        var _hasHighlight = _field[enColCERepositoryFieldProperty.CanSearch];

                        _isNewLineEncode = (_field[enColRepositoryFieldProperty.EditorDataTypeID] == enCEEditorDataType.FreeText);

                        _val = _controller.Utils.ForceRepositoryFieldValue({ "Item": _item, "Field": _field });

                        if (_isEncode && _hasHighlight && _controller.Data.HighlightEncoder) {
                            _val = util_forceString(_val);
                            _val = _controller.Data.HighlightEncoder(_val, _isNewLineEncode);
                            _isEncode = false;  //disable HTML encode
                        }
                    }
                    else {
                        switch (_column["ID"]) {

                            case "tools":
                                var _isFavorite = (_item[enColCERepositoryResourceProperty.IsUserFavorite] == true);

                                _val = "<div class='EditorImageButton ImageFavorite UserFavoriteToggle LinkClickable" + (_isFavorite ? "" : " StateOff") + "' " +
                                       util_htmlAttribute("title", _isFavorite ? "Remove from Favorite" : "Add to Favorite") + ">" +
                                       "    <div class='ImageIcon' />" +
                                       "</div>";

                                _val += _deleteButtonHTML;

                                _isEncode = false;
                                break;

                            case "download":
                                
                                _val = _controller.Utils.ConstructRepositoryFileHTML({ "Item": _item });

                                _isEncode = false;
                                break;
                        }
                    }
                }

                _val = (_isEncode ? util_htmlEncode(_val, _isNewLineEncode) : util_forceString(_val));

                return _val;
            },
            "GetData": _fnGetList,
            "BindComplete": function (opts) {

                var _list = util_extend({ "List": null, "NumItems": null }, opts.Data);
                var _sortSetting = ctl_repeater_getSortSetting(opts.Element);
                var _pagingHTML = _controller.Utils.HTML.Pagination({
                    "PageSize": _sortSetting.PageSize, "CurrentPage": util_forceInt(_sortSetting["PageNo"], 1),
                    "NumItems": _list.NumItems, "IsPagingDisplayCount": true
                });

                _controller.DOM.PaginationView.html(_pagingHTML);
                $mobileUtil.refresh(_controller.DOM.PaginationView);

                setTimeout(function () {
                    $(window).trigger("resize.repository_onResize");
                }, 500);
            }
        }
    });

    $repeater.off("callout_tooltip.getContent");
    $repeater.on("callout_tooltip.getContent", function (e, args) {
        args = util_extend({ "Trigger": null, "Instance": null, "Callback": null }, args);

        var $tooltipTrigger = $(args.Trigger);
        var _sortColumn = $mobileUtil.GetClosestAttributeValue($tooltipTrigger, CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN);
        var _result = { "Content": "", "IsHTML": true };

        _result.Content = $tooltipTrigger.data("TooltipContent");

        if (_result.Content === undefined) {

            var _column = util_arrFilter(_repeaterOpts.Columns, "SortEnum", _sortColumn, true);

            if (_column.length == 1) {
                _column = _column[0];

                if (_column["FieldItem"]) {
                    _result.Content = _column.FieldItem[enColRepositoryFieldProperty.TooltipHTML];
                }
            }

            _result.Content = util_forceString(_result.Content);

            $tooltipTrigger.data("TooltipContent", _result.Content);
        }

        if (args.Callback) {
            args.Callback(_result);
        }

    }); //end: callout_tooltip.getContent

    $element.empty()
            .append($repeater);

    //clear cached data
    $element.removeData("RepeaterTable");

    //cache the function for the get list data function (required for searchable view)
    $element.data("OnGetList", _fnGetList);

    _html += "</table>";

    $mobileUtil.refresh($element);

    $repeater.off("events.resize_view");
    $repeater.on("events.resize_view", function () {
        $(window).trigger("resize.repository_onResize");
    });

    $repeater.trigger("events.resize_view")
             .trigger("events.refresh_list");

    setTimeout(function () {
        $repeater.trigger("events.resize_view");

        if (!_controller.DOM.ListView.is(":visible")) {
            _controller.DOM.ListView.slideDown("slow");
        }
    }, 100);
};

CRepositoryController.prototype.ShowPanel = function (options) {

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
             "<div class='ScrollbarPrimary Content'>" +
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

CRepositoryController.prototype.GetContextFilterID = function (callback, isDisableInit) {

    var _controller = this;
    var _filterID = (_controller.DOM.View ? _controller.DOM.View.data("ContextFilterID") : null);
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
                _controller.DOM.View.data("ContextFilterID", _filterID);
            }

            _callback();
        });
    }
};

CRepositoryController.prototype.CanAdmin = function () {
    var _instance = this;
    var _ret = false;

    if (_instance.DOM.View) {
        _ret = _instance.DOM.View.hasClass("AdminViewMode");
    }

    return _ret;
};

CRepositoryController.prototype.CanAdminComponentKOL = function () {
    var _instance = this;
    var _ret = false;

    if (_instance.DOM.View) {
        _ret = _instance.DOM.View.hasClass("AdminViewModeComponentKOL");
    }    

    return _ret;
};

CRepositoryController.prototype.IsResourceOwnerByID = function (options) {
    options = util_extend({ "ResourceID": null, "Callback": function (result) { } }, options);

    var _callback = options.Callback;

    if (!_callback) {
        _callback = function (result) { };
    }

    var _resourceID = util_forceInt(options.ResourceID, enCE.None);

    if (_resourceID == enCE.None) {
        _callback(false);
    }
    else {

        //check if the current user is owner of the repository resource
        APP.Service.Action({
            "c": "PluginEditor", "m": "RepositoryResourceIsOwner", "args": {
                "ResourceID": _resourceID
            }
        }, function (data) {
            data = util_forceBool(data, false);
            _callback(data);
        });
    }
};

CRepositoryController.prototype.GetControllerInstanceKOL = function () {

    var _controller = this;

    if (!_controller.Data.ControllerInstanceKOL) {
        _controller.Data.ControllerInstanceKOL = new CKeyOpinionLeaderController({ "IsDisableExtControllerInit": true });
    }

    return _controller.Data.ControllerInstanceKOL;
};

CRepositoryController.CFieldUserControl = function (options) {

    var _instance = this;
    var _controller = options.Controller;
    var LIST_SIZE = 5;
    var _isViewMode = util_forceBool(options["IsReadOnly"], false);

    var _fieldOptions = util_extend({ "RenderType": null }, options["FieldOptions"]);
    var $element = $(options.Target);
    var _dataItem = options.Item;
    var _fieldID = options.Field[enColRepositoryFieldProperty.FieldID];

    var _fnIndicator = $element.data("IndicatorToggle");

    if (!_fnIndicator) {
        _fnIndicator = function (isEnabled) { };
    }

    //requires: the KOL related definition as well, if available within the controller instance specified
    //NOTE: controller is generic and does not necessarily mean the CRepositoryControler (can be used by the CKeyOpinionLeaderController controller as well)
    var _controllerKOL = (_controller["GetControllerInstanceKOL"] ? _controller.GetControllerInstanceKOL() : null);
    var _isBaseController = false;

    if (!_controllerKOL && _controller["ShowEntityDetailsPopup"]) {
        _controllerKOL = _controller;
        _isBaseController = true;
    }

    var _renderOptions = {
        "Types": [],
        "Lookup": {}
    };

    var _arr = util_forceString(_fieldOptions.RenderType).split("|");
    var _fnHighlightEncoder = options["HighlightEncoder"];
    var _fnCanAdminComponentKOL = null;

    for (var i = 0; i < _arr.length; i++) {
        var _type = _arr[i];

        if (_type != "") {
            var _config = {
                "Element": null,
                "GroupTitle": null,
                "GetSourceList": function () {
                    var _ret = this.Element.data("DataItem");

                    if (!_ret) {
                        _ret = [];
                        this.Element.data("DataItem", _ret);
                    }

                    return _ret;
                },
                "LoadData": null,
                "ConfigureParams": null,
                "HasProfileImage": false,
                "GetItemHTML": function (opts) {
                    var _item = opts.Item;
                    var _itemID = _item[this.PropertyValue];

                    var _itemHTML = "";
                    var _cssClass = "";

                    if (_isViewMode) {
                        _cssClass = "ViewListSelectionItem ItemBlockView LinkClickable";
                    }
                    else {
                        _cssClass = "LinkClickable DisableUserSelectable PluginEditorCardView ViewListSelectionItem ItemSizeSmall ItemInlineView" +
                                    (this.HasProfileImage ? " LogoImageViewOn" : "");

                    }

                    _itemHTML += "<div " + util_htmlAttribute("class", _cssClass) + " " + util_htmlAttribute("item-value", _itemID) + ">";

                    if (this.HasProfileImage && _controllerKOL) {

                        _itemHTML += "<div class='ImageKOL_ProfileIconCell'>" +
                                     "  <div class='EditorImageButton ImageUserProfile'>" +
                                     "      <div class='ImageIcon' " +
                                     util_htmlAttribute("style",
                                                        "background-image: url('" + _controllerKOL.Utils.ConstructKeyOpinionLeaderProfileURL({ "ID": _itemID }) + ")'") +
                                     "      />" +
                                     "  </div>" +
                                     "</div>";
                    }

                    var _labelHTML = (_fnHighlightEncoder ? _fnHighlightEncoder.call(this, _item[this.PropertyText]) : util_htmlEncode(_item[this.PropertyText]));

                    _itemHTML += "<div class='Label'>" + _labelHTML + "</div>";

                    if (!_isViewMode) {
                        _itemHTML += "<div class='ViewListItemTools'>" +
                                     _controller.Utils.HTML.GetButton({
                                         "Content": "Delete",
                                         "CssClass": "ButtonTheme",
                                         "Attributes": {
                                             "data-inline": "true",
                                             "data-icon": "delete",
                                             "data-iconpos": "right",
                                             "title": "Delete"
                                         }
                                     }) +
                                     "</div>";
                    }

                    _itemHTML += "</div>";

                    return _itemHTML;
                },
                "PropertyDataIdentifier": null,
                "PropertyDataIdentifierName": null,
                "InstanceType": null,
                "PropertyPath": null,
                "PropertyText": null,
                "PropertyValue": null,
                "SortEnum": null,
                "DefaultSortEnum": null,
                "Columns": [{ "ID": "toggle_icon", "Content": "", "IsNoLink": true }],
                "Search": {
                    "Method": null,
                    "QueryParamName": "Search"
                },
                "AddColumn": function (title, prop, mSortEnum, highlight, mIsDate) {
                    this.Columns.push({
                        "Content": title,
                        "SortEnum": mSortEnum,
                        "PropertyPath": prop,
                        "HasHighlight": util_forceBool(highlight, false),
                        "IsDate": util_forceBool(mIsDate, false)
                    });
                },
                "LookupSelections": {},
                "ViewEntityTypeID": null
            };

            switch (_type) {

                case "kol":
                    _config.GroupTitle = "KOL";
                    _config.PropertyPath = enColCERepositoryResourceProperty.ResourceKeyOpinionLeaders;
                    _config.InstanceType = CERepositoryResourceKeyOpinionLeader;
                    _config.PropertyText = enColRepositoryResourceKeyOpinionLeaderProperty.KeyOpinionLeaderIDName;
                    _config.PropertyValue = enColRepositoryResourceKeyOpinionLeaderProperty.KeyOpinionLeaderID;

                    _config.PropertyDataIdentifier = enColKeyOpinionLeaderProperty.KeyOpinionLeaderID;
                    _config.PropertyDataIdentifierName = enColKeyOpinionLeaderProperty.Name;

                    _config.SortEnum = "enColKeyOpinionLeader";
                    _config.DefaultSortEnum = _config.SortEnum + "." + enColKeyOpinionLeaderProperty.Name;

                    _config.Search.Method = "KeyOpinionLeaderGetByForeignKey";

                    _config.Columns.push({ "ID": "kol_profile", "Content": "", "IsNoLink": true });

                    _config.AddColumn("Name", enColKeyOpinionLeaderProperty.Name, "enColKeyOpinionLeader.Name", true);
                    _config.AddColumn("Title", enColKeyOpinionLeaderProperty.Title, "enColKeyOpinionLeader.Title", true);
                    _config.AddColumn("Organization", enColKeyOpinionLeaderProperty.Organization, "enColKeyOpinionLeader.Organization", true);

                    _config.HasProfileImage = true;

                    _config.ConfigureParams = function (params) {

                        var _canAdminKOL = (_fnCanAdminComponentKOL ? _fnCanAdminComponentKOL() : _controller.CanAdminComponentKOL());

                        //user does not have Administrator role for KOL manager, so restrict KOLs to ones user is owner of
                        if (!_canAdminKOL) {
                            params["CompanyUserID"] = global_AuthUserID();
                        }
                    };

                    _config.ViewEntityTypeID = "KOL";

                    break;

                case "event":
                    _config.GroupTitle = "Event";
                    _config.PropertyPath = enColCERepositoryResourceProperty.ResourceEvents;
                    _config.InstanceType = CERepositoryResourceEvent;
                    _config.PropertyText = enColRepositoryResourceEventProperty.EventIDName;
                    _config.PropertyValue = enColRepositoryResourceEventProperty.EventID;

                    _config.PropertyDataIdentifier = enColEventProperty.EventID;
                    _config.PropertyDataIdentifierName = enColEventProperty.Name;

                    _config.SortEnum = "enColEvent";
                    _config.DefaultSortEnum = _config.SortEnum + "." + enColEventProperty.Name;

                    _config.Search.Method = "EventSearch";

                    _config.AddColumn("Name", enColEventProperty.Name, "enColEvent.Name", true);
                    _config.AddColumn("Start Date", enColEventProperty.StartDate, "enColEvent.StartDate", null, true);
                    _config.AddColumn("End Date", enColEventProperty.EndDate, "enColEvent.EndDate", null, true);
                    _config.AddColumn("Venue", enColEventProperty.Venue, "enColEvent.Venue", true);

                    _config.ViewEntityTypeID = "Event";

                    break;

                case "activity":
                    _config.GroupTitle = "Activity";
                    _config.PropertyPath = enColCERepositoryResourceProperty.ResourceActivities;
                    _config.InstanceType = CERepositoryResourceActivity;
                    _config.PropertyText = enColRepositoryResourceActivityProperty.ActivityIDName;
                    _config.PropertyValue = enColRepositoryResourceActivityProperty.ActivityID;

                    _config.PropertyDataIdentifier = enColActivityProperty.ActivityID;
                    _config.PropertyDataIdentifierName = enColActivityProperty.Name;

                    _config.SortEnum = "enColActivity";
                    _config.DefaultSortEnum = _config.SortEnum + "." + enColActivityProperty.Name;

                    _config.Search.Method = "ActivitySearch";

                    _config.AddColumn("Name", enColActivityProperty.Name, "enColActivity.Name", true);
                    _config.AddColumn("Start Date", enColActivityProperty.StartDate, "enColActivity.StartDate", null, true);
                    _config.AddColumn("End Date", enColActivityProperty.EndDate, "enColActivity.EndDate", null, true);
                    _config.AddColumn("Venue", enColActivityProperty.Venue, "enColActivity.Venue", true);

                    _config.ViewEntityTypeID = "Activity";

                    break;

                default:
                    _config = null;
                    break;
            }

            if (_config) {
                _renderOptions.Types.push(_type);
                _renderOptions.Lookup[_type] = _config;
            }
        }
    }

    if (_renderOptions.Types.length > 0) {
        $element.addClass("CRepositoryViewUserControl")
                .data("RenderOptions", _renderOptions);

        if (_renderOptions.Types.length == 1) {
            var _type = _renderOptions.Types[0];
            var _config = _renderOptions.Lookup[_type];

            if (!_config.PropertyPath) {
                _config.PropertyPath = options.PropertyPath;
            }
        }

        var _html = "";
        var _hasGroups = (_renderOptions.Types.length > 1);

        for (var i = 0; i < _renderOptions.Types.length; i++) {
            var _type = _renderOptions.Types[i];
            var _config = _renderOptions.Lookup[_type];

            _html += "<div class='GroupItem' " + util_htmlAttribute("data-render-type", _type) + " " + util_htmlAttribute("data-view-entity-type", _config.ViewEntityTypeID) + ">";

            //selections view
            _html += "  <div class='ViewSelections'>" +
                     (_isViewMode && !_hasGroups ? 
                      "" :
                      "      <div class='Title'>" + (_hasGroups ? "<b>" + util_htmlEncode(_config["GroupTitle"] + (_isViewMode ? "" : "—")) + "</b>" : "") +
                      (_isViewMode ? "" : (util_htmlEncode("Selections") + "&nbsp;<span class='LabelCount'>" + util_htmlEncode("(0)") + "</span>")) +
                      "      </div>"
                     ) +
                     "    <div class='ContentSelections' />" +
                     "  </div>";


            //search/add view
            if (!_isViewMode) {
                _html += "<div class='Divider' />";

                _html += "  <div class='ViewSearch'>" +
                         "      <div class='EditorSearchableView PluginEditorCardView'>" +
                         "          <input data-input-id='tbSearch' type='text' maxlength='1000' data-role='none' placeholder='Search' />" +
                         "      </div>" +
                         "      <div class='ListView'>" + util_htmlEncode("LOADING...") + "</div>" +
                         "  </div>";
            }

            _html += "</div>";
        }

        $element.html(_html);
        $mobileUtil.refresh(_html);

        $.each($element.find("[data-render-type]"), function () {

            (function ($this) {
                var _renderType = $this.attr("data-render-type");
                var _config = _renderOptions.Lookup[_renderType];
                var _searchConfig = _config.Search;

                _config.Element = $this;

                var $lblCount = $this.find(".ViewSelections > .Title .LabelCount");
                var $tbSearch = $this.find(".ViewSearch [data-input-id='tbSearch']");

                _config.LoadData = function (element, sortSetting, callback) {
                    var _args = {
                        "SortColumn": sortSetting.SortColumn,
                        "SortAscending": sortSetting.SortASC,
                        "PageSize": util_forceInt(sortSetting.PageSize, LIST_SIZE),
                        "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
                    };

                    _args[_searchConfig.QueryParamName] = $tbSearch.val();

                    if (_config.ConfigureParams) {
                        _config.ConfigureParams(_args);
                    }

                    _fnIndicator(true);

                    APP.Service.Action({
                        "_indicators": false, "c": "PluginEditor", "m": _searchConfig.Method, "args": _args
                    }, function (data) {

                        _fnIndicator(false);
                        callback(data);
                    });

                    $tbSearch.data("LastRequest", GlobalService.LastRequest);
                };

                var $listViewSelections = $this.find(".ViewSelections > .ContentSelections");
                var $vwSearch = $this.children(".ViewSearch");
                var $listView = $vwSearch.children(".ListView:first");

                $listViewSelections.off("click.removeSelection");

                if (!_isViewMode) {
                    $listViewSelections.on("click.removeSelection", ".LinkClickable.ViewListSelectionItem[item-value]:not(.LinkDisabled)", function () {
                        var $this = $(this);
                        var _id = util_forceInt($this.attr("item-value"), enCE.None);

                        $this.addClass("LinkDisabled")
                             .removeAttr("item-value");

                        $this.toggle("height", function () {

                            var $search = $listView.find(".EntityLineItem[" + util_htmlAttribute("data-attr-item-id", _id) + "]");

                            delete _config.LookupSelections[_id];

                            if ($search.length == 1) {
                                $search.trigger("click");
                            }
                            else {
                                $this.trigger("events.ruc_refreshLabelCount");
                            }

                            $this.remove();
                        });
                    });
                }

                $this.off("events.ruc_refreshLabelCount");
                $this.on("events.ruc_refreshLabelCount", function () {
                    var $list = $listViewSelections.find(".ViewListSelectionItem[item-value]");

                    $lblCount.text("(" + util_formatNumber($list.length) + ")");
                });
                
                $this.off("events.ruc_bind");
                $this.on("events.ruc_bind", function () {
                    var _list = _config.GetSourceList();

                    //bind the selections list view
                    var _html = "";

                    for (var i = 0; i < _list.length; i++) {
                        var _item = _list[i];
                        var _id = _item[_config.PropertyValue];

                        _html += _config.GetItemHTML({ "Item": _item });

                        _config.LookupSelections[_id] = true;
                    }

                    $listViewSelections.html(_html);
                    $mobileUtil.refresh($listViewSelections);

                    $this.trigger("events.ruc_refreshLabelCount");
                });                

                $this.off("events.ruc_refreshSearch");
                $this.on("events.ruc_refreshSearch", function (e, args) {

                    args = util_extend({ "Callback": null }, args);

                    var _onCallback = function () {
                        if (args.Callback) {
                            args.Callback();
                        }
                    };

                    if (!$listView.data("is-init")) {
                        $listView.data("is-init", true);

                        var $repeater = _controller.Utils.Repeater({
                            "ID": "Field_" + _fieldID + "_Table_" + _renderType,
                            "CssClass": "EditorDataAdminListTableTheme",
                            "PageSize": LIST_SIZE,
                            "SortEnum": _config.SortEnum,
                            "DefaultSortEnum": _config.DefaultSortEnum,
                            "SortOrderGroupKey": null,
                            "HasDelete": false,
                            "Columns": _config.Columns,
                            "RepeaterFunctions": {
                                "ContentRowAttribute": function (item) {
                                    var _rowAttr = util_htmlAttribute("data-attr-item-id", item[_config.PropertyValue]);

                                    return _rowAttr;
                                },
                                "ContentRowCssClass": function (opts) {
                                    var _item = opts.Item;
                                    var _id = _item[_config.PropertyValue];
                                    var _selected = (_config.LookupSelections[_id] == true);

                                    return "EntityLineItem" + (_selected ? " Selected" : "");
                                },
                                "FieldCellOption": function (cellOpts) {
                                    var _column = _config.Columns[cellOpts.Index];

                                    if (_column["IsNoLink"]) {

                                        switch (_column["ID"]) {

                                            case "toggle_icon":
                                                cellOpts.CssClass += "ImageToggleIconCell";
                                                break;

                                            case "kol_profile":
                                                cellOpts.CssClass += "ImageKOL_ProfileIconCell";
                                                break;
                                        }
                                    }

                                    return cellOpts;
                                },
                                "FieldValue": function (opts) {
                                    var _val = "";
                                    var _item = opts.Item;
                                    var _isEncode = true;
                                    var _isNewLineEncode = false;

                                    if (opts.IsContent) {
                                        var _column = _config.Columns[opts.Index];
                                        var _propertyPath = _column["PropertyPath"];
                                        var _isDate = (_column["IsDate"] === true);

                                        if (_propertyPath) {
                                            var _hasHighlight = util_forceBool(_column["HasHighlight"], false) && !_isDate;

                                            _val = util_propertyValue(_item, _propertyPath);

                                            if (_isDate) {
                                                _val = util_FormatDateTime(_val, "", null, false, { "ForceDayPadding": true, "IsValidateConversion": true });
                                            }

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

                                        if (_column["ID"] == "toggle_icon") {
                                            var _selected = false;
                                            var _itemID = _item[_config.PropertyDataIdentifier];

                                            if (_config.LookupSelections[_itemID] == true) {
                                                _selected = true;
                                            }

                                            _val = "<div class='EditorImageButton ImageToggleSelection" + (_selected ? " StateOn" : "") + "'>" +
                                                   "    <div class='ImageIcon' />" +
                                                   "</div>";

                                            _isEncode = false;
                                        }
                                        else if (_column["ID"] == "kol_profile") {

                                            if (_controllerKOL) {
                                                var _itemID = _item[_config.PropertyDataIdentifier];

                                                _val = "<div class='ImageKOL_ProfileIconCell'>" +
                                                       "  <div class='EditorImageButton ImageUserProfile'>" +
                                                       "      <div class='ImageIcon' " +
                                                       util_htmlAttribute("style",
                                                                          "background-image: url('" +
                                                                          _controllerKOL.Utils.ConstructKeyOpinionLeaderProfileURL({ "ID": _itemID }) +
                                                                          ")'") +
                                                       "      />" +
                                                       "  </div>" +
                                                       "</div>";
                                            }
                                            else {
                                                _val = "";
                                            }

                                            _isEncode = false;
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

                                    var _isCachedData = $listView.data("IsCached");

                                    if (_isCachedData) {
                                        $listView.removeData("IsCached");
                                        callback($listView.data("CacheData"));
                                    }
                                    else if (_config.LoadData) {
                                        _config.LoadData.apply(this, [element, sortSetting, callback]);
                                    }
                                    else {
                                        callback(null);
                                    }
                                },
                                "BindComplete": function (opts) {

                                    var _list = util_extend({
                                        "List": null, "NumItems": null
                                    }, opts.Data);

                                    $listView.data("DataSource", _list);

                                    if ($listView.data("OnCallback")) {
                                        var _fn = $listView.data("OnCallback");

                                        $listView.removeData("OnCallback");
                                        _fn.call($listView);
                                    }
                                }
                            }
                        });

                        $listView.empty()
                                 .append($repeater);

                        $listView.data("Repeater", $repeater);

                        $mobileUtil.refresh($repeater);

                        $listView.off("click.toggleSelection");
                        $listView.on("click.toggleSelection", ".EntityLineItem[data-attr-item-id]:not(.LinkDisabled)", function () {
                            var $this = $(this);
                            var _id = util_forceInt($this.attr("data-attr-item-id"), enCE.None);

                            var _onClickCallback = function () {
                                $this.trigger("events.ruc_refreshLabelCount");
                                $this.removeClass("LinkDisabled");
                            };

                            $this.addClass("LinkDisabled");

                            if (_id != enCE.None) {

                                var _selected = $this.hasClass("Selected");

                                _selected = !_selected;

                                $this.toggleClass("Selected", _selected);

                                var $toggle = $this.find(".ImageToggleSelection");

                                $toggle.toggleClass("StateOn", _selected);

                                var $item = $listViewSelections.find(".ViewListSelectionItem[" + util_htmlAttribute("item-value", _id) + "]");

                                if (_selected) {

                                    _config.LookupSelections[_id] = true;

                                    if ($item.length == 0) {
                                        var _data = $listView.data("DataSource");
                                        var _dataItem = util_arrFilter(_data ? _data.List : null, _config.PropertyDataIdentifier, _id, true);
                                        var _bridgeItem = {};

                                        _dataItem = (_dataItem.length == 1 ? _dataItem[0] : null);

                                        _bridgeItem[_config.PropertyValue] = _id;
                                        _bridgeItem[_config.PropertyText] = (_dataItem ? _dataItem[_config.PropertyDataIdentifierName] : null);

                                        $item = $(_config.GetItemHTML({ "Item": _bridgeItem }));

                                        $item.hide();
                                        $listViewSelections.append($item);

                                        $item.trigger("create");

                                        $item.toggle("height", function () {
                                            _onClickCallback();
                                        });
                                    }
                                    else {
                                        _onClickCallback();
                                    }
                                }
                                else {

                                    delete _config.LookupSelections[_id];

                                    $item.removeAttr("item-value")
                                         .toggle("height").promise().done(function () {
                                             $item.remove();
                                             _onClickCallback();
                                         });
                                }
                            }
                            else {
                                _onClickCallback();
                            }
                        });

                        //configure the searchable text view
                        var $tb = $vwSearch.find("[data-input-id='tbSearch']");
                        var $vwRepeater = null;

                        $tb.attr(DATA_ATTRIBUTE_RENDER, "searchable_field")
                           .data("SearchConfiguration",
                                {
                                    "OnRenderResult": function (result, opts) {
                                        $listView.trigger("events.refreshListView", {
                                            "IsCache": true, "Data": result, "SearchParam": opts
                                        });
                                    },
                                    "OnSearch": function (opts, callback) {

                                        if (!$vwRepeater) {
                                            $vwRepeater = $listView.find(".CRepeater");
                                        }

                                        var _sortSettings = ctl_repeater_getSortSetting($vwRepeater);

                                        _sortSettings["PageNo"] = 1;

                                        _config.LoadData($vwRepeater, _sortSettings, function (result) {
                                            callback(result);
                                        });
                                    }
                                });

                        $mobileUtil.RenderRefresh($tb, true);

                        $listView.off("events.refreshListView");
                        $listView.on("events.refreshListView", function (e, args) {

                            args = util_extend({
                                "IsCache": false, "Data": null, "SearchParam": null
                            }, args);

                            if (args.IsCache) {

                                //set flag to use cached data
                                $listView.data("IsCached", true)
                                         .data("CacheData", args.Data);

                                $listView.data("HighlightEncoder", (args.SearchParam ? args.SearchParam["HighlightEncoder"] : null));

                                //default to first page
                                ctl_repeater_setSortSettingCurrentPage($vwRepeater, 1);
                            }
                            else {

                                //remove any cached data
                                $listView.removeData("IsCached")
                                         .removeData("CacheData");
                            }

                            renderer_event_data_admin_list_bind($listView);

                        }); //end: events.refreshListView
                    }

                    $listView.data("OnCallback", _onCallback);
                    $listView.data("Repeater").trigger("events.refresh_list");
                });

                $this.data("DataItem", (util_propertyValue(_dataItem, _config.PropertyPath) || []))
                     .trigger("events.ruc_bind");
            })($(this));
        });
    }
    else {
        $element.html("<div style='color: #FF0000; font-size: 0.95em;'>" +
                      util_htmlEncode("Error :: invalid render type for user control initialization CFieldUserControl") +
                      "</div>");
    }

    $element.off("events.onInitUserControl");
    $element.on("events.onInitUserControl", function (e, args) {

        args = util_extend({ "CanAdminComponentKOL": null, "Callback": null }, args);

        var _onCallback = function () {
            if (args.Callback) {
                args.Callback();
            }
        };

        var _queue = new CEventQueue();

        //allow overrides to the can administrator component KOL
        _fnCanAdminComponentKOL = args.CanAdminComponentKOL;

        if (!_isViewMode) {
            var $list = $element.find(".GroupItem > .ViewSearch");

            $.each($list, function () {
                (function ($this) {
                    _queue.Add(function (onCallback) {
                        $this.trigger("events.ruc_refreshSearch", { "Callback": onCallback });
                    });
                })($(this));
            });
        }

        _queue.Run({ "Callback": _onCallback });
    });

    $element.off("events.userControl_getValue");
    $element.on("events.userControl_getValue", function (e, args) {
        var _lookupExtPropertyValues = args.ExtPropertyValues;
        var _renderOptions = $element.data("RenderOptions");

        if (_renderOptions) {
            for (var i = 0; i < _renderOptions.Types.length; i++) {
                var _type = _renderOptions.Types[i];
                var _config = _renderOptions.Lookup[_type];
                var _srcList = _config.GetSourceList();
                var _value = [];
                var $selections = _config.Element
                                         .find(".ViewSelections > .ContentSelections .ViewListSelectionItem[item-value]");

                $.each($selections, function () {
                    var $this = $(this);
                    var _id = util_forceInt($this.attr("item-value"), enCE.None);
                    var _item = util_arrFilter(_srcList, _config.PropertyValue, _id, true);

                    if (_item.length == 1) {
                        _item = _item[0];
                    }
                    else {
                        _item = new _config.InstanceType();
                    }

                    _item[_config.PropertyValue] = _id;

                    _value.push(_item);
                });

                _lookupExtPropertyValues[_config.PropertyPath] = _value;
            }
        }
    });

    $element.off("click.viewExtDetail");

    if (_isViewMode && _controllerKOL) {
        $element.on("click.viewExtDetail", ".GroupItem[data-render-type] .LinkClickable[item-value]:not(.LinkDisabled)", function () {
            var $this = $(this);
            var _itemID = util_forceInt($this.attr("item-value"), enCE.None);

            if (_itemID != enCE.None) {

                if (_isBaseController) {

                    _controllerKOL.ShowEntityDetailsPopup({
                        "Trigger": $this, "DataAttributeID": "item-value",
                        "TriggerController": _controller
                    });
                }
                else {

                    var $popupContent = $element.closest(".PopupContent");
                    var $popup = $mobileUtil.PopupContainer();
                    var _scrollTop = $popup.scrollTop();
                    var _duration = 700;
                    var $popupTitle = $popup.find(".PopupHeaderTitle:first");

                    var _titleHTML = $popupTitle.html();

                    _fnIndicator(true);

                    $popupContent.slideUp(_duration).promise().done(function () {

                        var $container = $("<div />");

                        $container.insertAfter($popupContent);

                        $container.off("click.dismiss");
                        $container.on("click.dismiss", "[data-attr-editor-controller-action-btn='popup_return']:not(.LinkDisabled)", function () {
                            var $this = $(this);

                            $this.addClass("LinkDisabled");

                            $container.slideUp(_duration, function () {
                                $popupContent.show();
                                $popupTitle.html(_titleHTML);

                                $popup.animate({ "scrollTop": _scrollTop }, _duration);
                                $container.remove();
                            });
                        });

                        _controllerKOL.ShowEntityDetailsPopup({
                            "Trigger": $this, "DataAttributeID": "item-value", "IsForceTriggerClickEvent": true,
                            "TriggerController": _controller,
                            "RenderContainer": $container, "RenderTitleElement": $popupTitle, "Callback": function () {
                                _fnIndicator(false);
                            }
                        });
                    });
                }
            }
        });
    }
};

//SECTION START: project specific support

CRepositoryController.prototype.ProjectOnPopulateFieldListData = function (options) {

    options = util_extend({
        "List": [], "OnSetFieldListData": function (opts) { }, "Callback": null }, options);

    if (options.Callback) {
        options.Callback();
    }
};

//SECTION END: project specific support

var CRepositoryResourceInputUserControlBase = function (options) {

    options = util_extend({
        "Controller": null, "Field": null, "FieldOptions": null, "IsReadOnly": false, "Item": null, "Target": null, "Value": null
    }, options);

    var _instance = this;

    var _controller = options.Controller;

    _instance["DOM"] = {
        "Element": null
    };

    //set the repository resource controller for current instance
    var _repositoryController = null;
    var _fnCanAdmin = null;

    if (_controller) {

        //attempt to get an instance from the source controller, if applicable
        _repositoryController = util_propertyValue(_controller, "Data.RepositoryResourceController");
        _fnCanAdmin = util_propertyValue(_controller, "State.CanAdminRepositoryResource");
    }

    if (!_repositoryController) {
        _repositoryController = new CRepositoryController();
    }

    if (!_fnCanAdmin) {
        _fnCanAdmin = function (opts) {
            if (opts["Callback"]) {
                opts.Callback(false);
            }
        };
    }

    _instance["Data"] = {
        "RepositoryResourceController": _repositoryController,
        "DefaultSearchCategoryID": enCE.None,
        "CanAdmin": _fnCanAdmin
    };

    var _isReadOnly = options.IsReadOnly;
    var $element = $(options.Target);

    var _field = (options.Field || {});

    var _renderList = util_extend({
        "IsModeSingleSelection": false,
        "IsModeSinglePrimaryItem": true,    //if it is single mode selection, whether the bridge item is primary key based such that updates to the resource property are shared
        "HasViewModeFilePreview": false,

        "InstanceType": null,

        "PropertyItemID": null,
        "PropertyBridgeID": "ResourceID",
        "PropertyBridgeIDName": "ResourceIDName",   //used for main title/name of item
        "PropertyBridgeDisplayOrder": null, //(optional) if specified then drag and drop support is also enabled for edit mode

        "PropertyFileID": "ResourceFileID",   //used for determinging whether the resource has a file associated
        "PropertyFileDisplayName": "ResourceFileDisplayName", //used for file name of the repository resource file, if it is a file
        "PropertyFileExtension": "ResourceFileExtension",    //used for file extension of the repository resource file, if it is a file

        "DefaultPopupSearchCategoryID": enCE.None,
        "PopupSearchAddEntityDocumentTypes": null,

        "CanAdminComponentKOL": null

    }, _field["_renderList"]);

    var _isModeSingle = util_forceBool(_renderList.IsModeSingleSelection, false);
    var _hasViewModeFilePreview = util_forceBool(_renderList.HasViewModeFilePreview, false);

    var STATE_PROPS = {
        "HasItemID": (util_forceString(_renderList.PropertyItemID) != ""),
        "HasDisplayOrderSupport": (util_forceString(_renderList.PropertyBridgeDisplayOrder) != ""),

        "PropertyItemID": _renderList.PropertyItemID,
        "PropertyBridgeID": _renderList.PropertyBridgeID,
        "PropertyBridgeIDName": _renderList.PropertyBridgeIDName,
        "PropertyBridgeDisplayOrder": _renderList.PropertyBridgeDisplayOrder,

        "PropertyFileID": _renderList.PropertyFileID,
        "PropertyFileDisplayName": _renderList.PropertyFileDisplayName,
        "PropertyFileExtension": _renderList.PropertyFileExtension
    };

    var LABEL_REMOVE_DOCUMENTS = (_isModeSingle ? "Remove" : "Remove Documents");

    var _item = (options.Item || {});
    var _value = options.Value;

    if (!_isModeSingle) {
        _value = (_value || []);
    }

    if (typeof _renderList.InstanceType === "string") {
        _renderList.InstanceType = eval(_renderList.InstanceType);
    }

    _instance.DOM.Element = $element;

    _instance.Data["RenderList"] = _renderList;
    _instance.Data["STATE_PROPS"] = STATE_PROPS;
    _instance.Data["IsModeSingleSelection"] = _isModeSingle;

    $element.data("SourceValue", _value);   //persist the source item/list of values (used for populate)

    $element.off("events.userControl_getValue");
    $element.on("events.userControl_getValue", function (e, args) {

        if (!args) {
            args = {};
        }

        var _isRequired = (util_forceInt($element.attr("data-attr-input-is-required"), enCETriState.No) == enCETriState.Yes);
        var _srcData = $element.data("SourceValue");

        var _value = null;
        var _fnIsMatch = function (search, resourceID) {
            return (search && util_propertyValue(search, STATE_PROPS.PropertyBridgeID) == resourceID);
        };

        var _fnPopulateItem = function (obj, index) {

            var $this = $(obj);

            var _ret = null;
            var _resourceID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-item-resource-id"), enCE.None);

            //search for existing item
            if (_isModeSingle) {
                if (_renderList.IsModeSinglePrimaryItem) {

                    //single mode selection has primary ID based bridge item (i.e. updates to the item will need to be made to the same source bridge data item)
                    _ret = _srcData;
                }
                else if (_fnIsMatch(_srcData, _resourceID)) {
                    _ret = _srcData;
                }
            }
            else {
                _ret = util_arrFilterSubset(_srcData, function (searchItem) {
                    return _fnIsMatch(searchItem, _resourceID);
                }, true);

                _ret = (_ret.length == 1 ? _ret[0] : null);
            }

            if (!_ret) {
                _ret = (_renderList.InstanceType ? new _renderList.InstanceType() : {});
            }

            util_propertySetValue(_ret, STATE_PROPS.PropertyBridgeID, _resourceID);

            if (STATE_PROPS.HasDisplayOrderSupport) {
                var _position = util_forceInt(index, 0) + 1;

                util_propertySetValue(_ret, STATE_PROPS.PropertyBridgeDisplayOrder, _position);
            }

            return _ret;

        };  //end: _fnPopulateItem

        if (_isModeSingle) {
            _srcData = (_srcData || {});
            _value = null;
        }
        else {
            _srcData = (_srcData || []);
            _value = [];
        }

        var $list = $element.find(".SectionListView > .RepositoryResourceViewLineItem[data-attr-item-resource-id]");

        if (_isModeSingle && $list.length == 1) {
            _value = _fnPopulateItem($list.get(0), 0);
        }
        else if (!_isModeSingle) {
            $.each($list, function (index) {
                var _item = _fnPopulateItem(this, index);

                _value.push(_item);
            });
        }

        args["ItemValue"] = _value;

        if (_isRequired && (_isModeSingle && !_value || !_isModeSingle && _value.length == 0)) {
            args["HasValidValue"] = false;
        }

    }); //end: events.userControl_getValue

    var _html = "";

    var _fnGetFileLinkHTML = function (item) {
        var _ret = "";

        var _repositoryResourceID = util_forceInt(util_propertyValue(item, STATE_PROPS.PropertyBridgeID), enCE.None);
        var _title = null;
        var _fileName = ""; //original file name for the associated file/link
        var _fileExtension; //file extension for file name (without leading "." for the extension)
        var _url = null;

        _title = util_propertyValue(item, STATE_PROPS.PropertyBridgeIDName);
        _fileName = util_propertyValue(item, STATE_PROPS.PropertyFileDisplayName);
        _fileExtension = util_forceString(util_propertyValue(item, STATE_PROPS.PropertyFileExtension));

        var _hasResourceFile = (util_forceInt(util_propertyValue(item, STATE_PROPS.PropertyFileID), enCE.None) != enCE.None);

        if (_hasResourceFile) {
            _url = _controller.Utils.ConstructDownloadURL({
                "TypeID": "editor", "IsResourceMode": true, "Item": item,
                "Property": STATE_PROPS.PropertyBridgeID
            });
        }

        var _hasFile = (_url != null && _url != "javascript: void(0);");

        if (!_hasFile) {
            _url = "javascript: void(0);";
        }

        _fileName = util_forceString(_fileName);

        //disable drag indicator if the view is read only or not supported by the entity properties
        var _canDrag = (!_isReadOnly && STATE_PROPS.HasDisplayOrderSupport);

        if (_canDrag) {
            _ret += "<div class='IndicatorDraggable'>" +
                    "   <img alt='' " + util_htmlAttribute("src", "<SITE_URL><IMAGE_SKIN_PATH>buttons/btn_drag.png") + " />" +
                    "</div>";
        }

        _ret += "<a class='LinkExternal WordBreak DisableLinkStyle" + (!_hasFile ? " LinkExternalStateNoLink" : "") + (_canDrag ? " DisableDragElement" : "") +
                "' data-role='none' data-rel='external' target='_blank' " +
                util_htmlAttribute("href", _url) + ">" +
                "       <div class='EditorImageButton ImageDownloadFile" + (!_hasFile ? " StatePlaceholderOn" : "") + "' " +
                util_htmlAttribute("title", _fileName, null, true) + ">" +
                "           <div class='ImageIcon' />" +
                "       </div>" +
                "<span class='LabelFileName'>" + util_htmlEncode(_title) + "</span>" +
                "</a>";

        if (_isReadOnly && _hasViewModeFilePreview) {
            var _canPreviewFile = false;
            var _isImage = false;

            if (_hasFile) {

                _fileExtension = util_forceString(_fileExtension).toLowerCase();

                switch (_fileExtension) {

                    case "jpg":
                    case "png":
                    case "bmp":
                        _canPreviewFile = true;
                        _isImage = true;
                        break;

                    case "pdf":
                        _canPreviewFile = true;
                        break;

                    default:
                        _canPreviewFile = false;
                        break;
                }
            }

            _ret += "<div class='FilePreview'" + (_hasFile ? " " + util_htmlAttribute("title", _fileName, null, true) : "") + ">";

            if (_canPreviewFile) {

                var _inlineURL = _url + "&IsAttachment=" + enCETriState.No;

                _ret += "<div class='Content " + (_isImage ? "ViewModeImage" : "ViewModeFrame") + "'>";

                _ret += "   <div class='Header'>" +
                        "   <div class='Title'>" + "<span>" + util_htmlEncode(_fileName) + "</span>" + "</div>" +
                        "       <div class='LinkClickable ButtonTheme MaterialLink LinkInline' " +
                        util_htmlAttribute("data-attr-user-control-button-id", "fullscreen_resource_file") + ">" +
                        "<i class='material-icons'>fullscreen</i>" +
                        "<div class='Label'>" + util_htmlEncode("Fullscreen") + "</div>" +
                        "       </div>" +
                        "   </div>";

                if (_isImage) {
                    _ret += "   <img class='LinkViewFullscreen' " + util_htmlAttribute("alt", _title, null, true) + " " + util_htmlAttribute("src", _inlineURL) + " />";
                }
                else {
                    _ret += "   <iframe frameborder='0' " + util_htmlAttribute("src", _inlineURL) + " />";
                }

                _ret += "   <div class='Divider' />";

                _ret += "</div>";
            }
            else {
                _ret += "<div class='Message'>" +
                        "<i class='material-icons'>error_outline</i>" +
                        "<div class='Label'>" + util_htmlEncode("File preview is not supported.") + "</div>" +
                        "</div>";
            }

            _ret += "</div>";
        }

        return _ret;

    };  //end: _fnConstructURL

    var _lookupActionsHTML = {};

    var _fnGetItemHTML = function (item, isInnerHTML) {

        isInnerHTML = util_forceBool(isInnerHTML, false);

        var _ret = "";

        var _id = util_forceInt(STATE_PROPS.HasItemID ? util_propertyValue(item, STATE_PROPS.PropertyItemID) : null, enCE.None);
        var _resourceID = util_forceInt(util_propertyValue(item, STATE_PROPS.PropertyBridgeID), enCE.None);

        if (!isInnerHTML) {
            var _attrStr = util_htmlAttribute("data-attr-item-id", _id) + " " + util_htmlAttribute("data-attr-item-resource-id", _resourceID);

            _ret += "<div class='PluginEditorCardView RepositoryResourceViewLineItem" +
                    (!_isReadOnly && STATE_PROPS.HasDisplayOrderSupport ? " EditorDragViewLineItem" : "") + "' " + _attrStr + ">";    //open main tag #1
        }

        var _actionsHTML = _lookupActionsHTML["mode_actions"];

        if (_actionsHTML == null) {

            _actionsHTML = "";

            _actionsHTML += _controller.Utils.HTML.GetButton({
                "CssClass": "ButtonTheme",
                "Content": "View Details", "Attributes": {
                    "data-icon": "info",
                    "data-attr-user-control-button-id": "view_details"
                }
            });

            if (!_isReadOnly) {
                _actionsHTML += _controller.Utils.HTML.GetButton({
                    "Content": "Delete", "Attributes": {
                        "data-icon": "delete",
                        "data-attr-user-control-button-id": "remove_item"
                    }
                });
            }

            _lookupActionsHTML["mode_actions"] = _actionsHTML;
        }

        _ret += "   <div class='HiddenDragElement ActionButtons'>" + _actionsHTML + "</div>";

        _ret += _fnGetFileLinkHTML(item);

        if (!isInnerHTML) {
            _ret += "</div>";   //close main tag #1
        }

        return _ret;

    };  //end: _fnGetItemHTML

    if (!_isReadOnly) {

        _html += "<div class='Header'>" +
                 _controller.Utils.HTML.GetButton({
                     "Content": "Edit", "Attributes": {
                         "data-icon": "search",
                         "data-attr-user-control-button-id": "search_popup"
                     }
                 }) +
                 _controller.Utils.HTML.GetButton({
                     "Content": LABEL_REMOVE_DOCUMENTS, "Attributes": {
                         "data-attr-user-control-button-id": "clear_items",
                         "data-icon": "delete",
                         "style": "display: none;"  //default hidden
                     }
                 }) +
                 "</div>";
    }

    _html += "<div class='SectionListView" + (_isReadOnly ? "" : " EditorDraggableContainer EditorDraggableOn") + "'>";

    if (_isModeSingle) {
        if (_value) {
            _html += _fnGetItemHTML(_value);
        }
    }
    else {

        for (var i = 0; i < _value.length; i++) {
            var _item = _value[i];

            _html += _fnGetItemHTML(_item);
        }
    }

    _html += "</div>";

    _html += "<div class='EditorViewNoRecords'>" +
             "  <div class='EditorNoRecordsLabel'>" + util_htmlEncode(_isModeSingle ? "Document is not available." : "There are no documents available.") + "</div>" +
             "</div>";

    $element.html(_html)
            .addClass("RepositoryResourceInputUserControl");

    $mobileUtil.refresh($element);

    var $vwListView = $element.find(".SectionListView:first");
    var $clClearAll = $element.find("[" + util_htmlAttribute("data-attr-user-control-button-id", "clear_items") + "]");

    //configure the draggable events, if applicable
    if (!_isReadOnly && STATE_PROPS.HasDisplayOrderSupport) {
        var _dragInstance = _controller.Utils.Sortable({
            "Containers": $vwListView,
            "SelectorDraggable": ".EditorDragViewLineItem",
            "DropOptions": {
                "IsDisableDropEvent": true
            }
        });

        $vwListView.data("DragInstance", _dragInstance);
    }

    var PREFIX_NAMESPACE = "uc_repo_";
    var EVENT_NAMES = {
        "RefreshNoRecordsState": "events." + PREFIX_NAMESPACE + "refreshNoRecordState",
        "OnButtonAction": "click." + PREFIX_NAMESPACE + "onButtonAction",
        "PopulateSelectionsID": "events." + PREFIX_NAMESPACE + "populateSelectionsID",
        "OnAppendItem": "events." + PREFIX_NAMESPACE + "onAppendItem",
        "OnUpdateItem": "events." + PREFIX_NAMESPACE + "onUpdateItem",
        "ClickViewFilePreviewFullscreen": "click." + PREFIX_NAMESPACE + "onViewFilePreviewFullscreen"
    };

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
        var $item = $this.closest("[data-attr-item-id][data-attr-item-resource-id]");

        $this.addClass("LinkDisabled");

        switch (_buttonID) {

            case "view_details":

                var _resourceID = util_forceInt($item.attr("data-attr-item-resource-id"), enCE.None);

                if (_resourceID != enCE.None) {

                    var _canAdmin = false;
                    var _fnCanAdminItem = _instance.Data.CanAdmin;

                    if (!_fnCanAdminItem) {
                        _fnCanAdminItem = function (opts) {
                            if (opts["Callback"]) {
                                opts.Callback(false);
                            }
                        };
                    }

                    _fnCanAdminItem({
                        "ResourceID": _resourceID,
                        "Callback": function (canAdmin) {

                            _canAdmin = util_forceBool(canAdmin, _canAdmin);

                            _instance.OnViewRepositoryResourceDetails({
                                "ResourceID": _resourceID,
                                "CanAdmin": _canAdmin,
                                "Callback": _onClickCallback,
                                "OnEditSaveCallback": function (saveOpts) {

                                    saveOpts = util_extend({ "Item": null }, saveOpts);

                                    var _resource = saveOpts.Item;

                                    if (_resource && util_forceInt(_resource[enColRepositoryResourceProperty.ResourceID], enCE.None) != enCE.None) {
                                        $(_instance.DOM.Element).trigger(EVENT_NAMES.OnUpdateItem, { "ResourceItem": _resource });
                                    }
                                },
                                "CanAdminComponentKOL": _renderList.CanAdminComponentKOL
                            });

                        }
                    });
                }
                else {
                    _onClickCallback();
                }

                break;  //end: view_details

            case "remove_item":
            case "clear_items":

                var _title = "";
                var _message = "";
                var _isRemoveAll = (_buttonID == "clear_items");

                if (_isRemoveAll && !_isModeSingle) {
                    _title = "Remove Documents";
                    _message = "Are you sure you want to remove all documents?";
                }
                else {
                    _title = "Remove";
                    _message = "Are you sure you want to remove the document?";
                }

                dialog_confirmYesNo(_title, _message, function () {

                    if (_isRemoveAll) {
                        $vwListView.empty();
                        $element.trigger(EVENT_NAMES.RefreshNoRecordsState);
                        _onClickCallback();
                    }
                    else {

                        //remove the attributes used to identify the data item
                        $item.removeAttr("data-attr-item-id")
                             .removeAttr("data-attr-item-resource-id");

                        $item.toggle("height", function () {
                            _onClickCallback();
                            $item.remove();
                            $element.trigger(EVENT_NAMES.RefreshNoRecordsState);
                        });
                    }

                }, _onClickCallback);

                break;  //end: remove/clear item

            case "search_popup":

                _instance.OnSearchRepositoryResource({ "Callback": _onClickCallback });
                break;  //end: search_popup

            case "fullscreen_resource_file":

                var $vwPreview = $this.closest(".FilePreview");
                var $vwContent = $vwPreview.children(".Content:first");
                var $body = $("body");

                var _fullscreen = $vwPreview.hasClass("FullScreenFixedViewTransition");

                if (!_fullscreen) {
                    $body.data("restore-resource-preview-file-scrolltop", $(window).scrollTop());
                }

                $vwPreview.toggleClass("FullScreenFixedViewTransition");
                $vwContent.toggleClass("ScrollableContent ScrollbarPrimary");
                $body.toggleClass("ViewOverflowHidden");

                if (_fullscreen) {
                    var _scrollTop = util_forceFloat($body.data("restore-resource-preview-file-scrolltop"), 0);

                    $body.removeData("restore-resource-preview-file-scrolltop");
                    $(window).scrollTop(_scrollTop);
                }

                $mobileUtil.Configuration.ToggleScrollTop = _fullscreen;
                $(window).trigger("scroll");

                if (!_fullscreen) {
                    $vwContent.scrollTop(0);
                }

                $this.children(".Label:first").text(!_fullscreen ? "Close" : "Fullscreen");
                $this.children(".material-icons:first").text(!_fullscreen ? "fullscreen_exit" : "fullscreen");

                _onClickCallback();

                break;  //end: fullscreen_resource_file

            default:
                _onClickCallback();
                break;
        }

    }); //end: OnButtonAction

    $element.off(EVENT_NAMES.RefreshNoRecordsState);
    $element.on(EVENT_NAMES.RefreshNoRecordsState, function () {
        var $search = $vwListView.children(".PluginEditorCardView");
        var _count = $search.length;

        if (!_isModeSingle) {
            $mobileUtil.ButtonSetTextByElement($clClearAll, LABEL_REMOVE_DOCUMENTS + " (" + util_formatNumber(_count) + ")");
        }

        $clClearAll.toggle(_count > 0);
        $element.toggleClass("ModeNoRecords", (_count == 0));

    }); //end: RefreshNoRecordsState

    $element.off(EVENT_NAMES.PopulateSelectionsID);
    $element.on(EVENT_NAMES.PopulateSelectionsID, function (e, args) {

        args = util_extend({ "Callback": null }, args);

        var _ret = [];
        var $list = $element.find(".SectionListView [data-attr-item-id][data-attr-item-resource-id]");

        $.each($list, function () {
            var _resourceID = util_forceInt($(this).attr("data-attr-item-resource-id"), enCE.None);

            if (_resourceID != enCE.None) {
                _ret.push(_resourceID);
            }
        });

        if (args.Callback) {
            args.Callback(_ret);
        }
        else {
            args["Result"] = _ret;
        }

    }); //end: PopulateSelectionsID

    $element.off(EVENT_NAMES.OnAppendItem);
    $element.on(EVENT_NAMES.OnAppendItem, function (e, args) {

        args = util_extend({ "Callback": null, "Item": null }, args);

        var $item = $(_fnGetItemHTML(args.Item));

        $item.hide();

        if (_isModeSingle) {

            //clear existing items prior to adding current entry
            $vwListView.empty();
        }

        $vwListView.append($item);
        $mobileUtil.refresh($item);

        $element.trigger(EVENT_NAMES.RefreshNoRecordsState);
        $item.show();

        if (args.Callback) {
            args.Callback({ "Element": $item });
        }

    }); //end: OnAppendItem

    $element.off(EVENT_NAMES.OnUpdateItem);
    $element.on(EVENT_NAMES.OnUpdateItem, function (e, args) {

        args = util_extend({ "ResourceItem": null, "Callback": null }, args);

        var _resource = args.ResourceItem;
        var _resourceID = _resource[enColRepositoryResourceProperty.ResourceID];

        //search for the elements matching the resource ID
        var $list = $vwListView.find("[" + util_htmlAttribute("data-attr-item-resource-id", _resourceID) + "]");
        var _tempBridgeItem = _instance.ConvertRepositoryResourceToBridgeItem(_resource, { "IsValidateFileItemProperty": true });
        var _html = _fnGetItemHTML(_tempBridgeItem, true); //restrict to inner HTML content only

        //NOTE: should only be at most one
        $.each($list, function () {
            var $this = $(this);

            //update the contents of the element (ensure only children are updated and not the containing element; preserve data attributes)
            $this.html(_html);
            $mobileUtil.refresh($this);
        });

        if (args.Callback) {
            args.Callback();
        }

    }); //end: OnUpdateItem

    $element.off(EVENT_NAMES.ClickViewFilePreviewFullscreen);

    if (_hasViewModeFilePreview) {
        $element.on(EVENT_NAMES.ClickViewFilePreviewFullscreen, ".FilePreview:not(.FullScreenFixedViewTransition) .LinkViewFullscreen:not(.LinkDisabled)", function () {

            var $this = $(this);

            $this.addClass("LinkDisabled");

            var $parent = $this.closest(".FilePreview");
            var $clFullscreen = $parent.find(".Content > .Header [data-attr-user-control-button-id='fullscreen_resource_file']:first");

            if ($clFullscreen.length == 1) {
                $clFullscreen.trigger("click");
            }

            $this.removeClass("LinkDisabled");

        }); //end: ClickViewFilePreviewFullscreen
    }

    _instance.Data["EVENT_NAMES"] = EVENT_NAMES;

    //refresh the default no records state for the list view
    $element.trigger(EVENT_NAMES.RefreshNoRecordsState);

};  //end: CRepositoryResourceInputUserControlBase

CRepositoryResourceInputUserControlBase.prototype.OnViewRepositoryResourceDetails = function (options) {

    options = util_extend({
        "ResourceID": null, "CanAdmin": false, "OnEditSaveCallback": null, "CanAdminComponentKOL": null,
        "Callback": null
    }, options);

    var _instance = this;

    var _resourceID = util_forceInt(options.ResourceID, enCE.None);
    var _callback = function () {
        if (options.Callback) {
            options.Callback();
        }
    };

    if (_resourceID != enCE.None) {

        var _repositoryResourceController = _instance.Data.RepositoryResourceController;
        var _canAdmin = util_forceBool(options.CanAdmin, false);

        _repositoryResourceController.PopupEditResource({
            "EditID": _resourceID,
            "IsViewMode": true,
            "ToggleEditButton": _canAdmin,
            "IsHideScrollbar": true,
            "OnEditSaveCallback": function (opts) {
                if (options.OnEditSaveCallback) {
                    options.OnEditSaveCallback.call(this, opts);
                }
            },
            "CanAdminComponentKOL": options.CanAdminComponentKOL,
            "Callback": _callback
        });
    }
    else {
        _callback();
    }
};

CRepositoryResourceInputUserControlBase.prototype.OnSearchRepositoryResource = function (options) {

    var _instance = this;

    options = util_extend({ "Callback": null }, options);

    var _callback = function () {
        if (options.Callback) {
            options.Callback();
        }
    };

    var _defaultCategoryID = util_forceInt(_instance.Data.DefaultSearchCategoryID, enCE.None);
    var $parent = $(_instance.DOM.Element);

    var _fnAddItem = function (item, opts) {

        opts = util_extend({ "Item": null }, opts);

        opts.Item = item;

        $parent.trigger(_instance.Data.EVENT_NAMES.OnAppendItem, opts);

    };  //end: _fnAddItem

    var _renderList = _instance.Data.RenderList;
    var _restrictedDocumentTypes = (_renderList.PopupSearchAddEntityDocumentTypes || []);
    var _arrRestrictDocumentTypes = null;
    var _isRestrictDocumentTypeFilter = false;

    if (_restrictedDocumentTypes.length > 0) {
        _arrRestrictDocumentTypes = [];

        for (var i = 0; i < _restrictedDocumentTypes.length; i++) {
            var _documentType = _restrictedDocumentTypes[i];

            _arrRestrictDocumentTypes.push(_documentType[enColRepositoryDocumentTypeProperty.DocumentTypeID]);
        }

        _isRestrictDocumentTypeFilter = true;
    }

    var _opts = {
        "CategoryID": _defaultCategoryID,
        "IsHideScrollbar": true,
        "IsMultiSelect": (_instance.Data.IsModeSingleSelection != true),
        "IsRestrictDocumentTypeFilter": _isRestrictDocumentTypeFilter,
        "ListDisableSelectionID": [],
        "Events": {
            "OnConfigureParams": function (params) {

                if (_arrRestrictDocumentTypes != null) {
                    params.ExtendedFilters["RestrictDocumentTypes"] = _arrRestrictDocumentTypes;
                }

            },
            "OnSave": function (opts) {

                opts = util_extend({ "SelectedItem": null, "List": null }, opts);

                var _selections = [];

                if (_instance.Data.IsModeSingleSelection) {
                    if (opts.SelectedItem) {
                        _selections.push(opts.SelectedItem);
                    }
                }
                else {
                    _selections = (opts.List || []);
                }

                if (_selections.length > 0) {
                    var _queue = new CEventQueue();
                    var $focus = null;

                    blockUI();

                    for (var i = 0; i < _selections.length; i++) {
                        (function (item) {

                            _queue.Add(function (onCallback) {

                                _fnAddItem(item, {
                                    "IsFocus": false,
                                    "Callback": function (opts) {

                                        if (!$focus && opts.Element) {
                                            $focus = opts.Element;
                                        }

                                        setTimeout(function () {
                                            onCallback();
                                        }, 10);
                                    }
                                });
                            });

                        })(_selections[i]);
                    }

                    setTimeout(function () {

                        _queue.Run({
                            "Callback": function () {
                                unblockUI();

                                if ($focus) {
                                    $mobileUtil.AnimateSmoothScroll(null, 500, { "Top": $focus.offset().top });
                                }
                            }
                        });
                    }, 100);
                }
            }
        },
        "BridgeEntity": {
            "ListPropertyPath": null,
            "Instance": _renderList.InstanceType,
            "PropertyID_Name": _instance.Data.STATE_PROPS.PropertyBridgeIDName,
            "PropertyValue": _instance.Data.STATE_PROPS.PropertyBridgeID,
            "ParentPropertyText": enColRepositoryResourceProperty.Name,
            "OnConfigureItem": function (opts) {

                var _bridgeItem = opts.Item;
                var _resource = opts.LookupItem;

                //for the bridge item, set the repository resource's file details (such as the associated file name and ID)
                util_propertySetValue(_bridgeItem, _instance.Data.STATE_PROPS.PropertyFileDisplayName, _resource[enColRepositoryResourceProperty.FileDisplayName]);

                var _fileID = util_forceInt(_resource[enColRepositoryResourceProperty.FileID], enCE.None);

                util_propertySetValue(_bridgeItem, _instance.Data.STATE_PROPS.PropertyFileID, _fileID);

                if (util_forceString(_instance.Data.STATE_PROPS.PropertyFileExtension) != "") {
                    var _fileName = util_forceString(_resource[enColRepositoryResourceProperty.FileIDName]);
                    var _fileExt = null;
                    var _index = _fileName.lastIndexOf(".");

                    if (_index >= 0) {
                        _fileExt = _fileName.substr(_index + 1);    //get file extension without the period
                    }

                    util_propertySetValue(_bridgeItem, _instance.Data.STATE_PROPS.PropertyFileExtension, _fileExt);
                }
            }
        },
        "AddActionOptions": {},
        "Callback": _callback
    };

    util_extend(_opts.AddActionOptions, _renderList["AddActionOptions"], true, true);

    util_extend(_opts.AddActionOptions, {
        "DocumentTypes": _restrictedDocumentTypes,
        "OnSaveCallback": function (opts) {

            var _resource = opts.Item;

            if (_resource && util_forceInt(_resource[enColRepositoryResourceProperty.ResourceID], enCE.None) != enCE.None) {

                var _bridgeItem = _instance.ConvertRepositoryResourceToBridgeItem(_resource, { "IsValidateFileItemProperty": true });

                _fnAddItem(_bridgeItem);
            }
        }
    }, true, true);

    //get current selection of resource IDs
    var _fnShowPopupResource = function (selections) {

        selections = (selections || []);
        _opts.ListDisableSelectionID = $.merge(_opts.ListDisableSelectionID, selections);

        _instance.Data.RepositoryResourceController.PopupSearchResource(_opts);
    };

    if ($parent.length == 1) {
        $parent.trigger(_instance.Data.EVENT_NAMES.PopulateSelectionsID, {
            "Callback": function (list) {
                _fnShowPopupResource(list);
            }
        });
    }
    else {
        _fnShowPopupResource();
    }
};

//converts a repository resource entity item into a bridge object (populates both object level fields include the lookup values, if applicable)
CRepositoryResourceInputUserControlBase.prototype.ConvertRepositoryResourceToBridgeItem = function (resource, options) {

    var _instance = this;
    var _renderList = _instance.Data.RenderList;

    options = util_extend({ "IsValidateFileItemProperty": false }, options);

    var _ret = (_renderList.InstanceType ? new _renderList.InstanceType() : {});

    util_propertySetValue(_ret, _instance.Data.STATE_PROPS.PropertyBridgeID, resource[enColRepositoryResourceProperty.ResourceID]);
    util_propertySetValue(_ret, _instance.Data.STATE_PROPS.PropertyBridgeIDName, resource[enColRepositoryResourceProperty.Name]);

    //for the bridge item, set the repository resource's file details (such as the associated file name and ID)
    util_propertySetValue(_ret, _instance.Data.STATE_PROPS.PropertyFileDisplayName, resource[enColRepositoryResourceProperty.FileDisplayName]);

    var _fileID = util_forceInt(resource[enColRepositoryResourceProperty.FileID], enCE.None);

    util_propertySetValue(_ret, _instance.Data.STATE_PROPS.PropertyFileID, _fileID);

    if (util_forceString(_instance.Data.STATE_PROPS.PropertyFileExtension) != "") {
        var _fileName = util_forceString(resource[enColRepositoryResourceProperty.FileIDName]);
        var _fileExt = null;
        var _index = _fileName.lastIndexOf(".");

        if (_index >= 0) {
            _fileExt = _fileName.substr(_index + 1);    //get file extension without the period
        }

        util_propertySetValue(_ret, _instance.Data.STATE_PROPS.PropertyFileExtension, _fileExt);
    }

    if (options.IsValidateFileItemProperty) {

        var _fileItem = resource[enColCERepositoryResource_JSONProperty.TempFileItem];  //check if an update temp file item is available

        //if file item does not exist from the temp property, use the value from the standard property
        if (util_isNullOrUndefined(_fileItem)) {
            _fileItem = resource[enColCERepositoryResourceProperty.FileItem];
        }

        _fileItem = (_fileItem || {});

        var _fileName = util_propertyValue(_fileItem, enColFileProperty.Name);
        var _fileExtension = util_propertyValue(_fileItem, enColFileProperty.Extension);

        if (util_forceString(_fileName) != "") {
            util_propertySetValue(_ret, _instance.Data.STATE_PROPS.PropertyFileDisplayName, _fileName);
        }

        if (util_forceString(_instance.Data.STATE_PROPS.PropertyFileExtension) != "" && (util_forceString(_fileExtension) != "")) {
            util_propertySetValue(_ret, _instance.Data.STATE_PROPS.PropertyFileExtension, _fileExtension);
        }
    }

    return _ret;
};