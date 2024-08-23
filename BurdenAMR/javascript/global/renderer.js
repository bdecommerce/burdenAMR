var RENDERER_UNIQUE_ID = 1;

var RENDERER_LOOKUP = {
    "editor": renderer_ctl_editor,
    "label_field": renderer_label_field,
    "script": renderer_script,
    "flip_switch": renderer_flip_switch,
    "table": renderer_table,
    "repeater": renderer_repeater,
    "user_toolbar": renderer_userToolbar,
    "popup": renderer_popup,
    "popup_links": renderer_popupLinks,
    "watermark": renderer_watermark,
    "label_module_name": renderer_label_module_name,
    "data_admin_list": renderer_data_admin_list,
    "file_upload": renderer_file_upload,
    "datepicker": renderer_datepicker,  //deprecated: use datepickerV2
    "datepickerV2": renderer_datepickerV2,
    "colorpicker": renderer_colorpicker,
    "img_link": renderer_imgLink,
    "rating": renderer_rating,  //deprecated: use ratingV2
    "ratingV2": renderer_ratingV2,
    "tab_group": renderer_tabGroup,
    "selection_list": renderer_selectionList,
    "filter_text": renderer_filterText,
    "filter_view": renderer_filterView,
    "tab_strip": renderer_tabStrip,
    "video": renderer_video,
    "slideshow": renderer_slideshow,
    "sprite": renderer_sprite,
    "model_input": renderer_model_input,
    "model_restore_default": renderer_model_restore_default,
    "model_chart": renderer_model_chart,
    "lang_label": renderer_lang_label,
    "editor_template_collapsible_group": renderer_editorTemplateCollapsibleGroup,
    "editor_template_subsection_link": renderer_editorTemplateSubsectionLink,
    "editor_project_subsection_navigation_metadata": renderer_editorProjectSubsectionNavigationMetadata,
    "editor_read_more_less": renderer_editorTemplateReadMoreLess,
    "drag_drop_column": renderer_dragDropColumn,
    "module_navigation": renderer_module_navigation,
    "view_indicator": renderer_viewIndicator,
    "callout": renderer_callout,
    "searchable_field": renderer_searchableField
};

var RENDERER_OPTIONS_FN = null; //the function used to provide custom options to a renderer

function renderer_init() {
    renderer_apply(null);
}

function renderer_apply(context, attrRender, disableCreate) {
    context = global_forceContext(context);
    attrRender = util_forceString(attrRender, "");
    disableCreate = util_forceBool(disableCreate, false);

    var _fnRender = null;
    var _fnGetOptions = function (ctx, renderType) {
        return renderer_getOptions(ctx, renderType);
    };

    var _requireGlobalRenderer = { "selection_list": true };    //renderers that cannot apply individual renderer function updates

    if (attrRender != "" && _requireGlobalRenderer[attrRender] != true) {
        _fnRender = RENDERER_LOOKUP[attrRender];
    }

    if (_fnRender != null && _fnRender != undefined) {

        //specific renderer is to be executed on the context
        _fnRender(context, _fnGetOptions(context, attrRender));
    }
    else {

        //list of renderers that should be performed in a specific order
        var _preProcessList = { "popup_links": true, "data_admin_list": true, "selection_list": true, "filter_text": true };
        var _postProcessList = { "script": true };

        //handle any renderers that are flagged as ordered first for processing
        for (var _preProcessKey in _preProcessList) {
            var _fn = RENDERER_LOOKUP[_preProcessKey];

            _fn(context, _fnGetOptions(context, _preProcessKey));
        }

        for (var _key in RENDERER_LOOKUP) {
            if (_preProcessList[_key] != true && _postProcessList[_key] != true) {
                var _fn = RENDERER_LOOKUP[_key];

                _fn(context, _fnGetOptions(context, _key));
            }
        }

        //handle any renderers that are flagged as post process
        for (var _postProcessKey in _postProcessList) {
            var _fn = RENDERER_LOOKUP[_postProcessKey];

            _fn(context, _fnGetOptions(context, _postProcessKey));
        }
    }

    if (!disableCreate) {
        $mobileUtil.WidgetCreate(context);
    }

    renderer_onApplyComplete(context);
    
    return false;
}

function renderer_getOptions(context, renderAttr) {
    var _ret = {};

    if (RENDERER_OPTIONS_FN == null || RENDERER_OPTIONS_FN == undefined) {

        //check if there is a project specific implementation of renderer options function to use
        if (util_isDefined("private_renderer_options")) {
            RENDERER_OPTIONS_FN = private_renderer_options;
        }
        else {
            RENDERER_OPTIONS_FN = function (context, renderAttr) {
                return {};
            };
        }
    }

    _ret = RENDERER_OPTIONS_FN(context, renderAttr);

    return _ret;
}

function renderer_ctl_editor(context, options) {
    context = global_forceContext(context);
    
    var _list = renderer_getFilteredList(context, "editor");

    //assign unique ID for elements without an ID attribute
    $.each(_list.not("[id]"), function (index) {
        $(this).attr("id", renderer_uniqueID());
    });

    if (_list.length > 0) {
        editor_init(_list);
    }
}

function renderer_label_field(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "label_field");

    _list.addClass("ui-input-text");
}

function renderer_script(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "script");

    $.each(_list, function (index) {
        var _renderScript = $(this);
        var _script = _renderScript.html();

        _renderScript.remove();
        eval(_script);
    });
}

function renderer_flip_switch(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "flip_switch");
    var _fnGetHTML = function (onText, offText, isDisabled) {
        onText = util_forceString(onText, "Yes");
        offText = util_forceString(offText, "No");
        isDisabled = util_forceBool(isDisabled, false);

        return "<select data-role='slider' data-attr-widget='flip_switch'" + 
               (isDisabled ? " " + util_htmlAttribute("disabled", "disabled") : "") + "><option value='" + enCETriState.No + "'>" +
               util_htmlEncode(offText) + "</option>" +
               "<option value='" + enCETriState.Yes + "'>" + util_htmlEncode(onText) + "</option></select>";
    };

    //Note: include the "data-attr-widget" to state that it is flip_switch since it may be misten for a standard slider (due to matching data-role between the widgets)
    var _attributes = ["id", "data-mini", "data-theme", DATA_ATTR_INPUT_FIELD, CONTROL_FLIP_SWITCH_ASSOCIATE_ID];    //list of attributes to be copied over

    var _length = _attributes.length;

    $.each(_list, function (index) {
        var _element = $(this);
        var _disabledAttr = util_forceString(_element.attr("disabled"));
        var _isPersistSwitchID = (util_forceInt(_element.attr(CONTROL_FLIP_SWITCH_TOGGLE_PERSISTENT_ID), enCETriState.Yes) == enCETriState.Yes);

        var _item = $(_fnGetHTML(_element.attr(CONTROL_FLIP_SWITCH_ON_TEXT), _element.attr(CONTROL_FLIP_SWITCH_OFF_TEXT), (_disabledAttr == "disabled")));

        var _switchID = "";

        if (_isPersistSwitchID) {
            _switchID = util_forceString(_element.attr(CONTROL_DATA_ATTR_FLIP_SWTICH_ELEMENT_ID));
        }
        else {
            _element.removeAttr(CONTROL_DATA_ATTR_FLIP_SWTICH_ELEMENT_ID);
        }

        for (var i = 0; i < _length; i++) {
            var _attrName = _attributes[i];
            var _attrValue = _element.attr(_attrName);

            if (_attrName == "id" && util_forceString(_attrValue) == "" && _switchID != "") {
                _attrValue = _switchID;
            }

            if (_attrName == "data-mini" && util_forceInt(_element.attr("data-flip-switch-is-mini"), enCETriState.None) == enCETriState.Yes) {
                _attrValue = "true";
            }

            //important! if an attribute to be copied over exists, then add it to the select element and remove it from the source placeholder element (avoids duplicates)
            if (_attrValue) {
                _item.attr(_attrName, _attrValue);
                _element.removeAttr(_attrName);

                if (_isPersistSwitchID && _attrName == "id") {
                    _element.attr(CONTROL_DATA_ATTR_FLIP_SWTICH_ELEMENT_ID, _attrValue);
                }
            }
        }

        var _value = util_forceValidEnum(_element.attr(DATA_ATTR_DEFAULT_VALUE), enCETriState, enCETriState.No);

        $mobileUtil.SetDropdownListValue(_item, _value);

        _element.html(_item);

        //configure change event
        var _fnOnChange = _element.data("onChange");

        _item.off("change.flip_switch");

        if (_fnOnChange) {

            //use the data change event
            _item.on("change.flip_switch", _fnOnChange);
        }
        else {

            //trigger the parent container change event indirectly
            _item.on("change.flip_switch", function (e, args) {
                _element.trigger("change.flip_switch", [e, args]);
            });
        }

        if (!_element.data("is-init")) {
            _element.data("is-init", true);

            _element.off("events.flipSwitchToggle");
            _element.on("events.flipSwitchToggle", function (e, args) {

                args = util_extend({ "IsEnabled": true }, args);

                var $this = $(this);
                var $ddl = $this.find("select[data-attr-widget='flip_switch']");

                $ddl.slider(args.IsEnabled ? "enable" : "disable");
            });
        }

        _element.removeAttr("id");
    });
}

function renderer_table(context, options) {
    var EVEN_ROW_CSS_CLASS = "TableRowEven";
    var ODD_ROW_CSS_CLASS = "TableRowOdd";

    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "table");

    _list.addClass("TableStandard");

    $.each(_list, function (index) {
        var _element = $(this);
        var _overrideList = _element.find("[" + DATA_ATTRIBUTE_RENDER_OVERRIDE + "] tr");
        var _applyAttributeFilter = util_forceValidEnum(_element.attr(CONTROL_TABLE_APPLY_ATTRIBUTE_FILTER), enCETriState, enCETriState.No);

        _overrideList.attr(DATA_ATTRIBUTE_RENDER_OVERRIDE, "true");

        var _rows = null;

        if (_applyAttributeFilter == enCETriState.Yes) {
            _rows = _element.find("[" + CONTROL_TABLE_OVERRIDE_ATTRIBUTE_EVEN_ROW + "], " + "[" + CONTROL_TABLE_OVERRIDE_ATTRIBUTE_ODD_ROW + "]")
                            .not(".TableHeaderRow").not("[" + DATA_ATTRIBUTE_RENDER_OVERRIDE + "=true]");

            _overrideList.removeAttr(DATA_ATTRIBUTE_RENDER_OVERRIDE);

            _rows.removeClass(EVEN_ROW_CSS_CLASS)
                 .removeClass(ODD_ROW_CSS_CLASS);

            _rows.filter("[" + CONTROL_TABLE_OVERRIDE_ATTRIBUTE_EVEN_ROW + "]").addClass(EVEN_ROW_CSS_CLASS);
            _rows.filter("[" + CONTROL_TABLE_OVERRIDE_ATTRIBUTE_ODD_ROW + "]").addClass(ODD_ROW_CSS_CLASS);
        }
        else {
            _rows = _element.find("tr").not(".TableHeaderRow").not("[" + DATA_ATTRIBUTE_RENDER_OVERRIDE + "=true]");

            _overrideList.removeAttr(DATA_ATTRIBUTE_RENDER_OVERRIDE);

            _rows.removeClass(EVEN_ROW_CSS_CLASS)
                 .removeClass(ODD_ROW_CSS_CLASS);

            _rows.filter(":odd").addClass(ODD_ROW_CSS_CLASS);
            _rows.filter(":even").addClass(EVEN_ROW_CSS_CLASS);
        }
    });
}

function renderer_repeater(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "repeater");

    $.each(_list, function (index) {
        var _element = $(this);
        var _html = "";

        var _setting = _element.find("[" + CONTROL_DATA_ATTR_PLACEHOLDER_TYPE + "=setting]");
        var _header = _element.find("[" + CONTROL_DATA_ATTR_PLACEHOLDER_TYPE + "=header]");

        var _repeaterSetting = {
            IsTableEnhance: util_forceBoolFromInt(_setting.attr("is-table-enhance"), true),  //whether to include external library based table enchanced styles
            SortEnum: _setting.attr("sort-enum"),
            DefaultSort: _setting.attr("default-sort"),
            DefaultSortASC: _setting.attr("default-sort-asc"),
            IsFooterDefaultPaging: util_forceBoolFromInt(_setting.attr("is-footer-default-paging"), false),  //whether to use the default paging template for the footer
            IsFooterNoRecords: util_forceBoolFromInt(_setting.attr("is-footer-no-records-label"), false),  //whether to use no records content for footer (if paging disabled)
            SortOrderGroup: util_forceInt(_setting.attr("sort-order-group"), 1), //the order number to associate a repeater to its sort related query string
            PageSize: util_forceInt(_setting.attr("default-page-size"), PAGE_SIZE)
        };

        _html += "<table " + (_repeaterSetting.IsTableEnhance ? "data-role=\"table\" data-mode=\"columntoggle\"" : "class='TableRepeaterView'") +
                 " cellpadding=\"0\" cellspacing=\"0\">";  //open table tag #1

        _html += "<thead>"; //open thead tag #1

        var _headerCSS = util_forceString(_header.attr("CssClass"), "TableHeaderRow");

        _html += "<tr class=\"" + _headerCSS + "\" " + DATA_ATTR_TEMPLATE + "=\"Header\">";   //open row tag #1

        var _listHeaders = _header.find("[" + CONTROL_DATA_ATTR_PLACEHOLDER_TYPE + "=item]");
        var _countHeader = _listHeaders.length;

        $.each(_listHeaders, function (indxItem) {
            var _item = $(this);

            var _dataPriority = util_forceString(_item.attr("priority"), "");
            var _headerSortColumn = util_forceString(_item.attr("sort-column"), "");
            var _columnCssClass = util_forceString(_item.attr("css-class"), "");

            if (_dataPriority == "critical") {
                _dataPriority = null;   //critical data priority and as such invalidate the value to not include the attribute for the markup
            }
            else {

                //force a valid numeric data priority number (with a really low priority default value, if not specified/invalid)
                _dataPriority = util_forceInt(_dataPriority, 100);
            }

            var _isNoLink = util_forceBoolFromInt(_item.attr("no-link"), false);

            var _headerCellCssClass = "";

            _headerCellCssClass += (indxItem == 0 ? "TableHeaderFirstCell " : "");
            _headerCellCssClass += (indxItem == _countHeader - 1 ? "TableHeaderLastCell " : "");

            if (_columnCssClass != "") {
                _headerCellCssClass += (_headerCellCssClass != "" ? " " : "") + _columnCssClass;
            }

            if (_headerCellCssClass != "") {
                _headerCellCssClass = util_htmlAttribute("class", _headerCellCssClass) + " ";
            }

            var _hasTooltip = util_forceString(_item.attr("has-tooltip"));
            var _isTooltipTitleFormat = util_forceString(_item.attr("is-tooltip-title-format"));

            _html += "<th " + _headerCellCssClass + (_isNoLink ? "" : "data-attr-sort-link=\"Header\" ") + CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN + "='" + _headerSortColumn + "' " +
                     (_hasTooltip != "" ? " " + util_htmlAttribute(CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN_HAS_TOOLTIP, _hasTooltip) : "") +
                     (_hasTooltip != "" && _isTooltipTitleFormat != "" ?
                      " " + util_htmlAttribute(CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN_IS_TOOLTIP_TITLE_FORMAT, _isTooltipTitleFormat) :
                      "") +
                     (_dataPriority != null ? "data-priority='" + _dataPriority + "'" : "") + ">"; //open th tag #1

            if (_isNoLink) {
                _html += util_forceString(_item.html(), "&nbsp;");
            }
            else {
                _html += "<a class='CRepeaterSort' href='#' data-role='button' data-corners='false' data-mini='true' " +
                         "data-iconpos='right'>" + util_forceString(_item.html(), "&nbsp;") + "</a>";
            }

            _html += "</th>";   //close th tag #1
        });

        _html += "</tr>";   //close row tag #1

        _html += "</thead>"; //close thead tag #1

        //add the empty body placeholder
        _html += "<tbody " + DATA_ATTR_TEMPLATE + "=\"Content\"></tbody>"; //open thead tag #1

        //configure the ID for the element (uses the containing element ID or generates a new ID)
        var _tblID = util_forceString(_element.attr("id"));

        if (_tblID == "") {
            _tblID = renderer_uniqueID();
        }

        if (_repeaterSetting.IsFooterDefaultPaging) {
            var _defaultNoRecordsHTML = util_forceString(_element.data("DefaultNoRecordsHTML"));

            _html += "<tfoot>" +
                     "<tr>" +
                     "<td colspan=\"" + _countHeader + "\" style=\"text-align: center;\">" +
                     "<div class=\"" + REPEATER_CSS_NO_RECORDS_CONTAINER + "\">" + _defaultNoRecordsHTML +
                     "</div>" +
                     "<div id=\"" + (_tblID + "_RepeaterPaging") + "\" class='CRepeaterFooterContainer'></div>" +
                     "</td>" +
                     "</tr>" +
                     "</tfoot>";
        }
        else if (_repeaterSetting.IsFooterNoRecords) {
            var _defaultNoRecordsHTML = util_forceString(_element.data("DefaultNoRecordsHTML"));

            _html += "<tfoot>" +
                     "  <tr>" +
                     "      <td colspan=\"" + _countHeader + "\" style=\"text-align: center;\">" +
                     "          <div class=\"" + REPEATER_CSS_NO_RECORDS_CONTAINER + "\">" + _defaultNoRecordsHTML + "</div>" +
                     "      </td>" +
                     "  </tr>" +
                     "</tfoot>";
        }

        _html += "</table>";    //close table tag #1

        var _tbl = $(_html);

        //set default sort column details
        _tbl.attr("default-sort", _repeaterSetting.DefaultSort);
        _tbl.attr("default-sort-asc", _repeaterSetting.DefaultSortASC);
        _tbl.attr("sort-order-group", _repeaterSetting.SortOrderGroup);
        _tbl.attr(CONTROL_ATTR_REPEATER_PAGING_PAGE_SIZE, _repeaterSetting.PageSize);

        if (!util_isNullOrUndefined(_repeaterSetting.DefaultSortASC)) {
            _tbl.attr(CONTROL_ATTR_REPEATER_SORT_ASC, _repeaterSetting.DefaultSortASC);
        }

        _tbl.hide();    //default it will be hidden (until it is initially data bound)

        _element.removeAttr("id");  //remove ID attribute from the containing element
        _tbl.attr("id", _tblID);

        //configure the setting related attributes
        _tbl.attr(CONTROL_ATTR_REPEATER_SORT_ENUM, _repeaterSetting.SortEnum);

        //insert the rendered table element before the containing element prior to it being removed
        _tbl.insertBefore(_element);
        _element.remove();
    });
}

function renderer_userToolbar(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "user_toolbar");

    $.each(_list, function (index) {
        var _element = $(this);

        var _fn = util_forceString(_element.attr("data-attr-toolbar-fn"));

        if (_fn != "" && util_isDefined(_fn)) {
            _fn = eval(_fn);
            _fn(_element);
        }
    });
}

function renderer_popup(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "popup");

    _list.attr("href", "javascript: void(0);");

    js_bindClick(_list, function (e) {
        var _element = $(this);
        var _isDisabled = util_forceValidEnum(_element.attr(DATA_ATTR_POPUP_DISABLED), enCETriState, enCETriState.None);

        if (_isDisabled != enCETriState.Yes) {
            var _id = util_forceString(_element.attr("id"));
            var _contentID = util_forceString(_element.attr(DATA_ATTR_POPUP_CONTENT), "");
            var _isForceAbsolute = util_forceValidEnum(_element.attr(DATA_ATTR_POPUP_POSITION_FORCE_ABSOLUTE), enCETriState, enCETriState.None);  //backward compatible requirement
            var _html = "";

            if (_contentID != "") {
                var _content = $mobileUtil.GetElementByID(_contentID);

                if (_content.length == 1) {
                    _html = _content.html();
                }
            }

            var _popup = $mobileUtil.PopupContainer();
            var _options = { transition: "fade", x: 0, y: 0, positionTo: "origin" };

            var _position = _element.position();

            if (_isForceAbsolute != enCETriState.Yes || util_isNullOrUndefined(_element.attr(DATA_ATTR_POPUP_POSITION_X))) {
                _options.x = _position.left + (_element.width() / 2);
            }
            else {
                _options.x = util_forceFloat(_element.attr(DATA_ATTR_POPUP_POSITION_X), 0);
            }

            if (_isForceAbsolute != enCETriState.Yes || util_isNullOrUndefined(_element.attr(DATA_ATTR_POPUP_POSITION_Y))) {
                _options.y = _position.top;
            }
            else {
                _options.y = util_forceFloat(_element.attr(DATA_ATTR_POPUP_POSITION_Y), 0);
            }

            _popup.html(_html == "" ? "&nbsp;<br />" : _html);

            //set the current element's ID that has invoked the popup (or the content ID if the element's ID is not specified)
            _popup.attr(DATA_ATTR_POPUP_SOURCE_ELEMENT, _id != "" ? _id : _contentID);

            //set the attribute for the open callback
            _popup.attr(DATA_ATTR_POPUP_EVENT_CALLBACK_OPEN, util_forceString(_element.attr(DATA_ATTR_POPUP_EVENT_CALLBACK_OPEN)));

            _popup.attr(DATA_ATTR_POPUP_EVENT_CALLBACK_CLOSE, util_forceString(_element.attr(DATA_ATTR_POPUP_EVENT_CALLBACK_CLOSE)));

            $mobileUtil.PopupOpen(_options);
        }

        return false;
    });
}

function renderer_popupLinks(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "popup_links");

    $.each(_list, function (index) {
        var _element = $(this);
        var _contentID = util_forceString(_element.attr(DATA_ATTR_POPUP_CONTENT), "");
        var _openCallbackJS = util_forceString(_element.attr(DATA_ATTR_POPUP_EVENT_CALLBACK_OPEN), "");
        var _closeCallbackJS = util_forceString(_element.attr(DATA_ATTR_POPUP_EVENT_CALLBACK_CLOSE), "");
        var _isForceAbsolute = util_forceValidEnum(_element.attr(DATA_ATTR_POPUP_POSITION_FORCE_ABSOLUTE), enCETriState, enCETriState.None);
        var _positionX = util_forceString(_element.attr(DATA_ATTR_POPUP_POSITION_X), "");
        var _positionY = util_forceString(_element.attr(DATA_ATTR_POPUP_POSITION_Y), "");

        var _isDashboardMode = (util_forceValidEnum(_element.attr(DATA_ATTR_POPUP_LINKS_IS_DASHBOARD_MODE), enCETriState, enCETriState.None) == enCETriState.Yes);

        var _fn = util_forceString(_element.attr(DATA_ATTR_POPUP_LINKS_EVENT_CALLBACK_ITEMS));
        var _arr = [];

        if (_fn != "" && util_isDefined(_fn)) {
            _fn = eval(_fn);
            _arr = _fn(_element);   //retrieve the items to be displayed for the popup link
        }

        if (_contentID != "") {

            var _html = "";

            _html += "<ul " + (_isDashboardMode ? "class='PopupLinksContentContainer'" : "data-role='listview' data-inset='true'") + ">";

            var _hasDialogLinks = false;

            for (var i = 0; i < _arr.length; i++) {
                var _item = _arr[i];

                var _dividerContent = util_forceString(_item["DividerText"], "");
                var _isHTML = util_forceBool(_item["IsHTML"], false);
                var _dataTheme = util_forceString(_item["DividerTheme"], "b");
                var _groupItemDataTheme = util_forceString(_item["GroupItemTheme"], "");
                var _groupExtAttributes = util_forceString(_item["ExtAttributes"], "");

                if (_dividerContent != "") {
                    _dividerContent = (_isHTML ? _dividerContent : util_htmlEncode(_dividerContent));

                    _html += "<li " + (_isDashboardMode ? "class='PopupLinksItem PopupLinksDivider PopupLinksTheme-" + _dataTheme + "'" :
                                                          "data-role='divider' " + util_htmlAttribute("data-theme", _dataTheme)) +
                             (_groupExtAttributes != "" ? " " + _groupExtAttributes : "") +
                             ">" + _dividerContent + "</li>";  //sub heading group divider
                }

                var _groupItems = _item["Items"];

                if (_groupItems == null || _groupItems == undefined) {
                    _groupItems = [];
                }

                var _attrGroupItemDataTheme = (_groupItemDataTheme != "" ?
                                               " data-theme=\"" + util_jsEncode(_groupItemDataTheme) + "\" " :
                                               "");

                for (var j = 0; j < _groupItems.length; j++) {
                    var _groupItem = _groupItems[j];
                    var _linkID = util_forceString(_groupItem["ID"], "item_" + j);
                    var _linkContent = util_forceString(_groupItem["Text"], "");
                    var _linkExtAttributes = util_forceString(_groupItem["ExtAttributes"], "");
                    var _isPopup = util_forceBool(_groupItem["IsPopup"], false);
                    var _href = util_forceString(_groupItem["Href"], "javascript: void(0);");

                    _html += "<li " + (_isDashboardMode ? ("class='PopupLinksItem" + (_groupItemDataTheme != "" ? " PopupLinksTheme-" + _groupItemDataTheme : "") + "'") :
                                                          _attrGroupItemDataTheme
                                     ) + ">";

                    if (_isPopup) {
                        var _popupSetting = _groupItem["PopupSetting"];

                        if (_popupSetting == null || _popupSetting == undefined) {
                            _popupSetting = { DialogMode: enCDialogMode.Normal,
                                CssClass: null, AttributeStr: null
                            };
                        }

                        var _strAttr = util_forceString(_popupSetting["AttributeStr"]);

                        _strAttr += (_linkExtAttributes != "" ? " " + _linkExtAttributes : "");

                        _strAttr += (_strAttr != "" ? " " : "") + util_htmlAttribute(CONTROL_DATA_ATTR_POPUP_LINKS_ITEM_ID, _linkID);

                        _html += $mobileUtil.HtmlDialogLink(util_htmlEncode(_linkContent), _href, _linkContent,
                                                            _popupSetting["DialogMode"], _popupSetting["CssClass"], _strAttr, false);

                        _hasDialogLinks = true;
                    }
                    else {
                        _linkContent = (_isHTML ? _linkContent : util_htmlEncode(_linkContent));

                        _html += "<a href=\"" + _href + "\" " +
                                 CONTROL_DATA_ATTR_POPUP_LINKS_ITEM_ID + "=\"" + _linkID + "\"" + (_linkExtAttributes != "" ? " " + _linkExtAttributes : "") + ">" +
                                 _linkContent +
                                 "</a>";
                    }

                    _html += "</li>";
                }
            }

            _html += "</ul>";

            var _placeholder = $mobileUtil.GetElementByID(_contentID);
            _placeholder.html(_html);

            if (_hasDialogLinks && !_isDashboardMode) {
                $mobileUtil.InitDialog(_placeholder);
            }
        }

        if (!_isDashboardMode) {
            $mobileUtil.PopupConfigure(_element, _contentID, _openCallbackJS, _isForceAbsolute, _positionX, _positionY, _closeCallbackJS);
        }
        else {

            _element.unbind("click.dashboard_popup_links");
            _element.bind("click.dashboard_popup_links", function () {
                var _btn = $(this);

                var _fnProcessCallback = function (strCallbackJS) {

                    strCallbackJS = util_forceString(strCallbackJS);

                    if (strCallbackJS != "") {
                        var _fnResult = eval(strCallbackJS);

                        //based on the eval result of the callback JS, if it is a function then it needs to be explicitly invoked
                        if ($.isFunction(_fnResult)) {

                            var _settings = {};

                            _settings["SourceID"] = _contentID;
                            _settings["Container"] = $mobileUtil.DashboardContainer();
                            _settings["GetLinks"] = function () {

                                var _list = $mobileUtil.DashboardContainer().find("a[" + CONTROL_DATA_ATTR_POPUP_LINKS_ITEM_ID + "]");

                                return _list.not("[" + DATA_ATTRIBUTE_RENDER + "='dialog']");
                            };

                            _settings["GetLinkByID"] = function (searchLinkID) {
                                var _retLink = this.GetLinks().filter("[" + util_htmlAttribute(CONTROL_DATA_ATTR_POPUP_LINKS_ITEM_ID, searchLinkID) + "]");

                                return _retLink;
                            };

                            _fnResult(_settings);
                        }
                    }

                };

                var _renderOptions = { "DashboardFactor": 0.24, "DashboardAnchor": "right", "DashboardCssClass": "PopupLinksToolsDashboard", "DashboardAnimation": "slide",
                    "DashboardAnimationDuration": 750, "DashboardHeaderHTML": "", "DashboardFooterHTML": "",
                    "ToggleUserDisplayNameHeading": false
                };

                var _fnOptions = util_forceString(_btn.attr(DATA_ATTR_POPUP_LINKS_DASHBOARD_OPENS_CALLBACK));

                if (util_isFunction(_fnOptions)) {
                    _fnOptions = eval(_fnOptions);

                    var _temp = util_extend({}, _renderOptions);

                    _temp = _fnOptions(_temp);

                    _renderOptions = util_extend(_renderOptions, _temp);
                }

                if ($mobileUtil.DashboardIsOpen()) {
                    $mobileUtil.DashboardClose({ "anchor": _renderOptions["DashboardAnchor"], "animation": _renderOptions["DashboardAnimation"],
                        "duration": _renderOptions["DashboardAnimationDuration"]
                    }, function () {
                        _fnProcessCallback(_closeCallbackJS);
                    });
                }
                else {

                    var _dashboardOptions = {};

                    _dashboardOptions["factor"] = _renderOptions["DashboardFactor"];
                    _dashboardOptions["anchor"] = _renderOptions["DashboardAnchor"];
                    _dashboardOptions["cssClass"] = _renderOptions["DashboardCssClass"];
                    _dashboardOptions["animation"] = _renderOptions["DashboardAnimation"];
                    _dashboardOptions["duration"] = _renderOptions["DashboardAnimationDuration"];

                    $mobileUtil.DashboardOpen(_dashboardOptions, function () {
                        var _dashboardContainer = $mobileUtil.DashboardContainer();

                        var _contentID = util_forceString(_btn.attr(DATA_ATTR_POPUP_CONTENT));
                        var _html = "";

                        var _contentElement = null;

                        _html += util_forceString(_renderOptions["DashboardHeaderHTML"]);

                        if (util_forceBool(_renderOptions["ToggleUserDisplayNameHeading"], false)) {
                            var _userDetail = global_AuthUserDetail();

                            if (!util_isNullOrUndefined(_userDetail)) {
                                _html += "<div class='PopupLinksToolsDashboardUserDisplayName'>" +
                                         util_htmlEncode(util_forceString(_userDetail[enColUserProperty.LastName]) + ", " +
                                         util_forceString(_userDetail[enColUserProperty.FirstName])) +
                                         "</div>";
                            }
                        }

                        if (_contentID != "") {
                            _contentElement = $mobileUtil.GetElementByID(_contentID);
                        }

                        if (_contentElement != null && _contentElement.length == 1) {
                            _html += util_forceString(_contentElement.html());
                        }

                        _html += util_forceString(_renderOptions["DashboardFooterHTML"]);

                        _dashboardContainer.html(_html);
                        $mobileUtil.refresh(_dashboardContainer);

                        _fnProcessCallback(_openCallbackJS);

                    }, _btn);
                }

            });
        }
    });
}

