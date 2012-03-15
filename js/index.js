// Global variables from previously included scripts, make JSHint happy...
var ko = window.ko;
var FlashDetect = window.FlashDetect;

/**
 * Stream object holding relevant data
 * @constructor
 */
var Stream = function() {
    "use strict";

    this.views = ko.observable(0);
    this.title = "default";
    this.embedCode = "";
    this.screenCapUrl = "";
    this.user = "";
};

/**
 * View Model bound to the UI via knockout.js
 * @type {ViewModel}
 * @param refreshInterval Time in seconds to refresh data from jtv, "0" to disable
 */
var viewModel = function(refreshInterval) {
    "use strict";

    var streams = ko.observableArray();
    var secondsToRefresh = ko.observable(refreshInterval);
    var supportedFeatures = ko.observableArray();
    var isUpdating = false;

    var addStream = function (stream) {
        streams.push(stream);
    };

    var fromArray = function (array) {
        streams.removeAll();
        $.each(array, function (index, value) {
            var stream = new Stream();
            stream.views(value.channel_count);
            stream.user = value.channel.title;
            stream.embedCode = value.channel.embed_code;
            stream.screenCapUrl = value.channel.screen_cap_url_small;
            addStream(stream);
        });
    };

    var createStream = function (jsonObject) {
        var stream = new Stream();
        stream.views(jsonObject.channel_count);
        stream.user = jsonObject.channel.title;
        stream.embedCode = jsonObject.channel.embed_code;
        stream.screenCapUrl = jsonObject.channel.screen_cap_url_small;

        return stream;
    };

    var containsStream = function (array, stream) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].user === stream.user) {
                return true;
            }
        }
        return false;
    };

    var findStreamByUser = function(array, userName) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].user === userName) {
                return i;
            }
        }
        return -1;
    };

    var updateFromArray = function (array) {
        // Build new stream model
        var newModel = [];
        $.each(array, function (index, value) {
            newModel.push(createStream(value));
        });

        // Step 1: Delete non existing objects in the new set from the old set
        var oldModel = streams();
        /*
        $.map(oldModel, function (value, index) {
            var contains = containsStream(newModel, value);
            return contains ? value : null;
        });
        */

        streams.remove(function(item) {
           return !containsStream(newModel, item);
        });

        // Step 2: Add new objects
        $.each(newModel, function (index, value) {
            if (!containsStream(oldModel, value)) {
                addStream(value);
            }
        });

        // Step 3: Update modified objects
        //oldModel = $.extend(true, streams(), newModel);
        $.each(oldModel, function(index, value) {
            var streamIndex = findStreamByUser(newModel, value.user);
            if (streamIndex !== -1) {
                value.views(newModel[streamIndex].views());
            }
            else {
                window.console.log("ERROR: old stream not found in new set of streams");
            }
        });

        // Step 4: Rearrange by view count
        streams.sort(function(a, b) {
            return a.views() === b.views() ? 0 : (a.views() < b.views() ? 1 : -1);
        });
    };

    var updateTimerProc = function () {
        if (isUpdating) {
            return;
        }

        var seconds = secondsToRefresh() - 1;
        secondsToRefresh(seconds);
        if (seconds <= 0) {
            fetchStreams();
            secondsToRefresh(refreshInterval);
        }
    };

    var fetchStreams = function () {
        isUpdating = true;
        var url = "http://api.justin.tv/api/stream/list.json?category=gaming&strategy&meta_game=Heroes%20of%20Newerth&limit=10";
        $.ajax({
            url: url + "&jsonp=?",
            type: "GET",
            dataType: "jsonp",
            cache: false,
            success: function(data) {
                updateFromArray(data);
                isUpdating = false;
            }
        });
    };

    fetchStreams();

    if (refreshInterval > 0) {
        setInterval(updateTimerProc, 1000);
    }

    return {
        streams: streams,
        supportedFeatures: supportedFeatures,
        secondsToRefresh: secondsToRefresh,

        addStream: addStream
    };
}(60);

var streamClickHandler = function(event) {
    "use strict";

    if (!FlashDetect.installed)
    {
        $("#playerWindow").html("<h1>Please enable Flash to watch streams!</h1>");
        return;
    }

    var stream = ko.dataFor(event.target);

    // TODO: Find better solution for this crap
    var embedString = stream.embedCode.replace("auto_play=false", "auto_play=true");
    embedString = embedString.replace("height=\"295\" width=\"353\"", "height=\"500\" width=\"800\"");

    var width = $.jStorage.get("playerWidth", $("#playerWindow").width());
    var height = $.jStorage.get("playerHeight", $("#playerWindow").height());

    $("#playerWindow").width(width);
    $("#playerWindow").height(height);

    $("#welcomeMessageContainer").html("");
    $("#embed").html(embedString);
};

var detectBrowserFeatures = function() {
    "use strict";

    var available = true;
    // Obvious...
    viewModel.supportedFeatures.push({ name: "JavaScript", available: available, purpose: "Using this site" });

    available = FlashDetect.installed;
    viewModel.supportedFeatures.push({ name: "Flash", available: available, purpose: "Watching streams"});

    available = $.jStorage.storageAvailable();
    viewModel.supportedFeatures.push({ name: "LocalStorage", available: available, purpose: "Remembering positions etc" });
};

$(document).ready(function() {
    "use strict";

    $("#streamList").on("click", streamClickHandler);

    $("#playerWindow").resizable({
        minHeight: 150,
        minWidth: 200,
        handles: "ne, se, sw, nw",
        stop: function (event, ui) {
            $.jStorage.set("playerWidth", ui.size.width);
            $.jStorage.set("playerHeight", ui.size.height);
        }
    });

    detectBrowserFeatures();

    ko.applyBindings(viewModel);
});