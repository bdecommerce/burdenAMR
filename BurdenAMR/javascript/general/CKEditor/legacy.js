function editor_configureConfig(config) {
    var _isDebug = util_forceInt($.url().param("IsDebug"));
    var _removePlugins = "";
    var _viewOverrides = {};

    try {
        _viewOverrides = eval("EDITOR_VIEW_OVERRIDES");
    } catch (e) {
    }

    if (_isDebug != 1) {
        _removePlugins = 'devtools';
    }

    editor_findToolbarGroupByName(config, "editing").groups = ['find', 'selection'];
    config.removeButtons = util_forceString(_viewOverrides["removeButtons"], "");
    config.format_tags = 'p;h1;h2;h3;h4';

    //remove any plugins not needed
    config.removePlugins = _removePlugins;

    //configure the allowed content rules (i.e. attributes for tags should not be stripped away by the editor)
    config.allowedContent = true;

    //set the file upload URL
    config.filebrowserUploadUrl = "../modules/UserControls/file_upload/global/file.aspx";
    config.filebrowserImageUploadUrl = "../modules/UserControls/file_upload/global/file.aspx?IsImageUpload=1";
}

function editor_findToolbarGroupByName(config, name) {
    var _ret = {};

    for (var _group in config.toolbarGroups) {
        if (_group.name == "editing") {
            _ret = _group;
            break;
        }
    }

    return _ret;
}

function editor_configureLanguage(langSetting) {
    langSetting.image.btnUpload = "Upload File";
    langSetting.common.uploadSubmit = "Upload File";
}

function editor_init(list) {
    CKEDITOR.util = {
        CurrentDialog: function () {
            return CKEDITOR.dialog.getCurrent();
        },

        DialogGetElement: function (tabName, fieldID) {
            var _dialog = CKEDITOR.util.CurrentDialog();

            return _dialog.getContentElement(tabName, fieldID);
        },

        DialogSetValue: function (tabName, fieldID, value) {
            var _element = CKEDITOR.util.DialogGetElement(tabName, fieldID);

            _element.setValue(value);
        }
    };

    CKEDITOR.on('dialogDefinition', function (ev) {

        // the dialog name and its definition from the event data
        var _dialogName = ev.data.name;
        var _dialogDefinition = ev.data.definition;

        //util_log(_dialogName);

        // check if the definition is from the dialog window we are interested
        if (_dialogName == 'image') {
            _dialogDefinition.onShow = function () {
            };
        }
    });

    if (list) {
        var _defaultOptions = {};

        try {
            _defaultOptions = EDITOR_OVERRIDE_OPTIONS;
        } catch (e) {
        }

        $.each(list, function (index) {
            var _element = $(this);
            var _options = util_cloneObject(_defaultOptions, {});
            var _fnOptions = _element.attr(CONTROL_EDITOR_EVENT_CALLBACK_OPTIONS);
            var _fnLoadComplete = _element.attr(CONTROL_EDITOR_EVENT_CALLBACK_LOAD_COMPLETE);

            if (util_isFunction(_fnOptions)) {
                _fnOptions = eval(_fnOptions);

                _options = _fnOptions(_element, _options);
            }

            //HACK: for the page unload (i.e. switching between different modules such as to a popup based module view) results in exception error of the following:
            //  "The editor instance 'XXX' is already attached to the provided element."
            //Using try-catch statement to suppress this exception.
            try {

                //Note: must pass native DOM element and not JQuery object to CKEditor function
                CKEDITOR.replace(this, _options);
            } catch (e) {
            }            

            if (util_isFunction(_fnLoadComplete)) {
                _fnLoadComplete = eval(_fnLoadComplete);

                _fnLoadComplete(_element);
            }
        });
    }
}

function editor_onFileUploadError(e) {
    switch (e.target.error.code) {
        case e.target.error.NOT_FOUND_ERR:
            alert("The specified file was not found. Please try again.");
            break;
        case e.target.error.NOT_READABLE_ERR:
            alert("The specified file is not readable or is invalid. Please try again.");
            break;
        case e.target.error.ABORT_ERR:
            break; // noop
        default:
            alert("An unexpected error has occurred while uploading the file. Please try again.");
    };
}

var _SOURCE = null;

function editor_fileUpload() {
    var _elementFileUpload = $("#" + CKEDITOR.util.DialogGetElement("tabFileUpload", "flUpload").domId);
    var _postedFile = null;

    _postedFile = _elementFileUpload.target.files[0];

    if (_postedFile != null) {

        //read the file as a binary string, if applicable
        try {
            var _fileReader = new FileReader();

            _fileReader.error = editor_onFileUploadError;

            _fileReader.onloadstart = function (e) {

            };

            _fileReader.load = function (e) {
                var _data = _fileReader.result;

                util_log(_data);

                alert("File has been successfully uploaded.");
            }

            //read the file as a binary string
            _fileReader.readAsBinaryString(_postedFile);
        }
        catch (e) {
            //AKV TODO HANDLE ERRORS
        }
    }
    else {
        alert("Please specify a file to upload.");
    }

    return false;
}
