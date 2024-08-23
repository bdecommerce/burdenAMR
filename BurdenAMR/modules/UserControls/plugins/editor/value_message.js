var enCValueMessageViewMode = { "Selections": 2, "CriteriaDetails": 4, "StatementView": 6, "Claims": 8 };

var CValueMessageController = function (initOpts) {
    var _instance = this;

    initOpts = util_extend({ "IsDisableExtControllerInit": false }, initOpts);

    _instance["DOM"] = {
        "Element": null
    };

    var _utils = pluginEditor_getUtils();

    _instance["Utils"] = util_extend({

        "IsValueMessageForeignType": function (editorForeignTypeID) {
            return (editorForeignTypeID == enCEEditorForeignType.ValueMessageGroup || editorForeignTypeID == enCEEditorForeignType.ValueMessageDynamicGroup);
        },

        "BindContentEditorElement": function (options) {

            options = util_extend({ "Controller": null, "Element": null, "DataItem": null, "DataType": null }, options);

            var _controller = options.Controller;
            var _pluginInstance = _controller.PluginInstance;

            var $element = $(options.Element);
            var _dataItem = options.DataItem;

            var _entityContentList = null;  //bridge table list for entity and content

            var _renderOptions = {
                "ContentTypeID": enCEContentType.Subsection,
                "PropertyEntityContentList": null,
                "PropertyEntityContentItem": null,
                "PropertyEntityModifiedContentList": null,
                "PropertyEntityTempContentID": null,
                "PropertyEntityEditType": null,
                "PropertyEntityDisplayOrder": null,
                "PropertyEntityItemContentID": null,
                "PrototypeEntity": null
            };

            switch (options.DataType) {

                case "statement":

                    _renderOptions.ContentTypeID = enCEContentType.Statement;
                    _renderOptions.PrototypeEntity = CEStatementContent;

                    _renderOptions.PropertyEntityContentList = enColCEStatementProperty.StatementContentList;
                    _renderOptions.PropertyEntityModifiedContentList = enColCEStatement_JSONProperty.ContentList;
                    _renderOptions.PropertyEntityContentItem = enColCEStatementContentProperty.TempContentItem;
                    _renderOptions.PropertyEntityItemContentID = enColStatementContentProperty.ContentID;
                    _renderOptions.PropertyEntityTempContentID = enColCEStatementContentProperty.TempContentID;
                    _renderOptions.PropertyEntityEditType = enColCEStatementContentProperty.EditType;
                    _renderOptions.PropertyEntityDisplayOrder = enColStatementContentProperty.DisplayOrder;

                    break;  //end: statement
            }

            _entityContentList = (_dataItem ? _dataItem[_renderOptions.PropertyEntityContentList] : null);

            $element.addClass("ViewContentEditorController");

            $element.off("events.render");
            $element.on("events.render", function (e, args) {

                args = util_extend({ "Callback": null }, args);

                $element.data("is-busy", true);

                var $editorList = $element.find("[" + util_renderAttribute("pluginEditor_content") + "]");

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

                        $editor.trigger("events.setContent", { "HTML": _contentHTML, "IsReadOnly": false });    //TODO: permissions for read only

                        setTimeout(function () {
                            _fnPopulate(index + 1, lookupContent);
                        }, (options.IsAnimate ? 100 : 0));

                    }
                    else {

                        $element.removeData("is-busy");

                        if (args.Callback) {
                            args.Callback();
                        }
                    }

                };  //end: _fnPopulate

                _fnPopulate(0, $element.data("data-content-lookup") || {});

            });

            $element.off("events.insertContentEditor");
            $element.on("events.insertContentEditor", function (e, args) {

                e.stopPropagation();    //must prevent any parent event handlers of this namespace from executing

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
                    $element.append($temp);
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

                return false;   //must prevent any parent event handlers of this namespace from executing

            }); //end: events.insertContentEditor

            $element.off("events.setEditMode");
            $element.on("events.setEditMode", function (e, args) {

                args = util_extend({
                    "Controller": null, "PluginInstance": null, "IsEdit": false, "IsRestore": false, "LayoutManager": null, "FilteredList": null, "Trigger": null
                }, args);

                var $list = $(args.FilteredList).filter("[" + util_renderAttribute("pluginEditor_content") + "]");

                if ($list.length == 0) {
                    $list = $element.find("[" + util_renderAttribute("pluginEditor_content") + "]");
                }

                if (args.IsRestore) {

                    //remove all the temporary created editors that are not yet saved
                    var $tempEditors = $element.find("[" + util_renderAttribute("pluginEditor_content") + "]" + "[data-attr-home-editor-temp-content-id]");

                    $list = $list.not($tempEditors);
                    $tempEditors.remove();
                }

                var _fn = function (index) {

                    if (index < $list.length) {
                        var $currentEditor = $($list.get(index));

                        $currentEditor.trigger("events.setEditable", {
                            "IsRestore": args.IsRestore,
                            "IsEditable": args.IsEdit,
                            "Callback": function () {

                                setTimeout(function () {
                                    _fn(index + 1);
                                }, 100);
                            }
                        });
                    }
                    else {
                        $element.trigger("events.toggleOverlay", { "IsEnabled": false });
                    }

                };  //end: _fn

                $element.trigger("events.toggleOverlay", { "IsEnabled": true });

                if (args.IsEdit && $list.length == 0) {

                    $element.trigger("events.insertContentEditor", {
                        "Callback": function () {

                            $list = $element.find("[" + util_renderAttribute("pluginEditor_content") + "]");
                            _fn(0);
                        }
                    });
                }
                else {
                    _fn(0);
                }

            }); //end: events.setEditMode

            $element.off("events.populateItem");
            $element.on("events.populateItem", function (e, args) {

                args = util_extend({ "Item": null, "Callback": null, "IsContinueEdit": false }, args);

                if (!args.Item) {
                    args.Item = {};
                }

                var _item = args.Item;

                var _callback = function () {
                    if (args.Callback) {
                        args.Callback(_item);
                    }
                };

                var $editors = $element.find("[" + util_renderAttribute("pluginEditor_content") + "]");
                var _prevEntityContentList = $element.data("SourceEntityContentList");
                var _arrEntityContentList = [];
                var _arrUpdatedContentList = [];

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

                            var _entityContent = null;
                            var _editorContentItem = $editor.data("DataItem");

                            if (!_editorContentItem) {
                                _editorContentItem = new CEContent_JSON();
                            }

                            if (!_isTemp) {

                                //find existing data item
                                var _searchContentID = util_forceInt($editor.attr("data-attr-home-editor-content-id"), enCE.None);

                                _entityContent = util_arrFilter(_prevEntityContentList, _renderOptions.PropertyEntityItemContentID, _searchContentID, true);
                                _entityContent = (_entityContent.length == 1 ? _entityContent[0] : null);
                            }

                            if (!_entityContent) {
                                if (_renderOptions.PrototypeEntity) {
                                    _entityContent = new _renderOptions.PrototypeEntity();
                                }
                                else {
                                    _entityContent = {};
                                }
                            }

                            _entityContent[_renderOptions.PropertyEntityEditType] = (_isDeleted ? enCEEditType.Delete : enCEEditType.Update);

                            _editorContentItem[enColContentProperty.ContentTypeID] = _renderOptions.ContentTypeID;

                            if (_isTemp) {

                                //set the temp content ID and configure the default content item properties
                                var _tempContentID = util_forceInt($editor.attr("data-attr-home-editor-temp-content-id"), enCE.None);

                                _editorContentItem[enColCEContent_JSONProperty.TempContentID] = _tempContentID;
                                _entityContent[_renderOptions.PropertyEntityTempContentID] = _tempContentID;
                            }
                            else {
                                _entityContent[_renderOptions.PropertyEntityTempContentID] = enCE.None;
                            }

                            //associate the content item to the entity item only if it is being deleted
                            _entityContent[_renderOptions.PropertyEntityContentItem] = (_isDeleted ? _editorContentItem : null);

                            _arrEntityContentList.push(_entityContent);

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

                                    _entityContent[_renderOptions.PropertyEntityEditType] = (_isModified ? enCEEditType.Update : enCEEditType.NoChange);

                                    if (_isModified) {
                                        _arrUpdatedContentList.push(_editorContentItem);
                                    }

                                    $editor.toggleClass("ContentIsModified", _isModified)
                                           .data("is-modified", true);

                                    if (args.IsContinueEdit && !_isTemp && editMetadata.IsModified) {

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

                        for (var j = 0; j < _arrEntityContentList.length; j++) {
                            var _entityContent = _arrEntityContentList[j];

                            if (_entityContent[_renderOptions.PropertyEntityEditType] != enCEEditType.Delete) {

                                var _currentDisplayOrder = _entityContent[_renderOptions.PropertyEntityDisplayOrder];
                                var _newDisplayOrder = _order++;

                                _entityContent[_renderOptions.PropertyEntityDisplayOrder] = _newDisplayOrder;

                                //check if the editor group content entry has not been modified, but its display order has changed (in which flag it as an update)
                                if (_entityContent[_renderOptions.PropertyEntityEditType] == enCEEditType.NoChange && _newDisplayOrder !== _currentDisplayOrder) {
                                    _entityContent[_renderOptions.PropertyEntityEditType] = enCEEditType.Update;
                                }
                            }
                        }

                        _item[_renderOptions.PropertyEntityContentList] = _arrEntityContentList;
                        _item[_renderOptions.PropertyEntityModifiedContentList] = _arrUpdatedContentList;

                        _callback();

                    }

                };  //end: _fnGetEditorContent

                _fnGetEditorContent(0);

            }); //end: events.populateItem

            $element.off("events.updateViewData");
            $element.on("events.updateViewData", function (e, args) {

                args = util_extend({ "Item": null, "IsContinueEdit": false, "IsCleanup": true }, args);

                var _updateItem = args.Item;

                $element.data("SourceEntityContentList", _updateItem[_renderOptions.PropertyEntityContentList]);

                var _lookupContent = $element.data("data-content-lookup");

                if (!_lookupContent) {
                    _lookupContent = {};
                    $element.data("data-content-lookup", _lookupContent);
                }

                //update data items of all editors (excluding deleted entries and restricted to modified content)
                var $editors = $element.find("[" + util_renderAttribute("pluginEditor_content") + "].ContentIsModified:not(.DeletedItem)");

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
                        _searchProp = _renderOptions.PropertyEntityTempContentID;
                    }
                    else {
                        _searchID = util_forceInt($editor.attr("data-attr-home-editor-content-id"), enCE.None);
                        _searchProp = enColContentProperty.ContentID;
                    }

                    _contentDataItem = util_arrFilter(_updateItem[_renderOptions.PropertyEntityModifiedContentList], _searchProp, _searchID, true);
                    _contentDataItem = (_contentDataItem.length == 1 ? _contentDataItem[0] : null);

                    if (_contentDataItem) {

                        var _contentID = _contentDataItem[enColContentProperty.ContentID];

                        _lookupContent[_contentID] = _contentDataItem;

                        $editor.data("DataItem", _contentDataItem);

                        if (_isTemp) {

                            //remove the temp content ID and update data attributes to the newly created content ID
                            $editor.trigger("events.removeTempState", {
                                "ContentID": _contentID, "IsForceRefresh": (args.IsContinueEdit == true)
                            });

                            //cleanup the temp properties of the data item
                            _contentDataItem[enColCEContent_JSONProperty.TempContentID] = enCE.None;
                        }
                    }
                });

                if (args.IsCleanup) {

                    //remove the deleted editors
                    var $deletedEditors = $element.find(".DeletedItem[" + util_renderAttribute("pluginEditor_content") + "]");

                    $deletedEditors.remove();
                }

            }); //end: events.updateViewData

            var _html = "";

            _entityContentList = (_entityContentList || []);

            var _lookupContent = {};

            for (var i = 0; i < _entityContentList.length; i++) {
                var _entityContentItem = _entityContentList[i];
                var _contentID = _entityContentItem[_renderOptions.PropertyEntityItemContentID];

                _html += "<div " + util_renderAttribute("pluginEditor_content") + " " +
                         util_htmlAttribute(DATA_ATTR_CONTROL_EDITOR_IS_INLINE_EDITABLE, enCETriState.No) + " " +
                         util_htmlAttribute("data-attr-home-editor-content-id", _contentID) + ">" +
                         "  <div class='ContentPlaceholder' />" +
                         "</div>";

                _lookupContent[_contentID] = _entityContentItem[_renderOptions.PropertyEntityContentItem];
            }

            $element.data("data-content-lookup", _lookupContent)
                    .data("SourceEntityContentList", _entityContentList);

            $element.html(_html);

        },  //end: BindContentEditorElement

        "BindReferenceFileListElement": function (options) {

            options = util_extend({ "Controller": null, "Element": null, "DataItem": null, "DataType": null }, options);

            var _controller = options.Controller;
            var _pluginInstance = _controller.PluginInstance;

            var $element = $(options.Element);
            var _dataItem = options.DataItem;
            var _html = "";

            _html += "<a id='support_documents' name='support_documents' />" +
                     "<div class='DisableUserSelectable TableBlockRow EditorReferenceFile TitleRow'>" +
                     "  <div class='TableBlockCell Title'>" + util_htmlEncode("Supporting Documents") + "</div>" +
                     "  <div class='TableBlockCell_C2'>" +
                     "      <div class='ModeToggleEdit'>" +
                     _controller.Utils.HTML.GetButton({
                         "Content": "Add", "ActionButtonID": "add_statementRefFile", "Attributes": { "data-icon": "plus", "data-iconpos": "right" }
                     }) +
                     "      </div>" +
                     "  </div>" +
                     "</div>";

            _html += "<div class='EditorNoRecordsLabel' style='display: none;'>" + util_htmlEncode("There are no supporting documents available") + "</div>";

            _html += "<div class='EditorDraggableContainer'>";  //open list view tag #1

            if (options.DataType == "statement" && _controller.Data.IsDossierStatementModeRepositoryResource) {

                var _tempID = 1;
                var PROPERTY_TEMP_ID = "_tempID";
                var _dossierCategoryID = _controller.Data.RepositoryResourceController.Data.DefaultDossierSearchCategoryID;

                var _fnGetItemHTML = function (entityBridgeItem) {
                    if (!entityBridgeItem) {
                        entityBridgeItem = new CERepositoryResourceStatement();
                    }

                    var _attrs = util_htmlAttribute("data-attr-resource-id", entityBridgeItem[enColRepositoryResourceStatementProperty.ResourceID]);

                    var _fileURL = _controller.Utils.ConstructDownloadURL({
                        "TypeID": "editor", "IsResourceMode": true, "Item": entityBridgeItem,
                        "Property": enColRepositoryResourceStatementProperty.ResourceID
                    });

                    var _itemHTML = "";
                    var _name = util_forceString(entityBridgeItem[enColRepositoryResourceStatementProperty.Name]);
                    var _label = util_forceString(entityBridgeItem[enColRepositoryResourceStatementProperty.ResourceDisplayTitle]);

                    if (_label == "") {
                        _label = entityBridgeItem[enColRepositoryResourceStatementProperty.ResourceIDName];
                    }

                    _attrs += " " + util_htmlAttribute("data-attr-resource-display-title", _label, null, true);

                    var _hasOverrideName = (_name != "");

                    if (_hasOverrideName) {
                        _label = _name;
                    }

                    _attrs += " " + util_htmlAttribute("data-attr-resource-override-name", _name) +
                              " " + util_htmlAttribute("data-attr-resource-has-name-specified", _hasOverrideName ? enCETriState.Yes : enCETriState.No);

                    _itemHTML = "<div class='DisableUserSelectable EditorEntityItem TableBlockRow EditorReferenceFile' " + _attrs + ">" +
                                "  <div class='TableBlockCell Title'>" +
                                "      <div class='DisplayName'>" + util_htmlEncode(_label) + "</div>" +
                                "      <div class='HiddenDragElement'>" +
                                _controller.Utils.HTML.GetButton({
                                    "Content": "Add to Export", "CssClass": "ModeToggleHidden LinkDisabled", "Attributes": {
                                        "data-icon": "plus"
                                    }
                                }) +
                                _controller.Utils.HTML.GetButton({
                                    "IsHTML": true,
                                    "Content": "<div class='EditorImageButton ImageDownloadFile'>" +
                                               "    <div class='ImageIcon' />" + 
                                               "</div>" +
                                               "<div class='Label'>" + util_htmlEncode("Download") + "</div>",
                                    "LinkURL": _fileURL, "CssClass": "EditorDownloadIconLink"
                                }) +
                                _controller.Utils.HTML.GetButton({
                                    "Content": "View Details", "Attributes": {
                                        "data-icon": "arrow-r", "data-attr-resource-statement-view": enCETriState.Yes
                                    }
                                }) +
                                "      </div>" +
                                "  </div>" +
                                "  <div class='TableBlockCell_C2' />" +
                                "</div>";

                    return _itemHTML;

                };  //end: _fnGetItemHTML

                var _fnGetPopulatedResource = function (resource, dataCallback) {

                    //retrieve the resource (with populated fields)
                    APP.Service.Action({
                        "c": "PluginEditor", "m": "RepositoryResourceUserViewList", "args": {
                            "BaseRepositoryCategoryID": _dossierCategoryID,
                            "FilterResourceID": resource[enColRepositoryResourceProperty.ResourceID],
                            "PageSize": 1,
                            "PageNum": 1
                        }
                    }, function (result) {
                        result = (result ? result.List : null);

                        var _resource = (result && result.length == 1 ? result[0] : null);

                        if (_resource) {
                            var _resourceStatement = new CERepositoryResourceStatement();
                            var _mappings = {};

                            _mappings[enColRepositoryResourceStatementProperty.ResourceID] = enColRepositoryResourceProperty.ResourceID;

                            //map the name to both resource ID name and the display title
                            _mappings[enColRepositoryResourceStatementProperty.ResourceIDName] = enColRepositoryResourceProperty.Name;
                            _mappings[enColRepositoryResourceStatementProperty.ResourceDisplayTitle] = enColRepositoryResourceProperty.Name;

                            for (var _prop in _mappings) {
                                var _val = util_propertyValue(_resource, _mappings[_prop]);

                                util_propertySetValue(_resourceStatement, _prop, _val);
                            }

                            dataCallback({ "BridgeItem": _resourceStatement, "Resource": _resource });
                        }
                    });

                };  //end: _fnGetResourceFromID

                var _statementResources = _dataItem[enColCEStatementProperty.StatementResources];

                if (!_statementResources) {
                    _statementResources = [];
                    _dataItem[enColCEStatementProperty.StatementResources] = _statementResources;
                }

                for (var i = 0; i < _statementResources.length; i++) {
                    var _statementResource = _statementResources[i];

                    _html += _fnGetItemHTML(_statementResource);
                }

                $element.data("DataSource", _statementResources);

                var _componentID = _controller.Utils.ContextEditorGroupComponentID($element);

                $element.off("events.processButtonClick");
                $element.on("events.processButtonClick", function (e, args) {

                    var _btnID = args.ButtonID;
                    var $btn = $(args.Trigger);
                    var $refFile = (_btnID != "add_statementRefFile" ? $btn.closest(".EditorReferenceFile") : null);
                    var _id = ($refFile ? util_forceInt($refFile.attr("data-attr-item-bridge-id"), enCE.None) : enCE.None);
                    var _isTemp = (_id == enCE.None);

                    switch (_btnID) {

                        case "add_statementRefFile":

                            var _fnAddItem = function (item, opts) {

                                opts = util_extend({ "Item": null }, opts);

                                opts.Item = item;

                                $element.trigger("events.addNewDataItem", opts);
                            };

                            var _opts = {
                                "CategoryID": _dossierCategoryID,
                                "IsHideScrollbar": true,
                                "IsMultiSelect": true,
                                "IsRestrictDocumentTypeFilter": true,
                                "ListDisableSelectionID": [],
                                "Events": {
                                    "OnConfigureParams": function (params) {
                                        params["ComponentID"] = _componentID;
                                    },
                                    "OnSave": function (opts) {

                                        opts = util_extend({ "List": null }, opts);

                                        var _selections = (opts.List || []);

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
                                    "Instance": CERepositoryResourceStatement,
                                    "PropertyID_Name": enColRepositoryResourceStatementProperty.ResourceIDName,
                                    "PropertyValue": enColRepositoryResourceStatementProperty.ResourceID,
                                    "ParentPropertyText": enColRepositoryResourceProperty.Name
                                },
                                "AddActionOptions": {
                                    "DocumentTypes": "%%TOK|ROUTE|PluginEditor|FilteredComponentRepositoryDocumentTypes|{ Key: \"value_message_statement\" }%%",
                                    "OnSaveCallback": function (opts) {

                                        var _resource = opts.Item;

                                        if (_resource && util_forceInt(_resource[enColRepositoryResourceProperty.ResourceID], enCE.None) != enCE.None) {

                                            $mobileUtil.ActivePage()
                                                       .removeData(_controller.Data.RepositoryResourceController.Data.DATA_KEY_SCROLL_TOP);

                                            _fnGetPopulatedResource(_resource, function (dataOpts) {
                                                _fnAddItem(dataOpts.BridgeItem);
                                            });
                                        }
                                    }
                                },
                                "Callback": function () {
                                    if (args["Callback"]) {
                                        args.Callback();
                                    }
                                }
                            };

                            $.each($element.find(".EditorReferenceFile[data-attr-resource-id]"), function () {
                                var _id = util_forceInt($(this).attr("data-attr-resource-id"), enCE.None);

                                _opts.ListDisableSelectionID.push(_id);
                            });

                            _controller.Data.RepositoryResourceController.PopupSearchResource(_opts);

                            break;  //end: add_statementRefFile

                        case "edit_statementRefFile":
                        case "save_statementRefFile":

                            var _isEditButton = (_btnID == "edit_statementRefFile");

                            var _fnToggleButtons = function () {
                                $refFile.toggleClass("EditorEntityEditMode", _isEditButton);

                                var $btns = $refFile.find("[data-attr-editor-controller-action-btn='save_statementRefFile'], " +
                                                          "[data-attr-editor-controller-action-btn='edit_statementRefFile']");

                                $btns.filter("[data-attr-editor-controller-action-btn='save_statementRefFile']").toggle(_isEditButton);
                                $btns.filter("[data-attr-editor-controller-action-btn='edit_statementRefFile']").toggle(!_isEditButton);

                            };  //end: _fnToggleValueMessageButtons

                            if (!$refFile.data("is-init-edit-inputs")) {
                                $refFile.data("is-init-edit-inputs", true);

                                var $vwTitle = $refFile.find(".TableBlockCell.Title");
                                var $temp = null;

                                $temp = $("<div class='ModeToggleEntityView EditorEntityInputRow'>" +
                                          " <input class='DisableDragElement' type='text' " +
                                          util_htmlAttribute("data-attr-prop-ref-file", enColRepositoryResourceStatementProperty.Name) +
                                          " placeholder='Supporting Document Title (leave blank to use auto generated title)' />" +
                                          "</div>");

                                $temp.insertAfter($vwTitle.find(".DisplayName"));
                                $temp.trigger("create");
                            }

                            _fnToggleButtons();

                            var $tb = $refFile.find("input[" + util_htmlAttribute("data-attr-prop-ref-file", enColRepositoryResourceStatementProperty.Name) + "]");

                            if (_isEditButton) {

                                var _hasNameSpecified = (util_forceInt($mobileUtil.GetClosestAttributeValue($refFile,
                                                                       "data-attr-resource-has-name-specified"), enCETriState.No) == enCETriState.Yes);

                                var _title = (_hasNameSpecified ? util_forceString($mobileUtil.GetClosestAttributeValue($refFile, "data-attr-resource-override-name")) : "");

                                $tb.val(_title);

                                try {
                                    $tb.trigger("focus");
                                } catch (e) {
                                }
                            }

                            if (args["Callback"]) {
                                args.Callback();
                            }

                            break;  //edit, save ref file

                        case "delete_statementRefFile":
                        case "undoDelete_statementRefFile":

                            _controller.Utils.ProcessDeleteToggleButton({
                                "Trigger": $btn, "ButtonID": _btnID, "ActionDeleteID": "delete_statementRefFile", "ActionUndoID": "undoDelete_statementRefFile",
                                "EntityContextSelector": $refFile,
                                "ConfirmationTarget": null, "EntityName": "Supporting Document", "OnDeleteCallback": function (opts) {

                                    $refFile.find("[data-attr-editor-controller-action-btn='edit_statementRefFile'], " +
                                                  "[data-attr-editor-controller-action-btn='save_statementRefFile']")
                                            .hide();

                                    $refFile.find("[" + util_htmlAttribute("data-attr-prop-ref-file", enColRepositoryResourceStatementProperty.Name) + "]")
                                            .prop("disabled", true);

                                }, "OnUndoCallback": function (opts) {

                                    $refFile.find("[" + util_htmlAttribute("data-attr-prop-ref-file", enColRepositoryResourceStatementProperty.Name) + "]")
                                            .removeAttr("disabled");

                                    var $btns = $refFile.find("[data-attr-editor-controller-action-btn='edit_statementRefFile'], " +
                                                              "[data-attr-editor-controller-action-btn='save_statementRefFile']");
                                    var _isEntityEdit = $refFile.hasClass("EditorEntityEditMode");

                                    $btns.filter("[data-attr-editor-controller-action-btn='edit_statementRefFile']")
                                         .toggle(!_isEntityEdit);

                                    $btns.filter("[data-attr-editor-controller-action-btn='save_statementRefFile']")
                                         .toggle(_isEntityEdit);

                                }, "IsPermanentDelete": false, "HasUndoButton": true
                            });

                            break;  //delete, undo delete ref file
                    }

                });

                $element.off("events.addNewDataItem");
                $element.on("events.addNewDataItem", function (e, args) {

                    args = util_extend({ "Item": null, "IsFocus": true, "Callback": null }, args);

                    var _resourceStatement = args.Item;
                    var _valid = false;
                    var _hasItem = false;
                    var _result = { "Element": null };
                    var _onAddCallback = function () {
                        if (args.Callback) {
                            args.Callback(_result);
                        }
                    };

                    if (_resourceStatement &&
                        (util_forceInt(_resourceStatement[enColRepositoryResourceStatementProperty.ResourceID], enCE.None) != enCE.None)) {

                        //verify that the resource does not already exist as current selections
                        var $search = $element.find(".EditorReferenceFile[" +
                                                    util_htmlAttribute("data-attr-resource-id", _resourceStatement[enColRepositoryResourceStatementProperty.ResourceID]) +
                                                    "]:first");

                        _valid = ($search.length == 0);
                        _hasItem = true;
                    }

                    if (_valid) {
                        var $item = $(_fnGetItemHTML(_resourceStatement));
                        var $container = $element.find(".EditorDraggableContainer:first");

                        $item.hide();
                        $container.append($item);

                        $mobileUtil.refresh($item);

                        $element.trigger("events.refreshNoRecordsMessage");

                        $mobileUtil.ActivePage()
                                   .removeData(_controller.Data.RepositoryResourceController.Data.DATA_KEY_SCROLL_TOP);

                        _result.Element = $item;

                        _controller.ToggleEditMode({
                            "Controller": _controller, "IsEdit": true, "IsUpdate": true, "RestrictUpdateType": "ref_file", "FilteredList": $item,
                            "Callback": function () {

                                if (args.IsFocus) {
                                    $item.toggle("height", function () {
                                        $mobileUtil.AnimateSmoothScroll(null, 500, { "Top": $item.offset().top }, _onAddCallback);
                                    });
                                }
                                else {
                                    $item.show();
                                    _onAddCallback();
                                }
                            }
                        });
                    }
                    else if (_hasItem) {
                        AddUserError("The specified document already exists.", { "IsTimeout": true });
                        _onAddCallback();
                    }

                }); //end: events.addNewDataItem

                $element.off("events.populateItem");
                $element.on("events.populateItem", function (e, args) {

                    args = util_extend({ "FilteredList": null, "Item": null, "Callback": null, "IsContinueEdit": false }, args);

                    if (!args.Item) {
                        args.Item = {};
                    }

                    var _item = args.Item;

                    var _callback = function () {
                        if (args.Callback) {
                            args.Callback(_item);
                        }
                    };

                    var $list = $element.find(".EditorReferenceFile[data-attr-resource-id]:not(.DeletedItem)");
                    var _srcList = ($element.data("DataSource") || []);
                    var _statementResources = [];

                    $.each($list, function (index) {
                        var $this = $(this);
                        var _displayNo = index + 1;
                        var _resourceID = util_forceInt($this.attr("data-attr-resource-id"), enCE.None);
                        
                        var _item = util_arrFilter(_srcList, enColRepositoryResourceStatementProperty.ResourceID, _resourceID, true);

                        if (_item.length == 1) {
                            _item = _item[0];
                        }
                        else {
                            _item = new CERepositoryResourceStatement();
                        }

                        var _hasNameSpecified = (util_forceInt($this.attr("data-attr-resource-has-name-specified"), enCETriState.No) == enCETriState.Yes);

                        _item[enColRepositoryResourceStatementProperty.Name] = (_hasNameSpecified ? util_forceString($this.attr("data-attr-resource-override-name")) : null);
                        _item[enColRepositoryResourceStatementProperty.ResourceID] = _resourceID;
                        _item[enColRepositoryResourceStatementProperty.DisplayOrder] = _displayNo;

                        _statementResources.push(_item);
                    });

                    _item[enColCEStatementProperty.StatementResources] = _statementResources;

                    _callback();

                }); //end: events.populateItem

                $element.off("events.updateDataItem");
                $element.on("events.updateDataItem", function (e, args) {

                    args = util_extend({ "Item": null, "IsContinueEdit": false, "IsCleanup": true, "FilteredList": null }, args);

                    var _dataItem = args.Item;
                    var _statementResources = _dataItem[enColCEStatementProperty.StatementResources];

                    if (!_statementResources && _dataItem) {
                        _statementResources = [];
                        _dataItem[enColCEStatementProperty.StatementResources] = _statementResources;
                    }

                    $element.data("DataSource", _statementResources);

                    if (args.IsCleanup) {

                        //remove the deleted reference files
                        $element.find(".DeletedItem.EditorReferenceFile")
                                .remove();

                        $element.trigger("events.refreshNoRecordsMessage");
                    }
                });

                $element.off("events.onRefreshResourceStatement");
                $element.on("events.onRefreshResourceStatement", ".EditorReferenceFile[data-attr-resource-id]", function (e, args) {

                    args  = util_extend({"Item": null}, args);

                    var $this = $(this);
                    var _resourceStatement = args.Item;

                    if (_resourceStatement) {

                        var _title = util_forceString(_resourceStatement[enColRepositoryResourceStatementProperty.ResourceDisplayTitle]);

                        if (_title == "") {
                            _title = util_forceString(_resourceStatement[enColRepositoryResourceStatementProperty.ResourceIDName]);
                        }

                        $this.attr("data-attr-resource-display-title", _title);

                        var _hasNameSpecified = (util_forceInt($this.attr("data-attr-resource-has-name-specified"), enCETriState.No) == enCETriState.Yes);

                        if (!_hasNameSpecified) {

                            //update the title
                            $this.find(".TableBlockCell.Title .DisplayName:first")
                                 .text(_title);
                        }
                    }

                }); //end: events.onRefreshResourceStatement

                $element.off("click.onReferenceFileResourceDetails");
                $element.on("click.onReferenceFileResourceDetails",
                            ".LinkClickable[" + util_htmlAttribute("data-attr-resource-statement-view", enCETriState.Yes) + "]:not(.LinkDisabled)",
                            function (e, args) {
                                var $this = $(this);
                                var _resourceID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-resource-id"), enCE.None);

                                $this.addClass("LinkDisabled");

                                $element.trigger("events.getComponentUserPermission", {
                                    "Callback": function (permSummary) {

                                        _controller.Data.RepositoryResourceController.PopupEditResource({
                                            "EditID": _resourceID,
                                            "IsViewMode": true,
                                            "ToggleEditButton": (permSummary && permSummary["CanAdmin"] ? true : false),
                                            "IsHideScrollbar": true,
                                            "OnEditSaveCallback": function (opts) {
                                                if (opts && opts["Item"]) {
                                                    var _resource = opts.Item;
                                                    var _resourceID = util_forceInt(_resource[enColRepositoryResourceProperty.ResourceID], enCE.None);

                                                    if (_resourceID != enCE.None) {
                                                        _fnGetPopulatedResource(_resource, function (dataOpts) {

                                                            var $refFile = $element.find(".EditorReferenceFile[" + util_htmlAttribute("data-attr-resource-id", _resourceID) + "]");

                                                            $refFile.trigger("events.onRefreshResourceStatement", { "Item": dataOpts.BridgeItem });
                                                        });
                                                    }
                                                }
                                            },
                                            "Callback": function () {
                                                $this.removeClass("LinkDisabled");
                                            }
                                        });

                                    }
                                });

                            }); //end: click.onReferenceFileResourceDetails

                $element.off("blur.onReferenceFileResourceName");
                $element.on("blur.onReferenceFileResourceName",
                            ".EditorReferenceFile[data-attr-resource-id] input[" +
                            util_htmlAttribute("data-attr-prop-ref-file", enColRepositoryResourceStatementProperty.Name) + "]", function () {
                                var $this = $(this);
                                var _val = util_trim($this.val());
                                var $parent = $this.closest(".EditorReferenceFile");
                                var _hasNameSpecified = (_val != "");

                                $this.val(_val);

                                $parent.attr("data-attr-resource-has-name-specified", _hasNameSpecified ? enCETriState.Yes : enCETriState.No)
                                       .attr("data-attr-resource-override-name", _val);

                                var _title = _val;

                                if (!_hasNameSpecified) {

                                    //use default auto generated title
                                    _title = $mobileUtil.GetClosestAttributeValue($parent, "data-attr-resource-display-title");
                                }

                                var $label = $parent.find(".TableBlockCell.Title .DisplayName:first");

                                $label.text(_title);

                            }); //end: blur.onReferenceFileResourceName
            }
            else {

                //render mode for legacy statement supporting documents

                var _entityBridgeList = null;  //bridge table list for entity and reference file

                var _renderOptions = {
                    "PropertyEntityBridgeList": null,
                    "PropertyEntityFileList": null,
                    "PropertyEntityName": null,
                    "PropertyEntityDisplayOrder": null,
                    "PropertyEntityEditType": null,
                    "PropertyEntityItemBridgeID": null,
                    "PropertyEntityItemBridgeTempID": null,
                    "PropertyEntityItemBridgeTempFile": null,
                    "PrototypeEntity": null
                };

                switch (options.DataType) {

                    case "statement":

                        _renderOptions.PropertyEntityBridgeList = enColCEStatementProperty.StatementReferenceFiles;
                        _renderOptions.PropertyEntityFileList = enColCEStatementProperty.FileList;
                        _renderOptions.PropertyEntityName = enColReferenceFileProperty.Name;
                        _renderOptions.PropertyEntityDisplayOrder = enColReferenceFileProperty.DisplayOrder;
                        _renderOptions.PropertyEntityEditType = enColCEReferenceFile_JSONProperty.EditType;
                        _renderOptions.PropertyEntityItemBridgeID = enColReferenceFileProperty.FileID;
                        _renderOptions.PropertyEntityItemBridgeTempID = enColCEReferenceFile_JSONProperty.TempFileID;
                        _renderOptions.PropertyEntityItemBridgeTempFile = enColCEReferenceFile_JSONProperty.TempFileItem;
                        _renderOptions.PrototypeEntity = CEReferenceFile_JSON;

                        break;  //end: statement
                }

                var _fnGetItemHTML = function (dataItem, isAddNew) {
                    var _entityBridgeItem = dataItem;

                    if (!_entityBridgeItem) {
                        _entityBridgeItem = new _renderOptions.PrototypeEntity();
                    }

                    var _itemAttrID = "";

                    if (isAddNew) {

                        if (util_forceInt(_entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempID], enCE.None) == enCE.None) {
                            _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempID] = _controller.Utils.NextTempID($element);
                        }

                        _itemAttrID = util_htmlAttribute("data-attr-item-temp-bridge-id", _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempID]);
                    }
                    else {
                        _itemAttrID = util_htmlAttribute("data-attr-item-bridge-id", _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeID]);
                    }

                    var _fileURL = _controller.Utils.ConstructDownloadURL({
                        "TypeID": "editor", "Item": _entityBridgeItem, "Property": _renderOptions.PropertyEntityItemBridgeID
                    });

                    var _itemHTML = "<div class='DisableUserSelectable EditorEntityItem TableBlockRow EditorReferenceFile' " + _itemAttrID + ">" +
                                    "  <div class='TableBlockCell Title'>" +
                                    "      <div class='DisplayName'>" + util_htmlEncode(_entityBridgeItem[_renderOptions.PropertyEntityName]) + "</div>" +
                                    "      <div class='ModeToggleView HiddenDragElement'>" +
                                    _controller.Utils.HTML.GetButton({
                                        "Content": "Add to Export", "CssClass": "LinkDisabled", "Attributes": {
                                            "data-icon": "plus"
                                        }
                                    }) +
                                    _controller.Utils.HTML.GetButton({
                                        "Content": "Download", "LinkURL": _fileURL, "Attributes": {
                                            "data-icon": "arrow-r", "data-attr-file-edit-download-link": enCETriState.Yes
                                        }
                                    }) +
                                    "      </div>" +
                                    "  </div>" +
                                    "  <div class='TableBlockCell_C2' />" +
                                    "</div>";

                    return _itemHTML;

                };  //end: _fnGetItemHTML

                _entityBridgeList = (_dataItem ? _dataItem[_renderOptions.PropertyEntityBridgeList] : null);

                $element.off("events.getDataItem");
                $element.on("events.getDataItem", ".EditorReferenceFile", function (e, args) {

                    if (!args["DataItem"]) {
                        args["DataItem"] = {};
                    }

                    if (!args["FileItem"]) {
                        args["FileItem"] = {};
                    }

                    var $trigger = $(args["Trigger"]);

                    if ($trigger.length == 0) {
                        $trigger = $(this);
                    }

                    var $parent = $trigger.closest(".EditorReferenceFile");
                    var _dataItem = $parent.data("DataItem");
                    var _id = enCE.None;

                    if (!_dataItem || args["IsDisableCache"]) {
                        _id = util_forceInt($parent.attr("data-attr-item-bridge-id"), enCE.None);

                        if (_id != enCE.None) {
                            _dataItem = util_arrFilter(args["SearchList"] ? args.SearchList : $element.data("SourceEntityBridgeList"),
                                                       _renderOptions.PropertyEntityItemBridgeID, _id, true);
                            _dataItem = (_dataItem.length == 1 ? _dataItem[0] : null);
                        }
                        else {
                            _dataItem = $parent.data("DataItem");
                        }

                        $parent.data("DataItem", _dataItem);
                    }
                    else {
                        _id = (_dataItem ? _dataItem[_renderOptions.PropertyEntityItemBridgeID] : enCE.None);
                    }

                    //if the item ID does not exist, then use the temp ID
                    if (util_forceInt(_id, enCE.None) == enCE.None && _dataItem) {
                        _id = "tmp_" + _dataItem[_renderOptions.PropertyEntityItemBridgeTempID];
                    }

                    var _lookupFile = ($element.data("lookup-file") || {});

                    args.FileItem = (_lookupFile[_id] ? _lookupFile[_id] : null);
                    args.DataItem = _dataItem;
                });

                $element.off("events.updateFilePreview");
                $element.on("events.updateFilePreview", ".EditorReferenceFile", function (e, args) {

                    args = util_extend({ "File": null, "IsEditMode": false, "PreviewFileURL": null }, args);

                    var $refFile = $(this);
                    var _fileItem = args.File;

                    if (_fileItem) {
                        var _isExternal = _fileItem[enColFileProperty.IsExternal];
                        var $cb = $refFile.find("input[type='checkbox'][" + util_htmlAttribute("data-attr-prop-ref-file", enColFileProperty.IsExternal) + "]");
                        var _isChecked = $cb.prop("checked");
                        var $vw = $refFile.find(".ReferenceFileExternalLinkToggle");
                        var $vwCurrent = $vw.filter("[" + util_htmlAttribute("data-attr-toggle-is-checked", _isExternal ? enCETriState.Yes : enCETriState.No) + "]");

                        if (_isExternal) {
                            $vw.not($vwCurrent).empty();
                        }
                        else {

                            $vwCurrent.html(util_htmlEncode(_fileItem[enColFileProperty.Name]) + "&nbsp;" +
                                            _controller.Utils.HTML.GetButton({
                                                "Content": "Download", "LinkURL": args.PreviewFileURL,
                                                "Attributes": { "data-icon": "arrow-r" }
                                            })
                                           )
                                      .trigger("create");

                            $refFile.data("upload-preview-url", args.PreviewFileURL);
                        }

                        if (_isExternal != _isChecked) {
                            $cb.prop("checked", _isExternal)
                               .trigger("change")
                               .checkboxradio("refresh");
                        }
                    }
                });

                $element.off("events.populateItem");
                $element.on("events.populateItem", function (e, args) {

                    args = util_extend({ "FilteredList": null, "Item": null, "Callback": null, "IsContinueEdit": false }, args);

                    if (!args.Item) {
                        args.Item = {};
                    }

                    var _item = args.Item;

                    var _callback = function () {
                        if (args.Callback) {
                            args.Callback(_item);
                        }
                    };

                    var $list = (args.FilteredList ? $(args.FilteredList) : $element.find(".EditorDraggableContainer .EditorReferenceFile"));
                    var _srcEntityBridgeList = $element.data("SourceEntityBridgeList");
                    var _srcLookupFile = ($element.data("lookup-file") || {});

                    var _updateEntityBridgeList = [];
                    var _displayOrder = 1;

                    var _lookupEdits = {};
                    var _isValidationMode = (args.FilteredList && $list.length == 1);

                    $.each($list, function (index) {
                        var $refFile = $(this);
                        var _isDeleted = $refFile.hasClass("DeletedItem");
                        var _id = util_forceInt($refFile.attr("data-attr-item-bridge-id"), enCE.None);
                        var _isTemp = (_id == enCE.None);

                        if (!(_isDeleted && _isTemp)) {

                            var _entityBridgeItem = null;

                            if (_id == enCE.None) {

                                //temp item does not exist in the source list, as such retrieve it directly from the element data
                                _entityBridgeItem = $refFile.data("DataItem");
                            }
                            else {

                                _entityBridgeItem = util_arrFilter(_srcEntityBridgeList, _renderOptions.PropertyEntityItemBridgeID, _id, true);
                                _entityBridgeItem = (_entityBridgeItem.length == 1 ? _entityBridgeItem[0] : null);
                            }

                            if (_entityBridgeItem == null) {
                                _entityBridgeItem = new _renderOptions.PrototypeEntity();
                            }

                            _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeID] = _id;

                            if (!_isDeleted) {

                                _entityBridgeItem[_renderOptions.PropertyEntityDisplayOrder] = _displayOrder++;
                                _entityBridgeItem[_renderOptions.PropertyEntityEditType] = enCEEditType.Update;

                                if ($refFile.hasClass("EditorEntityEditMode")) {

                                    var _propUpdates = {};
                                    var _fileItem = null;

                                    if (_id == enCE.None) {
                                        _id = "tmp_" + _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempID];
                                    }

                                    _fileItem = _srcLookupFile[_id];

                                    if (!_fileItem) {
                                        _fileItem = new CEFile_JSON();
                                        _srcLookupFile[_id] = _fileItem;
                                    }

                                    _lookupEdits[index] = { "Item": _entityBridgeItem, "FileItem": _fileItem, "Updates": _propUpdates };

                                    var _name = util_trim($refFile.find("input[" + util_htmlAttribute("data-attr-prop-ref-file",
                                                                                                      enColReferenceFileProperty.Name) + "]").val());
                                    var _isExternal = $refFile.find("input[type='checkbox'][" + util_htmlAttribute("data-attr-prop-ref-file",
                                                                                                                   enColFileProperty.IsExternal) + "]")
                                                              .prop("checked");

                                    _propUpdates[enColReferenceFileProperty.Name] = _name;
                                    _propUpdates[enColFileProperty.IsExternal] = _isExternal;
                                    _propUpdates[enColFileProperty.ExternalLink] = null;

                                    if (_name == "") {
                                        AddUserError("Supporting Document" + (_isValidationMode ? "" : " #" + (index + 1)) + ": title is required.");
                                    }

                                    if (_isExternal) {
                                        var $tbExternalLink = $refFile.find("input[type='text'][" + util_htmlAttribute("data-attr-prop-ref-file",
                                                                                                                       enColFileProperty.ExternalLink) + "]");
                                        var _extLink = util_trim($tbExternalLink.val());

                                        _propUpdates[enColFileProperty.ExternalLink] = _extLink;

                                        $tbExternalLink.val(_extLink);

                                        if (_extLink == "") {
                                            AddUserError("Supporting Document" + (_isValidationMode ? "" : " #" + (index + 1)) + ": external file / link is required.");
                                        }
                                    }
                                }
                                else if ($refFile.data("is-modified")) {

                                    //set the file item since it has been modified
                                    _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempFile] = (_srcLookupFile[_id] || null);
                                }
                            }
                            else {
                                _entityBridgeItem[_renderOptions.PropertyEntityEditType] = enCEEditType.Delete;
                                _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempFile] = (_srcLookupFile[_id] || null);
                            }

                            _updateEntityBridgeList.push(_entityBridgeItem);
                        }
                    });

                    //update the data items with the changes if there are no errors found
                    if (MessageCount() == 0) {
                        for (var _key in _lookupEdits) {
                            var _editEntry = _lookupEdits[_key];
                            var _entityBridgeItem = _editEntry.Item;
                            var _fileItem = _editEntry.FileItem;

                            _fileItem[enColFileProperty.IsExternal] = _editEntry.Updates[enColFileProperty.IsExternal];
                            _fileItem[enColFileProperty.ExternalLink] = _editEntry.Updates[enColFileProperty.ExternalLink];

                            if (_fileItem[enColFileProperty.IsExternal]) {

                                //clear all fields not applicable to the external link (except extension and size, since are required for cleanup when file is saved)
                                _fileItem[enColCEFile_JSONProperty.UploadFileName] = null;
                            }

                            _entityBridgeItem[_renderOptions.PropertyEntityName] = _editEntry.Updates[enColReferenceFileProperty.Name];
                            _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempFile] = _fileItem;
                        }
                    }

                    _item[_renderOptions.PropertyEntityBridgeList] = _updateEntityBridgeList;

                    _callback();

                });

                $element.off("events.updateDataItem");
                $element.on("events.updateDataItem", function (e, args) {

                    args = util_extend({ "Item": null, "IsContinueEdit": false, "IsCleanup": true, "FilteredList": null }, args);

                    var _isFilteredMode = (args.FilteredList != null);

                    var _updateItem = args.Item;
                    var _entityBridgeList = _updateItem[_renderOptions.PropertyEntityBridgeList];
                    var _lookupFile = $element.data("lookup-file");

                    if (!_isFilteredMode) {
                        $element.data("SourceEntityBridgeList", _entityBridgeList);
                    }

                    //update data items of all reference files (excluding deleted entries)
                    var $refFileList = null;

                    if (_isFilteredMode) {
                        $refFileList = $(args.FilteredList).filter(".EditorReferenceFile");
                    }
                    else {
                        $refFileList = $element.find(".EditorDraggableContainer .EditorReferenceFile:not(.DeletedItem)");
                    }

                    var _arrSavedUploads = [];

                    $.each($refFileList, function () {
                        var $refFile = $(this);
                        var _id = util_forceInt($refFile.attr("data-attr-item-bridge-id"), enCE.None);
                        var _entityBridgeItem = null;

                        //check if it was a temp item recently saved (if so, then cleanup the data attributes of the element, file lookup, and configure defaults)
                        if (!_isFilteredMode && _id == enCE.None) {

                            var _prevTempID = util_forceInt($refFile.attr("data-attr-item-temp-bridge-id"), enCE.None);

                            //find the item using the temp ID
                            _entityBridgeItem = util_arrFilter(_entityBridgeList, _renderOptions.PropertyEntityItemBridgeTempID, _prevTempID, true);
                            _entityBridgeItem = (_entityBridgeItem.length == 1 ? _entityBridgeItem[0] : null);

                            //cleanup
                            $refFile.removeAttr("data-attr-item-temp-bridge-id");
                            delete _lookupFile["tmp_" + _prevTempID];
                            _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempID] = enCE.None;

                            //set the ID
                            _id = _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeID];
                            $refFile.attr("data-attr-item-bridge-id", _id);
                        }

                        if (_id == enCE.None) {
                            _entityBridgeItem = $refFile.data("DataItem");
                        }
                        else {
                            var _temp = { "DataItem": null, "IsDisableCache": true, "SearchList": (_isFilteredMode ? _entityBridgeList : null) };

                            $refFile.trigger("events.getDataItem", _temp);

                            _entityBridgeItem = _temp.DataItem;
                        }

                        $refFile.find(".DisplayName")
                                .text(_entityBridgeItem[_renderOptions.PropertyEntityName]);

                        if (_entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempFile]) {

                            var _fileItem = _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempFile];
                            var _fileID = _fileItem[enColFileProperty.FileID];

                            _lookupFile[_fileID] = _fileItem;

                            if (!_isFilteredMode) {

                                //cleanup up properties no longer required

                                var _uploadFileName = util_forceString(_fileItem[enColCEFile_JSONProperty.UploadFileName]);

                                _fileItem[enColCEFile_JSONProperty.UploadFileName] = null;

                                if (_uploadFileName != "") {
                                    _arrSavedUploads.push(_uploadFileName);
                                }
                            }

                            _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempFile] = null;  //clear the temp file item

                            var $clPreview = $refFile.find("a[" + util_htmlAttribute("data-attr-file-edit-preview-link", enCETriState.Yes) + "]");
                            var _href = null;

                            if (_isFilteredMode && _fileItem[enColFileProperty.IsExternal]) {
                                _href = _fileItem[enColFileProperty.ExternalLink];
                            }
                            else if (util_forceString(_fileItem[enColCEFile_JSONProperty.UploadFileName]) != "") {
                                _href = $refFile.data("upload-preview-url");
                            }
                            else {
                                _href = _controller.Utils.ConstructDownloadURL({
                                    "TypeID": "editor", "Item": _entityBridgeItem, "Property": _renderOptions.PropertyEntityItemBridgeID
                                });
                            }

                            if (util_trim(_href) == "") {
                                _href = "javascript: void(0);";
                            }

                            $clPreview.attr("href", _href);

                            if (!args.IsContinueEdit) {
                                $refFile.find("a[" + util_htmlAttribute("data-attr-file-edit-download-link", enCETriState.Yes) + "]")
                                        .attr("href", _href);
                            }
                        }

                        _entityBridgeItem[_renderOptions.PropertyEntityEditType] = enCEEditType.NoChange;
                    });

                    if (!_isFilteredMode && args.IsCleanup) {

                        $refFileList.removeData("is-modified")
                                    .removeData("upload-preview-url");

                        //remove the deleted reference files
                        $element.find(".DeletedItem.EditorReferenceFile")
                                .remove();

                        $element.trigger("events.refreshNoRecordsMessage");
                        $element.trigger("events.uploads_setSavedFiles", { "List": _arrSavedUploads });
                    }

                }); //end: events.updateDataItem

                $element.off("events.processButtonClick");
                $element.on("events.processButtonClick", function (e, args) {

                    var _btnID = args.ButtonID;
                    var $btn = $(args.Trigger);
                    var $refFile = (_btnID != "add_statementRefFile" ? $btn.closest(".EditorReferenceFile") : null);
                    var _id = ($refFile ? util_forceInt($refFile.attr("data-attr-item-bridge-id"), enCE.None) : enCE.None);
                    var _isTemp = (_id == enCE.None);

                    switch (_btnID) {

                        case "add_statementRefFile":

                            var $vwContainer = $element.find(".EditorDraggableContainer");
                            var _entityBridgeItem = new _renderOptions.PrototypeEntity();

                            $refFile = $(_fnGetItemHTML(_entityBridgeItem, true));

                            $vwContainer.append($refFile);

                            //associate the data item to the element (since it is a temp item not yet saved, it will be persisted until changes are commited)
                            $refFile.trigger("events.setDataItem", { "Item": _entityBridgeItem });

                            $mobileUtil.refresh($refFile);

                            $element.trigger("events.refreshNoRecordsMessage");

                            _controller.ToggleEditMode({
                                "Controller": _controller, "IsEdit": true, "IsUpdate": true, "RestrictUpdateType": "ref_file", "FilteredList": $refFile,
                                "Callback": function () {

                                    $refFile.find("[data-attr-editor-controller-action-btn='edit_statementRefFile']")
                                            .trigger("click", {
                                                "Callback": function () {

                                                    $mobileUtil.AnimateSmoothScroll(null, 500, { "Top": $refFile.offset().top }, function () {

                                                        $refFile.find("input[type='text'][" + util_htmlAttribute("data-attr-prop-ref-file",
                                                                                                                 enColReferenceFileProperty.Name) + "]")
                                                                .trigger("focus");

                                                        if (args["Callback"]) {
                                                            args.Callback();
                                                        }

                                                    });
                                                }
                                            });  //end: edit statement click
                                }
                            });

                            break;  //end: add_statementRefFile

                        case "delete_statementRefFile":
                        case "undoDelete_statementRefFile":

                            _controller.Utils.ProcessDeleteToggleButton({
                                "Trigger": $btn, "ButtonID": _btnID, "ActionDeleteID": "delete_statementRefFile", "ActionUndoID": "undoDelete_statementRefFile",
                                "EntityContextSelector": $refFile,
                                "ConfirmationTarget": null, "EntityName": "Supporting Document", "OnDeleteCallback": function (opts) {

                                    $refFile.find("[data-attr-editor-controller-action-btn='edit_statementRefFile'], " +
                                                  "[data-attr-editor-controller-action-btn='save_statementRefFile']")
                                            .hide();

                                    $refFile.find("[" + util_htmlAttribute("data-attr-prop-ref-file", enColReferenceFileProperty.Name) + "]")
                                            .prop("disabled", true);

                                }, "OnUndoCallback": function (opts) {
                                    $refFile.find("[" + util_htmlAttribute("data-attr-prop-ref-file", enColReferenceFileProperty.Name) + "]")
                                            .removeAttr("disabled");

                                    var $btns = $refFile.find("[data-attr-editor-controller-action-btn='edit_statementRefFile'], " +
                                                              "[data-attr-editor-controller-action-btn='save_statementRefFile']");
                                    var _isEntityEdit = $refFile.hasClass("EditorEntityEditMode");

                                    $btns.filter("[data-attr-editor-controller-action-btn='edit_statementRefFile']")
                                         .toggle(!_isEntityEdit);

                                    $btns.filter("[data-attr-editor-controller-action-btn='save_statementRefFile']")
                                         .toggle(_isEntityEdit);

                                }, "IsPermanentDelete": false, "HasUndoButton": true
                            });

                            break;  //end: delete/undoDelete statementRefFile

                        case "edit_statementRefFile":
                        case "save_statementRefFile":

                            var _id = util_forceInt($refFile.attr("data-attr-item-bridge-id"), enCE.None);
                            var _fileUploadControlID = "refFileUpload_";

                            if (_id == enCE.None) {

                                //use the temp ID with prefix string
                                _fileUploadControlID += "tmp_" + util_forceInt($refFile.attr("data-attr-item-temp-bridge-id"), enCE.None);
                            }
                            else {
                                _fileUploadControlID += _id;
                            }

                            var _isEditButton = (_btnID == "edit_statementRefFile");
                            var _opts = { "DataItem": null, "FileItem": null };

                            $refFile.trigger("events.getDataItem", _opts);

                            var _dataItem = _opts.DataItem;

                            var _fnToggleButtons = function () {
                                $refFile.toggleClass("EditorEntityEditMode", _isEditButton);

                                var $btns = $refFile.find("[data-attr-editor-controller-action-btn='save_statementRefFile'], " +
                                                          "[data-attr-editor-controller-action-btn='edit_statementRefFile']");

                                $btns.filter("[data-attr-editor-controller-action-btn='save_statementRefFile']").toggle(_isEditButton);
                                $btns.filter("[data-attr-editor-controller-action-btn='edit_statementRefFile']").toggle(!_isEditButton);

                            };  //end: _fnToggleValueMessageButtons		

                            if (!$refFile.data("is-init-edit-inputs")) {
                                $refFile.data("is-init-edit-inputs", true);

                                var $vwTitle = $refFile.find(".TableBlockCell.Title");
                                var $temp = null;

                                $temp = $("<div class='ModeToggleEntityView EditorEntityInputRow'>" +
                                          " <input class='DisableDragElement' type='text' " +
                                          util_htmlAttribute("data-attr-prop-ref-file", enColReferenceFileProperty.Name) +
                                          " placeholder='Supporting Document Title' />" +
                                          "</div>");

                                $temp.insertAfter($vwTitle.find(".DisplayName"));
                                $temp.trigger("create");

                                $temp = $("<div class='ModeToggleEntityView EditorEntityInputRow'>" +
                                          " <div class='DisableDragElement EditorInputRowCell_R1C2'>" +
                                          _controller.Utils.HTML.FileUploadControl({ "ID": _fileUploadControlID, "Controller": _controller }) +
                                          " </div>" +
                                          " <div class='DisableDragElement EditorInputRowCell_R1C2'>" +
                                          _controller.Utils.HTML.Checkbox({
                                              "Content": "This is an externally located file or link", "Attributes": {
                                                  "data-attr-prop-ref-file": enColFileProperty.IsExternal,
                                                  "data-attr-is-external-link-toggle": enCETriState.Yes
                                              }
                                          }) +
                                          " </div>" +
                                          " <div class='DisableDragElement ReferenceFileExternalLinkToggle' " +
                                          util_htmlAttribute("data-attr-toggle-is-checked", enCETriState.Yes) + " style='display: none;'>" +
                                          "     <input type='text' data-corners='false' data-mini='true' " +
                                          util_htmlAttribute("data-attr-prop-ref-file", enColFileProperty.ExternalLink) + " placeholder='External File / Link' />" +
                                          " </div>" +
                                          " <div class='ReferenceFileExternalLinkToggle' " + util_htmlAttribute("data-attr-toggle-is-checked", enCETriState.No) +
                                          " style='display: none;'>" +
                                          util_htmlEncode("No file has been uploaded") +
                                          " </div>" +
                                          "</div>");

                                _controller.Utils.BindFileUploadEvents({ "Element": $temp.find("#" + _fileUploadControlID), "Parent": $element });

                                $vwTitle.append($temp);
                                $mobileUtil.refresh($temp);
                            }

                            if (_isEditButton) {
                                var $inputs = $refFile.find("input[data-attr-prop-ref-file]");

                                _dataItem = (_dataItem || {});

                                var _fileItem = (_opts.FileItem || {});

                                $.each($inputs, function () {
                                    var $input = $(this);
                                    var _val = "";
                                    var _prop = $input.attr("data-attr-prop-ref-file");

                                    switch (_prop) {

                                        case enColReferenceFileProperty.Name:
                                            _val = _dataItem[_renderOptions.PropertyEntityName];
                                            break;

                                        case enColFileProperty.IsExternal:
                                        case enColFileProperty.ExternalLink:

                                            _val = _fileItem[_prop];

                                            if (_prop == enColFileProperty.IsExternal) {
                                                $input.prop("checked", _val === true)
                                                      .trigger("change")
                                                      .checkboxradio("refresh");

                                                $input = null;
                                            }

                                            break;

                                        default:
                                            $input = null;  //flag that it is not handled
                                            break;
                                    }

                                    if ($input) {
                                        $input.val(_val);
                                    }
                                });

                                _fnToggleButtons();

                                if (args["Callback"]) {
                                    args.Callback();
                                }
                            }
                            else {

                                $refFile.data("is-modified", true);

                                ClearMessages();

                                var _updateItem = {};

                                $refFile.trigger("events.populateItem", {
                                    "FilteredList": $refFile, "Item": _updateItem, "IsContinueEdit": true, "Callback": function () {

                                        if (MessageCount() == 0) {

                                            $refFile.trigger("events.updateDataItem", { "FilteredList": $refFile, "Item": _updateItem, "IsContinueEdit": true });
                                            _fnToggleButtons();
                                        }

                                        if (args["Callback"]) {
                                            args.Callback();
                                        }
                                    }
                                });
                            }

                            break;  //end: edit_statementRefFile, save_statementRefFile
                    }

                });

                $element.off("change.toggleExternalLink");
                $element.on("change.toggleExternalLink",
                            "input[type='checkbox'][" + util_htmlAttribute("data-attr-is-external-link-toggle", enCETriState.Yes) + "]", function (e, args) {
                                var $cb = $(this);
                                var _checked = $cb.prop("checked");
                                var $parent = $cb.closest(".EditorEntityInputRow");
                                var $vw = $parent.find(".ReferenceFileExternalLinkToggle");

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

                $element.off("blur.inputLink");
                $element.on("blur.inputLink", "input[type='text'][" + util_htmlAttribute("data-attr-prop-ref-file", enColFileProperty.ExternalLink) + "]",
                            function (e, args) {
                                var $input = $(this);

                                $input.val(_controller.Utils.ForceValidURL($input.val()));
                            });

                $element.off("events.onFileUploadSuccess");
                $element.on("events.onFileUploadSuccess", function (e, args) {

                    args = util_extend({ "Trigger": null, "OnClearUpload": null, "UploadOptions": null }, args);

                    var $refFile = $(args.Trigger).closest(".EditorReferenceFile");
                    var _opts = { "DataItem": null, "FileItem": null };

                    $refFile.trigger("events.getDataItem", _opts);

                    _opts.FileItem[enColFileProperty.Name] = args.UploadOptions["OriginalFileName"];
                    _opts.FileItem[enColCEFile_JSONProperty.UploadFileName] = args.UploadOptions["UploadFileName"];
                    _opts.FileItem[enColFileProperty.IsExternal] = false;

                    $refFile.trigger("events.updateFilePreview", { "File": _opts.FileItem, "IsEditMode": true, "PreviewFileURL": args.UploadOptions["PreviewFileURL"] });

                    if (args.OnClearUpload) {
                        args.OnClearUpload();
                    }
                });

                $element.off("events.setDataItem");
                $element.on("events.setDataItem", ".EditorReferenceFile", function (e, args) {

                    args = util_extend({ "Item": null }, args);

                    var _entityBridgeItem = args.Item;

                    var $refFile = $(this);
                    var _id = util_forceInt($refFile.attr("data-attr-item-bridge-id"), enCE.None);

                    if (_id == enCE.None) {
                        _id = "tmp_" + util_forceInt($refFile.attr("data-attr-item-temp-bridge-id"), enCE.None);
                    }

                    $refFile.data("DataItem", _entityBridgeItem);

                    //configure the file item, if applicable
                    var _fileLookup = $element.data("lookup-file");

                    if (!_fileLookup[_id]) {

                        var _fileItem = _entityBridgeItem[_renderOptions.PropertyEntityItemBridgeTempFile];

                        if (!_fileItem) {
                            _fileItem = new CEFile_JSON();
                        }

                        _fileLookup[_id] = _fileItem;
                    }

                });

                var _lookupFile = {};

                _entityBridgeList = (_entityBridgeList || []);

                for (var i = 0; i < _entityBridgeList.length; i++) {
                    _html += _fnGetItemHTML(_entityBridgeList[i]);
                }

                var _fileList = (_dataItem ? _dataItem[_renderOptions.PropertyEntityFileList] : null);

                _fileList = (_fileList || []);

                for (var f = 0; f < _fileList.length; f++) {
                    var _file = _fileList[f];
                    var _fileID = _file[enColFileProperty.FileID];

                    _lookupFile[_fileID] = _file;
                }

                $element.data("SourceEntityBridgeList", _entityBridgeList)
                        .data("lookup-file", _lookupFile);

            }   //end: legacy statement supporting documents render mdoe

            $element.off("events.populateEditModeOptions");
            $element.on("events.populateEditModeOptions", function (e, args) {

                args["List"] = $element.find(".TableBlockRow:not(.TitleRow)");
            });

            $element.off("events.refreshNoRecordsMessage");
            $element.on("events.refreshNoRecordsMessage", function () {
                var _hasRecords = ($element.find(".EditorDraggableContainer .EditorReferenceFile").length > 0);

                $element.find(".EditorNoRecordsLabel").toggle(!_hasRecords);
            });

            _html += "</div>";  //close list view tag #1

            $element.addClass("PluginEditorCardView ViewReferenceFileController")
                    .html(_html);

            $element.trigger("events.refreshNoRecordsMessage");

            var $vwDragContainer = $element.find(".EditorDraggableContainer");

            _controller.Utils.Sortable({
                "Controller": _controller, "Containers": $vwDragContainer, "SelectorDraggable": ".EditorEntityItem",
                "DropOptions": {
                    "IsDisableDropEvent": true
                }
            });

            $element.attr(DATA_ATTRIBUTE_RENDER, "pluginEditor_fileDisclaimer");
            $mobileUtil.RenderRefresh($element, true);

        },  //end: BindReferenceFileListElement

        "ContextEditorGroupComponentID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-component-id"), enCE.None);
        },

        "ContextEditorGroupID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-attr-home-editor-group-id"), enCE.None);
        }
    }, _utils);

    _instance["Data"] = {
        "IsDossierStatementModeRepositoryResource": util_forceBool("%%TOK|ROUTE|PluginEditor|IsDossierStatementModeRepositoryResource%%", true),
        "CanToggleQueryDossierStatementModeRepositoryResource": util_forceBool("%%TOK|ROUTE|PluginEditor|CanToggleQueryDossierStatementModeRepositoryResource%%", false),
        "RepositoryResourceController": (initOpts.IsDisableExtControllerInit ? null : new CRepositoryController()) //requires: the repository resource related definition as well
    };

    if (!_instance.Data.IsDossierStatementModeRepositoryResource && _instance.Data.CanToggleQueryDossierStatementModeRepositoryResource){
        _instance.Data.IsDossierStatementModeRepositoryResource = (util_forceInt(util_queryString("mDossierSupportingDocumentsV2"), enCETriState.None) == enCETriState.Yes);
    }

    _instance["PluginInstance"] = null;
    _instance["FileUploadSupportedExt"] = ["jpg", "jpeg", "png", "gif", "doc", "docx", "xlsx", "xls", "xlsm", "ppt", "pptx", "pdf", "txt"];
};

