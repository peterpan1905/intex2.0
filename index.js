// Authors: Pierce Walker, Nathan Moore, Traeden Overly, Patrick Petty
const express = require("express");
const bodyParser = require("body-parser");
const { platform } = require("os");
const session = require("express-session");

let app = express();

let path = require("path");  
const { render } = require("ejs");

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true})); // gets the .value of tags in a form
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.json());
app.use(session({ secret: 'BananaPancakes', resave: false, saveUninitialized: true }));

const knex = require("knex")({
    client: "pg",
    connection: {
        host : process.env.RDS_HOSTNAME || "localhost",
        user : process.env.RDS_USERNAME || "postgres",
        password : process.env.RDS_PASSWORD || "buddy",
        database : process.env.RDS_DB_NAME || "intex",
        port : process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
}); 

function checkLoggedIn (req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect("/login"); //possibly add a variable to alert the client that they need to login to gain access
    }
}

app.get("/data2", checkLoggedIn, (req, res) => {
    let distinctSurveyNum = knex.select(knex.raw("distinct u.survey_number")).from("user as u").join('survey as s', 'u.survey_number', '=', 's.survey_number')
    .join('user_platform as up', 'u.survey_number', '=', 'up.survey_number')
    .join('platform as p', 'up.platform_number', '=', 'p.platform_number')
    .join('user_organization as uo', 'u.survey_number', '=', 'uo.survey_number')
    .join('organization as o', 'uo.organization_number', '=', 'o.organization_number')

    knex.select().from("user as u").join('survey as s', 'u.survey_number', '=', 's.survey_number')
    .join('user_platform as up', 'u.survey_number', '=', 'up.survey_number')
    .join('platform as p', 'up.platform_number', '=', 'p.platform_number')
    .join('user_organization as uo', 'u.survey_number', '=', 'uo.survey_number')
    .join('organization as o', 'uo.organization_number', '=', 'o.organization_number').then( survey => {
        res.render("data2", { mysurvey : survey, surveySelections: distinctSurveyNum})})
 });

 app.get("/data2/filtered", (req, res) => {
    let surveynum = req.query.surveySelect;
  
    knex.select()
      .from("user as u")
      .join('survey as s', 'u.survey_number', '=', 's.survey_number')
      .join('user_platform as up', 'u.survey_number', '=', 'up.survey_number')
      .join('platform as p', 'up.platform_number', '=', 'p.platform_number')
      .join('user_organization as uo', 'u.survey_number', '=', 'uo.survey_number')
      .join('organization as o', 'uo.organization_number', '=', 'o.organization_number')
      .where("u.survey_number", '=', surveynum)
      .then(survey => {
        res.render("data2", { mysurvey: survey });
      })
      .catch(error => {
        console.error('Error executing the query:', error);
        res.status(500).send('Internal Server Error');
      });
  });
  

app.get("/", (req, res) => {
    res.render("landingPage");
});

app.get("/landingPage", (req, res) => {
    res.render("landingPage");
});

// Serve your static files (like HTML, CSS, or images) from a folder
app.use(express.static('public'));
app.post("/contact", (req, res) => {
    const { name, email, subject, message } = req.body;

    // Process the form data as needed (e.g., send emails, save to a database)

    // For now, just log the form data
    console.log('Form Data:', { name, email, subject, message });

    // Respond to the client
    res.send('Form submission successful!');
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
    res.render("login")
});

app.get("/data", (req, res) => {

    });

app.post("/login", async (req, res) => {
    if (req.session.loggedIn) {
        res.send("You are already logged in")
    } else {
        const { username, password } = req.body;
        const dbUser = await knex("logins").select().where("username", username).first();
        if (!dbUser) {
            return res.status(400).send("Cannot find user");
        }
        try {
            if (password === dbUser.password) {
                req.session.loggedIn = true;
                req.session.username = username;
                res.redirect("data2");
            } else {
                res.redirect("/login"); // possibly pass a variable containing a string alerting the client the login was invalid
            }
        } catch (error) {
            console.error('Login error:', error.message);
            res.status(500).send();
        }
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect("/landingPage");
    })
});

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
        general_sleep: req.body.generalSleepRating,
        // location: "Provo"
    });
    const aSurveyNumbers = await knex("survey").select(knex.raw("max(survey_number) as max_survey_number"));
    const survey_number = aSurveyNumbers[0].max_survey_number
    const currentTimestamp = new Date();
    const targetTimezone = 'en-US';
    const formattedTimestamp = currentTimestamp.toLocaleString(targetTimezone, {
    timeZone: 'America/Denver', // Use 'America/Denver' for Mountain Time Zone
    month: 'numeric',
    day: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    });

    await knex("user").insert({
        // survey_number: survey_number,
        timestamp: currentTimestamp,
        age: req.body.age,
        gender: req.body.gender,
        relationship_status: req.body.relationshipStatus,
        occupation_status: req.body.occupation_status,
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
    res.render("survey")
});


app.listen(port, () => console.log("Server is running"));