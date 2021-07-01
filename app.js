const express = require('express');
const cors = require('cors');

const app = express();
const port = 8080;

app.use(cors())

app.get('/', (req, res) => {
    res.json({
        message: 'Hello World'
    });
});

app.get('/:name', (req, res) => {
    let name = req.params.name;

    res.json({
        message: `Hello ${name}`
    });
});

app.listen(process.env.PORT || port, () => {
    console.log('server is listening');
});
