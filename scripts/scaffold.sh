#!/bin/bash

factory_export_name() {
  local name="$1"
  local first rest
  first=$(printf '%s' "${name:0:1}" | tr '[:upper:]' '[:lower:]')
  rest="${name:1}"
  echo "${first}${rest}Factory"
}

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

create_interfaces_file() {
  touch "$component_name.interfaces.ts"
  {
    echo "export interface ${component_name}Type {"
    echo "  id: string;"
    echo "}"
  } >> "$component_name.interfaces.ts"
}

create_spec_file() {
  touch "$component_name.spec.tsx"
  {
    echo "import { beforeEach, describe, expect, it } from \"@jest/globals\";"
    echo "import { ${component_name}PageObject } from \"src/components/${component_name}/${component_name}.po\";"
    echo "import { screen } from \"test-utils\";"
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

create_factory_file() {
  local factory_name factory_path
  factory_name=$(factory_export_name "$component_name")
  factory_path="$repo_root/src/tests/factories/${component_name}.factory.ts"
  touch "$factory_path"
  {
    echo "import { faker } from \"@faker-js/faker\";"
    echo "import type { ${component_name}Type } from \"src/components/${component_name}/${component_name}.interfaces\";"
    echo "import { BaseFactory } from \"src/tests/factories/BaseFactory\";"
    echo "import type { KeysMatch } from \"src/types/KeysMatch\";"
    echo
    echo "type ${component_name}FactoryOptions = Record<string, never>;"
    echo
    echo "class ${component_name}Factory extends BaseFactory<"
    echo "  ${component_name}Type,"
    echo "  ${component_name}FactoryOptions"
    echo "> {"
    echo "  build("
    echo "    attributes?: Partial<${component_name}Type>,"
    echo "    _options?: ${component_name}FactoryOptions,"
    echo "  ) {"
    echo "    const instance = {"
    echo "      id: faker.string.uuid(),"
    echo "    } satisfies ${component_name}Type;"
    echo
    echo "    const factoryBuilt: ${component_name}Type = {"
    echo "      ...instance,"
    echo "      ...(attributes ?? {}),"
    echo "    };"
    echo
    echo "    const _allKeysMustBeInTheInstance: KeysMatch<"
    echo "      ${component_name}Type,"
    echo "      typeof instance"
    echo "    > = undefined;"
    echo
    echo "    return factoryBuilt;"
    echo "  }"
    echo "}"
    echo
    echo "export const ${factory_name} = new ${component_name}Factory();"
  } >> "$factory_path"
}

create_page_object_file() {
  touch "$component_name.po.tsx"
  {
    echo "import type { RenderResult } from \"@testing-library/react\";"
    echo "import {"
    echo "  BasePageObject,"
    echo "  type BasePageObjectProps,"
    echo "} from \"src/tests/BasePageObject.po\";"
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
    echo "    jest.resetAllMocks();"
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
repo_root="$(cd "$(dirname "$0")/.." && pwd)"

if [ "$component_name" = "" ]; then
  echo "Error: Component name not provided."
  echo "Usage: pnpm scaffold <ComponentName>"
  exit 1
fi

dir="$repo_root/src/components/$component_name"

if [ ! -d "$dir" ]; then
  mkdir "$dir"
  pushd "$dir" > /dev/null
  create_component_file
  create_css_module_file
  create_interfaces_file
  create_spec_file
  create_page_object_file
  popd > /dev/null
  create_factory_file
  pnpm exec biome format --write "$dir" "$repo_root/src/tests/factories/${component_name}.factory.ts"
  echo "Scaffolded ${component_name} under src/components/${component_name}"
  echo "Factory: src/tests/factories/${component_name}.factory.ts"
  echo "See docs/handbook/conventions.md and docs/handbook/factories.md"
  exit 0
else
  echo "Error: $component_name already exists. Aborting scaffolding."
  exit 1
fi
