import * as Joi from 'joi';
import { config } from '../config/config';

export function validateJoiSchema(schema: Joi.ObjectSchema, data: any): string | null {
  const { error } = schema.validate(data, config.joiOptions);
  return error ? error.details[0].message : null;
}
