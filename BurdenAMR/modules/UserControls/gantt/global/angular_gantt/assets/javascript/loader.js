"use strict";

var GANTT_CHART_INSTANCE_ID = null;
var m_sectionID = null;
var m_isExport = (window.frameElement.id == "ifmGanttChartExport");
var m_module = "";
var m_reportExportType = 0;
var m_year = util_forceInt(util_queryString("ExportYearQS"), 0);
var m_isYearly = util_forceBool(util_queryString("IsYearExportQS"), false);

var m_scopeRange = {};  //local variable to track the date range min & max applicable to the Gantt chart scope

function configureGanttChart() {
    var _container = angular.element(document.querySelector("#divGanttContainer"));
    var _options = {};
    var _html = "";

    _html += "<gantt></gantt>";

    _container.html(_html);

    var _element = _container.children("gantt");

    GANTT_CHART_INSTANCE_ID = util_queryString("ChartID");
    m_sectionID = util_forceInt(util_queryString("SectionID"), 0);

    if (m_isExport == false) {
        m_isExport = util_forceBool(util_queryString("IsExport"), false);
    }

    m_module = util_forceString(util_queryString("Module"), "");
    m_reportExportType = util_forceInt(util_queryString("ReportExportType"), 0);

    if (m_isExport) {
        _element.addClass("exportGantt");
    }

    if (parent_utilIsFunction("private_gantt_GetConfiguration")) {
        _options = parent.private_gantt_GetConfiguration(GANTT_CHART_INSTANCE_ID, { "Container": _container, "IsExport": m_isExport,
            "EnableYearRange": m_isExport && m_isYearly, "ExportYearIndex": util_forceInt(util_queryString("YearExportCurrentIndexQS"), 0)
        });
    }

    if (util_isNullOrUndefined(_options)) {
        _options = {};
    }
    //configure the critical options related to chart set up    
    _options["load-data"] = "loadData = fn";
    _options["on-gantt-ready"] = "setChartData()";

    for (var _attribute in _options) {
        var _value = _options[_attribute];

        if (_value != null && _value != undefined) {
            _element.attr(_attribute, _value);
        }
    }
}

configureGanttChart();

var demoApp = angular.module('demoApp', ['gantt']);

var m_intervalID = null;


function gantt_resizeMilestoneLabels(fixedWidth, minRequiredWidth) {

    fixedWidth = util_forceInt(fixedWidth, 0);
    minRequiredWidth = util_forceInt(minRequiredWidth, 100);

    var _labelsContainer = parent.$(document.querySelector("#divGanttContainer")).find(".gantt-labels");
    var _list = _labelsContainer.find(".gantt-labels-row .ng-scope.ng-binding");
    var _decreaseStep = 1;

    var _maxWidth = 0;

    parent.$.each(_list, function (indx) {

        var _label = parent.$(this);
        var _labelWidth = _label.outerWidth();

        if (fixedWidth > 0 && _labelWidth > fixedWidth) {

            var _height = _label.closest(".gantt-labels-row").outerHeight();

            var _div = parent.$(document.createElement("div"));

            _div.attr("class", _label.attr("class"));

            _div.css("min-height", _height + "px")
                .css("padding-left", "12px")
                .css("padding-right", "12px");

            _div.css("width", fixedWidth + "px")
                .css("max-width", fixedWidth + "px")
                .css("min-width", fixedWidth + "px");

            _div.css("white-space", "normal");

            _div.html(_label.html());

            _div.insertBefore(_label);

            _label = _div;

            var _fontSize = 14;

            var _labelHeight = _div.outerHeight();

            while (_labelHeight > _height && _fontSize > 0) {

                _fontSize -= _decreaseStep;

                _div.css("font-size", _fontSize + "px");
                _labelHeight = _div.outerHeight();
            }
        }

        _maxWidth = Math.max(_maxWidth, parent.$(this).outerWidth());

    });

    if (_maxWidth > 0 && _maxWidth < fixedWidth) {

        _maxWidth = Math.max(_maxWidth, minRequiredWidth);

        var _widthCss = _maxWidth + "px";

        _labelsContainer.css("width", _widthCss)
                        .css("max-width", _widthCss)
                        .css("min-width", _widthCss);
    }
}

