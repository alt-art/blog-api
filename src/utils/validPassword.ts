import * as zxcvbn from 'zxcvbn';

import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsValidPassword(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'IsValidPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: string) {
          const result = zxcvbn(value);
          return result.score >= 3;
        },
        defaultMessage({ value }) {
          const result = zxcvbn(value);
          return result.feedback.warning || 'Password is too weak';
        },
      },
    });
  };
}
