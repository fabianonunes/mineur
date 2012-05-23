
var mineur = require('./lib/mineur'),
	restify = require('restify'),
	request = require('request')

var server = restify.createServer()

server.use(restify.acceptParser(server.acceptable))
server.use(restify.authorizationParser())
server.use(restify.dateParser())
server.use(restify.queryParser({ mapParams: false }))
server.use(restify.bodyParser({ mapParams: false }))
server.use(restify.throttle({
	burst: 50,
	rate: 50,
	ip: true
}))

server.post('/api', function(req, res, next) {
	mineur.short(req.body.url, req.body.expire).then(
		res.send.bind(res)
	).fail(next)
})

server.post('/bridge', function(req, res, next){
	if ( mineur.checkTOTP(req.body.token, process.env.BRIDGE_KEY) ) {
		console.log(req.body.url)
		request.get(req.body.url).pipe(res)
	} else {
		next(new restify.NotAuthorizedError('access denied'))
	}
})

server.get('/:hash', function(req, res, next){
	mineur.redirect(req.params.hash).then(function (url) {
		res.header('Location', url)
		res.send(302, { url : url, hash : req.params.hash })
	}).fail(function () {
		next(new restify.ResourceNotFoundError('hash not found'))
	})
})


server.listen(3030)
