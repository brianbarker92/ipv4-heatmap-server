const csv = require('csv-parser');
const fs = require('fs');

var ipData = []
fs.createReadStream('GeoLite2-City-Blocks-IPv4.csv')
  .pipe(csv())
  .on('data', (row) => {
    //console.log(row);
	ipData.push(row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });


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

app.get('/ipv4heatmap', (req, res) => {
    //let name = req.params.name;  // /:name
	res.json(ipData);
    //res.json({
    //    message: `Hello ${name}`
    //});
});

app.listen(process.env.PORT || port, () => {
    console.log('server is listening');
});
