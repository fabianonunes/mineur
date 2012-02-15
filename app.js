
var express = require('express'),
	mineur = require('./lib/mineur')

var app = express.createServer()

app.configure(function (){
	app.use(express.bodyParser())
	app.use(app.router)
	app.use(express['static'](__dirname + '/public'))
})

app.get('/', function (req, res, next){
	res.send('MINEur', 200)
})

app.post('/api', function (req, res, next) {
	mineur.short(req.body.url).then(
		res.send.bind(res)
	).fail(next)
})

app.get('/:hash', function (req, res, next){
	mineur.redirect(req.params.hash).then(function (url) {
		if (url) { res.redirect(url) }
		else { res.send('not found', 404) }
	}).fail(next)
})

app.error(function (err, req, res){
	res.send(err.message, err.code || 500)
})

app.listen(3030)
