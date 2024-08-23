
/**********************************************************************************************************************/
/******************************** SECTION START: Repeater *************************************************************/
/**********************************************************************************************************************/

var CONTROL_ATTR_REPEATER_SORT_ASC = "data-attr-repeater-sort-asc"; //current sort order (is ASC)

var CONTROL_ATTR_REPEATER_SORT_LINK = "data-attr-sort-link";
var CONTROL_ATTR_REPEATER_SORT_LINK_HEADER_TEXT = "data-attr-sort-link-header";

var CONTROL_ATTR_REPEATER_PAGING_PAGE_NUM = "data-attr-repeater-paging-page-num";   //current page num for list
var CONTROL_ATTR_REPEATER_PAGING_NUM_ITEMS = "data-attr-repeater-paging-num-items"; //the num of items in total for the list
var CONTROL_ATTR_REPEATER_PAGING_NAV_TO_PAGE = "data-attr-repeater-paging-nav-page-num";    //the page number for a specific nav link (i.e. the page number to load)
var CONTROL_ATTR_REPEATER_PAGING_PAGE_SIZE = "data-attr-repeater-paging-page-size";    //the page size (i.e. number of max items per page)

var CONTROL_ATTR_REPEATER_ELEMENT_DATABIND = "data-attr-repeater-bind"; //flag an element as having been dynamically databound

function ctl_repeater_getSetting(ctl, mContentTemplateHTML, mTokens, fnTokenProperty, fnSourceDataBind, mTargetElementPagingContainer,
                            mRowOddCSS, mRowEvenCSS, mPageSize, fnContentRowExtAttr, fnContentRowCss) {

    var _element = $(ctl);

    if (util_isNullOrUndefined(mRowOddCSS) && util_isNullOrUndefined(mRowEvenCSS)) {
        mRowOddCSS = "TableRowOdd";
        mRowEvenCSS = "TableRowEven";
    }

    mRowOddCSS = util_forceString(mRowOddCSS, "");
    mRowEvenCSS = util_forceString(mRowEvenCSS, "");

    //if no target paging control is specified then attempt to obtain it using the target control and querying its children
    if (util_isNullOrUndefined(mTargetElementPagingContainer) && _element.attr("id")) {
        mTargetElementPagingContainer = $(_element.find("#" + _element.attr("id") + "_RepeaterPaging"));
    }

    return { ContentTemplateHTML: mContentTemplateHTML, Tokens: mTokens, FnProperty: fnTokenProperty,
        FnContainerDataBind: fnSourceDataBind, RowOddCSS: mRowOddCSS, RowEvenCSS: mRowEvenCSS,
        TargetElementPagingContainer: mTargetElementPagingContainer, PageSize: util_forceInt(mPageSize, PAGE_SIZE),
        FnContentRowExtAttributes: fnContentRowExtAttr,
        FnContentRowCssClass: fnContentRowCss
    };
}

function ctl_repeater_getSortSetting(obj) {
    var _ret = null;

    var _element = $(obj);

    if (_element.length != 1) {
        return {};
    }

    _ret = { SortColumn: _element.attr(CONTROL_ATTR_REPEATER_SORT_COLUMN), SortASC: _element.attr(CONTROL_ATTR_REPEATER_SORT_ASC),
        PageNo: _element.attr(CONTROL_ATTR_REPEATER_PAGING_PAGE_NUM), EnumSortType: _element.attr(CONTROL_ATTR_REPEATER_SORT_ENUM),
        PageSize: util_forceInt(_element.attr(CONTROL_ATTR_REPEATER_PAGING_PAGE_SIZE), PAGE_SIZE)
    };

    var _sortOrder = util_forceInt(_element.attr("sort-order-group"), 1);

    if (_ret.SortColumn == null || _ret.SortColumn == undefined) {

        _ret.SortColumn = util_queryStringFragment("SortR" + _sortOrder + "COL");   //attempt to retrieve the sort column from query string, if applicable

        if (util_isNullOrUndefined(_ret.SortColumn)) {

            _ret.SortColumn = util_forceString(_element.attr("default-sort"), _ret.SortColumn);

            if (util_isNullOrUndefined(_ret.SortColumn)) {

                var _enumType = eval(_ret.EnumSortType);

                //if the sort column has not been initialize then determine if there is a "Default" enum field for the sort type
                if (_enumType && !util_isNullOrUndefined(_enumType["Default"])) {
                    _ret.SortColumn = _enumType.Default;
                }
            }
            else {
                _ret.SortColumn = eval(_ret.SortColumn);
            }
        }
    }

    //force valid sort ASC order (use application default if not initialized)
    if (util_isNullOrUndefined(_ret.SortASC)) {

        //attempt to retrieve the sort order from query string, if applicable
        _ret.SortASC = util_forceBoolFromInt(util_queryStringFragment("SortR" + _sortOrder + "ASC"), SORT_HEADER_DEFAULT_IS_ASC);
    }

    if (_ret.PageNo == undefined) {
        _ret.PageNo = util_queryStringFragment("SortR" + _sortOrder + "PAGE");
    }

    _ret.PageNo = util_forceInt(_ret.PageNo, enCEPaging.NoPaging);  //force valid page number (default if is to not page the results)

    return _ret;
}

