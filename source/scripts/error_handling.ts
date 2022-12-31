function throwMessage(message: string): never {
  throw new Error(message);
}

function throwIfEqual<T extends boolean | number | string | null | undefined>(left: T, right: T, message?: string) {
  if (left === right) {
    throw new Error(message || `Values must not be equal: ${left}`);
  }
}

function throwIfNotEqual<T extends boolean | number | string | null | undefined>(left: T, right: T, message?: string) {
  if (left !== right) {
    throw new Error(message || `Values must be equal: ${right} and ${left}`);
  }
}

function throwIfUndefined<T>(val: T, message?: string): asserts val is T extends undefined ? never : T{
  if (val === undefined) {
    throw new Error(message || "Value cannot be undefined");
  }
}

function throwIfNull<T>(val: T, message?: string): asserts val is NonNullable<T> {
  if (val === null || val === undefined) {
    throw new Error(message || "Value cannot be null or undefined");
  }
}

function throwIfNotNull<T>(val: T | null | undefined, message?: string): asserts val is null | undefined {
  if (val !== null || val === undefined) {
    throw new Error(message || "Value must be null or undefined");
  }
}

function throwIfTrue(val: boolean, message?: string): asserts val is false {
  if (val) {
    throw new Error(message || "Value cannot be true");
  }
}

function throwIfFalse(val: boolean, message?: string): asserts val is true {
  if (!val) {
    throw new Error(message || "Value cannot be false");
  }
}

function throwIfEmpty<T,U>(container: Array<T> | Set<T> | Map<T, U>, message?: string): void {
  if (container instanceof Array && container.length === 0) {
    throw new Error(message || "Array is empty");
  } else if (container instanceof Set && container.size === 0) {
    throw new Error(message || "Set is empty");
  } else if (container instanceof Map && container.size === 0) {
    throw new Error(message || "Map is empty");
  }
}

function throwIfNotEmpty<T,U>(container: Array<T> | Set<T> | Map<T, U>,  message?: string) {
  if (container instanceof Array && container.length > 0) {
    throw new Error(message ||"Array is not empty");
  } else if (container instanceof Set && container.size > 0) {
    throw new Error(message || "Set is not empty");
  } else if (container instanceof Map && container.size > 0) {
    throw new Error(message || "Map is not empty");
  }
}

function throwIfNotType<T>(val: any, type: { new(...args: any[]): T }): asserts val is T {
  if (!(val instanceof type)) {
    throw new Error(`Value must be an instance of ${type.name}`);
  }
}
