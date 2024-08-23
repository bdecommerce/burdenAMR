var MODEL_MANAGER = {
    ToggleCache: true,  //whether to toggle caching of model values
    IsInit: false,  //whether the model has been initialized
    Configuration: {
        Charts: {
            "MinWidth": 500,
            "MinHeight": 500
        },
        Validation: {
            "DefaultMessage": "Specified value is invalid. Please try again.",
            "DefaultTitle": "Input Validation",
            "ValidNumber": "Valid number is required",
            "ValidCurrency": "Valid currency value is required.",
            "ValidPercentage": "Valid percentage is required."
        },
        Confirmation : {
            "ConfirmMessage": "The defaults have been restored.",
            "ConfirmTitle": "Restore Defaults",
            "ConfirmReset": "Are you sure you want to restore default values?"
        },
        Formatter: {
            "CurrencyDecimalPlaces": 2
        }
    },
    Cache: {},
    GetCacheWorksheetKey: function (wsName) {
        var _ret = wsName;

        _ret = util_replaceAll(wsName, " ", "");

        return _ret;
    },
    GetCacheCellKey: function (rowNo, colNo) {
        var _ret = "R" + rowNo + "C" + colNo;

        return _ret;
    },
    RemoveCacheWorksheet: function (wsName) {
        var _cacheKeyWS = MODEL_MANAGER.GetCacheWorksheetKey(wsName);

        _ws[_cacheKeyWS] = null;
    },
    RemoveCacheCellValue: function (wsName, rowNo, colNo) {
        var _cacheWS = MODEL_MANAGER.GetCacheWorksheet(wsName);
        var _cacheKeyCell = MODEL_MANAGER.GetCacheCellKey(rowNo, colNo);

        _cacheWS[_cacheKeyCell] = null;
    },
    GetCacheWorksheet: function (wsName) {
        var _cacheKeyWS = MODEL_MANAGER.GetCacheWorksheetKey(wsName);
        var _ret = null;

        var _wsLookup = MODEL_MANAGER.Cache["worksheets"];

        if (util_isNullOrUndefined(_wsLookup)) {
            _wsLookup = {};
            MODEL_MANAGER.Cache["worksheets"] = _wsLookup;
        }

        _ret = _wsLookup[_cacheKeyWS];

        if (util_isNullOrUndefined(_ret)) {
            _ret = {};
            _wsLookup[_cacheKeyWS] = _ret;
        }

        return _ret;
    },
    GetCacheCellValue: function (wsName, rowNo, colNo) {
        var _ret = null;
        var _cacheWS = MODEL_MANAGER.GetCacheWorksheet(wsName);
        var _cacheKeyCell = MODEL_MANAGER.GetCacheCellKey(rowNo, colNo);

        _ret = _cacheWS[_cacheKeyCell];

        return _ret;
    },
    SetCacheCellValue: function (wsName, rowNo, colNo, val) {
        var _cacheWS = MODEL_MANAGER.GetCacheWorksheet(wsName);
        var _cacheKeyCell = MODEL_MANAGER.GetCacheCellKey(rowNo, colNo);

        if (MODEL_MANAGER.ToggleCache) {
            _cacheWS[_cacheKeyCell] = val;
        }
    },
    ClearCache: function () {
        MODEL_MANAGER.Cache = {};
        MODEL_MANAGER.References = {};
    },
    References: {},
    InitializeModel: function (callback, isForceInit) {
        var _callback = function () {
            if (callback) {
                callback();
            }
        };

        isForceInit = util_forceBool(isForceInit, true);

        if (MODEL_MANAGER.IsInit && !isForceInit) {
            _callback();
        }
        else {
            MODEL_MANAGER.ClearCache();
            MODEL_MANAGER.IsInit = true;

            model_loadReferences(null, _callback);
        }
    }
};

//refreshes all model specific renderers on the screen (by default does not reload the references prior to screen update)
function model_updateScreen(forceReferenceUpdate, callback, options) {

    options = util_extend({ "ToggleContainerRendererInit": false }, options);

    var _fnUpdateScreen = function () {
        var _lookup = RENDERER_LOOKUP;
        var _modelRenderers = {};

        forceReferenceUpdate = util_forceBool(forceReferenceUpdate, false);

        for (var _key in _lookup) {
            if (_key.indexOf("model_") == 0) {
                _modelRenderers[_key] = _lookup[_key];
            }
        }

        var _list = $mobileUtil.Find("[" + DATA_ATTRIBUTE_RENDER + "^='model_']");  //find all renderers that are related to the "model" type

        if (util_isDefined("private_modelOnPreUpdateScreen")) {
            private_modelOnPreUpdateScreen();
        }

        //loop through the model specific renderers and force update
        for (var _key in _modelRenderers) {
            var _fn = _modelRenderers[_key];

            _fn(null, null, _list);
        }

        var _toggleContainerRendererInit = util_forceBool(options["ToggleContainerRendererInit"], false);

        $mobileUtil.refresh(_list, null, _toggleContainerRendererInit != true);

        //if the container renderer init is disabled, need to find all jQuery Mobile elements applicable to enhancement for the model related renderers
        //Note: this method of disabling the container renderer init and enhancing only the required descendents of the containing elements is better performance wise 
        //      [compared to 'container.trigger("create");' approach]
        if (!_toggleContainerRendererInit) {

            var _enchanceList = _list.find("input[type='text']");

            _enchanceList.filter("input[type='text']").textinput();
        }

        if (callback) {
            callback();
        }

        if (util_isDefined("private_modelOnUpdateScreen")) {
            private_modelOnUpdateScreen();
        }
    };

    if (forceReferenceUpdate) {
        model_loadReferences(null, function () {
            _fnUpdateScreen();
        });
    }
    else {
        _fnUpdateScreen();
    }
}

