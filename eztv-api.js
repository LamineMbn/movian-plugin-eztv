var service = require('movian/service');
var api = require('common-api');

var GET_TORRENTS_ENDPOINT = "/api/get-torrents"
var SEARCH_BY_NAME_ENDPOINT = "/search"

function retrieveAllTorrentsUrl(page) {
    var limit = 10;
    var allTorrentsUrlWithParams = service.eztvBaseUrl + GET_TORRENTS_ENDPOINT;
    allTorrentsUrlWithParams = allTorrentsUrlWithParams.concat("?", "limit", "=", limit.toString());
    allTorrentsUrlWithParams = allTorrentsUrlWithParams.concat("&", "page", "=", page.toString());
    return allTorrentsUrlWithParams
}

function retrieveSearchTorrentsByQueryUrl(query) {
    var searchUrlWithParams =  service.eztvBaseUrl + SEARCH_BY_NAME_ENDPOINT;
    searchUrlWithParams = searchUrlWithParams.concat("/", replaceSpaceByDash(query));
    return searchUrlWithParams
}

function retrieveSearchTorrentsByImdbIdUrl(imdbId, page) {
    var limit = 10;
    var searchByImdbIdUrl =  service.eztvBaseUrl + GET_TORRENTS_ENDPOINT;
    searchByImdbIdUrl = searchByImdbIdUrl.concat("?", "imdb_id", "=", imdbId);
    searchByImdbIdUrl = searchByImdbIdUrl.concat("&", "page", "=", page.toString());
    searchByImdbIdUrl = searchByImdbIdUrl.concat("&", "limit", "=", limit.toString());
    return searchByImdbIdUrl
}

function replaceSpaceByDash(text) {
    return escape(text).replace(/%20/g, '-')
}
function checkResolutions(torrentTitle){
        return torrentTitle.indexOf("720") > 0 || torrentTitle.indexOf("1080") > 0
}

exports.retrieveAllTorrents = function (page) {
    var url = retrieveAllTorrentsUrl(page)
    var response = api.callService(url)
    return JSON.parse(response)
}

exports.searchTorrentByQuery = function (query) {
    var url = retrieveSearchTorrentsByQueryUrl(query)
    return api.callService(url).toString()
}

exports.searchTorrentByImdbId = function (imdbId, page, opt) {
    var url = retrieveSearchTorrentsByImdbIdUrl(imdbId, page)
    var response = api.callService(url)
    var filteredTorrents = JSON.parse(response).torrents.filter(function (it) {
        return checkResolutions(it.title) &&
            it.seeds >= opt.minSeeds
    })
    return filteredTorrents
}
