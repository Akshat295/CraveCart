import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/FoodRoute.js";
import userRouter from "./routes/UserRoutes.js";
import dotenv from "dotenv" ;
// app config
dotenv.config();
const app = express() ;
const port = 4000 ;

//middleware

app.use(express.json()) ;
app.use(cors()) ;

//db connection

connectDB();

//api endpoint

app.use("/api/food" , foodRouter) ;
app.use("/images", express.static('uploads'));
app.use("/api/user", userRouter) ;

app.get("/" , (req,res) => {
    res.send("Port is running") ;
})

app.listen(port ,() => {
    console.log(`server started on port ${port}`) ;
})