//clears the model local cache
function model_clearCache() {
    MODEL_MANAGER.ClearCache();
}

//get the value for the reference name and index provided (requires model to have been initialized)
//use "isFormatted" to return either the formatted string for the reference value or the raw primitive value
function model_getValue(refName, refIndex, isFormatted) {
    isFormatted = util_forceBool(isFormatted, false);

    var _ret = null;
    var _value = null;

    //Note: although using callback, this method is synchronous in nature due to the requirement of using the reference lookup cache (requires init of model)
    model_getReferenceCellValue(null, refName, refIndex, function (val) {
        _ret = val;
    }, isFormatted, null, true);  //using forceReferenceLookup (i.e. cache lookup)

    return _ret;
}

function model_getValueTable(refName, rowIndex, colIndex, isFormatted) {
    var _refIndex = 0;
    var _ret = null;
    var _maxRows = model_getReferenceNumRows(refName);

    rowIndex = util_forceInt(rowIndex, 0);
    colIndex = util_forceInt(colIndex, 0);

    _refIndex = (rowIndex + (_maxRows * colIndex));

    _ret = model_getValue(refName, _refIndex, isFormatted);

    return _ret;
}

//get whether the value has been modified by user for the reference name and index provided (requires model to have been initialized)
function model_getValueIsModified(refName, refIndex) {
    var _ret = null;
    var _value = null;

    //Note: although using callback, this method is synchronous in nature due to the requirement of using the reference lookup cache (requires init of model)
    model_getReferenceCellIsModified(null, refName, refIndex, function (isModified) {
        _ret = isModified;
    }, null, true);  //using forceReferenceLookup (i.e. cache lookup)

    return _ret;
}

//set the value for the specified reference and its associated index (value must be unformatted and valid)
//Note: after setting the value it clears the model cache, sets the updated reference list, and updates the model screen
function model_setValue(tag, refName, refIndex, value, callback) {
    tag = model_forceTag(tag);

    ModelService.SetReferenceValue(tag, refName, refIndex, value, ext_requestSuccess(function (data) {
        MODEL_MANAGER.ClearCache();

        model_loadReferences(tag, function () {
            model_updateScreen(null, callback);
        }, data);

    }), model_onError);
}

//restores the default values for the specified section (use blank section name to restore all sections/values)
//Note: after restoring the default values it clears the model cache, sets the updated reference list, and updates the model screen
function model_restoreDefault(tag, sectionName, restoreFromCurrentScenario, callback, isConfirm, message, options) {
    isConfirm = util_forceBool(isConfirm, false);
    restoreFromCurrentScenario = util_forceBool(restoreFromCurrentScenario, false);
    message = util_forceString(message);

    tag = model_forceTag(tag);

    var _callback = function (isRestored) {
        isRestored = util_forceBool(isRestored, false);

        if (callback) {
            callback(isRestored);
        }
    };
    
    var _confirmMsg = MODEL_MANAGER.Configuration.Confirmation["ConfirmMessage"];
    var _confirmTitle = MODEL_MANAGER.Configuration.Confirmation["ConfirmTitle"];

    if (util_isNotNullOrUndefined(options)) {
        if (util_isNotNullOrUndefined(options["ConfirmMessage"]) || options["ConfirmMessage"] == "") {
            _confirmMsg = options["ConfirmMessage"];
        }
        if (util_isNotNullOrUndefined(options["ConfirmTitle"]) || options["ConfirmMessage"] == "") {
            _confirmTitle = options["ConfirmTitle"];
        }     
    }

    var _fn = function () {
        var _successCallback = function () {

            if (isConfirm) {
                util_alert(_confirmMsg, _confirmTitle);
            }

            _callback(true);
        };

        ModelService.RestoreSectionDefault(tag, sectionName, restoreFromCurrentScenario, ext_requestSuccess(function (data) {
            MODEL_MANAGER.ClearCache();

            model_loadReferences(tag, function () {
                model_updateScreen(null, _successCallback);
            }, data);
        }), model_onError);
    };
        
    if (isConfirm) {
        var _arrButtons = [{ ID: NOTIFICATION_BUTTON_CONFIG.Yes.ID, Text: NOTIFICATION_BUTTON_CONFIG.Yes.Text },
                           { ID: NOTIFICATION_BUTTON_CONFIG.No.ID, Text: NOTIFICATION_BUTTON_CONFIG.No.Text}];

        if (message == "") {
            message = MODEL_MANAGER.Configuration.Confirmation["ConfirmReset"];
        }

        util_confirm(message, _confirmTitle, false, _arrButtons, function (btnID) {
            if (btnID == NOTIFICATION_BUTTON_CONFIG.Yes.ID) {
                _fn();
            }
            else if (btnID == NOTIFICATION_BUTTON_CONFIG.No.ID) {
                _callback(false);
            }
        });
    }
    else {
        _fn();
    }
}

