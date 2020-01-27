const supertest = require("supertest");
const should = require("should");

const app = require('../app');

// Test begin
describe("Test API Routes",function(){

    // #1 test
    it("should be filled", function (done) {
        supertest(app)
            .get("/")
            .expect(200)
            .end(function (err, res) {
                res.status.should.equal(200);
                if (err) return done(err);
                done();
            });
    });
	
	
	// #This test should not fail, because the function is given valid input.
    it("Should return data", function (done) {
		const month = 1;
        const day = 20;
        const year = 2019;
		const id = 5;
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
        const month = 1;
        const day = 20;
        const year = 2019;
        const id = 5;
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
	
	
	// #This test should fail, because of the invalid sensor id given.
    it("Should fail because negative value for id given", function (done) {
		const month = 4;
        const day = 30;
        const year = 2019;
		const id = -1;
		const scale = "day";
		const url = `/api/agg?sensorID=${id}&year=${year}&month=${month}${scale === "day"? `&day=${day}`: ""}`;
			
		supertest(app)
            .get(url)
            .expect(302)
            .end(function (err, res) {
                res.status.should.equal(302);
                if (err) return done(err);
                done();
            });
    });
	
	// #This test should fail, because no arguments are given.
    it("Should fail because no arguments are given", function (done) {
		const scale = "day";
		const month = "";
        const day = "";
		const id = "";
		const year = "";
		const url = `/api/agg?sensorID=${id}&year=${year}&month=${month}${scale === "day"? `&day=${day}`: ""}`;
			
		supertest(app)
            .get(url)
            .expect(302)
            .end(function (err, res) {
                res.status.should.equal(302);
                if (err) return done(err);
                done();
            });
    });
	
	
	// #This test should fail, because no id is given.
    it("Should fail because no argument for sensor id is given", function (done) {
		const scale = "day";
		const year = 2019;
        const day = 30;
		const month = 1;
		const id = "";
		const url = `/api/agg?sensorID=${id}&year=${year}&month=${month}${scale === "day"? `&day=${day}`: ""}`;
			
		supertest(app)
            .get(url)
            .expect(302)
            .end(function (err, res) {
                res.status.should.equal(302);
                if (err) return done(err);
                done();
            });
    });
	
	
	

});