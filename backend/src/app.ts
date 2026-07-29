import express, { Request, Response } from "express";
import cors from "cors"
import morgan from "morgan";
import analysisRouter from "./routes/repoAnalysis.route.js"

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))
app.use(cors())

app.get("/", async(req: Request, res: Response): Promise<any> =>{
    res.send("Hello from server")
})

app.use("/api/analysis", analysisRouter);

export default app;