// import assert from "assert";
import { from } from "../src/main";
import { And, AsObject, Eq, Table, column } from "../src/query";

type User = {
  id: string;
  first_name: string;
  last_name: string;
};
const users: Table<User> = {
  name: "users",
  columns: {
    id: column<string>(),
    first_name: column<string>(),
    last_name: column<string>(),
  },
};

type Todo = {
  id: string;
  title: string;
  authorId: User["id"];
};
const todos: Table<Todo> = {
  name: "todos",
  columns: {
    id: column<string>(),
    title: column<string>(),
    authorId: column<string>(),
  },
};

Promise.all([
  new Promise((res) => {
    const query = from(users)
      .innerJoin("todos", todos, (u, t) => Eq(u.id, t.authorId))
      .innerJoin("todos2", todos, (u, t) => Eq(u.id, t.authorId))
      .where(And([]))
      .select((x) => ({
        id: x.id,
        todos: {
          id: x.todos.id,
          name: x.todos.title,
        },
        test: {
          id: x.todos2.id,
        },
      }));

    const data: AsObject<typeof query> = [
      {
        id: "",
        todos: [
          {
            id: "",
            name: "title",
          },
        ],
        test: [
          {
            id: "",
          },
        ],
      },
    ];

    console.log(data);

    res({});
  }),
]);
