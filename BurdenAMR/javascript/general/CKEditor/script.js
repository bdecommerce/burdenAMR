function editor_init(list) {

    var _fnRemoveInstance = function (id) {
        var _ckEditorInstance = CKEDITOR.instances[id];

        if (_ckEditorInstance) {

            //bug fix: "Uncaught TypeError: Cannot read property 'isInline' of null" at CKEDITOR.focusManager
            _ckEditorInstance.focusManager.blur(true);
            _ckEditorInstance.destroy();
        }
    };

    var _fnGetEditorInstance = function (val) {

        var _id = null;

        if (typeof val === "string") {
            _id = val;
        }
        else {
            _id = $(val).attr("id");
        }

        return CKEDITOR.instances[_id];
    };

    $.each(list, function (index) {
        var $element = $(this);

        if (!$element.data("is-init-editor")) {
            $element.data("is-init-editor", true);

            $element.off("events.editor_refresh");
            $element.on("events.editor_refresh", function (e, args) {

                args = util_extend({ "Callback": null, "IsRestore": false }, args);

                var _ctrl = $element.data(ELEMENT_DOM_DATA_VIEW_CONTROLLER);

                _ctrl.Events.Refresh(args);
            });

            $element.off("events.editor_saveState");
            $element.on("events.editor_saveState", function (e, args) {

                args = util_extend({ "Callback": null, "IsReset": false }, args);

                var _ctrl = $element.data(ELEMENT_DOM_DATA_VIEW_CONTROLLER);
                var _prevState = _ctrl.Events.SaveState(args.IsReset);

                if (args.Callback) {
                    args.Callback({ "PrevState": _prevState });
                }
            });

            $element.off("events.editor_restoreState");
            $element.on("events.editor_restoreState", function (e, args) {
                args = util_extend({ "Callback": null }, args);

                var _ctrl = $element.data(ELEMENT_DOM_DATA_VIEW_CONTROLLER);
                var _prevState = _ctrl.Events.RestoreState();

                if (args.Callback) {
                    args.Callback({ "PrevState": _prevState });
                }
            });

            $element.off("events.editor_isModified");
            $element.on("events.editor_isModified", function (e, args) {

                args = util_extend({ "Callback": null }, args);

                var _modified = false;
                var _editorInstance = _fnGetEditorInstance($element);

                _modified = (_editorInstance && _editorInstance.checkDirty());

                if (args.Callback) {
                    args.Callback(_modified);
                }
            });

            $element.off("events.editor_setReadOnly");
            $element.on("events.editor_setReadOnly", function (e, args) {

                args = util_extend({ "Callback": null, "IsReadOnly": false }, args);

                var _editorInstance = _fnGetEditorInstance($element);

                if (_editorInstance) {
                    _editorInstance.setReadOnly(args.IsReadOnly);
                }

                if (args.Callback) {
                    args.Callback();
                }
            });

            $element.off("events.editor_getContent");
            $element.on("events.editor_getContent", function (e, args) {

                args = util_extend({ "Callback": null }, args);

                var _contentCallback = function (isModified, content) {
                    val = { "IsModified": isModified, "HTML": content };

                    if (args.Callback) {
                        args.Callback(val);
                    }
                };

                var _editorInstance = _fnGetEditorInstance($element);

                if (_editorInstance) {
                    _contentCallback(_editorInstance.checkDirty(), _editorInstance.getData());
                }
                else {
                    _contentCallback(false, null);
                }
            });

            $element.off("events.removeInstance");
            $element.on("events.removeInstance", function (e, args) {

                args = util_extend({ "ID": null }, args);

                try {
                    if (util_forceString(args.ID) != "") {
                        _fnRemoveInstance(args.ID);
                    }
                } catch (e) {
                }
            });

            $element.off("remove.editor_cleanup");
            $element.on("remove.editor_cleanup", function (e) {

                $element.trigger("events.removeInstance", { "ID": $(this).attr("id") });
            });
        }

        var _controller = {
            "DOM": {
                "Container": $element
            },
            "Events": {
                "Refresh": function (options) {

                    options = util_extend({ "Callback": null, "IsRestore": false }, options);

                    var _refreshCallback = function () {
                        if (options.Callback) {
                            options.Callback();
                        }
                    };

                    try {
                        var _id = $element.attr("id");
                        var _isEditable = util_forceBool($element.attr("contenteditable"), false);
                        var _isInline = false;
                        var _isInlineEditable = util_forceInt($element.attr(DATA_ATTR_CONTROL_EDITOR_IS_INLINE_EDITABLE), enCETriState.None);

                        if (!_isInline && _isInlineEditable != enCETriState.None) {

                            _isInline = true;
                            _isEditable = (_isInlineEditable == enCETriState.Yes);
                        }

                        //Note: must pass native DOM element and not JQuery object to CKEditor function
                        var _this = $element.get(0);

                        if (_isInline) {

                            $element.attr("contenteditable", _isEditable);

                            if (!_isEditable && CKEDITOR.instances[_id]) {

                                if (options.IsRestore) {

                                    //restore the state before destroying the instance
                                    $element.trigger("events.editor_restoreState", {
                                        "Callback": function () {
                                            _fnRemoveInstance(_id);
                                            _refreshCallback();
                                        }
                                    });
                                }
                                else {
                                    _fnRemoveInstance(_id);
                                    _refreshCallback();
                                }
                            }
                            else if (_isEditable && !CKEDITOR.instances[_id]) {
                                CKEDITOR.inline(_this);
                                _refreshCallback();
                            }
                            else {
                                _refreshCallback();
                            }
                        }
                        else {
                            CKEDITOR.replace(_this);
                            _refreshCallback();
                        }

                    } catch (e) {
                        _refreshCallback();
                    }
                },

                "SaveState": function (isReset) {

                    var _ret = $element.data("editor-state"); //return the previous state being replaced, if applicable
                    var _editorInstance = _fnGetEditorInstance($element);

                    if (_editorInstance) {
                        $element.data("editor-state", { "d": _editorInstance.getData() });

                        if (isReset) {
                            _editorInstance.resetDirty();
                        }
                    }

                    return _ret;
                },

                "RestoreState": function () {

                    var _ret = $element.data("editor-state"); //return the previous state being restored, if applicable
                    var _editorInstance = _fnGetEditorInstance($element);

                    if (_ret && _ret["d"] && _editorInstance) {
                        _editorInstance.setData(_ret.d);
                    }

                    return _ret;
                }
            }
        };

        $element.data(ELEMENT_DOM_DATA_VIEW_CONTROLLER, _controller);

        _controller.Events.Refresh();
        
    });
}