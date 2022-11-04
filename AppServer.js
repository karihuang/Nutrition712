let http = require("http");
let express = require("express");
let bodyParser = require("body-parser");
let app = express();

//functions and settings that used to modify data stored in MongoDB
const path = require("path");
require("dotenv").config({path: path.resolve(__dirname, 'credentials/.env')});

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const dbCollection = process.env.MONGO_COLLECTION;

const dbAndCollection = {db: dbName, collection: dbCollection};

const {MongoClient, ServerApiVersion} = require('mongodb');

async function processData(param) {
    const uri = `mongodb+srv://${userName}:${password}@cluster0.an8hy.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});

    try {
        await client.connect();
        await insertApplicant(client, dbAndCollection, param);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

//insert a response into database
async function insertApplicant(client, dbAndCollection, newResponse) {
   await client.db(dbAndCollection.db)
                .collection(dbAndCollection.collection)
                .insertOne(newResponse);
}

//process command line from the terminal
process.stdin.setEncoding("utf8");
if (process.argv.length != 3) {
    process.stdout.write(`Usage AppServer.js PORT_NUMBER`);
    process.exit(1);
}

process.stdout.write(`Web server started and running at http://localhost:${process.argv[2]}\n`);
let portNum = process.argv[2];
let prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);

process.stdin.on("readable", function() {
    let readInput = process.stdin.read();
    if (readInput !== null) {
        let command = readInput.trim();
        if (command === 'stop') {
            process.stdout.write("Shutting down the server");
            process.exit(0);
        } else {
            process.stdout.write(`Invalid command: ${command}\n`);
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});

app.set("views", "./templates");
app.set("view engine", "ejs");

//index page
app.get("/", (request, response) => {
    let variable = {
        port: portNum
    };
    response.render("index", variable);
});

//shakes menu page
app.use('/style', express.static('style'))
app.get("/shakeMenu", (requst, response) => {
    let variable = {
        port: portNum
    };
    response.render("shakeMenu", variable);
});

//tea menu page
app.get("/teaMenu", (requst, response) => {
    let variable = {
        port: portNum
    };
    response.render("teaMenu", variable);
});

//contact page
app.get("/contact", (requst, response) => {
    let variables = {
        contactAddress: `http://localhost:${portNum}/contactProcess`,
        port: portNum
    };
    response.render("contact", variables);
});

//redirect page (contact process confirmed)
app.use(bodyParser.urlencoded({extended:false}));
app.post("/contactProcess", (request, response) => {
    let {name, contact, email, info} = request.body;
    let db_varaibles = {
        name: name,
        contact: (contact.length === 0) ? "None" : contact,
        email: email,
        info: info,
        time: new Date(),
    };
    let variable = {
        port: portNum
    };
    processData(db_varaibles);
    response.render("contactProcess", variable);
});

//applying Nutrition API and show each food's nutrition info 
app.get("/info", (request, response) => {
    let variables = {
        infoAddress: `http://localhost:${portNum}/infoProcess`,
        port: portNum
    };
    response.render("info", variables);
});

app.post("/infoProcess", (request, response) => {
    let {food} = request.body;
    let variable = {
        food: food,
        port: portNum
    };
    response.render("infoProcess", variable);
});

http.createServer(app).listen(portNum);