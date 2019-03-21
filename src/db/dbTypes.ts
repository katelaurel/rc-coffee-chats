export type sqliteDataTypes = 'TEXT' | 'INTEGER';

// type defaultFieldProp<t> = `DEFAULT ${t}`;
// type optionalFieldProps = 'PRIMARY KEY' | 'NOT NULL'
// type mapModifierToString = Record<>
// type fieldModifiers = 'PRIMARY KEY' | 'NOT NULL' | 'UNIQUE' | 'DEFAULT';

export interface IFieldProps {
  type: sqliteDataTypes;
  // SQL related vals
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isNotNull?: boolean;
  defaultValue?: string;

  // TODO: think about this?
  validatorFn?: (val: string) => boolean; // Can be used to create checks,
  // QUESTION: can you run the validatorFn in reverse, to get the set of values that
  // are acceptable --> to put in as a Check?
  // Validator for user interface:
  // 1) whether it can be updated or not
  // 2) validator for each column
}

export type fields = Record<any, IFieldProps>;

// ======= Table Relationships ====
export interface ItableRelation<
  F extends keyof fields,
  R extends keyof fields
> {
  fk: F;
  tableName: string;
  ref: R;
}