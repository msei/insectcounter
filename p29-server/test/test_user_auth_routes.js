const supertest = require("supertest");
const should = require("should");
const db = require("../config/database.js").pool;
const app = require('../app');
const userService = require("../services/users.service");
const authService = require('../services/auth.service');

describe("Functional User Auth Tests",function() {
	let user_token;
	let sensor_token;
	let datastream_id;
	let cookies;
    // #1 test user route
    it("should return some text", function (done) {
        supertest(app)
            .get("/users")
            .expect(200)
            .end(function (err, res) {
                res.status.should.equal(200);
                if (err) return done(err);
                done();
            });
    });

	it("User should not be created password too short", function (done) {
		supertest(app)
			.post("/users")
			.send({email: "test@testabc.de",password: "test"})
			.expect(400)
			.end(function (err, res){
				res.status.should.equal(400);
				if (err) return done(err);
				done();
			});
	});


	//#2 Test If User can be created
	it("User should be created", function (done) {
		supertest(app)
			.post("/users")
			.send({email: "test@testabc.de",password: "testtest"})
			.expect(201)
			.end(function (err, res){
				res.status.should.equal(201);
				if (err) return done(err);
				done();
			});
	});

	it("User should be created 2", function (done) {
		supertest(app)
			.post("/users")
			.send({email: "test@testabc2.de",password: "testtest"})
			.expect(201)
			.end(function (err, res){
				res.status.should.equal(201);
				if (err) return done(err);
				done();
			});
	});

	it("User should not be created same email", function (done) {
		supertest(app)
			.post("/users")
			.send({email: "test@testabc.de",password: "testtest"})
			.expect(400)
			.end(function (err, res){
				res.status.should.equal(400);
				if (err) return done(err);
				done();
			});
	});
	
	//#3 Test If User can login
	it("User should login and receive token", function(done) {
		supertest(app)
			.post('/users/login')
			.set({"Content-Type": "application/json"})
			.send({email: "test@testabc.de",password: "testtest"})
			.expect(200)
			.end(function (err, res){
				if (err) return done(err);
				//Extracts user_token with a regex
				cookies = res.header['set-cookie'];
				user_token = res.header['set-cookie'][2].match(
					new RegExp('(^| )token=([^;]+)'))[2];
				done();
			});
	});

	//#4 Test if user can be modified
	it("User should not be modified mail already exists", function (done) {
		supertest(app)
			.post("/users/put")
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({"email": "test@testabc.de",
				"password": "testtest",
				"new_email": "test@testabc2.de",
				"new_password": "testtest",})
			.expect(400)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	//#4 Test if user can be modified
	it("User should be modified", function (done) {
		supertest(app)
			.post("/users/put")
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({"email": "test@testabc.de",
				"password": "testtest",
				"new_email": "jest@jest.de",
				"new_password": "jestjest",})
			.expect(200)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	it("User should not be modified wrong pw", function (done) {
		supertest(app)
			.post("/users/put")
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({"email": "test@testabc.de",
				"password": "testtest1",
				"new_email": "jest@jest.de",
				"new_password": "jestjest",})
			.expect(401)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	//#5 Test if user can login after change
	it("User should login again and receive a newtoken", function(done) {
		supertest(app)
			.post('/users/login')
			.set({"Content-Type": "application/json"})
			.send({
				"email": "jest@jest.de",
				"password": "jestjest",})	
			.expect(200)
			.end(function (err, res){
				if (err) return done(err);
				//Extracts user_token with a regex
				cookies = res.header['set-cookie'];
				user_token = res.header['set-cookie'][2].match(
					new RegExp('(^| )token=([^;]+)'))[2];
				done();
			});
	});

	it("should return some text after login", function (done) {
		supertest(app)
			.get("/users")
			.set('Cookie', cookies)
			.expect(200)
			.end(function (err, res) {
				res.status.should.equal(200);
				if (err) return done(err);
				done();
			});
	});

	// Test if user can create a sensor
	it("Create a Sensor", function(done) {
		supertest(app)
			.post('/sensor/internal')
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({
				"position": "Garten",
				"name": "Garten1",
				"long": "49.5",
				"lat": "6.9"
			})
			.expect(201)
			.end(function (err, res){
				if (err) return done(err);
				//Extracts user_token with a regex
				datastream_id = res.text.match(
					new RegExp('Datastream ID: (.*)</')
				)[1];
				sensor_token = res.text.match(
					new RegExp('"token": "(.*)"}')
				)[1];
				console.log(datastream_id);
				console.log(sensor_token);
				done();
			});
	});

	it("Create a Sensor fails not enough data", function(done) {
		supertest(app)
			.post('/sensor/internal')
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({
				"position": "Garten",
			})
			.expect(400)
			.end(function (err, res){
				if (err) return done(err);
				//Extracts user_token with a regex
				done();
			});
	});

	it("Create a Sensor Same Name", function(done) {
		supertest(app)
			.post('/sensor/internal')
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({
				"position": "Garten",
				"name": "Garten1",
				"long": "49.5",
				"lat": "6.9"
			})
			.expect(400)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	it("Create a Sensor Invalid Coords", function(done) {
		supertest(app)
			.post('/sensor/internal')
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({
				"position": "Garten",
				"name": "Garten1",
				"long": "abc",
				"lat": "6.9"
			})
			.expect(400)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	it("Change a Sensor invalid", function(done) {
		supertest(app)
			.post('/sensor/internal/put')
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({
				"position": "Garten",
				//"name": "Garten1",
				"datastream_id": datastream_id
			})
			.expect(400)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	it("Change a Sensor valid", function(done) {
		supertest(app)
			.post('/sensor/internal/put')
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({
				"position": "Garten",
				"name": "Garten1",
				"datastream_id": datastream_id
			})
			.expect(200)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	it("Correct post data should return ok", function (done) {
		supertest(app)
			.post("/sensor")
			.set('Authorization', `Bearer ${sensor_token}`)
			.send({result: "bee", timestamp: new Date().toISOString(), parameters: {"model_id": "123"}})
			.expect(200)
			.end(function (err, res) {
				res.status.should.equal(200);
				if (err) return done(err);
				done();
			});
	});

	it("Invalid post data should fail missing body", function (done) {
		supertest(app)
			.post("/sensor")
			.set('Authorization', `Bearer ${sensor_token}`)
			.send()
			.expect(400)
			.end(function (err, res) {
				res.status.should.equal(400);
				if (err) return done(err);
				done();
			});
	});


	it("Should return data", function (done) {
		const month = new Date().getMonth()+1;
		const day = new Date().getDate();
		const year = new Date().getFullYear();
		const id = datastream_id;
		const scale = "day";
		const url = `/api/agg?sensorID=${id}&year=${year}&month=${month}${scale === "day"? `&day=${day}`: ""}`;

		supertest(app)
			.get(url)
			.expect(200)
			.end(function (err, res) {
				res.status.should.equal(200);
				if (err) return done(err);
				done();
			});
	});

       it("Should return data", function (done) {
		const month = new Date().getMonth()+1;
		const day = new Date().getDate();
		const year = new Date().getFullYear();
		const id = datastream_id;
		const scale = "month";
		const url = `/api/agg?sensorID=${id}&year=${year}&month=${month}${scale === "day"? `&day=${day}`: ""}`;

		supertest(app)
			.get(url)
			.expect(200)
			.end(function (err, res) {
				res.status.should.equal(200);
				if (err) return done(err);
				done();
			});
        });

	it("Delete a Sensor Fail", function(done) {
		supertest(app)
			.post('/sensor/internal/delete')
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({
				"email": "jest@jest.de",
				"password": "jestjest2",
				"datastream_id": datastream_id
			})
			.expect(401)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	it("Delete a Sensor", function(done) {
		supertest(app)
			.post('/sensor/internal/delete')
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({
				"email": "jest@jest.de",
				"password": "jestjest",
				"datastream_id": datastream_id
			})
			.expect(200)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	it("Correct post data should fail after sensor deleted", function (done) {
		supertest(app)
			.post("/sensor")
			.set('Authorization', `Bearer ${sensor_token}`)
			.send({result: "bee", timestamp: new Date().toISOString(), parameters: {"model_id": "123"}})
			.expect(401)
			.end(function (err, res) {
				res.status.should.equal(401);
				if (err) return done(err);
				done();
			});
	});

	//#6 Test if user can be deleted
	it("User should not be deleted invalid pw", function (done) {
		supertest(app)
			.post("/users/delete")
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({
				"email": "jest@jest.de",
				"password": "jestjest2",})
			.expect(401)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	it("User should logout", function (done) {
		supertest(app)
			.get("/users/logout")
			.set('Cookie', cookies)
			.send()
			.expect(302)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	//#6 Test if user can be deleted
	it("User should be deleted", function (done) {
		supertest(app)
			.post("/users/delete")
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({
				"email": "jest@jest.de",
				"password": "jestjest",})
			.expect(200)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	it("User should login and receive token", function(done) {
		supertest(app)
			.post('/users/login')
			.set({"Content-Type": "application/json"})
			.send({email: "test@testabc2.de",password: "testtest"})
			.expect(200)
			.end(function (err, res){
				if (err) return done(err);
				//Extracts user_token with a regex
				cookies = res.header['set-cookie'];
				user_token = res.header['set-cookie'][2].match(
					new RegExp('(^| )token=([^;]+)'))[2];
				done();
			});
	});

	//#6 Test if user can be deleted
	it("User should be deleted", function (done) {
		supertest(app)
			.post("/users/delete")
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({
				"email": "test@testabc2.de",
				"password": "testtest",})
			.expect(200)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});

	it("Correct post data should fail after user deleted", function (done) {
		supertest(app)
			.post("/sensor")
			.set('Authorization', `Bearer ${sensor_token}`)
			.send({result: "bee", timestamp: new Date().toISOString(), parameters: {"model_id": "123"}})
			.expect(401)
			.end(function (err, res) {
				res.status.should.equal(401);
				if (err) return done(err);
				done();
			});
	});

	// Test if user can be modified after being deleted
	it("User should not be modified after being deleted", function (done) {
		supertest(app)
			.post("/users/put")
			.set({"Content-Type": "application/json"})
			.set('Cookie', cookies)
			.send({"email": "test@testabc.de",
				"password": "testtest",
				"new_email": "jest@jest.de",
				"new_password": "jestjest",})
			.expect(401)
			.end(function (err, res){
				if (err) return done(err);
				done();
			});
	});
});

describe("User auth test with incorrect Data",function() {
	let user_token;
	let cookies;
	const user = "super1@duper.com";
	const password = "mamaMiaMama";
	beforeEach(function(done){
		supertest(app)
			.post("/users")
			.send({email: user,password: password})
			.expect(201)
			.end(function (err, res){
				res.status.should.equal(201);
				supertest(app)
					.post('/users/login')
					.set({"Content-Type": "application/json"})
					.send({email: user,password: password})
					.expect(200)
					.end(function (err, res){
						if (err) return done(err);
						//Extracts user_token with a regex
						cookies = res.header['set-cookie'];
						user_token = res.header['set-cookie'][2].match(
							new RegExp('(^| )token=([^;]+)'))[2];
						done();
					});
				if (err) return done(err);
			});
	});

	afterEach(function(done){
		supertest(app)
		.post("/users/delete")
		.set({"Content-Type": "application/json"})
		.set('Cookie', cookies)
		.send({
			"email": user,
			"password": password,})
		.expect(200)
		.end(function (err, res){
			if (err) return done(err);
			done();
		});
	});

	// #1 test user creation with missing data
    it("Should reject missing information create", function (done) {
        supertest(app)
            .post("/users")
            .expect(400)
            .end(function (err, res) {
                res.status.should.equal(400);
                if (err) return done(err);
                done();
            });
	});
	
	//#2 Test User Creation with broken email
	it("Should reject broken Email", function (done) {
        supertest(app)
			.post("/users")
			.send({email: 'asdasdsadgf', password: 'Soy12345678'})
            .expect(400)
            .end(function (err, res) {
                res.status.should.equal(400);
                if (err) return done(err);
                done();
            });
	});

	//#3 Test Login with wrong Information
	it("Should reject wrong password", function (done) {
        supertest(app)
			.post("/users/login")
			.send({email: user,password: 'AAAAAAAAAA'})
            .expect(401)
            .end(function (err, res) {
                res.status.should.equal(401);
                if (err) return done(err);
                done();
            });
	});

	//#4 Test Login with Nonsense
	it("Should reject nonsensical request", function (done) {
        supertest(app)
			.post("/users/login")
			.set({'Content-Type': "application/json"})
			.send("asdagsdjasgdaskywse8otyo84wey53984hkjsgfghää")
            .expect(400)
            .end(function (err, res) {
                res.status.should.equal(400);
                if (err) return done(err);
                done();
            });
	});

	//#5 Missing Put data
	it("Should reject missing information put", function (done) {
		console.log('token='+user_token);
		supertest(app)
			.post("/users/put")
			.set('Cookie', ['token='+user_token])
			.send({email: user, password: password})
            .expect(400)
            .end(function (err, res) {
                res.status.should.equal(400);
                if (err) return done(err);
                done();
            });
	});
	
	//#6 Bad Email
	it("Should reject bad email", function (done) {
		console.log('token='+user_token);
		supertest(app)
			.post("/users/put")
			.set('Cookie', ['token='+user_token])
			.send({email: user, password: password, new_email: "a"})
            .expect(400)
            .end(function (err, res) {
                res.status.should.equal(400);
                if (err) return done(err);
                done();
            });
	});


	//#6 Bad Password
	it("Should reject bad password", function (done) {
		console.log('token='+user_token);
		supertest(app)
			.post("/users/put")
			.set('Cookie', ['token='+user_token])
			.send({email: user, password: password, new_password: "a"})
            .expect(400)
            .end(function (err, res) {
                res.status.should.equal(400);
                if (err) return done(err);
                done();
            });
	});

	//#x SQL Injection
	it("Should not be logged in", function (done) {
        supertest(app)
			.post("/users/login")
			.set({'Content-Type': "application/json"})
			.send({"email": "nice4353454351@email.de' OR 1=1; OR email='", password: "asdasdasd"})
            .expect(401)
            .end(function (err, res) {
                res.status.should.equal(401);
                if (err) return done(err);
                done();
            });
	});


});
