import { faker } from "@faker-js/faker";

export abstract class BaseFactory<
  FactoryType,
  Options extends object,
  FactoryModel = unknown,
> {
  constructor(
    private FactoryModel?: new (typeInstance: FactoryType) => FactoryModel,
  ) {}

  protected generateId() {
    return faker.number.int().toString();
  }

  public buildList(
    quantity: number,
    attributes?: Partial<FactoryType>,
    options?: Options,
  ) {
    return Array.from({ length: quantity }).map(() => {
      return this.build(attributes ?? {}, options);
    });
  }

  public abstract build(
    attributes?: Partial<FactoryType>,
    options?: Options,
  ): FactoryType;

  buildModel(
    attributes?: Partial<FactoryType>,
    options?: Options,
  ): FactoryModel {
    if (!this.FactoryModel) {
      throw new Error("Model not existent");
    }
    const factoryTypeInstance = this.build(attributes, options);

    return new this.FactoryModel(factoryTypeInstance);
  }

  buildListModel(
    quantity: number,
    attributes?: Partial<FactoryType>,
    options?: Options,
  ): FactoryModel[] {
    if (!this.FactoryModel) {
      throw new Error("Model not existent");
    }

    return Array.from({ length: quantity }).map(() => {
      return this.buildModel(attributes ?? {}, options);
    });
  }
}
