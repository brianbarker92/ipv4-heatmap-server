const csv = require('csv-parser');
const fs = require('fs');

var ipData = []
fs.createReadStream('ipv4-first-half.csv')
  .pipe(csv())
  .on('data', (row) => {
    //console.log(row);
	var loc = {'latitude':row['latitude'],'longitude':row['longitude'], 'heat':100};
	ipData.push(loc);
  })
  .on('end', () => {
    console.log('CSV file successfully processed first half');
  });
  
fs.createReadStream('ipv4-second-half.csv')
  .pipe(csv())
  .on('data', (row) => {
    //console.log(row);
	var loc = {'latitude':row['latitude'],'longitude':row['longitude'], 'heat':100};
	ipData.push(loc);
  })
  .on('end', () => {
    console.log('CSV file successfully processed second half');
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

//app.get('/ipv4heatmap', (req, res) => {
    //let name = req.params.name;  // /:name
	//res.json(ipData.slice(0,1000));
    //res.json({
    //    message: `Hello ${name}`
    //});
//});

app.get('/ipv4heatmap/:lower_lat?/:higher_lat?/:lower_long?/:higher_long?', (req, res) => {
	var low_lat = req.params.lower_lat;
	var high_lat = req.params.higher_lat;
	var low_lng = req.params.lower_long;
	var high_lng = req.params.higher_long;
	
	if(!low_lat || !high_lat || !low_lng || !high_lng) { //need all or none
		res.json(ipData.slice(0,1000));
		return;
	}
	
	var locs = [];
	ipData.forEach(function(item, index, array) {
          //console.log(item['latitude'], index)
          // var loc = [item['latitude'],item['longitude'], 100];
          // locations.push(loc);
          let lat = item['latitude'];
          let lng = item['longitude'];
          if((lat >= low_lat && lat <= high_lat)
            && (lng >= low_lng && lng <= high_lng)){
            var test = {'latitude':lat,'longitude':lng, 'heat':100};
            //console.log(test);
			locs.push(test);
          }
          
	});
	
	
    //let name = req.params.name;  // /:name
	res.json(locs);
    //res.json({
    //    message: `Hello ${name}`
    //});
});

app.listen(process.env.PORT || port, () => {
    console.log('server is listening');
});
