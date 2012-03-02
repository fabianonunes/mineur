var util	= require('util'),
		spawn = require('child_process').spawn,
		fs = require('fs'),
		uuid = require('node-uuid')

var app = require('express').createServer()

app.get('/data.js', function(req, res) {
	res.download(__dirname + '/resp.json')
})


app.get('/:page/:size', function(req, res){
	var sizes = {
		small : 18,
		normal : 72
	}
	var path = '/tmp/' + uuid.v1() + '.png'
	console.log(req.params.page)
	var pdfdraw = spawn('pdfdraw', ['-r', sizes[req.params.size], '-g', '-o', path, '/tmp/doc.pdf', req.params.page])
	pdfdraw.on('exit', function (code) {
		res.sendfile(path, function () {
			fs.unlink(path)
			pdfdraw.kill()
		})
	})
})


app.listen(3000)


