// Authors: Pierce Walker, Nathan Moore, Traeden Overly, Patrick Petty
const express = require("express");
const bodyParser = require("body-parser");
const { platform } = require("os");
const session = require("express-session");
let path = require("path");  

let app = express();

const { render } = require("ejs");

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(session({ secret: 'BananaPancakes', resave: false, saveUninitialized: true }));
app.use(express.static('public'));

// Connect to postgres database
const knex = require("knex")({
    client: "pg",
    connection: {
        host : process.env.RDS_HOSTNAME || "localhost",
        user : process.env.RDS_USERNAME || "postgres",
        password : process.env.RDS_PASSWORD || "admin",
        database : process.env.RDS_DB_NAME || "intex",
        port : process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
}); 

// function to allow access to blocked pages if someone is logged in
function checkLoggedIn (req, res, next) {
    let loginMessage = "You need to login to view that page."
    if (req.session.loggedIn) {
        next();
    } else {
        res.render("login", { loginMessage: loginMessage, loggedIn: req.session.loggedIn });
    }  
}

// route to display create.ejs
app.get("/create", checkLoggedIn, (req, res) => {
    let errorMessage = null;
    let successMessage = null;
    let loggedInUsername = req.session.username;

    if(loggedInUsername === "admin"){
        res.render("create", {errorMessage, successMessage, loggedIn: req.session.loggedIn});
    }
    else{
        res.render("login", {loggedIn: req.session.loggedIn});
    }
});

app.post('/create', async (req, res) => {
    const { username, password, confirmPassword } = req.body;
    let errorMessage = null;

    // Check if the username already exists
    const dbUser = await knex("logins").select().where('username', '=', username);

    if (dbUser.length > 0) {
        // Username already exists
        errorMessage = 'That username is already being used';
    } else {
        // Continue with the user creation logic
        if (password !== confirmPassword) {
            errorMessage = 'Passwords need to match';
        } else {
            await knex("logins").insert({ username: username, password: password });
            // Redirect to the account page after successful user creation
            return res.redirect('/account');
        }
    }
    // Render the create page with the appropriate messages
    res.render('create', { errorMessage, loggedIn: req.session.loggedIn });
});

// default rout to display landing page
app.get("/", (req, res) => {
    res.render("landingPage", {loggedIn : req.session.loggedIn});

});

// route to display landing page
app.get("/landingPage", (req, res) => {
    res.render("landingPage", {loggedIn : req.session.loggedIn});
});

// route to send contact information from the form on the home (/landingPage) and info pages
app.post("/contact", (req, res) => {
    const { name, email, subject, message } = req.body;

    // Process the form data as needed (e.g., send emails, save to a database)

    console.log('Form Data:', { name, email, subject, message });

    res.send('Form submission successful!');
});

// route to display info.ejs
app.get("/info", (req,res) => {
    res.render("info", {loggedIn: req.session.loggedIn});
});

// route to dispaly survey
app.get("/survey", (req, res) => {
    res.render("survey", {loggedIn: req.session.loggedIn});
});

// route to display the tableau dashboard
app.get("/dashboard", (req, res) => {
    res.render("dashboard", {loggedIn: req.session.loggedIn});
});

// route to display the login page
app.get("/login", (req,res) => {
    let loginMessage = null;
    res.render("login", { loginMessage: loginMessage, loggedIn: req.session.loggedIn });
});

// route to log the user in and send them to data.ejs or display an error message if they put the wrong username or password
app.post("/login", async (req, res) => {
    let loginMessage = null;
    if (req.session.loggedIn) {
        loginMessage = "You are already logged in.";
        res.render("login", { loginMessage: loginMessage, loggedIn: req.session.loggedIn })
    } else {
        const { username, password } = req.body;
        const dbUser = await knex("logins").select().where("username", username).first();
        if (!dbUser) {
            loginMessage = "Incorrect username."
            return res.render("login", { loginMessage: loginMessage, loggedIn: req.session.loggedIn });
        }
        try {
            if (password === dbUser.password) {
                req.session.loggedIn = true;
                req.session.username = username;
                res.redirect("data");
            } else {
                loginMessage = "Incorrect password."
                res.render("login", { loginMessage: loginMessage, loggedIn: req.session.loggedIn });
            }
        } catch (error) {
            console.error('Login error:', error.message);
            res.status(500).send();
        }
    }
});

// route to logout the user
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect("/landingPage");
    })
});

