//require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import { app } from "./app.js";

import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

connectDB()
    .then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`App is Listening on PORT ${process.env.PORT}`);
    })
})




/*
import express from "express";
const app = express();

;(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error",(error) => {
            console.log("ERROR",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is Listening on PORT ${process.env.PORT}`);
        })

    }catch(error){
        console.error("ERROR:",error)
        throw err
    }
})() 

*/