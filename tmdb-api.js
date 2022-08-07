var service = require('movian/service');
var api = require('common-api');

var TMDB_POSTER_BASE_URL = "http://image.tmdb.org/t/p/w300"
var TMDB_POPULAR_SHOWS_ENDPOINT = "/tv/popular"

function retrievePopularShowsUrlBuilder(page) {
    var popularShowsUrlWithParams = service.tmdbBaseUrl + TMDB_POPULAR_SHOWS_ENDPOINT;
    popularShowsUrlWithParams = popularShowsUrlWithParams.concat("?", "page", "=", page.toString());
    popularShowsUrlWithParams = popularShowsUrlWithParams.concat("&", "api_key", "=", service.tmdbApiKey);
    return popularShowsUrlWithParams
}

exports.retrievePopularShows = function (fromPage){
    var url = retrievePopularShowsUrlBuilder(fromPage)
    var response = api.callService(url)
    return JSON.parse(response)
}

exports.retrievePoster = function (show) {
    return show.backdrop_path ? TMDB_POSTER_BASE_URL + show.backdrop_path : 'https://ezimg.ch/s/1/9/image-unavailable.jpg'
}
