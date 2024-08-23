var CEvidenceRoadmapController = function () {
    var _instance = this;

    _instance["DOM"] = {
        "Element": null
    };

    var _utils = pluginEditor_getUtils();

    _instance["Utils"] = util_extend({
        "ContextEditorGroupID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-attr-home-editor-group-id"), enCE.None);
        }
    }, _utils);

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
    }

    var $vw = $element.find("[" + util_renderAttribute("pluginEditor_evidenceRoadmap") + "]");

    var _fnBindTimeline = function () {

        $vw.trigger("events.bind", { "Controller": _controller, "Callback": _callback, "LayoutManager": options["LayoutManager"] });
    };

    if ($vw.length == 0) {
        $element.html("<div id='divRoadmapTimeline' " + util_renderAttribute("pluginEditor_evidenceRoadmap") + " />");
        $mobileUtil.refresh($element);

        $vw = $element.find("[" + util_renderAttribute("pluginEditor_evidenceRoadmap") + "]");

        $vw.data("OnItemClick", function (opts) {

            var $study = $(opts.Element);
            var _studyID = util_forceInt(opts.StudyID, enCE.None);
            var _isEdit = util_forceBool(opts["IsEditMode"], false);

            if (_isEdit) {
                var $clEdit = $element.find("#clEditStudy");

                if ($clEdit.length == 0) {
                    var _btnHTML = _controller.Utils.HTML.GetButton({
                        "Content": "Edit", "ActionButtonID": "edit_study",
                        "Attributes": {
                            "id": "clEditStudy",
                            "data-icon": "edit", "data-attr-require-layout-manager": enCETriState.Yes
                        }
                    });

                    $clEdit = $(_btnHTML);
                    $clEdit.hide();
                    $element.append($clEdit);
                }

                $clEdit.attr("data-attr-study-id", _studyID)
                       .trigger("click");
            }
            else {
                $vw.trigger("events.roadmap_detailView", { "Trigger": $study, "StudyID": _studyID, "Controller": _controller });
            }

        });

        var _arrFilters = [{ "Type": "platform" }];

        _controller.ProjectOnGetFilters({
            "Callback": function (arr) {
                arr = (arr || []);

                _arrFilters = $.merge(_arrFilters, arr);

                options.LayoutManager.FilterSetView({
                    "List": _arrFilters, "Callback": function () {
                        _fnBindTimeline();
                    }
                });
            }
        });        
    }
    else {
        _fnBindTimeline();
    }
};

