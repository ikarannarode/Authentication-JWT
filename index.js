import express from "express"
import { config } from "dotenv"
import cookieParser from "cookie-parser"
import path from "path"
import mongoose, { mongo } from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"




config({ path: "./config/.env" })
const app = express()


// Database Connection

mongoose.connect("mongodb+srv://karannarode999:Password@cluster0.4dxtvm6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    dbName: "Authentication"
}).then(() => {
    console.log("Database Connected Succesfull")
}).catch((err) => {
    console.log(err)
})

const userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String
})

const User = mongoose.model("User", userSchema)






// setting up view engine
app.set("view engine", "ejs")

//Middlewares

app.use(cookieParser())
app.use(express.static(path.join(path.resolve(), "public")))
app.use(express.urlencoded({ extended: true }))

//Custom middlewares
const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies
    if (token) {
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        // console.log(decoded)
        req.user = await User.findById(decoded);

        next()
    }
    else {
        res.redirect("/login")
    }
}




// Routs



app.post("/login", async (req, res) => {
    const { email, password } = req.body
    let user = await User.findOne({ email })
    if (!user) {
        return res.redirect("/register")
    }
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        return res.render("login", { email, message: "Incorrect Password" })
    }




    const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY)

    res.cookie("token", token, {
        expires: new Date(Date.now() + 60 * 1000),
        httpOnly: true
    })
    res.redirect("/")


})



app.post("/register", async (req, res) => {
    const { name, email, password } = req.body
    let user = await User.findOne({ email })
    if (user) {
        return res.redirect("/login")
    }
    const hashedpassword = await bcrypt.hash(password, 10)
    user = await User.create({
        name: name,
        email: email,
        password: hashedpassword
    })
    const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY)

    res.cookie("token", token, {
        expires: new Date(Date.now() + 60 * 1000),
        httpOnly: true
    })
    res.redirect("/")
})





app.get("/login", async (req, res) => {
    res.render("login")
})





app.get("/", isAuthenticated, (req, res) => {

    res.render("logout", { name: req.user.name })
});




app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    })
    res.redirect("/")
})


app.get("/register", (req, res) => {
    res.render("register")
})








// Server Port
app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`)
})