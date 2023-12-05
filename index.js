// Authors: Pierce Walker, Nathan Moore, Traeden Overly, Patrick Petty
const express = require("express");

let app = express();

let path = require("path");  

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true})); // gets the .value of tags in a form
app.use(express.static(path.join(__dirname, 'public')));

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
    res.render("landingPage");
});

app.get("/landingPage", (req, res) => {
    res.render("landingPage");
});

app.get("/login", (req,res) => {
    res.render("login");
});

app.get("/info", (req,res) => {
    res.render("info");
});

app.get("/survey", (req, res) => {
    res.render("survey");
});

app.get("/dashboard", (req, res) => {
    res.render("dashboard");
});

app.post("/login", (req,res) => {
    res.send("");
});

app.post("/addRecord", (req, res) => {
    let aSelectedPlatforms = req.body.platformName || [];
    aSelectedPlatforms.forEach(platfrom => {

    });
    res.send(req.body.age);
    res.send(req.body.gender);
    res.send(req.body.relationshipStatus);
    res.send(req.body.occupation);
    res.send(req.body.organizationType);
    res.send(req.body.socialMediaUser);
    res.send(req.body.platformName);
    res.send(req.body.hoursOnSocialMedia);
    res.send(req.body.useSocialMediaNoPurpose);
    res.send(req.body.distractedBySocialMediaRating);
    res.send(req.body.restlessWhenNotUsingSocialMediaRating);
    res.send(req.body.easilyDistractedGeneralRating);
    res.send(req.body.botheredByWorriesGeneralRating);
    res.send(req.body.concentrationGeneralRating);
    res.send(req.body.compareToOthersRating);
    res.send(req.body.howComparissonFeelsRating);
    res.send(req.body.seekValidationRating);
    res.send(req.body.depressionGeneralRating);
    res.send(req.body.interestFluctuateRating);
    res.send(req.body.generalSleepRating);

    res.send("Survey submitted successfully!")
});

app.post("/report", (req, res) => {
    res.send(req.body.empFirst);
});

app.listen(port, () => console.log("Server is running"));