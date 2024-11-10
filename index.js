const express = require('express');
const app = express();
const PORT = 3000;
const { auth } = require('./middleware');
const jwt = require('jsonwebtoken');
const JWT_SECRET = "secret";
const USERS = [];
let USER_ID_COUNTER = 1;
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const cors = require('cors');
app.use(cors());
app.use(jsonParser);

const Problems = require('./problems');
const PROBLEMS = Problems;
const SUBMISSIONS = [];

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/problems', (req, res) => {
    return res.json(PROBLEMS);
});

app.get('/problem/:problemId', (req, res) => {
    const id = req.params.problemId;
    const problem = PROBLEMS.find(x => x.problemId === id);

    if (!problem) {
        return res.status(404).json({ msg: "No such problem!" });
    }
    return res.json({ problem });
});

app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    const user = USERS.find(x => x.username === username);

    if (user) {
        return res.json({ msg: "User already exists" });
    }

    USERS.push({ id: USER_ID_COUNTER++, username, password });
    return res.json({ msg: "User signed up!" });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = USERS.find(x => x.username === username);

    if (!user) {
        return res.status(404).json({ msg: "User not found!" });
    }

    if (user.password !== password) {
        return res.status(403).json({ msg: "Incorrect password!" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    return res.json({ token });
});

app.get('/me', auth, (req, res) => {
    const user = USERS.find(x => x.id === req.userId);
    if (!user) {
        return res.status(403).json({ msg: "User doesn't exist" });
    }
    return res.json({ user });
});

app.post('/submission', auth, async (req, res) => {
    
    const code = req.body.submission;
    const problemId = req.body.problemId;

    const problem = PROBLEMS.find(problem => problem.problemId === problemId);
    const inputs = problem.stdin;

    console.log(inputs)

    let testCasesPassed = 0;
    let failedCases = [];

    for(let i=0; i < inputs.length; i++){

        element = inputs[i];

        const submit = await fetch('https://j2gra3n3eb.execute-api.us-west-1.amazonaws.com/prod', {
            method: "POST",
            body: JSON.stringify({
                code: code,
                inputs: element
            })
        })
    
        console.log('request submitted');

        const output = await submit.json();
        const expected_output = problem.stdout[i];
        console.log(output);

        if(output.output === expected_output){
            testCasesPassed++;
        }else{
            failedCases.push(i);
            console.log(`Test case ${i+1} failed`);
        }
    
    };

    console.log(testCasesPassed);

    SUBMISSIONS.push(JSON.stringify({
        problemId,
        code: code,
        testCasesPassed,
        time: new Date()
    }))
    
    return res.json({failedCases: failedCases});

});

app.post('/submission/cpp', auth, async (req, res) => {
    const source_code = req.body.submission;
    const problemId = req.body.problemId;

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
                language_id: 53
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
        time: new Date()
    }))
    
    return res.json({failedCases: failedCases});

})

app.get('/submissions/:problemId', auth, (req, res) => {
    const { problemId } = req.params;
    const submissions = SUBMISSIONS.filter(x => x.problemId === problemId && x.userId === req.userId);
    return res.json({ submissions });
});

app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});
