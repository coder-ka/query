import mysqlTest from "./mysql.test";
import postgresTest from "./postgres.test";
import queryTest from "./query.test";

Promise.all(
  [...queryTest, ...mysqlTest, ...postgresTest].map(async (test) => {
    if (test.description) console.log(test.description);
    await test.content();
  })
);
