//Inicializa el servidor

import app from './app.js'
import { connectDB } from './db.js'

const port = app.get("port")

connectDB()
app.listen(port)

console.log('Servidor escuchando en el puerto: ' + port)