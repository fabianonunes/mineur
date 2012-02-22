var q      = require('q'),
	b60    = require('NewBase60'),
	redis  = require('redis').createClient(),
	check  = require('validator').check,
	parse = require('url').parse
	mineur = {}

;['get', 'incr', 'hgetall'].forEach(function (op) {
	redis[op] = q.node(redis[op], redis)
})

mineur.short = function (urls) {
	if ( !Array.isArray(urls) ) {
		urls = [urls]
	}
	return q.all( urls.map(this.execute) )
}

mineur.execute = function execute (url) {

	return q.call(function () {

		check(url).isUrl() // throwable
		var parsed = parse(url)
		url = parsed.protocol ? url : 'http://' + parsed.path
		url = encodeURI(url)

		return redis.get('url:' + url).then(function (hash) {
			return hash ? hash : redis.incr('ids').then(
				mineur.save.bind(mineur, url)
			)
		})

	})

}

mineur.save = function (url, id) { // optimist operations!
	var hash = b60.numtosxg(id)
	redis.set('url:' + url, hash)
	redis.hmset(hash, { date : Date.now(), url : url })
	return hash
}

mineur.redirect = function redirect (hash) {
	return q.timeout(redis.hgetall(hash).get('url'), 500).fail(function (err) {
		throw new Error(err)
	})
}

module.exports = mineur
