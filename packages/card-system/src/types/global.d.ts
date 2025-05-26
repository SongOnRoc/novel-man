import "@testing-library/jest-dom";

// 全局声明 Jest 类型
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeChecked(): R;
    }

    interface Mock<T = unknown, Y extends unknown[] = unknown[]> {
      (...args: Y): T;
      mockImplementation(fn: (...args: Y) => T): this;
      mockReturnValue(value: T): this;
      mockReturnValueOnce(value: T): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): this;
      getMockName(): string;
      mockName(name: string): this;
      mock: {
        calls: Y[];
        instances: T[];
        invocationCallOrder: number[];
        results: Array<{ type: string; value: T }>;
      };
    }

    interface SpyInstance<T = unknown, Y extends unknown[] = unknown[]> {
      (...args: Y): T;
      mockImplementation(fn: (...args: Y) => T): this;
      mockReturnValue(value: T): this;
      mockReturnValueOnce(value: T): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): this;
    }

    function fn<T extends (...args: unknown[]) => unknown>(implementation?: T): Mock<ReturnType<T>, Parameters<T>>;
    function spyOn<T extends object, M extends keyof T>(object: T, method: M): SpyInstance<T[M]>;
    function mock(moduleName: string, factory?: unknown): void;
    function clearAllMocks(): void;
    function restoreAllMocks(): void;
  }

  // 全局声明测试函数
  function describe(name: string, fn: () => void): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function test(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  function expect<T>(actual: T): jest.Matchers<void>;
}