function renderer_watermark(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "watermark");

    if (!$browserUtil.IsAttributeInputPlaceholderSupport()) {
        var _fnGetCssClass = function (obj) {
            return util_forceString($(obj).attr(CONTROL_DATA_ATTR_WATERMARK_TOGGLE_CLASS), "InputWatermark");
        };

        util_jsBindEvent(_list, "focus", function () {
            var _this = $(this);

            _this.removeClass(_fnGetCssClass(_this));
        });

        util_jsBindEvent(_list, "blur", function () {
            var _this = $(this);
            var _val = _this.val();

            if (_val == "") {
                _this.addClass(_fnGetCssClass(_this));
            }
        });

        _list.removeAttr("placeholder");

        $.each(_list, function (index) {
            var _this = $(this);
            var _value = _this.val();

            if (_value == "") {
                _this.trigger("blur");
            }
            else {
                _this.trigger("focus");
            }
        });
    }
}

function renderer_label_module_name(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "label_module_name");

    var _title = (options ? options["Title"] : null);
    var _isHTML = (options ? util_forceBool(options["IsHTML"], false) : false);

    //check if there is an override title from the module parameters
    if (MODULE_MANAGER.Current.Parameters && MODULE_MANAGER.Current.Parameters["LabelModuleTitle"]) {
        _title = MODULE_MANAGER.Current.Parameters["LabelModuleTitle"];
        _isHTML = util_forceBool(MODULE_MANAGER.Current.Parameters["LabelModuleTitleIsHTML"], _isHTML);
    }

    if (_title == null || _title == undefined) {
        var _moduleDetail = MODULE_DETAILS[MODULE_MANAGER.Current.ModuleID];

        if (_moduleDetail != null && _moduleDetail != undefined) {
            _title = util_forceString(_moduleDetail[enColCModuleDetailProperty.DisplayName], "");

            if (_title == "") {
                _title = util_forceString(_moduleDetail[enColCModuleDetailProperty.Name], "");
            }
        }

        _isHTML = false;
    }

    if (_isHTML) {
        _list.html(_title);
    }
    else {
        _list.text(_title);
    }
}

function renderer_data_admin_list(context, options) {
    context = global_forceContext(context);
    options = renderer_forceOptions(options);

    var _list = renderer_getFilteredList(context, "data_admin_list");

    $.each(_list, function (index) {
        var _element = $(this);
        var _html = "";
        var _repeaterSetting = _element.find("[data-attr-data-template=setting]");
        var _repeaterID = _repeaterSetting.find("[data-attr-data-template-id]").attr("data-attr-data-template-id");

        _repeaterSetting.hide();

        _html += "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%;\">";

        //add new link row, if applicable (enabled by default)

        if (util_forceInt(_repeaterSetting.attr("data-attr-toggle-add-new-link"), 1) == 1) {
            var _hrefAddNewItem = "";

            _hrefAddNewItem = util_constructModuleURL(eval(_repeaterSetting.attr("data-attr-add-new-module-id")), eval(_repeaterSetting.attr("data-attr-add-new-module-view-type")),
                                                 _repeaterSetting.attr("data-attr-add-new-ctrl-name"));

            _hrefAddNewItem = util_appendFragmentQS(_hrefAddNewItem, "EditID", enCE.None);
            _hrefAddNewItem = util_appendFragmentQS(_hrefAddNewItem, "TemplateParams", util_forceString(_repeaterSetting.attr("data-attr-add-new-module-params")));
            _hrefAddNewItem = util_appendFragmentQS(_hrefAddNewItem, "TemplateSourceModuleID", MODULE_MANAGER.Current.ModuleID);

            _hrefAddNewItem = util_constructPopupURL(_hrefAddNewItem);

            var _addNewCaption = util_forceString(_repeaterSetting.attr("data-attr-add-new-caption"), MSG_CONFIG.LinkAddNew);
            var _addNewPopupTitle = util_forceString(_repeaterSetting.attr("data-attr-add-new-popup-title"), "");

            if (_addNewPopupTitle == "") {
                _addNewPopupTitle = MSG_CONFIG.DialogEditTitle;
            }

            var _addNewButtonAttrs = "";

            _addNewButtonAttrs = util_htmlAttribute(DATA_ATTR_DIALOG_IS_NO_CONFLICT_VIEW,
                                                    util_forceInt(_repeaterSetting.attr("data-attr-add-new-dialog-is-no-conflict"), enCETriState.None));

            var _arrButtonExtAttr = ["data-attr-popup-open-param-MaxWidthRatio", "data-attr-allow-event-propagation"];

            for (var a = 0; a < _arrButtonExtAttr.length; a++) {

                var _attrName = _arrButtonExtAttr[a];
                var _val = _repeaterSetting.attr(_attrName);

                if (!util_isNullOrUndefined(_val)) {
                    _addNewButtonAttrs += " " + util_htmlAttribute(_attrName, _val);
                }
            }

            var _optDialogLink = {
                "ContentHTML": _addNewCaption,
                "Href": _hrefAddNewItem,
                "Title": _addNewPopupTitle,
                "DialogMode": eval(_repeaterSetting.attr("data-attr-add-new-dialog-mode")),
                "CssClass": null,
                "AttributeStr": _addNewButtonAttrs,
                "ToggleDefaultAttributes": true
            };

            if ($mobileUtil.Configuration.RendererGetOption && $mobileUtil.Configuration.RendererGetOption["data_admin_list"]) {
                $mobileUtil.Configuration.RendererGetOption.data_admin_list({ "Type": "AddNewDialogLink", "DefaultOptions": _optDialogLink });
            }

            _html += "<tr>";
            _html += "<td align=\"right\">";
            _html += "<div style=\"float: right;\" " + util_htmlAttribute("data-attr-admin-list-add-button", enCETriState.Yes) + ">" +
                     $mobileUtil.HtmlDialogLink(_optDialogLink.ContentHTML, _optDialogLink.Href, _optDialogLink.Title, _optDialogLink.DialogMode, _optDialogLink.CssClass,
                                                _optDialogLink.AttributeStr, _optDialogLink.ToggleDefaultAttributes) +
                     "</div>";
            _html += "</td>";
            _html += "</tr>";
        }

        //repeater row
        _html += "<tr>";
        _html += "<td>";

        var _str = util_replaceAll(_repeaterSetting.html(), "data-attr-data-template-renderer", DATA_ATTRIBUTE_RENDER);
        _str = util_replaceAll(_str, "data-attr-data-template-id", "id");
        _str = util_replaceAll(_str, "%%TEMPLATE_CONTENT_DELETE%%", "<a id=\"clDelete_" + _repeaterID + "\" href=\"#\" data-role=\"button\" data-icon=\"delete\" " +
                               "data-theme=\"b\" data-corners=\"false\" data-mini=\"true\">Delete</a>");
        _html += _str;

        _html += "</td>";
        _html += "</tr>";

        _html += "</table>";

        var $templateContent = _element.find("[data-attr-data-template=content]");
        
        $templateContent.html(_html);

        var $clAddNew = $templateContent.find("[" + util_htmlAttribute("data-attr-admin-list-add-button", enCETriState.Yes) + "] [" + util_renderAttribute("dialog") + "]");

        //associate the module parameters from the element to the target add dialog button (to allow custom binds and options for the dialog module load)
        $clAddNew.data(ELEMENT_DOM_DATA_MODULE_PARAMS, _element.data(ELEMENT_DOM_DATA_MODULE_PARAMS));

        //configure the repeater renderer element data values from parent element
        var $tbl = _element.find("[" + DATA_ATTRIBUTE_RENDER + "]");

        $tbl.data("DefaultNoRecordsHTML", _element.data("DefaultNoRecordsHTML"));

        //util_log("renderer_event_data_admin_list_bind_" + _repeaterID);

        if (!_element.data("is-init")) {
            _element.data("is-init", true);

            _element.off("events.prompt_refresh");
            _element.on("events.prompt_refresh", function (e, args) {

                var _callback = function () {
                    if (args.Callback) {
                        args.Callback();
                    }
                };

                args = util_extend({
                    "IsEnabled": true,
                    "Message": "An unexpected error has occurred. Click here to refresh the list and try again.", "IsHTML": false, "Callback": null
                }, args);

                var $divOverlayRefresh = _element.find(".CRepeaterOverlay");

                if (args.IsEnabled) {
                    args.Message = util_forceString(args.Message);

                    if (!util_forceBool(args["IsHTML"], false)) {
                        args.Message = util_htmlEncode(args.Message);
                    }

                    if ($divOverlayRefresh.length == 0) {

                        $divOverlayRefresh = $("<div class='CRepeaterOverlay DisableUserSelectable'>" +
                                               "    <div class='CRepeaterMessage'>" + args.Message + "</div>" +
                                               "</div>");
                    }
                    else {
                        $divOverlayRefresh.find(".CRepeaterMessage")
                                          .html(args.Message);
                        $divOverlayRefresh.show();
                    }

                    _element.addClass("CRepeaterOverlayMode");
                    $templateContent.addClass("EffectBlur");

                    _element.append($divOverlayRefresh);

                    $divOverlayRefresh.off("click.refresh");
                    $divOverlayRefresh.on("click.refresh", function () {

                        //disable the prompt and refresh the list
                        _element.trigger("events.prompt_refresh", {
                            "IsEnabled": false, "Callback": function () {
                                renderer_event_data_admin_list_repeater_bind(_repeaterID);
                            }
                        });

                    });

                    _callback();
                }
                else {

                    //disable the prompt
                    $divOverlayRefresh.toggle("height").promise().done(function () {

                        _element.removeClass("CRepeaterOverlayMode");
                        $templateContent.removeClass("EffectBlur");

                        _callback();
                    });
                }
            });
        }

        var _isPersist = (util_forceInt(_element.attr("data-is-persist-delegate"), enCETriState.None) == enCETriState.Yes);

        MODULE_MANAGER.DelegateSettings.SetEvent(enCDelegateType.Repeater, "renderer_event_data_admin_list_bind_" + _repeaterID, function () {
            renderer_event_data_admin_list_repeater_bind(_repeaterID);
        }, _isPersist);
    });

    $mobileUtil.InitDialog(_list);
}

function renderer_file_upload(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "file_upload");

    $.each(_list, function (indx) {
        var _element = $(this);
        var _id = util_forceString(_element.attr("id"));
        var _width = Math.max(util_forceInt(_element.attr("data-attr-iframe-width"), -1), 350);
        var _height = Math.max(util_forceInt(_element.attr("data-attr-iframe-height"), -1), 65);
        var _hasExternalLinkSupport = (util_forceInt(_element.attr("data-attr-file-upload-can-link-external"), enCETriState.None) == enCETriState.Yes);

        var _url = "<SITE_URL>home/upload.aspx";

        _url = util_appendQS(_url, "FileExts", util_forceString(_element.attr("data-attr-file-upload-exts")));
        _url = util_appendQS(_url, "ElementRefID", util_forceString(_element.attr("data-attr-file-upload-ref-id")));
        _url = util_appendQS(_url, "IsUploadOnChange", util_forceString(_element.attr(CONTROL_FILE_UPLOAD_IS_FORCE_UPLOAD_ON_CHANGE)));
        _url = util_appendQS(_url, "MaxUploadSize", util_forceInt(_element.attr(CONTROL_FILE_UPLOAD_MAX_SIZE_KB)));
        _url = util_appendQS(_url, "CssClass", util_forceString(_element.attr("data-attr-file-upload-css-class")));

        var _html = "<iframe id='" + _id + "_file_upload" + "' class='CFileUploadContent' frameborder='0' scrolling='no' width='" + _width + "' height='" + _height + "' " +
                    "src=\"" + _url + "\"></iframe>";

        if (_hasExternalLinkSupport) {
            _html += "<div class='FileUploadExternalInputView'>" +
                     "  <label data-corners='false' data-mini='true'>" +
                     "      <input type='checkbox' data-mini='true' />" + util_htmlEncode("This is an externally located file or link") + "" +
                     "  </label>" +
                     "</div>";

            _html += "<div class='FileUploadExternalInputField'>" +
                     "  <input type='text' data-corners='false' data-mini='true' placeholder='External File / Link' />" +
                     "  <a class='LinkClickable ButtonTheme' data-role='button' data-theme='transparent' data-icon='plus' data-inline='true' data-mini='true'>" +
                     util_htmlEncode("Add") +
                     "  </a>" +
                     "</div>";
        }

        _element.html(_html);

        _element.unbind("remove.file_upload_cleanup");
        _element.bind("remove.file_upload_cleanup", function () {
            if (util_forceInt($(this).attr("file-upload-processed-remove")) != enCETriState.Yes) {
                var _fileUploads = renderer_getFilteredList($mobileUtil.ActivePage(), "file_upload");

                var _arr = [];

                $.each(_fileUploads, function (indx) {
                    var _lastUploadedFileName = util_forceString($(this).attr(CONTROL_FILE_UPLOAD_UPLOADED_FILE_NAME));

                    if (_lastUploadedFileName != "") {
                        _arr.push(_lastUploadedFileName);
                    }
                });

                //remove the last uploaded file name and set flag on all file upload renderer controls that the remove event has been processed
                _fileUploads.removeAttr(CONTROL_FILE_UPLOAD_UPLOADED_FILE_NAME);
                _fileUploads.attr("file-upload-processed-remove", enCETriState.Yes);

                if (_arr.length > 0) {
                    GlobalService.UserTempFileUploadCleanup(_arr);
                }
            }
        });

        _element.off("events.fileUpload_clear");
        _element.on("events.fileUpload_clear", function (e, args) {

            var _callback = function () {

                //check if custom DOM bound event is available since file upload was cleared
                var _clearCallback = _element.data("OnFileUploadClear");

                if (_clearCallback && util_isFunction(_clearCallback)) {
                    _clearCallback({ "Element": _element, "Callback": args.Callback });
                }
                else if (args.Callback) {
                    args.Callback();
                }

            };

            args = util_extend({
                "IsDeleteUploadFile": false, "Callback": null, "DefaultFileUploadURL": null, "DefaultFileUploadOriginalName": null, "DefaultFileUploadName": null
            }, args);

            var _lastUploadedFileName = util_forceString(_element.attr(CONTROL_FILE_UPLOAD_UPLOADED_FILE_NAME));

            _element.removeAttr(CONTROL_FILE_UPLOAD_UPLOADED_FILE_NAME);    //clear the last uploaded file name

            //reload the iframe (to clear the last uploaded file)
            if (_lastUploadedFileName != "" || util_forceString(args.DefaultFileUploadURL) != "") {

                var $frame = _element.find("iframe.CFileUploadContent");
                var _url = $frame.data("SourceURL");

                if (!$frame.data("SourceURL")) {
                    _url = $frame.attr("src");
                    $frame.data("SourceURL", _url);
                }

                if (util_forceString(args.DefaultFileUploadURL) != "") {
                    _url = util_appendQS(_url, "DefaultUploadURL", encodeURIComponent(args.DefaultFileUploadURL));
                    _url = util_appendQS(_url, "DefaultUploadFileOriginalName", encodeURIComponent(util_forceString(args.DefaultFileUploadOriginalName)));
                    _url = util_appendQS(_url, "DefaultUploadFileName", encodeURIComponent(util_forceString(args.DefaultFileUploadName)));
                }

                $frame.attr("src", _url);
            }

            //clear the toggle for external link (if applicable)
            var $cb = _element.find(".FileUploadExternalInputView input[type='checkbox']:first");

            if ($cb.length > 0) {
                var $tb = _element.find(".FileUploadExternalInputField input[type='text']");

                $tb.val("");

                if ($cb.prop("checked")) {
                    $cb.prop("checked", false)
                       .checkboxradio("refresh")
                       .trigger("change");
                }
            }

            if (args.IsDeleteUploadFile && _lastUploadedFileName != "") {
                GlobalService.UserTempFileUploadCleanup([_lastUploadedFileName], _callback, _callback);
            }
            else {
                _callback();
            }

        }); //end: events.fileUpload_clear

        _element.off("change.file_upload_onExtLinkToggle");
        _element.on("change.file_upload_onExtLinkToggle", ".FileUploadExternalInputView input[type='checkbox']", function (e, args) {

            args = util_extend({ "IsInit": false }, args);

            var $cb = $(this);
            var _checked = $cb.prop("checked");

            _element.toggleClass("StateOn", _checked);

            if (_checked && !args.IsInit) {
                var $tb = _element.find(".FileUploadExternalInputField input[type='text']");

                try {
                    $tb.trigger("focus");

                    var _tbElement = $tb.get(0);

                    _tbElement.select();
                } catch (e) {
                }
            }

            if (!args.IsInit) {
                var _extOpts = {};

                _element.trigger("events.fileUpload_optionsExternalFile", _extOpts);
                _extOpts = _extOpts["Result"];

                _element.trigger("events.fileUpload_onToggleExternalLink", _extOpts);
            }
        });

        _element.off("events.fileUpload_setExternalFile");
        _element.on("events.fileUpload_setExternalFile", function (e, args) {
            args = util_extend({ "HasExternalFile": true, "URL": null, "IsInit": true }, args);

            var $cb = _element.find(".FileUploadExternalInputView input[type='checkbox']:first");
            var $tb = _element.find(".FileUploadExternalInputField input[type='text']");

            $cb.prop("checked", args.HasExternalFile)
               .checkboxradio("refresh");

            $tb.val(util_trim(args.URL));

            $cb.trigger("change", { "IsInit": args.IsInit });

        }); //end: events.fileUpload_setExternalFile

        _element.off("events.fileUpload_optionsExternalFile");
        _element.on("events.fileUpload_optionsExternalFile", function (e, args) {
            var $cb = _element.find(".FileUploadExternalInputView input[type='checkbox']:first");
            var _result = {
                "HasExternalFile": $cb.prop("checked"),
                "URL": null,
                "Element": null
            };

            if (_result.HasExternalFile) {
                var $tb = _element.find(".FileUploadExternalInputField input[type='text']");

                var _url = util_trim($tb.val());

                if (args["IsForceURL"]) {
                    try {
                        if (_url != "") {
                            var _urlItem = $.url(_url);

                            if (_urlItem.attr("protocol") == "") {
                                _url = "http://" + _url;
                            }
                        }
                    } catch (e) {
                    }
                }

                _result.URL = _url;
                $tb.val(_url);

                _result.Element = $tb;
            }

            args["Result"] = _result;
        });

        if (_hasExternalLinkSupport) {
            var $input = _element.find(".FileUploadExternalInputField input[type='text']:first");
            var $clAdd = _element.find(".FileUploadExternalInputField > .LinkClickable:first");

            $input.off("blur.file_upload_onExtTextInput");
            $input.on("blur.file_upload_onExtTextInput", function (e) {
                var $this = $(this);
                var _extOpts = { "IsForceURL": true };

                _element.trigger("events.fileUpload_optionsExternalFile", _extOpts);
                _extOpts = _extOpts["Result"];

                _element.trigger("events.fileUpload_onBlurExtInput", _extOpts);

            }); //end: blur.file_upload_onExtTextInput

            $clAdd.off("click.file_upload_onExtAdd");
            $clAdd.on("click.file_upload_onExtAdd", function () {
                var _extOpts = { "IsForceURL": true };

                _element.trigger("events.fileUpload_optionsExternalFile", _extOpts);
                _extOpts = _extOpts["Result"];

                _element.trigger("events.fileUpload_onSubmitExtInput", _extOpts);

            }); //end: click.file_upload_onExtAdd

            util_configureKeyPress($input, KEY_CODES.ENTER, function (e, args) {
                try {
                    $input.trigger("blur.file_upload_onExtTextInput", e, args);
                } catch (e) {
                }
            });
        }
    });
}

//deprecated: use datepickerV2 instead
function renderer_datepicker(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "datepicker");

    $.each(_list, function (indx) {
        var _element = $(this);
        var _defaultDateTime = util_forceInt(_element.attr(CONTROL_DATA_ATTR_DATEPICKER_DEFAULT), -1);
        var _fnOnSelected = _element.attr(DATA_ATTR_DATE_PICKER_ON_SELECTED_CALLBACK);
        var _fnOnBlur = _element.attr(DATA_ATTR_DATE_PICKER_ON_BLUR_CALLBACK);
        var _fnConfigOptions = _element.attr(DATA_ATTR_DATE_PICKER_CONFIGURE_OPTIONS);
        var _isOverlayMode = (util_forceInt(_element.attr(DATA_ATTR_DATE_PICKER_IS_OVERLAY_MODE), enCETriState.Yes) == enCETriState.Yes);

        var _isDataFunctions = (util_forceInt(_element.attr("datepicker-is-data-functions"), enCETriState.None) == enCETriState.Yes);

        if (_isDataFunctions) {
            _fnOnSelected = function (args) {
                _element.trigger("events.datepicker_onSelected", args);
            };

            _fnOnBlur = function (args) {
                _element.trigger("events.datepicker_onBlur", args);
            };

            _fnConfigOptions = function (args) {
                _element.trigger("events.datepicker_setConfigOptions", args);
            };
        }
        else {

            if (util_isFunction(_fnOnSelected)) {
                _fnOnSelected = eval(_fnOnSelected);
            }
            else {
                _fnOnSelected = null;
            }

            if (util_isFunction(_fnOnBlur)) {
                _fnOnBlur = eval(_fnOnBlur);
            }
            else {
                _fnOnBlur = null;
            }

            if (util_isFunction(_fnConfigOptions)) {
                _fnConfigOptions = eval(_fnConfigOptions);
            }
            else {
                _fnConfigOptions = null;
            }
        }

        var _options = { changeMonth: true, changeYear: true,
            dateFormat: "M d, yy",
            beforeShow: function (input, inst) {
                $("body").addClass("jquery-ui ModeDatePicker");

                if (_isOverlayMode) {
                    $mobileUtil.ToggleOverlay(true, {
                        "Animate": false, "IsResponsive": true, "OnOverlayClick": function () {
                            $mobileUtil.ToggleOverlay(false);
                        }
                    });
                }

                setTimeout(function () {
                    $("#ui-datepicker-div").css("zIndex", CSS_OVERRIDE_DATEPICKER_ZINDEX);
                }, 500);
            },
            onClose: function () {

                if (_isOverlayMode) {
                    $mobileUtil.ToggleOverlay(false, { "Animate": false });
                }

                $("#ui-datepicker-div").hide(); //avoid "ghost" calendar
                $("body").removeClass("jquery-ui ModeDatePicker");
            },
            onSelect: _fnOnSelected,
            defaultDate: null
        };

        if (_fnConfigOptions != null) {

            if (_isDataFunctions) {
                _fnConfigOptions({ "Element": _element, "Options": _options });
            }
            else {
                var _tempOptions = _fnConfigOptions(_element, _options);

                if (!util_isNullOrUndefined(_tempOptions)) {
                    _options = _tempOptions;
                }
            }
        }

        var _html = "<table class='NoTableStyle' border='0' cellpadding='0' cellspacing='0'>";

        var _attrRefID = util_forceString(_element.attr("data-attr-datepicker-id"));

        if (_attrRefID == "") {
            _attrRefID = renderer_uniqueID();

            _element.attr("data-attr-datepicker-id", _attrRefID);
        }

        _html += "<tr>";

        var _attributes = { "data-inline": "true", "data-mini": null };
        var _textInputAttr = "";

        for (var _attr in _attributes) {
            var _attrValue = _element.attr(_attr);
            
            if (_attrValue !== null && _attrValue !== undefined) {
                _attributes[_attr] = _attrValue;
            }

            if (_attributes[_attr]) {
                _textInputAttr += " " + util_htmlAttribute(_attr, _attributes[_attr]);
            }
        }

        _html += "<td><input id=\"" + _attrRefID + "\" type=\"text\"" + _textInputAttr + " class=\"CDatePicker\" value=\"" +
                  (_defaultDateTime >= 0 ? $.datepicker.formatDate("M d, yy", new Date(_defaultDateTime)) : "") + "\"" +
                  (util_forceInt(_element.attr(CONTROL_DATA_ATTR_DATEPICKER_IS_EDIT_MODE), enCETriState.None) == enCETriState.No ? " readonly='readonly'" : "") +
                  " /></td>";

        _html += "<td><a data-mini=\"true\" data-role=\"button\" data-inline=\"true\" data-attr-datepicker-ref-id=\"" + _attrRefID + "\">...</a></td>";

        _html += "</tr>";

        _html += "</table>";

        _element.html(_html);

        if (_defaultDateTime >= 0) {
            _options.defaultDate = new Date(_defaultDateTime);
        }

        var _dtPicker = _element.find(".CDatePicker");

        _dtPicker.datepicker(_options);

        _dtPicker.unbind("blur.datepicker");

        if (_fnOnBlur != null) {
            _dtPicker.bind("blur.datepicker", _fnOnBlur);
        }

    });

    var _datePickers = _list.find(".CDatePicker");

    _datePickers.unbind("keypress");
    _datePickers.bind('keypress', function (e) {
        return false;
    });

    _datePickers.unbind("keydown");
    _datePickers.bind('keydown', function (e) {

        var _keycode = null;
        var _allowEditMode = true;

        if (e == null) { // IE
            _keycode = event.keyCode;
        } else { // Mozilla
            _keycode = e.which;
        }

        var _tb = $(this);
        var _container = _tb.closest("[" + util_renderAttribute("datepicker") + "]");

        _allowEditMode = (util_forceInt(_container.attr(CONTROL_DATA_ATTR_DATEPICKER_IS_EDIT_MODE), enCETriState.None) != enCETriState.No);

        if (_allowEditMode && (_keycode == KEY_CODES.BACKSPACE || _keycode == KEY_CODES.DELETE)) {

            if (!_allowEditMode) {

                try {
                    $(this).val("");
                    $(this).trigger("blur.datepicker");
                } catch (e) {

                }
            }
        }

        return _allowEditMode;
    });
    
    js_bindClick(_list.find("a[data-attr-datepicker-ref-id]"), function () {
        var _datePickerRefID = $(this).attr("data-attr-datepicker-ref-id");

        $mobileUtil.GetElementByID(_datePickerRefID).datepicker("show");

        return false;
    });
}

