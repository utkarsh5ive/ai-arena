import dotenv from 'dotenv'
dotenv.config()

const config = {

    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
    COHERE_API_KEY: process.env.COHERE_API_KEY || '',
    MONGO_URI: process.env.MONGO_URI || '',
    JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret'

}

export default config

