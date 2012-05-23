var q         = require('q'),
	parse     = require('url').parse,
	b60       = require('NewBase60'),
	speakeasy = require('speakeasy'),
	_         = require('underscore')
	check     = require('validator').check,
	redis     = require('redis').createClient(),
	mineur    = {}

;['get', 'incr', 'hgetall'].forEach(function (op) {
	redis[op] = q.nbind(redis[op], redis)
})

mineur.short = function (urls, expire) {
	if ( !Array.isArray(urls) ) {
		urls = [urls]
	}
	return q.all(urls.map(
		this._execute.bind(this, expire)
	))
}

mineur._execute = function (expire, url) {

	return q.call(function () {

		check(url).isUrl() // throwable
		var parsed = parse(url)
		url = parsed.protocol ? url : 'http://' + parsed.path
		url = encodeURI(url)

		return redis.get('url:' + url).then(function (hash) {
			return hash ? hash : mineur._save(url, expire)
		})

	})

}

mineur._save = function (url, expire) { // optimist operations!

	return redis.incr('ids').then(function (id) {

		var hash = b60.numtosxg(id),
			key = 'url:' + url

		redis.set(key, hash)
		redis.hmset(hash, { date : Date.now(), url : url })

		if (expire) {
			redis.expire(key, expire)
			redis.expire(hash, expire)
		}

		return hash

	})

}

mineur.redirect = function (hash) {
	return q.timeout(redis.hgetall(hash).get('url'), 500)
	.then(function (url) {
		if (url) {
			return url
		} else {
			throw new Error()
		}
	})
}

// bridge-auth
mineur.checkTOTP = function (token, key) {
	return _.range(13).map(function (v) {
		return speakeasy.time({
			key: 'Tr4HC5VsvJT>3OXy?r69', // please, use a secret key
			initial_time : 30 * (v-6)
		})
	}).some(function (time) {
		return time === token
	})
}

module.exports = mineur