function renderer_datepickerV2(context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "datepickerV2");

    $.each($list, function (indx) {
        var $element = $(this);

        if (!$element.data("data-datepicker-init")) {
            $element.data("data-datepicker-init", true);

            var _html = "<div class='CDatePicker ViewModeInline DisableUserSelectable'>" +
                        "   <div class='Label'>" +
                        "       <span data-action-id='label'>&nbsp;</span>" +
                        "   </div>" +
                        "   <a data-action-id='open' data-role='button' data-theme='transparent' data-iconpos='notext' data-icon='grid' title='Enter date' />" +
                        "</div>";

            $element.html(_html)
                    .trigger("create");

            var $parent = $element.children(".CDatePicker");
            var $lbl = $parent.find(".Label:first > span");

            $element.off("events.datepicker_init");
            $element.on("events.datepicker_init", function (e, args) {
                args = util_extend({ "DefaultValue": null, "IsReloadState": false }, args);

                var _value = args.DefaultValue;

                if (util_isNullOrUndefined(_value)) {

                    //check the element for the date value
                    _value = $element.data("DateDefaultValue");
                }

                if (args.IsReloadState) {
                    $element.removeAttr("data-datepicker-fallback-focus-date");
                }

                $element.trigger("datepicker_setValue", { "Value": _value });
            });

            $element.off("events.datepicker_getOptions");
            $element.on("events.datepicker_getOptions", function (e, args) {
                if (!args) {
                    args = {};
                }

                var _options = {
                    "MonthList": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                    "DayWeekList": ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
                    "OffsetYear": 10,
                    "HasMonthSelection": (util_forceInt($element.attr("data-datepicker-has-month-selection"), enCETriState.None) == enCETriState.Yes),
                    "IsCurrentModeMonthSelection": function () {
                        return (this.HasMonthSelection &&
                                util_forceInt($element.attr("data-datepicker-is-month-selection-on"), enCETriState.None) == enCETriState.Yes);
                    },
                    "FormatStr": util_forceString($element.attr("data-datepicker-format-str")),
                    "FormatStrMonthView": util_forceString($element.attr("data-datepicker-format-str-month-view")),
                    "ParseValue": function (value) {
                        var _ret = "";

                        if (util_isNullOrUndefined(value)) {
                            _ret = null;
                        }
                        else if (typeof value === "number") {

                            //force a numberic tick value
                            _ret = util_forceInt(value, -1);

                            if (_ret <= 0) {
                                _ret = null;
                            }
                            else {
                                _ret = new Date(_ret);
                            }
                        }
                        else if (typeof value == "string") {
                            _ret = Date.parseFormatted(value, this.FormatStr);
                        }
                        else if (typeof value === "object") {
                            _ret = value;
                        }

                        return _ret;
                    },
                    "FormattedValue": function (dt, isLabelMode) {
                        var _str = null;

                        if (isLabelMode && _options.IsCurrentModeMonthSelection()) {
                            _str = Date.format(dt, this.FormatStrMonthView);
                        }
                        else {
                            _str = Date.format(dt, this.FormatStr);
                        }

                        return _str;
                    },
                    "GetDateValue": function () {
                        var _ret = $element.data("DatePickerValue");

                        if (util_isNullOrUndefined(_ret)) {
                            _ret = null;
                        }

                        return _ret;
                    }
                };

                if (_options.FormatStr == "") {
                    _options.FormatStr = "MMM dd, yyyy";
                }

                if (_options.FormatStrMonthView == "") {
                    _options.FormatStrMonthView = "MMM yyyy";
                }

                util_extend(args, _options, true);

                if (!args["IsPrimitiveType"]) {
                    args["Value"] = {
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

                    var _dt = args.GetDateValue();

                    if (_dt) {
                        args.Value.Month = _dt.getMonth();
                        args.Value.Year = _dt.getFullYear();

                        if (args.IsCurrentModeMonthSelection()) {
                            args.Value.Day = null;
                        }
                        else {
                            args.Value.Day = _dt.getDate();
                        }
                    }
                }
            });

            $element.off("events.datepicker_setValue");
            $element.on("events.datepicker_setValue", function (e, args) {
                args = util_extend({ "Value": null, "IsUserSelection": false, "IsFullDate": true, "IsRefreshLabel": false }, args);

                var _value = args.Value;
                var _str = "";
                var _options = {};

                $element.trigger("events.datepicker_getOptions", _options);

                if (args.IsRefreshLabel) {
                    _value = _options.GetDateValue();
                }

                if (!args.IsRefreshLabel && !args.IsUserSelection) {
                    if (!_options.HasMonthSelection || args.IsFullDate) {
                        $element.removeAttr("data-datepicker-is-month-selection-on");
                    }
                    else if (!args.IsFullDate) {
                        $element.attr("data-datepicker-is-month-selection-on", enCETriState.Yes);
                    }
                }

                _value = _options.ParseValue(_value);

                if (_value == null) {
                    _str = "Not Available";
                }
                else {
                    _str = _options.FormattedValue(_value, true);
                }

                $lbl.text(_str);
                $element.data("DatePickerValue", _value);

                if (!args.IsRefreshLabel && args.IsUserSelection) {
                    $element.trigger("events.datepicker_onSelected", { "Element": $element, "Value": _value });
                }
            });

            $element.off("click.datepicker_show");
            $element.on("click.datepicker_show", ".CDatePicker", function (e, args) {
                if ($element.hasClass("LinkDisabled")) {
                    return;
                }

                $element.addClass("LinkDisabled");

                //remove previous instance, if applicable
                var $container = $($element.data("Popup"));

                if ($container.length == 1) {
                    $container.addClass("IsRemoveTriggered")
                              .remove();
                }

                var _html = "";
                var _options = {};

                $element.trigger("events.datepicker_getOptions", _options);

                _html += "<div class='ApplicationFont DatePickerPopupView DisableUserSelectable'>" +
                         "  <div class='Overlay DisableUserSelectable' />";

                //calendar contents
                _html += "  <div class='Popup" + (_options.HasMonthSelection ? " ViewModeMonthSelection" : "") + "'>" +
                         "      <div class='Banner'>" +
                         "          <div class='Title' data-control-id='label_year'>&nbsp;</div>" +
                         "          <div class='SubTitle' data-control-id='label_date'>&nbsp;</div>" +
                         "      </div>";

                _html += "      <div class='Toolbar'>" +
                         "          <a data-control-id='nav_prev' data-role='button' data-theme='transparent' data-icon='arrow-l' data-iconpos='notext' data-inline='true' " +
                         "title='Previous' />" +
                         "          <select data-control-id='month' data-theme='transparent' data-corners='false' data-mini='true' />" +
                         "          <select data-control-id='year' data-theme='transparent' data-corners='false' data-mini='true' />" +
                         "          <a data-control-id='nav_next' data-role='button' data-theme='transparent' data-icon='arrow-r' data-iconpos='notext' data-inline='true' " +
                         "title='Next' />" +
                         "      </div>";


                _html += "      <div class='Content'>" +
                         "          <div class='HeadingDays'>";

                for (var d = 0; d < _options.DayWeekList.length; d++) {
                    var _day = _options.DayWeekList[d];

                    _html += "<div class='Cell'>" +
                             "  <div class='Label'>" +
                             "      <span>" + util_htmlEncode(_day) + "</span>" +
                             "  </div>" +
                             "</div>";
                }

                _html += "          </div>";

                _html += "          <div class='Month'>";

                for (var d = 1; d <= 31; d++) {
                    _html += "<div class='Cell DayDetail DayDetail_" + d + "' " + util_htmlAttribute("data-calendar-day", d) + ">" +
                             "  <div class='Label'>" +
                             "      <span>" + util_htmlEncode(d) + "</span>" +
                             "  </div>" +
                             "</div>";
                }

                _html += "          </div>";    //end: Month view

                //year month list view
                _html += "          <div class='MonthListView'>";

                for (var m = 0; m < _options.MonthList.length; m++) {
                    var _month = _options.MonthList[m];

                    if (_month.length > 3) {
                        _month = _month.substr(0, 3);
                    }

                    _html += "<div class='Cell MonthDetail MonthDetail_" + m + "' " + util_htmlAttribute("data-calendar-month", m) + ">" +
                             "  <div class='Label'>" +
                             "      <span>" + util_htmlEncode(_month) + "</span>" +
                             "  </div>" +
                             "</div>";

                    if ((m + 1) % 4 == 0 && m != _options.MonthList.length - 1) {
                        _html += "<div class='Divider' />";
                    }
                }

                _html += "          </div>";

                _html += "      </div>";    //end: Content view

                //footer
                _html += "  <div class='Footer'>" +
                         "      <label>" +
                         "          <input data-control-id='toggle_month' type='checkbox' data-theme='transparent' data-mini='true' />Month selection" +
                         "      </label>" +
                         "  </div>";

                _html += "  </div>";

                _html += "</div>";

                $container = $(_html);
                $container.hide();

                $("body").append($container);
                $container.trigger("create");

                $element.data("Popup", $container);

                $container.on("remove.datepicker_cleanup", function () {
                    $(window).off("resize.datepicker_popup");

                    if ($(this).hasClass("IsRemoveTriggered") == false) {
                        $element.removeClass("LinkDisabled");
                    }
                });

                var $overlay = $container.children(".Overlay");
                var $popup = $container.children(".Popup");
                var $month = $popup.find(".Month");
                var $monthListView = $popup.find(".MonthListView");
                var $ddlMonth = $popup.find("select[data-control-id='month']");
                var $ddlYear = $popup.find("select[data-control-id='year']");
                var $lblYear = $popup.find("[data-control-id='label_year']");
                var $lblDate = $popup.find("[data-control-id='label_date']");
                var $cbMonth = $popup.find("[data-control-id='toggle_month']");

                $ddlMonth.closest(".ui-select").addClass("DatePickerMonthInput");

                $popup.off("events.datepicker_positionPopup");
                $popup.on("events.datepicker_positionPopup", function () {
                    var _position = $parent.offset();

                    _position.top += $parent.outerHeight();

                    //check if the height of the popup exceeds the height of the window
                    var _maxHeight = 0;

                    if (typeof (window.innerHeight) == 'number') {
                        _maxHeight = window.innerHeight;
                    }
                    else {
                        if (document.documentElement && document.documentElement.clientHeight) {
                            _maxHeight = document.documentElement.clientHeight;
                        }
                        else {
                            if (document.body && document.body.clientHeight) {
                                _maxHeight = document.body.clientHeight;
                            }
                        }
                    }

                    if ((_position.top + $popup.outerHeight()) > _maxHeight) {
                        _position.top = Math.max($parent.offset().top - $popup.outerHeight(), 0);
                    }

                    $popup.css({ "top": _position.top + "px", "left": _position.left + "px" });

                }); //end: events.datepicker_positionPopup

                $popup.trigger("events.datepicker_positionPopup");

                $popup.hide();
                $container.show();

                $popup.off("events.datepicker_renderMonth");
                $popup.on("events.datepicker_renderMonth", function (e, args) {

                    args = util_extend({ "MonthIndex": -1, "Year": -1, "DateValue": null, "IsBannerRefresh": false }, args);

                    var _monthOpts = _fnGetCurrentMonthOptions();
                    var $vw = (_monthOpts.IsModeMonthSelection ? $monthListView : $month);

                    if (!args.IsBannerRefresh) {

                        if (args.DateValue) {
                            args.MonthIndex = args.DateValue.getMonth();
                            args.Year = args.DateValue.getFullYear();
                        }

                        if (args.Year <= 0) {
                            var _now = new Date();

                            args.MonthIndex = _now.getMonth();
                            args.Year = _now.getFullYear();
                        }

                        if (args.MonthIndex < 0 || args.MonthIndex > 11) {
                            args.MonthIndex = 0;
                        }

                        var _monthIndex = args.MonthIndex;
                        var _selectedYear = args.Year;
                        var _firstDate = new Date(_selectedYear, _monthIndex, 1);
                        var _lastDate = new Date(_selectedYear, _monthIndex + 1, 0);    //last day of the current month
                        var _firstDayWeekIndex = _firstDate.getDay();   //note: returns Sun = 0, Mon = 1, etc.

                        var _maxDate = _lastDate.getDate();
                        var _selectorHidden = "";

                        var $dates = $month.data("ElementDates");

                        if (!$dates || $dates.length == 0) {
                            $dates = $month.find(".DayDetail");
                            $month.data("ElementDates", $dates);
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
                            var _dateVal = _prevMonthDate.getDate();

                            _placeholderHTML = "<div class='Cell DayDetailPlaceholder' " + util_htmlAttribute("data-attr-offset-month", -1) + " " +
                                               util_htmlAttribute("data-calendar-day", _dateVal) + ">" +
                                               "   <div class='Label'>" + "<span>" + _dateVal + "</span>" + "</div>" +
                                               "</div>" + _placeholderHTML;

                            _prevMonthDate.setDate(_prevMonthDate.getDate() - 1);
                        }

                        $month.prepend(_placeholderHTML);

                        //set next month placeholder dates
                        var _nextMonthDate = new Date(_lastDate);
                        _nextMonthDate.setDate(_lastDate.getDate() + 1);    //first day of the next month

                        _placeholderHTML = "";

                        for (var p = 0; p < (_options.DayWeekList.length - _lastDate.getDay() - 1) && p >= 0; p++) {
                            var _dateVal = _nextMonthDate.getDate();

                            _placeholderHTML += "<div class='Cell DayDetailPlaceholder' " + util_htmlAttribute("data-attr-offset-month", 1) + " " +
                                                util_htmlAttribute("data-calendar-day", _dateVal) + ">" +
                                                "   <div class='Label'>" + "<span>" + _dateVal + "</span>" + "</div>" +
                                                "</div>";

                            _nextMonthDate.setDate(_nextMonthDate.getDate() + 1);
                        }

                        $month.append(_placeholderHTML);

                        var $list = $month.children(".Cell:not(.EditorElementHidden)");

                        $.each($list, function (index) {
                            if (index > 0 && index % 7 == 0) {
                                $("<div class='Divider' />").insertBefore(this);
                            }
                        });

                        //update dropdown options
                        $ddlMonth.val(_monthIndex)
                                 .selectmenu("refresh");

                        var _arrYear = [];
                        var _min = Math.max(_selectedYear - _options.OffsetYear, 1);

                        for (var year = _min; year <= (_selectedYear + _options.OffsetYear) ; year++) {
                            _arrYear.push({ "Text": year, "Value": year });
                        }

                        util_dataBindDDL($ddlYear, _arrYear, "Text", "Value", _selectedYear, false);

                        //set data attributes for current month and year view
                        $month.attr("data-datepicker-current-month", _monthIndex)
                              .attr("data-datepicker-current-year", _selectedYear);
                    }
                    else {
                        args.MonthIndex = _monthOpts.Month;
                        args.Year = _monthOpts.Year;
                    }

                    //configure the highlight for today's date
                    var $today = null;
                    var _now = new Date();
                    var _nowYear = _now.getFullYear();

                    if (_monthOpts.IsModeMonthSelection && args.Year == _nowYear) {
                        $today = $vw.find(".MonthDetail_" + _now.getMonth());
                        $today.addClass("Today");
                    }
                    else if (!_monthOpts.IsModeMonthSelection && args.Year == _nowYear && args.MonthIndex == _now.getMonth()) {
                        $today = $vw.find(".DayDetail_" + _now.getDate());
                        $today.addClass("Today");
                    }

                    var $prevToday = $vw.find((_monthOpts.IsModeMonthSelection ? ".MonthDetail" : ".DayDetail") + ".Today");

                    $today = $($today);

                    $prevToday.not($today).removeClass("Today");

                    //refresh the banner date selection
                    var _label = {
                        "Year": "",
                        "Date": ""
                    };

                    var _selectedDate = _options.GetDateValue();

                    if (_selectedDate != null) {
                        _label.Year = _selectedDate.getFullYear();
                        _label.Date = Date.format(_selectedDate, (_monthOpts.IsModeMonthSelection ? "MMMM" : "ddd, MMM dd"));
                    }

                    $lblYear.text(util_forceString(_label.Year));
                    $lblDate.text(util_forceString(_label.Date));

                    if (_selectedDate != null) {

                        var $highlight = null;

                        if (_monthOpts.IsModeMonthSelection && _selectedDate.getFullYear() == args.Year) {
                            $highlight = $vw.find(".MonthDetail_" + _selectedDate.getMonth());
                            $highlight.addClass("HighlightOn");
                        }
                        else if (!_monthOpts.IsModeMonthSelection && _selectedDate.getFullYear() == args.Year && _selectedDate.getMonth() == args.MonthIndex) {
                            $highlight = $vw.find(".DayDetail_" + _selectedDate.getDate());
                            $highlight.addClass("HighlightOn");
                        }

                        var $prevHighlight = $vw.find((_monthOpts.IsModeMonthSelection ? ".MonthDetail" : ".DayDetail") + ".HighlightOn");

                        $highlight = $($highlight);

                        $prevHighlight.not($highlight).removeClass("HighlightOn");
                    }

                }); //end: events.datepicker_renderMonth

                var _fnGetCurrentMonthOptions = function () {
                    var _ret = {
                        "Month": util_forceInt($month.attr("data-datepicker-current-month"), 0),
                        "Year": util_forceInt($month.attr("data-datepicker-current-year"), 0),
                        "IsModeMonthSelection": ($cbMonth.prop("checked") == true),
                        "ToDate": function () {
                            var _ret = null;

                            if (this.Month >= 0 && this.Year > 0) {
                                _ret = new Date();
                                _ret.setHours(0, 0, 0, 0);
                                _ret.setDate(1);
                                _ret.setMonth(this.Month);
                                _ret.setFullYear(this.Year);
                            }

                            return _ret;
                        }
                    };

                    return _ret;

                };  //end: _fnGetCurrentMonthOptions

                $popup.off("click.datepicker_control");
                $popup.on("click.datepicker_control", "[data-control-id]:not(.LinkDisabled)", function (e, args) {

                    var $this = $(this);
                    var _id = $this.attr("data-control-id");
                    var _onClickCallback = function () {
                        $this.removeClass("LinkDisabled");
                    };

                    $this.addClass("LinkDisabled");

                    switch (_id) {

                        case "nav_prev":
                        case "nav_next":
                            var _monthOpts = _fnGetCurrentMonthOptions();
                            var _isNext = (_id == "nav_next");

                            if (_isNext || (!_isNext && _monthOpts.Year > 1)) {
                                var _dt = _monthOpts.ToDate();

                                if (_monthOpts.IsModeMonthSelection) {
                                    _dt.setFullYear(_dt.getFullYear() + (_isNext ? 1 : -1));
                                }
                                else {
                                    _dt.setMonth(_dt.getMonth() + (_isNext ? 1 : -1));
                                }

                                $popup.trigger("events.datepicker_renderMonth", { "MonthIndex": _dt.getMonth(), "Year": _dt.getFullYear() });
                            }

                            _onClickCallback();

                            break;  //end: navigation buttons

                        default:
                            _onClickCallback();
                            break;
                    }

                }); //end: click.datepicker_control

                $popup.off("change.datepicker_control");
                $popup.on("change.datepicker_control", "select[data-control-id], input[type='checkbox'][data-control-id]", function (e, args) {
                    var $this = $(this);
                    var _id = $this.attr("data-control-id");

                    switch (_id) {

                        case "month":
                        case "year":
                            var _month = util_forceInt($ddlMonth.val(), -1);
                            var _year = util_forceInt($ddlYear.val(), -1);

                            $popup.trigger("events.datepicker_renderMonth", { "MonthIndex": _month, "Year": _year });
                            break;

                        case "toggle_month":
                            var _checked = ($this.prop("checked") == true);

                            $popup.toggleClass("MonthSelectionOn", _checked);
                            $popup.trigger("events.datepicker_renderMonth", { "IsBannerRefresh": true });
                            $element.attr("data-datepicker-is-month-selection-on", (_checked ? enCETriState.Yes : enCETriState.No));

                            $element.trigger("events.datepicker_setValue", { "IsRefreshLabel": true });
                            $popup.trigger("events.datepicker_positionPopup");

                            break;
                    }
                });

                $popup.off("click.datepicker_cell");
                $popup.on("click.datepicker_cell",
                          ".DayDetail[data-calendar-day], .DayDetailPlaceholder[data-calendar-day][data-attr-offset-month], " +
                          ".MonthDetail[data-calendar-month]",
                          function (e, args) {

                              var $this = $(this);
                              var _canDismiss = ($this.hasClass("DayDetail") || $this.hasClass("MonthDetail"));
                              var _day = util_forceInt($this.attr("data-calendar-day"));
                              var _month = util_forceInt($this.attr("data-calendar-month"));
                              var _monthOpts = _fnGetCurrentMonthOptions();
                              var _dt = _monthOpts.ToDate();

                              if (_canDismiss) {

                                  var _isCurrent = $this.hasClass("HighlightOn");

                                  if (_monthOpts.IsModeMonthSelection) {
                                      _dt.setMonth(_month);
                                      $ddlMonth.val(_month)
                                               .selectmenu("refresh");
                                  }
                                  else {
                                      _dt.setDate(_day);
                                  }

                                  if (_isCurrent) {
                                      $this.removeClass("HighlightOn");
                                  }

                                  $element.trigger("events.datepicker_setValue", { "Value": (_isCurrent ? null : _dt), "IsUserSelection": true });
                                  $popup.trigger("events.datepicker_renderMonth", { "IsBannerRefresh": true });

                                  //dismiss the popup
                                  $popup.off("click.datepicker_cell");

                                  setTimeout(function () {
                                      $overlay.trigger("click.datepicker_dismiss", { "IsFade": true });
                                  }, 400);
                              }
                              else if (!_monthOpts.IsModeMonthSelection) {
                                  var _offset = util_forceInt($this.attr("data-attr-offset-month"), 0);

                                  _dt.setMonth(_dt.getMonth() + _offset);
                                  _dt.setDate(_day);

                                  //focus the calendar to the selected month from the date
                                  $popup.trigger("events.datepicker_renderMonth", { "DateValue": _dt });
                              }

                          }); //end: click.datepicker_cell

                var _current = _options.GetDateValue();
                var _arr = [];

                _arr = [];

                for (var m = 0; m < _options.MonthList.length; m++) {
                    var _month = _options.MonthList[m];

                    if (_month.length > 3) {
                        _month = _month.substr(0, 3);
                    }

                    _arr.push({ "Text": _month, "Value": m });
                }

                util_dataBindDDL($ddlMonth, _arr, "Text", "Value", null, false);

                if (!_current) {

                    //if the current selected date is not available, then check if there is a fallback date to focus the calendar on
                    var _dtFallback = util_forceString($element.attr("data-datepicker-fallback-focus-date"));

                    if (_dtFallback != "") {
                        if (util_isNumeric(_dtFallback)) {
                            _dtFallback = util_forceInt(_dtFallback, -1);
                        }

                        _current = _options.ParseValue(_dtFallback);
                    }
                }

                $popup.trigger("events.datepicker_renderMonth", { "DateValue": _current });

                if (_options.IsCurrentModeMonthSelection()) {
                    $cbMonth.prop("checked", true)
                            .trigger("change")
                            .checkboxradio("refresh");
                }

                $popup.trigger("events.datepicker_positionPopup");

                $popup.toggle("height", function () {

                    $overlay.off("click.datepicker_dismiss");
                    $overlay.on("click.datepicker_dismiss", function (e, args) {

                        args = util_extend({ "IsAnimate": true, "IsFade": false }, args);

                        $overlay.off("click.datepicker_dismiss");

                        if (args.IsAnimate) {

                            if (args.IsFade) {
                                $popup.fadeOut("normal", function () {
                                    $container.remove();
                                });
                            }
                            else {
                                $popup.toggle("height", function () {
                                    $container.remove();
                                });
                            }
                        }
                        else {
                            $container.remove();
                        }
                    });

                    var $window = $(window);

                    $window.off("resize.datepicker_popup");
                    $window.on("resize.datepicker_popup", function () {
                        $window.off("resize.datepicker_popup");
                        $overlay.trigger("click.datepicker_dismiss", { "IsAnimate": false });
                    });
                });

            }); //end: click.datepicker_show

            $element.trigger("events.datepicker_init");
        }
    });
}

function renderer_datepicker_getDate(obj, params) {
    var _ret = null;
    var _element = $(obj);
    var _datepicker = _element.find(".CDatePicker");

    if (_datepicker.hasClass("ViewModeInline")) {
        var _options = util_extend({}, params);

        var _isPrimitive = _options["IsPrimitiveType"];

        _element.trigger("events.datepicker_getOptions", _options);

        _ret = (_isPrimitive ? _options.GetDateValue() : _options);
    }
    else if (_datepicker.hasClass("hasDatepicker")) {
        _ret = _datepicker.datepicker("getDate");

        if (!util_isDate(_ret)) {
            _ret = null;
        }
    }

    return _ret;
}

function renderer_datepicker_setDate(obj, strDate, params) {

    var _element = $(obj);
    var _datepicker = _element.find(".CDatePicker");
    
    if (_datepicker.hasClass("ViewModeInline")) {

        params = util_extend({}, params);
        params["Value"] = strDate;

        _datepicker.trigger("events.datepicker_setValue", params);
    }
    else if (_datepicker.hasClass("hasDatepicker")) {
        _datepicker.datepicker("setDate", util_forceString(strDate));
    }
}

function renderer_colorpicker(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "colorpicker");

    $.each(_list, function (indx) {
        var _element = $(this);

        var _color = util_forceString(_element.attr("data-attr-color"));
        var _options = {
            preferredFormat: "hex",
            cancelText: "Cancel",
            chooseText: "Select"
        };

        if (_color != "") {
            _options["color"] = _color;
        }

        var _html = "<input type='text' class='CColorPicker' data-role='none' />";
        _element.html(_html);

        _element.find(".CColorPicker").spectrum(_options);
    });

}

function renderer_imgLink(context, options) {
    context = global_forceContext(context);

    //Note: applying the extended search for the filtered list to handle dialog type links as well (i.e. applying multi-layered renderers)
    var _list = renderer_getFilteredList(context, "img_link", true);

    $.each(_list, function (indx) {
        var _element = $(this);
        var _imgURL = util_forceString(_element.attr(CONTROL_IMAGE_LINK_URL));
        var _width = util_forceInt(_element.attr(CONTROL_IMAGE_LINK_WIDTH), 0);
        var _height = util_forceInt(_element.attr(CONTROL_IMAGE_LINK_HEIGHT), 0);

        _element.attr("data-role", "none");
        _element.addClass("LinkButton")
                .addClass("ClearButton");

        var _href = util_forceString(_element.attr("href"));

        if (_href == "") {
            _element.attr("href", "javascript: void(0);");
        }

        var _html = "<img alt='' src='" + _imgURL + "' " +
                    (_width > 0 ? "width='" + _width + "' " : "") +
                    (_height > 0 ? "height='" + _height + "' " : "") +
                    "/>";

        if (!_element.data("is-init-imgLink")) {
            _element.data("is-init-imgLink", true);

            _element.off("events.imgLink_updateImageSource");
            _element.on("events.imgLink_updateImageSource", function (e, args) {

                args = util_extend({
                    "URL": _element.attr(CONTROL_IMAGE_LINK_URL),
                    "Width": _element.attr(CONTROL_IMAGE_LINK_WIDTH),
                    "Height": _element.attr(CONTROL_IMAGE_LINK_HEIGHT),
                    "DisableSkinImgPath": false
                }, args);

                args.URL = (args.DisableSkinImgPath ? args.URL : "../<IMAGE_SKIN_PATH>" + args.URL);

                _element.attr(CONTROL_IMAGE_LINK_URL, args.URL)
                        .attr(CONTROL_IMAGE_LINK_WIDTH, args.Width)
                        .attr(CONTROL_IMAGE_LINK_HEIGHT, args.Height);

                $mobileUtil.RenderRefresh(_element, true);

            });
        }

        _element.html(_html);
    });

    _list.unbind("mouseover");
    _list.unbind("mouseleave");

    var _fnToggleImgState = function (isMouseOver, objLink) {
        isMouseOver = util_forceBool(isMouseOver, true);
        var _link = $(objLink);
        var _noLinkClass = util_forceString(_link.attr(CONTROL_IMAGE_LINK_NO_LINK_CLASS), "");
        var _img = $(_link.children("img"));

        var _url = util_forceString(_img.attr("src"));
        var _arrExt = [".png", ".jpg", ".svg"];

        for (var i = 0; i < _arrExt.length; i++) {
            var _ext = _arrExt[i];

            if (_url.indexOf(_ext) >= 0) {
                var _search = "";
                var _replace = "";
                var _valid = true;

                if (isMouseOver) {
                    _search = "_up" + _ext;
                    _replace = "_over" + _ext;

                    if (_noLinkClass == "" || !_link.hasClass(_noLinkClass)) {
                        _valid = true;
                    }
                    else {
                        _valid = false;
                    }
                }
                else {
                    _search = "_over" + _ext;
                    _replace = "_up" + _ext;
                    _valid = true;
                }

                if (_valid) {
                    _url = util_replaceAll(_url, _search, _replace);
                }
                break;
            }
        }


        _img.attr("src", _url);
    };

    _list.mouseover(function () {
        _fnToggleImgState(true, this);
    });

    _list.mouseleave(function () {
        _fnToggleImgState(false, this);
    });
}

