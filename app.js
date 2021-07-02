var compression = require('compression')

const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

function writeFile(filename, data) {
	const csvWriter = createCsvWriter({
	  path: filename,
	  header: [
		{id: 'latitude', title: 'latitude'},
		{id: 'longitude', title: 'longitude'},
		{id: 'heat', title: 'heat'},
	  ]
	});

	csvWriter
	  .writeRecords(data)
	  .then(()=> console.log('The compressed CSV file:' + filename + ' was written successfully'));
}

function readFile(filename, iscompressed) {
	ipData = [];
	fs.createReadStream(filename)
	  .pipe(csv())
	  .on('data', (row) => {
		var loc = null;
		if (iscompressed) {
			loc = {latitude:row['latitude'],longitude:row['longitude'], heat:row['heat']};
		} else {
			loc = {latitude:row['latitude'],longitude:row['longitude'], heat:1};
		}
		ipData.push(loc);
	  })
	  .on('end', () => {
		console.log('CSV file: ' + filename + ' successfully loaded');
	});
	return ipData;
}

//var ipData = readFile('ipv4-1000.csv', false);
var ipData = readFile('ipv4-compressed.csv', true);
var fullData = null
//var fullData = readFile('ipv4-full.csv', false); //uncomment if you want to reload the full dataset

 
const express = require('express');
const cors = require('cors');

const app = express();
const port = 8080;

app.use(cors())

app.use(compression())

app.get('/', (req, res) => {
    res.json({
        message: 'Hello World'
    });
});

app.get('/ipv4heatmapbounded/:lower_lat?/:higher_lat?/:lower_long?/:higher_long?', (req, res) => {
	var low_lat = parseFloat(req.params.lower_lat);
	var high_lat = parseFloat(req.params.higher_lat);
	var low_lng = parseFloat(req.params.lower_long);
	var high_lng = parseFloat(req.params.higher_long);
	
	//if(!low_lat || !high_lat || !low_lng || !high_lng) { //if missing any bound, just serve top 1000
	//	res.json(ipData.slice(0,1000));
	//	return;
	//}
	
	var locs = [];
	ipData.forEach(function(item, index, array) {
          let lat = parseFloat(item['latitude']);
          let lng = parseFloat(item['longitude']);
          if((lat >= low_lat && lat <= high_lat)
            && (lng >= low_lng && lng <= high_lng)){
			locs.push(item);
          }
	});
	
	res.json(locs);
});

app.get('/compressdata', (req, res) => {
	if (fullData == null) {
		res.status(501).send("The full data set is currently unavailable to compress.");
	} else {
		let before_count = fullData.length;
		locs_c = new Map();
		fullData.forEach(function(item, index, array) {
			let lat = parseFloat(item['latitude']).toFixed(3);
			let lng = parseFloat(item['longitude']).toFixed(3);
			let key = lat + "_" + lng;
			if (locs_c[key]) {
				locs_c[key] = locs_c[key] + 1;
			} else {
				locs_c[key] = 1
			}  
		});
		locs_f = []
		for (var key in locs_c) {
			let coords = key.split("_");
			let lat = coords[0];
			let lng = coords[1];
			let h = locs_c[key];
			locs_f.push({latitude:lat, longitude:lng, heat:h});
		}
		let after_count = locs_f.length;
		
		console.log("compressed " + before_count + " items down to " + after_count + " items.");
		writeFile('ipv4-compressed.csv', locs_f);
		res.json(locs_f);
	}
});

app.listen(process.env.PORT || port, () => {
    console.log('server is listening');
});
