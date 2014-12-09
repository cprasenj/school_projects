var sqlite3 = require('sqlite3').verbose();


var bodyParser = function (body) {
	body.subjects = body.subject_id.map(function(id,i){
		return {'id':id, score:body.subject_score[i] };
	});
};

var _getGrades = function(db,onComplete){
	var q = 'select * from grades';
	db.all(q,onComplete);
};

var _getStudentsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from students', function(err1,students){
			
			grades.forEach(function(g){
				g.students = students.filter(function(s){return s.grade_id==g.id});
			})			
			onComplete(null,grades);
		})
	});	
};

var _getSubjectsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from subjects', function(err1,subjects){
			
			grades.forEach(function(g){
				g.subjects = subjects.filter(function(s){return s.grade_id==g.id});
			})			
			onComplete(null,grades);
		})
	});	
};

var _getStudentSummary = function(params, db,onComplete){
	var id = params.id;
	var student_grade_query = 'select s.name as name, s.id as id, g.name as grade_name, g.id as grade_id '+
		'from students s, grades g where s.grade_id = g.id and s.id='+id;
	var subject_score_query = 'select su.name, su.id, su.maxScore, sc.score '+
		'from subjects su, scores sc '+
		'where su.id = sc.subject_id and sc.student_id ='+id;
	db.get(student_grade_query,function(est,student){
		if(!student){
			onComplete(null,null);
			return;
		}
		db.all(subject_score_query,function(esc,subjects){			
			student.subjects = subjects;
			onComplete(null,student);
		})
	});
};

var _getGradeSummary = function(params,db,onComplete){
	var id = params.id;
	var student_query = "select id,name from students where grade_id="+id;
	var subject_query = "select id,name from subjects where grade_id="+id;
	var grade_query = "select id,name from grades where id="+id;
	db.get(grade_query,function(err,grade){
		db.all(student_query,function(est,students){
			grade.students = students;
			db.all(subject_query,function(esu,subjects){
				grade.subjects = subjects;
				onComplete(null,grade);		
			});
		});
	});
};


var _getUpdateGrade = function(grade, db, onComplete){
	var updateQuery = "update grades set name='"+grade.name+"' where id='"+grade.id+"'";
	db.run(updateQuery, function(err){
		onComplete(null);
	})
};

var _getEditGrade = function (params, db, onComplete) {
	var id = params.id;
	var grade_query = "select name from grades where id="+id;
	db.get(grade_query, function (err, grade) {
		if(err) return err;
		grade.id = id;
		onComplete(null, grade);
	});
};


var _getEditStudent = function (params, db, onComplete) {
	_getStudentSummary(params, db, onComplete);
};

var parser = function (body) {
	var subjects = body.subject_id.map(function(id,i){
		return {'id':id, score:body.subject_score[i] };
	});
	return {
		name: body.name,
		id: body.id,
		grade_id: body.grade_id,
		subjects: subjects
	};
};


var _getUpdateStudent = function(body, db, onComplete){
	var student = parser(body);
	var studentUpdateQuery = "update students set name = '"+student.name+"', grade_id = '" +student.grade_id + "' where id='" +student.id+"'";
	db.run(studentUpdateQuery,function(std_err){
		student.subjects.forEach(function(subject,index,array){
			var updateScoreQuery = "update scores set score="+subject.score+" where student_id='"+student.id+"' and subject_id = '"+subject.id+"';";
			db.run(updateScoreQuery, function(){
				if(array.length-1 == index) onComplete(null);
			});
		});
	});
};

var _getUpdateSubject = function(subject, db, onComplete){
	var subjectUpdateQuery = "update subjects set name='"+subject.name+"', maxScore='"+subject.maxScore+
						"', grade_id='"+subject.grade_id+"' where id="+subject.id;
	db.run(subjectUpdateQuery, function (err) {
		if(err) return err;
		onComplete(null);
	});
};

var _getSubjectSummary = function(params,db,onComplete){
	var id = params.id;
	var subject_query = "select name, grade_id, maxScore from subjects where id ="+id;
	db.get(subject_query,function(err,subject){
		subject.id = id;
		var student_query = "select id,name from students where grade_id="+subject.grade_id;
		db.all(student_query,function(est,student){
			subject.student = student;
			var execute = function() {
				var grade_query = "select name from grades where id="+subject.grade_id;
				db.all(grade_query,function(egr,grade){
					subject.grade = grade;
					onComplete(null,subject);
				});
			};
			student.forEach(function(st,index,array){
				db.get('select score from scores where student_id ='+st.id+' and subject_id = '+ id,function(esc,score){
					score && (st.score=score.score);
					if(array.length-1 == index) execute();
				});
			});
		});
	});
};

var _getEditSubject = function (id, db, onComplete) {
	_getSubjectSummary(id, db, onComplete);
};