function renderer_rating(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "rating");

    $.each(_list, function (index) {
        var _element = $(this);

        if (util_isNullOrUndefined(_element.attr('render-state'))) {

            var _minValue = util_forceInt(_element.attr(CONTROL_DATA_ATTR_RATING_MIN), 0);
            var _maxValue = util_forceInt(_element.attr(CONTROL_DATA_ATTR_RATING_MAX), 5);
            var _defaultValue = util_forceInt(_element.attr(CONTROL_DATA_ATTR_RATING_VALUE), 0);
            if (_defaultValue < _minValue || _defaultValue > _maxValue) _defaultValue = 0;
            var _readOnly = util_forceBool(_element.attr(CONTROL_DATA_ATTR_RATING_READONLY), false);
            var _resetable = util_forceBool(_element.attr(CONTROL_DATA_ATTR_RATING_RESETABLE), true);
            var _isPreset = util_forceBool(_element.attr(CONTROL_DATA_ATTR_RATING_ISPRESET), false);
            var _step = util_forceInt(_element.attr(CONTROL_DATA_ATTR_RATING_STEP), 0.5);
            var _onRate = util_forceString(_element.attr(CONTROL_DATA_ATTR_RATING_ONRATE), "");
            var _onReset = util_forceString(_element.attr(CONTROL_DATA_ATTR_RATING_ONRESET), "");

            var _html = "<div class='rateit' ";
            _html += CONTROL_DATA_ATTR_RATING_MIN + "='" + _minValue + "' ";
            _html += CONTROL_DATA_ATTR_RATING_MAX + "='" + _maxValue + "' ";
            _html += CONTROL_DATA_ATTR_RATING_VALUE + "='" + _defaultValue + "' ";
            _html += CONTROL_DATA_ATTR_RATING_RESETABLE + "='" + _resetable + "' ";
            _html += CONTROL_DATA_ATTR_RATING_ISPRESET + "='" + _isPreset + "' ";
            _html += CONTROL_DATA_ATTR_RATING_STEP + "='" + _step + "' ";
            _html += CONTROL_DATA_ATTR_RATING_READONLY + "='" + _readOnly + "'></div>";
            _element.html(_html);

            _element.rateit();

            _element.attr('render-state', 'rendered');

            if (_onRate != "")
                _element.bind('rated', function () { eval(_onRate); });

            if (_onReset != "")
                _element.bind('reset', function () { eval(_onReset); });
        }
    });
}

function renderer_ratingV2(context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "ratingV2");

    $.each($list, function (index) {
        var $element = $(this);

        if (!$element.data("is-init-rating")) {
            $element.data("is-init-rating", true);

            var _fnRenderOpts = function () {
                var _ret = {
                    "IsEditable": (util_forceInt($element.attr("data-rating-is-editable"), enCETriState.Yes) == enCETriState.Yes),
                    "CanDelete": (util_forceInt($element.attr("data-rating-can-delete"), enCETriState.Yes) == enCETriState.Yes),
                    "HasTotal": (util_forceInt($element.attr("data-rating-has-total"), enCETriState.No) == enCETriState.Yes),
                    "LabelTotalSuffix": util_forceString($element.attr("data-rating-label-total-suffix"), "total"),
                    "Levels": Math.max(1, util_forceInt($element.attr("data-rating-num-levels"), 5))
                };

                return _ret;
            };  //end: _fnRenderOpts

            $element.off("events.rating_onBind");
            $element.on("events.rating_onBind", function (e, args) {

                args = util_extend({ "IsInit": false }, args);

                var _renderOpts = _fnRenderOpts();
                var _html = "";

                var _lookupLevelLabel = util_extend({}, $element.data("LookupRatingLevelLabel"));

                for (var i = 1; i <= _renderOpts.Levels; i++) {
                    _html += "<div class='RatingStar' " + util_htmlAttribute("data-rating-level", i) +
                             (_lookupLevelLabel[i] ? " " + util_htmlAttribute("title", _lookupLevelLabel[i], null, true) : "") +
                             " />";
                }

                if (_renderOpts.IsEditable && _renderOpts.CanDelete) {
                    _html += "<a class='LinkClickable' data-role='button' data-theme='transparent' data-mini='true' data-inline='true' data-icon='delete' " +
                             "data-iconpos='notext' title='Remove' data-rating-control-id='delete' />";
                }

                if (_renderOpts.HasTotal) {
                    _html += "<div class='RatingUserSummary'>" +
                             "  <div class='RatingIconUser' />" + "<span class='Label' />" +
                             "</div>";
                }

                $element.html(_html);

                $element.toggleClass("Editable", _renderOpts.IsEditable);

                $element.data("ElementStars", $element.children(".RatingStar[data-rating-level]"));
                $element.data("LabelSummaryCount", $element.find(".RatingUserSummary > .Label"));

                $element.off("click.rating_onRatingStar");
                $element.off("mouseenter.rating_onRatingStar");

                $element.off("click.rating_onButtonClick");

                if (_renderOpts.IsEditable) {
                    var _fn = function (e, args) {
                        var $this = $(this);
                        var _level = util_forceInt($this.attr("data-rating-level"));

                        $element.trigger("events.rating_setValue", { "Value": _level });

                        if (args && args["IsSubmit"]) {
                            var _fnOnClick = $element.data("OnClick");

                            if (_fnOnClick) {
                                _fnOnClick.call(this, { "Trigger": $this, "Value": _level });
                            }
                        }
                    };

                    $element.on("click.rating_onRatingStar", ".RatingStar", function (e) {
                        _fn.call(this, e, { "IsSubmit": true });
                    });

                    $element.on("mouseenter.rating_onRatingStar", ".RatingStar", _fn);

                    $element.on("click.rating_onButtonClick", "[data-rating-control-id]:not(.LinkDisabled)", function () {
                        var $this = $(this);
                        var _clickCallback = function () {
                            $this.removeClass("LinkDisabled");
                        };

                        $this.addClass("LinkDisabled");

                        dialog_confirmYesNo("Remove", "Are you sure you want to remove the current rating?", function () {

                            _clickCallback();
                            _fn.call($this, null, { "IsSubmit": true, "IsClear": true });

                        }, _clickCallback);

                    });
                }

                if (args.IsInit) {

                    //set default selection, if applicable
                    var _defaultValue = $element.attr("data-rating-default-value");

                    if (_defaultValue) {
                        $element.trigger("events.rating_setValue", { "Value": _defaultValue });
                    }
                }

            }); //end: events.rating_onBind

            $element.off("events.rating_setValue");
            $element.on("events.rating_setValue", function (e, args) {
                args = util_extend({ "Value": null, "Count": null }, args);

                var _renderOpts = _fnRenderOpts();
                var _val = util_forceFloat(args.Value, 0);

                if (_val > _renderOpts.Levels) {
                    _val = _renderOpts.Levels;
                }

                var $list = $element.data("ElementStars");

                if (!$list) {
                    $list = $element.children(".RatingStar[data-rating-level]");
                    $element.data("ElementStars", $list);
                }

                var $selected = $list.filter(function () {
                    var $this = $(this);
                    var _rating = util_forceInt($this.attr("data-rating-level"));
                    var _valid = (_rating <= _val);

                    //current value is invalid for rating, but check if the value is greater than previous level and less than current level (inbetween both levels)
                    if (!_valid && _val > 0 && (_val > (_rating - 1) && _val < _rating)) {
                        $this.addClass("RatingStarHalf");
                    }
                    else {
                        $this.removeClass("RatingStarHalf");
                    }

                    return _valid;
                });

                $selected.addClass("StateOn");
                $list.not($selected).removeClass("StateOn");

                if (_renderOpts.HasTotal) {
                    var _count = util_forceInt(args.Count, 0);
                    var $lblCount = $element.data("LabelSummaryCount");

                    if (!$lblCount) {
                        $lblCount = $element.find(".RatingUserSummary > .Label");
                        $element.data("LabelSummaryCount", $lblCount);
                    }

                    $lblCount.text(util_formatNumber(_count) + " " + util_forceString(_renderOpts.LabelTotalSuffix));
                }

            }); //end: events.rating_setValue

            $element.off("events.rating_getValue");
            $element.on("events.rating_getValue", function (e, args) {

                if (!args) {
                    args = {};
                }

                var $list = $element.data("ElementStars");

                if (!$list) {
                    $list = $element.children(".RatingStar[data-rating-level]");
                    $element.data("ElementStars", $list);
                }

                var $selected = $list.filter(".StateOn").last();
                var _renderOpts = _fnRenderOpts();
                var _val = $selected.attr("data-rating-level");

                if (_val === undefined) {
                    _val = null;
                }

                args["Result"] = {
                    "Value": _val,
                    "Levels": _renderOpts.Levels
                };

            }); //end: events.rating_getValue

            $element.addClass("DisableUserSelectable CRating");

            $element.trigger("events.rating_onBind", { "IsInit": true });
        }
    });
}

function renderer_tabGroup(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "tab_group");
    var _attrHeaderTemplateName = "data-cattr-tab-group-header-template";

    $.each(_list, function (index) {
        var _element = $(this);

        var _listHeader = _list.find("[" + util_htmlAttribute(CONTROL_TAB_GROUP_HEADER, 1) + "]");
        var _listContent = _list.find("[" + CONTROL_TAB_GROUP_CONTENT_ID + "]");
        var _attrTheme = util_forceString(_element.attr("data-theme"));
        var _attributes = (_attrTheme != "" ? " data-theme=\"" + _attrTheme + "\"" : "");

        _listHeader.hide();
        _listContent.hide();

        //remove the old header template, if applicable
        _element.children("[" + _attrHeaderTemplateName + "]").remove();

        var _htmlHeader = "<div data-role=\"navbar\" class=\"CTabGroupHeader\" " + util_htmlAttribute(_attrHeaderTemplateName, "1") + " " + _attributes + ">";

        _htmlHeader += "<ul>";

        $.each(_listHeader, function (indx) {
            _htmlHeader += "<li>" +
                            "<a href=\"javascript: void(0);\" data-cattr-tab-group-link=\"1\" " + _attributes +
                            " data-cattr-tab-group-link-content-ref=\"" + util_forceString($(this).attr(CONTROL_TAB_GROUP_HEADER_LINK_ID)) + "\">" + $(this).html() + "</a>" + "</li>";
        });

        _htmlHeader += "</ul>";

        _htmlHeader += "</div>";

        _element.prepend(_htmlHeader);

        _element.addClass("CTabGroupContainer");
        _listContent.addClass("CTabGroupContent");

        //configure/restore the default selection
        var _selectedContentID = util_forceString(_element.attr("data-cattr-tab-group-selected-id"));

        if (_selectedContentID == "" || _listContent.filter("[" + CONTROL_TAB_GROUP_CONTENT_ID + "=\"" + _selectedContentID + "\"]").length == 0) {
            _selectedContentID = "";

            if (_listHeader.length > 0) {
                _selectedContentID = util_forceString($(_listHeader[0]).attr(CONTROL_TAB_GROUP_HEADER_LINK_ID));
            }
        }

        if (_selectedContentID != "") {
            _listContent.filter("[" + CONTROL_TAB_GROUP_CONTENT_ID + "=\"" + _selectedContentID + "\"]").show();
            _element.find("[data-cattr-tab-group-link-content-ref=\"" + _selectedContentID + "\"]").addClass("ui-btn-active");
        }

        var _listHeaderLinks = _element.find("[data-cattr-tab-group-link=1]");

        _listHeaderLinks.click(function () {
            var _link = $(this);
            var _contentID = util_forceString(_link.attr("data-cattr-tab-group-link-content-ref"));

            if (_contentID != "") {
                var _container = $(_link.parentsUntil("[" + DATA_ATTRIBUTE_RENDER + "=" + "tab_group]").last().parent());
                var _listContent = _container.find("[" + CONTROL_TAB_GROUP_CONTENT_ID + "]");

                _listContent.filter(":visible").hide();
                _listContent.filter("[" + CONTROL_TAB_GROUP_CONTENT_ID + "=\"" + _contentID + "\"]").fadeIn();

                _container.attr("data-cattr-tab-group-selected-id", _contentID);

                //update the active header link
                var _headerLinks = _container.find("[data-cattr-tab-group-link-content-ref]");

                _headerLinks.removeClass("ui-btn-active");
                _headerLinks.filter("[data-cattr-tab-group-link-content-ref=\"" + _contentID + "\"]").addClass("ui-btn-active");
            }

            return false;
        });

        _element.attr("data-cattr-tab-group-selected-id", _selectedContentID);
    });
}

function renderer_selectionList(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "selection_list");

    $.each(_list, function (index) {
        var _element = $(this);

        var _html = "";
        var _isRefresh = renderer_isRefresh(_element);

        var _fnGetDataItemConfig = function (objDataItem) {
            var _dataElement = $(objDataItem);
            var _linkID = util_forceString(_dataElement.attr(CONTROL_LIST_SELECTION_ITEM_ID));
            var _text = _dataElement.text();

            return { "Element": _dataElement, "ID": _linkID, "Text": _text };
        };

        var _fnAddItemHTML = function (objDataElement, templateItemHTML, isSource, attrs) {
            var _ret = "";

            var _dataElement = $(objDataElement);
            var _itemConfig = _fnGetDataItemConfig(_dataElement);
            var _linkID = _itemConfig["ID"];
            var _text = _itemConfig["Text"];
            var _tokens = {};
            var _attributes = util_forceString(attrs);

            _tokens["%%FILTER_TEXT%%"] = _text;
            _tokens["%%FILTER_HTML%%"] = util_htmlEncode(_text);
            _tokens["%%FILTER_ID%%"] = _linkID;

            _ret += "<li " + util_htmlAttribute("data-filtertext", _text, null, true) + " " +
                    util_htmlAttribute("data-cattr-list-selection-container-id", _linkID) + " " +
                    util_htmlAttribute("data-cattr-list-selection-container-source", isSource ? enCETriState.Yes : enCETriState.No) + " " +
                    _attributes + ">" +
                    "    <a class='CListSelectionSectionLink' data-mini='true' href='javascript: void(0);' " + util_htmlAttribute(CONTROL_LIST_SELECTION_LINK_ID, _linkID) + " " +
                    util_htmlAttribute(CONTROL_LIST_SELECTION_LINK_TYPE_SOURCE, isSource ? enCETriState.Yes : enCETriState.No) + ">" +
                    util_replaceTokens(templateItemHTML, _tokens) +
                    "    </a>" +
                    "</li>";

            return _ret;
        };

        var _fnConstructFilterList = function (ctx, templateHTML, isSource, options, container) {
            var _filterHTML = "";
            var _listDataElement = $(ctx).find("[" + CONTROL_LIST_SELECTION_DATA_ITEM + "=1]"); //find all data items within the container to be populated for list view data

            isSource = util_forceBool(isSource, true);

            if (util_isNullOrUndefined(options)) {
                options = {};
            }

            if (util_forceString(options["Placeholder"]) == "") {
                options["Placeholder"] = "Search...";
            }

            options["ToggleFilter"] = util_forceValidEnum(options["ToggleFilter"], enCETriState, enCETriState.Yes);

            options["Reveal"] = util_forceBool(options["Reveal"], false);

            var _listViewAttributes = "";
            var _attributes = " ";

            _attributes += util_htmlAttribute("data-icon", (isSource ? "plus" : "minus"));

            if (_isRefresh) {
                var _listView = _container.find("[data-cattr-list-selection-listview-source=" + (isSource ? enCETriState.Yes : enCETriState.No) + "]");
                var _tbSearch = _listView.parent().find("form[role=search]").find("input[data-type=search]");

                _listViewAttributes += " " + util_htmlAttribute("data-cattr-list-selection-restore", util_forceString(_tbSearch.val()));
            }

            _filterHTML += "<ul data-role='listview' data-filter='" + (options.ToggleFilter == enCETriState.Yes ? "true" : "false") + "' " +
                           "data-filter-placeholder=\"" + options.Placeholder + "\" data-inset='true' " +
                           (isSource ? "data-filter-reveal='" + options.Reveal + "' " : "") +
                           (util_forceString(options["Theme"]) != "" ? " data-theme=\"" + options.Theme + "\"" : "") + " " +
                           util_htmlAttribute(DATA_ATTR_TEMPLATE, "list_selection_listview") + " " +
                           util_htmlAttribute("data-cattr-list-selection-listview-source", (isSource ? enCETriState.Yes : enCETriState.No)) + " " +
                           _listViewAttributes + ">";

            $.each(_listDataElement, function (indx) {
                _filterHTML += _fnAddItemHTML(this, templateHTML, isSource, _attributes);
            });

            _filterHTML += "</ul>";

            return _filterHTML;
        };

        var _listSource = _element.find("[" + CONTROL_LIST_SELECTION_DATA_SOURCE + "]");
        var _listDest = _element.find("[" + CONTROL_LIST_SELECTION_DATA_DEST + "]");
        var _template = _element.find("[" + CONTROL_LIST_SELECTION_ITEM_TEMPLATE + "]");
        var _fnCallbackLink = _element.attr(CONTROL_LIST_SELECTION_EVENT_CALLBACK_LINK_CLICK);

        if (util_isDefined(_fnCallbackLink) && $.isFunction(eval(_fnCallbackLink))) {
            _fnCallbackLink = eval(_fnCallbackLink);
        }
        else {
            _fnCallbackLink = null;
        }

        renderer_setOverride(_template, false); //disable the override attribute

        var _itemTemplate = util_forceString(_template.html());
        var _options = { "Theme": util_forceString(_element.attr("data-theme")),
            "Placeholder": util_forceString(_element.attr(CONTROL_LIST_SELECTION_SEARCH_PLACEHOLDER)),
            "ToggleFilter": util_forceValidEnum(_element.attr(CONTROL_LIST_SELECTION_SEARCH_TOGGLE_SEARCH), enCETriState, enCETriState.Yes),
            "Reveal": util_forceBool(_element.attr(CONTROL_LIST_SELECTION_SEARCH_REVEAL))
        };

        if (_itemTemplate == "") {
            _itemTemplate = "%%FILTER_HTML%%";
        }

        renderer_setOverride(_template, true);    //enable the override attribute for data renderer elements within the item template

        _listSource.hide();
        _listDest.hide();
        _template.hide();

        var _container = _element.children("[" + DATA_ATTR_TEMPLATE + "=list_selection]");

        var _sectionCssClass = "CListSelectionSectionHeader" + (_options.ToggleFilter == enCETriState.No ? " CListSelectionSectionHeaderDisabled" : "");

        _html += "<table " + util_htmlAttribute(DATA_ATTR_TEMPLATE, "list_selection") + " border='0' cellpadding='0' cellspacing='0' style='width: 100%;'>";

        _html += "<tr>";
        _html += "  <td align='left' valign='top' style='width: 45%;'>" +
                 "      <div class='" + _sectionCssClass + "'>" +
                 util_htmlEncode(util_forceString(_element.attr(CONTROL_LIST_SELECTION_HEADER_SOURCE), "Available:")) + "</div>" +
                 "  </td>";
        _html += "  <td style='width: 4%;' align='center' valign='top'>&nbsp;</td>";
        _html += "  <td align='left' valign='top' style='width: 45%;'>" +
                 "      <div class='" + _sectionCssClass + "'>" +
                 util_htmlEncode(util_forceString(_element.attr(CONTROL_LIST_SELECTION_HEADER_DEST), "Selected:")) + "</div>" +
                 "  </td>";
        _html += "</tr>";

        _html += "<tr>";
        _html += "  <td align='left' valign='top' style='width: 45%;'>" + _fnConstructFilterList(_listSource, _itemTemplate, true, _options, _container) + "</td>";
        _html += "  <td style='width: 4%;' align='center' valign='top'>&nbsp;</td>";
        _html += "  <td align='left' valign='top' style='width: 45%;'>" + _fnConstructFilterList(_listDest, _itemTemplate, false, _options, _container) + "</td>";
        _html += "</tr>";

        _html += "</table>";

        //remove the previous rendered contents, if applicable
        _element.children("[" + DATA_ATTR_TEMPLATE + "=list_selection]").remove();
        _element.prepend(_html);

        _container = _element.children("[" + DATA_ATTR_TEMPLATE + "=list_selection]");
        renderer_setOverride(_container, false);

        js_bindClick(_container.find("a.CListSelectionSectionLink"), function () {
            var _link = $(this);
            var _options = { "ID": _link.attr(CONTROL_LIST_SELECTION_LINK_ID),
                "IsSource": util_forceValidEnum(_link.attr(CONTROL_LIST_SELECTION_LINK_TYPE_SOURCE), enCETriState, enCETriState.None),
                "RendererContainer": _element,
                "Parent": _link.parentsUntil("[" + DATA_ATTR_TEMPLATE + "=list_selection]").last().parent(),
                "ItemContainer": _link.parentsUntil("li").last().parent()
            };

            if (_fnCallbackLink) {
                _fnCallbackLink(_link, _options);
            }

            return false;
        });
    });
}

function renderer_filterText(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "filter_text");

    $.each(_list, function (index) {
        var _element = $(this);

        var _isRefresh = renderer_isRefresh(_element);
        var _elementConfig = _element.children("[" + DATA_ATTR_TEMPLATE + "=config]");  //retrieve the config element (deprecated; see below suggested usage via element DOM data)
        var _dataTheme = util_forceString(_element.attr("data-theme"));
        var _headingText = util_forceString(_element.attr(CONTROL_FILTER_TEXT_HEADING));
        var _searchPlaceholder = util_jsEncode(_element.attr(CONTROL_FILTER_TEXT_SEARCH_PLACEHOLDER));
        var _toggleSearchDisplayAll = util_forceValidEnum(_element.attr(CONTROL_FILTER_TEXT_SEARCH_DISPLAY_ALL), enCETriState, enCETriState.None);
        var _toggleSearchDisplaySwitch = util_forceValidEnum(_element.attr(CONTROL_FILTER_TEXT_SHOW_SEARCH_SWITCH), enCETriState, enCETriState.No);

        var _config = null;
        var _hasDataFunctions = (_elementConfig.length == 0);

        if (!_hasDataFunctions) {

            //deprecated
            _config = {
                FnDataSource: util_forceString(_elementConfig.attr(CONTROL_FILTER_TEXT_CONFIG_EVENT_DATASOURCE)),
                FnItemHTML: util_forceString(_elementConfig.attr(CONTROL_FILTER_TEXT_CONFIG_EVENT_ITEM_HTML)),
                FnSearchRefresh: util_forceString(_elementConfig.attr(CONTROL_FILTER_TEXT_CONFIG_EVENT_SEARCH_REFRESH)),
                FnNoItemsHTML: util_forceString(_elementConfig.attr(CONTROL_FILTER_TEXT_CONFIG_EVENT_NO_ITEMS_HTML))
            };
        }
        else {

            //retrieve the configuration of the functions using element DOM data
            _config = {
                FnDataSource: _element.data(CONTROL_FILTER_TEXT_CONFIG_EVENT_DATASOURCE),
                FnItemHTML: _element.data(CONTROL_FILTER_TEXT_CONFIG_EVENT_ITEM_HTML),
                FnSearchRefresh: _element.data(CONTROL_FILTER_TEXT_CONFIG_EVENT_SEARCH_REFRESH),
                FnNoItemsHTML: _element.data(CONTROL_FILTER_TEXT_CONFIG_EVENT_NO_ITEMS_HTML)
            };

        }

        _element.off("events.filter_text_refresh");
        _element.on("events.filter_text_refresh", function (e, args) {

            args = util_extend({ "IsForceRefresh": true, "From": null, "Callback": null }, args);

            var _html = "";

            if (args.IsForceRefresh || args.From == "search" || args.From == "navigation") {
                var _container = _element.children("[" + DATA_ATTR_TEMPLATE + "=content]");
                var _isUpdate = (_container.length == 1 && (args.From == "search" || args.From == "navigation"));

                if (!_isUpdate) {
                    if (_headingText != "") {
                        _html += "<div class='CFilterTextHeading'>" + util_htmlEncode(_headingText) +
                                 (_toggleSearchDisplaySwitch == enCETriState.Yes ?
                                 "<a class='CFilterTextSearchToggle' data-role='button' data-mini='true' data-inline='true' " +
                                 "data-iconpos='notext' data-icon='refresh' title='Toggle Show All'></a>" : "") +
                                 "</div>";

                    }

                    _html += "<div class='FilterTextSearchContainer'>" +
                             "  <input class='TextInputFilterableCriteria' type='search' value='' " +
                             util_htmlAttribute("data-attr-is-toggle-display-all", _toggleSearchDisplayAll) + " " +
                             (_dataTheme != "" ? util_htmlAttribute("data-theme", _dataTheme) : "") +
                             (_searchPlaceholder != "" ? " " + util_htmlAttribute("placeholder", _searchPlaceholder) : "") +
                             "  />" +
                             "</div>";
                }

                var _hasPaging = false;
                var _pageNo = -1;

                if (_config != null) {

                    _elementConfig.hide();

                    if (util_isFunction(_config.FnDataSource) && util_isFunction(_config.FnItemHTML)) {
                        _config.FnDataSource = eval(_config.FnDataSource);
                        _config.FnItemHTML = eval(_config.FnItemHTML);

                        var _arr = _config.FnDataSource(_element);

                        if (util_isNullOrUndefined(_arr)) {
                            _arr = [];
                        }

                        if (_arr.length > 0) {
                            var _pageSize = util_forceInt(_element.data("PageSize"), 0);
                            var _maxPages = -1;
                            var _start = 0;
                            var _end = _arr.length - 1;

                            if (_pageSize > 0) {

                                _maxPages = util_maxListPage({ "NumItems": _arr.length }, _pageSize);
                                _pageNo = util_forceValidPageNum(util_forceInt(_element.data("PageNum"), 1), 1, 1, _maxPages);

                                _start = (_pageNo - 1) * _pageSize;
                                _end = Math.min(_start + _pageSize - 1, _arr.length - 1);

                                _hasPaging = true;
                            }

                            for (var i = _start; i <= _end; i++) {
                                var _dataItem = _arr[i];
                                var _options = {
                                    "Index": i, "DataItem": _dataItem, "List": _arr,
                                    "IsSearchDisplayAll": (_toggleSearchDisplayAll == enCETriState.Yes)
                                };

                                var _itemHTML = _config.FnItemHTML(_element, _options);

                                _html += util_forceString(_itemHTML);
                            }

                            if (_hasPaging) {
                                _html += "<div class='DisableUserSelectable FilterTextPageNavigation'>" +
                                         "  <a data-filter-text-btn='prev' data-role='button' data-inline='true' data-icon='arrow-l' data-iconpos='notext' data-theme='transparent'" +
                                         ((_pageNo == 1) ? " style='opacity: 0.5; cursor: default;'" : "") + " />" +
                                         "  <span class='FilterTextPageNavigationLabel'>" + util_htmlEncode("PAGE:") + "</span>" +
                                         "  <select data-mini='true' data-inline='true'>";

                                for (var p = 1; p <= _maxPages; p++) {
                                    _html += "<option value='" + p + "'>" + util_htmlEncode(p) + "</option>";
                                }

                                _html += "  </select>" +
                                         "  <span class='FilterTextPageNavigationLabel'>" + util_htmlEncode("of " + _maxPages) + "</span>" +
                                         "  <a data-filter-text-btn='next' data-role='button' data-inline='true' data-icon='arrow-r' data-iconpos='notext' data-theme='transparent' " +
                                         util_htmlAttribute("data-attr-paging-max-page-num", _maxPages) + ((_pageNo == _maxPages) ? " style='opacity: 0.5; cursor: default;'" : "") +
                                         " />" +
                                         "</div>";
                            }
                        }
                        else if (util_isFunction(_config.FnNoItemsHTML)) {
                            _config.FnNoItemsHTML = eval(_config.FnNoItemsHTML);

                            _html += util_forceString(_config.FnNoItemsHTML(_element));
                        }
                    }
                }

                if (_isUpdate) {
                    _container.children(":not(.FilterTextSearchContainer)")
                              .remove();

                    _container.append(_html);
                }
                else if (_container.length == 1) {
                    _container.html(_html);
                }
                else {
                    _container = $("<div " + util_htmlAttribute(DATA_ATTR_TEMPLATE, "content") + ">" + _html + "</div>");

                    _element.append(_container);
                }

                if (_hasPaging) {
                    _container.trigger("create");
                    $mobileUtil.SetDropdownListValue(_container.find(".FilterTextPageNavigation select"), _pageNo);
                }

				if (_config != null && util_isFunction(_config.FnSearchRefresh)) {
                    _config.FnSearchRefresh = eval(_config.FnSearchRefresh);

                    _config.FnSearchRefresh(_element);
                }
            }
            else {
                if (_config != null && util_isFunction(_config.FnSearchRefresh)) {
                    _config.FnSearchRefresh = eval(_config.FnSearchRefresh);

                    _config.FnSearchRefresh(_element);

                    //force refresh of the search
                    var _tbSearch = $(_element.find(".TextInputFilterableCriteria"));

                    _tbSearch.attr("data-attr-is-force-refresh", enCETriState.Yes);
                    _tbSearch.trigger("keyup");
                }
            }

            if (args.Callback) {
                args.Callback();
            }
        });

        if (!_element.data("is-init")) {
            _element.data("is-init", true);

            _element.off("change.filter_text_page_navigation");
            _element.on("change.filter_text_page_navigation", ".FilterTextPageNavigation select", function (e) {
                var $ddl = $(this);
                var $parent = $ddl.closest("[" + util_renderAttribute("filter_text") + "]");

                var _current = util_forceInt($parent.data("PageNum"), 1);
                var _selected = util_forceInt($ddl.val(), 1);

                if (_current != _selected) {
                    $parent.data("PageNum", _selected);
                    $parent.trigger("events.filter_text_refresh", { "IsForceRefresh": true, "From": "navigation" });
                }
            });

            _element.off("click.filter_text_nav_button");
            _element.on("click.filter_text_nav_button", ".FilterTextPageNavigation [data-filter-text-btn]", function (e) {
                var $btn = $(this);
                var $parent = $btn.closest("[" + util_renderAttribute("filter_text") + "]");

                var _isPrev = ($btn.attr("data-filter-text-btn") == "prev");
                var _current = util_forceInt($parent.data("PageNum"), 1);
                var _selected = -1;

                if (_isPrev && _current > 1) {
                    _selected = _current - 1;
                }
                else if (!_isPrev && (_current + 1) <= util_forceInt($btn.attr("data-attr-paging-max-page-num"), 0)) {
                    _selected = _current + 1;
                }

                if (_selected >= 0) {
                    $parent.data("PageNum", _selected);
                    $parent.trigger("events.filter_text_refresh", { "IsForceRefresh": true, "From": "navigation" });
                }
                
            });
        }

        _element.trigger("events.filter_text_refresh", { "IsForceRefresh": !_isRefresh });
    });

    js_bindClick(_list.find("a.CFilterTextSearchToggle"), function () {
        var _link = $(this);
        var _parent = $mobileUtil.FindAncestor(_link, "[" + util_renderAttribute("filter_text") + "]");
        var _tbSearch = $(_parent.find(".TextInputFilterableCriteria"));
        var _isShowAll = util_forceValidEnum(_parent.attr(CONTROL_FILTER_TEXT_SEARCH_DISPLAY_ALL), enCETriState, enCETriState.None);

        _isShowAll = (_isShowAll == enCETriState.Yes ? enCETriState.No : enCETriState.Yes);

        _parent.attr(CONTROL_FILTER_TEXT_SEARCH_DISPLAY_ALL, _isShowAll);
        _tbSearch.attr("data-attr-is-toggle-display-all", _isShowAll);

        //force refresh of the search (clear to default text)
        _tbSearch.val("");
        _tbSearch.attr("data-attr-is-force-refresh", enCETriState.Yes);
        _tbSearch.trigger("keyup");

        return false;
    });
}

