// Author: Pierce Walker, Nathan Moore, Traeden Overly, Patrick Petty
const express = require("express");

let app = express();

let path = require("path");  

const port = 3000;

app.use(express.urlencoded({extended: true})); // gets the .value of tags in a form

app.get("/", (req, res) => {
    res.send("");
});

app.post("/login", (req,res) => {
    res.send("");
});

app.post("/socialMedia", (req, res) => {
    res.sendFile(path.join(__dirname + '/test.html'));
});

app.post("/report", (req, res) => {
    res.send(req.body.empFirst);
});

app.listen(port, () => console.log("Server is running"));