var _addStudent = function(newStd, db, onComplete) {
	var student = {name: newStd.name, grade_id: newStd.id};
	var insertStudent = "insert into students (name, grade_id) values ('" + student.name + "', " + student.grade_id + ");";
	var studentIds = "select id from students where grade_id='"+student.grade_id+"';";
	var subjectIds = "select id from subjects where grade_id='"+student.grade_id+"';"
	db.run(insertStudent, function(err){
		db.all(studentIds, function(err, students){
			var newStdId = students[students.length-1].id;
			db.all(subjectIds, function(err, subjects){
				subjects.forEach(function(sub,index,subs){
					var insertScore = "insert into scores values ('"+newStdId+"', '"+sub.id+"', '0');";
					db.run(insertScore, function(err){
						if(index == subs.length-1){
							onComplete(null);
						}
					});
				});
			});
		});
	});
};

var _addSubject = function(newSub, db, onComplete) {
	var subject = {name: newSub.name, grade_id: newSub.id, maxScore: newSub.maxScore};
	var insertSubject = "insert into subjects (name, maxScore, grade_id) values ('" +
		subject.name + "', '" + subject.maxScore + "','"+subject.grade_id+"');";
	var studentIds = "select id from students where grade_id='"+subject.grade_id+"';";
	var subjectIds = "select id from subjects where grade_id='"+subject.grade_id+"';"

	db.run(insertSubject, function(err){
		db.all(subjectIds, function(err, subjects){
			var newSubId = subjects[subjects.length-1].id;
			db.all(studentIds, function(err, students){
				students.forEach(function(std,index,stds){
					var insertScore = "insert into scores values ('"+std.id+"', '"+newSubId+"', '0');";
					db.run(insertScore, function(err){
						if(index == stds.length-1){
							onComplete(null);
						}
					});
				});
			});
		});
	});
};

var _getEditScore = function(ids, db, onComplete){
	var score_details = {};
	var student_query = "select * from students where id = '"+ids.student+"';";
	var subject_query =  "select id,name,maxScore from subjects where id = '"+ids.subject+"';";
	db.get(student_query,function(stud_err,student){
		score_details.student = {id: student.id, name: student.name};
		var grade_query =  "select * from grades where id = '"+student.grade_id+"';";
		db.get(grade_query,function(grd_err,grade){
			score_details.grade = grade;
			db.get(subject_query,function(sub_err,subject){
				score_details.subject = subject;
				_getScore(ids,db,function(scor_err,score){
					score_details.score = score;
					onComplete(null,score_details);
				});				
			});
		});
	});
};

var _updateScore = function(change, db, onComplete){
	var updateChange = "update scores set score='"+change.score+
		"' where subject_id='"+change.id+"' and student_id='"+change.student_id+"';";
	db.run(updateChange, function(err){
		onComplete(null);
	});
};

var _getScore = function(ids, db, onComplete){
	var getScore = "select score from scores where subject_id='"+ids.subject+"' and student_id='"+ids.student+"';";
	db.get(getScore, function(err, score){
		onComplete(null, score.score);
	});
};

var init = function(location){	
	var operate = function(operation){
		return function(){
			var onComplete = (arguments.length == 2)?arguments[1]:arguments[0];
			var arg = (arguments.length == 2) && arguments[0];
			var onDBOpen = function(err){
				if(err){onComplete(err);return;}
				db.run("PRAGMA foreign_keys = 'ON';");
				arg && operation(arg,db,onComplete);
				arg || operation(db,onComplete);
				db.close();
			};
			var db = new sqlite3.Database(location,onDBOpen);
		};	
	};

	var records = {		
		get_grades: operate(_getGrades),
		get_students: operate(_getStudentsByGrade),
		get_subjects: operate(_getSubjectsByGrade),
		get_student: operate(_getStudentSummary),
		get_grade: operate(_getGradeSummary),
		get_subject: operate(_getSubjectSummary),
		get_grade_edit: operate(_getEditGrade),
		grade_update: operate(_getUpdateGrade),
		get_student_edit: operate(_getEditStudent),
		student_update: operate(_getUpdateStudent),
		get_subject_edit: operate(_getEditSubject),
		subject_update: operate(_getUpdateSubject),
		student_add: operate(_addStudent),
		subject_add: operate(_addSubject),
		get_score_edit: operate(_getEditScore),
		score_update: operate(_updateScore),
		get_score: operate(_getScore)
	};

	return records;
};

exports.parser = parser;
exports.init = init;
////////////////////////////////////
exports.getSubjects = function(grade,callback){
	var subjects = grade == 'one' && [
		{name:'english-1',grade:'one',max:125},
		{name:'moral science',grade:'one',max:50},
		{name:'general science',grade:'one',max:100},
		{name:'maths-1',grade:'one',max:100},
		{name:'craft',grade:'one',max:25},
		{name:'music',grade:'one',max:25},
		{name:'hindi-1',grade:'one',max:75}
	] || [];
	callback(null,subjects);
};

exports.getScoresBySubject = function(subject,callback){
	var scores = subject != 'craft' && [] || [
		{name:'Abu',score:20},
		{name:'Babu',score:18},
		{name:'Ababu',score:21},
		{name:'Dababu',score:22},
		{name:'Badadadababu',score:23},
		{name:'babudada',score:24}
	];
	callback(null,scores);
};