function renderer_filterView(context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "filter_view");

    $.each($list, function (index) {
        var $element = $(this);
        var _html = "";

        var _fnRenderOptions = $element.attr(DATA_ATTR_FILTER_VIEW_RENDER_OPTIONS_CALLBACK);    //deprecated (use the preferred DOM data version)

        if (!util_isFunction(_fnRenderOptions)) {

            //check the DOM data for the function (fallback)
            _fnRenderOptions = $element.data(DATA_ATTR_FILTER_VIEW_RENDER_OPTIONS_CALLBACK);
        }

        if (util_isFunction(_fnRenderOptions)) {
            _fnRenderOptions = eval(_fnRenderOptions);
        }
        else {
            _fnRenderOptions = null;
        }

        var _options = {
            "List": [],
            "HeadingToggleTitle": "Filters:",
            "AddItem": function (itemID, headingText, content, isHTML, renderOpts) {
                if (util_isNullOrUndefined(this.List)) {
                    this.List = [];
                }

                this.List.push({
                    "ID": itemID, "Heading": headingText, "Content": content, "IsHTML": util_forceBool(isHTML, false),
                    "RenderOptions": renderOpts
                });
            },
            "FooterHTML": "",
            "LayoutType": "table",  //supported are: table or free-flow
            "Events": {
                "OnLoad": null
            }
        };

        if (_fnRenderOptions != null) {
            var _temp = _fnRenderOptions($element, util_extend({}, _options));

            if (!util_isNullOrUndefined(_temp)) {
                _options = _temp;
            }
        }

        var _headingToggleTitle = util_forceString(_options["HeadingToggleTitle"]);

        if (_headingToggleTitle == "") {
            _headingToggleTitle = "Filters:";
        }

        _html += "<div class='ResultFilterContainer'>" +    //start tag #1        
                 "  <div class='ResultFilterToggleContainer'>" +    //header
                 "      <div class='DisableUserSelectable ResultFilterToggleHeading'>" + util_htmlEncode(_headingToggleTitle) + "</div>" +
                 "      <div class='ResultFilterToggleIcon'>" +
                 "          <a data-role='button' data-theme='transparent' data-mini='true' data-inline='true' data-icon='arrow-u' data-iconpos='notext'></a>" +
                 "      </div>" +
                 "  </div>";

        //content
        var _layoutType = util_forceString(_options["LayoutType"], "");

        if (_layoutType == "") {
            _layoutType = "table";
        }

        var _isTableLayout = (_layoutType == "table");
        var _isFreeFlowLayout = (_layoutType == "free-flow");

        _html += "  <div class='ResultFilterToggleContent'>";

        if (_isFreeFlowLayout) {
            _html += "<div class='ResultFilterFreeFlowView'>";  //open free flow tag #1
        }
        else {
            _html += "<table border='0' cellpadding='3' cellspacing='0'>";  //open table tag #1
        }

        var _filterList = _options["List"];

        if (util_isNullOrUndefined(_filterList)) {
            _filterList = [];
        }

        for (var i = 0; i < _filterList.length; i++) {
            var _item = _filterList[i];
            var _id = util_forceString(_item["ID"]);
            var _heading = util_forceString(_item["Heading"]);
            var _content = util_forceString(_item["Content"]);

            //NOTE: render options are supported based on the layout type
            var _renderOptions = util_extend({
                "CssClass": null
            }, _item["RenderOptions"]);

            if (!util_forceBool(_item["IsHTML"], false)) {
                _content = util_htmlEncode(_content);
            }

            var _attr = util_htmlAttribute("data-attr-filter-row-id", _id);
            var _headingHTML = util_htmlEncode(_heading + (_heading != "" ? ":" : ""));

            if (_isFreeFlowLayout) {
                _html += "<div class='RC" + (util_forceString(_renderOptions.CssClass) != "" ? " " + _renderOptions.CssClass : "") + "' " + _attr + ">" +
                         "  <div class='RC1'>" + _headingHTML + "</div>" +
                         "  <div class='RC2'>" + _content + "</div>" +
                          "</div>";
            }
            else {
                _html += "<tr " + _attr + ">" +
                         "  <td>" + _headingHTML + "</td>" +
                         "  <td>" + _content + "</td>" +
                         "</tr>";
            }
        }

        if (_isFreeFlowLayout) {
            _html += "</div>";  //close free flow tag #1
        }
        else {
            _html += "</table>";  //end: content; close table tag #1
        }

        _html += "      <div class='ResultFilterFooterContainer'>" + util_forceString(_options["FooterHTML"]) + "</div>" +
                 "  </div>";


        _html += "</div>";  //close tag #1

        $element.html(_html);
        $mobileUtil.refresh($element);

        js_bindEvent($element.find(".ResultFilterToggleContainer"), "click.filter_toggle", function () {
            var $btn = $(this);
            var _container = $btn.next(".ResultFilterToggleContent");
            var _visible = _container.is(":visible");
            var $btn = $element.find(".ResultFilterToggleIcon a.ui-btn");

            if (_visible) {
                _container.slideUp();
            }
            else {
                _container.slideDown();
            }

            $mobileUtil.ButtonUpdateIcon($btn, _visible ? "arrow-d" : "arrow-u");
        });

        if (_options["Events"] && util_isFunction(_options.Events["OnLoad"])) {
            _options.Events.OnLoad($element);
        }
    });
}

function renderer_tabStrip(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "tab_strip");

    $.each(_list, function (index) {
        var _element = $(this);
        var _configItem = renderer_getConfiguration(_element);
        var _config = { "FnGetItems": null };

        if (util_isFunction(_configItem[CONTROL_TAB_STRIP_EVENT_CALLBACK_ITEMS])) {
            _config.FnGetItems = eval(_configItem[CONTROL_TAB_STRIP_EVENT_CALLBACK_ITEMS]);
        }

        var _container = _element.children("[" + DATA_ATTR_TEMPLATE + "=content]");
        var _html = "";
        var _arrItems = [];

        if (_config.FnGetItems != null) {
            _arrItems = _config.FnGetItems(_element);
        }

        if (util_isNullOrUndefined(_arrItems)) {
            _arrItems = [];
        }

        if (_container.length == 0) {
            _container = $("<div></div>");
            _container.attr(DATA_ATTR_TEMPLATE, "content");

            _element.append(_container);
        }

        var _tabContainersHTML = "";

        _html += "<div class='CTabStripContainer'>"; //div tag #1
        _html += "<div class='CTabStripHeader'>";    //div tag #2

        _tabContainersHTML += "<div class='CTabStripContent'>"; //div tag #3

        var _length = _arrItems.length;
        var _selectedHeaderItemID = util_forceString(_element.attr("data-attr-tab-strip-selected-id"));

        for (var i = 0; i < _length; i++) {
            var _headerItem = _arrItems[i];
            var _id = util_forceString(_headerItem["ID"]);
            var _content = util_forceString(_headerItem["Content"]);
            var _isHTML = util_forceBool(_headerItem["IsHTML"], false);
            var _cssClass = util_forceString(_headerItem["CssClass"]);

            if (_id == "") {
                _id = "headerTabStrip_" + i;
            }

            _headerItem["ID"] = _id;

            //append the current header item HTML
            _html += "<div class='CTabStripHeaderItem" + (i == 0 ? " CTabStripHeaderItemFirst" : (i == _length - 1 ? " CTabStripHeaderItemLast" : "")) +
                         (_cssClass != "" ? " " + _cssClass : "") + "' " + util_htmlAttribute("data-attr-tab-strip-id", _id) + ">" +
                         (_isHTML ? _content : util_htmlEncode(_content)) +
                         "</div>";

            _tabContainersHTML += "<div class='CTabStripContentContainer' " + util_htmlAttribute("data-attr-tab-strip-content-link-id", _id) + "></div>";
        }

        _tabContainersHTML += "</div>"; //close div tag #3

        _html += "</div>";  //close div tag #2

        _html += _tabContainersHTML;    //append the tabs content container after the header element

        _html += "</div>";  //close div tag #1

        _container.html(_html);

        var _listHeaders = _element.find("[data-attr-tab-strip-id]");
        var _listContent = _element.find("[data-attr-tab-strip-content-link-id]");

        if (_selectedHeaderItemID == "" || _listHeaders.filter("[data-attr-tab-strip-id=" + _selectedHeaderItemID + "]").length != 1) {
            if (_length > 0) {
                var _item = _arrItems[0];
                _selectedHeaderItemID = util_forceString(_item["ID"]);
            }
            else {
                _selectedHeaderItemID = "";
            }
        }

        _listHeaders.addClass("CTabStripHeaderItemInactive");
        _listContent.hide();    //hide all the tab strip content containers

        if (util_forceString(_selectedHeaderItemID) != "") {
            _listHeaders.filter("[data-attr-tab-strip-id=" + _selectedHeaderItemID + "]")
                            .removeClass("CTabStripHeaderItemInactive")
                            .addClass("CTabStripHeaderItemActive");

            _element.attr("data-attr-tab-strip-selected-id", _selectedHeaderItemID);

            _listContent.filter("[data-attr-tab-strip-content-link-id=" + _selectedHeaderItemID + "]").show();
        }
        else {
            _element.removeAttr("data-attr-tab-strip-selected-id");
        }
    });

    var _listHeaderItems = _list.find("[data-attr-tab-strip-id]");

    js_bindHover(_listHeaderItems, function () {
        var _element = $(this);

        _element.addClass("CTabStripHeaderItemOver");
    });

    js_bindMouseEnter(_listHeaderItems, function () {
        var _element = $(this);

        _element.addClass("CTabStripHeaderItemOver");

    });

    js_bindMouseLeave(_listHeaderItems, function () {
        var _element = $(this);

        _element.removeClass("CTabStripHeaderItemOver");
    });

    js_bindClick(_listHeaderItems, function () {
        var _element = $(this);
        var _parent = $mobileUtil.FindAncestor(_element, "[" + DATA_ATTRIBUTE_RENDER + "=tab_strip]");
        var _id = util_forceString(_element.attr("data-attr-tab-strip-id"));
        var _currentID = util_forceString(_parent.attr("data-attr-tab-strip-selected-id"));

        if (_id != _currentID || util_forceValidEnum(_parent.attr("data-attr-tab-strip-init"), enCETriState, enCETriState.None) != enCETriState.Yes) {
            _parent.attr("data-attr-tab-strip-selected-id", _id);   //set the updated selected ID

            var _contentContainer = _parent.children("[" + DATA_ATTR_TEMPLATE + "=content]");
            var _listContainers = _contentContainer.find("[data-attr-tab-strip-content-link-id]");
            var _listHeaders = _contentContainer.find("[data-attr-tab-strip-id]");

            var _currentSelectedHeader = _listHeaders.filter(".CTabStripHeaderItemActive");

            _currentSelectedHeader.removeClass("CTabStripHeaderItemActive")
                                      .addClass("CTabStripHeaderItemInactive");

            _element.addClass("CTabStripHeaderItemActive");

            _listContainers.hide();

            var _currentTabContentContainer = _listContainers.filter("[data-attr-tab-strip-content-link-id=" + _id + "]");

            _currentTabContentContainer.show();

            var _fn = _parent.children("[" + DATA_ATTR_TEMPLATE + "=config]").attr(CONTROL_TAB_STRIP_EVENT_CALLBACK_HEADER_CLICK);

            if (util_isFunction(_fn)) {
                _fn = eval(_fn);

                _fn(_parent, _id, _currentTabContentContainer, function () {

                    //perform any additional configurations based on callback
                });
            }
        }
    });

    _list.attr("data-attr-tab-strip-init", enCETriState.No);   //set flag that the tab strip has not been initialized for the content
}

function renderer_video(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "video");

    var _qsTriState = { "IsToggleControls": CONTROL_VIDEO_IS_TOGGLE_CONTROLS, "IsAutoPlay": CONTROL_VIDEO_IS_AUTO_PLAY, "IsPreLoad": CONTROL_VIDEO_IS_PRE_LOAD,
        "IsLoop": CONTROL_VIDEO_IS_LOOP
    };

    var _qsVideoSource = { "SourceMP4": CONTROL_VIDEO_SOURCE_MP4, "SourceWEBM": CONTROL_VIDEO_SOURCE_WEBM, "SourceOGG": CONTROL_VIDEO_SOURCE_OGG, 
                           "PosterURL": CONTROL_VIDEO_POSTER_URL };

    $.each(_list, function (indx) {
        var _element = $(this);
        var _id = util_forceString(_element.attr("id"));
        var _width = Math.max(util_forceInt(_element.attr(CONTROL_VIDEO_WIDTH), -1), 100);
        var _height = Math.max(util_forceInt(_element.attr(CONTROL_VIDEO_HEIGHT), -1), 100);

        var _url = "<SITE_URL>home/video.aspx";

        _url = util_appendQS(_url, "ControlID", _id);
        _url = util_appendQS(_url, "Width", _width);
        _url = util_appendQS(_url, "Height", _height);

        for (var _qsName in _qsTriState) {
            _url = util_appendQS(_url, _qsName, util_forceValidEnum(_element.attr(_qsTriState[_qsName]), enCETriState, enCETriState.None));
        }

        for (var _qsName in _qsVideoSource) {
            _url = util_appendQS(_url, _qsName, util_escape(util_forceString(_element.attr(_qsVideoSource[_qsName]))));
        }

        //Note: important! in order for the video player to go into fullscreen, the iframe tag must allow fullscreen mode via its attributes
        var _html = "<iframe id='" + _id + "_video" + "' class='CVideoContent' frameborder='0' scrolling='no' width='" + _width + "' height='" + _height + "' " +
                    "src=\"" + _url + "\" " + 
                    "allowFullScreen='true' webkitallowfullscreen='true' mozallowfullscreen='true'></iframe>";

        _element.html(_html);

        if (_width >= 0 && _height >= 0) {
            _element.width(_width);
            _element.height(_height);
        }
    });

}

function renderer_slideshow(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "slideshow");

    var _fnSetImageURL = function (obj, imgContainer, index) {
        index = util_forceInt(index, 0);

        var _container = $(obj);

        var _url = util_forceString(_container.attr(CONTROL_SLIDESHOW_IMAGE_FORMAT_URL));
        var _numSlides = Math.max(util_forceInt(_container.attr(CONTROL_SLIDESHOW_NUM_SLIDES), 0), 0);

        if (index < 0 || index >= _numSlides) {
            index = 0;
        }

        _url = util_replaceAll(_url, "TOKEN_SLIDE_INDEX", index);

        var _title = (index + 1) + " of " + _numSlides;

        var _img = $(imgContainer);

        _img.attr("title", _title);

        _container.attr("data-attr-slideshow-animate", enCETriState.Yes);

        _img.fadeOut(500, function () {
            _img.attr("src", _url);
        });

        _container.attr(CONTROL_SLIDESHOW_CURRENT_SLIDE_INDEX, index);

        _container.find(".CSlideShowNavPageLabel").text(_title);

        var _navContainer = _container.find(".CSlideShowNavContainer");
        var _navButtonType = util_forceString(_container.attr(CONTROL_SLIDESHOW_NAV_BUTTON_TYPE), "link");

        if (_navButtonType == "dot") {
            var _btnList = _navContainer.find("[data-attr-slideshow-goto]");

            _btnList.removeClass("CSlideShowCurrentButton");

            _btnList.filter("[data-attr-slideshow-goto=" + index + "]").addClass("CSlideShowCurrentButton");
        }
    };

    var _fnOnTimer = function (id, delayMax, checkActive) {
        var _container = $mobileUtil.GetElementByID(id);
        var _currentSlideIndex = util_forceInt(_container.attr(CONTROL_SLIDESHOW_CURRENT_SLIDE_INDEX), 0);
        var _numSlides = Math.max(util_forceInt(_container.attr(CONTROL_SLIDESHOW_NUM_SLIDES), 0), 0);
        var _isPause = util_forceInt(_container.attr("data-attr-slideshow-paused"));
        var _isAnimate = util_forceInt(_container.attr("data-attr-slideshow-animate"));

        checkActive = util_forceBool(checkActive, false);

        if ((_isAnimate == enCETriState.Yes) ||
             (checkActive && util_forceValidEnum(_container.attr("data-attr-slideshow-active-timer"), enCETriState, enCETriState.None) == enCETriState.Yes)
           ) {
            return; //do nothing since a timer is already active on the element or animation in progress
        }

        _container.attr("data-attr-slideshow-active-timer", enCETriState.Yes);

        if (_container.length == 0 || _currentSlideIndex + 1 == _numSlides || _numSlides <= 0 || _isPause == enCETriState.Yes) {
            if (_isPause != enCETriState.Yes) {
                _total = 0;
            }

            _container.removeAttr("data-attr-slideshow-active-timer");
        }
        else {
            var _recursive = function () {
                setTimeout(function () {
                    _fnOnTimer(id, delayMax);
                }, 100);
            };

            var _total = util_forceInt(_container.attr("data-attr-slideshow-timer-total"), 0);

            _total += 100;

            if (_total >= delayMax) {

                var _img = _container.find("img[data-attr-slideshow-image]");

                if (_currentSlideIndex + 1 < _numSlides) {
                    _total = 0;

                    _fnSetImageURL(_container, _img, _currentSlideIndex + 1);
                    _recursive();
                }
            }
            else {
                _recursive();
            }
        }

        _container.attr("data-attr-slideshow-timer-total", _total);

        var _indicator = _container.find(".CSlideShowTimerIndidcator");
        _indicator.css("width", Math.min(_total / (delayMax * 1.00) * 100.00, 100.00) + "%");
    };

    $.each(_list, function (indx) {
        var _element = $(this);
        var _id = util_forceString(_element.attr("id"));

        if (_id == "") {
            _id = renderer_uniqueID();
            _element.attr("id", _id);
        }

        var _templateNavBtnFn = util_forceString(_element.attr(CONTROL_SLIDESHOW_EVENT_CALLBACK_NAV_TEMPLATE_HTML), "");

        var _imgWidth = Math.max(util_forceInt(_element.attr(CONTROL_SLIDESHOW_IMAGE_WIDTH), -1), 100);
        var _imgHeight = Math.max(util_forceInt(_element.attr(CONTROL_SLIDESHOW_IMAGE_HEIGHT), -1), 100);

        var _currentSlideIndex = util_forceInt(_element.attr(CONTROL_SLIDESHOW_CURRENT_SLIDE_INDEX), 0);
        var _numSlides = Math.max(util_forceInt(_element.attr(CONTROL_SLIDESHOW_NUM_SLIDES), 0), 0);
        var _navButtonType = util_forceString(_element.attr(CONTROL_SLIDESHOW_NAV_BUTTON_TYPE), "link");
        var _navButtonDataTheme = util_forceString(_element.attr(CONTROL_SLIDESHOW_NAV_BUTTON_DATA_THEME), "a");

        var _toggleTimer = util_forceValidEnum(_element.attr(CONTROL_SLIDESHOW_TOGGLE_TIMER), enCETriState, enCETriState.None);
        var _timerDelayMS = Math.max(util_forceInt(_element.attr(CONTROL_SLIDESHOW_TIMER_DELAY), 0), 1000);

        var _navControls = "<div class='CSlideShowNavContainer'>";

        var _attrDataTheme = "data-theme='" + _navButtonDataTheme + "'";
        if (_navButtonType == "link") {

            _navControls += "<a data-attr-slideshow-nav='prev' data-role='button' data-inline='true' data-mini='true' data-iconpos='notext' data-icon='arrow-l' " +
                                _attrDataTheme + "></a>" +
                                "<span class='CSlideShowNavPageLabel' />" +
                                "<a data-attr-slideshow-nav='next' data-role='button' data-inline='true' data-mini='true' data-iconpos='notext' data-icon='arrow-r' " +
                                _attrDataTheme + "></a>";
        }
        else if (_navButtonType == "dot") {
            if (_numSlides > 0) {
                var _navButtonTemplateHTML = "";

                if (util_isFunction(_templateNavBtnFn)) {
                    _templateNavBtnFn = eval(_templateNavBtnFn);

                    _navButtonTemplateHTML = _templateNavBtnFn(_element);   //get button template HTML from callback
                }
                else {
                    _templateNavBtnFn = null;
                }

                if (util_forceString(_navButtonTemplateHTML) == "") {
                    _navButtonTemplateHTML = "<a SLIDESHOW_TOKEN_DATA_ATTRIBUTES data-role='button' data-inline='true' data-mini='true' " + _attrDataTheme + ">" +
                                             "SLIDESHOW_TOKEN_PAGE_NO_TEXT" + "</a>";
                }

                for (var i = 0; i < _numSlides; i++) {
                    var _navTokens = {};

                    _navTokens["SLIDESHOW_TOKEN_DATA_ATTRIBUTES"] = "data-attr-slideshow-goto='" + i + "'";
                    _navTokens["SLIDESHOW_TOKEN_PAGE_NO_TEXT"] = util_htmlEncode(i + 1);

                    _navControls += util_replaceTokens(_navButtonTemplateHTML, _navTokens);
                }
            }
        }
        else if (_navButtonType == "none") {

        }

        _navControls += "</div>";

        _element.html("<div class='CSlideShowContainer'>" +
                      "<div class='CSlideShowTimerIndidcator' style='width: 0%;'>&nbsp;</div>" +
                      " <div class='CSlideShowImageContainer' style='width: " + _imgWidth + "px; height: " + _imgHeight + "px;'>" +
                      "     <img data-attr-slideshow-image='" + enCETriState.Yes + "' alt='slide' width='" + _imgWidth + "' height='" + _imgHeight + "' title='' " +
                      "style='display: none;' />" +
                      " </div>" +
                      _navControls +
                      "</div>");

        var _img = _element.find("img");

        _fnSetImageURL(_element, _img, _currentSlideIndex);

        if (_toggleTimer == enCETriState.Yes) {
            setTimeout(function () {
                _fnOnTimer(_id, _timerDelayMS);
            }, 100);
        }
    });

    var _imgList = _list.find("img[data-attr-slideshow-image]");

    js_bindClick(_imgList, function () {
        var _imgContainer = $(this);
        var _renderContainer = $mobileUtil.FindAncestor(_imgContainer, "[" + DATA_ATTRIBUTE_RENDER + "]");

        var _isToggleCycleImage = util_forceValidEnum(_renderContainer.attr(CONTROL_SLIDESHOW_TOGGLE_IMAGE_CLICK), enCETriState, enCETriState.None);
        var _toggleTimer = util_forceValidEnum(_renderContainer.attr(CONTROL_SLIDESHOW_TOGGLE_TIMER), enCETriState, enCETriState.None);

        if (_isToggleCycleImage == enCETriState.Yes) {
            var _index = util_forceInt(_renderContainer.attr(CONTROL_SLIDESHOW_CURRENT_SLIDE_INDEX), 0);

            _fnSetImageURL(_renderContainer, _imgContainer, _index + 1);
        }
        else if (_toggleTimer == enCETriState.Yes) {
            var _isPaused = util_forceValidEnum(_renderContainer.attr("data-attr-slideshow-paused"), enCETriState, enCETriState.None);

            if (_isPaused == enCETriState.Yes) {
                _renderContainer.attr("data-attr-slideshow-paused", enCETriState.No);

                setTimeout(function () {
                    _fnOnTimer(_renderContainer.attr("id"), Math.max(util_forceInt(_renderContainer.attr(CONTROL_SLIDESHOW_TIMER_DELAY), 0), 1000), true);
                }, 100);
            }
            else {
                _renderContainer.attr("data-attr-slideshow-paused", enCETriState.Yes);
            }
        }
    });

    _imgList.unbind("load");
    _imgList.load(function () {
        var _img = $(this);
        var _renderContainer = $mobileUtil.FindAncestor(_img, "[" + DATA_ATTRIBUTE_RENDER + "]");

        _img.css("position", "absolute");
        _img.css("top", "0px");
        _img.css("left", "0px");

        var _transition = util_forceString(_renderContainer.attr(CONTROL_SLIDESHOW_TRANSITION));

        var _fnAnimationComplete = function () {
            _renderContainer.removeAttr("data-attr-slideshow-animate");
            _renderContainer.removeAttr("data-attr-slideshow-active-timer");

            var _isPause = util_forceInt(_renderContainer.attr("data-attr-slideshow-paused"));

            if (_isPause != enCETriState.Yes) {
                setTimeout(function () {
                    _fnOnTimer(_renderContainer.attr("id"), Math.max(util_forceInt(_renderContainer.attr(CONTROL_SLIDESHOW_TIMER_DELAY), 0), 1000), true);
                }, 100);
            }
        };

        if (_transition == "slide_horizontal") {
            _img.css("left", _img.width() + "px");

            _img.show();
            _img.animate({ "left": "0px" }, "slow", null, _fnAnimationComplete);
        }
        else if (_transition == "slide_vertical") {
            _img.css("top", _img.height() + "px");

            _img.show();
            _img.animate({ "top": "0px" }, "slow", null, _fnAnimationComplete);
        }
        else if (_transition == "none") {
            _img.show();
            _fnAnimationComplete();
        }
        else {

            //default fade
            _img.fadeIn("slow", _fnAnimationComplete);
        }
    });

    js_bindClick(_list.find("[data-attr-slideshow-nav]"), function () {
        var _btn = $(this);
        var _renderContainer = $mobileUtil.FindAncestor(_btn, "[" + DATA_ATTRIBUTE_RENDER + "]");

        var _type = util_forceString(_btn.attr("data-attr-slideshow-nav"));

        var _index = util_forceInt(_renderContainer.attr(CONTROL_SLIDESHOW_CURRENT_SLIDE_INDEX), 0);
        var _newIndex = _index;
        var _numSlides = Math.max(util_forceInt(_renderContainer.attr(CONTROL_SLIDESHOW_NUM_SLIDES), 0), 0);

        if (_type == "next") {
            _newIndex++;

            if (_newIndex >= _numSlides) {
                _newIndex = _numSlides - 1;
            }
        }
        else {
            _newIndex--;

            if (_newIndex < 0) {
                _newIndex = 0;
            }
        }

        if (_index != _newIndex) {
            _fnSetImageURL(_renderContainer, _renderContainer.find("img[data-attr-slideshow-image]"), _newIndex);
        }

        return false;
    });

    js_bindClick(_list.find("[data-attr-slideshow-goto]"), function () {
        var _btn = $(this);
        var _renderContainer = $mobileUtil.FindAncestor(_btn, "[" + DATA_ATTRIBUTE_RENDER + "]");

        var _type = util_forceString(_btn.attr("data-attr-slideshow-nav"));

        var _index = util_forceInt(_btn.attr("data-attr-slideshow-goto"), 0);
        var _currentIndex = util_forceInt(_renderContainer.attr(CONTROL_SLIDESHOW_CURRENT_SLIDE_INDEX), 0);

        if (_index != _currentIndex) {

            //reset the total
            _renderContainer.attr("data-attr-slideshow-timer-total", 0);

            _fnSetImageURL(_renderContainer, _renderContainer.find("img[data-attr-slideshow-image]"), _index);
        }

        return false;
    });
}

