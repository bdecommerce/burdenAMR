var CACHE_MANAGER = {
    ToggleCache: (util_forceInt("<TOGGLE_CACHE>") == 1 && window["applicationCache"] != undefined),
    AppCache: window.applicationCache,
    ErrorInit: false,
    HasLocalStorageSupport: function (suppressToggleCacheCheck) {
        var _ret = false;

        try {
            if ((suppressToggleCacheCheck || CACHE_MANAGER.ToggleCache) && "localStorage" in window && window["localStorage"] !== null) {
                _ret = true;
            }
        } catch (e) {
            _ret = false;
        }

        if (_ret == true) {
            var _storageEnabled = function () {
                try {
                    localStorage.setItem("__test", "data");
                } catch (e) {
                    if (/QUOTA_?EXCEEDED/i.test(e.name)) {
                        return false;
                    }
                } finally {
                    localStorage.removeItem("__test");
                }
                return true;
            };

            var isiPad = navigator.userAgent.match(/iPad/i) != null;

            if (!_storageEnabled() && isiPad) _ret = false;

        }

        return _ret;
    },
    SetCacheItem: function (key, value, suppressToggleCacheCheck) {
        var _ret = false;   //whether the cache item was successfully set

        if (value === undefined) {
            _ret = delete localStorage[key];            
        } else if (util_forceString(key) != "" && CACHE_MANAGER.HasLocalStorageSupport(suppressToggleCacheCheck)) {
            window.localStorage[key] = util_stringify(value);
            _ret = true;
        }

        return _ret;
    },
    GetCacheItem: function (key, defaultValue, suppressToggleCacheCheck) {
        var _ret = defaultValue;

        if (util_forceString(key) != "" && CACHE_MANAGER.HasLocalStorageSupport(suppressToggleCacheCheck)) {
            _ret = window.localStorage[key];

            if (typeof (_ret) == "undefined") {
                _ret = defaultValue;
            }
            else {
                _ret = util_parse(_ret);
            }
        }

        return _ret;
    },
    RemoveCacheItem: function (key, suppressToggleCacheCheck) {
        if (CACHE_MANAGER.HasLocalStorageSupport(suppressToggleCacheCheck)) {
            if (localStorage.removeItem) {
                localStorage.removeItem(key);
            }
            else {
                delete localStorage[key]; //delete is the proper way to clear localStorage entries
                //localStorage[key] = undefined; //this was leaving a string of "undefined", undefined != "undefined"
            }
        }
    }
};

function cache_logger(e) {
    var _online;
    var _status;
    var _type;
    var _message;
    var _isError = false;

    _online = (util_isOnline(null, true)) ? 'yes' : 'no';
    _status = CACHE_STATUS_PROPER_NAME[CACHE_MANAGER.AppCache.status];
    _type = e.type;

    _message = 'Is Online: ' + _online +
                '; Event: ' + _type +
                '; Status: ' + _status +
                "; Index: " + $cacheManager.DownloadFileIndex;

    if (util_forceInt(CACHE_MANAGER.AppCache.status) == 3) {
        $cacheManager.DownloadFileIndex++;
    }

    if (_type == 'error' && util_isOnline(null, true)) {
        _message += '; ERROR: There was an unknown error; please check the cache manifest file for errors.';
        _isError = true;
    }
    else if (_type == 'progress') {
        $cacheManager.TotalCacheFileCount = e.originalEvent.total;
    }
    else if (_type == 'checking') {
        $cacheManager.DownloadFileIndex = 0;
    }

    $cacheManager.Log(_message);

    if (util_forceInt(CACHE_MANAGER.AppCache.status) == 3) {
        setTimeout(function () {
            var _progressMsg = ($cacheManager.IsUserLogin ? "Downloading" : "Removing");

            _progressMsg += " website resources...";

            if ($cacheManager.TotalCacheFileCount > 0) {
                var _pct = Math.min($cacheManager.DownloadFileIndex, $cacheManager.TotalCacheFileCount) / ($cacheManager.TotalCacheFileCount * 1.00);

                _progressMsg += util_round(_pct * 100.00, 2) + "%";
            }

            if ($cacheManager.IsUserLogin || $cacheManager.IsUserLogout) {
                global_setMessageBlockUI(_progressMsg);
            }

            if ($cacheManager.DownloadFileIndex >= $cacheManager.TotalCacheFileCount) {
                if ($cacheManager.IsUserLogin || $cacheManager.IsUserLogout) {
                    $mobileUtil.ActivePage().fadeOut();
                    $mobileUtil.ReloadBrowserWindow();
                }
            }
        }, 0);
    }
    else {
        setTimeout(function () {
            unblockUI();
        }, 1000);
    }

    if (_isError && !CACHE_MANAGER.ErrorInit && !$cacheManager.IsUserLogout) {
        var _callback = function (ret) {
            if (ret) util_alert("There was an unexpected error in configuring your browser to support the offline mode feature. Please refresh your browser and try again.");
            CACHE_MANAGER.ErrorInit = ret;
        };

        util_isOnline(_callback);
    }
}

