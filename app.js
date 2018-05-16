const iife = fn => fn()

const handleHTTP = iife(() => {
  const node_static = require('node-static')
  const static_files = new node_static.Server(__dirname)
  return (req, res) => {
    if (req.method == 'GET') {
      console.log('serving ' + req.url)
      //req.addListener('end', () => {
        static_files.serve(req,res)
      //})
      //req.resume()
    } else {
      res.writeHead(403)
      res.end()
    }
  }
})

const handleIO = iife(() => {
  // socket.emit - just send to socket
  // socket.broadcast.emit - send to every other socket
  // io.sockets.emit - send to all sockets
  var counter = 0
  const users = []
  return socket => {
    const id = ++counter
    const user = users[id] = {
      color: '#'+('00000'+(Math.random()*0xFFFFFF | 0).toString(16)).slice(-6)
    }
    console.log('client '+id+' connected')

    /**
    socket.emit('setRenderMode', 'line')
    /*/
    socket.emit('setRenderMode', 'dot')
    /**/

    const disconnect = () => {
      console.log('client '+id+' disconnected')
      // emit to everyone but socket
      socket.broadcast.emit('disconnect', id)
    }

    const tick = data => {
      // console.log(id+':',data)
      data.id = id
      // emit to everyone
      io.sockets.emit('tock', data)
    }

    const getColor = id => {
      socket.emit('setColor', { id, color: users[id].color })
    }

    socket.on('disconnect', disconnect)
    socket.on('tick', tick)
    socket.on('getColor', getColor)
  }
})

const port = 8080,
      host = '0.0.0.0',
      httpserv = require('http')
                  .createServer(handleHTTP)
                  .listen(port, host),
      io = require('socket.io')
            .listen(httpserv)
            .on('connection', handleIO)

// configure socket.io
io.configure(() => {
  io.enable('browser client minification')  // send minified client
  io.enable('browser client etag')          // apply etag caching logic based on version number
  io.set('log level', 1)                    // reduce logging
  io.set('transports', [
    'websocket',
    'xhr-polling',
    'jsonp-polling'
  ])
})

console.log('server listening on http://'+host+':'+port)
