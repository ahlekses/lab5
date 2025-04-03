const inquirer = require('inquirer').default;  
const { Client } = require('pg');
const chalk = require('chalk').default;
const mysql = require('mysql2/promise');
const path = require('path');

class DatabaseModel {
    constructor(tableName, columns, schema = 'lab5') {
        this.tableName = tableName;
        this.columns = columns;
        this.schema = schema;
    }

    static convertType(mysqlType) {
        const typeMap = {
            'int': 'INTEGER',
            'bigint': 'BIGINT',
            'varchar': 'VARCHAR',
            'text': 'TEXT',
            'datetime': 'TIMESTAMP',
            'date': 'DATE',
            'decimal': 'NUMERIC',
            'float': 'DOUBLE PRECISION',
            'double': 'DOUBLE PRECISION',
            'boolean': 'BOOLEAN',
            'tinyint(1)': 'BOOLEAN',
            'enum': 'TEXT',
            'json': 'JSONB'
        };
        
        const baseType = mysqlType.toLowerCase().split('(')[0];
        return typeMap[baseType] || 'TEXT';
    }

    generateCreateTableSQL() {
        const columnDefinitions = this.columns.map(col => {
            const pgType = DatabaseModel.convertType(col.Type);
            const nullable = col.Null === 'YES' ? '' : 'NOT NULL';
            const defaultValue = col.Default ? `DEFAULT ${col.Default}` : '';
            const primaryKey = col.Key === 'PRI' ? 'PRIMARY KEY' : '';
            return `"${col.Field}" ${pgType} ${nullable} ${defaultValue} ${primaryKey}`.trim();
        }).join(', ');

        return `CREATE TABLE "${this.schema}"."${this.tableName}" (${columnDefinitions})`;
    }
}

class DatabaseMigrator {
    constructor(config) {
        this.mysqlConfig = {
            host: config.mysqlHost || 'localhost',
            user: config.mysqlUser,
            password: config.mysqlPassword,
            database: config.mysqlDatabase,
            port: config.mysqlPort || 3306
        };

        this.pgConfig = {
            host: config.pgHost || 'localhost',
            user: config.pgUser,
            password: config.pgPassword,
            database: config.pgDatabase,
            port: config.pgPort || 5432
        };
    }

    async connectMySQL() {
        this.mysqlConnection = await mysql.createConnection(this.mysqlConfig);
        console.log(chalk.green('✅ Connected to MySQL database'));
    }

    async connectPostgreSQL() {
        this.pgClient = new Client(this.pgConfig);
        await this.pgClient.connect();
        console.log(chalk.green('✅ Connected to PostgreSQL database'));
    }



async migrate() {
        await this.connectMySQL();
        await this.connectPostgreSQL();

        const tables = {
            patient: 'lab5.patient',
            diabetestdiagnosisrecords: {
                rc_checkup: 'lab5.rc_checkup',
                rc_labtest: 'lab5.rc_labtest',
                rc_precords: 'lab5.rc_precords'
            }
        };

        await this.pgClient.query('CREATE SCHEMA IF NOT EXISTS lab5 AUTHORIZATION postgres');

      
        const [patients] = await this.mysqlConnection.query('SELECT * FROM `patient`');
        for (const patient of patients) {
            await this.pgClient.query(
                `INSERT INTO lab5.patient (id, fullname, address, contactno, eadd, sex) VALUES ($1, $2, $3, $4, $5, $6)`,
                [patient.id, `${patient.FirstName} ${patient.MiddleName || ''} ${patient.LastName}`.trim(), patient.Address, patient.ContactNumber, patient.EmailAddress, patient.Sex === 'Female']
            );
        }


        const [records] = await this.mysqlConnection.query('SELECT * FROM `diabetestdiagnosisrecords`');
        for (const record of records) {
            await this.pgClient.query(
                `INSERT INTO lab5.rc_checkup (p_id, glucose, bp, skinthickness, bmi) VALUES ($1, $2, $3, $4, $5)`,
                [record.patientId, record.Glucose, record.BloodPressure, record.SkinThickness, record.BMI > 25]
            );
            await this.pgClient.query(
                `INSERT INTO lab5.rc_labtest (p_id, insulin, diapedifunction, outcome, lb_id) VALUES ($1, $2, $3, $4, $5)`,
                [record.patientId, record.Insulin, record.DiabetesPedigreeFunction, record.Outcome === 1, record.patientId]
            );
            await this.pgClient.query(
                `INSERT INTO lab5.rc_precords (p_id, age, pregnancy) VALUES ($1, $2, $3)`,
                [record.patientId, record.Age, record.Pregnancies]
            );
        }

        console.log(chalk.green('✅ Migration completed successfully'));
        await this.mysqlConnection.end();
        await this.pgClient.end();
    }
}

// CLI Entry Point
async function main() {
    const config = await inquirer.prompt([
        { type: 'input', name: 'mysqlHost', message: 'MySQL Host:', default: 'localhost' },
        { type: 'input', name: 'mysqlPort', message: 'MySQL Port:', default: 3306 },
        { type: 'input', name: 'mysqlUser', message: 'MySQL Username:' },
        { type: 'password', name: 'mysqlPassword', message: 'MySQL Password:' },
        { type: 'input', name: 'mysqlDatabase', message: 'MySQL Database Name:' },
        { type: 'input', name: 'pgHost', message: 'PostgreSQL Host:', default: 'localhost' },
        { type: 'input', name: 'pgPort', message: 'PostgreSQL Port:', default: 5432 },
        { type: 'input', name: 'pgUser', message: 'PostgreSQL Username:' },
        { type: 'password', name: 'pgPassword', message: 'PostgreSQL Password:' },
        { type: 'input', name: 'pgDatabase', message: 'PostgreSQL Database Name:' }
    ]);

    const migrator = new DatabaseMigrator(config);
    await migrator.migrate();
}

main().catch(console.error);

module.exports = { DatabaseMigrator, DatabaseModel };
