const supertest = require("supertest");
const should = require("should");

const app = require('../app');

// Test begin
describe("Test Index and Main Routes",function(){

    // #1 should return home page
    it("should return home page",function(done){

        // calling home page
        supertest(app)
            .get("/")
            .expect("Content-type",/html/)
            .expect(200) // This is HTTP response
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });

    // #1 should return home page DE
    it("should return home page DE",function(done){

        // calling home page
        supertest(app)
            .get("/")
            .set("Accept-Language", "de_DE")
            .expect("Content-type",/html/)
            .expect('set-cookie', /LANG=de_DE; Path=\/*/, done)
            .expect(200) // This is HTTP response
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });

    // #1 should return home page US
    it("should return home page US",function(done){

        // calling home page
        supertest(app)
            .get("/")
            .set("Accept-Language", "en_US")
            .expect("Content-type",/html/)
            .expect('set-cookie', /LANG=en_US; Path=\/*/, done)
            .expect(200) // This is HTTP response
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });

    // #1 should return home page DEFAULT
    it("should return home page default",function(done){

        // calling home page
        supertest(app)
            .get("/")
            .set("Accept-Language", "abc")
            .expect("Content-type",/html/)
            .expect('set-cookie', /LANG=.*; Path=\/*/, done)
            .expect(200) // This is HTTP response
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });

    // #N should fail on purpose
    it("should not fail to not show failing behaviour", function(done){
        supertest(app)
            .get("/fail")
            .expect(302)
            .end(function(err, res) {
                res.status.should.equal(302);
                if (err) return done(err);
                done();
            });
    });
	
	// We expect this route to return the about page
    it("should return about page",function(done){

        // calling about page
        supertest(app)
            .get("/about")
            .expect("Content-type",/html/)
            .expect(200) // This is HTTP response
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });
	
	 // Should fail because try to access non existing site
    it("should not fail to not show failing behaviour", function(done){
        supertest(app)
            .get("/mysensor")
            .expect(302)
            .end(function(err, res) {
                res.status.should.equal(302);
                if (err) return done(err);
                done();
            });
    });
	
	 // Should fail because try to access non existing site
    it("should not fail to not show failing behaviour", function(done){
        supertest(app)
            .get("/internal")
            .expect(302)
            .end(function(err, res) {
                res.status.should.equal(302);
                if (err) return done(err);
                done();
            });
    });
	
	// Should fail because try to access non existing site
    it("should not fail to not show failing behaviour", function(done){
        supertest(app)
            .get("/welcome")
            .expect(302)
            .end(function(err, res) {
                res.status.should.equal(302);
                if (err) return done(err);
                done();
            });
    });
	

});