//retrieves the reference with the specified name (requires model init; references loaded from model service)
function model_getReference(refName) {
    var _ret = MODEL_MANAGER.References[refName];

    return _ret;
}

//number of "rows" the reference was configured from
function model_getReferenceNumRows(refName) {
    var _ret = 0;

    var _reference = model_getReference(refName);

    if (!util_isNullOrUndefined(_reference)) {
        var _rowStart = util_forceInt(_reference[enColCModelReferenceDetailProperty.RowStart], 0);
        var _rowEnd = util_forceInt(_reference[enColCModelReferenceDetailProperty.RowEnd], 0);

        if (_rowStart == _rowEnd) {
            _ret = 1;
        }
        else {
            _ret = (_rowEnd - _rowStart) + 1;
        }
    }

    return _ret;
}

//number of "columns" the reference was configured from
function model_getReferenceNumColumns(refName) {
    var _ret = 0;

    var _reference = model_getReference(refName);

    if (!util_isNullOrUndefined(_reference)) {
        var _columnStart = util_forceInt(_reference[enColCModelReferenceDetailProperty.ColumnStart], 0);
        var _columnEnd = util_forceInt(_reference[enColCModelReferenceDetailProperty.ColumnEnd], 0);

        if (_columnStart == _columnEnd) {
            _ret = 1;
        }
        else {
            _ret = (_columnEnd - _columnStart) + 1;
        }
    }

    return _ret;
}

function model_forceTag(item) {
    if (util_isNullOrUndefined(item)) {
        item = {};

        item[enColCModelTagProperty.ModelID] = PROJECT_MODEL_ID;
        item[enColCModelTagProperty.Tag] = "";
    }

    if (util_isDefined("private_modelForceTag")) {
        item = private_modelForceTag(item);
    }

    if (util_trim(item[enColCModelTagProperty.Tag]) == "") {
        item[enColCModelTagProperty.Tag] = "app";
    }

    return item;
}

//for the reference name and index provided, returns the result label or editable input for the value (renderer model HTML)
function model_getInputHTML(refName, refIndex, options, extAttr) {
    var _ret = "";

    if (util_isNullOrUndefined(options)) {
        options = { "IsEditable": null,
            "InputClassType": ""
        };
    }

    refName = util_forceString(refName);
    refIndex = util_forceInt(refIndex, 0);
    extAttr = util_forceString(extAttr);

    var _isEditable = enCETriState.None;

    if (!util_isNullOrUndefined(options["IsEditable"])) {
        var _temp = util_forceBool(options["IsEditable"], false);

        _isEditable = (_temp ? enCETriState.Yes : enCETriState.No);
    }

    var _attr = util_renderAttribute("model_input") + " " +
                util_htmlAttribute(DATA_ATTR_MODEL_REF_NAME, refName) + " " +
                util_htmlAttribute(DATA_ATTR_MODEL_REF_INDEX, refIndex) + " " +
                util_htmlAttribute(DATA_ATTR_MODEL_INPUT_IS_EDITABLE, _isEditable);

    _attr += (extAttr != "" ? " " + extAttr : "");

    var _inputClassTypeSuffix = util_forceString(options["InputClassType"]);

    if (_inputClassTypeSuffix != "") {
        _attr = util_htmlAttribute("class", "ModelInputFixed" + _inputClassTypeSuffix) + " " + _attr;
    }

    if (_isEditable != enCETriState.No) {
        _ret += "<div " + _attr + " />";
    }
    else {
        _ret += "<span " + _attr + " />";
    }

    return _ret;
}

function model_getChartHTML(chartID, extAttr, width, height, pctWidth, pctHeight) {
    var _ret = "";

    chartID = util_forceString(chartID);

    extAttr = util_forceString(extAttr, "");

    width = util_forceInt(width, 0);
    height = util_forceInt(height, 0);

    pctWidth = util_forceFloat(pctWidth, 0);
    pctHeight = util_forceFloat(pctHeight, 0);

    _ret += "<div " + util_renderAttribute("model_chart") + " " +
            util_htmlAttribute(DATA_ATTR_MODEL_CHART_ID, chartID) + " " +
            util_htmlAttribute(DATA_ATTR_MODEL_WIDTH, width) + " " +
            util_htmlAttribute(DATA_ATTR_MODEL_HEIGHT, height) + " " +
            util_htmlAttribute(DATA_ATTR_MODEL_WIDTH_PCT, pctWidth) + " " +
            util_htmlAttribute(DATA_ATTR_MODEL_HEIGHT_PCT, pctHeight) + " " +
            (extAttr != "" ? extAttr + " " : "") +
            "/>";

    return _ret;
}

