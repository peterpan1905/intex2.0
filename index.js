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
        database : process.env.RDS_DB_NAME || "intex",
        port : process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
}); 

// Define the verifyToken middleware
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; // Extract the token from the Authorization header
        const decodedToken = jwt.verify(token, secretKey); // Verify the token using the secret key
        req.user = decodedToken; // Store the decoded user information in the request object
        next(); // Allow access if the token is valid
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' }); // Return unauthorized error if the token is invalid
    }
};

app.get("/data2", (req, res) => {
    knex.select().from("user as u").join('survey as s', 'u.survey_number', '=', 's.survey_number')
    .join('user_platform as up', 'u.survey_number', '=', 'up.survey_number')
    .join('platform as p', 'up.platform_number', '=', 'p.platform_number')
    .join('user_organization as uo', 'u.survey_number', '=', 'uo.survey_number')
    .join('organization as o', 'uo.organization_number', '=', 'o.organization_number').then( survey => {
        res.render("data2", { mysurvey : survey});
    })
})

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

app.get("/data", verifyToken, async (req, res) => {
    try {
        res.render("data");
      } catch (error) {
        console.error('Token verification failed:', error.message);
      }
    });

app.post("/login", async (req, res) => {
    // Validate the username and password (add your validation logic)
    const { username, password } = req.body;
    const user = await knex("logins").select("password").where("username", username).first();

    if (user && password === user.password) {
        // If the credentials are valid, generate a token
        const token = jwt.sign({ username: username }, secretKey, { expiresIn: "1h" });
        res.render("data");
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
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
        general_sleep: req.body.generalSleepRating
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

app.post("/report", (req, res) => {
    res.send(req.body.empFirst);
});

app.listen(port, () => console.log("Server is running"));