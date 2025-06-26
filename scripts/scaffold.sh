#!/bin/bash

# generate boilerplate component content
create_component_file() {
  touch "$component_name.component.tsx"
  {
    echo 'import React from "react";'
    echo 'import styles from "./'$component_name'.module.css";'
    echo
    echo "interface ${component_name}Props {"
    echo "  myProperty: string;"
    echo "};"
    echo
    echo "export const ${component_name} = ({ children, myProperty }: ${component_name}Props) => ("
    echo "  <div className={styles.wrapper} data-testid=\"rh${component_name}\">"
    echo "    {children}"
    echo "  </div>"
    echo ");"
    echo
    echo "export default ${component_name};"
  }  >> "$component_name.component.tsx"
}

# Generate interfaces file
create_interfaces_file() {
  touch "$component_name.interfaces.ts"
  {
    echo 'import { EntryId } from "src/interfaces/common.interfaces";'
    echo
    echo "export interface ${component_name}Type {"
    echo "  id: EntryId;"
    echo "}"
  }  >> "$component_name.interfaces.ts"
}

# Generate normalizer file
create_normalizer_file() {
  touch "$component_name.normalizer.ts"
  {
    echo 'import { Entry } from "src/interfaces/common.interfaces";'
    echo "import { ${component_name}Type } from \"src/components/${component_name}/${component_name}.interfaces\";"
    echo
    echo "export const normalized${component_name} = (entry: Entry): ${component_name}Type => ({"
    echo "  id: entry.id,"
    echo "  ...entry.fields,"
    echo "});"
  }  >> "$component_name.normalizer.ts"
}


# generate boilerplate spec content
create_spec_file() {
  touch "$component_name.spec.tsx"
  {
    echo "import { ${component_name}PageObject } from \"src/components/${component_name}/${component_name}.po\";"
    echo
    echo "let po: ${component_name}PageObject;"
    echo
    echo "describe(\"${component_name}\", () => {"
    echo "  beforeEach(() => {"
    echo "    po = new ${component_name}PageObject();"
    echo "  });"
    echo
    echo "  it(\"renders ${component_name}\", async () => {"
    echo "    po.render${component_name}();"
    echo
    echo '    # Try expecting without waitFor; import it if you need it '
    echo "    expect(po.get${component_name}).toBeInTheDocument();"
    echo '  });'
    echo "});"
  } >> "$component_name.spec.tsx"
}

create_factory_file() {
  touch "$component_name.factory.ts"
  {
    echo 'import { Factory } from "rosie";'
    echo "import { ${component_name}Type } from \"src/components/${component_name}/${component_name}.interfaces\"";
    echo
    echo "export const ${component_name}Factory = Factory.define<${component_name}Type>("
    echo "  \"${component_name}Type\""
    echo ").attrs({});"
  } >> "$component_name.factory.ts"
}

create_css_module_file() {
  touch "$component_name.module.css"
  {
    echo ".wrapper {"
    echo "  /* Add your styles here */"
    echo "}"
  } >> "$component_name.module.css"
}

create_page_object_file() {
  touch "$component_name.po.tsx"
  {
    echo "import {"
    echo "  BasePageObject,"
    echo "  BasePageObjectProps,"
    echo '} from "src/tests/BasePageObject.po";'
    echo "import { ${component_name} } from \"src/components/${component_name}/${component_name}.component\";"
    echo 'import React from "react";'
    echo 'import { render, screen } from "test-utils";'
    echo
    echo "export class ${component_name}PageObject extends BasePageObject {"
    echo "  public testId: string = \"rh${component_name}\";"
    echo
    echo "  constructor("
    echo "    { debug, raiseOnFind }: BasePageObjectProps = {"
    echo "      debug: false,"
    echo "      raiseOnFind: false,"
    echo "    }"
    echo "  ) {"
    echo "    super({ debug, raiseOnFind });"
    echo
    echo "    jest.resetAllMocks();"
    echo "  }"
    echo
    echo
    echo "  // Actions"
    echo "  render${component_name}() {"
    echo "    render(<${component_name} myProperty=\"hello\" />);"
    echo "  }"
    echo
    echo "  // Getters"
    echo "  get get${component_name}() {"
    echo "    return this.findTestId(this.testId);"
    echo "  }"
    echo
    echo "}"
  } >> "$component_name.po.tsx"
}

# Absolute path this script is in, thus /home/user/bin
script_pwd=$(dirname "$BASH_SOURCE")

component_name=$1

if [ "$component_name" = "" ]; then
  echo "Error: Component name not provided - you must provide a valid app name followed by the name of the component"
  echo "ex: scaffold_component <component_name>"
  exit 1
fi

dir="./src/components/$component_name"

if [ ! -d $dir ]; then
  mkdir "$dir"
  pushd $dir > /dev/null
  create_component_file
  create_css_module_file
  create_interfaces_file
  create_normalizer_file
  create_spec_file
  create_factory_file
  create_page_object_file
  popd > /dev/null
  echo "✨Successfully scaffolded ${component_name}✨"
  echo "Head over to src/components/$component_name to start building"
  echo "Happy hacking 😁"
  exit 0
else
  echo "Error: $component_name already exists. Aborting scaffolding."
  exit 1
fi