//retrieve the worksheet cell value (uses cache if available/specified, or retrieves it from the model service)
//Note: once a value is retrieved from the model service, it is added to the local model cache
function model_getWorksheetValue(tag, wsName, rowNo, columnNo, callback, disableCache) {
    tag = model_forceTag(tag);
    disableCache = util_forceBool(disableCache, false);

    var _callback = function (val) {
        if (callback) {
            callback(val);
        }
    };

    var _fn = function () {
        ModelService.GetCellValue(tag, wsName, rowNo, columnNo, ext_requestSuccess(function (data) {

            //add the cell value to the cache
            MODEL_MANAGER.SetCacheCellValue(wsName, rowNo, columnNo, data);

            _callback(data);
        }));
    };

    //check if it exists in the cache, if applicable
    var _value = MODEL_MANAGER.GetCacheCellValue(wsName, rowNo, columnNo);

    if (disableCache || util_isNullOrUndefined(_value)) {
        _fn();
    }
    else {
        _callback(_value);
    }
}

//creates a new cell detail object with the specified worksheet name, row number, column number, etc. (wrapper object initialization)
function model_getCellDetail(wsName, rowNo, columnNo, refName, refIndex) {
    var _ret = {};

    _ret[enColCModelReferenceDetailProperty.WorksheetName] = util_forceString(wsName);
    _ret[enColCModelReferenceDetailProperty.RowNo] = util_forceInt(rowNo, -1);
    _ret[enColCModelReferenceDetailProperty.ColumnNo] = util_forceInt(columnNo, -1);
    _ret[enColCModelReferenceDetailProperty.ReferenceName] = util_forceString(refName, "");
    _ret[enColCModelReferenceDetailProperty.ReferenceIndex] = util_forceInt(refIndex, -1);

    return _ret;
}

//given an array of cell detail objects, will populate and return the associated values for the array
function model_getCellValues(tag, arrCellDetail, callback) {
    tag = model_forceTag(tag);

    var _callback = function (arr) {
        var _list = arr;

        if (!util_isNullOrUndefined(_list)) {
            for (var i = 0; i < _list.length; i++) {
                var _cellDetail = _list[i];

                var _wsName = _cellDetail[enColCModelReferenceDetailProperty.WorksheetName];
                var _rowNo = _cellDetail[enColCModelReferenceDetailProperty.RowNo];
                var _columnNo = _cellDetail[enColCModelReferenceDetailProperty.ColumnNo];
                var _value = model_readCellValue(_cellDetail);

                MODEL_MANAGER.SetCacheCellValue(_wsName, _rowNo, _columnNo, _value);
            }
        }

        if (callback) {
            callback(arr);
        }
    };

    ModelService.GetCellDetails(tag, arrCellDetail, ext_requestSuccess(function (data) {
        _callback(data);
    }), model_onError);
}

function model_loadReferences(tag, callback, listUpdatedReferences) {
    tag = model_forceTag(tag);

    var _callback = function (refList) {
        if (util_isNullOrUndefined(refList)) {
            refList = [];
        }

        var _lookup = {};

        for (var i = 0; i < refList.length; i++) {
            var _reference = refList[i];
            var _refName = _reference[enColCModelReferenceDetailProperty.ReferenceName];

            _lookup[_refName] = _reference;
        }

        MODEL_MANAGER.References = _lookup;

        if (callback) {
            callback(refList);
        }
    };

    if (!util_isNullOrUndefined(listUpdatedReferences)) {
        _callback(listUpdatedReferences);
    }
    else {
        ModelService.GetReferences(tag, ext_requestSuccess(function (data) {
            _callback(data);
        }), model_onError);
    }
}

function model_getReferenceCellValue(tag, refName, index, callback, isFormatted, disableCache, forceReferenceLookup) {
    tag = model_forceTag(tag);

    var _callback = function (refItem) {
        if (callback) {
            var _arrValues = refItem[enColCModelReferenceDetailProperty.Value]; //reference types return an array of values for each reference cell

            if (util_isNullOrUndefined(_arrValues)) {
                _arrValues = [];
            }

            if (index < 0 || index >= _arrValues.length) {
                util_logError("model_getReferenceCellValue :: invalid reference index | " + refName + " | index: " + index);
            }

            var _item = _arrValues[index];
            var _value = _item[enColCReferenceCellDetailProperty.Value];

            if (isFormatted) {
                _value = model_formatter(refItem, _value);
            }

            callback(_value);
        }
    };

    isFormatted = util_forceBool(isFormatted, false);
    disableCache = util_forceBool(disableCache, false);
    forceReferenceLookup = util_forceBool(forceReferenceLookup, false);
    index = util_forceInt(index, 0);

    //check if the reference exists in the cached lookup
    var _reference = model_getReference(refName);

    if (util_isNullOrUndefined(_reference) || disableCache) {

        if (!forceReferenceLookup) {

            //refresh the references
            model_loadReferences(tag, function () {
                _callback(model_getReference(refName));
            });
        }
        else {
            util_logError("model_getReferenceCellValue :: reference not initialized | " + refName + " | index: " + index);
        }
    }
    else {
        _callback(_reference);
    }
}

