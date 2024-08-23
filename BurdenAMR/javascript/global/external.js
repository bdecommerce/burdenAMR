var GlobalService = null;   //Note: this global variable is initialized outside of this file (global application specific web service)
var ModelService = null;   //Note: this global variable is initialized outside of this file (global model application specific web service)
var ProjectService = null;   //Note: this global variable is initialized outside of this file (project application specific web service)

function ext_service_displayResultError(serviceResult, errorTypeSuppressMessage) {
    if (!util_isNullOrUndefined(serviceResult)) {
        if (ext_service_isResultError(serviceResult)) {
            var _msg = serviceResult[enColCServiceResultProperty.ErrorMessage];
            var _errorType = serviceResult[enColCServiceResultProperty.ErrorType];

            //log the service error
            util_log("Service Result Error - Type: " + _errorType + ", Msg: " + _msg);

            if (_errorType != errorTypeSuppressMessage) {

                //show the error to the user
                alert(_msg);
            }
        }
    }
}

function ext_service_isResultError(serviceResult, excludeErrorTypeID) {
    var _ret = false;

    if (util_isNullOrUndefined(excludeErrorTypeID)) {
        excludeErrorTypeID = null;
    }

    var _errorType = util_forceInt(serviceResult[enColCServiceResultProperty.ErrorType], undefined, true);

    if ((_errorType == enCEServiceErrorType.Permission) ||
        (!util_isNullOrUndefined(serviceResult) &&
        _errorType != enCEServiceErrorType.None &&        
        (!util_isNullOrUndefined(excludeErrorTypeID) && _errorType != excludeErrorTypeID))
       ) {
        _ret = true;
    }

    return _ret;
}

function ext_service_isResultSaveConflict(serviceResult) {
    var _ret = false;

    if (!util_isNullOrUndefined(serviceResult)) {
        if (serviceResult[enColCServiceResultProperty.ErrorType] == enCEServiceErrorType.SaveConflict) {
            _ret = true;
        }
    }

    return _ret;
}

//returns a function used for webmethod successful result (wrapper function processes any service result errors and executes callback function with actual result data)
function ext_requestSuccess(callback, isWrapper, messageTypeSeverity, options) {
    isWrapper = util_forceBool(isWrapper, true);

    var _ret = function (result) {

        //Note: global_serviceResultExecute is an external JS source file and its definition is handled accordingly (such as global JS source file)
        global_serviceResultExecute(result, function (serviceResult) {
            if (callback) {
                var _data = null;

                if (isWrapper) {
                    _data = ext_getServiceResultData(serviceResult);
                }
                else {
                    _data = serviceResult;
                }

                callback(_data);
            }
        }, messageTypeSeverity, options);
    };

    return _ret;
}

function ext_requestSuccessSave(callbackSaveSuccess, callbackSaveConflict, callbackRequestError, processValidationErrors, isWrapper, messageTypeSeverity, options) {
    isWrapper = util_forceBool(isWrapper, true);
    processValidationErrors = util_forceBool(processValidationErrors, false);

    options = util_extend({ "CallbackValidationErrors": null, "OptionsProcessValidation": null }, options);

    var _ret = function (result) {

        //Note: global_serviceResultExecute is an external JS source file and its definition is handled accordingly (such as global JS source file)
        global_serviceResultExecute(result, function (serviceResult) {
            var _data = null;

            if (ext_service_isResultSaveConflict(serviceResult)) {
                if (callbackSaveConflict) {
                    callbackSaveConflict();
                }
            }
            else if (processValidationErrors && global_serviceIsValidationError(serviceResult)) {
                global_serviceProcessValidationError(serviceResult, options.OptionsProcessValidation);

                var _fnCallbackValidationErrors = options["CallbackValidationErrors"];

                if (util_isFunction(_fnCallbackValidationErrors)) {
                    _fnCallbackValidationErrors(serviceResult);
                }
            }
            else if (processValidationErrors && ext_service_isResultError(serviceResult, enCEServiceErrorType.None)) {
                var _errMessage = util_forceString(serviceResult ? serviceResult[enColCServiceResultProperty.ErrorMessage] : "Error");

                if (callbackRequestError) {
                    callbackRequestError(_errMessage);
                }
            }
            else if (callbackSaveSuccess) {

                if (isWrapper) {
                    _data = ext_getServiceResultData(serviceResult);
                }
                else {
                    _data = serviceResult;
                }

                callbackSaveSuccess(_data);
            }

        }, messageTypeSeverity);
    };

    return _ret;
}

