var enCEditorScenarioContentRendererType = {
    "None": 0,
    "Layout": 2,
    "ScenarioGroup": 4,
    "ScenarioSection": 6,
    "Situation": 8,
    "Rationale": 10
};

var CEditorScenarioController = function () {
    var _instance = this;

    _instance["DOM"] = {
        "Element": null
    };

    var _utils = pluginEditor_getUtils();

    _instance["Utils"] = util_extend({
        "PlatformIconsHTML": null,
        "ContextEditorGroupID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-attr-home-editor-group-id"), enCE.None);
        },
        "ContextEditorGroupPlatformID": function (obj) {
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-platform-id"), enCE.None);
        },
        "ContextEditorGroupClassificationID": function(obj){
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-classification-id"), enCE.None);
        },
        "ContextEditorGroupComponentID": function(obj){
            return util_forceInt($mobileUtil.GetClosestAttributeValue(obj, "data-home-editor-group-component-id"), enCE.None);
        },
        "SetElementHTML": function (obj, html, opts) {

            var _callback = function () {
                if (opts.Callback) {
                    opts.Callback();
                }
            };

            opts = util_extend({ "Callback": null }, opts);

            var $element = $(obj);

            var $child = $element.children();

            //TODO: need to ensure HTML does not conflict with jQuery Mobile (such as links)
            html = util_forceString(html);

            if ($child.length == 1 && $child.is(".Placeholders")) {

                $child.fadeOut("fast", function () {
                    $element.html(html);
                    _callback();
                });
            }
            else {
                $element.html(html);
                _callback();
            }
        },
        "GetPlaceholderHTML": function (numLines) {
            var _html = "<div class='EffectBlur Placeholders'>";

            numLines = util_forceInt(numLines, 0);
            numLines = Math.max(numLines, 1);

            for (var n = 0; n < numLines; n++) {
                _html += "<div class='Placeholder TextLine_" + (n + 1) + "' />";
            }

            _html += "</div>";

            return _html;
        }

    }, _utils);

    _instance["PluginInstance"] = null;
    _instance["Data"] = {
        "LookupRenderPropList": {},
        "Categories": "%%TOK|ROUTE|PluginEditor|EditorScenarioCategoryGetByForeignKey%%",
        "Sections": "%%TOK|ROUTE|PluginEditor|EditorScenarioSectionGetByForeignKey%%",
        "Groups": "%%TOK|ROUTE|PluginEditor|EditorScenarioGroupGetByForeignKey%%",
        "SituationListViewSection": "%%TOK|ROUTE|PluginEditor|EditorSituationListViewScenarioSection%%",

        "m_situationListViewSectionID": null,

        "GetSituationListViewSectionID": function () {
            var _ret = this.m_situationListViewSectionID;

            if (!_ret) {

                this.m_situationListViewSectionID = enCE.None;

                if (this.SituationListViewSection) {
                    this.m_situationListViewSectionID = util_forceInt(this.SituationListViewSection[enColEditorScenarioSectionProperty.SectionID], enCE.None);
                }

                _ret = this.m_situationListViewSectionID;
            }

            return _ret;
        }
    };
};

CEditorScenarioController.prototype.IsCurrentViewMode = function (options) {
    options = util_extend({ "ViewMode": null }, options);

    var _instance = this;
    var $vws = null;

    if (!_instance.DOM["Views"] && _instance.DOM.Element) {
        _instance.DOM["Views"] = $(_instance.DOM.Element).find(".EditorEmbeddedView");
    }

    $vws = $(_instance.DOM["Views"]);

    return ($vws.filter(".ActiveView").attr("data-attr-view-mode") == options.ViewMode);
};

