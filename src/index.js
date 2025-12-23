import connectDB from "./db/index.js";
import {app} from "./app.js";
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
})
const PORT = process.env.PORT || 8000;

connectDB();

try {
    app.listen(PORT,()=>{
console.log(`Server is running on port, ${PORT}`);

})
} catch (error) {
    console.log("Server is not running");
    
}