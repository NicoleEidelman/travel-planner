import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const planSchema = Joi.object({
  city: Joi.string().min(2).required(),
  type: Joi.string().valid('bike','trek').required()
});

export const saveTripSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  description: Joi.string().allow('').max(400).default(''),
  type: Joi.string().valid('bike','trek').required(),
  coords: Joi.array().items(Joi.array().length(2).items(Joi.number())).min(2).required(),
  dayDistances: Joi.array().items(Joi.number().min(0)).min(1).required(),
  narrative: Joi.string().allow('').max(1200).default(''),
  start: Joi.object({ lat: Joi.number().required(), lon: Joi.number().required() }).required(),
  end: Joi.object({ lat: Joi.number().required(), lon: Joi.number().required() }).required(),
  // Add new optional fields for place information
  cover: Joi.string().allow('').max(500).default(''),
  placeDescription: Joi.string().allow('').max(800).default('')
});

export const tripIdSchema = Joi.object({
  tripId: Joi.string().length(24).hex().required()
});