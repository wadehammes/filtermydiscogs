#!/bin/bash

# Scaffold a component folder aligned with docs/handbook/conventions.md (rhythm-marketing patterns).

create_component_file() {
  touch "$component_name.component.tsx"
  {
    echo "import styles from \"./${component_name}.module.css\";"
    echo
    echo "interface ${component_name}Props {"
    echo "  children?: React.ReactNode;"
    echo "}"
    echo
    echo "export const ${component_name} = ({ children }: ${component_name}Props) => ("
    echo "  <div className={styles.wrapper} data-testid=\"fmd${component_name}\">"
    echo "    {children}"
    echo "  </div>"
    echo ");"
    echo
    echo "export default ${component_name};"
  } >> "$component_name.component.tsx"
}

create_css_module_file() {
  touch "$component_name.module.css"
  {
    echo ".wrapper {"
    echo "  display: flex;"
    echo "  flex-direction: column;"
    echo "  gap: var(--spacing-2, 0.5rem);"
    echo "}"
  } >> "$component_name.module.css"
}

create_spec_file() {
  touch "$component_name.spec.tsx"
  {
    echo "import { describe, expect, it, beforeEach } from \"@jest/globals\";"
    echo "import { screen } from \"test-utils\";"
    echo "import { ${component_name}PageObject } from \"./${component_name}.po\";"
    echo
    echo "let po: ${component_name}PageObject;"
    echo
    echo "describe(\"${component_name}\", () => {"
    echo "  beforeEach(() => {"
    echo "    po = new ${component_name}PageObject();"
    echo "  });"
    echo
    echo "  it(\"renders ${component_name}\", () => {"
    echo "    po.render${component_name}();"
    echo
    echo "    expect(screen.getByTestId(po.testId)).toBeInTheDocument();"
    echo "  });"
    echo "});"
  } >> "$component_name.spec.tsx"
}

create_page_object_file() {
  touch "$component_name.po.tsx"
  {
    echo "import type { RenderResult } from \"@testing-library/react\";"
    echo "import {"
    echo "  BasePageObject,"
    echo "  type BasePageObjectProps,"
    echo "} from \"src/tests/basePageObject.po\";"
    echo "import { render } from \"test-utils\";"
    echo "import { ${component_name} } from \"./${component_name}.component\";"
    echo
    echo "export type ${component_name}RenderProps = {"
    echo "  children?: React.ReactNode;"
    echo "};"
    echo
    echo "export class ${component_name}PageObject extends BasePageObject {"
    echo "  public testId = \"fmd${component_name}\";"
    echo
    echo "  constructor(props: BasePageObjectProps = {}) {"
    echo "    super(props);"
    echo "    jest.clearAllMocks();"
    echo "  }"
    echo
    echo "  private ${component_name}Element(overrides: ${component_name}RenderProps = {}) {"
    echo "    return <${component_name} {...overrides} />;"
    echo "  }"
    echo
    echo "  render${component_name}(overrides: ${component_name}RenderProps = {}): RenderResult {"
    echo "    return render(this.${component_name}Element(overrides));"
    echo "  }"
    echo
    echo "  rerender${component_name}("
    echo "    rerender: RenderResult[\"rerender\"],"
    echo "    overrides: ${component_name}RenderProps = {},"
    echo "  ): void {"
    echo "    rerender(this.${component_name}Element(overrides));"
    echo "  }"
    echo "}"
  } >> "$component_name.po.tsx"
}

component_name=$1

if [ "$component_name" = "" ]; then
  echo "Error: Component name not provided."
  echo "Usage: pnpm scaffold <ComponentName>"
  exit 1
fi

dir="./src/components/$component_name"

if [ ! -d "$dir" ]; then
  mkdir "$dir"
  pushd "$dir" > /dev/null
  create_component_file
  create_css_module_file
  create_spec_file
  create_page_object_file
  popd > /dev/null
  echo "Scaffolded ${component_name} under src/components/${component_name}"
  echo "See docs/handbook/conventions.md for test IDs, PO rules, and factories."
  exit 0
else
  echo "Error: $component_name already exists. Aborting scaffolding."
  exit 1
fi
