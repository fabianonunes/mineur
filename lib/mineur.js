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

	url = encodeURI(url)
	var urlkey = 'url:' + url

	return redis.get(urlkey).then(function (hash) {
		if (hash) { return hash	}
		return redis.incr('ids').then(function (id) {
			var hash = b60.numtosxg(id)
			redis.set(urlkey, hash) // async - optimist!
			redis.hmset(hash, {
				date : Date.now(), url : url
			})
			return hash
		})
	})

}

mineur.redirect = function redirect (hash) {
	return q.timeout(redis.hgetall(hash).get('url'), 4000)
}

module.exports = mineur
