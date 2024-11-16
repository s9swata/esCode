const express = require('express');
const app = express();
const PORT = 3000;
const { auth } = require('express-oauth2-jwt-bearer');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
app.use(cors());
app.use(jsonParser);
dotenv.config();


const jwtCheck = auth({
    audience: `https://dev-skne2ots1cwlwxnk.us.auth0.com/api/v2/`,
    issuerBaseURL: 'https://dev-skne2ots1cwlwxnk.us.auth0.com/',
    tokenSigningAlg: 'RS256'
  });

const PROBLEMS = require('./problems');

const SUBMISSIONS = require('./models/Submissions');
const DISCUSSIONS = require('./models/Discuss');
const AURA = require('./models/Aura');

let connectionString = process.env.CONNECTION_STRING;

async function connectToDb(){
    try{
        await mongoose.connect(connectionString, {
            autoIndex: true
        })
        console.log('connected to db');
    }catch(err){
        console.log(err);
    }
}

connectToDb()
.then(() => {
    app.listen(PORT, () => {
        console.log(`Server started on ${PORT}`);
    })
})
  
app.get('/problems', (req, res) => {
    return res.json(PROBLEMS);
});

app.get('/secure', jwtCheck, (req, res) => {
    res.send('Secure Route');
});

app.get('/problem/:problemId', (req, res) => {
    const id = req.params.problemId;
    const problem = PROBLEMS.find(x => x.problemId === id);

    if (!problem) {
        return res.status(404).json({ msg: "No such problem!" });
    }
    return res.json({ problem });
});


app.post('/submission/cpp', jwtCheck, async (req, res) => {
    const source_code = req.body.submission;
    const problemId = req.body.problemId;
    const username = req.body.username;
    const language = req.body.language;

    let lang_id = language === 'cpp' ? 53 : 62;

    const problem = PROBLEMS.find(problem => problem.problemId === problemId);
    if(!problem){
        return res.json({msg: "No such problem"});
    }

    const inputs = problem.stdin;

    let testCasesPassed = 0;
    let failedCases = [];

    for(let i = 0; i < inputs.length; i++){
        const stdin = inputs[i];
        const expected_output = problem.stdout[i];
        console.log(lang_id);

        const token = await fetch('http://13.56.177.109:2358/submissions?base64_encoded=false&wait-false', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                source_code: source_code,
                stdin: stdin,
                language_id: lang_id
            })
        })

        console.log('request submitted');

        const result = await token.json();
        console.log(result.token);

        let statusId = 0;
        let RESPONSE = "";
        while(statusId < 3){
            const webhook = await fetch(`http://13.56.177.109:2358/submissions/${result.token}?base64_encoded=false&fields=stdout,stderr,status_id,language_id`, {
                method: "GET",
            })
            const webhookJSON = await webhook.json()
            console.log(webhookJSON);
            const status_id = webhookJSON.status_id;
            console.log(status_id);
            statusId = status_id;
            RESPONSE = webhookJSON;
            
    }
    
        const stdout = RESPONSE.stdout;
        console.log(stdout);
        console.log(expected_output);
        if(stdout === expected_output){
            testCasesPassed++
        }else{
            failedCases.push(i);
            console.log(`Test case ${i+1} failed`);
        }
    }
    console.log(testCasesPassed);
    let Total_Aura = 0;
    try {
        const exisitingSubmission = await SUBMISSIONS.findOne({username: username, problem_id: problemId});
        let auraPoints = exisitingSubmission ? 0 : testCasesPassed*2;
        const submission = await SUBMISSIONS.create({
            username: username, 
            source_code: source_code, // Source code submission
            problem_id: problemId, 
            test_cases_passed: testCasesPassed 
        });
        let Aura = null;
        if(!exisitingSubmission){
            Aura = await AURA.findOneAndUpdate(
                {username: username},
                { $inc: {aura: auraPoints}},
                {
                    new: true,
                    upsert: true
                }
            );
        }
        console.log("Aura updated:", Aura);
        Total_Aura = Aura.aura;
        console.log('Submission created successfully:', submission);
    } catch (error) {
        console.error('Error creating submission:', error.message);
    }
    
    return res.json({failedCases: failedCases,
        aura: Total_Aura
    });

})

app.get('/submissions/:username', jwtCheck, (req, res) => {
    const { username } = req.params;
    const submissions = SUBMISSIONS.find({username: username}) 
    return res.send(submissions);
});

app.get('/submissions', async (req, res) => {
    const allSubmissions = await SUBMISSIONS.find({});
    res.send(allSubmissions);
})

app.get('/aura/:username', async (req, res) => {
    const aura = await AURA.find({username: req.params.username});
    if(!aura)
        return res.send(0);

    return res.send(aura[0]);
})

app.post('/discuss', jwtCheck, async (req, res) => {
    const { username, title, body } = req.body;
    try{
        const discussion = await DISCUSSIONS.create(
            {
                username: username,
                title: title,
                body: body
            }
        )
        console.log("Discussion created successfully", discussion);
        return res.status(200).json({msg: "Discussion created"});
    }catch(e){
        console.log("Error creating discussion",e);
        return res.status(400).json({msg: "error while submitting request"});
    }
})

app.get('/discuss/all', async(req, res) => {
    try{
        const discussions = await DISCUSSIONS.find({});
        return res.send(discussions);
    }catch(e){
        return res.status(400).json({error: e});
    }
})

app.get('/leaderboard', async(req, res) => {
    try{
        const leaderboard = await AURA.find().sort({aura: -1});
        return res.send(leaderboard);
    }catch(e){
        return res.status(400).json({error: e});
    }
})
