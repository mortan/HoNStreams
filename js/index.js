var streamViewModel = new StreamViewModel();

$(document).ready(function() {
    var url = "http://api.justin.tv/api/stream/list.json?category=gaming&strategy&meta_game=Heroes%20of%20Newerth&limit=10";
    $.getJSON(url + "&jsonp=?", function(data) {
        $.each(data, function(index, value) {
            var stream = new Stream();
            stream.views = value.channel_count;
            stream.user = value.channel.title;
            stream.embedCode = value.channel.embed_code;
            streamViewModel.addStream(stream);
        });
    });

    ko.applyBindings(streamViewModel);

    $("#streamList").on("click", function(event) {
        var stream = ko.dataFor(event.target);

        // TODO: Find better solution for this crap
        var embedString = stream.embedCode.replace("auto_play=false", "auto_play=true");
        embedString = embedString.replace("height=\"295\" width=\"353\"", "height=\"500\" width=\"800\"");
        $("#playerWindow").html(embedString);
    });

    if (!FlashDetect.installed) {
        $("#playerWindow").html("<h1>Please enable Flash to watch streams!</h1>");
    }
});

function fakeData(data)
{
    $.each(data, function (index, value) {
        var stream = new Stream();
        stream.views = value.channel_count;
        stream.user = value.channel.title;
        stream.embedCode = value.channel.embed_code;
        streamViewModel.addStream(stream);
    });
}

function Stream() {
    this.views = 0;
    this.title = "default";
    this.embedCode = "";
}

function StreamViewModel() {
    var self = this;

    this.streams = ko.observableArray([]);

    self.addStream = function (stream) {
        self.streams.push(stream);
    }
}