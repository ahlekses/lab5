
CREATE SCHEMA lab5 AUTHORIZATION postgres;


CREATE TABLE lab5.patient (
	id int4 NOT NULL,
	fullname varchar(255) NOT NULL,
	address varchar(255) NOT NULL,
	contactno varchar(255) NOT NULL,
	eadd varchar(255) NOT NULL,
	sex bool NOT NULL,
	CONSTRAINT patient_pkey PRIMARY KEY (id)
);


CREATE TABLE lab5.rc_checkup (
	p_id int4 NOT NULL,
	glucose int4 NOT NULL,
	bp int4 NOT NULL,
	skinthickness int4 NOT NULL,
	bmi bool NOT NULL,
	CONSTRAINT fk_p_checkup FOREIGN KEY (p_id) REFERENCES lab5.patient(id)
);



CREATE TABLE lab5.rc_labtest (
	p_id int4 NOT NULL,
	insulin int4 NOT NULL,
	diapedifunction float8 NOT NULL,
	outcome bool NOT NULL,
	lb_id int4 NOT NULL,
	CONSTRAINT fk_p_labtest FOREIGN KEY (p_id) REFERENCES lab5.patient(id)
);


CREATE TABLE lab5.rc_precords (
	p_id int4 NOT NULL,
	age int4 NULL,
	pregnancy int4 NULL,
	CONSTRAINT fk_p_precords FOREIGN KEY (p_id) REFERENCES lab5.patient(id)
);