CEvidenceRoadmapController.prototype.ToggleEditMode = function (options) {
    options = util_extend({ "Controller": null, "PluginInstance": null, "IsEdit": false, "Callback": null, "LayoutManager": null, "FilteredList": null, "Trigger": null }, options);

    var _handled = false;
    var _controller = options.Controller;
    var _pluginInstance = (options.PluginInstance ? options.PluginInstance : _controller.PluginInstance);
    var $container = $(_controller.DOM.Element);

    if (options.IsEdit) {
        if (options.LayoutManager) {
            options.LayoutManager.ToolbarSetButtons({
                "IsInsertStart": true,
                "List": _controller.Utils.HTML.GetButton({ "ActionButtonID": "add_study", "Content": "Add Study", "Attributes": { "data-icon": "plus" } })
            });
        }
    }
    else {
        if (options.LayoutManager) {
            options.LayoutManager.ToolbarSetButtons({
                "IsClear": true
            });
        }
    }

    $container.find("[" + util_renderAttribute("pluginEditor_evidenceRoadmap") + "]")
              .trigger("events.toggleEditMode", { "IsEnabled": options.IsEdit });

    if (!_handled && options.Callback) {
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

    if (!_handled) {

        switch (options.ButtonID) {

            case "add_study":
            case "edit_study":

                _controller.GetPropertyList({
                    "Callback": function (propList) {

                        var _fnAppendProp = function (prop, isEnum) {

                            var _inputHTML = null;
                            var _label = "";
                            var _isRequired = false;
                            var _editorDataType = null;
                            var _attrs = util_htmlAttribute("data-attr-prop", enCETriState.Yes);

                            if (isEnum) {
                                _label = prop["n"];
                                _editorDataType = prop["t"];
                                _isRequired = (prop["req"] === true);

                                _attrs += " " + util_htmlAttribute("data-attr-prop-enum", prop["p"]);
                            }
                            else {
                                _label = prop[enColStudyFieldProperty.Name];
                                _editorDataType = prop[enColStudyFieldProperty.EditorDataTypeID];
                                _isRequired = prop[enColStudyFieldProperty.IsRequired];

                                _attrs += " " + util_htmlAttribute("data-attr-study-field-id", prop[enColStudyFieldProperty.FieldID]);
                            }

                            if (_inputHTML == null) {

                                _inputHTML = "";

                                var _attrInput = util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + " " +
                                                 util_htmlAttribute("data-attr-input-data-type", _editorDataType);

                                switch (_editorDataType) {

                                    case enCEEditorDataType.Text:
                                        _inputHTML = "<input type='text' data-corners='false' data-mini='true' " + _attrInput + " />";
                                        break;

                                    case enCEEditorDataType.FreeText:
                                        _inputHTML = "<textarea data-corners='false' data-mini='true' " + _attrInput + " />";
                                        break;

                                    case enCEEditorDataType.Date:
                                        _inputHTML = "<div " + util_renderAttribute("pluginEditor_dropdownDatePicker") + " " + _attrInput + " />";
                                        break;

                                    default:
                                        _inputHTML = "&nbsp;";
                                        break;
                                }
                            }

                            _attrs += " " + util_htmlAttribute("data-attr-validation-is-required", _isRequired ? enCETriState.Yes : enCETriState.No) +
                                      " " + util_htmlAttribute("data-attr-validation-prop-name", _label, null, true);

                            _html += "<div class='TableBlockRow TableBlockTwoColumn' " + _attrs + ">" +
                                     "  <div class='TableBlockCell ColumnHeading'>" +
                                     (_isRequired ? "<span class='RequiredNote'>*</span>" : "") + util_htmlEncode(_label + ":") +
                                     "  </div>" +
                                     "  <div class='TableBlockCell ColumnContent'>" + util_forceString(_inputHTML) + "</div>" +
                                     "</div>";

                        };

                        _html += "<div class='EditorTransparentInlineConfirmation EditorAdminEditTable EditorStudyAdminEditTable'>" +
                                 "  <div style='text-align: right; padding-right: 1em; margin-bottom: 1em;'>" +
                                 "      <span class='RequiredNote'>*</span>" + util_htmlEncode(" required field") +
                                 "  </div>";

                        propList = (propList || []);

                        var _arrStandardProp = _controller.GetStandardPropertyList();

                        for (var p = 0; p < _arrStandardProp.length; p++) {
                            _fnAppendProp(_arrStandardProp[p], true);
                        }

                        for (var p = 0; p < propList.length; p++) {
                            _fnAppendProp(propList[p]);
                        }

                        _html += "<div class='TableBlockRow TableBlockFullColumn'>" +
                                 "  <div class='TableBlockCell'>" +
                                 "      <div class='Label'>" + util_htmlEncode("Associate Evidence with the following Platform(s):") + "</div>" +
                                 "      <div style='display: inline-block;' " + util_htmlAttribute("data-attr-item-prop", enColCEStudyProperty.StudyPlatforms) + " />" +
                                 "  </div>" +
                                 "</div>";

                        _html += "</div>";

                        var _studyID = enCE.None;
                        var _isEdit = (options.ButtonID == "edit_study");

                        if (_isEdit) {
                            _studyID = util_forceInt($mobileUtil.GetClosestAttributeValue($btn, "data-attr-study-id"), enCE.None);
                        }

                        _controller.Utils.Actions.ToggleEditView({
                            "Controller": _controller, "Trigger": $btn, "IsEnabled": true, "Title": (!_isEdit ? "Add" : "Edit") + " Study",
                            "SaveButtonID": "save_study",
                            "CustomToolbarButtonHTML": (_isEdit ? _controller.Utils.HTML.GetButton({
                                "Content": "Delete Study", "ActionButtonID": "delete_study", "Attributes": { "data-icon": "delete" }
                            }) : ""),
                            "ContentHTML": _html,
                            "Callback": function (popupOpts) {

                                var $container = $(popupOpts.Container);
                                var $tbl = $container.find(".EditorStudyAdminEditTable");
                                var PROJECT_POPULATE_EVENT_NAME = "events.project_populateItem";

                                $btn.trigger("events.toggleOverlay", { "IsEnabled": true, "Message": "Loading..." });

                                $tbl.off("blur.study_input");
                                $tbl.on("blur.study_input", "input[data-attr-input-element], textarea[data-attr-input-element]", function () {
                                    var $this = $(this);

                                    $this.val(util_trim($this.val()));
                                });

                                var _fnBindPlatformToggles = function (studyPlatformList, onCallback) {

                                    var _platforms = null;

                                    var _onCallback = function () {

                                        var $vwStudyPlatforms = $tbl.find("[" + util_htmlAttribute("data-attr-item-prop", enColCEStudyProperty.StudyPlatforms) + "]");

                                        var _platformHTML = _controller.Utils.HTML.PlatformFlipSwitchToggles({
                                            "Controller": _controller, "Platforms": _platforms, "BridgeList": studyPlatformList,
                                            "PropertyBridgePlatformID": enColStudyPlatformProperty.PlatformID
                                        });

                                        $vwStudyPlatforms.html(_platformHTML);
                                        $mobileUtil.refresh($vwStudyPlatforms);

                                        _controller.Utils.BindFlipSwitchEvents({ "Element": $vwStudyPlatforms });

                                        $vwStudyPlatforms.off("events.populate");
                                        $vwStudyPlatforms.on("events.populate", function (e, args) {

                                            e.stopPropagation();

                                            var _item = args["Item"];

                                            if (!_item) {
                                                _item = {};
                                                args["Item"] = _item;
                                            }

                                            _item[enColCEStudyProperty.StudyPlatforms] = _controller.Utils.Actions.PopulatePlatformToggleSelections({
                                                "Element": $vwStudyPlatforms,
                                                "BridgeEntityInstance": CEStudyPlatform,
                                                "PropertyBridgePlatformID": enColStudyPlatformProperty.PlatformID,
                                                "SourceBridgePlatformList": (args["SourceList"] || [])
                                            });

                                            return true;

                                        }); //end: events.populate

                                        if (onCallback) {
                                            onCallback();
                                        }
                                    };

                                    var _editorGroupID = util_forceInt($mobileUtil.GetClosestAttributeValue($container, "data-attr-home-editor-group-id"), enCE.None);

                                    _platforms = $(_controller.DOM.Element).data("cache-platforms_" + _editorGroupID);

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

                                            $(_controller.DOM.Element).data("cache-platforms_" + _editorGroupID, _platforms);

                                            _onCallback();
                                        });
                                    }

                                };  //end: _fnBindPlatformToggles

                                $tbl.off("events.bind");
                                $tbl.on("events.bind", function (e, args) {

                                    args = util_extend({ "Callback": null }, args);

                                    var _bindCallback = function () {

                                        if (args.Callback) {
                                            args.Callback();
                                        }
                                    };

                                    var _study = ($tbl.data("DataItem") || {});
                                    var $inputList = $tbl.find("[" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");

                                    var _studyFieldValues = (_study[enColCEStudyProperty.StudyFieldValues] || []);
                                    var _lookupFieldValue = {};

                                    for (var f = 0; f < _studyFieldValues.length; f++) {
                                        var _studyFieldValue = _studyFieldValues[f];
                                        var _fieldID = _studyFieldValue[enColStudyFieldValueProperty.FieldID];

                                        _lookupFieldValue[_fieldID] = _studyFieldValue;
                                    }

                                    $tbl.data("LookupSourceStudyFieldValues", _lookupFieldValue)
                                        .data("SourceList_" + enColCEStudyProperty.StudyPlatforms, _study[enColCEStudyProperty.StudyPlatforms] || []);

                                    $.each($inputList, function () {

                                        var $input = $(this);
                                        var _dataType = util_forceInt($input.attr("data-attr-input-data-type"), enCE.None);
                                        var $prop = $input.closest("[data-attr-prop]");
                                        var _val = null;
                                        var _extBindOpts = {};

                                        if ($prop.is("[data-attr-prop-enum]")) {
                                            var _propName = $prop.attr("data-attr-prop-enum");

                                            _val = _study[_propName];

                                            if (_propName == enColStudyProperty.StartDate ||
                                                _propName == enColStudyProperty.EndDate) {

                                                var _isFullDate = true;

                                                switch (_propName) {

                                                    case enColStudyProperty.StartDate:
                                                        _isFullDate = _study[enColStudyProperty.IsFullStartDate];
                                                        break;

                                                    case enColStudyProperty.EndDate:
                                                        _isFullDate = _study[enColStudyProperty.IsFullEndDate];
                                                        break;
                                                }

                                                _extBindOpts["IsFullDate"] = _isFullDate;
                                            }
                                        }
                                        else {
                                            var _fieldID = util_forceInt($prop.attr("data-attr-study-field-id"), enCE.None);
                                            var _studyFieldValue = _lookupFieldValue[_fieldID];

                                            if (_studyFieldValue) {
                                                _val = _studyFieldValue[enColStudyFieldValueProperty.Value];
                                            }
                                        }

                                        switch (_dataType) {

                                            case enCEEditorDataType.Text:
                                            case enCEEditorDataType.FreeText:

                                                _val = util_forceString(_val);
                                                $input.val(_val);
                                                break;

                                            case enCEEditorDataType.Date:

                                                $input.trigger("events.setValue", { "Value": _val, "IsFullDate": util_forceBool(_extBindOpts["IsFullDate"], true) });
                                                break;

                                            default:
                                                util_logError("events.bind :: not handled data type of " + _dataType);
                                                break;
                                        }

                                    });

                                    _fnBindPlatformToggles(_study[enColCEStudyProperty.StudyPlatforms], function () {
                                        _bindCallback();
                                    });

                                }); //end: events.bind

                                $tbl.off("events.populateItem");
                                $tbl.on("events.populateItem", function (e, args) {

                                    args = util_extend({ "Item": null, "Callback": null }, args);

                                    var $inputs = $tbl.find("[" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");
                                    var _item = args.Item;

                                    if (!_item) {
                                        _item = {};
                                        args.Item = _item;
                                    }

                                    var _lookupStudyFieldValue = ($tbl.data("LookupSourceStudyFieldValues") || {});

                                    var _arrStudyFieldValue = [];

                                    $.each($inputs, function (index) {
                                        var $input = $(this);
                                        var $prop = $($input.closest("[data-attr-prop]"));
                                        var _isRequired = (util_forceInt($prop.attr("data-attr-validation-is-required"), enCETriState.None) == enCETriState.Yes);
                                        var _val = null;
                                        var _dataType = util_forceInt($input.attr("data-attr-input-data-type"), enCE.None);
                                        var _isEnum = $prop.is("[data-attr-prop-enum]");

                                        switch (_dataType) {

                                            case enCEEditorDataType.Date:
                                                var _dt = {};

                                                $input.trigger("events.getValue", _dt);

                                                if (_isEnum) {
                                                    _val = _dt.Value;
                                                }
                                                else {
                                                    _val = _dt.Value.ToString();
                                                }
                                                
                                                break;

                                            default:
                                                _val = util_trim($input.val());
                                                $input.val(_val);
                                                break;
                                        }

                                        if (_isEnum) {
                                            var _propName = $prop.attr("data-attr-prop-enum");

                                            if ((_propName == enColStudyProperty.StartDate || _propName == enColStudyProperty.EndDate)) {
                                                var _propIsFullDate = null;

                                                if (_propName == enColStudyProperty.StartDate) {
                                                    _propIsFullDate = enColStudyProperty.IsFullStartDate;
                                                }
                                                else if (_propName == enColStudyProperty.EndDate) {
                                                    _propIsFullDate = enColStudyProperty.IsFullEndDate;
                                                }

                                                if (_propIsFullDate) {
                                                    _item[_propIsFullDate] = _val.IsFullDate();
                                                }

                                                _val = _val.ToDate();
                                            }
                                            else if (_dataType == enCEEditorDataType.Date && _val) {
                                                _val = _val.ToDate();
                                            }

                                            _item[_propName] = _val;
                                        }
                                        else {
                                            var _studyFieldID = util_forceInt($prop.attr("data-attr-study-field-id"), enCE.None);
                                            var _studyFieldValue = _lookupStudyFieldValue[_studyFieldID];

                                            if (!_studyFieldValue) {
                                                _studyFieldValue = new CEStudyFieldValue();
                                            }

                                            _studyFieldValue[enColStudyFieldValueProperty.FieldID] = _studyFieldID;
                                            _studyFieldValue[enColStudyFieldValueProperty.Value] = _val;

                                            _arrStudyFieldValue.push(_studyFieldValue);
                                        }

                                        if (_isRequired && (_val == null || util_forceString(_val) == "")) {
                                            var _displayName = util_forceString($prop.attr("data-attr-validation-prop-name"));

                                            if (_displayName == "") {
                                                _displayName = "Field #" + (index + 1);
                                            }

                                            AddUserError(_displayName + " is required.");
                                        }

                                    });

                                    _item[enColCEStudyProperty.StudyFieldValues] = _arrStudyFieldValue;

                                    if (_item[enColStudyProperty.StartDate] && _item[enColStudyProperty.EndDate]) {

                                        //verify that the start and end date are in valid range
                                        var _dt1 = _item[enColStudyProperty.StartDate];
                                        var _dt2 = _item[enColStudyProperty.EndDate];

                                        if (_dt1.getTime() > _dt2.getTime()) {
                                            AddUserError("Start date must be less than or equal to the end date.");
                                        }
                                    }

                                    var $itemExtPropList = $tbl.find("[data-attr-item-prop]");

                                    $.each($itemExtPropList, function () {
                                        var $this = $(this);
                                        var _propName = $this.attr("data-attr-item-prop");

                                        $this.trigger("events.populate", { "Item": _item, "SourceList": $tbl.data("SourceList_" + _propName) });
                                    });

                                    if (_item[enColCEStudyProperty.StudyPlatforms].length == 0) {
                                        AddUserError("At least one platform is required for the Study.");
                                    }

                                    $tbl.trigger(PROJECT_POPULATE_EVENT_NAME, { "Item": _item, "Callback": args.Callback });
                                    
                                }); //end: events.populateItem

                                $tbl.off("events.save");
                                $tbl.on("events.save", function (e, args) {

                                    e.stopPropagation();    //must prevent any parent event handlers of this namespace from executing

                                    args = util_extend({ "Callback": null }, args);

                                    ClearMessages();

                                    var _study = $tbl.data("DataItem");

                                    $tbl.trigger("events.populateItem", {
                                        "Item": _study, "Callback": function () {

                                            if (MessageCount() == 0) {

                                                _controller.Utils.Actions.SaveEntity({
                                                    "Controller": _controller, "LayoutManager": options.LayoutManager, "Trigger": $tbl,
                                                    "IsAppService": true,                                                    
                                                    "Params": {
                                                        "c": "PluginEditor", "m": "StudySave",
                                                        "args": {
                                                            "_EditorGroupID": _controller.Utils.ContextEditorGroupID($tbl),
                                                            "Item": util_stringify(_study), "DeepSave": true
                                                        }
                                                    },
                                                    "OnSuccess": function (saveItem) {

                                                        if (args.Callback) {
                                                            args.Callback(saveItem);
                                                        }
                                                    }
                                                });

                                            }
                                        }
                                    });

                                    return false;   //must prevent any parent event handlers of this namespace from executing

                                }); //end: events.save

                                APP.Service.Action({
                                    "c": "PluginEditor", "m": "StudyGetByPrimaryKey",
                                    "args": {
                                        "_EditorGroupID": _controller.Utils.ContextEditorGroupID($btn),
                                        "StudyID": _studyID, "DeepLoad": true
                                    }
                                }, function (studyData) {

                                    var _study = (studyData || {});
                                    var _isAddNew = (_studyID == enCE.None);

                                    if (!_isAddNew && util_forceInt(_study[enColStudyProperty.StudyID], enCE.None) == enCE.None) {

                                        //item no longer available or is invalid
                                        $tbl.addClass("EffectBlur")
                                            .toggle("height", function () {
                                                $container.html("<div class='LabelError'>" +
                                                                util_htmlEncode("Study is no longer available or invalid. Please return to selection view and try again.") +
                                                                "</div>");
                                            });

                                        $tbl = null;
                                    }
                                    else if (_isAddNew) {
                                        var _studyPlatforms = (_study[enColCEStudyProperty.StudyPlatforms] || []);
                                        var _currentPlatformID = util_forceInt($mobileUtil.GetClosestAttributeValue($tbl, "data-home-editor-group-platform-id"), enCE.None);
                                        var _search = util_arrFilter(_studyPlatforms, enColStudyPlatformProperty.PlatformID, _currentPlatformID, true);

                                        if (_search.length == 0) {
                                            var _studyPlatform = new CEStudyPlatform();

                                            _studyPlatform[enColStudyPlatformProperty.PlatformID] = _currentPlatformID;

                                            _studyPlatforms.push(_studyPlatform);

                                            _study[enColCEStudyProperty.StudyPlatforms] = _studyPlatforms;
                                        }
                                    }

                                    if ($tbl) {
                                        $tbl.data("DataItem", _study);

                                        $tbl.trigger("events.bind", {
                                            "Callback": function () {

                                                $btn.trigger("events.toggleOverlay", { "IsEnabled": false });

                                                if (_isAddNew) {
                                                    $tbl.find("[" + util_htmlAttribute("data-attr-prop", enCETriState.Yes) + "]:first [" +
                                                              util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]")
                                                        .trigger("focus");
                                                }

                                                $tbl.off(PROJECT_POPULATE_EVENT_NAME);
                                                $tbl.on(PROJECT_POPULATE_EVENT_NAME, function (e, args) {

                                                    args = util_extend({ "Item": null, "Callback": null }, args);

                                                    //placeholder for project specific implementation
                                                    if (args.Callback) {
                                                        args.Callback();
                                                    }
                                                });

                                                _controller.ProjectOnRenderStudyEditView({
                                                    "Parent": $container, "Element": $tbl, "EditItem": _study, "EditID": _studyID,
                                                    "EventNameOnPopulate": PROJECT_POPULATE_EVENT_NAME,
                                                    "Callback": function () {

                                                    }
                                                });
                                            }
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
                    }
                });
                
                break;  //end: add_study

            case "save_study":
            case "delete_study":

                var $tbl = $(options.Parent).find(".EditorStudyAdminEditTable");

                if (options.ButtonID == "save_study") {

                    $tbl.trigger("events.save", {
                        "Callback": function (saveItem) {

                            AddMessage("Study has been successfully saved.");

                            setTimeout(function () {

                                //dismiss the popup
                                _controller.Utils.Actions.ToggleEditView({ "Controller": _controller, "Trigger": $btn, "IsEnabled": false });

                            }, 1000);
                        }
                    });
                }
                else if (options.ButtonID == "delete_study") {

                    dialog_confirmYesNo("Delete Study", "Are you sure you want to permanently delete the study?", function () {

                        _controller.Utils.Actions.SaveEntity({
                            "Controller": _controller, "LayoutManager": options.LayoutManager, "Trigger": $tbl,
                            "IsAppService": true,                            
                            "Params": {
                                "c": "PluginEditor",
                                "m": "StudyDelete",
                                "args": {
                                    "_EditorGroupID": _controller.Utils.ContextEditorGroupID($tbl),
                                    "Item": util_stringify($tbl.data("DataItem"))
                                }
                            },
                            "OnSuccess": function (isDeleted) {

                                if (isDeleted) {
                                    AddMessage("Study has been successfully deleted.");
                                }

                                setTimeout(function () {

                                    //dismiss the popup
                                    _controller.Utils.Actions.ToggleEditView({ "Controller": _controller, "Trigger": $btn, "IsEnabled": false });

                                }, 1000);
                                
                            }
                        });
                    });
                }

                break;  //end: save, delete study
        }
    }
};

CEvidenceRoadmapController.prototype.GetStandardPropertyList = function () {

    var _ret = [
        { "p": enColStudyProperty.Name, "n": "Full study name", "req": true, "t": enCEEditorDataType.Text },
        { "p": enColStudyProperty.Source, "n": "Author", "req": false, "t": enCEEditorDataType.Text },
        { "p": enColStudyProperty.StartDate, "n": "Start Date", "req": true, "t": enCEEditorDataType.Date },
        { "p": enColStudyProperty.EndDate, "n": "End Date", "req": true, "t": enCEEditorDataType.Date }
    ];

    return _ret;
};

CEvidenceRoadmapController.prototype.GetPropertyList = function (options) {

    options = util_extend({ "IsCached": true, "Callback": null }, options);

    var _list = null;
    var $element = $(this.DOM.Element);

    var _callback = function () {
        if (options.Callback) {
            options.Callback(_list);
        }
    };

    if (options.IsCached) {
        _list = $element.data("data-prop-list");
    }

    if (!_list) {
        GlobalService.StudyFieldGetByForeignKey({ "IsCached": util_forceBool(options.IsCached, true) }, function (studyFieldData) {

            _list = (studyFieldData ? studyFieldData.List : null);
            _list = (_list || []);

            $element.data("data-prop-list", _list);

            _callback();
        });
    }
    else {
        _callback();
    }

};  //end:GetPropertyList

RENDERER_LOOKUP["pluginEditor_evidenceRoadmap"] = function (context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_evidenceRoadmap");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.is("is-init")) {

            $element.is("is-init", true);

            var _html = "";

            _html += "<div class='Title'>" + util_htmlEncode("In Progress") + "</div>" +
                     "<div class='EditorScrollableContainer'>" +
                     "  <div class='EditorScrollableContent'>" +
                     "      <div class='Placeholder' />" +
                     "  </div>" +
                     "  <div class='Divider' />" +
                     "</div>";

            $element.addClass("DisableUserSelectable EditorEvidenceRoadmapTimeline");

            $element.html(_html)
                    .trigger("create");

            var $vwPlaceholder = $element.find(".EditorScrollableContent > .Placeholder");

            var _fnGetList = function (controller, filterParams, dataCallback) {

                $element.trigger("events.getComponentUserPermission", {
                    "Callback": function (permSummary) {

                        $element.trigger("events.getLayoutManager", {
                            "Callback": function (layoutManager) {

                                filterParams = util_extend({}, filterParams);

                                var _filterSelections = layoutManager.FilterSelections();
                                var _platformID = _filterSelections.GetFilterID("platform");

                                filterParams["FilterPlatformID"] = _platformID;

                                if (controller && controller["Utils"] && controller.Utils["ContextEditorGroupID"]) {
                                    filterParams["_EditorGroupID"] = controller.Utils.ContextEditorGroupID($element);
                                }
                                else {
                                    util_logError("pluginEditor_evidenceRoadmap :: list filter missing required parameter - _EditorGroupID");
                                }

                                if (controller && controller["ProjectOnGetStudyList"]) {
                                    controller.ProjectOnGetStudyList({
                                        "FilterSelections": _filterSelections, "Params": filterParams, "Callback": dataCallback,
                                        "Permission": (permSummary ? permSummary["Permission"] : null)
                                    });
                                }
                                else {
                                    APP.Service.Action({ "c": "PluginEditor", "m": "StudyGetByForeignKey", "args": filterParams }, dataCallback);
                                }
                            }
                        });

                    }
                }); //end: component user permission summary

            };  //end: _fnGetList

            $element.off("events.bind");
            $element.on("events.bind", function (e, args) {

                args = util_extend({ "Controller": null, "Callback": null, "LayoutManager": null }, args);

                var _controller = args.Controller;

                var _callback = function () {

                    var $repeater = $($element.data("ElementAdminList"));

                    if ($repeater.length == 0) {

                        var COLUMN_RENDER_INDEX_LOOKUP = null;
                        var _columns = null;

                        var _repeaterOpts = {
                            "SortEnum": "enColStudy",
                            "DefaultSortEnum": "enColStudy.Name",
                            "ColumnLookup": {
                                "Name": 0,
                                "Source": 1,
                                "Tools": 2
                            },
                            "Columns": [
                                { "Content": "Study Name", "SortEnum": "enColStudy.Name" },
                                { "Content": "Author", "SortEnum": "enColStudy.Source" },
                                { "Content": "", "IsNoLink": true }
                            ]
                        };

                        if (_controller["ProjectOnConfigureTimelineTable"]) {
                            _controller.ProjectOnConfigureTimelineTable(_repeaterOpts);
                        }

                        COLUMN_RENDER_INDEX_LOOKUP = _repeaterOpts.ColumnLookup;
                        _columns = _repeaterOpts.Columns;

                        $repeater = _controller.Utils.Repeater({
                            "SortEnum": _repeaterOpts.SortEnum,
                            "DefaultSortEnum": _repeaterOpts.DefaultSortEnum,
                            "SortOrderGroupKey": "roadmap_timeline_table",
                            "Columns": _columns,
                            "RepeaterFunctions": {
                                "ContentRowAttribute": function (item) {
                                    return util_htmlAttribute("data-attr-study-id", item[enColStudyProperty.StudyID]);
                                },
                                "FieldValue": function (opts) {
                                    var _val = "";
                                    var _study = opts.Item;
                                    var _isEncode = true;

                                    if (opts.IsContent) {

                                        switch (opts.Index) {

                                            case COLUMN_RENDER_INDEX_LOOKUP["Name"]:
                                                _val = _study[enColStudyProperty.Name];
                                                break;

                                            case COLUMN_RENDER_INDEX_LOOKUP["Source"]:
                                                _val = _study[enColStudyProperty.Source];
                                                break;

                                            case COLUMN_RENDER_INDEX_LOOKUP["Tools"]:
                                                _isEncode = false;
                                                _val = _controller.Utils.HTML.GetButton({
                                                    "CssClass": "EditorStudyCompletedDetail",
                                                    "Content": "View Details", "Attributes": { "data-icon": "arrow-r", "data-iconpos": "right" }
                                                });
                                                break;

                                            default:

                                                if (_controller["ProjectOnRenderStudyRepeaterField"]) {
                                                    opts["Value"] = "";
                                                    opts["IsEncode"] = _isEncode;

                                                    _controller.ProjectOnRenderStudyRepeaterField(opts);

                                                    _val = opts.Value;
                                                    _isEncode = opts.IsEncode;
                                                }

                                                break;

                                        }
                                    }
                                    else if (opts.Index == COLUMN_RENDER_INDEX_LOOKUP.Tools) {
                                        _val = "style='width: 9em;'";
                                        _isEncode = false;
                                    }

                                    _val = (_isEncode ? util_htmlEncode(_val) : util_forceString(_val));

                                    return _val;
                                },
                                "GetData": function (element, sortSetting, callback) {

                                    var _callback = function (data) {

                                        m_list = (data ? data.List : null);
                                        m_list = (m_list || []);

                                        if (callback) {
                                            callback(data);
                                        }
                                    };

                                    var _params = {
                                        "IsCompleted": enCETriState.Yes,
                                        "SortColumn": sortSetting.SortColumn,
                                        "SortAscending": sortSetting.SortASC,
                                        "PageSize": PAGE_SIZE,
                                        "PageNum": util_forceValidPageNum(sortSetting.PageNo, 1)
                                    };

                                    _fnGetList(_controller, _params, _callback);
                                }
                            }
                        });
                        
                        var $temp = $("<div class='EditorEvidenceRoadmapTable'>" +
                                      " <div class='Title'>" + util_htmlEncode("Completed") + "</div>" +
                                      "</div>");

                        $temp.append($repeater);
                        $temp.insertAfter($element);

                        $element.data("ElementAdminList", $repeater);

                        $repeater.off("click.tools_study");
                        $repeater.on("click.tools_study", "[data-attr-study-id] .LinkClickable.EditorStudyCompletedDetail", function () {
                            $element.trigger("events.roadmap_loadStudy", { "Trigger": this });
                        });

                        $mobileUtil.refresh($repeater);
                        $repeater.trigger("events.refresh_list");
                    }
                    else {
                        $repeater.trigger("events.refresh_list");
                    }

                    if (args.LayoutManager) {
                        args.LayoutManager.ToggleOverlay({ "IsEnabled": false });
                    }

                    if (args.Callback) {
                        args.Callback();
                    }
                };

                var _studyList = null;

                var _fnAppendStudy = function (index, isTop, offsetLeftFactor) {

                    if (index == 0) {
                        isTop = true;
                        offsetLeftFactor = 0;
                    }

                    if (index >= _studyList.length) {
                        _callback();
                    }
                    else {

                        var _content = { "Top": "", "Bottom": "" };
                        var _fnGetItemHTML = function (study, isPlaceholder) {
                            var _retHTML = "";

                            _retHTML += "<div class='EditorStudyTimelineDetail" + (isPlaceholder ? " EditorStudyTimelinePlaceholder" : " LinkClickable") + "' " +
                                        util_htmlAttribute("style", "left: " + (offsetLeftFactor * 10) + "em;") +
                                        (!isPlaceholder ?
                                         " " + util_htmlAttribute("data-attr-study-id", study[enColStudyProperty.StudyID]) + " " +
                                         util_htmlAttribute("title", study[enColStudyProperty.Name], null, true) :
                                         ""
                                        ) +
                                        ">";

                            if (!isPlaceholder) {
                                var _startDate = study[enColStudyProperty.StartDate];
                                var _studyName = null;

                                if (_controller["ProjectOnRenderGetStudyLabel"]) {
                                    _studyName = _controller.ProjectOnRenderGetStudyLabel({ "Item": study, "From": "timeline" });
                                }
                                else {
                                    _studyName = study[enColStudyProperty.Name];
                                }

                                _retHTML += "<div class='Label'>";

                                _retHTML += "<div class='LabelName'>" +
                                            util_htmlEncode(_studyName) +
                                            "</div>";

                                if (_startDate) {
                                    _startDate = util_JS_convertToDate(_startDate);

                                    _retHTML += "<div class='LabelDate'>";

                                    try {
                                        _retHTML += util_htmlEncode(Date.format(_startDate, "MMM yyyy"));
                                    } catch (e) {
                                        _retHTML += util_htmlEncode("ERR");
                                    }

                                    _retHTML += "</div>";
                                }

                                _retHTML += "</div>" +
                                            "<div class='EditorCallout' />";
                            }

                            _retHTML += "</div>";

                            return _retHTML;
                        };

                        for (var i = 0; i < 5 && (index < _studyList.length) ; i++) {
                            var _study = _studyList[index];
                            var _itemHTML = _fnGetItemHTML(_study, false);
                            var _placeholderHTML = _fnGetItemHTML(null, true);

                            if (isTop) {
                                _content.Top += _itemHTML;
                                _content.Bottom += _placeholderHTML;
                            }
                            else {
                                _content.Bottom += _itemHTML;
                                _content.Top += _placeholderHTML;
                            }

                            index++;
                            isTop = !isTop;
                            offsetLeftFactor++;
                        }

                        $(_content.Top).addClass("EditorStudyTimelineDetailPositionTop")
                                       .insertBefore($vwPlaceholder);
                        $(_content.Bottom).addClass("EditorStudyTimelineDetailPositionBottom")
                                          .insertAfter($vwPlaceholder);

                        setTimeout(function () {
                            _fnAppendStudy(index, isTop, offsetLeftFactor);
                        }, 50);
                    }

                };  //end: _fnAppendStudy

                if (args.LayoutManager) {
                    args.LayoutManager.ToggleOverlay({ "IsEnabled": true, "Message": "Loading..." });
                }

                _fnGetList(_controller, { "IsCompleted": enCETriState.No, "SortColumn": enColStudy.StartDate, "SortAscending": false }, function (studyData) {

                    _studyList = (studyData ? studyData.List : null);
                    _studyList = (_studyList || []);

                    $element.find(".EditorStudyTimelineDetail")
                            .remove();

                    _fnAppendStudy(0);
                });

            });
         
            $element.off("events.toggleEditMode");
            $element.on("events.toggleEditMode", function (e, args) {

                args = util_extend({ "IsEnabled": false }, args);

                var $repeater = $($element.data("ElementAdminList"));

                $element.toggleClass("EditorEvidenceRoadmapTimelineEditMode", args.IsEnabled);

                $repeater.children(".EditorDataAdminListTable")
                         .toggleClass("EditorDataAdminListEditMode", args.IsEnabled);

            }); //end: events.toggleEditMode

            $element.off("events.roadmap_detailView");
            $element.on("events.roadmap_detailView", function (e, args) {

                args = util_extend({ "LayoutManager": null, "Controller": null, "Trigger": null, "StudyID": enCE.None, "Callback": null }, args);

                var $trigger = $(args.Trigger);

                var _isCompleted = $trigger.closest(".EditorEvidenceRoadmapTimeline, .EditorDataAdminListTable").is(".EditorDataAdminListTable");
                var _controller = args.Controller;

                var _popupOptions = {
                    "PopupCssClass": "EditorRoadmapStudyPopup", "IsMinimalView": true, "PopupSize": "large",
                    "IsRefreshControllerOnDismiss": true, "Controller": _controller, "LayoutManager": args.LayoutManager,
                    "HTML": "<div class='LabelLoading'>" + util_htmlEncode("Loading...") + "</div>"
                };

                _popupOptions["GetContent"] = function (contentCallback) {

                    var _popupHTML = "<div>";

                    var _contentCallback = function () {
                        contentCallback(_popupHTML);
                    };

                    var _fnAppendProp = function (prop, isEnum) {

                        var _label = "";
                        var _editorDataType = null;
                        var _attrs = util_htmlAttribute("data-attr-prop", enCETriState.Yes);
                        var _isFormatted = false;

                        if (isEnum) {
                            _label = prop["n"];
                            _editorDataType = prop["t"];
                            _isFormatted = util_forceBool(prop["formatted"], false);

                            _attrs += " " + util_htmlAttribute("data-attr-prop-enum", prop["p"]);
                        }
                        else {
                            _label = prop[enColStudyFieldProperty.Name];
                            _editorDataType = prop[enColStudyFieldProperty.EditorDataTypeID];
                            _isFormatted = prop[enColStudyFieldProperty.IsFormatted];

                            _attrs += " " + util_htmlAttribute("data-attr-study-field-id", prop[enColStudyFieldProperty.FieldID]);
                        }

                        _attrs += " " + util_htmlAttribute("data-attr-prop-editor-data-type", _editorDataType) +
                                  " " + util_htmlAttribute("data-attr-prop-is-formatted", _isFormatted ? enCETriState.Yes : enCETriState.No);

                        _popupHTML += "<div class='TableBlockRow' " + _attrs + ">" +
                                      " <div class='TableBlockCell ColumnHeading'>" + util_htmlEncode(_label) + "</div>" +
                                      " <div class='TableBlockCell ColumnContent'>&nbsp;</div>" +
                                      "</div>";

                    };  //end: _fnAppendProp

                    var _arrStandardProp = _controller.GetStandardPropertyList();

                    _popupHTML += "<div class='EffectBlur EditorRoadmapStudyDetailTable' " + util_htmlAttribute("data-attr-view-study-id", args.StudyID) + ">";    //open detail tag

                    _popupHTML += "<div class='Title'>" +
                                  " <div class='LabelName'>&nbsp;</div>" +
                                  " <div class='LinkClickable' title='Close' " + util_htmlAttribute("data-attr-popup-close-button", enCETriState.Yes) + ">X</div>" +
                                  "</div>";

                    _popupHTML += "<div class='NavigationButtons'>" +
                                  _controller.Utils.HTML.GetButton({ "Content": "Prev", "Attributes": { "data-icon": "arrow-l", "data-iconpos": "left", "data-nav-button": "prev" } }) +
                                  _controller.Utils.HTML.GetButton({ "Content": "Next", "Attributes": { "data-icon": "arrow-r", "data-iconpos": "right", "data-nav-button": "next" } }) +
                                  "</div>";

                    for (var p = 0; p < _arrStandardProp.length; p++) {
                        _fnAppendProp(_arrStandardProp[p], true);
                    }

                    _controller.GetPropertyList({
                        "Callback": function (list) {
                            list = (list || []);

                            for (var p = 0; p < list.length; p++) {
                                _fnAppendProp(list[p]);
                            }

                            _popupHTML += " </div>" +   //close detail tag
                                          "</div>";

                            _contentCallback();
                        }
                    });
                    

                };  //end: GetContent

                _popupOptions["OnOpen"] = function () {

                    var $tbl = $mobileUtil.PopupContentContainer().find(".EditorRoadmapStudyDetailTable");
                    var _studyID = util_forceInt($tbl.attr("data-attr-view-study-id"), enCE.None);

                    var $fields = $tbl.find(".TableBlockRow[data-attr-prop] .ColumnContent");

                    var _fnBindFields = function (isTransition, $list, index, dataItem, lookupFieldValue, onCallback) {

                        if (index == 0) {

                            $tbl.addClass("EditorLoadProgressView");
                            $tbl.toggleClass("EffectBlur", isTransition == true);

                            //set the study title
                            var $lblTitle = $tbl.find(".Title > .LabelName");

                            $lblTitle.text(_controller.ProjectOnRenderGetStudyLabel({ "Item": dataItem, "From": "detail_view" }));

                            //init the lookup field values, if applicable
                            if (!lookupFieldValue) {
                                var _studyFieldValues = (dataItem[enColCEStudyProperty.StudyFieldValues] || []);

                                lookupFieldValue = {};

                                for (var f = 0; f < _studyFieldValues.length; f++) {
                                    var _studyFieldValue = _studyFieldValues[f];
                                    var _fieldID = _studyFieldValue[enColStudyFieldValueProperty.FieldID];

                                    lookupFieldValue[_fieldID] = _studyFieldValue;
                                }
                            }
                        }

                        var _valid = !$tbl.attr("data-attr-is-removed");

                        if (_valid && (index < $list.length)) {

                            var $lbl = $($fields.get(index));
                            var $prop = $lbl.closest("[data-attr-prop]");
                            var _isEnum = $prop.is("[data-attr-prop-enum]");
                            var _editorDataType = util_forceInt($prop.attr("data-attr-prop-editor-data-type"), enCE.None);
                            var _isFormatted = (util_forceInt($prop.attr("data-attr-prop-is-formatted"), enCETriState.No) == enCETriState.Yes);
                            var _valueHTML = "";
                            var _val = "";
                            var _extBindOpts = {};
                            var _reqRenderRefresh = true;
                            var _fnBindOnRefresh = null;

                            if (_isEnum) {
                                var _propName = $prop.attr("data-attr-prop-enum");

                                if (_propName == enColStudyProperty.StartDate || _propName == enColStudyProperty.EndDate) {

                                    var _isFullDate = true;

                                    switch (_propName) {

                                        case enColStudyProperty.StartDate:
                                            _isFullDate = dataItem[enColStudyProperty.IsFullStartDate];
                                            break;

                                        case enColStudyProperty.EndDate:
                                            _isFullDate = dataItem[enColStudyProperty.IsFullEndDate];
                                            break;
                                    }

                                    _extBindOpts["IsFullDate"] = _isFullDate;
                                }

                                _val = dataItem[_propName];
                            }
                            else {
                                var _fieldID = util_forceInt($prop.attr("data-attr-study-field-id"), enCE.None);
                                var _studyFieldValue = lookupFieldValue[_fieldID];

                                if (_studyFieldValue) {
                                    _val = _studyFieldValue[enColStudyFieldValueProperty.Value];
                                }
                            }

                            switch (_editorDataType) {

                                case enCEEditorDataType.Date:

                                    _valueHTML += "<div " + util_renderAttribute("pluginEditor_dropdownDatePicker") + " " +
                                                  util_htmlAttribute("data-attr-is-read-only", enCETriState.Yes) + " />";

                                    _fnBindOnRefresh = function () {
                                        $lbl.find("[" + util_renderAttribute("pluginEditor_dropdownDatePicker") + "]")
                                            .trigger("events.setValue", { "Value": _val, "IsFullDate": util_forceBool(_extBindOpts["IsFullDate"], true) });
                                    };

                                    break;

                                default:

                                    _reqRenderRefresh = false;

                                    _val = util_forceString(_val);

                                    if (_isFormatted) {

                                        //field is formatted, so convert the text to parse anchor links, emails, and line breaks (if applicable)
                                        try {
                                            _valueHTML += linkifyStr(_val, {
                                                "className": "LinkClickable",
                                                "attributes": { "data-rel": "external", "data-role": "none" },
                                                "target": {
                                                    "url": "_blank"
                                                },
                                                "nl2br": (_editorDataType == enCEEditorDataType.FreeText)
                                            });
                                        } catch (e) {
                                            _valueHTML += util_htmlEncode(_val, (_editorDataType == enCEEditorDataType.FreeText));
                                            util_logError(e);
                                        }
                                    }
                                    else {
                                        _valueHTML += util_htmlEncode(_val, (_editorDataType == enCEEditorDataType.FreeText));
                                    }

                                    break;
                            }

                            $lbl.html(_valueHTML);

                            if (_reqRenderRefresh) {
                                $mobileUtil.refresh($lbl);
                            }

                            if (_fnBindOnRefresh) {
                                _fnBindOnRefresh();
                            }
                            
                            setTimeout(function () {
                                _fnBindFields(isTransition, $list, index + 1, dataItem, lookupFieldValue, onCallback);
                            }, 50);
                        }
                        else if (_valid) {
                            $tbl.removeClass("EffectBlur EditorLoadProgressView");

                            if (onCallback) {
                                onCallback();
                            }
                        }
                        
                    };  //end: _fn

                    $tbl.off("remove.cleanup");
                    $tbl.on("remove.cleanup", function () {
                        $tbl.attr("data-attr-is-removed", enCETriState.Yes);
                    });

                    var $vwNav = $tbl.find(".NavigationButtons");
                    var $navBtns = $vwNav.children(".LinkClickable[data-nav-button]");

                    $tbl.off("click.navigate");
                    $tbl.on("click.navigate", ".LinkClickable:not(.LinkDisabled)[data-nav-button]", function (e, args) {

                        args = util_extend({ "IsInit": false }, args);

                        if (args.IsInit || (!$tbl.hasClass("EffectBlur") && !$vwNav.data("is-busy"))) {

                            $vwNav.data("is-busy", true);

                            var $btn = $(this);
                            var _isNext = ($btn.attr("data-nav-button") == "next");
                            var _studyList = $tbl.data("List");

                            var _fn = function () {

                                var _current = util_forceInt($tbl.data("data-attr-study-nav-current-index"), 0);
                                var _new = _current;

                                if (!args.IsInit) {
                                    if (_isNext && _current + 1 < _studyList.length) {
                                        _new++;
                                    }
                                    else if (!_isNext && _current - 1 >= 0) {
                                        _new--;
                                    }
                                }

                                $navBtns.filter("[data-nav-button='prev']").toggleClass("LinkDisabled", (_new - 1 < 0));
                                $navBtns.filter("[data-nav-button='next']").toggleClass("LinkDisabled", (_new + 1 >= _studyList.length));

                                if (!args.IsInit && _current != _new) {

                                    var _study = _studyList[_new];

                                    $tbl.data("data-attr-study-nav-current-index", _new);

                                    $tbl.trigger("events.bindItem", {
                                        "StudyID": _study[enColStudyProperty.StudyID], "IsTransition": false, "Callback": function () {
                                            $vwNav.data("is-busy", false);
                                        }
                                    });
                                }
                                else {
                                    $vwNav.data("is-busy", false);
                                }

                            };  //end: _fn

                            if (!_studyList) {
                                _fnGetList(_controller, {
                                    "IsCompleted": (_isCompleted ? enCETriState.Yes : enCETriState.No), "SortColumn": enColStudy.StartDate, "SortAscending": false
                                }, function (studyData) {

                                    _studyList = (studyData ? studyData.List : null);
                                    _studyList = (_studyList || []);

                                    var _studyID = util_forceInt($tbl.attr("data-attr-view-study-id"), enCE.None);

                                    var _current = util_arrFilterItemIndex(_studyList, function (searchItem) {
                                        return (searchItem[enColStudyProperty.StudyID] == _studyID);
                                    });

                                    if (_current < 0) {
                                        _current = 0;
                                    }

                                    $tbl.data("data-attr-study-nav-current-index", _current);

                                    $tbl.data("List", _studyList);
                                    _fn();
                                });
                            }
                            else {
                                _fn();
                            }
                        }

                    }); //end: click.navigate

                    $tbl.off("events.bindItem");
                    $tbl.on("events.bindItem", function (e, args) {

                        args = util_extend({ "StudyID": enCE.None, "Callback": null, "IsTransition": true }, args);

                        var _studyID = util_forceInt(args.StudyID, enCE.None);

                        APP.Service.Action({
                            "c": "PluginEditor", "m": "StudyGetByPrimaryKey",
                            "args": {
                                "_EditorGroupID": _controller.Utils.ContextEditorGroupID($trigger),
                                "StudyID": _studyID, "DeepLoad": true
                            }
                        }, function (studyData) {

                            var _study = (studyData || {});

                            if (util_forceInt(_study[enColStudyProperty.StudyID], enCE.None) == enCE.None) {

                                $tbl.removeClass("EffectBlur");

                                $navBtns.addClass("LinkDisabled");

                                $tbl.children(".TableBlockRow")
                                    .hide();

                                //clear the title
                                var $lblTitle = $tbl.find(".Title > .LabelName");

                                $lblTitle.html("&nbsp;");

                                $tbl.append("<div class='LabelError'>" +
                                            _controller.Utils.HTML.GetButton({ "IsIconInformation": true, "IsDisabled": true }) +
                                            util_htmlEncode("Study is no longer available or invalid. Please return to selection view and try again.") +
                                            "</div>");

                                $tbl.trigger("create");

                                if (args.Callback) {
                                    args.Callback();
                                }
                            }
                            else {
                                _fnBindFields(args.IsTransition, $fields, 0, _study, null, args.Callback);
                            }
                        });

                    }); //end: events.bindItem

                    $tbl.trigger("events.bindItem", {
                        "StudyID": _studyID, "Callback": function () {
                            $($navBtns.get(0)).trigger("click.navigate", { "IsInit": true });
                        }
                    });

                };  //end: OnOpen

                if (!args.LayoutManager) {
                    $element.trigger("events.getLayoutManager", {
                        "Callback": function (layoutManager) {
                            layoutManager.PopupShow(_popupOptions);
                        }
                    });
                }
                else {
                    args.LayoutManager.PopupShow(_popupOptions);
                }

            }); //end: events.roadmap_detailView

            $element.off("events.roadmap_loadStudy");
            $element.on("events.roadmap_loadStudy", function (e, args) {

                args = util_extend({ "Trigger": null }, args);

                var _onClick = $element.data("OnItemClick");

                if (_onClick) {

                    var $this = $(args.Trigger);
                    var _studyID = enCE.None;
                    var _isEditMode = false;

                    args = util_extend({}, args);

                    if ($this.is("[data-attr-study-id]")) {
                        _studyID = util_forceInt($this.attr("data-attr-study-id"), enCE.None);
                        _isEditMode = $this.closest(".EditorEvidenceRoadmapTimeline").hasClass("EditorEvidenceRoadmapTimelineEditMode");
                    }
                    else {
                        _studyID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-study-id"), enCE.None);
                        _isEditMode = $this.closest(".EditorDataAdminListTable").hasClass("EditorDataAdminListEditMode");
                    }

                    args["IsEditMode"] = _isEditMode;
                    args["StudyID"] = _studyID;
                    args["Element"] = $this;

                    _onClick(args);
                }
            });

            $element.off("click.roadmap_study");
            $element.on("click.roadmap_study", ".LinkClickable.EditorStudyTimelineDetail:not(.EditorStudyTimelinePlaceholder)[data-attr-study-id]", function (e, args) {

                $element.trigger("events.roadmap_loadStudy", { "Trigger": this });

            }); //end: click.roadmap_study
        }
    });
};

//SECTION START: project specific support

CEvidenceRoadmapController.prototype.ProjectOnRenderStudyEditView = function (options) {

    if (options.Callback) {
        options.Callback();
    }
};

CEvidenceRoadmapController.prototype.ProjectOnGetFilters = function (options) {

    if (options.Callback) {
        options.Callback(null);
    }
};

CEvidenceRoadmapController.prototype.ProjectOnGetStudyList = function (options) {

    options = util_extend({ "Params": null, "Callback": null, "FailureFn": null }, options);

    APP.Service.Action({ "c": "PluginEditor", "m": "StudyGetByForeignKey", "args": options.Params }, options.Callback, options.FailureFn);
};

CEvidenceRoadmapController.prototype.ProjectOnRenderGetStudyLabel = function (options) {
    var _study = options.Item;

    return _study[enColStudyProperty.Name];
};

CEvidenceRoadmapController.prototype.ProjectOnConfigureTimelineTable = function (options) {
};

CEvidenceRoadmapController.prototype.ProjectOnRenderStudyRepeaterField = function (options) {
};

//SECTION END: project specific support