
//BUG FIX: addresses issue with jQuery Mobile 1.3.1 and Chrome update "43.0.2357.65 m" related to popups not displaying the triggering element click
//Notes:
//  - jQueryMobile 1.3.1 implements the jQuery one() event handler attachment incorrectly
//  - calling both ("webkitAnimationEnd" and "animationend") using one() would often mean that only 1 (depending on browser) of the two handlers is ever fired leaving the other to be ignored
//  - Chrome version 43 handles both "webkitAniationEnd" and "animationend", however, only one at any given time
//    (as such this leaves the other to be ignored and fire off the next time animation on the element occurs, in the jQuery Mobile case it is on page transition animation)
$(document).bind('mobileinit', function () {

    $.fn.animationComplete = function (callback) {

        if (Modernizr.csstransitions) {

            var _event = "WebKitTransitionEvent" in window ? "webkitAnimationEnd" : "animationend";

            return $(this).one(_event, callback);
        } else {

            setTimeout(callback, 0);
            return $(this);
        }
    };

});