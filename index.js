
import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import db from "./utils/db.js";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.routes.js";

dotenv.config()

const app = express()
const port  = process.env.PORT || 5000

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(cookieParser())

app.use(cors({
    origin: "http://127.0.0.1:3000",
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Allow credentials (cookies)
}))

app.get('/',(req, res)=>{
    res.send("Hi !! How are you?")
    // console.log("All ENV variables loaded:", process.env);
    // console.log(res)
})
app.get('/home',(req, res)=>{
    res.send("This is Home")
})

//connect to db
db();

//user roters
app.use('/api/v1/user/', userRoutes)


app.listen(port, (req, res) => {
    console.log(`example app listening on ${port}`)
})