function renderer_sprite(context, options) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "sprite");

    $.each(_list, function (indx) {
        var _element = $(this);
        var _id = util_forceString(_element.attr("id"));

        var _width = Math.max(util_forceInt(_element.attr(CONTROL_SPRITE_IMAGE_WIDTH), 0), 10);
        var _height = Math.max(util_forceInt(_element.attr(CONTROL_SPRITE_IMAGE_HEIGHT), 0), 10);
        var _placeholderURL = util_forceString(_element.attr(CONTROL_SPRITE_DEFAULT_IMAGE_URL), "");

        var _fnImageSource = util_forceString(_element.attr(CONTROL_SPRITE_EVENT_CALLBACK_IMAGE_SOURCE), "");
        var _fnOnImageLoad = util_forceString(_element.attr(CONTROL_SPRITE_EVENT_CALLBACK_IMAGE_LOAD));

        var _frameRate = Math.max(util_forceInt(_element.attr(CONTROL_SPRITE_FRAME_RATE)), 0);

        if (_id == "") {
            _id = util_forceString(_element.attr("data-attr-sprite-id"));
        }

        if (_id == "") {
            _id = renderer_uniqueID();
        }

        var _html = "<div class='CSpriteContainer' style='width: " + _width + "px; height: " + _height + "px;'>" +
                    "   <img class='CSpriteImage' alt='' title='' " + util_htmlAttribute("width", _width) + " " + util_htmlAttribute("height", _height) + " />" +
                    "   <div class='CSpriteIndicator' />" +
                    "</div>";

        _element.html(_html);

        _element.attr("data-attr-sprite-id", _id);

        var _img = _element.find("img");

        if (_placeholderURL != "") {
            _img.attr("src", _placeholderURL);
            _img.show();
        }
        else {
            _img.hide();
        }

        //load images
        var _option = { NumItems: 0, Data: [], CurrentIndex: 0 };

        if (util_isFunction(_fnImageSource)) {
            _fnImageSource = eval(_fnImageSource);

            _option.Data = _fnImageSource(_element);
        }

        if (util_isFunction(_fnOnImageLoad)) {
            _fnOnImageLoad = eval(_fnOnImageLoad);
        }
        else {
            _fnOnImageLoad = null;
        }

        if (util_isNullOrUndefined(_option["Data"])) {
            _option["Data"] = [];
        }

        _option.NumItems = _option.Data.length;

        var _imgTemplate = "<img class='CSpriteImage' alt='' title='' " + util_htmlAttribute("width", _width) + " " + util_htmlAttribute("height", _height) + " />";

        var _fnGetImage = function (container, option, imgTemplate, fnImageOnLoad) {
            if (option.CurrentIndex < option.NumItems) {
                var _name = util_forceString(container.attr("data-attr-sprite-id"));

                if (option.CurrentIndex == 0) {
                    $mobileUtil.RendererCache.SetItem("sprite", _name, []);
                }

                var _url = option.Data[option.CurrentIndex];
                var _imgObj = $(util_forceString(imgTemplate, "<img />"));

                _imgObj.hide();

                container.find(".CSpriteContainer").append(_imgObj);

                _imgObj.load(function () {
                    if (fnImageOnLoad != null) {
                        fnImageOnLoad(container, option);
                    }

                    option.CurrentIndex += 1;

                    setTimeout(function () {
                        _fnGetImage(container, option, imgTemplate, fnImageOnLoad);
                    }, 100);
                });

                var _item = $mobileUtil.RendererCache.GetItem("sprite", _name);

                if (util_isNullOrUndefined(_item)) {
                    _item = [];
                    $mobileUtil.RendererCache.SetItem("sprite", _name, _item);
                }

                _imgObj.attr("data-attr-sprite-frame-index", option.CurrentIndex);
                _imgObj.attr("src", _url);
            }
            else {
                var _fnFrameShow = function (index, total) {
                    if (index + 1 >= total) {

                    }
                    else {
                        var _list = container.find(".CSpriteImage");

                        _list.filter(":visible").remove();
                        _list.filter("[data-attr-sprite-frame-index=" + index + "]").show();

                        setTimeout(function () {
                            _fnFrameShow(index + 1, total);
                        }, _frameRate);
                    }
                };

                _fnFrameShow(0, option.NumItems);
            }
        };

        setTimeout(function () {
            _fnGetImage(_element, _option, _imgTemplate, _fnOnImageLoad);
        }, 100);
    });
}

function renderer_model_input(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "model_input", null, filterList);

    _list.addClass("ModelInputContainer")
         .addClass("InlineBlock");

    $.each(_list, function (indx) {
        var _element = $(this);

        var _html = null;

        if (MODEL_MANAGER.IsInit) {
            var _refName = util_forceString(_element.attr(DATA_ATTR_MODEL_REF_NAME), "");
            var _refIndex = util_forceInt(_element.attr(DATA_ATTR_MODEL_REF_INDEX), 0);
            var _isEditable = util_forceValidEnum(_element.attr(DATA_ATTR_MODEL_INPUT_IS_EDITABLE), enCETriState, enCETriState.None);

            var _reference = model_getReference(_refName);
            var _value = model_getValue(_refName, _refIndex, true); //formatted value

            var _isUserModified = model_getValueIsModified(_refName, _refIndex);

            if (_isEditable == enCETriState.None) {

                //the editable attribute value is invalid or not specified, as such use the reference properties to determine the type of reference it is

                if (_reference[enColCModelReferenceDetailProperty.ReferenceType] == enReferenceType.refInput) {
                    _isEditable = enCETriState.Yes;
                }
                else {
                    _isEditable = enCETriState.No;
                }
            }

            if (_isEditable == enCETriState.Yes) {
                var _input = _element.find("input.ModelInput");

                if (_input.length > 0) {

                    //update the input value
                    _input.val(util_forceString(_value));
                }
                else {

                    //initialize the input element
                    _html = "<input class='ModelInput' type='text' data-mini='true' value=\"" + util_jsEncode(_value) + "\" />";
                }
            }
            else {
                _html = util_htmlEncode(_value);
            }

            if (_isUserModified) {
                _element.addClass("ModelInputUserModified");
            }
            else {
                _element.removeClass("ModelInputUserModified");
            }
        }
        else {
            _html = "<span style='color: #FF0000; font-size: 0.8em;'>" + util_htmlEncode("ERROR|model init") + "</span>";
        }

        if (_html != null) {
            _element.html(_html);
        }

    });

    util_configureKeyPress(_list.find("input.ModelInput"), KEY_CODES.ENTER, function (obj) {
        var _inputElement = $(obj);

        _inputElement.trigger("blur");
    });
}

function renderer_model_restore_default(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "model_restore_default", null, filterList);

    _list.unbind("click.modelRestoreDefault");
    _list.bind("click.modelRestoreDefault", function () {
        var _element = $(this);
        var _tag = util_forceString(_element.attr(DATA_ATTR_MODEL_RESTORE_DEFAULT_MODEL_TAG));
        var _restoreSectionName = util_forceString(_element.attr(DATA_ATTR_MODEL_RESTORE_DEFAULT_SECTION_NAME));

        var _message = util_forceString(_element.attr(DATA_ATTR_MODEL_RESTORE_DEFAULT_MSG));
        var _isConfirm = util_forceValidEnum(_element.attr(DATA_ATTR_MODEL_RESTORE_DEFAULT_IS_CONFIRM), enCETriState, enCETriState.None);
        var _restoreFromCurrentScenario = (util_forceValidEnum(_element.attr(DATA_ATTR_MODEL_RESTORE_DEFAULT_FROM_SCENARIO), enCETriState, enCETriState.No) == enCETriState.Yes);

        var _fnRestoreCallback = _element.attr(DATA_ATTR_MODEL_RESTORE_DEFAULT_CALLBACK);

        if (util_isFunction(_fnRestoreCallback)) {
            _fnRestoreCallback = eval(_fnRestoreCallback);
        }
        else {
            _fnRestoreCallback = null;
        }

        if (_tag != "") {
            try {
                _tag = util_parse(_tag);
            } catch (e) {
                _tag = null;
            }
        }

        if (_tag == "") {
            _tag = null;
        }

        model_restoreDefault(_tag, _restoreSectionName, _restoreFromCurrentScenario, _fnRestoreCallback, _isConfirm == enCETriState.Yes, _message);
    });
}

function renderer_model_chart(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "model_chart", null, filterList);

    _list.addClass("ModelChartContainer")
         .addClass("InlineBlock");

    var _window = $(window);

    var _windowWidth = _window.width();
    var _windowHeight = _window.height();

    var _fnGetRatio = function (val) {
        var _ratio = 0;

        val = util_forceFloat(val, 0);

        if (val >= 0 && val <= 1) {
            _ratio = val;
        }

        return _ratio;
    };

    $.each(_list, function (indx) {
        var _element = $(this);

        var _chartID = util_forceString(_element.attr(DATA_ATTR_MODEL_CHART_ID));
        var _width = util_forceInt(_element.attr(DATA_ATTR_MODEL_WIDTH), 0);
        var _height = util_forceInt(_element.attr(DATA_ATTR_MODEL_HEIGHT), 0);

        var _pctWidth = _fnGetRatio(_element.attr(DATA_ATTR_MODEL_WIDTH_PCT));
        var _pctHeight = _fnGetRatio(_element.attr(DATA_ATTR_MODEL_HEIGHT_PCT));

        if (_width <= 0) {
            _width = MODEL_MANAGER.Configuration.Charts.MinWidth;
        }

        if (_height <= 0) {
            _height = MODEL_MANAGER.Configuration.Charts.MinHeight;
        }

        if (_pctWidth > 0) {
            _width = Math.max(_windowWidth * _pctWidth, _width);
        }

        if (_pctHeight > 0) {
            _height = Math.max(_windowHeight * _pctHeight, _height);
        }

        if (util_isDefined(_chartID)) {
            var _fn = eval(_chartID);
            var _chartOptions = _fn(_element);

            _element.css("width", _width + "px")
                    .css("height", _height + "px");

            _element.highcharts(_chartOptions);
        }
        else {
            _element.html("");
        }
    });
}

function renderer_lang_label(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "lang_label", null, filterList);

    $.each(_list, function (indx) {
        var _element = $(this);

        var _key = util_forceString(_element.attr(DATA_ATTR_LANG_LABEL_KEY));
        var _defaultVal = _element.attr(DATA_ATTR_LANG_LABEL_DEFAULT);
        var _hasDefault = (!util_isNullOrUndefined(_defaultVal));
        var _valid = false;

        if (util_isDefined("LANG_TRANSLATIONS")) {
            _valid = (!util_isNullOrUndefined(LANG_TRANSLATIONS[_key]));
        }

        if (_valid || (!_valid && _hasDefault)) {
            _element.text(_valid ? LANG_TRANSLATIONS[_key] : _defaultVal);
        }
        else {
            _element.html("<span style='color: #FF0000;'>" + util_htmlEncode("Translation entry not found - '" + _key + "'") + "</span>");
        }

    });
}

function renderer_editorTemplateCollapsibleGroup(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "editor_collapsible_group", null, filterList);

    $.each(_list, function (indx) {
        var _element = $(this);

        var _forceDefault = (util_forceValidEnum(_element.attr(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_FORCE_DEFAULT), enCETriState, enCETriState.No, true) == enCETriState.Yes);
        var _isExclusive = (util_forceValidEnum(_element.attr(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_EXCLUSIVE_TOGGLE), enCETriState, enCETriState.Yes, true) == enCETriState.Yes);

        var _toggleAllType = util_forceString(_element.attr(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_TOGGLE_ALL_TYPE));
        var _toggleAllShow = (_toggleAllType == "show");
        var _toggleAllHide = (_toggleAllType == "hide");
        var _hasToggleAll = (_toggleAllShow || _toggleAllHide);

        var _groupItems = _element.children(".CEditorCollapsibleItem");
        var _contentList = _groupItems.children(".CEditorCollapsibleContent");

        var _selectedIndex = util_forceInt(_element.attr(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_SELECTED), -1);

        if ((_selectedIndex < 0 && _forceDefault) || _selectedIndex >= _groupItems.length) {
            _selectedIndex = 0;
        }

        var _valid = (_selectedIndex >= 0);

        if (_hasToggleAll) {
            _element.removeAttr(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_SELECTED);
            _valid = false;
        }

        if (_valid) {
            _element.attr(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_SELECTED, _selectedIndex);    //set the selected index
        }

        _contentList.hide();

        if (_valid && _groupItems.length > 0 && _selectedIndex < _groupItems.length) {
            $(_groupItems[_selectedIndex]).find(".CEditorCollapsibleContent").show();
        }
        else if (_hasToggleAll) {
            var _contentList = _groupItems.find(".CEditorCollapsibleContent");

            if (_toggleAllShow) {
                _contentList.show();
            }
            else if (_toggleAllHide) {
                _contentList.hide();
            }
        }

        _element.addClass("CEditorCollapsibleGroup");

        //bind the header click event
        var _headerList = _groupItems.children(".CEditorCollapsibleHeader");

        _headerList.unbind("click.editor_collapsible_group");
        _headerList.bind("click.editor_collapsible_group", function () {
            var _header = $(this);
            var _groupItem = $mobileUtil.FindClosest(_header, ".CEditorCollapsibleItem");
            var _groupContent = _groupItem.children(".CEditorCollapsibleContent");

            var _isVisible = (_groupContent.is(":visible"));

            var _groupContainer = $mobileUtil.FindClosest(_groupItem, ".CEditorCollapsibleGroup");
            var _contentList = _groupContainer.find(".CEditorCollapsibleContent");
            var _itemList = _groupContainer.find(".CEditorCollapsibleItem");

            var _isExclusive = (util_forceValidEnum(_groupContainer.attr(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_EXCLUSIVE_TOGGLE), enCETriState, enCETriState.Yes, true) ==
                                enCETriState.Yes);

            if (_isExclusive) {
                _contentList.filter(":visible").hide();
            }

            if (!_isVisible) {
                _groupContent.show();
                _groupContainer.attr(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_SELECTED, _itemList.index(_groupItem));
            }
            else {

                if (!_isExclusive) {
                    _groupContent.hide();
                }

                _groupContainer.removeAttr(DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_SELECTED);
            }
        });

    });
}

function renderer_editorTemplateReadMoreLess(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "editor_read_more_less", null, filterList);

    var _fnSetButtonText = function (btn, element, contentContainer) {
        var _isMinimized = contentContainer.hasClass("CEditorContentReadMoreLessStateMinimized");

        $mobileUtil.ButtonSetTextByElement(btn, _isMinimized ? "Read More" : "Read Less");
    };

    $.each(_list, function (indx) {
        var _element = $(this);
        var _content = _element.children(".CEditorContentReadMoreLessContent");
        var _toggleContainer = _element.children(".CEditorContentReadMoreLessToggle");

        if (util_forceInt(_content.attr("data-attr-is-init"), enCETriState.None) != enCETriState.Yes) {
            _content.addClass("CEditorContentReadMoreLessStateMinimized");
            _content.attr("data-attr-is-init", enCETriState.Yes);

            if (_toggleContainer.length == 0) {
                _toggleContainer = $("<div class='CEditorContentReadMoreLessToggle'>" +
                                     "    <a class='CEditorContentReadMoreLessToggleButton' " + util_htmlAttribute("data-attr-editor-read-less-more-toggle", enCETriState.Yes) +
                                     " data-role='button' data-theme='btn-editor-read-more-toggle' data-corners='false' data-inline='true' data-mini='true'>" + "&nbsp;" + "</a>" +
                                     "</div>");

                _element.append(_toggleContainer);
                _element.trigger("create");
            }
        }

        var _btnToggle = _toggleContainer.find("a[data-attr-editor-read-less-more-toggle]");

        _fnSetButtonText(_btnToggle, _element, _content);
    });

    var _btnList = _list.find("a[data-attr-editor-read-less-more-toggle]");

    _btnList.unbind("click.edtior_read_more_less_toggle");
    _btnList.bind("click.edtior_read_more_less_toggle", function () {
        var _btn = $(this);
        var _element = _btn.closest("[" + util_renderAttribute("editor_read_more_less") + "]");
        var _content = _element.children(".CEditorContentReadMoreLessContent");

        if (_content.hasClass("CEditorContentReadMoreLessStateMinimized")) {
            _content.removeClass("CEditorContentReadMoreLessStateMinimized");
            _content.addClass("CEditorContentReadMoreLessStateExpanded");
        }
        else {
            _content.addClass("CEditorContentReadMoreLessStateMinimized");
            _content.removeClass("CEditorContentReadMoreLessStateExpanded");
        }

        _fnSetButtonText(_btn, _element, _content);

    });
}

function renderer_editorTemplateSubsectionLink(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "editor_subsection_link", null, filterList);

    _list.unbind("click.editor_subsection_link");
    _list.bind("click.editor_subsection_link", function () {
        var _element = $(this);
        var _fnLoadCallback = _element.attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_LOAD_CALLBACK);
        var _fnOnClickCallback = _element.attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_ON_CLICK_CALLBACK);
        var _searchAncestorSelector = util_forceString(_element.attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_ANCESTOR_SELECTOR));
        var _fnFormatHtmlCallback = _element.attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_FORMAT_HTML_CALLBACK);
        var _fnGetContainerCallback = _element.attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_GET_CONTAINER_CALLBACK);

        var _subsectionLinkID = util_forceInt(_element.attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_PRES_SUBSECTION_LINK_ID), enCE.None);

        if (_subsectionLinkID != enCE.None &&
            (_searchAncestorSelector != "" || util_isFunction(_fnGetContainerCallback))
            ) {

            var _propagateOption = { "PreventDefault": false };

            if (util_isFunction(_fnOnClickCallback)) {
                _fnOnClickCallback = eval(_fnOnClickCallback);

                _propagateOption = _fnOnClickCallback({ "ID": _subsectionLinkID, "Target": _element });
            }

            if ((util_isNullOrUndefined(_propagateOption) || (util_forceBool(_propagateOption["PreventDefault"], false) == false)) &&
                 util_isFunction("global_extSubsectionPrimaryKey")) {

                global_extSubsectionPrimaryKey({ "SubsectionID": _subsectionLinkID }, function (data) {
                    data = util_forceObject(data);

                    var _html = util_forceString(data[enColExternalSubsectionProperty.Content]);

                    var _container = null;
                    var _options = { "ID": _subsectionLinkID, "Target": _element, "HTML": _html, "Container": _container, "Data": data };

                    if (util_isFunction(_fnGetContainerCallback)) {
                        _fnGetContainerCallback = eval(_fnGetContainerCallback);

                        _options = _fnGetContainerCallback(_options);

                        if (!util_isNullOrUndefined(_options)) {
                            _container = _options["Container"];
                        }
                        else {
                            _container = null;
                        }
                    }
                    else {
                        _container = $mobileUtil.FindClosest(_element, _searchAncestorSelector);
                    }

                    _options = util_extend(_options, { "ID": _subsectionLinkID, "Target": _element, "HTML": _html, "Container": _container, "Data": data }, true);

                    if (!util_isNullOrUndefined(_container) && _container.length == 1) {

                        _container.attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_CURRENT_SUBSECTION_LINK_ID, _subsectionLinkID);   //set attribute for current subsection link ID

                        //check if a format html callback is provided, and if so execute it and get updated HTML content (requires synchronous callback)
                        if (util_isFunction(_fnFormatHtmlCallback)) {
                            _fnFormatHtmlCallback = eval(_fnFormatHtmlCallback);

                            _options = _fnFormatHtmlCallback(_options);

                            if (!util_isNullOrUndefined(_options)) {
                                _html = util_forceString(_options["HTML"]);
                            }
                        }

                        _container.html(_html);

                        $mobileUtil.refresh(_container);

                        if (util_isFunction(_fnLoadCallback)) {
                            _fnLoadCallback = eval(_fnLoadCallback);
                            _fnLoadCallback(_options, {
                                "IsInlineView": (util_forceInt(_element.attr(DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_IS_INLINE), enCETriState.None) == enCETriState.Yes)
                            });
                        }
                    }
                });
            }
        }
    });
}

function renderer_editorProjectSubsectionNavigationMetadata(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "editor_project_subsection_navigation_metadata", null, filterList);

    if (_list.length > 0) {
        _list.hide();
        _list.parent().hide();
    }
}

function renderer_dragDropColumn(context, options, filterList) {
    context = global_forceContext(context);

    var _list = renderer_getFilteredList(context, "drag_drop_column", null, filterList);

    $.each(_list, function (indx) {
        var _element = $(this);
        var _fnGetOptions = _element.attr(DATA_ATTR_DRAG_DROP_COLUMN_GET_OPTIONS_CALLBACK);
        var _html = "";

        if (util_isFunction(_fnGetOptions)) {
            _fnGetOptions = eval(_fnGetOptions);

            var _options = { "Target": _element, "Groups": [], "FnOnPostSortUpdate": null };

            _options = util_extend(_options, _fnGetOptions({ "Target": _element, "Groups": [] }));

            var _groups = _options["Groups"];

            if (util_isNullOrUndefined(_groups)) {
                _groups = [];
            }

            if (_groups.length > 0) {

                _html += "<div class='InlineBlock'>";

                for (var i = 0; i < _groups.length; i++) {
                    var _groupOption = _groups[i];

                    _groupOption = util_extend({ "ID": "group_" + i, "HeaderHTML": "", "FooterHTML": "", "Items": [] }, _groupOption);

                    //open group tag #1
                    _html += "<div class='InlineBlock sortable CDragDropColumnGroup' " + util_htmlAttribute(DATA_ATTR_DRAG_DROP_COLUMN_GROUP_CONTAINER_ID, _groupOption["ID"]) + ">";

                    //header
                    if (util_forceString(_groupOption["HeaderHTML"]) != "") {
                        _html += "<div>" + _groupOption["HeaderHTML"] + "</div>";
                    }

                    //content items
                    var _items = _groupOption["Items"];

                    if (util_isNullOrUndefined(_items)) {
                        _items = [];
                    }

                    _html += "<div class='CDragDropColumnGroupContent'>";

                    for (var j = 0; j < _items.length; j++) {
                        var _itemOption = _items[j];

                        _itemOption = util_extend({ "ID": "groupItem_" + j, "HTML": "" }, _itemOption);

                        _html += "<div class='draggable CDragDropColumnGroupItem' " + util_htmlAttribute(DATA_ATTR_DRAG_DROP_COLUMN_GROUP_ITEM_ID, _itemOption["ID"]) + ">" +
                                 util_forceString(_itemOption["HTML"]) +
                                 "</div>";
                    }

                    _html += "</div>";

                    //footer
                    if (util_forceString(_groupOption["FooterHTML"]) != "") {
                        _html += "<div>" + _groupOption["FooterHTML"] + "</div>";
                    }

                    //close group tag #1
                    _html += "</div>";
                }

                _html += "</div>";
            }
        }

        _element.html(_html);

        var _elementCtx = _element.find(".CDragDropColumnGroupContent")
                                  .sortable({ connectWith: ".CDragDropColumnGroupContent",
                                      items: ":not([" + DATA_ATTR_DRAG_DROP_COLUMN_GROUP_ITEM_DISABLED + "])"
                                  });

        _elementCtx.unbind("sortupdate.renderer");

        var _fnSortUpdate = _options["FnOnPostSortUpdate"];

        if (util_isFunction(_fnSortUpdate)) {
            _fnSortUpdate = eval(_fnSortUpdate);
        }
        else {
            _fnSortUpdate = null;
        }

        _elementCtx.bind("sortupdate.renderer", function () {
            if (_fnSortUpdate) {
                _fnSortUpdate({ "Target": _element });
            }
        });
    });
}

function renderer_getConfiguration(element) {
    var _ret = {};
    var _configElement = $(element).children("[" + DATA_ATTR_TEMPLATE + "=config]").first();

    if (_configElement.length == 1) {
        _configElement.hide();  //hide the element

        $.each(_configElement.get(0).attributes, function (i, attrDOM) {
            _ret[attrDOM.name] = attrDOM.value;
        });
    }

    return _ret;
}

function renderer_getFilteredList(context, controlValue, isApplyExtRender, filterList) {
    var _ret = null;

    isApplyExtRender = util_forceBool(isApplyExtRender, false);

    controlValue = util_forceString(controlValue);

    var _selector = "[" + DATA_ATTRIBUTE_RENDER + "=" + controlValue + "]";

    var _fnAddDelimitedElements = function ($element, isFilteredOnly) {
        var _delimitedSelector = "[" + DATA_ATTRIBUTE_RENDER + "*='|']";
        var $list = null;

        if (isFilteredOnly) {
            $list = $element;
        }
        else {

            $list = $element.find(_delimitedSelector);

            if ($element.is(_delimitedSelector)) {
                $list.add($element);
            }
        }

        $list = $list.filter(function () {
            var $this = $(this);
            var _found = false;
            var _arr = util_forceString($this.attr(DATA_ATTRIBUTE_RENDER)).split("|");

            for (var i = 0; i < _arr.length; i++) {
                if (_arr[i] == controlValue) {
                    _found = true;
                    break;
                }
            }

            return _found;
        });

        _ret = _ret.add($list);
    };

    if (util_isNullOrUndefined(filterList)) {
        if (isApplyExtRender) {
            _selector += ", [" + DATA_ATTRIBUTE_RENDER_EXT + "=" + util_forceString(controlValue) + "]";
        }

        _ret = $(context).find(_selector).not("[" + DATA_ATTRIBUTE_RENDER_OVERRIDE + "=true]");

        _fnAddDelimitedElements($(context));
    }
    else {
        _ret = $(filterList).filter(_selector);
        _fnAddDelimitedElements($(filterList), true);
    }

    return _ret;
}

function renderer_uniqueID() {
    var _id = util_forceInt(RENDERER_UNIQUE_ID, 1);

    RENDERER_UNIQUE_ID = _id + 1;

    return "renderer_ctl_" + _id;
}

function renderer_event_callback_page_load() {

    //data admin list callbacks
    var _list = renderer_getFilteredList($mobileUtil.ActivePage(), "data_admin_list");

    //filter for only admin list elements that require binding on page load
    _list = _list.not("[" + DATA_ATTRIBUTE_SUPPRESS_LOAD_BIND + "='" + enCETriState.Yes + "']");

    $.each(_list, function (index) {
        renderer_event_data_admin_list_bind(this);
    });
}

