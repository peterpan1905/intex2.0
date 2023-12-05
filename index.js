// Authors: Pierce Walker, Nathan Moore, Traeden Overly, Patrick Petty
const express = require("express");
const bodyParser = require("body-parser");
const { platform } = require("os");

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
        port : process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
}); 

app.get("/", (req, res) => {
    res.render("landingPage");
});

app.get("/landingPage", (req, res) => {
    res.render("landingPage");
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

app.get("/login", (req,res) => {
    res.render("login");
});

app.get("/data", async (req, res) => {
    try 
    {
        const user = await knex("logins").select("password").where("username", req.localStorage.getItem("username")).first();
    
        if (user && user.password === req.localStorage.getItem("password")) 
        {
          res.render("data");
        } 
        else 
        {
          res.render("login");
        }
    }
    catch (error) 
        {
            res.render("login");
        }
    });

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await knex("logins").select("password").where("username", username).first();
  
      if (user && user.password === password) {
        res.render("data");
      } else {
        res.send("Username and password incorrect.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).send("Internal Server Error");
    }
  });

// app.post("/login", async (req, res) => {
//     try {
//         const user = await knex("logins").select("password").where("username", localStorage.getItem("username"));

//         if (user && user.password === localStorage.getItem("password")) {
//             res.render("data");
//         } else {
//             res.send("Username and password incorrect.");
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Internal Server Error");
//     }
// });


app.post("/addRecord", (req, res) => {
    let aPlatformName = req.body.platformName;
    aPlatformName.forEach(platform => {
        knex("smumhdb").insert({
            age: req.body.age,
            gender: req.body.gender,
            relationship_status: req.body.relationshipStatus,
            occupation: req.body.occupation,
            organization_number: req.body.organizationType,
            media_user: req.body.socialMediaUser,
            platform_number: platform,
            hours_on_media: req.body.hoursOnSocialMedia,
            use_media_no_purpose: req.body.useSocialMediaNoPurpose,
            distracted_by_media: req.body.distractedBySocialMediaRating,
            restless_not_using_media: req.body.restlessWhenNotUsingSocialMediaRating,
            easily_distracted: req.body.easilyDistractedGeneralRating,
            bothered_by_worries: req.body.botheredByWorriesGeneralRating,
            concentration: req.body.concentrationGeneralRating,
            compare_to_others: req.body.compareToOthersRating,
            how_comparisson_feels: req.body.howComparissonFeelsRating,
            seek_validation: req.body.seekValidationRating,
            depression: req.body.depressionGeneralRating,
            interest_fluctuate: req.body.interestFluctuateRating,
            general_sleep: req.body.generalSleepRating
        })
    });
    res.send("Survey submitted successfully!")
});

app.post("/report", (req, res) => {
    res.send(req.body.empFirst);
});

app.listen(port, () => console.log("Server is running"));