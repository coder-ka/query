import { column, table } from "../src/main";

export type accounts = {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  modified_at: Date;
};
export const accounts = table(
  "accounts",
  null,
  {
    id: column<string>('id', ['accounts']),
    first_name: column<string>('first_name', ['accounts']),
    last_name: column<string>('last_name', ['accounts']),
    age: column<number>('age', ['accounts']),
    modified_at: column<Date>('modified_at', ['accounts']),
  },
);

export type todos = {
  id: string;
  title: string;
  author_id: string;
  modified_at: Date;
};
export const todos = table(
  "todos",
  null,
  {
    id: column<string>('id', ['todos']),
    title: column<string>('title', ['todos']),
    author_id: column<string>('author_id', ['todos']),
    modified_at: column<Date>('modified_at', ['todos']),
  },
);
