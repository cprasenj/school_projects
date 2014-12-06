var sqlite3 = require('sqlite3').verbose();

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

var _getStudentSummary = function(id, db,onComplete){
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

var _getGradeSummary = function(id,db,onComplete){
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

var _getEditGrade = function (id, db, onComplete) {
	var grade_query = "select name from grades where id="+id;
	db.get(grade_query, function (err, grade) {
		if(err) return err;
		grade.id = id;
		onComplete(null, grade);
	});
};


var _getEditStudent = function (id, db, onComplete) {
	_getStudentSummary(id, db, onComplete);
};

var _getUpdateStudent = function(student, db, onComplete){
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

var _getSubjectSummary = function(id,db,onComplete){
	var subject_query = "select name, grade_id, maxScore from subjects where id ="+id;
	db.get(subject_query,function(err,subject){
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
		getGrades: operate(_getGrades),
		getStudentsByGrade: operate(_getStudentsByGrade),
		getSubjectsByGrade: operate(_getSubjectsByGrade),
		getStudentSummary: operate(_getStudentSummary),
		getGradeSummary: operate(_getGradeSummary),
		getSubjectSummary: operate(_getSubjectSummary),
		getEditGrade: operate(_getEditGrade),
		getUpdateGrade: operate(_getUpdateGrade),
		getEditStudent: operate(_getEditStudent),
		getUpdateStudent: operate(_getUpdateStudent),
		getEditSubject: operate(_getEditSubject),
		getUpdateSubject: operate(_getUpdateSubject)
	};

	return records;
};

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