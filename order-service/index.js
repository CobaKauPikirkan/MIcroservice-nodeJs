const express = require("express")
const app = express()
const PORT = process.env.PORT || 8000
const mongoose = require("mongoose")
const amqp = require("amqplib")
const Order = require("./model/Order")
app.use(express.json())

let channel , connection
mongoose.connect("mongodb://localhost/order-service", {
    useNewUrlParser: true,
    useUnifiedTopology:true
}, ()=>{
    console.log(`order-server DB connected`)
})

async function connect(){
    const amqpServer = "amqp://localhost:5672"
    connection = await amqp.connect(amqpServer)
    channel= await connection.createChannel()
    await channel.assertQueue("ORDER")
}

function createOrder(products, userEmail){
    let total = 0;
    for (let t = 0; t < products.length; ++t) {
         total += products[t].price;
    }
    const newOrder = new Order({
        products,
        user: userEmail,
        total_price: total
    })
    newOrder.save()
    return newOrder
}

connect().then(()=>{
    channel.consume("ORDER", (data) =>{//menerima data dari product-service
        console.log("consuming ORDER queue")
        const {products, userEmail} = JSON.parse(data.content)
        const newOrder = createOrder(products, userEmail)
        channel.ack(data)
        channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({newOrder})))
    })
})

app.listen(PORT,() =>{
    console.log(`Order-service running at http://localhost:${PORT}`)
})