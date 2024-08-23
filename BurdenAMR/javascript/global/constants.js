var APP_NAME = "<APP_NAME_JS>";
var APP_VERSION = "<APP_VERSION>";
var PROJECT_CACHE_VERSION = "<PROJECT_CACHE_VERSION>";

////////////////////////////////////////////////////////////////////////////////////////////////
//Application settings for web service
//Note: for production environment disable debug mode and ensure suppress failure is set to true
var IS_DEBUG = true;
var IS_SUPPRESS_FAILURE = true;
var DEBUG_OFFLINE_MODE = false;
////////////////////////////////////////////////////////////////////////////////////////////////

var enCCanvasRenderType = {
    "Line": 10,
    "Arc": 20
};


/************************************************************************************/
/************************** Application Field Constants *****************************/
/************************************************************************************/
var KEY_CODES = { "ESC": 27, "ENTER": 13, "TAB": 9, "BACKSPACE": 8, "DELETE": 46, "SPACE": 32 };

var enCDialogMode = {
    "Normal": 0,
    "Small": 10,
    "Wide": 20,
    "FullScreen": 30
};

var enCConsoleLogType = {
    "DEBUG": 10,
    "ERROR": 20
};

var enCMessageType = {
    "Message": 10,
    "Error": 15,
    "UserError": 20,
    "Critical": 25
};

var MSG_DEFAULT_SELECT_ITEM = "--Please select one--";  //default text to display for any dropdownlists (first default item)
var DEFAULT_DATA_ITEM_INVALID = "The requested item is invalid or no longer exists."; //default text for an invalid ID associated to an edit item
var NA = "NA";
var NOT_APPLICABLE = "N/A";
var BUTTON_CONFIG = {
    "Save": { ID: 2, Text: "Save" },
    "Cancel": { ID: 4, Text: "Cancel" },
    "Delete": { ID: 6, Text: "Delete" },
    "Close": { ID: 8, Text: "Close" },
    "CancelCustom": { ID: 10, "Text": "Cancel" }
};

var MSG_CONFIG = {
    "ListNoRecords": "No records were found.",
    "ListDeleteTitle": "Delete Item(s)",
    "ListDeleteConfirmMsg": "Are you sure you want to delete the selected item(s)?",
    "ItemDeleteConfirmMsg": "Are you sure you want to delete the selected item?",
    "ItemNotFound": "Some other user has modified this item and it no longer exists in the application.",
    "DialogEditTitle": "Edit Item",
    "DialogDefaultTitle": "Dialog",
    "LinkAddNew": "Add New...",
    "LinkEdit": "Edit",
    "UnexpectedError": "An unexpected error has occurred while processing your request. Please try again.",
    "OfflineFeatureNoAccess": "This feature is not available in offline mode. Please verify your internet connection and try again.",
    "SaveUserConflict": "Some other user has modified this item since you started editing it. Please re-edit the item again.",
    "UnauthorizedAccess": "You are not authorized to access this feature. If this is a mistake, please contact the website Administrator."
};

var enCDelegateType = {
    "SubFooterClick": 10,
    "Repeater": 20,
    "PageLoaded": 30,
    "PageUnload": 40,
    "SwipeLeft": 50,
    "SwipeRight": 52,
    "KeyEsc": 100
};

var enCDelayType = {
    "Slow": 10,
    "Normal": 20,
    "Fast": 30
};

var enCPageRefreshMode = {
    "None": 0,
    "View": 10,
    "Window": 20,
    "Controller": 100
};

var enCLayoutType = {
    "None": 0,
    "Global": 10,
    "Private": 20,
    "Dialog": 30
};

var enCDialogConfirmViewType = {
    "OK_Cancel": 10,
    "YesNo": 20
};

var NOTIFICATION_BUTTON_CONFIG = {
    "OK": { ID: 2, Text: "OK" },
    "Yes": { ID: 4, Text: "Yes" },
    "No": { ID: 6, Text: "No" },
    "Cancel": { ID: 8, Text: "Cancel" }
};

var CSS_OVERRIDE_DATEPICKER_ZINDEX = 1000000;

/************************************************************************************/
/******************************* Entity Field Mappings ******************************/
/************************************************************************************/
var ENTITY_METADATA = {
    "LookupEntityTypeName": {},
    "LookupArchivableConfiguration": {}
};

/************************************************************************************/
/******************************* Data Attributes ************************************/
/************************************************************************************/

