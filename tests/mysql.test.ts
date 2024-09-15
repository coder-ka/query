import assert from "assert";
import { mysqlToSqlOptions, toSql } from "../src/main";
import mysql from "mysql2/promise";
import { test } from "@coder-ka/testing";
import { uuidv7 } from "uuidv7";
import { selectQuery } from "./query.test";

export default [
  test("mysql connection.").do(async () => {
    const connection = await mysql.createConnection({
      host: "localhost",
      port: 53310,
      user: "root",
      password: "example",
      database: "coder-ka-query_test",
    });

    try {
      connection.beginTransaction();

      const createUser = connection.prepare(`
          INSERT INTO 
                accounts (
                  id,
                  first_name,
                  last_name,
                  age,
                  modified_at
                ) VALUES (
                  ?,
                  ?,
                  ?,
                  ?,
                  ?
                );
          `);

      const userId = uuidv7();
      (await createUser).execute([userId, "田中", "太郎", 25, new Date()]);

      const createTodo = connection.prepare(`
          INSERT INTO 
                todos (
                  id,
                  title,
                  author_id,
                  modified_at
                ) VALUES (
                  ?,
                  ?,
                  ?,
                  ?
                );
          `);

      const todoId = uuidv7();
      (await createTodo).execute([todoId, "タイトル", userId, new Date()]);

      await connection.commit();

      const sql = toSql(selectQuery, mysqlToSqlOptions);
      const prepared = await connection.prepare(sql);
      const [rows] = await prepared.execute(selectQuery.params);
      const row1 = rows[0];
      assert.deepStrictEqual(row1, {
        id: userId,
        "todos.id": todoId,
        "todos.name": "タイトル",
        "test.id": todoId,
        "test.author.first_name": "田中",
      });
    } catch (error) {
      console.error(error);
      await connection.rollback();
    } finally {
      connection.destroy();
    }
  }),
];
