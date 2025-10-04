import { Injectable, HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';
import { validateJoiSchema } from '../../../utils/joi.validator';
import { throwError } from '../../../utils/util';
import { RoleName, PermissionName } from '@prisma/client';
import { RoleFilter } from '../../../repositories/entities/role.entity';

@Injectable()
export class AdminRolesValidator {
  async validateGetRoles(query: any): Promise<RoleFilter> {
    const schema = Joi.object({
      offset: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'Offset must be a number',
        'number.integer': 'Offset must be an integer',
        'number.min': 'Offset must be 0 or greater',
      }),
      limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be 1 or greater',
        'number.max': 'Limit must be 100 or less',
      }),
      keyword: Joi.string().max(100).optional().messages({
        'string.max': 'Keyword must not exceed 100 characters',
      }),
      isActive: Joi.boolean().optional().messages({
        'boolean.base': 'isActive must be a boolean',
      }),
    });

    const error = validateJoiSchema(schema, query);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return query;
  }

  async validateCreateRole(data: any): Promise<any> {
    const schema = Joi.object({
      name: Joi.string()
        .valid(...Object.values(RoleName))
        .required()
        .messages({
          'any.only': 'Role name must be a valid role',
          'any.required': 'Role name is required',
        }),
      description: Joi.string().max(500).optional().messages({
        'string.max': 'Description must not exceed 500 characters',
      }),
      isActive: Joi.boolean().default(true).messages({
        'boolean.base': 'isActive must be a boolean',
      }),
      createdBy: Joi.number().integer().positive().optional().messages({
        'number.base': 'createdBy must be a number',
        'number.integer': 'createdBy must be an integer',
        'number.positive': 'createdBy must be positive',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateUpdateRole(data: any): Promise<any> {
    const schema = Joi.object({
      name: Joi.string()
        .valid(...Object.values(RoleName))
        .optional()
        .messages({
          'any.only': 'Role name must be a valid role',
        }),
      description: Joi.string().max(500).optional().messages({
        'string.max': 'Description must not exceed 500 characters',
      }),
      isActive: Joi.boolean().optional().messages({
        'boolean.base': 'isActive must be a boolean',
      }),
      updatedBy: Joi.number().integer().positive().optional().messages({
        'number.base': 'updatedBy must be a number',
        'number.integer': 'updatedBy must be an integer',
        'number.positive': 'updatedBy must be positive',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateAssignPermission(data: any): Promise<any> {
    const schema = Joi.object({
      permissionName: Joi.string()
        .valid(...Object.values(PermissionName))
        .required()
        .messages({
          'any.only': 'Permission name must be a valid permission',
          'any.required': 'Permission name is required',
        }),
      assignedBy: Joi.number().integer().positive().optional().messages({
        'number.base': 'assignedBy must be a number',
        'number.integer': 'assignedBy must be an integer',
        'number.positive': 'assignedBy must be positive',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateAssignRole(data: any): Promise<any> {
    const schema = Joi.object({
      roleName: Joi.string()
        .valid(...Object.values(RoleName))
        .required()
        .messages({
          'any.only': 'Role name must be a valid role',
          'any.required': 'Role name is required',
        }),
      assignedBy: Joi.number().integer().positive().optional().messages({
        'number.base': 'assignedBy must be a number',
        'number.integer': 'assignedBy must be an integer',
        'number.positive': 'assignedBy must be positive',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateGrantPermission(data: any): Promise<any> {
    const schema = Joi.object({
      permissionName: Joi.string()
        .valid(...Object.values(PermissionName))
        .required()
        .messages({
          'any.only': 'Permission name must be a valid permission',
          'any.required': 'Permission name is required',
        }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateRoleExists(roleId: number): Promise<any> {
    const schema = Joi.object({
      roleId: Joi.number().integer().positive().required().messages({
        'number.base': 'Role ID must be a number',
        'number.integer': 'Role ID must be an integer',
        'number.positive': 'Role ID must be positive',
        'any.required': 'Role ID is required',
      }),
    });

    const error = validateJoiSchema(schema, { roleId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return roleId;
  }

  async validateRoleId(id: string): Promise<number> {
    const schema = Joi.object({
      id: Joi.string().pattern(/^\d+$/).required().messages({
        'string.pattern.base': 'Role ID must be a valid number',
        'any.required': 'Role ID is required',
      }),
    });

    const error = validateJoiSchema(schema, { id });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'invalidRoleId');

    return parseInt(id);
  }

  async validatePermissionId(permissionId: string): Promise<number> {
    const schema = Joi.object({
      permissionId: Joi.string().pattern(/^\d+$/).required().messages({
        'string.pattern.base': 'Permission ID must be a valid number',
        'any.required': 'Permission ID is required',
      }),
    });

    const error = validateJoiSchema(schema, { permissionId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'invalidPermissionId');

    return parseInt(permissionId);
  }

  async validateUserId(userId: number): Promise<number> {
    const schema = Joi.object({
      userId: Joi.number().integer().positive().required().messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required',
      }),
    });

    const error = validateJoiSchema(schema, { userId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return userId;
  }

  async validatePermissionExists(permissionId: number): Promise<number> {
    const schema = Joi.object({
      permissionId: Joi.number().integer().positive().required().messages({
        'number.base': 'Permission ID must be a number',
        'number.integer': 'Permission ID must be an integer',
        'number.positive': 'Permission ID must be positive',
        'any.required': 'Permission ID is required',
      }),
    });

    const error = validateJoiSchema(schema, { permissionId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return permissionId;
  }
} 