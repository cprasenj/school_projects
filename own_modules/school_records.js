var sqlite3 = require('sqlite3').verbose();

var bodyParser = function (body) {
	body.subjects = body.subject_id.map(function(id,i){
		return {'id':id, score:body.subject_score[i] };
	});
};

var selectFrom = function(table,selections,conditions){
	var selections = selections || ['*'];
	var qry = "select " + selections.join(",") +" from "+ table;
	if(conditions) qry += " where " + conditions.join(" and ") + ";";
	return qry;
};

var updateTable = function(table,updates,conditions){
	var qry = "update " + table + " set " + updates.join(",");
	if(conditions) qry += " where " + conditions.join(" and ") + ";";
	return qry;
};

var _getGrades = function(db,onComplete){
	var q = selectFrom('grades');
	db.all(q,onComplete);
};

var selectFromGrades = function(db,onComplete,table){
	_getGrades(db,function(err,grades){		
		db.all(selectFrom(table), function(err1,tableContent){
			grades.forEach(function(g){
				g[table] = tableContent.filter(function(s){return s.grade_id==g.id});
			})			
			onComplete(null,grades);
		})
	});	
}
var _getStudentsByGrade = function(db,onComplete){
	selectFromGrades(db,onComplete,"students");
};

var _getSubjectsByGrade = function(db,onComplete){
	selectFromGrades(db,onComplete,"subjects");
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
	var student_query = selectFrom('students',['id','name'],['grade_id='+id]);
	var subject_query = selectFrom('subjects',['id','name'],['grade_id='+id]);
	var grade_query = selectFrom('grades',['id','name'],['id='+id]);
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
	var updateQuery = updateTable('grades',["name='"+grade.name+"'	"],['id='+grade.id]);
	db.run(updateQuery, function(err){
		onComplete(null);
	})
};

var _getEditGrade = function (params, db, onComplete) {
	var id = params.id;
	var grade_query = selectFrom('grades',['name'],['id='+id]);
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

var query_each = function(objects,onEach,atLast){
	var length = objects.length;
	objects.forEach(function(subject,index){
		var complete = (index == length-1)? function(){atLast(null)}: function(){}; 
		onEach(subject,complete);
	});
};

var _getUpdateStudent = function(body, db, onComplete){
	var student = parser(body);
	var studentUpdateQuery = updateTable('students',["name='"+student.name+"'","grade_id='"+student.grade_id+"'"],['id='+student.id]);
	db.run(studentUpdateQuery,function(std_err){
	var onEach = function(subject,atLast){
		var updateScoreQuery = updateTable('scores',["score='"+subject.score+"'"],["student_id='"+student.id+"'",'subject_id='+subject.id]);
		db.run(updateScoreQuery,atLast);
	};
	query_each(student.subjects,onEach,onComplete);
	});
};

var _getUpdateSubject = function(subject, db, onComplete){
	var updates = ["name='"+subject.name+"'","maxScore='"+subject.maxScore+"'","grade_id='"+subject.grade_id+"'"];
	var condition = ['id='+subject.id];
	var subjectUpdateQuery = updateTable('subjects',updates,condition);
	db.run(subjectUpdateQuery, function (err) {
		if(err) return err;
		onComplete(null);
	});
};

var _getSubjectSummary = function(params,db,onComplete){
	var id = params.id;
	var subject_query = selectFrom('subjects',['name','grade_id','maxScore'],['id='+id]);
	db.get(subject_query,function(err,subject){
		subject.id = id;
		var student_query = selectFrom('students',['id','name'],['grade_id='+subject.grade_id]);
		db.all(student_query,function(est,student){
			subject.student = student;
			var atLast = function() {
				var grade_query = selectFrom('grades',['name'],['id='+subject.grade_id]);
				db.all(grade_query,function(egr,grade){
					subject.grade = grade;
					onComplete(null,subject);
				});
			};
			var onEach = function(st, atLast){
				var selectScore = selectFrom('scores',['score'],['student_id='+st.id,'subject_id='+id]);
				db.get(selectScore,function(esc,score){
					score && (st.score=score.score); 
					atLast();
				});
			};
			query_each(student,onEach,atLast);
		});
	});
};

var _getEditSubject = function (id, db, onComplete) {
	_getSubjectSummary(id, db, onComplete);
};
var insert_score = function(db,insertQuery,qry1,qry2,onComplete){
	db.run(insertQuery, function(err){
		db.all(qry1.query, function(err, content1){
			var newId = content1[content1.length-1].id;
			db.all(qry2.query, function(err, content2){
				var onEach = function(content,atLast){
					var insertScore = "insert into scores ('"+qry1.col+"','"+qry2.col+"','score') values ('"+newId+"', '"+content.id+"', '0');";
					db.run(insertScore, atLast);
				};
				query_each(content2,onEach,onComplete);
			});
		});
	});	
};

var _addStudent = function(newStd, db, onComplete) {
	var student = {name: newStd.name, grade_id: newStd.id};
	var insertStudent = "insert into students (name, grade_id) values ('" + student.name + "', " + student.grade_id + ");";
	var studentIds = selectFrom('students',['id'],['grade_id='+student.grade_id]);
	var subjectIds = selectFrom('subjects',['id'],['grade_id='+student.grade_id]);
	var qry1 = {query:studentIds, col: 'student_id'};
	var qry2 = {query:subjectIds, col: 'subject_id'};
	insert_score(db,insertStudent,qry1,qry2,onComplete);
};
var _addSubject = function(newSub, db, onComplete) {
	var subject = {name: newSub.name, grade_id: newSub.id, maxScore: newSub.maxScore};
	var insertSubject = "insert into subjects (name, maxScore, grade_id) values ('" +
		subject.name + "', '" + subject.maxScore + "','"+subject.grade_id+"');";
	var studentIds = selectFrom('students',['id'],['grade_id='+subject.grade_id]);
	var subjectIds = selectFrom('subjects',['id'],['grade_id='+subject.grade_id]);
	var qry1 = {query:subjectIds, col: 'subject_id'};
	var qry2 = {query:studentIds, col: 'student_id'};
	insert_score(db,insertSubject,qry1,qry2,onComplete);
};

var _getEditScore = function(ids, db, onComplete){
	var score_details = {};
	var student_query = selectFrom('students',['*'],['id='+ids.student]);
	var subject_query = selectFrom('subjects',['id','name','maxScore'],['id='+ids.subject]); 
	db.get(student_query,function(stud_err,student){
		score_details.student = {id: student.id, name: student.name};
		var grade_query = selectFrom('grades',['*'],['id='+student.grade_id]);
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
	var updateChange = updateTable('scores',["score='"+change.score+"'"],["subject_id='"+change.id+"'","student_id='"+change.student_id+"'"]);
	db.run(updateChange, function(err){
		onComplete(null);
	});
};

var _getScore = function(ids, db, onComplete){
	var getScore = selectFrom('scores',['score'],['subject_id='+ids.subject,'student_id='+ids.student]);
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