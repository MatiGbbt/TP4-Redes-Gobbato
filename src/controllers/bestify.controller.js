import Articulo from '../models/articulo.model.js'
import RespuestasGPT from '../models/respuestas.model.js'

import axios from 'axios'
import { OpenAI } from 'openai'
import config from '../config.js'
import readline from 'readline'
const mercadoLibreApiUrl = config.mercado_libre_base_url
const openai = new OpenAI({
    apiKey: config.openai_api_key
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

export const bestify = async (req, res) => {

    const { nombreArticulo } = req.body

    if (!nombreArticulo) {
        return res.status(400).json({ error: 'El nombre del artículo es obligatorio' })
    }

    try {

        // 1- consulta el api de mercado libre a el endpoint que retorna articulos relacionados al nombre
        const mercadoLibreResponse = await axios.get(`${mercadoLibreApiUrl}/sites/MLA/search`, {
        params: { q: nombreArticulo, limit: 10 },
        });

        const articulos = mercadoLibreResponse.data.results

        // 2- guardo un objeto con datos especificos en mongodb, para luego obtener un listado "historial" de consultas
        for (const articulo of articulos) {
            const nuevoArticulo = new Articulo({
                nombre: articulo.title,
                precio: articulo.price,
                marca: articulo.attributes.find(attr => attr.id === 'BRAND')?.value_name || 'No disponible',
                modelo: articulo.attributes.find(attr => attr.id === 'MODEL')?.value_name || 'No disponible',
                link: articulo.permalink
            })
            await nuevoArticulo.save();
        } 

        // 3- obtengo el historial de las respuesas anteriores
        const historialRespuestas = await ContextResponses();

        // 4- genero el prompt para conseguir la mejor respuesta posible del api de OpenAI, con el listado de los 10 mejores articulos
        const prompt = `
        Dado el siguiente listado de productos de Mercado Libre, elige el mejor producto en términos de calidad-precio, características generales, 
        disponibilidad de envío gratuito, y promociones o descuentos. Considera también aspectos como la marca, el modelo y la posibilidad de pagar en cuotas.

        Aquí tienes ejemplos de respuestas previas para que las uses de referencia:

        ${historialRespuestas}

        A continuación, se detalla cada producto:

        ${articulos.map((articulo, index) => `
        ${index + 1}. 
        - Nombre: ${articulo.title}
        - Precio: $${articulo.price} ${articulo.original_price ? `(Precio original: $${articulo.original_price})` : ''}
        - Descuento: ${articulo.sale_price?.metadata?.campaign_discount_percentage || 'No disponible'}%
        - Cantidad de Cuotas: ${articulo.installments?.quantity || 'No disponible'}
        - Precio por Cuota: $${articulo.installments?.amount || 'No disponible'}
        - Condición: ${articulo.condition === 'new' ? 'Nuevo' : 'Usado'}
        - Envío Gratis: ${articulo.shipping.free_shipping ? 'Sí' : 'No'}
        - Marca: ${articulo.attributes.find(attr => attr.id === 'BRAND')?.value_name || 'No disponible'}
        - Modelo: ${articulo.attributes.find(attr => attr.id === 'MODEL')?.value_name || 'No disponible'}
        - Puntuación de Reseñas: ${articulo.reviews_rating_average || 'No disponible'}
        - Total de Reseñas: ${articulo.reviews_total || 'No disponible'}
        - Link de compra: ${articulo.permalink}
        `).join('\n\n')}
        
        Elige el producto que consideres mejor basado en los factores mencionados, incluyendo la relación calidad-precio, y explica brevemente por qué.

        Siempre tiene seleccionar un articulo por mas que los datos proporcionados no te permita definir una respuesta.

        Por ultimo necesito que me proporciones el link de compra.
        `

        // 5- envio el prompt al api de chatgpt para que realice el analisis del mejor articulo del listado propuesto
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
            { "role": "user", "content": prompt }
            ],
        })

        // 6- guardo la respuesta de GPT para utilizarla posteriormente para alimentar el prompt
        const nuevaRespuestaGPT = new RespuestasGPT({
            respuestasGPT: completion.choices[0].message.content.trim(),
        })
        await nuevaRespuestaGPT.save()

        // 7- retorno la respuesta generada por gpt
        res.send(completion.choices[0].message.content.trim())

    } catch (error) {

      res.status(500).json({ error: 'Error al procesar la solicitud' })

    }
}

