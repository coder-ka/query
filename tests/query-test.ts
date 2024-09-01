import assert from "assert";
import { AsObject, asObject, AsRow } from "../src/main";
import { test } from "./util";
import { from, eq } from "../src/main";
import { todos, accounts } from "./schema";

export const selectQuery = from(accounts)
  .innerJoin("todos", todos, (u, t) => eq(u.id, t.author_id))
  .innerJoin(
    "todos2",
    from(todos)
      .innerJoin("author", accounts, (t, u) => eq(t.author_id, u.id))
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

export default [
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
];
