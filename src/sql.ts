import {
  andSymbol,
  Column,
  Columns,
  eqSymbol,
  isColumn,
  isQuery,
  isTable,
  Joins,
  orSymbol,
  Predicate,
  Query,
  Term,
} from "./query";

export function toSql<TQuery extends Query<any, any, Joins>>(
  query: TQuery
): string {
  return `
  SELECT ${sqlSelectedColumns(query.columns).join(",")}
  FROM ${
    isTable(query.from)
      ? query.from.name
      : isQuery(query.from)
      ? `(${toSql(query.from)})${
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
          ? `(${toSql(join.right)}) as ${joinName}`
          : ("" as never)
      } ON ${toSqlPredicate(join.on)}`;
    })
    .join("\n")} ${toSqlWhere(query.predicate)}${
    query.sort.length === 0
      ? ""
      : ` ORDER BY ${query.sort
          .map(
            (x) =>
              `${columnRef(x.column)}${
                x.order === undefined ? "" : ` ${x.order}`
              }`
          )
          .join(",")}`
  }${query.limitCount === null ? "" : ` LIMIT ${query.limitCount}`}`;
}

function sqlSelectedColumns<T>(
  columns: Columns<T>,
  parentName?: string
): string[] {
  return Object.keys(columns).flatMap((alias) => {
    const x = columns[alias as keyof typeof columns] as unknown;
    if (isColumn(x)) {
      return [
        `${columnRef(x)} as '${
          parentName === undefined ? "" : `${parentName}.`
        }${alias}'`,
      ];
    } else {
      return sqlSelectedColumns(
        x as Columns<unknown>,
        parentName === undefined ? alias : `${parentName}.${alias}`
      );
    }
  });
}

function toSqlWhere(predicate: Predicate): string {
  const predicateSql = toSqlPredicate(predicate);
  return predicateSql === "" ? "" : `WHERE ${predicateSql}`;
}

function toSqlPredicate(predicate: Predicate): string {
  if (predicate.type === andSymbol) {
    const conditions = predicate.predicates
      .map(toSqlPredicate)
      .filter((x) => x !== "");
    return conditions.length === 0 ? "" : `(${conditions.join(" AND ")})`;
  } else if (predicate.type === orSymbol) {
    const conditions = predicate.predicates
      .map(toSqlPredicate)
      .filter((x) => x !== "");
    return conditions.length === 0 ? "" : `(${conditions.join(" OR ")})`;
  } else if (predicate.type === eqSymbol) {
    return `${toSqlTerm(predicate.left)} = ${toSqlTerm(predicate.right)}`;
  }
  return "";
}

function toSqlTerm(term: Term): string {
  if (isColumn(term)) {
    return columnRef(term);
  } else {
    return "" as never;
  }
}

function columnRef<T>(column: Column<T>): string {
  return `${column.context[0]}.\`${column.context
    .slice(1)
    .map((x) => `${x}.`)
    .join("")}${column.name}\``;
}
