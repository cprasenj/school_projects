var school_records = require('./school_records').init('./data/school.db');

var redirect = function(err,res,location,next){
	if(err) next();
	else res.redirect(location);
};
var render = function(err,res,location,content,next){
	if(!content) next();
	else res.render(location,content);
};

var bodyParser = function (body) {
	body.subjects = body.subject_id.map(function(id,i){
		return {'id':id, score:body.subject_score[i] };
	});
};

exports.getGrades = function(req,res){
	school_records.getGrades(function(err,grades){
		res.render('grades',{grades:grades});
	});
};

exports.getAddStudent = function (req, res, next) {
	res.render('grade_add', {grade_id: req.params.grade_id});
};

exports.getAddSubject = function (req,res,next) {
	res.render('subject_add', {grade_id: req.params.grade_id});
};

exports.getStudents = function(req,res){
	school_records.getStudentsByGrade(function(err,grades){
		res.render('students',{grades:grades});
	});
};

exports.getSubjects = function(req,res){
	school_records.getSubjectsByGrade(function(err,grades){
		res.render('subjects',{grades:grades});
	});
};

exports.getStudentSummary = function(req,res,next){
	school_records.getStudentSummary(req.params.id, function(err,student){
		render(err,res,'student',student,next);
	});
};

exports.getSubjectSummary = function(req,res,next){
	school_records.getSubjectSummary(req.params.id, function(err,subject){
		render(err,res,'subject',subject,next);
	});
};

exports.getGradeSummary = function(req,res,next){
	school_records.getGradeSummary(req.params.id, function(err,grade){
		render(err,res,'grade',grade,next);
	});
};

exports.getEditGrade = function(req,res,next){
	school_records.getEditGrade(req.params.id, function(err,grade){
		render(err,res,'grade_edit',grade,next);
	});
};

exports.getEditStudent = function(req,res,next){
	school_records.getEditStudent(req.params.id, function(err,student){
		render(err,res,'student_edit',student,next);
	});
};
exports.getEditSubject = function(req,res,next){
	school_records.getEditSubject(req.params.id, function(err,subject){
		render(err,res,'subject_edit',subject,next);
	});
};

exports.getEditScore = function(req,res,next){
	var ids = {student: req.params.student_id, subject: req.params.subject_id};
	school_records.getEditScore(ids, function(err,score){
		render(err,res,'score_edit',score,next);
	});
};

exports.updateScore = function (req, res, next) {
	req.body.student_id = req.params.student_id;
	req.body.subject_id = req.params.subject_id;
	school_records.updateScore(req.body, function(err){
		redirect(err,res,'/subject/'+req.body.subject_id,next);
	});
};

exports.getUpdateGrade = function (req, res, next) {
	req.body.id = req.params.id;
	school_records.getUpdateGrade(req.body, function(err){
		redirect(err,res,'/grade/'+req.body.id,next);
	});
};

exports.getUpdateSubject = function (req, res, next) {
	req.body.id = req.params.sub_id;
	req.body.grade_id = req.params.grade_id;
	school_records.getUpdateSubject(req.body, function(err){
		redirect(err,res,'/subject/'+req.body.id,next);
	});
};

exports.getUpdateStudent = function (req, res, next) {
	req.body.id = req.params.std_id;
	bodyParser(req.body);
	school_records.getUpdateStudent(req.body, function(err){
		redirect(err,res,'/student/'+req.body.id,next);
	});
};

exports.addStudent = function(req, res, next) {
	req.body.grade_id = req.params.grade_id;
	school_records.addStudent(req.body, function(err){
		redirect(err,res,'/grade/'+req.body.grade_id,next);
	});
};

exports.addSubject = function(req, res, next) {
	req.body.grade_id = req.params.grade_id;
	school_records.addSubject(req.body, function(err){
		redirect(err,res,'/grade/'+req.body.grade_id,next);
	});
};