var DATA_ATTRIBUTE_RENDER = "data-attr-render";
var DATA_ATTRIBUTE_RENDER_EXT = "data-attr-render-ext"; //extended renderer to allow an additional renderer to be applied to an element (other than default above)
var DATA_ATTRIBUTE_RENDER_OVERRIDE = "data-attr-render-override";   //flag that the renderer should not be applied to the element (override)
var DATA_ATTRIBUTE_RENDER_REFRESH = "data-attr-render-refresh";   //flag that the renderer element should be refreshed and not created (update the renderer)
var DATA_ATTRIBUTE_SUPPRESS_LOAD_BIND = "data-attr-render-is-suppress-load-bind"; //tristate value to disable page load's bind of renderer related events (such as data admin list)
var DATA_ATTRIBUTE_CONTEXT_HREF = "data-attr-context-href";
var DATA_ATTRIBUTE_CONTEXT_HREF_TEMP_SOURCE = "data-attr-context-href-temp-source";   //the source context href as related to replace module view feature
var DATA_ATTRIBUTE_DIALOG_MODE = "data-attr-dialog-mode";
var DATA_ATTR_DIALOG_IS_NO_CONFLICT_VIEW = "data-attr-dialog-no-conflict-view"; //tristate value
var DATA_ATTR_DEFAULT_VALUE = "data-attr-default";
var DATA_ATTR_PAGE_REFRESH_MODE = "data-attr-page-refresh-mode";
var DATA_ATTR_PAGE_FORCE_NO_REFRESH_DEFAULT = "data-attr-page-no-refresh-default";
var DATA_ATTR_INPUT_FIELD = "data-attr-field";
var DATA_ATTR_TEMPLATE = "data-attr-template"; //flag an element for a control specific functionality as a template placeholder
var DATA_ATTR_PLUGIN_INSTANCE = "data-attr-plugin-instance";    //the JavaScript variable for the context based instance of the plugin
var DATA_ATTR_PLUGIN_INSTANCE_REFERENCE = "data-attr-plugin-instance-reference";    //the JavaScript variable for the context based instance of the plugin
                                                                                    //(this is an indirect reference for elements not within the container of the plugin)

var DATA_ATTR_MODULE_PARAMS_DOM_SELECTOR = "data-attr-module-params-dom-search-selector";   //data attribute as jQuery selector of closest element with ELEMENT_DOM_DATA_MODULE_PARAMS data

var DATA_ATTR_POPUP_CONTENT = "data-attr-popup-content";    //the ID of the element from which to load the HTML from
var DATA_ATTR_POPUP_SOURCE_ELEMENT = "data-attr-popup-source-element-id";   //the invoking link element ID (or content ID if element ID is not specified) that has opened the popup
var DATA_ATTR_POPUP_EVENT_CALLBACK_OPEN = "data-attr-popup-event-callback-open";  //the Javascript callback code to evaluate when the popup is opened
var DATA_ATTR_POPUP_EVENT_CALLBACK_CLOSE = "data-attr-popup-event-callback-close"; //the Javascript callback code to evaluate when the popup is closed
var DATA_ATTR_POPUP_POSITION_FORCE_ABSOLUTE = "data-attr-popup-is-force-absolute";  //whether the popup should be disabled relative to invoking element or absolute to screen
var DATA_ATTR_POPUP_POSITION_X = "data-attr-popup-position-x";  //the x position to force the popup content (rather than being relative to source link)
var DATA_ATTR_POPUP_POSITION_Y = "data-attr-popup-position-y";  //the y position to force the popup content (rather than being relative to source link)
var DATA_ATTR_POPUP_DISABLED = "data-attr-popup-is-disabled"; //whether the popup is disabled and the click event should be disregarded (enCETriState value required)

var DATA_ATTR_POPUP_LINKS_EVENT_CALLBACK_ITEMS = "data-attr-popup-links-fn";  //the Javascript callback to retrive the array of group items and associated settings for the links

var DATA_ATTR_POPUP_LINKS_IS_DASHBOARD_MODE = "data-attr-popup-links-is-dashboard-mode";    //whether to use the dashboard placeholder layout for the admin links callout
var DATA_ATTR_POPUP_LINKS_DASHBOARD_OPENS_CALLBACK = "data-attr-popup-links-dashboard-options-callback";    //the Javascript callback function to to get render options

var DATA_ATTR_PAGE_MESSAGE_PRESERVE = "data-attr-message-preserve"; //data attribute to flag the active page and how it should handle automatic clear of messages for service requests

var REPEATER_CSS = "CRepeater";
var REPEATER_CSS_INDICATOR_SORT = "RepeaterIndicatorSort";
var REPEATER_CSS_NO_RECORDS_CONTAINER = "CRepeaterNoRecords";

