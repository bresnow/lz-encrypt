export const checkIfThis = {
	isObject: (value: unknown) => {
		return !!(value && typeof value === 'object' && !Array.isArray(value));
	},
	isNumber: (value: unknown) => {
		return !!isNaN(Number(value));
	},
	isBoolean: (value: unknown) => {
		return value === 'true' || value === 'false' || value === true || value === false;
	},
	isString: (value: unknown) => {
		return typeof value === 'string';
	},
	isArray: (value: unknown) => {
		return Array.isArray(value);
	}
};
