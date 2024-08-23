function resourceViewerJS_onInit(options) {
    options = util_extend({ "VersionNo": "", "URL": "", "Element": null }, options);

    var _versionNo = util_forceString(options["VersionNo"]);
    var _url = util_forceString(options["URL"]);
    var _element = $(options["Element"]);

    var _isReadOnly = (util_forceInt(util_queryString("IsReadOnly", _url), enCETriState.None) == enCETriState.Yes);

    //if it is in read only mode, then hide the document name and toolbars (such as download, presentation)
    if (_isReadOnly) {
        switch (_versionNo) {

            case "0.5.8":
            default:

                _element.find("#documentName, #titlebarRight")
                        .hide();
                break;
        }
    }
}