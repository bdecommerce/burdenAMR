function util_arrExtractSubset(arr, subsetProperty, includeNull) {

    if (util_isNullOrUndefined(arr)) arr = [];

    subsetProperty = util_forceString(subsetProperty);
    includeNull = util_forceBool(includeNull, true);

    var _ret = [];

    if (subsetProperty != "") {
        for (var i = 0; i < arr.length; i++) {

            if (arr[i] && arr[i][subsetProperty]
			   || includeNull) {
                _ret.push(arr[i][subsetProperty]);
            }
        }
    }

    return _ret;
}

function util_isNotNullOrUndefined(object) {
    return object != null && object != undefined;
}

function util_getObjectKeys(object) {
    var keys = [];
    for (var key in object) {
        keys.push(key);
    }
    return keys;
}

function util_sanitizeString(string) {
    if (string.value != undefined)
        return string.value.replace(/[^a-zA-Z0-9_ -]/g, '');
    else
        return string.replace(/[^a-zA-Z0-9_ -]/g, '');
}

function util_rgba2hex(rgba) {
    rgba = rgba.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgba[1]) + hex(rgba[2]) + hex(rgba[3]);
}

//Function to convert hex format to a rgb color
function util_rgb2hex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    return "#" +
  ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2);
}

function internal_recursive_PopupCheck(obj, callback) {
    $(obj).height($(document).height());
    if ($mobileUtil.PopupIsOpen())
        setTimeout(function () { internal_recursive_PopupCheck(obj, callback); }, 100);
    else {
        if (callback != undefined && callback != null)
            callback();
        $(obj).remove();
    }
}

function util_setupScreenBlockwithPopupPolling(color, opacity, callback) {
    if ($("#util_screenblock").length != 0) return;

    var div = "<div id='util_screenblock' tabindex='0' style=\"position:absolute; top:0; left:0; width:100%; height:"+$(document).height()+"px; background-color:" + color + ";z-index: 1000; opacity: " + opacity + "; -ms-filter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity="+(opacity*100)+")';\"></div>";
    $(document.body).append(div);

    setTimeout(function () { internal_recursive_PopupCheck('#util_screenblock', callback); }, 1000);
    $("#util_screenblock").click(function () {
        if (callback != undefined && callback != null)
            callback();
        $(this).remove();
    });
    $("#util_screenblock").focus(function () {
        if(callback != undefined && callback != null)
            callback();
        $(this).remove();
    });
}

function util_getPostbackID(obj) {
    var _clientID = "";

    if (obj != null) {
        _clientID = $(obj).attr("id");
        _clientID = _clientID.replace(/_/g, "$");
    }

    return _clientID;
}

function util_isNonEmpty(val) {
    return util_trim(util_forceString(val, "")).length > 0;
}

function util_isDate(val) {
    var _dt = Date.parse(val);  //Note: using a JavaScript add on file which allows multiple convert from various date format strings

    if (_dt != "Invalid Date" && _dt != null && _dt != undefined && !isNaN(_dt)) {
        return true;
    }

    return false;
}

function util_isNumeric(val) {
    if (val == null || val == undefined) {
        return false;
    }

    var _converted = val;

    try {
        _converted = parseFloat(val);
    } catch (e) {
    }

    if (_converted + 0 == val && !isNaN(_converted)) {
        return true;
    }

    return false;
}

function util_isWholeNumber(val) {
    var _ret = false;

    if (!util_isNumeric(val)) {
        _ret = false;
    }
    else {
        _ret = (util_forceInt(val) == util_forceFloat(val));
    }

    return _ret;
}

function util_forceInt(val, defaultValue, isDisableDefaultCheck) {
    isDisableDefaultCheck = util_forceBool(isDisableDefaultCheck, false);

    if (!isDisableDefaultCheck && (defaultValue == null || defaultValue == undefined)) {
        defaultValue = 0;
    }

    if (util_isNumeric(val)) {
        try {
            val = parseInt(val);
        } catch (e) {
            val = defaultValue;
        }
    }
    else {
        val = defaultValue;
    }

    return val;
}

function util_forceFloat(val, defaultValue, isAllowUndefined) {
    isAllowUndefined = util_forceBool(isAllowUndefined, false);

    if (defaultValue == null || (!isAllowUndefined && defaultValue == undefined)) {
        defaultValue = 0.0;
    }

    if (util_isNumeric(val)) {
        try {
            val = parseFloat(val);
        } catch (e) {
            val = defaultValue;
        }
    }
    else {
        val = defaultValue;
    }

    return val;
}

function util_forceString(val, defaultValue) {
    if (defaultValue == null || defaultValue == undefined) {
        defaultValue = "";
    }

    if (val == null || val == undefined) {
        val = defaultValue;
    }

    return val;
}

function util_forceBool(val, defaultValue) {
    if (defaultValue == null || defaultValue == undefined) {
        defaultValue = false;
    }

    if (val == "true" || val == true) {
        val = true;
    }
    else if (val == "false" || val == false) {
        val = false;
    }
    else if (val != true && val != false) {
        val = defaultValue;
    }

    return val;
}

function util_forceBoolFromInt(val, defaultValue, isAllowUndefined) {
    isAllowUndefined = util_forceBool(isAllowUndefined, false);

    if (defaultValue == null || (!isAllowUndefined && defaultValue == undefined)) {
        defaultValue = false;
    }

    val = util_forceInt(val, -1);   //using -1 to indicate an invalid bit value

    if (val == 1 || val == 0) {
        val = (val == 1 ? true : false);
    }
    else {
        val = defaultValue;
    }

    return val;
}

function util_forceBoolFromTriState(val, defaultValue, isDisableDefaultCheck) {
    isDisableDefaultCheck = util_forceBool(isDisableDefaultCheck, false);

    if (!isDisableDefaultCheck && (defaultValue == null || defaultValue == undefined)) {
        defaultValue = null;
    }

    val = util_forceValidEnum(util_forceInt(val, null, true), enCETriState, null);

    if (val == enCETriState.Yes) {
        val = true;
    }
    else if (val == enCETriState.No) {
        val = false;
    }
    else {
        val = defaultValue;
    }

    return val;
}

function util_forceObject(val, defaultValue) {
    if (defaultValue == null || defaultValue == undefined) {
        defaultValue = {};
    }

    //check if the value is an object instance
    if (val != null && typeof val === "object") {
        //do nothing since value is an object
    } else {
        val = defaultValue;
    }

    return val;
}

function util_round(val, decimal) {
    var _ret = util_forceFloat(val);
    decimal = util_forceInt(decimal, 0);

    _ret = _ret.toFixed(decimal);

    return _ret;
}

function util_trim(val) {

    //Note: IE does not support trim() for strings so use jQuery's trim() method
    return $.trim(util_forceString(val, ""));
}

function util_isNullOrUndefined(val) {
    return val == null || val == undefined;
}

