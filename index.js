import express from "express"
import { config } from "dotenv"
import cookieParser from "cookie-parser"
import path from "path"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"


// database connection

mongoose.connect("mongodb://localhost:27017", {
    dbname: "Authentication"
}).then(() => {
    console.log("Database connection successful")
}).catch((err) => {
    console.log(err)
})
//Schema
const user = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    }
})
//Model
const User = mongoose.model("User", user)

// jwt token


//custom middleware
const isAuthenticated = (req, res, next) => {
    const { token } = req.cookies;
    if (token) {

        jwt.verify(token, process.env.SECRET_KEY)
        next();
    }
    else {
        res.render("login")
    }
}



config({ path: "./config/.env" })
const app = express()

app.use(cookieParser())
app.use(express.static(path.join(path.resolve(), "public")))
app.use(express.urlencoded({ extended: true }))

app.set("view engine", "ejs")





app.post("/login", async (req, res) => {
    const { name, email } = req.body
    const users = await User.create({
        name: name,
        email: email
    })


    const token = jwt.sign({ _id: users._id }, process.env.SECRET_KEY)




    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000)
    })
    res.redirect("/")
})
app.get("/", isAuthenticated, (req, res) => {
    res.render('logout')
})
app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now())
    })
    res.redirect("/")
})





app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`)
})