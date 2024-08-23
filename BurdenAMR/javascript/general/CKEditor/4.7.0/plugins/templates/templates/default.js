/*
 Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or http://ckeditor.com/license
*/
CKEDITOR.addTemplates("default", {
    imagesPath: CKEDITOR.getUrl(CKEDITOR.plugins.getPath("templates") + "templates/images/"),
    templates: [

        {
            title: "2-Cell Image & Text",
            image: "image_cell.png",
            html: "<table border='0' cellpadding='3' cellspacing='0'>" +
                  " <tr>" +
                  " <td valign='top'>" + "<img alt='image' src='#' />" + "</td>" +
                  " <td valign='top'>TEXT</td>" +
                  " </tr>" +
                  "</table>"
        },

        {
            title: "Center Aligned Image & Text",
            image: "align_image.png",
            html: "<table border='0' cellpadding='3' cellspacing='0'>" +
                  " <tr>" +
                  " <td align='center' valign='top' style='text-align: center;'>" +
                  "     <img alt='image' src='#' />" +
                  "     <p>TEXT</p>" +
                  " </td>" +
                  " </tr>" +
                  "</table>"
        }

    ]
});