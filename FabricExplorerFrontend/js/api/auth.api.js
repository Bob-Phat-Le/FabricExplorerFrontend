import { call } from './client.js';
import { mocks } from '../mocks/handlers.js';

/** POST /auth/logout -> 204 */
export const logout = () => call({ method: 'POST', path: '/auth/logout' }, mocks.ok);
