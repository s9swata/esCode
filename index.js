const express = require('express');
const app = express();
const PORT = 3000;
const PATH = "http://13.56.177.109:2358";
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
    try {
        const { submission: source_code, lang_id, problemId } = req.body;
        const problem = PROBLEMS.find(problem => problem.problemId === problemId);

        if (!problem) {
            return res.status(404).json({ msg: "Problem not found" });
        }

        const { stdin, stdout } = problem;

        const submissionResponse = await fetch(`${PATH}/submissions/?base64_encoded=false&wait=false`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source_code, language_id: lang_id, stdin, expected_output: stdout })
        });

        const { token } = await submissionResponse.json();

        const result = await fetch(`${PATH}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,status_id,language_id`, {
            method: "GET"
        });

        const resultJson = await result.json();
        const status = resultJson.status_id === 3 ? "accepted" : "rejected";

        SUBMISSIONS.push({ problemId, userId: req.userId, submission: source_code, status, time: new Date() });

        res.json({ msg: "Submission recorded", status });
    } catch (error) {
        console.error("Submission error:", error);
        res.status(500).json({ msg: "Error processing submission" });
    }
});

app.get('/submissions/:problemId', auth, (req, res) => {
    const { problemId } = req.params;
    const submissions = SUBMISSIONS.filter(x => x.problemId === problemId && x.userId === req.userId);
    return res.json({ submissions });
});

app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});
