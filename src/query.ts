export type Tablish<T> = {
  columns: Columns<T>;
};
export type Table<T> = Tablish<T> & {
  name: string;
};
const columnSym = Symbol();
export type Column<T = unknown> = {
  [columnSym]: true;
  $inferType?: T;
};
export function column<T>(): Column<T> {
  return {
    [columnSym]: true,
  };
}
export type Columns<T> = {
  [p in keyof T]: T[p] extends object ? Columns<T[p]> : Column<T[p]>;
};
type UnwrapColumns<T extends Columns<unknown>> = {
  [p in keyof T]: T[p] extends Column<infer R>
    ? R
    : T[p] extends object
    ? UnwrapColumns<T[p]>
    : never;
};

export type JoinType = "inner" | "left";
export type Join<TLeft, TRight> = {
  left: Tablish<TLeft>;
  right: Tablish<TRight>;
  on: Predicate;
  joinType: JoinType;
};

export type Term = Column;

export const andProp = Symbol();
export type And = {
  type: typeof andProp;
  predicates: Predicate[];
};
export function And(predicates: Predicate[]): And {
  return {
    type: andProp,
    predicates,
  };
}

export const orProp = Symbol();
export type Or = {
  type: typeof orProp;
  predicates: Predicate[];
};
export function Or(predicates: Predicate[]): Or {
  return {
    type: orProp,
    predicates,
  };
}

export const eqProp = Symbol();
export type Eq<TTermLeft extends Term, TTermRight extends Term> = {
  type: typeof eqProp;
  left: TTermLeft;
  right: TTermRight;
};
export function Eq<TTermLeft extends Term, TTermRight extends Term>(
  left: TTermLeft,
  right: TTermRight
): Eq<TTermLeft, TTermRight> {
  return {
    type: eqProp,
    left,
    right,
  };
}

export type Predicate = And | Or | Eq<Term, Term>;

export function from<T>(tablish: Tablish<T>) {
  return createQuery(tablish, tablish.columns, {}, And([]));
}

export type Query<
  T,
  TSelected,
  TJoins extends {
    [p: string]: Join<T, unknown>;
  }
> = Tablish<TSelected> & {
  from: Tablish<T>;
  select<TNextColumns extends Columns<unknown>>(
    mapper: (x: Columns<TSelected>) => TNextColumns
  ): Query<T, UnwrapColumns<TNextColumns>, TJoins>;
  joins: TJoins;
  predicate: Predicate;
  where(predicate2: Predicate): Query<T, TSelected, TJoins>;
  join<TName extends string, TRight>(
    name: TName,
    right: Tablish<TRight>,
    on: (left: Columns<T>, right: Columns<TRight>) => Predicate,
    joinType: JoinType
  ): Query<
    T,
    TSelected & {
      [p in TName]: TRight;
    },
    TJoins & {
      [P in TName]: Join<T, TRight>;
    }
  >;
  innerJoin<TName extends string, TRight>(
    name: TName,
    right: Tablish<TRight>,
    on: (left: Columns<T>, right: Columns<TRight>) => Predicate
  ): Query<
    T,
    TSelected & {
      [p in TName]: TRight;
    },
    TJoins & {
      [P in TName]: Join<T, TRight>;
    }
  >;
  leftJoin<TName extends string, TRight>(
    name: TName,
    right: Tablish<TRight>,
    on: (left: Columns<T>, right: Columns<TRight>) => Predicate
  ): Query<
    T,
    TSelected & {
      [p in TName]: TRight;
    },
    TJoins & {
      [P in TName]: Join<T, TRight>;
    }
  >;
};

export function createQuery<
  T,
  TSelected,
  TJoins extends {
    [p: string]: Join<T, unknown>;
  }
>(
  from: Tablish<T>,
  columns: Columns<TSelected>,
  joins: TJoins,
  predicate: Predicate
): Query<T, TSelected, TJoins> {
  return {
    from,
    columns,
    select<TNextColumns extends Columns<any>>(
      mapper: (x: Columns<TSelected>) => TNextColumns
    ) {
      return createQuery<T, UnwrapColumns<TNextColumns>, TJoins>(
        from,
        mapper(columns),
        joins,
        predicate
      );
    },
    predicate,
    where(predicate2: Predicate) {
      return createQuery(from, columns, joins, And([predicate, predicate2]));
    },
    joins,
    join<TName extends string, TRight>(
      name: TName,
      right: Tablish<TRight>,
      on: (left: Columns<T>, right: Columns<TRight>) => Predicate,
      joinType: JoinType = "inner"
    ) {
      return createQuery<
        T,
        TSelected & {
          [p in TName]: TRight;
        },
        TJoins & {
          [p in TName]: Join<T, TRight>;
        }
      >(
        from,
        // @ts-expect-error
        {
          ...columns,
          [name]: right.columns,
        },
        {
          ...joins,
          [name]: {
            left: from,
            right,
            on: on(from.columns, right.columns),
            joinType,
          },
        },
        predicate
      );
    },
    innerJoin<TName extends string, TRight>(
      name: TName,
      right: Tablish<TRight>,
      on: (left: Columns<T>, right: Columns<TRight>) => Predicate
    ) {
      return this.join(name, right, on, "inner");
    },
    leftJoin<TName extends string, TRight>(
      name: TName,
      right: Tablish<TRight>,
      on: (left: Columns<T>, right: Columns<TRight>) => Predicate
    ) {
      return this.join(name, right, on, "left");
    },
  };
}

export type AsObject<T> = T extends Query<unknown, infer RSelected, infer _>
  ? {
      [p in keyof RSelected]: ObjectToArray<RSelected[p]>;
    }[]
  : never;

export type ObjectToArray<T> = T extends object ? T[] : T;