function model_getReferenceCellIsModified(tag, refName, index, callback, disableCache, forceReferenceLookup) {
    tag = model_forceTag(tag);

    var _callback = function (refItem) {
        if (callback) {
            var _arrValues = refItem[enColCModelReferenceDetailProperty.Value]; //reference types return an array of values for each reference cell

            if (util_isNullOrUndefined(_arrValues)) {
                _arrValues = [];
            }

            if (index < 0 || index >= _arrValues.length) {
                util_logError("model_getReferenceCellValue :: invalid reference index | " + refName + " | index: " + index);
            }

            var _item = _arrValues[index];
            var _isModified = _item[enColCReferenceCellDetailProperty.IsModified];

            callback(_isModified);
        }
    };

    disableCache = util_forceBool(disableCache, false);
    forceReferenceLookup = util_forceBool(forceReferenceLookup, false);
    index = util_forceInt(index, 0);

    //check if the reference exists in the cached lookup
    var _reference = model_getReference(refName);

    if (util_isNullOrUndefined(_reference) || disableCache) {

        if (!forceReferenceLookup) {

            //refresh the references
            model_loadReferences(tag, function () {
                _callback(model_getReference(refName));
            });
        }
        else {
            util_logError("model_getReferenceCellValue :: reference not initialized | " + refName + " | index: " + index);
        }
    }
    else {
        _callback(_reference);
    }
}

//given a cell detail object, return the property contents for the "Value" (wrapper object read property)
function model_readCellValue(itemCellDetail) {
    var _ret = null;

    if (util_isNullOrUndefined(itemCellDetail)) {
        itemCellDetail = {};
    }

    _ret = itemCellDetail[enColCModelReferenceDetailProperty.Value];
    _ret = _ret[enColCReferenceCellDetailProperty.Value];

    return _ret;
}

function model_onError(err) {
    var _msg = "";

    if (!util_isNullOrUndefined(err)) {
        _msg = err["responseText"];
    }

    _msg = util_forceString(_msg);

    if (_msg == "") {
        _msg = MSG_CONFIG.UnexpectedError;
    }

    util_logError(_msg);
}

function model_eventOnFocus() {
    var _element = $(this);
    var _value = util_trim(_element.val());

    var _container = $mobileUtil.FindAncestor(_element, "[" + DATA_ATTR_MODEL_REF_NAME + "]");
    var _reference = model_getReference(_container.attr(DATA_ATTR_MODEL_REF_NAME));
    var _referenceIndex = util_forceInt(_container.attr(DATA_ATTR_MODEL_REF_INDEX), 0);

    var _result = model_unformatter(_reference, _value);

    _element.attr("data-attr-model-input-prev-value", util_forceString(_result["Value"]));
}

function model_eventOnBlur() {

    var _element = $(this);

    var _value = util_trim(_element.val());

    var _prevValue = util_forceString(_element.attr("data-attr-model-input-prev-value"));

    _element.val(_value);

    var _container = $mobileUtil.FindAncestor(_element, "[" + DATA_ATTR_MODEL_REF_NAME + "]");
    var _reference = model_getReference(_container.attr(DATA_ATTR_MODEL_REF_NAME));
    var _referenceIndex = util_forceInt(_container.attr(DATA_ATTR_MODEL_REF_INDEX), 0);

    var _result = model_unformatter(_reference, _value);

    if (_prevValue != util_forceString(_result.Value)) {

        //check if the generic "format type" validation result is successful, and if there is a project specific validation function
        //if available, the project specific validation function will be called to enforce custom validations for the reference
        if (util_forceBool(_result["Valid"], false) && util_isDefined("private_modelInputValidation")) {
            _result = private_modelInputValidation(_element, _result, _reference[enColCModelReferenceDetailProperty.ReferenceName], _referenceIndex, _reference);
        }

        if (!util_forceBool(_result["Valid"], false)) {
            var _formattedValue = model_formatter(_reference, _prevValue);

            _element.val(_formattedValue);  //restore the previous value (must format it first)

            //display error message
            var _msg = util_forceString(_result["Message"]);

            if (_msg == "") {
                _msg = MODEL_MANAGER.Configuration.Validation.DefaultMessage;
            }

            util_alert(_msg, MODEL_MANAGER.Configuration.Validation.DefaultTitle);
        }
        else {
            model_setValue(null, _reference[enColCModelReferenceDetailProperty.ReferenceName], _referenceIndex, _result.Value);
        }
    }
    else {
        _element.val(model_formatter(_reference, _result.Value));
    }
}


