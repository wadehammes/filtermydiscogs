/**
 * Mock Prisma Client for testing
 * Use this to mock Prisma operations in tests
 */

export const createMockPrisma = () => {
  const mockCrate = {
    user_id: 123456,
    id: "crate-1",
    name: "Test Crate",
    username: null,
    is_default: true,
    private: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockCrateRelease = {
    user_id: 123456,
    crate_id: "crate-1",
    instance_id: "12345",
    release_data: {
      instance_id: "12345",
      basic_information: {
        title: "Test Release",
        artists: [{ name: "Test Artist" }],
      },
    },
    added_at: new Date(),
  };

  return {
    crate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    crateRelease: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
    mockCrate,
    mockCrateRelease,
  };
};

export type MockPrisma = ReturnType<typeof createMockPrisma>;
