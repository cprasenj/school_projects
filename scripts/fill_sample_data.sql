pragma foreign_keys = 'ON';
insert into grades (id,name) 
	values (1,'class 1'), (2,'class 2');
insert into students (id,name,grade_id)
	values (1,'Sayli kadam',1), (2,'Prasenjit',1), (3,'Gautam',1), (4,'Kaustav',1);
insert into subjects (id,name,maxScore,grade_id)
	values (1,'Cricket',100,1), (2,'Hockey',50,1), (3,'KhoKho',30,1);
insert into scores (student_id, subject_id, score)
	values (1,1,30), (1,2,30), (1,3,30), (2,1,30), (2,2,30), (2,3,30),(3,1,30), (3,2,30), (3,3,30), (4,1,30), (4,2,30), (4,3,30);