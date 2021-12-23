var express = require('express');
var app = express();
const path = require('path');
var elasticsearch = require("elasticsearch");
var DataJson = require("./data.json");
var bulkDataArray = [];

//connection
var client = new elasticsearch.Client({
  hosts: ["http://localhost:9200"]
});

//health status
client.cluster.health({}, function (err, resp, status) {
  console.log("-- Client Health --", resp);
});


//Load data
var makeBulkArray = function (data, callback) {
  for (var current of data) {
    let rq = '';
    if (current._source.api == undefined) {
      rq = current._source.requestUid;
    } else {
      rq = current._source.api.requestuid;
    }

    bulkDataArray.push(
      { index: { _index: 'search-data', _type: 'data', _id: current._id } },
      {
        "Index": current._index,
        "Type": current._type,
        "ID": current._id,
        "Version": current._version,
        "Score": current._score,
        "RequestUid": rq,
        "Source": current._source,
        "Fields": current.fields,
        "Sort": current.sort
      }
    );
  }

  callback(bulkDataArray);
}

var indexDataBulk = function (bulkArr, callback) {
  client.bulk({
    maxRetries: 5,
    index: 'search-data',
    type: 'data',
    body: bulkArr
  }, function (err, resp, status) {
    if (err) {
      console.log(err);
    }
    else {
      callback(resp.items);
    }
  })
}


makeBulkArray(DataJson, function (response) {
  console.log('Bulk Data: \n');
  console.log(JSON.stringify(response, null, 2));

  indexDataBulk(response, function (response) {
    console.log(response);
  })
});


//SearchAPI
module.exports = client;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/search-requestUid/:requestUid', function (req, res) {
  client.search({
    index: 'search-data',
    type: 'data',
    body: {
      "query": {
        "match_phrase": {
          "RequestUid": { query: req.params.requestUid, slop: 100 }
        }
      }
    }

  }).then(function (resp) {
    console.log("Successful query! Here is the response:", resp);
    res.send(resp);
  }, function (err) {
    console.trace(err.message);
    res.send(err.message);
  });
});

app.get('/search-LogID/:_id', function (req, res) {
  client.search({
    index: 'search-data',
    type: 'data',
    body: {
      "query": {
        "match_phrase": {
          "ID": { query: req.params._id, slop: 100 }
        }
      }
    }

  }).then(function (resp) {
    console.log("Successful query! Here is the response:", resp);
    res.send(resp);
  }, function (err) {
    console.trace(err.message);
    res.send(err.message);
  });
});

app.listen(3000, function () {
  console.log('App listening for requests...');
});