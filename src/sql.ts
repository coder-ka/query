import {
  andSymbol,
  Column,
  Columns,
  eqSymbol,
  isColumn,
  isPlaceholder,
  isQuery,
  isTable,
  Joins,
  orSymbol,
  Predicate,
  Query,
  Term,
} from "./query";

export type ToSqlOptions = {
  useBackquoteForColumnNames?: boolean;
};

export function toSql<TQuery extends Query<any, any, Joins>>(
  query: TQuery,
  options: ToSqlOptions = {}
): string {
  return `
  SELECT ${sqlSelectedColumns(query.columns, options).join(",")}
  FROM ${
    isTable(query.from)
      ? query.from.name
      : isQuery(query.from)
      ? `(${toSql(query.from, options)})${
          query.from.alias === null ? "" : ` as ${query.from.alias}`
        }`
      : ("" as never)
  }
  ${Object.keys(query.joins)
    .map((joinName) => {
      const join = query.joins[joinName as keyof typeof query.joins];
      return `${join.joinType.toUpperCase()} JOIN ${
        isTable(join.right)
          ? `${join.right.name} as ${joinName}`
          : isQuery(join.right)
          ? `(${toSql(join.right, options)}) as ${joinName}`
          : ("" as never)
      } ON ${toSqlPredicate(join.on, options)}`;
    })
    .join("\n")} ${toSqlWhere(query.predicate, options)}${
    query.sort.length === 0
      ? ""
      : ` ORDER BY ${query.sort
          .map(
            (x) =>
              `${columnRef(x.column, options)}${
                x.order === undefined ? "" : ` ${x.order}`
              }`
          )
          .join(",")}`
  }${query.limitCount === null ? "" : ` LIMIT ${query.limitCount}`}`;
}

function sqlSelectedColumns<T>(
  columns: Columns<T>,
  options: ToSqlOptions,
  parentName?: string
): string[] {
  return Object.keys(columns).flatMap((alias) => {
    const x = columns[alias as keyof typeof columns] as unknown;
    if (isColumn(x)) {
      return [
        `${columnRef(x, options)} as '${
          parentName === undefined ? "" : `${parentName}.`
        }${alias}'`,
      ];
    } else {
      return sqlSelectedColumns(
        x as Columns<unknown>,
        options,
        parentName === undefined ? alias : `${parentName}.${alias}`
      );
    }
  });
}

function toSqlWhere(predicate: Predicate, options: ToSqlOptions): string {
  const predicateSql = toSqlPredicate(predicate, options);
  return predicateSql === "" ? "" : `WHERE ${predicateSql}`;
}

function toSqlPredicate(predicate: Predicate, options: ToSqlOptions): string {
  if (predicate.type === andSymbol) {
    const conditions = predicate.predicates
      .map((x) => toSqlPredicate(x, options))
      .filter((x) => x !== "");
    return conditions.length === 0 ? "" : `(${conditions.join(" AND ")})`;
  } else if (predicate.type === orSymbol) {
    const conditions = predicate.predicates
      .map((x) => toSqlPredicate(x, options))
      .filter((x) => x !== "");
    return conditions.length === 0 ? "" : `(${conditions.join(" OR ")})`;
  } else if (predicate.type === eqSymbol) {
    return `${toSqlTerm(predicate.left, options)} = ${toSqlTerm(
      predicate.right,
      options
    )}`;
  }
  return "";
}

function toSqlTerm(term: Term, options: ToSqlOptions): string {
  if (isColumn(term)) {
    return columnRef(term, options);
  } else if (isPlaceholder(term)) {
    return "?";
  }
  {
    return "" as never;
  }
}

function columnRef<T>(column: Column<T>, options: ToSqlOptions): string {
  const quote = options.useBackquoteForColumnNames ? "`" : '"';
  return `${column.context[0]}.${quote}${column.context
    .slice(1)
    .map((x) => `${x}.`)
    .join("")}${column.name}${quote}`;
}
