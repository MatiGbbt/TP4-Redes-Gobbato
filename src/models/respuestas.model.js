import mongoose from 'mongoose'

const respuestasSchema = new mongoose.Schema({
    respuestasGPT: {
        type: String,
        required: true,
        trim: true
    }
},{
    timestamps: true
})

export default mongoose.model('respuestasGPT', respuestasSchema)