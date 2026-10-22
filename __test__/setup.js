/**
 * Global test setup
 * Define env vars before any module loads to prevent dotenv-safe from crashing.
 */
process.env.SECRET = "test_secret_key_for_jest";
process.env.DB_HOST = "localhost";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "test_db";
process.env.MYSQLHOST = "localhost";
process.env.MYSQLUSER = "root";
process.env.MYSQLPASSWORD = "test";
process.env.MYSQLDATABASE = "test_db";
