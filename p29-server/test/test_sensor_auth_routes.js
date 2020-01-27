const supertest = require("supertest");
const should = require("should");
const auth_service = require("../services/auth.service");
const sensor_service = require("../services/sensor.service");
const user_service = require("../services/users.service");
const db = require("../config/database").pool;
const app = require('../app');

let sensor;
let userid;
let token1minus1 = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyaWQiOjEsInN0cmVhbSI6LTF9.j3KLf7kpmGAy_KVJGg9apK3bhHZOvmeNRZ0O_eBID_s";
//token1and1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiIzYTRmNDY4OS0yNWQ2LTRkNGUtYjY0ZC01NzdlN2E3YzAzMTgiLCJkYXRhc3RyZWFtaWQiOjI0LCJ0aGluZ19pZCI6NjIsImlhdCI6MTU3OTY4NzI4NX0.PZT-Jvfkdfsotduj81PIS44qVnYcs71BTJv65mtMua4"; // Server
before(function(done) {
		let pwHash = auth_service.hashPassword("qwertzui");
		user_service.createUser("sensor@test.de", pwHash)
		.then( function()  {
			db.query("Select * from users where email = $1", ["sensor@test.de"])
				.then(function(result) {
					userid = result.rows[0].id;
					sensor_service.createSensor("Sensor", 
						{id: userid}, 
						"Am Waldesrand",
						"12.0","12.0"
					).then(function(result) {
						sensor = result;
						done();
					}).catch(function(err){
						throw new Error("Can not create sensor, aborting Tests");
					})
				})
				.catch(function() {
					throw(new Error("Can not find user, aborting Tests"));
				})

			}).catch(function() {
				throw( new Error("Can not create user, aborting Tests") );
			})
	});

after(function(done) {
    sensor_service.deleteSensor(sensor.sensor_id, userid)
        .then( function(){
            user_service.deleteUser(userid).then(done).catch()
        })
        .catch()
});

describe("Test Sensor Services", function() {

	    it("GetPromise should return data for a valid sensor", function(done) {
        sensor_service.gostGetPromise(sensor.sensor_id).then(function(res) {
            const body = JSON.parse(res.body);
            body["@iot.id"].should.equal(sensor.sensor_id);
            done();
        }).catch(function(err) {
            done(err);
        });
    });

    it("GetPromise should return error for an invalid sensor", function(done) {
        sensor_service.gostGetPromise(-1).then(function(res) {
            console.log(res);
            done(Error("Promise worked but should have failed"));
        }).catch(function(err) {
            err.statusCode.should.equal(404);
            done();
        });
    });

    it("gostPostPromise should accept valid data", function(done) {
        sensor_service.gostPostPromise({id: 1, datastreamid: 1}, {result: "bee", timestamp: new Date().toISOString(), parameters: {"model_id": {"123": "123"}}}).then(function(res) {
            done();
        }).catch(function(err) {
            done(err);
        });
    });

    it("gostPostPromise should reject invalid/incomplete data (missing user)", function(done) {
        sensor_service.gostPostPromise().catch(function(err) {
            console.log(err);
            done();
        });
    });

    it("gostPostPromise should reject invalid/incomplete data (missing body)", function(done) {
        sensor_service.gostPostPromise({id: 1, datastreamid: 1}).catch(function(err) {
            console.log(err);
            done();
        });
    });
});

// Test begin
describe("Test Sensor Auth Routes",function(){

    // #1 test
    it("Valid sensor should return the sensor page", function (done) {
        supertest(app)
            .get(`/sensor/${sensor.sensor_id}`)
            .expect(200)
            .end(function (err, res) {
                res.status.should.equal(200);
                if (err) return done(err);
                done();
            });
    });

    // #2 test
    it("Invalid sensor should redirect to home page", function (done) {
        supertest(app)
            .get("/sensor/-1")
            .expect(302)
            .end(function (err, res) {
                res.status.should.equal(302);
                res.headers.location.should.equal("/");
                if (err) return done(err);
                done();
            });
    });

    it("Invalid sensor should redirect to home page", function (done) {
        supertest(app)
            .get("/sensor/9999999999")
            .expect(302)
            .end(function (err, res) {
                res.status.should.equal(302);
                res.headers.location.should.equal("/");
                if (err) return done(err);
                done();
            });
    });


    it("Unauth get token access should fail (add after user auth is integrated)", function (done) {
        done();
    });


    it("Correct post data should return ok", function (done) {
        supertest(app)
            .post("/sensor")
            .set('Authorization', `Bearer ${sensor.token}`)
            .send({result: "bee", timestamp: new Date().toISOString(), parameters: {"model_id": "123"}})
            .expect(200)
            .end(function (err, res) {
                res.status.should.equal(200);
                if (err) return done(err);
                done();
            });
    });

    it("Incomplete post data should fail", function (done) {
        supertest(app)
            .post("/sensor")
            .set('Authorization', `Bearer ${sensor.token}`)
            .send({})
            .expect(400)
            .end(function (err, res) {
                res.status.should.equal(400);
                if (err) return done(err);
                done();
            });
    });

    it("Invalid post data should fail (incorrect datastream thus unauth)", function (done) {
        supertest(app)
            .post("/sensor")
            .set('Authorization', `Bearer ${token1minus1}`)
            .send({result: "bee", timestamp: new Date().toISOString(), parameters: {"model_id": "123"}})
            .expect(401)
            .end(function (err, res) {
                res.status.should.equal(401);
                if (err) return done(err);
                done();
            });
    });

    it("Unauth post data should fail", function (done) {
        supertest(app)
            .post("/sensor")
            .send({ body: {result: "bee", timestamp: new Date().toISOString(), parameters: {"model_id": "123"}}})
            .expect(401)
            .end(function (err, res) {
                res.status.should.equal(401);
                if (err) return done(err);
                done();
            });
    });

});
