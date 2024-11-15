const express = require('express');
const app = express();
const PORT = 3000;
const { auth } = require('express-oauth2-jwt-bearer');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const cors = require('cors');
const dotenv = require('dotenv');
app.use(cors());
app.use(jsonParser);
dotenv.config();

const domain = process.env.DOMAIN;

const jwtCheck = auth({
    audience: `https://es-code-client.vercel.app/`,
    issuerBaseURL: 'https://dev-skne2ots1cwlwxnk.us.auth0.com/',
    tokenSigningAlg: 'RS256'
  });

const PROBLEMS = require('./problems');

const SUBMISSIONS = [];
  
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
        console.log(result.token)

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
        console.log(stdout)
        if(stdout === expected_output){
            testCasesPassed++
        }else{
            failedCases.push(i);
            console.log(`Test case ${i+1} failed`);
        }
    }
    console.log(testCasesPassed);

    SUBMISSIONS.push(JSON.stringify({
        problemId,
        code: source_code,
        testCasesPassed,
        time: new Date(),
        username: username
    }))
    
    return res.json({failedCases: failedCases});

})

app.get('/submissions/:problemId', jwtCheck, (req, res) => {
    const { problemId } = req.params;
    const submissions = SUBMISSIONS.filter(x => x.problemId === problemId && x.userId === req.userId);
    return res.json({ submissions });
});

app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});
