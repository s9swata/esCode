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

    console.log(inputs);

    const submit = await fetch('https://j2gra3n3eb.execute-api.us-west-1.amazonaws.com/prod', {
        method: "POST",
        body: JSON.stringify({
            code: code,
            inputs: inputs
        })
    })

    console.log('request submitted');

    const output = await submit.json();

    const expected_output = problem.stdout;

    if(output){
        SUBMISSIONS.push(JSON.stringify({
            problemId,
            code,
            output,
            time: new Date()
        }))
    }

    let success = "";
    if(output.output === expected_output){
        success = "success"
    }else{
        success = "failed"
    }

    return res.json({msg: success});

});

app.get('/submissions/:problemId', auth, (req, res) => {
    const { problemId } = req.params;
    const submissions = SUBMISSIONS.filter(x => x.problemId === problemId && x.userId === req.userId);
    return res.json({ submissions });
});

app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});
