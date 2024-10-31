const express = require('express');
const app = express();
const PORT = 3000;
const { auth } = require('./middleware');
var jwt = require('jsonwebtoken');
const JWT_SECRET = "secret";
const USERS = [];
let USER_ID_COUNTER = 1;
const bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({extended: false});
const cors = require('cors');
app.use(cors());
app.use(jsonParser);


const Problems = require('./problems');

const PROBLEMS = Problems;

const SUBMISSIONS = [];


app.get('/', (req,res) => {
    res.send('Hello World!');
});


app.get('/problems', (req, res) => {
    return res.json(PROBLEMS);
})


app.get('/problem/:problemId', (req, res) => {
    const id = req.params.problemId;
    const problem = PROBLEMS.find(x => x.problemId === id);

    if(!problem){
        return res.status(483).json({msg: "No such problem!"});
    }
    return res.json({
        problem,
    })
})

app.post('/signup', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = USERS.find(x => x.username === username);

    if(user){
        return res.json({msg: "User already exists"});
    }

    USERS.push({
        id: USER_ID_COUNTER++,
        username,
        password
    });

    return res.json({msg: "User signed up!"});
});


app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = USERS.find(x => x.username === username);

    if (!user){
        return res.status(483).json({msg: "User not found!"});
    }

    if (user.password !== password){
        return res.status(403).json({msg: "Incorrect password!"})
    }

    const token = jwt.sign({
        id: user.id 
    }, JWT_SECRET);

    return res.json(token);

});


app.get('/me', auth, (req, res) => {
    const user = USERS.find(x => x.id === req.userId);
    if(!user){
        return res.status(403).json({msg: "User doesnt exist"});
    }
    return res.json({ user })
})

app.post('/submission', auth, async (req, res) => {

    const { lang_id, problemId, submission } = req.body;
    const problem = PROBLEMS.find(problem => problem.problemId === problemId);
    const stdin = problem.stdin;
    const stdout = problem.stdout;

    const token = await fetch('http://localhost:2358/submissions/?base64_encoded=false&wait=false', {
        method: "POST",
        body: JSON.stringify({
            source_code: submission,
            language_id: lang_id,
            stdin: stdin,
            expected_output: stdout
        })
    }).token;

    console.log(token);

    const result = await fetch(`http://localhost:2358/submissions/${token}?base64_encoded=false&fields=stdout,stderr,status_id,language_id`, {
        method: "GET"
    })

    console.log(result);

    const status_id = result.status_id;
    console.log(status_id);
    const status = status_id === 3 ? "accepted" : "rejected";

    SUBMISSIONS.push({
        problemId,
        userId : req.userId,
        submission,
        status,
        time: new Date()
    })
});


app.get('/submissions/:problemId', auth, (req, res) => {
   const problemId = req.params.problemId;
   const submissions = SUBMISSIONS.filter(x => x.problemId === problemId && x.userId === req.userId);
   return res.json(
    {
        submissions,
    }
   )
})

app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});