var CONTROL_ATTR_REPEATER_SORT_COLUMN = "data-attr-repeater-sort-column";   //current sort column
var CONTROL_ATTR_REPEATER_SORT_LINK = "data-attr-sort-link";
var CONTROL_ATTR_REPEATER_SORT_ENUM = "data-attr-repeater-sort-enum";   //the enum type name used for the column sorting; required!
var CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN = "data-attr-sort-link-column";
var CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN_HAS_TOOLTIP = "data-attr-sort-link-column-has-tooltip";
var CONTROL_ATTR_REPEATER_SORT_LINK_COLUMN_IS_TOOLTIP_TITLE_FORMAT = "data-attr-sort-link-column-is-tooltip-title-format";

var CONTROL_DATA_ATTR_PLACEHOLDER_TYPE = "data-cattr-type"; //flag an element as a specific placeholder type for control specific markup

var CONTROL_DATA_ATTR_TOGGLE_LINK_STATE = "data-cattr-toggle-state-link"; //stores the state of "Select/Uncheck All" value for a toggle link

var CONTROL_DATA_ATTR_POPUP_LINKS_ITEM_ID = "data-cattr-popup-link-id"; //attribute containing metadata for a link within the popup_links renderer (used as custom indentifier)

var CONTROL_DATA_ATTR_WATERMARK_TOGGLE_CLASS = "data-cattr-watermark-class"; //attribute for the CSS class to toggle when a watermark input state is required

var CONTROL_IMAGE_LINK_URL = "data-cattr-img-link-url"; //default image URL for the image link up state
var CONTROL_IMAGE_LINK_HOVER_URL = "data-cattr-img-link-hover-url"; //overrides the image URL for the image link hover state, if needed
var CONTROL_IMAGE_LINK_WIDTH = "data-cattr-img-link-width"; //width of the image link
var CONTROL_IMAGE_LINK_HEIGHT = "data-cattr-img-link-height"; //height of the image link
var CONTROL_IMAGE_LINK_NO_LINK_CLASS = "data-cattr-img-link-no-link-override"; //the override CSS class that flags whether the image link is in a disabled state 
                                                                               //(i.e. disable mouse over image replacement)

var CONTROL_TAB_GROUP_HEADER = "data-cattr-tab-group-header";   //specifies an element that contains the text for the tab group header link item (value must equal 1; bit value true)
var CONTROL_TAB_GROUP_HEADER_LINK_ID = "data-cattr-tab-group-header-content-id";   //the data attribute value to associate a header link to a tab group content
var CONTROL_TAB_GROUP_CONTENT_ID = "data-cattr-tab-content-id";   //flag an element as a content template that contains a matching value to a header link ID

var CONTROL_DATA_ATTR_DATEPICKER_DEFAULT = "data-attr-datepicker-default";  //default selected date for the datepicker
var CONTROL_DATA_ATTR_DATEPICKER_IS_EDIT_MODE = "data-attr-datepicker-is-edit-mode";  //whether to allow edits on datepicker text input OR clear selected value on Delete/Backspace key

var CONTROL_DATA_ATTR_RATING_MIN = "data-rateit-min";
var CONTROL_DATA_ATTR_RATING_MAX = "data-rateit-max";
var CONTROL_DATA_ATTR_RATING_VALUE = "data-rateit-value";
var CONTROL_DATA_ATTR_RATING_READONLY = "data-rateit-readonly";
var CONTROL_DATA_ATTR_RATING_RESETABLE = "data-rateit-resetable";
var CONTROL_DATA_ATTR_RATING_ISPRESET = "data-rateit-ispreset";
var CONTROL_DATA_ATTR_RATING_ONRATE = "data-rateit-onrate";
var CONTROL_DATA_ATTR_RATING_STEP = "data-rateit-step";
var CONTROL_DATA_ATTR_RATING_ONRESET = "data-rateit-onreset";

var CONTROL_FLIP_SWITCH_ON_TEXT = "data-cattr-flip-switch-text-on"; //optional text that will override the text placeholder for On state
var CONTROL_FLIP_SWITCH_OFF_TEXT = "data-cattr-flip-switch-text-off"; //optional text that will override the text placeholder for Off state
var CONTROL_FLIP_SWITCH_ASSOCIATE_ID = "data-cattr-flip-switch-associate-id"; //attribute specified for the renderer container to be copied to the created flip switch widget
var CONTROL_FLIP_SWITCH_TOGGLE_PERSISTENT_ID = "data-cattr-toggle-persistent-id";   //whether to toggle "id" for flip switch post render to be persistent via container
var CONTROL_DATA_ATTR_FLIP_SWTICH_ELEMENT_ID = "data-cattr-flip-switch-element-id"; //store the persistent element ID for the flip switch

