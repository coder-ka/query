export type Scalar = string | boolean | number | bigint | Date | Buffer;
export function isScalar(x: unknown): x is Scalar {
  return (
    typeof x === "string" ||
    typeof x === "boolean" ||
    typeof x === "number" ||
    typeof x === "bigint" ||
    x instanceof Date ||
    x instanceof Buffer
  );
}

export type Term = Column | Placeholder;
const placholderSymbol = Symbol("placeholder");
export function isPlaceholder(x: unknown): x is Placeholder {
  return typeof x === "object" && x !== null && placholderSymbol in x;
}
export type Placeholder = {
  [placholderSymbol]: true;
  value: Scalar;
};

export type Tablish<T> = {
  alias: string | null;
  columns: Columns<T>;
  as(alias: string): Tablish<T>;
};
const tableSymbol = Symbol("table");
export type Table<T> = Tablish<T> & {
  [tableSymbol]: true;
  name: string;
};
export function table<T>(
  name: string,
  columns: Columns<T>,
  alias: string | null = null
): Table<T> {
  return {
    [tableSymbol]: true,
    name,
    alias,
    as(alias) {
      return table(name, columns, alias);
    },
    columns,
  };
}
export function isTable<T>(x: unknown): x is Table<T> {
  return typeof x === "object" && x !== null && tableSymbol in x;
}
const columnSymbol = Symbol("column");
export type Column<T = unknown> = {
  [columnSymbol]: true;
  name: string;
  context: string[];
  $inferType?: T;
};
export function column<T>(name: string, context: string[]): Column<T> {
  return {
    [columnSymbol]: true,
    context,
    name,
  };
}
export function isColumn<T>(x: unknown): x is Column<T> {
  return typeof x === "object" && x !== null && columnSymbol in x;
}
export type Columns<T> = {
  [p in keyof T]: T[p] extends Scalar
    ? Column<T[p]>
    : T[p] extends object
    ? Columns<T[p]>
    : Column<T[p]>;
};
type UnwrapColumns<T extends Columns<unknown>> = {
  [p in keyof T]: T[p] extends Column<infer R>
    ? R
    : T[p] extends object
    ? UnwrapColumns<T[p]>
    : never;
};

export type JoinType = "inner" | "left";
export type Joins<TName extends string = string, T1 = unknown, T2 = unknown> = {
  [p in TName]: Join<T1, T2>;
};
export type Join<TLeft, TRight> = {
  left: Tablish<TLeft>;
  right: Tablish<TRight>;
  rightAliased: Tablish<TRight>;
  on: Predicate;
  joinType: JoinType;
};

export const andSymbol = Symbol("and");
export type And = {
  type: typeof andSymbol;
  predicates: Predicate[];
};
export function and(predicates: Predicate[]): And {
  return {
    type: andSymbol,
    predicates,
  };
}

export const orSymbol = Symbol("or");
export type Or = {
  type: typeof orSymbol;
  predicates: Predicate[];
};
export function or(predicates: Predicate[]): Or {
  return {
    type: orSymbol,
    predicates,
  };
}

export const eqSymbol = Symbol("eq");
export type Eq<TTermLeft extends Term, TTermRight extends Term> = {
  type: typeof eqSymbol;
  left: TTermLeft;
  right: TTermRight;
};
export function eq<TTermLeft extends Term, TTermRight extends Term>(
  left: TTermLeft,
  right: TTermRight
): Eq<TTermLeft, TTermRight> {
  return {
    type: eqSymbol,
    left,
    right,
  };
}

export type Predicate = And | Or | Eq<Term, Term>;

export function from<T>(tablish: Tablish<T>) {
  return createQuery(tablish, tablish.columns, {}, and([]));
}

type SortItem = { column: Column; order?: "ASC" | "DESC" };

const querySymbol = Symbol();
export type Query<
  TFrom,
  TSelected,
  TJoins extends Joins<string, TFrom, unknown>