CValueMessageController.prototype.SetRestoreState = function (options) {

    options = util_extend({
        "Callback": null, "Element": null, "RestoreEditorCriteriaID": enCE.None, "RestoreValueMessageID": enCE.None, "RestoreStatementID": enCE.None
    }, options);

    var _callback = function () {
        if (options.Callback) {
            options.Callback();
        }
    };

    var $element = $(options.Element);

    $element.attr("data-attr-restore-editor-criteria-id", options.RestoreEditorCriteriaID)
            .attr("data-attr-restore-value-message-id", options.RestoreValueMessageID)
            .attr("data-attr-restore-statement-id", options.RestoreStatementID);

    _callback();

};  //end: SetRestoreState

CValueMessageController.prototype.Bind = function (options, callback) {

    var _callback = function () {
        if (callback) {
            callback();
        }
    };

    options = util_extend({
        "PluginInstance": null, "LayoutManager": null, "Element": null, "EditorGroupID": enCE.None,
        "OverrideFileUploadSupportedExt": null,
        "IsRefresh": false,
        "HtmlTemplates": {
            "CriteriaDetail": "<div class='%%CSS_CLASS%%' %%ATTR%%>" +
                              "    <div class='Label'>%%NAME%%</div>" +
                              "    <div class='Description'>%%DESCRIPTION%%</div>" +
                              "</div>"
        },
        "AnimationCallback": null
    }, options);

    var _pluginInstance = options.PluginInstance;
    var _controller = this;

    var $element = $(options.Element);

    if (options.OverrideFileUploadSupportedExt && $.isArray(options.OverrideFileUploadSupportedExt) && options.OverrideFileUploadSupportedExt.length > 0) {
        _controller["FileUploadSupportedExt"] = options.OverrideFileUploadSupportedExt;
    }

    if ($element.length == 0) {
        $element = $(_controller.DOM.Element);
    }

    if (!_pluginInstance) {
        _pluginInstance = _controller.PluginInstance;
    }

    if (!$element.data("is-controller-init") || options.IsRefresh) {
        var _isInit = !$element.data("is-controller-init");

        $element.data("is-controller-init", true);

        if (util_forceInt(options.EditorGroupID, enCE.None) == enCE.None) {
            options.EditorGroupID = util_forceInt($element.data("editor-group-id"), enCE.None);
        }

        if (!$element.data("init-events")) {
            $element.data("init-events", true);

            _controller.DOM.Element = $element;
            _controller.PluginInstance = _pluginInstance;

            $element.data("OnNavigateBackRequest", function (request) {

                if (_controller.IsViewCustomBackNavigation()) {
                
                    var _viewMode = _controller.ViewMode();

                    request.IsHandled = true;

                    var $current = $(_controller.DOM.Element);
                    var $parent = $current.closest("[" + util_renderAttribute("pluginEditor_content") + "]");

                    var $target = null; //use null target to use new active element on callback

                    var _newViewMode = enCValueMessageViewMode.Selections;
                    var _activeSelector = null;

                    switch (_viewMode) {

                        case enCValueMessageViewMode.CriteriaDetails:
                            _activeSelector = ".EditorCriteriaDetails";
                            $target = $parent;
                            break;

                        case enCValueMessageViewMode.StatementView:

                            _newViewMode = enCValueMessageViewMode.CriteriaDetails;
                            _activeSelector = ".ViewEditorValueMessageStatement";
                            break;

                        default:
                            $target = $parent;
                            break;
                    }

                    var $active = $current.find(_activeSelector);

                    if ($active.length == 0) {
                        $active = $mobileUtil.Find(_activeSelector);
                    }

                    var _fromViewMode = util_forceInt($active.attr("data-attr-from-view-mode"), enCE.None);

                    $active.removeAttr("data-attr-from-view-mode");

                    //allow overrides for the previous view mode
                    if (_fromViewMode != enCE.None) {
                        var _prev = _newViewMode;

                        _newViewMode = util_forceValidEnum(_fromViewMode, enCValueMessageViewMode, _newViewMode, true);

                        //if a target was specified but the view mode trigger has changed, then set target to dynamically use the active element
                        if ($target != null && _newViewMode != _prev) {
                            $target = null;
                        }
                    }

                    $active.addClass("EffectBlur")
                           .slideUp("normal", function () {
                               $active.removeClass("EffectBlur");

                               $current.attr("data-attr-controller-param-default-view-mode", _newViewMode);

                               //clear the toolbar buttons
                               if (options.LayoutManager) {
                                   options.LayoutManager.ToolbarSetButtons({ "IsClear": true });
                               }

                               _controller.Bind({
                                   "IsRefresh": true, "LayoutManager": options.LayoutManager, "AnimationCallback": function () {

                                       if ($target == null) {
                                           $target = _controller.ActiveElement();
                                       }

                                       $target.slideDown("normal");
                                   }
                               });
                           });
                }

            });

        }

        $element.data("editor-group-id", options.EditorGroupID);

        var _renderOptions = {
            "EditorGroupID": options.EditorGroupID, "Controller": _controller, "LayoutManager": options.LayoutManager, "IsRefresh": options.IsRefresh, "Callback": null,
            "AnimationCallback": options.AnimationCallback
        };
        var _defaultViewMode = util_forceInt($element.attr("data-attr-controller-param-default-view-mode"), enCE.None);
        var _fn = null;

        _renderOptions.Callback = function () {

            if (options.IsRefresh) {
                var _isEditMode = $element.closest(".Content, .ViewModeEdit").is(".ViewModeEdit");

                _controller.ToggleEditMode({
                    "IsEdit": _isEditMode, "Controller": _controller, "PluginInstance": _pluginInstance, "LayoutManager": options.LayoutManager, "Callback": _callback
                });
            }
            else if (_isInit && _defaultViewMode == enCValueMessageViewMode.Selections &&
                     util_forceInt($element.attr("data-attr-restore-editor-criteria-id"), enCE.None) != enCE.None) {

                var _restoreCriteriaID = util_forceInt($element.attr("data-attr-restore-editor-criteria-id"), enCE.None);

                //remove the restored criteria ID attribute
                $element.removeAttr("data-attr-restore-editor-criteria-id");

                var $search = _controller.ActiveElement().find(".LinkClickable[" + util_htmlAttribute("data-attr-editor-criteria-id", _restoreCriteriaID) + "]");

                if ($search.length) {
                    $search.trigger("click.editorCriteriaLoad", {
                        "Callback": function () {

                            var _restoreValueMessageID = util_forceInt($element.attr("data-attr-restore-value-message-id"), enCE.None);
                            var _restoreStatementID = util_forceInt($element.attr("data-attr-restore-statement-id"), enCE.None);

                            $element.removeAttr("data-attr-restore-value-message-id " + "data-attr-restore-statement-id");

                            var $vmDetail = _controller.ActiveElement()
                                                       .find(".EditorValueMessageDetail[" +
                                                             util_htmlAttribute("data-attr-editor-criteria-value-message-id", _restoreValueMessageID) + "]");

                            if ($vmDetail.length) {

                                var $statement = $vmDetail.find(".EditorValueMessageStatements .EditorValueMessageStatement[" +
                                                                util_htmlAttribute("data-attr-editor-value-message-statement-id", _restoreStatementID) + "]");

                                if ($statement.length) {
                                    $statement.trigger("click.view_statement", {
                                        "IsAnimate": false,
                                        "Callback": _callback
                                    });
                                }
                                else {
                                    $mobileUtil.AnimateSmoothScroll(null, null, { "Top": $vmDetail.offset().top }, _callback);
                                }
                            }
                            else {
                                _callback();
                            }

                        }, "IsAnimate": false
                    });
                }
                else {
                    _callback();
                }
            }
            else {
                _callback();
            }
        };

        $element.removeAttr("data-attr-controller-param-default-view-mode");

        if (_defaultViewMode == enCE.None) {
            _defaultViewMode = _controller.ViewMode();
        }

        switch (_defaultViewMode) {

            case enCValueMessageViewMode.CriteriaDetails:
                _fn = function () {
                    _controller.RenderCriteriaDetailView(_renderOptions);
                };
                break;

            case enCValueMessageViewMode.StatementView:
                _fn = function () {
                    _controller.RenderStatementView(_renderOptions);
                };
                break;

            case enCValueMessageViewMode.Claims:
                _fn = function () {
                    _controller.RenderClaimsView(_renderOptions);
                };
                break;

            default:

                _defaultViewMode = enCValueMessageViewMode.Selections;

                _fn = function () {
                    _controller.RenderCriteriaSelections(_renderOptions);
                };
                break;
        }

        _fn();

    }
    else {
        _callback();
    }

};  //end: Bind

