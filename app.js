
var mineur = require('./lib/mineur'),
	restify = require('restify')

var server = restify.createServer()

server.use(restify.acceptParser(server.acceptable))
server.use(restify.authorizationParser())
server.use(restify.dateParser())
server.use(restify.queryParser({ mapParams: false }))
server.use(restify.bodyParser({ mapParams: false }))
server.use(restify.throttle({
	burst: 5,
	rate: 5,
	ip: true
}))

server.post('/api', function(req, res, next) {
	mineur.short(req.body.url).then(
		res.send.bind(res)
	).fail(next)
})

server.get('/:hash', function(req, res, next){
	mineur.redirect(req.params.hash).then(function (url) {
		if (url) {
			res.header('Location', url)
			res.send(302, { url : url, hash : req.params.hash })
		} else {
			throw new restify.ResourceNotFoundError('hash not found')
		}
	}).fail(next)
})

server.listen(3030)