var CONTROL_LIST_SELECTION_HEADER_SOURCE = "data-cattr-list-selection-header-source";    //header text to display for the source/available section
var CONTROL_LIST_SELECTION_HEADER_DEST = "data-cattr-list-selection-header-dest";    //header text to display for the destination/selected section
var CONTROL_LIST_SELECTION_SEARCH_TOGGLE_SEARCH = "data-cattr-list-selection-toggle-search";   //toggle the search/filter text input for the sections (enCETriState value required)
var CONTROL_LIST_SELECTION_SEARCH_PLACEHOLDER = "data-cattr-list-selection-search-placeholder";   //placeholder text to display for the filter text input
var CONTROL_LIST_SELECTION_SEARCH_REVEAL = "data-cattr-list-selection-search-reveal";   //whether to auto-hide all the list items when the search field is blank  or not
var CONTROL_LIST_SELECTION_EVENT_CALLBACK_LINK_CLICK = "data-cattr-list-selection-fn";  //the Javascript callback to execute when a link is clicked
                                                                                        //(will be passed element and metadata options as parameters)

var CONTROL_LIST_SELECTION_DATA_SOURCE = "data-cattr-list-selection-source";    //containing element with data items to be populated for the source list view
var CONTROL_LIST_SELECTION_DATA_DEST = "data-cattr-list-selection-dest";    //containing element with data items to be populated for the dest list view
var CONTROL_LIST_SELECTION_DATA_ITEM = "data-cattr-list-selection-data";    //child element that is flagged as a list item data source (value must equal 1; bit value true)
                                                                            //i.e. for a source/dest container this attribute flags an element to be included as data for list view

var CONTROL_LIST_SELECTION_ITEM_TEMPLATE = "data-cattr-list-selection-item-template";    //containing element whose HTML content will be used for the list view items (item template)
var CONTROL_LIST_SELECTION_ITEM_ID = "data-cattr-list-selection-item-id"; //attribute of element that contains the filter ID to be used when rendering the list view item

var CONTROL_LIST_SELECTION_LINK_ID = "data-cattr-list-selection-link-id";   //anchor element link attribute for the associated filter ID (post process rendered)
var CONTROL_LIST_SELECTION_LINK_TYPE_SOURCE = "data-cattr-list-selection-link-type-is-source";   //anchor element link attribute for the associated filter type 
                                                                                                 //(whether from source or dest list view; post process rendered)

var CONTROL_FILE_UPLOAD_UPLOADED_FILE_NAME = "data-cattr-fileupload-uploaded-filename"; //the attribute containing the uploaded file name (post process of file uploaded successfully)
var CONTROL_FILE_UPLOAD_UPLOADED_ORIGINAL_FILE_NAME = "data-cattr-fileupload-original-filename"; //the attribute containing the original name (from the file uploaded by the user)
                                                                                                 //(post process of file uploaded successfully)
var CONTROL_FILE_UPLOAD_IS_FORCE_UPLOAD_ON_CHANGE = "data-cattr-fileupload-is-upload-on-change";    //whether to upload the file as soon as user selects a fle with the file browser input
                                                                                                    //(enCETriState value required)
var CONTROL_FILE_UPLOAD_MAX_SIZE_KB = "data-cattr-fileupload-max-file-size-kb"; //the maximum size to allow for a file uplaod (if not supplied it will use the web.config limit)
var CONTROL_FILE_ON_UPLOAD_SUCCESS_CALLBACK = "data-cattr-fileupload-on-upload-callback-fn"; //the Javascript callback to execute when a file is successfully uploaded (optional)

var CONTROL_FILTER_TEXT_HEADING = "data-cattr-filter-text-heading"; //heading text to show for the filterable content (optional)
var CONTROL_FILTER_TEXT_SEARCH_PLACEHOLDER = "data-cattr-filter-text-search-placeholder";   //placeholder text for the search text input (optional)
var CONTROL_FILTER_TEXT_CONFIG_EVENT_DATASOURCE = "data-cattr-filter-text-datasource-fn";   //the Javascript callback to execute to obtain the data items for the filterable text
var CONTROL_FILTER_TEXT_CONFIG_EVENT_ITEM_HTML = "data-cattr-filter-text-item-html-fn";   //the Javascript callback to execute to get the HTML contents for a data item
var CONTROL_FILTER_TEXT_CONFIG_EVENT_NO_ITEMS_HTML = "data-cattr-filter-text-no-items-html-fn";   //the Javascript callback to execute to get the default HTML contents when an empty data 
                                                                                                  //source is specified
