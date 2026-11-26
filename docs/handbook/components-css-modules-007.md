## CSS Modules

Import as `import styles from "./Name.module.css"` and reference **`styles.className`**. Use **`classNames`** whenever classes are combined or conditional — static lists, object notation for state, and optional `className` props (see [conventions.md → React / JSX](conventions.md#react--jsx)). Do **not** cast module keys with **`as string`** in object notation. Single unconditional module classes may use `className={styles.block}` directly.

