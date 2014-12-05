var lib = require('../own_modules/school_records');
var assert = require('chai').assert;
var fs = require('fs');
var dbFileData = fs.readFileSync('tests/data/school.db.backup');
//CREATE TABLE STUDENTS(name text, grade text);
//INSERT INTO STUDENTS VALUES ('Abu','one'), ('Babu','one')

var school_records;
describe('school_records',function(){
	beforeEach(function(){
		fs.writeFileSync('tests/data/school.db',dbFileData);
		school_records = lib.init('tests/data/school.db');
	});
	
	describe('#getGrades',function(){
		it('retrieves 2 grades',function(done){
			school_records.getGrades(function(err,grades){
				assert.deepEqual(grades,[{id:1,name:'1st std'},{id:2,name:'2nd std'}]);
				done();
			});
		});
	});

	describe('#getStudentsByGrade',function(){
		it('retrieves the students in the 2 grades',function(done){
			school_records.getStudentsByGrade(function(err,grades){
				assert.lengthOf(grades,2);
				assert.lengthOf(grades[0].students,4);
				assert.lengthOf(grades[1].students,3);
				done();
			});
		});
	});

	describe('#getSubjectsByGrade',function(){
		it('retrieves the subjects in the 2 grades',function(done){
			school_records.getSubjectsByGrade(function(err,grades){
				assert.lengthOf(grades,2);
				assert.lengthOf(grades[0].subjects,3);
				assert.lengthOf(grades[1].subjects,0);
				done();
			});
		});
	});

	describe('#getStudentSummary',function(){
		it('retrieves the summary of the student Abu',function(done){
			school_records.getStudentSummary(1, function(err,s){				
				assert.equal(s.name,'Abu');
				assert.equal(s.grade_name,'1st std');
				assert.deepEqual(s.subjects,[{id:1,name:'English-1',score:75,maxScore:100},
					{id:2,name:'Maths-1',score:50,maxScore:100},
					{id:3,name:'Moral Science',score:25,maxScore:50}]);
				done();
			});
		});

		it('retrieves nothing of the non existent student',function(done){
			school_records.getStudentSummary(9, function(err,s){
				assert.notOk(err);
				assert.notOk(s);				
				done();
			});
		});
	});

	describe('#getGradeSummary',function(){
		it('retrieves the summary of grade 1',function(done){
			school_records.getGradeSummary(1,function(err,grade){
				assert.notOk(err);
				assert.equal(grade.name,'1st std');
				assert.deepEqual(grade.subjects,[{id:1,name:'English-1'},
					{id:2,name:'Maths-1'},
					{id:3,name:'Moral Science'}]);
				assert.deepEqual(grade.students,[{id:1,name:'Abu'},
					{id:2,name:'Babu'},
					{id:3,name:'Kabu'},
					{id:4,name:'Dabu'}]);
				assert.equal(grade.id,1);
				done();
			});
		});
	});


	describe('#getSubjectSummary',function(){
		it('retrieves the summary of subject 1',function(done){
			school_records.getSubjectSummary(1,function(err,subject){
				assert.notOk(err);
				assert.equal(subject.name,'English-1');
				assert.deepEqual(subject.student, [ { id: 1, name: 'Abu', score: 75 },
				   { id: 2, name: 'Babu' },
				   { id: 3, name: 'Kabu' },
				   { id: 4, name: 'Dabu' } ]);
				done();
			});
		});
	});

	describe('#getEditGrade',function(){
		it('retrieves the name and id of the grade 1',function(done){
			school_records.getEditGrade(1,function(err,grade){
				assert.notOk(err);
				assert.equal(grade.name,'1st std');	
				assert.equal(grade.id,1);								
				done();
			});
		});
	});

	describe('#getUpdateGrade',function(){
		it('updates the name and id of the grade 1',function(done){
			school_records.getGradeSummary(1, function(err, originalGrade){
				var original = {id: originalGrade.id, name: originalGrade.name};
				var change = {id: 1, name: '11th std'};
				school_records.getUpdateGrade(change, function(err){
					school_records.getGradeSummary(1, function(err, changedGrade){
						assert.deepEqual(change, {id: changedGrade.id, name: changedGrade.name});
						school_records.getUpdateGrade(original, function(err){});
					});
				});
				done();
			});
		});
		it('updates the name and id of the grade 2',function(done){
			school_records.getGradeSummary(2, function(err, originalGrade){
				var original = {id: originalGrade.id, name: originalGrade.name};
				var change = {id: 2, name: '12th std'};
				school_records.getUpdateGrade(change, function(err){
					school_records.getGradeSummary(2, function(err, changedGrade){
						assert.deepEqual(change, {id: changedGrade.id, name: changedGrade.name});
						school_records.getUpdateGrade(original, function(err){});
					});
				});
				done();
			});
		});

	});

});