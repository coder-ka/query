// ^-^v
  import { column, table } from "../../src/main";
  
  export type PrismaString = string;
  export type PrismaBoolean = boolean;
  export type PrismaInt = number;
  export type PrismaBigInt = bigint;
  export type PrismaFloat = number;
  export type PrismaDecimal = string;
  export type PrismaDateTime = Date;
  export type PrismaJson = string;
  export type PrismaBytes = Buffer;
  
  export type User = {
    id: PrismaString;
    first_name: PrismaString;
    last_name: PrismaString;
    age: PrismaInt;
    modified_at: PrismaDateTime;
  };
  export const User = table(
    "User",
    null,
    {
      id: column<PrismaString>('id', ['User']),
      first_name: column<PrismaString>('first_name', ['User']),
      last_name: column<PrismaString>('last_name', ['User']),
      age: column<PrismaInt>('age', ['User']),
      modified_at: column<PrismaDateTime>('modified_at', ['User']),
    },
  );

  export type Todo = {
    id: PrismaString;
    title: PrismaString;
    author_id: PrismaString;
    modified_at: PrismaDateTime;
  };
  export const Todo = table(
    "Todo",
    null,
    {
      id: column<PrismaString>('id', ['Todo']),
      title: column<PrismaString>('title', ['Todo']),
      author_id: column<PrismaString>('author_id', ['Todo']),
      modified_at: column<PrismaDateTime>('modified_at', ['Todo']),
    },
  );
  