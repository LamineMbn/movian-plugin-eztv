/**
 * EZTV plugin for Movian Media Center
 *
 *  Copyright (C) 2015-2018 Gekko, lprot
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
var page = require('movian/page');
var service = require('movian/service');
var settings = require('movian/settings');
var tmdbApi = require('tmdb-api');
var eztvApi = require('eztv-api');
var plugin = JSON.parse(Plugin.manifest);
var logo = Plugin.path + "logo.png";

RichText = function (x) {
    this.str = x.toString();
}

RichText.prototype.toRichString = function (x) {
    return this.str;
}

var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

function coloredStr(str, color) {
    return '<font color="' + color + '">' + str + '</font>';
}

function setPageHeader(page, title) {
    page.loading = true;
    if (page.metadata) {
        page.metadata.title = title;
        page.metadata.logo = logo;
    }
    page.type = "directory";
    page.contents = "items";
}

service.create(plugin.title, plugin.id + ":start", "video", true, logo);

settings.globalSettings(plugin.id, plugin.title, logo, plugin.synopsis);
settings.createBool('enableMetadata', 'Enable metadata fetching', false, function (v) {
    service.enableMetadata = v;
});

settings.createString('eztvBaseURL', "EZTV base URL without '/' at the end", 'https://eztv.wf', function (v) {
    service.eztvBaseUrl = v;
});

settings.createString('tmdbBaseURL', "TMDB base URL without '/' at the end", 'https://api.themoviedb.org/3', function (v) {
    service.tmdbBaseUrl = v;
});

settings.createString('tmdbApiKey', "TMDB api key to display popular tv shows", 'a2f1432730cf9fc81a38df98e59a15ff', function (v) {
    service.tmdbApiKey = v;
});

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function tvShowList(page) {
    var fromPage = 1;
    var tryToSearch = true;
    page.entries = 0;

    function loader() {
        if (!tryToSearch) return false;
        var json = tmdbApi.retrievePopularShows(fromPage)
        page.loading = false;
        for (var i in json.results) {
            var item = page.appendItem(plugin.id + ':detail:' + json.results[i].id, "directory", {
                title: json.results[i].name,
                icon: tmdbApi.retrievePoster(json.results[i]),
                vtype: 'tvseries',
                tagline: new RichText(json.results[i].overview)
            });
            page.entries++;
        }
        fromPage++;
        return true;
    }

    loader();
    page.paginator = loader;
    page.loading = false;
}

function browseItems(page, query) {
    var fromPage = 1;
    var tryToSearch = true;
    page.entries = 0;

    function loader() {
        if (!tryToSearch) return false;
        var json = eztvApi.retrieveAllTorrents(fromPage)
        page.loading = false;

        for (var i in json.torrents) {
            var torrent = json.torrents[i]
            var torrenUrlDecoded = escape(torrent.torrent_url)
            var itemUrl = plugin.id + ':play:' + torrenUrlDecoded + ':' + escape(torrent.title) + ':' + torrent.imdb_id + ':' + torrent.season + ':' + torrent.episode
            console.log("Item Url " + itemUrl)
            var item = page.appendItem(itemUrl, "video", {
                title: torrent.title,
                icon: torrent.small_screenshot ? 'https:' + torrent.small_screenshot : 'https://ezimg.ch/s/1/9/image-unavailable.jpg',
                vtype: 'tvseries',
                season: {number: +torrent.season},
                episode: {title: torrent.title, number: +torrent.episode},
                genre: new RichText(coloredStr('S: ', orange) + coloredStr(torrent.seeds, green) +
                    coloredStr(' P: ', orange) + coloredStr(torrent.peers, red) +
                    coloredStr(' Size: ', orange) + bytesToSize(torrent.size_bytes) +
                    (torrent.imdb_id ? coloredStr('<br>IMDb ID: ', orange) + 'tt' + torrent.imdb_id : '')),
                tagline: new RichText(coloredStr('Released: ', orange) + new Date(torrent.date_released_unix * 1000))
            });
            page.entries++;
            if (service.enableMetadata) {
                item.bindVideoMetadata({
                    imdb: 'tt' + torrent.imdb_id
                });
            }
        }
        fromPage++;
        return true;
    }

    loader();
    page.paginator = loader;
    page.loading = false;
}

function browseShowEpisodes(page, tmdbShow) {
    // We remove the 'tt' at the beginning 
    var imdbId = tmdbShow.external_ids.imdb_id.slice(2)
    var showName = tmdbShow.name
    setPageHeader(page, showName);
    var fromPage = 1;
    var tryToSearch = true;
    page.entries = 0;

    function loader() {
        if (!tryToSearch) return false;
        var torrents = eztvApi.searchTorrentByImdbId(imdbId, fromPage, {resolutions: ["720","1080"], minSeeds: 5})
        page.loading = false;
        for (var i in torrents) {

            var torrent = torrents[i]
            var torrenUrlDecoded = decodeURI(torrent.torrent_url)
            var itemUrl = plugin.id + ':play:' + torrenUrlDecoded + ':' + decodeURI(torrent.title) + ':' + torrent.imdb_id + ':' + torrent.season + ':' + torrent.episode

            var item = page.appendItem(itemUrl, "video", {
                title: torrent.title,
                icon: torrent.small_screenshot ? 'https:' + torrent.small_screenshot : tmdbApi.retrievePoster(tmdbShow),
                vtype: 'tvseries',
                season: {number: +torrent.season},
                episode: {title: torrent.title, number: +torrent.episode},
                genre: new RichText(coloredStr('S: ', orange) + coloredStr(torrent.seeds, green) +
                    coloredStr(' P: ', orange) + coloredStr(torrent.peers, red) +
                    coloredStr(' Size: ', orange) + bytesToSize(torrent.size_bytes) +
                    (torrent.imdb_id ? coloredStr('<br>IMDb ID: ', orange) + 'tt' + torrent.imdb_id : '')),
                tagline: new RichText(coloredStr('Released: ', orange) + new Date(torrent.date_released_unix * 1000))
            });
            page.entries++;


        }
        fromPage++;
        return true;
    }

    loader();
    page.paginator = loader;
    page.loading = false;
}

function search(page, query) {
    setPageHeader(page, plugin.title);
    page.entries = 0;
    var response = eztvApi.searchTorrentByQuery(query)
    // 1-link to the show, 2-show's title, 3-episode url, 4-episode's title, 5-magnet&torrent urls, 6-size, 7-released, 8-seeds
    var re = /<tr name="hover"[\s\S]*?<a href="([\s\S]*?)"[\s\S]*?alt="Info" title="([\s\S]*?)"[\s\S]*?<a href="([\s\S]*?)"[\s\S]*?class="epinfo">([\s\S]*?)<\/a>[\s\S]*?<td align="center"([\s\S]*?)<\/td>[\s\S]*?class="forum_thread_post">([\s\S]*?)<\/td>[\s\S]*?class="forum_thread_post">([\s\S]*?)<\/td>[\s\S]*?class="forum_thread_post">[\s\S]*?">([\s\S]*?)</g;
    var match = re.exec(response);

    while (match) {
        // 0 1    2   3
        // /shows/id/name-of-the-show
        var poster = match[1].split("/")
        var imageUrl = service.eztvBaseUrl + "/ezimg/thumbs/" + poster[3] + "-" + poster[2] + ".jpg"
        var re2 = /<a href="([\s\S]*?)"/g;
        var urls = re2.exec(match[5]);
        var lnk = '';
        while (urls) { // we prefer .torrent 
            lnk = urls[1];
            urls = re2.exec(match[5])
        }
        var item = page.appendItem('torrent:video:' + lnk, "video", {
            title: new RichText(match[4]),
            icon: imageUrl,
            genre: new RichText((match[8] ? coloredStr('Seeds: ', orange) + coloredStr(match[8], green) + ' ' : '') +
                coloredStr('Size: ', orange) + match[6]),
            tagline: new RichText(coloredStr('<br>Released: ', orange) + match[7])
        });
        page.entries++;
        match = re.exec(response);
    }
    page.loading = false;
}

new page.Route(plugin.id + ":start", function (page) {
    setPageHeader(page, plugin.synopsis);
    page.appendItem(plugin.id + ":search:", 'search', {
        title: 'Search at ' + service.eztvBaseUrl
    });
    tvShowList(page);
    page.loading = false;
});

new page.Route(plugin.id + ":play:(.*):(.*):(.*):(.*):(.*)", function (page, url, title, imdb_id, season, episode) {
    page.loading = true;
    page.type = 'video';
    page.source = "videoparams:" + JSON.stringify({
        title: unescape(title),
        canonicalUrl: plugin.id + ':play:' + url + ':' + title + ':' + imdb_id + ':' + season + ':' + episode,
        sources: [{
            url: 'torrent:video:' + unescape(url)
        }],
        imdbid: imdb_id ? 'tt' + imdb_id : 0,
        season: season,
        episode: episode,
        no_fs_scan: true
    });
    page.loading = false;
});

new page.Route(plugin.id + ":detail:(.*)", function (page, id) {
    var tmdbShow = tmdbApi.retrieveShowById(id);

    browseShowEpisodes(page, tmdbShow)
});

new page.Route(plugin.id + ":search:(.*)", function (page, query) {
    search(page, query);
});

page.Searcher(plugin.id, logo, function (page, query) {
    search(page, query);
});
