import { faker } from "@faker-js/faker";
import type { FactoryOverrides } from "src/tests/factories/mergeFactoryAttributes";

export abstract class BaseFactory<
  FactoryType,
  Options extends object,
  FactoryModel = unknown,
  AttributeOverrides = FactoryOverrides<FactoryType>,
> {
  constructor(
    private FactoryModel?: new (typeInstance: FactoryType) => FactoryModel,
  ) {}

  protected generateId() {
    return faker.number.int().toString();
  }

  public abstract build(
    attributes?: AttributeOverrides,
    options?: Options,
  ): FactoryType;

  public buildList(
    quantity: number,
    attributes?: AttributeOverrides,
    options?: Options,
  ) {
    return Array.from({ length: quantity }).map(() => {
      return this.build(attributes, options);
    });
  }

  public buildModel(
    attributes?: AttributeOverrides,
    options?: Options,
  ): FactoryModel {
    if (!this.FactoryModel) {
      throw new Error("Model not existent");
    }
    const factoryTypeInstance = this.build(attributes, options);

    return new this.FactoryModel(factoryTypeInstance);
  }
}