//attempts to set the repeater sort setting for the repeater object specified and the settings object to merge with existing (if setting property is not found then will use current)
function ctl_repeater_setSortSettingCurrentPage(obj, pageNo) {
    $(obj).attr(CONTROL_ATTR_REPEATER_PAGING_PAGE_NUM, pageNo);
}

function ctl_repeater_setSortSetting(obj, enumSortType, sortColumn, sortASC, pageNo, pageSize) {
    var _element = $(obj);

    _element.attr(CONTROL_ATTR_REPEATER_SORT_COLUMN, sortColumn);
    _element.attr(CONTROL_ATTR_REPEATER_SORT_ASC, sortASC);
    _element.attr(CONTROL_ATTR_REPEATER_SORT_ENUM, enumSortType);

    if (util_isNullOrUndefined(pageSize)) {
        pageSize = util_forceInt(_element.attr(CONTROL_ATTR_REPEATER_PAGING_PAGE_SIZE), -1);

        if (pageSize < 0) {
            pageSize = null;
        }
    }

    _element.attr(CONTROL_ATTR_REPEATER_PAGING_PAGE_SIZE, util_forceInt(pageSize, PAGE_SIZE));

    //only update the page number if a value is specified (since most often this function will be called to switch sort column and/or direction)
    if (pageNo != undefined) {
        ctl_repeater_setSortSettingCurrentPage(_element, pageNo);        
    }

    //configure the sort header toggle
    var _enumType = eval(enumSortType);

    var _searchValue = null;

    for (var _name in _enumType) {
        if (_enumType[_name] == sortColumn) {
            _searchValue = enumSortType + "." + _name;
            break;
        }
    }

    if (_searchValue == null) {
        _searchValue = sortColumn;
    }

    var _sortCell = _element.find("[" + CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN + "='" + _searchValue + "']");

    //remove the previous sort indicator
    _element.find("." + REPEATER_CSS_INDICATOR_SORT).removeClass(REPEATER_CSS_INDICATOR_SORT);

    if (_sortCell.length == 1) {
        _sortCell.addClass(REPEATER_CSS_INDICATOR_SORT);
    }
    else if (sortColumn !== undefined || _searchValue !== undefined) {
        AddError("ctl_repeater_setSortSetting :: unable to sort for the selected column : " + sortColumn + ".");
    }

    var _orderGroup = util_forceInt(_element.attr("sort-order-group"), 1);
    var _prefix = "SortR" + _orderGroup;

    //append the sort column, order, and page no into the navigation view state URL
    MODULE_MANAGER.Navigation.SetItemQS(null, _prefix + "COL", sortColumn);   //sort column
    MODULE_MANAGER.Navigation.SetItemQS(null, _prefix + "ASC", (sortASC ? enCETriState.Yes : enCETriState.No));   //sort ASC

    if (pageNo != undefined) {
        MODULE_MANAGER.Navigation.SetItemQS(null, _prefix + "PAGE", pageNo);   //page no
    }
}

