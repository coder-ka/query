This library is a schema-based, strongly-typed SQL builder.

In most cases, the schema file should be generated from the Prisma schema file, but you can also write it yourself.

- [Prisma generator for this library](https://www.npmjs.com/package/@coder-ka/prisma-query)
- [Schema file example](https://github.com/coder-ka/query/blob/main/tests/test-db/schema.ts)

## Usage

```ts
import { from, eq, toSql, asObject } from "@coder-ka/query";
import { User, Todo } from "path/to/schema.ts";

// create query
const query = from(User)
  .innerJoin("todo", Todo, (u, t) => eq(u.id, t.author_id))
  .where((x, p) => eq(x.first_name, p("Jean")))
  .select((x) => ({
    id: x.id,
    last_name: x.last_name,
    todo: {
      id: x.todo.title,
      name: x.todo.title,
    },
  }))
  .limit(1)
  .orderBy((x) => [
    {
      column: x.modified_at,
      order: "DESC",
    },
  ]);

// convert to sql
const sql = toSql(query);

// prepare statement
const prepared = await connection.prepare(sql);

// execute sql with parameters
const [rows] = await prepared.execute(selectQuery.params);

const row = rows[0];

console.log(row);
// {
//     'id': '01918ac1-c316-7601-b0b1-ec91d98ee24c',
//     'last_name': 'Giraud',
//     'todo.id': '01918ac1-f192-7629-94c6-1bcc5bb6b46d',
//     'todo.name': 'Create bande dessinée',
// }

// convert a row to nested object
console.log(asObject(query, row));
// {
//   id: "01918ac1-c316-7601-b0b1-ec91d98ee24c",
//   last_name: "Giraud",
//   todo: {
//     id: "01918ac1-f192-7629-94c6-1bcc5bb6b46d",
//     name: "Create bande dessinée",
//   },
// };
```

For more example, see the [tests](https://github.com/coder-ka/query/blob/main/tests/index.ts).

## Why SQL builder?

This library is just a SQL builder for row-origented-database like RDB.

- This library only supports converting one row to one nested object using the `asObject` function, because mapping many rows to one object can be expensive depending on the number of rows.
- This library is agnostic about which client is used. For example, the `TOP` clause and the `LIMIT` clause can be treated as having the same meaning, but methods for each syntax will be implemented separately.
- This library is not an ORM, so features like relations or associations will not be implemented. Either `innerJoin` or `leftJoin` gathers entities, and `asObject` creates a nested object. That should be sufficient for most use cases.

## Roadmap

Currently this library is for **PERSONAL USE** and is **NOT GUARANTEED TO BE MANTAINANCED**.

There is no specific roadmap at the moment, and some core features, such as functions and the LIKE clause, are not implemented yet.
