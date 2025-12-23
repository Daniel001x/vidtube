import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';


const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n mongodb connected ! DB host: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.error("MongoDb is not connected");
        process.exit(1)
        
    }
}

export default connectDB;