CValueMessageController.prototype.ToggleEditMode = function (options) {
    options = util_extend({
        "Controller": null, "PluginInstance": null, "IsEdit": false, "Callback": null, "LayoutManager": null, "FilteredList": null, "Trigger": null
    }, options);

    var _handled = false;
    var _controller = options.Controller;
    var _pluginInstance = (options.PluginInstance ? options.PluginInstance : _controller.PluginInstance);
    var $container = $(_controller.DOM.Element);
    
    if (!options.IsEdit) {
        if (options.LayoutManager) {
            options.LayoutManager.ToolbarSetButtons({
                "IsClear": true
            });
        }
    }

    var _viewMode = _controller.ViewMode();
    var $active = _controller.ActiveElement();

    var $list = null;
    var _toolsHTML = null;
    var _dragHandleHTML = null;
    var _fnConfigureElementEditable = function (obj, btnOptions, fnEditInit, disableDrag) {
        var $obj = $(obj);

        if (!$obj.data("is-mode-init")) {
            $obj.data("is-mode-init", true);

            if (!_toolsHTML) {
                btnOptions = util_extend({ "EditActionID": null, "DeleteActionID": null, "CustomHTML": null, "IsDisplayBlock": false }, btnOptions);

                var _attrRequireLayout = util_htmlAttribute("data-attr-require-layout-manager", enCETriState.Yes);

                _toolsHTML = "<div class='EditorEntityItemActionButtons" + (btnOptions.IsDisplayBlock ? " EditorEntityItemActionBlock" : "") + " ModeToggleEdit'>" +
                             (btnOptions.CustomHTML ? btnOptions.CustomHTML : "") +
                             "  <a data-attr-editor-controller-action-btn='" + btnOptions.EditActionID + "' class='DisableDragElement LinkClickable' " + 
                             "data-role='button' data-icon='edit' data-mini='true' data-inline='true' data-theme='transparent' " + _attrRequireLayout + ">" +
                             util_htmlEncode("Edit") + "</a>" +
                             (btnOptions.DeleteActionID != null ? 
                              "<a data-attr-editor-controller-action-btn='" + btnOptions.DeleteActionID + "' class='DisableDragElement LinkClickable' " + 
                              "data-role='button' data-icon='delete' data-mini='true' data-inline='true' data-theme='transparent' " + _attrRequireLayout + ">" +
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

    var _fnGetFilteredList = function (targetList) {
        var $targetList = $(targetList);
        var $filteredList = (options.FilteredList ? $(options.FilteredList) : null);

        return ($filteredList ? $targetList.filter($filteredList) : $targetList);

    };  //end: _fnGetFilteredList

    var _fnDismissInlineConfirmations = function (obj) {
        $(obj).find(".InlineConfirmButton.NegativeActionButton")
              .trigger("click.dismiss", { "IsAnimate": false });
    };

    var _fnRevertToolbarState = function () {
        if (options["RevertToggleEditState"]) {
            options.RevertToggleEditState();
        }
    };

    if (options.IsEdit) {
        _dragHandleHTML = "<div class='ModeToggleEdit IndicatorDraggable'>" +
                         "   <img alt='' " + util_htmlAttribute("src", "<SITE_URL><IMAGE_SKIN_PATH>buttons/btn_drag.png") + " />" +
                         "</div>";
    }

    if (_viewMode == enCValueMessageViewMode.Selections) {

        //criteria selection list view
        $list = $active.find("[data-attr-editor-criteria-id]");

        if (options.IsEdit) {

            if (options.LayoutManager) {
                options.LayoutManager.ToolbarSetButtons({
                    "IsInsertStart": true,
                    "List": _controller.Utils.HTML.GetButton({
                        "ActionButtonID": "add_editor_criteria", "Content": "Add Criteria",
                        "Attributes": { "data-icon": "plus" }
                    })
                });
            }

            $.each($list, function (indx) {
                var $detail = $(this);

                _fnConfigureElementEditable($detail, { "EditActionID": "edit_editor_criteria", "DeleteActionID": "delete_editor_criteria" }, function () {

                    $.each($detail.children(".Label, .Description"), function (index) {
                        var $lbl = $(this);
                        var _content = "";

                        if ($lbl.is(".Label")) {
                            _content = "Criteria Name:";
                        }
                        else if ($lbl.is(".Description")) {
                            _content = "Criteria Description:";
                        }

                        $((index > 0 ? "<div class='ModeToggleEdit LineDivider' />" : "") +
                          "<div class='ModeToggleEdit LabelEditHeading'>" + util_htmlEncode(_content) + "</div>").insertBefore($lbl);

                        if (index == 0) {
                            var _isEditable = (util_forceInt($detail.attr("data-attr-editor-criteria-is-editable"), enCETriState.None) == enCETriState.Yes);
                            var _canDelete = (util_forceInt($detail.attr("data-attr-editor-criteria-can-delete"), enCETriState.None) == enCETriState.Yes);

                            if (_isEditable) {

                                var $tools = $(_toolsHTML);

                                if (!_canDelete) {
                                    $tools.find("[data-attr-editor-controller-action-btn='delete']")
                                          .remove();
                                }

                                $tools.insertAfter($lbl);
                            }
                        }
                    });

                }); //end call: _fnConfigureElementEditable

            });
        }

        $list.toggleClass("LinkDisabled", options.IsEdit);
    }
    else if (_viewMode == enCValueMessageViewMode.CriteriaDetails) {

        //criteria details view
        var _foreignTypeID = util_forceInt($active.attr("data-attr-current-editor-criteria-foreign-type-id"), enCE.None);

        if (_foreignTypeID == enCEEditorForeignType.ValueMessageGroup) {

            //value message view mode
            $list = _fnGetFilteredList($active.find(".EditorValueMessageDetail"));

            if (options.IsEdit) {

                $list.removeClass("ViewHighlight");

                if (options.LayoutManager) {
                    var _editorCriteria = ($active.data("DataItem") || {});
                    var _btnList = "";

                    if (_editorCriteria[enColEditorCriteriaProperty.EditorForeignTypeID] == enCEEditorForeignType.ValueMessageGroup) {
                        _btnList += _controller.Utils.HTML.GetButton({
                            "ActionButtonID": "add_criteria_vm", "Content": "Add Value Message",
                            "Attributes": { "data-icon": "plus" }
                        });
                    }

                    options.LayoutManager.ToolbarSetButtons({
                        "IsInsertStart": true,
                        "List": _btnList
                    });
                }

                var _editorCriteria = ($active.data("DataItem") || {});
                var _criteriaValueMessageList = (_editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaValueMessages] || []);

                //override with custom tools button HTML
                var _customToolBtnHTML = "<a data-attr-editor-controller-action-btn='save_criteria_vm' class='DisableDragElement LinkClickable' data-role='button' " +
                                         "data-icon='check' data-mini='true' data-inline='true' data-theme='transparent' " +
                                         util_htmlAttribute("data-attr-require-layout-manager", enCETriState.Yes) + " style='display: none;'>" +
                                         util_htmlEncode("Done") + "</a>";

                var _isUpdate = util_forceBool(options["IsUpdate"], false);

                $.each($list, function (indx) {
                    var $detail = $(this);
                    var _criteriaValueMessage = $detail.data("DataItem");

                    if (!_criteriaValueMessage) {
                        var _searchValueMessageID = util_forceInt($detail.attr("data-attr-editor-criteria-value-message-id"), enCE.None);

                        _criteriaValueMessage = util_arrFilter(_criteriaValueMessageList, enColEditorCriteriaValueMessageProperty.ValueMessageID, _searchValueMessageID,
                                                               true);

                        _criteriaValueMessage = (_criteriaValueMessage.length ? _criteriaValueMessage[0] : {});

                        $detail.data("DataItem", _criteriaValueMessage);
                    }

                    var $statements = $detail.find(".EditorValueMessageStatements");

                    _fnConfigureElementEditable($detail,
                                                { "EditActionID": "edit_criteria_vm", "DeleteActionID": "delete_criteria_vmDetail", "CustomHTML": _customToolBtnHTML },
                                                function () {
                                                    $(_toolsHTML).insertAfter($statements);
                                                });

                    if (!_isUpdate) {

                        //only initialize the value message title if it is not an update
                        $detail.find("input[" + util_htmlAttribute("data-attr-item-prop", enColValueMessageProperty.Name) + "]")
                               .val(_criteriaValueMessage[enColEditorCriteriaValueMessageProperty.ValueMessageIDName]);
                    }

                    var _found = false;

                    if (!$statements.data("init-draggable")) {

                        $statements.data("init-draggable", true);

                        $statements.addClass("EditorDraggableContainer");

                        _controller.Utils.Sortable({
                            "Controller": _controller, "Containers": $statements, "SelectorDraggable": ".EditorValueMessageStatement",
                            "DropOptions": {
                                "DataAttributeIdentifier": "data-attr-editor-value-message-statement-id",
                                "PropertyEntityIdentifier": enColValueMessageStatementProperty.StatementID,
                                "PropertyDisplayOrder": enColValueMessageStatementProperty.DisplayOrder,
                                "GetUpdateDataList": function (savedValueMessageStatement) {
                                    var _updateList = savedValueMessageStatement[enColCEValueMessageStatementProperty.ReferencedValueMessageStatements];

                                    //remove the list from data item
                                    savedValueMessageStatement[enColCEValueMessageStatementProperty.ReferencedValueMessageStatements] = null;

                                    return _updateList;
                                },
                                "GetDataItem": function (id, ctx, callCache) {
                                    var $ctx = $(ctx);

                                    if (!callCache || (callCache && !callCache["LookupStatements"])) {

                                        var $vm = $ctx.closest(".EditorValueMessageDetail");
                                        var _lookup = ($active.data("data-vm-lookup") || {});
                                        var _valueMessageItem = _lookup.Get($vm);

                                        if (!callCache) {
                                            callCache = {};
                                        }

                                        callCache["CurrentValueMessage"] = _valueMessageItem;
                                        callCache["LookupStatements"] = {};

                                        var _vmStatements = (_valueMessageItem ? _valueMessageItem[enColCEValueMessageProperty.ValueMessageStatements] : null);

                                        if (_vmStatements) {
                                            for (var s = 0; s < _vmStatements.length; s++) {
                                                var _valueMessageStatement = _vmStatements[s];
                                                var _statementID = _valueMessageStatement[enColValueMessageStatementProperty.StatementID];

                                                callCache.LookupStatements[_statementID] = _valueMessageStatement;
                                            }
                                        }
                                    }

                                    return callCache.LookupStatements[id];

                                }
                            },
                            "OnValidateDropRequest": function (dropRequest) {

                                //allow the drop request to be processed only if the current value message detail is not in entity edit mode
                                dropRequest.IsValid = ($(dropRequest.DropIntoContainer).closest(".EditorValueMessageDetail ").hasClass("EditorEntityEditMode") == false);
                            },
                            "OnDrop": function (dropOptions) {
                                var _currentItem = null;

                                dropOptions.OnSaveSuccess = function (saveItem, updateOpts) {

                                    _currentItem[enColCEValueMessageStatementProperty.ReferencedValueMessageStatements] = null;

                                    var _arrUpdatedStatements = [];

                                    //update the source value message statements
                                    var _lookup = ($active.data("data-vm-lookup") || {});
                                    var _valueMessage = _lookup.Get(saveItem[enColValueMessageStatementProperty.ValueMessageID]);
                                    var _valueMessageStatements = _valueMessage[enColCEValueMessageProperty.ValueMessageStatements];

                                    if (!_valueMessageStatements) {
                                        _valueMessageStatements = [];
                                        _valueMessage[enColCEValueMessageProperty.ValueMessageStatements] = _valueMessageStatements;
                                    }

                                    _arrUpdatedStatements.push(saveItem);

                                    if (updateOpts.ReferenceList) {
                                        for (var r = 0; r < updateOpts.ReferenceList.length; r++) {
                                            _arrUpdatedStatements.push(updateOpts.ReferenceList[r]);
                                        }
                                    }

                                    for (var s = 0; s < _arrUpdatedStatements.length; s++) {
                                        var _valueMessageStatement = _arrUpdatedStatements[s];
                                        var _index = util_arrFilterItemIndex(_valueMessageStatements, function (searchItem) {
                                            return (searchItem[enColValueMessageStatementProperty.StatementID] ==
                                                    _valueMessageStatement[enColValueMessageStatementProperty.StatementID]);
                                        });

                                        if (_index >= 0) {
                                            _valueMessageStatements[_index] = _valueMessageStatement;
                                        }
                                        else {
                                            _valueMessageStatements.push(_valueMessageStatement);
                                        }
                                    }

                                };

                                var _refList = [];
                                var _searchStatementID = util_forceInt($(dropOptions.Element).attr("data-attr-editor-value-message-statement-id"), enCE.None);

                                for (var i = 0; i < dropOptions.SaveList.length; i++) {
                                    var _valueMessageStatement = dropOptions.SaveList[i];

                                    if (_valueMessageStatement[enColValueMessageStatementProperty.StatementID] == _searchStatementID) {
                                        _currentItem = _valueMessageStatement;
                                    }
                                    else {
                                        _refList.push(_valueMessageStatement);
                                    }
                                }

                                _currentItem[enColCEValueMessageStatementProperty.ReferencedValueMessageStatements] = _refList;

                                dropOptions.ForceParseResult = true;
                                dropOptions.SaveMethod = GlobalService.ValueMessageStatementSave;
                                dropOptions.SaveParams = { "Item": _currentItem, "DeepSave": false, "IsSaveReferenceList": true };

                            }
                        });
                    }

                    $.each($statements.find(".EditorValueMessageStatement"), function () {
                        var $statement = $(this);

                        if (!$statement.data("is-mode-init")) {
                            $statement.data("is-mode-init", true);

                            $statement.append(_dragHandleHTML +
                                              "<div class='EditorEntityItemActionButtons ModeToggleEdit'>" +
                                              "  <a data-attr-editor-controller-action-btn='delete_criteria_vms' class='DisableDragElement LinkClickable' " +
                                              "data-role='button' data-icon='delete' data-mini='true' data-inline='true' data-theme='transparent'>" +
                                              util_htmlEncode("Delete") + "</a>" +
                                              "</div>");

                            _found = true;
                        }
                    });

                    if (_found) {
                        $statements.trigger("create");
                    }
                });
            }
            else {

                var _editorCriteria = $active.data("DataItem");                

                $list.find(".EditorValueMessageBadgeView[" + util_renderAttribute("pluginEditor_valueMessageBadge") + "]")
                     .trigger("events.toggleEditMode", { "IsEditable": false, "IsRestoreTag": true });

            }

            $list.toggleClass("LinkDisabled ", options.IsEdit);
            $list.find(".EditorValueMessageStatement.LinkClickable").toggleClass("LinkDisabled", options.IsEdit);

            if (options.IsEdit) {

                var _platforms = $active.data("data-filtered-platforms");

                if (!_platforms) {
                    _handled = true;

                    var _editorGroupDataItem = $active.closest("[data-attr-home-editor-group-id]").data("DataItem");

                    _editorGroupDataItem = (_editorGroupDataItem || {});

                    var _classPlatformID = util_forceInt(_editorGroupDataItem[enColEditorGroupProperty.ClassificationPlatformID], enCE.None);

                    _pluginInstance.GetData({ "Type": "ClassificationPlatformByPrimaryKey", "Filters": { "ID": _classPlatformID } }, function (classPlatformResult) {

                        var _classPlatform = (classPlatformResult && classPlatformResult.Success ? classPlatformResult.Data : null);

                        _pluginInstance.GetData({
                            "Type": "PlatformList", "Filters": {
                                "FilterClassificationID": _classPlatform[enColClassificationPlatformProperty.ClassificationID],
                                "SortColumn": enColPlatformProperty.DisplayOrder
                            }
                        }, function (dataResult) {
                            _platforms = (dataResult && dataResult.Success && dataResult.Data ? dataResult.Data.List : null);
                            _platforms = (_platforms || []);

                            $active.data("data-filtered-platforms", _platforms);

                            if (options.Callback) {
                                options.Callback();
                            }
                        });

                    }); //end: ClassificationPlatformByPrimaryKey
                }
            }
            else {

                //remove all temp criteria value messages (force cleanup first)
                var $tempCriteriaVM = $list.filter("[data-attr-editor-criteria-value-message-temp-id]");

                $tempCriteriaVM.trigger("events.cleanup");
                $tempCriteriaVM.remove();

                //remove all temp statements that were created (only applicable to saved criteria value message, as the temp detail items are deleted)
                $list.filter(".EditorEntityEditMode[data-attr-editor-criteria-value-message-id]")
                     .find(".EditorValueMessageStatement[data-attr-editor-value-message-statement-temp-id]")
                     .remove();

                $list.removeClass("EditorEntityEditMode");

                var $deletedStatements = $list.find(".EditorValueMessageStatement.DeletedItem");

                if ($deletedStatements.length) {
                    var $btns = $deletedStatements.find("a.LinkClickable[data-attr-editor-controller-action-btn]");

                    $deletedStatements.removeClass("DeletedItem EffectStrikethrough");

                    $btns.filter("[data-attr-editor-controller-action-btn='undoDelete_criteria_vms']").hide();
                    $btns.not("[data-attr-editor-controller-action-btn='undoDelete_criteria_vms']").show();
                }

                //check for value message details that may have statements reordered and require to be restored
                $list.filter("[" + util_htmlAttribute("data-attr-has-statements-order-change", enCETriState.Yes) + "]")
                     .trigger("events.statementsOrderTagAction", { "Action": "restore" });
            }

            if (!options.FilteredList) {
                var $links = $active.find("a.LinkClickable[data-attr-editor-controller-action-btn='edit_criteria_vm'], " +
                                          "a.LinkClickable[data-attr-editor-controller-action-btn='save_criteria_vm']");

                $links.filter("a.LinkClickable[data-attr-editor-controller-action-btn='edit_criteria_vm']").toggle(options.IsEdit);
                $links.filter("a.LinkClickable[data-attr-editor-controller-action-btn='save_criteria_vm']").toggle(!options.IsEdit);

                var $vwFilters = $active.find("[" + util_renderAttribute("pluginEditor_valueMessageFilter") + "]");

                $vwFilters.trigger("events.snapshot", { "IsRestore": !options.IsEdit });
            }

        }   //end: IF block value message view mode
        else {

            if (options.IsEdit && $(options.Trigger).length) {

                var $editLink = $active.find("a[data-attr-editor-controller-action-btn='edit_editor_criteria']");

                if ($editLink.length == 0) {
                    var _html = _controller.Utils.HTML.GetButton({
                        "Content": "Edit", "ActionButtonID": "edit_editor_criteria",
                        "Attributes": {
                            "data-icon": "edit", "data-attr-require-layout-manager": enCETriState.Yes,
                            "data-attr-editor-criteria-id": enCE.None
                        }
                    });

                    $editLink = $(_html);

                    $editLink.hide();
                    $active.append($editLink);
                }

                _fnRevertToolbarState();

                $editLink.data("PopupHideOptions", { "IsDisableEditMode": true });

                $editLink.attr("data-attr-editor-criteria-id", $active.attr("data-attr-current-editor-criteria-id"))
                         .trigger("click");
            }
        }

    }   //end: criteria details view
    else if (_viewMode == enCValueMessageViewMode.StatementView) {

        var $referenceFileController = $active.find(".ViewReferenceFileController");
        var _refFileOpts = { "List": null };
        var _isUpdate = (options.FilteredList && options["IsUpdate"]);
        var _restrictUpdateType = (_isUpdate ? options["RestrictUpdateType"] : null);

        var _isRefTypeUpdate = (!_isUpdate || (_isUpdate && _restrictUpdateType == "ref_file"));

        if (_isRefTypeUpdate) {
            $referenceFileController.trigger("events.populateEditModeOptions", _refFileOpts);
        }

        if (options.IsEdit) {

            if (!_isUpdate) {

                if (options.LayoutManager) {
                    options.LayoutManager.ToolbarSetButtons({
                        "IsHideDoneButton": true,
                        "IsInsertStart": true,
                        "List": _controller.Utils.HTML.GetButton({
                            "ActionButtonID": "save_statement_edit", "Content": "Save & Continue", "Attributes": {
                                "data-icon": "check", "data-attr-is-continue": enCETriState.Yes
                            }
                        }) +
                        _controller.Utils.HTML.GetButton({ "ActionButtonID": "save_statement_edit", "Content": "Save", "Attributes": { "data-icon": "check" } }) +
                        _controller.Utils.HTML.GetButton({
                            "ActionButtonID": "edit_done", "Content": "Cancel", "Attributes": { "data-icon": "back", "data-is-refresh-view": enCETriState.Yes }
                        })
                    });
                }

                var _statement = $active.data("DataItem");

                _statement = (_statement || {});

                var $vwTitle = $active.find(".StatementTitle");

                _fnConfigureElementEditable($vwTitle, null, function () {
                    var $temp = $("<div class='ModeToggleEdit'>" +
                                  " <input type='text' " + util_htmlAttribute("data-attr-item-prop", enColStatementProperty.Name) +
                                  " placeholder='Statement Title' />" +
                                  " </div>" +
                                  "</div>");

                    $temp.insertAfter($vwTitle.find(".Title"));

                }, true);

                var $tbName = $vwTitle.find("input[" + util_htmlAttribute("data-attr-item-prop", enColStatementProperty.Name) + "]");

                $tbName.val(util_forceString(_statement[enColStatementProperty.Name]));
            }
            
            if (_isRefTypeUpdate) {

                _toolsHTML = null;

                var _customToolBtnHTML = _controller.Utils.HTML.GetButton({
                    "ActionButtonID": "save_statementRefFile", "Content": "Done", "CssClass": "DisableDragElement", "IsHidden": true,
                    "Attributes": { "data-icon": "check", "data-attr-require-layout-manager": enCETriState.Yes }
                });

                if (options.FilteredList) {
                    _refFileOpts.List = $(_refFileOpts.List).filter($(options.FilteredList));
                }

                $.each($(_refFileOpts.List), function () {
                    var $refFile = $(this);

                    _fnConfigureElementEditable($refFile, {
                        "EditActionID": "edit_statementRefFile", "DeleteActionID": "delete_statementRefFile", "CustomHTML": _customToolBtnHTML
                    }, function () {

                        $refFile.find(".TableBlockCell_C2")
                                .append(_toolsHTML);

                        if (!_controller.Data.IsDossierStatementModeRepositoryResource) {

                            var $lblDisplayName = $refFile.find(".DisplayName");
                            var $temp = $("<div class='ModeToggleEdit'>" +
                                          _controller.Utils.HTML.GetButton({
                                              "Content": "Open", "LinkURL": "javascript: void(0);", "Attributes": {
                                                  "data-icon": "arrow-r", "data-attr-file-edit-preview-link": enCETriState.Yes
                                              }
                                          }) +
                                          "</div>");

                            $temp.insertAfter($lblDisplayName);
                        }

                    });

                    var $vwLink = $refFile.find(".ModeToggleView .LinkClickable[href]");

                    $refFile.find(".ModeToggleEdit .LinkClickable[href]")
                            .attr("href", $vwLink.attr("href"));
                });
            }

        }
        else {
            var $editModeFilterList = $(_refFileOpts.List).filter(".EditorEntityEditMode");

            if ($editModeFilterList.length) {
                $editModeFilterList.removeClass("EditorEntityEditMode")
                                   .find("[data-attr-editor-controller-action-btn='save_statementRefFile'], " +
                                         "[data-attr-editor-controller-action-btn='edit_statementRefFile']")
                                   .hide()
                                   .filter("[data-attr-editor-controller-action-btn='edit_statementRefFile']")
                                   .show();
            }
        }

        if (!_isUpdate || !_isRefTypeUpdate) {
            $active.find(".ViewContentEditorController")
                   .trigger("events.setEditMode", {
                       "Controller": _controller, "PluginInstance": _pluginInstance, "IsEdit": options.IsEdit, "LayoutManager": options.LayoutManager,
                       "FilteredList": options.FilteredList, "Trigger": options.Trigger
                   });
        }
        
    }   //end: statement view
    else if (_viewMode == enCValueMessageViewMode.Claims) {

        $list = $active.find(".EditorClaim[data-attr-claim-id]");

        if (options.IsEdit) {

            if (options.LayoutManager) {
                options.LayoutManager.ToolbarSetButtons({
                    "IsInsertStart": true,
                    "List": _controller.Utils.HTML.GetButton({ "ActionButtonID": "add_claim", "Content": "Add New Claim", "Attributes": { "data-icon": "plus" } })
                });
            }

            $.each($list, function (indx) {
                var $detail = $(this);

                _fnConfigureElementEditable($detail, { "IsDisplayBlock": true, "EditActionID": "edit_claim" }, function () {
                    $detail.append(_toolsHTML);
                }, true); //end call: _fnConfigureElementEditable

            });
        }
        else {
            if (options.LayoutManager) {
                options.LayoutManager.ToolbarSetButtons({
                    "IsInsertStart": true,
                    "List": _controller.Utils.HTML.GetButton({
                        "ActionButtonID": "popup", "Content": "View Icon Legend", "Attributes": {
                            "data-attr-popup-id": "popup_claim_types_legend", "data-icon": "info"
                        }
                    })
                });
            }
        }

        $list.toggleClass("LinkDisabled", options.IsEdit);
    }

    if (!options.IsEdit) {
        _fnDismissInlineConfirmations($list);
    }

    $active.find(".EditorDraggableContainer").toggleClass("EditorDraggableOn", options.IsEdit);

    if (!_handled && options.Callback) {
        options.Callback();
    }

};  //end: ToggleEditMode

CValueMessageController.prototype.OnButtonClick = function (options) {

    options = util_extend({
        "Controller": null, "PluginInstance": null, "ButtonID": null, "Trigger": null, "Event": null, "Parent": null, "LayoutManager": null, "InvokeExtArgs": null
    }, options);

    var $btn = $(options.Trigger);
    var _controller = options.Controller;
    var _pluginInstance = _controller.PluginInstance;
    var $container = $(_controller.DOM.Element);

    var _fnGetDataItem = function () {
        var _editorCriteriaID = util_forceInt($mobileUtil.GetClosestAttributeValue($btn, "data-attr-editor-criteria-id"), enCE.None);
    };

    var _fnRefresh = function (refreshCallback) {

        refreshCallback = (refreshCallback && util_isFunction(refreshCallback) ? refreshCallback : null);

        if (options.LayoutManager) {
            options.LayoutManager.ToggleOverlay({ "IsEnabled": false });
        }

        _controller.Bind({ "IsRefresh": true }, refreshCallback);
    };

    var _fnErrorCallback = function () {
        options.LayoutManager.ToggleOverlay({
            "IsEnabled": true, "Message": "Click here to reload the page.", "IsHTML": true,
            "OnClick": _fnRefresh
        });
    };

    var _fnToggleEditView = function (isEnabled, editOpts, onPopupCallback) {

        editOpts = util_extend({ "Title": null, "ContentHTML": null, "SaveButtonID": null, "CustomToolbarButtonHTML": "" }, editOpts);

        ClearMessages();

        var _fnPopup = function () {

            $btn.trigger("events.popup", {
                "IsEnabled": isEnabled, "Title": editOpts.Title,
                "Controller": _controller, "Trigger": $btn,
                "ToolbarButtons": (isEnabled ?
                    util_forceString(editOpts.CustomToolbarButtonHTML, "") +                    
                    "<a class='LinkClickable' " + util_htmlAttribute("data-attr-editor-controller-action-btn", editOpts.SaveButtonID) +
                                               " data-role='button' data-icon='check' " +
                                               "data-mini='true' data-inline='true' data-theme='transparent'>" + util_htmlEncode("Save") + "</a>" +
                                               "<a class='LinkClickable' data-attr-editor-controller-action-btn='dismiss' data-role='button' data-icon='back' " +
                                               "data-mini='true' data-inline='true' data-theme='transparent'>" + util_htmlEncode("Cancel") + "</a>" : null),
                "HTML": (isEnabled ? editOpts.ContentHTML : null),
                "Callback": onPopupCallback
            });

        };

        if (isEnabled) {
            _fnPopup();
        }
        else {
            _fnRefresh(_fnPopup);
        }

    };  //end: _fnToggleEditView

    var _html = "";

    var _fnSaveEntity = function (executeCtx, actionMethod, params, successCallback, opts) {

        opts = util_extend({ "IsPromptRefreshOnError": true }, opts);

        var _fnError = function () {

            if (opts.IsPromptRefreshOnError) {

                $(_controller.DOM.Element).trigger("events.toggleOverlay", {
                    "IsEnabled": true, "Message": "Click here to reload the page.", "IsHTML": true,
                    "OnClick": function () {

                        $(_controller.DOM.Element).trigger("events.toggleOverlay", { "IsEnabled": false });

                        _controller.Bind({ "PluginInstance": _pluginInstance, "LayoutManager": options.LayoutManager, "IsRefresh": true });
                    }
                });
            }
            else {
                $btn.trigger("events.toggleOverlay", { "IsEnabled": false });
            }

        };  //end: _fnError

        var _fnSaveCallback = global_extEntitySave(function (saveItem) {

            if (successCallback) {

                $btn.trigger("events.toggleOverlay", { "IsEnabled": false });
                successCallback(saveItem);
            }
            else {
                $btn.trigger("events.toggleOverlay", { "IsEnabled": false });
            }

        }, null, null, { "CallbackGeneralFailure": _fnError });  //end: _saveCallback

        $btn.trigger("events.toggleOverlay", { "IsEnabled": true, "Message": "Saving changes..." });

        if (params) {
            params["_unbox"] = false;    //ensure the save result is not boxed
        }

        actionMethod.apply(executeCtx, [params, _fnSaveCallback]);

    };  //end: _fnSaveEntity

    switch (options.ButtonID) {

        case "add_editor_criteria":
        case "edit_editor_criteria":
        case "delete_editor_criteria":

            var $active = null;

            if (_controller.ViewMode() == enCValueMessageViewMode.CriteriaDetails) {
                $active = $container.find(".ViewEditorCriteriaSelections");
            }
            else {
                $active = _controller.ActiveElement();
            }

            options["OnToggleEditView"] = _fnToggleEditView;
            options["OnSaveEntity"] = _fnSaveEntity;
            options["OnRefresh"] = _fnRefresh;

            $active.trigger("events.processButtonClick", options);

            break;  //end: add, edit, delete editor_criteria

        case "dismiss":

            _fnToggleEditView(false);
            break;  //end: dismiss

        case "save_editor_criteria":

            var $tbl = $(options.Parent).find(".EditorAdminEditTable");
            var _editorCriteria = $tbl.data("DataItem");
            var _editorGroupCriteriaItem = null;
            var $inputs = $tbl.find("input[type='text'][data-attr-editor-criteria-prop], textarea[data-attr-editor-criteria-prop]");
            var _isExistingAddItem = false;

            if (util_forceInt(_editorCriteria[enColEditorCriteriaProperty.EditorCriteriaID], enCE.None) == enCE.None) {
                var $ddlAddExistCriteria = $tbl.find("#ddlAddExistCriteria");
                var _selectedCriteriaID = util_forceInt($ddlAddExistCriteria.val(), enCE.None);

                _isExistingAddItem = ($ddlAddExistCriteria.length == 1 && _selectedCriteriaID != enCE.None);

                if (_isExistingAddItem) {
                    _editorGroupCriteriaItem = new CEEditorGroupCriteria();
                    _editorGroupCriteriaItem[enColEditorGroupCriteriaProperty.EditorCriteriaID] = _selectedCriteriaID;
                }
            }

            ClearMessages();

            if (!_isExistingAddItem) {

                $.each($inputs, function () {
                    var $input = $(this);
                    var _val = util_trim($(this).val());
                    var _propName = $input.attr("data-attr-editor-criteria-prop");

                    _editorCriteria[_propName] = _val;

                    if (_propName == enColEditorCriteriaProperty.Name && _val == "") {
                        AddUserError("Criteria Name is required.");
                    }

                    $input.val(_val);
                });
            }

            var _populateCallback = null;

            if (_isExistingAddItem) {
                _populateCallback = function () {

                    if (MessageCount() == 0) {

                        var _fnError = function () {
                            $btn.trigger("events.toggleOverlay", { "IsEnabled": false });
                        };

                        $btn.trigger("events.toggleOverlay", { "IsEnabled": true, "Message": "Saving changes..." });

                        GlobalService.EditorGroupCriteriaSave({
                            "_unbox": false, "Item": _editorGroupCriteriaItem, "IsAddDisplayOrderEnd": true
                        }, global_extEntitySave(function (saveItem) {

                            saveItem = util_parse(saveItem);    //force parse from string to JSON object

                            AddMessage("Criteria has been successfully added.");

                            setTimeout(function () {

                                //dismiss the popup
                                _fnToggleEditView(false);

                            }, 1000);

                        }, null, null, { "CallbackGeneralFailure": _fnError }));
                    }

                };
            }
            else {
                _populateCallback = function () {

                    if (MessageCount() == 0) {

                        var _fnError = function () {
                            $btn.trigger("events.toggleOverlay", { "IsEnabled": false });
                        };

                        //initialize default values for the new criteria item
                        if (util_forceInt(_editorCriteria[enColEditorCriteriaProperty.EditorCriteriaID], enCE.None) == enCE.None) {

                            var $editorGroupParent = $(options.Parent).closest("[data-attr-home-editor-group-id]");
                            var _editorGroup = $editorGroupParent.data("DataItem"); //NOTE: the editor group data item is required and will be already populated

                            _editorCriteria[enColEditorCriteriaProperty.EditorForeignTypeID] = enCEEditorForeignType.ValueMessageGroup;
                            _editorCriteria[enColEditorCriteriaProperty.IsEditable] = true;
                            _editorCriteria[enColEditorCriteriaProperty.CanDelete] = true;

                            //add the new criteria to the current editor group list
                            var _editorGroupCriteriaList = [];
                            var _currentEditorGroupCriteria = new CEEditorGroupCriteria();

                            _currentEditorGroupCriteria[enColEditorGroupCriteriaProperty.EditorGroupID] = _editorGroup[enColEditorGroupProperty.EditorGroupID];

                            _editorGroupCriteriaList.push(_currentEditorGroupCriteria);

                            _editorCriteria[enColCEEditorCriteriaProperty.EditorGroupCriteriaList] = _editorGroupCriteriaList;
                        }

                        $btn.trigger("events.toggleOverlay", { "IsEnabled": true, "Message": "Saving changes..." });

                        GlobalService.EditorCriteriaSave({
                            "_unbox": false, "Item": _editorCriteria, "DeepSave": true, "ValidationField": "Document Name"
                        }, global_extEntitySave(function (saveItem) {

                            saveItem = util_parse(saveItem);    //force parse from string to JSON object

                            var _updatedCriteriaFiles = (saveItem ? saveItem[enColCEEditorCriteria_JSONProperty.EditorCriteriaFiles] : null);

                            _updatedCriteriaFiles = (_updatedCriteriaFiles || []);

                            //for each criteria file with a temp upload file item, remove it from cleanup (as it no longer exists from deep save of file)
                            var _uploads = ($(options.Parent).find(".InlinePopupContent").data("uploads-cleanup") || {});

                            for (var i = 0; i < _updatedCriteriaFiles.length; i++) {
                                var _criteriaFile = _updatedCriteriaFiles[i];
                                var _fileItem = _criteriaFile[enColCEEditorCriteriaFile_JSONProperty.TempFileItem];

                                if (_fileItem && util_forceString(_fileItem[enColCEFile_JSONProperty.UploadFileName]) != "") {
                                    var _uploadFileName = _fileItem[enColCEFile_JSONProperty.UploadFileName];

                                    delete _uploads[_uploadFileName];
                                }
                            }

                            AddMessage("Criteria has been successfully saved.");

                            setTimeout(function () {

                                //dismiss the popup
                                _fnToggleEditView(false);

                            }, 1000);

                        }, null, null, { "CallbackGeneralFailure": _fnError }));
                    }

                };
            }

            $tbl.trigger("events.populateItem", {
                "Item": (_isExistingAddItem ? _editorGroupCriteriaItem : _editorCriteria), "IsAddExisting": _isExistingAddItem, "Callback": _populateCallback
            });
            
            break;  //end: save_editor_criteria

        case "add_criteria_vm":

            var $vmContainer = _controller.ActiveElement().find(".EditorCriteriaValueMessages");

            $btn.addClass("LinkDisabled");

            $vmContainer.trigger("events.insertValueMessage", {
                "Callback": function () {
                    $btn.removeClass("LinkDisabled");
                }
            });

            break;  //end: add_criteria_vm

        case "edit_criteria_vm":
        case "save_criteria_vm":

            var $criteriaValueMessage = $btn.closest(".EditorValueMessageDetail");
            var _currentValueMessageID = util_forceInt($criteriaValueMessage.attr("data-attr-editor-criteria-value-message-id"), enCE.None);

            var _editorCriteriaValueMessage = $criteriaValueMessage.data("DataItem");

            var _isEditButton = (options.ButtonID == "edit_criteria_vm");

            var _fnToggleValueMessageButtons = function () {
                $criteriaValueMessage.toggleClass("EditorEntityEditMode", _isEditButton);

                var $btns = $criteriaValueMessage.find("[data-attr-editor-controller-action-btn='save_criteria_vm'], " +
                                                       "[data-attr-editor-controller-action-btn='edit_criteria_vm']");

                $btns.filter("[data-attr-editor-controller-action-btn='save_criteria_vm']").toggle(_isEditButton);
                $btns.filter("[data-attr-editor-controller-action-btn='edit_criteria_vm']").toggle(!_isEditButton);

                var $vwBadge = $criteriaValueMessage.find(".EditorValueMessageBadgeView[" + util_renderAttribute("pluginEditor_valueMessageBadge") + "]");

                $vwBadge.trigger("events.toggleEditMode", { "IsEditable": _isEditButton });

            };  //end: _fnToggleValueMessageButtons

            if (_isEditButton) {

                if (!$criteriaValueMessage.data("is-init-input-mode")) {
                    $criteriaValueMessage.data("is-init-input-mode", true);

                    var $statements = $criteriaValueMessage.find(".EditorValueMessageStatements");
                    var _platformsHTML = "";
                    var _platforms = (_controller.ActiveElement().data("data-filtered-platforms") || []);

                    _platformsHTML += "<div class='ModeToggleEntityView ModeDisplayInlineBlock EditorValueMessageInputRow' " +
                                      util_htmlAttribute("data-attr-item-prop", enColCEValueMessageProperty.ValueMessagePlatforms) + ">" +
                                      " <b>" + util_htmlEncode("Associate Value Message with the following Platform(s):") + "</b><br />";

                    var _componentID = _controller.Utils.ContextEditorGroupComponentID($criteriaValueMessage);

                    for (var p = 0; p < _platforms.length; p++) {
                        var _platform = _platforms[p];

                        _platformsHTML += "<div class='DisableDragElement FlipSwitchInline LinkClickable'>" +
                                          " <div " + util_renderAttribute("flip_switch") + " data-corners='false' data-mini='true' style='display: inline-block;' " +
                                          util_htmlAttribute("data-attr-platform-toggle-id", _platform[enColPlatformProperty.PlatformID]) + "/>" +
                                          " <div class='Label'>" + _pluginInstance.Utils.ForceEntityDisplayName({ "Type": "Platform", "Item": _platform }) + "</div>";

                        _platformsHTML += _controller.Utils.Managers.Data.InlineEditorGroupSwitchHTML({
                            "PlatformID": _platform[enColPlatformProperty.PlatformID],
                            "ComponentID": _componentID,
                            "EditorForeignTypeID": enCEEditorForeignType.SubDossier
                        });

                        _platformsHTML += "</div>";
                    }

                    _platformsHTML += "</div>";

                    var $temp = null;
                    
                    $temp = $("<div class='ModeToggleEntityView EditorValueMessageInputRow'>" +
                              " <input class='DisableDragElement' type='text' " + util_htmlAttribute("data-attr-item-prop", enColValueMessageProperty.Name) +
                              " placeholder='Value Message Title' />" +
                              " </div>" +
                              "</div>");

                    $temp.insertBefore($criteriaValueMessage.find(".EditorValueMessageBadgeView"));

                    $temp = $(_platformsHTML +
                              "<div class='EditorValueMessageStatementActionButtons ModeToggleEntityView'>" +
                              "  <a data-attr-editor-controller-action-btn='add_valueMessageStatement' class='DisableDragElement LinkClickable' data-role='button' " +
                              "data-icon='plus' data-mini='true' data-inline='true' data-theme='transparent'>" +
                              util_htmlEncode("Add Evidence Supported Statement") + "</a>" +
                              "</div>");

                    $temp.insertBefore($statements);

                    $criteriaValueMessage.trigger("create");
                    $mobileUtil.refresh($temp);
                }

                var _valueMessage = _editorCriteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.ValueMessageItem];

                if (!_valueMessage) {
                    var _lookupVM = _controller.ActiveElement().data("data-vm-lookup");

                    _valueMessage = _lookupVM.Get($criteriaValueMessage);
                    _editorCriteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.ValueMessageItem] = _valueMessage;
                }

                $criteriaValueMessage.trigger("events.statementsOrderTagAction", { "Action": "tag" });

                var _valueMessagePlatforms = (_valueMessage ? _valueMessage[enColCEValueMessageProperty.ValueMessagePlatforms] : null);
                var _valueMessageEditorGroupPerms = (_valueMessage ? _valueMessage[enColCEValueMessageProperty.EditorGroupForeignPermissions] : null);

                $criteriaValueMessage.find("input[" + util_htmlAttribute("data-attr-item-prop", enColValueMessageProperty.Name) + "]")
                                     .val(util_forceString(_editorCriteriaValueMessage[enColEditorCriteriaValueMessageProperty.ValueMessageIDName]));

                $.each($criteriaValueMessage.find("[" + util_htmlAttribute("data-attr-item-prop", enColCEValueMessageProperty.ValueMessagePlatforms) + "] " +
                       "[data-attr-platform-toggle-id] select[data-attr-widget='flip_switch']"), function () {
                           var $ddl = $(this);
                           var _platformID = util_forceInt($mobileUtil.GetClosestAttributeValue($ddl, "data-attr-platform-toggle-id"), enCE.None);
                           var _search = util_arrFilter(_valueMessagePlatforms, enColValueMessagePlatformProperty.PlatformID, _platformID, true);

                           $ddl.val(_search.length ? enCETriState.Yes : enCETriState.No)
                               .trigger("change");

                       });

                $.each($criteriaValueMessage.find(".FlipSwitchChildToggles [data-attr-platform-toggle-editor-group-id] select[data-attr-widget='flip_switch']"), function () {
                    var $ddl = $(this);
                    var _editorGroupID = util_forceInt($mobileUtil.GetClosestAttributeValue($ddl, "data-attr-platform-toggle-editor-group-id"), enCE.None);
                    var _search = util_arrFilterSubset(_valueMessageEditorGroupPerms, function (searchItem) {
                        return (searchItem[enColEditorGroupForeignPermissionProperty.EditorForeignTypeID] == enCEEditorForeignType.TableValueMessage &&
                                searchItem[enColEditorGroupForeignPermissionProperty.EditorGroupID] == _editorGroupID);
                    }, true);

                    $ddl.val(_search.length ? enCETriState.Yes : enCETriState.No)
                        .trigger("change");

                });

                var _statements = $criteriaValueMessage.data("data-statements");

                if (!_statements && _currentValueMessageID != enCE.None) {
                    if (options.LayoutManager) {
                        options.LayoutManager.ToggleOverlay({ "IsEnabled": true, "Message": "Loading..." });
                    }

                    GlobalService.StatementGetByForeignKey({ "ValueMessageID": _currentValueMessageID }, function (statementData) {
                        _statements = (statementData ? statementData.List : null);
                        _statements = (_statements || []);

                        $criteriaValueMessage.data("data-statements", _statements);

                        if (options.LayoutManager) {
                            options.LayoutManager.ToggleOverlay({ "IsEnabled": false });
                        }
                    });
                }
            }

            if (!_isEditButton) {

                var _lookupVM = $criteriaValueMessage.closest("[data-attr-current-editor-criteria-id]")
                                                     .data("data-vm-lookup");
                
                var _valueMessageItem = _lookupVM.Get($criteriaValueMessage);

                var _edits = { };
                var $props = $criteriaValueMessage.find("[data-attr-item-prop]:not([data-attr-prop-is-embed])");

                ClearMessages();

                $.each($props, function(){
                    var $input = $(this);
                    var _isInput = $input.is("input[type='text']");
                    var _prop = $input.attr("data-attr-item-prop");
                    var _val = null;

                    if (_isInput) {
                        _val = util_trim($input.val());
                        $input.val(_val);
                    }

                    switch (_prop) {

                        case enColCEValueMessageProperty.ValueMessagePlatforms:
                            _val = [];

                            var _srcValueMessagePlatforms = _valueMessageItem[enColCEValueMessageProperty.ValueMessagePlatforms];
                            var _srcValueMessageEditorGroupPerms = _valueMessageItem[enColCEValueMessageProperty.EditorGroupForeignPermissions];

                            _edits[enColCEValueMessageProperty.EditorGroupForeignPermissions] = []; //force default empty array prior to populating the list

                            $.each($input.find("[data-attr-platform-toggle-id] select[data-attr-widget='flip_switch']"), function () {
                                var $flipSwitch = $(this);
                                var _selected = (util_forceInt($flipSwitch.val(), enCETriState.None) == enCETriState.Yes);

                                if (_selected) {
                                    var _platformID = util_forceInt($mobileUtil.GetClosestAttributeValue($flipSwitch, "data-attr-platform-toggle-id"), enCE.None);
                                    var _valueMessagePlatform = util_arrFilter(_srcValueMessagePlatforms, enColValueMessagePlatformProperty.PlatformID,
                                                                               _platformID, true);

                                    _valueMessagePlatform = (_valueMessagePlatform.length == 1 ? _valueMessagePlatform[0] : null);

                                    if (!_valueMessagePlatform) {
                                        _valueMessagePlatform = new CEValueMessagePlatform();
                                    }

                                    _valueMessagePlatform[enColValueMessagePlatformProperty.PlatformID] = _platformID;

                                    _val.push(_valueMessagePlatform);

                                    var _currentEditorGroupPerms = _controller.Utils.Managers.Data.PopulateEditorGroupForeignPermissions({
                                        "Element": $flipSwitch.closest(".FlipSwitchInline"),
                                        "SourceList": _srcValueMessageEditorGroupPerms,
                                        "BridgeItemEditorForeignTypeID": enCEEditorForeignType.TableValueMessage
                                    });

                                    $.merge(_edits[enColCEValueMessageProperty.EditorGroupForeignPermissions], _currentEditorGroupPerms);
                                }
                            });

                            if (_val.length == 0) {
                                AddUserError("At least one platform is required for the Value Message.");
                            }

                            break;

                        case enColCEValueMessageProperty.ValueMessageStatements:

                            _val = [];

                            var _srcStatements = $criteriaValueMessage.data("data-statements");
                            var _srcValueMessageStatements = _valueMessageItem[enColCEValueMessageProperty.ValueMessageStatements];

                            var _displayOrder = 1;

                            $.each($input.find(".EditorValueMessageStatement"), function (index) {
                                var $valueMessageStatement = $(this);
                                var _tempID = util_forceInt($valueMessageStatement.attr("data-attr-editor-value-message-statement-temp-id"), enCE.None);
                                var _isTemp = (_tempID != enCE.None);
                                var _isDeleted = $valueMessageStatement.hasClass("DeletedItem");

                                if (!_isDeleted) {

                                    var _dataValueMessageStatement = null;
                                    var _statement = null;

                                    if (!_isTemp) {
                                        var _searchStatementID = util_forceInt($valueMessageStatement.attr("data-attr-editor-value-message-statement-id"), enCE.None);

                                        _dataValueMessageStatement = util_arrFilter(_srcValueMessageStatements, enColValueMessageStatementProperty.StatementID,
                                                                                    _searchStatementID, true);
                                        _dataValueMessageStatement = (_dataValueMessageStatement.length ? _dataValueMessageStatement[0] : null);
                                    }
                                    else {

                                        //temp statement
                                        _dataValueMessageStatement = $valueMessageStatement.data("DataItem");

                                        if (_dataValueMessageStatement) {
                                            var _statementItem = _dataValueMessageStatement[enColCEValueMessageStatementProperty.TempStatementItem];

                                            if (!_statementItem) {
                                                _statementItem = new CEStatement();
                                                _dataValueMessageStatement[enColCEValueMessageStatementProperty.TempStatementItem] = _statementItem;
                                            }

                                            //populate the statement name
                                            var $tbName = $valueMessageStatement.find("input[data-attr-prop='_StatementName']");
                                            var _statementName = util_trim($tbName.val());

                                            $tbName.val(_statementName);

                                            _statementItem[enColStatementProperty.Name] = _statementName;

                                            if (_statementName == "") {
                                                AddUserError("Statement #" + (index + 1) + ": title is required.");
                                            }
                                        }
                                    }

                                    if (_dataValueMessageStatement) {
                                        _dataValueMessageStatement[enColValueMessageStatementProperty.DisplayOrder] = _displayOrder++;
                                        _val.push(_dataValueMessageStatement);
                                    }
                                }

                            });

                            break;

                        case enColCEValueMessageProperty.ValueMessageBadges:

                            _val = [];

                            if ($input.is("[" + util_renderAttribute("pluginEditor_valueMessageBadge") + "]")) {
                                var _badgeSelections = {};
                                var _srcValueMessageBadges = _valueMessageItem[enColCEValueMessageProperty.ValueMessageBadges];

                                //NOTE: synchronous call used and avoiding the use of callbacks since passing referenced object to be populated
                                $input.trigger("events.getSelection", { "PopulateItem": _badgeSelections });

                                if (_badgeSelections["Values"]) {

                                    for (var b = 0; b < _badgeSelections.Values.length; b++) {
                                        var _selectedBadgeID = _badgeSelections.Values[b];
                                        var _valueMessageBadge = util_arrFilter(_srcValueMessageBadges, enColValueMessageBadgeProperty.BadgeID, _selectedBadgeID, true);

                                        _valueMessageBadge = (_valueMessageBadge.length == 1 ? _valueMessageBadge[0] : null);

                                        if (!_valueMessageBadge) {
                                            _valueMessageBadge = new CEValueMessageBadge();
                                        }

                                        _valueMessageBadge[enColValueMessageBadgeProperty.BadgeID] = _selectedBadgeID;

                                        _val.push(_valueMessageBadge);
                                    }
                                }
                            }

                            break;

                        case enColValueMessageProperty.Name:

                            if (_val == "") {
                                AddUserError("Value Message title is required.");
                            }

                            break;
                    }

                    _edits[_prop] = _val;

                });

                if (MessageCount() == 0) {

                    _valueMessageItem[enColValueMessageProperty.Name] = _edits[enColValueMessageProperty.Name];
                    _valueMessageItem[enColCEValueMessageProperty.ValueMessagePlatforms] = _edits[enColCEValueMessageProperty.ValueMessagePlatforms];
                    _valueMessageItem[enColCEValueMessageProperty.EditorGroupForeignPermissions] = _edits[enColCEValueMessageProperty.EditorGroupForeignPermissions];
                    _valueMessageItem[enColCEValueMessageProperty.ValueMessageStatements] = _edits[enColCEValueMessageProperty.ValueMessageStatements];
                    _valueMessageItem[enColCEValueMessageProperty.ValueMessageBadges] = _edits[enColCEValueMessageProperty.ValueMessageBadges];

                    _editorCriteriaValueMessage[enColEditorCriteriaValueMessageProperty.ValueMessageIDName] = _valueMessageItem[enColValueMessageProperty.Name];
                    _editorCriteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.ValueMessageItem] = _valueMessageItem;

                    _editorCriteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.ReferencedCriteriaValueMessage] = null;

                    //need to update the display order only if a temp item is currently being saved
                    if ($criteriaValueMessage.is("[data-attr-editor-criteria-value-message-temp-id]")) {
                        var _displayOrderDetail = {};

                        $criteriaValueMessage.trigger("events.populateDisplayOrder", { "PopulateItem": _displayOrderDetail } );

                        _editorCriteriaValueMessage[enColEditorCriteriaValueMessageProperty.DisplayOrder] = util_forceInt(_displayOrderDetail["DisplayOrder"], 0);

                        if (_displayOrderDetail["Referenced"] && _displayOrderDetail.Referenced.length > 0) {
                            _editorCriteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.ReferencedCriteriaValueMessage] = _displayOrderDetail.Referenced;
                        }
                    }

                    _fnSaveEntity(GlobalService, GlobalService.EditorCriteriaValueMessageSave, { "Item": _editorCriteriaValueMessage, "DeepSave": true },
                                  function (saveItem) {

                                      saveItem = util_parse(saveItem);

                                      $criteriaValueMessage.trigger("events.statementsOrderTagAction", { "Action": "clear" });

                                      var $vwUserExportAction = $criteriaValueMessage.children("[" + util_renderAttribute("pluginEditor_userExportAction") + "]");

                                      if ($vwUserExportAction.length == 0) {
                                          $vwUserExportAction = $("<div " + util_renderAttribute("pluginEditor_userExportAction") + " />");
                                          $vwUserExportAction.hide();

                                          $criteriaValueMessage.append($vwUserExportAction);
                                          $mobileUtil.RenderRefresh($vwUserExportAction, true);
                                      }

                                      var _ctxValueMessageID = (saveItem ? saveItem[enColEditorCriteriaValueMessageProperty.ValueMessageID] : null);

                                      $vwUserExportAction.trigger("events.userExportAction_OnInit", {
                                          "Instance": _pluginInstance,
                                          "Data": [],
                                          "ValueMessageID": _ctxValueMessageID,
                                          "StatementID": enCE.None, //set to be applicable to all statements for this value message
                                          "Attributes": {
                                              "data-attr-vw-value-message-id": _ctxValueMessageID,
                                              "data-attr-vw-statement-id": enCE.None    //set to be applicable to all statements for this value message
                                          }
                                      });

                                      //force refresh of the applicable divider slides for the value message statements
                                      setTimeout(function () {
                                          _controller.Utils.Actions.RefreshExportCache({
                                              "Element": $criteriaValueMessage,
                                              "OverrideAction": "divider_slide"
                                          });
                                      }, 0);

                                      $criteriaValueMessage.trigger("events.onUpdateDataItem", {
                                          "Previous": _editorCriteriaValueMessage, "Update": saveItem,
                                          "Callback": _fnToggleValueMessageButtons
                                      });
                                  });
                }

                break;  //exit switch statement case
            }
            else {
                _fnToggleValueMessageButtons();
            }

            break;  //end: edit/save criteria_vm

        case "add_valueMessageStatement":

            var $criteriaValueMessage = $btn.closest(".EditorValueMessageDetail");

            $btn.addClass("LinkDisabled");

            $criteriaValueMessage.trigger("events.appendValueMessageStatement", {
                "Callback": function () {
                    $btn.removeClass("LinkDisabled");
                }
            });

            break;  //end: add_valueMessageStatement

        case "delete_criteria_vms":
        case "undoDelete_criteria_vms":

            var $statement = $btn.closest(".EditorValueMessageStatement");
            var _isTemp = $statement.is("[data-attr-editor-value-message-statement-temp-id]");
            var _isInlineEdit = $statement.closest(".EditorValueMessageDetail").is(".EditorEntityEditMode");
            var _isPermanentDelete = (!_isInlineEdit && !_isTemp);

            _controller.Utils.ProcessDeleteToggleButton({
                "Trigger": $btn, "ButtonID": options.ButtonID, "ActionDeleteID": "delete_criteria_vms", "ActionUndoID": "undoDelete_criteria_vms",
                "EntityContextSelector": $statement,
                "ConfirmationTarget": null, "EntityName": "Statement", "OnDeleteCallback": function (opts) {

                    //determine whether to immediately delete the statement or wait until total edits are completed
                    if (_isPermanentDelete) {
                        var $parent = $statement.closest(".EditorValueMessageDetail");
                        var _searchValueMessageID = util_forceInt($parent.attr("data-attr-editor-criteria-value-message-id"), enCE.None);

                        if (_searchValueMessageID != enCE.None) {
                            var _lookupVM = _controller.ActiveElement().data("data-vm-lookup");
                            var _valueMessage = _lookupVM.Get($parent);

                            var _searchStatementID = util_forceInt($statement.attr("data-attr-editor-value-message-statement-id"), enCE.None);
                            var _deleteValueMessageStatement = util_arrFilter(_valueMessage ? _valueMessage[enColCEValueMessageProperty.ValueMessageStatements] : null,
                                                                              enColValueMessageStatementProperty.StatementID, _searchStatementID, true);

                            if (_deleteValueMessageStatement.length == 1) {
                                _deleteValueMessageStatement = _deleteValueMessageStatement[0];

                                _isInlineEdit = true;

                                _fnSaveEntity(GlobalService, GlobalService.ValueMessageStatementDelete, { "Item": _deleteValueMessageStatement }, function () {

                                    $statement.toggle("height", function () {
                                        $statement.remove();
                                    });
                                });

                            }
                        }
                    }
                    else {

                        if (_isTemp) {
                            $statement.find("[data-attr-prop='_StatementName']").prop("disabled", true);
                        }
                    }

                }, "OnUndoCallback": function (opts) {
                    if (_isTemp) {
                        $statement.find("[data-attr-prop='_StatementName']").removeAttr("disabled");
                    }
                }, "IsPermanentDelete": _isPermanentDelete, "HasUndoButton": !_isPermanentDelete
            });
                        
            break;  //end: delete/undoDelete criteria_vms

        case "delete_criteria_vmDetail":

            _controller.Utils.ProcessDeleteToggleButton({
                "Trigger": $btn, "ButtonID": options.ButtonID, "ActionDeleteID": "delete_criteria_vmDetail",
                "EntityContextSelector": ".EditorValueMessageDetail",
                "ConfirmationTarget": null, "EntityName": "Value Message", "OnDeleteCallback": function (deleteOpts) {
                    var $criteriaValueMessage = $(deleteOpts.EntityElement);
                    var _searchValueMessageID = util_forceInt($criteriaValueMessage.attr("data-attr-editor-criteria-value-message-id"), enCE.None);
                    var _deleteCriteriaValueMessage = null;

                    var _fn = function () {

                        $criteriaValueMessage.trigger("events.cleanup");

                        $criteriaValueMessage.toggle("height", function () {
                            $criteriaValueMessage.remove();
                        });
                    };

                    if (_searchValueMessageID != enCE.None) {
                        var _editorCriteria = (_controller.ActiveElement().data("DataItem") || {});
                        var _criteriaValueMessageList = (_editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaValueMessages] || []);

                        _deleteCriteriaValueMessage = util_arrFilter(_criteriaValueMessageList, enColEditorCriteriaValueMessageProperty.ValueMessageID,
                                                                     _searchValueMessageID, true);
                        _deleteCriteriaValueMessage = (_deleteCriteriaValueMessage.length ? _deleteCriteriaValueMessage[0] : null);
                    }

                    if (_deleteCriteriaValueMessage) {
                        _fnSaveEntity(GlobalService, GlobalService.EditorCriteriaValueMessageDelete, { "Item": _deleteCriteriaValueMessage }, _fn);
                    }
                    else {
                        _fn();
                    }

                }, "IsPermanentDelete": true
            });

            break;  //end: delete_criteria_vmDetail

        case "save_statement_edit":

            var $vw = _controller.ActiveElement();
            var _statement = $vw.data("DataItem");
            var $tbName = $vw.find("input[" + util_htmlAttribute("data-attr-item-prop", enColStatementProperty.Name) + "]");
            var _name = util_trim($tbName.val());
            var _isContinueEdit = (util_forceInt($btn.attr("data-attr-is-continue"), enCETriState.No) == enCETriState.Yes);

            $tbName.val(_name);

            ClearMessages();

            if (_name == "") {
                AddUserError("Statement title is required.");
            }

            if (MessageCount() == 0) {
                
                _statement[enColStatementProperty.Name] = _name;

                var _isDisableConfirmation = (options.InvokeExtArgs && options.InvokeExtArgs["IsDisableConfirmation"]);

                var _fnSaveStatement = function () {

                    ClearMessages();

                    var _arr = [];

                    _arr.push({ "t": $vw.find(".ViewContentEditorController"), "populate_event": "events.populateItem", "update_event": "events.updateDataItem" });
                    _arr.push({ "t": $vw.find(".ViewReferenceFileController"), "populate_event": "events.populateItem", "update_event": "events.updateDataItem" });

                    var _fnProcessElementControllers = function (statementDataItem, index, propEventType, onCallback) {

                        if (index >= _arr.length) {
                            if (onCallback) {
                                onCallback();
                            }
                        }
                        else {
                            var _entry = _arr[index];
                            var _fnNextIteration = function () {
                                _fnProcessElementControllers(statementDataItem, index + 1, propEventType, onCallback);
                            };

                            var _params = {
                                "Item": statementDataItem, "IsContinueEdit": _isContinueEdit
                            };

                            var _isUpdateEvent = (propEventType == "update_event");

                            if (!_isUpdateEvent) {
                                _params["Callback"] = _fnNextIteration;
                            }

                            $(_entry.t).trigger(_entry[propEventType], _params);

                            //update event does not have an async callback, so execute next iteration
                            if (_isUpdateEvent) {
                                _fnNextIteration();
                            }
                        }

                    };

                    var _fnSaveCallback = function () {

                        if (MessageCount() != 0) {
                            $(_controller.DOM.Element).trigger("events.toggleOverlay", { "IsEnabled": false });
                            return;
                        }

                        _fnSaveEntity(GlobalService, GlobalService.StatementSave, { "Item": _statement, "DeepSave": true }, function (strUpdateStatement) {

                            var _updateStatement = util_parse(strUpdateStatement);

                            _fnProcessElementControllers(_updateStatement, 0, "update_event", function () {

                                if (!_isContinueEdit) {
                                    options.LayoutManager.ToolbarTriggerButton({ "ButtonID": "done" });
                                }

                                _controller.Utils.Actions.RefreshExportCache({
                                    "Element": _controller.ActiveElement(), "Callback": function () {

                                        AddMessage("Changes have been successfully saved.", null, null, { "IsTimeout": true });

                                        if (_isDisableConfirmation && options.InvokeExtArgs && options.InvokeExtArgs["OnSaveSuccess"]) {
                                            options.InvokeExtArgs.OnSaveSuccess();
                                        }
                                    }
                                });

                            });

                        });

                    };  //end: _fnSaveCallback

                    _fnProcessElementControllers(_statement, 0, "populate_event", _fnSaveCallback);

                };  //end: _fnSaveStatement

                if (_isDisableConfirmation) {
                    _fnSaveStatement();
                }
                else {
                    dialog_confirmYesNo("Save Changes", "Are you sure you want to save changes?", _fnSaveStatement);
                }

            }

            break;  //end: save_statement_edit

        case "add_statementRefFile":
        case "delete_statementRefFile":
        case "undoDelete_statementRefFile":
        case "edit_statementRefFile":
        case "save_statementRefFile":

            $btn.closest(".ViewReferenceFileController")
                .trigger("events.processButtonClick", options);

            break;  //end: misc reference file controller

        case "add_claim":
        case "edit_claim":
        case "save_claim":
        case "delete_claim":

            var $vwClaims = _controller.ActiveElement();

            if (options.ButtonID == "save_claim" || options.ButtonID == "delete_claim") {

                var $tbl = $(options.Parent).find(".EditorClaimAdminEditTable");
                var _claim = $tbl.data("DataItem");

                if (!$btn.data("data-is-busy")) {

                    var _isDelete = (options.ButtonID == "delete_claim");

                    $btn.data("data-is-busy", true);

                    var _fn = function () {

                        _controller.Utils.ProcessEditViewSaveEvent({
                            "ElementController": $tbl, "Trigger": $btn,
                            "MessageSaved": (_isDelete ? "Claim has been successfully deleted." : "Claim has been successfully saved."),
                            "DataItem": _claim,
                            "CallbackOnDone": function () {
                                $btn.removeData("data-is-busy");
                            },
                            "CallbackDismissView": function () {
                                _fnToggleEditView(false);
                            },
                            "CallbackSaveChanges": function (onCallback, onErrorCallback) {

                                var _methodArgs = {
                                    "_EditorGroupID": _controller.Utils.ContextEditorGroupID($vwClaims),
                                    "Item": util_stringify(_claim)
                                };

                                if (!_isDelete) {
                                    _methodArgs["DeepSave"] = true;
                                }

                                APP.Service.Action({
                                    "_action": "SAVE",
                                    "c": "PluginEditor", "m": (_isDelete ? "ClaimDelete" : "ClaimSave"),
                                    "args": _methodArgs,
                                    "_eventArgs": {
                                        "Options": { "CallbackGeneralFailure": onErrorCallback }
                                    }
                                }, function (saveItem) {
                                    onCallback(saveItem);
                                });
                            }
                        });

                    };  //end: _fn

                    if (_isDelete) {
                        dialog_confirmYesNo("Delete Claim", "Are you sure you want to permanently delete the claim?", function () {
                            _fn();
                        }, function () {
                            $btn.removeData("data-is-busy");
                        });
                    }
                    else {
                        _fn();
                    }
                }
            }
            else {

                _fnToggleEditView(true, {
                    "Title": (options.ButtonID == "edit_claim" ? "Edit" : "Add") + " Claim", "SaveButtonID": "save_claim",
                    "CustomToolbarButtonHTML": (options.ButtonID == "edit_claim" ?
                                                _controller.Utils.HTML.GetButton({
                                                    "Content": "Delete Claim", "ActionButtonID": "delete_claim", "Attributes": { "data-icon": "delete" }
                                                }) :
                                                ""
                                               )
                }, function (popupOpts) {
                    $vwClaims.trigger("events.edit_entity", { "PopupOptions": popupOpts, "Trigger": $btn, "ButtonID": options.ButtonID });
                });
            }

            break;  //end: add_claim, edit_claim, save_claim, delete_claim

        case "edit_done":

            var _isRefresh = (util_forceInt($btn.attr("data-is-refresh-view"), enCETriState.None) == enCETriState.Yes);

            var _fnEditDone = function () {

                options.LayoutManager.ToolbarTriggerButton({
                    "ButtonID": "done", "Callback": function () {
                        if (_isRefresh) {
                            _controller.Bind({ "IsRefresh": true });
                        }
                    }
                });
            };

            if (_isRefresh) {
                dialog_confirmYesNo("Discard", "Are you sure you want to revert all changes?", _fnEditDone);
            }
            else {
                _fnEditDone();
            }

            break;  //end: edit_done

        case "popup":

            var _popupOptions = { "HeaderTitle": "Popup", "PopupSize": "medium" };

            var _contentOptions = {
                "PopupID": $btn.attr("data-attr-popup-id"),
                "Params": { "Controller": _controller, "PluginInstance": _pluginInstance, "Trigger": $btn },
                "Method": null
            };

            switch (_contentOptions.PopupID) {

                case "popup_vm_badges_legend":

                    _popupOptions.PopupSize = "small";
                    _popupOptions.HeaderTitle = "Icon Legend";
                    _contentOptions.Method = _controller.PopupBadgeLegendHTML;
                    break;

                case "popup_claim_types_legend":

                    _popupOptions.PopupSize = "small";
                    _popupOptions.HeaderTitle = "Icon Legend";
                    _contentOptions.Method = _controller.PopupClaimTypeLegendHTML;
                    break;
            }

            _popupOptions["GetContent"] = (_contentOptions.Method ?
                                           function (contentCallback) {

                                               _contentOptions.Params["Callback"] = contentCallback;

                                               _contentOptions.Method.apply(_controller, [_contentOptions.Params]);
                                           } : null);

            options.LayoutManager.PopupShow(_popupOptions);

            break;  //end: misc popup
    }

};  //end: OnButtonClick

