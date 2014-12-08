var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var school_records = require('./own_modules/school_records').init('./data/school.db');
var app = express();
var school_routes = require('./own_modules/school_routes');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/grades',school_routes.getGrades);
app.get('/students',school_routes.getStudents);
app.get('/subjects',school_routes.getSubjects);
app.get('/student/:id',school_routes.getStudentSummary);
app.get('/grade/:id',school_routes.getGradeSummary);
app.get('/subject/:id',school_routes.getSubjectSummary);

app.get('/grade_edit/:id',school_routes.getEditGrade);
app.post('/updateGrade/:id',school_routes.getUpdateGrade);
app.get('/student_edit/:id',school_routes.getEditStudent);
app.post('/updateStudent/:std_id',school_routes.getUpdateStudent);
app.get('/subject_edit/:id',school_routes.getEditSubject);
app.post('/updateSubject/:sub_id/:grade_id',school_routes.getUpdateSubject);
app.get('/score_edit/:student_id/:subject_id',school_routes.getEditScore);
app.post('/updateScore/:student_id/:subject_id',school_routes.updateScore);

app.get('/grade_add/:grade_id', school_routes.getAddStudent);
app.post('/addStudent/:grade_id', school_routes.addStudent);
app.get('/subject_add/:grade_id', school_routes.getAddSubject);
app.post('/addSubject/:grade_id', school_routes.addSubject);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
