const CANVAS_WIDTH = window.innerWidth
const CANVAS_HEIGHT = window.innerHeight
const MARKER_SIZE = 10
const FPS = 30
const iife = fn => fn()

// free: MARKER_SIZE
const renderLoop = (markers, getRenderMode, canvas, context) => {
  // Draw over the whole canvas to create the trail effect
  context.fillStyle = 'rgba(255, 255, 255, .05)'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.lineWidth = MARKER_SIZE
  // Draw the lines/dots
  Object.values(markers)
        .filter(marker => marker.color)
        .forEach(marker => {
          context.beginPath()
          if (getRenderMode() === 'line') {
            context.moveTo(marker.x0, marker.y0)
            context.lineTo(marker.x, marker.y)
            context.strokeStyle = marker.color
            context.stroke()
            marker.x0 = marker.x
            marker.y0 = marker.y
          } else {
            context.arc(marker.x, marker.y, MARKER_SIZE/2, 0, Math.PI*2, true)
            context.fillStyle = marker.color
            context.fill()
          }
        })
}

const init = requestColor => {
  const markers = {}

  // free: markers
  const setColor = data => {
    if (!(data && data.id && data.color)) {
      console.warn('setColor received malformed data: ' + JSON.stringify(data, null, 2))
    } else if (!markers[data.id]) {
      console.warn('setColor: missing markers[' + data.id + ']')
    } else {
      //markers[data.id].css('background-color',data.color).show()
      console.log('set user '+data.id+' color '+data.color)
      markers[data.id].color = data.color
    }
  }

  // free: markers, requestColor
  const tock = data => {
    if (!data || !data.id) {
      console.warn('setColor received malformed data: ' + JSON.stringify(data, null, 2))
    } else {
      if (!markers[data.id]) {
        markers[data.id] = {}  //$('<div class="marker"></div>').appendTo('body')
        requestColor(data.id)
      }
      /*
      markers[data.id].css({
        left: (data.x - 2) + 'px',
        top: (data.y - 2) + 'px'
      })
      */
      markers[data.id].x = data.x - 2
      markers[data.id].y = data.y - 2
    }
  }

  // free: markers
  const disconnect = id => {
    console.log(`disconnect: ${id}`)
    if (markers[id]) {
      //markers[id].remove()
      delete markers[id]
    } else if (id === undefined) {
      Object.keys(markers).forEach(x => {
        delete markers[x]
      })
    }
  }

  // free: CANVAS_WIDTH, CANVAS_HEIGHT, FPS, renderLoop
  const setRenderMode = iife(() => {
    const canvas = document.getElementById('canvas')

    if (!(canvas && canvas.getContext)) {
      const msg = 'browser does not support canvas'
      alert(msg)
      throw msg
    }
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    var renderMode = 'dot'

    setInterval(renderLoop, 1000 / FPS, markers, () => renderMode, canvas, canvas.getContext('2d'))

    return mode => {
      console.log(`setRenderMode: ${mode}`)
      renderMode = mode
    }
  })

  return {
    setColor,
    tock,
    disconnect,
    setRenderMode
  }
}

// SOCKET CODE

// delete window.WebSocket

const socket = io.connect('/', {
  'connect timeout': 3000
})

const requestColor = id => socket.emit('getColor', id)

const { setColor, tock, disconnect, setRenderMode } = init(requestColor)

socket.on('setColor', setColor)
socket.on('tock', tock)
socket.on('disconnect', disconnect)
socket.on('setRenderMode', setRenderMode)

$(document).bind('mousemove', ({pageX: x, pageY: y}) => {
  socket.emit('tick', { x, y })
})

$(document).bind('touchmove', evt => {
  const { clientX: x, clientY: y } = evt.originalEvent.changedTouches[0]
  socket.emit('tick', { x, y })
})
