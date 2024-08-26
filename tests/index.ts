import assert from "assert";
import { from, AsObject, eq, toSql, asObject, AsRow } from "../src/main";
import { Todo, User } from "./test-db/schema";
import mysql from "mysql2/promise";
import { test } from "./util";
import { uuidv7 } from "uuidv7";

const selectQuery = from(User)
  .innerJoin("todos", Todo, (u, t) => eq(u.id, t.author_id))
  .innerJoin(
    "todos2",
    from(Todo)
      .innerJoin("author", User, (t, u) => eq(t.author_id, u.id))
      .select((x) => ({
        id: x.id,
        author: {
          id: x.author.id,
          first_name: x.author.first_name,
        },
      })),
    (u, t) => eq(u.id, t.author.id)
  )
  .where((x, p) => eq(x.first_name, p("田中")))
  .select((x) => ({
    id: x.id,
    todos: {
      id: x.todos.id,
      name: x.todos.title,
    },
    test: {
      id: x.todos2.id,
      author: {
        first_name: x.todos2.author.first_name,
      },
    },
  }))
  .limit(1)
  .orderBy((x) => [
    {
      column: x.modified_at,
      order: "DESC",
    },
  ]);

Promise.all([
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
              User (
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
              Todo (
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

      const sql = toSql(selectQuery);
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
  test("converting row to object.").do(async () => {
    const row: AsRow<typeof selectQuery> = {
      id: "user-id",
      "todos.id": "todo-id",
      "todos.name": "タイトル",
      "test.id": "todo-id",
      "test.author.first_name": "田中",
    };

    const object: AsObject<typeof selectQuery> = {
      id: "user-id",
      todos: {
        id: "todo-id",
        name: "タイトル",
      },
      test: {
        id: "todo-id",
        author: {
          first_name: "田中",
        },
      },
    };

    assert.deepStrictEqual(asObject(selectQuery, row), object);
  }),
]);
