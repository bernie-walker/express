const createUsersTableQuery = `
CREATE TABLE users (
	id varchar(42) PRIMARY KEY,
	display_name text NOT NULL DEFAULT 'Expresser',
	avatar_url text NOT NULL,
	bio text
);`;

const insertUserQuery = `INSERT INTO	users(id, display_name, avatar_url) 
VALUES
	('bernie-walker','Bernard','https://avatars3.githubusercontent.com/u/583231?v=4'),
	('palpriyanshu','Priyanshu','https://avatars3.githubusercontent.com/u/583231?v=4'),
	('shiviraj','Shivam','https://avatars3.githubusercontent.com/u/583231?v=4'),
	('lazyhackerthani','Thanya','https://avatars3.githubusercontent.com/u/583231?v=4'),
  ('bugdriver','Rajath','https://avatars3.githubusercontent.com/u/583231?v=4');`;

const createStoryTableQuery = `
CREATE TABLE stories (
	id integer PRIMARY KEY AUTOINCREMENT,
	written_by varchar(42) NOT NULL,
	state varchar(9) NOT NULL,
	title text NOT NULL,
	content text,
	cover_image text,
	last_modified timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (written_by) REFERENCES users(id),
  CHECK (state IN ('drafted','published'))
);`;

const insertStoryQuery = `INSERT INTO stories(written_by, state, title, content, last_modified) 
VALUES
  ('palpriyanshu', 'published', 'Inside the Revolutionary Treatment That Could Change Psychotherapy Forever','[{"type":"paragraph","data":{"text":"You might be wondering where the REST attribute comes in. REST stands for REpresentational State Transfer. This means there is no state between the client and the server. There are no webpages served to be parsed, just data. And this gives you all the freedom you need. All you need to do is write some logic on a specific URL that connects to a database, uses it’s logic to process the data and return it in JSON format. Your client can now be an Android app made in Java, or a Windows desktop app made in C# or an Arduino project."}},{"type":"paragraph","data":{"text":"The data returned is an array of string. This is raw data."}},{"type":"paragraph","data":{"text":"How it all fits as a REST based API."}},{"type":"paragraph","data":{"text":"This is the whole point of using REST, it makes the connection stateless therefore any client that utilizes the HTTP protocol can access this data. Now you can iterate through the data and display it anywhere you want."}}]','2020-07-23 09:24:18'),
  ('lazyhackerthani', 'published', 'You Can’t Kill the Bloomberg Terminal. But If You Were Going to Try, Here’s How.','[{"type":"paragraph","data":{"text":"A server receives requests, processes them and returns a response. So you need to use routes to handle this requests. The requests have three major types, a GET request that get’s data, a POST request that sends data securely, a PUT request that updates data and a DELETE request that deletes data."}},{"type":"paragraph","data":{"text":"Let’s create a simple GET request that returns a list of users. Under var app = express(), write down the following code."}},{"type":"paragraph","data":{"text":"Setting request handlers."}},{"type":"paragraph","data":{"text":"This simple function makes the express app to use the url handle “/url” to trigger the callback that follows it. The callback accepts three parameters, req is the request body and carries information about the request. The res is the response body and is used to handle response functions like .render() to render templates and .json() to return json data."}}]','2020-07-23 09:28:41'),
  ('bernie-walker', 'published', 'We’re Too Obsessed With the “End of” Everything','[{"type":"paragraph","data":{"text":"Then create the app.js file or whatever you prefer naming it (default is index.js) and add in the following code."}},{"type":"paragraph","data":{"text":"Congrats! You just made your first useless express server! So let’s go through the code and learn why our server is useless and why it’s not implementing the REST protocol yet. The first line requires express and uses the express variable to represent it. The second line initialized express using the brackets which initializes an express server and puts the initialized server into the variable app. So now whenever we want to use our express server, we would need to use the app variable which represents our app! We then set our app to listen to port 3000 and create a callback function that says our server is running on port 3000."}},{"type":"paragraph","data":{"text":"Your app will now be accessible using http://localhost:3000, but hitting that endpoint now won’t get you anything since you haven’t configured your server to listen to any events."}},{"type":"paragraph","data":{"text":"Creating the app."}}]','2020-07-23 09:31:04'),
  ('palpriyanshu', 'published', 'The 10 Types of Tippers, According to Servers','[{"type":"paragraph","data":{"text":"The first way is creating the files by hand. A basic Node app contains a .js file and a package.json file. The package.json file contains a couple of properties. First one is name which holds the name of the app, second is version which shows the version of your app, a description of your app, main that points to the entry point of your application. There’s also scripts, that can be run when you need to perform some repetitive tasks, author name, licence, dependencies and devDependencies."}},{"type":"paragraph","data":{"text":"The package.json describes the app. It is very important. When uploading your app, your dependencies will be listed avoiding duplication and excessive data transfer. An angular 6 app node modules is around 230MB, that will take a lot of time to download or upload. So we omit these modules and just list them instead, then use the package.json to install the modules whenever we need to run the app on another machine. To understand this concept, I’ll explain it better when making an introduction to Git tutorial."}},{"type":"paragraph","data":{"text":"The second way you can initialize an app is using the npm tool. It’s the simplest but not the fastest way. All you have to do is open up your cmd in the folder you want to create your app in and type npm init to interactively create your package.json file."}},{"type":"paragraph","data":{"text":"The third way is the simplest, but a little complex for beginners as it creates files that you will be unfamiliar with especially if you’ve never done NodeJS. It also required you to install the express tool to generate a complete express template and not just the package.json."}}]','2020-07-23 09:34:03');`;

const runPromisifyQuery = function (query, db) {
  return new Promise((resolve) => db.run(query, resolve));
};

const setUpDatabase = async (dbClient) => {
  await runPromisifyQuery(createUsersTableQuery, dbClient);
  await runPromisifyQuery(insertUserQuery, dbClient);
  await runPromisifyQuery(createStoryTableQuery, dbClient);
  await runPromisifyQuery(insertStoryQuery, dbClient);
};

const cleanDatabase = async () => {
  await runPromisifyQuery('drop table users');
};

module.exports = { setUpDatabase, cleanDatabase };