function app_state_change(isOnline) {
    $cacheManager.Log("APPLICATION CONNECTION CHANGE: IsOnline - " + (isOnline == true));

    var _fnUpdateState = function (mIsOnline) {

        var _fnMsg = function () {
            if (!mIsOnline) {
                var _msgHTML = util_htmlEncode("You are currently in offline mode and some application features may be unavailable.") +
                           "<br />" + util_htmlEncode("Please verify your Internet connection and try again, if applicable.");

                util_warning(_msgHTML, true, 7500);
            }
        };

        if (mIsOnline) {

        }
        else {

            //offline mode
        }

        _fnMsg();

    };

    if (util_isNullOrUndefined(isOnline)) {

        util_isOnline(function (mIsOnline) {
            _fnUpdateState(mIsOnline);
        });
    }
    else {
        _fnUpdateState(isOnline);
    }    
}

var $cacheManager = {
    IsBusy: false,
    IsConfirmOnUpdateCache: true,
    IsDisableCacheLogout: false,
    IsUserLogin: false,
    IsUserLogout: false,
    CheckCacheTimerID: null,
    TimerCheckInterval: (util_forceInt("<IS_DEBUG>") == 1 ? 2.5 : 60) * 1000,
    Options: { "IsRefreshOnUncached": false, "ToggleLogs": false },
    DownloadFileIndex: 0,
    TotalCacheFileCount: 0,

    SwapCache: function () {
        var _cache = CACHE_MANAGER.AppCache;

        if (_cache) {
            try {
                var _fn = function () {
                    CACHE_MANAGER.AppCache.swapCache();
                };

                if ($cacheManager.IsUserLogin || $cacheManager.IsUserLogout) {
                    _fn();
                }
            } catch (e) {
                util_logError(e);

                if ($cacheManager.IsUserLogin || $cacheManager.IsUserLogout) {
                    $cacheManager.ClearUpdateInterval();

                    $cacheManager.IsUserLogin = false;
                    $cacheManager.IsUserLogout = false;

                    GoToHome();

                    $cacheManager.StartUpdateInterval();
                }
            }
        }
    },

    ClearUpdateInterval: function () {
        if ($cacheManager.CheckCacheTimerID) {
            clearInterval($cacheManager.CheckCacheTimerID);
            $cacheManager.CheckCacheTimerID = null;
        }

        $cacheManager.IsBusy = false;   //clear flag
    },

    StartUpdateInterval: function () {

        $cacheManager.ClearUpdateInterval();

        var _interval = Math.max(util_forceInt($cacheManager.TimerCheckInterval, 0), 2500);

        if ($cacheManager.IsUserLogin || $cacheManager.IsUserLogout) {
            _interval = 2500;
        }

        var _fnTimer = function () {
            var _status = CACHE_MANAGER.AppCache.status;

            $cacheManager.Log("cache_checkUpdatesInterval :: timer run | [" + $cacheManager.IsBusy + ", " + _status + "]");

            if (!$cacheManager.IsBusy) {
                $cacheManager.IsBusy = true;    //set flag the timer is currently active

                $cacheManager.Log("STATUS: " + CACHE_STATUS_PROPER_NAME[CACHE_MANAGER.AppCache.status]);

                if (_status == CACHE_MANAGER.AppCache.UNCACHED) {
                    if ($cacheManager.Options.IsRefreshOnUncached) {
                        //$mobileUtil.ActivePage().fadeOut();
                        //$mobileUtil.ReloadBrowserWindow();
                    }
                    else {
                        $cacheManager.IsBusy = false;   //clear flag
                    }
                }
                else if (_status == CACHE_MANAGER.AppCache.UPDATEREADY) {
                    $cacheManager.SwapCache();
                    $cacheManager.ClearUpdateInterval();

                    $cacheManager.IsBusy = false;   //clear flag
                }
                else if (_status == CACHE_MANAGER.AppCache.IDLE) {

                    $cacheManager.Log("cache_checkUpdatesInterval :: request cache update");

                    try {
                        $cacheManager.DownloadFileIndex = 0;
                        CACHE_MANAGER.AppCache.update();
                    } catch (e) {
                        if ($cacheManager.IsUserLogin) {
                            //util_alert("4.");
                        }
                    }

                    $cacheManager.IsBusy = false;   //clear flag
                }
            }
        };

        _fnTimer();

        $cacheManager.CheckCacheTimerID = setInterval(_fnTimer, _interval);
    },

    OnNoUpdate: function (e) {
        cache_logger(e);
        $cacheManager.IsBusy = false;
    },
    OnCached: function (e) {
        cache_logger(e);
        CACHE_MANAGER.SetCacheItem("LastCacheUpdate", new Date());
    },
    OnUpdateReady: function (e) {
        cache_logger(e);

        try {
            if (CACHE_MANAGER.AppCache.status === CACHE_MANAGER.AppCache.UPDATEREADY) {
                CACHE_MANAGER.SetCacheItem("LastCacheUpdate", new Date());
                $cacheManager.SwapCache();
            }
        } catch (e) {
            if ($cacheManager.IsUserLogout) {
                //util_alert("5.");
            }
        }
    },

    Log: function (msg) {
        var _toggleLog = true;

        if ($cacheManager["Options"]) {
            _toggleLog = util_forceBool($cacheManager.Options["ToggleLogs"], _toggleLog);
        }

        if (_toggleLog) {
            util_log(msg);
        }
    }
};