CEditorScenarioController.prototype.ActiveEmbeddedView = function () {
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

CEditorScenarioController.prototype.Bind = function (options, callback) {

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
                       .slideUp("normal", function () {
                           $active.removeClass("EffectBlur");

                           $target.hide()
                                  .slideDown("slow", function () {

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

    var $vwMain = $element.children(".PluginEditorScenarioMain");
    var $vwDetail = $element.children(".PluginEditorScenarioDetails");

    var _fnBindView = function () {

        _controller.ActiveEmbeddedView().trigger("events.bind", { "Callback": _callback, "Options": options });

    };  //end: _fnBindView

    if ($vwMain.length == 0) {

        var _html = "";        

        //master view
        _html += "<div class='EditorEmbeddedView PluginEditorScenarioMain ActiveView' data-attr-view-mode='master'>" +
                 _controller.GetEditorHTML({
                     "ID": enCEEditorLayoutType.Header,
                     "ContentType": enCEditorScenarioContentRendererType.Layout,
                     "CssClass": "EditorLayoutClassificationComponent",
                     "AttributeStr": util_htmlAttribute("data-attr-editor-layout-type", enCEEditorLayoutType.Header), "NumPlaceholderLines": 3
                 }) +
                 "  <div " + util_renderAttribute("pluginEditor_scenarioView") + " />" +
                 _controller.GetEditorHTML({
                     "ID": enCEEditorLayoutType.Footer,
                     "ContentType": enCEditorScenarioContentRendererType.Layout,
                     "CssClass": "EditorLayoutClassificationComponent",
                     "AttributeStr": util_htmlAttribute("data-attr-editor-layout-type", enCEEditorLayoutType.Footer), "NumPlaceholderLines": 3
                 }) +
                 "</div>";

        //detail view
        _html += "<div class='EditorEmbeddedView PluginEditorScenarioDetails' data-attr-view-mode='detail' style='display: none;'>" +
                 " <div " + util_renderAttribute("pluginEditor_scenarioView") + " " + util_htmlAttribute("data-attr-view-is-legend-mode", enCETriState.Yes) + " />" +
                 " <div class='InlineTitle'>" +
                 "      <div class='Label' />" +
                 "      <div class='Description'>" +
                 _controller.GetEditorHTML({
                     "ID": "group_desc",
                     "NumPlaceholderLines": 8,
                     "ContentType": enCEditorScenarioContentRendererType.ScenarioGroup,
                     "IncludeEditButtons": true
                 }) +
                 "      </div>" +
                 " </div>" +
                 " <div class='EditorTabView'>";

        var _sections = (_controller.Data.Sections || []);

        var _tabbedIndicatorHTML = "<div class='Divider' />";

        for (var s = 0; s < _sections.length; s++) {
            var _scenarioSection = _sections[s];
            var _sectionID = _scenarioSection[enColEditorScenarioSectionProperty.SectionID];

            _html += "<div class='LinkClickable TabItem Tab" + (s == _sections.length - 1 ? " LastChild" : "") + "' " +
                     util_htmlAttribute("data-attr-tab-id", _sectionID) + " " +
                     util_htmlAttribute("data-attr-tab-is-editable", _scenarioSection[enColEditorScenarioSectionProperty.IsEditable] ? enCETriState.Yes : enCETriState.No) +
                     ">" +
                     util_htmlEncode(_scenarioSection[enColEditorScenarioSectionProperty.Name]) +
                     "</div>";

            _tabbedIndicatorHTML += "<div class='TabItem TabIndicator' " + util_htmlAttribute("data-attr-ref-tab-id", _sectionID) + ">" +
                                    "   <div class='Icon' />" +
                                    "</div>";
        }

        _html += _tabbedIndicatorHTML;

        _html += "  </div>" +
                 "</div>";

        $element.html(_html);

        var $vwScenario = $element.find("[" + util_renderAttribute("pluginEditor_scenarioView") + "]");

        $vwScenario.data("RenderData", _controller.Data);

        $mobileUtil.refresh($element);

        $vwMain = $element.children(".PluginEditorScenarioMain");
        $vwDetail = $element.children(".PluginEditorScenarioDetails");

        var $vwMainScenario = $vwMain.find("[" + util_renderAttribute("pluginEditor_scenarioView") + "]:first");
        var $vwClassificationLayouts = $vwMain.find(".EditorLayoutClassificationComponent");

        $vwMain.off("events.bind");
        $vwMain.on("events.bind", function (e, args) {

            args = util_extend({ "Callback": null, "Options": null }, args);

            var options = args.Options;
            var _editorGroupID = _controller.Utils.ContextEditorGroupID($element);
            var _classificationID = _controller.Utils.ContextEditorGroupClassificationID($element);
            var _componentID = _controller.Utils.ContextEditorGroupComponentID($element);

            APP.Service.Action({
                "c": "PluginEditor", "m": "ClassificationLayoutContentGetByForeignKey",
                "args": {
                    "_EditorGroupID": _editorGroupID,
                    "ClassificationID": _classificationID,
                    "ComponentID": _componentID
                }
            }, function (classificationLayoutData) {

                var _classificationLayouts = (_classificationID != enCE.None && _componentID != enCE.None && classificationLayoutData ?
                                              classificationLayoutData.List : null);

                _classificationLayouts = (_classificationLayouts || []);

                $.each($vwClassificationLayouts, function () {
                    var $this = $(this);
                    var _layoutTypeID = util_forceInt($this.attr("data-attr-editor-layout-type"), enCE.None);
                    var _classificationLayoutContent = util_arrFilter(_classificationLayouts, enColClassificationLayoutContentProperty.LayoutTypeID,
                                                                      _layoutTypeID, true);

                    _classificationLayoutContent = (_classificationLayoutContent.length == 1 ? _classificationLayoutContent[0] : (new CEClassificationLayoutContent()));

                    _classificationLayoutContent[enColClassificationLayoutContentProperty.LayoutTypeID] = _layoutTypeID;
                    _classificationLayoutContent[enColClassificationLayoutContentProperty.ClassificationID] = _classificationID;
                    _classificationLayoutContent[enColClassificationLayoutContentProperty.ComponentID] = _componentID;

                    $this.data("DataItem", _classificationLayoutContent);

                    _controller.SetEditorContent({ "Element": $this, "HTML": _classificationLayoutContent[enColClassificationLayoutContentProperty.ContentHTML] });
                });

                APP.Service.Action({
                    "c": "PluginEditor", "m": "EditorScenarioGroupContentGetByForeignKey",
                    "args": {
                        "_EditorGroupID": _editorGroupID
                    }
                }, function (contentData) {
                    var _groupContentList = (contentData ? contentData.List : null);

                    _groupContentList = (_groupContentList || []);

                    var _onCallback = function () {

                        var _isRefresh = (options["IsRefresh"] == true);

                        if (_isRefresh) {

                            _controller.ToggleEditMode({
                                "IsEdit": _controller.Utils.IsEditMode($element), "Controller": _controller, "PluginInstance": _pluginInstance, "LayoutManager": options.LayoutManager,
                                "Callback": args.Callback
                            });
                        }
                        else if (args.Callback) {
                            args.Callback();
                        }

                    };

                    $vwMainScenario.trigger("events.scenarioView_bind", { "Controller": _controller, "Data": _groupContentList, "Callback": _onCallback });

                });

            });

        }); //end: events.bind

        var $vwDetailScenario = $vwDetail.find("[" + util_renderAttribute("pluginEditor_scenarioView") + "]:first");
        var $vwTabControl = $vwDetail.find(".EditorTabView");

        _controller.Utils.ConfigureTabView({ "Controller": _controller, "List": $vwTabControl });

        $vwDetailScenario.data("OnGroupItemClick", function (opts) {

            opts = util_extend({ "GroupID": enCE.None, "CategoryID": enCE.None, "Callback": null }, opts);

            $vwDetail.find("[" + util_renderAttribute("pluginEditor_situationListView") + "]")
                     .data("is-init-data-list", false);

            $vwDetail.trigger("events.bind", { "CategoryID": opts.CategoryID, "GroupID": opts.GroupID, "IsCached": false, "Callback": opts.Callback });

        }); //end: OnGroupItemClick

        $vwTabControl.off("events.tab_setContent");
        $vwTabControl.on("events.tab_setContent", ".TabItem[data-attr-tab-id]", function (e, args) {

            args = util_extend({ "Controller": null, "HTML": null, "IsRefresh": false, "FocusSituationID": enCE.None }, args);

            var _controller = args.Controller;

            var $tab = $(this);
            var _tabID = $tab.attr("data-attr-tab-id");

            if (util_forceString(_tabID) != "") {

                var $tabContent = $vwTabControl.children(".TabContent[" + util_htmlAttribute("data-attr-tab-content-view-id", _tabID) + "]");
                var _isInit = ($tabContent.length == 0);
                var _isEditMode = _controller.Utils.IsEditMode($vwTabControl);
                var _canEditTab = (util_forceInt($tab.attr("data-attr-tab-is-editable"), enCETriState.None) == enCETriState.Yes);

                if (_isInit) {
                    $tabContent = $("<div class='TabContent'>" +
                                    (_canEditTab ?
                                     _controller.GetEditorHTML({
                                         "ID": _tabID,
                                         "ContentType": enCEditorScenarioContentRendererType.ScenarioSection,
                                         "NumPlaceholderLines": 7,
                                         "IncludeEditButtons": true
                                     }) :
                                     "&nbsp;"
                                    ) +
                                    "</div>");
                    $tabContent.attr("data-attr-tab-content-view-id", _tabID)
                               .toggleClass("TabContentNonEditable", !_canEditTab);

                    $vwTabControl.append($tabContent);
                    $mobileUtil.refresh($tabContent);
                }

                if (_isInit || !_isEditMode) {
                    if (_canEditTab) {
                        _controller.SetEditorContent({
                            "Element": $tabContent.children("[" + util_renderAttribute("pluginEditor_content") + "]"), "HTML": args.HTML
                        });
                    }
                    else {

                        if (!$tabContent.data("is-init-content")) {
                            $tabContent.data("is-init-content", true);

                            if (_tabID == _controller.Data.GetSituationListViewSectionID()) {
                                $tabContent.html("<div " + util_renderAttribute("pluginEditor_situationListView") + " />");
                                $mobileUtil.refresh($tabContent);
                            }
                        }

                        //disable refresh of the situation list view if the component home view is being refreshed (as the refresh event will handle it)
                        if (!args.IsRefresh) {
                            var $listView = $tabContent.find("[" + util_renderAttribute("pluginEditor_situationListView") + "]");

                            $listView.trigger("events.situationList_bind", { "Controller": _controller, "FocusSituationID": args.FocusSituationID, "IsInit": true });
                        }
                    }
                }
            }

        }); //end: events.tab_setContent

        $vwTabControl.data("OnTabClick", function (opts) {

            var _clickCallback = function () {
                if (opts.Callback) {
                    opts.Callback();
                }
            };

            opts = util_extend({ "ID": enCE.None, "IsEditable": true, "Element": null, "Callback": null }, opts);

            var $tab = $(opts.Element);
            var _contentHTML = null;

            if (opts.IsEditable) {
                var _sectionID = util_forceInt(opts.ID, enCE.None);

                var _scenarioGroup = ($vwDetail.data("DataItem") || {});
                var _sectionContents = (_scenarioGroup[enColCEEditorScenarioGroupProperty.ScenarioGroupSectionContents] || []);
                var _classificationID = _controller.Utils.ContextEditorGroupClassificationID($vwTabControl);

                var _sectionContent = util_arrFilterSubset(_sectionContents, function (searchItem) {
                    return (searchItem[enColEditorScenarioGroupSectionContentProperty.ScenarioSectionID] == _sectionID &&
                            searchItem[enColEditorScenarioGroupSectionContentProperty.ClassificationID] == _classificationID);
                }, true);

                _sectionContent = (_sectionContent.length == 1 ? _sectionContent[0] : (new CEEditorScenarioGroupContent()));

                _sectionContent[enColEditorScenarioGroupSectionContentProperty.ScenarioGroupID] = util_forceInt($mobileUtil.GetClosestAttributeValue($vwTabControl,
                                                                                                                "data-attr-current-scenario-group-id"), enCE.None);
                _sectionContent[enColEditorScenarioGroupSectionContentProperty.ScenarioSectionID] = _sectionID;
                _sectionContent[enColEditorScenarioGroupSectionContentProperty.ClassificationID] = _classificationID;

                _contentHTML = _sectionContent[enColEditorScenarioGroupSectionContentProperty.ContentHTML];
            }

            var _isRefresh = (util_forceInt($tab.attr("data-attr-is-refresh"), enCETriState.None) == enCETriState.Yes);
            var _focusSituationID = util_forceInt($tab.attr("data-attr-focus-editor-situation-id"), enCE.None);

            if (_isRefresh) {
                $tab.removeAttr("data-attr-is-refresh");
            }

            if (_focusSituationID != enCE.None) {
                $tab.removeAttr("data-attr-focus-editor-situation-id");
            }

            $tab.trigger("events.tab_setContent", {
                "Controller": _controller, "HTML": _contentHTML, "IsRefresh": _isRefresh, "FocusSituationID": _focusSituationID
            });
            
            _clickCallback();

        }); //end: OnTabClick

        $vwDetail.off("events.bind");
        $vwDetail.on("events.bind", function (e, args) {

            var _fnForceValidID = function (val, name) {
                if (util_forceInt(val, enCE.None) == enCE.None) {
                    val = util_forceInt($vwDetail.data(name), enCE.None);
                }

                return val;
            };

            args = util_extend({ "Callback": null, "CategoryID": enCE.None, "GroupID": enCE.None, "FocusSituationID": enCE.None, "IsCached": false, "Options": null }, args);

            var options = args.Options;
            var _isRefresh = (options && (options["IsRefresh"] == true));

            var _bindCallback = function () {
                
                if (_isRefresh) {

                    var $vwSituationList = $vwDetail.find("[" + util_renderAttribute("pluginEditor_situationListView") + "]");
                    var _queue = new CEventQueue();

                    $.each($vwSituationList, function () {

                        var $vw = $(this);

                        _queue.Add(function (onCallback) {

                            $vw.trigger("events.situationList_bind", {
                                "Controller": _controller, "IsInit": true, "Callback": onCallback
                            });

                        });
                    });

                    _queue.Run({
                        "Callback": function () {

                            _controller.ToggleEditMode({
                                "IsEdit": _controller.Utils.IsEditMode($element), "Controller": _controller, "PluginInstance": _pluginInstance, "LayoutManager": options.LayoutManager,
                                "Callback": args.Callback
                            });

                        }
                    });

                }
                else if (args.Callback) {
                    args.Callback();
                }

            };

            args.GroupID = _fnForceValidID(args.GroupID, "current-view-group-id");
            args.CategoryID = _fnForceValidID(args.CategoryID, "current-view-category-id");

            var _groupID = util_forceInt(args.GroupID, enCE.None);

            //associate the current selections to the view
            $vwDetail.data("current-view-category-id", args.CategoryID)
                     .data("current-view-group-id", args.GroupID);

            $vwDetailScenario.trigger("events.scenarioView_selected", { "CategoryID": args.CategoryID, "GroupID": _groupID });

            var _fnSetTitle = function (scenarioGroup, onCallback) {

                var $vwTitle = $vwDetail.children(".InlineTitle");

                scenarioGroup = (scenarioGroup || {});

                var _groupContent = util_arrFilter(scenarioGroup[enColCEEditorScenarioGroupProperty.ScenarioGroupContents], 
                                                   enColEditorScenarioGroupContentProperty.ClassificationID,
                                                   _controller.Utils.ContextEditorGroupClassificationID($vwDetail), true);

                _groupContent = (_groupContent.length == 1 ? _groupContent[0] : {});

                $vwTitle.children(".Label")
                        .text(util_forceString(scenarioGroup[enColEditorScenarioGroupProperty.Name]));

                _controller.SetEditorContent({
                    "Element": $vwTitle.find(".Description > [" + util_renderAttribute("pluginEditor_content") + "]"),
                    "HTML": _groupContent[enColEditorScenarioGroupContentProperty.ContentHTML],
                    "IsInitEditable": _controller.Utils.IsEditMode($element)
                });

                $vwDetail.attr("data-attr-current-scenario-group-id", util_forceInt(scenarioGroup[enColEditorScenarioGroupProperty.GroupID], enCE.None));

                if (!onCallback) {
                    onCallback = _bindCallback;
                }

                onCallback();

            };  //end: _fnSetTitle

            if (args.IsCached) {
                var _scenarioGroup = util_arrFilter(_controller.Data.Groups, enColEditorScenarioGroupProperty.GroupID, _groupID, true);

                _scenarioGroup = (_scenarioGroup.length == 1 ? _scenarioGroup[0] : {});

                _fnSetTitle(_scenarioGroup);
            }
            else {
                
                APP.Service.Action({
                    "c": "PluginEditor", "m": "EditorScenarioGroupGetByPrimaryKey",
                    "args": {
                        "_EditorGroupID": _controller.Utils.ContextEditorGroupID($element),
                        "GroupID": _groupID,
                        "DeepLoad": true
                    }
                }, function (scenarioGroup) {

                    scenarioGroup = (scenarioGroup || {});

                    _fnSetTitle(scenarioGroup, function () {

                        var _tabSelector = ".Tab";

                        if (args.FocusSituationID == enCE.None) {
                            _tabSelector += ".Selected";
                        }
                        else {
                            _tabSelector += "[" + util_htmlAttribute("data-attr-tab-is-editable", enCETriState.No) + "]:first";
                        }

                        var $tab = $vwTabControl.find(_tabSelector);

                        $vwDetail.data("DataItem", scenarioGroup)
                                 .data("SourceContentList", scenarioGroup[enColCEEditorScenarioGroupProperty.ScenarioGroupSectionContents] || []);

                        $vwTabControl.trigger("events.tab_init");

                        if ($tab.length == 0) {
                            $tab = $vwTabControl.find(".LinkClickable.Tab:first");
                        }

                        $tab.removeClass("LinkDisabled");   //must allow the link to be clickable to force click event

                        if (_isRefresh) {
                            $vwDetail.find("[" + util_renderAttribute("pluginEditor_situationListView") + "]")
                                     .data("is-init-data-list", false);   //set flag to reinitialize the list view

                        }

                        if ($tab.length == 0) {
                            _bindCallback();
                        }
                        else {
                            $tab.attr("data-attr-is-refresh", _isRefresh ? enCETriState.Yes : enCETriState.No)
                                .attr("data-attr-focus-editor-situation-id", args.FocusSituationID);

                            $tab.trigger("click.tab_heading", {
                                "Callback": _bindCallback
                            });
                        }

                    });

                });
            }

        }); //end: events.bind

        $vwDetail.off("events.saveEditorContent");
        $vwDetail.on("events.saveEditorContent", function (e, args) {

            args = util_extend({ "Trigger": null, "EditorElement": null, "Callback": null, "LayoutManager": null }, args);

            var _saveCallback = function () {
                if (args.Callback) {
                    args.Callback();
                }
            };

            var $editor = $(args.EditorElement);
            var $trigger = $(args.Trigger);

            var _contentTypeID = util_forceInt($editor.attr("data-attr-editor-scenario-content-type"), enCEditorScenarioContentRendererType.None);

            if (_contentTypeID == enCEditorScenarioContentRendererType.ScenarioGroup || _contentTypeID == enCEditorScenarioContentRendererType.ScenarioSection) {

                var _classificationID = _controller.Utils.ContextEditorGroupClassificationID($trigger);
                var _componentID = _controller.Utils.ContextEditorGroupComponentID($trigger);
                var _groupID = util_forceInt($mobileUtil.GetClosestAttributeValue($vwDetail, "data-attr-current-scenario-group-id"), enCE.None);

                var _scenarioGroup = $vwDetail.data("DataItem");

                if (!_scenarioGroup) {
                    _scenarioGroup = {};
                    $vwDetail.data("DataItem", _scenarioGroup);
                }

                if (_contentTypeID == enCEditorScenarioContentRendererType.ScenarioGroup) {

                    //save scenario group content (i.e. group description)
                    _controller.PopulateEditorContent({
                        "List": $editor,
                        "PropertyHTML": enColEditorScenarioGroupContentProperty.ContentHTML,
                        "PopulateItem": function (opts) {

                            var _item = util_arrFilter(_scenarioGroup[enColCEEditorScenarioGroupProperty.ScenarioGroupContents],
                                                       enColEditorScenarioGroupContentProperty.ClassificationID, _classificationID, true);

                            if (_item.length == 1) {
                                _item = _item[0];
                            }
                            else {
                                _item = new CEEditorScenarioGroupContent();
                            }

                            _item[enColEditorScenarioGroupContentProperty.ClassificationID] = _classificationID;
                            _item[enColEditorScenarioGroupContentProperty.ScenarioGroupID] = _groupID;

                            return _item;
                        },
                        "Callback": function (arr) {

                            //set the scenario group content to the first item (will be limited to only one and the first available entry in list)
                            var _scenarioGroupContent = arr[0];

                            _controller.Utils.Actions.SaveEntity({
                                "IsDisplaySaveMessage": true,
                                "Controller": _controller, "LayoutManager": args.LayoutManager, "Trigger": $trigger,
                                "IsAppService": true,
                                "Params": {
                                    "c": "PluginEditor", "m": "EditorScenarioGroupContentSave",
                                    "args": {
                                        "_EditorGroupID": _controller.Utils.ContextEditorGroupID($trigger),
                                        "Item": util_stringify(_scenarioGroupContent),
                                        "DeepSave": false
                                    }
                                },
                                "OnSuccess": function (saveItem) {
                                    var _index = null;

                                    //update the scenario group content for the data item
                                    var _scenarioGroupContents = _scenarioGroup[enColCEEditorScenarioGroupProperty.ScenarioGroupContents];

                                    if (!_scenarioGroupContents) {
                                        _scenarioGroupContents = [];
                                        _scenarioGroup[enColCEEditorScenarioGroupProperty.ScenarioGroupContents] = _scenarioGroupContents;
                                    }

                                    _index = util_arrFilterItemIndex(_scenarioGroupContents, function (search) {

                                        if (search[enColEditorScenarioGroupContentProperty.ClassificationID] ==
                                            saveItem[enColEditorScenarioGroupContentProperty.ClassificationID] &&
                                            search[enColEditorScenarioGroupContentProperty.ScenarioGroupID] ==
                                            saveItem[enColEditorScenarioGroupContentProperty.ScenarioGroupID]
                                            ) {
                                            return true;
                                        }

                                        return false;

                                    });

                                    if (_index >= 0) {
                                        _scenarioGroupContents[_index] = saveItem;
                                    }
                                    else {
                                        _scenarioGroupContents.push(saveItem);
                                    }

                                    _saveCallback();
                                }
                            });

                        }
                    });

                }
                else if (_contentTypeID == enCEditorScenarioContentRendererType.ScenarioSection) {

                    //save the scenario group section content (i.e. group tab content)
                    var _srcSectionContentList = $vwDetail.data("SourceContentList");

                    _controller.PopulateEditorContent({
                        "List": $editor,
                        "PropertyHTML": enColEditorScenarioGroupSectionContentProperty.ContentHTML,
                        "PopulateItem": function (opts) {
                            var $current = $(opts.Element);
                            var _sectionID = util_forceInt($mobileUtil.GetClosestAttributeValue($current, "data-attr-tab-content-view-id"), enCE.None);

                            var _item = util_arrFilterSubset(_srcSectionContentList,
                                                             function (searchItem) {
                                                                 var _found = false;

                                                                 if (searchItem[enColEditorScenarioGroupSectionContentProperty.ClassificationID] == _classificationID &&
                                                                     searchItem[enColEditorScenarioGroupSectionContentProperty.ScenarioGroupID] == _groupID &&
                                                                     searchItem[enColEditorScenarioGroupSectionContentProperty.ScenarioSectionID] == _sectionID
                                                                     ) {
                                                                     _found = true;
                                                                 }

                                                                 return _found;

                                                             }, true);

                            if (_item.length == 1) {
                                _item = _item[0];
                            }
                            else {
                                _item = new CEEditorScenarioGroupSectionContent_JSON();
                            }

                            _item[enColEditorScenarioGroupSectionContentProperty.ClassificationID] = _classificationID;
                            _item[enColEditorScenarioGroupSectionContentProperty.ScenarioGroupID] = _groupID;
                            _item[enColEditorScenarioGroupSectionContentProperty.ScenarioSectionID] = _sectionID;

                            return _item;
                        },
                        "Callback": function (arr) {

                            //set the scenario group section content to the first item (will be limited to only one and the first available entry in list)
                            var _scenarioGroupSectionContent = arr[0];

                            _controller.Utils.Actions.SaveEntity({
                                "IsDisplaySaveMessage": true,
                                "Controller": _controller, "LayoutManager": args.LayoutManager, "Trigger": $trigger,
                                "IsAppService": true,
                                "Params": {
                                    "c": "PluginEditor", "m": "EditorScenarioGroupSectionContentSave",
                                    "args": {
                                        "_EditorGroupID": _controller.Utils.ContextEditorGroupID($trigger),
                                        "Item": util_stringify(_scenarioGroupSectionContent),
                                        "DeepSave": false
                                    }
                                },
                                "OnSuccess": function (saveItem) {

                                    //update the scenario group section content list items
                                    var _scenarioGroupSectionContents = _scenarioGroup[enColCEEditorScenarioGroupProperty.ScenarioGroupSectionContents];

                                    if (!_scenarioGroupSectionContents) {
                                        _scenarioGroupSectionContents = [];
                                        _scenarioGroup[enColCEEditorScenarioGroupProperty.ScenarioGroupSectionContents] = _scenarioGroupSectionContents;
                                    }

                                    var _index = util_arrFilterItemIndex(_scenarioGroupSectionContents,
                                                                         function (searchItem) {
                                                                             var _found = false;

                                                                             if (searchItem[enColEditorScenarioGroupSectionContentProperty.ClassificationID] ==
                                                                                 saveItem[enColEditorScenarioGroupSectionContentProperty.ClassificationID] &&
                                                                                 searchItem[enColEditorScenarioGroupSectionContentProperty.ScenarioGroupID] ==
                                                                                 saveItem[enColEditorScenarioGroupSectionContentProperty.ScenarioGroupID] &&
                                                                                 searchItem[enColEditorScenarioGroupSectionContentProperty.ScenarioSectionID] ==
                                                                                 saveItem[enColEditorScenarioGroupSectionContentProperty.ScenarioSectionID]
                                                                                 ) {
                                                                                 _found = true;
                                                                             }

                                                                             return _found;
                                                                         });

                                    if (_index >= 0) {
                                        _scenarioGroupSectionContents[_index] = saveItem;
                                    }
                                    else {
                                        _scenarioGroupSectionContents.push(saveItem);
                                    }

                                    $vwDetail.data("SourceContentList", _scenarioGroup[enColCEEditorScenarioGroupProperty.ScenarioGroupSectionContents] || []);

                                    _saveCallback();

                                }
                            });
                            
                        }
                    });
                }
            }
            else {
                util_logError("events.saveEditorContent :: save not supported for content type - " + _contentTypeID);
                _callback();
            }

        }); //end: events.saveEditorContent

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

CEditorScenarioController.prototype.ToggleEditMode = function (options) {
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
    var $vwSituationListView = null;

    $vw.find("[" + util_renderAttribute("pluginEditor_scenarioView") + "]")
       .trigger("events.scenarioView_setEditable", { "IsEditable": options.IsEdit });

    if (!options.IsEdit) {
        if (options.LayoutManager) {
            options.LayoutManager.ToolbarSetButtons({
                "IsClear": true
            });
        }
    }
    else {
        
        var _toolbarBtnIDs = {
            "Save": "save_item",
            "Cancel": "edit_done"
        };

        if (_controller.IsCurrentViewMode({ "ViewMode": "master" })) {
            _toolbarBtnIDs.Save = "master_saveItem";
        }
        else if (_controller.IsCurrentViewMode({ "ViewMode": "detail" })) {
            _toolbarBtnIDs = null;
            $vwSituationListView = $vw.find("[" + util_renderAttribute("pluginEditor_situationListView") + "]");

            //check if the situation list view needs to be refreshed (changed from view mode to edit mode requiring permissions to be reapplied)
            if (options.IsEdit && !options["HasSituationListEditBind"]) {
                options["HasSituationListEditBind"] = true;

                _controller.Utils.Events.UserAccess({
                    "Trigger": $container,
                    "IsLoadComponentFilters": true,
                    "Callback": function (userAccessResult) {

                        var _lookupPlatformAccess = (userAccessResult ? userAccessResult["LookupPlatformAccess"] : null);

                        _lookupPlatformAccess = (_lookupPlatformAccess || {});

                        $vwSituationListView.data("LookupPlatformAccess", _lookupPlatformAccess);

                        $vwSituationListView.trigger("events.situationList_bind", {
                            "Controller": _controller, "IsInit": true, "Callback": function () {

                                _controller.ToggleEditMode(options);
                            }
                        });

                    }
                });

            }
        }
        else {
            _toolbarBtnIDs = null;
        }

        if (options.LayoutManager) {

            options.LayoutManager.ToolbarSetButtons({
                "IsHideDoneButton": true,
                "IsInsertStart": true,
                "List":
                    (_toolbarBtnIDs ?
                     _controller.Utils.HTML.GetButton({
                        "ActionButtonID": _toolbarBtnIDs.Save, "Content": "Save & Continue", "Attributes": {
                            "data-icon": "check", "data-attr-is-continue": enCETriState.Yes
                        }
                     }) +
                     _controller.Utils.HTML.GetButton({ "ActionButtonID": _toolbarBtnIDs.Save, "Content": "Save", "Attributes": { "data-icon": "check" } }) +
                     _controller.Utils.HTML.GetButton({
                         "ActionButtonID": "edit_done", "Content": "Cancel", "Attributes": { "data-icon": "back", "data-is-refresh-view": enCETriState.Yes }
                     }) :
                     _controller.Utils.HTML.GetButton({
                         "ActionButtonID": "edit_done", "Content": "Done", "Attributes": {
                             "data-icon": "check", "data-is-refresh-view": enCETriState.Yes, "data-attr-is-disable-confirmation": enCETriState.Yes
                         }
                     })
                    )
            });
        }

    }

    var _arrExcludeContentTypes = [enCEditorScenarioContentRendererType.ScenarioGroup, enCEditorScenarioContentRendererType.ScenarioSection,
                                   enCEditorScenarioContentRendererType.Situation, enCEditorScenarioContentRendererType.Rationale];

    var _selector = "[" + util_renderAttribute("pluginEditor_content") + "]";

    if (_arrExcludeContentTypes.length > 0) {

        _selector += ":not(";

        for (var i = 0; i < _arrExcludeContentTypes.length; i++) {

            _selector += (i > 0 ? ", " : "") +
                         "[" + util_htmlAttribute("data-attr-editor-scenario-content-type", _arrExcludeContentTypes[i]) + "]";
        }

        _selector += ")";
    }

    var $editors = $vw.find(_selector);

    $editors.trigger("events.setEditable", { "IsEditable": options.IsEdit });

    if ($vwSituationListView) {
        $vwSituationListView.trigger("events.situationList_toggleEditMode", { "Controller": _controller, "Options": options, "Callback": null });
    }

    $vw.find(".EditorDraggableContainer").toggleClass("EditorDraggableOn", options.IsEdit);

    if (!_handled && options.Callback) {
        options.Callback();
    }
};

CEditorScenarioController.prototype.OnButtonClick = function (options) {

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

        var _popupState = {};

        $btn.trigger("events.popup_state", _popupState);

        var _isPopupMode = (_popupState["IsVisible"] == true);

        switch (options.ButtonID) {

            case "master_saveItem":

                var _isContinueEdit = (util_forceInt($btn.attr("data-attr-is-continue"), enCETriState.No) == enCETriState.Yes);

                var $editors = _controller.ActiveEmbeddedView().find("[" + util_renderAttribute("pluginEditor_content") + "]");
                var _classificationID = _controller.Utils.ContextEditorGroupClassificationID($btn);
                var _componentID = _controller.Utils.ContextEditorGroupComponentID($btn);

                var _fnSaveClassificationLayout = function () {

                    _controller.PopulateEditorContent({
                        "List": $editors,
                        "IsSuppressNotModified": true,
                        "PropertyHTML": enColClassificationLayoutContentProperty.ContentHTML,
                        "PopulateItem": function (opts) {
                            var $editor = $(opts.Element);
                            var _item = $editor.data("DataItem");

                            return _item;
                        },
                        "Callback": function (arr) {

                            _controller.Utils.Actions.SaveEntity({
                                "IsDisplaySaveMessage": true,
                                "Controller": _controller, "LayoutManager": options.LayoutManager, "Trigger": $btn,
                                "IsAppService": true,
                                "Params": {
                                    "c": "PluginEditor", "m": "ClassificationLayoutContentSaveAll",
                                    "args": {
                                        "_EditorGroupID": _controller.Utils.ContextEditorGroupID($btn),
                                        "List": util_stringify(arr)
                                    }
                                },
                                "OnSuccess": function (saveItem) {

                                    var _list = (saveItem ? saveItem.List : null);

                                    _list = (_list || []);

                                    //reassociate the data item to the elements
                                    $.each($editors, function () {
                                        var $this = $(this);
                                        var _layoutTypeID = util_forceInt($this.attr("data-attr-editor-layout-type"), enCE.None);

                                        var _classificationLayout = util_arrFilter(_list, enColClassificationLayoutContentProperty.LayoutTypeID, _layoutTypeID, true);

                                        if (_classificationLayout.length == 1) {
                                            $this.data("DataItem", _classificationLayout[0]);
                                        }
                                    });

                                    if (!_isContinueEdit) {
                                        options.LayoutManager.ToolbarTriggerButton({
                                            "ButtonID": "done",
                                            "Callback": function () {
                                                AddMessage(_controller.Utils.LABELS.MessageSaveSuccess, null, null, { "IsTimeout": true });
                                            }
                                        });
                                    }
                                }
                            });

                        }
                    });

                };  //end: _fnSaveClassificationLayout

                dialog_confirmYesNo(_controller.Utils.LABELS.SaveChanges, _controller.Utils.LABELS.ConfirmSaveChanges, _fnSaveClassificationLayout);

                break;  //end: master_saveItem
           
            case "edit_done":

                var _isRefresh = (util_forceInt($btn.attr("data-is-refresh-view"), enCETriState.None) == enCETriState.Yes);

                var _fnEditDone = function () {

                    if (_controller.IsCurrentViewMode({ "ViewMode": "detail" })) {
                        var $editors = _controller.ActiveEmbeddedView().find("[" + util_renderAttribute("pluginEditor_content") + "]");

                        $editors.trigger("events.setEditable", { "IsEditable": false });
                    }

                    options.LayoutManager.ToolbarTriggerButton({
                        "ButtonID": "done", "Callback": function () {
                            if (_isRefresh) {
                                _controller.Bind({ "IsRefresh": true });
                            }
                        }
                    });
                };

                if (_isRefresh && util_forceInt($btn.attr("data-attr-is-disable-confirmation"), enCETriState.None) != enCETriState.Yes) {
                    dialog_confirmYesNo(_controller.Utils.LABELS.CancelChanges, _controller.Utils.LABELS.ConfirmCancelChanges, _fnEditDone);
                }
                else {
                    _fnEditDone();
                }

                break;  //end: edit_done

            case "add_situation":

                var $vwActive = _controller.ActiveEmbeddedView();
                var $listView = $vwActive.find("[" + util_renderAttribute("pluginEditor_situationListView") + "]:first");

                $btn.addClass("LinkDisabled");

                $listView.trigger("events.situationList_addSituation", {
                    "Controller": _controller, "Trigger": $btn, "Callback": function () {
                        $btn.removeClass("LinkDisabled");
                    }
                });

                break;  //end: add_situation

            case "add_situation_case_study":

                var $detail = $btn.closest(".EditorSituationDetail");
                var _isSituationSaved = (util_forceInt($detail.attr("data-attr-situation-id"), enCE.None) != enCE.None);

                var _fnAddRationale = function () {

                    var $vwRationaleListView = $detail.find(".EditorRationaleListView");

                    $btn.addClass("LinkDisabled");

                    $vwRationaleListView.trigger("events.situationList_addRationale", {
                        "Controller": _controller, "Trigger": $btn, "Callback": function () {

                            $btn.removeClass("LinkDisabled");
                        }
                    });

                };  //end: _fnAddRationale

                if (!_isSituationSaved) {

                    //do not allow user to add a rationale item for the situation until the situation detail has been saved (i.e. not add new situation)
                    dialog_confirmYesNo(util_htmlEncode("Save Scenario"),
                                        util_htmlEncode("The scenario must be saved before editing the case studies.") + "<br />" +
                                        util_htmlEncode("Would you like to save changes for the scenario?"),
                                        function () {
                                            $detail.find("[data-attr-editor-controller-action-btn='save_situation']")
                                                   .trigger("click", {
                                                       "IsConfirmChanges": false,   //disable save confirmation
                                                       "Callback": function () {

                                                           if (util_forceInt($detail.attr("data-attr-situation-id"), enCE.None) != enCE.None) {
                                                               _fnAddRationale();
                                                           }

                                                       }
                                                   });

                                        }, null, true);
                }
                else {
                    _fnAddRationale();
                }

                break;  //end: add_situation_case_study

            case "edit_situation":
            case "save_situation":
            case "cancel_situation":
            case "delete_situation":
            case "edit_rationale":
            case "save_rationale":
            case "cancel_rationale":
            case "delete_rationale":

                var $detail = $btn.closest(".EditorSituationEntityBase");

                var _fnToggleEditSituation = function () {
                    $detail.trigger("events.situationList_toggleEditSituation", {
                        "Controller": _controller, "LayoutManager": options.LayoutManager, "Trigger": $btn,
                        "Callback": options["Callback"]
                    });
                };

                var _entityMode = {
                    "Type": null,
                    "DisplayName": "Item",
                    "AttributeDataID": null,
                    "DeleteActionID": null,
                    "DeleteMethodName": null
                };

                switch (options.ButtonID) {

                    case "edit_situation":
                    case "save_situation":
                    case "cancel_situation":
                    case "delete_situation":

                        _entityMode.Type = "situation";
                        _entityMode.DisplayName = "Scenario";
                        _entityMode.AttributeDataID = "data-attr-situation-id";
                        _entityMode.DeleteActionID = "delete_situation";
                        _entityMode.DeleteMethodName = "EditorSituationDelete";

                        break;  //end: situation type

                    case "edit_rationale":
                    case "delete_rationale":

                        _entityMode.Type = "rationale";
                        _entityMode.DisplayName = "Case Study";
                        _entityMode.AttributeDataID = "data-attr-rationale-id";
                        _entityMode.DeleteActionID = "delete_rationale";
                        _entityMode.DeleteMethodName = "EditorSituationRationaleDelete";

                        break;  //end: rationale type
                }

                if (options.ButtonID == "delete_situation" || options.ButtonID == "delete_rationale") {

                    $detail.addClass("EditorSituationEntityBaseDisabled DisableDragElement");

                    var $collapseContent = $detail.children(".EditorCollapseContent");

                    if ($collapseContent.children(".DisabledOverlay").length == 0) {
                        $collapseContent.append("<div class='DisabledOverlay' />");
                    }

                    var _fnRevert = function () {
                        $detail.removeClass("EditorSituationEntityBaseDisabled DisableDragElement");
                    };

                    _controller.Utils.ProcessDeleteToggleButton({
                        "Trigger": $btn, "ButtonID": options.ButtonID, "ActionDeleteID": _entityMode.DeleteActionID,
                        "EntityContextSelector": $detail,
                        "ConfirmationTarget": null, "EntityName": _entityMode.DisplayName, "OnDeleteCallback": function (opts) {

                            _fnRevert();

                            $detail.trigger("events.situationList_getDataItem", {
                                "Trigger": $detail,
                                "Callback": function (dataItem) {

                                    var _fnAnimate = function () {

                                        $detail.removeAttr(_entityMode.AttributeDataID)
                                               .toggle("height", function () {
                                                   $detail.remove();
                                               });

                                    };  //end: _fnAnimate

                                    if (util_forceInt($detail.attr(_entityMode.AttributeDataID), enCE.None) == enCE.None) {

                                        //temp items (not yet saved, i.e. add new) can be deleted directly
                                        _fnAnimate();
                                        return;
                                    }

                                    if (_entityMode.Type == "rationale") {

                                        //associate the source rationale item for the delete (to support cascade delete from bridge child item)
                                        var _populate = { "RationaleID": dataItem[enColEditorSituationRationaleProperty.RationaleID], "Result": null };

                                        $detail.trigger("events.situationList_getRationaleItemFromLookup", _populate);

                                        dataItem[enColCEEditorSituationRationale_JSONProperty.RationaleItem] = _populate.Result;
                                    }

                                    _controller.Utils.Actions.SaveEntity({
                                        "IsDisplaySaveMessage": false,
                                        "Controller": _controller, "LayoutManager": options.LayoutManager, "Trigger": $btn,
                                        "IsAppService": true,
                                        "Params": {
                                            "c": "PluginEditor", "m": _entityMode.DeleteMethodName,
                                            "args": {
                                                "_EditorGroupID": _controller.Utils.ContextEditorGroupID($btn),
                                                "Item": util_stringify(dataItem)
                                            }
                                        },
                                        "OnSuccess": function (isDeleted) {

                                            if (isDeleted) {
                                                _fnAnimate();
                                            }
                                            else if (_entityMode.Type == "rationale") {
                                                delete dataItem[enColCEEditorSituationRationale_JSONProperty.RationaleItem];
                                            }
                                        }
                                    });

                                }
                            });

                        },
                        "OnCancelClick": _fnRevert,
                        "IsPermanentDelete": true, "HasUndoButton": false
                    });

                }
                else if (options.ButtonID == "save_situation" || options.ButtonID == "cancel_situation" ||
                         options.ButtonID == "save_rationale" || options.ButtonID == "cancel_rationale") {

                    var _title = null;
                    var _msg = null;

                    switch (options.ButtonID) {

                        case "save_situation":
                        case "save_rationale":

                            _title = _controller.Utils.LABELS.SaveChanges;
                            _msg = _controller.Utils.LABELS.ConfirmSaveChanges;
                            break;

                        case "cancel_situation":
                        case "cancel_rationale":

                            _title = _controller.Utils.LABELS.CancelChanges;
                            _msg = _controller.Utils.LABELS.ConfirmCancelChanges;
                            break;

                    }

                    if (util_forceBool(options["IsConfirmChanges"], true)) {
                        dialog_confirmYesNo(_title, _msg, _fnToggleEditSituation);
                    }
                    else {
                        _fnToggleEditSituation();
                    }
                }
                else {
                    _fnToggleEditSituation();
                }

                break;  //end: edit, save, cancel, delete situation/rationale

            case "editor_toggleEdit":
            case "editor_saveEdit":
            case "editor_cancelEdit":

                var $vwActive = _controller.ActiveEmbeddedView();
                var $vwHeader = $btn.closest(".EditorInlineHeaderView");
                var $editor = $vwHeader.next("[" + util_renderAttribute("pluginEditor_content") + "]");

                var _isEdit = (options.ButtonID == "editor_toggleEdit");
                var _isRestore = (options.ButtonID == "editor_cancelEdit");
                var $clCancel = $vwHeader.children("[data-attr-editor-controller-action-btn='editor_cancelEdit']");

                var _fn = function () {

                    $clCancel.toggle(_isEdit);

                    var $btnSave = $btn;

                    if (!_isEdit && !$btnSave.is("[data-attr-editor-controller-action-btn='editor_saveEdit']")) {
                        $btnSave = $vwHeader.children("[data-attr-editor-controller-action-btn='editor_saveEdit']");
                    }

                    if ($btnSave) {
                        _controller.Utils.Actions.ButtonUpdate({
                            "Element": $btnSave, "Icon": (_isEdit ? "check" : "edit"),
                            "Text": (_isEdit ? "Save" : "Edit"),
                            "ButtonID": (_isEdit ? "editor_saveEdit" : "editor_toggleEdit")
                        });
                    }

                    $editor.trigger("events.setEditable", { "IsEditable": _isEdit });

                };

                if (_isEdit && $clCancel.length == 0) {
                    $clCancel = $(_controller.Utils.HTML.GetButton({
                        "Content": "Cancel", "ActionButtonID": "editor_cancelEdit", "Attributes": {
                            "data-icon": "back"
                        }
                    }));

                    $vwHeader.append($clCancel)
                             .trigger("create");
                }

                if (options.ButtonID == "editor_saveEdit") {
                    dialog_confirmYesNo(_controller.Utils.LABELS.SaveChanges, _controller.Utils.LABELS.ConfirmSaveChanges, function () {
                        $vwActive.trigger("events.saveEditorContent", { "Trigger": $btn, "EditorElement": $editor, "LayoutManager": options.LayoutManager, "Callback": _fn });
                    });
                }
                else if (_isEdit) {
                    _fn();
                }
                else {

                    if (_isRestore) {
                        dialog_confirmYesNo(_controller.Utils.LABELS.CancelChanges, _controller.Utils.LABELS.ConfirmCancelChanges, function () {

                            $editor.trigger("events.restoreState", {
                                "Callback": function () {
                                    _fn();
                                }
                            });
                        });
                    }
                    else {
                        _fn();
                    }
                }

                break;  //end: editor_toggleEdit, editor_saveEdit, editor_cancelEdit

            default:
                break;
        }
    }
};

CEditorScenarioController.prototype.GetEditorHTML = function (options) {

    var _controller = this;

    options = util_extend({
        "ID": null, "ContentType": enCEditorScenarioContentRendererType.None, "CssClass": "", "AttributeStr": "",
        "HasPlaceholders": true, "NumPlaceholderLines": 3, "IncludeEditButtons": false
    }, options);

    var _contentType = util_forceInt(options.ContentType, enCEditorScenarioContentRendererType.None);

    if (util_forceString(options.ID) == "") {
        util_logError("GetEditorHTML :: ID is required for the editor");
    }
    else{
        options.ID = "strid_" + options.ID;
    }

    options.CssClass = util_forceString(options.CssClass);
    options.AttributeStr = util_forceString(options.AttributeStr);

    if (options.HasPlaceholders) {
        options.CssClass = "EditorElementPlaceholderOn" + (options.CssClass != "" ? " " : "") + options.CssClass;
        options.NumPlaceholderLines = Math.max(options.NumPlaceholderLines, 0);
    }

    var _ret = "";

    if (options.IncludeEditButtons) {
        _ret += "<div class='EditorInlineHeaderView ModeToggleEdit'>" +
                _controller.Utils.HTML.GetButton({ "ActionButtonID": "editor_toggleEdit", "Content": "Edit", "Attributes": { "data-icon": "edit" } }) +
                "</div>";
    }

    _ret += "<div " + util_htmlAttribute("data-attr-home-editor-temp-content-id", options.ID) + " " + util_htmlAttribute("class", options.CssClass) + " " +
            util_renderAttribute("pluginEditor_content") +
            (options.AttributeStr != "" ? " " + options.AttributeStr : "") +
            " " + util_htmlAttribute(DATA_ATTR_CONTROL_EDITOR_IS_INLINE_EDITABLE, enCETriState.No) +
            " " + util_htmlAttribute("data-attr-editor-is-disable-slide-actions", enCETriState.Yes) +
            " " + util_htmlAttribute("data-attr-editor-scenario-content-type", options.ContentType) +
            ">" +
            (options.HasPlaceholders ? _controller.Utils.GetPlaceholderHTML(options.NumPlaceholderLines) : "") +
            "</div>";

    return _ret;

};

CEditorScenarioController.prototype.SetEditorContent = function (options) {

    options = util_extend({ "Element": null, "GetHTML": null, "HTML": null, "IsInitEditable": false }, options);

    var $this = $(options.Element);
    var _contentTypeID = util_forceInt($this.attr("data-attr-editor-scenario-content-type"), enCEditorScenarioContentRendererType.None);

    var _html = "";

    if (options.GetHTML && util_isFunction(options.GetHTML)) {
        _html = options.GetHTML({ "Element": $this, "ContentTypeID": _contentTypeID });
    }
    else {
        _html = options.HTML;
    }

    _html = util_forceString(_html);

    $this.empty()
         .trigger("events.setContent", {
             "HTML": _html,
             "Callback": (options.IsInitEditable ?
                         function () {
                             $this.trigger("events.setEditable", { "IsEditable": true });
                         } :
                         null)
         });
};

CEditorScenarioController.prototype.PopulateEditorContent = function (options) {

    options = util_extend({ "List": null, "PopulateItem": null, "PropertyHTML": null, "Callback": null, "IsSuppressNotModified": false }, options);

    var _ret = [];

    var _queue = new CEventQueue();

    var _populateOptions = options;

    var $editors = $(options.List).filter("[" + util_renderAttribute("pluginEditor_content") + "]");

    if (_populateOptions.PropertyHTML) {
        _populateOptions["PropertyList"] = _populateOptions.PropertyHTML.split(".");
    }

    $.each($editors, function () {

        var $this = $(this);

        _queue.Add(function (onCallback) {

            $this.trigger("events.getContent", {
                "Callback": function (editMetadata) {

                    if (_populateOptions.PopulateItem) {
                        var _isModified = (editMetadata["IsModified"] === true);

                        if (_isModified || !_populateOptions.IsSuppressNotModified) {

                            var _item = _populateOptions.PopulateItem({
                                "IsModified": _isModified,
                                "Element": $this, "EditorEditState": editMetadata, "PopulateOptions": _populateOptions
                            });

                            if (_item) {

                                if (_populateOptions.PropertyHTML) {

                                    if (_populateOptions.PropertyList.length == 1) {
                                        _item[_populateOptions.PropertyHTML] = editMetadata["HTML"];
                                    }
                                    else {

                                        var _current = _item;
                                        var _prop = null;

                                        for (var p = 0; p < _populateOptions.PropertyList.length - 1; p++) {

                                            _prop = _populateOptions.PropertyList[p];

                                            var _val = _current[_prop];

                                            if (!_val) {
                                                _val = {};
                                                _current[_prop] = _val;
                                            }

                                            _current = _val;
                                        }

                                        _prop = _populateOptions.PropertyList[_populateOptions.PropertyList.length - 1];

                                        _current[_prop] = editMetadata["HTML"];
                                    }
                                }

                                _ret.push(_item);
                            }
                        }
                        
                    }

                    onCallback();
                }
            });
            
        });

    });
    
    _queue.Run({
        "Callback": function () {
            if (_populateOptions.Callback) {
                _populateOptions.Callback(_ret);
            }
        }
    });

};

CEditorScenarioController.prototype.GetPlatforms = function (options) {
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

CEditorScenarioController.prototype.BindCategoryContent = function (options) {

    options = util_extend({ "Controller": null, "Parent": null, "Element": null, "RefComponentID": enCE.None, "Callback": null }, options);

    var _callback = function () {

        if (options.Callback) {
            options.Callback();
        }
    };

    var _controller = options.Controller;
    var $element = $(options.Element);
    var _componentID = options.RefComponentID;

    APP.Service.Action({
        "c": "PluginEditor", "m": "RenderOptionReferenceComponentView",
        "args": {
            "_EditorGroupID": _controller.Utils.ContextEditorGroupID($element),
            "ComponentID": _componentID
        }
    }, function (renderOption) {

        renderOption = (renderOption || {});

        var PREFIX_ATTR_NAME = "data-attr-ref-item-";

        var _data = (renderOption[enColCRefComponentRenderOptionProperty.Data] || {});
        var _propTitle = util_forceString(renderOption[enColCRefComponentRenderOptionProperty.PropertyTitle]);
        var _propDescription = util_forceString(renderOption[enColCRefComponentRenderOptionProperty.PropertyDescription]);

        var _html = "<div class='EditorScenarioCategoryRefComponentContent'>";

        if (_propTitle == "") {
            _html += util_htmlEncode(MSG_CONFIG.UnauthorizedAccess);
        }
        else {
            var _list = (_data[enColCEntityModificationListProperty.List] || []);

            if (_list.length == 0) {
                _html += util_htmlEncode(MSG_CONFIG.ListNoRecords);
            }
            else {

                var _arrAttribute = (renderOption[enColCRefComponentRenderOptionProperty.PropertyDataAttributeList] || []);
                var _fnGetItemHTML = null;

                if (renderOption[enColCRefComponentRenderOptionProperty.IsButtonFormat] == true) {
                    _fnGetItemHTML = function (item) {

                        var _attributes = {};

                        _attributes["data-inline"] = "false";
                        _attributes["data-icon"] = "arrow-r";
                        _attributes["data-iconpos"] = "right";
                        _attributes["data-corners"] = "false";

                        return _controller.Utils.HTML.GetButton({
                            "Content": item[_propTitle],
                            "CssClass": "ButtonTheme",
                            "IsClickable": false, "IsDisabled": true,
                            "Attributes": _attributes
                        });
                    };
                }
                else {
                    _fnGetItemHTML = function (item) {

                        var _itemHTML = "";
                        var _title = util_forceString(item[_propTitle]);
                        
                        _itemHTML += "<div class='Label'>" + util_htmlEncode(_title) + "</div>";

                        return _itemHTML;
                    };
                }

                for (var i = 0; i < _list.length; i++) {
                    var _item = _list[i];
                    var _attrs = "";

                    for (var a = 0; a < _arrAttribute.length; a++) {
                        var _attrName = _arrAttribute[a];

                        _attrs += (a > 0 ? " " : "") + util_htmlAttribute(PREFIX_ATTR_NAME + _attrName, _item[_attrName], null, true);
                    }

                    _html += "<div class='LinkClickable EditorScenarioCategoryRefComponentDetail'" + (_attrs != "" ? " " + _attrs : "") + ">" +
                             _fnGetItemHTML(_item) +
                             (_propDescription != "" ?
                              "<div class='Description'>" + 
                              util_htmlEncode(_item[_propDescription], true) + "<div class='ViewOverflowFadeOut' />" +
                              "</div>" : "") +
                             "</div>";
                }
            }
        }

        _html += "</div>";

        $element.data("DataItem", renderOption);

        if (!$element.data("is-init")) {
            $element.data("is-init", true);

            $element.off("click.loadRefComponent");
            $element.on("click.loadRefComponent", ".EditorScenarioCategoryRefComponentDetail.LinkClickable:not(.LinkDisabled)", function (e, args) {

                var $this = $(this);
                var _renderOption = ($element.data("DataItem") || {});
                var _args = {
                    "IsDisableTransition": true,
                    "ClassificationID": _controller.Utils.ContextEditorGroupClassificationID($element),
                    "PlatformID": _controller.Utils.ContextEditorGroupPlatformID($element),
                    "ComponentID": util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-category-ref-component-id"), enCE.None),
                    "RenderArguments": {}
                };

                var _arrAttribute = (_renderOption[enColCRefComponentRenderOptionProperty.PropertyDataAttributeList] || []);

                for (var a = 0; a < _arrAttribute.length; a++) {
                    var _attrName = _arrAttribute[a];

                    _args.RenderArguments[_attrName] = $this.attr(PREFIX_ATTR_NAME + _attrName);
                }

                $this.trigger("events.homeview_loadComponentView", _args);
                
            }); //end: click.loadRefComponent
        }

        $element.hide()
                .html(_html);

        $mobileUtil.refresh($element);

        $element.toggle("height");

        _callback();

    });

};  //end: BindCategoryContent

//SECTION START: project specific support

CEditorScenarioController.prototype.ScenarioRenderOptions = function(options) {
};

CEditorScenarioController.prototype.AdminEditDataEvents = function (options) {
};

CEditorScenarioController.prototype.ProjectOnGetFilters = function (options) {

    if (options.Callback) {
        options.Callback(null);
    }
};

CEditorScenarioController.prototype.ProjectOnGetSituationList = function (options) {

    options = util_extend({ "IsEditMode": false, "FilterSelections": null, "Params": null, "Callback": null, "FailureFn": null }, options);

    APP.Service.Action({ "c": "PluginEditor", "m": "EditorSituationGetByForeignKey", "args": options.Params }, options.Callback, options.FailureFn);
};

//SECTION END: project specific support

RENDERER_LOOKUP["pluginEditor_platformIconsView"] = function (context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_platformIconsView");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.is("is-init")) {

            $element.is("is-init", true);

            $element.addClass("EditorPlatformIcons");

            $element.off("events.platformIcons_bind");
            $element.on("events.platformIcons_bind", function (e, args) {

                args = util_extend({ "RationalePlatformList": null }, args);

                var _dataList = (args.RationalePlatformList || []);
                var _selector = "";

                for (var i = 0; i < _dataList.length; i++) {
                    var _rationalePlatform = _dataList[i];
                    var _platformID = _rationalePlatform[enColEditorRationalePlatformProperty.PlatformID];

                    _selector += (i > 0 ? ", " : "") + "[" + util_htmlAttribute("data-attr-platform-icon-id", _platformID) + "]";
                }

                var $icons = $element.find(".EditorPlatformIcon");

                $icons.addClass("OffState")
                      .filter(_selector)
                      .removeClass("OffState");

            }); //end: events.platformIcons_bind

        }
    });
};

RENDERER_LOOKUP["pluginEditor_scenarioView"] = function (context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_scenarioView");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.is("is-init")) {

            $element.is("is-init", true);

            var _data = util_extend({ "Categories": [], "Sections": [], "Groups": [] }, $element.data("RenderData"));
            
            _data.Categories = (_data.Categories || []);
            _data.Sections = (_data.Sections || []);
            _data.Groups = (_data.Groups || []);

            var _isLegend = (util_forceInt($element.attr("data-attr-view-is-legend-mode"), enCETriState.None) == enCETriState.Yes);
            var _html = "";

            var _placeholderTextHTML = null;

            for (var c = 0; c < _data.Categories.length; c++) {
                var _scenarioCategory = _data.Categories[c];
                var _categoryID = _scenarioCategory[enColEditorScenarioCategoryProperty.CategoryID];
                var _hasRefComponent = (!_isLegend && util_forceInt(_scenarioCategory[enColEditorScenarioCategoryProperty.ReferenceComponentID], enCE.None) != enCE.None);

                _html += "<div class='EditorScenarioCategory" + (_isLegend ? " Disabled" : "") + "' " + util_htmlAttribute("data-attr-category-id", _categoryID) +
                         (_hasRefComponent ? 
                          " " +  util_htmlAttribute("data-attr-category-ref-component-id", _scenarioCategory[enColEditorScenarioCategoryProperty.ReferenceComponentID]) :
                          ""
                         ) +
                         ">" +
                         "  <div class='Title'>" + util_htmlEncode(_scenarioCategory[enColEditorScenarioCategoryProperty.Name]) + "</div>" +
                         "  <div class='ListView'>";

                var _categoryGroups = util_arrFilter(_data.Groups, enColEditorScenarioGroupProperty.CategoryID, _categoryID);

                if (_hasRefComponent) {
                    _html += "<div class='ProgressBar'>" +
                             "  <div class='ModeIndeterminate' />" +
                             "</div>";
                }

                for (var g = 0; g < _categoryGroups.length; g++) {
                    var _scenarioGroup = _categoryGroups[g];
                    var _groupID = _scenarioGroup[enColEditorScenarioGroupProperty.GroupID];

                    _html += "<div class='PluginEditorCardView EditorScenarioGroup LinkClickable' " + util_htmlAttribute("data-attr-group-id", _groupID) + ">" +
                             "  <div class='Title'>" + util_htmlEncode(_scenarioGroup[enColEditorScenarioGroupProperty.Name]) + "</div>";

                    //description
                    _html += "  <div class='Description'>";

                    if (_placeholderTextHTML == null) {
                        _placeholderTextHTML = "";

                        for (var p = 0; p < 4; p++) {
                            _placeholderTextHTML += "<div class='Placeholder TextLine_" + (p + 1) + "' />";
                        }
                    }

                    _html += _placeholderTextHTML;

                    _html += "  </div>";    //close description tag

                    _html += "</div>";
                }

                _html += "  </div>" +
                         "</div>";
            }

            $element.addClass("DisableUserSelectable EditorScenarioLayoutView")
                    .toggleClass("LegendLayout", _isLegend);

            $element.html(_html)
                    .trigger("create");

            $element.off("events.scenarioView_selected");
            $element.on("events.scenarioView_selected", function (e, args) {

                if (_isLegend) {

                    args = util_extend({ "CategoryID": enCE.None, "GroupID": enCE.None }, args);

                    var _selectedCategoryID = util_forceInt(args.CategoryID, enCE.None);
                    var _selectedGroupID = util_forceInt(args.GroupID, enCE.None);

                    var _search = util_arrFilter(_data.Categories, enColEditorScenarioCategoryProperty.CategoryID, _selectedCategoryID, true);

                    if (_search.length == 0 && _data.Categories.length > 0) {
                        _search = _data.Categories[0];

                        _selectedCategoryID = _search[enColEditorScenarioCategoryProperty.CategoryID];
                    }

                    var $categories = $element.children(".EditorScenarioCategory");
                    var $current = $categories.filter("[" + util_htmlAttribute("data-attr-category-id", _selectedCategoryID) + "]");

                    $categories.addClass("Disabled");
                    $current.removeClass("Disabled");

                    $element.find(".Selected.EditorScenarioGroup")
                            .removeClass("LinkDisabled Selected");

                    $current.find(".EditorScenarioGroup[" + util_htmlAttribute("data-attr-group-id", _selectedGroupID) + "]")
                            .addClass("LinkDisabled Selected");

                }

            }); //end: events.scenarioView_selected

            $element.off("events.scenarioView_bind");
            $element.on("events.scenarioView_bind", function (e, args) {

                args = util_extend({ "Controller": null, "Callback": null, "Data": [] }, args);

                var _controller = args.Controller;
                var _callback = function () {
                    if (args.Callback) {
                        args.Callback();
                    }
                };

                var $groups = $element.find(".EditorScenarioGroup");

                var _list = (args.Data || []);

                $.each($groups, function () {
                    var $this = $(this);
                    var _groupID = util_forceInt($this.attr("data-attr-group-id"), enCE.None);
                    var _itemHTML = null;

                    var _scenarioGroup = util_arrFilter(_list, enColEditorScenarioGroupContentProperty.ScenarioGroupID, _groupID, true);

                    if (_scenarioGroup.length == 1) {
                        _scenarioGroup = _scenarioGroup[0];
                        _itemHTML = _scenarioGroup[enColEditorScenarioGroupContentProperty.ContentHTML];
                    }

                    _controller.Utils.SetElementHTML($this.children(".Description"), _itemHTML);
                });

                var $categories = $element.find(".EditorScenarioCategory[data-attr-category-ref-component-id]");
                var _queue = new CEventQueue();

                $.each($categories, function () {

                    var $category = $(this);

                    _queue.Add(function (onLoadCallback) {

                        _controller.BindCategoryContent({
                            "Controller": _controller, "Parent": $category, "Element": $category.children(".ListView"),
                            "RefComponentID": util_forceInt($category.attr("data-attr-category-ref-component-id"), enCE.None),
                            "Callback": onLoadCallback
                        });

                    });

                });
                
                _queue.Run({ "Callback": _callback });

            }); //end: events.scenarioView_bind

            $element.off("click.viewGroup");
            $element.on("click.viewGroup", ".EditorScenarioGroup:not(.LinkDisabled)", function (e, args) {

                var $this = $(this);

                if (!$element.data("is-busy")) {

                    $element.data("is-busy", true);

                    var _groupID = util_forceInt($this.attr("data-attr-group-id"), enCE.None);
                    var _categoryID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-category-id"), enCE.None);

                    if (!_isLegend) {
                        var $parent = $this.closest(".EditorEmbeddedView");
                        var $detail = $parent.siblings(".EditorEmbeddedView[data-attr-view-mode='detail']");

                        var $targetSituation = $(e.target).closest(".EditorScenarioGroup, .EditorGroupSituationLink");
                        var _focusSituationID = util_forceInt($targetSituation.attr("data-attr-view-situation-id"), enCE.None);

                        $parent.removeClass("ActiveView");
                        $detail.addClass("ActiveView");

                        $parent.addClass("EffectBlur")
                               .slideUp("normal", function () {
                                   $parent.removeClass("EffectBlur");
                                   $element.data("is-busy", false);
                               });

                        $detail.hide().slideDown("normal", function () {

                            $detail.trigger("events.bind", {
                                "CategoryID": _categoryID,
                                "GroupID": _groupID,
                                "Trigger": $this,
                                "IsCached": true,
                                "Callback": function () {

                                    //bind the uncached version
                                    $detail.trigger("events.bind", {
                                        "CategoryID": _categoryID,
                                        "GroupID": _groupID,
                                        "FocusSituationID": _focusSituationID,
                                        "Trigger": $this
                                    });

                                }
                                
                            });

                        });
                    }
                    else {

                        var _onClick = $element.data("OnGroupItemClick");
                        var _fn = function () {
                            $element.removeData("is-busy");
                        };

                        if (_onClick && util_isFunction(_onClick)) {
                            _onClick({ "Container": $element, "Element": $this, "CategoryID": _categoryID, "GroupID": _groupID, "Callback": _fn });
                        }
                        else {
                            _fn();
                        }
                    }
                }

            }); //end: click.viewGroup

            $element.off("events.getScenarioGroupHoverDetail");
            $element.on("events.getScenarioGroupHoverDetail", ".EditorScenarioGroup", function (e, args) {

                var $this = $(this);
                var $vwHover = $this.children(".HoverDetails");

                var _result = $this.data("cached-hover-editor-situation-item");

                var _callback = function () {

                    if (args.Callback) {
                        args.Callback(_result);
                    }
                };

                args = util_extend({ "Callback": null }, args);

                var _controller = $element.closest("[" + util_renderAttribute("pluginEditor_viewController") + "]")
                                          .data("editor-view-controller");

                var _modificationKey = util_forceString($this.attr("data-attr-list-modification-key"));

                APP.Service.Action({
                    "_indicators": false,
                    "c": "PluginEditor", "m": "EditorSituationModificationVerifiedList",
                    "args": {
                        "_EditorGroupID": _controller.Utils.ContextEditorGroupID($element),
                        "ScenarioGroupID": util_forceInt($this.attr("data-attr-group-id"), enCE.None),
                        "ModificationKey": _modificationKey
                    }
                }, function (scenarioGroupData) {

                    scenarioGroupData = (scenarioGroupData || {});

                    if (_modificationKey != scenarioGroupData[enColCEntityModificationListProperty.ModificationKey]) {
                        _result = scenarioGroupData;

                        //cache the results and current modification key
                        $this.data("cached-hover-editor-situation-item", _result)
                             .attr("data-attr-list-modification-key", scenarioGroupData[enColCEntityModificationListProperty.ModificationKey]);

                    }
                    
                    _callback();
                });
                
            }); //end: events.getScenarioGroupHoverDetail

            if (!_isLegend) {

                $element.off("mouseenter.viewGroup");
                $element.on("mouseenter.viewGroup", ".EditorScenarioGroup:not(.LinkDisabled)", function (e, args) {

                    var $this = $(this);
                    var $vwHover = $this.children(".HoverDetails");
                    var $description = $this.children(".Description");

                    if ($vwHover.length == 0) {
                        $vwHover = $("<div class='HoverDetails' />");
                        $this.append($vwHover);
                    }

                    $vwHover.css("min-height", null)
                            .attr("data-attr-min-height", $description.outerHeight())
                            .html("<div class='ProgressBar'>" +
                                  "   <div class='ModeIndeterminate' />" +
                                  "</div>");

                    $this.addClass("EditorHoverOn Loading");

                    setTimeout(function () {

                        $this.trigger("events.getScenarioGroupHoverDetail", {
                            "Callback": function (scenarioGroupData) {

                                if ($this.hasClass("EditorHoverOn")) {
                                    scenarioGroupData = (scenarioGroupData || {});

                                    var _html = "<div>";
                                    var _situationList = (scenarioGroupData[enColCEntityModificationListProperty.List] || []);

                                    for (var i = 0; i < _situationList.length; i++) {
                                        var _situation = _situationList[i];

                                        _html += "<div class='LinkClickable EditorGroupSituationLink' " +
                                                 util_htmlAttribute("data-attr-view-situation-id", _situation[enColEditorSituationProperty.SituationID]) + ">" +
                                                 "  <div class='Label'>" +
                                                 util_htmlEncode(_situation[enColEditorSituationProperty.Name]) +
                                                 "  </div>" +
                                                 "</div>";
                                    }

                                    _html += "</div>";

                                    $this.removeClass("Loading");

                                    var $temp = $(_html);

                                    $temp.hide();

                                    $vwHover.append($temp)
                                            .trigger("create");

                                    $vwHover.children(".ProgressBar").fadeOut("normal");

                                    $temp.slideDown("normal");
                                }

                            }
                        });

                    }, 250);

                }); //end: mouseenter.viewGroup

                $element.off("mouseleave.viewGroup");
                $element.on("mouseleave.viewGroup", ".EditorScenarioGroup.EditorHoverOn:not(.LinkDisabled)", function (e, args) {

                    var $this = $(this);

                    $this.removeClass("EditorHoverOn");

                }); //end: mouseleave.viewGroup
            }

            $element.off("events.scenarioView_setEditable");
            $element.on("events.scenarioView_setEditable", function (e, args) {

                args = util_extend({ "IsEditable": true }, args);

                var $list = $element.find(".EditorScenarioGroup.LinkClickable:not(.Selected)[data-attr-group-id]");

                $list.toggleClass("LinkDisabled", args.IsEditable);

            });

            $element.trigger("events.scenarioView_selected", { "IsInit": true });
        }
    });
};

RENDERER_LOOKUP["pluginEditor_situationListView"] = function (context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "pluginEditor_situationListView");

    var ACCESS_DENIED_PLACEHOLDER_HTML = "<div class='DisableDragElement LinkDisabled Title'>" +
                                         "  <div class='Label'>" +
                                         "      <div class='Prefix'>&nbsp;</div>" +
                                         "  </div>" +
                                         "</div>" +
                                         "<div class='EditorCollapseContent'>" + util_htmlEncode("You are not authorized to access the Case Study.") + "</div>";

    var _fnGetRenderOptions = function ($element, controller) {

        var _ret = {
            "IsEditMode": controller.Utils.IsEditMode($element),
            "LookupPlatformAccess": null,
            "LookupRationale": null,

            "Init": function () {

                if (this.IsEditMode) {
                    this.LookupPlatformAccess = ($element.data("LookupPlatformAccess") || {});
                    this.LookupRationale = ($element.data("DataLookupRationale") || {});
                }
            },

            "HasAccessSituationRationale": function (situationRationale) {

                var _hasAccess = false;

                if (situationRationale) {
                    var _rationaleID = situationRationale[enColEditorSituationRationaleProperty.RationaleID];
                    var _rationale = this.LookupRationale[_rationaleID];

                    if (_rationale) {

                        //verify user access to the rationale (based on associated platforms)
                        var _rationalePlatforms = (_rationale[enColCEEditorRationaleProperty.RationalePlatforms] || []);

                        for (var rp = 0; rp < _rationalePlatforms.length; rp++) {
                            var _rationalePlatform = _rationalePlatforms[rp];
                            var _platformID = _rationalePlatform[enColEditorRationalePlatformProperty.PlatformID];

                            if (this.LookupPlatformAccess[_platformID]) {
                                _hasAccess = true;
                                break;
                            }
                        }
                    }
                }

                return _hasAccess;
            }

        };

        _ret.Init();

        return _ret;

    };  //end: _fnGetRenderOptions

    var _fnGetType = function ($obj) {
        var _type = null;

        if ($obj.is(".EditorSituationDetail")) {
            _type = "situation";
        }
        else if ($obj.is(".EditorSituationRationaleDetail")) {
            _type = "rationale";
        }

        return _type;

    };  //end: _fnGetType

    var _fnGetEditorID = function (prefix, id, parent) {

        var _editorID = prefix + "_";

        if (id == enCE.None) {

            if (parent) {
                var $parent = $(parent);
                var _tempID = util_forceInt($parent.data("editor-current-temp-id"), 0);

                $parent.data("editor-current-temp-id", ++_tempID);

                _editorID += "temp" + _tempID;
            }
            else {
                _editorID = renderer_uniqueID();    //override with custom unique ID
            }
        }
        else {
            _editorID += id;
        }

        return _editorID;

    };  //end: _fnGetEditorID

    var _fnGetSituationRationaleDetailHTML = function (controller, situationRationale, parent, renderOptions) {

        var _html = "";

        var _rationaleID = situationRationale[enColEditorSituationRationaleProperty.RationaleID];
        var _editorID = _fnGetEditorID("rationale", _rationaleID, parent);
        var _hasAccess = false;

        if (renderOptions) {
            if (renderOptions["IsEditMode"]) {
                _hasAccess = renderOptions.HasAccessSituationRationale(situationRationale);
            }
            else {
                _hasAccess = true;
            }
        }
        else {
            _hasAccess = (util_forceInt(_rationaleID, enCE.None) == enCE.None); //if a new situation rationale is being added, then allow access
        }

        _html += "<div class='PluginEditorCardView EditorEntityItem EditorSituationEntityBase EditorSituationRationaleDetail" + (!_hasAccess ? " PermissionNoAccessItem" : "") + "' " +
                 util_htmlAttribute("data-attr-rationale-id", _rationaleID) + ">";

        if (_hasAccess) {

            _html += "   <div class='DisableDragElement LinkClickable Title'>" +    //start title tag
                     "       <div class='Label'>" +
                     "<span class='Prefix'>" + util_htmlEncode("Case Study – ") + "</span>" +
                     "<span class='Name'>" + util_htmlEncode(situationRationale[enColEditorSituationRationaleProperty.RationaleIDName]) + "</span>" +
                     "       </div>" +
                     "       <div " + util_renderAttribute("pluginEditor_platformIconsView") + ">" + controller.PlatformIconsHTML + "</div>" +
                     "       <div class='HiddenDragElement EditorCollapseToggleButton'>" +
                     controller.Utils.HTML.GetButton({
                         "Attributes": {
                             "data-icon": "arrow-u", "data-iconpos": "notext"
                         }
                     }) +
                     "       </div>" +
                     "   </div>";   //end title tag

            _html += "   <div class='EditorCollapseContent'>" + //start collapse content tag
                     "      <div class='ModeToggleEntityView'>" +
                     "          <div class='Label'>" + util_htmlEncode("Associate Case Study with the following Platform(s):") + "</div>" +
                     "          <div class='DisableDragElement ViewPlatformToggles' " +
                     util_htmlAttribute("data-attr-rationale-prop", enColCEEditorRationaleProperty.RationalePlatforms) + " />";

            var _arrRenderProp = controller.Data.LookupRenderPropList["RationaleEditDetail"];

            if (!_arrRenderProp) {
                _arrRenderProp = [];

                controller.ScenarioRenderOptions({
                    "Type": "RationaleDetails", "RenderProperties": _arrRenderProp,
                    "AttributeInputElement": util_htmlAttribute("data-attr-input-element", enCETriState.Yes)
                });

                controller.Data.LookupRenderPropList["RationaleEditDetail"] = _arrRenderProp;
            }

            for (var p = 0; p < _arrRenderProp.length; p++) {
                var _prop = _arrRenderProp[p];
                var _isRequired = util_forceBool(_prop["req"], false);

                var _attrs = util_htmlAttribute("data-attr-prop", _prop.p);
                var _inputHTML = _prop["html"];

                if (!_inputHTML) {
                    _inputHTML = "<input type='text' data-mini='true' data-corners='false' " + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + " " +
                                 util_htmlAttribute("placeholder", util_forceString(_prop["placeholder"]), null, true) + " />";
                }

                _html += util_forceString(_inputHTML);
            }

            _html += "      </div>" +
                     controller.GetEditorHTML({ "ID": _editorID, "ContentType": enCEditorScenarioContentRendererType.Rationale }) +
                     "   </div>";   //end collapse content tag
        }
        else {
            _html += ACCESS_DENIED_PLACEHOLDER_HTML;
        }

        _html += "</div>";

        return _html;

    };  //end: _fnGetSituationRationaleDetailHTML

    var _fnGetSituationRationaleListHTML = function (controller, editorSituation, parent, renderOptions) {

        var _html = "";

        var _situationRationaleList = (editorSituation[enColCEEditorSituationProperty.SituationRationales] || []);

        for (var i = 0; i < _situationRationaleList.length; i++) {
            var _situationRationale = _situationRationaleList[i];

            _html += _fnGetSituationRationaleDetailHTML(controller, _situationRationale, parent, renderOptions);
        }

        return _html;

    };  //end: _fnGetSituationRationalteListHTML

    var _fnGetSituationHTML = function (controller, editorSituation, parent, renderOptions) {

        var _ret = "";

        var _situationID = util_forceInt(editorSituation[enColEditorSituationProperty.SituationID], enCE.None);
        var _editorID = _fnGetEditorID("situation", _situationID, parent);

        _ret += "<div class='PluginEditorCardView EditorEntityItem EditorSituationEntityBase EditorSituationDetail' " +
                util_htmlAttribute("data-attr-situation-id", _situationID) + ">" +
                "   <div class='DisableDragElement LinkClickable Title'>" +
                "       <div class='Label'>" + util_htmlEncode(editorSituation[enColEditorSituationProperty.Name]) + "</div>" +
                "       <div class='HiddenDragElement EditorCollapseToggleButton'>" +
                controller.Utils.HTML.GetButton({ "Attributes": { "data-icon": "arrow-u", "data-iconpos": "notext" } }) +
                "       </div>" +
                "   </div>" +
                "   <div class='EditorCollapseContent'>";

        _ret += controller.GetEditorHTML({ "ID": _editorID, "ContentType": enCEditorScenarioContentRendererType.Situation });
        _ret += "<div class='EditorElementPlaceholderOn EditorDraggableContainer EditorRationaleListView'>" +
                _fnGetSituationRationaleListHTML(controller, editorSituation, parent, renderOptions) +
                "</div>";

        _ret += "   </div>" +
                "</div>";

        return _ret;

    };  //end: _fnGetSituationHTML

    $.each($list, function () {
        var $element = $(this);

        if (!$element.is("is-init")) {

            $element.is("is-init", true);

            $element.off("events.situationList_bind");
            $element.on("events.situationList_bind", function (e, args) {

                args = util_extend({
                    "Controller": null, "Callback": null, "IsInit": false, "ReloadSituationID": enCE.None, "ReloadRationaleID": enCE.None, "FocusSituationID": enCE.None
                }, args);

                var _onBindCallback = function () {

                    var $focusSituation = null;

                    if (args.FocusSituationID != enCE.None) {
                        $focusSituation = $element.find(".EditorSituationDetail[" + util_htmlAttribute("data-attr-situation-id", args.FocusSituationID) + "]");
                    }
                    
                    if ($focusSituation != null && $focusSituation.length == 1) {
                        $mobileUtil.AnimateSmoothScroll(null, 750, { "Top": $focusSituation.offset().top }, args.Callback);
                    }
                    else if (args.Callback) {
                        args.Callback();
                    }

                };  //end: _onBindCallback

                var _isPartialReload = (args.ReloadSituationID != enCE.None || args.ReloadRationaleID != enCE.None);

                var _controller = args.Controller;
                var _platforms = null;
                var _fnGetList = function (loadCallback) {

                    $element.trigger("events.getComponentUserPermission", {
                        "Callback": function (permSummary) {

                            var _canAdmin = (permSummary["CanAdmin"] == true);

                            if (!_isPartialReload) {
                                var _html = "";

                                if (_canAdmin) {
                                    _html += "<div class='EditorInlineHeaderView ModeToggleEdit'>" +
                                             _controller.Utils.HTML.GetButton({
                                                 "ActionButtonID": "add_situation",
                                                 "Content": "Add Scenario", "Attributes": { "data-icon": "plus" }
                                             }) +
                                             "</div>";
                                }

                                _html += "<div class='EditorDraggableContainer EditorSituationListView' />";

                                $element.html(_html);
                                $mobileUtil.refresh($element);
                            }

                            $element.trigger("events.getLayoutManager", {
                                "Callback": function (layoutManager) {

                                    var _filterSelections = layoutManager.FilterSelections();
                                    var _isEditMode = _controller.Utils.IsEditMode($element);
                                    var _permission = (permSummary ? permSummary["Permission"] : null);
                                    var _params = {};

                                    _params["_EditorGroupID"] = _controller.Utils.ContextEditorGroupID($element);
                                    _params["ScenarioGroupID"] = util_forceInt($mobileUtil.GetClosestAttributeValue($element, "data-attr-current-scenario-group-id"), enCE.None);
                                    _params["PlatformID"] = (_isEditMode ? enCE.None : _filterSelections.GetFilterID("platform"));
                                    _params["DeepLoad"] = true;

                                    if (_isPartialReload) {
                                        _params["SituationID"] = args.ReloadSituationID;
                                        _params["RationaleID"] = args.ReloadRationaleID;
                                    }

                                    _controller.ProjectOnGetSituationList({
                                        "IsEditMode": _isEditMode,
                                        "FilterSelections": _filterSelections,
                                        "Params": _params,
                                        "Callback": function (situationData) {

                                            var _html = "";
                                            var _editorSituationList = (situationData ? situationData.List : null);
                                            var $vw = $element.children(".EditorSituationListView");

                                            _editorSituationList = (_editorSituationList || []);

                                            if (!_isPartialReload) {
                                                $element.trigger("events.situationList_initSortable", { "Controller": _controller });

                                                $element.data("DataList", _editorSituationList);    //persist the editor situation list
                                                
                                                _controller.PlatformIconsHTML = "";

                                                for (var p = 0; p < _platforms.length; p++) {
                                                    var _platform = _platforms[p];
                                                    var _platformID = _platform[enColPlatformProperty.PlatformID];
                                                    var _name = _controller.PluginInstance.Utils.ForceEntityDisplayName({
                                                        "Type": "Platform", "Item": _platform
                                                    });

                                                    _controller.PlatformIconsHTML += "<div class='EditorPlatformIcon " + "EditorPlatformIcon_" + _platformID + " OffState' " +
                                                                                     util_htmlAttribute("data-attr-platform-icon-id", _platformID) + " " +
                                                                                     util_htmlAttribute("title", _name, null, true) + ">" +
                                                                                     "   <div>" + util_htmlEncode(_platform[enColPlatformProperty.IconHTML]) + "</div>" +
                                                                                     "</div>";
                                                }

                                                //configure the rationale lookup (prior to binding the situation HTML list)
                                                var _lookupRationale = {};

                                                for (var s = 0; s < _editorSituationList.length; s++) {
                                                    var _situation = _editorSituationList[s];
                                                    var _rationaleList = (_situation[enColCEEditorSituationProperty.RationaleList] || []);

                                                    for (var r = 0; r < _rationaleList.length; r++) {
                                                        var _rationale = _rationaleList[r];
                                                        var _rationaleID = _rationale[enColEditorRationaleProperty.RationaleID];

                                                        _lookupRationale[_rationaleID] = _rationale;
                                                    }

                                                    //clear the rationale list from the item
                                                    _situation[enColCEEditorSituationProperty.RationaleList] = null;
                                                }

                                                $element.data("DataLookupRationale", _lookupRationale);

                                                var _renderOpts = _fnGetRenderOptions($element, _controller);

                                                //TODO: interval based render required
                                                for (var i = 0; i < _editorSituationList.length; i++) {
                                                    _html += _fnGetSituationHTML(_controller, _editorSituationList[i], $element, _renderOpts);
                                                }

                                                $vw.html(_html);
                                                $mobileUtil.refresh($vw);

                                                var $editors = $vw.find("[" + util_renderAttribute("pluginEditor_content") + "]" +
                                                                        "[" + util_htmlAttribute("data-attr-editor-scenario-content-type",
                                                                                                 enCEditorScenarioContentRendererType.Situation) + "]");
                                                
                                                $.each($editors, function (index) {

                                                    var _situation = _editorSituationList[index];

                                                    _controller.SetEditorContent({
                                                        "Element": this,
                                                        "HTML": _situation[enColEditorSituationProperty.ContentHTML]
                                                    });
                                                    
                                                });

                                                //rationale list
                                                var $rationales = $vw.find(".EditorSituationRationaleDetail");
                                                
                                                $.each($rationales, function (index) {

                                                    var $rationale = $(this);
                                                    var _rationaleID = util_forceInt($rationale.attr("data-attr-rationale-id"), enCE.None);
                                                    var _rationale = (_lookupRationale[_rationaleID] || {});

                                                    $rationale.trigger("events.situationList_rebindDetailView", { "Controller": _controller, "Item": _rationale });
                                                });
                                                
                                                if (_renderOpts.IsEditMode) {
                                                    $element.trigger("events.situationList_toggleEditMode", {
                                                        "Controller": _controller, "Callback": _onBindCallback,
                                                        "ToggleDraggableOnView": true
                                                    });
                                                }
                                                else {
                                                    _onBindCallback();
                                                }

                                            }
                                            else {

                                                var _paramsSetDataItem = {
                                                    "Callback": _onBindCallback
                                                };

                                                var $ctx = $element;

                                                if (args.ReloadRationaleID != enCE.None) {

                                                    var _situation = util_arrFilter(_editorSituationList, enColEditorSituationProperty.SituationID, args.ReloadSituationID, true);

                                                    _situation = (_situation.length == 1 ? _situation[0] : {});

                                                    _paramsSetDataItem["RationaleItemList"] = util_arrFilter(_situation[enColCEEditorSituationProperty.SituationRationales],
                                                                                                             enColEditorSituationRationaleProperty.RationaleID,
                                                                                                             args.ReloadRationaleID);

                                                    _paramsSetDataItem["SourceRationaleList"] = util_arrFilter(_situation[enColCEEditorSituationProperty.RationaleList],
                                                                                                               enColEditorRationaleProperty.RationaleID,
                                                                                                               args.ReloadRationaleID);

                                                    $ctx = $element.find(".EditorSituationDetail[" + util_htmlAttribute("data-attr-situation-id", args.ReloadSituationID) + "] " +
                                                                         ".EditorRationaleListView");
                                                }
                                                else {
                                                    _paramsSetDataItem["SituationItemList"] = _editorSituationList;
                                                }

                                                $ctx.trigger("events.situationList_setDataItem", _paramsSetDataItem);
                                            }

                                        }
                                    });
                                }
                            });

                        }
                    });

                };  //end: _fnGetList

                if (_isPartialReload) {
                    _fnGetList();
                }
                else if (!$element.data("is-init-data-list") || args.IsInit) {
                    $element.data("is-init-data-list", true);

                    $element.html(_controller.Utils.GetPlaceholderHTML(10));

                    _controller.GetPlatforms({
                        "Callback": function (platforms) {

                            _platforms = (platforms || []);

                            _fnGetList();
                        }
                    });
                }

            }); //end: events.situationList_bind

            $element.off("events.situationList_toggleEditMode");
            $element.on("events.situationList_toggleEditMode", function (e, args) {

                args = util_extend({
                    "Controller": null, "FilteredList": null, "Options": null, "Callback": null, "ToggleDraggableOnView": false, "EntityType": null
                }, args);

                var _callback = function () {

                    if (args.Callback) {
                        args.Callback();
                    }
                };

                var _lookupToolsHTML = {};
                var _dragHandleHTML = null;

                var _fnConfigureEditable = function (obj, btnOptions, fnEditInit, disableDrag, renderType) {

                    var $obj = $(obj);

                    if (!$obj.data("is-mode-init")) {
                        $obj.data("is-mode-init", true)
                            .attr("data-attr-is-mode-init", enCETriState.Yes);

                        if (renderType && !_lookupToolsHTML[renderType]) {
                            btnOptions = util_extend({ "EditActionID": null, "DeleteActionID": null, "CustomHTML": null, "IsDisplayBlock": false }, btnOptions);

                            var _attrRequireLayout = util_htmlAttribute("data-attr-require-layout-manager", enCETriState.Yes);

                            var _toolsHTML = "<div class='HiddenDragElement EditorEntityItemActionButtons" + (btnOptions.IsDisplayBlock ? " EditorEntityItemActionBlock" : "") +
                                             " ModeToggleEdit '>" +
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

                            _lookupToolsHTML[renderType] = _toolsHTML;
                        }

                        if (!disableDrag) {

                            if (!_dragHandleHTML) {
                                _dragHandleHTML = "<div class='ModeToggleEdit IndicatorDraggable'>" +
                                                  "   <img alt='' " + util_htmlAttribute("src", "<SITE_URL><IMAGE_SKIN_PATH>buttons/btn_drag.png") + " />" +
                                                  "</div>";
                            }

                            $obj.prepend(_dragHandleHTML);
                        }

                        if (fnEditInit) {
                            fnEditInit(_lookupToolsHTML[renderType]);
                        }

                        $obj.trigger("create");
                    }

                };  //end: _fnConfigureEditable

                var $details = null;
                var _isRationaleMode = (args.EntityType == "rationale");

                if (args.FilteredList) {
                    $details = $(args.FilteredList).filter((_isRationaleMode ? ".EditorSituationRationaleDetail" : ".EditorSituationDetail") + ":not([data-attr-is-mode-init])");

                    if (_isRationaleMode) {
                        $details = $details.closest(".EditorSituationDetail");
                    }
                }
                else {
                    $details = $element.find(".EditorSituationDetail:not([data-attr-is-mode-init])");
                }

                var _customToolHTML = null;

                _customToolHTML = "<a data-attr-editor-controller-action-btn='add_situation_case_study' class='DisableDragElement LinkClickable' data-role='button' " +
                                  "data-icon='plus' data-mini='true' data-inline='true' data-theme='transparent' " +
                                  util_htmlAttribute("data-attr-require-layout-manager", enCETriState.Yes) + ">" +
                                  util_htmlEncode("Add Case Study") + "</a>";

                $.each($details, function () {
                    var $this = $(this);
                    var $vwRationaleList = $this.find(".EditorRationaleListView");

                    if (!_isRationaleMode) {
                        _fnConfigureEditable($this, { "EditActionID": "edit_situation", "DeleteActionID": "delete_situation", "CustomHTML": _customToolHTML }, function (toolsHTML) {

                            $vwRationaleList.trigger("events.situationList_initSortable", { "Controller": args.Controller });
                            $vwRationaleList.toggleClass("EditorDraggableOn", args.ToggleDraggableOnView);

                            $(toolsHTML).insertBefore($this.children(".EditorCollapseContent"));
                        }, null, "situation");
                    }

                    var $filteredRationaleDetails = $vwRationaleList.find(".EditorSituationRationaleDetail:not(.PermissionNoAccessItem):not([data-attr-is-mode-init])");

                    $.each($filteredRationaleDetails, function () {
                        var $rationale = $(this);

                        _fnConfigureEditable($rationale, { "EditActionID": "edit_rationale", "DeleteActionID": "delete_rationale" }, function (toolsHTML) {

                            $(toolsHTML).insertBefore($rationale.children(".EditorCollapseContent"));

                        }, null, "rationale");

                    });

                });

                _callback();

            }); //end: events.situationList_toggleEditMode

            $element.off("events.situationList_toggleEditSituation");
            $element.on("events.situationList_toggleEditSituation", ".EditorSituationEntityBase", function (e, args) {

                e.stopPropagation();    //must prevent any parent event handlers of this namespace from executing

                var $detail = $(this);

                args = util_extend({ "Controller": null, "Trigger": null, "Callback": null }, args);

                var _onEditCallback = function () {

                    if (args.Callback) {
                        args.Callback();
                    }
                };

                var _entityMode = {
                    "Type": _fnGetType($detail),
                    "DataCache": {},
                    "EditButtonID": null,
                    "CancelButtonID": null,
                    "SaveButtonID": null,
                    "EditorContentTypeID": enCEditorScenarioContentRendererType.None,
                    "DataAttributeNameProperty": null,
                    "PropertyEntityIdentifier": null,
                    "PropertyName": null
                };

                if (_entityMode.Type == "situation") {

                    _entityMode.EditButtonID = "edit_situation";
                    _entityMode.CancelButtonID = "cancel_situation";
                    _entityMode.SaveButtonID = "save_situation";
                    _entityMode.EditorContentTypeID = enCEditorScenarioContentRendererType.Situation;

                    _entityMode.DataAttributeNameProperty = "data-attr-situation-prop";
                    _entityMode.PropertyName = enColEditorSituationProperty.Name;
                    _entityMode.PropertyEntityIdentifier = enColEditorSituationProperty.SituationID;
                }
                else if (_entityMode.Type == "rationale") {

                    _entityMode.EditButtonID = "edit_rationale";
                    _entityMode.CancelButtonID = "cancel_rationale";
                    _entityMode.SaveButtonID = "save_rationale";
                    _entityMode.EditorContentTypeID = enCEditorScenarioContentRendererType.Rationale;

                    _entityMode.DataAttributeNameProperty = "data-attr-rationale-prop";
                    _entityMode.PropertyName = enColEditorSituationRationaleProperty.RationaleIDName;
                    _entityMode.PropertyEntityIdentifier = enColEditorSituationRationaleProperty.RationaleID;
                }

                var $trigger = $(args.Trigger);
                var _controller = args.Controller;
                var _btnID = $trigger.attr("data-attr-editor-controller-action-btn");

                var _isEditItem = (_btnID == _entityMode.EditButtonID);
                var _isRestore = (_btnID == _entityMode.CancelButtonID);
                var _fn = function () {

                    var $clCancel = $detail.find("[" + util_htmlAttribute("data-attr-editor-controller-action-btn", _entityMode.CancelButtonID) + "]");

                    if (_isEditItem && $clCancel.length == 0) {
                        $clCancel = $(_controller.Utils.HTML.GetButton({
                            "Content": "Cancel", "ActionButtonID": _entityMode.CancelButtonID, "Attributes": {
                                "data-icon": "back"
                            }
                        }));

                        $clCancel.insertAfter($trigger);
                        $detail.trigger("create");
                    }

                    $clCancel.toggle(_isEditItem);

                    _controller.Utils.Actions.ButtonUpdate({
                        "Element": $trigger, "ButtonID": (_isEditItem ? _entityMode.SaveButtonID : _entityMode.EditButtonID),
                        "Icon": (_isEditItem ? "check" : "edit"), "Text": (_isEditItem ? "Save" : "Edit")
                    });

                    _onEditCallback();
                };

                var $editor = $detail.find("[" + util_htmlAttribute("data-attr-editor-scenario-content-type", _entityMode.EditorContentTypeID) + "]");

                if (_isEditItem) {

                    $detail.addClass("EditorEntityEditMode");

                    $detail.children(".Title")
                           .addClass("LinkDisabled ElementLinksDisabled");

                    var $title = $detail.children(".Title");

                    if (!$detail.data("data-is-init-edit-mode")) {

                        $detail.data("data-is-init-edit-mode", true);

                        $("<div class='ModeToggleEntityView'>" +
                          " <input type='text' data-mini='true' data-corners='false' " + util_htmlAttribute("placeholder", "Title", null, true) + " " +
                          util_htmlAttribute(_entityMode.DataAttributeNameProperty, _entityMode.PropertyName) + " " + " />" +
                          "</div>").insertAfter($title.children(".Label"))
                                   .trigger("create");

                    }

                    $editor.trigger("events.setEditable", { "IsEditable": true });

                    $detail.trigger("events.situationList_getDataItem", {
                        "Trigger": $detail, "Callback": function (dataItem) {

                            var _queue = new CEventQueue();

                            if (_entityMode.Type == "rationale") {

                                _queue.Add(function (onLoadCallback) {

                                    _controller.GetPlatforms({
                                        "Callback": function (platforms) {
                                            _entityMode.DataCache["Platforms"] = (platforms || []);
                                            onLoadCallback();
                                        }
                                    });

                                });
                            }

                            var _arrCustomEvents = _controller.AdminEditDataEvents({ "Lookup": _entityMode.DataCache, "ViewMode": _entityMode.Type });

                            if (_arrCustomEvents) {
                                for (var i = 0; i < _arrCustomEvents.length; i++) {
                                    _queue.Add(_arrCustomEvents[i]);
                                }
                            }

                            _queue.Add(function (onLoadCallback) {

                                var $props = $detail.find("[" + _entityMode.DataAttributeNameProperty + "]");
                                var _entityID = dataItem[_entityMode.PropertyEntityIdentifier];

                                $.each($props, function () {
                                    var $this = $(this);
                                    var _prop = $this.attr(_entityMode.DataAttributeNameProperty);
                                    var _val = dataItem[_prop];

                                    switch (_prop) {

                                        case enColCEEditorRationaleProperty.RationalePlatforms:

                                            var _populate = { "RationaleID": _entityID, "Result": null };

                                            $element.trigger("events.situationList_getRationaleItemFromLookup", _populate);

                                            var _rationale = (_populate.Result || {});

                                            _val = _rationale[_prop];   //update the value to use the referend rationale item property

                                            var _platformTogglesHTML = _controller.Utils.HTML.PlatformFlipSwitchToggles({
                                                "Controller": _controller, "Platforms": _entityMode.DataCache.Platforms,
                                                "BridgeList": _val, "PropertyBridgePlatformID": enColEditorRationalePlatformProperty.PlatformID
                                            });

                                            $this.html(_platformTogglesHTML);
                                            $mobileUtil.refresh($this);

                                            _controller.Utils.BindFlipSwitchEvents({ "Element": $this });

                                            $this.data("data-source-rationale-platform-list", _val); //persist the source list on element

                                            break;

                                        default:
                                            $this.val(util_forceString(_val));
                                            break;
                                    }
                                });

                                if (_entityMode.Type == "rationale") {
                                    var $customInputs = $detail.find("[" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");

                                    var _populate = { "RationaleID": _entityID, "Result": null };

                                    $element.trigger("events.situationList_getRationaleItemFromLookup", _populate);

                                    var _rationale = (_populate.Result || {});

                                    $.each($customInputs, function () {

                                        var $input = $(this);

                                        if ($input.is(".ViewBridgeListRenderer")) {

                                            var $vwSelection = $input.children("[data-attr-is-view-selection]:first");

                                            if ($vwSelection.length == 0) {
                                                $vwSelection = $("<div data-attr-is-view-selection='1' />");
                                                $input.append($vwSelection);
                                            }

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
                                                "IsDraggable": util_forceInt($input.attr("data-attr-selection-is-draggable"), enCETriState.No)
                                            };

                                            var _bridgeList = _rationale;

                                            for (var ep = 0; ep < _listRenderOpts.PropBridgeList.length && _bridgeList; ep++) {
                                                _bridgeList = _bridgeList[_listRenderOpts.PropBridgeList[ep]];
                                            }

                                            _controller.Utils.BindBridgeListSelectionView({
                                                "Controller": _controller, "Element": $vwSelection, "DefaultLabel": _listRenderOpts.DefaultLabel,
                                                "ItemNotAvailableLabel": _listRenderOpts.ItemNotAvailableLabel,
                                                "Data": _entityMode.DataCache[_listRenderOpts.DataKey],
                                                "PropertyText": _listRenderOpts.PropText, "PropertyID": _listRenderOpts.PropValue,
                                                "BridgeEntityInstance": _listRenderOpts.BridgeEntityInstance,
                                                "BridgeData": _bridgeList, "PropertyBridgeID": _listRenderOpts.PropBridgeID,
                                                "PropertyBridgeItemDisplayOrder": _listRenderOpts.PropBridgeItemDisplayOrder,
                                                "AllowInvalidSelection": (_listRenderOpts.IsAllowInvalidSelection == enCETriState.Yes),
                                                "IsDraggable": (_listRenderOpts.IsDraggable == enCETriState.Yes)
                                            });

                                        }
                                    });
                                }

                                onLoadCallback();

                            });

                            _queue.Run({ "Callback": _fn });

                        }
                    });
                }
                else if (_isRestore) {
                    $detail.trigger("events.situationList_reloadDetailView", { "Controller": _controller });
                }
                else {

                    $detail.trigger("events.situationList_save", {
                        "Controller": args.Controller,
                        "Callback": function (isDismiss) {

                            var $title = $detail.children(".Title");

                            $title.toggleClass("LinkDisabled ElementLinksDisabled", !isDismiss);

                            $detail.toggleClass("EditorEntityEditMode", !isDismiss);

                            if (isDismiss) {

                                $editor.trigger("events.setEditable", { "IsEditable": false });
                                _fn();
                            }
                            else {
                                _onEditCallback();
                            }
                        }
                    });
                }

                return true;   //must prevent any parent event handlers of this namespace from executing

            }); //end: events.situationList_toggleEditSituation

            $element.off("events.situationList_save");
            $element.on("events.situationList_save", ".EditorSituationEntityBase", function (e, args) {

                e.stopPropagation();    //must prevent any parent event handlers of this namespace from executing

                args = util_extend({ "Controller": null, "Callback": null }, args);

                var $this = $(this);

                var _callback = function (isDismiss) {

                    if (args.Callback) {
                        args.Callback(isDismiss);
                    }
                };

                var _controller = args.Controller;

                var _entityMode = {
                    "Type": _fnGetType($this),
                    "EditorContentTypeID": enCEditorScenarioContentRendererType.None,
                    "DataAttributeItemID": null,
                    "DataAttributePropertyName": null,
                    "PropertyTitle": null,
                    "PropertyEntityIdentifier": null,
                    "PropertyHTML": null,
                    "PropertyReferenceList": null,
                    "PropertyBridgeItemDisplayOrder": null,
                    "SaveMethodName": null
                };

                switch (_entityMode.Type) {

                    case "situation":

                        _entityMode.EditorContentTypeID = enCEditorScenarioContentRendererType.Situation;
                        _entityMode.DataAttributeItemID = "data-attr-situation-id";
                        _entityMode.DataAttributePropertyName = "data-attr-situation-prop";

                        _entityMode.PropertyTitle = enColEditorSituationProperty.Name;
                        _entityMode.PropertyEntityIdentifier = enColEditorSituationProperty.SituationID;
                        _entityMode.PropertyReferenceList = enColCEEditorSituationProperty.ReferencedSituations;
                        _entityMode.PropertyBridgeItemDisplayOrder = enColEditorSituationProperty.DisplayOrder;
                        _entityMode.PropertyHTML = enColEditorSituationProperty.ContentHTML;

                        _entityMode.SaveMethodName = "EditorSituationSave";

                        break;  //end: situation

                    case "rationale":

                        _entityMode.EditorContentTypeID = enCEditorScenarioContentRendererType.Rationale;
                        _entityMode.DataAttributeItemID = "data-attr-rationale-id";
                        _entityMode.DataAttributePropertyName = "data-attr-rationale-prop";

                        _entityMode.PropertyTitle = enColEditorSituationRationaleProperty.RationaleIDName;
                        _entityMode.PropertyEntityIdentifier = enColEditorSituationRationaleProperty.RationaleID;
                        _entityMode.PropertyReferenceList = enColCEEditorSituationRationaleProperty.ReferencedRationales;
                        _entityMode.PropertyBridgeItemDisplayOrder = enColEditorSituationRationaleProperty.DisplayOrder;

                        //use embedded property notation
                        _entityMode.PropertyHTML = enColCEEditorSituationRationale_JSONProperty.RationaleItem + "." + enColEditorRationaleProperty.ContentHTML;

                        _entityMode.SaveMethodName = "EditorSituationRationaleSave";

                        break;  //end: rationale
                }

                var _entityItemID = util_forceInt($this.attr(_entityMode.DataAttributeItemID), enCE.None);
                var _isAddNew = (_entityItemID == enCE.None);

                ClearMessages();

                $this.trigger("events.situationList_getDataItem", {
                    "Trigger": $this,
                    "Callback": function (dataItem) {

                        var $editor = $this.find("[" + util_htmlAttribute("data-attr-editor-scenario-content-type", _entityMode.EditorContentTypeID) + "]");

                        var _updates = {};
                        var $refList = null;

                        $.each($this.find("[" + _entityMode.DataAttributePropertyName + "]"), function () {
                            var $this = $(this);
                            var _prop = $this.attr(_entityMode.DataAttributePropertyName);
                            var _val = null;

                            switch (_prop) {

                                case enColCEEditorRationaleProperty.RationalePlatforms:

                                    _val = _controller.Utils.Actions.PopulatePlatformToggleSelections({
                                        "Element": $this,
                                        "BridgeEntityInstance": CEEditorRationalePlatform,
                                        "PropertyBridgePlatformID": enColEditorRationalePlatformProperty.PlatformID,
                                        "SourceBridgePlatformList": ($this.data("data-source-rationale-platform-list") || [])
                                    });

                                    break;

                                default:
                                    _val = util_trim($this.val());
                                    break;
                            }

                            _updates[_prop] = _val;
                        });

                        if (util_forceString(_updates[_entityMode.PropertyTitle]) == "") {
                            AddUserError("Title is required.");
                        }

                        if (_entityMode.Type == "rationale") {
                            var _rationalePlatforms = _updates[enColCEEditorRationaleProperty.RationalePlatforms];

                            if (!_rationalePlatforms || _rationalePlatforms.length == 0) {
                                AddUserError("At least one platform is required for the Case Study.");
                            }

                            //associate the source rationale item to be populated
                            var _populate = { "RationaleID": _entityItemID, "Result": null };

                            $this.trigger("events.situationList_getRationaleItemFromLookup", _populate);

                            var _rationale = _populate.Result;

                            dataItem[enColCEEditorSituationRationale_JSONProperty.RationaleItem] = _rationale;

                            var $customInputs = $this.find("[" + util_htmlAttribute("data-attr-input-element", enCETriState.Yes) + "]");

                            $.each($customInputs, function () {

                                var $input = $(this);

                                if ($input.is(".ViewBridgeListRenderer")) {

                                    var _inputPropName = util_forceString($input.attr("data-attr-selection-bridge-list-prop"));
                                    var _propBridgeList = _inputPropName.split(".");

                                    if (_propBridgeList.length > 0) {

                                        var _current = null;
                                        var _populate = {};

                                        $input.children(".DropdownSelectionView").trigger("events._populate", _populate);

                                        _current = _rationale;

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

                                    var _propConfig = util_arrFilter(_controller.Data.LookupRenderPropList["RationaleEditDetail"], "p", _inputPropName, true);

                                    if (_propConfig.length == 1) {
                                        _propConfig = _propConfig[0];

                                        if (_propConfig["onValidate"] && util_isFunction(_propConfig.onValidate)) {
                                            _propConfig.onValidate({ "Prop": _inputPropName, "Element": $input, "Item": _rationale });
                                        }
                                    }
                                }

                            });
                        }

                        if (MessageCount() != 0) {
                            _callback(false);
                            return;
                        }

                        if (_entityMode.Type == "rationale") {

                            var _rationale = dataItem[enColCEEditorSituationRationale_JSONProperty.RationaleItem];

                            //copy over the populated title/name from the bridge item (i.e. the RationaleIDName property)
                            _rationale[enColEditorRationaleProperty.Name] = _updates[_entityMode.PropertyTitle];

                            //set the rationale platforms list (then remove it from the updates lookup)
                            _rationale[enColCEEditorRationaleProperty.RationalePlatforms] = _updates[enColCEEditorRationaleProperty.RationalePlatforms];

                            delete _updates[enColCEEditorRationaleProperty.RationalePlatforms];
                        }

                        for (var _prop in _updates) {
                            dataItem[_prop] = _updates[_prop];
                        }

                        if (_entityItemID == enCE.None) {

                            //new item being saved, configure defaults

                            if (_entityMode.Type == "situation") {
                                dataItem[enColEditorSituationProperty.ClassificationID] = _controller.Utils.ContextEditorGroupClassificationID($this);
                                dataItem[enColEditorSituationProperty.ScenarioGroupID] = util_forceInt($mobileUtil.GetClosestAttributeValue($this,
                                                                                                       "data-attr-current-scenario-group-id"), enCE.None);
                            }
                            else if (_entityMode.Type == "rationale") {
                                var _situationID = util_forceInt($mobileUtil.GetClosestAttributeValue($this, "data-attr-situation-id"), enCE.None);

                                dataItem[enColEditorSituationRationaleProperty.SituationID] = _situationID;
                            }
                        }

                        _controller.PopulateEditorContent({
                            "List": $editor,
                            "PropertyHTML": _entityMode.PropertyHTML,
                            "PopulateItem": function (opts) {

                                //NOTE: returning the current data item since will have only one for the content type editor
                                return dataItem;
                            },
                            "Callback": function (arr) {

                                $element.trigger("events.getLayoutManager", {
                                    "Callback": function (layoutManager) {

                                        var _fnSaveItem = function () {

                                            _controller.Utils.Actions.SaveEntity({
                                                "IsDisplaySaveMessage": true,
                                                "IsPromptRefreshOnError": false,
                                                "Controller": _controller, "LayoutManager": layoutManager, "Trigger": $this,
                                                "IsAppService": true,
                                                "Params": {
                                                    "c": "PluginEditor", "m": _entityMode.SaveMethodName,
                                                    "args": {
                                                        "_EditorGroupID": _controller.Utils.ContextEditorGroupID($this),
                                                        "Item": util_stringify(dataItem),
                                                        "DeepSave": true,
                                                        "IsSaveReferenceList": (_entityItemID == enCE.None)
                                                    }
                                                },
                                                "OnSuccess": function (saveItem) {

                                                    var $ctx = $this;

                                                    var _paramsDataItem = {
                                                        "Trigger": $this,
                                                        "Callback": function () {

                                                            if ($refList != null) {

                                                                //force clear of the updated elements' data entity item
                                                                $refList.removeData("DataItem");

                                                                //update the items that were modified in the save
                                                                var _updatedList = [];

                                                                $.merge(_updatedList, saveItem[_entityMode.PropertyReferenceList]);

                                                                if (_updatedList.length > 0) {

                                                                    var _paramsDataItem = {};
                                                                    var $ctxRefListUpdate = $element;

                                                                    if (_entityMode.Type == "situation") {
                                                                        _paramsDataItem["SituationItemList"] = _updatedList;
                                                                    }
                                                                    else if (_entityMode.Type == "rationale") {
                                                                        $ctxRefListUpdate = $this.closest(".EditorRationaleListView");
                                                                        _paramsDataItem["RationaleItemList"] = _updatedList;
                                                                    }
                                                                    else {
                                                                        _paramsDataItem = null;
                                                                    }

                                                                    if (_paramsDataItem) {
                                                                        $ctxRefListUpdate.trigger("events.situationList_setDataItem", _paramsDataItem);
                                                                    }
                                                                }

                                                                saveItem[_entityMode.PropertyReferenceList] = null;
                                                            }

                                                            _callback(true);
                                                        }

                                                    };

                                                    if (_entityMode.Type == "situation") {
                                                        _paramsDataItem["Item"] = saveItem;
                                                    }
                                                    else if (_entityMode.Type == "rationale") {

                                                        $ctx = $this.closest(".EditorRationaleListView");

                                                        _paramsDataItem["RationaleItemList"] = [saveItem];

                                                        var _rationaleItem = saveItem[enColCEEditorSituationRationale_JSONProperty.RationaleItem];
                                                        
                                                        if (_rationaleItem) {
                                                            _paramsDataItem["SourceRationaleList"] = [_rationaleItem];
                                                        }

                                                        delete saveItem[enColCEEditorSituationRationale_JSONProperty.RationaleItem];

                                                        $this.children(".Title")
                                                             .children(".Label")
                                                             .text(util_forceString(saveItem[_entityMode.PropertyTitle]));

                                                        $this.trigger("events.situationList_rebindDetailView", {
                                                            "Controller": _controller, "Item": _rationaleItem, "IsRestrictRendererRebind": true
                                                        });
                                                    }
                                                    else {
                                                        _paramsDataItem = null;
                                                    }

                                                    if (_paramsDataItem) {

                                                        //set the ID
                                                        $this.attr(_entityMode.DataAttributeItemID, saveItem[_entityMode.PropertyEntityIdentifier]);

                                                        $ctx.trigger("events.situationList_setDataItem", _paramsDataItem);
                                                    }

                                                },
                                                "OnErrorCallback": function () {

                                                    $element.trigger("events.toggleOverlay", {
                                                        "IsEnabled": true, "Message": "Click here to reload the item.", "IsHTML": true,
                                                        "OnClick": function () {

                                                            $this.trigger("events.situationList_reloadDetailView", { "Controller": _controller });
                                                        }
                                                    });
                                                }

                                            }); //end: save method call

                                        };  //end: _fnSaveItem

                                        var _queue = new CEventQueue();

                                        if (_entityItemID == enCE.None) {

                                            var _isPrev = true;
                                            var _siblingSelector = ".EditorSituationEntityBase:not([" + util_htmlAttribute(_entityMode.DataAttributeItemID, enCE.None) + "])";

                                            dataItem[_entityMode.PropertyReferenceList] = [];

                                            $refList = $this.prevAll(_siblingSelector);

                                            if ($refList.length == 0) {
                                                $refList = $this.next(_siblingSelector);
                                                _isPrev = false;
                                            }

                                            if ($refList.length == 0) {
                                                $refList = null;
                                                dataItem[_entityMode.PropertyBridgeItemDisplayOrder] = 1;
                                            }
                                            else {

                                                $.each($refList, function () {

                                                    var $current = $(this);

                                                    _queue.Add(function (onLoadCallback) {

                                                        $current.trigger("events.situationList_getDataItem", {
                                                            "Trigger": $current, "Callback": function (refItem) {

                                                                var _arr = dataItem[_entityMode.PropertyReferenceList];

                                                                _arr.push(refItem);

                                                                onLoadCallback();
                                                            }
                                                        });

                                                    });

                                                });

                                                _queue.Add(function (onLoadCallback) {

                                                    var _refItems = dataItem[_entityMode.PropertyReferenceList];
                                                    var _temp = _refItems[0];
                                                    var _displayOrder = _temp[_entityMode.PropertyBridgeItemDisplayOrder];

                                                    if (_isPrev) {

                                                        //take the first item as the display order and then subtract each referenced list to come before it
                                                        dataItem[_entityMode.PropertyBridgeItemDisplayOrder] = _displayOrder--;

                                                        for (var j = 0; j < _refItems.length; j++) {
                                                            var _refItem = _refItems[j];

                                                            _refItem[_entityMode.PropertyBridgeItemDisplayOrder] = _displayOrder--;
                                                        }
                                                    }
                                                    else {

                                                        //set current display order of item to preceed the next item
                                                        dataItem[_entityMode.PropertyBridgeItemDisplayOrder] = _displayOrder - 1;
                                                    }

                                                    onLoadCallback();

                                                });
                                            }

                                        }
                                        else {
                                            dataItem[_entityMode.PropertyReferenceList] = null;
                                        }

                                        _queue.Add(_fnSaveItem);

                                        _queue.Run();
                                    }

                                }); //end: get layout manager callback

                            }   //end: populate editor callback

                        });

                    }
                });

                return true;   //must prevent any parent event handlers of this namespace from executing

            }); //end: events.situationList_save

            $element.off("events.situationList_reloadDetailView");
            $element.on("events.situationList_reloadDetailView", ".EditorSituationEntityBase", function (e, args) {

                e.stopPropagation();    //must prevent any parent event handlers of this namespace from executing

                args = util_extend({ "Controller": null, "Callback": null }, args);

                var $this = $(this);

                var _callback = function () {

                    if (args.Callback) {
                        args.Callback();
                    }
                };

                var _controller = args.Controller;
                var _entityMode = {
                    "Type": _fnGetType($this),
                    "GetHTML": null,
                    "ContentTypeID": enCEditorScenarioContentRendererType.None,
                    "PropertyContentHTML": null
                };

                switch (_entityMode.Type) {

                    case "situation":

                        _entityMode.GetHTML = _fnGetSituationHTML;
                        _entityMode.ContentTypeID = enCEditorScenarioContentRendererType.Situation;
                        _entityMode.PropertyContentHTML = enColEditorSituationProperty.ContentHTML;

                        break;

                    case "rationale":
                        _entityMode.GetHTML = _fnGetSituationRationaleDetailHTML;
                        _entityMode.ContentTypeID = enCEditorScenarioContentRendererType.Rationale;

                        //NOTE: being overridden to use function mode
                        _entityMode.PropertyContentHTML = function (situationRationale) {

                            var _populate = { "RationaleID": situationRationale[enColEditorSituationRationaleProperty.RationaleID], "Result": null };

                            $element.trigger("events.situationList_getRationaleItemFromLookup", _populate);

                            var _rationale = _populate.Result;

                            return (_rationale ? _rationale[enColEditorRationaleProperty.ContentHTML] : null);
                        };

                        break;
                }

                $element.trigger("events.situationList_getDataItem", {
                    "Controller": _controller, "ForceRefresh": true, "Trigger": $this,
                    "Callback": function (dataItem) {

                        var _renderOptions = _fnGetRenderOptions($element, _controller);
                        var $temp = $(_entityMode.GetHTML(_controller, dataItem, $element, _renderOptions));

                        $temp.hide();
                        $temp.insertAfter($this);

                        $mobileUtil.refresh($temp);

                        var $editor = $temp.find("[" + util_renderAttribute("pluginEditor_content") + "]" +
                                                 "[" + util_htmlAttribute("data-attr-editor-scenario-content-type", _entityMode.ContentTypeID) + "]");
                        var _isEditMode = _controller.Utils.IsEditMode($element);

                        var _contentHTML = null;

                        if (util_isFunction(_entityMode.PropertyContentHTML)) {
                            _contentHTML = _entityMode.PropertyContentHTML(dataItem);
                        }
                        else {
                            _contentHTML = dataItem[_entityMode.PropertyContentHTML];
                        }
                        
                        if (_entityMode.Type == "situation") {

                            _controller.SetEditorContent({
                                "Element": $editor,
                                "HTML": _contentHTML
                            });

                            //rationale list
                            var $rationales = $temp.find(".EditorSituationRationaleDetail");

                            var _lookupRationale = ($element.data("DataLookupRationale") || {});

                            $.each($rationales, function (index) {
                                var $rationale = $(this);
                                
                                var _rationaleID = util_forceInt($rationale.attr("data-attr-rationale-id"), enCE.None);
                                var _rationale = (_lookupRationale[_rationaleID] || {});

                                $rationale.trigger("events.situationList_rebindDetailView", { "Controller": _controller, "Item": _rationale });

                            });
                        }
                        else if (_entityMode.Type == "rationale") {

                            var _populate = { "RationaleID": dataItem[enColEditorSituationRationaleProperty.RationaleID], "Result": null };

                            $element.trigger("events.situationList_getRationaleItemFromLookup", _populate);

                            $temp.trigger("events.situationList_rebindDetailView", { "Controller": _controller, "Item": _populate.Result });
                        }

                        if (_isEditMode) {
                            $element.trigger("events.situationList_toggleEditMode", {
                                "Controller": _controller, "FilteredList": $temp, "ToggleDraggableOnView": true, "EntityType": _entityMode.Type
                            });
                        }

                        $this.remove();
                        $temp.show();

                        $element.trigger("events.toggleOverlay", {
                            "IsEnabled": false
                        });

                        ClearMessages();

                        _callback();

                    }
                });

                return true;   //must prevent any parent event handlers of this namespace from executing

            }); //end: events.situationList_reloadDetailView

            $element.off("click.situationList_collapsible");
            $element.on("click.situationList_collapsible", ".EditorSituationEntityBase > .LinkClickable.Title:not(.LinkDisabled)", function (e, args) {

                var $target = $(e.target);

                if (!$target.is("input[type='text'], .ui-input-text")) {

                    var $this = $(this);
                    var $container = $this.closest(".EditorSituationEntityBase");
                    var $content = $container.children(".EditorCollapseContent");

                    var _collapse = $content.is(":visible");

                    $this.addClass("LinkDisabled");

                    var _fn = function () {
                        $this.removeClass("LinkDisabled");

                        var $btn = $this.find(".EditorCollapseToggleButton > .LinkClickable");

                        $mobileUtil.ButtonUpdateIcon($btn, _collapse ? "arrow-d" : "arrow-u");
                    };

                    if (_collapse) {
                        $content.slideUp("normal", _fn);
                    }
                    else {
                        $content.slideDown("normal", _fn);
                    }
                }

            }); //end: click.situationList_collapsible

            //NOTE: synchronous call and populated result via arguments
            $element.off("events.situationList_getRationaleItemFromLookup");
            $element.on("events.situationList_getRationaleItemFromLookup", function (e, args) {

                var _rationaleID = util_forceInt(args["RationaleID"], enCE.None);
                var _result = null;

                if (_rationaleID == enCE.None) {
                    _result = new CEEditorRationale();
                }
                else {
                    var _lookup = ($element.data("DataLookupRationale") || {});

                    _result = _lookup[_rationaleID];
                }

                args["Result"] = _result;

            }); //end: events.situationList_getRationaleItemFromLookup

            $element.off("events.situationList_getDataItem");
            $element.on("events.situationList_getDataItem", function (e, args) {

                args = util_extend({ "Trigger": null, "ID": enCE.None, "ForceRefresh": false, "Callback": null, "OverrideType": null }, args);

                var $target = $(e.target);
                var $trigger = $(args.Trigger);
                var _item = null;
                var _type = null;

                if (args.OverrideType) {
                    _type = args.OverrideType;
                }
                else {
                    _type = _fnGetType($trigger.length ? $trigger : $target);
                }

                if (args.ID == enCE.None) {
                    args.ID = util_forceInt($mobileUtil.GetClosestAttributeValue($trigger,
                                                                                 (_type == "situation" ? "data-attr-situation-id" : "data-attr-rationale-id")), enCE.None);
                }

                if (args.ForceRefresh) {
                    
                    var _bindParams = { "Controller": args["Controller"], "EntityType": _type };

                    switch (_type) {

                        case "situation":

                            _bindParams["ReloadSituationID"] = args.ID;

                            _bindParams["Callback"] = function () {

                                _item = util_arrFilter($element.data("DataList"), enColEditorSituationProperty.SituationID, args.ID, true);
                                _item = (_item.length == 1 ? _item[0] : null);

                                if (_item == null) {
                                    _item = new CEEditorSituation();
                                }

                                args.Callback(_item);
                            };

                            break;  //end: situation params

                        case "rationale":

                            var _situationID = util_forceInt($mobileUtil.GetClosestAttributeValue($trigger.length ? $trigger : $target, "data-attr-situation-id"), enCE.None);
                            var _rationaleID = args.ID;

                            _bindParams["ReloadSituationID"] = _situationID;
                            _bindParams["ReloadRationaleID"] = _rationaleID;

                            _bindParams["Callback"] = function () {

                                var _situationItem = util_arrFilter($element.data("DataList"), enColEditorSituationProperty.SituationID, _situationID, true);

                                _situationItem = (_situationItem.length == 1 ? _situationItem[0] : null);

                                _item = util_arrFilter(_situationItem[enColCEEditorSituationProperty.SituationRationales], enColEditorSituationRationaleProperty.RationaleID,
                                                       _rationaleID, true);

                                _item = (_item.length == 1 ? _item[0] : null);

                                if (_item == null) {
                                    _item = new CEEditorSituationRationale();
                                }

                                args.Callback(_item);
                            };

                            break;  //end: rationale params

                        default:
                            _bindParams = null;
                            break;
                    }

                    if (_bindParams) {
                        $element.trigger("events.situationList_bind", _bindParams);
                    }
                    else {
                        util_logError("events.situationList_getDataItem :: force refresh not handled for type - " + _type);
                    }

                }
                else {

                    if (_type == "situation") {
                        if (args.ID != enCE.None) {
                            _item = util_arrFilter($element.data("DataList"), enColEditorSituationProperty.SituationID, args.ID, true);
                            _item = (_item.length == 1 ? _item[0] : null);
                        }

                        if (_item == null) {
                            _item = new CEEditorSituation();
                        }
                    }
                    else if (_type == "rationale") {

                        var _situation = null;

                        if (args.ID != enCE.None) {
                            var _situationID = util_forceInt($mobileUtil.GetClosestAttributeValue($trigger.length ? $trigger : $target, "data-attr-situation-id"), enCE.None);

                            _situation = util_arrFilter($element.data("DataList"), enColEditorSituationProperty.SituationID, _situationID, true);
                            _situation = (_situation.length == 1 ? _situation[0] : null);

                            if (_situation) {
                                _item = util_arrFilter(_situation[enColCEEditorSituationProperty.SituationRationales],
                                                       enColEditorSituationRationaleProperty.RationaleID, args.ID, true);

                                _item = (_item.length == 1 ? _item[0] : null);
                            }
                        }

                        if (_item == null) {
                            _item = new CEEditorSituationRationale();
                        }
                    }

                    args.Callback(_item);
                }

            }); //end: events.situationList_getDataItem

            $element.off("events.situationList_setDataItem");
            $element.on("events.situationList_setDataItem", function (e, args) {

                args = util_extend({ "Trigger": null, "Item": null, "Callback": null, "SituationItemList": null, "RationaleItemList": null, "SourceRationaleList": null }, args);

                var $target = $(e.target);
                var _list = $element.data("DataList");

                if (!_list) {
                    _list = [];
                    $element.data("DataList", _list);
                }

                if ($target.is(".EditorRationaleListView")) {

                    //update the rationale list for the context situation (using the rationale list view as the target element)
                    var $situation = $target.closest(".EditorSituationDetail");
                    var _situationID = util_forceInt($situation.attr("data-attr-situation-id"), enCE.None);

                    var _situation = util_arrFilter(_list, enColEditorSituationProperty.SituationID, _situationID, true);

                    if (_situation.length == 1) {
                        _situation = _situation[0];

                        var _situationRationaleList = _situation[enColCEEditorSituationProperty.SituationRationales];

                        if (!_situationRationaleList) {
                            _situationRationaleList = [];
                            _situation[enColCEEditorSituationProperty.SituationRationales] = _situationRationaleList;
                        }

                        args.RationaleItemList = (args.RationaleItemList || []);

                        for (var i = 0; i < args.RationaleItemList.length; i++) {
                            var _situationRationale = args.RationaleItemList[i];

                            var _index = util_arrFilterItemIndex(_situationRationaleList, function (searchItem) {
                                return (searchItem[enColEditorSituationRationaleProperty.RationaleID] == _situationRationale[enColEditorSituationRationaleProperty.RationaleID]);
                            });

                            if (_index >= 0 && _index < _situationRationaleList.length) {
                                _situationRationaleList[_index] = _situationRationale;
                            }
                            else {
                                _situationRationaleList.push(_situationRationale);
                            }
                        }

                        //configure the source rationale list for the lookup
                        args.SourceRationaleList = (args.SourceRationaleList || []);

                        var _lookupRationale = $element.data("DataLookupRationale");

                        if (!_lookupRationale) {
                            _lookupRationale = {};
                            $element.data("DataLookupRationale", _lookupRationale);
                        }

                        for (var r = 0; r < args.SourceRationaleList.length; r++) {
                            var _rationale = args.SourceRationaleList[r];
                            var _rationaleID = _rationale[enColEditorRationaleProperty.RationaleID];

                            _lookupRationale[_rationaleID] = _rationale;
                        }
                    }
                    else {
                        util_logError("events.situationList_setDataItem :: update rationale list error - situation item not found: " + _situationID);
                    }

                }
                else if (args.SituationItemList) {

                    for (var i = 0; i < args.SituationItemList.length; i++) {
                        var _situation = args.SituationItemList[i];

                        var _index = util_arrFilterItemIndex(_list, function (searchItem) {
                            return (searchItem[enColEditorSituationProperty.SituationID] == _situation[enColEditorSituationProperty.SituationID]);
                        });

                        if (_index >= 0 && _index < _list.length) {
                            _list[_index] = _situation;
                        }
                        else {
                            _list.push(_situation);
                        }
                    }

                }
                else {

                    var $trigger = $(args.Trigger);
                    var $situation = $trigger.closest(".EditorSituationDetail");

                    var _item = args.Item;

                    if (_item) {

                        var _index = util_arrFilterItemIndex(_list, function (searchItem) {
                            return (searchItem[enColEditorSituationProperty.SituationID] == _item[enColEditorSituationProperty.SituationID]);
                        });

                        if (_index >= 0 && _index < _list.length) {
                            _list[_index] = _item;
                        }
                        else {
                            _list.push(_item);
                        }

                        $situation.attr("data-attr-situation-id", _item[enColEditorSituationProperty.SituationID]);
                    }

                    //update the associated data item on the element
                    $situation.data("DataItem", _item);

                    $situation.children(".Title")
                              .children(".Label")
                              .text(util_forceString(_item[enColEditorSituationProperty.Name]));
                }

                if (args.Callback) {
                    args.Callback();
                }

            }); //end: events.situationList_setDataItem

            $element.off("events.situationList_initSortable");
            $element.on("events.situationList_initSortable", function (e, args) {

                args = util_extend({ "Controller": null }, args);

                var $target = $(e.target);

                if ($target.is(".EditorRationaleListView")) {

                    //rationale list view sortable configuration

                    if (!$target.data("is-init-drag-events")) {
                        $target.data("is-init-drag-events", true);

                        args.Controller.Utils.Sortable({
                            "Controller": args.Controller,
                            "Containers": $target,
                            "SelectorDraggable": ".EditorSituationRationaleDetail",
                            "DisregardSelector": ":not([" + util_htmlAttribute("data-attr-rationale-id", enCE.None) + "])",
                            "OnValidateDragRequest": function (opts) {
                                return ($(opts.TargetElement).hasClass("PermissionNoAccessItem") == false);
                            },
                            "DropOptions": {
                                "DataAttributeIdentifier": "data-attr-rationale-id",
                                "PropertyDisplayOrder": enColEditorSituationRationaleProperty.DisplayOrder,
                                "PropertyEntityIdentifier": enColEditorSituationRationaleProperty.RationaleID,
                                "GetUpdateDataList": function (saveItem) {

                                    var _updateList = saveItem[enColCEEditorSituationRationaleProperty.ReferencedRationales];

                                    saveItem[enColCEEditorSituationRationaleProperty.ReferencedRationales] = null; //remove the list from data item

                                    return _updateList;
                                },
                                "GetDataItem": function (id, ctx, callCache) {

                                    var $ctx = $(ctx);
                                    var _retDataItem = $ctx.data("DataItem");

                                    if (!_retDataItem) {

                                        if (!callCache || (callCache && !callCache["LookupSituationRationale"])) {

                                            var _situationList = $ctx.closest(".EditorScenarioSitationListView").data("DataList");
                                            var _situationID = util_forceInt($mobileUtil.GetClosestAttributeValue($ctx, "data-attr-situation-id"), enCE.None);

                                            var _situation = util_arrFilter(_situationList, enColEditorSituationProperty.SituationID, _situationID, true);

                                            _situation = (_situation.length == 1 ? _situation[0]: null);

                                            callCache["LookupSituationRationale"] = {};

                                            var _rationaleList = (_situation ? _situation[enColCEEditorSituationProperty.SituationRationales] : null);

                                            _rationaleList = (_rationaleList || []);

                                            for (var i = 0; i < _rationaleList.length; i++) {
                                                var _situationRationale = _rationaleList[i];
                                                var _rationaleID = _situationRationale[enColEditorSituationRationaleProperty.RationaleID];

                                                callCache.LookupSituationRationale[_rationaleID] = _situationRationale;
                                            }
                                        }

                                        //retrieve it from the source data item
                                        id = util_forceInt(id, enCE.None);

                                        _retDataItem = callCache.LookupSituationRationale[id];
                                        
                                        if (_retDataItem) {
                                            $ctx.data("DataItem", _retDataItem);
                                        }
                                    }

                                    return _retDataItem;
                                }
                            },

                            "OnDrop": function (dropOptions) {

                                var _searchRationaleID = util_forceInt($(dropOptions.Element).attr("data-attr-rationale-id"), enCE.None);
                                var _isTemp = (_searchRationaleID == enCE.None);

                                if (_isTemp) {

                                    dropOptions.IsSave = false; //disable the save event (as it is not needed)
                                }
                                else {

                                    //existing data item being reordered
                                    var _currentItem = null;

                                    dropOptions.OnSaveSuccess = function (saveItem, updateOpts) {

                                        //force clear of the updated elements' data entity item
                                        $(updateOpts.UpdatedElements).removeData("DataItem");

                                        //update the items that were modified in the save
                                        var _updatedList = [];

                                        _updatedList.push(saveItem);
                                        $.merge(_updatedList, updateOpts.ReferenceList);

                                        //force update of situation rationale list (NOTE: must use the context drop container which will be the list view element)
                                        var $dropContainer = $(updateOpts.DropContainer);

                                        $dropContainer.trigger("events.situationList_setDataItem", { "RationaleItemList": _updatedList });

                                        _currentItem[enColCEEditorSituationRationaleProperty.ReferencedRationales] = null;
                                    };

                                    var _refList = [];

                                    //construct the reference list
                                    for (var i = 0; i < dropOptions.SaveList.length; i++) {
                                        var _situationRationale = dropOptions.SaveList[i];

                                        if (_situationRationale[enColEditorSituationRationaleProperty.RationaleID] == _searchRationaleID) {
                                            _currentItem = _situationRationale;
                                        }
                                        else {
                                            _refList.push(_situationRationale);
                                        }
                                    }

                                    _currentItem[enColCEEditorSituationRationaleProperty.ReferencedRationales] = _refList;

                                    dropOptions.IsAppService = true;
                                    dropOptions.SaveParams = {
                                        "c": "PluginEditor", "m": "EditorSituationRationaleSave",
                                        "args": {
                                            "_EditorGroupID": args.Controller.Utils.ContextEditorGroupID($element),
                                            "Item": util_stringify(_currentItem), "DeepSave": false, "IsSaveReferenceList": true
                                        }
                                    };
                                }

                            }

                        });

                    }
                }
                else {

                    //general situation list view sortable configuration

                    var $vwDraggable = $element.find(".EditorDraggableContainer.EditorSituationListView");

                    if (!$vwDraggable.data("is-init-drag-events")) {
                        $vwDraggable.data("is-init-drag-events", true);

                        args.Controller.Utils.Sortable({
                            "Controller": args.Controller,
                            "Containers": $vwDraggable,
                            "SelectorDraggable": ".EditorSituationDetail",
                            "DisregardSelector": ":not([" + util_htmlAttribute("data-attr-situation-id", enCE.None) + "])",
                            "OnValidateDragRequest": function (opts) {
                                var _valid = $(opts.Handle).closest(".EditorRationaleListView, .EditorSituationDetail")
                                                           .is(".EditorSituationDetail");

                                _valid = (_valid && ($(opts.TargetElement).hasClass("PermissionNoAccessItem") == false));

                                return _valid;
                            },
                            "DropOptions": {
                                "DataAttributeIdentifier": "data-attr-situation-id",
                                "PropertyDisplayOrder": enColEditorSituationProperty.DisplayOrder,
                                "PropertyEntityIdentifier": enColEditorSituationProperty.SituationID,
                                "GetUpdateDataList": function (saveItem) {

                                    var _updateList = saveItem[enColCEEditorSituationProperty.ReferencedSituations];

                                    saveItem[enColCEEditorSituationProperty.ReferencedSituations] = null; //remove the list from data item

                                    return _updateList;
                                },
                                "GetDataItem": function (id, ctx, callCache) {
                                    var $ctx = $(ctx);
                                    var _retDataItem = $ctx.data("DataItem");

                                    if (!_retDataItem) {

                                        //retrieve it from the source data item
                                        id = util_forceInt(id, enCE.None);

                                        var _situationList = $ctx.closest(".EditorScenarioSitationListView").data("DataList");

                                        _retDataItem = util_arrFilter(_situationList, enColEditorSituationProperty.SituationID, id, true);
                                        _retDataItem = (_retDataItem.length == 1 ? _retDataItem[0] : null);

                                        if (_retDataItem) {
                                            $ctx.data("DataItem", _retDataItem);
                                        }
                                    }

                                    return _retDataItem;
                                }
                            },

                            "OnDrop": function (dropOptions) {

                                var _searchSituationID = util_forceInt($(dropOptions.Element).attr("data-attr-situation-id"), enCE.None);
                                var _isTemp = (_searchSituationID == enCE.None);

                                if (_isTemp) {

                                    dropOptions.IsSave = false; //disable the save event (as it is not needed)
                                }
                                else {

                                    //existing data item being reordered
                                    var _currentItem = null;

                                    dropOptions.OnSaveSuccess = function (saveItem, updateOpts) {

                                        //force clear of the updated elements' data entity item
                                        $(updateOpts.UpdatedElements).removeData("DataItem");

                                        //update the items that were modified in the save
                                        var _updatedList = [];

                                        _updatedList.push(saveItem);
                                        $.merge(_updatedList, updateOpts.ReferenceList);

                                        $element.trigger("events.situationList_setDataItem", { "SituationItemList": _updatedList });

                                        _currentItem[enColCEEditorSituationProperty.ReferencedSituations] = null;
                                    };

                                    var _refList = [];

                                    //construct the reference list (disregards temp/unsaved situation details)
                                    for (var i = 0; i < dropOptions.SaveList.length; i++) {
                                        var _situation = dropOptions.SaveList[i];

                                        if (_situation[enColEditorSituationProperty.SituationID] == _searchSituationID) {
                                            _currentItem = _situation;
                                        }
                                        else {
                                            _refList.push(_situation);
                                        }
                                    }

                                    _currentItem[enColCEEditorSituationProperty.ReferencedSituations] = _refList;

                                    dropOptions.IsAppService = true;
                                    dropOptions.SaveParams = {
                                        "c": "PluginEditor", "m": "EditorSituationSave",
                                        "args": {
                                            "_EditorGroupID": args.Controller.Utils.ContextEditorGroupID($element),
                                            "Item": util_stringify(_currentItem), "DeepSave": false, "IsSaveReferenceList": true
                                        }
                                    };
                                }

                            }

                        });
                    }

                }

            }); //end: events.situationList_initSortable

            $element.off("events.situationList_addSituation");
            $element.on("events.situationList_addSituation", function (e, args) {

                args = util_extend({ "Controller": null, "Item": null, "Trigger": null, "Callback": null }, args);

                var _callback = function () {

                    if (args.Callback) {
                        args.Callback();
                    }
                };

                var _controller = args.Controller;
                var _situation = args.Item;

                if (!_situation) {
                    _situation = new CEEditorSituation();
                }

                var $detail = $(_fnGetSituationHTML(_controller, _situation, $element));
                var $list = $element.children(".EditorSituationListView");

                $detail.hide();

                $list.prepend($detail);
                $mobileUtil.refresh($detail);

                _controller.SetEditorContent({
                    "Element": $detail.find("[" + util_htmlAttribute("data-attr-editor-scenario-content-type", enCEditorScenarioContentRendererType.Situation) + "]" +
                                            "[" + util_renderAttribute("pluginEditor_content") + "]"),
                    "HTML": _situation[enColEditorSituationProperty.ContentHTML]
                });

                $element.trigger("events.situationList_toggleEditMode", {
                    "Controller": _controller,
                    "FilteredList": $detail,
                    "Callback": function () {

                        $detail.find("[data-attr-editor-controller-action-btn='edit_situation']")
                               .trigger("click", {
                                   "Callback": function () {

                                       $detail.toggle("height", function () {

                                           $detail.find("input[type='text'][" + util_htmlAttribute("data-attr-situation-prop", enColEditorSituationProperty.Name) + "]")
                                                  .trigger("focus");

                                           _callback();
                                       });

                                   }
                               });
                    }
                });

            }); //end: events.situationList_addSituation

            $element.off("events.situationList_addRationale");
            $element.on("events.situationList_addRationale", ".EditorRationaleListView", function (e, args) {

                args = util_extend({ "Controller": null, "Item": null, "Callback": null }, args);

                var _callback = function () {

                    if (args.Callback) {
                        args.Callback();
                    }
                };

                var _controller = args.Controller;
                var _situationRationale = args.Item;

                if (!_situationRationale) {
                    _situationRationale = new CEEditorSituationRationale();
                }

                var $list = $(this);
                var $temp = $(_fnGetSituationRationaleDetailHTML(_controller, _situationRationale, $element));

                $temp.hide();

                $list.prepend($temp);
                $mobileUtil.refresh($temp);

                var _populate = { "RationaleID": _situationRationale[enColEditorSituationRationaleProperty.RationaleID], "Result": null };

                $element.trigger("events.situationList_getRationaleItemFromLookup", _populate);

                _controller.SetEditorContent({
                    "Element": $temp.find("[" + util_htmlAttribute("data-attr-editor-scenario-content-type", enCEditorScenarioContentRendererType.Rationale) + "]" +
                                          "[" + util_renderAttribute("pluginEditor_content") + "]"),
                    "HTML": (_populate.Result ? _populate.Result[enColEditorRationaleProperty.ContentHTML] : null)
                });

                $element.trigger("events.situationList_toggleEditMode", {
                    "Controller": _controller,
                    "FilteredList": $temp,
                    "EntityType": "rationale",
                    "Callback": function () {

                        $temp.find("[data-attr-editor-controller-action-btn='edit_rationale']")
                             .trigger("click", {
                                 "Callback": function () {

                                     $temp.toggle("height", function () {

                                         $temp.find("input[type='text']" +
                                                    "[" + util_htmlAttribute("data-attr-rationale-prop", enColEditorSituationRationaleProperty.RationaleIDName) + "]")
                                              .trigger("focus");

                                         _callback();
                                     });

                                 }
                             });
                    }
                });

            }); //end: events.situationList_addRationale

            $element.off("events.situationList_rebindDetailView");
            $element.on("events.situationList_rebindDetailView", ".EditorSituationEntityBase", function (e, args) {

                e.stopPropagation();    //must prevent any parent event handlers of this namespace from executing

                var $this = $(this);
                var _entityMode = {
                    "Type": _fnGetType($this),
                    "ContentTypeID": enCEditorScenarioContentRendererType.None,
                    "PropertyContentHTML": null
                };

                args = util_extend({ "Controller": null, "Item": null, "IsRestrictRendererRebind": false }, args);

                var _controller = args.Controller;
                var _item = (args.Item || {});

                switch (_entityMode.Type) {

                    case "situation":
                        _entityMode.ContentTypeID = enCEditorScenarioContentRendererType.Situation;
                        _entityMode.PropertyContentHTML = enColEditorSituationProperty.ContentHTML;
                        break;

                    case "rationale":
                        _entityMode.ContentTypeID = enCEditorScenarioContentRendererType.Rationale;
                        _entityMode.PropertyContentHTML = enColEditorRationaleProperty.ContentHTML;
                        break;
                }

                if (args.IsRestrictRendererRebind != true) {
                    var $editor = $this.find("[" + util_renderAttribute("pluginEditor_content") + "]" +
                                             "[" + util_htmlAttribute("data-attr-editor-scenario-content-type", _entityMode.ContentTypeID) + "]");


                    _controller.SetEditorContent({
                        "Element": $editor,
                        "HTML": _item[_entityMode.PropertyContentHTML]
                    });
                }

                if (_entityMode.Type == "rationale") {
                    var $platformIcons = $this.find(".EditorPlatformIcons[" + util_renderAttribute("pluginEditor_platformIconsView") + "]");

                    $platformIcons.trigger("events.platformIcons_bind", { "RationalePlatformList": _item[enColCEEditorRationaleProperty.RationalePlatforms] });
                }

                return true;

            }); //end: events.situationList_rebindDetailView

            $element.addClass("EditorElementPlaceholderOn EditorScenarioSitationListView");
        }
    });
};