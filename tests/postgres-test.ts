import assert from "assert";
import { toSql } from "../src/main";
import pg from "pg";
import { test } from "./util";
import { uuidv7 } from "uuidv7";
import { selectQuery } from "./query-test";

export default [
  test("postgres connection.").do(async () => {
    const { Client } = pg;
    const client = new Client({
      host: "localhost",
      port: 53312,
      user: "postgres",
      password: "example",
      database: "postgres",
    });

    try {
      await client.connect();

      await client.query("BEGIN");

      const userId = uuidv7();
      await client.query(
        `
          INSERT INTO 
                accounts (
                  id,
                  first_name,
                  last_name,
                  age,
                  modified_at
                ) VALUES (
                  $1,
                  $2,
                  $3,
                  $4,
                  $5
                );
          `,
        [userId, "田中", "太郎", 25, new Date()]
      );

      const todoId = uuidv7();
      await client.query(
        `
          INSERT INTO 
                todos (
                  id,
                  title,
                  author_id,
                  modified_at
                ) VALUES (
                  $1,
                  $2,
                  $3,
                  $4
                );
          `,
        [todoId, "タイトル", userId, new Date()]
      );

      await client.query("COMMIT");

      const sql = toSql(selectQuery, {
        createPlaceholder: (i) => `$${i}`,
      });
      const { rows } = await client.query(sql, selectQuery.params);
      const row1 = rows[0];
      assert.deepStrictEqual(row1, {
        id: userId,
        "todos.id": todoId,
        "todos.name": "タイトル",
        "test.id": todoId,
        "test.author.first_name": "田中",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(error);
    } finally {
      await client.end();
    }
  }),
];
