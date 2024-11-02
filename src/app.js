//Configuración del servidor

//dependencias
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import config from './config.js'

//rutas
import bestifyRoutes from './routes/bestify.routes.js'

const app = express()

//settings
app.set("port", config.port)

// const corsOptions = {
//     origin: 'http://localhost:3000', // (aca va la url del front si falla por cors)
//     credentials: true,
// }

//middlewares
app.use(morgan('dev'))
app.use(express.json())
// app.use(cors(corsOptions))
//

app.use('/api', bestifyRoutes)

export default app