demoApp.controller("ctrl", ['$scope', function ($scope) {

    //if applicable force year bounds for the Gantt chart
    if (m_isExport && m_isYearly) {

        var _toDate = new Date();

        _toDate.setDate(0);
        _toDate.setMonth(11);
        _toDate.setYear(m_year);

        var _fromDate = new Date();

        _fromDate.setDate(0);
        _fromDate.setMonth(0);
        _fromDate.setYear(m_year);

        $scope.toDate = _toDate.valueOf();
        $scope.fromDate = _fromDate.valueOf();
    }

    if (parent_utilIsFunction("private_gantt_ConfigureScope")) {

        var _scope = parent.private_gantt_ConfigureScope(GANTT_CHART_INSTANCE_ID, $scope, { "IsExport": m_isExport, "EnableYearRange": m_isExport && m_isYearly,
            "SectionID": m_sectionID
        });

        if (!util_isNullOrUndefined(_scope)) {
            $scope = _scope;
        }
    }

    m_scopeRange = { "MinDate": $scope["fromDate"], "MaxDate": $scope["toDate"] };

    $scope.mode = "custom";
    $scope.maxHeight = 0;
    $scope.showWeekends = true;
    $scope.showNonWorkHours = true;


    $scope.setChartData = function () {
        var _data = [];
        var _container = angular.element(document.querySelector("#divGanttContainer"));

        var _chartDataOptions = {};

        _chartDataOptions["Container"] = _container;
        _chartDataOptions["ToggleYearExport"] = m_isYearly;
        _chartDataOptions["YearIndex"] = util_forceInt(util_queryString("YearExportCurrentIndexQS"), 0);

        if (m_module == parent.PRIVATE_PROFILE_USER_CONTROL_NAME) {

            if (parent_utilIsFunction("private_gantt_GetChartData")) {

                parent.private_gantt_GetChartData(GANTT_CHART_INSTANCE_ID, _chartDataOptions, function (data) {
                    _data = data;

                    if (util_isNullOrUndefined(_data)) {
                        _data = [];
                    }

                    $scope.loadData(_data);

                    if (parent_utilIsFunction("private_gantt_OnLoad")) {
                        parent.private_gantt_OnLoad(GANTT_CHART_INSTANCE_ID, { "Container": _container, "ChartData": _data, "IsExport": m_isExport });
                    }

                    if (m_isExport) {
                        var _iframe = parent.$("#" + GANTT_CHART_INSTANCE_ID);
                        var _tasks = parent.$(_container).find(".gantt-task-content");
                        var _isResized = 0;
                        var _hasData = 0;
                        var _attempts = 0;

                        if (util_forceBool(util_queryString("ForceImageBorder"), false)) {
                            parent.$(_container).css("border", "1px solid #CCCCCC");
                        }

                        var _intervalGanttReady = setInterval(function () {

                            var _frameIsVisible = _iframe.is(":visible");
                            _isResized = (_iframe.attr("data-attr-resize") == "1");
                            _hasData = _iframe.attr("data-attr-has-data");

                            if (m_isExport) {

                                if (_tasks.length == 0) {
                                    _tasks = _iframe.contents().find(".gantt-task-content");
                                }

                                _frameIsVisible = true;
                            }

                            if (_isResized && _iframe.length > 0 && _frameIsVisible && _tasks.length > 0 || _attempts > 20) {

                                gantt_resizeMilestoneLabels(parent.PROFILE_GANTT_FIXED_LABEL_WIDTH, m_isExport ? parent.PROFILE_GANTT_FIXED_LABEL_WIDTH : 0);

                                try {

                                    var _pct = null;

                                    if (parent.m_exportInstance.ProgressCurrent <= parent.m_exportInstance.ProgressTotal && parent.m_exportInstance.ProgressTotal > 0) {
                                        _pct = (parent.m_exportInstance.ProgressCurrent / (parent.m_exportInstance.ProgressTotal * 1.00)) * 100.00;
                                    }

                                    parent.setExportProgressPct({ "Message": (_pct != null ? "Generating chart..." : "Generate report..."), "Pct": _pct });
                                } catch (e) {
                                }

                                clearInterval(_intervalGanttReady);
                                _hasData = _iframe.attr("data-attr-has-data");

                                var _fnEndExportCallback = function (successExport) {

                                    var _isYearExport = m_isYearly;
                                    var _currentIndex = util_forceInt(util_queryString("YearExportCurrentIndexQS"), 0);
                                    var _hasGanttExportFn = (parent && parent.exportGanttChart);

                                    if (successExport == false && !_isYearExport) {

                                        //an error has occurred in processing the Gantt chart (as one whole image), so force year export
                                        if (_hasGanttExportFn) {
                                            parent.exportGanttChart({ "ReportExportType": m_reportExportType, "ToggleYearExport": true });
                                        }
                                    }
                                    else if (successExport == true && _isYearExport) {

                                        //iterate the next set of data for the year export
                                        if (_hasGanttExportFn) {
                                            parent.exportGanttChart({ "ReportExportType": m_reportExportType, "ToggleYearExport": true,
                                                "YearExportIndex": (_currentIndex + 1), "IsUpdateProgress": true
                                            });
                                        }
                                    }
                                    else {
                                        if (parent && parent.onProfileExport) {
                                            parent.onProfileExport(m_reportExportType, false);
                                        }
                                    }
                                };

                                if (util_forceBool(_hasData, false)) {

                                    html2canvas(_container, {

                                        onrendered: function (canvas) {

                                            setTimeout(function () {

                                                var _img = canvas.toDataURL("image/png");
                                                var _isError = (_img == "data:,");

                                                if (_isError) {
                                                    _fnEndExportCallback(false);
                                                }
                                                else {

                                                    if (parent && parent.ProjectService) {

                                                        var _yearQS = m_year;

                                                        if (!m_isYearly) {
                                                            _yearQS = "";
                                                        }

                                                        parent.ProjectService.SaveImage(_img, "Profile_GanttExport" + (_yearQS != "" ? "_" + _yearQS : ""), "png",
                                                                                       parent.ext_requestSuccess(function (data) {
                                                                                           _fnEndExportCallback(true);
                                                                                       }));
                                                    }
                                                    else {
                                                        _fnEndExportCallback(true);
                                                    }
                                                }

                                            }, 200);
                                        }
                                    });

                                } else {
                                    _fnEndExportCallback(true);
                                }
                            } else {
                                _attempts++;
                            }
                        }, 200);
                    }
                });

            }

        } else {

            //essPlan gantt chart related

            if (parent_utilIsFunction("private_gantt_GetChartData")) {

                _chartDataOptions["SectionID"] = m_sectionID;
                _chartDataOptions["IsExport"] = m_isExport;

                parent.private_gantt_GetChartData(GANTT_CHART_INSTANCE_ID, _chartDataOptions, function (data) {

                    _data = data;

                    if (util_isNullOrUndefined(_data)) {
                        _data = [];
                    }

                    $scope.loadData(_data);

                    if (parent_utilIsFunction("private_gantt_OnLoad")) {
                        parent.private_gantt_OnLoad(GANTT_CHART_INSTANCE_ID, { "Container": _container, "ChartData": _data, "IsExport": m_isExport });
                    }

                    if (parent && parent.$) {

                        //HACK: required to force the Gantt char to render properly
                        var _intervalID = null;

                        //wait for scrollbar to repaint the chart
                        _intervalID = setInterval(function () {

                            var _scrollable = parent.$(_container).find(".gantt-scrollable");

                            if (_scrollable.length > 0) {

                                _scrollable.scrollLeft(1);
                                clearInterval(_intervalID);

                                if (parent_utilIsFunction("planner_onGanttRenderTimeFrame")) {

                                    parent.planner_onGanttRenderTimeFrame({ "Container": _container, "ContentContainer": _scrollable, "SectionID": m_sectionID,
                                        "Year": m_year, "IsExport": m_isExport, "ScopeMinDate": m_scopeRange["MinDate"], "ScopeMaxDate": m_scopeRange["MaxDate"]
                                    });
                                }

                                if (m_isExport) {

                                    gantt_resizeMilestoneLabels(parent.PLANNER_GANTT_FIXED_LABEL_WIDTH, m_isExport ? parent.PLANNER_GANTT_FIXED_LABEL_WIDTH : 0);

                                    try {

                                        var _pct = null;

                                        if (parent.m_exportInstance.ProgressCurrent <= parent.m_exportInstance.ProgressTotal && parent.m_exportInstance.ProgressTotal > 0) {
                                            _pct = (parent.m_exportInstance.ProgressCurrent / (parent.m_exportInstance.ProgressTotal * 1.00)) * 100.00;
                                        }

                                        parent.setExportProgressPct({ "Message": (_pct != null ? "Generating charts..." : "Generate report..."), "Pct": _pct });
                                    } catch (e) {
                                    }

                                    if (!util_isNullOrUndefined(_data) && _data.length > 0) {

                                        var _attempts = 0;
                                        var _intervalGanttReady = setInterval(function () {

                                            var _iframe = parent.$mobileUtil.GetElementByID(GANTT_CHART_INSTANCE_ID);
                                            var _tasks = parent.$(_container).find(".gantt-task-content");
                                            var _frameIsVisible = _iframe.is(":visible");
                                            var _isResized = (_iframe.attr("data-attr-resize") == "1");

                                            if (m_isExport) {

                                                if (_tasks.length == 0) {
                                                    _tasks = _iframe.contents().find(".gantt-task-content");
                                                }

                                                _frameIsVisible = true;
                                            }

                                            //parent.util_log(_isResized + " && " + (_iframe.length > 0) + " && " + _frameIsVisible + " && " + (_tasks.length > 0) + " || " + _attempts);

                                            if (_isResized && _iframe.length > 0 && _frameIsVisible && _tasks.length > 0 || _attempts > 20) {

                                                clearInterval(_intervalGanttReady);

                                                html2canvas(_container, {

                                                    onrendered: function (canvas) {

                                                        setTimeout(function () {

                                                            var img = canvas.toDataURL("image/png");

                                                            if (parent && parent.ProjectService) {

                                                                var _yearQS = m_year;
                                                                var _exportSectionIndex = util_forceInt(util_queryString("YearExportCurrentIndexQS"), -1);

                                                                if (!m_isYearly) {
                                                                    _yearQS = "";
                                                                }

                                                                parent.ProjectService.SaveImage(img, "GanttChart_" + m_sectionID + (_yearQS != "" ? "_" + _yearQS : ""), "png",
                                                                                                parent.ext_requestSuccess(function (data) {

                                                                                                    setTimeout(function () {

                                                                                                        //process the next available chart for the current export instance
                                                                                                        parent.planner_exportChartInstance({ "Index": _exportSectionIndex,
                                                                                                            "IsUpdateProgress": true
                                                                                                        });

                                                                                                    }, 50);

                                                                                                }));
                                                            }
                                                        }, 200);
                                                    }
                                                });
                                            }
                                            else {

                                                _attempts++;
                                            }

                                        }, 1000);

                                    }
                                }
                            }
                        }, 500);
                    }
                });
            }
        }
    };
} ]);
