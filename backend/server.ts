import app from "./src/app.js"
import { config } from "./src/config/config.js";
import connectDB from "./src/config/db.js";

connectDB();

const PORT = config.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`Server is running on port http://localhost:${PORT}`);
})