function ctl_repeater_toggleSort(obj, sortColumn, sortColumnASC, pageNo, pageSize) {
    var _element = $(obj);
    var _currentSettings = ctl_repeater_getSortSetting(obj);

    if (_currentSettings.SortColumn != sortColumn) {

        //new sort column is different than current sort column (therefore reset sort settings)
        _currentSettings.SortColumn = sortColumn;
        _currentSettings.SortASC = SORT_HEADER_DEFAULT_IS_ASC;  //retrive the default sort ASC value based on application settings
    }
    else {

        //new sort column is the same as the current sort column (so toggle ASC order)
        _currentSettings.SortColumn = sortColumn;
        _currentSettings.SortASC = (util_forceBool(_currentSettings.SortASC, SORT_HEADER_DEFAULT_IS_ASC) ? false : true);
    }

    //update the sort settings to the element
    ctl_repeater_setSortSetting(obj, _currentSettings.EnumSortType, _currentSettings.SortColumn, _currentSettings.SortASC, pageNo, pageSize);
}

function ctl_repeater_configCriticalHeaders(obj) {
    var _element = $(obj);

    var _criticalHeaders = _element.find("[" + CONTROL_ATTR_REPEATER_SORT_LINK + "=Header]");
    var _popup = $("#" + _element.attr("id") + "-popup");
    var _lstColumnChooserTexts = _popup.find(".ui-checkbox .ui-btn-text");
    var _length = _lstColumnChooserTexts.length;

    $.each(_criticalHeaders, function (index) {
        var _header = $(this);

        if (util_forceString(_header.attr("data-priority"), "") == "CRITICAL") {
            var _search = _header.attr(CONTROL_ATTR_REPEATER_SORT_LINK_HEADER_TEXT);

            for (var i = 0; i < _length; i++) {
                var _item = $(_lstColumnChooserTexts[i]);

                if (_item.text() == _search) {
                    var _cb = $(_item.parentsUntil("div.ui-checkbox")[1]).parent();
                    _cb.hide();
                    break;
                }
            }
        }
    });
}

function ctl_repeater_configPagingHTML(obj, renderSetting) {

    if (renderSetting && renderSetting.TargetElementPagingContainer) {
        var _element = $(obj);
        var _paging = $(renderSetting.TargetElementPagingContainer);

        var _numItems = util_forceInt(_element.attr(CONTROL_ATTR_REPEATER_PAGING_NUM_ITEMS), 1);
        var _currentPage = _element.attr(CONTROL_ATTR_REPEATER_PAGING_PAGE_NUM);

        if (_currentPage == undefined) {            
            var _orderGroup = util_forceInt(_element.attr("sort-order-group"), 1);

            _currentPage = util_queryStringFragment("SortR" + _orderGroup + "PAGE");
        }

        _currentPage = util_forceInt(_currentPage, 1);
        
        var _perNumPageLinksShow = util_forceInt(PAGE_NUM_INDEX_TO_SHOW, 0);
        var _pageSize = util_forceFloat(renderSetting["PageSize"], PAGE_SIZE);

        var _numPages = parseInt(Math.ceil(_numItems / parseFloat(_pageSize)), 0);
        var _html = "";

        var _fnGetNavBtnHTML = function (text, isEnabled, isPrev, pageNo) {
            var _btn = "";
            var _linkStyle = "";

            if (isPrev == true) {
                _linkStyle = " data-icon='arrow-l'";
            }
            else if (isPrev == false) {
                _linkStyle = " data-icon='arrow-r'";
            }

            _btn = "<a href='#' " + (!isEnabled ? "class='ui-disabled' " : "") + "data-role='button' data-mini='true' data-inline='true' data-theme='b' " +
                   CONTROL_ATTR_REPEATER_PAGING_NAV_TO_PAGE + "='" + pageNo + "'  " + _linkStyle + ">" + text + "</a>";

            return _btn;
        };

        if (_numPages == 0) {
            _numPages = 1;
        }

        if (_currentPage < 1) {
            _currentPage = 1;
        }

        if (_currentPage > _numPages) {
            _currentPage = _numPages;
        }

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

            _html += "&nbsp;" + _currentPage + "&nbsp;";

            for (var j = _currentPage + 1; j <= _currentPage + _numItemsShowAfter; j++) {
                _html += _fnGetNavBtnHTML(j, true, null, j);
            }
        }

        _html += _fnGetNavBtnHTML("Next", (_currentPage != _numPages), false, _currentPage + 1);
        _html += "<b>of " + _numPages + "</b>";

        _paging.html(_html);

        js_bindClick(_paging.find("a"), function () {
            var _navBtn = $(this);
            var _pageNo = util_forceInt(_navBtn.attr(CONTROL_ATTR_REPEATER_PAGING_NAV_TO_PAGE), 1);

            //set the container element with the new page number
            _element.attr(CONTROL_ATTR_REPEATER_PAGING_PAGE_NUM, _pageNo);

            //append to view state for the page number
            var _orderGroup = util_forceInt(_element.attr("sort-order-group"), 1);
            var _prefix = "SortR" + _orderGroup;

            MODULE_MANAGER.Navigation.SetItemQS(null, _prefix + "PAGE", _pageNo);

            //databind the source for the new page number
            if (renderSetting.FnContainerDataBind) {
                renderSetting.FnContainerDataBind();
            }

            return false;
        });

        $mobileUtil.refresh(_paging, true);
    }
}

