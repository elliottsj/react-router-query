type CPSErrorCallback = (error: Error, result: void) => void;
type CPSResultCallback<T> = (error: null, result: T) => void;
declare type CPSCallback<T> =
  CPSErrorCallback &
  CPSResultCallback<T>;
declare type CPSFunction0<T> = (callback: CPSCallback<T>) => void;
declare type CPSFunction1<A, T> = (arg0: A, callback: CPSCallback<T>) => void;
declare type CPSFunction2<A, B, T> = (arg0: A, arg1: B, callback: CPSCallback<T>) => void;
