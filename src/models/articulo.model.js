import mongoose from 'mongoose'

const articuloSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    precio: {
        type: String,
        required: true
    },
    marca: {
        type: String,
        required: true,
        trim: true,
    },
    modelo: {
        type: String,
        required: true,
        trim: true,
    },
    link: {
        type: String,
        required: true,
        trim: true,
    },
},{
    timestamps: true
})

export default mongoose.model('articulo', articuloSchema)