var CONTROL_FILTER_TEXT_CONFIG_EVENT_SEARCH_REFRESH = "data-cattr-filter-text-search-refresh-fn";   //the Javascript callback to execute once filterable text compltes search action
var CONTROL_FILTER_TEXT_SEARCH_DISPLAY_ALL = "data-cattr-filter-text-display-all-search";   //show all data items if no search criteria provided (enCETriState value required)
var CONTROL_FILTER_TEXT_SHOW_SEARCH_SWITCH = "data-cattr-filter-text-search-switch";    //toggle switch between show all or nothing for invalid empty search criteria

var CONTROL_TABLE_APPLY_ATTRIBUTE_FILTER = "data-cattr-table-apply-attribute-filter";    //whether to search for even/odd attributes and apply related rendering 
                                                                                         //(enCETriState value required)
var CONTROL_TABLE_OVERRIDE_ATTRIBUTE_EVEN_ROW = "data-cattr-table-even-row";    //overrides filter to apply even row style to the element containing the attribute
var CONTROL_TABLE_OVERRIDE_ATTRIBUTE_ODD_ROW = "data-cattr-table-odd-row";    //overrides filter to apply even odd style to the element containing the attribute

var CONTROL_EDITOR_EVENT_CALLBACK_OPTIONS = "data-cattr-editor-options-fn";  //the Javascript callback to obtain the CKEditor override options
                                                                             //(will be passed target element and default options as parameters)
var CONTROL_EDITOR_EVENT_CALLBACK_LOAD_COMPLETE = "data-cattr-editor-load-fn";  //the Javascript callback to execute when the CKEditor has been loaded 
                                                                                //(will be passed the target element)
var CONTROL_EDITOR_EVENT_CALLBACK_INSTANCE_READY = "data-cattr-editor-instance-ready-fn";  //the Javascript callback to execute when the CKEditor instance is ready and configured
                                                                                           //(will be passed the target element and editor object instance)

var DATA_ATTR_CONTROL_EDITOR_IS_INLINE_EDITABLE = "data-cattr-editor-is-inline-editable";  //whether to allow inline editable editor (enCETriState value required; default None)

var CONTROL_TAB_STRIP_EVENT_CALLBACK_ITEMS = "data-cattr-tab-strip-items-fn";  //the Javascript callback to obtain the tap strip header items (will be passed target element)
var CONTROL_TAB_STRIP_EVENT_CALLBACK_HEADER_CLICK = "data-cattr-tab-strip-header-click-fn";  //the Javascript callback to execute when the header is clicked 
                                                                                             //(will be passed: element, ID, elementTabContainer, callback)
var CONTROL_VIDEO_WIDTH = "data-cattr-video-width"; //width of the video container iframe
var CONTROL_VIDEO_HEIGHT = "data-cattr-video-height"; //height of the video container iframe
var CONTROL_VIDEO_IS_TOGGLE_CONTROLS = "data-cattr-video-is-toggle-controls"; //whether to toggle video player controls (enCETriState value required)
var CONTROL_VIDEO_IS_AUTO_PLAY = "data-cattr-video-is-auto-play"; //whether to automatically start playing the video (enCETriState value required)
var CONTROL_VIDEO_IS_PRE_LOAD = "data-cattr-video-is-preload"; //whether to preload the video file (enCETriState value required)
var CONTROL_VIDEO_IS_LOOP = "data-cattr-video-is-loop"; //whether to continuously repeat play the video in a loop (enCETriState value required)
var CONTROL_VIDEO_SOURCE_MP4 = "data-cattr-video-source-mp4"; //the source URL for the MP4 video file
var CONTROL_VIDEO_SOURCE_WEBM = "data-cattr-video-source-webm"; //the source URL for the WEBM video file
var CONTROL_VIDEO_SOURCE_OGG = "data-cattr-video-source-ogg"; //the source URL for the OGG (file extension .ogv) video file
var CONTROL_VIDEO_POSTER_URL = "data-cattr-video-poster-url"; //the URL for the poster image for the video file

var CONTROL_SLIDESHOW_IMAGE_FORMAT_URL = "data-cattr-slideshow-img-url";    //the URL for the images used in the slide show with token for slide index within URL of "TOKEN_SLIDE_INDEX"
var CONTROL_SLIDESHOW_NUM_SLIDES = "data-cattr-slideshow-num-slides";   //the number of total slides for the slideshow
var CONTROL_SLIDESHOW_IMAGE_WIDTH = "data-cattr-slideshow-image-width"; //the width of each image for the slideshow
var CONTROL_SLIDESHOW_IMAGE_HEIGHT = "data-cattr-slideshow-image-height"; //the width of each image for the slideshow
var CONTROL_SLIDESHOW_CURRENT_SLIDE_INDEX = "data-cattr-slideshow-current-index";   //the current slide index (within 0 to max slide items); default starting slide
var CONTROL_SLIDESHOW_NAV_BUTTON_TYPE = "data-cattr-slideshow-nav-button-type"; //the button type to display for the slideshow navigation container, must be one of: 
                                                                                //  "link" (prev/next button), "dot" (display each slide number button), 
                                                                                //  "none" (no navigation control displayed)
