(function ($) {

    $.fn.customCalendar = function (options) {

        var settings = $.extend({
            // default options
            color: "#000000",
            backgroundColor: "#ffffff",
            view: "month",
            yearTableHeaders: ["Year", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            events: [],
            showNumberOfEvents: false, //show number of events instead of individual events info
            defaultDate: new Date()
        }, options);

        var _customCalendarContainer = $("<div class='custom-calendar'></div>");
        $(this).empty();
        $(this).append(_customCalendarContainer);

        this.css({
            color: settings.color,
            backgroundColor: settings.backgroundColor
        });

        if (settings.view == "month"/* || settings.view == "week" || settings.view == "day"*/) {
            createMonthCalendar(_customCalendarContainer, settings);
        }
        else if (settings.view == "year") {
            createYearCalendar(_customCalendarContainer, settings, false);
        }
        return this;
    };

    function createMonthCalendar(container, settings) {

        var _eventsFullCalendarFormat = [];


        if (settings.showNumberOfEvents) {
            var _numEvents = 0;
            var _datesCount = [];
            $.each(settings.events, function (index, event) {
                var _dateStr = event.start.toDateString();
                if (util_isNullOrUndefined(_datesCount[_dateStr]))
                    _datesCount[_dateStr] = { date: event.start, count: 1 };
                else
                    _datesCount[_dateStr].count++;
            });
            for (var _date in _datesCount) {
                var _evFullCal = {
                    title: '' + _datesCount[_date].count,
                    start: _datesCount[_date].date,
                    allDay: true
                }
                _eventsFullCalendarFormat.push(_evFullCal);
            }
        }
        else {
            $.each(settings.events, function (index, event) {
                var _evFullCal = {
                    title: util_forceString(event.title),
                    start: event.start,
                    allDay: util_forceBool(event.allDay, false)
                }
                _eventsFullCalendarFormat.push(_evFullCal);
            });
        }

        var _settingsFullCalendar = jQuery.extend(true, {}, settings);
        _settingsFullCalendar.defaultView = settings.view;
        _settingsFullCalendar.events = _eventsFullCalendarFormat;
        _settingsFullCalendar.defaultDate = settings.defaultDate;
        $(container).fullCalendar(_settingsFullCalendar);
    }

    function createYearCalendar(container, settings, update) {

        if (update)
            $(container).find(".custom-calendar-table-annual-container").remove();

        var _startYear = util_forceInt(settings.startYear, new Date().getFullYear());
        settings.startYear = _startYear;

        var _endYear = _startYear + util_forceInt(settings.numberOfYears, 1) - 1;


        var _html = "";
        _html += "<table class='custom-calendar-table-annual'>";
        _html += "<thead>";
        _html += "<tr>";

        $.each(settings.yearTableHeaders, function (index, header) {
            _html += "<th style='width:7.7%'>" + header + "</th>";
        });
        _html += "<tr>";
        _html += "</thead>";
        _html += "<tbody>";
        for (var i = _startYear; i <= _endYear; i++) {
            _html += "<tr>";
            _html += "<td >" + i + "</td>";
            for(var j=0;j<12;j++) {
                _html += "<td>";
                if (settings.showNumberOfEvents) {
                    var _numEvents = 0;
                    $.each(settings.events, function (index, event) {
                        var _yearEvent = util_forceInt(event.start.getFullYear(), 0);
                        var _monthEvent = util_forceInt(event.start.getMonth(), 0);
                        if (i == _yearEvent && _monthEvent == j) {
                            _numEvents++;
                        }
                    });

                    _html += "<span>" + _numEvents + "</span>";
                }
                else {
                    $.each(settings.events, function (index, event) {
                        var _monthEvent = util_forceInt(event.start.getMonth(), -1);
                        if (_monthEvent > -1 && _monthEvent < 12 && _month == j) {
                            _html += "<span>" + event.title + "</span>";
                        }
                    });
                }
                _html += "</td>";
            }

            _html += "</tr>";
        }
        _html += "</tbody>";
        _html += "</table>";


        var _divTable = "<div class='custom-calendar-table-annual-container'>" + _html + "</div>";
        $(container).append(_divTable);
    }

} (jQuery));