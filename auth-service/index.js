const express = require('express')
const app = express()
const PORT = process.env.PORT || 6000
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const User = require('./model/user')
app.use(express.json())

mongoose.connect("mongodb://localhost/auth-service", {
    useNewUrlParser: true,
    useUnifiedTopology:true
}, ()=>{
    console.log(`Auth-server DB connected`)
})

//router
app.post("/auth/register", async(req,res) =>{
    const {email, password, name } = req.body

    const userExist = await User.findOne({email})
    if(userExist){
        return res.json({message:"user already exist"})
    }else{
        const newUser = new User({
            name,
            email,
            password
        })
        newUser.save()
        return res.json(newUser)
    }
})
app.post("/auth/login", async(req,res)=>{
    const {email , password } = req.body

    const user = await User.findOne({email})
    if(!user){
        return res.json({message:"user doesn't exist"})
    }else{
        //check password correct
        if( password !== user.password){
            return res.json({message: "password incoreect"})
        }
        const payload = {
            email,
            name: user.name
        };
        jwt.sign(payload, "secret",(err, token) =>{
            if (err) {
                console.log(err)
            } else {
                return res.json({token: token})
            }
        })
    }
})

app.listen(PORT, ()=> {
    console.log(`Auth service at http://localhost:${PORT}`)
})