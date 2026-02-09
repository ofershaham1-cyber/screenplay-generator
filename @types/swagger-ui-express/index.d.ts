import { RequestHandler } from 'express';

declare function serve(...args: any[]): RequestHandler;
declare function setup(spec: any, options?: any): RequestHandler;

export = { serve, setup };
