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


exports.post = function(method, goBack){
	return function(req,res,next){
		injectParams(req.body, req.params);
		school_records[method](req.body, function(err){
			redirect(err,res,goBack+req.body.id,next);
		});
	};
};

exports.get = function(page){
	return function(req,res,next){
		school_records['get_'+page](req.params, function(err, content){
			render(err,res,page,content,next);
		});
	};
};

exports.put = function(page){
	return function(req,res){
		school_records['get_'+page](function(err,content){
			res.render(page,{grades:content});
		});
	};
};

exports.get_student_add = function (req, res) {
	res.render('student_add', {grade_id: req.params.grade_id});
};

exports.get_subject_add = function (req,res) {
	res.render('subject_add', {grade_id: req.params.grade_id});
};