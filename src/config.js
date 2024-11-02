import { config } from 'dotenv'
config()

export default{
    port: process.env.PORT || 6500,

    mercado_libre_base_url: process.env.MERCADO_LIBRE_BASE_URL,

    mongodb_uri: process.env.MONGODB_URI,

    openai_api_key: process.env.OPENAI_API_KEY

}