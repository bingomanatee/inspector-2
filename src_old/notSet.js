const NotSet = Symbol('NOT SET');
export default NotSet;
export const isUnset = (a) => (a === NotSet ? true : !a);
