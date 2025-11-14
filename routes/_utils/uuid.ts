import { isString, isEmpty } from "lodash-es";

/**
 * UUID validation utility
 * Validates UUID v4 format
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4 format
 * @param id - The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 */
export const isValidUUID = (id: string | undefined | null): id is string => {
  return isString(id) && !isEmpty(id) && UUID_REGEX.test(id);
};
