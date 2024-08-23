var CEditorResourceController = function (initOpts) {
    var _instance = this;

    initOpts = util_extend({ "IsDisableExtControllerInit": false }, initOpts);

    _instance["DOM"] = {
        "Element": null
    };

    var _utils = pluginEditor_getUtils();

    _instance["Utils"] = util_extend({
        "ContextEditorGroupID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-attr-home-editor-group-id"), enCE.None);
        },
        "ContextEditorGroupPlatformID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-platform-id"), enCE.None);
        },
        "ContextEditorGroupComponentID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-component-id"), enCE.None);
        }
    }, _utils);

    _instance["PluginInstance"] = null;
    _instance["FileUploadSupportedExt"] = [
        "jpg", "jpeg", "png", "gif", "doc", "docx", "xlsx", "xls", "xlsm", "ppt", "pptx", "pdf", "txt",
        //audio extensions
        ".mp3", ".m4a", ".aac", ".ac3", ".ogg",
        //video extensions
        ".mp4", ".avi", ".mpeg", ".mpg", ".mkv", ".3gp", ".webm"
    ];
    _instance["FileUploadImageSupportedExt"] = ["jpg", "jpeg", "png", "gif"];
    _instance["Data"] = {
        "MiscellaneousClassificationID": util_forceInt("%%TOK|ROUTE|PluginEditor|MiscellaneousClassificationID%%", enCE.None),
        "MiscellaneousPlatformID": util_forceInt("%%TOK|ROUTE|PluginEditor|MiscellaneousPlatformID%%", enCE.None),
        "KOL_ManagerComponentID": util_forceInt("%%TOK|ROUTE|PluginEditor|KOL_ManagerComponentID%%", enCE.None),

        "IsEditorToolResourceModeRepositoryResource": util_forceBool("%%TOK|ROUTE|PluginEditor|IsEditorToolResourceModeRepositoryResource%%", true),
        "ResourceTooltipTitle": "Market Access Tool / Resource — Document",
        "RepositoryResourceController": (initOpts.IsDisableExtControllerInit ? null : new CRepositoryController()) //requires: the repository resource related definition as well
    };

    _instance["State"] = {

        //lazy load
        "PlatformComponentPermissions": null,
        "KOL_PlatformComponentPermission": null
    };
};

CEditorResourceController.prototype.AnimationDuration = "normal";

CEditorResourceController.prototype.IsCurrentViewMode = function (options) {
    options = util_extend({ "ViewMode": null }, options);

    var _instance = this;
    var $vws = null;

    if (!_instance.DOM["Views"] && _instance.DOM.Element) {
        _instance.DOM["Views"] = $(_instance.DOM.Element).find(".EditorEmbeddedView");
    }

    $vws = $(_instance.DOM["Views"]);

    return ($vws.filter(".ActiveView").attr("data-attr-view-mode") == options.ViewMode);
};

CEditorResourceController.prototype.ActiveEmbeddedView = function () {
    var _instance = this;

    var $ret = null;
    var $search = null;

    if (_instance.DOM["Views"]) {
        $search = $(_instance.DOM.Views);
    }
    else if (_instance.DOM.Element) {
        $search = _instance.DOM.Element.find(".EditorEmbeddedView");
    }

    $ret = $search.filter(".ActiveView[data-attr-view-mode]");

    return $ret;
};