> = Tablish<TSelected> & {
  [querySymbol]: true;
  params: Scalar[];
  from: Tablish<TFrom>;
  as(name: string): Query<TFrom, TSelected, TJoins>;
  select<TNextColumns extends Columns<unknown>>(
    mapper: (x: Columns<TSelected>) => TNextColumns
  ): Query<TFrom, UnwrapColumns<TNextColumns>, TJoins>;
  joins: TJoins;
  predicate: Predicate;
  where(
    predicateFn: (
      x: AllColumns<TFrom, TJoins>,
      p: (x: Scalar) => Placeholder
    ) => Predicate
  ): Query<TFrom, TSelected, TJoins>;
  join<TName extends string, TRight>(
    name: TName,
    right: Tablish<TRight>,
    on: (left: AllColumns<TFrom, TJoins>, right: Columns<TRight>) => Predicate,
    joinType: JoinType
  ): Query<
    TFrom,
    TSelected & {
      [p in TName]: TRight;
    },
    TJoins & Joins<TName, TFrom, TRight>
  >;
  innerJoin<TName extends string, TRight>(
    name: TName,
    right: Tablish<TRight>,
    on: (left: Columns<TFrom>, right: Columns<TRight>) => Predicate
  ): Query<
    TFrom,
    TSelected & {
      [p in TName]: TRight;
    },
    TJoins & Joins<TName, TFrom, TRight>
  >;
  leftJoin<TName extends string, TRight>(
    name: TName,
    right: Tablish<TRight>,
    on: (left: Columns<TFrom>, right: Columns<TRight>) => Predicate
  ): Query<
    TFrom,
    TSelected & {
      [p in TName]: TRight;
    },
    TJoins & Joins<TName, TFrom, TRight>
  >;
  limitCount: number | null;
  limit(count: number): Query<TFrom, TSelected, TJoins>;
  sort: { column: Column; order?: "ASC" | "DESC" }[];
  orderBy(
    createSort: (x: AllColumns<TFrom, TJoins>) => SortItem[]
  ): Query<TFrom, TSelected, TJoins>;
};

export function createQuery<
  TFrom,
  TSelected,
  TJoins extends Joins<string, TFrom, unknown>
>(
  from: Tablish<TFrom>,
  columns: Columns<TSelected>,
  joins: TJoins,
  predicate: Predicate,
  alias: string | null = null,
  limitCount: number | null = null,
  sort: SortItem[] = [],
  params: Scalar[] = []
): Query<TFrom, TSelected, TJoins> {
  return {
    [querySymbol]: true,
    params,
    from,
    columns,
    alias,
    as(alias: string) {
      return createQuery(
        from,
        columns,
        joins,
        predicate,
        alias,
        limitCount,
        sort,
        params
      );
    },
    select<TNextColumns extends Columns<any>>(
      mapper: (x: Columns<TSelected>) => TNextColumns
    ) {
      return createQuery<TFrom, UnwrapColumns<TNextColumns>, TJoins>(
        from,
        mapper(columns),
        joins,
        predicate,
        alias,
        limitCount,
        sort,
        params
      );
    },
    predicate,
    where(predicateFn) {
      const params: Scalar[] = [];
      function placeholder(value: Scalar): Placeholder {
        params.push(value);
        return {
          [placholderSymbol]: true,
          value,
        };
      }

      const nextPredicate = and([
        predicate,
        predicateFn(allColumns(from, joins), placeholder),
      ]);

      return createQuery(
        from,
        columns,
        joins,
        nextPredicate,
        alias,
        limitCount,
        sort,
        params
      );
    },
    joins,
    join<TName extends string, TRight>(
      name: TName,
      right: Tablish<TRight>,
      on: (
        left: AllColumns<TFrom, TJoins>,
        right: Columns<TRight>
      ) => Predicate,
      joinType: JoinType = "inner"
    ) {
      function setColumnContext<T>(
        columns: Columns<T>,
        context: string[]
      ): Columns<T> {
        return Object.keys(columns).reduce((acc, key) => {
          const x = columns[key as keyof typeof columns];
          if (x === undefined) return acc;

          if (isColumn(x)) {
            return {
              ...acc,
              [key]: column(x.name, context),
            };
          } else {
            return {
              ...acc,
              [key]: setColumnContext(
                x as Columns<unknown>,
                context.concat([key])
              ),
            };
          }
        }, {} as Columns<T>);
      }

      const rightAliased = {
        ...right,
        alias: name,
        columns: setColumnContext(right.columns, [name]),
      };

      return createQuery<
        TFrom,
        TSelected & {
          [p in TName]: TRight;
        },
        TJoins & Joins<TName, TFrom, TRight>
      >(
        from,
        // @ts-expect-error
        {
          ...columns,
          [name]: rightAliased.columns,
        },
        {
          ...joins,
          [name]: {
            left: from,
            right,
            rightAliased,
            on: on(allColumns(from, joins), rightAliased.columns),
            joinType,
          },
        },
        predicate,
        alias,
        limitCount,
        sort,
        params
      );
    },
    innerJoin<TName extends string, TRight>(
      name: TName,
      right: Tablish<TRight>,
      on: (left: Columns<TFrom>, right: Columns<TRight>) => Predicate
    ) {
      return this.join(name, right, on, "inner");
    },
    leftJoin<TName extends string, TRight>(
      name: TName,
      right: Tablish<TRight>,
      on: (left: Columns<TFrom>, right: Columns<TRight>) => Predicate
    ) {
      return this.join(name, right, on, "left");
    },
    limitCount,
    limit(count: number) {
      return createQuery(
        from,
        columns,
        joins,
        predicate,
        alias,
        count,
        sort,
        params
      );
    },
    sort,
    orderBy(createSort: (x: AllColumns<TFrom, TJoins>) => SortItem[]) {
      return createQuery(
        from,
        columns,
        joins,
        predicate,
        alias,
        limitCount,
        createSort(allColumns(from, joins)),
        params
      );
    },
  };
}

