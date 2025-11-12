/**
 * IGS JSON Schema Validator using AJV
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { IGSIntent, IGSValidationResult, IGSValidationError } from '../types/igs.js';
import igsSchema from '../schemas/igs-schema.json' assert { type: 'json' };

const ajv = new Ajv({ 
  allErrors: true,
  verbose: true,
  strict: false,
  removeAdditional: false,
  validateSchema: false
});
addFormats(ajv);

const validateIGSSchema = ajv.compile(igsSchema);

export class IGSSchemaValidator {
  static validate(intent: any): IGSValidationResult {
    const errors: IGSValidationError[] = [];
    const warnings: string[] = [];

    try {
      const isValid = validateIGSSchema(intent);
      
      if (!isValid && validateIGSSchema.errors) {
        for (const ajvError of validateIGSSchema.errors) {
          errors.push({
            code: this.mapAJVErrorCode(ajvError.keyword),
            field: ajvError.instancePath || ajvError.schemaPath || 'root',
            message: this.formatAJVErrorMessage(ajvError),
            severity: 'error'
          });
        }
      }

      if (isValid || errors.length === 0) {
        this.validateBusinessLogic(intent, errors, warnings);
      }

    } catch (error) {
      errors.push({
        code: 'VALIDATION_ERROR',
        field: 'root',
        message: `Validation failed: ${error}`,
        severity: 'error'
      });
    }

    const valid = errors.filter(e => e.severity === 'error').length === 0;
    const compliance_score = this.calculateComplianceScore(intent, errors, warnings);

    return {
      valid,
      compliance_score,
      errors,
      warnings
    };
  }

  private static mapAJVErrorCode(keyword: string): string {
    const errorCodeMap: Record<string, string> = {
      'required': 'MISSING_REQUIRED_FIELD',
      'type': 'INVALID_TYPE',
      'enum': 'INVALID_ENUM_VALUE',
      'const': 'INVALID_CONSTANT_VALUE',
      'pattern': 'INVALID_PATTERN',
      'minimum': 'VALUE_TOO_SMALL',
      'maximum': 'VALUE_TOO_LARGE',
      'minLength': 'STRING_TOO_SHORT',
      'maxLength': 'STRING_TOO_LONG',
      'minItems': 'ARRAY_TOO_SHORT',
      'maxItems': 'ARRAY_TOO_LONG',
      'additionalProperties': 'ADDITIONAL_PROPERTIES_NOT_ALLOWED',
      'oneOf': 'INVALID_ONE_OF',
      'anyOf': 'INVALID_ANY_OF'
    };
    
    return errorCodeMap[keyword] || 'SCHEMA_VALIDATION_ERROR';
  }

  private static formatAJVErrorMessage(error: any): string {
    const { keyword, message, params, data } = error;
    
    switch (keyword) {
      case 'required':
        return `Missing required field: ${params?.missingProperty}`;
      case 'enum':
        return `Invalid value. Must be one of: ${params?.allowedValues?.join(', ')}`;
      case 'const':
        return `Invalid value. Must be: ${params?.allowedValue}`;
      case 'pattern':
        return `Invalid format. ${message}`;
      case 'type':
        return `Invalid type. Expected ${params?.type}, got ${typeof data}`;
      default:
        return message || `Validation error: ${keyword}`;
    }
  }

  private static validateBusinessLogic(intent: any, errors: IGSValidationError[], warnings: string[]): void {
    this.validateTiming(intent, errors, warnings);
    this.validateCrossFields(intent, errors, warnings);
    this.validateBusinessRules(intent, errors, warnings);
  }

  private static validateTiming(intent: any, errors: IGSValidationError[], warnings: string[]): void {
    const now = Date.now();
    
    if (intent.timing?.absolute_deadline && intent.timing.absolute_deadline <= now) {
      errors.push({
        code: 'EXPIRED_DEADLINE',
        field: 'timing.absolute_deadline',
        message: 'Intent deadline has already passed',
        severity: 'error'
      });
    }
    
    if (intent.constraints?.deadline && intent.timing?.absolute_deadline) {
      if (intent.constraints.deadline !== intent.timing.absolute_deadline) {
        warnings.push('Constraint deadline and timing deadline should match');
      }
    }
    
    if (intent.timing?.solver_window_ms) {
      if (intent.timing.solver_window_ms < 1000) {
        warnings.push('Solver window < 1s may be too short');
      } else if (intent.timing.solver_window_ms > 60000) {
        warnings.push('Solver window > 60s may be too long');
      }
    }
  }

  private static validateCrossFields(intent: any, errors: IGSValidationError[], warnings: string[]): void {
    const intentType = intent.intent_type;
    const operationMode = intent.operation?.mode;
    
    if (intentType === 'swap.exact_input' && operationMode !== 'exact_input') {
      warnings.push('Intent type and operation mode mismatch');
    }
    if (intentType === 'swap.exact_output' && operationMode !== 'exact_output') {
      warnings.push('Intent type and operation mode mismatch');
    }
    if (intentType?.startsWith('limit.') && operationMode !== 'limit_order') {
      warnings.push('Intent type and operation mode mismatch');
    }

    const weights = intent.preferences?.ranking_weights;
    if (weights) {
      const total = (weights.surplus_weight || 0) + 
                   (weights.gas_cost_weight || 0) + 
                   (weights.execution_speed_weight || 0) + 
                   (weights.reputation_weight || 0);
      
      if (Math.abs(total - 100) > 0.01) {
        warnings.push(`Ranking weights sum to ${total}, should sum to 100`);
      }
    }

    if (intentType?.startsWith('limit.') && !intent.constraints?.limit_price) {
      errors.push({
        code: 'MISSING_LIMIT_PRICE',
        field: 'constraints.limit_price',
        message: 'Limit price is required for limit orders',
        severity: 'error'
      });
    }
  }

  private static validateBusinessRules(intent: any, errors: IGSValidationError[], warnings: string[]): void {
    if (intent.constraints?.max_slippage_bps > 1000) {
      warnings.push('Slippage > 10% is unusually high');
    }

    if (intent.constraints?.max_gas_cost) {
      const gasAmount = parseFloat(intent.constraints.max_gas_cost.amount);
      if (gasAmount > 1) {
        warnings.push('Gas limit > 1 SUI is unusually high');
      }
    }

    const operation = intent.operation;
    if (operation) {
      switch (operation.mode) {
        case 'exact_input':
          operation.inputs?.forEach((input: any, index: number) => {
            if (input.amount?.type !== 'exact') {
              warnings.push(`Input ${index}: exact_input mode typically uses exact amounts`);
            }
          });
          break;

        case 'exact_output':
          operation.outputs?.forEach((output: any, index: number) => {
            if (output.amount?.type !== 'exact') {
              warnings.push(`Output ${index}: exact_output mode typically uses exact amounts`);
            }
          });
          break;

        case 'limit_order':
          if (intent.constraints?.limit_price && operation.expected_outcome?.market_price) {
            const limitPrice = parseFloat(intent.constraints.limit_price.price);
            const marketPrice = parseFloat(operation.expected_outcome.market_price.price);
            const priceDiff = Math.abs(limitPrice - marketPrice) / marketPrice;
            
            if (priceDiff > 0.5) {
              warnings.push('Limit price differs > 50% from market price');
            }
          }
          break;
      }
    }

    if (operation?.expected_outcome?.benchmark?.confidence < 0.7) {
      warnings.push('Low benchmark confidence may affect surplus calculation accuracy');
    }

    if (intent.timing?.solver_window_ms < 2000) {
      warnings.push('Solver window < 2s may be too short for complex operations');
    }

    if (intent.timing?.user_decision_timeout_ms > 600000) {
      warnings.push('User decision timeout > 10 minutes may be too long');
    }
  }

  private static calculateComplianceScore(
    intent: any, 
    errors: IGSValidationError[], 
    warnings: string[]
  ): number {
    let score = 100;

    const criticalErrors = errors.filter(e => e.severity === 'error').length;
    const warningErrors = errors.filter(e => e.severity === 'warning').length;
    
    score -= criticalErrors * 35;
    score -= warningErrors * 20;
    score -= warnings.length * 15;

    if (intent.metadata?.original_input?.confidence > 0.9) {
      score += 5;
    }
    
    if (intent.operation?.expected_outcome?.benchmark?.confidence > 0.9) {
      score += 5;
    }

    if (intent.preferences?.execution?.require_simulation) {
      score += 3;
    }

    return Math.max(0, Math.min(100, score));
  }
}

export function validateIGSIntent(intent: IGSIntent): IGSValidationResult {
  return IGSSchemaValidator.validate(intent);
}

export function isValidIGSIntent(obj: any): obj is IGSIntent {
  const result = IGSSchemaValidator.validate(obj);
  return result.valid;
}

export function assertValidIGSIntent(obj: any): asserts obj is IGSIntent {
  const result = IGSSchemaValidator.validate(obj);
  if (!result.valid) {
    const errorMessages = result.errors
      .filter(e => e.severity === 'error')
      .map(e => `${e.field}: ${e.message}`)
      .join(', ');
    throw new Error(`Invalid IGS Intent: ${errorMessages}`);
  }
}

export function validateIGSJSON(jsonData: unknown): IGSValidationResult {
  return IGSSchemaValidator.validate(jsonData);
}

export function parseIGSIntent(jsonString: string): { 
  intent?: IGSIntent; 
  validation: IGSValidationResult 
} {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = IGSSchemaValidator.validate(parsed);
    
    return {
      intent: validation.valid ? parsed as IGSIntent : undefined,
      validation
    };
  } catch (error) {
    return {
      validation: {
        valid: false,
        compliance_score: 0,
        errors: [{
          code: 'JSON_PARSE_ERROR',
          field: 'root',
          message: `Failed to parse JSON: ${error}`,
          severity: 'error'
        }],
        warnings: []
      }
    };
  }
}

export function getAJVValidator() {
  return validateIGSSchema;
}

export function getAJVInstance() {
  return ajv;
}
