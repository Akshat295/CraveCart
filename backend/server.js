import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/FoodRoute.js";
import userRouter from "./routes/UserRoutes.js";
import cartRouter from "./routes/CartRoute.js";
import dotenv from "dotenv" ;
import orderRouter from "./routes/OrderRoute.js";
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
app.use("/api/cart" , cartRouter) ;
app.use("/api/order", orderRouter) ;

app.get("/" , (req,res) => {
    res.send("Port is running") ;
})

app.post("/hello", (req,res) => {
    res.send("Hello! I am Akshat") ;
})

app.listen(port ,() => {
    console.log(`server started on port ${port}`) ;
})