CValueMessageController.prototype.SetElementViewMode = function (options) {
    var $prevActiveView = this.ActiveElement();

    var $element = $(this.DOM.Element);
    var $active = $(options.ActiveElement);

    options = util_extend({ "Mode": null, "ActiveElement": null, "IsBindEvents": false, "TrackBreadcrumb": false }, options);

    if (options.TrackBreadcrumb) {
        var _currentViewMode = this.ViewMode();

        if (_currentViewMode != options.Mode) {

            //for the new active element set the current view mode (as a breadcrumb of which view had triggered the new element view mode)
            $active.attr("data-attr-from-view-mode", _currentViewMode);
        }
    }

    $element.attr("data-attr-navigation-value-message-mode", options.Mode)
            .data("ActiveElement", options.ActiveElement);

    //check if the active element is not the current active element, in which case need to bind custom controller events
    //(since it is not a child of the containing element)
    if (options.IsBindEvents && !$active.data("is-init-controller-events")) {
        $active.data("is-init-controller-events", true);
        
        $active.off("click.controller_buttonClick");
        $active.on("click.controller_buttonClick", ".LinkClickable:not(.LinkDisabled)[data-attr-editor-controller-action-btn]", function (e, args) {
            args = util_extend({ "Trigger": this, "Event": e }, args);

            $element.trigger("events.controller_OnButtonClick", args);
        });
    }

    return $prevActiveView;
};

CValueMessageController.prototype.ActiveElement = function (options) {
    var $element = $(this.DOM.Element);

    return $($element.data("ActiveElement"));
};

CValueMessageController.prototype.ViewMode = function () {
    return util_forceInt($(this.DOM.Element).attr("data-attr-navigation-value-message-mode"), enCE.None);
};

CValueMessageController.prototype.IsViewCustomBackNavigation = function () {
    var _ret = false;
    var _viewMode = this.ViewMode();

    switch (_viewMode) {

        case enCValueMessageViewMode.CriteriaDetails:
        case enCValueMessageViewMode.StatementView:
            _ret = true;
            break;

        default:
            _ret = false;
            break;
    }

    return _ret;
};

CValueMessageController.prototype.CacheGetItem = function (options) {

    options = util_extend({ "Key": null, "Callback": null }, options);

    var _callback = function (val, isInit) {

        if (isInit) {
            $element.data("cache-" + options.Key, val);
        }

        if (options.Callback) {
            options.Callback(val);
        }
    };

    if (options.Key) {
        var $element = $(this.DOM.Element);

        var _data = $element.data("cache-" + options.Key);

        if (_data) {
            _callback(_data);
        }
        else {

            switch (options.Key) {

                case "BadgeList":
                case "BadgeListFilteredClaims":

                    var _badgeFilters = {};

                    if (options.Key == "BadgeListFilteredClaims") {
                        _badgeFilters["IsClaimGroup"] = enCETriState.Yes;
                    }

                    GlobalService.BadgeGetByForeignKey(_badgeFilters, function (badgeData) {

                        _data = (badgeData && badgeData.List ? badgeData.List : null);
                        _data = (_data || []);

                        _callback(_data, true);
                    });

                    break;  //end: BadgeList

                case "ClaimTypeList":

                    APP.Service.Action({ "c": "PluginEditor", "m": "ClaimTypeGetByForeignKey" }, function (claimTypeData) {

                        _data = (claimTypeData && claimTypeData.List ? claimTypeData.List : null);

                        _callback(_data, true);
                    });

                    break;  //end: ClaimTypeList

                default:
                    _callback();
                    break;
            }

        }
    }
    else {
        _callback();
    }
};

CValueMessageController.prototype.CacheSetItem = function (options) {
    options = util_extend({ "Key": null, "Value": null, "IsDelete": false }, options);

    if (options.Key) {
        var $element = $(this.DOM.Element);

        options.Key = "cache-" + options.Key;

        if (options.IsDelete) {
            $element.removeData(options.Key);
        }
        else {
            $element.data(options.Key, options.Value);
        }
    }
};

