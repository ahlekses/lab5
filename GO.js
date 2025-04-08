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

      try {
        
        const [patients] = await this.mysqlConnection.query(`select * from patient`)
        for (const patientrecord of patients){

            await this.pgClient.query(

            `insert into lab5.patient (id, fullname, contactno, address, eadd, sex) values ($1, $2, $3, $4, $5, $6)`,
            [patientrecord.id, `${patientrecord.FirstName} ${patientrecord.MiddleName || ''} ${patientrecord.LastName}`.trim(), 
                patientrecord.ContactNumber, patientrecord.Address, patientrecord.EmailAddress, patientrecord.sex === "Female" ]
            )
        }
 
        const [diabetes] = await this.mysqlConnection.query(`select * from diabetestdiagnosisrecords`)
        for(const diabetesrecords of diabetes){
            await this.pgClient.query(
                                `INSERT INTO lab5.rc_checkup(
                    p_id, glucose, bp, skinthickness, bmi)
                    VALUES ($1, $2, $3, $4, $5);`,
                    [diabetesrecords.patientId, diabetesrecords.Glucose, 
                        diabetesrecords.BloodPressure,
                        diabetesrecords.SkinThickness, diabetesrecords.BMI
                     ]       
            )

                        await this.pgClient.query(
                            `INSERT INTO lab5.rc_labtest(
                p_id, insulin, diapedifunction, outcome)
                VALUES ($1, $2, $3, $4);`,
                [diabetesrecords.patientId,
                    diabetesrecords.Insulin,
                    diabetesrecords.DiabetesPedigreeFunction,
                    diabetesrecords.Outcome === 1,
                ]       
            )


            await this.pgClient.query(
                `INSERT INTO lab5.rc_precords(
	p_id, age, pregnancy)
	VALUES ($1, $2, $3);`,
    [diabetesrecords.patientId,
        diabetesrecords.Age,
        diabetesrecords.Pregnancies,
    ]       
)
        }
        console.log(chalk.green('✅ Migration completed successfully'));
       
      } catch (error) {
        console.log(error)
      }
     
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
