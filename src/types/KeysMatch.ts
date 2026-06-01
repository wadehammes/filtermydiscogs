export type KeysMatch<T1, T2> = keyof T1 extends keyof T2
  ? keyof T2 extends keyof T1
    ? undefined
    : never
  : never;
