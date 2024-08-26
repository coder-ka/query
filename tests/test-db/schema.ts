import { column, table } from "../../src/main";

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  modified_at: Date;
};
export const User = table("User", null, {
  id: column<string>("id", ["User"]),
  first_name: column<string>("first_name", ["User"]),
  last_name: column<string>("last_name", ["User"]),
  age: column<number>("age", ["User"]),
  modified_at: column<Date>("modified_at", ["User"]),
});

export type Todo = {
  id: string;
  title: string;
  author_id: string;
  modified_at: Date;
};
export const Todo = table("Todo", null, {
  id: column<string>("id", ["Todo"]),
  title: column<string>("title", ["Todo"]),
  author_id: column<string>("author_id", ["Todo"]),
  modified_at: column<Date>("modified_at", ["Todo"]),
});
