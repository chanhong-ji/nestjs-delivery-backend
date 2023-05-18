import { Request, Response } from 'express';
import { User } from '../entities/users.entity';

export interface AuthContext {
    req: Request;
    res: Response;
    user: User;
}
