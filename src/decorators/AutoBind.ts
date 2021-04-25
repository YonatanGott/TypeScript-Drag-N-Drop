// Decorator
export function AutoBind(
	_target: any,
	_method: string,
	descriptor: PropertyDescriptor
) {
	const originalMethod = descriptor.value;
	const adjDescriptor: PropertyDescriptor = {
		configurable: true,
		get() {
			const boundFunc = originalMethod.bind(this);
			return boundFunc;
		},
	};
	return adjDescriptor;
}
