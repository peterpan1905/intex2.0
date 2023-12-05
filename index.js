// Authors: Pierce Walker, Nathan Moore, Traeden Overly, Patrick Petty
const express = require("express");
const bodyParser = require("body-parser");
const { platform } = require("os");
const jwt = require("jsonwebtoken");

const secretKey = "ThisWillRemainASecret";

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
    try {
        const decodedToken = jwt.verify(token, secretKey);
        console.log(decodedToken);
      } catch (error) {
        console.error('Token verification failed:', error.message);
      }
    // try 
    // {
    //     const user = await knex("logins").select("password").where("username", req.localStorage.getItem("username")).first();
    
    //     if (user && user.password === req.localStorage.getItem("password")) 
    //     {
    //       res.render("data");
    //     } 
    //     else 
    //     {
    //       res.render("login");
    //     }
    // } catch (error) {
    //         res.render("login");
    //     }
    });

app.post("/login", async (req, res) => {
    // Validate the username and password (add your validation logic)
    const { username, password } = req.body;
    const user = await knex("logins").select("password").where("username", username).first();

    if (user && password === user.password) {
        // If the credentials are valid, generate a token
        const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
        res.json({ token });
        res.redirect("/data");
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});
//     const { username, password } = req.body;
  
//     try {
//       const user = await knex("logins").select("password").where("username", username).first();
  
//       if (user && user.password === password) {
//         req.session.username = username;
//         req.session.password = password;
//         res.redirect("/data");
//       } else {
//         res.render("login");
//       }
//     } catch (error) {
//       console.error("Error during login:", error);
//       res.render("login");
//     }
//   });

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


app.post("/addRecord", async (req, res) => {
    await knex("survey").insert({
        media_user: req.body.socialMediaUser,
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
    });
    const aSurveyNumbers = await knex("survey").select(knex.raw("max(survey_number) as max_survey_number"));
    const survey_number = aSurveyNumbers[0].max_survey_number
    await knex("user").insert({
        survey_number: survey_number,
        age: req.body.age,
        gender: req.body.gender,
        relationship_status: req.body.relationshipStatus,
        occupation: req.body.occupation,
    });
    let aPlatformName = [req.body.platformName];
    aPlatformName.forEach(platform => {
        if (platform != null){
                knex("user_platform").insert({
                    survey_number: survey_number,
                    platform_number: platform
            });
        }
    });
    let aOrganizationType = [req.body.organizationType];
    aOrganizationType.forEach(organization => {
        if (organization != null){
            knex("user_organization").insert({
                survey_number: survey_number,
                organization_number: organization
            });
        }
    });
});

app.post("/report", (req, res) => {
    res.send(req.body.empFirst);
});

app.listen(port, () => console.log("Server is running"));