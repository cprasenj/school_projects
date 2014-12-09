var lib = require('../own_modules/school_records');
var assert = require('chai').assert;
var fs = require('fs');
var dbFileData = fs.readFileSync('tests/data/school.db.backup');
//CREATE TABLE STUDENTS(name text, Grade text);
//INSERT INTO STUDENTS VALUES ('Abu','one'), ('Babu','one')

var school_records;
describe('school_records',function(){
	beforeEach(function(){
		fs.writeFileSync('tests/data/school.db',dbFileData);
		school_records = lib.init('tests/data/school.db');
	});
	
	describe('#get_grades',function(){
		it('retrieves 2 grades',function(done){
			school_records.get_grades(function(err,grades){
				assert.deepEqual(grades,[{id:1,name:'1st std'},{id:2,name:'2nd std'}]);
				done();
			});
		});
	});

	describe('#get_students',function(){
		it('retrieves the students in the 2 grades',function(done){
			school_records.get_students(function(err,grades){
				assert.lengthOf(grades,2);
				assert.lengthOf(grades[0].students,4);
				assert.lengthOf(grades[1].students,3);
				done();
			});
		});
	});

	describe('#get_subjects',function(){
		it('retrieves the subjects in the 2 grades',function(done){
			school_records.get_subjects(function(err,grades){
				assert.lengthOf(grades,2);
				assert.lengthOf(grades[0].subjects,3);
				assert.lengthOf(grades[1].subjects,0);
				done();
			});
		});
	});

	describe('#get_student',function(){
		it('retrieves the summary of the student Abu',function(done){
			school_records.get_student(1, function(err,s){				
				assert.equal(s.name,'Abu');
				assert.equal(s.grade_name,'1st std');
				assert.deepEqual(s.subjects,[{id:1,name:'English-1',score:75,maxScore:100},
					{id:2,name:'Maths-1',score:50,maxScore:100},
					{id:3,name:'Moral Science',score:25,maxScore:50}]);
				done();
			});
		});

		it('retrieves nothing of the non existent student',function(done){
			school_records.get_student(9, function(err,s){
				assert.notOk(err);
				assert.notOk(s);				
				done();
			});
		});
	});

	describe('#get_grade',function(){
		it('retrieves the summary of grade 1',function(done){
			school_records.get_grade(1,function(err,grade){
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


	describe('#get_subject',function(){
		it('retrieves the summary of subject 1',function(done){
			school_records.get_subject(1,function(err,subject){
				assert.notOk(err);
				assert.equal(subject.name,'English-1');
				assert.equal(subject.id,1);
				assert.deepEqual(subject.student, [ { id: 1, name: 'Abu', score: 75 },
				   { id: 2, name: 'Babu' },
				   { id: 3, name: 'Kabu' },
				   { id: 4, name: 'Dabu' } ]);
				done();
			});
		});
	});

	describe('#get_subject_edit',function(){
		it('retrieves the summary of subject 1',function(done){
			school_records.get_subject_edit(1,function(err,subject){
				assert.notOk(err);
				assert.equal(subject.name,'English-1');
				assert.equal(subject.id,1);
				assert.deepEqual(subject.student, [ { id: 1, name: 'Abu', score: 75 },
				   { id: 2, name: 'Babu' },
				   { id: 3, name: 'Kabu' },
				   { id: 4, name: 'Dabu' } ]);
				done();
			});
		});
	});

	describe('#get_grade_edit',function(){
		it('retrieves the name and id of the grade 1',function(done){
			school_records.get_grade_edit(1,function(err,grade){
				assert.notOk(err);
				assert.equal(grade.name,'1st std');	
				assert.equal(grade.id,1);								
				done();
			});
		});
	});

	describe('#grade_update 1',function(){
		it('updates the name and id of the grade 1',function(done){
			var change = {id: 1, name: '11th std'};
			school_records.grade_update(change, function(err){
				school_records.get_grade(1, function(err, changedGrade){
					assert.deepEqual(change, {id: changedGrade.id, name: changedGrade.name});
					done();
				});
			});
		});
	});


	describe('#get_student_edit',function(){
		it('retrieves the summary of the student Abu of id 1',function(done){
			school_records.get_student_edit(1, function(err,s){				
				assert.equal(s.name,'Abu');
				assert.equal(s.grade_name,'1st std');
				assert.deepEqual(s.subjects,[{id:1,name:'English-1',score:75,maxScore:100},
					{id:2,name:'Maths-1',score:50,maxScore:100},
					{id:3,name:'Moral Science',score:25,maxScore:50}]);
				done();
			});
		});

		it('retrieves nothing of the non existent student',function(done){
			school_records.get_student_edit(9, function(err,s){
				assert.notOk(err);
				assert.notOk(s);				
				done();
			});
		});
	});

	describe('#student_update test 1',function(){
		it('updates the summary of the student 1',function(done){
			var change =   {
				name: 'Ananthu', id: 1, grade_id: 1,
				subjects: [ { id: 1, score: 12 }, { id: 2, score: 12 }, { id: 3, score: 12 } ] 
			};
			school_records.student_update(change, function(err){
				school_records.get_student(1, function(err, cStd){
					var changed = {
						name: cStd.name, id: cStd.id, grade_id: cStd.grade_id,
						subjects: [
							{ id: 1, score: cStd.subjects[0].score },
							{ id: 2, score: cStd.subjects[1].score },
							{ id: 3, score: cStd.subjects[2].score }] 
					};
					assert.deepEqual(change, changed);
					done();
				});
			});
		});
	});

	describe('#student_update test 2',function(){
		it('updates the summary of the student 1',function(done){
			var change =   {
				name: 'Prasenjit', id: 1, grade_id: 2,
				subjects: [ { id: 1, score: 21 }, { id: 2, score: 15 }, { id: 3, score: 82 } ] 
			};
			school_records.student_update(change, function(err){
				school_records.get_student(1, function(err, cStd){
					var changed = {
						name: cStd.name, id: cStd.id, grade_id: cStd.grade_id,
						subjects: [
							{ id: 1, score: cStd.subjects[0].score },
							{ id: 2, score: cStd.subjects[1].score },
							{ id: 3, score: cStd.subjects[2].score }] };
					assert.deepEqual(change, changed);
					done();
				});
			});
		});
	});

	describe('#grade_update 2',function(){
		it('updates the name and id of the grade 2',function(done){
			var change = {id: 2, name: '12th std'};
			school_records.grade_update(change, function(err){
				school_records.get_grade(2, function(err, changedGrade){
					var changed = {id: changedGrade.id, name: changedGrade.name};
					assert.deepEqual(change, changed);
					done();
				});
			});
		});
	});

	describe('#subject_update',function(){
		it('updates the name, maxScore and grade_id of the subject 1',function(done){
			var change = {id: 1, name: 'Automata', maxScore: 500, grade_id: 1};
			school_records.subject_update(change, function(err){
				school_records.get_subject(1, function(err, changedSubject){
					var changed = {id: 1, name: changedSubject.name, maxScore: changedSubject.maxScore, grade_id: changedSubject.grade_id};
					assert.deepEqual(change, changed);
					done();
				});
			});
		});
	});

	describe('#get_score_edit',function(){
		it('retrieves the summary of subject 1',function(done){
			var ids = {student : 1, subject: 1};
			school_records.get_score_edit(ids, function(err, scoreFound){
				var expectedScore  = {
					subject: {id: 1, name: "English-1", maxScore: 100},
					student: {id:1, name:'Abu'},
					grade : {id: 1, name: '1st std'},
					score: 75
				};
				assert.deepEqual(expectedScore, scoreFound);
				done();
			});
		});
	});

	describe('#score_update',function(){
		it('updates the score of the student 1 of subject id 2',function(done){
			var change = {id: 2, student_id: 1, score: 10};
			school_records.score_update(change, function(err){
				school_records.get_score({subject: 2, student: 1}, function(err, score){
					assert.deepEqual(change.score, score);
					done();
				});
			});
		});
	});

	describe('#student_add',function(){
		it('add a new student into grade 1',function(done){
			var gradeEntry = {id: 1, name: 'Gautam'};//grade_id,newstudent
			school_records.student_add(gradeEntry, function(err){
				assert.notOk(err);	
				school_records.get_students(function(err, grades) {
					var studentsInGradeOne = grades[0].students.length;
					var studentsInGradeTwo = grades[1].students.length;
					newStdId = studentsInGradeOne + studentsInGradeTwo;
					var student = {grade_id: gradeEntry.id, name: gradeEntry.name, id: newStdId};
					assert.deepEqual(student, grades[0].students[studentsInGradeOne - 1]);
					school_records.get_student(newStdId, function(err, addedStdt){
						assert.deepEqual(addedStdt.subjects,[{id:1,name:'English-1',score:0,maxScore:100},
						{id:2,name:'Maths-1',score:0,maxScore:100},
						{id:3,name:'Moral Science',score:0,maxScore:50}]);
						done();
					});
				});
			});
		});
	});
	describe('#subject_add',function(){
		it('add a new subject into grade 1',function(done){
			var gradeEntry = {id: 1, name: 'Automata', maxScore: 500};
			school_records.subject_add(gradeEntry, function(err){
				assert.notOk(err);	
				school_records.get_subjects(function(err, grades) {
					var subjectsInGradeOne = grades[0].subjects.length;
					var subjectsInGradeTwo = grades[1].subjects.length;
					newSubId = subjectsInGradeOne + subjectsInGradeTwo;
					var subject = {grade_id: gradeEntry.id, name: gradeEntry.name, id: newSubId, maxScore: 500};
					assert.deepEqual(subject, grades[0].subjects[subjectsInGradeOne - 1]);
					school_records.get_subject(subject.id, function(err, addSub){
						var expectedDetails = [
							{ id: 1, name: 'Abu', score: 0 },
							{ id: 2, name: 'Babu', score: 0 },
							{ id: 3, name: 'Kabu', score: 0 },
							{ id: 4, name: 'Dabu', score: 0 }
						];
						assert.deepEqual(addSub.student,expectedDetails);
						done();
					});
				});
			});
		});
	});
});