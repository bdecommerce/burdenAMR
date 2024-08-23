/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	// The toolbar groups arrangement, optimized for two toolbar rows.
	config.toolbarGroups = [
		{ name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
		{ name: 'editing',     groups: [ 'find', 'selection' ] },
		{ name: 'links' },
		{ name: 'insert' },
		{ name: 'forms' },
		{ name: 'tools' },
		{ name: 'document',	   groups: [ 'mode', 'document', 'doctools' ] },
		{ name: 'others' },
		'/',
		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
		{ name: 'paragraph',   groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
		{ name: 'styles' },
		{ name: 'colors' }
	];

	config.removeButtons = 'Styles,Source,Paste,PasteText,PasteFromWord';

	// Set the most common block elements.
	config.format_tags = 'p;h1;h2;h3;pre';

	// Simplify the dialog windows.
	config.removeDialogTabs = 'image:advanced;link:advanced';
	config.removePlugins = "sourcedialog,devtools";

	config.title = false;   //disable title tooltip from being shown on inline editor container
	config.forcePasteAsPlainText = true;
	config.extraAllowedContent = {
	    div: {},
	    a: {
	        attributes: "data-rel,data-role",
	        classes: "EditorAnchorLink"
	    }
	};

	config.filebrowserUploadUrl = "<SITE_URL>home/editor.aspx";
	config.filebrowserImageUploadUrl = "<SITE_URL>home/editor.aspx?UploadType=image";    
};

CKEDITOR.on("instanceReady", function () {

    //configure default label text (English language support only)
    var _langEN = CKEDITOR.lang["en"];

    if (_langEN && !_langEN["_isLabelInit"]) {

        _langEN["_isLabelInit"] = true;

        if (_langEN) {

            var _labelUpdates = { "image": { k: "btnUpload", v: "Upload File" }, "common": { k: "uploadSubmit", v: "Upload File" } };

            for (var _key in _labelUpdates) {
                var _item = _labelUpdates[_key];
                var _entry = _langEN[_key];
                
                _entry[_item.k] = _item.v;
            }
        }
    }
    
});