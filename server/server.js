import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDb from './configs/db.js';
import { inngest } from "./inngest/index.js"

const app = express();

await connectDb()

//midleware
app.use(express.json());
app.use(cors())


app.get('/',(req,res)=>res.send('server is running'));
app.use('/api/inngest', serve({ client: inngest, functions })) // Set up the "/api/inngest" (recommended) routes with the serve handler


const PORT = process.env.PORT || 4000;

app.listen(PORT,()=>console.log(`Server is running ${PORT}`))