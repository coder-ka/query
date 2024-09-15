import mysqlTest from "./mysql.test";
import postgresTest from "./postgres.test";
import queryTest from "./query.test";

Promise.all([...queryTest, ...mysqlTest, ...postgresTest]).then(
  (testResults) => {
    testResults.forEach((testResult) => {
      if (testResult.description) console.log(testResult.description);
    });
  }
);