function ctl_repeater_bind(obj, dataSource, renderSetting) {
    var _element = $(obj);

    if (renderSetting == null || _element.length == 0) {
        return;
    }

    //set CSS class for the element
    _element.addClass(REPEATER_CSS);

    //remove all previous data bound items (i.e. elements flagged with specific repeater data bind attribute)
    _element.find("[" + CONTROL_ATTR_REPEATER_ELEMENT_DATABIND + "=1]").remove();

    //find the "Content" tbody tag and insert the data rows into it
    var _current = $(_element.find("[" + DATA_ATTR_TEMPLATE + "=Content]"));

    //configure the sort headers for the element's header
    var _header = $(_element.find("[" + DATA_ATTR_TEMPLATE + "=Header]"));
    var _listSortHeaders = _header.find("[" + CONTROL_ATTR_REPEATER_SORT_LINK + "=Header]");

    var _sortSetting = ctl_repeater_getSortSetting(_element);

    //init the sort header links
    $.each(_listSortHeaders, function (index) {
        var _this = $(this);

        var _attrHeaderText = _this.attr(CONTROL_ATTR_REPEATER_SORT_LINK_HEADER_TEXT);

        if (_attrHeaderText == null || _attrHeaderText == undefined) {
            _attrHeaderText = _this.text();
            _this.attr(CONTROL_ATTR_REPEATER_SORT_LINK_HEADER_TEXT, _attrHeaderText);
        }

        var _linkStyle = "";
        var _headerSortColumn = _this.attr(CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN);
        var _sortColumnVal = null;

        try {
            _sortColumnVal = eval(_headerSortColumn);
        } catch (e) {
        }

        if (_sortColumnVal == _sortSetting.SortColumn) {
            _linkStyle = null;

            if (util_forceBool(_sortSetting.SortASC, false)) {
                _linkStyle = " data-icon='arrow-u'";
            }
            else {
                _linkStyle = " data-icon='arrow-d'";
            }
        }

        var _hasTooltip = (util_forceInt(_this.attr(CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN_HAS_TOOLTIP), enCETriState.None) == enCETriState.Yes);
        var _isTooltipTitleFormat = (util_forceInt(_this.attr(CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN_IS_TOOLTIP_TITLE_FORMAT), enCETriState.None) == enCETriState.Yes);

        _this.html("<a class='CRepeaterSort" + (_hasTooltip && !_isTooltipTitleFormat ? " CRepeaterTooltipOn" : "") + "' href='#' data-role='button' " +
                   "data-corners='false' data-mini='true' data-theme='a' data-iconpos='right' " + 
                   (_hasTooltip && _isTooltipTitleFormat ? util_htmlAttribute("title", _attrHeaderText, null, true) + " " : "") +
                   _linkStyle + ">" + _attrHeaderText + "</a>" +
                   (_hasTooltip && !_isTooltipTitleFormat ?
                    "<a data-role='button' data-icon='info' data-inline='true' data-iconpos='notext' data-theme='transparent' class='CRepeaterTooltip' " +
                    util_renderAttribute("callout") + "/>" :
                    "")
                   );
    });

    js_bindClick(_listSortHeaders.find(".CRepeaterSort"), function () {
        var _this = $(this).parent();   //parent for the link button is the element with the sort details required
        var _linkColumn = util_forceString(_this.attr(CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN), null);

        if (_linkColumn != null) {
            try {
                _linkColumn = eval(_linkColumn);
            } catch (e) {
            }

            ctl_repeater_toggleSort(obj, _linkColumn, null);
        }

        if (renderSetting.FnContainerDataBind) {
            renderSetting.FnContainerDataBind();
        }
    });

    var _noRecordsContainer = _element.find("." + REPEATER_CSS_NO_RECORDS_CONTAINER);
    var _isCustomList = (dataSource && dataSource.List != undefined);
    var _list = (_isCustomList ? dataSource.List : dataSource);

    _noRecordsContainer.hide();

    if (_list && _list.length && _list.length > 0) {
        var _isOdd = true;
        var _hasTokens = (renderSetting.Tokens && renderSetting.Tokens.length && renderSetting.Tokens.length > 0);

        //loop through all the data source items and bind the items
        for (var i = 0; i < _list.length; i++) {
            var _item = _list[i];
            var _html = renderSetting.ContentTemplateHTML;
            var _row = null;

            //configure the CSS token
            var _rowCSS = (_isOdd ? renderSetting.RowOddCSS : renderSetting.RowEvenCSS);

            if (renderSetting.FnContentRowCssClass) {
                var _cssClass = renderSetting.FnContentRowCssClass({ "Item": _item, "Index": i });

                if (_cssClass) {
                    _rowCSS = (_rowCSS ? _rowCSS + " " : "") + _cssClass;
                }
            }

            _html = util_replaceAll(_html, "%ROW_CSS%", _rowCSS);

            //configure the content row extended attributes, if applicable
            var _rowExtAttr = "";

            if (renderSetting.FnContentRowExtAttributes) {
                _rowExtAttr = util_forceString(renderSetting.FnContentRowExtAttributes(_item));
            }

            _html = util_replaceAll(_html, "%%CONTENT_ROW_EXT_ATTRIBUTES%%", _rowExtAttr);

            //configure the custom tokens
            if (_hasTokens) {
                for (var j = 0; j < renderSetting.Tokens.length; j++) {
                    var _tokenKey = renderSetting.Tokens[j];
                    _html = util_replaceAll(_html, _tokenKey, renderSetting.FnProperty(_tokenKey, _item, { "Element": _element, "DataItemIndex": i }));
                }
            }

            _row = $(_html);

            //set flag to the new element that it is a repeater data bound element
            _row.attr(CONTROL_ATTR_REPEATER_ELEMENT_DATABIND, "1");

            _current.append(_row);

            _isOdd = !(_isOdd);
        }

        //set the paging details (only the num items and not the page no)
        _element.attr(CONTROL_ATTR_REPEATER_PAGING_NUM_ITEMS, (_isCustomList ? dataSource.NumItems : _list.length));

        _element.attr(CONTROL_ATTR_REPEATER_PAGING_PAGE_SIZE, renderSetting.PageSize);
    }
    else {

        //show the no records container (set default message if its contents are empty)
        if (_noRecordsContainer.text() == "") {
            _noRecordsContainer.text("No records were found.");
        }

        _noRecordsContainer.show();

        //clear previous paging details
        _element.removeAttr(CONTROL_ATTR_REPEATER_PAGING_NUM_ITEMS);
        _element.removeAttr(CONTROL_ATTR_REPEATER_PAGING_PAGE_NUM);        
    }

    //call the refresh method on the table
    $mobileUtil.refresh(_element);

    //enhance any and all markup as needed
    _element.trigger("create");

    //configure the columns flagged as critical to be disabled in the columns chooser dialog view for the element
    ctl_repeater_configCriticalHeaders(obj);

    //configure the paging, if applicable
    ctl_repeater_configPagingHTML(obj, renderSetting);

    _element.show();


    //HACK: at times jQuery Mobile tends to not properly update the CSS class for the markup and hides table cells;
    //      must manually remove the class no longer needed for the table cells and set the proper class
    var _cellList = _element.find("[" + DATA_ATTR_TEMPLATE + "=Content] tr td.ui-table-cell-hidden");

    if (_cellList.length > 0) {
        _cellList.removeClass("ui-table-cell-hidden");
        _cellList.addClass("ui-table-cell-visible");
    }
}

/**********************************************************************************************************************/
/******************************** SECTION END: Repeater ***************************************************************/
/**********************************************************************************************************************/