CValueMessageController.prototype.RenderCriteriaSelections = function (options) {

    options = util_extend({
        "EditorGroupID": enCE.None, "Controller": null, "PluginInstance": null, "Callback": null, "LayoutManager": null,
        "HtmlTemplates": {
            "CriteriaDetail": "<div class='%%CSS_CLASS%%' %%ATTR%%>" +
                              "    <div class='Label'>%%NAME%%</div>" +
                              "    <div class='Description'>%%DESCRIPTION%%</div>" +
                              "</div>"
        },
        "AnimationCallback": null
    }, options);

    var _controller = options.Controller;
    var _pluginInstance = (options.PluginInstance || _controller.PluginInstance);
    var _layoutManager = options.LayoutManager;

    var $container = $(_controller.DOM.Element);

    var $element = $container.find(".ViewEditorCriteriaSelections");

    if ($element.length == 0) {
        $element = $("<div class='ViewEditorCriteriaSelections' />");
        $container.append($element);
    }

    _controller.SetElementViewMode({ "Mode": enCValueMessageViewMode.Selections, "ActiveElement": $element });

    if (_layoutManager) {
        _layoutManager.ToolbarSetButtons({
            "IsHideEditButtons": false
        });
    }

    GlobalService.EditorGroupCriteriaGetByForeignKey({ "EditorGroupID": options.EditorGroupID, "IsPopulateCriteriaItem": true }, function (editorGroupCriteriaData) {

        var _editorGroupCriteriaList = (editorGroupCriteriaData && editorGroupCriteriaData.List ? editorGroupCriteriaData.List : null);
        var _html = "<div class='EditorDraggableContainer'>";

        _editorGroupCriteriaList = (_editorGroupCriteriaList || []);

        for (var i = 0; i < _editorGroupCriteriaList.length; i++) {            
            var _editorGroupCriteria = _editorGroupCriteriaList[i];
            var _editorCriteria = _editorGroupCriteria[enColCEEditorGroupCriteriaProperty.TempEditorCriteriaItem];
            var _tokens = {};
            var _isEditable = _editorCriteria[enColEditorCriteriaProperty.IsEditable];
            var _canDelete = _editorCriteria[enColEditorCriteriaProperty.CanDelete];

            _tokens["%%NAME%%"] = util_htmlEncode(_editorCriteria[enColEditorCriteriaProperty.Name]);
            _tokens["%%DESCRIPTION%%"] = util_htmlEncode(_editorCriteria[enColEditorCriteriaProperty.Description], true);
            _tokens["%%CSS_CLASS%%"] = "DisableUserSelectable EditorEntityItem EditorCriteriaDetail LinkClickable";
            _tokens["%%ATTR%%"] = util_htmlAttribute("data-attr-editor-criteria-id", _editorCriteria[enColEditorCriteriaProperty.EditorCriteriaID]) + " " +
                                  util_htmlAttribute("data-attr-editor-criteria-is-editable", _isEditable ? enCETriState.Yes : enCETriState.No) + " " +
                                  util_htmlAttribute("data-attr-editor-criteria-can-delete", _canDelete ? enCETriState.Yes : enCETriState.No);

            _html += util_replaceTokens(options.HtmlTemplates.CriteriaDetail, _tokens);
        }

        _html += "</div>";

        $element.data("data-list", _editorGroupCriteriaList);

        $element.html(_html);
        $mobileUtil.refresh($element);

        //configure the drag events for the editor criteria details
        _controller.Utils.Sortable({
            "Controller": _controller,
            "Containers": $element.children(".EditorDraggableContainer"), "SelectorDraggable": ".EditorCriteriaDetail",
            "DropOptions": {
                "DataAttributeIdentifier": "data-attr-editor-criteria-id", "PropertyDisplayOrder": enColEditorGroupCriteriaProperty.DisplayOrder,
                "PropertyEntityIdentifier": enColEditorGroupCriteriaProperty.EditorCriteriaID,
                "GetUpdateDataList": function (saveItem) {
                    return saveItem;
                },
                "GetDataItem": function (id, ctx, callCache) {
                    var _retDataItem = $(ctx).data("DataItem");

                    if (!_retDataItem) {

                        //retrieve it from the source data item
                        var _editorGroupCriteriaList = ($element.data("data-list") || []);

                        id = util_forceInt(id, enCE.None);

                        _retDataItem = util_arrFilter(_editorGroupCriteriaList, enColEditorGroupCriteriaProperty.EditorCriteriaID, id, true);

                        _retDataItem = (_retDataItem.length == 1 ? _retDataItem[0] : null);
                    }

                    return _retDataItem;
                }
            },
            "OnDrop": function (dropOptions) {
                dropOptions.ForceParseResult = true;
                dropOptions.SaveMethod = GlobalService.EditorGroupCriteriaReorder;
                dropOptions.SaveParams = { "Item": dropOptions.SaveList };
            }
        });

        if (!$element.data("init-events")) {
            $element.data("init-events", true);

            $element.off("click.editorCriteriaLoad");
            $element.on("click.editorCriteriaLoad", ".EditorCriteriaDetail.LinkClickable:not(.LinkDisabled)[data-attr-editor-criteria-id]", function (e, args) {
                args = util_extend({ "Callback": null, "IsAnimate": true }, args);

                var $criteria = $(this);

                $criteria.addClass("LinkDisabled");

                _controller.RenderCriteriaDetailView({
                    "Controller": _controller, "LayoutManager": _layoutManager, "Trigger": $criteria, "IsAnimate": args.IsAnimate,
                    "Callback": function () {
                        $criteria.removeClass("LinkDisabled");

                        if (args.Callback) {
                            args.Callback();
                        }
                    }
                });
            });

            $element.off("events.processButtonClick");
            $element.on("events.processButtonClick", function (e, args) {

                var $btn = $(args.Trigger);
                var _btnID = args.ButtonID;

                if (_btnID == "add_editor_criteria" || _btnID == "edit_editor_criteria") {

                    var _html = "";

                    _html += "<div class='EditorTransparentInlineConfirmation EditorAdminEditTable EditorCriteriaAdminEditTable'>";

                    _html += "<div id='divAddFromExisting' class='TableBlockRowGroupDivider' style='display: none;'>" +
                             "  <div class='Label'>" + util_htmlEncode("Select From Existing") + "</div>" +
                             "  <div class='TableBlockRow'>" +
                             "      <div class='TableBlockCell ColumnContent'>" +
                             "          <select id='ddlAddExistCriteria' disabled='disabled' data-mini='true' data-corners='false' />" +
                             "      </div>" +
                             "  </div>" +
                             "  <div class='Label'>" + util_htmlEncode("Add New") + "</div>" +
                             "</div>";

                    _html += "<div id='divCriteriaInputView'>"; //open tag #1

                    _html += "<div class='TableBlockRow'>" +
                             "  <div class='TableBlockCell ColumnHeading'>" + util_htmlEncode("Criteria Name:") + "</div>" +
                             "  <div class='TableBlockCell ColumnContent'>" +
                             "      <input disabled='disabled' type='text' data-corners='false' " +
                             util_htmlAttribute("data-attr-editor-criteria-prop", enColEditorCriteriaProperty.Name) + " />" +
                             "  </div>" +
                             "</div>";

                    _html += "<div class='TableBlockRow'>" +
                             "  <div class='TableBlockCell ColumnHeading'>" + util_htmlEncode("Criteria Description:") + "</div>" +
                             "  <div class='TableBlockCell ColumnContent'>" +
                             "      <textarea disabled='disabled' style='height: 6em;' " +
                             util_htmlAttribute("data-attr-editor-criteria-prop", enColEditorCriteriaProperty.Description) + " />" +
                             "  </div>" +
                             "</div>";

                    //value message group specific view
                    _html += "<div class='TableBlockRow' style='display: none;' " +
                             util_htmlAttribute("data-attr-foreign-type-view", enCEEditorForeignType.ValueMessageGroup) + ">" +
                             "  <div class='TableBlockRow'>" +
                             "      <div class='TableBlockCell ColumnHeading'>" + util_htmlEncode("Associate Criteria with:") + "</div>" +
                             "      <div class='TableBlockCell ColumnContent'>" +
                             "          <div " + util_htmlAttribute("data-attr-bind-prop", enColCEEditorCriteriaProperty.EditorCriteriaPlatforms) + ">" +
                             "              <div class='IndicatorSmall' />" +
                             "          </div>" +
                             "      </div>" +
                             "  </div>" +
                             "  <div class='EditorCriteriaAdminValueMessageList' " +
                             util_htmlAttribute("data-attr-bind-prop", enColCEEditorCriteriaProperty.EditorCriteriaValueMessages) + ">" +
                             "      <div class='ColumnHeading'>" + util_htmlEncode("Value Messages") + "</div>" +
                             "      <div class='TableBlockRow'>" +
                             "          <div class='TableBlockCell'>" +
                             "              <select id='ddlValueMessage' data-corners='false' data-mini='true' disabled='disabled' />" +
                             "          </div>" +
                             "          <div class='TableBlockCell' style='text-align: left;'>" +
                             "              <a id='clAddValueMessage' class='LinkClickable' data-role='button' data-icon='plus' data-theme='transparent' " + 
                             "data-mini='true' data-inline='true'>" +
                             util_htmlEncode("Add") +
                             "              </a>" +
                             "          </div>" +
                             "      </div>" +
                             "      <div class='EditorDraggableContainer EditorDraggableOn EditorCriteriaValueMessageSelections' />" +
                             "  </div>" +
                             "</div>";

                    //evidence addendum specific view
                    _html += "<div class='TableBlockRow' style='display: none;' " + util_htmlAttribute("data-attr-foreign-type-view",
                                                                                                       enCEEditorForeignType.EvidenceAddendum) + ">" +
                             "  <div class='TableBlockCell_Full'>" +
                             "      <div class='BlockElement_1'>" +
                             "          <input placeholder='Enter Region Name' type='text' data-corners='false' " +
                             util_htmlAttribute("data-attr-add-editor-criteria-file-prop", enColEditorCriteriaFileProperty.Name) + " />" +
                             "      </div>" +
                             "      <div class='BlockElement_2'>" +
                             //NOTE: although element is file upload, purposely avoiding renderer call via data attribute until end of load for animation fix
                             "          <div id='divImportAddendumFile' " +
                             util_htmlAttribute("data-attr-file-upload-exts", util_arrJoinStr(_controller.FileUploadSupportedExt || [], null, "|")) + " " +
                             util_htmlAttribute("data-attr-file-upload-ref-id", "divImportAddendumFile") + " " +
                             util_htmlAttribute("data-attr-file-upload-css-class", "EditorFileUpload") + " " +
                             util_htmlAttribute(CONTROL_FILE_UPLOAD_IS_FORCE_UPLOAD_ON_CHANGE, enCETriState.Yes) + " />" +
                             "      </div>" +
                             "      <div class='BlockElement_3'>" +
                             "          <a data-attr-foreign-type-button='add_file' class='LinkClickable' data-role='button' data-icon='plus' " +
                             "data-theme='transparent' data-inline='true' data-mini='true'>" +
                             util_htmlEncode("Add") +
                             "          </a>" +
                             "      </div>" +
                             "  </div>" +
                             "  <table border='0' cellpadding='0' cellspacing='0' class='EditorTableList'>" +
                             "      <tr class='TableHeaderRow'>" +
                             "          <td>" + util_htmlEncode("Region") + "</td>" +
                             "          <td>" + util_htmlEncode("Document Name") + "</td>" +
                             "          <td>" + util_htmlEncode("Last Updated") + "</td>" +
                             "          <td style='width: 14em;'>&nbsp;</td>" +
                             "      </tr>" +
                             "  </table>" +
                             "</div>";

                    _html += "</div>";  //close tag #1

                    _html += "</div>";

                    var _editorCriteriaID = enCE.None;

                    if (_btnID == "edit_editor_criteria") {
                        _editorCriteriaID = util_forceInt($mobileUtil.GetClosestAttributeValue($btn, "data-attr-editor-criteria-id"), enCE.None);
                    }

                    var _vwOpts = {
                        "Title": (_btnID == "add_editor_criteria" ? "Add" : "Edit") + " Criteria", "ContentHTML": _html, "SaveButtonID": "save_editor_criteria"
                    };

                    args.OnToggleEditView(true, _vwOpts, function (popupOpts) {

                        GlobalService.EditorCriteriaGetByPrimaryKey({ "EditorCriteriaID": _editorCriteriaID, "DeepLoad": true }, function (result) {

                            var _editorCriteria = (result || {});
                            var $popupContainer = $(popupOpts.Container);
                            var $divImportAddendumFile = $popupContainer.find("#divImportAddendumFile");

                            $popupContainer.find(".EditorAdminEditTable")
                                           .data("DataItem", _editorCriteria);

                            var _editorForeignTypeID = util_forceInt(_editorCriteria[enColEditorCriteriaProperty.EditorForeignTypeID], enCE.None);

                            if (_editorForeignTypeID == enCE.None) {

                                //force default view to be value message group
                                _editorForeignTypeID = enCEEditorForeignType.ValueMessageGroup;
                                _editorCriteria[enColEditorCriteriaProperty.EditorForeignTypeID] = _editorForeignTypeID;
                            }

                            if (_editorForeignTypeID == enCEEditorForeignType.ValueMessageGroup &&
                                util_forceInt(_editorCriteria[enColEditorCriteriaProperty.EditorCriteriaID], enCE.None) == enCE.None) {

                                //for new entry of value message group, add the the current platform as an associated platform (default value)
                                var _currentPlatformID = util_forceInt($mobileUtil.GetClosestAttributeValue($btn, "data-home-editor-group-platform-id"), enCE.None);

                                if (_currentPlatformID != enCE.None) {
                                    var _search = util_arrFilter(_editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaPlatforms],
                                                                 enColEditorCriteriaPlatformProperty.PlatformID,
                                                                 _currentPlatformID, true);

                                    if (_search.length == 0) {
                                        var _editorCriteriaPlatform = new CEEditorCriteriaPlatform();

                                        _editorCriteriaPlatform[enColEditorCriteriaPlatformProperty.PlatformID] = _currentPlatformID;

                                        var _editorCriteriaPlatformList = _editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaPlatforms];

                                        if (!_editorCriteriaPlatformList) {
                                            _editorCriteriaPlatformList = [];
                                            _editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaPlatforms] = _editorCriteriaPlatformList;
                                        }

                                        _editorCriteriaPlatformList.push(_editorCriteriaPlatform);
                                    }

                                    var _editorGroupForeignPermissions = _controller.Utils.Managers.Data.InitEditorGroupForeignPermissionList({
                                        "PlatformID": _currentPlatformID,
                                        "ComponentID": _controller.Utils.ContextEditorGroupComponentID($popupContainer),
                                        "BridgeItemEditorForeignTypeID": enCEEditorForeignType.TableEditorCriteria,
                                        "EditorForeignTypeID": enCEEditorForeignType.SubDossier,
                                        "List": _editorCriteria[enColCEEditorCriteriaProperty.EditorGroupForeignPermissions]
                                    });

                                    _editorCriteria[enColCEEditorCriteriaProperty.EditorGroupForeignPermissions] = _editorGroupForeignPermissions;
                                }

                                $popupContainer.find("#divAddFromExisting").toggle(true);
                            }

                            $popupContainer.find("[" + util_htmlAttribute("data-attr-foreign-type-view", _editorForeignTypeID) + "]")
                                           .show();

                            $popupContainer.off("click.foreign_button");
                            $popupContainer.on("click.foreign_button", "[data-attr-foreign-type-button]", function (e, args) {

                                var $btn = $(this);
                                var _btnID = $btn.attr("data-attr-foreign-type-button");

                                switch (_btnID) {

                                    case "add_file":
                                        var $tbName = $popupContainer.find("[" + util_htmlAttribute("data-attr-add-editor-criteria-file-prop",
                                                                                                    enColEditorCriteriaFileProperty.Name) + "]");
                                        var _name = util_trim($tbName.val());

                                        ClearMessages();

                                        $tbName.val(_name);

                                        if (_name == "") {
                                            AddUserError("Region Name is required.");
                                        }

                                        var _lastUploaded = $divImportAddendumFile.data("LastUploadedFile");

                                        if (!_lastUploaded) {
                                            AddUserError("File is required.");
                                        }

                                        if (MessageCount() == 0) {
                                            var _criteriaFile = new CEEditorCriteriaFile_JSON();
                                            var _file = new CEFile_JSON();

                                            _file[enColFileProperty.Name] = _lastUploaded["OriginalFileName"];
                                            _file[enColCEFile_JSONProperty.UploadFileName] = _lastUploaded["UploadFileName"];

                                            _criteriaFile[enColEditorCriteriaFileProperty.Name] = _name;
                                            _criteriaFile[enColEditorCriteriaFileProperty.FileIDName] = _file[enColFileProperty.Name];
                                            _criteriaFile[enColCEEditorCriteriaFile_JSONProperty.TempFileItem] = _file;
                                            _criteriaFile[enColEditorCriteriaFileProperty.FileDateModified] = _file[enColFileProperty.DateModified];

                                            $btn.trigger("events.appendCriteriaFileRow", {
                                                "CriteriaFile": _criteriaFile, "DownloadURL": _lastUploaded["PreviewFileURL"], "Callback": function (addResult) {

                                                    //clear all user input values and file upload control (without deleting the temp uploaded file)
                                                    $tbName.val("");
                                                    $divImportAddendumFile.trigger("events.fileUpload_clear");
                                                }
                                            });
                                        }

                                        break;
                                }

                            }); //end: click.foreign_button

                            $popupContainer.off("remove.cleanup");
                            $popupContainer.on("remove.cleanup", function (e, args) {
                                var _uploads = ($popupContainer.data("uploads-cleanup") || {});
                                var _arr = [];

                                for (var _fileName in _uploads) {
                                    _arr.push(_fileName);
                                }

                                if (_arr.length) {
                                    GlobalService.UserTempFileUploadCleanup(_arr);
                                }
                            });

                            $popupContainer.off("events.onFileUploadSuccess");
                            $popupContainer.on("events.onFileUploadSuccess", function (e, args) {

                                args = util_extend({ "UploadOptions": null }, args);

                                var _uploads = $popupContainer.data("uploads-cleanup");
                                var _uploadOpts = args.UploadOptions;

                                if (!_uploads) {
                                    _uploads = {};
                                    $popupContainer.data("uploads-cleanup", _uploads);
                                }

                                _uploads[_uploadOpts.UploadFileName] = true;

                                if (_uploadOpts["PreviousUploadFileName"]) {
                                    delete _uploads[_uploadOpts.PreviousUploadFileName];
                                }

                            });

                            $divImportAddendumFile.data(CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK, function (uploadOpts) {

                                $popupContainer.trigger("events.onFileUploadSuccess", { "UploadOptions": uploadOpts });
                                $divImportAddendumFile.data("LastUploadedFile", uploadOpts);
                            });

                            $divImportAddendumFile.data("OnFileUploadClear", function (optsClear) {
                                optsClear = util_extend({ "Callback": null }, optsClear);

                                //remove the last uploaded file data flag
                                $divImportAddendumFile.removeData("LastUploadedFile");

                                if (optsClear.Callback) {
                                    optsClear.Callback();
                                }
                            });

                            $.each($popupContainer.find("[data-attr-editor-criteria-prop]"), function () {
                                var $prop = $(this);
                                var _propName = $prop.attr("data-attr-editor-criteria-prop");
                                var _val = _editorCriteria[_propName];

                                switch (_propName) {

                                    case enColEditorCriteriaProperty.Name:
                                    case enColEditorCriteriaProperty.Description:

                                        _val = util_forceString(_val);

                                        $prop.val(_val)
                                             .textinput("enable");
                                        break;
                                }
                            });

                            if (_editorForeignTypeID == enCEEditorForeignType.EvidenceAddendum) {

                                //bind the file list table
                                var $tbl = $popupContainer.find("[" + util_htmlAttribute("data-attr-foreign-type-view", _editorForeignTypeID) + "] .EditorTableList");
                                var _fileRowsHTML = "";

                                var _criteriaFiles = (_editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaFiles] || []);
                                var _fnGetCriteriaFileRowHTML = function (criteriaFile, downloadURL) {
                                    var _rowHTML = "";

                                    var _fileID = util_forceInt(criteriaFile[enColEditorCriteriaFileProperty.FileID], enCE.None);
                                    var _attrID = "";

                                    if (_fileID == enCE.None) {

                                        //configure default temp ID
                                        var _tempID = util_forceInt($tbl.data("temp-id"), 1) + 1;

                                        _attrID = util_htmlAttribute("data-attr-editor-critera-temp-file-id", _tempID);

                                        $tbl.data("temp-id", _tempID);
                                    }
                                    else {
                                        _attrID = util_htmlAttribute("data-attr-editor-critera-file-id", _fileID);
                                    }

                                    var _link = util_htmlEncode(criteriaFile[enColEditorCriteriaFileProperty.FileIDName]);

                                    if (downloadURL) {
                                        _link = "<a data-role='none' data-rel='external' target='_blank' " + util_htmlAttribute("href", downloadURL) + ">" +
                                                _link +
                                                "</a>";
                                    }

                                    _rowHTML += "<tr class='TableRowItem' " + _attrID + ">" +
                                                "   <td " + util_htmlAttribute("data-attr-criteria-file-prop", enColEditorCriteriaFileProperty.Name) + ">" +
                                                "       <span class='Label'>" + util_htmlEncode(criteriaFile[enColEditorCriteriaFileProperty.Name]) + "</span>" +
                                                "   </td>" +
                                                "   <td " + util_htmlAttribute("data-attr-criteria-file-prop", enColEditorCriteriaFileProperty.FileIDName) + ">" +
                                                _link +
                                                "</td>" +
                                                "   <td style='text-align: center;'>" +
                                                util_htmlEncode(_controller.Utils.FormatDateTime(criteriaFile[enColEditorCriteriaFileProperty.FileDateModified])) +
                                                "   </td>" +
                                                "   <td>" +
                                                "       <div class='EditToolButtons' style='text-align: center;'>" +
                                                "           <a class='LinkClickable' data-role='button' data-icon='edit' data-inline='true' data-mini='true' " +
                                                "data-theme='transparent' data-attr-row-action-btn='edit'>" +
                                                util_htmlEncode("Edit") +
                                                "           </a>" +
                                                "           <a class='LinkClickable' data-role='button' data-icon='delete' data-inline='true' data-mini='true' " +
                                                "data-theme='transparent' data-attr-row-action-btn='delete'>" +
                                                util_htmlEncode("Delete") +
                                                "           </a>" +
                                                "       </div>" +
                                                "   </td>" +
                                                "</tr>";

                                    return _rowHTML;

                                };  //end: _fnGetCriteriaFileRowHTML

                                for (var i = 0; i < _criteriaFiles.length; i++) {
                                    var _criteriaFile = _criteriaFiles[i];
                                    var _fileURL = _controller.Utils.ConstructDownloadURL({
                                        "TypeID": "editor", "Item": _criteriaFile, "Property": enColEditorCriteriaFileProperty.FileID
                                    });

                                    _fileRowsHTML += _fnGetCriteriaFileRowHTML(_criteriaFile, _fileURL);
                                }

                                $tbl.append(_fileRowsHTML)
                                    .trigger("create");

                                $tbl.data("SourceCriteriaFiles", _criteriaFiles);

                                $tbl.off("click.row_buttonAction");
                                $tbl.on("click.row_buttonAction", ".LinkClickable:not(.LinkDisabled)[data-attr-row-action-btn]", function (e, args) {
                                    var $btn = $(this);
                                    var $row = $btn.closest(".TableRowItem[data-attr-editor-critera-file-id], .TableRowItem[data-attr-editor-critera-temp-file-id]");
                                    var _btnID = $btn.attr("data-attr-row-action-btn");

                                    var _fnGetRowEditorCriteriaFileItem = function (objRow) {

                                        var $objRow = $(objRow);
                                        var _item = $objRow.data("DataItem");

                                        if (!_item) {
                                            _item = util_arrFilter($objRow.closest(".EditorTableList").data("SourceCriteriaFiles"),
                                                                   enColEditorCriteriaFileProperty.FileID,
                                                                   util_forceInt($objRow.attr("data-attr-editor-critera-file-id"), enCE.None), true);

                                            _item = _item[0];
                                        }

                                        return _item;

                                    };  //end: _fnGetRowEditorCriteriaFileItem

                                    switch (_btnID) {

                                        case "delete":
                                            var $btnContainer = $btn.closest(".EditToolButtons");

                                            util_inlineConfirm({
                                                "Target": $btnContainer, "OnPositiveClick": function () {
                                                    $row.addClass("DeletedItem");

                                                    if ($btnContainer.find("[data-attr-row-action-btn='undo']").length == 0) {
                                                        $btnContainer.append("<a class='LinkClickable' data-role='button' data-icon='back' data-inline='true' " +
                                                                             "data-mini='true' data-theme='transparent' data-attr-row-action-btn='undo'>" +
                                                                             util_htmlEncode("Undo") +
                                                                             "</a>")
                                                                     .trigger("create");
                                                    }

                                                    var $btns = $btnContainer.find(".LinkClickable");

                                                    $btns.not("[data-attr-row-action-btn='undo']").hide();
                                                    $btns.filter("[data-attr-row-action-btn='undo']").show();
                                                }
                                            });

                                            break;  //delete

                                        case "undo":

                                            var $btnContainer = $btn.closest(".EditToolButtons");

                                            $row.removeClass("DeletedItem");

                                            $btnContainer.find(".LinkClickable").show();
                                            $btn.hide();
                                            $btnContainer.show();

                                            break;  //end: undo

                                        case "edit":
                                        case "save":
                                            var _isEdit = (_btnID == "edit");
                                            var $props = $row.find("[data-attr-criteria-file-prop]");
                                            var $btns = $btn.closest(".EditToolButtons").find(".LinkClickable[data-attr-row-action-btn]");

                                            var _editorCriteriaFile = _fnGetRowEditorCriteriaFileItem($row);

                                            if (!_isEdit) {

                                                ClearMessages();

                                                var $propName = $props.filter("[" + util_htmlAttribute("data-attr-criteria-file-prop",
                                                                                                       enColEditorCriteriaFileProperty.Name) + "]");
                                                var $propFileName = $props.filter("[" + util_htmlAttribute("data-attr-criteria-file-prop",
                                                                                                           enColEditorCriteriaFileProperty.FileIDName) +
                                                                                  "]");

                                                var $tbName = $propName.find("[" + util_htmlAttribute("data-attr-criteria-file-prop-input",
                                                                                                      enCETriState.Yes) + "] input[type='text']");
                                                var $tbFileName = $propFileName.find("[" + util_htmlAttribute("data-attr-criteria-file-prop-input", enCETriState.Yes) +
                                                                                     "] input[type='text']");

                                                var _edits = {
                                                    "Name": util_trim($tbName.val()),
                                                    "FileName": util_trim($tbFileName.val())
                                                };

                                                $tbName.val(_edits.Name);
                                                $tbFileName.val(_edits.FileName);

                                                if (_edits.Name == "") {
                                                    AddUserError("Region Name is required.");
                                                }
                                                else {
                                                    _editorCriteriaFile[enColEditorCriteriaFileProperty.Name] = _edits.Name;
                                                }

                                                if (_edits.FileName == "") {
                                                    AddUserError("Document Name is required.");
                                                }

                                                if (MessageCount() != 0) {
                                                    return;
                                                }
                                                else {

                                                    _editorCriteriaFile[enColEditorCriteriaFileProperty.FileIDName] = _edits.FileName;

                                                    //update the display name on the file item as well (only if it is modified)
                                                    var _fileItem = _editorCriteriaFile[enColCEEditorCriteriaFile_JSONProperty.TempFileItem];

                                                    if (!_fileItem) {
                                                        var _editItem = $row.closest(".EditorAdminEditTable").data("DataItem");

                                                        _fileItem = util_arrFilter(_editItem[enColCEEditorCriteria_JSONProperty.FileList], enColFileProperty.FileID,
                                                                                   util_forceInt($row.attr("data-attr-editor-critera-file-id"), enCE.None), true);

                                                        _fileItem = _fileItem[0];
                                                    }

                                                    if (_fileItem[enColFileProperty.Name] != _edits.FileName) {
                                                        _fileItem[enColFileProperty.Name] = _edits.FileName;
                                                        _editorCriteriaFile[enColCEEditorCriteriaFile_JSONProperty.TempFileItem] = _fileItem;
                                                    }

                                                    $propName.children(".Label").text(_edits.Name);
                                                    $propFileName.children("a[data-rel='external']").text(_edits.FileName);
                                                }
                                            }

                                            $.each($props, function () {
                                                var $propCell = $(this);
                                                var _prop = $propCell.attr("data-attr-criteria-file-prop");
                                                var $input = $propCell.find("[" + util_htmlAttribute("data-attr-criteria-file-prop-input", enCETriState.Yes) + "]");
                                                var _propVal = _editorCriteriaFile[_prop];

                                                if (_isEdit && $input.length == 0) {
                                                    var _inputAttr = util_htmlAttribute("data-attr-criteria-file-prop-input", enCETriState.Yes);
                                                    var _maxLength = null;
                                                    var _hasFileUpload = false;

                                                    if (_prop == enColEditorCriteriaFileProperty.FileIDName) {
                                                        _maxLength = 255;
                                                        _hasFileUpload = $row.is("[data-attr-editor-critera-file-id]");
                                                    }

                                                    $input = $("<div " + _inputAttr + ">" +
                                                               "    <input type='text' " + _inputAttr +
                                                               (_maxLength ? " " + util_htmlAttribute("maxlength", _maxLength) : "") + " />" +
                                                               (_hasFileUpload ? "<a class='LinkClickable ReplaceFileToggle' data-role='button' " +
                                                                                 "data-theme='transparent' data-mini='true' data-attr-row-action-btn='replace_file' " +
                                                                                 "data-icon='arrow-d' data-iconpos='right'>" +
                                                                                 util_htmlEncode("Replace File...") +
                                                                                 "</a>"
                                                                               : "") +
                                                               "</div>");

                                                    $propCell.append($input)
                                                             .trigger("create");
                                                }
                                                else {
                                                    $input.toggle(_isEdit);
                                                }

                                                if (_isEdit && (_prop == enColEditorCriteriaFileProperty.Name || _prop == enColEditorCriteriaFileProperty.FileIDName)) {
                                                    $input.find("input[type='text']").val(util_forceString(_propVal));
                                                }
                                            });

                                            $btns.not($btn).toggleClass("LinkDisabled", _isEdit);
                                            $mobileUtil.ButtonSetTextByElement($btn, _isEdit ? "Save" : "Edit");
                                            $mobileUtil.ButtonUpdateIcon($btn, _isEdit ? "check" : "edit");

                                            $btn.attr("data-attr-row-action-btn", _isEdit ? "save" : "edit");

                                            break;  //end: edit, save

                                        case "replace_file":

                                            var $fileUpload = $btn.next("[" + util_renderAttribute("file_upload") + "]");

                                            if ($fileUpload.length == 0) {
                                                var _tempFileUploadID = "divReplaceFile_" + $row.attr("data-attr-editor-critera-file-id");

                                                $fileUpload = $("<div " + util_htmlAttribute("id", _tempFileUploadID) + " " + util_renderAttribute("file_upload") + " " +
                                                                util_htmlAttribute("data-attr-file-upload-exts",
                                                                                   util_arrJoinStr(_controller.FileUploadSupportedExt || [], null, "|")) + " " +
                                                                util_htmlAttribute("data-attr-file-upload-ref-id", _tempFileUploadID) + " " +
                                                                util_htmlAttribute("data-attr-file-upload-css-class", "EditorFileUpload") + " " +
                                                                util_htmlAttribute(CONTROL_FILE_UPLOAD_IS_FORCE_UPLOAD_ON_CHANGE, enCETriState.Yes) + " />");

                                                $fileUpload.data(CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK, function (uploadOpts) {

                                                    $fileUpload.trigger("events.onFileUploadSuccess", { "UploadOptions": uploadOpts });

                                                    var $parent = $fileUpload.closest("[" + util_htmlAttribute("data-attr-criteria-file-prop",
                                                                                                               enColEditorCriteriaFileProperty.FileIDName) + "]");

                                                    var _originalFileName = uploadOpts["OriginalFileName"];

                                                    $parent.find("a[data-rel='external']")
                                                           .text(_originalFileName)
                                                           .attr("href", uploadOpts["PreviewFileURL"]);

                                                    $parent.find("[" + util_htmlAttribute("data-attr-criteria-file-prop-input",
                                                                                          enCETriState.Yes) + "] input[type='text']")
                                                           .val(_originalFileName);

                                                    var _editorCriteriaFile = _fnGetRowEditorCriteriaFileItem($row);
                                                    var _fileItem = _editorCriteriaFile[enColCEEditorCriteriaFile_JSONProperty.TempFileItem];

                                                    if (!_fileItem) {
                                                        var _editItem = $parent.closest(".EditorAdminEditTable").data("DataItem");

                                                        _fileItem = util_arrFilter(_editItem[enColCEEditorCriteria_JSONProperty.FileList], enColFileProperty.FileID,
                                                                                   util_forceInt($row.attr("data-attr-editor-critera-file-id"), enCE.None), true);

                                                        _fileItem = _fileItem[0];

                                                        _editorCriteriaFile[enColCEEditorCriteriaFile_JSONProperty.TempFileItem] = _fileItem;
                                                    }

                                                    _fileItem[enColFileProperty.Name] = _originalFileName;
                                                    _fileItem[enColCEFile_JSONProperty.UploadFileName] = uploadOpts["UploadFileName"];

                                                    $fileUpload.trigger("events.fileUpload_clear");
                                                });

                                                var $parent = $btn.closest("[data-attr-criteria-file-prop-input]");

                                                $parent.append($fileUpload);
                                                $mobileUtil.refresh($parent);
                                            }
                                            else {
                                                $fileUpload.toggle();
                                            }

                                            $mobileUtil.ButtonUpdateIcon($btn, $fileUpload.is(":visible") ? "arrow-u" : "arrow-d");

                                            break;  //end: replace_file
                                    }
                                });

                                var _selectorInputFileName = "[" + util_htmlAttribute("data-attr-criteria-file-prop",
                                                                                      enColEditorCriteriaFileProperty.FileIDName) + "] " +
                                                             "[" + util_htmlAttribute("data-attr-criteria-file-prop-input", enCETriState.Yes) + "] input[type='text']";

                                $tbl.off("focus.row_editFileName");
                                $tbl.on("focus.row_editFileName", _selectorInputFileName,
                                        function (e, args) {
                                            var $this = $(this);

                                            try {
                                                var _str = util_forceString($this.val());
                                                var _index = _str.lastIndexOf(".");

                                                if (_index < 0) {
                                                    _index = _str.length;
                                                }

                                                var _this = this;

                                                //HACK
                                                setTimeout(function () {
                                                    _this.setSelectionRange(0, _index);
                                                }, 0);

                                            } catch (e) {
                                                try {
                                                    this.select();
                                                } catch (e) {
                                                }
                                            }
                                        });

                                $tbl.off("blur.row_editFileName");
                                $tbl.on("blur.row_editFileName", _selectorInputFileName,
                                        function (e, args) {

                                            var $this = $(this);
                                            var $parent = $this.closest("[data-attr-criteria-file-prop]");
                                            var _link = $parent.find("a[data-rel='external']");
                                            var _name = util_trim(_link.text());

                                            var _ext = "";
                                            var _index = _name.lastIndexOf(".");

                                            if (_index > 0) {
                                                _ext = _name.substr(_index);
                                            }

                                            var _str = util_trim($this.val());

                                            if (_str != "" && _ext != "") {
                                                var _search = _str.toLowerCase().lastIndexOf(_ext.toLowerCase());

                                                if (_search < 0 || _search != (_str.length - _ext.length)) {
                                                    _str += _ext;
                                                }
                                            }

                                            $this.val(_str);

                                        });

                                $popupContainer.off("events.appendCriteriaFileRow");
                                $popupContainer.on("events.appendCriteriaFileRow", function (e, args) {

                                    args = util_extend({ "CriteriaFile": null, "Callback": null, "DownloadURL": null }, args);

                                    var $row = $(_fnGetCriteriaFileRowHTML(args.CriteriaFile, args.DownloadURL));

                                    $tbl.append($row)
                                        .trigger("create");

                                    $row.data("DataItem", args.CriteriaFile);

                                    if (args.Callback) {
                                        args.Callback({ "Element": $row });
                                    }
                                });

                                $divImportAddendumFile.attr(DATA_ATTRIBUTE_RENDER, "file_upload");
                                $mobileUtil.RenderRefresh($divImportAddendumFile, true);
                            }
                            else {
                                var _editorGroupID = util_forceInt($mobileUtil.GetClosestAttributeValue($popupContainer, "data-attr-home-editor-group-id"), enCE.None);
                                var _platforms = $popupContainer.data("cache-platforms_" + _editorGroupID);

                                var _fnBindExistingCriteriaDDL = function () {

                                    if (util_forceInt(_editorCriteria[enColEditorCriteriaProperty.EditorCriteriaID], enCE.None) != enCE.None) {
                                        return;
                                    }

                                    var $ddlAddExistCriteria = $popupContainer.find("#ddlAddExistCriteria");

                                    GlobalService.EditorCriteriaGetByForeignKey({ "FilterPermissionEditorGroupID": _editorGroupID }, function (criteriaData) {
                                        var _criteriaList = (criteriaData ? criteriaData.List : null);

                                        _criteriaList = (_criteriaList || []);

                                        $ddlAddExistCriteria.selectmenu("enable");

                                        util_dataBindDDL($ddlAddExistCriteria, _criteriaList, enColEditorCriteriaProperty.Name,
                                                         enColEditorCriteriaProperty.EditorCriteriaID,
                                                         util_forceInt($ddlAddExistCriteria.val(), enCE.None), true, enCE.None, "");

                                        var $divCriteriaInputView = $popupContainer.find("#divCriteriaInputView");

                                        $ddlAddExistCriteria.off("change.selection");
                                        $ddlAddExistCriteria.on("change.selection", function () {
                                            var _val = util_forceInt($ddlAddExistCriteria.val(), enCE.None);

                                            if (!$ddlAddExistCriteria.data("is-init")) {
                                                $ddlAddExistCriteria.data("is-init", true);
                                                $divCriteriaInputView.append("<div class='EditorOverlayUserInteraction' />");
                                            }

                                            $divCriteriaInputView.toggleClass("EditorDisableUserInteraction", _val != enCE.None);
                                        });
                                    });

                                };  //end: _fnBindExistingCriteriaDDL

                                var _fnBindValueMessageDDL = function () {

                                    var $tblValueMessage = $popupContainer.find(".EditorCriteriaAdminValueMessageList");
                                    var $ddlValueMessage = $tblValueMessage.find("#ddlValueMessage");
                                    var $clAddValueMessage = $tblValueMessage.find("#clAddValueMessage");
                                    var $vwValueMessageSelection = $tblValueMessage.find(".EditorCriteriaValueMessageSelections");

                                    $tblValueMessage.off("events.renderList");
                                    $tblValueMessage.on("events.renderList", function (e, args) {
                                        args = util_extend({ "List": null, "ValueMessageList": null }, args);

                                        var _list = (args.List || []);
                                        var _lookup = $tblValueMessage.data("lookup-vm");

                                        if (!_lookup) {
                                            _lookup = {};
                                            $tblValueMessage.data("lookup-vm", _lookup);
                                        }

                                        var _valueMessages = (args.ValueMessageList || []);

                                        for (var v = 0; v < _valueMessages.length; v++) {
                                            var _valueMessage = _valueMessages[v];
                                            var _valueMessageID = _valueMessage[enColValueMessageProperty.ValueMessageID];

                                            _lookup[_valueMessageID] = _valueMessage;
                                        }

                                        var _listHtml = "";

                                        for (var i = 0; i < _list.length; i++) {
                                            var _criteriaValueMessage = _list[i];
                                            var _valueMessageID = _criteriaValueMessage[enColEditorCriteriaValueMessageProperty.ValueMessageID];

                                            _listHtml += "<div class='DisableUserSelectable PluginEditorCardView TableBlockRow ValueMessageEditView' " +
                                                         util_htmlAttribute("data-attr-editor-criteria-vm-id", _valueMessageID) + ">" +
                                                         "  <div class='TableBlockCell'>" +
                                                         "      <div class='Title'>" +
                                                         util_htmlEncode(_criteriaValueMessage[enColEditorCriteriaValueMessageProperty.ValueMessageIDName]) +
                                                         "      </div>" +
                                                         "  </div>" +
                                                         "  <div class='DisableDragElement HiddenDragElement TableBlockCell'>" +
                                                         "      <a class='LinkClickable' data-role='button' data-icon='delete' data-theme='transparent' " +
                                                         "data-mini='true' data-inline='true'>" +
                                                         util_htmlEncode("Remove") +
                                                         "      </a>" +
                                                         "  </div>" +
                                                         "</div>";
                                        }

                                        if (_listHtml != "") {
                                            var $temp = $(_listHtml);

                                            $temp.hide();

                                            $vwValueMessageSelection.append($temp);
                                            $mobileUtil.refresh($temp);

                                            $temp.toggle("height");
                                        }

                                    }); //end: events.renderList

                                    $vwValueMessageSelection.off("click.remove");
                                    $vwValueMessageSelection.on("click.remove", ".DisableDragElement.TableBlockCell .LinkClickable:not(.LinkDisabled)", function () {
                                        var $btn = $(this);
                                        var $vmParent = $btn.closest(".ValueMessageEditView");

                                        $vmParent.addClass("EditorTransparentInlineConfirmation InlineConfirmationMode");

                                        util_inlineConfirm({
                                            "Target": $btn, "OnPositiveClick": function () {

                                                $btn.addClass("LinkDisabled");

                                                $vmParent.removeAttr("data-attr-editor-criteria-vm-id");

                                                $vmParent.toggle("height", function () {
                                                    $vmParent.remove();

                                                    $ddlValueMessage.trigger("change.selection");
                                                });
                                            }, "OnNegativeClick": function () {
                                                $vmParent.removeClass("InlineConfirmationMode");
                                            }
                                        });

                                    }); //end: click.remove

                                    $ddlValueMessage.off("change.selection");
                                    $ddlValueMessage.on("change.selection", function () {
                                        var _hasValue = (util_forceInt($(this).val(), enCE.None) != enCE.None);

                                        $clAddValueMessage.toggleClass("LinkDisabled", !_hasValue);
                                    });

                                    $clAddValueMessage.off("click.add_vm");
                                    $clAddValueMessage.on("click.add_vm", function () {
                                        if (!$clAddValueMessage.hasClass("LinkDisabled")) {
                                            var _valueMessageID = util_forceInt($ddlValueMessage.val(), enCE.None);

                                            ClearMessages();

                                            //check if it already exists
                                            var $search = $tblValueMessage.find(".ValueMessageEditView[" + util_htmlAttribute("data-attr-editor-criteria-vm-id",
                                                                                                                              _valueMessageID) + "]");

                                            if ($search.length == 1) {
                                                AddUserError("Value Message already exists within the current selections.", {
                                                    "IsTimeout": true, "IsDurationLong": true
                                                });
                                            }
                                            else {
                                                $clAddValueMessage.addClass("LinkDisabled");    //disable the add link since value message will now be added to selection

                                                var _item = new CEEditorCriteriaValueMessage();
                                                var _lookup = ($tblValueMessage.data("lookup-vm") || {});
                                                var _valueMessage = (_lookup[_valueMessageID] || {});

                                                _item[enColEditorCriteriaValueMessageProperty.ValueMessageID] = _valueMessageID;
                                                _item[enColEditorCriteriaValueMessageProperty.ValueMessageIDName] = _valueMessage[enColValueMessageProperty.Name];

                                                $tblValueMessage.trigger("events.renderList", { "List": [_item] });

                                                $mobileUtil.SetDropdownListValue($ddlValueMessage, enCE.None);
                                            }
                                        }

                                    }); //end: click.add_vm

                                    if (!$vwValueMessageSelection.data("is-init-events")) {
                                        $vwValueMessageSelection.data("is-init-events", true);

                                        _controller.Utils.Sortable({
                                            "Controller": _controller, "Containers": $vwValueMessageSelection, "DropOptions": { "IsDisableDropEvent": true },
                                            "SelectorDraggable": ".ValueMessageEditView"
                                        });
                                    }

                                    GlobalService.ValueMessageGetByForeignKey({
                                        "FilterPermissionEditorGroupID": _editorGroupID, "SortColumn": enColValueMessage.Name
                                    }, function (valueMessageData) {
                                        var _valueMessages = (valueMessageData && valueMessageData.List ? valueMessageData.List : null);

                                        _valueMessages = (_valueMessages || []);

                                        $ddlValueMessage.trigger("change.selection");

                                        util_dataBindDDL($ddlValueMessage, _valueMessages, enColValueMessageProperty.Name, enColValueMessageProperty.ValueMessageID,
                                                         enCE.None, true, enCE.None, "");

                                        $ddlValueMessage.selectmenu("enable");

                                        var _criteriaValueMessages = (_editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaValueMessages] || []);

                                        $vwValueMessageSelection.data("SourceCriteriaValueMessages", _criteriaValueMessages);

                                        $tblValueMessage.trigger("events.renderList", {
                                            "List": _criteriaValueMessages, "ValueMessageList": _valueMessages
                                        });
                                    });

                                };  //end: _fnBindValueMessageDDL

                                var _fnBindPlatformsView = function () {

                                    var _platformsHTML = "";

                                    var _editorCriteriaPlatforms = (_editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaPlatforms] || []);
                                    var _editorGroupForeignPermissions = (_editorCriteria[enColCEEditorCriteriaProperty.EditorGroupForeignPermissions] || []);

                                    var _componentID = _controller.Utils.ContextEditorGroupComponentID($popupContainer);

                                    for (var p = 0; p < _platforms.length; p++) {
                                        var _platform = _platforms[p];
                                        var _selected = (util_arrFilter(_editorCriteriaPlatforms, enColEditorCriteriaPlatformProperty.PlatformID,
                                                                        _platform[enColPlatformProperty.PlatformID], true).length == 1);

                                        _platformsHTML += "<div class='FlipSwitchInline LinkClickable'>" +
                                                          " <div " + util_renderAttribute("flip_switch") +
                                                          (_selected ? " " + util_htmlAttribute(DATA_ATTR_DEFAULT_VALUE, enCETriState.Yes) : "") +
                                                          " data-corners='false' data-mini='true' style='display: inline-block;' " +
                                                          util_htmlAttribute("data-attr-platform-toggle-id", _platform[enColPlatformProperty.PlatformID]) + "/>" +
                                                          " <div class='Label'>" + _pluginInstance.Utils.ForceEntityDisplayName({
                                                              "Type": "Platform", "Item": _platform
                                                          }) + "</div>";

                                        _platformsHTML += _controller.Utils.Managers.Data.InlineEditorGroupSwitchHTML({
                                            "PlatformID": _platform[enColPlatformProperty.PlatformID],
                                            "ComponentID": _componentID,
                                            "EditorForeignTypeID": enCEEditorForeignType.SubDossier,
                                            "BridgeList": _editorGroupForeignPermissions
                                        });

                                        _platformsHTML += "</div>";
                                    }

                                    var $vwPlatforms = $popupContainer.find("[" + util_htmlAttribute("data-attr-bind-prop",
                                                                                                     enColCEEditorCriteriaProperty.EditorCriteriaPlatforms) + "]");

                                    $vwPlatforms.hide()
                                                .html(_platformsHTML);

                                    $mobileUtil.refresh($vwPlatforms);

                                    $vwPlatforms.find("[" + DATA_ATTR_DEFAULT_VALUE + "]")
                                                .removeAttr(DATA_ATTR_DEFAULT_VALUE);

                                    _controller.Utils.BindFlipSwitchEvents({ "Element": $vwPlatforms });

                                    $vwPlatforms.toggle("height");

                                    $popupContainer.data("SourceCriteriaPlatforms", _editorCriteriaPlatforms)   //persist the source criteria platforms list
                                                   .data("SourceCriteriaEditorGroupForeignPermissions", _editorGroupForeignPermissions);

                                    _fnBindValueMessageDDL();
                                    _fnBindExistingCriteriaDDL();

                                };  //end: _fnBindPlatformsView

                                if (!_platforms) {

                                    _pluginInstance.GetData({
                                        "Type": "PlatformList", "Filters": {
                                            "FilterEditorGroupID": _editorGroupID,
                                            "SortColumn": enColPlatformProperty.DisplayOrder
                                        }
                                    }, function (dataResult) {
                                        _platforms = (dataResult && dataResult.Success && dataResult.Data ? dataResult.Data.List : null);
                                        _platforms = (_platforms || []);

                                        $popupContainer.data("cache-platforms_" + _editorGroupID, _platforms);

                                        _fnBindPlatformsView();
                                    });

                                }
                                else {
                                    _fnBindPlatformsView();
                                }
                            }

                            $popupContainer.off("events.populateItem");
                            $popupContainer.on("events.populateItem", function (e, args) {
                                args = util_extend({ "Item": null, "IsAddExisting": false, "Callback": null }, args);

                                var _item = args.Item;

                                if (args.IsAddExisting) {

                                    //existing criteria being added to the editor group, verify and configure the required values
                                    if (util_forceInt(_item[enColEditorGroupCriteriaProperty.EditorCriteriaID], enCE.None) == enCE.None) {
                                        AddUserError("Please select the criteria to add.");
                                    }

                                    _item[enColEditorGroupCriteriaProperty.EditorGroupID] = util_forceInt($mobileUtil.GetClosestAttributeValue($popupContainer,
                                                                                                          "data-attr-home-editor-group-id"), enCE.None);
                                }
                                else {
                                    var _editorForeignTypeID = util_forceInt(_item[enColEditorCriteriaProperty.EditorForeignTypeID]);

                                    if (_editorForeignTypeID == enCEEditorForeignType.EvidenceAddendum) {
                                        var _srcCriteriaFiles = $tbl.data("SourceCriteriaFiles");
                                        var _arrCriteriaFiles = [];

                                        //check if there is a row currently being edited (not yet saved)
                                        var $saveBtn = $tbl.find(".EditToolButtons .LinkClickable[data-attr-row-action-btn='save']");

                                        if ($saveBtn.length > 0) {
                                            AddUserError("Unsaved changes were found for a Region or Document; save all pending changes and try again.");
                                        }

                                        //exclude deleted items
                                        $.each($tbl.find(".TableRowItem:not(.DeletedItem)[data-attr-editor-critera-file-id], " +
                                                         ".TableRowItem:not(.DeletedItem)[data-attr-editor-critera-temp-file-id]"), function () {
                                                             var $this = $(this);
                                                             var _criteriaFile = null;
                                                             var _fileID = util_forceInt($this.attr("data-attr-editor-critera-file-id"), enCE.None);

                                                             if (_fileID == enCE.None) {
                                                                 _criteriaFile = $this.data("DataItem");
                                                             }
                                                             else {
                                                                 _criteriaFile = util_arrFilter(_srcCriteriaFiles, enColEditorCriteriaFileProperty.FileID, _fileID,
                                                                                                true);
                                                                 _criteriaFile = _criteriaFile[0];
                                                             }

                                                             _arrCriteriaFiles.push(_criteriaFile);
                                                         });

                                        _item[enColCEEditorCriteriaProperty.EditorCriteriaFiles] = _arrCriteriaFiles;
                                    }
                                    else if (_editorForeignTypeID == enCEEditorForeignType.ValueMessageGroup) {

                                        //criteria platforms
                                        var _srcCriteriaPlatforms = $popupContainer.data("SourceCriteriaPlatforms");
                                        var _arrCriteriaPlatforms = [];

                                        var _srcEditorGroupForeignPermissions = $popupContainer.data("SourceCriteriaEditorGroupForeignPermissions");
                                        var _arrEditorGroupForeignPermissions = [];

                                        var $listSwitch = $popupContainer.find("[" + util_htmlAttribute("data-attr-bind-prop",
                                                                                                        enColCEEditorCriteriaProperty.EditorCriteriaPlatforms) + "] " +
                                                                               "[data-attr-platform-toggle-id] select[data-attr-widget='flip_switch']");

                                        $.each($listSwitch, function () {
                                            var $ddl = $(this);

                                            if (util_forceInt($ddl.val(), enCETriState.None) == enCETriState.Yes) {
                                                var _platformID = util_forceInt($mobileUtil.GetClosestAttributeValue($ddl, "data-attr-platform-toggle-id"), enCE.None);
                                                var _criteriaPlatform = util_arrFilter(_srcCriteriaPlatforms, enColEditorCriteriaPlatformProperty.PlatformID,
                                                                                       _platformID, true);

                                                _criteriaPlatform = (_criteriaPlatform.length == 1 ? _criteriaPlatform[0] : null);

                                                if (!_criteriaPlatform) {
                                                    _criteriaPlatform = new CEEditorCriteriaPlatform();
                                                }

                                                _criteriaPlatform[enColEditorCriteriaPlatformProperty.PlatformID] = _platformID;
                                                _arrCriteriaPlatforms.push(_criteriaPlatform);

                                                var _currentEditorGroupPerms = _controller.Utils.Managers.Data.PopulateEditorGroupForeignPermissions({
                                                    "Element": $ddl.closest(".FlipSwitchInline"),
                                                    "SourceList": _srcEditorGroupForeignPermissions,
                                                    "BridgeItemEditorForeignTypeID": enCEEditorForeignType.TableEditorCriteria
                                                });

                                                $.merge(_arrEditorGroupForeignPermissions, _currentEditorGroupPerms);
                                            }
                                        });

                                        if (_arrCriteriaPlatforms.length == 0) {
                                            AddUserError("At least one platform is required for the Criteria.");
                                        }

                                        _item[enColCEEditorCriteriaProperty.EditorCriteriaPlatforms] = _arrCriteriaPlatforms;
                                        _item[enColCEEditorCriteriaProperty.EditorGroupForeignPermissions] = _arrEditorGroupForeignPermissions;

                                        //criteria value messages
                                        var $vwValueMessageSelection = $popupContainer.find(".EditorCriteriaValueMessageSelections");
                                        var _srcCriteriaValueMessages = $vwValueMessageSelection.data("SourceCriteriaValueMessages");
                                        var _arrCriteriaValueMessages = [];

                                        var _displayOrder = 1;

                                        $.each($vwValueMessageSelection.find(".ValueMessageEditView[data-attr-editor-criteria-vm-id]"), function () {
                                            var _valueMessageID = util_forceInt($(this).attr("data-attr-editor-criteria-vm-id"), enCE.None);

                                            if (_valueMessageID != enCE.None) {
                                                var _criteriaValueMessage = util_arrFilter(_srcCriteriaValueMessages,
                                                                                           enColEditorCriteriaValueMessageProperty.ValueMessageID,
                                                                                           _valueMessageID, true);

                                                _criteriaValueMessage = (_criteriaValueMessage.length == 1 ? _criteriaValueMessage[0] : null);

                                                if (!_criteriaValueMessage) {
                                                    _criteriaValueMessage = new CEEditorCriteriaValueMessage();
                                                }

                                                _criteriaValueMessage[enColEditorCriteriaValueMessageProperty.ValueMessageID] = _valueMessageID;

                                                //configure the display order
                                                _criteriaValueMessage[enColEditorCriteriaValueMessageProperty.DisplayOrder] = _displayOrder++;

                                                _arrCriteriaValueMessages.push(_criteriaValueMessage);
                                            }
                                        });

                                        _item[enColCEEditorCriteriaProperty.EditorCriteriaValueMessages] = _arrCriteriaValueMessages;

                                    }
                                }

                                if (args.Callback) {
                                    args.Callback();
                                }
                            });
                        });

                    });
                }
                else if (_btnID == "delete_editor_criteria") {

                    var $detail = $btn.closest("[data-attr-editor-criteria-id]");

                    util_inlineConfirm({
                        "Target": $btn, "Message": "Delete?", "OnPositiveClick": function () {

                            args.LayoutManager.ToggleOverlay({ "IsEnabled": true, "Message": "Deleting..." });

                            $detail.addClass("DeletedItem");

                            var _editorGroupCriteriaList = $(args.Parent).find(".ViewEditorCriteriaSelections")
                                                                         .data("data-list");
                            var _searchEditorCriteriaID = util_forceInt($detail.attr("data-attr-editor-criteria-id"), enCE.None);

                            var _deleteEditorCriteria = util_arrFilter(_editorGroupCriteriaList, enColEditorGroupCriteriaProperty.EditorCriteriaID,
                                                                       _searchEditorCriteriaID, true);

                            _deleteEditorCriteria = (_deleteEditorCriteria.length == 1 ? _deleteEditorCriteria[0] : null);

                            args.OnSaveEntity(GlobalService, GlobalService.EditorGroupCriteriaDelete, { "Item": _deleteEditorCriteria }, function () {

                                $detail.toggle("height", function () {
                                    args.OnRefresh();
                                });
                            });
                        }
                    });
                }

            }); //end: events.processButtonClick
        }

        _controller.Utils.AnimateFromOptions(options);

        if (options.Callback) {
            options.Callback();
        }
    });

};  //end: RenderCriteriaSelections