function renderer_event_file_upload_ready(refID) {
    var _element = $mobileUtil.GetElementsByAttribute("data-attr-file-upload-ref-id", refID);

    if (!_element.is(":visible")) {
        _element.fadeIn();
    }
}

function renderer_event_file_upload_success(options) {
    options = util_extend({
        "ElementRefID": null, "UploadFileName": null, "OriginalFileName": null, "PreviewFileURL": null, "PreviousUploadFileName": null, "MD5": null,
        "IsDisableDataOptions": false
    }, options);

    var _refID = options["ElementRefID"];
    var _uploadedFileName = options["UploadFileName"];
    var _originalFileName = options["OriginalFileName"];
    
    var _element = $mobileUtil.GetElementsByAttribute("data-attr-file-upload-ref-id", _refID);

    if (_element.length == 1) {
        _element.attr(CONTROL_FILE_UPLOAD_UPLOADED_FILE_NAME, _uploadedFileName);
        _element.attr(CONTROL_FILE_UPLOAD_UPLOADED_ORIGINAL_FILE_NAME, _originalFileName);

        var _fnSuccessCallback = null;

        _fnSuccessCallback = _element.attr(CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK); //deprecated

        //retrieve from DOM data
        if (!_fnSuccessCallback) {
            _fnSuccessCallback = _element.data(CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK);
        }

        //configure the external toggle and text input, if applicable
        if (util_forceBool(options["HasExternalFile"], false)) {
            _element.trigger("events.fileUpload_setExternalFile", { "HasExternalFile": true, "URL": options["URL"] });
        }
        else {
            _element.trigger("events.fileUpload_setExternalFile", { "HasExternalFile": false });
        }

        if (util_isFunction(_fnSuccessCallback)) {
            _fnSuccessCallback = eval(_fnSuccessCallback);
            _fnSuccessCallback({ "UploadRefID": _refID, "Element": _element, "UploadFileName": _uploadedFileName, "OriginalFileName": _originalFileName,
                "PreviewFileURL": options["PreviewFileURL"], "PreviousUploadFileName": options["PreviousUploadFileName"],
                "MD5": options["MD5"],
                "IsDisableDataOptions": options["IsDisableDataOptions"],
                "HasExternalFile": options["HasExternalFile"],
                "URL": options["URL"]
            });
        }
    }
}

function renderer_event_file_upload_error(refID, errMessage, options) {
    if (util_isDefined("global_renderer_file_upload_error")) {
        global_renderer_file_upload_error(refID, errMessage, options);
    }
}

function renderer_event_file_upload_cleanup_temp_file(ctx) {
    var _arr = [];
    var _list = $(ctx).find("[" + util_renderAttribute("file_upload") + "]");

    $.each(_list, function (indx) {
        var _lastUploadedFileName = util_forceString($(this).attr(CONTROL_FILE_UPLOAD_UPLOADED_FILE_NAME));

        if (_lastUploadedFileName != "") {
            _arr.push(_lastUploadedFileName);
        }
    });

    //remove the last uploaded file name and set flag on all file upload renderer controls that the remove event has been processed
    _list.removeAttr(CONTROL_FILE_UPLOAD_UPLOADED_FILE_NAME);
    _list.removeAttr(CONTROL_FILE_UPLOAD_UPLOADED_ORIGINAL_FILE_NAME);

    if (_arr.length > 0) {
        GlobalService.UserTempFileUploadCleanup(_arr);
    }
}

function renderer_event_data_admin_list_bind(element, isSourceElement) {
    var _id = "";
    
    isSourceElement = util_forceBool(isSourceElement);

    if (!isSourceElement) {
        _id = $(element).find("[data-attr-data-template=setting] [data-attr-data-template-id]").attr("data-attr-data-template-id");
    }
    else {
        _id = $(element).attr("id");
    }
    
    if (util_forceString(_id) != "") {
        var $parent = $(element).closest("[" + util_renderAttribute("data_admin_list") + "]");

        var _isPersist = (util_forceInt($parent.attr("data-is-persist-delegate"), enCETriState.None) == enCETriState.Yes);

        MODULE_MANAGER.DelegateSettings.ExecEvent(enCDelegateType.Repeater, "renderer_event_data_admin_list_bind_" + _id, null, _isPersist);
    }
}

function renderer_event_data_admin_list_repeater_bind(elementID, callback) {
    var _element = $mobileUtil.GetElementByID(elementID);

    var _repeater = $mobileUtil.GetElementsByAttribute("data-attr-data-template-id", elementID);
    var _config = { NumHeaders: 0, AllowDelete: true, DeleteHeaderIndex: 0 };

    var TEMPLATE_ITEM = "";
    var TEMPLATE_RENDER_TOKENS = [];

    //configuration
    var _repeaterConfig = _repeater.find("[data-attr-repeater-ext=config]");

    _config.NumHeaders = _repeater.find("[data-cattr-type=header]").children().length;
    _config.AllowDelete = util_forceBool(_repeaterConfig.attr("allow-delete"), _config.AllowDelete);
    _config.DeleteHeaderIndex = util_forceInt(_repeaterConfig.attr("delete-header-index"), _config.DeleteHeaderIndex);

    var _fnSetting = _repeater.find("[data-attr-repeater-ext=fn]");

    var _fnGetFieldCellOption = null;
    var _fnField = null;
    var _fnGetData = null;
    var _fnDeleteItems = null;
    var _fnDeleteConfirmMsg = null;
    var _fnBindComplete = null;
    var _fnContentRowAttr = null;
    var _fnContentRowCssClass = null;

    if (util_forceInt(_fnSetting.attr("data-attr-is-element-data-functions"), enCETriState.None) == enCETriState.Yes) {
        var $parent = _repeater.closest("[" + util_renderAttribute("data_admin_list") + "]");

        var _optFunctions = $parent.data("RepeaterFunctions");

        _optFunctions = util_extend({
            "Field": null, "FieldCellOption": null, "GetData": null, "DeleteItems": null, "DeleteConfirmMessage": null, "BindComplete": null, "ContentRowAttribute": null,
            "ContentRowCssClass": null
        }, _optFunctions);

        _fnField = _optFunctions.Field;
        _fnGetFieldCellOption = _optFunctions.FieldCellOption;
        _fnGetData = _optFunctions.GetData;
        _fnDeleteItems = _optFunctions.DeleteItems;
        _fnDeleteConfirmMsg = _optFunctions.DeleteConfirmMessage;
        _fnBindComplete = _optFunctions.BindComplete;
        _fnContentRowAttr = _optFunctions.ContentRowAttribute;
        _fnContentRowCssClass = _optFunctions.ContentRowCssClass;
    }
    else {

        //deprecated (use DOM configuration based above instead)
        _fnGetFieldCellOption = eval(_fnSetting.attr("data-attr-field-cell-option-fn"));
        _fnField = eval(_fnSetting.attr("data-attr-field-fn"));
        _fnGetData = eval(_fnSetting.attr("data-attr-data-fn"));
        _fnDeleteItems = eval(_fnSetting.attr("data-attr-delete-fn"));
        _fnDeleteConfirmMsg = eval(_fnSetting.attr("data-attr-delete-confirm-msg-fn"));
        _fnBindComplete = eval(_fnSetting.attr("data-attr-fn-bind-complete"));
        _fnContentRowAttr = eval(_fnSetting.attr("data-attr-fn-content-row-attributes"));
        _fnContentRowCssClass = eval(_fnSetting.attr("data-attr-fn-content-row-css-class"));
    }

    var _hasFnFieldCellOption = util_isFunction(_fnGetFieldCellOption);

    //construct the template row item
    TEMPLATE_ITEM += "<tr %%CONTENT_ROW_EXT_ATTRIBUTES%% class='%ROW_CSS%'>";

    for (var i = 0; i < _config.NumHeaders; i++) {
        var _tokenCellAttribute = "%%TEMPLATE_CELL_ATTRIBUTE_" + i + "%%";
        var _tokenCellContent = "%%TEMPLATE_CELL_CONTENT_" + i + "%%";
        var _isDeleteCell = (_config.AllowDelete && _config.DeleteHeaderIndex == i);
        var _cellAttr = "";

        if (_hasFnFieldCellOption) {
            var _cellOptions = { "Container": _element, "Index": i, "CssClass": "", "ForceHorizontalAlign": false, "NumHeaders": _config.NumHeaders };

            _cellOptions = _fnGetFieldCellOption(_cellOptions);

            if (!util_isNullOrUndefined(_cellOptions)) {

                if (util_forceBool(_cellOptions["ForceHorizontalAlign"], false)) {
                    var _cellCssClass = util_forceString(_cellOptions["CssClass"]);

                    _cellCssClass = "TableCellCenter" + (_cellCssClass != "" ? " " : "") + _cellCssClass;

                    _cellOptions["CssClass"] = _cellCssClass;
                }

                if (util_forceString(_cellOptions["CssClass"]) != "") {
                    _cellAttr += util_htmlAttribute("class", _cellOptions["CssClass"]) + " ";
                }                
            }
        }

        TEMPLATE_ITEM += "<td " + _cellAttr + _tokenCellAttribute + ">" +
                             (_isDeleteCell ? "%%TEMPLATE_CONTENT_DELETE%%" : "") +
                             _tokenCellContent +
                             "</td>";

        TEMPLATE_RENDER_TOKENS.push(_tokenCellAttribute);
        TEMPLATE_RENDER_TOKENS.push(_tokenCellContent);
    }

    TEMPLATE_ITEM += "</tr>";

    //construct the tokens
    var _tokens = _repeater.find("[data-attr-repeater-ext=tokens]").children();

    if (_config.AllowDelete) {
        TEMPLATE_RENDER_TOKENS.push("%%TEMPLATE_CONTENT_DELETE%%");
        TEMPLATE_RENDER_TOKENS.push("%%TEMPLATE_DELETE_ITEM_VALUE%%");
    }

    $.each(_tokens, function (tIndex) {
        TEMPLATE_RENDER_TOKENS.push($(this).text());
    });

    var _data = [];

    var _repeaterSortSetting = ctl_repeater_getSortSetting(_element);

    var _fnBind = function () {
        var _fnGetField = function (tokenKey, item, vwOpts) {
            var _ret = "";

            switch (tokenKey) {
                case "%%TEMPLATE_CONTENT_DELETE%%":
                    _ret = "<label>" + "<input type=\"checkbox\" data-mini=\"true\" data-attr-cb-group=\"DeleteCheckboxItem_" + elementID + "\" " +
                               "value=\"%%TEMPLATE_DELETE_ITEM_VALUE%%\" />&nbsp;" + "</label>";
                    break;

                default:
                    if (_fnField) {
                        _ret = _fnField(tokenKey, item, vwOpts);
                    }
                    break;
            }

            return util_forceString(_ret);
        };

        var _repeaterSettings = ctl_repeater_getSetting(_element, TEMPLATE_ITEM, TEMPLATE_RENDER_TOKENS, _fnGetField,
                                                                               function () {
                                                                                   renderer_event_data_admin_list_bind(_element, true);
                                                                               }, null, null, null, _element.attr(CONTROL_ATTR_REPEATER_PAGING_PAGE_SIZE), _fnContentRowAttr,
                                                                               _fnContentRowCssClass);


        ctl_repeater_bind(_element, _data, _repeaterSettings);

        if (_fnBindComplete) {
            _fnBindComplete({ "Data": _data, "Element": _element });
        }

        js_bindClick(_element.find("#clDelete_" + elementID), function () {

            if (_fnDeleteItems) {

                var _container = $mobileUtil.GetElementByID(elementID);
                var _cbList = _container.find("[data-attr-cb-group=DeleteCheckboxItem_" + elementID + "]:checked");

                var _onListDeleteRefresh = function () {

                    _fnDeleteItems(_cbList, function () {
                        renderer_event_data_admin_list_bind(_container, true);  //must rebind the repeater after being deleted
                    });
                };

                if (_cbList.length == 0) {
                    return;
                }

                if (util_isNullOrUndefined(_fnDeleteConfirmMsg)) {

                    util_confirm(MSG_CONFIG.ListDeleteConfirmMsg, MSG_CONFIG.ListDeleteTitle, false, null, function (btnID) {
                        if (btnID == NOTIFICATION_BUTTON_CONFIG.OK.ID) {
                            _onListDeleteRefresh();
                        }
                    });
                }
                else {
                    _fnDeleteConfirmMsg(function () {
                        _onListDeleteRefresh();
                    }, { "Selections": _cbList, "Container": _container });
                }
            }

            return false;
        });

        if (callback) {
            callback();
        }
    };

    if (_fnGetData) {
        _fnGetData(_element, _repeaterSortSetting, function (retData) {
            var _handled = false;

            _data = retData;

            if (_data == null || _data == undefined) {
                _data = [];
            }

            if (!$.isArray(_data) && util_forceInt(_repeaterSortSetting["PageNo"], 0) > 1 &&
                !util_isNullOrUndefined(_data["NumItems"]) && util_forceInt(_data["NumItems"], 0) > 0) {
                var _arr = _data["List"];

                if (!util_isNullOrUndefined(_arr) && _arr.length == 0) {
                    _repeaterSortSetting["PageNo"] = 1;

                    ctl_repeater_setSortSetting(_element, _repeaterSortSetting["EnumSortType"], _repeaterSortSetting["SortColumn"],
                                                _repeaterSortSetting["SortASC"], _repeaterSortSetting["PageNo"], _repeaterSortSetting["PageSize"]);

                    _handled = true;
                }
            }

            if (!_handled) {
                _fnBind();
            }
            else {
                _fnGetData(_element, _repeaterSortSetting, function (retDataRecur) {
                    _data = retDataRecur;

                    if (_data == null || _data == undefined) {
                        _data = [];
                    }

                    _fnBind();
                });
            }
        });
    }
    else {
        _fnBind();
    }

    return false;
}

//event called when a CKEditor instance is ready and configured
function renderer_event_editor_ready(editor) {
    var _element = $(editor.element);

    var _fnInstanceReady = _element.attr(CONTROL_EDITOR_EVENT_CALLBACK_INSTANCE_READY);

    if (util_isFunction(_fnInstanceReady)) {
        _fnInstanceReady = eval(_fnInstanceReady);

        _fnInstanceReady(_element, editor);
    }
}

function renderer_forceOptions(options, defaultValue) {
    if (defaultValue == null || defaultValue == undefined) {
        defaultValue = {};
    }

    if (options == null || undefined) {
        options = defaultValue;
    }

    return options;
}

function renderer_isRefresh(obj, removeAttr) {
    var _ret = false;
    var _element = $(obj);

    removeAttr = util_forceBool(removeAttr, true);

    _ret = (util_forceInt(_element.attr(DATA_ATTRIBUTE_RENDER_REFRESH), enCETriState.None) == enCETriState.Yes);

    if (removeAttr) {
        _element.removeAttr(DATA_ATTRIBUTE_RENDER_REFRESH);
    }

    return _ret;
}

function renderer_setOverride(ctx, enabled) {
    var _ctx = $(ctx);

    enabled = util_forceBool(enabled, true);

    _ctx.find("[" + DATA_ATTRIBUTE_RENDER + "]").attr(DATA_ATTRIBUTE_RENDER_OVERRIDE, enabled ? "true" : "false");
}

function renderer_onApplyComplete(ctx) {
    var _context = $(ctx);

    var _list = null;

    //restore the list view filter search text for the list selection control
    _list = renderer_getFilteredList(_context, "selection_list").find("[data-cattr-list-selection-restore]");

    $.each(_list, function (indx) {
        var _element = $(this);
        var _container = _element.parent();
        var _searchText = util_forceString(_element.attr("data-cattr-list-selection-restore"));

        if (_searchText != "") {
            var _tbSearch = _container.find("form[role=search]").find("input[data-type=search]");
            _tbSearch.val(_searchText).trigger("change");
        }
    });

    var _filterTextList = renderer_getFilteredList(_context, "filter_text");

    js_bindClick(_filterTextList.find(".FilterTextSearchContainer .ui-input-search a"), function () {
        var _parent = $mobileUtil.FindAncestor(this, ".FilterTextSearchContainer");
        var _tb = _parent.find(".TextInputFilterableCriteria");

        _tb.val("");
        _tb.trigger("keyup");
        _tb.focus();
    });

    _list = _filterTextList.find(".TextInputFilterableCriteria");

    var _fnFilterTextChange = function () {
        var _tb = $(this);
        var _isBusy = util_forceValidEnum(_tb.attr("data-attr-is-active"), enCETriState, enCETriState.No);
        var _isForceRefresh = util_forceValidEnum(_tb.attr("data-attr-is-force-refresh"), enCETriState, enCETriState.No);

        var _prevSearch = util_forceString(_tb.attr("data-attr-filter-text-prev-search")).toLowerCase();

        if (_isBusy != enCETriState.Yes &&
            ((util_forceString(_tb.val()).toLowerCase() != _prevSearch) || (_isForceRefresh == enCETriState.Yes))
           ) {
            _tb.attr("data-attr-is-active", enCETriState.Yes);  //flag the filter text is active

            //timestamp the element
            var _time = (new Date()).getTime();

            _tb.attr("data-attr-filter-text-timestamp", _time);

            var _fn = function (expTime) {
                var _container = $(_tb.parentsUntil("[" + DATA_ATTRIBUTE_RENDER + "=filter_text]").last().parent());
                var _searchText = util_forceString(_tb.val()).toLowerCase();
                var _timeAttr = util_forceInt(_tb.attr("data-attr-filter-text-timestamp"));
                var _isActive = util_forceValidEnum(_tb.attr("data-attr-is-active"), enCETriState, enCETriState.No);

                if (_isActive != enCETriState.Yes) {
                    return;
                }
                else if (expTime == _timeAttr) {
                    var _searchDisplayAll = util_forceValidEnum(_tb.attr("data-attr-is-toggle-display-all"), enCETriState, enCETriState.None);

                    var _config = _container.children("[" + DATA_ATTR_TEMPLATE + "=config]").first();

                    var _fnSearchRefresh = null;
                    var _hasPaging = false;

                    if (_config.length == 0) {
                        _fnSearchRefresh = _container.data(CONTROL_FILTER_TEXT_CONFIG_EVENT_SEARCH_REFRESH);

                        _hasPaging = (util_forceInt(_container.data("PageSize"), 0) > 0);
                    }
                    else {

                        //deprecated
                        _config.attr(CONTROL_FILTER_TEXT_CONFIG_EVENT_SEARCH_REFRESH);
                    }

                    _tb.attr("data-attr-is-active", enCETriState.No);   //flag the filter text is no longer active

                    _tb.attr("data-attr-filter-text-prev-search", _searchText); //set the most recent search text

                    if (!_hasPaging) {
                        var _defaultValidNoSearch = (_searchDisplayAll == enCETriState.Yes);

                        var _listElements = _container.find("[data-attr-filter-text-value]");
                        var _fn = function () {
                            if (_searchText == "") {
                                return _defaultValidNoSearch;
                            }
                            else {
                                var _text = util_forceString($(this).attr("data-attr-filter-text-value")).toLowerCase();

                                return (_text.indexOf(_searchText) >= 0);
                            }
                        };

                        _listElements.filter(":visible").not(_fn).hide();

                        _listElements.filter(_fn).fadeIn(500, function () {

                            if (util_isFunction(_fnSearchRefresh)) {
                                _fnSearchRefresh = eval(_fnSearchRefresh);
                                _fnSearchRefresh(_container);
                            }
                        });
                    }
                    else {

                        //default to the first page for the search

                        _container.data("PageNum", 1);

                        _container.trigger("events.filter_text_refresh", {
                            "IsForceRefresh": true, "From": "search", "Callback": function () {
                                if (util_isFunction(_fnSearchRefresh)) {
                                    _fnSearchRefresh = eval(_fnSearchRefresh);
                                    _fnSearchRefresh(_container, { "Search": _searchText });
                                }
                            }
                        });                        
                    }

                }
                else {
                    setTimeout(function () {
                        _fn(_timeAttr);
                    }, 250);
                }
            };

            setTimeout(function () {
                _fn(_time);
            }, 750);
        }
    };

    _list.unbind("keyup");
    _list.keyup(_fnFilterTextChange);

    js_bindChange(_list, _fnFilterTextChange);

    //tab strip init
    _list = renderer_getFilteredList(_context, "tab_strip").filter("[data-attr-tab-strip-init=" + enCETriState.No + "]");

    $.each(_list, function (indx) {
        var _element = $(this);

        var _current = _element.find(".CTabStripHeaderItemActive");

        if (_current.length == 1) {
            _current.trigger("click");
        }

        _element.attr("data-attr-tab-strip-init", enCETriState.Yes);    //set flag the tab strip has been initialized
    });
}

function renderer_attr_imgLink(imgURL, width, height, isPopupLink, disableSkinImgPath) {
    var _ret = "";

    isPopupLink = util_forceBool(isPopupLink, false);
    disableSkinImgPath = util_forceBool(disableSkinImgPath, false);

    if (!isPopupLink) {
        _ret += util_renderAttribute("img_link") + " ";
    }

    imgURL = (disableSkinImgPath ? imgURL : "../<IMAGE_SKIN_PATH>" + imgURL);

    _ret += util_htmlAttribute(CONTROL_IMAGE_LINK_URL, imgURL) + " " +
            util_htmlAttribute(CONTROL_IMAGE_LINK_WIDTH, width) + " " +
            util_htmlAttribute(CONTROL_IMAGE_LINK_HEIGHT, height);

    return _ret;
}

function renderer_attr_video(width, height, videoSrcMP4, videoSrcWEBM, videoSrcOGG, toggleControls, isAutoPlay, isPreLoad, isLoop, posterURL) {
    var _ret = "";

    toggleControls = util_forceValidEnum(toggleControls, enCETriState, enCETriState.None);
    isAutoPlay = util_forceValidEnum(isAutoPlay, enCETriState, enCETriState.None);
    isPreLoad = util_forceValidEnum(isPreLoad, enCETriState, enCETriState.None);
    isLoop = util_forceValidEnum(isLoop, enCETriState, enCETriState.None);
    posterURL = util_forceString(posterURL, "");

    _ret += util_htmlAttribute(CONTROL_VIDEO_WIDTH, util_forceInt(width, 0)) + " " +
            util_htmlAttribute(CONTROL_VIDEO_HEIGHT, util_forceInt(height, 0)) + " " +
            util_htmlAttribute(CONTROL_VIDEO_SOURCE_MP4, util_forceString(videoSrcMP4)) + " " +
            util_htmlAttribute(CONTROL_VIDEO_SOURCE_WEBM, util_forceString(videoSrcWEBM)) + " " +
            util_htmlAttribute(CONTROL_VIDEO_SOURCE_OGG, util_forceString(videoSrcOGG)) + " " +
            util_htmlAttribute(CONTROL_VIDEO_IS_TOGGLE_CONTROLS, toggleControls) + " " +
            util_htmlAttribute(CONTROL_VIDEO_IS_AUTO_PLAY, isAutoPlay) + " " +
            util_htmlAttribute(CONTROL_VIDEO_IS_PRE_LOAD, isPreLoad) + " " +
            util_htmlAttribute(CONTROL_VIDEO_IS_LOOP, isLoop) + " " +
            util_htmlAttribute(CONTROL_VIDEO_POSTER_URL, posterURL);

    return _ret;
}

function renderer_tabStrip_getItem(id, headerContent, isHTML, cssClass) {
    var _ret = { "ID": util_forceString(id),
        "Content": util_forceString(headerContent),
        "IsHTML": util_forceBool(isHTML, false),
        "CssClass": util_forceString(cssClass)
    };

    return _ret;
}

function renderer_drag_drop_column_getGroupState(container, options) {
    var _ret = [];
    var _element = $(container);

    options = util_extend({ "DelimitedGroupID": "" }, options);

    var _arrGroupIDs = util_forceString(options["DelimitedGroupID"]).split("|");

    if (_element.is("[" + util_renderAttribute("drag_drop_column") + "]")) {

        var _listGroupContainers = _element.find("[" + DATA_ATTR_DRAG_DROP_COLUMN_GROUP_CONTAINER_ID + "]");

        for (var i = 0; i < _arrGroupIDs.length; i++) {
            var _groupID = _arrGroupIDs[i];
            var _groupContainer = _listGroupContainers.filter("[" + util_htmlAttribute(DATA_ATTR_DRAG_DROP_COLUMN_GROUP_CONTAINER_ID, _groupID) + "]");

            if (_groupContainer.length == 1) {
                var _groupItem = { "ID": _groupID, "Items": [] };

                $.each(_groupContainer.find("[" + DATA_ATTR_DRAG_DROP_COLUMN_GROUP_ITEM_ID + "]"), function (indx) {
                    var _groupItemElement = $(this);

                    var _groupItemID = _groupItemElement.attr(DATA_ATTR_DRAG_DROP_COLUMN_GROUP_ITEM_ID);

                    _groupItem.Items.push({ "ID": _groupItemID, "Element": _groupItemElement });
                });

                _ret.push(_groupItem);
            }
        }
    }

    return _ret;
}

function renderer_module_navigation(context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "module_navigation");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.data("is-init")) {
            $element.attr({ "data-rel": "dialog", "href": "#mnav" });
            $element.data("is-init", true);
        }
    });
}

function renderer_viewIndicator(context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "view_indicator");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.data("is-init-view-indicator")) {
            $element.data("is-init-view-indicator", true);

            $element.addClass("ViewIndicator");

            $element.off("events.viewIndicator_toggle");
            $element.on("events.viewIndicator_toggle", function (e, args) {

                e.stopPropagation();    //must prevent any parent event handlers of this namespace from executing

                args = util_extend({ "IsEnabled": false }, args);

                $element.toggleClass("Transparent", util_forceInt($element.attr("data-attr-view-indicator-is-transparent"), enCETriState.None) == enCETriState.Yes)
                        .toggleClass("FixedPosition", util_forceInt($element.attr("data-attr-view-indicator-is-fixed-position"), enCETriState.None) == enCETriState.Yes);

                $element.toggleClass("StateOn", args.IsEnabled);

                var _supportedCssClass = "IndicatorAnchorBottom";
                var _indicatorCssClass = null;

                switch ($element.attr("data-attr-view-indicator-position")) {

                    case "bottom":
                        _indicatorCssClass = "IndicatorAnchorBottom";
                        break;
                }

                if (args.IsEnabled) {

                    $element.removeClass(_supportedCssClass);

                    if (_indicatorCssClass != null) {
                        $element.addClass(_indicatorCssClass);
                    }

                    var $search = $element.children(".ProgressBar, .Overlay");

                    if ($search.filter(".Overlay").length == 0) {
                        $element.append("<div class='Overlay' />");
                    }

                    if ($search.filter(".ProgressBar").length == 0) {

                        $element.append("<div class='ProgressBar'>" +
                                        "  <div class='ModeIndeterminate' />" +
                                        "</div>");
                    }
                }

                return true;

            });

            if (util_forceInt($element.attr("data-attr-view-indicator-is-default-on"), enCETriState.None) == enCETriState.Yes) {
                $element.removeAttr("data-attr-view-indicator-is-default-on");

                $element.trigger("events.viewIndicator_toggle", { "IsEnabled": true });
            }
        }
    });
}