// Función para procesar la consulta de mejor producto
const bestifyConsole = async (nombreArticulo) => {

    console.clear()
    console.log(' ')
    console.log('Cargando, PorFavor Espere...')
    console.log(' ')

    if (!nombreArticulo) {
        console.log('El nombre del artículo es obligatorio');
        return
    }

    try {

        // 1- consulta el api de mercado libre a el endpoint que retorna articulos relacionados al nombre
        const mercadoLibreResponse = await axios.get(`${mercadoLibreApiUrl}/sites/MLA/search`, {
            params: { q: nombreArticulo, limit: 10 },
        })

        const articulos = mercadoLibreResponse.data.results

        // 2- guardo un objeto con datos especificos en mongodb, para luego obtener un listado "historial" de consultas
        for (const articulo of articulos) {
            const nuevoArticulo = new Articulo({
                nombre: articulo.title,
                precio: articulo.price,
                marca: articulo.attributes.find(attr => attr.id === 'BRAND')?.value_name || 'No disponible',
                modelo: articulo.attributes.find(attr => attr.id === 'MODEL')?.value_name || 'No disponible',
                link: articulo.permalink
            });
            await nuevoArticulo.save()
        }

        // 3- obtengo el historial de las respuesas anteriores
        const historialRespuestas = await ContextResponses();

        // 4- genero el prompt para conseguir la mejor respuesta posible del api de OpenAI, con el listado de los 10 mejores articulos
        const prompt = `
        Dado el siguiente listado de productos de Mercado Libre, elige el mejor producto en términos de calidad-precio, características generales, 
        disponibilidad de envío gratuito, y promociones o descuentos. Considera también aspectos como la marca, el modelo y la posibilidad de pagar en cuotas.

        Aquí tienes ejemplos de respuestas previas para que las uses de referencia:

        ${historialRespuestas}

        A continuación, se detalla cada producto:

        ${articulos.map((articulo, index) => `
        ${index + 1}. 
        - Nombre: ${articulo.title}
        - Precio: $${articulo.price} ${articulo.original_price ? `(Precio original: $${articulo.original_price})` : ''}
        - Descuento: ${articulo.sale_price?.metadata?.campaign_discount_percentage || 'No disponible'}%
        - Cantidad de Cuotas: ${articulo.installments?.quantity || 'No disponible'}
        - Precio por Cuota: $${articulo.installments?.amount || 'No disponible'}
        - Condición: ${articulo.condition === 'new' ? 'Nuevo' : 'Usado'}
        - Envío Gratis: ${articulo.shipping.free_shipping ? 'Sí' : 'No'}
        - Marca: ${articulo.attributes.find(attr => attr.id === 'BRAND')?.value_name || 'No disponible'}
        - Modelo: ${articulo.attributes.find(attr => attr.id === 'MODEL')?.value_name || 'No disponible'}
        - Puntuación de Reseñas: ${articulo.reviews_rating_average || 'No disponible'}
        - Total de Reseñas: ${articulo.reviews_total || 'No disponible'}
        - Link de compra: ${articulo.permalink}
        `).join('\n\n')}
        
        Elige el producto que consideres mejor basado en los factores mencionados, incluyendo la relación calidad-precio, y explica brevemente por qué.

        Siempre tiene seleccionar un articulo por mas que los datos proporcionados no te permita definir una respuesta.

        Por ultimo necesito que me proporciones el link de compra.
        `

        // 5- envio el prompt al api de chatgpt para que realice el analisis del mejor articulo del listado propuesto
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ "role": "user", "content": prompt }],
        })

        // 6- guardo la respuesta de GPT para utilizarla posteriormente para alimentar el prompt
        const nuevaRespuestaGPT = new RespuestasGPT({
            respuestasGPT: completion.choices[0].message.content.trim(),
        })
        await nuevaRespuestaGPT.save()

        // 7- retorno la respuesta generada por gpt
        console.log(completion.choices[0].message.content.trim())
        console.log(' ')

    } catch (error) {

        console.log('Error al procesar la solicitud:', error)

    }
}

export const historialArticulos = async (req, res) => {

    try {

        const articulos = await Articulo.find()

        const listado = articulos.map(articulo => `
            - Nombre: ${articulo.nombre}
            - Precio: ${articulo.precio}
            - Marca: ${articulo.marca}
            - Modelo: ${articulo.modelo}
            - Link: ${articulo.link}
            `).join('\n')
    
            res.status(200).send(listado);

    } catch (error) {

        res.status(500).json({ error: 'Error al procesar la solicitud' })
    }
}

export const historialRespuestasGPT = async (req, res) => {

    try {

        const respuestas = await RespuestasGPT.find()

        const listado = respuestas.map(respuesta => `
            - Respuesta: ${respuesta.respuestasGPT}
            `).join('\n')
    
            res.status(200).send(listado);

    } catch (error) {

        res.status(500).json({ error: 'Error al procesar la solicitud' })
    }
}

// Función para obtener respuestas previas
const ContextResponses = async () => {
    try {
        const respuestas = await RespuestasGPT.find();
        return respuestas.map(respuesta => `- Ejemplo de Respuesta Anterior: ${respuesta.respuestasGPT}`).join('\n');
    } catch (error) {
        console.error("Error al obtener el historial de respuestas GPT:", error);
        return "";
    }
};

const startConsoleApp = () => {
    rl.question('Ingresa el nombre del producto que deseas buscar la mejor opción de compra: ', async (nombreArticulo) => {
        await bestifyConsole(nombreArticulo)
        startConsoleApp()
    })
}

startConsoleApp()
