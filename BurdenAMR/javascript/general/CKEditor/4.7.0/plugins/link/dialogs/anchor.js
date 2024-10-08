﻿/*
 Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or http://ckeditor.com/license
*/
CKEDITOR.dialog.add("anchor", function (c) {
    function e(b, a) {
        return b.createFakeElement(b.document.createElement("a", {
            attributes: a
        }), "cke_anchor", "anchor")
    }
    return {
        title: c.lang.link.anchor.title,
        minWidth: 300,
        minHeight: 60,
        onOk: function () {

            var _fnConfigureLink = function (lnk) {

                var _arr = [];

                if (lnk["startContainer"]) {
                    _arr.push(lnk.startContainer);
                }

                if (lnk["endContainer"]) {
                    _arr.push(lnk.endContainer);
                }

                if (_arr.length == 0) {
                    _arr.push(lnk);
                }

                for (var i = 0; i < _arr.length; i++) {
                    var _element = _arr[i];

                    _element.setAttributes({ "data-role": "none", "data-rel": "external" });
                    _element.addClass("EditorAnchorLink");
                }
                
            };

            var b = CKEDITOR.tools.trim(this.getValueOf("info", "txtName")),
                a = {
                    id: b,
                    name: b,
                    "data-cke-saved-name": b
                };
            this._.selectedElement ? this._.selectedElement.data("cke-realelement") ? (b = e(c, a), b.replace(this._.selectedElement), CKEDITOR.env.ie && c.getSelection().selectElement(b)) : this._.selectedElement.setAttributes(a) :
                (b = (b = c.getSelection()) && b.getRanges()[0], b.collapsed ? (a = e(c, a), b.insertNode(a)) : (CKEDITOR.env.ie && 9 > CKEDITOR.env.version && (a["class"] = "cke_anchor"), a = new CKEDITOR.style({
                    element: "a",
                    attributes: a
                }), a.type = CKEDITOR.STYLE_INLINE, a.applyToRange(b)))
            
            _fnConfigureLink(this._.selectedElement ? this._.selectedElement : b);

        },
        onHide: function () {
            delete this._.selectedElement
        },
        onShow: function () {
            var b = c.getSelection(),
                a;
            a = b.getRanges()[0];
            var d = b.getSelectedElement();
            d ? d.is("a") ? a = d : (a.shrink(CKEDITOR.SHRINK_ELEMENT), d = a.getEnclosedNode(), a = d.type === CKEDITOR.NODE_ELEMENT && d.is("a") &&
                d) : a = null;
            var f = (d = a && a.data("cke-realelement")) ? CKEDITOR.plugins.link.tryRestoreFakeAnchor(c, a) : CKEDITOR.plugins.link.getSelectedLink(c);
            if (f) {
                this._.selectedElement = f;
                var e = f.data("cke-saved-name");
                this.setValueOf("info", "txtName", e || "");
                !d && b.selectElement(f);
                a && (this._.selectedElement = a)
            }
            this.getContentElement("info", "txtName").focus()
        },
        contents: [{
            id: "info",
            label: c.lang.link.anchor.title,
            accessKey: "I",
            elements: [{
                type: "text",
                id: "txtName",
                label: c.lang.link.anchor.name,
                required: !0,
                validate: function () {
                    return this.getValue() ?
                        !0 : (alert(c.lang.link.anchor.errorName), !1)
                }
            }]
        }]
    }
});