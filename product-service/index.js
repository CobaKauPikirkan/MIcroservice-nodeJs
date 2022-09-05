const express = require('express')
const app = express()
const PORT = process.env.PORT || 7000
app.use(express.json())
const mongoose = require("mongoose")
const amqp = require("amqplib")
const jwt = require("jsonwebtoken")
const Product = require('./model/Product')
const isAuthenticated = require("../isAuthenticated")
let channel, connection;

mongoose.connect("mongodb://localhost/product-service", {
    useNewUrlParser: true,
    useUnifiedTopology:true
}, ()=>{
    console.log(`product-server DB connected`)
})

async function connect(){
    const amqpServer = "amqp://localhost:5672"
    connection= await amqp.connect(amqpServer)
    channel = await connection.createChannel()
    await channel.assertQueue("PRODUCT")
}
connect();

//Router
app.post("/product/create", isAuthenticated, async (req, res)=>{
    //req.user.email

    const {name, description, price} =req.body
    const newProduct = new Product({
        name,
        description,
        price
    });
    newProduct.save()
    return res.json(newProduct)
})
//user sends a list of products ID to buy
//creating an order with those product and a total value of sum of product prices
app.post("/product/buy",isAuthenticated, async(req,res)=>{
    const {ids} = req.body;
    const products = await Product.find({ _id: {$in: ids}})
   
    channel.sendToQueue(//mengirim ke order service
        "ORDER",
        Buffer.from(
            JSON.stringify({
                products,
                userEmail: req.user.email,
            })
        )
    )
    channel.consume("PRODUCT", (data) =>{
        console.log("consuming PRODUCT queue")
        let order = JSON.parse(data.content)
        channel.ack(data)
        return res.json(order);
    });
    
})

app.listen(PORT, ()=> {
    console.log(`produc-service at http://localhost:${PORT}`)
})