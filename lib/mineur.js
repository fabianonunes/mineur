var q      = require('q'),
	b60    = require('NewBase60'),
	redis  = require('redis').createClient(),
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

	if (!url) { return null }

	var self = this, urlkey = 'url:' + encodeURI(url)

	return redis.get(urlkey).then(function (hash) {

		if (hash) {
			return { hash : hash }
		}

		return redis.incr('ids').then(function (id) {
			var hash = b60.numtosxg(id)
			var data = {
				date : Date.now(),
				url  : encodeURI(url)
			}
			redis.set(urlkey, hash) // async - optimist!
			redis.hmset(hash, data)
			return { hash : hash }
		})

	})

}

mineur.redirect = function redirect (hash) {
	return q.timeout(redis.hgetall(hash).get('url'), 4000)
}

module.exports = mineur
