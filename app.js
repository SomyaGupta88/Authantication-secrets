//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose= require("mongoose");
const session = require("express-session");
const passport= require("passport");
const passportLocalMongoose= require('passport-local-mongoose');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: true,

}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);

const userSchema= new mongoose.Schema({
    email: String,
    password: String,
    secret: [String]
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//TODO
app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.render("login");
    }
    
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        User.find({"secret":{$ne: null}}, (err, foundUsers)=>{
            if(err){
                console.log(err);
            }
            else{
                if(foundUsers){
                    res.render("secrets",{usersWithSecrets: foundUsers});
                }
            }
        });
    }
    else{
        res.redirect("/");
    }
});

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/");
    }
});

app.post("/submit",(req,res)=>{
    const submittedSecret = req.body.secret;
    //console.log(req.user) -->log everything other than password
    User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                foundUser.secret.push(submittedSecret);
                foundUser.save(()=>{
                    res.redirect("/secrets");
                });
            }
        }
    });
});

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
});

app.post("/register",(req,res)=>{
    User.register({username: req.body.username},req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login",(req,res)=>{
    const user= new User({
        username: req.body.username,
        password:req.body.password
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});