/**
 * JSON Schema definitions for request/response validation
 * Equivalent to Python Pydantic schemas
 */

/**
 * Schema for Todo response format
 * Equivalent to Python TodoResponse
 */
export const todoResponseSchema = {
  type: 'object',
  required: ['id', 'title', 'description', 'completed'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    title: { type: 'string' },
    description: { type: 'string' },
    completed: { type: 'boolean' }
  },
  additionalProperties: false
};

/**
 * Schema for creating a new todo
 * Equivalent to Python TodoCreate
 */
export const todoCreateSchema = {
  type: 'object',
  required: ['title'],
  properties: {
    title: { 
      type: 'string', 
      minLength: 1,
      maxLength: 255
    },
    description: { 
      type: 'string',
      default: '',
      maxLength: 1000
    }
  },
  additionalProperties: false
};

/**
 * Schema for updating a todo
 * Equivalent to Python TodoUpdate
 */
export const todoUpdateSchema = {
  type: 'object',
  minProperties: 1, // At least one property must be provided
  properties: {
    title: { 
      type: 'string', 
      minLength: 1,
      maxLength: 255
    },
    description: { 
      type: 'string',
      maxLength: 1000
    },
    completed: { type: 'boolean' }
  },
  additionalProperties: false
};

/**
 * Schema for todo statistics response
 */
export const todoStatsSchema = {
  type: 'object',
  required: ['total', 'completed', 'pending'],
  properties: {
    total: { type: 'integer', minimum: 0 },
    completed: { type: 'integer', minimum: 0 },
    pending: { type: 'integer', minimum: 0 }
  },
  additionalProperties: false
};

/**
 * Schema for error responses
 */
export const errorResponseSchema = {
  type: 'object',
  required: ['error', 'message'],
  properties: {
    error: { type: 'string' },
    message: { type: 'string' }
  },
  additionalProperties: false
};

/**
 * Schema for delete success response
 */
export const deleteResponseSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string' }
  },
  additionalProperties: false
};

/**
 * Route schemas for Fastify route configuration
 * These combine request/response schemas for complete route validation
 */
export const routeSchemas = {
  // GET /api/todos
  getAllTodos: {
    response: {
      200: {
        type: 'array',
        items: todoResponseSchema
      }
    }
  },

  // GET /api/todos/:todoId
  getTodo: {
    params: {
      type: 'object',
      required: ['todoId'],
      properties: {
        todoId: { type: 'string', pattern: '^[0-9]+$' }
      }
    },
    response: {
      200: todoResponseSchema,
      404: errorResponseSchema,
      400: errorResponseSchema
    }
  },

  // POST /api/todos
  createTodo: {
    body: todoCreateSchema,
    response: {
      200: todoResponseSchema,
      400: errorResponseSchema
    }
  },

  // PUT /api/todos/:todoId
  updateTodo: {
    params: {
      type: 'object',
      required: ['todoId'],
      properties: {
        todoId: { type: 'string', pattern: '^[0-9]+$' }
      }
    },
    body: todoUpdateSchema,
    response: {
      200: todoResponseSchema,
      404: errorResponseSchema,
      400: errorResponseSchema
    }
  },

  // POST /api/todos/:todoId/toggle
  toggleTodo: {
    params: {
      type: 'object',
      required: ['todoId'],
      properties: {
        todoId: { type: 'string', pattern: '^[0-9]+$' }
      }
    },
    response: {
      200: todoResponseSchema,
      404: errorResponseSchema,
      400: errorResponseSchema
    }
  },

  // DELETE /api/todos/:todoId
  deleteTodo: {
    params: {
      type: 'object',
      required: ['todoId'],
      properties: {
        todoId: { type: 'string', pattern: '^[0-9]+$' }
      }
    },
    response: {
      200: deleteResponseSchema,
      404: errorResponseSchema,
      400: errorResponseSchema
    }
  },

  // GET /api/todos/stats
  getTodoStats: {
    response: {
      200: todoStatsSchema
    }
  },

  // GET /api/todos/filter/status
  getTodosByStatus: {
    querystring: {
      type: 'object',
      required: ['completed'],
      properties: {
        completed: { 
          type: 'string',
          enum: ['true', 'false']
        }
      }
    },
    response: {
      200: {
        type: 'array',
        items: todoResponseSchema
      },
      400: errorResponseSchema
    }
  }
};

/**
 * Validation helper functions
 */
export const validators = {
  /**
   * Validate todo ID parameter
   * @param {string} todoId - The todo ID to validate
   * @returns {number} Parsed todo ID
   * @throws {Error} If invalid
   */
  validateTodoId(todoId) {
    const id = parseInt(todoId, 10);
    if (isNaN(id) || id < 1) {
      throw new Error('Todo ID must be a positive integer');
    }
    return id;
  },

  /**
   * Validate todo creation data
   * @param {Object} data - Todo creation data
   * @returns {Object} Validated data
   * @throws {Error} If invalid
   */
  validateTodoCreate(data) {
    if (!data) {
      throw new Error('Request body is required');
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      throw new Error('Title is required and must be a non-empty string');
    }

    if (data.title.length > 255) {
      throw new Error('Title cannot exceed 255 characters');
    }

    if (data.description !== undefined) {
      if (typeof data.description !== 'string') {
        throw new Error('Description must be a string');
      }
      if (data.description.length > 1000) {
        throw new Error('Description cannot exceed 1000 characters');
      }
    }

    return {
      title: data.title.trim(),
      description: (data.description || '').trim()
    };
  },

  /**
   * Validate todo update data
   * @param {Object} data - Todo update data
   * @returns {Object} Validated data
   * @throws {Error} If invalid
   */
  validateTodoUpdate(data) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Request body is required and must contain at least one field to update');
    }

    const validatedData = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }
      if (data.title.length > 255) {
        throw new Error('Title cannot exceed 255 characters');
      }
      validatedData.title = data.title.trim();
    }

    if (data.description !== undefined) {
      if (typeof data.description !== 'string') {
        throw new Error('Description must be a string');
      }
      if (data.description.length > 1000) {
        throw new Error('Description cannot exceed 1000 characters');
      }
      validatedData.description = data.description.trim();
    }

    if (data.completed !== undefined) {
      if (typeof data.completed !== 'boolean') {
        throw new Error('Completed must be a boolean');
      }
      validatedData.completed = data.completed;
    }

    return validatedData;
  }
};