/********************************************************** SECTION START: Model Formatters **********************************************************/
/*****************************************************************************************************************************************************/

function model_formatter(refItem, value) {
    var _ret = "";

    var _reference = refItem;
    var _formatType = util_forceValidEnum(_reference[enColCModelReferenceDetailProperty.FormatType], enCModelReferenceFormatType, enCModelReferenceFormatType.None);
    var _precision = util_forceInt(_reference[enColCModelReferenceDetailProperty.Precision], -1);

    var _formatterOptions = { "Reference": _reference, "IsReverse": false, "FormatType": _formatType, "Precision": _precision, "Value": value };

    var _fnModelBaseFormatter = function (fn) {
        var _valBase = value;
        var _handled = false;

        if (util_isFunction("private_modelBaseFormatter")) {
            _valBase = private_modelBaseFormatter(_formatterOptions);
            _handled = true;
        }

        if (!_handled && fn) {
            _valBase = fn();
        }

        return _valBase;
    };

    switch (_formatType) {

        case enCModelReferenceFormatType.Number:

            _ret = _fnModelBaseFormatter(function () {
                _ret = util_formatNumber(value, 0);
            });

            break;

        case enCModelReferenceFormatType.NumberDecimal:

            _ret = _fnModelBaseFormatter(function () {
                _ret = util_formatNumber(value, (_precision < 0) ? 2 : _precision);
            });

            break;

        case enCModelReferenceFormatType.Percent:
        case enCModelReferenceFormatType.PercentRatio:

            _ret = _fnModelBaseFormatter(function () {

                if (util_isNullOrUndefined(value)) {
                    _ret = "";
                }
                else {
                    var _pctFactor = 1.0;

                    if (_formatType == enCModelReferenceFormatType.PercentRatio) {
                        _pctFactor = 100.00;
                    }

                    value = util_forceFloat(value, 0) * _pctFactor;

                    _ret = util_formatNumber(value, (_precision < 0) ? 2 : _precision) + "%";
                }

            });

            break;

        case enCModelReferenceFormatType.Currency:

            _ret = _fnModelBaseFormatter(function () {

                if (util_isNullOrUndefined(value)) {
                    _ret = "";
                }
                else {
                    if (_precision < 0) {
                        _precision = MODEL_MANAGER.Configuration.Formatter.CurrencyDecimalPlaces;
                    }

                    value = util_forceFloat(value, 0) * 1.00;
                    _ret = util_formatCurrency(value, _precision, "$");
                }

            });

            break;

        case enCModelReferenceFormatType.Text:

            _ret = _fnModelBaseFormatter(function () {
                _ret = util_forceString(value);
            });

            break;

        case enCModelReferenceFormatType.Custom:
            if (util_isDefined("private_modelFormatter")) {
                _ret = private_modelFormatter(refItem, value);
            }
            else {
                _ret = value;
            }

            break;

        case enCModelReferenceFormatType.None:
        default:

            _ret = _fnModelBaseFormatter(function () {
                _ret = value;
            });

            break;
    }

    return _ret;
}