var CONTROL_SLIDESHOW_NAV_BUTTON_DATA_THEME = "data-cattr-slideshow-nav-button-data-theme"; //the jQuery mobile swatch to apply to the navigation buttons (default "a")
var CONTROL_SLIDESHOW_TOGGLE_TIMER = "data-cattr-slideshow-toggle-timer";   //whether to automatically switch to the next image for the slideshow (enCETriState value required)
var CONTROL_SLIDESHOW_TIMER_DELAY = "data-cattr-slideshow-timer-delay"; //duration in milliseconds to load the next image for slideshow timer (default/min value: 1000);
var CONTROL_SLIDESHOW_TOGGLE_IMAGE_CLICK = "data-cattr-slideshow-toggle-cycle-click";   //whether to automatically switch to the next image by clicking the image (enCETriState value required)
var CONTROL_SLIDESHOW_TRANSITION = "data-cattr-slideshow-transition";   //the type of transition to use when displaying a slide. Possible values are:
                                                                        // "fade" (default), "slide_horizontal", "slide_vertical", "none"
var CONTROL_SLIDESHOW_EVENT_CALLBACK_NAV_TEMPLATE_HTML = "data-cattr-slideshow-nav-button-template-fn";  //the Javascript callback to retrive the HTML nav button template
                                                                                                         //Note: root element must have placeholder token of:
                                                                                                         //     SLIDESHOW_TOKEN_DATA_ATTRIBUTES : data attribute placeholder (e.g. go to link)
                                                                                                         //     SLIDESHOW_TOKEN_PAGE_NO_TEXT : HTML encoded text for the page no (dot mode)

var CONTROL_SPRITE_DEFAULT_IMAGE_URL = "data-cattr-sprite-default-img"; //the default placeholder image to use while loading the sprite images
var CONTROL_SPRITE_IMAGE_WIDTH = "data-cattr-sprite-image-width"; //the width of each image for the sprite
var CONTROL_SPRITE_IMAGE_HEIGHT = "data-cattr-sprite-image-height"; //the width of each image for the sprite
var CONTROL_SPRITE_EVENT_CALLBACK_IMAGE_SOURCE = "data-cattr-sprite-image-source-fn";  //the Javascript callback to retrive the array of strings of the image sources
var CONTROL_SPRITE_EVENT_CALLBACK_IMAGE_LOAD = "data-cattr-sprite-image-load-fn";  //the Javascript callback to execute when an image is loaded
var CONTROL_SPRITE_FRAME_RATE = "data-cattr-sprite-frame-rate"; //the frame rate in milliseconds of the animation

//model specific data attributes
var DATA_ATTR_MODEL_REF_NAME = "data-attr-model-ref-name";  //reference name from the model's list of available references
var DATA_ATTR_MODEL_REF_INDEX = "data-attr-model-ref-index";  //reference index to retrieve value for a reference from the model's list of available references

var DATA_ATTR_MODEL_INPUT_IS_EDITABLE = "data-attr-model-input-editable";  //whether to display it as a "label" or editable input (enCETriState value required)

var DATA_ATTR_MODEL_RESTORE_DEFAULT_MODEL_TAG = "data-attr-model-restore-default-tag";   //the tag name for restoring the model default values related to default scenario data
var DATA_ATTR_MODEL_RESTORE_DEFAULT_SECTION_NAME = "data-attr-model-restore-default-section";   //the name of the section to restore default values (use blank value to restore all defaults)
var DATA_ATTR_MODEL_RESTORE_DEFAULT_FROM_SCENARIO = "data-attr-model-restore-default-from-scenario";   //whether to restore the default values from current scenario or default model
                                                                                                       //(enCETriState value required; None enum value not supported)
var DATA_ATTR_MODEL_RESTORE_DEFAULT_IS_CONFIRM = "data-attr-model-restore-default-confirm";   //whether to display confirmation message for restoring the default values
                                                                                              //(enCETriState value required)