function renderer_callout(context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "callout");
    var _isTouchSupported = $browserUtil.IsTouchSupported();

    $.each($list, function () {
        var $element = $(this);

        if (!$element.data("is-init-callout")) {
            $element.data("is-init-callout", true);

            var _isDisableTouchDevice = (util_forceInt($element.attr("data-callout-disable-is-touch"), enCETriState.None) == enCETriState.Yes);

            //check if the callout should validate against touch device and disable if touch is enabled (in case it has extended events for click)
            _isDisableTouchDevice = (_isDisableTouchDevice && _isTouchSupported);

            if (!_isDisableTouchDevice) {

                var _tooltipOptions = null;

                if (_isTouchSupported) {
                    _tooltipOptions = {
                        trigger: "custom",
                        triggerOpen: {
                            "mouseenter": true,
                            "touchstart": true
                        },
                        triggerClose: {
                            "click": true,
                            "scroll": true,
                            "tap": true
                        }
                    };
                }
                else {
                    _tooltipOptions = {};
                }

                var _side = util_forceString($element.attr("data-callout-options-side"));

                if (_side != "") {
                    _tooltipOptions["side"] = _side;
                }

                _tooltipOptions["interactive"] = true;
                _tooltipOptions["updateAnimation"] = "fade";
                _tooltipOptions["theme"] = ["tooltipster-light", "tooltipster-repeater"];

                _tooltipOptions["maxWidth"] = $(window).width() * 0.90;

                _tooltipOptions["functionPosition"] = function (instance, helper, position) {

                    var _origin = helper.geo.origin;
                    var _window = helper.geo.window;
                    var _maxHeight = _window.size.height;
                    var _coordinates = position.coord;
                    var _size = position.size;

                    if (_coordinates.top < 0) {
                        if (_size.height > _origin.windowOffset.top) {
                            _coordinates.top = 0;
                        }
                        else {
                            _coordinates.top = _origin.windowOffset.top;
                        }
                    }

                    _size.height = Math.min(_size.height, _maxHeight - _coordinates.top);

                    if (_coordinates.top == 0 || _size.height == (_maxHeight - _coordinates.top)) {

                        var _height = _size.height;
                        var _factor = ((_size.height == (_maxHeight - _coordinates.top)) ? 0.98 : 0.94);

                        _size.height = Math.floor(_height * _factor);

                        if (_coordinates.top == 0) {
                            _coordinates.top = (Math.floor(_height * (1 - _factor)) / 2.0);
                        }

                        //check if there is additional space for the tooltip to be rendered
                        if (_coordinates.top + _height < _maxHeight) {
                            _size.height = _height;
                        }

                        //if the position is requested to be below the target, check if there is more space that is available on top
                        if (position["side"] == "bottom") {

                            var _originTop = _origin.windowOffset.top;
                            var _availableSpaceAbove = _originTop * 0.90;
                            var _availableSpaceBelow = _maxHeight - _originTop;

                            if (_availableSpaceAbove > _availableSpaceBelow) {

                                //reposition to display above it and set its revised top coordinate and height value
                                position["side"] = "top";
                                _size.height = _originTop * 0.90;
                                _coordinates.top = Math.max(0, _originTop - _size.height);
                            }
                        }
                    }

                    $(helper.tooltip).find(".tooltipster-content:first").addClass("ScrollbarPrimary");

                    return position;

                };  //end: functionPosition

                _tooltipOptions["functionBefore"] = function (instance, helper) {
                    var $source = $(helper.origin);
                    var _detail = { "Content": "", "IsHTML": false };

                    $source.trigger("callout_tooltip.getContent", {
                        "SetCalloutContent": function (content) {
                            instance.content(content);
                        },
                        "Trigger": $source, "Instance": instance, "Callback": function (result) {

                            result = util_extend({ "Content": "", "IsHTML": false, "CanCache": false }, result);

                            //TODO cache
                            result.Content = util_forceString(result.Content);

                            if (!result.IsHTML) {
                                result.Content = util_htmlEncode(result.Content);
                            }

                            instance.content($("<div>" + result.Content + "</div>"));
                        }
                    });
                };

                //backward compatible
                if (!$element["tooltipster"]) {
                    util_logError("Required resource type not included :: " + enCResourceIncludeType.Tooltipster +
                                  " [" + util_enumNameLookup(enCResourceIncludeType.Tooltipster, enCResourceIncludeType, "") + "]");
                }
                else {
                    $element.tooltipster(_tooltipOptions);
                }
            }
        }

    });
}

function renderer_searchableField(context, options) {
    context = global_forceContext(context);

    var $list = renderer_getFilteredList(context, "searchable_field");

    $.each($list, function () {
        var $element = $(this);

        if (!$element.data("is-init-searchable") || util_forceInt($element.attr("is-force-init"), enCETriState.None) == enCETriState.Yes) {

            $element.removeAttr("is-force-init")
                    .data("is-init-searchable", true);

            var _temp = $element.data("SearchConfiguration");

            if (!_temp && util_forceInt($element.attr("data-attr-searchable-is-trigger-options"), enCETriState.No) == enCETriState.Yes) {

                _temp = {
                    "Result": {}
                };

                $element.trigger("events.searchable_getSearchConfiguration", _temp);

                _temp = _temp.Result;
            }

            var _options = util_extend({
                "SearchableParent": null,
                "RenderMode": null,
                "Delay": 500,
                "IsFocusSearchOnClear": false,
                "OnRenderResult": function (result, opts) { },
                "OnSearch": function (opts, callback) {
                    callback();
                },
                "OnAbort": function (opts) { }
            }, _temp);

            var _fnID = function () {
                return (new Date()).getTime();
            };

            if (!_options.SearchableParent) {

                //attempt to match closest parent for searchable container
                var $search = $element.closest(".SearchableView, :not(.ui-input-text)");

                if ($search.is(".SearchableView")) {
                    _options.SearchableParent = $search;
                }
            }

            var _delay = util_forceInt(_options.Delay, 0);

            _delay = Math.max(_delay, 100);

            var $parent = $(_options.SearchableParent);

            if ($parent.length == 1 && $parent.hasClass("SearchableView")) {

                $parent.off("click.searchable_clear");
                $parent.on("click.searchable_clear", ".SearchClearButton", function () {

                    $element.val("");
                    $element.trigger("events.toggleSearchModeState");
                    $element.trigger("events.searchable_submit");

                    if (_options.IsFocusSearchOnClear) {
                        $element.trigger("focus");
                    }
                });
            }
            else {
                $parent = null;
            }

            if (_options.RenderMode == "selectable") {

                var _searchableSelectOpts = util_extend({
                    "PropertyText": null, "PropertyID": null,
                    "OnItemAttributes": function (opts) {
                    },
                    "NoRecordsMessage": "No results were found matching your search. Please try again.",
                    "IsNoRecordsMessageHTML": false,
                    "OnInitPopupSearch": null,  //format: function(opts){ ... } where opts: { "Container" } and "this" is the popup search element
                    "OnRenderLabel": null,  //format: function(opts){ ... } where opts: { "Item", "ItemID", "Label", "HighlightEncoder" }
                    "CssClass": null,
                    "IsModeSingle": false,
                    "CanClearSelection": true,
                    "OnItemClick": function (opts) {
                        if (opts.Callback) {
                            opts.Callback();
                        }
                    },
                    "PositionOffsetX": 0,
                    "PositionOffsetY": 0,
                    "ContentHeaderHTML": ""
                }, _options["RenderOptionSelectable"]);

                _options.IsFocusSearchOnClear = true;

                var _fnRenderLabel = _searchableSelectOpts.OnRenderLabel;
                var _isModeSingle = util_forceBool(_searchableSelectOpts.IsModeSingle, false);
                var _canClearSelection = util_forceBool(_searchableSelectOpts.CanClearSelection, true);

                if (!_fnRenderLabel) {
                    _fnRenderLabel = function (opts) {
                        return opts.HighlightEncoder(opts.Label);
                    };
                }

                _options.OnRenderResult = function (result, opts) {
                    var $vw = $element.data("ElementPopup");

                    if (!$vw || $vw.length == 0) {
                        var _popupCssClass = util_forceString(_searchableSelectOpts["CssClass"]);
                        var _offsetX = util_forceFloat(_searchableSelectOpts["PositionOffsetX"], 0);
                        var _offsetY = util_forceFloat(_searchableSelectOpts["PositionOffsetY"], 0);

                        $vw = $("<div class='ApplicationFont DisableUserSelectable SearchableViewPopup" + (_popupCssClass != "" ? " " + _popupCssClass : "") + "' " +
                                util_renderAttribute("view_indicator") + " " +
                                util_htmlAttribute("data-attr-view-indicator-is-transparent", enCETriState.Yes) + " " +
                                util_htmlAttribute("data-attr-view-indicator-is-fixed-position", enCETriState.Yes) + ">" +
                                "   <a data-role='button' class='ButtonDismiss LinkClickable ButtonTheme' data-icon='arrow-l' data-iconpos='notext' data-inline='true' " +
                                "data-theme='transparent' title='Close' />" +
                                "   <div class='Header'>" +
                                "       <div class='Label'>" +
                                "           <div>" +
                                util_htmlEncode("Results: ") + "<span class='LabelResultCount'>" + util_htmlEncode("0") + "</span>" +
                                "           </div>" +
                                "       </div>" +
                                "   </div>" +
                                util_forceString(_searchableSelectOpts["ContentHeaderHTML"]) +
                                "   <div class='ScrollbarPrimary Content'><i class='SearchableViewLoadingIcon material-icons'>hourglass_empty</i></div>" +
                                "</div>");

                        $vw.toggleClass("StateSearchableViewClearSelectionOff", !_canClearSelection);

                        $("body").append($vw);

                        $vw.trigger("create");
                        $mobileUtil.RenderRefresh($vw, true);

                        if (_searchableSelectOpts.OnInitPopupSearch) {
                            _searchableSelectOpts.OnInitPopupSearch.call($vw, { "Container": $element });
                        }

                        var $vwContent = $vw.children(".Content:first");
                        var $parent = $element;

                        if ($parent.parent().hasClass("ui-input-text")) {
                            $parent = $parent.parent();
                        }

                        $vw.data("LabelResultCount", $vw.find(".Header .LabelResultCount"));

                        $vw.off("events.searchableField_popupOnToggleIndicator");
                        $vw.on("events.searchableField_popupOnToggleIndicator", function (e, args) {

                            args = util_extend({ "IsEnabled": false }, args);

                            $vw.trigger("events.viewIndicator_toggle", { "IsEnabled": args.IsEnabled });
                        });

                        $vw.off("events.searchableField_popupOnPosition");
                        $vw.on("events.searchableField_popupOnPosition", function () {

                            var _position = $parent.offset();

                            _position.left += _offsetX;
                            _position.top += $parent.outerHeight();

                            //check if the height of the popup exceeds the height of the window
                            var _maxHeight = 0;

                            $vw.css("min-width", $parent.outerWidth() + "px");

                            if (typeof (window.innerHeight) == 'number') {
                                _maxHeight = window.innerHeight;
                            }
                            else {
                                if (document.documentElement && document.documentElement.clientHeight) {
                                    _maxHeight = document.documentElement.clientHeight;
                                }
                                else {
                                    if (document.body && document.body.clientHeight) {
                                        _maxHeight = document.body.clientHeight;
                                    }
                                }
                            }

                            var _h = _position.top - $(window).scrollTop();   //offset with the window scroll top

                            _h += $vw.outerHeight();

                            if (_h > _maxHeight) {
                                _position.top = Math.max($parent.offset().top - $vw.outerHeight() - _offsetY, 0);
                            }
                            else {
                                _position.top += _offsetY;
                            }

                            $vw.css({ "top": _position.top + "px", "left": _position.left + "px" });

                        }); //end: events.searchableField_popupOnPosition

                        $vw.off("events.searchableField_popupOnShow");
                        $vw.on("events.searchableField_popupOnShow", function (e, args) {

                            args = util_extend({ "IsDisableAnimation": false }, args);

                            var $document = $(document);

                            $parent.addClass("SearchableViewPopupModeOn");
                            $vw.addClass("SearchableViewPopupModeOn");

                            $vw.trigger("events.searchableField_popupOnPosition");
                            $vw.show();

                            $element.data("searchable-popup-active", true);

                            $document.off("click.searchableField_popupOnClick");
                            $document.on("click.searchableField_popupOnClick", function (e, args) {

                                args = util_extend({ "IsDismissPrevious": false }, args);

                                var _canDismiss = args.IsDismissPrevious;

                                if (!_canDismiss) {
                                    var $target = $(e.target);
                                    var $search = $target.closest(".SearchableViewPopupModeOn, .SearchableView, body");

                                    _canDismiss = ($search.is("body"));
                                }

                                if (_canDismiss) {
                                    $document.off("click.searchableField_popupOnClick");
                                    $vw.trigger("events.searchableField_popupOnDimiss");
                                }

                            }); //end: click.searchableField_popupOnClick

                            var $window = $(window);

                            $window.off("resize.searchableField_popupOnResize");
                            $window.on("resize.searchableField_popupOnResize", parent.$.debounce(function (e, args) {

                                $vw.trigger("events.searchableField_popupOnPosition");
                            }, 200));

                            //force scroll to top of view, if applicable
                            if ($vwContent.scrollTop() > 0) {
                                $vwContent.animate({ "scrollTop": "0px" }, (args.IsDisableAnimation ? 0 : 500));
                            }
                        });

                        $vw.off("events.searchableField_popupOnDimiss");
                        $vw.on("events.searchableField_popupOnDimiss", function () {
                            $(window).off("resize.searchableField_popupOnResize");

                            $element.removeData("searchable-popup-active");

                            $parent.removeClass("SearchableViewPopupModeOn");
                            $vw.removeClass("SearchableViewPopupModeOn");

                            $vw.data("RenderID", 0);

                            $vw.trigger("events.searchableField_popupOnToggleIndicator", { "IsEnabled": false });

                            $vw.hide();

                            $vw.data("LabelResultCount")
                               .text("0");

                            $vw.children(".Content:first")
                               .html("<i class='SearchableViewLoadingIcon material-icons'>hourglass_empty</i>");
                        });

                        $vw.off("events.searchableField_popupOnRefreshSelections");
                        $vw.on("events.searchableField_popupOnRefreshSelections", function (e, args) {

                            args = util_extend({ "Selections": null, "RemoveSelections": null, "Callback": null }, args);

                            var _lookupSelections = {};

                            if (args.Selections) {
                                var _arrIDs = (args.Selections || []);

                                for (var i = 0; i < _arrIDs.length; i++) {
                                    var _id = _arrIDs[i];

                                    _lookupSelections[_id] = true;
                                }

                                $element.data("LookupSelections", _lookupSelections);
                            }
                            else {
                                _lookupSelections = $element.data("LookupSelections");

                                if (!_lookupSelections) {
                                    _lookupSelections = {};
                                    $element.data("LookupSelections", _lookupSelections);
                                }
                            }

                            var _removeIDs = (args.RemoveSelections || []);

                            for (var i = 0; i < _removeIDs.length; i++) {
                                var _id = _removeIDs[i];

                                delete _lookupSelections[_id];
                            }

                            var $listSelected = $vw.find(".LinkClickable.Selected[data-item-id]");
                            var _selector = "";

                            for (var _id in _lookupSelections) {
                                _selector += (_selector != "" ? "," : "") + "[" + util_htmlAttribute("data-item-id", _id) + "]";
                            }

                            $listSelected.not(_selector)
                                         .removeClass("Selected");

                            if (args.Callback) {
                                args.Callback();
                            }
                        });

                        $vw.off("click.searchableField_toggleItem");
                        $vw.on("click.searchableField_toggleItem", ".Content > .LinkClickable[data-item-id]:not(.LinkDisabled)", function () {

                            var $this = $(this);

                            if (!_canClearSelection && $this.hasClass("Selected")) {

                                //do not allow selection to be cleared, if applicable
                                return;
                            }

                            $this.addClass("LinkDisabled");

                            var _id = $mobileUtil.GetClosestAttributeValue($this, "data-item-id");
                            var _item = null;
                            var _dataSource = $vw.data("DataSource");
                            var _selected = false;

                            var _clickCallback = function (isDismiss) {

                                isDismiss = util_forceBool(isDismiss, false);

                                $element.trigger("events.searchableField_setSelectionState", { "ID": _id, "IsSelected": _selected });
                                $this.removeClass("LinkDisabled");

                                if (isDismiss) {
                                    $vw.trigger("events.searchableField_popupOnDimiss");
                                }
                            };

                            _dataSource = (_dataSource && _dataSource["List"] ? _dataSource.List : _dataSource);

                            if (!$.isArray(_dataSource)) {
                                _dataSource = [];
                            }

                            _item = util_arrFilter(_dataSource, _searchableSelectOpts.PropertyID, _id, true);
                            _item = (_item.length == 1 ? _item[0] : null);

                            $this.toggleClass("Selected");
                            _selected = $this.hasClass("Selected");

                            if (_selected && _isModeSingle) {
                                var $listSelected = $vw.find(".LinkClickable.Selected[data-item-id]");

                                $listSelected.not($this).removeClass("Selected");
                            }

                            _searchableSelectOpts.OnItemClick.call($this, {
                                "ID": _id, "DataItem": _item, "IsSelected": _selected, "DataSource": _dataSource,
                                "Container": $element, "Callback": _clickCallback
                            });

                        }); //end: events.searchableField_toggleItem

                        var $btnDismiss = $vw.children(".ButtonDismiss");

                        $btnDismiss.off("click.dismiss");
                        $btnDismiss.on("click.dismiss", function () {
                            $vw.trigger("events.searchableField_popupOnDimiss");
                        });

                        //configure the source searchable text input element for the cleanup of the popup
                        $element.off("remove.searchableField_popupCleanup");
                        $element.on("remove.searchableField_popupCleanup", function () {
                            $vw.remove();
                            $(document).off("click.searchableField_popupOnClick");
                            $(window).off("resize.searchableField_popupOnResize");
                        });

                        $element.data("ElementPopup", $vw);
                    }

                    var $content = $vw.children(".Content:first");

                    var _list = (result && result["List"] ? result.List : result);

                    if (!$.isArray(_list)) {
                        _list = [];
                    }

                    var _fnHighlightEncoder = opts.HighlightEncoder;

                    if (!_fnHighlightEncoder) {
                        _fnHighlightEncoder = function (str) {
                            return util_htmlEncode(str);
                        };
                    }

                    var _lookupSelections = $element.data("LookupSelections");

                    if (!_lookupSelections) {
                        _lookupSelections = {};
                        $element.data("LookupSelections", _lookupSelections);
                    }

                    var _renderID = $vw.data("RenderID");

                    if (!_renderID) {
                        _renderID = 0;
                    }

                    _renderID++;

                    $vw.data("RenderID", _renderID);

                    var _fn = function (html, index, onRenderCallback) {

                        var STEP = 50;

                        var _currentRenderID = $vw.data("RenderID");

                        if (_renderID !== _currentRenderID) {
                            return;
                        }
                        else if (index >= _list.length) {
                            onRenderCallback(html);
                        }
                        else {

                            var _end = Math.min(index + STEP, _list.length - 1);

                            for (var i = index; i <= _end; i++) {
                                var _item = _list[i];
                                var _itemID = _item[_searchableSelectOpts.PropertyID];
                                var _label = _item[_searchableSelectOpts.PropertyText];
                                var _attributes = {};
                                var _selected = (_lookupSelections[_itemID] == true);

                                _attributes["data-item-id"] = _itemID;

                                if (_searchableSelectOpts.OnItemAttributes) {
                                    _searchableSelectOpts.OnItemAttributes.call($element, { "Item": _item, "Attributes": _attributes });
                                }

                                html += "<div class='LinkClickable" + (_selected ? " Selected" : "") + "'";

                                for (var _name in _attributes) {
                                    html += " " + util_htmlAttribute(_name, _attributes[_name]);
                                }

                                html += ">";   //open item tag #1

                                html += "  <div class='ActionButton'>" +
                                         "      <a data-role='button' class='ButtonTheme' data-icon='check' data-iconpos='notext' data-theme='transparent' data-inline='true' />" +
                                         "  </div>" +
                                         "  <div class='Label'>" +
                                         _fnRenderLabel({ "Item": _item, "ItemID": _itemID, "Label": _label, "HighlightEncoder": _fnHighlightEncoder }) +
                                         "  </div>";

                                html += "</div>";  //close item tag #1
                            }

                            setTimeout(function () {
                                _fn(html, _end + 1, onRenderCallback);
                            }, 75);
                        }

                    };  //end: _fn

                    $vw.trigger("events.searchableField_popupOnShow", { "IsDisableAnimation": true });

                    setTimeout(function () {

                        _fn("", 0, function (html) {

                            html = util_forceString(html);

                            if (_list.length == 0 && util_forceString(_searchableSelectOpts.NoRecordsMessage) != "") {

                                var _message = (_searchableSelectOpts.IsNoRecordsMessageHTML ?
                                                _searchableSelectOpts.NoRecordsMessage :
                                                util_htmlEncode(_searchableSelectOpts.NoRecordsMessage)
                                               );

                                html += "<div class='NoRecordsMessage'>" +
                                        "  <a data-role='button' data-icon='info' data-theme='transparent' data-iconpos='notext' data-inline='true' />" +
                                        "  <span class='Label'>" + util_forceString(_message) + "</span>" +
                                        "</div>";
                            }

                            $vw.data("LabelResultCount")
                               .text(util_formatNumber(_list.length));

                            $content.html(html);
                            $mobileUtil.refresh($content);

                            $vw.data("DataSource", result);
                            $vw.trigger("events.searchableField_popupOnShow");
                        });

                    }, 100);
                };

                $element.off("focus.searchable");
                $element.on("focus.searchable", function (e, args) {
                    var $this = $(this);

                    if (!$this.data("searchable-popup-active")) {

                        //remove previous popup (if applicable)
                        $element.trigger("click.searchableField_popupOnClick", { "IsDismissPrevious": true });

                        $this.trigger("events.toggleSearchModeState");
                        $this.trigger("events.searchable_submit", { "From": "focus", "IsForceRefresh": true });
                    }
                });

                $element.off("events.searchable_toggleIndicator");
                $element.on("events.searchable_toggleIndicator", function (e, args) {
                    var $vw = $element.data("ElementPopup");

                    if ($vw) {
                        $vw.trigger("events.searchableField_popupOnToggleIndicator", args);
                    }
                });

                $element.off("events.searchableField_setSelectionState");
                $element.on("events.searchableField_setSelectionState", function (e, args) {

                    args = util_extend({ "ID": null, "IsSelected": false }, args);

                    if (args.ID !== null) {
                        var _lookupSelections = $element.data("LookupSelections");

                        if (!_lookupSelections) {
                            _lookupSelections = {};
                            $element.data("LookupSelections", _lookupSelections);
                        }

                        if (args.IsSelected) {

                            if (_isModeSingle) {
                                for (var _id in _lookupSelections) {
                                    delete _lookupSelections[_id];
                                }
                            }

                            _lookupSelections[args.ID] = true;
                        }
                        else {
                            delete _lookupSelections[args.ID];
                        }
                    }

                }); //end: events.searchableField_setSelectionState

                $element.attr("data-theme", "text-searchable-a");
            }
            else {
                $element.off("focus.searchable_onTextHighlight");

                if (util_forceInt($element.attr("data-searchable-field-select-on-focus"), enCETriState.None) == enCETriState.Yes) {
                    $element.on("focus.searchable_onTextHighlight", function (e, args) {

                        args = util_extend({ "IsTextSelected": true }, args);

                        if (args.IsTextSelected && !$element.data("searchable-field-disable-focus-selection")) {
                            try {
                                $element.select();
                            } catch (e) {
                            }
                        }

                    }); //end: focus.searchable_onTextHighlight
                }
            }

            $element.off("events.searchable_submit");
            $element.on("events.searchable_submit", function (e, args) {
                var _val = $element.val();
                var _prevSearch = util_forceString($element.data("searchable-query"), "");

                var _params = {
                    "From": (args ? args["From"] : null),
                    "Query": _val,
                    "PreviousQuery": _prevSearch
                };

                if (_prevSearch !== _params.Query || (args && args["IsForceRefresh"] == true)) {

                    var _id = _fnID();

                    $element.data("searchable-id", _id)
                            .data("searchable-query", _params.Query);

                    var _request = $element.data("LastRequest");

                    if (_request) {
                        _request.abort();
                        $element.removeData("LastRequest");
                    }

                    //abort previous search
                    _options.OnAbort.call(this, _params);

                    $element.trigger("events.searchable_toggleIndicator", { "IsEnabled": true });

                    _options.OnSearch.call(this, _params, function (result) {

                        //check that the ID is valid, and if so render the search results
                        if (_id == $element.data("searchable-id")) {

                            var _temp = { "Search": _params["Query"], "Result": null };

                            $element.trigger("events.searchable_getHighlightEncoder", _temp);

                            _params["HighlightEncoder"] = _temp.Result; //pass the function to encode text to highlight format

                            $element.trigger("events.searchable_toggleIndicator", { "IsEnabled": false });

                            _options.OnRenderResult.call(this, result, _params);
                        }
                    });
                }
            });

            $element.off("change.searchable");
            $element.on("change.searchable", parent.$.debounce(function (e, args) {
                var $this = $(this);

                $this.trigger("events.toggleSearchModeState");
                $this.trigger("events.searchable_submit", { "From": "change" });

            }, _delay));

            $element.off("keydown.searchable");
            $element.on("keydown.searchable", parent.$.debounce(function (e, args) {
                var $this = $(this);

                $this.trigger("events.toggleSearchModeState");
                $this.trigger("events.searchable_submit", { "From": "keydown" });
            }, _delay));

            $element.off("blur.searchable");
            $element.on("blur.searchable", parent.$.debounce(function (e, args) {
                var $this = $(this);

                $this.trigger("events.toggleSearchModeState");
                $this.trigger("events.searchable_submit", { "From": "blur" });
            }, _delay));

            $element.off("events.searchable_getHighlightEncoder");
            $element.on("events.searchable_getHighlightEncoder", function (e, args) {

                if (!args) {
                    args = util_extend({ "Search": null }, args);
                }

                var _searchText = util_forceString(args["Search"], "");

                var _regex = (_searchText != "" ? new RegExp("(" + util_regexEscape(_searchText) + ")", "gi") : null);

                var _ret = function (str, isNewLineEncode, isDisableEncode, lookupPopulateTokens) {
                    if (_regex) {
                        str = str.replace(_regex, "TAGxHTx1" + "$1" + "TAGxHTx2");

                        if (lookupPopulateTokens) {
                            lookupPopulateTokens["TAGxHTx1"] = "<span class='SearchableMatch'>";
                            lookupPopulateTokens["TAGxHTx2"] = "</span>";
                        }

                        if (!isDisableEncode) {
                            str = util_htmlEncode(str, isNewLineEncode);

                            str = str.replace(/TAGxHTx1/g, "<span class='SearchableMatch'>")
                                     .replace(/TAGxHTx2/g, "</span>");
                        }
                    }
                    else {
                        if (!isDisableEncode) {
                            str = util_htmlEncode(str, isNewLineEncode);
                        }
                    }

                    return str;
                };

                //synchronous method call so return the value
                args["Result"] = _ret;

            });

            $element.off("events.toggleSearchModeState");

            if ($parent) {
                $element.on("events.toggleSearchModeState", function () {
                    var _val = $(this).val();

                    $parent.toggleClass("SearchModeOn", _val != "");
                });
            }

            $element.trigger("events.toggleSearchModeState");
        }

    });
}

function GetRenderManagerInstance() {
    var _ret = {
        m_ID: null,
        IsBusy: false,
        ID: function () {
            if (util_isNullOrUndefined(this.m_ID)) {
                this.m_ID = "render_id_" + this.GetTimestamp();
            }

            return this.m_ID;
        },
        GetTimestamp: function () {
            return (new Date()).getTime();
        },
        Queue: [],
        Execute: function () {
            var _renderManager = this;

            if (!_renderManager.IsBusy && _renderManager.Queue != null && _renderManager.Queue.length > 0) {
                var _item = _renderManager.Queue.shift();

                //check if the ID is the same (i.e. render manager has not been cleared and using correct state)
                if (_item["ID"] == _renderManager.ID()) {
                    _renderManager.IsBusy = true;  //set flag the renderer is currently busy

                    setTimeout(function () {
                        var _callback = function () {
                            _renderManager.IsBusy = false; //clear flag
                            _renderManager.Execute();
                        };

                        var _fn = _item["RenderFn"];
                        var _options = _item["Options"];

                        if (_fn) {
                            if (_item["HasCallback"]) {
                                _fn(_callback, _options);
                            }
                            else {
                                _fn(_options);
                                _callback();
                            }
                        }
                        else {
                            _callback(_options);
                        }
                    }, 25);
                }
                else {

                    //item from queue does not match current render manager state, so move to next item in queue
                    _renderManager.Execute();
                }
            }
        },
        Enqueue: function (fn, requireCallback, forceExecute, args) {
            requireCallback = util_forceBool(requireCallback, false);
            forceExecute = util_forceBool(forceExecute, true);

            var _renderManager = this;

            _renderManager.Queue.push({ ID: _renderManager.ID(), RenderFn: fn, HasCallback: requireCallback, Options: args });

            if (forceExecute && !_renderManager.IsBusy) {
                _renderManager.Execute();
            }
        },
        Clear: function () {
            var _renderManager = this;

            _renderManager.m_ID = null;
            _renderManager.Queue = [];
            _renderManager.IsBusy = false;
        }
    };

    return _ret;
}

$(function () {
    renderer_init();

    if (util_isDefined("CKEDITOR") && CKEDITOR["on"]) {

        //configure the CKEditor event for when an instance is ready and configured
        CKEDITOR.on('instanceReady', function (ev) {
            var _editor = ev.editor;
            renderer_event_editor_ready(_editor);
        });
    }
});