CValueMessageController.prototype.RenderCriteriaDetailView = function (options) {

    options = util_extend({
        "EditorCriteriaID": enCE.None, "FocusValueMessageID": enCE.None, "Trigger": null,
        "IsTransition": false, "Controller": null, "PluginInstance": null, "Callback": null, "LayoutManager": null, "IsAnimate": true,
        "IsRefresh": false, "TrackBreadcrumb": false,
        "HtmlTemplates": {
            "ValueMessageItem": "<div class='%%CSS_CLASS%%' %%ATTR%%>" +
                                "   <div class='Label' " +
                                util_htmlAttribute("data-attr-update-prop", enColEditorCriteriaValueMessageProperty.ValueMessageIDName) + ">%%NAME%%</div>" +
                                "   %%BADGES%%" +
                                "   <div class='EditorValueMessageStatements' %%ATTR_STATEMENTS%%>%%STATEMENTS%%</div>" +
                                "</div>",
            "StatementItem": "<div class='%%CSS_CLASS%%' %%ATTR%%>" +
                             "   <div class='Label'>%%NAME%%</div>" +
                             "</div>"
        },
        "AnimationCallback": null
    }, options);

    var _controller = options.Controller;
    var _pluginInstance = (options.PluginInstance || _controller.PluginInstance);

    var $parent = $(_controller.DOM.Element).closest("[" + util_renderAttribute("pluginEditor_content") + "]");

    var $trigger = $(options.Trigger);
    var $element = $parent.siblings(".EditorCriteriaDetails");

    if ($element.length == 0) {
        $element = $("<div class='EditorEmbeddedView EditorCriteriaDetails EditorValueMessageInfo' />");
        $element.insertAfter($parent);  //insert the element as sibling (not as child)
    }

    if (options.IsTransition) {
        $element.hide();
    }

    var $prevActiveView = _controller.SetElementViewMode({
        "Mode": enCValueMessageViewMode.CriteriaDetails, "ActiveElement": $element, "IsBindEvents": true, "TrackBreadcrumb": options.TrackBreadcrumb
    });

    var _editorCriteriaID = util_forceInt(options.EditorCriteriaID, enCE.None);

    var _fnGetNewTempID = function () {
        var _tempID = util_forceInt($element.data("data-item-temp-id"), 0) + 1;

        $element.data("data-item-temp-id", _tempID);

        return _tempID;

    };  //end: _fnGetNewTempID
    
    var _fnGetValueMessageStatementHTML = function (valueMessageStatement) {
        var _statementTokens = {};
        var _statementID = util_forceInt(valueMessageStatement[enColValueMessageStatementProperty.StatementID], enCE.None);
        var _isTempItem = (_statementID == enCE.None);

        //init temp ID, if applicable
        if (_isTempItem && util_forceInt(valueMessageStatement[enColCEValueMessageStatementProperty.TempID], enCE.None) == enCE.None) {
            valueMessageStatement[enColCEValueMessageStatementProperty.TempID] = _fnGetNewTempID();
        }

        _statementTokens["%%NAME%%"] = util_htmlEncode(valueMessageStatement[enColValueMessageStatementProperty.StatementIDName]);
        _statementTokens["%%CSS_CLASS%%"] = "DisableUserSelectable EditorValueMessageStatement LinkClickable";
        _statementTokens["%%ATTR%%"] = (_isTempItem ? util_htmlAttribute("data-attr-editor-value-message-statement-temp-id",
                                                                         valueMessageStatement[enColCEValueMessageStatementProperty.TempID]) :
                                                      util_htmlAttribute("data-attr-editor-value-message-statement-id",
                                                                         valueMessageStatement[enColValueMessageStatementProperty.StatementID])
                                       );

        return util_replaceTokens(options.HtmlTemplates.StatementItem, _statementTokens);

    };  //end: _fnGetValueMessageStatementHTML

    var _fnGetCriteriaValueMessageHTML = function (criteriaValueMessage, valueMessageStatements) {
        var _tokens = {};
        var _statementsHTML = "";

        criteriaValueMessage = (criteriaValueMessage || {});
        valueMessageStatements = (valueMessageStatements || []);

        var _valueMessageID = util_forceInt(criteriaValueMessage[enColEditorCriteriaValueMessageProperty.ValueMessageID], enCE.None);
        var _isTempItem = (_valueMessageID == enCE.None);

        if (_isTempItem && util_forceInt(criteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.TempValueMessageID], enCE.None) == enCE.None) {
            criteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.TempValueMessageID] = _fnGetNewTempID();
        }

        for (var s = 0; s < valueMessageStatements.length; s++) {
            var _valueMessageStatement = valueMessageStatements[s];

            _statementsHTML += _fnGetValueMessageStatementHTML(_valueMessageStatement);
        }

        _tokens["%%NAME%%"] = util_htmlEncode(criteriaValueMessage[enColEditorCriteriaValueMessageProperty.ValueMessageIDName]);
        _tokens["%%CSS_CLASS%%"] = "DisableUserSelectable EditorEntityItem EditorValueMessageDetail";
        _tokens["%%ATTR%%"] = (_isTempItem ? util_htmlAttribute("data-attr-editor-criteria-value-message-temp-id", 
                                                                criteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.TempValueMessageID]) :
                                             util_htmlAttribute("data-attr-editor-criteria-value-message-id", _valueMessageID));
                             
        _tokens["%%ATTR_STATEMENTS%%"] = util_htmlAttribute("data-attr-item-prop", enColCEValueMessageProperty.ValueMessageStatements);

        _tokens["%%BADGES%%"] = "<div " + util_htmlAttribute("data-attr-item-prop", enColCEValueMessageProperty.ValueMessageBadges) + " " +
                                util_renderAttribute("pluginEditor_valueMessageBadge") + " />";
        _tokens["%%STATEMENTS%%"] = _statementsHTML;

        return util_replaceTokens(options.HtmlTemplates.ValueMessageItem, _tokens);

    };  //end: _fnGetCriteriaValueMessageHTML

    var _fnBindValueMessageBadge = function (isInitBind, lookupValueMessages, badgeList, obj, index, callback) {

        if (!lookupValueMessages) {
            lookupValueMessages = $element.data("data-vm-lookup");
        }

        if (!badgeList) {

            _controller.CacheGetItem({
                "Key": "BadgeList", "Callback": function (val) {

                    badgeList = (val || []);
                    _fnBindValueMessageBadge(isInitBind, lookupValueMessages, badgeList, obj, index, callback);
                }
            });

            return; //exit current iteration
        }

        if (obj == null && index == 0) {
            obj = $element.find("[" + util_renderAttribute("pluginEditor_valueMessageBadge") + "]");
        }

        if (index >= obj.length) {

            if (isInitBind) {
                var $vwFilters = $element.find("[" + util_renderAttribute("pluginEditor_valueMessageFilter") + "]");

                $vwFilters.trigger("events.refresh", { "IsEnable": true });
            }

            var _focusValueMessageID = util_forceInt(options.FocusValueMessageID, enCE.None);

            var _fnBindCallback = function () {
                if (callback) {
                    callback();
                }
            };

            var _handled = false;

            if (_focusValueMessageID != enCE.None) {
                var $search = $element.find(".EditorCriteriaValueMessages .EditorValueMessageDetail" + 
                                            "[" + util_htmlAttribute("data-attr-editor-criteria-value-message-id", _focusValueMessageID) + "]:first");

                if ($search.length == 1) {
                    _handled = true;

                    $mobileUtil.AnimateSmoothScroll(null, 500, { "Top": $search.offset().top }, function () {
                        $search.addClass("ViewHighlight");
                        _fnBindCallback();
                    });
                }
            }

            if (!_handled) {
                _fnBindCallback();
            }
        }
        else {
            var $vwBadge = $(obj.get(index));
            var _currentValueMessage = null;

            if (lookupValueMessages) {
                _currentValueMessage = lookupValueMessages.Get($vwBadge.closest(".EditorValueMessageDetail"));
            }

            $vwBadge.trigger("events.init", {
                "ValueMessageItem": _currentValueMessage, "BadgeList": badgeList, "Callback": function () {
                    setTimeout(function () {
                        _fnBindValueMessageBadge(isInitBind, lookupValueMessages, badgeList, obj, index + 1, callback);
                    }, 50);
                }
            });
        }

    };  //end: _fnBindValueMessageBadge


    if (_editorCriteriaID == enCE.None) {
        _editorCriteriaID = util_forceInt($mobileUtil.GetClosestAttributeValue($trigger, "data-attr-editor-criteria-id"), enCE.None);
    }

    //if no editor criteria ID is available, attempt to retrieve it from the element (previous viewed item)
    if (_editorCriteriaID == enCE.None) {
        _editorCriteriaID = util_forceInt($element.attr("data-attr-current-editor-criteria-id"), enCE.None);
        options.FocusValueMessageID = util_forceInt($element.attr("data-attr-current-focus-value-message-id"), enCE.None);
    }

    if (!$element.data("is-init-events")) {
        $element.data("is-init-events", true);

        $element.off("events.cleanup");
        $element.on("events.cleanup", ".EditorValueMessageDetail", function () {
            var $this = $(this);

            $element.data("data-vm-lookup").Delete($this);

        }); //end: events.cleanup

        $element.off("events.populateDisplayOrder");
        $element.on("events.populateDisplayOrder", ".EditorValueMessageDetail", function (e, args) {
            var $this = $(this);

            args = util_extend({ "PopulateItem": null }, args);

            var _item = args.PopulateItem;

            if (!_item) {
                _item = {};
                args.PopulateItem = _item;
            }

            _item["DisplayOrder"] = 0;
            _item["Referenced"] = [];

            var _filterSelector = "[data-attr-editor-criteria-value-message-id]";

            if ($this.is("[data-attr-editor-criteria-value-message-temp-id]")) {
                _filterSelector += ", [" + util_htmlAttribute("data-attr-editor-criteria-value-message-temp-id",
                                   $this.attr("data-attr-editor-criteria-value-message-temp-id")) + "]";
            }

            var $listDetail = $element.find(".EditorValueMessageDetail");
            var $listFiltered = $listDetail.filter(_filterSelector);
            
            if ($listFiltered.not($this).length == 0) {

                //there are no existing saved value messages, so set the current display order to be the first
                _item.DisplayOrder = 1;
            }
            else {
                var _index = $listFiltered.index($this);
                var _fnGetElementDataItem = function (obj) {
                    var $obj = $(obj);
                    var _dataItem = $obj.data("DataItem");

                    if (!_dataItem) {
                        var _editorCriteria = ($element.data("DataItem") || {});

                        //retrieve it from the source data item
                        _dataItem = util_arrFilter(_editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaValueMessages],
                                                   enColEditorCriteriaValueMessageProperty.ValueMessageID,
                                                   util_forceInt($obj.attr("data-attr-editor-criteria-value-message-id"), enCE.None), true);

                        _dataItem = (_dataItem.length == 1 ? _dataItem[0] : null);
                    }

                    return _dataItem;

                };  //end: _fnGetElementDataItem

                if (_index == 0) {

                    //element to be saved is at start of list

                    var $next = $($listFiltered.get(_index + 1));
                    var _nextCriteriaValueMessage = _fnGetElementDataItem($next);

                    _item.DisplayOrder = (_nextCriteriaValueMessage ?
                                          util_forceInt(_nextCriteriaValueMessage[enColEditorCriteriaValueMessageProperty.DisplayOrder], 0) - 1 :
                                          null);

                }
                else if (_index == $listFiltered.length - 1) {

                    //element to be saved is at end of list
                    var $prev = $($listFiltered.get(_index - 1));
                    var _prevCriteriaValueMessage = _fnGetElementDataItem($prev);

                    _item.DisplayOrder = (_prevCriteriaValueMessage ?
                                          util_forceInt(_prevCriteriaValueMessage[enColEditorCriteriaValueMessageProperty.DisplayOrder], 0) + 1 :
                                          null);
                }
                else {

                    //element to be saved is within middle of list
                    var $next = $($listFiltered.get(_index + 1));
                    var _nextCriteriaValueMessage = _fnGetElementDataItem($next);

                    _item.DisplayOrder = (_nextCriteriaValueMessage ?
                                          util_forceInt(_nextCriteriaValueMessage[enColEditorCriteriaValueMessageProperty.DisplayOrder], 0) - 1 :
                                          null);

                    for (var i = 0; i < _index; i++) {
                        var $current = $listFiltered.get(i);
                        var _updateCriteriaValueMessage = _fnGetElementDataItem($current);

                        if (_updateCriteriaValueMessage) {
                            _item.Referenced.push(_updateCriteriaValueMessage);
                        }
                    }
                }
            }

            _item.DisplayOrder = util_forceInt(_item.DisplayOrder, 0);

        }); //end: events.populateDisplayOrder

        $element.off("events.onUpdateDataItem");
        $element.on("events.onUpdateDataItem", ".EditorValueMessageDetail", function (e, args) {
            var $this = $(this);

            args = util_extend({ "Previous": null, "Update": null, "Callback": null }, args);

            var _criteriaValueMessage = args.Update;

            if (!args.Previous) {
                args.Previous = $this.data("DataItem");
            }

            //set the updated data item
            $this.data("DataItem", _criteriaValueMessage);

            //update the lookup entry for the value message
            var _valueMessageID = util_forceInt($this.attr("data-attr-editor-criteria-value-message-id"), enCE.None);
            var _valueMessageItem = _criteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.ValueMessageItem];

            var _lookupVM = $element.data("data-vm-lookup");

            _lookupVM.Replace($this, _valueMessageItem);

            //update the parent data item
            var _editorCriteria = $element.data("DataItem");
            var _criteriaValueMessages = _editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaValueMessages];

            if (!_criteriaValueMessages) {
                _criteriaValueMessages = [];
                _editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaValueMessages] = _criteriaValueMessages;
            }

            var _fnSetCriteriaValueMessageData = function (criteriaVM, searchID) {
                var _found = -1;

                if (!searchID) {
                    searchID = criteriaVM[enColEditorCriteriaValueMessageProperty.ValueMessageID];
                }

                for (var i = 0; i < _criteriaValueMessages.length; i++) {
                    var _search = _criteriaValueMessages[i];

                    if (_search[enColEditorCriteriaValueMessageProperty.ValueMessageID] == searchID) {
                        _found = i;
                        break;
                    }
                }

                if (_found >= 0) {
                    _criteriaValueMessages[_found] = criteriaVM;
                }
                else {
                    _criteriaValueMessages.push(criteriaVM);
                }

            };  //end: _fnSetCriteriaValueMessageData

            _fnSetCriteriaValueMessageData(_criteriaValueMessage, _valueMessageID);

            //update referenced editor criteria value message data items and elements, if applicable
            var _referencedList = _criteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.ReferencedCriteriaValueMessage];

            _criteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.ReferencedCriteriaValueMessage] = null; //clear the property value

            if (_referencedList && _referencedList.length > 0) {
                var _refSelector = "";
                var _lookup = {};

                for (var r = 0; r < _referencedList.length; r++) {
                    var _refEditorCriteriaVM = _referencedList[r];
                    var _refValueMessageID = _refEditorCriteriaVM[enColEditorCriteriaValueMessageProperty.ValueMessageID];

                    _refSelector += (r > 0 ? ", " : "") + ".EditorValueMessageDetail[" +
                                     util_htmlAttribute("data-attr-editor-criteria-value-message-id", _refValueMessageID) + "]";

                    _lookup[_refValueMessageID] = _refEditorCriteriaVM;
                }

                var $filtered = $element.find(_refSelector);

                $.each($filtered, function () {
                    var $ref = $(this);
                    var _searchID = util_forceInt($ref.attr("data-attr-editor-criteria-value-message-id"), enCE.None);

                    $ref.data("DataItem", _lookup[_searchID]);
                });
            }

            //refresh the values for the element view
            $.each($this.find("[data-attr-update-prop]"), function () {
                var $prop = $(this);
                var _val = "";
                var _prop = $prop.attr("data-attr-update-prop");

                switch (_prop) {
                    case enColEditorCriteriaValueMessageProperty.ValueMessageIDName:
                        _val = _criteriaValueMessage[_prop];
                        break;
                }

                $prop.text(_val);
            });

            //update the statements
            var _valueMessageStatements = _valueMessageItem[enColCEValueMessageProperty.ValueMessageStatements];
            var $statementsContainer = $this.find(".EditorValueMessageStatements");

            $statementsContainer.find("[data-attr-on-update-action='delete'], .EditorValueMessageStatement.DeletedItem").remove();

            //temp statements
            $.each($statementsContainer.find(".EditorValueMessageStatement[data-attr-editor-value-message-statement-temp-id]"), function () {
                var $valueMessageStatement = $(this);

                var _searchTempID = util_forceInt($valueMessageStatement.attr("data-attr-editor-value-message-statement-temp-id"), enCE.None);
                var _currentValueMessageStatement = util_arrFilter(_valueMessageStatements, enColCEValueMessageStatementProperty.TempID, _searchTempID, true);

                _currentValueMessageStatement = _currentValueMessageStatement[0];

                //remove the temp ID
                _currentValueMessageStatement[enColCEValueMessageStatementProperty.TempID] = enCE.None;

                //remove the temp statement ID and update with new saved ID
                $valueMessageStatement.removeAttr("data-attr-editor-value-message-statement-temp-id")
                                      .attr("data-attr-editor-value-message-statement-id",
                                            _currentValueMessageStatement[enColValueMessageStatementProperty.StatementID]);

                //remove the data item on the element (since now will be retrieved from the source statements list)
                $valueMessageStatement.removeData("DataItem");

                //update the label text
                var _statement = _currentValueMessageStatement[enColCEValueMessageStatementProperty.TempStatementItem];

                $valueMessageStatement.find(".Label")
                                      .text(_statement[enColStatementProperty.Name]);

            });

            //remove the cached statements list (used for save of value message)
            $this.removeData("data-statements");

            if (args.Callback) {
                args.Callback();
            }
        });

        $element.off("events.appendValueMessageStatement");
        $element.on("events.appendValueMessageStatement", ".EditorValueMessageDetail", function (e, args) {

            args = util_extend({ "Callback": null }, args);

            var $criteriaValueMessage = $(this);
            var $statementsContainer = $criteriaValueMessage.find(".EditorValueMessageStatements");

            var _valueMessageStatement = new CEValueMessageStatement();
            var $temp = $(_fnGetValueMessageStatementHTML(_valueMessageStatement));

            $temp.data("DataItem", _valueMessageStatement); //associate value message statement to the element

            $temp.append("<div class='ModeToggleEntityView' data-attr-on-update-action='delete'>" +
                         "  <input class='DisableDragElement' type='text' data-attr-prop='_StatementName' " +
                         util_htmlAttribute("data-attr-prop-is-embed", enCETriState.Yes) +
                         " placeholder='Title' />" +
                         "</div>");

            $statementsContainer.append($temp)
                                .trigger("create");

            $temp.find("[data-attr-prop='_StatementName']").trigger("focus");

            _controller.ToggleEditMode({
                "IsEdit": true, "IsUpdate": true, "Controller": _controller, "PluginInstance": _pluginInstance, "FilteredList": $criteriaValueMessage,
                "Callback": function () {
                    $mobileUtil.AnimateSmoothScroll(null, 500, { "Top": $temp.offset().top }, args.Callback);
                }
            });
        });

        $element.off("events.statementsOrderTagAction");
        $element.on("events.statementsOrderTagAction", ".EditorValueMessageDetail", function (e, args) {

            var $this = $(this);

            args = util_extend({ "Action": "tag" }, args);

            switch (args.Action) {

                case "clear":

                    $this.removeAttr("data-attr-has-statements-order-change")
                         .removeData("data-tag-statements-order");

                    break;  //end: clear

                case "restore":

                    if (util_forceInt($this.attr("data-attr-has-statements-order-change"), enCETriState.None) == enCETriState.Yes) {

                        var $vwStatements = $this.find(".EditorValueMessageStatements");
                        var _lookupStatementElement = {};
                        var _arrPrev = ($this.data("data-tag-statements-order") || []);
                        var _arrCurrent = [];

                        $.each($this.find(".EditorValueMessageStatements .EditorValueMessageStatement[data-attr-editor-value-message-statement-id]"), function () {
                            var $statement = $(this);
                            var _id = util_forceInt($statement.attr("data-attr-editor-value-message-statement-id"), enCE.None);

                            _lookupStatementElement[_id] = $statement;
                            _arrCurrent.push(_id);
                        });

                        var $anchor = null;

                        for (var i = 0; i < _arrPrev.length; i++) {
                            var _diff = true;
                            var _restoreStatementID = _arrPrev[i];

                            if (i < _arrCurrent.length) {
                                _diff = (_restoreStatementID != _arrCurrent[i]);
                            }

                            if (_diff && _lookupStatementElement[_restoreStatementID]) {
                                var $current = $(_lookupStatementElement[_restoreStatementID]).detach();

                                if ($anchor) {
                                    $current.insertAfter($anchor);
                                }
                                else {
                                    $vwStatements.prepend($current);
                                }

                                $anchor = $current;
                            }
                        }

                        $this.removeAttr("data-attr-has-statements-order-change")
                             .removeData("data-tag-statements-order");
                    }

                    break;  //end: restore

                //tag action
                default:

                    //set attribute that the element is flagged with possible updates to the statements display order
                    $this.attr("data-attr-has-statements-order-change", enCETriState.Yes);

                    //for each statement capture an array of the statement IDs in the current order
                    var _arrStatementIDs = [];

                    $.each($this.find(".EditorValueMessageStatements .EditorValueMessageStatement[data-attr-editor-value-message-statement-id]"), function () {
                        var _statementID = util_forceInt($(this).attr("data-attr-editor-value-message-statement-id"), enCE.None);

                        _arrStatementIDs.push(_statementID);
                    });

                    $this.data("data-tag-statements-order", _arrStatementIDs);

                    break;
            }                    

        }); //end: events.statementsOrderTagAction

        $element.off("events.insertValueMessage");
        $element.on("events.insertValueMessage", ".EditorCriteriaValueMessages", function (e, args) {

            args = util_extend({ "Callback": null }, args);

            var _criteriaValueMessage = new CEEditorCriteriaValueMessage();
            var $criteriaValueMessage = $(_fnGetCriteriaValueMessageHTML(_criteriaValueMessage, null));
            var _tempValueMessage = new CEValueMessage();
            var _currentEditorCriteriaID = util_forceInt($mobileUtil.GetClosestAttributeValue($element, "data-attr-current-editor-criteria-id"), enCE.None);

            _criteriaValueMessage[enColEditorCriteriaValueMessageProperty.EditorCriteriaID] = _currentEditorCriteriaID;

            $criteriaValueMessage.data("DataItem", _criteriaValueMessage);  //associate the data item to the element
            
            //add the temp value message item to the lookup and associate it to the criteria value message item
            $element.data("data-vm-lookup").Put($criteriaValueMessage, _tempValueMessage);
            _criteriaValueMessage[enColCEEditorCriteriaValueMessageProperty.ValueMessageItem] = _tempValueMessage;

            $criteriaValueMessage.hide();

            $(this).prepend($criteriaValueMessage);

            $mobileUtil.refresh($criteriaValueMessage);

            _fnBindValueMessageBadge(false, null, null, $criteriaValueMessage.find("[" + util_renderAttribute("pluginEditor_valueMessageBadge") + "]"), 0, function () {

                _controller.ToggleEditMode({
                    "IsEdit": true, "Controller": _controller, "PluginInstance": _pluginInstance, "FilteredList": $criteriaValueMessage, "Callback": function () {

                        $criteriaValueMessage.find("[data-attr-editor-controller-action-btn='edit_criteria_vm']").trigger("click"); //force into entity edit item mode

                        $criteriaValueMessage.toggle("height", function () {
                            $criteriaValueMessage.find("input[type='text'][" + util_htmlAttribute("data-attr-item-prop", enColValueMessageProperty.Name) + "]")
                                                 .trigger("focus");
                        });

                        if (args.Callback) {
                            args.Callback();
                        }
                    }
                });

            });

        }); //end: events.insertValueMessage

        $element.off("click.view_statement");
        $element.on("click.view_statement",
                    ".EditorCriteriaValueMessages:not(.EditorDraggableOn) .EditorValueMessageDetail " +
                    ".EditorValueMessageStatements .LinkClickable.EditorValueMessageStatement",
                    function (e, args) {

                        args = util_extend({ "Callback": null, "IsAnimate": true }, args);

                        var _clickCallback = function () {
                            if (args.Callback) {
                                args.Callback();
                            }
                        };

                        var $statement = $(this);
                        var _statementID = util_forceInt($statement.attr("data-attr-editor-value-message-statement-id"), enCE.None);
                        var _handled = false;

                        if (_statementID != enCE.None) {
                            var _valueMessageID = util_forceInt($statement.closest(".EditorValueMessageDetail").attr("data-attr-editor-criteria-value-message-id"),
                                                                enCE.None);

                            if (_valueMessageID != enCE.None) {
                                _handled = true;

                                _controller.RenderStatementView({
                                    "ValueMessageID": _valueMessageID, "StatementID": _statementID, "IsTransition": true, "IsAnimate": args.IsAnimate,
                                    "Controller": _controller, "PluginInstance": _pluginInstance, "LayoutManager": options.LayoutManager,
                                    "Callback": _clickCallback
                                });
                            }
                        }

                        if (!_handled) {
                            _clickCallback();
                        }

                    });

        _controller.Utils.BindFlipSwitchEvents({ "Element": $element });
    }

    GlobalService.EditorCriteriaGetByPrimaryKey({
        "EditorCriteriaID": _editorCriteriaID,
        "FilterEditorGroupID": util_forceInt($mobileUtil.GetClosestAttributeValue($element, "data-attr-home-editor-group-id"), enCE.None),
        "DeepLoad": true
    }, function (criteriaResult) {

        var _editorCriteriaDataItem = (criteriaResult || {});

        var _html = "";
        var _found = false;

        var _editorCriteriaForeignTypeID = _editorCriteriaDataItem[enColEditorCriteriaProperty.EditorForeignTypeID];

        if (util_forceInt(_editorCriteriaDataItem[enColEditorCriteriaProperty.EditorCriteriaID], enCE.None) == enCE.None) {

            //item no longer available or is invalid
            _html += "<div class='LabelError'>" +
                     util_htmlEncode("Criteria is no longer available or invalid. Please return to selection view and try again.") +
                     "</div>";
        }
        else {
            _html += "<div class='Title'>" +
                     "  <div class='Label'>" + util_htmlEncode(_editorCriteriaDataItem[enColEditorCriteriaProperty.Name]) + "</div>" +
                     "  <div class='Description'>" + util_htmlEncode(_editorCriteriaDataItem[enColEditorCriteriaProperty.Description], true) + "</div>" +
                     "</div>";
        }

        var _isValueMessagesView = _controller.Utils.IsValueMessageForeignType(_editorCriteriaForeignTypeID);

        if (_isValueMessagesView) {

            options.LayoutManager.ToolbarSetButtons({
                "IsInsertStart": true,
                "IsHideEditButtons": (_editorCriteriaDataItem[enColEditorCriteriaProperty.IsEditable] == false),
                "List": _controller.Utils.HTML.GetButton({
                    "ActionButtonID": "popup", "Content": "View Icon Legend", "Attributes": {
                        "data-attr-popup-id": "popup_vm_badges_legend", "data-icon": "info"
                    }
                })
            });

            _found = true;

            var _criteriaValueMessages = (_editorCriteriaDataItem[enColCEEditorCriteriaProperty.EditorCriteriaValueMessages] || []);

            _html += "<div " + util_renderAttribute("pluginEditor_valueMessageFilter") + " />";

            _html += "<div class='EditorDraggableContainer EditorCriteriaValueMessages'>";

            var _lookupValueMessages = {
                "Data": {},
                "ForceKey": function (v) {
                    var _key = null;

                    if (typeof v === "object") {
                        var $obj = $(v);

                        _key = util_forceInt($obj.attr("data-attr-editor-criteria-value-message-id"), enCE.None);

                        if (_key == enCE.None) {

                            //search using the temp ID format
                            _key = "temp_" + util_forceInt($obj.attr("data-attr-editor-criteria-value-message-temp-id"), enCE.None);
                        }
                    }
                    else {
                        _key = v;
                    }

                    return _key;
                },
                "Get": function (v) {
                    var _key = this.ForceKey(v);

                    return this.Data[_key];
                },
                "Put": function (key, value) {

                    key = this.ForceKey(key);

                    this.Data[key] = value;
                },
                "Delete": function (key) {
                    key = this.ForceKey(key);
                    delete this.Data[key];
                },
                "Replace": function (obj, value) {
                    var $detail = $(obj);
                    var _valueMessageID = value[enColValueMessageProperty.ValueMessageID];
                    var _key = null;

                    if ($detail.is("[data-attr-editor-criteria-value-message-temp-id]")) {

                        //temp/add new element that is updated so configure related value message details

                        //delete the previous key value
                        this.Delete($detail);

                        //remove the temp attribute and update to new data attributes for ID
                        $detail.removeAttr("data-attr-editor-criteria-value-message-temp-id")
                               .attr("data-attr-editor-criteria-value-message-id", _valueMessageID);

                        _key = this.ForceKey($detail);  //get new key
                    }
                    else {
                        _key = _valueMessageID;
                    }

                    this.Put(_key, value);
                }
            };

            var _valueMessages = (_editorCriteriaDataItem[enColCEEditorCriteriaProperty.ValueMessageList] || []);
            var _isEditable = _editorCriteriaDataItem[enColEditorCriteriaProperty.IsEditable];

            if (!_isEditable) {
                _criteriaValueMessages = [];
            }

            for (var v = 0; v < _valueMessages.length; v++) {
                var _item = _valueMessages[v];
                var _id = _item[enColValueMessageProperty.ValueMessageID];

                _lookupValueMessages.Put(_id, _item);

                if (!_isEditable) {
                    var _criteriaVM = new CEEditorCriteriaValueMessage();

                    _criteriaVM[enColEditorCriteriaValueMessageProperty.ValueMessageID] = _id;
                    _criteriaVM[enColEditorCriteriaValueMessageProperty.ValueMessageIDName] = _item[enColValueMessageProperty.Name];
                    _criteriaVM[enColEditorCriteriaValueMessageProperty.DisplayOrder] = v + 1;

                    _criteriaValueMessages.push(_criteriaVM);
                }
            }

            for (var i = 0; i < _criteriaValueMessages.length; i++) {
                var _criteriaValueMessage = _criteriaValueMessages[i];                
                var _valueMessageID = _criteriaValueMessage[enColEditorCriteriaValueMessageProperty.ValueMessageID];

                var _valueMessage = _lookupValueMessages.Get(_valueMessageID);

                _valueMessage = (_valueMessage || {});

                _html += _fnGetCriteriaValueMessageHTML(_criteriaValueMessage, _valueMessage[enColCEValueMessageProperty.ValueMessageStatements]);
            }

            _html += "</div>";
        }
        else if (_editorCriteriaForeignTypeID == enCEEditorForeignType.EvidenceAddendum) {

            var _editorCriteriaFiles = (_editorCriteriaDataItem[enColCEEditorCriteriaProperty.EditorCriteriaFiles] || []);
            var _fileList = (_editorCriteriaDataItem[enColCEEditorCriteriaProperty.FileList] || []);
            var _lookupFile = {};

            for (var i = 0; i < _fileList.length; i++) {
                var _file = _fileList[i];
                var _fileID = _file[enColFileProperty.FileID];

                _lookupFile[_fileID] = _file;
            }

            _html += "<table border='0' cellpadding='0' cellspacing='0' class='EditorTableList EditorTableStyleA'>" +
                     "  <tr class='TableHeaderRow'>" +
                     "      <td>" + util_htmlEncode("Region") + "</td>" +
                     "      <td>" + util_htmlEncode("Document Name") + "</td>" +
                     "      <td>" + util_htmlEncode("Last Updated") + "</td>" +
                     "  </tr>";

            if (_editorCriteriaFiles.length == 0) {
                _html += "<tr class='TableRowItem' colspan='3'>" +
                         "  <td class='TableCellNoRecords'>" + util_htmlEncode(MSG_CONFIG.ListNoRecords) + "</td>" +
                         "</tr>";
            }
            else {
                for (var i = 0; i < _editorCriteriaFiles.length; i++) {
                    var _editorCriteriaFile = _editorCriteriaFiles[i];
                    var _fileID = _editorCriteriaFile[enColEditorCriteriaFileProperty.FileID];
                    var _file = _lookupFile[_fileID];

                    var _link = util_htmlEncode(_editorCriteriaFile[enColEditorCriteriaFileProperty.FileIDName]);

                    if (_file) {
                        _link = "<a data-role='none' data-rel='external' target='_blank' " +
                                util_htmlAttribute("href", _controller.Utils.ConstructDownloadURL({ "TypeID": "editor", "Item": _file })) + ">" +
                                _link +
                                "</a>";
                    }

                    _html += "<tr class='TableRowItem'>" +
                             "  <td>" +
                             "      <span class='Label'>" + util_htmlEncode(_editorCriteriaFile[enColEditorCriteriaFileProperty.Name]) + "</span>" +
                             "  </td>" +
                             "  <td>" +
                             _link +
                             "  </td>" +
                             "  <td style='text-align: center;'>" +
                             util_htmlEncode(_controller.Utils.FormatDateTime(_editorCriteriaFile[enColEditorCriteriaFileProperty.FileDateModified])) +
                             "  </td>" +
                             "</tr>";
                }
            }

            _html += "</table>";
        }        

        $element.attr("data-attr-current-editor-criteria-id", _editorCriteriaID)
                .attr("data-attr-current-focus-value-message-id", options.FocusValueMessageID)
                .attr("data-attr-current-editor-criteria-foreign-type-id", _editorCriteriaForeignTypeID)
                .data("DataItem", _editorCriteriaDataItem)
                .data("data-vm-lookup", _lookupValueMessages);

        $element.removeData("data-item-temp-id");   //reset the temp ID used for edit mode item creations

        $element.html(_html);
        $mobileUtil.refresh($element);
        
        _controller.Utils.AnimateFromOptions(options);

        if (_isValueMessagesView && _found) {
            _controller.Utils.Sortable({
                "Controller": _controller,
                "Containers": $element.children(".EditorDraggableContainer"), "SelectorDraggable": ".EditorValueMessageDetail",
                "DropOptions": {
                    "DataAttributeIdentifier": "data-attr-editor-criteria-value-message-id",
                    "PropertyDisplayOrder": enColEditorCriteriaValueMessageProperty.DisplayOrder,
                    "PropertyEntityIdentifier": enColEditorCriteriaValueMessageProperty.ValueMessageID,
                    "GetUpdateDataList": function (savedEditorCriteriaVM) {
                        var _updateList = savedEditorCriteriaVM[enColCEEditorCriteriaValueMessageProperty.ReferencedCriteriaValueMessage];

                        savedEditorCriteriaVM[enColCEEditorCriteriaValueMessageProperty.ReferencedCriteriaValueMessage] = null; //remove the list from data item

                        return _updateList;
                    },
                    "GetDataItem": function (id, ctx, callCache) {
                        var _retDataItem = $(ctx).data("DataItem");

                        if (!_retDataItem) {

                            //retrieve it from the source data item

                            var _editorCriteria = ($element.data("DataItem") || {});

                            id = util_forceInt(id, enCE.None);

                            _retDataItem = util_arrFilter(_editorCriteria[enColCEEditorCriteriaProperty.EditorCriteriaValueMessages],
                                                          enColEditorCriteriaValueMessageProperty.ValueMessageID, id, true);

                            _retDataItem = (_retDataItem.length == 1 ? _retDataItem[0] : null);
                        }

                        return _retDataItem;
                    }
                },
                "OnValidateDragRequest": function (dragOpts) {
                    return $(dragOpts.Handle).closest(".EditorValueMessageStatements, .EditorValueMessageBadgeView, .EditorValueMessageDetail")
                                             .is(".EditorValueMessageDetail");
                },
                "OnDrop": function (dropOptions) {

                    var _currentItem = null;

                    dropOptions.OnSaveSuccess = function (saveItem, updateOpts) {
                        _currentItem[enColCEEditorCriteriaValueMessageProperty.ReferencedCriteriaValueMessage] = null;
                    };

                    var _refList = [];
                    var _searchValueMessageID = util_forceInt($(dropOptions.Element).attr("data-attr-editor-criteria-value-message-id"), enCE.None);

                    for (var i = 0; i < dropOptions.SaveList.length; i++) {
                        var _editorCriteriaVM = dropOptions.SaveList[i];

                        if (_editorCriteriaVM[enColEditorCriteriaValueMessageProperty.ValueMessageID] == _searchValueMessageID) {
                            _currentItem = _editorCriteriaVM;
                        }
                        else {
                            _refList.push(_editorCriteriaVM);
                        }
                    }

                    _currentItem[enColCEEditorCriteriaValueMessageProperty.ReferencedCriteriaValueMessage] = _refList;

                    dropOptions.ForceParseResult = true;
                    dropOptions.SaveMethod = GlobalService.EditorCriteriaValueMessageSave;
                    dropOptions.SaveParams = { "Item": _currentItem, "DeepSave": false, "IsSaveReferenceList": true };
                }
            });
        }

        var _badges = null; //will be retrieved from cache
        
        var _callback = function () {

            if (!_isValueMessagesView) {
                if (options.Callback) {
                    options.Callback();
                }
            }
            else {
                _fnBindValueMessageBadge(true, _lookupValueMessages, _badges, null, 0, options.Callback);
            }            

        };  //end: _callback

        var _fnPopulateReqData = function (onDataCallback) {

            if (!_isValueMessagesView) {
                onDataCallback();
            }
            else {
                _controller.CacheGetItem({
                    "Key": "BadgeList", "Callback": function (val) {
                        _badges = val;
                        onDataCallback();
                    }
                });
            }

        };  //end: _fnPopulateReqData

        _fnPopulateReqData(function () {

            if (_isValueMessagesView) {

                //configure the filter elements
                var $vwFilters = $element.find("[" + util_renderAttribute("pluginEditor_valueMessageFilter") + "]");

                $vwFilters.data("GetTargetList", function () {
                    return $element.find(".EditorCriteriaValueMessages .EditorValueMessageDetail");
                });

                $vwFilters.trigger("events.init", { "BadgeList": _badges, "IsDisabled": true });
            }

            if (options.IsRefresh) {
                _callback();
            }
            else if (options.IsTransition) {

                $parent.hide();

                _controller.Utils.TransitionView({
                    "ActiveElement": $element,
                    "PrevActiveView": $prevActiveView,
                    "IsAnimate": options.IsAnimate,
                    "IsTransition": options.IsTransition,
                    "AnimationCallback": _callback
                });
            }
            else if (options.IsAnimate) {
                $parent.show();
                $element.show();

                $parent.addClass("EffectBlur")
                       .slideUp("normal", function () {

                           $parent.removeClass("EffectBlur");

                           _callback();

                       });
            }
            else {
                $parent.hide();
                $element.show();

                _callback();
            }

        });

    });

};  //end: RenderCriteriaDetailView

