var school_records = require('./school_records').init('./data/school.db');
exports.get_grades = function(req,res){
	school_records.getGrades(function(err,grades){
		res.render('grades',{grades:grades});
	});
};

exports.get_students = function(req,res){
	school_records.getStudentsByGrade(function(err,grades){
		res.render('students',{grades:grades});
	});
};

exports.get_subjects = function(req,res){
	school_records.getSubjectsByGrade(function(err,grades){
		res.render('subjects',{grades:grades});
	});
};

exports.get_student = function(req,res,next){
	school_records.getStudentSummary(req.params.id,
	function(err,student){
		if(!student) 
			next();
		else 
		{
			res.render('student',student);
		}
	});
};

exports.get_subject_summary = function(req,res,next){
	school_records.getSubjectSummary(req.params.id,
	function(err,subject){
		if(!subject) 
			next();
		else {
			subject.id = req.params.id;
			res.render('subject',subject);
		}
	});
};

exports.get_grade_summary = function(req,res,next){
	school_records.getGradeSummary(req.params.id,
		function(err,grade){
			if(!grade)
				next();
			else
				res.render('grade',grade);
		});
};

exports.get_edit_grade = function(req,res,next){
	school_records.getEditGrade(req.params.id,
		function(err,grade){
			if(!grade)
				next();
			else
				res.render('grade_edit',grade);
		});
};

exports.get_edit_student = function(req,res,next){
	school_records.getEditStudent(req.params.id,
		function(err,student){
			if(!student)
				next();
			else{
				res.render('student_edit',student);
			}
		});
};
exports.get_edit_subject = function(req,res,next){
	school_records.getEditSubject(req.params.id,
		function(err,subject){
			if(!subject)
				next();
			else{
				subject.id = req.params.id;
				res.render('subject_edit',subject);
				
			}
		});
};

exports.get_edit_score = function(req,res,next){
	var ids = {student: req.params.student_id, subject: req.params.subject_id};
	school_records.getEditScore(ids,
		function(err,score){
			if(!score)
				next();
			else{
				res.render('score_edit',score);
			}
		});
};

exports.update_score = function (req, res, next) {
	school_records.updateScore(req.body,
		function(err){
			if(err)
				next();
			else{
				res.redirect('/subject/'+req.body.subject_id);
				res.end();
			}
		});
};

exports.get_update_grade = function (req, res, next) {
	school_records.getUpdateGrade(req.body,
		function(err){
			if(err)
				next();
			else{
				res.redirect('/grade/'+req.body.id);
				res.end();
			}
		});
};

exports.get_update_subject = function (req, res, next) {
	school_records.getUpdateSubject(req.body,
		function(err){
			if(err)
				next();
			else{
				res.redirect('/subject/'+req.body.id);
				res.end();
			}
		});
};


var bodyParser = function (body) {
	body.subjects = body.subject_id.map(function(id,i){
		return {'id':id, score:body.subject_score[i] };
	});
};

exports.get_update_student = function (req, res, next) {
	var id = req.body.id;
	bodyParser(req.body);
	school_records.getUpdateStudent(req.body,
		function(err){
			if(err)
				next();
			else{
				res.redirect('/student/'+id);
				res.end();
			}
		});
};

exports.get_add_student = function (req, res, next) {
	res.render('grade_add', {grade_id: req.params.id});
};

exports.get_add_subject = function (req,res,next) {
	res.render('subject_add', {grade_id: req.params.id});
};

exports.add_student = function(req, res, next) {
	school_records.addStudent(req.body,
		function(err){
			if(err)
				next();
			else{
				res.redirect('/grade/'+req.body.grade_id);
				res.end();
			}
		});
};

exports.add_subject = function(req, res, next) {
	school_records.addSubject(req.body,
		function(err){
			if(err)
				next();
			else{
				res.redirect('/grade/'+req.body.grade_id);
				res.end();
			}
		});
};