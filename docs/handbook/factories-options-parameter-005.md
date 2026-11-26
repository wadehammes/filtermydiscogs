## Options parameter

Use **`options`** for **build-time knobs** that are not part of the domain type—counts, pagination, etc.:

| Factory                   | Options                                                        | Purpose                                     |
| ------------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| `releaseFactory`          | `artistCount`, `labelCount`, `formatCount`, `styleCount`       | Passed through to `basicInformationFactory` |
| `basicInformationFactory` | same                                                           | Control nested list sizes                   |
| `collectionFactory`       | `releaseCount`, `page`, `totalPages`, `totalItems`, `username` | Pagination and page size                    |
| `crateFactory`            | `userId`, `isDefault`                                          | User scoping / default crate                |

