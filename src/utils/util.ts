
// some utils i often copy paste between minor projects.

export type ControllablePromise<T = any, E = any> = {
  error: (err: E) => E;
  resolve: (r: T) => T;
  promise: Promise<T>;
};

export function controllablePromise<T = any, E = any>(): ControllablePromise<T, E> {
  let r, e, p;
  p = new Promise((_r, _e) => {
    (r = _r), (e = _e);
  });
  return { error: e, resolve: r, promise: p };
}

export function promisify<T extends (...args: any) => any>(fn:T) {
  return  (...args: Parameters<T> ):Promise<ReturnType<T>> =>  Promise.resolve(fn(args));
}

export function tryIgnore<T = any | void>(fn: () => T) {
  try {
    return fn();
  } catch (_e) {}
}

export function minMax(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function pick<T extends {} = any>(object: T, fieldNames: (keyof T)[]) {
  if (!object) return {};
  var tmp: Partial<Pick<T, keyof T>> = {};
  for (var key of fieldNames) {
    tmp[key] = object[key];
  }
  return tmp;
}




/**
 *Uppercases first litter and lowercases all other letters
 */
export function titleCase<T extends string = string>(string:T): Capitalize<Lowercase<T>> {
  return string[0].toUpperCase() + string.slice(1).toLowerCase() as any;
}


export function isType<T>(o:any, asserter:(o:T) => boolean): o is T {
  return o && asserter(o);
}
