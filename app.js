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

function readFile(filename, ipData, iscompressed) {
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
}

var ipData = []
readFile('ipv4-compressed.csv', ipData, true);
var fullData = []
//readFile('ipv4-full.csv', fullData, false); //uncomment if you want to reload the full dataset

 
const express = require('express');
const cors = require('cors');

const app = express();
const port = 8080;

app.use(cors())

app.use(compression())

app.get('/', (req, res) => {
    res.json({
        message: 'Hello, this API contains general heatmap information for ipv4 addresses.'
					+ ' Use the /ipv4heatmapbounded/low_lat/up_lat/low_long/up_long '
					+ ' endpoint to get the data for a given geographical bounding box. '
					+ ' The parameter values are: '
					+ ' low_lat: the lower latitude of the bounding box'
					+ ' up_lat: the upper latitude of the bounding box'
					+ ' low_long: the lower longitude of the bounding box'
					+ ' up_long: the upper longitude of the bounding box'
    });
});

/*
  This endpoint returns all of the heatmap data within the given geographical bounding box.
  The parameter values are: 
	  lower_lat: the lower latitude of the bounding box
	  higher_lat: the upper latitude of the bounding box
	  lower_long: the lower longitude of the bounding box
	  higher_long: the lower longitude of the bounding box
	returns: list of latitude, longitude, and heat scores for each unique location.
*/
app.get('/ipv4heatmapbounded/:lower_lat/:higher_lat/:lower_long/:higher_long', (req, res) => {
	var low_lat = parseFloat(req.params.lower_lat);
	var high_lat = parseFloat(req.params.higher_lat);
	var low_lng = parseFloat(req.params.lower_long);
	var high_lng = parseFloat(req.params.higher_long);
	
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

/* use this endpoint to compress the data down to a smaller number of locations.
 Any duplicate locations are combined, and the precision is reduced to 4 decimal places 
 (more locations will be combined with this rounding). The heat counts for each location
 reflect how many locations were combined down to that point (i.e. 4 duplicate locations will now
 appear as one in the list with a heat score of 4).
 
 IMPORTANT NOTE: the heroku node does not have space currently for the full dataset, 
 so I did this locally. For this endpoint to work, you need to put the full dataset in the 
 working directory and uncomment line 42 to load it.
*/
app.get('/compressdata', (req, res) => {
	if (fullData.length === 0) {
		res.status(501).send("The full data set is currently unavailable to compress.");
	} else {
		let before_count = fullData.length;
		locs_compressed_map = new Map();
		fullData.forEach(function(item, index, array) {
			let lat = parseFloat(item['latitude']).toFixed(4);
			let lng = parseFloat(item['longitude']).toFixed(4);
			let key = lat + "_" + lng; //combine to form a simple unique string id for this location
			if (locs_compressed_map[key]) {
				locs_compressed_map[key] = locs_compressed_map[key] + 1; //increase heat score to record additional data point
			} else {
				locs_compressed_map[key] = 1
			}  
		});
		locs_compressed_list = []
		for (var key in locs_compressed_map) {
			let coords = key.split("_"); //get the latitude and longitude back out from the key
			let lat = coords[0];
			let lng = coords[1];
			let h = locs_compressed_map[key];
			locs_compressed_list.push({latitude:lat, longitude:lng, heat:h});
		}
		let after_count = locs_compressed_list.length;
		
		writeFile('ipv4-compressed.csv', locs_compressed_list);
		res.send("compressed " + before_count + " items down to " + after_count + " items.");
	}
});

app.listen(process.env.PORT || port, () => {
    console.log('server is listening');
});