var CACHE_STATUS_PROPER_NAME = [];

CACHE_STATUS_PROPER_NAME[0] = 'uncached';
CACHE_STATUS_PROPER_NAME[1] = 'idle';
CACHE_STATUS_PROPER_NAME[2] = 'checking';
CACHE_STATUS_PROPER_NAME[3] = 'downloading';
CACHE_STATUS_PROPER_NAME[4] = 'updateready';
CACHE_STATUS_PROPER_NAME[5] = 'obsolete';


if (CACHE_MANAGER.AppCache && CACHE_MANAGER.ToggleCache) {
    var _appCache = $(CACHE_MANAGER.AppCache);

    _appCache.on("cached", $cacheManager.OnCached);
    _appCache.on('checking', cache_logger);
    _appCache.on('downloading', cache_logger);
    _appCache.on('error', cache_logger);
    _appCache.on('noupdate', $cacheManager.OnNoUpdate);
    _appCache.on('obsolete', cache_logger);
    _appCache.on('progress', cache_logger);
    _appCache.on('updateready', $cacheManager.OnUpdateReady);
}


$(function () {    
});

$(document).on("offline", function (e) {
    app_state_change(false);
    $cacheManager.ClearUpdateInterval();
});

$(document).on("online", function (e) {
    app_state_change(true);
    $cacheManager.StartUpdateInterval();
});

function cache_init(callback) {

    var _callback = function () {

        if (callback) {
            callback();
        }
    };

    util_isOnline(function (isOnline) {

        if (!isOnline) {

            //copy the session data from the application cache into the module manager session state item
            MODULE_MANAGER.Session = CACHE_MANAGER.GetCacheItem("UserSession", null);
        }

        if (isOnline && CACHE_MANAGER.ToggleCache) {
            $cacheManager.StartUpdateInterval();
        }
        else {
            $cacheManager.ClearUpdateInterval();
        }

        _callback();

    }, CACHE_MANAGER.ToggleCache == false);
}