function util_isDefined(exp) {
    var _ret = false;

    exp = util_forceString(exp, "");
    try {

        if (exp != "") {
            var _temp = eval(exp);  //evaluate the expression and if no errors occur then the expression exists

            _ret = true;
        }
    } catch (e) {
        _ret = false;
    }

    return _ret;
}

function util_isFunction(exp) {
    var _ret = false;

    if (util_isDefined(exp)) {
        var _temp = eval(exp);

        _ret = $.isFunction(_temp);
    }

    return _ret;
}

function util_logError(msg) {
    util_log(msg, enCConsoleLogType.ERROR);
}

function util_log(msg, logType) {
    logType = util_forceValidEnum(logType, enCConsoleLogType, enCConsoleLogType.DEBUG);

    if (msg != null) {
        try {
            if (console) {
                var _dateTime = new Date();
                var _msg = "(" + _dateTime.toLocaleTimeString() + ") " + msg;

                if (logType == enCConsoleLogType.DEBUG && console["debug"] != null && console["debug"] != undefined) {
                    console.debug(_msg);
                }
                else if (logType == enCConsoleLogType.ERROR && console["error"] != null && console["error"] != undefined) {
                    console.error(_msg);
                }
                else if (console["log"] != null && console["log"] != undefined) {
                    try {
                        var log = Function.prototype.bind.call(console.log, console);
                        log.apply(console, [_msg]);
                    } catch (e) {
                        console.log(_msg);
                    }
                }
            }
        } catch (e) {
        }
    }
}

function util_replaceAll(str, look_for, replace_with, isEscape) {
    isEscape = util_forceBool(isEscape, false);

    if (str != null) {
        look_for = (isEscape ? util_regexEscape(look_for) : look_for);

        var regex = new RegExp(look_for, 'g');
        return (str + "").replace(regex, replace_with);
    }

    return str;
}

function util_replaceTokens(str, collectionTokens) {
    str = util_forceString(str);

    if (collectionTokens == null || collectionTokens == undefined) {
        collectionTokens = {};
    }

    for (var _token in collectionTokens) {
        str = util_replaceAll(str, _token, util_forceString(collectionTokens[_token]));
    }

    return str;
}