type AllColumns<TFrom, TJoins extends Joins<string, TFrom, unknown>> = Columns<
  JoinedColumns<TJoins> & TFrom
>;

function allColumns<TFrom, TJoins extends Joins<string, TFrom, unknown>>(
  from: Tablish<TFrom>,
  joins: TJoins
): AllColumns<TFrom, TJoins> {
  return {
    ...from.columns,
    ...joinedColumns(joins),
  };
}

type JoinedColumns<TJoins extends Joins<string, unknown, unknown>> = {
  [p in keyof TJoins]: TJoins[p] extends Join<unknown, infer TRight>
    ? TRight extends Query<unknown, infer RSelected, infer _>
      ? RSelected
      : TRight extends Tablish<infer R>
      ? R
      : never
    : never;
};

function joinedColumns<TJoins extends Joins<string, unknown, unknown>>(
  joins: TJoins
): JoinedColumns<TJoins> {
  return Object.keys(joins).reduce((acc, key) => {
    const join = joins[key as keyof typeof joins];

    if (join === undefined) return acc;

    return {
      ...acc,
      [key]: join.rightAliased.columns,
    };
  }, {} as JoinedColumns<TJoins>);
}

export function isQuery<
  TQuery extends Query<unknown, unknown, Joins<string, unknown, unknown>>
>(x: unknown): x is TQuery {
  return typeof x === "object" && x !== null && querySymbol in x;
}
export type AsObject<TQuery> = TQuery extends Query<any, infer RSelected, any>
  ? RSelected
  : never;

export type AsRow<TQuery> = TQuery extends Query<any, any, any>
  ? FlattenObject<AsObject<TQuery>, Scalar>
  : never;

export function asObject<TQuery extends Query<any, any, any>>(
  query: TQuery,
  row: AsRow<TQuery>
): AsObject<TQuery> {
  function mapColumnToObject<T>(
    columns: Columns<T>,
    row: AsRow<TQuery>,
    parent: string = ""
  ): T {
    return Object.keys(columns).reduce((acc, key) => {
      const x = columns[key as keyof typeof columns];
      if (x === undefined) return acc;

      if (isColumn(x)) {
        return {
          ...acc,
          // @ts-ignore
          [key]: row[`${parent}${key}`],
        };
      } else {
        return {
          ...acc,
          [key]: mapColumnToObject(
            x as Columns<unknown>,
            row,
            `${parent}${key}.`
          ),
        };
      }
    }, {} as T);
  }

  return mapColumnToObject(query.columns, row) as AsObject<TQuery>;
}

export type FlattenObject<
  T extends object,
  Scalar,
  Parent extends string | number = ""
> = {
  [p in keyof T]-?: p extends string | number
    ? Exclude<Exclude<T[p], undefined>, null> extends Scalar
      ? Record<`${Parent}${p}`, T[p]>
      : T[p] extends object
      ? FlattenObject<T[p], Scalar, `${Parent}${p}.`>
      : never
    : never;
}[keyof T];