CEditorResourceController.prototype.Bind = function (options, callback) {

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

    if (!_pluginInstance) {
        _pluginInstance = _controller.PluginInstance;
    }

    if (!$element.data("init-events")) {
        $element.data("init-events", true);

        _controller.DOM.Element = $element;
        _controller.PluginInstance = _pluginInstance;
        
        $element.data("OnNavigateBackRequest", function (request) {

            if (_controller.IsCurrentViewMode({ "ViewMode": "detail" })) {

                request.IsHandled = true;

                var $active = _controller.ActiveEmbeddedView();
                var $target = $(_controller.DOM["Views"]).filter("[data-attr-view-mode='master']");

                $active.addClass("EffectBlur")
                       .slideUp(_controller.AnimationDuration, function () {
                           $active.removeClass("EffectBlur");

                           $target.hide()
                                  .slideDown(_controller.AnimationDuration, function () {

                                      //clear the toolbar buttons
                                      if (options.LayoutManager) {
                                          options.LayoutManager.ToolbarSetButtons({ "IsClear": true });
                                      }

                                      $active.removeClass("ActiveView");
                                      $target.addClass("ActiveView");

                                      _controller.Bind({ "IsRefresh": true, "LayoutManager": options.LayoutManager });
                                  });
                       });
            }

        });
    }

    var $vwSelection = $element.children(".PluginEditorResourceSelection");
    var $vwFileListView = $element.children(".PluginEditorResourceCategoryDetails");

    var _fnBindView = function () {

        var _queue = new CEventQueue();

        if (_controller.State.PlatformComponentPermissions == null) {

            //get permission summary of all platforms for this component (current classification)
            _queue.Add(function (onCallback) {
                _controller.DOM.Element.trigger("events.getComponentUserPermission", {
                    "IsContextFilter": false, "IsListFormat": true,
                    "Callback": function (result) {
                        _controller.State.PlatformComponentPermissions = (result || []);
                        onCallback();
                    }
                });
            });
        }

        if (_controller.State.KOL_PlatformComponentPermission == null) {

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

        var _components = $(_controller.DOM.Element).data("data-resource-component-list");

        if (!_components) {
            _queue.Add(function (onCallback) {
                APP.Service.Action({ "c": "PluginEditor", "m": "ComponentListResourceCategoryAdmin" }, function (componentData) {

                    _components = (componentData ? componentData.List : null);
                    _components = (_components || []);

                    $(_controller.DOM.Element).data("data-resource-component-list", _components);

                    onCallback();
                });
            });
        }

        _queue.Run({
            "Callback": function () {
                _controller.ActiveEmbeddedView().trigger("events.bind", { "Callback": _callback, "Options": options });
            }
        });

    };  //end: _fnBindView

    if ($vwSelection.length == 0) {

        $element.html("<div class='EditorEmbeddedView PluginEditorResourceSelection ActiveView' data-attr-view-mode='master'>" +
                      " <div class='EditorDraggableContainer' />" +
                      " <div class='ModeToggleView Label'>" + util_htmlEncode("Select a category above to view the related tools and resources") + "</div>" +
                      "</div>" +
                      "<div class='EditorEmbeddedView PluginEditorResourceCategoryDetails' data-attr-view-mode='detail' style='display: none;'>" +
                      " <div class='Title'>" +
                      "     <div class='Label' />" +
                      "     <div class='Description' />" +
                      " </div>" +
                      " <div class='EditorElementDropdown SortModeView'>" +
                      "     <select id='ddlResourceSort' data-corners='false' data-mini='true' data-mini='true' />" +
                      " </div>" +
                      " <div class='EditorDraggableContainer EditorResourceListView' " + util_renderAttribute("pluginEditor_fileDisclaimer") + ">" +
                      "     <div class='EditorViewNoRecords'>" +
                      "         <i class='material-icons'>error_outline</i>" +
                      "         <div class='Label'>" + util_htmlEncode("No records were found.") + "</div>" + 
                      "     </div>" +
                      " </div>" +
                      "</div>");
        $mobileUtil.refresh($element);

        $vwSelection = $element.children(".PluginEditorResourceSelection");
        $vwFileListView = $element.children(".PluginEditorResourceCategoryDetails");

        $vwSelection.toggleClass("EditorBrowser_IE", $browserUtil.IsIE);
        $vwFileListView.toggleClass("EditorBrowser_IE", $browserUtil.IsIE);

        var $vwDetails = $vwSelection.children(".EditorDraggableContainer");

        var $vwResourceListView = $vwFileListView.children(".EditorResourceListView");

        $vwResourceListView.off("callout_tooltip.getContent");
        $vwResourceListView.on("callout_tooltip.getContent", function (e, args) {

            var $this = $(args.Trigger);
            var _resourceID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-editor-resource-id"), enCE.None);
            
            var $parent = $this.closest(".PluginEditorResourceCategoryDetails");

            var _editorResourceCategory = ($parent.data("Item") || []);
            var _editorResources = (_editorResourceCategory[enColCEEditorResourceCategoryProperty.EditorResources] || []);

            var _fields = [];
            var _renderDataItem = {};

            var _fnAddTempField = function (prop, value, title) {
                var _field = new CEditorRenderField();

                _field[enColCEditorRenderFieldProperty.EditorDataTypeID] = enCEEditorDataType.Label;
                _field[enColCEditorRenderFieldProperty.Title] = title;
                _field[enColCEditorRenderFieldProperty.PropertyPath] = prop;

                _fields.push(_field);

                util_propertySetValue(_renderDataItem, prop, value);

            };  //end: _fnGetTempField

            var _editorResource = util_arrFilter(_editorResources, enColEditorResourceProperty.ResourceID, _resourceID, true);

            _editorResource = (_editorResource.length == 1 ? _editorResource[0] : null);

            if (_editorResource) {

                var _html = "";
                var _href = util_forceString($this.attr("href"));

                _fnAddTempField("ResourceName", util_htmlEncode(_editorResource[enColEditorResourceProperty.RepositoryResourceIDName], true), "Title");

                if (_href != "") {
                    var _displayName = _editorResource[enColEditorResourceProperty.RepositoryResourceFileDisplayName];

                    _displayName = util_forceString(_displayName);

                    _fnAddTempField("ResourceFileLink",
                                    "<a class='LinkExternal WordBreak DisableLinkStyle' data-role='none' data-rel='external' target='_blank' " +
                                    util_htmlAttribute("href", _href) + " " + util_htmlAttribute("title", _displayName, null, true) + ">" +
                                    "    <div class='EditorImageButton ImageDownloadFile'>" +
                                    "        <div class='ImageIcon' />" +
                                    "    </div>" +
                                    "<span class='LabelFileName'>" + util_htmlEncode(_displayName) + "</span>" +
                                    "</a>",
                                    "");
                }

                _html += "<div class='EditorNotificationTooltipView' " + util_renderAttribute("pluginEditor_fileDisclaimer") + ">" +
                     "  <div class='Title'>" +
                     "      <div class='Label'>" + util_htmlEncode(_controller.Data.ResourceTooltipTitle) + "</div>" +
                     "  </div>";

                _html += _controller.Utils.HTML.RenderOptionTableHTML({
                    "Controller": _controller, "List": _fields, "IsRenderAllModes": true
                });

                _html += "</div>";

                var $vw = $("<div>" + _html + "</div>");
                var $list = $vw.find("[data-attr-input-element]");

                $.each($list, function () {
                    var $this = $(this);
                    var _property = $mobileUtil.GetClosestAttributeValue($this, "data-attr-prop-path");
                    var _val = util_propertyValue(_renderDataItem, _property);

                    $this.html(_val);
                });

                //remove the tooltip once user has clicked on an link
                $vw.off("click.tooltip_onDismissLinkClick");
                $vw.on("click.tooltip_onDismissLinkClick", function (e, args) {
                    var $target = $(e.target);
                    var $search = $target.closest(".LinkExternal, .tooltipster-base");

                    if ($search.is(".tooltipster-base") == false) {
                        $search.closest(".tooltipster-base").remove();
                    }
                });

                $mobileUtil.refresh($vw);
                args.SetCalloutContent($vw);
            }

        }); //end: callout_tooltip.getContent

        $vwSelection.off("events.bind");
        $vwSelection.on("events.bind", function (e, args) {

            args = util_extend({ "Callback": null, "IsEditToggle": false, "IsUpdate": false, "Options": null }, args);

            var options = (args.Options || {}); //must use the options provided in bind event arguments (not the global version during declaration); redeclared
            var _isRefresh = (options["IsRefresh"] == true);

            var _fnGetList = function (filterParams, dataCallback) {

                if (_isRefresh) {

                    if (dataCallback) {
                        dataCallback();
                    }

                    return;
                }

                $element.trigger("events.getComponentUserPermission", {
                    "Callback": function (permSummary) {

                        $element.trigger("events.getLayoutManager", {
                            "Callback": function (layoutManager) {

                                filterParams = util_extend({}, filterParams);
                                
                                var _permission = (permSummary ? permSummary["Permission"] : null);
                                var _filterSelections = layoutManager.FilterSelections();
                                var _platformID = _filterSelections.GetFilterID("platform");
                                var _isFilterRoleID = enCETriState.None;

                                filterParams["DeepLoad"] = true;    //force deep load of individual list items
                                filterParams["PlatformID"] = _platformID;

                                if (!_isEditMode) {
                                    _isFilterRoleID = enCETriState.Yes;
                                }
                                else {
                                    _isFilterRoleID = enCETriState.None;
                                }

                                filterParams["IsFilterRoleID"] = _isFilterRoleID;

                                if (_controller && _controller["Utils"] && _controller.Utils["ContextEditorGroupID"]) {
                                    filterParams["_EditorGroupID"] = _controller.Utils.ContextEditorGroupID($element);
                                }
                                else {
                                    util_logError("PluginEditorResourceSelection :: list filter missing required parameter - _EditorGroupID");
                                }

                                if (_controller && _controller["ProjectOnGetCategoryList"]) {
                                    var _isEditMode = $element.closest(".Content, .ViewModeEdit").is(".ViewModeEdit");

                                    _controller.ProjectOnGetCategoryList({
                                        "IsEditMode": _isEditMode, "FilterSelections": _filterSelections, "Params": filterParams, "Callback": dataCallback,
                                        "Permission": _permission
                                    });
                                }
                                else {
                                    APP.Service.Action({ "c": "PluginEditor", "m": "EditorResourceCategoryGetByForeignKey", "args": filterParams },
                                                       dataCallback);
                                }
                            }
                        });

                    }
                }); //end: component user permission summary

            };  //end: _fnGetList

            var _viewCategoryID = enCE.None;

            if (!$vwSelection.data("init-render-args")) {
                $vwSelection.data("init-render-args", true);

                var _renderArguments = null;
                var $parent = $element.closest(".CEditorComponentHome");

                _renderArguments = $parent.data("RenderArguments");

                $parent.removeData("RenderArguments");

                if (_renderArguments) {
                    var _prop = enColEditorResourceCategoryProperty.CategoryID;

                    _viewCategoryID = util_forceInt(_renderArguments[_prop], _viewCategoryID);
                }
            }

            $vwDetails.children(".EditorResourceCategoryDetail")
                      .toggleClass("EditorElementHidden", args.IsUpdate);

            $vwSelection.toggleClass("EffectBlur", (_viewCategoryID != enCE.None));

            //retrieve and render the list (if it is currently in refresh mode, do nothing as the toggle edit mode of this view will handle it)
            _fnGetList(null, function (dataItem) {

                var _onCallback = function () {

                    if (args.Callback) {
                        args.Callback();
                    }

                };  //end: _onCallback

                if (!_isRefresh) {
                    var _html = "";
                    var _categories = (dataItem ? dataItem.List : null);
                    var _lookupCategory = {};

                    _categories = (_categories || []);

                    if (_categories.length == 0) {
                        _html += "<div class='EditorNoRecordsLabel'>" + util_htmlEncode(MSG_CONFIG.ListNoRecords) + "</div>";
                    }
                    else {
                        for (var i = 0; i < _categories.length; i++) {
                            var _category = _categories[i];
                            var _categoryID = _category[enColEditorResourceCategoryProperty.CategoryID];

                            var _name = _category[enColEditorResourceCategoryProperty.Name];
                            var _attr = util_htmlAttribute("data-attr-editor-resource-category-id", _categoryID);

                            _html += "<div class='DisableUserSelectable PluginEditorCardView EditorEntityItem EditorResourceCategoryDetail LinkClickable" +
                                     (args.IsEditToggle ? " EditorElementHidden" : "") + "' " +
                                     util_htmlAttribute("title", _name, null, true) + " " + _attr + ">" +
                                     "  <div class='Label'>" + util_htmlEncode(_name) + "</div>" +
                                     "</div>";

                            _lookupCategory[_categoryID] = _category;
                        }
                    }

                    $vwDetails.data("data-list", _categories)
                              .data("lookup-category", _lookupCategory);

                    $vwDetails.html(_html);
                    $mobileUtil.refresh($vwDetails);

                    if (!$vwDetails.data("is-init")) {
                        $vwDetails.data("is-init", true);

                        _controller.Utils.Sortable({
                            "Controller": _controller,
                            "Containers": $vwDetails, "SelectorDraggable": ".EditorResourceCategoryDetail",
                            "DropOptions": {
                                "DataAttributeIdentifier": "data-attr-editor-resource-category-id",
                                "PropertyDisplayOrder": enColEditorResourceCategoryProperty.DisplayOrder,
                                "PropertyEntityIdentifier": enColEditorResourceCategoryProperty.CategoryID,
                                "GetUpdateDataList": function (saveItem) {

                                    var _updateList = saveItem[enColCEEditorResourceCategoryProperty.ReferencedResourceCategorys];

                                    saveItem[enColCEEditorResourceCategoryProperty.ReferencedResourceCategorys] = null; //remove the list from data item

                                    return _updateList;
                                },
                                "GetDataItem": function (id, ctx, callCache) {
                                    var $ctx = $(ctx);
                                    var _retDataItem = $ctx.data("DataItem");

                                    if (!_retDataItem) {

                                        //retrieve it from the source data item
                                        id = util_forceInt(id, enCE.None);

                                        _retDataItem = util_arrFilter($vwDetails.data("data-list"), enColEditorResourceCategoryProperty.CategoryID, id, true);
                                        _retDataItem = (_retDataItem.length == 1 ? _retDataItem[0] : null);

                                        if (_retDataItem) {
                                            $ctx.data("DataItem", _retDataItem);
                                        }
                                    }

                                    return _retDataItem;
                                }
                            },

                            "OnDrop": function (dropOptions) {

                                var _currentItem = null;

                                dropOptions.OnSaveSuccess = function (saveItem, updateOpts) {
                                    _currentItem[enColCEEditorResourceCategoryProperty.ReferencedResourceCategorys] = null;
                                };

                                var _refList = [];
                                var _searchCategoryID = util_forceInt($(dropOptions.Element).attr("data-attr-editor-resource-category-id"), enCE.None);

                                for (var i = 0; i < dropOptions.SaveList.length; i++) {
                                    var _resourceCategory = dropOptions.SaveList[i];

                                    if (_resourceCategory[enColEditorResourceCategoryProperty.CategoryID] == _searchCategoryID) {
                                        _currentItem = _resourceCategory;
                                    }
                                    else {
                                        _refList.push(_resourceCategory);
                                    }
                                }

                                _currentItem[enColCEEditorResourceCategoryProperty.ReferencedResourceCategorys] = _refList;

                                dropOptions.IsAppService = true;
                                dropOptions.SaveParams = {
                                    "c": "PluginEditor", "m": "EditorResourceCategorySave",
                                    "args": {
                                        "_EditorGroupID": _controller.Utils.ContextEditorGroupID($element),
                                        "Item": util_stringify(_currentItem), "DeepSave": false, "IsSaveReferenceList": true
                                    }
                                };
                            }
                        });
                    }

                }

                if (_isRefresh) {

                    var _isEditMode = $element.closest(".Content, .ViewModeEdit").is(".ViewModeEdit");

                    _controller.ToggleEditMode({
                        "IsEdit": _isEditMode, "Controller": _controller, "PluginInstance": _pluginInstance, "LayoutManager": options.LayoutManager,
                        "Callback": _onCallback
                    });
                }
                else if (_viewCategoryID != enCE.None) {

                    var $category = $element.find(".EditorResourceCategoryDetail[" + util_htmlAttribute("data-attr-editor-resource-category-id", _viewCategoryID) + "]");

                    if ($category.length == 1) {

                        _onCallback();

                        $category.trigger("click.view_category", {
                            "Callback": function () {
                                $vwSelection.removeClass("EffectBlur");
                            }
                        });

                    }
                    else {
                        $vwSelection.removeClass("EffectBlur");
                        _onCallback();
                    }
                }
                else {
                    _onCallback();
                }

            });

        }); //end: selection events.bind

        $vwFileListView.off("events.bind");
        $vwFileListView.on("events.bind", function (e, args) {

            args = util_extend({ "Item": null, "IsCached": false, "CategoryID": enCE.None, "Callback": null, "Options": null }, args);

            var options = (args.Options || {}); //must use the options provided in bind event arguments (not the global version during declaration); redeclared

            var _bindCallback = function () {

                if (options && options["IsRefresh"]) {

                    var _isEditMode = $element.closest(".Content, .ViewModeEdit").is(".ViewModeEdit");

                    _controller.ToggleEditMode({
                        "IsEdit": _isEditMode, "Controller": _controller, "PluginInstance": _pluginInstance, "LayoutManager": options.LayoutManager,
                        "Callback": args.Callback
                    });
                }
                else if (args.Callback) {
                    args.Callback();
                }

            };

            if (!$vwFileListView.data("is-init-drag-events")) {
                $vwFileListView.data("is-init-drag-events", true);

                var $vwDraggable = $vwFileListView.children(".EditorDraggableContainer");

                _controller.Utils.Sortable({
                    "Controller": _controller,
                    "Containers": $vwDraggable, "SelectorDraggable": ".EditorResourceLineItem",
                    "OnValidateDragRequest": function (opts) {
                        return ($(opts.TargetElement).hasClass("PermissionNoAccessItem") == false);
                    },
                    "DropOptions": {
                        "DataAttributeIdentifier": "data-attr-editor-resource-id", "PropertyDisplayOrder": enColEditorResourceCategoryFileProperty.DisplayOrder,
                        "PropertyEntityIdentifier": enColEditorResourceCategoryFileProperty.ResourceID,                        
                        "GetUpdateDataList": function (saveItem) {
                            var _updateList = saveItem[enColCEEditorResourceCategoryFileProperty.ReferencedResourceCategoryFiles];

                            saveItem[enColCEEditorResourceCategoryFileProperty.ReferencedResourceCategoryFiles] = null; //remove the list from data item

                            return _updateList;
                        },
                        "GetDataItem": function (id, ctx, callCache) {
                            var $ctx = $(ctx);
                            var _retDataItem = $ctx.data("DataItem");

                            if (!_retDataItem) {

                                //retrieve it from the source data item
                                id = util_forceInt(id, enCE.None);

                                var _resourceCategory = $ctx.closest(".PluginEditorResourceCategoryDetails").data("Item");

                                _resourceCategory = (_resourceCategory || {});

                                _retDataItem = util_arrFilter(_resourceCategory[enColCEEditorResourceCategoryProperty.EditorResourceCategoryFiles],
                                                              enColEditorResourceCategoryFileProperty.ResourceID, id, true);
                                _retDataItem = (_retDataItem.length == 1 ? _retDataItem[0] : null);

                                if (_retDataItem) {
                                    $ctx.data("DataItem", _retDataItem);
                                }
                            }

                            return _retDataItem;
                        }
                    },

                    "OnDrop": function (dropOptions) {
                        
                        var _currentItem = null;

                        dropOptions.OnSaveSuccess = function (saveItem, updateOpts) {

                            _currentItem[enColCEEditorResourceCategoryFileProperty.ReferencedResourceCategoryFiles] = null;
                        };

                        var _refList = [];
                        var _searchResourceID = util_forceInt($(dropOptions.Element).attr("data-attr-editor-resource-id"), enCE.None);

                        for (var i = 0; i < dropOptions.SaveList.length; i++) {
                            var _resourceCategoryFile = dropOptions.SaveList[i];

                            if (_resourceCategoryFile[enColEditorResourceCategoryFileProperty.ResourceID] == _searchResourceID) {
                                _currentItem = _resourceCategoryFile;
                            }
                            else {
                                _refList.push(_resourceCategoryFile);
                            }
                        }

                        _currentItem[enColCEEditorResourceCategoryFileProperty.ReferencedResourceCategoryFiles] = _refList;

                        dropOptions.IsAppService = true;
                        dropOptions.SaveParams = {
                            "c": "PluginEditor", "m": "EditorResourceCategoryFileSave",
                            "args": {
                                "_EditorGroupID": _controller.Utils.ContextEditorGroupID($element),
                                "Item": util_stringify(_currentItem), "DeepSave": false, "IsSaveReferenceList": true
                            }
                        };
                    }
                });
            }

            var _category = args.Item;
            var _categoryID = enCE.None;
            var _lookupPlatformAccess = ($vwFileListView.data("LookupPlatformAccess") || {});

            if (!_category || util_forceInt(_category[enColEditorResourceCategoryProperty.CategoryID], enCE.None) == enCE.None) {
                _categoryID = args.CategoryID;
                _category = {};
            }
            else {
                _categoryID = _category[enColEditorResourceCategoryProperty.CategoryID];
            }

            if (util_forceInt(_categoryID, enCE.None) == enCE.None) {

                //if the category ID is not specified, then retrieve it from element data values
                _categoryID = util_forceInt($vwFileListView.data("EditID"), enCE.None);
                _category = ($vwFileListView.data("Item") || {});
            }

            var $title = $vwFileListView.children(".Title");
            var $vwList = $vwFileListView.children(".EditorResourceListView");

            var _fnSetTitle = function () {

                $title.find(".Label")
                      .text(util_forceString(_category[enColEditorResourceCategoryProperty.Name]));

                $title.find(".Description")
                      .html(util_htmlEncode(_category[enColEditorResourceCategoryProperty.Description], true));

            };  //end: _fnSetTitle
            
            //set current category ID and data item as the context
            $vwFileListView.data("EditID", _categoryID)
                           .data("Item", _category);

            if (!$vwFileListView.data("is-init")) {
                $vwFileListView.data("is-init", true);

                var _arrSortOptions = [
                    { "n": "Relevance", "col": enColEditorResourceCategoryFile.DisplayOrder, "asc": true },
                    { "n": "Date Added (ASC)", "col": enColEditorResourceCategoryFile.DateAdded, "asc": true },
                    { "n": "Date Added (DESC)", "col": enColEditorResourceCategoryFile.DateAdded, "asc": false },
                    { "n": "Title (ASC)", "col": enColEditorResourceCategoryFile.ResourceIDName, "asc": true },
                    { "n": "Title (DESC)", "col": enColEditorResourceCategoryFile.ResourceIDName, "asc": false }
                ];

                for (var i = 0; i < _arrSortOptions.length; i++) {
                    var _sort = _arrSortOptions[i];

                    _sort["v"] = (i + 1);
                }

                _controller.Utils.FloatingDropdown({
                    "Element": $vwFileListView.find("#ddlResourceSort"),
                    "Data": _arrSortOptions,
                    "SelectedValue": (_arrSortOptions.length > 0 ? _arrSortOptions[0].v : null),
                    "OnItemHTML": function (item) {
                        var _itemHTML = "";

                        if (item) {
                            _itemHTML += "<div " + util_htmlAttribute("data-option-value", item["v"]) + ">" + util_htmlEncode(item["n"]) + "</div>";
                        }

                        return _itemHTML;
                    },
                    "Events": {
                        "OnChange": function (e, args) {

                            args = util_extend({ "IsRefresh": true, "Callback": null }, args);

                            args.IsRefresh = util_forceBool(args.IsRefresh, true);

                            _controller.Bind({ "IsRefresh": args.IsRefresh, "LayoutManager": options.LayoutManager }, args.Callback);
                        }
                    }
                });

                $vwList.off("events.onThumbnailLoad");
                $vwList.on("events.onThumbnailLoad", ".Thumbnail > .Image > img", function () {
                    var $img = $(this);

                    $img.closest(".Image").removeClass("Loading EffectBlur");

                    var _top = 192 - $img.height();

                    _top = (_top / 2.0);

                    _top = Math.max(_top, 0);

                    $img.css({ "top": _top + "px" });
                });

                var $ddlResourceSort = $vwFileListView.find("#ddlResourceSort");

                $vwList.off("events.getFilterOptions");
                $vwList.on("events.getFilterOptions", function (e, args) {

                    if (!args) {
                        args = {};
                    }

                    var _index = util_forceInt($ddlResourceSort.val(), -1) - 1;
                    var _sort = (_index >= 0 && _index < _arrSortOptions.length ? _arrSortOptions[_index] : null);

                    args["FileSortColumn"] = (_sort ? _sort.col : enCE.None);
                    args["FileSortASC"] = (_sort ? _sort.asc : false);
                    args["SortDisplayName"] = (_sort ? _sort.n : null);

                }); //end: events.getFilterOptions
            }

            if (args.IsCached) {
                _fnSetTitle();
                _bindCallback();
            }
            else {

                var _arrDetailPropRender = [
                    { "n": "Description:", "p": enColEditorResourceProperty.Description, "encodeNewline": true }
                ];

                _controller.ResourceRenderOptions({
                    "Type": "ResourceDetails", "RenderProperties": _arrDetailPropRender
                });

                _arrDetailPropRender.push({
                    "n": "Last Modified:", "p": enColEditorResourceProperty.DateModified, "isFormatDateTime": true
                });

                var _fnGetResourceFileHTML = function (renderOpts) {

                    var _lineItemHTML = "";
                    var ACCESS_DENIED_PLACEHOLDER_NAME = "Market Access Tool / Resource";
                    var ACCESS_DENIED_PLACEHOLDER_MESSAGE_HTML = "<div>" +
                                                                 util_htmlEncode("You are not authorized to access the Market Access Tool / Resource.") +
                                                                 "</div>";

                    var _hasAccess = true;
                    var _isEdit = (renderOpts["IsEditMode"] === true);
                    var _editorResource = renderOpts["EditorResource"];

                    if (_isEdit) {

                        //for edit mode, need to verify user access to the resource (based on associated platforms)
                        var _resourcePlatforms = (_editorResource[enColCEEditorResourceProperty.ResourcePlatforms] || []);

                        _hasAccess = false;

                        for (var rp = 0; rp < _resourcePlatforms.length; rp++) {
                            var _resourcePlatform = _resourcePlatforms[rp];
                            var _platformID = _resourcePlatform[enColEditorResourcePlatformProperty.PlatformID];

                            if (_lookupPlatformAccess[_platformID]) {
                                _hasAccess = true;
                                break;
                            }
                        }
                    }

                    var _file = (_hasAccess ? renderOpts["File"] : null);
                    var _thumbnailFile = (_hasAccess ? renderOpts["ThumbnailFile"] : null);

                    var _openLinkDetail = {
                        "URL": null,
                        "Label": null,
                        "Title": "",
                        "IsLinkClickable": false,
                        "DownloadAction": {
                            "IsEnabled": false,
                            "URL": "javascript: void(0);",
                            "Tooltip": "Download"
                        },
                        "Attributes": {
                            "data-inline": "false",
                            "data-icon": "arrow-r",
                            "data-iconpos": "right",
                            "title": ""
                        }
                    };

                    var _thumbnailURL = null;
                    var _isPlaceholder = false;

                    if (_thumbnailFile) {
                        _thumbnailURL = _controller.Utils.ConstructDownloadURL({ "TypeID": "editor", "Item": _thumbnailFile });
                    }

                    if (!_thumbnailURL) {
                        _isPlaceholder = true;
                        _thumbnailURL = "<SITE_URL><IMAGE_GLOBAL_PATH>plugins/editor/backgrounds/bg_image_placeholder.svg";
                    }

                    var _handled = false;

                    if (_controller.Data.IsEditorToolResourceModeRepositoryResource) {

                        //check if a custom repository resource exists
                        var _repositoryResourceID = util_forceInt(_editorResource[enColEditorResourceProperty.RepositoryResourceID], enCE.None);

                        if (_repositoryResourceID != enCE.None) {
                            _handled = true;

                            _openLinkDetail.Label = "View";
                            _openLinkDetail.IsLinkClickable = true;
                            _openLinkDetail.Attributes["data-attr-view-repository-resource-id"] = _repositoryResourceID;

                            //check if the repository resource has an actual file associated (otherwise the download action is not supported)
                            if (util_forceInt(_editorResource[enColEditorResourceProperty.RepositoryResourceFileID], enCE.None) != enCE.None) {

                                _openLinkDetail.DownloadAction.IsEnabled = true;
                                _openLinkDetail.DownloadAction.URL = _controller.Utils.ConstructDownloadURL({
                                    "TypeID": "editor", "IsResourceMode": true, "Item": _editorResource,
                                    "Property": enColEditorResourceProperty.RepositoryResourceID
                                });

                                _openLinkDetail.DownloadAction.Tooltip = _editorResource[enColEditorResourceProperty.RepositoryResourceIDName];
                            }
                            else {
                                _openLinkDetail.DownloadAction.IsEnabled = false;
                            }
                        }
                    }

                    if (!_handled && _file) {
                        _openLinkDetail.URL = _controller.Utils.ConstructDownloadURL({ "TypeID": "editor", "Item": _file });

                        if (_file[enColFileProperty.IsExternal] == true) {
                            _openLinkDetail.Label = "Visit";
                            _openLinkDetail.Title = _file[enColFileProperty.ExternalLink];
                        }
                        else {
                            _openLinkDetail.Label = "Download";
                            _openLinkDetail.Title = _file[enColFileProperty.Name];
                        }

                        _openLinkDetail.Title = util_forceString(_openLinkDetail.Title);
                    }

                    _openLinkDetail.Attributes["title"] = util_jsEncode(_openLinkDetail.Title);

                    _lineItemHTML += "<div class='EditorEntityItem EditorResourceLineItem" +
                                     (!_hasAccess ? " DisableUserSelectable PermissionNoAccessItem" : "") + "' " +
                                     util_htmlAttribute("data-attr-editor-resource-id", _editorResource[enColEditorResourceProperty.ResourceID]) + ">" +
                                     "  <div class='EditorInlineOpenExtLink Thumbnail'>" +
                                     "      <div class='Image Loading EffectBlur'>" +
                                     "          <img onload=\"$(this).trigger('events.onThumbnailLoad');\" alt='' " +
                                     util_htmlAttribute("src", _thumbnailURL) + (_isPlaceholder ? " class='Placeholder'" : "") + " />" +
                                     (_openLinkDetail.DownloadAction.IsEnabled ?
                                     "<a class='LinkClickable ActionButtonDownload HiddenDragElement' data-role='none' data-rel='external' target='_blank' " +
                                     util_htmlAttribute("href", _openLinkDetail.DownloadAction.URL) + " " +
                                     (
                                        _controller.Data.IsEditorToolResourceModeRepositoryResource ?
                                        util_renderAttribute("callout") + " " + util_htmlAttribute("data-callout-disable-is-touch", enCETriState.Yes) + " " +
                                        util_htmlAttribute("data-callout-options-side", "right") :
                                        util_htmlAttribute("title", _openLinkDetail.DownloadAction.Tooltip, null, true)
                                     )
                                     + ">" +
                                     "  <div class='EditorImageButton ImageDownloadFile'>" +
                                      "     <div class='ImageIcon' />" + 
                                      " </div>" +
                                      "</a>" :
                                      ""
                                     ) +
                                     "      </div>" +
                                     (_openLinkDetail.URL || _openLinkDetail.IsLinkClickable ?
                                      _controller.Utils.HTML.GetButton({
                                          "CssClass": "ModeToggleView ModeDisplayBlock HiddenDragElement",
                                          "Content": _openLinkDetail.Label, "LinkURL": (_openLinkDetail.IsLinkClickable ? null : _openLinkDetail.URL),
                                          "Attributes": _openLinkDetail.Attributes
                                      }) :
                                     "&nbsp;") +
                                     "  </div>" +
                                     "  <div class='Detail'>" +
                                     "      <div class='Title'>" + 
                                     util_htmlEncode(_hasAccess ? _editorResource[enColEditorResourceProperty.Name] : ACCESS_DENIED_PLACEHOLDER_NAME) +
                                     "      </div>";

                    //render the detail properties
                    if (_hasAccess) {
                        for (var j = 0; j < _arrDetailPropRender.length; j++) {
                            var _detailProp = _arrDetailPropRender[j];
                            var _name = _detailProp["n"];
                            var _val = _editorResource[_detailProp.p];

                            if (_detailProp["isFormatDateTime"] === true) {
                                _val = util_FormatDateTime(_val, "", null, true, { "IsValidateConversion": true });
                            }

                            _val = util_forceString(_val);

                            if (_val == "") {
                                _val = "Not Available";
                            }

                            _lineItemHTML += "<div class='Label'>" + util_htmlEncode(_name) + "</div>" +
                                             "<div class='Description'>" + util_htmlEncode(_val, _detailProp["encodeNewline"] === true) + "</div>";
                        }
                    }
                    else {
                        _lineItemHTML += ACCESS_DENIED_PLACEHOLDER_MESSAGE_HTML;
                    }

                    _lineItemHTML += "  </div>" +
                                     "  <div class='Divider' />" +
                                     "</div>";

                    return _lineItemHTML;

                };  //end: _fnGetResourceFileHTML

                var _fnBindListView = function (isEdit, $container, resourceFileList, lookups, index, onCallback) {

                    var _isInit = (index == 0);
                    var _fnInitView = function () {

                        if (_isInit) {
                            var $disabledList = $container.children(".EditorResourceLineItemDisabled");

                            $disabledList.slideUp(_controller.AnimationDuration).promise().done(function () {
                                $disabledList.remove();
                            });
                        }

                    };  //end: _fnInitView

                    if (!lookups) {
                        lookups = {
                            "GetEntry": function (name, key) {
                                var _lookup = this[name];

                                return (_lookup ? _lookup[key] : null);
                            }
                        };

                        var _fnAddLookup = function (list, name, propKey) {
                            list = (list || []);

                            var _lookupItem = {};

                            for (var i = 0; i < list.length; i++) {
                                var _temp = list[i];
                                var _key = _temp[propKey];

                                _lookupItem[_key] = _temp;
                            }

                            lookups[name] = _lookupItem;
                        };

                        _fnAddLookup(_category[enColCEEditorResourceCategoryProperty.EditorResources], "Resources", enColEditorResourceProperty.ResourceID);
                        _fnAddLookup(_category[enColCEEditorResourceCategoryProperty.FileList], "Files", enColFileProperty.FileID);
                    }

                    if (index >= resourceFileList.length) {
                        if (onCallback) {
                            onCallback();
                        }

                        _fnInitView();
                        $mobileUtil.refresh($container);
                    }
                    else {
                        var _step = 5;
                        var _listHTML = "";

                        for (var i = 0; i < _step && (index < resourceFileList.length) ; i++) {

                            var _editorResourceFile = resourceFileList[index];
                            var _editorResource = lookups.GetEntry("Resources", _editorResourceFile[enColEditorResourceCategoryFileProperty.ResourceID]);
                            var _file = null;
                            var _thumbnailFile = null;

                            if (_editorResource) {

                                //TODO FILE
                                if (util_forceInt(_editorResource[enColEditorResourceProperty.FileID], enCE.None) != enCE.None) {
                                    _file = lookups.GetEntry("Files", _editorResource[enColEditorResourceProperty.FileID]);
                                }

                                if (util_forceInt(_editorResource[enColEditorResourceProperty.ThumbnailFileID], enCE.None) != enCE.None) {
                                    _thumbnailFile = lookups.GetEntry("Files", _editorResource[enColEditorResourceProperty.ThumbnailFileID]);
                                }
                            }

                            _listHTML += _fnGetResourceFileHTML({
                                "IsEditMode": isEdit,
                                "Item": _editorResourceFile,
                                "EditorResource": _editorResource,
                                "File": _file,
                                "ThumbnailFile": _thumbnailFile
                            });

                            index++;
                        }

                        if (_isInit && $container.children(".EditorResourceLineItemDisabled:first").length == 0) {
                            var $temp = $(_listHTML);

                            $temp.hide();
                            $container.append($temp).trigger("create");

                            if (util_forceInt(_controller.AnimationDuration, -1) == 0) {
                                $temp.show();
                            }
                            else {
                                $temp.toggle("height");
                            }
                        }
                        else {
                            $container.append(_listHTML)
                                      .trigger("create");
                        }
                        
                        _fnInitView();

                        setTimeout(function () {
                            _fnBindListView(isEdit, $container, resourceFileList, lookups, index, onCallback);
                        }, 250);
                    }
                };

                var _filters = {};
                var _loadOption = new CEditorResourceCategoryLoadOption();

                $vwList.trigger("events.getFilterOptions", _filters);

                if (util_forceInt(_filters["FileSortColumn"], enCE.None) != enCE.None) {
                    _loadOption[enColCEditorResourceCategoryLoadOptionProperty.SortResourceCategoryFile] = _filters["FileSortColumn"];
                    _loadOption[enColCEditorResourceCategoryLoadOptionProperty.SortResourceCategoryFileASC] = util_forceBool(_filters["FileSortASC"], true);
                }

                var $vwResourcesView = $vwFileListView.find(".EditorResourceListView");

                $vwResourcesView.children(".EditorResourceLineItem")
                                .addClass("DisableUserSelectable EditorResourceLineItemDisabled EffectBlur");

                $element.trigger("events.getComponentUserPermission", {
                    "Callback": function (permSummary) {

                        $element.trigger("events.getLayoutManager", {
                            "Callback": function (layoutManager) {

                                var _filterSelections = layoutManager.FilterSelections();
                                var _isEditMode = $element.closest(".Content, .ViewModeEdit").is(".ViewModeEdit");
                                var _permission = (permSummary ? permSummary["Permission"] : null);
                                var _isFilterRoleID = enCETriState.None;

                                //filter by the selected platform (only if user is not editing the category)
                                _loadOption[enColCEditorResourceCategoryLoadOptionProperty.FilterPlatformID] = (_isEditMode ? enCE.None :
                                                                                                                              _filterSelections.GetFilterID("platform"));

                                if (!_isEditMode) {
                                    _isFilterRoleID = enCETriState.Yes;
                                }
                                else {
                                    _isFilterRoleID = enCETriState.None;
                                }

                                _loadOption[enColCEditorResourceCategoryLoadOptionProperty.IsFilterRoleID] = _isFilterRoleID;

                                _controller.ProjectOnGetCategoryItem({
                                    "Permission": _permission,
                                    "IsEditMode": _isEditMode,
                                    "Params": {
                                        "_EditorGroupID": _controller.Utils.ContextEditorGroupID($vwFileListView),
                                        "CategoryID": _categoryID,
                                        "DeepLoad": true,
                                        "LoadOption": _loadOption
                                    },
                                    "FilterSelections": _filterSelections,
                                    "Callback": function (dataItem) {

                                        _category = (dataItem || {});

                                        //update the data item for the element
                                        $vwFileListView.data("Item", _category);

                                        _fnSetTitle();

                                        _controller.Utils.Events.UserAccess({
                                            "Trigger": $vwFileListView,
                                            "IsLoadComponentFilters": true,
                                            "Callback": function (userAccessResult) {

                                                _lookupPlatformAccess = (userAccessResult ? userAccessResult["LookupPlatformAccess"] : null);
                                                _lookupPlatformAccess = (_lookupPlatformAccess || {});

                                                $vwFileListView.data("LookupPlatformAccess", _lookupPlatformAccess);

                                                $vwResourcesView.removeClass("ModeNoRecords");

                                                _fnBindListView(_isEditMode, $vwResourcesView,
                                                                (_category[enColCEEditorResourceCategoryProperty.EditorResourceCategoryFiles] || []),
                                                                null, 0, function () {

                                                                    var $search = $vwResourcesView.find(".EditorResourceLineItem:not(.EditorResourceLineItemDisabled)" +
                                                                                                        "[data-attr-editor-resource-id]:first");
                                                                    var _hasItems = ($search.length > 0);

                                                                    $vwResourcesView.toggleClass("ModeNoRecords", !_hasItems);
                                                                    _bindCallback();
                                                                });
                                            }
                                        });

                                    }
                                });

                            }

                        }); //end: call getLayoutManager

                    }
                });
            }

        }); //end: list view events.bind

        $vwFileListView.off("events.refreshOnPopupDismiss");
        $vwFileListView.on("events.refreshOnPopupDismiss", function (e, args) {

            args = util_extend({ "Callback": null }, args);

            var $imgList = $vwFileListView.find(".EditorResourceLineItem .Image > img");

            $imgList.trigger("events.onThumbnailLoad");
            $vwFileListView.removeClass("EditorResourceTransitionDismiss");

            if (args.Callback) {
                args.Callback();
            }
        });

        $vwFileListView.off("click.resource_onViewLineItemRepositoryResource");
        $vwFileListView.on("click.resource_onViewLineItemRepositoryResource", ".LinkClickable[data-attr-view-repository-resource-id]:not(.LinkDisabled)", function () {

            //details view for the resource is read only (as user can only modify the repostiory resource in edit mode for the module)
            _controller.OnViewRepositoryResourceDetails({ "Trigger": $(this), "IsReadOnly": true });

        }); //end: click.resource_onViewLineItemRepositoryResource

        $vwSelection.off("click.view_category");
        $vwSelection.on("click.view_category",
                        ".EditorResourceCategoryDetail.LinkClickable:not(.LinkDisabled)[data-attr-editor-resource-category-id]",
                        function (e, args) {

                            args = util_extend({ "Callback": null }, args);

                            var $this = $(this);
                            var _categoryID = util_forceInt($this.attr("data-attr-editor-resource-category-id"), enCE.None);

                            $this.trigger("events.resource_viewCategory", { "CategoryID": _categoryID, "Callback": args.Callback });

                        }); //end: click.view_category

        $vwSelection.off("events.resource_viewCategory");
        $vwSelection.on("events.resource_viewCategory", function (e, args) {

            if (!$vwSelection.data("is-busy")) {

                args = util_extend({ "CategoryID": enCE.None, "Callback": null }, args);

                var _categoryID = util_forceInt(args.CategoryID, enCE.None);

                $vwSelection.data("is-busy", true);

                var _categoryLookup = ($vwDetails.data("lookup-category") || {});
                var _category = _categoryLookup[_categoryID];

                $vwSelection.removeClass("ActiveView");
                $vwFileListView.addClass("ActiveView");

                $vwFileListView.trigger("events.bind", { "Item": _category, "IsCached": true, "Callback": args.Callback });

                $vwSelection.addClass("EffectBlur")
                    .slideUp(_controller.AnimationDuration, function () {
                        $vwSelection.removeClass("EffectBlur");
                        $vwSelection.data("is-busy", false);
                    });

                $vwFileListView.hide().slideDown(_controller.AnimationDuration, function () {
                    $vwFileListView.trigger("events.bind", { "CategoryID": _categoryID, "IsCached": false });
                });
            }

        }); //end: events.resource_viewCategory
        
        var _arrFilters = [{ "Type": "platform" }];

        _controller.ProjectOnGetFilters({
            "Callback": function (arr) {
                arr = (arr || []);

                _arrFilters = $.merge(_arrFilters, arr);

                options.LayoutManager.FilterSetView({
                    "List": _arrFilters, "Callback": function () {
                        _fnBindView();
                    }
                });
            }
        });        
    }
    else {
        _fnBindView();
    }
};

CEditorResourceController.prototype.CanAdminView = function (options) {

    var _ret = false;
    var _controller = this;

    options = util_extend({ "PlatformID": null }, options);

    var _platformID = util_forceInt(options.PlatformID, enCE.None);

    var _search = util_arrFilterSubset(_controller.State.PlatformComponentPermissions, function (search) {
        return (search["CanAdmin"] === true && (_platformID == enCE.None || search["PlatformID"] == _platformID));
    }, true);

    _ret = (_search.length == 1);

    return _ret;
};

CEditorResourceController.prototype.OnViewRepositoryResourceDetails = function (options) {

    options = util_extend({ "Trigger": null, "IsReadOnly": false, "OnEditSaveCallback": null }, options);

    var _controller = this;
    var _repositoryResourceController = _controller.Data.RepositoryResourceController;

    var $trigger = $(options.Trigger);
    var _repositoryResourceID = util_forceInt($mobileUtil.GetClosestAttributeValue($trigger, "data-attr-view-repository-resource-id"), enCE.None);

    if (_repositoryResourceID != enCE.None) {

        $trigger.addClass("LinkDisabled");

        var _canAdmin = _controller.CanAdminView();

        _repositoryResourceController.PopupEditResource({
            "EditID": _repositoryResourceID,
            "IsViewMode": true,
            "CanAdminComponentKOL": function () {
                var _ret = _canAdmin;

                if (!_ret) {

                    //user has User access for the Market Access Tools and Resources component, as such use the KOL Manager permission for whether has full Administrator access
                    var _permission = _controller.State.KOL_PlatformComponentPermission;

                    _permission = (_permission || {});

                    _ret = util_forceBool(_permission["CanAdmin"], false);
                }

                return _ret;
            },
            "ToggleEditButton": (!options.IsReadOnly && _canAdmin),

            "IsHideScrollbar": true,
            "OnEditSaveCallback": function (opts) {
                if (options.OnEditSaveCallback) {
                    options.OnEditSaveCallback.call(this, opts);
                }
            },
            "Callback": function () {
                $trigger.removeClass("LinkDisabled");
            }
        });
    }
};

CEditorResourceController.prototype.ToggleEditMode = function (options) {
    options = util_extend({
        "Controller": null, "PluginInstance": null, "IsEdit": false, "Callback": null, "LayoutManager": null, "FilteredList": null, "Trigger": null
    }, options);

    var _handled = false;
    var _controller = options.Controller;
    var _pluginInstance = (options.PluginInstance ? options.PluginInstance : _controller.PluginInstance);
    var $container = $(_controller.DOM.Element);

    var _toolsHTML = null;
    var _dragHandleHTML = null;
    var _fnConfigureElementEditable = function (obj, btnOptions, fnEditInit, disableDrag) {
        var $obj = $(obj);

        if (!$obj.data("is-mode-init")) {
            $obj.data("is-mode-init", true);

            if (!_toolsHTML) {
                btnOptions = util_extend({ "EditActionID": null, "DeleteActionID": null, "CustomHTML": null, "IsDisplayBlock": false }, btnOptions);

                var _attrRequireLayout = util_htmlAttribute("data-attr-require-layout-manager", enCETriState.Yes);

                _toolsHTML = "<div class='EditorEntityItemActionButtons" + (btnOptions.IsDisplayBlock ? " EditorEntityItemActionBlock" : "") + " ModeToggleEdit '>" +
                             (btnOptions.CustomHTML ? btnOptions.CustomHTML : "") +
                             "  <a data-attr-editor-controller-action-btn='" + btnOptions.EditActionID + 
                             "' class='DisableDragElement LinkClickable' data-role='button' " +
                             "data-icon='edit' data-mini='true' data-inline='true' data-theme='transparent' " + _attrRequireLayout + ">" + 
                             util_htmlEncode("Edit") + "</a>" +
                             (btnOptions.DeleteActionID != null ?
                              "<a data-attr-editor-controller-action-btn='" + btnOptions.DeleteActionID + 
                              "' class='DisableDragElement LinkClickable' " + "data-role='button' " +
                              "data-icon='delete' data-mini='true' data-inline='true' data-theme='transparent' " + _attrRequireLayout + ">" + 
                              util_htmlEncode("Delete") + "</a>" :
                              ""
                             ) +
                             "</div>";
            }

            if (!disableDrag) {
                $obj.prepend(_dragHandleHTML);
            }

            if (fnEditInit) {
                fnEditInit();
            }

            $obj.trigger("create");
        }
    };

    var $vw = _controller.ActiveEmbeddedView();

    if (_controller.IsCurrentViewMode({ "ViewMode": "master" })) {

        //master selection view mode

        var _isUpdate = (options["IsEdit"] == true && !options["IsRefresh"]);
        options["IsRefresh"] = false;

        var $list = $vw.find(".EditorEntityItem.EditorResourceCategoryDetail");

        $list.addClass("EditorElementHidden");

        _handled = true;

        //force update of items (to ensure all categories are shown when in edit mode)
        $vw.trigger("events.bind", {
            "IsEditToggle": true,
            "IsUpdate": _isUpdate,
            "Options": options,
            "Callback": function () {

                $list = $vw.find(".EditorEntityItem.EditorResourceCategoryDetail");
                var $vwDraggable = $vw.children(".EditorDraggableContainer");

                $vwDraggable.toggleClass("EditorDraggableOn", options.IsEdit);
                $list.toggleClass("LinkDisabled", options.IsEdit);

                if (options.IsEdit) {
                    if (options.LayoutManager) {
                        options.LayoutManager.ToolbarSetButtons({
                            "IsInsertStart": true,
                            "List": _controller.Utils.HTML.GetButton({
                                "ActionButtonID": "add_category", "Content": "Add Category", "Attributes": { "data-icon": "plus" }
                            })
                        });
                    }

                    var _lookupCategory = ($vwDraggable.data("lookup-category") || {});
                    var _components = ($container.data("data-resource-component-list") || []);

                    _dragHandleHTML = "<div class='ModeToggleEdit IndicatorDraggable'>" +
                                     "   <img alt='' " + util_htmlAttribute("src", "<SITE_URL><IMAGE_SKIN_PATH>buttons/btn_drag.png") + " />" +
                                     "</div>";

                    var _customHTML = _controller.Utils.HTML.GetButton({
                        "ActionButtonID": "view_category", "Content": "View",
                        "Attributes": {
                            "data-icon": "arrow-r", "data-attr-require-layout-manager": enCETriState.Yes
                        }
                    });

                    $.each($list, function () {
                        var $this = $(this);

                        _fnConfigureElementEditable($this, { "EditActionID": "edit_category", "DeleteActionID": "delete_category", "CustomHTML": _customHTML },
                                                    function () {

                                                        var _categoryComponentHTML = "";

                                                        $this.prepend("<div class='ModeToggleEdit TopHeaderBar' />");
                                                        $this.append(_toolsHTML);

                                                        if (_components.length > 0) {

                                                            var _categoryID = util_forceInt($this.attr("data-attr-editor-resource-category-id"), enCE.None);
                                                            var _category = (_lookupCategory[_categoryID] || {});
                                                            var _categoryComponents = null;

                                                            _categoryComponents = (_category[enColCEEditorResourceCategoryProperty.EditorResourceCategoryComponents] ||
                                                                                   []);

                                                            var _filtered = util_arrFilterSubset(_components, function (search) {
                                                                return (util_arrFilter(_categoryComponents, enColEditorResourceCategoryComponentProperty.ComponentID,
                                                                                       search[enColComponentProperty.ComponentID], true).length == 1);
                                                            });

                                                            if (_filtered.length > 0) {
                                                                _categoryComponentHTML += "<div class='ModeToggleEdit ElementLinksDisabled BottomSummaryBar'>" +
                                                                                          _controller.Utils.HTML.GetButton({ "IsIconInformation": true }) +
                                                                                          "<span class='Label'>" + util_htmlEncode(" Include in: ") + "</span>";

                                                                for (var c = 0; c < _filtered.length; c++) {
                                                                    var _component = _filtered[c];

                                                                    _categoryComponentHTML += util_htmlEncode((c > 0 ? ", " : "") +
                                                                                                               _pluginInstance.Utils.ForceEntityDisplayName({
                                                                                                                   "Item": _component, "Type": "Component"
                                                                                                               }));
                                                                }

                                                                _categoryComponentHTML += "</div>";
                                                            }
                                                        }

                                                        $this.append(_categoryComponentHTML);
                                                    });
                    });
                }

                $list.removeClass("EditorElementHidden");
                
                if (options.Callback) {
                    options.Callback();
                }
            }
        });
    }
    else if (_controller.IsCurrentViewMode({ "ViewMode": "detail" })) {

        var _fn = function (onCallback) {

            var $list = $vw.find(".EditorEntityItem.EditorResourceLineItem");
            var $vwDraggable = $vw.children(".EditorDraggableContainer");

            $vwDraggable.toggleClass("EditorDraggableOn", options.IsEdit);

            //detail view mode
            if (options.IsEdit) {

                if (options.LayoutManager) {
                    options.LayoutManager.ToolbarSetButtons({
                        "IsInsertStart": true,
                        "List": _controller.Utils.HTML.GetButton({ "ActionButtonID": "add_resource", "Content": "Add Resource", "Attributes": { "data-icon": "plus" } })
                    });
                }

                $.each($list, function () {
                    var $this = $(this);

                    _fnConfigureElementEditable($this, { "EditActionID": "edit_resource", "DeleteActionID": "delete_categoryResourceFile" }, function () {

                        if (!$this.hasClass("PermissionNoAccessItem")) {
                            $this.append(_toolsHTML);
                        }

                        $this.find(".Detail > .Description")
                             .append("<div class='EffectBlur ViewOverflowFadeOut ModeToggleEdit' />");
                    });
                });
            }

            $list.toggleClass("DisableUserSelectable", options.IsEdit);

            if (onCallback) {
                onCallback();
            }

        };  //end:  _fn
        
        var OPTION_DISPLAY_ORDER = 1;
        var $ddlResourceSort = $vw.find("#ddlResourceSort");

        $ddlResourceSort.trigger("events.dropdown_toggleState", { "IsEnabled": !options.IsEdit });

        _handled = true;

        if (options.IsEdit) {
            var _current = util_forceInt($ddlResourceSort.val(), enCE.None);

            $ddlResourceSort.data("prev-selection", _current)
                            .trigger("change", { "Value": OPTION_DISPLAY_ORDER });
            
        }
        else {

            var _restoreVal = $ddlResourceSort.data("prev-selection");

            $ddlResourceSort.removeData("prev-selection");

            if (!util_isNullOrUndefined(_restoreVal)) {
                $ddlResourceSort.trigger("change", { "Value": _restoreVal });
            }
            else {
                _handled = false;
            }
        }

        if (_handled) {

            $ddlResourceSort.trigger("events.change", {
                "IsRefresh": false, //must ensure it is not treated as a refresh event to avoid toggle edit mode function being invoked
                "Callback": function () {
                    _fn(options.Callback);
                }
            });
        }
        else {
            _fn();
        }
    }
    
    if (!options.IsEdit) {
        if (options.LayoutManager) {
            options.LayoutManager.ToolbarSetButtons({
                "IsClear": true
            });
        }
    }

    if (!_handled && options.Callback) {
        options.Callback();
    }
};

CEditorResourceController.prototype.OnButtonClick = function (options) {

    options = util_extend({
        "Controller": null, "PluginInstance": null, "ButtonID": null, "Trigger": null, "Event": null, "Parent": null, "LayoutManager": null, "InvokeExtArgs": null
    }, options);

    var $btn = $(options.Trigger);
    var _controller = options.Controller;
    var _pluginInstance = _controller.PluginInstance;
    var $container = $(_controller.DOM.Element);

    var _html = "";

    if (options.ButtonID == "dismiss") {
        _controller.ActiveEmbeddedView().addClass("EditorResourceTransitionDismiss");

        options["OnDismissCallback"] = function () {
            _controller.ActiveEmbeddedView().trigger("events.refreshOnPopupDismiss", { "Controller": _controller });
        };
    }

    var _handled = _controller.Utils.ProcessButtonClick(options);

    if (!_handled) {

        var _popupState = {};

        $btn.trigger("events.popup_state", _popupState);

        var _isPopupMode = (_popupState["IsVisible"] == true);

        switch (options.ButtonID) {

            case "add_category":
            case "edit_category":
            case "add_resource":
            case "edit_resource":

                var m_editOpts = {
                    "Type": null,
                    "EditItemAttr": null,
                    "EntityDisplayName": "Item",
                    "SaveButtonID": null,
                    "DeleteButtonID": null,

                    "PropertyIdentifier": null,
                    "MethodNameLoadItem": null,
                    "MethodNameSaveItem": null,

                    "Platforms": [],
                    "PropertyBridgePlatformID": null,

                    "ClassificationPlatformRoles": [],

                    "LookupExtData": {},
                    "LookupListRendererEvent": {},

                    "IsLoadPlatformList": false,
                    "IsLoadRoleList": false,
                    "IsCategoryMode": function () {
                        return (this.Type == "category");
                    },
                    "IsResourceMode": function () {
                        return (this.Type == "resource");
                    },

                    "Init": function (onCallback) {
                        var _this = this;

                        var _onCallback = function () {
                            if (onCallback) {
                                onCallback(_this);
                            }
                        };

                        var _queue = new CEventQueue();

                        var _arrCustomEvents = null;

                        //CODE REF #ResourceFileDropdown
                        ////if (m_editOpts.IsCategoryMode()) {
                        ////    _queue.Add(function (loadCallback) {

                        ////        APP.Service.Action({
                        ////            "c": "PluginEditor", "m": "EditorResourceGetByForeignKey",
                        ////            "args": {
                        ////                "_EditorGroupID": _controller.Utils.ContextEditorGroupID($btn),
                        ////                "FilterPlatformID": _controller.Utils.ContextEditorGroupPlatformID($btn)
                        ////            }
                        ////        }, function (dataItem) {

                        ////            var _resources = (dataItem ? dataItem.List : null);

                        ////            _this.LookupExtData["ResourceList"] = (_resources || []);

                        ////            loadCallback();
                        ////        });
                        ////    });
                        ////}

                        if (m_editOpts.IsResourceMode()) {
                            _arrCustomEvents = _controller.AdminEditDataEvents({ "Lookup": _this.LookupExtData, "ViewMode": "resource" });
                        }

                        if(_arrCustomEvents) {
                            for(var i = 0; i < _arrCustomEvents.length; i++) {
                                _queue.Add(_arrCustomEvents[i]);
                            }
                        }

                        if (_this.IsLoadPlatformList) {

                            _queue.Add(function (loadCallback) {

                                _controller.GetPlatforms({
                                    "Callback": function (platforms) {

                                        _this.Platforms = (platforms || _this.Platforms);
                                        loadCallback();
                                    }
                                });

                            });
                            
                        }

                        if (_this.IsLoadRoleList) {

                            _queue.Add(function (loadCallback) {

                                _pluginInstance.GetData({
                                    "Type": "ClassificationPlatformRoleList", "From": "AdminRoleEdit",
                                    "Filters": {
                                        "ClassificationID": util_forceInt($mobileUtil.GetClosestAttributeValue($btn,
                                                                          "data-home-editor-group-classification-id"), enCE.None)
                                    }
                                }, function (result) {

                                    _this.ClassificationPlatformRoles = (result && result.Data ? result.Data.List : null);
                                    loadCallback();
                                });
                            });
                        }

                        _queue.Run({ "Callback": _onCallback });

                    }   //end: Init
                };

                if (options.ButtonID == "add_category" | options.ButtonID == "edit_category") {
                    m_editOpts.Type = "category";
                    m_editOpts.EditItemAttr = "data-attr-editor-resource-category-id";
                    m_editOpts.EntityDisplayName = "Category";
                    m_editOpts.SaveButtonID = "save_category";
                    m_editOpts.DeleteButtonID = "delete_category";

                    m_editOpts.PropertyIdentifier = enColEditorResourceCategoryProperty.CategoryID;
                    m_editOpts.MethodNameLoadItem = "EditorResourceCategoryGetByPrimaryKey";
                    m_editOpts.MethodNameSaveItem = "EditorResourceCategorySave";
                }
                else if (options.ButtonID == "add_resource" || options.ButtonID == "edit_resource") {
                    m_editOpts.Type = "resource";
                    m_editOpts.EditItemAttr = "data-attr-editor-resource-id";
                    m_editOpts.EntityDisplayName = "Market Access Tool / Resource";
                    m_editOpts.SaveButtonID = "save_resource";
                    m_editOpts.DeleteButtonID = "delete_resource";

                    m_editOpts.PropertyIdentifier = enColEditorResourceProperty.ResourceID;
                    m_editOpts.MethodNameLoadItem = "EditorResourceGetByPrimaryKey";
                    m_editOpts.MethodNameSaveItem = "EditorResourceSave";

                    m_editOpts.IsLoadPlatformList = true;
                    m_editOpts.PropertyBridgePlatformID = enColEditorResourcePlatformProperty.PlatformID;
                    m_editOpts.IsLoadRoleList = true;
                }

                var _itemID = enCE.None;
                var _isEdit = (options.ButtonID == "edit_category" || options.ButtonID == "edit_resource");

                if (_isEdit) {
                    _itemID = util_forceInt($mobileUtil.GetClosestAttributeValue($btn, m_editOpts.EditItemAttr), enCE.None);
                }

                _html += "<div class='EditorTransparentInlineConfirmation EditorAdminEditTable'>" +
                         "  <div style='text-align: right; padding-right: 1em; margin-bottom: 1em;'>" +
                         "      <span class='RequiredNote'>*</span>" + util_htmlEncode(" required field") +
                         "  </div>";

                var _attrInputElement = util_htmlAttribute("data-attr-input-element", enCETriState.Yes);
                var _components = ($container.data("data-resource-component-list") || []);
                var _arrProps = [];

                var _fnGetFileUploadHTML = function (opts) {

                    opts = util_extend({ "ElementID": null, "IsFilterImage": false }, opts);

                    var _arrFileUploadExt = null;
                    var _isExtLinkSupport = true;

                    if (opts.IsFilterImage) {
                        _arrFileUploadExt = _controller.FileUploadImageSupportedExt;
                        _isExtLinkSupport = false;
                    }
                    else {
                        _arrFileUploadExt = _controller.FileUploadSupportedExt;
                    }

                    var _fileUploadHTML = "";

                    _fileUploadHTML += "<div class='EditorEffectDisabledGrayscale PluginEditorCardView EditorInlineOpenExtLink'>" +
                                       (opts.IsFilterImage ? "<div class='EditorPreviewThumbnail' style='display: none;'>" +
                                                             "  <img alt='' />" +
                                                             "</div>"
                                                           : "") +
                                       "    <span class='Label'>" + util_htmlEncode("File not available") + "</span>" +
                                       "    <div class='EditToolButtons' style='display: none;'>" +
                                       _controller.Utils.HTML.GetButton({
                                           "Content": "Open", "LinkURL": "javascript: void(0);", "Attributes": {
                                               "data-icon": "arrow-r",
                                               "data-attr-file-edit-preview-link": enCETriState.Yes
                                           }
                                       }) +
                                       _controller.Utils.HTML.GetButton({
                                           "ActionButtonID": "delete_file",
                                           "Content": "Remove", "Attributes": {
                                               "data-icon": "delete",
                                               "data-attr-file-edit-remove-link": enCETriState.Yes
                                           }
                                       }) +
                                       "    </div>" +
                                       "</div><br />";

                    _fileUploadHTML += "<div " + util_renderAttribute("file_upload") + " " + util_htmlAttribute("id", opts.ElementID) + " " +
                                       (_isExtLinkSupport ? "class='EditorInlineFileUploadView' " : "") + _attrInputElement + " " +
                                       util_htmlAttribute("data-attr-is-preview-image", opts.IsFilterImage ? enCETriState.Yes : enCETriState.No) + " " +
                                       util_htmlAttribute("data-attr-file-upload-exts", util_arrJoinStr(_arrFileUploadExt || [], null, "|")) + " " +
                                       util_htmlAttribute("data-attr-file-upload-ref-id", opts.ElementID) + " " +
                                       util_htmlAttribute("data-attr-file-upload-css-class", "EditorFileUpload") + " " +
                                       util_htmlAttribute(CONTROL_FILE_UPLOAD_IS_FORCE_UPLOAD_ON_CHANGE, enCETriState.Yes) + " />";

                    if (_isExtLinkSupport) {
                        _fileUploadHTML += "<div class='EditorInlineFileUploadView'>" +
                                           _controller.Utils.HTML.Checkbox({
                                               "Content": "This is an externally located file or link", "Attributes": {
                                                   "data-attr-file-upload-element": opts.ElementID,
                                                   "data-attr-prop-ref-file": enColFileProperty.IsExternal,
                                                   "data-attr-is-external-link-toggle": enCETriState.Yes
                                               }
                                           }) +
                                           "</div>";

                        _fileUploadHTML += "<div class='FileExternalLinkToggle' " + util_htmlAttribute("data-attr-toggle-is-checked", enCETriState.Yes) +
                                            " style='display: none;'>" +
                                            "     <input type='text' data-corners='false' data-mini='true' " +
                                            util_htmlAttribute("data-attr-prop-ref-file", enColFileProperty.ExternalLink) + " placeholder='External File / Link' />" +
                                            "</div>";
                    }

                    return _fileUploadHTML;

                };  //end: _fnGetFileUploadHTML

                if (m_editOpts.IsCategoryMode()) {

                    var _toggleComponentsHTML = "<div class='ViewComponentToggles' " + _attrInputElement + ">";

                    for (var c = 0; c < _components.length; c++) {
                        var _component = _components[c];

                        _toggleComponentsHTML += "<div class='DisableUserSelectable FlipSwitchInline LinkClickable'>" +
                                                 " <div " + util_renderAttribute("flip_switch") +
                                                 " data-corners='false' data-mini='true' style='display: inline-block;' " +
                                                 util_htmlAttribute("data-attr-component-toggle-id", _component[enColComponentProperty.ComponentID]) + "/>" +
                                                 " <div class='Label'>" + _pluginInstance.Utils.ForceEntityDisplayName({
                                                     "Type": "Component", "Item": _component
                                                 }) + "</div>" +
                                                 "</div>";
                    }

                    _toggleComponentsHTML += "</div>";

                    _arrProps = $.merge(_arrProps,
                                        [{ "p": enColEditorResourceCategoryProperty.Name, "n": "Name", "req": true, "placeholder": "Enter Category Name" },
                                         {
                                             "p": enColEditorResourceCategoryProperty.Description, "n": "Description",
                                             "html": "<textarea class='EditorInputLarge' data-corners='false' data-mini='true' placeholder='Enter Description' " +
                                                     _attrInputElement + " />"
                                         },
                                         {
                                             "p": enColCEEditorResourceCategoryProperty.EditorResourceCategoryComponents, "n": "Include in",
                                             "html": _toggleComponentsHTML
                                         }

                                         //NOTE: client request to hide the dropdown list and selection view for category files (CODE REF #ResourceFileDropdown)
                                         ////{
                                         ////    "p": enColCEEditorResourceCategoryProperty.EditorResourceCategoryFiles, "n": "Tool / Resource(s)",
                                         ////    "html": "<div class='ViewBridgeListRenderer' " +
                                         ////            util_htmlAttribute("data-attr-selection-lookup-key", "ResourceList") + " " +
                                         ////            util_htmlAttribute("data-attr-selection-not-available-item-label",
                                         ////                               "You are not authorized to access the Market Access Tool / Resource.") + " " +
                                         ////            util_htmlAttribute("data-attr-selection-prop-text", enColEditorResourceProperty.Name) + " " +
                                         ////            util_htmlAttribute("data-attr-selection-prop-value", enColEditorResourceProperty.ResourceID) + " " +
                                         ////            util_htmlAttribute("data-attr-selection-bridge-entity-instance", "CEEditorResourceCategoryFile") + " " +
                                         ////            util_htmlAttribute("data-attr-selection-bridge-id-prop", 
                                         //                                 enColEditorResourceCategoryFileProperty.ResourceID) + " " +
                                         ////            util_htmlAttribute("data-attr-selection-bridge-display-order-prop", 
                                         ////                               enColEditorResourceCategoryFileProperty.DisplayOrder) + " " +
                                         ////            util_htmlAttribute("data-attr-selection-bridge-list-prop",
                                         ////                               enColCEEditorResourceCategoryProperty.EditorResourceCategoryFiles) + " " +
                                         ////            util_htmlAttribute("data-attr-selection-is-draggable", enCETriState.Yes) + " " +
                                         ////            _attrInputElement + " />"
                                         ////}
                                        ]);
                }
                else if (m_editOpts.IsResourceMode()) {

                    var _imageUploadNote = "Upload file must be one of the following image extensions: ";
                    var _arrExts = [];

                    if (_controller.FileUploadImageSupportedExt) {
                        for (var f = 0; f < _controller.FileUploadImageSupportedExt.length; f++) {
                            _arrExts.push("." + _controller.FileUploadImageSupportedExt[f]);
                        }
                    }

                    _imageUploadNote += util_arrJoinStr(_arrExts, null, ", ", "");

                    var _propFile = _propFile = { "p": null, "n": null, "html": "" };

                    if (_controller.Data.IsEditorToolResourceModeRepositoryResource) {
                        var _fileURL = "javascript: void(0);";

                        _propFile.n = "Document";
                        _propFile.p = enColEditorResourceProperty.RepositoryResourceID;

                        _propFile.html += "<div class='PluginEditorCardView EditorEffectDisabledGrayscale EditorInlineOpenExtLink ViewEditorRepositoryResourceInlineEdit' " +
                                          util_renderAttribute("pluginEditor_fileDisclaimer") + " " +
                                          util_htmlAttribute("data-attr-prop-name-repository-resource", enColEditorResourceProperty.RepositoryResourceIDName) + " " +
                                          util_htmlAttribute("data-attr-prop-file-id-repository-resource", enColEditorResourceProperty.RepositoryResourceFileID) + " " +
                                          util_htmlAttribute("data-attr-prop-file-display-name-repository-resource",
                                                             enColEditorResourceProperty.RepositoryResourceFileDisplayName) + ">";

                        _propFile.html += " <div class='Label'>&nbsp;</div>";

                        _propFile.html += "<a class='LinkExternal WordBreak DisableLinkStyle LinkDisabled' data-role='none' data-rel='external' target='_blank' " +
                                          util_htmlAttribute("href", _fileURL) + " " + util_htmlAttribute("title", "", null, true) + ">" +
                                          "    <div class='EditorImageButton ImageDownloadFile'>" +
                                          "        <div class='ImageIcon' />" +
                                          "    </div>" +
                                          "<span class='LabelFileName'>&nbsp;</span>" +
                                          "</a>";

                        _propFile.html += _controller.Utils.HTML.GetButton({
                            "Content": "View Details", "ActionButtonID": "resource_onRepositoryFile", "CssClass": "LinkDisabled",
                            "Attributes": {
                                "data-icon": "arrow-r", "data-repository-action-type": "view"
                            }
                        });

                        _propFile.html += _controller.Utils.HTML.GetButton({
                            "Content": "Remove", "ActionButtonID": "resource_onRepositoryFile",
                            "Attributes": {
                                "data-icon": "delete", "data-repository-action-type": "remove",
                                "style": "display: none;"
                            }
                        });

                        _propFile.html += _controller.Utils.HTML.GetButton({
                            "Content": "Edit", "ActionButtonID": "resource_onRepositoryFile",
                            "Attributes": {
                                "data-icon": "search", "data-repository-action-type": "search"
                            }
                        });

                        _propFile.html += "</div>";
                    }
                    else {
                        _propFile.n = "File";
                        _propFile.p = enColEditorResourceProperty.FileID;
                        _propFile.html += _fnGetFileUploadHTML({ "ElementID": "divResourceFile" });
                    }

                    _arrProps = $.merge(_arrProps,
                                        [{ "p": enColEditorResourceProperty.Name, "n": "Name", "req": true, "placeholder": "Enter Name" },
                                         _propFile,
                                         {
                                             "p": enColEditorResourceProperty.ThumbnailFileID, "n": "Thumbnail",
                                             "html": _fnGetFileUploadHTML({ "ElementID": "divResourceThumbnail", "IsFilterImage": true }) +
                                                     "<div class='EditorInlineNote'>" + util_htmlEncode(_imageUploadNote) + "</div>"
                                         },
                                         {
                                             "p": enColEditorResourceProperty.Description, "n": "Description",
                                             "html": "<textarea class='EditorInputLarge' data-corners='false' data-mini='true' placeholder='Enter Description' " +
                                                     _attrInputElement + " />"
                                         },
                                         {
                                             "p": enColCEEditorResourceProperty.ResourcePlatforms, "n": "Platform(s)",
                                             "req": true, "reqMessage": "At least one platform is required for the Tool / Resource.",
                                             "html": "<div>" + util_htmlEncode("Associate Tool / Resource with the following Platform(s):") + "</div>" +
                                                     "<div class='ViewPlatformToggles' " + _attrInputElement + " />"
                                         },
                                         {
                                             "p": enColEditorResourceProperty.IsRestrictedRole, "n": "Role(s)",
                                             "html": "<div class='ViewRoleToggles' " +
                                             util_htmlAttribute("data-attr-bridge-roles-prop", enColCEEditorResourceProperty.ResourceRoles) + " " +
                                             util_htmlAttribute("data-attr-bridge-id-prop", enColEditorResourceRoleProperty.RoleID) + " " +
                                             _attrInputElement + " />"
                                         }
                                        ]);

                    _controller.ResourceRenderOptions({
                        "Type": "AdminEdit", "RenderProperties": _arrProps, "AttributeInputElement": _attrInputElement, "EditID": _itemID
                    });

                    _arrProps.push({
                        "n": "Last Modified", "p": enColEditorResourceProperty.DateModified, "html": "<div class='LabelReadOnly' " + _attrInputElement + " />"
                    });
                }
                
                var _listRenderField = [];
                var _indexRenderField = 0;

                for (var p = 0; p < _arrProps.length; p++) {
                    var _prop = _arrProps[p];
                    var _isRequired = util_forceBool(_prop["req"], false);

                    var _attrs = util_htmlAttribute("data-attr-prop", _prop.p);
                    var _inputHTML = _prop["html"];

                    if (_prop["renderField"]) {
                        var _field = _prop["renderField"];

                        _controller.Utils.InitEditorRenderField({ "Field": _field, "Controller": _controller });

                        if (_field["_fieldItem"] && _field[enColCEditorRenderFieldProperty.Options] && typeof (_field[enColCEditorRenderFieldProperty.Options]) === "object") {
                            var _fieldItem = _field["_fieldItem"];

                            var _fieldOptions = _field[enColCEditorRenderFieldProperty.Options];
                            var _renderList = util_extend(_fieldOptions["_renderList"], _fieldItem["_renderList"]);

                            _fieldItem["_renderList"] = _renderList;
                        }

                        _attrs += " " + util_htmlAttribute("data-attr-render-field-item-index", _indexRenderField++) +
                                  " " + util_htmlAttribute("data-attr-render-field-lookup-data-key", _prop["DataLookupKey"]);

                        _listRenderField.push(_field);

                        _inputHTML = _controller.Utils.HTML.InputEditorDataType({
                            "DataType": _field[enColCEditorRenderFieldProperty.EditorDataTypeID], "Attributes": _prop["InputAttributes"], "IsDatePickerRenderer": true,
                            "FieldItem": _field
                        });
                    }
                    else if (!_inputHTML) {
                        _inputHTML = "<input type='text' data-mini='true' data-corners='false' " + _attrInputElement + " " +
                                     util_htmlAttribute("placeholder", util_forceString(_prop["placeholder"]), null, true) + " />";
                    }

                    _html += "<div class='TableBlockRow TableBlockTwoColumn' " + _attrs + ">" +
                             "  <div class='TableBlockCell ColumnHeading'>" +
                             (_isRequired ? "<span class='RequiredNote'>*</span>" : "") + util_htmlEncode(_prop.n + ":") +
                             "  </div>" +
                             "  <div class='TableBlockCell ColumnContent'>" + util_forceString(_inputHTML) + "</div>" +
                             "</div>";
                }

                _html += "</div>";

                _controller.Utils.Actions.ToggleEditView({
                    "Controller": _controller, "Trigger": $btn, "IsEnabled": true, "Title": (!_isEdit ? "Add" : "Edit") + " " + m_editOpts.EntityDisplayName,
                    "SaveButtonID": m_editOpts.SaveButtonID,
                    "CustomToolbarButtonHTML": (_isEdit ? _controller.Utils.HTML.GetButton({
                        "Content": "Delete", "ActionButtonID": m_editOpts.DeleteButtonID, "Attributes": { "data-icon": "delete" }
                    }) : ""),
                    "ContentHTML": _html,
                    "Callback": function (popupOpts) {

                        var $container = $(popupOpts.Container);
                        var $tbl = $container.find(".EditorAdminEditTable");
                        var $inputs = $tbl.find("[data-attr-prop] [data-attr-input-element]");

                        $container.data("ListRenderField", _listRenderField);

                        $container.off("remove.cleanup");
                        $container.on("remove.cleanup", function (e, args) {
                            var _uploads = ($container.data("uploads-cleanup") || {});
                            var _arr = [];

                            for (var _fileName in _uploads) {
                                _arr.push(_fileName);
                            }

                            if (_arr.length) {
                                GlobalService.UserTempFileUploadCleanup(_arr);
                            }
                        });

                        $container.off("events.onFileUploadSuccess");
                        $container.on("events.onFileUploadSuccess", function (e, args) {

                            args = util_extend({ "UploadOptions": null }, args);

                            var _uploads = $container.data("uploads-cleanup");
                            var _uploadOpts = args.UploadOptions;

                            if (!_uploads) {
                                _uploads = {};
                                $container.data("uploads-cleanup", _uploads);
                            }

                            _uploads[_uploadOpts.UploadFileName] = true;

                            if (_uploadOpts["PreviousUploadFileName"]) {
                                delete _uploads[_uploadOpts.PreviousUploadFileName];
                            }

                        });

                        $tbl.off("click.removeCurrentFileItem");
                        $tbl.on("click.removeCurrentFileItem",
                                ".EditorInlineOpenExtLink:not(.ViewEditorRepositoryResourceInlineEdit) .LinkClickable[data-attr-editor-controller-action-btn]", function (e, args) {

                                    var $this = $(this);
                                    var _action = $this.attr("data-attr-editor-controller-action-btn");

                                    var _fn = function () {
                                        $this.removeClass("LinkDisabled");
                                    };

                                    $this.addClass("LinkDisabled");

                                    switch (_action) {

                                        case "delete_file":
                                        case "undoDelete_file":
                                            var $parent = $this.closest(".EditorInlineOpenExtLink");
                                            var _fnUpdateButton = function () {
                                                var _opts = {
                                                    "Label": null,
                                                    "ButtonID": null,
                                                    "Icon": null
                                                };

                                                if (_action == "undoDelete_file") {
                                                    _opts.Label = "Remove";
                                                    _opts.ButtonID = "delete_file";
                                                    _opts.Icon = "delete";
                                                }
                                                else {
                                                    _opts.Label = "Undo";
                                                    _opts.ButtonID = "undoDelete_file";
                                                    _opts.Icon = "back";
                                                }

                                                $mobileUtil.ButtonSetTextByElement($this, _opts.Label);
                                                $mobileUtil.ButtonUpdateIcon($this, _opts.Icon);

                                                $this.attr("data-attr-editor-controller-action-btn", _opts.ButtonID);

                                            };  //end: _fnUpdateButton

                                            if (_action == "undoDelete_file") {
                                                $parent.removeClass("DeletedItem EffectStrikethrough");
                                                _fnUpdateButton();
                                                _fn();
                                            }
                                            else {

                                                dialog_confirmYesNo("Remove File", "Are you sure you want to remove the current thumbnail?",
                                                                    function () {
                                                                        $parent.addClass("DeletedItem EffectStrikethrough");
                                                                        _fnUpdateButton();

                                                                        _fn();
                                                                    }, _fn);
                                            }

                                            break;  //end: delete_file

                                        default:
                                            _fn();
                                            break;
                                    }

                                }); //end: click.removeCurrentFileItem

                        $tbl.off("events.bind");
                        $tbl.on("events.bind", function (e, args) {

                            args = util_extend({ "Callback": null }, args);

                            var _bindCallback = function () {

                                if (args.Callback) {
                                    args.Callback();
                                }
                            };

                            var _entityItem = $tbl.data("DataItem");

                            if (!_entityItem) {
                                _entityItem = {};
                                $tbl.data("DataItem", _entityItem);
                            }

                            var _listRenderField = ($container.data("ListRenderField") || []);

                            $.each($inputs, function () {
                                var $input = $(this);
                                var _prop = $mobileUtil.GetClosestAttributeValue($input, "data-attr-prop");
                                var _val = util_propertyValue(_entityItem, _prop);

                                if ($input.is("input[type='text'], textarea")) {
                                    _val = util_forceString(_val);
                                    $input.val(_val);
                                }
                                else if ($input.is(".ViewComponentToggles")) {

                                    //category component toggles
                                    var $ddlList = $input.find("[" + util_renderAttribute("flip_switch") + "] select[data-attr-widget='flip_switch']");
                                    var _categoryComponents = (_val || []);

                                    $.each($ddlList, function () {
                                        var $ddl = $(this);
                                        var _componentID = util_forceInt($mobileUtil.GetClosestAttributeValue($ddl, "data-attr-component-toggle-id"), enCE.None);
                                        var _searchComponent = util_arrFilter(_categoryComponents, enColEditorResourceCategoryComponentProperty.ComponentID,
                                                                              _componentID, true);

                                        $ddl.val(_searchComponent.length == 1 ? enCETriState.Yes : enCETriState.No)
                                            .trigger("change");
                                    });

                                    $input.data("data-source-category-comp-list", _categoryComponents); //persist the source list on element
                                }
                                else if ($input.is(".ViewPlatformToggles")) {

                                    var _platformTogglesHTML = _controller.Utils.HTML.PlatformFlipSwitchToggles({
                                        "Controller": _controller, "Platforms": m_editOpts.Platforms,
                                        "BridgeList": _val, "PropertyBridgePlatformID": m_editOpts.PropertyBridgePlatformID
                                    });

                                    $input.html(_platformTogglesHTML);
                                    $mobileUtil.refresh($input);

                                    _controller.Utils.BindFlipSwitchEvents({ "Element": $input });

                                    $input.data("data-source-resource-platform-list", _val); //persist the source list on element

                                }
                                else if ($input.is(".ViewRoleToggles")) {
                                    var _roleHTML = "";

                                    _roleHTML += _controller.Utils.HTML.Checkbox({
                                        "ID": "cbRestrictRole", "Content": "Restrict access to the following roles:"
                                    });

                                    $input.html(_roleHTML);
                                    $mobileUtil.refresh($input);

                                    var $vwSelection = $("<div />");
                                    var _propBridgeList = $input.attr("data-attr-bridge-roles-prop");
                                    var _propBridgeID = $input.attr("data-attr-bridge-id-prop");

                                    $input.append($vwSelection);

                                    _controller.Utils.BindBridgeListSelectionView({
                                        "Controller": _controller, "Element": $vwSelection, "DefaultLabel": "--Select Role--",
                                        "Data": m_editOpts.ClassificationPlatformRoles, "PropertyText": enColClassificationPlatformRoleProperty.Name,
                                        "PropertyID": enColClassificationPlatformRoleProperty.RoleID,
                                        "BridgeEntityInstance": CEEditorResourceRole,
                                        "BridgeData": _entityItem[_propBridgeList], "PropertyBridgeID": _propBridgeID
                                    });

                                    var $cbRestrictRole = $input.find("#cbRestrictRole");

                                    $cbRestrictRole.off("change.role");
                                    $cbRestrictRole.on("change.role", function () {

                                        var $cb = $(this);
                                        var _checked = $cb.prop("checked");

                                        $vwSelection.trigger("events._toggleState", { "IsEnabled": _checked });                                        
                                    });

                                    $cbRestrictRole.prop("checked", _val === true)
                                                   .checkboxradio("refresh")
                                                   .trigger("change.role");
                                }
                                else if($input.is(".ViewBridgeListRenderer")) {

                                    var $vwSelection = $("<div />");

                                    var _listRenderOpts = {
                                        "DefaultLabel": $input.attr("data-attr-selection-default-label"),
                                        "ItemNotAvailableLabel": $input.attr("data-attr-selection-not-available-item-label"),
                                        "DataKey": $input.attr("data-attr-selection-lookup-key"),
                                        "PropText": $input.attr("data-attr-selection-prop-text"),
                                        "PropValue": $input.attr("data-attr-selection-prop-value"),
                                        "PropBridgeList": $input.attr("data-attr-selection-bridge-list-prop").split("."),
                                        "PropBridgeID": $input.attr("data-attr-selection-bridge-id-prop"),
                                        "PropBridgeItemDisplayOrder": $input.attr("data-attr-selection-bridge-display-order-prop"),
                                        "BridgeEntityInstance": eval($input.attr("data-attr-selection-bridge-entity-instance")),
                                        "IsAllowInvalidSelection": util_forceInt($input.attr("data-attr-selection-allow-invalid-selection"), enCETriState.No),
                                        "IsDraggable": util_forceInt($input.attr("data-attr-selection-is-draggable"), enCETriState.No),
                                        "EventFromLookup": function (attrName) {
                                            var _key = util_forceString($input.attr(attrName));

                                            return (_key != "" && m_editOpts.LookupListRendererEvent[_key] ? m_editOpts.LookupListRendererEvent[_key] : null);
                                        }
                                    };

                                    $input.append($vwSelection);

                                    var _bridgeList = _entityItem;
                                    
                                    for(var ep = 0; ep < _listRenderOpts.PropBridgeList.length && _bridgeList; ep++) {
                                        _bridgeList = _bridgeList[_listRenderOpts.PropBridgeList[ep]];
                                    }

                                    _controller.Utils.BindBridgeListSelectionView({
                                        "Controller": _controller, "Element": $vwSelection, "DefaultLabel": _listRenderOpts.DefaultLabel,
                                        "ItemNotAvailableLabel": _listRenderOpts.ItemNotAvailableLabel,
                                        "Data": m_editOpts.LookupExtData[_listRenderOpts.DataKey], 
                                        "PropertyText": _listRenderOpts.PropText, "PropertyID": _listRenderOpts.PropValue,
                                        "BridgeEntityInstance": _listRenderOpts.BridgeEntityInstance,
                                        "BridgeData": _bridgeList, "PropertyBridgeID": _listRenderOpts.PropBridgeID, 
                                        "PropertyBridgeItemDisplayOrder": _listRenderOpts.PropBridgeItemDisplayOrder,
                                        "AllowInvalidSelection": (_listRenderOpts.IsAllowInvalidSelection == enCETriState.Yes),
                                        "IsDraggable": (_listRenderOpts.IsDraggable == enCETriState.Yes),
                                        "Events": {
                                            "OnItemPopulate": _listRenderOpts.EventFromLookup("data-attr-param-event-populate-name")
                                        }
                                    });

                                }
                                else if ($input.is("[data-attr-input-data-type]")) {
                                    var _index = util_forceInt($mobileUtil.GetClosestAttributeValue($input, "data-attr-render-field-item-index"), -1);

                                    if (_index >= 0 && _index < _listRenderField.length) {

                                        var _field = _listRenderField[_index];
                                        var _fieldOptions = _field[enColCEditorRenderFieldProperty.Options];

                                        if (typeof _fieldOptions === "string") {
                                            _fieldOptions = null;
                                        }
                                        else {
                                            var _dataKey = util_forceString($mobileUtil.GetClosestAttributeValue($input, "data-attr-render-field-lookup-data-key"));
                                            var _fieldItem = _field["_fieldItem"];

                                            if (_dataKey != "" && _fieldItem && _fieldItem["_renderList"]) {
                                                util_extend(_fieldItem["_renderList"], { "Data": m_editOpts.LookupExtData[_dataKey] }, true, true);
                                            }
                                        }

                                        //bind the input element based on the render field
                                        _controller.Utils.Actions.InputEditorDataType({
                                            "Controller": _controller,
                                            "IsGetValue": false,
                                            "Element": $input,
                                            "FieldItem": _field["_fieldItem"],
                                            "FieldOptions": _fieldOptions,
                                            "DataItem": _entityItem,
                                            "IsDatePickerRenderer": true
                                        });
                                    }
                                }
                                else if ($input.hasClass("LabelReadOnly")) {
                                    if (_prop == enColEditorResourceProperty.DateModified && m_editOpts.IsResourceMode()) {
                                        _val = util_FormatDateTime(_val, "", null, true, { "IsValidateConversion": true });
                                    }

                                    _val = util_forceString(_val);

                                    $input.text(_val);
                                }
                            });

                            //configure the file upload control events
                            var $fileUploads = $inputs.filter("[" + util_renderAttribute("file_upload") + "]");
                            var _searchFileList = null;

                            $fileUploads.data(CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK, function (uploadOpts) {

                                uploadOpts = util_extend({ "Element": null }, uploadOpts);

                                $container.trigger("events.onFileUploadSuccess", { "UploadOptions": uploadOpts });
                                $(uploadOpts.Element).data("LastUploadedFile", uploadOpts);
                            });

                            $fileUploads.data("OnFileUploadClear", function (optsClear) {
                                optsClear = util_extend({ "Element": null, "Callback": null }, optsClear);

                                //remove the last uploaded file data flag
                                $(optsClear.Element).removeData("LastUploadedFile");

                                if (optsClear.Callback) {
                                    optsClear.Callback();
                                }
                            });

                            $fileUploads.off("events.resource_setFileValue");
                            $fileUploads.on("events.resource_setFileValue", function (e, args) {

                                var $this = $(this);
                                var _isPreviewImage = (util_forceInt($this.attr("data-attr-is-preview-image"), enCETriState.None) == enCETriState.Yes);
                                var $vwParent = $this.closest("[data-attr-prop]");

                                args = util_extend({ "Item": null, "From": "item" }, args);

                                var _fileItem = (args.Item || (new CEFile_JSON()));

                                var $clPreview = $vwParent.find("a[" + util_htmlAttribute("data-attr-file-edit-preview-link", enCETriState.Yes) + "]");
                                var $vwOpenExtLink = $clPreview.closest(".EditorInlineOpenExtLink");
                                var $lblName = $vwOpenExtLink.children(".Label");

                                var _href = null;
                                var _name = null;
                                var _skipFileInit = false;
                                var _hasUploadedFile = true;

                                if (args.From == "item" && (util_forceInt(_fileItem[enColFileProperty.FileID], enCE.None) == enCE.None)) {
                                    _skipFileInit = true;
                                }

                                if (!_skipFileInit) {

                                    if (_fileItem[enColFileProperty.IsExternal] && (util_forceInt(_fileItem[enColFileProperty.FileID], enCE.None) == enCE.None)) {

                                        //if it is external link and the file ID does not exist, then use the link URL for both
                                        _href = _fileItem[enColFileProperty.ExternalLink];
                                        _name = _href;
                                    }
                                    else if (util_forceString(_fileItem[enColCEFile_JSONProperty.UploadFileName]) != "") {
                                        _href = $this.data("upload-preview-url");
                                        _name = _fileItem[enColCEFile_JSONProperty.UploadFileName];
                                    }
                                    else {
                                        _href = _controller.Utils.ConstructDownloadURL({ "TypeID": "editor", "Item": _fileItem });
                                        _name = (_fileItem[enColFileProperty.IsExternal] == true ? _fileItem[enColFileProperty.ExternalLink] :
                                                                                                   _fileItem[enColFileProperty.Name]);
                                    }
                                }

                                if (util_trim(_href) == "") {
                                    _href = "javascript: void(0);";
                                    _hasUploadedFile = false;
                                }

                                if (util_forceString(_name) == "") {
                                    _name = "File not available";
                                    _hasUploadedFile = false;
                                }

                                $clPreview.attr("href", _href);
                                $lblName.text(_name);

                                $vwOpenExtLink.find(".EditToolButtons").toggle(_hasUploadedFile);

                                if (_isPreviewImage) {
                                    $vwParent.find(".EditorPreviewThumbnail")
                                             .toggle(_hasUploadedFile)
                                             .children("img")
                                             .attr("src", _href);
                                }

                            }); //end: events.resource_setFileValue

                            if (m_editOpts.IsResourceMode()) {
                                _searchFileList = (_entityItem[enColCEEditorResourceProperty.FileList] || []);
                                $tbl.data("data-attr-src-file-list", _searchFileList);

                                //configure the source category ID
                                var _srcCategoryID = util_forceInt(_controller.DOM.Views.filter("[data-attr-view-mode='detail']").data("EditID"), enCE.None);

                                $tbl.data("SourceCategoryID", _srcCategoryID);

                                if (_controller.Data.IsEditorToolResourceModeRepositoryResource) {
                                    var $list = $tbl.find(".ViewEditorRepositoryResourceInlineEdit");

                                    $.each($list, function () {
                                        $(function ($this) {

                                            $this.off("events.resource_onUpdateRepositoryFileView");
                                            $this.on("events.resource_onUpdateRepositoryFileView", function (e, args) {
                                                args = util_extend({
                                                    "Item": null, "PropertyID": null, "PropertyName": null, "PropertyFileID": null,
                                                    "PropertyFileDisplayName": null
                                                }, args);

                                                var _item = args.Item;

                                                var _propertyID = args.PropertyID;
                                                var _propertyName = args.PropertyName;
                                                var _propertyFileID = args.PropertyFileID;  //the file ID for the repository resource item

                                                var _fileOptions = {
                                                    "HasLegacyFile": false, //backward compatibility
                                                    "HasRepositoryResource": false,
                                                    "CanDownload": false,
                                                    "CanView": false,
                                                    "Name": null,
                                                    "IsNameHTML": false,
                                                    "URL": "javascript: void(0);",
                                                    "DownloadLabel": null
                                                };

                                                if (_item && _propertyID) {
                                                    var _id = util_forceInt(util_propertyValue(_item, _propertyID), enCE.None);

                                                    if (_id != enCE.None) {                                                        
                                                        _fileOptions.HasRepositoryResource = true;
                                                        _fileOptions.CanView = true;
                                                    }
                                                }

                                                if (_fileOptions.HasRepositoryResource && _propertyFileID) {
                                                    var _fileID = util_forceInt(util_propertyValue(_item, _propertyFileID), enCE.None);

                                                    _fileOptions.CanDownload = (_fileID != enCE.None);

                                                    if (_fileOptions.CanDownload) {
                                                        _fileOptions.URL = _controller.Utils.ConstructDownloadURL({
                                                            "TypeID": "editor", "IsResourceMode": true, "Item": _item,
                                                            "Property": _propertyID
                                                        });
                                                    }
                                                }

                                                if (!_fileOptions.HasRepositoryResource) {

                                                    //check if a legacy file is available
                                                    var _dataItem = $tbl.data("DataItem");

                                                    _fileOptions.HasLegacyFile = (util_forceInt(_dataItem[enColEditorResourceProperty.FileID], enCE.None) != enCE.None);

                                                    //legacy file exists, so construct custom download URL and name using the file ID
                                                    if (_fileOptions.HasLegacyFile) {
                                                        var _fileID = _dataItem[enColEditorResourceProperty.FileID];
                                                        var _fileList = util_propertyValue(_dataItem, enColCEEditorResourceProperty.FileList);
                                                        var _file = util_arrFilter(_fileList, enColFileProperty.FileID, _fileID, true);

                                                        _file = (_file.length == 1 ? _file[0] : {});

                                                        _fileOptions.URL = _controller.Utils.ConstructDownloadURL({ "TypeID": "editor", "Item": _file });

                                                        var _nameHtml = util_htmlEncode(_file[enColFileProperty.IsExternal] == true ?
                                                                                        _file[enColFileProperty.ExternalLink] :
                                                                                        _file[enColFileProperty.Name]);

                                                        _nameHtml += "<div class='DisableUserSelectable LabelEditorFileWarning'>" +
                                                                     "<i class='material-icons'>error_outline</i>" +
                                                                     "  <div class='LabelMessage'>" +
                                                                     util_htmlEncode("File associated was entered manually and does not support additional details.") +
                                                                     "  </div>" +
                                                                     "</div>";

                                                        _fileOptions.Name = _nameHtml;
                                                        _fileOptions.IsNameHTML = true;
                                                        _fileOptions.CanDownload = true;
                                                    }
                                                }

                                                if (!_fileOptions.HasLegacyFile) {
                                                    if (_fileOptions.HasRepositoryResource && _propertyName) {
                                                        _fileOptions.Name = util_propertyValue(_item, _propertyName);
                                                    }
                                                    else if (!_fileOptions.HasRepositoryResource) {
                                                        _fileOptions.Name = "Document not available";
                                                    }
                                                }

                                                if (_fileOptions.CanDownload && args.PropertyFileDisplayName) {
                                                    _fileOptions.DownloadLabel = util_propertyValue(_item, args.PropertyFileDisplayName);
                                                }

                                                if (util_forceString(_fileOptions.DownloadLabel) == "") {
                                                    _fileOptions.DownloadLabel = (_fileOptions.CanDownload ? "Download" : "There is no file associated.");
                                                }

                                                var $clDownload = $this.find(".LinkExternal[data-rel='external']");

                                                $clDownload.children(".LabelFileName:first")
                                                           .text(_fileOptions.DownloadLabel);

                                                var $links = $this.find("[data-attr-editor-controller-action-btn='resource_onRepositoryFile']");
                                                var $clView = $links.filter("[data-repository-action-type='view']");
                                                var $clRemove = $links.filter("[data-repository-action-type='remove']");

                                                $clDownload.attr("href", _fileOptions.URL)
                                                           .toggleClass("LinkDisabled", !_fileOptions.CanDownload);

                                                $clView.toggleClass("LinkDisabled", !_fileOptions.CanView);
                                                $clRemove.toggle(_fileOptions.HasRepositoryResource || _fileOptions.HasLegacyFile);

                                                var $lbl = $this.children(".Label:first");

                                                _fileOptions.Name = util_forceString(_fileOptions.Name);

                                                if (!_fileOptions.IsNameHTML) {
                                                    $lbl.text(_fileOptions.Name);
                                                }
                                                else {
                                                    $lbl.html(_fileOptions.Name)
                                                        .trigger("create");
                                                }

                                            }); //end: events.resource_onUpdateRepositoryFileView

                                            $this.off("click.resource_onRepositoryFile");
                                            $this.on("click.resource_onRepositoryFile",
                                                     ".LinkClickable:not(.LinkDisabled)[data-attr-editor-controller-action-btn='resource_onRepositoryFile']",
                                                     function (e, args) {

                                                         var $this = $(this);
                                                         var _dataItem = $tbl.data("DataItem");
                                                         var _action = util_forceString($this.attr("data-repository-action-type"));

                                                         args = util_extend({ "Callback": null }, args);

                                                         var _componentID = _controller.Utils.ContextEditorGroupComponentID($this);
                                                         var _repositoryResourceController = _controller.Data.RepositoryResourceController;

                                                         var _handled = true;
                                                         var _repositoryResourceID = util_forceInt(_dataItem[enColEditorResourceProperty.RepositoryResourceID], enCE.None);

                                                         var _fnSetUpdatedRepositoryResourceItem = function (item, isAddNew) {

                                                             isAddNew = util_forceBool(isAddNew, false);

                                                             if (item && util_forceInt(item[enColRepositoryResourceProperty.ResourceID], enCE.None) != enCE.None) {

                                                                 //as the custom repository resource ID is specified, we will clear the previous FileID (if applicable);
                                                                 //this is to support backward compatibility (e.g. enable repository resource integration from legacy code)
                                                                 delete _dataItem[enColEditorResourceProperty.FileID];

                                                                 //if a new item was added and the file display name is not specified, retrieve it from the temp file item
                                                                 if (isAddNew && util_forceString(item[enColRepositoryResourceProperty.FileDisplayName]) == "") {
                                                                     var _fileDisplayName = util_propertyValue(item,
                                                                                                               enColCERepositoryResource_JSONProperty.TempFileItem + "." +
                                                                                                               enColFileProperty.Name);

                                                                     item[enColRepositoryResourceProperty.FileDisplayName] = util_forceString(_fileDisplayName);
                                                                 }

                                                                 //update edit item property values from repository resource
                                                                 _dataItem[enColEditorResourceProperty.RepositoryResourceID] = item[enColRepositoryResourceProperty.ResourceID];
                                                                 _dataItem[enColEditorResourceProperty.RepositoryResourceIDName] = item[enColRepositoryResourceProperty.Name];
                                                                 _dataItem[enColEditorResourceProperty.RepositoryResourceFileDisplayName] =
                                                                     item[enColRepositoryResourceProperty.FileDisplayName];

                                                                 var _fileID = util_forceInt(item[enColRepositoryResourceProperty.FileID], enCE.None);

                                                                 _dataItem[enColEditorResourceProperty.RepositoryResourceFileID] = _fileID;

                                                                 //set the update link and label
                                                                 var $vw = $this.closest(".ViewEditorRepositoryResourceInlineEdit");

                                                                 $vw.trigger("events.resource_onUpdateRepositoryFileView",
                                                                             {
                                                                                 "Item": item,
                                                                                 "PropertyID": enColRepositoryResourceProperty.ResourceID,
                                                                                 "PropertyName": enColRepositoryResourceProperty.Name,
                                                                                 "PropertyFileID": enColRepositoryResourceProperty.FileID,
                                                                                 "PropertyFileDisplayName": enColRepositoryResourceProperty.FileDisplayName
                                                                             });
                                                             }
                                                         };  //end: _fnSetUpdatedRepositoryResourceItem

                                                         $this.addClass("LinkDisabled");

                                                         switch (_action) {

                                                             case "remove":

                                                                 var _fnOnDismiss = function (isRefreshFile) {
                                                                     $this.removeClass("LinkDisabled");

                                                                     if (isRefreshFile) {
                                                                         var $vw = $this.closest(".ViewEditorRepositoryResourceInlineEdit");

                                                                         //set update values to clear the file (both legacy file ID and the repository resource)
                                                                         _dataItem[enColEditorResourceProperty.FileID] = null;
                                                                         _dataItem[enColEditorResourceProperty.RepositoryResourceID] = null;
                                                                         _dataItem[enColEditorResourceProperty.RepositoryResourceIDName] = null;
                                                                         _dataItem[enColEditorResourceProperty.RepositoryResourceFileDisplayName] = null;
                                                                         _dataItem[enColEditorResourceProperty.RepositoryResourceFileID] = enCE.None;

                                                                         $vw.trigger("events.resource_onUpdateRepositoryFileView",
                                                                                     {
                                                                                         "Item": _dataItem,
                                                                                         "PropertyID": enColEditorResourceProperty.RepositoryResourceID,
                                                                                         "PropertyName": enColEditorResourceProperty.RepositoryResourceIDName,
                                                                                         "PropertyFileID": enColEditorResourceProperty.RepositoryResourceFileID,
                                                                                         "PropertyFileDisplayName": enColEditorResourceProperty.RepositoryResourceFileDisplayName
                                                                                     });
                                                                     }
                                                                 };

                                                                 dialog_confirmYesNo("Remove Document", "Are you sure you want to remove the current document?",
                                                                                     function () {

                                                                                         //remove the current file
                                                                                         _fnOnDismiss(true);
                                                                                     }, function () {
                                                                                         _fnOnDismiss();
                                                                                     });

                                                                 break; //end: remove

                                                             case "view":
                                                                 if (_repositoryResourceID != enCE.None) {

                                                                     $this.attr("data-attr-view-repository-resource-id", _repositoryResourceID);

                                                                     _controller.OnViewRepositoryResourceDetails({
                                                                         "Trigger": $this, "OnEditSaveCallback": function (opts) {
                                                                             if (opts && opts["Item"]) {
                                                                                 var _resource = opts.Item;

                                                                                 _fnSetUpdatedRepositoryResourceItem(_resource);
                                                                             }
                                                                         }
                                                                     });
                                                                 }
                                                                 else {
                                                                     $this.removeAttr("data-attr-view-repository-resource-id");
                                                                     _handled = false;
                                                                 }

                                                                 break; //end: view

                                                             case "search":
                                                                 var _defaultCategoryID = _repositoryResourceController.Data.DefaultEditorToolResourceSearchCategoryID;

                                                                 var _opts = {
                                                                     "CategoryID": _defaultCategoryID,
                                                                     "IsHideScrollbar": true,
                                                                     "IsMultiSelect": false,
                                                                     "IsRestrictDocumentTypeFilter": true,
                                                                     "ListDisableSelectionID": [],
                                                                     "Events": {
                                                                         "OnConfigureParams": function (params) {
                                                                             params["ComponentID"] = _componentID;
                                                                         },
                                                                         "OnSave": function (opts) {

                                                                             opts = util_extend({ "SelectedItem": null }, opts);

                                                                             var _selection = opts["SelectedItem"];
                                                                             var _resource = (_selection ? _selection["Data"] : null);

                                                                             _fnSetUpdatedRepositoryResourceItem(_resource);
                                                                         }
                                                                     },
                                                                     "AddActionOptions": {
                                                                         "DocumentTypes":
                                                                             "%%TOK|ROUTE|PluginEditor|FilteredComponentRepositoryDocumentTypes|{ Key: \"tool_resource\" }%%",
                                                                         "OnSaveCallback": function (opts) {
                                                                             var _resource = opts.Item;

                                                                             _fnSetUpdatedRepositoryResourceItem(_resource, true);
                                                                         }
                                                                     },
                                                                     "Callback": function () {

                                                                         $this.removeClass("LinkDisabled");

                                                                         if (args["Callback"]) {
                                                                             args.Callback();
                                                                         }
                                                                     }
                                                                 };

                                                                 //set current resource ID and the extended properties for the name (required to support default selection)
                                                                 _opts["DefaultSelection"] = {
                                                                     "Value": _repositoryResourceID,
                                                                     "ExtProperties": [
                                                                         {
                                                                             "n": enColRepositoryResourceProperty.Name,
                                                                             "v": _dataItem[enColEditorResourceProperty.RepositoryResourceIDName]
                                                                         },
                                                                         {
                                                                             "n": enColRepositoryResourceProperty.FileID,
                                                                             "v": _dataItem[enColEditorResourceProperty.RepositoryResourceFileID]
                                                                         },
                                                                         {
                                                                             "n": enColRepositoryResourceProperty.FileDisplayName,
                                                                             "v": _dataItem[enColEditorResourceProperty.RepositoryResourceFileDisplayName]
                                                                         }
                                                                     ]
                                                                 };

                                                                 _controller.Data.RepositoryResourceController.PopupSearchResource(_opts);

                                                                 break; //end: search

                                                             default:
                                                                 _handled = false;
                                                                 break;
                                                         }

                                                         if (!_handled) {
                                                             $this.removeClass("LinkDisabled");
                                                         }

                                                     }); //end: click.resource_onRepositoryFile

                                            $this.trigger("events.resource_onUpdateRepositoryFileView",
                                                         {
                                                             "Item": _entityItem,
                                                             "PropertyID": $mobileUtil.GetClosestAttributeValue($this, "data-attr-prop"),
                                                             "PropertyName": $mobileUtil.GetClosestAttributeValue($this, "data-attr-prop-name-repository-resource"),
                                                             "PropertyFileID": $mobileUtil.GetClosestAttributeValue($this, "data-attr-prop-file-id-repository-resource"),
                                                             "PropertyFileDisplayName": $mobileUtil.GetClosestAttributeValue($this,
                                                                                                                             "data-attr-prop-file-display-name-repository-resource")
                                                         });

                                        }($(this)));
                                    });
                                }
                            }
                            $.each($fileUploads, function () {
                                var $this = $(this);
                                var _prop = $mobileUtil.GetClosestAttributeValue($this, "data-attr-prop");
                                var _file = null;
                                var _fileID = util_forceInt(_entityItem[_prop], enCE.None);

                                _file = util_arrFilter(_searchFileList, enColFileProperty.FileID, _fileID, true);
                                _file = (_file.length == 1 ? _file[0] : null);

                                $this.trigger("events.resource_setFileValue", { "Item": _file });
                            });

                            $tbl.off("change.toggleExternalLink");
                            $tbl.on("change.toggleExternalLink",
                                    "input[type='checkbox']" + "[" + util_htmlAttribute("data-attr-is-external-link-toggle", enCETriState.Yes) + "]",
                                    function (e, args) {

                                        var $cb = $(this);
                                        var _checked = $cb.prop("checked");
                                        var $parent = $cb.closest("[data-attr-prop]");
                                        var $vw = $parent.find(".FileExternalLinkToggle");

                                        $vw.filter("[" + util_htmlAttribute("data-attr-toggle-is-checked", enCETriState.Yes) + "]")
                                           .toggle(_checked);

                                        $vw.not("[" + util_htmlAttribute("data-attr-toggle-is-checked", enCETriState.Yes) + "]")
                                           .toggle(!_checked);

                                        if (_checked) {
                                            $vw.filter(":visible")
                                               .find("input")
                                               .trigger("focus");
                                        }
                                    });

                            $tbl.off("blur.inputLink");
                            $tbl.on("blur.inputLink", "input[type='text'][" + util_htmlAttribute("data-attr-prop-ref-file", enColFileProperty.ExternalLink) + "]",
                                    function (e, args) {
                                        var $input = $(this);

                                        $input.val(_controller.Utils.ForceValidURL($input.val()));
                                    });

                            _bindCallback();

                        }); //end: events.bind

                        $tbl.off("events.populateItem");
                        $tbl.on("events.populateItem", function (e, args) {

                            args = util_extend({ "Item": null, "Callback": null }, args);

                            var _item = args.Item;

                            if (!_item) {
                                _item = {};
                                args.Item = _item;
                            }

                            $.each($inputs, function () {
                                var $input = $(this);
                                var $vwParent = $input.closest("[data-attr-prop]");
                                var _prop = $vwParent.attr("data-attr-prop");
                                var _val = _item[_prop];
                                var _linkedProp = null;
                                var _skipReqCheck = false;
                                var _isPropValueSet = false;

                                if ($input.is("input[type='text'], textarea")) {
                                    _val = util_trim($input.val());

                                    $input.val(_val);
                                }
                                else if ($input.is(".ViewComponentToggles")) {

                                    //category component toggles
                                    var $ddlList = $input.find("[" + util_renderAttribute("flip_switch") + "] select[data-attr-widget='flip_switch']");
                                    var _srcCategoryComponents = ($input.data("data-source-category-comp-list") || []);

                                    _val = [];

                                    $.each($ddlList, function () {
                                        var $ddl = $(this);

                                        //only selected component toggles
                                        if (util_forceInt($ddl.val(), enCETriState.None) == enCETriState.Yes) {

                                            var _componentID = util_forceInt($mobileUtil.GetClosestAttributeValue($ddl, "data-attr-component-toggle-id"), enCE.None);
                                            var _categoryComponent = util_arrFilter(_srcCategoryComponents, enColEditorResourceCategoryComponentProperty.ComponentID,
                                                                                    _componentID, true);

                                            if (_categoryComponent.length == 1) {
                                                _categoryComponent = _categoryComponent[0];
                                            }
                                            else {
                                                _categoryComponent = new CEEditorResourceCategoryComponent();
                                            }

                                            _categoryComponent[enColEditorResourceCategoryComponentProperty.ComponentID] = _componentID;

                                            _val.push(_categoryComponent);
                                        }
                                    });
                                }
                                else if ($input.is(".ViewPlatformToggles")) {

                                    _val = _controller.Utils.Actions.PopulatePlatformToggleSelections({
                                        "Element": $input,
                                        "BridgeEntityInstance": CEEditorResourcePlatform,
                                        "PropertyBridgePlatformID": enColEditorResourcePlatformProperty.PlatformID,
                                        "SourceBridgePlatformList": ($input.data("data-source-resource-platform-list") || [])
                                    });
                                }
                                else if ($input.is(".ViewRoleToggles")) {
                                    _val = $input.find("#cbRestrictRole").prop("checked");

                                    var _propBridgeList = $input.attr("data-attr-bridge-roles-prop");

                                    var _populate = {};

                                    $input.children(".DropdownSelectionView").trigger("events._populate", _populate);

                                    _item[_propBridgeList] = _populate.List;
                                }
                                else if ($input.is(".ViewBridgeListRenderer")) {
                                    var _propBridgeList = util_forceString($input.attr("data-attr-selection-bridge-list-prop")).split(".");
                                    
                                    if (_propBridgeList.length > 0) {

                                        var _current = null;
                                        var _populate = {};

                                        $input.children(".DropdownSelectionView").trigger("events._populate", _populate);

                                        _current = _item;

                                        for (var ep = 0; ep < _propBridgeList.length - 1; ep++) {
                                            var _p = _propBridgeList[ep];
                                            var _temp = _current[_p];

                                            if (!_temp && ep + 1 < _propBridgeList.length) {
                                                _temp = {};
                                                _current[_p] = _temp;
                                            }

                                            _current = _temp;
                                        }

                                        var _propValue = _propBridgeList[_propBridgeList.length - 1];
                                        
                                        _current[_propValue] = _populate.List;

                                        _isPropValueSet = true;
                                    }

                                    var _propConfig = util_arrFilter(_arrProps, "p", _prop, true);

                                    if (_propConfig.length == 1) {
                                        _propConfig = _propConfig[0];

                                        if (_propConfig["onValidate"] && util_isFunction(_propConfig.onValidate)) {
                                            _propConfig.onValidate({ "Prop": _prop, "Element": $input, "Item": _item });
                                        }
                                    }
                                }
                                else if ($input.is("[" + util_renderAttribute("file_upload") + "]")) {

                                    var _uploadedFile = $input.data("LastUploadedFile");
                                    var _file = null;
                                    var _searchFileList = null;

                                    var $vwOpenExtLink = $vwParent.find(".EditorInlineOpenExtLink");

                                    var $cbExternal = $vwParent.find("input[type='checkbox'][" +
                                                                     util_htmlAttribute("data-attr-is-external-link-toggle", enCETriState.Yes) + "]");
                                    var _isExternal = ($cbExternal.length == 1 ? $cbExternal.prop("checked") : false);

                                    if (!$input.data("is-init-file-id")) {
                                        $input.data("is-init-file-id", true)
                                              .data("source-prop-value", _item[_prop]);
                                    }

                                    if (m_editOpts.IsResourceMode()) {

                                        switch (_prop) {

                                            case enColEditorResourceProperty.FileID:
                                                //TODO FILE
                                                _linkedProp = enColCEEditorResource_JSONProperty.TempFileItem;
                                                break;

                                            case enColEditorResourceProperty.ThumbnailFileID:
                                                _linkedProp = enColCEEditorResource_JSONProperty.TempThumbnailFileItem;
                                                break;
                                        }

                                        _searchFileList = $tbl.data("data-attr-src-file-list");
                                    }

                                    if (_isExternal || (!_isExternal && !util_isNullOrUndefined(_uploadedFile))) {

                                        _val = $input.data("source-prop-value");
                                        _item[_prop] = _val;

                                        if (_searchFileList) {
                                            var _searchFileID = util_forceInt(_item[_prop], enCE.None);

                                            _file = util_arrFilter(_searchFileList, enColFileProperty.FileID, _searchFileID, true);
                                            _file = (_file.length == 1 ? _file[0] : null);
                                        }

                                        if (!_file) {
                                            _file = new CEFile_JSON();
                                        }

                                        _file[enColFileProperty.IsExternal] = _isExternal;

                                        if (_isExternal) {
                                            var $tbExtLink = $vwParent.find("input[type='text'][" +
                                                                            util_htmlAttribute("data-attr-prop-ref-file", enColFileProperty.ExternalLink) + "]");
                                            var _link = _controller.Utils.ForceValidURL($tbExtLink.val());

                                            $tbExtLink.val(_link);

                                            _file[enColFileProperty.ExternalLink] = _link;
                                            _file[enColFileProperty.Name] = null;

                                            delete _file[enColCEFile_JSONProperty.UploadFileName];

                                            if (_link == "") {
                                                AddUserError("The external file / link is required.");
                                            }
                                        }
                                        else {
                                            _file[enColFileProperty.ExternalLink] = null;
                                            _file[enColFileProperty.Name] = _uploadedFile["OriginalFileName"];
                                            _file[enColCEFile_JSONProperty.UploadFileName] = _uploadedFile["UploadFileName"];
                                        }
                                    }
                                    else if ($vwOpenExtLink.hasClass("DeletedItem")) {
                                        _val = null;    //remove the property value related to file ID
                                        _file = null;
                                    }
                                    else {
                                        _val = $input.data("source-prop-value");
                                        _file = null;
                                    }

                                    if (_linkedProp) {
                                        _item[_linkedProp] = _file;
                                    }

                                    if (_isEdit && util_forceInt(_val, enCE.None) != enCE.None) {
                                        _skipReqCheck = true;
                                    }
                                }
                                else if ($input.is("[data-attr-input-data-type]")) {
                                    var _index = util_forceInt($mobileUtil.GetClosestAttributeValue($input, "data-attr-render-field-item-index"), -1);

                                    if (_index >= 0 && _index < _listRenderField.length) {
                                        var _field = _listRenderField[_index];

                                        _val = _controller.Utils.Actions.InputEditorDataType({
                                            "Controller": _controller, "Element": $input,
                                            "IsPrimitiveType": true
                                        });
                                    }
                                }
                                else if ($input.hasClass("LabelReadOnly")) {
                                    _isPropValueSet = true;
                                }

                                var _propConfig = util_arrFilter(_arrProps, "p", _prop, true);

                                if (_propConfig.length == 1) {
                                    _propConfig = _propConfig[0];

                                    if (!_skipReqCheck && util_forceBool(_propConfig["req"], false) &&
                                        (
                                         (!_linkedProp && (_val === "" || util_isNullOrUndefined(_val) || ($.isArray(_val) && _val.length == 0))) ||
                                         (_linkedProp && (_item[_linkedProp] === "" || util_isNullOrUndefined(_item[_linkedProp])))
                                        )
                                        ) {

                                        var _reqMessage = _propConfig["reqMessage"];

                                        if (!_reqMessage) {
                                            _reqMessage = _propConfig.n + " is required.";
                                        }

                                        AddUserError(_reqMessage);
                                    }
                                }

                                if (!_isPropValueSet) {
                                    util_propertySetValue(_item, _prop, _val);
                                }
                            });

                            if (m_editOpts.IsResourceMode()) {

                                //add the current category to be associated to the resource, if applicable
                                var _srcCategoryID = util_forceInt($tbl.data("SourceCategoryID"), enCE.None);

                                if (_srcCategoryID != enCE.None) {
                                    var _resourceCategoryFiles = _item[enColCEEditorResourceProperty.ResourceCategoryFiles];

                                    if (!_resourceCategoryFiles) {
                                        _resourceCategoryFiles = [];
                                        _item[enColCEEditorResourceProperty.ResourceCategoryFiles] = _resourceCategoryFiles;
                                    }

                                    var _currentCategoryResourceFile = util_arrFilter(_resourceCategoryFiles, enColEditorResourceCategoryFileProperty.CategoryID,
                                                                                      _srcCategoryID, true);

                                    if (_currentCategoryResourceFile.length == 0) {
                                        _currentCategoryResourceFile = new CEEditorResourceCategoryFile();
                                        _currentCategoryResourceFile[enColEditorResourceCategoryFileProperty.CategoryID] = _srcCategoryID;

                                        _resourceCategoryFiles.push(_currentCategoryResourceFile);
                                    }
                                }
                            }

                            if (args.Callback) {
                                args.Callback(_item);
                            }
                        });

                        $tbl.off("events.save");
                        $tbl.on("events.save", function (e, args) {

                            e.stopPropagation();    //must prevent any parent event handlers of this namespace from executing

                            args = util_extend({ "Callback": null }, args);

                            ClearMessages();

                            var _entityItem = $tbl.data("DataItem");

                            $tbl.trigger("events.populateItem", {
                                "Item": _entityItem, "Callback": function () {

                                    if (MessageCount() == 0) {

                                        if (m_editOpts.IsCategoryMode()) {
                                            _entityItem[enColCEEditorResourceCategory_JSONProperty.DeepSaveDisplayOrderPlatformID] = enCE.None;

                                            if (util_forceInt(_entityItem[m_editOpts.PropertyIdentifier], enCE.None) == enCE.None) {
                                                var _currentPlatformID = util_forceInt($mobileUtil.GetClosestAttributeValue($tbl, "data-home-editor-group-platform-id"),
                                                                                                                            enCE.None);

                                                _entityItem[enColCEEditorResourceCategory_JSONProperty.DeepSaveDisplayOrderPlatformID] = _currentPlatformID;
                                            }
                                        }

                                        var _saveParams = {
                                            "_EditorGroupID": _controller.Utils.ContextEditorGroupID($tbl),
                                            "Item": util_stringify(_entityItem), "DeepSave": true
                                        };

                                        _controller.Utils.Actions.SaveEntity({
                                            "Controller": _controller, "LayoutManager": options.LayoutManager, "Trigger": $tbl,
                                            "IsAppService": true,
                                            "Params": {
                                                "c": "PluginEditor", "m": m_editOpts.MethodNameSaveItem,
                                                "args": _saveParams
                                            },
                                            "OnSuccess": function (saveItem) {

                                                //for each temp upload file item, remove it from cleanup (as it no longer exists from deep save of file)
                                                var _uploads = ($container.data("uploads-cleanup") || {});
                                                var _arrTempFile = [];

                                                if (m_editOpts.IsResourceMode()) {
                                                    _arrTempFile.push(saveItem[enColCEEditorResource_JSONProperty.TempFileItem]);
                                                    _arrTempFile.push(saveItem[enColCEEditorResource_JSONProperty.TempThumbnailFileItem]);
                                                }

                                                for (var i = 0; i < _arrTempFile.length; i++) {
                                                    var _fileItem = _arrTempFile[i];

                                                    if (_fileItem && util_forceString(_fileItem[enColCEFile_JSONProperty.UploadFileName]) != "") {
                                                        var _uploadFileName = _fileItem[enColCEFile_JSONProperty.UploadFileName];

                                                        delete _uploads[_uploadFileName];
                                                    }
                                                }

                                                if (args.Callback) {
                                                    args.Callback(saveItem, m_editOpts);
                                                }
                                            }
                                        });

                                    }
                                }
                            });

                            return false;   //must prevent any parent event handlers of this namespace from executing

                        }); //end: events.save

                        $btn.trigger("events.toggleOverlay", { "IsEnabled": true, "Message": "Loading..." });

                        var _paramsLoad = {
                            "_EditorGroupID": _controller.Utils.ContextEditorGroupID($btn),
                            "DeepLoad": true
                        };

                        if (m_editOpts.IsCategoryMode()) {
                            _controller.Utils.BindFlipSwitchEvents({ "Element": $container.find(".ViewComponentToggles") });

                            _paramsLoad["CategoryID"] = _itemID;
                        }
                        else if (m_editOpts.IsResourceMode()) {
                            _paramsLoad["ResourceID"] = _itemID;
                        }

                        APP.Service.Action({
                            "c": "PluginEditor", "m": m_editOpts.MethodNameLoadItem,
                            "args": _paramsLoad
                        }, function (dataItem) {

                            var _entityItem = (dataItem || {});
                            var _isAddNew = (_itemID == enCE.None);

                            if (!_isAddNew && util_forceInt(_entityItem[m_editOpts.PropertyIdentifier], enCE.None) == enCE.None) {

                                //item no longer available or is invalid
                                $tbl.addClass("EffectBlur")
                                    .toggle("height", function () {
                                        $container.html("<div class='LabelError'>" +
                                                        util_htmlEncode(m_editOpts.EntityDisplayName + " is no longer available or invalid. " +
                                                                        "Please return to selection view and try again.") +
                                                        "</div>");
                                    });

                                $tbl = null;
                            }
                            
                            var _currentPlatformID = util_forceInt($mobileUtil.GetClosestAttributeValue($tbl, "data-home-editor-group-platform-id"), enCE.None);

                            if (_isAddNew && m_editOpts.IsResourceMode()) {

                                var _resourcePlatforms = (_entityItem[enColCEEditorResourceProperty.ResourcePlatforms] || []);
                                var _search = util_arrFilter(_resourcePlatforms, enColEditorResourcePlatformProperty.PlatformID, _currentPlatformID, true);

                                if (_search.length == 0) {
                                    var _resourcePlatform = new CEEditorResourcePlatform();

                                    _resourcePlatform[enColEditorResourcePlatformProperty.PlatformID] = _currentPlatformID;

                                    _resourcePlatforms.push(_resourcePlatform);

                                    _entityItem[enColCEEditorResourceProperty.ResourcePlatforms] = _resourcePlatforms;
                                }
                            }

                            if ($tbl) {

                                $tbl.data("DataItem", _entityItem);

                                m_editOpts.Init(function () {

                                    $tbl.trigger("events.bind", {
                                        "Callback": function () {

                                            $btn.trigger("events.toggleOverlay", { "IsEnabled": false });
                                        }
                                    });

                                });                                
                            }
                            else {

                                if (options.LayoutManager) {
                                    options.LayoutManager.ToolbarSetButtons({ "IsClear": true, "ExcludeButtons": ["dismiss"] });
                                }

                                $btn.trigger("events.toggleOverlay", { "IsEnabled": false });
                            }

                        });
                    }
                });

                break;  //add / edit category

            case "save_category":
            case "delete_category":
            case "save_resource":
            case "delete_resource":
            case "delete_categoryResourceFile":

                var $vw = null;

                if (_isPopupMode) {
                    $vw = $(options.Parent).find(".EditorAdminEditTable");
                }
                else {
                    $vw = $btn.closest(".EditorResourceCategoryDetail");
                }

                if (options.ButtonID == "save_category" || options.ButtonID == "save_resource") {

                    $vw.trigger("events.save", {
                        "Callback": function (saveItem, editOpts) {

                            AddMessage(editOpts.EntityDisplayName + " has been successfully saved.");

                            setTimeout(function () {

                                _controller.ActiveEmbeddedView().addClass("EditorResourceTransitionDismiss");

                                //dismiss the popup
                                _controller.Utils.Actions.ToggleEditView({
                                    "Controller": _controller, "Trigger": $btn, "IsEnabled": false, "Callback": function () {

                                        _controller.ActiveEmbeddedView().trigger("events.refreshOnPopupDismiss", { "Controller": _controller });
                                    }
                                });

                            }, 1000);
                        }
                    });
                }
                else if (options.ButtonID == "delete_category" || options.ButtonID == "delete_resource" || options.ButtonID == "delete_categoryResourceFile") {

                    var _deleteOptions = {
                        "ConfirmTitle": "",
                        "ConfirmMessage": "",
                        "ConfirmIsHTML": false,
                        "OnSuccessMessage": "Item has been successfully deleted.",
                        "MethodName": null,
                        "Params": {}
                    };

                    switch (options.ButtonID) {

                        case "delete_category":

                            _deleteOptions.ConfirmTitle = "Delete Category";
                            _deleteOptions.ConfirmMessage = "Are you sure you want to permanently delete the category?";
                            _deleteOptions.MethodName = "EditorResourceCategoryDelete";
                            _deleteOptions.OnSuccessMessage = "Category has been successfully deleted.";

                            break;

                        case "delete_resource":

                            _deleteOptions.ConfirmIsHTML = true;
                            _deleteOptions.ConfirmTitle = util_htmlEncode("Delete Market Access Tool / Resource");
                            _deleteOptions.ConfirmMessage = "<div>" + util_htmlEncode("Are you sure you want to permanently delete the Market Access Tool / Resource?") +
                                                            "</div>" +
                                                            "<br />" +
                                                            "<b>WARNING:</b>" +
                                                            util_htmlEncode(" this will also delete the Market Access Tool / Resource from all associated categories.");
                            _deleteOptions.MethodName = "EditorResourceDelete";
                            _deleteOptions.OnSuccessMessage = "Market Access Tool / Resource has been successfully deleted.";

                            break;

                        case "delete_categoryResourceFile":

                            _deleteOptions.ConfirmTitle = "Remove Market Access Tool / Resource";
                            _deleteOptions.ConfirmMessage = "Are you sure you want to remove the Market Access Tool / Resource from the current category?";
                            _deleteOptions.MethodName = "EditorResourceCategoryFileDelete";
                            _deleteOptions.OnSuccessMessage = "Market Access Tool / Resource has been removed from the category.";

                            break;
                    }

                    dialog_confirmYesNo(_deleteOptions.ConfirmTitle, _deleteOptions.ConfirmMessage, function () {

                        var _deleteEntityItem = null;
                        var _fnOnDeleted = null;

                        if (_isPopupMode) {
                            _deleteEntityItem = $vw.data("DataItem");
                        }
                        else if (options.ButtonID == "delete_category") {

                            var _categoryID = util_forceInt($vw.attr("data-attr-editor-resource-category-id"), enCE.None);
                            var $parent = $vw.closest(".EditorDraggableContainer");
                            var _lookupCategory = ($parent.data("lookup-category") || {});
                            
                            _deleteEntityItem = _lookupCategory[_categoryID];

                            _fnOnDeleted = function () {
                                delete _lookupCategory[_categoryID];

                                $vw.addClass("DeletedItem")
                                   .removeAttr("data-attr-editor-resource-category-id")
                                   .toggle("height", function () {
                                       $vw.remove();
                                   });
                            };
                        }
                        else if (options.ButtonID == "delete_categoryResourceFile") {

                            $vw = $btn.closest("[data-attr-editor-resource-id]");

                            var $active = _controller.ActiveEmbeddedView();
                            var _category = ($active.data("Item") || {});

                            var _categoryID = util_forceInt($active.data("EditID"), enCE.None);
                            var _resourceID = util_forceInt($vw.attr("data-attr-editor-resource-id"), enCE.None);

                            _deleteEntityItem = util_arrFilterSubset(_category[enColCEEditorResourceCategoryProperty.EditorResourceCategoryFiles],
                                                                     function (searchItem) {
                                                                         return (searchItem[enColEditorResourceCategoryFileProperty.ResourceID] == _resourceID &&
                                                                                 searchItem[enColEditorResourceCategoryFileProperty.CategoryID] == _categoryID
                                                                                );
                                                                     }, true);

                            _deleteEntityItem = (_deleteEntityItem.length == 1 ? _deleteEntityItem[0] : null);

                            _fnOnDeleted = function () {

                                $vw.addClass("DeletedItem")
                                   .removeAttr("data-attr-editor-resource-id")
                                   .toggle("height", function () {
                                       $vw.remove();
                                   });
                            };

                        }

                        _deleteOptions.Params["_EditorGroupID"] = _controller.Utils.ContextEditorGroupID($vw);
                        _deleteOptions.Params["Item"] = util_stringify(_deleteEntityItem);

                        _controller.Utils.Actions.SaveEntity({
                            "Controller": _controller, "LayoutManager": options.LayoutManager, "Trigger": $vw,
                            "IsAppService": true,
                            "Params": {
                                "c": "PluginEditor",
                                "m": _deleteOptions.MethodName,
                                "args": _deleteOptions.Params
                            },
                            "OnSuccess": function (isDeleted) {

                                if (isDeleted) {
                                    var _msgOptions = null;

                                    if (!_isPopupMode) {
                                        _msgOptions = { "IsTimeout": true, "IsDurationLong": true };
                                    }

                                    AddMessage(_deleteOptions.OnSuccessMessage, null, null, _msgOptions);

                                    if (_fnOnDeleted) {
                                        _fnOnDeleted();
                                    }
                                }

                                setTimeout(function () {

                                    if (_isPopupMode) {

                                        //dismiss the popup
                                        _controller.Utils.Actions.ToggleEditView({ "Controller": _controller, "Trigger": $btn, "IsEnabled": false });
                                    }                                    

                                }, 1000);

                            }
                        });
                    }, null, _deleteOptions.ConfirmIsHTML);
                }
                
                break;  //end: save, delete category/resource

            case "view_category":

                var _categoryID = util_forceInt($mobileUtil.GetClosestAttributeValue($btn, "data-attr-editor-resource-category-id"), enCE.None);

                options.LayoutManager.ToolbarTriggerButton({
                    "ButtonID": "done", "Callback": function () {
                        var $vw = _controller.ActiveEmbeddedView();

                        $vw.trigger("events.resource_viewCategory", { "CategoryID": _categoryID });
                    }
                });

                break;  //end: view_category
        }
    }
};

CEditorResourceController.prototype.GetPlatforms = function (options) {
    var _instance = this;

    var $element = $(_instance.DOM.Element);
    var _editorGroupID = _instance.Utils.ContextEditorGroupID($element);

    var _platforms = $element.data("cache-platforms_" + _editorGroupID);

    options = util_extend({ "Callback": null }, options);

    var _callback = function () {
        if (options.Callback) {
            options.Callback(_platforms);
        }
    };

    if (_platforms) {
        _callback();
    }
    else {

        _instance.PluginInstance.GetData({
            "Type": "PlatformList", "Filters": {
                "FilterEditorGroupID": _editorGroupID,
                "SortColumn": enColPlatformProperty.DisplayOrder
            }
        }, function (dataResult) {

            _platforms = (dataResult && dataResult.Success && dataResult.Data ? dataResult.Data.List : null);
            _platforms = (_platforms || []);

            $element.data("cache-platforms_" + _editorGroupID, _platforms);

            _callback();
        });
    }

};  //end: GetPlatforms

//SECTION START: project specific support

CEditorResourceController.prototype.ResourceRenderOptions = function(options) {
};

CEditorResourceController.prototype.AdminEditDataEvents = function(options) {
};

CEditorResourceController.prototype.ProjectOnGetFilters = function (options) {

    if (options.Callback) {
        options.Callback(null);
    }
};

CEditorResourceController.prototype.ProjectOnGetCategoryItem = function (options) {

    options = util_extend({ "IsEditMode": false, "FilterSelections": null, "Params": null, "Callback": null, "FailureFn": null }, options);

    APP.Service.Action({ "c": "PluginEditor", "m": "EditorResourceCategoryGetByPrimaryKey", "args": options.Params }, options.Callback, options.FailureFn);
};

CEditorResourceController.prototype.ProjectOnGetCategoryList = function (options) {

    options = util_extend({ "IsEditMode": false, "FilterSelections": null, "Params": null, "Callback": null, "FailureFn": null }, options);

    APP.Service.Action({ "c": "PluginEditor", "m": "EditorResourceCategoryGetByForeignKey", "args": options.Params }, options.Callback, options.FailureFn);
};

//SECTION END: project specific support