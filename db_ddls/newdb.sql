-- DROP SCHEMA lab5;

CREATE SCHEMA lab5 AUTHORIZATION postgres;
-- lab5.patient definition

-- Drop table

-- DROP TABLE lab5.patient;

CREATE TABLE lab5.patient (
	id int4 NOT NULL,
	fullname varchar(255) NOT NULL,
	address varchar(255) NOT NULL,
	contactno varchar(255) NOT NULL,
	eadd varchar(255) NOT NULL,
	sex bool NOT NULL,
	CONSTRAINT patient_pkey PRIMARY KEY (id)
);


-- lab5.rc_checkup definition

-- Drop table

-- DROP TABLE lab5.rc_checkup;

CREATE TABLE lab5.rc_checkup (
	p_id int4 NOT NULL,
	glucose int4 NOT NULL,
	bp int4 NOT NULL,
	skinthickness int4 NOT NULL,
	bmi int4 NOT NULL,
	CONSTRAINT fk_p_checkup FOREIGN KEY (p_id) REFERENCES lab5.patient(id)
);


-- lab5.rc_labtest definition

-- Drop table

-- DROP TABLE lab5.rc_labtest;

CREATE TABLE lab5.rc_labtest (
	p_id int4 NOT NULL,
	insulin int4 NOT NULL,
	diapedifunction float8 NOT NULL,
	outcome bool NOT NULL,
	CONSTRAINT fk_p_labtest FOREIGN KEY (p_id) REFERENCES lab5.patient(id)
);


-- lab5.rc_precords definition

-- Drop table

-- DROP TABLE lab5.rc_precords;

CREATE TABLE lab5.rc_precords (
	p_id int4 NOT NULL,
	age int4 NULL,
	pregnancy int4 NULL,
	CONSTRAINT fk_p_precords FOREIGN KEY (p_id) REFERENCES lab5.patient(id)
);