function model_unformatter(refItem, text) {
    var _ret = { "Valid": false, "Message": "", "Value": null };

    var _reference = refItem;
    var _formatType = util_forceValidEnum(_reference[enColCModelReferenceDetailProperty.FormatType], enCModelReferenceFormatType, enCModelReferenceFormatType.None);

    text = util_trim(text);

    var _value = null;
    var _temp = null;

    var _fnSetError = function (msg) {
        _ret.Valid = false;
        _ret.Message = util_forceString(msg);
    };

    var _fnReplaceTokens = function (arr) {
        var _tokens = {};

        if (!util_isNullOrUndefined(arr)) {
            for (var i = 0; i < arr.length; i++) {
                var _str = util_regexEscape(arr[i]);

                _tokens[_str] = "";
            }
        }

        _temp = util_replaceTokens(text, _tokens);
    };

    var _formatterOptions = { "Reference": _reference, "IsReverse": true, "FormatType": _formatType, "Value": text };

    var _fnModelBaseFormatter = function (fn) {
        var _handled = false;

        if (util_isFunction("private_modelBaseFormatter")) {
            _ret = private_modelBaseFormatter(_formatterOptions);
            _handled = true;
        }

        if (!_handled && fn) {
            fn();
        }
    };

    switch (_formatType) {

        case enCModelReferenceFormatType.Number:

            _fnModelBaseFormatter(function () {

                _fnReplaceTokens([","]);

                if (util_isWholeNumber(_temp)) {
                    _value = util_forceInt(_temp);
                }
                else {
                    _fnSetError(MODEL_MANAGER.Configuration.Validation["ValidNumber"]);
                }
            });

            break;

        case enCModelReferenceFormatType.NumberDecimal:

            _fnModelBaseFormatter(function () {

                _fnReplaceTokens([","]);

                if (util_isNumeric(_temp)) {
                    _value = util_forceFloat(_temp);
                }
                else {
                    _fnSetError(MODEL_MANAGER.Configuration.Validation["ValidNumber"]);
                }

            });

            break;

        case enCModelReferenceFormatType.Percent:
        case enCModelReferenceFormatType.PercentRatio:

            _fnModelBaseFormatter(function () {

                _fnReplaceTokens(["%"]);

                if (util_isNumeric(_temp)) {
                    var _pctDivisor = 1.0;

                    if (_formatType == enCModelReferenceFormatType.PercentRatio) {
                        _pctDivisor = 100.00;
                    }

                    _value = util_forceFloat(_temp) / _pctDivisor;
                }
                else {
                    _fnSetError(MODEL_MANAGER.Configuration.Validation["ValidPercentage"]);
                }

            });

            break;

        case enCModelReferenceFormatType.Currency:

            _fnModelBaseFormatter(function () {

                _fnReplaceTokens(["$", ","]);

                if (util_isNumeric(_temp)) {
                    _value = util_forceFloat(_temp);
                }
                else {
                    _fnSetError(MODEL_MANAGER.Configuration.Validation["ValidCurrency"]);
                }

            });

            break;

        case enCModelReferenceFormatType.Text:

            _fnModelBaseFormatter(function () {

                _value = text;

            });

            break;

        case enCModelReferenceFormatType.Custom:
            if (util_isDefined("private_modelUnformatter")) {
                _ret = private_modelUnformatter(refItem, text);
            }
            else {
                _value = text;
            }

            break;

        case enCModelReferenceFormatType.None:
        default:

            _fnModelBaseFormatter(function () {

                _value = text;

            });

            break;
    }

    if (_value != null) {
        _ret.Valid = true;
        _ret.Value = _value;
    }

    return _ret;
}

/********************************************************** SECTION END: Model Formatters ************************************************************/
/*****************************************************************************************************************************************************/

/********************************************************** SECTION START: Model Reference Scenario **************************************************/
/*****************************************************************************************************************************************************/

