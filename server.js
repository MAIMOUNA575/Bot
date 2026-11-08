import http from 'http'
import express from 'express'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)
const io = new Server(server, { maxHttpBufferSize: 5e6 })

app.use(express.static('public'))

const historiques = {}

io.on('connection', (socket) => {

  socket.on('rejoindre', (salon) => {
    salon = String(salon || 'general').trim().slice(0, 20) || 'general'

    if (socket.salon) socket.leave(socket.salon)
    socket.salon = salon
    socket.join(salon)

    if (!historiques[salon]) historiques[salon] = []
    socket.emit('historique', historiques[salon])
  })

  socket.on('message', (donnees) => {
    if (!socket.salon || !donnees) return

    const message = {
      pseudo: String(donnees.pseudo || 'Anonyme').slice(0, 20),
      texte: String(donnees.texte || '').trim().slice(0, 500),
      heure: Date.now()
    }

    const image = String(donnees.image || '')
    if (/^data:image\/(png|jpeg|gif|webp);base64,/.test(image)) {
      message.image = image
    }

    if (!message.texte && !message.image) return

    const cahier = historiques[socket.salon]
    cahier.push(message)
    if (cahier.length > 50) cahier.shift()

    io.to(socket.salon).emit('message', message)
  })

})

server.listen(3001, () => {
  console.log('Messagerie lancée sur http://localhost:3001')
})