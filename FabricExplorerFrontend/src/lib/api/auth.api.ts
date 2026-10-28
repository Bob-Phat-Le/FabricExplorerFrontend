import { call } from './client';
import { mocks } from '../mocks/handlers';

export const logout = () => call<unknown>({ method: 'POST', path: '/auth/logout' }, mocks.ok);