function ext_getServiceResultData(sResult) {
    return (sResult ? sResult[enColCServiceResultProperty.Data] : null);
}

function ext_requestSuccessCritical(callback, isWrapper) {
    return ext_requestSuccess(callback, isWrapper, enCMessageType.Critical);
}

function ext_processExecUserLoggedIn(callbackLoggedIn, callbackNotLoggedIn, overrideCheckUserLoggedIn) {
    overrideCheckUserLoggedIn = util_forceBool(overrideCheckUserLoggedIn, false);

    var _fnLoggedIn = function () {
        if (callbackLoggedIn) {
            callbackLoggedIn();
        }
    };

    var _fnNotLoggedIn = function () {
        if (callbackNotLoggedIn) {
            callbackNotLoggedIn();
        }
    };

    if (overrideCheckUserLoggedIn == true) {

        //an override has been specified in which assume that the user is logged in and execute the related callback
        _fnLoggedIn();
    }
    else {

        util_isOnline(function (isOnline) {

            if (!isOnline && CACHE_MANAGER.ToggleCache) {

                //user is currently not connected to the internet and the application is configured for offline/cache mode (process the user login/access based on last saved session)

                if (util_isDefined("global_userLoggedIn")) {
                    if (global_userLoggedIn()) {
                        _fnLoggedIn();
                    }
                    else {
                        _fnNotLoggedIn();
                    }
                }
                else {
                    _fnNotLoggedIn();
                }
            }
            else {
                GlobalService.UserSessionStatus(ext_requestSuccess(function (data) {
                    if (util_isDefined("MODULE_MANAGER") && util_isDefined("MODULE_MANAGER.Session")) {
                        MODULE_MANAGER.Session = data;

                        //store the session data into the application cache
                        CACHE_MANAGER.SetCacheItem("UserSession", data);
                    }

                    if (data && ((util_forceString(data[enColCSessionStatusProperty.ApplicationVersion]) !== util_queryString("v", window.location.href)) ||
                        (util_forceString(data[enColCSessionStatusProperty.ApplicationProjectCache]) !== util_queryString("pc", window.location.href))
                        )
                        ) {
                        var $refreshNotification = $("#divRefreshOutdatedVersion");

                        if ($refreshNotification.length == 0) {
                            $refreshNotification = $("<div id='divRefreshOutdatedVersion' class='DisableUserSelectable NotificationApplicationMessage'>" +
                                                     util_htmlEncode("There is a new version of <APP_NAME> available. Click here to refresh the page.") +
                                                     "</div>");

                            $refreshNotification.click(function () {
                                $(this).slideUp("normal", function () {
                                    $("body").addClass("EffectBlur");
                                    window.location.href = "<SITE_URL>";
                                    window.location.reload();
                                });
                            });

                            $("body").append($refreshNotification);
                        }
                    }

                    if (data && data[enColCSessionStatusProperty.IsLoggedIn] == true) {

                        //user is logged in
                        _fnLoggedIn();
                    }
                    else {

                        //user is not logged in
                        _fnNotLoggedIn();
                    }
                }, false));
            }

        }, CACHE_MANAGER.ToggleCache == false);        
    }
}

function ext_refreshUserSessionDetail(callback) {
    GlobalService.UserSessionStatus(ext_requestSuccess(function (data) {
        if (util_isDefined("MODULE_MANAGER") && util_isDefined("MODULE_MANAGER.Session")) {
            MODULE_MANAGER.Session = data;

            //store the session data into the application cache
            CACHE_MANAGER.SetCacheItem("UserSession", data);

            if (callback) {
                callback();
            }
        }
    }, false), //return type is not a wrapper
    function () {
        if (callback) {
            callback();
        }
    });
}