CValueMessageController.prototype.RenderStatementView = function (options) {

    options = util_extend({
        "ValueMessageID": enCE.None, "StatementID": enCE.None, "IsTransition": false, "Controller": null, "PluginInstance": null, "Callback": null,
        "LayoutManager": null,
        "AnimationCallback": null, "IsAnimate": true
    }, options);

    var _controller = options.Controller;
    var _pluginInstance = (options.PluginInstance || _controller.PluginInstance);
    var _layoutManager = options.LayoutManager;

    var $parent = $(_controller.DOM.Element).closest("[" + util_renderAttribute("pluginEditor_content") + "]");

    var $element = $parent.siblings(".ViewEditorValueMessageStatement");

    if ($element.length == 0) {
        $element = $("<div class='EditorEmbeddedView ViewEditorValueMessageStatement EditorValueMessageInfo' />");
        var $anchor = _controller.ActiveElement();
        
        if (!$anchor.is(".EditorCriteriaDetails")) {
            $anchor = $parent;
        }
        
        $element.insertAfter($anchor);  //insert the element as sibling (not as child)
    }

    if (!$element.data("is-init")) {
        $element.data("is-init", true);

        $element.off("events.updateDataItem");
        $element.on("events.updateDataItem", function (e, args) {

            args = util_extend({ "Item": null, "Callback": null, "IsContinueEdit": false, "FilteredList": null }, args);

            //update the statement data only if it is not in filtered mode
            if (!args.FilteredList) {
                var _statement = args.Item;

                _statement = (_statement || {});

                $element.data("DataItem", _statement);  //set updated data item

                //update required element content for statement
                $element.find(".StatementTitle > .Title")
                        .text(util_forceString(_statement[enColStatementProperty.Name]));

                $element.find(".ViewContentEditorController [" + util_renderAttribute("pluginEditor_content") + "]")
                        .removeData("is-modified");

                $element.find(".ViewContentEditorController")
                        .trigger("events.updateViewData", { "Item": _statement, "IsContinueEdit": args.IsContinueEdit });
            }

            if (args.Callback) {
                args.Callback();
            }
        });
    }

    if (options.IsTransition) {
        $element.hide();
    }

    //clear the toolbar buttons
    if (options.LayoutManager) {
        options.LayoutManager.ToolbarSetButtons({ "IsClear": true });
    }

    var $prevActiveView = _controller.SetElementViewMode({
        "Mode": enCValueMessageViewMode.StatementView, "ActiveElement": $element, "IsBindEvents": true, "TrackBreadcrumb": true
    });

    if (options.ValueMessageID == enCE.None) {

        //retrieve the value message ID and statement ID from the element data attributes
        options.ValueMessageID = util_forceInt($element.attr("data-attr-vw-value-message-id"), enCE.None);
        options.StatementID = util_forceInt($element.attr("data-attr-vw-statement-id"), enCE.None);
    }

    //set current view data attributes
    $element.attr({ "data-attr-vw-value-message-id": options.ValueMessageID, "data-attr-vw-statement-id": options.StatementID });

    var _editorGroup = ($element.closest("[data-attr-home-editor-group-id]").data("DataItem") || {});
    var _contextClassPlatformID = _editorGroup[enColEditorGroupProperty.ClassificationPlatformID];

    GlobalService.ValueMessageGetByPrimaryKey({
        "ValueMessageID": options.ValueMessageID, "FilteredStatementID": options.StatementID, "DeepLoad": true,
        "ContextClassificationPlatformID": _contextClassPlatformID
    }, function (valueMessage) {

        valueMessage = (valueMessage || {});

        var _valueMessageStatement = util_arrFilter(valueMessage[enColCEValueMessageProperty.ValueMessageStatements], enColValueMessageStatementProperty.StatementID,
                                                    options.StatementID, true);

        _valueMessageStatement = (_valueMessageStatement.length == 1 ? _valueMessageStatement[0] : null);

        var _statement = (_valueMessageStatement ? _valueMessageStatement[enColCEValueMessageStatementProperty.TempStatementItem] : null);

        var _html = "";
        var _found = true;

        if (util_forceInt(valueMessage[enColValueMessageProperty.ValueMessageID], enCE.None) == enCE.None || !_valueMessageStatement || !_statement) {

            //item no longer available or is invalid
            _html += "<div class='LabelError'>" +
                     util_htmlEncode("Value Message / Statement is no longer available or invalid. Please return to selection view and try again.") +
                     "</div>";

            _found = false;
        }
        else {

            _html += "<div " + util_renderAttribute("pluginEditor_userExportAction") + " />";

            _html += "<div class='Title'>" +
                     "  <div class='Label'>" + util_htmlEncode(valueMessage[enColValueMessageProperty.Name]) + "</div>" +
                     "  <div " + util_renderAttribute("pluginEditor_valueMessageBadge") + " />" +
                     "</div>";

            _html += "<div class='EditorWidgetElement StatementTitle'>" +
                     "  <div class='Heading'>" + util_htmlEncode("Evidence-supported statement:") + "</div>" +
                     "  <div class='Title ModeToggleView'>" + util_htmlEncode(_valueMessageStatement[enColValueMessageStatementProperty.StatementIDName]) + "</div>" +
                     "</div>";

            _html += "<div class='StatementContent' />" +
                     "<div class='StatementReferenceFiles'>" +
                     "  <div class='IndicatorSmall' style='margin-left: 0.5em;' />" +
                     "</div>";
        }

        if (!$element.data("init-events")) {
            $element.data("init-events", true);
        }

        //persist both the containing value message data item as well as the statement
        $element.data("DataItemParent", valueMessage)
                .data("DataItem", _statement);

        $element.html(_html);

        var $vwEditorController = (_found ? $element.find(".StatementContent") : null);
        var $vwReferenceFileController = (_found ? $element.find(".StatementReferenceFiles") : null);

        if (_found) {
            _controller.Utils.BindContentEditorElement({ "Element": $vwEditorController, "DataItem": _statement, "DataType": "statement", "Controller": _controller });
            _controller.Utils.BindReferenceFileListElement({
                "Element": $vwReferenceFileController, "DataItem": _statement, "DataType": "statement", "Controller": _controller
            });
        }

        if (options.LayoutManager) {
            options.LayoutManager.ToolbarSetButtons({ "IsHideEditButtons": !_found });
        }

        $mobileUtil.refresh($element);

        var $vwUserExportAction = $element.find("[" + util_renderAttribute("pluginEditor_userExportAction") + "]");

        $vwUserExportAction.trigger("events.userExportAction_OnInit", {
            "Instance": _pluginInstance,
            "Data": valueMessage[enColCEValueMessageProperty.UserContentExports],
            "ValueMessageID": valueMessage[enColValueMessageProperty.ValueMessageID],
            "StatementID": (_statement ? _statement[enColStatementProperty.StatementID] : null),
            "Attributes": {
                "data-user-export-context-classification-platform-id": _contextClassPlatformID
            }
        });

        _controller.Utils.AnimateFromOptions(options);

        _controller.CacheGetItem({
            "Key": "BadgeList", "Callback": function (badgeList) {

                var $vwBadge = $element.find("[" + util_renderAttribute("pluginEditor_valueMessageBadge") + "]");

                $vwBadge.trigger("events.init", { "ValueMessageItem": valueMessage, "BadgeList": badgeList, "IsMinimalFormat": true });

                var _callback = function () {

                    if ($vwEditorController != null && $vwEditorController.length == 1) {
                        $vwEditorController.trigger("events.render", { "Callback": options.Callback });
                    }
                    else if (options.Callback) {
                        options.Callback();
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

        }); //end: get badge list

    });

};  //end: RenderStatementView

CValueMessageController.prototype.RenderClaimsView = function (options) {

    options = util_extend({
        "IsTransition": false, "Controller": null, "PluginInstance": null, "Callback": null, "LayoutManager": null, "AnimationCallback": null, "IsAnimate": true
    }, options);

    var _controller = options.Controller;
    var _pluginInstance = (options.PluginInstance || _controller.PluginInstance);
    var _layoutManager = options.LayoutManager;

    var $parent = $(_controller.DOM.Element).closest("[" + util_renderAttribute("pluginEditor_content") + "]");
    var $element = $parent.siblings(".ViewEditorClaims");
    var _isInit = false;
    var _isRefresh = util_forceBool(options["IsRefresh"], false);

    if ($element.length == 0) {
        $element = $("<div class='ViewEditorClaims' />");
        $element.insertAfter($parent);
        _isInit = true;
    }

    if (!$element.data("is-init")) {
        $element.data("is-init", true);

        $element.off("events.edit_entity");
        $element.on("events.edit_entity", function (e, args) {

            args = util_extend({ "PopupOptions": null, "Trigger": null, "ButtonID": null }, args);

            var $container = $(args.PopupOptions.Container);
            var $trigger = $(args.Trigger);
            var _claimID = util_forceInt(args.ButtonID == "edit_claim" ? $mobileUtil.GetClosestAttributeValue($trigger, "data-attr-claim-id") : null, enCE.None);

            var _fnGetElementData = function (opts) {

                opts = util_extend({ "CacheKey": null, "GetData": null, "OnComplete": null, "Callback": null }, opts);

                var _onCallback = function (data) {
                    opts["Data"] = data;

                    if (opts.Callback) {
                        opts.Callback(opts);
                    }
                };

                if (util_forceString(opts.CacheKey) == "" && !opts.GetData) {
                    _onCallback();
                }
                else if (opts.GetData) {
                    opts.GetData(opts, function (val) {
                        _onCallback(val);
                    });
                }
                else {
                    _controller.CacheGetItem({
                        "Key": opts.CacheKey, "Callback": function (val) {
                            _onCallback(val);
                        }
                    });
                }
            };

            var _fnBindParam = function (opts) {

                opts = util_extend({ "CacheKey": null, "GetData": null, "OnDefaultItemHTML": null, "OnItemHTML": null, "OnComplete": null, "Events": null }, opts);

                var _retFn = function (onCallback) {
                    var _renderOpts = {
                        "CacheKey": opts.CacheKey, "GetData": opts.GetData, "OnItemHTML": opts.OnItemHTML, "OnComplete": opts.OnComplete,
                        "OnDefaultItemHTML": opts.OnDefaultItemHTML,
                        "Events": opts.Events
                    };

                    _renderOpts["Callback"] = function (mRenderOptions) {
                        onCallback(mRenderOptions);
                    };

                    _fnGetElementData(_renderOpts);
                };

                return _retFn;
            };

            var _editorGroupID = util_forceInt($mobileUtil.GetClosestAttributeValue($container, "data-attr-home-editor-group-id"), enCE.None);

            var _props = [
                {
                    "n": "Category:", "p": enColClaimProperty.BadgeID,
                    "Validation": {
                        "Field": "Category",
                        "IsRequired": true
                    },
                    "OnRender": _fnBindParam({
                        "CacheKey": "BadgeListFilteredClaims",
                        "OnItemHTML": function (item) {

                            if (!item) {
                                item = {};
                                item[enColBadgeProperty.BadgeID] = enCE.None;
                            }

                            var _badgeID = item[enColBadgeProperty.BadgeID];

                            return "<div " + util_renderAttribute("pluginEditor_badgeIcon") + " " + util_htmlAttribute("data-option-value", _badgeID) + " />";
                        },
                        "OnComplete": function (opts) {

                            var $list = $(opts.Element).find("[" + util_renderAttribute("pluginEditor_badgeIcon") + "]");

                            $.each($list, function () {
                                var $this = $(this);
                                var _badgeID = util_forceInt($this.attr("data-option-value"), enCE.None);
                                var _badge = util_arrFilter(opts.DataList, enColBadgeProperty.BadgeID, _badgeID, true);

                                $this.trigger("events.init", {
                                    "Badge": (_badge.length == 1 ? _badge[0] : null), "IsFullSize": false, "IsList": true, "HasLabel": true, "AllowBlankValue": true
                                });
                            });
                        }
                    })
                },
                {
                    "n": "Claim:", "p": enColClaimProperty.Name,
                    "Validation": {
                        "Field": "Claim title",
                        "IsRequired": true
                    }
                },
                {
                    "n": "Strength of Evidence:", "p": enColClaimProperty.ClaimTypeID,
                    "Validation": {
                        "Field": "Strength of Evidence",
                        "IsRequired": true
                    },
                    "OnRender": _fnBindParam({
                        "CacheKey": "ClaimTypeList",
                        "OnItemHTML": function (item) {

                            if (!item) {
                                item = {};
                                item[enColClaimTypeProperty.ClaimTypeID] = enCE.None;
                            }

                            var _claimTypeID = item[enColClaimTypeProperty.ClaimTypeID];

                            return "<div class='EditorClaimViewModeList' " + util_htmlAttribute("data-option-value", _claimTypeID) + ">" +
                                   "    <div class='EditorClaimType EditorClaimType_" + _claimTypeID + "' />" +
                                   "    <div class='EditorClaimTypeLabel'>" + util_htmlEncode(item[enColClaimTypeProperty.Name]) + "</div>" +
                                   "</div>";
                        }
                    })
                },
                {
                    "n": "Value Message:", "p": enColClaimProperty.ValueMessageID,
                    "OnRender": _fnBindParam({
                        "GetData": function (populateOpts, onCallback) {

                            //NOTE: do not filter by the editor group ID since the claim's value message must not be filtered on the platform level
                            GlobalService.ValueMessageGetByForeignKey({ "SortColumn": enColValueMessage.Name }, function (valueMessageData) {
                                var _valueMessages = (valueMessageData && valueMessageData.List ? valueMessageData.List : null);

                                _controller.CacheGetItem({
                                    "Key": "BadgeList", "Callback": function (val) {

                                        populateOpts["AllBadgeList"] = (val || []);

                                        onCallback(_valueMessages || []);
                                    }
                                });
                            });
                        },
                        "OnItemHTML": function (item) {

                            if (!item) {
                                item = {};
                                item[enColValueMessageProperty.ValueMessageID] = enCE.None;
                            }

                            var _valueMessageID = item[enColValueMessageProperty.ValueMessageID];

                            return "<div class='EditorDropdownOptionFixedHeight EditorDropdownValueMessage' " +
                                   util_htmlAttribute("data-option-value", _valueMessageID) + ">" +
                                   "    <div " + util_renderAttribute("pluginEditor_valueMessageBadge") + " " + 
                                   util_htmlAttribute("data-attr-vm-badge-delimited-id", util_forceString(item[enColValueMessageProperty.DelimitedBadgeID])) + " />" +
                                   "    <div class='EditorDropdownLabel Label'>" + util_htmlEncode(item[enColValueMessageProperty.Name]) + "</div>" +
                                   "</div>";
                        },
                        "Events": {
                            "OnChange": function (e, args) {
                                
                                //force refresh of the statements related to the updated value message selection
                                var $ddlStatement = $container.find("[" + util_htmlAttribute("data-attr-prop", enColClaimProperty.StatementID) + "] " +
                                                                    "select[" + util_htmlAttribute("data-attr-prop-input", enCETriState.Yes) + "]");

                                $ddlStatement.trigger("events.refresh");
                            }
                        },
                        "OnComplete": function (opts) {
                            var $list = $(opts.Element).find("[" + util_renderAttribute("pluginEditor_valueMessageBadge") + "]");
                            var _badgeList = (opts.RenderOptions["AllBadgeList"] || []);
                            var _lookup = {};

                            for (var b = 0; b < _badgeList.length; b++) {
                                var _badge = _badgeList[b];
                                var _badgeID = _badge[enColBadgeProperty.BadgeID];

                                _lookup[_badgeID] = _badge;
                            }

                            $.each($list, function () {
                                var $this = $(this);
                                var _badgeIDs = util_forceString($this.attr("data-attr-vm-badge-delimited-id"));
                                var _selectedBadges = [];

                                if (_badgeIDs != "") {
                                    _badgeIDs = _badgeIDs.split(",");
                                }
                                else {
                                    _badgeIDs = [];
                                }

                                for (var j = 0; j < _badgeIDs.length; j++) {
                                    var _searchID = util_forceInt(_badgeIDs[j]);

                                    if (_lookup[_searchID]) {
                                        _selectedBadges.push(_lookup[_searchID]);
                                    }
                                }

                                $this.trigger("events.init", { "BadgeList": _selectedBadges, "IsMinimalFormat": true, "IsForceStateOn": true });
                            });
                        }
                    })
                },
                {
                    "n": "Evidence Supported Statement (optional):", "p": enColClaimProperty.StatementID,
                    "OnRender": _fnBindParam({
                        "GetData": function (populateOpts, onCallback) {

                            var $ddlValueMessage = $container.find("[" + util_htmlAttribute("data-attr-prop", enColClaimProperty.ValueMessageID) + "] " +
                                                                   "select[" + util_htmlAttribute("data-attr-prop-input", enCETriState.Yes) + "]");
                            
                            var _filterValueMessageID = util_forceInt($ddlValueMessage.val(), enCE.None);

                            if (_filterValueMessageID == enCE.None) {
                                onCallback([]);
                            }
                            else {
                                GlobalService.StatementGetByForeignKey({ "ValueMessageID": _filterValueMessageID }, function (statementData) {
                                    var _statements = (statementData && statementData.List ? statementData.List : null);

                                    onCallback(_statements || []);
                                });
                            }
                        },
                        "OnItemHTML": function (item) {

                            var _cssClass = "EditorDropdownOptionFixedHeight EditorDropdownStatement";

                            if (!item) {
                                item = {};
                                item[enColStatementProperty.StatementID] = enCE.None;
                                _cssClass += " EditorDropdownStatementBlankItem";
                            }

                            var _statementID = item[enColStatementProperty.StatementID];

                            return "<div class='" + _cssClass + "' " +
                                   util_htmlAttribute("data-option-value", _statementID) + ">" +
                                   "    <div class='EditorDropdownLabel Label'>" + util_htmlEncode(item[enColStatementProperty.Name]) + "</div>" +
                                   "</div>";
                        }
                    })
                },
                {
                    "n": "Associate Claim with the following Platform(s):", "p": enColCEClaimProperty.ClaimPlatforms,
                    "Validation": {
                        "IsRequired": true
                    },
                    "OnRender": function (opts) {

                        opts = util_extend({ "Target": null, "DataItem": null, "Value": null, "Callback": null }, opts);

                        var _platforms = $element.data("cache-platforms_" + _editorGroupID);

                        var _onCallback = function () {

                            var _claimPlatforms = opts.Value;
                            var _html = "";
                            var $obj = $(opts.Target);

                            _html += _controller.Utils.HTML.PlatformFlipSwitchToggles({
                                "Controller": _controller, "Platforms": _platforms, "BridgeList": opts.Value,
                                "PropertyBridgePlatformID": enColClaimPlatformProperty.PlatformID,
                                "ComponentID": _controller.Utils.ContextEditorGroupComponentID($element),
                                "RenderEditorForeignTypeID": enCEEditorForeignType.SubDossier,
                                "BridgeEditorGroupPermissionList": (opts.DataItem ? opts.DataItem[enColCEClaimProperty.EditorGroupForeignPermissions] : null)
                            });
                            
                            $obj.html(_html);
                            $mobileUtil.refresh($obj);

                            _controller.Utils.BindFlipSwitchEvents({ "Element": $obj });

                            if (opts.Callback) {
                                opts.Callback();
                            }
                        };

                        if (_platforms) {
                            _onCallback();
                        }
                        else {
                            _pluginInstance.GetData({
                                "Type": "PlatformList", "Filters": {
                                    "FilterEditorGroupID": _editorGroupID,
                                    "SortColumn": enColPlatformProperty.DisplayOrder
                                }
                            }, function (dataResult) {
                                _platforms = (dataResult && dataResult.Success && dataResult.Data ? dataResult.Data.List : null);
                                _platforms = (_platforms || []);

                                $element.data("cache-platforms_" + _editorGroupID, _platforms);

                                _onCallback();
                            });
                        }
                    }
                }
            ];

            var _projectProps = ("%%TOK|ROUTE|PluginEditor|DossierClaimEditFields%%" || []);

            _projectProps = (_projectProps || []);

            for (var p = 0; p < _projectProps.length; p++) {
                var _prop = util_extend({
                    "n": null, "p": null,
                    "Validation": {
                        "Field": null,
                        "IsRequired": false
                    }
                }, _projectProps[p]);

                _prop["OnRender"] = function (opts) {
                    _controller.ProjectOnRenderClaimField(opts);
                };

                _prop["OnPopulate"] = function (opts) {
                    _controller.ProjectOnPopulateClaimField(opts);
                };

                _props.push(_prop);
            }

            var _html = "<div class='EditorAdminEditTable EditorClaimAdminEditTable'>";

            for (var p = 0; p < _props.length; p++) {
                var _prop = _props[p];
                var _heading = _prop["n"];
                var _property = _prop.p;
                var _inputHTML = "";
                var _hasDropdown = false;
                var _attrPropInput = util_htmlAttribute("data-attr-prop-input", enCETriState.Yes);

                if (_prop["Validation"]) {
                    var _validation = util_extend({ "Field": null, "IsRequired": false }, _prop.Validation);

                    _attrPropInput += " " + util_htmlAttribute("data-attr-validation-is-required", _validation.IsRequired ? enCETriState.Yes : enCETriState.No) +
                                      " " + util_htmlAttribute("data-attr-validation-name", util_forceString(_validation.Field), null, true);
                }

                switch (_property) {

                    case enColClaimProperty.BadgeID:
                    case enColClaimProperty.ClaimTypeID:
                    case enColClaimProperty.ValueMessageID:
                    case enColClaimProperty.StatementID:
                        _inputHTML += "<select " + _attrPropInput + " data-corners='false' data-mini='true' disabled='disabled' />";
                        _hasDropdown = true;
                        break;

                    case enColClaimProperty.Name:
                        _inputHTML += "<textarea " + _attrPropInput + " data-corners='false' data-mini='true' disabled='disabled' />";
                        break;

                    default:
                        _inputHTML += "<div " + _attrPropInput + " />";
                        break;
                }

                _html += "<div class='TableBlockRow'" + (_property ? " " + util_htmlAttribute("data-attr-prop", _property) : "") + ">" +
                         "  <div class='TableBlockCell ColumnHeading'>" + util_htmlEncode(_heading) + "</div>" +
                         "  <div class='TableBlockCell ColumnContent" + (_hasDropdown ? " EditorElementDropdown" : "") + "'>" + _inputHTML + "</div>" +
                         "</div>";
            }

            _html += "</div>";

            $container.html(_html);
            $mobileUtil.refresh($container);

            var $inputs = $container.find("[data-attr-prop-input]");
            var _claim = null;

            var _fnBindInput = function (index, bindCallback) {

                if (index >= $inputs.length) {
                    if (bindCallback) {
                        bindCallback();
                    }
                }
                else {
                    var $input = $($inputs.get(index));
                    var _propName = $mobileUtil.GetClosestAttributeValue($input, "data-attr-prop");
                    var _prop = util_arrFilter(_props, "p", _propName, true);
                    var _val = _claim[_propName];

                    _prop = (_prop.length == 1 ? _prop[0] : null);

                    if ($input.is("select")) {
                        $input.selectmenu("enable");
                    }
                    else if ($input.is("input, textarea")) {
                        $input.textinput("enable");
                    }

                    if (!_prop || (_prop && !_prop["OnRender"])) {
                        $input.val(util_forceString(_val));
                        _fnBindInput(index + 1, bindCallback);
                    }
                    else {

                        var _methodOpts = null;

                        if ($input.is("select")) {
                            _methodOpts = function (renderOpts) {
                                renderOpts = util_extend({ "Element": $input, "SelectedValue": _val, "OnRender": _prop.OnRender }, renderOpts);
                                _controller.Utils.FloatingDropdown(renderOpts);

                                _fnBindInput(index + 1, bindCallback);
                            };
                        }
                        else {
                            _methodOpts = {
                                "Property": _prop,
                                "PropertyPath": _property,
                                "Target": $input,
                                "DataItem": _claim,
                                "Value": _val,
                                "Callback": function () {
                                    _fnBindInput(index + 1, bindCallback);
                                }
                            };
                        }

                        _prop.OnRender(_methodOpts);
                    }
                }
            };

            APP.Service.Action({
                "c": "PluginEditor", "m": "ClaimGetByPrimaryKey",
                "args": {
                    "_EditorGroupID": _controller.Utils.ContextEditorGroupID($container),
                    "ClaimID": _claimID, "DeepLoad": true
                }
            }, function (data) {

                _claim = (data || {});

                var $tbl = $container.find(".EditorClaimAdminEditTable");

                var _srcDataListLookup = {};

                if (util_forceInt(_claim[enColClaimProperty.ClaimID], enCE.None) == enCE.None) {
                    var _claimPlatforms = _claim[enColCEClaimProperty.ClaimPlatforms];

                    if (!_claimPlatforms) {
                        _claimPlatforms = [];
                        _claim[enColCEClaimProperty.ClaimPlatforms] = _claimPlatforms;
                    }

                    var _currentPlatformID = util_forceInt($mobileUtil.GetClosestAttributeValue($tbl, "data-home-editor-group-platform-id"), enCE.None);
                    var _search = util_arrFilter(_claimPlatforms, enColClaimPlatformProperty.PlatformID, _currentPlatformID, true);

                    if (_search.length == 0) {
                        var _defaultClaimPlatform = new CEClaimPlatform();

                        _defaultClaimPlatform[enColClaimPlatformProperty.PlatformID] = _currentPlatformID;
                        _claimPlatforms.push(_defaultClaimPlatform);
                    }

                    var _claimForeignPermissions = _controller.Utils.Managers.Data.InitEditorGroupForeignPermissionList({
                        "PlatformID": _currentPlatformID,
                        "ComponentID": _controller.Utils.ContextEditorGroupComponentID($container),
                        "BridgeItemEditorForeignTypeID": enCEEditorForeignType.TableClaim,
                        "EditorForeignTypeID": enCEEditorForeignType.SubDossier,
                        "List": _claim[enColCEClaimProperty.EditorGroupForeignPermissions]
                    });

                    _claim[enColCEClaimProperty.EditorGroupForeignPermissions] = _claimForeignPermissions;
                }

                _srcDataListLookup[enColCEClaimProperty.ClaimPlatforms] = _claim[enColCEClaimProperty.ClaimPlatforms];
                _srcDataListLookup[enColCEClaimProperty.EditorGroupForeignPermissions] = _claim[enColCEClaimProperty.EditorGroupForeignPermissions];
                
                $tbl.data("DataItem", _claim)
                    .data("SourceDataListLookup", _srcDataListLookup);

                $tbl.off("events.populateItem");
                $tbl.on("events.populateItem", function (e, args) {
                    args = util_extend({ "Item": null, "Callback": null }, args);

                    if (!args.Item) {
                        args.Item = {};
                    }

                    var _item = args.Item;
                    var _listLookup = ($tbl.data("SourceDataListLookup") || {});

                    var $inputs = $tbl.find("[data-attr-prop] [" + util_htmlAttribute("data-attr-prop-input", enCETriState.Yes) + "]");

                    $.each($inputs, function () {
                        var $input = $(this);
                        var _val = null;
                        var _propName = $mobileUtil.GetClosestAttributeValue($input, "data-attr-prop");
                        var _isRequired = (util_forceInt($input.attr("data-attr-validation-is-required"), enCETriState.No) == enCETriState.Yes);
                        var _hasValue = true;
                        var _customReqMessage = null;
                        var _handled = false;

                        if ($input.is("select")) {
                            _val = util_forceInt($input.val(), enCE.None);
                            _hasValue = (_val != enCE.None);

                            if (!_isRequired && !_hasValue) {
                                _val = null;
                            }
                        }
                        else if ($input.is("input[type='text'], textarea")) {
                            _val = util_trim($input.val());

                            $input.val(_val);
                            _hasValue = (_val != "");
                        }
                        else if (_propName == enColCEClaimProperty.ClaimPlatforms) {

                            var $cbPlatforms = $input.find(".FlipSwitchInline [data-attr-platform-toggle-id] select[data-attr-widget='flip_switch']");
                            var _srcClaimPlatforms = _listLookup[_propName];
                            var _srcClaimEditorGroupPerms = _listLookup[enColCEClaimProperty.EditorGroupForeignPermissions];

                            var _arrClaimEditorGroupPerms = [];

                            _val = [];

                            $.each($cbPlatforms, function () {
                                var $cb = $(this);
                                var _selected = (util_forceInt($cb.val(), enCETriState.No) == enCETriState.Yes);

                                if (_selected) {
                                    var _platformID = util_forceInt($mobileUtil.GetClosestAttributeValue($cb, "data-attr-platform-toggle-id"), enCE.None);
                                    var _claimPlatform = util_arrFilter(_srcClaimPlatforms, enColClaimPlatformProperty.PlatformID, _platformID, true);

                                    if (_claimPlatform.length == 1) {
                                        _claimPlatform = _claimPlatform[0];
                                    }
                                    else {
                                        _claimPlatform = new CEClaimPlatform();
                                    }

                                    _claimPlatform[enColClaimPlatformProperty.PlatformID] = _platformID;

                                    _val.push(_claimPlatform);

                                    var _currentEditorGroupPerms = _controller.Utils.Managers.Data.PopulateEditorGroupForeignPermissions({
                                        "Element": $cb.closest(".FlipSwitchInline"),
                                        "SourceList": _srcClaimEditorGroupPerms,
                                        "BridgeItemEditorForeignTypeID": enCEEditorForeignType.TableClaim
                                    });

                                    $.merge(_arrClaimEditorGroupPerms, _currentEditorGroupPerms);
                                }
                            });

                            if (_val.length == 0) {
                                _customReqMessage = "At least one platform is required for the Claim.";
                            }

                            _item[enColCEClaimProperty.EditorGroupForeignPermissions] = _arrClaimEditorGroupPerms;
                        }
                        else {

                            var _prop = util_arrFilter(_props, "p", _propName, true);

                            _prop = (_prop.length == 1 ? _prop[0] : null);

                            if (_prop && _prop["OnPopulate"]) {

                                _prop.OnPopulate({
                                    "Controller": _controller, "Element": $input, "Property": _prop, "PropertyPath": _propName, "IsRequired": _isRequired,
                                    "DataItem": _item
                                });
                            }

                            _handled = true;
                        }

                        if (_customReqMessage != null) {
                            AddUserError(_customReqMessage);
                        }
                        else if (_isRequired && !_hasValue) {
                            var _field = util_forceString($input.attr("data-attr-validation-name"));

                            AddUserError(_field + " is required.");
                        }

                        if (!_handled) {
                            _item[_propName] = _val;
                        }
                    });

                    if (args.Callback) {
                        args.Callback(_item);
                    }

                }); //end: events.populateItem

                _fnBindInput(0);

            }); //end: ClaimGetByPrimaryKey

        }); //end: events.edit_entity

        $element.off("click.view_claim");
        $element.on("click.view_claim", ".EditorClaim.LinkClickable:not(.LinkDisabled)[data-attr-claim-id]", function (e, args) {

            var $claim = $(this);
            var _claimID = util_forceInt($claim.attr("data-attr-claim-id"), enCE.None);
            var _claimTypeID = util_forceInt($claim.attr("data-attr-claim-type-id"), enCE.None);
            var _lookupClaim = ($claim.closest(".List").data("LookupClaims") || {});
            var _claimList = _lookupClaim[_claimTypeID];

            var _claim = util_arrFilter(_claimList, enColClaimProperty.ClaimID, _claimID, true);

            if (_claim.length == 1) {
                _claim = _claim[0];

                var _valueMessageID = _claim[enColClaimProperty.ValueMessageID];
                var _statementID = util_forceInt(_claim[enColClaimProperty.StatementID], enCE.None);

                if (_valueMessageID != enCE.None) {

                    if (_statementID != enCE.None) {
                        _controller.RenderStatementView({
                            "ValueMessageID": _valueMessageID, "StatementID": _statementID, "IsTransition": true, "IsAnimate": true,
                            "Controller": _controller, "PluginInstance": _pluginInstance, "LayoutManager": _layoutManager
                        });
                    }
                    else {

                        //search for the editor criteria that is read only related to the "All Value Messages" view
                        GlobalService.EditorGroupCriteriaGetByForeignKey({
                            "FilterEditorForeignTypeID": enCEEditorForeignType.ValueMessageDynamicGroup,
                            "EditorGroupID": util_forceInt($mobileUtil.GetClosestAttributeValue($element, "data-attr-home-editor-group-id"), enCE.None),
                            "PageSize": 1, "PageNum": 1
                        }, function (editorGroupCriteriaData) {

                            var _editorGroupCriteriaList = (editorGroupCriteriaData ? editorGroupCriteriaData.List : null);

                            _editorGroupCriteriaList = (_editorGroupCriteriaList || []);

                            if (_editorGroupCriteriaList.length == 1) {
                                var _editorGroupCriteriaAllView = _editorGroupCriteriaList[0];

                                _controller.RenderCriteriaDetailView({
                                    "EditorCriteriaID": _editorGroupCriteriaAllView[enColEditorGroupCriteriaProperty.EditorCriteriaID],
                                    "FocusValueMessageID": _valueMessageID,
                                    "IsTransition": true, "IsAnimate": true,
                                    "Controller": _controller, "PluginInstance": _pluginInstance, "LayoutManager": _layoutManager, "TrackBreadcrumb": true
                                });
                            }
                            else {
                                util_logError("RenderClaimsView :: " +
                                              "load Claim value message (without statement selection) does not have a matching 'All' Editor Criteria data item");
                            }

                        });

                    }
                }
            }

        }); //end: click.view_claim
    }

    //clear the toolbar buttons
    if (options.LayoutManager) {
        options.LayoutManager.ToolbarSetButtons({
            "IsInsertStart": true,
            "List": _controller.Utils.HTML.GetButton({
                "ActionButtonID": "popup", "Content": "View Icon Legend", "Attributes": {
                    "data-attr-popup-id": "popup_claim_types_legend", "data-icon": "info"
                }
            })
        });
    }

    var $prevActiveView = _controller.SetElementViewMode({ "Mode": enCValueMessageViewMode.Claims, "ActiveElement": $element, "IsBindEvents": true });

    _controller.Utils.AnimateFromOptions(options);

    var _callback = function () {

        $element.removeClass("EffectGrayscale");

        if (options.Callback) {
            options.Callback();
        }
    };

    var _fnPopulateData = function (dataCallback) {
        var _result = { "BadgeList": null, "ClaimTypeList": null };
        var _arr = [];

        var _fn = function () {
            if (_arr.length == 0) {
                dataCallback(_result);
            }
            else {
                var _fnData = _arr.shift();

                _fnData(_fn);
            }
        };

        _arr.push(function (listCallback) {
            _controller.CacheGetItem({
                "Key": "BadgeListFilteredClaims", "Callback": function (val) {
                    _result.BadgeList = val;
                    listCallback();
                }
            });
        });

        _arr.push(function (listCallback) {
            _controller.CacheGetItem({
                "Key": "ClaimTypeList", "Callback": function (val) {
                    _result.ClaimTypeList = val;
                    listCallback();
                }
            });
        });

        _fn();

    };  //end: _fnPopulateData

    $element.toggleClass("EffectGrayscale", _isRefresh);

    _fnPopulateData(function (resultData) {

        var _badges = (resultData.BadgeList || []);        
        var _html = "";
        var _requireLayoutInit = true;

        var $list = $element.find(".EditorClaimList[data-attr-claim-badge-id]");

        if (!_isInit && _isRefresh && $list.length > 0) {

            _requireLayoutInit = false;

            for (var i = 0; i < _badges.length; i++) {
                var _badge = _badges[i];
                var _badgeID = _badge[enColBadgeProperty.BadgeID];

                var $search = $list.filter("[" + util_htmlAttribute("data-attr-claim-badge-id", _badgeID) + "]");

                if ($search.length == 0) {
                    _requireLayoutInit = true;
                    break;
                }
            }
        }

        if (_requireLayoutInit) {
            _html = "<h2>Claims</h2>";

            for (var b = 0; b < _badges.length; b++) {
                var _badge = _badges[b];
                var _badgeID = _badge[enColBadgeProperty.BadgeID];

                _html += "<div class='EditorClaimList EditorClaimBadge_" + _badgeID + "' " +
                         util_htmlAttribute("data-attr-claim-badge-id", _badgeID) + ">" +
                         "  <div class='Heading'>" +
                         "      <div " + util_renderAttribute("pluginEditor_badgeIcon") + " />" +
                         "  </div>" +
                         "  <div class='List' />" +
                         "</div>";
            }

            $element.html(_html);
            $mobileUtil.refresh($element);

            $list = $element.find(".EditorClaimList[data-attr-claim-badge-id]");
        }

        var _layoutManager = options.LayoutManager;

        var _fnGetClaimsLookupData = function (dataCallback) {

            var _editorGroupID = util_forceInt($mobileUtil.GetClosestAttributeValue($parent, "data-attr-home-editor-group-id"), enCE.None);

            if (_editorGroupID == enCE.None) {
                dataCallback({});
            }
            else {

                var _filterSelections = _layoutManager.FilterSelections();

                APP.Service.Action({
                    "c": "PluginEditor", "m": "ClaimGetByForeignKey",
                    "args": {
                        "_EditorGroupID": _editorGroupID,
                        "Filters": _filterSelections.Lookup
                    }
                }, function (claimData) {
                    var _claims = (claimData && claimData.List ? claimData.List : null);
                    var _lookup = {};

                    _claims = (_claims || []);

                    for (var i = 0; i < _claims.length; i++) {
                        var _claim = _claims[i];
                        var _badgeID = _claim[enColClaimProperty.BadgeID];
                        var _claimTypeID = _claim[enColClaimProperty.ClaimTypeID];

                        var _lookupClaimType = null;
                        var _list = null;

                        if (_lookup[_badgeID]) {
                            _lookupClaimType = _lookup[_badgeID];
                        }
                        else {
                            _lookupClaimType = {};
                            _lookup[_badgeID] = _lookupClaimType;
                        }

                        if (_lookupClaimType[_claimTypeID]) {
                            _list = _lookupClaimType[_claimTypeID];
                        }
                        else {
                            _list = [];
                            _lookupClaimType[_claimTypeID] = _list;
                        }

                        _list.push(_claim);
                    }

                    dataCallback(_lookup);
                });
            }

        };  //end: _fnGetClaimsLookupData

        var _fnPopulateClaims = function (index, lookupClaimList) {

            index = util_forceInt(index, 0);

            if (index == 0 && !lookupClaimList) {
                _fnGetClaimsLookupData(function (dataLookup) {

                    lookupClaimList = (dataLookup || {});
                    _fnPopulateClaims(0, lookupClaimList);
                });
            }
            else if (index >= $list.length) {
                _callback();
            }
            else {
                var $vw = $($list.get(index));
                var $badge = $vw.find(".Heading [" + util_renderAttribute("pluginEditor_badgeIcon") + "]");
                var _badgeID = util_forceInt($vw.attr("data-attr-claim-badge-id"), enCE.None);
                var _badgeItem = util_arrFilter(_badges, enColBadgeProperty.BadgeID, _badgeID, true);

                _badgeItem = (_badgeItem.length == 1 ? _badgeItem[0] : null);

                $badge.trigger("events.init", { "Badge": _badgeItem, "HasLabel": true });

                var _lookupClaims = lookupClaimList[_badgeID];
                var _html = "";

                if (_lookupClaims) {

                    for (var c = 0; c < resultData.ClaimTypeList.length; c++) {
                        var _claimType = resultData.ClaimTypeList[c];
                        var _claimTypeID = _claimType[enColClaimTypeProperty.ClaimTypeID];

                        if (_lookupClaims[_claimTypeID]) {
                            var _claims = _lookupClaims[_claimTypeID];

                            for (var j = 0; j < _claims.length; j++) {
                                var _claim = _claims[j];
                                var _claimTypeID = _claim[enColClaimProperty.ClaimTypeID];
                                var _clickable = (util_forceInt(_claim[enColClaimProperty.ValueMessageID], enCE.None) != enCE.None);

                                _html += "<div class='PluginEditorCardView EditorClaim" + (_clickable ? " DisableUserSelectable LinkClickable" : "") + "' " +
                                         util_htmlAttribute("data-attr-claim-id", _claim[enColClaimProperty.ClaimID]) + " " +
                                         util_htmlAttribute("data-attr-claim-type-id", _claimTypeID) + ">" +
                                         "  <div class='EditorClaimType EditorClaimType_" + _claimTypeID + "' />" +
                                         "  <div class='Label'>" + util_htmlEncode(_claim[enColClaimProperty.Name], true) + "</div>" +
                                         "</div>";
                            }
                        }
                    }
                }

                var $vwContentList = $vw.find(".List");

                $vwContentList.data("LookupClaims", _lookupClaims);

                $vwContentList.html(_html);
                $mobileUtil.refresh($vwContentList);

                setTimeout(function () {
                    _fnPopulateClaims(index + 1, lookupClaimList);
                }, options["IsRefresh"] ? 0 : 100);
            }

        };  //end: _fnPopulateClaims

        var _queue = new CEventQueue();

        if (!_layoutManager) {
            _queue.Add(function (onCallback) {
                $element.trigger("events.getLayoutManager", {
                    "Callback": function (manager) {

                        _layoutManager = manager;
                        onCallback();
                    }
                });
            });
        }

        if (_isInit) {
            _queue.Add(function (onCallback) {
                var _arrFilters = [];

                _controller.ProjectOnGetFilters({
                    "Callback": function (arr) {
                        arr = (arr || []);

                        _arrFilters = $.merge(_arrFilters, arr);

                        options.LayoutManager.FilterSetView({
                            "List": _arrFilters, "Callback": function () {
                                onCallback();
                            }
                        });
                    }
                });
            });
        }
        else {
            
            //refresh the country filter
            _queue.Add(function (onCallback) {

                if (_layoutManager) {
                    _layoutManager.FilterRefresh({
                        "TypeID": "country", "Callback": function (opts) {
                            onCallback();
                        }
                    });
                }
                else {
                    onCallback();
                }
            });
        }

        _queue.Run({
            "Callback": function () {

                if (options.IsTransition && $prevActiveView && $prevActiveView.length && $prevActiveView.not($element) && $prevActiveView.is(":visible")) {

                    if (options.IsAnimate) {

                        $prevActiveView.show();
                        $element.show();

                        $prevActiveView.addClass("EffectBlur")
                                       .slideUp("normal", function () {

                                           $prevActiveView.removeClass("EffectBlur");
                                           _fnPopulateClaims();
                                       });
                    }
                    else {
                        $prevActiveView.hide();
                        $element.show();

                        _fnPopulateClaims();
                    }
                }
                else {
                    _fnPopulateClaims();
                }
            }
        });

    });

};  //end: RenderClaimsView

CValueMessageController.prototype.PopupBadgeLegendHTML = function (options) {
    
    options = util_extend({ "Controller": null, "PluginInstance": null, "Trigger": null }, options);

    var _html = "";
    var _controller = options.Controller;
    var _pluginInstance = (options.PluginInstance ? options.PluginInstance : _controller.PluginInstance);

    var _callback = function () {

        if (options.Callback) {
            options.Callback(_html);
        }
    };

    var _fnGetBadges = function (dataCallback) {

        _controller.CacheGetItem({
            "Key": "BadgeList", "Callback": function (val) {
                dataCallback(val);
            }
        });

    };  //end: _fnGetBadges
    
    _fnGetBadges(function (badgeList) {
        badgeList = (badgeList || []);

        _html += "<div class='EditorTableList EditorPopupLegend'>";

        for (var i = 0; i < badgeList.length; i++) {
            var _badge = badgeList[i];

            _html += "<div class='TableRowItem'>" +
                     "  <div class='EditorBadge OnState EditorBadge_" + _badge[enColBadgeProperty.BadgeID] + "' />" +
                     "  <div class='Title'>" + util_htmlEncode(_badge[enColBadgeProperty.Name]) + "</div>" +
                     "</div>";
        }

        _html += "</div>";

        _callback();
    });

};  //end: PopupBadgeLegend

CValueMessageController.prototype.PopupClaimTypeLegendHTML = function (options) {

    options = util_extend({ "Controller": null, "PluginInstance": null, "Trigger": null }, options);

    var _html = "";
    var _controller = options.Controller;
    var _pluginInstance = (options.PluginInstance ? options.PluginInstance : _controller.PluginInstance);

    var _callback = function () {

        if (options.Callback) {
            options.Callback(_html);
        }
    };

    _controller.CacheGetItem({
        "Key": "ClaimTypeList", "Callback": function (claimTypes) {


            claimTypes = (claimTypes || []);

            _html += "<div class='EditorTableList EditorPopupLegend EditorPopupLegendViewDefault'>";

            for (var i = 0; i < claimTypes.length; i++) {
                var _claimType = claimTypes[i];

                _html += "<div class='TableRowItem'>" +
                         "  <div class='EditorClaimType EditorClaimType_" + _claimType[enColClaimTypeProperty.ClaimTypeID] + "' />" +
                         "  <div class='Title'>" +
                         "      <div>" + util_htmlEncode(_claimType[enColClaimTypeProperty.Name]) + "</div>" +
                         "      <div class='Description'>" + util_htmlEncode(_claimType[enColClaimTypeProperty.Description]) + "</div>" +
                         "  </div>" +
                         "</div>";
            }

            _html += "</div>";

            _callback();
        }
    });

};  //end: PopupClaimTypeLegendHTML

RENDERER_LOOKUP["pluginEditor_badgeIcon"] = function (context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_badgeIcon");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.is("is-init")) {

            $element.is("is-init", true);

            $element.off("events.init");
            $element.on("events.init", function (e, args) {

                args = util_extend({ "Badge": null, "IsFullSize": true, "HasLabel": false, "IsList": false, "AllowBlankValue": false }, args);

                var _html = "";

                var _badge = (args.Badge || {});
                var _badgeID = _badge[enColBadgeProperty.BadgeID];

                if (util_forceInt(_badgeID, enCE.None) != enCE.None || args.AllowBlankValue) {
                    var _cssClass = "EditorBadge" + (args.IsFullSize ? " EditorBadgeFullSize" : "") + " EditorBadge_" + _badgeID + " OnState";

                    _html += "<div " + util_htmlAttribute("class", _cssClass) + " " + util_htmlAttribute("data-attr-badge-id", _badgeID) + " " +
                             util_htmlAttribute("title", _badge[enColBadgeProperty.Name], null, true) + " />";

                    if (args.HasLabel) {
                        _html += "<div class='EditorBadgeLabel'>" + util_htmlEncode(_badge[enColBadgeProperty.Name]) + "</div>";
                    }
                }

                $element.data("data-item", _badge);
                $element.html(_html).trigger("create");

                $element.toggleClass("EditorBadgeViewModeList", args.IsList);

            }); //end: events.init
        }
    });

};

