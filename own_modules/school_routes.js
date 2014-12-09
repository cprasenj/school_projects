var school_records = require('./school_records').init('./data/school.db');

var redirect = function(err,res,location,next){
	if(err) next();
	else res.redirect(location);
};

var render = function(err,res,location,content,next){
	if(!content) next();
	else res.render(location,content);
};

var injectParams = function(body,params) {
	var paramNames = Object.keys(params);
	paramNames.forEach(function(paramName) {
		body[paramName] = params[paramName];
	});
};

var bodyParser = function (body) {
	body.subjects = body.subject_id.map(function(id,i){
		return {'id':id, score:body.subject_score[i] };
	});
};

exports.get = function(page){
	return function(req,res,next){
		school_records['get_'+page](req.params.id, function(err, content){
			render(err,res,page,content,next);
		});
	};
};

exports.post = function(method, goBack){
	return function(req,res,next){
		injectParams(req.body, req.params);
		school_records[method](req.body, function(err){
			redirect(err,res,goBack+req.body.id,next);
		});
	};
};

exports.get_grades = function(req,res){
	school_records.get_grades(function(err,grades){
		res.render('grades',{grades:grades});
	});
};

exports.get_student_add = function (req, res) {
	res.render('student_add', {grade_id: req.params.grade_id});
};

exports.get_subject_add = function (req,res) {
	res.render('subject_add', {grade_id: req.params.grade_id});
};

exports.get_students = function(req,res){
	school_records.get_students(function(err,grades){
		res.render('students',{grades:grades});
	});
};

exports.get_subjects = function(req,res){
	school_records.get_subjects(function(err,grades){
		res.render('subjects',{grades:grades});
	});
};

exports.get_score_edit = function(req,res,next){
	school_records.get_score_edit(req.params, function(err,score){
		render(err,res,'score_edit',score,next);
	});
};

exports.student_update = function (req, res, next) {
	injectParams(req.body,req.params);
	bodyParser(req.body);
	school_records.student_update(req.body, function(err){
		redirect(err,res,'/student/'+req.body.id,next);
	});
};
