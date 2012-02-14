
var express = require('express'),
	mineur = require('./lib/mineur')

var app = express.createServer()

app.configure(function(){
	app.use(express.bodyParser())
	app.use(app.router)
	app.use(express['static'](__dirname + '/public'))
})

app.post('/api', function(req, res) {
	mineur.short(req.body.url).then(res.send.bind(res))
})

app.get('/:hash', function(req, res){
	mineur.redirect(req.params.hash).then(function (url) {
		res.redirect(url || '/')
	})
})

app.listen(3030)
