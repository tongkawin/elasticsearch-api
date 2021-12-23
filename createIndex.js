//connection
var elasticsearch = require("elasticsearch");

var client = new elasticsearch.Client({
    hosts: ["http://localhost:9200"]
});

//create index
client.indices.create({
    index: 'data'
}, function (err, resp, status) {
    if (err) {
        console.log(err);
    }
    else {
        console.log("Create index response: ", resp);
    }
});