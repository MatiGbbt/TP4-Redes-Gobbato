import {Router} from 'express'
import {bestify, historialArticulos, historialRespuestasGPT} from '../controllers/bestify.controller.js'

const router =  Router()

router.post('/bestify', bestify)

router.get('/historialArticulos', historialArticulos)

router.get('/historialRespuestasGPT', historialRespuestasGPT)

export default router