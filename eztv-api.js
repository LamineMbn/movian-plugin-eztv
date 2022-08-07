var service = require('movian/service');
var api = require('common-api');

var GET_TORRENTS_ENDPOINT = "/api/get-torrents"
var SEARCH_BY_NAME_ENDPOINT = "/search"

function retrieveAllTorrentsUrlBuilder(page) {
    var limit = 10;
    var allTorrentsUrlWithParams = service.eztBaseUrl + GET_TORRENTS_ENDPOINT;
    allTorrentsUrlWithParams = allTorrentsUrlWithParams.concat("?", "limit", "=", limit.toString());
    allTorrentsUrlWithParams = allTorrentsUrlWithParams.concat("&", "page", "=", page.toString());
    return allTorrentsUrlWithParams
}

function retrieveSearchTorrentsUrlBuilder(query) {
    var searchUrlWithParams =  service.eztBaseUrl + SEARCH_BY_NAME_ENDPOINT;
    searchUrlWithParams = searchUrlWithParams.concat("/", replaceSpaceByDash(query));
    return searchUrlWithParams
}

function replaceSpaceByDash(text) {
    return escape(text).replace(/%20/g, '-')
}

exports.retrieveAllTorrents = function (page) {
    var url = retrieveAllTorrentsUrlBuilder(page)
    var response = api.callService(url)
    return JSON.parse(response)
}

exports.searchTorrentByQuery = function (query) {
    var url = retrieveSearchTorrentsUrlBuilder(query)
    return api.callService(url).toString()
}
