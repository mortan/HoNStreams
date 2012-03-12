var streamViewModel = new StreamViewModel(true);

$(document).ready(function() {
    $("#streamList").on("click", function(event) {
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
    });

    $("#playerWindow").resizable({
        minHeight:150,
        minWidth:200,
        handles: "ne, se, sw, nw",
        stop: function (event, ui) {
            $.jStorage.set("playerWidth", ui.size.width);
            $.jStorage.set("playerHeight", ui.size.height);
        }
    });

    detectFeatures();

    ko.applyBindings(streamViewModel);
});

function detectFeatures() {
    var available = true;

    // Obvious...
    available = true;
    streamViewModel.supportedFeatures.push({ name: "JavaScript", available: available, purpose: "Using this site" });

    if (!FlashDetect.installed) {
        flashAvailable = false;
        $("#playerWindow").html("<h1>Please enable Flash to watch streams!</h1>");
    }
    streamViewModel.supportedFeatures.push({ name: "Flash", available: available, purpose: "Watching streams"});

    available = $.jStorage.storageAvailable();
    streamViewModel.supportedFeatures.push({ name: "LocalStorage", available: available, purpose: "Remembering positions etc" });
}

function Stream() {
    this.views = 0;
    this.title = "default";
    this.embedCode = "";
    this.screenCapUrl = "";
}

function StreamViewModel(autoRefresh) {
    var self = this;

    this.streams = ko.observableArray();
    this.secondsToRefresh = ko.observable(60);
    this.supportedFeatures = ko.observableArray();

    self.addStream = function(stream) {
        self.streams.push(stream);
    }

    self.fromArray = function(array) {
        self.streams.removeAll();
        $.each(array, function (index, value) {
            var stream = new Stream();
            stream.views = value.channel_count;
            stream.user = value.channel.title;
            stream.embedCode = value.channel.embed_code;
            stream.screenCapUrl = value.channel.screen_cap_url_small;
            self.addStream(stream);
        });
    }

    self.update = function() {
        var seconds = self.secondsToRefresh() - 1;
        self.secondsToRefresh(seconds);
        if (seconds <= 0) {
            self.fetchStreams();
            self.secondsToRefresh(60);
        }
    }

    self.fetchStreams = function() {
        var url = "http://api.justin.tv/api/stream/list.json?category=gaming&strategy&meta_game=Heroes%20of%20Newerth&limit=10";
        $.getJSON(url + "&jsonp=?", function (data) {
            self.fromArray(data);
        });
    }

    self.fetchStreams();

    if (autoRefresh) setInterval(self.update, 1000);
}