var DATA_ATTR_MODEL_RESTORE_DEFAULT_MSG = "data-attr-model-restore-default-msg";   //the text to use for the confirmation of restoring default values
var DATA_ATTR_MODEL_RESTORE_DEFAULT_CALLBACK = "data-attr-model-restore-default-callback-fn";   //the Javascript callback to callback on restore default

var DATA_ATTR_MODEL_CHART_ID = "data-attr-model-chart-id";  //the chart ID (i.e. JS function to retrieve the chart options; element is passed as parameter)
var DATA_ATTR_MODEL_WIDTH = "data-attr-model-chart-width";  //(optional) absolute width of the chart (if pct width is used as well this becomes the min chart width)
var DATA_ATTR_MODEL_HEIGHT = "data-attr-model-chart-height";  //(optional) absolute height of the chart (if pct height is used as well this becomes the min chart height)
var DATA_ATTR_MODEL_WIDTH_PCT = "data-attr-model-chart-width-pct";  //(optional) ratio between 0 and 1 for the width of the chart relative to browswer window width
var DATA_ATTR_MODEL_HEIGHT_PCT = "data-attr-model-chart-height-pct";  //(optional) ratio between 0 and 1 for the height of the chart relative to browswer window height

var DATA_ATTR_LANG_LABEL_KEY = "data-attr-lang-label-key";  //the key name for the language translation entry to lookup value for
var DATA_ATTR_LANG_LABEL_DEFAULT = "data-attr-lang-label-default";  //(optional) default value to display if the translation does not exist (i.e. the key does not exist for the translation)

var DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_SELECTED = "data-attr-editor-template-collapsible-selected";  //the index of the selected item within the group
var DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_FORCE_DEFAULT = "data-attr-editor-template-collapsible-force-default";  //whether to automatically force one group item to be visible on start 
                                                                                                                        //(enCETriState value required; default enCETriState.No)
var DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_EXCLUSIVE_TOGGLE = "data-attr-editor-template-collapsible-is-exclusive";  //whether to allow only one group item to be visble at a time (exclusive)
                                                                                                                          //(enCETriState value required; default enCETriState.Yes)
var DATA_ATTR_EDITOR_TEMPLATE_COLLAPSIBLE_GROUP_TOGGLE_ALL_TYPE = "data-attr-editor-template-collapsible-toggle-all-type";  //(optional) whether to automatically show/hide all group item contents
                                                                                                                            //(possible valid values are: "show" OR "hide")

var DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_PRES_SUBSECTION_LINK_ID = "data-pres-subsection-link-id";  //the SubsectionID to load the content for when clicked
var DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_CURRENT_SUBSECTION_LINK_ID = "data-attr-editor-template-subsection-link-current-subsection-id";  //the current SubsectionID that was loaded
                                                                                                                                               //(will be associated to link button ancestor
                                                                                                                                               // content container)
//(optional) the Javascript callback to callback after setting the HTML to the container (function will be passed "option" parameter as follows:
//  {"ID": #, "Target": obj, "HTML": "", "Container": obj, "Data": val }
var DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_LOAD_CALLBACK = "data-attr-editor-template-subsection-link-load-callback-fn";
var DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_ANCESTOR_SELECTOR = "data-attr-editor-template-subsection-ancestor-selector";   //the jQuery selector of the ancestor element to be used to
                                                                                                                              //replace the content when the subsection link is clicked 
                                                                                                                              //and external content is loaded
var DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_GET_CONTAINER_CALLBACK = "data-attr-editor-template-subsection-link-get-container-fn";   //(optional)the Javascript callback to execute to
                                                                                                                                       //get the DOM element to be used to replace the content
                                                                                                                                       //when the subsection link is clicked and external content
                                                                                                                                       //is loaded
                                                                                                                                       //(function will be passed "option" parameter as follows:
                                                                                                                                       //{"ID": #, "Target": obj, "HTML": "", "Container": null, 
                                                                                                                                       // "Data": val }
                                                                                                                                       //Note: function must return option parameter with Container
                                                                                                                                       //      DOM element; note this function if defined takes
                                                                                                                                       //      priority over the ancestor selector attribute.
var DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_FORMAT_HTML_CALLBACK = "data-attr-editor-template-subsection-link-html-callback-fn";   //(optional)the Javascript callback to execute to
                                                                                                                                     //get the formatted HTML content for the subsection load
                                                                                                                                     //(function will be passed "option" parameter as follows:
                                                                                                                                     //{"ID": #, "Target": obj, "HTML": "", "Container": obj, 
                                                                                                                                     // "Data": val }
                                                                                                                                     //Note: must return option parameter with HTML prop.
var DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_ON_CLICK_CALLBACK = "data-attr-editor-template-subsection-link-on-click-callback-fn";  //(optional) the Javascript callback to execute when the subsection
                                                                                                                                     //link is clicked to allow the click event to be disregarded 
                                                                                                                                     //(i.e. similar to prevent default via propagation)
                                                                                                                                     //(function will be passed "option" parameter as follows:
                                                                                                                                     //{"ID": #, "Target": obj }
                                                                                                                                     //Note: function can prevent default by returning object as follows:
                                                                                                                                     //      { "PreventDefault": true }

var DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_LINK_IS_INLINE = "data-attr-editor-template-subsection-link-is-inline";  //whether the subsection view should display inline

var DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_IS_EDITABLE = "data-attr-editor-template-placeholder-token-is-editable";  //whether the placeholder should have an edit button
var DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_ELEMENT_TYPE = "data-attr-editor-template-placeholder-token-element-type";  //the identifier for the child element object (such as label, button)
var DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_NAME = "data-attr-editor-template-placeholder-token-name";  //the placeholder token metadata name (i.e. identifier)
var DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_VIEW_TYPE_SIMPLE = "data-attr-ext-placeholder-token-view-type-simple";  //whether the placeholder token should display simple mode
var DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_GET_VALUE_CALLBACK = "data-attr-editor-template-placeholder-token-value-callback-fn";    //function to return the placeholder value (synchronous call)
var DATA_ATTR_EDITOR_TEMPLATE_PLACEHOLDER_TOKEN_ON_EDIT_CLICK_CALLBACK = "data-attr-editor-template-placeholder-token-edit-click-callback-fn"; //function callback to execute when edit button
                                                                                                                                               //is clicked
                                                                                                            
var DATA_ATTR_EDITOR_TEMPLATE_SUBSECTION_METADATA_TYPE_ID = "data-attr-subsection-metadata-type-id";

var DATA_ATTR_DRAG_DROP_COLUMN_GET_OPTIONS_CALLBACK = "data-attr-drag-drop-get-options-callback-fn";    //function to use to retrieve the options object to render the container
                                                                                                        //(function will be passed "option" parameter as follows:
                                                                                                        //  {"Target": obj, "Groups": [], "FnOnPostSortUpdate": null }
                                                                                                        //Note: must return option parameter with "Groups" specified with each group object formatted
                                                                                                        //      as: { "ID": "", "HeaderHTML": "", "FooterHTML": "", 
                                                                                                        //            "Items": [ {"ID": "", "HTML": "" }, ... } ] 
                                                                                                        //          }
var DATA_ATTR_DRAG_DROP_COLUMN_GROUP_CONTAINER_ID = "data-attr-drag-drop-group-id"; //data-attribute for the ID associated to a group container
var DATA_ATTR_DRAG_DROP_COLUMN_GROUP_ITEM_ID = "data-attr-drag-drop-group-item-id"; //data-attribute for the ID associated to a group item element
var DATA_ATTR_DRAG_DROP_COLUMN_GROUP_ITEM_DISABLED = "data-attr-drag-drop-group-item-disabled"; //data-attribute to flag a group item to be disabled (i.e. not drag/drop capable)

var DATA_ATTR_DATE_PICKER_IS_OVERLAY_MODE = "data-attr-date-picker-is-overlay-mode";   //(optional) tristate of whether to toggle overlay (default is enabled: enCETriState.Yes)
var DATA_ATTR_DATE_PICKER_ON_SELECTED_CALLBACK = "data-attr-date-picker-on-selected-callback-fn";   //(optional) function to call when a date is selected via the interface
var DATA_ATTR_DATE_PICKER_ON_BLUR_CALLBACK = "data-attr-date-picker-on-blur-callback-fn";   //(optional) function to call when focus is lost on the input for date picker
var DATA_ATTR_DATE_PICKER_CONFIGURE_OPTIONS = "data-attr-date-picker-config-options-callback-fn";   //(optional) function to call to configure and return the date picker default options

var DATA_ATTR_FILTER_VIEW_RENDER_OPTIONS_CALLBACK = "data-attr-filter-view-render-options-callback";

var ELEMENT_DOM_DATA_MODULE_PARAMS = "ModuleNavigationParams";

var DATA_ATTR_IS_VIEW_CONTROLLER = "data-attr-view-controller";   //tristate value of whether the DOM element has events and structure that supports a model view controller
var ELEMENT_DOM_DATA_VIEW_CONTROLLER = "controller"; //the DOM data key used to associate a controller instance object (used in conjunction with DATA_ATTR_IS_VIEW_CONTROLLER)

/************************************************************************************/
/******************************* Data Attributes ************************************/
/************************************************************************************/