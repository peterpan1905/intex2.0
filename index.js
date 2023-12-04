// Author: Pierce Walker, Nathan Moore, Traeden Overly, Patrick Petty
const express = require("express");

let app = express();

let path = require("path");  

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true})); // gets the .value of tags in a form

const knex = require("knex")({
    client: "pg",
    connection: {
        host : process.env.RDS_HOSTNAME || "localhost",
        user : process.env.RDS_USERNAME || "postgres",
        password : process.env.RDS_PASSWORD || "buddy",
        database : process.env.RDS_DB_NAME || "music",
        port : process.env.RDS_PORT || 5433,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
}); 

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