//retrieves the current/active model scenario for the logged in user, if available
function model_scenarioGetCurrent(tag, isCheckScenarioTemp, callback) {
    tag = model_forceTag(tag);
    isCheckScenarioTemp = util_forceBool(isCheckScenarioTemp, false);

    var _callback = function (scenario) {
        if (callback) {
            callback(scenario);
        }
    };

    ModelService.GetCurrentUserScenario(tag, isCheckScenarioTemp, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

function model_scenarioGetDefault(tag, callback) {
    tag = model_forceTag(tag);

    var _callback = function (scenario) {
        if (callback) {
            callback(scenario);
        }
    };

    ModelService.GetDefaultScenario(tag, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

function model_scenarioGetByID(scenarioID, deepLoad, callback) {
    var _callback = function (scenario) {
        if (util_isNullOrUndefined(scenario)) {
            scenario = {};
        }

        if (callback) {
            callback(scenario);
        }
    };

    ModelService.ModelReferenceScenarioGetByPrimaryKey(scenarioID, deepLoad, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

//retrieves an array of model scenarios for the logged in user
function model_scenarioUserList(tag, sortColumn, sortASC, pageSize, pageNum, callback) {
    tag = model_forceTag(tag);

    var _callback = function (list) {
        if (util_isNullOrUndefined(list)) {
            list = [];
        }

        if (callback) {
            callback(list);
        }
    };

    sortColumn = util_forceValidEnum(sortColumn, enColModelReferenceScenario, enColModelReferenceScenario.Default);
    sortASC = util_forceBool(sortASC, true);

    pageSize = util_forceInt(pageSize, enCEPaging.NoPaging);
    pageNum = util_forceInt(pageNum, enCEPaging.NoPaging);

    ModelService.GetUserScenarios(tag, sortColumn, sortASC, pageSize, pageNum, ext_requestSuccess(function (data) {
        _callback(data.List);
    }));
}

//globally shared scenarios
function model_scenarioGlobalList(tag, sortColumn, sortASC, pageSize, pageNum, callback) {
    tag = model_forceTag(tag);

    var _callback = function (list) {
        if (util_isNullOrUndefined(list)) {
            list = [];
        }

        if (callback) {
            callback(list);
        }
    };

    sortColumn = util_forceValidEnum(sortColumn, enColModelReferenceScenario, enColModelReferenceScenario.Default);
    sortASC = util_forceBool(sortASC, true);

    pageSize = util_forceInt(pageSize, enCEPaging.NoPaging);
    pageNum = util_forceInt(pageNum, enCEPaging.NoPaging);

    ModelService.GetGlobalScenarios(tag, sortColumn, sortASC, pageSize, pageNum, ext_requestSuccess(function (data) {
        _callback(data.List);
    }));
}


function model_scenarioList(tag, userID, shareTypeID, isCurrent, isDefault, isFilterUserScenarios, filterUserID, filterShareTypeID, name, sortColumn,
                            sortASC, pageSize, pageNum, callback) {

    var _callback = function (list) {
        if (util_isNullOrUndefined(list)) {
            list = [];
        }

        if (callback) {
            callback(list);
        }
    };

    tag = model_forceTag(tag);

    userID = util_forceInt(userID, enCE.None);

    shareTypeID = util_forceInt(shareTypeID, enCE.None);

    isCurrent = util_forceValidEnum(isCurrent, enCETriState, enCETriState.None);

    isDefault = util_forceValidEnum(isDefault, enCETriState, enCETriState.None);

    isFilterUserScenarios = util_forceValidEnum(isFilterUserScenarios, enCETriState, enCETriState.None);

    filterUserID = util_forceInt(filterUserID, enCE.None);

    filterShareTypeID = util_forceInt(filterShareTypeID, enCE.None);

    name = util_forceString(name);

    sortColumn = util_forceValidEnum(sortColumn, enColModelReferenceScenario, enColModelReferenceScenario.Default);
    sortASC = util_forceBool(sortASC, true);

    pageSize = util_forceInt(pageSize, enCEPaging.NoPaging);
    pageNum = util_forceInt(pageNum, enCEPaging.NoPaging);

    ModelService.ModelReferenceScenarioGetByForeignKey(tag, userID, shareTypeID, isCurrent, isDefault, isFilterUserScenarios, filterUserID, filterShareTypeID, name, sortColumn, sortASC, pageSize, pageNum,
                                                       ext_requestSuccess(function (data) {
                                                           _callback(data.List);
                                                       }));
}

function model_scenarioSave(tag, scenario, deepSave, isSaveReferences, callback) {
    tag = model_forceTag(tag);

    var _callback = function (item) {
        if (callback) {
            callback(item);
        }
    };

    isSaveReferences = util_forceBool(isSaveReferences, false);

    ModelService.SaveScenario(tag, scenario, deepSave, isSaveReferences, ext_requestSuccess(function (data) {
        _callback(data);
    }));
}

function model_scenarioLoad(tag, scenarioID, callbackSuccess, callbackFailure) {
    tag = model_forceTag(tag);

    var _callback = function () {
        model_updateScreen(true, function () {
            if (callbackSuccess) {
                callbackSuccess();
            }
        });
    };

    var _callbackFailure = function () {
        if (callbackFailure) {
            callbackFailure();
        }
    };

    ModelService.SetUserScenario(tag, scenarioID, ext_requestSuccess(function (data) {
        var _success = util_forceBool(data, false);

        if (_success) {
            _callback();
        }
        else {
            _callbackFailure();
        }
    }), function () {
        _callbackFailure();
    });
}

function model_scenarioDelete(scenario, callback) {
    var _callback = function () {
        if (callback) {
            callback();
        }
    };

    ModelService.ModelReferenceScenarioDelete(scenario, ext_requestSuccess(function (data) {
        _callback();
    }));
}

function model_scenarioSetDefault(tag, scenarioID, callbackSuccess, callbackFailure) {
    tag = model_forceTag(tag);

    var _callback = function () {
        if (callbackSuccess) {
            callbackSuccess();
        }
    };

    var _callbackFailure = function () {
        if (callbackFailure) {
            callbackFailure();
        }
    };

    ModelService.SetModelDefaultScenario(tag, scenarioID, ext_requestSuccess(function (data) {
        var _success = util_forceBool(data, false);

        if (_success) {
            _callback();
        }
        else {
            _callbackFailure();
        }
    }), function () {
        _callbackFailure();
    });
}

function model_scenarioOverrideDefault(tag, scenario, deepSave, callbackSuccess, callbackFailure) {
    tag = model_forceTag(tag);
    deepSave = util_forceBool(deepSave, false);

    var _callback = function () {
        if (callbackSuccess) {
            callbackSuccess();
        }
    };

    var _callbackFailure = function () {
        if (callbackFailure) {
            callbackFailure();
        }
    };

    ModelService.ModelDefaultScenarioSave(tag, scenario, deepSave, ext_requestSuccess(function (data) {
        var _success = (!util_isNullOrUndefined(data) && util_forceInt(data[enColModelReferenceScenarioProperty.ScenarioID], enCE.None) != enCE.None);

        if (_success) {
            _callback(data);
        }
        else {
            _callbackFailure();
        }
    }), function () {
        _callbackFailure();
    });
}

/********************************************************** SECTION END: Model Reference Scenario ****************************************************/
/*****************************************************************************************************************************************************/

/********************************************************** SECTION START: Lookup ****************************************************/
/*************************************************************************************************************************************/

function model_getShareTypes(tag, callback) {
    tag = model_forceTag(tag);

    var _callback = function (list) {
        if (callback) {
            callback(list);
        }
    };

    ModelService.GetShareTypes(tag, ext_requestSuccess(function (data) {
        _callback(data.List);
    }));
}

/********************************************************** SECTION END: Lookup ******************************************************/
/*************************************************************************************************************************************/