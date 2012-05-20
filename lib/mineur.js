var q      = require('q'),
	b60    = require('NewBase60'),
	redis  = require('redis').createClient(),
	check  = require('validator').check,
	parse = require('url').parse
	mineur = {}

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
	return q.timeout(redis.hgetall(hash).get('url'), 500).fail(function (err) {
		throw new Error(err)
	})
}

module.exports = mineur