function util_regexEscape(str) {
    str = util_forceString(str);

    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function util_url_getRelativeForCurrentPath() {
    var _ret = "";
    var _path = $.url().attr("path");

    if (_path != null && _path != "") {
        _ret = "";

        //Note: it is -3 because: -1 for first backslash, -1 to ignore the root application name, and
        //      -1 to not go over the root application name
        for (var i = 0; i < Math.max((_path.split("/")).length - 3, 1); i++) {
            _ret += "../";
        }
    }

    return _ret;
}

function util_JS_convertToDate(val, defaultValue) {
    if (!defaultValue) {
        defaultValue = null;
    }

    try {
        if (val == null) {
            val = defaultValue;
        }
        else {
            val = new Date(parseInt(val.substr(6)));
        }        
    } catch (e) {
        val = defaultValue;
    }

    return val;
}

function util_FormatDate(val, defaultValue, isRequireConvertJS) {
    return util_FormatDateTime(val, defaultValue, isRequireConvertJS, false);
}

function util_FormatDateTime(val, defaultValue, isRequireConvertJS, includeTime, options) {

    options = util_extend({ "ForceHourPadding": false, "ForceDayPadding": false, "IsValidateConversion": false }, options);

    var _ret = "";

    includeTime = util_forceBool(includeTime, true);

    isRequireConvertJS = util_forceBool(isRequireConvertJS, false);

    if (options.IsValidateConversion) {
        isRequireConvertJS = (typeof (val) === "string");

        if (isRequireConvertJS && val !== "") {
            if (val.indexOf("/Date(") != 0) {
                val = new Date(val);
                isRequireConvertJS = false;
            }
        }
    }

    if (isRequireConvertJS) {
        val = util_JS_convertToDate(val);
    }

    if (val == null || val == undefined) {
        _ret = defaultValue;
    }
    else {

        try {
            var _formatStr = "";
            var _forceDayPadding = util_forceBool(options["ForceDayPadding"], false);

            if (includeTime) {
                _formatStr += "MMM ";

                if (_forceDayPadding) {
                    _formatStr += "dd";
                }
                else {
                    _formatStr += "d";
                }

                _formatStr += ", yyyy ";

                if (util_forceBool(options["ForceHourPadding"], false)) {
                    _formatStr += "hh";
                }
                else {
                    _formatStr += "h";
                }

                _formatStr += ":mm:ss AP";
            }
            else {
                _formatStr = "MMM " + (_forceDayPadding ? "dd" : "d") + ", yyyy";
            }

            //Note: using custom JS code for the Date format (data-format.js source file)
            _ret = Date.format(val, _formatStr);
        } catch (e) {
            _ret = defaultValue;
        }
        
    }

    return _ret;
}

function util_formatNumber(number, places, thousand, decimal) {
    number = (number || 0);
    places = (!isNaN(places = Math.abs(places)) ? places : 0);
    thousand = (thousand || ",");
    decimal = (decimal || ".");

    var negative = number < 0 ? "-" : "",
	    i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
	    j = (j = i.length) > 3 ? j % 3 : 0;

    return negative + (j ? i.substr(0, j) + thousand : "") +
           i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) +
           (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
}

function util_formatCurrency(number, places, symbol, thousand, decimal) {
    number = (number || 0);
    places = (!isNaN(places = Math.abs(places)) ? places : 2);
    symbol = (symbol !== undefined ? symbol : "$");
    thousand = (thousand || ",");
    decimal = (decimal || ".");

    var negative = number < 0 ? "-" : "",
	    i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
	    j = (j = i.length) > 3 ? j % 3 : 0;

    return symbol + negative + (j ? i.substr(0, j) + thousand : "") +
           i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + 
           (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
}

function util_queryStringFragment(keyQS, contextURL) {
    var _url = null;

    if (util_forceString(contextURL) == "") {

        //check if a view state URL is available and if so use it to retrieve any query related values (otherwise use the active page specific URL)
        var _viewStateURL = MODULE_MANAGER.Navigation.GetCurrentStateQS();

        if (util_isNullOrUndefined(_viewStateURL)) {
            _url = $.url(util_activePageURL());
        }
        else {
            _url = $.url(_viewStateURL);
        }
    }
    else {
        _url = $.url(contextURL);
    }

    var _fragment = util_forceString(_url.attr("fragment"), "");

    if (_fragment.length > 1 && _fragment.indexOf("?") == 0) {
        _fragment = _fragment.substr(1);
    }
    else if (_fragment == "") {
        _fragment = _url.attr("query");
    }

    _url = $.url("?" + _fragment);

    return _url.param(keyQS);
}

function util_queryString(keyQS, contextURL) {
    var _url = null;

    if (contextURL == null || contextURL == undefined) {

        //check if a view state URL is available and if so use it to retrieve any query related values (otherwise use the active page specific URL)
        var _viewStateURL = MODULE_MANAGER.Navigation.GetCurrentStateQS();

        if (util_isNullOrUndefined(_viewStateURL)) {
            _url = $.url(util_activePageURL());
        }
        else {
            _url = $.url(_viewStateURL);
        }
    }
    else {
        _url = $.url(contextURL);
    }

    return _url.param(keyQS);
}

function util_resolveAbsoluteURL(url) {
    return $.mobile.path.makeUrlAbsolute(url);
}

function util_forceValidEnum(value, enumType, defaultValue, forceNumeric) {
    var _ret = defaultValue;

    forceNumeric = util_forceBool(forceNumeric, false);

    if (enumType){
        for (var _name in enumType) {
            if (enumType[_name] == value) {
                _ret = (forceNumeric ? enumType[_name] : value);
                break;
            }
        }
    }

    return _ret;
}

function util_enumNameLookup(value, enumType, defaultValue) {
    var _ret = defaultValue;

    for (var _name in enumType) {
        if (enumType[_name] == value) {
            _ret = _name;
            break;
        }
    }

    return _ret;
}

function util_initDDL(ddl, isIncludeDefault, defaultValue) {
    if (ddl != null) {
        ddl.unbind('change');
        ddl.empty();

        if (isIncludeDefault) {
            if (defaultValue == null || defaultValue == undefined) {
                defaultValue = enCE.None;
            }

            ddl.append($('<option>', { value: defaultValue, text: MSG_DEFAULT_SELECT_ITEM }));
        }
    }
}

function util_dataBindDDL(ddl, listData, textField, valueField, selectedValue, isIncludeDefault, defaultValue, defaultText, hasOptionGroups) {
    var _foundSelectedValue = false;
    var _defaultSelectedValue = null;

    listData = (listData || []);

    if (util_isNullOrUndefined(isIncludeDefault)) {
        isIncludeDefault = true;
    }

    hasOptionGroups = util_forceBool(hasOptionGroups, false);

    ddl = $(ddl);

    ddl.empty();

    if (isIncludeDefault) {
        if (defaultValue == null || defaultValue == undefined) {
            defaultValue = enCE.None;
        }

        var _defaultText = util_forceString(defaultText, MSG_DEFAULT_SELECT_ITEM);

        ddl.append($('<option>', { value: defaultValue, text: _defaultText }));
    }

    var _fnBindOptions = function (arr, objParent) {
        $.each(arr, function (index, item) {
            var _opt = $('<option>', { value: item[valueField], text: item[textField] });

            if (item[valueField] == selectedValue) {
                _opt.attr("selected", "selected");
                _foundSelectedValue = true;
            }

            if (hasOptionGroups) {
                objParent.append(_opt);
            }
            else {
                ddl.append(_opt);
            }
        });
    };

    if (!hasOptionGroups) {
        _fnBindOptions(listData);
    }
    else {
        for (var i = 0; i < listData.length; i++) {
            var _optGroupItem = listData[i];
            var _groupName = util_forceString(_optGroupItem["Name"]);

            var _optGroup = $('<optgroup>');

            _optGroup.attr("label", _groupName);
            _optGroup.attr("data-attr-group-value", util_forceString(_optGroupItem["Value"]));

            var _list = _optGroupItem["Items"];

            if (util_isNullOrUndefined(_list)) {
                _list = [];
            }

            _fnBindOptions(_list, _optGroup);

            ddl.append(_optGroup);
        }
    }

    if (_foundSelectedValue) {
        ddl.val(selectedValue);
    }
    else if (_defaultSelectedValue != null) {
        ddl.val(_defaultSelectedValue);
    }

    try {
        ddl.selectmenu('refresh');
    } catch (e) {
    }
}

function util_getSumElementOffset(obj, arrCSS) {
    var _ret = 0;

    var _element = $(obj);

    for (var i = 0; i < arrCSS.length; i++) {
        _ret += util_forceFloat(util_replaceAll(_element.css(arrCSS[i]), "px", ""), 0);
    }

    return _ret;
}

function util_constructPopupURL(url, dialogMode) {
    url = util_forceString(url);

    dialogMode = util_forceValidEnum(dialogMode, enCDialogMode, enCDialogMode.Normal);

    url = util_appendFragmentQS(url, "PopupMode", dialogMode);

    return url;
}

function util_getModuleFilePath(controlFolder, isRootControlFolder) {
    if (isRootControlFolder == null || isRootControlFolder == undefined) {
        isRootControlFolder = false;
    }

    return "../module/UserControls/" + controlFolder + "/" + (!isRootControlFolder ? "<PROJECT_NO>" + "/" : "");
}

function util_getVersionQS(prefix) {
    prefix = util_forceString(prefix, "");

    return prefix + "v=<APP_VERSION>&pc=<PROJECT_CACHE_VERSION>";
}

function util_getProjectNumber() {
    return "<PROJECT_NO>";
}

function util_strInsert(strSource, positionIndex, strInsert) {
    var _ret = "";

    strSource = util_forceString(strSource);
    strInsert = util_forceString(strInsert);
    positionIndex = util_forceInt(positionIndex, -1);


    if (positionIndex >= 0 && positionIndex < strSource.length) {
        _ret = "";

        if (positionIndex - 1 >= 0) {
            _ret += strSource.substr(0, positionIndex);
        }

        _ret += strInsert;

        _ret += strSource.substr(positionIndex);
    }
    else {
        _ret = strSource;
    }

    return _ret;
}

//append query string item
function util_appendQS(url, keyQS, valueQS, isInsertAtStartQuery, queryDelimiter) {
    url = util_forceString(url, "");

    queryDelimiter = util_forceString(queryDelimiter, "?");

    //check whether there is a query string in the URL and depending on it, append the "&" delimiter or "?" query string indicator
    if (url.indexOf(queryDelimiter) >= 0) {

        //add the "&", if and only if the url does not end with "?" or "&"
        if ((url.lastIndexOf(queryDelimiter) != url.length - 1) && (url.lastIndexOf("&") != url.length - 1)) {
            url += "&";
        }
    }
    else {
        url += queryDelimiter;
    }

    //force default values, if applicable
    keyQS = util_forceString(keyQS);
    valueQS = util_forceString(valueQS);

    //append/insert the query string key and value to the URL
    var _indexQueryIndicator = url.indexOf(queryDelimiter);

    if (!isInsertAtStartQuery || _indexQueryIndicator == url.length - 1) {

        //if the query item is to be appended to the URL or if it ends with the "?" character
        url = url + keyQS + "=" + valueQS;
    }
    else {

        //check if the character following "?" is "&" or "&amp;" delimiter and if not then add a delimiter in preparation for inserting this query item
        if (url.substr(_indexQueryIndicator + 1, 1) != "&" && url.substr(_indexQueryIndicator + 1, 1) != "&amp;") {

            url = util_strInsert(url, _indexQueryIndicator + 1, "&");
        }

        //insert the query item after the "?" query indicator to the URL
        url = util_strInsert(url, _indexQueryIndicator + 1, keyQS + "=" + valueQS);
    }

    return url;
}

//append query string item (with query string delimiter of "#")
function util_appendFragmentQS(url, keyQS, valueQS, isInsertAtStartQuery) {
    return util_appendQS(url, keyQS, valueQS, isInsertAtStartQuery, "#");
}

function util_activePageURL() {
    var _url = null;

    if ($mobileUtil.IsActiveDialogPage()) {

        //if active page is a dialog retrieve the ULR from its data attribute
        _url = $.url($mobileUtil.ActivePage().attr("data-attr-context-href"));
    }
    else {
        _url = $.url();
    }

    return _url.attr("source");
}

function util_constructURL(arrIgnoreKeyQS, url) {
    var _ret = "";

    if (util_isNullOrUndefined(url)) {
        url = util_activePageURL();
    }

    if (util_isNullOrUndefined(arrIgnoreKeyQS)) {
        arrIgnoreKeyQS = [];
    }

    var _url = $.url(url);

    _ret = _url.attr("path");

    var _first = true;
    
    var _fnIgnoreKey = function (key) {
        var _found = false;

        var _search = key.toLowerCase();

        for (var i = 0; i < arrIgnoreKeyQS.length; i++) {
            if (arrIgnoreKeyQS[i].toLowerCase() == _search) {
                _found = true;
                break;
            }
        }

        return _found;
    };

    var _fnAppend = function (sectionSepertor, delimiter, qsKey, qsValue) {
        if (!_first) {
            _ret += delimiter;
        }
        else {
            _ret += sectionSepertor;
            _first = false;
        }

        _ret += qsKey + "=" + qsValue;
    };

    //loop through the query string and append it
    _first = true;

    for (var _keyQS in _url.param()) {
        if (!_fnIgnoreKey(_keyQS)) {
            _fnAppend("?", "&", _keyQS, _url.param(_keyQS));
        }
    }

    //loop through the fragments and append it
    _first = true;

    for (var _fKeyQS in _url.fparam()) {
        if (!_fnIgnoreKey(_fKeyQS)) {
            _fnAppend("#", "&", _fKeyQS, _url.fparam(_fKeyQS));
        }
    }

    return _ret;
}

var m_temp_encoder; //Note: temp element used for the HTML related encode/decode methods (performance related)

function util_htmlEncode(str, toggleNewLineEncode, encodeTextInputNewLine) {
    var _ret = "";

    if (!m_temp_encoder || m_temp_encoder.length == 0) {
        m_temp_encoder = $("<div>");
    }

    toggleNewLineEncode = util_forceBool(toggleNewLineEncode, false);
    encodeTextInputNewLine = util_forceBool(encodeTextInputNewLine, false);

    str = util_forceString(str, "");

    m_temp_encoder.text(str);

    _ret = m_temp_encoder.html();

    if (toggleNewLineEncode) {
        _ret = util_replaceAll(_ret, "\n", "<br />");
    }
    else if (encodeTextInputNewLine) {
        if ($browserUtil.IsIE8) {
            _ret = util_replaceAll(_ret, "\n\r", "\n");
            _ret = util_replaceAll(_ret, "\n", "\n\r");
        }
        else {
            _ret = util_replaceAll(_ret, "\n\r", "\n");
        }
    }

    return _ret;
}

function util_htmlDecode(str) {
    if (!m_temp_encoder || m_temp_encoder.length == 0) {
        m_temp_encoder = $("<div>");
    }

    m_temp_encoder.html(str);

    return m_temp_encoder.text();
}

function util_configureKeyPress(obj, validKeyCode, fn, isUseKeyDown) {
    var _element = $(obj);

    isUseKeyDown = util_forceBool(isUseKeyDown, false);

    var _fnEvent = function (e) {
        var _keycode = null;

        if (e == null) { // IE
            _keycode = event.keyCode;
        } else { // Mozilla
            _keycode = e.which;
        }

        if (_keycode == validKeyCode) {
            if (fn) {
                fn(this);
            }
        }
    };

    if (isUseKeyDown) {
        _element.unbind("keydown");
        _element.keydown(_fnEvent);
    }
    else {
        _element.unbind("keypress");
        _element.keypress(_fnEvent);
    }
}

function util_reflectionPropertyList(item, arrExcludePropList, isOrdered) {
    var _ret = [];

    isOrdered = util_forceBool(isOrdered, false);

    if (util_isNullOrUndefined(arrExcludePropList)) {
        arrExcludePropList = [];
    }

    item = util_forceObject(item);

    for (var _property in item) {
        var _found = false;

        for (var j = 0; j < arrExcludePropList.length; j++) {
            if (_property == arrExcludePropList[j]) {
                _found = true;
                break;
            }
        }

        if (!_found) {
            _ret.push(_property);
        }
    }

    if (isOrdered) {
        _ret.sort();
    }

    return _ret;
}

function util_jsEncode(str) {
    str = util_forceString(str);

    str = util_replaceAll(str, "\"", "&quot;");
    str = util_replaceAll(str, "\'", "&#39;");

    //replace new line characters with a space
    str = util_replaceAll(str, "\n", " ");

    return str;
}

function util_forceValidPageNum(val, defaultVal, minPage, maxPage) {
    var _ret = null;

    val = util_forceInt(val, defaultVal);

    if (util_isNullOrUndefined(minPage)) {
        minPage = 1;
    }

    if (minPage && maxPage && val >= minPage && val <= maxPage) {
        _ret = val;
    }
    else if (minPage && val >= minPage) {
        _ret = val;
    }
    else if (maxPage && val <= maxPage) {
        _ret = val;
    }
    else {
        _ret = defaultVal;
    }

    return _ret;
}

function util_maxListPage(entityList, pageSize) {
    var _ret = 1;
    pageSize = util_forceInt(pageSize, PAGE_SIZE);

    if (entityList) {
        var _numItems = util_forceInt(entityList.NumItems, 0);

        if (_numItems > 0 && pageSize > 0) {
            _ret = Math.ceil(_numItems / (pageSize * 1.00));
        }
    }

    return _ret;
}

function util_arrPush(source, dest) {
    if (dest == null || dest == undefined) {
        dest = [];
    }

    if (source && source.length > 0) {
        for (var i = 0; i < source.length; i++) {
            dest.push(source[i]);
        }
    }

    return dest;
}

function util_jsBindEvent(obj, eventName, fn) {
    var _obj = $(obj);

    _obj.unbind(eventName);
    _obj[eventName](fn);
}

function util_getDefaultModuleURL() {
    return util_resolveAbsoluteURL("../modules/module.html");
}

function util_constructModuleURL(moduleID, moduleViewType, ctrlName) {
    var _ret = util_getDefaultModuleURL();

    _ret = util_appendFragmentQS(_ret, "ModuleID", util_forceInt(moduleID));

    if (!util_isNullOrUndefined(moduleViewType)) {
        _ret = util_appendFragmentQS(_ret, "ModuleViewType", util_forceInt(moduleViewType));
    }

    ctrlName = util_forceString(ctrlName, "");

    if (ctrlName != "") {
        _ret = util_appendFragmentQS(_ret, "CTRL", ctrlName);
    }

    return _ret;
}

//deprecated: use "util_constructDownloadURL" instead
function util_constructFileDownloadURL(filePath, exportFileName, forceProjectRelative, disableCache, downloadTypeID) {
    var _ret = util_resolveAbsoluteURL("../home/file.aspx");

    filePath = util_forceString(filePath, "");
    exportFileName = util_forceString(exportFileName, "");
    forceProjectRelative = util_forceBool(forceProjectRelative, false);
    disableCache = util_forceBool(disableCache, false);
    downloadTypeID = util_forceString(downloadTypeID, "");

    _ret = util_appendQS(_ret, "Path", util_escape(filePath, true));
    _ret = util_appendQS(_ret, "ExportFileName", util_escape(exportFileName, true));
    _ret = util_appendQS(_ret, "IsForceProjectRelative", (forceProjectRelative ? enCETriState.Yes : enCETriState.No));

    if (downloadTypeID != "") {
        _ret = util_appendQS(_ret, "DownloadTypeID", downloadTypeID);
    }

    if (disableCache) {

        //cache is to be disabled, so append a unique query string value to the URL using the ticks of current date time)
        _ret = util_appendQS(_ret, "NoCache", (new Date().getTime()));
    }

    return _ret;
}

function util_constructDownloadURL(options) {

    options = util_extend({ "TypeID": null, "NoCache": false, "FilePath": null, "DisplayName": null, "IsProjectRelative": null, "ExtraQS": null }, options);

    var _ret = "<SITE_URL>home/file.aspx";

    var _arr = [{ "key": "Path", "req": true, "v": options.FilePath, "encode": true }, { "key": "ExportFileName", "req": true, "v": options.ExportFileName, "encode": true },
                { "key": "DownloadTypeID", "req": true, "v": options.TypeID }];

    if (!util_isNullOrUndefined(options.IsProjectRelative)) {
        options.IsProjectRelative = util_forceBool(options.IsProjectRelative, false);

        _arr.push({ "key": "IsForceProjectRelative", "v": (options.IsProjectRelative ? enCETriState.Yes : enCETriState.No) });
    }

    if (options.NoCache) {

        //cache is to be disabled, so append a unique query string value to the URL using the ticks of current date time)
        _arr.push({ "key": "NoCache", "v": (new Date().getTime()) });
    }

    for (var i = 0; i < _arr.length; i++) {
        var _item = _arr[i];
        var _val = util_forceString(_item.v, "");

        if (!_item["req"] || (_item["req"] && _val != "")) {
            _val = (_item["encode"] ? util_escape(_val, true) : _val);
            _ret = util_appendQS(_ret, _item.key, _val);
        }
    }

    if (options.ExtraQS) {
        if (typeof options.ExtraQS === "string") {

            //string support
            options.ExtraQS = util_forceString(options.ExtraQS);

            if (options.ExtraQS.indexOf("&") != 0) {
                options.ExtraQS = "&" + options.ExtraQS;
            }

            _ret += options.ExtraQS;
        }
        else {

            //key-value query string items support
            for (var _key in options.ExtraQS) {
                _ret = util_appendQS(_ret, _key, options.ExtraQS[_key]);
            }
        }
    }

    return _ret;
}

function util_constructTemplateModuleURL(moduleViewType, params, options) {
    options = util_extend({ "SourceModuleID": null }, options);

    if (!options["SourceModuleID"]) {
        options["SourceModuleID"] = MODULE_MANAGER.Current.ModuleID;
    }

    var _ret = util_constructModuleURL(enCEModule.GlobalDynamicTemplate, moduleViewType);

    _ret = util_appendFragmentQS(_ret, "TemplateSourceModuleID", options.SourceModuleID);
    _ret = util_appendFragmentQS(_ret, "TemplateParams", util_forceString(params, ""));

    return _ret;
}

function util_constructContentEditorPageURL(options) {
    options = util_extend({ "ControllerName": "", "ViewMode": "", "ID": "", "QueryString": "" }, options);

    var _ret = "<CONTENT_EDITOR_SITE_URL>";

    if (_ret == "") {

        //the content editor site URL is not configured and as such cannot construct valid page URL (returning null to invalidate invalid request)
        _ret = null;
    }
    else {
        var _arrProp = ["ControllerName", "ViewMode", "ID"];

        for (var p = 0; p < _arrProp.length; p++) {
            var _prop = _arrProp[p];
            var _val = options[_prop];

            if (util_forceString(_val) != "") {
                _ret += _val + "/";
            }
        }

        _ret += util_forceString(options["QueryString"]);
    }

    return _ret;
}

function util_htmlAttribute(attributeName, value, quote, isEncodeJS) {
    var _ret = "";

    attributeName = util_forceString(attributeName, "");
    value = util_forceString(value, "");
    quote = util_forceString(quote, "\"");
    isEncodeJS = util_forceBool(isEncodeJS, false);

    value = (isEncodeJS ? util_jsEncode(value) : value);

    if (quote == ""){
        quote = "\"";
    }

    if (attributeName != "") {
        _ret = attributeName + "=" + quote + value + quote;
    }

    return _ret;
}

function util_renderAttribute(renderTypeName, quote) {
    return util_htmlAttribute(DATA_ATTRIBUTE_RENDER, renderTypeName, quote);
}

function util_escape(str, isEncodeURL) {
    var _ret = "";

    isEncodeURL = util_forceBool(isEncodeURL, false);

    _ret = escape(util_forceString(str, ""));

    if (isEncodeURL) {
        _ret = util_replaceAll(_ret, " ", "%20");
    }

    return _ret;
}

function util_arrJoinStr(arr, property, delimiter, defaultValue) {
    var _ret = "";

    if (!util_isNullOrUndefined(arr) && arr.length > 0) {
        delimiter = util_forceString(delimiter);
        property = util_forceString(property);

        var _hasProperty = (property != "");

        for (var i = 0; i < arr.length; i++) {
            var _item = arr[i];

            _ret += (i != 0 ? delimiter : "") + util_forceString(_hasProperty ? _item[property] : _item);
        }
    }
    else {
        _ret = util_forceString(defaultValue);
    }

    return _ret;
}

function util_arrContains(arr, property, searchValue) {
    var _ret = false;

    if (!util_isNullOrUndefined(arr) && arr.length > 0) {
        property = util_forceString(property);

        var _hasProperty = (property != "");

        for (var i = 0; i < arr.length; i++) {
            var _item = arr[i];

            if (_hasProperty && _item[property] == searchValue) {
                _ret = true;
                break;
            }
            else if (!_hasProperty && _item == searchValue) {
                _ret = true;
                break;
            }
        }
    }

    return _ret;
}

function util_arrContainSubset(arr, fnValidateItem) {
    var _ret = false;
    
    if (fnValidateItem && arr && arr.length > 0) {
        for (var i = 0; i < arr.length; i++) {
            if (fnValidateItem(arr[i])) {
                _ret = true;
                break;
            }
        }
    }

    return _ret;
}

function util_arrFilter(arr, property, filterValue, isFirstMatch) {
    var _ret = [];

    isFirstMatch = util_forceBool(isFirstMatch, false);

    if (!util_isNullOrUndefined(arr) && arr.length > 0) {
        property = util_forceString(property);

        var _hasProperty = (property != "");

        var _found = false;

        for (var i = 0; i < arr.length; i++) {
            var _item = arr[i];

            if (_hasProperty && _item[property] == filterValue) {
                _ret.push(_item);
                _found = true;
            }
            else if (!_hasProperty && _item == filterValue) {
                _ret.push(_item);
                _found = true;
            }

            if (isFirstMatch && _found) {
                break;
            }
        }
    }

    return _ret;
}

function util_arrFilterSubset(arr, fnValidateItem, isFirstMatch) {
    var _ret = [];

    isFirstMatch = util_forceBool(isFirstMatch, false);

    if (fnValidateItem && arr && arr.length > 0) {
        for (var i = 0; i < arr.length; i++) {
            if (fnValidateItem(arr[i])) {
                _ret.push(arr[i]);

                if (isFirstMatch) {
                    break;
                }
            }
        }
    }

    return _ret;
}

function util_arrFilterItemIndex(arr, fnSearchItem) {
    var _ret = -1;

    if (fnSearchItem && arr && arr.length > 0) {
        for (var i = 0; i < arr.length; i++) {
            if (fnSearchItem(arr[i])) {
                _ret = i;
                break;
            }
        }
    }

    return _ret;
}

function util_pluck(arr, prop, returnValid) {
    var _ret = [];
    if (util_isNotNullOrUndefined(prop) && util_isNotNullOrUndefined(arr) && arr.length > 0){
        for (var i = 0; i < arr.length; i++) {
            var _item = arr[i];
            if (returnValid) {
                util_isNotNullOrUndefined(_item[prop]) && _ret.push(_item[prop]);
            } else {
                _ret.push(_item[prop]);
            }
        }
    }
    return _ret;
}

function util_numericSortBy(arr, prop, descend, ignoreNull){
    var _ret = [];
    var _sortedArr = [];
    var _nullList = [];
    var _isDescend = util_forceBool(descend, false);
    var _ignoreNull = util_forceBool(ignoreNull, false);
    
    if (util_isNotNullOrUndefined(arr) && arr.length > 0){
        var _fnCompare = function (a, b) {
            var _a = (util_isNullOrUndefined(prop)) ? a : a[prop];
            var _b = (util_isNullOrUndefined(prop)) ? b : b[prop];

           _val = _a - _b;

            return _val;
        };
        
        _sortedArr = arr;
        _sortedArr.sort(_fnCompare);

        for (var i = 0; i < _sortedArr.length; i++) {
            var _item = _sortedArr[i];
            var _val = (util_isNullOrUndefined(prop)) ? _item : _item[prop];
            
            if (util_isNullOrUndefined(_val)) {
                _nullList.push(_item);
            } else {
                _ret.push(_item);
            }
        }

        if (_nullList.length > 0 && !_ignoreNull) {
            for (var i = 0; i < _nullList.length; i++) {
                var _nullItem = _nullList[i];

                _ret.push(_nullItem);
            }
        }

        _isDescend && _ret.reverse();

    } 
    return _ret;
}

function util_stringify(val) {
    return JSON.stringify(val);
}

function util_parse(strJSON) {
    return JSON.parse(strJSON);
}

function util_cloneObject(source, dest) {
    if (util_isNullOrUndefined(dest)) {
        dest = {};
    }

    if (!util_isNullOrUndefined(source)) {
        for (var _prop in source) {
            dest[_prop] = source[_prop];
        }
    }

    return dest;
}

function util_extend(target, extraObj, isOverwrite, isDeepCopy) {
    var _ret = null;

    isOverwrite = util_forceBool(isOverwrite, false);
    isDeepCopy = util_forceBool(isDeepCopy, false);

    if (extraObj == undefined || extraObj == null) {
        _ret = (isOverwrite ? target : $.extend({}, target));
    }
    else if (isDeepCopy) {

        if (isOverwrite) {
            _ret = $.extend(true, target, extraObj);
        }
        else {
            _ret = $.extend(true, {}, target, extraObj);
        }
    }
    else {

        //Note: this ELSE block is important as passing false as first argument of $.extend is not supported
        if (isOverwrite) {
            _ret = $.extend(target, extraObj);
        }
        else {
            _ret = $.extend({}, target, extraObj);
        }
    }

    return _ret;
}

function util_propertyValue(item, prop, options) {
    var _ret = undefined;

    if (prop && prop.indexOf(".") > 0) {
        var _arr = prop.split(".");

        var _current = item;

        for (var i = 0; i < _arr.length && (_current !== null && _current !== undefined) ; i++) {

            var _extProp = _arr[i];

            _current = _current[_extProp];
        }

        _ret = _current;
    }
    else {
        _ret = item[prop];
    }

    return _ret;
}

function util_propertySetValue(item, prop, value, options) {

    if (prop && prop.indexOf(".") > 0) {
        var _arr = prop.split(".");

        var _current = item;

        for (var i = 0; i < _arr.length - 1 && (_current !== null && _current !== undefined) ; i++) {

            var _extProp = _arr[i];

            _current = _current[_extProp];
        }

        var _itemProp = _arr[_arr.length - 1];  //get the last property (member property for the parent item)

        _current[_itemProp] = value;
    }
    else {
        item[prop] = value;
    }
}

function util_isOnline(callback, forceNavigatorMode, options) {

    forceNavigatorMode = util_forceBool(forceNavigatorMode, false);
    options = util_extend({"DisableCacheResult": false, "IntervalDuration": 30 * 1000 }, options);

    var _callback = function (isOnline, addCache) {

        GlobalService.DisableCallBackRequest = false;

        if (addCache) {
            GlobalService.m_data["IsApplicationOnline"] = { "Value": isOnline, "CreatedOn": (new Date().getTime()) };
        }
        else if (GlobalService.m_data["IsApplicationOnline"]) {
            var _item = GlobalService.m_data["IsApplicationOnline"];

            var _now = (new Date()).getTime();
            var _createdOn = util_forceInt(_item["CreatedOn"], 0);
            var _interval = util_forceInt(options["IntervalDuration"], 0);

            if (_now - _createdOn >= _interval) {
                GlobalService.m_data["IsApplicationOnline"] = null;   //clear the cached results
            }
        }

        if (callback) {
            callback(isOnline);
        }
    };

    var _isOnline = DEBUG_OFFLINE_MODE ? false : (navigator ? navigator.onLine : true);
    
    if (!forceNavigatorMode && BROWSER_ONLINE_STATE_VALIDATION_MODE_IS_CALLBACK) {

        //Note: requires that the GlobalService has been initialized

        var _disableCache = util_forceBool(options["DisableCacheResult"], false);

        if (!_disableCache && GlobalService["m_data"] && util_isNotNullOrUndefined(GlobalService.m_data["IsApplicationOnline"])) {
            var _data = GlobalService.m_data["IsApplicationOnline"];

            _callback(_data["Value"]);
        }
        else {

            GlobalService.DisableCallBackRequest = true;

            GlobalService.IsApplicationOnline(function (data) {

                //regardless of the result, the service call has successfully executed, so the application is online
                _callback(true);

            }, function () {

                //all errors are categorized as the application is offline
                _callback(false, true);
            });
        }
    }
    else {
        _callback(_isOnline);
    }

    //Note: the return statement is for backward compatiblity when the browser online state validation does not use the callback approach and requires a return value synchronously
    return _isOnline;   //deprecated and should only be used if the the browser's navigator.onLine is required
}

function util_execCallbackState(fnConnected, fnOffline) {

    util_isOnline(function (isOnline) {

        if (isOnline) {
            if (fnConnected) {
                fnConnected();
            }
        }
        else {
            if (fnOffline) {
                fnOffline();
            }
        }

    });
}

function util_execOnlineFeature(fnConnected, fnOffline) {
    var _fnNoAccess = function () {
        util_alert(MSG_CONFIG.OfflineFeatureNoAccess, null, function () {
            if (fnOffline) {
                fnOffline();
            }
        });
    };

    util_execCallbackState(fnConnected, _fnNoAccess);
}

var m_chartCache = [];

function util_chartGetSVG(chartContainer, chartInstance, options) {

    options = util_extend({ "Callback": null, "IsConvertDataURL": null, "IsExportMode": false }, options);

    var _ret = null;
    var _chartIndex = util_forceInt($(chartContainer).parent().attr("data-attr-chart-cache-index"), -1);
    var _chart = null;

    if (_chartIndex >= 0 || !util_isNullOrUndefined(chartInstance)) {

        if (_chartIndex >= 0) {
            _chart = m_chartCache[_chartIndex];
        }
        else {
            _chart = chartInstance;
        }

        var _hasEvents = (_chart.options && _chart.options.chart && _chart.options.chart.events);
        var _temp = (_hasEvents ? _chart.options.chart.events : null);  //store the chart events configuration
        var _tooltip = (_chart.options ? _chart.options["tooltip"] : null); //store the chart tooltip

        //if the chart's configuration contains events, then must temporarily disable it prior to calling the getSVG()
        //Note: this is to avoid the chart executing events when generating the SVG
        if (_hasEvents) {
            _chart.options.chart.events = null;
        }

        //disable tooltips for export
        _chart.options["tooltip"] = { enabled: false };

        _ret = _chart.getSVG();

        //restore the events configuration for the chart and other settings, if applicable
        if (_hasEvents) {
            _chart.options.chart.events = _temp;
        }

        //restore the tooltip setting
        _chart.options.tooltip = _tooltip;
    }

    if (options.Callback) {
        var _detail = { "SVG": _ret, "DataURL": null };

        if (options.IsExportMode && util_isNullOrUndefined(options.IsConvertDataURL)) {

            //fallback for IE to use data URL format for export mode
            options.IsConvertDataURL = $browserUtil.IsIE;
        }

        if (options.IsConvertDataURL) {

            if (!util_isDefined("canvg")) {
                throw "util_chartGetSVG :: canvg library is not defined";
            }

            var _canvas = document.createElement("canvas");

            _canvas.width = _chart.chartWidth;
            _canvas.height = _chart.chartHeight;

            canvg(_canvas, _detail.SVG, { "scaleWidth": _chart.chartWidth, "scaleHeight": _chart.chartHeight, "ignoreDimensions": true });

            _detail.DataURL = _canvas.toDataURL("image/png");
        }

        if (options.IsExportMode) {

            _detail["FieldValue"] = (options.IsConvertDataURL ? _detail.DataURL : _detail.SVG);

            delete _detail.SVG;
            delete _detail.DataURL;
        }

        options.Callback(_detail);
    }
    
    return _ret;
}

function util_getElementSVG(obj) {
    var _ret = "";
    var _element = $(obj);

    try {
        var _svgElement = _element[0];
        var _serializer = new XMLSerializer();

        _ret = _serializer.serializeToString(_svgElement);
    } catch (e) {
        var _width = $(window).width();
        var _height = $(window).height();

        _ret = '<svg xmlns="http://www.w3.org/2000/svg" width="' + _width + '" height="' + _height + '">' + _element.html() + '</svg>';
    }

    return _ret;
}

/***************************************************************************************************************************************************/
/******************************************* SECTION START: Custom Alert & Confirm *****************************************************************/
/***************************************************************************************************************************************************/
function util_alert(str, title, callbackClose, isHTML, delayExecution, extOptions) {
    var _ret = null;

    var _options = {
        type: "information",
        layout: "center",
        text: "",
        dismissQueue: true,
        modal: true,
        closeWith: ["click", "button"],
        callback: { onClose: function () {
            if (callbackClose) {
                callbackClose();
            }
        }
        },
        buttons: [{ addClass: "btn btn-inverse", text: "OK", onClick: function ($noty) {
            $noty.close();
        }
        }]
    };

    str = util_forceString(str);
    title = util_forceString(title, "ALERT");

    delayExecution = util_forceInt(delayExecution, -1);

    var _fn = function () {

        switch ($mobileUtil.Configuration.Notification.Type) {

            case enCNotificationComponentType.Default:

                isHTML = util_forceBool(isHTML, true);

                str = (isHTML ? str : util_htmlEncode(str));
                title = (isHTML ? title : util_htmlEncode(title));

                _options.text = title;

                _ret = noty(_options);
                $(_ret.$buttons).prepend("<div class='NotificationAlertContent'>" + str + "</div>");

                break;

            case enCNotificationComponentType.Inline:

                var _opts = util_extend({ "Type": "alert", "Title": title, "Message": str, "IsHTML": isHTML, "Buttons": null, "OnButtonClick": callbackClose }, extOptions);

                $mobileUtil.NotificationManager.OnShow(_opts);
                break;

        }        
    };

    if (delayExecution >= 0) {
        setTimeout(_fn, delayExecution);
    }
    else {
        _fn();
    }

    return _ret;
}

function util_confirm(str, title, isHTML, arrButtons, callbackButtonClick, viewType, isClearAll, extOptions) {
    var _ret = null;

    var _options = {
        type: "warning",
        layout: "center",
        text: "",
        dismissQueue: true,
        modal: true,
        closeWith: ["button"],
        buttons: []
    };

    var _defaultBtnCssClass = "btn-inverse";
    var _notificationType = $mobileUtil.Configuration.Notification.Type;

    var _fnAddButton = function (btnID, btnText, btnCssClass) {
        var _btn = {
            addClass: "btn", text: "", onClick: function ($instance) {

                switch (_notificationType) {

                    case enCNotificationComponentType.Default:

                        $instance.close();
                        break;
                }

                if (callbackButtonClick) {
                    callbackButtonClick(btnID);
                }
            }
        };

        _btn.text = util_htmlEncode(util_forceString(btnText));

        if (util_forceString(btnCssClass) != "" || btnCssClass == undefined) {
            if (btnCssClass == undefined) {
                btnCssClass = _defaultBtnCssClass;
            }

            _btn.addClass += " " + btnCssClass;
        }

        _options.buttons.push(_btn);
    };

    isClearAll = util_forceBool(isClearAll, false);
    str = util_forceString(str);
    title = util_forceString(title, "CONFIRM");

    if (arrButtons == null || arrButtons == undefined || arrButtons.length == 0) {
        arrButtons = [{ ID: NOTIFICATION_BUTTON_CONFIG.OK.ID, Text: NOTIFICATION_BUTTON_CONFIG.OK.Text, CssClass: "btn-inverse" },
                      { ID: NOTIFICATION_BUTTON_CONFIG.Cancel.ID, Text: NOTIFICATION_BUTTON_CONFIG.Cancel.Text, CssClass: "btn-inverse"}];
    }

    for (var i = 0; i < arrButtons.length; i++) {
        var _btn = arrButtons[i];
        _fnAddButton(_btn.ID, _btn.Text, util_forceString(_btn.CssClass, "btn-inverse"));
    }

    if (isClearAll) {
        _options["killer"] = true;
    }

    switch (_notificationType) {

        case enCNotificationComponentType.Default:

            isHTML = util_forceBool(isHTML, true);

            str = (isHTML ? str : util_htmlEncode(str));
            title = (isHTML ? title : util_htmlEncode(title));

            _options.text = title;

            _ret = noty(_options);
            $(_ret.$buttons).prepend("<div class='NotificationConfirmContent'>" + str + "</div>");
            break;
            
        case enCNotificationComponentType.Inline:
            
            var _opts = util_extend({
                "Type": "confirm", "Title": title, "Message": str, "IsHTML": isHTML, "Buttons": arrButtons, "OnButtonClick": callbackButtonClick,
                "CssClass": ""
            }, extOptions);

            $mobileUtil.NotificationManager.OnShow(_opts);

            break;
    }

    return _ret;
}

function util_warning(msg, isHTML, afterShowCloseDuration) {
    var _ret = null;
    var _options = { layout: "top", type: "warning", text: "", callback: {
        afterShow: null
    }
    };

    msg = util_forceString(msg, "");
    isHTML = util_forceBool(isHTML, false);
    afterShowCloseDuration = util_forceInt(afterShowCloseDuration, 0);

    msg = (isHTML ? msg : util_htmlEncode(msg));

    _options.text = msg;

    _options.callback.afterShow = function () {
        if (afterShowCloseDuration > 0) {
            var _instance = this;

            setTimeout(function () {
                _instance.close();  //close the current instance of the notification after a delay
            }, afterShowCloseDuration);
        }
    };

    _ret = noty(_options);

    return _ret;
}

function util_inlineConfirm(options) {

    options = util_extend({
        "IsVisible": true, "Target": null, "Message": "Confirm:", "IsMessageHTML": false, "PositiveButtonText": "YES", "NegativeButtonText": "NO",
        "Callback": null, "OnPositiveClick": null, "OnNegativeClick": null, "IsAnimate": true
    }, options);

    var $target = $(options.Target);

    if ($target.length == 0) {
        util_logError("util_inlineConfirm :: missing required parameter - target element");
        return;
    }

    if (options.IsVisible) {
        var $confirm = $target.next(".InlineConfirmation");

        if ($confirm.length == 0) {
            var _html = "<div class='DisableUserSelectable InlineConfirmation'>" +
                        "   <div class='InlineConfirmMessage' />" +
                        "   <div class='InlineConfirmButton PositiveActionButton'>" +
                        "       <a data-role='button' data-inline='true' data-icon='check' data-iconpos='notext' data-theme='transparent' />" +
                        "       <span class='LabelButtonContent' />" +
                        "   </div>" +
                        "   <div class='InlineConfirmButton NegativeActionButton'>" +
                        "       <a data-role='button' data-inline='true' data-icon='delete' data-iconpos='notext' data-theme='transparent' />" +
                        "       <span class='LabelButtonContent' />" +
                        "   </div>" +
                        "</div>";

            $confirm = $(_html);

            $confirm.hide();
            $confirm.insertAfter($target);

            $confirm.trigger("create");

            $confirm.off("click.dismiss");
            $confirm.on("click.dismiss", ".InlineConfirmButton", function (e, args) {

                args = util_extend({ "IsAnimate": true }, args);

                var $btn = $(this);
                var _isPositive = $btn.hasClass("PositiveActionButton");

                util_inlineConfirm({
                    "Target": $target, "IsVisible": false, "IsAnimate": args.IsAnimate, "Callback": function () {
                        if (_isPositive && options.OnPositiveClick) {
                            options.OnPositiveClick();
                        }
                        else if (!_isPositive && options.OnNegativeClick) {
                            options.OnNegativeClick();
                        }
                    }
                });
            });
        }

        $confirm.find(".InlineConfirmMessage")
                .html(options.IsMessageHTML ? options.Message : util_htmlEncode(options.Message));

        $confirm.find(".PositiveActionButton .LabelButtonContent")
                .text(options.PositiveButtonText);

        $confirm.find(".NegativeActionButton .LabelButtonContent")
                .text(options.NegativeButtonText);

        $target.slideUp("normal", function () {
            $confirm.slideDown("normal");

            if (options.Callback) {
                options.Callback();
            }
        });
    }
    else {
        var $confirm = $target.next(".InlineConfirmation");

        if (options.IsAnimate) {

            $confirm.slideUp("normal", function () {

                $confirm.remove();
                $target.slideDown("normal").promise().done(function () {

                    if (options.Callback) {
                        options.Callback();
                    }
                });
            });
        }
        else {
            $confirm.remove();
            $target.show();

            if (options.Callback) {
                options.Callback();
            }
        }
        
    }

}

function util_notificationAlertClear() {
    $.noty.closeAll();
}

var m_perfTimer = { Start: 0, End: 0 };

function util_stopwatchStart() {
    m_perfTimer = { Start: (new Date().getTime()), End: 0 };
}

function util_stopwatchStop() {
    m_perfTimer.End = (new Date().getTime());
    util_log("Performance timer duration: " + (util_forceInt(m_perfTimer.End) - util_forceInt(m_perfTimer.Start)) + " ms");
}

/***************************************************************************************************************************************************/
/******************************************* SECTION END: Custom Alert & Confirm *******************************************************************/
/***************************************************************************************************************************************************/