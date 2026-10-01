import app from "./src/app.js"
import { config } from "./src/config/config.js";
import connectDB from "./src/config/db.js";

connectDB();

const PORT = config.PORT || 5000;

// On Vercel the platform invokes the exported app as a function; locally we
// start a long-running listener. VERCEL is set in all Vercel deployments.
if (!process.env.VERCEL) {
    app.listen(PORT, ()=>{
        console.log(`Server is running on port http://localhost:${PORT}`);
    })
}

export default app;