RENDERER_LOOKUP["pluginEditor_valueMessageBadge"] = function (context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_valueMessageBadge");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.is("is-init")) {

            $element.addClass("EditorValueMessageBadgeView ElementLinksDisabled");

            $element.off("events.init");
            $element.on("events.init", function (e, args) {

                args = util_extend({ "BadgeList": [], "ValueMessageItem": null, "Callback": null, "IsMinimalFormat": false, "IsForceStateOn": false }, args);

                var _badgeList = (args.BadgeList || []);
                var _html = "";

                var _prevLevel = null;
                var _hasPreviousState = false;
                var _lookupSelectedBadge = {};

                if (args.ValueMessageItem && args.ValueMessageItem[enColCEValueMessageProperty.ValueMessageBadges]) {
                    var _vmBadges = args.ValueMessageItem[enColCEValueMessageProperty.ValueMessageBadges];

                    for (var b = 0; b < _vmBadges.length; b++) {
                        var _valueMessageBadge = _vmBadges[b];
                        var _badgeID = _valueMessageBadge[enColValueMessageBadgeProperty.BadgeID];

                        _lookupSelectedBadge[_badgeID] = true;
                    }
                }

                var _lookupLevelDivider = {};

                for (var i = 0; i < _badgeList.length; i++) {
                    var _badge = _badgeList[i];
                    var _badgeID = _badge[enColBadgeProperty.BadgeID];
                    var _level = _badge[enColBadgeProperty.Level];
                    var _stateOn = (args.IsForceStateOn || _lookupSelectedBadge[_badgeID] === true);
                    var _isPlaceholder = _badge[enColBadgeProperty.IsPlaceholder];
                    var _cssClass = "LinkClickable EditorBadge EditorBadge_" + _badgeID;

                    if (_prevLevel != null && _prevLevel != _level) {
                        _html += "<div class='EditorBadgeDivider " + ((_hasPreviousState && (_stateOn || _isPlaceholder)) ? "OnState" : "OffState") +
                                 (_level ? " EditorBadgeDividerLevel_" + _level : "") + "' />";
                        _hasPreviousState = false;

                        _lookupLevelDivider[_level] = false;
                    }

                    _cssClass += " " + (_stateOn ? "OnState" : "OffState");

                    if (_isPlaceholder) {
                        _cssClass += " PlaceholderState";
                    }

                    _html += "<div " + util_htmlAttribute("class", _cssClass) + " " + util_htmlAttribute("data-attr-badge-id", _badgeID) + " " +
                             util_htmlAttribute("title", _badge[enColBadgeProperty.Name], null, true) + " />";

                    _lookupLevelDivider[_level] = (_stateOn || _lookupLevelDivider[_level]);

                    _prevLevel = _level;
                    _hasPreviousState = (_hasPreviousState || _stateOn);
                }

                $element.toggleClass("EditorValueMessageBadgeViewMinimal", args.IsMinimalFormat);

                $element.data("data-list", _badgeList);
                $element.html(_html).trigger("create");

                if (args.IsMinimalFormat) {
                    var $dividers = $element.find(".EditorBadgeDivider");

                    for (var _level in _lookupLevelDivider) {
                        if (_level && _lookupLevelDivider[_level] == false) {
                            $dividers.filter(".EditorBadgeDividerLevel_" + _level).hide();
                        }
                    }
                }

                if (args.Callback) {
                    args.Callback();
                }

            }); //end: events.init

            $element.off("events.refresh");
            $element.on("events.refresh", function (e, args) {

                args = util_extend({ "Callback": null }, args);

                var $dividers = $element.find(".EditorBadgeDivider");

                $.each($dividers, function () {
                    var $divider = $(this);
                    var _hasGroupBadgeOn = false;
                    var $prev = $divider.prev(".EditorBadge");

                    while (!_hasGroupBadgeOn && $prev != null && $prev.is(".EditorBadge")) {
                        _hasGroupBadgeOn = $prev.hasClass("OnState");
                        $prev = $prev.prev(".EditorBadge");
                    }

                    $divider.toggleClass("OffState", !_hasGroupBadgeOn);
                });

                if (args.Callback) {
                    args.Callback();
                }

            }); //end: events.refresh

            //populates the specified object with following properties: {"Elements", "Values"} related to the elements currently selected and array of its badge IDs
            //NOTE: callbacks are not supported and referenced object to be populated required.
            $element.off("events.getSelection");
            $element.on("events.getSelection", function (e, args) {

                args = util_extend({ "PopulateItem": null }, args);

                if (!args.PopulateItem) {
                    args.PopulateItem = {};
                }

                args.PopulateItem["Elements"] = $element.find(".EditorBadge.OnState");
                args.PopulateItem["Values"] = [];

                $.each(args.PopulateItem.Elements, function () {
                    var _badgeID = util_forceInt($(this).attr("data-attr-badge-id"), enCE.None);

                    args.PopulateItem.Values.push(_badgeID);
                });

            }); //end: events.getSelectedValues

            $element.off("events.setSelection");
            $element.on("events.setSelection", function (e, args) {

                args = util_extend({ "Values": null }, args);

                var _arrBadgeIDs = (args.Values || []);

                var $badges = $element.find(".EditorBadge[data-attr-badge-id]");

                $badges.removeClass("OnState")
                       .addClass("OffState");

                if (_arrBadgeIDs.length > 0) {
                    var _selector = "";

                    for (var i = 0; i < _arrBadgeIDs.length; i++) {
                        _selector += (i > 0 ? "," : "") + "[" + util_htmlAttribute("data-attr-badge-id", _arrBadgeIDs[i]) + "]";
                    }

                    $badges.filter(_selector)
                           .removeClass("OffState")
                           .addClass("OnState");
                }

                $element.trigger("events.refresh");

            }); //end: events.setSelection

            $element.off("events.tagSelectionState");
            $element.on("events.tagSelectionState", function (e, args) {
                var _tag = {};

                $element.trigger("events.getSelection", { "PopulateItem": _tag });

                $element.data("data-tag-selections", _tag);

            }); //end: events.tagSelectionState

            $element.off("events.toggleEditMode");
            $element.on("events.toggleEditMode", function (e, args) {
                args = util_extend({ "IsEditable": false, "IsRestoreTag": false }, args);

                $element.toggleClass("ElementLinksDisabled", !args.IsEditable);

                if (args.IsEditable) {
                    $element.trigger("events.tagSelectionState");
                }
                
                if (args.IsRestoreTag) {

                    //restore the selections from previous tagged state
                    var _prevTag = $element.data("data-tag-selections");

                    if (_prevTag) {
                        var _isModified = false;
                        var _selections = {};

                        $element.trigger("events.getSelection", { "PopulateItem": _selections });

                        if (_selections.Values.length != _prevTag.Values.length) {
                            _isModified = true;
                        }
                        else {

                            //both arrays have the same number of selections, so check if there is a badge that differs/updated;
                            //assumption that the values will be ordered based on the badge order property in array
                            for (var s = 0; s < _selections.Values.length && !_isModified; s++) {
                                _isModified = (_selections.Values[s] != _prevTag.Values[s]);
                            }
                        }

                        if (_isModified) {
                            $element.trigger("events.setSelection", { "Values": _prevTag.Values });
                        }

                        $element.removeData("data-tag-selections");
                    }
                }
                else if (!args.IsEditable) {
                    $element.removeData("data-tag-selections");
                }

            }); //end: events.toggleEditMode

            $element.off("click.badge");
            $element.on("click.badge", ".LinkClickable.EditorBadge[data-attr-badge-id]", function () {

                if (!$element.hasClass("ElementLinksDisabled")) {

                    var $btn = $(this);
                    var _badgeID = util_forceInt($btn.attr("data-attr-badge-id"), enCE.None);

                    if (_badgeID != enCE.None) {
                        var _stateOn = $btn.hasClass("OffState");

                        if (_stateOn) {
                            $btn.removeClass("OffState")
                                .addClass("OnState");
                        }
                        else {
                            $btn.removeClass("OnState")
                                .addClass("OffState");
                        }

                        $element.trigger("events.refresh");
                    }
                }

            }); //end: click.badge

            $element.html("<div class='LabelLoading'>LOADING...</div>");
            
        }
    });

};  //end: pluginEditor_valueMessageBadge

RENDERER_LOOKUP["pluginEditor_valueMessageFilter"] = function (context, options) {

    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_valueMessageFilter");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.is("is-init")) {

            $element.is("is-init", true);

            $element.addClass("DisableUserSelectable EditorValueMessageFilter")
                    .html("<div class='LabelLoading'>&nbsp;</div>");

            $element.off("events.init");
            $element.on("events.init", function (e, args) {

                args = util_extend({
                    "BadgeList": null, "Heading": "Filter Selections:", "InclusiveToggleTitle": "inclusive?", "Callback": null, "IsDisabled": false
                }, args);

                var _badges = (args.BadgeList || []);
                var _html = "";

                _html += "<div class='Title'>" + util_htmlEncode(args.Heading) + "</div>";

                var _prevLevel = null;

                for (var i = 0; i < _badges.length; i++) {
                    var _badge = _badges[i];
                    var _badgeID = _badge[enColBadgeProperty.BadgeID];
                    var _level = _badge[enColBadgeProperty.Level];

                    if (_prevLevel != null && _prevLevel != _level) {
                        _html += "<div class='EditorBadgeDivider OnState' />";
                    }

                    _html += "<div class='LinkClickable EditorBadge" + (_badge[enColBadgeProperty.IsPlaceholder] ? " PlaceholderState" : "") + 
                             " OnState EditorBadge_" + _badgeID + "' " + util_htmlAttribute("data-attr-badge-id", _badgeID) + " " +
                             util_htmlAttribute("title", _badge[enColBadgeProperty.Name], null, true) + " />";

                    _prevLevel = _level;

                }

                _html += "<div class='CheckboxToggleResults'>" +
                         "  <label class='LinkClickable'>" +
                         "  <input data-filter-item='cbInclusive' type='checkbox' checked='checked' data-mini='true' data-inline='true'>" +
                         util_htmlEncode(args.InclusiveToggleTitle) +
                         "  </label>" +
                         "  <div class='ResultLabel' />" +
                         "</div>";

                $element.html(_html)
                        .trigger("create");

                var $cbInclusive = $element.find("input[data-filter-item='cbInclusive']");

                $cbInclusive.off("change.filter_badge");
                $cbInclusive.on("change.filter_badge", function (e, args) {

                    var $cb = $(this);

                    args = util_extend({ "IsForceUpdate": false, "Checked": null }, args);

                    if (args.IsForceUpdate) {
                        $cb.prop("checked", args.Checked == true)
                           .checkboxradio("refresh");
                    }
                    else if (!$element.hasClass("LinkDisabled")) {
                        $element.trigger("events.refresh");
                    }                    
                    else {
                        $cb.prop("checked", !$cb.prop("checked"));
                    }
                });

                $element.data("cbInclusive", $cbInclusive)
                        .data("CountBadges", _badges.length);
                
                $element.toggleClass("LinkDisabled", args.IsDisabled);

                $element.trigger("events.refresh");

                if (args.Callback) {
                    args.Callback();
                }
            });

            $element.off("events.populateSelection");
            $element.on("events.populateSelection", function (e, args) {

                var _populateItem = null;

                args = util_extend({ "PopulateItem": null, "IsLookupFormat": false }, args);

                if (!args.PopulateItem) {
                    args.PopulateItem = {};
                }

                _populateItem = args.PopulateItem;

                _populateItem["IsInclusive"] = $($element.data("cbInclusive")).prop("checked");

                if (args.IsLookupFormat) {
                    _populateItem["BadgeLookup"] = {};

                    var $btnSelected = $element.find(".EditorBadge.OnState[data-attr-badge-id]");

                    $.each($btnSelected, function () {
                        var _badgeID = util_forceInt($(this).attr("data-attr-badge-id"), enCE.None);

                        _populateItem.BadgeLookup[_badgeID] = true;
                    });
                }
                else {
                    _populateItem["BadgeList"] = [];

                    if (_populateItem.IsInclusive) {
                        var $btnSelected = $element.find(".EditorBadge.OnState[data-attr-badge-id]");

                        $.each($btnSelected, function () {
                            _populateItem.BadgeList.push(util_forceInt($(this).attr("data-attr-badge-id"), enCE.None));
                        });
                    }
                    else {
                        var $btnList = $element.find(".EditorBadge[data-attr-badge-id]");
                        var _found = false;

                        $.each($btnList, function () {
                            var $badge = $(this);
                            var _badgeID = util_forceInt($badge.attr("data-attr-badge-id"), enCE.None);
                            var _selected = $badge.hasClass("OnState");

                            //NOTE: construct item object with properties (compared to inclusive list which only uses ID)
                            _populateItem.BadgeList.push({ "ID": _badgeID, "Selected": _selected, "IsPlaceholder": $badge.hasClass("PlaceholderState") });

                            _found = (_found || _selected);
                        });

                        if (!_found) {

                            //clear the badge list since no selections were made
                            _populateItem.BadgeList = [];
                        }
                    }

                    _populateItem["IsAllFilter"] = (_populateItem.IsInclusive && _populateItem.BadgeList.length == $element.data("CountBadges"));
                }

            });

            $element.off("events.refresh");
            $element.on("events.refresh", function (e, args) {
                var _resultHTML = "";

                args = util_extend({ "IsEnable": null, "IsBlankContent": false }, args);

                if (args.IsEnable) {
                    $element.removeClass("LinkDisabled");
                }

                if ($element.hasClass("LinkDisabled")) {
                    _resultHTML = (args.IsBlankContent ? "&nbsp;" : "<div class='IndicatorSmall' />");
                }
                else {
                    var _selections = {};
                    var _numResults = 0;

                    $element.trigger("events.populateSelection", { "PopulateItem": _selections });

                    var $list = $element.data("GetTargetList").apply(this);

                    if (_selections.IsAllFilter) {
                        _numResults = $list.length;
                        $list.removeClass("EditorElementHidden");
                    }
                    else if (_selections.BadgeList.length == 0) {
                        _numResults = 0;
                        $list.addClass("EditorElementHidden");
                    }
                    else {

                        var _selector = "";
                        var _numRequired = 0;

                        if (_selections.IsInclusive) {

                            for (var b = 0; b < _selections.BadgeList.length; b++) {
                                _selector += (b > 0 ? ", " : "") + ".EditorValueMessageBadgeView .EditorBadge.OnState.EditorBadge_" + _selections.BadgeList[b];
                            }
                        }
                        else {

                            var _first = true;

                            for (var b = 0; b < _selections.BadgeList.length; b++) {
                                var _badgeItem = _selections.BadgeList[b];

                                if (_badgeItem.Selected || _badgeItem.IsPlaceholder) {
                                    _numRequired++;

                                    _selector += (!_first ? ", " : "") + ".EditorValueMessageBadgeView .EditorBadge" +
                                                 (_badgeItem.Selected ? ".OnState" : ".PlaceholderState.OffState") +
                                                 ".EditorBadge_" + _badgeItem.ID;

                                    _first = false;
                                }
                            }
                        }

                        var $matched = $list.filter(function () {
                            var $this = $(this);
                            var _searchLength = $this.find(_selector).length;

                            return (_selections.IsInclusive ? _searchLength > 0 : _searchLength == _numRequired);
                        });

                        $list.addClass("EditorElementHidden");
                        $matched.removeClass("EditorElementHidden");

                        _numResults = $matched.length;
                    }

                    _resultHTML = "<b>" + _numResults + "</b>" + util_htmlEncode(" result" + (_numResults > 1 ? "s" : "")) + " found";
                }

                $element.find(".ResultLabel")
                        .html(_resultHTML);
            });

            $element.off("events.snapshot");
            $element.on("events.snapshot", function (e, args) {

                args = util_extend({ "IsRestore": false }, args);

                $element.toggleClass("LinkDisabled", !args.IsRestore);

                var _state = {};

                if (!args.IsRestore) {
                    var $list = $element.data("GetTargetList").apply(this);

                    $list.removeClass("EditorElementHidden");

                    $element.trigger("events.populateSelection", { "PopulateItem": _state, "IsLookupFormat": true });
                    $element.data("snapshot-state", _state);

                    $element.trigger("events.setSelection", { "IsAllSelected": true, "IsInclusiveChecked": true });
                }
                else {
                    _state = $element.data("snapshot-state");

                    $element.removeData("snapshot-state");
                    $element.trigger("events.setSelection", {
                        "Lookup": (_state ? _state["BadgeLookup"] : null), "IsInclusiveChecked": (_state ? _state["IsInclusive"] : null)
                    });
                }

                $element.trigger("events.refresh", { "IsBlankContent": !args.IsRestore });

            });

            $element.off("events.setSelection");
            $element.on("events.setSelection", function (e, args) {

                args = util_extend({ "IsAllSelected": false, "IsInclusiveChecked": null, "Lookup": null }, args);

                var $list = $element.find(".EditorBadge[data-attr-badge-id]");

                $list.removeClass("OffState OnState");

                if (args.IsAllSelected || !args.Lookup) {
                    $list.addClass("OnState");
                }
                else {
                    $list.filter(function () {
                        var _badgeID = util_forceInt($(this).attr("data-attr-badge-id"));

                        return args.Lookup[_badgeID];

                    }).addClass("OnState");
                }

                if (!util_isNullOrUndefined(args.IsInclusiveChecked)) {
                    $($element.data("cbInclusive")).trigger("change.filter_badge", { "IsForceUpdate": true, "Checked": args.IsInclusiveChecked });
                }
            });

            $element.off("click.filter_badge");
            $element.on("click.filter_badge", ".LinkClickable.EditorBadge[data-attr-badge-id]", function (e, args) {

                if (!$element.hasClass("LinkDisabled")) {
                    var $btn = $(this);
                    var _isOn = !$btn.hasClass("OnState");

                    $btn.toggleClass("OnState", _isOn)
                        .toggleClass("OffState", !_isOn);

                    $element.trigger("events.refresh");
                }
            });

        }
    });

};  //end: pluginEditor_valueMessageFilter

//SECTION START: project specific support

CValueMessageController.prototype.ProjectOnGetFilters = function (options) {

    if (options.Callback) {
        options.Callback(null);
    }
};

CValueMessageController.prototype.ProjectOnRenderClaimField = function (options) {

    options = util_extend({ "Callback": null }, options);

    if (options.Callback) {
        options.Callback();
    }
};

CValueMessageController.prototype.ProjectOnPopulateClaimField = function (options) {
};

//SECTION END: project specific support