function CService(wsFileName, isGlobal) {
    if (wsFileName == null || wsFileName == undefined) {
        wsFileName = "wsGlobal.asmx";
    }

    isGlobal = util_forceBool(isGlobal, true);

    this.IsGlobalNamespace = isGlobal;
    this.ServiceURL = util_url_getRelativeForCurrentPath() + "WebService/" + (isGlobal ? "global" : "private") + "/" + wsFileName;
}

CService.prototype = {
    ServiceURL: null,
    IsGlobalNamespace: false,

    //the last AJAX request sent, is an XMLHttpRequest object (if available)
    LastRequest: null,

    DisableAllFutureRequests: false,

    //whether there are pending requests
    IsPendingRequests: false,

    //the specific error type to supress when a valid service result object is returned, null means all errors will not be suppressed
    SuppressMessageForErrorType: null,

    //whether to disable the execution callback for request start and request end (properties mentioned below); deprecated use "HasIndicators" option
    DisableCallBackRequest: false,

    HasIndicators: true,

    //the function to call prior to a request is being made
    CallBackRequestStart: null,

    //the function to call after a request is completed (regardless of success or failure)
    CallBackRequestEnd: null,

    //local storage for the service instance
    m_data: {},

    ext_ajax_error_detailed: function (xhr, status, error) {
        var _msg = null;

        if (xhr != null && xhr.responseText != null) {
            _msg = "<br />" + xhr.responseText;
        }
        else {
            _msg = status + ": " + error;
        }

        if (IS_DEBUG && !IS_SUPPRESS_FAILURE) {
            $(document).find("body").html(_msg);
        }
        else if (!IS_SUPPRESS_FAILURE) {
            alert("AJAX failure: " + status + ", '" + error + "'");
        }
        else {

            //log the error
            util_log("AJAX failure: " + status + ", '" + error + "'");
            util_log("......Details: " + _msg);

            //display the error to the user
            //Note: global_serviceRequestError is an external JS source file and its definition is handled accordingly (such as global JS source file)            
            global_serviceRequestError(status, error, _msg);
        }
    },

    ext_ShellService: function (methodName, parameters, successFn, failureFn, allowOverride) {
        this.ext_Service(this.ServiceURL + "/" + methodName, parameters, successFn, failureFn, allowOverride, this);
    },

    ext_Service: function (url, parameters, successFn, failureFn, allowOverride, service) {

        var _instance = this;

        if (allowOverride == null || allowOverride == undefined) {
            allowOverride = false;
        }

        if (service == null) {
            service = {};
            service.DisableAllFutureRequests = false;
        }

        if (service.DisableAllFutureRequests == false || allowOverride) {
            if (failureFn == null) {
                failureFn = this.ext_ajax_error_detailed;
            }

            if (this.CallBackRequestStart && this.DisableCallBackRequest != true && this.HasIndicators) {
                this.CallBackRequestStart();
            }

            var _requestData = JSON.stringify(parameters);


            //Important! must replace all date related string into proper browser independant format (so acceptable by the web service from Javascript)
            //UTC format for dates is required for error free conversions from caller to web service.
            var _matches = _requestData.match(new RegExp("/Date\\([0-9]+?\\)/", "g"));

            //util_log(_requestData);

            if (_matches && _matches.length > 0) {
                var SQL_DATETIME_FORMAT = "YYYY-MM-DD H:mm:ss.SSS";

                for (var m = 0; m < _matches.length; m++) {
                    var _match = _matches[m];

                    var _dt = moment(_match);

                    _requestData = _requestData.replace(_match, moment(_dt).format(SQL_DATETIME_FORMAT));
                }
            }

            //util_log(_requestData);

            service.LastRequest = $.ajax({
                type: "POST",
                contentType: "application/json; charset=utf-8",
                url: url,
                data: _requestData,
                dataType: "json",
                success: function (data, status, xmlHttp) {
                    var _serviceResult = data.d;
                    var _isSessionExpire = false;

                    if (ext_service_isResultError(_serviceResult, enCEServiceErrorType.None)) {

                        var _serviceErrorType = util_forceInt(_serviceResult[enColCServiceResultProperty.ErrorType], enCEServiceErrorType.None);
                        var _hasErrorType = (_serviceErrorType != enCEServiceErrorType.None);

                        //if session has expired force refresh of the current page
                        if (_serviceErrorType == enCEServiceErrorType.SessionExpire) {
                            service.DisableAllFutureRequests = true;    //disable all future requests for the service

                            _isSessionExpire = true;

                            util_log("AJAX success :: user session has expired. Redirect to login page...");

                            try {
                                GoToLogin();    //go to the login page (using the global method)
                            } catch (e) {

                                //show the current message session expire message
                                alert("User session for the site has expired. Please refresh the page.");

                                document.location.href = document.location.href;
                            }

                        }
                        else if (IS_SUPPRESS_FAILURE == false && _hasErrorType && _serviceErrorType != enCEServiceErrorType.SessionExpire) {
                            ext_service_displayResultError(_serviceResult, service.SuppressMessageForErrorType);
                        }
                        else if (_hasErrorType &&
                                 _serviceErrorType != enCEServiceErrorType.Validation &&
                                 _serviceErrorType != enCEServiceErrorType.SMTP &&
                                 _serviceErrorType != enCEServiceErrorType.SessionExpire) {

                            //display the error in browser error console (if the error type is not a critical error type)
                            util_logError("Service call error - url: '" + url + "', params: '" + JSON.stringify(parameters) + "'");
                        }
                    }

                    //                    util_log("method: " + url + ", length: " + JSON.stringify(data).length);
                    //                    util_log("value: " + JSON.stringify(data));

                    var _fnSuccessResult = null;

                    if (!_isSessionExpire && successFn != null) {

                        _fnSuccessResult = function () {
                            successFn(_serviceResult);
                        };
                    }

                    if (service && service.CallBackRequestEnd && service.DisableCallBackRequest != true && service.HasIndicators) {
                        service.CallBackRequestEnd();
                    }

                    if (service) {
                        service.HasIndicators = true;  //revert the "has indicators" toggle
                    }

                    _instance.ext_ServiceOnConnectivityChange({
                        "From": "service_success",
                        "Method": url,
                        "IsURL": true,
                        "ServiceMethodArgs": { "RequestData": _requestData },
                        "Callback": _fnSuccessResult
                    });

                },
                error: function (xhr, status, error) {

                    //only execute the failure callback if the request has not been aborted
                    if (status != "abort" && failureFn) {
                        failureFn(xhr, status, error);
                    }

                    if (service && service.CallBackRequestEnd && service.DisableCallBackRequest != true && service.HasIndicators) {
                        service.CallBackRequestEnd();
                    }

                    if (service) {
                        service.HasIndicators = true;  //revert the "has indicators" toggle
                    }
                }
            });
        }
        else {
            util_log("ext_Service :: WARNING! Request \"" + url + "\" was NOT executed. State: DisableAllFutureRequests = " + service.DisableAllFutureRequests);
        }
    },

    ext_ServiceOnConnectivityChange: function (options) {

        options = util_extend({ "From": null, "Method": null, "IsURL": false, "ServiceMethodArgs": null, "Callback": null }, options);

        options.Callback = (options.Callback || function () { });

        var _offlineManager = null;

        try {
            if (CACHE_MANAGER && CACHE_MANAGER["ToggleCache"] && util_isDefined("PRIVATE_OFFLINE_MANAGER")) {
                _offlineManager = PRIVATE_OFFLINE_MANAGER;
            }
        } catch (e) {
        }

        if (!_offlineManager || !_offlineManager["Events"] || !_offlineManager.Events["OnConnectivityChange"]) {
            options.Callback();
        }
        else {

            var _isDisableConnectivityCall = false;
            var _method = util_forceString(options.Method);

            if (options.IsURL) {
                var _index = _method.lastIndexOf("/");

                _method = (_index >= 0 && _index + 1 < _method.length ? _method.substr(_index + 1) : _method);
            }

            switch (_method) {

                case "IsApplicationOnline":
                    _isDisableConnectivityCall = true;
                    break;
            }

            if (_isDisableConnectivityCall) {
                options.Callback();
            }
            else {
                _offlineManager.Events.OnConnectivityChange(options);
            }
        }
    },

    Get: function (url, successFn, failureFn) {
        if (failureFn == null) {
            failureFn = this.ext_ajax_error_detailed;
        }

        if (this.CallBackRequestStart && this.DisableCallBackRequest != true && this.HasIndicators) {
            this.CallBackRequestStart();
        }

        var _service = this;

        $.ajax({ url: url }).done(function (data) {
            if (successFn) {
                successFn(data);
            }

            if (_service && _service.CallBackRequestEnd && _service.DisableCallBackRequest != true) {
                _service.CallBackRequestEnd();
            }
        })
        .error(function (xhr, status, error) {

            //only execute the failure callback if the request has not been aborted
            if (status != "abort" && failureFn) {
                failureFn(xhr, status, error);
            }

            if (_service && _service.CallBackRequestEnd && _service.DisableCallBackRequest != true && _service.HasIndicators) {
                _service.CallBackRequestEnd();
            }

            if (_service) {
                _service.HasIndicators = true;  //revert the "has indicators" toggle
            }
        });
    },

    "_onMethodRequest": function (options) {

        var _instance = this;

        var _fnError = function (xhr, status, error) {

            var _errorInstance = this;

            util_isOnline(function (isOnline) {

                var _fnCallbackError = function () {
                    if (options.OnFailure) {
                        options.OnFailure.apply(_errorInstance, [xhr, status, error]);
                    }
                };

                if (isOnline) {
                    _fnCallbackError();
                }
                else {

                    _instance.ext_ServiceOnConnectivityChange({
                        "From": "service_error",
                        "Method": options.Method,
                        "ServiceMethodArgs": options,
                        "Callback": function () {

                            options = util_extend({ "IsOnline": false, "ResultData": undefined, "IsResultWrapper": true }, options);

                            var _fnCloneArray = function (val) {
                                return (val ? val.slice(0) : []);   //NOTE: use the slice with argument 0 to clone the array (standalone array not associated to the source)
                            };

                            var _fnGetListResult = function (arr, isClone) {
                                isClone = util_forceBool(isClone, true);

                                var _list = (isClone ? _fnCloneArray(arr) : arr);

                                return { "List": _list, "NumItems": (_list ? _list.length : 0) };

                            };  //end: _fnGetListResult

                            options["IsGlobal"] = _instance.IsGlobalNamespace;
                            options["Util"] = {
                                "CloneArray": _fnCloneArray, "GetListResult": _fnGetListResult,
                                "GetValidationResult": function (opts) {

                                    opts = util_extend({ "Message": null, "IsMessageHTML": false }, opts);

                                    var _validationResult = {};

                                    _validationResult[enColCServiceResultProperty.Data] = null;
                                    _validationResult[enColCServiceResultProperty.ErrorMessage] = opts.Message;
                                    _validationResult[enColCServiceResultProperty.IsMessageHTML] = opts.IsMessageHTML;
                                    _validationResult[enColCServiceResultProperty.ErrorType] = enCEServiceErrorType.Validation;

                                    return _validationResult;
                                },
                                "GetErrorResult": function (opts) {

                                    opts = util_extend({ "Error": null, "ErrorType": enCEServiceErrorType.Unknown }, opts);

                                    var _errorResult = {};

                                    _errorResult[enColCServiceResultProperty.Data] = null;
                                    _errorResult[enColCServiceResultProperty.ErrorMessage] = opts.Error;
                                    _errorResult[enColCServiceResultProperty.ErrorType] = opts.ErrorType;

                                    return _errorResult;
                                }
                            };

                            var _handled = _instance._onProcessMethodRequest(options, function () {

                                if (options.OnSuccess) {

                                    var _result = options.ResultData;

                                    if (options.IsResultWrapper) {
                                        var _temp = {};

                                        _temp[enColCServiceResultProperty.Data] = _result;
                                        _temp[enColCServiceResultProperty.ErrorMessage] = null;
                                        _temp[enColCServiceResultProperty.ErrorType] = enCEServiceErrorType.None;

                                        _result = _temp;
                                    }

                                    options.OnSuccess.apply(_errorInstance, [_result]);
                                }

                            });

                            if (!_handled) {
                                _fnCallbackError();
                            }
                        }
                    });
                }

            }, null, { "DisableCacheResult": true });   //disable cache result for the check

        };  //end: _fnError

        this.ext_ShellService(options.Method, options.Parameters, options.OnSuccess, _fnError);
    },

    ///placeholder method to be overwritten as needed by project level code (NOTE: do not modify the function definition/body within this file)
    "_onProcessMethodRequest": function (options, callback) {
        var _handled = false;

        options = util_extend({ "IsOnline": true, "Method": "", "Parameters": null, "OnSuccess": null, "OnFailure": null }, options);

        return _handled;
    },

    "_sanitizeParams": function (params, options) {

        options = util_extend({ "ListPropStringify": null, "ListPropMethodRequest": null }, options);

        //configure default method request parameters (contextual based)
        var _listPropMethodRequest = options["ListPropMethodRequest"];

        if (params && _listPropMethodRequest) {
            var _templateParams = TemplateParams();

            for (var p = 0; p < _listPropMethodRequest.length; p++) {
                var _prop = _listPropMethodRequest[p];
                var _val = params[_prop];

                //check if it is not specified
                if (!_val) {

                    _val = {};

                    _val[enColCWebMethodRequestProperty.TemplateParams] = _templateParams;

                    if (MODULE_MANAGER.Current) {
                        _val[enColCWebMethodRequestProperty.ModuleID] = MODULE_MANAGER.Current.ModuleID;
                        _val[enColCWebMethodRequestProperty.ModuleViewTypeID] = MODULE_MANAGER.Current.ModuleViewType;
                        _val[enColCWebMethodRequestProperty.ControlName] = MODULE_MANAGER.Current.ControlName;
                    }

                    params[_prop] = _val;
                }
            }
        }

        var _listPropStringify = options["ListPropStringify"];

        if (params && _listPropStringify) {

            //loop through and ensure all parameters that require a stringified value are not plain objects/arrays and serialized to proper text
            for (var p = 0; p < _listPropStringify.length; p++) {
                var _prop = _listPropStringify[p];
                var _val = params[_prop];

                if (typeof _val === "object" || $.isPlainObject(_val) || $.isArray(_val)) {
                    _val = util_stringify(_val);
                    params[_prop] = _val;
                }
            }
        }
    },

    //START: _tag_
    //END: _tag_

    //Generic helper funtions
    LogNotImplemented: function (fnName) {
        util_log(fnName + ": child class function not implemented for web service");
    }
};   //end CService class


function initializeWebService(ws) {
    ws.CallBackRequestStart = function () {
        blockUI(null, { "IsFixedMode": true });
    };

    ws.CallBackRequestEnd = function () {
        unblockUI();
    };

    if (!IS_DEBUG) {
        ws.SuppressMessageForErrorType = enCEServiceErrorType.ExceedLimitJSON;
    }
}

//initialize the web services for this application
GlobalService = new CService("wsGlobal.asmx", true);
ModelService = new CService("wsModel.asmx", true);
ProjectService = new CService("ws<PROJECT_NO>.asmx", false);

initializeWebService(GlobalService);
initializeWebService(ModelService);
initializeWebService(ProjectService);