// Author: Pierce Walker, Nathan Moore, Traedon Overly, Patrick Petty
const express = require("express");

let app = EXPRESS();

let path = require("path");  

const port = 3000;

app.use(express.urlencoded({extended: true})); // gets the .value of tags in a form

app.get("/", (req, res) => {
    res.send("This is my first node express application");
});

app.get("/help", (req,res) => {
    res.send("Please contact tech support");
});

app.get("/testme", (req, res) => {
    res.sendFile(path.join(__dirname + '/test.html'));
});

app.post("/storeIt", (req, res) => {
    res.send(req.body.empFirst);
});

app.listen(port, () => console.log("Server is running"));