// route to add a survey to our postrgres databases. Once submitted, it renders survey.ejs. Table names: "survey", "user", "user_platform", "user_organization"
app.post("/addRecord", async (req, res) => {
    // insert information to the "survey" table
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
    });

    const survey_number = await knex("survey").select(knex.raw("cast(max(survey_number) as INT) as max_survey_number")).first(); // retrieve the most recent survey number
    const maxSurveyNumber = survey_number.max_survey_number; // set survey_number equal to the most recent survey number submitted. This variable will be used in the other three tables (other than the "survey" table where the survey number is auto generated
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
    })
    
    // insert the survey information to the "user" table
    await knex("user").insert({
        survey_number: maxSurveyNumber,
        location: "Provo",
        timestamp: formattedTimestamp,
        age: req.body.age,
        gender: req.body.gender,
        relationship_status: req.body.relationshipStatus,
        occupation_status: req.body.occupation,    
    });

    // insert the survey information to the "user_platform" table to keep track of all the platforms a user selected as the ones they use
    let aPlatformName = req.body.platformName;
    // aPlatformName.forEach(async platform => {
    //     if (platform != null){
    //             await knex("user_platform").insert({
    //                 survey_number: maxSurveyNumber,
    //                 platform_number: platform
    //         });
    //     }
    // });
    for (const platform of aPlatformName) {
        if (platform != null) {
            await knex("user_platform").insert({
                survey_number: maxSurveyNumber,
                platform_number: platform
            });
        }
    }

    // insert the survey information to the "user_organization" table to keep track of all the organizations a user selects as being affiliated with
    let aOrganizationType = req.body.organizationType;
    // aOrganizationType.forEach(async organization => {
    //     if (organization != null){
    //         await knex("user_organization").insert({
    //             survey_number: maxSurveyNumber,
    //             organization_number: organization
    //         });
    //     }
    // });
    for (const organization of aOrganizationType){
        if (organization != null){
            await knex("user_organization").insert({
                survey_number: maxSurveyNumber,
                organization_number: organization
            })
        }
    }
    res.render("survey", {loggedIn: req.session.loggedIn})
});

// route to render account.ejs, but only when the user is logged in (using the checkLoggedIn function)
app.get("/account", checkLoggedIn, (req, res) => {
    tempusername = req.session.username
    if (tempusername === "admin") {
        // Display all data for the admin
        knex.select().from("logins").then(user => {
            res.render("account", { dbUser : user, loggedIn: req.session.loggedIn, loggedInUsername: req.session.username });
        });
    } else {
        // Display data only for the specific username
        knex.select().from("logins").where("username", tempusername).then(user => {
            res.render("account", { dbUser : user, loggedIn: req.session.loggedIn, loggedInUsername: req.session.username });
        });
    }
});

app.get("/edituser", checkLoggedIn, (req, res) => {

    let currentUsername = req.query.editusername;
  
    // Fetch the current user's information
    knex.select().from("logins").where("username", "=", currentUsername)
      .then(user => {
        res.render("edituser", { currentUsername: currentUsername, currentUser: user[0], loggedIn: req.session.loggedIn, loggedInUsername: req.session.username });
    })
      .catch(error => {
        // Handle error
        console.error(error);
        res.status(500).send("Internal Server Error");
    });
});  

// update user username and password
app.post("/updateuser", (req, res) => {
    let currentUsername = req.body.currentUsername;
    let newUsername = req.body.newUsername;
    let newPassword = req.body.newPassword;
  
    // Define an object to store the fields to be updated
    let updateFields = {};
  
    // Check if a new username is provided
    if (newUsername && newUsername.trim() !== "") {
      updateFields.username = newUsername;
    }
  
    // Check if a new password is provided
    if (newPassword && newPassword.trim() !== "") {
      updateFields.password = newPassword;
    }
  
    // Update the user's information in the database
    knex("logins")
      .where("username", "=", currentUsername)
      .update(updateFields)
      .then(() => {
        res.redirect("/account"); // Redirect to the home page or another appropriate location
      })
      .catch(error => {
        // Handle error
        console.error(error);
        res.status(500).send("Internal Server Error");
      });
  });   

  app.post("/deleteuser", (req, res) => {
    let deleteUsername = req.body.deleteusername;
    let currentUsername = req.session.username;

    knex("logins")
        .where("username", "=", deleteUsername)
        .delete()
        .then(() => {
            // Check if the deleted account is the one logged in
            if (currentUsername === deleteUsername) {
                res.redirect("/logout"); // Redirect to the login page
            } else {
                res.redirect("account"); // Redirect to the home page or another appropriate location
            }
        })
        .catch(error => {
            // Handle error
            console.error(error);
            res.status(500).send("Internal Server Error");
        });
  });

// route to render data.ejs with a table of all the surveys submitted
app.get("/data", checkLoggedIn, (req, res) => {
    knex.select().from("user as u").join('survey as s', 'u.survey_number', '=', 's.survey_number')
    .join('user_platform as up', 'u.survey_number', '=', 'up.survey_number')
    .join('platform as p', 'up.platform_number', '=', 'p.platform_number')
    .join('user_organization as uo', 'u.survey_number', '=', 'uo.survey_number')
    .join('organization as o', 'uo.organization_number', '=', 'o.organization_number').then( survey => {
        res.render("data", { mysurvey : survey, loggedIn: req.session.loggedIn})})
});

// route to show only the selected survey results
app.get("/datafiltered", (req, res) => {
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
    res.render("data", { mysurvey: survey, loggedIn: req.session.loggedIn });
    })
    .catch(error => {
    console.error('Error executing the query:', error);
    res.status(500).send('Internal Server Error');
    });
});

app.listen(port, () => console.log("Server is running"));
