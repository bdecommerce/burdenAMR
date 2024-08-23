function util_queryString(keyQS, contextURL) {
    var _ret = null;

    if (util_isNullOrUndefined(contextURL)) {
        contextURL = document.location.href;
    }

    if (parent && parent.util_queryString) {
        _ret = parent.util_queryString(keyQS, contextURL);
    }

    return _ret;
}

function parent_utilIsFunction(exp) {
    var _ret = false;

    if (parent && parent.util_isFunction) {
        _ret = parent.util_isFunction(exp);
    }

    return _ret;
}